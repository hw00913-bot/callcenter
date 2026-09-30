/** 预外呼 / IVR 外呼四步任务创建，保留既有草稿与接口字段。 */
(function () {
  'use strict';

  const ui = PlatformUI;
  const esc = ui.escape;
  const storageKey = 'cloud-task-wizard-drafts-v1';
  const activeKey = 'cloud-task-wizard-active-v1';
  const createdTasksKey = 'cloud-task-created-v1';
  const creationJournalKey = 'cloud-task-creation-transaction-v1';
  const repeatJournalKey = 'cloud-task-repeat-transaction-v1';
  const centerKey = 'cloud-task-center-context-v1';
  const predictiveSteps = [{step:2,label:'任务与客户',hint:'联系谁'}, {step:4,label:'接听团队配置',hint:'如何接听'}, {step:5,label:'时间与重呼',hint:'何时联系'}, {step:6,label:'确认创建',hint:'检查并保存'}];
  const automaticSteps = [{step:4,label:'选择语音流程',hint:'接通后做什么'}, {step:5,label:'呼叫设置',hint:'何时与如何联系'}, {step:2,label:'客户名单',hint:'联系谁'}, {step:6,label:'确认创建',hint:'检查并保存'}];
  function stepsFor(draft) { return draft.type === 'IVR 外呼' ? automaticSteps : predictiveSteps; }
  const centerTabs = [
    { key: 'overview', label: '运行监控' },
    { key: 'customers', label: '客户数据' },
    { key: 'resources', label: '任务设置' },
    { key: 'execution', label: '执行明细' },
    { key: 'calls', label: '通话记录' },
    { key: 'results', label: '通话结果' }
  ];
  let drafts = loadDrafts();
  let createdTasks = loadCreatedTasks();
  let wizardDiscardBaseline = null;

  function loadDrafts() {
    try { const rows = JSON.parse(sessionStorage.getItem(storageKey) || '[]'); return Array.isArray(rows) ? rows.filter(item => item && item.values && typeof item.values === 'object' && ['预外呼', 'IVR 外呼'].includes(item.type)) : []; }
    catch (error) { return []; }
  }

  function loadCreatedTasks() {
    try { const rows = JSON.parse(sessionStorage.getItem(createdTasksKey) || '[]'); return Array.isArray(rows) ? rows.filter(item => item && item.taskId && ['预外呼', 'IVR 外呼'].includes(item.callType)) : []; }
    catch (error) { return []; }
  }

  // Preserve old field IDs, but old automatic drafts must revisit the new first step.
  function normalizeStep(draft) {
    const steps=stepsFor(draft),first=steps[0].step;
    if(draft.type==='IVR 外呼'&&draft.wizardVersion!==2){draft.step=first;draft.furthestIndex=0;draft.returnToReview=false;draft.wizardVersion=2;draft.values.transferEnabled=false;draft.values.skillGroupId='';draft.values.executionQueueId='';}
    if(!steps.some(item=>item.step===draft.step))draft.step=first;
    const current=steps.findIndex(item=>item.step===draft.step);
    if(!Number.isInteger(draft.furthestIndex))draft.furthestIndex=Math.max(current,steps.findIndex(item=>item.step===draft.furthestStep));
    draft.furthestIndex=Math.min(steps.length-1,Math.max(current,draft.furthestIndex));
    if(draft.type==='IVR 外呼'&&!draft.values.providerIvrId&&draft.values.contactFlowId){const selected=AliCtiIvr.resolve(draft.values,draft);if(selected.ok)draft.values.providerIvrId=String(selected.row.id);}
  }

  // Finish a interrupted local rollback before restoring saved tasks on refresh.
  recoverTaskCreation();
  const unfinishedCreation=readCreationJournal();
  createdTasks.filter(row=>unfinishedCreation?.committed||row.taskId!==unfinishedCreation?.taskId).forEach(row => {
    const target = row.callType === '预外呼' ? CloudCallData.predictiveTasks : CloudCallData.ivrTasks;
    const existing = CloudCallData.tasks.find(item => item.taskId === row.taskId) || target.find(item => item.taskId === row.taskId);
    // Seed tasks may also have been paused. Restore their saved state in place,
    // while refusing a saved row that changes an existing task's ownership.
    if (existing && ['tenantId', 'enterpriseId', 'callType'].some(key => existing[key] !== row[key])) return;
    const restored = existing ? Object.assign(existing, row) : row;
    const typed = target.find(item => item.taskId === row.taskId);
    if (typed) Object.assign(typed, restored); else target.unshift(restored);
    const listed = CloudCallData.tasks.find(item => item.taskId === row.taskId);
    if (listed) Object.assign(listed, restored); else CloudCallData.tasks.unshift(restored);
  });

  function removeListedTask(id){for(const list of [CloudCallData.tasks,CloudCallData.predictiveTasks,CloudCallData.ivrTasks])for(let n=list.length-1;n>=0;n--)if(list[n].taskId===id)list.splice(n,1);}
  createdTasks.filter(r=>r.status==='已删除').forEach(r=>removeListedTask(r.taskId));
  recoverRepeatArrangement();

  function persist() { sessionStorage.setItem(storageKey, JSON.stringify(drafts)); }
  function persistCreatedTask(row) {
    const next=createdTasks.filter(item=>item.taskId!==row.taskId);
    next.unshift(JSON.parse(JSON.stringify(row)));
    sessionStorage.setItem(createdTasksKey, JSON.stringify(next));
    createdTasks=next;
    window.ScenarioDemo?.saveTask(row);
  }
  function journalStorage(){return typeof localStorage==='undefined'?sessionStorage:localStorage;}
  function readCreationJournal(){try{const value=JSON.parse(journalStorage().getItem(creationJournalKey)||'null');return value===null||value.version===1?value:{invalid:true};}catch(_){return {invalid:true};}}
  function recoverTaskCreation(){
    const record=readCreationJournal();if(!record)return true;if(record.invalid)return false;
    if(record.committed){try{journalStorage().removeItem(creationJournalKey);return true;}catch(_){return false;}}
    // Only restore the rows touched by this creation. Concurrent unrelated edits stay intact.
    if(record.attachment?.changes?.length&&!CustomerTasks.rollbackTaskAttachment?.(record.attachment))return false;
    try{
      const current=loadCreatedTasks().filter(row=>row.taskId!==record.taskId);
      sessionStorage.setItem(createdTasksKey,JSON.stringify(current));createdTasks=current;
      const saved=loadDrafts(),index=saved.findIndex(row=>row.draftId===record.draftBefore.draftId);
      if(index<0)saved.unshift(structuredClone(record.draftBefore));
      else if(saved[index].status==='已提交')saved[index]=structuredClone(record.draftBefore);
      sessionStorage.setItem(storageKey,JSON.stringify(saved));drafts=saved;
      removeListedTask(record.taskId);
      journalStorage().removeItem(creationJournalKey);return true;
    }catch(_){removeListedTask(record.taskId);return false;}
  }
  function activeId() { return sessionStorage.getItem(activeKey) || ''; }
  function canUseWorkspace() { return AppState.effectiveAccess().valid && AppState.get().activeDomain === 'CLOUD_CONTACT_CENTER' && AppState.canAction('task.create'); }
  function canAccessObject(item) {
    const owner = tenant(item?.tenantId);
    return canUseWorkspace() && !!item && !!item.tenantId && item.enterpriseId === AppState.get().enterpriseId &&
      owner.enterpriseId === item.enterpriseId && owner.status === '启用' && (owner.capabilitySet || []).includes('CLOUD_CONTACT_CENTER') && AppState.authorizeObject('task.create', item);
  }
  function canAccessDraft(item) { return canAccessObject(item) && item.status === '草稿' && item.createdByAccountId === AppState.account().accountId; }
  function clearActiveContext() {
    sessionStorage.removeItem(activeKey);
    sessionStorage.removeItem(centerKey);
    AppState.setDirty(false);
  }
  function activeDraft() {
    const item = drafts.find(item => item.draftId === activeId());
    if (canAccessDraft(item)) return item;
    if (activeId()) clearActiveContext();
    return null;
  }
  function tenant(id) { return (CloudCallData.tenants || []).find(item => item.tenantId === id) || {}; }
  function plan(id) { return (CloudCallData.callPlans || []).find(item => item.callPlanId === id) || CloudCallData.tasks.find(t=>t.planId===id)?.executionConfig || {}; }
  // Read a task's own frozen settings; changing a shared template never changes its historical strategy.
  function taskCallStrategy(row){
    if(row.planSnapshot)return AliCtiFields.callStrategyValue(row.planSnapshot.callStrategy);
    return AliCtiFields.callStrategyValue(row.callStrategy??row.alictiCreateDraft?.fields?.callStrategy??row.executionConfig?.callStrategy);
  }
  function resolveEffectiveCnos(draft) {
    const v = draft?.values || {};
    let cnoList = Array.isArray(v.cnos) ? v.cnos : String(v.cnos || '').split(',').filter(Boolean);
    if (!cnoList.length && v.skillGroupId) {
      const group = (CloudCallData.physicalSkillGroups || []).find(g => (g.skillGroupId === v.skillGroupId || g.physicalGroupId === v.skillGroupId) && g.tenantId === draft.tenantId);
      const ids = new Set((CloudCallData.agentSkills || []).filter(r => r.physicalGroupId === group?.physicalGroupId && r.status === '已生效').map(r => r.identityId));
      cnoList = (CloudCallData.agents || []).filter(a => ids.has(a.contactCenterIdentityId) && a.tenantId === draft.tenantId).map(a => a.cno);
    }
    return cnoList;
  }
  function timeProperties(source={}) {
    const mode=Object.hasOwn(source,'autoTaskType')?source.autoTaskType:0;
    return {autoTaskType:mode,allowedTimeIds:Number(mode)===0?[]:structuredClone(Object.hasOwn(source,'allowedTimeIds')?source.allowedTimeIds:[]),forbiddenTimeIds:structuredClone(Object.hasOwn(source,'forbiddenTimeIds')?source.forbiddenTimeIds:[]),timeConditionSnapshot:structuredClone(source.timeConditionSnapshot??[])};
  }
  function taskTimeSource(row) {
    const sources=[row.planSnapshot||{},row,row.executionConfig||{}];
    return Object.fromEntries(['autoTaskType','allowedTimeIds','forbiddenTimeIds','timeConditionSnapshot'].flatMap(key=>{
      const source=sources.find(item=>Object.hasOwn(item,key)&&item[key]!==undefined);
      return source?[[key,source[key]]]:[];
    }));
  }
  function timeNames(ids,tenantId,snapshot=null) {
    if(!Array.isArray(ids))return '请重新选择';
    const catalog=snapshot===null?window.AliCtiTimeConditions?.catalog(tenantId):null;
    const rows=snapshot===null?(catalog?.ok?catalog.rows:[]):Array.isArray(snapshot)?snapshot:[];
    return ids.map(id=>{const row=rows.find(item=>String(item.id)===String(id));return row?(row.name||'时间条件')+(window.AliCtiTimeConditions?.summary?'（'+AliCtiTimeConditions.summary(row)+'）':''):'时间条件 '+String(id)+'（需重新选择）';}).join('；');
  }
  function timeSummary(source,tenantId,historical=false) {
    const v=timeProperties(source),snapshot=historical?v.timeConditionSnapshot:null;
    const hasMode=Object.hasOwn(source,'autoTaskType')&&source.autoTaskType!=null;
    const hasForbidden=Object.hasOwn(source,'forbiddenTimeIds')&&Array.isArray(source.forbiddenTimeIds);
    return [['呼叫时段',historical&&!hasMode?'未记录':Number(v.autoTaskType)===1?'仅在指定时段呼叫':'连续呼叫'],...(hasMode&&Number(v.autoTaskType)===1?[['可呼叫时段',historical&&!Array.isArray(source.allowedTimeIds)?'未记录':timeNames(v.allowedTimeIds,tenantId,snapshot)||'尚未选择']]:[]),['禁止呼叫时段',historical&&!hasForbidden?'未记录':timeNames(v.forbiddenTimeIds,tenantId,snapshot)||'未设置']];
  }
  function timeConditionChoices(draft,key,label,required=false) {
    const catalog=window.AliCtiTimeConditions?.catalog(draft.tenantId)||{ok:false,rows:[],message:'时间条件尚未就绪，请刷新后重试'};
    const ids=Array.isArray(draft.values[key])?draft.values[key]:[],rows=catalog.ok?catalog.rows:[];
    const missing=ids.filter(id=>!rows.some(row=>String(row.id)===String(id)));
    return `<div class="field full"><span>${label}${required?' <b>*</b>':' <small>（选填）</small>'}</span><div class="rr-skill-options" role="group" aria-label="${label}">${rows.map(row=>`<label class="rr-skill-option"><input type="checkbox" ${ids.some(id=>String(id)===String(row.id))?'checked':''} onchange="CloudTaskWorkspace.toggleTimeCondition('${key}',${esc(JSON.stringify(String(row.id)))})"><span class="rr-skill-name">${esc(row.name)}<small>${esc(window.AliCtiTimeConditions?.summary?.(row)||'')}</small></span></label>`).join('')}${missing.map(id=>`<label class="rr-skill-option"><input type="checkbox" checked onchange="CloudTaskWorkspace.toggleTimeCondition('${key}',${esc(JSON.stringify(String(id)))})"><span class="rr-skill-name">时间条件 ${esc(id)}<small>已不可用，请取消后重新选择</small></span></label>`).join('')}</div>${!catalog.ok?'<small class="form-error">'+esc(catalog.message)+'</small>':!rows.length?'<small class="field-hint">本租户暂无可用时间条件，请先在“时间条件”中维护。</small>':''}</div>`;
  }
  function timeConditionsStep(draft) {
    const periodic=Number(draft.values.autoTaskType??0)===1;
    return `<section class="wizard-schedule"><h3>哪些时段可以呼叫</h3><div class="wizard-choice-grid"><label class="wizard-choice ${!periodic?'selected':''}"><input type="radio" name="autoTaskType" value="0" ${!periodic?'checked':''} onchange="CloudTaskWorkspace.setTimeMode(this.value)"><span><strong>连续呼叫</strong><small>任务运行期间持续安排客户呼叫</small></span></label><label class="wizard-choice ${periodic?'selected':''}"><input type="radio" name="autoTaskType" value="1" ${periodic?'checked':''} onchange="CloudTaskWorkspace.setTimeMode(this.value)"><span><strong>仅在指定时段呼叫</strong><small>按选定的时间条件安排呼叫</small></span></label></div><div id="wizardTimeConditions" class="form-grid">${periodic?timeConditionChoices(draft,'allowedTimeIds','可呼叫时段',true):''}${timeConditionChoices(draft,'forbiddenTimeIds','禁止呼叫时段')}</div>${errorSlot('wizardTimeConditions')}</section>`;
  }
  const callerSettings = values => AliCtiFields.snapshotCallerSettings(values);
  const taskCallerSettings = row => AliCtiFields.taskCallerSettings(row);
  const callerAccount = scope => (CloudCallData.instances||[]).find(row=>row.enterpriseId===scope.enterpriseId)||{};
  const callerFromAccount = (scope,values) => AliCtiFields.callerSettingsFromAccount(callerAccount(scope),values);
  const callerNavigationOptions = scope => AliCtiFields.callerNavigationOptions(callerAccount(scope));
  const callerNavigationLabel = value => value.customerClidsGroup ? `${value.callerNavigationName||'外显导航'} · ${value.customerClidsGroup}` : '未选择';
  function callerPoolCatalog(scope) {
    if(typeof window.AliCtiNumberPools?.catalog!=='function')return {available:false,ok:false,rows:[],message:'号码池目录尚未就绪，请刷新后重试。'};
    let result;
    try { result=window.AliCtiNumberPools.catalog(scope.tenantId); }
    catch (_) { result={ok:false,message:'号码池目录暂不可用，请稍后重试。'}; }
    const ok=result?.ok===true&&Array.isArray(result.rows)&&
      (result.tenantId===undefined||String(result.tenantId)===String(scope.tenantId))&&
      (result.enterpriseId===undefined||String(result.enterpriseId)===String(scope.enterpriseId));
    const rows=ok?result.rows.filter(row=>row&&typeof row==='object'&&
      String(row.tenantId)===String(scope.tenantId)&&String(row.enterpriseId)===String(scope.enterpriseId)&&
      row.id!==undefined&&row.id!==null&&typeof row.name==='string'&&row.name.trim()):[];
    return {available:true,ok,rows,message:result?.message||'号码池目录暂不可用，请稍后重试。'};
  }
  function callerPoolMatch(pool,rows) {
    const matches=rows.filter(row=>row.name===pool?.name&&(!pool?.poolId||String(row.id)===String(pool.poolId)));
    return matches.length===1?matches[0]:null;
  }
  function callerPoolValidation(scope) {
    const catalog=callerPoolCatalog(scope);
    return {availableNavigations:callerNavigationOptions(scope),...(catalog.available?{availablePools:catalog.rows,tenantId:scope.tenantId,enterpriseId:scope.enterpriseId}:{})};
  }
  function hasSavedCustomerTimeout(task) {
    return [task?.planSnapshot,task,task?.alictiUpdateDraft?.fields,task?.alictiCreateDraft?.fields,task?.executionConfig]
      .some(source=>source&&Object.hasOwn(source,'customerTimeout')&&source.customerTimeout!==undefined&&source.customerTimeout!==null&&source.customerTimeout!=='');
  }
  function callerSummary(values,historicalTask=null,poolContext=historicalTask) {
    const v=historicalTask?callerSettings(values):poolContext?callerFromAccount(poolContext,values):callerSettings(values);
    const catalog=poolContext?callerPoolCatalog(poolContext):{available:false,ok:false,rows:[]};
    return [['外显导航',callerNavigationLabel(v)],
      ['号码池',v.clidPoolList.length?v.clidPoolList.map(pool=>pool.name+(pool.priority!==undefined?'（优先级 '+pool.priority+'）':'')+(catalog.available?(catalog.ok?callerPoolMatch(pool,catalog.rows)?'':'（已失效，请重选）':'（目录暂不可核对）'):'')).join('；'):'未指定'],
      ['客户接听等待时间',historicalTask&&!hasSavedCustomerTimeout(historicalTask)?'未记录':String(v.customerTimeout)+' 秒']];
  }
  function callerFields(draft) {
    const v=draft.values,pools=Array.isArray(v.clidPoolList)?v.clidPoolList:[];
    const navigations=callerNavigationOptions(draft),selected=navigations.find(row=>row.customerClidsGroup===v.customerClidsGroup);
    const catalog=callerPoolCatalog(draft),poolRows=catalog.rows;
    return `<section class="wizard-caller-settings">
      <label class="field"><span>外显导航 <b>*</b></span><select id="wizardCallerNavigation" onchange="CloudTaskWorkspace.setCallerNavigation(this.value)"><option value="">请选择外显导航</option>${navigations.map(row=>`<option value="${esc(row.customerClidsGroup)}" ${selected?.customerClidsGroup===row.customerClidsGroup?'selected':''}>${esc(row.name)} · ${esc(row.customerClidsGroup)}</option>`).join('')}${v.customerClidsGroup&&!selected?`<option value="${esc(v.customerClidsGroup)}" selected disabled>原导航已移除，请重新选择</option>`:''}</select><small class="field-hint">从当前 AliCti 账号登记的导航中选择一个；本任务可指定多个当前租户的号码池。</small>${!navigations.length?'<small class="form-error">当前账号尚未登记外显导航，请先在账号资料中维护。</small>':''}${errorSlot('wizardCallerNavigation')}</label>
      <details id="wizardCallerPools" class="wizard-more" ${pools.length?'open':''}><summary>号码池<span>选填</span></summary><div class="wizard-more-body"><p class="field-hint">从当前租户的 AliCti 号码池中选择。优先级可手动填写，数字越小越优先；留空不传优先级。</p>
        <div class="wizard-pool-list">${pools.map((pool,index)=>{const selected=callerPoolMatch(pool,poolRows),missing=!!pool.name&&!selected;return `<div class="wizard-pool-row"><label class="field"><span>号码池名称 <b>*</b></span><select aria-label="号码池 ${index+1} 名称" onchange="CloudTaskWorkspace.updateCallerPool(${index},'poolId',this.value)"><option value="" ${!pool.name?'selected':''}>请选择号码池</option>${poolRows.map(row=>`<option value="${esc(String(row.id))}" ${selected&&String(selected.id)===String(row.id)?'selected':''}>${esc(row.name)}</option>`).join('')}${missing?`<option value="" selected disabled>${esc(pool.name)}（${catalog.ok?'已失效，请重选':'暂不可核对，请重试'}）</option>`:''}</select></label><label class="field"><span>优先级（选填）</span><input aria-label="号码池 ${index+1} 优先级" type="number" step="1" value="${esc(pool.priority??'')}" placeholder="手动填写" oninput="CloudTaskWorkspace.updateCallerPool(${index},'priority',this.value)"></label><button type="button" class="btn-link" aria-label="删除号码池 ${index+1}" onclick="CloudTaskWorkspace.removeCallerPool(${index})">删除</button></div>`;}).join('')}</div>
        <button type="button" class="btn" onclick="CloudTaskWorkspace.addCallerPool()" ${catalog.ok&&poolRows.length?'':'disabled'}>添加号码池</button>${catalog.ok?(poolRows.length?'':'<small class="field-hint">当前租户暂无可用号码池。</small>'):`<small class="form-error">${esc(catalog.message)}</small>`}${errorSlot('wizardCallerPools')}</div></details>
      <details id="wizardCallerTimeout" class="wizard-more"><summary>客户接听等待时间<span id="wizardCustomerTimeoutSummary">${esc(v.customerTimeout??30)} 秒</span></summary><div class="wizard-more-body"><label class="field"><span>客户接听等待时间</span><div class="wizard-unit-input"><input id="wizardCustomerTimeout" type="number" min="5" max="60" step="1" value="${esc(v.customerTimeout??30)}" oninput="CloudTaskWorkspace.update('customerTimeout',this.value)"><span>秒</span></div><small class="field-hint">默认 30 秒，可设置 5–60 秒。</small>${errorSlot('wizardCustomerTimeout')}</label></div></details>
    </section>`;
  }
  function settingNumber(values,key,fallback) { return values[key]===''||values[key]==null?fallback:Number(values[key]); }
  function taskConfig(draft){
    const v=draft.values;
    const isObg=draft.type==='预外呼'&&Number(v.callGroupType)===2;
    return {
      callPlanId:'CONFIG-'+draft.draftId,
      name:'本次任务配置',
      tenantId:draft.tenantId,
      enterpriseId:draft.enterpriseId,
      callType:draft.type,
      status:'已发布',
      publishedVersion:'V1',
      targetSkillGroupId:draft.type==='预外呼'?'':(v.transferEnabled?v.skillGroupId:''),
      executionQueueId:draft.type==='预外呼'?'':(v.transferEnabled?v.skillGroupId:''),
      contactFlowId:v.contactFlowId,
      providerIvrId:v.providerIvrId||'',
      contactFlowName:draft.type==='IVR 外呼'?selectedFlowName(draft):(v.contactFlowId?flowName(v.contactFlowId):''),
      ...callerSettings(v),
      transferEnabled:draft.type==='预外呼'?false:!!v.transferEnabled,
      isRepeat:Number(v.isRepeat??0),
      ...(draft.type==='预外呼'?{
        callStrategy:AliCtiFields.callStrategyValue(v.callStrategy),
        minAvailableAgentCount:Number(v.minAvailableAgentCount),
        callGroupType:isObg?2:1,
        cnos:!isObg?resolveEffectiveCnos(draft).join(','):'',
        agentSelectionSnapshot:!isObg?selectedAgentSnapshot(resolveEffectiveCnos(draft),draft):[],
        outboundGroupId:isObg?v.outboundGroupId:'',
        agentGroup:isObg?(v.agentGroup||window.OutboundGroups?.forTask(v.outboundGroupId,draft)?.gno||''):'',
        outboundGroupSnapshot:isObg?(v.outboundGroupSnapshot||window.OutboundGroups?.forTask(v.outboundGroupId,draft)):null
      }:{}),
      ...timeProperties(v),
      timeConditionSnapshot:structuredClone(AliCtiFields.taskTimeFields(v,draft.tenantId).snapshot||[]),
      retryPolicy:v.retryPolicy?structuredClone(v.retryPolicy):null,
      description:v.description||'',businessTagNames:v.businessTagNames||'',
      autoComplete:settingNumber(v,'autoComplete',draft.type==='预外呼'?0:1),
      forceEndFlag:v.stopScheduled?settingNumber(v,'forceEndFlag',0):0,
      retryStrategyOnlyToday:settingNumber(v,'retryStrategyOnlyToday',0),
      callPriority:structuredClone(v.callPriority||{retryFirst:true,retryDesc:0,firstCallOrderType:0}),
      concurrency:settingNumber(v,'concurrency',draft.type==='预外呼'?0:1),
      ...(draft.type==='预外呼'?{
        callRouteStrategy:settingNumber(v,'callRouteStrategy',1),agentTimeout:settingNumber(v,'agentTimeout',10),
        wrapup:settingNumber(v,'wrapup',30),maxWaitTime:settingNumber(v,'maxWaitTime',40),
        quotiety:settingNumber(v,'quotiety',1),predictAdjust:settingNumber(v,'predictAdjust',100),
        answerRate:settingNumber(v,'answerRate',50),warmUpDuration:settingNumber(v,'warmUpDuration',300),
        isRewarm:settingNumber(v,'isRewarm',1)
      }:{})
    };
  }
  function group(id) { return (CloudCallData.physicalSkillGroups || []).find(item => item.skillGroupId === id || item.physicalGroupId === id) || {}; }
  function number(id) { return (CloudCallData.phoneNumbers || []).find(item => item.numberId === id) || {}; }
  function nowText() { return new Date().toLocaleString('zh-CN', { hour12: false }).replaceAll('/', '-'); }

  function initialTenantId() {
    if (!AppState.isSuper()) return AppState.get().tenantId;
    return AppState.availableTenants().find(item => (item.capabilitySet || []).includes('CLOUD_CONTACT_CENTER'))?.tenantId || '';
  }

  function makeDraft(type) {
    const tenantId = initialTenantId();
    const stamp = Date.now();
    const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    return {
      draftId: `DRAFT-${stamp}-${crypto.randomUUID().slice(0, 8)}`,
      createdByAccountId: AppState.account().accountId,
      taskId: '',
      type,
      tenantId,
      enterpriseId: AppState.get().enterpriseId,
      step: type==='IVR 外呼'?4:2,
      furthestStep: type==='IVR 外呼'?4:2,
      furthestIndex: 0,
      wizardVersion: 2,
      status: '草稿',
      savedAt: '',
      createdAt: nowText(),
      values: {
        name: '',
        description:'',businessTagNames:'',
        sourceType: '客户导入批次',
        sourceRef: '',
        total: 0,
        planId: '',
        skillGroupId: '',
        ...AliCtiFields.callerSettingsFromAccount((CloudCallData.instances||[]).find(row=>row.enterpriseId===AppState.get().enterpriseId)||{}),
        callerMode:'navigation',callerNumberId:'',
        contactFlowId: '',
        providerIvrId: '',
        transferEnabled: false,
        scheduleMode: '保存后手工启动',
        scheduleAt: local,
        autoTaskType:0,allowedTimeIds:[],forbiddenTimeIds:[],stopScheduled:false,stopAt:'',
        retryPolicy: {...AliCtiRetry.create(type),timeType:2},
        autoComplete:type==='预外呼'?0:1,forceEndFlag:0,retryStrategyOnlyToday:0,
        callPriority:{retryFirst:true,retryDesc:0,firstCallOrderType:0},concurrency:type==='预外呼'?0:1,
        isRepeat: 0,
        minAvailableAgentCount: 10,
        ...(type==='预外呼'?{callStrategy:'4',callGroupType:1,cnos:[],outboundGroupId:'',
          callRouteStrategy:1,agentTimeout:10,wrapup:30,maxWaitTime:40,
          quotiety:1,predictAdjust:100,answerRate:50,warmUpDuration:300,isRewarm:1}:{})
      }
    };
  }

  function scenarioType(draft) { return draft.type === '预外呼' ? 'PREDICTIVE' : 'IVR_OUTBOUND'; }
  function routeForType(type) { return type === '预外呼' ? 'predictive-tasks' : 'ivr-tasks'; }
  function typeLabel(type) { return type === '预外呼' ? '预外呼' : '自动外呼'; }

  function start(type, draftId) {
    if (!canUseWorkspace() || !['预外呼', 'IVR 外呼'].includes(type)) return false;
    if(!recoverTaskCreation()){showToast('上次创建尚未恢复，请检查浏览器存储后重新进入；客户与任务不会重复提交','warning');return false;}
    let draft = draftId ? drafts.find(item => item.draftId === draftId) : null;
    if(draft?.repeatPredictive){showToast('请在原任务的‘待再次联系’中安排，不再新建任务','warning');return false;}
    if (draftId && (!canAccessDraft(draft) || draft.type !== type)) { clearActiveContext(); return false; }
    if (!draft) {
      draft = makeDraft(type);
      if (!canAccessDraft(draft)) return false;
      drafts.unshift(draft);
      persist();
    }
    openWizard(draft);
    return true;
  }

  function repeatSpecForDraft(draft) {
    return {...draft.repeatPredictive,tenantId:draft.tenantId,enterpriseId:draft.enterpriseId,scheduleMode:draft.values.scheduleMode,scheduleAt:draft.values.scheduleMode==='定时执行'?draft.values.scheduleAt:''};
  }

  function startRepeatPredictive(spec) {
    if(!canUseWorkspace()||!window.RepeatPredictive)return false;
    if(!recoverRepeatArrangement()){showToast('上次联系安排尚未恢复，请检查浏览器存储后重试','warning');return false;}
    const checked=RepeatPredictive.validateSpec(spec);
    if(!checked.ok){showToast(checked.message||'所选客户暂时无法安排再次预外呼','warning');return false;}
    const source=CloudCallData.tasks.find(row=>row.taskId===checked.sourceTaskId);
    if(!canAccessObject(source)||source.callType!=='预外呼'||!['待启动','执行中','已暂停'].includes(source.status)||Number(source.providerStatusCode)===3||source.alictiTaskControlPending){showToast('原任务已结束或状态尚未确认，不能再次安排','warning');return false;}
    const attachment=RepeatPredictive.prepareAttachment(source,spec);
    if(!attachment?.ok){showToast(attachment?.message||'本次联系安排无法保存','warning');return false;}
    const rows=attachment.changes.map(change=>({...change.after,batchId:change.batchId,batchName:change.batchName}));
    const next=structuredClone(source);
    const request=AliCtiFields.importFields(source,rows,{batchId:attachment.newBatch.id,name:attachment.newBatch.name,isRepeat:0});
    if(request.pending.length){showToast(request.pending.join('；'),'warning');return false;}
    // Append one import batch to the original task. Existing calls and strategy stay intact.
    next.alictiImportDrafts=[...(source.alictiImportDrafts||[]),request];
    AliCtiDemo.imported(next,[request]);
    next.alictiImportResults=[...(source.alictiImportResults||[]),...(next.alictiImportResults||[])];
    next.total=(Number(source.total)||0)+rows.length;
    next.updatedAt=nowText();
    const beforeStored=loadCreatedTasks().find(row=>row.taskId===source.taskId)||null;
    const transaction={version:1,taskId:source.taskId,taskBefore:structuredClone(source),taskAfter:structuredClone(next),beforeStored,attachment,committed:false};
    try{
      journalStorage().setItem(repeatJournalKey,JSON.stringify(transaction));
      if(!RepeatPredictive.commitAttachment(attachment))throw Error('客户保存失败');
      persistCreatedTask(next);
      journalStorage().setItem(repeatJournalKey,JSON.stringify({...transaction,committed:true}));
    }catch(_){
      const restored=recoverRepeatArrangement();
      showToast(restored?'本次安排未保存，原任务及通话记录已保留，请重试':'保存尚未完成，已保留恢复记录，请检查存储后重试','error');return false;
    }
    for(const list of [CloudCallData.tasks,CloudCallData.predictiveTasks])for(const row of list)if(row.taskId===source.taskId&&row.tenantId===source.tenantId&&row.enterpriseId===source.enterpriseId)Object.assign(row,next);
    try{journalStorage().removeItem(repeatJournalKey);}catch(_){}
    try{window.CustomerDirectory?.sync?.();RouteRuntime.refreshCurrent?.();}catch(_){}
    showToast(source.status==='已暂停'?'已加入本任务，继续任务后呼叫':'已加入本任务的待呼叫名单','success');
    return true;
  }

  function recoverRepeatArrangement(){
    let record;
    try{record=JSON.parse(journalStorage().getItem(repeatJournalKey)||'null');}catch(_){return false;}
    if(!record)return true;
    if(record.version!==1||!record.taskBefore||!record.attachment||record.taskBefore.taskId!==record.taskId)return false;
    if(record.committed){try{journalStorage().removeItem(repeatJournalKey);return true;}catch(_){return false;}}
    if(!window.RepeatPredictive?.rollbackAttachment(record.attachment))return false;
    try{
      const stored=loadCreatedTasks(),saved=stored.find(row=>row.taskId===record.taskId),runtime=CloudCallData.tasks.find(row=>row.taskId===record.taskId);
      const unchangedSave=JSON.stringify(saved||null)===JSON.stringify(record.beforeStored||null);
      const protectedRuntime=runtime&&(['已完成','已结束','已终止','已删除'].includes(runtime.status)||Number(runtime.providerStatusCode)===3||runtime.resourcePause);
      const latest=protectedRuntime||unchangedSave?(runtime||saved||record.taskBefore):(saved||runtime||record.taskBefore);
      if(latest.tenantId!==record.taskBefore.tenantId||latest.enterpriseId!==record.taskBefore.enterpriseId)return false;
      const task=structuredClone(latest),batchId=record.attachment.newBatch.id,count=record.attachment.newBatch.rows.length;
      const expectedTotal=Number(record.taskAfter?.total??(Number(record.taskBefore.total||0)+count));
      const hadBatch=(task.alictiImportDrafts||[]).some(request=>request.sourceBatchId===batchId);
      // Compensate only the fields written by this arrangement. In particular,
      // a later stop/pause/resource-protection state must never be rolled back.
      if((hadBatch||!record.taskAfter)&&Number(task.total)===expectedTotal)task.total=record.taskBefore.total;
      else if(hadBatch&&Number(task.total)>expectedTotal)task.total=Number(task.total)-count;
      for(const field of ['alictiImportDrafts','alictiImportResults']){
        if(record.taskAfter&&JSON.stringify(task[field])===JSON.stringify(record.taskAfter[field])){
          if(Object.hasOwn(record.taskBefore,field))task[field]=structuredClone(record.taskBefore[field]);else delete task[field];
        }else if(Array.isArray(task[field]))task[field]=task[field].filter(item=>item.sourceBatchId!==batchId);
      }
      if(record.taskAfter&&task.updatedAt===record.taskAfter.updatedAt){if(Object.hasOwn(record.taskBefore,'updatedAt'))task.updatedAt=record.taskBefore.updatedAt;else delete task.updatedAt;}
      const restored=stored.filter(row=>row.taskId!==record.taskId);
      if(record.beforeStored||JSON.stringify(task)!==JSON.stringify(record.taskBefore))restored.unshift(task);
      sessionStorage.setItem(createdTasksKey,JSON.stringify(restored));createdTasks=restored;
      window.ScenarioDemo?.saveTask(task);
      for(const list of [CloudCallData.tasks,CloudCallData.predictiveTasks])for(const row of list)if(row.taskId===record.taskId&&row.tenantId===task.tenantId&&row.enterpriseId===task.enterpriseId){for(const key of Object.keys(row))delete row[key];Object.assign(row,structuredClone(task));}
      journalStorage().removeItem(repeatJournalKey);return true;
    }catch(_){return false;}
  }

  function openWizard(draft) {
    wizardDiscardBaseline = { draftId: draft.draftId, snapshot: structuredClone(draft) };
    return RouteRuntime.openSecondary('cloud-task-create', {
      draftId: draft.draftId,
      refreshOnClose: true,
      onBackdropClick() {
        ui.confirm({
          id: 'task-wizard-backdrop-confirm',
          title: '关闭当前弹窗？',
          body: '<p>关闭后，本次未保存的填写将丢失，不会自动新增或更新任务。已保存的草稿仍会保留。</p>',
          cancelText: '继续填写',
          confirmText: '关闭弹窗',
          danger: true,
          onConfirm() {
            queueMicrotask(() => {
              const current = RouteRuntime.snapshot();
              if (current?.key === 'cloud-task-create' && current.options?.draftId === draft.draftId)
                RouteRuntime.back({ discardWizard: true, refresh: true });
            });
          }
        });
      },
      onBeforeClose(options = {}) {
        if (!options.discardWizard) return !activeDraft() || saveDraft(true);
        if (wizardDiscardBaseline?.draftId !== draft.draftId) return false;
        const previousDrafts = drafts;
        const baseline = wizardDiscardBaseline.snapshot;
        const index = drafts.findIndex(item => item.draftId === draft.draftId);
        drafts = drafts.slice();
        if (index >= 0) {
          if (baseline.savedAt) drafts[index] = structuredClone(baseline);
          else drafts.splice(index, 1);
        }
        try { persist(); } catch (_) {
          drafts = previousDrafts;
          showToast('当前填写尚未关闭，请重试', 'warning');
          return false;
        }
        sessionStorage.removeItem(activeKey);
        AppState.setDirty(false);
        return true;
      },
      onClose() {
        if (wizardDiscardBaseline?.draftId === draft.draftId) wizardDiscardBaseline = null;
        if (RouteRuntime.snapshot()?.key !== 'cloud-task-create') {
          sessionStorage.removeItem(activeKey);
          AppState.setDirty(false);
        }
      }
    });
  }

  function optionsFor(draft) {
    const tenantId = draft.tenantId;
    const enterpriseId = draft.enterpriseId;
    const plans = (CloudCallData.callPlans || []).filter(item => item.tenantId === tenantId && item.enterpriseId === enterpriseId && item.callType === draft.type && item.status === '已发布');
    const groups = (CloudCallData.physicalSkillGroups || []).filter(item => item.tenantId === tenantId && item.enterpriseId === enterpriseId && item.status === '已启用' && CloudResourceRules.members(item).length > 0);
    const outboundGroups = window.OutboundGroups ? window.OutboundGroups.choices(draft) : [];
    const agents = (CloudCallData.agents || []).filter(item => item.tenantId === tenantId && item.enterpriseId === enterpriseId && item.lifecycleStatus === '已启用' && item.acceptNewTasks !== false && item.callEnabled !== false && AliCtiFields.validExistingCno(item.cno));
    const numbers = (CloudCallData.phoneNumbers || []).filter(item => item.enterpriseId === enterpriseId && CloudResourceRules.usableNumber(item,tenantId,'呼出',draft.type) && (item.authorizedTenantIds || []).includes(tenantId));
    const ivrList = draft.type==='IVR 外呼'?AliCtiIvr.list(draft):null;
    const flows = draft.type==='IVR 外呼' ? ivrList.rows.map(row=>({...row,contactFlowId:row.localContactFlowId,name:row.ivrName})) : (CloudCallData.contactFlows || []).filter(item => item.enterpriseId === enterpriseId && item.status === '已发布' && item.usage === (draft.type==='预外呼'?'预外呼':'IVR外呼'));
    return { plans, groups, outboundGroups, agents, numbers, flows, ivrList };
  }

  function stepNavigation(draft) {
    const steps=stepsFor(draft),current=steps.findIndex(item=>item.step===draft.step);
    return '<nav class="task-wizard-steps" aria-label="创建任务步骤">' + steps.map((item, index) => {
      const state = item.step === draft.step ? 'active' : index < current ? 'done' : '';
      const reachable = index <= draft.furthestIndex;
      return `<button class="${state}" ${reachable ? '' : 'disabled'} ${item.step === draft.step ? 'aria-current="step"' : ''} onclick="CloudTaskWorkspace.goStep(${item.step})"><span>${state === 'done' ? '✓' : index + 1}</span><div><strong>${item.label}</strong><small>${item.hint}</small></div></button>`;
    }).join('') + '</nav>';
  }

  function heading(title, description, required = true) {
    return `<div class="wizard-step-heading"><div><h2 tabindex="-1" id="wizardStepTitle">${title}</h2><p>${description}</p></div>${required?'<span class="wizard-required-note">* 为必填项</span>':''}</div>`;
  }

  function displayName(value) { return String(value??'').replace(/\s*（(?:演示|模拟)）\s*$/u,''); }
  function selectedFlowName(draft) { if(draft.type!=='IVR 外呼')return flowName(draft.values.contactFlowId);const selected=AliCtiIvr.resolve(draft.values,draft);return selected.ok?displayName(selected.row.ivrName):'待选择可用语音流程'; }
  function flowName(id) { return displayName((CloudCallData.contactFlows || []).find(row => row.contactFlowId === id)?.name) || '未选择'; }
  function customerCount(draft) { return draft.repeatPredictive?(window.RepeatPredictive?.selectedRows(draft.repeatPredictive)||[]).length:(draft.values.customerIds || []).length; }
  function duplicateLabel(value) { return ['不去重，保留每条记录', '整个任务内去重', '本次导入号码去重', '每个批次内去重'][Number(value ?? 0)] || '未选择'; }
  function errorSlot(id) { return `<small class="wizard-field-error" id="${id}Error" hidden></small>`; }
  function retryText(draft) {
    const p = draft.values.retryPolicy;
    if (p?.mode === 'unset') return '已关闭';
    if (!p || AliCtiRetryEditor.issue(p, draft.type, draft.values.retryEditor)) return '待完善重呼设置';
    return `按呼叫状态重呼，最多 ${p.rounds.length} 次`;
  }

  function cnoValues(value) { return (Array.isArray(value)?value:String(value??'').split(',')).map(String).filter(Boolean); }
  function selectedAgentSnapshot(cnos,scope) {
    return cnoValues(cnos).map(cno=>{
      const agent=(CloudCallData.agents||[]).find(item=>item.cno===cno&&item.tenantId===scope.tenantId&&item.enterpriseId===scope.enterpriseId);
      return {cno,name:agent?.userName||agent?.name||''};
    });
  }
  function selectedAgentsText(value,scope,snapshot=null,historical=false) {
    const cnos=cnoValues(value);
    return cnos.length?cnos.map(cno=>{
      const saved=Array.isArray(snapshot)?snapshot.find(item=>String(item.cno)===cno):null;
      const current=historical?null:(CloudCallData.agents||[]).find(item=>item.cno===cno&&item.tenantId===scope.tenantId&&item.enterpriseId===scope.enterpriseId);
      const name=saved?.name||current?.userName||current?.name;
      return name?`${name}（工号 ${cno}）`:`工号 ${cno}`;
    }).join('、'):'未记录';
  }
  // The confirmation screen and saved task details use the same business labels.
  function resourceSummary(v,scope,historical=false) {
    const predictive=(scope.type||scope.callType)==='预外呼',isObg=Number(v.callGroupType)===2;
    const voice=v.contactFlowName||(v.contactFlowId?(historical?'语音流程 '+v.contactFlowId:flowName(v.contactFlowId)):'');
    if(!predictive){
      const name=historical?(v.contactFlowName||(v.providerIvrId?'语音流程 '+v.providerIvrId:'未记录')):selectedFlowName(scope);
      return [['语音流程',name],['接听后的安排','按所选语音流程执行']];
    }
    const obg=v.outboundGroupSnapshot||(!historical?window.OutboundGroups?.forTask(v.outboundGroupId,scope):null);
    const groupText=obg?.name?`${obg.name}${obg.gno||v.agentGroup?'（'+(obg.gno||v.agentGroup)+'）':''}`:v.agentGroup?'外呼组 '+v.agentGroup:'未记录';
    const flowLabel=Number(v.callRouteStrategy)===2?'客户接通后的语音流程':historical&&v.callRouteStrategy==null?'语音流程（流转方式未记录）':'坐席忙时';
    return [
      ['分配接听方式',isObg?'按外呼组分配':Number(v.callGroupType)===1?'按指定坐席分配':'未记录'],
      [isObg?'执行外呼组':'参与本次外呼的坐席',isObg?groupText:selectedAgentsText(v.cnos,scope,v.agentSelectionSnapshot,historical)],
      ...callerSummary(v,historical?scope:null,scope),['坐席分配方式',historical&&!AliCtiFields.callStrategyValue(v.callStrategy)?'未记录':AliCtiFields.callStrategyLabel(v.callStrategy)],
      ['最小可用座席数',v.minAvailableAgentCount==null?'未记录':`至少 ${v.minAvailableAgentCount} 人；低于此值自动暂停${v.scheduleMode==='定时执行'||Number(v.autoStart)===1?'，人数恢复后自动启动':'，人数恢复后需手动继续'}`],
      [flowLabel,voice||'未设置语音流程']
    ];
  }
  function taskSettingsSummary(v,type,historical=false) {
    const value=(key,fallback)=>v[key]===undefined||v[key]===null?(historical?'未记录':fallback):v[key]===''?fallback:v[key];
    const allMissing=keys=>historical&&keys.every(key=>v[key]===undefined||v[key]===null||v[key]==='');
    const part=(key,fallback,suffix='')=>{const result=value(key,fallback);return result==='未记录'?'未记录':String(result)+suffix;};
    const priority=v.callPriority&&typeof v.callPriority==='object'?v.callPriority:historical?null:{retryFirst:true,retryDesc:0,firstCallOrderType:0},predictive=type==='预外呼';
    const rows=[
      ['任务描述',value('description','未填写')||'未填写'],
      ['业务标签',value('businessTagNames','未填写')||'未填写'],
      ['名单处理',value('autoComplete',predictive?0:1)==='未记录'?'未记录':Number(value('autoComplete',predictive?0:1))===0?'名单呼完后暂停，可在原任务继续':'名单呼完后结束'],
      ['同时呼叫上限',value('concurrency',predictive?0:1)==='未记录'?'未记录':Number(value('concurrency',predictive?0:1))===0?(predictive?'不设固定上限':'0（当前创建规则不支持）'):`${value('concurrency',predictive?0:1)} 路`],
      ['仅当天生效',value('retryStrategyOnlyToday',0)==='未记录'?'未记录':['关闭','删除待重呼及待呼号码','删除待重呼号码','删除待呼号码'][Number(value('retryStrategyOnlyToday',0))]||'未记录'],
      ['拨打顺序',!priority?'未记录':`${priority.retryFirst?'重呼优先':'首次呼叫优先'}；重呼${Number(priority.retryDesc)===1?'高轮次优先':'低轮次优先'}；首次${['按优先级顺序','随机','按导入时间顺序'][Number(priority.firstCallOrderType)]||'按优先级顺序'}`]
    ];
    if(v.stopScheduled===true||!historical&&value('stopScheduled',false))rows.push(['到点结束',value('forceEndFlag',0)==='未记录'?'未记录':Number(value('forceEndFlag',0))===1?'强制结束任务':'按普通定时结束处理']);
    if(predictive)rows.push(
      ['接通后流转',value('callRouteStrategy',1)==='未记录'?'未记录':Number(value('callRouteStrategy',1))===2?'先进入 AI／语音流程':'直接分配坐席'],
      ['预测拨号',allMissing(['quotiety','predictAdjust'])?'未记录':`强拨系数 ${part('quotiety',1)}；超呼率 ${part('predictAdjust',100,'%')}`],
      ['坐席等待与整理',allMissing(['agentTimeout','wrapup','maxWaitTime'])?'未记录':`${part('agentTimeout',10,' 秒')}接听超时；${part('wrapup',30,' 秒')}整理；${part('maxWaitTime',40,' 秒')}最长空闲等待`],
      ['任务预热',allMissing(['answerRate','warmUpDuration','isRewarm'])?'未记录':`预计接通率 ${part('answerRate',50,'%')}；预热 ${part('warmUpDuration',300,' 秒')}；暂停后${value('isRewarm',1)==='未记录'?'未记录':Number(value('isRewarm',1))===1?'重新预热':'不重新预热'}`]
    );
    return rows;
  }
  function retrySummaryRows(v,type) {
    const p=v.retryPolicy;
    if(!p)return [['再次呼叫','未记录']];
    if(p.mode==='unset')return [['再次呼叫','已关闭']];
    if(AliCtiRetry.validate(p,type))return [['再次呼叫','设置未完整记录']];
    return [['再次呼叫',`按呼叫状态重呼，最多 ${p.rounds.length} 次（不含首次）`],
      ['适用状态',p.codes.map(code=>AliCtiRetry.numberCodes.find(item=>item.code===code)?.label||String(code)).join('、')],
      ['时间安排',p.rounds.map((r,i)=>`第 ${i+1} 次：从${p.timeType===1?'首次':'上次'}呼叫后 ${AliCtiRetry.duration(r)}`).join('；')]];
  }

  function taskIdentity(draft) {
    const v = draft.values, rows = AppState.availableTenants().filter(row => (row.capabilitySet || []).includes('CLOUD_CONTACT_CENTER'));
    const owner = AppState.isSuper()&&!draft.repeatPredictive&&!draft.editTaskId
      ? `<label class="field"><span>所属总部 / 门店 <b>*</b></span><select id="wizardTenant" onchange="CloudTaskWorkspace.setTenant(this.value)">${rows.map(row => `<option value="${esc(row.tenantId)}" ${row.tenantId === draft.tenantId ? 'selected' : ''}>${esc(row.name)}</option>`).join('')}</select><small class="field-hint">客户、接听团队和号码按所选组织提供。</small></label>`
      : '';
    return `<div class="wizard-basics">${owner}<label class="field"><span>任务名称 <b>*</b></span><input id="wizardName" value="${esc(v.name)}" maxlength="49" placeholder="${draft.type === '预外呼' ? '例如：9 月购车客户回访' : '例如：9 月保养预约提醒'}" aria-describedby="wizardNameError" oninput="CloudTaskWorkspace.update('name',this.value)"><small class="field-hint wizard-name-hint"><span>用业务名称或回访目的命名，便于之后查找。</span><span id="wizardNameCount">${Array.from(v.name || '').length} / 49</span></small>${errorSlot('wizardName')}</label>
      <details class="wizard-more"><summary>任务说明与标签<span>选填</span></summary><div class="wizard-more-body"><label class="field"><span>任务描述</span><textarea id="wizardDescription" maxlength="199" placeholder="这次任务联系客户的目的" oninput="CloudTaskWorkspace.update('description',this.value)">${esc(v.description||'')}</textarea><small class="field-hint">按接口要求少于 200 字。</small>${errorSlot('wizardDescription')}</label><label class="field"><span>业务标签</span><input id="wizardBusinessTags" value="${esc(v.businessTagNames||'')}" placeholder="多个标签用英文逗号分隔" oninput="CloudTaskWorkspace.update('businessTagNames',this.value)"><small class="field-hint">对应 AliCti businessTagNames；选填。</small>${errorSlot('wizardBusinessTags')}</label></div></details></div>`;
  }

  function basicStep(draft) {
    const v=draft.values,automatic=draft.type==='IVR 外呼';
    return `<div class="wizard-step-content">
      ${heading(automatic?'选择要联系的客户':'先确定任务和客户',draft.repeatPredictive?'为这次跟进命名，并核对已选择的客户。':automatic?'选择本次联系的客户，也可以创建后再添加。':'为这次外呼命名，再选择要联系的客户。客户也可以在创建后添加。')}
      ${automatic?'':taskIdentity(draft)}
      ${customerSelection(draft)}
      <details class="wizard-more" ${Number(v.isRepeat ?? 0) !== 0 ? 'open' : ''}><summary>重复号码处理<span>${esc(duplicateLabel(v.isRepeat))}</span></summary><div class="wizard-more-body"><label class="field"><span>遇到重复号码时</span><select id="wizardRepeat" onchange="CloudTaskWorkspace.update('isRepeat',this.value)">${[0,1,2,3].map(value => `<option value="${value}" ${Number(v.isRepeat ?? 0) === value ? 'selected' : ''}>${duplicateLabel(value)}</option>`).join('')}</select><small class="field-hint">用于客户导入任务时的号码处理，不修改原始客户名单。实际可呼叫数量以导入结果为准。</small></label></div></details>
    </div>`;
  }

  function customerSelection(draft) {
    if(draft.repeatPredictive)return (window.RepeatPredictive?.renderSelection(draft)||'<p>再次联系名单暂时无法读取，请返回后重新选择。</p>')+errorSlot('wizardCustomers');
    const pool = window.CustomerTasks?.pendingForTask(draft.tenantId, draft.enterpriseId) || [], v = draft.values, ids = v.customerIds || [], batch = v.customerBatch || '';
    const mode = v.customerMode || (pool.length || ids.length ? 'now' : 'later');
    const batches = [...new Map(pool.map(r => [r.batchId, r.batchName])).entries()];
    const matches = pool.filter(r => (!batch || r.batchId === batch) && matchesCustomerQuery(r, v.customerQuery));
    const filtered = window.CustomerTasks?.sortRowsForDisplay?.(matches)||ui.sortByUpdated?.(matches)||matches;
    return `<section class="wizard-customers" aria-label="客户名单"><div class="wizard-section-title"><h3>客户名单</h3><span>选填</span></div>
      <div class="wizard-choice-grid">
        <label class="wizard-choice ${mode === 'now' ? 'selected' : ''}"><input type="radio" name="customerMode" value="now" ${mode === 'now' ? 'checked' : ''} onchange="CloudTaskWorkspace.setCustomerMode(this.value)"><span><strong>从已有名单选择</strong><small>当前有 ${pool.length} 位待分配客户</small></span></label>
        <label class="wizard-choice ${mode === 'later' ? 'selected' : ''}"><input type="radio" name="customerMode" value="later" ${mode === 'later' ? 'checked' : ''} onchange="CloudTaskWorkspace.setCustomerMode(this.value)"><span><strong>创建后再添加</strong><small>暂不分配客户，先完成呼叫设置</small></span></label>
      </div>
      ${mode === 'later' ? '<p class="wizard-soft-note">创建后可添加客户，预外呼可直接点击任务操作列的“导入客户”。有客户名单后才能启动任务。</p>' : pool.length ? `<div class="wizard-customer-selection">
        <div class="task-customer-filters"><label class="field"><span>客户批次</span><select id="wizardCustomerBatch" onchange="CloudTaskWorkspace.filterCustomers('customerBatch',this.value)"><option value="">全部批次</option>${batches.map(([id,name]) => `<option value="${esc(id)}" ${batch === id ? 'selected' : ''}>${esc(name)}</option>`).join('')}</select></label><label class="field"><span>查找客户</span><input id="wizardCustomerQuery" value="${esc(v.customerQuery || '')}" placeholder="客户姓名、手机号或单据号" onchange="CloudTaskWorkspace.filterCustomers('customerQuery',this.value)"></label></div>
        <div class="wizard-selection-bar"><span>已选 <b id="wizardSelectedCount">${ids.length}</b> 位<span class="muted"> · 筛选结果 ${filtered.length} 位</span></span><div><button class="wizard-text-button" onclick="CloudTaskWorkspace.selectFilteredCustomers()" ${filtered.length ? '' : 'disabled'}>全选筛选结果</button><button class="wizard-text-button" onclick="CloudTaskWorkspace.clearCustomers()" ${ids.length ? '' : 'disabled'}>清空</button></div></div>
        <div class="task-customer-table">${ui.table([{key:'id',label:'选择',render:(id,row) => `<input type="checkbox" aria-label="选择客户 ${esc(row.name)} ${esc(row.phone)}" ${ids.includes(id) ? 'checked' : ''} onchange="CloudTaskWorkspace.toggleCustomer('${esc(id)}',this.checked)">`},{key:'name',label:'客户'},{key:'phone',label:'联系电话'},{key:'batchName',label:'所属批次'},{key:'externalDocumentId',label:'业务单据',render:(value,row) => esc(CustomerBusiness.codeLabel(row)) + '：' + esc(value || '—')}], filtered, {emptyText:'没有找到符合条件的客户，请调整批次或搜索内容'})}</div>
        <p class="field-hint">确认创建时才分配客户；保存草稿不会占用名单。跨批次的同号记录各自保留。</p></div>` : '<div class="wizard-empty"><strong>还没有可选的客户</strong><p>可以先创建任务；预外呼可在任务操作列直接导入客户，自动外呼通过“导入与分配”添加客户。</p><button class="btn" onclick="CloudTaskWorkspace.setCustomerMode(&#39;later&#39;)">创建后再添加</button></div>'}
        ${errorSlot('wizardCustomers')}
    </section>`;
  }
  function matchesCustomerQuery(row,query) { return !query || [row.name,row.phone,row.externalDocumentId].some(value => String(value || '').includes(query)); }
  function customerBusinessColumns() { return [{key:'businessType',label:'业务类型',render:(_,row)=>esc(CustomerBusiness.typeLabel(row))},{key:'externalDocumentId',label:'业务单据',render:(value,row)=>esc(CustomerBusiness.codeLabel(row))+'：'+esc(value||'—')}]; }
  function filterCustomers(key,value) { const d=activeDraft(); if(!d||!['customerBatch','customerQuery'].includes(key))return; d.values[key]=value; persist(); refresh(true); }
  function setCustomerMode(mode) { const d=activeDraft();if(!d||d.repeatPredictive||!['now','later'].includes(mode))return;d.values.customerMode=mode;if(mode==='later')d.values.customerIds=[];persist();AppState.setDirty(true);refresh(true); }
  function toggleCustomer(id,checked) { const d=activeDraft();if(!d||d.repeatPredictive)return;const pool=CustomerTasks.pendingForTask(d.tenantId,d.enterpriseId);if(checked&&!pool.some(r=>r.id===id))return;const ids=new Set(d.values.customerIds||[]);checked?ids.add(id):ids.delete(id);d.values.customerIds=[...ids];persist();AppState.setDirty(true);refresh(true); }
  function clearCustomers() { const d=activeDraft();if(!d||d.repeatPredictive)return;d.values.customerIds=[];persist();AppState.setDirty(true);refresh(true); }
  function selectFilteredCustomers() { const d=activeDraft();if(!d||d.repeatPredictive)return;const pool=CustomerTasks.pendingForTask(d.tenantId,d.enterpriseId).filter(r=>(!d.values.customerBatch||r.batchId===d.values.customerBatch)&&matchesCustomerQuery(r,d.values.customerQuery));d.values.customerIds=[...new Set([...(d.values.customerIds||[]),...pool.map(r=>r.id)])];persist();AppState.setDirty(true);refresh(true); }

  function commonSettings(draft,choices=optionsFor(draft)) {
    if(draft.editTaskId)return '';
    const v=draft.values,plans=choices.plans.filter(p=>!p.supersededBy),canSave=AppState.canMenu('settings.plans');
    if(!plans.length&&!canSave)return '';
    return `<details id="wizardCommonSettings" class="wizard-more wizard-common-settings"><summary>常用设置<span>选填</span></summary><div class="wizard-more-body">
      ${plans.length?`<label class="field"><span>套用已保存的设置</span><select id="wizardPlan" onchange="CloudTaskWorkspace.selectPlan(this.value)"><option value="">不套用</option>${plans.map(p=>`<option value="${esc(p.callPlanId)}" ${p.callPlanId===v.planId?'selected':''}>${esc(displayName(p.name))}</option>`).join('')}</select></label>`:''}
      ${canSave?`<label class="wizard-save-template"><input type="checkbox" ${v.saveAsTemplate?'checked':''} onchange="CloudTaskWorkspace.setResource('saveAsTemplate',this.checked)"><span>将本次设置保存为常用</span></label>`:''}
    </div></details>`;
  }
  function taskNumberField(v,key,label,min,max,unit,hint,step=1) {
    const id='wizard'+key[0].toUpperCase()+key.slice(1);
    return `<label class="field"><span>${label}</span><div class="wizard-unit-input"><input id="${id}" type="number" min="${min}" ${max==null?'':`max="${max}"`} step="${step}" value="${esc(v[key]??'')}" oninput="CloudTaskWorkspace.update('${key}',this.value)"><span>${unit}</span></div><small class="field-hint">${hint}</small>${errorSlot(id)}</label>`;
  }
  function predictiveSettings(v) {
    return `<details id="wizardPredictiveSettings" class="wizard-more"><summary>预测拨号参数<span>按需调整</span></summary><div class="wizard-more-body"><p class="field-hint">按 AliCti 的预测外呼参数设置；留用默认值即可继续创建。</p>
      ${taskNumberField(v,'quotiety','拨号系数（AliCti 骚扰率）',0.01,20,'倍','默认 1；大于 0，最多两位小数。',0.01)}
      ${taskNumberField(v,'agentTimeout','坐席接听超时',5,60,'秒','默认 10 秒；范围 5–60 秒。')}
      ${taskNumberField(v,'wrapup','坐席整理时间',1,10800,'秒','默认 30 秒；范围 1–10800 秒。')}
      ${taskNumberField(v,'maxWaitTime','坐席最长空闲等待',10,600,'秒','默认 40 秒；范围 10–600 秒。')}
      <h3>预热阶段</h3>
      ${taskNumberField(v,'predictAdjust','超呼率',50,400,'%','默认 100%；范围 50–400%。')}
      ${taskNumberField(v,'answerRate','预计客户接通率',1,100,'%','默认 50%；范围 1–100%。')}
      ${taskNumberField(v,'warmUpDuration','预热时间',60,600,'秒','默认 300 秒；范围 60–600 秒。')}
      <label class="field"><span>暂停后重新预热</span><select id="wizardIsRewarm" onchange="CloudTaskWorkspace.update('isRewarm',this.value)"><option value="1" ${Number(v.isRewarm??1)===1?'selected':''}>开启</option><option value="0" ${Number(v.isRewarm??1)===0?'selected':''}>关闭</option></select><small class="field-hint">任务暂停后继续时是否重新进行预热。</small>${errorSlot('wizardIsRewarm')}</label>
    </div></details>`;
  }

  function resourceStep(draft) {
    const choices=optionsFor(draft), v=draft.values, ivr=draft.type==='IVR 外呼';
    if(ivr)return automaticFlowStep(draft,choices);
    const isObg = Number(v.callGroupType) === 2;
    const select = (key, rows, selected, label, hint, placeholder) => `<label class="field"><span>${label}</span><select id="wizard-${key}" aria-describedby="wizard-${key}Error" onchange="CloudTaskWorkspace.setResource('${key}',this.value)"><option value="">${placeholder || '请选择'}</option>${rows.map(row => `<option value="${esc(row.id)}" ${row.id === selected ? 'selected' : ''}>${esc(displayName(row.name))}</option>`).join('')}</select><small class="field-hint">${rows.length ? hint : '暂无可用选项，请联系管理员完成配置。'}</small>${errorSlot('wizard-' + key)}</label>`;
    const obgChoices = (choices.outboundGroups||[]).map(g=>({id:g.outboundGroupId,name:`${g.name} [${g.gno||g.demoAgentGroup}] (${g.memberIdentityIds?.length||0}人)`}));
    const obgField = select('outboundGroupId', obgChoices, v.outboundGroupId, '执行外呼组 <b>*</b>', '一个坐席只能属于一个外呼组；同一组同一时刻只能运行一个预测任务。', '选择执行外呼组');

    const selectedCnos = new Set(Array.isArray(v.cnos) ? v.cnos : String(v.cnos || '').split(',').filter(Boolean));
    const agentPicker = `<div class="field" style="margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <span><strong>参与本次外呼的坐席 <b>*</b></strong> <small style="color:#6b7280;">已选 ${selectedCnos.size} 人</small></span>
        <div style="font-size:12px;display:flex;gap:6px;">
          <button type="button" class="btn" style="padding:2px 8px;font-size:12px;" onclick="CloudTaskWorkspace.toggleAllAgents(true)">全选</button>
          <button type="button" class="btn" style="padding:2px 8px;font-size:12px;" onclick="CloudTaskWorkspace.toggleAllAgents(false)">清空</button>
        </div>
      </div>
      <div class="wizard-agent-grid" style="max-height:180px;overflow-y:auto;border:1px solid #d1d5db;border-radius:6px;padding:8px;display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:6px;background:#fff;">
        ${(choices.agents||[]).map(a => {
          const checked = selectedCnos.has(a.cno);
          return `<label style="display:flex;align-items:center;gap:6px;padding:6px 8px;border:1px solid ${checked?'#3b82f6':'#e5e7eb'};border-radius:4px;background:${checked?'#eff6ff':'#fafafa'};cursor:pointer;font-size:12px;">
            <input type="checkbox" name="wizard-agent-cno" value="${esc(a.cno)}" ${checked?'checked':''} onchange="CloudTaskWorkspace.toggleAgent('${esc(a.cno)}')">
            <span><strong>${esc(a.userName)}</strong> <small style="color:#6b7280;">工号 ${esc(a.cno)}</small></span>
          </label>`;
        }).join('') || '<div class="text-muted" style="padding:10px;">当前租户暂无已启用的可外呼坐席</div>'}
      </div>
      <small class="field-hint">客户接通后，由勾选的坐席接听。每位坐席同一时刻只能参与一个运行中的预测任务，启动和继续时会检查占用。</small>
      ${errorSlot('wizard-cnos')}
    </div>`;

    const caller = callerFields(draft);
    const aiRoute=Number(v.callRouteStrategy??1)===2;
    const voice = select('contactFlowId',choices.flows.map(f=>({id:f.contactFlowId,name:f.name})),v.contactFlowId,aiRoute?'客户接通后使用的语音流程 <b>*</b>':'坐席暂时无法接听时的语音流程','使用已发布且已映射 AliCti 的语音流程。',aiRoute?'选择语音流程':'暂不设置');
    const groupTypeSwitch = draft.editTaskId?`<p class="wizard-soft-note">原任务按${isObg?'外呼组':'指定坐席'}分配。分配模式创建后保持不变，可修改当前模式内的接听人员。</p>`:`<div class="wizard-choice-grid">
      <label class="wizard-choice ${isObg?'selected':''}">
        <input type="radio" name="callGroupType" value="2" ${isObg?'checked':''} onchange="CloudTaskWorkspace.setResource('callGroupType',2)">
        <span><strong>按外呼组分配</strong><small>选用已配置的租户外呼组并锁定成员</small></span>
      </label>
      <label class="wizard-choice ${!isObg?'selected':''}">
        <input type="radio" name="callGroupType" value="1" ${!isObg?'checked':''} onchange="CloudTaskWorkspace.setResource('callGroupType',1)">
        <span><strong>按指定坐席分配</strong><small>直接选择本租户参与接听的坐席</small></span>
      </label>
    </div>`;
    return `<div class="wizard-step-content">
      ${heading('接听团队配置',draft.editTaskId?'调整当前任务的接听人员与接口支持的预测参数。':'选择外呼组或指定坐席，安排客户接通后的接听人员。')}
      <div class="wizard-resource-fields">
        <div class="wizard-group-type"><span class="wizard-field-label">分配接听方式 <b>*</b></span>${groupTypeSwitch}</div>
        ${isObg ? obgField : agentPicker}
        ${caller}
        <label class="field"><span>最小可用座席数 <b>*</b></span><div class="wizard-unit-input"><input id="wizardMinAgents" type="number" min="1" max="10" step="1" value="${esc(v.minAvailableAgentCount??10)}" aria-describedby="wizardMinAgentsError" oninput="CloudTaskWorkspace.update('minAvailableAgentCount',this.value)"><span>人</span></div><small class="field-hint">任务内可用座席（不含置忙）少于此值时自动暂停；仅设置定时开始的任务，在人数恢复后自动启动。默认 10 人，可设置 1–10 人。</small>${errorSlot('wizardMinAgents')}</label>
        ${!isObg&&selectedCnos.size&&Number(v.minAvailableAgentCount)>selectedCnos.size?`<p class="wizard-soft-note">已选 ${selectedCnos.size} 位坐席，低于保持拨号所需的 ${esc(v.minAvailableAgentCount)} 位；任务可能在启动后立即暂停。</p>`:''}
        <label class="field"><span>客户接通后如何流转</span><select id="wizardCallRouteStrategy" onchange="CloudTaskWorkspace.update('callRouteStrategy',this.value)"><option value="1" ${!aiRoute?'selected':''}>直接分配坐席</option><option value="2" ${aiRoute?'selected':''}>先进入 AI／语音流程</option></select><small class="field-hint">按 AliCti 的 callRouteStrategy 执行。选择语音流程时须有已映射的供应商流程。</small>${errorSlot('wizardCallRouteStrategy')}</label>
      </div>
      <details id="wizardBusyFlow" class="wizard-more" ${aiRoute||v.contactFlowId?'open':''}><summary>${aiRoute?'客户接通后的语音流程':'坐席忙时的处理'}<span>${aiRoute?'必填':'选填'}</span></summary><div class="wizard-more-body"><p class="field-hint">${aiRoute?'客户接通后先进入语音流程，再按流程转接坐席。':'客户接听后若暂时找不到可用坐席，可进入语音流程继续等待。'}</p>${voice}</div></details>
      <details id="wizardAssignment" class="wizard-more"><summary>坐席分配规则<span id="wizardCallStrategySummary">${esc(AliCtiFields.callStrategyLabel(v.callStrategy))}</span></summary><div class="wizard-more-body"><label class="field"><span>多位坐席可接听时，优先分配给谁</span><select id="wizardCallStrategy" aria-describedby="wizardCallStrategyError" onchange="CloudTaskWorkspace.update('callStrategy',this.value)">${Object.entries(AliCtiFields.callStrategies).map(([value,label])=>`<option value="${value}" ${value===AliCtiFields.callStrategyValue(v.callStrategy)?'selected':''}>${esc(label)}</option>`).join('')}</select><small class="field-hint">仅用于本次预外呼任务。按官方 callStrategy 参数执行。</small>${errorSlot('wizardCallStrategy')}</label></div></details>
      ${predictiveSettings(v)}
      ${commonSettings(draft,choices)}
    </div>`;
  }

  function automaticFlowStep(draft,choices) {
    const v=draft.values;
    if(draft.editTaskId){
      const savedFlowName=v.contactFlowName|| (v.providerIvrId?'语音流程 '+v.providerIvrId:'原任务未记录');
      return `<div class="wizard-step-content">${heading('任务与语音流程','可修改任务名称、描述与标签；语音流程沿用原任务，需另行核实接口更新语义后才能修改。')}${taskIdentity(draft)}<div class="wizard-soft-note">接通后执行的语音流程：${esc(savedFlowName)}</div></div>`;
    }
    const result=choices.ivrList,selected=AliCtiIvr.resolve(v,draft);
    return `<div class="wizard-step-content">
      ${heading('选择客户接听后的语音流程','为任务命名，选择所属组织和接通后的语音流程。')}
      ${taskIdentity(draft)}
      <label class="field"><span>接通后执行的语音流程 <b>*</b></span><select id="wizard-providerIvrId" ${result.rows.length?'':'disabled'} onchange="CloudTaskWorkspace.setResource('providerIvrId',this.value)"><option value="">选择语音流程</option>${result.rows.map(row=>`<option value="${esc(row.id)}" ${String(row.id)===String(v.providerIvrId)?'selected':''}>${esc(displayName(row.ivrName))}</option>`).join('')}</select><small class="field-hint">请选择当前组织可用的语音流程。</small>${errorSlot('wizard-providerIvrId')}</label>
      ${result.status==='ready'?'':`<p class="wizard-soft-note" role="status">${esc(result.message)}</p>`}<button class="wizard-text-button" onclick="CloudTaskWorkspace.refreshIvrList()">刷新流程</button>
      ${selected.ok?`<div class="business-guidance"><strong>${esc(displayName(selected.row.ivrName))}</strong><span>${esc(selected.row.ivrDescription||'客户接听后按所选流程执行。')}</span></div>`:''}

    </div>`;
  }
  function automaticCallSettings(draft) { return callerFields(draft); }
  function refreshIvrList() { const draft=activeDraft();if(!draft||draft.type!=='IVR 外呼')return;const selected=AliCtiIvr.resolve(draft.values,draft);if(!selected.ok){draft.values.providerIvrId='';draft.values.contactFlowId='';persist();AppState.setDirty(true);}refresh(true); }

  function taskExecutionSettings(draft) {
    const v=draft.values,p=v.callPriority||{retryFirst:true,retryDesc:0,firstCallOrderType:0},predictive=draft.type==='预外呼';
    return `<section class="wizard-schedule"><h3>任务完成方式</h3>
      <label class="field"><span>名单呼完后</span><select id="wizardAutoComplete" onchange="CloudTaskWorkspace.update('autoComplete',this.value)"><option value="0" ${Number(v.autoComplete??(predictive?0:1))===0?'selected':''}>暂停任务，后续可在原任务继续</option><option value="1" ${Number(v.autoComplete??(predictive?0:1))===1?'selected':''}>结束任务</option></select><small class="field-hint">${predictive?'要在同一个任务 ID 下再次联系客户，请保留“暂停任务”。':'结束后的任务不可再次启动。'}</small>${errorSlot('wizardAutoComplete')}</label>
      ${v.stopScheduled?`<label class="field"><span>到结束时间时</span><select id="wizardForceEndFlag" onchange="CloudTaskWorkspace.update('forceEndFlag',this.value)"><option value="0" ${Number(v.forceEndFlag??0)===0?'selected':''}>按普通定时结束处理</option><option value="1" ${Number(v.forceEndFlag??0)===1?'selected':''}>无论名单是否呼完都结束任务</option></select><small class="field-hint">强制结束后任务不能再次启动；仅在设置结束时间时生效。</small>${errorSlot('wizardForceEndFlag')}</label>`:''}
      </section><details id="wizardTaskAdvanced" class="wizard-more"><summary>呼叫顺序与高级设置<span>按需调整</span></summary><div class="wizard-more-body">
        ${taskNumberField(v,'concurrency','最大同时呼叫数',predictive?0:1,null,'路',predictive?'填 0 表示不设任务上限；坐席少于 10 人时建议设上限。':'填写大于 0 的整数。')}
        <label class="field"><span>仅当天生效</span><select id="wizardRetryToday" onchange="CloudTaskWorkspace.update('retryStrategyOnlyToday',this.value)"><option value="0" ${Number(v.retryStrategyOnlyToday??0)===0?'selected':''}>关闭</option><option value="1" ${Number(v.retryStrategyOnlyToday??0)===1?'selected':''}>当天结束删除待重呼及待呼号码</option><option value="2" ${Number(v.retryStrategyOnlyToday??0)===2?'selected':''}>当天结束仅删除待重呼号码</option><option value="3" ${Number(v.retryStrategyOnlyToday??0)===3?'selected':''}>当天结束仅删除待呼号码</option></select><small class="field-hint">选项 1–3 会清理本任务待呼数据，请确认业务确实只需当天联系。</small>${errorSlot('wizardRetryToday')}</label>
        <h3>呼叫顺序</h3>
        <label class="field"><span>哪类号码先拨</span><select id="wizardRetryPriority" onchange="CloudTaskWorkspace.updatePriority('retryFirst',this.value==='retry')"><option value="retry" ${p.retryFirst?'selected':''}>待重呼号码优先</option><option value="first" ${!p.retryFirst?'selected':''}>未呼叫号码优先</option></select>${errorSlot('wizardRetryPriority')}</label>
        <label class="field"><span>待重呼号码按轮次</span><select id="wizardRetryOrder" onchange="CloudTaskWorkspace.updatePriority('retryDesc',this.value)"><option value="0" ${Number(p.retryDesc)===0?'selected':''}>低轮次优先</option><option value="1" ${Number(p.retryDesc)===1?'selected':''}>高轮次优先</option></select>${errorSlot('wizardRetryOrder')}</label>
        <label class="field"><span>未呼叫号码顺序</span><select id="wizardFirstCallOrder" onchange="CloudTaskWorkspace.updatePriority('firstCallOrderType',this.value)"><option value="0" ${Number(p.firstCallOrderType)===0?'selected':''}>按导入优先级顺序</option><option value="1" ${Number(p.firstCallOrderType)===1?'selected':''}>随机</option><option value="2" ${Number(p.firstCallOrderType)===2?'selected':''}>按导入时间顺序</option></select>${errorSlot('wizardFirstCallOrder')}</label>
      </div></details>`;
  }

  function scheduleStep(draft) {
    const scheduled = draft.values.scheduleMode === '定时执行';
    return `<div class="wizard-step-content">
      ${heading('设置呼叫时间与重呼', '先确定何时开始，再安排需要再次联系时的次数和间隔。')}
      ${draft.type==='IVR 外呼'?automaticCallSettings(draft):''}
      <section class="wizard-schedule"><h3>何时开始呼叫</h3><div class="wizard-choice-grid">
        <label class="wizard-choice ${!scheduled?'selected':''}"><input type="radio" name="scheduleMode" value="保存后手工启动" ${!scheduled?'checked':''} onchange="CloudTaskWorkspace.update('scheduleMode',this.value)"><span><strong>准备好后手动开始</strong><small>创建后，在任务列表操作启动</small></span></label>
        <label class="wizard-choice ${scheduled?'selected':''}"><input type="radio" name="scheduleMode" value="定时执行" ${scheduled?'checked':''} onchange="CloudTaskWorkspace.update('scheduleMode',this.value)"><span><strong>定时开始</strong><small>到计划时间自动启动；座席不足自动暂停后，人数恢复可自动启动</small></span></label>
      </div>
      ${scheduled ? `<label class="field wizard-schedule-at"><span>计划开始时间 <b>*</b></span><input id="wizardScheduleAt" type="datetime-local" value="${esc(draft.values.scheduleAt)}" aria-describedby="wizardScheduleAtError" onchange="CloudTaskWorkspace.update('scheduleAt',this.value)">${errorSlot('wizardScheduleAt')}</label>` : ''}
      <label class="field wizard-schedule-at"><span><input type="checkbox" ${draft.values.stopScheduled?'checked':''} onchange="CloudTaskWorkspace.update('stopScheduled',this.checked)"> 设置结束时间</span><small class="field-hint">选填，按预约时间提交任务结束安排。</small></label>
      ${draft.values.stopScheduled?`<label class="field wizard-schedule-at"><span>计划结束时间 <b>*</b></span><input id="wizardStopAt" type="datetime-local" value="${esc(draft.values.stopAt||'')}" onchange="CloudTaskWorkspace.update('stopAt',this.value)">${errorSlot('wizardStopAt')}</label>`:''}
      <p class="wizard-soft-note">${draft.editTaskId?'本次仅更新任务设置；已导入名单、任务状态与历史通话保持原样。':customerCount(draft) ? '已选客户将在确认创建时分配给任务。' : '尚未添加客户；请在启动前完成名单分配。'}${draft.type==='预外呼' ? scheduled ? '到点启动仍需满足客户名单和呼叫设置检查；只有座席不足触发的自动暂停，才会在可用人数达标后自动启动。' : '座席不足会自动暂停；人数恢复后需手动继续。人工暂停不会随人数恢复自动启动。' : scheduled ? '到点启动仍需满足客户名单和呼叫设置检查。' : ''}</p></section>
      ${taskExecutionSettings(draft)}
      ${timeConditionsStep(draft)}
      ${AliCtiRetry.render(draft.values.retryPolicy,draft.type,draft.values.retryEditor)}
      ${draft.type==='IVR 外呼'?commonSettings(draft):''}
    </div>`;
  }

  function confirmStep(draft) {
    const v=draft.values, isPredictive=draft.type==='预外呼', count=customerCount(draft);
    const rows = items => items.map(([label,value]) => `<dt>${label}</dt><dd>${esc(value)}</dd>`).join('');
    const card = (label, step, items) => `<section><div><h3>${label}</h3><button class="wizard-text-button" onclick="CloudTaskWorkspace.goStep(${step})" aria-label="修改${label}">修改</button></div><dl>${rows(items)}</dl></section>`;
    const resources = resourceSummary(v,draft);
    const retry = retrySummaryRows(v,draft.type);
    return `<div class="wizard-step-content">
      ${heading('检查一下，即可创建', '发现需要调整的内容，点击“修改”即可返回对应设置。', false)}
      <div class="wizard-review-title"><span class="wizard-review-icon">✓</span><div><h3>${esc(v.name)}</h3><p>${esc(typeLabel(draft.type))} · ${esc(tenant(draft.tenantId).name || '')}</p></div><span class="wizard-review-state">${count?'待启动':'待添加客户'}</span></div>
      <div class="wizard-review">
        ${card('任务与客户',2,[...(isPredictive?[['任务名称',v.name],['所属组织',tenant(draft.tenantId).name]]:[]),['客户名单',count?`已选 ${count} 位，${draft.repeatPredictive?'建立新的联系安排':'创建时分配'}`:'创建后再添加'],...(draft.repeatPredictive?[['联系原因',draft.repeatPredictive.reason||'按所选客户的跟进需求'],['来源关系','保留原任务与历史通话']]:[]),['重复号码',duplicateLabel(v.isRepeat)],...(isPredictive?taskSettingsSummary(v,draft.type).slice(0,2):[])])}
        ${isPredictive?card('接听团队配置',4,resources):card('任务与语音流程',4,[['任务名称',v.name],['所属组织',tenant(draft.tenantId).name],...taskSettingsSummary(v,draft.type).slice(0,2),...resources])}
        ${card('时间与重呼',5,[...(isPredictive?[]:callerSummary(v,null,draft)),['开始时间',v.scheduleMode==='定时执行'?v.scheduleAt.replace('T',' '):'准备好后手动开始'],['结束时间',v.stopScheduled?String(v.stopAt||'').replace('T',' '):'未设置'],...timeSummary(v,draft.tenantId),...retry,...taskSettingsSummary(v,draft.type).slice(2)])}
      </div>
      <p class="wizard-review-next">${count ? '创建后可在任务列表查看进度和操作启动。' : (draft.type==='预外呼'?'创建后，点击任务操作列的“导入客户”，名单自动加入当前任务。':'创建后，下一步是在“导入与分配”中为任务添加客户。')}</p>
    </div>`;
  }

  function preview(draft) {
    const v=draft.values, ivr=draft.type==='IVR 外呼', count=customerCount(draft);
    const isObg = !ivr && Number(v.callGroupType) === 2;
    const obgName = isObg ? (window.OutboundGroups?.forTask(v.outboundGroupId, draft)?.name || '未选择外呼组') : '';
    const selectedCnosCount = (Array.isArray(v.cnos) ? v.cnos : String(v.cnos || '').split(',').filter(Boolean)).length;
    const agentLabel = isObg ? (obgName || '未选择外呼组') : (selectedCnosCount > 0 ? `已选 ${selectedCnosCount} 位坐席` : '未选择坐席');
    return `<div class="wizard-preview-card"><span class="wizard-eyebrow">本次外呼</span><h3>${esc(v.name || '未命名任务')}</h3><p class="wizard-preview-org">${esc(tenant(draft.tenantId).name || '当前组织')}</p>
      <ol class="wizard-call-path"><li><span>1</span><div><strong>自动拨打客户</strong><small>${count?'已选 '+count+' 位客户':'创建后可添加客户'}</small></div></li><li><span>2</span><div><strong>${ivr?'播放语音流程':(isObg?'外呼团队接听':'指定坐席接听')}</strong><small>${esc(ivr?selectedFlowName(draft):agentLabel)}</small></div></li></ol>
      <dl class="wizard-preview-details"><dt>外显导航</dt><dd>${esc(callerNavigationLabel(callerFromAccount(draft,v)))}</dd><dt>开始时间</dt><dd>${esc(v.scheduleMode==='定时执行'?v.scheduleAt.replace('T',' '):'手动开始')}</dd><dt>呼叫时段</dt><dd>${esc(Number(v.autoTaskType)===1?'仅在指定时段呼叫':'连续呼叫')}</dd>${ivr?'':`<dt>坐席分配</dt><dd>${esc(AliCtiFields.callStrategyLabel(v.callStrategy))}</dd>`}<dt>再次呼叫</dt><dd>${esc(retryText(draft))}</dd></dl>
      </div>
      <div class="wizard-preview-help"><strong>${draft.step===2?(draft.repeatPredictive?'继续跟进原客户':'客户名单可以稍后添加'):draft.step===4?'只需选择已准备好的设置':draft.step===5?'重呼次数不含首次呼叫':'创建后继续管理任务'}</strong><p>${draft.step===2?(draft.repeatPredictive?'确认创建后生成新的联系安排，原线索与通话历史保留。':'草稿不会占用客户，确认创建时才分配名单。'):draft.step===4?'这里的选择仅作用于本次任务，不会修改团队成员或语音内容。':draft.step===5?'例如最多重呼 2 次，表示首次呼叫后最多再拨 2 次。':'名单和呼叫设置准备完成后，才能启动任务。'}</p></div>`;
  }

  function editPreview(draft,row){
    const changes=Object.keys(draft.values).filter(key=>JSON.stringify(draft.values[key])!==JSON.stringify(draft.editOriginalValues?.[key]));
    return `<div class="wizard-preview-card"><span class="wizard-eyebrow">原任务</span><h3>${esc(draft.values.name||row.name)}</h3><p class="wizard-preview-org">${esc(tenant(row.tenantId).name||'所属组织')}</p><dl class="wizard-preview-details"><dt>平台任务 ID</dt><dd>${esc(row.taskId)}</dd><dt>供应商任务 ID</dt><dd>${esc(explicitSupplierTaskId(row))}</dd><dt>当前状态</dt><dd>${esc(row.status)}</dd><dt>原客户名单</dt><dd>${esc(row.total||0)} 条</dd><dt>已改设置</dt><dd>${changes.length} 项</dd></dl></div><div class="wizard-preview-help"><strong>提交前先核对</strong><p>只向 task/update 提交实际修改的接口字段；成功后再按原任务编号查询。失败或结果未知时原配置保持不变。</p></div>`;
  }

  function body(draft) {
    if (draft.step === 2) return basicStep(draft);
    if (draft.step === 4) return resourceStep(draft);
    if (draft.step === 5) return scheduleStep(draft);
    return confirmStep(draft);
  }

  function renderEdit(draft) {
    const row=taskById(draft.editTaskId);
    if(!canEditTask(row)||row.taskId!==draft.editTaskId||row.tenantId!==draft.tenantId||row.enterpriseId!==draft.enterpriseId||row.callType!==draft.type)
      return `<section class="platform-page cloud-task-workspace"><div class="panel-card"><div class="panel-body">原任务已变化或当前无权编辑，请返回任务列表重新进入。</div></div></section>`;
    return `<section class="platform-page cloud-task-workspace cloud-task-edit">
      <header class="wizard-page-header"><div><button class="wizard-back" onclick="CloudTaskWorkspace.cancel()">← 返回</button><div class="wizard-title-row"><h1>编辑${esc(typeLabel(draft.type))}任务</h1><span>原任务 ID：${esc(row.taskId)}</span></div><p>修改当前任务的接口设置；客户名单、任务类型和历史通话不在这里更改。</p></div><span class="wizard-save-state" id="wizardSaveState">${AppState.get().hasUnsavedChanges?'有修改，未提交':'尚未提交修改'}</span></header>
      <div class="wizard-layout"><article class="panel-card wizard-main-card"><div class="panel-body">
        ${draft.type==='预外呼'?`<section class="wizard-step-content">${heading('任务信息','任务 ID、所属组织和客户名单保持原样。')}${taskIdentity(draft)}</section>${resourceStep(draft)}`:automaticFlowStep(draft,optionsFor(draft))}
        ${scheduleStep(draft)}
        <div class="wizard-form-error" id="wizardFormError" role="alert" tabindex="-1" hidden></div>
      </div></article><aside class="wizard-preview" id="wizardPreview" aria-label="任务预览">${editPreview(draft,row)}</aside></div>
      <footer class="wizard-footer"><span class="field-hint">提交前会按原任务编号校验，更新后再次查询确认；此页面仅作本地接口演示。</span><div><button class="btn" onclick="CloudTaskWorkspace.cancel()">取消</button><button class="btn btn-primary" onclick="CloudTaskWorkspace.submit()">提交修改</button></div></footer>
    </section>`;
  }

  function render(options) {
    if (options?.draftId && options.draftId !== activeId()) {
      const requested = drafts.find(item => item.draftId === options.draftId);
      if (!canAccessDraft(requested)) clearActiveContext();
      else {sessionStorage.setItem(activeKey, requested.draftId);AppState.setDirty(Boolean(requested.savedAt === ''));}
    }
    const draft = activeDraft();
    if (!draft) return `<section class="platform-page">${ui.pageHeader('创建任务', '当前没有正在编辑的任务草稿。')}<div class="panel-card"><div class="panel-body">${ui.empty('请从预外呼或自动外呼任务列表新建任务')}</div></div></section>`;
    if(draft.editTaskId)return renderEdit(draft);
    normalizeStep(draft);
    const steps=stepsFor(draft),index=steps.findIndex(item=>item.step===draft.step), ivr=draft.type==='IVR 外呼';
    return `<section class="platform-page cloud-task-workspace">
      <header class="wizard-page-header"><div><button class="wizard-back" onclick="CloudTaskWorkspace.cancel()">← 返回</button><div class="wizard-title-row"><h1>${draft.repeatPredictive?'再次预外呼':'新建'+typeLabel(draft.type)+'任务'}</h1><span>${ivr?'语音自动应答':'自动拨号 · 人工接听'}</span></div><p>${draft.repeatPredictive?'为所选客户安排新的预外呼，继续跟进同一条业务线索。':ivr?'选择语音流程，批量完成提醒、通知或客户联系。':'系统自动拨打名单，客户接通后交给团队坐席。'}</p></div><span class="wizard-save-state" id="wizardSaveState">${AppState.get().hasUnsavedChanges?(draft.savedAt?'有修改，未保存':'正在编辑'):'草稿已保存'}</span></header>
      ${stepNavigation(draft)}
      <div class="wizard-layout"><article class="panel-card wizard-main-card"><div class="panel-body">${body(draft)}<div class="wizard-form-error" id="wizardFormError" role="alert" tabindex="-1" hidden></div></div></article><aside class="wizard-preview" id="wizardPreview" aria-label="任务预览">${preview(draft)}</aside></div>
      <footer class="wizard-footer"><div><button class="btn" onclick="CloudTaskWorkspace.previous()" ${index===0?'disabled':''}>上一步</button><span class="wizard-progress-text">第 ${index+1} / 4 步</span></div><div><button class="btn" onclick="CloudTaskWorkspace.saveDraft()">保存草稿</button>${draft.step<6?`<button class="btn btn-primary" onclick="CloudTaskWorkspace.next()">${draft.returnToReview?'保存修改，返回确认':'下一步：'+steps[index+1].label}</button>`:`<button class="btn btn-primary" onclick="CloudTaskWorkspace.submit()">确认创建任务</button>`}</div></footer>
    </section>`;
  }

  function refresh(preservePosition = false) {
    const content=document.getElementById('page-content'), scroll=content?.scrollTop || 0;
    const table=document.querySelector('.task-customer-table'), tableScroll={top:table?.scrollTop||0,left:table?.scrollLeft||0};
    const focused=document.activeElement;
    const focusSelector=focused?.id?'#'+CSS.escape(focused.id):focused?.getAttribute('aria-label')?'[aria-label="'+CSS.escape(focused.getAttribute('aria-label'))+'"]':focused?.name?'input[name="'+CSS.escape(focused.name)+'"][value="'+CSS.escape(focused.value)+'"]':'';
    const detailKey=node=>node.id||node.className||node.querySelector('summary')?.textContent;
    const details=new Map(Array.from(document.querySelectorAll('.cloud-task-workspace details')).map(node=>[detailKey(node),node.open]));
    navigateTo('cloud-task-create', { draftId: activeId() });
    if(preservePosition){
      document.querySelectorAll('.cloud-task-workspace details').forEach(node=>{const key=detailKey(node);if(key&&details.has(key))node.open=details.get(key);});
      if(content)content.scrollTop=scroll;
      const nextTable=document.querySelector('.task-customer-table');if(nextTable){nextTable.scrollTop=tableScroll.top;nextTable.scrollLeft=tableScroll.left;}
      if(focusSelector)document.querySelector('.cloud-task-workspace '+focusSelector)?.focus({preventScroll:true});
    }else document.getElementById('wizardStepTitle')?.focus({preventScroll:true});
  }
  function refreshPreview() {
    const d=activeDraft();if(!d)return;
    const host=document.getElementById('wizardPreview');if(host)host.innerHTML=d.editTaskId?editPreview(d,taskById(d.editTaskId)):preview(d);
    const counter=document.getElementById('wizardNameCount');if(counter)counter.textContent=Array.from(d.values.name||'').length+' / 49';
    const state=document.getElementById('wizardSaveState');if(state)state.textContent='有修改，未保存';
  }
  function clearFormErrors() {
    document.querySelectorAll('.cloud-task-workspace .wizard-field-error,.cloud-task-workspace .wizard-form-error').forEach(node=>{node.hidden=true;node.textContent='';});
    document.querySelectorAll('.cloud-task-workspace [aria-invalid]').forEach(node=>node.removeAttribute('aria-invalid'));
  }
  function showFormError(issue) {
    clearFormErrors();
    const field=issue.target && document.getElementById(issue.target), note=document.getElementById((issue.target||'')+'Error');
    const error=note||document.getElementById('wizardFormError');
    if(error){error.textContent=issue.message;error.hidden=false;}
    if(field){field.setAttribute('aria-invalid','true');field.closest('details')?.setAttribute('open','');field.focus({preventScroll:true});field.scrollIntoView({block:'center',behavior:'smooth'});}
    else if(error){error.closest('details')?.setAttribute('open','');error.focus({preventScroll:true});error.scrollIntoView({block:'center',behavior:'smooth'});}
  }
  function retryEditor(draft) {
    const editor=draft.values.retryEditor ||= {};
    editor.errors ||= {};editor.raw ||= {};editor.units ||= {};
    return editor;
  }
  function retryFeedback(draft,renderTiming=false){
    const p=draft.values.retryPolicy,e=retryEditor(draft);
    if(renderTiming){const target=document.getElementById('retryTimingDetails');if(target)target.innerHTML=AliCtiRetryEditor.timing(p,e);}
    const summary=document.getElementById('retryRuleSummary');if(summary)summary.textContent=AliCtiRetryEditor.ruleText(p,draft.type,e);
    const fieldIds={count:'retryMaxCount',uniform:'retryEveryInterval'};
    Object.keys(e.errors).filter(key=>key.startsWith('round-')).forEach(key=>fieldIds[key]='retryInterval'+key.slice(6));
    document.querySelectorAll('.retry-input-error').forEach(node=>{node.hidden=true;node.textContent='';});
    document.querySelectorAll('.retry-simple [aria-invalid]').forEach(node=>node.removeAttribute('aria-invalid'));
    for(const [key,issue] of Object.entries(e.errors)){
      const id=fieldIds[key]||('retryInterval'+key.slice(6)),node=document.getElementById(id+'Error');
      if(node){node.textContent=issue.message;node.hidden=false;document.getElementById(id)?.setAttribute('aria-invalid','true');}
    }
    const count=document.getElementById('retryMaxCount');if(count&&count!==document.activeElement)count.value=Object.hasOwn(e.raw,'count')?e.raw.count:(p.rounds||[]).length;
    const minus=document.querySelector('[aria-label="减少重呼次数"]');if(minus)minus.disabled=(p.rounds||[]).length<=1;
    const message=document.getElementById('retryValidation'),error=AliCtiRetry.validate(p,draft.type);
    if(message){const show=!!error&&!(p.mode!=='unset'&&!p.codes?.length);message.textContent=show?error:'';message.hidden=!show;}
    refreshPreview();
  }
  function persistRetry(draft, redraw = true) {
    persist();AppState.setDirty(true);clearFormErrors();
    if(redraw)refresh(true);
    retryFeedback(draft);
  }
  function resetRetry() {
    const d=activeDraft();if(!d)return;
    d.values.retryPolicy={...AliCtiRetry.create(d.type),timeType:2};d.values.retryEditor={};persistRetry(d);
  }
  function setRetryMode(mode) {
    const d=activeDraft();if(!d||!['unset','advanced'].includes(mode))return;
    d.values.retryPolicy ||= {...AliCtiRetry.create(d.type),timeType:2};
    const e=retryEditor(d);if(d.values.retryPolicy.mode!=='unset')e.enabledMode=d.values.retryPolicy.mode;
    d.values.retryPolicy.mode=mode==='unset'?'unset':'advanced';persistRetry(d);
  }
  function setRetryTimeType(value) {
    const d=activeDraft(),type=Number(value),p=d?.values.retryPolicy;if(!p||![1,2].includes(type)||p.timeType===type)return;
    // Convert the existing timeline where valid; changing the display basis does not erase intervals.
    const gaps=AliCtiRetryEditor.gaps(p),valid=gaps.length&&gaps.every(n=>Number.isSafeInteger(n)&&n>0);
    if(valid){let total=0;const times=gaps.map(gap=>type===1?(total+=gap):gap);if(times.every(Number.isSafeInteger))p.rounds=times.map(AliCtiRetry.fromMinutes);}
    p.timeType=type;retryEditor(d).units={};persistRetry(d);
  }
  function toggleRetryCode(code,checked) {
    const d=activeDraft();if(!d||!d.values.retryPolicy||d.values.retryPolicy.mode==='unset'||!AliCtiRetry.numberCodes.some(item=>item.code===code))return;
    const query=document.getElementById('retryStatusSearch')?.value||'',menuOpen=!!document.querySelector('.retry-condition-menu')?.open;
    const codes=new Set(d.values.retryPolicy.codes||[]);checked?codes.add(code):codes.delete(code);
    d.values.retryPolicy.codes=Array.from(codes);persistRetry(d);
    const menu=document.querySelector('.retry-condition-menu');if(menu&&menuOpen)menu.open=true;
    const search=document.getElementById('retryStatusSearch');if(search){search.value=query;AliCtiRetryEditor.filterStatuses(query);}
  }
  function changeRetryCount(value){
    const d=activeDraft(),p=d?.values.retryPolicy;if(!p||p.mode==='unset'||!Array.isArray(p.rounds))return;
    const e=retryEditor(d),count=Number(value);
    if(!/^\d+$/.test(String(value))||!Number.isSafeInteger(count)||count<1){
      e.raw.count=value;e.errors.count={message:'请填写大于 0 的整数次数。',target:'retryMaxCount'};persistRetry(d,false);return;
    }
    // Bound eager demo rendering, without treating this safeguard as a supplier contract limit.
    if(count>1000){e.raw.count=value;e.errors.count={message:'一次最多设置 1000 次，请减少重呼次数。',target:'retryMaxCount'};persistRetry(d,false);return;}
    const kind=AliCtiRetryEditor.layout(p,e),interval=AliCtiRetryEditor.gaps(p)[0]||10;
    if(kind==='uniform'&&p.timeType===1&&!Number.isSafeInteger(interval*count)){
      e.raw.count=value;e.errors.count={message:'次数与间隔组合过大，请调小后重试。',target:'retryMaxCount'};persistRetry(d,false);return;
    }
    delete e.raw.count;delete e.errors.count;e.layout=kind;
    if(kind==='uniform')p.rounds=Array.from({length:count},(_,index)=>AliCtiRetry.fromMinutes(p.timeType===1?interval*(index+1):interval));
    else {
      p.rounds=p.rounds.slice(0,count);
      while(p.rounds.length<count){const last=AliCtiRetry.minutes(p.rounds.at(-1)||{days:0,hours:0,minutes:10});p.rounds.push(AliCtiRetry.fromMinutes(p.timeType===1?last+10:last));}
    }
    for(const key of Object.keys(e.errors))if(key.startsWith('round-')&&Number(key.slice(6))>=count){delete e.errors[key];delete e.raw[key];delete e.units[key];}
    persist();AppState.setDirty(true);clearFormErrors();retryFeedback(d,kind==='custom');
  }
  function adjustRetryCount(delta){const p=activeDraft()?.values.retryPolicy;if(p)changeRetryCount(p.rounds.length+delta);}
  function changeRetryInterval(key,value,unit){
    const d=activeDraft(),p=d?.values.retryPolicy;if(!p||p.mode==='unset'||!AliCtiRetryEditor.units[unit])return;
    const index=key.startsWith('round-')?Number(key.slice(6)):null;
    if(key!=='uniform'&&(!Number.isInteger(index)||!p.rounds[index]))return;
    const e=retryEditor(d),total=Number(value)*AliCtiRetryEditor.units[unit].factor,id=key==='uniform'?'retryEveryInterval':'retryInterval'+index;
    e.units[key]=unit;
    if(!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(String(value))||!Number.isSafeInteger(total)||total<1||(key==='uniform'&&p.timeType===1&&!Number.isSafeInteger(total*p.rounds.length))){
      e.raw[key]=value;e.errors[key]={message:'请填写有效间隔，换算后至少为 1 个完整分钟。',target:id};persistRetry(d,false);return;
    }
    delete e.raw[key];delete e.errors[key];
    if(key==='uniform')p.rounds=p.rounds.map((_,i)=>AliCtiRetry.fromMinutes(p.timeType===1?total*(i+1):total));
    else p.rounds[index]=AliCtiRetry.fromMinutes(total);
    persistRetry(d,false);
  }
  function setRetryLayout(kind){
    const d=activeDraft(),p=d?.values.retryPolicy;if(!p||p.mode==='unset'||!['uniform','custom'].includes(kind))return;
    const e=retryEditor(d);
    if(kind==='uniform'){
      const first=AliCtiRetry.minutes(p.rounds[0]||{days:0,hours:0,minutes:10});
      const interval=Number.isSafeInteger(first)&&first>0?first:10;
      p.rounds=p.rounds.map((_,i)=>AliCtiRetry.fromMinutes(p.timeType===1?interval*(i+1):interval));
      for(const key of Object.keys(e.errors))if(key.startsWith('round-')){delete e.errors[key];delete e.raw[key];}
    }else{delete e.errors.uniform;delete e.raw.uniform;}
    e.layout=kind;persistRetry(d);
  }
  // Keep old demo helpers available for saved verification paths.
  function addRetryRound(){adjustRetryCount(1);}
  function removeRetryRound(index){const d=activeDraft(),p=d?.values.retryPolicy;if(!p||p.rounds.length<=1||!Number.isInteger(index)||!p.rounds[index])return;p.rounds.splice(index,1);d.values.retryEditor={layout:'custom'};persistRetry(d);}
  function updateRetryRound(index,key,value){const d=activeDraft(),p=d?.values.retryPolicy;if(!p?.rounds?.[index]||!['days','hours','minutes'].includes(key))return;p.rounds[index][key]=value;retryEditor(d).layout='custom';persistRetry(d);}

  function update(key, value) {
    const draft=activeDraft();if(!draft||!['name','description','businessTagNames','sourceType','sourceRef','total','scheduleMode','scheduleAt','stopScheduled','stopAt','isRepeat','minAvailableAgentCount','callStrategy','customerTimeout','autoComplete','forceEndFlag','retryStrategyOnlyToday','concurrency','callRouteStrategy','agentTimeout','wrapup','maxWaitTime','quotiety','predictAdjust','answerRate','warmUpDuration','isRewarm'].includes(key))return;
    if(draft.editTaskId&&['sourceType','sourceRef','total','isRepeat'].includes(key))return;
    if(['callStrategy','callRouteStrategy','agentTimeout','wrapup','maxWaitTime','quotiety','predictAdjust','answerRate','warmUpDuration','isRewarm'].includes(key)&&draft.type!=='预外呼')return;
    draft.values[key]=value;persist();AppState.setDirty(true);clearFormErrors();
    if(key==='stopScheduled'&&!value){draft.values.stopAt='';draft.values.forceEndFlag=0;persist();}
    if(['scheduleMode','stopScheduled','callRouteStrategy'].includes(key))refresh(true);
    if(key==='customerTimeout'){const label=document.getElementById('wizardCustomerTimeoutSummary');if(label)label.textContent=value+' 秒';}
    if(key==='callStrategy'){const label=document.getElementById('wizardCallStrategySummary');if(label)label.textContent=AliCtiFields.callStrategyLabel(value);}
    if(key==='isRepeat'){const label=document.querySelector('.wizard-more:has(#wizardRepeat) summary span');if(label)label.textContent=duplicateLabel(value);}
    refreshPreview();
  }
  function updatePriority(key,value) {
    const draft=activeDraft();if(!draft||!['retryFirst','retryDesc','firstCallOrderType'].includes(key))return;
    const priority=draft.values.callPriority||{retryFirst:true,retryDesc:0,firstCallOrderType:0};
    priority[key]=key==='retryFirst'?value:Number(value);
    draft.values.callPriority=priority;persist();AppState.setDirty(true);clearFormErrors();refreshPreview();
  }
  function addCallerPool() {
    const d=activeDraft();if(!d||d.values.callerMode!=='navigation')return;
    const catalog=callerPoolCatalog(d);
    if(catalog.available&&(!catalog.ok||!catalog.rows.length))return;
    if(!Array.isArray(d.values.clidPoolList))d.values.clidPoolList=[];
    d.values.clidPoolList.push({name:'',poolId:''});persist();AppState.setDirty(true);refresh(true);refreshPreview();
  }
  function setCallerNavigation(group) {
    const d=activeDraft();if(!d)return;
    const selected=callerNavigationOptions(d).find(row=>row.customerClidsGroup===group);
    if(group&&!selected){showFormError({message:'请选择当前 AliCti 账号已登记的外显导航。',target:'wizardCallerNavigation'});return;}
    d.values.customerClidsGroup=selected?.customerClidsGroup||'';
    d.values.callerNavigationName=selected?.name||'';
    d.values.clidPoolList=[];
    persist();AppState.setDirty(true);clearFormErrors();refresh(true);refreshPreview();
  }
  function updateCallerPool(index,key,value) {
    const d=activeDraft();if(!d||d.values.callerMode!=='navigation'||!['poolId','name','priority'].includes(key)||!Number.isInteger(index)||!d.values.clidPoolList?.[index])return;
    if(key==='poolId'){
      const catalog=callerPoolCatalog(d),selected=catalog.rows.find(row=>String(row.id)===String(value));
      if(value&&!selected){showFormError({message:'请选择当前租户和账号仍可用的号码池。',target:'wizardCallerPools'});return;}
      d.values.clidPoolList[index].poolId=selected?String(selected.id):'';
      d.values.clidPoolList[index].name=selected?.name||'';
    }else if(key==='name'){
      // Retain the programmatic legacy fixture path only when the catalog is absent.
      if(callerPoolCatalog(d).available)return;
      d.values.clidPoolList[index].name=value;
      d.values.clidPoolList[index].poolId='';
    }else d.values.clidPoolList[index].priority=value;
    persist();AppState.setDirty(true);clearFormErrors();
    if(key==='poolId')refresh(true);
    refreshPreview();
  }
  function removeCallerPool(index) {
    const d=activeDraft();if(!d||d.values.callerMode!=='navigation'||!Number.isInteger(index)||!d.values.clidPoolList?.[index])return;
    d.values.clidPoolList.splice(index,1);persist();AppState.setDirty(true);clearFormErrors();refresh(true);refreshPreview();
  }
  function setTimeMode(value) {
    const d=activeDraft();if(!d||!['0','1',0,1].includes(value))return;
    d.values.autoTaskType=Number(value);if(Number(value)===0)d.values.allowedTimeIds=[];
    delete d.values.autoTriggerTimeStrategy;delete d.values.timeStrategy;delete d.values.timeConditionSnapshot;
    persist();AppState.setDirty(true);clearFormErrors();refresh(true);refreshPreview();
  }
  function toggleTimeCondition(key,id) {
    const d=activeDraft();if(!d||!['allowedTimeIds','forbiddenTimeIds'].includes(key)||key==='allowedTimeIds'&&Number(d.values.autoTaskType)!==1)return;
    const ids=Array.isArray(d.values[key])?d.values[key]:[],existing=ids.some(value=>String(value)===String(id));
    if(!existing){const catalog=window.AliCtiTimeConditions?.catalog(d.tenantId);if(!catalog?.ok||!catalog.rows.some(row=>String(row.id)===String(id)))return;}
    d.values[key]=existing?ids.filter(value=>String(value)!==String(id)):[...ids,String(id)];delete d.values.timeConditionSnapshot;
    persist();AppState.setDirty(true);clearFormErrors();refresh(true);refreshPreview();
  }
  function setResource(key,value){
    const d=activeDraft();if(!d||!['skillGroupId','contactFlowId','providerIvrId','executionQueueId','transferEnabled','saveAsTemplate','callGroupType','outboundGroupId'].includes(key))return;
    if(d.editTaskId&&['skillGroupId','providerIvrId','executionQueueId','transferEnabled','saveAsTemplate','callGroupType'].includes(key))return;
    if(key==='saveAsTemplate'&&!AppState.canMenu('settings.plans'))return;
    if(key==='callGroupType'){
      d.values.callGroupType=Number(value);
      if(Number(value)===2){
        d.values.cnos=[];
      }else{
        d.values.outboundGroupId='';
        delete d.values.outboundGroupSnapshot;
        if(!d.values.cnos||!d.values.cnos.length){
          d.values.cnos=(optionsFor(d).agents||[]).map(a=>a.cno);
        }
      }
      persist();AppState.setDirty(true);clearFormErrors();refresh(true);refreshPreview();return;
    }
    if(key==='outboundGroupId'){
      d.values.outboundGroupId=value;
      const obg=window.OutboundGroups?.forTask(value,d);
      if(obg)d.values.outboundGroupSnapshot=structuredClone(obg);else delete d.values.outboundGroupSnapshot;
      persist();AppState.setDirty(true);clearFormErrors();refresh(true);refreshPreview();return;
    }
    if(key==='providerIvrId'){const selected=AliCtiIvr.list(d).rows.find(row=>String(row.id)===String(value));d.values.providerIvrId=selected?String(selected.id):'';d.values.contactFlowId=selected?.localContactFlowId||'';d.values.transferEnabled=false;d.values.skillGroupId='';d.values.executionQueueId='';persist();AppState.setDirty(true);clearFormErrors();refresh(true);return;}
    d.values[key]=value;
    if(d.type==='预外呼'&&key==='skillGroupId'&&value){
      const cnos=resolveEffectiveCnos(d);
      if(cnos.length)d.values.cnos=cnos;
    }
    if(key==='transferEnabled'&&!value)d.values.skillGroupId='';
    persist();AppState.setDirty(true);clearFormErrors();
    if(['transferEnabled','skillGroupId'].includes(key))refresh(true);
    refreshPreview();
  }
  function toggleAgent(cno){
    const d=activeDraft();if(!d)return;
    const current=new Set(Array.isArray(d.values.cnos)?d.values.cnos:String(d.values.cnos||'').split(',').filter(Boolean));
    if(current.has(cno))current.delete(cno);else current.add(cno);
    d.values.cnos=[...current];
    persist();AppState.setDirty(true);clearFormErrors();refreshPreview();
  }
  function toggleAllAgents(select){
    const d=activeDraft();if(!d)return;
    if(!select){d.values.cnos=[];}
    else{d.values.cnos=(optionsFor(d).agents||[]).map(a=>a.cno);}
    persist();AppState.setDirty(true);clearFormErrors();refresh(true);refreshPreview();
  }
  function setTenant(tenantId) { const draft = activeDraft(); if (!draft || draft.editTaskId || draft.repeatPredictive || !AppState.isSuper() || draft.tenantId===tenantId) return; const target = AppState.availableTenants().find(item => item.tenantId === tenantId && (item.capabilitySet || []).includes('CLOUD_CONTACT_CENTER')); if (!target || target.enterpriseId!==draft.enterpriseId) return; draft.tenantId = tenantId; draft.values.customerIds=[]; delete draft.values.customerMode; draft.values.customerBatch=''; draft.values.customerQuery=''; draft.values.planId = ''; draft.values.skillGroupId = ''; Object.assign(draft.values,callerFromAccount(draft,{...draft.values,clidPoolList:[]})); draft.values.contactFlowId = ''; draft.values.providerIvrId = ''; draft.furthestIndex=0; draft.returnToReview=false; draft.values.executionQueueId = ''; draft.values.transferEnabled = false; draft.values.saveAsTemplate=false; draft.values.autoTaskType=0;draft.values.allowedTimeIds=[];draft.values.forbiddenTimeIds=[];delete draft.values.timeConditionSnapshot;delete draft.values.autoTriggerTimeStrategy;delete draft.values.timeStrategy; persist(); AppState.setDirty(true); refresh(true); refreshPreview(); }
  function selectPlan(planId) {
    const draft=activeDraft();if(!draft||draft.editTaskId)return;
    const selected=plan(planId);
    if(planId&&(!optionsFor(draft).plans.some(p=>p.callPlanId===planId)||selected.supersededBy))return;
    if(planId&&draft.type==='预外呼'){const issue=AliCtiRetryEditor.issue(draft.values.retryPolicy,draft.type,draft.values.retryEditor);if(issue){moveTo(draft,5);showFormError(issue);return;}}
    draft.values.planId=planId;
    if(!planId){persist();AppState.setDirty(true);refresh(true);refreshPreview();return;}
    const selectedCaller=callerSettings(selected);
    Object.assign(draft.values,timeProperties(selected),callerFromAccount(draft,selectedCaller));
    for(const key of ['description','businessTagNames','autoComplete','retryStrategyOnlyToday','concurrency','callRouteStrategy','agentTimeout','wrapup','maxWaitTime','quotiety','predictAdjust','answerRate','warmUpDuration','isRewarm'])if(selected[key]!==undefined)draft.values[key]=selected[key];
    if(selected.callPriority)draft.values.callPriority=structuredClone(selected.callPriority);
    if(draft.values.stopScheduled&&selected.forceEndFlag!==undefined)draft.values.forceEndFlag=selected.forceEndFlag;
    if(draft.type==='预外呼'&&selected.retryPolicy&&draft.values.retryPolicy?.mode!=='unset'){draft.values.retryPolicy=structuredClone(selected.retryPolicy);delete draft.values.retryEditor;}
    if([0,1,2,3].includes(Number(selected.isRepeat)))draft.values.isRepeat=Number(selected.isRepeat);
    if(draft.type==='预外呼'){draft.values.callStrategy=AliCtiFields.callStrategyValue(selected.callStrategy);draft.values.skillGroupId=selected.targetSkillGroupId||'';draft.values.contactFlowId=selected.contactFlowId||'';draft.values.executionQueueId=selected.executionQueueId||'';draft.values.transferEnabled=!!selected.transferEnabled;}
    persist();AppState.setDirty(true);refresh(true);refreshPreview();
  }

  function allocateTaskId(draft) {
    if (draft.taskId) return draft.taskId;
    const prefix = draft.type === '预外呼' ? 'TASK-PRED-D' : 'TASK-IVR-D';
    draft.taskId = `${prefix}${String(Date.now()).slice(-5)}-${crypto.randomUUID().slice(0, 8)}`;
    return draft.taskId;
  }

  function saveDraft(silent) {
    const draft = activeDraft();
    if (!draft) return false;
    if (!canAccessDraft(draft)) return false;
    // Drafts preserve incomplete controls; navigation and creation validate separately.
    const previous = { taskId: draft.taskId, savedAt: draft.savedAt };
    if(!draft.editTaskId)allocateTaskId(draft);
    draft.savedAt = nowText();
    try { persist(); } catch (_) {
      Object.assign(draft, previous);
      showToast('草稿暂未保存，请保留当前页面并重试', 'warning');
      return false;
    }
    if (wizardDiscardBaseline?.draftId === draft.draftId)
      wizardDiscardBaseline.snapshot = structuredClone(draft);
    AppState.setDirty(false);
    if (!silent) { showToast('任务草稿已保存，可稍后继续', 'success'); refresh(true); }
    return true;
  }

  function taskSettingsIssue(draft,step) {
    const issue=AliCtiFields.taskSettings(draft.values,draft.type).issues.find(item=>{
      if(['wizardDescription','wizardBusinessTags'].includes(item.target))return step===(draft.type==='预外呼'?2:4);
      if(['wizardCallRouteStrategy','wizardAgentTimeout','wizardWrapup','wizardMaxWaitTime','wizardQuotiety','wizardPredictAdjust','wizardAnswerRate','wizardWarmUpDuration','wizardIsRewarm'].includes(item.target))return step===4;
      return step===5;
    });
    return issue||null;
  }

  function validateStep(draft, step) {
    const v=draft.values, fail=(message,target)=>({message,target});
    if (step===1 && !canAccessObject(draft)) return fail('当前组织的操作权限已变化，请返回任务列表重新进入。');
    if ((draft.type==='预外呼'&&step===2)||(draft.type==='IVR 外呼'&&step===4)) {
      if(!String(v.name||'').trim())return fail('请先填写任务名称。','wizardName');
      if(Array.from(String(v.name||'').trim()).length>=50)return fail('任务名称最多填写 49 个字。','wizardName');
    }
    if(step===2){
      if(draft.repeatPredictive){
        const result=window.RepeatPredictive?.validateSpec(repeatSpecForDraft(draft));
        if(!result?.ok)return fail(result?.message||'所选客户暂时无法安排再次预外呼，请返回后重新选择。','wizardCustomers');
        if(draft.type!=='预外呼'||result.tenantId!==draft.tenantId||result.enterpriseId!==draft.enterpriseId)return fail('再次联系的客户归属已变化，请返回后重新选择。','wizardCustomers');
      }else if(!CustomerTasks.validateTaskSelection(draft,v.customerIds||[]))return fail('部分客户已被分配，请重新选择名单。','wizardCustomers');
      if(![0,1,2,3].includes(Number(v.isRepeat??0)))return fail('请选择重复号码的处理方式。','wizardRepeat');
    }
    if(draft.type==='IVR 外呼'&&step===4){const selected=AliCtiIvr.resolve(v,draft);if(!selected.ok)return fail(selected.message,'wizard-providerIvrId');}
    if ((draft.type==='预外呼'&&step===4)||(draft.type==='IVR 外呼'&&step===5)) {
      const choices=optionsFor(draft);
      const isOutboundGroup = draft.type==='预外呼' && Number(v.callGroupType)===2;
      if(draft.type==='IVR 外呼'&&!AliCtiIvr.resolve(v,draft).ok)return fail('语音流程已不可用，请返回第一步重新选择。','wizard-providerIvrId');
      if(draft.type==='预外呼'){
        if(isOutboundGroup){
          const obRes=window.OutboundGroups?.resolve ? window.OutboundGroups.resolve(v,draft) : null;
          if(!obRes?.ok)return fail(obRes?.message||'请选择有效的外呼组。','wizard-outboundGroupId');
        }else{
          const cnoList = resolveEffectiveCnos(draft);
          if(!cnoList.length)return fail('请至少勾选一位参与本次外呼的坐席。','wizard-cnos');
          v.cnos = cnoList;
        }
      }else if(draft.type==='IVR 外呼'&&v.transferEnabled&&!choices.groups.some(g=>g.skillGroupId===v.skillGroupId)){
        return fail('请选择已有可接听坐席的团队。','wizard-skillGroupId');
      }
      Object.assign(v,callerFromAccount(draft,v));
      const callerCheck=AliCtiFields.validateCallerSettings(v,{...callerPoolValidation(draft),requireNavigation:true});if(!callerCheck.ok)return fail(callerCheck.message,callerCheck.target);
      if(!v.customerClidsGroup)return fail('请选择本任务使用的外显导航。','wizardCallerNavigation');
      if(draft.type==='预外呼'&&!AliCtiFields.callStrategyValue(v.callStrategy))return fail('请选择有效的坐席分配方式。','wizardCallStrategy');
      if(draft.type==='预外呼'&&!(Number.isInteger(Number(v.minAvailableAgentCount??10))&&Number(v.minAvailableAgentCount??10)>=1&&Number(v.minAvailableAgentCount??10)<=10))return fail('可用坐席人数请填写 1–10 的整数。','wizardMinAgents');
      if(draft.type==='预外呼'&&v.contactFlowId&&!choices.flows.some(f=>f.contactFlowId===v.contactFlowId))return fail('语音流程已不可用，请重新选择。','wizard-contactFlowId');
      if(draft.type==='预外呼'&&Number(v.callRouteStrategy??1)===2){
        if(!v.contactFlowId)return fail('AI 转人工模式须先选择已映射 AliCti 的语音流程。','wizard-contactFlowId');
        const flow=choices.flows.find(f=>f.contactFlowId===v.contactFlowId);
        if(flow&&!(Number(flow.providerIvrId)>0||String(flow.providerIvrName||'').trim()||AliCtiIvr.resolve(v,draft,CloudCallData,'predictive').ok))return fail('所选语音流程尚未映射供应商，无法用于 AI 转人工。','wizard-contactFlowId');
      }
      const error=AliCtiAdapter.validateTaskDraft(draft)||CloudResourceRules.validatePlan(taskConfig(draft),true);
      if(error)return fail(error);
    }
    if (step===5) {
      if(!['定时执行','保存后手工启动'].includes(v.scheduleMode))return fail('请选择开始呼叫的方式。');
      const timing=AliCtiFields.taskTimeFields(v,draft.tenantId);
      if(!timing.ok)return fail(timing.message,timing.target||'wizardTimeConditions');
      const retryIssue=AliCtiRetryEditor.issue(v.retryPolicy,draft.type,v.retryEditor);
      if(retryIssue)return retryIssue;
    }
    const settingsIssue=taskSettingsIssue(draft,step);if(settingsIssue)return settingsIssue;
    return null;
  }

  function moveTo(draft,step) {
    draft.step=step;draft.furthestStep=step;draft.furthestIndex=Math.max(draft.furthestIndex||0,stepsFor(draft).findIndex(item=>item.step===step));
    if(step===6)draft.returnToReview=false;
    persist();refresh();
  }
  function verifyThrough(draft,target) {
    const sequence=stepsFor(draft),targetIndex=sequence.findIndex(item=>item.step===target);
    for(const step of [1,...sequence.slice(0,targetIndex).map(item=>item.step)]){
      const issue=validateStep(draft,step);
      if(issue){moveTo(draft,step===1?stepsFor(draft)[0].step:step);showFormError(issue);return false;}
    }
    return true;
  }
  function next() {
    const draft=activeDraft();if(!draft)return;normalizeStep(draft);
    const steps=stepsFor(draft),target=draft.returnToReview?6:steps[steps.findIndex(item=>item.step===draft.step)+1]?.step;
    if(target&&verifyThrough(draft,target))moveTo(draft,target);
  }
  function previous() {
    const draft=activeDraft();if(!draft)return;normalizeStep(draft);
    const steps=stepsFor(draft),previous=steps[steps.findIndex(item=>item.step===draft.step)-1];
    if(previous){draft.returnToReview=false;moveTo(draft,previous.step);}
  }
  function goStep(step) {
    const draft=activeDraft();if(!draft)return;normalizeStep(draft);
    const target=step===1?2:step===3?4:step;
    const steps=stepsFor(draft),index=steps.findIndex(item=>item.step===target),current=steps.findIndex(item=>item.step===draft.step);
    if(index<0||index>draft.furthestIndex||target===draft.step)return;
    if(index>current&&!verifyThrough(draft,target))return;
    if(draft.step===6)draft.returnToReview=true;
    moveTo(draft,target);
  }

  function goConfigure(route, requirementKey, requirementLabel, wasReady) {
    const draft = activeDraft();
    if (!draft) return;
    if(!saveDraft(true))return false;
    AppState.beginConfiguration(route, {
      contextType: 'wizard',
      fromRoute: 'cloud-task-create',
      sourceLabel: `${typeLabel(draft.type)}任务 ${draft.taskId}`,
      scenarioType: scenarioType(draft),
      tenantId: draft.tenantId,
      requirementKey,
      requirementLabel,
      wasReady: !!wasReady,
      returnOptions: { draftId: draft.draftId, wizardStep: draft.step }
    });
  }

  function submit() {
    const editing=activeDraft();
    if(editing?.editTaskId)return submitEdit(editing);
    if(!recoverTaskCreation()){showFormError({message:'上次创建尚未恢复，请检查浏览器存储后重试。'});return;}
    const draft = activeDraft();
    if (!draft) return;
    if(draft.repeatPredictive){showFormError({message:'再次联系需在原任务内安排，请返回原任务。'});return;}
    if(!verifyThrough(draft,6))return;
    const requestDraft=AliCtiFields.taskFields(draft,CloudCallData,callerPoolValidation(draft));
    const requestIssues=[...new Set([...(requestDraft.errors||[]),...(requestDraft.pending||[])])];
    if(requestIssues.length){showFormError({message:requestIssues.join('；')});return;}
    const selectedPlan = taskConfig(draft);
    const target = draft.type === '预外呼' ? CloudCallData.predictiveTasks : CloudCallData.ivrTasks;
    allocateTaskId(draft);
    const row = {
      taskId: draft.taskId,
      tenantId: draft.tenantId,
      enterpriseId: draft.enterpriseId,
      name: draft.values.name.trim(),
      callType: draft.type,
      status: '待分配客户',
      customerSourceMode: 'assigned',
      // Only tasks created by this local wizard may use the opt-in result simulator.
      // Do not infer this flag from a seed ID, campaign ID or existing call history.
      localPrototypeTask: true,
      simulation: true,
      total: 0,
      completed: 0,
      connected: 0,
      planId: selectedPlan.callPlanId,
      executionConfig: structuredClone(selectedPlan),
      planVersion: selectedPlan.publishedVersion || '—',
      planSnapshotId: '',
      planSnapshot: null,
      campaignId: '',
      listSource: '客户名单分配',
      scheduleMode: draft.values.scheduleMode,
      scheduleAt: draft.values.scheduleMode === '定时执行' ? draft.values.scheduleAt.replace('T', ' ') : '手工启动',
      ...timeProperties(draft.values),
      timeConditionSnapshot:structuredClone(requestDraft.timeConditionSnapshot||[]),
      stopScheduled:!!draft.values.stopScheduled,stopAt:draft.values.stopScheduled?draft.values.stopAt:'',
      description:draft.values.description||'',businessTagNames:draft.values.businessTagNames||'',
      forceEndFlag:draft.values.stopScheduled?settingNumber(draft.values,'forceEndFlag',0):0,
      retryStrategyOnlyToday:settingNumber(draft.values,'retryStrategyOnlyToday',0),
      callPriority:structuredClone(draft.values.callPriority||{retryFirst:true,retryDesc:0,firstCallOrderType:0}),concurrency:settingNumber(draft.values,'concurrency',draft.type==='预外呼'?0:1),
      retryPolicy: structuredClone(draft.values.retryPolicy),
      retryPolicySource: 'ALICTI_CONTRACT_DRAFT',
      isRepeat:Number(draft.values.isRepeat??0),
      ...(draft.type==='预外呼'?{
        callStrategy:requestDraft.fields.callStrategy,
        callRouteStrategy:settingNumber(draft.values,'callRouteStrategy',1),agentTimeout:settingNumber(draft.values,'agentTimeout',10),
        wrapup:settingNumber(draft.values,'wrapup',30),maxWaitTime:settingNumber(draft.values,'maxWaitTime',40),
        quotiety:settingNumber(draft.values,'quotiety',1),predictAdjust:settingNumber(draft.values,'predictAdjust',100),
        answerRate:settingNumber(draft.values,'answerRate',50),warmUpDuration:settingNumber(draft.values,'warmUpDuration',300),
        isRewarm:settingNumber(draft.values,'isRewarm',1),
        callGroupType:Number(requestDraft.fields.callGroupType||1),
        cnos:Number(requestDraft.fields.callGroupType)===2?'':String(requestDraft.fields.cnos||''),
        agentSelectionSnapshot:Number(requestDraft.fields.callGroupType)===2?[]:selectedAgentSnapshot(requestDraft.fields.cnos,draft),
        ...(Number(requestDraft.fields.callGroupType)===2?{
          agentGroup:requestDraft.fields.agentGroup||'',
          outboundGroupId:draft.values.outboundGroupId||'',
          outboundGroupSnapshot:draft.values.outboundGroupSnapshot||window.OutboundGroups?.forTask(draft.values.outboundGroupId,draft)
        }:{})
      }:{}),
      providerTaskId:null,alictiCreateDraft:requestDraft,providerType:draft.type==='预外呼'?1:2,autoStart:requestDraft.fields.autoStart,autoStop:requestDraft.fields.autoStop,importTelAutoStart:0,autoComplete:requestDraft.fields.autoComplete,minAvailableAgentCount:draft.type==='预外呼'?Number(draft.values.minAvailableAgentCount??10):null,providerStatus:'供应商任务标识待确认',
      stopNewDialing: false,
      ...callerSettings(draft.values),
      targetSkillGroupId: selectedPlan.targetSkillGroupId || '',
      executionQueueId: selectedPlan.executionQueueId || '',
      contactFlowId: selectedPlan.contactFlowId || '',
      providerIvrId: selectedPlan.providerIvrId || '',
      transferEnabled: !!selectedPlan.transferEnabled,
      owner: AppState.account().name || AppState.profile().label
    };
    const selectedIds=draft.values.customerIds||[];
    const repeatSpec=draft.repeatPredictive?repeatSpecForDraft(draft):null;
    if(repeatSpec)row.repeatContact=structuredClone(repeatSpec);
    const attachment=repeatSpec?window.RepeatPredictive?.prepareAttachment(row,repeatSpec):CustomerTasks.prepareTaskAttachment?.(row,selectedIds);
    if(!attachment?.ok){showFormError({message:attachment?.message||'客户分配未成功，任务尚未提交，请重新选择后重试'});return;}
    const before=structuredClone(draft);
    try{
      row.total=repeatSpec?attachment.changes.length:selectedIds.length;row.status=row.total?'待启动':'待分配客户';
      AliCtiDemo.taskCreated(row);
      syncImportDrafts(row,attachment.changes.map(change=>({...change.after,batchId:change.batchId,batchName:change.batchName})));
      const importIssues=row.alictiImportDrafts.flatMap(item=>item.pending||[]);
      if(importIssues.length){showFormError({message:[...new Set(importIssues)].join('；')});return;}
      const currentTimes=AliCtiFields.taskTimeFields(draft.values,draft.tenantId);
      if(!currentTimes.ok||currentTimes.revision!==requestDraft.timeConditionRevision||currentTimes.context!==requestDraft.timeConditionContext){showFormError({message:currentTimes.message||'时间条件已变化，请重新核对后创建。',target:'wizardTimeConditions'});return;}
      const currentPools=AliCtiFields.validateCallerSettings(draft.values,{...callerPoolValidation(draft),requireNavigation:true});
      if(!currentPools.ok){showFormError({message:currentPools.message,target:currentPools.target});return;}
      if(!callerNavigationOptions(draft).some(item=>item.customerClidsGroup===row.customerClidsGroup)){showFormError({message:'所选外显导航已不在当前账号中，请重新选择。',target:'wizardCallerNavigation'});return;}
      const transaction={version:1,taskId:row.taskId,draftBefore:before,attachment,committed:false};
      journalStorage().setItem(creationJournalKey,JSON.stringify(transaction));
      if(!CustomerTasks.commitTaskAttachment(attachment))throw Error('客户保存失败');
      persistCreatedTask(row);
      draft.status='已提交';draft.savedAt=nowText();persist();
      journalStorage().setItem(creationJournalKey,JSON.stringify({...transaction,committed:true}));
    }catch(_){
      const restored=recoverTaskCreation();
      Object.assign(draft,before);AppState.setDirty(true);
      showFormError({message:restored?'任务未创建，所选客户未被占用。请检查浏览器存储后重试。':'保存尚未完成，已保留恢复记录。请检查浏览器存储后重新进入，勿重复创建。'});return;
    }
    // Publish to the page only after both persistent records have committed.
    target.unshift(row);
    if (!CloudCallData.tasks.includes(row)) CloudCallData.tasks.unshift(row);
    if(draft.values.saveAsTemplate&&AppState.canMenu('settings.plans'))CloudCallData.callPlans.push({...structuredClone(selectedPlan),callPlanId:CloudResourceRules.id('TEMPLATE'),name:row.name,isTemplate:true});
    try{journalStorage().removeItem(creationJournalKey);}catch(_){}
    AppState.setDirty(false);
    sessionStorage.removeItem(activeKey);
    showToast(repeatSpec?'再次预外呼已安排，可在任务列表查看':row.total ? '任务已创建，所选客户已分配' : '任务已创建，可继续添加客户', 'success');
    RouteRuntime.back({ fallback: routeForType(draft.type), refresh: true });
  }

  function submitEdit(draft){
    const row=taskById(draft.editTaskId);
    if(!canEditTask(row)||row.taskId!==draft.taskId||row.callType!==draft.type||
      row.tenantId!==draft.tenantId||row.enterpriseId!==draft.enterpriseId||
      explicitSupplierTaskId(row)!==draft.editSupplierTaskId||taskEditFingerprint(row)!==draft.editSourceFingerprint){
      showFormError({message:'原任务状态或设置已变化，请返回任务详情重新打开编辑。'});return false;
    }
    if(!String(draft.values.name||'').trim()||Array.from(String(draft.values.name||'').trim()).length>=50){
      showFormError({message:'任务名称须填写且少于 50 字。',target:'wizardName'});return false;
    }
    if(!callerNavigationOptions(draft).some(item=>item.customerClidsGroup===draft.values.customerClidsGroup)){
      showFormError({message:'所选外显导航已不在当前账号中，请重新选择。',target:'wizardCallerNavigation'});return false;
    }
    Object.assign(draft.values,callerFromAccount(draft,draft.values));
    const callerCheck=AliCtiFields.validateCallerSettings(draft.values,{...callerPoolValidation(draft),requireNavigation:true});
    if(!callerCheck.ok){showFormError({message:callerCheck.message,target:callerCheck.target});return false;}
    if(!draft.values.customerClidsGroup){showFormError({message:'请选择本任务使用的外显导航。',target:'wizardCallerNavigation'});return false;}
    const request=AliCtiFields.taskUpdateFields(draft,row,CloudCallData,callerPoolValidation(draft));
    const problems=[...new Set([...(request.errors||[]),...(request.pending||[])])];
    if(problems.length){showFormError({message:problems.join('；'),target:request.target});return false;}
    const result=window.AliCtiTaskUpdate?.submit(row,request);
    if(!result?.ok){showFormError({message:result?.message||'未能确认任务更新，原配置保持不变。'});return false;}
    const next=structuredClone(row),changed=new Set(request.changedKeys||[]),v=draft.values,at=nowText();
    const allowed=['name','description','businessTagNames','scheduleMode','scheduleAt','stopScheduled','stopAt','forceEndFlag',
      'autoTaskType','allowedTimeIds','forbiddenTimeIds','retryPolicy','autoComplete','retryStrategyOnlyToday',
      'callPriority','concurrency','customerClidsGroup','callerNavigationName','clidPoolList','customerTimeout',
      'callRouteStrategy','contactFlowId','providerIvrId','cnos','agentGroup','outboundGroupId','outboundGroupSnapshot',
      'callStrategy','agentTimeout','wrapup','maxWaitTime','minAvailableAgentCount','quotiety','predictAdjust',
      'answerRate','warmUpDuration','isRewarm'];
    const applied=allowed.filter(key=>changed.has(key));
    const beforeSnapshot=next.planSnapshot?structuredClone(next.planSnapshot):null;
    next.taskSettingHistory=[...(next.taskSettingHistory||[]),{at,source:'task/update',supplierTaskId:request.fields.taskId,
      previousSnapshot:beforeSnapshot,changedKeys:applied,fields:structuredClone(request.fields),mock:true}];
    for(const key of applied){
      if(key==='name')next.name=String(v.name).trim();
      else if(key==='scheduleAt')next.scheduleAt=v.scheduleMode==='定时执行'?String(v.scheduleAt).replace('T',' '):'手工启动';
      else next[key]=structuredClone(v[key]);
      if(next.executionConfig&&key!=='name')next.executionConfig[key]=structuredClone(v[key]);
      if(next.planSnapshot&&key!=='name')next.planSnapshot[key]=structuredClone(v[key]);
    }
    if(changed.has('customerClidsGroup')||changed.has('clidPoolList')){
      next.callerMode='navigation';next.callerNumberId='';
      if(next.executionConfig){next.executionConfig.callerMode='navigation';next.executionConfig.callerNumberId='';next.executionConfig.allowedCallerNumberIds=[];}
      if(next.planSnapshot){next.planSnapshot.callerMode='navigation';next.planSnapshot.callerNumberId='';next.planSnapshot.callerNumberIds=[];}
    }
    if(changed.has('scheduleMode')){
      next.autoStart=v.scheduleMode==='定时执行'?1:0;
      next.scheduleAt=v.scheduleMode==='定时执行'?String(v.scheduleAt).replace('T',' '):'手工启动';
    }
    if(changed.has('stopScheduled'))next.autoStop=v.stopScheduled?1:0;
    if(changed.has('autoTaskType')||changed.has('allowedTimeIds')||changed.has('forbiddenTimeIds')){
      next.timeConditionSnapshot=structuredClone(request.timeConditionSnapshot||[]);
      if(next.executionConfig)next.executionConfig.timeConditionSnapshot=structuredClone(next.timeConditionSnapshot);
      if(next.planSnapshot)next.planSnapshot.timeConditionSnapshot=structuredClone(next.timeConditionSnapshot);
    }
    if(changed.has('retryPolicy'))next.retryPolicySource='ALICTI_CONTRACT_UPDATE';
    if(changed.has('cnos'))next.agentSelectionSnapshot=selectedAgentSnapshot(v.cnos,draft);
    if(changed.has('outboundGroupId')||changed.has('agentGroup')){
      next.agentGroup=request.fields.agentGroup||next.agentGroup;
      if(next.executionConfig)next.executionConfig.agentGroup=next.agentGroup;
      if(next.planSnapshot)next.planSnapshot.agentGroup=next.agentGroup;
    }
    if(changed.has('contactFlowId')&&(request.fields.ivrId||request.fields.ivrName)){
      next.providerIvrId=request.fields.ivrId||next.providerIvrId;
      if(next.executionConfig)next.executionConfig.providerIvrId=next.providerIvrId;
      if(next.planSnapshot)next.planSnapshot.providerIvrId=next.providerIvrId;
    }
    next.alictiUpdateDraft=structuredClone(request);
    next.alictiUpdateTrace=structuredClone(result.trace);
    next.alictiMockTaskProperty=structuredClone(result.property);
    next.updatedAt=at;
    const prior=createdTasks;
    try{persistCreatedTask(next);}catch(_){
      createdTasks=prior;
      try{sessionStorage.setItem(createdTasksKey,JSON.stringify(prior));}catch(__){}
      showFormError({message:'更新已模拟完成，但本地结果保存失败；请重新查询任务状态，原页面配置未改。'});return false;
    }
    for(const list of [CloudCallData.tasks,CloudCallData.predictiveTasks,CloudCallData.ivrTasks])
      for(const item of list)if(item.taskId===next.taskId&&item.tenantId===next.tenantId&&item.enterpriseId===next.enterpriseId)Object.assign(item,structuredClone(next));
    drafts=drafts.filter(item=>item.draftId!==draft.draftId);persist();
    sessionStorage.removeItem(activeKey);AppState.setDirty(false);
    showToast('已模拟按 task/update 更新原任务，并通过 task/get 核对','success');
    RouteRuntime.back({fallback:routeForType(draft.type),refresh:true});
    return true;
  }

  function cancel() {
    const draft = activeDraft();
    if (!draft) return RouteRuntime.back({ fallback: 'home' });
    if(draft.editTaskId){drafts=drafts.filter(item=>item.draftId!==draft.draftId);persist();sessionStorage.removeItem(activeKey);AppState.setDirty(false);RouteRuntime.back({fallback:routeForType(draft.type),refresh:true});return true;}
    if(!saveDraft(true))return false;
    sessionStorage.removeItem(activeKey);
    AppState.setDirty(false);
    RouteRuntime.back({ fallback: routeForType(draft.type), refresh: true });
  }

  function syncImportDrafts(row,customers) {
    const assignedRows=customers||(CustomerTasks.taskExecutionCustomers?CustomerTasks.taskExecutionCustomers(row):CustomerTasks.taskCustomers(row))||[],batchIds=[...new Set(assignedRows.map(r=>r.batchId))];
    row.alictiImportDrafts=batchIds.map(id=>{const items=assignedRows.filter(r=>r.batchId===id),isFollowup=items.every(item=>item.repeatContact?.sourceTaskId===row.taskId);return AliCtiFields.importFields(row,items,{batchId:id,name:items[0]?.batchName||id,isRepeat:isFollowup?0:row.isRepeat??0});});
    AliCtiDemo.imported(row,row.alictiImportDrafts);
  }

  function syncAssignedCustomers() {
    if(!recoverRepeatArrangement())return;
    for(const row of CloudCallData.tasks || []) {
      if(row.customerSourceMode!=='assigned' || !canAccessObject(row) || !['待分配客户','待启动'].includes(row.status))continue;
      const customers=CustomerTasks.taskExecutionCustomers?CustomerTasks.taskExecutionCustomers(row):CustomerTasks.taskCustomers(row);
      if(!customers)continue;
      const total=customers.length;
      row.total=total; row.status=total?'待启动':'待分配客户';
      syncImportDrafts(row,customers);
      persistCreatedTask(row);
    }
    window.AgentWorkbench?.syncReceivingProgress?.();
  }

  function taskById(taskId) {
    if(!recoverRepeatArrangement())return null;
    syncAssignedCustomers();
    return (CloudCallData.tasks || []).find(item => item.taskId === taskId)
      || (CloudCallData.predictiveTasks || []).find(item => item.taskId === taskId)
      || (CloudCallData.ivrTasks || []).find(item => item.taskId === taskId)
      || null;
  }

  function explicitSupplierTaskId(row){
    const id=Number(row?.providerTaskId);
    if(Number.isSafeInteger(id)&&id>0)return id;
    if(row?.simulation===true&&row?.localPrototypeTask===true){const demo=Number(row.demoProviderTaskId);if(Number.isSafeInteger(demo)&&demo>0)return demo;}
    const seed=window.AliCtiDemo?.taskControlSeed?.(row);
    return Number.isSafeInteger(Number(seed?.id))&&Number(seed.id)>0?Number(seed.id):null;
  }
  function canEditTask(row){
    return !!row&&canAccessObject(row)&&!row.displayOnly&&['预外呼','IVR 外呼'].includes(row.callType)&&
      !['已完成','已结束','已终止','已删除'].includes(row.status)&&Number(row.providerStatusCode)!==3&&
      !row.alictiTaskControlPending&&!row.alictiTaskUpdatePending&&!!explicitSupplierTaskId(row);
  }
  function taskEditFingerprint(row){
    return JSON.stringify({taskId:row.taskId,tenantId:row.tenantId,enterpriseId:row.enterpriseId,
      callType:row.callType,providerTaskId:explicitSupplierTaskId(row),status:row.status,
      updatedAt:row.updatedAt||'',planSnapshotId:row.planSnapshotId||'',
      alictiUpdateDraft:row.alictiUpdateDraft?.fields||null});
  }
  function editTask(taskId){
    const row=taskById(taskId);
    if(!canEditTask(row)){showToast('当前任务不可编辑，或供应商任务编号尚未确认','warning');return false;}
    const draft=makeDraft(row.callType),saved=ensureSnapshotObject(row),base=copyTaskValues(row,draft.values);
    draft.tenantId=row.tenantId;draft.enterpriseId=row.enterpriseId;draft.taskId=row.taskId;draft.editTaskId=row.taskId;
    draft.editSupplierTaskId=explicitSupplierTaskId(row);draft.editSourceFingerprint=taskEditFingerprint(row);
    draft.values={...base,name:row.name||'',scheduleMode:saved.scheduleMode||row.scheduleMode||'保存后手工启动',
      scheduleAt:String(saved.scheduleAt||row.scheduleAt||base.scheduleAt).replace(' ','T').slice(0,16),
      stopScheduled:!!saved.stopScheduled,stopAt:saved.stopAt?String(saved.stopAt).replace(' ','T').slice(0,16):'',
      forceEndFlag:saved.forceEndFlag??0,customerIds:[]};
    draft.editOriginalValues=structuredClone(draft.values);
    draft.editOriginalValues.customerClidsGroup=taskCallerSettings(row).customerClidsGroup;
    drafts=drafts.filter(item=>item.editTaskId!==row.taskId);
    drafts.unshift(draft);persist();openWizard(draft);return true;
  }

  function listDraftTasks(type) {
    return drafts.filter(item => !item.editTaskId && !item.repeatPredictive && item.type === type && item.savedAt && canAccessDraft(item)).map(item => ({
      taskId: item.taskId || item.draftId,
      draftId: item.draftId,
      updatedAt: item.savedAt,
      createdAt: item.createdAt,
      tenantId: item.tenantId,
      enterpriseId: item.enterpriseId,
      name: item.values.name || `未命名${typeLabel(type)}任务`,
      callType: type,
      status: '草稿',
      total: 0,
      completed: 0,
      connected: 0,
      planId: item.values.planId,
      planVersion: plan(item.values.planId).publishedVersion || '—',
      planSnapshotId: '',
      listSource: '创建完成后分配客户',
      scheduleAt: item.values.scheduleAt ? item.values.scheduleAt.replace('T', ' ') : '尚未设置',
      retryPolicy: item.values.retryPolicy?structuredClone(item.values.retryPolicy):null,
      owner: AppState.account().name || AppState.profile().label,
      isWizardDraft: true,
      wizardStep: item.step
    }));
  }

  function readCenterContext(options) {
    let saved = {};
    try { saved = JSON.parse(sessionStorage.getItem(centerKey) || '{}'); } catch (error) { saved = {}; }
    const taskId = options?.taskId || saved.taskId || '';
    const tab = centerTabs.some(item => item.key === (options?.tab || saved.tab)) ? (options?.tab || saved.tab) : 'overview';
    if (!canAccessObject(taskById(taskId))) { sessionStorage.removeItem(centerKey); return { taskId: '', tab: 'overview' }; }
    return { taskId, tab };
  }

  function saveCenterContext(taskId, tab) { sessionStorage.setItem(centerKey, JSON.stringify({ taskId, tab })); }

  function openTask(taskId, tab) {
    const draft = drafts.find(item => !item.editTaskId && (item.taskId === taskId || item.draftId === taskId));
    if (draft && draft.status !== '已提交') return start(draft.type, draft.draftId);
    const task = taskById(taskId);
    if (!canAccessObject(task)) return false;
    const current = RouteRuntime.snapshot();
    const options = { taskId, tab: tab || 'overview' };
    if (current?.key === 'cloud-task-center' && current.options?.taskId === taskId) return navigateTo('cloud-task-center', options);
    return RouteRuntime.openSecondary('cloud-task-center', options);
  }

  function setTaskTab(tab) {
    const context = readCenterContext();
    if (!context.taskId || !centerTabs.some(item => item.key === tab)) return;
    saveCenterContext(context.taskId, tab);
    navigateTo('cloud-task-center', { taskId: context.taskId, tab });
  }

  function taskCalls(row) { return (CloudCallData.calls || []).filter(item => item.taskId === row.taskId && item.tenantId === row.tenantId && item.enterpriseId === row.enterpriseId && AppState.authorizeObject('', item)); }
  function percent(row) { return row.total ? Math.round(Number(row.completed || 0) / Number(row.total) * 100) : 0; }

  function centerActions(row) {
    const buttons = [];
    if(row.displayOnly)return '';
    if(!canAccessObject(row))return '';
    if(row.alictiTaskControlPending)buttons.push('<span class="form-help">当前状态待核对；操作前将重新查询任务状态。</span>');
    if(canEditTask(row))buttons.push(`<button class="btn" onclick="CloudTaskWorkspace.editTask('${esc(row.taskId)}')">编辑任务</button>`);
    if (['待分配客户','待启动','异常'].includes(row.status)) buttons.push(`<button class="btn danger" onclick="CloudTaskWorkspace.controlTask('${row.taskId}','terminate')">终止任务</button>`);
    if (canDeleteTask(row)) buttons.push(`<button class="btn danger" onclick="CloudTaskWorkspace.deleteTask('${row.taskId}')">${row.repeatContact?'撤销本次安排':'删除任务'}</button>`);
    if (CustomerTasks.canImportToTask(row)) buttons.push(`<button class="btn btn-primary" onclick="CustomerTasks.importDialog('${row.taskId}')">导入客户</button>`);
    else if (['待分配客户','待启动'].includes(row.status)) buttons.push(`<button class="btn" onclick="CustomerTasks.open()">分配客户</button>`);
    if (row.resourcePause) buttons.push('<span class="form-help">号码停用已阻止新拨号；恢复号码后，待启动任务可启动，执行中任务先暂停再继续。</span>');
    if (row.availabilityPause?.reason==='AVAILABLE_SEATS_BELOW_MIN') buttons.push(`<span class="form-help">可用座席 ${esc(row.availabilityPause.availableAgentCount)} 人，低于设置的 ${esc(row.availabilityPause.threshold)} 人，任务已自动暂停。${Number(row.autoStart)===1?'人数达到设置值后自动启动。':'人数恢复后需手动继续。'}</span>`);
    if (row.status === '待启动') buttons.push(Number(row.autoStart)===1?`<span class="form-help">已设置定时开始：${esc(row.scheduleAt||'按计划时间')}；到点由 AliCti 自动启动。</span>`:`<button class="btn btn-primary" onclick="CloudTaskWorkspace.controlTask('${row.taskId}','start')">启动任务</button>`);
    if (row.status === '执行中') buttons.push(`<button class="btn" onclick="CloudTaskWorkspace.controlTask('${row.taskId}','pause')">暂停任务</button><button class="btn danger" onclick="CloudTaskWorkspace.controlTask('${row.taskId}','terminate')">终止任务</button>`);
    if (row.status === '已暂停') buttons.push(`${row.availabilityPause?.reason==='AVAILABLE_SEATS_BELOW_MIN'&&Number(row.autoStart)===1?'':!row.resourcePause || canRestoreResourceTask(row) ? `<button class="btn btn-primary" onclick="CloudTaskWorkspace.controlTask('${row.taskId}','resume')">${row.resourcePause ? '恢复任务' : '继续任务'}</button>` : '<span class="form-help">号码停用保护中，需有权管理员逐项恢复</span>'}<button class="btn danger" onclick="CloudTaskWorkspace.controlTask('${row.taskId}','terminate')">终止任务</button>`);
    buttons.push(`<button class="btn" onclick="CloudTaskWorkspace.copyTask('${row.taskId}')">复制任务</button>`);
    return buttons.join('');
  }

  function centerContinue(row) {
    if (!['待分配客户','待启动'].includes(row.status)) return '';
    if (row.status==='待启动'&&Number(row.autoStart)===1) return `<div class="task-continue-card"><div><strong>等待定时开始</strong><span>${esc(row.scheduleAt||'计划时间')}由 AliCti 自动启动；座席不足时按设置自动暂停。</span></div></div>`;
    let title,action,label;
    if (row.status === '待分配客户') {
      if(CustomerTasks.canImportToTask(row)){title='请导入本次要联系的客户';action="CustomerTasks.importDialog('"+row.taskId+"')";label='导入客户';}
      else {title='请分配本次要联系的客户';action='CustomerTasks.open()';label='分配客户';}
    } else {
      title=row.alictiTaskControlPending?'任务状态待核对':'任务已准备好，可以启动';
      action=`CloudTaskWorkspace.controlTask('${row.taskId}','start')`;label='启动任务';
    }
    return `<div class="task-continue-card"><div><strong>${esc(title)}</strong></div><button class="btn btn-primary" onclick="${action}">${esc(label)}</button></div>`;
  }

  function centerOverview(row) {
    const calls=taskCalls(row),answered=calls.filter(item=>CallState.view(item).answered===true).length,unknown=calls.filter(item=>!CallState.view(item).known).length;
    const availabilityDemo=row.callType==='预外呼'&&row.simulation===true&&row.localPrototypeTask===true&&
      ['执行中','已暂停'].includes(row.status)&&canAccessObject(row)?
      `<details class="technical-details"><summary>演示座席人数变化</summary><p>仅模拟供应商按可用座席数自动暂停或恢复任务，不更改实际坐席状态。</p><label>观察到的可用座席数 <input id="task-available-seats" type="number" min="0" step="1" value="${esc(row.availabilityPause?.availableAgentCount??row.minAvailableAgentCount??10)}"></label><button type="button" class="btn" onclick="CloudTaskWorkspace.simulateAvailability('${esc(row.taskId)}')">应用演示人数</button></details>`:'';
    return `${centerContinue(row)}<div class="task-center-grid"><article class="panel-card span-12"><div class="panel-header"><h2>运行概览</h2>${ui.help('完成进度按本任务呼叫名单条数统计，通话结果按已取得的通话记录统计；再次联系安排单独计入名单。','运行概览统计口径')}</div><div class="panel-body"><div class="task-progress-hero"><div><span>完成进度</span><strong>${percent(row)}%</strong><small>${row.completed||0} / ${row.total||0}</small></div><div class="progress-track"><i style="width:${percent(row)}%"></i></div><div class="task-stat-strip"><div><span>已接通</span><strong>${answered}</strong></div><div><span>通话记录</span><strong>${calls.length}</strong></div><div><span>结果待确认</span><strong>${unknown}</strong></div></div></div>${availabilityDemo}</article></div>`;
  }
  function simulateAvailability(taskId){
    const row=taskById(taskId),value=document.getElementById('task-available-seats')?.value;
    if(!row||!canAccessObject(row)||!/^\d+$/.test(String(value??'').trim())){showToast('请填写非负整数的可用座席数','warning');return false;}
    const result=window.AliCtiAdapter?.reconcileAvailability?.(row,Number(value));
    if(result?.changed){showToast(result.message,'success');RouteRuntime.refreshCurrent?.();return true;}
    showToast(result?.reason==='no-transition'?'当前人数不会触发任务状态变化':'未能应用可用座席人数，请核对任务状态','warning');
    return false;
  }

  function customerRows(row) {
    const count = Math.min(Math.max(Number(row.total || 0), 1), 8);
    const completed = Number(row.completed || 0);
    return Array.from({ length: count }, (_, index) => {
      const done = index < Math.min(completed, count);
      return { customerId: `${row.taskId}-C${String(index + 1).padStart(3, '0')}`, batchItemId: `${String(row.listSource || 'SRC').split(' ').at(-1)}-${String(index + 1).padStart(3, '0')}`, phone: `13${index + 1}****${String(6210 + index).slice(-4)}`, status: done ? '已呼叫，结果待确认' : '待呼叫', attempt: '待返回' };
    });
  }

  function centerCustomers(row) {
    const customers=window.CustomerTasks?.taskCustomers(row)||[];
    const assigned=window.CustomerTasks?.sortRowsForDisplay?.(customers)||ui.sortByUpdated?.(customers)||customers;
    if(row.customerSourceMode==='assigned'||assigned.length)return `<article class="panel-card"><div class="panel-header"><h2>本任务呼叫名单 · ${assigned.length} 条 ${ui.help(row.callType==='预外呼'?'名单条数包含本任务的再次联系安排，不代表去重客户数；暂停任务继续后才会呼叫。':'按已分配到本任务的客户名单统计。','名单数量说明')}</h2>${window.RepeatPredictive?.taskToolbar(row)||''}</div><div class="panel-body">${ui.table([{key:'name',label:'客户称呼'},{key:'phone',label:'客户号码'},...(row.callType==='预外呼'?[{key:'repeatContact',label:'联系轮次',render:meta=>'第 '+(meta?.businessContactNo||1)+' 次'}]:[]),...customerBusinessColumns(),{key:'batchName',label:'来源批次'},{key:'note',label:'联系备注'},{key:'calls',label:'最近通话结果',render:calls=>esc(calls?.length?CallState.view(calls.at(-1)).answerLabel:'未呼叫')},...(row.callType==='预外呼'&&window.RepeatPredictive?[{key:'id',label:'操作',render:(_,customer)=>RepeatPredictive.rowAction(row,customer)}]:[])],assigned)}</div></article>`;
    return `<article class="panel-card"><div class="panel-header"><div><h2>客户数据</h2><p>${esc(row.listSource)} · 共 ${row.total} 条，仅展示前 ${Math.min(row.total, 8)} 条记录</p></div><button class="btn" onclick="doExport(event)">导出当前结果</button></div><div class="panel-body no-padding">${ui.table([{key:'batchItemId',label:'批次客户编号'},{key:'phone',label:'客户号码'},{key:'status',label:'执行状态',render:v=>ui.status(v)},{key:'attempt',label:'已呼叫次数'}],customerRows(row))}</div></article>`;
  }

  function savedCallPriority(value) {
    if(typeof value!=='string')return null;
    try{
      const parsed=JSON.parse(value),entries=parsed?.strategy;
      if(!Array.isArray(entries)||entries.length!==2)return null;
      const retry=entries.find(item=>item?.type==='retryCall'),first=entries.find(item=>item?.type==='firstCall');
      if(!retry||!first||![1,2].includes(retry.sort)||![1,2].includes(first.sort)||retry.sort===first.sort||![0,1].includes(retry.desc)||![0,1,2].includes(first.orderType))return null;
      return {retryFirst:retry.sort<first.sort,retryDesc:retry.desc,firstCallOrderType:first.orderType};
    }catch(_){return null;}
  }
  function ensureSnapshotObject(row) {
    // Only saved values of this task may fill an older incomplete snapshot.
    // A shared template or current skill membership is not execution evidence.
    const saved=row.planSnapshot||{},config=row.executionConfig||{},request=row.alictiCreateDraft?.fields||{};
    const pick=key=>[saved,row,request,config].find(source=>Object.hasOwn(source,key)&&source[key]!==undefined)?.[key];
    const ids=Array.isArray(saved.callerNumberIds)?saved.callerNumberIds:row.callerNumberId?[row.callerNumberId]:config.allowedCallerNumberIds||[];
    const cnos=pick('cnos'),agentGroup=pick('agentGroup');
    return {
      snapshotId:row.planSnapshotId||'',
      ...taskCallerSettings(row),
      callerNumberIds:taskCallerSettings(row).callerMode==='navigation'?[]:ids,callerNumberText:pick('callerNumberText'),
      contactFlowId:pick('contactFlowId')??'',contactFlowName:pick('contactFlowName'),
      providerIvrId:pick('providerIvrId')??request.ivrId??'',
      skillGroupId:saved.skillGroupId??row.targetSkillGroupId??config.targetSkillGroupId??'',
      executionQueueId:pick('executionQueueId')??'',transferEnabled:pick('transferEnabled')??false,
      ...(row.callType==='预外呼'?{
        callStrategy:taskCallStrategy(row),
        callGroupType:pick('callGroupType')??(cnoValues(cnos).length?1:agentGroup?2:null),
        cnos:cnos??'',agentSelectionSnapshot:pick('agentSelectionSnapshot'),agentGroup:agentGroup??'',outboundGroupId:pick('outboundGroupId')??'',
        outboundGroupSnapshot:pick('outboundGroupSnapshot'),minAvailableAgentCount:pick('minAvailableAgentCount')
      }:{}),
      ...timeProperties(taskTimeSource(row)),
      scheduleMode:pick('scheduleMode')??(pick('autoStart')===1?'定时执行':pick('autoStart')===0||row.scheduleAt==='手工启动'?'保存后手工启动':null),
      scheduleAt:pick('scheduleAt')??'',stopScheduled:pick('stopScheduled')??Number(pick('autoStop'))===1,
      stopAt:pick('stopAt')??'',autoComplete:pick('autoComplete'),isRepeat:pick('isRepeat'),retryPolicy:pick('retryPolicy'),
      description:pick('description'),businessTagNames:pick('businessTagNames'),
      forceEndFlag:pick('forceEndFlag'),retryStrategyOnlyToday:pick('retryStrategyOnlyToday'),
      callPriority:pick('callPriority')??savedCallPriority(request.callPriorityStrategy),concurrency:pick('concurrency'),
      ...(row.callType==='预外呼'?{
        callRouteStrategy:pick('callRouteStrategy'),agentTimeout:pick('agentTimeout'),
        wrapup:pick('wrapup'),maxWaitTime:pick('maxWaitTime'),quotiety:pick('quotiety'),
        predictAdjust:pick('predictAdjust'),answerRate:pick('answerRate'),
        warmUpDuration:pick('warmUpDuration'),isRewarm:pick('isRewarm')
      }:{}),
      frozenAt:saved.frozenAt||''
    };
  }

  function centerResources(row) {
    const v=ensureSnapshotObject(row),predictive=row.callType==='预外呼',resources=resourceSummary(v,row,true);
    const identity=[['任务名称',row.name],['所属组织',tenant(row.tenantId).name||'未记录']];
    const card=(title,items)=>`<article class="panel-card span-12 task-settings-card"><div class="panel-header"><h2>${esc(title)}</h2></div><div class="panel-body"><dl class="detail-grid">${items.map(([label,value])=>`<dt>${esc(label)}</dt><dd>${esc(value)}</dd>`).join('')}</dl></div></article>`;
    const start=v.scheduleMode==='定时执行'?String(v.scheduleAt||'未记录').replace('T',' '):v.scheduleMode==='保存后手工启动'?'准备好后手动开始':row.scheduleAt||'未记录';
    return `<div class="task-center-grid task-settings">
      ${card('任务与客户',[...(predictive?identity:[]),['客户名单',Number(row.total)?`已添加 ${row.total} 条`:'尚未添加'],['重复号码',v.isRepeat==null?'未记录':duplicateLabel(v.isRepeat)],...(predictive?taskSettingsSummary(v,row.callType,true).slice(0,2):[])])}
      ${card(predictive?'接听团队配置':'任务与语音流程',predictive?resources:[...identity,...taskSettingsSummary(v,row.callType,true).slice(0,2),...resources])}
      ${card('时间与重呼',[...(predictive?[]:callerSummary(v,row)),['开始时间',start],['结束时间',v.stopScheduled?String(v.stopAt||'未记录').replace('T',' '):'未设置'],...timeSummary(taskTimeSource(row),row.tenantId,true),...retrySummaryRows(v,row.callType),...taskSettingsSummary(v,row.callType,true).slice(2)])}
    </div>`;
  }

  function executionEvents(row) {
    const rows = [{ title: '名单接收并校验', time: row.createdAt || row.scheduleAt || '历史记录', detail: `${row.listSource} · ${row.total} 条` }];
    if (row.planSnapshotId) rows.push({ title: '任务设置已确认', time: row.startedAt || row.scheduleAt, detail: '按本任务保存的设置执行' });
    if (row.campaignId) rows.push({ title: '执行任务已开始', time: row.startedAt || row.scheduleAt, detail: row.callType });
    if (row.status === '执行中') rows.push({ title: row.alictiTaskControlPending?'任务状态待核对（最后已知为执行中）':'任务执行中', time: '当前', detail: `${row.completed}/${row.total} 已完成；已加载通话 ${taskCalls(row).filter(call => CallState.view(call).answered === true).length} 次接通，${taskCalls(row).filter(call => !CallState.view(call).known).length} 次待确认` });
    if (row.status === '已暂停') rows.push({ title: row.alictiTaskControlPending?'暂停状态待核对':'任务已暂停', time: row.updatedAt || '当前', detail: '继续前重新核对暂停状态；结束后不重新开启' });
    if (row.status === '已完成') rows.push({ title: '任务已完成', time: row.updatedAt || row.scheduleAt, detail: `${row.completed}/${row.total} 已完成` });
    if (row.status === '已终止') rows.push({ title: '任务已终止', time: row.updatedAt || '当前', detail: '不再发起新呼叫或重呼；保留已产生的通话与结果' });
    return rows;
  }

  function centerExecution(row) {
    return `<article class="panel-card"><div class="panel-header"><div><h2>执行明细</h2><p>按时间查看名单检查、开始、暂停和完成</p></div>${ui.help(row.callType === '预外呼' ? '暂停后可继续同一任务；确认结束后不再发起新呼叫或重呼。已发起的通话正常继续。' : '自动语音任务按客户逐条更新执行状态。')}</div><div class="panel-body">${ui.timeline(executionEvents(row))}</div></article>`;
  }

  function centerCalls(row) {
    const source = window.CloudCallRecords ? (CloudCallData.calls||[]).filter(call=>AppState.authorizeObject('',call)&&CloudCallRecords.relatedTask(call)?.taskId===row.taskId) : taskCalls(row);
    const detail=call=>window.CloudCallRecords?.display(call);
    const calls=ui.sortByUpdated?.(source,call=>{const data=detail(call);return data?[data.endAt,data.startAt]:[call.endedAt,call.ringingAt,call.recordedAt];})||source;
    const columns = [
      {key:'callId',label:'通话编号',render:value=>`<button class="table-link" onclick="window.Pages['cloud-call-records'].openCall('${value}')"><strong>${esc(value)}</strong></button>`},
      {key:'callee',label:'客户号码',render:(_,item)=>esc(detail(item)?.customerNumber||item.callee||'未记录')},
      {key:'agentName',label:'坐席 / 工号',render:(_,item)=>esc(detail(item)?.agentText||item.agentName||'未记录')},
      {key:'answeredAt',label:'客户接通时间',render:(_,item)=>{const data=detail(item),at=data?data.customerAt:CallState.view(item).customerEstablishedAt;return esc(at?new Date(at).toLocaleString('sv-SE'):'未记录');}},
      {key:'durationSeconds',label:row.callType==='IVR 外呼'?'客户接听时长':'双方通话时长',render:(_,item)=>window.CloudCallRecords?CloudCallRecords.formatDuration(detail(item).durationSeconds):item.durationSeconds==null?'未记录':esc(item.durationSeconds)},
      {key:'result',label:'客户接通结果',render:(_,item)=>ui.status(detail(item)?.resultLabel||CallState.view(item).answerLabel)},
      {key:'result',label:'号码状态',render:(_,item)=>esc(detail(item)?.state.numberStatus.label||CallState.view(item).reasonLabel)},
      {key:'recordingStatus',label:'录音',render:(_,item)=>ui.status(CloudCallMedia.resolve(item).status)},
    ];
    return `<article class="panel-card"><div class="panel-header"><div><h2>任务通话记录</h2></div><div><span>${calls.length} 条</span><button class="btn-link" onclick="CloudCallRecords.openFromTask('${row.taskId}','calls','records')">在通话记录中查看</button></div></div><div class="panel-body no-padding">${ui.table(columns,calls,{emptyText:'当前任务尚未产生通话，启动执行后在这里查看'})}</div></article>`;
  }

  function centerResults(row) {
    const calls=taskCalls(row),known=calls.filter(call=>CallState.view(call).known),pending=calls.filter(call=>!CallState.view(call).known);
    return `<div class="task-center-grid"><article class="panel-card span-12"><div class="panel-header"><h2>通话结果</h2><button class="btn-link" onclick="CloudCallRecords.openFromTask('${row.taskId}','results','records')">查看通话明细</button></div><div class="panel-body"><div class="kpi-grid">${ui.kpi('通话记录',calls.length,'')}${ui.kpi('已确认结果',known.length,'已确认接通或未接通')}${ui.kpi('结果待确认',pending.length,'尚未取得明确接听结果')}</div></div></article></div>`;
  }

  function centerBody(row, tab) {
    if (tab === 'customers') return centerCustomers(row);
    if (tab === 'resources') return centerResources(row);
    if (tab === 'execution') return centerExecution(row);
    if (tab === 'overview') return centerOverview(row) + OperationsMonitor.taskPanel(row);
    if (tab === 'calls') return centerCalls(row);
    if (tab === 'results') return centerResults(row);
    return centerOverview(row);
  }

  function renderCenter(options) {
    const context = readCenterContext(options);
    const row = taskById(context.taskId);
    if (!row || !AppState.authorizeObject('', row)) return `<section class="platform-page">${ui.pageHeader('任务中心', '未找到当前权限范围内的任务。')}<div class="panel-card"><div class="panel-body">${ui.empty('请从预外呼或自动外呼任务列表进入')}</div></div></section>`;
    saveCenterContext(row.taskId, context.tab);
    const currentJourneyStage = context.tab === 'calls' ? 'records' : context.tab === 'results' ? 'results' : 'monitor';
    const journeyActions = {
      prepare: `ScenarioReadiness.open('${row.callType === '预外呼' ? 'PREDICTIVE' : 'IVR_OUTBOUND'}','${row.tenantId}')`,
      create: `RouteRuntime.openSecondary('${routeForType(row.callType)}')`,
      monitor: `CloudTaskWorkspace.openTask('${row.taskId}','overview')`,
      records: `CloudCallRecords.openFromTask('${row.taskId}','${context.tab}','records')`,
      results: `CloudTaskWorkspace.setTaskTab('results')`
    };
    return `<section class="platform-page cloud-task-center">
      ${ui.pageHeader(`${typeLabel(row.callType)}任务详情`, `${esc(tenant(row.tenantId).name || '当前租户')} · 负责人 ${esc(row.owner || '—')}`, `<button class="btn" onclick="RouteRuntime.back({fallback:'${routeForType(row.callType)}'})">返回</button>${centerActions(row)}`)}
      ${ui.journey({ current: currentJourneyStage, context: `${row.name} · ${row.alictiTaskControlPending?'状态待核对':row.status}`, branch: '当前任务范围', actions: journeyActions })}
      <div class="task-center-hero"><div><span>任务名称</span><h2>${esc(row.name)}</h2></div><div><span>任务状态</span>${ui.status(row.alictiTaskControlPending?'待确认':row.status)}${row.alictiTaskControlPending?`<strong>状态待核对</strong><small>最后已知：${esc(row.status)}</small>`:''}${row.stopNewDialing?'<small>已停止发起新呼叫</small>':''}</div><div><span>执行时间</span><strong>${esc(row.scheduleAt || '—')}</strong><small>${row.startedAt ? `实际启动 ${esc(row.startedAt)}` : '实际启动后记录'}</small></div><div><span>当前进度</span><strong>${percent(row)}%</strong><small>${row.completed || 0} / ${row.total || 0}</small></div></div>
      <div class="task-center-tabs">${centerTabs.map(item=>`<button class="${item.key===context.tab?'active':''}" onclick="CloudTaskWorkspace.setTaskTab('${item.key}')">${item.label}${item.key==='calls'?` <span>${taskCalls(row).length}</span>`:''}</button>`).join('')}</div>
      <div class="task-center-body">${centerBody(row, context.tab)}</div>
    </section>`;
  }


  function freezePlan(row,selectedPlan,at){
    const times=timeProperties(taskTimeSource(row)),latest=AliCtiFields.taskTimeFields(times,row.tenantId);
    if(!latest.ok)return false;
    row.planSnapshotId=CloudResourceRules.id('SNAP');
    row.planSnapshot={...structuredClone(ensureSnapshotObject(row)),...times,timeConditionSnapshot:structuredClone(latest.snapshot||[]),snapshotId:row.planSnapshotId,planId:row.planId,planName:selectedPlan.name,planVersion:row.planVersion||selectedPlan.publishedVersion,frozenAt:at};
    return true;
  }
  function dependencyError(row,checkReadiness){
    const retryIssue=(row.retryPolicy||row.localPrototypeTask)?AliCtiRetryEditor.issue(row.retryPolicy,row.callType,row.retryEditor):null;if(retryIssue)return retryIssue.message;
    const selected=row.executionConfig||plan(row.planId);
    const timing=AliCtiFields.taskTimeFields({...timeProperties(taskTimeSource(row)),stopScheduled:row.stopScheduled??false,stopAt:row.stopAt||'',scheduleMode:row.autoStart===1?'定时执行':'保存后手工启动',scheduleAt:String(row.scheduleAt||'').replace(' ','T')},row.tenantId);
    if(!timing.ok)return timing.message;
    if(!selected.callPlanId||selected.status!=='已发布')return '执行方案不存在或已停用';
    if(selected.tenantId!==row.tenantId||selected.enterpriseId!==row.enterpriseId||selected.callType!==row.callType)return '任务与方案的租户、品牌或呼叫方式不一致';
    const snap=row.planSnapshot,numberIds=snap?.callerNumberIds||(row.callerNumberId?[row.callerNumberId]:selected.allowedCallerNumberIds);
    const caller=taskCallerSettings(row),callerCheck=AliCtiFields.validateCallerSettings(caller,{...callerPoolValidation(row),requireCallerNumber:false});if(!callerCheck.ok)return callerCheck.message;
    if(caller.callerMode==='navigation'&&!callerNavigationOptions(row).some(item=>item.customerClidsGroup===caller.customerClidsGroup))return '本任务保存的外显导航已不在当前账号中，请先编辑任务并重新选择';
    if(caller.callerMode!=='navigation'&&(!numberIds?.length||!numberIds.every(id=>selected.allowedCallerNumberIds.includes(id))))return '所选号码不在方案允许范围内';
    if(!snap&&selected.supersededBy)return '该版本已被新版替代，请重新选择当前方案';
    if(!row.executionConfig&&!snap&&row.targetSkillGroupId!==undefined&&((row.targetSkillGroupId||'')!==(selected.targetSkillGroupId||'')||(row.contactFlowId||'')!==(selected.contactFlowId||'')||!!row.transferEnabled!==!!selected.transferEnabled))return '任务不能覆盖方案的团队、流程或转人工规则，请重新选择方案';
    const effective={...selected,...caller,allowedCallerNumberIds:caller.callerMode==='navigation'?[]:numberIds,targetSkillGroupId:snap?snap.skillGroupId:selected.targetSkillGroupId,executionQueueId:snap?snap.executionQueueId:selected.executionQueueId,contactFlowId:snap?snap.contactFlowId:selected.contactFlowId,providerIvrId:snap?.providerIvrId||selected.providerIvrId||row.providerIvrId||'',transferEnabled:snap?snap.transferEnabled:selected.transferEnabled};
    const error=CloudResourceRules.validatePlan(effective,true);if(error)return error;
    if(row.callType==='预外呼'&&window.OutboundGroups){
      const obgErr=window.OutboundGroups.executionError(row);
      if(obgErr)return obgErr;
    }
    if(checkReadiness){const readiness=ScenarioReadiness.calculate(row.tenantId,row.callType==='预外呼'?'PREDICTIVE':'IVR_OUTBOUND',row);if(readiness.status!=='AVAILABLE')return '场景当前为'+readiness.statusLabel+'，请完成配置与验证';}
    return '';
  }
  function canRestoreResourceTask(row) {
    return canAccessObject(row) && ['SUPER_ADMIN', 'ADMIN'].includes(AppState.effectiveAccess().roleCode) && AppState.canAction('task.resume');
  }

  // Local simulation only: stop future dialing for tasks that actually use the
  // number. Never rewrite calls, counters, campaigns or historical snapshots.
  function pauseForNumber(numberId) {
    const resource = number(numberId);
    if (!AppState.effectiveAccess().valid || !AppState.isSuper() || !AppState.canMenu('resources.numbers') || !resource || resource.enterpriseId !== AppState.get().enterpriseId || (resource.businessStatus !== '已隔离' && resource.localEnabled !== false)) return 0;
    let affected = 0, storageFailed = false;
    for (const row of CloudCallData.tasks) {
      if (row.enterpriseId !== resource.enterpriseId || !['预外呼', 'IVR 外呼'].includes(row.callType) || !['执行中', '待启动', '已暂停'].includes(row.status)) continue;
      const ids = row.planSnapshot?.callerNumberIds || (row.callerNumberId ? [row.callerNumberId] : plan(row.planId).allowedCallerNumberIds || []);
      if (!ids.includes(numberId)) continue;
      const previous = row.resourcePause;
      row.resourcePause = { previousStatus: previous?.previousStatus || row.status, numberIds: [...new Set([...(previous?.numberIds || []), numberId])], pausedAt: previous?.pausedAt || nowText(), reason: resource.localEnabled === false ? '号码本地使用已停用' : 'AliCti 号码已停用（本地保护）' };
      delete row.availabilityPause;
      // Resource isolation is a local hold, not evidence of supplier status=2.
      row.stopNewDialing = true; row.updatedAt = nowText();
      try { persistCreatedTask(row); } catch (_) { storageFailed = true; }
      affected++;
    }
    if (storageFailed) showToast('号码已停用，任务保护状态未能完整保存；请刷新后核对关联任务。','warning');
    return affected;
  }

  function controlTask(taskId, action, confirmed) {
    const row = taskById(taskId);
    if(row?.displayOnly)return showToast('这是展示样例，请通过“导入与分配”中的模块联动演示测试执行','info');
    if(!canAccessObject(row))return;
    return window.AliCtiAdapter?.controlTask(row,action,confirmed);
  }

  function canDeleteTask(row){return canAccessObject(row)&&['SUPER_ADMIN','ADMIN'].includes(AppState.effectiveAccess().roleCode)&&!row.displayOnly&&!row.providerTaskId&&!row.startedAt&&!row.campaignId&&!Number(row.completed)&&['草稿','待分配客户','待启动','已终止'].includes(row.status)&&!(CloudCallData.calls||[]).some(c=>c.taskId===row.taskId);}
  function deleteTask(id,confirmed=false){
    const draft=drafts.find(d=>d.draftId===id||d.taskId===id),row=draft&&canAccessDraft(draft)?draft:taskById(id),isDraft=row===draft;
    if(!row||!(isDraft?canAccessDraft(row):canDeleteTask(row)))return showToast('仅管理员可删除尚未提交供应商、未启动且无通话记录的任务','warning');
    const repeat=!!(row.repeatContact||row.repeatPredictive);
    if(!confirmed)return ui.confirm({id:'task-delete',title:repeat?'撤销本次安排':'删除任务',danger:true,body:'<p>确认'+(repeat?'撤销':'删除')+'“'+esc(isDraft?row.values.name||'未命名任务':row.name)+'”？'+(repeat?'本次再次联系安排将撤销，原客户与通话历史保留。':'此操作不可恢复。客户本身不会删除；正式关联的客户将返回待分配，草稿预选不占用客户。')+'</p>',confirmText:repeat?'确认撤销':'确认删除',onConfirm(){deleteTask(id,true);}});
    if(isDraft){drafts=drafts.filter(d=>d!==draft);persist();}
    else {if(!CustomerTasks.releaseUnstartedTask(row))return showToast('客户已有通话或释放失败，未删除任务','warning');row.status='已删除';row.deletedAt=nowText();persistCreatedTask(row);removeListedTask(row.taskId);}
    CloudCallRuntime.addAudit?.('删除未启动任务',row.taskId||row.draftId,row.tenantId,'未启动','已删除');clearActiveContext();showToast(repeat?'本次再次联系安排已撤销，原客户与通话历史保留':'任务已删除，客户保留并返回待分配','success');ui.closeLayer('task-delete');if(['cloud-task-center','cloud-task-create'].includes(RouteRuntime.snapshot()?.key))RouteRuntime.back({fallback:routeForType(row.callType||row.type),refresh:true});else navigateTo(routeForType(row.callType||row.type));
  }

  function copyTaskValues(row,base) {
    const v=ensureSnapshotObject(row),savedCaller=taskCallerSettings(row);
    const copiedCaller=callerFromAccount(row,savedCaller);
    return {...base,...timeProperties(taskTimeSource(row)),...copiedCaller,
      name:`复制-${row.name}`.slice(0,49),description:v.description??'',businessTagNames:v.businessTagNames??'',
      scheduleMode:base.scheduleMode,scheduleAt:base.scheduleAt,
      stopScheduled:false,stopAt:'',
      autoComplete:v.autoComplete??base.autoComplete,forceEndFlag:0,
      retryStrategyOnlyToday:v.retryStrategyOnlyToday??0,
      callPriority:structuredClone(v.callPriority||base.callPriority),concurrency:v.concurrency??base.concurrency,
      total:0,planId:row.planId||'',skillGroupId:v.skillGroupId,
      callerNumberId:'',
      contactFlowId:v.contactFlowId,contactFlowName:v.contactFlowName,providerIvrId:v.providerIvrId,executionQueueId:v.executionQueueId,
      transferEnabled:!!v.transferEnabled,
      retryPolicy:v.retryPolicy?structuredClone(v.retryPolicy):AliCtiRetry.create(row.callType),isRepeat:v.isRepeat??0,
      ...(row.callType==='预外呼'?{
        minAvailableAgentCount:v.minAvailableAgentCount??'',callStrategy:v.callStrategy,
        callGroupType:v.callGroupType,cnos:Number(v.callGroupType)===2?[]:cnoValues(v.cnos),
        outboundGroupId:v.outboundGroupId,outboundGroupSnapshot:structuredClone(v.outboundGroupSnapshot),agentGroup:v.agentGroup,
        callRouteStrategy:v.callRouteStrategy??1,agentTimeout:v.agentTimeout??10,
        wrapup:v.wrapup??30,maxWaitTime:v.maxWaitTime??40,quotiety:v.quotiety??1,
        predictAdjust:v.predictAdjust??100,answerRate:v.answerRate??50,
        warmUpDuration:v.warmUpDuration??300,isRewarm:v.isRewarm??1
      }:{}),sourceRef:''};
  }

  function copyTask(taskId) {
    const row = taskById(taskId);
    if (!canAccessObject(row)) return;
    const copied = makeDraft(row.callType);
    copied.tenantId = row.tenantId;
    copied.enterpriseId = row.enterpriseId;
    copied.step = row.callType==='IVR 外呼'?4:2;copied.furthestIndex=0;
    copied.values = copyTaskValues(row,copied.values);
    if(row.callType==='IVR 外呼'){copied.values.transferEnabled=false;copied.values.skillGroupId='';copied.values.executionQueueId='';}
    drafts.unshift(copied); persist();
    showToast('已复制任务配置；客户需重新分配', 'success');
    openWizard(copied);
  }

  window.addEventListener('app:save-draft', function (event) { if (activeDraft()&&!saveDraft(true)) event.preventDefault(); });
  window.addEventListener('wizard:configuration-complete', function (event) {
    const draft = activeDraft();
    if (!draft || event.detail?.returnOptions?.draftId !== draft.draftId) return;
    showToast(`${event.detail.requirementLabel || '配置'}已记录变更，提交时会重新校验`, 'warning');
  });

  window.CloudTaskWorkspace = { addCallerPool,updateCallerPool,removeCallerPool,setCallerNavigation,renderTaskSettings:centerResources, refreshIvrList,deleteTask,canDeleteTask,canEditTask,editTask,centerActions,setCustomerMode,filterCustomers,toggleCustomer,clearCustomers,selectFilteredCustomers,start,startRepeatPredictive, render, update, updatePriority, setTimeMode, toggleTimeCondition, changeRetryCount, adjustRetryCount, changeRetryInterval, setRetryLayout, resetRetry, setRetryMode, setRetryTimeType, toggleRetryCode, addRetryRound, removeRetryRound, updateRetryRound, setTenant, selectPlan, setResource, toggleAgent, toggleAllAgents, saveDraft, next, previous, goStep, goConfigure, submit, cancel, listDraftTasks, openTask, renderCenter, setTaskTab, controlTask, simulateAvailability, copyTask, clearActiveContext, pauseForNumber, syncAssignedCustomers,
    isLocalSimulationTask(row){return !!row&&row.localPrototypeTask===true&&row.simulation===true&&row.customerSourceMode==='assigned'&&!row.displayOnly&&createdTasks.some(t=>t.taskId===row.taskId&&t.localPrototypeTask===true&&t.tenantId===row.tenantId&&t.enterpriseId===row.enterpriseId&&t.callType===row.callType);},
    saveDemoTask(row,{confirmedInitialStart=false}={}){
      if(!canAccessObject(row)||!row.simulation)return false;
      if(confirmedInitialStart&&row.status==='执行中'&&!row.alictiTaskControlPending&&!row.planSnapshot&&!row.planSnapshotId&&!freezePlan(row,row.executionConfig||plan(row.planId),row.startedAt||nowText()))return false;
      persistCreatedTask(row);return true;
    },
    simulationResourceError(row,checkReadiness=false){return canAccessObject(row)?dependencyError(row,checkReadiness):'当前无权操作此任务';},
    canControlTask(row){return canAccessObject(row)&&!row.displayOnly;}
  };
  window.Pages = window.Pages || {};
  window.Pages['cloud-task-workspace'] = { render, init() {},
    captureNavigationState(){return {draftId:activeId(),dirty:AppState.get().hasUnsavedChanges};},
    restoreNavigationState(state){if(!state)return;if(state.draftId)sessionStorage.setItem(activeKey,state.draftId);else sessionStorage.removeItem(activeKey);AppState.setDirty(state.dirty);}
  };
  window.Pages['cloud-task-center'] = { render: renderCenter, init() {},
    captureNavigationState(){return sessionStorage.getItem(centerKey);},
    restoreNavigationState(state){if(state)sessionStorage.setItem(centerKey,state);else sessionStorage.removeItem(centerKey);}
  };
})();
