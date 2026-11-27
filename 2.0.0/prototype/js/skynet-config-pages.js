(() => {
  'use strict';

  const catalog = window.DSkynetConfig;
  const e = DUI.esc;
  const category = window.DSkynetIntakeFixtures;
  const pages = [
    {id:'PAGE-21011', name:'分配规则', kind:'rules'},
    {id:'PAGE-21012', menuName:'培育策略', name:'培育模板', kind:'nurtureTemplates'},
    {id:'PAGE-21013', menuName:'下发配置', name:'下发模板', kind:'deliveryTemplates'}
  ];
  const pageIds = new Set(pages.map(page => page.id));
  const ruleLogic = [
    {value:'and',label:'与 · 全部满足'},
    {value:'or',label:'或 · 任一满足'},
    {value:'not',label:'非 · 对整组的「与」结果取反'}
  ];
  const branchLabels = {
    fields:{valid:'校验通过',invalid:'校验失败'},
    localHistory:{matched:'命中',unmatched:'未命中',noHistory:'无历史',missing:'缺少判定数据'},
    externalHistory:{found:'查到记录',empty:'查无记录',unconnected:'未接入',failed:'查询失败'},
    template:{matched:'满足关联条件',unmatched:'未满足关联条件'}
  };
  const branchDestinations = {'结束':'来件已结束','过滤':'来件已过滤','转待处理':'来件待处理','保留待匹配':'来件待匹配'};
  const eventLabels = {'接入后':'接入后（线索完成分配）','回访完成':'回访完成（本轮回访记录完成）',
    '当前轮完成':'当前轮完成（达到轮次完成条件）'};
  const nurtureDestinations = {
    '人工外呼':'进入本租户待分配，由管理员指定坐席',
    '进入下发判断':'按绑定下发模板的审核设置办理',
    '转冷线索':'转入所选冷线索分配规则，成功后结束原任务',
    '结束培育':'任务已结束',
    '转待处理':'进入待处理，等待明确后续动作',
    '不经培育直接下发':'按直发对象和来件意向门店办理',
    '继续':'继续判断后续动作'
  };
  const establishedTaskDestinations = {
    'AI 外呼':'记录为待AI外呼，进入 AI 外呼待办',
    '预外呼':'记录为待预外呼，进入预外呼待办',
    '企微培育':'记录为待企微培育，进入企微培育待办',
    '不经培育直接下发':'按直发对象和来件意向门店办理'
  };
  const filterHelp = {
    leastLoad:'保留当前负载最少的全部坐席。',
    leastDaily:'保留当日接待量最少的全部坐席。',
    highestScore:'在有评分的剩余坐席中，保留最高分的全部坐席。',
    random:'在其他条件筛选后的剩余坐席中，等概率随机选一人。此项固定在最后执行。'
  };
  const pathData = path => e(JSON.stringify(path));
  const identity = context => JSON.stringify([
    context?.account?.id, context?.scope?.id, context?.scope?.tenant?.brandId
  ]);
  const pathValue = (draft, path) => path.reduce((value, key) => value?.[key], draft);
  const setPath = (draft, path, value) => {
    pathValue(draft, path.slice(0,-1))[path.at(-1)] = value;
  };
  const options = (items, selected) => items.map(item => {
    const {value,label,disabled} = typeof item === 'string' ? {value:item,label:item} : item;
    return '<option value="' + e(value) + '"' + (value === selected ? ' selected' : '') +
      (disabled ? ' disabled' : '') + '>' + e(label) + '</option>';
  }).join('');
  const emptyOption = label => ({value:'',label});
  const versionLabel = value => 'v' + (value ?? '—');
  const statusLabels = {enabled:'启用',disabled:'停用',draft:'草稿'};
  const configurationState = row => catalog.configurationStatus(row);
  const unavailableLabel = row => row?.deletedAt ? '已删除' : configurationState(row) === 'draft' ? '草稿，未启用' :
    configurationState(row) === 'disabled' ? '已停用' : '不可用';
  const boundValuePickerHosts = new WeakSet();
  const strategyTreeExpansions = new WeakMap();
  const strategyWorkspaceSelections = new WeakMap();
  const strategyWorkspaceBasicOpen = new WeakSet();
  const dateTime = new Intl.DateTimeFormat('zh-CN', {
    timeZone:'Asia/Shanghai', dateStyle:'short', timeStyle:'short', hour12:false
  });

  function input(path, value, label, settings = {}) {
    const {type = 'text', placeholder = '', max = 120, min = 1, name = path.at(-1), inputMode} = settings;
    const bounds = type === 'number' ? ' min="' + e(min) + '" max="' + e(max) + '"' : ' maxlength="' + e(max) + '"';
    return '<label class="sc-field"><span>' + e(label) + '</span><input type="' + e(type) + '" name="' + e(name) +
      '" data-config-path="' + pathData(path) + '" value="' + e(value) + '" placeholder="' + e(placeholder) + '"' +
      (inputMode ? ' inputmode="' + e(inputMode) + '"' : '') + bounds + '></label>';
  }

  function select(path, value, label, items, reactive = '', name = path.at(-1), source = '') {
    const caption = source ? '<span class="sc-field-caption">' + e(label) +
      '<small class="sc-source-badge" data-config-condition-source>' + e(source) + '</small></span>' : '<span>' + e(label) + '</span>';
    return '<label class="sc-field">' + caption + '<select name="' + e(name) + '" data-config-path="' +
      pathData(path) + '"' + (reactive ? ' data-config-reactive="' + e(reactive) + '"' : '') + '>' + options(items,value) + '</select></label>';
  }

  function control(label, operation, path, index, disabled = false, aria = label) {
    return '<button type="button" class="btn btn-sm" data-config-operation="' + e(operation) + '" data-config-array="' +
      pathData(path) + '"' + (index == null ? '' : ' data-config-index="' + e(index) + '"') +
      ' aria-label="' + e(aria) + '"' + (disabled ? ' disabled' : '') + '>' + e(label) + '</button>';
  }

  function orderedControls(path, index, count, label, first = 0, removable = true) {
    return '<div class="sc-row-actions">' +
      control('上移','up',path,index,index <= first,'上移' + label) +
      control('下移','down',path,index,index >= count - 1,'下移' + label) +
      (removable ? control('移除','remove',path,index,false,'移除' + label) : '') + '</div>';
  }

  function adjacentNurtureRule(rules,index,direction) {
    const event = rules[index]?.event;
    for (let other = index + direction; other >= 0 && other < rules.length; other += direction) {
      if (rules[other].event === event) return other;
    }
    return -1;
  }

  function canRemoveNurtureRule(rules,index) {
    return rules.length > 1 && (index > 0 || adjacentNurtureRule(rules,index,1) >= 0);
  }

  function priorityRow(path,index,mode) {
    return ' data-config-priority-row="' + mode + '" data-config-priority-path="' + pathData(path) +
      '" data-config-priority-index="' + index + '"';
  }

  function priorityHandle() {
    return '<span class="sc-priority-handle" draggable="true" data-config-priority-handle title="拖动调整优先级"' +
      ' aria-hidden="true">⠿</span>';
  }

  function priorityControls(rules,index) {
    const label = '规则 ' + (index + 1);
    return '<div class="sc-row-actions">' +
      control('上移','up',['rules'],index,adjacentNurtureRule(rules,index,-1)<0,'上移' + label + '优先级') +
      control('下移','down',['rules'],index,adjacentNurtureRule(rules,index,1)<0,'下移' + label + '优先级') +
      (rules.length > 1 ? control('移除','remove',['rules'],index,!canRemoveNurtureRule(rules,index),'移除' + label) : '') + '</div>';
  }

  function storedConfiguration(book,kind,id) {
    return id ? catalog.current(book,kind,id) || book[kind]?.findLast(item => item.id === id) : undefined;
  }

  function templateOptions(book,kind,categoryId,selectedId) {
    const items = catalog.activeList(book,kind).filter(item => item.categoryId === categoryId)
      .map(item => ({value:item.id,label:item.name}));
    if (selectedId && !selectedId.startsWith('draft:') && !items.some(item => item.value === selectedId)) {
      const saved = storedConfiguration(book,kind,selectedId);
      const suffix = unavailableLabel(saved);
      items.push({value:selectedId,label:(saved?.name || selectedId) + '（' + suffix + '）',disabled:true});
    }
    return items;
  }

  function typeLabel(item, types) {
    return types.find(type => type.value === item.categoryId)?.label || item.categoryName ||
      (item.categoryId === category.categoryId ? category.category : item.categoryId);
  }

  function conditionFields(purpose,context,categoryId,previousMethod,previousTargetId) {
    if (purpose === 'intake') return catalog.intakeFieldProfile(context,categoryId).fields;
    if (purpose === 'allocation') return [...catalog.leadFields,...catalog.historyFields];
    if (purpose === 'strategy-entry' || purpose === 'strategy-round') {
      return catalog.strategyConditionFields(purpose === 'strategy-entry' ? '接入后' : catalog.roundCompleteEvent,
        context,categoryId,previousMethod,previousTargetId)
        .filter(field => !field.legacy);
    }
    if (purpose === 'round') {
      return catalog.strategyConditionFields(catalog.roundCompleteEvent,context,categoryId)
        .filter(field => !field.legacy && field !== catalog.unlimitedStrategyField);
    }
    return catalog.nurtureConditionFields('接入后',context,categoryId).filter(field => !field.legacy);
  }

  function previousConditionSource(view,purpose,path) {
    const parent = purpose === 'strategy-round' && path.length > 3 ? pathValue(view.draft,path.slice(0,-3)) : null;
    const previousMethod = view.strategyPreviousMethod ?? parent?.actions?.find(action => action !== '继续');
    const previousTargetId = view.strategyPreviousTargetId ?? parent?.[catalog.outboundFields[previousMethod]?.id];
    return {previousMethod,previousTargetId};
  }

  function fieldsForConditionPath(view,purpose,path) {
    const {previousMethod,previousTargetId} = previousConditionSource(view,purpose,path);
    return conditionFields(purpose,view.context,view.draft.categoryId,previousMethod,previousTargetId);
  }

  function strategyConditionProfile(view,path) {
    const {previousMethod,previousTargetId} = previousConditionSource(view,'strategy-round',path);
    return catalog.strategyConditionProfile?.(view.context,previousMethod,previousTargetId);
  }

  function strategyConditionSourceNote(view,path) {
    const profile = strategyConditionProfile(view,path);
    const pathAttribute = ' data-config-strategy-condition-profile="' + pathData(path) + '"';
    if (!profile || profile.status === 'none') {
      const {previousTargetId} = previousConditionSource(view,'strategy-round',path);
      return previousTargetId ? '<span hidden'+pathAttribute+'></span>' : '';
    }
    const title = profile.taskName ? '上一轮任务「' + profile.taskName + '」' : '上一轮外呼任务';
    const messages = {
      ready:'条件选项来自' + title + '，判定时读取该轮结果。',
      partial:title + '的部分条件选项暂未提供。',
      unavailable:title + '的条件选项暂不可用。'
    };
    return '<p class="sc-note" role="status"'+pathAttribute+' data-config-task-condition-status="' + e(profile.status) + '">' +
      e((messages[profile.status] || '') + (profile.reason ? ' ' + profile.reason : '')) + '</p>';
  }

  function fieldOperators(field) {
    if (field?.key === catalog.preRatingField?.key && catalog.preRatingField) {
      return catalog.preRatingOperators;
    }
    const keys = ['date','datetime-local'].includes(field?.type) ? ['before','after','equal','notEqual'] :
      field?.options?.length || field?.type === 'number' ? ['equal','notEqual'] : ['equal','notEqual','contains'];
    return catalog.operators.filter(operator => operator.unary || keys.includes(operator.value));
  }

  function unaryOperator(value) {
    return catalog.operators.find(operator => operator.value === value)?.unary === true;
  }

  function includeStoredOption(items,value,label) {
    if (!value || items.some(item => item.value === value)) return items;
    return [{value,label:(label || value) + '（原配置）'},...items];
  }

  function conditionSource(field,purpose) {
    if (field === catalog.preRatingField?.key && catalog.preRatingField) return '外部预评分接口';
    const [scope, key] = (field || '').split('.');
    const call = ['callStatus','tags'].includes(key);
    if (scope === 'previous') return call ? '上一轮对应话单' : '上一轮回访';
    if (scope === 'history') return call ? '本系统历史话单' : '本系统历史回访';
    if (scope === 'round' && (purpose === 'strategy-round' || purpose === 'round')) {
      return call ? '上一轮对应话单' : '上一轮培育结果';
    }
    if (scope === 'round') return '本轮培育结果';
    if (scope === 'end') return key === 'finishReason' ? '任务结束原因' : call ? '结束轮对应话单' : '结束轮回访';
    return '本次天网来件';
  }

  function standardValue(optionItems,value) {
    return optionItems.find(item => item.value === value || item.aliases?.includes(value))?.value || value;
  }

  function valuePickerText(labels) {
    return labels.join('、') || '请选择';
  }

  function standardValuesPicker(path,items,value) {
    const values = Array.isArray(value) ? value : value === '' || value == null ? [] : [value];
    const selected = new Set(values.map(item => standardValue(items,item)));
    const choiceItems = [...selected].reduce((options,item) => includeStoredOption(options,item),items);
    const labels = choiceItems.filter(item => selected.has(item.value)).map(item => item.label);
    const summary = valuePickerText(labels);
    return '<div class="sc-field"><span>标准值</span><details class="sc-multivalue" data-config-multivalue' +
      (labels.length ? ' data-config-has-values' : '') + '>' +
      '<summary data-config-multivalue-trigger aria-label="' + e('标准值 ' + summary) + '">' +
      '<span data-config-multivalue-summary title="' + e(summary) + '">' + e(summary) + '</span>' +
      '<small data-config-multivalue-count aria-hidden="true"' + (labels.length > 1 ? '' : ' hidden') +
      '>' + e(labels.length + ' 项') + '</small></summary><div class="sc-multivalue-options" role="group" aria-label="可选标准值">' +
      choiceItems.map(item => '<label class="sc-multivalue-option"><input type="checkbox" name="value" data-config-standard-option' +
        ' data-config-values="' + pathData(path) + '" value="' + e(item.value) + '"' +
        (selected.has(item.value) ? ' checked' : '') + '><span>' + e(item.label) + '</span></label>').join('') +
      '</div></details></div>';
  }

  function conditionValueField(path,field,value,multi) {
    if (Array.isArray(field?.options)) {
      if (field.customCondition && !field.options.length) return '<p class="sc-note" role="status">此自定义字段暂无启用选项，请先在字段配置中维护。</p>';
      if (multi) return standardValuesPicker(path,field.options,value);
      const selected = standardValue(field.options,value);
      return select(path,selected,'标准值',[emptyOption('请选择'),...includeStoredOption(field.options,selected)]);
    }
    const settings = {
      type:['date','datetime-local'].includes(field?.type) ? field.type : 'text',
      inputMode:field?.type === 'number' ? 'decimal' : undefined,name:'value'
    };
    if (!multi) return input(path,value,'比较值',settings);
    const values = Array.isArray(value) && value.length ? value : [value || ''];
    const firstPath = Array.isArray(value) && value.length ? [...path,0] : path;
    return '<div class="sc-typed-values" role="group" aria-label="比较值">' +
      values.map((item,index) => '<div class="sc-typed-value">' +
        input(index ? [...path,index] : firstPath,item,index ? '比较值 ' + (index+1) : '比较值',settings) +
        (values.length > 1 ? control('移除','condition-value-remove',path,index,false,'移除比较值 ' + (index+1)) : '') +
        '</div>').join('') +
      control('+ 添加值','condition-value-add',path,undefined,false,'添加比较值') + '</div>';
  }

  function preRatingConditionStatus(context,categoryId) {
    const access = catalog.preRatingStatus(context,categoryId);
    const messages = {
      connected:'预评分应用已接入' + (access.application?.name ? ' · ' + access.application.name : ''),
      unconnected:'预评分应用未接入',
      unavailable:'暂时无法核对预评分应用'
    };
    const hint = access.status === 'connected' ? '' : access.message || '请在「应用接入」核对当前租户的预评分系统。';
    return '<p class="sc-note" role="status" data-config-pre-rating-status="' + e(access.status) + '">' +
      e((messages[access.status] || messages.unavailable) + (hint ? '。' + hint : '')) + '</p>';
  }

  function conditions(values, path, purpose, emptyText, fields = conditionFields(purpose), addLabel = '添加条件', context, categoryId, {coldCallback = false} = {}) {
    const fieldOptions = fields.map(item => ({value:item.key,label:item.label}));
    const allowMultiple = ['intake','strategy-entry','strategy-round','nurture','round'].includes(purpose);
    return '<div class="sc-condition-list" data-config-conditions="' + e(purpose) + '">' +
      (!values.length && emptyText ? '<p class="sc-note">' + e(emptyText) + '</p>' : '') +
      (allowMultiple && values.some(condition => condition.field !== catalog.unlimitedStrategyField.key && !unaryOperator(condition.operator)) ?
        '<p class="sc-note">同一条件填写多个值时，命中任一值即满足；选「不等于」时，所有值均不命中才满足。</p>' : '') +
      values.map((condition,index) => {
        const row = [...path,index];
        const field = fields.find(item => item.key === condition.field) || catalog.fields.find(item => item.key === condition.field);
        if (field?.legacy) {
          const comparison = catalog.operators.find(item => item.value === condition.operator)?.label || condition.operator;
          return '<div class="sc-condition-row" data-config-unary><div class="sc-field"><span>' +
            e(field.label) + '（历史条件）</span><p class="sc-value">' +
            e([comparison,condition.value].filter(Boolean).join(' ')) + '</p></div>' +
            '<p class="sc-note">按任务实际轮次判断。</p>' +
            control('移除','remove',path,index,false,'移除条件 ' + (index + 1)) + '</div>';
        }
        const unlimited = field === catalog.unlimitedStrategyField;
        const unary = unlimited || unaryOperator(condition.operator);
        const multi = !unary && Boolean(field) && allowMultiple;
        const preRating = catalog.preRatingField && condition.field === catalog.preRatingField.key;
        const requiresReselection = (field?.taskCondition || field?.customCondition || field?.sourceFieldId && Array.isArray(field.options)) && !unary &&
          (Array.isArray(condition.value) ? condition.value : [condition.value]).some(value => value &&
            !field.options.some(option=>option.value===standardValue(field.options,value)));
        const source = unlimited ? '' : purpose === 'intake' ? '本次天网来件' : conditionSource(condition.field,purpose);
        const callbackEligible = coldCallback && ['round.result','previous.result'].includes(condition.field) && condition.operator==='equal';
        const callback = callbackEligible ? '<div class="sc-cold-callback" data-config-cold-callback' +
          (catalog.coldCallbackSelected(condition,field) ? '' : ' hidden') + '>' +
          input([...row,'coldCallbackMinDays'],condition.coldCallbackMinDays ?? '',
            '下次回访时间距本轮完成大于（天）',{type:'number',min:1,max:3650,placeholder:'请输入天数'}) +
          '<p class="sc-note">仅限制「下次回访」，严格大于所填天数（每 24 小时算 1 天）。</p></div>' : '';
        return '<div class="sc-condition-row"' + (unary ? ' data-config-unary' : multi ? ' data-config-multi-row' : '') + '>' +
          select([...row,'field'],condition.field,'条件字段',includeStoredOption(fieldOptions,condition.field,field?.label),'condition',
            'field',source) +
          (unlimited ? '<p class="sc-note">此行不参与筛选。</p>' :
            select([...row,'operator'],condition.operator,'比较方式',includeStoredOption(fieldOperators(field),condition.operator,
              catalog.operators.find(item => item.value === condition.operator)?.label),'condition-operator')) +
          (unary ? '' : conditionValueField([...row,'value'],field,condition.value,multi)) +
          control('移除','remove',path,index,false,'移除条件 ' + (index + 1)) + callback + '</div>' +
          (requiresReselection ? '<p class="sc-note" role="status">原配置值不在当前可选项中，请重新选择。</p>' : '') +
          (preRating ? preRatingConditionStatus(context,categoryId) : '');
      }).join('') +
      '<div class="sc-inline-tools">' +
      control(purpose === 'intake' ? '添加判断条件' : addLabel,'condition-' + purpose,path,null,!fields.length) + '</div></div>';
  }

  function matchingDictionaries(node, path) {
    return ['dealer','series','channel'].map(key => {
      const field = catalog.fields.find(item => item.key === key);
      if (!field?.options?.length) return '';
      return '<fieldset class="sc-values"><legend>' + e(field.label) + '</legend>' +
        field.options.map(option => '<label><input type="checkbox" data-config-values="' + pathData([...path,'match',key]) +
          '" value="' + e(option.value) + '"' + ((node.match?.[key] || []).includes(option.value) ? ' checked' : '') +
          '> ' + e(option.label) + '</label>').join('') + '</fieldset>';
    }).join('');
  }

  function historyCriteria(node, path) {
    const history = (key) => catalog.historyFields.find(field => field.key === 'history.' + key).options;
    return '<div class="sc-grid sc-local-history">' +
      input([...path,'days'],node.days,'历史查询天数',{type:'number',max:365}) +
      input([...path,'match','visitResult'],node.match?.visitResult,'回访结果') +
      select([...path,'match','callStatus'],node.match?.callStatus || '','通话状态',[emptyOption('不限'),...history('callStatus')]) +
      select([...path,'match','intentLevel'],node.match?.intentLevel || '','意向等级',[emptyOption('不限'),...history('intentLevel')]) + '</div>';
  }

  function intakeCriteria(node,path,profile) {
    return '<div class="sc-editor-heading"><h4>判断条件</h4><span class="sc-note">全部满足</span></div>' +
      (profile.sourceLabel ? '<p class="sc-note" data-config-intake-field-source>基础字段校验读取' +
        e(profile.sourceLabel) + '。</p>' : '') +
      conditions(node.checks || [],[...path,'checks'],'intake','',profile.fields);
  }

  function externalHistoryCriteria(node,path) {
    const query = {...catalog.defaultExternalQuery,...node.externalQuery};
    return '<div class="sc-grid">' +
      select([...path,'externalQuery','sourceId'],query.sourceId,'关联历史数据源',
        [emptyOption('未关联'),...catalog.historySources],'external-query') +
      select([...path,'externalQuery','lookupField'],query.lookupField,'查询取值 · 本次天网来件',
        catalog.historyLookupFields,'external-query') + '</div>' +
      '<p class="sc-node-source">' + (query.sourceId ? '<span class="sc-source-badge">模拟响应</span>由选中的外部历史数据源返回。' :
        '未关联数据源时跳至「未接入」分支。') + '</p>';
  }

  function nodeCriteria(node,path,context,categoryId) {
    if (node.id === 'fields') return intakeCriteria(node,path,catalog.intakeFieldProfile(context,categoryId));
    if (node.id === 'localHistory') {
      return '<p class="sc-node-source"><span class="sc-source-badge">本系统历史</span>' +
        '按本次来件的来源线索编号或手机号查找历史回访及对应话单。</p>' + historyCriteria(node,path);
    }
    if (node.id === 'externalHistory') return externalHistoryCriteria(node,path);
    return '<p class="sc-node-source"><span class="sc-source-badge">本次天网来件</span>所选字典字段及附加条件均须满足。</p>' +
      '<div class="sc-dictionaries">' + matchingDictionaries(node,path) + '</div>' +
      conditions(node.conditions || [],[...path,'conditions'],'allocation','可追加来件字段或本系统历史条件。');
  }

  function branchDestination(value,to,next,book,categoryId) {
    if (value.action === '继续' && next.length) {
      return select([...to,'next'],value.next || '','下一节点',
        [emptyOption('按顺序进入 ' + next[0].label),...next]);
    }
    if (value.action === '送入培育模板') {
      return select([...to,'nurtureTemplateId'],value.nurtureTemplateId || '','目标培育模板',
        [emptyOption('请选择'),...templateOptions(book,'nurtureTemplates',categoryId,value.nurtureTemplateId)]);
    }
    return '<div class="sc-field"><span>下一去向</span><strong class="sc-destination" data-config-branch-destination>' +
      e(value.action === '继续' ? '来件待匹配' : branchDestinations[value.action] || '请选择处理动作') + '</strong></div>';
  }

  function ruleNodes(draft, book, context) {
    return draft.nodes.map((node,index) => {
      const path = ['nodes',index];
      const next = draft.nodes.slice(index + 1).map(item => ({value:item.id,label:item.label}));
      const branch = Object.entries(node.branches).map(([key,value]) => {
        const to = [...path,'branches',key];
        const actions = key === 'invalid' ? catalog.branchActions.filter(action => !['继续','送入培育模板'].includes(action)) : catalog.branchActions;
        return '<div class="sc-branch" data-config-branch="' + e(key) + '" tabindex="-1"><strong>' +
          e(branchLabels[node.id]?.[key] || key) + '</strong>' +
          select([...to,'action'],value.action,'处理动作',actions,'branch') +
          branchDestination(value,to,next,book,draft.categoryId) + '</div>';
      }).join('');
      return '<section class="sc-block" data-config-node="' + e(node.id) + '" tabindex="-1"><div class="sc-section-head"><h3>' + e(node.label) + '</h3>' +
        (index ? orderedControls(['nodes'],index,draft.nodes.length,node.label,1,false) : '') + '</div>' +
        nodeCriteria(node,path,context,draft.categoryId) + '<div class="sc-branches">' + branch + '</div></section>' +
        (node.id === 'fields' ? inTransitFilter(true,draft.inTransitFilter) : '');
    }).join('');
  }

  function scopeHeading(label,id,description) {
    return '<div class="sc-section-title"><h3>' + e(label) + '</h3><span class="sc-scope-help">' +
      '<button type="button" class="sc-scope-trigger" aria-label="' + e(label + '作用域') +
      '" aria-describedby="' + e(id) + '">?</button>' +
      '<span class="sc-scope-tip" id="' + e(id) + '" role="tooltip">' + e(description) + '</span></span></div>';
  }

  function inTransitFilter(legacy = false, configured, editable = true) {
    const enabled = configured !== false;
    const toggle = editable ? '<label class="sc-transit-toggle"><input type="checkbox" role="switch" name="inTransitFilter" ' +
      'data-config-path="' + pathData(['inTransitFilter']) + '"' + (enabled ? ' checked' : '') + '>' +
      '<span>过滤异源同号在途来件</span></label>' : '<span class="sc-source-badge">异源同号过滤' + (enabled ? '已开启' : '已关闭') + '</span>';
    return '<section class="sc-block" data-config-node="inTransit" tabindex="-1"><div class="sc-section-head">' +
      scopeHeading('在途任务过滤',editable ? 'skynet-transit-scope-tip' : 'skynet-transit-preview-scope-tip',
        '查询本租户、同品牌的在途任务，可跨二级分类和分配规则，待下发也算在途。开关只控制其他同号线索的过滤。同来源应用和线索编号唯一命中时，仍接续原任务。') +
      toggle + '</div><p class="sc-note">' + (legacy ? '字段校验通过后' : '流入规则允许继续后') +
      '查询当前租户的在途培育任务。</p>' +
      '<dl class="sc-in-transit">' +
      '<div><dt>同一来源线索编号</dt><dd>接续原培育任务，沿用原轮次和绑定模板。</dd></div>' +
      '<div><dt>手机号相同、来源线索不同</dt><dd>开启时仅记录并过滤。关闭时继续' +
      (legacy ? '执行清洗节点。' : '判断本规则的同号时间窗口。') + '</dd></div>' +
      '<div><dt>无在途任务</dt><dd>' + (legacy ? '继续执行本配置的清洗节点。' : '继续判断同号时间窗口。') + '</dd></div>' +
      '</dl></section>';
  }

  function cleaningFields(draft,context,book,inFlow) {
    const {cleaning,categoryId} = draft;
    const profile = catalog.intakeFieldProfile(context,categoryId);
    const reachesNurture = [cleaning.onMatch,cleaning.onMismatch].includes('sameNumber');
    const matchSummary = cleaning.sameNumber.matchAction === 'firstOnly' ? '窗口内其余同号码来件关联首条的培育任务。' :
      '窗口内同号码来件全部继续处理。';
    const nurture = !inFlow && reachesNurture ?
      '<div class="sc-grid">' + select(['cleaning','nurtureTemplateId'],cleaning.nurtureTemplateId,'进入的培育模板',
        [emptyOption('请选择'),...templateOptions(book,'nurtureTemplates',categoryId,cleaning.nurtureTemplateId)]) + '</div>' : '';
    return '<div data-config-cleaning>' +
      '<section class="sc-block" data-config-node="flow" tabindex="-1"><div class="sc-section-head">' +
      '<h3>流入规则配置</h3><span class="sc-note">读取本次来件</span></div>' +
      '<div class="sc-grid">' + select(['cleaning','logic'],cleaning.logic,'多条条件如何判定',ruleLogic.slice(0,2)) + '</div>' +
      conditions(cleaning.conditions,['cleaning','conditions'],'intake','没有设置判断条件时，来件默认命中。',profile.fields) +
      '<div class="sc-cleaning-outcomes"><div data-config-branch="matched">' +
      select(['cleaning','onMatch'],cleaning.onMatch,'满足条件时',catalog.cleaningRoutes,'cleaning-route') +
      '</div><div data-config-branch="unmatched">' +
      select(['cleaning','onMismatch'],cleaning.onMismatch,'未满足条件时',catalog.cleaningRoutes,'cleaning-route') + '</div></div></section>' +
      inTransitFilter(false,draft.inTransitFilter) +
      '<section class="sc-block" data-config-node="sameNumber" tabindex="-1"><div class="sc-section-head">' +
      scopeHeading('同号过滤配置','skynet-same-number-scope-tip',
        '在途过滤放行后，按本租户、同品牌、同二级分类和同一分配规则 ID 查同号。窗口从首笔建任务来件的留资时间起算，同一规则升级版本仍按原 ID 判断。') +
      '<span class="sc-note">按留资时间比较</span></div>' +
      '<div class="sc-grid">' +
      select(['cleaning','sameNumber','windowMinutes'],String(cleaning.sameNumber.windowMinutes),'留资时间窗口',catalog.sameNumberWindows) +
      select(['cleaning','sameNumber','matchAction'],cleaning.sameNumber.matchAction,'窗口内已有同号来件',
        catalog.sameNumberActions,'cleaning-action') +
      '</div><p class="sc-node-source">各分配规则独立计时，以本规则首条生成培育任务的来件留资时间为起点。' +
      e(matchSummary) + '窗口内无同号码来件时可继续处理。通过过滤的新来件建立培育任务，并使用绑定模板选择首轮策略。</p>' +
      nurture + '</section></div>';
  }

  function defaultManualAssignment() {
    return {filterSteps:[],scores:{}};
  }

  function convertManualAssignment(rule) {
    const previous = rule.manualAssignment;
    if (Array.isArray(previous?.filterSteps)) return;
    const filters = catalog.manualAssignmentFilters;
    let filterSteps = defaultManualAssignment().filterSteps;
    if (previous?.strategy === 'roundRobin') filterSteps = [];
    else if (filters.some(filter => filter.value === previous?.strategy)) filterSteps = [previous.strategy];
    rule.manualAssignment = {filterSteps,scores:{...previous?.scores}};
  }

  function manualSeatOptions(state) {
    return (state?.seats || []).filter(seat => seat.tenant === state.tenant && seat.enabled === true &&
      seat.bindingState === '已关联' && seat.accountId && seat.id)
      .map(seat => ({value:String(seat.id),label:seat.name || String(seat.id)}));
  }

  function manualFilters(steps,path) {
    const filters = catalog.manualAssignmentFilters;
    const mayAdd = !steps.includes('') && filters.some(filter => !steps.includes(filter.value));
    return '<div class="sc-editor-heading"><h4>筛选步骤</h4>' +
      control('添加筛选条件','manual-filter',path,null,!mayAdd) + '</div>' +
      (!steps.length ? '<p class="sc-note">无需额外筛选时，符合分配资格的坐席直接进入轮询。</p>' : '') +
      steps.map((step,index) => {
        const available = filters.filter(filter => filter.value === step || !steps.includes(filter.value));
        return '<div class="sc-manual-filter-row" data-config-manual-filter-row>' +
          select([...path,index],step,'第 ' + (index + 1) + ' 步',[emptyOption('请选择筛选条件'),...includeStoredOption(available,step)],
            'manual-filter-step','filterStep') +
          (step === 'random' ?
            '<div class="sc-row-actions">' + control('移除','remove',path,index,false,'移除随机分配') + '</div>' :
            orderedControls(path,index,steps.includes('random') ? steps.length - 1 : steps.length,'第 ' + (index + 1) + ' 步')) +
          (filterHelp[step] ? '<p class="sc-note">' + e(filterHelp[step]) + '</p>' : '') + '</div>';
      }).join('');
  }

  function manualScoreSource(config) {
    if (config?.strategy !== 'highestScore' && !config?.filterSteps?.includes('highestScore')) return '';
    return '<p class="sc-note sc-manual-score-source" data-config-seat-score-source>' +
      '此步骤使用「呼叫中心 → 坐席与排班 → 坐席评分」维护的分值。</p>';
  }

  function formerManualAssignment(config,seats) {
    if (!config?.strategy) return '<p class="sc-note">当前规则将任务送入待分配。</p>';
    const label = catalog.manualAssignmentStrategies.find(strategy => strategy.value === config.strategy)?.label || config.strategy;
    const priority = (config.prioritySeatIds || []).map(id => seats.find(seat => seat.value === id)?.label || id);
    return '<p class="sc-note">旧版分配规则 · ' + e(label) +
      (priority.length ? ' · 原优先顺序 ' + e(priority.join('、')) : '') + '</p>';
  }

  function manualAssignmentFields(rule,path,state,readOnly) {
    if (!rule.actions.includes('人工外呼')) return '';
    const config = rule.manualAssignment;
    const seats = manualSeatOptions(state);
    const assignmentPath = [...path,'manualAssignment'];
    const sequential = Array.isArray(config?.filterSteps);
    const content = sequential ?
      manualFilters(readOnly ? config.filterSteps.filter(step => step !== 'online') : config.filterSteps,
        [...assignmentPath,'filterSteps']) +
      manualScoreSource(config) +
      '<p class="sc-note sc-manual-allocation-outcome">筛选余下一名坐席时直接分配，多名时' +
      (config.filterSteps.includes('random') ? '随机分配' : '轮询') + '，零名时转待分配。</p>' :
      formerManualAssignment(config,seats) + manualScoreSource(config) + (readOnly ? '' : '<div class="sc-inline-tools">' +
        '<button type="button" class="btn btn-sm" data-config-convert-manual-filters="' + e(path.at(-1)) +
        '" data-config-manual-path="' + pathData(path) + '">改用逐级过滤</button></div>');
    return '<section class="sc-manual-assignment" data-config-manual-assignment="' + e(path.at(-1)) +
      '" data-config-manual-path="' + pathData(path) + '"><h4>人工外呼分配</h4>' +
      '<p class="sc-manual-title">跟进坐席分配规则</p>' +
      '<p class="sc-note" data-config-manual-online>仅从本租户已登录人工外呼的坐席中筛选。</p>' + content + '</section>';
  }

  function coldRuleField(rule,path,book,context) {
    if (!rule.actions.includes('转冷线索')) return '';
    const coldType = catalog.businessType(context,'lxs');
    const choices = coldType ? catalog.coldRules(book) : [];
    const options = choices.map(item => ({value:item.id,label:item.name + ' · ' + item.id + ' · ' + versionLabel(item.version)}));
    const saved = storedConfiguration(book,'rules',rule.coldRuleId);
    if (rule.coldRuleId && !options.some(item => item.value === rule.coldRuleId)) {
      const suffix = unavailableLabel(saved);
      options.push({value:rule.coldRuleId,label:(saved?.name || rule.coldRuleId) + '（' + suffix + '）',disabled:true});
    }
    const emptyHelp = coldType ? '请先在「分配规则」新建并保存「线索 / 冷线索」分类的分配规则，再回到这里选择。' :
      '当前租户暂不可选「冷线索」分类，请在「业务分类」核对该分类的启用状态及权限。';
    return '<div class="sc-grid">' +
      select([...path,'coldRuleId'],rule.coldRuleId,'目标冷线索分配规则',
        [emptyOption(choices.length ? '请选择' : '暂无可用的冷线索分配规则'),...options]) +
      input([...path,'coldWindowDays'],rule.coldWindowDays ?? '','冷线索时间窗口（天）',
        {type:'number',min:1,max:3650,placeholder:'请输入天数'}) + '</div>' +
      (choices.length ? '' : '<p class="sc-note">' + e(emptyHelp) + '</p>');
  }

  function outboundTaskField(rule,path,action,context,readOnly) {
    const {id:field,reference} = catalog.outboundFields[action];
    const directory = window.DSkynetOutboundTargets?.list(context,action);
    const tasks = directory?.tasks || [];
    const options = tasks.map(task => ({value:task.id,label:task.sceneAssociation ?
      [task.name,task.platform,task.providerReference].filter(Boolean).join(' · ') : task.name + ' · ' + task.id}));
    const saved = rule[reference];
    const loading = directory?.status === 'loading';
    const placeholder = loading ? '正在读取本租户任务' : directory?.status !== 'ready' ? '任务列表暂不可用' :
      options.length ? '请选择' : '本租户暂无可用任务';
    const ai = action === 'AI 外呼';
    const canConfigure = !readOnly && ai && DSession.allowed('PAGE-2110',context) && DSession.canWrite('PAGE-2110');
    const showRefresh = !readOnly && (ai || directory?.status === 'unavailable');
    const taskNote = !readOnly && directory?.status === 'unavailable' ? '<p class="sc-note" role="status">' +
      e(directory.reason || '任务目录未能读取。') + '</p>' : '';
    const link = canConfigure ? '<a class="btn-link" target="_blank" rel="opener" data-config-open-ai-scene' +
      ' title="在新标签页配置，当前策略草稿会保留"' +
      ' href="' + e(aiSceneConfigUrl()) + '">配置 AI 外呼场景</a>' : '';
    const controls = showRefresh ? '<div class="sc-inline-tools">' + link +
      '<button type="button" class="btn-link" data-config-reload-outbound>重新读取</button></div>' : '';
    return '<div class="sc-grid">' + select([...path,field],rule[field],'目标' + action + '任务',
      [emptyOption(placeholder),...includeStoredOption(options,rule[field],saved?.id === rule[field] ? saved?.name : undefined)],
      'outbound-task') + '</div>' + controls + taskNote;
  }

  function aiSceneConfigUrl() {
    const url = new URL(window.location.href);
    url.searchParams.set('openAiScene','1');
    url.hash = 'PAGE-2110';
    return url.href;
  }

  function outboundTaskFieldsForRule(rule,path,context,readOnly) {
    return Object.keys(catalog.outboundFields).filter(action => rule.actions.includes(action)).map(action =>
      '<div data-config-outbound-action="' + e(action) + '" data-config-rule-index="' + e(path.at(-1)) +
      '" data-config-outbound-path="' + pathData(path) + '">' +
      outboundTaskField(rule,path,action,context,readOnly) + '</div>').join('');
  }

  function applicationBindingHint(context,scenario,id,snapshot,snapshotPath) {
    const catalog = window.DIntegrationApplications;
    const current = id && catalog?.resolveScenarioApplication(context,scenario,id);
    const bound = id && snapshot?.connectionKey && catalog?.resolveScenarioApplication(context,scenario,id,snapshot);
    const text = !id ? '请先在「系统管理 → 应用接入 → 外部依赖」配置场景为“' + scenario + '”的应用。' :
      bound?.ok && bound.status === 'available' ? '已关联 ' + bound.application.name +
        (bound.application.interfaceName ? ' · ' + bound.application.interfaceName : '') :
      '原应用未关联当前配置版本或已失效。请核对场景、接口及适用范围。';
    return '<p class="sc-note" data-config-application-status>' + e(text) +
      (id && !(bound?.ok && bound.status === 'available') && current?.ok && current.status === 'available' ?
        ' <button type="button" class="btn-link" data-config-rebind-application="' + pathData(snapshotPath) +
        '" data-config-application-scene="' + e(scenario) + '" data-config-application-id="' + e(id) +
        '">重新关联当前应用</button>' : '') + '</p>';
  }

  function wecomApplicationField(rule,path,context) {
    if (!rule.actions.includes('企微培育')) return '';
    const result = window.DIntegrationApplications?.scenarioApplications(context,'转企微跟进');
    const applications = result?.ok ? result.rows : [];
    const id = rule.wecomApplicationId || rule.wecomApplication?.id || '';
    return '<div class="sc-grid">' + select([...path,'wecomApplicationId'],id,'企微跟进应用',[
      emptyOption(applications.length ? '请选择企微跟进应用' : '暂无可用的企微跟进应用'),
      ...includeStoredOption(applications.map(app => ({value:app.id,
        label:[app.name,app.interfaceName].filter(Boolean).join(' · ')})),id,rule.wecomApplication?.name)
    ],'wecom-application') + '</div>' +
      applicationBindingHint(context,'转企微跟进',id,rule.wecomApplication,[...path,'wecomApplication']);
  }

  function directDeliveryValueFields(rule,path,context,categoryId) {
    const fields = catalog.directDeliveryFieldOptions(context,categoryId);
    const rows = Array.isArray(rule.directDeliveryValues) ? rule.directDeliveryValues : [];
    const array = [...path,'directDeliveryValues'];
    const used = new Set(rows.map(row=>row.fieldId));
    return '<div data-config-direct-values><h4>直发字段和下发值</h4>' +
      '<p class="sc-note">从当前二级分类的填写字段选择，手工填写固定下发值。下发门店仍取来件的意向门店。</p>' +
      (!fields.length ? '<p class="sc-note" role="status">当前二级分类暂无可用的填写字段。</p>' : '') +
      rows.map((row,index)=>{
        const choices = fields.filter(field=>field.id===row.fieldId || !used.has(field.id))
          .map(field=>({value:field.id,label:field.label}));
        return '<div class="sc-direct-value-row" data-config-direct-value-row>' +
          select([...array,index,'fieldId'],row.fieldId,'直发字段',
            [emptyOption('请选择填写字段'),...includeStoredOption(choices,row.fieldId,row.label)],'direct-delivery-value-field') +
          input([...array,index,'value'],row.value,'下发值',{name:'directDeliveryValue',max:500,placeholder:'手工填写固定值'}) +
          control('移除','remove',array,index,false,'移除直发字段 '+(index+1)) + '</div>';
      }).join('') +
      control('添加直发字段','direct-delivery-value-add',array,null,rows.length>=50 || !fields.some(field=>!used.has(field.id))) + '</div>';
  }

  function directDeliveryFields(rule,path,context,readOnly,categoryId) {
    const type = rule.directDeliveryTargetType || '';
    const store = context.scope.tenant.organization === '门店';
    const types = [
      {value:'internalTenant',label:'本系统门店租户'},
      {value:'externalSystem',label:'外部下发系统'}
    ];
    const choices = store && !readOnly ? types.filter(item => item.value === 'externalSystem') : types;
    const targetOptions = [emptyOption('请选择下发对象'),...includeStoredOption(choices,type,
      types.find(item => item.value === type)?.label)];
    let externalField = '';
    if (type === 'externalSystem') {
      const systems = catalog.deliveryTargetOptions(context,'externalSystem');
      externalField = select([...path,'directDeliveryTargetId'],rule.directDeliveryTargetId,'接收系统',[
        emptyOption(systems.length ? '请选择外部下发系统' : '暂无可用的外部下发系统'),
        ...includeStoredOption(systems,rule.directDeliveryTargetId)
      ],'direct-delivery-target');
    }
    return '<section class="sc-block" data-config-direct-delivery><div class="sc-grid">' +
      select([...path,'directDeliveryTargetType'],type,'下发对象',targetOptions,'direct-delivery-target-type') +
      externalField + '</div>' +
      (type === 'externalSystem' ? applicationBindingHint(context,'下发',rule.directDeliveryTargetId,
        rule.directDeliveryApplication,[...path,'directDeliveryApplication']) : '') +
      '<p class="sc-note">下发门店取本次来件的意向门店。</p>' +
      (type === 'internalTenant' ? '<p class="sc-note">按意向门店匹配同品牌的可用门店租户。</p>' : '') +
      (store && !readOnly ? '<p class="sc-note">门店租户可配置外部系统直发。</p>' : '') +
      '<p class="sc-note">直发沿用意向下发的审核设置。开启时，负责坐席确认后提交管理员审核。关闭时，按配置模拟直发。</p>' +
      directDeliveryValueFields(rule,path,context,categoryId) + '</section>';
  }

  function isDirectDeliveryRule(rule,entry = rule.event === '接入后') {
    return entry && isDeliveryStrategy(rule);
  }

  function ruleExecution(view,rule,path,entry) {
    const {context,readOnly,book,state} = view;
    const content = outboundTaskFieldsForRule(rule,path,context,readOnly) + manualAssignmentFields(rule,path,state,readOnly) +
      coldRuleField(rule,path,book,context) + wecomApplicationField(rule,path,context) +
      (isDirectDeliveryRule(rule,entry) ? directDeliveryFields(rule,path,context,readOnly,view.draft.categoryId) : '');
    return content ? '<div class="sc-rule-execution" data-config-rule-execution>'+content+'</div>' : '';
  }

  function coldWindowConditionText(days) {
    return Number.isSafeInteger(Number(days)) && Number(days) > 0 && Number(days) <= 3650 ?
      '命中转冷条件后等待 ' + Number(days) + ' 天（每满 24 小时计 1 天），到期才触发下一轮冷线索培育。' :
      '时间窗口控制下一轮何时开始；未设置时保留原先的立即转冷。';
  }

  function ruleConditions(view,rule,content) {
    const pending = !view.readOnly && rule.actions.find(action => catalog.outboundFields[action] &&
      !rule[catalog.outboundFields[action].id]);
    const body = pending ? '<p class="sc-note" role="status">请先选择目标'+e(pending)+'任务，再配置条件。</p>' : content;
    const coldWindow = rule.actions.includes('转冷线索') ?
      '<p class="sc-note" data-config-cold-window-condition role="status">'+
        e(coldWindowConditionText(rule.coldWindowDays))+'</p>' : '';
    return '<div class="sc-rule-conditions" data-config-rule-conditions>'+coldWindow+body+'</div>';
  }

  function flatNurtureFields(view,rule,path,{fixedEvent = false,fixedCold = false} = {}) {
    const {draft,afterTask,readOnly,context} = view;
    const establishedTask = afterTask || draft.roundFlow;
    const supportsCold = draft.categoryId && draft.categoryId !== 'lxs';
    const events = (readOnly ? [...catalog.events,...catalog.legacyRoundEvents] : catalog.events).map(value => ({
      value,label:establishedTask && value === '接入后' ? '接入后（建立新任务后）' : eventLabels[value] || value
    }));
    const actions = catalog.actions.map(value => ({
      value,label:value === '不经培育直接下发' ? '直发' : value
    }));
    const destination = action => rule.event === '接入后' && catalog.deliveryActions.includes(action) ?
      nurtureDestinations['不经培育直接下发'] : (establishedTask && establishedTaskDestinations[action]) || nurtureDestinations[action];
    const actionPath = [...path,'actions'];
    const eventField = fixedEvent ?
      '<div class="sc-field"><span>触发判断的事件</span><p class="sc-value" data-config-fixed-nurture-event>' + e(rule.event) + '</p></div>' :
      select([...path,'event'],rule.event,'触发判断的事件',events,'nurture-event');
    const purpose = rule.event === catalog.roundCompleteEvent ? 'round' : 'nurture';
    const availableActions = actions.filter(action => (action.value !== '转冷线索' ||
      supportsCold && (rule.event === '接入后' || purpose === 'round')) &&
      (!catalog.deliveryActions.includes(action.value) || rule.event === '接入后'));
    const actionFields = fixedCold ?
      '<div class="sc-field"><span>处理方式</span><p class="sc-value">转冷线索</p></div>' :
      '<div class="sc-actions-stack"><h4>动作顺序</h4>' + rule.actions.map((action,position) => {
        const manual = rule.manualAssignment;
        const next = action === '人工外呼' && (Array.isArray(manual?.filterSteps) || manual?.strategy) ?
          '按配置规则分配坐席' : destination(action);
        const actionOptions = rule.event === '接入后' ? entryActionOptions(availableActions,action) : availableActions;
        return '<div class="sc-action-row">' + select([...actionPath,position],action,'动作 ' + (position + 1),
          includeStoredOption(actionOptions,action),'nurture-action','action') +
          '<div class="sc-action-destination" data-config-nurture-destination>' +
          (next ? '<span>下一去向</span><strong>' + e(next) + '</strong>' : '') + '</div>' +
          orderedControls(actionPath,position,rule.actions.length,'动作 ' + (position + 1),0,rule.actions.length > 1) + '</div>';
      }).join('') + '<div class="sc-inline-tools">' + control('添加动作','nurture-action',actionPath) + '</div></div>';
    return '<div class="sc-grid">' + eventField + '</div>' + actionFields + ruleExecution(view,rule,path) +
      ruleConditions(view,rule,'<div class="sc-grid">' + select([...path,'logic'],rule.logic,'如何满足条件',ruleLogic) +
        '</div>' + conditions(rule.conditions,[...path,'conditions'],purpose,'无附加条件，事件到达时满足。',
          conditionFields(purpose,context,draft.categoryId),undefined,context,draft.categoryId,
          {coldCallback:rule.event!=='接入后' && rule.actions.includes('转冷线索')}));
  }

  function nurtureRules(draft, book, afterTask, state, readOnly, context) {
    const supportsCold = draft.categoryId && draft.categoryId !== 'lxs';
    const priorities = new Map();
    const view = {draft,book,afterTask,state,readOnly,context};
    return (!readOnly ? '<div class="sc-strategy-migration"><p class="sc-note">' +
        '改用树形时会保留接入策略。原来的全局后续规则可在历史版本查看，按对应的父策略重新配置。</p>' +
        '<button type="button" class="btn btn-sm" data-config-convert-nurture-tree>改用树形配置</button></div>' : '') +
      '<div class="sc-editor-heading"><h2>按事件判定培育动作</h2><div class="sc-inline-tools">' +
      control('添加规则','nurture-rule',['rules']) +
      (!readOnly && supportsCold ? control('添加转冷规则','nurture-cold-rule',['rules']) : '') + '</div></div>' +
      (readOnly ? '' : '<p class="sc-note">首条规则固定在接入后触发。' +
        (supportsCold ? '可在接入后或本轮培育完成后配置转冷。' : '') + '拖动左侧把手或使用上移、下移。</p>') +
      '<p class="sc-note">每个触发事件单独从优先级 1 开始，仅可调整同一事件内的规则。只执行当前事件中优先级最高的命中规则。较高优先级缺少判断数据时，先转待处理。</p>' +
      '<p class="sc-note">后续动作可依据上一轮的通话状态、回访结果、线索状态和意向等级判断。数据足够且没有规则命中时，任务结束。</p>' +
      '<p class="sc-note">每轮的意向下发和低质线索下发规则在下发模板中维护。</p>' +
      '<p class="sc-note">规则执行首个非「继续」的动作。</p>' +
      draft.rules.map((rule,index) => {
        const path = ['rules',index];
        const priority = (priorities.get(rule.event) || 0) + 1;
        priorities.set(rule.event,priority);
        const sortable = !readOnly &&
          (adjacentNurtureRule(draft.rules,index,-1) >= 0 || adjacentNurtureRule(draft.rules,index,1) >= 0);
        return '<section class="sc-block" data-config-nurture-rule data-config-nurture-priority="' + priority +
          '" data-config-nurture-event="' + e(rule.event) + '"' + (sortable ? priorityRow(['rules'],index,'event') : '') +
          '><div class="sc-section-head" data-config-priority-drop><div class="sc-priority-heading">' +
          (sortable ? priorityHandle() : '') + '<h3>判定规则 ' + (index + 1) + '</h3><span class="sc-source-badge">' + e(rule.event) + ' · 事件内优先级 ' + priority + '</span></div>' +
          priorityControls(draft.rules,index) + '</div>' +
          flatNurtureFields(view,rule,path,{fixedEvent:index === 0 && rule.event === '接入后'}) + '</section>';
      }).join('');
  }

  function strategyExpansion(draft) {
    if (!strategyTreeExpansions.has(draft)) {
      strategyTreeExpansions.set(draft,new Set(draft.rules.slice(0,1).map(node => node.id)));
    }
    return strategyTreeExpansions.get(draft);
  }

  function newStrategyNode(event,name,{fallback = false,action = '人工外呼'} = {}) {
    return {id:'strategy-' + crypto.randomUUID(),name,fallback,event,logic:'and',conditions:[],actions:[action],children:[],
      ...(action === '人工外呼' ? {manualAssignment:defaultManualAssignment()} : {})};
  }

  function entryActionOptions(items,selected) {
    return items.filter(item => item.value !== '进入下发判断').map(item =>
      item.value === '不经培育直接下发' && selected === '进入下发判断' ?
        {value:selected,label:'直发'} : item);
  }

  function strategyActionLabel(action,fallback,entry) {
    if (catalog.deliveryActions.includes(action)) return entry ? '直发' : '下发';
    return fallback && action === '结束培育' ? '培育结束' : action;
  }

  function isDeliveryStrategy(rule) {
    return catalog.deliveryActions.includes(rule.actions.find(value => value !== '继续'));
  }

  function deliveryReferenceStatus(view) {
    const {book,draft,deliveryDraft} = view;
    const id = draft.deliveryTemplateId;
    if (!id) return {tone:'none',label:'未引用下发模板',detail:'请选择或新建下发模板。'};
    const staged = Boolean(deliveryDraft && deliveryDraft.id === id && deliveryDraft.categoryId === draft.categoryId);
    const item = staged ? deliveryDraft : storedConfiguration(book,'deliveryTemplates',id);
    if (!item || item.categoryId !== draft.categoryId || item.deletedAt) {
      return {tone:'attention',label:'引用不可用',detail:'原模板不存在、已删除或不属于当前分类，请重新选择。'};
    }
    const state = configurationState(item);
    const name = item.name || '未命名下发模板';
    const version = item.version ? ' · ' + versionLabel(item.version) : '';
    const counts = item.criteria !== undefined || item.aiCriteria !== undefined ? catalog.deliveryTypes.map(type => ({
      type:type.label,count:(item.criteria?.[type.value]?.length || 0)+(item.aiCriteria?.[type.value]?.length || 0)
    })) : [];
    const total = counts.reduce((sum,row) => sum + row.count,0);
    const detail = name + version + (counts.length ? ' · ' + counts.map(row=>row.type+' '+row.count+' 条').join(' / ') : '');
    if (staged) return {tone:'attention',label:'模板改动待保存',detail};
    if (state === 'draft') return {tone:'attention',label:'模板为草稿',detail};
    if (state !== 'enabled') return {tone:'attention',label:'模板已停用',detail};
    if (!counts.length) return {tone:'attention',label:'已引用旧版模板',detail};
    if (!total) return {tone:'none',label:'已引用 · 未配置判定规则',detail};
    if (!catalog.isDeliveryTemplateConfigured(item)) return {tone:'attention',label:'下发配置不完整',detail};
    const saved = view.savedData && JSON.parse(view.savedData);
    return {tone:'ready',label:saved && saved.deliveryTemplateId !== id ?
      '已配置 · 引用待保存' : '已配置判定规则',detail};
  }

  function deliveryStatusMarkup(status) {
    return '<span class="sc-delivery-status" data-config-delivery-status="' + e(status.tone) + '">' +
      e(status.label) + '</span>';
  }

  function usesTemplateDelivery(view) {
    const {book,draft,deliveryDraft} = view;
    const item = deliveryDraft?.id === draft.deliveryTemplateId && deliveryDraft?.categoryId === draft.categoryId ?
      deliveryDraft : storedConfiguration(book,'deliveryTemplates',draft.deliveryTemplateId);
    return item?.criteria !== undefined;
  }

  function strategyPeers(group,entry,delivery) {
    return group.flatMap((rule,index) => !rule.fallback && (entry || isDeliveryStrategy(rule) === delivery) ? [index] : []);
  }

  function strategyActionOptions(rule,entry,categoryId) {
    const action = rule.actions.find(value => value !== '继续') || '';
    const choices = rule.fallback ? (entry ? catalog.entryFallbackActions : catalog.nurtureFallbackActions) :
      !entry && rule.children.length ? catalog.nurtureStrategyActions : catalog.actions;
    const items = choices.filter(value => value !== '继续' &&
      (value !== '转冷线索' || categoryId !== 'lxs') && (entry || !catalog.deliveryActions.includes(value)))
      .map(value => ({value,label:strategyActionLabel(value,rule.fallback,entry)}));
    return includeStoredOption(entry ? entryActionOptions(items,action) : items,action);
  }

  function entryDestination(action,entry) {
    return entry && action === '转待处理' ?
      '<p class="sc-note">' + e(nurtureDestinations[action]) + '。</p>' : '';
  }

  function strategyConditions(view,rule,path,entry,action) {
    const {readOnly} = view;
    const purpose = entry ? 'strategy-entry' : 'strategy-round';
    const conditionPath = [...path,'conditions'];
    const available = fieldsForConditionPath(view,purpose,conditionPath);
    const source = entry ? '' : strategyConditionSourceNote(view,conditionPath);
    if (!catalog.deliveryActions.includes(action)) {
      return source + conditions(rule.conditions,conditionPath,purpose,'无附加条件时命中本策略。',available,undefined,view.context,view.draft.categoryId,
        {coldCallback:!entry && action==='转冷线索'});
    }
    const facts = entry ? '读取本次来件字段' : '读取刚完成轮次的通话状态、回访结果、线索状态和意向等级';
    const empty = readOnly ? '此版本无附加条件。' : '请添加下发条件。若此策略可无条件下发，选择「不限」。';
    return '<section class="sc-block" data-config-delivery-criteria><h4>' + (entry ? '下发判定条件' : '旧版下发判定条件') + '</h4>' +
      '<p class="sc-note">' + facts + '。' +
      (entry ? '命中并选中本策略时，按下发对象和意向门店办理。' : '规则命中并被选中时，任务进入待下发。') + '</p>' +
      source +
      '<div class="sc-grid">' + select([...path,'logic'],rule.logic,'如何满足条件',ruleLogic) + '</div>' +
      conditions(rule.conditions,conditionPath,purpose,empty,available,'添加下发条件',view.context,view.draft.categoryId) + '</section>';
  }

  function strategyFields(view,rule,path,entry,fixedAction = false,workspace = false) {
    const {draft} = view;
    const action = rule.actions.find(value => value !== '继续') || '';
    const sendsToDelivery = isDeliveryStrategy(rule);
    const actionField = fixedAction ? '<div class="sc-field"><span>处理方式</span><p class="sc-value">' +
      e(strategyActionLabel(action,rule.fallback,entry)) + '</p></div>' :
      select([...path,'actions'],action,'处理方式',strategyActionOptions(rule,entry,draft.categoryId),'strategy-action','action');
    const logic = sendsToDelivery ? '' :
      '<div class="sc-grid">' + select([...path,'logic'],rule.logic,'如何满足条件',ruleLogic) + '</div>';
    const execution = ruleExecution(view,rule,path,entry);
    const criteria = rule.fallback ? (action === '转冷线索' ? ruleConditions(view,rule,'') : '') :
      ruleConditions(view,rule,logic + strategyConditions(view,rule,path,entry,action));
    const direct = isDirectDeliveryRule(rule,entry) && !rule.fallback;
    if (workspace) return (!rule.fallback ? '<div class="sc-grid">' +
      input([...path,'name'],rule.name,'策略名称',{max:60,name:'strategyName'}) + '</div>' : '') +
      (criteria ? '<section class="sc-workspace-next"><h3>' +
        (sendsToDelivery && !direct ? '下发判断条件' : '什么时候命中') + '</h3>' + criteria + '</section>' : '') +
      '<section class="sc-workspace-next"><h3>命中后做什么</h3><div class="sc-grid">' + actionField + '</div>' +
      execution + (direct || (!rule.fallback && sendsToDelivery) ? '' : entryDestination(action,entry)) + '</section>';
    return '<div class="sc-grid">' +
      (rule.fallback ? '' : input([...path,'name'],rule.name,'策略名称',{max:60,name:'strategyName'})) + actionField + '</div>' +
      (direct ? criteria + execution : execution + (rule.fallback || !sendsToDelivery ? entryDestination(action,entry) : '') + criteria);
  }

  function strategyNode(view,rule,index,path,entry,peers) {
    const {draft,readOnly} = view;
    const action = rule.actions.find(value => value !== '继续') || '';
    const sendsToDelivery = isDeliveryStrategy(rule);
    const priority = peers.indexOf(index) + 1;
    const hasChildren = rule.children.length > 0;
    const hasVisibleChildren = usesTemplateDelivery(view) ?
      rule.children.some(child => !isDeliveryStrategy(child)) : hasChildren;
    const canHaveChildren = catalog.nurtureStrategyActions.includes(action);
    const title = rule.name || '未命名策略';
    const groupPath = path.slice(0,-1);
    const sortable = !readOnly && peers.length > 1;
    const siblingControls = readOnly ? '' : '<div class="sc-row-actions">' +
      control('上移','strategy-up',groupPath,index,priority === 1,'上移' + title) +
      control('下移','strategy-down',groupPath,index,priority === peers.length,'下移' + title) +
      control('移除','strategy-remove',groupPath,index,false,'移除' + title) + '</div>';
    const more = !readOnly && hasVisibleChildren ?
      control(usesTemplateDelivery(view) ? '清空后续培育' : '清空本轮结束后的配置',
        'strategy-remove-next',[...path,'children']) : '';
    return '<details class="sc-strategy-node" data-config-nurture-rule data-config-strategy-node="' + e(rule.id) + '"' +
      ' data-config-nurture-event="' + e(entry ? '接入后' : catalog.roundCompleteEvent) + '"' +
      ' data-config-nurture-priority="' + priority + '"' +
      (sortable ? priorityRow(groupPath,index,'strategy') : '') +
      (strategyExpansion(draft).has(rule.id) ? ' open' : '') +
      '><summary class="sc-strategy-summary" data-config-priority-drop>' +
      (sortable ? priorityHandle() : '') + '<span class="sc-strategy-summary-title"><strong data-config-strategy-title>' + e(title) + '</strong>' +
      '<span class="sc-source-badge">' + (!entry && sendsToDelivery ? '下发优先级 ' : '同级优先级 ') + priority + '</span></span>' +
      '<span class="sc-strategy-summary-action" data-config-strategy-summary-action>' +
      e(strategyActionLabel(action,false,entry) || '待选择') + '</span></summary>' +
      '<div class="sc-strategy-fields">' + siblingControls +
      strategyFields(view,rule,path,entry) +
      (more ? '<div class="sc-strategy-controls">' + more + '</div>' : '') + '</div>' +
      (canHaveChildren || hasChildren ? strategyGroup(view,rule.children,[...path,'children'],rule) : '') + '</details>';
  }

  function strategyGroup(view,rules,path,parent = null) {
    const entry = !parent;
    const renderRules = indexes => indexes.map(index => strategyNode(view,rules[index],index,[...path,index],entry,indexes)).join('');
    const continueRules = strategyPeers(rules,entry,false);
    const section = '<section class="sc-strategy-group" data-config-strategy-group="' + e(parent ? parent.id : 'root') + '"' +
      (parent && path.length <= 7 ? ' data-config-strategy-indent' : '') + '>';
    if (entry) {
      const add = view.readOnly ? '' : control('添加接入策略','strategy-add',path);
      return section + '<div class="sc-strategy-group-heading"><h3>接入后</h3>' + add + '</div>' +
        renderRules(continueRules) + '</section>';
    }
    const deliveryRules = usesTemplateDelivery(view) ? [] : strategyPeers(rules,false,true);
    const parentName = e(parent.name || '未命名策略');
    const deliveryJump = view.inFlow ? 'data-flow-edit-delivery data-flow-delivery-context="' + parentName + '"' :
      'data-config-edit-delivery="' + parentName + '"';
    const deliveryStatus = deliveryReferenceStatus(view);
    const editDelivery = view.readOnly || !view.draft.categoryId ? '' :
      '<button type="button" class="btn btn-sm" ' + deliveryJump + '>配置下发模板</button>';
    const addFollowup = view.readOnly ? '' : '<div class="sc-inline-tools">' +
      control(continueRules.length ? '添加同级策略' : '添加后续策略','strategy-add',path) +
      (view.draft.categoryId !== 'lxs' ? control('添加转冷规则','strategy-add-cold',path) : '') + '</div>';
    const routingHelp = deliveryRules.length ? '当前引用旧版下发模板。保存新版模板规则后，按新版规则判断下发。' :
      '本轮完成后按引用的下发模板先判断下发，未命中再判断后续培育。';
    return section + '<div class="sc-delivery-config" data-config-round-delivery><div class="sc-delivery-config-info">' +
      '<div class="sc-delivery-config-title"><h3>本轮完成后 · 下发判定</h3>' + deliveryStatusMarkup(deliveryStatus) + '</div>' +
      '<p class="sc-note" data-config-delivery-details>' + e(deliveryStatus.detail) + '</p>' +
      '</div>' + editDelivery + '</div><p class="sc-note">' + routingHelp + '</p>' + renderRules(deliveryRules) +
      '<div class="sc-strategy-group-heading"><h3>后续培育</h3>' + addFollowup + '</div>' +
      renderRules(continueRules) + groupFallbackSettings(view,rules,path,parent) + '</section>';
  }

  function groupFallbackSettings(view,rules,groupPath,parent = null) {
    const {readOnly} = view;
    const entry = !parent;
    const index = rules.findIndex(rule => rule.fallback);
    const rule = rules[index];
    if (readOnly && !rule) return '';
    const controls = !readOnly ? (rule ? control('移除兜底策略','strategy-remove',groupPath,index) :
      control('添加兜底策略','strategy-add-fallback',groupPath)) : '';
    const path = [...groupPath,index];
    const body = rule ? strategyFields(view,rule,path,entry) +
      (readOnly && rule.children.length ? strategyGroup(view,rule.children,[...path,'children'],rule) : '') : '';
    return '<section class="sc-block sc-group-fallback" data-config-group-fallback="' + e(parent?.id || 'root') + '"' +
      (entry ? ' data-config-root-fallback' : '') + '><div class="sc-section-head">' +
      '<h3>' + (entry ? '一级兜底策略' : '本组兜底策略') + '</h3>' + controls + '</div>' +
      '<p class="sc-note">' + (entry ? '接入规则' : '本组后续培育规则') +
      '均明确未命中的客户，进入已配置的兜底策略。</p>' + body + '</section>';
  }

  // Alternate presentation of the existing draft: paths, commands and save handlers are unchanged.
  function strategyWorkspace(view) {
    const {draft} = view;
    const nodes = new Map();
    const templateDelivery = usesTemplateDelivery(view);
    const actionOf = rule => rule.actions.find(value => value !== '继续') || '';
    const visibleChildren = rule => rule.children.some(child => !templateDelivery || !isDeliveryStrategy(child));
    function group(rows,path,parent = null,trail = []) {
      const entry = !parent;
      const ordinary = strategyPeers(rows,entry,false);
      const oldDelivery = entry || templateDelivery ? [] : strategyPeers(rows,false,true);
      const fallback = rows.findIndex(rule => rule.fallback);
      function item(index,peers,tag) {
        const rule = rows[index];
        const id = String(rule.id);
        const name = rule.name || (rule.fallback ? '兜底策略' : '未命名策略');
        const info = {rule,name,index,path:[...path,index],groupPath:path,entry,peers,tag,trail};
        nodes.set(id,info);
        const sortable = !rule.fallback && peers.length > 1;
        return '<li class="sc-workspace-node" data-config-strategy-node="' + e(id) + '"' +
          (sortable ? priorityRow(path,index,'strategy') : '') + '>' +
          '<div class="sc-workspace-row" data-config-priority-drop>' + (sortable ? priorityHandle() : '') +
          '<button type="button" class="sc-workspace-pick" data-config-strategy-select="' + e(id) +
          '"><span class="sc-workspace-title" data-config-strategy-title>' + e(name) + '</span>' +
          '<span class="sc-workspace-meta">' + e(tag) + ' · ' +
          e(strategyActionLabel(actionOf(rule),rule.fallback,entry) || '待选动作') + '</span></button></div>' +
          (!rule.fallback && visibleChildren(rule) ? group(rule.children,[...info.path,'children'],rule,[...trail,name]) : '') + '</li>';
      }
      return '<ul class="sc-workspace-list">' + oldDelivery.map((index,pos) => item(index,oldDelivery,'历史下发 ' + (pos+1))).join('') +
        ordinary.map((index,pos) => item(index,ordinary,'优先级 ' + (pos+1))).join('') +
        (fallback < 0 ? '' : item(fallback,[],'兜底')) + '</ul>';
    }
    const listing = group(draft.rules,['rules']);
    const selectedId = strategyWorkspaceSelections.get(draft);
    const [id,info] = nodes.has(selectedId) ? [selectedId,nodes.get(selectedId)] : nodes.entries().next().value || [];
    if (id) strategyWorkspaceSelections.set(draft,id);
    else strategyWorkspaceSelections.delete(draft);
    const rootAdd = control('添加接入策略','strategy-add',['rules']) +
      (!draft.rules.some(rule=>rule.fallback) ? control('添加一级兜底','strategy-add-fallback',['rules']) : '');
    function detail() {
      if (!info) return '<p class="sc-workspace-empty">从左侧添加接入策略。条件和处理方式会在这里显示。</p>';
      const {rule,name,index,path,groupPath,entry,peers,tag,trail} = info;
      const action = actionOf(rule);
      const canHaveChildren = !rule.fallback && (catalog.nurtureStrategyActions.includes(action) || rule.children.length);
      const childPath = [...path,'children'];
      const next = canHaveChildren ? '<section class="sc-workspace-next"><h3>本轮结束后</h3><p class="sc-note">先判断下发；未命中再按组内优先级判断后续培育。</p>' +
        '<div class="sc-inline-tools">' +
        control(visibleChildren(rule) ? '添加同级后续策略' : '添加后续策略','strategy-add',childPath) +
        (draft.categoryId !== 'lxs' ? control('添加转冷规则','strategy-add-cold',childPath) : '') +
        (!rule.children.some(child=>child.fallback) ? control('添加本组兜底','strategy-add-fallback',childPath) : '') +
        (visibleChildren(rule) ? control(templateDelivery ? '清空后续培育' : '清空本轮结束后的配置','strategy-remove-next',childPath) : '') +
        '</div></section>' : '';
      return '<header class="sc-workspace-heading"><span>' + e(['接入后',...trail,tag].join(' / ')) +
        '</span><h3>' + e(name) + '</h3></header><div class="sc-row-actions">' +
        (!rule.fallback && peers.length > 1 ?
          control('上移','strategy-up',groupPath,index,peers[0] === index) +
          control('下移','strategy-down',groupPath,index,peers.at(-1) === index) : '') +
        control(rule.fallback ? '移除兜底策略' : '移除策略','strategy-remove',groupPath,index) + '</div>' +
        '<div data-config-nurture-rule>' + strategyFields(view,rule,path,entry,false,true) + '</div>' + next;
    }
    return '<div class="sc-strategy-tree" data-config-strategy-tree><div class="sc-editor-heading"><h2>培育策略</h2></div>' +
      '<div class="sc-workspace"><nav aria-label="培育策略列表" class="sc-workspace-nav" data-config-strategy-nav data-config-strategy-group="root">' +
      '<div class="sc-workspace-nav-title"><strong>接入后</strong><span>同组可拖动排序</span></div>' +
      listing + '<div class="sc-workspace-add">' + rootAdd + '</div></nav>' +
      '<section class="sc-workspace-detail" aria-label="当前策略配置" data-config-strategy-detail>' +
      detail() + '</section></div></div>';
  }

  function nurtureStrategyTree(view) {
    const {draft,readOnly} = view;
    const migration = !readOnly && catalog.hasLegacyFallback(draft.rules) ?
      '<div class="sc-inline-tools"><p class="sc-note" role="status">部分旧兜底包含多个动作或后续组。保存新版前请整理。</p>' +
      '<button type="button" class="btn btn-sm" data-config-normalize-fallback>整理旧兜底配置</button></div>' : '';
    if (view.inFlow) return migration + strategyWorkspace(view);
    return migration + '<div class="sc-strategy-tree" data-config-strategy-tree><div class="sc-editor-heading">' +
      '<h2>培育策略树</h2></div><p class="sc-note">每轮先判断下发，再判断后续培育。两个判断各自按组内优先级执行，缺少影响判断的数据时转待处理。</p>' +
      (readOnly ? '' : '<p class="sc-note">拖动策略左侧把手调整同组优先级，也可展开后使用上移、下移。</p>') +
      strategyGroup(view,draft.rules,['rules']) + '</div>' + groupFallbackSettings(view,draft.rules,['rules']);
  }

  function deliveryReference(view) {
    const {draft,readOnly} = view;
    const status = deliveryReferenceStatus(view);
    return '<div class="sc-delivery-config sc-delivery-config-primary" data-config-delivery-reference>' +
      '<div class="sc-delivery-config-info"><div class="sc-delivery-config-title"><h3>下发模板</h3>' +
      deliveryStatusMarkup(status) + '</div><p class="sc-note" data-config-delivery-details>' + e(status.detail) + '</p>' +
      '<p class="sc-note">当前培育模板各轮共用，下发判定优先于后续培育。</p></div>' +
      (readOnly || !draft.categoryId ? '' : '<button type="button" class="btn btn-primary" data-config-edit-delivery>' +
        '配置下发模板</button>') + '</div>';
  }

  const emptyDeliveryHandling = () => ({auditEnabled:'',deliveryTargetType:'',deliveryTargetId:'',deliveryMode:''});
  const deliveryHandlingByKind = create => Object.fromEntries(catalog.deliveryTypes.map(({value}) => [value,create(value)]));

  function initializeDeliveryHandling(draft) {
    draft.handlingByKind ||= deliveryHandlingByKind(kind => ({...catalog.deliveryHandling(draft,kind)}));
    return draft.handlingByKind;
  }

  function deliveryBehaviorFields(handling,context,deliveryType) {
    const path = ['handlingByKind',deliveryType.value];
    const audit = handling.auditEnabled === true ? 'enabled' : handling.auditEnabled === false ? 'disabled' : handling.auditEnabled || '';
    const targetType = handling.deliveryTargetType || '';
    const external = targetType === 'externalSystem';
    const storeToHeadquarters = targetType === 'internalTenant' && context.scope.tenant.organization === '门店';
    const autoExternal = external && audit === 'disabled';
    const targets = external ? catalog.deliveryTargetOptions(context,targetType) : [];
    const modes = catalog.deliveryModes.filter(mode => !(storeToHeadquarters || autoExternal) || mode.value === 'oneToOne');
    const auditField = select([...path,'auditEnabled'],audit,'是否开启下发审核',[
      emptyOption('请选择'),
      {value:'enabled',label:'开启 · 管理员审核后下发'},
      {value:'disabled',label:'关闭 · 按目标规则下发'}
    ],'delivery-audit');
    const targetField = select([...path,'deliveryTargetId'],handling.deliveryTargetId || '','接收系统',[
      emptyOption(targets.length ? '请选择接收系统' : '暂无可用的接收系统'),...includeStoredOption(targets,handling.deliveryTargetId)
    ],'delivery-application');
    const internal = targetType === 'internalTenant';
    const auditHelp = audit === 'enabled' ? '由负责坐席提交管理员审核，审核通过后下发。' :
      audit === 'disabled' ? (external ? '外部系统自动下发支持 1 发 1，条件命中且接收系统可用时自动执行。' :
        internal ? '负责坐席选择接收租户后直接下发。' : '') : '';
    const targetHelp = internal ? (storeToHeadquarters ? '门店仅可下发至同品牌总部。' :
      '按本轮意向门店匹配接收租户。1 发 1 固定匹配目标；1 发多必须包含该目标，再明确选择额外租户。') : '';
    return '<section class="sc-block sc-delivery-behavior" aria-label="' + e(deliveryType.label + '办理') +
      '" data-config-delivery-behavior="' + e(deliveryType.value) + '">' +
      '<h4>下发办理</h4><div class="sc-grid">' +
      select([...path,'deliveryTargetType'],targetType,'下发目标类型',[
        emptyOption('请选择'),
        {value:'externalSystem',label:'外部系统'},
        {value:'internalTenant',label:'内部租户'}
      ],'delivery-target-type') +
      select([...path,'deliveryMode'],handling.deliveryMode || '','下发方式',[emptyOption('请选择'),...modes]) +
      auditField + (external ? targetField : '') + '</div>' +
      (auditHelp || targetHelp ? '<p class="sc-note" data-config-delivery-help>' + e(targetHelp + auditHelp) + '</p>' : '') +
      (external ? applicationBindingHint(context,'下发',handling.deliveryTargetId,handling.application,[...path,'application']) : '') + '</section>';
  }

  function deliveryRules(draft,readOnly,context) {
    const fields = catalog.deliveryRuleFieldsFor(context,draft.categoryId);
    const aiFields = catalog.aiDeliveryRuleFieldsFor(context,draft.categoryId);
    const aiSource = catalog.aiDeliveryOptions(context,draft.categoryId);
    function group(label,path,rules,directory,isAI=false) {
      return '<div class="sc-block" data-config-delivery-mode="' + (isAI ? 'ai' : 'manual') + '"><div class="sc-section-head">' +
        '<h4>' + e(label) + '</h4>' + control('添加下发规则','delivery-rule',path) + '</div>' +
        (isAI ? '<p class="sc-note">标签读取当前租户类型和二级业务分类下已启用的供应商标签。' +
          (aiSource.status!=='ready' ? '暂无可读取的标签配置。' : !aiSource.tags.length ? '当前分类暂无可用标签。' : '') +
          '状态和时长取本轮 AI 话单，缺值不会按 0 秒处理。</p>' : '') +
        (rules.length ? '' : '<p class="sc-note">暂无规则。</p>') +
        rules.map((rule,index)=>deliveryRule(rule,[...path,index],index,rules.length,label,directory)).join('') + '</div>';
    }
    return '<p class="sc-note">按本轮呼叫方式选择条件组，意向下发优先。人工外呼和预外呼取本轮填写值及话单。</p>' +
      (readOnly && draft.aiCriteria === undefined ? '<p class="sc-note">此版本尚未单独配置 AI 下发条件；历史版本执行逻辑不变。</p>' : '') +
      catalog.deliveryTypes.map(type => {
        const {value,label} = type;
        const handling = draft.handlingByKind ? draft.handlingByKind[value] || {} : catalog.deliveryHandling(draft,value);
        return '<section class="sc-block" data-config-delivery-type="' + e(value) + '" data-config-ai-delivery><h3>' +
          e(label) + '规则</h3>' +
          group('人工外呼／预外呼',['criteria',value],draft.criteria?.[value] || [],fields) +
          group('AI 外呼',['aiCriteria',value],draft.aiCriteria?.[value] || [],aiFields,true) +
          deliveryBehaviorFields(handling,context,type) + '</section>';
      }).join('');
  }

  function deliveryRule(rule,path,index,count,typeLabel,fields) {
    const label = typeLabel + '规则 ' + (index + 1);
    return '<section class="sc-block" data-config-delivery-rule><div class="sc-section-head"><h4>' + e(label) + '</h4>' +
      orderedControls(path.slice(0,-1),index,count,label) + '</div>' + deliveryRuleFields(rule,path,fields) + '</section>';
  }

  function deliveryRuleFields(rule,path,fields) {
    const conditionPath = [...path,'conditions'];
    return '<div class="sc-grid">' + select([...path,'logic'],rule.logic ?? 'and','条件关系',ruleLogic) +
      '</div><div class="sc-condition-list">' +
      rule.conditions.map((condition,position) => {
        const row = [...conditionPath,position];
        const available = fields.find(item => item.key === condition.field);
        const field = available || catalog.deliveryConditionFields.find(item => item.key === condition.field);
        const duration = condition.field===catalog.aiDurationKey;
        const isAI = path[0]==='aiCriteria';
        const multi = !duration && Boolean(available || Array.isArray(condition.value));
        const valuesField = condition.aiTagOptions?.length && Array.isArray(field?.options) ? {...field,
          options:[...field.options,...condition.aiTagOptions.filter(tag=>!field.options.some(item=>item.value===tag.value))
            .map(tag=>({...tag,label:tag.label+'（原配置）'}))]} : field;
        const choices = fields.filter(item =>
          item.key===catalog.aiDurationKey || !rule.conditions.some((other,at) => at !== position && other.field === item.key))
          .map(item => ({value:item.key,label:item.label}));
        return '<div class="sc-condition-row"' + (multi ? ' data-config-multi-row' : '') + '>' +
          select([...row,'field'],condition.field,'条件字段',includeStoredOption(choices,condition.field,condition.followupLabel || field?.label),
            'delivery-condition-field','field',isAI ? (condition.field===catalog.aiDeliveryTagKey?'供应商标签集':'本轮 AI 话单') :
              available?.followupKey ? '本轮填写字段' : available ? '本轮通话' : '') +
          (duration ? select([...row,'operator'],condition.operator,'比较方式',catalog.aiDurationOperators) :
            '<div class="sc-field"><span>比较方式</span><p class="sc-value" data-config-delivery-operator>等于</p></div>') +
          (duration ? input([...row,'value'],condition.value,'通话时长（秒）',{type:'number',min:0,max:Number.MAX_SAFE_INTEGER,inputMode:'numeric'}) :
            conditionValueField([...row,'value'],valuesField,condition.value,multi)) +
          control('移除','remove',conditionPath,position,false,'移除条件 ' + (position + 1)) + '</div>';
      }).join('') + '<div class="sc-inline-tools">' +
      control('添加条件','condition-delivery',conditionPath,null,!nextDeliveryField(fields,rule.conditions)) +
      '</div></div>';
  }

  function nextDeliveryField(fields,rows) {
    const simple=fields.find(field=>!rows.some(condition=>condition.field===field.key));
    if(simple)return {field:simple.key,operator:'equal',value:''};
    const choice=fields.some(field=>field.key===catalog.aiDurationKey) &&
      catalog.aiDurationOperators.find(operator=>!rows.some(row=>row.field===catalog.aiDurationKey && row.operator===operator.value));
    return choice ? {field:catalog.aiDurationKey,operator:choice.value,value:''} : null;
  }

  function initialDraft(kind,categoryId = category.categoryId) {
    const base = {name:'',categoryId};
    if (kind === 'rules') return {...base,inTransitFilter:true,cleaning:catalog.defaultCleaning(categoryId)};
    if (kind === 'nurtureTemplates') {
      return {...base,roundFlow:true,strategyTree:true,deliveryTemplateId:'',
        rules:[]};
    }
    return {...base,criteria:catalog.defaultDeliveryCriteria(),aiCriteria:catalog.defaultDeliveryCriteria(),mapping:catalog.defaultDeliveryMapping(),
      handlingByKind:deliveryHandlingByKind(emptyDeliveryHandling)};
  }

  function editorFields(view) {
    const {page,draft,context,book,inFlow,readOnly,afterTask,state} = view;
    if (page.kind === 'rules') {
      if (draft.cleaning) return cleaningFields(draft,context,book,inFlow);
      return readOnly ?
        '<div class="sc-editor-heading" data-config-historical-nodes><h2>历史清洗和关联节点</h2>' +
        '<p class="sc-note">仅供查看。已绑定该版本的原任务继续按原规则办理。</p></div>' + ruleNodes(draft,book,context) : '';
    }
    if (page.kind === 'nurtureTemplates') {
      return (inFlow ? '' : deliveryReference(view)) + (draft.strategyTree ? nurtureStrategyTree(view) :
        nurtureRules(draft,book,afterTask,state,readOnly,context));
    }
    return deliveryRules(draft,readOnly,context);
  }

  function configFields(view) {
    const {page,draft,readOnly,context} = view;
    const types = catalog.businessTypes(context);
    const typeField = readOnly || draft.id ?
      '<div class="sc-field"><span>二级分类</span><p class="sc-value">' + e(typeLabel(draft,types)) + '</p></div>' :
      select(['categoryId'],draft.categoryId,'二级分类',[emptyOption('请选择二级分类'),...types],'category');
    const basic = '<div class="sc-grid">' + input(['name'],draft.name,page.name + '名称',{max:60}) + typeField + '</div>';
    const workspace = view.inFlow && page.kind === 'nurtureTemplates' && draft.strategyTree;
    return '<fieldset class="sc-form"' + (readOnly ? ' disabled' : '') + '>' +
      (workspace ? editorFields(view) + '<details class="sc-workspace-template"' +
        (strategyWorkspaceBasicOpen.has(draft) ? ' open' : '') + '><summary>模板基本信息</summary>' + basic + '</details>' :
      '<div class="sc-form-heading"><h3>基本信息</h3></div>' + basic + editorFields(view)) + '</fieldset>';
  }

  function mountFields({host,kind,draft,book,context,afterTask,state,onChange}) {
    const page = pages.find(item => item.kind === kind);
    const view = {page,draft,book,context,afterTask,state,inFlow:true};
    const render = restorePath => {
      const basic = host.querySelector('.sc-workspace-template');
      if (basic) {
        if (basic.open) strategyWorkspaceBasicOpen.add(draft);
        else strategyWorkspaceBasicOpen.delete(draft);
      }
      host.innerHTML = '<form data-flow-config-form novalidate>' + configFields(view) + '</form>';
      const form = host.querySelector('form');
      form.onsubmit = event => event.preventDefault();
      bindFields(view,form,render,onChange);
      focusField(host,restorePath);
      return form;
    };
    render();
  }

  function openFlow(view,rule) {
    if (!rule || !active(view)) return;
    window.DSkynetConfigFlow.open({
      state:view.state,context:view.context,rule,isActive:() => active(view),
      onSaved({ruleId}) {
        view.book = catalog.read(view.state);
        if (view.categoryFilter) view.categoryFilter = rule.categoryId;
        displayList(view);
        view.root.querySelector('[data-config-edit="' + CSS.escape(ruleId) + '"]')?.focus();
      },
      mountFields,initialDraft,containDialogFocus
    });
  }

  function mountRuleCategoryPicker(modal,tree,available,initial) {
    const picker = modal.element.querySelector('.sc-category-picker');
    const trigger = picker.querySelector('[data-config-rule-type]');
    const menu = picker.querySelector('.sc-category-menu');
    const families = picker.querySelector('[data-config-rule-families]');
    const categories = picker.querySelector('[data-config-rule-categories]');
    const items = new Map(tree.flatMap(family => family.children.map(type => [type.value,{family,type}])));
    let selected = available.has(initial) ? items.get(initial) : null;
    let expanded = selected?.family;

    families.innerHTML = tree.map(family => '<button type="button" class="sc-category-option" data-config-rule-family="' +
      e(family.value) + '" aria-expanded="false" aria-controls="rule-category-children"><span>' + e(family.label) +
      '</span><span class="sc-category-next" aria-hidden="true">›</span></button>').join('');

    function renderValue() {
      trigger.querySelector('.sc-category-value').textContent = selected ?
        selected.family.label + ' / ' + selected.type.label : '请选择二级分类';
      trigger.classList.toggle('has-selection',Boolean(selected));
    }

    function renderCategories() {
      for (const item of families.children) {
        item.setAttribute('aria-expanded',String(item.dataset.configRuleFamily === expanded?.value));
      }
      if (!expanded) {
        categories.innerHTML = '<p class="sc-category-empty">请选择一级分类</p>';
        return;
      }
      categories.innerHTML = expanded.children.map(type => {
        const canSelect = available.has(type.value);
        return '<button type="button" class="sc-category-option" data-config-rule-category="' + e(type.value) +
          '" aria-pressed="' + (type.value === selected?.type.value) + '"' + (canSelect ? '' : ' disabled') + '><span>' +
          e(type.label) + '</span>' + (canSelect ? '' : '<span class="sc-category-state">已配置</span>') + '</button>';
      }).join('');
    }

    function toggle(open) {
      menu.hidden = !open;
      trigger.setAttribute('aria-expanded',String(open));
    }

    function familyButton() {
      return [...families.children].find(item => item.dataset.configRuleFamily === expanded?.value) || families.firstElementChild;
    }

    function expand(value) {
      expanded = tree.find(family => family.value === value);
      renderCategories();
    }

    trigger.onclick = () => toggle(menu.hidden);
    menu.onclick = event => {
      const button = event.target.closest('.sc-category-option');
      if (!button || button.disabled) return;
      if (button.hasAttribute('data-config-rule-family')) {
        expand(button.dataset.configRuleFamily);
        return;
      }
      selected = items.get(button.dataset.configRuleCategory);
      renderValue();
      renderCategories();
      modal.element.querySelector('[role="alert"]').textContent = '';
      toggle(false);
      trigger.focus();
    };
    modal.element.addEventListener('click',event => {
      if (!picker.contains(event.target)) toggle(false);
    });
    modal.element.addEventListener('keydown',event => {
      if (event.key === 'Escape' && !menu.hidden) {
        event.preventDefault();
        event.stopPropagation();
        toggle(false);
        trigger.focus();
      }
    },true);
    picker.addEventListener('keydown',event => {
      if (event.target === trigger && ['ArrowDown','ArrowUp'].includes(event.key)) {
        event.preventDefault();
        toggle(true);
        familyButton()?.focus();
      } else if (!menu.hidden && event.target.matches('.sc-category-option')) {
        const button = event.target;
        const inFamily = button.parentElement === families;
        if (inFamily && event.key === 'ArrowRight') {
          event.preventDefault();
          expand(button.dataset.configRuleFamily);
          (categories.querySelector('[aria-pressed="true"]:enabled') || categories.querySelector(':enabled'))?.focus();
        } else if (!inFamily && event.key === 'ArrowLeft') {
          event.preventDefault();
          familyButton()?.focus();
        } else if (['ArrowDown','ArrowUp','Home','End'].includes(event.key)) {
          const row = [...button.parentElement.querySelectorAll('button:enabled')];
          const following = row.indexOf(button) + (event.key === 'ArrowDown' ? 1 : -1);
          const target = event.key === 'Home' ? row[0] : event.key === 'End' ? row.at(-1) : row[following];
          event.preventDefault();
          target?.focus();
        }
      }
    });
    renderValue();
    renderCategories();
    return {current:() => selected?.type,focus:() => trigger.focus()};
  }

  function openRuleType(view) {
    if (!active(view)) return;
    const tree = catalog.categoryTree(view.context);
    const types = tree.flatMap(family => family.children);
    const available = new Set(types.map(type => type.value));
    if (!available.size) return DUI.toast('暂无可新增规则的二级分类。');
    const modal = DUI.dialog('新建分配规则',
      '<div class="sc-category-picker"><span class="sc-category-label" id="rule-category-label">二级分类</span>' +
      '<button type="button" class="sc-category-trigger" data-config-rule-type aria-expanded="false" ' +
      'aria-controls="rule-category-menu" aria-labelledby="rule-category-label rule-category-value">' +
      '<span class="sc-category-value" id="rule-category-value">请选择二级分类</span></button>' +
      '<div class="sc-category-menu" id="rule-category-menu" hidden>' +
      '<section class="sc-category-column" aria-label="一级分类"><h3 class="sc-category-heading">一级分类</h3>' +
      '<div class="sc-category-list" data-config-rule-families></div></section>' +
      '<section class="sc-category-column" aria-label="二级分类"><h3 class="sc-category-heading">二级分类</h3>' +
      '<div class="sc-category-list" data-config-rule-categories id="rule-category-children"></div></section></div></div>' +
      '<p class="field-hint">同一二级分类可维护多套分配规则。接入时须指定分配规则 ID。</p><p class="form-error" role="alert"></p>',[
        {label:'取消',run:close => close()},
        {label:'继续配置',primary:true,run:close => {
          if (!active(view)) return close();
          const selected = picker.current();
          const error = modal.element.querySelector('[role="alert"]');
          if (!selected) {
            error.textContent = '请选择二级分类。';
            picker.focus();
            return;
          }
          if (!DReview21.isLatest(view.state)) {
            error.textContent = DReview21.saveFailure(view.state);
            return;
          }
          const type = catalog.businessType(view.context,selected.value);
          if (!type) {
            error.textContent = '所选二级分类已不可用，请重新打开后选择。';
            return;
          }
          const name = catalog.rulesForCategory(view.book,type.value).length ? '' : type.label + '分配规则';
          const rule = {...initialDraft('rules',type.value),id:'draft:rules:new',name,
            categoryName:type.label};
          close();
          openFlow(view,rule);
        }}
      ],{stack:true,dismissible:true});
    modal.buttons[1].dataset.configRuleContinue = '';
    modal.element.querySelector('.d-dialog').classList.add('skynet-config','sc-rule-type-dialog');
    const picker = mountRuleCategoryPicker(modal,tree,available,view.categoryFilter);
    containDialogFocus(modal);
  }

  function displayList(view) {
    const {root,book,page} = view;
    const entries = catalog.list(book,page.kind);
    const types = catalog.businessTypes(view.context);
    const filterTypes = new Map(types.map(type => [type.value,type]));
    for (const item of entries) {
      if (!filterTypes.has(item.categoryId)) {
        filterTypes.set(item.categoryId,{value:item.categoryId,label:typeLabel(item,types)});
      }
    }
    const shown = entries.filter(item => (!view.categoryFilter || item.categoryId === view.categoryFilter) &&
      (!view.statusFilter || configurationState(item) === view.statusFilter));
    const isRules = page.kind === 'rules';
    const rows = shown.map(item => {
      const date = Date.parse(item.savedAt);
      const status = configurationState(item);
      const enabled = status === 'enabled';
      const id = e(item.id);
      return '<tr data-config-row="' + id + '"><td class="table-main">' + e(item.name) + '</td>' +
        (isRules ? '<td><code data-config-rule-id>' + id + '</code></td>' : '') + '<td>' + e(typeLabel(item,types)) + '</td>' +
        '<td><span class="sc-version" data-config-current-version>' + e(versionLabel(item.version)) + '</span></td>' +
        '<td><span class="sc-list-state" data-config-status="' + status + '">' +
        statusLabels[status] + '</span>' +
        (item.requiresReview ? '<small class="sc-note" data-config-review-required> · 待核对新版</small>' : '') + '</td>' +
        '<td>' + (Number.isFinite(date) ? e(dateTime.format(date)) : '—') + '</td>' +
        '<td><div class="table-actions sc-config-row-actions">' +
        '<button type="button" class="btn-link" data-config-view="' + id + '"' +
        (isRules ? '' : ' data-config-versions="' + id + '"') + '>查看</button>' +
        '<button type="button" class="btn-link" data-config-edit="' + id + '">编辑</button>' +
        '<button type="button" class="btn-link" data-config-copy="' + id + '">复制</button>' +
        '<button type="button" class="btn-link" data-config-toggle="' + id + '">' + (enabled ? '停用' : '启用') + '</button>' +
        '<button type="button" class="btn-link" data-config-delete="' + id + '">删除</button>' +
        '</div></td></tr>';
    }).join('');
    const host = root.querySelector('[data-config-body]');
    const canCreate = types.length > 0;
    const canViewRecords = page.kind === 'deliveryTemplates' && window.DSkynetDeliveryRecords?.canView('sent');
    const toolbar = '<div class="list-toolbar sc-list-toolbar"><label class="sc-type-filter"><span>二级分类</span>' +
      '<select data-config-type-filter>' + options([emptyOption('全部二级分类'),...filterTypes.values()],view.categoryFilter) + '</select></label>' +
      '<label class="sc-type-filter"><span>状态</span><select data-config-status-filter>' +
      options([emptyOption('全部状态'),...Object.entries(statusLabels).map(([value,label]) => ({value,label}))],view.statusFilter) +
      '</select></label>' +
      (canCreate || canViewRecords ? '<div class="sc-list-actions">' +
        (canViewRecords ? '<button type="button" class="btn" data-skynet-sent-ledger>下发记录</button>' : '') +
        (canCreate ? '<button type="button" class="btn btn-primary" data-config-new>新建' + e(page.name) + '</button>' : '') +
        '</div>' : '') + '</div>';
    host.innerHTML = '<div class="table-card" data-config-list>' + toolbar +
      '<div class="table-scroll" role="region" tabindex="0" aria-label="' + e(page.name) + '列表">' +
      '<table class="platform-table"><thead><tr><th scope="col">' + e(page.name) + '名称</th>' +
      (isRules ? '<th scope="col">分配规则 ID</th>' : '') +
      '<th scope="col">二级分类</th><th scope="col">当前版本</th><th scope="col">状态</th>' +
      '<th scope="col">更新时间</th><th scope="col">操作</th></tr></thead>' +
      '<tbody>' + (rows || '<tr><td class="sc-empty" colspan="' + (isRules ? 7 : 6) + '">' + (view.categoryFilter || view.statusFilter ? '当前筛选条件下暂无' : '暂无') +
        e(page.name) + '</td></tr>') +
      '</tbody></table></div></div>';
    host.querySelector('[data-config-type-filter]').onchange = event => {
      view.categoryFilter = event.target.value;
      displayList(view);
      host.querySelector('[data-config-type-filter]').focus({preventScroll:true});
    };
    host.querySelector('[data-config-status-filter]').onchange = event => {
      view.statusFilter = event.target.value;
      displayList(view);
      host.querySelector('[data-config-status-filter]').focus({preventScroll:true});
    };
    host.querySelector('[data-config-new]')?.addEventListener('click', () => {
      if (page.kind === 'rules') openRuleType(view);
      else openEditor(view,null);
    });
    host.querySelector('[data-skynet-sent-ledger]')?.addEventListener('click', event => {
      if (active(view)) window.DReview21InlineHandoff.openSkynetLedger('sent',{trigger:event.currentTarget});
    });
    host.querySelectorAll('[data-config-view],[data-config-edit],[data-config-copy],[data-config-toggle],[data-config-delete]')
      .forEach(button => {
        button.onclick = () => {
          if (!active(view)) return;
          const row = button.closest('[data-config-row]');
          const item = catalog.current(view.book,page.kind,row.dataset.configRow);
          if (!item) return;
          if (button.hasAttribute('data-config-view')) return openEditor(view,item,true);
          if (button.hasAttribute('data-config-edit')) return editConfiguration(view,item);
          if (button.hasAttribute('data-config-copy')) return confirmCopy(view,item);
          if (button.hasAttribute('data-config-delete')) {
            const nextRow = row.nextElementSibling || row.previousElementSibling;
            return confirmDelete(view,item,nextRow?.dataset.configRow);
          }
          const enabled = configurationState(item) !== 'enabled';
          const result = applyListChange(view,item,catalog.setEnabled,enabled);
          if (result.error) return DUI.toast(result.error);
          if (view.statusFilter) view.statusFilter = configurationState(result.value);
          displayList(view);
          focusListAction(view,'toggle',result.value.id);
          DUI.toast(view.page.name + (enabled ? '已启用' : '已停用'));
        };
      });
    root.dataset.configReady = 'true';
  }

  function focusListAction(view,action,id) {
    const rowButton = id && view.root.querySelector('[data-config-' + action + '="' + CSS.escape(id) + '"]');
    (rowButton || view.root.querySelector('[data-config-new],[data-config-type-filter]'))?.focus({preventScroll:true});
  }

  function applyListChange(view,item,operation,...args) {
    if (!active(view) || !DReview21.isLatest(view.state)) return {error:DReview21.saveFailure(view.state)};
    const previous = view.state.skynetConfig;
    const result = operation(view.state,DSession.context(),view.page.kind,item.id,item.version,...args);
    if (result.error) return result;
    if (!DReview21.save(view.state)) {
      if (previous === undefined) delete view.state.skynetConfig;
      else view.state.skynetConfig = previous;
      return {error:DReview21.saveFailure(view.state,'配置未保存，请重试。')};
    }
    view.book = catalog.read(view.state);
    return result;
  }

  function editConfiguration(view,item) {
    if (view.page.kind === 'rules') openFlow(view,item);
    else openEditor(view,item);
  }

  function confirmCopy(view,item) {
    const modal = DUI.dialog('复制' + view.page.name,
      '<p>确认后将创建「' + e(item.name) + '」的副本，并打开编辑窗口。</p><p class="form-error" role="alert"></p>',[
        {label:'取消',run:close => close()},
        {label:'确认复制',primary:true,run:close => {
          if (!active(view)) return close();
          const result = applyListChange(view,item,catalog.copyConfig);
          if (result.error) {
            modal.element.querySelector('[role="alert"]').textContent = result.error;
            return;
          }
          close();
          displayList(view);
          focusListAction(view,'edit',result.value.id);
          editConfiguration(view,result.value);
        }}
      ],{stack:true,dismissible:true});
    modal.buttons[1].dataset.configConfirmCopy = '';
    containDialogFocus(modal);
  }

  function confirmDelete(view,item,nextId) {
    const modal = DUI.dialog('删除' + view.page.name,
      '<p>确认删除「' + e(item.name) + '」？已绑定任务继续沿用原版本。</p><p class="form-error" role="alert"></p>',[
        {label:'取消',run:close => close()},
        {label:'确认删除',run:close => {
          if (!active(view)) return close();
          const result = applyListChange(view,item,catalog.remove);
          if (result.error) {
            modal.element.querySelector('[role="alert"]').textContent = result.error;
            return;
          }
          close();
          displayList(view);
          focusListAction(view,'view',nextId);
          DUI.toast(view.page.name + '已删除');
        }}
      ],{stack:true,dismissible:true});
    modal.buttons[1].classList.add('btn-danger');
    modal.buttons[1].dataset.configConfirmDelete = '';
    containDialogFocus(modal);
  }

  function displayEditor(view, restorePath) {
    const {page,book,draft,expected,readOnly,body} = view;
    const current = draft.id ? catalog.current(book,page.kind,draft.id) : null;
    const versions = readOnly ? book[page.kind].filter(item => item.id === draft.id).slice().reverse() : [];
    const versionBar = readOnly ?
      '<label class="sc-field"><span>查看版本</span><select data-config-history>' +
      options(versions.map(item => ({value:item.version,label:versionLabel(item.version) +
        (item.isCurrent ? ' · 当前' : ' · 历史')})),expected) + '</select></label>' : '';
    body.innerHTML = '<div class="sc-version-bar">' + versionBar +
      '<p class="sc-selector-status">当前版本 <strong>' + (current ? e(versionLabel(current.version)) : '尚未保存') +
      '</strong>' + (current ? ' · <span class="sc-list-state" data-config-status="' + configurationState(draft) + '">' +
        statusLabels[configurationState(draft)] + '</span>' : '') + '</p></div>' +
      (readOnly ? '' : '<p class="sc-draft-help">保存草稿可保留未完成配置，草稿不参与业务处理。配置完整后可保存并启用。</p>') +
      '<form data-skynet-config-form novalidate>' + configFields(view) + '</form>';
    if (!readOnly && view.saveButton) view.saveButton.textContent = configurationState(draft) === 'draft' ? '保存并启用' : '保存';
    bindEditor(view);
    focusField(body,restorePath);
    return body.querySelector('form');
  }

  function focusField(host, restorePath) {
    if (restorePath) {
      const field = Array.from(host.querySelectorAll('[data-config-path]')).find(node => node.dataset.configPath === restorePath);
      const basic = field?.closest('.sc-workspace-template');
      if (basic) basic.open = true;
      field?.focus({preventScroll:true});
      return field;
    }
  }

  function selectDraft(view, item) {
    const selected = view.list.categoryFilter || category.categoryId;
    const initial = catalog.businessType(view.context,selected)?.value || catalog.businessTypes(view.context)[0]?.value || '';
    if (!item) view.draft = initialDraft(view.page.kind,initial);
    else view.draft = view.page.kind === 'rules' ? catalog.ruleForEditing(item) : structuredClone(item);
    view.expected = item?.version;
    view.savedData = JSON.stringify(view.draft);
    if (!view.readOnly && view.page.kind === 'nurtureTemplates') view.draft = catalog.nurtureTemplateForEditing(view.draft);
    displayEditor(view);
  }

  function active(view) {
    return view.root.isConnected && DApp.currentPage() === view.page.id &&
      identity(DSession.context()) === view.identity && catalog.canManage(DSession.context());
  }

  function editing(view) {
    return view.modal.element.isConnected && active(view);
  }

  function containDialogFocus(modal) {
    modal.element.addEventListener('keydown', event => {
      if (event.key !== 'Tab' || event.defaultPrevented) return;
      const controls = [...modal.element.querySelectorAll('button,input,select,textarea,summary,a[href],[tabindex]')]
        .filter(node => node.tabIndex >= 0 && !node.matches(':disabled') && node.getClientRects().length);
      const first = controls[0], last = controls.at(-1);
      if ((!event.shiftKey && event.target === last) || (event.shiftKey && event.target === first)) {
        event.preventDefault();
        (event.shiftKey ? last : first)?.focus();
      }
    });
  }

  function openEditor(list, item, readOnly = false) {
    if (!active(list) || (readOnly && !item)) return;
    const view = {...list,list,readOnly};
    const title = readOnly ? '查看' + list.page.name : (item ? '编辑' : '新建') + list.page.name;
    const actions = [{label:readOnly ? '关闭' : '取消',run:() => cancel(view)}];
    if (!readOnly) actions.push(
      {label:'保存草稿',run:() => save(view,true)},
      {label:item && configurationState(item) === 'draft' ? '保存并启用' : '保存',primary:true,run:() => save(view)}
    );
    view.modal = DUI.dialog(title,'<div class="sc-modal"></div>',actions,{
      drawer:list.page.kind !== 'deliveryTemplates',stack:true,dismissible:true
    });
    view.modal.element.querySelector('.d-dialog').classList.add('skynet-config','skynet-config-popup');
    view.modal.buttons[0].dataset.configCancel = '';
    if (!readOnly) {
      view.modal.buttons[1].dataset.configSaveDraft = '';
      view.modal.buttons[2].dataset.configSave = '';
      view.saveButton = view.modal.buttons[2];
      view.feedbackNode = document.createElement('p');
      view.feedbackNode.dataset.configFeedback = '';
      view.feedbackNode.setAttribute('role','alert');
      view.modal.element.querySelector('footer').prepend(view.feedbackNode);
    }
    containDialogFocus(view.modal);
    view.body = view.modal.element.querySelector('.sc-modal');
    selectDraft(view,item);
    view.body.querySelector(readOnly ? '[data-config-history]' : '[name="name"]')?.focus();
    DApp.setDraftGuard({
      isDirty:() => !readOnly && editing(view) && (dirty(view) || view.deliveryEditor?.isDirty()),
      discard:() => closeEditor(view),
      save:() => save(view)
    });
  }

  function openDeliveryTemplate(view,parentName) {
    const {categoryId} = view.draft;
    if (!editing(view) || view.readOnly || !categoryId || view.deliveryEditor) return;
    const staged = view.deliveryDraft?.categoryId === categoryId ? view.deliveryDraft : null;
    const drafts = new Map();
    if (staged) drafts.set(staged.id,structuredClone(staged));
    const newId = 'draft:deliveryTemplates';
    const initialId = view.draft.deliveryTemplateId;
    let selectedId = initialId;
    const linkedDraft = storedConfiguration(view.book,'deliveryTemplates',initialId);
    const resumesDraft = linkedDraft?.categoryId === categoryId && !linkedDraft.deletedAt && configurationState(linkedDraft) === 'draft';
    if (resumesDraft && !drafts.has(initialId)) drafts.set(initialId,structuredClone(linkedDraft));
    let editingTemplate = selectedId === newId || resumesDraft;
    const savedTemplate = id => {
      const template = storedConfiguration(view.book,'deliveryTemplates',id);
      return template?.categoryId === categoryId ? template : undefined;
    };
    const selectedTemplate = () => drafts.get(selectedId) || savedTemplate(selectedId);
    const changed = draft => JSON.stringify(draft) !== JSON.stringify(draft.id === staged?.id ? staged : savedTemplate(draft.id));
    const isDirty = () => selectedId !== initialId || [...drafts.values()].some(changed);
    const feedback = document.createElement('p');
    feedback.dataset.configFeedback = '';
    feedback.setAttribute('role','alert');
    const close = () => {
      modal.close();
      delete view.deliveryEditor;
    };
    const useTemplate = (asDraft = false) => {
      if (!editing(view) || view.draft.categoryId !== categoryId) return;
      const template = selectedTemplate();
      const resumeDraft = selectedId === initialId && drafts.has(selectedId) && configurationState(template) === 'draft';
      if (!template || template.categoryId !== categoryId || (!resumeDraft && configurationState(template) !== 'enabled') || template.deletedAt) {
        feedback.textContent = '请选择已启用的下发模板。';
        return;
      }
      if (drafts.has(selectedId) && (changed(template) || resumeDraft)) {
        const prepared = catalog.prepareFlow(view.state,DSession.context(),{deliveryTemplates:[template]},
          {requireDeliveryRouting:true,asDraft});
        if (prepared.error) {
          feedback.textContent = prepared.error;
          return;
        }
        view.deliveryDraft = structuredClone(template);
      }
      view.draft.deliveryTemplateId = selectedId;
      close();
      displayEditor(view).querySelector('[data-config-delivery-reference] [data-config-edit-delivery]')?.focus();
    };
    const title = ['配置下发模板',parentName].filter(Boolean).join(' · ');
    const modal = DUI.dialog(title,'<div class="sc-modal"></div>',[
      {label:'取消',run:() => {
        if (!isDirty()) return close();
        confirmStrategyChange(modal.element,'内容尚未保存','关闭弹窗会放弃本次修改。','放弃修改',close);
      }},
      {label:'暂存草稿',run:() => useTemplate(true)},
      {label:'引用此模板',primary:true,run:() => useTemplate()}
    ],{stack:true,dismissible:true});
    modal.buttons[1].dataset.configDeliveryStageDraft = '';
    modal.element.querySelector('.d-dialog').classList.add('skynet-config','skynet-config-popup');
    modal.element.querySelector('footer').prepend(feedback);
    view.deliveryEditor = {close,isDirty,feedback};
    containDialogFocus(modal);
    const host = modal.element.querySelector('.sc-modal');
    function render(focusEditor = false) {
      const templates = templateOptions(view.book,'deliveryTemplates',categoryId,selectedId);
      if (drafts.has(newId)) templates.push({value:newId,label:(drafts.get(newId).name || '未命名下发模板') + '（未保存）'});
      const picked = selectedTemplate();
      host.innerHTML = '<p class="sc-draft-help">暂存草稿可保留未完成的下发配置，返回后点击培育模板的“保存草稿”一并保存。</p>' +
        '<div class="sc-grid" data-config-delivery-chooser>' +
        select(['deliveryTemplateId'],selectedId,'引用已有下发模板',
          [emptyOption('请选择下发模板'),...templates]) + '<div class="sc-inline-tools">' +
        '<button type="button" class="btn" data-config-create-delivery>' +
        (drafts.has(newId) ? '编辑新建下发模板' : '新建下发模板') + '</button>' +
        (picked && (configurationState(picked) === 'enabled' || picked.id === initialId && configurationState(picked) === 'draft') &&
          !picked.deletedAt && !editingTemplate && picked.id !== newId ?
          '<button type="button" class="btn" data-config-edit-selected-delivery>编辑所选模板</button>' : '') +
        '</div></div><div data-config-delivery-editor></div>';
      const picker = host.querySelector('[name="deliveryTemplateId"]');
      picker.onchange = () => {
        selectedId = picker.value;
        editingTemplate = selectedId === newId;
        feedback.textContent = '';
        render();
      };
      host.querySelector('[data-config-create-delivery]').onclick = () => {
        if (!drafts.has(newId)) drafts.set(newId,{...initialDraft('deliveryTemplates',categoryId),id:newId});
        selectedId = newId;
        editingTemplate = true;
        feedback.textContent = '';
        render(true);
      };
      const edit = host.querySelector('[data-config-edit-selected-delivery]');
      if (edit) edit.onclick = () => {
        if (!drafts.has(selectedId)) drafts.set(selectedId,structuredClone(picked));
        editingTemplate = true;
        render(true);
      };
      if (editingTemplate && picked) {
        const editor = host.querySelector('[data-config-delivery-editor]');
        mountFields({host:editor,kind:'deliveryTemplates',draft:drafts.get(selectedId),book:view.book,
          context:view.context,state:view.state,onChange:() => {feedback.textContent = '';}});
        if (focusEditor) editor.querySelector('[name="name"]')?.focus();
      }
      if (!focusEditor) picker.focus();
    }
    render();
  }

  function dirty(view) {
    return JSON.stringify(view.draft) !== view.savedData ||
      Boolean(view.deliveryDraft && view.draft.deliveryTemplateId === view.deliveryDraft.id);
  }

  function closeEditor(view) {
    view.deliveryEditor?.close();
    view.modal.close();
    DApp.setDraftGuard(null);
  }

  function cancel(view) {
    if (!editing(view) || view.readOnly || !dirty(view)) return closeEditor(view);
    const confirm = DUI.dialog('内容尚未保存','<p>关闭弹窗会放弃本次修改。</p>',[
      {label:'继续编辑',run:close => close()},
      {label:'放弃修改',run:close => {close();closeEditor(view);}}
    ],{stack:true,dismissible:true});
    confirm.buttons[1].dataset.configDiscard = '';
    containDialogFocus(confirm);
  }

  function report(view, message) {
    view.feedbackNode.textContent = message;
  }

  function save(view,asDraft = false) {
    if (!editing(view) || view.readOnly) return false;
    if (view.deliveryEditor) {
      view.deliveryEditor.feedback.textContent = '请先确认下发模板。';
      return false;
    }
    if (!DReview21.isLatest(view.state)) {
      report(view,'当前配置已在其他页面更新，请刷新后重新编辑。');
      return false;
    }
    if (view.expected && catalog.current(view.book,view.page.kind,view.draft.id)?.version !== view.expected) return false;
    const status = configurationState(view.draft);
    const changesStatus = asDraft ? status !== 'draft' : status === 'draft';
    if (view.expected && !dirty(view) && !changesStatus) {
      closeEditor(view);
      DUI.toast(asDraft ? view.page.name + '已保存草稿。' : '当前配置没有修改。');
      return true;
    }
    const previous = view.state.skynetConfig;
    const linkedDelivery = view.page.kind === 'nurtureTemplates' ?
      catalog.current(view.book,'deliveryTemplates',view.draft.deliveryTemplateId) : null;
    const staged = view.deliveryDraft || (status === 'draft' && configurationState(linkedDelivery) === 'draft' ? linkedDelivery : null);
    let result;
    if (staged && view.draft.deliveryTemplateId === staged.id) {
      const nurture = {...view.draft,id:view.draft.id || 'draft:nurtureTemplates'};
      const prepared = catalog.prepareFlow(view.state,DSession.context(),{
        deliveryTemplates:[staged],nurtureTemplates:[nurture]
      },{requireDeliveryRouting:true,asDraft});
      if (prepared.error) {
        report(view,prepared.error);
        return false;
      }
      result = {value:catalog.current(prepared.book,'nurtureTemplates',prepared.idMap[nurture.id] || nurture.id)};
      view.state.skynetConfig = prepared.book;
    } else {
      result = catalog.save(view.state,DSession.context(),view.page.kind,view.draft,view.expected,
        {requireDeliveryRouting:true,asDraft});
    }
    if (result.error) {
      report(view,result.error);
      return false;
    }
    if (!DReview21.save(view.state)) {
      if (previous === undefined) delete view.state.skynetConfig;
      else view.state.skynetConfig = previous;
      report(view,DReview21.saveFailure(view.state,'保存失败，请重试。'));
      return false;
    }
    view.list.book = catalog.read(view.state);
    if (view.list.categoryFilter) view.list.categoryFilter = result.value.categoryId;
    if (view.list.statusFilter) view.list.statusFilter = configurationState(result.value);
    closeEditor(view);
    displayList(view.list);
    view.root.querySelector('[data-config-edit="' + CSS.escape(result.value.id) + '"]')?.focus();
    DUI.toast(view.page.name + (asDraft ? '已保存草稿 ' : status === 'draft' ? '已保存并启用 ' : '已保存 ') + versionLabel(result.value.version));
    return true;
  }

  function newCondition(view,purpose,path) {
    const field = fieldsForConditionPath(view,purpose,path).find(item => item !== catalog.unlimitedStrategyField);
    const operator = fieldOperators(field)[0].value;
    return {field:field.key,operator,...(unaryOperator(operator) ? {} : {value:''})};
  }

  function arrayAction(view, button) {
    const path = JSON.parse(button.dataset.configArray);
    const operation = button.dataset.configOperation;
    const current = pathValue(view.draft,path);
    const rows = current ?? [];
    if (current === undefined) setPath(view.draft,path,rows);
    const index = Number(button.dataset.configIndex);
    const nurtureRuleList = path.length === 1 && path[0] === 'rules';
    if (operation === 'remove') {
      if (nurtureRuleList && !canRemoveNurtureRule(rows,index)) return index;
      rows.splice(index,1);
      if (nurtureRuleList && index === 0) setPath(view.draft,path,catalog.intakeFirstRules(rows));
    } else if (operation === 'up' || operation === 'down') {
      const direction = operation === 'up' ? -1 : 1;
      const second = nurtureRuleList ? adjacentNurtureRule(rows,index,direction) : index + direction;
      if (second < 0 || second >= rows.length) return index;
      [rows[index],rows[second]] = [rows[second],rows[index]];
      if (path[0] === 'nodes') {
        rows.forEach((node,position) => {
          const following = new Set(rows.slice(position + 1).map(item => item.id));
          Object.values(node.branches).forEach(branch => {
            if (branch.next && !following.has(branch.next)) delete branch.next;
          });
        });
      }
      return second;
    } else if (operation === 'direct-delivery-value-add') {
      rows.push({fieldId:'',value:''});
    } else if (operation === 'condition-delivery') {
      const fields = (path[0]==='aiCriteria' ? catalog.aiDeliveryRuleFieldsFor : catalog.deliveryRuleFieldsFor)(view.context,view.draft.categoryId);
      const condition=nextDeliveryField(fields,rows);
      if (condition) rows.push(condition);
    } else if (operation.startsWith('condition-')) rows.push(newCondition(view,operation.slice(10),path));
    else if (operation === 'nurture-action') {
      rows.push('人工外呼');
      pathValue(view.draft,path.slice(0,-1)).manualAssignment ||= defaultManualAssignment();
    } else if (operation === 'manual-filter') {
      const random = rows.indexOf('random');
      rows.splice(random<0 ? rows.length : random,0,'');
    }
    return index;
  }

  function confirmStrategyChange(form,title,message,confirmLabel,apply) {
    const confirmation = DUI.dialog(title,'<p>' + e(message) + '</p>',[
      {label:'取消',run:close => close()},
      {label:confirmLabel,primary:true,run:close => {
        close();
        if (form.isConnected) apply();
      }}
    ],{stack:true,dismissible:true});
    containDialogFocus(confirmation);
  }

  function openDeliveryRuleDialog(view,button,form,render,onChange) {
    const path = JSON.parse(button.dataset.configArray);
    const type = path.at(-1);
    const label = catalog.deliveryTypes.find(item => item.value === type)?.label;
    if (!label) return;
    const index = pathValue(view.draft,path)?.length || 0;
    const {categoryId} = view.draft;
    const ai = path[0]==='aiCriteria';
    const ruleFields=()=> (ai ? catalog.aiDeliveryRuleFieldsFor : catalog.deliveryRuleFieldsFor)(view.context,categoryId);
    const rule = {logic:'and',conditions:[nextDeliveryField(ruleFields(),[])]};
    const scratch = {categoryId,[path[0]]:{[type]:[rule]}};
    const rulePath = [...path,0];
    const modal = DUI.dialog('新增' + (ai?'AI 外呼 · ':'') + label + '规则 · 第 ' + (index + 1) + ' 条','<div class="sc-modal"></div>',[
      {label:'取消',run:close => close()},
      {label:'添加规则',primary:true,run:apply}
    ],{stack:true,dismissible:true});
    modal.element.querySelector('.d-dialog').classList.add('skynet-config','skynet-config-popup');
    containDialogFocus(modal);
    const host = modal.element.querySelector('.sc-modal');
    const feedback = document.createElement('p');
    feedback.dataset.configFeedback = '';
    feedback.setAttribute('role','alert');
    modal.element.querySelector('footer').prepend(feedback);
    function apply() {
      if (!form.isConnected) return modal.close();
      const result = catalog.validateDeliveryRule(rule,type,index,view.context,categoryId,ai);
      if (result.error) {
        feedback.textContent = result.error;
        return;
      }
      view.draft[path[0]] ??= catalog.defaultDeliveryCriteria();
      pathValue(view.draft,path).push(result.value);
      modal.close();
      const refreshed = render();
      focusField(refreshed,JSON.stringify([...path,index,'conditions',0,'field']));
      onChange();
    }
    function renderRule(restorePath) {
      host.innerHTML = '<form novalidate' + (ai?' data-config-ai-delivery':'') + '>' + deliveryRuleFields(rule,rulePath,ruleFields()) + '</form>';
      const fields = host.querySelector('form');
      fields.onsubmit = event => {event.preventDefault(); apply();};
      bindFields({...view,draft:scratch},fields,renderRule,() => {feedback.textContent = '';});
      if (restorePath) focusField(fields,restorePath);
      return fields;
    }
    renderRule().querySelector('[name="logic"]')?.focus();
  }

  function openStrategyDraft(view,parentForm,title,node,options,apply) {
    const {parent,fixedCold,legacy = false,fixedEvent} = options;
    const strategyPreviousMethod = parent?.actions.find(action => action !== '继续');
    const strategyPreviousTargetId = parent?.[catalog.outboundFields[strategyPreviousMethod]?.id];
    const {categoryId} = view.draft;
    const draft = {categoryId,strategyTree:!legacy,roundFlow:view.draft.roundFlow,rules:[node]};
    const child = {...view,draft,strategyPreviousMethod,strategyPreviousTargetId};
    const path = ['rules',0];
    const confirm = close => {
      if (!parentForm.isConnected) return close();
      const checked = catalog.validateStrategyDraft(view.state,DSession.context(),view.book,categoryId,node,{
        previousMethod:strategyPreviousMethod,previousTargetId:strategyPreviousTargetId,legacy
      });
      if (checked.error) {
        feedback.textContent = checked.error;
        return;
      }
      close();
      apply(checked.value);
    };
    const modal = DUI.dialog(title,'<div class="sc-modal" data-config-strategy-popup></div>',[
      {label:'取消',run:close => close()},
      {label:'确认添加',primary:true,run:confirm}
    ],{stack:true,dismissible:true});
    modal.element.querySelector('.d-dialog').classList.add('skynet-config','skynet-config-popup');
    modal.buttons[1].dataset.configApplyStrategy = '';
    const host = modal.element.querySelector('[data-config-strategy-popup]');
    const feedback = document.createElement('p');
    feedback.dataset.configFeedback = '';
    feedback.setAttribute('role','alert');
    modal.element.querySelector('footer').prepend(feedback);
    containDialogFocus(modal);
    const render = restorePath => {
      host.innerHTML = '<form class="sc-form" novalidate>' +
        (legacy ? flatNurtureFields(child,node,path,{fixedEvent,fixedCold}) :
          strategyFields(child,node,path,!parent,fixedCold)) + '</form>';
      const form = host.firstElementChild;
      form.onsubmit = event => {event.preventDefault();confirm(modal.close);};
      bindFields(child,form,render,() => {feedback.textContent = '';});
      if (restorePath) focusField(form,restorePath);
      return form;
    };
    render().querySelector('[name="strategyName"],[name="event"],[name="action"]')?.focus();
  }

  function openFlatNurtureDraft(view,form,cold,render,onChange) {
    const index = view.draft.rules.length;
    const rule = {
      event:index ? catalog.roundCompleteEvent : '接入后',logic:'and',conditions:[],
      actions:[cold ? '转冷线索' : '人工外呼'],
      ...(cold ? {} : {manualAssignment:defaultManualAssignment()})
    };
    const title = (cold ? '新增转冷规则' : '新增培育规则') + ' · 第 ' + (index + 1) + ' 条';
    openStrategyDraft(view,form,title,rule,{legacy:true,fixedCold:cold,fixedEvent:index === 0},value => {
      view.draft.rules.push(value);
      focusField(render(),JSON.stringify(['rules',index,cold ? 'coldRuleId' : 'logic']))?.scrollIntoView({block:'nearest'});
      onChange();
    });
  }

  function operateStrategy(view,controlElement,form,render,onChange) {
    const path = JSON.parse(controlElement.dataset.configArray);
    const rows = pathValue(view.draft,path);
    const operation = controlElement.dataset.configOperation;
    const index = Number(controlElement.dataset.configIndex);
    const refresh = (focusPath,strategyId) => {
      if (strategyId && view.inFlow) strategyWorkspaceSelections.set(view.draft,String(strategyId));
      const refreshed = render();
      const field = focusPath && focusField(refreshed,JSON.stringify(focusPath));
      if (field) field.scrollIntoView({block:'nearest'});
      else if (strategyId) refreshed.querySelector('[data-config-strategy-node="' + CSS.escape(strategyId) + '"]')
        ?.querySelector(':scope > summary, :scope > div > [data-config-strategy-select]')?.focus();
      else (refreshed.querySelector('[data-config-strategy-select][aria-current="true"]') ||
        refreshed.querySelector('[data-config-strategy-node][open] > summary') ||
        refreshed.querySelector('[data-config-strategy-group="root"] button[data-config-operation="strategy-add"]'))?.focus({preventScroll:true});
      onChange();
    };
    const remove = operation === 'strategy-remove' || operation === 'strategy-remove-next';
    if (remove) {
      const wholeGroup = operation === 'strategy-remove-next';
      const keepDelivery = wholeGroup && usesTemplateDelivery(view);
      const node = rows[index];
      if (!wholeGroup && !node) return;
      const apply = () => {
        let selection;
        if (view.inFlow) {
          const parent = path.length > 1 ? pathValue(view.draft,path.slice(0,-1)) : null;
          if (wholeGroup) selection = parent?.id;
          else {
            const peers = node.fallback ? strategyPeers(rows,!parent,false) :
              strategyPeers(rows,!parent,isDeliveryStrategy(node)).filter(position => position !== index);
            const next = peers.find(position => position > index) ?? peers.at(-1);
            const sibling = rows[next] || (!node.fallback && !isDeliveryStrategy(node) && rows.find(rule=>rule.fallback));
            selection = sibling?.id || parent?.id;
          }
        }
        if (wholeGroup) setPath(view.draft,path,keepDelivery ? rows.filter(isDeliveryStrategy) : []);
        else rows.splice(index,1);
        refresh(wholeGroup && !view.inFlow ? [...path.slice(0,-1),'name'] : null,selection);
      };
      if (wholeGroup || node.children.length) {
        const headline = wholeGroup ? (keepDelivery ? '清空后续培育' : '清空本轮结束后的配置') : '移除策略';
        confirmStrategyChange(form,headline,'保存后，移除的规则将在本次配置中失效。','移除',apply);
      } else apply();
      return;
    }
    if (operation === 'strategy-up' || operation === 'strategy-down') {
      if (!rows[index] || rows[index].fallback) return;
      const peers = strategyPeers(rows,path.length === 1,isDeliveryStrategy(rows[index]));
      const next = peers[peers.indexOf(index) + (operation === 'strategy-up' ? -1 : 1)];
      if (next === undefined) return;
      [rows[index],rows[next]] = [rows[next],rows[index]];
      refresh([...path,next,'name']);
      return;
    }

    const cold = operation === 'strategy-add-cold';
    const fallback = operation === 'strategy-add-fallback';
    if (!cold && !fallback && operation !== 'strategy-add') return;
    const parent = path.length === 1 ? null : pathValue(view.draft,path.slice(0,-1));
    const event = parent ? catalog.roundCompleteEvent : '接入后';
    const fallbackIndex = rows.findIndex(node => node.fallback);
    if (fallback && fallbackIndex >= 0) return;
    const position = fallback || fallbackIndex < 0 ? rows.length : fallbackIndex;
    const name = fallback ? '兜底策略' : cold ? '转冷线索' : '策略 ' + (position + 1);
    const action = cold ? '转冷线索' : '人工外呼';
    const node = newStrategyNode(event,name,{fallback,action});
    const contextLabel = parent ? ' · ' + (parent.name || '未命名策略') : fallback ? ' · 接入组' : '';
    const title = (fallback ? '新增兜底策略' : cold ? '新增转冷规则' : parent ? '新增后续策略' : '新增接入策略') + contextLabel;
    openStrategyDraft(view,form,title,node,{parent,fixedCold:cold},value => {
      rows.splice(position,0,value);
      refresh(fallback ? [...path,position,'actions'] : null,value.id);
    });
  }

  function bindStrategyExpansion(view,form) {
    if (!view.draft.strategyTree) return;
    const expanded = strategyExpansion(view.draft);
    form.addEventListener('toggle',event => {
      const id = event.target.dataset.configStrategyNode;
      if (!id) return;
      if (event.target.open) expanded.add(id);
      else expanded.delete(id);
    },true);
  }

  function rememberStrategyExpansion(view,form) {
    if (!view.draft.strategyTree) return;
    const expanded = strategyExpansion(view.draft);
    for (const node of form.querySelectorAll('details[data-config-strategy-node]')) {
      const id = node.dataset.configStrategyNode;
      if (node.open) expanded.add(id);
      else expanded.delete(id);
    }
  }

  function bindEditor(view) {
    const {body} = view;
    const form = body.querySelector('form');
    if (view.readOnly) {
      bindValuePickers(form);
      bindStrategyExpansion(view,form);
      body.querySelector('[data-config-history]').onchange = event => {
        const selected = catalog.version(view.book,view.page.kind,view.draft.id,event.target.value);
        if (selected) {
          selectDraft(view,selected);
          body.querySelector('[data-config-history]').focus({preventScroll:true});
        }
      };
      return;
    }
    form.onsubmit = event => { event.preventDefault(); save(view); };
    bindFields(view,form,restorePath => displayEditor(view,restorePath),() => {
      view.feedbackNode.textContent = '';
    });
  }

  function bindValuePickers(form) {
    const host = form.closest?.('.d-dialog') || form;
    if (boundValuePickerHosts.has(host) || !form.querySelector?.('[data-config-multivalue]')) return;
    boundValuePickerHosts.add(host);
    const closeOthers = event => {
      const selected = event.target.closest('[data-config-multivalue]');
      for (const picker of host.querySelectorAll('[data-config-multivalue][open]')) {
        if (picker !== selected) picker.open = false;
      }
    };
    host.addEventListener('click',closeOthers);
    host.addEventListener('keydown',event => {
      if (event.key !== 'Escape') return;
      const picker = event.target.closest('[data-config-multivalue][open]') ||
        host.querySelector('[data-config-multivalue][open]');
      if (!picker) return;
      picker.open = false;
      picker.querySelector('summary').focus();
      event.preventDefault();
      event.stopPropagation();
    });
  }

  function updateValuePicker(picker) {
    const labels = Array.from(picker.querySelectorAll('[data-config-standard-option]:checked'))
      .map(option => option.closest('label').textContent.trim());
    const summary = picker.querySelector('[data-config-multivalue-summary]');
    summary.textContent = summary.title = valuePickerText(labels);
    picker.querySelector('summary').setAttribute('aria-label','标准值 ' + summary.textContent);
    const count = picker.querySelector('[data-config-multivalue-count]');
    count.textContent = labels.length + ' 项';
    count.hidden = labels.length < 2;
    picker.toggleAttribute('data-config-has-values',Boolean(labels.length));
  }

  function bindOutboundTaskFields(view,form,render) {
    const blocks = [...form.querySelectorAll('[data-config-outbound-action]')];
    const sourcePaths = [...form.querySelectorAll('[data-config-strategy-condition-profile]')]
      .map(node => JSON.parse(node.dataset.configStrategyConditionProfile));
    const directory = window.DSkynetOutboundTargets;
    const aiDelivery=form.matches('[data-config-ai-delivery]') || Boolean(form.querySelector('[data-config-ai-delivery]'));
    if ((!blocks.length && !sourcePaths.length && !aiDelivery) || !directory) return;
    const profileSignature = () => JSON.stringify([sourcePaths.map(path=>strategyConditionProfile(view,path)),
      aiDelivery ? catalog.aiDeliveryOptions(view.context,view.draft.categoryId) : null]);
    let reading = false;
    function update() {
      if (!form.isConnected) return;
      const focusPath = form.ownerDocument.activeElement?.dataset.configPath;
      for (const block of blocks) {
        const path = JSON.parse(block.dataset.configOutboundPath);
        const rule = pathValue(view.draft,path);
        if (!rule) continue;
        block.innerHTML = outboundTaskField(rule,path,block.dataset.configOutboundAction,view.context,false);
        if (focusPath) focusField(block,focusPath);
      }
    }
    async function refresh() {
      if (reading) return;
      reading = true;
      const previousProfile = profileSignature();
      try {
        const pending = directory.load(view.context);
        update();
        await pending;
      } catch (_) { /* Directory status is shown next to each target field. */ }
      reading = false;
      if (form.isConnected && previousProfile !== profileSignature()) {
        rememberStrategyExpansion(view,form);
        render(form.ownerDocument.activeElement?.dataset.configPath);
        return;
      }
      update();
    }
    form.addEventListener('click',event => {
      if (event.target.closest('[data-config-reload-outbound]')) void refresh();
    });
    form.addEventListener('refresh-ai-scene-targets',refresh);
    void refresh();
  }

  function refreshAiSceneTargets() {
    const forms = new Set([...document.querySelectorAll('[data-config-outbound-action="AI 外呼"]')]
      .map(node=>node.closest('form')).filter(Boolean));
    for (const form of forms) form.dispatchEvent(new Event('refresh-ai-scene-targets'));
  }

  window.addEventListener('storage',event=>{
    if (event.key?.startsWith(DSession.prefix+'ai-config:tenant:')) refreshAiSceneTargets();
  });
  window.addEventListener('focus',refreshAiSceneTargets);

  function priorityPeers(rows,path,mode,from) {
    if (!Array.isArray(rows) || !rows[from] || rows[from].fallback) return [];
    if (mode === 'event') {
      return rows.flatMap((rule,index) => rule.event === rows[from].event ? [index] : []);
    }
    return strategyPeers(rows,path.length === 1,isDeliveryStrategy(rows[from]));
  }

  function movePriority(rows,peers,from,to,after) {
    const start = peers.indexOf(from);
    const target = peers.indexOf(to);
    if (start < 0 || target < 0 || start === target) return false;
    const insertion = target + Number(after) - Number(start < target);
    if (insertion === start) return false;
    const ordered = peers.map(index => rows[index]);
    ordered.splice(insertion,0,...ordered.splice(start,1));
    peers.forEach((index,position) => {rows[index] = ordered[position];});
    return true;
  }

  function bindPriorityDrag(view,form,render,onChange) {
    let source, marker;
    const clearMarker = () => {
      marker?.removeAttribute('data-config-priority-position');
      marker = null;
    };
    const clearDrag = () => {
      clearMarker();
      source?.removeAttribute('data-config-priority-dragging');
      source = null;
    };
    const targetInfo = event => {
      const header = event.target.closest('[data-config-priority-drop]');
      const row = header?.parentElement;
      if (!source || !row || row === source ||
          row.dataset.configPriorityRow !== source.dataset.configPriorityRow ||
          row.dataset.configPriorityPath !== source.dataset.configPriorityPath) return null;
      const path = JSON.parse(source.dataset.configPriorityPath);
      const rows = pathValue(view.draft,path);
      const from = Number(source.dataset.configPriorityIndex);
      const to = Number(row.dataset.configPriorityIndex);
      const peers = priorityPeers(rows,path,source.dataset.configPriorityRow,from);
      if (!peers.includes(to)) return null;
      const bounds = header.getBoundingClientRect();
      return {header,path,rows,from,to,peers,after:event.clientY >= bounds.top + bounds.height / 2};
    };
    form.addEventListener('dragstart', event => {
      const handle = event.target.closest('[data-config-priority-handle]');
      if (!handle || !event.dataTransfer) return;
      source = handle.closest('[data-config-priority-row]');
      if (!source) return;
      event.dataTransfer.setData('text/plain','priority');
      event.dataTransfer.effectAllowed = 'move';
      source.setAttribute('data-config-priority-dragging','');
    });
    form.addEventListener('dragover', event => {
      clearMarker();
      const target = targetInfo(event);
      if (!target) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
      marker = target.header;
      marker.setAttribute('data-config-priority-position',target.after ? 'after' : 'before');
    });
    form.addEventListener('dragleave', event => {
      if (marker?.contains(event.target) && !marker.contains(event.relatedTarget)) clearMarker();
    });
    form.addEventListener('drop', event => {
      const target = targetInfo(event);
      clearDrag();
      if (!target) return;
      event.preventDefault();
      const moved = target.rows[target.from];
      if (!movePriority(target.rows,target.peers,target.from,target.to,target.after)) return;
      const newIndex = target.rows.indexOf(moved);
      const refreshed = render();
      const row = [...refreshed.querySelectorAll('[data-config-priority-row]')].find(node =>
        node.dataset.configPriorityPath === JSON.stringify(target.path) &&
        Number(node.dataset.configPriorityIndex) === newIndex);
      (row?.querySelector(':scope > summary') ||
        row?.querySelector(':scope > [data-config-priority-drop] button:not([disabled])'))?.focus({preventScroll:true});
      onChange();
    });
    form.addEventListener('dragend',clearDrag);
  }

  function bindFields(view, form, render, onDraftChange = () => {}) {
    const hasDeliveryHandling = Boolean(form.querySelector('[data-config-delivery-behavior]'));
    const onChange = () => {
      if (hasDeliveryHandling) initializeDeliveryHandling(view.draft);
      onDraftChange();
    };
    bindValuePickers(form);
    bindOutboundTaskFields(view,form,render);
    bindStrategyExpansion(view,form);
    const nav = form.querySelector('[data-config-strategy-nav]');
    if (nav) {
      const selected = strategyWorkspaceSelections.get(view.draft);
      nav.querySelector('[data-config-strategy-select="' + CSS.escape(selected || '') + '"]')?.setAttribute('aria-current','true');
      const basic = form.querySelector('.sc-workspace-template');
      basic?.addEventListener('toggle',() => {
        if (!form.isConnected) return;
        if (basic.open) strategyWorkspaceBasicOpen.add(view.draft);
        else strategyWorkspaceBasicOpen.delete(view.draft);
      });
    }
    if (!view.readOnly && form.querySelector('[data-config-priority-handle]')) {
      bindPriorityDrag(view,form,render,onChange);
    }
    form.querySelectorAll('.sc-scope-help').forEach(help => {
      const trigger = help.querySelector('.sc-scope-trigger');
      const restore = () => help.removeAttribute('data-dismissed');
      help.addEventListener('pointerenter',restore);
      trigger.addEventListener('focus',restore);
      trigger.addEventListener('keydown',event => {
        if (event.key !== 'Escape' || help.hasAttribute('data-dismissed')) return;
        help.setAttribute('data-dismissed','');
        event.stopPropagation();
      });
    });
    form.oninput = event => {
      const element = event.target;
      if (!element.dataset.configPath || element.dataset.configReactive) return;
      const path = JSON.parse(element.dataset.configPath);
      const numeric = element.type === 'number' || path.at(-1) === 'windowMinutes';
      const value = element.type === 'checkbox' ? element.checked : path.at(-1)==='coldWindowDays' && element.value==='' ?
        '' : numeric ? Number(element.value) : element.value;
      if (path[0] === 'handlingByKind') initializeDeliveryHandling(view.draft)[path[1]] ||= emptyDeliveryHandling();
      setPath(view.draft,path,value);
      if (path.at(-1)==='value' || typeof path.at(-1)==='number' && path.at(-2)==='value') {
        reflectColdCallback(element,path.at(-1)==='value' ? path : path.slice(0,-1));
      }
      if (path.at(-1)==='coldWindowDays') {
        const scope = element.closest('[data-config-nurture-rule]') || form;
        const condition = scope.querySelector('[data-config-cold-window-condition]');
        if (condition) condition.textContent = coldWindowConditionText(value);
      }
      if (element.name === 'strategyName') {
        const title = value.trim() || '未命名策略';
        const summary = element.closest('[data-config-strategy-node]')?.querySelector('[data-config-strategy-title]') ||
          form.querySelector('[data-config-strategy-select][aria-current="true"] [data-config-strategy-title]');
        if (summary) summary.textContent = title;
        const heading = form.querySelector('.sc-workspace-heading h3');
        if (heading) heading.textContent = title;
      }
      onChange();
    };
    function reflectColdCallback(element,path) {
      const list = element.closest('[data-config-conditions]');
      const wrapper = element.closest('.sc-condition-row')?.querySelector('[data-config-cold-callback]');
      if (!list || !wrapper) return;
      const condition = pathValue(view.draft,path.slice(0,-1));
      const field = fieldsForConditionPath(view,list.dataset.configConditions,path.slice(0,-2)).find(item=>item.key===condition.field);
      wrapper.hidden = !catalog.coldCallbackSelected(condition,field);
    }
    form.onchange = event => {
      const element = event.target;
      if (element.dataset.configValues) {
        const group = form.querySelectorAll('[data-config-values]');
        const values = Array.from(group).filter(input => input.dataset.configValues === element.dataset.configValues && input.checked)
          .map(input => input.value);
        const path = JSON.parse(element.dataset.configValues);
        pathValue(view.draft,path.slice(0,-1)) || setPath(view.draft,path.slice(0,-1),{});
        setPath(view.draft,path,values);
        const picker = element.closest?.('[data-config-multivalue]');
        if (picker) updateValuePicker(picker);
        reflectColdCallback(element,path);
        onChange();
      }
      if (!element.dataset.configPath || !element.dataset.configReactive) return;
      const path = JSON.parse(element.dataset.configPath);
      const parentPath = path.slice(0,-1);
      const reactive = element.dataset.configReactive;
      if (path[0] === 'handlingByKind') initializeDeliveryHandling(view.draft)[path[1]] ||= emptyDeliveryHandling();
      if (reactive === 'external-query' && !pathValue(view.draft,parentPath)) {
        setPath(view.draft,parentPath,{...catalog.defaultExternalQuery});
      }
      const parent = pathValue(view.draft,parentPath);
      if (reactive === 'strategy-action' && parent.children.length &&
        !catalog.nurtureStrategyActions.includes(element.value)) {
        const action = element.value;
        element.value = parent.actions.find(value => value !== '继续') || '';
        confirmStrategyChange(form,'更改处理方式','切换后，此分支的下发规则和后续策略将从草稿移除。','确认更改',() => {
          parent.children = [];
          setPath(view.draft,path,[action]);
          rememberStrategyExpansion(view,form);
          render(element.dataset.configPath);
          onChange();
        });
        return;
      }
      setPath(view.draft,path,reactive === 'strategy-action' ? [element.value] : element.value);
      if (reactive === 'condition') {
        const purpose = element.closest('[data-config-conditions]').dataset.configConditions;
        const field = fieldsForConditionPath(view,purpose,path.slice(0,-2)).find(item => item.key === element.value);
        if (field === catalog.unlimitedStrategyField) {
          delete parent.operator;
          delete parent.value;
        } else {
          const operators = fieldOperators(field);
          if (!operators.some(operator => operator.value === parent.operator)) parent.operator = operators[0].value;
          if (unaryOperator(parent.operator)) delete parent.value;
          else parent.value = '';
        }
      } else if (reactive === 'delivery-condition-field') {
        parent.value = '';
        parent.operator = 'equal';
        delete parent.aiTagOptions;
      } else if (reactive === 'delivery-target-type' || reactive === 'delivery-audit') {
        if (reactive === 'delivery-target-type') {
          parent.deliveryTargetId = '';
          delete parent.application;
        }
        const headquartersOnly = parent.deliveryTargetType === 'internalTenant' && view.context.scope.tenant.organization === '门店';
        const autoExternal = parent.deliveryTargetType === 'externalSystem' &&
          [false,'disabled'].includes(parent.auditEnabled);
        if ((headquartersOnly || autoExternal) && parent.deliveryMode === 'oneToMany') {
          parent.deliveryMode = 'oneToOne';
        }
      } else if (reactive === 'direct-delivery-value-field') {
        delete parent.label;
      } else if (reactive === 'direct-delivery-target-type') {
        delete parent.directDeliveryTargetId;
        delete parent.directDeliveryApplication;
      } else if (reactive === 'delivery-application' || reactive === 'direct-delivery-target' || reactive === 'wecom-application') {
        const scenario = reactive === 'wecom-application' ? '转企微跟进' : '下发';
        const key = reactive === 'wecom-application' ? 'wecomApplication' :
          reactive === 'direct-delivery-target' ? 'directDeliveryApplication' : 'application';
        const resolved = element.value && window.DIntegrationApplications?.resolveScenarioApplication(view.context,scenario,element.value);
        if (resolved?.ok && resolved.status === 'available') parent[key] = structuredClone(resolved.application);
        else delete parent[key];
      } else if (reactive === 'manual-filter-step' && element.value === 'random') {
        parent.splice(path.at(-1),1);
        parent.push('random');
        rememberStrategyExpansion(view,form);
        render(JSON.stringify([...parentPath,parent.length-1]));
        onChange();
        return;
      } else if (reactive === 'condition-operator') {
        if (unaryOperator(element.value)) delete parent.value;
        else if (parent.value === undefined) parent.value = '';
      } else if (reactive === 'branch') {
        delete parent.next;
        delete parent.status;
        delete parent.reason;
        delete parent.nurtureTemplateId;
      } else if (reactive === 'category') {
        if (view.page.kind === 'nurtureTemplates') view.draft.deliveryTemplateId = '';
      } else if (reactive === 'nurture-action' && element.value === '人工外呼') {
        pathValue(view.draft,path.slice(0,-2)).manualAssignment ||= defaultManualAssignment();
      } else if (reactive === 'strategy-action' && element.value === '人工外呼') {
        parent.manualAssignment ||= defaultManualAssignment();
      }
      rememberStrategyExpansion(view,form);
      render(element.dataset.configPath);
      onChange();
    };
    form.onclick = event => {
      const pick = event.target.closest('[data-config-strategy-select]');
      if (pick) {
        const id = pick.dataset.configStrategySelect;
        if (strategyWorkspaceSelections.get(view.draft) !== id) {
          strategyWorkspaceSelections.set(view.draft,id);
          const refreshed = render();
          refreshed.querySelector('[data-config-strategy-select="' + CSS.escape(id) + '"]')?.focus();
        }
        return;
      }
      const rebind = event.target.closest('[data-config-rebind-application]');
      if (rebind) {
        const result = window.DIntegrationApplications?.resolveScenarioApplication(view.context,
          rebind.dataset.configApplicationScene,rebind.dataset.configApplicationId);
        if (!result?.ok || result.status !== 'available') return DUI.toast(result?.message || '应用当前不可用。');
        setPath(view.draft,JSON.parse(rebind.dataset.configRebindApplication),structuredClone(result.application));
        render();
        onChange();
        return;
      }
      const deliveryButton = event.target.closest('[data-config-edit-delivery]');
      if (deliveryButton) {
        openDeliveryTemplate(view,deliveryButton.dataset.configEditDelivery);
        return;
      }
      if (event.target.closest('[data-config-normalize-fallback]')) {
        confirmStrategyChange(form,'整理旧兜底配置','新草稿保留各组兜底的首个可用处理方式。兜底自身的后续组从新草稿移除，历史版本继续可查。','调整草稿',() => {
          Object.assign(view.draft,catalog.normalizeFallbackDraft(view.draft));
          render();
          onChange();
        });
        return;
      }
      if (event.target.closest('[data-config-convert-nurture-tree]')) {
        const convert = () => {
          Object.assign(view.draft,catalog.nurtureTreeDraft(view.draft));
          const form = render();
          (form.querySelector('[data-config-strategy-node] > summary') ||
            form.querySelector('[data-config-strategy-group="root"] button[data-config-operation="strategy-add"]'))?.focus();
          onChange();
        };
        if (view.draft.rules.some(rule => rule.event !== '接入后')) {
          confirmStrategyChange(form,'改用树形配置','接入策略会保留。请将原来的全局后续规则配置到相应的父策略下。','改用树形',convert);
        } else convert();
        return;
      }
      const convertFilters = event.target.closest('[data-config-convert-manual-filters]');
      if (convertFilters) {
        const rawPath = convertFilters.dataset.configManualPath;
        const rule = pathValue(view.draft,JSON.parse(rawPath));
        if (!rule?.actions.includes('人工外呼')) return;
        convertManualAssignment(rule);
        const refreshed = render();
        const panel = [...refreshed.querySelectorAll('[data-config-manual-assignment]')].find(
          node => node.dataset.configManualPath === rawPath
        );
        (panel?.querySelector('[name="filterStep"]') || panel?.querySelector('[data-config-operation="manual-filter"]'))
          ?.focus({preventScroll:true});
        onChange();
        return;
      }
      const button = event.target.closest('button[data-config-operation]');
      if (button && !button.disabled) {
        const valueOperation = button.dataset.configOperation;
        if (valueOperation === 'condition-value-add' || valueOperation === 'condition-value-remove') {
          if (view.readOnly) return;
          const path = JSON.parse(button.dataset.configArray);
          const current = pathValue(view.draft,path);
          const values = Array.isArray(current) ? current.slice() : [current || ''];
          const add = valueOperation === 'condition-value-add';
          const index = add ? values.length : Number(button.dataset.configIndex);
          if (add) values.push('');
          else values.splice(index,1);
          const saved = values.length === 1 ? values[0] : values;
          setPath(view.draft,path,saved);
          rememberStrategyExpansion(view,form);
          const target = Array.isArray(saved) ? [...path,Math.min(index,saved.length-1)] : path;
          render(JSON.stringify(target));
          onChange();
          return;
        }
        if (button.dataset.configOperation.startsWith('strategy-')) {
          operateStrategy(view,button,form,render,onChange);
          return;
        }
        if (button.dataset.configOperation === 'delivery-rule') {
          openDeliveryRuleDialog(view,button,form,render,onChange);
          return;
        }
        const addColdRule = button.dataset.configOperation === 'nurture-cold-rule';
        if (addColdRule || button.dataset.configOperation === 'nurture-rule') {
          openFlatNurtureDraft(view,form,addColdRule,render,onChange);
          return;
        }
        const movedIndex = arrayAction(view,button);
        const nextIndex = button.dataset.configIndex === undefined ? undefined : String(movedIndex);
        const refreshed = render();
        const controls = [...refreshed.querySelectorAll('[data-config-operation]:enabled')]
          .filter(node => node.dataset.configArray === button.dataset.configArray);
        const equivalent = controls.find(node => node.dataset.configOperation === button.dataset.configOperation &&
          node.dataset.configIndex === nextIndex);
        const moved = controls.find(node => node.dataset.configIndex === nextIndex);
        (equivalent || moved || controls[0] || refreshed.querySelector('[name="name"]'))?.focus({preventScroll:true});
        onChange();
      }
    };
  }

  function install(page) {
    Pages[page.id] = {
      render:() => '<section class="platform-page skynet-config" data-skynet-config="' + e(page.kind) + '">' +
        '<div class="d-page-heading"><h1>' + e(page.menuName || page.name) + '</h1></div>' +
        '<div data-config-body><p role="status">正在读取当前租户配置…</p></div></section>',
      async init(context) {
        const root = document.querySelector('[data-skynet-config="' + page.kind + '"]');
        const state = await DReview21.ensureState();
        const view = {root,page,context,identity:identity(context),state,categoryFilter:'',statusFilter:''};
        if (!root || !active(view)) return;
        if (!state) {
          root.querySelector('[data-config-body]').innerHTML = '<p role="alert">未能读取当前租户配置，请重试。</p>';
          return;
        }
        view.book = catalog.read(state);
        displayList(view);
      }
    };
  }

  const categoryIndex = DNav.pages.findIndex(page => page.id === 'PAGE-2223') + 1;
  DNav.pages.splice(categoryIndex,0,...pages.map(({id,menuName,name}) => ({
    id,name:menuName || name,area:'业务&客户',group:'业务管理',menu:true,module:'public',route:'',phoneDomain:'outside'
  })));
  const originalPage = DRolePermissions.page;
  DRolePermissions.page = (id,context,seat) => pageIds.has(id) ? catalog.canManage(context) : originalPage(id,context,seat);
  const originalWritable = DRolePermissions.writable;
  DRolePermissions.writable = (id,context,seat) => pageIds.has(id) ? catalog.canManage(context) : originalWritable(id,context,seat);
  window.Pages ||= {};
  pages.forEach(install);
})();
