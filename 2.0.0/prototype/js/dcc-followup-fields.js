/* Defaults from DCC 培育任务 → 回访提交, with the confirmed 2.1 result choices. */
(() => {
  'use strict';

  const contactStatuses = ['已接通','客户拒绝','未接听','通话中','关机','停机','空号','错号'];
  const visitResults = [
    '下次回访','有意向','待考虑','已邀约到店','已预约试驾','已下订','已成交','无效线索','无意向',
    '拒接','请勿打扰','投诉','稍后回拨','短信跟进','号码失效','空号无效','错号','无人接听下发','休眠失联',
    '下发门店','试驾线索下发','意向线索下发','战败','休眠未购','无效结案','阶段性战败'
  ];
  const resultReasons = [
    '客户忙，改期联系','需家人商议','需要再了解','价格商谈中','已邀约到店','确认车型配置','金融方案沟通中',
    '对比竞品中','价格待考虑','需实地看车','已确定到店时间','需提前确认接待','已预约试驾时间','指定试驾车型',
    '线上已付订金','到店签约中','全款购车','贷款已批','置换完成','非本人','无购车需求','重复线索',
    '已购其他品牌','暂无购车计划','预算不符','对品牌无兴趣','明确拒接','态度恶劣','要求勿扰','已拉黑',
    '服务投诉','产品投诉','短时占线','未接听','未接通发短信','客户要求短信','停机','空号','错号',
    '手机响铃无人接听','忙音/秘书台','三天四次无法接通','用户要求不联系','其他'
  ];
  const cars = ['N6','N7','NX8','轩逸','天籁','逍客','奇骏','ARIYA艾睿雅','探陆'];
  const stores = [
    ['DLR-BJ-CY-002','北京东风日产朝阳店'],['DLR-BJ-LZ-001','北京东风南方丽泽（过渡）'],
    ['DLR-GD-GZ-001','广州东风日产天河店'],['DLR-GD-SZ-002','深圳东风日产南山店'],
    ['DLR-SH-PD-004','上海东风日产浦东店'],['DLR-ZJ-HZ-003','杭州东风日产西湖店'],
    ['DLR-SC-CD-005','成都东风日产高新店'],['B0139','北京东风南方丽泽'],
    ['J0413','重庆东风南方西南汽贸城'],['G2973','佛山吉泰'],['B0138','北京福源易众'],
    ['J1852','成都东风南方青羊苏坡'],['G3008','南宁恒信东顺'],['A0937','沈阳东风南方辽沈']
  ];
  const specs = [
    {key:'contactStatus',label:'接触状态',choices:contactStatuses,required:true},
    {key:'gender',label:'性别',choices:['男','女','未知']},
    {key:'visitResult',label:'回访结果',choices:visitResults,required:true},
    {key:'intentLevel',label:'意向级别',choices:['H','A','B','C','E','F','L','N']},
    {key:'altPhone',label:'备用电话',type:'text'},
    {key:'nextVisitTime',label:'下次回访时间',type:'datetime'},
    {key:'intentCar',label:'意向车辆',choices:cars,nissanOnlyChoices:true},
    {key:'intentStore',label:'意向门店',choices:stores,nissanOnlyChoices:true},
    {key:'purchaseType',label:'购车方式',choices:['全款','贷款/分期','置换','以租代购']},
    {key:'planBuyTime',label:'计划购买时间',choices:['7天内','15天内','1个月内','3个月内','半年内','1年内','暂无计划']},
    {key:'wecomStatus',label:'添加企微',choices:['已添加','未添加','客户拒绝','无需添加']},
    {key:'expectStoreTime',label:'预计到店时间',type:'datetime'},
    {key:'resultReason',label:'结果原因',choices:resultReasons},
    {key:'visitDesc',label:'回访描述',type:'textarea',required:true},
    {key:'remark',label:'备注信息',type:'textarea'}
  ];
  const leadCategories = [
    ['review21-retention','留资线索','clueid'],['review21-nurture','培育线索','hclueid']
  ];
  const defaultFollowupCategories = new Set(['lead','lxs',...leadCategories.map(([id])=>id)]);
  const categoryId = label => leadCategories.find(([,name])=>name===label)?.[0] || '';
  const categoryKind = (id,label) => leadCategories.find(([key])=>key===id)?.[1] || (categoryId(label)?label:'');
  const fieldKey = field => (specs.find(spec=>spec.key===field.businessKey || field.id==='review21-followup-'+spec.key) ||
    specs.find(spec=>field.label===spec.label))?.key || '';

  function findField(fields, spec) {
    const definitions = fields.filter(field => field.usage !== 'IMPORT');
    return definitions.find(field => field.businessKey === spec.key) ||
      definitions.find(field => field.label === spec.label);
  }

  function addDefinitions(bundle) {
    const usedIds = new Set(bundle.fields.map(field => field.id));
    for (const spec of specs) {
      if (findField(bundle.fields,spec)) continue;
      const baseId = 'review21-followup-' + spec.key;
      let id = baseId;
      for (let suffix = 2; usedIds.has(id); suffix++) id = baseId + '-' + suffix;
      const choices = spec.nissanOnlyChoices && bundle.brandId !== 'BRAND-NISSAN' ? [] : spec.choices || [];
      const options = choices.map(choice => {
        const [id,label] = Array.isArray(choice) ? choice : [choice,choice];
        return {id,label,businessKey:id};
      });
      bundle.fields.push({id,label:spec.label,type:spec.type || (options.length ? 'select' : 'text'),
        businessKey:spec.key,brandId:bundle.brandId,usage:'FOLLOWUP',enabled:true,options});
      usedIds.add(id);
    }
  }

  function addReferences(category, fields, rules) {
    const linked = new Set(category.fields.map(ref => ref.fieldId));
    for (const spec of specs) {
      const field = findField(fields,spec);
      if (!field || linked.has(field.id)) continue;
      const interfaceField = field.type === 'interface';
      if (interfaceField && rules.isSeries(field) &&
          fields.some(other => linked.has(other.id) && rules.isSeries(other))) continue;
      const ref = {fieldId:field.id,enabled:field.enabled !== false,required:false};
      if (interfaceField && ref.enabled && rules.configurationIssue({...category,fields:[...category.fields,ref]},fields)) {
        ref.enabled = false;
      }
      ref.required = ref.enabled && spec.required === true;
      category.fields.push(ref);
      linked.add(field.id);
    }
  }

  function applyDefaults(bundle, rules, existing) {
    if (!bundle.brandId) return bundle;
    for (const field of bundle.fields) {
      if (field.id.startsWith('review21-followup-visitResult') && Array.isArray(field.options)) {
        field.options = field.options.filter(option => option.businessKey !== '试驾排程下发');
      }
    }
    if (bundle.dccFollowupDefaults === 1) return bundle;
    addDefinitions(bundle);
    for (const category of bundle.types) {
      if (!defaultFollowupCategories.has(category.id) || rules.familyId(category) !== 'LEAD') continue;
      const previousCount = category.fields.length;
      addReferences(category,bundle.fields,rules);
      if (existing && category.fields.length !== previousCount) {
        category.configurationVersion = Number(category.configurationVersion || 1) + 1;
      }
    }
    bundle.dccFollowupDefaults = 1;
    return bundle;
  }

  function taskCatalog(record, native, context) {
    const tenant = context?.scope?.tenant;
    const active = native?.DNativeContext?.context;
    const model = native?.CustomerBusiness;
    if (!tenant || record.tenant!==context.scope.id || active?.account.id!==context.account.id ||
        active?.scope.id!==context.scope.id || active.scope.tenant?.brandId!==tenant.brandId ||
        active.scope.tenant?.enterpriseId!==tenant.enterpriseId || !model) return null;

    const source = {tenantId:context.scope.id,enterpriseId:tenant.enterpriseId,brandId:tenant.brandId};
    const data = model.catalog(source);
    if (!data.ok) return null;
    const linked = record.categoryContext;
    const id = linked || record.categoryId || categoryId(record.category);
    const row = data.rows.find(item=>item.id===id) ||
      (!linked && data.rows.filter(item=>item.label===record.category).length===1 && data.rows.find(item=>item.label===record.category));
    return {tenant,model,source,row,linked};
  }

  function taskForm(record, native, context) {
    const label = record.category || '业务分类待核对';
    const unavailable = message => ({label,fields:[],message});
    const catalog = taskCatalog(record,native,context);
    if (!catalog) return unavailable('暂时无法读取本任务的填写字段。');
    const {tenant,model,source,row,linked}=catalog;
    if (row) return {label:row.label,categoryId:row.id,fields:model.fields(row.id,source)};

    // The original demo tasks also work before an administrator opens the brand catalog.
    if (!linked && record.demoTask && categoryId(record.category) &&
        localStorage.getItem('d-contact-210-category-fixtures:'+tenant.brandId)!=='done') {
      const preset = {brandId:tenant.brandId,fields:[]};
      addDefinitions(preset);
      return {label,categoryId:categoryId(record.category),fields:preset.fields.map((field,index)=>({...field,required:specs[index].required===true}))};
    }
    return unavailable('该任务的分类填写字段暂未配置。');
  }

  function importSchema(record,native,context) {
    const catalog=taskCatalog(record,native,context);
    if (!catalog?.row) return null;
    const schema=catalog.model.importSchema(catalog.row.id,catalog.source);
    if (!schema?.ok) return null;
    return {...schema,fields:schema.fields.map(field=>({...field,key:field.key || field.id}))};
  }

  function adapt(html) {
    const replace = (before, after) => {
      const at = html.indexOf(before);
      if (at < 0 || html.indexOf(before, at + before.length) >= 0) {
        throw new Error('无法定位培育回访字段的配置位置');
      }
      html = html.slice(0, at) + after + html.slice(at + before.length);
    };
    replace('  function brandBundle(data,id,scope) {', `  const dccFollowup = root.parent.DReview21DccFollowupFields;
  const dccFollowupRules = {familyId, configurationIssue:categoryConfigurationIssue,
    isSeries:field => interfaceKind(field)==='series' || isMappingSeriesField(field)};
  function brandBundle(data,id,scope) {`);
    replace('return DUnifiedCategories.upgrade(rows[0]);}\n    return {...scope,brandId:id,...defaults(id)};',
      'return dccFollowup.applyDefaults(DUnifiedCategories.upgrade(rows[0]),dccFollowupRules,true);}\n    return dccFollowup.applyDefaults({...scope,brandId:id,...defaults(id)},dccFollowupRules,false);');
    replace('      const originalTypes=clone(target.types),originalFields=clone(target.fields);',
      '      dccFollowup.applyDefaults(target,dccFollowupRules,true);\n      const originalTypes=clone(target.types),originalFields=clone(target.fields);');
    replace("    if (!Array.isArray(input.fields) || input.fields.length > 30) return fail('每个业务分类最多配置 30 个字段');",
      `    const maxFields = familyId(input)==='LEAD' ? ${30 + specs.length} : 30;
    if (!Array.isArray(input.fields) || input.fields.length > maxFields) return fail('此分类最多配置 '+maxFields+' 个填写字段');`);
    return html;
  }

  const importAliases = Object.freeze({
    clueid:['clueId'],hclueid:['hclueId'],
    series:['intentionSeries','intentionSeriesName','carSeries','intentCar'],
    dealer:['intentionStoreName','intentStore','storeName'],
    smartCode:['SmartCode','smartcode'],channel:['channelCode'],project:['projectName'],
    firstIntakeAt:['leadCreatedAt'],initialSource:['initialClueSource']
  });
  const identifiers = new Set(['clueid','hclueid']);
  const legacyImportKeys = new Set([
    'name','phone','clueid','hclueid','needsNurture','initialSource','series','smartCode','project','channel','leadStatus',
    'reason','dealer','city','province','preScore','firstIntakeAt','intentionStoreCode','intentionStoreName','intentionSeriesCode',
    'intentionSeries','leadCreatedAt','initialPreScore','originalIntentCar','firstIntentLevel','firstLeadStatus','leadRemark','leadDesc'
  ]);
  const importValuePresent = value => Array.isArray(value) ? value.length>0 : value!=null && String(value).trim()!=='';

  function importedValue(record,field) {
    const key=field.businessKey || field.key;
    const aliases=[field.key,field.fieldId,key,...(importAliases[key] || [])].filter(Boolean);
    const source=record.businessImportSnapshot?.values || record.importedValues;
    if (source) {
      const found=aliases.find(alias=>Object.hasOwn(source,alias));
      if (found) return source[found];
    }
    if (record.businessImportSnapshot?.schema===1 || !legacyImportKeys.has(key)) return undefined;
    if (identifiers.has(key) && ((key==='clueid' && record.category==='留资线索') ||
        (key==='hclueid' && record.category==='培育线索'))) return record.originalKey;
    if (key==='needsNurture' && typeof record.needsNurture==='boolean') return record.needsNurture?'Y':'N';
    const legacyKeys=[key,...(importAliases[key] || [])];
    const found=legacyKeys.find(alias=>Object.hasOwn(record,alias) && importValuePresent(record[alias]));
    return found ? record[found] : undefined;
  }

  function formatFieldValue(field,value) {
    if (!importValuePresent(value)) return '';
    const one = item => {
      if (typeof item==='boolean') return item?'是':'否';
      if (!['string','number'].includes(typeof item)) return '';
      const key=String(item).trim();
      return field.options?.find(option=>[option.id,option.label,option.businessKey].some(alias=>alias!=null && String(alias)===key))?.label || key;
    };
    if (Array.isArray(value)) return value.map(one).filter(Boolean).join('、');
    return field.type==='multiselect'?String(value).split('|').map(one).filter(Boolean).join('、'):one(value);
  }

  function leadImports(record,native,context) {
    const snapshot=record.businessImportSnapshot;
    const fields=snapshot?.schema===1 && Array.isArray(snapshot.fields) ? snapshot.fields : importSchema(record,native,context)?.fields;
    return fields?.map(field=>({label:field.label,value:formatFieldValue(field,importedValue(record,field)),
      copy:identifiers.has(field.businessKey)})) || [];
  }

  window.DReview21DccFollowupFields = Object.freeze({adapt,applyDefaults,addReferences,leadCategories,categoryId,categoryKind,fieldKey,
    taskForm,importSchema,importedValue,leadImports});
})();
