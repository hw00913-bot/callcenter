"""Project-owned four-node editor UI; keeps one edge/condition data model."""
import re


def one(code, before, after):
    if code.count(before) != 1:
        raise ValueError('Four-node UI source conflict: ' + before[:150])
    return code.replace(before, after, 1)


def function(code, name, replacement):
    marker = '  function ' + name + '('
    if code.count(marker) != 1:
        raise ValueError('Four-node UI function conflict: ' + name)
    start = code.index(marker)
    match = re.search(r'^  (?:async )?function ', code[start + len(marker):], re.M)
    if not match:
        end=code.find('\n  window.FlowConfiguration=',start)
        if end<0:raise ValueError('Four-node UI end boundary missing: ' + name)
    else:end = start + len(marker) + match.start()
    return code[:start] + replacement.strip('\n') + '\n' + code[end:]


HELPERS = r'''
  function fourTenantChoices(){const id=routeEditor?.brandId||editor?.brandId||brandId,result=getCatalog(id);return result.status==='success'?(result.data.tenantChoices||[]).filter(row=>row.brandId===id&&row.enabled!==false):[];}
  function fourRecipientLabel(value){
    if(value?.kind==='HQ')return '品牌总部';
    if(value?.kind==='TENANT'&&value.scope==='OTHER')return value.tenantId?(fourTenantChoices().find(row=>row.tenantId===value.tenantId)?.name||value.tenantId):'其他租户（意向门店／运行时指派）';
    return '本租户（当前负责租户）';
  }
  function fourRecipientControl(value,subject,id,readonly){
    const transfer=subject==='edge',r=value||{kind:'TENANT',scope:transfer?'OTHER':'CURRENT'},disabled=readonly?' disabled':'',change=key=>e('FlowConfiguration.setFourRecipient('+JSON.stringify(subject)+','+JSON.stringify(id)+','+JSON.stringify(key)+',this.value)');
    let html=field('承接方','<select data-four-recipient-kind'+disabled+' onchange="'+change('kind')+'">'+options([{value:'HQ',label:'品牌总部'},{value:'TENANT',label:'品牌租户'}],r.kind||'TENANT')+'</select>');
    if(r.kind!=='HQ'){
      html+=field('租户范围','<select data-four-recipient-scope'+disabled+' onchange="'+change('scope')+'"><option value="CURRENT"'+(r.scope==='CURRENT'?' selected':'')+'>本租户（当前负责租户）</option><option value="OTHER"'+(r.scope==='OTHER'?' selected':'')+'>其他租户</option></select>');
      if(r.scope==='OTHER'){
        const tenants=fourTenantChoices(),items=tenants.map(row=>({value:row.tenantId,label:row.name+(row.kind==='HQ'?' · 总部':' · 门店')}));
        if(r.tenantId&&!items.some(row=>row.value===r.tenantId))items.push({value:r.tenantId,label:r.tenantId+'（当前不可用）'});
        html+=field('目标租户','<select data-four-recipient-tenant'+disabled+' onchange="'+change('tenantId')+'">'+options(items,r.tenantId||'',transfer?'按意向门店定位；无意向由总部有权人员指派':'继承合法前置转交已确定的目标')+'</select>');
      }
    }
    return '<div class="fc-four-recipient">'+html+'</div>';
  }
  function setFourRecipient(subject,id,key,value){
    if(!editableRouting()||!['node','edge'].includes(subject)||!['kind','scope','tenantId'].includes(key))return;readValues();
    const target=subject==='node'?nodeById(id):editor.values.edges.find(row=>row.edgeId===id);if(!target||subject==='node'&&target.type!=='PROCESS')return;
    const current=target.recipient||{kind:'TENANT',scope:subject==='edge'?'OTHER':'CURRENT'};let next={...current};
    if(key==='kind'){if(!['HQ','TENANT'].includes(value))return;next=value==='HQ'?{kind:'HQ'}:{kind:'TENANT',scope:current.kind==='TENANT'?current.scope:subject==='edge'?'OTHER':'CURRENT',...(current.tenantId?{tenantId:current.tenantId}:{})};}
    else if(key==='scope'){if(!['CURRENT','OTHER'].includes(value))return;next={kind:'TENANT',scope:value,...(value==='OTHER'&&current.tenantId?{tenantId:current.tenantId}:{})};}
    else{if(value&&!fourTenantChoices().some(row=>row.tenantId===value))return status('请选择本品牌当前有权的有效租户。','error');next={kind:'TENANT',scope:'OTHER',...(value?{tenantId:value}:{})};}
    target.recipient=next;if(subject==='node')target.duty=next.kind==='HQ'?'HQ':'CURRENT';touch();draw();
  }
  function fourUpstreamCalls(nodeId){
    const seen=new Set(),found=[],queue=editor.values.edges.filter(edge=>edge.toNodeId===nodeId).map(edge=>edge.fromNodeId);
    while(queue.length){const id=queue.shift();if(id===nodeId||seen.has(id))continue;seen.add(id);const node=nodeById(id);if(!node)continue;if(node.type==='TRANSFER')continue;if(node.type==='PROCESS')found.push(node);queue.push(...editor.values.edges.filter(edge=>edge.toNodeId===id).map(edge=>edge.fromNodeId));}
    return found;
  }
  function fourTransferSourceControl(node,readonly){
    const current=node.conditionSource||{},choices=fourUpstreamCalls(node.nodeId),selected=current.sourceNodeId||'',disabled=readonly?' disabled':'',items=choices.map(row=>({value:row.nodeId,label:row.name+' · '+(processMethodProfiles[processMethodChoice(row)]?.label||'呼叫方式待配置')}));
    if(selected&&!items.some(row=>row.value===selected))items.push({value:selected,label:selected+'（原上游来源不可用）'});
    const hasCallRules=nodeEdges(node.nodeId).some(edge=>(edge.conditions?.rules||[]).some(rule=>['CALL_STATUS','AI_TAG','FOLLOWUP'].includes(rule.source))),source=choices.find(row=>row.nodeId===selected),profile=processMethodProfiles[processMethodChoice(source)],changed=source&&profile&&(current.channel!==profile.channel||current.domainId!==(source.conditionSource?.domainId||profile.domainId));
    return field('上游办理结果（可选）','<select data-four-upstream'+disabled+' onchange="'+e('FlowConfiguration.selectFourUpstream('+JSON.stringify(node.nodeId)+',this.value)')+'">'+options(items,selected,'仅使用导入字段，无需呼叫结果')+'</select>','')+(hasCallRules&&!selected?message('请选择上游结果来源。','pending'):'')+(changed?message('上游方式已变化，请更新结果来源。','pending')+(readonly?'':'<button type="button" class="btn" onclick="'+call('selectFourUpstream',node.nodeId,selected)+'">按当前上游节点更新来源</button>'):'');
  }
  function selectFourUpstream(nodeId,sourceId){
    if(!editableRouting())return;readValues();const node=nodeById(nodeId);if(!node||node.type!=='TRANSFER')return;
    if(!sourceId)node.conditionSource={scope:'CURRENT_ROUND'};
    else{const source=fourUpstreamCalls(nodeId).find(row=>row.nodeId===sourceId),method=processMethodChoice(source);if(!source||!method)return status('请先完成上游呼叫方式配置，再选择准确来源。','error');node.conditionSource={...clone(source.conditionSource||{}),channel:processMethodProfiles[method].channel,domainId:source.conditionSource?.domainId||processMethodProfiles[method].domainId,sourceNodeId:source.nodeId,scope:'CURRENT_ROUND'};}
    for(const edge of nodeEdges(nodeId))for(const rule of edge.conditions?.rules||[])if(rule.source==='FOLLOWUP')rule.scope='CURRENT_ROUND';
    touch();editor.status='上游来源已明确，原条件、字段身份和比较值保留，请核对。';editor.statusKind='pending';draw();
  }
  function fourNormalizePaths(nodeId){
    const node=nodeById(nodeId);if(!node)return;const existing=nodeEdges(nodeId),ordered=existing.filter(edge=>edge.branch?.kind!=='ELSE').concat(existing.filter(edge=>edge.branch?.kind==='ELSE'));let condition=0;
    ordered.forEach((edge,index)=>{const fallback=edge.branch?.kind==='ELSE';edge.branch={...(edge.branch||{}),kind:fallback?'ELSE':condition++===0?'IF':'ELSEIF',priority:index+1};edge.conditions||={enabled:!fallback,mode:'ALL',rules:[]};edge.conditions.enabled=!fallback;if(node.type==='TRANSFER'&&!edge.recipient)edge.recipient={kind:'TENANT',scope:'OTHER'};});
    node.next=ordered.map(edge=>edge.toNodeId).filter(Boolean);
  }
  function fourBranchLabel(branch){return branch?.kind==='ELSE'?'ELSE（兜底）':branch?.kind==='ELSEIF'?'ELSE IF':'IF';}
  function fourTargetWouldCycle(nodeId,targetId,ignoredEdgeId=''){
    if(!targetId)return false;if(nodeId===targetId)return true;
    const ids=new Set((editor.values.nodes||[]).map(node=>node.nodeId)),seen=new Set(),queue=[targetId];
    while(queue.length){const id=queue.shift();if(id===nodeId)return true;if(seen.has(id)||!ids.has(id))continue;seen.add(id);for(const edge of editor.values.edges||[])if(edge.edgeId!==ignoredEdgeId&&edge.fromNodeId===id&&edge.toNodeId&&ids.has(edge.toNodeId))queue.push(edge.toNodeId);}
    return false;
  }
  function fourTargetIssue(nodeId,edgeId,text,kind=''){
    editor.targetIssue={nodeId,edgeId:edgeId||'',text};editor.selectedNodeId=nodeId;editor.inspectorClosed=false;editor.expanded=new Set([nodeId]);editor.status='';editor.statusKind='';draw();
    const edge=editor.values.edges.find(row=>row.edgeId===edgeId),key=kind==='fallback'||edge?.branch?.kind==='ELSE'?nodeFieldId(nodeId,'fallback'):edgeId?edgeControlId(edgeId):nodeFieldId(nodeId,'new-path');
    requestAnimationFrame(()=>focusNodeField(null,key));return false;
  }
  function fourClearTargetIssue(nodeId,edgeId){if(editor.targetIssue?.nodeId===nodeId&&(!edgeId||editor.targetIssue.edgeId===edgeId))editor.targetIssue=null;}
  function fourTargetIssueMarkup(nodeId,edgeId){const issue=editor.targetIssue;return issue?.nodeId===nodeId&&issue.edgeId===(edgeId||'')?message(issue.text,'error'):'';}
  function fourPathSummary(edge){
    const node=nodeById(edge.fromNodeId),rules=edge.conditions?.rules||[],base=fourBranchLabel(edge.branch)+(edge.branch?.kind==='ELSE'?'':rules.length?'：'+rules.map(rule=>routingRuleLabel(rule,node,editor.values.routingCatalog||{})).join(edge.conditions.mode==='ANY'?' 或 ':' 且 '):'：条件待配置');
    return base+(node?.type==='TRANSFER'?' → '+fourRecipientLabel(edge.recipient||{kind:'TENANT',scope:'OTHER'}):'');
  }
  function fourPathLabel(edge){const text=fourPathSummary(edge);return text.length>64?text.slice(0,63)+'…':text;}
  function fourNewRule(node){return {ruleId:stableId('RULE'),source:'',operator:'',values:[],scope:node.type==='TRANSFER'?'CURRENT_ROUND':node.conditionSource?.scope||'CURRENT_NODE'};}
  function fourCreateBranch(node,kind='IF',targetId=''){
    const edge={edgeId:stableId('EDGE'),fromNodeId:node.nodeId,toNodeId:targetId,branch:{kind,priority:nodeEdges(node.nodeId).length+1},conditions:{enabled:kind!=='ELSE',mode:'ALL',rules:kind==='ELSE'?[]:[fourNewRule(node)]},...(node.type==='TRANSFER'?{recipient:{kind:'TENANT',scope:'OTHER'}}:{})};
    editor.values.edges.push(edge);fourNormalizePaths(node.nodeId);return edge;
  }
  function fourInitializeBranchDraft(nodeId){const node=nodeById(nodeId);if(!node||node.type==='END'||nodeEdges(nodeId).length)return;fourCreateBranch(node);fourCreateBranch(node,'ELSE');}
  function fourAddBranch(nodeId){if(!editableRouting())return;readValues();const node=nodeById(nodeId);if(!node||node.type==='END')return;const edge=fourCreateBranch(node);touch();draw();requestAnimationFrame(()=>focusNodeField(null,edgeControlId(edge.edgeId)));}
  function fourConnectTarget(nodeId,targetId){
    const node=nodeById(nodeId);if(!node||node.type==='END'||!nodeById(targetId))return false;
    const draft=nodeEdges(nodeId).find(row=>row.branch?.kind!=='ELSE'&&!row.toNodeId);
    if(fourTargetWouldCycle(nodeId,targetId,draft?.edgeId))return fourTargetIssue(nodeId,draft?.edgeId,'不能连接回前面的节点，请选择其他下一节点。');
    if(node.next.includes(targetId))return fourTargetIssue(nodeId,nodeEdges(nodeId).find(row=>row.toNodeId===targetId)?.edgeId,'该下一节点已经连接。');
    const edge=draft||fourCreateBranch(node);edge.toNodeId=targetId;fourClearTargetIssue(nodeId);fourNormalizePaths(nodeId);return true;
  }
  function fourAddPath(nodeId,targetId){if(!editableRouting()||!targetId)return;readValues();if(!fourConnectTarget(nodeId,targetId))return;touch();draw();}
  function fourChangeDefaultTarget(nodeId,targetId){
    if(!editableRouting())return;readValues();const node=nodeById(nodeId);if(!node||node.type==='END'||targetId&&!nodeById(targetId))return;
    const rows=nodeEdges(nodeId),prior=rows.find(row=>row.branch?.kind==='ELSE');
    if(fourTargetWouldCycle(nodeId,targetId,prior?.edgeId))return fourTargetIssue(nodeId,prior?.edgeId,'不能连接回前面的节点，请选择其他下一节点。','fallback');
    if(targetId&&rows.some(row=>row!==prior&&row.toNodeId===targetId))return fourTargetIssue(nodeId,prior?.edgeId,'该下一节点已用于条件分支。','fallback');
    const edge=prior||fourCreateBranch(node,'ELSE');edge.toNodeId=targetId||'';fourClearTargetIssue(nodeId);fourNormalizePaths(nodeId);touch();draw();
  }
  function fourChangeTarget(edgeId,targetId){
    if(!editableRouting())return;readValues();const edge=editor.values.edges.find(row=>row.edgeId===edgeId),target=nodeById(targetId);if(!edge||targetId&&!target)return;
    if(fourTargetWouldCycle(edge.fromNodeId,targetId,edgeId))return fourTargetIssue(edge.fromNodeId,edgeId,'不能连接回前面的节点，请选择其他下一节点。');
    if(targetId&&editor.values.edges.some(row=>row.edgeId!==edgeId&&row.fromNodeId===edge.fromNodeId&&row.toNodeId===targetId))return fourTargetIssue(edge.fromNodeId,edgeId,'该下一节点已经连接。');
    edge.toNodeId=targetId;fourClearTargetIssue(edge.fromNodeId,edgeId);fourNormalizePaths(edge.fromNodeId);touch();draw();
  }
  function fourRemovePath(edgeId,confirmed=false){
    if(!editableRouting())return;readValues();const edge=editor.values.edges.find(row=>row.edgeId===edgeId),current=editor;if(!edge)return;
    if(!confirmed&&(edge.branch?.kind==='ELSE'||edge.conditions?.rules?.length)){ui.confirm({id:'fc-four-remove-path',title:edge.branch?.kind==='ELSE'?'移除其他情况路径？':'移除此条件分支？',body:'<p>确认后移除此分支，其他分支保留。</p>',confirmText:'确认移除',cancelText:'保留路径',onConfirm:()=>{if(editor!==current)return false;ui.closeLayer('fc-four-remove-path',false);fourRemovePath(edgeId,true);return false;}});return;}
    const node=nodeById(edge.fromNodeId);editor.values.edges=editor.values.edges.filter(row=>row.edgeId!==edgeId);for(const [id,change]of Object.entries(editor.ruleChanges||{}))if(change.edgeId===edgeId)delete editor.ruleChanges[id];fourClearTargetIssue(edge.fromNodeId,edgeId);if(node)node.next=node.next.filter(id=>id!==edge.toNodeId);fourNormalizePaths(edge.fromNodeId);touch();draw();
  }
  function fourMovePath(edgeId,step){
    if(!editableRouting())return;readValues();const edge=editor.values.edges.find(row=>row.edgeId===edgeId);if(!edge||edge.branch?.kind==='ELSE')return;const rows=nodeEdges(edge.fromNodeId).filter(row=>row.branch?.kind!=='ELSE'),index=rows.indexOf(edge),next=index+step;if(next<0||next>=rows.length)return;[rows[index],rows[next]]=[rows[next],rows[index]];rows.forEach((row,i)=>row.branch.priority=i+1);const fallback=nodeEdges(edge.fromNodeId).find(row=>row.branch?.kind==='ELSE');if(fallback)fallback.branch.priority=rows.length+1;fourNormalizePaths(edge.fromNodeId);touch();draw();
  }
  function fourSetDefault(edgeId,enabled,confirmed=false){
    if(!editableRouting())return;readValues();const edge=editor.values.edges.find(row=>row.edgeId===edgeId),current=editor;if(!edge)return;
    if(!enabled&&edge.branch?.kind==='ELSE')return status('ELSE 兜底路径必需，不能取消；可调整其下一节点。','error');
    if(enabled&&editor.values.edges.some(row=>row.edgeId!==edgeId&&row.fromNodeId===edge.fromNodeId&&row.branch?.kind==='ELSE'))return status('同一节点只能有一条默认路径，请先调整原默认路径。','error');
    if(enabled&&!confirmed&&edge.conditions?.rules?.length){ui.confirm({id:'fc-four-default',title:'改为默认路径并清除本路径条件？',body:'<p>默认路径不带条件，只有前方条件均不匹配时才使用。取消保留原条件。</p>',confirmText:'确认改为默认路径',cancelText:'保留条件',onConfirm:()=>{if(editor!==current)return false;ui.closeLayer('fc-four-default',false);fourSetDefault(edgeId,true,true);return false;}});return;}
    edge.branch={...(edge.branch||{}),kind:enabled?'ELSE':'IF'};if(enabled)for(const [id,change]of Object.entries(editor.ruleChanges||{}))if(change.edgeId===edgeId)delete editor.ruleChanges[id];edge.conditions=enabled?{enabled:false,mode:'ALL',rules:[]}:{...(edge.conditions||{}),enabled:true,mode:edge.conditions?.mode||'ALL',rules:edge.conditions?.rules||[]};fourNormalizePaths(edge.fromNodeId);touch();draw();
  }
  function fourAddRule(edgeId){
    if(!editableRouting())return;readValues();const edge=editor.values.edges.find(row=>row.edgeId===edgeId);if(!edge)return;
    if(edge.branch?.kind==='ELSE')return status('ELSE 兜底路径不设置条件；请新增 IF / ELSE IF 条件路径。','error');edge.conditions||={enabled:true,mode:'ALL',rules:[]};edge.conditions.enabled=true;edge.conditions.rules.push({ruleId:stableId('RULE'),source:'',operator:'',values:[],scope:nodeById(edge.fromNodeId)?.type==='TRANSFER'?'CURRENT_ROUND':nodeById(edge.fromNodeId)?.conditionSource?.scope||'CURRENT_NODE'});fourNormalizePaths(edge.fromNodeId);touch();draw();
  }
'''


SYNC_EDGES = r'''
  function syncEdges(){
    if(!editor)return;const values=editor.values,prior=values.edges||[];
    values.edges=prior.filter(edge=>{const node=values.nodes.find(row=>row.nodeId===edge.fromNodeId);return node&&(!edge.toNodeId||(node.next||[]).includes(edge.toNodeId)&&values.nodes.some(target=>target.nodeId===edge.toNodeId));});
    for(const node of values.nodes)for(const targetId of node.next||[])if(!values.edges.some(edge=>edge.fromNodeId===node.nodeId&&edge.toNodeId===targetId))fourCreateBranch(node,'IF',targetId);
    for(const node of values.nodes)fourNormalizePaths(node.nodeId);
  }
'''


ENTRY_HELPERS = r'''
  const fourEntryContexts=[{id:'OWNER_KIND',label:'当前负责方',type:'select',options:[{id:'HQ',label:'品牌总部'},{id:'STORE',label:'品牌门店'}]},{id:'PURPOSE',label:'办理目的',type:'select',options:[{id:'FIRST',label:'首次办理'},{id:'FOLLOWUP',label:'再次跟进'},{id:'CORRECTION',label:'纠偏办理'},{id:'RECLASSIFY',label:'转类后办理'}]}];
  function fourEntryRows(value=editor?.values){return Array.isArray(value?.entryRules)&&value.entryRules.length?value.entryRules:[{entryId:'DISPLAY-DEFAULT',name:'默认入口',toNodeId:value?.startNodeId||'',branch:{kind:'ELSE',priority:1},conditions:{enabled:false,mode:'ALL',rules:[]}}];}
  function fourEnsureEntries(value=editor?.values){if(!value)return [];value.productRulesVersion=2;if(!Array.isArray(value.entryRules)||!value.entryRules.length)value.entryRules=[{entryId:stableId('ENTRY'),name:'默认入口',toNodeId:value.startNodeId||'',branch:{kind:'ELSE',priority:1},conditions:{enabled:false,mode:'ALL',rules:[]}}];return value.entryRules;}
  function fourNormalizeEntries(){const rows=fourEnsureEntries(),ordered=rows.filter(row=>row.branch?.kind!=='ELSE').concat(rows.filter(row=>row.branch?.kind==='ELSE'));let n=0;ordered.forEach((row,i)=>{const fallback=row.branch?.kind==='ELSE';row.branch={kind:fallback?'ELSE':n++===0?'IF':'ELSEIF',priority:i+1};row.conditions||={enabled:!fallback,mode:'ALL',rules:[]};row.conditions.enabled=!fallback;});editor.values.entryRules=ordered;const fallback=ordered.find(row=>row.branch.kind==='ELSE');if(fallback)editor.values.startNodeId=fallback.toNodeId;}
  function fourEntryDirectory(value=editor?.values){const result=editor&&!editor.readOnly&&value===editor.values&&S()?.entryCatalog?.(editor.brandId,value?.categoryRef?.categoryId);return result?.status==='success'?result.data:{fields:(value?.routingCatalog?.fields||[]).filter(f=>f.source==='IMPORT'),contexts:fourEntryContexts};}
  function fourEntryDefinition(rule,value=editor?.values){const data=fourEntryDirectory(value);return (rule.source==='CONTEXT'?data.contexts||fourEntryContexts:data.fields||[]).find(f=>f.id===rule.fieldId&&f.enabled!==false);}
  function fourEntryRuleLabel(rule,value=editor?.values){const f=fourEntryDefinition(rule,value),operators={EQ:'等于',NE:'不等于',IN:'属于',GT:'大于',GTE:'大于等于',LT:'小于',LTE:'小于等于',IS_EMPTY:'为空',IS_NOT_EMPTY:'不为空',CONTAINS_ANY:'包含任一',CONTAINS_ALL:'包含全部'};return (f?.label||rule.fieldId||'未选来源')+' '+(operators[rule.operator]||'未选判断')+' '+(rule.values||[]).map(v=>f?.options?.find(o=>o.id===v)?.label??String(v)).join('、');}
  function fourEntryPathLabel(entry,value=editor?.values){return fourBranchLabel(entry.branch)+(entry.branch?.kind==='ELSE'?'':(entry.conditions?.rules||[]).length?'：'+entry.conditions.rules.map(rule=>fourEntryRuleLabel(rule,value)).join(entry.conditions.mode==='ANY'?' 或 ':' 且 '):'：入口条件待配置');}
  function fourCanvasEntryEdges(value=editor?.values){return fourEntryRows(value).filter(row=>row.toNodeId).map(row=>({edgeId:'ENTRY:'+row.entryId,fromNodeId:canvasStartId,toNodeId:row.toNodeId,_entry:row}));}
  function fourEntryChanged(){if(!editableRouting())return;touch();editor.values.productRulesVersion=2;draw();}
  function fourSetEntryDefault(targetId){if(!editableRouting())return;const row=fourEnsureEntries().find(row=>row.branch?.kind==='ELSE');if(!row)return;row.toNodeId=targetId;editor.values.startNodeId=targetId;fourEntryChanged();}
  function fourSetEntryTarget(entryId,targetId){if(!editableRouting())return;readValues();if(targetId&&!nodeById(targetId))return;const row=fourEnsureEntries().find(row=>row.entryId===entryId);if(!row)return;row.toNodeId=targetId;fourNormalizeEntries();fourEntryChanged();}
  function fourAddEntry(targetId){if(!editableRouting())return;readValues();if(targetId&&!nodeById(targetId))return;const rows=fourEnsureEntries();rows.unshift({entryId:stableId('ENTRY'),name:'条件入口',toNodeId:targetId||'',branch:{kind:'IF',priority:1},conditions:{enabled:true,mode:'ALL',rules:[{ruleId:stableId('ENTRY-RULE'),source:'CONTEXT',fieldId:'OWNER_KIND',operator:'EQ',values:[]}]}});fourNormalizeEntries();editor.selectedNodeId=canvasStartId;editor.inspectorClosed=false;editor.expanded.add(canvasStartId);fourEntryChanged();}
  function fourRemoveEntry(entryId,confirmed=false){if(!editableRouting())return;readValues();const row=fourEnsureEntries().find(row=>row.entryId===entryId),current=editor;if(!row||row.branch?.kind==='ELSE')return;if(!confirmed&&row.conditions?.rules?.length)return ui.confirm({id:'fc-entry-remove',title:'移除此入口分支？',body:'<p>只移除本次草稿中的入口条件和连接，已开始运行保持原方案。</p>',confirmText:'确认移除',cancelText:'保留分支',onConfirm:()=>{if(editor!==current)return;ui.closeLayer('fc-entry-remove',false);fourRemoveEntry(entryId,true);}});editor.values.entryRules=editor.values.entryRules.filter(row=>row.entryId!==entryId);fourNormalizeEntries();fourEntryChanged();}
  function fourMoveEntry(entryId,step){if(!editableRouting())return;readValues();const rows=fourEnsureEntries().filter(row=>row.branch?.kind!=='ELSE'),index=rows.findIndex(row=>row.entryId===entryId),next=index+step;if(index<0||next<0||next>=rows.length)return;[rows[index],rows[next]]=[rows[next],rows[index]];editor.values.entryRules=rows.concat(fourEnsureEntries().filter(row=>row.branch?.kind==='ELSE'));fourNormalizeEntries();fourEntryChanged();}
  function fourSetEntryMode(entryId,value){if(!editableRouting()||!['ALL','ANY'].includes(value))return;readValues();const row=fourEnsureEntries().find(row=>row.entryId===entryId);if(!row||row.branch?.kind==='ELSE')return;row.conditions.mode=value;fourEntryChanged();}
  function fourAddEntryRule(entryId){if(!editableRouting())return;readValues();const row=fourEnsureEntries().find(row=>row.entryId===entryId);if(!row||row.branch?.kind==='ELSE')return;row.conditions.rules.push({ruleId:stableId('ENTRY-RULE'),source:'',fieldId:'',operator:'',values:[]});fourEntryChanged();}
  function fourRemoveEntryRule(entryId,ruleId){if(!editableRouting())return;readValues();const row=fourEnsureEntries().find(row=>row.entryId===entryId);if(!row||row.branch?.kind==='ELSE')return;row.conditions.rules=row.conditions.rules.filter(rule=>rule.ruleId!==ruleId);fourEntryChanged();}
  function fourChangeEntryRule(entryId,ruleId,key,value,confirmed=false){
    if(!editableRouting()||!['source','operator','values'].includes(key))return;readValues();const row=fourEnsureEntries().find(row=>row.entryId===entryId),rule=row?.conditions?.rules?.find(rule=>rule.ruleId===ruleId),current=editor;if(!rule||row.branch?.kind==='ELSE')return;
    if(key==='source'){let tuple;try{tuple=JSON.parse(value);}catch(_){tuple=['',''];}if(!Array.isArray(tuple)||!['IMPORT','CONTEXT',''].includes(tuple[0]))return;rule.source=tuple[0];rule.fieldId=tuple[1]||'';}
    else if(key==='operator'){
      if(['IS_EMPTY','IS_NOT_EMPTY'].includes(value)&&rule.values?.length&&!confirmed)return ui.confirm({id:'fc-entry-empty',title:'改为空值判断并清空比较值？',body:'<p>空值判断不能同时携带比较值。取消保留原判断和比较值。</p>',confirmText:'确认调整',cancelText:'保留原值',onConfirm:()=>{if(editor!==current)return;ui.closeLayer('fc-entry-empty',false);fourChangeEntryRule(entryId,ruleId,key,value,true);}});
      rule.operator=value;if(confirmed&&['IS_EMPTY','IS_NOT_EMPTY'].includes(value))rule.values=[];
    }else{const def=fourEntryDefinition(rule),raw=Array.isArray(value)?value:String(value).split(/\r?\n/).map(s=>s.trim()).filter(Boolean);rule.values=raw.map(item=>{if(['number','date','datetime','boolean'].includes(def?.type)){const parsed=def.type==='boolean'&&typeof item==='string'&&['true','false'].includes(item)?{ok:true,value:item==='true'}:DFlowRouting.normalizeSavedField?.(item,def.type,'Asia/Shanghai');if(parsed?.ok)return parsed.value;}return item;});}
    fourEntryChanged();
  }
  function fourEntryValuesChanged(entryId,ruleId,controlId){const control=document.getElementById(controlId);if(!control)return;fourChangeEntryRule(entryId,ruleId,'values',control.multiple?Array.from(control.selectedOptions).map(option=>option.value):control.value);}
  function fourEntryRuleControl(entry,rule,index,readonly){
    const data=fourEntryDirectory(),def=fourEntryDefinition(rule),disabled=readonly?' disabled':'',change=(key,value='this.value')=>e('FlowConfiguration.fourChangeEntryRule('+JSON.stringify(entry.entryId)+','+JSON.stringify(rule.ruleId)+','+JSON.stringify(key)+','+value+')');
    const sources=[...(data.contexts||fourEntryContexts).map(f=>({value:JSON.stringify(['CONTEXT',f.id]),label:'业务上下文 · '+f.label})),...(data.fields||[]).filter(f=>f.enabled!==false).map(f=>({value:JSON.stringify(['IMPORT',f.id]),label:'导入字段 · '+f.label}))],selected=JSON.stringify([rule.source||'',rule.fieldId||'']);if(rule.fieldId&&!sources.some(item=>item.value===selected))sources.push({value:selected,label:(rule.fieldId||'原字段')+'（当前不可用）'});
    const labels={EQ:'等于',NE:'不等于',IN:'属于任一',GT:'大于',GTE:'大于等于',LT:'小于',LTE:'小于等于',IS_EMPTY:'为空',IS_NOT_EMPTY:'不为空',CONTAINS_ANY:'包含任一',CONTAINS_ALL:'包含全部'},ops=(DFlowRouting.operators?.(def?.type)||[]).map(value=>({value,label:labels[value]||value}));if(rule.operator&&!ops.some(item=>item.value===rule.operator))ops.push({value:rule.operator,label:(labels[rule.operator]||rule.operator)+'（需核对类型）'});
    const controlId='fc-entry-values-'+entry.entryId+'-'+rule.ruleId,empty=['IS_EMPTY','IS_NOT_EMPTY'].includes(rule.operator);let valueControl;
    if(def?.options?.length){const candidates=[...def.options];for(const value of rule.values||[])if(!candidates.some(o=>o.id===value))candidates.push({id:value,label:String(value)+'（当前来源不可用）'});const multiple=['IN','CONTAINS_ANY','CONTAINS_ALL'].includes(rule.operator)||(rule.values||[]).length>1;valueControl='<select id="'+e(controlId)+'"'+(multiple?' multiple':'')+' aria-label="入口比较值"'+disabled+(empty?' disabled':'')+' onchange="'+e('FlowConfiguration.fourEntryValuesChanged('+JSON.stringify(entry.entryId)+','+JSON.stringify(rule.ruleId)+','+JSON.stringify(controlId)+')')+'">'+(multiple?'':'<option value="">请选择比较值</option>')+candidates.map(o=>'<option value="'+e(o.id)+'"'+((rule.values||[]).includes(o.id)?' selected':'')+(o.enabled===false?' disabled':'')+'>'+e(o.label)+'</option>').join('')+'</select>';}
    else valueControl='<textarea id="'+e(controlId)+'" aria-label="入口比较值" rows="2" placeholder="每行一个比较值"'+disabled+(empty?' disabled':'')+' onchange="'+change('values')+'">'+e((rule.values||[]).join('\n'))+'</textarea>';
    return '<section class="fc-entry-rule"><div class="fc-edge-head"><strong>条件 '+(index+1)+'</strong>'+(readonly?'':'<button type="button" class="fc-delete-row" onclick="'+call('fourRemoveEntryRule',entry.entryId,rule.ruleId)+'">删除条件</button>')+'</div>'+field('条件来源','<select data-entry-source'+disabled+' onchange="'+change('source')+'">'+options(sources,selected,'请选择导入字段或业务上下文')+'</select>')+field('判断方式','<select data-entry-operator'+disabled+' onchange="'+change('operator')+'">'+options(ops,rule.operator||'','请选择判断方式')+'</select>')+field('比较值',valueControl)+(readonly||empty?'':'<button type="button" class="btn-link" onclick="'+e('FlowConfiguration.fourChangeEntryRule('+JSON.stringify(entry.entryId)+','+JSON.stringify(rule.ruleId)+',\'values\',[])')+'">清空比较值</button>')+'</section>';
  }
  function fourStartCard(){
    const readonly=editor.readOnly,disabled=readonly?' disabled':'',rows=fourEntryRows(),nodes=editor.values.nodes||[],conditional=rows.filter(row=>row.branch?.kind!=='ELSE'),targetOptions=nodes.map((n,i)=>({value:n.nodeId,label:nodeLabel(n,i)}));
    const content=rows.map((row,index)=>{const fallback=row.branch?.kind==='ELSE',order=conditional.indexOf(row),head=fourBranchLabel(row.branch)+(fallback?'':' · 条件入口 '+(index+1));return '<section class="fc-edge-card fc-entry-path" data-entry-id="'+e(row.entryId)+'"><div class="fc-edge-head"><strong>'+head+'</strong>'+(readonly||fallback?'':'<div class="fc-actions"><button type="button" class="btn-link"'+(order===0?' disabled':'')+' onclick="'+call('fourMoveEntry',row.entryId,-1)+'">上移</button><button type="button" class="btn-link"'+(order===conditional.length-1?' disabled':'')+' onclick="'+call('fourMoveEntry',row.entryId,1)+'">下移</button><button type="button" class="fc-delete-row" onclick="'+call('fourRemoveEntry',row.entryId)+'">移除</button></div>')+'</div>'+field('进入节点','<select data-entry-target'+disabled+' onchange="'+e('FlowConfiguration.fourSetEntryTarget('+JSON.stringify(row.entryId)+',this.value)')+'">'+options(targetOptions,row.toNodeId,'请选择进入节点')+'</select>')+(fallback?'':field('条件组合','<select data-entry-mode'+disabled+' onchange="'+e('FlowConfiguration.fourSetEntryMode('+JSON.stringify(row.entryId)+',this.value)')+'">'+options([{value:'ALL',label:'全部满足（且）'},{value:'ANY',label:'满足任一（或）'}],row.conditions?.mode||'ALL')+'</select>')+(row.conditions?.rules||[]).map((rule,i)=>fourEntryRuleControl(row,rule,i,readonly)).join('')+(readonly?'':'<button type="button" class="btn" onclick="'+call('fourAddEntryRule',row.entryId)+'">＋ 添加入口条件</button>'))+'</section>';}).join('');
    return '<article class="fc-node-card fc-start-config"><div class="fc-node-card-head"><h4>开始</h4><span class="fc-node-fixed-type">唯一入口</span></div><div class="fc-node-body">'+content+(readonly?'':'<button type="button" class="btn" onclick="FlowConfiguration.fourAddEntry()">＋ 添加条件入口</button>')+'</div></article>';
  }
  function fourEndActionLabel(node){return node?.endAction==='DIRECT_FOLLOWUP'?'无模板跟进':node?.endAction==='CLOSE'?'业务结束':'请选择后续处理';}
  function fourOutcomeControl(node,readonly){
    const selected=node.endAction,disabled=readonly?' disabled':'',change=e('FlowConfiguration.setFourOutcome('+JSON.stringify(node.nodeId)+',\'endAction\',this.value)');
    return '<section class="fc-node-config-section fc-end-outcome"><h4 class="fc-config-step-title"><span>02</span>后续处理</h4><div id="'+e(nodeFieldId(node.nodeId,'end-action'))+'" tabindex="-1" class="fc-method-options">'+[{value:'DIRECT_FOLLOWUP',label:'按照无模板跟进'},{value:'CLOSE',label:'业务结束不跟进'}].map(item=>'<label class="fc-method-option"><input type="radio" data-end-action name="'+e(nodeFieldId(node.nodeId,'end-action'))+'" value="'+item.value+'"'+(selected===item.value?' checked':'')+disabled+(readonly?'':' onchange="'+change+'"')+'><span class="fc-method-label">'+item.label+'</span></label>').join('')+'</div></section>';
  }
  function setFourOutcome(nodeId,key,value){if(!editableRouting()||key!=='endAction'||!['DIRECT_FOLLOWUP','CLOSE'].includes(value))return;readValues();const node=nodeById(nodeId);if(node?.type!=='END')return;node.endAction=value;fourEntryChanged();}

  function fourValidateEntries(value){
    const rows=fourEntryRows(value),ids=new Set(),conditional=rows.filter(row=>row.branch?.kind!=='ELSE'),fallback=rows.filter(row=>row.branch?.kind==='ELSE');if(fallback.length!==1||rows.at(-1)?.branch?.kind!=='ELSE')return '开始须有唯一且位于最后的默认入口。';
    for(const [index,row]of rows.entries()){if(!row.entryId||ids.has(row.entryId))return '入口稳定标识为空或重复。';ids.add(row.entryId);if(!value.nodes.some(node=>node.nodeId===row.toNodeId))return '入口指向不存在的业务节点。';if(row.branch?.priority!==index+1)return '入口优先级须按显示顺序连续。';const fallback=row.branch.kind==='ELSE',c=row.conditions||{};if(fallback){if(c.enabled===true||c.rules?.length)return '默认入口不能附带条件。';continue;}if(!['ALL','ANY'].includes(c.mode)||!c.enabled||!c.rules?.length)return '条件入口须有明确条件和组合方式。';const ruleIds=new Set();for(const rule of c.rules){if(!rule.ruleId||ruleIds.has(rule.ruleId))return '入口条件标识为空或重复。';ruleIds.add(rule.ruleId);const def=fourEntryDefinition(rule,value);if(!['IMPORT','CONTEXT'].includes(rule.source)||!def)return '入口条件引用的导入字段或业务上下文不可用。';if(!(DFlowRouting.operators?.(def.type)||[]).includes(rule.operator))return '入口判断方式不符合字段类型。';if(!Array.isArray(rule.values)||new Set(rule.values.map(x=>JSON.stringify(x))).size!==rule.values.length)return '入口比较值必须明确且不能重复。';const empty=['IS_EMPTY','IS_NOT_EMPTY'].includes(rule.operator);if(empty?rule.values.length:!rule.values.length||!['IN','CONTAINS_ANY','CONTAINS_ALL'].includes(rule.operator)&&rule.values.length!==1)return '请按入口判断方式配置正确数量的比较值。';if(['select','multiselect','enum'].includes(def.type)&&rule.values.some(v=>!def.options?.some(o=>o.id===v&&o.enabled!==false)))return '入口比较值不属于当前有效选项。';if(!['select','multiselect','enum'].includes(def.type)&&!empty&&rule.values.some(v=>DFlowRouting.normalizeSavedField?.(v,def.type,'Asia/Shanghai')?.ok===false))return '入口比较值不符合当前字段类型。';}}
    if(fallback[0].toNodeId!==value.startNodeId)return '默认入口与开始后的默认业务节点不一致。';const checked=S()?.validateEntryRules?.({...clone(value),brandId:editor.brandId});if(checked?.status==='failed')return checked.message;if(checked?.status==='success'&&checked.data?.ok===false)return checked.data.issues?.map(x=>x.message||x).join('；')||'入口分流配置无效';return '';
  }
'''

HELPERS += ENTRY_HELPERS


EDGE_CONDITIONS = r'''
  function edgeConditions(node,nodes){
    const rows=nodeEdges(node.nodeId),directory=routingDirectory(),data=directory.data||{},readonly=editor.readOnly,disabled=readonly?' disabled':'',conditional=rows.filter(edge=>edge.branch?.kind!=='ELSE'),fallback=rows.find(edge=>edge.branch?.kind==='ELSE');
    const targetsFor=edge=>nodes.filter(row=>row.nodeId===edge?.toNodeId||row.nodeId!==node.nodeId&&!rows.some(other=>other!==edge&&other.toNodeId&&other.toNodeId===row.nodeId)&&!fourTargetWouldCycle(node.nodeId,row.nodeId,edge?.edgeId));
    const targetOptions=edge=>'<option value="">请选择下一节点</option>'+targetsFor(edge).map(row=>{const cycle=fourTargetWouldCycle(node.nodeId,row.nodeId,edge?.edgeId);return '<option value="'+e(row.nodeId)+'"'+(row.nodeId===edge?.toNodeId?' selected':'')+(cycle?' disabled':'')+'>'+e(nodeLabel(row,nodes.indexOf(row))+(cycle?'（会形成循环）':''))+'</option>';}).join('');
    const content=conditional.map((edge,index)=>{
      const c=edge.conditions||{enabled:true,mode:'ALL',rules:[]},changeTarget=e('FlowConfiguration.fourChangeTarget('+JSON.stringify(edge.edgeId)+',this.value)');
      return '<section id="'+e(edgeControlId(edge.edgeId))+'" tabindex="-1" class="fc-edge-card fc-four-path" data-edge-id="'+e(edge.edgeId)+'"><div class="fc-edge-head"><strong>'+e(index?'否则如果（ELSE IF）':'如果（IF）')+'</strong><div class="fc-actions">'+(readonly?'':'<button type="button" class="btn-link"'+(index===0?' disabled':'')+' onclick="'+call('fourMovePath',edge.edgeId,-1)+'">上移</button><button type="button" class="btn-link"'+(index===conditional.length-1?' disabled':'')+' onclick="'+call('fourMovePath',edge.edgeId,1)+'">下移</button><button type="button" class="fc-delete-row" onclick="'+call('fourRemovePath',edge.edgeId)+'">删除</button>')+'</div></div>'+((c.rules||[]).length>1?field('条件关系','<select data-edge-mode'+disabled+' onchange="FlowConfiguration.conditionChanged()">'+options([{value:'ALL',label:'全部满足'},{value:'ANY',label:'任一满足'}],c.mode||'ALL')+'</select>'):'')+'<div class="fc-condition-rules">'+(c.rules||[]).map((rule,i)=>conditionRule(edge,rule,i,data,readonly)).join('')+'</div>'+(readonly?'':'<button type="button" class="btn-link fc-add-condition" onclick="'+call('fourAddRule',edge.edgeId)+'">＋ 添加判断条件</button>')+field('下一节点','<select data-four-path-target'+disabled+' onchange="'+changeTarget+'">'+targetOptions(edge)+'</select>')+fourTargetIssueMarkup(node.nodeId,edge.edgeId)+(node.type==='TRANSFER'&&edge.toNodeId?fourRecipientControl(edge.recipient||{kind:'TENANT',scope:'OTHER'},'edge',edge.edgeId,readonly):'')+'</section>';
    }).join('');
    const other='<section class="fc-four-otherwise"'+(fallback?' data-edge-id="'+e(fallback.edgeId)+'"':'')+'><div class="fc-edge-head"><strong>其他情况（ELSE）</strong></div>'+field('下一节点','<select id="'+e(nodeFieldId(node.nodeId,'fallback'))+'" data-four-default-target'+disabled+' onchange="'+e('FlowConfiguration.fourChangeDefaultTarget('+JSON.stringify(node.nodeId)+',this.value)')+'">'+targetOptions(fallback)+'</select>')+fourTargetIssueMarkup(node.nodeId,fallback?.edgeId)+(node.type==='TRANSFER'&&fallback?.toNodeId?fourRecipientControl(fallback.recipient||{kind:'TENANT',scope:'OTHER'},'edge',fallback.edgeId,readonly):'')+'</section>';
    return '<div class="fc-edge-list">'+content+(readonly?'':'<button type="button" class="btn fc-add-branch" id="'+e(nodeFieldId(node.nodeId,'new-path'))+'" onclick="'+call('fourAddBranch',node.nodeId)+'">＋ 添加条件分支</button>')+other+(directory.status!=='success'?message(directory.message||'条件字段暂时无法读取。','error'):'')+'</div>';
  }
'''


RULE_SCOPE = r'''
  function ruleScopeControl(rule,node,disabled,change){
    if(rule.source==='FOLLOWUP')return '<details class="fc-source-advanced"><summary>取值范围</summary>'+field('使用哪次填写结果','<select data-rule-scope'+disabled+' onchange="'+change('scope')+'">'+options(routingScopes,rule.scope||'CURRENT_NODE')+'</select>')+'</details>';
    return '';
  }
'''


VALIDATE = r'''
  function validateEditor(){
    const value=editor.values,problem=(text,nodeId,key)=>({text,nodeId,key});
    if(editor.compatibilityIssues?.length)return problem(editor.compatibilityIssues.join(' '),null,'fcStatus');
    if(!String(value.name||'').trim())return problem('请输入模板名称。',null,'fcName');
    if(!value.nodes?.length)return problem('请添加转交、呼叫或结束节点。',null,'fcAddNode');
    for(let index=0;index<value.nodes.length;index++){
      const node=value.nodes[index];if(!['PROCESS','TRANSFER','END'].includes(node.type))return problem('请使用转交、呼叫、结束组件，不提供分配或空白节点。',node.nodeId,'name');
      if(!String(node.name||'').trim())node.name=nodeTypes[node.type]+' '+(index+1);node.duty||='CURRENT';
      if(node.type==='PROCESS'){
        node.recipient||={kind:'TENANT',scope:'CURRENT'};
        if(!['HQ','TENANT'].includes(node.recipient.kind)||node.recipient.kind==='TENANT'&&!['CURRENT','OTHER'].includes(node.recipient.scope))return problem('请配置有效的呼叫承接方。',node.nodeId,'name');
      }

      if(node.type==='END'&&node.next?.length)return problem('结束节点不能配置下一路径。',node.nodeId,'name');
      if(node.type==='END'&&!['DIRECT_FOLLOWUP','CLOSE'].includes(node.endAction))return problem('请选择后续处理。',node.nodeId,'end-action');
      if(node.next?.some(id=>!value.nodes.some(target=>target.nodeId===id)))return problem('下一节点已不存在，请调整该路径。',node.nodeId,'new-path');
      const rows=nodeEdges(node.nodeId),fallback=rows.filter(edge=>edge.branch?.kind==='ELSE');
      for(const edge of rows.filter(row=>row.branch?.kind!=='ELSE')){
        const rules=edge.conditions?.rules||[];
        if(!rules.length||rules.some(rule=>!rule.source||!rule.operator||['IMPORT','FOLLOWUP'].includes(rule.source)&&!rule.fieldId))return problem('请完成“'+node.name+'”的判断条件。',null,edgeControlId(edge.edgeId));
        if(rules.some(rule=>!['IS_EMPTY','IS_NOT_EMPTY'].includes(rule.operator)&&(!Array.isArray(rule.values)||!rule.values.length)))return problem('请选择或填写条件比较值。',null,edgeControlId(edge.edgeId));
        if(!edge.toNodeId)return problem('请选择条件分支的下一节点。',null,edgeControlId(edge.edgeId));
      }
      if(node.type!=='END'&&(fallback.length!==1||!fallback[0].toNodeId))return problem('请选择“'+node.name+'”其他情况（ELSE）的下一节点。',node.nodeId,'fallback');
      if(fallback.length&&rows.at(-1)?.branch?.kind!=='ELSE')return problem('其他情况须放在最后。',node.nodeId,'fallback');
      if(new Set(rows.map(edge=>edge.toNodeId)).size!==rows.length)return problem('同一下一节点不能重复连接。',node.nodeId,'new-path');
      if(node.type==='TRANSFER')for(const edge of rows)if(!edge.recipient||!['HQ','TENANT'].includes(edge.recipient.kind)||edge.recipient.kind==='TENANT'&&!['CURRENT','OTHER'].includes(edge.recipient.scope))return problem('请在转交路径中选择合法的目标承接方。',node.nodeId,'new-path');
    }
    const cyclic=(value.edges||[]).find(edge=>edge.toNodeId&&fourTargetWouldCycle(edge.fromNodeId,edge.toNodeId,edge.edgeId));
    if(cyclic){editor.targetIssue={nodeId:cyclic.fromNodeId,edgeId:cyclic.edgeId,text:'这条路径会形成循环，请选择其他下一节点。'};editor.selectedNodeId=cyclic.fromNodeId;editor.inspectorClosed=false;editor.expanded=new Set([cyclic.fromNodeId]);return {...problem(editor.targetIssue.text,null,cyclic.branch?.kind==='ELSE'?nodeFieldId(cyclic.fromNodeId,'fallback'):edgeControlId(cyclic.edgeId)),inline:true};}
    if(!value.startNodeId||!value.nodes.some(node=>node.nodeId===value.startNodeId))return problem('请将开始连接到首个业务节点。',null,'fcStart');
    if(!value.nodes.some(node=>node.type==='END'))return problem('请添加结束节点。',null,'fcAddNode');
    const entryProblem=fourValidateEntries(value);if(entryProblem)return problem(entryProblem,canvasStartId,'fcStart');
    const reachable=id=>{const seen=new Set(),queue=[id];while(queue.length){const next=queue.shift();if(seen.has(next))continue;seen.add(next);queue.push(...(nodeById(next)?.next||[]));}return seen;},entered=new Set(fourEntryRows(value).flatMap(entry=>[...reachable(entry.toNodeId)]));
    for(const node of value.nodes){if(!entered.has(node.nodeId))return problem('“'+node.name+'”尚未从开始连通。',node.nodeId,'name');if(![...reachable(node.nodeId)].some(id=>nodeById(id)?.type==='END'))return problem('“'+node.name+'”没有可达的结束路径。',node.nodeId,'new-path');}
    const invalid=validateConditions();return invalid?problem(invalid.text,null,invalid.id):null;
  }
'''


TEMPLATE_EDITOR = r'''
  function legacyTemplateEditor(v){
    const nodes=v.nodes||[],readonly=editor.readOnly,startItems=nodes.map((node,index)=>({value:node.nodeId,label:nodeLabel(node,index)})),brands=getCatalog(editor.brandId)?.data?.brands||[],brandName=brands.find(row=>(row.brandId||row.id)===editor.brandId)?.name||editor.brandId;
    if(!readonly&&editor.stage==='basics')return '<div class="fc-form-grid">'+field('模板名称 <span class="required">*</span>','<input id="fcName" value="'+e(v.name||'')+'" placeholder="请输入模板名称" oninput="FlowConfiguration.touch()">')+field('所属品牌','<input readonly value="'+e(brandName)+'">')+'</div>';
    const summary='<div class="fc-canvas-summary"><div><strong data-fc-template-name>'+e(v.name||'未命名模板')+'</strong><p>'+e(brandName)+(readonly?' · 只读查看':'')+'</p></div><div class="fc-canvas-start"><label for="fcStart">开始后的默认业务节点'+(readonly?'':' <span class="required">*</span>')+'</label><select id="fcStart"'+(readonly?' disabled':' onchange="FlowConfiguration.startNodeChanged()"')+'>'+options(startItems,v.startNodeId||'',readonly?'未配置':'请选择默认业务节点')+'</select>'+(readonly?'':'<button type="button" class="btn-link" onclick="FlowConfiguration.selectCanvasNode(\'__start__\')">配置入口分流</button>')+'</div></div>';
    return summary+visualEditor(v);
  }
'''


ROUTE_DESCRIPTION = r'''
  function routeTemplateDescription(template,ref,data){
    if(!template)return '<p class="fc-route-template-empty">请选择当前有效流程，再查看节点与路径。</p>';
    const catalog=template.routingCatalog||{},nodes=template.nodes||[],edges=template.edges||[],start=nodes.find(node=>node.nodeId===template.startNodeId),entries=fourEntryRows(template),entryTargets=new Set(entries.map(entry=>entry.toNodeId));
    const entrySummary='<section class="fc-route-entry-summary"><h4>开始入口分流</h4><p>按本次导入资料、当前负责方和办理目的依次判断；条件待核时停留，不使用默认入口猜测。</p><ul>'+entries.map(entry=>'<li><strong>'+e(fourEntryPathLabel(entry,template))+' → '+e(nodes.find(node=>node.nodeId===entry.toNodeId)?.name||entry.toNodeId||'未配置')+'</strong></li>').join('')+'</ul></section>';
    const cards=nodes.map((node,index)=>{
      const paths=edges.filter(edge=>edge.fromNodeId===node.nodeId).sort((a,b)=>(a.branch?.priority??1e9)-(b.branch?.priority??1e9)).map((edge,pathIndex)=>{
        const target=nodes.find(row=>row.nodeId===edge.toNodeId),fallback=edge.branch?.kind==='ELSE'||edge.conditions?.enabled===false,c=edge.conditions||{},title=fourBranchLabel(edge.branch)+(fallback?'':' · 条件路径 '+(pathIndex+1)),recipient=node.type==='TRANSFER'?'<p class="fc-route-recipient"><strong>承接方：</strong>'+e(edge.recipient?fourRecipientLabel(edge.recipient):'尚未配置')+'；先完成转交，再由承接方分配跟进人和呼叫。</p>':'';
        const conditions=fallback?'<span class="fc-route-path-open">前方条件均不匹配时使用；存在待核条件时不进入默认路径。</span>':'<div class="fc-route-path-conditions"><span>'+e(c.mode==='ANY'?'满足任一条件（或）':'全部条件满足（且）')+'</span><ul>'+((c.rules||[]).length?c.rules.map(rule=>'<li>'+e(routingRuleLabel(rule,node,catalog).replace('原始导入值（独立判断）','当前有效导入值（独立判断）'))+'</li>').join(''):'<li>尚未配置判断条件。</li>')+'</ul></div>';
        return '<li><strong>'+e(title)+' → '+e(target?.name||edge.toNodeId)+'</strong>'+recipient+conditions+'</li>';
      }).join('');
      const rules=edges.filter(edge=>edge.fromNodeId===node.nodeId).flatMap(edge=>edge.conditions?.rules||[]),source=routeSavedSource(node,catalog,nodes,rules),facts=node.type==='PROCESS'?'<div><dt>呼叫承接方</dt><dd>'+e(routeSavedDuty(node))+'</dd></div><div><dt>呼叫方式</dt><dd>'+e(routeSavedMethods(node))+'</dd></div>':node.type==='TRANSFER'?'<div><dt>目标承接方</dt><dd>分别配置在每条转交路径中</dd></div>':node.type==='END'?'<div><dt>后续处理</dt><dd>'+e(fourEndActionLabel(node))+'</dd></div>':'';
      return '<article class="fc-route-node-summary"><div class="fc-route-node-summary-head"><span class="fc-node-number">'+(index+1)+'</span><h4>'+e(node.name||node.nodeId)+'</h4>'+(entryTargets.has(node.nodeId)?'<span class="fc-route-start-badge">入口可达节点</span>':'')+'<span class="fc-route-node-type">'+e(nodeTypes[node.type]||node.type)+'</span></div><p class="fc-route-node-purpose">'+e(routeSavedPurpose(node))+'</p>'+(facts?'<dl class="fc-route-node-facts">'+facts+'</dl>':'')+source+'<div class="fc-route-node-paths">'+(paths?'<ul>'+paths+'</ul>':node.type==='END'?'流程在此结束。':'尚未配置下一路径。')+'</div></article>';
    }).join('');
    const referenceLabel=template.referenceRoutingCatalog?.categoryLabel||catalog.categoryLabel||template.referenceCategoryRef?.categoryId||template.categoryRef?.categoryId||'待核',applicationLabel=data?.category?.label||data?.categoryName||'';
    return '<section id="fcRouteTemplateDescription" class="fc-route-template-description"><div class="fc-route-template-title"><div><h3>'+e(template.name||'流转模板')+'</h3><p>字段参考分类：'+e(referenceLabel)+(applicationLabel?' · 实际应用分类：'+e(applicationLabel):'')+' · 开始默认进入 '+e(start?.name||'待配置')+'</p></div></div><p class="fc-route-template-hint">按 IF、ELSE IF 顺序只选择首条命中路径；新保存和新业务使用的每个非结束节点必须有唯一末位 ELSE（兜底）。前方条件均明确不匹配时使用兜底；非必填导入字段未提供按空值判断，必填缺失或结果待核时暂停。转交和流转仍由人员确认，不自动起呼或推进。</p>'+entrySummary+'<div class="fc-route-node-summaries">'+cards+'</div></section>';
  }
'''


ROUTE_PURPOSE = r'''
  function routeSavedPurpose(node){
    if(node?.type==='PROCESS')return '由当前承接方安排跟进人，按配置方式实际办理并保存结果后，再判断下一路径；无需呼叫的业务从开始分流，不以默认出口跳过呼叫。';
    if(node?.type==='TRANSFER')return '根据每条路径的条件和承接方完成归属转交，再由接收方分配跟进人和呼叫；本节点不执行外呼。';
    if(node?.type==='END')return fourEndActionLabel(node);
    return '请使用开始、转交、呼叫、结束四类组件。';
  }
'''


ROUTE_SOURCE = r'''
  function routeSavedSource(node,catalog,nodes=[],rules=[]){
    if(node?.type==='END'||!rules.length)return '';
    if(rules.every(rule=>rule.source==='IMPORT'))return '<p class="fc-route-result-source">条件依据：当前有效导入资料，可独立判断，无需先有呼叫结果。</p>';
    if(node.type==='TRANSFER'){
      const source=nodes.find(row=>row.nodeId===node.conditionSource?.sourceNodeId);
      return '<p class="fc-route-result-source">条件依据：'+e(source?'上游“'+source.name+'”的准确办理结果；导入字段另按当前有效资料判断。':'上游结果来源尚未明确，请核对路径条件；导入字段可独立判断。')+'</p>';
    }
    return '<p class="fc-route-result-source">条件依据：'+e(sourceLabel(node,catalog))+'；导入字段可独立判断。</p>';
  }
'''


def transform(kind,path,code):
    if kind!='cloud' or path!='js/pages/flow-configuration.js':
        return code
    code=one(code,"const nodeTypes = {ASSIGN:'租户内分配',PROCESS:'现有方式处理',TRANSFER:'租户转交',END:'结束'};","const nodeTypes = {TRANSFER:'转交',PROCESS:'呼叫',END:'结束'};")
    code=one(code,'  function initial(){',HELPERS+'\n  function initial(){')
    code=one(code,"function initial(){return {...legacyInitial(),routingPolicy,categoryRef:null};}","function initial(){return {...legacyInitial(),routingPolicy,categoryRef:null,productRulesVersion:2,entryRules:[]};}")
    code=one(code,'    values.brandId=brandId;','    values.brandId=brandId;\n    if(!viewOptions.readOnly)fourEnsureEntries(values);')
    code=one(code,"function startNodeChanged(){if(!editableCanvas())return;readValues();touch();draw();}","function startNodeChanged(){if(!editableCanvas())return;readValues();fourSetEntryDefault(editor.values.startNodeId);}")
    code=function(code,'syncEdges',SYNC_EDGES)
    code=function(code,'edgeConditions',EDGE_CONDITIONS)
    code=function(code,'ruleScopeControl',RULE_SCOPE)
    code=function(code,'validateEditor',VALIDATE)
    code=one(code,"const invalid=validateEditor();if(invalid){status(invalid.text,'error');requestAnimationFrame(()=>focusNodeField(invalid.nodeId,invalid.key));return;}","const invalid=validateEditor();if(invalid){markCanvasValidationError(invalid);if(invalid.inline){editor.status='';editor.statusKind='';draw();}else status(invalid.text,'error');requestAnimationFrame(()=>focusNodeField(invalid.nodeId,invalid.key));return;}editor.validationIssue=null;")
    code=function(code,'legacyTemplateEditor',TEMPLATE_EDITOR)
    code=function(code,'routeSavedPurpose',ROUTE_PURPOSE)
    code=function(code,'routeSavedDuty',"  function routeSavedDuty(node){return node?.type==='PROCESS'?fourRecipientLabel(node.recipient||{kind:'TENANT',scope:'CURRENT'}):node?.type==='TRANSFER'?'当前负责租户办理转交，承接方见各路径':'无需安排办理';}")
    code=function(code,'routeSavedMethods',"  function routeSavedMethods(node){if(node?.type!=='PROCESS')return '本节点不发起呼叫';return node.methods?.length===1&&processMethodProfiles[node.methods[0]]?processMethodProfiles[node.methods[0]].label:'呼叫方式待配置';}")
    code=function(code,'routeSavedSource',ROUTE_SOURCE)
    code=function(code,'routeTemplateDescription',ROUTE_DESCRIPTION)
    code=function(code,'routeNodePurpose',"  function routeNodePurpose(node){return routeSavedPurpose(node);}")
    code=one(code,"['nodeId','name','type','duty','methods','next','targetKind','conditionSource']","['nodeId','name','type','duty','methods','next','targetKind','conditionSource','recipient','endAction','completionRequired']")
    code=one(code,"'routingPolicy','categoryRef','routingCatalog'];","'routingPolicy','categoryRef','routingCatalog','fourNodeSchema','productRulesVersion','entryRules'];")
    code=one(code,"      if(!Array.isArray(n.next)||!Array.isArray(n.methods))add('节点方式或后续路径结构无法识别。');", "      const nodeName=n.name||'未命名节点';\n      if(!Array.isArray(n.next))add('“'+nodeName+'”的后续路径未能完整读取。');\n      if(n.type==='PROCESS'&&!Array.isArray(n.methods)||n.type!=='PROCESS'&&n.methods!==undefined&&!Array.isArray(n.methods))add('“'+nodeName+'”的呼叫方式未能完整读取。');")
    code=one(code,"    return issues;\n  }\n  function conditionDirectory", "    for(const entry of values.entryRules||[]){if(Object.keys(entry).some(key=>!['entryId','name','toNodeId','branch','conditions'].includes(key)))add('存在未知入口扩展字段。');if(entry.conditions&&Object.keys(entry.conditions).some(key=>!['enabled','mode','rules'].includes(key)))add('存在未知入口条件扩展字段。');for(const rule of entry.conditions?.rules||[])if(Object.keys(rule).some(key=>!['ruleId','source','fieldId','operator','values'].includes(key)))add('存在未知入口规则扩展字段。');}\n    return issues;\n  }\n  function conditionDirectory")
    code=one(code,"    syncEdges();draw();\n  }\n  function simulation", "    if(Array.isArray(editor.values.entryRules)){editor.values.entryRules=editor.values.entryRules.filter(entry=>entry.toNodeId!==removed.nodeId||entry.branch?.kind==='ELSE');const fallback=editor.values.entryRules.find(entry=>entry.branch?.kind==='ELSE');if(fallback?.toNodeId===removed.nodeId)fallback.toNodeId='';fourNormalizeEntries();}\n    syncEdges();draw();\n  }\n  function simulation")
    code=one(code,"queue=editor.values.startNodeId?[{id:editor.values.startNodeId,rank:0}]:[];", "queue=[...new Set(fourEntryRows(editor.values).map(entry=>entry.toNodeId).filter(Boolean))].map(id=>({id,rank:0}));")
    code=one(code,"['channel','domainId','scope','supplierId','tenantId','tenantType','tagSceneId','revision']","['channel','domainId','scope','supplierId','tenantId','tenantType','tagSceneId','revision','sourceNodeId']")
    code=one(code,"['edgeId','fromNodeId','toNodeId','conditions','branch']","['edgeId','fromNodeId','toNodeId','conditions','branch','recipient']")
    code=one(code,'保存新版本后，原分类关联及已有记录保持原引用','保存当前配置，已开始运行保持原方案')
    code=one(code,"editor.id?'保存新版本':'保存模板'", "editor.id?'保存配置':'保存模板'")
    code=one(code,'保存生成新版本；已有分类与记录保持精确版本。','保存当前配置，已开始运行保持原方案。')
    code=one(code,"editor.readOnly?'只读配置 V'+editor.viewVersion", "editor.readOnly?'只读配置'")
    code=one(code,"text:(editor.kind==='template'?'模板':'分类配置')+'已明确保存为 V'+num+'；原版本与既有记录保持。'", "text:'当前配置已保存，已开始运行保持原方案。'")
    code=one(code,"+'</strong><span class=\"fc-version\">V'+e(versionNumber(r))+'</span></div>", "+'</strong></div>")
    code=function(code,'routeTemplateChoices',"  function routeTemplateChoices(rows,categoryId,current){return rows.map(row=>({...row,versions:[versionOf(row)]})).filter(row=>row.versions[0]);}")
    code=one(code,"label:(v.name || t.name)+' · V'+Number(v.version || versionNumber(t))", "label:v.name || t.name")
    code=one(code,"'请选择流转模板及版本'", "'请选择流转模板'")
    code=one(code,'关联固定的模板版本。模板后续编辑不会追改本次关联；需要更新时在此重新选择。','在此绑定实际使用关系，并按本业务分类校验所需字段；使用模板当前配置，已开始运行保持原方案。')
    code=one(code,'原关联版本不可用，请重新选择','原关联模板当前不适配，请重新选择')
    code=one(code,"    if(!routeEditor)return;const d=routeEditor,data=d.data,b=d.values,disabled=", "    if(!routeEditor)return;const d=routeEditor,data=d.data,b=d.values;if(!d.busy&&!d.pending&&!d.pendingReadFailed&&b.main){const current=(data.templates||[]).find(row=>identity(row)===b.main.templateId),latest=current&&versionOf(current);if(latest)b.main={templateId:b.main.templateId,version:Number(latest.version||versionNumber(current))};}const disabled=")
    code=one(code,'routeTemplateDescription(template,b.main,data)',"routeTemplateDescription(check.status==='success'?check.data.effectivePlan:template,b.main,data)")
    code=one(code,'window.FlowConfiguration={','window.FlowConfiguration={fourSetEntryTarget,fourAddEntry,fourRemoveEntry,fourMoveEntry,fourSetEntryMode,fourAddEntryRule,fourRemoveEntryRule,fourChangeEntryRule,fourEntryValuesChanged,setFourOutcome,setFourRecipient,selectFourUpstream,fourAddBranch,fourChangeDefaultTarget,fourAddPath,fourChangeTarget,fourRemovePath,fourMovePath,fourSetDefault,fourAddRule,')
    # Current four-node input is configured directly; there is no legacy upgrade.
    code=one(code,"    if(!v2(values)){const rows=legacyCompatibilityIssues(values);if(values.routingPolicy)rows.push('模板使用未知路由策略，原内容保留。');return rows;}","    if(!v2(values))return ['请选择有效的业务分类并配置当前四节点流程。'];")
    code=one(code,"||'旧格式条件'","||'待配置条件'")
    code=one(code,"if(rule.optionIds!==undefined||!rule.source)notices+=message('此为保留的旧格式规则，请明确重配来源、判断和值；未确认前不会自动转译。','pending');","if(!rule.source)notices+='';")
    return code
