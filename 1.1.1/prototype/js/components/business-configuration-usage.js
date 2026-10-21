/** Read-only, current-schema usage checks. Never enumerate storage or hydrate business projections. */
(function (root) {
  'use strict';
  const reviews=new Map();let sequence=0;
  const object=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
  const text=value=>typeof value==='string'?value:'';
  const filled=value=>value!==undefined&&value!==null&&value!==''&&(!Array.isArray(value)||value.length>0);
  const sameScope=(a,b)=>a?.enterpriseId===b?.enterpriseId&&a?.tenantId===b?.tenantId;
  const phoneOf=row=>text(root.CustomerDirectory?.phoneOf?.(row)||(row?.customerPhone||(row?.direction==='呼入'?row?.caller:row?.callee)));
  const scopeOf=value=>({enterpriseId:text(value?.enterpriseId),tenantId:text(value?.tenantId)});
  const validScope=value=>!!text(value?.enterpriseId).trim()&&!!text(value?.tenantId).trim();
  const copy=value=>structuredClone(value);
  const actor=()=>{const s=root.AppState?.get?.()||{},a=root.AppState?.effectiveAccess?.()||{};return JSON.stringify([s.accountId,s.sessionId,s.enterpriseId,s.tenantId,s.activeDomain,a.roleCode,a.valid,root.HistorySnapshot?.read_only===true]);};
  const failure=(code,reason)=>({ok:false,canDelete:false,code,reason,refs:[],fingerprint:'',token:null});
  function inspectCurrent(input={}) {
    const kind=input.kind,id=text(input.id),model=root.CustomerBusiness,data=root.BusinessData;
    if(!['interface','field','category'].includes(kind)||!id||id.trim()!==id)return failure('INVALID_TARGET','请选择要核对的配置');
    const scope=kind==='interface'?(input.scope==null?null:scopeOf(input.scope)):scopeOf(input.scope),context=actor();
    const allowedScope=value=>validScope(value)&&model?.canManage?.()===true&&(model.tenants?.()||[]).some(row=>sameScope(row,value));
    if(root.HistorySnapshot?.read_only===true||root.AppState?.isReady?.()!==true||((kind!=='interface'||scope)&&root.AppState?.effectiveAccess?.().valid!==true) ||
      (kind==='interface'?data?.canManage?.()!==true:!allowedScope(scope)) || kind==='interface'&&scope&&!allowedScope(scope))return failure('FORBIDDEN','当前身份或租户范围无权核对此配置');
    if(!model||!data)return failure('USAGE_UNAVAILABLE','配置使用关系尚未就绪，请刷新后重试');
    const refs=new Map(),errors=new Set(),readSet=[],groups=new Map(),seenScopes=new Set();
    const relevant=where=>kind==='interface'||sameScope(where,scope);
    const issue=label=>errors.add(label);
    function read(storage,key,label,fallback,valid) {
      try {
        if(typeof storage?.getItem!=='function')throw Error();
        const raw=storage.getItem(key);if(raw!==null&&typeof raw!=='string')throw Error();readSet.push([label,key,raw]);
        const value=raw===null?fallback:JSON.parse(raw);if(!valid(value))throw Error();return value;
      }catch(_){issue(label);return fallback;}
    }
    function add(subject,value,where,detail) {
      if(subject!==kind||value!==id||!validScope(where)||!relevant(where))return;
      const retainedField=subject==='field'&&(detail.kind==='saved_business'||detail.snapshotRetained===true);
      const ref={...scopeOf(where),...detail,...(subject==='category'||retainedField?{blocking:false}:{})};
      const key=JSON.stringify([ref.kind,ref.enterpriseId,ref.tenantId,ref.objectId||ref.callId||'',ref.categoryId||'',ref.fieldId||'',ref.reasonCode||'']);
      const old=refs.get(key);if(old){if(!old.sources.includes(ref.source))old.sources.push(ref.source);if(old.blocking===false&&ref.blocking!==false)delete old.blocking;return;}
      ref.sources=[ref.source];refs.set(key,ref);
    }
    const category=(value,where,detail)=>{if(typeof value==='string'&&value)add('category',value,where,{categoryId:value,...detail});};
    function selections(value,where,detail) {
      for(const item of Array.isArray(value)?value:[value])if(object(item)){
        for(const key of ['entryId','dictionaryId'])if(typeof item[key]==='string')add('interface',item[key],where,detail);
      }
    }
    function values(value,where,detail,manifest=false) {
      if(value===undefined||value===null)return;
      if(!object(value)){if(relevant(where))issue(detail.sourceLabel);return;}
      if(!validScope(where)){issue(detail.sourceLabel);return;}
      if(!relevant(where))return;
      category(value.businessType,where,detail);
      const snapshot=manifest?value:value.businessFieldSnapshot;
      if(snapshot!==undefined){
        if(!object(snapshot)||!Array.isArray(snapshot.fields)||snapshot.values!==undefined&&!object(snapshot.values)){issue(detail.sourceLabel);return;}
        category(snapshot.businessType,where,detail);
        for(const field of snapshot.fields){
          if(!object(field)||typeof field.fieldId!=='string'){issue(detail.sourceLabel);continue;}
          const info={...detail,fieldId:field.fieldId,fieldLabel:text(field.fieldName)||field.fieldId};
          add('field',field.fieldId,where,info);
          if(typeof field.dictionaryId==='string')add('interface',field.dictionaryId,where,info);
          selections(field.value,where,info);
        }
        if(snapshot.values)for(const [fieldId,raw]of Object.entries(snapshot.values))if(!['businessType','updatedAt','updatedBy','businessFieldSnapshot'].includes(fieldId)&&filled(raw)){
          const info={...detail,fieldId};add('field',fieldId,where,info);selections(raw,where,info);
        }
      }
      if(!manifest)for(const [fieldId,raw]of Object.entries(value))if(!['businessType','updatedAt','updatedBy','businessFieldSnapshot'].includes(fieldId)&&!fieldId.startsWith('__')&&filled(raw)){
        const info={...detail,fieldId};add('field',fieldId,where,info);selections(raw,where,info);
      }
    }
    function configured(bundle,source) {
      if(!object(bundle)||!validScope(bundle)||!Array.isArray(bundle.fields)||!Array.isArray(bundle.types)){issue('业务配置');return;}
      if(!relevant(bundle))return;
      const where=scopeOf(bundle),fieldIds=new Set(),categoryIds=new Set(),retired=source.startsWith('retired-category:'),archiveLabel=retired?bundle.types[0]?.label:'',reasonCode=retired?source:'';
      for(const field of bundle.fields){
        if(!object(field)||typeof field.id!=='string'||fieldIds.has(field.id)||!['text','textarea','number','select','multiselect','date','datetime','interface'].includes(field.type)||typeof field.enabled!=='boolean'||!Array.isArray(field.options)){issue('业务配置');continue;}fieldIds.add(field.id);
        if(field.type==='interface'){
          if(typeof field.dictionaryId!=='string'){issue('业务配置');continue;}
          add('interface',field.dictionaryId,where,{kind:'configuration',source,reasonCode,sourceLabel:retired?'已删除分类的保留定义':'自定义字段配置',objectId:field.id,fieldId:field.id,fieldLabel:text(field.label)||field.id,categoryLabels:bundle.types.filter(row=>Array.isArray(row?.fields)&&row.fields.some(ref=>ref?.fieldId===field.id)).map(row=>text(row.label)||row.id),message:retired?'已删除分类“'+archiveLabel+'”的原有业务保留字段“'+(field.label||field.id)+'”及其取数接口':'被自定义字段“'+(field.label||field.id)+'”引用'});
          if(retired)add('field',field.id,where,{kind:'configuration',source,reasonCode,snapshotRetained:true,sourceLabel:'已删除分类的保留定义',objectId:bundle.types[0].id,fieldId:field.id,fieldLabel:text(field.label)||field.id,message:'已删除分类“'+archiveLabel+'”保留独立字段快照，不影响删除当前字段'});
        }
        if(field.useQueryConditions===true){
          if(!Array.isArray(field.depends)||field.depends.some(value=>typeof value!=='string')){issue('业务配置');continue;}
          for(const dependency of field.depends)add('field',dependency,where,{kind:'configuration',source,reasonCode,snapshotRetained:retired,sourceLabel:retired?'已删除分类的查询依赖快照':'字段查询条件',objectId:field.id,fieldId:field.id,fieldLabel:text(field.label)||field.id,message:retired?'已删除分类“'+archiveLabel+'”保留独立查询依赖快照，不影响删除当前字段':'被字段“'+(field.label||field.id)+'”的查询条件引用'});
        }
      }
      for(const row of bundle.types){
        if(!object(row)||typeof row.id!=='string'||categoryIds.has(row.id)||typeof row.enabled!=='boolean'||!Array.isArray(row.fields)){issue('业务配置');continue;}categoryIds.add(row.id);
        for(const ref of row.fields){
          if(!object(ref)||typeof ref.fieldId!=='string'||!fieldIds.has(ref.fieldId)||typeof ref.enabled!=='boolean'||typeof ref.required!=='boolean'){issue('业务配置');continue;}
          add('field',ref.fieldId,where,{kind:'configuration',source,reasonCode,snapshotRetained:retired,sourceLabel:retired?'已删除分类的保留定义':'业务分类配置',objectId:row.id,categoryId:row.id,categoryLabel:text(row.label)||row.id,message:retired?'已删除分类“'+(row.label||row.id)+'”保留独立字段快照，不影响删除当前字段':'被业务分类“'+(row.label||row.id)+'”引用（包括关闭显示的引用）'});
        }
      }
      if(bundle.retiredTypes!==undefined) {
        if(!Array.isArray(bundle.retiredTypes))issue('已删除分类的保留定义');
        else {const retiredIds=new Set();for(const archive of bundle.retiredTypes) {
          if(typeof model.validRetiredType!=='function'||!model.validRetiredType(archive)||categoryIds.has(archive.row.id)||retiredIds.has(archive.row.id)){issue('已删除分类的保留定义');continue;}retiredIds.add(archive.row.id);
          configured({...where,types:[archive.row],fields:archive.fields},'retired-category:'+archive.row.id);
        }}
      }
    }
    const config=read(root.localStorage,model.storageKey,'业务配置',{version:model.storageVersion,revision:0,scopes:[]},value=>object(value)&&value.version===model.storageVersion&&Number.isSafeInteger(value.revision)&&Array.isArray(value.scopes));
    read(root.localStorage,data.storageKey,'取数接口字典',{version:data.storageVersion,revision:0,entries:[]},value=>object(value)&&value.version===data.storageVersion&&Number.isSafeInteger(value.revision)&&Array.isArray(value.entries));
    if(data.catalogState?.().ok!==true)issue('取数接口字典');
    for(const bundle of config.scopes){
      if(!validScope(bundle)){issue('业务配置');continue;}const key=JSON.stringify(scopeOf(bundle));if(seenScopes.has(key))issue('业务配置');seenScopes.add(key);configured(bundle,'business-config');
    }
    let factory=scope;
    if(kind==='interface'&&!factory){const current=scopeOf(root.AppState.get());if(allowedScope(current))factory=current;}
    if(factory&&!seenScopes.has(JSON.stringify(factory))){const projected=model.catalog(factory);if(!projected.ok)issue('当前业务配置');else configured({...factory,fields:projected.fields,types:projected.rows},'current-factory');}
    function call(row,source,sourceLabel,rank,session=null) {
      if(!object(row)||!validScope(row)||typeof row.callId!=='string'||!row.callId){issue(sourceLabel);return;}
      if(!relevant(row))return;
      const key=JSON.stringify([row.enterpriseId,row.tenantId,row.callId]);if(!groups.has(key))groups.set(key,[]);groups.get(key).push({row,source,sourceLabel,rank,session});
    }
    const native=read(root.localStorage,'native-workbench-records-v1','通话台账',[],Array.isArray);native.forEach(row=>call(row,'native-calls','通话记录',5));
    const session=read(root.sessionStorage,'native-workbench-session-v1','当前通话草稿',null,value=>value===null||object(value));
    if(session?.call)call(session.call,'active-session','当前通话草稿',6,session);
    else if(session&&['offered','answering','dialing','ringing','connected','wrap'].includes(session.phase))issue('当前通话草稿');
    const directory=read(root.localStorage,'customer-directory-v1','客户档案快照',{version:1,calls:[],unmerged:[]},value=>object(value)&&value.version===1&&Array.isArray(value.calls)&&(value.unmerged===undefined||Array.isArray(value.unmerged)));
    directory.calls.forEach(row=>call(row,'customer-directory','客户档案业务记录',2));(directory.unmerged||[]).forEach(row=>call(row,'directory-unmerged','待核业务记录',2));
    const local=read(root.localStorage,'local-task-result-journal-v1','本地任务结果',{version:1,calls:[]},value=>object(value)&&value.version===1&&Array.isArray(value.calls));local.calls.forEach(row=>call(row,'local-results','演示通话/业务记录',3));
    const linked=read(root.localStorage,'linked-scenario-demo-v1','任务联动演示记录',{enabled:false,calls:[],tasks:[]},value=>object(value)&&typeof value.enabled==='boolean'&&Array.isArray(value.calls)&&Array.isArray(value.tasks));linked.calls.forEach(row=>call(row,'linked-scenario','演示通话/业务记录',3));
    const batches=read(root.localStorage,'customer-task-batches-v1','导入名单',[],Array.isArray);
    for(const batch of batches){
      if(!object(batch)||!validScope(batch)||!Array.isArray(batch.rows)){issue('导入名单');continue;}
      if(!relevant(batch))continue;
      const where=scopeOf(batch),detail={kind:'imported_business',source:'customer-batches',sourceLabel:'导入名单',objectId:text(batch.id),message:'已有导入名单使用此业务分类'};category(batch.businessType,where,detail);
      for(const row of batch.rows){
        if(!object(row)){issue('导入名单');continue;}category(row.businessType||batch.businessType,where,{...detail,objectId:text(batch.id)+'/'+text(row.id),message:'已有导入客户使用此业务分类'});
        if(row.calls!==undefined&&!Array.isArray(row.calls)){issue('导入名单');continue;}
        for(const record of row.calls||[])call({...record,enterpriseId:record.enterpriseId||where.enterpriseId,tenantId:record.tenantId||where.tenantId,businessType:record.businessType||row.businessType||batch.businessType},'customer-batches','名单联系记录',3);
        if(row.customerFollowup)values(row.customerFollowup,where,{...detail,kind:'saved_business',objectId:text(batch.id)+'/'+text(row.id),message:'导入客户保留业务填写记录'});
      }
    }
    const journal=read(root.localStorage,root.CustomerFollowup?.storageKey||'customer-followup-v111-current','已保存业务信息',{version:root.CustomerFollowup?.storageVersion||1,entries:[]},value=>object(value)&&value.version===(root.CustomerFollowup?.storageVersion||1)&&Array.isArray(value.entries));
    for(const entry of journal.entries){
      try {const key=JSON.parse(entry.key);if(!Array.isArray(key)||key.length!==4||key.some(value=>typeof value!=='string'||!value))throw Error();values(entry.values,{enterpriseId:key[0],tenantId:key[1]},{kind:'saved_business',source:'followup-journal',sourceLabel:'已保存业务信息',callId:key[3],objectId:key[3],message:'已保存通话保留此业务配置的记录'});}
      catch(_){issue('已保存业务信息');}
    }
    function task(row,source,sourceLabel){if(!object(row)||!validScope(row)){issue(sourceLabel);return;}category(row.businessType,row,{kind:'imported_business',source,sourceLabel,objectId:text(row.taskId),message:'已有任务明确使用此业务分类'});}
    linked.tasks.forEach(row=>task(row,'linked-scenario-tasks','任务联动演示记录'));
    for(const storage of [root.localStorage,root.sessionStorage])for(const row of read(storage,'cloud-task-created-v1',storage===root.localStorage?'任务创建索引':'任务创建会话索引',[],Array.isArray))task(row,'created-tasks','已创建任务');
    const ledger=read(root.localStorage,'dcc-task-ledger-v1.1.0','DCC业务台账',{schemaVersion:'1.1.0',sequence:0,tasks:{}},value=>object(value)&&value.schemaVersion==='1.1.0'&&object(value.tasks));
    for(const entry of Object.values(ledger.tasks)){
      if(!object(entry)||!object(entry.task)||!validScope(entry.task)||!Array.isArray(entry.records)){issue('DCC业务台账');continue;}
      task(entry.task,'dcc-ledger','DCC任务');
      for(const row of entry.records){if(!object(row)){issue('DCC业务台账');continue;}category(row.businessType||entry.task.businessType,entry.task,{kind:'imported_business',source:'dcc-ledger',sourceLabel:'DCC业务记录',objectId:text(row.recordId),message:'DCC业务记录使用此分类'});if(row.customerFollowup)values(row.customerFollowup,entry.task,{kind:'saved_business',source:'dcc-ledger',sourceLabel:'DCC业务记录',objectId:text(row.recordId),message:'DCC记录保留业务填写'});}
    }
    if(ledger.communicationEvents!==undefined&&!Array.isArray(ledger.communicationEvents))issue('DCC业务台账');
    for(const event of ledger.communicationEvents||[]){if(!object(event)||!validScope(event)){issue('DCC业务台账');continue;}if(event.payload?.customerBusiness)values(event.payload.customerBusiness,event,{kind:'saved_business',source:'dcc-communications',sourceLabel:'已保存沟通业务回传',callId:text(event.payload.callId),objectId:text(event.eventId),message:'已保存沟通业务回传保留此配置'},true);if(event.payload?.callRecord)call(event.payload.callRecord,'dcc-completion-call','已保存沟通通话记录',4);}
    const ramCalls=root.CloudCallData?.calls;if(!Array.isArray(ramCalls))issue('当前业务记录');else {readSet.push(['RAM calls',JSON.stringify(ramCalls)]);ramCalls.forEach(row=>call(row,'runtime-calls',row?.simulation?'演示通话/业务记录':'当前业务记录',1));}
    for(const name of ['tasks','predictiveTasks','ivrTasks']){const rows=root.CloudCallData?.[name]||[];if(!Array.isArray(rows)){issue('当前任务目录');continue;}readSet.push(['RAM '+name,JSON.stringify(rows)]);for(const row of rows)task(row,'runtime-tasks','当前任务目录');}
    function frame(row,label){
      if(!Object.hasOwn(row,'businessFormVersion'))return null;
      const value=row.businessFormVersion;
      const phone=phoneOf(row);
      if(!object(value)||value.version!==1||!text(value.id)||!Number.isSafeInteger(value.revision)||value.revision<0||!Array.isArray(value.rows)||!Array.isArray(value.fields)||!object(value.initialIssues)||!object(value.repairs)||!object(value.owner)||value.owner.enterpriseId!==row.enterpriseId||value.owner.tenantId!==row.tenantId||value.owner.callId!==row.callId||!text(row.accountId)||value.owner.accountId!==row.accountId||!text(phone)||value.owner.phone!==phone){issue(label);return null;}
      const fieldIds=new Set();
      for(const field of value.fields)if(!object(field)||!text(field.id)||fieldIds.has(field.id)||!['text','textarea','number','select','multiselect','date','datetime','interface'].includes(field.type)){issue(label);return null;}else fieldIds.add(field.id);
      const validRow=entry=>object(entry)&&!!text(entry.id)&&typeof entry.enabled==='boolean'&&Array.isArray(entry.fields)&&entry.fields.every(ref=>object(ref)&&fieldIds.has(ref.fieldId)&&typeof ref.enabled==='boolean'&&typeof ref.required==='boolean');
      const rowIds=new Set();for(const entry of value.rows)if(!validRow(entry)||rowIds.has(entry.id)){issue(label);return null;}else rowIds.add(entry.id);
      for(const [type,repair]of Object.entries(value.repairs))if(!rowIds.has(type)||!object(repair)||repair.row?.id!==type||!Array.isArray(repair.fields)||!Array.isArray(repair.row?.fields)||repair.fields.some(field=>!object(field)||!text(field.id))||repair.row.fields.some(ref=>!object(ref)||!repair.fields.some(field=>field.id===ref.fieldId)||typeof ref.enabled!=='boolean'||typeof ref.required!=='boolean')){issue(label);return null;}
      const body=copy(value);delete body.integrity;const raw=JSON.stringify(body);let hash=2166136261;for(let i=0;i<raw.length;i++)hash=Math.imul(hash^raw.charCodeAt(i),16777619);
      if(value.integrity!==(hash>>>0).toString(16).padStart(8,'0')){issue(label);return null;}return value;
    }
    for(const list of groups.values()){
      const identities=list.map(item=>({phone:phoneOf(item.row),accountId:text(item.row.accountId)}));if(identities.some((value,index)=>identities.slice(index+1).some(other=>value.phone&&other.phone&&value.phone!==other.phone||value.accountId&&other.accountId&&value.accountId!==other.accountId)))issue('同通话身份');
      const nativeCopy=list.find(item=>item.source==='native-calls'),completed=nativeCopy?.row.processingStatus==='已完成';
      list.sort((a,b)=>b.rank-a.rank);const sessionCopy=completed?null:list.find(item=>item.session),chosen=completed?nativeCopy:sessionCopy||nativeCopy||list[0],row=chosen.row,where=scopeOf(row),detail={source:chosen.source,sourceLabel:chosen.sourceLabel,objectId:row.callId,callId:row.callId,message:'通话/业务记录使用此配置'};
      category(row.businessType,where,{...detail,kind:'saved_business'});
      if(row.customerFollowup)values(row.customerFollowup,where,{...detail,kind:'saved_business'});
      if(row.communicationCompletion?.frozenBusinessSnapshot)values(row.communicationCompletion.frozenBusinessSnapshot,where,{...detail,kind:'saved_business',sourceLabel:'已保存沟通业务信息'},true);
      const active=!completed&&(row.processingStatus==='待填写'||sessionCopy&&['offered','answering','dialing','ringing','connected','wrap'].includes(sessionCopy.session.phase));
      if(!active)continue;
      const draft=sessionCopy?.session.followup || row.businessFormRecovery?.draft || row.customerFollowup || {};
      const actualType=row.businessType || (Object.hasOwn(draft,'businessType')?text(draft.businessType):text(row.businessFormType));
      category(actualType,where,{...detail,kind:'active_form',message:'当前通话及话后填写已选择此业务分类'});
      const versionSource=Object.hasOwn(row,'businessFormVersion')?chosen:list.find(item=>Object.hasOwn(item.row,'businessFormVersion')&&phoneOf(item.row)===phoneOf(row)&&text(item.row.accountId)===text(row.accountId));
      const bound=versionSource?frame(versionSource.row,versionSource.sourceLabel):null;
      const boundField=fieldId=>!!bound&&(bound.fields.some(field=>field.id===fieldId)||Object.values(bound.repairs).some(repair=>repair.fields.some(field=>field.id===fieldId)));
      const pending=draft.__callFormRecovery;
      for(const [fieldId,raw]of Object.entries(draft))if(!['businessType','updatedAt','updatedBy','businessFieldSnapshot'].includes(fieldId)&&!fieldId.startsWith('__')&&filled(raw)){
        const used={...detail,kind:'active_form',snapshotRetained:boundField(fieldId),fieldId,message:boundField(fieldId)?'当前通话及话后使用开始时的独立字段快照':'当前通话字段快照待核对，保留已填写内容'};add('field',fieldId,where,used);selections(raw,where,used);
      }
      if(object(pending?.types))for(const item of Object.values(pending.types))for(const held of Array.isArray(item?.pending)?item.pending:[])if(held?.fieldId&&filled(draft[held.fieldId]))add('field',held.fieldId,where,{...detail,kind:'active_form',snapshotRetained:boundField(held.fieldId),fieldId:held.fieldId,message:'当前填写有此字段待核对的原值'});
      if(!bound){if(kind==='interface')issue('进行中通话表单的数据来源');continue;}
      const categories=actualType?bound.rows.filter(item=>item.id===actualType):kind==='interface'?bound.rows.filter(item=>item.enabled===true):[];
      for(const original of categories){
        const repair=bound.repairs[original.id],categoryRow=repair?.row||original,fields=repair?.fields||bound.fields;
        if(!object(categoryRow)||!Array.isArray(categoryRow.fields)||!Array.isArray(fields)){issue(chosen.sourceLabel);continue;}
        const byId=new Map(fields.map(field=>[field.id,field])),queue=categoryRow.fields.filter(ref=>ref.enabled===true&&byId.get(ref.fieldId)?.enabled!==false).map(ref=>ref.fieldId),seen=new Set();
        while(queue.length){const fieldId=queue.shift();if(seen.has(fieldId))continue;seen.add(fieldId);const field=byId.get(fieldId);if(!field){issue(chosen.sourceLabel);continue;}
          const used={...detail,kind:actualType?'active_form':'source_reservation',fieldId,fieldLabel:text(field.label)||fieldId,categoryId:categoryRow.id,categoryLabel:text(categoryRow.label)||categoryRow.id,message:actualType?'当前通话及话后表单仍在使用此字段或来源':'当前通话及话后填写的数据来源保留（尚未选择业务类型）'};
          if(actualType)add('field',fieldId,where,{...used,snapshotRetained:true,message:'当前通话及话后保留开始时的独立字段快照，不影响删除当前字段'});
          if(field.type==='interface'&&typeof field.dictionaryId==='string')add('interface',field.dictionaryId,where,used);
          if(field.useQueryConditions===true){if(!Array.isArray(field.depends))issue(chosen.sourceLabel);else queue.push(...field.depends);}
        }
      }
    }
    let target=null;
    try {
      const targetCatalog=kind==='interface'?null:model.catalog(scope);
      target=kind==='interface'?data.entry(id):(kind==='field'?targetCatalog.fields:targetCatalog.rows).find(row=>row.id===id)||null;readSet.push(['target',JSON.stringify(target)]);
      if(kind==='category'&&target) {
        const byId=new Map(targetCatalog.fields.map(field=>[field.id,field])),needed=new Set(target.fields.map(ref=>ref.fieldId)),queue=[...needed];
        while(queue.length) {const field=byId.get(queue.shift());if(!field)throw Error('Incomplete archive definition');for(const upstream of model.activeDependencies(field))if(!needed.has(upstream)){needed.add(upstream);queue.push(upstream);}}
        readSet.push(['category archive definition',JSON.stringify({row:target,fields:targetCatalog.fields.filter(field=>needed.has(field.id))})]);
      }
    }
    catch(_){issue('目标配置');}
    let encoded;
    // Logical category removal preserves all business uses. Their changing clocks,
    // drafts and newly arrived records are impact information, not a stale review.
    // Physical field/source deletion continues to fingerprint the complete read set.
    const fingerprintReads=kind==='category'?readSet.filter(row=>['业务配置','取数接口字典','target','category archive definition'].includes(row[0])):kind==='field'?[...readSet.filter(row=>['业务配置','取数接口字典','target'].includes(row[0])),['blocking field references',[...refs.values()].filter(ref=>ref.blocking!==false)]]:readSet;
    try {encoded=JSON.stringify([context,kind,id,scope,fingerprintReads]);}catch(_){return failure('USAGE_UNAVAILABLE','使用关系暂时无法核对，请保留数据并重试');}
    const cacheKey=JSON.stringify([context,kind,id,scope]),previous=reviews.get(cacheKey),fingerprint=previous?.encoded===encoded?previous.fingerprint:'usage-'+(++sequence)+'-'+(root.crypto?.randomUUID?.()||Date.now().toString(36));reviews.set(cacheKey,{encoded,fingerprint});
    if(reviews.size>200)reviews.delete(reviews.keys().next().value);
    const token=Object.freeze({kind,id,scope:scope?Object.freeze({...scope}):null,context,fingerprint}),result={ok:true,canDelete:false,code:'IN_USE',reason:'此配置仍被使用，暂不能删除',refs:[...refs.values()],fingerprint,token};
    if(errors.size)return {...result,ok:false,code:'USAGE_UNAVAILABLE',reason:[...errors].join('、')+'暂时无法完整核对，当前不能删除；原资料未改动'};
    if(!target)return {...result,ok:false,code:'UNKNOWN_TARGET',reason:'目标配置不存在或已经变化，请刷新后核对'};
    if(kind==='category')return {...result,canDelete:true,code:'CAN_RETIRE',operation:'retire',impactCount:result.refs.length,reason:result.refs.length?'当前有 '+result.refs.length+' 处原有业务使用。删除后从配置和新业务选择中移除，历史、当前通话及已有名单任务继续保留。':'删除后从配置和新业务选择中移除；原有业务及其字段定义继续保留。'};
    const blockers=result.refs.filter(ref=>ref.blocking!==false);
    if(blockers.length)return {...result,reason:blockers[0].message+(kind==='field'?'，请先解除当前配置引用后再删除':'，暂不能删除')};
    if(kind==='field'&&result.refs.length)return {...result,canDelete:true,code:'SNAPSHOT_ONLY',impactCount:result.refs.length,reason:'当前仅有通话快照或保留定义。可删除当前字段，已保存通话、当前通话及话后填写继续使用各自快照。'};
    return {...result,canDelete:true,code:'UNUSED',reason:'未发现配置引用或业务使用，可删除'};
  }
  function inspect(input) {try{return inspectCurrent(input);}catch(_){return failure('USAGE_UNAVAILABLE','使用关系暂时无法完整核对，当前不能删除；原资料未改动');}}
  function verifyFresh(token) {
    if(!object(token)||typeof token.fingerprint!=='string'||typeof token.context!=='string')return failure('INVALID_REVIEW','请重新核对要删除的配置');
    const current=inspect({kind:token.kind,id:token.id,scope:token.scope});
    if(!current.ok||!current.canDelete)return current;
    if(token.context!==actor()||token.fingerprint!==current.fingerprint)return {...current,ok:false,canDelete:false,code:'USAGE_CHANGED',reason:'配置或使用关系已变化，请重新核对后操作'};
    return current;
  }
  root.BusinessConfigurationUsage=Object.freeze({inspect,verifyFresh});
})(window);
