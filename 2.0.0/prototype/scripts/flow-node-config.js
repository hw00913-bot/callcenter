  // Configure a processing node in the same order users describe it:
  // basic information, one processing method, then branch conditions.
  const processMethodProfiles={
    AI:{label:'AI 外呼',channel:'AI',domainId:'DCC_LOCAL_LABEL'},
    MANUAL:{label:'人工外呼',channel:'CLOUD',domainId:'TIANRUN_MANUAL_SIP_CAUSE'},
    PREDICTIVE:{label:'预外呼',channel:'CLOUD',domainId:'TIANRUN_PREDICTIVE_SIP_CAUSE'}
  };
  function processMethodChoice(node){return node?.methods?.length===1&&processMethodProfiles[node.methods[0]]?node.methods[0]:'';}
  function branchResultMethod(node){const c=node.conditionSource||{};if(c.channel==='AI')return 'AI';if(c.domainId==='TIANRUN_MANUAL_SIP_CAUSE')return 'MANUAL';if(c.domainId==='TIANRUN_PREDICTIVE_SIP_CAUSE')return 'PREDICTIVE';return c.channel?'':'IMPORT';}
  function compatibleMethodSource(node,method){const p=processMethodProfiles[method],c=node.conditionSource||{};return !!p&&c.channel===p.channel&&c.domainId===p.domainId;}
  function setMethodSource(node,method){
    const profile=processMethodProfiles[method],prior=node.conditionSource||{},previous=branchResultMethod(node);
    const history=(editor.methodSourceHistory||={})[node.nodeId]||((editor.methodSourceHistory[node.nodeId])={});
    if(previous)history[previous]=clone(prior);
    // Switching methods and returning keeps the exact source selected in this draft.
    const remembered=history[method],retained=compatibleMethodSource(node,method)?prior:remembered&&compatibleMethodSource({conditionSource:remembered},method)?remembered:null;
    const domainId=retained?.domainId||profile.domainId;
    node.conditionSource={...prior,...(retained||{}),channel:profile.channel,domainId,scope:prior.scope||retained?.scope||(node.type==='PROCESS'?'CURRENT_NODE':'CURRENT_ROUND')};
    if(profile.channel==='CLOUD'){
      const allowed=new Set((window.DFlowStatusDomains||[]).find(domain=>domain.id===profile.domainId)?.statuses.map(item=>item.value)||[]);
      for(const edge of nodeEdges(node.nodeId))for(const rule of edge.conditions?.rules||[])if(rule.source==='CALL_STATUS')rule.values=(rule.values||[]).filter(value=>allowed.has(value));
    }
  }
  function refreshCloudStatusSources(){
    if(!editor||editor.readOnly||editor.busy||editor.pending)return;
    for(const node of editor.values.nodes||[]){
      const method=processMethodChoice(node);
      if(node.type==='PROCESS'&&['MANUAL','PREDICTIVE'].includes(method)&&!compatibleMethodSource(node,method))setMethodSource(node,method);
    }
    for(const node of editor.values.nodes||[]){
      if(node.type!=='TRANSFER'||!node.conditionSource?.sourceNodeId)continue;
      const origin=nodeById(node.conditionSource.sourceNodeId),method=processMethodChoice(origin),profile=processMethodProfiles[method];
      if(!profile||profile.channel!=='CLOUD'||compatibleMethodSource(node,method))continue;
      const sourceNodeId=node.conditionSource.sourceNodeId,scope=node.conditionSource.scope||'CURRENT_ROUND';
      setMethodSource(node,method);node.conditionSource={...node.conditionSource,sourceNodeId,scope};
    }
  }
  function selectProcessMethod(nodeId,method){
    if(!editableRouting()||!processMethodProfiles[method])return;readValues();const node=nodeById(nodeId);if(!node||node.type!=='PROCESS')return;
    const changed=node.methods?.length!==1||node.methods[0]!==method,hasRules=nodeEdges(nodeId).some(edge=>edge.conditions?.rules?.length);
    node.methods=[method];setMethodSource(node,method);touch();
    if(changed&&hasRules){editor.status='';editor.statusKind='';}
    draw();
  }
  function selectBranchResultMethod(nodeId,method){
    if(!editableRouting()||method!=='IMPORT'&&!processMethodProfiles[method])return;readValues();const node=nodeById(nodeId);if(!node||node.type!=='TRANSFER')return;
    if(method==='IMPORT'){
      const previous=branchResultMethod(node),prior=node.conditionSource||{},history=(editor.methodSourceHistory||={})[node.nodeId]||((editor.methodSourceHistory[node.nodeId])={});
      if(previous&&previous!=='IMPORT')history[previous]=clone(prior);
      node.conditionSource={scope:prior.scope||'CURRENT_ROUND'};touch();draw();return;
    }
    setMethodSource(node,method);if(node.conditionSource.scope==='CURRENT_NODE')node.conditionSource.scope='CURRENT_ROUND';touch();draw();
  }
  function methodSection(node){
    const selected=processMethodChoice(node),readonly=editor.readOnly;
    const choices=Object.entries(processMethodProfiles).map(([value,item])=>'<label class="fc-method-option"><input type="radio" data-node-method name="'+e(nodeFieldId(node.nodeId,'method-choice'))+'" value="'+value+'"'+(selected===value?' checked':'')+(readonly?' disabled':' onchange="'+call('selectProcessMethod',node.nodeId,value)+'"')+'><span class="fc-method-label">'+item.label+'</span></label>').join('');
    return '<section class="fc-node-config-section" data-config-step="method"><h4 class="fc-config-step-title"><span>02</span>呼叫方式 <em>*</em></h4><div id="'+e(nodeFieldId(node.nodeId,'methods'))+'" class="fc-method-options" data-single-method tabindex="-1">'+choices+'</div></section>';
  }
  function nodeBranchContext(node){
    const rules=nodeEdges(node.nodeId).flatMap(edge=>edge.conditions?.rules||[]);
    const isProcess=node.type==='PROCESS',readonly=editor.readOnly,method=isProcess?processMethodChoice(node):branchResultMethod(node),c=node.conditionSource||{},disabled=readonly?' disabled':'',data=routingDirectory().data||{};
    const change=key=>e('FlowConfiguration.changeNodeSource('+JSON.stringify(node.nodeId)+','+JSON.stringify(key)+',this.value)');
    const needsEvidence=rules.some(rule=>['CALL_STATUS','AI_TAG','FOLLOWUP'].includes(rule.source));
    let html='';
    if(isProcess&&processMethodProfiles[method]){

      if(needsEvidence&&!compatibleMethodSource(node,method))html+=message('条件来源与呼叫方式不一致，请重新选择。','pending')+(readonly?'':'<button type="button" class="btn" onclick="'+call('selectProcessMethod',node.nodeId,method)+'">使用'+e(processMethodProfiles[method].label)+'结果</button>');
    }else if(!isProcess&&(needsEvidence||fourUpstreamCalls(node.nodeId).length)){
      html+=fourTransferSourceControl(node,readonly);
    }
    if(needsEvidence&&method&&method!=='IMPORT'&&isProcess){
      const domainField='';
      html+='<details class="fc-source-advanced"><summary>结果范围：'+e(scopeLabel(c.scope||'CURRENT_NODE'))+'</summary>'+field('使用哪次处理结果','<select data-condition-source="scope"'+disabled+' onchange="'+change('scope')+'">'+options(routingScopes,c.scope||'CURRENT_NODE')+'</select>')+domainField+'</details>';
    }
    if(c.channel==='AI'&&rules.some(rule=>rule.source==='AI_TAG')){
      const contexts=data.aiContexts||[],selected=contexts.findIndex(x=>['supplierId','tenantId','tenantType','tagSceneId','revision'].every(k=>x[k]===c[k]));
      html+='<section class="fc-ai-tag-context"><h4>AI 意向标签配置</h4>'+field('标签配置','<select data-ai-context'+disabled+' onchange="'+e('FlowConfiguration.selectAIContext('+JSON.stringify(node.nodeId)+',this.value)')+'">'+options(contexts.map((x,index)=>({value:String(index),label:(x.supplierLabel||x.supplierId)+' · '+(x.tenantType==='headquarters'?'总部':'门店')+' · '+(data.categoryLabel||'当前分类')+' · V'+x.revision})),selected<0?'':String(selected),'请选择已有标签配置')+'</select>','');
      if(!readonly)html+='<button type="button" class="btn" onclick="FlowConfiguration.loadAITagConfiguration()"'+(editor.aiLoading?' disabled':'')+'>'+(editor.aiLoading?'正在读取…':'读取AI标签配置')+'</button>';
      if(!contexts.length)html+='<p class="fc-muted">暂无可用标签配置。</p>';if(data.aiError)html+=message(data.aiError,'pending');html+='</section>';
    }
    return html;
  }
  function ruleScopeControl(rule,node,disabled,change){
    if(rule.source==='FOLLOWUP')return '<details class="fc-source-advanced"><summary>字段取值范围：'+e(scopeLabel(rule.scope||'CURRENT_NODE'))+'</summary>'+field('读取哪次保存的字段','<select data-rule-scope'+disabled+' onchange="'+change('scope')+'">'+options(routingScopes,rule.scope||'CURRENT_NODE')+'</select>')+'</details>';
    if(rule.source==='IMPORT')return '<small class="fc-rule-source-note">使用这条业务记录导入时的字段值。</small>';
    if(['CALL_STATUS','AI_TAG'].includes(rule.source))return '<small class="fc-rule-source-note">取值范围：'+e(scopeLabel(node.conditionSource?.scope||'CURRENT_NODE'))+'；可在本节点的“结果范围”中调整。</small>';
    return '';
  }
  function nodeCard(n,index,nodes){
    if(n?.type==='START')return fourStartCard();
    const readonly=editor.readOnly,expanded=editor.expanded.has(n.nodeId),isProcess=n.type==='PROCESS',isEnd=n.type==='END';
    const basics='<div class="fc-node-field"><label for="'+e(nodeFieldId(n.nodeId,'name'))+'">节点名称</label><input id="'+e(nodeFieldId(n.nodeId,'name'))+'" data-node="name" aria-label="节点名称" value="'+e(n.name||nodeTypes[n.type]||'')+'"'+(readonly?' readonly':' placeholder="留空时使用默认名称" oninput="'+e('FlowConfiguration.updateNodeName('+JSON.stringify(n.nodeId)+',this.value)')+'"')+'></div>'+(isProcess?fourRecipientControl(n.recipient||{kind:'TENANT',scope:'CURRENT'},'node',n.nodeId,readonly):'');
    const branches=isEnd?fourOutcomeControl(n,readonly):'<section class="fc-node-config-section fc-node-branch-section" data-config-step="branches"><h4 class="fc-config-step-title"><span>'+(isProcess?'03':'02')+'</span>'+'流转条件'+'</h4>'+nodeBranchContext(n)+edgeConditions(n,nodes)+'</section>';
    return '<article class="fc-node-card" data-node-id="'+e(n.nodeId)+'"><div class="fc-node-card-head"><h4 data-node-title>'+e(nodeLabel(n,index))+'</h4><span class="fc-node-fixed-type">'+e(nodeTypes[n.type]||n.type)+'</span><div class="fc-actions">'+(readonly?'':'<button type="button" class="fc-delete-row" onclick="'+call('removeRow','node',index)+'">删除节点</button>')+'</div></div><div class="fc-node-body"'+(expanded?'':' hidden')+'><section class="fc-node-config-section" data-config-step="basics"><h4 class="fc-config-step-title"><span>01</span>基本信息</h4><div class="fc-node-form-grid">'+basics+'</div></section>'+(isProcess?methodSection(n):'')+branches+'</div></article>';
  }
