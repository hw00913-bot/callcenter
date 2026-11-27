(() => {
  'use strict';

  const storageKey = window.DSession.prefix + 'system-dependencies-v1';
  const legacyWecomKey = window.DSession.prefix + 'wecom-integration-v1';
  const retiredAgentType = 'storeRecommendation';
  const types = Object.freeze([
    {key:'cloudOutbound', label:'云外呼账号', identifier:'账号标识'},
    {key:'preRating', label:'预评分系统', identifier:'外部应用标识'},
    {key:'scriptRecommendation', label:'智能话术推荐 Agent', identifier:'Agent ID', kind:'agent'},
    {key:'leadRating', label:'线索智能评级 Agent', identifier:'Agent ID', kind:'agent'},
    {key:'formFilling', label:'智能填单 Agent', identifier:'Agent ID', kind:'agent'},
    {key:'callAnalysis', label:'通话分析 Agent', identifier:'Agent ID', kind:'agent'},
    {key:'qualityInspection', label:'智能质检 Agent', identifier:'Agent ID', kind:'agent'},
    {key:'wecom', label:'企微应用', identifier:'应用标识'}
  ].map(Object.freeze));
  const text = value => typeof value === 'string' ? value.trim() : '';
  const failure = message => ({ok:false,message});
  const typeFor = key => types.find(type => type.key === key);
  const agentTypes = Object.freeze(types.filter(type=>type.kind==='agent'));
  const separateAgentIds = ['formFilling','callAnalysis'];
  const isAgent = key => typeFor(key)?.kind==='agent';
  const additionalDependency = 'externalDependency';
  const dependencyTypes = Object.freeze(types.filter(type=>['preRating','wecom'].includes(type.key)));
  const dependencyScenarios = Object.freeze(['下发','预评分','转企微跟进','优秀话术']);
  const dependencyScenario = row => dependencyScenarios.includes(row?.applicationScenario) ? row.applicationScenario :
    ({preRating:'预评分',wecom:'转企微跟进'})[row?.type] || '';
  const isDependencyType = key => key===additionalDependency || dependencyTypes.some(type=>type.key===key);
  const isDependency = row => isDependencyType(row.type);
  const dependencyKey = row => row.type===additionalDependency ? row.recordId : row.type;
  const hasInterfaceReference = row => Object.hasOwn(row,'interfaceKey');
  const bailianNames = new Set(['阿里百炼','阿里云百炼','百炼','bailian','alibailian','aliyunbailian',
    'alibababailian','alibabacloudbailian']);
  const fingerprint = value => {
    const source=JSON.stringify(value);let hash=2166136261;
    for (let index=0;index<source.length;index++) hash=Math.imul(hash^source.charCodeAt(index),16777619);
    return (hash>>>0).toString(16).padStart(8,'0');
  };
  function isBailianInterface(row) {
    if (row?.type!==additionalDependency ||
        !bailianNames.has(text(row.name).replace(/\s+/g,'').toLowerCase()) ||
        !text(row.interfaceName) || row.interfaceName.length>100 || !text(row.interfaceUrl) ||
        row.interfaceUrl.length>500 || /[\u0000-\u0020\u007f]/.test(row.interfaceUrl)) return false;
    try {
      const url=new URL(row.interfaceUrl);
      return ['http:','https:'].includes(url.protocol) && Boolean(url.hostname) && !url.username && !url.password;
    } catch (_) { return false; }
  }
  function interfaceConnection(row) {
    return 'bailian:'+dependencyKey(row)+':'+fingerprint([row.id,row.interfaceUrl,row.brandIds,row.tenantIds,row.secretVerifier]);
  }
  function resolveInterface(rows,key,tenant) {
    const matches=rows.filter(row=>dependencyKey(row)===key && isBailianInterface(row) && applies(row,tenant));
    return matches.length===1 ? matches[0] : null;
  }
  function interfaceDirectory(rows,tenant,options) {
    const sources=rows.filter(row=>isBailianInterface(row) && applies(row,tenant) &&
      resolveInterface(rows,dependencyKey(row),tenant)===row);
    const projected=sources.map(row=>{
      const visible=options.tenants.filter(target=>applies(row,target));
      return {key:dependencyKey(row),name:row.name,interfaceName:row.interfaceName,appId:text(row.id),
        updatedAt:row.updatedAt || '',brandIds:[...new Set(visible.map(target=>target.brandId || ''))],
        tenantIds:visible.map(target=>target.id),label:row.interfaceName+' · '+row.name};
    });
    return {ok:true,rows:projected,revision:'bailian-directory-v1:'+fingerprint(sources.map((row,index)=>
      [projected[index],interfaceConnection(row)]))};
  }
  function bailianInterfaces(context,tenantId) {
    const options=applicableOptions(context),tenant=options.tenants.find(row=>row.id===tenantId);
    if (!tenant) return failure('当前账号没有此租户的百炼接口查看权限。');
    try { return interfaceDirectory(read().rows,tenant,options); }
    catch (_) { return failure('阿里百炼接口目录暂时无法读取，请重新读取。'); }
  }

  function currentContext(context) {
    const current = window.DSession.context();
    return current && current.account.id===context?.account?.id && current.scope.id===context?.scope?.id &&
      current.scope.kind===context?.scope?.kind && (current.scope.kind!=='tenant' ||
        current.scope.tenant?.brandId===context.scope.tenant?.brandId) ? current : null;
  }

  function managementScope(context) {
    const current = currentContext(context);
    if (!current || !window.DSession.allowed('PAGE-2220',current)) return null;
    if (window.DSession.isGlobalAdministrator(current) || window.DSession.platformAuthority(current)?.role==='super') {
      return {current,global:true};
    }
    return current.scope.kind==='tenant' && current.scope.tenant?.enabled===true &&
      ['hq_admin','store_admin'].includes(window.DSession.roleKey(current)) ? {current,global:false} : null;
  }

  function tenants(context) {
    const authority = managementScope(context);
    if (!authority) return [];
    const {current,global} = authority;
    if (!global) return [{id:current.scope.id,name:current.scope.tenant.name,brandId:current.scope.tenant.brandId || ''}];
    const grant = window.DSession.platformAuthority(current);
    const brands = new Set(grant?.brandIds || []);
    const ids = new Set(grant?.tenantIds || []);
    return (window.DOrganization?.tenants() || []).filter(tenant=>tenant.enabled===true && ids.has(tenant.id) &&
      (!tenant.brandId || brands.has(tenant.brandId)))
      .map(({id,name,brandId})=>({id,name,brandId:brandId || ''}));
  }

  function applicableOptions(context) {
    const allowedTenants = tenants(context);
    const ids = new Set(allowedTenants.map(tenant=>tenant.brandId));
    const brands = (window.DOrganization?.brands() || []).filter(brand=>ids.has(brand.id))
      .map(({id,name})=>({id,name}));
    if (ids.has('')) brands.push({id:'',name:'待关联品牌'});
    return {brands,tenants:allowedTenants};
  }

  const validIds = values => Array.isArray(values) && values.length>0 &&
    values.every(value=>typeof value==='string' && value===value.trim()) && new Set(values).size===values.length;
  const hasScope = row => Array.isArray(row?.brandIds) && Array.isArray(row?.tenantIds);
  const applies = (row,tenant) => hasScope(row) ?
    row.tenantIds.includes(tenant.id) && row.brandIds.includes(tenant.brandId || '') : row.tenantId===tenant.id;

  function legacyWecom(rows) {
    try {
      const legacy = JSON.parse(localStorage.getItem(legacyWecomKey));
      const record = legacy?.record;
      if (legacy?.version!==1 || !record || !text(record.name) || !text(record.appId) ||
          record.name.length>60 || record.appId.length>120 || !validIds(record.brandIds) || !validIds(record.tenantIds) ||
          !/^[a-f0-9]{32}:[a-f0-9]{64}$/.test(record.secretVerifier)) return null;
      const organization = window.DOrganization?.snapshot();
      const targets = (organization?.tenants || []).filter(tenant=>record.tenantIds.includes(tenant.id) &&
        record.brandIds.includes(tenant.brandId) && !rows.some(row=>row.type==='wecom' &&
          (row.tenantId===tenant.id || applies(row,tenant))));
      if (!targets.length) return null;
      const owner = targets.find(tenant=>tenant.enabled) || targets[0];
      return {type:'wecom',tenantId:owner.id,id:record.appId,name:record.name,
        remarks:text(record.description),brandIds:[...new Set(targets.map(row=>row.brandId))],
        tenantIds:targets.map(row=>row.id),secretVerifier:record.secretVerifier,platformOnly:true,
        updatedAt:record.updatedAt || 'legacy-wecom'};
    } catch (_) {
      return null;
    }
  }

  function read() {
    const bytes = localStorage.getItem(storageKey);
    const data = bytes===null ? {version:1,rows:[]} : JSON.parse(bytes);
    if (data?.version!==1 || !Array.isArray(data.rows)) throw Error('应用接入配置暂时无法读取。');
    const seen = new Set();
    for (const row of data.rows) {
      const dependency = row && isDependency(row);
      const id = row?.id;
      if (!row || !text(row.tenantId) ||
          !(row.type===additionalDependency ? /^dep-[a-f0-9-]{36}$/.test(row.recordId) :
            typeFor(row.type) || row.type===retiredAgentType) ||
          (id!==undefined && (typeof id!=='string' || id.length>120)) ||
          !text(row.name) || row.name.length>60 || (!dependency && (!text(id) || typeof row.enabled!=='boolean')) ||
          (Object.hasOwn(row,'brandIds') || Object.hasOwn(row,'tenantIds')) &&
            (!validIds(row.brandIds) || !validIds(row.tenantIds) || row.tenantIds.includes(''))) {
        throw Error('应用接入配置暂时无法读取。');
      }
      const key = JSON.stringify([row.tenantId,dependencyKey(row)]);
      if (seen.has(key)) throw Error('应用接入配置暂时无法读取。');
      seen.add(key);
    }
    const legacy = data.wecomMigrated ? null : legacyWecom(data.rows);
    return {bytes,rows:legacy ? [...data.rows,legacy] : data.rows};
  }

  function persist(rows) {
    localStorage.setItem(storageKey,JSON.stringify({version:1,wecomMigrated:true,rows}));
  }

  const scenarioBindingsKey = window.DSession.prefix + 'scenario-bindings-v1';
  const scenarioCallsKey = window.DSession.prefix + 'scenario-calls-v1';
  const categoryScenarios = ['预评分','优秀话术'];
  const reviewStatePrefix = 'd-contact-210-integrated-review-v1:';

  function scenarioTenant(context,tenantId = context?.scope?.id) {
    const current = currentContext(context);
    if (!current) return null;
    const managed = tenants(current).find(tenant=>tenant.id===tenantId);
    if (managed) return managed;
    const role = window.DSession.roleKey(current);
    const categoryReader = ['hq_admin','store_admin'].includes(role) && window.DSession.allowed('PAGE-2006',current);
    if (current.scope.kind!=='tenant' || current.scope.id!==tenantId || current.scope.tenant?.enabled!==true ||
        !current.scope.tenant.brandId || !['hq_admin','store_admin','hq_ops','store_ops'].includes(role) ||
        !(categoryReader || ['PAGE-2202','PAGE-2226','PAGE-2204'].some(page=>window.DSession.allowed(page,current)))) return null;
    if (window.DRolePermissions?.moduleEnabled && !window.DRolePermissions.moduleEnabled('cloud',current)) return null;
    return {id:tenantId,name:current.scope.tenant.name,brandId:current.scope.tenant.brandId};
  }

  function completeScenarioInterface(row) {
    if (!text(row?.interfaceName) || !text(row?.interfaceUrl) || row.interfaceUrl.length>500 ||
        /[\u0000-\u0020\u007f]/.test(row.interfaceUrl)) return false;
    try {
      const url = new URL(row.interfaceUrl);
      return ['http:','https:'].includes(url.protocol) && Boolean(url.hostname) && !url.username && !url.password;
    } catch (_) { return false; }
  }

  function scenarioRevision(row) {
    return 'scenario-v1:'+fingerprint([dependencyScenario(row),text(row.id),row.interfaceUrl,
      [...(row.brandIds || [])].sort(),[...(row.tenantIds || [row.tenantId])].sort(),row.secretVerifier || '']);
  }

  function scenarioApplication(row) {
    const id = dependencyKey(row), revision = scenarioRevision(row);
    return {id,key:id,name:row.name,appId:text(row.id),interfaceName:row.interfaceName,
      scenario:dependencyScenario(row),revision,connectionKey:'scenario:'+id+':'+revision};
  }

  function scenarioApplications(context,scenario,{tenantId = context?.scope?.id} = {}) {
    const tenant = scenarioTenant(context,tenantId);
    if (!tenant || !dependencyScenarios.includes(scenario)) return failure('当前账号无法读取此租户的场景应用。');
    try {
      const sources = read().rows.filter(row=>isDependency(row) && dependencyScenario(row)===scenario &&
        applies(row,tenant) && completeScenarioInterface(row));
      const ids = sources.map(dependencyKey);
      const rows = sources.filter(row=>ids.filter(id=>id===dependencyKey(row)).length===1).map(scenarioApplication);
      return {ok:true,rows,revision:'scenario-directory-v1:'+fingerprint(rows)};
    } catch (_) { return failure('场景应用目录暂不可读取，请重新读取。'); }
  }

  function resolveScenarioApplication(context,scenario,id,{revision,connectionKey,tenantId = context?.scope?.id} = {}) {
    const unavailable = message=>({ok:false,status:'unavailable',message});
    if (!text(id) || id!==text(id)) return unavailable('请先关联'+scenario+'应用。');
    const directory = scenarioApplications(context,scenario,{tenantId});
    if (!directory.ok) return unavailable(directory.message);
    const application = directory.rows.find(row=>row.id===id);
    if (!application) return unavailable('所关联的'+scenario+'应用已删除、接口未配置完整或不在当前适用范围内。');
    if (revision!==undefined && revision!==application.revision || connectionKey!==undefined && connectionKey!==application.connectionKey) {
      return unavailable('所关联的'+scenario+'应用配置已变化，请重新选择并保存业务配置。');
    }
    return {ok:true,status:'available',application};
  }

  function readScenarioBindings() {
    const bytes = localStorage.getItem(scenarioBindingsKey);
    const saved = bytes===null ? {version:1,rows:[]} : JSON.parse(bytes);
    if (saved?.version!==1 || !Array.isArray(saved.rows) || saved.rows.some(row=>
        !text(row.tenantId) || !text(row.brandId) || !text(row.categoryId) || !row.bindings ||
        typeof row.bindings!=='object' || Array.isArray(row.bindings) || Object.keys(row.bindings).some(key=>!categoryScenarios.includes(key)) ||
        Object.values(row.bindings).some(value=>value!==null && (!text(value?.id) || !text(value?.revision) || !text(value?.connectionKey))))) throw Error('场景关联配置无法读取。');
    return {bytes,rows:saved.rows};
  }

  function scenarioBindings(context,categoryId,{tenantId = context?.scope?.id} = {}) {
    const tenant = scenarioTenant(context,tenantId);
    if (!tenant || !text(categoryId)) return failure('无法读取此分类的场景关联。');
    try {
      const saved = readScenarioBindings();
      const matches = saved.rows.filter(row=>row.tenantId===tenant.id && row.brandId===tenant.brandId && row.categoryId===categoryId);
      if (matches.length>1) return failure('此分类存在重复关联，请核对配置。');
      const row = matches[0];
      return {ok:true,bindings:Object.fromEntries(categoryScenarios.map(scenario=>[scenario,row?.bindings[scenario] || null])),
        revision:'category-bindings-v1:'+fingerprint(row || null)};
    } catch (_) { return failure('分类场景关联暂不可读取，原内容已保留。'); }
  }

  function saveScenarioBindings(context,{tenantId = context?.scope?.id,categoryId,expected,bindings:changes} = {}) {
    const current = currentContext(context),tenant = scenarioTenant(context,tenantId);
    if (!tenant || !canWriteScenarioBindings(context,tenantId) || current?.scope.kind!=='tenant' || current.scope.id!==tenantId) {
      return failure('请切换到目标租户，由有权管理员配置场景关联。');
    }
    if (!window.DSkynetConfig?.businessTypes(context)?.some(row=>row.value===categoryId)) return failure('请选择当前可用的二级分类。');
    if (!changes || typeof changes!=='object' || Array.isArray(changes) || Object.keys(changes).some(key=>!categoryScenarios.includes(key)) ||
        categoryScenarios.some(key=>typeof changes[key]!=='string' || changes[key]!==text(changes[key]))) return failure('请选择有效的场景应用。');
    const previous = scenarioBindings(context,categoryId,{tenantId});
    if (!previous.ok || previous.revision!==expected) return failure('场景关联已变化，请重新读取后保存。');
    try {
      const saved = readScenarioBindings();
      const bindings = {};
      for (const scenario of categoryScenarios) {
        if (!changes[scenario]) { bindings[scenario]=null;continue; }
        const selected = resolveScenarioApplication(context,scenario,changes[scenario],{tenantId});
        if (!selected.ok) return failure(selected.message);
        bindings[scenario] = {...selected.application};
      }
      if (!currentContext(context) || !canWriteScenarioBindings(context,tenantId) || localStorage.getItem(scenarioBindingsKey)!==saved.bytes) {
        return failure('场景关联或账号已变化，请重新打开。');
      }
      const rows = saved.rows.filter(row=>!(row.tenantId===tenantId && row.brandId===tenant.brandId && row.categoryId===categoryId));
      rows.push({tenantId,brandId:tenant.brandId,categoryId,bindings,updatedAt:new Date().toISOString(),updatedBy:current.account.id});
      localStorage.setItem(scenarioBindingsKey,JSON.stringify({version:1,rows}));
      return scenarioBindings(context,categoryId,{tenantId});
    } catch (_) { return failure('场景关联未保存，请检查本地存储后重试。'); }
  }

  function resolveScenarioBinding(context,scenario,categoryId) {
    if (!categoryScenarios.includes(scenario)) return {ok:false,status:'unavailable',message:'该场景需要在业务节点中选择应用。'};
    const saved = scenarioBindings(context,categoryId);
    const binding = saved.ok && saved.bindings[scenario];
    if (!binding?.id) return {ok:false,status:'unavailable',message:saved.message || '此业务分类尚未关联'+scenario+'应用。'};
    return resolveScenarioApplication(context,scenario,binding.id,binding);
  }

  function readReviewState(tenantId) {
    let state;
    if (window.DSession.context()?.scope?.id===tenantId) state=window.DReview21?.state?.();
    if (!state) {
      const bytes = localStorage.getItem(reviewStatePrefix+tenantId);
      state = bytes===null ? null : JSON.parse(window.DReviewStorageRecovery?.unpack?.(bytes) ?? bytes);
    }
    if (state && (state.tenant!==tenantId || !Array.isArray(state.records))) throw Error('业务引用暂不可核对。');
    return state;
  }

  function dependencyReferences(context,tenantId,key) {
    if (!managementScope(context)) return failure('当前账号没有引用查看权限。');
    const owner = tenants(context).find(row=>row.id===tenantId);
    if (!owner) return failure('当前租户不可用。');
    try {
      const rows = read().rows, application = findDependency(rows,tenantId,key) ||
        rows.find(row=>isDependency(row) && dependencyKey(row)===key && applies(row,owner));
      if (!application) return {ok:true,rows:[]};
      const result = [],add=(tenant,kind,name,detail)=>result.push({tenantId:tenant.id,tenantName:tenant.name,kind,name,detail});
      const tenantRows = tenants(context).filter(tenant=>tenant.id===tenantId || applies(application,tenant));
      const allBindings = readScenarioBindings().rows;
      const walk = (rules,visit)=>{for(const rule of rules || []){visit(rule);walk(rule.children,visit);}};
      for (const tenant of tenantRows) {
        for (const row of allBindings.filter(row=>row.tenantId===tenant.id && row.brandId===tenant.brandId)) {
          for (const scenario of categoryScenarios) if (row.bindings[scenario]?.id===key) {
            add(tenant,'分类场景关联',row.categoryId,scenario);
          }
        }
        for (const row of rows.filter(row=>isAgent(row.type) && row.interfaceKey===key && applies(row,tenant))) {
          add(tenant,'智能体关联',row.name,row.type);
        }
        const businessState = readReviewState(tenant.id);
        const book = businessState?.skynetConfig || {};
        for (const row of book.deliveryTemplates || []) {
          if (!row.isCurrent || row.deletedAt) continue;
          const handling = row.handlingByKind ? Object.entries(row.handlingByKind) : [['下发',row]];
          for (const [kind,value] of handling) if (value.deliveryTargetType==='externalSystem' &&
              (value.deliveryTargetId===key || value.application?.id===key || value.deliveryApplication?.id===key)) {
            add(tenant,'下发模板',row.name,kind==='intent'?'意向下发':kind==='lowQuality'?'低质下发':kind);
          }
        }
        for (const row of book.nurtureTemplates || []) {
          if (!row.isCurrent || row.deletedAt) continue;
          walk(row.rules,rule=>{
            if (rule.directDeliveryTargetType==='externalSystem' && (rule.directDeliveryTargetId===key || rule.directDeliveryApplication?.id===key)) {
              add(tenant,'培育直发',row.name,rule.name || rule.id || '接入后直发');
            }
            if (rule.wecomApplication?.id===key) add(tenant,'企微培育',row.name,rule.name || rule.id || '企微跟进');
          });
        }
        for (const task of businessState?.records || []) {
          if (task.tenant!==tenant.id || task.brandId && task.brandId!==tenant.brandId) continue;
          const flow=task.skynet || {},delivery=flow.delivery;
          const pendingDelivery=['待下发','待下发审核'].includes(delivery?.status);
          const ended=['已完成','已归档','已结案','已撤回','已取消','已结束','已下发','已过滤'].includes(task.taskStatus) ||
            delivery?.status==='已下发' || flow.endReason==='已下发';
          if (ended && !pendingDelivery) continue;
          const references = [delivery?.target?.application,delivery?.application,delivery?.directDeliveryTarget?.application,
            delivery?.directDeliveryTarget?.directDeliveryApplication,flow.directDeliveryTarget?.application,
            flow.processing?.wecomApplication,flow.wecom?.application];
          let referenced=references.some(reference=>reference?.id===key);
          if (!referenced) {
            const boundDelivery=(book.deliveryTemplates || []).find(row=>row.id===flow.deliveryTemplateId && row.version===flow.deliveryTemplateVersion);
            const handling=boundDelivery?.handlingByKind ? Object.values(boundDelivery.handlingByKind) : [boundDelivery];
            referenced=handling.some(value=>value?.deliveryTargetType==='externalSystem' && (value.deliveryTargetId===key || value.application?.id===key));
            const boundNurture=(book.nurtureTemplates || []).find(row=>row.id===flow.nurtureTemplateId && row.version===flow.nurtureTemplateVersion);
            walk(boundNurture?.rules,rule=>{if(rule.wecomApplication?.id===key || rule.directDeliveryApplication?.id===key ||
              rule.directDeliveryTargetType==='externalSystem' && rule.directDeliveryTargetId===key)referenced=true;});
          }
          if (referenced) add(tenant,'在途任务',task.taskId || task.id,'轮次 '+(task.roundId || flow.roundId || '待核对')+' · '+(task.taskStatus || '处理中'));
        }
      }
      return {ok:true,rows:result};
    } catch (_) { return failure('应用引用暂不可核对，请重新读取后操作。'); }
  }

  function callText(value,max=300) {
    return text(value).slice(0,max).replace(/https?:\/\/[^\s]+/gi,'[接口地址]');
  }

  function safeScenarioCall(input,tenant,accountId) {
    const keys = ['scenario','applicationId','applicationName','revision','connectionKey','operation','taskId','roundId','status','message','externalId','requestId','callId'];
    const row = Object.fromEntries(keys.flatMap(key=>typeof input[key]==='string' ? [[key,callText(input[key],key==='message'?500:200)]] : []));
    const at = typeof input.at==='string' && /^\d{4}-\d{2}-\d{2}T/.test(input.at) && Number.isFinite(Date.parse(input.at)) ?
      new Date(input.at).toISOString() : new Date().toISOString();
    return {...row,tenantId:tenant.id,brandId:tenant.brandId,accountId:callText(accountId,120),at};
  }

  function scenarioCalls(context,{tenantId = context?.scope?.id} = {}) {
    const tenant = scenarioTenant(context,tenantId),current = currentContext(context);
    if (!tenant || !current) return failure('当前账号没有调用记录查看权限。');
    try {
      const bytes = localStorage.getItem(scenarioCallsKey);
      const saved = bytes===null ? {version:1,rows:[]} : JSON.parse(bytes);
      if (saved?.version!==1 || !Array.isArray(saved.rows)) throw Error();
      const manager = Boolean(managementScope(context));
      const persisted = saved.rows.filter(row=>row.tenantId===tenant.id && row.brandId===tenant.brandId && (manager || row.accountId===current.account.id))
        .map(row=>safeScenarioCall(row,tenant,row.accountId));
      const state = readReviewState(tenant.id);
      const ownSeats = new Set((state?.seats || []).filter(seat=>seat.tenant===tenant.id && seat.accountId===current.account.id &&
        seat.enabled!==false && (!seat.brandId || seat.brandId===tenant.brandId)).map(seat=>seat.id));
      const embedded = (state?.records || []).filter(task=>task.tenant===tenant.id && (!task.brandId || task.brandId===tenant.brandId) &&
        (manager || ownSeats.has(task.ownerId))).flatMap(task=>(task.skynet?.scenarioCalls || []).map(row=>safeScenarioCall(row,tenant,row.accountId || '')));
      let ledgerCalls = [];
      if (manager && current.scope.kind==='tenant' && current.scope.id===tenant.id && window.DSkynetDeliveryRecords?.canView?.('sent') && window.DSkynetDeliveryRecords?.list) {
        const evidence = window.DSkynetDeliveryRecords.list('sent');
        if (evidence.error) throw Error(evidence.error);
        ledgerCalls = (evidence.rows || []).filter(row=>row.senderTenantId===tenant.id)
          .flatMap(row=>(row.scenarioCalls || []).map(call=>safeScenarioCall(call,tenant,call.accountId || '')));
      }
      const seen = new Set();
      const rows = [...persisted,...embedded,...ledgerCalls].filter(row=>{
        const key=row.callId || JSON.stringify([row.at,row.scenario,row.applicationId,row.operation,row.taskId,row.roundId,row.externalId]);
        if(seen.has(key))return false;seen.add(key);return true;
      }).sort((a,b)=>String(b.at).localeCompare(String(a.at)));
      return {ok:true,rows};
    } catch (_) { return failure('场景调用记录暂不可读取。'); }
  }

  function recordScenarioCall(context,input = {}) {
    const tenant = scenarioTenant(context),current = currentContext(context);
    if (!tenant || !current || !dependencyScenarios.includes(input.scenario) || !text(input.applicationId) || !text(input.operation) ||
        !['success','failure','failed','timeout','missing','unavailable','pending','available'].includes(input.status)) return failure('无法登记本次场景调用。');
    const selected = resolveScenarioApplication(context,input.scenario,input.applicationId,
      input.connectionKey ? {connectionKey:input.connectionKey} : {});
    if (['success','available'].includes(input.status) && !selected.ok) return failure(selected.message);
    try {
      const bytes = localStorage.getItem(scenarioCallsKey);
      const saved = bytes===null ? {version:1,rows:[]} : JSON.parse(bytes);
      if (saved?.version!==1 || !Array.isArray(saved.rows)) throw Error();
      const value = safeScenarioCall({...input,applicationName:selected.application?.name || input.applicationName,
        revision:selected.application?.revision || input.revision},tenant,current.account.id);
      value.callId ||= 'CALL-'+window.crypto.randomUUID();
      if (saved.rows.some(row=>row.callId===value.callId && row.tenantId===tenant.id && row.brandId===tenant.brandId)) return {ok:true};
      localStorage.setItem(scenarioCallsKey,JSON.stringify({version:1,rows:[...saved.rows,value].slice(-1000)}));
      return {ok:true,value};
    } catch (_) { return failure('调用记录未保存，请检查本地存储后重试。'); }
  }

  function status(context, type) {
    const current = currentContext(context);
    if (!current || current.scope.kind!=='tenant' || current.scope.tenant?.enabled!==true || !typeFor(type)) {
      return {status:'unavailable',message:'无法核对当前租户的接入状态。'};
    }
    try {
      const tenant = {...current.scope.tenant,id:current.scope.id};
      const rows = read().rows;
      const matches = rows.filter(row=>row.type===type && applies(row,tenant));
      if (matches.length>1) return {status:'unavailable',message:'当前租户有重复的'+typeFor(type).label+'配置。'};
      const row = matches[0];
      const dependency = isDependencyType(type);
      if (row && isAgent(type) && hasInterfaceReference(row)) {
        if (!row.enabled) return {status:'unconnected',message:typeFor(type).label+'未接入或未启用。'};
        const selected=resolveInterface(rows,row.interfaceKey,tenant);
        const connectionId=selected && (text(selected.id) || dependencyKey(selected));
        if (selected && separateAgentIds.includes(type) && rows.some(other=>other!==row &&
            separateAgentIds.includes(other.type) && other.type!==type && applies(other,tenant) &&
            effectiveAgentId(other,rows,tenant)===connectionId)) {
          return {status:'unconnected',message:duplicateAgentMessage+'请重新选择接口。'};
        }
        return row.enabled && selected ? {status:'connected',application:{id:text(selected.id) || dependencyKey(selected),
          name:row.name,appId:text(selected.id),interfaceKey:dependencyKey(selected),interfaceName:selected.interfaceName,
          connectionKey:interfaceConnection(selected)}} :
          {status:'unconnected',message:'所关联的阿里百炼接口已删除、配置无效或不再适用于当前租户，请重新选择。'};
      }
      return row && (dependency || row.enabled) ? {status:'connected',application:{id:row.id ?? '',name:row.name}} :
        {status:'unconnected',message:typeFor(type).label+(dependency?'未配置。':'未接入或未启用。')};
    } catch (_) {
      return {status:'unavailable',message:'应用接入配置暂时无法读取。'};
    }
  }

  function canEdit(context,tenant,row) {
    if (row.tenantId!==tenant.id) return false;
    const global = managementScope(context)?.global;
    if (!global) return !row.platformOnly && (!hasScope(row) ||
      row.tenantIds.length===1 && row.tenantIds[0]===tenant.id &&
      row.brandIds.every(id=>id===tenant.brandId));
    const grant = window.DSession.platformAuthority(context);
    return !hasScope(row) || row.tenantIds.every(id=>grant?.tenantIds?.includes(id)) &&
      row.brandIds.every(id=>id==='' || grant?.brandIds?.includes(id));
  }

  function publicRow(context,tenant,row,options,rows = []) {
    const {secretVerifier,platformOnly,enabled,...fields} = row;
    const activation = isDependency(row) ? {} : {enabled};
    const editable = canEdit(context,tenant,row);
    const brandIds = hasScope(row) ? row.brandIds : [tenant.brandId];
    const tenantIds = hasScope(row) ? row.tenantIds : [tenant.id];
    const selected=isAgent(row.type) && hasInterfaceReference(row) ? resolveInterface(rows,row.interfaceKey,tenant) : null;
    const reference=isAgent(row.type) ? {interfaceAvailable:Boolean(selected),
      ...(hasInterfaceReference(row) ? {interfaceKey:row.interfaceKey,
        interfaceName:selected?.interfaceName || row.interfaceName || '',appId:selected?text(selected.id):text(row.interfaceAppId),
        ...(selected ? {id:text(selected.id) || dependencyKey(selected)} : {})} : {})} : {};
    if (editable) return {...fields,...activation,...reference,brandIds,tenantIds,editable,secretConfigured:Boolean(secretVerifier)};
    const visibleTenants = options.tenants.filter(target=>tenantIds.includes(target.id) && brandIds.includes(target.brandId));
    const {type,id,name,remarks,interfaceName,recordId,updatedAt,applicationScenario} = row;
    return {type,id,name,...activation,remarks,interfaceName,recordId,updatedAt,applicationScenario,editable,...reference,
      brandIds:[...new Set(visibleTenants.map(target=>target.brandId))],
      tenantIds:visibleTenants.map(target=>target.id)};
  }

  function listRows(context,tenant,rows,options) {
    const global = managementScope(context)?.global;
    const owned = rows.filter(row=>row.tenantId===tenant.id && (global || applies(row,tenant)));
    const ownedKeys = new Set(owned.map(dependencyKey));
    const shared = rows.filter(row=>!ownedKeys.has(dependencyKey(row)) && applies(row,tenant));
    return [...owned,...shared].filter(row=>row.type!==retiredAgentType).map(row=>publicRow(context,tenant,row,options,rows));
  }

  function list(context, tenantId) {
    const options = applicableOptions(context);
    const tenant = options.tenants.find(row=>row.id===tenantId);
    if (!tenant) return failure('当前账号没有此租户的查看权限。');
    try {
      return {ok:true,rows:listRows(context,tenant,read().rows,options)};
    } catch (_) {
      return failure('应用接入配置暂时无法读取。');
    }
  }

  function scopeInput(input,previous,tenant,options) {
    if (!Object.hasOwn(input,'brandIds') && !Object.hasOwn(input,'tenantIds')) {
      if (hasScope(previous)) return {ok:true,value:{brandIds:previous.brandIds,tenantIds:previous.tenantIds}};
      return {ok:true,value:{brandIds:[tenant.brandId],tenantIds:[tenant.id]}};
    }
    const {brandIds,tenantIds} = input;
    if (!validIds(brandIds) || !validIds(tenantIds)) return failure('请选择适用品牌和适用租户。');
    const targets = options.tenants.filter(row=>tenantIds.includes(row.id));
    if (targets.length!==tenantIds.length || !brandIds.every(id=>options.brands.some(brand=>brand.id===id))) {
      return failure('请选择授权范围内的品牌和租户。');
    }
    if (targets.some(row=>!brandIds.includes(row.brandId))) return failure('适用租户须属于所选品牌。');
    return {ok:true,value:{brandIds:[...brandIds],tenantIds:[...tenantIds]}};
  }

  function scopeConflict(rows,next,options) {
    if (next.type===additionalDependency) return null;
    return options.tenants.find(tenant=>applies(next,tenant) && rows.some(row=>row.type===next.type && applies(row,tenant)));
  }

  const conflictMessage = tenant => tenant.name+'已有同类配置，请先调整其适用范围。';
  const duplicateAgentMessage = '同一租户的智能填单和通话分析须使用不同的 appid。';

  function effectiveAgentId(row,rows,tenant) {
    if (!hasInterfaceReference(row)) return row.id;
    const selected=resolveInterface(rows,row.interfaceKey,tenant);
    return selected ? text(selected.id) || dependencyKey(selected) : null;
  }

  function duplicateAgentId(rows,changed,options) {
    return changed.some(agent=>separateAgentIds.includes(agent.type) && options.tenants.some(tenant=>
      applies(agent,tenant) && rows.some(row=>row.type!==agent.type && separateAgentIds.includes(row.type) &&
        applies(row,tenant) && effectiveAgentId(agent,rows,tenant) &&
        effectiveAgentId(row,rows,tenant)===effectiveAgentId(agent,rows,tenant))));
  }

  function save(context, input) {
    const authority = managementScope(context);
    const tenantId = input?.tenantId ?? authority?.current.scope.id;
    const options = applicableOptions(context);
    const tenant = options.tenants.find(row=>row.id===tenantId);
    if (!authority || !window.DSession.canWrite('PAGE-2220') || !tenant) {
      return failure('当前账号没有此租户的应用配置权限。');
    }
    const type = typeFor(input?.type);
    if (!type) return failure('请选择有效的依赖类型。');
    if (isAgent(type.key) && Object.hasOwn(input,'interfaceKey')) {
      const current=bindings(context,tenantId);
      if (!current.ok) return current;
      const previous=current.rows.find(row=>row.type===type.key && row.tenantId===tenantId);
      if (Object.hasOwn(input,'expected') && input.expected!==(previous?.updatedAt || '')) {
        return failure('应用配置已变化，请重新打开后保存。');
      }
      const result=saveBindings(context,{tenantId,expected:current.revision,changes:{[type.key]:input}});
      return result.ok ? {...result,value:result.rows.find(row=>row.type===type.key)} : result;
    }
    const dependency = isDependencyType(type.key);
    const id = text(input.id), name = text(input.name) || (dependency ? '' : type.label);
    if (!name || name.length>60) return failure('请填写 1 至 60 字的应用名称。');
    if (dependency && id.length>120) return failure('appid 最多 120 字。');
    if (!dependency && (!id || id.length>120)) return failure('请填写 1 至 120 字的'+type.identifier+'。');
    if (!dependency && typeof input.enabled!=='boolean') return failure('请选择启用状态。');
    try {
      const {bytes,rows} = read();
      const previous = rows.find(row => row.tenantId===tenantId && row.type===type.key);
      if (previous && !canEdit(context,tenant,previous)) return failure('当前账号没有此配置的编辑权限。');
      if (isAgent(type.key) && previous && hasInterfaceReference(previous) && id!==previous.id) {
        return failure('此智能体已关联百炼接口，请重新选择接口后保存。');
      }
      if (Object.hasOwn(input,'expected') && input.expected!==(previous?.updatedAt || '')) {
        return failure('应用配置已变化，请重新打开后保存。');
      }
      const scope = scopeInput(input,previous,tenant,options);
      if (!scope.ok) return scope;
      const remaining = rows.filter(row=>row!==previous);
      const next = {...previous,...scope.value,tenantId,type:type.key,id,name,updatedAt:new Date().toISOString()};
      if (dependency) delete next.enabled;
      else next.enabled = input.enabled;
      if (dependency && previous && scenarioRevision(previous)!==scenarioRevision(next)) {
        const impact = dependencyReferences(context,tenantId,dependencyKey(previous));
        if (!impact.ok) return impact;
        if (impact.rows.length && input.confirmReferences!==true) return {ok:false,requiresConfirmation:true,
          references:impact.rows,message:'应用标识或适用范围变更将使已有业务关联待核对，请确认影响后保存。'};
      }
      const conflict = scopeConflict(remaining,next,options);
      if (conflict) return failure(conflictMessage(conflict));
      if (duplicateAgentId(remaining,[next],options)) return failure(duplicateAgentMessage);
      if (localStorage.getItem(storageKey)!==bytes) return failure('应用配置已变化，请重新打开后保存。');
      persist([...remaining,next]);
      return {ok:true,value:publicRow(context,tenant,next,options,[...remaining,next])};
    } catch (_) {
      return failure('应用配置尚未保存，请稍后重试。');
    }
  }

  function dependencies(context,tenantId) {
    const result = list(context,tenantId);
    return result.ok ? {ok:true,rows:result.rows.filter(isDependency).map(row=>({...row,key:dependencyKey(row)}))} : result;
  }

  function canWriteDependencies(context,tenantId) {
    return window.DSession.canWrite('PAGE-2220') && tenants(context).some(tenant=>tenant.id===tenantId);
  }

  function canWriteScenarioBindings(context,tenantId = context?.scope?.id) {
    const current = currentContext(context);
    if (!current || current.scope.kind!=='tenant' || current.scope.id!==tenantId ||
        current.scope.tenant?.enabled!==true || !current.scope.tenant.brandId) return false;
    return canWriteDependencies(context,tenantId) ||
      ['hq_admin','store_admin'].includes(window.DSession.roleKey(current)) &&
      window.DSkynetConfig?.canManage?.(current) === true && window.DSession.canWrite('PAGE-2006',current);
  }

  function dependencyInput(input) {
    const name = text(input?.name), id = text(input?.id), interfaceName = text(input?.interfaceName);
    const interfaceUrl = text(input?.interfaceUrl), remarks = text(input?.remarks);
    const appSecret = typeof input?.appSecret==='string' ? input.appSecret : '';
    const hasScenario = Object.hasOwn(input,'applicationScenario');
    const applicationScenario = text(input.applicationScenario);
    if (hasScenario && !dependencyScenarios.includes(applicationScenario)) return failure('请选择有效的应用场景。');
    if (!name || name.length>60) return failure('请填写 1 至 60 字的应用名称。');
    if (id.length>120) return failure('appid 最多 120 字。');
    if (interfaceName.length>100 || interfaceUrl.length>500 || remarks.length>300 || appSecret.length>200) {
      return failure('接口名称、接口地址、备注或 appsecret 超出长度限制。');
    }
    if (interfaceUrl) {
      try {
        const url = new URL(interfaceUrl);
        if (!['http:','https:'].includes(url.protocol) || url.username || url.password) throw Error();
      } catch (_) {
        return failure('请输入有效的 HTTP 或 HTTPS 接口地址。');
      }
    }
    return {ok:true,values:{name,id,interfaceName,interfaceUrl,remarks,...(hasScenario ? {applicationScenario} : {})},appSecret};
  }

  async function dependencySecret(secret) {
    const hex = bytes => Array.from(bytes,byte=>byte.toString(16).padStart(2,'0')).join('');
    const salt = hex(window.crypto.getRandomValues(new Uint8Array(16)));
    const digest = await window.crypto.subtle.digest('SHA-256',new TextEncoder().encode(salt+':'+secret));
    return salt+':'+hex(new Uint8Array(digest));
  }

  function findDependency(rows,tenantId,key) {
    return rows.find(row=>row.tenantId===tenantId && isDependency(row) && dependencyKey(row)===key);
  }

  function writeDependency(context,tenantId,state,previous,value) {
    if (!canWriteDependencies(context,tenantId)) return failure('当前账号没有此租户的应用配置权限。');
    if (localStorage.getItem(storageKey)!==state.bytes) return failure('应用配置已变化，请重新打开后保存。');
    const rows = state.rows.filter(row=>row!==previous);
    if (value) rows.push(value);
    persist(rows);
    return {ok:true};
  }

  async function saveDependency(context,input={}) {
    const {tenantId,key,expected} = input;
    if (!canWriteDependencies(context,tenantId)) return failure('当前账号没有此租户的应用配置权限。');
    const checked = dependencyInput(input);
    if (!checked.ok) return checked;
    try {
      const state = read();
      const options = applicableOptions(context), tenant = options.tenants.find(row=>row.id===tenantId);
      const previous = findDependency(state.rows,tenantId,key);
      if (!tenant || previous && !canEdit(context,tenant,previous)) return failure('当前账号没有此配置的编辑权限。');
      if (expected!==(previous?.updatedAt || '') ||
          key && !previous && !dependencyTypes.some(type=>type.key===key)) {
        return failure('应用配置已变化，请重新打开后保存。');
      }
      const scope = scopeInput(input,previous,tenant,options);
      if (!scope.ok) return scope;
      let secretVerifier = previous?.secretVerifier;
      if (text(checked.appSecret)) secretVerifier = await dependencySecret(checked.appSecret);
      const value = {...previous,...checked.values,...scope.value,tenantId,type:previous?.type || key || additionalDependency,
        secretVerifier,updatedAt:new Date().toISOString()};
      delete value.enabled;
      if (value.type===additionalDependency && !previous) value.recordId = 'dep-'+window.crypto.randomUUID();
      const latestOptions = applicableOptions(context), latestTenant = latestOptions.tenants.find(row=>row.id===tenantId);
      if (!latestTenant || previous && !canEdit(context,latestTenant,previous)) return failure('当前账号没有此配置的编辑权限。');
      const checkedScope = scopeInput(value,previous,latestTenant,latestOptions);
      if (!checkedScope.ok) return checkedScope;
      if (previous && scenarioRevision(previous)!==scenarioRevision(value)) {
        const impact = dependencyReferences(context,tenantId,key);
        if (!impact.ok) return impact;
        if (impact.rows.length && input.confirmReferences!==true) return {ok:false,requiresConfirmation:true,
          references:impact.rows,message:'接口、凭证、场景或适用范围变更将使已有业务关联待核对，请确认影响后保存。'};
      }
      const conflict = scopeConflict(state.rows.filter(row=>row!==previous),value,latestOptions);
      if (conflict) return failure(conflictMessage(conflict));
      return writeDependency(context,tenantId,state,previous,value);
    } catch (_) {
      return failure('应用配置尚未保存，请稍后重试。');
    }
  }

  function deleteDependency(context,{tenantId,key,expected} = {}) {
    if (!canWriteDependencies(context,tenantId)) return failure('当前账号没有此租户的应用配置权限。');
    try {
      const state = read();
      const previous = findDependency(state.rows,tenantId,key);
      if (!previous || expected!==previous.updatedAt) return failure('应用配置已变化，请重新打开后操作。');
      const tenant = tenants(context).find(row=>row.id===tenantId);
      if (!tenant || !canEdit(context,tenant,previous)) return failure('当前账号没有此配置的编辑权限。');
      const impact = dependencyReferences(context,tenantId,key);
      if (!impact.ok) return impact;
      if (impact.rows.length) return failure('此应用仍被 '+impact.rows.length+' 处配置引用，请先解除引用。');
      return writeDependency(context,tenantId,state,previous,null);
    } catch (_) {
      return failure('应用配置尚未删除，请稍后重试。');
    }
  }

  function bindings(context, tenantId) {
    const result = list(context,tenantId);
    if (!result.ok) return result;
    const rows = result.rows.filter(row=>isAgent(row.type));
    return {ok:true,rows,revision:JSON.stringify(rows)};
  }

  function saveBindings(context, {tenantId,changes,expected} = {}) {
    const options = applicableOptions(context), tenant = options.tenants.find(row=>row.id===tenantId);
    if (!window.DSession.canWrite('PAGE-2220') || !tenant) {
      return failure('当前账号没有此租户的智能体配置权限。');
    }
    const updates = Object.entries(changes || {});
    if (!updates.length) return failure('请选择需要配置的阿里百炼接口。');
    if (updates.some(([type,input])=>!isAgent(type) || !input || typeof input!=='object' ||
        typeof input.interfaceKey!=='string' || Object.hasOwn(input,'id') ||
        Object.hasOwn(input,'enabled') && typeof input.enabled!=='boolean')) {
      return failure('请从阿里百炼接口目录选择接口，不支持手工填写 appid。');
    }
    if (updates.some(([,input])=>Object.hasOwn(input,'name') && (!text(input.name) || text(input.name).length>60))) {
      return failure('请填写 1 至 60 字的智能体名称。');
    }
    if (updates.some(([,input])=>text(input.remarks).length>300)) return failure('备注最多 300 字。');
    try {
      const {bytes,rows} = read();
      const previous = rows.filter(row=>row.tenantId===tenantId && isAgent(row.type));
      const visible = listRows(context,tenant,rows,options).filter(row=>isAgent(row.type));
      if (expected!==JSON.stringify(visible) || localStorage.getItem(storageKey)!==bytes) {
        return failure('智能体配置已变化，请重新打开后保存。');
      }
      const now = new Date().toISOString();
      const next = previous.filter(row=>!updates.some(([type])=>type===row.type));
      const directory=interfaceDirectory(rows,tenant,options);
      for (const [type,input] of updates) {
        const interfaceKey = text(input.interfaceKey);
        const old = previous.find(row=>row.type===type);
        if (old && !canEdit(context,tenant,old) || visible.find(row=>row.type===type)?.editable===false) {
          return failure('当前账号没有此智能体的编辑权限。');
        }
        if (!interfaceKey) {
          if (!old) return failure('请选择阿里百炼接口。');
          continue;
        }
        if (input.interfaceKey!==interfaceKey || input.expectedInterfaceRevision!==directory.revision) {
          return failure('阿里百炼接口目录已变化，请重新读取后选择。');
        }
        const selected=resolveInterface(rows,interfaceKey,tenant);
        if (!selected) return failure('所选阿里百炼接口不存在、配置无效或不适用于当前租户。');
        const name = text(input.name) || old?.name || typeFor(type).label;
        const enabled = Object.hasOwn(input,'enabled') ? input.enabled : true;
        const remarks = Object.hasOwn(input,'remarks') ? text(input.remarks) : old?.remarks;
        const scope = scopeInput(input,old,tenant,options);
        if (!scope.ok) return scope;
        const sourceBrands=hasScope(selected)?selected.brandIds:[tenant.brandId];
        const sourceTenants=hasScope(selected)?selected.tenantIds:[selected.tenantId];
        if (scope.value.brandIds.some(id=>!sourceBrands.includes(id)) ||
            scope.value.tenantIds.some(id=>!sourceTenants.includes(id))) {
          return failure('智能体适用品牌和租户不能超出所选百炼接口的适用范围。');
        }
        next.push({...scope.value,tenantId,type,id:text(selected.id) || interfaceKey,name,enabled,remarks,
          interfaceKey,interfaceName:selected.interfaceName,interfaceAppId:text(selected.id),
          interfaceApplicationName:selected.name,updatedAt:now});
      }
      const remaining = rows.filter(row=>!previous.includes(row));
      const changed = next.filter(row=>updates.some(([type])=>type===row.type));
      for (const row of changed) {
        const conflict = scopeConflict(remaining,row,options);
        if (conflict) return failure(conflictMessage(conflict));
      }
      const combined = [...remaining,...next];
      if (duplicateAgentId(combined,changed,options)) return failure(duplicateAgentMessage);
      if (localStorage.getItem(storageKey)!==bytes) return failure('智能体或接口配置已变化，请重新打开后保存。');
      persist(combined);
      return {ok:true,rows:listRows(context,tenant,combined,options).filter(row=>isAgent(row.type))};
    } catch (_) {
      return failure('智能体配置尚未保存，请稍后重试。');
    }
  }

  // Registrations are intentionally not part of built-in binding resolution.
  const customAgentStorageKey = window.DSession.prefix + 'custom-agent-registrations-v1';
  const customAgentId = /^custom-agent-[a-f0-9-]{36}$/;
  function readCustomAgents() {
    const bytes = localStorage.getItem(customAgentStorageKey);
    if (bytes===null) return {bytes,rows:[]};
    const data=JSON.parse(bytes);
    const rows=data?.rows;
    if (data?.version!==1 || !Array.isArray(rows) || rows.some(row=>
      !row || !customAgentId.test(row.id) || !text(row.tenantId) || !text(row.name) ||
      row.name.length>60 || typeof row.remarks!=='string' || row.remarks.length>300 ||
      !text(row.interfaceKey) || typeof row.interfaceName!=='string' ||
      !validIds(row.brandIds) || !validIds(row.tenantIds)) ||
      new Set(rows.map(row=>row.id)).size!==rows.length) throw Error('Invalid custom agent data');
    return {bytes,rows};
  }

  function customAgentView(context,tenant,options,state,dependencies) {
    const global=managementScope(context)?.global;
    const rows=state.rows.filter(row=>applies(row,tenant) || global && row.tenantId===tenant.id).map(row=>{
      const scope=options.tenants.filter(target=>applies(row,target));
      const source=resolveInterface(dependencies,row.interfaceKey,tenant);
      return {id:row.id,name:row.name,remarks:row.remarks,interfaceKey:row.interfaceKey,
        interfaceName:source?.interfaceName || row.interfaceName,interfaceAvailable:Boolean(source),
        brandIds:[...new Set(scope.map(target=>target.brandId))],tenantIds:scope.map(target=>target.id),
        editable:canEdit(context,tenant,row) && window.DSession.canWrite('PAGE-2220')};
    });
    return {ok:true,rows,revision:'custom-agent-v1:'+fingerprint(state.bytes)};
  }

  function customAgents(context,tenantId) {
    const options=applicableOptions(context),tenant=options.tenants.find(row=>row.id===tenantId);
    if (!tenant) return failure('当前账号没有此租户的自定义智能体查看权限。');
    try { return customAgentView(context,tenant,options,readCustomAgents(),read().rows); }
    catch (_) { return failure('自定义智能体暂时无法读取。'); }
  }

  function saveCustomAgent(context, {tenantId,recordId,expected,input}={}) {
    const options=applicableOptions(context),tenant=options.tenants.find(row=>row.id===tenantId);
    if (!tenant || !window.DSession.canWrite('PAGE-2220')) return failure('当前账号没有此租户的自定义智能体配置权限。');
    if (!input || typeof input!=='object' || !text(input.name) || text(input.name).length>60)
      return failure('请填写 1 至 60 字的智能体名称。');
    if (text(input.remarks).length>300) return failure('备注最多 300 字。');
    const interfaceKey=text(input.interfaceKey);
    if (!interfaceKey || interfaceKey!==input.interfaceKey || Object.hasOwn(input,'appId') || Object.hasOwn(input,'id'))
      return failure('请选择已登记的阿里百炼接口，不支持手填 App ID。');
    try {
      const state=readCustomAgents(), dependencies=read(), sourceRows=dependencies.rows;
      if (expected!=='custom-agent-v1:'+fingerprint(state.bytes))
        return failure('自定义智能体配置已变化，请重新打开后保存。');
      const previous=recordId===undefined ? null : state.rows.find(row=>row.id===recordId);
      if (recordId!==undefined && (!previous || !canEdit(context,tenant,previous)))
        return failure('当前账号没有此自定义智能体的编辑权限。');
      const directory=interfaceDirectory(sourceRows,tenant,options);
      if (input.expectedInterfaceRevision!==directory.revision)
        return failure('阿里百炼接口目录已变化，请重新读取后选择。');
      const source=resolveInterface(sourceRows,interfaceKey,tenant);
      if (!source) return failure('所选阿里百炼接口不存在、配置无效或不适用于当前租户。');
      const scope=scopeInput(input,previous,tenant,options);
      if (!scope.ok) return scope;
      const targets=options.tenants.filter(target=>scope.value.tenantIds.includes(target.id));
      if (targets.some(target=>resolveInterface(sourceRows,interfaceKey,target)!==source) ||
          scope.value.brandIds.some(id=>!targets.some(target=>target.brandId===id)))
        return failure('智能体适用品牌和租户不能超出所选百炼接口的适用范围。');
      const id=previous?.id || 'custom-agent-'+window.crypto.randomUUID();
      if (!previous && state.rows.some(row=>row.id===id)) return failure('未能生成智能体标识，请重试。');
      const row={...scope.value,id,tenantId:tenant.id,name:text(input.name),remarks:text(input.remarks),
        interfaceKey,interfaceName:source.interfaceName};
      const rows=previous ? state.rows.map(item=>item===previous?row:item) : [...state.rows,row];
      if (localStorage.getItem(customAgentStorageKey)!==state.bytes || localStorage.getItem(storageKey)!==dependencies.bytes)
        return failure('自定义智能体或接口配置已变化，请重新打开后保存。');
      localStorage.setItem(customAgentStorageKey,JSON.stringify({version:1,rows}));
      return {ok:true,id};
    } catch (_) { return failure('自定义智能体尚未保存，请稍后重试。'); }
  }

  window.DIntegrationApplications = Object.freeze({
    types,agentTypes,status,list,save,tenants,applicableOptions,bindings,saveBindings,bailianInterfaces,customAgents,saveCustomAgent,
    dependencyTypes,dependencyScenarios,dependencyScenario,dependencies,canWriteDependencies,saveDependency,deleteDependency,
    scenarioApplications,resolveScenarioApplication,scenarioBindings,saveScenarioBindings,resolveScenarioBinding,canWriteScenarioBindings,
    dependencyReferences,recordScenarioCall,scenarioCalls,
    canManage:context => Boolean(managementScope(context)),
    isGlobal:context => managementScope(context)?.global === true
  });
})();
