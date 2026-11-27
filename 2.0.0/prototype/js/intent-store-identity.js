/* Resolve only a saved, explicitly selected store identity. No provider query or
 * display-name fallback is performed while preparing an internal delivery. */
(() => {
  'use strict';
  const dealerDictionary='NEV_TEST_DRIVE_DEALER';
  const object=value=>Boolean(value&&typeof value==='object'&&!Array.isArray(value));
  const text=value=>typeof value==='string'?value.trim():'';
  const code=value=>typeof value==='string'&&value===value.trim()&&value.length>0&&value.length<=200&&!/[\u0000-\u001f\u007f]/.test(value);
  const own=(value,key)=>Boolean(value&&Object.hasOwn(value,key));
  const copy=value=>JSON.parse(JSON.stringify(value));
  const failed=(status,reason)=>({status,reason});
  function stop(status,reason){const error=Error(reason);error.status=status;throw error;}
  const roundOf=task=>text(task?.roundId||task?.skynet?.roundId);
  function scopeFor(context,task){
    const current=window.DSession?.context?.();
    if(!current||current.account?.id!==context?.account?.id||current.scope?.id!==context?.scope?.id||
        current.scope?.tenant?.brandId!==context?.scope?.tenant?.brandId||current.scope.kind!=='tenant'||
        String(current.scope?.tenant?.enterpriseId||'')!==String(context?.scope?.tenant?.enterpriseId||'')||
        current.scope.tenant?.enabled!==true||!text(current.scope.tenant.brandId)||!task||
        task.tenant!==current.scope.id||task.brandId&&task.brandId!==current.scope.tenant.brandId||
        !text(task.taskId)||!roundOf(task)||task.roundId&&task.skynet?.roundId&&task.roundId!==task.skynet.roundId) {
      stop('unavailable','当前任务、轮次、租户或品牌无法核对。');
    }
    if(window.DRolePermissions?.moduleEnabled&&window.DRolePermissions.moduleEnabled('cloud',current)!==true)stop('unavailable','当前租户未开通此业务范围。');
    const session=window.DSession,allowed=id=>session.allowed?.(id,current)===true;
    const role=session.roleKey?.(current)||'';
    const manager=(/_admin$/.test(role)||session.isGlobalAdministrator?.(current)===true)&&
      (allowed('PAGE-2226')||allowed('PAGE-21008'));
    const state=window.DReview21?.state?.();
    if(!state)stop('unavailable','当前任务资料尚未就绪，请重新打开后核对意向门店。');
    if(state&&window.DReview21?.isLatest&&window.DReview21.isLatest(state)!==true)stop('unavailable','任务资料已更新，请重新打开后核对意向门店。');
    const ownSeats=(state?.seats||[]).filter(seat=>seat.accountId===current.account.id&&seat.tenant===current.scope.id&&
      (!seat.brandId||seat.brandId===current.scope.tenant.brandId)&&seat.enabled===true&&seat.bindingState==='已关联');
    if(!manager&&!(allowed('PAGE-2202')&&ownSeats.some(seat=>seat.id===task.ownerId)))stop('unavailable','当前账号无权核对此任务的意向门店。');
    if(state){
      const matches=Array.isArray(state.records)?state.records.filter(row=>row.id===task.id&&row.taskId===task.taskId&&row.tenant===task.tenant):[];
      const saved=matches[0];
      if(state.tenant!==current.scope.id||matches.length!==1||saved.brandId&&saved.brandId!==current.scope.tenant.brandId||
          saved.ownerId!==task.ownerId||roundOf(saved)!==roundOf(task)||
          (saved.categoryContext||saved.categoryId||saved.skynet?.categoryId)!==(task.categoryContext||task.categoryId||task.skynet?.categoryId)) {
        stop('unavailable','当前任务记录、负责坐席或轮次已变化，请重新打开。');
      }
    }
    return {current,tenantId:current.scope.id,brandId:current.scope.tenant.brandId,taskId:task.taskId,roundId:roundOf(task),
      enterpriseId:String(current.scope.tenant.enterpriseId||'')};
  }
  function native(scope){
    const root=window.document?.querySelector?.('iframe[data-native-module="cloud"]')?.contentWindow;
    const current=root?.DNativeContext?.context;
    if(!root||current?.account?.id!==scope.current.account.id||current?.scope?.id!==scope.tenantId||
        current.scope.tenant?.brandId!==scope.brandId||String(current.scope.tenant?.enterpriseId||'')!==scope.enterpriseId)stop('unavailable','门店字段目录的身份或品牌已变化。');
    return root;
  }
  function liveSchema(scope,task){
    const root=native(scope),schema=window.DReview21DccFollowupFields?.taskForm?.(task,root,scope.current);
    const categoryId=task.categoryContext||task.categoryId||task.skynet?.categoryId;
    if(!schema||!Array.isArray(schema.fields)||!text(schema.categoryId)||categoryId&&schema.categoryId!==categoryId) {
      stop('unavailable','当前任务的意向门店填写字段无法核对。');
    }
    return {root,schema};
  }
  function intentField(schema){
    const fields=schema.fields.filter(field=>field&&field.enabled!==false&&
      (window.DReview21DccFollowupFields?.fieldKey?.(field)==='intentStore'||field.businessKey==='intentStore'||field.key==='intentStore'));
    if(!fields.length)stop('missing','当前分配规则关联的填写配置没有有效意向门店字段。');
    if(fields.length!==1)stop('ambiguous','当前填写配置存在多个意向门店字段，请先明确字段关联。');
    return fields[0];
  }
  function keysFor(field){return [...new Set(['intentStore',field.id,'field:'+field.id,text(field.businessKey),text(field.key)].filter(Boolean))];}
  function presentValue(container,field){
    const entries=keysFor(field).filter(key=>own(container,key)).map(key=>container[key]);
    if(!entries.length)return {present:false};
    const tokens=entries.map(token);
    if(new Set(tokens).size!==1)stop('ambiguous','同一意向门店字段保存了不同的选择编码，请核对本轮填写。');
    return {present:true,value:entries[0],token:tokens[0]};
  }
  function token(value){
    if(value==null||value==='')return '';
    if(Array.isArray(value)){
      const entries=value.filter(item=>item!=null&&item!=='');
      if(entries.length>1)stop('ambiguous','本次选择了多个意向门店，不能自动认定唯一接收租户。');
      return entries.length?token(entries[0]):'';
    }
    if(object(value)){
      if(!code(value.code))stop('unavailable','接口门店选择缺少有效的真实编码。');
      return value.code;
    }
    if(!code(value))stop('unavailable','意向门店选择编码格式无效，不能按名称或数值猜测。');
    return value;
  }
  function one(value){return Array.isArray(value)?value.filter(item=>item!=null&&item!=='')[0]:value;}
  function sourceInfo(scope,root,source){
    if(!object(source)||!text(source.dictionaryId)||source.brandId&&source.brandId!==scope.brandId) {
      stop('unavailable','意向门店来源与当前品牌不一致或缺少准确来源标识。');
    }
    const model=root.BusinessData,entry=model?.entry?.(source.dictionaryId),capability=model?.capability?.(entry?.capabilityId);
    const use={tenantId:scope.tenantId,enterpriseId:scope.enterpriseId,brandId:scope.brandId};
    if(!entry||entry.enabled!==true||entry.brandId!==scope.brandId||capability?.kind!=='store'||
        model.available?.(entry.id,use)!==true||source.capabilityId&&source.capabilityId!==entry.capabilityId) {
      stop('unavailable','意向门店的取数接口已停用、跨品牌或不再是可用门店来源。');
    }
    const version=model.sourceVersion?.(entry.id,use);
    if(!text(version)||!text(source.sourceVersion)||version!==source.sourceVersion)stop('unavailable','意向门店来源版本已变化，请重新确认本轮门店。');
    return {sourceId:entry.id,capabilityId:entry.capabilityId,sourceVersion:version};
  }
  function resolveField(scope,root,field,selection){
    const value=token(selection),raw=one(selection);
    if(!value)stop('missing','本轮尚未填写可核对的意向门店。');
    const common={brandId:scope.brandId,fieldId:field.id,value};
    if(field.foundationDictionaryCode){
      if(field.foundationDictionaryCode!==dealerDictionary)stop('unavailable','意向门店字段引用的不是门店基础字典。');
      const data=window.DReview21FoundationDictionary?.read?.(scope.brandId);
      const rows=data?.items?.[dealerDictionary];if(!Array.isArray(rows))stop('unavailable','当前品牌的门店基础字典暂不可读取。');
      const matches=rows.filter(row=>row?.code===value);
      if(matches.length>1)stop('ambiguous','同一门店字典选项存在多条定义，请先核对。');
      const row=matches[0];if(!row||row.status!=='启用')stop('unavailable','已填写的意向门店字典项已移除或停用。');
      if(!code(row.externalStoreCode)||!object(row.externalSource))stop('unavailable','该历史门店只有本地字典编码，尚未关联真实外部门店编码。');
      const source=sourceInfo(scope,root,row.externalSource);
      return {...common,...source,code:row.externalStoreCode,name:text(row.externalStoreSnapshot?.name)||text(row.name)};
    }
    if(field.type==='interface'){
      if(!object(raw)||raw.state!=='valid'||raw.entryId!==field.dictionaryId||!text(raw.name)) {
        stop('unavailable','意向门店接口选择尚未有效确认，请重新选择，不能仅用显示名称或普通选项ID下发。');
      }
      const source=sourceInfo(scope,root,{dictionaryId:raw.entryId,sourceVersion:raw.sourceVersion,brandId:scope.brandId});
      return {...common,...source,code:value,name:text(raw.name)};
    }
    if(!['select','multiselect'].includes(field.type))stop('unavailable','意向门店没有保存带业务编码的选项，不能按手填名称匹配租户。');
    const matches=(field.options||[]).filter(option=>option&&option.enabled!==false&&(option.id===value||option.value===value));
    if(matches.length>1)stop('ambiguous','已填写的意向门店选项标识重复，请先核对字段配置。');
    const option=matches[0];if(!option)stop('unavailable','已填写的意向门店选项已失效，请重新确认。');
    const candidates=[option.code,option.businessKey].filter(item=>item!=null&&item!=='');
    if(!candidates.length||candidates.some(item=>!code(item)))stop('unavailable','意向门店选项尚未配置真实门店业务编码。');
    if(new Set(candidates).size!==1)stop('ambiguous','意向门店选项的业务编码定义不一致，请先核对。');
    const source=option.externalSource?sourceInfo(scope,root,option.externalSource):{};
    return {...common,...source,code:candidates[0],name:text(option.label)||text(option.name)};
  }
  function selectionFrom(source,field){
    const selected=presentValue(source?.options,field),details=presentValue(source?.details,field);
    if(selected.present){
      if(selected.token&&details.present&&!details.token)stop('unavailable','本轮意向门店的填写值与保存的选项编码不一致。');
      return selected;
    }
    if(details.present&&object(one(details.value))&&field.type==='interface')return details;
    if(details.present&&details.token)stop('unavailable','本轮意向门店只保存了显示名称，没有可核对的选项编码。');
    return {present:details.present,value:'',token:''};
  }
  function capture(context,task,schema,source){
    try {
      const scope=scopeFor(context,task),live=liveSchema(scope,task),field=intentField(live.schema);
      const frozen=schema&&Array.isArray(schema.fields)?intentField(schema):field;
      if(['id','type','foundationDictionaryCode','dictionaryId'].some(key=>(frozen[key]||'')!==(field[key]||''))||
          schema?.categoryId&&schema.categoryId!==live.schema.categoryId)stop('unavailable','本轮意向门店填写字段已变化，请重新打开表单。');
      if(source?.roundId&&source.roundId!==scope.roundId)stop('unavailable','本轮意向门店与当前任务轮次不一致。');
      const selected=selectionFrom(source,field),store=resolveField(scope,live.root,field,selected.value);
      const original=resolveField(scope,live.root,frozen,selected.value);
      if(['code','sourceId','capabilityId','sourceVersion'].some(key=>(original[key]||'')!==(store[key]||'')))stop('unavailable','本轮门店选项的业务编码或来源已变化，请重新打开表单。');
      return {status:'available',store,snapshot:{version:1,taskId:scope.taskId,roundId:scope.roundId,tenantId:scope.tenantId,
        brandId:scope.brandId,categoryId:live.schema.categoryId,fieldId:field.id,value:store.value,store:copy(store)}};
    }catch(error){return failed(error.status||'unavailable',error.message||'本轮意向门店无法核对。');}
  }
  function checkSavedState(visit,scope){
    if(!own(visit,'intentStoreIdentityState'))return;
    const saved=visit.intentStoreIdentityState;
    if(!object(saved)||saved.version!==1||!['available','missing','ambiguous','unavailable'].includes(saved.status)) {
      stop('unavailable','本轮意向门店确认状态无法核对，请补录本轮门店后再下发。');
    }
    if(saved.status!=='available')stop(saved.status,(text(saved.reason)||'本轮意向门店来源尚未确认。')+' 请补录本轮门店并重新确认接收租户。');
    const snapshot=visit.intentStoreIdentity;
    if(!object(snapshot)||snapshot.version!==1||snapshot.taskId!==scope.taskId||snapshot.roundId!==scope.roundId||
        snapshot.tenantId!==scope.tenantId||snapshot.brandId!==scope.brandId||!text(snapshot.categoryId)||!text(snapshot.fieldId)||
        !code(snapshot.value)||!object(snapshot.store)||!code(snapshot.store.code)||snapshot.store.brandId!==scope.brandId||
        snapshot.store.fieldId!==snapshot.fieldId||snapshot.store.value!==snapshot.value) {
      stop('unavailable','本轮门店确认缺少有效来源快照，请补录本轮门店后再下发。');
    }
  }
  function currentVisit(task,scope){return [...(task.followupHistory||[])].reverse().find(item=>item?.roundId===scope.roundId);}
  function selectionSignature(container,field){
    const safe=value=>{
      if(value==null||typeof value==='boolean'||typeof value==='number')return value;
      if(typeof value==='string')return value.slice(0,500);
      if(Array.isArray(value))return value.slice(0,50).map(safe);
      if(object(value))return Object.fromEntries(['code','entryId','sourceVersion','state'].filter(key=>own(value,key))
        .map(key=>[key,typeof value[key]==='string'?value[key].slice(0,500):typeof value[key]]));
      return typeof value;
    };
    return keysFor(field).filter(key=>own(container,key)).map(key=>[key,safe(container[key])]);
  }
  function candidates(context,task){
    try {
      const scope=scopeFor(context,task),live=liveSchema(scope,task),field=intentField(live.schema);
      const info={id:field.id,label:field.label||'意向门店',type:field.type};
      if(!['select','multiselect'].includes(field.type))return {status:'unavailable',field:info,rows:[],signature:'',
        reason:field.type==='interface'?'当前门店是接口选择字段，请回到原填写流程重新查询并确认唯一门店。':
          '当前门店字段没有可选门店枚举，请回到原填写流程确认唯一门店。'};
      const rows=[],seen=new Set();
      for(const option of field.options||[]){
        if(option?.enabled===false)continue;
        const value=option?.id||option?.value;
        if(!code(value))stop('unavailable','意向门店候选缺少有效选项标识，请先维护填写配置。');
        if(seen.has(value))stop('ambiguous','意向门店候选选项标识重复，请先维护填写配置。');
        seen.add(value);
        const store=resolveField(scope,live.root,field,value);
        rows.push({value,label:text(option.label)||store.name,store});
      }
      if(!rows.length)return {status:'missing',field:info,rows:[],signature:'',reason:'当前意向门店字段没有可精确确认的已启用候选。'};
      const visit=currentVisit(task,scope),snapshot=visit?.intentStoreIdentity;
      const signature=JSON.stringify({version:1,accountId:scope.current.account.id,tenantId:scope.tenantId,brandId:scope.brandId,
        taskId:scope.taskId,roundId:scope.roundId,ownerId:task.ownerId,categoryId:live.schema.categoryId,
        field:{id:field.id,type:field.type,dictionaryId:field.dictionaryId||'',foundationDictionaryCode:field.foundationDictionaryCode||''},
        candidates:rows.map(row=>[row.value,row.store.code,row.store.brandId,row.store.sourceId||'',row.store.capabilityId||'',row.store.sourceVersion||''])
          .sort((a,b)=>a[0].localeCompare(b[0])),
        current:{visitId:visit?.visitId||'',options:selectionSignature(visit?.options,field),taskOptions:selectionSignature(task.visitOptionValues,field),
          marker:visit?.intentStoreIdentityState?[visit.intentStoreIdentityState.version,visit.intentStoreIdentityState.status]:null,
          saved:snapshot?[snapshot.version,snapshot.fieldId,snapshot.value,snapshot.store?.code,snapshot.store?.sourceId||'',snapshot.store?.sourceVersion||'']:null}});
      return {status:'available',field:info,rows,signature};
    }catch(error){return {...failed(error.status||'unavailable',error.message||'意向门店候选暂不可读取。'),rows:[],signature:''};}
  }
  function resolve(context,task){
    try {
      const scope=scopeFor(context,task),visit=currentVisit(task,scope);
      if(!visit)stop('missing','当前轮次尚无可核对的正式回访意向门店，请先保存本轮填写。');
      checkSavedState(visit,scope);
      const live=liveSchema(scope,task),field=intentField(live.schema);
      const record=presentValue(task.visitOptionValues,field),ownOption=presentValue(visit.options,field);
      const saved=selectionFrom(!ownOption.present&&record.present?{...visit,options:task.visitOptionValues}:visit,field);
      if(saved.present&&saved.token&&record.present&&saved.token!==record.token)stop('unavailable','本轮回访与当前任务保存的意向门店编码不一致。');
      // Older visits did not save options; their current-round task option IDs
      // remain usable. An explicitly cleared visit must never inherit old data.
      const selected=saved.present?saved:record;
      const snapshot=visit.intentStoreIdentity;
      if(snapshot){
        if(!object(snapshot)||snapshot.version!==1||snapshot.taskId!==scope.taskId||snapshot.roundId!==scope.roundId||
            snapshot.tenantId!==scope.tenantId||snapshot.brandId!==scope.brandId||snapshot.categoryId!==live.schema.categoryId||
            snapshot.fieldId!==field.id||!object(snapshot.store)||snapshot.store.brandId!==scope.brandId||
            snapshot.value!==selected.token||snapshot.store.value!==selected.token)stop('unavailable','本轮意向门店已改变，原门店来源快照不能用于新的下发。');
      }
      const store=resolveField(scope,live.root,field,selected.value);
      if(snapshot&&['code','sourceId','capabilityId','sourceVersion','fieldId','value'].some(key=>(snapshot.store[key]||'')!==(store[key]||''))) {
        stop('unavailable','本轮意向门店编码或来源版本已变化，请重新核对后再下发。');
      }
      return {status:'available',store};
    }catch(error){return failed(error.status||'unavailable',error.message||'本轮意向门店无法核对。');}
  }
  window.DIntentStoreIdentity=Object.freeze({resolve,capture,candidates});
})();
