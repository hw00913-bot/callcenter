  // Read only: use the original segment's immutable template, never today's configuration.
  function routingEvidenceContext(id,segmentId){return safe(()=>{
    const s=read(),{r,round,seg,a}=originalSegment(s,id,segmentId);
    requireThat(r.ownerTenantId===a.tenantId&&visible(r,a)&&r.scopeKnown!==false&&tenantValid(a.tenantId),'ROUTING_CONTEXT_DENIED','仅当前负责租户有权人员可核对本租户原执行段条件证据');
    const version=templateVersion(s,seg.templateRef);
    if(version.routingPolicy!=='FIRST_MATCH_V1')return null;
    const catalog=version.routingCatalog,ref=version.categoryRef;
    requireThat(catalog&&ref&&JSON.stringify(catalog.categoryRef)===JSON.stringify(ref),'ROUTING_CATALOG','原执行段固定条件目录无法核定');
    const channel=seg.method==='AI'?'AI':['MANUAL','PREDICTIVE'].includes(seg.method)?'CLOUD':null;
    requireThat(channel,'ROUTING_METHOD','本原段方式不支持条件证据');
    return {recordId:id,revision:r.revision,categoryRef:clone(ref),
      segment:{segmentId:seg.segmentId,tenantId:seg.tenantId,roundId:round.roundId,nodeRunId:seg.nodeRunId,method:seg.method,ended:seg.ended===true},channel,
      domains:clone((catalog.domains||[]).filter(d=>d.channel===channel&&(!d.methods||d.methods.includes(seg.method)))),
      aiContexts:clone((seg.sceneSnapshot?.aiContexts||[]).filter(c=>channel==='AI'&&c.tenantId===seg.tenantId&&c.categoryId===ref.categoryId&&c.brandId===ref.brandId)),
      proof:clone(seg.routingEvidence||null)};
  });}
