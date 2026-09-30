/** Tenant-owned business categories and reusable field definitions. */
(function (root) {
  'use strict';
  const storageKey = 'customer-business-config-v3';
  const fieldTypes = ['text','textarea','number','select','multiselect','date','datetime'];
  const clone = value => JSON.parse(JSON.stringify(value));
  const text = value => value == null ? '' : String(value);
  const object = value => !!value && typeof value === 'object' && !Array.isArray(value);
  const safeId = value => typeof value === 'string' && /^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/.test(value) && !['__proto__','prototype','constructor'].includes(value);
  // Supplier/CRM keys are opaque strings. Do not coerce them to numbers: "001" is not "1".
  const businessKey = value => text(value).trim();
  const validBusinessKey = value => value.length <= 80 && !/[\u0000-\u001f\u007f]/.test(value);
  const state = () => root.AppState?.get?.() || {};
  const access = () => root.AppState?.effectiveAccess?.() || {};
  const superUser = () => access().roleCode === 'SUPER_ADMIN';
  const context = () => JSON.stringify([state().accountId,state().sessionId,state().enterpriseId,state().tenantId,state().activeDomain,access().roleCode,access().valid]);
  const ready = () => access().valid === true && state().activeDomain === 'CLOUD_CONTACT_CENTER';
  const canManage = () => ready() && ['ADMIN','SUPER_ADMIN'].includes(access().roleCode);
  const scopeOf = (source = {}) => ({enterpriseId:text(source?.enterpriseId || state().enterpriseId),tenantId:text(source?.tenantId || state().tenantId)});
  const sameScope = (a,b) => a.enterpriseId === b.enterpriseId && a.tenantId === b.tenantId;
  const fail = message => ({ok:false,message});

  function tenants() {
    if (!ready()) return [];
    return (root.CloudCallData?.tenants || []).filter(row => !row.builtIn && text(row.enterpriseId) === text(state().enterpriseId) && row.status === '启用' && (row.capabilitySet || []).includes('CLOUD_CONTACT_CENTER') && (superUser() || text(row.tenantId) === text(state().tenantId)) && root.AppState.authorizeObject('',row)).map(clone);
  }
  function allowed(source) { const scope = scopeOf(source); return tenants().some(row => sameScope(scopeOf(row),scope)); }

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
      field('interestedItems','感兴趣的活动','multiselect',['到店体验','试驾体验','车主活动'])
    ];
    const refs = ids => ids.map(fieldId => ({fieldId,enabled:true,required:false}));
    const types = [
      {id:'lead',label:'线索类',codeLabel:'线索编码',prefix:'LEAD',enabled:true,fields:refs(fields.slice(0,6).map(row => row.id))},
      {id:'aftersales',label:'售后类',codeLabel:'售后单号',prefix:'AS',enabled:true,fields:refs(fields.slice(6,9).map(row => row.id))},
      {id:'activity',label:'活动类',codeLabel:'活动编码',prefix:'ACT',enabled:true,fields:refs(fields.slice(9).map(row => row.id))}
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
    const preset = presetField(input.id);
    if (preset && (preset.type !== input.type || JSON.stringify(options.map(row => [row.id,row.label])) !== JSON.stringify(preset.options.map(row => [row.id,row.label])))) return fail('预置线索统计字段的填写方式和选项不可修改');
    if (preset && input.enabled === false) return fail('预置线索统计字段不能在字段库停用，可在业务分类中关闭显示');
    return {ok:true,row:{id:input.id,label,type:input.type,businessKey:key,options,enabled:input.enabled !== false}};
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
  function hasLeadFields(category) { return leadPresetIds.every(id => category?.fields.some(ref => ref.fieldId === id)); }
  function validateScope(scope) {
    if (!object(scope) || typeof scope.enterpriseId !== 'string' || !scope.enterpriseId || typeof scope.tenantId !== 'string' || !scope.tenantId || !Array.isArray(scope.types) || !Array.isArray(scope.fields)) return false;
    const fields = new Set(), fieldNames = new Set(), fieldKeys = new Set();
    for (const row of scope.fields) {
      const checked = normalizeField(row); if (!checked.ok) return false;
      const field = checked.row;
      if (fields.has(field.id) || fieldNames.has(field.label.toLocaleLowerCase()) || (field.businessKey && fieldKeys.has(field.businessKey))) return false;
      fields.add(field.id); fieldNames.add(field.label.toLocaleLowerCase()); if (field.businessKey) fieldKeys.add(field.businessKey);
    }
    // The six reporting dimensions always retain stable internal IDs and option values.
    if (!leadPresetIds.every(id => fields.has(id))) return false;
    const types = new Set(), typeNames = new Set();
    for (const row of scope.types) {
      const checked = normalize(row); if (!checked.ok) return false;
      const category = checked.row;
      if (types.has(category.id) || typeNames.has(category.label.toLocaleLowerCase()) || category.fields.some(ref => !fields.has(ref.fieldId))) return false;
      if (category.id === 'lead' && !hasLeadFields(category)) return false;
      if (category.enabled && category.fields.some(ref => ref.enabled && !scope.fields.find(field => field.id === ref.fieldId)?.enabled)) return false;
      types.add(category.id); typeNames.add(category.label.toLocaleLowerCase());
    }
    return true;
  }
  function load() {
    const raw = root.localStorage.getItem(storageKey);
    if (raw === null) return {raw,data:{version:3,revision:0,scopes:[]}};
    const data = JSON.parse(raw), keys = new Set();
    if (!object(data) || data.version !== 3 || !Number.isSafeInteger(data.revision) || data.revision < 0 || !Array.isArray(data.scopes)) throw Error('Invalid business config store');
    data.scopes.forEach(scope => {
      const key = JSON.stringify([scope.enterpriseId,scope.tenantId]);
      if (!validateScope(scope) || keys.has(key)) throw Error('Invalid business config scope');
      keys.add(key);
    });
    return {raw,data};
  }
  function catalog(source = {}) {
    const scope = scopeOf(source);
    if (!allowed(scope)) return {ok:false,rows:[],fields:[],message:'请选择当前账号下的使用租户',scope,context:context()};
    try {
      const {data} = load(), bundle = data.scopes.find(row => sameScope(row,scope)) || defaults();
      return {ok:true,rows:clone(bundle.types),fields:clone(bundle.fields),scope,revision:data.revision,context:context()};
    } catch (_) { return {ok:false,rows:[],fields:[],message:'业务配置暂时无法读取，请刷新后重试',scope,context:context()}; }
  }
  function fieldCatalog(source = {}) { const data = catalog(source); return {...data,rows:data.fields}; }
  function list(source = {}, includeDisabled = false) { return catalog(source).rows.filter(row => includeDisabled || row.enabled); }
  function get(type, source = {}) {
    if (!safeId(type)) return null;
    const row = list(source,true).find(value => value.id === type); if (row) return row;
    // Preset labels remain available on a platform list before choosing a tenant.
    if (!source?.tenantId && superUser() && !allowed(source)) return defaults().types.find(value => value.id === type) || null;
    return null;
  }
  function getField(id, source = {}) { return safeId(id) ? catalog(source).fields.find(row => row.id === id) || null : null; }
  function fields(type, source = {}) {
    const data = catalog(source), category = data.rows.find(row => row.id === type);
    if (!data.ok || !category) return [];
    const byId = new Map(data.fields.map(row => [row.id,row]));
    return category.fields.filter(ref => ref.enabled).map(ref => {
      const definition = byId.get(ref.fieldId);
      return definition?.enabled ? {...definition,required:ref.required,enabled:true} : null;
    }).filter(Boolean);
  }
  function optionLabel(field, value, source = {}) {
    const definition = typeof field === 'string' ? getField(field,source) : field;
    const options = definition?.options || [];
    const one = item => options.find(row => row.id === text(item))?.label || text(item);
    return Array.isArray(value) ? value.map(one).join('、') : one(value);
  }
  function snapshot(source) { const value = source || {}; return {businessType:get(value.businessType,value) ? value.businessType : '',externalDocumentId:text(value.externalDocumentId)}; }
  function typeLabel(source) { return get(source?.businessType,source)?.label || ''; }
  function codeLabel(source) { return get(source?.businessType,source)?.codeLabel || '外部单据标识'; }
  function newId(prefix = 'field') { return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,9); }

  function mutate(source, options, change) {
    if (!canManage() || !allowed(source)) return fail('当前账号无权维护此租户的业务配置');
    if (options.expectedContext !== undefined && options.expectedContext !== context()) return fail('工作范围已变化，请重新打开后操作');
    try {
      const loaded = load();
      if (options.expectedRevision !== undefined && options.expectedRevision !== loaded.data.revision) return fail('业务配置已更新，请重新打开后操作');
      const scope = scopeOf(source), next = clone(loaded.data);
      let target = next.scopes.find(row => sameScope(row,scope));
      if (!target) { target = {...scope,...defaults()}; next.scopes.push(target); }
      const result = change(target); if (!result.ok) return result;
      if (!validateScope(target)) return fail('业务配置校验失败，请核对关联关系后重试');
      if (root.localStorage.getItem(storageKey) !== loaded.raw) return fail('业务配置已更新，请重新打开后操作');
      next.revision++; root.localStorage.setItem(storageKey,JSON.stringify(next));
      return {...result,revision:next.revision,scope};
    } catch (_) { return fail('业务配置未能保存，请保留填写内容并重试'); }
  }
  function save(input, source = {}, options = {}) {
    const parsed = normalize(input); if (!parsed.ok) return parsed;
    return mutate(source,options,target => {
      const row = parsed.row;
      if (row.fields.some(ref => !target.fields.some(field => field.id === ref.fieldId))) return fail('业务分类引用了不存在的字段，请重新选择');
      if (row.id === 'lead' && !hasLeadFields(row)) return fail('线索类须保留六个预置统计字段，可在分类中关闭显示');
      if (row.enabled && row.fields.some(ref => ref.enabled && !target.fields.find(field => field.id === ref.fieldId)?.enabled)) return fail('启用的业务分类不能显示已停用字段');
      if (target.types.some(item => item.id !== row.id && item.label.toLocaleLowerCase() === row.label.toLocaleLowerCase())) return fail('本租户已有同名业务分类，请修改名称');
      const index = target.types.findIndex(item => item.id === row.id);
      if (index < 0) target.types.push(row); else target.types[index] = row;
      return {ok:true,row:clone(row),message:'业务分类已保存'};
    });
  }
  function saveField(input, source = {}, options = {}) {
    const parsed = normalizeField(input); if (!parsed.ok) return parsed;
    return mutate(source,options,target => {
      const row = parsed.row;
      if (target.fields.some(item => item.id !== row.id && item.label.toLocaleLowerCase() === row.label.toLocaleLowerCase())) return fail('本租户已有同名字段，请修改名称');
      if (row.businessKey && target.fields.some(item => item.id !== row.id && item.businessKey === row.businessKey)) return fail('本租户已有相同的业务字段编码');
      if (!row.enabled && target.types.some(category => category.enabled && category.fields.some(ref => ref.fieldId === row.id && ref.enabled))) return fail('字段已被启用的业务分类显示，请先在分类中关闭显示');
      const index = target.fields.findIndex(item => item.id === row.id);
      if (index < 0) target.fields.push(row); else target.fields[index] = row;
      return {ok:true,row:clone(row),message:'自定义字段已保存'};
    });
  }
  function deleteField(id, source = {}, options = {}) {
    return mutate(source,options,target => {
      const index = target.fields.findIndex(row => row.id === id);
      if (index < 0) return fail('当前租户内没有此字段');
      if (presetField(id)) return fail('预置线索统计字段不可删除，可在业务分类中关闭显示');
      if (target.types.some(row => row.fields.some(ref => ref.fieldId === id))) return fail('字段已被业务分类使用，请先从分类中移除');
      target.fields.splice(index,1); return {ok:true,message:'自定义字段已删除'};
    });
  }
  function setEnabled(id, enabled, source = {}, options = {}) {
    const row = get(id,source);
    return row ? save({...row,enabled:!!enabled},source,options) : fail('当前租户内没有此业务分类');
  }
  root.CustomerBusiness = Object.freeze({storageKey,fieldTypes:Object.freeze(fieldTypes),context,scopeOf,canManage,tenants,catalog,fieldCatalog,list,get,getField,fields,optionLabel,snapshot,typeLabel,codeLabel,newId,presetField,normalize,normalizeField,save,saveField,deleteField,setEnabled});
})(window);
