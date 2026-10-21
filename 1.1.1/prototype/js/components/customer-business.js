/** Tenant-owned business categories and reusable field definitions. */
(function (root) {
  'use strict';
  const storageKey = 'customer-business-config-v111-current', storageVersion = 1;
  const fieldTypes = ['text','textarea','number','select','multiselect','date','datetime','interface'];
  const importedFields = Object.freeze([
    ['intentionStoreCode','意向门店编码'],['intentionStoreName','意向门店名称'],
    ['intentionSeriesCode','意向车系编码'],['intentionSeries','意向车系'],['smartCode','Smartcode'],['leadCreatedAt','留资时间']
  ].map(([key,label]) => Object.freeze({key,label})));
  const clone = value => JSON.parse(JSON.stringify(value));
  const text = value => value == null ? '' : String(value);
  const object = value => !!value && typeof value === 'object' && !Array.isArray(value);
  const safeId = value => typeof value === 'string' && /^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/.test(value) && !['__proto__','prototype','constructor'].includes(value);
  // Supplier/CRM keys are opaque strings. Do not coerce them to numbers: "001" is not "1".
  const businessKey = value => text(value).trim();
  const validBusinessKey = value => value.length <= 80 && !/[\u0000-\u001f\u007f]/.test(value);
  const intentProfile = () => root.CustomerIntentProfile || {};
  const isMappingSeriesField = field => field?.intentProfileRole === 'mapping-series' && field.type === 'interface';
  const state = () => root.AppState?.get?.() || {};
  const access = () => root.AppState?.effectiveAccess?.() || {};
  const superUser = () => access().roleCode === 'SUPER_ADMIN';
  const context = () => JSON.stringify([state().accountId,state().sessionId,state().enterpriseId,state().tenantId,state().activeDomain,access().roleCode,access().valid]);
  const ready = () => access().valid === true && state().activeDomain === 'CLOUD_CONTACT_CENTER';
  const canManage = () => ready() && ['ADMIN','SUPER_ADMIN'].includes(access().roleCode) && root.AppState?.canMenu?.('settings.business') === true;
  const scopeOf = (source = {}) => ({enterpriseId:text(source?.enterpriseId || state().enterpriseId),tenantId:text(source?.tenantId || state().tenantId)});
  const sameScope = (a,b) => a.enterpriseId === b.enterpriseId && a.tenantId === b.tenantId;
  const fail = message => ({ok:false,message});

  function tenants() {
    if (!ready()) return [];
    return (root.CloudCallData?.tenants || []).filter(row => !row.builtIn && text(row.enterpriseId) === text(state().enterpriseId) && row.status === '启用' && (row.capabilitySet || []).includes('CLOUD_CONTACT_CENTER') && (superUser() || text(row.tenantId) === text(state().tenantId)) && root.AppState.authorizeObject('',row)).map(clone);
  }
  function allowed(source) { const scope = scopeOf(source); return tenants().some(row => sameScope(scopeOf(row),scope)); }
  function fieldCapability(field) {
    const entry = field?.type === 'interface' ? root.BusinessData?.entry?.(field.dictionaryId) : null;
    return entry ? root.BusinessData?.capability?.(entry.capabilityId) || null : null;
  }
  function interfaceKind(field) { return fieldCapability(field)?.kind || ''; }
  function queryConditions(field) {
    const conditions = fieldCapability(field)?.queryConditions;
    return Array.isArray(conditions) ? clone(conditions) : [];
  }
  // Query conditions are explicit in this version of the field schema.
  function usesQueryConditions(field) {
    return field?.type === 'interface' && field.useQueryConditions === true;
  }
  function activeDependencies(field) { return usesQueryConditions(field) && Array.isArray(field.depends) ? [...field.depends] : []; }
  function selectionMode(field) { return fieldCapability(field)?.selectionMode || (interfaceKind(field) === 'store' ? 'multiple' : 'single'); }
  function returnFields(field) {
    const capability = fieldCapability(field), rows = capability?.returnFields;
    if (Array.isArray(rows)) return clone(rows).filter(row => object(row) && typeof row.key === 'string');
    return [];
  }
  function parameterBinding(field) {
    if (!usesQueryConditions(field)) return null;
    return object(field.parameterBinding) ? clone(field.parameterBinding) : null;
  }
  function queryBindingCompatibility(field, source, sourceValueKey, parameterName) {
    const binding=parameterBinding(field),conditions=queryConditions(field),key=sourceValueKey ?? binding?.sourceValueKey,param=parameterName ?? binding?.parameterName;
    const declared=conditions.find(row=>row.key===param),expected=declared || conditions[0] || null,actual=returnFields(source).find(row=>row.key===key) || null;
    const guidance=conditions.some(row=>row.required===true)?'请选择匹配来源。':'请选择匹配来源，或关闭此查询条件独立查询。';
    const rejected=(code,message)=>({ok:false,code,message:message+' '+guidance,category:'configuration',nonRetryable:true,expected:clone(expected),actual:clone(actual)});
    if(!fieldCapability(field) || !fieldCapability(source))return rejected('capability_unavailable','接口能力信息暂不可用，无法确认查询条件。');
    if(!declared)return rejected('unsupported_parameter','下游接口未声明参数“'+text(param)+'”，请按接口约定填写入参名称。');
    if(source?.type!=='interface' || selectionMode(source)!=='single' || declared.sourceKind && declared.sourceKind!=='*' && interfaceKind(source)!==declared.sourceKind)return rejected('invalid_source','关联字段须符合接口要求，并且只选择一个值。');
    if(!actual)return rejected('unsupported_source_value','上游接口未声明所选取值字段，请重新选择返回属性。');
    const complete=row=>['string','number','boolean'].includes(row?.valueType)&&typeof row?.valueDomain==='string'&&row.valueDomain.trim();
    if(!complete(declared)||!complete(actual))return rejected('missing_metadata','接口尚未声明完整的数据类型和数据范围，无法确认此查询条件。');
    const typeLabel=value=>value==='number'?'数字':value==='boolean'?'布尔值':'文本',domainLabel=row=>row.valueDomainLabel || '未说明的数据范围';
    if(actual.valueType!==declared.valueType)return rejected('value_type_mismatch','所选属性为'+typeLabel(actual.valueType)+'，下游入参要求'+typeLabel(declared.valueType)+'，不能直接传递。');
    if(actual.valueDomain!==declared.valueDomain)return rejected('value_domain_mismatch','所选属性属于“'+domainLabel(actual)+'”，下游入参要求“'+domainLabel(declared)+'”，两者不能直接使用。');
    return {ok:true,code:'compatible',message:'取值字段与下游入参匹配',expected:clone(declared),actual:clone(actual)};
  }
  const bindingErrorCodes=new Set(['unsupported_parameter','unsupported_source_value','value_type_mismatch','value_domain_mismatch']);
  const repairBindingErrorCodes=new Set(['unsupported_parameter','value_type_mismatch','value_domain_mismatch']);
  function dependencyCompatible(field, source) {
    const condition=queryConditions(field)[0];
    return !!condition && returnFields(source).some(row=>queryBindingCompatibility(field,source,row.key,condition.key).ok);
  }
  const parameterIdentifier = value => typeof value === 'string' && /^[a-zA-Z_][a-zA-Z0-9_]{0,63}$/.test(value) && !['__proto__','prototype','constructor'].includes(value);
  function fieldDependencyError(field, definitions, ignoreBindingCompatibility = false) {
    if (field?.type !== 'interface') return '';
    if (!usesQueryConditions(field)) return queryConditions(field).some(condition=>condition.required===true)?'此接口要求前置输入，请开启其他字段查询条件':'';
    const ids = activeDependencies(field), condition = queryConditions(field)[0], capability = fieldCapability(field);
    if (ids.length !== 1) return '请为“' + field.label + '”选择一个关联字段';
    if (capability && !condition) return '所选取数接口不支持前置输入，请选择不使用其他字段';
    const source = definitions.find(row => row.id === ids[0]);
    if (!source || source.id === field.id || source.type !== 'interface') return '查询条件必须关联其他接口字段';
    if (!condition || !fieldCapability(source)) return '关联接口的能力信息不可用，请恢复来源后配置';
    const binding = parameterBinding(field);
    if (condition?.required === true && binding?.required !== true) return '此接口要求前置输入，依赖要求必须设为必需';
    if (!parameterIdentifier(binding?.parameterName)) return '下游入参字段名须为 1 至 64 位字母、数字或下划线，且不能使用保留名称';
    if (!parameterIdentifier(binding?.sourceValueKey)) return '请选择关联接口声明的上游取值字段';
    const compatible=queryBindingCompatibility(field,source);
    return compatible.ok || ignoreBindingCompatibility && bindingErrorCodes.has(compatible.code)?'':compatible.message;
  }
  function cycleError(definitions) {
    const visiting = new Set(), done = new Set(), byId = new Map(definitions.map(row => [row.id,row]));
    function visit(field) {
      if (visiting.has(field.id)) return '接口字段不能形成循环关联，请调整“' + field.label + '”的关联字段';
      if (done.has(field.id)) return '';
      visiting.add(field.id);
      for (const id of activeDependencies(field)) { const source = byId.get(id); if (source) { const issue = visit(source); if (issue) return issue; } }
      visiting.delete(field.id); done.add(field.id); return '';
    }
    for (const field of definitions) { const issue = visit(field); if (issue) return issue; }
    return '';
  }

  function defaults() {
    const option = label => ({id:label,label,businessKey:''});
    const field = (id,label,type,labels=[]) => ({id,label,type,businessKey:'',options:labels.map(option),enabled:true});
    const choices = root.CustomerFollowupOptions || {};
    const fields = [
      field('leadLevel','线索等级','select',choices.leadLevel || ['A级','B级','C级','D级']),
      field('intentionLevel','意向等级','select',choices.intentionLevel || ['高意向','中意向','低意向','无意向']),
      field('visitIntention','到店意向','select',choices.visitIntention || ['有意向','暂不确定','无意向']),
      field('testDriveIntention','试驾意向','select',choices.testDriveIntention || ['有意向','暂不确定','无意向']),
      field('plannedVisitAt','计划到店时间','datetime'),
      field('plannedStoreName','计划到店门店','text'),
      field('serviceConcern','服务反馈','textarea'),
      field('serviceSatisfaction','服务满意度','select',['满意','一般','不满意']),
      field('nextServiceDate','计划保养日期','date'),
      field('activityInterest','参与意向','select',['愿意参加','待考虑','不参加']),
      field('participantCount','参加人数','number'),
      field('interestedItems','感兴趣的活动','multiselect',['到店体验','试驾体验','车主活动']),
      {...field(intentProfile().seriesFieldId || 'mappingIntendedSeries',intentProfile().seriesFieldLabel || '本次意向车系','interface'),dictionaryId:intentProfile().seriesDictionaryId || 'd-mapping-series',useQueryConditions:false,depends:[],intentProfileRole:'mapping-series'}
    ];
    const dictionary=root.BusinessData?.catalogState?.(),defaultId=intentProfile().seriesDictionaryId || 'd-mapping-series';
    // A fresh Mapping field needs the actual Mapping capability, not just its old entry ID.
    if(dictionary?.ok===true && dictionary.explicit===true && Array.isArray(dictionary.entries) && !dictionary.entries.some(row=>row.id===defaultId&&row.capabilityId==='mapping-series'))fields.splice(12,1);
    const refs = ids => ids.map(fieldId => ({fieldId,enabled:true,required:false}));
    const types = [
      {id:'lead',label:'线索类',codeLabel:'线索编码',prefix:'LEAD',enabled:true,fields:refs([...fields.slice(0,6).map(row => row.id),...fields.filter(isMappingSeriesField).map(row=>row.id)])},
      {id:'aftersales',label:'售后类',codeLabel:'售后单号',prefix:'AS',enabled:true,fields:refs(fields.slice(6,9).map(row => row.id))},
      {id:'activity',label:'活动类',codeLabel:'活动编码',prefix:'ACT',enabled:true,fields:refs(fields.slice(9,12).map(row => row.id))}
    ];
    return {types,fields};
  }
  const leadPresetIds = ['leadLevel','intentionLevel','visitIntention','testDriveIntention','plannedVisitAt','plannedStoreName'];
  function presetField(typeOrId, id) {
    const fieldId = id === undefined ? typeOrId : typeOrId === 'lead' ? id : '';
    return leadPresetIds.includes(fieldId) ? defaults().fields.find(row => row.id === fieldId) || null : null;
  }

  function normalizeField(input) {
    if (!object(input) || !safeId(input.id)) return fail('字段标识无效，请重新添加');
    const label = text(input.label).trim(), key = businessKey(input.businessKey);
    if (!label || label.length > 40) return fail('字段名称必填，且不超过 40 字');
    if (!validBusinessKey(key)) return fail('业务字段编码不能超过 80 字，且不能包含控制字符');
    if (!fieldTypes.includes(input.type)) return fail('请选择有效的字段类型');
    if(input.intentProfileRole!==undefined && input.intentProfileRole!=='mapping-series')return fail('接口意向车系标识无效');
    if(input.intentProfileRole==='mapping-series' && (input.type!=='interface' || input.dictionaryId!==(intentProfile().seriesDictionaryId || 'd-mapping-series') || input.useQueryConditions===true || (input.depends || []).length))return fail('本次意向车系使用预置车系接口单选，无需关联其他字段，不能改为手工选项');
    let options = [];
    if (['select','multiselect'].includes(input.type)) {
      if (!Array.isArray(input.options) || !input.options.length || input.options.length > 50) return fail('选择字段需配置 1 至 50 个选项');
      const ids = new Set(), labels = new Set(), keys = new Set();
      for (const raw of input.options) {
        if (!object(raw)) return fail('请选择字段的选项格式无效');
        const id = text(raw.id), name = text(raw.label).trim(), externalKey = businessKey(raw.businessKey);
        if (!id || id.length > 80 || ['__proto__','prototype','constructor'].includes(id) || ids.has(id)) return fail('选项标识无效或重复，请重新添加');
        if (!name || name.length > 80 || labels.has(name.toLocaleLowerCase())) return fail('选项名称必填，且同一字段内不能重复');
        if (!validBusinessKey(externalKey) || (externalKey && keys.has(externalKey))) return fail('同一字段内的业务选项编码不能重复，且不能超过 80 字');
        options.push({id,label:name,businessKey:externalKey});
        ids.add(id); labels.add(name.toLocaleLowerCase()); if (externalKey) keys.add(externalKey);
      }
    } else if (Array.isArray(input.options) && input.options.length) return fail('非选项字段不能配置选项');
    let source = {};
    if (input.type === 'interface') {
      if (!safeId(input.dictionaryId)) return fail('请选择取数接口');
      if (typeof input.useQueryConditions !== 'boolean') return fail('请明确选择是否使用其他字段作为查询条件');
      if(!Array.isArray(input.depends))return fail('查询条件关联字段须为数组');
      const enabled = usesQueryConditions(input), dependencies = new Set();
      if(!enabled && (input.depends.length || input.parameterBinding!==undefined))return fail('独立查询不应配置关联字段或参数映射');
      if (enabled) {
        if(!object(input.parameterBinding)) return fail('请填写完整的查询条件参数映射');
        if(typeof input.parameterBinding.required!=='boolean') return fail('请明确选择有效的依赖要求');
        if (!Array.isArray(input.depends) || input.depends.length !== 1) return fail('请为查询条件选择一个关联字段');
        for (const id of input.depends) {
          if (!safeId(id) || id === input.id || dependencies.has(id)) return fail('查询条件不能重复或选择字段自身');
          dependencies.add(id);
        }
        const binding = parameterBinding(input);
        if (!parameterIdentifier(binding?.parameterName)) return fail('下游入参字段名须为 1 至 64 位字母、数字或下划线，且不能使用保留名称');
        if (!parameterIdentifier(binding?.sourceValueKey)) return fail('请选择上游取值字段');
        source.parameterBinding = {parameterName:binding.parameterName,sourceValueKey:binding.sourceValueKey,required:binding.required};
      }
      source = {dictionaryId:input.dictionaryId,useQueryConditions:enabled,depends:[...dependencies],...source};
    }
    const preset = presetField(input.id);
    if (preset && (preset.type !== input.type || JSON.stringify(options.map(row => [row.id,row.label])) !== JSON.stringify(preset.options.map(row => [row.id,row.label])))) return fail('预置线索统计字段的填写方式和选项不可修改');
    return {ok:true,row:{id:input.id,label,type:input.type,businessKey:key,options,enabled:input.enabled !== false,...source,...(isMappingSeriesField(input)?{intentProfileRole:'mapping-series'}:{})}};
  }
  function normalize(input) {
    if (!object(input) || !safeId(input.id)) return fail('业务分类标识无效，请重新打开后操作');
    const label = text(input.label).trim(), codeLabel = text(input.codeLabel).trim();
    if (!label || label.length > 40) return fail('业务名称必填，且不超过 40 字');
    if (!codeLabel || codeLabel.length > 40) return fail('业务编码名称必填，且不超过 40 字');
    if (!Array.isArray(input.fields) || input.fields.length > 30) return fail('每个业务分类最多配置 30 个字段');
    const ids = new Set(), fields = [];
    for (const item of input.fields) {
      if (!object(item) || !safeId(item.fieldId) || ids.has(item.fieldId)) return fail('分类字段无效或重复');
      const enabled = item.enabled !== false;
      fields.push({fieldId:item.fieldId,enabled,required:enabled && item.required === true}); ids.add(item.fieldId);
    }
    return {ok:true,row:{id:input.id,label,codeLabel,prefix:text(input.prefix || 'BIZ').slice(0,20),enabled:input.enabled !== false,fields}};
  }
  function validateScope(scope) {
    if (!object(scope) || typeof scope.enterpriseId !== 'string' || !scope.enterpriseId || typeof scope.tenantId !== 'string' || !scope.tenantId || !Array.isArray(scope.types) || !Array.isArray(scope.fields)) return false;
    const fields = new Set(), fieldNames = new Set(), fieldKeys = new Set();
    for (const row of scope.fields) {
      if(!object(row)||typeof row.enabled!=='boolean'||typeof row.businessKey!=='string'||!Array.isArray(row.options)||row.options.some(option=>!object(option)||typeof option.id!=='string'||typeof option.label!=='string'||typeof option.businessKey!=='string'))return false;
      const checked = normalizeField(row); if (!checked.ok) return false;
      const field = checked.row;
      if (fields.has(field.id) || fieldNames.has(field.label.toLocaleLowerCase()) || (field.businessKey && fieldKeys.has(field.businessKey))) return false;
      fields.add(field.id); fieldNames.add(field.label.toLocaleLowerCase()); if (field.businessKey) fieldKeys.add(field.businessKey);
    }
    if (scope.fields.filter(isMappingSeriesField).length > 1) return false;
    // Preserve unavailable source references for repair, while keeping the dependency graph structural.
    for (const field of scope.fields.filter(row => row.type === 'interface')) {
      if (activeDependencies(field).some(id=>!scope.fields.some(source=>source.id===id&&source.type==='interface'))) return false;
    }
    if (cycleError(scope.fields)) return false;
    const types = new Set(), typeNames = new Set();
    for (const row of scope.types) {
      if(!object(row)||typeof row.enabled!=='boolean'||typeof row.prefix!=='string'||!Array.isArray(row.fields)||row.fields.some(ref=>!object(ref)||typeof ref.enabled!=='boolean'||typeof ref.required!=='boolean'))return false;
      const checked = normalize(row); if (!checked.ok) return false;
      const category = checked.row;
      if (types.has(category.id) || typeNames.has(category.label.toLocaleLowerCase()) || category.fields.some(ref => !fields.has(ref.fieldId))) return false;
      if (category.enabled && category.fields.some(ref => ref.enabled && !scope.fields.find(field => field.id === ref.fieldId)?.enabled)) return false;
      types.add(category.id); typeNames.add(category.label.toLocaleLowerCase());
    }
    if(scope.retiredTypes!==undefined) {
      if(!Array.isArray(scope.retiredTypes))return false;
      const retiredIds=new Set();
      for(const archive of scope.retiredTypes) {
        if(!validRetiredType(archive)||types.has(archive.row.id)||retiredIds.has(archive.row.id))return false;
        retiredIds.add(archive.row.id);
      }
    }
    return true;
  }
  // Operational dependency checks apply to edits, not reads: older incomplete categories
  // must stay available to administrators so they can repair them.
  function categoryDependencyError(category, definitions, ignoreBindingCompatibility = false) {
    const byId = new Map(definitions.map(row => [row.id,row])), visible = new Set(category.fields.filter(ref => ref.enabled !== false).map(ref => ref.fieldId));
    const visited = new Set(), visiting = new Set();
    function visit(field) {
      if (visiting.has(field.id)) return '接口字段不能形成循环关联，请调整“' + field.label + '”的关联字段';
      if (visited.has(field.id)) return '';
      visiting.add(field.id);
      const configuration = fieldDependencyError(field,definitions,ignoreBindingCompatibility);
      if (configuration) return configuration;
      for (const id of parameterBinding(field)?.required===true?activeDependencies(field):[]) {
        const source = byId.get(id);
        if (!source || source.enabled === false || !visible.has(id)) return '“' + field.label + '”须同时显示关联字段“' + (source?.label || '字段已移除') + '”，请先开启关联字段，或关闭/移除依赖它的字段';
        const issue = visit(source); if (issue) return issue;
      }
      visiting.delete(field.id); visited.add(field.id); return '';
    }
    for (const id of visible) { const field = byId.get(id); if (field?.enabled !== false && field?.type === 'interface') { const issue = visit(field); if (issue) return issue; } }
    return '';
  }
  function visibleStoreDependencyIds(category, definitions) {
    return [...new Set(category.fields.filter(ref => ref?.enabled !== false).flatMap(ref => {
      const field = definitions.find(item => item?.id === ref?.fieldId);
      return field?.enabled !== false && interfaceKind(field) === 'store' && parameterBinding(field)?.required===true ? activeDependencies(field).filter(id => interfaceKind(definitions.find(row => row.id === id)) === 'series') : [];
    }))];
  }
  function categoryConfigurationIssue(category, definitions, ignoreBindingCompatibility = false) {
    const dependencies = visibleStoreDependencyIds(category,definitions);
    if (dependencies.length > 1) return '显示的门店字段关联了不同车系，请统一关联，或关闭/移除多余门店后只保留一个车系字段';
    const series = category.fields.filter(ref => { const field=definitions.find(field => field.id === ref.fieldId);return interfaceKind(field) === 'series' || isMappingSeriesField(field); });
    if (series.length > 1) return '本分类保留了多个意向车系字段，请只保留一个意向车系字段';
    return categoryDependencyError(category,definitions,ignoreBindingCompatibility);
  }
  function categoryBindingStatus(category,definitions) {
    if(!category)return {ok:false,compatibilityOnly:false,issues:[]};
    const issues=category.fields.filter(ref=>ref.enabled!==false).flatMap(ref=>{
      const field=definitions.find(row=>row.id===ref.fieldId);
      if(field?.enabled===false || !usesQueryConditions(field))return [];
      const source=definitions.find(row=>row.id===activeDependencies(field)[0]),checked=queryBindingCompatibility(field,source);
      return !checked.ok && bindingErrorCodes.has(checked.code)?[{...checked,fieldId:field.id,sourceFieldId:source?.id,sourceValueKey:parameterBinding(field)?.sourceValueKey,parameterName:parameterBinding(field)?.parameterName}]:[];
    });
    const issue=categoryConfigurationIssue(category,definitions);
    return {ok:!issue,compatibilityOnly:issues.length>0&&!categoryConfigurationIssue(category,definitions,true),issues,message:issue};
  }
  function bindingConfigurationStatus(type,source = {}) {
    const data=catalog(source,type);
    return data.ok?categoryBindingStatus(data.rows.find(row=>row.id===type),data.fields):{ok:false,compatibilityOnly:false,issues:[],message:data.message};
  }
  function load() {
    const raw = root.localStorage.getItem(storageKey);
    if (raw === null) return {raw,data:{version:storageVersion,revision:0,scopes:[]}};
    const data = JSON.parse(raw);
    if (!object(data) || data.version !== storageVersion || !Number.isSafeInteger(data.revision) || data.revision < 0 || !Array.isArray(data.scopes)) throw Error('Invalid business config store');
    return {raw,data};
  }
  function scopeBundle(data, scope) {
    const matches = data.scopes.filter(row => object(row) && sameScope(row,scope));
    // A malformed or duplicated tenant bundle must not make unrelated tenants unreadable.
    if (matches.length > 1) throw Error('Invalid business config scope');
    if (matches.some(row => !validateScope(row))) throw Error('Invalid business config scope');
    return matches[0] || null;
  }
  function validateCallScope(scope) {
    if(!object(scope)||!Array.isArray(scope.types)||!Array.isArray(scope.fields))return false;
    const byId=new Map(),names=new Set(),keys=new Set(),used=new Set();
    for(const field of scope.fields) {
      if(!object(field)||!safeId(field.id)||byId.has(field.id)||typeof field.label!=='string'||!field.label.trim()||field.label.length>40||!fieldTypes.includes(field.type)||
        field.enabled!==undefined&&typeof field.enabled!=='boolean'||field.businessKey!==undefined&&typeof field.businessKey!=='string')return false;
      const key=field.businessKey || '',name=field.label.toLocaleLowerCase();if(!validBusinessKey(key)||names.has(name)||key&&keys.has(key))return false;
      byId.set(field.id,field);names.add(name);if(key)keys.add(key);
      if(['select','multiselect'].includes(field.type)) {
        if(!Array.isArray(field.options)||!field.options.length||field.options.length>50)return false;
        const optionIds=new Set(),optionNames=new Set(),optionKeys=new Set();
        for(const option of field.options) {
          if(!object(option)||typeof option.id!=='string'||!option.id||option.id.length>80||['__proto__','prototype','constructor'].includes(option.id)||typeof option.label!=='string'||!option.label.trim()||option.label.length>80||optionIds.has(option.id)||optionNames.has(option.label.toLocaleLowerCase())||option.businessKey!==undefined&&typeof option.businessKey!=='string')return false;
          const code=option.businessKey || '';if(!validBusinessKey(code)||code&&optionKeys.has(code))return false;
          optionIds.add(option.id);optionNames.add(option.label.toLocaleLowerCase());if(code)optionKeys.add(code);
        }
      } else if(Array.isArray(field.options)&&field.options.length)return false;
      if(field.type==='interface' && (!safeId(field.dictionaryId)||field.useQueryConditions!==undefined&&typeof field.useQueryConditions!=='boolean'||field.depends!==undefined&&(!Array.isArray(field.depends)||field.depends.some(id=>!safeId(id)))))return false;
    }
    const categoryIds=new Set();
    for(const category of scope.types) {
      if(!normalize(category).ok||categoryIds.has(category.id)||category.fields.some(ref=>!byId.has(ref.fieldId)||typeof ref.enabled!=='boolean'||typeof ref.required!=='boolean'))return false;
      categoryIds.add(category.id);
      for(const ref of category.fields)if(ref.enabled&&byId.get(ref.fieldId).enabled!==false)used.add(ref.fieldId);
    }
    // A call owns its captured schema. Unreferenced library definitions are not
    // interpreted, upgraded or used to rewrite that call's active fields.
    const queue=[...used];
    while(queue.length) {
      const field=byId.get(queue.shift());if(field.type!=='interface')continue;
      if(typeof field.useQueryConditions!=='boolean'||!Array.isArray(field.depends))return false;
      if(!field.useQueryConditions) {if(field.depends.length||field.parameterBinding!==undefined)return false;continue;}
      const binding=field.parameterBinding;
      if(field.depends.length!==1||field.depends[0]===field.id||!object(binding)||!parameterIdentifier(binding.parameterName)||!parameterIdentifier(binding.sourceValueKey)||typeof binding.required!=='boolean')return false;
      const upstream=byId.get(field.depends[0]);if(upstream?.type!=='interface')return false;
      if(!used.has(upstream.id)){used.add(upstream.id);queue.push(upstream.id);}
    }
    return !cycleError(scope.fields.filter(field=>used.has(field.id)));
  }
  const callFormKey = 'businessFormVersion';
  function validRetiredType(archive) {
    if(!object(archive)||!object(archive.row)||typeof archive.row.enabled!=='boolean'||typeof archive.row.prefix!=='string'||
      typeof archive.deletedAt!=='string'||!Number.isFinite(Date.parse(archive.deletedAt))||typeof archive.deletedBy!=='string'||!archive.deletedBy||
      !Array.isArray(archive.fields)||archive.fields.some(field=>!object(field)||typeof field.enabled!=='boolean'||typeof field.businessKey!=='string'||!Array.isArray(field.options))||
      !validateCallScope({types:[archive.row],fields:archive.fields}))return false;
    const byId=new Map(archive.fields.map(field=>[field.id,field])),used=new Set(archive.row.fields.map(ref=>ref.fieldId)),queue=[...used];
    if(cycleError(archive.fields))return false;
    for(const field of archive.fields.filter(item=>item.type==='interface')) {
      if(typeof field.useQueryConditions!=='boolean'||!Array.isArray(field.depends))return false;
      if(!field.useQueryConditions) {if(field.depends.length||field.parameterBinding!==undefined)return false;continue;}
      const binding=field.parameterBinding,upstream=byId.get(field.depends[0]);
      if(field.depends.length!==1||field.depends[0]===field.id||upstream?.type!=='interface'||!object(binding)||!parameterIdentifier(binding.parameterName)||!parameterIdentifier(binding.sourceValueKey)||typeof binding.required!=='boolean')return false;
    }
    while(queue.length) {const field=byId.get(queue.shift());if(!field)return false;for(const id of activeDependencies(field))if(!used.has(id)){used.add(id);queue.push(id);}}
    return used.size===archive.fields.length;
  }
  function callOwner(source) {
    const phone=root.CustomerDirectory?.phoneOf?.(source) || (source?.direction==='呼入' ? source?.caller : source?.callee) || source?.customerPhone;
    const owner=Object.fromEntries(['enterpriseId','tenantId','accountId','callId'].map(key=>[key,text(source?.[key])])) ;
    owner.phone=text(phone);return Object.values(owner).every(Boolean) ? owner : null;
  }
  function formIntegrity(value) {
    const body=clone(value);delete body.integrity;const bytes=JSON.stringify(body);let hash=2166136261;
    for(let i=0;i<bytes.length;i++)hash=Math.imul(hash^bytes.charCodeAt(i),16777619);
    return (hash>>>0).toString(16).padStart(8,'0');
  }
  function liveFormSource(source = {}) {const live={...source};delete live[callFormKey];delete live.businessFormType;return live;}
  function archivedContext(source,type) {
    if(!source||!text(source.enterpriseId)||!text(source.tenantId)||!root.AppState?.authorizeObject?.('',source))return false;
    const saved=source.customerFollowup?.businessFieldSnapshot || source.businessFieldSnapshot;
    return source.businessType===type&&['callId','customerTaskItemId','taskId','recordId','id','batchId'].some(key=>typeof source[key]==='string'&&source[key].trim()) ||
      object(saved)&&saved.businessType===type&&Array.isArray(saved.fields)&&object(saved.values);
  }
  function archivedType(bundle,source,requestedType) {
    const saved=source.customerFollowup?.businessFieldSnapshot || source.businessFieldSnapshot,type=source.businessType || saved?.businessType;
    return (!requestedType||requestedType===type)&&archivedContext(source,type)?(bundle.retiredTypes||[]).find(item=>item.row.id===type)||null:null;
  }
  // Only exact existing business sources may start another call with a retired type.
  // Read-only lookup is intentionally broader so authorized historical views retain labels.
  function existingArchivedSource(source,type) {
    const owner=callOwner(source);if(!owner)return false;
    const exactScope=row=>object(row)&&!!text(row.enterpriseId)&&!!text(row.tenantId)&&sameScope(scopeOf(row),scopeOf(source));
    const matches=row=>exactScope(row)&&text(row.businessType)===type&&
      (root.CustomerDirectory?.phoneOf?.(row)||row.phone||(row.direction==='呼入'?row.caller:row.callee)||row.customerPhone)===owner.phone;
    try {
      const native=JSON.parse(root.localStorage.getItem('native-workbench-records-v1')||'[]');if(!Array.isArray(native))return false;
      const calls=[...native,...(root.CloudCallData?.calls||[])].filter(row=>exactScope(row)&&row.callId===source.callId);
      if(calls.length)return calls.every(row=>matches(row)&&row.accountId===owner.accountId);
      const itemId=text(source.customerTaskItemId),recordId=text(source.recordId||source.apiOrigin?.recordId||source.customerTaskItemId);
      if(!itemId&&!recordId)return false;
      const batches=JSON.parse(root.localStorage.getItem('customer-task-batches-v1')||'[]');if(!Array.isArray(batches))return false;
      const items=batches.filter(exactScope).flatMap(batch=>{
        if(!Array.isArray(batch.rows))throw Error('Invalid existing batch');
        return batch.rows.filter(row=>row?.id===itemId).map(row=>({...row,enterpriseId:batch.enterpriseId,tenantId:batch.tenantId,businessType:row.businessType||batch.businessType}));
      });
      if(items.length)return items.length===1&&matches(items[0]);
      const ledger=JSON.parse(root.localStorage.getItem('dcc-task-ledger-v1.1.0')||'{"schemaVersion":"1.1.0","tasks":{}}');
      if(!object(ledger)||ledger.schemaVersion!=='1.1.0'||!object(ledger.tasks))return false;
      const records=Object.values(ledger.tasks).filter(entry=>exactScope(entry?.task)&&(!source.taskId||entry.task.taskId===source.taskId)).flatMap(entry=>{
        if(!Array.isArray(entry.records))throw Error('Invalid existing task');
        return entry.records.filter(row=>row?.recordId===recordId).map(row=>({...row,enterpriseId:entry.task.enterpriseId,tenantId:entry.task.tenantId,businessType:row.businessType||entry.task.businessType}));
      });
      return records.length===1&&matches(records[0]);
    }catch(_){return false;}
  }
  function validBindingRecovery(version,type,repair) {
    const cause=repair.compatibilityRecovery,field=version.fields.find(row=>row.id===cause?.fieldId),row=version.rows.find(row=>row.id===type),binding=parameterBinding(field);
    if(!object(cause)||cause.version!==1||!repairBindingErrorCodes.has(cause.code)||!row?.fields.some(ref=>ref.fieldId===field?.id&&ref.enabled!==false)||field?.enabled===false||
      cause.sourceFieldId!==activeDependencies(field)[0]||cause.sourceValueKey!==binding?.sourceValueKey||cause.parameterName!==binding?.parameterName)return false;
    const declared=value=>object(value)&&['string','number','boolean'].includes(value.valueType)&&typeof value.valueDomain==='string'&&value.valueDomain.trim();
    if(!declared(cause.expected)||!declared(cause.actual)||cause.actual.key!==cause.sourceValueKey)return false;
    return cause.code==='unsupported_parameter'?cause.expected.key!==cause.parameterName:
      cause.code==='value_type_mismatch'?cause.expected.valueType!==cause.actual.valueType:
      cause.expected.valueType===cause.actual.valueType&&cause.expected.valueDomain!==cause.actual.valueDomain;
  }
  function callForm(source = {}) {
    if(!Object.hasOwn(source,callFormKey))return {present:false,ok:true};
    const version=source[callFormKey],owner=callOwner(source),scope=scopeOf(source);
    if(!allowed(scope) || !root.AppState?.authorizeObject?.('',source))return {present:true,...fail('当前通话或租户已不在可处理范围内')};
    try {
      if(!owner || !object(version) || version.version!==1 || typeof version.id!=='string' || !version.id || !object(version.owner) || Object.keys(owner).some(key=>version.owner[key]!==owner[key]) ||
        !Number.isSafeInteger(version.revision) || version.revision<0 || !Array.isArray(version.rows) || !Array.isArray(version.fields) || !object(version.initialIssues) || !object(version.repairs) || version.integrity!==formIntegrity(version) ||
        !validateCallScope({...scope,types:version.rows,fields:version.fields}))return {present:true,...fail('本次通话的表单版本不完整或与通话身份不一致，请保留当前填写并核对')};
      for(const [type,repair] of Object.entries(version.repairs)) {
        if((!version.initialIssues[type]&&!validBindingRecovery(version,type,repair)) || !object(repair) || repair.row?.id!==type || !Array.isArray(repair.fields) || !validateCallScope({...scope,types:[repair.row],fields:repair.fields}))return {present:true,...fail('本次通话的修复版本不完整，请保留当前填写并核对')};
      }
      return {present:true,ok:true,version:clone(version)};
    } catch (_) {return {present:true,...fail('本次通话的表单版本暂时无法读取，请保留当前填写并核对')};}
  }
  function captureCallForm(source) {
    const existing=callForm(source);if(existing.present)return existing.ok ? {ok:true,version:existing.version} : existing;
    const owner=callOwner(source);
    if(!owner || owner.accountId!==text(state().accountId) || !allowed(source) || !root.AppState?.authorizeObject?.('',source))return fail('无法确认本次通话的业务表单所属范围，请保留当前通话并核对');
    const data=catalog(liveFormSource(source));if(!data.ok)return data;
    if(data.retired===true&&!existingArchivedSource(source,source.businessType))return fail('该业务分类已删除，无法确认原有名单或通话来源；请保留当前内容并核对，不能用于新业务');
    const initialIssues=Object.fromEntries(data.rows.map(row=>[row.id,categoryConfigurationIssue(row,data.fields)]).filter(([,issue])=>issue));
    const version={version:1,id:newId('call-form'),owner,capturedAt:new Date().toISOString(),revision:data.revision,rows:clone(data.rows),fields:clone(data.fields),initialIssues,repairs:{}};
    version.integrity=formIntegrity(version);return {ok:true,version};
  }
  function missingCallFormStatus(source) {
    if(!source || root.AppState?.isReady?.()!==true || Object.hasOwn(source,callFormKey) || source.callSource!=='NATIVE_WORKBENCH' || source.processingStatus!=='待填写' ||
      state().activeDomain!=='CLOUD_CONTACT_CENTER' || callOwner(source)?.accountId!==text(state().accountId) ||
      !allowed(source) || !root.AppState?.authorizeObject?.('',source))return fail('当前通话不符合缺失表单的恢复条件');
    const data=catalog(source);if(!data.ok)return data;
    if(source.businessType && !data.rows.some(row=>row.id===source.businessType && row.enabled))return fail('本通业务分类当前不可用，请联系管理员修复后重试');
    const target=data.rows.find(row=>row.id===source.businessType),issue=target ? categoryConfigurationIssue(target,data.fields) : '';
    return issue ? fail('当前业务表单仍有配置问题，请联系管理员修复后重试：'+issue) : {ok:true,revision:data.revision};
  }
  function missingCallForm(source,expectedRevision) {
    const ready=missingCallFormStatus(source);if(!ready.ok)return ready;
    if(ready.revision!==expectedRevision)return fail('业务表单配置已更新，请重新打开记录后核对');
    return captureCallForm(source);
  }
  function acceptMissingCallForm(previous,updated) {
    const ready=missingCallFormStatus(previous),bound=callForm(updated);
    if(!ready.ok)return ready;
    if(!bound.present || !bound.ok || JSON.stringify(callOwner(previous))!==JSON.stringify(callOwner(updated)))return fail('本次恢复的表单与通话身份不一致');
    const current=captureCallForm(previous),actual=bound.version;
    if(!current.ok || actual.revision!==ready.revision || JSON.stringify(actual.rows)!==JSON.stringify(current.version.rows) ||
      JSON.stringify(actual.fields)!==JSON.stringify(current.version.fields) || JSON.stringify(actual.initialIssues)!==JSON.stringify(current.version.initialIssues) || Object.keys(actual.repairs).length ||
      Object.keys(actual).sort().join('|')!==Object.keys(current.version).sort().join('|'))return fail('恢复表单已变化，请重新打开记录后核对');
    return {ok:true};
  }
  function callFormRepairReason(source,type) {
    const bound=callForm(source);
    if(!bound.present||!bound.ok||!safeId(type)||bound.version.repairs[type])return null;
    if(bound.version.initialIssues[type])return {kind:'initial'};
    const status=categoryBindingStatus(bound.version.rows.find(row=>row.id===type),bound.version.fields);
    const issue=status.compatibilityOnly?status.issues.find(row=>repairBindingErrorCodes.has(row.code)&&row.expected&&row.actual):null;
    if(!issue || !['string','number','boolean'].includes(issue.expected.valueType) || !issue.expected.valueDomain || !['string','number','boolean'].includes(issue.actual.valueType) || !issue.actual.valueDomain)return null;
    return {kind:'binding',issue};
  }
  function callFormRepairable(source,type) {return !!callFormRepairReason(source,type);}
  function repairedCallForm(source,type) {
    const bound=callForm(source);if(!bound.present || !bound.ok)return bound.ok ? fail('本次通话尚未绑定表单版本') : bound;
    const reason=callFormRepairReason(source,type);
    if(!reason)return fail('本次通话的该分类已有有效版本，无需重新载入配置');
    const latest=catalog(liveFormSource(source));if(!latest.ok)return latest;
    const row=latest.rows.find(row=>row.id===type),issue=configurationIssue(type,liveFormSource(source));
    if(!row || issue)return fail('管理员尚未修复该业务分类，请保留当前填写并联系管理员'+(issue?'：'+issue:''));
    const version=bound.version;version.repairs[type]={row:clone(row),fields:clone(latest.fields),revision:latest.revision,appliedAt:new Date().toISOString()};
    if(reason.kind==='binding') {const {code,fieldId,sourceFieldId,sourceValueKey,parameterName,expected,actual}=reason.issue;version.repairs[type].compatibilityRecovery={version:1,code,fieldId,sourceFieldId,sourceValueKey,parameterName,expected,actual};}
    version.integrity=formIntegrity(version);return {ok:true,version};
  }
  function acceptCallFormRepair(previous,updated) {
    const before=callForm(previous),after=callForm(updated);
    if(!before.present || !after.present || !before.ok || !after.ok)return fail('无法确认本次通话的修复版本');
    const original=before.version,next=after.version,oldRepairs=original.repairs,newRepairs=next.repairs;
    const oldBase={...original,repairs:{}};delete oldBase.integrity;
    const newBase={...next,repairs:{}};delete newBase.integrity;
    const added=Object.keys(newRepairs).filter(type=>!Object.hasOwn(oldRepairs,type));
    if(JSON.stringify(oldBase)!==JSON.stringify(newBase) || added.length!==1 || Object.keys(oldRepairs).some(type=>JSON.stringify(oldRepairs[type])!==JSON.stringify(newRepairs[type])))return fail('本次修复不能替换已有效的通话表单版本');
    const type=added[0],active=previous.businessType || previous.businessFormType || updated.businessFormType;
    if(type!==active || !callFormRepairable(previous,type))return fail('只能重新载入本通确有配置问题的当前业务分类');
    const proposed=repairedCallForm(previous,type);if(!proposed.ok)return proposed;
    const expected=proposed.version.repairs[type],actual=newRepairs[type];
    if(JSON.stringify(expected.row)!==JSON.stringify(actual.row) || JSON.stringify(expected.fields)!==JSON.stringify(actual.fields) || expected.revision!==actual.revision || JSON.stringify(expected.compatibilityRecovery)!==JSON.stringify(actual.compatibilityRecovery))return fail('修复配置已更新，请重新载入后再试');
    return {ok:true,type};
  }
  function catalog(source = {}, requestedType) {
    const scope = scopeOf(source);
    if (!allowed(scope)) return {ok:false,rows:[],fields:[],message:'请选择当前账号下的使用租户',scope,context:context()};
    const bound=callForm(source);
    if(bound.present) {
      if(!bound.ok)return {...bound,rows:[],fields:[],scope,context:context()};
      const version=bound.version,type=requestedType || source.businessType || source.businessFormType || '',repair=version.repairs[type];
      return {ok:true,rows:clone(version.rows.map(row=>version.repairs[row.id]?.row || row)),fields:clone(repair?.fields || version.fields),scope,
        revision:version.id+':'+version.integrity,context:context(),callFormVersion:version.id};
    }
    try {
      const {data} = load(), bundle = scopeBundle(data,scope) || defaults(),archive=archivedType(bundle,source,requestedType);
      if(archive)return {ok:true,rows:[clone(archive.row)],fields:clone(archive.fields),scope,revision:data.revision,context:context(),retired:true};
      return {ok:true,rows:clone(bundle.types),fields:clone(bundle.fields),scope,revision:data.revision,context:context()};
    } catch (_) { return {ok:false,rows:[],fields:[],message:'业务配置暂时无法读取，请刷新后重试',scope,context:context()}; }
  }
  // Optional candidate supports the administrator's unsaved category preview.
  function configurationIssue(type, source = {}, candidate) {
    const data = catalog(source,type);
    if (!data.ok) return data.message;
    const category = candidate || data.rows.find(row => row.id === type);
    return category ? categoryConfigurationIssue(category,data.fields) : '';
  }
  // Read only: caller must already resolve an application identity. Never use the active UI tenant as fallback.
  function resolveImportType(type, source) {
    if (!source || !text(source.tenantId) || !text(source.enterpriseId)) return {ok:false,code:'INVALID_BUSINESS_SCOPE',message:'无法确认业务类型所属租户'};
    const scope = {tenantId:text(source.tenantId),enterpriseId:text(source.enterpriseId)};
    if (!(root.CloudCallData?.tenants || []).some(row => !row.builtIn && row.status === '启用' && sameScope(scopeOf(row),scope))) return {ok:false,code:'INVALID_BUSINESS_SCOPE',message:'业务租户不可用'};
    if (typeof type !== 'string' || !type) return {ok:false,code:'MISSING_BUSINESS_TYPE',message:'请提供业务类型编码'};
    if (!safeId(type)) return {ok:false,code:'INVALID_BUSINESS_TYPE',message:'业务类型编码无效'};
    try {
      const {data} = load(), bundle = scopeBundle(data,scope) || defaults();
      const row = bundle.types.find(item => item.id === type);
      if (!row) return (bundle.retiredTypes||[]).some(item=>item.row.id===type)?{ok:false,code:'BUSINESS_TYPE_DELETED',message:'该业务类型已删除，请选择当前可用的业务类型'}:{ok:false,code:'INVALID_BUSINESS_TYPE',message:'该租户未配置此业务类型'};
      if (!row.enabled) return {ok:false,code:'BUSINESS_TYPE_DISABLED',message:'该业务类型已停用，请选择已启用的类型'};
      return {ok:true,row:clone(row),scope};
    } catch (_) { return {ok:false,code:'BUSINESS_CONFIG_UNAVAILABLE',message:'业务配置暂时无法读取，请稍后重试'}; }
  }
  function fieldCatalog(source = {}) { const data = catalog(source); return {...data,rows:data.fields}; }
  function list(source = {}, includeDisabled = false) { return catalog(source).rows.filter(row => includeDisabled || row.enabled); }
  function get(type, source = {}) {
    if (!safeId(type)) return null;
    const row = catalog(source,type).rows.find(value => value.id === type); if (row) return row;
    // Preset labels remain available on a platform list before choosing a tenant.
    if (!source?.tenantId && superUser() && !allowed(source)) return defaults().types.find(value => value.id === type) || null;
    return null;
  }
  function getField(id, source = {}) { return safeId(id) ? catalog(source).fields.find(row => row.id === id) || null : null; }
  function fields(type, source = {}) {
    const data = catalog(source,type), category = data.rows.find(row => row.id === type);
    if (!data.ok || !category) return [];
    const byId = new Map(data.fields.map(row => [row.id,row]));
    return category.fields.filter(ref => ref.enabled).map(ref => {
      const definition = byId.get(ref.fieldId);
      return definition?.enabled ? {...definition,required:ref.required,enabled:true} : null;
    }).filter(Boolean);
  }
  function mappingSeriesField(source = {}, businessType = 'lead') { return fields(businessType,source).find(isMappingSeriesField) || null; }
  function optionLabel(field, value, source = {}) {
    const definition = typeof field === 'string' ? getField(field,source) : field;
    const options = definition?.options || [];
    const one = item => options.find(row => row.id === text(item))?.label || text(item);
    return Array.isArray(value) ? value.map(one).join('、') : one(value);
  }
  function importSnapshot(source = {}) {
    return Object.fromEntries(importedFields.filter(field => Object.hasOwn(source,field.key) && typeof source[field.key] === 'string').map(field => [field.key,source[field.key]]));
  }
  function importedDetail(source = {}) {
    const esc = root.PlatformUI.escape;
    return '<dl class="customer-followup-details" data-imported-customer-info>' + importedFields.map(field => {
      const value = typeof source[field.key] === 'string' && source[field.key].trim() ? source[field.key] : '';
      return '<div><dt>' + esc(field.label) + '</dt><dd' + (!value ? ' class="is-empty"' : '') + ' data-imported-field="' + field.key + '">' + esc(value || '未提供') + '</dd></div>';
    }).join('') + '</dl>';
  }
  function callbackSnapshot(values, source = {}) {
    const saved=clone(values||{});delete saved.businessFieldSnapshot;
    const type=typeof source.businessType==='string'&&source.businessType?source.businessType:text(saved.businessType);
    const definitions=fields(type,source);
    const selection=(raw,field)=>({code:text(raw?.code),name:text(raw?.name),...(typeof raw?.type==='string'?{type:raw.type}:{}),
      ...((isMappingSeriesField(field)||fieldCapability(field)?.id==='mapping-series')&&object(raw?.sourceValues)?{sourceValues:Object.fromEntries(['relation_id','media_car_series_id','car_state'].filter(key=>Object.hasOwn(raw.sourceValues,key)&&raw.sourceValues[key]!==undefined).map(key=>[key,clone(raw.sourceValues[key])]))}:{})});
    definitions.filter(field=>field.type==='interface').forEach(field=>{
      const raw=saved[field.id];
      if(selectionMode(field)==='multiple') {
        if(raw!==undefined&&raw!==null&&raw!==''&&!Array.isArray(raw))throw Error('接口多选值须为数组');
        saved[field.id]=(raw || []).map(value=>selection(value,field));
      } else {
        if(Array.isArray(raw)||raw!==undefined&&raw!==null&&raw!==''&&!object(raw))throw Error('接口单选值须为一个选择对象');
        saved[field.id]=object(raw)?selection(raw,field):'';
      }
    });
    return {businessType:type,businessTypeLabel:get(type,source)?.label || source.businessTypeLabel || '',values:saved,fields:definitions.map(field=>({fieldId:field.id,businessFieldCode:field.businessKey||'',fieldName:field.label,type:field.type,...(field.type==='interface'?{dictionaryId:field.dictionaryId,interfaceKind:interfaceKind(field),selectionMode:selectionMode(field)}:{}),value:clone(saved[field.id]??(field.type==='multiselect'||field.type==='interface'&&interfaceKind(field)==='store'?[]:'')),selectedOptions:['select','multiselect'].includes(field.type)?(Array.isArray(saved[field.id])?saved[field.id]:[saved[field.id]]).filter(value=>value!==undefined&&value!==null&&value!=='').map(value=>{const option=field.options.find(o=>o.id===String(value));return {optionId:String(value),businessOptionCode:option?.businessKey||'',optionName:option?.label||String(value)};}):[]})),savedBusinessVersion:saved.updatedAt||''};
  }
  function snapshot(source) { const value = source || {}; return {businessType:safeId(value.businessType) ? value.businessType : '',...(typeof value.businessTypeLabel === 'string' ? {businessTypeLabel:value.businessTypeLabel} : {}),externalDocumentId:text(value.externalDocumentId),...importSnapshot(value)}; }
  function typeLabel(source) { const saved=source?.customerFollowup?.businessFieldSnapshot;return (saved?.businessType===source?.businessType && saved.businessTypeLabel) || source?.businessTypeLabel || get(source?.businessType,source)?.label || ''; }
  function codeLabel(source) { return get(source?.businessType,source)?.codeLabel || '外部单据标识'; }
  function newId(prefix = 'field') { return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,9); }

  function mutate(source, options, change, commitGuard) {
    if (!canManage() || !allowed(source)) return fail('当前账号无权维护此租户的业务配置');
    if (options.expectedContext !== undefined && options.expectedContext !== context()) return fail('工作范围已变化，请重新打开后操作');
    let attempted=false,writtenRaw,previousRaw;const operationContext=context();
    try {
      const loaded = load();previousRaw=loaded.raw;
      if (options.expectedRevision !== undefined && options.expectedRevision !== loaded.data.revision) return fail('业务配置已更新，请重新打开后操作');
      const scope = scopeOf(source), next = clone(loaded.data);
      let target = scopeBundle(next,scope);
      if (!target) { target = {...scope,...defaults()}; next.scopes.push(target); }
      const result = change(target); if (!result.ok) return result;
      if (!validateScope(target)) return fail('业务配置校验失败，请核对关联关系后重试');
      if (root.localStorage.getItem(storageKey) !== loaded.raw) return fail('业务配置已更新，请重新打开后操作');
      if(commitGuard) {const fresh=commitGuard();if(!fresh.ok)return fresh;}
      next.revision++;const written=JSON.stringify(next);attempted=true;writtenRaw=written;root.localStorage.setItem(storageKey,written);
      if(commitGuard?.after) {
        if(context()!==operationContext||!canManage()||!allowed(source)||root.localStorage.getItem(storageKey)!==written)throw Error('Delete context or committed bytes changed');
        let after;try{after=commitGuard.after();}catch(_){after=fail('删除复核暂时无法完成，原配置已保留，请重试');}
        if(!after.ok) {
          try {
            if(root.localStorage.getItem(storageKey)!==written)throw Error('Concurrent configuration write');
            if(loaded.raw===null)root.localStorage.removeItem(storageKey);else root.localStorage.setItem(storageKey,loaded.raw);
          }catch(_){return fail('删除结果暂时无法确认，请保留当前页面并核对配置后重试');}
          return after;
        }
      }
      return {...result,revision:next.revision,scope};
    } catch (_) {
      if(commitGuard&&attempted) {
        try {
          const current=root.localStorage.getItem(storageKey);
          if(current===writtenRaw) {if(previousRaw===null)root.localStorage.removeItem(storageKey);else root.localStorage.setItem(storageKey,previousRaw);}
          else if(current!==previousRaw)return fail('删除结果暂时无法确认，请保留当前页面并核对配置后重试');
        }catch(_){return fail('删除结果暂时无法确认，请保留当前页面并核对配置后重试');}
      }
      return fail('业务配置未能保存，请保留填写内容并重试');
    }
  }
  function save(input, source = {}, options = {}) {
    const parsed = normalize(input); if (!parsed.ok) return parsed;
    return mutate(source,options,target => {
      const row = parsed.row;
      if((target.retiredTypes||[]).some(item=>item.row.id===row.id))return fail('该业务分类已删除，不能使用原标识重新启用；请新增其他分类');
      if (row.fields.some(ref => !target.fields.some(field => field.id === ref.fieldId))) return fail('业务分类引用了不存在的字段，请重新选择');
      if (row.fields.filter(ref => {const field=target.fields.find(field => field.id === ref.fieldId);return interfaceKind(field)==='series'||isMappingSeriesField(field);}).length > 1) return fail('每个业务分类只能配置一个意向车系字段（单选）');
      if (row.enabled && row.fields.some(ref => ref.enabled && !target.fields.find(field => field.id === ref.fieldId)?.enabled)) return fail('启用的业务分类不能显示已停用字段');
      if (target.types.some(item => item.id !== row.id && item.label.toLocaleLowerCase() === row.label.toLocaleLowerCase())) return fail('本租户已有同名业务分类，请修改名称');
      const dependencyError = categoryDependencyError(row,target.fields);
      if (dependencyError) return fail(dependencyError);
      const index = target.types.findIndex(item => item.id === row.id);
      if (index < 0) target.types.push(row); else target.types[index] = row;
      return {ok:true,row:clone(row),message:'业务分类已保存'};
    });
  }
  function saveField(input, source = {}, options = {}) {
    const parsed = normalizeField(input); if (!parsed.ok) return parsed;
    return mutate(source,options,target => {
      const row = parsed.row;
      const previous = target.fields.find(item => item.id === row.id);
      if(isMappingSeriesField(previous) && !isMappingSeriesField(row))return fail('本次意向车系为预置接口单选字段，不能移除接口车系标识或改为手工填写');
      if(isMappingSeriesField(row) && target.fields.some(field=>field.id!==row.id&&isMappingSeriesField(field)))return fail('本租户已有本次意向车系接口字段，请维护已有字段');
      if (row.type === 'interface') {
        const capability = fieldCapability(row), retainedSource = previous?.type === 'interface' && previous.dictionaryId === row.dictionaryId;
        if (!retainedSource && (!capability || !root.BusinessData?.available?.(row.dictionaryId,scopeOf(source)))) return fail('请选择当前租户已授权且启用的取数接口');
        const dependencyError = fieldDependencyError(row,[...target.fields.filter(field => field.id !== row.id),row]);
        if (dependencyError) {
          const compatible=queryBindingCompatibility(row,target.fields.find(field=>field.id===activeDependencies(row)[0]));
          return !compatible.ok&&compatible.message===dependencyError?compatible:fail(dependencyError);
        }
        const linked = target.fields.find(field => field.id === activeDependencies(row)[0]);
        if (linked?.enabled === false && !activeDependencies(previous).includes(linked.id)) return fail('请选择启用的关联接口字段');
      }
      const nextFields = [...target.fields.filter(field => field.id !== row.id),row];
      const circular = cycleError(nextFields); if (circular) return fail(circular);
      for (const dependent of nextFields.filter(field => activeDependencies(field).includes(row.id))) {
        const dependencyError = fieldDependencyError(dependent,nextFields);
        if (dependencyError) return fail('“' + dependent.label + '”正在使用此字段：' + dependencyError);
      }
      if (target.fields.some(item => item.id !== row.id && item.label.toLocaleLowerCase() === row.label.toLocaleLowerCase())) return fail('本租户已有同名字段，请修改名称');
      if (row.businessKey && target.fields.some(item => item.id !== row.id && item.businessKey === row.businessKey)) return fail('本租户已有相同的业务字段编码');
      if (!row.enabled && target.types.some(category => category.enabled && category.fields.some(ref => ref.fieldId === row.id && ref.enabled))) return fail('字段已被启用的业务分类显示，请先在分类中关闭显示');
      const index = target.fields.findIndex(item => item.id === row.id);
      if (index < 0) target.fields.push(row); else target.fields[index] = row;
      // Include every visible descendant, so A → B → C remains closed after editing A or B.
      const affectedIds = new Set([row.id]);
      let expanded = true;
      while (expanded) { expanded = false; for (const field of target.fields) if (!affectedIds.has(field.id) && activeDependencies(field).some(id => affectedIds.has(id))) { affectedIds.add(field.id); expanded = true; } }
      const affected = target.types.filter(category => category.fields.some(ref => ref.enabled !== false && affectedIds.has(ref.fieldId)));
      for (const category of affected) {
        const dependencyError = categoryConfigurationIssue(category,target.fields);
        if (dependencyError) return fail('业务分类“' + category.label + '”：' + dependencyError);
      }
      return {ok:true,row:clone(row),message:'自定义字段已保存'};
    });
  }
  function usage(kind,id,source = {}) {
    const denied=message=>({ok:false,canDelete:false,code:'unavailable',reason:message,message,refs:[],fingerprint:''});
    if(!['field','category'].includes(kind)||!safeId(id))return denied('删除目标无效，请重新选择');
    if(!canManage()||!allowed(source))return denied('当前账号无权维护此租户的业务配置');
    const guard=root.BusinessConfigurationUsage;
    if(typeof guard?.inspect!=='function')return denied('使用情况暂时无法核对，请保留配置并重试');
    try {
      const result=guard.inspect({kind,id,scope:scopeOf(source)});
      if(!object(result)||typeof result.ok!=='boolean'||typeof result.canDelete!=='boolean'||!Array.isArray(result.refs))return denied('使用情况暂时无法核对，请保留配置并重试');
      return {...result,message:result.reason || (result.canDelete?'当前未发现使用引用':'该配置仍被使用，不能删除')};
    }catch(_){return denied('使用情况暂时无法核对，请保留配置并重试');}
  }
  function deleteConfiguration(kind,id,source,options) {
    const inspected=usage(kind,id,source);
    if(!inspected.ok||!inspected.canDelete)return {...inspected,ok:false};
    if(options.expectedUsageFingerprint!==undefined&&options.expectedUsageFingerprint!==inspected.fingerprint)return fail('使用情况已变化，请重新查看引用并确认删除');
    const guard=root.BusinessConfigurationUsage;
    if(typeof guard?.verifyFresh!=='function'||!inspected.token)return fail('使用情况暂时无法复核，请保留配置并重试');
    const commitGuard=()=>{
      const fresh=guard.verifyFresh(inspected.token);
      return fresh?.ok&&fresh.canDelete?{ok:true}:{...fresh,ok:false,message:fresh?.reason || '使用情况已变化，请重新查看引用并确认删除'};
    };
    let archived=null;
    commitGuard.after=()=>{
      const after=guard.inspect({kind,id,scope:scopeOf(source)});
      if(kind==='category'&&after?.code==='UNKNOWN_TARGET') {
        try {const current=scopeBundle(load().data,scopeOf(source)),saved=(current?.retiredTypes||[]).find(item=>item.row.id===id);if(saved&&JSON.stringify(saved)===JSON.stringify(archived))return {ok:true};}catch(_){}
      }
      return kind==='field'&&after?.code==='UNKNOWN_TARGET'&&Array.isArray(after.refs)&&after.refs.every(ref=>ref.blocking===false)?{ok:true}:{...after,ok:false,message:after?.reason || '使用情况已变化，删除未完成，请重新核对'};
    };
    return mutate(source,options,target=>{
      const rows=kind==='field'?target.fields:target.types,index=rows.findIndex(row=>row.id===id);
      if(index<0)return fail('当前租户内没有此'+(kind==='field'?'字段':'业务分类'));
      if(kind==='field') {
        if(target.types.some(row=>row.fields.some(ref=>ref.fieldId===id)))return fail('字段已被业务分类使用，请先查看使用位置');
        if(target.fields.some(row=>activeDependencies(row).includes(id)))return fail('字段已被其他接口字段关联，请先查看使用位置');
      }else {
        const row=rows[index],ids=new Set(row.fields.map(ref=>ref.fieldId)),queue=[...ids];
        while(queue.length) {const fieldId=queue.shift(),field=target.fields.find(item=>item.id===fieldId);if(!field)return fail('分类字段暂时无法完整归档，请保留配置并核对');for(const upstream of activeDependencies(field))if(!ids.has(upstream)){ids.add(upstream);queue.push(upstream);}}
        archived={row:clone(row),fields:clone(target.fields.filter(field=>ids.has(field.id))),deletedAt:new Date().toISOString(),deletedBy:text(state().accountId)};
        (target.retiredTypes||=[]).push(archived);
      }
      rows.splice(index,1);return {ok:true,message:(kind==='field'?'自定义字段':'业务分类')+'已删除'};
    },commitGuard);
  }
  function deleteField(id, source = {}, options = {}) {return deleteConfiguration('field',id,source,options);}
  function deleteCategory(id, source = {}, options = {}) {return deleteConfiguration('category',id,source,options);}
  function setEnabled(id, enabled, source = {}, options = {}) {
    const row = get(id,source);
    return row ? save({...row,enabled:!!enabled},source,options) : fail('当前租户内没有此业务分类');
  }
  root.CustomerBusiness = Object.freeze({storageKey,storageVersion,fieldTypes:Object.freeze(fieldTypes),context,scopeOf,canManage,tenants,catalog,validRetiredType,callForm,captureCallForm,missingCallFormStatus,missingCallForm,acceptMissingCallForm,callFormRepairable,repairedCallForm,acceptCallFormRepair,liveFormSource,resolveImportType,fieldCatalog,list,get,getField,fields,isMappingSeriesField,mappingSeriesField,interfaceKind,queryConditions,usesQueryConditions,activeDependencies,selectionMode,returnFields,parameterBinding,queryBindingCompatibility,bindingConfigurationStatus,dependencyCompatible,categoryDependencyError,configurationIssue,optionLabel,importedFields,importSnapshot,importedDetail,callbackSnapshot,snapshot,typeLabel,codeLabel,newId,presetField,normalize,normalizeField,save,saveField,usage,deleteField,deleteCategory,setEnabled});
})(window);
