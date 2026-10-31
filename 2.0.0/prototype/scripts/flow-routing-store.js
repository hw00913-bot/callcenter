  // These helpers stay inside the authoritative ledger closure. Old versions use the original paths.
  function routingCategoryRef(id,row,cfg){return {brandId:id,categoryId:canonicalCategory(row.id),version:Number(row.configurationVersion||1),fieldsVersion:CustomerBusiness.routingFieldsVersion(row,cfg.fields)};}
  function routingCatalogRaw(id,categoryId){
    configGuard(id);const cfg=brandConfiguration(id),row=cfg.rows.find(c=>c.id===canonicalCategory(categoryId));
    requireThat(row&&row.enabled!==false,'CATEGORY_UNAVAILABLE','请选择本品牌启用的业务分类');
    const configured=Object.hasOwn(row,'importFields'),schema=importSchema(id,row.id,cfg);
    const fields=schema.filter(f=>!configured||f.fieldId).map(f=>({...clone(f),id:f.fieldId||f.key,source:'IMPORT',type:f.type==='phone'?'text':f.type,options:f.options||[]}));
    for(const ref of row.fields.filter(ref=>ref.enabled!==false)){const f=cfg.fields.find(f=>f.id===ref.fieldId&&f.enabled!==false&&CustomerBusiness.fieldUsage(f)==='FOLLOWUP');if(f)fields.push({...clone(f),source:'FOLLOWUP'});}
    let aiContexts=[],aiError='';
    try{const ai=parent.DModuleHost.currentAIConfiguration();aiContexts=(ai.routingContexts||[]).filter(c=>c.categoryId===row.id&&c.brandId===id).map(clone);}catch(e){aiError=e.message||'AI配置待核';}
    return {categoryRef:routingCategoryRef(id,row,cfg),categoryLabel:row.label,fields,domains:clone(window.DFlowStatusDomains),aiContexts,aiError};
  }
  function routingCatalog(id,categoryId){return safe(()=>routingCatalogRaw(id,categoryId));}
  function cleanRoutingTemplate(s,input){
    requireThat(input.categoryRef?.categoryId,'CATEGORY_REQUIRED','请选择模板的业务分类');
    requireThat(!input.categoryRef.brandId||input.categoryRef.brandId===input.brandId,'BRAND_MISMATCH','条件配置不属于当前品牌的业务分类');
    const catalog=routingCatalogRaw(input.brandId,input.categoryRef.categoryId);
    requireThat(input.categoryRef.tenantId===undefined||input.categoryRef.tenantId===catalog.categoryRef.tenantId,'CATEGORY_SCOPE','条件配置的分类使用范围不一致');
    requireThat(input.categoryRef.categoryScope===undefined||input.categoryRef.categoryScope===(catalog.categoryRef.categoryScope||'brand'),'CATEGORY_SCOPE','条件配置的分类使用范围不一致');
    // Configuration always consumes the latest category. Saved records still
    // evaluate their immutable category/template snapshots, never this catalog.
    input={...clone(input),categoryRef:clone(catalog.categoryRef)};
    const checked=DFlowRouting.validate(input,catalog,{forSave:true});
    requireThat(checked.ok,'ROUTING_INVALID',checked.issues?.map(x=>x.message).join('；')||'条件编排无效');
    // Reuse every original node/duty/terminal guard. The legacy condition cleaner only sees neutral copies.
    const neutral=clone(input);delete neutral.routingPolicy;
    neutral.edges=neutral.edges.map(e=>({edgeId:e.edgeId,fromNodeId:e.fromNodeId,toNodeId:e.toNodeId,conditions:{enabled:false,mode:'ALL',rules:[]}}));
    const base=cleanTemplate(s,neutral);
    base.nodes=base.nodes.map(n=>({...n,...(input.nodes.find(x=>x.nodeId===n.nodeId).conditionSource?{conditionSource:clone(input.nodes.find(x=>x.nodeId===n.nodeId).conditionSource)}:{})}));
    return {...base,routingPolicy:'FIRST_MATCH_V1',categoryRef:clone(catalog.categoryRef),routingCatalog:clone(catalog),edges:clone(input.edges)};
  }
  function validateRoutingTemplate(input){return safe(()=>{configGuard(input.brandId);const cleaned=cleanRoutingTemplate(read(),input);return {...DFlowRouting.validate(cleaned,cleaned.routingCatalog),categoryRef:clone(cleaned.categoryRef),routingCatalog:clone(cleaned.routingCatalog)};});}
  function captureRoutingFields(s,r,round,seg,input,values){
    const version=templateVersion(s,seg.templateRef);
    if(version.routingPolicy!=='FIRST_MATCH_V1')return;
    const provided=input.providedFieldIds,definitions=seg.formSchema?.fields||[];
    requireThat(Array.isArray(provided)&&new Set(provided).size===provided.length&&provided.every(id=>typeof id==='string'&&definitions.some(f=>f.id===id)),'ROUTING_FIELDS_PROVIDED','请保留本次实际填写字段标记，未操作字段不能作为明确清空保存');
    const saved={},ids=[];
    for(const id of provided){
      const definition=definitions.find(f=>f.id===id);
      // Interface objects retain their existing contract and are not routing values.
      if(!DFlowRouting.operators(definition.type).length)continue;
      requireThat(Object.hasOwn(input.values||{},id)&&Object.hasOwn(values||{},id),'ROUTING_FIELD_MISSING','实际填写字段缺少原提交值，请保留输入并重新核对');
      const normalized=DFlowRouting.normalizeSavedField(values[id],definition.type,'Asia/Shanghai');
      requireThat(normalized.ok,'ROUTING_FIELD_TYPE','请按原字段类型填写；日期和时间按北京时间（UTC+08:00）保存');
      ids.push(id);saved[id]=clone(normalized.value);
    }
    seg.routingFieldSnapshot={schema:1,recordId:r.recordId,tenantId:seg.tenantId,roundId:round.roundId,nodeRunId:seg.nodeRunId,segmentId:seg.segmentId,categoryRef:clone(version.categoryRef),timeZone:'Asia/Shanghai',providedFieldIds:ids,values:saved};
  }
  function routingEvaluations(s,r,a){
    const v=templateVersion(s,r.templateRef),node=nodeOf(s,r.templateRef,r.nodeId),destination=node.type==='TRANSFER'?{kind:node.targetKind}:bind(r.ownerTenantId);
    let eligible=a.roleCode!=='SUPER_ADMIN'&&a.tenantId===r.ownerTenantId&&visible(r,a)&&!pending(s,r.recordId);
    try{noRunning(r);}catch(_){eligible=false;}
    const result=DFlowRouting.evaluate(v,node,r,v.routingCatalog,{eligible});
    const all=result.edgeEvaluations.map(e=>({...e,toName:nodeOf(s,r.templateRef,e.toNodeId).name}));
    const edgeEvaluations=all.filter(e=>dutyMatches(nodeOf(s,r.templateRef,e.toNodeId),destination));
    // A selected path outside current duty is unavailable; never fall through to a lower-priority branch.
    edgeEvaluations.forEach(e=>{if(e.edgeId!==result.selectedEdgeId)e.selectable=false;if(node.type!=='TRANSFER'&&nodeOf(s,r.templateRef,e.toNodeId).type!=='TRANSFER'){try{previousSaved(r);}catch(error){e.selectable=false;if(e.status==='MATCHED')e.reason=error.message;}}});
    const evaluationToken='EVAL-'+fingerprint({recordId:r.recordId,revision:r.revision,owner:r.ownerTenantId,round:r.rounds.at(-1).roundId,nodeRunId:r.nodeRunId,templateRef:r.templateRef,result});
    return {recordId:r.recordId,revision:r.revision,ownerTenantId:r.ownerTenantId,roundId:r.rounds.at(-1).roundId,templateRef:clone(r.templateRef),nodeId:r.nodeId,evaluationToken,edgeEvaluations,selectedEdgeId:result.selectedEdgeId,policy:'FIRST_MATCH_V1'};
  }
  function captureRoutingEvidence(r,round,seg,input){
    if(input.routingEvidence===undefined)return;
    requireThat(templateVersion(read(),seg.templateRef).routingPolicy==='FIRST_MATCH_V1','ROUTING_LEGACY','旧模板不接受新的条件证据契约');
    const proof=input.routingEvidence;
    requireThat(proof&&proof.simulation===true&&proof.tenantId===seg.tenantId&&proof.roundId===round.roundId&&proof.nodeRunId===seg.nodeRunId&&proof.segmentId===seg.segmentId&&seg.ended&&proof.completed===true&&proof.retriesCompleted===true,'ROUTING_EVIDENCE','条件证据必须精确归属已结束且重试完成的原节点原执行段');
    requireThat((seg.method==='AI'?'AI':'CLOUD')===proof.channel,'ROUTING_CHANNEL','条件证据渠道与执行方式不符');
    const domain=window.DFlowStatusDomains.find(d=>d.id===proof.domainId&&d.channel===proof.channel);
    requireThat(!domain?.methods||domain.methods.includes(seg.method),'ROUTING_METHOD','原执行方式不能使用另一接口状态域');
    requireThat(domain&&typeof proof.rawCode==='string'&&typeof proof.rawLabel==='string'&&['KNOWN','PENDING'].includes(proof.state),'ROUTING_STATUS','请保留准确状态域和原始code/label；未知状态须待核');
    requireThat(proof.state!=='KNOWN'||domain.statuses.some(x=>x.value===proof.statusValue),'ROUTING_STATUS','最终状态不在本渠道接口目录');
    const normalized=DFlowNormalizeStatus(proof.domainId,proof.rawDomain||(proof.channel==='CLOUD'?proof.domainId:''),proof.rawCode);
    requireThat(proof.state!=='KNOWN'||normalized.state==='KNOWN'&&normalized.value===proof.statusValue,'ROUTING_MAPPING','原始状态缺少可核映射，必须保留原值并标记待核');
    if(proof.tags!==undefined){
      const tags=proof.tags,version=templateVersion(read(),seg.templateRef),catalog=version.routingCatalog;
      requireThat(proof.channel==='AI'&&tags&&['PENDING','KNOWN','NONE'].includes(tags.state)&&Array.isArray(tags.ids),'ROUTING_TAGS','标签证据须保留明确识别状态与稳定标识集合');
      const ctx=(seg.sceneSnapshot?.aiContexts||[]).find(c=>['supplierId','tenantId','tenantType','tagSceneId','categoryId','brandId','revision'].every(k=>tags[k]===c[k]));
      requireThat(ctx&&ctx.tenantId===seg.tenantId&&ctx.categoryId===version.categoryRef.categoryId&&ctx.brandId===version.categoryRef.brandId,'ROUTING_TAG_CONTEXT','标签证据不属于本次实际AI场景、租户、业务分类或配置版本');
      requireThat(new Set(tags.ids).size===tags.ids.length&&tags.ids.every(id=>ctx.tags.some(t=>t.id===id))&&(tags.state==='KNOWN'?tags.ids.length>0:tags.ids.length===0),'ROUTING_TAG_IDS','标签识别状态与固定稳定标识不一致');
    }
    const value=clone(proof),prior=seg.routingEvidence;
    if(prior&&JSON.stringify(prior)!==JSON.stringify(value)){
      const same=['tenantId','roundId','nodeRunId','segmentId','channel','domainId','rawDomain','rawCode','rawLabel'].every(k=>prior[k]===value[k]);
      const resolvingStatus=prior.state==='PENDING'&&value.state==='KNOWN';
      const resolvingTags=prior.state==='KNOWN'&&value.state==='KNOWN'&&prior.statusValue===value.statusValue&&(!prior.tags||prior.tags.state==='PENDING')&&['KNOWN','NONE'].includes(value.tags?.state);
      const knownTagsUnchanged=!['KNOWN','NONE'].includes(prior.tags?.state)||JSON.stringify(prior.tags)===JSON.stringify(value.tags);
      requireThat(same&&knownTagsUnchanged&&(resolvingStatus||resolvingTags),'ROUTING_EVIDENCE_CONFLICT','同一执行段已有不同已知证据，请核对原结果');
    }
    if(!prior||JSON.stringify(prior)!==JSON.stringify(value)){seg.routingEvidenceHistory=seg.routingEvidenceHistory||[];seg.routingEvidenceHistory.push({eventId:input.eventId,at:now(),value:clone(value)});}
    seg.routingEvidence=value;
    if(r.ownerTenantId===seg.tenantId&&r.rounds.at(-1).roundId===round.roundId&&r.nodeRunId===seg.nodeRunId)r.routingEvidence=value;
  }
