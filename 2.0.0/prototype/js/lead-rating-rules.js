/* Local prototype: link rating rules to existing fixed business scenarios. Use the AI
 * grade when both configured reference sets match; otherwise use
 * that scenario's explicit fallback. The caller owns
 * business fields, routing and persistence; this module owns rating audit only. */
(() => {
  'use strict';
  const VERSION = 2;
  const fixedModes = Object.freeze(['人工外呼','预外呼']);
  const fixedContacts = Object.freeze(['已接通','正常接通']);
  const fixedScenes = Object.freeze([
    Object.freeze({id:'highIntent',label:'高意向线索下发',leadStatus:'高意向',
      statusValues:Object.freeze(['HQ_HIGH_INTENT','总部_高意向','高意向']),result:'意向线索下发',
      modes:fixedModes,contacts:fixedContacts}),
    Object.freeze({id:'lost',label:'战败线索',leadStatus:'战败',
      statusValues:Object.freeze(['HQ_LOST','总部_战败','战败']),result:'战败',
      modes:fixedModes,contacts:fixedContacts})
  ]);
  const fixedSceneIds = fixedScenes.map(scene=>scene.id);
  const copy = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  const text = value => typeof value === 'string' ? value.trim() : '';
  const now = () => new Date().toISOString();
  const fail = error => ({ok:false,error,message:error});
  const caches = new Map(), loads = new Map();
  let serial = 0;
  const keyFor = scope => (window.DSession?.prefix || 'd-contact-cloud-v210-review:') +
    'lead-rating-scenario-rules-v2:' + encodeURIComponent(scope.brandId) + ':' + encodeURIComponent(scope.tenantId);
  const identity = (context,scope) => JSON.stringify([context?.account?.id,context?.scope?.id,
    context?.scope?.tenant?.enterpriseId,scope.brandId,scope.tenantId]);
  const visitId = visit => text(visit?.visitId || visit?.id);
  const manualValue = value => value == null || value === '' ? null : text(value);
  const visitFacts = visit => copy({result:visit?.result,contact:visit?.contact,leadStatus:visit?.leadStatus,
    callMode:visit?.callMode,callType:visit?.callType,note:visit?.note,details:visit?.details || {}});
  const validValue = value => typeof value === 'string' && Boolean(value) && value === value.trim();
  const recordCategoryId = record => text(record.categoryContext) || text(record.categoryId);
  const valuesOf = allowed => Array.isArray(allowed) ? allowed.map(option => typeof option === 'string' ? option :
    option?.value || option?.businessKey || option?.label || option?.id) : [];

  function liveContext(context) {
    const live = window.DSession?.context?.();
    return live && live.account?.id === context?.account?.id && live.scope?.id === context?.scope?.id &&
      live.scope?.tenant?.brandId === context?.scope?.tenant?.brandId ? live : null;
  }
  function scopeFor(context,tenantId) {
    const live = liveContext(context);
    if (!live) return null;
    const selected = tenantId || live.scope.id;
    if (live.scope.kind === 'tenant' && live.scope.tenant?.enabled === true && selected === live.scope.id) {
      return {tenantId:selected,brandId:live.scope.tenant.brandId || ''};
    }
    const tenant = window.DIntegrationApplications?.tenants?.(live)?.find(row=>row.id===selected);
    return tenant ? {tenantId:tenant.id,brandId:tenant.brandId || ''} : null;
  }
  function projection(data,scope) {
    if (!data?.ok || data.legacy || data.brandId !== scope.brandId || data.scope?.brandId !== scope.brandId ||
        data.scope?.tenantId !== scope.tenantId || data.revision == null ||
        !Array.isArray(data.rows) || !Array.isArray(data.fields)) throw Error(data?.message || '当前分类字段目录的租户、品牌或版本无法核对。');
    const definitions = new Map(data.fields.map(field=>[field.id,field]));
    const options = new Map(), categories = [], signatures = [];
    for (const category of data.rows) {
      if (!validValue(category?.id) || category.enabled===false ||
          [category.brandId,category.categoryRef?.brandId].some(brand=>brand && brand!==scope.brandId)) continue;
      const categoryOptions = new Map();
      for (const ref of category.fields || []) {
        const field = definitions.get(ref.fieldId);
        if (ref.enabled === false || !field || field.enabled === false || field.usage === 'IMPORT' ||
            field.type !== 'select' || !(field.businessKey === 'intentLevel' ||
              window.DReview21DccFollowupFields?.fieldKey?.(field) === 'intentLevel')) continue;
        const raw = field.foundationDictionaryCode ?
          (window.DReview21FoundationDictionary?.read(scope.brandId)?.items?.[field.foundationDictionaryCode] || [])
            .filter(option=>option.status==='启用').map(option=>({id:option.code,label:option.name,businessKey:option.code})) :
          (field.options || []).filter(option=>option.enabled!==false);
        const usable = raw.flatMap(option=>{
          const value = text(option.businessKey || option.label || option.id);
          if (!value) return [];
          const item = {value,label:text(option.label) || value};
          if (!options.has(value)) options.set(value,item);
          if (!categoryOptions.has(value)) categoryOptions.set(value,item);
          return [item];
        });
        signatures.push([category.id,category.configurationVersion,field.id,field.label,usable]);
      }
      categories.push({id:category.id,label:text(category.label) || text(category.name) || category.id,options:[...categoryOptions.values()]});
    }
    return {ok:true,...scope,options:[...options.values()],categories,
      revision:JSON.stringify([VERSION,scope,data.revision,categories.map(({id,label})=>[id,label]),signatures])};
  }
  async function loadOptions(context = window.DSession?.context?.(),tenantId) {
    const scope = scopeFor(context,tenantId), live = liveContext(context);
    if (!scope?.brandId || live?.scope.kind !== 'tenant' || live.scope.id !== scope.tenantId) {
      return {...fail('请切换顶部租户到配置租户，再读取意向级别字段。'),options:[]};
    }
    const cacheKey = identity(live,scope), sequence = ++serial;
    loads.set(cacheKey,sequence); caches.delete(cacheKey);
    try {
      if (!window.DModuleHost?.readCatalog) throw Error('业务分类目录尚未就绪。');
      const data = await window.DModuleHost.readCatalog();
      const current = liveContext(context), currentScope = scopeFor(context,scope.tenantId);
      if (!current || !currentScope || identity(current,currentScope)!==cacheKey || loads.get(cacheKey)!==sequence) {
        throw Error('当前账号、租户或字段读取请求已变化，请重新读取。');
      }
      const result = projection(data,scope); caches.set(cacheKey,result); return copy(result);
    } catch (error) { return {...fail(error?.message || '意向级别字段暂时无法读取。'),...scope,options:[]}; }
  }
  function validSceneSelection(sceneIds) {
    return Array.isArray(sceneIds) && sceneIds.length>0 && new Set(sceneIds).size===sceneIds.length &&
      [...sceneIds].every(id=>fixedSceneIds.includes(id));
  }
  function validCategorySelection(categoryIds) {
    return Array.isArray(categoryIds) && categoryIds.length>0 && new Set(categoryIds).size===categoryIds.length &&
      [...categoryIds].every(validValue);
  }
  function selectionOptions(categories,categoryIds) {
    const selected = categories.filter(category=>categoryIds.includes(category.id));
    const options = [...new Map(selected.flatMap(category=>category.options.map(option=>[option.value,option]))).values()];
    const fallbackOptions = options.filter(option=>selected.every(category=>category.options.some(item=>item.value===option.value)));
    return {options,fallbackOptions};
  }
  function validateRows(rows,optionValues,sceneIds,fallbackValues=optionValues) {
    if (!Array.isArray(rows) || !Array.isArray(optionValues) || !optionValues.length ||
        optionValues.some(value=>!validValue(value)) || new Set(optionValues).size!==optionValues.length) return '评级规则或字段枚举无效。';
    const allowed = new Set(optionValues), fallback = new Set(fallbackValues), seen = new Set();
    for (const row of rows) {
      const linked = sceneIds.includes(row?.id);
      if (!row || !fixedSceneIds.includes(row.id) || seen.has(row.id) ||
          ![row.manualValues,row.aiValues].every(values=>Array.isArray(values) &&
            values.every(value=>validValue(value) && (!linked || allowed.has(value))) && new Set(values).size===values.length) ||
          (linked ? !fallback.has(row.fallback) : row.fallback!=='' && !validValue(row.fallback))) {
        return '关联场景的人工与 AI 参照值须有效，并选择未命中默认评级。';
      }
      seen.add(row.id);
    }
    return rows.length!==fixedSceneIds.length || fixedSceneIds.some(id=>!seen.has(id)) ? '固定场景规则缺失，请重新打开后配置。' : '';
  }
  function readConfig(context = window.DSession?.context?.(),tenantId) {
    const scope = scopeFor(context,tenantId);
    if (!scope?.brandId) return {...fail('当前账号无权读取此租户的评级规则。'),enabled:false,revision:0,rows:[]};
    try {
      const bytes = localStorage.getItem(keyFor(scope));
      if (bytes === null) return {ok:true,...scope,enabled:false,revision:0,sceneIds:[],categoryIds:[],rows:[]};
      const stored = JSON.parse(bytes);
      const sceneIds = Object.hasOwn(stored || {},'sceneIds') ? stored.sceneIds : fixedSceneIds;
      const hasCategories = Object.hasOwn(stored || {},'categoryIds');
      if (stored?.version!==VERSION || stored.tenantId!==scope.tenantId || stored.brandId!==scope.brandId ||
          !Number.isSafeInteger(stored.revision) || stored.revision<1 || typeof stored.enabled!=='boolean' ||
          !validSceneSelection(sceneIds) || hasCategories && !validCategorySelection(stored.categoryIds) || !validValue(stored.optionsRevision) ||
          validateRows(stored.rows,stored.optionValues,sceneIds)) throw Error();
      return {ok:true,...copy(stored),sceneIds:[...sceneIds],categoryIds:hasCategories?[...stored.categoryIds]:null};
    } catch (_) { return {...fail('评级规则读取失败，请重新核对配置，原数据未修改。'),...scope,enabled:false,revision:0,rows:[]}; }
  }
  function saveConfig(context,input = {}) {
    const scope = scopeFor(context,input.tenantId), catalog = window.DIntegrationApplications;
    if (!scope?.brandId || !catalog?.canManage?.(context) || !window.DSession?.canWrite?.('PAGE-2220',context)) {
      return fail('当前账号没有本租户评级规则的维护权限。');
    }
    const bindings = catalog.bindings(context,scope.tenantId);
    if (!bindings?.ok || bindings.rows.find(row=>row.type==='leadRating')?.editable===false) return fail('当前智能体关联为共享只读配置，不能修改评级规则。');
    if (typeof input.enabled!=='boolean') return fail('请选择是否启用评级规则。');
    if (!validSceneSelection(input.sceneIds)) return fail('请至少选择一个有效的关联场景。');
    if (!validCategorySelection(input.categoryIds)) return fail('请至少勾选一个适用二级分类。');
    const previous = readConfig(context,scope.tenantId);
    if (!previous.ok) return previous;
    if (input.expectedRevision!==previous.revision) return fail('评级规则已变化，请重新打开后保存。');
    const live = liveContext(context), cached = caches.get(identity(live,scope));
    if (!cached || cached.revision!==input.optionsRevision) return fail('请先读取当前意向级别字段，再保存评级规则。');
    let current;
    try { current = projection(window.DModuleHost?.currentCatalog?.(),scope); }
    catch (error) { return fail(error?.message || '当前意向级别字段无法复核。'); }
    if (current.revision!==input.optionsRevision) return fail('意向级别字段或字典已变化，请重新读取后保存。');
    const sceneIds = fixedSceneIds.filter(id=>input.sceneIds.includes(id));
    const categoryIds = current.categories.filter(category=>category.options.length && input.categoryIds.includes(category.id)).map(category=>category.id);
    if (categoryIds.length!==input.categoryIds.length) return fail('所选二级分类已停用、不可用或缺少意向级别填写字段，请重新选择。');
    const {options,fallbackOptions} = selectionOptions(current.categories,categoryIds);
    if (!fallbackOptions.length) return fail('所选二级分类没有共同的意向级别，请调整选择。');
    const issue = validateRows(input.rows,options.map(option=>option.value),sceneIds,fallbackOptions.map(option=>option.value));
    if (issue) return fail(issue);
    if (input.enabled && (live?.scope.id!==scope.tenantId || catalog.status(context,'leadRating')?.status!=='connected')) {
      return fail('请先关联当前租户可用的线索智能评级智能体，再启用规则。');
    }
    const bytes = localStorage.getItem(keyFor(scope));
    const fresh = readConfig(context,scope.tenantId);
    if (!fresh.ok || fresh.revision!==input.expectedRevision) return fail('评级规则已变化，请重新打开后保存。');
    const stored = {version:VERSION,...scope,revision:fresh.revision+1,enabled:input.enabled,sceneIds,categoryIds,
      rows:fixedScenes.map(scene=>{
        const row=input.rows.find(item=>item.id===scene.id);
        return {id:scene.id,manualValues:[...row.manualValues],aiValues:[...row.aiValues],fallback:row.fallback};
      }),
      optionValues:options.map(option=>option.value),optionsRevision:current.revision,
      updatedAt:now(),updatedBy:context.account.id};
    try {
      if (localStorage.getItem(keyFor(scope))!==bytes) return fail('评级规则已变化，请重新打开后保存。');
      localStorage.setItem(keyFor(scope),JSON.stringify(stored)); return readConfig(context,scope.tenantId);
    } catch (_) { return fail('评级规则未保存，请保留配置后重试。'); }
  }
  function sceneFor(input) {
    const mode = input.mode || input.callMode, contact = input.contact || input.contactStatus;
    return fixedScenes.find(scene=>scene.modes.includes(mode) && scene.contacts.includes(contact) &&
      scene.statusValues.includes(input.leadStatus) && scene.result===input.result) || null;
  }
  const eligible = input => Boolean(sceneFor(input));
  function decide(row,allowed,manual,value,status) {
    const ai = text(value);
    const aiStatus = status === 'success' ? !ai ? 'empty' : !allowed.includes(ai) ? 'invalid' : 'success' :
      ['failure','timeout','empty','invalid'].includes(status) ? status : 'invalid';
    const manualMatched = manual!==null && allowed.includes(manual) && row.manualValues.includes(manual);
    const aiMatched = aiStatus==='success' && row.aiValues.includes(ai);
    if (manualMatched && aiMatched) return {ok:true,aiStatus,aiValue:ai,manualMatched,aiMatched,finalValue:ai,
      outputSource:'ai',reason:'人工填写值和 AI 返回值分别命中本场景参照集合，采用 AI 返回评级。'};
    if (!allowed.includes(row.fallback)) return fail('本场景未命中默认评级已不在当前填写字段中，请维护字段或规则后再办理。');
    const why = aiStatus!=='success' ? {failure:'AI 评级失败',timeout:'AI 评级超时',empty:'AI 未返回评级',invalid:'AI 返回评级无效'}[aiStatus] :
      manual===null ? '人工未填写评级' : !manualMatched && !aiMatched ? '人工实际评级和AI返回评级均未命中参照集合' :
      !manualMatched ? '人工实际评级未命中参照集合' : 'AI 返回评级未命中参照集合';
    return {ok:true,aiStatus,aiValue:ai || null,manualMatched,aiMatched,finalValue:row.fallback,
      outputSource:'fallback',reason:why+'，输出本场景未命中默认评级。'};
  }
  function runtimeState(record,context,ownerRequired) {
    const live = liveContext(context), review = window.DReview21;
    if (!live || live.scope.kind!=='tenant' || live.scope.tenant?.enabled!==true ||
        !review?.canUseWorkbench?.(live) || !window.DSession?.allowed?.('PAGE-2202',live) ||
        !window.DSession?.can?.('F37',live)) return fail('当前账号没有本任务的办理权限。');
    const state = review.state?.();
    if (!state || !review.isLatest?.(state) || state.tenant!==live.scope.id || !state.records?.includes(record) ||
        record.tenant!==live.scope.id || record.brandId!==live.scope.tenant.brandId) return fail('任务范围或资料版本已变化，请刷新后重试。');
    if (ownerRequired && (state.seatId!==record.ownerId || !(state.seats || []).some(seat=>seat.id===record.ownerId &&
        seat.accountId===live.account.id && seat.tenant===state.tenant && seat.enabled===true && seat.bindingState==='已关联'))) {
      return fail('当前账号不是本任务的有效跟进坐席。');
    }
    return {ok:true,state,live};
  }
  const evaluations = record => record.ratingEvaluation?.version===VERSION ?
    [record.ratingEvaluation,...(record.ratingEvaluation.history || [])] : [];
  function stage(record,context,input = {}) {
    const access = runtimeState(record,context,true);
    if (!access.ok) return access;
    const scene = sceneFor(input);
    if (!scene) return {ok:true,requested:false,reason:'未命中评级场景，保留原回访填写值。'};
    const config = readConfig(context,record.tenant);
    if (!config.ok) return config;
    if (!config.enabled) return {ok:true,requested:false,reason:'评级规则未启用，保留原回访填写值。'};
    if (!config.sceneIds.includes(scene.id)) return {ok:true,requested:false,reason:'本次回访场景未关联评级规则。'};
    const pinnedCategoryId = recordCategoryId(record);
    const formCategoryId = text(input.categoryId);
    const categoryId = pinnedCategoryId || formCategoryId;
    if (config.categoryIds && (!config.categoryIds.includes(categoryId) ||
        pinnedCategoryId && formCategoryId && pinnedCategoryId!==formCategoryId)) {
      return {ok:true,requested:false,reason:'本次回访的二级分类不在评级规则适用范围内。'};
    }
    const allowed = valuesOf(input.allowed), manual = manualValue(input.manual);
    if (!allowed.length || allowed.some(value=>!validValue(value)) || new Set(allowed).size!==allowed.length ||
        manual!==null && !allowed.includes(manual)) return fail('本轮人工评级或字段可选值无效，请核对填写字段。');
    const row = config.rows.find(item=>item.id===scene.id);
    if (!row || !allowed.includes(row.fallback)) return fail('本固定场景规则缺失，或未命中默认评级不在当前填写字段中，请先维护配置。');
    if (!validValue(input.roundId) || !validValue(input.visitId) || !validValue(input.factsVersion) ||
        input.roundId!==record.roundId || record.skynet?.roundId && input.roundId!==record.skynet.roundId) return fail('本轮回访标识或资料版本无效。');
    const visit = (record.followupHistory || []).find(item=>visitId(item)===input.visitId && item.roundId===input.roundId);
    if (!visit || visit.seat!==record.ownerId || visit.factsVersion!==input.factsVersion) return fail('本轮正式回访或事实版本无法核对。');
    const manualOriginal = input.manualOriginal === undefined ? manualValue(visit.details?.intentLevel) : manualValue(input.manualOriginal);
    if (manualValue(visit.details?.intentLevel)!==manualOriginal) return fail('本轮人工填写值已变化，请重新核对本次回访。');
    const previous = evaluations(record).find(item=>item.request?.visitId===input.visitId && item.request.roundId===input.roundId);
    if (previous) return {ok:true,requested:false,request:copy(previous.request),evaluation:copy(previous),reason:'本次正式回访已经送评，不重复请求。'};
    const association = window.DIntegrationApplications?.status?.(context,'leadRating');
    if (association?.status!=='connected' || !text(association.application?.id)) return fail('线索智能评级智能体未关联或当前不可用。');
    const id = 'LRR2-'+Date.now().toString(36)+'-'+(++serial).toString(36)+'-'+Math.random().toString(36).slice(2,8);
    const request = {id,requestId:id,status:'pending',taskId:record.taskId,recordId:record.id,
      tenantId:record.tenant,brandId:record.brandId,ownerId:record.ownerId,accountId:context.account.id,
      categoryId,roundId:input.roundId,visitId:input.visitId,
      factsVersion:input.factsVersion,facts:visitFacts(visit),sceneId:scene.id,manual,manualOriginal,allowed:[...allowed],rule:copy(row),configRevision:config.revision,
      optionsRevision:config.optionsRevision,agentId:association.application.id,agentConnectionKey:association.application.connectionKey || association.application.id,
      interfaceKey:association.application.interfaceKey || null,mode:input.mode,
      leadStatus:input.leadStatus,result:input.result,contact:input.contact,actor:copy(input.actor || null),createdAt:now()};
    const history = evaluations(record).map(item=>{const {history:discard,...rest}=item;return copy(rest);});
    const evaluation = {version:VERSION,status:'pending',sceneId:scene.id,request,manual,
      manualMatched:manual!==null && row.manualValues.includes(manual),aiMatched:null,aiStatus:'pending',aiValue:null,finalValue:null,
      outputSource:null,raw:null,evidence:[],reason:'正式回访已提交，等待 AI 评级。',history};
    record.ratingEvaluation = evaluation;
    return {ok:true,requested:true,request:copy(request),evaluation:copy(evaluation),reason:evaluation.reason};
  }
  function archiveVisit(record,evaluation) {
    const request = evaluation.request;
    const visit = (record.followupHistory || []).find(item=>visitId(item)===request.visitId && item.roundId===request.roundId);
    if (!visit) return;
    const {history:discard,...audit} = evaluation;
    const prior = visit.ratingEvaluation;
    if (prior?.request?.id && prior.request.id!==request.id) {
      visit.ratingEvaluationHistory = [...(visit.ratingEvaluationHistory || []).filter(item=>item.request?.id!==prior.request.id),copy(prior)];
    }
    visit.ratingEvaluation = copy(audit);
  }
  function settle(record,context,input = {}) {
    const access = runtimeState(record,context,false);
    if (!access.ok) return access;
    const current = record.ratingEvaluation, evaluation = evaluations(record).find(item=>item.request?.id===input.requestId);
    if (!evaluation) return {ok:true,applied:false,ignored:true,reason:'未找到对应的正式回访评级请求。'};
    const request = evaluation.request;
    if (request.tenantId!==record.tenant || request.brandId!==record.brandId || request.taskId!==record.taskId ||
        request.recordId!==record.id || request.accountId!==context.account.id || request.roundId!==input.roundId ||
        request.visitId!==input.visitId || request.factsVersion!==input.factsVersion) return {ok:true,applied:false,ignored:true,reason:'评级响应与原请求范围或版本不一致。'};
    if (request.rule?.id!==request.sceneId || !fixedScenes.some(scene=>scene.id===request.sceneId) ||
        ![request.rule?.manualValues,request.rule?.aiValues].every(values=>Array.isArray(values) &&
          values.every(validValue) && new Set(values).size===values.length) || !validValue(request.rule?.fallback)) {
      return {...fail('原请求的固定场景规则快照无效，请核对后再办理。'),applied:false};
    }
    if (evaluation.status!=='pending') return {ok:true,applied:false,ignored:true,finalValue:evaluation.finalValue,
      evaluation:copy(evaluation),reason:'本请求已处理，不重复应用。'};
    const latest = record.followupHistory?.at(-1), originalVisit = (record.followupHistory || []).find(item=>
      visitId(item)===request.visitId && item.roundId===request.roundId);
    const historical = input.historicalOnly === true || evaluation!==current || record.ownerId!==request.ownerId ||
      request.categoryId && request.categoryId!==(recordCategoryId(record) || text(input.categoryId)) ||
      access.state.seatId!==request.ownerId || record.roundId!==request.roundId ||
      record.skynet?.roundId && record.skynet.roundId!==request.roundId || !originalVisit || latest!==originalVisit ||
      originalVisit.factsVersion!==request.factsVersion || originalVisit.seat!==request.ownerId ||
      manualValue(originalVisit.details?.intentLevel)!==request.manualOriginal || Boolean(record.skynet?.delivery) ||
      JSON.stringify(visitFacts(originalVisit))!==JSON.stringify(request.facts) ||
      ['已结束','已下发','待下发','待下发审核','已归档','已结案','已撤回','已取消'].includes(record.taskStatus);
    const allowed = input.allowed === undefined ? request.allowed : valuesOf(input.allowed);
    if (!Array.isArray(allowed) || !allowed.length || allowed.some(value=>!validValue(value)) || new Set(allowed).size!==allowed.length) return fail('当前填写字段已失效，请核对后再办理。');
    const result = decide(request.rule,historical ? request.allowed : allowed,request.manual,input.value,input.status);
    if (!result.ok) return {...result,applied:false};
    const settled = {...evaluation,...result,status:'settled',receivedAt:now(),raw:copy(input.raw ?? null),evidence:copy(input.evidence || []),
      historical,applied:!historical,reason:historical?'历史请求结果，仅留档，未用于当前评级。 '+result.reason:result.reason,
      request:{...request,status:'settled'}};
    if (historical && evaluation===current) {
      Object.assign(evaluation,{status:'settled',request:settled.request,aiStatus:settled.aiStatus,
        manualMatched:settled.manualMatched,aiMatched:settled.aiMatched,
        historical:true,applied:false,reason:settled.reason,history:[...(evaluation.history || []),copy({...settled,history:undefined})]});
    } else Object.assign(evaluation,settled);
    archiveVisit(record,settled);
    return {ok:true,applied:!historical,ignored:historical,finalValue:historical?null:settled.finalValue,evaluation:copy(settled),reason:settled.reason};
  }
  window.DLeadRatingRules = Object.freeze({fixedScenes,loadOptions,readConfig,saveConfig,selectionOptions,matches:eligible,stage,settle});
})();
