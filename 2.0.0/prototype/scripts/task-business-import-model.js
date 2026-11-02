  // Task-internal import is a DIRECT entry into the same authoritative ledger.
  // This extension adds no native task/customer store and never submits calls.
  const taskBusinessImportQueues=new WeakMap();
  const taskBusinessEntries=new WeakSet();
  const taskBusinessImportContexts=new WeakMap(),taskBusinessImportRecords=new WeakMap();
  function taskBusinessWithEntry(input,run,context){const previous=taskBusinessImportContexts.get(input);taskBusinessEntries.add(input);if(context)taskBusinessImportContexts.set(input,context);try{return run();}finally{taskBusinessEntries.delete(input);if(previous)taskBusinessImportContexts.set(input,previous);else taskBusinessImportContexts.delete(input);}}
  function taskBusinessEntryAllowed(input){return !!input&&taskBusinessEntries.has(input)&&!!input.taskImportSource;}
  function taskBusinessAttachImportRecord(record,input){const context=taskBusinessEntryAllowed(input)&&taskBusinessImportContexts.get(input);if(context)taskBusinessImportRecords.set(record,context);}
  function taskBusinessImportChoices(record,node){
    const context=taskBusinessImportRecords.get(record);if(!context)return null;const target=context._target;
    requireThat(target&&target.tenantId===record.ownerTenantId&&target.method===node.methods?.[0]&&String(target.taskId||target.resourceId)===context.taskId,'TASK_IMPORT_SCOPE','私有导入目标与本行准确任务不一致');
    return {ok:true,resources:[clone(target)],scenes:clone(context.aiScenes||[]),people:[]};
  }
  function taskBusinessImportQueueBegin(state,input){
    if(!input.taskImportSource)return ()=>{};
    let max=0;for(const row of state.records||[])max=Math.max(max,row.arrangement?.queueSequence||row.executionQueueSequence||0);
    requireThat(!taskBusinessImportQueues.has(state),'TASK_IMPORT_QUEUE','任务导入队列事务重复进入');taskBusinessImportQueues.set(state,{value:max});return ()=>taskBusinessImportQueues.delete(state);
  }
  function taskBusinessImportQueueNext(state){
    const transaction=taskBusinessImportQueues.get(state);if(transaction)return ++transaction.value;
    let max=0;for(const row of state.records||[])max=Math.max(max,row.arrangement?.queueSequence||row.executionQueueSequence||0);return max+1;
  }
  function taskBusinessSpec(input={}){
    const method=input.method,taskId=String(input.taskId??'').trim();
    requireThat(['AI','PREDICTIVE'].includes(method)&&taskId,'TASK_IMPORT_TARGET','请选择准确的AI或预外呼任务');
    return {method,taskId,importChannel:fourImportChannel(input),...(input.aiSceneId?{aiSceneId:String(input.aiSceneId)}:{}),...(input.categoryId?{categoryId:canonicalCategory(input.categoryId)}:{})};
  }
  function taskBusinessAccess(writing=true){
    const a=access();requireThat((writing?['ADMIN','OPERATOR']:['SUPER_ADMIN','ADMIN','OPERATOR']).includes(a.roleCode),'TASK_IMPORT_DENIED','请在当前有权业务租户查看任务导入');
    if(writing)requireThat(a.roleCode==='ADMIN'&&window.AppState?.canAction?.('customer.import')===true&&window.AppState?.canAction?.('task.create')===true,'TASK_IMPORT_DENIED','任务内统一业务导入需当前租户有权管理员办理');
    requireThat(tenantValid(a.tenantId),'TENANT_UNAVAILABLE','当前租户或实例不可用');return a;
  }
  function taskBusinessTarget(spec,readOnly=false){
    const a=taskBusinessAccess(!readOnly),provider=window.DFourNodeExecution;requireThat(provider?.taskImportTarget,'TASK_IMPORT_NOT_READY','任务内业务导入目录尚未准备，请重新打开任务');
    const result=provider.taskImportTarget(spec,{readOnly});
    if(result&&!result.then&&result.ok===false&&result.target&&result.target.tenantId===a.tenantId&&result.target.method===spec.method&&String(result.target.taskId||result.target.resourceId)===spec.taskId){const e=Error(result.message||'当前任务配置尚待核对');e.code=result.code||'TASK_IMPORT_TARGET';e.data={method:spec.method,taskId:spec.taskId,taskName:result.target.name||spec.taskId,tenantId:a.tenantId,configurationRequired:result.configurationRequired===true,aiSceneLocked:true,categoryLocked:true};throw e;}
    requireThat(result&&!result.then&&result.ok===true&&result.target,'TASK_IMPORT_TARGET',result?.message||'当前任务身份、来源或执行配置尚待核对');
    requireThat(result.target.tenantId===a.tenantId&&result.target.method===spec.method&&String(result.target.taskId||result.target.resourceId)===spec.taskId,'TASK_IMPORT_SCOPE','任务导入目标必须准确属于当前租户及呼叫方式');
    requireThat(!result.target.brandId||result.target.brandId===bind(a.tenantId).brandId,'TASK_IMPORT_SCOPE','当前任务品牌关联不一致');
    if(!readOnly){const expected=spec.importChannel==='API'?'AUTO':'MANUAL';requireThat(result.importChannel===spec.importChannel&&result.dataImportSource===expected&&(!result.target.dataImportSource||result.target.dataImportSource===expected),'TASK_IMPORT_CHANNEL','任务当前准确手工或接口配置与本次入口渠道不一致');}
    requireThat(typeof result.targetFingerprint==='string'&&result.targetFingerprint,'TASK_IMPORT_FINGERPRINT','任务配置来源无法可靠核对');return result;
  }
  function taskBusinessParameterReview(spec,fields,values,customValues){
    if(spec.method==='PREDICTIVE')return {ok:true,fingerprint:'PREDICTIVE_NO_AI_PARAMETERS',mappings:[],parameters:{}};
    const fn=window.DFourNodeExecution?.validateTaskImportParameters;requireThat(fn,'TASK_IMPORT_PARAMETERS','AI场景专业参数映射尚未准备');
    const result=fn({...spec,handlingMode:'DIRECT',entrySourceKind:'TASK',dataImportSource:spec.importChannel==='API'?'AUTO':'MANUAL'},fields,values,customValues);requireThat(result&&!result.then&&result.ok===true&&typeof result.fingerprint==='string'&&result.fingerprint,'TASK_IMPORT_PARAMETERS',result?.message||'AI场景专业参数映射或必需参数尚待核对');return clone(result);
  }
  function taskBusinessCategoryFailure(code,message,spec,target){
    const name=target.target.name||spec.taskId,error=Error(name+'：'+message);error.code=code;error.data={method:spec.method,taskId:spec.taskId,taskName:name,tenantId:target.target.tenantId,categoryLocked:true,aiSceneLocked:spec.method==='AI',configurationRequired:code==='TASK_IMPORT_CATEGORY_CONFIG'||code==='TASK_IMPORT_SCENE_CONFIG',categoryConfigurationRequired:code==='TASK_IMPORT_CATEGORY_CONFIG'};throw error;
  }
  function taskBusinessPredictiveCategory(spec,target){
    const configured=[target.target.categoryId,target.target.unifiedCategoryId].filter(value=>value!==undefined&&value!==null&&value!=='');
    if(!configured.length||configured.some(value=>typeof value!=='string'||!value.trim()))taskBusinessCategoryFailure('TASK_IMPORT_CATEGORY_CONFIG','尚未关联有效业务分类，请到任务配置关联业务分类后再导入',spec,target);
    const ids=[...new Set(configured.map(value=>canonicalCategory(value.trim())))];
    if(ids.length!==1||target.categoryId&&canonicalCategory(target.categoryId)!==ids[0])taskBusinessCategoryFailure('TASK_IMPORT_CATEGORY_CONFIG','任务业务分类配置不一致，请到任务配置核对关联后再导入',spec,target);
    if(spec.categoryId&&canonicalCategory(spec.categoryId)!==ids[0])taskBusinessCategoryFailure('TASK_IMPORT_CATEGORY_LOCKED','导入分类由任务配置锁定，不能临时替换；请刷新任务配置后重新检查',spec,target);
    return ids[0];
  }
  function taskBusinessAIScene(spec,target){
    const task=target.target,refs=[task.sceneId,task.aiSceneId,task.workflowSceneId].filter(value=>value!==undefined&&value!==null&&value!==''),remote=typeof task.remoteTaskId==='string'?task.remoteTaskId:'',identity=scene=>[scene.id,scene.sceneId,scene.executionSceneId].filter(value=>value!==undefined&&value!==null&&value!=='').map(String);
    const configured=(target.aiScenes||[]).filter(scene=>scene&&scene.tenantId===task.tenantId&&(!scene.brandId||scene.brandId===task.brandId)&&scene.enabled!==false&&(refs.length?refs.every(value=>identity(scene).includes(String(value))):!!remote&&[scene.professionalTaskId,scene.executionSceneId].filter(Boolean).map(String).includes(remote)));
    if(configured.length!==1)taskBusinessCategoryFailure('TASK_IMPORT_SCENE_CONFIG',configured.length?'任务AI场景关联不唯一，请到任务配置核对后再导入':'尚未关联准确AI场景，请到任务配置关联场景和业务分类后再导入',spec,target);
    const scene=configured[0],id=String(scene.id||scene.sceneId||'');
    if(!id||target.aiSceneId&&String(target.aiSceneId)!==id)taskBusinessCategoryFailure('TASK_IMPORT_SCENE_CONFIG','任务返回的AI场景关联不一致，请到任务配置核对',spec,target);
    if(spec.aiSceneId&&spec.aiSceneId!==id)taskBusinessCategoryFailure('TASK_IMPORT_SCENE_LOCKED','导入场景由任务配置锁定，不能临时替换；请刷新任务配置',spec,target);
    const categoryId=typeof scene.categoryId==='string'?canonicalCategory(scene.categoryId):'';
    if(!categoryId||target.categoryId&&canonicalCategory(target.categoryId)!==categoryId)taskBusinessCategoryFailure('TASK_IMPORT_CATEGORY_CONFIG','任务关联AI场景的业务分类缺失或不一致，请到任务配置补齐',spec,target);
    if(spec.categoryId&&spec.categoryId!==categoryId)taskBusinessCategoryFailure('TASK_IMPORT_CATEGORY_LOCKED','导入分类由任务配置锁定，不能临时替换；请刷新任务配置',spec,target);
    return {scene,id,categoryId};
  }
  function taskBusinessContext(spec){
    const a=taskBusinessAccess(),b=bind(a.tenantId),target=taskBusinessTarget(spec),binding=spec.method==='AI'?taskBusinessAIScene(spec,target):null,issues=clone(target.issues||[]),categoryId=spec.method==='PREDICTIVE'?taskBusinessPredictiveCategory(spec,target):binding.categoryId,aiSceneId=binding?.id||'',directory=projectedCategories(read(),b.brandId);
    const categories=directory.filter(row=>row.enabled!==false).map(row=>({id:row.categoryId,categoryId:row.categoryId,name:row.versions?.at(-1)?.name||row.name||row.categoryId}));
    let fields=[],codeLabel='业务编码',category=null,review=null;
    if(!categoryId)issues.push(spec.method==='AI'?'请先选择有关联业务分类的AI场景':'请选择本次导入的业务分类');
    else {
      if(!categories.some(row=>row.categoryId===categoryId))taskBusinessCategoryFailure('TASK_IMPORT_CATEGORY_CONFIG','关联的业务分类不存在、已停用或超出当前品牌，请到任务配置重新关联业务分类',spec,target);
      requireThat(categories.some(row=>row.categoryId===categoryId),'TASK_IMPORT_CATEGORY','请选择当前品牌有权的有效业务分类');
      category=fourDirectConfig(b.brandId,categoryId,false);codeLabel=category.codeLabel||codeLabel;fields=[{id:'code',key:'code',businessKey:'code',label:codeLabel,type:'text',required:true,businessRequired:true,source:'SYSTEM',usage:'IMPORT'},...category.fields.map(row=>({...clone(row),source:row.source||'IMPORT',businessRequired:row.required===true}))];
      if(spec.method==='AI'&&!aiSceneId)issues.push('请选择当前任务适配的AI场景');
      if(spec.method==='AI'&&aiSceneId){const scene=(target.aiScenes||[]).find(row=>String(row.id||row.sceneId)===aiSceneId),expected=spec.importChannel==='API'?'AUTO':'MANUAL';requireThat(scene&&fourSceneImportSource(scene)===expected,'TASK_IMPORT_SCENE_SOURCE','任务导入场景的准确手工或接口配置与本次渠道不一致');}
      if(spec.method!=='AI'||aiSceneId)try{review=taskBusinessParameterReview({...spec,categoryId,aiSceneId},fields);}catch(error){issues.push(error.message);}
    }
    const fullFields=clone(fields),referenced=new Set((review?.mappings||[]).filter(row=>row.source!=='CUSTOM_COLUMN').map(row=>row.fieldId)),businessFields=(spec.method==='AI'?(review?.businessFields||fields.filter(field=>['code','name','phone'].includes(field.key)||referenced.has(field.fieldId||field.id||field.key))):fields).map(field=>({...clone(field),businessRequired:field.businessRequired??field.required===true})),customFields=clone(review?.customFields||[]),businessKeys=new Set(fullFields.flatMap(field=>[field.key,field.id,field.fieldId,field.businessKey].filter(Boolean))),customKeys=new Set();
    for(const field of customFields){requireThat(field&&field.source==='AI_CUSTOM'&&field.usage==='SUPPLIER_PARAMETER'&&typeof field.key==='string'&&field.key&&!businessKeys.has(field.key)&&!customKeys.has(field.key),'TASK_CUSTOM_SCHEMA','场景供应商列定义无效、重复或与业务字段冲突');customKeys.add(field.key);}
    for(const mapping of review?.mappings||[])if(mapping.source!=='CUSTOM_COLUMN'&&mapping.required){const field=businessFields.find(row=>(row.fieldId||row.id||row.key)===mapping.fieldId);if(field)field.required=true;}
    fields=[...businessFields,...customFields];
    const importLimits=spec.method==='PREDICTIVE'?{maxRows:2000,maxBytes:1048576}:{maxRows:target.target.platform==='大众通信'?100:target.target.platform==='厚朴'?150000:2000,maxBytes:16777216};
    const targetFingerprint='TASK-TARGET-'+fingerprint({target:target.targetFingerprint,importChannel:spec.importChannel,categoryId,categoryConfiguration:spec.method==='PREDICTIVE'?{categoryId:target.target.categoryId||null,unifiedCategoryId:target.target.unifiedCategoryId||null}:null,aiSceneId,fields,importLimits,parameterMappingFingerprint:review?.fingerprint||null});
    return {method:spec.method,taskId:spec.taskId,taskName:target.target.name||spec.taskId,importChannel:spec.importChannel,dataImportSource:spec.method==='AI'?(spec.importChannel==='API'?'AUTO':'MANUAL'):(target.dataImportSource||''),entrySourceKind:'TASK',handlingMode:'DIRECT',tenantId:a.tenantId,brandId:b.brandId,categoryId,categoryName:category?.name||'',categoryLocked:true,categories:categories.filter(row=>row.categoryId===categoryId),aiSceneId,aiSceneLocked:spec.method==='AI',aiScenes:binding?[clone(binding.scene)]:[],fields,businessFields,customFields,codeLabel,importLimits,schemaReady:!!category&&(!issues.length),issues:[...new Set(issues.filter(Boolean))],targetFingerprint,parameterMappingFingerprint:review?.fingerprint||'',parameterMapping:clone(review?.mappings||[]),fixedFields:clone(review?.fixedFields||[]),_fullFields:fullFields,_target:clone(target.target),_targetFingerprint:target.targetFingerprint,_parameterReview:review};
  }
  function taskBusinessPublicContext(context){const result=clone(context);for(const key of Object.keys(result))if(key.startsWith('_'))delete result[key];return result;}
  function taskImportContext(spec={}){return safe(()=>taskBusinessPublicContext(taskBusinessContext(taskBusinessSpec(spec))));}
  function taskBusinessRequest(input={},legacy=false){
    const spec=taskBusinessSpec(input),source=spec.method==='AI'?'TASK_AI':'TASK_PREDICTIVE';requireThat(!input.source||input.source===source,'TASK_IMPORT_SOURCE','任务内导入来源由当前任务确定，不能改成其他来源');
    return {...spec,name:legacy?String(input.name||'').trim():fourImportName(input.name,'TASK_IMPORT_NAME'),...(!legacy?{inputValidationPolicy:2}:{}),source,rows:clone(input.rows||[]),executionPriority:fourExecutionPriority(input.executionPriority),...(input.importBasisToken?{importBasisToken:String(input.importBasisToken)}:{})};
  }
  function taskBusinessSplitRows(context,rows){
    const customKeys=new Set((context.customFields||[]).map(field=>field.key)),customValuesByIndex=[];
    const businessRows=rows.map((row,index)=>{requireThat(row&&row.fields&&typeof row.fields==='object'&&!Array.isArray(row.fields),'TASK_IMPORT_ROW','请保留每行准确的业务字段对象');const fields=clone(row.fields),custom=row.customValues===undefined?{}:clone(row.customValues);requireThat(custom&&typeof custom==='object'&&!Array.isArray(custom),'TASK_CUSTOM_VALUES','供应商独立值须为当前场景字段对象');
      for(const key of customKeys)if(Object.hasOwn(fields,key)){requireThat(!Object.hasOwn(custom,key)||fingerprint(custom[key])===fingerprint(fields[key]),'TASK_CUSTOM_VALUES','同一供应商列在不同输入来源中存在冲突值');custom[key]=clone(fields[key]);delete fields[key];}
      for(const key of Object.keys(custom))requireThat(customKeys.has(key),'TASK_CUSTOM_SCOPE','存在不属于当前场景或供应商的自定义列，请重新检查');customValuesByIndex[index]=custom;const result={...clone(row),fields};delete result.customValues;return result;
    });return {rows:businessRows,customValuesByIndex};
  }
  function taskBusinessPrepare(input){
    const request=taskBusinessRequest(input),spec=taskBusinessSpec(request),context=taskBusinessContext(spec);requireThat(!context.issues.length,'TASK_IMPORT_CONTEXT',context.issues.join('；'));requireThat(request.name,'TASK_IMPORT_NAME','请输入本次导入批次名称');requireThat(Array.isArray(request.rows)&&request.rows.length,'ROWS_REQUIRED','请输入要导入的数据');requireThat(request.rows.length<=context.importLimits.maxRows,'TASK_IMPORT_LIMIT','当前任务每批最多导入'+context.importLimits.maxRows+'条，不能截断名单');
    const effectiveSpec={method:spec.method,taskId:spec.taskId,importChannel:spec.importChannel,categoryId:context.categoryId,...(spec.method==='AI'?{aiSceneId:context.aiSceneId}:{})},source={...effectiveSpec,tenantId:context.tenantId,brandId:context.brandId,taskName:context.taskName,targetFingerprint:context.targetFingerprint,parameterMappingFingerprint:context.parameterMappingFingerprint};
    const separated=taskBusinessSplitRows(context,request.rows);
    const payload={name:request.name,source:request.source,importChannel:spec.importChannel,handlingMode:'DIRECT',directMethod:spec.method,categoryId:context.categoryId,...(spec.method==='AI'?{aiSceneId:context.aiSceneId}:{}),rows:separated.rows.map((row,index)=>({...row,...(spec.method==='AI'?{customValues:clone(separated.customValuesByIndex[index])}:{})})),executionPriority:request.executionPriority,arrangementMode:'NOW',executionArrangements:[{nodeId:'DIRECT',resourceId:spec.taskId,...(spec.method==='AI'?{aiSceneId:context.aiSceneId}:{}),executionPriority:request.executionPriority}],taskImportSource:source,taskTargetFingerprint:context.targetFingerprint,taskImportParameterSnapshots:[]};
    const state=read();let previewResult;
    try{previewResult=taskBusinessWithEntry(payload,()=>preview(state,payload),context);}catch(error){
      if(error.code!=='IMPORT_ARRANGEMENT_NODE')throw error;
      const diagnosticInput={...payload,arrangementMode:'LATER',executionArrangements:[]},diagnostic=taskBusinessWithEntry(diagnosticInput,()=>preview(state,diagnosticInput),context);if(diagnostic.rows.every(row=>row.status==='success'))throw error;
      previewResult=diagnostic;delete previewResult.importBasisToken;
    }
    for(const row of previewResult.rows){if(row.status!=='success')continue;try{const review=taskBusinessParameterReview(effectiveSpec,context._fullFields,{...clone(row.fields),code:row.code},separated.customValuesByIndex[row.index]);requireThat(review.fingerprint===context.parameterMappingFingerprint,'TASK_IMPORT_PARAMETERS_CHANGED','AI场景参数映射在预览期间已变化，请重新检查');payload.taskImportParameterSnapshots.push({index:row.index,code:row.code,fingerprint:review.fingerprint,mappings:clone(review.mappings||[]),parameters:clone(review.parameters||{}),customFields:clone(review.customFields||[]),customValues:clone(review.customValues||{})});}catch(error){row.status='failed';row.message=error.message;}}
    previewResult.counts=counts(previewResult.rows);delete previewResult.importBasisToken;
    let baseToken='',token='';if(previewResult.rows.length&&previewResult.rows.every(row=>row.status==='success')){baseToken=fourImportToken(state,payload,previewResult);const fingerprintRequest={...request};delete fingerprintRequest.importBasisToken;token='TASK-IMPORT-'+fingerprint({businessBasis:baseToken,request:fingerprintRequest,source,parameters:payload.taskImportParameterSnapshots});}
    return {request,context,payload,preview:previewResult,baseToken,token};
  }
  function previewTaskImport(input){return safe(()=>{const result=taskBusinessPrepare(input);return {...result.preview,method:result.context.method,taskId:result.context.taskId,taskName:result.context.taskName,categoryId:result.context.categoryId,aiSceneId:result.context.aiSceneId,source:result.request.source,targetFingerprint:result.context.targetFingerprint,fields:clone(result.context.fields),taskImportContext:taskBusinessPublicContext(result.context),...(result.token?{importBasisToken:result.token}:{})};});}
  function importTaskRecords(input,opts={}){
    try{
      const actor=taskBusinessAccess(),requestId=opts.requestId||input.requestId;
      requireThat(!opts.requestId||!input.requestId||opts.requestId===input.requestId,'REQUEST_CONFLICT','同次任务导入请求编号不一致');
      const previous=requestId&&read().requests.find(row=>row.requestId===requestId);let capturedRequest;try{capturedRequest=previous&&JSON.parse(previous.signature).payload?.taskImportRequest;}catch(_){}const legacy=!!previous&&capturedRequest?.inputValidationPolicy!==2,request=taskBusinessRequest(input,legacy);
      if(previous){
        let signature;try{signature=JSON.parse(previous.signature);}catch(_){fail('REQUEST_CONFLICT','原请求内容无法可靠核对');}
        requireThat(signature.kind==='import'&&signature.payload?.taskImportRequest,'REQUEST_CONFLICT','相同请求编号不属于这次任务导入');requireThat(previous.sourceTenantId===actor.tenantId&&fingerprint(taskBusinessRequest(signature.payload.taskImportRequest,legacy))===fingerprint(request),'REQUEST_CONFLICT','相同请求编号不能用于其他任务、渠道或导入内容');
        const captured=clone(signature.payload);return taskBusinessWithEntry(captured,()=>importRecords(captured,{...opts,requestId}));
      }
      const result=taskBusinessPrepare(input);requireThat(result.token&&request.importBasisToken===result.token,'TASK_IMPORT_STALE','任务、场景、业务字段、参数映射或名单已变化，请保留数据重新检查');
      const payload={...result.payload,importBasisToken:result.baseToken,taskImportRequest:request};return taskBusinessWithEntry(payload,()=>importRecords(payload,{...opts,...(requestId?{requestId}:{})}),result.context);
    }catch(errorValue){return error(errorValue);}
  }
  function reconcileTaskImport(requestId,spec={}){
    try{
      const expected=taskBusinessSpec(spec),actor=taskBusinessAccess(),id=String(requestId||'').trim(),request=read().requests.find(row=>row.requestId===id);let signature;
      requireThat(id&&request,'TASK_IMPORT_REQUEST','请核对准确的任务导入请求编号');try{signature=JSON.parse(request.signature);}catch(_){fail('TASK_IMPORT_REQUEST','原任务导入请求内容无法可靠核对');}
      const original=signature.payload?.taskImportRequest,source=signature.payload?.taskImportSource;
      requireThat(request.kind==='import'&&signature.kind==='import'&&original&&source&&request.sourceTenantId===actor.tenantId&&source.tenantId===actor.tenantId&&original.method===expected.method&&String(original.taskId)===expected.taskId&&source.method===expected.method&&String(source.taskId)===expected.taskId&&fourImportChannel(original)===expected.importChannel&&fourImportChannel(source)===expected.importChannel,'TASK_IMPORT_REQUEST','该请求不属于当前租户的准确任务及渠道导入，不能代为核对');
      requireThat(requestAllowed(request,actor),'REQUEST_DENIED','当前身份无权核对此次原任务导入');return reconcile(id);
    }catch(errorValue){return error(errorValue);}
  }
  // Called before the shared import transaction writes its one ledger revision.
  function taskBusinessImportCapture(state,batch,input,actor){
    if(!input.taskImportSource)return batch;
    requireThat(taskBusinessEntryAllowed(input)&&input.taskImportRequest,'TASK_IMPORT_ENTRY','直接跟进须由准确任务导入事务创建，不能复制入口标识绕过');
    const source=input.taskImportSource,spec=taskBusinessSpec(source),context=taskBusinessContext(spec);
    requireThat(input.handlingMode==='DIRECT'&&input.directMethod===spec.method&&input.categoryId===context.categoryId&&source.tenantId===actor.tenantId&&source.categoryId===context.categoryId&&source.taskId===spec.taskId&&fourImportChannel(input)===spec.importChannel&&fourImportChannel(input.taskImportRequest)===spec.importChannel,'TASK_IMPORT_SCOPE','任务导入来源与当前业务、分类、渠道或租户不一致');
    requireThat(!context.issues.length&&source.targetFingerprint===context.targetFingerprint&&input.taskTargetFingerprint===context.targetFingerprint,'TASK_IMPORT_STALE','当前任务、场景或参数映射已变化，请重新检查');
    const arrangement=input.executionArrangements?.find(row=>row.nodeId==='DIRECT');requireThat(arrangement?.resourceId===spec.taskId&&(spec.method!=='AI'||arrangement.aiSceneId===context.aiSceneId&&source.aiSceneId===context.aiSceneId),'TASK_IMPORT_SCOPE','任务来源不能指向其他执行任务或场景');
    const sourceSnapshot={schema:2,method:spec.method,taskId:spec.taskId,importChannel:spec.importChannel,dataImportSource:context.dataImportSource,...(spec.method==='AI'?{aiSceneId:context.aiSceneId}:{}),categoryId:context.categoryId,tenantId:actor.tenantId,brandId:context.brandId,taskName:context.taskName,targetFingerprint:context.targetFingerprint,parameterMappingFingerprint:context.parameterMappingFingerprint,batchId:batch.batchId},entrySource={schema:1,kind:'TASK',importChannel:spec.importChannel,handlingMode:'DIRECT',method:spec.method,taskId:spec.taskId,...(spec.method==='AI'?{aiSceneId:context.aiSceneId}:{}),categoryId:context.categoryId,tenantId:actor.tenantId,...(spec.importChannel==='API'?{integrationMode:'LOCAL_MOCK'}:{})},parameterSnapshots=input.taskImportParameterSnapshots||[],recordsById=new Map(state.records.map(record=>[record.recordId,record])),parametersByIndex=new Map(parameterSnapshots.map(item=>[item.index,item])),original=taskBusinessSplitRows(context,input.taskImportRequest?.rows||input.rows);
    requireThat(parametersByIndex.size===parameterSnapshots.length,'TASK_IMPORT_PARAMETERS_CHANGED','任务参数快照行身份重复');
    for(const row of batch.rows){const record=recordsById.get(row.recordId);requireThat(record&&record.ownerTenantId===actor.tenantId&&fourDirect(record)&&record.arrangement?.resourceId===spec.taskId,'TASK_IMPORT_RECORD','任务内导入没有形成准确统一业务记录');
      const parameter=parametersByIndex.get(row.index),fresh=taskBusinessParameterReview({...spec,categoryId:context.categoryId,aiSceneId:context.aiSceneId},context._fullFields,{...clone(record.fields),code:record.businessCode},original.customValuesByIndex[row.index]);
      requireThat(parameter&&parameter.code===record.businessCode&&parameter.fingerprint===fresh.fingerprint&&fingerprint(parameter.parameters)===fingerprint(fresh.parameters||{})&&fingerprint(parameter.mappings)===fingerprint(fresh.mappings||[])&&fingerprint(parameter.customFields||[])===fingerprint(fresh.customFields||[])&&fingerprint(parameter.customValues||{})===fingerprint(fresh.customValues||{}),'TASK_IMPORT_PARAMETERS_CHANGED','任务导入参数与本次已检查资料不一致');
      record.entrySource=clone(entrySource);record.originalImportSnapshot.entrySource=clone(entrySource);record.taskImportSource=clone(sourceSnapshot);record.taskImportParameterSnapshot={fingerprint:parameter.fingerprint,mappings:clone(parameter.mappings),parameters:clone(parameter.parameters),customFields:clone(parameter.customFields||[]),customValues:clone(parameter.customValues||{})};record.originalImportSnapshot.taskImportSource=clone(sourceSnapshot);record.originalImportSnapshot.taskImportParameterSnapshot=clone(record.taskImportParameterSnapshot);
    }
    batch.entrySource=clone(entrySource);batch.source=spec.method==='AI'?'TASK_AI':'TASK_PREDICTIVE';batch.sourceLabel=(spec.method==='AI'?'AI任务内':'预外呼任务内')+(spec.importChannel==='API'?'接口导入（本地模拟）':'手工导入');batch.taskImportSource=sourceSnapshot;batch.taskImportParameterMapping={fingerprint:context.parameterMappingFingerprint,mappings:clone(context.parameterMapping),customFields:clone(context.customFields||[])};return batch;
  }
  function taskImportRecords(spec={}){return safe(()=>{
    const normalized=taskBusinessSpec(spec),actor=taskBusinessAccess(false),target=taskBusinessTarget(normalized,true),state=read();
    const rows=state.records.filter(record=>record.ownerTenantId===actor.tenantId&&record.taskImportSource?.tenantId===actor.tenantId&&record.taskImportSource.method===normalized.method&&String(record.taskImportSource.taskId)===normalized.taskId&&(!normalized.aiSceneId||record.taskImportSource.aiSceneId===normalized.aiSceneId)&&(normalized.method==='PREDICTIVE'||!normalized.categoryId||record.taskImportSource.categoryId===normalized.categoryId)&&visible(record,actor)).map(record=>project(state,record,actor));
    const ordered=window.DListOrder?.rows?DListOrder.rows(rows,{fallbackKeys:['createdAt']}):rows;
    return {method:normalized.method,taskId:normalized.taskId,taskName:target.target.name||normalized.taskId,tenantId:actor.tenantId,rows:ordered,counts:{total:ordered.length},batches:state.batches.filter(batch=>batch.tenantId===actor.tenantId&&batch.taskImportSource?.method===normalized.method&&String(batch.taskImportSource.taskId)===normalized.taskId).map(batch=>fourProjectAIImportBatch(batch,actor))};
  });}
  // Read-only overlay for the original native task table. Native rows remain in
  // their original store; this returns only business records with an exact task
  // relationship and never claims native acceptance, filtering or dialing.
  function taskRosterResourceMatches(value,spec,actor){
    if(!value||value.method!==spec.method||value.tenantId!==actor.tenantId)return false;
    const ids=[value.resourceId,value.resourceSnapshot?.resourceId,value.resourceSnapshot?.taskId].filter(id=>id!==undefined&&id!==null&&id!=='').map(String);
    return ids.length>0&&ids.every(id=>id===spec.taskId)&&(!value.resourceSnapshot?.tenantId||value.resourceSnapshot.tenantId===actor.tenantId);
  }
  function taskRosterPriority(value){if(value===undefined||value===null||value===''||!['number','string'].includes(typeof value))return undefined;const n=Number(value);return Number.isSafeInteger(n)&&n>=1&&n<=5?n:undefined;}
  function taskRosterCall(segment,call){const result={segmentId:segment.segmentId,method:segment.method};for(const key of ['callId','attemptId','phone','state','dialed','actualDialed','customerAnswered','startedAt','dialedAt','endedAt','occurredAt','failureCode','failureReason','providerCallId','filtered'])if(Object.hasOwn(call,key))result[key]=clone(call[key]);return result;}
  function taskRosterRecords(spec={}){return safe(()=>{
    const normalized=taskBusinessSpec(spec),actor=taskBusinessAccess(false),target=taskBusinessTarget(normalized,true),state=read(),brandId=bind(actor.tenantId).brandId,rows=[],seen=new Set();
    for(const record of state.records){
      if(record.fourNodeSchema!==FOUR_SCHEMA||record.brandId!==brandId||!visible(record,actor))continue;
      const imported=record.taskImportSource?.tenantId===actor.tenantId&&record.taskImportSource.method===normalized.method&&String(record.taskImportSource.taskId)===normalized.taskId;
      const current=record.ownerTenantId===actor.tenantId&&fourBusinessActive(record)&&fourArrangementCurrent(record)&&taskRosterResourceMatches(record.arrangement,normalized,actor);
      const view=project(state,record,actor),segments=(view.rounds||[]).flatMap(stage=>stage.segments||[]).filter(segment=>taskRosterResourceMatches(segment,normalized,actor)),executed=segments.length>0;
      if(!imported&&!current&&!executed)continue;
      requireThat(typeof record.recordId==='string'&&record.recordId&&!seen.has(record.recordId),'TASK_ROSTER_IDENTITY','任务关联业务的稳定身份缺失或重复，请先核对原记录');seen.add(record.recordId);
      const original=view.originalImportSnapshot||(imported?fourPrivateProjection({recordId:record.recordId,taskImportSource:record.taskImportSource,originalImportSnapshot:record.originalImportSnapshot},actor,state).originalImportSnapshot:null);
      const latest=segments.reduce((chosen,segment)=>!chosen||String(segment.startedAt||'')>=String(chosen.startedAt||'')?segment:chosen,null),currentSegments=current?segments.filter(segment=>fourSameContext(record,segment)):[],callsKnown=segments.every(segment=>Array.isArray(segment.calls)),currentCallsKnown=currentSegments.every(segment=>Array.isArray(segment.calls)),taskCalls=segments.flatMap(segment=>(segment.calls||[]).map(call=>taskRosterCall(segment,call))),currentTaskCalls=currentSegments.flatMap(segment=>(segment.calls||[]).map(call=>taskRosterCall(segment,call)));
      const batch=imported?state.batches.find(value=>value.batchId===original?.batchId&&value.tenantId===actor.tenantId):null;
      const sourceBatch=imported&&batch?.taskImportSource?.tenantId===actor.tenantId&&batch.taskImportSource.method===normalized.method&&String(batch.taskImportSource.taskId)===normalized.taskId&&batch.rows?.some(value=>value.recordId===record.recordId)?batch:null;
      const importTime=imported?(original?.at||sourceBatch?.at):undefined,importedAt=typeof importTime==='string'&&Number.isFinite(Date.parse(importTime))?importTime:undefined;
      const values=current?view.fields||view.currentValues?.IMPORT||{}:latest?latest.basis?.importValues||{}:original?.values||{},definitions=current?view.importFieldSnapshot?.fields||view.categorySnapshot?.fields||[]:latest?latest.basis?.importFields||[]:original?.fields||[];
      const categoryId=current?view.categoryId:latest?latest.basis?.category?.id:batch?.categoryId||view.taskImportSource?.categoryId||original?.taskImportSource?.categoryId,categoryName=current?view.categoryName||view.categorySnapshot?.name:latest?latest.basis?.category?.label:batch?.categoryName;
      const batchRow=batch?.rows?.find(value=>value.recordId===record.recordId),rawPriority=current?(Object.hasOwn(record.arrangement||{},'executionPriority')?record.arrangement.executionPriority:record.executionPriority):latest?latest.executionPriority:batchRow?.executionPriority,priority=taskRosterPriority(rawPriority),entry=view.entrySource&&typeof view.entrySource==='object'?clone(view.entrySource):undefined;
      const activeMethod=fourDirect(record)?record.directMethod:view.currentNode?.methods?.[0],activeOther=record.ownerTenantId===actor.tenantId&&fourBusinessActive(record)&&(fourArrangementCurrent(record)&&!current||typeof activeMethod==='string'&&activeMethod!==normalized.method),unknown=!callsKnown||!currentCallsKnown||(view.pendingRequests||[]).length>0||view.workState?.code==='WAITING_REVIEW'||segments.some(segment=>segment.factConflict||segment.executionState==='unknown'||(segment.calls||[]).some(call=>call.state==='UNKNOWN'))||current&&record.execution?.state==='unknown';
      const listValues=Object.fromEntries(['name','phone','note'].filter(key=>Object.hasOwn(values,key)).map(key=>[key,clone(values[key])])),ownParameterSnapshot=current?view.taskImportParameterSnapshot:latest?.aiImportParameterSnapshot||original?.taskImportParameterSnapshot,source=view.taskImportSource||original?.taskImportSource;
      const detailData={recordId:view.recordId,businessCode:view.businessCode,categoryId:categoryId||'',categoryName:categoryName||'',handlingMode:view.handlingMode,fields:clone(values),importFieldSnapshot:{fields:clone(definitions),values:clone(values)},workState:clone(view.workState),...(entry?{entrySource:entry}:{}),...(source?{taskImportSource:clone(source)}:{}),...(priority!==undefined?{executionPriority:priority}:{}),...(ownParameterSnapshot?{taskImportParameterSnapshot:clone(ownParameterSnapshot)}:{})};
      rows.push({rowSource:'BUSINESS',recordId:view.recordId,businessFlowRecordId:view.recordId,tenantId:actor.tenantId,method:normalized.method,taskId:normalized.taskId,businessCode:view.businessCode,fields:clone(values),taskListValues:listValues,...(importedAt?{importedAt}:{}),...(typeof sourceBatch?.name==='string'&&sourceBatch.name?{taskBatchName:sourceBatch.name}:{}),...(typeof sourceBatch?.batchId==='string'&&sourceBatch.batchId?{taskBatchId:sourceBatch.batchId}:{}),...(categoryId?{categoryId,taskCategoryId:categoryId}:{}),...(categoryName?{categoryName,taskCategoryName:categoryName}:{}),...(priority!==undefined?{executionPriority:priority}:{}),...(entry?{entrySource:entry}:{}),...(Object.hasOwn(record,'handlingMode')?{handlingMode:view.handlingMode}:{}),createdAt:current?view.createdAt:latest?.startedAt||original?.at||view.createdAt,updatedAt:current?view.updatedAt:latest?.endedAt||latest?.startedAt||original?.at||view.updatedAt,workState:clone(view.workState),taskRelation:{imported,current,executed,historical:view.viewIdentity==='history',executionTransferred:!!activeOther},...(callsKnown?{taskCalls}:{}),...(currentCallsKnown?{currentTaskCalls}:{}),taskExecution:{callsKnown,currentCallsKnown,...(callsKnown||taskCalls.some(call=>call.dialed===true)?{hasDialed:taskCalls.some(call=>call.dialed===true)}:{}),...(currentCallsKnown||currentTaskCalls.some(call=>call.dialed===true)?{currentHasDialed:currentTaskCalls.some(call=>call.dialed===true)}:{}),startFailure:segments.some(segment=>segment.startFailure===true),pending:(view.pendingRequests||[]).length>0,unknown:!!unknown,...(latest?.startedAt?{latestAt:latest.startedAt}:{})},detailData});
    }
    const ordered=window.DListOrder?.rows?DListOrder.rows(rows,{fallbackKeys:['createdAt']}):rows;
    return {method:normalized.method,taskId:normalized.taskId,taskName:target.target.name||normalized.taskId,tenantId:actor.tenantId,rows:ordered,counts:{total:ordered.length},batches:state.batches.filter(batch=>batch.tenantId===actor.tenantId&&batch.taskImportSource?.method===normalized.method&&String(batch.taskImportSource.taskId)===normalized.taskId).map(batch=>fourProjectAIImportBatch(batch,actor))};
  });}
