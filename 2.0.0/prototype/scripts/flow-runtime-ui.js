  // Explicit local evidence only: no provider calls, field writes or result saving.
  let routingMockDraft=null,routingMockReplay=null;
  const routingProofClone=value=>JSON.parse(JSON.stringify(value));
  const routingProofKey=c=>JSON.stringify([activeContext,c.recordId,c.segment.tenantId,c.segment.roundId,c.segment.nodeRunId,c.segment.segmentId]);
  function routingMockSelectedSegment(row,segments){return routingMockDraft?.scope===activeContext&&routingMockDraft.recordId===row.recordId&&segments.some(s=>s.segmentId===routingMockDraft.segmentId)?routingMockDraft.segmentId:segments.at(-1)?.segmentId;}
  function routingMockContext(row,segmentId){
    if(row?.viewIdentity!=='current')return null;
    if(!segmentId){const a=window.AppState.effectiveAccess(),segments=(row.rounds||[]).flatMap(q=>q.segments||[]).filter(s=>s.tenantId===a.tenantId&&(a.roleCode==='ADMIN'||s.assignedAccountId===a.accountId||s.actorAccountId===a.accountId));segmentId=routingMockSelectedSegment(row,segments);}
    if(!segmentId)return null;
    const ret=call('routingEvidenceContext',row.recordId,segmentId);
    return ret.status==='success'?ret.data:{error:ret.message||'固定条件目录无法读取'};
  }
  function routingReadDraft(){
    if(!routingMockDraft||!document.getElementById('bfRoutingDomain'))return;
    for(const [key,id]of Object.entries({domainId:'bfRoutingDomain',rawDomain:'bfRoutingRawDomain',rawCode:'bfRoutingRawCode',rawLabel:'bfRoutingRawLabel',state:'bfRoutingState',contextIndex:'bfRoutingAIContext',tagState:'bfRoutingTagState'})){
      const el=document.getElementById(id);if(el)routingMockDraft[key]=el.value;
    }
    for(const [key,id]of [['completed','bfRoutingCompleted'],['retriesCompleted','bfRoutingRetries']])routingMockDraft[key]=document.getElementById(id)?.checked===true;
    if(document.getElementById('bfRoutingTags'))routingMockDraft.ids=Array.from(document.querySelectorAll('#bfRoutingTags input:checked')).map(x=>x.value);
  }
  function routingDraftFor(c){
    const key=routingProofKey(c);if(routingMockDraft?.key===key)return routingMockDraft;
    const p=c.proof||{},tagContext=(c.aiContexts||[]).findIndex(x=>p.tags&&['supplierId','tenantId','tenantType','tagSceneId','revision','categoryId','brandId'].every(k=>x[k]===p.tags[k]));
    routingMockDraft={key,scope:activeContext,recordId:c.recordId,segmentId:c.segment.segmentId,domainId:p.domainId||'',rawDomain:p.rawDomain||'',rawCode:p.rawCode||'',rawLabel:p.rawLabel||'',state:p.state||'PENDING',contextIndex:tagContext<0?'':String(tagContext),tagState:p.tags?.state||'PENDING',ids:p.tags?.ids||[],completed:false,retriesCompleted:false};
    return routingMockDraft;
  }
  function routingMockPanel(row,segmentId){
    const c=routingMockContext(row,segmentId);
    if(!c)return '<div id="bfRoutingMockPanel"></div>';
    if(c.error)return '<div id="bfRoutingMockPanel"><p class="bf-blocked">'+e(c.error)+'</p></div>';
    const d=routingDraftFor(c),options=(rows,value)=>'<option value="">请明确选择</option>'+rows.map(x=>'<option value="'+e(x.value)+'"'+(x.value===value?' selected':'')+'>'+e(x.label)+'</option>').join('');
    const domains=c.domains.map(x=>({value:x.id,label:x.label})),domain=c.domains.find(x=>x.id===d.domainId);
    const rawDomains=c.channel==='AI'?[{value:'DCC_LOCAL_LABEL',label:'Mock · DCC归并状态文本'},{value:'DAZHONG_CALL_STATUS',label:'Mock · 大众原始状态码'},{value:'HOUPU_RAW_STATUS',label:'Mock · 厚朴原始状态码'}]:domain?[{value:domain.id,label:'Mock · '+domain.label}]:[];
    const contexts=(c.aiContexts||[]).map((x,i)=>({value:String(i),label:(x.supplierLabel||x.supplierId)+' · '+x.tenantType+' · '+x.tagSceneId+' · V'+x.revision}));
    const ctx=d.contextIndex===''?null:c.aiContexts[Number(d.contextIndex)];
    const selected=(actual,value)=>actual===value?' selected':'';
    const tags=c.channel!=='AI'?'':'<label>固定AI标签上下文<select id="bfRoutingAIContext" onchange="BusinessFlow.routingMockChanged()">'+options(contexts,d.contextIndex)+'</select></label><label>标签识别状态<select id="bfRoutingTagState"><option value="PENDING"'+selected(d.tagState,'PENDING')+'>待识别或未映射</option><option value="NONE"'+selected(d.tagState,'NONE')+'>已识别完成，明确无标签</option><option value="KNOWN"'+selected(d.tagState,'KNOWN')+'>已识别并映射，选择下列标签</option></select></label><div id="bfRoutingTags">'+(ctx?(ctx.tags||[]).map(t=>'<label><input type="checkbox" value="'+e(t.id)+'"'+(d.ids.includes(t.id)?' checked':'')+'> '+e(t.label)+'</label>').join(''):'请先明确选择固定标签上下文')+'</div>';
    return '<div id="bfRoutingMockPanel" class="bf-note"><strong>Mock：固定模板条件证据</strong><p>仅写入本地原段证据；不连接供应商、不写业务字段，也不代替结果保存或推进。</p><label>原执行方式状态域<select id="bfRoutingDomain" onchange="BusinessFlow.routingMockChanged()">'+options(domains,d.domainId)+'</select></label><label>原始状态来源<select id="bfRoutingRawDomain">'+options(rawDomains,d.rawDomain)+'</select></label><label>原始 code<input id="bfRoutingRawCode" value="'+e(d.rawCode)+'"></label><label>原始 label<input id="bfRoutingRawLabel" value="'+e(d.rawLabel)+'"></label><label>状态核定<select id="bfRoutingState"><option value="PENDING"'+selected(d.state,'PENDING')+'>原值已保留，映射待核</option><option value="KNOWN"'+selected(d.state,'KNOWN')+'>按已核目录映射</option></select></label>'+tags+'<label><input type="checkbox" id="bfRoutingCompleted"'+(d.completed?' checked':'')+'> 确认此原段最终处理已结束</label><label><input type="checkbox" id="bfRoutingRetries"'+(d.retriesCompleted?' checked':'')+'> 确认重试全部结束</label><p>本段'+(c.segment.ended?'已结束，结果仍由原保存动作处理。':'尚未结束，请先核对原执行终态。')+'</p>'+action('提交本地条件证据','submitRoutingEvidence()',null,'btn',!c.segment.ended)+action('重放同一条件证据事件','submitRoutingEvidence(true)',null,'btn',!routingMockReplay||routingMockReplay.key!==routingProofKey(c))+'</div>';
  }
  function routingMockChanged(){
    routingReadDraft();const row=currentDetail(),panel=document.getElementById('bfRoutingMockPanel');if(!row||!panel)return;
    const selected=document.getElementById('bfEventSegment')?.value;panel.outerHTML=routingMockPanel(row,selected);
  }
  function makeRoutingMockProof(c,d){
    if(c.error)throw Error(c.error);
    if(!c.segment.ended||!d.completed||!d.retriesCompleted)throw Error('请先结束原段，并明确确认最终处理及全部重试结束。');
    const domain=c.domains.find(x=>x.id===d.domainId);if(!domain)throw Error('请选择本执行方式的固定状态域。');
    if(typeof d.rawCode!=='string'||!d.rawCode.trim()||typeof d.rawLabel!=='string'||!d.rawLabel.trim())throw Error('请填写并保留原始 code 和 label。');
    const rawAllowed=c.channel==='AI'?['DCC_LOCAL_LABEL','DAZHONG_CALL_STATUS','HOUPU_RAW_STATUS']:[domain.id];if(!rawAllowed.includes(d.rawDomain))throw Error('请选择与本渠道相符的原始状态来源。');
    if(!['KNOWN','PENDING'].includes(d.state))throw Error('请选择明确的状态核定结果。');
    const normalized=window.DFlowNormalizeStatus(domain.id,d.rawDomain,d.rawCode);
    if(d.state==='KNOWN'&&normalized.state!=='KNOWN')throw Error('此原始状态无法核定映射，请保留原值并选择映射待核。');
    const proof={simulation:true,source:'LOCAL_MOCK',tenantId:c.segment.tenantId,roundId:c.segment.roundId,nodeRunId:c.segment.nodeRunId,segmentId:c.segment.segmentId,channel:c.channel,domainId:domain.id,rawDomain:d.rawDomain,rawCode:d.rawCode,rawLabel:d.rawLabel,state:d.state,statusValue:d.state==='KNOWN'?normalized.value:null,completed:true,retriesCompleted:true};
    if(c.channel==='AI'){
      if(!['KNOWN','NONE','PENDING'].includes(d.tagState))throw Error('请选择明确的标签识别状态。');
      const ctx=d.contextIndex===''?null:c.aiContexts[Number(d.contextIndex)];
      if(!ctx&&d.tagState!=='PENDING')throw Error('请明确选择本租户本分类的固定标签上下文。');
      if(ctx){
        if(ctx.tenantId!==c.segment.tenantId||ctx.categoryId!==c.categoryRef.categoryId||ctx.brandId!==c.categoryRef.brandId)throw Error('标签上下文不属于原租户、品牌或分类。');
        const ids=d.ids||[];if(new Set(ids).size!==ids.length||ids.some(id=>!ctx.tags.some(t=>t.id===id)))throw Error('所选标签不属于固定稳定标识目录。');
        if(d.tagState==='KNOWN'&&!ids.length)throw Error('已映射状态须选择标签；明确无标签请选择对应识别状态。');
        if(d.tagState!=='KNOWN'&&ids.length)throw Error('待识别或明确无标签时请明确取消已选标签。');
        proof.tags={...Object.fromEntries(['supplierId','tenantId','tenantType','tagSceneId','revision','categoryId','brandId'].map(k=>[k,ctx[k]])),state:d.tagState,ids:routingProofClone(ids)};
      }
    }
    return proof;
  }
  function submitRoutingEvidence(repeat=false){
    const row=currentDetail();if(!row||row.viewIdentity!=='current')return;
    const segmentId=document.getElementById('bfEventSegment')?.value,c=routingMockContext(row,segmentId);if(!c)return;
    try{
      routingReadDraft();let payload;
      if(repeat){if(!routingMockReplay||routingMockReplay.key!==routingProofKey(c))throw Error('本上下文没有可重放的条件证据事件。');payload=routingProofClone(routingMockReplay.payload);}
      else{const d=routingDraftFor(c);payload={segmentId:c.segment.segmentId,eventId:'MOCK-ROUTING-'+crypto.randomUUID(),type:'call-result',routingEvidence:makeRoutingMockProof(c,d)};routingMockReplay={key:routingProofKey(c),payload:routingProofClone(payload)};}
      const result=call('executionEvent',row.recordId,payload,{requestId:'BF-ROUTING-'+crypto.randomUUID(),expectedRevision:c.revision});
      feedback=result;rememberPending(result,'本地条件证据',row.recordId);refresh();
    }catch(error){feedback={status:'failed',message:error.message||'本地条件证据未提交，填写内容保留。'};const panel=document.getElementById('bfRoutingMockPanel');if(panel){const old=panel.querySelector('[data-routing-proof-error]');if(old)old.remove();panel.insertAdjacentHTML('beforeend','<p data-routing-proof-error class="bf-blocked">'+e(feedback.message)+'</p>');}}
  }
