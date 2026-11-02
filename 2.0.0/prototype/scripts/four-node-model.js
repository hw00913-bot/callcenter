  // Four-node planning model, within the original ledger/commit closure.
  const FOUR_SCHEMA=1;
  const fourLine=(id,category)=>category?.family==='LEAD'||category?.businessFamily==='LEAD'||['lead','lxs'].includes(canonicalCategory(id));
  const fourSegments=r=>(r.rounds||[]).flatMap(stage=>stage.segments||[]);
  const fourStage=r=>r.rounds.at(-1);
  const fourRun=r=>(r.runs||[]).find(run=>run.runId===r.runId);
  const fourDirect=r=>r.handlingMode==='DIRECT'||r.mechanism==='DIRECT';
  const fourSameContext=(r,seg)=>seg.handlingMode==='DIRECT'?fourDirect(r)&&!!r.directCycleId&&r.directCycleId===seg.directCycleId:!fourDirect(r)&&!!r.runId&&r.runId===seg.runId;
  const fourCurrentSegments=r=>fourSegments(r).filter(seg=>fourSameContext(r,seg));
  const fourLast=r=>fourCurrentSegments(r).at(-1);
  const FOUR_PRODUCT_RULES=2;
  const FOUR_PURPOSES={FIRST:'首次办理',FOLLOWUP:'再次跟进',CORRECTION:'归属纠偏',RECLASSIFY:'转类办理'};
  const FOUR_OUTCOMES={UNSPECIFIED:'未设置业务结论',SUCCESS:'业务达成',UNSUCCESSFUL:'业务未达成',INVALID:'无效业务',NO_CONTACT:'未联系成功',NO_CALL:'无需联系',OTHER:'其他结论'};
  const fourPhone=value=>String(value||'').replace(/[\s()\-]/g,'').replace(/^\+86(?=1\d{10}$)/,'');
  const FOUR_EXECUTION_PRIORITIES={5:'最高',4:'高',3:'中',2:'低',1:'最低'};
  function fourExecutionPriority(value,fallback=3){requireThat(value===undefined||value===null||value===''||typeof value==='number'||typeof value==='string','EXECUTION_PRIORITY','执行优先级须为1至5整数或对应文本');const n=value===undefined||value===null||value===''?fallback:Number(value);requireThat(Number.isSafeInteger(n)&&Object.hasOwn(FOUR_EXECUTION_PRIORITIES,n),'EXECUTION_PRIORITY','执行优先级须为最高、高、中、低、最低之一');return n;}
  function fourArrangementCurrent(r){const x=r.arrangement;return !!x&&x.tenantId===r.ownerTenantId&&(fourDirect(r)?x.directCycleId===r.directCycleId:x.nodeRunId===r.nodeRunId&&x.runId===r.runId);}
  function fourManualMode(value,hasSeat=false){const mode=value===undefined||value===null||value===''?(hasSeat?'SPECIFIC_SEAT':'MANUAL'):String(value);requireThat(['MANUAL','SPECIFIC_SEAT'].includes(mode),'MANUAL_ASSIGNMENT_MODE','请选择人工分配或指定坐席');return mode;}
  function fourManualModeFor(node,selected={},input={}){return fourManualMode(input.manualAssignmentMode??selected.manualAssignmentMode??(selected.resourceId?'SPECIFIC_SEAT':node?.manualAssignmentMode));}
  function fourLegacyArrangement(r){return !!r.assignedAccountId&&r.arrangement?.arrangementSchema!==2&&!r.arrangement?.manualAssignmentMode;}
  function fourTaskPersonnel(r,a){
    if(r.fourNodeSchema!==FOUR_SCHEMA||r.ownerTenantId!==a.tenantId||!a.valid||!['ADMIN','OPERATOR'].includes(a.roleCode)||!fourArrangementCurrent(r)||!['AI','PREDICTIVE'].includes(r.arrangement.method)||!r.arrangement.resourceId||window.AppState?.canAction?.('task.create')!==true)return false;
    const context={handlingMode:fourDirect(r)?'DIRECT':'TEMPLATE',tenantId:r.ownerTenantId,brandId:r.brandId,categoryId:r.categoryId,method:r.arrangement.method,resourceId:r.arrangement.resourceId,aiSceneId:r.arrangement.aiSceneId||'',aiSourceRequirements:[]},provider=window.DFourNodeExecution;
    try{if(provider?.canUseTask)return provider.canUseTask(context)===true;const native=provider?.choices?.(context),items=native?.resources!==undefined?native.resources:window.BrandLeadStore?.resources?.(context.method)||[];return native?.ok!==false&&items.some(row=>String(row.resourceId||row.taskId||row.id)===context.resourceId&&(!row.tenantId||row.tenantId===a.tenantId)&&(!row.method||row.method===context.method)&&window.AppState?.authorizeObject?.('task.create',{...row,tenantId:a.tenantId})!==false);}catch(_){return false;}
  }
  function personnel(r,a){return (typeof fourBasePersonnel==='function'?fourBasePersonnel(r,a):a.roleCode==='ADMIN'||(['OPERATOR','AGENT'].includes(a.roleCode)&&(r.assignedAccountId===a.accountId||(r.rounds.at(-1)?.operatorAccountIds||[]).includes(a.accountId))))||r.fourNodeSchema===FOUR_SCHEMA&&r.ownerTenantId===a.tenantId&&['OPERATOR','AGENT'].includes(a.roleCode)&&fourArrangementCurrent(r)&&r.arrangement.method==='MANUAL'&&r.arrangement.resourceSnapshot?.accountId===a.accountId||fourTaskPersonnel(r,a);}
  function fourArrangementReady(r,node){if(!fourArrangementCurrent(r))return fourLegacyArrangement(r);if(node.methods[0]==='MANUAL'&&fourManualModeFor(node,r.arrangement)==='MANUAL')return false;return !!r.arrangement.resourceId||fourLegacyArrangement(r);}
  function fourPriority(r,node){return fourExecutionPriority(fourArrangementCurrent(r)?r.arrangement.executionPriority:r.executionPriorityOverride?r.executionPriority:node?.executionPriority??r.executionPriority);}
  function fourQueuedAt(r){const current=fourArrangementCurrent(r),legacy=fourLegacyArrangement(r);if(!legacy&&(!current||!r.arrangement?.resourceId))return '';return (current?r.arrangement?.queuedAt:'')||r.executionQueuedAt||r.createdAt||'';}
  function fourExecutionOrder(x,y){return fourPriority(y)-fourPriority(x)||(Date.parse(fourQueuedAt(x))||0)-(Date.parse(fourQueuedAt(y))||0)||(x.arrangement?.queueSequence||x.executionQueueSequence||0)-(y.arrangement?.queueSequence||y.executionQueueSequence||0)||String(x.recordId).localeCompare(String(y.recordId));}
  function fourNextQueueSequence(s){return Math.max(0,...(s.records||[]).map(row=>row.arrangement?.queueSequence||row.executionQueueSequence||0))+1;}
  function fourEndFollowupOriginValid(r){
    const origin=r.endFollowupOrigin,run=(r.runs||[]).find(item=>item.runId===origin?.runId),node=run?.planSnapshot?.nodes?.find(item=>item.nodeId===origin?.nodeId);
    return !!(origin&&origin.recordId===r.recordId&&origin.tenantId===r.ownerTenantId&&run?.status==='ENDED'&&run.endAction==='DIRECT_FOLLOWUP'&&run.endNodeId===origin.nodeId&&run.endedAt===origin.at&&run.endedTenantId===origin.tenantId&&node?.type==='END'&&node.endAction==='DIRECT_FOLLOWUP'&&(r.directCycles||[]).some(cycle=>cycle.directCycleId===origin.directCycleId&&cycle.source==='END_NODE'&&cycle.runId===origin.runId));
  }
  function fourCurrentEndFollowupAdmission(r){return fourEndFollowupOriginValid(r)&&r.directMethod==='MANUAL'&&r.directCycleId===r.endFollowupOrigin.directCycleId&&(r.directCycles||[]).some(cycle=>cycle.directCycleId===r.directCycleId&&cycle.method==='MANUAL'&&cycle.source==='END_NODE');}
  function fourDirectRecordValid(r){
    const fromEnd=fourEndFollowupOriginValid(r),cycles=r.directCycles;
    if(!(r.handlingMode==='DIRECT'&&r.mechanism==='DIRECT'&&['AI','MANUAL','PREDICTIVE'].includes(r.directMethod)&&['ACTIVE','COMPLETED'].includes(r.directStatus)&&typeof r.directCycleId==='string'&&r.directCycleId&&Array.isArray(cycles)&&cycles.filter(cycle=>cycle.directCycleId===r.directCycleId&&cycle.status===r.directStatus&&cycle.method===r.directMethod).length===1&&!['runId','currentRunId','templateRef','nodeId','nodeRunId','main','backup','mappings'].some(key=>Object.hasOwn(r,key))&&Array.isArray(r.rounds)&&r.rounds.length))return false;
    if(!fromEnd&&['endFollowupOrigin','runs','nodeRuns'].some(key=>Object.hasOwn(r,key)))return false;
    if(fromEnd&&(!Array.isArray(r.runs)||!r.runs.every(run=>['ENDED','ABANDONED'].includes(run.status))||!Array.isArray(r.nodeRuns)))return false;
    return r.rounds.every(stage=>Array.isArray(stage.segments)&&stage.segments.every(seg=>seg.handlingMode==='DIRECT'?cycles.some(cycle=>cycle.directCycleId===seg.directCycleId)&&!['runId','templateRef','nodeId','nodeRunId'].some(key=>Object.hasOwn(seg,key)):fromEnd&&seg.handlingMode==='TEMPLATE'&&r.runs.some(run=>run.runId===seg.runId)));
  }
  function fourMode(input={}){const mode=input.handlingMode===undefined?'TEMPLATE':input.handlingMode;requireThat(['DIRECT','TEMPLATE'].includes(mode),'HANDLING_MODE','请选择直接跟进或按模板流转');return mode;}
  function fourImportName(value,code='IMPORT_NAME'){
    requireThat(typeof value==='string',''+code,'批次名称须为1至50字文本');const name=value.trim();requireThat(name.length>0&&name.length<=50,code,'批次名称须为1至50字文本');return name;
  }
  function fourImportBusinessCode(row,label='业务编码'){
    requireThat(row&&typeof row==='object'&&!Array.isArray(row),'IMPORT_FIELDS','每行须使用准确业务字段对象');
    const keys=['code','businessCode'].filter(key=>Object.hasOwn(row,key));requireThat(keys.length>0,'IMPORT_FIELDS',label+'必填');
    requireThat(keys.every(key=>typeof row[key]==='string'),'IMPORT_FIELDS',label+'须为文本，不能转换数值或其他类型');
    const code=row[keys[0]].trim();requireThat(code,'IMPORT_FIELDS',label+'必填');requireThat(keys.every(key=>row[key].trim()===code),'IMPORT_FIELDS','业务编码存在冲突来源');return code;
  }
  function fourRequestRecordIds(kind,recordId,payload,result,state,committed){
    if(kind!=='import')return Array.isArray(payload.recordIds)?clone(payload.recordIds):undefined;
    if(!committed)return undefined;
    const rows=result?.rows,ids=Array.isArray(rows)?rows.map(row=>row.recordId):[];
    requireThat(ids.length>0&&new Set(ids).size===ids.length&&ids.every(id=>typeof id==='string'&&state.records.some(record=>record.recordId===id&&record.batchId===result.batchId&&record.ownerTenantId===result.tenantId)),'IMPORT_REQUEST_SCOPE','导入生成的业务身份无法准确关联原请求');return ids;
  }
  function fourImportChannel(input={}){const value=input.importChannel===undefined?'MANUAL':input.importChannel;requireThat(['MANUAL','API'].includes(value),'IMPORT_CHANNEL','请选择手工导入或接口传入渠道');return value;}
  function fourDirectMethod(value){requireThat(['AI','MANUAL','PREDICTIVE'].includes(value),'DIRECT_METHOD','请选择有效的直接跟进方式');return value;}
  function fourDirectConfig(brandId,categoryId,requireAllowed=true){
    const a=access(),scope={brandId,tenantId:a.tenantId,enterpriseId:tenant(a.tenantId)?.enterpriseId},cfg=CustomerBusiness.catalog(scope,canonicalCategory(categoryId));
    requireThat(cfg.ok,'CATEGORY_FIELDS',cfg.message||'当前分类与字段配置无法读取');const category=cfg.rows.find(row=>row.id===canonicalCategory(categoryId));requireThat(category&&category.enabled!==false,'CATEGORY_FIELDS','业务分类不存在或已停用');
    const fields=importSchema(brandId,category.id,cfg),definition=clone(category);for(const key of ['flowBinding','flowBindingHistory','main','backup','mappings'])delete definition[key];
    const refs=category.fields.filter(ref=>ref.enabled!==false),followupFields=refs.map(ref=>{const field=cfg.fields.find(row=>row.id===ref.fieldId&&row.enabled!==false);requireThat(field,'CATEGORY_FIELDS','当前分类填写字段未启用或不存在');return {...clone(field),required:ref.required===true};});
    return {categoryId:category.id,brandId,name:category.label,codeLabel:category.codeLabel,kind:fourLine(category.id,category)?'LEAD':'GENERAL',version:Number(category.configurationVersion||1),categoryRef:routingCategoryRef(brandId,category,cfg),fields,importSchema:clone(fields),followupFields,fieldRefs:clone(category.fields),categoryDefinition:definition,catalogRevision:cfg.revision};
  }
  function fourDirectAllowed(r){return fourDirectConfig(r.brandId,r.categoryId,false);}
  function fourDirectSpec(r,seg){return {type:'DIRECT',directCycleId:seg?.directCycleId||r.directCycleId,name:'直接跟进',methods:[seg?.method||r.directMethod],recipient:{kind:'TENANT',scope:'CURRENT'},manualAssignmentMode:r.manualAssignmentMode||r.arrangement?.manualAssignmentMode||'',_aiSourceRequirements:[]};}
  function fourHandling(s,r){return fourDirect(r)?fourDirectSpec(r):fourNode(s,r);}
  function fourFlowOnly(r){requireThat(!fourDirect(r),'DIRECT_NO_FLOW','本条业务正在直接跟进，请明确启用流程后使用模板动作');}
  function fourBusinessActive(r){return fourDirect(r)?r.directStatus==='ACTIVE':fourRun(r)?.status==='ACTIVE';}
  function fourEntryContexts(){return [{id:'OWNER_KIND',label:'当前负责方',type:'select',options:[{id:'HQ',label:'品牌总部'},{id:'STORE',label:'品牌门店'}]},{id:'PURPOSE',label:'办理目的',type:'select',options:Object.entries(FOUR_PURPOSES).map(([id,label])=>({id,label}))}];}
  function entryCatalog(brandId,categoryId){return safe(()=>{const c=routingCatalogRaw(brandId,categoryId);return {categoryRef:clone(c.categoryRef),fields:clone(c.fields.filter(f=>f.source==='IMPORT')),contexts:fourEntryContexts(),outcomes:Object.entries(FOUR_OUTCOMES).map(([id,label])=>({id,label}))};});}
  function fourEntryPlan(plan,rules){
    const catalog=clone(plan.routingCatalog),contexts=fourEntryContexts();catalog.fields=(catalog.fields||[]).filter(f=>f.source==='IMPORT').concat(contexts.map(c=>({...c,id:'__ENTRY_'+c.id,source:'IMPORT',enabled:true})));
    const converted=rules.map(row=>({edgeId:row.entryId,fromNodeId:'__ENTRY__',toNodeId:'__ENTRY_TARGET_'+row.entryId,branch:clone(row.branch),conditions:{...clone(row.conditions),rules:(row.conditions?.rules||[]).map(rule=>({...clone(rule),source:'IMPORT',fieldId:rule.source==='CONTEXT'?'__ENTRY_'+rule.fieldId:rule.fieldId}))}}));
    return {catalog,version:{routingPolicy:'FIRST_MATCH_V1',categoryRef:clone(catalog.categoryRef),startNodeId:'__ENTRY__',nodes:[{nodeId:'__ENTRY__',name:'开始',type:'START',next:rules.map(row=>'__ENTRY_TARGET_'+row.entryId)},...rules.map(row=>({nodeId:'__ENTRY_TARGET_'+row.entryId,type:'END',next:[]}))],edges:converted}};
  }
  function fourCleanEntryRules(plan,input){
    const raw=Array.isArray(input)&&input.length?input:[{entryId:'ENTRY-DEFAULT',name:'默认入口',toNodeId:plan.startNodeId,branch:{kind:'ELSE',priority:1},conditions:{enabled:false,mode:'ALL',rules:[]}}];
    requireThat(new Set(raw.map(row=>row.entryId)).size===raw.length,'ENTRY_ID','开始分支身份不能重复');
    const rules=raw.map(row=>{requireThat(row.entryId&&plan.nodes.some(n=>n.nodeId===row.toNodeId),'ENTRY_TARGET','开始分支须指定有效下一节点');const c=row.conditions||{enabled:false,mode:'ALL',rules:[]};for(const rule of c.rules||[]){requireThat(['IMPORT','CONTEXT'].includes(rule.source),'ENTRY_SOURCE','开始仅使用导入资料和业务上下文');if(rule.source==='CONTEXT')requireThat(fourEntryContexts().some(f=>f.id===rule.fieldId),'ENTRY_CONTEXT','请选择有效业务上下文');else requireThat(plan.routingCatalog.fields.some(f=>f.id===rule.fieldId&&f.source==='IMPORT'),'ENTRY_FIELD','开始条件仅能引用当前分类启用的导入字段');}return {entryId:String(row.entryId),name:String(row.name||'入口分支'),toNodeId:row.toNodeId,branch:clone(row.branch),conditions:clone(c)};});
    const synthetic=fourEntryPlan(plan,rules),checked=DFlowRouting.validate(synthetic.version,synthetic.catalog);requireThat(checked.ok,'ENTRY_INVALID',checked.issues.map(i=>i.message).join('；'));return rules;
  }
  function validateEntryRules(input){return safe(()=>{const catalog=routingCatalogRaw(input.brandId,input.categoryRef?.categoryId||input.categoryId),plan={nodes:input.nodes||[],startNodeId:input.startNodeId,routingCatalog:catalog};try{const rules=fourCleanEntryRules(plan,input.entryRules);return {ok:true,issues:[],warnings:[],entryRules:rules,startNodeId:rules.find(row=>row.branch.kind==='ELSE').toNodeId};}catch(e){return {ok:false,issues:[{code:e.code||'ENTRY_INVALID',message:e.message}],warnings:[]};}});}
  function fourThrowRouteFailure(plan,node,evaluated,settings={}){
    const fields=new Map(),pending=[],actual=new Map(),conditions=[];
    const labels={EQ:'等于',NE:'不等于',IN:'属于任一值',NOT_IN:'不属于任一值',GT:'大于',GTE:'大于等于',LT:'小于',LTE:'小于等于',IS_EMPTY:'为空',IS_NOT_EMPTY:'不为空',CONTAINS_ANY:'包含任一项',CONTAINS_ALL:'包含全部项'};
    for(const path of evaluated.edgeEvaluations||[]){
      const entry=settings.entryRules?.find(row=>row.entryId===path.edgeId),rules=entry?.conditions?.rules||path.conditions?.rules||[],descriptions=[];
      for(const rule of rules){
        const definition=rule.source==='CONTEXT'?fourEntryContexts().find(field=>field.id===rule.fieldId):plan.routingCatalog.fields.find(field=>field.id===rule.fieldId&&field.source===rule.source);
        const label=definition?.label||({CALL_STATUS:'通话状态',AI_TAG:'意向标签'}[rule.source])||rule.fieldId||'未配置字段';
        if(rule.source==='IMPORT')fields.set(rule.fieldId,{fieldId:rule.fieldId,label});
        const result=path.rules?.find(item=>item.ruleId===rule.ruleId);
        if(result?.status==='PENDING')pending.push(rule.source);
        if(rule.source==='IMPORT'&&result){const value=result.actual,shown=result.source?.state!=='KNOWN'?'未提供':value===null||value===''||Array.isArray(value)&&!value.length?'为空':'当前值为“'+(Array.isArray(value)?value:[value]).map(item=>definition?.options?.find(option=>option.id===item)?.label??String(item)).join('、')+'”';actual.set(rule.fieldId,label+(shown==='为空'?'为空':' '+shown));}
        descriptions.push(label+' '+(labels[rule.operator]||'判断待配置')+((rule.values||[]).length?' '+rule.values.map(value=>definition?.options?.find(option=>option.id===value)?.label??String(value)).join('、'):''));
      }
      if(descriptions.length){const target=plan.nodes.find(row=>row.nodeId===(entry?.toNodeId||path.toNodeId));conditions.push('到“'+(target?.name||'后续节点')+'”需'+(path.conditions?.mode==='ANY'?'满足任一：':'全部满足：')+descriptions.join(path.conditions?.mode==='ANY'?' 或 ':' 且 '));}
    }
    const needsImportData=evaluated.pending===true&&pending.length>0&&pending.every(source=>source==='IMPORT'),nonImportPending=pending.some(source=>source!=='IMPORT'),name=node.type==='START'?'开始入口':'首个转交节点“'+node.name+'”';
    const summary=[...actual.values()].join('；'),expected=conditions.length?' 条件：'+conditions.join('；')+'。':'';
    const message=nonImportPending?name+'依赖尚未产生的通话、意向或填写结果，导入资料无法补出这些结果；请将这类条件放到呼叫之后。':evaluated.pending&&!needsImportData?name+'配置暂时无法判断：'+(evaluated.edgeEvaluations?.find(path=>path.reason)?.reason||'请核对模板配置'):name+(evaluated.pending?'缺少导入依据':'未命中任何路径')+'。'+(summary?summary+'。':'')+expected+' 请按真实资料填写后重新检查；如其他情况也需接收，请在流转模板配置适用路径。';
    const error=Error(message);error.code=node.type==='START'?'ENTRY_PENDING':'INITIAL_ROUTE_PENDING';error.data={needsImportData,routingFields:[...fields.values()],initialNodeType:settings.initialNodeType||'',nodeId:node.nodeId,nodeName:node.name};throw error;
  }
  function fourEntryDecision(plan,fields,ownerTenantId,purpose='FIRST'){
    requireThat(Object.hasOwn(FOUR_PURPOSES,purpose),'RUN_PURPOSE','请选择有效办理目的');
    const rules=fourCleanEntryRules(plan,plan.entryRules),synthetic=fourEntryPlan(plan,rules),context={OWNER_KIND:bind(ownerTenantId).kind,PURPOSE:purpose};
    const values={...clone(fields||{}),__ENTRY_OWNER_KIND:context.OWNER_KIND,__ENTRY_PURPOSE:purpose},record={recordId:'ENTRY',ownerTenantId,nodeId:'__ENTRY__',nodeRunId:'ENTRY',categorySnapshot:{categoryRef:clone(plan.categoryRef)},fields:values,rounds:[{roundId:'ENTRY',tenantId:ownerTenantId,segments:[]}],execution:{state:'ended',noMoreCalls:true}},evaluated=DFlowRouting.evaluate(synthetic.version,synthetic.version.nodes[0],record,synthetic.catalog,{eligible:true}),selected=rules.find(row=>row.entryId===evaluated.selectedEdgeId);
    if(!selected)fourThrowRouteFailure(plan,{nodeId:'__ENTRY__',name:'开始入口',type:'START'},evaluated,{entryRules:rules});
    return {entryId:selected.entryId,nodeId:selected.toNodeId,purpose,ownerTenantId,context,at:now(),evaluations:clone(evaluated.edgeEvaluations)};
  }
  function fourNodeCompleted(r){return fourCurrentSegments(r).some(seg=>seg.nodeRunId===r.nodeRunId&&seg.archived===true&&seg.completedFollowup===true&&!seg.factConflict&&seg.calls?.some(call=>call.dialed===true));}
  function fourCallExitGuard(s,r){const n=fourNode(s,r);if(n.type==='PROCESS')requireThat(fourNodeCompleted(r),'CALL_REQUIRED','本呼叫节点尚未完成真实拨打及必要结果归档；无需呼叫的业务请在开始入口分流');}
  function fourCloseOutcome(r,n,actorId){
    requireThat(['DIRECT_FOLLOWUP','CLOSE'].includes(n.endAction),'END_ACTION','请选择结束后是否继续跟进');
    const run=fourRun(r),at=run.endedAt||now(),accountId=actorId||access().accountId;
    Object.assign(run,{status:'ENDED',endedAt:at,endAction:n.endAction,endNodeId:n.nodeId,endedTenantId:r.ownerTenantId});
    run.businessOutcome={code:n.endAction==='CLOSE'?'FLOW_CLOSED':'FLOW_TO_DIRECT',label:n.endAction==='CLOSE'?'业务结束不跟进':'按照无模板跟进',endAction:n.endAction,nodeId:n.nodeId,source:'END_NODE_CONFIGURATION',at,accountId};
    const nodeRun=(r.nodeRuns||[]).find(item=>item.nodeRunId===r.nodeRunId);if(nodeRun)Object.assign(nodeRun,{status:'ended',endedAt:at});
    r.businessOutcome=clone(run.businessOutcome);
    if(n.endAction==='CLOSE')return;
    const previousManual=fourLast(r)?.method==='MANUAL'?clone(fourLast(r).resourceSnapshot):null,cycleId=uid('DIRECT-CYCLE');
    (r.directCycles||=[]).push({directCycleId:cycleId,method:'MANUAL',status:'ACTIVE',startedAt:at,source:'END_NODE',runId:run.runId,nodeId:n.nodeId});
    r.endFollowupOrigin={recordId:r.recordId,runId:run.runId,nodeId:n.nodeId,tenantId:r.ownerTenantId,directCycleId:cycleId,at};
    r.handlingMode='DIRECT';r.mechanism='DIRECT';r.directMethod='MANUAL';r.directStatus='ACTIVE';r.directCycleId=cycleId;r.businessOutcome=null;r.routingFieldValues={};r.execution={state:'ended',noMoreCalls:true};
    for(const key of ['runId','currentRunId','templateRef','nodeId','nodeRunId','main','backup','mappings'])delete r[key];
    r.assignment=null;r.arrangement=null;r.assignedAccountId='';
    r.manualAssignmentMode='MANUAL';r.arrangement={arrangementSchema:2,handlingMode:'DIRECT',directCycleId:cycleId,tenantId:r.ownerTenantId,method:'MANUAL',manualAssignmentMode:'MANUAL',resourceId:'',resourceSnapshot:null,followupAccountId:'',aiSceneId:'',sceneSnapshot:null,executionPriority:fourExecutionPriority(r.executionPriority),queuedAt:'',queueSequence:0};r.assignment={type:'PENDING_MANUAL',method:'MANUAL',manualAssignmentMode:'MANUAL'};
    try{if(previousManual?.resourceId&&previousManual.accountId){const choices=fourChoices(r,fourDirectSpec(r)),target=choices.resources.find(row=>row.resourceId===previousManual.resourceId&&row.accountId===previousManual.accountId);if(choices.providerReady&&target&&choices.people.some(person=>person.accountId===target.accountId)){r.manualAssignmentMode='SPECIFIC_SEAT';r.assignedAccountId=target.accountId;r.assignment={type:'SEAT',accountId:target.accountId,name:target.name,method:'MANUAL',resourceId:target.resourceId};r.executionQueuedAt=at;r.executionQueueSequence=r.executionQueueSequence||0;Object.assign(r.arrangement,{manualAssignmentMode:'SPECIFIC_SEAT',resourceId:target.resourceId,resourceSnapshot:clone(target),followupAccountId:target.accountId,queuedAt:at,queueSequence:r.executionQueueSequence});}}}catch(_){}
    r.events.push({eventId:uid('END-DIRECT'),type:'END_DIRECT_FOLLOWUP',at,sourceRunId:run.runId,nodeId:n.nodeId,directCycleId:cycleId,tenantId:r.ownerTenantId,actorAccountId:accountId});
  }
  function fourPolicy(s,tenantId){return clone((s.contactPolicies||[]).find(p=>p.tenantId===tenantId)||{tenantId,revision:0,minimumIntervalMinutes:0,dailyDialLimit:0,categoryPriorities:[]});}
  function contactPolicyContext(){return safe(()=>{const a=access();requireThat(a.roleCode!=='SUPER_ADMIN','CONTACT_POLICY_SCOPE','请在当前业务租户查看联系协调');const s=read(),b=bind(a.tenantId);return {policy:fourPolicy(s,a.tenantId),categories:projectedCategories(s,b.brandId).map(row=>({categoryId:row.categoryId,name:row.versions?.at(-1)?.name||row.name||row.categoryId})),canManage:a.roleCode==='ADMIN',revision:fourPolicy(s,a.tenantId).revision,activeOccupancyCount:fourActiveContactCount(s,a.tenantId),constraintsActive:fourActiveContactCount(s,a.tenantId)>0||!!fourPolicy(s,a.tenantId).minimumIntervalMinutes||!!fourPolicy(s,a.tenantId).dailyDialLimit};});}
  function saveContactPolicy(input,opts={}){return commit('saveContactPolicy',null,input,opts,(s,a)=>{requireThat(a.roleCode==='ADMIN','CONTACT_POLICY_DENIED','仅当前租户管理员可维护联系协调');const prior=fourPolicy(s,a.tenantId);if(opts.expectedRevision!==undefined)requireThat(Number(opts.expectedRevision)===prior.revision,'STALE_POLICY','联系策略已变化，请重新读取');const minimumIntervalMinutes=Number(input.minimumIntervalMinutes||0),dailyDialLimit=Number(input.dailyDialLimit||0);requireThat(Number.isInteger(minimumIntervalMinutes)&&minimumIntervalMinutes>=0&&minimumIntervalMinutes<=10080&&Number.isInteger(dailyDialLimit)&&dailyDialLimit>=0&&dailyDialLimit<=1000,'CONTACT_POLICY_VALUE','联系间隔为0至10080分钟，每日上限为0至1000；0表示不开启额外限制');const categories=projectedCategories(s,bind(a.tenantId).brandId),priorities=input.categoryPriorities||[];requireThat(Array.isArray(priorities)&&new Set(priorities.map(p=>p.categoryId)).size===priorities.length,'PRIORITIES','业务优先级不能重复');for(const row of priorities)requireThat(categories.some(c=>c.categoryId===row.categoryId)&&Number.isInteger(Number(row.priority))&&Number(row.priority)>=0&&Number(row.priority)<=999,'PRIORITIES','请选择本品牌分类和0至999优先级，数值越大越先');const result={tenantId:a.tenantId,revision:prior.revision+1,minimumIntervalMinutes,dailyDialLimit,categoryPriorities:priorities.map(p=>({categoryId:p.categoryId,priority:Number(p.priority)})),updatedAt:now(),updatedBy:a.accountId};s.contactPolicies=(s.contactPolicies||[]).filter(p=>p.tenantId!==a.tenantId).concat(result);return result;});}
  function fourContactLeaseActive(r,seg){return fourSameContext(r,seg)&&(!seg.ended||!seg.retriesCompleted||r.execution?.state==='unknown'&&r.execution.followupId===seg.followupId);}
  function fourActiveContactCount(s,tenantId){return (s.records||[]).filter(r=>fourSegments(r).some(seg=>seg.tenantId===tenantId&&fourContactLeaseActive(r,seg))||(s.requests||[]).some(q=>q.status==='unknown'&&q.sourceTenantId===tenantId&&['start','startMany'].includes(q.kind)&&(q.recordId===r.recordId||q.recordIds?.includes(r.recordId)))).length;}
  function fourExternalContacts(tenantId,phone){const hook=window.DFourNodeExecution?.extraContactFacts;if(!hook)return {facts:[],active:[]};let result;try{result=hook({tenantId,phone});}catch(e){const err=Error(e.message||'专业联系事实暂时无法可靠读取');err.code='CONTACT_FACTS_PENDING';throw err;}if(Array.isArray(result))return {facts:result,active:[]};requireThat(result&&result.known!==false&&result.ok!==false&&Array.isArray(result.facts)&&Array.isArray(result.active),'CONTACT_FACTS_PENDING',result?.message||'专业联系事实目录尚未就绪，请先核对');return result;}
  function fourDialedAt(seg,call){
    if(!call.dialed)return null;if(Number.isFinite(Date.parse(call.dialedAt)))return call.dialedAt;
    for(const event of seg.events||[]){let input;try{input=JSON.parse(event.signature);}catch(_){continue;}if(input.segmentId!==seg.segmentId||input.attemptId!==call.attemptId||!(event.type==='attempt-dialed'||event.type==='attempt-start'&&input.actualDialed===true))continue;const at=event.at;if(!Number.isFinite(Date.parse(at)))continue;if(Number.isFinite(Date.parse(call.endedAt))&&Date.parse(at)>Date.parse(call.endedAt))continue;return at;}return null;
  }
  function fourFlowCallIdentity(seg,call){return call.canonicalId||[seg.handlingMode==='DIRECT'?'DIRECT':'FLOW',call.tenantId||seg.tenantId,seg.handlingMode==='DIRECT'?seg.directCycleId:call.runId||seg.runId,seg.segmentId,call.attemptId].join('|');}
  function fourCallProjection(seg,call){return {...clone(call),method:call.method||seg.method,resolvedDialedAt:fourDialedAt(seg,call)};}
  function fourContactFacts(s,tenantId,phone,external=fourExternalContacts(tenantId,phone)){
    const facts=[],seen=new Set(),add=fact=>{const id=fact.canonicalId||fact.id||fact.providerCallId||fact.callId||fact.attemptId;if(!id){facts.push({...fact,identityUnknown:true});return;}if(seen.has(id))return;seen.add(id);facts.push(fact);};
    for(const record of s.records||[])for(const stage of record.rounds||[])if(stage.tenantId===tenantId)for(const seg of stage.segments||[])for(const call of seg.calls||[])if(call.dialed&&fourPhone(call.phone||seg.basis?.importValues?.phone)===phone)add({...clone(call),canonicalId:fourFlowCallIdentity(seg,call),providerCallId:call.providerCallId||call.callId||'',queuedAt:call.startedAt,dialedAt:fourDialedAt(seg,call),startedAt:fourDialedAt(seg,call),method:seg.method});
    for(const fact of external.facts)if(fact.dialed===true&&fact.tenantId===tenantId&&fourPhone(fact.phone)===phone)add(clone(fact));return facts;
  }
  function fourExecutionTimeReady(resource){
    if(!resource?.scheduleAt)return true;let value=String(resource.scheduleAt).trim();if(value==='手工启动')return true;if(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(:\d{2})?$/.test(value))value=value.replace(' ','T')+(value.length===16?':00':'')+'+08:00';const at=Date.parse(value);return Number.isFinite(at)&&at<=Date.now();
  }
  function fourManualResourceOccupied(s,r,resource){
    if(resource?.method!=='MANUAL')return false;const id=String(resource.resourceId||resource.id||'');
    return (s.records||[]).some(other=>other.recordId!==r.recordId&&(fourSegments(other).some(seg=>seg.method==='MANUAL'&&seg.tenantId===r.ownerTenantId&&String(seg.resourceId)===id&&fourContactLeaseActive(other,seg))||other.ownerTenantId===r.ownerTenantId&&other.arrangement?.method==='MANUAL'&&other.arrangement.resourceId===id&&(s.requests||[]).some(q=>q.sourceTenantId===r.ownerTenantId&&q.status==='unknown'&&['start','startMany'].includes(q.kind)&&(q.recordId===other.recordId||q.recordIds?.includes(other.recordId)))));
  }
  function fourPriorityCandidate(s,r,tenantId){
    try{
      if(!fourBusinessActive(r)||r.ownerTenantId!==tenantId||pending(s,r.recordId))return false;if(fourDirect(r))fourDirectAllowed(r);
      const n=fourHandling(s,r);if(!['PROCESS','DIRECT'].includes(n.type)||!fourRecipientMatches(n.recipient,bind(tenantId),n)||!fourArrangementReady(r,n))return false;
      noRunning(r);previousSaved(r);contactGuard(r);
      if(fourDirect(r)&&fourCurrentSegments(r).some(seg=>seg.archived&&seg.completedFollowup))return false;
      if(!fourDirect(r)&&fourNodeCompleted(r)){const plan=templateVersion(s,r.templateRef),evaluation=DFlowRouting.evaluate(plan,n,r,plan.routingCatalog);if(evaluation.pending||evaluation.selectedEdgeId)return false;}
      const sceneId=r.arrangement?.aiSceneId||'',choices=fourChoices(r,n,sceneId);if(!choices.providerReady)return false;
      const scene=fourResolveScene(r,n,sceneId);if(scene&&r.arrangement?.sceneSnapshot?.configurationFingerprint!==scene.configurationFingerprint)return false;if(scene)fourCurrentAIImportValues(s,r,n,scene);
      const resource=fourResolveTarget(r,n,{resourceId:fourArrangementCurrent(r)?r.arrangement.resourceId||'':''},choices),snapshot=r.arrangement?.resourceSnapshot;
      if(snapshot?.configurationFingerprint&&resource.configurationFingerprint&&snapshot.configurationFingerprint!==resource.configurationFingerprint||snapshot?.configurationRevision!==undefined&&resource.configurationRevision!==undefined&&snapshot.configurationRevision!==resource.configurationRevision||!fourExecutionTimeReady(resource))return false;
      if(fourManualResourceOccupied(s,r,resource)||!fourContactCheck(s,tenantId,String(r.fields.phone||''),r.recordId,undefined,true).allowed)return false;return parent.DContactPolicy.check(tenantId,String(r.fields.phone||''),n.methods[0],{excludeRecordId:r.recordId}).allowed===true;
    }catch(_){return false;}
  }
  function fourContactCheck(s,tenantId,rawPhone,excludeRecordId,policyActor,skipPriority=false){
    const phone=fourPhone(rawPhone),a=policyActor||access(),policy=fourPolicy(s,tenantId),blocked=(code,message,extra={})=>({allowed:false,occupied:code==='CONTACT_OCCUPIED',code,message,...extra});
    for(const r of s.records||[]){if(r.recordId===excludeRecordId)continue;const active=fourSegments(r).filter(seg=>seg.tenantId===tenantId&&fourContactLeaseActive(r,seg)&&fourPhone(seg.basis?.importValues?.phone||seg.calls?.find(c=>c.phone)?.phone||r.fields?.phone)===phone);const unknown=(s.requests||[]).some(q=>q.status==='unknown'&&q.sourceTenantId===tenantId&&['start','startMany'].includes(q.kind)&&(q.recordId===r.recordId||q.recordIds?.includes(r.recordId)))&&r.ownerTenantId===tenantId&&fourPhone(r.fields?.phone)===phone;if(active.length||unknown)return blocked('CONTACT_OCCUPIED','该号码在本租户已有呼出办理或结果待核，请先完成原次执行',!a.policyOnly&&visible(r,a)?{recordId:r.recordId,businessCode:r.businessCode}:{});}
    let external;try{external=fourExternalContacts(tenantId,phone);}catch(e){return blocked('CONTACT_FACTS_PENDING',e.message);}if(external.active.some(item=>item.tenantId===tenantId&&fourPhone(item.phone)===phone))return blocked('CONTACT_OCCUPIED','该号码在本租户已有专业呼出、排队或待核执行');
    const currentRecord=(s.records||[]).find(r=>r.recordId===excludeRecordId);if(currentRecord&&!skipPriority)for(const other of s.records||[])if(other.recordId!==excludeRecordId&&other.ownerTenantId===tenantId&&fourPhone(other.fields?.phone)===phone&&fourExecutionOrder(other,currentRecord)<0&&fourPriorityCandidate(s,other,tenantId))return blocked('CONTACT_PRIORITY','该号码有更优先的已安排业务，请按执行优先级及入队先后办理',!a.policyOnly&&visible(other,a)?{recordId:other.recordId,businessCode:other.businessCode}:{});
    const facts=fourContactFacts(s,tenantId,phone,external),time=Date.now();if((policy.minimumIntervalMinutes||policy.dailyDialLimit)&&facts.some(f=>f.identityUnknown||!Number.isFinite(Date.parse(f.dialedAt||f.startedAt||f.at))))return blocked('CONTACT_FACTS_PENDING','存在实际拨打但准确身份或发生时间待核，无法确认联系频次');const valid=facts.filter(f=>Number.isFinite(Date.parse(f.dialedAt||f.startedAt||f.at))),last=Math.max(-Infinity,...valid.map(f=>Date.parse(f.dialedAt||f.startedAt||f.at)));
    if(policy.minimumIntervalMinutes&&Number.isFinite(last)&&last+policy.minimumIntervalMinutes*60000>time)return blocked('CONTACT_INTERVAL','尚未达到本租户最短联系间隔',{nextAvailableAt:new Date(last+policy.minimumIntervalMinutes*60000).toISOString()});
    const day=t=>new Date(t+8*3600000).toISOString().slice(0,10),today=valid.filter(f=>day(Date.parse(f.dialedAt||f.startedAt||f.at))===day(time));if(policy.dailyDialLimit&&today.length>=policy.dailyDialLimit)return blocked('CONTACT_DAILY_LIMIT','该号码已达到本租户当日实际拨打上限');
    return {allowed:true,occupied:false,code:'READY',message:'联系协调检查通过'};
  }
  // Shared admission reads only contact constraints, without Cloud UI rights or
  // ledger initialization/migration. An absent initialized ledger is unknown.
  function fourContactPolicyAccess(tenantId){
    const session=window.parent!==window&&window.parent?.DSession,c=session?.context(),role=session?.roleKey(c);
    requireThat(c&&c.account.enabled!==false&&c.scope.kind==='tenant'&&c.scope.id===tenantId&&c.scope.tenant?.enabled&&['hq_admin','hq_ops','store_admin','store_ops'].includes(role)&&['ai','cloud'].some(kind=>c.scope.tenant.modules?.[kind]===true&&c.scope.grant?.modules?.includes(kind)),'CONTACT_SCOPE','仅可核对当前已授权业务租户的联系范围');
    return {accountId:c.account.id,tenantId,roleCode:role.endsWith('_admin')?'ADMIN':'OPERATOR',policyOnly:true};
  }
  function fourContactPolicyLedger(){
    const marker=localStorage.getItem(KEY+':condition-first-reset-v1'),raw=localStorage.getItem(KEY);let value;
    requireThat(marker===null||marker==='3'||marker==='4','READ_FAILED','业务台账初始化标记无效');
    if(raw===null){requireThat(marker===null,'READ_FAILED','业务台账尚待核对');value=window.BusinessFlowMock?.create?.();}
    else {try{value=JSON.parse(raw);}catch(_){fail('READ_FAILED','业务台账无法读取，请保留数据后核对');}}
    requireThat(fourCurrentLedgerValid(value),'READ_FAILED','当前业务台账结构尚待核对');return value;
  }
  function contactPolicyRead(tenantId,phone){return safe(()=>{const actor=fourContactPolicyAccess(tenantId);return fourContactCheck(fourContactPolicyLedger(),tenantId,phone,undefined,actor);});}
  function contactPolicyStatus(tenantId){return safe(()=>{fourContactPolicyAccess(tenantId);const s=fourContactPolicyLedger(),p=fourPolicy(s,tenantId);return {constraintsActive:fourActiveContactCount(s,tenantId)>0||!!p.minimumIntervalMinutes||!!p.dailyDialLimit};});}
  function contactOccupancy(tenantId,phone,exclude={}){return safe(()=>{const a=access();requireThat(a.roleCode!=='SUPER_ADMIN'&&tenantId===a.tenantId,'CONTACT_SCOPE','仅核对当前租户联系范围');return fourContactCheck(read(),tenantId,phone);});}
  function fourExistingLead(s,brandId,code,excludeRecordId){const stored=(s.records||[]).find(r=>r.recordId!==excludeRecordId&&r.brandId===brandId&&r.businessCode===code&&(r.categorySnapshot?.kind==='LEAD'||r.categoryId==='LEGACY-CUSTOMER'||fourLine(r.categoryId,r.categorySnapshot?.categoryDefinition)));if(stored)return stored;const cfg=brandConfiguration(brandId);return legacyEntries().find(entry=>entry.brandId===brandId&&entry.businessCode===code&&(entry.source?.sourceKind==='BRAND_LEAD'||fourLine(entry.categoryId,cfg.rows.find(c=>c.id===entry.categoryId))));}
  function fourRecipient(value={kind:'TENANT',scope:'CURRENT'}) {
    requireThat(value&&['HQ','TENANT'].includes(value.kind),'RECIPIENT','请选择总部或品牌租户承接范围');
    if(value.kind==='HQ')return {kind:'HQ'};
    requireThat(['CURRENT','OTHER'].includes(value.scope),'RECIPIENT','请选择当前负责租户或其他租户');
    return {kind:'TENANT',scope:value.scope,...(value.tenantId?{tenantId:String(value.tenantId)}:{})};
  }
  function fourRecipientMatches(value,b,node={}) {
    if(value.kind==='HQ')return b.kind==='HQ';
    if(value.scope==='CURRENT')return !value.tenantId||value.tenantId===b.tenantId;
    if(value.tenantId)return value.tenantId===b.tenantId&&(node.type==='TRANSFER'||node._arrivedByTransfer===true);
    // A dynamic OTHER call inherits the preceding, already completed handover.
    return node.type==='TRANSFER'||node._arrivedByTransfer===true;
  }
  function templateVersion(s,ref) {
    if(ref?.runId){for(const r of s.records) {const run=(r.runs||[]).find(x=>x.runId===ref.runId);if(run){requireThat(run.planSnapshot&&run.templateId===ref.templateId,'RUN_PLAN','运行方案身份待核');return run.planSnapshot;}}fail('RUN_PLAN','原运行完整方案不存在，不能改用当前流程');}
    return fourBaseTemplateVersion(s,ref);
  }
  function fourLatestRef(s,ref){const template=s.templates.find(t=>t.templateId===ref?.templateId);requireThat(template,'TEMPLATE_MISSING','当前关联流程已不存在');return {...clone(ref),version:template.latestVersion};}
  function fourResultConsumers(plan,nodeId){return (plan?.nodes||[]).filter(node=>(node.conditionSource?.sourceNodeId||node.nodeId)===nodeId).map(node=>({node,rules:(plan.edges||[]).filter(edge=>edge.fromNodeId===node.nodeId).flatMap(edge=>edge.conditions?.rules||[]).filter(rule=>['CALL_STATUS','AI_TAG'].includes(rule.source))})).filter(item=>item.rules.length);}
  function fourAIRequirements(plan,nodeId){return fourResultConsumers(plan,nodeId).filter(item=>item.rules.some(rule=>rule.source==='AI_TAG')).map(({node,rules})=>({...clone(node.conditionSource),consumerNodeId:node.nodeId,sourceNodeId:nodeId,tagIds:[...new Set(rules.filter(rule=>rule.source==='AI_TAG').flatMap(rule=>rule.values||[]))]}));}
  function fourAIRecipient(node,tenantId){return (node._aiSourceRequirements||[]).every(requirement=>requirement.tenantId===tenantId);}
  function fourDecorateNode(plan,node){return {...clone(node),_aiSourceRequirements:fourAIRequirements(plan,node.nodeId)};}
  function fourBoundPlan(s,ref,brandId,categoryId){
    const main=fourLatestRef(s,ref),template=s.templates.find(t=>t.templateId===main.templateId),source=templateVersion(s,main);
    requireThat(!source.nodes.some(node=>node.type==='END'&&node.endAction==='DIRECT_FOLLOWUP'),'TEMPLATE_DIRECT_END','当前入口只按模板流转，请先把模板的旧直接跟进结束设置改为正常结束');
    requireThat(template.brandId===brandId&&source.categoryRef?.brandId===brandId,'BRAND_MISMATCH','流转模板与实际业务分类必须属于同一品牌');
    requireThat(!pendingTemplateRequests(s,template,[]).length,'PENDING','该流转模板的配置保存结果尚待核对，确认后才能用于新业务');
    const live=routingCatalogRaw(brandId,categoryId),cfg=brandConfiguration(brandId),category=cfg.rows.find(row=>row.id===live.categoryRef.categoryId);
    requireThat(!source.nodes.some(node=>node.type==='TRANSFER')||fourLine(category.id,category),'TRANSFER_SCOPE','包含转交节点的模板仅能绑定线索业务分类');
    const rules=[...(source.edges||[]),...(source.entryRules||[])].flatMap(edge=>edge.conditions?.rules||[]);
    for(const rule of rules)if(['IMPORT','FOLLOWUP'].includes(rule.source)){
      const original=source.routingCatalog?.fields.find(field=>field.id===rule.fieldId&&field.source===rule.source),actual=live.fields.find(field=>field.id===rule.fieldId&&field.source===rule.source&&field.enabled!==false);
      requireThat(original&&actual,'ROUTE_FIELDS','实际业务分类未启用模板条件所需的'+(rule.source==='IMPORT'?'导入':'填写')+'字段：'+(original?.label||rule.fieldId));
      requireThat(original.type===actual.type&&(!original.brandId||original.brandId===brandId)&&(!actual.brandId||actual.brandId===brandId),'ROUTE_FIELDS','实际业务分类的字段类型或品牌不符合模板条件：'+(actual.label||rule.fieldId));
    }
    const plan={...clone(source),referenceCategoryRef:clone(source.categoryRef),referenceRoutingCatalog:{categoryLabel:source.routingCatalog?.categoryLabel||source.categoryRef.categoryId},categoryRef:clone(live.categoryRef),routingCatalog:clone(live)};
    const checked=DFlowRouting.validate(plan,live);requireThat(checked.ok,'ROUTE_FIELDS','实际业务分类不满足模板条件：'+checked.issues.map(issue=>issue.message).join('；'));
    plan.entryRules=fourCleanEntryRules(plan,source.entryRules);
    return plan;
  }
  function validateRoute(input){return safe(()=>{configGuard(input.brandId);const s=read(),cfg=brandConfiguration(input.brandId),category=cfg.rows.find(row=>row.id===canonicalCategory(input.categoryId));requireThat(category,'CATEGORY_MISSING','业务分类不存在');const route=cleanRouteRaw(s,input,category,cfg.fields);return {...route,valid:true,effectivePlan:fourBoundPlan(s,route.main,input.brandId,category.id)};});}
  function validateDutyPaths(plan) {
    
    requireThat(plan.nodes.some(n=>n.nodeId===plan.startNodeId),'START_MISSING','请选择首个业务节点');
    for(const n of plan.nodes){requireThat(['PROCESS','TRANSFER','END'].includes(n.type),'NODE_INVALID','只允许转交、呼叫和结束组件');if(n.type==='PROCESS')fourRecipient(n.recipient);}
  }
  function cleanTemplate(s,input) {
    configGuard(input.brandId);
    requireThat(!input.categoryRef?.brandId||input.categoryRef.brandId===input.brandId,'BRAND_MISMATCH','流程草稿不能引用其他品牌分类');
    requireThat(String(input.name||'').trim(),'NAME_REQUIRED','请输入流程名称');
    const categoryId=input.categoryRef?.categoryId||input.categoryId;
    const catalog=routingCatalogRaw(input.brandId,categoryId),nodes=(input.nodes||[]).map(n=>{
      const type=n.type==='CALL'?'PROCESS':n.type;
      requireThat(['PROCESS','TRANSFER','END'].includes(type),'NODE_INVALID','节点类型由转交、呼叫、结束组件确定');
      const row={nodeId:String(n.nodeId||''),name:String(n.name||'').trim(),type,duty:'CURRENT',next:[...new Set(n.next||[])]};
      requireThat(row.nodeId&&row.name,'NODE_INVALID','节点名称和身份必填');
      if(type==='PROCESS'){requireThat(Array.isArray(n.methods)&&n.methods.length===1&&['AI','MANUAL','PREDICTIVE'].includes(n.methods[0]),'METHOD_SINGLE','呼叫节点只选择一种方式');row.methods=clone(n.methods);row.recipient=fourRecipient(n.recipient);row.executionPriority=fourExecutionPriority(n.executionPriority);if(row.methods[0]==='MANUAL')row.manualAssignmentMode=fourManualMode(n.manualAssignmentMode,(n.executionDefaults||[]).some(item=>item.resourceId));row.executionDefaults=fourCleanExecutionDefaults(s,input,{...n,type:'PROCESS'});}
      if(type==='END'){requireThat(n.endAction!=='DIRECT_FOLLOWUP','TEMPLATE_DIRECT_END','新模板不再配置直接跟进，请选择正常结束');requireThat(!n.endAction||n.endAction==='CLOSE','END_ACTION','请选择正常结束');row.endAction='CLOSE';delete row.duty;}
      if(type!=='END'&&n.conditionSource)row.conditionSource=clone(n.conditionSource);
      return row;
    });
    const edges=(input.edges||[]).map(edge=>({...clone(edge),...(nodes.find(n=>n.nodeId===edge.fromNodeId)?.type==='TRANSFER'?{recipient:fourRecipient(edge.recipient)}:{})}));
    const plan={name:String(input.name).trim(),startNodeId:input.startNodeId,nodes,edges,routingPolicy:'FIRST_MATCH_V1',categoryRef:clone(catalog.categoryRef),routingCatalog:clone(catalog),fourNodeSchema:FOUR_SCHEMA,productRulesVersion:FOUR_PRODUCT_RULES};
    plan.entryRules=fourCleanEntryRules(plan,input.entryRules);plan.startNodeId=plan.entryRules.find(row=>row.branch.kind==='ELSE').toNodeId;
    validateDutyPaths(plan);const checked=DFlowRouting.validate(plan,catalog,{forSave:true});requireThat(checked.ok,'ROUTING_INVALID',checked.issues?.map(x=>x.message).join('；'));
    return plan;
  }
  function cleanRoutingTemplate(s,input){return cleanTemplate(s,input);}
  function cleanRouteRaw(s,input,category,fields) {
    configGuard(input.brandId);requireThat(input.main?.templateId,'MAIN_REQUIRED','请在路由配置中选择流转模板');const main=fourLatestRef(s,input.main);
    requireThat(!input.backup&&!(input.mappings||[]).length,'SINGLE_TEMPLATE_ONLY','每个分类只关联一条流程');
    fourBoundPlan(s,main,input.brandId,category.id);
    return {main,backup:null,mappings:[]};
  }
  function fourProviderContext(r,node,method,sceneId) {const direct=node?.type==='DIRECT'||fourDirect(r);return {handlingMode:direct?'DIRECT':'TEMPLATE',directMethod:direct?method:undefined,directCycleId:direct?node.directCycleId||r.directCycleId:undefined,executionSpec:direct?clone(node):undefined,tenantId:r.ownerTenantId,brandId:r.brandId,categoryId:r.categoryId,method,accountId:access().accountId,resourceId:fourArrangementCurrent(r)?r.arrangement.resourceId||'':'',aiSceneId:sceneId||'',aiSourceRequirements:clone(node._aiSourceRequirements||fourAIRequirements(fourRun(r)?.planSnapshot,node.nodeId)),node:node?.type==='DIRECT'?null:clone(node),record:clone(r)};}
  function fourPeople(tenantId) {
    const d=window.CloudCallData||{},members=(d.memberships||[]).filter(m=>m.tenantId===tenantId&&m.status==='启用');
    return members.map(m=>{const account=(d.accounts||[]).find(a=>a.accountId===m.accountId&&a.status==='启用');return account?{accountId:account.accountId,name:account.nickname||account.name||account.accountId,roleCode:m.roleCode}:null;}).filter(Boolean);
  }
  function fourChoices(r,node,sceneId) {
    const method=['PROCESS','DIRECT'].includes(node?.type)?node.methods?.[0]:'',provider=window.DFourNodeExecution;
    const importChoices=taskBusinessImportChoices(r,node);let response=importChoices||{ok:true};if(!importChoices&&provider?.choices)response=provider.choices(fourProviderContext(r,node,method,sceneId))||{ok:false,message:'执行配置目录未准备'};
    requireThat(!response?.then,'CONFIG_PENDING','请先准备本租户执行配置目录');
    const people=(response.people||fourPeople(r.ownerTenantId)).filter(p=>p.enabled!==false&&!['停用','禁用','已停用'].includes(p.status)).map(p=>({...clone(p),accountId:p.accountId||p.id,name:p.name||p.label||p.accountId||p.id}));
    const scenes=method==='AI'?(response.scenes||response.aiScenes||[]).filter(x=>x.enabled!==false&&(!x.tenantId||x.tenantId===r.ownerTenantId)&&['MANUAL','AUTO'].includes(fourSceneImportSource(x))).map(x=>({...clone(x),id:String(x.id||x.sceneId),name:x.name||x.label||x.id})):[];
    const resources=(response.resources!==undefined?response.resources:window.BrandLeadStore?.resources?.(method)||[]).filter(row=>row.enabled!==false&&(!row.tenantId||row.tenantId===r.ownerTenantId)&&(!row.method||row.method===method)).map(row=>({...clone(row),resourceId:String(row.resourceId||row.taskId||row.seatId||row.id||''),tenantId:r.ownerTenantId,method,type:method==='MANUAL'?'SEAT':'TASK'})).filter(row=>row.resourceId);
    return {people,scenes,resources,seats:method==='MANUAL'?resources:[],tasks:method==='MANUAL'?[]:resources,unavailablePeople:clone(response.unavailablePeople||[]),providerReady:response.ok!==false,providerMessage:response.message||''};
  }
  function fourDefaultArrangement(node,tenantId){return clone((node?.executionDefaults||[]).find(item=>item.tenantId===tenantId&&(!item.method||item.method===node.methods?.[0]))||{});}
  function fourResolveTarget(r,node,input={},choices=fourChoices(r,node,input.aiSceneId)){
    const requested=String(input.resourceId||''),available=choices.resources.filter(row=>!input.resourceId||row.resourceId===requested);
    requireThat(available.length===1,'RESOURCE_INVALID',requested?'指定任务或坐席已失效、不属于本租户或不适配本次呼叫方式':available.length?'请选择具体任务或坐席，不能自动选择多个候选中的首项':'当前租户没有本方式可用的具体任务或坐席');
    const resource=available[0];requireThat(resource.tenantId===r.ownerTenantId&&resource.method===node.methods[0],'RESOURCE_INVALID','执行目标必须属于当前负责租户及呼叫方式');return resource;
  }
  function fourCleanExecutionDefaults(s,input,node){
    const raw=node.executionDefaults||[];requireThat(Array.isArray(raw)&&new Set(raw.map(row=>row?.tenantId)).size===raw.length,'EXECUTION_DEFAULTS','每个承接租户只可配置一份节点默认安排');
    const actor=access(),old=s.templates.find(row=>row.templateId===input.templateId),priorNode=(old?.versions||[]).at(-1)?.nodes?.find(row=>row.nodeId===node.nodeId),prior=priorNode?.executionDefaults||[];
    const normalize=(row,fallback)=>{const method=String(row.method||fallback||'');return {tenantId:String(row.tenantId),resourceId:String(row.resourceId||''),accountId:String(row.accountId||row.followupAccountId||''),aiSceneId:String(row.aiSceneId||''),method,manualAssignmentMode:method==='MANUAL'?fourManualMode(row.manualAssignmentMode,!!row.resourceId):''};};
    const equal=(x,y)=>['tenantId','resourceId','accountId','aiSceneId','method','manualAssignmentMode'].every(key=>x[key]===y[key]);
    if(priorNode?.methods?.[0]===node.methods[0])for(const previous of prior.filter(row=>row.tenantId!==actor.tenantId))requireThat(raw.some(row=>row?.tenantId===previous.tenantId&&equal(normalize(row,priorNode.methods[0]),normalize(previous,priorNode.methods[0]))),'EXECUTION_DEFAULT_SCOPE','不能删除或修改其他承接租户的节点默认安排');
    return raw.map(row=>{requireThat(row&&bindings().some(b=>b.known&&b.brandId===input.brandId&&b.tenantId===row.tenantId),'EXECUTION_DEFAULT_TENANT','默认执行安排须关联本品牌有效租户');
      if(row.tenantId!==actor.tenantId){const previous=prior.find(item=>equal(normalize(item,priorNode?.methods?.[0]),normalize(row,priorNode?.methods?.[0])));requireThat(previous,'EXECUTION_DEFAULT_SCOPE','仅能维护当前有权租户的具体任务或坐席默认安排');return clone(previous);}
      const method=node.methods[0];requireThat(!row.method||row.method===method,'EXECUTION_DEFAULT_METHOD','默认任务或坐席与节点呼叫方式不一致');
      const cleaned={tenantId:String(row.tenantId),resourceId:String(row.resourceId||''),aiSceneId:method==='AI'?String(row.aiSceneId||''):'',method};
      if(method==='MANUAL'){cleaned.manualAssignmentMode=fourManualModeFor(node,row);if(cleaned.manualAssignmentMode==='MANUAL'){cleaned.resourceId='';return cleaned;}}
      requireThat(cleaned.resourceId,'RESOURCE_INVALID',method==='MANUAL'?'指定坐席时请选择当前租户有效坐席':'请选择当前租户有效的具体任务');const mock={brandId:input.brandId,categoryId:input.categoryRef?.categoryId||input.categoryId,ownerTenantId:row.tenantId,arrangement:null},choices=fourChoices(mock,node,cleaned.aiSceneId),target=fourResolveTarget(mock,node,cleaned,choices);
      if(method==='MANUAL'){requireThat(target.accountId&&choices.people.some(person=>person.accountId===target.accountId),'MANUAL_HANDLER','所选坐席缺少唯一有效承接账号');cleaned.accountId=target.accountId;}
      if(method==='AI')fourResolveScene(mock,node,cleaned.aiSceneId);return cleaned;
    });
  }
  function fourExecutionGroup(r,node,count=0){
    const defaultArrangement=fourDefaultArrangement(node,r.ownerTenantId),choices=fourChoices(r,node,defaultArrangement.aiSceneId||r.arrangement?.aiSceneId);
    return {nodeId:node.type==='DIRECT'?'DIRECT':node.nodeId,nodeName:node.name||'直接跟进',method:node.methods?.[0]||'',tenantId:r.ownerTenantId,count,people:clone(choices.people),accounts:clone(choices.people),resources:clone(choices.resources),seats:clone(choices.seats),tasks:clone(choices.tasks),aiScenes:clone(choices.scenes),defaultArrangement,executionPriority:fourExecutionPriority(node.executionPriority),manualAssignmentMode:node.methods?.[0]==='MANUAL'?fourManualModeFor(node,defaultArrangement):undefined,ready:choices.providerReady,issues:choices.providerReady?[]:[choices.providerMessage]};
  }
  function enter(s,r,ref,nodeId,type,at=now()){
    const previous=clone(r.arrangement),previousOwner=r.ownerTenantId,previousRun=r.runId;
    fourBaseEnter(s,r,ref,nodeId,type,at);
    if(!r.fourNodeSchema||fourDirect(r)||access().tenantId!==r.ownerTenantId)return;
    const node=fourNode(s,r);if(node.type!=='PROCESS')return;
    const method=node.methods[0],priority=fourPriority(r,node),defaults=fourDefaultArrangement(node,r.ownerTenantId),manualAssignmentMode=method==='MANUAL'?fourManualModeFor(node,defaults):'';
    r.assignedAccountId='';r.manualAssignmentMode=manualAssignmentMode;r.assignment=method==='MANUAL'?{type:'PENDING_MANUAL',method,manualAssignmentMode}:null;r.executionPriority=priority;r.executionQueuedAt='';r.executionQueueSequence=0;
    r.arrangement={arrangementSchema:2,handlingMode:'TEMPLATE',runId:r.runId,nodeRunId:r.nodeRunId,tenantId:r.ownerTenantId,method,...(method==='MANUAL'?{manualAssignmentMode}:{}),resourceId:'',resourceSnapshot:null,followupAccountId:'',aiSceneId:'',sceneSnapshot:null,executionPriority:priority,queuedAt:'',queueSequence:0};
    // An explicitly manual-allocation node starts pending even if an earlier
    // node had a seat. Older captured nodes without a strategy keep their old
    // lawful same-tenant continuation; new SPECIFIC_SEAT nodes may reuse it.
    if(method==='MANUAL'&&node.manualAssignmentMode==='MANUAL')return;
    if(!previous?.resourceId||previous.tenantId!==previousOwner||previousOwner!==r.ownerTenantId||previous.runId!==previousRun||previousRun!==r.runId||method!==previous.method)return;
    try{
      if(defaults.resourceId&&defaults.resourceId!==previous.resourceId)return;
      const scene=fourResolveScene(r,node,previous.aiSceneId||''),choices=fourChoices(r,node,scene?.id),resource=fourResolveTarget(r,node,{resourceId:previous.resourceId,aiSceneId:scene?.id},choices);
      if(method==='MANUAL'&&(!resource.accountId||!choices.people.some(person=>person.accountId===resource.accountId)))return;
      const accountId=method==='MANUAL'?resource.accountId:'',queueSequence=fourNextQueueSequence(s);
      r.assignedAccountId=accountId;r.manualAssignmentMode=method==='MANUAL'?'SPECIFIC_SEAT':'';r.assignment={type:method==='MANUAL'?'SEAT':'TASK',accountId,resourceId:resource.resourceId,name:resource.name,method};r.executionPriority=priority;r.executionQueuedAt=at;r.executionQueueSequence=queueSequence;
      r.arrangement={arrangementSchema:2,handlingMode:'TEMPLATE',runId:r.runId,nodeRunId:r.nodeRunId,tenantId:r.ownerTenantId,method,...(method==='MANUAL'?{manualAssignmentMode:'SPECIFIC_SEAT'}:{}),resourceId:resource.resourceId,resourceSnapshot:clone(resource),followupAccountId:accountId,aiSceneId:scene?.id||'',sceneSnapshot:clone(scene),executionPriority:priority,queuedAt:at,queueSequence};
    }catch(_){}
  }
  function fourActive(s,id,opts={}) {
    const r=current(s,id,opts);requireThat(r.fourNodeSchema===FOUR_SCHEMA,'PLANNING_RECORD','业务记录结构不符合当前四节点规范');
    if(fourDirect(r))fourDirectAllowed(r);requireThat(fourBusinessActive(r),'RUN_CLOSED','本次运行已结束、废弃或正在废弃，不能产生新安排');return r;
  }
  function fourOwned(s,id,opts={}){const r=recordById(s,id),a=access();requireThat(r.fourNodeSchema&&a.roleCode!=='SUPER_ADMIN'&&a.tenantId===r.ownerTenantId&&visible(r,a),'BUSINESS_DENIED','没有当前负责业务的办理范围');if(opts.expectedRevision!==undefined)requireThat(Number(opts.expectedRevision)===r.revision,'STALE','业务已变化，请重新读取');return r;}
  function fourHasHandover(r){const stage=fourStage(r),entry=stage?.entryTransfer;return !!(entry&&entry.runId===r.runId&&entry.roundId===stage.roundId&&entry.targetTenantId===r.ownerTenantId||(r.events||[]).some(event=>event.type==='TRANSFER'&&event.runId===r.runId&&event.roundId===stage?.roundId&&event.targetTenantId===r.ownerTenantId)||r.arrival?.type==='TRANSFER'&&r.arrival.runId===r.runId&&r.arrival.targetTenantId===r.ownerTenantId);}
  function fourNode(s,r){fourFlowOnly(r);const plan=templateVersion(s,r.templateRef),n=fourDecorateNode(plan,nodeOf(s,r.templateRef,r.nodeId));n._arrivedByTransfer=fourHasHandover(r);return n;}
  function nodeGuard(s,r,types){const n=fourNode(s,r);requireThat(types.includes(n.type)&&dutyMatches(n,bind(r.ownerTenantId)),'NODE_ACTION','当前节点职责或类型不允许本次操作');return n;}
  function noRunning(r){requireThat(r.execution?.state==='ended'&&r.execution.noMoreCalls===true&&!fourSegments(r).some(seg=>seg.factConflict)&&!fourCurrentSegments(r).some(seg=>!seg.ended||!seg.retriesCompleted||seg.factConflict||seg.calls?.some(call=>call.state!=='ENDED')),'EXECUTION_ACTIVE','本次执行、排队、重试或终态尚未明确');}
  function previousSaved(r){const seg=fourLast(r);requireThat(!seg||seg.archived===true,'PREVIOUS_UNSAVED','本次跟进所需内容、终态或重试收敛尚未明确');}
  function fourLatestBasis(r,verifyPlan=true) {
    const scope={brandId:r.brandId,tenantId:r.ownerTenantId,enterpriseId:tenant(r.ownerTenantId)?.enterpriseId},cfg=CustomerBusiness.catalog(scope),category=cfg.rows?.find(c=>c.id===r.categoryId);
    requireThat(cfg.ok&&category,'CATEGORY_FIELDS','当前业务分类或有权字段无法读取');
    const fields=category.fields.filter(ref=>ref.enabled!==false).map(ref=>{const f=cfg.fields.find(f=>f.id===ref.fieldId&&f.enabled!==false);return f?{...clone(f),required:ref.required===true}:null;}).filter(Boolean);
    const plan=fourRun(r)?.planSnapshot||{};
    const requiredIds=new Set((plan.edges||[]).flatMap(edge=>edge.conditions?.rules||[]).filter(rule=>rule.source==='FOLLOWUP').map(rule=>rule.fieldId));
    for(const fixed of plan.routingCatalog?.fields||[])if(verifyPlan&&fixed.source==='FOLLOWUP'&&requiredIds.has(fixed.id)){const actual=fields.find(f=>f.id===fixed.id);requireThat(actual&&actual.type===fixed.type,'FIELD_MEANING','原流程所需字段已停用或含义不兼容，请补齐原方案条件或废弃');}
    const imported=CustomerBusiness.importSchema(r.categoryId,scope);requireThat(imported.ok,'IMPORT_FIELDS',imported.message);
    const importFields=[...r.categorySnapshot.fields.filter(f=>!f.fieldId).map(f=>({...clone(f),id:f.key,source:'IMPORT'})),...imported.fields.map(f=>({...clone(f),key:f.id,fieldId:f.id,source:'IMPORT'}))];
    const definitionIds=new Set([...(category.fields||[]),...(category.importFields||[])].map(ref=>ref.fieldId)),queue=[...definitionIds];
    while(queue.length){const definition=cfg.fields.find(f=>f.id===queue.shift());for(const dependency of definition?CustomerBusiness.activeDependencies(definition):[])if(!definitionIds.has(dependency)){definitionIds.add(dependency);queue.push(dependency);}}
    const fieldDefinitions=cfg.fields.filter(f=>definitionIds.has(f.id)).map(clone);
    const capturedCategory=clone(category);if(fourDirect(r))for(const key of ['flowBinding','flowBindingHistory','main','backup','mappings'])delete capturedCategory[key];
    return {capturedAt:now(),recordId:r.recordId,runId:r.runId,stageId:fourStage(r).roundId,nodeId:r.nodeId,nodeRunId:r.nodeRunId,ownerTenantId:r.ownerTenantId,revision:r.revision,category:capturedCategory,fields,fieldDefinitions,importFields,importValues:clone(r.fields),values:clone(r.followupValues||{}),catalogRevision:cfg.revision};
  }
  function fourSegmentCategory(r,seg){const plan=(r.runs||[]).find(run=>run.runId===seg.runId)?.planSnapshot,ids=[seg.basis?.category?.id,seg.formSchema?.category?.id,plan?.categoryRef?.categoryId].filter(Boolean);requireThat(ids.length&&ids.every(id=>canonicalCategory(id)===canonicalCategory(ids[0])),'FOLLOWUP_CATEGORY','原跟进分类身份待核，不能使用当前分类替代');return ids[0];}
  function fourFormDefinitions(basis){requireThat(Array.isArray(basis.fieldDefinitions),'FOLLOWUP_FIELDS','本次跟进字段快照不完整');return clone(basis.fieldDefinitions);}
  function snapshotForSegment(s,r){const basis=fourLatestBasis(r);return {category:clone(basis.category),fields:fourFormDefinitions(basis),revision:basis.catalogRevision,basis};}
  function fourResolveScene(r,node,sceneId) {
    const choices=fourChoices(r,node,sceneId);if(node.methods?.[0]!=='AI')return null;
    requireThat(sceneId,'AI_SCENE_REQUIRED','AI呼叫须在导入与分配选定本租户场景');
    const scene=choices.scenes.find(x=>x.id===String(sceneId));requireThat(scene,'AI_SCENE_INVALID',choices.providerMessage||'场景无权、停用或与本次分类/节点不适配');
    for(const required of node._aiSourceRequirements||[]){const live=scene.aiContexts?.find(context=>context.brandId===r.brandId&&context.categoryId===r.categoryId&&context.tenantId===r.ownerTenantId&&['supplierId','tenantId','tenantType','tagSceneId','revision'].every(key=>context[key]===required[key]));requireThat(live&&(required.tagIds||[]).every(id=>live.tags?.some(tag=>tag.id===id&&tag.enabled!==false)),'AI_TAG_CONTEXT_CHANGED','本次流程依赖的AI意向标签配置已变化或与执行租户不符，请核对流程与场景后重新办理');}return scene;
  }
  function fourFirstCall(s,config,fields,ownerTenantId,purpose='FIRST') {
    const plan=fourBoundPlan(s,config.main,config.brandId||config.categoryRef?.brandId,config.categoryId||config.categoryRef?.categoryId);requireThat(plan.fourNodeSchema,'FOUR_NODE_REQUIRED','新业务须先配置四节点流程');
    const entryDecision=fourEntryDecision(plan,fields,ownerTenantId,purpose),initial=plan.nodes.find(n=>n.nodeId===entryDecision.nodeId);let n=initial,guard=0,arrived=false,pendingTargets=[];
    while(n&&++guard<=plan.nodes.length){if(n.type==='PROCESS'){n=fourDecorateNode(plan,n);requireThat(!n._aiSourceRequirements.length||(ownerTenantId?fourAIRecipient(n,ownerTenantId):pendingTargets.some(target=>fourAIRecipient(n,target.tenantId))),'AI_TARGET_CONTEXT','首次呼叫及后续流转所需的AI标签配置与实际承接租户不符');if(ownerTenantId)requireThat(fourRecipientMatches(n.recipient,bind(ownerTenantId),{...n,_arrivedByTransfer:arrived}),'INITIAL_RECIPIENT','本次入口或后继呼叫范围不适用于实际承接租户');else requireThat(pendingTargets.some(t=>fourRecipientMatches(n.recipient,bind(t.tenantId),{...n,_arrivedByTransfer:true})),'INITIAL_RECIPIENT','待指定目标中没有适用后继呼叫范围的合法租户');return {method:n.methods[0],node:n,initialNodeType:initial.type,requiresAIScene:initial.type==='PROCESS'&&n.methods[0]==='AI',entryDecision};}if(n.type==='END')return {method:'NONE',node:n,initialNodeType:initial.type,requiresAIScene:false,entryDecision};
      const pseudo={_previewPlan:plan,recordId:'PREVIEW',categoryId:config.categoryId,brandId:config.brandId,ownerTenantId,nodeId:n.nodeId,nodeRunId:'PREVIEW',categorySnapshot:{categoryRef:plan.categoryRef,kind:fourLine(config.categoryId,config.categoryDefinition)?'LEAD':'GENERAL'},fields:fields||{},rounds:[{roundId:'PREVIEW',tenantId:ownerTenantId,segments:[]}],execution:{state:'ended',noMoreCalls:true}};
      const evaluated=DFlowRouting.evaluate(plan,n,pseudo,plan.routingCatalog,{eligible:true}),edge=plan.edges.find(e=>e.edgeId===evaluated?.selectedEdgeId);
      if(!edge)fourThrowRouteFailure(plan,n,evaluated,{initialNodeType:initial.type});
      const recipient=fourRecipient(edge.recipient),destination=destinationRaw(s,pseudo);
      if(destination?.status==='UNASSIGNED'&&!recipient.tenantId){requireThat(recipient.kind!=='HQ'&&bind(ownerTenantId).kind==='HQ'&&bindings().some(b=>b.brandId===config.brandId&&b.kind==='STORE'&&tenantValid(b.tenantId)),'INITIAL_TARGET','入口没有合法可指派目标');pendingTargets=destination.candidates||[];ownerTenantId=null;}
      else ownerTenantId=fourTransferTarget(s,pseudo,edge).tenantId;
      arrived=arrived||!fourIsLocalPath(edge);n=plan.nodes.find(x=>x.nodeId===edge.toNodeId);
      if(!ownerTenantId&&n?.type==='TRANSFER')fail('INITIAL_TARGET','连续转交的首个目标尚未明确，须先解决合法入口');
    }fail('INITIAL_ROUTE','首次路径无法确定');
  }
  function fourImportContextBase(categoryId,options={}){return safe(()=>{
    const mode=fourMode(options),a=access(),b=bind(a.tenantId),direct=fourDirectConfig(b.brandId,categoryId,false),method=options.directMethod||'';if(mode==='DIRECT'){if(method)fourDirectMethod(method);const issues=[];if(!method)issues.push('请选择直接跟进方式');const mock={handlingMode:'DIRECT',directMethod:method,recordId:'IMPORT',ownerTenantId:a.tenantId,brandId:b.brandId,categoryId:direct.categoryId};let scenes=[],executionGroups=[];try{if(method){const node=fourDirectSpec(mock);scenes=fourChoices(mock,node).scenes;executionGroups=[fourExecutionGroup(mock,node)];}}catch(e){issues.push(e.message);}return {executionGroups,...clone(direct),handlingMode:mode,directMethod:method,method,requiresAIScene:method==='AI',mayRequireAIScene:method==='AI',aiScenes:scenes,issues,guidance:'直接跟进按当前方式办理，不创建模板运行。',routingFields:[],routingByRow:false,initialNodeType:'',firstCallNodeName:''};}
    let templateContext;try{templateContext=fourTemplateImportContext(categoryId);}catch(e){templateContext={categoryId:direct.categoryId,brandId:direct.brandId,name:direct.name,codeLabel:direct.codeLabel,fields:clone(direct.fields),importSchema:clone(direct.fields),issues:[e.message],aiScenes:[]};}return {...templateContext,handlingMode:mode};
  });}
  function fourTemplateImportContext(categoryId){
    const a=access(),state=read(),{category,config}=categoryVersion(state,categoryId),plan=fourBoundPlan(state,config.main,category.brandId,category.categoryId);let next,issues=[],guidance='',routingFields=[],routingByRow=false,initialNodeType='';try{next=fourFirstCall(state,{...config,categoryId:category.categoryId,brandId:category.brandId},{},a.tenantId);}catch(e){if(e.data?.needsImportData){routingByRow=true;routingFields=clone(e.data.routingFields);initialNodeType=e.data.initialNodeType;guidance='处理路径和外呼方式需按每行导入资料判断。参与分流字段：'+routingFields.map(field=>field.label).join('、')+'。请按真实资料填写后点击“检查名单”。';}else issues.push(e.message);}
    const candidates=[...new Set((plan.entryRules||[{toNodeId:plan.startNodeId}]).map(row=>row.toNodeId))].map(id=>plan.nodes.find(n=>n.nodeId===id)).filter(Boolean).map(node=>fourDecorateNode(plan,node)).filter(n=>n?.type==='PROCESS'&&n.methods?.[0]==='AI'&&fourRecipientMatches(n.recipient,bind(a.tenantId),n)),mock={recordId:'IMPORT',ownerTenantId:a.tenantId,brandId:category.brandId,categoryId:category.categoryId};
    const scenes=[...new Map(candidates.flatMap(n=>fourChoices(mock,n).scenes).map(scene=>[scene.id,scene])).values()],executionGroups=plan.nodes.filter(n=>n.type==='PROCESS'&&fourRecipientMatches(n.recipient,bind(a.tenantId),n)).map(n=>fourExecutionGroup(mock,fourDecorateNode(plan,n)));return {executionGroups,categoryId:category.categoryId,brandId:category.brandId,name:config.name,codeLabel:config.codeLabel,fields:clone(config.fields),importSchema:clone(config.fields),method:next?.method||'',requiresAIScene:!!next?.requiresAIScene,mayRequireAIScene:candidates.length>0,aiScenes:scenes,issues,guidance,routingFields,routingByRow,initialNodeType:next?.initialNodeType||initialNodeType,firstCallNodeName:next?.node?.name||'',entryDecision:clone(next?.entryDecision)};
  }

  function fourSceneImportSource(scene){
    if(window.DAISceneImportSource?.mode)return window.DAISceneImportSource.mode(scene);
    const legacy={'手动导入':'MANUAL','自动传入':'AUTO','接口传入':'AUTO'},canonical=scene?.dataImportSource,old=scene?.importType;
    if(canonical!==undefined&&(!['MANUAL','AUTO'].includes(canonical)||old&&legacy[old]!==canonical))return 'UNKNOWN';return canonical||legacy[old]||'UNKNOWN';
  }
  function fourImportCore(config){return [{id:'code',key:'code',businessKey:'code',label:config.codeLabel||'业务编码',type:'text',required:true,source:'SYSTEM'},...config.fields.filter(field=>['name','phone'].includes(field.key)).map(clone)];}
  function fourImportEmpty(value){return value===undefined||value===null||typeof value==='string'&&!value.trim()||Array.isArray(value)&&!value.length;}
  function fourImportRoutingFields(plan,config){
    const ids=new Set([...(plan?.edges||[]),...(plan?.entryRules||[])].flatMap(edge=>edge.conditions?.rules||[]).filter(rule=>rule.source==='IMPORT').map(rule=>rule.fieldId));
    return config.fields.filter(field=>[field.key,field.fieldId,field.id,field.businessKey].some(id=>ids.has(id))).map(clone);
  }
  function fourSelectedImportScene(input,node,row={}){
    const key=node.type==='DIRECT'?'DIRECT':node.nodeId,override=(input.executionArrangements||[]).find(item=>item.nodeId===key),defaults=fourDefaultArrangement(node,access().tenantId);
    for(const source of [override,row,input,defaults])if(source&&Object.hasOwn(source,'aiSceneId'))return String(source.aiSceneId||'');return '';
  }
  function fourAIImportDefinition(config,record,node,sceneId){
    const scene=fourResolveScene(record,node,sceneId),source=fourSceneImportSource(scene),fullFields=[{id:'code',key:'code',businessKey:'code',label:config.codeLabel||'业务编码',type:'text',required:true,source:'SYSTEM'},...clone(config.fields)],fn=window.DFourNodeExecution?.validateTaskImportParameters;
    requireThat(fn,'AI_IMPORT_PARAMETERS','当前AI场景传入字段尚未准备，请重新读取');
    const spec={method:'AI',taskId:record.arrangement?.resourceId||record.taskImportSource?.taskId||'',aiSceneId:scene.id,categoryId:config.categoryId,dataImportSource:source,handlingMode:node.type==='DIRECT'?'DIRECT':'TEMPLATE',entrySourceKind:record.taskImportSource?'TASK':'CATEGORY',importChannel:node.type==='DIRECT'?(source==='AUTO'?'API':'MANUAL'):record.importChannel||record.entrySource?.importChannel||'MANUAL'},review=fn(spec,fullFields);
    requireThat(review&&!review.then&&review.ok===true&&typeof review.fingerprint==='string'&&review.fingerprint,'AI_IMPORT_PARAMETERS',review?.message||'AI场景传入字段或供应商协议待核');
    const references=new Set((review.mappings||[]).filter(row=>row.source!=='CUSTOM_COLUMN').map(row=>row.fieldId)),businessFields=(review.businessFields||fullFields.filter(field=>['code','name','phone'].includes(field.key)||references.has(field.fieldId||field.id||field.key))).map(field=>({...clone(field),required:['code','name','phone'].includes(field.key)||field.required===true||(review.mappings||[]).some(row=>row.source!=='CUSTOM_COLUMN'&&row.fieldId===(field.fieldId||field.id||field.key)&&row.required)}));
    return {scene:clone(scene),spec,fullFields,businessFields,customFields:clone(review.customFields||[]),review:clone(review)};
  }
  function fourImportSchemaState(s,categoryId,input={},base){
    const mode=fourMode(input),a=access(),b=bind(a.tenantId),config=mode==='DIRECT'?fourDirectConfig(b.brandId,categoryId,false):{...clone(categoryVersion(s,categoryId).config),categoryId:canonicalCategory(categoryId),brandId:b.brandId};
    base=base||(()=>{const ret=fourImportContextBase(categoryId,input);requireThat(ret.status==='success','IMPORT_CONTEXT',ret.message);return ret.data;})();
    const plan=mode==='TEMPLATE'?fourBoundPlan(s,config.main,b.brandId,config.categoryId):null,routingFields=fourImportRoutingFields(plan,config),core=fourImportCore(config),discovery=new Map([...core,...routingFields].map(field=>[field.key,field])),mock={handlingMode:mode,directMethod:input.directMethod,taskImportSource:input.taskImportSource,importChannel:fourImportChannel(input),recordId:'IMPORT',ownerTenantId:a.tenantId,brandId:b.brandId,categoryId:config.categoryId},groups=new Map(),rowPlans=[],issues=[],rows=Array.isArray(input.rows)?input.rows:[];
    taskBusinessAttachImportRecord(mock,input);
    let needsGroupDiscovery=false;
    const addFirst=(first,index)=>{const key=['PROCESS','DIRECT'].includes(first.initialNodeType)?first.node.type==='DIRECT'?'DIRECT':first.node.nodeId:'NO_CALL';if(key!=='NO_CALL'){if(!groups.has(key))groups.set(key,{...fourExecutionGroup(mock,first.node),_node:first.node,count:0});groups.get(key).count++;}rowPlans.push({index,first,key});};
    if(mode==='DIRECT'&&!input.directMethod){issues.push('请选择直接跟进方式');needsGroupDiscovery=false;}
    else if(rows.length){
      for(let index=0;index<rows.length;index++)try{const normalized=fourNormalizeNewImportFields({...config,fields:[...discovery.values()].filter(field=>field.key!=='code')},rows[index].fields||{});requireThat(!normalized.error,'IMPORT_FIELDS',normalized.error);const first=mode==='DIRECT'?{method:fourDirectMethod(input.directMethod),node:fourDirectSpec(mock),initialNodeType:'DIRECT',requiresAIScene:input.directMethod==='AI'}:fourFirstCall(s,config,normalized.fields,a.tenantId);addFirst(first,index);}catch(error){rowPlans.push({index,error:{code:error.code,message:error.message}});}
    }else try{const first=mode==='DIRECT'?{method:fourDirectMethod(input.directMethod),node:fourDirectSpec(mock),initialNodeType:'DIRECT',requiresAIScene:input.directMethod==='AI'}:fourFirstCall(s,config,{},a.tenantId);addFirst(first,-1);}catch(error){if(error.data?.needsImportData){needsGroupDiscovery=true;}else issues.push(error.message);}
    if(needsGroupDiscovery){const entryIds=new Set((plan.entryRules||[{toNodeId:plan.startNodeId}]).map(row=>row.toNodeId));for(const node of plan.nodes.filter(node=>entryIds.has(node.nodeId)&&node.type==='PROCESS'))groups.set(node.nodeId,{...fourExecutionGroup(mock,fourDecorateNode(plan,node)),_node:fourDecorateNode(plan,node),count:0});}
    let schemaReady=!needsGroupDiscovery&&!(mode==='DIRECT'&&!input.directMethod)&&!issues.length;
    for(const group of groups.values())if(group.method==='AI')try{const sceneId=fourSelectedImportScene(input,group._node);group.aiSceneId=sceneId;group.selectedAiSceneId=sceneId;requireThat(sceneId,'AI_SCENE_REQUIRED','请为“'+group.nodeName+'”选择本次AI场景');group._definition=fourAIImportDefinition(config,mock,group._node,sceneId);}catch(error){schemaReady=false;issues.push(error.message);}
    const groupSchemas=new Map(),groupKeys=new Set(rowPlans.filter(row=>!row.error).map(row=>row.key));if(!groupKeys.size)for(const key of groups.keys())groupKeys.add(key);if(!groupKeys.size&&!needsGroupDiscovery)groupKeys.add('NO_CALL');
    for(const key of groupKeys){const group=groups.get(key),business=group?.method==='AI'?[...core,...routingFields,...(group._definition?.businessFields||[])]:[{...core[0]},...clone(config.fields)],custom=group?._definition?.customFields||[];const unique=new Map(business.map(field=>[field.key,field]));groupSchemas.set(key,[...unique.values(),...custom]);}
    const union=new Map();for(const [key,fields]of groupSchemas)for(const field of fields){const old=union.get(field.key);if(old){requireThat(old.type===field.type,'IMPORT_SCHEMA','不同呼叫组的同一导入字段类型不一致');if(field.required&&!old.requiredForGroups.includes(key))old.requiredForGroups.push(key);}else union.set(field.key,{...clone(field),requiredForGroups:field.required?[key]:[]});}
    let fields=schemaReady?[...union.values()].map(field=>({...field,required:groupKeys.size>0&&field.requiredForGroups.length===groupKeys.size})):[];
    const labels=new Map();for(const field of fields){const duplicates=fields.filter(row=>row.label===field.label);if(duplicates.length>1&&field.source==='AI_CUSTOM')field.label=field.label+'〔'+field.sceneId+'〕';requireThat(!labels.has(field.label),'IMPORT_COLUMN_CONFLICT','本次不同来源的导入列名称重复，请调整场景字段名称');labels.set(field.label,field.key);}
    const executionGroups=[...groups.values()].map(group=>{const copy={...group};delete copy._node;delete copy._definition;return copy;}),fieldBasisToken='IMPORT-FIELDS-'+fingerprint({mode,importChannel:fourImportChannel(input),method:input.directMethod||'',tenantId:a.tenantId,category:config.categoryRef,fields:config.fields,plan,groups:[...groups.entries()].map(([id,group])=>({id,method:group.method,sceneId:group.aiSceneId||'',fingerprint:group._definition?.review.fingerprint||'',source:group._definition?.spec.dataImportSource||''})),schema:fields,groupKeys:[...groupKeys].sort()});
    return {...clone(base),importChannel:fourImportChannel(input),fields,importSchema:clone(fields),customFields:fields.filter(field=>field.source==='AI_CUSTOM'),discoverySchema:[...discovery.values()],routingFields,schemaReady,needsGroupDiscovery,fieldBasisToken,executionGroups,issues:[...new Set([...(base.issues||[]).filter(issue=>!issue.includes('请选择直接跟进方式')), ...issues])],_config:config,_plan:plan,_groups:groups,_groupSchemas:groupSchemas,_rowPlans:rowPlans,_mock:mock};
  }
  function fourPublicImportContext(context){const result={};for(const [key,value]of Object.entries(context))if(!key.startsWith('_'))result[key]=clone(value);return result;}
  function importContext(categoryId,options={}){return safe(()=>{if(options.catalogOnly===true){const ret=fourImportContextBase(categoryId,options);requireThat(ret.status==='success','IMPORT_CONTEXT',ret.message);return {...ret.data,catalogOnly:true};}requireThat(fourMode(options)==='TEMPLATE','IMPORT_ENTRY_MODE','业务分类入口只能导入到流转模板；直接跟进名单请从准确任务入口导入');return fourPublicImportContext(fourImportSchemaState(read(),categoryId,options));});}
  function directFollowupContext(id,options={}){return safe(()=>{const s=read(),r=current(s,id);requireThat(fourDirect(r)&&fourDirectRecordValid(r),'DIRECT_RECORD','本入口仅用于已有直接跟进记录');const ret=fourImportContextBase(r.categoryId,{handlingMode:'DIRECT',directMethod:options.directMethod||r.directMethod});requireThat(ret.status==='success','DIRECT_CONTEXT',ret.message);return {...ret.data,recordId:id,expectedRevision:r.revision,existingDirect:true};});}

  // Only explicit new-input/new-run capture defines an omitted optional column as empty.
  // Captured historical records and shared evaluation retain missing-key PENDING semantics.
  function fourNormalizeNewImportFields(config,input){
    const supplied=clone(input||{});
    for(const field of config.fields||[]){
      const keys=[...new Set([field.key,field.id,field.fieldId,field.businessKey,...(field.aliases||[])].filter(Boolean))],provided=keys.filter(key=>Object.hasOwn(supplied,key));
      if(!provided.length)continue;const first=supplied[provided[0]];
      if(!provided.every(key=>JSON.stringify(supplied[key])===JSON.stringify(first)))return {fields:supplied,error:'同一业务字段存在不同来源值：'+field.label};
      if(field.type==='phone'&&first!==undefined&&first!==null&&typeof first!=='string')return {fields:supplied,error:field.label+'须为文本联系电话，不能转换其他类型'};
      if(!Object.hasOwn(supplied,field.key))supplied[field.key]=clone(first);
    }
    for(const field of config.fields||[]){
      if(!field.fieldId||field.source!=='IMPORT'||field.usage!=='IMPORT'||field.enabled!==true||field.required!==false||!DFlowRouting.operators(field.type).length)continue;
      const aliases=[field.key,field.fieldId,field.businessKey,...(field.aliases||[])].filter(Boolean);
      if(!aliases.some(key=>Object.hasOwn(supplied,key)))supplied[field.key]=null;
    }
    return normalizeImportFields(config,supplied);
  }
  function fourImportToken(s,input,p){
    const mode=fourMode(input),plan=mode==='TEMPLATE'?fourBoundPlan(s,fourLatestRef(s,p.category.main),p.category.brandId,p.category.categoryId):null;
    return 'EXECUTION-IMPORT-'+fingerprint({category:p.category,plan,mode,importChannel:fourImportChannel(input),name:fourImportName(input.name),method:input.directMethod,requestedScene:input.aiSceneId,fieldBasisToken:p.fieldBasisToken,tenantId:access().tenantId,arrangementMode:input.arrangementMode||'LATER',executionPriority:input.executionPriority,executionArrangements:input.executionArrangements||[],rows:p.rows.map(row=>({code:row.code,status:row.status,fields:row.fields,method:row.method,firstCallNodeId:row.firstCallNodeId,executionPriority:row.executionPriority,executionArrangement:row.executionArrangement,sceneSnapshot:row.sceneSnapshot,aiImportParameterSnapshot:row.aiImportParameterSnapshot,importFieldSnapshot:row.importFieldSnapshot}))});
  }
  function fourImportArrangements(input){
    if(input.executionPriority!==undefined)fourExecutionPriority(input.executionPriority);
    requireThat(!input.arrangementMode||['NOW','LATER'].includes(input.arrangementMode),'ARRANGEMENT_MODE','请选择本次指定任务/坐席或稍后手动分配');
    const list=input.executionArrangements||[];requireThat(Array.isArray(list)&&new Set(list.map(item=>item?.nodeId)).size===list.length,'IMPORT_ARRANGEMENTS','每个首呼叫节点只能指定一份执行安排');
    for(const item of list){requireThat(item&&typeof item.nodeId==='string'&&item.nodeId,'IMPORT_ARRANGEMENTS','执行安排缺少准确首呼叫节点');if(item.executionPriority!==undefined)fourExecutionPriority(item.executionPriority);}return list;
  }
  function fourImportExecution(r,node,row,input,arrangements){
    const key=node.type==='DIRECT'?'DIRECT':node.nodeId,override=arrangements.find(item=>item.nodeId===key),defaults=fourDefaultArrangement(node,r.ownerTenantId),selected=override||defaults,method=node.methods[0];
    const priority=fourExecutionPriority(override?.executionPriority??input.executionPriority??node.executionPriority),sceneId=fourSelectedImportScene(input,node,row),previewOnly=input.groupDiscovery===true||input.arrangementPreview===true&&input.arrangementMode==='NOW';
    row.firstCallNodeId=key;row.firstCallNodeName=node.name||'直接跟进';row.executionPriority=priority;row.aiSceneId=sceneId;row.sceneSnapshot=null;
    if(method==='MANUAL')row.manualAssignmentMode=fourManualModeFor(node,selected,override||input);
    if(method==='AI'&&!previewOnly)row.sceneSnapshot=clone(fourResolveScene(r,node,sceneId));
    if(previewOnly)return;
    if(method==='MANUAL'&&row.manualAssignmentMode==='MANUAL'){row.resourceId='';row.executionArrangement={arrangementSchema:2,manualAssignmentMode:'MANUAL',resourceId:'',resourceSnapshot:null,accountId:'',followupAccountId:'',aiSceneId:'',sceneSnapshot:null,executionPriority:priority};return;}
    if(input.arrangementMode==='NOW')requireThat(selected.resourceId,'IMPORT_ARRANGEMENT_REQUIRED','请为首呼叫节点“'+row.firstCallNodeName+'”指定'+(method==='MANUAL'?'有效坐席':'具体任务')+'后重新检查');
    if(!selected.resourceId)return;
    const choices=fourChoices(r,node,sceneId),resource=fourResolveTarget(r,node,selected,choices),accountId=method==='MANUAL'?resource.accountId||'':'';
    if(method==='MANUAL')requireThat(accountId&&choices.people.some(person=>person.accountId===accountId),'MANUAL_HANDLER','所选坐席缺少唯一有效承接账号');
    row.resourceId=resource.resourceId;row.executionArrangement={arrangementSchema:2,...(method==='MANUAL'?{manualAssignmentMode:'SPECIFIC_SEAT'}:{}),resourceId:resource.resourceId,resourceSnapshot:clone(resource),accountId,followupAccountId:accountId,aiSceneId:method==='AI'?sceneId:'',sceneSnapshot:clone(row.sceneSnapshot),executionPriority:priority};
  }
  function preview(s,input) {
    const arrangements=fourImportArrangements(input),mode=fourMode(input),a=access();fourImportName(input.name);fourImportChannel(input);requireThat(!Object.hasOwn(input,'entrySource'),'IMPORT_ENTRY_SOURCE','导入入口标识由模型按当前分类或准确任务生成，不能手工指定');
    requireThat(mode==='TEMPLATE'||taskBusinessEntryAllowed(input),'IMPORT_ENTRY_MODE','业务分类入口只能导入到流转模板；直接跟进名单请从准确任务入口导入');
    if(mode==='TEMPLATE'){try{importGuard(s,input);}catch(error){if(error.code==='ROUTE_NOT_READY'){const currentConfig=categoryVersion(s,input.categoryId).config;if(currentConfig.main){const plan=templateVersion(s,fourLatestRef(s,currentConfig.main));requireThat(!plan.nodes.some(node=>node.type==='END'&&node.endAction==='DIRECT_FOLLOWUP'),'TEMPLATE_DIRECT_END','请先把模板的旧直接跟进结束设置改为正常结束，再导入分类名单');}}throw error;}}else {requireThat(a.roleCode==='ADMIN'&&window.AppState?.canAction?.('customer.import'),'IMPORT_DENIED','当前人员没有本租户导入资格');fourDirectMethod(input.directMethod);const config=fourDirectConfig(bind(a.tenantId).brandId,input.categoryId,true);requireThat(!input.categoryVersion||Number(input.categoryVersion)===config.version,'STALE_VERSION','分类配置已变化，请重新预览');requireThat(tenantValid(a.tenantId),'TENANT_UNAVAILABLE','当前租户或实例不可用');}
    requireThat(Array.isArray(input.rows)&&input.rows.length,'ROWS_REQUIRED','请输入要导入的数据');
    const context=fourImportSchemaState(s,input.categoryId,input),config=context._config,discovery=input.groupDiscovery===true||input.arrangementPreview===true&&input.arrangementMode==='NOW',seen=new Set(),legacy=professionalEntries(),groups=new Map(),rowPlanByIndex=new Map(context._rowPlans.map(row=>[row.index,row])),allFields=[...new Map([...context._groupSchemas.values()].flat().map(field=>[field.key,field])).values()],allCustom=new Set(allFields.filter(field=>field.source==='AI_CUSTOM').map(field=>field.key));
    config.kind=fourLine(config.categoryId,config.categoryDefinition)?'LEAD':'GENERAL';
    const existingByCode=new Map(s.records.filter(record=>record.brandId===config.brandId&&canonicalCategory(record.categoryId)===config.categoryId).map(record=>[record.businessCode,record])),legacyCodes=new Set(legacy.filter(record=>record.brandId===config.brandId&&canonicalCategory(record.categoryId)===config.categoryId).map(record=>record.businessCode)),catalog=config.kind==='LEAD'?brandConfiguration(config.brandId):null,leadCodes=new Set(config.kind==='LEAD'?[...s.records.filter(record=>record.brandId===config.brandId&&(record.categorySnapshot?.kind==='LEAD'||record.categoryId==='LEGACY-CUSTOMER'||fourLine(record.categoryId,record.categorySnapshot?.categoryDefinition))).map(record=>record.businessCode),...legacy.filter(record=>record.brandId===config.brandId&&(record.source?.sourceKind==='BRAND_LEAD'||fourLine(record.categoryId,catalog.rows.find(category=>category.id===record.categoryId)))).map(record=>record.businessCode)]:[]);
    const p={category:config,handlingMode:mode,rows:[],fieldBasisToken:context.fieldBasisToken,fields:clone(context.fields),customFields:clone(context.customFields),schemaReady:context.schemaReady,discoverySchema:clone(context.discoverySchema),needsGroupDiscovery:context.needsGroupDiscovery};
    if(input.fieldBasisToken!==undefined)requireThat(input.fieldBasisToken===context.fieldBasisToken,'IMPORT_FIELDS_STALE','当前方式、首呼叫组、场景或导入字段已变化，请重新读取并检查');
    for(let index=0;index<input.rows.length;index++){
      const supplied=input.rows[index],row={index,code:'',status:'success',message:'字段通过，可创建新记录'},route=rowPlanByIndex.get(index);p.rows.push(row);
      try{
        const code=fourImportBusinessCode(supplied,config.codeLabel);row.code=code;requireThat(route&&!route.error,'INITIAL_ROUTE',route?.error?.message||'本行首个办理节点无法确定');
        const first=route.first,group=context._groups.get(route.key),activeFields=discovery?context.discoverySchema:context._groupSchemas.get(route.key)||[],required=new Set(activeFields.filter(field=>field.required).map(field=>field.key)),businessSchema=(discovery?context.discoverySchema:allFields).filter(field=>field.key!=='code'&&field.source!=='AI_CUSTOM').map(field=>({...clone(field),required:required.has(field.key)})),raw=clone(supplied.fields||{}),custom=clone(supplied.customValues||{});
        requireThat(custom&&typeof custom==='object'&&!Array.isArray(custom),'AI_CUSTOM_VALUES','场景专属值须使用独立字段对象');
        for(const key of allCustom)if(Object.hasOwn(raw,key)){requireThat(!Object.hasOwn(custom,key)||fingerprint(custom[key])===fingerprint(raw[key]),'AI_CUSTOM_VALUES','同一场景专属列存在冲突值');custom[key]=raw[key];delete raw[key];}
        for(const key of Object.keys(custom))requireThat(allCustom.has(key)&&(!discovery&&first.method==='AI'||fourImportEmpty(custom[key])),'AI_CUSTOM_SCOPE','专属值不属于本批及本行实际AI场景');
        const allowed=new Set(businessSchema.flatMap(field=>[field.key,field.id,field.fieldId,field.businessKey,...(field.aliases||[])].filter(Boolean))),unknown=Object.keys(raw).filter(key=>!allowed.has(key));
        requireThat(!unknown.length,'IMPORT_FIELDS','导入包含本次方式或场景未采用的字段：'+unknown.join('、'));
        const normalized=fourNormalizeNewImportFields({...config,fields:businessSchema},raw),problem=normalized.error||validateFields({...config,fields:businessSchema},normalized.fields);requireThat(!problem,'IMPORT_FIELDS',problem);row.fields=normalized.fields;
        const existing=existingByCode.get(code);
        if(existing||legacyCodes.has(code)||seen.has(code)||leadCodes.has(code)){row.status='duplicate';row.message='同品牌业务编码已存在，不能重复导入或覆盖原记录';if(existing&&visible(existing,a))row.recordId=existing.recordId;continue;}seen.add(code);
        Object.assign(row,{handlingMode:mode,method:first.method,initialNodeType:mode==='DIRECT'?'':first.initialNodeType,requiresAIScene:first.requiresAIScene,executionPriority:fourExecutionPriority(input.executionPriority??first.node?.executionPriority)});
        if(['PROCESS','DIRECT'].includes(first.initialNodeType)){
          requireThat(fourRecipientMatches(first.node.recipient,bind(a.tenantId),first.node),'INITIAL_RECIPIENT','首个呼叫节点不适用于导入租户，须先完成合法转交');if(!groups.has(route.key))groups.set(route.key,{...fourExecutionGroup(context._mock,first.node),aiSceneId:group?.aiSceneId||'',selectedAiSceneId:group?.aiSceneId||'',count:0});groups.get(route.key).count++;
          fourImportExecution(context._mock,first.node,row,input,arrangements);
          if(first.method==='AI'&&!discovery){requireThat(group?._definition,'AI_IMPORT_PARAMETERS',context.issues.join('；')||'请先选择本次AI场景并读取导入字段');const definition=group._definition,keys=new Set(definition.customFields.map(field=>field.key));for(const key of Object.keys(custom))requireThat(fourImportEmpty(custom[key])||keys.has(key),'AI_CUSTOM_SCOPE','专属值不属于本行实际AI场景');const values=Object.fromEntries(Object.entries(custom).filter(([key])=>keys.has(key)));row.aiImportParameterSnapshot=fourReviewAIImportValues(definition,row.fields,code,values,route.key);}
        }
        row.importFieldSnapshot={fields:clone(businessSchema),values:clone(row.fields)};
      }catch(error){row.status='failed';row.message=error.message;}
    }
    p.executionGroups=[...groups.values()];for(const entry of arrangements)requireThat(groups.has(entry.nodeId),'IMPORT_ARRANGEMENT_NODE','执行安排引用了本批未命中的首呼叫节点');
    p.arrangementPreview=discovery;p.groupDiscovery=discovery;p.counts=counts(p.rows);if(p.rows.every(row=>row.status==='success')&&!discovery&&context.schemaReady)p.importBasisToken=fourImportToken(s,input,p);return p;
  }
  function fourReviewAIImportValues(definition,values,code,customValues,nodeId){
    const result=window.DFourNodeExecution.validateTaskImportParameters(definition.spec,definition.fullFields,{...clone(values),code},clone(customValues||{}));
    requireThat(result&&!result.then&&result.ok===true,'AI_IMPORT_VALUES',result?.message||'本次AI场景必需传入资料尚未完整');requireThat(result.fingerprint===definition.review.fingerprint,'AI_IMPORT_CHANGED','AI场景字段配置已变化，请重新读取');
    return {schema:1,tenantId:access().tenantId,sceneId:definition.scene.id,aiSceneId:definition.scene.id,dataImportSource:definition.spec.dataImportSource,...(definition.scene.sourceResolution?{sourceResolution:clone(definition.scene.sourceResolution)}:{}),nodeId,fingerprint:result.fingerprint,mappings:clone(result.mappings||[]),parameters:clone(result.parameters||{}),customFields:clone(result.customFields||[]),customValues:clone(result.customValues||{})};
  }
  function fourCreateRun(s,r,config,purpose='FIRST') {
    const main=fourLatestRef(s,config.main),raw=fourBoundPlan(s,main,r.brandId,r.categoryId),runId=uid('RUN'),at=now(),plan=clone(raw);
    const normalized=fourNormalizeNewImportFields(config,r.fields),fieldProblem=normalized.error||validateFields(config,normalized.fields);requireThat(!fieldProblem,'IMPORT_FIELDS',fieldProblem);r.fields=normalized.fields;
    r.categorySnapshot={...clone(config),kind:fourLine(r.categoryId,config.categoryDefinition)?'LEAD':'GENERAL'};
    r.handlingMode='TEMPLATE';r.mechanism='TEMPLATE';r.executionQueuedAt='';r.executionQueueSequence=0;const entryDecision=fourEntryDecision(plan,r.fields,r.ownerTenantId,purpose),run={runId,templateId:main.templateId,status:'ACTIVE',purpose,startedAt:at,planSnapshot:plan,entryDecision};(r.runs||=[]).push(run);r.runId=runId;r.currentRunId=runId;r.main=clone(main);r.categorySnapshot.main=clone(main);
    r.templateRef={...main,runId};r.nodeId=entryDecision.nodeId;r.nodeRunId=uid('NODE-RUN');r.arrival={type:'START',runId,sourceTenantId:r.ownerTenantId,targetTenantId:r.ownerTenantId};
    (r.nodeRuns||=[]).push({nodeRunId:r.nodeRunId,nodeId:r.nodeId,templateRef:clone(r.templateRef),runId,roundId:fourStage(r).roundId,tenantId:r.ownerTenantId,enteredAt:at,status:'current'});
    if(plan.nodes.find(n=>n.nodeId===r.nodeId).type==='END'){run.status='ENDED';run.endedAt=at;fourCloseOutcome(r,plan.nodes.find(n=>n.nodeId===r.nodeId));}else r.businessOutcome=null;return run;
  }
  function importRecords(input,opts={}){return commit('import',null,input,opts,(s,a)=>{
    requireThat(input.groupDiscovery!==true,'IMPORT_DISCOVERY','呼叫组识别不能直接提交导入');const p=preview(s,input);requireThat(p.rows.length&&p.rows.every(row=>row.status==='success'),'IMPORT_ROWS','正式导入范围内每行均须通过校验；请移除重复或修正问题行');requireThat(input.importBasisToken&&input.importBasisToken===p.importBasisToken,'IMPORT_STALE','导入数据、字段、流程或场景已变化，请保留名单重新预览确认');
    const config=p.category,batchId=uid('BATCH'),at=now(),channel=fourImportChannel(input),entrySource={schema:1,kind:p.handlingMode==='DIRECT'?'TASK':'CATEGORY',importChannel:channel,handlingMode:p.handlingMode,tenantId:a.tenantId,categoryId:config.categoryId,...(channel==='API'?{integrationMode:'LOCAL_MOCK'}:{})};
    for(const row of p.rows){const rowConfig={...clone(config),fields:clone(row.importFieldSnapshot?.fields||config.fields)},r={fourNodeSchema:FOUR_SCHEMA,importFieldPolicy:'SCENE_V1',recordId:uid('REC'),brandId:config.brandId,categoryId:config.categoryId,businessCode:row.code,fields:clone(row.fields),originalImportSnapshot:{fields:clone(rowConfig.fields),values:clone(row.fields),at,batchId},followupValues:{},currentValueSources:{},corrections:[],mechanism:p.handlingMode,handlingMode:p.handlingMode,categorySnapshot:clone(rowConfig),main:clone(config.main),backup:null,mappings:[],ownerTenantId:a.tenantId,assignedAccountId:'',assignment:null,arrangement:null,revision:1,createdAt:at,batchId,scopeKnown:true,rounds:[{roundId:uid('STAGE'),number:1,tenantId:a.tenantId,openedAt:at,operatorAccountIds:[],segments:[]}],nodeRuns:[],departures:[],events:[],runs:[],execution:{state:'ended',noMoreCalls:true}};
      if(p.handlingMode==='DIRECT'){delete r.main;delete r.backup;delete r.mappings;delete r.nodeRuns;delete r.runs;r.directMethod=input.directMethod;r.directStatus='ACTIVE';r.directCycleId=uid('DIRECT-CYCLE');r.directCycles=[{directCycleId:r.directCycleId,method:r.directMethod,status:'ACTIVE',startedAt:at}];}s.records.push(r);if(p.handlingMode!=='DIRECT')fourCreateRun(s,r,rowConfig);r.executionPriority=row.executionPriority;r.executionPriorityOverride=input.executionPriority!==undefined||input.executionArrangements?.some(item=>item.nodeId===row.firstCallNodeId&&item.executionPriority!==undefined);if(row.requiresAIScene)r.arrangement={arrangementSchema:2,runId:r.runId,nodeRunId:r.nodeRunId,tenantId:a.tenantId,handlingMode:p.handlingMode,directCycleId:r.directCycleId,method:'AI',aiSceneId:String(row.aiSceneId||input.aiSceneId),sceneSnapshot:clone(row.sceneSnapshot||fourResolveScene(r,fourHandling(s,r),row.aiSceneId||input.aiSceneId)),followupAccountId:'',executionPriority:row.executionPriority};
      if(row.executionArrangement){const target=row.executionArrangement,person=fourPeople(a.tenantId).find(item=>item.accountId===target.accountId);r.assignedAccountId=target.accountId;r.manualAssignmentMode=target.manualAssignmentMode||'';r.assignment=target.resourceId?{type:row.method==='MANUAL'?'SEAT':'TASK',accountId:target.accountId||'',name:target.resourceSnapshot?.name||target.resourceId,method:row.method,resourceId:target.resourceId}:row.method==='MANUAL'?{type:'PENDING_MANUAL',method:'MANUAL',manualAssignmentMode:'MANUAL'}:null;r.executionQueuedAt=at;r.executionQueueSequence=fourNextQueueSequence(s);r.arrangement={handlingMode:p.handlingMode,directCycleId:r.directCycleId,runId:r.runId,nodeRunId:r.nodeRunId,tenantId:a.tenantId,method:row.method,...clone(target),queuedAt:at,queueSequence:r.executionQueueSequence};}
      r.entrySource=clone(entrySource);r.originalImportSnapshot.entrySource=clone(entrySource);if(row.aiImportParameterSnapshot){const snapshot={...clone(row.aiImportParameterSnapshot),runId:r.runId,nodeRunId:r.nodeRunId,directCycleId:r.directCycleId,capturedAt:at,actorAccountId:a.accountId};r.aiImportParameterSnapshots=[snapshot];r.originalImportSnapshot.aiImportParameterSnapshots=[clone(snapshot)];}row.recordId=r.recordId;
    }
    const batch={batchId,name:fourImportName(input.name),handlingMode:p.handlingMode,mechanism:p.handlingMode,entrySource:clone(entrySource),directMethod:p.handlingMode==='DIRECT'?input.directMethod:undefined,source:'template',sourceLabel:channel==='API'?'业务分类接口导入（本地模拟）':'业务分类手工导入',brandId:config.brandId,categoryId:config.categoryId,categoryName:config.name,tenantId:a.tenantId,actorAccountId:a.accountId,at,rows:p.rows.map(row=>{const v={...row};delete v.fields;return v;}),counts:p.counts};s.batches.push(batch);return batch;
  });}
  function fourAssignmentGroupKey(r,n,sceneId=r.arrangement?.aiSceneId||''){return JSON.stringify([r.ownerTenantId,r.categoryId,fourDirect(r)?'DIRECT':r.templateRef.templateId,fourDirect(r)?r.directMethod:r.templateRef.version,n.nodeId||'',n.methods?.[0],sceneId]);}
  function fourCurrentAIImportDefinition(s,r,node,scene){
    const config=fourDirectConfig(r.brandId,r.categoryId,false),definition=fourAIImportDefinition(config,r,node,scene?.id||r.arrangement?.aiSceneId);return {config,definition};
  }
  function fourAIImportSavedSnapshot(r,definition){
    const matching=(r.aiImportParameterSnapshots||[]).filter(snapshot=>snapshot.tenantId===r.ownerTenantId&&snapshot.sceneId===definition.scene.id&&snapshot.dataImportSource===definition.spec.dataImportSource&&snapshot.nodeRunId===r.nodeRunId&&snapshot.directCycleId===r.directCycleId&&snapshot.fingerprint===definition.review.fingerprint);
    if(matching.length)return matching.at(-1);
    if(r.taskImportSource?.tenantId===r.ownerTenantId&&r.taskImportSource.aiSceneId===definition.scene.id&&(r.taskImportSource.dataImportSource||'MANUAL')===definition.spec.dataImportSource&&r.taskImportParameterSnapshot?.fingerprint===definition.review.fingerprint)return r.taskImportParameterSnapshot;
    return null;
  }
  function fourCurrentAIImportValues(s,r,node,scene){
    const {definition}=fourCurrentAIImportDefinition(s,r,node,scene),saved=fourAIImportSavedSnapshot(r,definition);
    try{return fourReviewAIImportValues(definition,r.fields,r.businessCode,saved?.customValues||{},node.type==='DIRECT'?'DIRECT':node.nodeId);}catch(error){error.code='AI_IMPORT_DATA_REQUIRED';error.message='本次AI场景传入资料尚未完整，请由当前负责租户管理员补充：'+error.message;throw error;}
  }
  function fourAIImportDataState(s,id,opts={}){
    const r=fourActive(s,id,opts),a=access(),node=fourHandling(s,r);requireThat(node.methods?.[0]==='AI','AI_IMPORT_METHOD','当前不是AI呼叫节点');requireThat(a.roleCode==='ADMIN'&&a.tenantId===r.ownerTenantId&&window.AppState?.canAction?.('customer.import')===true&&window.AppState?.canAction?.('task.assign')===true,'AI_IMPORT_DATA_DENIED','仅当前负责租户有权管理员可补充AI场景传入资料');
    noRunning(r);previousSaved(r);const {definition}=fourCurrentAIImportDefinition(s,r,node),saved=fourAIImportSavedSnapshot(r,definition),fields=definition.businessFields.filter(field=>field.key!=='code'),customValues=clone(saved?.customValues||{}),values=Object.fromEntries(fields.map(field=>[field.key,clone(r.fields[field.key])]));
    const fieldBasisToken='AI-INPUT-'+fingerprint({recordId:id,tenantId:r.ownerTenantId,runId:r.runId,nodeRunId:r.nodeRunId,directCycleId:r.directCycleId,resourceId:r.arrangement?.resourceId,scene:definition.scene,fields,customFields:definition.customFields,revision:r.revision,fingerprint:definition.review.fingerprint});
    return {recordId:id,runId:r.runId,nodeRunId:r.nodeRunId,directCycleId:r.directCycleId,tenantId:r.ownerTenantId,aiSceneId:definition.scene.id,sceneName:definition.scene.name,dataImportSource:definition.spec.dataImportSource,fields:[...clone(fields),...clone(definition.customFields)],businessFields:clone(fields),customFields:clone(definition.customFields),values,customValues,fieldBasisToken,expectedRevision:r.revision,canSave:true,issues:[],_r:r,_node:node,_definition:definition};
  }
  function aiImportDataContext(id){return safe(()=>fourPublicImportContext(fourAIImportDataState(read(),id)));}
  function saveAIImportData(id,input={},opts={}){return commit('saveAIImportData',id,input,opts,(s,a)=>{
    const state=fourAIImportDataState(s,id,opts),r=state._r,definition=state._definition;requireThat(opts.expectedRevision!==undefined&&input.fieldBasisToken===state.fieldBasisToken,'AI_IMPORT_DATA_STALE','当前业务、节点、场景、字段或资料已变化，请重新读取');
    const provided=clone(input.values||{}),allowed=new Set(state.businessFields.flatMap(field=>[field.key,field.fieldId,field.id,field.businessKey,...(field.aliases||[])].filter(Boolean)));
    for(const key of Object.keys(provided))requireThat(allowed.has(key),'AI_IMPORT_DATA_FIELDS','只能补充当前AI场景采用的业务字段');
    const raw={...clone(r.fields),...provided};for(const field of state.businessFields){const aliases=[...new Set([field.key,field.fieldId,field.id,field.businessKey].filter(Boolean))],explicit=aliases.filter(key=>Object.hasOwn(provided,key));if(explicit.length){requireThat(explicit.every(key=>fingerprint(provided[key])===fingerprint(provided[explicit[0]])),'AI_IMPORT_DATA_VALUES','同一业务字段存在冲突来源：'+field.label);for(const key of aliases)raw[key]=clone(provided[explicit[0]]);}}
    const normalized=fourNormalizeNewImportFields({fields:state.businessFields},raw);requireThat(!normalized.error,'AI_IMPORT_DATA_VALUES',normalized.error);const problem=validateFields({fields:state.businessFields},normalized.fields);requireThat(!problem,'AI_IMPORT_DATA_VALUES',problem);
    for(const field of state.businessFields){const before=r.fields[field.key],after=normalized.fields[field.key];if(before!==undefined&&before!==null&&before!==''&&JSON.stringify(before)!==JSON.stringify(after))fail('AI_IMPORT_DATA_CONFLICT','已有业务值须通过资料更正填写原因，不能借补充场景资料覆盖：'+field.label);}
    const snapshot=fourReviewAIImportValues(definition,normalized.fields,r.businessCode,input.customValues||{},state._node.type==='DIRECT'?'DIRECT':state._node.nodeId),at=now(),eventId=uid('AI-INPUT');
    const before=clone(r.fields);r.fields=normalized.fields;for(const key of Object.keys(r.fields))if(JSON.stringify(before[key])!==JSON.stringify(r.fields[key]))r.currentValueSources[key]={kind:'AI_IMPORT_DATA',eventId,at};
    const captured={...snapshot,runId:r.runId,nodeRunId:r.nodeRunId,directCycleId:r.directCycleId,capturedAt:at,actorAccountId:a.accountId,businessValues:clone(r.fields)};(r.aiImportParameterSnapshots||=[]).push(captured);r.events.push({eventId,type:'AI_IMPORT_DATA_SAVED',at,tenantId:a.tenantId,actorAccountId:a.accountId,runId:r.runId,nodeRunId:r.nodeRunId,directCycleId:r.directCycleId,sceneId:definition.scene.id,providedValues:provided,customValues:clone(snapshot.customValues)});r.revision++;return {recordId:id,revision:r.revision,snapshot:clone(captured)};
  });}
  function fourAssignmentReadiness(s,id,opts={},a=access()){const r=fourActive(s,id,opts);requireThat(a.roleCode==='ADMIN'&&a.tenantId===r.ownerTenantId&&window.AppState?.canAction?.('task.assign'),'ASSIGN_DENIED','仅当前负责租户有权管理员可分配跟进人');const node=fourHandling(s,r);requireThat(['PROCESS','DIRECT'].includes(node.type),'CALL_NODE','当前不是呼叫节点，无需先分配人员');noRunning(r);return {r,node};}
  function arrangementContext(id){return safe(()=>{
    const s=read(),{r,node}=fourAssignmentReadiness(s,id),defaults=fourDefaultArrangement(node,r.ownerTenantId),current=fourArrangementCurrent(r)?r.arrangement:{},sceneId=current.aiSceneId||defaults.aiSceneId||'',choices=fourChoices(r,node,sceneId);
    return {recordId:id,revision:r.revision,handlingMode:fourDirect(r)?'DIRECT':'TEMPLATE',directCycleId:r.directCycleId,runId:r.runId,nodeRunId:r.nodeRunId,tenantId:r.ownerTenantId,method:node.methods[0],assignmentGroupKey:fourAssignmentGroupKey(r,node),executionGroupKey:JSON.stringify([r.ownerTenantId,node.methods[0],current.resourceId||defaults.resourceId||'',sceneId]),people:choices.people,accounts:choices.people,unavailablePeople:choices.unavailablePeople,resources:choices.resources,seats:choices.seats,tasks:choices.tasks,aiScenes:choices.scenes,manualAssignmentMode:node.methods[0]==='MANUAL'?fourManualModeFor(node,Object.keys(current).length?current:defaults):undefined,followupAccountId:r.assignedAccountId||'',aiSceneId:sceneId,resourceId:current.resourceId||defaults.resourceId||'',resourceSnapshot:clone(current.resourceSnapshot),executionPriority:fourPriority(r,node),queuedAt:current.queuedAt||'',defaultArrangement:defaults,ready:choices.providerReady,issues:choices.providerReady?[]:[choices.providerMessage]};
  });}
  function aiScenes(id){const context=arrangementContext(id);return context.status==='success'?ok(context.data.aiScenes):context;}
  function assignmentRaw(s,r){const result=arrangementContext(r.recordId);requireThat(result.status==='success','ASSIGNMENT',result.message);return result.data;}
  function fourAssign(s,r,input,a){
    const ready=fourAssignmentReadiness(s,r.recordId,{},a),n=ready.node,method=n.methods[0],prior=fourArrangementCurrent(r)?r.arrangement:{},defaults=fourDefaultArrangement(n,r.ownerTenantId),sceneId=input.aiSceneId||prior.aiSceneId||defaults.aiSceneId||'',choices=fourChoices(r,n,sceneId),priority=fourExecutionPriority(input.executionPriority,fourPriority(r,n)),at=now();
    const manualAssignmentMode=method==='MANUAL'?fourManualModeFor(n,input.manualAssignmentMode!==undefined?{}:input.resourceId?{manualAssignmentMode:'SPECIFIC_SEAT'}:Object.keys(prior).length?prior:defaults,input):'';
    let resource=null,accountId='',scene=null;
    if(method!=='MANUAL'||manualAssignmentMode==='SPECIFIC_SEAT'){
      const resourceId=String(input.resourceId||prior.resourceId||defaults.resourceId||'');requireThat(resourceId,'RESOURCE_INVALID',method==='MANUAL'?'指定坐席时请选择有效坐席':'请选择具体任务');resource=fourResolveTarget(r,n,{resourceId,aiSceneId:sceneId},choices);
      if(method==='MANUAL'){accountId=resource.accountId||'';requireThat(accountId&&choices.people.some(person=>person.accountId===accountId),'MANUAL_HANDLER','所选坐席缺少唯一有效承接账号');}
      scene=fourResolveScene(r,n,sceneId);
    }
    const queuedAt=resource?(prior.resourceId===resource.resourceId&&prior.queuedAt?prior.queuedAt:at):'',queueSequence=resource?(prior.resourceId===resource.resourceId&&prior.queueSequence?prior.queueSequence:fourNextQueueSequence(s)):0;
    r.assignedAccountId=accountId;r.manualAssignmentMode=manualAssignmentMode;r.assignment=resource?{type:method==='MANUAL'?'SEAT':'TASK',accountId,name:resource.name,method,resourceId:resource.resourceId}:{type:'PENDING_MANUAL',method:'MANUAL',manualAssignmentMode:'MANUAL'};r.executionPriority=priority;r.executionQueuedAt=queuedAt;r.executionQueueSequence=queueSequence;if(input.executionPriority!==undefined)r.executionPriorityOverride=true;
    r.arrangement={arrangementSchema:2,handlingMode:fourDirect(r)?'DIRECT':'TEMPLATE',directCycleId:r.directCycleId,runId:r.runId,nodeRunId:r.nodeRunId,tenantId:r.ownerTenantId,method,...(method==='MANUAL'?{manualAssignmentMode}:{}),followupAccountId:accountId,aiSceneId:scene?.id||'',sceneSnapshot:clone(scene),resourceId:resource?.resourceId||'',resourceSnapshot:clone(resource),executionPriority:priority,queuedAt,queueSequence};r.revision++;r.events.push({eventId:uid('EVT'),type:'FOLLOWUP_ASSIGN',at,runId:r.runId,tenantId:a.tenantId,accountId:a.accountId,...(accountId?{followupAccountId:accountId}:{}),resourceId:resource?.resourceId||'',manualAssignmentMode:manualAssignmentMode||undefined,executionPriority:priority});return r;
  }
  function assign(id,input,opts={}){return commit('assign',id,input,opts,(s,a)=>fourAssign(s,fourActive(s,id,opts),input,a));}
  function assignMany(ids,input,opts={}){return commit('assignMany',null,{recordIds:ids,input},opts,(s,a)=>{
    requireThat(Array.isArray(ids)&&ids.length&&new Set(ids).size===ids.length,'RECORDS','请选择准确业务记录');let group;
    const records=ids.map(id=>{const r=fourActive(s,id,{expectedRevision:opts.expectedRevisions?.[id]}),n=fourHandling(s,r),key=fourAssignmentGroupKey(r,n,input.aiSceneId||r.arrangement?.aiSceneId||'');if(group)requireThat(group===key,'ASSIGN_GROUP','不同租户、节点、方式或AI场景请分组办理');else group=key;return r;});
    records.forEach(r=>fourAssign(s,r,input,a));return {recordIds:ids,records};
  });}
  function fourStartReady(s,id,input={},opts={},a=access()){
    const r=fourActive(s,id,opts);
    const n=fourHandling(s,r),method=n.methods?.[0];requireThat(['PROCESS','DIRECT'].includes(n.type)&&fourRecipientMatches(n.recipient,bind(r.ownerTenantId),n),'CALL_RECIPIENT','呼叫承接范围不匹配，请先完成合法转交');
    requireThat(window.AppState?.canAction?.('task.create'),'EXECUTE_DENIED','当前人员无本次起呼资格');requireThat(!input.method||input.method===method,'METHOD','方式由当前呼叫节点确定');requireThat(fourArrangementReady(r,n),method==='MANUAL'?'MANUAL_ASSIGNMENT_REQUIRED':'TASK_REQUIRED',method==='MANUAL'?'本条业务待人工分配，请先通过手动分配指定有效坐席':'请先指定当前租户有效的具体任务');
    if(method==='MANUAL'){const selected=fourArrangementCurrent(r)&&r.arrangement.resourceId?r.arrangement.resourceSnapshot:null;requireThat(selected?.accountId?a.accountId===selected.accountId:a.roleCode==='ADMIN'||a.accountId===r.assignedAccountId,'MANUAL_HANDLER',selected?.accountId?'本次人工呼叫已指定具体坐席，请由该坐席本人办理或由管理员重新分配':'人工呼叫由已分配且具电话资格的跟进人本人办理；管理员可先重新分配');}noRunning(r);previousSaved(r);contactGuard(r);
    const phone=String(r.fields.phone||''),coordination=fourContactCheck(s,r.ownerTenantId,phone,r.recordId);if(!coordination.allowed){const e=Error(coordination.message);e.code=coordination.code;e.data=coordination;throw e;}
    const policy=parent.DContactPolicy.check(r.ownerTenantId,phone,method,{excludeRecordId:r.recordId});requireThat(policy.allowed,'CONTACT_RESTRICTED',policy.message);
    const scene=fourResolveScene(r,n,input.aiSceneId||r.arrangement?.aiSceneId),provider=window.DFourNodeExecution;
    requireThat(!input.aiSceneId||input.aiSceneId===r.arrangement?.aiSceneId,'SCENE_CONFIRM','请先在本次安排中确认变更的AI场景');
    if(scene)requireThat(r.arrangement?.sceneSnapshot?.configurationFingerprint===scene.configurationFingerprint&&r.arrangement?.aiSceneId===scene.id,'SCENE_CHANGED','场景配置已变化，请在导入与分配重新确认');const aiImportParameterSnapshot=scene?fourCurrentAIImportValues(s,r,n,scene):null;
    requireThat(provider?.resolve,'EXECUTION_CONFIG','本租户执行配置尚未准备');const resolved=provider.resolve(fourProviderContext(r,n,method,scene?.id));requireThat(resolved?.ok&&resolved.resource,'EXECUTION_CONFIG',resolved?.message||'没有唯一有效执行配置');
    const selected=fourArrangementCurrent(r)?r.arrangement:null;if(method==='MANUAL'){const available=fourChoices(r,n,scene?.id);requireThat(resolved.resource.accountId===a.accountId&&available.people.some(person=>person.accountId===a.accountId),'MANUAL_HANDLER','当前本人没有本次有效坐席电话资格');}if(['AI','PREDICTIVE'].includes(method)&&selected?.resourceId){requireThat(window.AppState?.authorizeObject?.('task.create',resolved.resource)!==false,'EXECUTION_TARGET_DENIED','没有所选任务的使用权限');if(provider.canUseTask)requireThat(provider.canUseTask(fourProviderContext(r,n,method,scene?.id))===true,'EXECUTION_TARGET_DENIED','当前租户或账号没有所选任务的使用权限');}if(selected?.resourceId){requireThat(String(resolved.resource.resourceId||resolved.resource.id)===selected.resourceId,'EXECUTION_TARGET_CHANGED','实际执行对象与本次指定任务或坐席不一致，请重新分配');const old=selected.resourceSnapshot;if(old?.configurationFingerprint&&resolved.resource.configurationFingerprint)requireThat(old.configurationFingerprint===resolved.resource.configurationFingerprint,'EXECUTION_TARGET_CHANGED','任务配置已变化，请在导入与分配重新确认');if(old?.configurationRevision!==undefined&&resolved.resource.configurationRevision!==undefined)requireThat(old.configurationRevision===resolved.resource.configurationRevision,'EXECUTION_TARGET_CHANGED','任务配置已变化，请在导入与分配重新确认');}
    requireThat(!fourManualResourceOccupied(s,r,resolved.resource),'EXECUTION_RESOURCE_OCCUPIED','指定坐席已有其他正在执行、排队、重试或待核的呼叫，请先完成原次办理');requireThat(fourExecutionTimeReady(resolved.resource),'EXECUTION_TIME','指定任务尚未到执行时间或执行时间待核，请按任务安排等待或重新核对');if(selected?.resourceId)fourExecutionQueueGuard(s,r,n,resolved.resource,a);return {r,n,method,scene,resolved,aiImportParameterSnapshot};
  }
  function fourExecutionQueueGuard(s,r,n,resource,a){
    const id=String(resource.resourceId||resource.id||'');
    const earlier=(s.records||[]).filter(other=>other.recordId!==r.recordId&&other.fourNodeSchema===FOUR_SCHEMA&&other.ownerTenantId===r.ownerTenantId&&fourArrangementCurrent(other)&&other.arrangement.resourceId===id&&other.arrangement.method===n.methods[0]&&fourBusinessActive(other)&&!pending(s,other.recordId)).filter(other=>fourExecutionOrder(other,r)<0).sort(fourExecutionOrder);
    for(const other of earlier){if(!fourPriorityCandidate(s,other,r.ownerTenantId))continue;
      const canRead=visible(other,a),error=Error(canRead?'同一执行任务或坐席有更优先的待办，请先办理 '+other.businessCode+'（'+FOUR_EXECUTION_PRIORITIES[fourPriority(other)]+'）':'同一执行任务或坐席有更优先的已安排待办，请由有权人员先办理或协调');error.code='EXECUTION_PRIORITY_WAIT';error.data=canRead?{recordId:other.recordId,businessCode:other.businessCode,executionPriority:fourPriority(other)}:{executionPriority:fourPriority(other)};throw error;
    }
  }
  function startContext(id){return safe(()=>{const s=read(),a=access(),r=fourOwned(s,id),node=fourHandling(s,r);requireThat(['PROCESS','DIRECT'].includes(node.type),'CALL_NODE','当前不是呼叫节点');const choices=fourChoices(r,node,r.arrangement?.aiSceneId);let canStart=true,readiness={code:'READY',message:'提交时按当前资格再次核验'};try{fourStartReady(s,id,{}, {},a);}catch(e){canStart=false;readiness={code:e.code||'START_NOT_READY',message:e.message};}return {recordId:id,revision:r.revision,handlingMode:fourDirect(r)?'DIRECT':'TEMPLATE',directCycleId:r.directCycleId,runId:r.runId,nodeRunId:r.nodeRunId,tenantId:r.ownerTenantId,method:node.methods[0],assignmentGroupKey:fourAssignmentGroupKey(r,node),manualAssignmentMode:node.methods[0]==='MANUAL'?fourManualModeFor(node,r.arrangement||{}):undefined,followupAccountId:r.assignedAccountId||'',aiSceneId:r.arrangement?.aiSceneId||'',aiScenes:choices.scenes.filter(scene=>scene.id===r.arrangement?.aiSceneId),resourceId:r.arrangement?.resourceId||'',resourceSnapshot:clone(r.arrangement?.resourceSnapshot),executionPriority:fourPriority(r,node),queuedAt:fourQueuedAt(r),executionGroupKey:JSON.stringify([r.ownerTenantId,node.methods[0],r.arrangement?.resourceId||'',r.arrangement?.aiSceneId||'']),canStart,readiness,issues:canStart?[]:[readiness.message]};});}
  function fourStartRecord(s,id,input,opts,a){
    const {r,n,method,scene,resolved,aiImportParameterSnapshot}=fourStartReady(s,id,input,opts,a);
    const schema=snapshotForSegment(s,r),at=now(),segmentId=uid('FOLLOWUP'),seg={segmentId,followupId:segmentId,recordId:id,handlingMode:fourDirect(r)?'DIRECT':'TEMPLATE',directCycleId:r.directCycleId,runId:r.runId,roundId:fourStage(r).roundId,stageId:fourStage(r).roundId,nodeId:r.nodeId,nodeRunId:r.nodeRunId,tenantId:r.ownerTenantId,enterpriseId:tenant(r.ownerTenantId)?.enterpriseId,templateRef:clone(r.templateRef),method,followupAccountId:r.assignedAccountId,actorAccountId:a.accountId,assignedAccountId:method==='MANUAL'?(resolved.resource.accountId||a.accountId):'',actualAnswerAccountId:'',humanAnswerState:method==='PREDICTIVE'?'UNKNOWN':method==='AI'?'NONE':'KNOWN',resourceId:resolved.resource.resourceId||resolved.resource.id||'',executionPriority:fourPriority(r,n),queuedAt:fourQueuedAt(r),resourceSnapshot:clone(resolved.resource),sceneSnapshot:clone(resolved.sceneSnapshot||scene),aiSceneId:scene?.id||'',basis:clone(schema.basis),formSchema:schema,accepted:true,remoteId:'LOCAL-MOCK-'+segmentId,ended:false,saved:false,contentSaved:false,archived:false,retriesCompleted:false,resultState:'pending',startedAt:at,calls:[],events:[],simulation:true};
    if(aiImportParameterSnapshot)seg.aiImportParameterSnapshot=clone(aiImportParameterSnapshot);if(fourDirect(r))for(const key of ['runId','nodeId','nodeRunId','templateRef'])delete seg[key];fourStage(r).segments.push(seg);fourStage(r).operatorAccountIds=[...new Set([...fourStage(r).operatorAccountIds,a.accountId,seg.assignedAccountId].filter(Boolean))];r.execution={state:'running',noMoreCalls:false,followupId:segmentId};r.revision++;return seg;
  }
  function start(id,input={},opts={}){
    try{const state=read(),prior=opts.requestId&&state.requests.find(q=>q.requestId===opts.requestId);let method;if(prior){const signature=JSON.parse(prior.signature);requireThat(signature.kind==='start'&&signature.recordId===id,'REQUEST_CONFLICT','同请求身份不能用于其他办理');method=signature.payload.method;}else{const record=fourActive(state,id,opts),node=fourHandling(state,record);requireThat(['PROCESS','DIRECT'].includes(node.type),'CALL_NODE','当前不是呼叫节点');method=node.methods[0];}requireThat(!input.method||input.method===method,'METHOD','方式由当前固定呼叫节点确定');input={...input,method};}catch(e){return error(e);}
    return commit('start',id,input,opts,(s,a)=>fourStartRecord(s,id,input,opts,a));
  }
  function startMany(ids,input={},opts={}){
    let method;try{requireThat(Array.isArray(ids)&&ids.length&&new Set(ids).size===ids.length,'RECORDS','请选择准确业务记录');const state=read(),prior=opts.requestId&&state.requests.find(q=>q.requestId===opts.requestId);if(prior){const signature=JSON.parse(prior.signature);requireThat(signature.kind==='startMany','REQUEST_CONFLICT','请求身份不属于本组起呼');method=signature.payload.method;}else{const row=recordById(state,ids[0]);requireThat(visible(row,access())&&row.ownerTenantId===access().tenantId,'BUSINESS_DENIED','没有本组办理范围');method=fourHandling(state,row).methods?.[0];}requireThat(['AI','PREDICTIVE'].includes(method),'BULK_METHOD','本组起呼仅用于AI或预外呼；人工由本人逐条办理');}catch(e){return error(e);}
    const payload={recordIds:clone(ids),method,input:{...clone(input),method}};
    return commit('startMany',null,payload,opts,(s,a)=>{let group;const records=ids.map(id=>{const r=fourOwned(s,id),n=fourHandling(s,r),key=fourAssignmentGroupKey(r,n);requireThat(n.methods?.[0]===method,'BULK_METHOD','本组外呼方式不一致');if(group)requireThat(group===key,'ASSIGN_GROUP','不同分类、模板节点、方式或场景请分组发起');else group=key;return r;});records.sort(fourExecutionOrder);const rows=[];
      for(const r of records)try{const seg=fourStartRecord(s,r.recordId,{...input,method},{expectedRevision:opts.expectedRevisions?.[r.recordId]},a);rows.push({recordId:r.recordId,businessCode:r.businessCode,status:'success',message:'本次执行已受理；不代表已拨打或已完成',segmentId:seg.segmentId,followupId:seg.followupId});}catch(e){rows.push({recordId:r.recordId,businessCode:r.businessCode,status:'failed',message:e.message,code:e.code||'START_FAILED'});}
      return {recordIds:clone(ids),method,rows,summary:{success:rows.filter(r=>r.status==='success').length,failed:rows.filter(r=>r.status==='failed').length,unknown:0}};
    });
  }

  function fourOriginal(s,id,segmentId){const r=recordById(s,id),stage=r.rounds.find(q=>q.segments.some(seg=>seg.segmentId===segmentId)),seg=stage?.segments.find(seg=>seg.segmentId===segmentId);requireThat(r.fourNodeSchema&&seg&&seg.recordId===id,'FOLLOWUP_ID','原跟进身份无法准确关联');return {r,round:stage,seg,a:access()};}
  function fourValueToken(r){return 'FOUR-VALUES-'+fingerprint({recordId:r.recordId,runId:r.runId,directCycleId:r.directCycleId,stageId:fourStage(r).roundId,values:r.followupValues,sources:r.currentValueSources});}
  function fourValueConflicts(r,seg,values,provided){if(r.ownerTenantId!==seg.tenantId||fourStage(r).roundId!==seg.roundId||!fourSameContext(r,seg))return [];
    const state=(o,id)=>({provided:Object.hasOwn(o||{},id),value:o?.[id]});return seg.basis.fields.filter(f=>!provided||provided.includes(f.id)).filter(f=>JSON.stringify(state(seg.basis.values,f.id))!==JSON.stringify(state(r.followupValues,f.id))&&(!values||JSON.stringify(state(values,f.id))!==JSON.stringify(state(r.followupValues,f.id)))).map(f=>({fieldId:f.id,label:f.label,before:clone(seg.basis.values[f.id]),current:clone(r.followupValues[f.id]),...(values?{submitted:clone(values[f.id])}:{})}));
  }
  function flowCall(r,seg){const bound={...r,categoryId:fourSegmentCategory(r,seg),fields:clone(seg.basis.importValues),categorySnapshot:{...r.categorySnapshot,name:seg.basis.category.label,fields:clone(seg.basis.importFields),categoryDefinition:clone(seg.basis.category)}};return {...fourBaseFlowCall(bound,seg),accountId:seg.method==='MANUAL'?seg.assignedAccountId:seg.actualAnswerAccountId,followupId:seg.followupId,runId:seg.runId,businessFlowRoutingFields:{schema:1,timeZone:'Asia/Shanghai'}};}
  function formCatalog(source){try{const s=read(),r=recordById(s,source.businessFlowRecordId);const {seg,a}=fourOriginal(s,r.recordId,source.businessFlowSegmentId),actual=seg.method==='MANUAL'?seg.assignedAccountId:seg.actualAnswerAccountId;requireThat(a.tenantId===seg.tenantId&&(a.accountId===actual||visible(r,a)),'FORM_SCOPE','没有原表单读取范围');return {ok:true,rows:[clone(seg.basis.category)],fields:fourFormDefinitions(seg.basis),scope:{brandId:r.brandId,tenantId:seg.tenantId,enterpriseId:seg.enterpriseId},revision:seg.followupId,context:CustomerBusiness.context(),formSource:'BUSINESS_FLOW_MOCK'};}catch(e){return {ok:false,rows:[],fields:[],message:e.message};}}
  function fourNeedsHuman(seg){return !seg.factConflict&&(seg.calls||[]).some(call=>call.dialed&&call.customerAnswered===true&&(seg.method==='MANUAL'||seg.method==='PREDICTIVE'&&!!seg.actualAnswerAccountId&&call.actualAnswerAccountId===seg.actualAnswerAccountId));}
  function editableManual(s,id,segmentId,opts={}){
    const found=fourOriginal(s,id,segmentId),{r,seg,a}=found;
    requireThat(['MANUAL','PREDICTIVE'].includes(seg.method)&&seg.ended&&fourNeedsHuman(seg),'RESULT_STATE','原人工办理尚未实际结束');
    const actual=seg.method==='MANUAL'?seg.assignedAccountId:seg.actualAnswerAccountId;
    requireThat(actual&&a.accountId===actual&&a.tenantId===seg.tenantId,'ACTUAL_ANSWER','仅准确关联本次通话的实际办理/接听人可填写，管理员不能代填');
    requireThat(!seg.contentSaved,'SEALED_CONTENT','本次内容已正式保存，纠错请直接更正当前有效值');
    if(opts.expectedRevision!==undefined)requireThat(Number(opts.expectedRevision)===r.revision,'STALE','资料或办理状态已变化，请保留输入重新核对');return found;
  }
  function followupContext(id,segmentId){return safe(()=>{
    const s=read(),{r,seg}=fourOriginal(s,id,segmentId),a=access(),actual=seg.method==='MANUAL'?seg.assignedAccountId:seg.actualAnswerAccountId;
    requireThat(a.tenantId===seg.tenantId&&(a.accountId===actual||visible(r,a)),'FOLLOWUP_READ','没有本次跟进的读取范围');
    const call={...flowCall(r,seg),accountId:actual,followupId:seg.followupId,runId:seg.runId,businessFlowRoutingFields:{schema:1,timeZone:'Asia/Shanghai'}};
    const sameStage=r.ownerTenantId===seg.tenantId&&fourStage(r).roundId===seg.roundId&&fourSameContext(r,seg);
    return {runStatus:(r.runs||[]).find(run=>run.runId===seg.runId)?.status||fourDirectCycle(r)?.status||'',abandoned:seg.abandoned===true,abandonmentSettled:fourAbandonedSettled(r,seg),call,values:{...clone(seg.result?.values||seg.basis.values),businessType:fourSegmentCategory(r,seg)},fields:clone(seg.basis.fields),basis:clone(seg.basis),revision:r.revision,actualAccountId:actual,contentSaved:seg.contentSaved,canSave:!seg.contentSaved&&seg.ended&&fourNeedsHuman(seg)&&actual===a.accountId&&a.tenantId===seg.tenantId,valueConflicts:fourValueConflicts(r,seg),valueConfirmationToken:sameStage?fourValueToken(r):undefined,tagContext:{state:'ABSENT'},fieldContexts:{fields:[],byFieldId:{}}};
  });}
  function fourStoreValues(r,stage,seg,values,provided,source) {
    if(r.ownerTenantId!==stage.tenantId||fourStage(r).roundId!==stage.roundId||!fourSameContext(r,seg))return;
    for(const id of provided){r.followupValues[id]=clone(values[id]);r.currentValueSources[id]={kind:source,followupId:seg.followupId,stageId:stage.roundId,runId:seg.runId,directCycleId:seg.directCycleId,at:now()};
      const def=seg.basis.fields.find(f=>f.id===id),normalized=DFlowRouting.normalizeSavedField(values[id],def.type,'Asia/Shanghai');
      if(normalized.ok&&!fourDirect(r))r.routingFieldValues={...(r.routingFieldValues||{}),[id]:{state:'KNOWN',value:clone(normalized.value),fieldId:id,tenantId:stage.tenantId,runId:seg.runId,categoryId:r.categoryId,categoryVersion:fourRun(r).planSnapshot.categoryRef.version,fieldsVersion:fourRun(r).planSnapshot.categoryRef.fieldsVersion,roundId:stage.roundId,nodeRunId:seg.nodeRunId,segmentId:seg.segmentId,sourceFollowupId:seg.followupId}};
    }
  }
  function fourSegmentExecutionStopped(seg){return seg.ended===true&&seg.retriesCompleted===true&&!seg.factConflict&&Array.isArray(seg.calls)&&seg.calls.every(call=>call.state==='ENDED');}
  function fourMissingHumanContent(seg){return !seg.contentSaved&&['MANUAL','PREDICTIVE'].includes(seg.method)&&(seg.method==='MANUAL'||seg.humanAnswerState!=='NONE')&&(seg.calls||[]).some(call=>call.dialed===true&&call.customerAnswered!==false);}
  function fourMissingContentContext(r,seg){
    const actualAccountId=seg.method==='MANUAL'?seg.assignedAccountId:seg.actualAnswerAccountId;
    return {schema:1,recordId:r.recordId,runId:seg.runId,segmentId:seg.segmentId,followupId:seg.followupId,tenantId:seg.tenantId,method:seg.method,actualAccountId:actualAccountId||'',humanAnswerState:seg.humanAnswerState||'UNKNOWN',fieldSchemaFingerprint:fingerprint(seg.basis?.fieldDefinitions||seg.basis?.fields||[]),fields:(seg.basis?.fields||[]).map(field=>({fieldId:field.id,label:field.label,type:field.type,required:field.required===true})),calls:(seg.calls||[]).map(call=>({attemptId:call.attemptId,dialed:call.dialed===true,customerAnswered:typeof call.customerAnswered==='boolean'?call.customerAnswered:'UNKNOWN',actualAnswerAccountId:call.actualAnswerAccountId||''}))};
  }
  function fourMissingConfirmationValid(r,seg){
    const decision=seg.abandonmentSettlement;
    return decision?.schema===1&&decision.confirmMissingContent===true&&decision.recordId===r.recordId&&decision.runId===seg.runId&&decision.segmentId===seg.segmentId&&decision.confirmedTenantId===seg.tenantId&&decision.confirmedRole==='ADMIN'&&!!decision.confirmedBy&&!!String(decision.reason||'').trim()&&Number.isFinite(Date.parse(decision.confirmedAt))&&decision.missingContextFingerprint===fingerprint(fourMissingContentContext(r,seg));
  }
  function fourAbandonedSettled(r,seg){
    const run=(r.runs||[]).find(item=>item.runId===seg.runId);if(!seg.abandoned||run?.status!=='ABANDONED'||!fourSegmentExecutionStopped(seg))return false;
    if(seg.contentSaved){const actual=seg.method==='MANUAL'?seg.assignedAccountId:seg.actualAnswerAccountId;return !!seg.contentSnapshot&&(!fourNeedsHuman(seg)||!!actual&&seg.contentSnapshot.archiver===actual);}
    return !fourMissingHumanContent(seg)||fourMissingConfirmationValid(r,seg);
  }
  function fourMissingContentEntry(r,seg){
    const context=fourMissingContentContext(r,seg),values=seg.basis?.values||{},empty=value=>value===undefined||value===null||value===''||Array.isArray(value)&&!value.length;
    return {segmentId:seg.segmentId,followupId:seg.followupId,runId:seg.runId,roundId:seg.roundId,tenantId:seg.tenantId,method:seg.method,actualAccountId:context.actualAccountId,humanAnswerState:context.humanAnswerState,contentSaved:false,archiveState:seg.archiveState||'WAITING_CONTENT',missingRequiredFields:context.fields.filter(field=>field.required&&empty(values[field.fieldId])),fields:clone(context.fields),missingContextFingerprint:fingerprint(context),confirmedMissingContent:fourMissingConfirmationValid(r,seg)};
  }
  function fourAbandonAnalysis(s,r,run){
    const actor=access(),segments=fourSegments(r).filter(seg=>seg.runId===run.runId&&seg.handlingMode!=='DIRECT'),missing=segments.filter(fourMissingHumanContent),ownMissing=missing.filter(seg=>seg.tenantId===actor.tenantId),foreignMissing=missing.filter(seg=>seg.tenantId!==actor.tenantId&&!fourAbandonedSettled(r,seg)),executionBlockers=[];
    const requests=(s.requests||[]).filter(request=>request.status==='unknown'&&(request.recordId===r.recordId||request.recordIds?.includes(r.recordId)));for(const request of requests)executionBlockers.push({code:'REQUEST_UNKNOWN',message:'原办理请求结果仍待核对，确认不能代替核对',...(requestAllowed(request,actor)?{requestId:request.requestId}:{})});
    for(const seg of segments){if(seg.factConflict)executionBlockers.push({code:'FACT_CONFLICT',segmentId:seg.tenantId===actor.tenantId?seg.segmentId:undefined,message:'原执行存在事实冲突，须先可靠核对'});else if(!fourSegmentExecutionStopped(seg))executionBlockers.push({code:'EXECUTION_ACTIVE',segmentId:seg.tenantId===actor.tenantId?seg.segmentId:undefined,message:'原执行、排队、重试或停止回执尚未可靠收敛'});}
    if(r.runId===run.runId&&(r.execution?.state!=='ended'||r.execution?.noMoreCalls!==true))executionBlockers.push({code:'EXECUTION_ACTIVE',message:'当前原执行尚未取得不再呼叫的可靠终态'});
    if(foreignMissing.length)executionBlockers.push({code:'FOREIGN_CONTENT',message:'其他租户原段仍有必要内容缺失，须由原有权人员处理，当前管理员不能代为确认',count:foreignMissing.length});
    const missingContent=ownMissing.map(seg=>fourMissingContentEntry(r,seg)),confirmationFingerprint='ABANDON-'+fingerprint({recordId:r.recordId,runId:run.runId,missing:missingContent.map(item=>({segmentId:item.segmentId,context:item.missingContextFingerprint,confirmed:item.confirmedMissingContent})),foreign:foreignMissing.map(seg=>seg.segmentId)});
    return {runId:run.runId,runStatus:run.status,missingContent,foreignMissingCount:foreignMissing.length,canRegisterStopping:executionBlockers.some(blocker=>['EXECUTION_ACTIVE','REQUEST_UNKNOWN','FACT_CONFLICT'].includes(blocker.code)),requiresMissingContentConfirmation:missingContent.some(item=>!item.confirmedMissingContent),canConfirmMissingContent:missingContent.length>0,executionBlockers,issues:executionBlockers.map(item=>item.message),confirmationFingerprint,settled:run.status==='ABANDONED'&&segments.every(seg=>seg.archived===true&&fourSegmentExecutionStopped(seg)||fourAbandonedSettled(r,seg))&&requests.length===0};
  }
  function fourLifecycleOwner(s,id,opts={}){const r=fourOwned(s,id,opts),actor=access();requireThat(actor.roleCode==='ADMIN'&&actor.tenantId===r.ownerTenantId&&fourPermission('abandon',r),'ABANDON_DENIED','仅当前负责租户有权管理员可确认废弃收尾');return {r,actor};}
  function fourConfirmMissingContent(r,run,input,opts,analysis){
    requireThat(input.runId===run.runId,'STALE_RUN','原运行已变化，请重新打开并核对');requireThat(opts.expectedRevision!==undefined,'ABANDON_CONFIRMATION_STALE','请读取准确缺失范围后明确确认');requireThat(input.confirmationFingerprint===analysis.confirmationFingerprint,'ABANDON_CONFIRMATION_STALE','缺失内容、人工参与或实际办理人已变化，请刷新重核后重新确认');
    const actor=access();for(const item of analysis.missingContent.filter(entry=>!entry.confirmedMissingContent)){
      const seg=fourSegments(r).find(value=>value.segmentId===item.segmentId&&value.runId===run.runId);requireThat(seg?.tenantId===actor.tenantId,'ABANDON_CONTENT_SCOPE','不能代其他租户确认原段缺失内容');const previous=seg.abandonmentSettlement,history=clone(previous?.confirmationHistory||[]);if(previous){const snapshot=clone(previous);delete snapshot.confirmationHistory;history.push(snapshot);}
      seg.abandonmentSettlement={schema:1,recordId:r.recordId,runId:run.runId,segmentId:seg.segmentId,confirmMissingContent:true,confirmedRole:'ADMIN',confirmedBy:actor.accountId,confirmedTenantId:actor.tenantId,confirmedAt:now(),reason:String(input.reason).trim(),missingContextFingerprint:item.missingContextFingerprint,missingContext:fourMissingContentContext(r,seg),confirmationHistory:history};
    }
  }
  function fourSettleAbandonedSegments(r,run,onlyTenantId){
    for(const seg of fourSegments(r).filter(value=>value.runId===run.runId&&(!onlyTenantId||value.tenantId===onlyTenantId))){if(seg.archived===true)continue;seg.abandoned=true;seg.archiveState='ABANDONED';seg.completedFollowup=false;if(!seg.abandonmentSettlement)seg.abandonmentSettlement={schema:1,recordId:r.recordId,runId:run.runId,segmentId:seg.segmentId,confirmMissingContent:false};if(fourAbandonedSettled(r,seg)){seg.abandonmentSettlement.settledAt=seg.abandonmentSettlement.settledAt||now();seg.abandonmentSettlement.contentState=seg.contentSaved?'SAVED_BY_ORIGINAL_PERSON':fourMissingHumanContent(seg)?'CONFIRMED_MISSING':'NO_HUMAN_CONTENT_REQUIRED';}}
  }
  function fourFinalize(r,seg) {
    if(seg.abandoned){seg.archiveState='ABANDONED';seg.completedFollowup=false;if(seg.abandonmentSettlement&&seg.contentSaved)seg.abandonmentSettlement.contentSavedLaterAt=seg.savedAt||now();return;}
    if(seg.archived)return;
    const humanKnown=seg.method!=='PREDICTIVE'||fourNeedsHuman(seg)||seg.humanAnswerState==='NONE'||seg.calls.filter(c=>c.dialed).every(c=>c.customerAnswered===false);
    const plan=seg.handlingMode==='DIRECT'?null:(r.runs||[]).find(run=>run.runId===seg.runId)?.planSnapshot,rules=(plan?.edges||[]).filter(edge=>edge.fromNodeId===seg.nodeId).flatMap(edge=>edge.conditions?.rules||[]),needsStatus=rules.some(rule=>['CALL_STATUS','AI_TAG'].includes(rule.source))||fourResultConsumers(plan,seg.nodeId).length>0,needsTags=rules.some(rule=>rule.source==='AI_TAG')||fourAIRequirements(plan,seg.nodeId).length>0;
    const evidenceReady=(!needsStatus||seg.routingEvidence?.state==='KNOWN')&&(!needsTags||['KNOWN','NONE'].includes(seg.routingEvidence?.tags?.state))&&seg.routingEvidence?.state!=='PENDING';
    const factsReady=seg.ended===true&&seg.retriesCompleted===true&&humanKnown&&evidenceReady&&!seg.factConflict&&!seg.calls.some(c=>c.dialed&&(c.state!=='ENDED'||typeof c.customerAnswered!=='boolean'));
    const human=fourNeedsHuman(seg);
    if(factsReady&&!human&&!seg.contentSaved){seg.contentSnapshot={schema:1,basis:clone(seg.basis),values:{...clone(seg.basis.values),businessType:fourSegmentCategory(r,seg)},modifiedFieldIds:[],archiver:'SYSTEM',followupAccountId:seg.followupAccountId,runId:seg.runId,followupId:seg.followupId,savedAt:now(),calls:seg.calls.map(c=>c.attemptId)};seg.contentSaved=true;seg.saved=true;seg.savedAt=seg.contentSnapshot.savedAt;seg.result={summary:seg.calls.some(c=>c.dialed)?'系统按真实执行终态归档':'未实际拨打的启动异常',values:{...clone(seg.basis.values),businessType:fourSegmentCategory(r,seg)},system:true};}
    if(factsReady&&seg.contentSaved){seg.archived=true;seg.archiveState='COMPLETE';seg.archivedAt=now();seg.occurredAt=seg.occurredAt||seg.endedAt;seg.resultState='saved';seg.completedFollowup=seg.calls.some(c=>c.dialed);}
    else seg.archiveState=human&&!seg.contentSaved?'WAITING_CONTENT':'WAITING_FACTS';
  }
  function saveResult(id,input,opts={}){return commit('saveResult',id,input,opts,s=>{
    const {r,round,seg,a}=editableManual(s,id,input.segmentId,opts),originalCategoryId=fourSegmentCategory(r,seg);let values=clone(input.values||{});requireThat(!values.businessType||canonicalCategory(values.businessType)===canonicalCategory(originalCategoryId),'RESULT_CATEGORY','只能按原跟进捕获的分类填写，不能使用业务当前分类替代');const provided=input.providedFieldIds||Object.keys(values).filter(k=>seg.basis.fields.some(f=>f.id===k));
    requireThat(Array.isArray(provided),'FIELDS','实际修改字段标记必须为集合');
    for(const field of seg.basis.fields)if(Object.hasOwn(values,field.id)&&!provided.includes(field.id)){const original=seg.basis.values[field.id],submitted=values[field.id],same=JSON.stringify(original)===JSON.stringify(submitted),defaultEmpty=!Object.hasOwn(seg.basis.values,field.id)&&(submitted===''||submitted===undefined);requireThat(same||defaultEmpty,'FIELDS_UNDECLARED','字段值已变更但未声明为本次修改：'+field.label);}
    const confirming=[...new Set([...provided,...seg.basis.fields.filter(field=>Object.hasOwn(seg.basis.values,field.id)&&seg.basis.values[field.id]!==undefined).map(field=>field.id)])],confirmedValues={...clone(seg.basis.values),...values};const conflicts=fourValueConflicts(r,seg,confirmedValues,confirming);if(conflicts.length&&input.valueConfirmationToken!==fourValueToken(r)){const e=Error('当前有效值已在本次开始后更新，请核对差异并明确确认后保存，原草稿已保留');e.code='VALUE_CONFLICT';e.data={conflicts,valueConflicts:conflicts,valueConfirmationToken:fourValueToken(r)};throw e;}
    if(window.CustomerFollowup?.validate){const checked=CustomerFollowup.validate({...values,businessType:originalCategoryId},flowCall(r,seg),seg.basis.values);requireThat(checked.ok,'RESULT_FIELDS',checked.message||'请核对填写字段');values=checked.values;}
    requireThat(new Set(provided).size===provided.length&&provided.every(k=>seg.basis.fields.some(f=>f.id===k)&&Object.hasOwn(values,k)),'FIELDS','请保留实际提交字段标记');
    for(const f of seg.basis.fields){const value=Object.hasOwn(values,f.id)?values[f.id]:seg.basis.values[f.id],empty=value===null||value===undefined||value===''||Array.isArray(value)&&!value.length;requireThat(f.type!=='phone'||value===undefined||value===null||typeof value==='string','FIELD_TYPE',f.label+'须为文本联系电话');requireThat(!f.required||!empty,'RESULT_REQUIRED',f.label+'必填');if(!empty){const normalized=f.type==='interface'?{ok:true,value}:DFlowRouting.normalizeSavedField(value,f.type,'Asia/Shanghai');requireThat(normalized.ok,'FIELD_TYPE',f.label+'类型不符');if(Object.hasOwn(values,f.id))values[f.id]=clone(normalized.value);if(['select','multiselect'].includes(f.type))requireThat((Array.isArray(value)?value:[value]).every(v=>f.options.some(o=>o.id===v&&o.enabled!==false)),'FIELD_OPTION',f.label+'选项不可新选择');}}
    const final={...clone(seg.basis.values),...Object.fromEntries(provided.map(id=>[id,clone(values[id])])),businessType:originalCategoryId};seg.contentSnapshot={schema:1,basis:clone(seg.basis),values:clone(final),modifiedFieldIds:clone(provided),confirmedFieldIds:clone(confirming),archiver:a.accountId,followupAccountId:seg.followupAccountId,runId:seg.runId,followupId:seg.followupId,savedAt:now(),calls:seg.calls.map(c=>c.attemptId)};
    seg.contentSaved=true;seg.saved=true;seg.savedAt=seg.contentSnapshot.savedAt;seg.occurredAt=seg.endedAt;seg.result={summary:String(input.summary||'本次跟进内容已保存'),values:clone(final)};seg.fieldsSnapshot=seg.basis.fields.map(f=>({label:f.label,value:clone(final[f.id]??'')}));
    seg.routingFieldSnapshot=seg.handlingMode==='DIRECT'?undefined:{schema:1,recordId:id,tenantId:seg.tenantId,roundId:round.roundId,nodeRunId:seg.nodeRunId,segmentId:seg.segmentId,categoryRef:clone(templateVersion(s,seg.templateRef).categoryRef),timeZone:'Asia/Shanghai',providedFieldIds:clone(provided),confirmedFieldIds:clone(confirming),values:Object.fromEntries(confirming.map(k=>[k,clone(final[k])]))};
    fourStoreValues(r,round,seg,final,provided,'FOLLOWUP');fourFinalize(r,seg);r.revision++;return seg;
  });}
  function fourCurrentExecution(r,seg){return fourSameContext(r,seg)&&r.ownerTenantId===seg.tenantId&&(seg.handlingMode==='DIRECT'||r.nodeRunId===seg.nodeRunId)&&r.execution?.followupId===seg.followupId&&fourLast(r)?.followupId===seg.followupId;}
  function fourCheckTagEvidence(s,seg,proof){
    if(seg.method!=='AI'||proof.tags===undefined)return;
    const plan=seg.handlingMode==='DIRECT'?{categoryRef:{brandId:seg.basis.category.brandId||s.records.find(r=>r.recordId===seg.recordId)?.brandId,categoryId:seg.basis.category.id}}:templateVersion(s,seg.templateRef);
    const keys=['supplierId','tenantId','tenantType','tagSceneId','categoryId','brandId','revision'],actual=seg.sceneSnapshot;
    requireThat(actual&&String(actual.id||actual.sceneId)===String(seg.aiSceneId),'ROUTING_TAG_SCENE','本次AI执行场景快照不完整，不能确认标签事实');
    const context=actual.aiContexts?.find(row=>row.tenantId===seg.tenantId&&row.categoryId===plan.categoryRef.categoryId&&row.brandId===plan.categoryRef.brandId&&keys.every(key=>row[key]===proof.tags?.[key]));
    requireThat(context,'ROUTING_TAG_SCENE','标签回执与本次实际AI场景或配置版本不一致，不能归入本次跟进');
  }
  function fourEventConflict(r,seg,input,reason){(seg.conflicts||=[]).push({eventId:input.eventId,at:now(),input:clone(input),reason});seg.factConflict=true;seg.archiveState='WAITING_REVIEW';if(fourCurrentExecution(r,seg))r.execution={state:'unknown',noMoreCalls:false,followupId:seg.followupId};}
  function fourOriginalReceiptWindow(r,seg){
    const stillHandling=fourBusinessActive(r)||!fourDirect(r)&&fourRun(r)?.status==='ABANDONING',terminal=seg.ended===true&&seg.retriesCompleted===true&&(seg.calls||[]).every(call=>call.state==='ENDED');
    return fourCurrentExecution(r,seg)&&stillHandling&&seg.accepted===true&&!seg.abandoned&&!seg.archived&&!terminal;
  }
  function fourEventSource(r,seg,input){
    const expected={recordId:r.recordId,followupId:seg.followupId,runId:seg.runId,directCycleId:seg.directCycleId,nodeRunId:seg.nodeRunId,roundId:seg.roundId,stageId:seg.stageId,tenantId:seg.tenantId,method:seg.method,resourceId:seg.resourceId};
    for(const [key,value]of Object.entries(expected))if(Object.hasOwn(input,key)&&input[key]!==undefined)requireThat((input[key]??null)===(value??null),'EVENT_SOURCE','回执来源与原已受理段的'+key+'不一致，不能挂到其他运行或周期');
  }
  function executionEvent(id,input,opts={}){return commit('event',id,input,opts,s=>{
    const {r,round,seg,a}=fourOriginal(s,id,input.segmentId);const originalNode=seg.handlingMode==='DIRECT'?fourDirectSpec(r,seg):templateVersion(s,seg.templateRef).nodes.find(n=>n.nodeId===seg.nodeId),answerProof=input.type==='answered'&&input.actualAnswerAccountId===a.accountId&&a.tenantId===seg.tenantId?window.DFourNodeExecution?.validateAnswer?.({...fourProviderContext(r,originalNode,seg.method,seg.aiSceneId),tenantId:seg.tenantId,segment:clone(seg),input:clone(input)}):null;
    requireThat(a.roleCode!=='SUPER_ADMIN'&&a.tenantId===seg.tenantId&&(a.roleCode==='ADMIN'||[seg.actorAccountId,seg.assignedAccountId,seg.actualAnswerAccountId].includes(a.accountId)||answerProof?.ok),'EVENT_SCOPE','当前人员不能向无权执行写入结果');requireThat(input.eventId,'EVENT_ID','模拟事件必须有稳定事件标识');fourEventSource(r,seg,input);
    const signature=JSON.stringify(input),prior=seg.events.find(e=>e.eventId===input.eventId);if(prior){if(prior.signature!==signature){fourEventConflict(r,seg,input,'重复事件含不同内容');r.revision++;}return seg;}
    const type=input.type,at=input.occurredAt||now(),currentRun=fourSameContext(r,seg)&&r.ownerTenantId===seg.tenantId&&r.nodeRunId===seg.nodeRunId;requireThat(Number.isFinite(Date.parse(at)),'EVENT_TIME','事件发生时间须可靠');
    if(type==='attempt-start'||type==='attempt-dialed'){
      requireThat(input.attemptId,'ATTEMPT_ID','每次拨打须准确尝试标识');let call=seg.calls.find(c=>c.attemptId===input.attemptId);
      if(!call){requireThat(fourOriginalReceiptWindow(r,seg),'EXECUTION_CLOSED','原运行已关闭或没有准确已受理执行，不能新增尝试');if(!fourBusinessActive(r))requireThat(input.actualDialed===true||type==='attempt-dialed','EXECUTION_CLOSED','停止处理中不再新增排队安排，只登记原受理执行的真实回执');requireThat(!seg.calls.some(c=>c.state!=='ENDED'),'ATTEMPT_ACTIVE','同次办理已有在途或排队尝试，不能并行拨打');call={attemptId:input.attemptId,callId:input.callId||'',runId:seg.runId,followupId:seg.followupId,tenantId:seg.tenantId,phone:seg.basis.importValues.phone,startedAt:at,dialed:false,state:'QUEUED',simulation:true};seg.calls.push(call);}if((input.actualDialed===true||type==='attempt-dialed')&&!call.dialed){if(!fourOriginalReceiptWindow(r,seg)||call.state==='ENDED')fourEventConflict(r,seg,input,'已关闭或非当前办理的尝试收到新增拨打事实');else{call.dialed=true;call.dialedAt=at;call.state='RUNNING';}}
    }else if(type==='answered'){
      const call=seg.calls.find(c=>c.attemptId===input.attemptId);requireThat(call&&call.dialed,'ATTEMPT_ID','请先准确关联实际拨打');requireThat(input.customerAnswered===undefined||typeof input.customerAnswered==='boolean','ANSWER_VALUE','客户接通事实必须明确boolean，未知不能当未接通');requireThat(input.customerAnswered===undefined||typeof call.customerAnswered!=='boolean'||call.customerAnswered===input.customerAnswered,'CALL_CONFLICT','已有明确客户接通事实，不接受相反回执覆盖');if(input.customerAnswered!==undefined)call.customerAnswered=input.customerAnswered;
      if(input.actualAnswerAccountId){requireThat(input.actualAnswerAccountId===a.accountId&&answerProof?.ok,'ANSWER_IDENTITY','仅实际接听本人凭准确坐席映射登记，不能由管理员指定代填人');if(seg.humanAnswerState==='NONE'||seg.actualAnswerAccountId&&seg.actualAnswerAccountId!==input.actualAnswerAccountId||seg.archived&&!seg.actualAnswerAccountId)fourEventConflict(r,seg,input,'已明确无人接听或已封存办理收到相反人工身份');else{seg.actualAnswerAccountId=input.actualAnswerAccountId;seg.humanAnswerState='KNOWN';call.actualAnswerAccountId=input.actualAnswerAccountId;}}
    }else if(type==='attempt-end'){
      const call=seg.calls.find(c=>c.attemptId===input.attemptId);requireThat(call,'ATTEMPT_ID','通话终态未关联原尝试');requireThat(input.customerAnswered===undefined||typeof input.customerAnswered==='boolean','ANSWER_VALUE','客户接通事实必须明确boolean，未知不能当未接通');if(call.endedAt&&input.occurredAt&&call.endedAt!==at||input.customerAnswered!==undefined&&typeof call.customerAnswered==='boolean'&&call.customerAnswered!==input.customerAnswered){fourEventConflict(r,seg,input,'已知终态或客户接通事实冲突');}else{call.state='ENDED';call.endedAt=call.endedAt||at;if(input.customerAnswered!==undefined)call.customerAnswered=input.customerAnswered;}
    }else if(type==='end'||type==='attempts-complete'||type==='result'||type==='call-result'||type==='start-failed'){
      if(type==='start-failed'){requireThat(!seg.calls.some(c=>c.dialed),'START_FAILED','已有真实拨打不能记作未执行');seg.startFailure=String(input.reason||'本地模拟明确启动失败');seg.ended=true;seg.endedAt=at;seg.retriesCompleted=true;}
      if(type==='end'){seg.ended=true;seg.endedAt=seg.endedAt||at;}
      if(type==='attempts-complete'||input.retriesCompleted===true||input.routingEvidence?.retriesCompleted===true){requireThat(seg.calls.every(c=>!c.dialed||c.state==='ENDED'),'CALLS_RUNNING','仍有真实通话未结束');seg.retriesCompleted=true;seg.ended=true;seg.endedAt=seg.endedAt||at;}
      if(input.humanAnswerState==='NONE'){requireThat(!seg.actualAnswerAccountId,'ANSWER_CONFLICT','已有准确接听人，不能改报无人接听');seg.humanAnswerState='NONE';}
      if(seg.ended&&seg.retriesCompleted)for(const queued of seg.calls.filter(call=>!call.dialed&&call.state==='QUEUED'))Object.assign(queued,{state:'ENDED',endedAt:at,canceled:true});
      if(input.routingEvidence){fourCheckTagEvidence(s,seg,input.routingEvidence);if(seg.handlingMode==='DIRECT')seg.executionEvidence=clone(input.routingEvidence);else captureRoutingEvidence(r,round,seg,input);}
    }else if(type==='accepted'){seg.accepted=true;}else if(type==='running'){requireThat(!seg.ended,'EVENT_ORDER','已结束执行不能重新运行');}else fail('EVENT_TYPE','不支持的本地模拟事件');
    seg.events.push({eventId:input.eventId,type,at,signature,runId:seg.runId,simulation:true});fourFinalize(r,seg);
    if(fourCurrentExecution(r,seg)&&!seg.factConflict){if(fourSegmentExecutionStopped(seg))r.execution={state:'ended',noMoreCalls:true,followupId:seg.followupId};else if(!seg.archived)r.execution={state:'running',noMoreCalls:false,followupId:seg.followupId};}r.revision++;return seg;
  });}
  function fourEnd(r,s){const n=fourNode(s,r);if(n.type==='END'){fourRun(r).status='ENDED';fourRun(r).endedAt=now();fourCloseOutcome(r,n);}}
  function routingEvaluations(s,r,a=access()){
    fourFlowOnly(r);
    const plan=templateVersion(s,r.templateRef),node=plan.nodes.find(n=>n.nodeId===r.nodeId);let eligible=a.roleCode!=='SUPER_ADMIN'&&a.tenantId===r.ownerTenantId&&visible(r,a)&&fourRun(r).status==='ACTIVE'&&!pending(s,r.recordId);
    try{noRunning(r);previousSaved(r);if(node.type==='PROCESS')fourCallExitGuard(s,r);}catch(_){eligible=false;}
    const evaluated=DFlowRouting.evaluate(plan,node,r,plan.routingCatalog,{eligible}),edgeEvaluations=evaluated.edgeEvaluations.map(edge=>({...edge,toName:plan.nodes.find(n=>n.nodeId===edge.toNodeId)?.name}));
    const evaluationToken='FOUR-EVAL-'+fingerprint({recordId:r.recordId,revision:r.revision,runId:r.runId,nodeRunId:r.nodeRunId,result:evaluated});
    return {recordId:r.recordId,revision:r.revision,runId:r.runId,ownerTenantId:r.ownerTenantId,roundId:fourStage(r).roundId,templateRef:clone(r.templateRef),nodeId:r.nodeId,evaluationToken,edgeEvaluations,selectedEdgeId:evaluated.selectedEdgeId,pending:evaluated.pending,policy:'FIRST_MATCH_V1'};
  }
  function advance(id,input,opts={}){return commit('advance',id,input,opts,s=>{const r=fourActive(s,id,opts),n=fourNode(s,r);requireThat(n.type==='PROCESS','NODE_ACTION','请按转交节点办理归属');noRunning(r);previousSaved(r);fourCallExitGuard(s,r);const chosen=selectPath(s,r,input,opts),next=nodeOf(s,r.templateRef,chosen.edge.toNodeId);requireThat(next.type!=='PROCESS'||fourRecipientMatches(next.recipient,bind(r.ownerTenantId),{...next,_arrivedByTransfer:fourHasHandover(r)}),'CALL_RECIPIENT','下一呼叫承接范围不同，须先转交');enter(s,r,r.templateRef,next.nodeId,'ADVANCE');r.arrival={type:'ADVANCE',runId:r.runId,sourceTenantId:r.ownerTenantId,targetTenantId:r.ownerTenantId};fourEnd(r,s);return r;});}
  function fourIsLocalPath(edge){return edge?.recipient?.kind==='TENANT'&&edge.recipient.scope==='CURRENT';}
  function destinationRaw(s,r,a=access()){
    const plan=r._previewPlan||(r.templateRef?templateVersion(s,r.templateRef):null),node=plan?.nodes?.find(n=>n.nodeId===r.nodeId);
    if(node?.type==='TRANSFER'){
      const result=DFlowRouting.evaluate(plan,node,r,plan.routingCatalog,{eligible:true}),edge=plan.edges.find(item=>item.edgeId===result.selectedEdgeId);
      if(fourIsLocalPath(edge)){
        const source=bind(r.ownerTenantId),valid=source?.known===true&&source.brandId===r.brandId&&tenantValid(r.ownerTenantId);
        return {status:valid?'MATCHED':'PENDING',direction:'LOCAL',label:'本租户继续办理',reason:valid?'继续由当前负责租户办理，业务归属不变':'当前负责租户或品牌关联不可用',target:valid?{tenantId:r.ownerTenantId,name:tenant(r.ownerTenantId)?.name||r.ownerTenantId}:null,manualAllowed:false,candidates:[],resolutionToken:'LOCAL-DEST-'+fingerprint({recordId:r.recordId,revision:r.revision,owner:r.ownerTenantId,runId:r.runId,nodeRunId:r.nodeRunId,roundId:fourStage(r)?.roundId,edgeId:edge.edgeId,actor:[a.accountId,a.tenantId,a.roleCode],source,valid})};
      }
    }
    return fourBaseDestinationRaw(s,r,a);
  }
  function fourTransferTarget(s,r,edge,input={}) {
    requireThat(fourLine(r.categoryId,r.categorySnapshot?.categoryDefinition),'TRANSFER_SCOPE','仅同品牌线索可在总部与门店之间转交');const rc=fourRecipient(edge.recipient);
    if(fourIsLocalPath(edge)){
      const source=bind(r.ownerTenantId);requireThat(source?.known===true&&source.brandId===r.brandId&&tenantValid(r.ownerTenantId),'TRANSFER_SCOPE','当前负责租户或品牌关联不可用');
      requireThat((!rc.tenantId||rc.tenantId===r.ownerTenantId)&&(!input.targetTenantId||input.targetTenantId===r.ownerTenantId),'TARGET_LOCAL','本租户分支不能指定其他租户');
      const plan=r._previewPlan||templateVersion(s,r.templateRef),next=plan.nodes.find(node=>node.nodeId===edge.toNodeId);requireThat(!next||next.type!=='PROCESS'||fourAIRecipient(fourDecorateNode(plan,next),r.ownerTenantId),'AI_TARGET_CONTEXT','当前租户不符合后继呼叫条件');return {...source,name:tenant(source.tenantId)?.name||source.tenantId,local:true};
    }
    const d=fourBaseDestinationRaw(s,r);requireThat(d&&d.status!=='PENDING','DESTINATION_PENDING',d?.reason||'目标待核');
    let target=d.target;if(d.status==='UNASSIGNED'){requireThat(d.manualAllowed,'MANUAL_ASSIGNMENT_DENIED',d.reason);const targetId=input.targetTenantId||rc.tenantId;target=d.candidates.find(x=>x.tenantId===targetId);}
    requireThat(target,'TARGET_INVALID','请由当前总部有权管理员同次选择合法门店');requireThat(target.tenantId!==r.ownerTenantId,'SAME_TENANT','目标与当前负责租户相同');
    const b=bind(target.tenantId),source=bind(r.ownerTenantId);requireThat(b.brandId===r.brandId&&b.kind!==source.kind&&tenantValid(b.tenantId),'TRANSFER_SCOPE','仅允许同品牌有效总部与门店互转');
    requireThat(rc.kind!=='HQ'||b.kind==='HQ','TARGET_KIND','此分支要求品牌唯一总部');requireThat(!rc.tenantId||rc.tenantId===b.tenantId,'TARGET_INTENT','分支指定目标与客户意向唯一锚定不一致');const plan=r._previewPlan||templateVersion(s,r.templateRef),next=plan.nodes.find(node=>node.nodeId===edge.toNodeId);requireThat(!next||next.type!=='PROCESS'||fourAIRecipient(fourDecorateNode(plan,next),b.tenantId),'AI_TARGET_CONTEXT','目标租户不符合后继呼叫及流转所需的AI标签配置');return {...b,name:tenant(b.tenantId)?.name};
  }
  function transferTargetsRaw(s,r){const n=fourNode(s,r),plan=templateVersion(s,r.templateRef),edges=plan.edges.filter(e=>e.fromNodeId===n.nodeId);const out=[];for(const edge of edges)try{out.push(fourTransferTarget(s,r,edge));}catch(_){}const d=destinationRaw(s,r);if(d?.manualAllowed)for(const t of d.candidates||[])out.push({...t,kind:'STORE'});return [...new Map(out.map(t=>[t.tenantId,t])).values()];}
  function fourHistorySnapshot(r,stage,at){let basis;try{basis=fourLatestBasis(r,false);}catch(_){basis=[...stage.segments].reverse().find(seg=>seg.basis)?.basis;}
    const categorySnapshot=clone(r.categorySnapshot);if(basis){categorySnapshot.fields=clone(basis.importFields);categorySnapshot.followupFields=clone(basis.fields);categorySnapshot.categoryDefinition=clone(basis.category);}
    return {schema:1,at,tenantId:stage.tenantId,roundId:stage.roundId,runId:r.runId,fields:clone(r.fields),followupValues:clone(r.followupValues||{}),categorySnapshot};}
  function transfer(id,input,opts={}){return commit('transfer',id,input,opts,(s,a)=>{
    const r=fourActive(s,id,opts),n=fourNode(s,r);requireThat(n.type==='TRANSFER','NODE_ACTION','当前不是转交节点');noRunning(r);previousSaved(r);const chosen=selectPath(s,r,input,opts),target=fourTransferTarget(s,r,chosen.edge,input),d=destinationRaw(s,r,a);
    requireThat(input.resolutionToken&&input.resolutionToken===d.resolutionToken,'STALE_DESTINATION','目标或映射已变化，请重新核对');const next=nodeOf(s,r.templateRef,chosen.edge.toNodeId);
    if(target.local){
      requireThat(next.type!=='PROCESS'||fourRecipientMatches(next.recipient,target,{...next,_arrivedByTransfer:fourHasHandover(r)}),'CALL_RECIPIENT','本租户分支与下个呼叫承接范围不一致');
      const tenantId=r.ownerTenantId,at=now();enter(s,r,r.templateRef,next.nodeId,'LOCAL_ROUTE',at);r.arrival={type:'LOCAL',runId:r.runId,sourceTenantId:tenantId,targetTenantId:tenantId};r.execution={state:'ended',noMoreCalls:true};Object.assign(r.events.at(-1),{sourceTenantId:tenantId,targetTenantId:tenantId,runId:r.runId,pathDecision:chosen.decision});fourEnd(r,s);return r;
    }
    requireThat(next.type!=='PROCESS'||fourRecipientMatches(next.recipient,target,{...next,_arrivedByTransfer:true}),'CALL_RECIPIENT','目标与下个呼叫承接范围不一致');
    const source=r.ownerTenantId,stage=fourStage(r),at=now();r.departures.push({tenantId:source,cutoffAt:at,roundNumber:stage.number,historySnapshot:fourHistorySnapshot(r,stage,at),authorizedAccountIds:[...new Set([...stage.operatorAccountIds,r.assignedAccountId,a.accountId].filter(Boolean))]});stage.closedAt=at;
    r.ownerTenantId=target.tenantId;r.assignment=null;r.assignedAccountId='';r.arrangement=null;r.routingFieldValues={};const nextStageId=uid('STAGE');r.rounds.push({roundId:nextStageId,number:stage.number+1,tenantId:target.tenantId,openedAt:at,operatorAccountIds:[],segments:[],entryTransfer:{runId:r.runId,roundId:nextStageId,sourceTenantId:source,targetTenantId:target.tenantId,at}});enter(s,r,r.templateRef,next.nodeId,'TRANSFER',at);r.arrival={type:'TRANSFER',runId:r.runId,sourceTenantId:source,targetTenantId:target.tenantId};r.execution={state:'ended',noMoreCalls:true};Object.assign(r.events.at(-1),{sourceTenantId:source,targetTenantId:target.tenantId,runId:r.runId,pathDecision:chosen.decision});fourEnd(r,s);return r;
  });}
  function fourPermission(action,r){const p=window.DFourNodeExecution?.can?.({action,record:clone(r),accountId:access().accountId,tenantId:access().tenantId});return p===true||p?.ok===true||p===undefined&&access().roleCode==='ADMIN';}
  function correctValues(id,input,opts={}){return commit('correctValues',id,input,opts,(s,a)=>{const r=current(s,id,opts);requireThat(r.fourNodeSchema&&fourPermission('correctValues',r),'CORRECTION_DENIED','没有本条业务资料维护权限');requireThat(String(input.reason||'').trim(),'REASON','请填写更正原因');const basis=fourLatestBasis(r,false),known=new Map([...basis.fields,...basis.importFields].map(f=>[f.id,f])),changes=[];
    for(const [key,rawValue]of Object.entries(input.values||{})){let value=clone(rawValue);const field=known.get(key);requireThat(field,'FIELD_SCOPE','只能更正当前允许维护的字段');const imported=field.usage==='IMPORT'||field.source==='IMPORT',phoneField=field.type==='phone'||imported&&[field.key,field.id,field.businessKey,field.targetKey].includes('phone'),target=imported?r.fields:r.followupValues,empty=value===null||value===''||Array.isArray(value)&&!value.length;
      requireThat(!phoneField||value===null||typeof value==='string','FIELD_PHONE','联系电话须为文本，不能转换其他类型');
      if(!empty){const normalized=field.type==='interface'?{ok:true,value}:DFlowRouting.normalizeSavedField(value,field.type==='phone'?'text':field.type,'Asia/Shanghai');requireThat(normalized.ok,'FIELD_TYPE',field.label+'类型不符');value=normalized.value;if(phoneField)requireThat(contactNumberValid(value),'FIELD_PHONE','联系电话格式不符');if(['select','multiselect'].includes(field.type))requireThat((Array.isArray(value)?value:[value]).every(v=>field.options.some(o=>o.id===v&&o.enabled!==false)),'FIELD_OPTION',field.label+'选项不合法');}
      changes.push({fieldId:key,before:clone(target[key]),after:clone(value),source:imported?'IMPORT':'FOLLOWUP'});target[key]=clone(value);if(imported&&field.businessKey)r.fields[field.businessKey]=clone(value);}
    requireThat(changes.length,'FIELDS','请明确提交更正字段');const correction={correctionId:uid('CORRECTION'),handlingMode:fourDirect(r)?'DIRECT':'TEMPLATE',directCycleId:r.directCycleId,runId:r.runId,stageId:fourStage(r).roundId,tenantId:r.ownerTenantId,at:now(),accountId:a.accountId,reason:input.reason,changes};r.corrections.push(correction);
    for(const c of changes){r.currentValueSources[c.fieldId]={kind:'CORRECTION',correctionId:correction.correctionId,at:correction.at};if(c.source==='FOLLOWUP'&&!fourDirect(r)){const previous=r.routingFieldValues?.[c.fieldId]||{},plan=fourRun(r).planSnapshot;r.routingFieldValues={...(r.routingFieldValues||{}),[c.fieldId]:{...previous,state:'KNOWN',value:clone(c.after),fieldId:c.fieldId,sourceKind:'CORRECTION',correctionId:correction.correctionId,tenantId:r.ownerTenantId,runId:r.runId,stageId:fourStage(r).roundId,categoryRef:clone(plan.categoryRef),categoryId:r.categoryId,categoryVersion:plan.categoryRef.version,fieldsVersion:plan.categoryRef.fieldsVersion,sourceNodeId:previous.sourceNodeId||r.nodeRuns.find(n=>n.nodeRunId===previous.nodeRunId)?.nodeId||r.nodeId}};}}
    r.revision++;return correction;
  });}
  function abandonContext(id){return safe(()=>{const state=read(),{r}=fourLifecycleOwner(state,id);fourFlowOnly(r);const run=fourRun(r);requireThat(['ACTIVE','ABANDONING'].includes(run?.status),'RUN_CLOSED','当前运行已关闭，请核对历史废弃收尾');return {recordId:id,expectedRevision:r.revision,canAbandon:true,...fourAbandonAnalysis(state,r,run)};});}
  function abandonedSettlementContext(id,options={}){return safe(()=>{
    const state=read(),{r}=fourLifecycleOwner(state,id),runs=(r.runs||[]).filter(run=>run.status==='ABANDONED').map(run=>fourAbandonAnalysis(state,r,run));let selected;
    if(options.runId){selected=runs.find(run=>run.runId===options.runId);requireThat(selected,'ABANDONED_RUN','请选择本条业务准确的旧废弃运行');}
    return {recordId:id,expectedRevision:r.revision,canSettle:true,runs,targetRunId:selected?.runId||'',...(selected||{})};
  });}
  function abandon(id,input,opts={}){return commit('abandon',id,input,opts,(s,a)=>{
    const {r}=fourLifecycleOwner(s,id,opts);fourFlowOnly(r);requireThat(String(input.reason||'').trim(),'REASON','请填写废弃原因');const run=fourRun(r);requireThat(['ACTIVE','ABANDONING'].includes(run.status),'RUN_CLOSED','运行已关闭');requireThat(!input.runId||input.runId===run.runId,'STALE_RUN','原运行已变化，请重新打开并核对');let analysis=fourAbandonAnalysis(s,r,run);
    if(input.confirmMissingContent===true)fourConfirmMissingContent(r,run,input,opts,analysis);else requireThat(!analysis.requiresMissingContentConfirmation||analysis.canRegisterStopping,'MISSING_CONTENT_CONFIRMATION','原实际办理内容仍缺失，请明确确认无法补填并保留未完成事实');
    run.abandonReason=String(input.reason).trim();run.abandonAccountId=a.accountId;run.abandonTenantId=a.tenantId;run.abandonRequestedAt=run.abandonRequestedAt||now();analysis=fourAbandonAnalysis(s,r,run);
    if(analysis.executionBlockers.length||analysis.requiresMissingContentConfirmation)run.status='ABANDONING';else{run.status='ABANDONED';run.endedAt=now();fourSettleAbandonedSegments(r,run);}r.revision++;return run;
  });}
  function confirmAbandonedSettlement(id,input,opts={}){return commit('settleAbandoned',id,input,opts,(s,a)=>{
    const {r}=fourLifecycleOwner(s,id,opts),run=(r.runs||[]).find(value=>value.runId===input.runId&&value.status==='ABANDONED');requireThat(run,'ABANDONED_RUN','请选择本条业务准确的旧废弃运行');requireThat(String(input.reason||'').trim(),'REASON','请填写无法补填的明确原因');requireThat(input.confirmMissingContent===true,'MISSING_CONTENT_CONFIRMATION','请明确确认原段无法补填，保留缺失和未完成');const analysis=fourAbandonAnalysis(s,r,run);requireThat(analysis.missingContent.length>0||analysis.foreignMissingCount===0,'ABANDON_CONTENT_SCOPE','当前仅有其他租户旧段欠项，不能代为确认');requireThat(!analysis.executionBlockers.some(blocker=>blocker.code!=='FOREIGN_CONTENT'),'ABANDONMENT_UNSETTLED','原执行、回执或其他租户欠项仍待核，不能代为确认');fourConfirmMissingContent(r,run,input,opts,analysis);fourSettleAbandonedSegments(r,run,a.tenantId);r.events.push({eventId:uid('ABANDON-SETTLEMENT'),type:'ABANDONED_SETTLEMENT',at:now(),runId:run.runId,tenantId:a.tenantId,accountId:a.accountId,reason:String(input.reason).trim(),segmentIds:analysis.missingContent.map(item=>item.segmentId)});r.revision++;return {recordId:id,runId:run.runId,...fourAbandonAnalysis(s,r,run)};
  });}
  function reopen(id,input={},opts={}){return commit('reopen',id,input,opts,(s,a)=>{const r=current(s,id,opts);fourFlowOnly(r);requireThat(r.fourNodeSchema&&fourPermission('reopen',r),'REOPEN_DENIED','没有当前业务重新办理资格');requireThat(['ENDED','ABANDONED'].includes(fourRun(r).status),'RUN_ACTIVE','原运行尚未正常结束或废弃完成');noRunning(r);const purpose=input.purpose||'FOLLOWUP';requireThat(['FOLLOWUP','CORRECTION'].includes(purpose),'RUN_PURPOSE','请选择再次跟进或归属纠偏');if(purpose==='CORRECTION')requireThat(String(input.reason||'').trim(),'REASON','归属纠偏须填写原因');const {category,config}=categoryVersion(s,r.categoryId);requireThat(category.enabled!==false&&config.main&&config.usable!==false,'ROUTE_NOT_READY','实际业务分类的路由尚未确认或当前不可用，不能开始新的办理运行');const normalized=fourNormalizeNewImportFields(config,r.fields),fieldProblem=normalized.error||validateFields(config,normalized.fields);requireThat(!fieldProblem,'IMPORT_FIELDS',fieldProblem);fourFirstCall(s,{...config,categoryId:r.categoryId,brandId:r.brandId},normalized.fields,r.ownerTenantId,purpose);r.arrangement=null;r.assignment=null;r.assignedAccountId='';r.routingFieldValues={};const run=fourCreateRun(s,r,config,purpose);if(input.reason)r.events.push({eventId:uid('REOPEN'),type:'REOPEN',at:now(),runId:run.runId,purpose,reason:String(input.reason),actorAccountId:a.accountId,tenantId:a.tenantId});r.revision++;return r;});}

  function fourReclassState(s,r,targetCategoryId,provided){
    const a=access();fourFlowOnly(r);requireThat(a.roleCode==='ADMIN'&&r.ownerTenantId===a.tenantId&&visible(r,a),'RECLASSIFY_DENIED','仅当前负责租户有权管理员可转类');requireThat(['ENDED','ABANDONED'].includes(fourRun(r)?.status),'RECLASSIFY_ACTIVE','请先完成或明确废弃原流程，再建立目标分类运行');noRunning(r);requireThat(!pending(s,r.recordId),'PENDING','请先核对原办理请求');requireThat(fourLine(r.categoryId,r.categorySnapshot?.categoryDefinition),'RECLASSIFY_SCOPE','本入口仅用于同品牌线索业务受控转类');
    const categories=projectedCategories(s,r.brandId),targets=categories.filter(c=>c.categoryId!==r.categoryId&&c.enabled!==false&&fourLine(c.categoryId,c.versions?.at(-1)?.categoryDefinition)).map(c=>({categoryId:c.categoryId,name:c.versions?.at(-1)?.name||c.name||c.categoryId}));
    if(!targetCategoryId)return {recordId:r.recordId,targetCategories:targets,targetCategoryId:'',fields:[],importSchema:[],values:{},issues:[],expectedRevision:r.revision};
    const {category,config}=categoryVersion(s,targetCategoryId);requireThat(category.brandId===r.brandId&&category.enabled!==false&&fourLine(category.categoryId,config.categoryDefinition)&&category.categoryId!==r.categoryId,'RECLASSIFY_SCOPE','请选择同品牌其他启用的线索分类');requireThat(config.usable!==false&&config.main,'TARGET_ROUTE','目标分类没有可用的当前流程');
    requireThat(!fourExistingLead(s,r.brandId,r.businessCode,r.recordId),'DUPLICATE_LEAD','同品牌已有另一条相同统一线索编码，不能合并或覆盖');
    const fields=clone(config.fields),allowed=new Set(fields.flatMap(f=>[f.key,f.id,f.fieldId,f.businessKey,...(f.aliases||[])].filter(Boolean))),base={};for(const f of fields)if(Object.hasOwn(r.fields,f.key))base[f.key]=clone(r.fields[f.key]);
    if(provided)for(const key of Object.keys(provided))requireThat(allowed.has(key),'TARGET_FIELDS','只允许明确补充目标分类导入字段');const raw={...base,...clone(provided||{})};for(const field of fields.filter(f=>f.fieldId)){const keys=[...new Set([field.key,field.id,field.fieldId,field.businessKey,...(field.aliases||[])].filter(Boolean))],explicit=keys.filter(key=>Object.hasOwn(provided||{},key));if(explicit.length&&explicit.every(key=>JSON.stringify(provided[key])===JSON.stringify(provided[explicit[0]])))for(const key of [field.key,field.id,field.fieldId,field.businessKey].filter(Boolean))raw[key]=clone(provided[explicit[0]]);}const normalized=fourNormalizeNewImportFields(config,raw),issues=[];if(normalized.error)issues.push(normalized.error);const validation=validateFields(config,normalized.fields);if(validation)issues.push(validation);let first,plan;
    try{plan=fourBoundPlan(s,config.main,r.brandId,category.categoryId);first=fourFirstCall(s,{...config,categoryId:category.categoryId,brandId:r.brandId},normalized.fields,r.ownerTenantId,'RECLASSIFY');}catch(e){issues.push(e.message);}
    const token=issues.length?'':'RECLASSIFY-'+fingerprint({recordId:r.recordId,revision:r.revision,runId:r.runId,targetCategoryId:category.categoryId,ownerTenantId:r.ownerTenantId,fields,categoryRef:config.categoryRef,plan,values:normalized.fields});
    return {recordId:r.recordId,targetCategories:targets,targetCategoryId:category.categoryId,targetCategoryName:config.name,fields,importSchema:fields,values:clone(normalized.fields),issues,expectedRevision:r.revision,validationToken:token,method:first?.method||'',initialNodeType:first?.initialNodeType,config:clone(config)};
  }
  function reclassifyContext(id,targetCategoryId,options={}){return safe(()=>{const s=read(),r=recordById(s,id),context=fourReclassState(s,r,targetCategoryId,options.values);delete context.config;return context;});}
  function reclassify(id,input,opts={}){return commit('reclassify',id,input,opts,(s,a)=>{
    const r=current(s,id,opts);requireThat(String(input.reason||'').trim(),'REASON','请填写转类原因');const context=fourReclassState(s,r,input.targetCategoryId,input.values);requireThat(!context.issues.length,'RECLASSIFY_FIELDS',context.issues.join('；'));requireThat(input.validationToken&&input.validationToken===context.validationToken,'RECLASSIFY_STALE','目标资料、字段、流程或原业务已变化，请保留输入重新检查确认');
    const fromCategoryId=r.categoryId,oldSnapshot=clone(r.categorySnapshot),oldRunId=r.runId,changeId=uid('RECLASSIFY'),at=now(),config=context.config;const beforeValues=clone(r.fields);r.categoryId=context.targetCategoryId;r.categorySnapshot=clone(config);r.categorySnapshot.kind='LEAD';r.fields={...r.fields,...clone(context.values)};r.arrangement=null;r.assignment=null;r.assignedAccountId='';r.routingFieldValues={};
    const event={eventId:changeId,type:'RECLASSIFY',at,actorAccountId:a.accountId,tenantId:a.tenantId,fromCategoryId,toCategoryId:r.categoryId,oldRunId,reason:String(input.reason),beforeCategorySnapshot:oldSnapshot,targetCategorySnapshot:clone(config),beforeValues,providedTargetValues:clone(context.values)};(r.categoryChanges||=[]).push(clone(event));r.events.push(event);for(const key of Object.keys(context.values))r.currentValueSources[key]={kind:'RECLASSIFY',changeId,at};const run=fourCreateRun(s,r,config,'RECLASSIFY');event.runId=run.runId;r.categoryChanges.at(-1).runId=run.runId;r.revision++;return r;
  });}
  function fourDirectCycle(r){return (r.directCycles||[]).find(cycle=>cycle.directCycleId===r.directCycleId);}
  function fourDirectSettled(s,r){noRunning(r);requireThat(!pending(s,r.recordId),'PENDING','请先核对原办理请求');requireThat(fourSegments(r).every(seg=>fourSegmentExecutionStopped(seg)&&(seg.archived===true||fourAbandonedSettled(r,seg))),'DIRECT_UNFINISHED','原直接跟进执行、重试、事实核对或必要归档尚未完成');}
  function fourDirectCompletion(s,r,input){fourDirectSettled(s,r);const code=input.outcomeCode;requireThat(Object.hasOwn(FOUR_OUTCOMES,code)&&code!=='UNSPECIFIED','OUTCOME_CODE','请选择明确业务结论');const completed=fourCurrentSegments(r).some(seg=>seg.archived&&seg.completedFollowup);requireThat(completed||code==='NO_CALL'&&String(input.reason||'').trim(),'DIRECT_CALL_REQUIRED','请先完成真实跟进；确实无需联系时请选择无需联系并填写原因');const label=String(input.outcomeLabel||FOUR_OUTCOMES[code]).trim();requireThat(label&&label.length<=80,'OUTCOME_LABEL','业务结论为1至80字');return {code,label,source:'DIRECT_COMPLETION',directCycleId:r.directCycleId,reason:String(input.reason||'').trim(),at:now(),accountId:access().accountId};}
  function completeDirect(id,input={},opts={}){return commit('completeDirect',id,input,opts,(s,a)=>{const r=current(s,id,opts);requireThat(fourDirect(r)&&r.directStatus==='ACTIVE','DIRECT_STATE','当前不在可完成的直接跟进周期');requireThat(fourPermission('completeDirect',r),'DIRECT_DENIED','没有当前业务直接跟进办理资格');const outcome=fourDirectCompletion(s,r,input);r.businessOutcome=outcome;r.directStatus='COMPLETED';Object.assign(fourDirectCycle(r),{status:'COMPLETED',endedAt:outcome.at,businessOutcome:clone(outcome)});r.events.push({eventId:uid('DIRECT-COMPLETE'),type:'DIRECT_COMPLETED',at:outcome.at,directCycleId:r.directCycleId,actorAccountId:a.accountId,tenantId:a.tenantId,businessOutcome:clone(outcome)});r.revision++;return r;});}
  function resumeDirect(id,input={},opts={}){return commit('resumeDirect',id,input,opts,(s,a)=>{const r=current(s,id,opts);requireThat(fourDirect(r)&&r.directStatus==='COMPLETED','DIRECT_STATE','请先完成当前直接跟进周期');requireThat(fourPermission('resumeDirect',r),'DIRECT_DENIED','没有再次直接跟进资格');fourDirectConfig(r.brandId,r.categoryId,false);fourDirectSettled(s,r);const method=fourDirectMethod(input.directMethod||r.directMethod),mock={...r,directMethod:method},scene=fourResolveScene(mock,fourDirectSpec(mock),input.aiSceneId||r.arrangement?.aiSceneId),at=now();r.directMethod=method;r.directStatus='ACTIVE';r.directCycleId=uid('DIRECT-CYCLE');r.directCycles.push({directCycleId:r.directCycleId,method,status:'ACTIVE',startedAt:at});r.businessOutcome=null;r.manualAssignmentMode=method==='MANUAL'?'MANUAL':'';r.arrangement=scene?{arrangementSchema:2,handlingMode:'DIRECT',directCycleId:r.directCycleId,tenantId:r.ownerTenantId,method,followupAccountId:'',resourceId:'',aiSceneId:scene.id,sceneSnapshot:clone(scene)}:method==='MANUAL'?{arrangementSchema:2,handlingMode:'DIRECT',directCycleId:r.directCycleId,tenantId:r.ownerTenantId,method,manualAssignmentMode:'MANUAL',resourceId:'',resourceSnapshot:null,followupAccountId:'',aiSceneId:'',sceneSnapshot:null,executionPriority:fourExecutionPriority(r.executionPriority)}:null;r.assignment=null;r.assignedAccountId='';r.events.push({eventId:uid('DIRECT-RESUME'),type:'DIRECT_RESUMED',at,directCycleId:r.directCycleId,directMethod:method,actorAccountId:a.accountId,tenantId:a.tenantId});r.revision++;return r;});}
  function fourEnableFlowState(s,r,input={}){
    const a=access();requireThat(fourDirect(r)&&a.roleCode==='ADMIN'&&r.ownerTenantId===a.tenantId&&visible(r,a),'ENABLE_FLOW_DENIED','仅当前负责租户有权管理员可启用流程');requireThat(r.entrySource?.kind!=='TASK','TASK_DIRECT_ONLY','任务入口名单固定直接跟进，不能改为按模板流转');fourDirectSettled(s,r);
    const {category,config}=categoryVersion(s,r.categoryId);requireThat(category.brandId===r.brandId&&category.enabled!==false&&config.usable!==false&&config.main,'ROUTE_NOT_READY','当前实际业务分类没有可用流转模板');const fields=clone(config.fields),allowed=new Set(fields.flatMap(field=>[field.key,field.id,field.fieldId,field.businessKey,...(field.aliases||[])].filter(Boolean))),base={};
    for(const field of fields)if(Object.hasOwn(r.fields,field.key))base[field.key]=clone(r.fields[field.key]);for(const key of Object.keys(input.values||{}))requireThat(allowed.has(key),'ENABLE_FLOW_FIELDS','只允许补充当前分类导入资料');const raw={...base,...clone(input.values||{})};
    for(const field of fields.filter(field=>field.fieldId)){const keys=[...new Set([field.key,field.id,field.fieldId,field.businessKey,...(field.aliases||[])].filter(Boolean))],explicit=keys.filter(key=>Object.hasOwn(input.values||{},key));if(explicit.length&&explicit.every(key=>JSON.stringify(input.values[key])===JSON.stringify(input.values[explicit[0]])))for(const key of [field.key,field.id,field.fieldId,field.businessKey].filter(Boolean))raw[key]=clone(input.values[explicit[0]]);}
    const normalized=fourNormalizeNewImportFields(config,raw),issues=[];if(normalized.error)issues.push(normalized.error);const validation=validateFields(config,normalized.fields);if(validation)issues.push(validation);let first,plan,scenes=[],scene;
    try{plan=fourBoundPlan(s,config.main,r.brandId,r.categoryId);first=fourFirstCall(s,{...config,categoryId:r.categoryId,brandId:r.brandId},normalized.fields,r.ownerTenantId,'FOLLOWUP');if(first.requiresAIScene){const mock={...r,handlingMode:'TEMPLATE',mechanism:'TEMPLATE'};scenes=fourChoices(mock,first.node).scenes;scene=fourResolveScene(mock,first.node,input.aiSceneId);}}catch(e){issues.push(e.message);}
    const validationToken=issues.length?'':'ENABLE-FLOW-'+fingerprint({recordId:r.recordId,revision:r.revision,directCycleId:r.directCycleId,ownerTenantId:r.ownerTenantId,categoryRef:config.categoryRef,fields,followupFields:config.followupFields,values:normalized.fields,plan,scene:scene?{id:scene.id,fingerprint:scene.configurationFingerprint}:null});
    return {recordId:r.recordId,handlingMode:'DIRECT',categoryId:r.categoryId,name:config.name,fields,importSchema:clone(fields),values:clone(normalized.fields),issues,expectedRevision:r.revision,validationToken,method:first?.method||'',requiresAIScene:!!first?.requiresAIScene,initialNodeType:first?.initialNodeType||'',firstCallNodeName:first?.node?.name||'',entryDecision:clone(first?.entryDecision),aiScenes:scenes,aiSceneId:scene?.id||input.aiSceneId||'',config:clone(config)};
  }
  function enableFlowContext(id,input={}){return safe(()=>{const s=read(),r=fourOwned(s,id),context=fourEnableFlowState(s,r,input);delete context.config;return context;});}
  function enableFlow(id,input={},opts={}){return commit('enableFlow',id,input,opts,(s,a)=>{const r=current(s,id,opts),context=fourEnableFlowState(s,r,input);requireThat(!context.issues.length,'ENABLE_FLOW_FIELDS',context.issues.join('；'));requireThat(input.validationToken&&input.validationToken===context.validationToken,'ENABLE_FLOW_STALE','当前资料、字段、模板、入口或场景已变化，请保留输入重新检查');const at=now(),before=clone(r.fields),eventId=uid('ENABLE-FLOW');r.fields={...r.fields,...clone(context.values)};for(const key of Object.keys(context.values))if(JSON.stringify(before[key])!==JSON.stringify(context.values[key]))r.currentValueSources[key]={kind:'ENABLE_FLOW',eventId,at};const cycle=fourDirectCycle(r);if(cycle?.status==='ACTIVE')Object.assign(cycle,{status:'FLOW_ENABLED',endedAt:at});r.directStatus='FLOW_ENABLED';r.assignment=null;r.assignedAccountId='';r.arrangement=null;r.routingFieldValues={};const run=fourCreateRun(s,r,context.config,'FOLLOWUP');if(context.requiresAIScene)r.arrangement={arrangementSchema:2,runId:r.runId,nodeRunId:r.nodeRunId,tenantId:r.ownerTenantId,method:'AI',aiSceneId:context.aiSceneId,sceneSnapshot:clone(fourResolveScene(r,fourNode(s,r),context.aiSceneId)),followupAccountId:''};r.events.push({eventId,type:'FLOW_ENABLED',at,directCycleId:r.directCycleId,runId:run.runId,actorAccountId:a.accountId,tenantId:a.tenantId,beforeValues:before,providedValues:clone(input.values||{}),entryDecision:clone(run.entryDecision)});r.revision++;return r;});}
  // A saved task import is not a supplier receipt. Explain a known running
  // origin task without altering ordinary execution or assignment admission.
  function fourImportedTaskWaiting(s,r,a,error){
    if(!['AI_SCENE_INVALID','EXECUTION_CONFIG'].includes(error.code)||r.entrySource?.kind!=='TASK'||r.entrySource.method!=='AI'||r.directMethod!=='AI'||r.directStatus!=='ACTIVE'||a.tenantId!==r.ownerTenantId||fourSegments(r).length||pending(s,r.recordId)||r.execution?.state!=='ended'||r.execution.noMoreCalls!==true||!fourArrangementCurrent(r))return null;
    const source=r.taskImportSource,arrangement=r.arrangement,original=r.originalImportSnapshot?.taskImportSource;
    if(!source||!original||source.method!=='AI'||source.tenantId!==r.ownerTenantId||r.entrySource.tenantId!==r.ownerTenantId||String(source.taskId)!==String(r.entrySource.taskId)||String(arrangement.resourceId)!==String(source.taskId)||arrangement.method!=='AI'||!source.aiSceneId||String(arrangement.aiSceneId)!==String(source.aiSceneId)||fingerprint(original)!==fingerprint(source))return null;
    try{
      const spec={method:'AI',taskId:String(source.taskId),importChannel:fourImportChannel(source)},current=taskBusinessTarget(spec,true),target=current.target;
      if(target.taskStatusCode!==2||target.enabled===false||['unknown','待核','未知','已完成','已结束','已终止','completed','ended','aborted'].includes(String(target.status||'').toLowerCase())||target.controlState==='unknown'||target.control?.state==='unknown'||fourSceneImportSource(target)!==source.dataImportSource)return null;
      const savedRemote=arrangement.resourceSnapshot?.remoteTaskId,currentRemote=target.remoteTaskId,sceneIds=[arrangement.sceneSnapshot?.id,arrangement.sceneSnapshot?.sceneId,arrangement.sceneSnapshot?.executionSceneId,arrangement.sceneSnapshot?.professionalTaskId,source.aiSceneId].filter(value=>value!==undefined&&value!==null&&String(value)!=='').map(String),explicit=target.nativeExplicitSceneId;
      if((savedRemote||currentRemote)&&(!savedRemote||!currentRemote||String(savedRemote)!==String(currentRemote)))return null;
      if(explicit&&!sceneIds.includes(String(explicit)))return null;
      if(!savedRemote&&!explicit)return null;
      const snapshot=(r.aiImportParameterSnapshots||[]).filter(item=>item.tenantId===r.ownerTenantId&&item.sceneId===source.aiSceneId&&item.directCycleId===r.directCycleId&&item.dataImportSource===source.dataImportSource).at(-1);if(!snapshot)return null;
      const config=fourDirectConfig(r.brandId,r.categoryId,false),fields=[{id:'code',key:'code',businessKey:'code',label:config.codeLabel,type:'text',required:true,source:'SYSTEM'},...clone(config.fields)],review=window.DFourNodeExecution?.validateTaskImportParameters?.({...spec,handlingMode:'DIRECT',entrySourceKind:'TASK',aiSceneId:source.aiSceneId,categoryId:r.categoryId,dataImportSource:source.dataImportSource},fields,{...clone(r.fields),code:r.businessCode},clone(snapshot.customValues||{}));
      if(!review||review.then||review.ok!==true||review.fingerprint!==snapshot.fingerprint)return null;
      return {code:'WAITING_TASK_READY',label:'等待任务可执行',nextAction:'openRecord',reason:'原任务进行中，名单已保存。当前未发起本条呼叫；待任务可执行后重新核对场景和执行配置。',taskName:target.name||source.taskName||''};
    }catch(_){return null;}
  }
  function fourDirectWorkState(s,r,a){
    const state=(code,label,nextAction,reason='',extra={})=>({code,label,nextAction,reason,...extra});if(pending(s,r.recordId))return state('WAITING_REVIEW','待核对','review','原同次请求结果尚未明确，请核对原请求');if(r.execution?.state==='unknown'||fourSegments(r).some(seg=>seg.factConflict))return state('WAITING_REVIEW','执行待核','review','原执行事实存在冲突或未知，请先核对');if(r.directStatus==='COMPLETED')return state('DIRECT_COMPLETED','直接跟进已完成','resumeDirect');
    const seg=fourLast(r);if(seg?.factConflict||r.execution?.state==='unknown')return state('WAITING_REVIEW','执行待核','review','原执行事实存在冲突或未知');if(seg&&!seg.ended)return state('CALLING','执行中','openRecord','呼出、排队或重试尚未结束');if(seg&&!seg.retriesCompleted)return state('WAITING_RESULT','待执行终态','openRecord','本次重试尚未收敛');if(seg&&!seg.archived){const human=fourNeedsHuman(seg);return human&&!seg.contentSaved?state('WAITING_CONTENT','待填写','openRecord','等待本次实际办理／接听者正式保存'):state('WAITING_RESULT','待结果归档','openRecord','等待真实执行事实明确后归档');}
    if(seg?.archived&&seg.completedFollowup)return state('DIRECT_READY_COMPLETE','可完成直接跟进','completeDirect','可明确业务结论，也可继续直接跟进');
    try{fourDirectAllowed(r);}catch(e){return state('DIRECT_DISABLED','分类已关闭直接跟进','enableFlow',e.message);}if(!fourArrangementReady(r,fourDirectSpec(r)))return state('WAITING_ASSIGNMENT',r.directMethod==='MANUAL'?'待人工分配':'待安排任务','assign',r.directMethod==='MANUAL'?'通过原手动分配入口指定有效坐席后，由该坐席本人办理':'请选择本租户具体任务及当前方式必要场景');
    try{fourStartReady(s,r.recordId,{}, {},a);}catch(e){const waiting=fourImportedTaskWaiting(s,r,a,e);if(waiting)return waiting;return state(e.code==='AI_SCENE_INVALID'||e.code==='SCENE_CHANGED'?'WAITING_SCENE':e.code==='CONTACT_OCCUPIED'||e.code==='CONTACT_INTERVAL'||e.code==='CONTACT_DAILY_LIMIT'?'CONTACT_BLOCKED':'RESOURCE_BLOCKED',e.code==='AI_SCENE_INVALID'||e.code==='SCENE_CHANGED'?'需核对AI场景':'待执行准备',e.code==='AI_SCENE_INVALID'||e.code==='SCENE_CHANGED'?'assign':'openRecord',e.message);}
    return state('READY_TO_CALL','待起呼','start','直接跟进方式与本次执行安排已明确');
  }
  function fourDirectProject(s,r,a){
    requireThat(r.scopeKnown!==false&&visible(r,a),'RECORD_DENIED','无权查看当前直接跟进业务');
    if(a.roleCode!=='SUPER_ADMIN'&&a.tenantId!==r.ownerTenantId){const view=fourBaseProject(s,r,a),departed=r.departures.find(item=>item.tenantId===a.tenantId&&item.cutoffAt===view.cutoffAt),stage=r.rounds.find(item=>item.tenantId===a.tenantId&&item.number===departed?.roundNumber),history=departed?.historySnapshot;requireThat(history?.schema===1&&history.tenantId===a.tenantId&&history.roundId===stage?.roundId,'HISTORY_SNAPSHOT','本方转出快照不完整');return {...view,handlingMode:'TEMPLATE',mechanism:'TEMPLATE',fields:clone(history.fields),categorySnapshot:clone(history.categorySnapshot),categoryName:history.categorySnapshot.name||view.categoryName,historySnapshot:clone(history),currentValues:{IMPORT:clone(history.fields),FOLLOWUP:clone(history.followupValues)},workState:{code:'HISTORY',label:'本方历史',nextAction:'openRecord',reason:'仅查看本方截止历史'}};}
    const regulator=a.roleCode==='SUPER_ADMIN',permissions=Object.fromEntries(['assign','start','startMany','advance','transfer','switchBackup','abandon','reopen','reclassify','saveResult','completeDirect','resumeDirect','enableFlow','correctValues','handoffReview','contactPolicy'].map(key=>[key,false])),reasons={advance:'直接跟进业务尚未启用流程',transfer:'直接跟进业务尚未启用流程',abandon:'请使用完成直接跟进',reopen:'请使用再次直接跟进',reclassify:'直接跟进业务尚未启用流程'},check=(name,fn)=>{try{fn();permissions[name]=true;}catch(e){reasons[name]=e.message;}};
    if(!regulator&&a.tenantId===r.ownerTenantId){check('assign',()=>fourAssignmentReadiness(s,r.recordId));check('start',()=>fourStartReady(s,r.recordId,{}, {},a));permissions.startMany=permissions.start&&['AI','PREDICTIVE'].includes(r.directMethod);permissions.correctValues=fourPermission('correctValues',r);permissions.handoffReview=fourPermission('handoffReview',r);permissions.contactPolicy=a.roleCode==='ADMIN';check('completeDirect',()=>{current(s,r.recordId);requireThat(r.directStatus==='ACTIVE'&&fourPermission('completeDirect',r),'DIRECT_DENIED','没有当前周期完成资格');fourDirectSettled(s,r);});check('resumeDirect',()=>{current(s,r.recordId);requireThat(r.directStatus==='COMPLETED'&&fourPermission('resumeDirect',r),'DIRECT_DENIED','没有再次直接跟进资格');fourDirectSettled(s,r);fourDirectConfig(r.brandId,r.categoryId,false);});check('enableFlow',()=>{current(s,r.recordId);requireThat(a.roleCode==='ADMIN','ENABLE_FLOW_DENIED','仅管理员可启用流程');requireThat(r.entrySource?.kind!=='TASK','TASK_DIRECT_ONLY','任务入口名单固定直接跟进，不能改为按模板流转');fourDirectSettled(s,r);});permissions.saveResult=pendingManualResults(s,r,a).length>0;}
    return {...clone(r),fourNodeSchema:FOUR_SCHEMA,handlingMode:'DIRECT',mechanism:'DIRECT',categoryName:r.categorySnapshot.name,codeLabel:r.categorySnapshot.codeLabel,viewIdentity:regulator?'regulator':'current',readOnly:regulator,scopeLabel:regulator?'管理范围监管 · 只读':'当前负责 · 直接跟进',run:null,runs:clone(r.runs||[]),nodeRuns:clone(r.nodeRuns||[]),currentNode:null,allowedNext:[],backupOptions:[],transferNext:[],edgeEvaluations:[],storeDestination:null,permissions,reasons,arrangement:clone(r.arrangement),currentValues:{IMPORT:clone(r.fields),FOLLOWUP:clone(r.followupValues)},pendingManualResults:regulator?[]:pendingManualResults(s,r,a),pendingRequests:regulator?[]:s.requests.filter(q=>(q.recordId===r.recordId||q.recordIds?.includes(r.recordId))&&q.status==='unknown'&&requestAllowed(q,a)).map(q=>({requestId:q.requestId,kind:q.kind,status:q.status,message:q.message})),statistics:{activities:fourSegments(r).length,completed:fourSegments(r).filter(seg=>seg.archived&&seg.completedFollowup).length,dials:fourSegments(r).flatMap(seg=>seg.calls||[]).filter(call=>call.dialed).length,connected:fourSegments(r).flatMap(seg=>seg.calls||[]).filter(call=>call.dialed&&call.customerAnswered===true).length,notExecuted:fourSegments(r).filter(seg=>seg.startFailure&&!seg.calls.some(call=>call.dialed)).length},workState:fourDirectWorkState(s,r,a),businessOutcome:clone(r.businessOutcome||{code:'PENDING',label:'待产生业务结论'})};
  }
  function fourWorkState(s,r,a=access()){
    if(fourDirect(r))return fourDirectWorkState(s,r,a);const run=fourRun(r),n=fourNode(s,r),state=(code,label,nextAction,reason='',extra={})=>({code,label,nextAction,reason,...extra});
    if(pending(s,r.recordId))return state('WAITING_REVIEW','待核对','review','原同次请求结果尚未明确，先核对而不重复办理');
    if(run?.status==='ABANDONING')return state('ABANDONING','废弃处理中','openRecord','在途、排队、重试或未知执行尚未完成终止核验');
    if(run?.status==='ABANDONED')return state('ABANDONED','已废弃','reopen');if(run?.status==='ENDED')return state('CLOSED','已结束','reopen');
    if(n.type==='TRANSFER'){const evaluation=routingEvaluations(s,r,a),selected=evaluation.edgeEvaluations.find(e=>e.edgeId===evaluation.selectedEdgeId);if(selected?.selectable)return state('WAITING_TRANSFER',fourIsLocalPath(selected)?'待本租户流转':'待转交','transfer',fourIsLocalPath(selected)?'确认后由本租户继续办理':'确认已满足条件的目标和路径');if(!evaluation.pending&&!selected)return state('CONDITIONS_UNMET','条件未满足','openRecord','当前资料未命中转交路径，保持当前节点和归属，待条件满足后再转交');return state('WAITING_REVIEW','转交待核','openRecord',evaluation.edgeEvaluations.map(e=>e.reason).join('；')||'目标或分流资料尚未明确');}
    if(n.type==='END')return state('CLOSED','已结束','openRecord');
    const seg=fourCurrentSegments(r).filter(f=>f.nodeRunId===r.nodeRunId).at(-1);if(seg?.factConflict||r.execution?.state==='unknown')return state('WAITING_REVIEW','执行待核','review','原结果存在冲突或未知执行，不能起呼或推进');
    if(seg&&!seg.ended)return state('CALLING','执行中','openRecord','本次呼出、排队或重试尚未明确结束');
    if(seg?.ended&&!seg.retriesCompleted)return state('WAITING_RESULT','待执行终态','openRecord','本次重试计划尚未明确收敛');
    if(seg?.ended&&!seg.contentSaved){const human=fourNeedsHuman(seg);return human?state('WAITING_CONTENT','待填写','openRecord','等待本次实际办理／接听者正式保存，责任人和管理员不能代填'):state('WAITING_RESULT','待结果归档','openRecord','等待真实通话及人工接听事实明确后由系统归档');}
    if(seg&&seg.archived!==true)return state('WAITING_RESULT','待结果归档','openRecord','必要结果或通话事实尚不完整');
    let conditionsUnmet=false;
    if(fourNodeCompleted(r)){const evaluation=routingEvaluations(s,r,a);if(evaluation.edgeEvaluations.some(e=>e.selectable))return state('WAITING_ADVANCE','待确认流转','advance');if(evaluation.pending||evaluation.selectedEdgeId)return state('WAITING_REVIEW','流转条件待核','openRecord',evaluation.edgeEvaluations.map(e=>e.reason).join('；'));conditionsUnmet=true;}
    if(!fourArrangementReady(r,n))return state('WAITING_ASSIGNMENT',n.methods[0]==='MANUAL'?'待人工分配':'待安排任务','assign',n.methods[0]==='MANUAL'?'通过原手动分配入口指定有效坐席后，由该坐席本人办理':'请选择本租户具体任务及当前方式必要场景');
    if(n.methods?.[0]==='AI'&&!r.arrangement?.aiSceneId)return state('WAITING_SCENE','待选AI场景','assign','本次AI安排尚未选定场景');
    const choices=fourChoices(r,n,r.arrangement?.aiSceneId);
    const contact=fourContactCheck(s,r.ownerTenantId,r.fields.phone,r.recordId);if(!contact.allowed)return state('CONTACT_BLOCKED','待联系协调','openRecord',contact.message,{nextAvailableAt:contact.nextAvailableAt});
    if(a.roleCode!=='SUPER_ADMIN'&&a.tenantId===r.ownerTenantId)try{fourStartReady(s,r.recordId,{}, {},a);}catch(e){return state(e.code==='AI_SCENE_INVALID'||e.code==='SCENE_CHANGED'?'WAITING_SCENE':'RESOURCE_BLOCKED',e.code==='AI_SCENE_INVALID'||e.code==='SCENE_CHANGED'?'需核对AI场景':'待执行准备',e.code==='AI_SCENE_INVALID'||e.code==='SCENE_CHANGED'?'assign':'openRecord',e.message);}
    return conditionsUnmet?state('CONDITIONS_UNMET','条件未满足','start','本次结果未满足流转条件，停留当前节点，可继续跟进'):state('READY_TO_CALL','待起呼','start',seg?.startFailure?'上次未实际拨打，可修复配置后重试':'执行目标、方式和当前办理范围已明确');
  }
  function workContext(id){return safe(()=>{const s=read(),r=recordById(s,id),view=project(s,r,access());return {recordId:id,workState:clone(view.workState),businessOutcome:clone(view.businessOutcome),permissions:clone(view.permissions),revision:view.revision};});}
  function fourReviewSummary(q,canHandoff=false){return {requestId:q.requestId,recordId:q.recordId||q.recordIds?.[0],kind:q.kind,status:q.status,at:q.at,message:q.message,sourceTenantId:q.sourceTenantId,canHandoff};}
  function fourReviewAuthorized(q,a){return q?.sourceTenantId===a.tenantId&&q.reviewAccountId===a.accountId&&!!q.reviewHandoffId;}
  function requestAllowed(q,a=access()){return fourBaseRequestAllowed(q,a)||fourReviewAuthorized(q,a);}
  function fourReviewOnly(q,a){return fourReviewAuthorized(q,a)&&!fourBaseRequestAllowed(q,a);}
  function fourReviewResponse(result,q,a){if(!q||!fourReviewOnly(q,a)||result.status==='failed')return result;return {...result,data:fourReviewSummary(q,false)};}
  function requestStatus(requestId){const result=fourBaseRequestStatus(requestId),q=read().requests.find(q=>q.requestId===requestId);const a=access();return fourPrivateProjection(fourReviewResponse(result,q,a),a);}
  function reconcile(requestId){const result=fourBaseReconcile(requestId),q=read().requests.find(q=>q.requestId===requestId);const a=access();return fourPrivateProjection(fourReviewResponse(result,q,a),a);}
  function reviewContext(id,options={}){return safe(()=>{const s=read(),a=access(),requests=s.requests.filter(q=>q.status==='unknown'&&(q.recordId===id||q.recordIds?.includes(id))&&(!options.requestId||q.requestId===options.requestId)&&q.sourceTenantId===a.tenantId&&requestAllowed(q,a));requireThat(requests.length,'REVIEW_DENIED','没有本租户可核对的准确原请求');const r=recordById(s,id),canHandoff=fourPermission('handoffReview',r);return {recordId:id,requestId:options.requestId||(requests.length===1?requests[0].requestId:undefined),requests:requests.map(q=>fourReviewSummary(q,canHandoff)),people:canHandoff?fourPeople(a.tenantId):[],canHandoff};});}
  function myReviewWork(){return safe(()=>{const s=read(),a=access();return s.requests.filter(q=>q.status==='unknown'&&(q.recordId||q.recordIds?.length)&&fourReviewAuthorized(q,a)).map(q=>fourReviewSummary(q,fourPermission('handoffReview',recordById(s,q.recordId||q.recordIds[0]))));});}
  function handoffReview(id,input,opts={}){return commit('handoffReview',id,input,opts,(s,a)=>{
    const r=recordById(s,id),candidates=s.requests.filter(q=>(q.recordId===id||q.recordIds?.includes(id))&&q.status==='unknown'&&q.sourceTenantId===a.tenantId&&requestAllowed(q,a)),q=candidates.find(q=>q.requestId===input.requestId)||(!input.requestId&&candidates.length===1?candidates[0]:null);
    requireThat(q,'REVIEW_REQUEST','请明确选择本租户有权核对的原请求');requireThat(fourPermission('handoffReview',r),'REVIEW_DENIED','没有核对事项交接资格');requireThat(String(input.reason||'').trim()&&fourPeople(a.tenantId).some(p=>p.accountId===input.accountId),'REVIEW_PERSON','请选择本租户核对人员并填写原因');
    if(opts.expectedRevision!==undefined)requireThat(Number(opts.expectedRevision)===r.revision,'STALE','业务或核对事项已变化，请重新读取');
    const e={eventId:uid('REVIEW'),at:now(),requestId:q.requestId,runId:r.runId,tenantId:a.tenantId,from:a.accountId,to:input.accountId,reason:input.reason};(r.reviewHandoffs||=[]).push(e);q.reviewAccountId=input.accountId;q.reviewHandoffId=e.eventId;r.revision++;return e;
  });}

  function pendingManualResults(s,r,a){return fourSegments(r).filter(seg=>!seg.contentSaved&&seg.ended&&fourNeedsHuman(seg)&&seg.tenantId===a.tenantId&&(seg.method==='MANUAL'?seg.assignedAccountId:seg.actualAnswerAccountId)===a.accountId).map(seg=>({recordId:r.recordId,segmentId:seg.segmentId,followupId:seg.followupId,roundId:seg.roundId,runId:seg.runId,method:seg.method,endedAt:seg.endedAt,expectedRevision:r.revision,canSave:true}));}
  function myFollowupWork(){return safe(()=>{const a=access(),out=[];requireThat(a.roleCode!=='SUPER_ADMIN','FOLLOWUP_READ','监管身份不承担接听填写');for(const r of read().records)if(r.fourNodeSchema)for(const seg of fourSegments(r)){const actual=seg.method==='MANUAL'?seg.assignedAccountId:seg.actualAnswerAccountId;if(seg.tenantId===a.tenantId&&actual===a.accountId&&seg.ended&&fourNeedsHuman(seg)&&!seg.contentSaved)out.push({recordId:r.recordId,followupId:seg.followupId,segmentId:seg.segmentId,method:seg.method,endedAt:seg.endedAt,expectedRevision:r.revision,businessCode:r.businessCode});}return out;});}
  function runContext(id){return safe(()=>{const s=read(),r=recordById(s,id);requireThat(visible(r,access()),'RECORD_DENIED','无权读取业务');const view=project(s,r,access());if(view.viewIdentity==='history')return {recordId:id,readOnly:true,history:true,run:null,runs:[],node:null,stage:null,arrangement:null};return {recordId:id,handlingMode:fourDirect(r)?'DIRECT':'TEMPLATE',directCycleId:r.directCycleId,directStatus:r.directStatus,run:clone(fourRun(r)),runs:clone(r.runs||[]),node:fourDirect(r)?null:fourNode(s,r),stage:clone(fourStage(r)),arrangement:clone(r.arrangement)};});}
  function timeline(id){return safe(()=>{const s=read(),r=recordById(s,id),view=project(s,r,access());return {record:view,stages:view.rounds||[],followups:(view.rounds||[]).flatMap(q=>q.segments||[]),calls:(view.rounds||[]).flatMap(q=>q.segments||[]).flatMap(seg=>(seg.calls||[]).map(call=>fourCallProjection(seg,call))),corrections:view.corrections||[],events:view.events||[],runs:view.runs||[],readOnly:view.readOnly};});}
  // Project supplier-private import evidence for the original tenant only.
  // This never mutates the stored ledger, sealed source history, or shared fields.
  function fourPrivateProjection(value,a=access(),state){
    if(value===undefined||value===null||typeof value!=='object')return value;
    const view=clone(value);let recordIndex=Array.isArray(state?.records)?new Map(state.records.map(record=>[record.recordId,record])):null,batchIndex=Array.isArray(state?.batches)?new Map(state.batches.map(batch=>[batch.batchId,batch])):null;
    const indexes=()=>{if(recordIndex&&batchIndex)return;let known;try{known=state||read();}catch(_){known={};}recordIndex||=new Map((known.records||[]).map(record=>[record.recordId,record]));batchIndex||=new Map((known.batches||[]).map(batch=>[batch.batchId,batch]));};
    const batchSource=id=>{if(typeof id!=='string'||!id)return undefined;indexes();const tenantId=batchIndex.get(id)?.tenantId;return typeof tenantId==='string'&&tenantId?tenantId:undefined;};
    const recordSource=id=>{indexes();const row=recordIndex.get(id);return row?.taskImportSource?.tenantId||row?.originalImportSnapshot?.taskImportSource?.tenantId||row?.entrySource?.tenantId||batchSource(row?.batchId);};
    const privateKeys=(node)=>{const result=new Set(),take=snapshot=>{for(const field of snapshot?.customFields||[])for(const key of [field.key,field.id])if(typeof key==='string')result.add(key);for(const key of Object.keys(snapshot?.customValues||{}))result.add(key);};take(node.taskImportParameterSnapshot);take(node.aiImportParameterSnapshot);take(node.originalImportSnapshot?.taskImportParameterSnapshot);take(node.taskImportParameterMapping);for(const snapshot of node.aiImportParameterSnapshots||[])if(snapshot?.tenantId!==a.tenantId)take(snapshot);return result;};
    const bags=new Set(['fields','values','parameters','businessValues','followupValues','providedValues','providedTargetValues','beforeValues','customValues','importValues','originalValues']);
    const metadata=new Set(['taskImportSource','sceneSnapshot','resourceSnapshot','sourceResolution','taskImportParameterMapping']);
    const visit=(node,sourceTenant,contextTenant,keys=new Set(),insideMetadata=false,privateContext=false)=>{
      if(!node||typeof node!=='object')return;
      if(Array.isArray(node)){for(const item of node)visit(item,sourceTenant,contextTenant,keys,insideMetadata,privateContext);return;}
      const explicit=node.taskImportSource?.tenantId||node.originalImportSnapshot?.taskImportSource?.tenantId||node.entrySource?.tenantId;
      const origin=explicit||sourceTenant||(typeof node.recordId==='string'?recordSource(node.recordId):undefined)||(typeof node.batchId==='string'?batchSource(node.batchId):undefined),tenant=typeof node.tenantId==='string'?node.tenantId:contextTenant;
      const own=typeof origin==='string'&&origin===a.tenantId,allKeys=new Set([...keys,...privateKeys(node)]),hasPrivate=privateContext||!!node.taskImportSource||!!node.taskImportParameterSnapshot||!!node.taskImportParameterMapping||!!node.aiImportParameterSnapshot||Array.isArray(node.aiImportParameterSnapshots);
      if(!own){
        delete node.taskImportParameterSnapshot;delete node.taskImportParameterMapping;
        for(const key of ['targetFingerprint','parameterMappingFingerprint','taskTargetFingerprint','importBasisToken','fieldBasisToken'])delete node[key];
        if(hasPrivate){delete node.customValues;delete node.raw;delete node.originalRaw;delete node.rawData;}
        if(insideMetadata)for(const key of ['configurationFingerprint','executionConfigurationFingerprint','fingerprint','raw','parameters','customValues'])delete node[key];
      }
      if(node.type==='AI_IMPORT_DATA_SAVED'&&node.tenantId!==a.tenantId)delete node.customValues;
      if(Array.isArray(node.aiImportParameterSnapshots)){
        node.aiImportParameterSnapshots=node.aiImportParameterSnapshots.filter(snapshot=>snapshot?.tenantId===a.tenantId);
        for(const snapshot of node.aiImportParameterSnapshots)visit(snapshot,snapshot.tenantId,snapshot.tenantId,new Set(),false,true);
      }
      if(node.aiImportParameterSnapshot){const owner=node.aiImportParameterSnapshot.tenantId||tenant;if(owner!==a.tenantId||tenant&&tenant!==a.tenantId)delete node.aiImportParameterSnapshot;else visit(node.aiImportParameterSnapshot,owner,owner,new Set(),false,true);}
      for(const [key,child]of Object.entries(node)){
        if(['aiImportParameterSnapshots','aiImportParameterSnapshot'].includes(key)||!child||typeof child!=='object')continue;
        if(bags.has(key)){
          if(!own&&allKeys.size)for(const privateKey of allKeys)delete child[privateKey];
          continue;
        }
        if(key==='taskImportParameterSnapshot'){visit(child,origin,tenant,new Set(),false,true);continue;}
        let nextOrigin=origin,nextTenant=tenant,nextKeys=allKeys;
        if(key==='historySnapshot'&&typeof child.tenantId==='string')nextOrigin=child.tenantId;
        if(['sceneSnapshot','resourceSnapshot','sourceResolution'].includes(key)&&typeof (child.tenantId||tenant)==='string')nextOrigin=child.tenantId||tenant;
        if(key==='events'&&Array.isArray(child)){
          for(const event of child)visit(event,event?.type==='AI_IMPORT_DATA_SAVED'?event.tenantId:origin,event?.tenantId||tenant,allKeys,false,hasPrivate);continue;
        }
        visit(child,nextOrigin,nextTenant,nextKeys,metadata.has(key),hasPrivate);
      }
    };
    visit(view,undefined,undefined);return view;
  }
  function fourProjectAIImportData(view,a){return fourPrivateProjection(view,a);}
  function fourProjectAIImportBatch(batch,a){return fourPrivateProjection(batch,a);}
  function project(s,r,a){requireThat(r.fourNodeSchema===FOUR_SCHEMA,'RECORD_SCHEMA','业务记录结构不符合当前四节点规范');if(fourDirect(r))return fourProjectAIImportData(fourDirectProject(s,r,a),a);const view=fourBaseProject(s,r,a);view.handlingMode='TEMPLATE';
    view.fourNodeSchema=FOUR_SCHEMA;
    if(view.viewIdentity==='history'){
      const departed=r.departures.find(item=>item.tenantId===a.tenantId&&item.cutoffAt===view.cutoffAt),stage=r.rounds.find(item=>item.tenantId===a.tenantId&&item.number===departed?.roundNumber);let history=departed?.historySnapshot;
      requireThat(history?.schema===1&&history.tenantId===a.tenantId&&history.roundId===stage?.roundId,'HISTORY_SNAPSHOT','本方转出快照不完整');
      if(history){view.fields=clone(history.fields);view.categorySnapshot=clone(history.categorySnapshot);view.categoryName=history.categorySnapshot.name||history.categorySnapshot.categoryDefinition?.label||view.categoryName;view.categoryId=history.categorySnapshot.categoryId||history.categorySnapshot.categoryRef?.categoryId||history.categorySnapshot.categoryDefinition?.id||view.categoryId;view.historySnapshot=clone(history);view.currentValues={IMPORT:clone(history.fields),FOLLOWUP:clone(history.followupValues)};}
    }
    if(view.viewIdentity!=='history'){view.executionPriority=fourPriority(r,fourNode(s,r));view.executionQueuedAt=fourQueuedAt(r);view.executionQueueSequence=r.executionQueueSequence||0;view.run=clone(fourRun(r));view.arrangement=clone(r.arrangement);view.currentValues={IMPORT:clone(r.fields),FOLLOWUP:clone(r.followupValues)};view.statistics={activities:fourSegments(r).length,completed:fourSegments(r).filter(f=>f.archived&&f.completedFollowup).length,dials:fourSegments(r).flatMap(f=>f.calls||[]).filter(c=>c.dialed).length,connected:fourSegments(r).flatMap(f=>f.calls||[]).filter(c=>c.dialed&&c.customerAnswered===true).length,notExecuted:fourSegments(r).filter(f=>f.startFailure&&!f.calls.some(c=>c.dialed)).length};
      if(a.tenantId===r.ownerTenantId&&a.roleCode!=='SUPER_ADMIN'){view.permissions.abandon=fourPermission('abandon',r)&&['ACTIVE','ABANDONING'].includes(fourRun(r).status);view.permissions.reopen=fourPermission('reopen',r)&&['ENDED','ABANDONED'].includes(fourRun(r).status);view.permissions.correctValues=fourPermission('correctValues',r);view.permissions.handoffReview=fourPermission('handoffReview',r);if(fourRun(r).status!=='ACTIVE')for(const key of ['start','assign','advance','transfer'])view.permissions[key]=false;}}
    if(view.viewIdentity!=='history'){view.workState=fourWorkState(s,r,a);view.businessOutcome=clone(fourRun(r)?.businessOutcome||{code:fourRun(r)?.status==='ACTIVE'?'PENDING':'UNSPECIFIED',label:fourRun(r)?.status==='ACTIVE'?'待产生业务结论':'未设置业务结论'});if(a.tenantId===r.ownerTenantId&&a.roleCode!=='SUPER_ADMIN'){try{fourStartReady(s,r.recordId,{}, {},a);view.permissions.start=true;}catch(e){view.permissions.start=false;view.reasons.start=e.message;}view.permissions.startMany=view.permissions.start&&['AI','PREDICTIVE'].includes(fourNode(s,r).methods?.[0]);view.permissions.reclassify=a.roleCode==='ADMIN'&&['ENDED','ABANDONED'].includes(fourRun(r)?.status)&&fourLine(r.categoryId,r.categorySnapshot?.categoryDefinition)&&!pending(s,r.recordId);view.permissions.contactPolicy=a.roleCode==='ADMIN';}}else view.workState={code:'HISTORY',label:'本方历史',nextAction:'openRecord',reason:'仅查看本方截止历史'};
    return fourProjectAIImportData(view,a);
  }
  function catalogs(brandId){const result=fourBaseCatalogs(brandId);if(result.status==='success'){const a=access(),ids=brandIds(a);result.data.categories=(result.data.categories||[]).map(row=>{const projected={...row};delete projected.allowDirectFollowup;return projected;});result.data.tenantChoices=bindings().filter(b=>b.known&&ids.includes(b.brandId)&&(!brandId||b.brandId===brandId)).map(b=>({tenantId:b.tenantId,brandId:b.brandId,kind:b.kind,name:tenant(b.tenantId)?.name||b.tenantId,enabled:tenantValid(b.tenantId)}));}return result;}
