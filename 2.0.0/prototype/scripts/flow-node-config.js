  // Configure a processing node in the same order users describe it:
  // basic information, one processing method, execution arrangement, then branches.
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
  function drawNodeExecution(){
    const document=window.document,panel=document?.querySelector?.('#flow-configuration-editor .fc-config-panel'),position=panel?.scrollTop;
    draw();
    const restored=document?.querySelector?.('#flow-configuration-editor .fc-config-panel');if(restored&&Number.isFinite(position))restored.scrollTop=position;
  }
  function selectProcessMethod(nodeId,method){
    if(!editableRouting()||!processMethodProfiles[method])return;readValues();const node=nodeById(nodeId);if(!node||node.type!=='PROCESS')return;
    const changed=node.methods?.length!==1||node.methods[0]!==method,hasRules=nodeEdges(nodeId).some(edge=>edge.conditions?.rules?.length);
    node.methods=[method];if(changed&&method==='MANUAL')node.manualAssignmentMode='MANUAL';if(changed){const tenantId=nodeExecutionTenant();if(tenantId)node.executionDefaults=(Array.isArray(node.executionDefaults)?node.executionDefaults:[]).filter(item=>item.tenantId!==tenantId);}setMethodSource(node,method);touch();
    if(changed&&hasRules){editor.status='';editor.statusKind='';}
    drawNodeExecution();
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
  const nodeExecutionPriorities=[{value:5,label:'最高'},{value:4,label:'高'},{value:3,label:'中'},{value:2,label:'低'},{value:1,label:'最低'}];
  const nodeExecutionAutoReads=new WeakMap();
  function nodePriorityValue(node){const value=Number(node?.executionPriority);return Number.isInteger(value)&&value>=1&&value<=5?value:3;}
  function nodePriorityLabel(node){return nodeExecutionPriorities.find(item=>item.value===nodePriorityValue(node))?.label||'中';}
  function nodeExecutionAccess(){const result=context(),a=result.status==='success'?(result.data?.access||result.data):{},live=window.AppState?.effectiveAccess?.()||{};return {...a,...live};}
  function nodeExecutionTenant(){const a=nodeExecutionAccess();try{const scope=parent.DSession?.context?.()?.scope;if(scope?.kind&&scope.kind!=='tenant')return '';if(scope?.id&&a.tenantId&&scope.id!==a.tenantId)return '';}catch(_){}return a.tenantId||'';}
  function nodeExecutionMutable(){const a=nodeExecutionAccess();return !editor.readOnly&&!!nodeExecutionTenant()&&a.roleCode==='ADMIN'&&window.AppState?.canAction?.('task.assign')===true;}
  function nodeExecutionCategory(){return editor.values.categoryRef?.categoryId||editor.values.referenceCategoryRef?.categoryId||routingDirectory().data?.categoryId||'';}
  function nodeExecutionChoices(node){const tenantId=nodeExecutionTenant(),method=processMethodChoice(node);if(!tenantId||!method)return {ok:false,people:[],resources:[],scenes:[],message:'请切换到实际执行租户维护本租户默认任务或坐席。'};const categoryId=editor.values.categoryRef?.categoryId||editor.values.referenceCategoryRef?.categoryId||routingDirectory().data?.categoryId;try{return window.DFourNodeExecution?.choices?.({tenantId,brandId:editor.brandId,categoryId,method,node,handlingMode:'TEMPLATE'})||{ok:false,people:[],resources:[],scenes:[],message:'执行目录尚未就绪，请在导入或手动分配时明确安排。'};}catch(error){return {ok:false,people:[],resources:[],scenes:[],message:error.message};}}
  function nodeDefaultExecution(node){return (Array.isArray(node.executionDefaults)?node.executionDefaults:[]).find(item=>item.tenantId===nodeExecutionTenant()&&(!item.method||item.method===processMethodChoice(node)))||{};}
  function nodeManualAssignmentMode(node){const current=nodeDefaultExecution(node),mode=current.manualAssignmentMode||node.manualAssignmentMode;return ['MANUAL','SPECIFIC_SEAT'].includes(mode)?mode:current.resourceId?'SPECIFIC_SEAT':'MANUAL';}
  function nodeExecutionOptions(rows,id,idKey,labelKey,empty){const list=(rows||[]).map(row=>({value:row[idKey]??row.id,label:row[labelKey]||row.name||row[idKey]||row.id}));if(id&&!list.some(item=>String(item.value)===String(id)))list.unshift({value:id,label:'原选择已失效或不适配，请重新选择'});return options(list,id,empty);}
  function nodeExecutionResources(directory,tenantId,method){return (directory.resources||[...(directory.tasks||[]),...(directory.seats||[])]).filter(row=>(!row.tenantId||row.tenantId===tenantId)&&(!row.method||row.method===method));}
  function nodeAITaskScenes(task,scenes,exactOnly=false){
    if(!task)return [];
    const tenantId=nodeExecutionTenant(),categoryId=nodeExecutionCategory(),text=value=>value===undefined||value===null?'':String(value),explicit=[task.sceneId,task.nativeExplicitSceneId].map(text).filter(Boolean),remote=text(task.remoteTaskId);
    return (scenes||[]).filter(scene=>{
      if(scene.tenantId&&scene.tenantId!==tenantId||scene.categoryId&&categoryId&&scene.categoryId!==categoryId||scene.brandId&&editor.brandId&&scene.brandId!==editor.brandId)return false;
      if(task.platform&&scene.platform&&text(task.platform)!==text(scene.platform)||task.supplierId&&scene.supplierId&&text(task.supplierId)!==text(scene.supplierId)||task.categoryId&&scene.categoryId&&task.categoryId!==scene.categoryId)return false;
      const identities=[scene.id,scene.sceneId,scene.executionSceneId].map(text).filter(Boolean),professional=text(scene.professionalTaskId);
      if(explicit.some(id=>!identities.includes(id))||professional&&(!remote||remote!==professional))return false;
      return !exactOnly||!!text(task.platform)&&!!text(scene.platform)&&(explicit.length>0||!!remote&&[professional,text(scene.executionSceneId)].filter(Boolean).includes(remote));
    });
  }
  function prepareNodeAIExecution(node,directory){
    if(!nodeExecutionMutable()||processMethodChoice(node)!=='AI'||!nodeExecutionCategory()||typeof window.DFourNodeExecution?.prepare!=='function'||directory.ok!==false&&directory.directoryReady!==false&&directory.taskDirectoryReady!==false)return;
    const owner=editor,tenantId=nodeExecutionTenant(),categoryId=nodeExecutionCategory(),nodeId=node.nodeId,key=JSON.stringify([nodeId,tenantId,categoryId]),attempted=nodeExecutionAutoReads.get(owner)||new Set();
    if(attempted.has(key))return;attempted.add(key);nodeExecutionAutoReads.set(owner,attempted);
    const current=()=>{try{return editor===owner&&editableRouting()&&nodeExecutionMutable()&&nodeExecutionTenant()===tenantId&&nodeExecutionCategory()===categoryId&&processMethodChoice(nodeById(nodeId))==='AI';}catch(_){return false;}};
    Promise.resolve().then(()=>{if(current())return loadNodeExecution(nodeId,current);});
  }
  function nodeAIExecutionSection(node,directory,draft,change){
    prepareNodeAIExecution(node,directory);
    const tenantId=nodeExecutionTenant(),categoryId=nodeExecutionCategory(),mutable=nodeExecutionMutable(),scenes=directory.scenes||directory.aiScenes||[],directoryReady=directory.ok!==false&&directory.directoryReady!==false&&directory.taskDirectoryReady!==false,resources=tenantId&&categoryId&&directoryReady?nodeExecutionResources(directory,tenantId,'AI'):[],matches=resources.filter(row=>String(row.resourceId)===String(draft.resourceId||'')),task=matches.length===1?matches[0]:null,taskScenes=nodeAITaskScenes(task,scenes),canChoose=mutable&&!!categoryId,disabled=canChoose?'':' disabled';
    let notice='';
    if(!tenantId){let selected;try{selected=parent.DSession?.context?.()?.scope;}catch(_){}notice=selected?.kind==='tenant'&&selected.id?'当前账号的执行范围与所选租户不一致，请由该租户管理员维护任务安排。':'当前未确定执行租户；请在有权的业务租户中维护任务安排。';}
    else if(!mutable)notice=editor.readOnly?'当前为只读查看，不能修改任务安排。':'当前账号没有本租户任务安排权限，请由有权的租户管理员维护。';
    else if(!categoryId)notice='请先在模板基本信息中选择参照业务分类，再选择 AI 呼叫任务。';
    else if(directory.ok===false)notice=directory.message||'AI任务与场景尚未可靠读取，请刷新后重试。';
    else if(directory.directoryReady===false||directory.taskDirectoryReady===false)notice='AI任务与场景尚未读取完整；读取失败时可点击刷新重试。';
    else if(draft.resourceId&&!task)notice='原AI任务已失效或不适配，请重新选择，或暂不指定、后续分配。';
    else if(!resources.length)notice=directory.message||'本租户暂无适配当前分类的可分配AI任务，请先核对呼叫中心的任务配置。';
    else if(task&&!taskScenes.length)notice='未读取到与所选任务准确适配的场景，请核对任务及场景配置。';
    else if(task&&!draft.aiSceneId)notice=taskScenes.length>1?'所选任务关联多个场景，请明确选择对应场景。':'该任务尚无唯一准确的场景关联，请核对后选择对应场景。';
    return (tenantId?'<div class="fc-execution-scope">当前执行租户：'+e(window.CloudCallRuntime?.tenant?.(tenantId)?.name||tenantId)+'</div>':'')+field('AI呼叫任务','<select aria-label="AI呼叫任务"'+disabled+' onchange="'+change('resourceId')+'">'+nodeExecutionOptions(resources,draft.resourceId,'resourceId','name','暂不指定，后续分配')+'</select>')+field('对应AI呼叫场景','<select aria-label="默认AI呼叫场景"'+(!canChoose||!task?' disabled':'')+' onchange="'+change('aiSceneId')+'">'+nodeExecutionOptions(taskScenes,draft.aiSceneId,'id','name',task?'请选择或核对对应场景':'选择任务后自动带出或确认场景')+'</select>')+(mutable&&categoryId?'<button type="button" class="btn" onclick="'+call('loadNodeExecution',node.nodeId)+'">刷新本租户任务与场景</button>':'')+(notice?'<small class="fc-execution-warning">'+e(notice)+'</small>':'')+'<small>可现在指定任务，也可选择“暂不指定，后续分配”。选择任务后，场景仅按准确关联带出；执行前仍需明确有效任务及场景。</small>';
  }
  function changeNodeExecution(nodeId,key,value){
    if(!editableRouting()||!['executionPriority','resourceId','aiSceneId','manualAssignmentMode'].includes(key))return;readValues();const node=nodeById(nodeId);if(node?.type!=='PROCESS')return;
    if(key==='executionPriority'){const numeric=Number(value);if(!nodeExecutionPriorities.some(item=>item.value===numeric))return;node.executionPriority=numeric;touch();return;}
    if(key==='manualAssignmentMode'){if(processMethodChoice(node)!=='MANUAL'||!['MANUAL','SPECIFIC_SEAT'].includes(value))return;node.manualAssignmentMode=value;if(nodeExecutionMutable()){const tenantId=nodeExecutionTenant(),next={...nodeDefaultExecution(node),tenantId,method:'MANUAL',manualAssignmentMode:value};delete next.accountId;delete next.followupAccountId;if(value==='MANUAL')delete next.resourceId;node.executionDefaults=[...(Array.isArray(node.executionDefaults)?node.executionDefaults:[]).filter(item=>item.tenantId!==tenantId),next];}touch();drawNodeExecution();return;}
    if(!nodeExecutionMutable())return;const tenantId=nodeExecutionTenant(),prior=nodeDefaultExecution(node),method=processMethodChoice(node),next={...prior,tenantId,method};delete next.accountId;delete next.followupAccountId;
    if(method==='AI'){
      if(key==='resourceId'&&!value){node.executionDefaults=(Array.isArray(node.executionDefaults)?node.executionDefaults:[]).filter(item=>item.tenantId!==tenantId);touch();drawNodeExecution();return;}
      if(!nodeExecutionCategory())return;
      const directory=nodeExecutionChoices(node),resources=nodeExecutionResources(directory,tenantId,'AI');
      if(directory.ok===false||directory.directoryReady===false||directory.taskDirectoryReady===false)return;
      if(key==='resourceId'){const matches=resources.filter(row=>String(row.resourceId)===String(value));if(matches.length!==1)return;next.resourceId=value;delete next.aiSceneId;const exact=nodeAITaskScenes(matches[0],directory.scenes||directory.aiScenes||[],true);if(exact.length===1)next.aiSceneId=String(exact[0].id||exact[0].sceneId);}
      else if(key==='aiSceneId'){const matches=resources.filter(row=>String(row.resourceId)===String(prior.resourceId));if(matches.length!==1)return;const candidates=nodeAITaskScenes(matches[0],directory.scenes||directory.aiScenes||[]).filter(scene=>String(scene.id||scene.sceneId)===String(value));if(value&&candidates.length!==1)return;if(value)next.aiSceneId=value;else delete next.aiSceneId;}
      node.executionDefaults=[...(Array.isArray(node.executionDefaults)?node.executionDefaults:[]).filter(item=>item.tenantId!==tenantId),next];touch();drawNodeExecution();return;
    }
    if(key==='resourceId'&&!value)delete next.resourceId;else next[key]=value;
    if(processMethodChoice(node)==='MANUAL')next.manualAssignmentMode=nodeManualAssignmentMode(node);
    node.executionDefaults=[...(Array.isArray(node.executionDefaults)?node.executionDefaults:[]).filter(item=>item.tenantId!==tenantId),next];touch();drawNodeExecution();
  }
  async function loadNodeExecution(nodeId,guard){if(!editableRouting()||guard&&!guard())return;const current=editor;try{const ret=await window.DFourNodeExecution?.prepare?.();if(editor!==current||guard&&!guard())return;if(ret?.ok===false){status(ret.message||'本租户执行目录尚未就绪','pending');return;}readValues();drawNodeExecution();}catch(error){if(editor===current&&(!guard||guard()))status(error.message||'执行目录未读取成功','pending');}}
  function nodeExecutionSection(node){
    const method=processMethodChoice(node),manual=method==='MANUAL',mode=nodeManualAssignmentMode(node),readonly=editor.readOnly,tenantId=nodeExecutionTenant(),mutable=nodeExecutionMutable(),directory=nodeExecutionChoices(node),draft=nodeDefaultExecution(node),change=key=>e('FlowConfiguration.changeNodeExecution('+JSON.stringify(node.nodeId)+','+JSON.stringify(key)+',this.value)'),disabled=mutable?'':' disabled',resources=nodeExecutionResources(directory,tenantId,method);
    const priority=field('默认执行优先级','<select data-node-execution-priority aria-label="默认执行优先级"'+(readonly?' disabled':' onchange="'+change('executionPriority')+'"')+'>'+options(nodeExecutionPriorities,nodePriorityValue(node))+'</select>','同一执行资源内先高后低；同级按待执行入队先后。'),manualControl=manual?field('坐席安排','<select aria-label="坐席安排"'+(readonly?' disabled':' onchange="'+change('manualAssignmentMode')+'"')+'>'+options([{value:'MANUAL',label:'人工分配'},{value:'SPECIFIC_SEAT',label:'指定坐席'}],mode)+'</select>'):'';
    let target='';if(method==='AI')target=nodeAIExecutionSection(node,directory,draft,change);
    else if(manual&&mode==='MANUAL')target='<p class="fc-muted">此节点先进入待分配，后续由有权人员通过原单条或批量手动分配指定坐席，再由坐席本人拨打。</p>';
    else if(method&&tenantId){target='<div class="fc-execution-scope">当前执行租户：'+e(window.CloudCallRuntime?.tenant?.(tenantId)?.name||tenantId)+'</div>'+field(manual?'默认执行坐席 <em>*</em>':'默认执行任务','<select aria-label="默认执行对象"'+disabled+' onchange="'+change('resourceId')+'">'+nodeExecutionOptions(resources,draft.resourceId,'resourceId','name',manual?'请选择本租户有效坐席':'导入或分配时选择')+'</select>')+(!directory.ok||!resources.length?'<small class="fc-execution-warning">'+e(directory.message||(manual?'本租户暂无可分配的有效电话坐席，请先完成坐席配置。':'本租户暂无可分配的具体任务，请先在呼叫中心创建任务。'))+'</small>':'')+(method==='PREDICTIVE'?'<small>坐席、队列及分配策略沿任务配置，不再额外选择人员；实际接听人填写结果。</small>':'');}
    else target='<p class="fc-muted">'+e(method?'切换至实际执行租户后，可为本节点配置该租户的默认任务或坐席。':'选择呼叫方式后，可配置具体执行安排。')+'</p>';
    return '<section class="fc-node-config-section fc-node-execution" data-config-step="execution"><h4 class="fc-config-step-title"><span>03</span>默认执行安排</h4>'+priority+manualControl+target+'<small>任务与指定坐席按实际承接租户分别安排，本次导入可覆盖；人工分配保留原后续分配入口。</small></section>';
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
    const branches=isEnd?fourOutcomeControl(n,readonly):'<section class="fc-node-config-section fc-node-branch-section" data-config-step="branches"><h4 class="fc-config-step-title"><span>'+(isProcess?'04':'02')+'</span>'+'流转条件'+'</h4>'+nodeBranchContext(n)+edgeConditions(n,nodes)+'</section>';
    return '<article class="fc-node-card" data-node-id="'+e(n.nodeId)+'"><div class="fc-node-card-head"><h4 data-node-title>'+e(nodeLabel(n,index))+'</h4><span class="fc-node-fixed-type">'+e(nodeTypes[n.type]||n.type)+'</span><div class="fc-actions">'+(readonly?'':'<button type="button" class="fc-delete-row" onclick="'+call('removeRow','node',index)+'">删除节点</button>')+'</div></div><div class="fc-node-body"'+(expanded?'':' hidden')+'><section class="fc-node-config-section" data-config-step="basics"><h4 class="fc-config-step-title"><span>01</span>基本信息</h4><div class="fc-node-form-grid">'+basics+'</div></section>'+(isProcess?methodSection(n)+nodeExecutionSection(n):'')+branches+'</div></article>';
  }
