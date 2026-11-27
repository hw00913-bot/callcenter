/* Tenant-owned field rules. Only the caller applies computed candidate values
 * and persists visits. Stable option IDs are the configuration contract. */
(() => {
  'use strict';
  const PAGE_ID='PAGE-21025',VERSION=1;
  const text=value=>typeof value==='string'?value.trim():'';
  const scalar=value=>typeof value==='string'?value.trim():typeof value==='number'&&Number.isFinite(value)||typeof value==='boolean'?String(value):'';
  const object=value=>Boolean(value && typeof value==='object' && !Array.isArray(value));
  const copy=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));
  const failure=message=>({ok:false,error:message,message,errors:[message]});
  const unique=values=>[...new Set(values)];
  const enumTypes=new Set(['select','multiselect']);
  const textTypes=new Set(['text','textarea']);
  const actions=['restrict','fixed','prefill'];
  const maxPrefillTextLength=500;
  const prefillTextLimit=field=>field?.type==='text'?200:field?.key==='remark'?300:maxPrefillTextLength;
  const caches=new Map(),loads=new Map();
  let serial=0;
  function scopeFor(context) {
    const current=window.DSession?.context?.();
    if (!current || current.account?.id!==context?.account?.id || current.scope?.id!==context?.scope?.id ||
        current.scope?.tenant?.brandId!==context?.scope?.tenant?.brandId ||
        current.scope?.tenant?.enterpriseId!==context?.scope?.tenant?.enterpriseId || current.scope.kind!=='tenant' ||
        current.scope.tenant?.enabled!==true || !text(current.scope.tenant.brandId)) return null;
    return {tenantId:current.scope.id,brandId:current.scope.tenant.brandId};
  }
  const identity=(context,scope)=>JSON.stringify([context.account.id,scope.tenantId,scope.brandId,context.scope.tenant?.enterpriseId]);
  const storageKey=scope=>(window.DSession?.prefix || 'd-contact-cloud-v210-review:')+'field-linkage-rules-v1:'+
    encodeURIComponent(scope.brandId)+':'+encodeURIComponent(scope.tenantId);
  function canManage(context=window.DSession?.context?.()) {
    const scope=scopeFor(context),session=window.DSession;
    if (!scope || !session?.allowed?.('PAGE-2223',context) || !session?.canWrite?.('PAGE-2223',context)) return false;
    const role=session.roleKey?.(context),authority=session.platformAuthority?.(context);
    return ['hq_admin','store_admin'].includes(role) || role==='super' &&
      (session.isGlobalAdministrator?.(context)===true || authority?.tenantIds?.includes(scope.tenantId));
  }
  const canReadCatalog=context=>Boolean(scopeFor(context) && window.DSession?.allowed?.('PAGE-2223',context));
  function normalizeFields(input) {
    const fields=[],errors=[],seen=new Set();
    for (const raw of Array.isArray(input)?input:[]) {
      if (!object(raw) || raw.enabled===false || raw.usage==='IMPORT' || raw.source==='IMPORT' || !enumTypes.has(raw.type) && !textTypes.has(raw.type)) continue;
      const id=text(raw.id || raw.fieldId);
      if (!id || seen.has(id)) {errors.push('填写字段标识缺失或重复。');continue;}
      seen.add(id);
      const options=[],ids=new Set();
      for (const option of Array.isArray(raw.options)?raw.options:[]) {
        if (object(option) && (option.enabled===false || option.status==='停用')) continue;
        const value=typeof option==='string'?text(option):text(option?.value || option?.id);
        if (!value || ids.has(value)) {errors.push('字段「'+(text(raw.label)||id)+'」存在缺失或重复选项标识。');continue;}
        ids.add(value);
        options.push({value,label:typeof option==='string'?value:text(option?.label || option?.name)||value,
          aliases:unique([...(Array.isArray(option?.aliases)?option.aliases:[]),option?.businessKey,option?.label]
            .map(scalar).filter(alias=>alias && alias!==value))});
      }
      const aliases=new Map();
      for (const option of options) for (const alias of option.aliases) {
        if (!aliases.has(alias)) aliases.set(alias,new Set());aliases.get(alias).add(option.value);
      }
      for (const option of options) option.aliases=option.aliases.filter(alias=>!ids.has(alias) && aliases.get(alias).size===1);
      fields.push({id,key:text(raw.key || raw.businessKey)||id,label:text(raw.label)||id,type:raw.type,
        required:raw.required===true,options});
    }
    return {fields,errors};
  }
  function assignmentState(scope) {
    const state=window.DReview21?.state?.();
    if (!state || state.tenant!==scope.tenantId) throw Error('当前租户的分配规则目录尚未就绪，请重新读取。');
    if (window.DReview21.isLatest && !window.DReview21.isLatest(state)) throw Error('当前分配规则资料已变化，请刷新后重新读取。');
    return state;
  }
  function assignmentRows(scope,categories) {
    const settings=window.DSkynetConfig;
    if (!settings?.read || !settings?.list) throw Error('分配规则目录尚未就绪，请刷新后重试。');
    const book=settings.read(assignmentState(scope)),ids=new Set(),rows=[];
    for (const row of settings.list(book,'rules')) {
      const status=settings.configurationStatus?.(row) || (row.enabled===false?'disabled':'enabled');
      if (status!=='enabled' || !row.cleaning || row.deletedAt ||
          row.tenantId && row.tenantId!==scope.tenantId || row.brandId && row.brandId!==scope.brandId) continue;
      const category=categories.find(category=>category.id===row.categoryId);
      if (!category) continue;
      if (!text(row.id) || !text(row.name) || !text(String(row.version ?? '')) || ids.has(row.id)) throw Error('分配规则标识或版本无法核对。');
      ids.add(row.id);
      rows.push({id:row.id,name:row.name,version:String(row.version),categoryId:category.id,categoryLabel:category.label,
        path:category.path+' / '+row.name,fields:copy(category.fields),status,
        fieldSource:'分配规则所属二级分类的填写字段'});
    }
    return rows;
  }
  function taskAssignment(scope,assignmentRuleId,assignmentRuleVersion,categoryId) {
    try {
      const settings=window.DSkynetConfig,state=assignmentState(scope);
      if (!settings?.read || !settings?.version) return failure('当前任务绑定的分配规则无法核对，请保留填写内容后重试。');
      const row=settings.version(settings.read(state),'rules',assignmentRuleId,assignmentRuleVersion);
      if (!row || row.id!==assignmentRuleId || String(row.version)!==assignmentRuleVersion || row.categoryId!==categoryId || row.tenantId && row.tenantId!==scope.tenantId ||
          row.brandId && row.brandId!==scope.brandId) return failure('当前任务绑定的分配规则或二级分类无法核对。');
      return {ok:true,row};
    } catch (error) {return failure(error?.message || '当前任务绑定的分配规则无法核对。');}
  }
  function projectCatalog(data,scope) {
    if (!data?.ok || data.legacy || data.brandId!==scope.brandId || data.scope?.tenantId!==scope.tenantId ||
        data.scope?.brandId!==scope.brandId || data.revision==null || !Array.isArray(data.rows) || !Array.isArray(data.fields)) {
      throw Error(data?.message || '填写字段目录的租户、品牌或版本无法核对。');
    }
    const definitions=new Map(data.fields.map(field=>[field.id,field])),categories=[];
    for (const row of data.rows) {
      if (!text(row?.id) || row.enabled===false || row.brandId && row.brandId!==scope.brandId) continue;
      const linked=(row.fields || []).flatMap(ref=>{
        const field=definitions.get(ref.fieldId);
        if (ref.enabled===false || !field || field.brandId && field.brandId!==scope.brandId) return [];
        let options=field.options;
        if (field.foundationDictionaryCode) {
          const dictionary=window.DReview21FoundationDictionary?.read?.(scope.brandId);
          const items=dictionary?.items?.[field.foundationDictionaryCode];
          options=(Array.isArray(items)?items:[]).filter(item=>item.status==='启用').map(item=>({id:item.code,label:item.name,businessKey:item.code}));
        }
        return [{...field,options,required:Object.hasOwn(ref,'required')?ref.required===true:field.required===true}];
      });
      const normalized=normalizeFields(linked);
      if (normalized.errors.length) throw Error(normalized.errors.join(' '));
      const family=(data.categoryFamilies || []).find(item=>item.id===(row.familyId || row.businessFamily));
      categories.push({id:row.id,label:text(row.label)||row.id,path:[text(family?.label),text(row.label)||row.id].filter(Boolean).join(' / '),
        fields:normalized.fields});
    }
    const assignmentRules=assignmentRows(scope,categories);
    return {ok:true,...scope,revision:JSON.stringify([VERSION,scope,data.revision,categories,assignmentRules]),categories,assignmentRules};
  }
  async function loadCatalog(context=window.DSession?.context?.()) {
    const scope=scopeFor(context);
    if (!scope || !canReadCatalog(context)) return {...failure('当前账号没有填写联动规则的目录读取权限。'),categories:[]};
    const key=identity(context,scope),sequence=++serial;loads.set(key,sequence);caches.delete(key);
    try {
      if (!window.DModuleHost?.readCatalog) throw Error('业务字段目录尚未就绪。');
      const data=await window.DModuleHost.readCatalog();
      if (window.DReview21?.ensureState) await window.DReview21.ensureState({reload:true});
      const current=scopeFor(context);
      if (!current || identity(context,current)!==key || !canReadCatalog(context) || loads.get(key)!==sequence) throw Error('目录读取期间账号、租户或请求已变化，请重新读取。');
      const result=projectCatalog(data,scope);caches.set(key,result);return copy(result);
    } catch (error) {return {...failure(error?.message || '填写字段目录读取失败。'),categories:[]};}
  }
  function currentCatalog(context=window.DSession?.context?.()) {
    const scope=scopeFor(context);
    if (!scope || !canReadCatalog(context)) return {...failure('当前账号没有填写联动规则的目录读取权限。'),categories:[]};
    const cached=caches.get(identity(context,scope));
    if (!cached) return {...failure('请先读取当前业务分类及填写字段目录。'),categories:[]};
    try {
      const current=projectCatalog(window.DModuleHost?.currentCatalog?.(),scope);
      if (current.revision!==cached.revision) throw Error('分配规则、分类、填写字段或字典已变化，请重新读取。');
      return copy(cached);
    } catch (error) {return {...failure(error?.message || '当前填写字段目录无法复核。'),categories:[]};}
  }
  const modeGroups=Object.freeze(['ai','human']);
  const modeLabels=Object.freeze({ai:'AI 外呼',human:'人工外呼/预外呼'});
  function modeFor(value) {
    if (typeof value!=='string') return '';
    const mode=value.trim();
    if (mode==='ai' || mode==='AI 外呼' || mode==='AI外呼') return 'ai';
    if (mode==='human' || mode==='人工外呼' || mode==='预外呼' || mode==='人工外呼/预外呼' || mode==='人工外呼 / 预外呼') return 'human';
    return '';
  }
  function branchValues(value) {
    return {conditions:copy(value?.conditions),targetFieldId:text(value?.targetFieldId),
      action:value?.action,values:copy(value?.values),required:value?.required,
      ...(value?.prefillText!==undefined?{prefillText:value.prefillText}:{})};
  }
  function emptyModeConfig(value) {
    if (value==null) return true;
    if (!object(value) || Object.hasOwn(value,'required') && typeof value.required!=='boolean' ||
        Object.hasOwn(value,'action') && !actions.includes(value.action) ||
        value.targetFieldId!=null && typeof value.targetFieldId!=='string') return false;
    const conditions=value.conditions;
    const emptyConditions=conditions===undefined || Array.isArray(conditions) && conditions.every(condition=>
      object(condition) && (condition.fieldId==null || typeof condition.fieldId==='string') && !text(condition.fieldId) && (condition.values===undefined || Array.isArray(condition.values) && !condition.values.length));
    const emptyValues=value.values===undefined || Array.isArray(value.values) && !value.values.length;
    return emptyConditions && emptyValues && !text(value.targetFieldId) && (value.prefillText===undefined || value.prefillText==='');
  }
  function branchShape(value) {
    if (!object(value) || typeof value.required!=='boolean' || !actions.includes(value.action) ||
        !text(value.targetFieldId) || !Array.isArray(value.values) ||
        (value.action==='prefill' ? value.values.length || !text(value.prefillText) || value.prefillText.length>maxPrefillTextLength :
          !value.values.length || value.values.some(item=>!text(item) || item!==text(item)) ||
          unique(value.values).length!==value.values.length || value.action==='fixed' && value.values.length!==1 ||
          value.prefillText!==undefined && value.prefillText!=='') || !Array.isArray(value.conditions) || !value.conditions.length ||
        unique(value.conditions.map(condition=>condition?.fieldId)).length!==value.conditions.length ||
        value.conditions.some(condition=>!text(condition?.fieldId) || !Array.isArray(condition.values) || !condition.values.length ||
          condition.values.some(item=>!text(item) || item!==text(item)) || unique(condition.values).length!==condition.values.length)) {
      return '上游条件、目标字段、动作或选项填写不完整。';
    }
    return '';
  }
  function modeConfig(rule,mode) {
    const group=modeFor(mode);if (!group || !object(rule)) return null;
    if (Object.hasOwn(rule,'modeConfigs')) return object(rule.modeConfigs) && object(rule.modeConfigs[group]) ? copy(rule.modeConfigs[group]) : null;
    const savedGroup=Object.hasOwn(rule,'callModeGroup') ? modeFor(rule.callModeGroup) : 'human';
    return savedGroup===group ? branchValues(rule) : null;
  }
  function projectRule(rule,mode) {
    const group=modeFor(mode),config=modeConfig(rule,group);if (!config) return null;
    const projected={...copy(rule),...config,callModeGroup:group};delete projected.modeConfigs;return projected;
  }
  function normalizedModeConfigs(rule) {
    if (Object.hasOwn(rule,'modeConfigs') && (!object(rule.modeConfigs) || Object.keys(rule.modeConfigs).some(mode=>!modeGroups.includes(mode)))) {
      return {error:'请选择有效的呼叫方式配置。'};
    }
    const explicitMode=Object.hasOwn(rule,'callModeGroup') ? modeFor(rule.callModeGroup) : 'human';
    if (!Object.hasOwn(rule,'modeConfigs') && !explicitMode) return {error:'请选择有效的呼叫方式配置。'};
    const values=Object.hasOwn(rule,'modeConfigs') ? rule.modeConfigs : {[explicitMode]:branchValues(rule)};
    const modeConfigs={ai:null,human:null};
    for (const group of modeGroups) {
      const value=values[group];if (emptyModeConfig(value)) continue;
      const error=branchShape(value);if (error) return {error:modeLabels[group]+'：'+error};
      modeConfigs[group]=branchValues(value);
    }
    if (!modeGroups.some(group=>modeConfigs[group])) return {error:'请至少完整配置 AI 外呼或人工外呼/预外呼其中一边。'};
    return {modeConfigs};
  }
  function ruleShape(rule) {
    if (!object(rule) || Object.hasOwn(rule,'assignmentRuleId') && (!text(rule.assignmentRuleId) || rule.assignmentRuleId!==text(rule.assignmentRuleId)) ||
        !text(rule.id) || !text(rule.name) || rule.name.length>80 || !text(rule.categoryId) || typeof rule.enabled!=='boolean') {
      return '规则名称、适用范围或启用状态填写不完整。';
    }
    if (Object.hasOwn(rule,'modeConfigs')) {
      if (!object(rule.modeConfigs) || Object.keys(rule.modeConfigs).some(mode=>!modeGroups.includes(mode)) ||
          !modeGroups.some(mode=>rule.modeConfigs[mode]!=null)) return '请至少完整配置一种呼叫方式。';
      for (const mode of modeGroups) if (rule.modeConfigs[mode]!=null) {
        const error=branchShape(rule.modeConfigs[mode]);if(error)return modeLabels[mode]+'：'+error;
      }
      return '';
    }
    if (Object.hasOwn(rule,'callModeGroup') && !modeGroups.includes(rule.callModeGroup)) return '规则的呼叫方式无法核对。';
    return branchShape(rule);
  }
  function referenceErrors(rule,fields) {
    const byId=new Map(fields.map(field=>[field.id,field])),errors=[];
    for (const ref of rule.conditions) {
      const field=byId.get(ref.fieldId);
      if (!field || !enumTypes.has(field.type)) errors.push('规则「'+rule.name+'」引用的上游枚举字段已停用、删除或未关联当前分类。');
      else if (ref.values.some(value=>!field.options.some(option=>option.value===value))) errors.push('规则「'+rule.name+'」引用的「'+field.label+'」选项已失效。');
    }
    const target=byId.get(rule.targetFieldId);
    if (!target) errors.push('规则「'+rule.name+'」引用字段已停用、删除或未关联当前分类。');
    else if (rule.action==='prefill') {
      if (!textTypes.has(target.type)) errors.push('规则「'+rule.name+'」仅支持预填文本字段。');
      else if (rule.prefillText.length>prefillTextLimit(target)) errors.push('规则「'+rule.name+'」的预填文案超过该字段允许的长度。');
      else if (target.type==='text' && /[\r\n]/.test(rule.prefillText)) errors.push('规则「'+rule.name+'」的单行文本不能包含换行。');
    } else if (!enumTypes.has(target.type) || rule.values.some(value=>!target.options.some(option=>option.value===value))) {
      errors.push('规则「'+rule.name+'」引用的「'+target.label+'」选项已失效。');
    }
    return errors;
  }
  function orderedFields(fields,rules) {
    const edges=new Map(fields.map(field=>[field.id,new Set()])),degree=new Map(fields.map(field=>[field.id,0]));
    for (const rule of rules) for (const condition of rule.conditions) {
      if (!edges.has(condition.fieldId) || !degree.has(rule.targetFieldId)) continue;
      if (!edges.get(condition.fieldId).has(rule.targetFieldId)) {
        edges.get(condition.fieldId).add(rule.targetFieldId);degree.set(rule.targetFieldId,degree.get(rule.targetFieldId)+1);
      }
    }
    const queue=fields.filter(field=>degree.get(field.id)===0).map(field=>field.id),ordered=[];
    for (let index=0;index<queue.length;index++) {
      const id=queue[index];ordered.push(id);
      for (const target of edges.get(id)) {degree.set(target,degree.get(target)-1);if(degree.get(target)===0)queue.push(target);}
    }
    return ordered.length===fields.length?{ordered,errors:[]}:{ordered:[],errors:['已启用规则存在字段依赖环，请调整上游条件与目标字段。']};
  }
  function staticErrors(fields,rules) {
    const errors=rules.flatMap(rule=>referenceErrors(rule,fields));
    if (errors.length) return unique(errors);
    errors.push(...orderedFields(fields,rules).errors);
    if (errors.length) return errors;
    const byId=new Map(fields.map(field=>[field.id,field]));
    for (const target of unique(rules.map(rule=>rule.targetFieldId))) {
      const candidates=rules.filter(rule=>rule.targetFieldId===target),memo=new Set();
      if (textTypes.has(byId.get(target).type)) {
        const conflicts=candidates.some((left,index)=>candidates.slice(index+1).some(right=>
          left.prefillText!==right.prefillText && left.conditions.every(condition=>{
            if (byId.get(condition.fieldId).type==='multiselect') return true;
            const other=right.conditions.find(item=>item.fieldId===condition.fieldId);
            return !other || condition.values.some(value=>other.values.includes(value));
          })));
        if (conflicts) errors.push('目标「'+byId.get(target).label+'」存在可同时命中的不同预填文本。');
        continue;
      }
      let conflict=false;
      function walk(index,allowed,conditions,count) {
        if (conflict || index>=candidates.length) return;
        const signature=JSON.stringify([index,allowed,[...conditions].sort(([a],[b])=>a<b?-1:1)]);
        if (memo.has(signature)) return;memo.add(signature);
        const rule=candidates[index],nextConditions=new Map(conditions);let compatible=true;
        for (const condition of rule.conditions) {
          if (byId.get(condition.fieldId).type==='multiselect') continue;
          const previous=nextConditions.get(condition.fieldId),next=previous?previous.filter(value=>condition.values.includes(value)):condition.values;
          if (!next.length) {compatible=false;break;}nextConditions.set(condition.fieldId,next);
        }
        if (compatible) {
          const next=allowed.filter(value=>rule.values.includes(value));
          if (!next.length) {conflict=true;return;}
          walk(index+1,next,nextConditions,count+1);
        }
        walk(index+1,allowed,conditions,count);
      }
      walk(0,byId.get(target).options.map(option=>option.value),new Map(),0);
      if (conflict) errors.push('目标「'+byId.get(target).label+'」存在可同时命中的固定值冲突或选项空交集。');
    }
    return errors;
  }
  function read(context=window.DSession?.context?.()) {
    const scope=scopeFor(context);
    if (!scope) return {...failure('当前账号、租户或品牌无法核对。'),revision:0,rules:[]};
    try {
      const bytes=localStorage.getItem(storageKey(scope));
      if (bytes===null) return {ok:true,...scope,revision:0,rules:[]};
      const value=JSON.parse(bytes);
      if (value?.version!==VERSION || value.tenantId!==scope.tenantId || value.brandId!==scope.brandId ||
          !Number.isSafeInteger(value.revision) || value.revision<1 || !Array.isArray(value.rules) ||
          value.rules.some(rule=>ruleShape(rule)) || unique(value.rules.map(rule=>rule.id)).length!==value.rules.length) throw Error();
      return {ok:true,...scope,revision:value.revision,rules:copy(value.rules)};
    } catch (_) {return {...failure('填写联动规则读取失败，原配置未修改。'),...scope,revision:0,rules:[]};}
  }
  function mutation(context,input,operation) {
    const scope=scopeFor(context);
    if (!scope || !canManage(context)) return failure('当前账号没有本租户填写联动规则的维护权限。');
    const catalog=currentCatalog(context);
    if (!catalog.ok) return catalog;
    if (operation!=='remove' && input.catalogRevision!==catalog.revision) return failure('填写字段目录已变化，请重新读取后保存。');
    const old=read(context);
    if (!old.ok) return old;
    if (input.expectedRevision!==old.revision) return failure('填写联动规则已变化，请重新读取后操作。');
    let before;
    try {before=localStorage.getItem(storageKey(scope));}catch(_){return failure('当前规则存储无法读取，操作未保存。');}
    const rules=copy(old.rules);
    let rule,index;
    if (operation==='save') {
      const raw=input.rule || {},id=text(raw.id)||'FLR-'+(window.crypto?.randomUUID?.() || Date.now().toString(36)+'-'+(++serial));
      index=rules.findIndex(row=>row.id===id);
      if (text(raw.id) && index<0) return failure('原规则已删除或不在当前租户。');
      const assignmentRuleId=text(raw.assignmentRuleId);
      const assignment=catalog.assignmentRules.find(row=>row.id===assignmentRuleId);
      if (!assignmentRuleId || !assignment) return failure('请选择当前租户可用的分配规则，再配置其填写联动。');
      if (text(raw.categoryId) && raw.categoryId!==assignment.categoryId) return failure('联动规则的二级分类须与所选分配规则一致。');
      const modes=normalizedModeConfigs(raw);if(modes.error)return failure(modes.error);
      rule={id,name:text(raw.name),categoryId:assignment.categoryId,assignmentRuleId,
        assignmentRuleName:assignment.name,assignmentRuleVersion:assignment.version,enabled:raw.enabled,
        modeConfigs:modes.modeConfigs,
        ...(index<0?{createdAt:new Date().toISOString()}:Object.hasOwn(rules[index],'createdAt')?{createdAt:rules[index].createdAt}:{}),
        updatedAt:new Date().toISOString(),updatedBy:context.account.id};
      const issue=ruleShape(rule);if(issue)return failure(issue);
      const errors=modeGroups.flatMap(mode=>{const selected=projectRule(rule,mode);return selected ? referenceErrors(selected,assignment.fields).map(error=>modeLabels[mode]+'：'+error) : [];});
      if(errors.length)return failure(unique(errors).join(' '));
      if(index<0)rules.push(rule);else rules[index]=rule;
    } else {
      index=rules.findIndex(row=>row.id===input.id);
      if(index<0)return failure('原规则已删除或不在当前租户。');
      if(operation==='remove') rules.splice(index,1);
      else {
        if(typeof input.enabled!=='boolean')return failure('请选择启用或停用。');
        rule={...rules[index],enabled:input.enabled,updatedAt:new Date().toISOString(),updatedBy:context.account.id};rules[index]=rule;
      }
    }
    if (rule?.enabled) {
      const errors=[];
      const assignment=catalog.assignmentRules.find(row=>row.id===rule.assignmentRuleId);
      if (!assignment || assignment.categoryId!==rule.categoryId) errors.push('请先为此联动规则绑定有效的分配规则。');
      else for (const mode of modeGroups) {
        const selected=rules.filter(row=>row.enabled && row.assignmentRuleId===rule.assignmentRuleId && row.categoryId===rule.categoryId)
          .map(row=>projectRule(row,mode)).filter(Boolean);
        errors.push(...staticErrors(assignment.fields,selected).map(error=>modeLabels[mode]+'：'+error));
      }
      if(errors.length)return failure(unique(errors).join(' '));
    }
    const next={version:VERSION,...scope,revision:old.revision+1,rules},bytes=JSON.stringify(next);
    try {
      if (!canManage(context) || !currentCatalog(context).ok || localStorage.getItem(storageKey(scope))!==before ||
          read(context).revision!==input.expectedRevision) return failure('权限、目录或规则版本已变化，操作未保存。');
      localStorage.setItem(storageKey(scope),bytes);
      if(localStorage.getItem(storageKey(scope))!==bytes)throw Error('write verification');
      return {ok:true,...scope,revision:next.revision,rules:copy(rules),...(rule?{rule:copy(rule)}:{})};
    } catch (_) {
      try {if(localStorage.getItem(storageKey(scope))===bytes) {
        if(before===null)localStorage.removeItem(storageKey(scope));else localStorage.setItem(storageKey(scope),before);
      }} catch (_) { /* A failed store remains an explicit failure, never a success. */ }
      return failure('填写联动规则未保存，请重新读取后重试。');
    }
  }
  const save=(context,input={})=>mutation(context,input,'save');
  const toggle=(context,input={})=>mutation(context,input,'toggle');
  const remove=(context,input={})=>mutation(context,input,'remove');
  function parseValue(field,raw) {
    const empty=raw==null || raw==='';
    const shape=empty || (field.type==='multiselect'?Array.isArray(raw):!Array.isArray(raw) && !object(raw));
    const source=empty?[]:field.type==='multiselect'?(Array.isArray(raw)?raw:[]):[raw];
    const selected=[];let valid=shape;
    for(const item of source) {
      const input=scalar(item),option=field.options.find(option=>option.value===input) || field.options.find(option=>option.aliases.includes(input));
      if(!option)valid=false;else selected.push(option.value);
    }
    const values=unique(selected);
    return {valid,value:field.type==='multiselect'?values:values[0] || ''};
  }
  const same=(a,b,multiple=false)=>multiple?JSON.stringify([...(Array.isArray(a)?a:[])].sort())===JSON.stringify([...(Array.isArray(b)?b:[])].sort()):a===b;
  const referencedFields=rules=>new Set(rules.flatMap(rule=>[rule.targetFieldId,
    ...(Array.isArray(rule.conditions)?rule.conditions.map(condition=>condition?.fieldId):[])]));
  function compute({rules=[],categoryId,assignmentRuleId,assignmentRuleVersion,callMode,fields:inputFields=[],values:inputValues={}}={},applyPrefill=true) {
    const values=copy(object(inputValues)?inputValues:{}),changes=[],constraints={},matchedRuleIds=[];
    const mode=modeFor(callMode===undefined?'human':callMode);
    const active=(Array.isArray(rules)?rules:[]).filter(rule=>rule?.enabled===true && rule.categoryId===categoryId &&
        (assignmentRuleId===undefined || Boolean(text(assignmentRuleId)) && rule.assignmentRuleId===assignmentRuleId))
      .map(rule=>projectRule(rule,mode)).filter(Boolean)
      .map((rule,index)=>({...rule,id:text(rule.id)||'__preview_'+index}));
    if(!active.length)return {ok:true,values,constraints,changes,matchedRuleIds,errors:[]};
    const refs=referencedFields(active),normalized=normalizeFields((Array.isArray(inputFields)?inputFields:[])
      .filter(field=>refs.has(text(field?.id || field?.fieldId)))),fields=normalized.fields,errors=[...normalized.errors];
    for(const rule of active) {const issue=ruleShape(rule);if(issue)errors.push(issue);else errors.push(...referenceErrors(rule,fields));}
    const order=errors.length?{ordered:[],errors:[]}:orderedFields(fields,active);errors.push(...order.errors);
    if(errors.length)return {ok:false,values,constraints,changes,matchedRuleIds,errors:unique(errors)};
    const byId=new Map(fields.map(field=>[field.id,field]));
    for(const field of fields) {
      if (textTypes.has(field.type)) continue;
      const before=values[field.id],parsed=parseValue(field,before);values[field.id]=parsed.value;
      if(!same(before,parsed.value,field.type==='multiselect') && !(before==null && (parsed.value==='' || Array.isArray(parsed.value)&&!parsed.value.length))) {
        changes.push({fieldId:field.id,before:copy(before),after:copy(parsed.value),reason:parsed.valid?'规范为当前字段的稳定选项ID。':'清除当前字段中已失效或格式不合法的选项。'});
      }
    }
    for(const id of order.ordered) {
      const field=byId.get(id),matched=active.filter(rule=>rule.targetFieldId===id && rule.conditions.every(condition=>{
        const actual=values[condition.fieldId],selected=Array.isArray(actual)?actual:[actual];return selected.some(value=>condition.values.includes(value));
      }));
      if (textTypes.has(field.type)) {
        if (!matched.length) continue;
        const candidates=unique(matched.map(rule=>rule.prefillText));
        constraints[id]={prefillText:candidates.length===1?candidates[0]:null, required:field.required || matched.some(rule=>rule.required),
          ruleNames:matched.map(rule=>rule.name),ruleIds:matched.map(rule=>rule.id)};
        matchedRuleIds.push(...constraints[id].ruleIds);
        if (candidates.length!==1) {
          errors.push('字段「'+field.label+'」命中不同预填文本，不能确定预填内容。');continue;
        }
        const before=values[id];
        if (applyPrefill && (before==null || typeof before==='string' && !before.trim())) {
          values[id]=candidates[0];
          changes.push({fieldId:id,before:copy(before),after:candidates[0],reason:'按命中的填写联动规则预填空白文本。'});
        }
        continue;
      }
      let allowed=field.options.map(option=>option.value);
      for(const rule of matched)allowed=allowed.filter(value=>rule.values.includes(value));
      const fixed=unique(matched.filter(rule=>rule.action==='fixed').map(rule=>rule.values[0]));
      const constraint={allowedValues:allowed,fixedValue:fixed.length===1?fixed[0]:null,required:field.required || matched.some(rule=>rule.required),
        ruleNames:matched.map(rule=>rule.name),ruleIds:matched.map(rule=>rule.id)};
      constraints[id]=constraint;matchedRuleIds.push(...constraint.ruleIds);
      if(matched.length && (!allowed.length || fixed.length>1)) {
        errors.push('字段「'+field.label+'」命中规则冲突，不能确定合法选项。');continue;
      }
      const before=values[id];
      const after=constraint.fixedValue ? field.type==='multiselect'?[constraint.fixedValue]:constraint.fixedValue :
        field.type==='multiselect'?before.filter(value=>allowed.includes(value)):!before || allowed.includes(before)?before:'';
      if(!same(before,after,field.type==='multiselect')) {
        values[id]=after;changes.push({fieldId:id,before:copy(before),after:copy(after),reason:constraint.fixedValue?
          '按命中的填写联动规则固定赋值。':'上游填写值变化，清除已不在允许范围内的选项。'});
      }
    }
    return {ok:!errors.length,values,constraints,changes,matchedRuleIds:unique(matchedRuleIds),errors:unique(errors)};
  }
  function execution({context=window.DSession?.context?.(),categoryId,assignmentRuleId,assignmentRuleVersion,callMode,fields=[],values={},snapshot}={},applyPrefill=true) {
    const scope=scopeFor(context);
    if(!scope)return failure('当前账号、租户或品牌无法核对。');
    if(!text(categoryId))return failure('当前二级分类标识无法核对。');
    const assignmentId=text(assignmentRuleId),assignmentVersion=text(assignmentRuleVersion),mode=modeFor(callMode);
    let rules,revision,legacySnapshot=false,legacyModeSnapshot=false;
    if(snapshot!==undefined) {
      if(!object(snapshot) || snapshot.version!==VERSION || snapshot.tenantId!==scope.tenantId || snapshot.brandId!==scope.brandId ||
          snapshot.categoryId!==categoryId || !Number.isSafeInteger(snapshot.revision) || snapshot.revision<0 ||
          !Array.isArray(snapshot.rules) || snapshot.rules.some(rule=>ruleShape(rule) || !rule.enabled || rule.categoryId!==categoryId) ||
          !Array.isArray(snapshot.fields) || unique(snapshot.rules.map(rule=>rule.id)).length!==snapshot.rules.length ||
          unique(snapshot.fields.map(field=>field?.id)).length!==snapshot.fields.length)return failure('原次填写联动规则快照的租户、分类或内容无法核对。');
      legacyModeSnapshot=!Object.hasOwn(snapshot,'callModeGroup');
      if (legacyModeSnapshot) {
        if (mode!=='human' || snapshot.rules.some(rule=>Object.hasOwn(rule,'modeConfigs') || Object.hasOwn(rule,'callModeGroup'))) {
          return failure('原次联动快照的呼叫方式无法核对，历史人工规则不能用于 AI 外呼。');
        }
      } else if (snapshot.callModeGroup!==mode || !['ai','human',''].includes(snapshot.callModeGroup) ||
          !mode && snapshot.rules.length || snapshot.rules.some(rule=>Object.hasOwn(rule,'modeConfigs') || rule.callModeGroup!==mode)) {
        return failure('原次填写联动快照的呼叫方式与当前任务不一致。');
      }
      legacySnapshot=!Object.hasOwn(snapshot,'scopeType') && !Object.hasOwn(snapshot,'assignmentRuleId');
      if (legacySnapshot && snapshot.rules.some(rule=>Object.hasOwn(rule,'assignmentRuleId'))) return failure('原次联动快照的分配规则范围信息不完整。');
      if (!legacySnapshot) {
        if (!['assignmentRule','unbound'].includes(snapshot.scopeType) || snapshot.assignmentRuleId!==assignmentId ||
            snapshot.assignmentRuleVersion!==assignmentVersion || snapshot.scopeType==='assignmentRule' && (!assignmentId || !assignmentVersion) ||
            snapshot.scopeType==='unbound' && (assignmentId || assignmentVersion || snapshot.rules.length) ||
            snapshot.rules.some(rule=>rule.assignmentRuleId!==assignmentId)) return failure('原次填写联动快照的分配规则或版本与当前任务不一致。');
      }
      const referenced=unique(snapshot.rules.flatMap(rule=>[rule.targetFieldId,...rule.conditions.map(condition=>condition.fieldId)]));
      if(referenced.some(id=>!snapshot.fields.some(field=>field?.id===id)))return failure('原次联动快照的字段签名不完整。');
      rules=copy(snapshot.rules);revision=snapshot.revision;
    } else {
      const config=read(context);if(!config.ok)return config;
      rules=assignmentId && mode ? config.rules.filter(rule=>rule.enabled && rule.categoryId===categoryId && rule.assignmentRuleId===assignmentId)
        .map(rule=>projectRule(rule,mode)).filter(Boolean) : [];
      revision=config.revision;
    }
    if (!legacySnapshot && assignmentId) {
      if (!assignmentVersion) return failure('当前任务的分配规则版本无法核对。');
      const assignment=taskAssignment(scope,assignmentId,assignmentVersion,categoryId);
      if (!assignment.ok) return assignment;
    } else if (!legacySnapshot && assignmentVersion) return failure('当前任务的分配规则标识无法核对。');
    const refs=referencedFields(rules),normalized=normalizeFields((Array.isArray(fields)?fields:[])
      .filter(field=>refs.has(text(field?.id || field?.fieldId))));
    if(normalized.errors.length)return failure(normalized.errors.join(' '));
    if(snapshot!==undefined)for(const saved of snapshot.fields) {
      const current=normalized.fields.find(field=>field.id===saved.id);
      if(!current || current.type!==saved.type || !Array.isArray(saved.optionValues) ||
          saved.optionValues.some(id=>!current.options.some(option=>option.value===id)))return failure('原次联动快照引用的填写字段或选项已失效。');
      current.required=saved.required===true;
    }
    const result=compute({rules,categoryId,callMode:mode,...(legacySnapshot ? {} : {assignmentRuleId:assignmentId,assignmentRuleVersion:assignmentVersion}),fields:normalized.fields,values},applyPrefill);
    const frozen={version:VERSION,...scope,categoryId,revision,...(legacyModeSnapshot ? {} : {callModeGroup:mode}),
      ...(legacySnapshot ? {} : {scopeType:assignmentId?'assignmentRule':'unbound',assignmentRuleId:assignmentId,assignmentRuleVersion:assignmentVersion}),
      rules:copy(rules),fields:normalized.fields.filter(field=>refs.has(field.id))
      .map(field=>({id:field.id,type:field.type,required:field.required,optionValues:field.options.map(option=>option.value)})),
      values:Object.fromEntries([...refs].filter(id=>Object.hasOwn(result.values,id)).map(id=>[id,copy(result.values[id])])),
      matchedRuleIds:copy(result.matchedRuleIds)};
    return {...result,revision,snapshot:frozen};
  }
  const evaluate=input=>execution(input);
  function validate(input={}) {
    const result=execution(input,false);if(!result.ok)return result;
    const refs=referencedFields(result.snapshot.rules);
    const fields=normalizeFields((Array.isArray(input.fields)?input.fields:[]).filter(field=>refs.has(text(field?.id || field?.fieldId)))).fields,errors=[];
    for(const field of fields) {
      const constraint=result.constraints[field.id];
      if (textTypes.has(field.type)) {
        const raw=input.values?.[field.id];
        if (constraint?.required && !text(raw)) errors.push('请填写「'+field.label+'」。');
        else if (raw!=null && typeof raw!=='string') errors.push('字段「'+field.label+'」只接受文本。');
        continue;
      }
      const parsed=parseValue(field,input.values?.[field.id]);
      if(!parsed.valid)errors.push('字段「'+field.label+'」包含当前字段不支持的值或格式。');
      if(constraint.required && (parsed.value==='' || Array.isArray(parsed.value)&&!parsed.value.length))errors.push('请填写「'+field.label+'」。');
      if(!same(parsed.value,result.values[field.id],field.type==='multiselect'))errors.push('字段「'+field.label+'」不符合当前联动范围或固定值，请核对后提交。');
    }
    return {...result,ok:!errors.length,errors:unique(errors)};
  }
  window.DFieldLinkageRules=Object.freeze({PAGE_ID,modeGroups,modeLabels,modeFor,modeConfig,prefillTextLimit,projectRule,emptyModeConfig,canManage,loadCatalog,currentCatalog,read,save,toggle,remove,compute,evaluate,validate});
})();
