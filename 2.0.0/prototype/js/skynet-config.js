(() => {
  'use strict';

  const fixture = window.DSkynetIntakeFixtures;
  const copy = value => structuredClone(value);
  const text = value => typeof value === 'string' ? value.trim() : '';
  const catalog = {rules:'分配规则', nurtureTemplates:'培育模板', deliveryTemplates:'下发模板'};
  const idPrefixes = {rules:'TW-RULE-', nurtureTemplates:'TW-NURTURE-', deliveryTemplates:'TW-DELIVERY-'};
  const intakeFields = fixture.fields;
  const defaultRequiredFields = Object.freeze(intakeFields.filter(field => field.required).map(field => field.key));
  const historySources = [{value:'demo-history',label:'外部历史系统（模拟）'}];
  const historyLookupFields = [
    {value:'originalKey',label:'来源线索编号'}, {value:'phone',label:'手机号码'}
  ];
  const defaultExternalQuery = Object.freeze({sourceId:'demo-history',lookupField:'originalKey'});
  const importTypes = {
    text:'text',textarea:'text',number:'number',date:'date',datetime:'datetime-local',
    select:'select',multiselect:'multiselect'
  };
  const leadFields = intakeFields.filter(field =>
    ['dealer','series','channel','rChannel','leadStatus','leadAt','smartCode','projectName'].includes(field.key));
  const relatedFields = [
    {key:'result',label:'回访结果',type:'text'},
    {key:'intentLevel',label:'意向等级',type:'select',options:['A','B','C','D'].map(value => ({value,label:value}))},
    {key:'callStatus',label:'通话状态',type:'select',options:['已接通','未接听','未接通'].map(value => ({value,label:value}))},
    {key:'tags',label:'通话标签',type:'text'}
  ];
  function related(prefix, label) {
    return relatedFields.map(field => ({...field,key:prefix + '.' + field.key,label:label + field.label}));
  }
  const historyFields = related('history','历史');
  const previousFields = related('previous','上一轮');
  const previousCallTags = previousFields.find(field => field.key === 'previous.tags');
  const previousCallTagLabels = {
    'AI 外呼':'上一轮 AI 通话标签',
    '人工外呼':'上一轮人工通话标签',
    '预外呼':'上一轮预外呼标签'
  };
  function previousCallTagField(method) {
    if (!method) return previousCallTags;
    return Object.hasOwn(previousCallTagLabels,method) ? {...previousCallTags,label:previousCallTagLabels[method]} : null;
  }

  const roundCompleteEvent = '本轮培育完成';
  const legacyRoundEvents = ['回访完成','当前轮完成'];
  const roundFields = [
    {key:'round.number',label:'刚完成的是第几轮',type:'number',legacy:true},
    {key:'round.callStatus',label:'本轮通话状态',type:'select',options:relatedFields.find(field => field.key === 'callStatus').options},
    {key:'round.result',label:'本轮回访结果',type:'text'},
    {...leadFields.find(field => field.key === 'leadStatus'),key:'round.leadStatus',label:'本轮线索状态'},
    {key:'round.intentLevel',label:'本轮意向等级',type:'select',options:['H','A','B','C','D','E','F','L','N'].map(value => ({value,label:value}))}
  ];
  const preRatingField = Object.freeze({key:'preRating',label:'预评级',type:'text'});
  const fields = [...leadFields,...historyFields,...previousFields,...roundFields,preRatingField];
  const operators = [
    {value:'equal',label:'等于'}, {value:'notEqual',label:'不等于'}, {value:'contains',label:'包含'},
    {value:'greater',label:'大于'}, {value:'less',label:'小于'},
    {value:'before',label:'早于'}, {value:'after',label:'晚于'},
    {value:'hasValue',label:'有值',unary:true}, {value:'isEmpty',label:'无值',unary:true}
  ];
  const preRatingOperators = ['greater','less','equal'].map(key=>operators.find(operator=>operator.value===key));
  const demoRatingRanks = new Map([['A',2],['B',1]]);
  const events = ['接入后',roundCompleteEvent];
  const actions = ['AI 外呼','预外呼','人工外呼','企微培育','不经培育直接下发','继续','进入下发判断','转冷线索','结束培育','转待处理'];
  const deliveryActions = Object.freeze(['进入下发判断','不经培育直接下发']);
  const nurtureStrategyActions = ['AI 外呼','预外呼','人工外呼','企微培育'];
  const nurtureFallbackActions = [...nurtureStrategyActions,'结束培育'];
  const entryFallbackActions = [...nurtureFallbackActions,'转冷线索','不经培育直接下发','转待处理'];
  const unlimitedStrategyField = Object.freeze({key:'unlimited',label:'不限'});
  const outboundFields = Object.freeze({
    'AI 外呼':Object.freeze({id:'aiTaskId',reference:'aiTask'}),
    '预外呼':Object.freeze({id:'predictiveTaskId',reference:'predictiveTask'})
  });
  const manualAssignmentStrategies = [
    {value:'leastLoad',label:'当前负载最少'}, {value:'leastDaily',label:'当日接待量最少'},
    {value:'roundRobin',label:'轮询'}, {value:'highestScore',label:'按坐席评分'}
  ];
  const manualAssignmentFilters = [
    {value:'leastLoad',label:'当前负载最少'}, {value:'leastDaily',label:'当日接待量最少'},
    {value:'highestScore',label:'评分最高'}, {value:'random',label:'随机分配'}
  ];
  const branchActions = ['继续','结束','过滤','转待处理','保留待匹配','送入培育模板'];
  const branchStatuses = {'结束':'已结束','过滤':'已过滤','转待处理':'待处理','保留待匹配':'待匹配','送入培育模板':'已匹配'};
  const cleaningRoutes = [
    {value:'sameNumber',label:'进入在途任务过滤'}, {value:'stop',label:'直接过滤并结束'}
  ];
  const sameNumberWindows = [
    ...[5,10,15,30,60,90,120].map(minutes => ({value:String(minutes),label:minutes + ' 分钟'})),
    {value:'1440',label:'1 天'}, {value:'4320',label:'3 天'}
  ];
  const sameNumberActions = [
    {value:'firstOnly',label:'首条生成培育任务，其余关联同一任务'},
    {value:'all',label:'每条独立的同号线索均可生成培育任务'}
  ];
  const deliveryTypes = Object.freeze([
    {value:'intent',label:'意向下发'},
    {value:'lowQuality',label:'低质线索下发'}
  ].map(Object.freeze));
  const deliveryConditionFields = Object.freeze(['intentLevel','callStatus','result'].map(
    key => fields.find(field => field.key === 'round.' + key)));
  const deliveryModes = Object.freeze([
    {value:'oneToOne',label:'1 发 1'},
    {value:'oneToMany',label:'1 发多'}
  ].map(Object.freeze));
  const legacyDeliveryModes = Object.freeze([
    {value:'intentStore',label:'按意向门店下发'},
    {value:'nearestCity',label:'按最近城市下发'},
    {value:'oneToThree',label:'一发三'}
  ].map(Object.freeze));
  const deliveryHandlingDefaults = {
    auditEnabled:true,deliveryTargetType:'internalTenant',deliveryTargetId:'',deliveryMode:'oneToOne'
  };
  const deliveryHandlingKeys = [...Object.keys(deliveryHandlingDefaults),'application'];
  const deliveryTargetTypes = ['internalTenant','externalSystem'];
  const defaultDeliveryCriteria = () => ({intent:[],lowQuality:[]});
  const defaultDeliveryMapping = () => [
    {source:'originalKey',target:'线索编号'},
    {source:'name',target:'客户姓名'},
    {source:'phone',target:'手机号码'}
  ];
  const defaultNurtureId = fixture.templates['1.0'].nurtureTemplateId;
  const defaultDeliveryId = fixture.templates['1.0'].deliveryTemplateId;
  const defaultRuleId = 'TW-RULE-REVIEW';
  const builtInTypes = [{value:fixture.categoryId,label:fixture.category},{value:'review21-retention',label:'留资线索'}];
  const builtInFamilies = [{id:'LEAD',label:'线索'},{id:'ORDINARY',label:'普通业务'}];
  const excludedTypeIds = new Set(['review21-sanwu','review21-unfilled']);
  const excludedTypeNames = new Set(['三无忧','留资未满']);

  function defaultCleaning(categoryId = fixture.categoryId) {
    return {
      logic:'and',conditions:[],onMatch:'sameNumber',onMismatch:'stop',
      sameNumber:{windowMinutes:30,matchAction:'firstOnly'},
      nurtureTemplateId:categoryId === fixture.categoryId ? defaultNurtureId : ''
    };
  }

  function defaultNodes(categoryId = fixture.categoryId) {
    return fixture.nodes.map(node => ({
      ...copy(node),
      ...(node.id === 'fields' ? {checks:[]} : {}),
      ...(node.id === 'externalHistory' ? {externalQuery:{...defaultExternalQuery}} : {}),
      branches:Object.fromEntries(Object.entries(node.branches).map(([key, source]) => {
        const {next, ...branch} = source;
        if (branch.action === '送入培育模板') branch.nurtureTemplateId = categoryId === fixture.categoryId ? defaultNurtureId : '';
        return [key,branch];
      }))
    }));
  }

  function legacyDefaultBook() {
    const standard = {categoryId:fixture.categoryId,version:'1.0',isCurrent:true};
    const nurture = {
      ...standard,id:defaultNurtureId,name:'天网人工培育',deliveryTemplateId:defaultDeliveryId,
      rules:[{event:'接入后',logic:'and',conditions:[],actions:['人工外呼']}]
    };
    return {
      rules:[{...standard,id:defaultRuleId,name:'天网来件分配规则',nodes:defaultNodes()}],
      nurtureTemplates:[nurture,{...copy(nurture),version:'1.1',isCurrent:false,legacyExample:true}],
      deliveryTemplates:[{
        ...standard,id:defaultDeliveryId,name:'天网下发模板',
        modes:legacyDeliveryModes.map(mode => mode.value),mapping:defaultDeliveryMapping()
      }]
    };
  }

  function validBook(book) {
    return !!book && Object.keys(catalog).every(kind => Array.isArray(book[kind]));
  }

  function upgradeDefaultBook(book) {
    const replacements = {
      rules:{id:defaultRuleId,name:'天网来件分配规则',build(row) {
        const {nodes,...base} = row;
        return {...base,cleaning:defaultCleaning(),inTransitFilter:true};
      }},
      nurtureTemplates:{id:defaultNurtureId,name:'天网人工培育',build(row) {
        return {...row,strategyTree:true,roundFlow:true,outboundTargetBinding:true,
          rules:[{id:defaultNurtureId + '-entry',name:'接入后人工外呼',event:'接入后',logic:'and',
            conditions:[{field:unlimitedStrategyField.key}],actions:['人工外呼'],
            manualAssignment:{filterSteps:[],scores:{}},fallback:false,children:[]}]};
      }},
      deliveryTemplates:{id:defaultDeliveryId,name:'天网下发模板',build(row) {
        const intent = value => [{logic:'and',conditions:[{field:'round.intentLevel',operator:'equal',value}]}];
        return {...row,criteria:{intent:intent('A'),lowQuality:intent('F')},
          modes:deliveryModes.map(mode => mode.value),deliveryMode:'oneToOne',
          auditEnabled:true,deliveryTargetType:'internalTenant'};
      }}
    };
    for (const [kind,{id,name,build}] of Object.entries(replacements)) {
      const prior = book[kind].find(row => row.id === id && row.version === '1.0' && row.isCurrent &&
        row.name === name && row.categoryId === fixture.categoryId && !row.savedAt && !row.savedBy &&
        row.enabled !== false && !row.deletedAt && !row.requiresReview && !modernConfiguration(kind,row));
      if (!prior) continue;
      const upgraded = build(copy(prior));
      prior.isCurrent = false;
      book[kind].push({...upgraded,isCurrent:true,enabled:true,version:nextVersion(book,kind,prior.id)});
    }
    return book;
  }

  function needsLegacyDefaultBook(state) {
    const records = (state?.records || []).map(record => record.skynet);
    return [...records,...(state?.skynetReceipts || [])].some(binding => binding && (
      binding.assignmentRuleId === defaultRuleId && binding.assignmentRuleVersion === '1.0' ||
      binding.taskAssignmentRuleId === defaultRuleId && binding.taskAssignmentRuleVersion === '1.0' ||
      binding.nurtureTemplateId === defaultNurtureId && ['1.0','1.1'].includes(binding.nurtureTemplateVersion) ||
      binding.matchedTemplateId === defaultNurtureId && ['1.0','1.1'].includes(binding.matchedTemplateVersion) ||
      binding.deliveryTemplateId === defaultDeliveryId && binding.deliveryTemplateVersion === '1.0' ||
      binding.matchedDeliveryTemplateId === defaultDeliveryId && binding.matchedDeliveryTemplateVersion === '1.0'));
  }

  function read(state) {
    if (state?.skynetConfig === undefined) {
      const book = upgradeDefaultBook(legacyDefaultBook());
      if (needsLegacyDefaultBook(state)) return book;
      return Object.fromEntries(Object.keys(catalog).map(kind => [kind,list(book,kind)]));
    }
    return validBook(state.skynetConfig)
      ? upgradeDefaultBook(copy(state.skynetConfig))
      : {rules:[],nurtureTemplates:[],deliveryTemplates:[]};
  }

  function list(book, kind) {
    return (book?.[kind] || []).filter(row => row.isCurrent && !row.deletedAt);
  }

  function configurationStatus(row) {
    if (['enabled','disabled','draft'].includes(row?.status)) return row.status;
    return row?.enabled === false ? 'disabled' : 'enabled';
  }

  function activeList(book, kind) {
    return list(book,kind).filter(row => configurationStatus(row) === 'enabled' && modernConfiguration(kind,row));
  }

  function modernConfiguration(kind, row) {
    if (kind === 'rules') return Boolean(row.cleaning);
    if (kind === 'nurtureTemplates') return row.strategyTree === true;
    return isDeliveryTemplateConfigured(row);
  }

  function isDeliveryTemplateConfigured(template) {
    return Boolean(template?.criteria && deliveryTypes.every(({value}) => {
      const defaults = Boolean(template.handlingByKind) && !template.criteria[value]?.length && !template.aiCriteria?.[value]?.length;
      const handling = deliveryHandling(template,value,{defaults});
      return typeof handling.auditEnabled === 'boolean' && deliveryTargetTypes.includes(handling.deliveryTargetType) &&
        deliveryModes.some(mode => mode.value === handling.deliveryMode);
    }));
  }

  function current(book, kind, id) {
    return list(book, kind).find(row => !id || row.id === id);
  }

  function version(book, kind, id, number) {
    return book?.[kind]?.find(row => row.id === id && row.version === String(number));
  }

  function ruleFor(book, categoryId) {
    const matches = rulesForCategory(book,categoryId);
    return matches.length === 1 ? matches[0] : undefined;
  }

  function rulesForCategory(book,categoryId) {
    return categoryId ? activeList(book,'rules').filter(row => row.categoryId === categoryId && availableRule(book,row)) : [];
  }

  function availableRule(book, rule) {
    const {onMatch,onMismatch,nurtureTemplateId} = rule.cleaning;
    if (![onMatch,onMismatch].includes('sameNumber')) return true;
    const template = activeList(book,'nurtureTemplates').find(row =>
      row.id === nurtureTemplateId && row.categoryId === rule.categoryId);
    return Boolean(template && activeList(book,'deliveryTemplates').some(row =>
      row.id === template.deliveryTemplateId && row.categoryId === rule.categoryId));
  }

  function ruleById(book,id,categoryId) {
    if (!id) return undefined;
    return activeList(book,'rules').find(row => row.id === id && availableRule(book,row) &&
      (categoryId === undefined || row.categoryId === categoryId));
  }

  function coldRules(book) {
    return rulesForCategory(book,'lxs');
  }

  function coldRule(book,id) {
    return id ? coldRules(book).find(rule => rule.id === id) : undefined;
  }

  function matchesScope(actual, context) {
    return Boolean(actual?.scope?.kind === 'tenant' && context?.scope?.kind === 'tenant' &&
      actual.account?.id && actual.account.id === context.account?.id && actual.scope.id === context.scope.id &&
      actual.scope.tenant?.brandId && actual.scope.tenant.brandId === context.scope.tenant?.brandId);
  }

  function tenantContext(context) {
    const actual = window.DSession.context();
    return matchesScope(actual,context) && window.DRolePermissions.moduleEnabled('cloud',actual) ? actual : null;
  }

  function manager(context) {
    const actual = tenantContext(context);
    const session = window.DSession;
    if (!actual || !session.can('F18',actual) || !session.allowed('PAGE-2006',actual)) return null;
    const role = session.roleKey(actual);
    const authorizedSuper = role === 'super' && session.isGlobalAdministrator?.(actual) === true &&
      session.platformAuthority?.(actual)?.tenantIds?.includes(actual.scope.id);
    if (!/_admin$/.test(role) && !authorizedSuper) return null;
    return actual;
  }

  function deliveryTargetOptions(context, type) {
    const actual = tenantContext(context);
    if (!actual) return [];
    if (type === 'internalTenant') {
      return (window.DOrganization?.deliveryPeers?.('outgoing') || [])
        .filter(row => row.organization === (actual.scope.tenant.organization === '门店' ? '总部' : '门店'))
        .map(({id,name,organization}) => ({value:id,label:name + ' · ' + organization}));
    }
    if (type !== 'externalSystem') return [];
    const directory = window.DIntegrationApplications?.scenarioApplications(actual,'下发');
    return directory?.ok ? directory.rows.map(application => ({value:application.id,
      label:[application.name,application.interfaceName].filter(Boolean).join(' · '),application})) : [];
  }

  function scenarioApplication(context, scenario, id, snapshot) {
    if (!id || snapshot?.id && snapshot.id !== id) return null;
    const result = window.DIntegrationApplications?.resolveScenarioApplication(context,scenario,id,snapshot || {});
    return result?.ok && result.status === 'available' && result.application?.id === id ?
      copy(result.application) : null;
  }

  function resolveDeliveryTarget(context, type, id, snapshot) {
    if (type === 'externalSystem') {
      const application = scenarioApplication(context,'下发',id,snapshot);
      return application ? {id,label:application.name,type,application} : null;
    }
    const option = deliveryTargetOptions(context,type).find(item => item.value === id);
    return option ? {id:option.value,label:option.label,type} : null;
  }

  function knownTypes() {
    const types = window.DReview21DccFollowupFields?.leadCategories;
    return (types?.length ? types.map(([value,label]) => ({value,label})) : copy(builtInTypes))
      .filter(type => !excludedTypeIds.has(type.value) && !excludedTypeNames.has(type.label));
  }

  function categoryDirectory(context) {
    const actual = tenantContext(context);
    const session = window.DSession;
    const empty = {types:[],families:[]};
    if (!actual || !(session.allowed('PAGE-2006',actual) ||
        session.allowed('PAGE-2226',actual) && session.can('F26',actual))) return empty;
    const known = knownTypes();
    const host = window.DModuleHost;
    const native = window.document?.querySelector?.('iframe[data-native-module="cloud"]')?.contentWindow;
    if (!host?.isReady?.('cloud') || !matchesScope(actual,native?.DNativeContext?.context)) {
      return {types:known,families:builtInFamilies};
    }

    let directory;
    try {
      directory = host.currentCatalog();
    } catch (_) {
      return empty;
    }
    if (!directory?.ok || directory.brandId !== actual.scope.tenant.brandId || !Array.isArray(directory.rows)) return empty;

    const present = new Set(directory.rows.map(row => row?.id));
    const retired = new Set((directory.retiredTypes || []).map(entry => entry.row?.id));
    const usable = directory.rows.filter(row => row && row.enabled !== false && text(row.id) && text(row.label) &&
      !excludedTypeIds.has(row.id) && !excludedTypeNames.has(text(row.label)));
    const types = usable.map(row => ({value:row.id,label:text(row.label),row}));
    // The two demo categories are usable before their rows have been seeded in the brand catalog.
    return {
      types:[...types,...known.filter(type => !present.has(type.value) && !retired.has(type.value))],
      families:Array.isArray(directory.categoryFamilies) ? directory.categoryFamilies : builtInFamilies,
      model:native.CustomerBusiness,
      source:{tenantId:actual.scope.id,brandId:actual.scope.tenant.brandId,enterpriseId:actual.scope.tenant.enterpriseId}
    };
  }

  function businessTypes(context) {
    return categoryDirectory(context).types.map(({value,label}) => ({value,label}));
  }

  function fallbackFamilyId(row) {
    if (['lead','lxs','CAT-LEAD'].includes(row.id)) return 'LEAD';
    const id = row.familyId;
    if (typeof id === 'string' && /^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/.test(id) &&
        !['__proto__','prototype','constructor'].includes(id)) return id;
    return row.businessFamily === 'LEAD' || row.family === 'LEAD' ? 'LEAD' : 'ORDINARY';
  }

  function categoryTree(context,{includeEmpty = false} = {}) {
    const {types,families,model} = categoryDirectory(context);
    const groups = new Map(families.filter(family => text(family?.id) && text(family?.label))
      .map(({id,label}) => [id,{value:id,label,children:[]}]));
    const added = new Set();
    for (const {value,label,row} of types) {
      if (added.has(value)) continue;
      added.add(value);
      const familyId = row ? model?.familyId?.(row) || fallbackFamilyId(row) : 'LEAD';
      if (!groups.has(familyId)) {
        const family = builtInFamilies.find(item => item.id === familyId);
        groups.set(familyId,{value:familyId,label:family?.label || '一级分类待核',children:[]});
      }
      groups.get(familyId).children.push({value,label});
    }
    return [...groups.values()].filter(group => includeEmpty || group.children.length);
  }

  function businessType(context, id) {
    return businessTypes(context).find(type => type.value === id);
  }

  function mappedImportField(field, definitions, categoryId) {
    const keys = field.key === 'originalKey'
      ? categoryId === 'review21-retention' ? ['clueid','hclueid','originalKey'] : ['hclueid','clueid','originalKey']
      : [field.businessKey,field.key];
    for (const key of keys) {
      const definition = definitions.find(item => item?.businessKey === key && item.enabled !== false &&
        Object.hasOwn(importTypes,item.type));
      if (definition) return definition;
    }
  }

  function importOptions(field) {
    if (!Array.isArray(field.options)) return [];
    return field.options.filter(option => option && option.enabled !== false).flatMap(option => {
      const value = text(option.businessKey) || text(option.id);
      const label = text(option.label) || value;
      const aliases = [...new Set([text(option.id),text(option.businessKey),label].filter(Boolean))];
      return value ? [{value,label,aliases}] : [];
    });
  }

  function applyImportMetadata(field, definition) {
    const {options,...base} = field;
    const imported = importTypes[definition.type];
    const type = field.type === 'phone' && imported === 'text' ? 'phone' : imported;
    return {
      ...base,label:text(definition.label) || field.label,type,
      sourceFieldId:text(definition.fieldId) || text(definition.id),
      sourceKey:text(definition.key) || text(definition.fieldId) || text(definition.id),
      required:field.key === 'originalKey' || definition.required === true,
      ...(['select','multiselect'].includes(type) ? {options:importOptions(definition)} : {})
    };
  }

  function intakeFieldProfile(context, categoryId) {
    const fallback = {fields:copy(intakeFields),sourceLabel:'天网模拟字段默认配置'};
    const {types,model,source} = categoryDirectory(context);
    if (!types.some(type => type.value === categoryId && type.row) || !model?.importSchema) return fallback;
    let schema;
    try {
      schema = model.importSchema(categoryId,source);
    } catch (_) {
      return fallback;
    }
    if (!schema?.ok || schema.scope?.brandId !== source.brandId || schema.scope.tenantId !== source.tenantId ||
        schema.category?.id !== categoryId || !Array.isArray(schema.fields)) return fallback;

    let mapped = 0;
    const fields = fallback.fields.map(field => {
      const definition = mappedImportField(field,schema.fields,categoryId);
      if (!definition) return field;
      mapped++;
      return applyImportMetadata(field,definition);
    });
    if (!mapped) return fallback;
    const sourceLabel = mapped === fields.length ? '业务分类导入字段配置' : '业务分类导入字段配置与演示默认字段';
    return {fields,sourceLabel};
  }

  function preRatingStatus(context, categoryId) {
    const actual = tenantContext(context);
    if (!actual) return {status:'unavailable',message:'请核对当前租户的应用接入权限。'};
    try {
      if (!categoryId) return {status:'unconnected',message:'请先选择业务分类并关联预评分应用。'};
      const result = window.DIntegrationApplications?.resolveScenarioBinding(actual,'预评分',categoryId);
      if (result?.ok && result.status === 'available') return {status:'connected',application:result.application};
      if (result) return {status:'unconnected',message:result.message || '请在业务分类的“场景应用”中关联预评分应用。'};
    } catch (_) { /* Keep configuration blocked while the directory cannot be verified. */ }
    return {status:'unavailable',message:'预评分应用状态暂不可用，请核对「应用接入」。'};
  }

  function nurtureConditionFields(event,context,categoryId) {
    const intake = intakeFieldProfile(context,categoryId).fields;
    const configuredLead = leadFields.map(field =>
      intake.find(candidate => candidate.key === field.key && candidate.sourceFieldId) || field);
    const definitions = followupConditions(context,categoryId);
    const currentRound = roundFields.map(field => {
      const semantic = {'round.result':'visitResult','round.intentLevel':'intentLevel','round.leadStatus':'leadStatus'}[field.key];
      const definition = semantic && definitions.get(semantic);
      if (definition) return choiceCondition(field,definition);
      const status = field.key === 'round.leadStatus' && configuredLead.find(item => item.key === 'leadStatus');
      return status ? {...status,key:field.key,label:field.label} : field;
    });
    if (event !== roundCompleteEvent) return [...configuredLead,...previousFields.map(field => {
      const semantic = {'previous.result':'visitResult','previous.intentLevel':'intentLevel'}[field.key];
      const definition = semantic && definitions.get(semantic);
      return definition ? choiceCondition(field,definition) : field;
    }),preRatingField];
    return [...currentRound,...configuredLead.filter(field => field.key !== 'leadStatus'),previousCallTags,preRatingField];
  }

  function followupConditions(context,categoryId) {
    const {types,model,source} = categoryDirectory(context);
    const row = types.find(type => type.value === categoryId)?.row;
    if (!row || typeof model?.fields !== 'function') return new Map();
    try {
      const fields = model.fields(categoryId,source);
      if (!Array.isArray(fields)) return new Map();
      const byKey = new Map();
      for (const field of fields) {
        if (!field || field.enabled === false || field.usage === 'IMPORT' ||
            !['select','multiselect'].includes(field.type)) continue;
        const key = field.businessKey === 'leadStatus' ? 'leadStatus' :
          window.DReview21DccFollowupFields?.fieldKey?.(field) || field.businessKey;
        if (!['visitResult','intentLevel','leadStatus'].includes(key)) continue;
        byKey.set(key,byKey.has(key) ? null : field);
      }
      return byKey;
    } catch (_) { return new Map(); }
  }

  function choiceCondition(field, definition) {
    const options = importOptions(definition);
    const counts = new Map();
    for (const option of options) for (const alias of option.aliases) counts.set(alias,(counts.get(alias) || 0)+1);
    return {...field,type:definition.type,options:options.map(option => ({
      ...option,aliases:option.aliases.filter(alias => counts.get(alias)===1)
    })),customCondition:true};
  }

  function strategyConditionProfile(context,previousMethod,previousTargetId) {
    if (!Object.hasOwn(outboundFields,previousMethod) || !previousTargetId) return {status:'none'};
    const actual = tenantContext(context);
    if (actual) {
      try {
        const profile = window.DSkynetOutboundTargets?.conditionProfile?.(actual,previousMethod,previousTargetId);
        if (profile?.status) return profile;
      } catch (_) { /* Keep the common fields available if the task profile cannot be read. */ }
    }
    return {status:'unavailable',reason:'上一轮任务的专用条件选项暂无法读取。'};
  }

  function strategyConditionFields(event,context,categoryId,previousMethod,previousTargetId) {
    if (event === '接入后') return [unlimitedStrategyField,...nurtureConditionFields(event,context,categoryId).filter(field => !field.key.startsWith('previous.'))];
    const tagField = previousCallTagField(previousMethod);
    const {fields:taskFields} = strategyConditionProfile(context,previousMethod,previousTargetId);
    return [unlimitedStrategyField,...nurtureConditionFields(event,context,categoryId).flatMap(field => {
      if (field === previousCallTags) return tagField ? [tagField] : [];
      if (field.key.startsWith('round.') && !field.legacy) {
        return [{...field,label:field.label.replace(/^本轮/,'上一轮')}];
      }
      return [field];
    })].map(field => {
      const options = taskFields?.[field.key];
      return options?.length && !field.customCondition ? {...field,type:'select',options,taskCondition:true} : field;
    });
  }

  function resolveFact(facts, key) {
    if (Object.hasOwn(facts,key)) return facts[key];
    return key.split('.').reduce((value,part) => value?.[part],facts);
  }

  function comparablePreRating(value) {
    const input = typeof value === 'number' ? String(value) : text(value);
    if (/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(input) && Number.isFinite(Number(input))) {
      return {kind:'number',rank:Number(input)};
    }
    const grade = demoRatingRanks.get(input.toUpperCase());
    return grade === undefined ? null : {kind:'demoGrade',rank:grade};
  }

  function comparePreRating(actual,expected) {
    const left = comparablePreRating(actual);
    const right = comparablePreRating(expected);
    if (!left || !right || left.kind!==right.kind) return null;
    return left.rank>right.rank ? 1 : left.rank<right.rank ? -1 : 0;
  }

  function matches(condition, facts = {}) {
    const raw = resolveFact(facts,condition.field);
    const aliases = Array.isArray(condition.taskValueAliases) ? condition.taskValueAliases : [];
    const expectedValues = Array.isArray(condition.value) ? condition.value : [condition.value];
    const canonical = value => expectedValues.includes(value) ? value : aliases.find(item => item.alias===value)?.value ?? value;
    const actual = aliases.length ? (Array.isArray(raw) ? raw.map(canonical) : canonical(raw)) : raw;
    if (condition.operator === 'hasValue' || condition.operator === 'isEmpty') {
      const values = Array.isArray(actual) ? actual : [actual];
      const present = values.some(value => value != null && (typeof value !== 'string' || value.trim() !== ''));
      return condition.operator === 'hasValue' ? present : !present;
    }
    const values = (Array.isArray(actual) ? actual : [actual])
      .filter(value => value != null && (typeof value !== 'string' || value.trim() !== ''));
    if (!values.length) return null;
    if (!expectedValues.length) return false;
    const {operator} = condition;
    let incomparable = false;
    for (const expected of expectedValues) for (const value of values) {
      if (condition.field === preRatingField.key && ['equal','greater','less'].includes(operator)) {
        const comparison = comparePreRating(value,expected);
        if (operator === 'equal' && (comparison === null ? String(value) === expected : comparison === 0)) return true;
        if (operator !== 'equal') {
          if (comparison === null) incomparable = true;
          else if (operator === 'greater' ? comparison > 0 : comparison < 0) return true;
        }
      } else if (['equal','notEqual'].includes(operator) && String(value) === expected) {
        return operator === 'equal';
      } else if (operator === 'contains' && String(value).includes(expected)) return true;
      else if (operator === 'before' && String(value) < expected) return true;
      else if (operator === 'after' && String(value) > expected) return true;
    }
    return incomparable ? null : operator === 'notEqual';
  }

  function matchRule(logic, conditions, facts, {skipPrevious = false} = {}) {
    const applicable = skipPrevious ? conditions.filter(condition => !condition.field.startsWith('previous.')) : conditions;
    if (!applicable.length) return conditions.length === 0;
    const outcomes = applicable.map(condition => matches(condition,facts));
    const hasMissing = outcomes.includes(null);
    if (logic === 'or' || logic === 'not') {
      const matchedOutcome = logic === 'or' ? true : false;
      if (outcomes.includes(matchedOutcome)) return true;
      return hasMissing ? null : false;
    }
    if (outcomes.includes(false)) return false;
    return hasMissing ? null : true;
  }

  function requireValue(condition, message) {
    if (!condition) throw new Error(message);
  }

  function dictionaryValue(options, value) {
    const exact = options.find(option => option.value === value);
    const aliases = exact ? [] : options.filter(option => option.aliases?.includes(value));
    requireValue(exact || aliases.length === 1,'请选择字典中的标准值。');
    return (exact || aliases[0]).value;
  }

  function normalizeConditionValue(field,operator,input) {
    let value = text(input);
    requireValue(value && value.length <= 120,'每个比较值须填写 1 至 120 字。');
    if (operator === 'greater' || operator === 'less') {
      requireValue(comparablePreRating(value),'预评级的大小比较请输入数值或演示等级 A、B。');
    }
    if (field.options) value = dictionaryValue(field.options,value);
    if (field.type === 'datetime-local') {
      const date = Date.parse(value + '+08:00');
      requireValue(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) && Number.isFinite(date) &&
        new Date(date + 8 * 3600000).toISOString().slice(0,16) === value,'请填写有效的留资时间。');
    } else if (field.type === 'date') {
      const date = Date.parse(value + 'T00:00:00Z');
      requireValue(/^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(date) &&
        new Date(date).toISOString().slice(0,10) === value,'请填写有效的日期。');
    } else {
      requireValue(!['before','after'].includes(operator),'早于或晚于仅适用于时间字段。');
    }
    if (field.type === 'number') {
      requireValue(Number.isFinite(Number(value)),'请填写有效的数字。');
      if (field.key === 'round.number') requireValue(Number.isSafeInteger(Number(value)) && Number(value) >= 1,
        '轮次从 1 开始，请填写正整数。');
      return String(Number(value));
    }
    return value;
  }

  function conditionsFor(conditions, allowed, {nurture = false, intake = false} = {}) {
    requireValue(Array.isArray(conditions),'请核对条件配置。');
    return conditions.map(condition => {
      const field = allowed.find(item => item.key === condition?.field);
      if (field === unlimitedStrategyField) return {field:field.key};
      const operator = condition?.operator;
      const operatorSpec = operators.find(item => item.value === operator);
      requireValue(field && operatorSpec,'请完整填写条件字段、比较方式和取值。');
      const preRating = field.key === preRatingField.key;
      const ordered = operator === 'greater' || operator === 'less';
      if (preRating) requireValue(preRatingOperators.some(item => item.value === operator),'预评级仅支持大于、小于或等于。');
      requireValue(!ordered || preRating,'大于或小于仅适用于预评级。');
      if (operatorSpec.unary) return {field:field.key,operator};
      const multiple = Array.isArray(condition.value);
      if (multiple) requireValue(field.options ? ['equal','notEqual'].includes(operator) : (nurture || intake),
        '此条件不支持多个比较值。');
      const inputs = multiple ? condition.value : [condition.value];
      requireValue(inputs.length,'请至少填写或选择一个比较值。');
      const unique = [...new Set(inputs.map(value => normalizeConditionValue(field,operator,value)))];
      if (ordered) requireValue(new Set(unique.map(value => comparablePreRating(value).kind)).size === 1,
        '同一条预评级条件不能混用数值和等级。');
      return conditionWithTaskAliases(field,operator,unique.length === 1 ? unique[0] : unique);
    });
  }

  function conditionWithTaskAliases(field,operator,value) {
    const saved = {field:field.key,operator,value};
    if (!Array.isArray(field.options) || !field.taskCondition && !field.customCondition && !field.sourceFieldId) return saved;
    const values = Array.isArray(value) ? value : [value];
    const owners = new Map();
    for (const option of field.options) {
      for (const alias of new Set([option.value,...(option.aliases || [])])) {
        if (!owners.has(alias)) owners.set(alias,new Set());
        owners.get(alias).add(option.value);
      }
    }
    const aliases = field.options.filter(option => values.includes(option.value))
      .flatMap(option => (option.aliases || []).filter(alias => owners.get(alias)?.size===1)
        .map(alias => ({alias,value:option.value})));
    return aliases.length ? {...saved,taskValueAliases:aliases} : saved;
  }

  function activeReference(book, kind, id, categoryId) {
    const reference = id && activeList(book,kind).find(row => row.id === id && row.categoryId === categoryId);
    requireValue(reference,'请选择当前业务分类已启用的新版' + catalog[kind] + '。');
    return reference;
  }

  function normalizeBranch(branch, kind, order, index, book, categoryId) {
    const action = branch?.action;
    requireValue(branchActions.includes(action),'请为每个分支选择执行动作。');
    if (kind === 'invalid') {
      requireValue(['结束','过滤','转待处理','保留待匹配'].includes(action),'字段校验失败时只能结束、过滤或保留待处理／待匹配。');
    }
    const normalized = {action};
    const reason = text(branch.reason);
    requireValue(reason.length <= 120,'分支说明最多 120 个字。');
    if (reason) normalized.reason = reason;
    if (action === '继续') {
      const next = text(branch.next);
      requireValue(!next || order.indexOf(next) > index,'继续分支只能指向后续节点。');
      if (next) normalized.next = next;
    } else {
      normalized.status = branchStatuses[action];
    }
    if (action === '送入培育模板') {
      normalized.nurtureTemplateId = activeReference(book,'nurtureTemplates',branch.nurtureTemplateId,categoryId).id;
    }
    return normalized;
  }

  function normalizeMatch(node) {
    const match = node.match || {};
    if (node.id === 'localHistory') {
      const allowedKeys = ['visitResult','callStatus','intentLevel'];
      const known = Object.fromEntries(allowedKeys.map(key => [key,text(match[key])]).filter(([,value]) => value));
      requireValue(Object.keys(known).length && Object.values(known).every(value => value.length <= 120),'请至少填写一项本系统历史判定条件。');
      return known;
    }
    const known = {};
    for (const field of leadFields.filter(item => item.options && Object.hasOwn(match,item.key))) {
      requireValue(Array.isArray(match[field.key]) &&
        match[field.key].every(value => field.options.some(option => option.value === value)), '请选择关联字段的标准值。');
      if (match[field.key].length) known[field.key] = [...new Set(match[field.key])];
    }
    return known;
  }

  function checksFromRule(node) {
    const checks = node.checks === undefined ? [] : node.checks;
    if (!Array.isArray(checks) || !Array.isArray(node.requiredFields)) return checks;
    const present = new Set(checks.filter(check => check?.operator === 'hasValue').map(check => check.field));
    const legacy = new Set(node.requiredFields);
    return [...checks,...intakeFields.filter(field =>
      legacy.has(field.key) && !defaultRequiredFields.includes(field.key) && !present.has(field.key))
      .map(field => ({field:field.key,operator:'hasValue'}))];
  }

  function ruleForEditing(rule) {
    const draft = copy(rule);
    const node = Array.isArray(draft?.nodes) ? draft.nodes.find(item => item?.id === 'fields') : null;
    if (node) {
      node.checks = checksFromRule(node);
      delete node.requiredFields;
    }
    return draft;
  }

  function ruleForFlowEditing(rule, book) {
    const draft = ruleForEditing(rule);
    if (draft.cleaning) return draft;
    const available = new Set(activeList(book,'nurtureTemplates')
      .filter(template => template.categoryId === draft.categoryId).map(template => template.id));
    const linked = new Set();
    for (const node of draft.nodes || []) {
      for (const branch of Object.values(node?.branches || {})) {
        if (branch?.action === '送入培育模板' && available.has(branch.nurtureTemplateId)) {
          linked.add(branch.nurtureTemplateId);
        }
      }
    }
    const checks = draft.nodes?.find(node => node?.id === 'fields')?.checks;
    draft.cleaning = {...defaultCleaning(draft.categoryId),
      conditions:Array.isArray(checks) ? checks : [],
      nurtureTemplateId:linked.size === 1 ? linked.values().next().value : ''};
    delete draft.nodes;
    return draft;
  }

  function normalizeExternalQuery(query = defaultExternalQuery) {
    const sourceId = query?.sourceId;
    const lookupField = query?.lookupField ?? (sourceId === '' ? defaultExternalQuery.lookupField : undefined);
    requireValue(sourceId === '' || historySources.some(source => source.value === sourceId),
      '请选择有效的外部历史接入来源。');
    requireValue(historyLookupFields.some(field => field.value === lookupField),
      '请选择有效的外部历史查询依据。');
    return {sourceId,lookupField};
  }

  function normalizeNodes(nodes, book, categoryId, profile) {
    const supported = new Map(defaultNodes(categoryId).map(node => [node.id,node]));
    const order = Array.isArray(nodes) ? nodes.map(node => node?.id) : [];
    requireValue(order[0] === 'fields' && order.length === supported.size &&
      new Set(order).size === supported.size && order.every(id => supported.has(id)),
      '请保留来件校验作为首个节点，并配置其余三个节点的顺序。');
    return nodes.map((node,index) => {
      const example = supported.get(node.id);
      const label = text(node.label) || example.label;
      const condition = text(node.condition) || example.condition;
      requireValue(label.length <= 60 && condition.length <= 160,'请检查节点名称和条件说明的长度。');
      const branches = Object.fromEntries(Object.keys(example.branches).map(key => [
        key,normalizeBranch(node.branches?.[key],key,order,index,book,categoryId)
      ]));
      const result = {id:node.id,label,condition,branches};
      if (node.id === 'fields') {
        requireValue(node.requiredFields === undefined || Array.isArray(node.requiredFields) &&
          node.requiredFields.every(key => intakeFields.some(field => field.key === key)),
        '请选择有效的来件必填字段。');
        result.checks = conditionsFor(checksFromRule(node),profile.fields,{intake:true});
      }
      if (node.id === 'localHistory') {
        const days = Number(node.days);
        requireValue(Number.isInteger(days) && days >= 1 && days <= 365,'历史查询范围须为 1 至 365 天。');
        Object.assign(result,{days,match:normalizeMatch(node)});
      }
      if (node.id === 'externalHistory') {
        result.externalQuery = normalizeExternalQuery(node.externalQuery);
      }
      if (node.id === 'template') {
        Object.assign(result,{match:normalizeMatch(node),conditions:conditionsFor(node.conditions || [],[...leadFields,...historyFields])});
      }
      return result;
    });
  }

  function normalizeCleaning(cleaning, book, categoryId, profile) {
    requireValue(cleaning && ['and','or'].includes(cleaning.logic),'请选择清洗条件的匹配方式。');
    const {logic,onMatch,onMismatch,sameNumber} = cleaning;
    requireValue([onMatch,onMismatch].every(route => cleaningRoutes.some(item => item.value === route)),
      '请选择条件命中与未命中时的处理去向。');
    requireValue(sameNumberWindows.some(window => window.value === String(sameNumber?.windowMinutes)),
      '请选择有效的同号码过滤时间窗口。');
    const matchAction = sameNumber?.matchAction;
    requireValue(sameNumberActions.some(action => action.value === matchAction),'请选择同号码命中时的处理方式。');
    const templateId = text(cleaning.nurtureTemplateId);
    const usesTemplate = onMatch === 'sameNumber' || onMismatch === 'sameNumber';
    const nurtureTemplateId = usesTemplate || templateId
      ? activeReference(book,'nurtureTemplates',templateId,categoryId).id : '';
    return {
      logic, conditions:conditionsFor(cleaning.conditions,profile.fields,{intake:true}), onMatch, onMismatch,
      sameNumber:{windowMinutes:Number(sameNumber.windowMinutes),matchAction}, nurtureTemplateId
    };
  }

  function manualAssignmentShape(assignment) {
    if (assignment && Object.hasOwn(assignment,'filterSteps')) {
      const steps = assignment.filterSteps;
      requireValue(Array.isArray(steps) &&
        Array.from(steps).every(step => step === 'online' || manualAssignmentFilters.some(item => item.value === step)),
        '请选择有效的坐席过滤项。');
      requireValue(new Set(steps).size === steps.length,'坐席过滤项不可重复。');
      const filterSteps = steps.filter(step => step !== 'online' && step !== 'random');
      if (steps.includes('random')) filterSteps.push('random');
      return {filterSteps};
    }
    requireValue(assignment && manualAssignmentStrategies.some(item => item.value === assignment.strategy),
      '请选择人工外呼的坐席分配规则。');
    const {strategy,prioritySeatIds = []} = assignment;
    requireValue(Array.isArray(prioritySeatIds),'请核对坐席优先级。');
    return {strategy,prioritySeatIds:[...new Set(prioritySeatIds)]};
  }

  function normalizeManualAssignment(assignment, tenantSeatIds) {
    const shape = manualAssignmentShape(assignment);
    const {scores = {}} = assignment;
    requireValue(Object.prototype.toString.call(scores) === '[object Object]','请核对坐席评分。');
    const scoreEntries = Object.entries(scores);
    const isValidSeatId = id => Boolean(text(id)) && text(id) === id &&
      !['__proto__','constructor','prototype'].includes(id) && (!tenantSeatIds || tenantSeatIds.has(id));
    requireValue([...(shape.prioritySeatIds || []),...scoreEntries.map(([id]) => id)].every(isValidSeatId),
      '请选择本租户的有效坐席。');
    requireValue(scoreEntries.every(([,score]) => Number.isFinite(score) && score >= 0 && score <= 100),
      '坐席评分须为 0 至 100 的数字。');
    return {...shape,scores:Object.fromEntries(scoreEntries)};
  }

  function intakeFirstRules(rules) {
    if (!Array.isArray(rules) || !rules.length || rules[0]?.event === '接入后') return rules;
    const firstIntake = rules.findIndex(rule => rule?.event === '接入后');
    if (firstIntake < 0) return [{event:'接入后',logic:'and',conditions:[],actions:['继续']},...rules];
    return [rules[firstIntake],...rules.slice(0,firstIntake),...rules.slice(firstIntake + 1)];
  }

  const migratedRoundFields = {
    'previous.result':'round.result','previous.intentLevel':'round.intentLevel','previous.callStatus':'round.callStatus',
    leadStatus:'round.leadStatus'
  };

  function canonicalNurtureRule(rule) {
    if (!legacyRoundEvents.includes(rule?.event)) return rule;
    return {...rule,event:roundCompleteEvent,
      actions:Array.isArray(rule.actions) ? rule.actions.map(action => action === '不经培育直接下发' ? '进入下发判断' : action) : rule.actions,
      conditions:Array.isArray(rule.conditions)
      ? rule.conditions.map(condition => Object.hasOwn(migratedRoundFields,condition?.field)
        ? {...condition,field:migratedRoundFields[condition.field]} : condition) : rule.conditions};
  }

  function nurtureTemplateForEditing(draft) {
    const editable = copy(draft);
    if (!editable.strategyTree && Array.isArray(editable.rules)) {
      editable.rules = intakeFirstRules(editable.rules).map(canonicalNurtureRule);
    }
    function removeLegacyOnline(rules) {
      for (const rule of rules || []) {
        if (Array.isArray(rule?.manualAssignment?.filterSteps)) {
          rule.manualAssignment.filterSteps = rule.manualAssignment.filterSteps.filter(step => step !== 'online');
        }
        if (Array.isArray(rule?.children)) removeLegacyOnline(rule.children);
      }
    }
    if (Array.isArray(editable.rules)) removeLegacyOnline(editable.rules);
    editable.roundFlow = true;
    return editable;
  }

  function nurtureTreeDraft(draft) {
    const tree = copy(draft);
    if (tree.strategyTree) return tree;
    const rules = [];
    for (const rule of Array.isArray(tree.rules) ? tree.rules : []) {
      if (rule?.event !== '接入后' || !Array.isArray(rule.actions) || !Array.isArray(rule.conditions)) continue;
      const action = rule.actions.find(action => action !== '继续');
      const conditions = rule.conditions.filter(({field}) => !field.startsWith('previous.') && !field.startsWith('round.'));
      if (!action || (rule.conditions.length && !conditions.length)) continue;
      const number = rules.length + 1;
      rules.push({...rule,id:'strategy-root-' + number,name:'策略 ' + number,
        conditions,actions:[action],fallback:false,children:[]});
    }
    return {...tree,roundFlow:true,strategyTree:true,rules};
  }

  function hasLegacyFallback(rules = []) {
    return rules.some(rule => {
      if (rule.fallback === true && (rule.children?.length || rule.actions?.length !== 1)) return true;
      return hasLegacyFallback(rule.children ?? []);
    });
  }

  function normalizeFallbackDraft(draft) {
    const editable = copy(draft);
    function normalizeGroup(rules,allowedActions) {
      for (const rule of rules) {
        if (rule.fallback === true) {
          rule.actions = rule.actions.filter(action => allowedActions.includes(action)).slice(0,1);
          rule.children = [];
        } else if (rule.children?.length) normalizeGroup(rule.children,nurtureFallbackActions);
      }
    }
    if (editable.strategyTree) normalizeGroup(editable.rules,entryFallbackActions);
    return editable;
  }

  function directDeliveryFieldOptions(context,categoryId) {
    const {types,model,source} = categoryDirectory(context);
    if (!types.some(type=>type.value===categoryId && type.row) || !model?.fields) return [];
    try {
      const rows = model.fields(categoryId,source);
      const fields = (Array.isArray(rows) ? rows : []).flatMap(row => {
        const id = text(row?.id), key = text(row?.businessKey), label = text(row?.label);
        return id && key && label && row.enabled !== false && row.usage !== 'IMPORT' &&
          !['__proto__','constructor','prototype'].includes(key) ? [{id,key,label}] : [];
      });
      const keys = new Map();
      for (const field of fields) keys.set(field.key,(keys.get(field.key) || 0)+1);
      return fields.filter(field=>keys.get(field.key)===1);
    } catch (_) { return []; }
  }

  function directDeliveryValues(rule,context,categoryId) {
    const rows = rule.directDeliveryValues;
    if (rows === undefined) return {};
    requireValue(Array.isArray(rows) && rows.length <= 50,'直发最多可配置 50 个字段。');
    if (!rows.length) return {};
    const fields = new Map(directDeliveryFieldOptions(context,categoryId).map(field=>[field.id,field]));
    const used = new Set();
    const saved = rows.map(row=>{
      const field = fields.get(row?.fieldId);
      requireValue(field,'请选择当前二级分类启用的填写字段，原字段失效时请重选。');
      requireValue(!used.has(field.id),'同一个直发字段只能配置一次。');
      const value = text(row.value);
      requireValue(value && value.length <= 500,'「'+field.label+'」的下发值须填写 1 至 500 字。');
      used.add(field.id);
      return {fieldId:field.id,key:field.key,label:field.label,value};
    });
    return {directDeliveryValues:saved};
  }

  function directDeliveryConfiguration(rule, context, required, categoryId) {
    if (rule.event !== '接入后' || !rule.actions.some(action => deliveryActions.includes(action))) return {};
    const type = rule.directDeliveryTargetType;
    if (!required && type === undefined && rule.directDeliveryTargetId === undefined && !rule.directDeliveryValues?.length) return {};
    requireValue(['internalTenant','externalSystem'].includes(type),'请选择直发的下发对象。');
    const configured = directDeliveryValues(rule,context,categoryId);
    if (type === 'internalTenant') {
      requireValue(context.scope.tenant.organization !== '门店','门店租户不能直发给门店，请选择外部下发系统。');
      return {directDeliveryTargetType:type,...configured};
    }
    const target = resolveDeliveryTarget(context,type,text(rule.directDeliveryTargetId),rule.directDeliveryApplication);
    requireValue(target,'请选择当前可用的外部下发应用；配置变化后请重新关联。');
    return {directDeliveryTargetType:type,directDeliveryTargetId:target.id,directDeliveryApplication:target.application,...configured};
  }

  const coldCallbackFields = new Set(['round.result','previous.result']);
  function coldCallbackOption(field) {
    return field?.options?.find(option=>option.value==='下次回访' || option.label==='下次回访' ||
      option.aliases?.includes('下次回访')) || {value:'下次回访',label:'下次回访'};
  }

  function coldCallbackSelected(condition,field) {
    if (!coldCallbackFields.has(condition?.field) || condition.operator!=='equal') return false;
    const option = coldCallbackOption(field);
    const keys = [option.value,option.label,...(option.aliases || []),'下次回访'];
    return (Array.isArray(condition.value) ? condition.value : [condition.value]).some(value=>keys.includes(value));
  }

  function coldCallbackConditions(input,normalized,allowedFields,enabled) {
    if (!enabled) return normalized;
    return normalized.map((condition,index)=>{
      const field = allowedFields.find(item=>item.key===condition.field);
      if (!coldCallbackSelected(condition,field)) return condition;
      const raw = input[index].coldCallbackMinDays;
      const days = typeof raw==='string' && /^\d+$/.test(raw) ? Number(raw) : raw;
      requireValue(Number.isInteger(days) && days>=1 && days<=3650,'选择「下次回访」转冷时，请填写回访间隔大于多少天（1 至 3650 的整数）。');
      return {...condition,coldCallbackMinDays:days,coldCallbackResult:coldCallbackOption(field).value};
    });
  }

  function coldWindowDays(value) {
    if (value === undefined || value === null || value === '') return null;
    const days = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;
    requireValue(Number.isSafeInteger(days) && days > 0 && days <= 3650,'冷线索时间窗口请输入 1 至 3650 的整数天数。');
    return days;
  }

  function normalizeNurtureRule(rule, categoryId, book, context, tenantSeatIds, allowedFields, requireDirectTarget) {
    requireValue(events.includes(rule?.event) && ['and','or','not'].includes(rule.logic),'请选择判定事件和条件关系。');
    requireValue(Array.isArray(rule.actions) && rule.actions.length && rule.actions.every(action => actions.includes(action)),
      '请为培育规则配置至少一个执行动作。');
    const fields = allowedFields ?? nurtureConditionFields(rule.event,context,categoryId);
    const conditions = coldCallbackConditions(rule.conditions,conditionsFor(rule.conditions,fields,{nurture:true}),fields,
      rule.event!== '接入后' && rule.actions.includes('转冷线索'));
    const saved = {event:rule.event,logic:rule.logic,conditions,
      actions:[...rule.actions],...directDeliveryConfiguration(rule,context,requireDirectTarget,categoryId)};
    if (saved.conditions.some(condition => condition.field === preRatingField.key)) {
      const access = preRatingStatus(context,categoryId);
      requireValue(access.status === 'connected',access.message || '请先关联本业务分类的预评分应用。');
    }
    if (rule.actions.includes('企微培育')) {
      const id = text(rule.wecomApplicationId || rule.wecomApplication?.id);
      const application = scenarioApplication(context,'转企微跟进',id,rule.wecomApplication);
      requireValue(application,'请选择当前租户可用的企微跟进应用；配置变化后请重新关联。');
      saved.wecomApplicationId = id;
      saved.wecomApplication = application;
    }
    for (const [action,fields] of Object.entries(outboundFields)) {
      if (!rule.actions.includes(action)) continue;
      const id = text(rule[fields.id]);
      requireValue(id,'请选择本租户的' + action + '任务。');
      const target = window.DSkynetOutboundTargets?.resolve(context,action,id);
      requireValue(target?.status === 'available' && target.task?.id === id && target.task.tenantId === context.scope.id &&
        target.task.brandId === context.scope.tenant.brandId,target?.reason || '所选' + action + '任务暂不可用。');
      const {name,tenantId,brandId} = target.task;
      saved[fields.id] = id;
      saved[fields.reference] = {id,name,tenantId,brandId};
    }
    if (rule.actions.includes('转冷线索')) {
      requireValue(categoryId !== 'lxs','冷线索培育模板不能再次转冷线索。');
      const reference = coldRule(book,text(rule.coldRuleId));
      requireValue(reference && businessType(context,reference.categoryId) &&
        (!reference.tenantId || reference.tenantId === context.scope.id) &&
        (!reference.brandId || reference.brandId === context.scope.tenant.brandId),
        '请选择本租户已保存的冷线索分配规则。');
      saved.coldRuleId = reference.id;
      const days = coldWindowDays(rule.coldWindowDays);
      if (days !== null) saved.coldWindowDays = days;
    }
    if (rule.actions.includes('人工外呼') && rule.manualAssignment !== undefined) {
      saved.manualAssignment = normalizeManualAssignment(rule.manualAssignment,tenantSeatIds);
    }
    return saved;
  }

  function nurtureSeatIds(state) {
    return Array.isArray(state.seats) ?
      new Set(state.seats.filter(seat => seat?.tenant === state.tenant).map(seat => seat.id)) : null;
  }

  function normalizeStrategyRule(rule,index,event,categoryId,book,context,tenantSeatIds,previousMethod,previousTargetId,requireDirectTarget) {
    requireValue(rule.fallback === undefined || typeof rule.fallback === 'boolean','请核对策略的兜底设置。');
    const fallback = rule.fallback === true;
    const name = text(rule.name) || (fallback ? '兜底策略' : '策略 ' + (index + 1));
    requireValue(name.length <= 60,'策略名称须在 60 字以内。');
    const saved = normalizeNurtureRule({...rule,event},categoryId,book,context,tenantSeatIds,
      strategyConditionFields(event,context,categoryId,previousMethod,previousTargetId),requireDirectTarget);
    const action = saved.actions.find(action => action !== '继续');
    requireValue(action,'请选择策略「' + name + '」的处理动作。');
    requireValue(event === '接入后' || !saved.actions.includes('不经培育直接下发'),'后续策略请使用「进入下发判断」。');
    const children = rule.children ?? [];
    requireValue(Array.isArray(children),'请核对策略「' + name + '」的后续策略。');
    if (fallback) {
      const fallbackActions = event === '接入后' ? entryFallbackActions : nurtureFallbackActions;
      requireValue(!saved.conditions.length && saved.actions.length === 1 && fallbackActions.includes(action),
        '兜底策略须选择一种处理方式，不能设置筛选条件。');
      requireValue(!children.length,'兜底策略不能配置后续策略。');
    } else if (deliveryActions.includes(action)) {
      requireValue(saved.conditions.length,'请为策略「' + name + '」配置下发判定条件，或明确选择「不限」。');
    }
    requireValue(!children.length || nurtureStrategyActions.includes(action),'策略「' + name + '」的处理动作不能配置后续策略。');
    return {...saved,id:rule.id,name,fallback,children};
  }

  function validateStrategyDraft(state,context,book,categoryId,rule,{previousMethod,previousTargetId,legacy = false} = {}) {
    try {
      const actual = manager(context);
      requireValue(actual && state?.tenant === actual.scope.id,'当前没有配置该租户培育策略的权限。');
      const seats = nurtureSeatIds(state);
      if (legacy) return {value:normalizeNurtureRule(canonicalNurtureRule(rule),categoryId,book,actual,seats,undefined,true)};
      if (!rule.fallback) requireValue(text(rule.name),'请填写策略名称。');
      return {value:normalizeStrategyRule(rule,0,rule.event,categoryId,book,actual,seats,previousMethod,previousTargetId,true)};
    } catch (error) {
      return {error:error.message};
    }
  }

  function nurtureRules(draft,state,book,context,requireDirectTarget) {
    requireValue(Array.isArray(draft.rules) && draft.rules.length,'请至少配置一条培育规则。');
    const tenantSeatIds = nurtureSeatIds(state);
    if (!draft.strategyTree) {
      requireValue(draft.rules[0]?.event === '接入后','第一条培育规则的触发事件必须为「接入后」。');
      return draft.rules.map(rule => normalizeNurtureRule(canonicalNurtureRule(rule),draft.categoryId,book,context,
        tenantSeatIds,undefined,requireDirectTarget));
    }

    const ids = new Set();
    function normalizeGroup(rules,event,groupLabel,parent) {
      const fallbackIndex = rules.findIndex(rule => rule?.fallback === true);
      requireValue(fallbackIndex === -1 || fallbackIndex === rules.length - 1,
        groupLabel + '最多可添加一个兜底策略，并放在末尾。');
      return rules.map((rule,index) => {
        const id = rule?.id;
        requireValue(typeof id === 'string' && /^[A-Za-z0-9_-]{1,120}$/.test(id) && !ids.has(id),
          '请核对重复或无效的策略标识。');
        ids.add(id);
        const previousMethod = parent?.actions.find(action => action !== '继续');
        const previousId = outboundFields[previousMethod]?.id;
        const saved = normalizeStrategyRule(rule,index,event,draft.categoryId,book,context,tenantSeatIds,
          previousMethod,previousId ? parent[previousId] : undefined,requireDirectTarget);
        const {name,children} = saved;
        return {...saved,
          children:children.length ? normalizeGroup(children,roundCompleteEvent,'「' + name + '」的后续策略',saved) : []};
      });
    }
    return normalizeGroup(draft.rules,'接入后','接入策略');
  }

  function deliveryRuleFieldsFor(context,categoryId) {
    if (!context) return deliveryConditionFields;
    const system = deliveryConditionFields.find(field=>field.key==='round.callStatus');
    const {types,model,source} = categoryDirectory(context);
    if (!types.some(type=>type.value===categoryId && type.row) || !model?.fields) return [system];
    let rows;
    try { rows = model.fields(categoryId,source); } catch (_) { return [system]; }
    if (!Array.isArray(rows)) return [system];
    const choices = rows.flatMap(row=>{
      const id = text(row?.id), label = text(row?.label);
      const type = Object.hasOwn(importTypes,row?.type) ? importTypes[row.type] : '';
      if (!id || !label || !type || row.enabled===false || row.usage==='IMPORT') return [];
      const nativeKey = window.DReview21DccFollowupFields?.fieldKey?.(row);
      const semantic = nativeKey || (row.businessKey==='leadStatus' ? 'leadStatus' : '');
      const followupKey = nativeKey || 'field:'+id;
      const key = {'intentLevel':'round.intentLevel','visitResult':'round.result','leadStatus':'round.leadStatus'}[semantic] ||
        'round.form:'+id;
      const field = {key,label:'本轮'+label,type,followupKey};
      return [['select','multiselect'].includes(type) ? choiceCondition(field,row) : field];
    });
    const unique = choices.filter(field=>choices.filter(item=>item.key===field.key).length===1);
    return [...unique.filter(field=>field.key==='round.intentLevel'),system,...unique.filter(field=>field.key!=='round.intentLevel')];
  }

  const aiDeliveryTagKey = 'round.aiTags';
  const aiDeliveryStatusKey = 'round.aiCallStatus';
  const aiDurationKey = 'round.aiDurationSeconds';
  const aiDurationOperators = Object.freeze([
    {value:'greater',label:'大于'},{value:'atLeast',label:'大于等于'},{value:'equal',label:'等于'},
    {value:'atMost',label:'小于等于'},{value:'less',label:'小于'}
  ]);
  function aiDeliveryOptions(context,categoryId) {
    return window.DSkynetOutboundTargets?.aiDeliveryOptions?.(context,categoryId) ||
      {status:'unavailable',tags:[],statuses:[]};
  }
  function aiDeliveryRuleFieldsFor(context,categoryId) {
    const {tags,statuses} = aiDeliveryOptions(context,categoryId);
    return [{key:aiDeliveryTagKey,label:'AI 标签名称',options:tags,customCondition:true},
      {key:aiDeliveryStatusKey,label:'AI 通话状态',options:statuses,taskCondition:true},
      {key:aiDurationKey,label:'通话时长（秒）',type:'number'}];
  }
  function durationSeconds(value) {
    if (typeof value !== 'number' && (typeof value !== 'string' || !/^\d+$/.test(value.trim()))) return null;
    const seconds=Number(value);
    return Number.isSafeInteger(seconds) && seconds>=0 ? seconds : null;
  }
  function matchAiDeliveryDuration(operator,actual,expected) {
    const value=durationSeconds(actual), threshold=durationSeconds(expected);
    if(value===null||threshold===null)return null;
    if(operator==='greater')return value>threshold;
    if(operator==='atLeast')return value>=threshold;
    if(operator==='less')return value<threshold;
    if(operator==='atMost')return value<=threshold;
    return operator==='equal' ? value===threshold : null;
  }
  function normalizeAiDeliveryRule(rule,name,context,categoryId) {
    requireValue(Array.isArray(rule?.conditions) && rule.conditions.length > 0,'请为'+name+'添加至少一个条件。');
    const {logic='and'}=rule;
    requireValue(['and','or','not'].includes(logic),'请选择下发规则的条件关系。');
    const fields=aiDeliveryRuleFieldsFor(context,categoryId),seen=new Set();
    let supplierId='';
    const conditions=rule.conditions.map(condition=>{
      const field=fields.find(item=>item.key===condition?.field);
      const key=field?.key;
      const identity=key===aiDurationKey ? key+':'+condition.operator : key;
      requireValue(key&&!seen.has(identity),'AI 下发条件字段或时长比较方式重复，请核对。');
      seen.add(identity);
      if(key===aiDurationKey){
        const value=durationSeconds(condition.value);
        requireValue(aiDurationOperators.some(item=>item.value===condition.operator)&&value!==null,'通话时长必须为非负整数秒。');
        return {field:key,operator:condition.operator,value:String(value)};
      }
      requireValue(condition.operator==='equal','AI 标签和通话状态只支持等于。');
      const values=Array.isArray(condition.value)?condition.value:[condition.value];
      const selected=[...new Set(values)].map(value=>field.options.find(option=>option.value===value));
      requireValue(selected.length&&selected.every(Boolean),'请选择当前可用的'+field.label+'。');
      if(key===aiDeliveryTagKey){
        supplierId=selected[0].supplierId;
        requireValue(selected.every(tag=>tag.supplierId===supplierId),'同一条下发规则只能选择同一供应商的标签，不同供应商请分别添加规则。');
        const aliases=selected.flatMap(tag=>tag.aliases.map(alias=>({alias,value:tag.value})));
        const scoped=field.options.filter(tag=>tag.supplierId===supplierId);
        return {field:key,operator:'equal',value:selected.map(tag=>tag.value),
          aiTagOptions:selected.map(tag=>({value:tag.value,label:tag.label})),
          taskValueAliases:aliases.filter(entry=>scoped.filter(tag=>tag.aliases.includes(entry.alias)).length===1)};
      }
      return conditionWithTaskAliases(field,'equal',selected.map(option=>option.value));
    });
    return {logic,conditions,...(supplierId?{aiSupplierId:supplierId}:{})};
  }

  function normalizeDeliveryRule(rule,name,context,categoryId) {
    requireValue(Array.isArray(rule?.conditions) && rule.conditions.length > 0,
      '请为' + name + '添加至少一个条件。');
    const {logic = 'and'} = rule;
    requireValue(['and','or','not'].includes(logic),'请选择下发规则的条件关系。');
    const selectedFields = new Set();
    for (const condition of rule.conditions) {
      const multi = Array.isArray(condition?.value);
      requireValue(condition?.operator === 'equal' && (typeof condition.value === 'string' || multi),
        name + '的条件须用等于方式配置比较值。');
      requireValue(!selectedFields.has(condition.field),name + '的每个字段只能使用一次。');
      selectedFields.add(condition.field);
    }
    const allowed = deliveryRuleFieldsFor(context,categoryId);
    const conditions = conditionsFor(rule.conditions,allowed,{intake:true}).map(condition=>{
      const field = allowed.find(candidate=>candidate.key===condition.field);
      return field?.followupKey ? {...condition,followupKey:field.followupKey,followupLabel:field.label} : condition;
    });
    return {...(rule.logic === undefined ? {} : {logic}),conditions};
  }

  function validateDeliveryRule(rule,type,index,context,categoryId,ai=false) {
    try {
      const label = deliveryTypes.find(item => item.value === type)?.label;
      requireValue(label,'请选择有效的下发类型。');
      return {value:(ai ? normalizeAiDeliveryRule : normalizeDeliveryRule)(rule,label + '规则 ' + (index + 1),context,categoryId)};
    } catch (error) {
      return {error:error.message};
    }
  }

  function deliveryCriteria(criteria,context,categoryId,ai=false) {
    requireValue(criteria && deliveryTypes.every(type => Array.isArray(criteria[type.value])),
      '请核对意向下发和低质线索下发的规则配置。');
    return Object.fromEntries(deliveryTypes.map(({value,label}) => [value,criteria[value].map((rule,index) =>
      (ai ? normalizeAiDeliveryRule : normalizeDeliveryRule)(rule,label + '规则 ' + (index + 1),context,categoryId))]));
  }

  function deliveryMapping(draft) {
    const mappings = draft.mapping ?? [];
    requireValue(Array.isArray(mappings),'请检查下发字段映射。');
    const targets = new Set();
    return mappings.map(mapping => {
      const source = fixture.fields.find(field => field.key === mapping?.source);
      const target = text(mapping?.target);
      requireValue(source && target && target.length <= 80 && !targets.has(target),'请填写有效的来源字段和唯一的目标字段。');
      targets.add(target);
      return {source:source.key,target};
    });
  }

  const deliveryOutputChannels = ['manual','ai'];
  const protectedDeliveryOutput = new Set(['originalKey','dealer','intentStore','sourceLeadCode','localLeadCode','clueid','hclueid',
    '线索编号','原线索编号','意向门店','接收门店','下发门店','__proto__','constructor','prototype']);
  function deliveryOutputFieldsFor(context,categoryId,mapping = []) {
    const {model,source} = categoryDirectory(context);
    let definitions = [];
    try {
      const rows = model?.fields?.(categoryId,source);
      if (Array.isArray(rows)) definitions = rows;
    } catch (_) { return []; }
    const reserved = new Set([...protectedDeliveryOutput,...mapping.filter(row=>protectedDeliveryOutput.has(row.source)).map(row=>row.target)]);
    return directDeliveryFieldOptions(context,categoryId).flatMap(field=>{
      const definition = (definitions || []).find(row=>row.id===field.id);
      const followupKey = window.DReview21DccFollowupFields?.fieldKey?.(definition || {}) || 'field:'+field.id;
      const alias = mapping.find(row=>row.source===field.key);
      const target = alias?.target || field.key;
      return reserved.has(field.key) || reserved.has(followupKey) || reserved.has(target) ||
        mapping.some(row=>row.target===target && row.source!==field.key) ? [] : [{...field,followupKey,target}];
    });
  }

  function aiDeliveryOutputSources(context,categoryId) {
    const {tags} = aiDeliveryOptions(context,categoryId);
    return [
      {value:'status',label:'本轮 AI 通话状态'},
      {value:'duration',label:'本轮 AI 通话时长（秒）'},
      ...tags.map(tag=>({value:'tag:'+tag.value,label:tag.label,supplierId:tag.supplierId,tagName:tag.tagName || tag.label,
        aliases:[...new Set([tag.value,...(tag.aliases||[]).filter(alias=>tags.filter(other=>
          other.supplierId===tag.supplierId && other.aliases?.includes(alias)).length===1)])]}))
    ];
  }

  function normalizeDeliveryOutput(fields,context,categoryId,mapping) {
    requireValue(fields && typeof fields==='object' && !Array.isArray(fields) &&
      Object.keys(fields).every(key=>deliveryTypes.some(type=>type.value===key)), '下发字段配置无效。');
    const definitions = deliveryOutputFieldsFor(context,categoryId,mapping);
    const aiSources = aiDeliveryOutputSources(context,categoryId);
    return Object.fromEntries(Object.entries(fields).flatMap(([kind,channels])=>{
      requireValue(channels && typeof channels==='object' && !Array.isArray(channels) &&
        Object.keys(channels).every(key=>deliveryOutputChannels.includes(key)), '下发字段的呼叫渠道无效。');
      return [[kind,Object.fromEntries(Object.entries(channels).map(([channel,rows])=>{
        requireValue(Array.isArray(rows) && rows.length<=50,'每类下发最多配置 50 个字段。');
        const targets = new Set();
        return [channel,rows.map(row=>{
          const field = definitions.find(item=>item.id===row?.fieldId);
          requireValue(field && !targets.has(field.target),'请选择有效且不重复的下发字段，线索编号和门店不可覆盖。');
          targets.add(field.target);
          requireValue(row.required===undefined || typeof row.required==='boolean','下发字段的必填标识无效。');
          requireValue(row.fixedValue===undefined || typeof row.fixedValue==='string','指定下发值须为文本。');
          const fixedValue = text(row.fixedValue);
          requireValue(fixedValue.length<=500,'指定下发值最多 500 字。');
          const item = {fieldId:field.id,key:field.key,label:field.label,target:field.target,required:row.required===true};
          if (fixedValue) return {...item,fixedValue};
          if (channel==='manual') return {...item,followupKey:field.followupKey};
          const source = aiSources.find(option=>option.value===row.sourceId);
          requireValue(source,'「'+field.label+'」请指定下发值或选择本轮 AI 取数来源。');
          return {...item,sourceId:source.value,sourceLabel:source.label,...(source.supplierId ?
            {sourceSupplierId:source.supplierId,sourceTagName:source.tagName,sourceAliases:source.aliases} : {})};
        })];
      }))]];
    }));
  }

  function deliveryHandling(template, kind, {defaults = false} = {}) {
    const source = template?.handlingByKind?.[kind] ?? template ?? {};
    return Object.fromEntries(deliveryHandlingKeys.flatMap(key => Object.hasOwn(source,key) ?
      [[key,source[key]]] : defaults ? [[key,deliveryHandlingDefaults[key]]] : []));
  }

  function saveDeliveryHandling(context, draft, prior, criteria) {
    const supplied = Object.hasOwn(draft,'handlingByKind') ? draft.handlingByKind : prior?.handlingByKind;
    requireValue(supplied && typeof supplied === 'object' && !Array.isArray(supplied) &&
      Object.entries(supplied).every(([key,value]) => deliveryTypes.some(type => type.value === key) &&
        value && typeof value === 'object' && !Array.isArray(value)), '请核对两类下发办理配置。');
    return Object.fromEntries(deliveryTypes.map(({value,label}) => {
      const handling = {...deliveryHandling(prior,value,{defaults:true}),...deliveryHandling(draft,value)};
      const {auditEnabled,deliveryTargetType:type,deliveryTargetId:id,deliveryMode:mode} = handling;
      const hasAudit = [true,false,'enabled','disabled'].includes(auditEnabled);
      const hasType = deliveryTargetTypes.includes(type);
      const hasMode = deliveryModes.some(item => item.value === mode);
      const audit = auditEnabled === true || auditEnabled === 'enabled';
      const target = type === 'externalSystem' && text(id) ?
        resolveDeliveryTarget(context,type,text(id),handling.application) : null;
      if (criteria?.[value]?.length) {
        requireValue(hasType,label + '：请选择下发目标类型。');
        requireValue(hasAudit,label + '：请选择是否开启下发审核。');
        requireValue(hasMode,label + '：请选择 1 发 1 或 1 发多。');
        requireValue(!(type === 'internalTenant' && context.scope.tenant.organization === '门店' && mode === 'oneToMany'),
          label + '：门店内部下发仅可选择同品牌总部，请配置 1 发 1。');
        requireValue(!(type === 'externalSystem' && !audit && mode === 'oneToMany'),
          label + '：外部系统自动下发请配置 1 发 1。');
        if (type === 'externalSystem') requireValue(target,
          label + '：请选择当前租户可用的下发应用，配置变化后请重新关联。');
      }
      if (type === 'externalSystem' && text(id)) requireValue(target,
        label + '：原下发应用不可用，请重新关联。');
      return [value,{
        auditEnabled:hasAudit ? audit : deliveryHandlingDefaults.auditEnabled,
        deliveryTargetType:hasType ? type : deliveryHandlingDefaults.deliveryTargetType,
        deliveryMode:hasMode ? mode : deliveryHandlingDefaults.deliveryMode,
        ...(target ? {deliveryTargetId:target.id,application:target.application} : {})
      }];
    }));
  }

  function deliveryRouting(context, draft, prior, required) {
    const keys = ['auditEnabled','deliveryTargetType','deliveryTargetId'];
    if (!required && keys.every(key => !Object.hasOwn(draft,key) && !Object.hasOwn(prior || {},key))) return {};
    const [auditEnabled,type,id] = keys.map(key => Object.hasOwn(draft,key) ? draft[key] : prior?.[key]);
    requireValue(['externalSystem','internalTenant'].includes(type),'请选择下发目标类型。');
    if (type === 'internalTenant') return {auditEnabled:true,deliveryTargetType:type};
    requireValue([true,false,'enabled','disabled'].includes(auditEnabled),'请选择是否开启下发审核。');
    const snapshot = Object.hasOwn(draft,'application') ? draft.application : prior?.application;
    const target = resolveDeliveryTarget(context,type,text(id),snapshot);
    requireValue(target,'请选择当前租户可用的下发目标。');
    return {auditEnabled:auditEnabled === true || auditEnabled === 'enabled',
      deliveryTargetType:target.type,deliveryTargetId:target.id,application:target.application};
  }

  function newId(book, kind, tenantId) {
    const existing = new Set(book[kind].map(row => row.id));
    const prefix = kind === 'rules' ? idPrefixes[kind] + encodeURIComponent(tenantId) + '-' : idPrefixes[kind];
    let sequence = 1;
    while (existing.has(prefix + String(sequence).padStart(3,'0'))) sequence++;
    return prefix + String(sequence).padStart(3,'0');
  }

  function nextVersion(book, kind, id) {
    const numbers = book[kind].filter(row => row.id === id).map(row => Number(row.version.split('.')[1]));
    return numbers.length ? '1.' + (Math.max(...numbers) + 1) : '1.0';
  }

  function configurationInScope(row, context) {
    return row && (!row.tenantId || row.tenantId === context.scope.id) &&
      (!row.brandId || row.brandId === context.scope.tenant.brandId);
  }

  function visitStrategies(rules, visit) {
    if (!Array.isArray(rules)) return;
    for (const rule of rules) {
      if (!rule) continue;
      visit(rule);
      visitStrategies(rule.children,visit);
    }
  }

  function configurationReferences(kind, row) {
    const references = [];
    const add = (kind, id, categoryId) => {
      if (id) references.push({kind,id,categoryId});
    };
    if (kind === 'rules') {
      add('nurtureTemplates',row.cleaning?.nurtureTemplateId,row.categoryId);
      for (const node of Array.isArray(row.nodes) ? row.nodes : []) {
        for (const branch of Object.values(node?.branches || {})) {
          if (branch?.action === '送入培育模板') add('nurtureTemplates',branch.nurtureTemplateId,row.categoryId);
        }
      }
    }
    if (kind === 'nurtureTemplates') {
      add('deliveryTemplates',row.deliveryTemplateId,row.categoryId);
      visitStrategies(row.rules,rule => {
        if (Array.isArray(rule.actions) && rule.actions.includes('转冷线索')) add('rules',rule.coldRuleId,'lxs');
      });
    }
    return references;
  }

  function enabledReference(book, context, kind, id, categoryId) {
    if (!id) return null;
    const target = current(book,kind,id);
    return configurationInScope(target,context) && configurationStatus(target) === 'enabled' &&
      modernConfiguration(kind,target) && target.categoryId === categoryId ? target : null;
  }

  function enabledReferences(book, context, kind, row) {
    return configurationReferences(kind,row).every(({kind:targetKind,id,categoryId}) => {
      const target = enabledReference(book,context,targetKind,id,categoryId);
      if (!target) return false;
      if (targetKind === 'nurtureTemplates') {
        return !!enabledReference(book,context,'deliveryTemplates',target.deliveryTemplateId,categoryId);
      }
      return targetKind !== 'rules' || availableRule(book,target);
    });
  }

  function referringConfig(book, kind, id) {
    for (const sourceKind of Object.keys(catalog)) {
      const source = list(book,sourceKind).find(row => configurationReferences(sourceKind,row)
        .some(reference => reference.kind === kind && reference.id === id));
      if (source) return {kind:sourceKind,name:source.name};
    }
  }

  function changeConfiguration(state, context, kind, id, expectedVersion, change) {
    const actual = manager(context);
    if (!actual || state?.tenant !== actual.scope.id) return {error:'当前账号没有本租户的天网配置权限。'};
    if (!Object.hasOwn(catalog,kind) || !text(id)) return {error:'请选择有效的配置。'};
    if (state.skynetConfig !== undefined && !validBook(state.skynetConfig)) return {error:'本地配置暂时无法读取，原数据已保留。'};
    const book = read(state);
    try {
      const prior = current(book,kind,id);
      requireValue(configurationInScope(prior,actual) && prior.version === String(expectedVersion),
        '配置已变化，请刷新列表后重试。');
      const value = change(book,prior,actual);
      if (value !== prior) state.skynetConfig = book;
      return {value:copy(value)};
    } catch (error) {
      return {error:error.message};
    }
  }

  function appendConfiguration(book, kind, row, context) {
    const saved = {...row,version:nextVersion(book,kind,row.id),isCurrent:true,
      savedAt:new Date().toISOString(),savedBy:context.account.name || context.account.id};
    book[kind].push(saved);
    return saved;
  }

  function setEnabled(state, context, kind, id, expectedVersion, enabled) {
    return changeConfiguration(state,context,kind,id,expectedVersion,(book,prior,actual) => {
      requireValue(typeof enabled === 'boolean','请选择有效的启停状态。');
      if (configurationStatus(prior) !== 'enabled' && enabled) {
        const scratch = {...state,skynetConfig:book};
        const result = save(scratch,actual,kind,prior,prior.version,{requireDeliveryRouting:true,activate:true});
        requireValue(!result.error,result.error);
        requireValue(modernConfiguration(kind,result.value),'请先编辑并保存新版配置，再启用。');
        requireValue(enabledReferences(scratch.skynetConfig,actual,kind,result.value),'请先启用或替换此配置引用的配置。');
        for (const targetKind of Object.keys(catalog)) book[targetKind] = scratch.skynetConfig[targetKind];
        return current(book,kind,id);
      }
      if (enabled === (configurationStatus(prior) === 'enabled')) return prior;
      if (enabled) {
        const label = kind === 'rules' ? '来件清洗配置' : catalog[kind];
        requireValue(modernConfiguration(kind,prior) && !prior.requiresReview,
          '请先编辑并保存新版' + label + '，再启用。');
        requireValue(businessType(actual,prior.categoryId),'请先恢复可用的二级业务分类。');
        requireValue(enabledReferences(book,actual,kind,prior),'请先启用或替换此配置引用的配置。');
      }
      prior.isCurrent = false;
      return appendConfiguration(book,kind,{...copy(prior),status:enabled ? 'enabled' : 'disabled',enabled},actual);
    });
  }

  function remove(state, context, kind, id, expectedVersion) {
    return changeConfiguration(state,context,kind,id,expectedVersion,(book,prior,actual) => {
      const reference = referringConfig(book,kind,id);
      requireValue(!reference,reference ? '仍有' + catalog[reference.kind] + '「' + reference.name + '」引用，请先解除引用。' : '');
      prior.isCurrent = false;
      return appendConfiguration(book,kind,{...copy(prior),status:'disabled',enabled:false,deletedAt:new Date().toISOString()},actual);
    });
  }

  function copyConfig(state, context, kind, id, expectedVersion) {
    return changeConfiguration(state,context,kind,id,expectedVersion,(book,prior,actual) => {
      const names = new Set(list(book,kind).filter(row => row.categoryId === prior.categoryId).map(row => row.name));
      let name;
      let count = 0;
      do {
        count++;
        const suffix = count === 1 ? '（副本）' : '（副本 ' + count + '）';
        name = prior.name.slice(0,60 - suffix.length) + suffix;
      } while (names.has(name));
      const review = kind === 'rules' && (!prior.cleaning || prior.requiresReview === true);
      const source = review ? ruleForFlowEditing(prior,book) : copy(prior);
      const candidate = {...source,id:newId(book,kind,actual.scope.id),name,
        enabled:!review && modernConfiguration(kind,source) &&
          Boolean(businessType(actual,prior.categoryId) && enabledReferences(book,actual,kind,prior))};
      candidate.status = configurationStatus(prior) === 'draft' ? 'draft' : candidate.enabled ? 'enabled' : 'disabled';
      candidate.enabled = candidate.status === 'enabled';
      if (review) candidate.requiresReview = true;
      if (kind === 'nurtureTemplates') {
        const usedIds = new Set();
        for (const template of book.nurtureTemplates) visitStrategies(template.rules,node => usedIds.add(node.id));
        let sequence = 0;
        visitStrategies(candidate.rules,node => {
          if (!candidate.strategyTree && !node.id) return;
          let nodeId;
          do {
            nodeId = candidate.id + '-strategy-' + (++sequence);
          } while (usedIds.has(nodeId));
          node.id = nodeId;
        });
      }
      return appendConfiguration(book,kind,candidate,actual);
    });
  }

  function save(state, context, kind, draft, expectedVersion, {requireDeliveryRouting = false, asDraft = false, activate = false} = {}) {
    const actual = manager(context);
    if (!actual || state?.tenant !== actual.scope.id) return {error:'当前账号没有本租户的天网配置权限。'};
    if (!Object.hasOwn(catalog,kind) || !draft) return {error:'请选择有效的配置类型。'};
    if (state.skynetConfig !== undefined && !validBook(state.skynetConfig)) return {error:'本地配置暂时无法读取，原数据已保留。'};
    const book = read(state);
    try {
      const prior = draft.id ? current(book,kind,draft.id) : null;
      requireValue(!draft.id || configurationInScope(prior,actual) && prior.version === String(expectedVersion),
        '配置已变化，请重新打开后再保存。');
      const categoryId = draft.categoryId;
      requireValue(!prior || categoryId === prior.categoryId,'已保存配置的二级分类不可变更。');
      const type = businessType(actual,categoryId);
      requireValue(type,'请选择当前可用的二级分类。');
      const name = text(draft.name);
      requireValue(name && name.length <= 60,'请输入 1 至 60 字的配置名称。');
      requireValue(!list(book,kind).some(row => row.id !== prior?.id && row.categoryId === categoryId && row.name === name),
        '当前分类下已有同名配置。');
      const id = prior?.id || newId(book,kind,actual.scope.id);
      const status = asDraft ? 'draft' : !activate && prior && configurationStatus(prior) === 'disabled' ? 'disabled' : 'enabled';
      const saved = {id,categoryId,categoryName:type.label,name,version:nextVersion(book,kind,id),isCurrent:true,
        status,enabled:status === 'enabled',tenantId:actual.scope.id,brandId:actual.scope.tenant.brandId,
        savedAt:new Date().toISOString(),savedBy:actual.account.name || actual.account.id};
      if (asDraft) {
        const fields = kind === 'rules' ? ['cleaning','nodes','inTransitFilter','requiresReview'] :
          kind === 'nurtureTemplates' ? ['deliveryTemplateId','rules','strategyTree','roundFlow','outboundTargetBinding'] :
          ['criteria','aiCriteria','modes','mapping','fieldsByChannel','handlingByKind',...deliveryHandlingKeys];
        for (const key of fields) {
          if (Object.hasOwn(draft,key)) saved[key] = copy(draft[key]);
          else if (prior && Object.hasOwn(prior,key)) saved[key] = copy(prior[key]);
        }
        if (prior) prior.isCurrent = false;
        book[kind].push(saved);
        state.skynetConfig = book;
        return {value:copy(saved)};
      }
      if (kind === 'rules') {
        requireValue(!prior?.requiresReview || draft.cleaning !== undefined,
          '请保存新版来件清洗配置。');
        requireValue(draft.inTransitFilter === undefined || typeof draft.inTransitFilter === 'boolean','请选择是否过滤异源同号在途任务。');
        Object.assign(saved,{tenantId:actual.scope.id,brandId:actual.scope.tenant.brandId,
          inTransitFilter:(draft.inTransitFilter ?? prior?.inTransitFilter) !== false});
        const profile = intakeFieldProfile(actual,categoryId);
        if (draft.cleaning === undefined) saved.nodes = normalizeNodes(draft.nodes,book,categoryId,profile);
        else saved.cleaning = normalizeCleaning(draft.cleaning,book,categoryId,profile);
      }
      if (kind === 'nurtureTemplates') {
        requireValue(draft.strategyTree === undefined || typeof draft.strategyTree === 'boolean','请核对培育模板的策略结构。');
        requireValue(!prior?.strategyTree || draft.strategyTree === true,'请用树形策略编辑器保存该培育模板。');
        saved.deliveryTemplateId = activeReference(book,'deliveryTemplates',draft.deliveryTemplateId,categoryId).id;
        saved.rules = nurtureRules(draft,state,book,actual,requireDeliveryRouting);
        if (draft.strategyTree) saved.strategyTree = true;
        saved.roundFlow = true;
        saved.outboundTargetBinding = true;
      }
      if (kind === 'deliveryTemplates') {
        const criteria = draft.criteria === undefined ? prior?.criteria : draft.criteria;
        const modes = criteria === undefined ? legacyDeliveryModes : deliveryModes;
        const aiCriteria = draft.aiCriteria === undefined ? prior?.aiCriteria : draft.aiCriteria;
        if (criteria !== undefined || aiCriteria !== undefined) saved.criteria = deliveryCriteria(criteria ?? defaultDeliveryCriteria(),actual,categoryId);
        if (aiCriteria !== undefined) saved.aiCriteria = deliveryCriteria(aiCriteria,actual,categoryId,true);
        if (Object.hasOwn(draft,'handlingByKind') || prior?.handlingByKind) {
          const combined=Object.fromEntries(deliveryTypes.map(({value})=>[value,[...(saved.criteria?.[value]||[]),...(saved.aiCriteria?.[value]||[])]]));
          saved.handlingByKind = saveDeliveryHandling(actual,draft,prior,combined);
        } else {
          const routing = deliveryRouting(actual,draft,prior,requireDeliveryRouting);
          const selectedMode = Object.hasOwn(draft,'deliveryMode') ? draft.deliveryMode : prior?.deliveryMode;
          if (requireDeliveryRouting || selectedMode !== undefined) {
            requireValue(deliveryModes.some(mode => mode.value === selectedMode),'请选择 1 发 1 或 1 发多。');
            requireValue(!(routing.deliveryTargetType === 'internalTenant' &&
              actual.scope.tenant.organization === '门店' && selectedMode === 'oneToMany'),
            '门店内部下发仅可选择同品牌总部，请配置 1 发 1。');
            saved.deliveryMode = selectedMode;
          }
          Object.assign(saved,routing);
        }
        Object.assign(saved,{
          modes:modes.map(mode => mode.value),
          mapping:deliveryMapping({...draft,mapping:draft.mapping ?? prior?.mapping})
        });
        const output = draft.fieldsByChannel ?? prior?.fieldsByChannel;
        if (output !== undefined) saved.fieldsByChannel = normalizeDeliveryOutput(output,actual,categoryId,saved.mapping);
      }
      if (status === 'enabled') requireValue(enabledReferences(book,actual,kind,saved),
        '请先启用或替换此配置引用的配置。');
      if (prior) prior.isCurrent = false;
      book[kind].push(saved);
      state.skynetConfig = book;
      return {value:copy(saved)};
    } catch (error) {
      return {error:error.message};
    }
  }

  function remapFlowReferences(kind, draft, idMap) {
    const resolved = id => Object.hasOwn(idMap,id) ? idMap[id] : id;
    if (kind === 'nurtureTemplates') draft.deliveryTemplateId = resolved(draft.deliveryTemplateId);
    if (kind === 'rules' && draft.cleaning) draft.cleaning.nurtureTemplateId = resolved(draft.cleaning.nurtureTemplateId);
    if (kind === 'rules' && Array.isArray(draft.nodes)) {
      for (const node of draft.nodes) {
        for (const branch of Object.values(node?.branches || {})) {
          if (branch?.action === '送入培育模板') branch.nurtureTemplateId = resolved(branch.nurtureTemplateId);
        }
      }
    }
  }

  function prepareFlow(state, context, drafts = {}, options) {
    const actual = manager(context);
    if (!actual || state?.tenant !== actual.scope.id) return {error:'当前账号没有本租户的天网配置权限。'};
    if (state.skynetConfig !== undefined && !validBook(state.skynetConfig)) return {error:'本地配置暂时无法读取，原数据已保留。'};
    const order = ['deliveryTemplates','nurtureTemplates','rules'];
    if (!drafts || typeof drafts !== 'object' || Array.isArray(drafts) ||
        Object.keys(drafts).some(kind => !order.includes(kind) || !Array.isArray(drafts[kind]))) {
      return {error:'请检查配置流程中的草稿。'};
    }
    const scratch = {tenant:state.tenant,seats:state.seats,skynetConfig:read(state)};
    const idMap = {};
    const saved = [];
    const seen = new Set();

    for (const kind of order) {
      for (const draft of drafts[kind] || []) {
        const id = text(draft?.id);
        if (!id || id !== draft.id || seen.has(id)) return {error:'配置草稿的标识无效或重复。',kind,id};
        seen.add(id);
        const isNew = id.startsWith('draft:');
        if (isNew && id.length === 'draft:'.length) return {error:'新建配置的草稿标识无效。',kind,id};

        const prior = isNew ? null : current(scratch.skynetConfig,kind,id);
        if (!isNew && (!prior || prior.version !== String(draft.version))) {
          return {error:'配置已变化，请重新打开后再保存。',kind,id};
        }
        const candidate = copy(draft);
        remapFlowReferences(kind,candidate,idMap);
        const mayReuse = kind !== 'nurtureTemplates' ||
          Array.isArray(candidate.rules) && candidate.rules[0]?.event === '接入后';
        if (mayReuse && prior && !prior.requiresReview && JSON.stringify(prior) === JSON.stringify(candidate) &&
            (options?.asDraft ? configurationStatus(prior) === 'draft' : configurationStatus(prior) !== 'draft')) continue;
        if (isNew) delete candidate.id;

        const result = save(scratch,actual,kind,candidate,draft.version,options);
        if (result.error) return {error:result.error,kind,id};
        if (isNew) idMap[id] = result.value.id;
        saved.push({kind,value:result.value});
      }
    }
    return {book:scratch.skynetConfig,idMap,saved};
  }

  window.DSkynetConfig = Object.freeze({
    read,list,activeList,configurationStatus,current,version,ruleFor,rulesForCategory,ruleById,defaultRuleId,canManage:context => Boolean(manager(context)),
    save,prepareFlow,setEnabled,remove,copyConfig,defaultNodes,defaultCleaning,
    businessTypes,businessType,categoryTree,leadFields,historyFields,previousFields,roundFields,fields,operators,events,actions,branchActions,
    roundCompleteEvent,legacyRoundEvents,intakeFirstRules,nurtureTemplateForEditing,nurtureTreeDraft,nurtureStrategyActions,nurtureFallbackActions,
    entryFallbackActions,
    hasLegacyFallback,normalizeFallbackDraft,validateStrategyDraft,
    nurtureConditionFields,strategyConditionFields,strategyConditionProfile,previousCallTagField,unlimitedStrategyField,preRatingField,preRatingOperators,preRatingStatus,
    coldRules,coldRule,coldCallbackOption,coldCallbackSelected,outboundFields,directDeliveryFieldOptions,
    cleaningRoutes,sameNumberWindows,sameNumberActions,manualAssignmentStrategies,manualAssignmentFilters,
    defaultRequiredFields,intakeFields,intakeFieldProfile,ruleForEditing,ruleForFlowEditing,
    historySources,historyLookupFields,defaultExternalQuery,
    deliveryActions,deliveryTypes,deliveryConditionFields,deliveryRuleFieldsFor,aiDeliveryRuleFieldsFor,aiDeliveryOptions,aiDeliveryTagKey,aiDeliveryStatusKey,aiDurationKey,aiDurationOperators,durationSeconds,matchAiDeliveryDuration,deliveryModes,legacyDeliveryModes,defaultDeliveryCriteria,validateDeliveryRule,
    deliveryHandling,isDeliveryTemplateConfigured,deliveryTargetOptions,resolveDeliveryTarget,defaultDeliveryMapping,
    deliveryOutputFieldsFor,aiDeliveryOutputSources,
    mappingFields:intakeFields,matches,matchRule
  });
})();
