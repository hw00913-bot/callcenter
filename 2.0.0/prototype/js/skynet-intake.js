(() => {
  'use strict';

  const config = window.DSkynetIntakeFixtures;
  const settings = window.DSkynetConfig;
  const sources = Object.freeze([
    {value:config.sourceApplicationId,label:config.source}, {value:'PARTNER-A',label:'合作方 A'}
  ].map(Object.freeze));
  const fileBatchSource = Object.freeze({value:'MANUAL-BATCH',label:'手工导入'});
  const workbenchSampleSource = Object.freeze({value:'WORKBENCH-DEMO',label:'坐席工作台模拟'});
  const closedTasks = new Set(['已完成','已归档','已结案','已撤回','已取消','已结束']);
  const deliveryActions = new Set(['进入下发判断','不经培育直接下发']);
  const followupEvents = new Set(['回访完成','当前轮完成']);
  const roundCompleteEvent = settings.roundCompleteEvent || '本轮培育完成';
  const nurturingActions = new Set(['人工外呼','AI 外呼','预外呼','企微培育']);
  const historyLabels = {matched:'命中', unmatched:'未命中', noHistory:'无历史', missing:'缺少判定数据'};
  const nurtureDecisionLabels = {
    matched:'已选定最高优先级的命中规则', missing:'高优先级规则缺少判定数据，预计转待处理',
    notMatched:'未命中可执行规则，预计转待处理', notApplicable:'当前样例未进入培育判断',
    unavailable:'在途任务绑定的培育版本不可用', retained:'在途任务沿用原培育版本和动作'
  };
  const nurtureDestinations = {
    '人工外呼':{destination:'分配审核',status:'待分配',requiredMode:'人工外呼'},
    'AI 外呼':{destination:'AI 外呼待办',status:'待AI外呼',requiredMode:'AI 外呼'},
    '预外呼':{destination:'预外呼待办',status:'待预外呼',requiredMode:'预外呼'},
    '企微培育':{destination:'企微培育待办',status:'待企微培育',requiredMode:'企微培育'},
    '结束培育':{destination:'已结束',status:'已结束',requiredMode:''},
    '转待处理':{destination:'待处理队列',status:'待处理',requiredMode:''},
    '进入下发判断':{destination:'待坐席手动下发',status:'待下发',requiredMode:''},
    '不经培育直接下发':{destination:'待坐席手动下发',status:'待下发',requiredMode:''},
    '转冷线索':{destination:'冷线索分配规则',status:'已结束',requiredMode:''}
  };
  const clean = value => typeof value === 'string' ? value.trim() : '';
  const phoneNumber = value => clean(value).replace(/[\s()-]/g,'').replace(/^(?:\+?86|0086)(?=1[3-9]\d{9}$)/,'');
  const isTask = record => Boolean(record?.skynet?.roundId);
  const categoryOf = record => record.categoryId ?? config.categoryId;
  const reachedDelivery = record => Boolean(record.skynet?.delivery) ||
    ['待下发','待下发审核','已下发'].includes(record.taskStatus) || record.skynet?.endReason === '已下发';
  const inNurture = record => !closedTasks.has(record.taskStatus) && !reachedDelivery(record);
  const accountScope = context => [
    context?.account?.id, context?.scope?.id, context?.scope?.tenant?.brandId
  ];

  function activeContext(context) {
    const expected = accountScope(context);
    const current = window.DSession.context();
    const actual = accountScope(current);
    if (current?.scope?.kind !== 'tenant' || context?.scope?.kind !== 'tenant' ||
        !expected.every((value,index) => value && value === actual[index]) ||
        !window.DRolePermissions.moduleEnabled('cloud',current)) return null;
    return current;
  }

  function inScope(context, record) {
    const current = activeContext(context);
    return Boolean(current && record?.tenant === current.scope.id && record.brandId === current.scope.tenant.brandId);
  }

  function assignmentRuleInScope(rule,context) {
    return Boolean(rule && (!rule.tenantId || rule.tenantId === context.scope.id) &&
      (!rule.brandId || rule.brandId === context.scope.tenant.brandId));
  }

  function canRead(context, receipt) {
    const current = activeContext(context);
    return Boolean(current && /_(admin|ops)$/.test(window.DSession.roleKey(current)) &&
      window.DSession.allowed('PAGE-2204',current) && (!receipt || inScope(current,receipt)));
  }

  function submitter(context) {
    const current = activeContext(context);
    if (!current || !/_admin$/.test(window.DSession.roleKey(current)) ||
        !window.DSession.allowed('PAGE-2226',current) || !window.DSession.can('F26',current)) return null;
    return current;
  }

  const canSubmit = context => Boolean(submitter(context));

  const sequenceFields = {
    task:{collection:'records',key:'taskId',format:/^TW-TASK-(?:.+-)?(\d+)$/},
    lead:{collection:'records',key:'id',format:/^TW-LEAD-(\d+)$/},
    receipt:{collection:'skynetReceipts',key:'id',format:/^TW-RJ-(\d+)$/}
  };

  function sequenceFloor(state, kind, rows) {
    const {collection,key,format} = sequenceFields[kind];
    const existing = rows || state[collection] || [];
    const saved = state.skynetSequences?.[kind];
    let highest = Math.max(Number.isSafeInteger(saved) ? saved : 0,existing.length);
    for (const row of existing) {
      const number = Number(format.exec(row?.[key])?.[1]);
      if (Number.isSafeInteger(number)) highest = Math.max(highest,number);
    }
    return highest;
  }

  function reserveSkynetSequences(state) {
    const counters = Object.fromEntries(Object.keys(sequenceFields).map(kind => [kind,sequenceFloor(state,kind)]));
    state.skynetSequences = {...state.skynetSequences,...counters};
    return counters;
  }

  function nextId(state, kind, prefix, rows) {
    const number = sequenceFloor(state,kind,rows) + 1;
    state.skynetSequences = {...state.skynetSequences,[kind]:number};
    return prefix + String(number).padStart(3,'0');
  }

  function start(state, context, input) {
    const current = submitter(context);
    if (!current || state?.tenant !== current.scope.id) return {error:'当前租户或账号没有模拟接入权限。'};
    const requestId = clean(input?.requestId);
    if (!requestId || requestId.length > 100) return {error:'请输入 1 至 100 字的请求标识。'};
    const source = input?.sourceApplicationId === undefined ? sources[0] :
      input.sourceApplicationId === fileBatchSource.value ? fileBatchSource : sources.find(item => item.value === input.sourceApplicationId);
    if (!source) return {error:'请选择当前可用的来件来源。'};
    const receipts = state.skynetReceipts || [];
    const recorded = receipts.find(receipt => receipt.tenant === state.tenant &&
      receipt.sourceApplicationId === source.value && receipt.requestId === requestId);
    if (recorded) {
      return inScope(current,recorded) ? {receipt:recorded,duplicate:true} : {error:'原来件不在当前品牌范围。'};
    }
    const assignmentRuleId = clean(input.assignmentRuleId);
    if (!assignmentRuleId) return {error:'必须传入分配规则 ID。'};
    const rule = settings.ruleById(settings.read(state),assignmentRuleId);
    if (!assignmentRuleInScope(rule,current)) return {error:'所选分配规则在当前租户不可用。'};
    if (input.categoryId !== undefined && input.categoryId !== rule.categoryId) {
      return {error:'所选分配规则与来件二级分类不一致。'};
    }
    const businessType = settings.businessType(current,rule.categoryId);
    if (!businessType) return {error:'请选择当前目录中可用的二级分类。'};
    const receipt = makeReceipt(state,current,input,requestId,receipts,businessType,source);
    Object.assign(receipt,assignmentRuleBinding(rule));
    state.skynetReceipts = [receipt,...receipts];
    return {receipt,duplicate:false};
  }

  function intakeValues(inputProfile, input) {
    return Object.fromEntries(inputProfile.fields.map(field => {
      const value = input[field.key];
      return [field.key,field.type === 'multiselect' && Array.isArray(value) ?
        value.filter(item => typeof item === 'string') : typeof value === 'string' ? value : ''];
    }));
  }

  function makeReceipt(state, context, input, requestId, receipts, businessType, source = sources[0]) {
    const inputProfile = structuredClone(settings.intakeFieldProfile(context,businessType.value));
    const values = intakeValues(inputProfile,input);
    const sourceLeadCode = clean(values.originalKey) || null;
    return {
      id:nextId(state,'receipt','TW-RJ-',receipts), tenant:state.tenant, brandId:context.scope.tenant.brandId,
      requestId, sourceApplicationId:source.value, source:source.label,
      category:businessType.label, categoryId:businessType.value, originalKey:sourceLeadCode || '',
      leadKind:'native',sourceLeadCode,localLeadCode:sourceLeadCode,values,inputProfile,
      historyCase:config.historyCases.some(option => option.value === input.historyCase) ? input.historyCase : 'empty',
      status:'处理中', reason:'已登记来件，等待串行清洗。', trace:[], receivedAt:new Date().toISOString()
    };
  }

  function validLocalTime(value) {
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return false;
    const time = Date.parse(value + '+08:00');
    return Number.isFinite(time) && new Date(time + 8 * 3600000).toISOString().slice(0,16) === value;
  }

  function validDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const time = Date.parse(value + 'T00:00:00Z');
    return Number.isFinite(time) && new Date(time).toISOString().slice(0,10) === value;
  }

  function canonicalOption(field, value) {
    const options = field.options || [];
    const exact = options.filter(option => option.value === value);
    if (exact.length) return exact.length === 1 ? exact[0] : undefined;
    const aliases = options.filter(option => option.aliases?.includes(value));
    return aliases.length === 1 ? aliases[0] : undefined;
  }

  function fieldsForRule(profile, node) {
    const legacyRequired = Array.isArray(node?.requiredFields) ? new Set(node.requiredFields) : null;
    return legacyRequired ?
      profile.fields.map(field => ({...field,required:field.key === 'originalKey' || legacyRequired.has(field.key)})) : profile.fields;
  }

  function multiselectValues(value) {
    return (Array.isArray(value) ? value : clean(value).split('|')).map(clean).filter(Boolean);
  }

  function scalarFieldValue(field, value) {
    if (field.type === 'phone') {
      const phone = phoneNumber(value);
      return /^1[3-9]\d{9}$/.test(phone) ? phone : null;
    }
    if (field.type === 'datetime-local') return validLocalTime(value) ? value : null;
    if (field.type === 'date') return validDate(value) ? value : null;
    if (field.type === 'number') {
      const number = Number(value);
      return /^[+-]?(?:\d*\.\d+|\d+\.?\d*)(?:e[+-]?\d+)?$/i.test(value) && Number.isFinite(number) ? String(number) : null;
    }
    return value;
  }

  function mapFields(receipt, fields) {
    const mapped = {};
    const errors = [];
    for (const field of fields) {
      const multiple = field.type === 'multiselect';
      const raw = receipt.values[field.key];
      const values = multiple ? multiselectValues(raw) : [clean(raw)].filter(Boolean);
      if (!values.length) {
        if (field.required) errors.push(field.label + '缺失');
        continue;
      }
      if (multiple || field.type === 'select') {
        const selected = values.map(value => canonicalOption(field,value)?.value);
        if (selected.some(value => value === undefined)) errors.push(field.label + '不在配置字典内');
        else mapped[field.key] = multiple ? [...new Set(selected)] : selected[0];
      } else {
        const value = scalarFieldValue(field,values[0]);
        if (value === null) errors.push(field.label + '格式无效');
        else mapped[field.key] = value;
      }
    }
    return {mapped,errors};
  }

  function validateImportValues(profile, input) {
    return mapFields({values:intakeValues(profile,input)},profile.fields).errors;
  }

  function historicalRowInScope(row, context) {
    return (row.tenant ?? row.tenantId) === context.scope.id &&
      (!row.brandId || row.brandId === context.scope.tenant.brandId) &&
      (!row.enterpriseId || String(row.enterpriseId) === String(context.scope.tenant.enterpriseId));
  }

  function retiredContact(row) {
    return [row.direction,row.callType,row.requiredMode,row.callMode,row.mode,row.type].some(value =>
      typeof value === 'string' && /IVR|呼入|自动外呼|inbound|来电/i.test(value));
  }

  function visitTime(visit) {
    const value = visit.at || visit.date || '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return Date.parse(value + 'T00:00:00+08:00');
    if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?$/.test(value)) return Date.parse(value.replace(' ','T') + '+08:00');
    return Date.parse(value);
  }

  function callIdentity(row) {
    return String(row.callId || row.sessionId || row.contactId || row.cdrId || '');
  }

  function linkedCalls(calls, task, visit) {
    const id = visit.callId || visit.cdrId || visit.callRecordId;
    return calls.filter(call => id ? callIdentity(call) === String(id) :
      Boolean(visit.roundId && call.roundId === visit.roundId && call.taskId === task.taskId));
  }

  function localHistory(state, context, receipt, node, nativeWindow) {
    const fixtures = config.localHistory(context.scope,receipt.receivedAt);
    const nativeContext = nativeWindow?.DNativeContext?.context;
    const nativeCalls = accountScope(context).every((value,index) => value === accountScope(nativeContext)[index]) &&
      Array.isArray(nativeWindow?.CloudCallData?.calls) ? nativeWindow.CloudCallData.calls : [];
    const calls = [...fixtures.calls,...nativeCalls].filter(row => historicalRowInScope(row,context));
    const until = Date.parse(receipt.receivedAt);
    const from = until - node.days * 86400000;
    const byOriginalKey = task => Boolean(receipt.originalKey && task.originalKey === receipt.originalKey);
    const byPhone = task => Boolean(receipt.mapped.phone && phoneNumber(task.phone) === receipt.mapped.phone);
    const tasks = [...state.records,...fixtures.tasks].filter(task => task.taskId &&
      (byOriginalKey(task) || byPhone(task)) && historicalRowInScope(task,context) && !retiredContact(task));
    const visits = tasks.flatMap(task => (task.followupHistory || [])
      .filter(visit => (!visit.taskId || visit.taskId === task.taskId) && !retiredContact(visit))
      .map(visit => ({task,visit,time:visitTime(visit),calls:linkedCalls(calls,task,visit)})))
      .filter(item => item.time >= from && item.time <= until && !(item.calls.length && item.calls.every(retiredContact)))
      .sort((first,second) => second.time - first.time);
    const fromKey = visits.find(item => byOriginalKey(item.task));
    const selected = fromKey || visits[0];
    const scope = '本租户及品牌 / 最近 ' + node.days + ' 天';
    if (!selected) {
      return {branch:'noHistory', evidence:scope, actual:'授权范围内按原线索编号或规范化手机号未找到历史回访'};
    }
    const {task,visit} = selected;
    const outboundCalls = selected.calls.filter(call => !retiredContact(call));
    const call = outboundCalls.length === 1 ? outboundCalls[0] : null;
    const values = {
      visitResult:clean(visit.result),
      callStatus:clean(call?.status || call?.contactStatus || call?.result),
      intentLevel:clean(visit.details?.intentLevel || visit.intentLevel)
    };
    const history = {
      result:values.visitResult,
      callStatus:values.callStatus,
      intentLevel:values.intentLevel,
      tags:call?.tags || call?.labels || visit.tags
    };
    const evidence = {
      '范围':scope, '定位方式':fromKey ? '来源线索编号' : '规范化手机号',
      '历史任务':task.taskId, '回访':visit.id || visit.roundId || visit.at || visit.date,
      '话单':call ? callIdentity(call) : '无法确认唯一话单'
    };
    const actual = {'回访结果':values.visitResult, '通话状态':values.callStatus, '意向级别':values.intentLevel};
    const conditions = Object.entries(node.match || {}).filter(([,value]) => value);
    if (conditions.some(([key]) => !values[key])) return {branch:'missing',evidence,actual,history};
    const matched = conditions.every(([key,value]) => values[key] === value);
    return {branch:matched ? 'matched' : 'unmatched',evidence,actual,history};
  }

  function factsFor(receipt, history) {
    return {...receipt.mapped, leadAt:receipt.values.leadAt, history};
  }

  function withPreRating(context, facts, source) {
    let cached;
    function queryPreRating() {
      if (cached) return cached;
      const categoryId = categoryOf(source || {});
      const access = settings.preRatingStatus(context,categoryId);
      if (access.status !== 'connected') return cached = {status:access.status};
      const applicationId = access.application.id;
      let result;
      try {
        result = window.DSkynetPreRating?.query(context,{categoryId,applicationId,application:access.application,
          revision:access.application.revision,connectionKey:access.application.connectionKey,taskId:source?.taskId,
          roundId:source?.roundId,leadId:clean(source?.originalKey)});
      } catch (_) { /* Query failure is an unknown value. */ }
      const value = Number.isFinite(result?.value) ? String(result.value) : clean(result?.value);
      if (result?.status === 'available' && value) return cached = {status:'available',value,applicationId,application:structuredClone(access.application),categoryId};
      const status = result?.status === 'timeout' ? 'timeout' :
        result?.status === 'missing' || result?.status === 'available' ? 'missing' : 'unavailable';
      return cached = {status,applicationId,application:structuredClone(access.application),categoryId};
    }
    return {...facts,queryPreRating};
  }

  function matchField(key, fields = config.fields) {
    if (key === settings.preRatingField?.key) return settings.preRatingField;
    return fields.find(field => field.key === key) || settings.historyFields.find(field => field.key === key) ||
      settings.previousFields.find(field => field.key === key) || settings.roundFields?.find(field => field.key === key);
  }

  function fieldValue(field, value) {
    const label = item => canonicalOption(field || {},item)?.label || item;
    return (Array.isArray(value) ? value.map(label).join('、') : label(value)) || '—';
  }

  function comparisonLabel(operator, value) {
    if (Array.isArray(value) && value.length > 1) {
      if (operator === 'equal') return '命中任一标准值';
      if (operator === 'notEqual') return '排除所选标准值';
      if (operator === 'contains') return '包含任一比较值';
      if (operator === 'before') return '早于任一比较值';
      if (operator === 'after') return '晚于任一比较值';
      if (operator === 'greater') return '大于任一比较值';
      if (operator === 'less') return '小于任一比较值';
    }
    return settings.operators.find(item => item.value === operator)?.label || settings.aiDurationOperators?.find(item=>item.value===operator)?.label || operator;
  }

  function describeCondition({field:key,operator,value}, fields) {
    const field = matchField(key,fields);
    const description = (field?.label || key) + ' ' + comparisonLabel(operator,value);
    return ['hasValue','isEmpty'].includes(operator) ? description : description + ' ' + fieldValue(field,value);
  }

  function conditionSummary(node, fields) {
    if (node.id === 'fields') return ['按二级分类核对必填、类型与字典',
      ...(node.checks || []).map(check => describeCondition(check,fields))].join('。');
    return [node.condition || node.label, ...(node.conditions || []).map(condition => describeCondition(condition,fields))].join('。');
  }

  function validateIntakeFields(node, receipt) {
    const fields = fieldsForRule(receipt.inputProfile,node);
    const {mapped,errors} = mapFields(receipt,fields);
    receipt.mapped = mapped;
    if (mapped.originalKey) receipt.originalKey = Array.isArray(mapped.originalKey) ? mapped.originalKey.join('|') : mapped.originalKey;
    const basicError = errors.join('、');
    const facts = factsFor(receipt);
    const details = basicError ? [] : (node.checks || []).map(check => {
      const matched = settings.matches(check,facts);
      const field = matchField(check.field,fields);
      const value = fieldValue(field,facts[check.field]);
      const condition = describeCondition(check,fields);
      const outcome = matched === null ? '缺少判定值' : matched ? '通过' : '不通过';
      if (matched !== true) errors.push(condition + '，' + outcome);
      return condition + '（实际 ' + value + '，' + outcome + '）';
    });
    const evidence = {
      '字段来源':receipt.inputProfile.sourceLabel,
      '基础校验':basicError ? '未通过。' + basicError : '通过',
      '必填字段':fields.filter(field => field.required).map(field => field.label).join('、') || '未配置',
      ...(Array.isArray(node.requiredFields) ? {'必填口径':'原分配规则版本'} : {}),
      '业务条件':basicError ? '基础校验未通过，未执行' : details.join('。') || '无附加条件'
    };
    return {branch:errors.length ? 'invalid' : 'valid', result:errors.length ? '校验未通过' : '校验通过',
      evidence, actual:errors.length ? errors.join('、') : '字段可用'};
  }

  function lookUpExternalHistory(node, receipt) {
    const {sourceId,lookupField} = node.externalQuery || settings.defaultExternalQuery;
    const source = settings.historySources.find(item => item.value === sourceId);
    const fieldLabel = settings.historyLookupFields.find(item => item.value === lookupField)?.label || lookupField;
    const raw = receipt.mapped?.[lookupField];
    const value = Array.isArray(raw) ? raw.join('|') : raw;
    const evidence = {'外部来源':source?.label || '未关联', '查询字段':fieldLabel, '查询值':value || '—'};
    if (!source || receipt.historyCase === 'unconnected') {
      return {branch:'unconnected',result:'未接入',evidence:{...evidence,'查询结果':'未发起查询'},actual:'未发起查询'};
    }
    if (!value) {
      const reason = '缺少查询字段「' + fieldLabel + '」，未发起查询。';
      return {branch:'failed', result:'查询失败', evidence:{...evidence,'查询结果':'缺少查询值'},actual:reason,reason};
    }
    const simulated = config.externalHistory(receipt.historyCase);
    return {branch:receipt.historyCase,result:simulated.result,
      evidence:{...evidence,'查询结果':simulated.result,'模拟依据':simulated.evidence},actual:simulated.actual};
  }

  function evaluate(node, state, context, receipt, history, nativeWindow) {
    if (node.id === 'fields') return validateIntakeFields(node,receipt);
    if (node.id === 'localHistory') {
      const result = localHistory(state,context,receipt,node,nativeWindow);
      return {...result,result:historyLabels[result.branch]};
    }
    if (node.id === 'externalHistory') return lookUpExternalHistory(node,receipt);
    const conditions = node.conditions || [];
    const filters = Object.entries(node.match || {}).filter(([,values]) => values.length);
    const facts = factsFor(receipt,history);
    const matched = filters.every(([key,values]) => {
      const actual = facts[key];
      return Array.isArray(actual) ? actual.some(value => values.includes(value)) : values.includes(actual);
    }) &&
      conditions.every(condition => settings.matches(condition,facts));
    const keys = new Set([...filters.map(([key]) => key), ...conditions.map(condition => condition.field)]);
    const actual = Object.fromEntries([...keys].map(key => {
      const field = matchField(key,receipt.inputProfile.fields);
      const value = key.startsWith('history.') ? history?.[key.slice(8)] : facts[key];
      return [field?.label || key, fieldValue(field,value)];
    }));
    return {branch:matched ? 'matched' : 'unmatched',result:matched ? '匹配成功' : '未匹配',
      evidence:matched ? '符合本节点保存的匹配条件' : '当前来件不符合本节点保存的匹配条件',actual};
  }

  function importSnapshot(receipt) {
    const originalKey = window.DReview21DccFollowupFields?.leadCategories
      ?.find(([id]) => id === receipt.categoryId)?.[2];
    const fields = receipt.inputProfile.fields.map(field =>
      field.key === 'originalKey' && originalKey ? {...field,businessKey:originalKey} : field);
    return {
      schema:1, categoryId:receipt.categoryId,
      fields:fields.map(field => ({
        key:field.businessKey, businessKey:field.businessKey, label:field.label, type:field.type,
        ...(field.sourceFieldId ? {sourceFieldId:field.sourceFieldId} : {}),
        ...(field.sourceKey ? {sourceKey:field.sourceKey} : {}),
        options:field.options?.map(option => ({id:option.value,label:option.label}))
      })),
      values:Object.fromEntries(fields.filter(field => Object.hasOwn(receipt.mapped,field.key)).map(field => {
        const value = receipt.mapped[field.key];
        return [field.businessKey,Array.isArray(value) ? value.join('|') : value];
      }))
    };
  }

  function deliveryFollowupValue(facts,key) {
    const {details,options,note,nextAt} = facts.deliveryFollowup || {};
    if (key === 'visitResult') return facts.round?.result;
    if (options && Object.hasOwn(options,key)) return options[key];
    if (details && Object.hasOwn(details,key)) return details[key];
    if (key === 'intentLevel') return facts.round?.intentLevel;
    if (key === 'visitDesc') return note;
    if (key === 'nextVisitTime') return nextAt;
    return undefined;
  }

  function coldCallbackGap(facts,days) {
    const planned = clean(facts.deliveryFollowup?.nextAt);
    const finished = clean(facts.deliveryFollowup?.completedAt);
    const time = value => validLocalTime(value) ? Date.parse(value+'+08:00') :
      /^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? Date.parse(value) : NaN;
    const gapMs = time(planned)-time(finished);
    const threshold = days*86400000;
    return {minDays:days,plannedAt:planned,completedAt:finished,
      ...(Number.isFinite(gapMs) ? {gapDays:gapMs/86400000,matched:gapMs>threshold} : {matched:null})};
  }

  function evaluateNurtureCondition(condition, facts, skipPrevious, followup) {
    const {field:key,operator,value} = condition;
    if (key === settings.unlimitedStrategyField.key) {
      return {field:key,fieldLabel:settings.unlimitedStrategyField.label,outcome:'unlimited'};
    }
    const previous = key.startsWith('previous.');
    const round = key.startsWith('round.');
    const aiTag=key===settings.aiDeliveryTagKey, aiStatus=key===settings.aiDeliveryStatusKey, aiDuration=key===settings.aiDurationKey;
    const field = aiTag ? {label:'AI 标签名称',options:condition.aiTagOptions||[]} : aiStatus ? {label:'AI 通话状态'} :
      aiDuration ? {label:'通话时长（秒）'} : matchField(key);
    const callTag = key === 'previous.tags' ? settings.previousCallTagField?.(facts.previous?.callMethod) : null;
    const priorRound = followup && round && key !== 'round.number';
    const fieldLabel = condition.followupLabel || callTag?.label || (priorRound ? field?.label.replace(/^本轮/,'上一轮') : field?.label) || key;
    const skipped = skipPrevious && (previous || round);
    const inapplicable = facts.round?.callMethod === '企微培育' &&
      ['round.callStatus','round.callTags','round.tags','previous.callStatus','previous.tags'].includes(key);
    const unary = operator === 'hasValue' || operator === 'isEmpty';
    const preRating = key === settings.preRatingField?.key ? facts.queryPreRating?.() || {status:'unavailable'} : null;
    const actual = preRating ? preRating.value : inapplicable ? undefined :
      condition.followupKey ? deliveryFollowupValue(facts,condition.followupKey) :
      previous ? facts.previous?.[key.slice(9)] : round ? facts.round?.[key.slice(6)] : facts[key];
    const values = Array.isArray(actual) ? actual : [actual];
    const present = values.some(item => item != null && (typeof item !== 'string' || item.trim() !== ''));
    const comparisonFacts = preRating || condition.followupKey ? {[key]:actual} : facts;
    let matched = skipped || inapplicable || preRating && preRating.status !== 'available' ? null :
      aiTag && Array.isArray(actual) && !actual.length ? false :
      !unary && !present ? null : aiDuration ? settings.matchAiDeliveryDuration(operator,actual,value) :
      settings.matches(condition,comparisonFacts);
    let coldCallbackWindow;
    if (matched === true && Number.isInteger(condition.coldCallbackMinDays) &&
        condition.coldCallbackMinDays>=1 && condition.coldCallbackMinDays<=3650 &&
        settings.matches({...condition,value:condition.coldCallbackResult || '下次回访'},comparisonFacts) === true) {
      coldCallbackWindow = coldCallbackGap(facts,condition.coldCallbackMinDays);
      matched = coldCallbackWindow.matched;
    }
    const callbackDescription = coldCallbackWindow && (coldCallbackWindow.gapDays === undefined
      ? '（下次回访时间或本轮完成时间待核对）' : '（回访间隔 ' + Number(coldCallbackWindow.gapDays.toFixed(2)) + ' 天）');
    return {
      field:key,fieldLabel,operator,operatorLabel:comparisonLabel(operator,value),
      expected:unary ? '' : fieldValue(field,value) + (condition.coldCallbackMinDays ?
        '（「下次回访」须间隔大于 ' + condition.coldCallbackMinDays + ' 天）' : ''),
      actual:callbackDescription ? fieldValue(field,actual) + callbackDescription : fieldValue(field,aiDuration && actual===0 ? '0' : actual),
      ...(coldCallbackWindow ? {coldCallbackWindow} : {}),
      ...(preRating ? {preRating} : {}),
      source:aiTag || aiStatus || aiDuration ? '本轮 AI 话单' : condition.followupKey ? '本轮填写字段' : preRating ? '外部预评分接口' : callTag && facts.previous?.callMethod ? '上一轮' + facts.previous.callMethod + '话单' :
        previous || priorRound ? '上一轮结果' : round ? '本轮结果' : '来件字段',
      outcome:skipped ? 'skipped' : inapplicable ? 'inapplicable' : matched === null ? 'missing' : matched ? 'matched' : 'unmatched'
    };
  }

  function nurtureAction(rule) {
    return rule.actions.find(item => Object.hasOwn(nurtureDestinations,item)) || '';
  }

  function evaluateNurtureRule(rule, ruleNumber, priority, facts, skipPrevious, followup) {
    const conditions = rule.conditions.map(item => evaluateNurtureCondition(item,facts,skipPrevious,followup));
    const inapplicable = conditions.some(item => item.outcome === 'inapplicable');
    const applicable = conditions.filter(item => !['skipped','unlimited','inapplicable'].includes(item.outcome));
    const missing = applicable.some(item => item.outcome === 'missing');
    const met = applicable.some(item => item.outcome === 'matched');
    const unmet = applicable.some(item => item.outcome === 'unmatched');
    let outcome = 'unmatched';
    if (rule.logic === 'or' && applicable.length) outcome = met ? 'matched' : missing ? 'missing' : 'unmatched';
    else if (!inapplicable) {
      if (!applicable.length) outcome = conditions.some(item => item.outcome === 'skipped') ? 'unmatched' : 'matched';
      else if (rule.logic === 'not') outcome = unmet ? 'matched' : missing ? 'missing' : 'unmatched';
      else outcome = unmet ? 'unmatched' : missing ? 'missing' : 'matched';
    }
    if (rule.aiSupplierId && !facts.round?.aiSupplierId) {
      outcome = 'missing';
      const tag = conditions.find(item=>item.field===settings.aiDeliveryTagKey);
      if (tag) tag.outcome='missing';
    }
    return {ruleNumber,priority,logic:rule.logic,conditions,actions:[...rule.actions],action:nurtureAction(rule),outcome};
  }

  function evaluateNurtureGroup(group,tree,facts,skipPrevious,followup = false) {
    const evaluated = group.map(({rule,ruleNumber},index) => {
      const evaluation = evaluateNurtureRule(rule,ruleNumber,index + 1,facts,skipPrevious,followup);
      if (tree) {
        Object.assign(evaluation,{strategyNodeId:rule.id,name:rule.name,fallback:rule.fallback === true});
      }
      return evaluation;
    });
    const decisive = evaluated.find(rule => rule.action && rule.outcome !== 'unmatched');
    const blocked = decisive?.outcome === 'missing';
    for (const rule of evaluated) {
      if (rule === decisive) rule.disposition = blocked ? 'blockedByMissing' : 'selected';
      else if (rule.outcome === 'unmatched') rule.disposition = 'notMatched';
      else if (rule.outcome === 'missing') rule.disposition = 'missing';
      else if (rule.fallback && decisive && !blocked) rule.disposition = 'fallbackNotNeeded';
      else if (!rule.action && (!decisive || rule.priority < decisive.priority)) rule.disposition = 'continue';
      else rule.disposition = blocked ? 'heldByMissing' : 'skippedByPriority';
    }
    return {evaluated,decisive};
  }

  function evaluateDeliveryTemplate(template, facts) {
    if (!template?.criteria) return null;
    const callMethod=facts.round?.callMethod;
    const isolated=template.aiCriteria!==undefined;
    const criteria=!isolated ? template.criteria : callMethod==='AI 外呼' ? template.aiCriteria :
      ['人工外呼','预外呼','企微培育'].includes(callMethod) ? template.criteria : {};
    const rules = settings.deliveryTypes.flatMap(type => (criteria[type.value] || []).map((rule,index) => ({
      type:type.value,typeLabel:type.label,typeRuleNumber:index + 1,conditions:rule.conditions,logic:rule.logic || 'and',
      aiSupplierId:rule.aiSupplierId,name:type.label + ' · 下发规则 ' + (index + 1),actions:['进入下发判断']
    }))).filter(rule=>!rule.aiSupplierId || !facts.round?.aiSupplierId || rule.aiSupplierId===facts.round.aiSupplierId);
    const {evaluated,decisive} = evaluateNurtureGroup(rules.map((rule,index) => ({rule,ruleNumber:index + 1})),true,
      callMethod==='AI 外呼' && !facts.round?.aiSupplierId ? {...facts,round:{...facts.round,aiTags:undefined}} : facts,false);
    evaluated.forEach((evaluation,index) => {
      const {type,typeLabel,typeRuleNumber} = rules[index];
      Object.assign(evaluation,{type,typeLabel,typeRuleNumber});
    });
    const gate = {
      outcome:decisive?.outcome || (rules.length ? 'notMatched' : 'notConfigured'),
      ruleEvaluations:evaluated,ruleNumber:decisive?.ruleNumber ?? null,
      templateId:template.id,templateVersion:template.version,...(isolated&&callMethod ? {callMethod} : {})
    };
    if (decisive) {
      const {type,typeLabel,typeRuleNumber} = decisive;
      Object.assign(gate,{type,typeLabel,typeRuleNumber});
    }
    return {gate,decisive};
  }

  function deliveryTypeEvidence({type,typeLabel,typeRuleNumber} = {}) {
    return type ? {type,typeLabel,typeRuleNumber} : {};
  }

  function pendingDeliveryType(delivery) {
    const type = settings.deliveryTypes.find(option => option.value === (delivery.type || 'intent'));
    return type ? {type:type.value,typeLabel:delivery.typeLabel || type.label} : {};
  }

  function nurtureDecision(event, outcome, ruleEvaluations = [], rule = null, action = '', actions = []) {
    return {
      event,outcome,status:nurtureDecisionLabels[outcome], ruleNumber:rule?.ruleNumber ?? null,
      priority:rule?.priority ?? null,logic:rule?.logic || '',conditions:rule?.conditions || [],ruleEvaluations,action,actions
    };
  }

  function strategyPathFor(nodes, nodeId) {
    if (!nodeId) return null;
    for (const node of nodes) {
      if (node.id === nodeId) return [node];
      const childPath = strategyPathFor(node.children || [],nodeId);
      if (childPath) return [node,...childPath];
    }
    return null;
  }

  function strategyStep(node) {
    return {id:node.id,name:node.name,fallback:node.fallback === true};
  }

  function planFor(template, event, facts, {skipPrevious = false,strategyParentId,delivery} = {}) {
    const tree = template.strategyTree === true;
    const deliveryFirst = event !== '接入后';
    const parentPath = tree && deliveryFirst ? strategyPathFor(template.rules,strategyParentId) : [];
    if (!parentPath) {
      return {...nurtureDecision(event,'unavailable',[],null,'转待处理'),
        status:'无法定位当前培育策略，待核对绑定版本和原策略路径。',strategyParentId};
    }
    const parent = parentPath.at(-1);
    const candidates = parent ? parent.children || [] : template.rules;
    const scope = tree ? {
      strategyParentId:parent?.id || '',
      strategyParentName:parent?.name || '接入后',
      strategyPath:parentPath.map(strategyStep)
    } : {};
    const templateGate = deliveryFirst ? evaluateDeliveryTemplate(delivery,facts) : null;
    if (templateGate) {
      const {gate,decisive} = templateGate;
      scope.deliveryGate = gate;
      if (decisive) {
        const action = decisive.outcome === 'matched' ? decisive.action : '转待处理';
        return {...nurtureDecision(event,decisive.outcome,gate.ruleEvaluations,decisive,action,[action]),...scope};
      }
    }
    const deliveryGroup = [];
    const nurtureGroup = [];
    for (const [index,rule] of candidates.entries()) {
      if (!tree && rule.event !== event) continue;
      const isDelivery = deliveryFirst && deliveryActions.has(nurtureAction(rule));
      if (templateGate && isDelivery) continue;
      const group = isDelivery ? deliveryGroup : nurtureGroup;
      group.push({rule,ruleNumber:index + 1});
    }
    const gate = deliveryFirst && !templateGate ? evaluateNurtureGroup(deliveryGroup,tree,facts,skipPrevious) : null;
    if (gate) scope.deliveryGate = {
      outcome:gate.decisive?.outcome || (deliveryGroup.length ? 'notMatched' : 'notConfigured'),
      ruleEvaluations:gate.evaluated,ruleNumber:gate.decisive?.ruleNumber ?? null
    };
    const {evaluated,decisive} = gate?.decisive ? gate :
      evaluateNurtureGroup(nurtureGroup,tree,facts,skipPrevious,deliveryFirst);
    if (!decisive) {
      const roundDone = event === roundCompleteEvent;
      const decision = {...nurtureDecision(event,'notMatched',evaluated,null,roundDone ? '结束培育' : '转待处理'),...scope};
      if (tree && roundDone) {
        decision.endReason = nurtureGroup.length ? '本组无后续培育规则命中' : '当前策略无后续培育策略';
        decision.status = decision.endReason + '，结束培育';
      } else if (roundDone) {
        decision.status = '本轮无后续规则命中，结束培育';
      }
      return decision;
    }
    const selected = candidates[decisive.ruleNumber - 1];
    const strategy = tree ? {strategyNodeId:selected.id,strategyNodeName:selected.name,strategyFallback:selected.fallback === true} : {};
    if (decisive.outcome === 'missing') return {...nurtureDecision(event,'missing',evaluated,decisive,'转待处理'),...scope,...strategy};
    const decision = {...nurtureDecision(event,'matched',evaluated,decisive,decisive.action,decisive.actions),...scope,...strategy};
    if (event === '接入后' && deliveryActions.has(decisive.action) && selected.directDeliveryTargetType) {
      decision.directDeliveryTarget = {type:selected.directDeliveryTargetType,id:selected.directDeliveryTargetId,
        ...(selected.directDeliveryValues?.length ? {fields:structuredClone(selected.directDeliveryValues)} : {}),
        ...(selected.directDeliveryApplication ? {application:structuredClone(selected.directDeliveryApplication)} : {})};
    }
    if (tree) {
      decision.strategyPath = [...scope.strategyPath,strategyStep(selected)];
      if (decision.strategyFallback) {
        decision.status = '已选定当前策略下的兜底策略';
        if (decision.action === '结束培育') decision.endReason = '兜底策略 · 培育结束';
      }
    }
    const {manualAssignment,coldRuleId,wecomApplication} = selected;
    if (decisive.action === '企微培育' && wecomApplication) decision.wecomApplication = structuredClone(wecomApplication);
    if (decisive.action === '人工外呼' && manualAssignment) decision.manualAssignment = structuredClone(manualAssignment);
    if (decisive.action === '转冷线索' && coldRuleId) {
      decision.coldRuleId = coldRuleId;
      if (Object.hasOwn(selected,'coldWindowDays')) decision.coldWindowDays = selected.coldWindowDays;
    }
    const outbound = settings.outboundFields[decisive.action];
    if (outbound && (template.outboundTargetBinding || selected[outbound.id])) {
      decision.targetTaskId = selected[outbound.id] || '';
      if (selected[outbound.reference]) decision.targetSnapshot = structuredClone(selected[outbound.reference]);
    }
    return decision;
  }

  function firstPlan(template, facts, delivery) {
    const plan = planFor(template,'接入后',facts,{skipPrevious:true});
    if (!deliveryActions.has(plan.action) || plan.directDeliveryTarget) return plan;
    const typed = evaluateDeliveryTemplate(delivery,facts);
    if (!typed) return plan;
    const {gate,decisive} = typed;
    if (gate.outcome === 'matched') return {...plan,deliveryGate:gate};
    const status = gate.outcome === 'missing' ? '接入后请补齐下发判定所需的培育结果。' :
      '接入后未匹配到支持下发的模板规则，任务待处理。';
    return {...nurtureDecision('接入后',gate.outcome === 'missing' ? 'missing' : 'notMatched',
      gate.ruleEvaluations,decisive,'转待处理',['转待处理']),deliveryGate:gate,status,
      strategyParentName:plan.strategyParentName,strategyPath:plan.strategyPath};
  }

  function commitStrategy(task,plan) {
    if (plan.outcome !== 'matched' || !plan.strategyNodeId) return;
    task.skynet.strategyNodeId = plan.strategyNodeId;
    task.skynet.strategyPath = plan.strategyPath.map(step => ({...step}));
  }

  function templateBinding(rule, nurture, delivery) {
    return {
      ...assignmentRuleBinding(rule),
      nurtureTemplateId:nurture.id, nurtureTemplateName:nurture.name, nurtureTemplateVersion:nurture.version,
      deliveryTemplateId:delivery.id, deliveryTemplateName:delivery.name, deliveryTemplateVersion:delivery.version
    };
  }

  function assignmentRuleBinding(rule) {
    return {assignmentRuleId:rule.id,assignmentRuleName:rule.name,assignmentRuleVersion:rule.version};
  }

  function sameTemplateBinding(original, candidate) {
    return original.assignmentRuleId === candidate.assignmentRuleId &&
      original.assignmentRuleVersion === candidate.assignmentRuleVersion && ['nurture','delivery'].every(kind =>
      original[kind + 'TemplateId'] === candidate[kind + 'TemplateId'] &&
      original[kind + 'TemplateVersion'] === candidate[kind + 'TemplateVersion']);
  }

  function bindingSummary(binding) {
    const templates = ['nurture','delivery'].map((kind,index) =>
      (binding[kind + 'TemplateName'] || binding[kind + 'TemplateId'] || ['培育模板','下发模板'][index]) +
      ' v' + binding[kind + 'TemplateVersion']);
    if (binding.assignmentRuleId) {
      templates.unshift((binding.assignmentRuleName || binding.assignmentRuleId) + ' v' + binding.assignmentRuleVersion);
    }
    return templates.join('、');
  }

  function deliveryBinding(skynet) {
    return {
      templateId:skynet.deliveryTemplateId,templateName:skynet.deliveryTemplateName,
      templateVersion:skynet.deliveryTemplateVersion
    };
  }

  function deliveryPolicy(context, template, kind = 'intent') {
    if (!template) return {error:'绑定的下发模板版本暂不可用。'};
    const handling = settings.deliveryHandling(template,kind);
    const {deliveryTargetType:type,deliveryTargetId:id,deliveryMode:mode,auditEnabled} = handling;
    if (mode !== undefined && !settings.deliveryModes.some(item => item.value === mode)) {
      return {error:'绑定的下发方式不可用，请核对原模板。'};
    }
    if (!type && auditEnabled === undefined && !template.handlingByKind) return {template,mode,legacy:true,auditEnabled:false};
    if (typeof auditEnabled !== 'boolean') return {error:'绑定的下发模板审核设置无效，请核对原版本。'};
    if (type === 'internalTenant') return {template,mode,auditEnabled,targetType:type};
    if (type === 'externalSystem' && !auditEnabled && mode === 'oneToMany') {
      return {error:'外部系统自动下发仅支持 1 发 1，请核对原模板。'};
    }
    let target;
    try {
      if (handling.application?.id !== id || !handling.application.revision || !handling.application.connectionKey) {
        return {error:'原下发模板未关联可核验的下发应用，请编辑模板重新关联。',application:handling.application};
      }
      target = settings.resolveDeliveryTarget?.(context,type,id,handling.application);
    } catch (_) { /* Unavailable target data keeps this round available for reconciliation. */ }
    if (type !== 'externalSystem' || !clean(id) ||
        target?.id !== id || target.type !== type || !clean(target.label) ||
        target.application?.id !== handling.application?.id || target.application?.connectionKey !== handling.application?.connectionKey) {
      return {error:'配置的下发接收应用已失效或配置版本已变化，请核对原记录。',application:handling.application};
    }
    return {template,mode,auditEnabled,target:{id,label:target.label,type,application:structuredClone(target.application)}};
  }

  const automaticDelivery = policy => !policy.legacy && policy.auditEnabled === false && policy.targetType !== 'internalTenant';

  const reviewSampleSource = Object.freeze({value:'DELIVERY-REVIEW-DEMO',label:'下发审核模拟'});
  const assignmentSampleSource = Object.freeze({value:'ASSIGNMENT-REVIEW-DEMO',label:'分配审核模拟'});
  const reviewSampleTemplate = Object.freeze({id:'DEMO-DELIVERY-REVIEW',version:'1.0',name:'下发审核模拟模板',
    auditEnabled:true,deliveryTargetType:'internalTenant',deliveryMode:'oneToOne'});

  const workbenchDeliveryDemo = Object.freeze({
    source:Object.freeze({value:'WORKBENCH-DELIVERY-DEMO',label:'坐席待下发模拟'}),
    id:'DEMO-WORKBENCH-DELIVERY',version:'1.0',name:'待下发模拟模板',
    store:Object.freeze({value:'DEMO-WORKBENCH-STORE',label:'模拟门店'}),
    target:Object.freeze({id:'DEMO-WORKBENCH-SINK',label:'模拟接收端（不会外发）',type:'externalSystem'})
  });

  function isWorkbenchDeliverySample(task,context) {
    return task?.sourceApplicationId===workbenchDeliveryDemo.source.value &&
      task.skynet?.deliveryTemplateId===workbenchDeliveryDemo.id &&
      task.skynet?.deliveryTemplateVersion===workbenchDeliveryDemo.version && inScope(context,task);
  }

  function taskDeliveryPolicy(state, context, task, book = settings.read(state), kind) {
    if (isWorkbenchDeliverySample(task,context)) {
      const {id,version,name,target} = workbenchDeliveryDemo;
      return {template:{id,version,name,mapping:settings.defaultDeliveryMapping(),criteria:{}},
        mode:'oneToOne',auditEnabled:true,target};
    }
    const isReviewSample = [reviewSampleSource.value,assignmentSampleSource.value].includes(task.sourceApplicationId) &&
      task.skynet.deliveryTemplateId === reviewSampleTemplate.id && task.skynet.deliveryTemplateVersion === reviewSampleTemplate.version;
    const template = isReviewSample ? {...reviewSampleTemplate,mapping:settings.defaultDeliveryMapping()} :
      deliveryTemplate(book,deliveryBinding(task.skynet),categoryOf(task));
    const delivery = task.skynet.delivery;
    if (!delivery?.directDeliveryTarget) return deliveryPolicy(context,template,kind || delivery?.type ||
      task.skynet.processing?.deliveryGate?.type || 'intent');
    const policy = directDeliveryPolicy(context,originalIntake(state,context,task),template,delivery.directDeliveryTarget);
    if (policy.error) return policy;
    if (policy.directStore.id !== delivery.directStore?.id || policy.target.id !== delivery.target?.id) {
      return {error:'意向门店或下发对象已变化，请核对原次直发记录。'};
    }
    if (delivery.storeMatch && internalMatchSignature(policy.storeMatch) !== internalMatchSignature(delivery.storeMatch)) {
      return {error:'意向门店的租户绑定已变化，请重新核对原次直发记录。'};
    }
    return policy;
  }

  function directDeliveryPolicy(context, receipt, template, selection) {
    if (!template) return {error:'绑定的下发模板版本暂不可用。'};
    const fields = selection.fields;
    if (fields !== undefined && (!Array.isArray(fields) || fields.length > 50 ||
        fields.some(row=>typeof row?.key!=='string' || !row.key.trim() ||
          ['__proto__','constructor','prototype'].includes(row.key) || typeof row.value!=='string' ||
          !row.value.trim() || row.value.length>500) || new Set(fields.map(row=>row.key)).size!==fields.length)) {
      return {error:'原直发策略的字段或下发值无法核对。'};
    }
    const reserved = new Set((template.mapping || []).filter(row=>['originalKey','dealer'].includes(row.source)).map(row=>row.target));
    if (fields?.some(row=>reserved.has(row.key))) {
      return {error:'直发字段与线索编号或意向门店的下发映射冲突，请核对配置。'};
    }
    const {auditEnabled} = settings.deliveryHandling(template,'intent');
    if (auditEnabled !== undefined && typeof auditEnabled !== 'boolean') {
      return {error:'绑定的下发模板审核设置无效，请核对原版本。'};
    }
    const dealer = clean(receipt?.mapped?.dealer);
    if (!dealer) return {error:'直发缺少本次来件的意向门店，任务待处理。'};
    const options = availableDeliveryStores(context,receipt);
    const exact = options.filter(option=>option.value === dealer);
    const id = selection.type === 'internalTenant' ? (exact.length === 1 ? dealer : '') : deliveryStoreId(options,dealer);
    if (!id) return {error:'本次来件的意向门店不可用，请核对原门店编码。'};
    const directStore = {id,name:options.find(item=>item.value===id).label};
    let target, storeMatch;
    try {
      if (selection.type === 'internalTenant') {
        const option = options.find(item=>item.value === id);
        const external = option?.externalSource || {};
        const identity = {storeCode:id,brandId:context.scope.tenant.brandId,
          ...(clean(option?.sourceId || external.dictionaryId) ? {sourceId:clean(option.sourceId || external.dictionaryId)} : {}),
          ...(clean(option?.capabilityId || external.capabilityId) ? {capabilityId:clean(option.capabilityId || external.capabilityId)} : {})};
        const match = window.DOrganization?.resolveIntentStoreTenant(identity);
        if (match?.status !== 'available') return {error:match?.reason || '意向门店未匹配到可用的本系统门店租户。'};
        if (!match.tenant?.id || match.tenant.id === context.scope.id || match.tenant.brandId !== context.scope.tenant.brandId ||
            match.tenant.organization !== '门店' || match.tenant.storeCode !== undefined && match.tenant.storeCode !== id) {
          return {error:'直发门店编码与同品牌接收租户的绑定无法核对。'};
        }
        storeMatch = internalMatchEvidence(context,{code:id,name:directStore.name,...identity},match,'intakeStore');
        target = {id:match.tenant.id,label:match.tenant.name,type:selection.type,storeMatch};
      } else if (selection.type === 'externalSystem') {
        if (selection.application?.id !== selection.id || !selection.application.revision || !selection.application.connectionKey) {
          return {error:'原直发策略未关联可核验的下发应用，请编辑策略重新关联。',application:selection.application};
        }
        target = settings.resolveDeliveryTarget(context,selection.type,selection.id,selection.application);
      }
    } catch (_) { /* Keep the source lead available if its destination cannot be read. */ }
    if (!target || selection.type === 'externalSystem' &&
        (target.application?.id !== selection.application?.id || target.application?.connectionKey !== selection.application?.connectionKey)) {
      return {error:'直发的下发应用未配置、配置版本已变化或当前不可用。',application:selection.application};
    }
    return {template,mode:'oneToOne',auditEnabled:auditEnabled!==false,target,directStore,...(storeMatch ? {storeMatch} : {}),
      directDeliveryTarget:selection};
  }

  function appendScenarioEvidence(task, scenario, application, operation, status, message, {externalId = '',at = new Date().toISOString()} = {}) {
    const previous = task.skynet.scenarioCalls || [];
    const roundId = task.skynet.roundId;
    const callId = [task.taskId,roundId,operation,externalId,at,previous.length + 1].join(':');
    const evidence = {callId,at,scenario,applicationId:application?.id || '',applicationName:application?.name || '',
      revision:application?.revision || '',connectionKey:application?.connectionKey || '',operation,
      taskId:task.taskId,roundId,status,message,externalId,simulated:true};
    task.skynet = {...task.skynet,scenarioCalls:[...previous,evidence]};
    return evidence;
  }

  function holdDeliveryPlan(task, plan, policy, latest) {
    const processing = {...processingFor(plan),status:'待处理',destination:'待核对下发目标',
      waitingForDeliveryTarget:true,targetUnavailableReason:policy.error,
      ...(latest ? {followupRoundId:latest.roundId} : {})};
    if (latest) recordRound(task,latest,plan,processing);
    else task.skynet = {...task.skynet,processing};
    task.taskStatus = '待处理';
    task.waitReason = policy.error;
    appendScenarioEvidence(task,'下发',policy.application,'下发应用校验','failed',policy.error);
    return {status:task.taskStatus,action:plan.action,warning:policy.error};
  }

  function enterDelivery(state, context, task, plan, policy) {
    const automatic = automaticDelivery(policy);
    const output = automatic ? deliveryOutput(task,policy,plan.deliveryGate?.type) : {entries:[]};
    if (output.error) {
      task.skynet = {...task.skynet,processing:{...task.skynet.processing,status:'待处理',destination:'待核对下发字段',waitingForDeliveryFields:true}};
      task.taskStatus = '待处理';
      task.waitReason = output.error;
      return {status:'待处理',reason:output.error};
    }
    const internal = policy.targetType === 'internalTenant';
    const direct = policy.directStore;
    const at = new Date().toISOString();
    const delivery = {
      ...deliveryBinding(task.skynet),status:automatic ? '已下发' : '待下发',enteredAt:at,
      taskId:task.taskId,action:plan.action,event:plan.event,ruleNumber:plan.ruleNumber,roundId:task.skynet.roundId,
      trigger:automatic ? 'automatic' : 'manual',
      ...(policy.storeMatch ? {storeMatch:structuredClone(policy.storeMatch)} : {}),
      ...(!automatic && policy.mode ? {mode:policy.mode} : {}),
      ...(policy.mode ? {configuredMode:policy.mode} : {}),
      ...(direct ? {auditEnabled:policy.auditEnabled,modeLabel:'接入直发',
        target:{...policy.target},
        directStore:{...direct},directDeliveryTarget:structuredClone(policy.directDeliveryTarget),stores:[{...direct}],
        ...(policy.directDeliveryTarget.fields?.length ? {
          mappedFields:deliveryMappedFields(policy.template,taskIntakeValues(task,originalIntake(state,context,task)),policy)
        } : {})} :
        internal ? {auditEnabled:policy.auditEnabled,targetType:policy.targetType} :
        !policy.legacy ? {auditEnabled:policy.auditEnabled,target:{...policy.target}} : {}),
      auditStatus:policy.auditEnabled ? '待提交审核' : '无需审核',
      ...(!direct ? pendingDeliveryType(deliveryTypeEvidence(plan.deliveryGate)) : {}),
      ...deliveryTypeEvidence(plan.deliveryGate)
    };
    if (automatic) {
      const values = taskIntakeValues(task,originalIntake(state,context,task));
      Object.assign(delivery,{mode:direct ? 'oneToOne' : 'automatic',modeLabel:direct ? '接入直发' : '自动下发',simulated:true,
        operatorName:'系统自动执行',sentAt:at,
        mappedFields:deliveryMappedFields(policy.template,values,policy,output.entries),
        ...(policy.target?.application ? {externalId:'MOCK-DELIVERY-' + task.skynet.roundId,
          application:structuredClone(policy.target.application)} : {}),
        decisionEvidence:{outcome:plan.outcome,
          ...(plan.deliveryGate ? {deliveryGate:structuredClone(plan.deliveryGate)} : {conditions:structuredClone(plan.conditions || [])})}});
    }
    const processing = {...task.skynet.processing,status:automatic ? '已结束' : '待下发',
      destination:automatic ? policy.target.label : policy.auditEnabled ? '待负责坐席提交下发审核' : '待负责坐席确认下发'};
    task.skynet = {...task.skynet,delivery,processing,...(automatic ? {endReason:'已下发'} : {})};
    task.taskStatus = automatic ? '已结束' : '待下发';
    task.nextAt = '';
    task.waitReason = automatic ? '' : '本任务等待负责坐席' +
      (internal ? '核对接收租户匹配并' : '') + (policy.auditEnabled ? '提交下发审核。' : '确认下发。');
    if (automatic && policy.target?.application) appendScenarioEvidence(task,'下发',policy.target.application,'自动下发','success',
      '已向所选应用模拟下发。',{externalId:delivery.externalId,at});
    return delivery;
  }

  function registerDelivery(state, context, receipt, task, plan, policy) {
    const delivery = enterDelivery(state,context,task,plan,policy);
    if (policy.directStore && delivery.trigger === 'automatic') {
      const {assignments} = directDeliveryAssignments(state,context,task,policy.directStore);
      delivery.leads = deliveryLeadRows(state,task,policy.template,assignments,policy);
      delivery.mappedFields = delivery.leads.find(lead=>lead.receiptIds.includes(receipt.id))?.mappedFields;
      receipt.leadDelivery = {status:'已下发',storeId:policy.directStore.id,storeName:policy.directStore.name,sentAt:delivery.sentAt};
    }
    receipt.status = delivery.status;
    receipt.reason = task.waitReason || '已按配置目标自动下发（模拟）。';
    receipt.deliveryPlan = {...delivery,taskId:task.taskId,roundId:task.skynet.roundId};
  }

  function createTask(state, receipt, binding) {
    const handoff = receipt.internalHandoff;
    const taskPrefix = handoff ? 'TW-TASK-' + encodeURIComponent(state.tenant) + '-' : 'TW-TASK-';
    const taskId = nextId(state,'task',taskPrefix);
    const roundId = taskId + '-01';
    const businessImportSnapshot = importSnapshot(receipt);
    const task = {
      ...businessImportSnapshot.values,
      id:nextId(state,'lead','TW-LEAD-'), taskId, roundId, createdAt:new Date().toISOString(),
      tenant:receipt.tenant, brandId:receipt.brandId, category:receipt.category,
      categoryId:receipt.categoryId, categoryContext:receipt.categoryId, source:receipt.source,
      sourceApplicationId:receipt.sourceApplicationId, originalKey:receipt.originalKey, receivedAt:receipt.receivedAt,
      sourceLeadCode:receipt.sourceLeadCode,localLeadCode:receipt.localLeadCode,
      businessImportSnapshot, needsNurture:true, intakeState:'已接收',
      requiredMode:'', taskStatus:'待处理',
      ownerId:'', expectedSeatId:'', waitReason:'已建立任务，等待判断处理方式',
      followupCount:0, followupHistory:[], followupResult:'', followupNote:'', nextAt:'', decision:'', handoffState:'',
      skynet:{roundId,roundNumber:1, intakeId:receipt.id, latestIntakeId:receipt.id,
        sourceApplicationId:receipt.sourceApplicationId,...binding,
        ...(handoff ? {internalHandoff:{...handoff,receiverRoundId:roundId,taskCreatedAt:receipt.receivedAt}} : {})}
    };
    state.records.unshift(task);
    receipt.taskRelation = '新建培育任务';
    return task;
  }

  function hasWorkbenchSamples(state, seatId, mode) {
    const current = window.DSession.context();
    return state.records.some(record => record.sourceApplicationId === workbenchSampleSource.value &&
      (record.workbenchSampleSeatId || record.ownerId) === seatId &&
      (record.workbenchSampleMode || '人工外呼') === mode && inScope(current,record));
  }

  const localPredictiveSampleId = tenant => 'WB-DEMO-PREDICTIVE-' + encodeURIComponent(tenant);
  function usesLocalPredictiveSample(record, context) {
    const processing = record.skynet?.processing;
    return Boolean(record.sourceApplicationId === workbenchSampleSource.value && record.workbenchSampleMode === '预外呼' &&
      record.workbenchSampleSeatId && inScope(context,record) && processing?.method === '预外呼' &&
      processing.targetTaskTenantId === record.tenant && processing.targetTaskId === localPredictiveSampleId(record.tenant));
  }

  function workbenchSampleInput(profile, code, name, phone, at) {
    const values = {originalKey:code,name,phone,leadAt:at,projectName:'工作台联调演示'};
    const preferred = {rChannel:'R3',series:'N7',leadStatus:'总部_高意向'};
    for (const field of profile.fields) {
      if (['select','multiselect'].includes(field.type)) {
        const option = field.options?.find(item => item.label === preferred[field.key] ||
          item.value === preferred[field.key]) || field.options?.[0];
        if (option) values[field.key] = field.type === 'multiselect' ? [option.value] : option.value;
      }
    }
    return values;
  }

  function generateAssignmentSamples(state, context, scenario) {
    const current = activeContext(context);
    if (!current || state?.tenant!==current.scope.id || window.DApp?.currentPage()!=='PAGE-21008' ||
        !window.DSession.allowed('PAGE-21008',current) || !window.DReview21Operations?.canManage(current)) {
      return {error:'仅本租户管理员可生成分配审核样例。'};
    }
    if (!window.DReview21.isLatest(state)) return {error:window.DReview21.saveFailure(state)};
    if (!['待分配','待指定','待改派','待下发'].includes(scenario)) return {error:'请选择可用的分配场景。'};
    const book = settings.read(state);
    const categories = settings.businessTypes(current);
    const route = settings.activeList(book,'rules').flatMap(rule=>{
      if (!assignmentRuleInScope(rule,current)) return [];
      const category = categories.find(item=>item.value===rule.categoryId);
      const resolved = category && resolveTaskBinding(book,rule,rule.cleaning.nurtureTemplateId,category.value);
      return resolved ? [{category,...resolved}] : [];
    })[0];
    const category = route?.category || categories.find(item=>item.value===config.categoryId) || categories[0];
    if (!category) return {error:'当前租户暂无可用的二级分类。'};
    const profile = settings.intakeFieldProfile(current,category.value);
    const draft = {...state,records:[...state.records],skynetReceipts:[...(state.skynetReceipts || [])]};
    const used = new Set([...draft.records.map(row=>phoneNumber(row.phone)),
      ...draft.skynetReceipts.map(row=>phoneNumber(row.mapped?.phone || row.values?.phone))]);
    const leadAt = new Date(Date.now()+8*3600000).toISOString().slice(0,16);
    const delivery = scenario==='待下发';
    const wecom = scenario==='待指定' || scenario==='待改派';
    if (delivery && !internalDeliveryOptions(current).length) return {error:'当前品牌暂无可用接收租户，无法生成下发指派样例。'};
    const {id,version,name} = reviewSampleTemplate;
    const localSeats = state.seats.filter(seat=>seat.tenant===state.tenant &&
      (!seat.brandId || seat.brandId===current.scope.tenant.brandId) && seat.accountId && seat.bindingState==='已关联');
    const originalSeat = localSeats.find(seat=>seat.accountId===current.account.id) || localSeats[0];
    let phoneIndex = 1;
    const count = 3;
    for (let index=0;index<count;index++) {
      let phone;
      do phone = '1380020'+String(phoneIndex++).padStart(4,'0'); while (used.has(phone));
      const sequence = sequenceFloor(draft,'receipt')+1, code = 'DEMO-ASSIGN-'+sequence;
      const input = workbenchSampleInput(profile,code,'分配审核模拟客户 '+sequence,phone,leadAt);
      const receipt = makeReceipt(draft,current,input,code,draft.skynetReceipts,category,assignmentSampleSource);
      const {mapped,errors} = mapFields(receipt,profile.fields);
      if (errors.length) return {error:'当前分类的样例字段校验失败：'+errors.join('、')+'。'};
      Object.assign(receipt,{mapped,status:'已匹配',completedAt:receipt.receivedAt});
      draft.skynetReceipts.unshift(receipt);
      const binding = delivery ? {deliveryTemplateId:id,deliveryTemplateVersion:version,deliveryTemplateName:name} : route?.binding || {};
      const task = createTask(draft,receipt,binding);
      if (delivery) {
        const policy = taskDeliveryPolicy(draft,current,task,undefined,'intent');
        if (policy.error) return {error:policy.error};
        registerDelivery(draft,current,receipt,task,{action:'进入下发判断',event:'接入后',deliveryGate:{type:'intent'}},policy);
      } else {
        const template = route && deliveryTemplate(book,deliveryBinding(binding),category.value);
        const configured = route && firstPlan(route.nurture,factsFor(receipt),template);
        const mode = wecom ? '企微培育' : '人工外呼';
        const plan = configured?.action===mode ? configured : {action:mode,actions:[mode],event:'接入后',conditions:[]};
        const status = wecom ? '待企微培育' : '待分配';
        const waitReason = wecom ? '等待管理员'+(scenario==='待改派'?'改派':'指定')+'具有有效企微账号的坐席。' : '等待管理员指派人工外呼坐席。';
        assignTaskPlan(task,receipt,plan,{requiredMode:mode,status,waitReason});
        task.skynet.processing = processingFor(plan,current);
        commitStrategy(task,plan);
        if (wecom) {
          const reassign = scenario==='待改派';
          if (!task.skynet.processing.wecomApplication) {
            const applications = window.DIntegrationApplications?.scenarioApplications?.(current,'转企微跟进');
            if (applications?.ok && applications.rows.length===1) task.skynet.processing.wecomApplication = structuredClone(applications.rows[0]);
          }
          if (reassign) {
            task.ownerId = originalSeat?.id || '';
            const previous = {roundId:task.roundId,number:1,callMethod:'人工外呼',result:'下次回访',at:leadAt};
            task.skynet.lastRound = previous;
            task.skynet.completedRounds = [previous];
            task.followupHistory.push({taskId:task.taskId,roundId:task.roundId,roundNumber:1,seat:task.ownerId,
              callMode:'人工外呼',contact:'已接通',result:previous.result,at:leadAt,note:'模拟上一轮回访，等待改派企微坐席。'});
            task.followupCount=1;
            advanceRound(task,1);
          }
          recordWecomAssignment(task,wecomRoundState(task,scenario,reassign?'friendship':'push',task.ownerId,'',waitReason));
        }
      }
      recordMatchedTemplates(receipt,binding);
      attachReceiptToTask(receipt,task);
    }
    const previous = {records:state.records,skynetReceipts:state.skynetReceipts,skynetSequences:state.skynetSequences};
    Object.assign(state,{records:draft.records,skynetReceipts:draft.skynetReceipts,skynetSequences:draft.skynetSequences});
    if (window.DReview21.save(state)) return {ok:true,count};
    for (const [key,value] of Object.entries(previous)) {
      if (value===undefined) delete state[key];
      else state[key]=value;
    }
    return {error:window.DReview21.saveFailure(state,'分配审核样例未保存，请重试。')};
  }

  function canStageWorkbenchDeliverySamples(state,context) {
    const current = activeContext(context);
    const seat = state.seats?.find(row=>row.id===state.seatId);
    return Boolean(current && state.tenant===current.scope.id && window.DApp?.currentPage()==='PAGE-2202' &&
      window.DSession.allowed('PAGE-2202',current) && window.DSession.can('F37',current) &&
      seat?.enabled && seat.accountId===current.account.id && seat.tenant===state.tenant &&
      (!seat.brandId || seat.brandId===current.scope.tenant.brandId) && seat.bindingState==='已关联' &&
      !state.records.some(row=>row.ownerId===seat.id && isWorkbenchDeliverySample(row,current) &&
        ['待下发','待下发审核'].includes(row.skynet.delivery?.status)));
  }

  function stageWorkbenchDeliverySamples(state,context) {
    if (!canStageWorkbenchDeliverySamples(state,context)) {
      return {error:'当前坐席已有未完成的下发模拟线索，或不在可生成样例的范围内。'};
    }
    if (!window.DReview21.isLatest(state)) return {error:window.DReview21.saveFailure(state)};
    const category = settings.businessType(context,config.categoryId) || settings.businessTypes(context)[0];
    if (!category) return {error:'当前租户没有可用的二级分类。'};
    const draft = {...state,records:[...state.records],skynetReceipts:[...(state.skynetReceipts || [])]};
    const used = new Set([...draft.records.map(row=>phoneNumber(row.phone)),
      ...draft.skynetReceipts.map(row=>phoneNumber(row.mapped?.phone || row.values?.phone))]);
    const profile = settings.intakeFieldProfile(context,category.value);
    const leadAt = new Date(Date.now()+8*3600000).toISOString().slice(0,16);
    const {id,version,name,source,store} = workbenchDeliveryDemo;
    const binding = {deliveryTemplateId:id,deliveryTemplateVersion:version,deliveryTemplateName:name};
    const samples = [];
    let phoneIndex = 1;
    for (const type of settings.deliveryTypes) {
      let phone;
      do phone = '1380021'+String(phoneIndex++).padStart(4,'0'); while (used.has(phone));
      const sequence = sequenceFloor(draft,'receipt')+1;
      const code = 'WB-DEMO-DELIVERY-'+sequence;
      const values = workbenchSampleInput(profile,code,'模拟 · '+type.label+' '+sequence,phone,leadAt);
      const receipt = makeReceipt(draft,context,values,code,draft.skynetReceipts,category,source);
      const {mapped,errors} = mapFields(receipt,profile.fields);
      if (errors.length) return {error:'当前分类的样例字段校验失败：'+errors.join('、')+'。'};
      Object.assign(receipt,{mapped,status:'待下发',completedAt:receipt.receivedAt});
      draft.skynetReceipts.unshift(receipt);
      const task = createTask(draft,receipt,binding);
      task.ownerId = state.seatId;
      task.visitDetails = {intentStore:store.value};
      const plan = {action:'进入下发判断',actions:['进入下发判断'],event:roundCompleteEvent,
        outcome:'matched',conditions:[],deliveryGate:{type:type.value,typeLabel:type.label}};
      assignTaskPlan(task,receipt,plan,{requiredMode:'',status:'待下发',waitReason:'模拟线索待坐席确认下发。'});
      task.skynet.processing = processingFor(plan,context);
      const policy = taskDeliveryPolicy(draft,context,task);
      if (policy.error) return {error:policy.error};
      registerDelivery(draft,context,receipt,task,plan,policy);
      attachReceiptToTask(receipt,task);
      samples.push(task);
    }
    return {records:draft.records,receipts:draft.skynetReceipts,sequences:draft.skynetSequences,samples};
  }

  function stageWorkbenchSamples(state, context) {
    const current = activeContext(context);
    const seat = state.seats.find(item => item.id === state.seatId);
    const mode = state.seatModes?.[seat?.id];
    const predictive = mode === '预外呼';
    if (!current || state.tenant !== current.scope.id || window.DApp.currentPage() !== 'PAGE-2202' ||
        !window.DSession.allowed('PAGE-2202',current) || !window.DSession.can('F37',current) ||
        !seat?.enabled || seat.accountId !== current.account.id || seat.tenant !== state.tenant ||
        seat.bindingState !== '已关联' || !predictive && mode !== '人工外呼') {
      return {error:'请使用当前租户的坐席账号登录人工外呼或预外呼。'};
    }
    if (hasWorkbenchSamples(state,seat.id,mode)) {
      return {error:'当前坐席已经生成过此模式的模拟任务。'};
    }
    const directory = predictive ? window.DSkynetOutboundTargets?.list(current,mode) : null;
    const targets = directory?.status === 'ready' ? directory.tasks.filter(task => targetInScope(task,task.id,current)) : [];
    const book = settings.read(state);
    const candidates = settings.activeList(book,'rules').filter(rule => assignmentRuleInScope(rule,current) &&
      [rule.cleaning.onMatch,rule.cleaning.onMismatch].includes('sameNumber'));
    const attempts = candidates.map(rule => ({rule}));
    if (predictive) {
      const demoTarget = targets[0] || {id:localPredictiveSampleId(state.tenant),name:'本地模拟来电',local:true};
      attempts.push(...candidates.map(rule => ({rule,demoTarget})));
    }
    const receipts = state.skynetReceipts || [];
    const usedPhones = new Set([...state.records.map(task => phoneNumber(task.phone)),
      ...receipts.map(receipt => phoneNumber(receipt.mapped?.phone || receipt.values?.phone))]);
    const count = 3;
    const workbench = window.DReview21Workbench;
    const capacity = workbench.seatCapacity(state,seat,predictive ? 1 : count);
    if (capacity) return {error:capacity + '，暂不能生成 ' + count + ' 条模拟任务。'};
    const now = new Date(Date.now() + 8 * 3600000).toISOString().slice(0,16);
    for (const {rule,demoTarget} of attempts) {
      const category = settings.businessType(current,rule.categoryId);
      const resolved = category && resolveTaskBinding(book,rule,rule.cleaning.nurtureTemplateId,category.value);
      if (!resolved) continue;
      const profile = settings.intakeFieldProfile(current,category.value);
      const {binding,nurture} = resolved;
      const template = deliveryTemplate(book,deliveryBinding(binding),category.value);
      const draft = {...state,records:[...state.records],skynetReceipts:[...receipts]};
      const draftSeat = {...seat};
      const samples = [];
      let phoneIndex = 1;
      for (let index = 1; index <= count; index++) {
        let phone;
        do { phone = '1380009' + String(phoneIndex++).padStart(4,'0'); } while (usedPhones.has(phone));
        const code = 'WB-SIM-' + (sequenceFloor(draft,'receipt') + 1);
        const name = (predictive ? '预外呼模拟线索 ' : '工作台模拟线索 ') + String(index).padStart(2,'0');
        const input = workbenchSampleInput(profile,code,name,phone,now);
        const receipt = makeReceipt(draft,current,input,code,draft.skynetReceipts,category,workbenchSampleSource);
        const {mapped,errors} = mapFields(receipt,profile.fields);
        if (errors.length) break;
        receipt.mapped = mapped;
        const entry = firstPlan(nurture,withPreRating(current,factsFor(receipt),receipt),template);
        // A sample can demonstrate a different first call while retaining the bound strategy for later rounds.
        if (demoTarget && (!['人工外呼',mode].includes(entry.action) || !entry.strategyNodeId)) break;
        const plan = demoTarget ? {...entry,action:mode,actions:[mode],targetTaskId:demoTarget.id,targetSnapshot:undefined} : entry;
        const localTarget = demoTarget?.local === true;
        if (plan.action !== mode || predictive && !localTarget && !targets.some(target => target.id === plan.targetTaskId)) break;
        const processing = localTarget ? {
          ...processingFor({...plan,targetTaskId:undefined},current),destination:demoTarget.name,
          targetTaskId:demoTarget.id,targetTaskName:demoTarget.name,targetTaskType:mode,targetTaskTenantId:state.tenant
        } : processingFor(plan,current);
        if (processing.waitingForTarget) break;
        const task = createTask(draft,receipt,binding);
        task.workbenchSampleSeatId = seat.id;
        task.workbenchSampleMode = mode;
        const waitReason = predictive ? '本坐席的模拟预外呼任务，等待模拟来电。' : '工作台模拟任务，已分派给本人坐席。';
        const status = predictive ? '待预外呼' : '待办理';
        assignTaskPlan(task,receipt,plan,{requiredMode:mode,status,waitReason:predictive ? waitReason : ''});
        if (!predictive) workbench.assign(draft,task,draftSeat);
        task.skynet.processing = predictive ? processing : {...processing,status,destination:'坐席个人待办'};
        commitStrategy(task,plan);
        recordMatchedTemplates(receipt,binding);
        attachReceiptToTask(receipt,task);
        Object.assign(receipt,{...assignmentRuleBinding(rule),status:'已匹配',reason:waitReason,
          completedAt:receipt.receivedAt});
        draft.skynetReceipts.unshift(receipt);
        samples.push(task);
      }
      if (samples.length === count) return {records:draft.records,receipts:draft.skynetReceipts,
        sequences:draft.skynetSequences,newCount:draftSeat.newCount,samples};
    }
    return {error:'当前租户没有可用的' + mode + '模拟配置。请核对启用的分配规则、培育策略及下发模板。'};
  }

  function assignTaskPlan(task, receipt, plan, {requiredMode,status,waitReason}) {
    Object.assign(task,{requiredMode,taskStatus:status,waitReason});
    Object.assign(task.skynet,{action:plan.action,plannedActions:[...plan.actions],decisionEvent:plan.event});
    receipt.reason = waitReason;
  }

  function targetInScope(target,id,context) {
    return Boolean(target?.id === id && target.tenantId === context?.scope?.id &&
      target.brandId === context?.scope?.tenant?.brandId);
  }

  function processingFor(plan,context) {
    const {destination,status} = nurtureDestinations[plan.action];
    const {ruleNumber,priority,event} = plan;
    const processing = {method:plan.action,destination,status,ruleNumber,priority,event};
    if (plan.deliveryGate) {
      const {outcome,ruleNumber} = plan.deliveryGate;
      processing.deliveryGate = {outcome,ruleNumber,...deliveryTypeEvidence(plan.deliveryGate)};
    }
    if (plan.outcome === 'missing') {
      const missing = plan.conditions.filter(item => item.outcome === 'missing');
      processing.missingFields = [...new Set(missing.map(item => item.fieldLabel))];
      processing.missingFieldKeys = [...new Set(missing.map(item => item.field))];
    }
    const rating = plan.conditions.find(item=>item.preRating)?.preRating;
    if (rating) processing.preRating = rating;
    if (plan.strategyParentName) {
      Object.assign(processing,{strategyParentId:plan.strategyParentId,strategyParentName:plan.strategyParentName,
        strategyNodeId:plan.strategyNodeId,strategyNodeName:plan.strategyNodeName,
        strategyFallback:plan.strategyFallback,strategyPath:plan.strategyPath});
    }
    if (plan.coldRuleId) processing.coldRuleId = plan.coldRuleId;
    if (plan.action === '企微培育' && plan.wecomApplication) processing.wecomApplication = structuredClone(plan.wecomApplication);
    if (plan.targetTaskId !== undefined) {
      const id = plan.targetTaskId;
      const resolved = id ? window.DSkynetOutboundTargets?.resolve(context,plan.action,id) : undefined;
      const snapshot = targetInScope(plan.targetSnapshot,id,context) ? plan.targetSnapshot : undefined;
      const target = resolved?.status === 'available' && targetInScope(resolved.task,id,context) ? resolved.task :
        (!resolved || resolved.status === 'unavailable') ? snapshot : undefined;
      Object.assign(processing,{targetTaskId:id,targetTaskType:plan.action,targetTaskName:target?.name || snapshot?.name || id,
        targetTaskTenantId:context.scope.id,
        ...(plan.action==='AI 外呼' && target?.supplierId ? {targetTaskSupplierId:target.supplierId} : {})});
      if (target) {
        processing.destination = plan.action + '任务 · ' + processing.targetTaskName;
      } else {
        processing.status = '待处理';
        processing.destination = '待核对外呼目标';
        processing.waitingForTarget = true;
        processing.targetUnavailableReason = resolved?.reason || '所选' + plan.action + '任务在当前租户不可用。';
      }
    }
    return processing;
  }

  function processingReason(processing) {
    if (processing.waitingForTarget) return processing.targetUnavailableReason;
    const gate = processing.deliveryGate;
    const deliveryRule = gate?.typeLabel && gate.typeLabel + ' · 下发规则 ' + gate.typeRuleNumber;
    if (processing.missingFields) {
      const ratingReason = {
        unconnected:'本租户尚未配置预评分系统。',unavailable:'预评分接口暂不可用。',
        timeout:'预评分接口查询超时。',missing:'预评分接口未返回有效评级。'
      }[processing.preRating?.status] || '';
      return (deliveryRule || '优先级 ' + processing.priority + ' 的规则') + '缺少判定数据（' +
        processing.missingFields.join('、') + '），已转待处理。' + ratingReason;
    }
    if (deliveryRule && gate.outcome === 'matched') return '命中「' + deliveryRule + '」，进入下发办理。';
    return '培育策略选择「' + processing.method + '」，去向为「' + processing.destination + '」。';
  }

  function applyInitialPlan(state,context,task,receipt,book,plan) {
    const policy = plan.directDeliveryTarget ?
      directDeliveryPolicy(context,receipt,deliveryTemplate(book,deliveryBinding(task.skynet),categoryOf(task)),plan.directDeliveryTarget) :
      deliveryActions.has(plan.action) ? taskDeliveryPolicy(state,context,task,book,plan.deliveryGate?.type) : null;
    if (policy?.error) {
      const outcome = holdDeliveryPlan(task,plan,policy);
      Object.assign(receipt,{status:outcome.status,reason:outcome.warning});
      return;
    }
    const processing = processingFor(plan,context);
    const {status} = processing;
    const requiredMode = processing.waitingForTarget ? '' : nurtureDestinations[plan.action].requiredMode;
    let waitReason = processingReason(processing);
    if (plan.action === '人工外呼') waitReason = '人工外呼轮次待租户管理员指派';
    else if (plan.event === '接入后' && plan.deliveryGate && plan.outcome !== 'matched') {
      waitReason = plan.status;
      receipt.status = status;
    } else if (plan.outcome === 'notMatched') waitReason = '未命中可执行培育规则，进入待处理队列。';
    else if (plan.endReason) waitReason = plan.endReason;
    if (processing.missingFieldKeys?.includes(settings.preRatingField?.key)) receipt.status = status;
    assignTaskPlan(task,receipt,plan,{requiredMode,status,waitReason});
    task.skynet.processing = processing;
    if (plan.action === '转冷线索') {
      scheduleColdTransfer(state,context,task,book,plan,processing,receipt);
      return;
    }
    applyManualSeatAssignment(state,context,task,receipt,plan);
    if (!processing.waitingForTarget) commitStrategy(task,plan);
    if (plan.action === '企微培育') {
      const wecom = resolveWecomAssignment(state,context,task);
      if (wecom) {
        recordWecomAssignment(task,wecom);
        receipt.reason = wecom.reason;
      }
    }
    if (plan.endReason) task.skynet.endReason = plan.endReason;
    if (deliveryActions.has(plan.action)) registerDelivery(state,context,receipt,task,plan,policy);
  }

  function applyManualSeatAssignment(state,context,task,receipt,plan) {
    if (!plan.manualAssignment) return;
    const allocation = window.DSkynetSeatAssignment?.apply(state,context,task,plan.manualAssignment,
      plan.ruleNumber,state.assignmentPreviewState);
    if (!allocation) return;
    const assigned = allocation.outcome === 'assigned';
    if (assigned && allocation.preview) Object.assign(task,{ownerId:allocation.seatId,taskStatus:'待办理'});
    const {destination} = nurtureDestinations['人工外呼'];
    task.skynet.processing = {...processingFor(plan),destination:assigned ? '坐席个人待办' : destination,status:task.taskStatus,allocation};
    task.waitReason = receipt.reason = allocation.reason;
  }

  function assignmentEvidence(allocation) {
    if (!allocation) return {};
    const stages = allocation.filterStages?.map(stage => {
      const names = stage.remaining.map(seat => seat.seatName + (seat.value == null ? '' : ' ' + seat.value) +
        (seat.scoreSourceLabel ? ' · ' + seat.scoreSourceLabel : ''));
      return stage.label + ' ' + stage.inputCount + ' → ' + stage.remaining.length +
        (names.length ? '（' + names.join('、') + '）' : '（无剩余坐席）');
    }).join('。');
    return {
      '自动分配策略':allocation.strategyLabel,'自动分配结果':allocation.status,
      ...(stages ? {'逐级过滤轨迹':stages} : {}),
      ...(allocation.scoreSourceLabel ? {'坐席评分依据':allocation.score + ' · ' + allocation.scoreSourceLabel} : {}),
      ...(allocation.seatName ? {'目标坐席':allocation.seatName} : {}),'分配说明':allocation.reason
    };
  }

  function establishAndRouteTask(state,context,receipt,book,binding,nurture,facts) {
    const task = createTask(state,receipt,binding);
    receipt.trace.push({
      nodeId:'nurtureTask',node:'建立培育任务',branch:'created',condition:'同号过滤允许继续处理',
      result:'已建立培育任务',action:'建立任务并绑定模板',next:'培育策略',reason:'任务创建后再判断配置的处理方式。',
      evidence:{'模板绑定':bindingSummary(binding)},actual:{'培育任务':task.taskId,'关联轮次':task.skynet.roundId}
    });

    const plan = firstPlan(nurture,withPreRating(context,facts,task),deliveryTemplate(book,deliveryBinding(task.skynet),receipt.categoryId));
    const method = plan.action;
    applyInitialPlan(state,context,task,receipt,book,plan);
    const outcome = task.skynet.processing;
    const cold = task.skynet.coldTransfer;
    receipt.trace.push({
      nodeId:'nurturePolicy',node:'培育策略',branch:plan.outcome,condition:'以「' + plan.event + '」事件执行已绑定培育模板',
      result:plan.outcome === 'matched' ? '已确定处理方式' : plan.outcome === 'missing' ? '缺少判定字段' : '未命中可执行策略',
      evidence:{'培育模板':nurture.name + ' v' + nurture.version,
        '策略规则':plan.ruleNumber ? '第 ' + plan.ruleNumber + ' 条（优先级 ' + plan.priority + '）' : '暂无',
        ...(plan.strategyNodeId ? {'判定策略':plan.strategyNodeName + (plan.strategyFallback ? '（兜底）' : '')} : {})},
      actual:{'处理方式':method,'处理去向':outcome.destination,'任务状态':outcome.status,
        ...(outcome.targetTaskId ? {'目标任务 ID':outcome.targetTaskId,'目标任务':outcome.targetTaskName} : {}),
        ...(cold ? {'冷线索分配规则':cold.targetRuleName,'冷线索办理结果':cold.result} : {}),
        ...(task.skynet.delivery ? {'下发状态':task.skynet.delivery.status} : {}),
        ...(task.skynet.delivery?.typeLabel ? {'下发类型':task.skynet.delivery.typeLabel} : {}),
        ...assignmentEvidence(outcome.allocation)},
      action:method,next:outcome.destination,reason:receipt.reason
    });
    return task;
  }

  function resolveTaskBinding(book, rule, destination, categoryId) {
    if (!destination) return null;
    const legacySeed = config.templates['1.0'];
    const usesLegacySeed = !rule.cleaning && rule.id === settings.defaultRuleId && rule.version === '1.0' &&
      destination === legacySeed.nurtureTemplateId;
    const lookup = (kind,id) => rule.cleaning
      ? settings.activeList(book,kind).find(item => item.id === id) : settings.current(book,kind,id);
    const nurture = usesLegacySeed
      ? settings.version(book,'nurtureTemplates',destination,legacySeed.nurtureTemplateVersion)
      : lookup('nurtureTemplates',destination);
    const delivery = nurture && (usesLegacySeed
      ? settings.version(book,'deliveryTemplates',legacySeed.deliveryTemplateId,legacySeed.deliveryTemplateVersion)
      : lookup('deliveryTemplates',nurture.deliveryTemplateId));
    return nurture?.categoryId === categoryId && delivery?.categoryId === categoryId &&
      (usesLegacySeed || settings.configurationStatus(nurture) === 'enabled' && settings.configurationStatus(delivery) === 'enabled') ?
      {nurture,binding:templateBinding(rule,nurture,delivery)} : null;
  }

  function recordMatchedTemplates(receipt,binding) {
    Object.assign(receipt,{
      matchedTemplateId:binding.nurtureTemplateId, matchedTemplateName:binding.nurtureTemplateName,
      matchedTemplateVersion:binding.nurtureTemplateVersion, matchedDeliveryTemplateId:binding.deliveryTemplateId,
      matchedDeliveryTemplateName:binding.deliveryTemplateName, matchedDeliveryTemplateVersion:binding.deliveryTemplateVersion
    });
  }

  function attachReceiptToTask(receipt,task) {
    Object.assign(receipt,{
      taskId:task.taskId, recordId:task.id, roundId:task.skynet.roundId,
      taskAssignmentRuleId:task.skynet.assignmentRuleId, taskAssignmentRuleName:task.skynet.assignmentRuleName,
      taskAssignmentRuleVersion:task.skynet.assignmentRuleVersion,
      nurtureAction:task.skynet.action || task.requiredMode,
      nurtureTemplateId:task.skynet.nurtureTemplateId, nurtureTemplateName:task.skynet.nurtureTemplateName,
      nurtureTemplateVersion:task.skynet.nurtureTemplateVersion, deliveryTemplateId:task.skynet.deliveryTemplateId,
      deliveryTemplateName:task.skynet.deliveryTemplateName, deliveryTemplateVersion:task.skynet.deliveryTemplateVersion,
      ...(task.skynet.strategyNodeId ? {strategyNodeId:task.skynet.strategyNodeId,
        strategyPath:structuredClone(task.skynet.strategyPath)} : {}),
      ...(task.skynet.processing ? {nurtureProcessing:structuredClone(task.skynet.processing)} : {})
    });
  }

  function connectTask(state, context, receipt, book, rule, destination, facts) {
    const resolved = resolveTaskBinding(book,rule,destination,receipt.categoryId);
    if (!resolved) {
      receipt.status = '待处理';
      receipt.reason = '当前匹配缺少可用的培育模板或下发模板。';
      receipt.assignmentFailure = receipt.reason;
      return null;
    }
    const {nurture,binding} = resolved;
    recordMatchedTemplates(receipt,binding);
    let task;
    if (rule.cleaning) {
      task = establishAndRouteTask(state,context,receipt,book,binding,nurture,facts);
    } else {
      task = createTask(state,receipt,binding);
      const plan = firstPlan(nurture,withPreRating(context,facts,task),deliveryTemplate(book,deliveryBinding(binding),receipt.categoryId));
      applyInitialPlan(state,context,task,receipt,book,plan);
    }
    attachReceiptToTask(receipt,task);
    return task;
  }

  function process(state, context, intakeId, nativeWindow) {
    const current = submitter(context);
    if (!current || state?.tenant !== current.scope.id) return {error:'当前租户或账号没有清洗办理权限。'};
    const receipt = state.skynetReceipts?.find(item => item.id === intakeId && inScope(current,item));
    if (!receipt) return {error:'当前租户未找到原来件。'};
    if (receipt.status !== '处理中') return {receipt,duplicate:true};
    const book = settings.read(state);
    receipt.categoryId = categoryOf(receipt);
    const stored = receipt.assignmentRuleId && receipt.assignmentRuleVersion &&
      settings.version(book,'rules',receipt.assignmentRuleId,receipt.assignmentRuleVersion);
    const rule = stored?.categoryId === receipt.categoryId && assignmentRuleInScope(stored,current) ? stored : undefined;
    processRule(state,current,receipt,book,rule,nativeWindow);
    return {receipt,duplicate:false};
  }

  function processRule(state, context, receipt, book, rule, nativeWindow) {
    if (!Array.isArray(receipt.inputProfile?.fields)) {
      receipt.inputProfile = structuredClone(settings.intakeFieldProfile(context,receipt.categoryId));
    }
    if (!rule?.cleaning && !rule?.nodes?.length) {
      receipt.status = '待处理';
      receipt.reason = '本次来件指定的分配规则版本不可用，请按原来件核对。';
      receipt.assignmentFailure = receipt.reason;
    } else {
      Object.assign(receipt,assignmentRuleBinding(rule));
      if (rule.cleaning) applyCleaningRule(state,context,receipt,book,rule);
      else applyRule(state,context,receipt,book,rule,nativeWindow);
    }
    receipt.completedAt = new Date().toISOString();
  }

  function handoffContext(state, context) {
    const current = activeContext(context);
    if (!current || state?.tenant !== current.scope.id || !window.DSession.allowed('PAGE-2204',current) ||
        !window.DSession.can('F26',current) || !window.DSession.canWrite('PAGE-2204')) return null;
    return current;
  }

  function handoffOptions(state, context) {
    const current = handoffContext(state,context);
    if (!current) return {rules:[],strategies:[],error:'当前账号没有本租户的接收建任务权限。'};
    const book = settings.read(state);
    const types = settings.businessTypes(current);
    const options = rows => rows.map(({id,name,version,categoryId}) =>
      ({id,name,version,categoryId,categoryName:types.find(type => type.value === categoryId)?.label}));
    const deliveryCategories = new Map(settings.activeList(book,'deliveryTemplates').map(item => [item.id,item.categoryId]));
    const strategies = settings.activeList(book,'nurtureTemplates').filter(item =>
      item.deliveryTemplateId && types.some(type => type.value === item.categoryId) &&
      deliveryCategories.get(item.deliveryTemplateId) === item.categoryId);
    const rules = settings.list(book,'rules').filter(item =>
      settings.ruleById(book,item.id,item.categoryId) && assignmentRuleInScope(item,current) &&
      strategies.some(strategy => strategy.categoryId === item.categoryId));
    return {rules:options(rules),strategies:options(strategies)};
  }

  function stageHandoffTask(state, context, handoff, input, selection, nativeWindow) {
    const current = handoffContext(state,context);
    if (!current || !handoff?.receiptId || !handoff?.deliveryId || !input) return {error:'未找到可用于建任务的接收流水。'};
    const {rules,strategies} = handoffOptions(state,current);
    const chosenRule = rules.find(item => item.id === selection?.ruleId && item.version === selection.ruleVersion);
    const chosenStrategy = strategies.find(item => item.id === selection?.strategyId && item.version === selection.strategyVersion &&
      item.categoryId === chosenRule?.categoryId);
    if (!chosenRule || !chosenStrategy) return {error:'请选择本租户同一二级分类的有效分配规则和培育策略，配置已变化时请重新选择。'};
    const receipts = state.skynetReceipts || [];
    if (receipts.some(item => item.internalHandoff?.deliveryId === handoff.deliveryId ||
        item.internalHandoff?.receiptId === handoff.receiptId)) return {error:'此接收流水已登记，请核对原任务。'};
    const book = settings.read(state);
    const rule = settings.ruleById(book,chosenRule.id,chosenRule.categoryId);
    const businessType = settings.businessType(current,rule.categoryId);
    const route = rule.cleaning ? {...rule,cleaning:{...rule.cleaning,nurtureTemplateId:chosenStrategy.id}} :
      {...rule,nodes:rule.nodes.map(node => ({...node,branches:Object.fromEntries(
        Object.entries(node.branches).map(([key,branch]) => [key,branch.action === '送入培育模板' ?
          {...branch,nurtureTemplateId:chosenStrategy.id} : branch]))}))};
    const source = {value:'INTERNAL-HANDOFF-' + handoff.senderTenantId,label:'内部租户移交'};
    const receipt = makeReceipt(state,current,input,handoff.receiptId,receipts,businessType,source);
    receipt.internalHandoff = {...handoff};
    state.skynetReceipts = [receipt,...receipts];
    processRule(state,current,receipt,book,route,nativeWindow);
    if (receipt.taskRelation !== '新建培育任务') {
      return {error:'所选分配规则未建立新任务。' + (receipt.reason || '请调整选择后重试。')};
    }
    return {taskId:receipt.taskId};
  }

  function transferToColdRule(state,context,task,book,targetRuleId,entryReceipt, timed = false) {
    const canTransfer = entryReceipt ?
      (state.assignmentPreviewState ? trialContext(state,context) :
        canSubmit(context) || timed && taskSeat(state,context,task) || entryReceipt.internalHandoff && handoffContext(state,context)) &&
      isTask(task) && inScope(context,task) && state.records.includes(task) &&
      inScope(context,entryReceipt) && state.skynetReceipts?.includes(entryReceipt) &&
      entryReceipt.taskRelation === '新建培育任务' && entryReceipt.id === task.skynet.intakeId :
      taskSeat(state,context,task) || timed && canSubmit(context) && inScope(context,task) && state.records.includes(task);
    if (!canTransfer || task.taskStatus !== '已结束') return {error:'当前任务未满足转冷线索条件。'};
    const receipts = state.skynetReceipts || [];
    const recorded = receipts.find(receipt => inScope(context,receipt) && receipt.coldTransfer?.fromTaskId === task.taskId);
    if (recorded) return {receipt:recorded,taskId:recorded.taskId,targetRuleId:recorded.assignmentRuleId,result:recorded.status};

    const binding = task.skynet;
    const sourceRule = settings.version(book,'rules',binding.assignmentRuleId,binding.assignmentRuleVersion);
    const sourceNurture = settings.version(book,'nurtureTemplates',binding.nurtureTemplateId,binding.nurtureTemplateVersion);
    const pinnedLegacy = sourceRule && !sourceRule.cleaning || sourceNurture && sourceNurture.strategyTree !== true;
    const priorTarget = pinnedLegacy && settings.current(book,'rules',targetRuleId);
    const rule = settings.coldRule(book,targetRuleId) || (priorTarget && settings.configurationStatus(priorTarget) === 'enabled' ? priorTarget : undefined);
    if (!assignmentRuleInScope(rule,context) || rule.categoryId !== 'lxs' || categoryOf(task) === rule.categoryId ||
        !settings.businessType(context,rule.categoryId) || (!rule.cleaning && !rule.nodes?.length)) {
      return {error:'目标冷线索分配规则未配置或不可用。'};
    }
    const cleaning = rule.cleaning;
    if (cleaning && [cleaning.onMatch,cleaning.onMismatch].includes('sameNumber') &&
        !resolveTaskBinding(book,rule,cleaning.nurtureTemplateId,rule.categoryId)) {
      return {error:'目标冷线索分配规则缺少可用的培育模板或下发模板。'};
    }
    const previous = entryReceipt || originalIntake(state,context,task);
    const values = taskIntakeValues(task,previous);
    const lastStatus = task.skynet.lastRound?.leadStatus || task.followupHistory?.at(-1)?.details?.leadStatus;
    const input = {...values,leadStatus:lastStatus || values.leadStatus};
    const receipt = makeReceipt(state,context,input,'转冷线索-' + task.taskId,receipts,
      {value:rule.categoryId,label:rule.categoryName || '冷线索'});
    Object.assign(receipt,{sourceApplicationId:task.sourceApplicationId || config.sourceApplicationId,
      source:task.source || config.source,coldTransfer:{fromTaskId:task.taskId,fromRoundId:task.skynet.roundId,
        fromIntakeId:task.skynet.intakeId,targetRuleId:rule.id}});

    const originals = new Map(state.records.map(record => [record.id,record]));
    const routing = {...state,
      records:state.records.map(record => ({...record,skynet:record.skynet ? {...record.skynet} : record.skynet})),
      seats:state.seats?.map(seat => ({...seat})),
      skynetSeatRotation:state.skynetSeatRotation ? {...state.skynetSeatRotation} : undefined,
      skynetReceipts:[receipt,...receipts]
    };
    try {
      processRule(routing,context,receipt,book,rule);
    } catch (_) {
      return {error:'冷线索分配规则执行失败，请核对后重试。'};
    }
    state.records = routing.records.map(record => {
      const original = originals.get(record.id);
      if (!original) return record;
      if (record.skynet?.latestIntakeId !== original.skynet?.latestIntakeId) original.skynet = record.skynet;
      return original;
    });
    state.skynetReceipts = routing.skynetReceipts;
    for (const [index,seat] of (state.seats || []).entries()) {
      const routed = routing.seats[index];
      if (seat.newCount !== routed.newCount) seat.newCount = routed.newCount;
    }
    if (routing.skynetSeatRotation) state.skynetSeatRotation = routing.skynetSeatRotation;
    if (routing.skynetSequences) state.skynetSequences = routing.skynetSequences;
    return {receipt,taskId:receipt.taskId,targetRuleId:rule.id,result:receipt.status};
  }

  function cleaningInputs(receipt) {
    const phone = phoneNumber(receipt.mapped?.phone ?? receipt.values?.phone);
    const leadAt = clean(receipt.mapped?.leadAt ?? receipt.values?.leadAt);
    return {
      phone:/^1[3-9]\d{9}$/.test(phone) ? phone : '',
      leadAt, time:validLocalTime(leadAt) ? Date.parse(leadAt + '+08:00') : NaN
    };
  }

  function previousNumberAnchor(state, receipt, input) {
    let latest;
    for (const item of state.skynetReceipts || []) {
      if (item.id === receipt.id || item.tenant !== receipt.tenant || item.brandId !== receipt.brandId ||
          categoryOf(item) !== receipt.categoryId || item.assignmentRuleId !== receipt.assignmentRuleId ||
          item.taskRelation !== '新建培育任务' ||
          (item.sameNumber && item.sameNumber.isAnchor !== true)) continue;
      const prior = cleaningInputs(item);
      if (prior.phone !== input.phone || !Number.isFinite(prior.time) || prior.time > input.time) continue;
      if (!latest || latest.time < prior.time) latest = {id:item.id,leadAt:prior.leadAt,time:prior.time};
    }
    return latest;
  }

  function finishCleaningStep(receipt, step, status, reason) {
    receipt.status = status;
    receipt.reason = reason;
    Object.assign(step,{next:status,reason});
  }

  function filterInTransit(state,context,receipt,book,rule,destination,{sameSourceOnly = false} = {}) {
    const {phone} = cleaningInputs(receipt);
    const filterOtherSources = rule.inTransitFilter !== false;
    const occupied = (state.records || []).filter(task => {
      if (!task.taskId) return false;
      if (isTask(task)) return inScope(context,task) &&
        (inNurture(task) || ['待下发','待下发审核'].includes(task.taskStatus) ||
          ['待下发','待下发审核'].includes(task.skynet.delivery?.status));
      return task.needsNurture === true && task.tenant === receipt.tenant && (!task.brandId || task.brandId === receipt.brandId) &&
        task.taskStatus && !closedTasks.has(task.taskStatus) && !retiredContact(task);
    });
    const sameLead = occupied.filter(task => isTask(task) && receipt.originalKey && receipt.originalKey === task.originalKey &&
      receipt.sourceApplicationId === (task.sourceApplicationId || task.skynet.sourceApplicationId));
    if (sameSourceOnly && !sameLead.length) return false;
    const samePhone = phone && filterOtherSources && !sameSourceOnly ?
      occupied.filter(task => (phoneNumber(task.phone) || phoneNumber(task.businessImportSnapshot?.values?.phone)) === phone) : [];
    const knownTasks = [...new Set([...sameLead,...samePhone])];
    const evidence = {'手机号':phone || '缺少有效手机号','来源线索编号':receipt.originalKey || '—',
      '授权范围':'当前租户及品牌','异源同号在途过滤':filterOtherSources ? '开启' : '关闭',
      '在途任务':knownTasks.map(task => task.taskId).join('、') || '无'};
    const step = {nodeId:'inTransit',node:'在途任务过滤',condition:'按来源线索编号及规范化手机号检查在途培育任务',evidence};
    receipt.trace.push(step);
    if (sameLead.length > 1) {
      Object.assign(step,{branch:'ambiguous',result:'同一来源线索关联多笔在途任务',action:'转待处理'});
      finishCleaningStep(receipt,step,'待处理','同一来源线索关联多笔在途培育任务，请核对原任务。');
      return true;
    }
    if (sameLead.length === 1) {
      const [task] = sameLead;
      const binding = resolveTaskBinding(book,rule,destination,receipt.categoryId)?.binding;
      if (binding) {
        recordMatchedTemplates(receipt,binding);
        if (!sameTemplateBinding(task.skynet,binding)) {
          receipt.templateDifference = '本次命中 ' + bindingSummary(binding) + '。原轮次沿用 ' +
            bindingSummary(task.skynet) + '。';
        }
      }
      task.skynet = {...task.skynet,latestIntakeId:receipt.id};
      receipt.taskRelation = '接续在途任务';
      attachReceiptToTask(receipt,task);
      Object.assign(step,{branch:'sameSource',result:'命中同一来源线索的在途任务',action:'接续原任务',
        actual:{'培育任务':task.taskId,'关联轮次':task.skynet.roundId,'任务状态':task.taskStatus}});
      finishCleaningStep(receipt,step,'已匹配','已关联在途任务并保留原轮次和配置版本。');
      step.next = '原轮次 · ' + task.taskStatus;
      return true;
    }
    if (!filterOtherSources) {
      Object.assign(step,{branch:'bypassed',result:'异源同号在途过滤已关闭',action:'继续',
        next:rule.cleaning ? '同号过滤' : '建立培育任务',reason:'未匹配同源在途任务，按所选分配规则继续处理。'});
      return false;
    }
    if (samePhone.length) {
      receipt.taskRelation = '仅记录';
      Object.assign(step,{branch:'otherSource',result:'同号已有其他来源线索的在途任务',action:'仅记录并过滤'});
      finishCleaningStep(receipt,step,'已过滤','同一手机号已有其他来源线索的在途培育任务，本次来件仅记录并过滤。');
      return true;
    }
    if (!phone) {
      Object.assign(step,{branch:'missing',result:'缺少有效手机号',action:'转待处理'});
      finishCleaningStep(receipt,step,'待处理','在途任务过滤缺少有效手机号。');
      return true;
    }
    Object.assign(step,{branch:'none',result:'未命中在途培育任务',action:'继续',
      next:rule.cleaning ? '同号过滤' : '建立培育任务',reason:'当前手机号未命中在途任务。'});
    return false;
  }

  function cleanSameNumber(state,context,receipt,book,rule,facts) {
    const {sameNumber,nurtureTemplateId} = rule.cleaning;
    const input = cleaningInputs(receipt);
    const previous = input.phone && Number.isFinite(input.time) ? previousNumberAnchor(state,receipt,input) : null;
    const within = Boolean(previous && input.time - previous.time < sameNumber.windowMinutes * 60_000);
    const windowLabel = settings.sameNumberWindows.find(item => Number(item.value) === sameNumber.windowMinutes)?.label;
    const evidence = {
      '归一化号码':input.phone || '缺少有效手机号', '留资时间':input.leadAt || '缺少留资时间',
      '分配规则 ID':rule.id,
      '时间窗口':windowLabel || sameNumber.windowMinutes + ' 分钟',
      '窗口起点来件':previous?.id || '暂无',
      '窗口起点留资时间':previous?.leadAt || '暂无'
    };
    const step = {nodeId:'sameNumber',node:'同号过滤',condition:'在同一分配规则内按手机号与留资时间判断窗口',
      branch:'missing',result:'缺少判断依据',evidence,actual:'未执行同号过滤',action:'转待处理'};
    receipt.trace.push(step);
    if (!input.phone || !Number.isFinite(input.time)) {
      const missing = [
        ...(!input.phone ? ['有效手机号'] : []),
        ...(!Number.isFinite(input.time) ? ['精确留资时间'] : [])
      ].join('和');
      finishCleaningStep(receipt,step,'待处理','同号过滤缺少' + missing + '。');
      return;
    }
    const branch = within ? 'within' : previous ? 'expired' : 'new';
    Object.assign(step,{branch,result:within ? '窗口内同号' : previous ? '上个窗口已结束' : '首次出现',
      actual:previous ? '距窗口起点 ' + (input.time - previous.time) / 60_000 + ' 分钟' : '暂无同号窗口'});
    const decision = {
      assignmentRuleId:rule.id,normalizedPhone:input.phone,leadAt:input.leadAt,windowMinutes:sameNumber.windowMinutes,withinWindow:within,
      isAnchor:false,anchorReceiptId:previous?.id,anchorLeadAt:previous?.leadAt
    };
    receipt.sameNumber = decision;
    if (within && sameNumber.matchAction === 'firstOnly') {
      const anchorTask = (state.records || []).find(task => isTask(task) && inScope(context,task) &&
        categoryOf(task) === receipt.categoryId && task.skynet.intakeId === previous.id &&
        task.skynet.assignmentRuleId === receipt.assignmentRuleId);
      if (anchorTask && (anchorTask.taskStatus === '已下发' || anchorTask.skynet.endReason === '已下发' ||
          deliveryState(anchorTask)?.status === '已下发')) {
        decision.deliveryClosed = true;
        Object.assign(step,{action:'转待处理'});
        finishCleaningStep(receipt,step,'待处理','首笔来件的培育任务已下发，请核对本笔线索的处理去向。');
      } else if (anchorTask) {
        receipt.taskRelation = '窗口内关联原任务';
        attachReceiptToTask(receipt,anchorTask);
        Object.assign(step,{action:'关联首笔来件的培育任务',actual:{'关联培育任务':anchorTask.taskId}});
        finishCleaningStep(receipt,step,'仅记录','本次同号来件已关联窗口首笔的培育任务。');
      } else {
        receipt.taskRelation = '仅记录';
        Object.assign(step,{action:'仅记录'});
        finishCleaningStep(receipt,step,'仅记录','同一手机号在固定窗口内已有首笔来件，仅记录本次来件。');
      }
      return;
    }
    receipt.status = '已匹配';
    const task = connectTask(state,context,receipt,book,rule,nurtureTemplateId,facts);
    if (!within && receipt.taskRelation === '新建培育任务') {
      Object.assign(decision,{isAnchor:true,anchorReceiptId:receipt.id,anchorLeadAt:input.leadAt});
      Object.assign(evidence,{'本次开启窗口':receipt.id,'本次窗口起点留资时间':input.leadAt});
    }
    if (receipt.taskRelation === '新建培育任务') {
      Object.assign(step,{action:'继续处理',next:'建立培育任务',reason:'通过同号过滤，建立培育任务后再判断处理方式。'});
    } else {
      Object.assign(step,{
        action:task ? '继续处理 → ' + receipt.taskRelation : '转待处理',
        next:task ? task.taskStatus : receipt.status,reason:receipt.templateDifference || receipt.reason
      });
    }
  }

  function applyCleaningRule(state, context, receipt, book, rule) {
    const cleaning = rule.cleaning;
    const validated = validateIntakeFields({},receipt);
    const basic = {...validated,nodeId:'fields',node:'基础校验',condition:'按二级分类核对来件字段、格式与字典',
      action:validated.branch === 'valid' ? '继续' : '过滤并结束'};
    receipt.trace = [basic];
    if (validated.branch !== 'valid') {
      finishCleaningStep(receipt,basic,'已过滤',validated.actual);
      return;
    }
    basic.next = '流入规则';
    basic.reason = '通过基础校验后按配置判断流入规则。';
    const facts = factsFor(receipt);
    const {logic,conditions} = cleaning;
    const matched = settings.matchRule(logic,conditions,facts);
    const missing = matched === null;
    const direction = missing ? null : (matched ? cleaning.onMatch : cleaning.onMismatch);
    const conditionsText = conditions.map(condition => describeCondition(condition,receipt.inputProfile.fields));
    const missingFields = new Set();
    const evidence = Object.fromEntries(conditions.map((condition,index) => {
      const checks = settings.matches(condition,facts);
      const field = matchField(condition.field,receipt.inputProfile.fields);
      if (checks === null) missingFields.add(field?.label || condition.field);
      const value = fieldValue(field,facts[condition.field]);
      const result = checks === null ? '缺少判定值' : checks ? '满足' : '不满足';
      return ['条件 ' + (index + 1),conditionsText[index] + '（实际 ' + value + '，' + result + '）'];
    }));
    const flow = {nodeId:'flow',node:'流入规则',condition:conditionsText.join(logic === 'or' ? ' 或 ' : ' 且 ') || '未设限制',
      branch:missing ? 'missing' : matched ? 'matched' : 'unmatched',
      result:missing ? '流入条件暂无法判定' : matched ? '满足流入条件' : '不满足流入条件',
      evidence,actual:missing ? '缺少判定值' : (logic === 'or' ? '任一条件满足' : '全部条件满足') + ' · ' + (matched ? '成立' : '不成立'),
      action:missing ? '转待处理' : direction === 'sameNumber' ? '进入在途任务过滤' : '过滤并结束'};
    receipt.trace.push(flow);
    if (direction !== 'sameNumber') {
      if (filterInTransit(state,context,receipt,book,rule,cleaning.nurtureTemplateId,{sameSourceOnly:true})) {
        Object.assign(flow,{action:'核对同源在途任务',next:'在途任务过滤',reason:'同一来源线索进入原任务核对。'});
        return;
      }
      if (missing) {
        finishCleaningStep(receipt,flow,'待处理','流入规则缺少影响判定的字段：' + [...missingFields].join('、') + '。');
      } else {
        finishCleaningStep(receipt,flow,'已过滤',flow.result + '，按配置直接过滤并结束。');
      }
      return;
    }
    flow.next = '在途任务过滤';
    flow.reason = flow.result + '，先检查在途培育任务。';
    if (!filterInTransit(state,context,receipt,book,rule,cleaning.nurtureTemplateId)) {
      cleanSameNumber(state,context,receipt,book,rule,facts);
    }
  }

  function applyRule(state, context, receipt, book, rule, nativeWindow) {
    let history;
    let index = 0;
    receipt.trace = [];
    while (index < rule.nodes.length) {
      const node = rule.nodes[index];
      const {branch,result,evidence,actual,reason:observedReason,history:observedHistory} =
        evaluate(node,state,context,receipt,history,nativeWindow);
      if (observedHistory) history = observedHistory;
      const step = node.branches[branch];
      const condition = conditionSummary(node,receipt.inputProfile.fields);
      if (!step) {
        receipt.status = '待处理';
        receipt.reason = '当前分配规则缺少此结果的处理动作。';
        receipt.trace.push({nodeId:node.id,branch,node:node.label,condition,evidence,actual,result,reason:receipt.reason,
          action:'转待处理',next:receipt.status});
        return;
      }
      const reason = observedReason || step.reason || (branch === 'invalid' ? actual : result);
      const detail = {nodeId:node.id,branch,node:node.label,condition,evidence,actual,result,reason,action:step.action};
      receipt.trace.push(detail);
      const checkInTransit = node.id === 'fields' && branch === 'valid' &&
        (step.action === '继续' || step.action === '送入培育模板');
      if (checkInTransit) {
        detail.next = '在途任务过滤';
        const destination = step.nurtureTemplateId || rule.nodes.find(item => item.id === 'template')?.branches?.matched?.nurtureTemplateId;
        if (filterInTransit(state,context,receipt,book,rule,destination)) return;
      }
      if (!checkInTransit && node.id === 'fields' && branch === 'valid' &&
          filterInTransit(state,context,receipt,book,rule,undefined,{sameSourceOnly:true})) {
        Object.assign(detail,{action:'核对同源在途任务',next:'在途任务过滤',reason:'同一来源线索进入原任务核对。'});
        return;
      }
      if (step.action === '继续') {
        const next = step.next ? rule.nodes.findIndex(item => item.id === step.next) : index + 1;
        if (next > index && next < rule.nodes.length) {
          if (checkInTransit) receipt.trace.at(-1).next = rule.nodes[next].label;
          else detail.next = rule.nodes[next].label;
          index = next;
          continue;
        }
        receipt.status = step.next ? '待处理' : '待匹配';
        receipt.reason = step.next ? '配置的后续节点无法继续执行。' : '规则节点已执行完毕，当前没有匹配的处理去向。';
      } else {
        receipt.status = step.status || '待处理';
        receipt.reason = reason;
        if (receipt.status === '已匹配') {
          const task = connectTask(state,context,receipt,book,rule,step.nurtureTemplateId,factsFor(receipt,history));
          if (task) {
            detail.action += ' → ' + receipt.taskRelation;
            detail.actual = {...(actual && typeof actual === 'object' ? actual : {'判定值':actual}),
              '培育任务':receipt.taskId, '关联轮次':receipt.roundId, '承接动作':receipt.nurtureAction,
              ...(task.skynet.delivery ? {'下发状态':task.skynet.delivery.status} : {}),
              ...assignmentEvidence(receipt.nurtureProcessing?.allocation)};
            detail.next = receipt.taskRelation === '接续在途任务' ? '原轮次 · ' + task.taskStatus :
              task.skynet.delivery ? '待坐席手动下发' : task.taskStatus;
          } else {
            detail.action = '转待处理';
          }
        }
      }
      detail.reason = receipt.templateDifference || receipt.reason;
      detail.next ||= receipt.status;
      return;
    }
  }

  function trialContext(state, context) {
    const current = activeContext(context);
    return current && state?.tenant === current.scope.id && settings.canManage(current) ? current : null;
  }

  function eligibleTrialTasks(state, context, categoryId) {
    return (state.records || []).filter(record => isTask(record) && inScope(context,record) &&
      sources.some(source => source.value === record.sourceApplicationId) && inNurture(record) &&
      (!categoryId || categoryOf(record) === categoryId));
  }

  function frozenBinding(record, book, state, context) {
    const binding = record.skynet;
    const nurture = settings.version(book,'nurtureTemplates',binding.nurtureTemplateId,binding.nurtureTemplateVersion);
    const delivery = settings.version(book,'deliveryTemplates',binding.deliveryTemplateId,binding.deliveryTemplateVersion);
    return {
      taskId:record.taskId, roundId:binding.roundId, roundNumber:currentRoundNumber(record),
      assignmentRuleId:binding.assignmentRuleId, assignmentRuleName:binding.assignmentRuleName,
      assignmentRuleVersion:binding.assignmentRuleVersion,
      nurtureTemplateId:binding.nurtureTemplateId, nurtureTemplateVersion:binding.nurtureTemplateVersion,
      nurtureTemplateName:binding.nurtureTemplateName || nurture?.name,
      deliveryTemplateId:binding.deliveryTemplateId, deliveryTemplateVersion:binding.deliveryTemplateVersion,
      deliveryTemplateName:binding.deliveryTemplateName || delivery?.name,
      callMethod:previousCallEvidence(state,context,record,nurture).callMethod,
      ...(binding.strategyNodeId ? {strategyNodeId:binding.strategyNodeId,strategyPath:structuredClone(binding.strategyPath)} : {})
    };
  }

  function previewTasks(state, context, categoryId) {
    const current = trialContext(state,context);
    if (!current) return [];
    const book = settings.read(state);
    return eligibleTrialTasks(state,current,categoryId).map(record => frozenBinding(record,book,state,current));
  }

  function deliveryState(task) {
    if (!isTask(task)) return null;
    const saved = task.skynet.delivery;
    if (['已下发','待下发审核'].includes(saved?.status)) return structuredClone(saved);
    if (saved?.status === '待下发') {
      const pending = {mode:'oneToOne',roundId:task.skynet.roundId,...structuredClone(saved),
        ...(saved.directStore ? {} : pendingDeliveryType(saved))};
      if (pending.target?.type === 'internalTenant' && !pending.targetType && !pending.directStore) {
        delete pending.target;
        Object.assign(pending,{targetType:'internalTenant',auditEnabled:true,auditStatus:'待选择接收租户'});
      }
      return pending;
    }
    if (saved) return null;
    if (task.taskStatus === '待下发' && task.skynet.deliveryTemplateId && task.skynet.deliveryTemplateVersion) {
      return {...deliveryBinding(task.skynet),status:'待下发',roundId:task.skynet.roundId,
        mode:'oneToOne',action:task.skynet.action,...pendingDeliveryType(task.skynet.processing?.deliveryGate || {})};
    }
    return null;
  }

  function taskSeat(state, context, task) {
    const current = activeContext(context);
    const session = window.DSession;
    if (!current || state?.tenant !== current.scope.id || !isTask(task) || !inScope(current,task) ||
        !state.records?.includes(task) || !task.ownerId || state.seatId !== task.ownerId ||
        !session.allowed('PAGE-2202',current) || !session.can('F37',current)) return null;
    const seat = state.seats?.find(item => item.id === task.ownerId && item.tenant === state.tenant &&
      (!item.brandId || item.brandId === task.brandId) && item.accountId === current.account.id &&
      item.enabled === true && item.bindingState === '已关联');
    return seat ? {seat,account:current.account} : null;
  }

  function wecomTaskInScope(state, context, task) {
    return Boolean(state && task?.taskId && isTask(task) && task.skynet.roundId === task.roundId &&
      task.taskStatus === '待企微培育' && !reachedDelivery(task) && state.tenant === task.tenant &&
      state.records?.includes(task) && inScope(context,task));
  }

  function canManageWecomAssignment(context) {
    const session = window.DSession;
    return /_admin$/.test(session.roleKey(context)) && session.allowed('PAGE-2226',context) && session.can('F24',context);
  }

  function wecomSeatAccount(state, task, seat) {
    if (!seat || seat.tenant !== state.tenant || seat.brandId && seat.brandId !== task.brandId ||
        !state.seats?.includes(seat)) return {error:'请选择本租户及品牌的坐席。'};
    if (seat.enabled !== true || seat.bindingState !== '已关联' || !seat.accountId) {
      return {error:'坐席需启用并关联内部账号。'};
    }
    if (Array.isArray(task.eligibleSeatIds) && !task.eligibleSeatIds.includes(seat.id)) {
      return {error:'该坐席不在当前任务的承接范围内。'};
    }
    const member = window.DOrganization?.members?.(state.tenant)?.find(row => row.account.id === seat.accountId);
    if (!member?.account.enabled || !member.member?.enabled ||
        !member.member.modules?.includes('cloud') || !member.member.pages?.includes('PAGE-2202')) {
      return {error:'坐席账号需启用并具备培育工作台权限。'};
    }
    const external = window.DReview21Accounts?.read(state.tenant,seat.accountId);
    if (!external || external.unavailable) return {error:'该坐席的企微账号关联暂不可核对。'};
    const workWeChat = clean(external.workWeChat);
    return workWeChat ? {workWeChat} : {error:'该坐席没有有效的企微账号关联。'};
  }

  function previousWecomRound(state,task) {
    const number = currentRoundNumber(task) - 1;
    if (number < 1) return null;
    const expectedId = task.taskId + '-' + String(number).padStart(2,'0');
    const rounds = [task.skynet.lastRound,...(task.skynet.completedRounds || [])];
    const round = rounds.find(item=>item?.roundId===expectedId) ||
      rounds.find(item=>item?.roundId && item.roundId!==task.roundId && item.number===number);
    const roundId = round?.roundId || expectedId;
    const visit = [...(task.followupHistory || [])].reverse().find(item => item.roundId === roundId);
    const previousWecom = task.skynet.wecom?.roundId === roundId ? task.skynet.wecom : null;
    let method = nurtureMethod(round?.callMethod) || nurtureMethod(visit?.callMode || visit?.callType) ||
      (previousWecom ? '企微培育' : '');
    if (!method && round?.strategyNodeId) {
      const {nurtureTemplateId,nurtureTemplateVersion} = task.skynet;
      const nurture = settings.version(settings.read(state),'nurtureTemplates',nurtureTemplateId,nurtureTemplateVersion);
      const strategy = strategyPathFor(nurture?.rules || [],round.strategyNodeId)?.at(-1);
      if (strategy) method = nurtureMethod(nurtureAction(strategy));
    }
    return {method,seatId:visit?.seat || previousWecom?.seatId || ''};
  }

  function wecomRoundState(task, status, next, seatId = '', workWeChat = '', reason) {
    const roundId = task.skynet.roundId;
    const application = task.skynet.processing?.wecomApplication;
    return {roundId,visitId:'TW-WECOM-' + roundId,status,next,seatId,workWeChat,reason,
      ...(application ? {application:structuredClone(application)} : {})};
  }

  function readyWecomRound(task, next, seat, workWeChat) {
    return next === 'friendship'
      ? wecomRoundState(task,'待核验好友',next,seat.id,workWeChat,'等待按本轮承接坐席的企微账号核验好友关系。')
      : wecomRoundState(task,'待推送企微移交包',next,seat.id,workWeChat,'等待按本轮承接坐席推送企微移交包。');
  }

  const wecomStages = Object.freeze({
    待核验好友:'friendship',
    待添加好友:'push',
    待推送企微移交包:'push',
    待企微完成回包:'completion',
    已收到企微完成回包:'finished'
  });

  function resolveWecomAssignment(state, context, task) {
    if (!wecomTaskInScope(state,context,task)) return null;
    const saved = task.skynet.wecom;
    if (saved?.roundId === task.roundId) {
      if (!['friendship','push'].includes(saved.next)) return null;
      if (['待指定','待改派'].includes(saved.status)) return saved;
      if (!Object.hasOwn(wecomStages,saved.status) || saved.status === '已收到企微完成回包') return null;
      const seat = state.seats?.find(item=>item.id===saved.seatId);
      const {error,workWeChat} = wecomSeatAccount(state,task,seat);
      if (!error && task.ownerId===saved.seatId && workWeChat===saved.workWeChat) return saved;
      return wecomRoundState(task,'待改派',saved.next,saved.seatId,'',
        error ? error+'等待管理员重新指派。' : '原承接坐席或企微账号已变化，等待管理员重新指派。');
    }

    const previous = previousWecomRound(state,task);
    if (!previous || previous.method === 'AI 外呼') {
      return wecomRoundState(task,'待指定','push','','','等待管理员指定具有有效企微账号的坐席。');
    }
    if (!previous.method) return null;

    const next = previous.method === '企微培育' ? 'push' : 'friendship';
    const seat = state.seats?.find(item=>item.id===previous.seatId);
    const {error,workWeChat} = wecomSeatAccount(state,task,seat);
    if (!error && task.ownerId===previous.seatId) return readyWecomRound(task,next,seat,workWeChat);
    const reason = !previous.seatId ? '上一轮承接坐席无法核对，等待管理员改派。' :
      error ? error+'等待管理员改派。' : '本轮需重新确认承接坐席，等待管理员指派。';
    return wecomRoundState(task,'待改派',next,previous.seatId,'',reason);
  }

  function wecomAssignmentState(state, context, task) {
    if (!activeContext(context) || !(canManageWecomAssignment(context) || taskSeat(state,context,task))) return null;
    const resolved = resolveWecomAssignment(state,context,task);
    if (!resolved) return null;
    const {roundId,visitId,status,next,seatId,reason} = resolved;
    return {roundId,visitId,status,next,seatId,reason};
  }

  function wecomSeatEligibility(state, context, task, seat) {
    if (!activeContext(context) || !canManageWecomAssignment(context) || !wecomTaskInScope(state,context,task)) {
      return '当前任务不在可指派的企微培育范围内。';
    }
    return wecomSeatAccount(state,task,seat).error || '';
  }

  function recordWecomAssignment(task,wecom) {
    task.skynet = {...task.skynet,wecom,processing:{...task.skynet.processing,destination:wecom.status}};
    task.waitReason = wecom.reason;
  }

  function assignWecomSeat(state, context, task, seat) {
    if (!window.DReview21.isLatest(state) || wecomSeatEligibility(state,context,task,seat)) return false;
    if (task.callState || task.assignmentPending || task.pendingReassignment) return false;
    const pending = resolveWecomAssignment(state,context,task);
    if (!pending || !['待指定','待改派'].includes(pending.status)) return false;
    const {error,workWeChat} = wecomSeatAccount(state,task,seat);
    if (error) return false;
    const ready = readyWecomRound(task,pending.next,seat,workWeChat);
    const previous = task.skynet.wecom;
    if (previous?.roundId === ready.roundId && previous.visitId === ready.visitId && previous.firstPushedAt) {
      ready.firstPushedAt = previous.firstPushedAt;
      if (previous.progressHistory) ready.progressHistory = previous.progressHistory;
      if (previous.reminders) ready.reminders = previous.reminders;
    }
    if (pending.seatId && pending.seatId!==seat.id) ready.previousSeatId = pending.seatId;
    Object.assign(task,{ownerId:seat.id,expectedSeatId:'',assignedOn:state.today,requiredMode:'企微培育'});
    recordWecomAssignment(task,ready);
    return true;
  }

  const wecomDay = 24 * 60 * 60 * 1000;
  const wecomReminderLimit = 7 * wecomDay;

  function wecomFollowupSegment(wecom) {
    const lastProgress = wecom.progressHistory?.at(-1);
    const since = lastProgress?.at || wecom.firstPushedAt;
    const time = Date.parse(since);
    if (!Number.isFinite(time)) return null;
    const key = lastProgress ? 'progress:' + lastProgress.callbackId : 'first-push:' + wecom.visitId;
    const reminder = wecom.reminders?.find(item=>item.segmentId === key);
    return {key,since,time,lastProgress,reminder};
  }

  function wecomApplicationAccess(context,task,wecom) {
    const application = wecom?.application || task.skynet.processing?.wecomApplication;
    if (!application?.id || !application.revision || !application.connectionKey) {
      return {ok:false,application,message:'原企微策略尚未关联转企微跟进应用，请重新关联后办理。'};
    }
    try {
      const result = window.DIntegrationApplications?.resolveScenarioApplication(context,'转企微跟进',application.id,application);
      if (result?.ok && result.status === 'available' && result.application?.id === application.id) return result;
      return {ok:false,application,message:result?.message || '原企微应用已失效或配置版本已变化，请核对关联。'};
    } catch (_) {
      return {ok:false,application,message:'企微应用配置暂不可核对，请稍后重试。'};
    }
  }

  function wecomWorkbenchState(state, context, task) {
    if (!taskSeat(state,context,task)) return null;
    const latest = task.followupHistory?.at(-1);
    const wecom = resolveWecomAssignment(state,context,task) ||
      (latest?.roundId === task.roundId ? latest.wecom : null);
    if (!wecom?.visitId || wecom.roundId !== task.roundId ||
        !Object.hasOwn(wecomStages,wecom.status) || wecom.seatId !== task.ownerId) return null;
    const stage = wecomStages[wecom.status];
    const access = wecomApplicationAccess(context,task,wecom);
    const application = access.application || wecom.application || task.skynet.processing?.wecomApplication;
    const {roundId,visitId,seatId,status,reason,friendshipOutcome,pushOutcome,firstPushedAt} = wecom;
    const segment = wecomFollowupSegment(wecom);
    const tracking = stage === 'completion' && Boolean(segment);
    const reminderDue = tracking && !segment.reminder && Date.now() - segment.time > wecomReminderLimit;
    const ownReminder = tracking && segment.reminder?.seatId === seatId ? segment.reminder : null;
    return {roundId,visitId,seatId,status,stage,reason:!access.ok && stage !== 'finished' ? access.message : reason,
      applicationId:application?.id || '',connectionKey:application?.connectionKey || '',applicationName:application?.name || '',
      applicationUnavailable:!access.ok && stage !== 'finished',friendshipOutcome,pushOutcome,firstPushedAt,
      followupSince:segment?.since,lastProgressAt:segment?.lastProgress?.at,lastProgressResult:segment?.lastProgress?.result,
      reminderDue,overdue:tracking && (reminderDue || Boolean(segment.reminder)),
      reminderDueAt:tracking && !segment.reminder ? new Date(segment.time + wecomReminderLimit + 1).toISOString() : undefined,
      reminderSentAt:ownReminder?.sentAt,reminderSimulated:ownReminder?.mock === true,
      canAct:access.ok && stage !== 'finished' && !task.callState && window.DReview21.isLatest(state)};
  }

  function checkWecomFriendship(task, wecom, outcome) {
    if (!['friend','notFriend','failed'].includes(outcome)) return {error:'请选择模拟好友核验结果。'};
    if (!/^1[3-9]\d{9}$/.test(phoneNumber(task.phone))) return {error:'原培育任务缺少可用于好友核验的手机号。'};
    const feedback = {
      friend:['待推送企微移交包','模拟核验确认已是好友，可以推送本轮企微移交包。'],
      notFriend:['待添加好友','模拟核验确认尚未添加好友。添加后可以重新推送本轮企微培育任务。'],
      failed:['待核验好友','模拟好友核验失败，请对本轮重新查询。']
    };
    const [status,reason] = feedback[outcome];
    return {...wecom,status,reason,friendshipOutcome:outcome};
  }

  function pushWecomHandoff(task, wecom, {outcome,friendAdded}, at) {
    if (!['success','failed'].includes(outcome)) return {error:'请选择模拟企微推送结果。'};
    if (wecom.status === '待添加好友' && friendAdded !== true) return {error:'请先确认已添加企微好友。'};
    const added = wecom.status === '待添加好友';
    const handoff = {
      taskId:task.taskId,roundId:wecom.roundId,visitId:wecom.visitId,mock:true,
      application:structuredClone(wecom.application),applicationId:wecom.application.id,connectionKey:wecom.application.connectionKey,
      priorVisits:(task.followupHistory || []).map(visit=>({
        roundId:visit.roundId,visitId:visit.visitId || visit.id,callMode:visit.callMode || visit.callType,
        date:visit.date,result:visit.result,note:visit.note,details:structuredClone(visit.details || {})
      }))
    };
    const success = outcome === 'success';
    return {...wecom,handoff,pushOutcome:outcome,
      ...(added ? {friendAddedAt:at} : {}),
      ...(success ? {firstPushedAt:wecom.firstPushedAt || at} : {}),
      status:success ? '待企微完成回包' : '待推送企微移交包',
      reason:success ? '本轮企微移交包已模拟推送，等待完成回包。' : '本轮企微移交包模拟推送失败，请重试。'};
  }

  function wecomCallbackFacts(context, task, request) {
    if (['callStatus','callTags','tags'].some(key=>Object.hasOwn(request,key))) {
      return {error:'企微回包仅接收本轮的回访字段。'};
    }
    const result = clean(request.result);
    const note = clean(request.note);
    if (!result || result.length > 100 || note.length > 1000) {
      return {error:'请输入 1 至 100 字的回访结果及至多 1000 字的回访备注。'};
    }
    const intent = settings.roundFields.find(field=>field.key==='round.intentLevel');
    const lead = settings.intakeFieldProfile(context,categoryOf(task)).fields.find(field=>field.key==='leadStatus');
    const intentLevel = clean(request.intentLevel);
    const leadStatus = clean(request.leadStatus);
    if (intentLevel && !intent?.options?.some(option=>option.value===intentLevel) ||
        leadStatus && !lead?.options?.some(option=>option.value===leadStatus)) {
      return {error:'请选择本业务分类可用的意向等级或线索状态。'};
    }
    return {result,note,intentLevel,leadStatus};
  }

  function matchesWecomHandoff(wecom, request) {
    const handoff = wecom.handoff;
    return wecom.pushOutcome === 'success' && handoff?.taskId === request.taskId &&
      handoff.roundId === request.roundId && handoff.visitId === request.visitId &&
      handoff.applicationId === request.applicationId && handoff.connectionKey === request.connectionKey;
  }

  function saveWecomProgress(state, context, task, wecom, request, at) {
    const callbackId = clean(request.callbackId);
    if (!callbackId || callbackId.length > 100) return {error:'缺少有效的模拟进展回包编号。'};
    const facts = wecomCallbackFacts(context,task,request);
    if (facts.error) return facts;
    const history = wecom.progressHistory || [];
    if (history.some(item=>item.callbackId === callbackId)) {
      return {ok:true,status:wecom.status,reason:'这条企微进展回包已登记。',duplicate:true};
    }
    const reason = '本轮企微进展已登记，跟进计时重新开始。';
    const updated = {...wecom,reason,progressHistory:[...history,{callbackId,at,...facts}]};
    return saveRoundMutation(state,task,()=>{
      recordWecomAssignment(task,updated);
      appendScenarioEvidence(task,'转企微跟进',wecom.application,'企微进展回包','success',reason,{externalId:callbackId,at});
      return {ok:true,status:updated.status,reason};
    },'企微进展回包未保存，请重试。');
  }

  function checkWecomReminder(state, task, wecom, request, at) {
    const segment = wecomFollowupSegment(wecom);
    if (!segment) return {error:'当前企微轮次缺少有效的跟进起点。'};
    const mock = request.mockElapsedDays !== undefined;
    const days = request.mockElapsedDays;
    if (mock && (!Number.isFinite(days) || days < 0 || days > 365)) return {error:'请输入有效的模拟未跟进天数。'};
    const checkedAt = mock ? segment.time + days * wecomDay : Date.parse(at);
    if (segment.reminder) {
      return {ok:true,status:wecom.status,reason:'本轮当前超时段已登记提醒。',notified:false};
    }
    if (checkedAt - segment.time <= wecomReminderLimit) {
      return {ok:true,status:wecom.status,reason:'本轮连续未跟进时长尚未超过 7 天。',notified:false};
    }
    const reminder = {segmentId:segment.key,since:segment.since,seatId:wecom.seatId,sentAt:at,
      checkedAt:new Date(checkedAt).toISOString(),mock};
    const updated = {...wecom,reminders:[...(wecom.reminders || []),reminder]};
    return saveRoundMutation(state,task,()=>{
      recordWecomAssignment(task,updated);
      return {ok:true,status:updated.status,reason:'本轮超过 7 天未收到有效企微结果，已记录跟进提醒。',notified:true};
    },'企微超时提醒未保存，请重试。');
  }

  function finishWecomVisit(state, context, task, wecom, facts, at, nativeWindow) {
    const {result,note,intentLevel,leadStatus} = facts;
    const {workWeChat,...evidence} = wecom;
    const completion = {...evidence,status:'已收到企微完成回包',reason:'本轮企微完成回包已登记。',completedAt:at};
    const details = {...(intentLevel ? {intentLevel} : {}),...(leadStatus ? {leadStatus} : {})};
    const visit = {taskId:task.taskId,roundId:wecom.roundId,roundNumber:currentRoundNumber(task),visitId:wecom.visitId,
      date:state.today,seat:wecom.seatId,callMode:'企微培育',result,note,leadStatus,details,
      detailFields:[...(intentLevel ? [['intentLevel','意向等级']] : []),...(leadStatus ? [['leadStatus','线索状态']] : [])],
      at,wecom:completion};
    task.skynet = {...task.skynet,wecom:{...completion,workWeChat}};
    Object.assign(task,{followupResult:result,followupNote:note,lastFollowupAt:state.today,nextAt:'',
      visitDetails:details,visitOptionValues:details,followupHistory:[...(task.followupHistory || []),visit],
      followupCount:Number(task.followupCount || 0) + 1});
    if (intentLevel) task.intentLevel = intentLevel;
    return completeRound(state,context,task,{nativeWindow});
  }

  function simulateWecomAction(state, context, task, request = {}) {
    const summary = wecomWorkbenchState(state,context,task);
    if (summary?.applicationUnavailable) return {error:summary.reason};
    if (!summary?.canAct || !request || request.taskId !== task.taskId || request.roundId !== summary.roundId ||
        request.visitId !== summary.visitId) return {error:'企微任务或本轮承接状态已变化，请刷新后核对。'};
    if (request.applicationId !== summary.applicationId || request.connectionKey !== summary.connectionKey) {
      return {error:'企微回包的应用身份与本轮绑定应用不一致，未推进任务。'};
    }
    const {action,outcome} = request;
    const wecom = resolveWecomAssignment(state,context,task);
    if (!wecom || wecom.seatId !== summary.seatId || wecom.status !== summary.status) {
      return {error:'企微任务或本轮承接状态已变化，请刷新后核对。'};
    }
    if (summary.stage === 'completion' && !matchesWecomHandoff(wecom,request)) {
      return {error:'企微回包未匹配本轮移交包的应用身份，未推进任务。'};
    }
    const at = new Date().toISOString();
    let updated;
    if (action === 'friendship' && ['待核验好友','待添加好友'].includes(wecom.status)) {
      updated = checkWecomFriendship(task,wecom,outcome);
    } else if (action === 'push' && summary.stage === 'push') {
      updated = pushWecomHandoff(task,wecom,request,at);
    } else if (summary.stage === 'completion' && matchesWecomHandoff(wecom,request)) {
      if (action === 'progress') return saveWecomProgress(state,context,task,wecom,request,at);
      if (action === 'reminder') return checkWecomReminder(state,task,wecom,request,at);
      if (action === 'complete' &&
          !task.followupHistory?.some(visit=>visit.roundId === request.roundId || visit.visitId === request.visitId) &&
          !wecom.progressHistory?.some(item=>item.callbackId === request.callbackId)) {
        const facts = wecomCallbackFacts(context,task,request);
        if (facts.error) return facts;
        return saveRoundMutation(state,task,()=>{
          appendScenarioEvidence(task,'转企微跟进',wecom.application,'企微完成回包','success','本轮企微完成回包已登记。',
            {externalId:request.callbackId || wecom.visitId,at});
          const outcome = finishWecomVisit(state,context,task,wecom,facts,at,request.nativeWindow);
          return outcome ? {ok:true,status:outcome.status,reason:'模拟完成回包已登记。' +
            (outcome.warning || task.waitReason || (outcome.action ? '下一步：' + outcome.action + '。' : ''))} : null;
        },'企微完成回包未保存，请重试。');
      }
    }
    if (!updated) return {error:'当前企微办理状态不允许此操作。'};
    if (updated.error) return updated;
    return saveRoundMutation(state,task,()=>{
      recordWecomAssignment(task,updated);
      appendScenarioEvidence(task,'转企微跟进',wecom.application,action === 'friendship' ? '企微好友核验' : '企微移交包推送',
        outcome === 'failed' ? 'failed' : 'success',updated.reason,{externalId:wecom.visitId,at});
      return {ok:true,status:updated.status,reason:updated.reason};
    },'企微办理结果未保存，请重试。');
  }

  function deliveryTargetWarning(state, context, task) {
    if (!taskSeat(state,context,task) || deliveryState(task)?.status !== '待下发') return '';
    const policy = taskDeliveryPolicy(state,context,task);
    if (policy.error) return policy.error;
    if (policy.targetType === 'internalTenant') {
      const matched = internalDeliveryMatch(state,context,task);
      return matched.status === 'available' ? '' : matched.reason;
    }
    return '';
  }

  function internalDeliveryOptions(context) {
    try { return settings.deliveryTargetOptions(context,'internalTenant'); }
    catch (_) { return []; }
  }

  function internalMatchEvidence(context, store, resolved, kind = 'intentStore') {
    const known = resolved.match || {},tenant = resolved.tenant || {};
    const evidence = {kind,brandId:context.scope.tenant.brandId,storeCode:clean(store?.code || store?.storeCode),
      tenantId:tenant.id,sourceId:clean(store?.sourceId || known.sourceId),capabilityId:clean(store?.capabilityId || known.capabilityId),
      sourceVersion:clean(store?.sourceVersion),fieldId:clean(store?.fieldId),value:clean(store?.value),
      bindingRevision:clean(known.bindingRevision) || JSON.stringify([tenant.id,tenant.brandId,tenant.organization,tenant.storeCode])};
    if (clean(store?.name)) evidence.storeName=clean(store.name);
    return evidence;
  }

  function internalMatchSignature(value) {
    if (!value) return '';
    return JSON.stringify(['kind','brandId','storeCode','tenantId','sourceId','capabilityId','sourceVersion','fieldId','value','bindingRevision']
      .map(key=>value[key] || ''));
  }

  function internalDeliveryMatch(state, context, task) {
    const current = activeContext(context);
    const unavailable = reason=>({status:'unavailable',reason});
    if (!current || state?.tenant !== current.scope.id || !state.records?.includes(task) || !isTask(task) || !inScope(current,task) ||
        !/_(admin|ops)$/.test(window.DSession.roleKey(current)) ||
        !(taskSeat(state,current,task) || canRead(current,task) || deliveryReviewScope(state,current))) {
      return unavailable('当前任务、使用权限或租户范围无法核对。');
    }
    const peers = internalDeliveryOptions(current);
    if (current.scope.tenant.organization === '门店') {
      const headquarters = peers.filter(row=>!row.organization || row.organization === '总部');
      if (!headquarters.length) return unavailable('当前品牌没有可接收的总部租户。');
      if (headquarters.length !== 1) return {status:'ambiguous',reason:'当前品牌匹配多个总部租户，请先核对组织归属。'};
      const receiver=headquarters[0],tenant={id:receiver.value,name:receiver.label,brandId:current.scope.tenant.brandId,organization:'总部'};
      const match=internalMatchEvidence(current,null,{tenant},'brandHeadquarters');
      const target={id:tenant.id,label:tenant.name,type:'internalTenant',storeMatch:match};
      return {status:'available',tenant,store:null,match,storeMatch:match,targets:[target]};
    }
    if (current.scope.tenant.organization !== '总部') return unavailable('当前租户的总部或门店组织类型无法核对。');
    let identity,resolved;
    try { identity=window.DIntentStoreIdentity?.resolve(current,task); }
    catch (_) { return unavailable('意向门店编码与来源暂不可读取。'); }
    if (identity?.status !== 'available') return {status:['missing','ambiguous'].includes(identity?.status)?identity.status:'unavailable',
      reason:identity?.reason || '当前填写的意向门店没有可核对的真实门店编码，请补齐关联。'};
    const store=identity.store;
    if (typeof store?.code !== 'string' || !store.code || store.code !== store.code.trim() ||
        store.brandId && store.brandId !== current.scope.tenant.brandId) return unavailable('意向门店编码或品牌归属无法核对。');
    try { resolved=window.DOrganization?.resolveIntentStoreTenant({...store,storeCode:store.code,brandId:current.scope.tenant.brandId}); }
    catch (_) { return unavailable('意向门店对应租户暂时无法读取。'); }
    if (resolved?.status !== 'available') return {status:['missing','ambiguous'].includes(resolved?.status)?resolved.status:'unavailable',
      reason:resolved?.reason || '意向门店未匹配到可用的同品牌门店租户。',store:structuredClone(store)};
    const tenant=resolved.tenant;
    if (!tenant?.id || tenant.id === current.scope.id || tenant.brandId !== current.scope.tenant.brandId ||
        tenant.organization !== '门店' || tenant.storeCode !== undefined && tenant.storeCode !== store.code ||
        !peers.some(row=>row.value === tenant.id)) return unavailable('匹配租户不在当前品牌的可接收门店范围内。');
    const match=internalMatchEvidence(current,store,resolved);
    const target={id:tenant.id,label:tenant.name,type:'internalTenant',storeMatch:match};
    return {status:'available',store:structuredClone(store),tenant:structuredClone(tenant),match,storeMatch:match,targets:[target]};
  }

  function confirmIntentStore(state, context, task, value, {expectedSignature} = {}) {
    const operator=taskSeat(state,context,task);
    if (!operator) return {error:'仅当前跟进坐席可补录本任务的意向门店。'};
    if (!window.DReview21.isLatest(state)) return {error:window.DReview21.saveFailure(state)};
    const pending=deliveryState(task),roundId=task.skynet.roundId;
    if (task.taskStatus!=='待下发' || pending?.status!=='待下发' || pending.roundId!==roundId ||
        task.roundId!==roundId || ['pending','approved'].includes(pending.review?.status) || pending.sentAt || task.callState ||
        window.DLeadRatingWorkbench?.pending?.(task) ||
        task.ratingEvaluation?.status==='pending' && task.ratingEvaluation.request?.roundId===roundId) {
      return {error:'任务须处于本轮待下发，且没有通话、评级或已提交的审核，才可补录意向门店。'};
    }
    const visits=(task.followupHistory || []).map((visit,index)=>({visit,index})).filter(({visit})=>visit?.roundId===roundId);
    if (visits.length!==1 || visits[0].visit.taskId && visits[0].visit.taskId!==task.taskId ||
        !clean(visits[0].visit.result) || visits[0].visit.result!==task.followupResult) {
      return {error:'本轮正式回访记录无法唯一核对，原意向门店未修改。'};
    }
    if (typeof value!=='string' || !value || value!==value.trim() || typeof expectedSignature!=='string' || !expectedSignature) {
      return {error:'请先读取当前有效门店候选，并明确选择本轮意向门店。'};
    }
    const service=window.DIntentStoreIdentity;
    let candidates;
    try { candidates=service?.candidates?.(context,task); }
    catch (_) { return {error:'门店候选暂时无法读取，原填写已保留。'}; }
    if (candidates?.status!=='available' || candidates.signature!==expectedSignature || !Array.isArray(candidates.rows) ||
        !['select','multiselect'].includes(candidates.field?.type) || !clean(candidates.field.id)) {
      return {error:candidates?.status!=='available' ? candidates?.reason || '当前没有可确认的门店候选。' :
        '门店字段、来源或本轮填写已变化，请重新打开补录。'};
    }
    const selected=candidates.rows.filter(row=>row?.value===value);
    if (selected.length!==1) return {error:'所选门店不在当前有效候选中，原填写未修改。'};
    const {visit:latest,index}=visits[0],field=candidates.field;
    if (latest.intentStoreCorrections!==undefined && !Array.isArray(latest.intentStoreCorrections)) {
      return {error:'本轮意向门店补录记录无法核对，请保留原资料。'};
    }
    const visit=structuredClone(latest),details={...visit.details},options={...visit.options};
    const taskDetails={...task.visitDetails},taskOptions={...task.visitOptionValues};
    const label=clean(selected[0].label || selected[0].store?.name);
    if (!label) return {error:'门店候选缺少可核对的名称，原填写未修改。'};
    const aliases=[...new Set(['intentStore',field.id,'field:'+field.id])];
    const selectedValue=field.type==='multiselect' ? [value] : value;
    for (const [values,next] of [[details,label],[taskDetails,label],[options,selectedValue],[taskOptions,selectedValue]]) {
      for (const key of aliases) if (key==='intentStore' || Object.hasOwn(values,key)) values[key]=next;
    }
    Object.assign(visit,{details,options});
    let schema,captured;
    try {
      const native=window.document?.querySelector?.('iframe[data-native-module="cloud"]')?.contentWindow;
      schema=window.DReview21DccFollowupFields?.taskForm?.(task,native,context);
      if (!schema || schema.categoryId!==categoryOf(task) || !Array.isArray(schema.fields) || !schema.fields.some(row=>row.id===field.id)) {
        return {error:'当前分配规则的意向门店填写字段无法核对。'};
      }
      if (latest.fieldLinkageSnapshot) {
        const checked=window.DFieldLinkageWorkbench?.validate?.(task,schema,visit,context,latest.fieldLinkageSnapshot);
        if (!checked?.ok) return {error:'新门店不符合原次填写联动约束，其他字段未自动改写。'+
          (checked?.errors || []).map(item=>typeof item==='string'?item:item?.message || '').filter(Boolean).join('；')};
      }
      const proposed={...task,visitDetails:taskDetails,visitOptionValues:taskOptions,
        followupHistory:task.followupHistory.map((item,position)=>position===index?visit:item)};
      captured=service.capture(context,proposed,schema,visit);
    } catch (_) { return {error:'门店身份或原次填写约束暂无法核对，原填写未修改。'}; }
    const proof=captured?.snapshot;
    if (captured?.status!=='available' || !proof || proof.version!==1 || proof.value!==value ||
        proof.roundId!==roundId || proof.taskId!==task.taskId || proof.tenantId!==context.scope.id ||
        proof.brandId!==context.scope.tenant.brandId || proof.categoryId!==schema.categoryId || proof.fieldId!==field.id ||
        proof.store?.brandId!==proof.brandId || proof.store?.value!==value || typeof proof.store?.code!=='string' ||
        !proof.store.code || proof.store.code!==proof.store.code.trim()) {
      return {error:captured?.reason || '所选门店身份未确认，原填写未修改。'};
    }
    visit.intentStoreIdentity=structuredClone(captured.snapshot);
    visit.intentStoreIdentityState={version:1,status:'available'};
    const selectionState=(visitDetails,visitOptions,recordDetails,recordOptions)=>Object.fromEntries([
      ['visitDetails',visitDetails],['visitOptions',visitOptions],['recordDetails',recordDetails],['recordOptions',recordOptions]
    ].map(([key,values])=>[key,Object.fromEntries(aliases.filter(alias=>Object.hasOwn(values || {},alias))
      .map(alias=>[alias,structuredClone(values[alias])]))]));
    const before={value:latest.options?.intentStore ?? task.visitOptionValues?.intentStore ?? null,
      name:latest.details?.intentStore ?? task.visitDetails?.intentStore ?? null,
      identityState:structuredClone(latest.intentStoreIdentityState || null),identity:structuredClone(latest.intentStoreIdentity || null),
      selection:selectionState(latest.details,latest.options,task.visitDetails,task.visitOptionValues)};
    const after={value,name:label,identityState:structuredClone(visit.intentStoreIdentityState),identity:structuredClone(visit.intentStoreIdentity),
      selection:selectionState(details,options,taskDetails,taskOptions)};
    if (JSON.stringify(before)===JSON.stringify(after) && JSON.stringify(task.visitDetails)===JSON.stringify(taskDetails) &&
        JSON.stringify(task.visitOptionValues)===JSON.stringify(taskOptions) && JSON.stringify(latest.details)===JSON.stringify(details) &&
        JSON.stringify(latest.options)===JSON.stringify(options)) {
      return {ok:true,unchanged:true,matching:internalDeliveryMatch(state,context,task)};
    }
    visit.intentStoreCorrections=[...(visit.intentStoreCorrections || []),{at:new Date().toISOString(),
      actorId:operator.account.id,actorName:operator.account.name || '',seatId:operator.seat.id,before,after}];
    if (!taskSeat(state,context,task) || !window.DReview21.isLatest(state)) return {error:'任务、权限或本轮资料已变化，请重新打开。'};
    return saveRoundMutation(state,task,()=>{
      Object.assign(task,{visitDetails:taskDetails,visitOptionValues:taskOptions,
        followupHistory:task.followupHistory.map((item,position)=>position===index?visit:item)});
      return {ok:true,matching:internalDeliveryMatch(state,context,task)};
    },'本轮意向门店未保存，请重试。');
  }

  function deliveryReceiverOptions(state, context, task) {
    if (!taskSeat(state,context,task) || deliveryState(task)?.status !== '待下发' ||
        taskDeliveryPolicy(state,context,task).targetType !== 'internalTenant') return [];
    return internalDeliveryOptions(context);
  }

  function canDispatchDelivery(state, context, task) {
    if (!taskSeat(state,context,task) || !['已结束','待下发'].includes(task.taskStatus) ||
        deliveryState(task)?.status !== '待下发') return false;
    const policy = taskDeliveryPolicy(state,context,task);
    return !policy.error && !automaticDelivery(policy);
  }

  function deliveryReviewRequired(state, context, task) {
    return taskDeliveryPolicy(state,context,task).auditEnabled === true;
  }

  function deliveryNativeLeads(state, context, task) {
    const anchorId = task.skynet.intakeId;
    const receipts = (state.skynetReceipts || []).filter(receipt => {
      if (!inScope(context,receipt) || categoryOf(receipt) !== categoryOf(task)) return false;
      if (receipt.id === anchorId || receipt.taskId === task.taskId) return true;
      const window = receipt.sameNumber;
      return !receipt.taskId && receipt.taskRelation === '仅记录' && window?.withinWindow &&
        !window.deliveryClosed && window.anchorReceiptId === anchorId &&
        receipt.assignmentRuleId === task.skynet.assignmentRuleId;
    });
    const groups = new Map();
    for (const receipt of receipts.length ? receipts : [task]) {
      const sourceLeadCode = receipt.sourceLeadCode || receipt.originalKey;
      if (!sourceLeadCode) continue;
      const sourceApplicationId = receipt.sourceApplicationId || task.sourceApplicationId;
      const key = JSON.stringify([sourceApplicationId,sourceLeadCode]);
      const values = receipt === task ? taskIntakeValues(task) : {...receipt.values,...receipt.mapped,originalKey:sourceLeadCode};
      const group = groups.get(key) || {sourceApplicationId,sourceLeadCode,
        values,receiptIds:[]};
      if (receipt !== task) group.receiptIds.push(receipt.id);
      groups.set(key,group);
    }
    return [...groups.values()];
  }

  function deliveryStoreId(options, value) {
    return canonicalOption({options},clean(value))?.value ||
      options.find(store => store.label === clean(value))?.value || '';
  }

  function availableDeliveryStores(context, task) {
    if (isWorkbenchDeliverySample(task,context)) return [workbenchDeliveryDemo.store];
    const field = settings.intakeFieldProfile(context,categoryOf(task)).fields.find(item => item.key === 'dealer');
    const fixtureStores = config.fields.find(item => item.key === 'dealer')?.options || [];
    const scoped = (field?.options || []).filter(option => clean(option.value) && clean(option.label) &&
      (task.brandId === 'BRAND-NISSAN' || !fixtureStores.some(demo => demo.value === option.value)));
    return [...new Map(scoped.map(option => [option.value,option])).values()];
  }

  function workbenchNativeLeads(state, context, task) {
    if (!taskSeat(state,context,task)) return [];
    const stores = availableDeliveryStores(context,task);
    return deliveryNativeLeads(state,context,task).map(({sourceLeadCode,sourceApplicationId,values}) => {
      const storeId = deliveryStoreId(stores,values.dealer);
      const storeName = stores.find(store => store.value === storeId)?.label || clean(values.dealer);
      return {sourceLeadCode,sourceApplicationId,storeName};
    });
  }

  function deliveryTargets(state, context, task) {
    if (!canDispatchDelivery(state,context,task)) return {stores:[],preferredStoreId:''};
    return deliveryStoreOptions(state,context,task);
  }

  const capturedFieldId = field => clean(field?.sourceFieldId || field?.fieldId || field?.id);
  function racingCapturedField(fields,collections,warnings) {
    const definitions=Array.isArray(fields)?fields:[];
    for (const standardKey of ['intentionStoreCode','dealer']) {
      const matches=definitions.filter(field=>field?.businessKey===standardKey || field?.key===standardKey);
      if (matches.length>1) {
        warnings.push('原始导入意向门店编码字段重复，已跳过无法唯一核对的来件。');return null;
      }
      if (matches.length===1) {
        const field=matches[0];
        if (field.usage==='FOLLOWUP' || field.type && !['text','select','multiselect'].includes(field.type)) {
          warnings.push('原始意向门店字段类型无法核对，未借用回访字段或名称。');return null;
        }
        return {field:{...field,type:field.type || 'text'},standardKey};
      }
      if (collections.some(values=>values && typeof values==='object' && !Array.isArray(values) && Object.hasOwn(values,standardKey))) {
        return {field:{key:standardKey,businessKey:standardKey,label:'原导入意向门店编码',type:'text'},standardKey};
      }
    }
    return null;
  }
  function racingCapturedCodes(field,raw,snapshot,warnings) {
    let values=Array.isArray(raw) ? raw : raw==null || raw==='' ? [] : [raw];
    if (snapshot && field.type==='multiselect' && typeof raw==='string' && raw.includes('|')) {
      values=raw.split('|'); // Explicit schema-1 multiselect serialization only.
    }
    const result=[];
    for (const value of values) {
      if (typeof value!=='string' || !value.trim()) continue;
      const code=value.trim();
      if (field.type==='select' || field.type==='multiselect') {
        const matches=(field.options || []).filter(option=>[option.value,option.id,option.businessKey].some(id=>
          typeof id==='string' && id===code));
        if (matches.length!==1) {warnings.push('部分导入值只有名称或选项编码不可核对，未按名称猜测门店。');continue;}
        const option=matches[0],stable=clean(option.businessKey || option.value || option.id);
        if (stable) result.push(stable);
      } else if (field.type==='text') result.push(code);
    }
    return [...new Set(result)];
  }
  function racingImportedCodes(state,context,task,leads) {
    const codes=[],sources=[],warnings=[];
    const capture=(fields,collections,metadata,snapshot=false)=>{
      const selected=racingCapturedField(fields,collections,warnings);
      if (!selected) return;
      const {field,standardKey}=selected;
      const otherKey=standardKey==='intentionStoreCode'?'dealer':'intentionStoreCode';
      const keys=[...new Set([field.key,standardKey,field.businessKey,field.sourceKey,field.id,field.fieldId,field.sourceFieldId]
        .filter(key=>typeof key==='string' && key && key!==otherKey))];
      let raw;
      let found=false;
      for (const collection of collections) {
        if (!collection || typeof collection!=='object' || Array.isArray(collection)) continue;
        const key=keys.find(key=>Object.hasOwn(collection,key));
        if (key!==undefined) {raw=collection[key];found=true;break;}
      }
      if (!found) return;
      const values=racingCapturedCodes(field,raw,snapshot,warnings);
      codes.push(...values);
      if (values.length) sources.push({...metadata,fieldId:capturedFieldId(field) || standardKey,fieldLabel:clean(field.label) || '原导入意向门店编码',values});
    };
    const ids=[...new Set(leads.flatMap(lead=>lead.receiptIds || []))];
    if (ids.length) {
      for (const id of ids) {
        const matches=(state.skynetReceipts || []).filter(receipt=>receipt.id===id && inScope(context,receipt) &&
          categoryOf(receipt)===categoryOf(task) && (!receipt.taskId || receipt.taskId===task.taskId));
        if (matches.length!==1) {warnings.push('部分原生来件身份无法唯一核对，未用于赛马排序。');continue;}
        const receipt=matches[0];
        capture(receipt.inputProfile?.fields,[receipt.mapped,receipt.values],{
          receiptId:receipt.id,sourceLeadCode:receipt.sourceLeadCode || receipt.originalKey || ''});
      }
    } else {
      const snapshot=task.businessImportSnapshot;
      if (snapshot?.schema===1 && (!snapshot.categoryId || snapshot.categoryId===categoryOf(task))) {
        capture(snapshot.fields,[snapshot.values],{taskId:task.taskId,sourceLeadCode:task.sourceLeadCode || task.originalKey || ''},true);
      } else warnings.push('未取得本任务的原始导入快照，未用回访或任务当前值替代。');
    }
    return {codes:[...new Set(codes)],sources,warnings:[...new Set(warnings)]};
  }
  function racingDeliveryOrder(state,context,task,stores,leads) {
    const unchanged=(reason,warnings=[])=>({stores,race:{matchedGroupIds:[],matchedGroups:[],prioritizedCodes:[],
      importedCodes:[],sources:[],warnings,reason}});
    const engine=window.DRacingStoreRules;
    if (!engine || isWorkbenchDeliverySample(task,context) || !taskSeat(state,context,task)) return {stores};
    const delivery=deliveryState(task);
    if (!delivery || delivery.targetType==='internalTenant' || delivery.directStore || !canDispatchDelivery(state,context,task)) return {stores};
    if (taskDeliveryPolicy(state,context,task).targetType==='internalTenant') return {stores};
    const assignmentRuleId=clean(task.skynet?.assignmentRuleId),assignmentRuleVersion=task.skynet?.assignmentRuleVersion;
    if (!assignmentRuleId || !['string','number'].includes(typeof assignmentRuleVersion) ||
        !String(assignmentRuleVersion).trim() || typeof assignmentRuleVersion==='number' &&
        (!Number.isFinite(assignmentRuleVersion) || assignmentRuleVersion<=0)) return unchanged('当前任务缺少原分配规则或绑定版本，按原门店顺序显示。');
    try {
      const config=engine.read(context);
      if (!config?.ok) return unchanged('赛马配置暂时不可读取，按原门店顺序显示。');
      const rules=(config.rules || []).filter(rule=>rule.enabled===true && rule.assignmentRuleId===assignmentRuleId &&
        rule.categoryId===categoryOf(task));
      if (!rules.length) return unchanged('本任务绑定的分配规则未启用赛马排序，按原门店顺序显示。');
      const scope=typeof engine.runtimeScope==='function' ? engine.runtimeScope(context,{categoryId:categoryOf(task),assignmentRuleId,assignmentRuleVersion}) : null;
      if (!scope?.ok) return unchanged('原分配规则绑定版本或赛马适用范围暂不可核对，按原门店顺序显示。');
      const imported=racingImportedCodes(state,context,task,leads);
      const foundation=engine.foundation(context);
      if (!foundation?.ok) return unchanged('赛马小组或评分资料暂不可读取，按原门店顺序显示。',imported.warnings);
      const ranked=engine.rank({stores:structuredClone(stores),importedCodes:imported.codes,
        groups:structuredClone(foundation.groups || []),members:structuredClone(foundation.members || [])});
      const original=new Map(stores.map(store=>[store.value,store]));
      if (!ranked?.ok || !Array.isArray(ranked.stores) || ranked.stores.length!==stores.length ||
          new Set(ranked.stores.map(store=>store.value)).size!==stores.length || ranked.stores.some(store=>!original.has(store.value))) {
        return unchanged('赛马排序结果无法核对，按原门店顺序显示。',imported.warnings);
      }
      const ordered=ranked.stores.map(store=>({...original.get(store.value),...(store.race ? {race:structuredClone(store.race)} : {})}));
      return {stores:ordered,race:{revision:config.revision,assignmentRuleId,assignmentRuleVersion,matchedGroupIds:ranked.matchedGroupIds || [],
        matchedGroups:ranked.matchedGroups || [],prioritizedCodes:ranked.prioritizedCodes || [],
        importedCodes:imported.codes,sources:imported.sources,foundationFingerprint:foundation.fingerprint,
        warnings:[...new Set([...imported.warnings,...(ranked.warnings || [])])],
        reason:imported.codes.length ? ranked.reason : '未取得可核对的原始导入门店编码，按原门店顺序显示。'}};
    } catch (_) {return unchanged('赛马排序资料暂时无法核对，按原门店顺序显示。');}
  }

  function deliveryStoreOptions(state, context, task) {
    const receipt = originalIntake(state,context,task);
    const dealer = clean(task.visitDetails?.intentStore) || clean(taskIntakeValues(task,receipt).dealer);
    const options = availableDeliveryStores(context,task);
    const counts = new Map();
    const leads = deliveryNativeLeads(state,context,task);
    for (const lead of leads) {
      const id = deliveryStoreId(options,lead.values.dealer);
      counts.set(id,(counts.get(id) || 0) + 1);
    }
    const stores = options.map(option => ({...option,nativeLeadCount:counts.get(option.value) || 0}));
    return {...racingDeliveryOrder(state,context,task,stores,leads),preferredStoreId:deliveryStoreId(stores,dealer),nativeLeadCount:leads.length,
      requiredStoreIds:stores.filter(store => store.nativeLeadCount).map(store => store.value),
      missingNativeStoreCount:counts.get('') || 0};
  }

  function deliveryTemplate(book, binding, categoryId) {
    const template = settings.version(book,'deliveryTemplates',binding.templateId,binding.templateVersion);
    return template?.categoryId === categoryId ? template : null;
  }

  function originalIntake(state, context, task) {
    return state.skynetReceipts?.find(item => item.id === task.skynet.intakeId && inScope(context,item));
  }

  function taskIntakeValues(task, receipt) {
    const fields = receipt?.inputProfile?.fields || config.fields;
    const snapshot = task.businessImportSnapshot?.values || {};
    const values = Object.fromEntries(fields.map(({key,businessKey}) => [
      key, receipt?.mapped?.[key] ?? snapshot[businessKey] ?? task[businessKey] ?? task[key]
    ]));
    return {...values,originalKey:values.originalKey || task.originalKey};
  }

  function currentRoundNumber(task) {
    if (Number.isInteger(task.skynet.roundNumber) && task.skynet.roundNumber >= 1) return task.skynet.roundNumber;
    const priorRounds = new Set((task.followupHistory || []).map(visit => visit.roundId)
      .filter(id => id && id !== task.roundId));
    return priorRounds.size + 1;
  }

  function nurtureMethod(value) {
    switch (clean(value).replace(/\s+/g,'').toLowerCase()) {
      case 'ai':
      case 'ai外呼':
      case 'ai会话':
      case 'ai通话':
        return 'AI 外呼';
      case 'manual':
      case '人工外呼':
      case '人工通话':
        return '人工外呼';
      case 'predictive':
      case '预外呼':
      case '预测外呼':
        return '预外呼';
      case '企微培育':
        return '企微培育';
      default:
        return '';
    }
  }

  function normalizedCallTags(value) {
    if (value == null) return undefined;
    const values = Array.isArray(value) ? value : typeof value === 'string' ? value.split(/[、，,；;\n]+/) : [value];
    return [...new Set(values.map(item => taskResultText(typeof item === 'object' ?
      item?.label || item?.tagName || item?.name || item?.tagId || item?.id : item))
      .filter(Boolean))];
  }

  function taskResultText(value) {
    return Number.isFinite(value) ? String(value) : clean(value);
  }

  function matchingRoundCalls(state, context, task, visit, nativeWindow, preferHandoff = false) {
    const nativeContext = nativeWindow?.DNativeContext?.context;
    const nativeCalls = accountScope(context).every((value,index) => value === accountScope(nativeContext)[index]) &&
      Array.isArray(nativeWindow?.CloudCallData?.calls) ? nativeWindow.CloudCallData.calls : [];
    const callId = visit?.callId || visit?.cdrId || visit?.callRecordId;
    const localCalls = Array.isArray(state.callRecords) ? state.callRecords : [];
    const matching = [...localCalls,...nativeCalls].filter(call =>
      call && historicalRowInScope(call,context) && !retiredContact(call) && (!call.taskId || call.taskId === task.taskId) &&
      (!call.roundId || call.roundId === task.roundId) &&
      (callId ? callIdentity(call) === String(callId) : call.taskId === task.taskId && call.roundId === task.roundId));
    const unique = new Map();
    for (const call of matching) {
      const id = callIdentity(call) || call;
      const prior = unique.get(id);
      if (!preferHandoff || !prior || !(prior.predictiveCallback || prior.aiResultFinal) || call.predictiveCallback || call.aiResultFinal) {
        unique.set(id,call);
      }
    }
    return {calls:[...unique.values()],explicit:Boolean(callId)};
  }

  function plannedRoundMethod(task,nurture) {
    const parent = strategyPathFor(nurture?.rules || [],task.skynet.strategyNodeId)?.at(-1);
    return nurtureMethod((parent && nurtureAction(parent)) || task.skynet.processing?.targetTaskType || task.requiredMode || task.skynet.action);
  }

  function predictiveRoundHandoff(state,context,task,planned,nativeWindow) {
    if (!window.DPredictiveAiHandoff || planned!=='预外呼') return null;
    const predictions = matchingRoundCalls(state,context,task,null,nativeWindow,true).calls
      .filter(row=>row.taskId===task.taskId && row.roundId===task.roundId &&
        nurtureMethod(row.callType || row.callMode)==='预外呼');
    const visit = task.followupHistory?.at(-1);
    const explicit = visit?.roundId===task.roundId ? clean(visit.predictiveCallId || visit.callId || visit.cdrId || visit.callRecordId) : '';
    const linked = explicit && predictions.find(row=>callIdentity(row)===explicit);
    const predictive = linked || (predictions.length===1 ? predictions[0] : null);
    if (!predictive) return {stage:predictions.length ? 'callbackConflict' : 'awaitCallback'};
    const callId = callIdentity(predictive);
    const callback = window.DPredictiveAiHandoff.read(predictive);
    if (!callback.received || !callId) return {...callback,stage:'awaitCallback'};
    if (!callback.transferred) return {...callback,stage:'manual',callId};
    const ai = matchingRoundCalls(state,context,task,null,nativeWindow,true).calls.filter(row=>
      row.taskId===task.taskId && row.roundId===task.roundId && row.predictiveParentCallId===callId &&
      nurtureMethod(row.callType || row.callMode)==='AI 外呼' && row.aiResultFinal===true && callIdentity(row));
    return {...callback,callId,stage:ai.length>1 ? 'aiConflict' : ai.length===1 ? 'aiReady' : 'awaitAi',
      ...(ai.length===1 ? {ai:ai[0]} : {})};
  }

  const predictiveWaitMessages = {
    awaitCallback:'等待预外呼通话结果回调，暂不判定下发。',
    callbackConflict:'本轮存在无法唯一核对的预外呼回调，暂不下发。',
    awaitAi:'预外呼已转 AI，等待同一任务、同一轮的 AI 结果。',
    aiConflict:'同轮 AI 结果关联不唯一，暂不下发。',
    admin:'本轮预外呼已转 AI，但原绑定版本未配置 AI 外呼下发条件，待管理员判断。',
    templateUnavailable:'原任务绑定的下发模板版本暂不可用，待核对后再判断。'
  };

  function predictiveHandoffSummary(evidence,stage=evidence.stage) {
    return {stage,plannedMethod:'预外呼',transferred:evidence.transferred ?? null,
      ...(evidence.callId ? {predictiveCallId:evidence.callId} : {}),
      ...(evidence.navigation ? {navigation:evidence.navigation} : {}),
      ...(evidence.transferred ? {actualMethod:'AI 外呼'} : evidence.transferred===false ? {actualMethod:'预外呼'} : {}),
      ...(evidence.ai ? {aiCallId:callIdentity(evidence.ai)} : {})};
  }

  function predictiveHandoffStage(evidence,delivery,binding) {
    if (evidence?.transferred !== true) return evidence?.stage;
    if (!delivery && binding.templateId) return 'templateUnavailable';
    const hasAi = settings.deliveryTypes.some(type=>delivery?.aiCriteria?.[type.value]?.some(rule=>rule.conditions?.length));
    return hasAi ? evidence.stage : 'admin';
  }

  function predictiveWaitPlan(evidence,stage) {
    return {...nurtureDecision(roundCompleteEvent,'unavailable',[],null,'转待处理',['转待处理']),
      predictiveHandoff:predictiveHandoffSummary(evidence,stage),status:predictiveWaitMessages[stage]};
  }

  function previousCallEvidence(state, context, task, nurture, {nativeWindow,callMode,tags} = {}) {
    const latest = task.followupHistory?.at(-1);
    const visit = latest?.roundId === task.roundId ? latest : null;
    const completed = task.skynet.lastRound?.roundId === task.roundId ? task.skynet.lastRound : null;
    const planned = plannedRoundMethod(task,nurture);
    const handoff = predictiveRoundHandoff(state,context,task,planned,nativeWindow);
    const recorded = nurtureMethod(visit?.callMode) || nurtureMethod(visit?.callType) || nurtureMethod(callMode) ||
      nurtureMethod(completed?.callMethod);
    if ((recorded || planned) === '企微培育') return {callMethod:'企微培育',tags:undefined};
    const {calls,explicit} = matchingRoundCalls(state,context,task,visit,nativeWindow);
    const expected = recorded || (!explicit ? planned : '');
    const candidates = calls.filter(call => {
      const method = nurtureMethod(call.callType || call.callMode || call.mode);
      return expected ? method === expected || (explicit && !method) : Boolean(method);
    });
    const call = handoff?.transferred ? handoff.ai || null : candidates.length === 1 ? candidates[0] : null;
    const callMethod = handoff?.transferred ? 'AI 外呼' : handoff?.stage==='manual' ? '预外呼' :
      recorded || nurtureMethod(call?.callType || call?.callMode || call?.mode) || planned;
    if (!callMethod || callMethod === '企微培育') return {callMethod,tags:undefined};
    const tagMode = clean(visit?.tagCallMode || visit?.tagMethod);
    const visitTags = !tagMode || nurtureMethod(tagMode) === callMethod ? visit?.tags : undefined;
    const linkedTags = call?.tags ?? call?.labels;
    const completedTags = nurtureMethod(completed?.callMethod) === callMethod ? completed?.callTags : undefined;
    const base={callMethod,tags:normalizedCallTags(handoff?.transferred ? linkedTags : linkedTags ?? visitTags ?? tags ?? completedTags),
      ...(handoff ? {handoff} : {})};
    if(callMethod!=='AI 外呼')return base;
    const target=task.skynet.processing?.targetTaskType==='AI 外呼' ? task.skynet.processing.targetTaskId : '';
    const profile=target ? window.DSkynetOutboundTargets?.conditionProfile?.(context,'AI 外呼',target) : null;
    const rawTags=call?.aiSupplierTags ?? call?.supplierTags ?? call?.tags ?? call?.labels ??
      (handoff?.transferred ? undefined : visit?.aiSupplierTags ?? visitTags);
    const readTags=rawTags==null ? undefined : [...new Set([...(normalizedCallTags(rawTags)||[]),
      ...(Array.isArray(rawTags)?rawTags:[rawTags]).flatMap(item=>item&&typeof item==='object' ?
        [item.tagId,item.id,item.platformTagId].filter(value=>typeof value==='number'||typeof value==='string').map(String) : [])])];
    const rawStatus=call?.aiCallStatus ?? call?.callStatus ?? call?.status ?? (handoff?.transferred ? undefined : visit?.aiCallStatus);
    const domain=call?.statusDomain || call?.rawStatusDomain || 'DCC_LOCAL_LABEL';
    const normalize=nativeWindow?.DFlowNormalizeStatus;
    const rawCode=call?.rawStatusCode ?? rawStatus;
    const status=normalize?.('DCC_LOCAL_LABEL',domain,taskResultText(rawCode));
    const trustedStatus=taskResultText(rawStatus);
    return {...base,aiSupplierId:clean(call?.supplierId || (!handoff?.transferred &&
      (visit?.aiSupplierId || task.skynet.processing?.targetTaskSupplierId || profile?.supplierId))),
      aiTags:readTags,
      aiCallStatus:status?.state==='KNOWN' ? status.value : domain==='DCC_LOCAL_LABEL' ? (trustedStatus==='未接听'?'无人接听':trustedStatus) : '',
      aiDurationSeconds:settings.durationSeconds(call?.durationSeconds ?? call?.duration ?? (handoff?.transferred ? undefined : visit?.durationSeconds))};

  }

  function currentRoundFacts(task, intake, {result,details,options,note,nextAt,completedAt,callStatus,leadStatus,tags,callMethod,aiSupplierId,aiTags,aiCallStatus,aiDurationSeconds}) {
    const deliveryFollowup = {details,options,note,nextAt,completedAt};
    if (callMethod === '企微培育') {
      const intentLevel = clean(details?.intentLevel);
      return {...intake, deliveryFollowup,previous:{result,intentLevel,callMethod},
        round:{number:currentRoundNumber(task),result:clean(result),intentLevel,leadStatus:clean(leadStatus),callMethod}};
    }
    return {...intake,deliveryFollowup,
      previous:{result,intentLevel:taskResultText(details?.intentLevel),callStatus:taskResultText(callStatus),tags,callMethod},
      round:{number:currentRoundNumber(task),result:clean(result),callStatus:taskResultText(callStatus),
        intentLevel:taskResultText(details?.intentLevel),
        leadStatus:clean(leadStatus) || clean(details?.leadStatus) || clean(task.leadStatus) ||
          clean(task.skynet.lastRound?.leadStatus) || clean(intake.leadStatus),
        ...(callMethod ? {callMethod} : {}),...(tags === undefined ? {} : {callTags:tags}),
        ...(callMethod==='AI 外呼' ? {aiSupplierId,aiTags,aiCallStatus,aiDurationSeconds} : {})}
    };
  }

  function canRetryDecision(processing) {
    return Boolean(processing?.missingFields?.length || processing?.waitingForCold || processing?.waitingForTemplate || processing?.waitingForDeliveryFields ||
      processing?.waitingForTarget || processing?.waitingForDeliveryTarget || processing?.waitingForFieldLinkage || processing?.waitingForPredictiveHandoff);
  }

  function roundDecision(book, state, context, task, input, trustedCallback = false) {
    if ((!trustedCallback && (!taskSeat(state,context,task) || !clean(input.result))) || reachedDelivery(task)) return null;
    const {nurtureTemplateId,nurtureTemplateVersion,processing} = task.skynet;
    if (processing?.followupRoundId === task.roundId && !canRetryDecision(processing)) return null;
    const nurture = settings.version(book,'nurtureTemplates',nurtureTemplateId,nurtureTemplateVersion);
    if (!nurture || nurture.categoryId !== categoryOf(task)) {
      return {...nurtureDecision(roundCompleteEvent,'unavailable',[],null,'转待处理'),
        status:'绑定的培育模板版本暂不可用。'};
    }
    const evidence = previousCallEvidence(state,context,task,nurture,input);
    const binding = deliveryBinding(task.skynet);
    const delivery = deliveryTemplate(book,binding,categoryOf(task));
    const handoff = evidence.handoff;
    const stage = predictiveHandoffStage(handoff,delivery,binding);
    if (predictiveWaitMessages[stage]) return predictiveWaitPlan(handoff,stage);
    if (trustedCallback && !handoff) return null;
    const effective = handoff?.transferred ? {result:handoff.ai.aiResult || handoff.ai.result,details:handoff.ai.aiDetails || {},
      callStatus:evidence.aiCallStatus,leadStatus:handoff.ai.leadStatus,completedAt:handoff.ai.endedAt} : input;
    if (!clean(effective.result) && !handoff?.transferred) return null;
    const facts = withPreRating(context,
      currentRoundFacts(task,taskIntakeValues(task,originalIntake(state,context,task)),{...effective,...evidence}),task);
    if (handoff) facts.round.predictiveHandoff = predictiveHandoffSummary(handoff,stage);
    if (nurture.roundFlow || nurture.rules.some(rule => rule.event === roundCompleteEvent)) {
      return {...planFor(nurture,roundCompleteEvent,facts,{strategyParentId:task.skynet.strategyNodeId,delivery}),round:facts.round};
    }
    // A frozen legacy template still handles only the original workbench event.
    const legacyEvent = '回访完成';
    if (processing?.followupRoundId === task.roundId && processing.event !== legacyEvent) return null;
    const decision = planFor(nurture,legacyEvent,facts,{delivery});
    return {...decision,round:facts.round,legacyFallback:decision.outcome === 'notMatched'};
  }

  function advanceRound(task, completedNumber) {
    const roundNumber = completedNumber + 1;
    const roundId = task.taskId + '-' + String(roundNumber).padStart(2,'0');
    task.roundId = roundId;
    task.skynet = {...task.skynet,roundNumber,roundId};
  }

  function recordRound(task, latest, plan, processing) {
    const strategy = task.skynet.strategyPath?.at(-1);
    const round = {...plan.round,roundId:latest.roundId,at:latest.at || new Date().toISOString(),
      action:plan.action,ruleNumber:plan.ruleNumber,outcome:plan.outcome,
      ...(latest.wecom ? {visitId:latest.visitId} : {}),
      ...(processing.deliveryGate ? {deliveryGate:processing.deliveryGate} : {}),
      ...(strategy ? {strategyNodeId:strategy.id,strategyNodeName:strategy.name,strategyFallback:strategy.fallback} : {}),
      ...(processing.targetTaskId ? {targetTaskId:processing.targetTaskId,targetTaskName:processing.targetTaskName} : {})};
    const completedRounds = (task.skynet.completedRounds || []).filter(item => item.roundId !== latest.roundId);
    task.skynet = {...task.skynet,roundId:latest.roundId,roundNumber:round.number,lastRound:round,
      ...(round.predictiveHandoff ? {predictiveHandoff:{...round.predictiveHandoff,roundId:latest.roundId}} : {}),
      completedRounds:[...completedRounds,round],action:plan.action,plannedActions:[...plan.actions],
      decisionEvent:plan.event,processing};
    if (round.leadStatus) task.leadStatus = round.leadStatus;
  }

  function applyAiFieldLinkage(state, context, task, latest, nativeWindow) {
    if (nurtureMethod(latest.callMode || latest.callType || task.callMode || task.callType) !== 'AI 外呼') return null;
    if (!taskSeat(state,context,task)) return {denied:true};
    const processing = task.skynet.processing;
    if (closedTasks.has(task.taskStatus) ||
        processing?.followupRoundId === task.roundId && !canRetryDecision(processing)) return {skip:true};
    try {
      const engine = window.DFieldLinkageRules;
      if (!engine?.read || !engine?.evaluate || !engine?.validate) return {error:'填写联动模块未就绪，请刷新后重新核对 AI 外呼结果。'};
      const stored = engine.read(context);
      if (!stored.ok) return {error:stored.error || 'AI 外呼填写联动配置无法读取。'};
      const snapshot = latest.fieldLinkageSnapshot;
      const applies = stored.rules.some(rule=>rule.enabled && rule.assignmentRuleId === task.skynet.assignmentRuleId &&
        rule.categoryId === categoryOf(task) && engine.modeConfig(rule,'ai'));
      if (!applies && !snapshot) return null;
      const fields = window.DReview21DccFollowupFields;
      const bridge = window.DFieldLinkageWorkbench;
      const native = nativeWindow || window.document?.querySelector?.('iframe[data-native-module="cloud"]')?.contentWindow;
      const schema = task.followupSchema?.roundId === task.roundId ? task.followupSchema : fields?.taskForm(task,native,context);
      if (!schema || !Array.isArray(schema.fields) || schema.categoryId !== categoryOf(task) || !bridge?.values) {
        return {error:'AI 外呼结果的分类填写字段无法核对。'};
      }
      const values = bridge.values(schema.fields,latest);
      const input = {context,categoryId:schema.categoryId,assignmentRuleId:task.skynet.assignmentRuleId,
        assignmentRuleVersion:task.skynet.assignmentRuleVersion,callMode:'AI 外呼',fields:schema.fields,values,
        ...(snapshot ? {snapshot} : {})};
      const evaluated = engine.evaluate(input);
      const checked = evaluated.ok ? engine.validate({...input,values:evaluated.values,snapshot:evaluated.snapshot}) : evaluated;
      if (!checked.ok) return {error:(checked.errors || [checked.error || 'AI 外呼填写联动校验未通过。'])
        .map(error=>typeof error === 'string' ? error : error.message || error.error).filter(Boolean).join('；')};
      const visit = structuredClone(latest), details = {...visit.details}, options = {...visit.options};
      const taskDetails = {...task.visitDetails}, taskOptions = {...task.visitOptionValues};
      const captured = evaluated.snapshot.fields || [];
      const labels = new Map(visit.detailFields || []);
      const updates = {};
      for (const ref of captured) {
        const field = schema.fields.find(item=>item.id === ref.id);
        const key = fields.fieldKey(field) || 'field:' + field.id;
        const value = evaluated.values[field.id];
        if (field.type==='text' || field.type==='textarea') {
          if (!evaluated.changes.some(change=>change.fieldId===field.id)) continue;
          details[key]=taskDetails[key]=value;labels.set(key,field.label);
          if (key==='visitDesc') updates.followupNote=visit.note=value;
          continue;
        }
        const ids = Array.isArray(value) ? value : value ? [value] : [];
        const selected = ids.map(id=>field.options.find(option=>(option.id || option.value) === id));
        if (selected.some(option=>!option)) return {error:'AI 外呼联动结果引用的选项已失效。'};
        const display = selected.map(option=>option.label || option.id || option.value);
        details[key] = field.type === 'multiselect' ? display : display[0] || '';
        options[key] = field.type === 'multiselect' ? ids : ids[0] || '';
        taskDetails[key] = details[key];taskOptions[key] = options[key];labels.set(key,field.label);
        const semantic = selected[0] && (selected[0].businessKey || selected[0].label || selected[0].id || selected[0].value) || '';
        if (key === 'visitResult') updates.followupResult = visit.result = semantic;
        if (key === 'intentLevel') updates.intentLevel = semantic;
      }
      Object.assign(visit,{details,options,detailFields:[...labels],fieldLinkageSnapshot:checked.snapshot,
        fieldLinkageOriginalValues:visit.fieldLinkageOriginalValues ||
          Object.fromEntries(captured.map(field=>[field.id,values[field.id] ?? '']))});
      const keys = ['visitDetails','visitOptionValues','followupHistory',...Object.keys(updates)];
      const previous = new Map(keys.map(key=>[key,{present:Object.hasOwn(task,key),value:task[key]}]));
      Object.assign(task,updates,{visitDetails:taskDetails,visitOptionValues:taskOptions,
        followupHistory:[...task.followupHistory.slice(0,-1),visit]});
      return {visit,rollback:()=>{for (const [key,before] of previous) {
        if (before.present) task[key]=before.value;else delete task[key];
      }}};
    } catch (_) { return {error:'AI 外呼填写联动暂时无法核对，原返回结果已保留。'}; }
  }

  function holdAiFieldLinkage(task, latest, error) {
    const warning = 'AI 外呼填写联动待核对：' + error;
    task.skynet = {...task.skynet,processing:{...task.skynet.processing,status:'待处理',
      destination:'待核对 AI 返回字段',waitingForFieldLinkage:true,followupRoundId:latest.roundId}};
    Object.assign(task,{taskStatus:'待处理',waitReason:warning});
    return {status:'待处理',action:'填写联动待核对',warning};
  }

  function roundFollowupInput(visit) {
    const option = visit.ratingEvaluation?.backfill?.optionId;
    return {result:visit.result,details:visit.details,note:visit.note,nextAt:visit.nextAt,completedAt:visit.at,
      options:option ? {...visit.options,intentLevel:option} : visit.options};
  }

  function completeRound(state, context, task, {callStatus,leadStatus,nativeWindow} = {}) {
    if (!window.DReview21.isLatest(state)) return null;
    if (window.DLeadRatingWorkbench?.pending(task)) return {status:task.taskStatus,action:'线索评级中',warning:task.waitReason};
    let latest = task?.followupHistory?.at(-1);
    if (!latest?.roundId || latest.roundId !== task.roundId || latest.result !== task.followupResult || latest.seat !== task.ownerId) return null;
    const book = settings.read(state);
    const nurture = task.skynet && settings.version(book,'nurtureTemplates',task.skynet.nurtureTemplateId,task.skynet.nurtureTemplateVersion);
    const predictive = task.skynet && window.DPredictiveAiHandoff && plannedRoundMethod(task,nurture)==='预外呼';
    const aiLinkage = predictive ? null : applyAiFieldLinkage(state,context,task,latest,nativeWindow);
    if (aiLinkage?.denied || aiLinkage?.skip) return null;
    if (aiLinkage?.error) return holdAiFieldLinkage(task,latest,aiLinkage.error);
    latest = aiLinkage?.visit || latest;
    const input = {...roundFollowupInput(latest),nativeWindow,
      callMethod:nurtureMethod(latest.callMode || latest.callType),
      callStatus:callStatus || latest.contact,leadStatus:leadStatus || latest.leadStatus};
    const plan = roundDecision(book,state,context,task,input);
    if (!plan) { aiLinkage?.rollback();return null; }
    return applyCompletedRound(state,context,task,book,latest,input,plan);
  }

  function applyCompletedRound(state,context,task,book,latest,input,plan) {
    if (plan.predictiveHandoff) {
      const summary = {...plan.predictiveHandoff,roundId:task.roundId};
      const processing = {...task.skynet.processing,status:'待处理',followupRoundId:task.roundId,
        waitingForPredictiveHandoff:true,destination:summary.stage==='admin' ? '待管理员判断' : '待核对预外呼回调或 AI 结果'};
      task.skynet = {...task.skynet,processing,predictiveHandoff:summary};
      Object.assign(task,{taskStatus:'待处理',waitReason:plan.status});
      return {status:'待处理',action:'转待处理',warning:plan.status};
    }
    if (!plan.round) plan.round = currentRoundFacts(task,taskIntakeValues(task,originalIntake(state,context,task)),input).round;
    if (plan.legacyFallback) return completeLegacyRound(task,latest,plan);
    const policy = deliveryActions.has(plan.action) ? taskDeliveryPolicy(state,context,task,book,plan.deliveryGate?.type) : null;
    if (policy?.error) return holdDeliveryPlan(task,plan,policy,latest);
    const processing = {...processingFor(plan,context),followupRoundId:latest.roundId};
    if (plan.outcome === 'unavailable') processing.waitingForTemplate = true;
    const requiredMode = processing.waitingForTarget ? '' : nurtureDestinations[plan.action].requiredMode;
    if (plan.action === '人工外呼') {
      processing.status = task.nextAt ? '下次回访' : '待办理';
      processing.destination = '原跟进坐席';
    } else {
      task.nextAt = '';
    }
    const waitReason = plan.outcome === 'unavailable' ? plan.status : plan.outcome === 'notMatched' ?
      (plan.endReason ? plan.endReason + '。' : '本轮没有命中后续培育、下发或转冷线索规则。') :
      processingReason(processing);
    Object.assign(task,{taskStatus:processing.status,waitReason,requiredMode});
    recordRound(task,latest,plan,processing);
    if (plan.action === '转冷线索') return scheduleColdTransfer(state,context,task,book,plan,processing);
    if (!processing.waitingForTarget) commitStrategy(task,plan);
    if (deliveryActions.has(plan.action)) {
      const delivery = enterDelivery(state,context,task,plan,policy);
      return {status:delivery.status,action:plan.action,...(delivery.reason ? {warning:delivery.reason} : {delivery,warning:''})};
    }
    if (plan.action === '结束培育') {
      const endReason = plan.endReason || (plan.outcome === 'notMatched' ? '无后续培育规则命中' : '结束培育');
      task.skynet = {...task.skynet,endReason};
    } else if (nurturingActions.has(plan.action) && !processing.waitingForTarget) {
      advanceRound(task,plan.round.number);
      if (plan.action === '企微培育') {
        const wecom = resolveWecomAssignment(state,context,task);
        if (wecom) recordWecomAssignment(task,wecom);
      }
    }
    return {status:task.taskStatus,action:plan.action,warning:canRetryDecision(processing) ? waitReason : ''};
  }

  function applyPredictiveResult(state,context,task,event = {},nativeWindow) {
    const current=activeContext(context);
    if (!current || !inScope(current,task) || state?.tenant!==current.scope.id || !state.records?.includes(task) ||
        !task.skynet || !window.DReview21.isLatest(state) ||
        !(taskSeat(state,current,task) || window.DReview21Operations?.canManage(current))) return {error:'不能在当前租户核对该任务。'};
    if (event.taskId!==task.taskId || event.roundId!==task.roundId || task.roundId!==task.skynet.roundId) return {ignored:true};
    if (reachedDelivery(task) || ['已结束','已归档','已结案','已撤回','已取消'].includes(task.taskStatus) ||
        task.skynet.processing?.followupRoundId===task.roundId && !canRetryDecision(task.skynet.processing)) return {ignored:true};
    const book=settings.read(state);
    const nurture=settings.version(book,'nurtureTemplates',task.skynet.nurtureTemplateId,task.skynet.nurtureTemplateVersion);
    if (!window.DPredictiveAiHandoff || !nurture || nurture.categoryId!==categoryOf(task) || plannedRoundMethod(task,nurture)!=='预外呼')
      return {error:'原轮次不是有效的预外呼节点。'};
    const id=clean(event.callId), type=event.type;
    if (!id || id.length>160 || !['predictive','ai'].includes(type)) return {error:'回调缺少有效的通话编号或类型。'};
    const scope={tenant:task.tenant,brandId:task.brandId,taskId:task.taskId,roundId:task.roundId,callId:id};
    let call;
    if (type==='predictive') {
      const fields=window.DPredictiveAiHandoff.navigationFields.filter(key=>Object.hasOwn(event,key));
      if (!clean(event.callbackId) || !fields.length ||
          fields.some(key=>event[key] != null && !['string','number'].includes(typeof event[key]))) return {error:'预外呼回调缺少可核对的语音导航结果。'};
      const navigation=Object.fromEntries(fields.map(key=>[key,typeof event[key]==='string' ? event[key].trim() : event[key] ?? null]));
      call={...scope,callType:'预外呼',predictiveCallback:{callbackId:clean(event.callbackId),...navigation}};
    } else {
      if (!clean(event.predictiveCallId) || event.predictiveCallId===id || event.final!==true)
        return {error:'AI 结果须明确为最终结果并关联原预外呼通话。'};
      const labels=normalizedCallTags(event.aiTags);
      const tags=labels===undefined ? undefined : [...new Set([...labels,...(Array.isArray(event.aiTags)?event.aiTags:[event.aiTags])
        .flatMap(tag=>tag && typeof tag==='object' ? [tag.tagId,tag.id,tag.platformTagId].map(taskResultText).filter(Boolean) : [])])];
      call={...scope,callType:'AI 外呼',predictiveParentCallId:clean(event.predictiveCallId),aiResultFinal:true,
        supplierId:clean(event.supplierId),...(tags!==undefined ? {aiSupplierTags:tags} : {}),
        aiCallStatus:clean(event.aiCallStatus),durationSeconds:settings.durationSeconds(event.durationSeconds),
        aiResult:clean(event.result),aiDetails:structuredClone(event.details || {}),endedAt:clean(event.endedAt)};
    }
    const calls=state.callRecords || [];
    const existing=calls.find(row=>row.taskId===scope.taskId&&row.roundId===scope.roundId&&historicalRowInScope(row,current)&&callIdentity(row)===id);
    if (existing) return JSON.stringify(existing)===JSON.stringify(call) ? {ok:true,duplicate:true} : {error:'同一通话收到不同回调，保留已记录结果，需人工核对。'};
    return saveRoundMutation(state,task,()=>{
      state.callRecords=[...calls,call];
      const latest=task.followupHistory?.at(-1);
      const savedVisit=latest?.roundId===task.roundId && latest.seat===task.ownerId && latest.result===task.followupResult ? latest : null;
      const input=savedVisit ? {...roundFollowupInput(savedVisit),callStatus:savedVisit.contact,leadStatus:savedVisit.leadStatus,nativeWindow} : {nativeWindow};
      const plan=roundDecision(book,state,current,task,input,true);
      if (!plan) return {ok:true,recorded:true};
      const outcome=applyCompletedRound(state,current,task,book,savedVisit || {roundId:task.roundId,at:call.endedAt || new Date().toISOString()},input,plan);
      return {ok:true,outcome};
    },'原轮回调未保存，请重试。');
  }

  function retiredRatingWait(task) {
    const processing = task?.skynet?.processing;
    const latest = task?.followupHistory?.at(-1);
    return task?.taskStatus === '待处理' && processing?.waitingForRating === true &&
      !task.callState && !reachedDelivery(task) && Boolean(task.ownerId && latest?.roundId) &&
      task.roundId === task.skynet.roundId && latest.roundId === task.roundId &&
      processing.followupRoundId === latest.roundId && latest.seat === task.ownerId &&
      latest.result === task.followupResult &&
      ['人工外呼','预外呼'].includes(nurtureMethod(latest.callMode || latest.callType));
  }

  function roundSupplementFields(state, context, task, nativeWindow) {
    if (!taskSeat(state,context,task) || !window.DReview21.isLatest(state) ||
        task.taskStatus !== '待处理' || task.callState || reachedDelivery(task)) return [];
    if (window.DLeadRatingWorkbench?.pending(task)) return [];
    const latest = task.followupHistory?.at(-1);
    const {processing,lastRound} = task.skynet;
    const recoverRetiredWait = retiredRatingWait(task);
    if (!latest?.roundId || latest.roundId !== task.roundId || latest.seat !== task.ownerId ||
        latest.result !== task.followupResult || processing?.followupRoundId !== latest.roundId ||
        (!recoverRetiredWait && (lastRound?.roundId !== latest.roundId || !processing.missingFields?.length)) ||
        !['人工外呼','预外呼'].includes(nurtureMethod(latest.callMode || latest.callType))) return [];
    const book = settings.read(state);
    const plan = !recoverRetiredWait && roundDecision(book,state,context,task,{...roundFollowupInput(latest),
      callStatus:latest.contact,leadStatus:latest.leadStatus,nativeWindow});
    if (!recoverRetiredWait && plan?.outcome !== 'missing') return [];
    const missing = new Set(recoverRetiredWait ? ['round.intentLevel'] :
      plan.conditions.filter(item=>item.outcome==='missing').map(item=>item.field));
    const formCatalog = window.DReview21DccFollowupFields;
    const definitions = formCatalog?.taskForm?.(task,nativeWindow,context)?.fields || [];
    return ['intentLevel','leadStatus'].flatMap(key => {
      if (!missing.has('round.'+key)) return [];
      const field = definitions.find(item=>formCatalog.fieldKey?.(item)===key || item.businessKey===key);
      const standard = key==='intentLevel' ? settings.roundFields.find(item=>item.key==='round.intentLevel') :
        settings.intakeFieldProfile(context,categoryOf(task)).fields.find(item=>item.key==='leadStatus');
      if (!standard?.options?.length || field && (field.enabled===false || field.type!=='select')) return [];
      const choices = field ? (field.options || []).flatMap(option => {
        if (option.enabled===false || !option.id || !option.label) return [];
        const fact = [option.businessKey,option.id,option.label].filter(Boolean).map(value=>canonicalOption(standard,value)).find(Boolean);
        return fact ? [{value:option.id,label:option.label,fact:fact.value}] : [];
      }) : key==='leadStatus' ? standard.options.map(({value,label})=>({value,label,fact:value})) : [];
      const current = latest.details?.[key] ?? task.visitOptionValues?.[key] ?? task.visitDetails?.[key] ?? task[key];
      const selected = recoverRetiredWait && choices.find(option =>
        [option.value,option.label,option.fact].includes(taskResultText(current)));
      return choices.length ? [{key,label:field?.label || standard.label,options:choices,
        ...(selected ? {value:selected.value} : {})}] : [];
    });
  }

  function supplementRound(state, context, task, {roundId,values,nativeWindow} = {}) {
    const fields = roundSupplementFields(state,context,task,nativeWindow);
    if (!fields.length || roundId !== task.roundId) {
      return {error:'本轮待补录资料已变化，请刷新后核对任务。'};
    }
    if (!values || typeof values!=='object' || Array.isArray(values) || Object.keys(values).length!==fields.length ||
        !fields.every(field=>Object.hasOwn(values,field.key))) {
      return {error:'请填写本轮待补录字段。'};
    }
    const selected = fields.map(field=>[field,field.options.find(option=>option.value===values[field.key])]);
    if (selected.some(([,option])=>!option)) return {error:'请选择本轮允许的回访值。'};
    const recoverRetiredWait = retiredRatingWait(task);

    return saveRoundMutation(state,task,()=>{
      const original = task.followupHistory.at(-1);
      const visit = {...original,details:{...original.details},options:{...original.options},
        detailFields:Array.isArray(original.detailFields) ? [...original.detailFields] : []};
      const visitDetails = {...task.visitDetails};
      const visitOptionValues = {...task.visitOptionValues};
      for (const [field,option] of selected) {
        visitDetails[field.key] = option.label;
        visitOptionValues[field.key] = visit.options[field.key] = option.value;
        if (field.key==='leadStatus') visit.leadStatus = option.fact;
        else task.intentLevel = option.fact;
        visit.details[field.key] = field.key==='intentLevel' ? option.fact : option.label;
        if (!visit.detailFields.some(item=>item?.[0]===field.key)) visit.detailFields.push([field.key,field.label]);
      }
      Object.assign(task,{visitDetails,visitOptionValues,nextAt:visit.nextAt || '',
        followupHistory:[...task.followupHistory.slice(0,-1),visit]});
      if (recoverRetiredWait) {
        const {waitingForRating,...processing} = task.skynet.processing;
        task.skynet = {...task.skynet,processing:{...processing,
          missingFields:fields.map(field=>field.label),missingFieldKeys:fields.map(field=>'round.'+field.key)}};
      }
      const outcome = completeRound(state,context,task,{nativeWindow});
      return outcome ? {outcome} : null;
    },'本轮补录未保存，请重试。');
  }

  function saveRoundMutation(state, task, apply, failure) {
    const previousTask = {...task};
    const previousState = {...state};
    const recordBindings = state.records.filter(item=>item.skynet).map(item=>[item,item.skynet]);
    const seatCounts = (state.seats || []).map(seat=>[seat,seat.newCount,Object.hasOwn(seat,'newCount')]);
    try {
      const outcome = apply();
      if (outcome && window.DReview21.save(state)) return outcome;
    } catch (_) { /* Restore the same round and any routing changes before reporting failure. */ }
    for (const key of Object.keys(task)) if (!Object.hasOwn(previousTask,key)) delete task[key];
    Object.assign(task,previousTask);
    for (const key of Object.keys(state)) if (!Object.hasOwn(previousState,key)) delete state[key];
    Object.assign(state,previousState);
    for (const [item,binding] of recordBindings) item.skynet=binding;
    for (const [seat,count,hadCount] of seatCounts) {
      if (hadCount) seat.newCount=count;
      else delete seat.newCount;
    }
    return {error:window.DReview21.saveFailure(state,failure)};
  }

  function completeLegacyRound(task, latest, plan) {
    plan.action = task.nextAt ? '人工外呼' : '结束培育';
    if (plan.round.callMethod === '企微培育') {
      Object.assign(task,{taskStatus:'已结束',requiredMode:'',waitReason:'本轮未命中下发或后续培育规则。'});
    }
    const processing = {...processingFor(plan),status:task.taskStatus,followupRoundId:latest.roundId};
    recordRound(task,latest,plan,processing);
    if (task.nextAt) advanceRound(task,plan.round.number);
    return {status:task.taskStatus};
  }

  const coldDelayDay = 24 * 60 * 60 * 1000;
  const validColdDelay = days => Number.isSafeInteger(days) && days >= 1 && days <= 3650;
  const coldDelayLabel = at => new Intl.DateTimeFormat('zh-CN',{
    timeZone:'Asia/Shanghai',dateStyle:'short',timeStyle:'short',hour12:false
  }).format(at);

  function scheduleColdTransfer(state, context, task, book, plan, processing, entryReceipt, decidedAt = Date.now()) {
    if (!Object.hasOwn(plan,'coldWindowDays')) return completeColdTransfer(state,context,task,book,plan,processing,entryReceipt);
    const fromRound = task.skynet.lastRound?.roundId === task.roundId ? task.skynet.lastRound.at : '';
    const start = entryReceipt ? decidedAt : Date.parse(fromRound);
    const days = plan.coldWindowDays;
    const ready = validColdDelay(days) && Number.isFinite(start);
    const dueAt = ready ? start + days * coldDelayDay : null;
    const reason = ready ? '下一轮冷线索培育等待中，预计 ' + coldDelayLabel(dueAt) + '（北京时间）触发。' :
      '缺少可核对的本轮结束时间或等待天数，暂不启动下一轮冷线索培育。';
    const pending = {roundId:task.roundId,taskId:task.taskId,days,
      startedAt:ready ? start : null,dueAt,targetRuleId:plan.coldRuleId,
      entryReceiptId:entryReceipt?.id || '',plan:structuredClone(plan)};
    Object.assign(task,{taskStatus:'待处理',requiredMode:'',nextAt:'',waitReason:reason});
    task.skynet = {...task.skynet,pendingColdNurture:pending,
      processing:{...processing,status:task.taskStatus,destination:'等待下一轮冷线索培育',waitingForColdWindow:true}};
    if (entryReceipt) Object.assign(entryReceipt,{status:task.taskStatus,reason});
    return {status:task.taskStatus,action:plan.action,warning:reason};
  }

  function tickColdNurture(state, context, now = Date.now()) {
    if (!Number.isFinite(now) || !activeContext(context) || !window.DReview21?.isLatest(state)) return 0;
    let count = 0;
    for (const task of state.records || []) {
      const pending = task.skynet?.pendingColdNurture;
      if (!pending || task.taskStatus !== '待处理' || !task.skynet.processing?.waitingForColdWindow ||
          pending.taskId !== task.taskId || pending.roundId !== task.roundId || pending.roundId !== task.skynet.roundId ||
          pending.targetRuleId !== pending.plan?.coldRuleId || pending.plan?.action !== '转冷线索' ||
          !validColdDelay(pending.days) || pending.days !== pending.plan.coldWindowDays ||
          !Number.isFinite(pending.startedAt) || !Number.isFinite(pending.dueAt) ||
          pending.dueAt !== pending.startedAt + pending.days * coldDelayDay || now < pending.dueAt ||
          now < (pending.retryAt || 0) || task.callState || reachedDelivery(task) || task.skynet.coldTransfer ||
          !inScope(context,task) || !(canSubmit(context) || taskSeat(state,context,task))) continue;
      const source = pending.entryReceiptId ? originalIntake(state,context,task) : null;
      if (pending.entryReceiptId && source?.id !== pending.entryReceiptId) continue;
      const result = saveRoundMutation(state,task,()=>{
        // Work on a copy of the originating receipt so storage failure cannot
        // leak a status change into the previously persisted state.
        const receipt = source ? {...source} : null;
        if (receipt) state.skynetReceipts = state.skynetReceipts.map(row=>row===source ? receipt : row);
        const {pendingColdNurture,...next} = task.skynet;
        const {waitingForColdWindow,...processing} = next.processing;
        task.skynet = {...next,processing:{...processing,status:'已结束'}};
        task.taskStatus = '已结束';
        task.waitReason = '';
        const outcome = completeColdTransfer(state,context,task,settings.read(state),pending.plan,task.skynet.processing,receipt,true);
        if (outcome.coldTransfer) {
          if (receipt) Object.assign(receipt,{status:task.taskStatus,reason:'已触发下一轮冷线索培育。'});
        } else {
          task.skynet = {...task.skynet,pendingColdNurture:{...pending,retryAt:now+60_000},
            processing:{...task.skynet.processing,waitingForColdWindow:true}};
        }
        return outcome;
      },'冷线索到期结果未保存，稍后再试。');
      if (result.coldTransfer) count++;
      if (result.error) break;
    }
    return count;
  }

  function completeColdTransfer(state, context, task, book, plan, processing, entryReceipt, timed = false) {
    const transfer = transferToColdRule(state,context,task,book,plan.coldRuleId,entryReceipt,timed);
    if (transfer.error) {
      task.taskStatus = '待处理';
      task.waitReason = transfer.error;
      task.skynet = {...task.skynet,processing:{...processing,status:task.taskStatus,destination:'待核对冷线索分配规则',waitingForCold:true}};
      if (entryReceipt) Object.assign(entryReceipt,{status:task.taskStatus,reason:task.waitReason});
      return {status:task.taskStatus,action:plan.action,warning:transfer.error};
    }
    const coldTransfer = {
      receiptId:transfer.receipt.id,taskId:transfer.taskId,targetRuleId:transfer.targetRuleId,
      targetRuleName:transfer.receipt.assignmentRuleName,targetRuleVersion:transfer.receipt.assignmentRuleVersion,result:transfer.result
    };
    commitStrategy(task,plan);
    task.skynet = {...task.skynet,coldTransfer,endReason:'转冷线索'};
    if (entryReceipt) entryReceipt.coldTransfer = coldTransfer;
    return {status:task.taskStatus,action:plan.action,coldTransfer};
  }

  function followupDecision(book, state, context, task, {event = '回访完成',...input}) {
    if (!followupEvents.has(event) || !taskSeat(state,context,task) || reachedDelivery(task) || !clean(input.result)) return null;
    const previous = task.skynet.processing;
    if (previous?.followupRoundId && previous.followupRoundId === task.roundId &&
        (!canRetryDecision(previous) || previous.event !== event)) return null;
    const {nurtureTemplateId,nurtureTemplateVersion} = task.skynet;
    const nurture = settings.version(book,'nurtureTemplates',nurtureTemplateId,nurtureTemplateVersion);
    if (!nurture || nurture.strategyTree === true || nurture.categoryId !== categoryOf(task)) return null;
    const receipt = originalIntake(state,context,task);
    const evidence = previousCallEvidence(state,context,task,nurture,input);
    const facts = withPreRating(context,currentRoundFacts(task,taskIntakeValues(task,receipt),{...input,...evidence}),task);
    const delivery = deliveryTemplate(book,deliveryBinding(task.skynet),categoryOf(task));
    return {...planFor(nurture,event,facts,{delivery}),round:facts.round};
  }

  function completeFollowup(state, context, task, {event = '回访完成',callStatus,nativeWindow} = {}) {
    if (!window.DReview21.isLatest(state)) return null;
    if (window.DLeadRatingWorkbench?.pending(task)) return {status:task.taskStatus,action:'线索评级中',warning:task.waitReason};
    let latest = task?.followupHistory?.at(-1);
    if (!latest?.roundId || latest.roundId !== task.roundId || latest.result !== task.followupResult || latest.seat !== task.ownerId) return null;
    const aiLinkage = applyAiFieldLinkage(state,context,task,latest,nativeWindow);
    if (aiLinkage?.denied || aiLinkage?.skip) return null;
    if (aiLinkage?.error) return holdAiFieldLinkage(task,latest,aiLinkage.error);
    latest = aiLinkage?.visit || latest;
    const book = settings.read(state);
    const plan = followupDecision(book,state,context,task,{
      event,...roundFollowupInput(latest),callStatus:callStatus || latest.contact,nativeWindow
    });
    if (!plan) { aiLinkage?.rollback();return null; }
    const unmatched = plan.outcome === 'notMatched';
    const previous = task.skynet.processing;
    if (unmatched && !(previous?.followupRoundId === latest.roundId && canRetryDecision(previous))) {
      aiLinkage?.rollback();return null;
    }
    const policy = deliveryActions.has(plan.action) ? taskDeliveryPolicy(state,context,task,book,plan.deliveryGate?.type) : null;
    if (policy?.error) return holdDeliveryPlan(task,plan,policy,latest);
    const processing = processingFor(plan,context);
    if (!unmatched) processing.followupRoundId = latest.roundId;
    const requiredMode = processing.waitingForTarget ? '' : nurtureDestinations[plan.action].requiredMode;
    if (plan.action === '人工外呼') {
      processing.status = task.nextAt ? '下次回访' : '待办理';
      processing.destination = '原跟进坐席';
    } else {
      task.nextAt = '';
    }
    const waitReason = unmatched ? '「' + event + '」未命中可执行规则，任务待处理。' : processingReason(processing);
    Object.assign(task,{taskStatus:processing.status,waitReason});
    if (!closedTasks.has(task.taskStatus)) task.requiredMode = requiredMode;
    task.skynet = {...task.skynet,action:plan.action,plannedActions:[...plan.actions],decisionEvent:plan.event,processing};
    if (plan.action === '转冷线索') {
      recordRound(task,latest,plan,processing);
      return scheduleColdTransfer(state,context,task,book,plan,processing);
    }
    if (plan.action === '企微培育') {
      recordRound(task,latest,plan,processing);
      advanceRound(task,plan.round.number);
      const wecom = resolveWecomAssignment(state,context,task);
      if (wecom) recordWecomAssignment(task,wecom);
    }
    if (deliveryActions.has(plan.action)) {
      const delivery = enterDelivery(state,context,task,plan,policy);
      return {status:delivery.status,action:plan.action,...(delivery.reason ? {warning:delivery.reason} : {delivery,warning:''})};
    }
    return {status:task.taskStatus,action:plan.action,warning:canRetryDecision(processing) || unmatched ? waitReason : ''};
  }

  function getDeliveryNurtureResult(task) {
    const visit = task.followupHistory?.at(-1) || {};
    const round = task.skynet.lastRound || {};
    const wecom = round.callMethod === '企微培育';
    return {
      taskId:task.taskId,roundId:task.skynet.roundId,roundNumber:currentRoundNumber(task),
      callStatus:wecom ? '' : round.callStatus || visit.contact || task.callContact,
      result:round.result || visit.result || task.followupResult,
      intentLevel:wecom ? round.intentLevel : round.intentLevel || visit.details?.intentLevel || task.visitDetails?.intentLevel,
      leadStatus:wecom ? round.leadStatus : round.leadStatus || visit.leadStatus || task.leadStatus,
      note:visit.note || task.followupNote,details:structuredClone(visit.details || task.visitDetails || {})
    };
  }

  function planDeliveryLeads(state, context, task, mode, storeIds, fallbackStoreId) {
    const targets = deliveryStoreOptions(state,context,task);
    const ids = storeIds ?? [];
    if (!Array.isArray(ids) || ids.some(id => typeof id !== 'string' || !id) || new Set(ids).size !== ids.length) {
      return {error:'请选择有效且不重复的下发门店。'};
    }
    const requested = mode === 'oneToOne' && !ids.length && targets.preferredStoreId ? [targets.preferredStoreId] : ids;
    if (mode === 'oneToOne' && requested.length !== 1) return {error:'1 发 1 需要选择一家下发门店。'};
    if (mode === 'oneToMany' && requested.length < 2) return {error:'1 发多至少需要选择两家下发门店。'};
    if (mode === 'oneToMany' && targets.requiredStoreIds.some(id => !requested.includes(id))) {
      return {error:'1 发多必须包含关联原生线索的可用意向门店。'};
    }
    if (mode === 'oneToMany' && targets.missingNativeStoreCount && !requested.includes(fallbackStoreId)) {
      return {error:'请为缺少可用意向门店的原生线索指定承接门店。'};
    }
    const selected = requested.map(id => targets.stores.find(store => store.value === id));
    if (selected.some(store => !store)) return {error:'请选择当前租户和品牌可用的门店。'};
    const stores = selected.map(({value,label}) => ({id:value,name:label}));
    const native = deliveryNativeLeads(state,context,task);
    if (!native.length) return {error:'未找到本任务关联的原生线索，请核对后重试。'};
    const assignments = native.map(lead => {
      const preferred = deliveryStoreId(targets.stores,lead.values.dealer);
      const store = mode === 'oneToOne' ? stores[0] : stores.find(item => item.id === (preferred || fallbackStoreId));
      return {kind:'native',lead,store};
    });
    if (mode === 'oneToMany') {
      const primary = native.find(lead => lead.receiptIds.includes(task.skynet.intakeId)) || native[0];
      for (const store of stores) {
        if (!targets.requiredStoreIds.includes(store.id)) assignments.push({kind:'derived',lead:primary,store});
      }
    }
    return {stores,assignments};
  }

  function deliveryDispatchMode(policy, mode) {
    if (mode && policy.mode && policy.mode !== mode) {
      return {error:policy.directStore ? '直发仅向来件的意向门店下发。' : '下发方式以任务绑定的模板版本为准。'};
    }
    return {mode:policy.mode || mode || 'oneToOne'};
  }

  function chosenDeliveryTargets(state, context, task, mode, receiverTenantIds) {
    const matched=internalDeliveryMatch(state,context,task);
    if (matched.status !== 'available') return {error:matched.reason,matching:matched};
    const ids = typeof receiverTenantIds === 'string' && receiverTenantIds ?
      [receiverTenantIds] : receiverTenantIds ?? [];
    if (!Array.isArray(ids) || ids.some(id => typeof id !== 'string' || !id) || new Set(ids).size !== ids.length) {
      return {error:'请选择有效且不重复的接收租户。'};
    }
    const requested=ids.length ? ids : [matched.tenant.id];
    if (!requested.includes(matched.tenant.id)) return {error:'接收租户必须包含意向门店对应的匹配租户。',matching:matched};
    if (mode === 'oneToOne' && (requested.length !== 1 || requested[0] !== matched.tenant.id)) {
      return {error:'1 发 1 仅可下发给当前匹配的接收租户。',matching:matched};
    }
    if (mode === 'oneToMany' && (context.scope.tenant.organization === '门店' || requested.length < 2)) {
      return {error:context.scope.tenant.organization === '门店' ? '门店仅可下发至同品牌总部。' :
        '1 发多须明确选择额外接收租户，并保留匹配的意向门店租户。',matching:matched};
    }
    const options = new Map(internalDeliveryOptions(context).map(option => [option.value,option.label]));
    if (requested.some(id => !options.has(id))) return {error:'接收租户不可用。请选择同品牌可用租户，门店仅可选择总部。',matching:matched};
    return {targets:requested.map(id => id === matched.tenant.id ? structuredClone(matched.targets[0]) :
      {id,label:options.get(id),type:'internalTenant',additionalReceiver:true}),
      storeMatch:structuredClone(matched.match),matching:matched};
  }

  function previewDelivery(state, context, task, requestedMode, storeIds, fallbackStoreId, receiverTenantIds) {
    if (!canDispatchDelivery(state,context,task)) return {error:'当前任务不在本人待下发范围内。'};
    if (!window.DReview21.isLatest(state)) return {error:window.DReview21.saveFailure(state)};
    const policy = taskDeliveryPolicy(state,context,task);
    if (policy.error) return {error:policy.error};
    const {mode,error} = deliveryDispatchMode(policy,requestedMode);
    if (error) return {error};
    const output = deliveryOutput(task,policy);
    if (output.error) return output;
    if (!settings.deliveryModes.some(option => option.value === mode)) return {error:'请选择一种可用的下发方式。'};
    if (policy.targetType === 'internalTenant') return chosenDeliveryTargets(state,context,task,mode,receiverTenantIds);
    const plan = policy.directStore ? directDeliveryAssignments(state,context,task,policy.directStore) :
      planDeliveryLeads(state,context,task,mode,storeIds,fallbackStoreId);
    if (plan.error) return plan;
    return {stores:plan.stores,leads:plan.assignments.map(({kind,lead,store}) => ({
      kind,storeId:store.id,storeName:store.name,
      localLeadCode:kind === 'native' ? lead.sourceLeadCode : null,
      sourceLeadCode:kind === 'native' ? lead.sourceLeadCode : null
    }))};
  }

  function directDeliveryAssignments(state, context, task, store) {
    return {stores:[store],assignments:deliveryNativeLeads(state,context,task).map(lead=>({kind:'native',lead,store}))};
  }

  // Resolve only the completed round bound to this delivery; never read a previous visit or intake for configured fields.
  function deliveryOutput(task, policy, type) {
    const template = policy.template;
    if (policy.directDeliveryTarget || policy.directStore || !template.fieldsByChannel) return {entries:[]};
    const roundId = task.skynet.roundId;
    const round = task.skynet.lastRound?.roundId === roundId ? task.skynet.lastRound : null;
    const visits = (task.followupHistory || []).filter(visit=>visit?.roundId===roundId);
    const visit = visits.length===1 && (!visits[0].taskId || visits[0].taskId===task.taskId) ? visits[0] : null;
    const callMethod = nurtureMethod(round?.callMethod || visit?.callMode || visit?.callType);
    const channel = callMethod === 'AI 外呼' ? 'ai' : ['人工外呼','预外呼'].includes(callMethod) ? 'manual' : '';
    const fields = template.fieldsByChannel[type || task.skynet.delivery?.type ||
      task.skynet.processing?.deliveryGate?.type || 'intent'];
    if (!channel && !callMethod && fields && Object.values(fields).some(rows=>rows?.length)) {
      return {error:'无法确认本轮呼叫渠道，未下发。请核对本轮回访或 AI 话单。'};
    }
    const rows = fields?.[channel] || [];
    const entries = [], missing = [];
    const present = value => (typeof value==='number' && Number.isFinite(value)) || typeof value==='boolean' ||
      typeof value==='string' && Boolean(value.trim()) ||
      Array.isArray(value) && value.length>0 && value.every(item=>typeof item==='string'&&Boolean(item.trim()) || typeof item==='number'&&Number.isFinite(item));
    for (const row of rows) {
      let value = row.fixedValue;
      if (!present(value)) {
        if (channel==='manual' && visit) {
          const key = row.followupKey;
          value = key && Object.hasOwn(visit.details || {},key) ? visit.details[key] :
            {visitResult:visit.result,contactStatus:visit.contact,visitDesc:visit.note,nextVisitTime:visit.nextAt}[key];
        } else if (channel==='ai' && round) {
          if (row.sourceId==='status') value = round.aiCallStatus;
          else if (row.sourceId==='duration') value = settings.durationSeconds(round.aiDurationSeconds);
          else if (row.sourceSupplierId && round.aiSupplierId===row.sourceSupplierId &&
              Array.isArray(round.aiTags) && row.sourceAliases?.some(alias=>round.aiTags.includes(alias))) value = row.sourceTagName;
        }
      }
      if (!present(value)) {
        if (row.required) missing.push(row.label);
        else entries.push([row.target,undefined]);
      } else entries.push([row.target,structuredClone(value)]);
    }
    return missing.length ? {error:'本轮缺少必填下发字段：'+missing.join('、')+'。未下发，请核对本轮结果。'} : {entries};
  }

  function deliveryMappedFields(template, values, policy, roundOutput = []) {
    const fixed = policy?.directDeliveryTarget?.fields || [];
    const configured = new Map(fixed.map(({key,value})=>[key,value]));
    const aliases = new Set();
    const entries = (template.mapping || []).map(({source,target})=>{
      if (configured.has(source) && !['originalKey','dealer'].includes(source)) {
        aliases.add(source);
        return [target,configured.get(source)];
      }
      return [target,values[source] ?? ''];
    });
    const routingTargets = new Set((template.mapping || []).filter(row=>['originalKey','dealer'].includes(row.source)).map(row=>row.target));
    for (const [key,value] of configured) {
      if (!aliases.has(key) && !routingTargets.has(key)) entries.push([key,value]);
    }
    const result = new Map(entries);
    for (const [target,value] of roundOutput) {
      if (value===undefined) result.delete(target);
      else result.set(target,value);
    }
    return Object.fromEntries(result);
  }

  function deliveryLeadRows(state, task, template, assignments, policy, roundOutput = []) {
    const nurtureResult = getDeliveryNurtureResult(task);
    const mappedFields = (values,localLeadCode,storeId) =>
      deliveryMappedFields(template,{...values,originalKey:localLeadCode,dealer:storeId},policy,roundOutput);
    let existingCodes;
    let sequence = 1;
    return assignments.map(({kind,lead,store}) => {
      if (kind === 'native') return {
        kind,sourceLeadCode:lead.sourceLeadCode,localLeadCode:lead.sourceLeadCode,
        sourceApplicationId:lead.sourceApplicationId,receiptIds:lead.receiptIds,
        storeId:store.id,storeName:store.name,nurtureResult,mappedFields:mappedFields(lead.values,lead.sourceLeadCode,store.id)
      };
      existingCodes ??= new Set([
        ...(state.skynetReceipts || []).map(receipt => receipt.localLeadCode || receipt.originalKey),
        ...state.records.map(record => record.localLeadCode || record.originalKey),
        ...state.records.flatMap(record => (record.skynet?.delivery?.leads || []).map(lead => lead.localLeadCode)),
        ...assignments.map(item => item.lead.sourceLeadCode)
      ]);
      let localLeadCode;
      do localLeadCode = 'TW-DERIVED-' + task.taskId + '-' + sequence++;
      while (existingCodes.has(localLeadCode));
      existingCodes.add(localLeadCode);
      return {
        kind,sourceLeadCode:null,localLeadCode,
        derivedFromLocalLeadCode:lead.sourceLeadCode,derivedFromSourceApplicationId:lead.sourceApplicationId,
        storeId:store.id,storeName:store.name,nurtureResult,mappedFields:mappedFields(lead.values,localLeadCode,store.id)
      };
    });
  }

  function prepareDispatch(state, context, task, policy, {requestedMode,storeIds,fallbackStoreId,receiverTenantIds}) {
    const {mode,error} = deliveryDispatchMode(policy,requestedMode);
    if (error) return {error};
    if (policy.directStore && (storeIds?.length || fallbackStoreId || receiverTenantIds?.length)) {
      return {error:'直发对象和门店已按原来件确定。'};
    }
    const {template} = policy;
    const output = deliveryOutput(task,policy);
    if (output.error) return output;
    const selected = settings.deliveryModes.find(option => option.value === mode);
    const legacy = !template.criteria && settings.legacyDeliveryModes.find(option => option.value === mode);
    if (!selected && !legacy) return {error:'请选择一种可用的下发方式。'};
    const internal = policy.targetType === 'internalTenant';
    const selection = internal && selected ? chosenDeliveryTargets(state,context,task,mode,receiverTenantIds) : {};
    if (selection.error) return selection;
    if (internal && !selection.targets) return {error:'内部下发需要按模板选择接收租户。'};
    const receipt = originalIntake(state,context,task);
    const values = taskIntakeValues(task,receipt);
    let stores;
    let targetLabel;
    let assignments;
    let originals;
    if (internal) {
      originals = deliveryNativeLeads(state,context,task);
      if (!originals.length) return {error:'未找到本任务关联的原生线索，请核对后重试。'};
    } else if (selected) {
      const planned = policy.directStore ? directDeliveryAssignments(state,context,task,policy.directStore) :
        planDeliveryLeads(state,context,task,mode,storeIds,fallbackStoreId);
      if (planned.error) return planned;
      stores = planned.stores;
      assignments = planned.assignments;
    } else if (mode === 'intentStore') {
      const dealer = clean(task.visitDetails?.intentStore) || clean(values.dealer);
      const field = (receipt?.inputProfile?.fields || config.fields).find(item => item.key === 'dealer');
      targetLabel = canonicalOption(field || {},dealer)?.label || dealer;
    }
    return {mode,label:policy.directStore ? '接入直发' : (selected || legacy).label,internal,
      targets:selection.targets || (policy.target ? [policy.target] : []),
      ...(selection.storeMatch || policy.storeMatch ? {storeMatch:structuredClone(selection.storeMatch || policy.storeMatch)} : {}),
      ...(selection.matching ? {matching:selection.matching} : {}),
      receipt,values,stores,assignments,originals,targetLabel,roundOutput:output.entries};
  }

  function deliveryReviewFingerprint(prepared) {
    const rows = prepared.internal ? prepared.originals.map(lead=>({kind:'native',lead})) : prepared.assignments || [];
    const fingerprint=[
      prepared.mode,prepared.targets.map(({type,id,application})=>application ? [type,id,application.revision,application.connectionKey] : [type,id]),
      (prepared.stores || []).map(store=>store.id),
      rows.map(({kind,lead,store})=>[kind,lead.sourceApplicationId,lead.sourceLeadCode,lead.receiptIds,store?.id])
    ];
    if (prepared.storeMatch) fingerprint.push(internalMatchSignature(prepared.storeMatch));
    return JSON.stringify(fingerprint);
  }

  function deliveryReviewContent(task, policy, prepared) {
    const leads = prepared.internal ? prepared.originals : (prepared.assignments || []).map(item=>item.lead);
    const content=[deliveryMappedFields(policy.template,prepared.values,policy,prepared.roundOutput),leads.map(lead=>lead.values),getDeliveryNurtureResult(task)];
    if (prepared.storeMatch) content.push(internalMatchSignature(prepared.storeMatch));
    return JSON.stringify(content);
  }

  function applyDeliveryReview(state, context, task, delivery, reason) {
    Object.assign(task,{taskStatus:delivery.status,waitReason:reason,skynet:{...task.skynet,delivery,
      processing:{...task.skynet.processing,status:delivery.status,destination:reason}}});
    state.skynetReceipts = (state.skynetReceipts || []).map(receipt=>
      receipt.id === task.skynet.intakeId && inScope(context,receipt)
        ? {...receipt,deliveryPlan:structuredClone(delivery),
          ...(['待下发','待下发审核'].includes(receipt.status) ? {status:delivery.status,reason} : {})} : receipt);
  }

  function saveDeliveryReview(state, context, task, delivery, reason) {
    return saveRoundMutation(state,task,()=>{
      applyDeliveryReview(state,context,task,delivery,reason);
      return {ok:true,delivery:structuredClone(delivery)};
    },'下发审核记录未保存，请重试。');
  }

  const reviewSubmitted = '已提交下发审核，等待本租户管理员处理。';

  function submittedDeliveryReview(task,pending,policy,prepared,handledBy,fallbackStoreId) {
    const review = {
      status:'pending',taskId:task.taskId,roundId:pending.roundId,templateId:pending.templateId,templateVersion:pending.templateVersion,
      type:pending.type || 'intent',submittedAt:new Date().toISOString(),submittedBy:handledBy.operatorAccountId,
      submittedByName:handledBy.operatorName,submittedSeatId:handledBy.operatorSeatId,
      selection:{mode:prepared.mode,storeIds:policy.directStore ? [] : prepared.stores?.map(store=>store.id) || [],
        fallbackStoreId:clean(fallbackStoreId),receiverTenantIds:prepared.internal ? prepared.targets.map(target=>target.id) : []},
      targets:prepared.targets,storeNames:prepared.stores?.map(store=>store.name) || [],
      ...(prepared.storeMatch ? {storeMatch:structuredClone(prepared.storeMatch)} : {}),
      fingerprint:deliveryReviewFingerprint(prepared),content:deliveryReviewContent(task,policy,prepared)
    };
    const history = pending.review ? [...(pending.reviewHistory || []),pending.review] : pending.reviewHistory;
    return {...pending,...handledBy,status:'待下发审核',auditEnabled:true,
      auditStatus:'待管理员审核',mode:prepared.mode,modeLabel:prepared.label,review,
      ...(prepared.storeMatch ? {storeMatch:structuredClone(prepared.storeMatch)} : {}),
      ...(history?.length ? {reviewHistory:history} : {})};
  }

  function dispatchDelivery(state, context, task, requestedMode, storeIds, fallbackStoreId, receiverTenantIds) {
    const operator = taskSeat(state,context,task);
    if (!operator) return {error:'当前账号不是本任务的跟进坐席。'};
    if (!window.DReview21.isLatest(state)) return {error:window.DReview21.saveFailure(state)};
    const pending = deliveryState(task);
    if (pending?.status === '已下发') return {error:'本任务已下发。'};
    if (pending?.status === '待下发审核') return {error:'本任务已提交管理员审核。'};
    if (pending?.status !== '待下发' || !['已结束','待下发'].includes(task.taskStatus)) {
      return {error:'本任务暂未进入待下发。'};
    }
    if (pending.roundId !== task.skynet.roundId || task.roundId && task.roundId !== pending.roundId ||
        pending.templateId !== task.skynet.deliveryTemplateId || pending.templateVersion !== task.skynet.deliveryTemplateVersion) {
      return {error:'原任务轮次或绑定模板已变化，请重新核对。'};
    }
    const policy = taskDeliveryPolicy(state,context,task);
    if (policy.error) return {error:policy.error};
    if (automaticDelivery(policy)) return {error:'本任务按配置采用自动下发，请核对原下发记录。'};
    const prepared = prepareDispatch(state,context,task,policy,{requestedMode,storeIds,fallbackStoreId,receiverTenantIds});
    if (prepared.error) return prepared;
    const handledBy = {operatorSeatId:operator.seat.id,operatorAccountId:operator.account.id,operatorName:operator.seat.name};
    if (!policy.auditEnabled) return finishDispatch(state,context,task,pending,policy,prepared,handledBy);
    const delivery = submittedDeliveryReview(task,pending,policy,prepared,handledBy,fallbackStoreId);
    return saveDeliveryReview(state,context,task,delivery,reviewSubmitted);
  }

  function deliveryReviewScope(state, context) {
    const current = activeContext(context);
    return current && state?.tenant === current.scope.id &&
      window.DReview21Operations?.canManage(current) ? current : null;
  }

  function generateDeliveryReviewSamples(state, context) {
    const current = deliveryReviewScope(state,context);
    if (!current || window.DApp?.currentPage() !== 'PAGE-21015') return {error:'仅本租户管理员可生成下发审核样例。'};
    if (!window.DReview21.isLatest(state)) return {error:window.DReview21.saveFailure(state)};
    const receiver = internalDeliveryOptions(current)[0];
    if (!receiver) return {error:'当前品牌暂无可用的接收租户，暂无法生成可审核样例。'};
    const validSeats = (state.seats || []).filter(seat=>seat.accountId && seat.tenant===state.tenant &&
      (!seat.brandId || seat.brandId===current.scope.tenant.brandId) && seat.enabled===true && seat.bindingState==='已关联');
    const seat = validSeats.find(row=>row.accountId===current.account.id) || validSeats[0];
    if (!seat) return {error:'当前租户暂无已关联账号的可用坐席，暂无法生成可审核样例。'};
    const category = settings.businessType(current,config.categoryId) || settings.businessTypes(current)[0];
    if (!category) return {error:'当前租户暂无可用的二级分类。'};

    const draft = {...state,records:[...state.records],skynetReceipts:[...(state.skynetReceipts || [])]};
    const profile = settings.intakeFieldProfile(current,category.value);
    const used = new Set([...draft.records.map(row=>phoneNumber(row.phone)),
      ...draft.skynetReceipts.map(row=>phoneNumber(row.mapped?.phone || row.values?.phone))]);
    const handledBy = {operatorSeatId:seat.id,operatorAccountId:seat.accountId,operatorName:seat.name};
    const template = reviewSampleTemplate;
    const binding = {deliveryTemplateId:template.id,deliveryTemplateVersion:template.version,deliveryTemplateName:template.name};
    const leadAt = new Date(Date.now()+8*3600000).toISOString().slice(0,16);
    let phoneIndex = 1;
    for (const type of ['intent','lowQuality','intent']) {
      let phone;
      do phone = '1380019'+String(phoneIndex++).padStart(4,'0'); while (used.has(phone));
      const sequence = sequenceFloor(draft,'receipt')+1;
      const code = 'DEMO-REVIEW-'+sequence;
      const input = workbenchSampleInput(profile,code,'下发审核模拟客户 '+sequence,phone,leadAt);
      const receipt = makeReceipt(draft,current,input,code,draft.skynetReceipts,category,reviewSampleSource);
      const {mapped,errors} = mapFields(receipt,profile.fields);
      if (errors.length) return {error:'当前分类的样例字段校验失败：'+errors.join('、')+'。'};
      Object.assign(receipt,{mapped,status:'待下发',completedAt:receipt.receivedAt});
      draft.skynetReceipts.unshift(receipt);
      const task = createTask(draft,receipt,binding);
      task.ownerId = seat.id;
      task.requiredMode = '人工外呼';
      const plan = {action:'进入下发判断',event:roundCompleteEvent,deliveryGate:{type}};
      const policy = taskDeliveryPolicy(draft,current,task,undefined,type);
      const pending = enterDelivery(draft,current,task,plan,policy);
      const prepared = prepareDispatch(draft,current,task,policy,{receiverTenantIds:[receiver.value]});
      if (prepared.error) return prepared;
      attachReceiptToTask(receipt,task);
      const delivery = submittedDeliveryReview(task,pending,policy,prepared,handledBy);
      applyDeliveryReview(draft,current,task,delivery,reviewSubmitted);
    }

    const previous = {records:state.records,skynetReceipts:state.skynetReceipts,skynetSequences:state.skynetSequences};
    Object.assign(state,{records:draft.records,skynetReceipts:draft.skynetReceipts,skynetSequences:draft.skynetSequences});
    if (window.DReview21.save(state)) return {ok:true,count:3};
    for (const [key,value] of Object.entries(previous)) {
      if (value===undefined) delete state[key];
      else state[key] = value;
    }
    return {error:window.DReview21.saveFailure(state,'下发审核样例未保存，请重试。')};
  }

  function deliveryReviewQueue(state, context) {
    const current = deliveryReviewScope(state,context);
    return current ? state.records.filter(task => inScope(current,task) &&
      (['pending','rejected','approved'].includes(task.skynet?.delivery?.review?.status) ||
        task.skynet?.delivery?.reviewHistory?.some(review=>['rejected','approved'].includes(review.status)))) : [];
  }

  function reviewDelivery(state, context, task, {decision,reason} = {}) {
    const current = deliveryReviewScope(state,context);
    if (!current || !state.records?.includes(task) || !inScope(current,task)) return {error:'仅本租户管理员可审核该任务。'};
    if (!window.DReview21.isLatest(state)) return {error:window.DReview21.saveFailure(state)};
    const pending = deliveryState(task);
    const prior = pending?.review;
    if (task.taskStatus !== '待下发审核' || pending?.status !== '待下发审核' || prior?.status !== 'pending' || prior.taskId !== task.taskId ||
        prior.roundId !== task.skynet.roundId || prior.roundId !== pending.roundId ||
        task.roundId && task.roundId !== prior.roundId ||
        prior.templateId !== pending.templateId || prior.templateVersion !== pending.templateVersion ||
        prior.type !== (pending.type || 'intent')) return {error:'审核申请已变化，请刷新后查看。'};
    if (!['approve','reject'].includes(decision)) return {error:'请选择审核结论。'};
    const note = clean(reason);
    if (decision === 'reject' && !note) return {error:'请填写驳回原因。'};
    const review = {...prior,status:decision === 'reject' ? 'rejected' : 'approved',reason:note,
      reviewedAt:new Date().toISOString(),reviewedBy:current.account.id,reviewedByName:current.account.name};
    if (decision === 'reject') {
      return saveDeliveryReview(state,current,task,{...pending,status:'待下发',auditStatus:'审核驳回',review},
        '下发审核已驳回，请负责坐席核对后重新提交。');
    }
    if (prior.templateId !== task.skynet.deliveryTemplateId || prior.templateVersion !== task.skynet.deliveryTemplateVersion) {
      return {error:'原任务绑定的模板版本已变化，请驳回后由坐席重新提交。'};
    }
    const responsible = (state.seats || []).find(seat => seat.id === task.ownerId && seat.tenant === state.tenant &&
      (!seat.brandId || seat.brandId === task.brandId) && seat.enabled === true && seat.bindingState === '已关联');
    if (responsible?.id !== prior.submittedSeatId || responsible?.accountId !== prior.submittedBy) {
      return {error:'原任务的负责坐席或办理资格已变化，请驳回后由坐席重新提交。'};
    }
    const policy = taskDeliveryPolicy(state,current,task);
    if (policy.error || !policy.auditEnabled) return {error:policy.error || '原下发审核配置不能核对。'};
    if (!prior.selection) return {error:'原申请的下发明细无法核对，请驳回后由坐席重新提交。'};
    const {mode,storeIds,fallbackStoreId,receiverTenantIds} = prior.selection;
    const prepared = prepareDispatch(state,current,task,policy,{requestedMode:mode,storeIds,fallbackStoreId,receiverTenantIds});
    if (prepared.error || deliveryReviewFingerprint(prepared) !== prior.fingerprint ||
        prior.content !== undefined && deliveryReviewContent(task,policy,prepared) !== prior.content) {
      return {error:(prepared.error || '下发目标或任务关联线索已变化。') + '请驳回后由坐席重新提交。'};
    }
    return finishDispatch(state,current,task,{...pending,review},policy,prepared,{});
  }

  function finishDispatch(state, context, task, pending, policy, prepared, operator) {
    const {template} = policy;
    const {mode,label,internal,targets,receipt,values,stores,assignments,originals,targetLabel,storeMatch,roundOutput} = prepared;
    const leads = assignments && deliveryLeadRows(state,task,template,assignments,policy,roundOutput);
    const delivery = {
      ...pending,templateName:pending.templateName || template.name,status:'已下发',
      mode,modeLabel:label,simulated:true,trigger:'manual',
      auditEnabled:policy.auditEnabled,auditStatus:policy.auditEnabled ? '审核通过' : '无需审核',
      ...(internal ? {targets,...(targets.length === 1 ? {target:targets[0]} : {})} :
        policy.target ? {target:policy.target} : {}),
      ...operator,
      sentAt:new Date().toISOString(),
      ...(policy.target?.application ? {application:structuredClone(policy.target.application),externalId:'MOCK-DELIVERY-' + pending.roundId} : {}),
      ...(stores ? {stores} : {}),
      ...(leads ? {leads} : {}),
      ...(targetLabel ? {targetLabel} : {}),
      ...(storeMatch ? {storeMatch:structuredClone(storeMatch)} : {}),
      mappedFields:deliveryMappedFields(template,values,policy,roundOutput)
    };
    const previous = {taskStatus:task.taskStatus,skynet:task.skynet,waitReason:task.waitReason};
    const previousReceipts = state.skynetReceipts;
    const nurtureResult = internal ? getDeliveryNurtureResult(task) : null;
    const synchronized = internal ? originals.map(lead => ({...lead,localLeadCode:lead.sourceLeadCode,nurtureResult})) : leads;
    const byReceiptId = new Map((synchronized || []).flatMap(lead =>
      (lead.receiptIds || []).map(id => [id,lead])));
    if (byReceiptId.size) {
      state.skynetReceipts = previousReceipts.map(item => {
        const lead = byReceiptId.get(item.id);
        return lead ? {...item,taskId:task.taskId,roundId:item.roundId || task.skynet.roundId,
          taskRelation:item.taskId ? item.taskRelation : '窗口内关联原任务',
          localLeadCode:lead.localLeadCode,sourceLeadCode:lead.sourceLeadCode,nurtureResult:lead.nurtureResult,
          leadDelivery:{...(internal ? {status:'已下发',receiverTenantIds:targets.map(target=>target.id),sentAt:delivery.sentAt} :
            {status:'已下发',storeId:lead.storeId,storeName:lead.storeName,sentAt:delivery.sentAt}),
            ...(policy.directDeliveryTarget?.fields?.length || roundOutput?.length ? {
              mappedFields:lead.mappedFields || deliveryMappedFields(template,
                {...lead.values,originalKey:lead.localLeadCode},policy,roundOutput)
            } : {})}} : item;
      });
    }
    if (receipt) state.skynetReceipts = state.skynetReceipts.map(item => item.id === receipt.id ?
      {...item,deliveryPlan:structuredClone(delivery),
        ...(['待下发','待下发审核'].includes(item.status) ? {status:'已下发',reason:'已下发（模拟）。'} : {})} : item);
    Object.assign(task,{taskStatus:'已结束',skynet:{...task.skynet,delivery,endReason:'已下发',
      processing:{...task.skynet.processing,status:'已结束',destination:'已下发'}},waitReason:''});
    if (policy.target?.application) appendScenarioEvidence(task,'下发',policy.target.application,'外部系统下发','success',
      '已向所选应用模拟下发。',{externalId:delivery.externalId,at:delivery.sentAt});
    if (!window.DReview21.save(state)) {
      Object.assign(task,previous);
      if (receipt || byReceiptId.size) state.skynetReceipts = previousReceipts;
      const error = window.DReview21.saveFailure(state,'下发记录未保存，请重试。');
      const log = window.DBatchFailureLog;
      log?.record(context,'delivery',{...log.reference(task,receipt),reason:error});
      return {error};
    }
    return {ok:true,delivery:structuredClone(delivery)};
  }

  function plannedDelivery(book, context, receipt, nurtureDecision) {
    const direct = nurtureDecision.event === '接入后' ? receipt.deliveryPlan : null;
    if (!direct && (nurtureDecision.outcome !== 'matched' || !deliveryActions.has(nurtureDecision.action))) {
      const gate = nurtureDecision.deliveryGate?.outcome;
      const status = gate === 'missing' ? '下发条件缺少判定数据，预计转待处理' :
        gate === 'notMatched' ? '本轮未命中下发条件' :
        gate === 'notConfigured' ? '本轮未配置下发条件' : '未进入下发判断';
      return {outcome:gate || 'notApplicable',status,...deliveryTypeEvidence(nurtureDecision.deliveryGate)};
    }
    const binding = direct ? {
      templateId:direct.templateId,templateName:direct.templateName,templateVersion:direct.templateVersion
    } : deliveryBinding(receipt);
    const template = deliveryTemplate(book,binding,receipt.categoryId);
    const selection = nurtureDecision.directDeliveryTarget || direct?.directDeliveryTarget;
    const type = selection ? {} : pendingDeliveryType(direct || deliveryTypeEvidence(nurtureDecision.deliveryGate));
    const policy = selection ? directDeliveryPolicy(context,receipt,template,selection) : deliveryPolicy(context,template,type.type);
    if (policy.error) return {...binding,...type,outcome:'unknown',status:policy.error};
    const automatic = automaticDelivery(policy);
    return {...binding,templateName:binding.templateName || template.name,outcome:automatic ? 'automatic' : 'pending',
      ...type,trigger:automatic ? 'automatic' : 'manual',
      ...(!policy.legacy ? {auditEnabled:policy.auditEnabled,
        ...(policy.targetType ? {targetType:policy.targetType} : {target:{...policy.target}})} : {}),
      ...(policy.directStore ? {stores:[policy.directStore],
        ...(selection.fields?.length ? {mappedFields:deliveryMappedFields(template,receipt.mapped || {},policy)} : {})} : {}),
      status:automatic ? '预计按配置目标自动下发（模拟）' : policy.targetType === 'internalTenant' ?
        '预计待下发，由负责坐席核对匹配的接收租户' + (policy.auditEnabled ? '并提请管理员审核' : '') :
        policy.auditEnabled ? '预计待下发，由负责坐席提交管理员审核' : '预计待下发，由负责坐席确认',
      ...(policy.mode ? {configuredMode:policy.mode} : {}),
      ...(!automatic ? {modes:settings.deliveryModes.filter(item => item.value === (policy.mode || 'oneToOne'))} : {})};
  }

  function plannedColdTransfer(book, context, receipt, nurtureDecision) {
    if (nurtureDecision.outcome !== 'matched' || nurtureDecision.action !== '转冷线索') return null;
    if (validColdDelay(nurtureDecision.coldWindowDays)) return {
      status:'预计等待 ' + nurtureDecision.coldWindowDays + ' 天后触发下一轮冷线索培育',
      targetRuleId:nurtureDecision.coldRuleId
    };
    if (nurtureDecision.event === '接入后') {
      const transfer = receipt.coldTransfer;
      return transfer ? {status:'预计转入冷线索分配规则 · ' + transfer.result,
        targetRuleId:transfer.targetRuleId,targetRuleName:transfer.targetRuleName,targetRuleVersion:transfer.targetRuleVersion} :
        {status:receipt.reason + ' 原培育任务预计转待处理。',targetRuleId:nurtureDecision.coldRuleId};
    }
    const target = settings.coldRule(book,nurtureDecision.coldRuleId);
    return assignmentRuleInScope(target,context) ?
      {status:'预计转入冷线索分配规则',targetRuleId:target.id,targetRuleName:target.name,targetRuleVersion:target.version} :
      {status:'冷线索分配规则暂不可用，预计转待处理',targetRuleId:nurtureDecision.coldRuleId};
  }

  function previewNurture(book, context, receipt, currentTemplate, original, event, {previousFacts,roundFacts,strategyParentId,existing}) {
    const template = original ?
      settings.version(book,'nurtureTemplates',original.nurtureTemplateId,original.nurtureTemplateVersion) : currentTemplate;
    const source = original ? {
      id:original.nurtureTemplateId, name:original.nurtureTemplateName, version:original.nurtureTemplateVersion
    } : template;
    const templateEvidence = {templateId:source?.id, templateName:source?.name, templateVersion:source?.version};
    if (original && event === '接入后') {
      return {...nurtureDecision(event,'retained',[],null,receipt.nurtureAction),...templateEvidence,
        ...(original.strategyPath ? {strategyPath:original.strategyPath} : {})};
    }
    if (!template) {
      return {...nurtureDecision(event,original ? 'unavailable' : 'notApplicable'),...templateEvidence};
    }
    const facts = withPreRating(context,factsFor(receipt),existing || receipt);
    const delivery = deliveryTemplate(book,deliveryBinding(original || receipt),receipt.categoryId);
    if (event === '接入后') return {...firstPlan(template,facts,delivery),...templateEvidence};

    const strategyRound = template.strategyTree === true;
    const parentId = strategyRound
      ? (existing ? original?.strategyNodeId : strategyParentId || receipt.strategyNodeId) : undefined;
    const parent = strategyPathFor(template.rules,parentId)?.at(-1);
    const callMethod = original?.callMethod || nurtureMethod(parent ? nurtureAction(parent) : receipt.nurtureAction);
    const sourceFacts = event === roundCompleteEvent ? roundFacts : previousFacts;
    facts.deliveryFollowup = {details:sourceFacts?.details,options:sourceFacts?.options,
      note:sourceFacts?.note,nextAt:sourceFacts?.nextAt,completedAt:sourceFacts?.completedAt};
    const previous = {
      result:clean(sourceFacts?.result),callStatus:clean(sourceFacts?.callStatus),
      intentLevel:clean(sourceFacts?.intentLevel),callMethod,
      tags:callMethod && callMethod !== '企微培育' ? normalizedCallTags(sourceFacts?.tags) : undefined
    };
    const defaultNumber = strategyRound && !existing ? strategyPathFor(template.rules,parentId)?.length : original?.roundNumber;
    const number = Number(defaultNumber ?? 1);
    const round = {result:previous.result,callStatus:previous.callStatus,intentLevel:previous.intentLevel,callMethod,
      ...(callMethod==='AI 外呼' ? {aiSupplierId:clean(sourceFacts?.aiSupplierId),aiTags:normalizedCallTags(sourceFacts?.tags),
        aiCallStatus:clean(sourceFacts?.callStatus),aiDurationSeconds:settings.durationSeconds(sourceFacts?.durationSeconds)} : {}),
      number:Number.isInteger(number) && number > 0 ? number : undefined,
      leadStatus:clean(roundFacts?.leadStatus) || clean(facts.leadStatus)};
    if (strategyRound) {
      if (event !== roundCompleteEvent) {
        return {...nurtureDecision(event,'notApplicable'),status:'树形策略使用「本轮培育完成」事件。',...templateEvidence};
      }
      if (!parentId) {
        return {...nurtureDecision(event,'notApplicable'),status:'请选择已执行的父策略后试跑。',...templateEvidence};
      }
      return {...planFor(template,event,{...facts,previous,round},{strategyParentId:parentId,delivery}),...templateEvidence};
    }
    if (event === roundCompleteEvent && !template.roundFlow && !template.rules.some(rule => rule.event === roundCompleteEvent)) {
      const decision = planFor(template,'回访完成',{...facts,previous,round},{delivery});
      if (decision.outcome !== 'notMatched') return {...decision,...templateEvidence};
      return {...nurtureDecision(event,'notApplicable'),deliveryGate:decision.deliveryGate,
        status:'旧模板本轮无后续规则命中，按回访结果办理',...templateEvidence};
    }
    return {...planFor(template,event,{...facts,previous,round},{delivery}),...templateEvidence};
  }

  function previewNumberAnchor(receipt,cleaning,sameNumberCase) {
    if (!cleaning || sameNumberCase === 'new') return [];
    const input = cleaningInputs(receipt);
    if (!input.phone || !Number.isFinite(input.time)) return [];
    const window = cleaning.sameNumber.windowMinutes;
    const minutes = sameNumberCase === 'expired' ? window : Math.floor(window / 2);
    const leadAt = new Date(input.time + (480 - minutes) * 60_000).toISOString().slice(0,16);
    return [{
      id:'试跑窗口起点',tenant:receipt.tenant,brandId:receipt.brandId,categoryId:receipt.categoryId,
      assignmentRuleId:receipt.assignmentRuleId,mapped:{phone:input.phone,leadAt},taskRelation:'新建培育任务',
      sameNumber:{isAnchor:true}
    }];
  }

  function preview(state, context, options = {}) {
    const current = trialContext(state,context);
    if (!current) return {error:'当前账号没有本租户的配置试跑权限。'};
    const {book = settings.read(state),ruleId,sampleId,existingTaskId,sameNumberCase = 'new',inTransitCase = 'none',
      nurtureEvent = '接入后',previousFacts,roundFacts,strategyParentId} = options;
    if (!book || !['rules','nurtureTemplates','deliveryTemplates'].every(kind => Array.isArray(book[kind]))) {
      return {error:'当前配置不可读取，请核对流程草稿。'};
    }
    const rule = settings.ruleById(book,ruleId);
    const businessType = rule && settings.businessType(current,rule.categoryId);
    if (!assignmentRuleInScope(rule,current) || !businessType) return {error:'请选择当前二级分类的可用分配规则。'};
    const sample = config.samples.find(item => item.id === sampleId);
    if (!sample) return {error:'请选择模拟来件样例。'};
    if (!settings.events.includes(nurtureEvent) && !followupEvents.has(nurtureEvent)) return {error:'请选择可用的培育判断事件。'};
    if (rule.cleaning && !['new','within','expired'].includes(sameNumberCase)) return {error:'请选择可用的同号试跑情形。'};
    if (!['none','sameSource','otherSource'].includes(inTransitCase)) return {error:'请选择可用的在途任务试跑情形。'};
    const existing = existingTaskId ?
      eligibleTrialTasks(state,current,businessType.value).find(item => item.taskId === existingTaskId) : undefined;
    if (existingTaskId && !existing) return {error:'请选择当前二级分类可用的在途任务。'};

    const scratch = {tenant:state.tenant,records:[],assignmentPreviewState:state};
    const source = sources.find(item => item.value === existing?.sourceApplicationId);
    const receipt = makeReceipt(scratch,current,sample.input,'试跑',[],businessType,source);
    Object.assign(receipt,assignmentRuleBinding(rule));
    scratch.skynetReceipts = [receipt,...previewNumberAnchor(receipt,rule.cleaning,sameNumberCase)];
    const inTransit = inTransitCase === 'none' && existing ? 'sameSource' : inTransitCase;
    const destination = rule.cleaning?.nurtureTemplateId || rule.nodes?.find(node => node.id === 'template')?.branches?.matched?.nurtureTemplateId;
    const original = existing ? frozenBinding(existing,book,state,current) : inTransit === 'none' ? null : {
      taskId:'试跑原任务',roundId:'试跑原轮次',roundNumber:1,
      ...resolveTaskBinding(book,rule,destination,businessType.value)?.binding
    };
    if (inTransit !== 'none') {
      const action = existing?.skynet.action || '人工外呼';
      scratch.records.push({
        id:original.taskId, taskId:original.taskId, taskStatus:existing?.taskStatus || '待办理',
        requiredMode:existing?.requiredMode || action, tenant:receipt.tenant, brandId:receipt.brandId,
        categoryId:businessType.value, phone:receipt.values.phone,
        sourceApplicationId:receipt.sourceApplicationId, originalKey:inTransit === 'sameSource' ? receipt.originalKey : receipt.originalKey + '-其他',
        skynet:{...original,action,
          ...(existing?.skynet.processing ? {processing:{...existing.skynet.processing}} : {})}
      });
    }
    processRule(scratch,current,receipt,book,rule);

    const nurture = receipt.matchedTemplateId && settings.current(book,'nurtureTemplates',receipt.matchedTemplateId);
    const delivery = receipt.matchedDeliveryTemplateId && settings.current(book,'deliveryTemplates',receipt.matchedDeliveryTemplateId);
    const binding = nurture && delivery ? templateBinding(rule,nurture,delivery) : null;
    if (receipt.taskRelation === '新建培育任务') {
      delete receipt.taskId;
      delete receipt.recordId;
      delete receipt.roundId;
      if (receipt.deliveryPlan) {
        delete receipt.deliveryPlan.taskId;
        delete receipt.deliveryPlan.roundId;
      }
      const facts = (receipt.trace.find(node => node.nodeId === 'nurtureTask') || receipt.trace.at(-1))?.actual;
      if (facts && typeof facts === 'object') {
        facts['培育任务'] = '预计新建';
        facts['关联轮次'] = '首轮';
      }
      if (receipt.sameNumber?.isAnchor) {
        receipt.sameNumber.anchorReceiptId = '本次样例';
        receipt.trace.find(node => node.nodeId === 'sameNumber').evidence['本次开启窗口'] = '本次样例';
      }
    }
    const originalBinding = receipt.taskRelation === '接续在途任务' ? original : null;
    const nurtureDecision = previewNurture(book,current,receipt,nurture,originalBinding,nurtureEvent,
      {previousFacts,roundFacts,strategyParentId,existing:originalBinding && existing});
    if (nurtureDecision.targetTaskId !== undefined) {
      const processing = processingFor(nurtureDecision,current);
      nurtureDecision.targetTaskName = processing.targetTaskName;
      nurtureDecision.targetTaskType = processing.targetTaskType;
      if (processing.waitingForTarget) nurtureDecision.targetUnavailableReason = processing.targetUnavailableReason;
    }
    return {
      receipt, route:receipt.trace.map(({nodeId,branch}) => ({nodeId,branch})), binding,
      originalBinding,nurtureDecision,delivery:plannedDelivery(book,current,receipt,nurtureDecision),
      coldTransfer:plannedColdTransfer(book,current,receipt,nurtureDecision)
    };
  }

  window.DSkynetIntake = Object.freeze({
    isTask, isRetiredContact:retiredContact, inScope, canRead, canSubmit,
    hasWorkbenchSamples, usesLocalPredictiveSample, stageWorkbenchSamples, generateAssignmentSamples,
    canStageWorkbenchDeliverySamples,stageWorkbenchDeliverySamples,
    configuration:context => canRead(context) || canSubmit(context) ? config : null,
    sourceOptions:context => canRead(context) || canSubmit(context) ? sources : [],
    start, process, handoffOptions,stageHandoffTask,previewTasks, preview, fieldsForRule, reserveSkynetSequences,
    canonicalOption, multiselectValues, validateImportValues,
    roundDecision(state,context,task,input = {}) {
      const plan = roundDecision(settings.read(state),state,context,task,input);
      return plan?.legacyFallback ? null : plan;
    },
    followupDecision(state,context,task,input = {}) {
      const plan = followupDecision(settings.read(state),state,context,task,input);
      return plan?.outcome === 'notMatched' ? null : plan;
    },
    nurtureMethod,roundSupplementFields,supplementRound,
    completeRound,completeFollowup,applyPredictiveResult,tickColdNurture:(state,context)=>tickColdNurture(state,context),deliveryState,canDispatchDelivery,deliveryTargetWarning,
    wecomAssignmentState,wecomSeatEligibility,assignWecomSeat,wecomWorkbenchState,simulateWecomAction,
    workbenchNativeLeads,deliveryTargets,deliveryReceiverOptions,internalDeliveryMatch,confirmIntentStore,previewDelivery,dispatchDelivery,
    deliveryReviewRequired,deliveryReviewQueue,reviewDelivery,generateDeliveryReviewSamples
  });
})();
