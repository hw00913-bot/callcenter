/* Ranking only: all eligibility, checked/default/required decisions stay with
 * the existing delivery flow. Groups and scores are read from the live brand
 * foundation dictionary, never copied into this configuration store. */
(() => {
  'use strict';
  const PAGE_ID='PAGE-21026',VERSION=1,SOURCE='imported-intent-store';
  const text=value=>typeof value==='string'?value.trim():'';
  const object=value=>Boolean(value&&typeof value==='object'&&!Array.isArray(value));
  const copy=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));
  const fail=message=>({ok:false,error:message,message});
  const validCode=value=>typeof value==='string'&&value!==''&&value===value.trim();
  const caches=new Map(),loads=new Map();let serial=0;
  function scopeFor(context) {
    const live=window.DSession?.context?.();
    if(!live||live.account?.id!==context?.account?.id||live.scope?.id!==context?.scope?.id||
        live.scope?.tenant?.brandId!==context?.scope?.tenant?.brandId||
        String(live.scope?.tenant?.enterpriseId||'')!==String(context?.scope?.tenant?.enterpriseId||'')||
        live.scope.kind!=='tenant'||live.scope.tenant?.enabled!==true||!text(live.scope.tenant.brandId))return null;
    return {tenantId:live.scope.id,brandId:live.scope.tenant.brandId};
  }
  const identity=(context,scope)=>JSON.stringify([context.account.id,scope.tenantId,scope.brandId,String(context.scope.tenant?.enterpriseId||'')]);
  const keyFor=scope=>(window.DSession?.prefix||'d-contact-cloud-v210-review:')+'racing-store-rules-v1:'+
    encodeURIComponent(scope.brandId)+':'+encodeURIComponent(scope.tenantId);
  const canRead=(context=window.DSession?.context?.())=>Boolean(scopeFor(context)&&window.DSession?.allowed?.('PAGE-2223',context));
  const canExecute=context=>Boolean(scopeFor(context)&&(canRead(context)||window.DSession?.allowed?.('PAGE-2202',context)));
  function canManage(context=window.DSession?.context?.()) {
    if(!canRead(context)||window.DSession?.canWrite?.('PAGE-2223',context)!==true)return false;
    const session=window.DSession,role=session.roleKey?.(context),scope=scopeFor(context);
    return ['hq_admin','store_admin'].includes(role)||role==='super'&&
      (session.isGlobalAdministrator?.(context)===true||session.platformAuthority?.(context)?.tenantIds?.includes(scope.tenantId));
  }
  function assignmentState(scope) {
    const state=window.DReview21?.state?.();
    if(!state||state.tenant!==scope.tenantId||window.DReview21.isLatest&&window.DReview21.isLatest(state)!==true)throw Error('当前租户的分配规则资料尚未就绪或已变化。');
    return state;
  }
  function assignmentRows(scope,categories) {
    const settings=window.DSkynetConfig;if(!settings?.read||!settings?.list)throw Error('分配规则目录尚未就绪。');
    const book=settings.read(assignmentState(scope)),ids=new Set(),rows=[];
    for(const row of settings.list(book,'rules')) {
      const status=settings.configurationStatus?.(row)||(row.enabled===false?'disabled':'enabled');
      if(status!=='enabled'||!row.cleaning||row.deletedAt||row.tenantId&&row.tenantId!==scope.tenantId||row.brandId&&row.brandId!==scope.brandId)continue;
      const category=categories.find(category=>category.id===row.categoryId);if(!category)continue;
      if(!text(row.id)||!text(row.name)||!String(row.version??'').trim()||ids.has(row.id))throw Error('分配规则身份或版本无法核对。');
      ids.add(row.id);rows.push({id:row.id,name:row.name,version:String(row.version),categoryId:category.id,categoryLabel:category.label,
        path:category.path+' / '+row.name,fields:copy(category.fields),status});
    }
    return rows;
  }
  function taskAssignment(scope,assignmentRuleId,assignmentRuleVersion,categoryId) {
    const id=text(assignmentRuleId),version=String(assignmentRuleVersion??'').trim(),settings=window.DSkynetConfig;
    if(!id||!version)return fail('当前任务缺少准确分配规则ID或绑定版本。');
    try {
      if(!settings?.read||!settings?.version)throw Error('当前任务的分配规则历史版本不可读取。');
      const row=settings.version(settings.read(assignmentState(scope)),'rules',id,version);
      if(!row||row.id!==id||String(row.version)!==version||row.categoryId!==categoryId||
          row.tenantId&&row.tenantId!==scope.tenantId||row.brandId&&row.brandId!==scope.brandId)throw Error('当前任务分配规则历史版本或分类无法核对。');
      return {ok:true,row};
    }catch(error){return fail(error?.message||'当前任务的分配规则绑定无法核对。');}
  }
  function project(data,scope,includeAssignments=true) {
    if(!data?.ok||data.legacy||data.brandId!==scope.brandId||data.scope?.brandId!==scope.brandId||
        data.scope?.tenantId!==scope.tenantId||!Array.isArray(data.rows))throw Error(data?.message||'当前分类目录的品牌或租户无法核对。');
    const categories=[];
    for(const category of data.rows) {
      if(!text(category?.id)||category.enabled===false||category.brandId&&category.brandId!==scope.brandId)continue;
      const family=(data.categoryFamilies||[]).find(row=>row.id===(category.familyId||category.businessFamily));
      categories.push({id:category.id,label:text(category.label)||category.id,
        path:[text(family?.label),text(category.label)||category.id].filter(Boolean).join(' / '),fields:[]});
    }
    const assignments=includeAssignments?assignmentRows(scope,categories):[];
    return {ok:true,...scope,categories,assignmentRules:assignments,source:SOURCE,revision:JSON.stringify([VERSION,scope,categories,assignments])};
  }
  async function loadCatalog(context=window.DSession?.context?.()) {
    const scope=scopeFor(context);if(!scope||!canRead(context))return {...fail('当前账号没有分配规则目录读取权限。'),categories:[],assignmentRules:[]};
    const key=identity(context,scope),sequence=++serial;loads.set(key,sequence);caches.delete(key);
    try {
      if(!window.DModuleHost?.readCatalog)throw Error('分配规则所属分类目录尚未就绪。');
      const data=await window.DModuleHost.readCatalog(),current=scopeFor(context);
      if(!current||identity(context,current)!==key||!canRead(context)||loads.get(key)!==sequence)throw Error('目录读取期间账号、租户或请求已变化。');
      const result=project(data,scope);caches.set(key,result);return copy(result);
    }catch(error){return {...fail(error?.message||'分配规则目录读取失败。'),categories:[],assignmentRules:[]};}
  }
  function currentCatalog(context) {
    const scope=scopeFor(context);if(!scope||!canRead(context))return fail('当前目录读取权限已变化。');
    const cached=caches.get(identity(context,scope));if(!cached)return fail('请先读取当前分配规则目录。');
    try {const current=project(window.DModuleHost?.currentCatalog?.(),scope);
      return current.revision===cached.revision?copy(cached):fail('分类或分配规则已变化，请重新读取后操作。');
    }catch(error){return fail(error?.message||'当前分配规则目录无法复核。');}
  }
  const shape=rule=>object(rule)&&text(rule.id)&&text(rule.categoryId)&&typeof rule.enabled==='boolean'&&
    (rule.assignmentRuleId==null||typeof rule.assignmentRuleId==='string');
  function read(context=window.DSession?.context?.()) {
    const scope=scopeFor(context);if(!scope||!canExecute(context))return {...fail('当前账号没有本租户赛马配置读取权限。'),revision:0,rules:[]};
    try {
      const bytes=localStorage.getItem(keyFor(scope));if(bytes===null)return {ok:true,...scope,revision:0,rules:[]};
      const value=JSON.parse(bytes);
      if(value?.version!==VERSION||value.tenantId!==scope.tenantId||value.brandId!==scope.brandId||!Number.isSafeInteger(value.revision)||
          value.revision<1||!Array.isArray(value.rules)||value.rules.some(rule=>!shape(rule))||
          new Set(value.rules.map(rule=>rule.id)).size!==value.rules.length||
          new Set(value.rules.filter(rule=>text(rule.assignmentRuleId)).map(rule=>rule.assignmentRuleId)).size!==value.rules.filter(rule=>text(rule.assignmentRuleId)).length)throw Error();
      return {ok:true,...scope,revision:value.revision,rules:copy(value.rules).map(rule=>({...rule,source:SOURCE}))};
    }catch(_){return {...fail('赛马配置读取失败，原资料未修改。'),...scope,revision:0,rules:[]};}
  }
  function mutate(context,input,operation) {
    const scope=scopeFor(context);if(!scope||!canManage(context))return fail('当前账号没有本租户赛马配置维护权限。');
    const catalog=currentCatalog(context);if(!catalog.ok)return catalog;
    if(operation!=='remove'&&input.catalogRevision!==catalog.revision)return fail('分配规则目录版本已变化，请重新读取。');
    let original;try{original=localStorage.getItem(keyFor(scope));}catch(_){return fail('当前赛马配置存储无法读取。');}
    const old=read(context);if(!old.ok)return old;
    if(input.expectedRevision!==old.revision)return fail('赛马配置已变化，请重新读取。');
    const rules=copy(old.rules);let rule,index;
    if(operation==='save') {
      const raw=input.rule||{},id=text(raw.id)||'RACE-'+(window.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+(++serial));
      index=rules.findIndex(row=>row.id===id);if(raw.id&&index<0)return fail('原配置已删除或不在当前租户。');
      const assignment=catalog.assignmentRules.find(row=>row.id===raw.assignmentRuleId);
      if(!assignment)return fail('请选择当前已启用的分配规则；旧分类配置须显式绑定后才能保存。');
      if(text(raw.categoryId)&&text(raw.categoryId)!==assignment.categoryId)return fail('二级分类必须由所选分配规则派生，不能跨分类保存。');
      rule={id,assignmentRuleId:assignment.id,assignmentRuleName:assignment.name,assignmentRuleVersion:assignment.version,
        categoryId:assignment.categoryId,source:SOURCE,enabled:raw.enabled,
        ...(index>=0&&rules[index].createdAt?{createdAt:rules[index].createdAt}:index<0?{createdAt:new Date().toISOString()}:{}),updatedAt:new Date().toISOString(),updatedBy:context.account.id};
      if(!shape(rule))return fail('请选择分配规则和启用状态。');
      if(rules.some(row=>row.id!==id&&row.assignmentRuleId===rule.assignmentRuleId))return fail('每条分配规则只能保留一条赛马配置，请编辑原配置。');
      if(index<0)rules.push(rule);else rules[index]=rule;
    } else {
      index=rules.findIndex(row=>row.id===input.id);if(index<0)return fail('原配置已删除或不在当前租户。');
      if(operation==='remove')rules.splice(index,1);
      else {
        if(typeof input.enabled!=='boolean')return fail('请选择启用或停用。');
        rule={...rules[index],enabled:input.enabled,updatedAt:new Date().toISOString(),updatedBy:context.account.id};
        const assignment=catalog.assignmentRules.find(row=>row.id===rule.assignmentRuleId);
        if(rule.enabled&&(!assignment||assignment.categoryId!==rule.categoryId))return fail('分配规则已失效或旧分类配置未绑定，不能启用。');
        rules[index]=rule;
      }
    }
    let before,bytes;
    try {
      before=original;if(localStorage.getItem(keyFor(scope))!==before||!canManage(context)||!currentCatalog(context).ok||read(context).revision!==old.revision) return fail('权限、目录或配置版本已变化，操作未保存。');
      bytes=JSON.stringify({version:VERSION,...scope,revision:old.revision+1,rules});localStorage.setItem(keyFor(scope),bytes);
      if(localStorage.getItem(keyFor(scope))!==bytes)throw Error();
      return {ok:true,...scope,revision:old.revision+1,rules:copy(rules),...(rule?{rule:copy(rule)}:{})};
    }catch(_){try{if(bytes&&localStorage.getItem(keyFor(scope))===bytes){if(before===null)localStorage.removeItem(keyFor(scope));else localStorage.setItem(keyFor(scope),before);}}catch(_){}
      return fail('赛马配置未保存，请重新读取后重试。');}
  }
  const save=(context,input={})=>mutate(context,input,'save');
  const toggle=(context,input={})=>mutate(context,input,'toggle');
  const remove=(context,input={})=>mutate(context,input,'remove');
  const enabled=row=>row?.enabled!==false&&row?.status!=='停用'&&(row?.enabled===true||row?.status==='启用');
  function scoreOf(raw) {
    if(typeof raw==='number')return Number.isSafeInteger(raw)&&raw>=0?raw:null;
    if(typeof raw!=='string'||!/^\d+$/.test(raw.trim()))return null;
    const value=Number(raw);return Number.isSafeInteger(value)&&value>=0?value:null;
  }
  function foundation(context=window.DSession?.context?.()) {
    const scope=scopeFor(context);if(!scope||!canExecute(context))return fail('当前租户赛马基础数据不可读取。');
    try {
      const data=window.DReview21FoundationDictionary?.read?.(scope.brandId),rawGroups=data?.items?.NEV_HORSE_RACE_GROUP,rawMembers=data?.items?.NEV_TEST_DRIVE_DEALER;
      if(!Array.isArray(rawGroups)||!Array.isArray(rawMembers)||rawGroups.some(row=>!object(row))||rawMembers.some(row=>!object(row)))throw Error();
      const groups=rawGroups.map(row=>({id:text(row.code),name:text(row.name),enabled:enabled(row)})).filter(row=>row.id&&row.name);
      const members=rawMembers.map(row=>{
        const groupName=text(row.relatedGroup),matches=groups.filter(group=>group.name===groupName);
        return {code:validCode(row.externalStoreCode)?row.externalStoreCode:validCode(row.code)?row.code:'',name:text(row.name),
          groupId:matches.length===1?matches[0].id:'',groupName,score:scoreOf(row.scheduleScore),enabled:enabled(row)};
      }).filter(row=>row.code);
      return {ok:true,groups,members,fingerprint:JSON.stringify([scope.brandId,groups,members])};
    }catch(_){return {...fail('当前品牌的赛马小组或门店评分目录不可读取。'),groups:[],members:[],fingerprint:''};}
  }
  function rank({stores=[],importedCodes=[],groups=[],members=[]}={}) {
    const warnings=[],activeGroups=(Array.isArray(groups)?groups:[]).filter(group=>group?.enabled===true&&text(group.id)&&text(group.name));
    const groupById=new Map();for(const group of activeGroups)if(!groupById.has(group.id))groupById.set(group.id,group);
    const activeMembers=[];
    for(const member of Array.isArray(members)?members:[]) {
      if(member?.enabled!==true||!validCode(member.code))continue;
      let group=member.groupId?groupById.get(member.groupId):null;
      if(!member.groupId){const matches=activeGroups.filter(group=>group.name===member.groupName);if(matches.length===1)group=matches[0];}
      if(!group){warnings.push('门店「'+member.code+'」的赛马小组无效或未启用，不参与排序。');continue;}
      activeMembers.push({...member,groupId:group.id,groupName:group.name,score:scoreOf(member.score)});
    }
    const input=new Set((Array.isArray(importedCodes)?importedCodes:[]).filter(validCode));
    const matchedIds=new Set(activeMembers.filter(member=>input.has(member.code)).map(member=>member.groupId));
    const matchedGroups=activeGroups.filter((group,index)=>matchedIds.has(group.id)&&activeGroups.findIndex(other=>other.id===group.id)===index).map(({id,name})=>({id,name}));
    const byCode=new Map();for(const member of activeMembers)if(matchedIds.has(member.groupId)){
      const rows=byCode.get(member.code)||[];rows.push(member);byCode.set(member.code,rows);
    }
    const seen=new Set(),ranked=[];
    (Array.isArray(stores)?stores:[]).forEach((store,index)=>{
      const code=validCode(store?.value)?store.value:validCode(store?.code)?store.code:'';
      if(code&&seen.has(code)){warnings.push('候选门店「'+code+'」重复，保留首次候选。');return;}if(code)seen.add(code);
      const rows=byCode.get(code)||[],scores=rows.map(row=>row.score).filter(value=>value!==null),score=scores.length?Math.max(...scores):null;
      if(rows.length>1)warnings.push('门店「'+code+'」存在多条赛马记录，取命中组中的最高有效评分。');
      if(rows.length&&rows.some(row=>row.score===null))warnings.push('门店「'+code+'」有空值或非法评分；缺少有效评分时放在命中组末尾。');
      const race={prioritized:rows.length>0,score,groupIds:[...new Set(rows.map(row=>row.groupId))],groupNames:[...new Set(rows.map(row=>row.groupName))],originalIndex:index};
      ranked.push({store:object(store)?{...store,race}:store,code,race});
    });
    ranked.sort((a,b)=>a.race.prioritized!==b.race.prioritized?a.race.prioritized?-1:1:
      a.race.prioritized&&a.race.score!==b.race.score?a.race.score===null?1:b.race.score===null?-1:b.race.score-a.race.score:
      a.race.originalIndex-b.race.originalIndex);
    return {ok:true,stores:ranked.map(row=>row.store),matchedGroupIds:matchedGroups.map(group=>group.id),matchedGroups,
      prioritizedCodes:ranked.filter(row=>row.race.prioritized).map(row=>row.code),warnings:[...new Set(warnings)],
      reason:matchedGroups.length?'命中有效赛马组，合并组内门店后统一按评分降序排序。':'原始门店编码未命中有效赛马组，保持原候选次序。'};
  }
  function runtimeScope(context,{assignmentRuleId,assignmentRuleVersion,categoryId}={}) {
    const scope=scopeFor(context);if(!scope||!canExecute(context))return fail('当前账号没有赛马配置读取权限。');
    const config=read(context);if(!config.ok)return config;
    const rule=config.rules.find(row=>text(row.assignmentRuleId)&&row.assignmentRuleId===assignmentRuleId);
    if(!rule||rule.categoryId!==categoryId)return fail('当前任务分配规则或分类与已保存赛马配置不一致。');
    const bound=taskAssignment(scope,assignmentRuleId,assignmentRuleVersion,categoryId);if(!bound.ok)return bound;
    return {ok:true,source:SOURCE,assignmentRuleId,assignmentRuleVersion:String(bound.row.version),categoryId,ruleId:rule.id};
  }
  function apply({context=window.DSession?.context?.(),assignmentRuleId,assignmentRuleVersion,categoryId,importedCodes,stores=[]}={}) {
    const unchanged=reason=>({ok:true,stores:[...stores],matchedGroupIds:[],matchedGroups:[],prioritizedCodes:[],warnings:[],reason});
    const config=read(context);if(!config.ok)return unchanged(config.error);
    const rule=config.rules.find(rule=>text(rule.assignmentRuleId)&&rule.assignmentRuleId===assignmentRuleId);
    if(!rule||!rule.enabled)return unchanged(!rule?'当前任务分配规则未配置赛马（旧分类通用项待绑定），保持原候选次序。':'当前赛马配置已停用，保持原候选次序。');
    const live=runtimeScope(context,{assignmentRuleId,assignmentRuleVersion,categoryId});if(!live.ok)return unchanged(live.error+' 保持原候选次序。');
    if(!Array.isArray(importedCodes)||!importedCodes.some(validCode))return unchanged('缺少原导入意向门店编码，保持原候选次序。');
    const data=foundation(context);if(!data.ok)return unchanged(data.error);
    return {...rank({stores,importedCodes,groups:data.groups,members:data.members}),source:SOURCE,assignmentRuleId,
      revision:config.revision,ruleId:rule.id,foundationFingerprint:data.fingerprint};
  }
  window.DRacingStoreRules=Object.freeze({PAGE_ID,SOURCE,canRead,canManage,loadCatalog,read,save,toggle,remove,foundation,rank,runtimeScope,apply});
})();
