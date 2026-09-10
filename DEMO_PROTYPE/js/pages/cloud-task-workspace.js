/** 预外呼 / IVR 外呼统一六步任务创建工作区。 */
(function () {
  'use strict';

  const ui = PlatformUI;
  const esc = ui.escape;
  const storageKey = 'cloud-task-wizard-drafts-v1';
  const activeKey = 'cloud-task-wizard-active-v1';
  const createdTasksKey = 'cloud-task-created-v1';
  const centerKey = 'cloud-task-center-context-v1';
  const steps = ['前置检查', '基本信息', '客户数据', '资源与策略', '执行时间', '确认提交'];
  const centerTabs = [
    { key: 'overview', label: '运行监控' },
    { key: 'customers', label: '客户数据' },
    { key: 'resources', label: '资源与策略' },
    { key: 'execution', label: '执行明细' },
    { key: 'calls', label: '通话记录' },
    { key: 'results', label: '结果及异常' }
  ];
  let drafts = loadDrafts();
  let createdTasks = loadCreatedTasks();

  function loadDrafts() {
    try { const rows = JSON.parse(sessionStorage.getItem(storageKey) || '[]'); return Array.isArray(rows) ? rows.filter(item => item && item.values && typeof item.values === 'object' && ['预外呼', 'IVR 外呼'].includes(item.type)) : []; }
    catch (error) { return []; }
  }

  function loadCreatedTasks() {
    try { const rows = JSON.parse(sessionStorage.getItem(createdTasksKey) || '[]'); return Array.isArray(rows) ? rows.filter(item => item && item.taskId && ['预外呼', 'IVR 外呼'].includes(item.callType)) : []; }
    catch (error) { return []; }
  }

  createdTasks.forEach(row => {
    const target = row.callType === '预外呼' ? CloudCallData.predictiveTasks : CloudCallData.ivrTasks;
    const existing = CloudCallData.tasks.find(item => item.taskId === row.taskId) || target.find(item => item.taskId === row.taskId);
    // Seed tasks may also have been paused. Restore their saved state in place,
    // while refusing a saved row that changes an existing task's ownership.
    if (existing && ['tenantId', 'instanceId', 'callType'].some(key => existing[key] !== row[key])) return;
    const restored = existing ? Object.assign(existing, row) : row;
    const typed = target.find(item => item.taskId === row.taskId);
    if (typed) Object.assign(typed, restored); else target.unshift(restored);
    const listed = CloudCallData.tasks.find(item => item.taskId === row.taskId);
    if (listed) Object.assign(listed, restored); else CloudCallData.tasks.unshift(restored);
  });

  function removeListedTask(id){for(const list of [CloudCallData.tasks,CloudCallData.predictiveTasks,CloudCallData.ivrTasks])for(let n=list.length-1;n>=0;n--)if(list[n].taskId===id)list.splice(n,1);}
  createdTasks.filter(r=>r.status==='已删除').forEach(r=>removeListedTask(r.taskId));

  function persist() { sessionStorage.setItem(storageKey, JSON.stringify(drafts)); }
  function persistCreatedTask(row) {
    const index = createdTasks.findIndex(item => item.taskId === row.taskId);
    if (index >= 0) createdTasks[index] = JSON.parse(JSON.stringify(row));
    else createdTasks.unshift(JSON.parse(JSON.stringify(row)));
    sessionStorage.setItem(createdTasksKey, JSON.stringify(createdTasks));
    window.ScenarioDemo?.saveTask(row);
  }
  function activeId() { return sessionStorage.getItem(activeKey) || ''; }
  function canUseWorkspace() { return AppState.effectiveAccess().valid && AppState.get().activeDomain === 'CLOUD_CONTACT_CENTER' && AppState.canAction('task.create'); }
  function canAccessObject(item) {
    const owner = tenant(item?.tenantId);
    return canUseWorkspace() && !!item && !!item.tenantId && item.instanceId === AppState.get().instanceId &&
      owner.instanceId === item.instanceId && owner.status === '启用' && (owner.capabilitySet || []).includes('CLOUD_CONTACT_CENTER') && AppState.authorizeObject('task.create', item);
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
  function taskConfig(draft){const v=draft.values;return {callPlanId:'CONFIG-'+draft.draftId,name:'本次任务配置',tenantId:draft.tenantId,instanceId:draft.instanceId,callType:draft.type,status:'已发布',publishedVersion:'V1',targetSkillGroupId:draft.type==='预外呼'||v.transferEnabled?v.skillGroupId:'',executionQueueId:draft.type==='预外呼'?v.skillGroupId:v.executionQueueId,contactFlowId:v.contactFlowId,transferEnabled:draft.type==='预外呼'||!!v.transferEnabled,allowedCallerNumberIds:v.callerNumberId?[v.callerNumberId]:[]};}
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
      instanceId: AppState.get().instanceId,
      step: 1,
      status: '草稿',
      savedAt: '',
      createdAt: nowText(),
      values: {
        name: '',
        sourceType: '业务系统批次',
        sourceRef: '',
        total: 0,
        planId: '',
        skillGroupId: '',
        callerNumberId: '',
        contactFlowId: '',
        transferEnabled: false,
        scheduleMode: '定时执行',
        scheduleAt: local,
        maxAttemptCount: 1,
        minAttemptInterval: 1
      }
    };
  }

  function scenarioType(draft) { return draft.type === '预外呼' ? 'PREDICTIVE' : 'IVR_OUTBOUND'; }
  function routeForType(type) { return type === '预外呼' ? 'predictive-tasks' : 'ivr-tasks'; }
  function typeLabel(type) { return type === '预外呼' ? '预外呼' : 'IVR 外呼'; }

  function start(type, draftId) {
    if (!canUseWorkspace() || !['预外呼', 'IVR 外呼'].includes(type)) return false;
    let draft = draftId ? drafts.find(item => item.draftId === draftId) : null;
    if (draftId && (!canAccessDraft(draft) || draft.type !== type)) { clearActiveContext(); return false; }
    if (!draft) {
      draft = makeDraft(type);
      if (!canAccessDraft(draft)) return false;
      drafts.unshift(draft);
      persist();
    }
    sessionStorage.setItem(activeKey, draft.draftId);
    AppState.setDirty(Boolean(draft.savedAt === ''));
    navigateTo('cloud-task-create', { draftId: draft.draftId });
    return true;
  }

  function optionsFor(draft) {
    const tenantId = draft.tenantId;
    const instanceId = draft.instanceId;
    const plans = (CloudCallData.callPlans || []).filter(item => item.tenantId === tenantId && item.instanceId === instanceId && item.callType === draft.type && item.status === '已发布');
    const groups = (CloudCallData.physicalSkillGroups || []).filter(item => item.tenantId === tenantId && item.instanceId === instanceId && item.status === '已启用' && CloudResourceRules.members(item).length > 0);
    const selectedPlan = taskConfig(draft);
    const numbers = (CloudCallData.phoneNumbers || []).filter(item => item.instanceId === instanceId && CloudResourceRules.usableNumber(item,tenantId,'呼出') && (item.authorizedTenantIds || []).includes(tenantId));
    const flows = (CloudCallData.contactFlows || []).filter(item => item.instanceId === instanceId && item.status === '已发布' && item.usage === (draft.type==='预外呼'?'预外呼':'IVR外呼'));
    return { plans, groups, numbers, flows };
  }

  function stepNavigation(draft) {
    return `<div class="task-wizard-steps" data-anno-page="cloud-task-create" data-anno-label="五步任务创建进度" data-anno-kind="region" data-anno-fields="FLD-034">${steps.map((label,index)=>({label,step:index+1})).filter(x=>x.step!==3).map(({label,step},index) => {
      const state = step < draft.step ? 'done' : step === draft.step ? 'active' : '';
      return `<button class="${state}" ${step > draft.step ? 'disabled' : ''} onclick="CloudTaskWorkspace.goStep(${step})"><span>${step < draft.step ? '✓' : index+1}</span><strong>${label}</strong></button>`;
    }).join('')}</div>`;
  }

  function prerequisiteStep(draft) {
    const readiness = ScenarioReadiness.calculate(draft.tenantId, scenarioType(draft));
    const canConfigure = AppState.effectiveAccess().roleCode !== 'OPERATOR';
    const tenantSelector = AppState.isSuper() ? `<label class="field task-target-tenant"><span>任务归属租户</span><select id="wizardTenant" onchange="CloudTaskWorkspace.setTenant(this.value)">${AppState.availableTenants().map(row => `<option value="${row.tenantId}" ${row.tenantId === draft.tenantId ? 'selected' : ''}>${esc(row.name)}（${esc(row.organizationLabel)}）</option>`).join('')}</select><small class="field-hint">任务必须归属当前实例内的一个具体租户。</small></label>` : '';
    return `<div class="wizard-step-content" data-anno-page="cloud-task-create" data-anno-label="任务创建前置检查" data-anno-kind="region" data-anno-fields="FLD-009,FLD-010,FLD-011,FLD-012,FLD-013,FLD-014,FLD-054">
      <div class="wizard-step-heading"><div><span>第 1 步</span><h2>先确认${esc(typeLabel(draft.type))}场景可用</h2><p>必要配置齐全且最近一次场景测试通过后，才允许继续创建任务。</p></div>${ui.status(readiness.statusLabel)}</div>
      ${tenantSelector}
      <div class="wizard-readiness-summary status-${readiness.status.toLowerCase()}"><div><span>配置完整度</span><strong>${readiness.readinessPercent}%</strong></div><div><span>最近测试</span><strong>${esc(readiness.test ? readiness.test.testedAt : '尚未测试')}</strong><small>${esc(readiness.test?.summary || '完成配置后执行首次场景测试')}</small></div></div>
      <div class="wizard-check-list">${readiness.requirements.map(item => `<div class="${item.ready ? 'ready' : 'missing'}"><span>${item.ready ? '✓' : '!'}</span><div><strong>${esc(item.label)}</strong><small>${esc(item.detail)}</small>${item.verification ? `<em>${esc(item.verification)} · 投产前需真实环境验收</em>` : ''}</div>${ui.status(item.state)}${canConfigure && window.RouteRuntime?.canRoute(item.route) ? `<button onclick="CloudTaskWorkspace.goConfigure('${item.route}','${item.key}','${esc(item.label)}',${item.ready})">${item.ready ? '查看' : '去配置'}</button>` : '<i>只读</i>'}</div>`).join('')}</div>
      ${readiness.status === 'AVAILABLE' ? ui.alert('success', '场景可以创建任务', '后续仍会在提交前重新检查配置、号码、技能组和联系流。') : ui.alert('warning', '当前不能继续', readiness.missing.length ? `请先补齐：${readiness.missing.map(item => item.label).join('、')}` : '请先完成或重新执行场景测试。')}
    </div>`;
  }

  function basicStep(draft) {
    return `<div class="wizard-step-content" data-anno-page="cloud-task-create" data-anno-label="任务基本信息" data-anno-kind="region" data-anno-fields="FLD-031,FLD-032,FLD-033">
      <div class="wizard-step-heading"><div><span>第 2 步</span><h2>填写任务基本信息</h2><p>任务类型创建后不可修改，任务编号由系统自动生成。</p></div></div>
      <div class="form-grid wizard-form"><label class="field full"><span>任务名称 <b>*</b></span><input id="wizardName" value="${esc(draft.values.name)}" maxlength="40" placeholder="例如：9 月客户满意度回访" oninput="CloudTaskWorkspace.update('name',this.value)"><small class="field-hint">建议包含业务对象、动作和批次，最多 40 个字。</small></label><label class="field"><span>任务类型</span><input value="${esc(typeLabel(draft.type))}" disabled></label><label class="field"><span>归属租户</span><input value="${esc(tenant(draft.tenantId).name || draft.tenantId)}" disabled></label><label class="field"><span>任务状态</span><input value="${esc(draft.status)}" disabled></label></div>
      ${customerSelection(draft)}
    </div>`;
  }

  function customerSelection(draft){
    const pool=window.CustomerTasks?.pendingForTask(draft.tenantId,draft.instanceId)||[],ids=draft.values.customerIds||[],batch=draft.values.customerBatch||'';
    const batches=[...new Map(pool.map(r=>[r.batchId,r.batchName])).entries()];
    const filtered=pool.filter(r=>(!batch||r.batchId===batch)&&(!draft.values.customerQuery||[r.name,r.phone].some(v=>String(v||'').includes(draft.values.customerQuery))));
    return '<article class="panel-card task-customer-picker"><div class="panel-header"><h3>选择客户（可稍后分配）</h3>'+ui.help('客户先在“导入与分配”中导入。这里只选择当前租户未分配客户，提交时才正式分配；草稿或退出不会占用客户。已启动任务不接受追加。')+'</div><div class="panel-body"><div class="task-customer-filters"><label>客户批次 <select onchange="CloudTaskWorkspace.filterCustomers(\'customerBatch\',this.value)"><option value="">全部批次</option>'+batches.map(([id,name])=>'<option value="'+esc(id)+'" '+(batch===id?'selected':'')+'>'+esc(name)+'</option>').join('')+'</select></label><label>客户 <input value="'+esc(draft.values.customerQuery||'')+'" placeholder="称呼或号码" onchange="CloudTaskWorkspace.filterCustomers(\'customerQuery\',this.value)"></label><button class="btn" onclick="CloudTaskWorkspace.selectFilteredCustomers()">选择筛选结果</button><button class="btn" onclick="CloudTaskWorkspace.clearCustomers()">清空选择</button></div><p>已选 <b>'+ids.length+'</b> 位 · 当前筛选 '+filtered.length+' 位待分配客户</p><div class="task-customer-table">'+ui.table([{key:'id',label:'选择',render:id=>'<input type="checkbox" aria-label="选择客户" '+(ids.includes(id)?'checked':'')+' onchange="CloudTaskWorkspace.toggleCustomer(\''+esc(id)+'\',this.checked)">'},{key:'name',label:'客户称呼'},{key:'phone',label:'客户号码'},{key:'externalDocumentId',label:'外部单据标识',render:v=>esc(v||'—')},{key:'batchName',label:'客户批次'}],filtered,{emptyText:'暂无符合条件的待分配客户；可先保存任务，再到“导入与分配”导入并分配'})+'</div></div></article>';
  }
  function filterCustomers(key,value){const d=activeDraft();if(!d||!['customerBatch','customerQuery'].includes(key))return;d.values[key]=value;persist();refresh();}
  function toggleCustomer(id,checked){const d=activeDraft();if(!d)return;const pool=CustomerTasks.pendingForTask(d.tenantId,d.instanceId);if(checked&&!pool.some(r=>r.id===id))return;const ids=new Set(d.values.customerIds||[]);checked?ids.add(id):ids.delete(id);d.values.customerIds=[...ids];persist();AppState.setDirty(true);refresh();}
  function clearCustomers(){const d=activeDraft();if(!d)return;d.values.customerIds=[];persist();AppState.setDirty(true);refresh();}
  function selectFilteredCustomers(){const d=activeDraft();if(!d)return;const pool=CustomerTasks.pendingForTask(d.tenantId,d.instanceId).filter(r=>(!d.values.customerBatch||r.batchId===d.values.customerBatch)&&(!d.values.customerQuery||[r.name,r.phone].some(v=>String(v||'').includes(d.values.customerQuery))));d.values.customerIds=[...new Set([...(d.values.customerIds||[]),...pool.map(r=>r.id)])];persist();AppState.setDirty(true);refresh();}

  function resourceStep(draft) {
    const choices=optionsFor(draft),v=draft.values,ivr=draft.type==='IVR 外呼';
    const allGroups=CloudCallData.physicalSkillGroups.filter(g=>g.tenantId===draft.tenantId&&g.instanceId===draft.instanceId&&g.status==='已启用');
    const select=(key,rows,selected,label)=>'<label class="field"><span>'+label+'</span><select onchange="CloudTaskWorkspace.setResource(\''+key+'\',this.value)"><option value="">请选择</option>'+rows.map(r=>'<option value="'+r.id+'" '+(r.id===selected?'selected':'')+'>'+esc(r.name)+'</option>').join('')+'</select></label>';
    return '<div class="wizard-step-content"><div class="wizard-step-heading"><div><span>第 3 步</span><h2>设置本次'+esc(draft.type)+'使用的资源</h2></div>'+ui.help('这里只选择已有号码、技能组和已发布流程；不会更改坐席成员、技能等级或号码授权。')+'</div>'+
      '<details class="technical-details"><summary>使用已有模板（可选）</summary><select onchange="CloudTaskWorkspace.selectPlan(this.value)"><option value="">不使用模板，直接配置</option>'+choices.plans.filter(p=>!p.supersededBy).map(p=>'<option value="'+p.callPlanId+'" '+(p.callPlanId===v.planId?'selected':'')+'>'+esc(p.name)+'</option>').join('')+'</select></details><div class="form-grid wizard-form">'+
      select('callerNumberId',choices.numbers.map(n=>({id:n.numberId,name:n.number})),v.callerNumberId,'外显号码 *')+
      (ivr?'<label class="field"><span>是否转人工</span><select onchange="CloudTaskWorkspace.setResource(\'transferEnabled\',this.value===\'true\')"><option value="false" '+(!v.transferEnabled?'selected':'')+'>不转人工</option><option value="true" '+(v.transferEnabled?'selected':'')+'>按已发布流程转人工</option></select></label>':'')+
      (!ivr||v.transferEnabled?select('skillGroupId',choices.groups.map(g=>({id:g.skillGroupId,name:g.name})),v.skillGroupId,'接听团队 *'):'')+
      select('contactFlowId',choices.flows.map(f=>({id:f.contactFlowId,name:f.name})),v.contactFlowId,'已发布语音流程 *')+
      '</div>'+(ivr?'<details class="technical-details"><summary>高级执行设置 '+ui.help('沿用既有阿里活动执行要求：纯IVR也需要有效执行队列，不表示人工接听。无人工调度仍待POC。')+'</summary>'+select('executionQueueId',allGroups.map(g=>({id:g.skillGroupId,name:g.name})),v.executionQueueId,'执行资源 *')+'</details>':'')+
      (AppState.canMenu('settings.plans')?'<label class="checkbox-row"><input type="checkbox" '+(v.saveAsTemplate?'checked':'')+' onchange="CloudTaskWorkspace.setResource(\'saveAsTemplate\',this.checked)"> 同时保存为常用模板（使用任务名称）</label>':'')+
      '</div>';
  }

  function retryError(v) {
    if(v.maxAttemptCount === '' || v.maxAttemptCount == null || !Number.isSafeInteger(Number(v.maxAttemptCount)) || Number(v.maxAttemptCount)<0)return '请输入非负整数的最大重呼次数';
    if(v.minAttemptInterval === '' || v.minAttemptInterval == null || !Number.isSafeInteger(Number(v.minAttemptInterval)) || Number(v.minAttemptInterval)<1)return '请输入正整数的最小重呼间隔（分钟）';
    return '';
  }
  function scheduleStep(draft) {
    return `<div class="wizard-step-content" data-anno-page="cloud-task-create" data-anno-label="任务执行时间与重呼" data-anno-kind="region" data-anno-fields="FLD-032,FLD-033">
      <div class="wizard-step-heading"><div><span>第 4 步</span><h2>设置执行时间与再次呼叫</h2><p>先保存配置，再到“导入与分配”分配客户；没有客户不能启动。</p></div></div>
      <div class="form-grid wizard-form"><label class="field"><span>执行方式 <b>*</b></span><select id="wizardScheduleMode" onchange="CloudTaskWorkspace.update('scheduleMode',this.value)"><option ${draft.values.scheduleMode === '定时执行' ? 'selected' : ''}>定时执行</option><option ${draft.values.scheduleMode === '保存后手工启动' ? 'selected' : ''}>保存后手工启动</option></select></label><label class="field"><span>计划开始时间 <b>*</b></span><input id="wizardScheduleAt" type="datetime-local" value="${esc(draft.values.scheduleAt)}" ${draft.values.scheduleMode === '保存后手工启动' ? 'disabled' : ''} onchange="CloudTaskWorkspace.update('scheduleAt',this.value)"></label><label class="field"><span>最大重呼次数 <b>*</b> ${ui.help('对应CreateCampaign.MaxAttemptCount，任务内统一设置，不按失败原因分组。支持自定义整数；厂商上限及是否包含首次呼叫待联调确认，0值是否可提交也需核验。')}</span><input id="wizardMaxAttemptCount" type="number" min="0" step="1" value="${esc(draft.values.maxAttemptCount ?? '')}" placeholder="请输入次数" oninput="CloudTaskWorkspace.update('maxAttemptCount',this.value)"></label><label class="field"><span>最小重呼间隔（分钟） <b>*</b> ${ui.help('对应创建接口MinAttemptInterval，创建文档单位为分钟；查询接口文档为秒，读写换算待联调。最小间隔不是保证按时拨打。纯IVR复用此活动策略仍待验证。')}</span><input id="wizardMinAttemptInterval" type="number" min="1" step="1" value="${esc(draft.values.minAttemptInterval ?? '')}" placeholder="请输入间隔" oninput="CloudTaskWorkspace.update('minAttemptInterval',this.value)"></label><label class="field"><span>创建后的状态</span><input value="待分配客户" disabled></label></div>
      <div class="execution-boundary"><span>保存任务</span><i>→</i><span>提交前复检</span><i>→</i><span>保存任务配置</span><i>→</i><span>分配客户</span><i>→</i><span>启动前检查</span></div>
    </div>`;
  }

  function confirmStep(draft) {
    const selectedPlan = taskConfig(draft);
    const isPredictive = draft.type === '预外呼';
    return `<div class="wizard-step-content" data-anno-page="cloud-task-create" data-anno-label="任务确认与提交" data-anno-kind="region" data-anno-fields="FLD-031,FLD-032,FLD-033,FLD-035,FLD-036,FLD-054">
      <div class="wizard-step-heading"><div><span>第 5 步</span><h2>确认任务并提交</h2><p>已选客户随提交正式分配；未选则保存为待分配客户。均不立即发起呼叫。</p></div></div>
      <div class="confirm-summary"><section><span>任务</span><dl><dt>名称</dt><dd>${esc(draft.values.name)}</dd><dt>类型</dt><dd>${esc(typeLabel(draft.type))}</dd><dt>租户</dt><dd>${esc(tenant(draft.tenantId).name || draft.tenantId)}</dd></dl><button onclick="CloudTaskWorkspace.goStep(2)">修改</button></section><section><span>客户名单</span><dl><dt>分配方式</dt><dd>${(draft.values.customerIds||[]).length?'提交时分配已选客户':'保存后到“导入与分配”分配'}</dd><dt>客户数量</dt><dd>${(draft.values.customerIds||[]).length} 位</dd></dl></section><section><span>呼叫资源</span><dl><dt>配置</dt><dd>${esc(selectedPlan.name || '—')} · ${esc(selectedPlan.publishedVersion || '')}</dd><dt>主叫号码</dt><dd>${esc(number(draft.values.callerNumberId).number || '—')}</dd><dt>${isPredictive ? '技能组' : '联系流'}</dt><dd>${isPredictive ? esc(group(draft.values.skillGroupId).name || '—') : esc(draft.values.contactFlowId || selectedPlan.contactFlowId || '—')}</dd></dl><button onclick="CloudTaskWorkspace.goStep(4)">修改</button></section><section><span>执行</span><dl><dt>方式</dt><dd>${esc(draft.values.scheduleMode)}</dd><dt>计划时间</dt><dd>${esc(draft.values.scheduleMode === '定时执行' ? draft.values.scheduleAt.replace('T', ' ') : '手工启动')}</dd><dt>最大重呼次数</dt><dd>${esc(draft.values.maxAttemptCount ?? '未配置')}</dd><dt>最小重呼间隔</dt><dd>${esc(draft.values.minAttemptInterval ?? '未配置')} 分钟</dd></dl><button onclick="CloudTaskWorkspace.goStep(5)">修改</button></section></div>
      ${isPredictive ? ui.alert('info', '提交后的任务仍可控制', '任务开始后可暂停、继续或终止；目标是停止新拨号并继续收集在途结果；真实行为须完成 POC。') : ui.alert('info', draft.values.transferEnabled ? '仅查看实际生成的人工参与阶段录音' : '纯自动语音不提供录音', '系统会保留自动语音播放过程、客户按键、退出结果与最终状态。')}
    </div>`;
  }

  function body(draft) {
    if (draft.step === 1) return prerequisiteStep(draft);
    if (draft.step === 2) return basicStep(draft);
    if (draft.step === 3) draft.step = 4;
    if (draft.step === 4) return resourceStep(draft);
    if (draft.step === 5) return scheduleStep(draft);
    return confirmStep(draft);
  }

  function render(options) {
    if (options?.draftId && options.draftId !== activeId()) {
      const requested = drafts.find(item => item.draftId === options.draftId);
      if (!canAccessDraft(requested)) clearActiveContext();
      else sessionStorage.setItem(activeKey, requested.draftId);
    }
    const draft = activeDraft();
    if (!draft) return `<section class="platform-page">${ui.pageHeader('创建任务', '当前没有正在编辑的任务草稿。')}<div class="panel-card"><div class="panel-body">${ui.empty('请从预外呼或 IVR 外呼任务列表新建任务')}</div></div></section>`;
    return `<section class="platform-page cloud-task-workspace" data-anno-page="cloud-task-create" data-anno-label="云呼叫任务创建工作区" data-anno-kind="region" data-anno-fields="FLD-012,FLD-031,FLD-032,FLD-033,FLD-034,FLD-035,FLD-036,FLD-048,FLD-052,FLD-054">
      ${ui.pageHeader(`新建${typeLabel(draft.type)}任务`, `${esc(tenant(draft.tenantId).name || '当前租户')} · ${draft.savedAt ? '草稿已保存' : '正在编辑'}`, `<button class="btn" onclick="CloudTaskWorkspace.cancel()">返回任务列表</button>`)}
      ${stepNavigation(draft)}
      <article class="panel-card wizard-main-card"><div class="panel-body">${body(draft)}</div></article>
      <div class="wizard-footer"><button class="btn" onclick="CloudTaskWorkspace.previous()" ${draft.step === 1 ? 'disabled' : ''}>上一步</button><div><button class="btn" onclick="CloudTaskWorkspace.saveDraft()">保存草稿</button>${draft.step < 6 ? `<button class="btn btn-primary" onclick="CloudTaskWorkspace.next()">下一步</button>` : `<button class="btn btn-primary" onclick="CloudTaskWorkspace.submit()">确认提交</button>`}</div></div>
    </section>`;
  }

  function refresh() { navigateTo('cloud-task-create', { draftId: activeId() }); }
  function update(key, value) { const draft = activeDraft(); if (!draft || !['name','sourceType','sourceRef','total','callerNumberId','scheduleMode','scheduleAt','maxAttemptCount','minAttemptInterval'].includes(key)) return; draft.values[key] = value; persist(); AppState.setDirty(true); if(key==='scheduleMode')refresh(); }
  function setResource(key,value){const d=activeDraft();if(!d||!['callerNumberId','skillGroupId','contactFlowId','executionQueueId','transferEnabled','saveAsTemplate'].includes(key))return;if(key==='saveAsTemplate'&&!AppState.canMenu('settings.plans'))return;d.values[key]=value;if(key==='transferEnabled'&&!value)d.values.skillGroupId='';persist();AppState.setDirty(true);if(key==='transferEnabled')refresh();}
  function setTenant(tenantId) { const draft = activeDraft(); if (!draft || !AppState.isSuper()) return; const target = AppState.availableTenants().find(item => item.tenantId === tenantId && (item.capabilitySet || []).includes('CLOUD_CONTACT_CENTER')); if (!target) return; draft.tenantId = tenantId; draft.values.customerIds=[]; draft.values.customerBatch=''; draft.values.customerQuery=''; draft.values.planId = ''; draft.values.skillGroupId = ''; draft.values.callerNumberId = ''; draft.values.contactFlowId = ''; draft.values.executionQueueId = ''; draft.values.transferEnabled = false; draft.values.saveAsTemplate=false; persist(); AppState.setDirty(true); refresh(); }
  function selectPlan(planId) {
    const draft=activeDraft();if(!draft)return;
    const selected=plan(planId);
    if(planId&&(!optionsFor(draft).plans.some(p=>p.callPlanId===planId)||selected.supersededBy))return;
    draft.values.planId=planId;
    draft.values.skillGroupId=selected.targetSkillGroupId||'';
    draft.values.contactFlowId=selected.contactFlowId||'';
    draft.values.executionQueueId=selected.executionQueueId||'';
    draft.values.transferEnabled=!!selected.transferEnabled;
    if(!selected.allowedCallerNumberIds?.includes(draft.values.callerNumberId))draft.values.callerNumberId=selected.allowedCallerNumberIds?.[0]||'';
    persist();AppState.setDirty(true);refresh();
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
    allocateTaskId(draft);
    draft.savedAt = nowText();
    persist();
    AppState.setDirty(false);
    if (!silent) { showToast('任务草稿已保存，可稍后继续', 'success'); refresh(); }
    return true;
  }

  function validateStep(draft, step) {
    if (step === 1) {
      const readiness = ScenarioReadiness.calculate(draft.tenantId, scenarioType(draft));
      if (readiness.status !== 'AVAILABLE') return `${typeLabel(draft.type)}场景当前为“${readiness.statusLabel}”，不能继续创建任务`;
    }
    if (step === 2 && !CustomerTasks.validateTaskSelection(draft,draft.values.customerIds||[])) return '所选客户已被分配或不在当前范围，请清空并重新选择';
    if (step === 2 && !String(draft.values.name || '').trim()) return '请填写任务名称';
    
    if (step === 4 && !draft.values.callerNumberId) return '请选择当前实例授权给本租户的呼出号码';
    if (step === 4 && draft.type === '预外呼' && !draft.values.skillGroupId) return '请选择具有可用坐席的目标技能组';
    if (step === 4 && draft.type === 'IVR 外呼' && !draft.values.contactFlowId) return '请选择阿里云已发布的 IVR 联系流';
    if(step===4){const error=CloudResourceRules.validatePlan(taskConfig(draft),true);if(error)return error;}
    if (step === 5) { const e=retryError(draft.values);if(e)return e; }
    if (step === 5 && draft.values.scheduleMode === '定时执行' && !draft.values.scheduleAt) return '请选择计划开始时间';
    return '';
  }

  function next() {
    const draft = activeDraft();
    if (!draft) return;
    const error = validateStep(draft, draft.step);
    if (error) { showToast(error, 'warning'); return; }
    draft.step = draft.step === 2 ? 4 : Math.min(draft.step + 1, 6);
    persist(); AppState.setDirty(true); refresh();
  }

  function previous() { const draft = activeDraft(); if (!draft) return; draft.step = draft.step === 4 ? 2 : Math.max(draft.step - 1, 1); persist(); refresh(); }
  function goStep(step) { const draft = activeDraft(); if (!draft || step < 1 || step > 6 || step > draft.step) return; draft.step = step === 3 ? 4 : step; persist(); refresh(); }

  function goConfigure(route, requirementKey, requirementLabel, wasReady) {
    const draft = activeDraft();
    if (!draft) return;
    saveDraft(true);
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
    const draft = activeDraft();
    if (!draft) return;
    for (let step = 1; step <= 5; step += 1) {
      const error = validateStep(draft, step);
      if (error) { draft.step = step; persist(); showToast(`提交被阻断：${error}`, 'warning'); refresh(); return; }
    }
    const selectedPlan = taskConfig(draft);
    const target = draft.type === '预外呼' ? CloudCallData.predictiveTasks : CloudCallData.ivrTasks;
    allocateTaskId(draft);
    const row = {
      taskId: draft.taskId,
      tenantId: draft.tenantId,
      instanceId: draft.instanceId,
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
      scheduleAt: draft.values.scheduleMode === '定时执行' ? draft.values.scheduleAt.replace('T', ' ') : '手工启动',
      maxAttemptCount: Number(draft.values.maxAttemptCount),
      minAttemptInterval: Number(draft.values.minAttemptInterval),
      retryPolicySource: 'CCC_CREATE_CAMPAIGN',
      stopNewDialing: false,
      callerNumberId: draft.values.callerNumberId,
      targetSkillGroupId: selectedPlan.targetSkillGroupId || '',
      executionQueueId: selectedPlan.executionQueueId || '',
      contactFlowId: selectedPlan.contactFlowId || '',
      transferEnabled: !!selectedPlan.transferEnabled,
      owner: AppState.account().name || AppState.profile().label
    };
    // Execution snapshot is frozen only when starting, after resource checks.
    if(draft.values.saveAsTemplate&&AppState.canMenu('settings.plans'))CloudCallData.callPlans.push({...structuredClone(selectedPlan),callPlanId:CloudResourceRules.id('TEMPLATE'),name:row.name,isTemplate:true});
    const selectedIds=draft.values.customerIds||[];
    if(!CustomerTasks.attachToNewTask(row,selectedIds)){showToast('客户分配未成功，任务尚未提交，请重新选择后重试','warning');return;}
    row.total=selectedIds.length;row.status=row.total?'待启动':'待分配客户';
    target.unshift(row);
    if (!CloudCallData.tasks.includes(row)) CloudCallData.tasks.unshift(row);
    persistCreatedTask(row);
    draft.status = '已提交';
    draft.savedAt = nowText();
    persist();
    AppState.setDirty(false);
    sessionStorage.removeItem(activeKey);
    showToast(`任务 ${row.taskId} 已创建，执行配置已保存`, 'success');
    navigateTo(routeForType(draft.type));
  }

  function cancel() {
    const draft = activeDraft();
    if (!draft) return navigateTo('home');
    if (!draft.savedAt) saveDraft(true);
    clearActiveContext();
    navigateTo(routeForType(draft.type));
  }

  function syncAssignedCustomers() {
    for(const row of CloudCallData.tasks || []) {
      if(row.customerSourceMode!=='assigned' || !canAccessObject(row) || !['待分配客户','待启动'].includes(row.status))continue;
      const total=window.CustomerTasks?.taskCustomers(row).length || 0;
      row.total=total; row.status=total?'待启动':'待分配客户';
      persistCreatedTask(row);
    }
  }

  function taskById(taskId) {
    syncAssignedCustomers();
    return (CloudCallData.tasks || []).find(item => item.taskId === taskId)
      || (CloudCallData.predictiveTasks || []).find(item => item.taskId === taskId)
      || (CloudCallData.ivrTasks || []).find(item => item.taskId === taskId)
      || null;
  }

  function listDraftTasks(type) {
    return drafts.filter(item => item.type === type && item.savedAt && canAccessDraft(item)).map(item => ({
      taskId: item.taskId || item.draftId,
      draftId: item.draftId,
      tenantId: item.tenantId,
      instanceId: item.instanceId,
      name: item.values.name || `未命名${type}任务`,
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
      maxAttemptCount: item.values.maxAttemptCount,
      minAttemptInterval: item.values.minAttemptInterval,
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
    const draft = drafts.find(item => item.taskId === taskId || item.draftId === taskId);
    if (draft && draft.status !== '已提交') return start(draft.type, draft.draftId);
    const task = taskById(taskId);
    if (!canAccessObject(task)) return false;
    saveCenterContext(taskId, tab || 'overview');
    navigateTo('cloud-task-center', { taskId, tab: tab || 'overview' });
    return true;
  }

  function setTaskTab(tab) {
    const context = readCenterContext();
    if (!context.taskId || !centerTabs.some(item => item.key === tab)) return;
    saveCenterContext(context.taskId, tab);
    navigateTo('cloud-task-center', { taskId: context.taskId, tab });
  }

  function taskCalls(row) { return (CloudCallData.calls || []).filter(item => item.taskId === row.taskId && AppState.authorizeObject('', item)); }
  function taskCallbacks(row) { const ids = new Set(taskCalls(row).map(item => item.callId)); return (CloudCallData.callbacks || []).filter(item => ids.has(item.callId)); }
  function taskExceptions(row) { return (CloudCallData.exceptions || []).filter(item => item.objectId === row.taskId || taskCallbacks(row).some(callback => callback.callbackId === item.objectId)); }
  function percent(row) { return row.total ? Math.round(Number(row.completed || 0) / Number(row.total) * 100) : 0; }

  function centerActions(row) {
    const buttons = [];
    if(row.displayOnly)return '<span class="mini-tag">展示样例 · 请用模块联动演示测试操作</span>';
    if(!canAccessObject(row))return '';
    if (['待分配客户','待启动','异常'].includes(row.status)) buttons.push(`<button class="btn danger" onclick="CloudTaskWorkspace.controlTask('${row.taskId}','terminate')">终止任务</button>`);
    if (canDeleteTask(row)) buttons.push(`<button class="btn danger" onclick="CloudTaskWorkspace.deleteTask('${row.taskId}')">删除任务</button>`);
    if (['待分配客户','待启动'].includes(row.status)) buttons.push(`<button class="btn" onclick="navigateTo('customer-tasks')">分配客户</button>`);
    if (row.resourcePause && row.status === '已暂停') buttons.push('<span class="form-help">号码隔离暂停：号码恢复后，任务仍需有权管理员逐项复检恢复（本地模拟）</span>');
    if (row.status === '待启动') buttons.push(`<button class="btn btn-primary" onclick="CloudTaskWorkspace.controlTask('${row.taskId}','start')">启动任务</button>`);
    if (row.status === '执行中') buttons.push(`<button class="btn" onclick="CloudTaskWorkspace.controlTask('${row.taskId}','pause')">暂停任务</button><button class="btn danger" onclick="CloudTaskWorkspace.controlTask('${row.taskId}','terminate')">终止任务</button>`);
    if (row.status === '已暂停') buttons.push(`${!row.resourcePause || canRestoreResourceTask(row) ? `<button class="btn btn-primary" onclick="CloudTaskWorkspace.controlTask('${row.taskId}','resume')">${row.resourcePause ? '恢复任务' : '继续任务'}</button>` : '<span class="form-help">号码隔离暂停，需有权管理员逐项恢复</span>'}<button class="btn danger" onclick="CloudTaskWorkspace.controlTask('${row.taskId}','terminate')">终止任务</button>`);
    if (row.status === '异常') buttons.push(`<button class="btn" onclick="CloudTaskWorkspace.setTaskTab('results')">处理异常</button>`);
    buttons.push(`<button class="btn" onclick="CloudTaskWorkspace.copyTask('${row.taskId}')">复制任务</button>`);
    return buttons.join('');
  }

  function centerContinue(row) {
    const calls = taskCalls(row);
    const openExceptions = taskExceptions(row).filter(item => !['已处理', '已关闭'].includes(item.status));
    const failedCallbacks = taskCallbacks(row).filter(item => item.status === '失败');
    let title = '查看执行进度';
    let detail = '按时间核对名单、执行配置和任务状态。';
    let action = `CloudTaskWorkspace.setTaskTab('execution')`;
    let label = '查看执行明细';
    if (openExceptions.length || failedCallbacks.length) {
      title = `${openExceptions.length || failedCallbacks.length} 项结果问题待处理`;
      detail = AppState.effectiveAccess().roleCode === 'OPERATOR' ? '查看失败原因和管理员处理状态，不直接执行配置待办。' : '先核对结果回传，再进入集中待办处理失败项。';
      action = `CloudTaskWorkspace.setTaskTab('results')`;
      label = AppState.effectiveAccess().roleCode === 'OPERATOR' ? '查看结果与异常' : '处理结果与异常';
    } else if (calls.length) {
      title = `已产生 ${calls.length} 条通话记录`;
      detail = '查看当前任务的通话终态、坐席结果与录音。';
      action = `CloudCallRecords.openFromTask('${row.taskId}','overview','records')`;
      label = '查看本任务通话';
    } else if (row.status === '待分配客户') {
      title = '配置已保存，请分配客户'; detail = '前往“导入与分配”勾选客户，选择外呼方式和本任务。'; action = "navigateTo('customer-tasks')"; label = '去分配客户';
    } else if (row.status === '待启动') {
      title = '任务已准备好，等待启动';
      detail = '启动前会重新检查配置、号码和执行资源。';
      action = `CloudTaskWorkspace.controlTask('${row.taskId}','start')`;
      label = '启动任务';
    }
    return `<div class="task-continue-card"><div><span>建议下一步</span><strong>${esc(title)}</strong><small>${esc(detail)}</small></div><button class="btn btn-primary" onclick="${action}">${esc(label)}</button></div>`;
  }

  function centerOverview(row) {
    const calls = taskCalls(row);
    const answered = calls.filter(item => ['接通', '完成'].includes(item.result)).length;
    const lifecycle = [
      { title: '任务已创建', time: row.createdAt || row.scheduleAt || '历史任务', detail: `名单 ${row.total} 条 · ${row.listSource}` },
      ...(row.planSnapshotId ? [{ title: '启动检查已完成', time: row.startedAt || row.scheduleAt, detail: `使用呼叫配置 ${row.planVersion}` }] : [{ title: '等待启动', time: '—', detail: '启动时将再次检查配置、号码和执行资源' }]),
      ...(row.status === '已暂停' ? [{ title: '任务已暂停新呼叫', time: row.updatedAt || nowText(), detail: row.callType === '预外呼' ? '已经发起的呼叫继续按实际结果更新' : '当前执行批次保留' }] : []),
      ...(row.status === '已终止' ? [{ title: '任务已终止', time: row.updatedAt || nowText(), detail: '不再产生新拨号，历史执行数据永久保留' }] : [])
    ];
    return `${centerContinue(row)}<div class="task-center-grid"><article class="panel-card span-8"><div class="panel-header"><div><h2>运行概览</h2><p>从客户名单到通话结果的执行情况</p></div></div><div class="panel-body"><div class="task-progress-hero"><div><span>完成进度</span><strong>${percent(row)}%</strong><small>${row.completed || 0} / ${row.total || 0}</small></div><div class="progress-track"><i style="width:${percent(row)}%"></i></div><div class="task-stat-strip"><div><span>已接通</span><strong>${row.connected || 0}</strong></div><div><span>通话记录</span><strong>${calls.length}</strong></div><div><span>样本接通</span><strong>${answered}</strong></div><div><span>待处理问题</span><strong>${taskCallbacks(row).filter(item => item.status === '失败').length + taskExceptions(row).filter(item => !['已处理', '已关闭'].includes(item.status)).length}</strong></div></div></div></article><article class="panel-card span-4"><div class="panel-header"><div><h2>任务说明</h2><p>${esc(row.callType)}</p></div>${ui.help(row.callType === '预外呼' ? '暂停或终止后不再发起新的呼叫，已经发起的呼叫继续更新实际结果。' : '无人参与的纯 IVR 通话不提供录音，可查看完整执行过程。')}</div><div class="panel-body">${row.callType === '预外呼' ? '<div class="business-guidance"><strong>接通后分配坐席</strong><span>系统先呼叫客户，接通后再分配服务团队中的空闲坐席。</span></div>' : '<div class="business-guidance"><strong>' + (row.transferEnabled ? '需要时转人工' : '自动完成') + '</strong><span>' + (row.transferEnabled ? '转人工后记录坐席参与阶段的录音。' : '通过播放、按键和最终结果核对执行情况。') + '</span></div>'}</div></article><article class="panel-card span-12"><div class="panel-header"><div><h2>任务进展</h2><p>按时间查看创建、启动、暂停和结束</p></div></div><div class="panel-body">${ui.timeline(lifecycle)}</div></article></div>`;
  }

  function customerRows(row) {
    const count = Math.min(Math.max(Number(row.total || 0), 1), 8);
    const completed = Number(row.completed || 0);
    return Array.from({ length: count }, (_, index) => {
      const done = index < Math.min(completed, count);
      return { customerId: `${row.taskId}-C${String(index + 1).padStart(3, '0')}`, businessRecordId: `${String(row.listSource || 'SRC').split(' ').at(-1)}-${String(index + 1).padStart(3, '0')}`, phone: `13${index + 1}****${String(6210 + index).slice(-4)}`, status: done ? (index % 3 === 0 ? '接通' : '已完成') : '待呼叫', attempt: done ? (index % 2) + 1 : 0, hasNext: null };
    });
  }

  function centerCustomers(row) {
    const assigned=window.CustomerTasks?.taskCustomers(row)||[];
    if(row.customerSourceMode==='assigned'||assigned.length)return `<article class="panel-card"><div class="panel-header"><h2>分配到本任务的客户 · ${assigned.length}</h2></div><div class="panel-body"><p>以下为客户名单分配记录；加入任务不自动启动呼叫。自动执行与结果关联仍待联调。</p>${ui.table([{key:'name',label:'客户称呼'},{key:'phone',label:'客户号码'},{key:'externalDocumentId',label:'外部单据标识',render:v=>esc(v||'—')},{key:'batchName',label:'来源批次'},{key:'note',label:'联系备注'}],assigned)}<p>${row.customerSourceMode==='assigned'?'任务客户数按此名单统计，分配不代表已拨打。':'历史任务原名单与新增分配分开保留。'}</p></div></article>`;
    return `<article class="panel-card"><div class="panel-header"><div><h2>客户数据</h2><p>${esc(row.listSource)} · 共 ${row.total} 条，仅展示前 ${Math.min(row.total, 8)} 条演示数据</p></div><button class="btn" onclick="doExport(event)">导出当前结果</button></div><div class="panel-body no-padding">${ui.table([{key:'businessRecordId',label:'业务记录编号'},{key:'phone',label:'客户号码'},{key:'status',label:'执行状态',render:v=>ui.status(v)},{key:'attempt',label:'已呼叫次数'},{key:'hasNext',label:'后续重呼',render:v=>v==null?'以执行结果为准':v?'<span class="mini-tag">有下一次</span>':'无'}],customerRows(row))}</div></article>`;
  }

  function ensureSnapshotObject(row) {
    if (row.planSnapshot) return row.planSnapshot;
    const selectedPlan = row.executionConfig||plan(row.planId);
    return {
      snapshotId: row.planSnapshotId || '启动时生成',
      planId: row.planId || '—',
      planName: selectedPlan.name || '历史方案',
      planVersion: row.planVersion || selectedPlan.publishedVersion || '—',
      callerNumberIds: row.callerNumberId ? [row.callerNumberId] : (selectedPlan.allowedCallerNumberIds || []),
      skillGroupId: row.targetSkillGroupId || selectedPlan.targetSkillGroupId || '',
      contactFlowId: row.contactFlowId || selectedPlan.contactFlowId || '',
      frozenAt: row.startedAt || '启动时生成'
    };
  }

  function centerResources(row) {
    const snapshot = ensureSnapshotObject(row);
    const numbers = snapshot.callerNumberIds.map(id => number(id).number || id).join('、') || '—';
    return `<div class="task-center-grid"><article class="panel-card span-8"><div class="panel-header"><div><h2>执行资源</h2><p>${row.planSnapshotId ? '任务按提交时已确认的配置执行' : '任务尚未启动，可继续检查配置'}</p></div>${ui.status(row.planSnapshotId ? '已确认' : '待确认')}</div><div class="panel-body"><dl class="detail-grid"><dt>呼叫配置</dt><dd>${esc(snapshot.planName)} · ${esc(snapshot.planVersion)}</dd><dt>主叫号码</dt><dd>${esc(numbers)}</dd><dt>${row.callType === '预外呼' ? '服务团队' : '自动语音流程'}</dt><dd>${esc(row.callType === '预外呼' ? (group(snapshot.skillGroupId).name || '—') : ((CloudCallData.contactFlows||[]).find(item=>item.contactFlowId===snapshot.contactFlowId)?.name || '—'))}</dd><dt>最大重呼次数</dt><dd>${esc(row.maxAttemptCount ?? "历史任务未配置")}</dd><dt>最小重呼间隔</dt><dd>${row.minAttemptInterval == null ? "历史任务未配置" : esc(row.minAttemptInterval)+" 分钟"}</dd><dt>重呼说明</dt><dd>${ui.help("活动级统一策略；次数口径与读写单位待联调。已创建活动的修改接口未提供这两个字段，页面不提供运行中修改。")}</dd><dt>确认时间</dt><dd>${esc(snapshot.frozenAt)}</dd></dl><details class="technical-details"><summary>技术信息</summary><dl class="detail-grid"><dt>配置快照</dt><dd><code>${esc(snapshot.snapshotId)}</code></dd><dt>方案编号</dt><dd><code>${esc(snapshot.planId)}</code></dd></dl></details></div></article><article class="panel-card span-4"><div class="panel-header"><div><h2>变更说明</h2><p>确保运行中任务保持稳定</p></div></div><div class="panel-body"><div class="rule-list"><div><span>1</span><strong>修改模板不改变已有任务</strong></div><div><span>2</span><strong>新任务按当次选择执行</strong></div><div><span>3</span><strong>已提交任务保留提交时配置</strong></div></div></div></article></div>`;
  }

  function executionEvents(row) {
    const rows = [{ title: '名单接收并校验', time: row.createdAt || row.scheduleAt || '历史记录', detail: `${row.listSource} · ${row.total} 条` }];
    if (row.planSnapshotId) rows.push({ title: '执行配置已确认', time: row.startedAt || row.scheduleAt, detail: row.planVersion || '当前版本' });
    if (row.campaignId) rows.push({ title: '执行任务已开始', time: row.startedAt || row.scheduleAt, detail: row.callType });
    if (row.status === '执行中') rows.push({ title: '任务执行中', time: '当前', detail: `${row.completed}/${row.total} 已完成，${row.connected} 已接通` });
    if (row.status === '已暂停') rows.push({ title: '已暂停新拨号', time: row.updatedAt || '当前', detail: '任务可继续或终止' });
    if (row.status === '已完成') rows.push({ title: '任务已完成', time: row.updatedAt || row.scheduleAt, detail: `${row.completed}/${row.total} 已完成` });
    if (row.status === '已终止') rows.push({ title: '任务已终止', time: row.updatedAt || '当前', detail: '保留已产生的通话与结果' });
    return rows;
  }

  function centerExecution(row) {
    return `<article class="panel-card"><div class="panel-header"><div><h2>执行明细</h2><p>按时间查看名单检查、开始、暂停和完成</p></div>${ui.help(row.callType === '预外呼' ? '暂停或终止后不再发起新呼叫，已发起呼叫继续更新实际结果。' : '自动语音任务按客户逐条更新执行状态。')}</div><div class="panel-body">${ui.timeline(executionEvents(row))}<details class="technical-details"><summary>技术信息</summary><dl class="detail-grid"><dt>任务编号</dt><dd><code>${esc(row.taskId)}</code></dd><dt>配置快照</dt><dd><code>${esc(row.planSnapshotId || '尚未生成')}</code></dd><dt>执行批次</dt><dd><code>${esc(row.campaignId || '尚未生成')}</code></dd></dl></details></div></article>`;
  }

  function centerCalls(row) {
    const calls = taskCalls(row);
    return `<article class="panel-card"><div class="panel-header"><div><h2>任务通话记录</h2><p>只展示当前任务产生的云呼叫，不混入智能外呼</p></div><div><span>${calls.length} 条</span><button class="btn-link" onclick="CloudCallRecords.openFromTask('${row.taskId}','calls','records')">在通话记录中查看</button></div></div><div class="panel-body no-padding">${ui.table([{key:'callId',label:'通话编号',render:(value,item)=>`<button class="table-link" onclick="window.Pages['cloud-call-records'].openCall('${value}')"><strong>${esc(value)}</strong><small>${esc(item.contactId)}</small></button>`},{key:'callee',label:'客户号码'},{key:'agentName',label:'坐席',render:value=>esc(value||'无人参与')},{key:'answeredAt',label:'接通时间'},{key:'durationSeconds',label:'通话秒数'},{key:'result',label:'终态',render:value=>ui.status(value)},{key:'recordingStatus',label:'录音',render:(value,item)=>item.recordingApplicability==='NOT_APPLICABLE_PURE_IVR'?ui.status('纯 IVR 不适用'):ui.status(value)},{key:'callbackStatus',label:'回流',render:value=>ui.status(value)}],calls,{emptyText:'当前任务尚未产生通话，启动执行后在这里查看'})}</div></article>`;
  }

  function centerResults(row) {
    const callbacks = taskCallbacks(row);
    const exceptions = taskExceptions(row).filter(item => BusinessIssues.pending(item));
    const canManage = AppState.effectiveAccess().roleCode !== 'OPERATOR';
    const exceptionMarkup = exceptions.map(item => canManage
      ? `<button onclick="BusinessIssues.open('${item.exceptionId}')"><div><strong>${esc(item.title)}</strong><small>${esc(item.impact || item.reason)}</small></div>${ui.status(item.status)}</button>`
      : `<div class="task-exception-readonly"><div><strong>${esc(item.title)}</strong><small>${esc(item.impact || item.reason)}</small></div><span>由${esc(item.responsibleRole || '租户管理员')}处理</span></div>`).join('');
    return `<div class="task-center-grid"><article class="panel-card span-7"><div class="panel-header"><div><h2>结果回传</h2><p>查看每条结果是否已送达业务系统</p></div><button class="btn-link" onclick="CloudCallRecords.openFromTask('${row.taskId}','results','callbacks')">查看全部</button></div><div class="panel-body no-padding">${ui.table([{key:'businessRecordId',label:'业务记录编号'},{key:'status',label:'回传状态',render:value=>ui.status(value)},{key:'error',label:'最近结果',render:value=>esc(value||'已成功送达')},{key:'callbackId',label:'操作',className:'action-column',render:value=>`<div class="table-actions"><button onclick="window.Pages['cloud-call-records'].openCallback('${value}')">查看</button></div>`}],callbacks,{emptyText:'当前任务暂无结果回传记录'})}</div></article><article class="panel-card span-5"><div class="panel-header"><div><h2>待处理问题</h2><p>${canManage ? '处理失败记录，不影响已完成通话' : '查看问题及管理员处理责任'}</p></div></div><div class="panel-body"><div class="task-exception-list">${exceptionMarkup || ui.empty('当前任务没有待处理问题')}</div></div></article></div>`;
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
    if (!row || !AppState.authorizeObject('', row)) return `<section class="platform-page">${ui.pageHeader('任务中心', '未找到当前权限范围内的任务。')}<div class="panel-card"><div class="panel-body">${ui.empty('请从预外呼或 IVR 外呼任务列表进入')}</div></div></section>`;
    saveCenterContext(row.taskId, context.tab);
    const currentJourneyStage = context.tab === 'calls' ? 'records' : context.tab === 'results' ? 'results' : 'monitor';
    const journeyActions = {
      prepare: `ScenarioReadiness.open('${row.callType === '预外呼' ? 'PREDICTIVE' : 'IVR_OUTBOUND'}','${row.tenantId}')`,
      create: `navigateTo('${routeForType(row.callType)}')`,
      monitor: `CloudTaskWorkspace.openTask('${row.taskId}','overview')`,
      records: `CloudCallRecords.openFromTask('${row.taskId}','${context.tab}','records')`,
      results: `CloudCallRecords.openFromTask('${row.taskId}','${context.tab}','callbacks')`
    };
    return `<section class="platform-page cloud-task-center" data-anno-page="cloud-task-center" data-anno-label="云呼叫任务中心与运行操作" data-anno-kind="region" data-anno-fields="FLD-031,FLD-032,FLD-033,FLD-036,FLD-037,FLD-048,FLD-052">
      ${ui.pageHeader(`${typeLabel(row.callType)}任务详情`, `${esc(tenant(row.tenantId).name || '当前租户')} · 负责人 ${esc(row.owner || '—')}`, `<button class="btn" onclick="navigateTo('${routeForType(row.callType)}')">返回列表</button>${centerActions(row)}`)}
      ${ui.journey({ current: currentJourneyStage, context: `${row.name} · ${row.status}`, branch: '当前任务范围', actions: journeyActions })}
      <div class="task-center-hero"><div><span>任务名称</span><h2>${esc(row.name)}</h2><small>${esc(row.callType)} · 负责人 ${esc(row.owner || '—')}</small></div><div><span>任务状态</span>${ui.status(row.status)}<small>${row.stopNewDialing ? '已停止新拨号' : '允许按当前状态执行'}</small></div><div><span>执行时间</span><strong>${esc(row.scheduleAt || '—')}</strong><small>${row.startedAt ? `实际启动 ${esc(row.startedAt)}` : '实际启动后记录'}</small></div><div><span>当前进度</span><strong>${percent(row)}%</strong><small>${row.completed || 0} / ${row.total || 0}</small></div></div>
      <div class="task-center-tabs">${centerTabs.map(item=>`<button class="${item.key===context.tab?'active':''}" onclick="CloudTaskWorkspace.setTaskTab('${item.key}')">${item.label}${item.key==='calls'?` <span>${taskCalls(row).length}</span>`:item.key==='results'?` <span>${taskCallbacks(row).filter(x=>x.status==='失败').length+taskExceptions(row).length}</span>`:''}</button>`).join('')}</div>
      ${window.ScenarioDemo?.panel(row)||''}
      <div class="task-center-body">${centerBody(row, context.tab)}</div>
    </section>`;
  }


  function freezePlan(row,selectedPlan,at){
    row.planSnapshotId=CloudResourceRules.id('SNAP');
    row.planSnapshot={snapshotId:row.planSnapshotId,planId:row.planId,planName:selectedPlan.name,planVersion:row.planVersion||selectedPlan.publishedVersion,callerNumberIds:row.callerNumberId?[row.callerNumberId]:[...(selectedPlan.allowedCallerNumberIds||[])],skillGroupId:row.targetSkillGroupId||selectedPlan.targetSkillGroupId||'',contactFlowId:selectedPlan.contactFlowId||'',executionQueueId:selectedPlan.executionQueueId||'',transferEnabled:!!selectedPlan.transferEnabled,frozenAt:at};
  }
  function dependencyError(row,checkReadiness){
    const selected=row.executionConfig||plan(row.planId);
    if(!selected.callPlanId||selected.status!=='已发布')return '执行方案不存在或已停用';
    if(selected.tenantId!==row.tenantId||selected.instanceId!==row.instanceId||selected.callType!==row.callType)return '任务与方案的租户、品牌或呼叫方式不一致';
    const snap=row.planSnapshot,numberIds=snap?.callerNumberIds||(row.callerNumberId?[row.callerNumberId]:selected.allowedCallerNumberIds);
    if(!numberIds?.length||!numberIds.every(id=>selected.allowedCallerNumberIds.includes(id)))return '所选号码不在方案允许范围内';
    if(!snap&&selected.supersededBy)return '该版本已被新版替代，请重新选择当前方案';
    if(!row.executionConfig&&!snap&&row.targetSkillGroupId!==undefined&&((row.targetSkillGroupId||'')!==(selected.targetSkillGroupId||'')||(row.contactFlowId||'')!==(selected.contactFlowId||'')||!!row.transferEnabled!==!!selected.transferEnabled))return '任务不能覆盖方案的团队、流程或转人工规则，请重新选择方案';
    const effective={...selected,allowedCallerNumberIds:numberIds,targetSkillGroupId:snap?snap.skillGroupId:selected.targetSkillGroupId,executionQueueId:snap?snap.executionQueueId:selected.executionQueueId,contactFlowId:snap?snap.contactFlowId:selected.contactFlowId,transferEnabled:snap?snap.transferEnabled:selected.transferEnabled};
    const error=CloudResourceRules.validatePlan(effective,true);if(error)return error;
    if(checkReadiness){const readiness=ScenarioReadiness.calculate(row.tenantId,row.callType==='预外呼'?'PREDICTIVE':'IVR_OUTBOUND');if(readiness.status!=='AVAILABLE')return '场景当前为'+readiness.statusLabel+'，请完成配置与验证';}
    return '';
  }
  function canRestoreResourceTask(row) {
    return canAccessObject(row) && ['SUPER_ADMIN', 'ADMIN'].includes(AppState.effectiveAccess().roleCode) && AppState.canAction('task.resume');
  }

  // Local simulation only: stop future dialing for tasks that actually use the
  // number. Never rewrite calls, counters, campaigns or historical snapshots.
  function pauseForNumber(numberId) {
    const resource = number(numberId);
    if (!AppState.effectiveAccess().valid || !AppState.isSuper() || !AppState.canMenu('resources.numbers') || resource.instanceId !== AppState.get().instanceId || resource.businessStatus !== '已隔离') return 0;
    let affected = 0;
    for (const row of CloudCallData.tasks) {
      if (row.instanceId !== resource.instanceId || !['预外呼', 'IVR 外呼'].includes(row.callType) || !['执行中', '待启动', '已暂停'].includes(row.status)) continue;
      const ids = row.planSnapshot?.callerNumberIds || (row.callerNumberId ? [row.callerNumberId] : plan(row.planId).allowedCallerNumberIds || []);
      if (!ids.includes(numberId)) continue;
      const previous = row.resourcePause;
      row.resourcePause = { previousStatus: previous?.previousStatus || row.status, numberIds: [...new Set([...(previous?.numberIds || []), numberId])], pausedAt: previous?.pausedAt || nowText(), reason: '号码业务隔离（本地模拟）' };
      row.status = '已暂停'; row.stopNewDialing = true; row.updatedAt = nowText();
      persistCreatedTask(row); affected++;
    }
    return affected;
  }

  function controlTask(taskId, action, confirmed) {
    const row = taskById(taskId);
    if(row?.displayOnly)return showToast('这是展示样例，请通过“导入与分配”中的模块联动演示测试执行','info');
    if (!canAccessObject(row) || !AppState.canAction(action === 'terminate' ? 'task.abort' : 'task.' + action)) return;
    syncAssignedCustomers();
    const beforeStatus=row.status;
    if(action==='start' && !Number(row.total))return showToast('请先分配客户，空名单不能启动','warning');
    if(action==='start'||action==='resume'){
      if((action==='start'&&row.status!=='待启动')||(action==='resume'&&row.status!=='已暂停'))return;
      if(row.resourcePause){
        if(!canRestoreResourceTask(row))return showToast('号码隔离暂停的任务需有权管理员逐项恢复','warning');
        if(row.resourcePause.numberIds.some(id=>number(id).businessStatus!=='正常'))return showToast('操作未执行：仍有引用号码未恢复服务，请先恢复全部隔离号码','warning');
      }
      const error=dependencyError(row,true);if(error){showToast('操作未执行：'+error,'warning');return;}
    }
    if(action==='terminate'&&!['待分配客户','待启动','执行中','已暂停','异常'].includes(row.status))return;
    if(action==='pause'&&row.status==='执行中'&&!confirmed)return ui.confirm({id:'task-pause',title:'暂停任务',body:'<p>暂停后停止发起新呼叫，已拨出或进行中的通话继续完成并回收结果。之后可继续任务。</p>',confirmText:'确认暂停',onConfirm(){controlTask(taskId,action,true);}});
    if(action==='terminate'&&!confirmed)return ui.confirm({id:'task-terminate',title:'终止任务',danger:true,body:'<p>终止后不能继续本任务。尚未发起的呼叫停止，已发起的通话继续更新实际结果。客户关联与历史记录保留，不自动重新分配。</p>',confirmText:'确认终止',onConfirm(){controlTask(taskId,action,true);}});
    if (action === 'start' || (action === 'resume' && row.resourcePause?.previousStatus === '待启动')) {
      const selectedPlan=plan(row.planId),at=nowText();
      if(!row.planSnapshot)freezePlan(row,selectedPlan,at);
      row.campaignId = `${row.callType === '预外呼' ? 'DEMO-CAM' : 'DEMO-IVR'}-${Date.now().toString().slice(-6)}`;
      row.status = '执行中'; row.startedAt = at; row.updatedAt = at; row.stopNewDialing = false;
      showToast('演示任务已启动，未发起真实呼叫', 'success');
    } else if (action === 'pause' && row.status === '执行中') {
      row.status = '已暂停'; row.stopNewDialing = true; row.updatedAt = nowText();
      showToast(row.callType === '预外呼' ? '已停止发起新呼叫，已发起呼叫将继续更新结果' : '任务已暂停新执行', 'success');
    } else if (action === 'resume' && row.status === '已暂停') {
      row.status = '执行中'; row.stopNewDialing = false; row.updatedAt = nowText(); showToast('任务已继续执行', 'success');
    } else if (action === 'terminate' && ['待分配客户','待启动','执行中', '已暂停', '异常'].includes(row.status)) {
      row.status = '已终止'; row.hasNextAttempt = false; row.stopNewDialing = true; row.updatedAt = nowText();
      showToast(row.callType === '预外呼' ? '任务已终止，已发起呼叫将继续更新实际结果' : '任务已终止，历史结果继续保留', 'success');
    } else return;
    if (action === 'start' || action === 'resume') delete row.resourcePause;
    (row.dispatchHistory||(row.dispatchHistory=[])).push({at:nowText(),actor:AppState.account()?.name||AppState.account()?.nickname||AppState.get().accountId,action:({start:'启动',pause:'暂停',resume:'继续',terminate:'终止'})[action],before:beforeStatus,after:row.status+'（本地演示）'});
    persistCreatedTask(row);
    CloudCallRuntime.addAudit?.(`任务${action}`, row.taskId, row.tenantId, '原状态', row.status);
    navigateTo('cloud-task-center', { taskId: row.taskId, tab: readCenterContext().tab });
  }

  function canDeleteTask(row){return canAccessObject(row)&&!row.displayOnly&&!row.startedAt&&!row.campaignId&&!Number(row.completed)&&['草稿','待分配客户','待启动','已终止'].includes(row.status)&&!(CloudCallData.calls||[]).some(c=>c.taskId===row.taskId);}
  function deleteTask(id,confirmed=false){
    const draft=drafts.find(d=>d.draftId===id||d.taskId===id),row=draft&&canAccessDraft(draft)?draft:taskById(id),isDraft=row===draft;
    if(!row||!(isDraft?canAccessDraft(row):canDeleteTask(row)))return showToast('仅从未启动且无通话记录的任务可以删除','warning');
    if(!confirmed)return ui.confirm({id:'task-delete',title:'删除任务',danger:true,body:'<p>确认删除“'+esc(isDraft?row.values.name||'未命名任务':row.name)+'”？此操作不可恢复。客户本身不会删除；正式关联的客户将返回待分配，草稿预选不占用客户。</p>',confirmText:'确认删除',onConfirm(){deleteTask(id,true);}});
    if(isDraft){drafts=drafts.filter(d=>d!==draft);persist();}
    else {if(!CustomerTasks.releaseUnstartedTask(row))return showToast('客户已有通话或释放失败，未删除任务','warning');row.status='已删除';row.deletedAt=nowText();persistCreatedTask(row);removeListedTask(row.taskId);}
    CloudCallRuntime.addAudit?.('删除未启动任务',row.taskId||row.draftId,row.tenantId,'未启动','已删除');clearActiveContext();showToast('任务已删除，客户保留并返回待分配','success');navigateTo(routeForType(row.callType||row.type));
  }

  function copyTask(taskId) {
    const row = taskById(taskId);
    if (!canAccessObject(row)) return;
    const copied = makeDraft(row.callType);
    copied.tenantId = row.tenantId;
    copied.instanceId = row.instanceId;
    copied.step = 2;
    copied.values = { ...copied.values, name: `复制-${row.name}`.slice(0, 40), total: 0, planId: row.planId || '', skillGroupId: row.targetSkillGroupId || plan(row.planId).targetSkillGroupId || '', callerNumberId: row.callerNumberId || plan(row.planId).allowedCallerNumberIds?.[0] || '', contactFlowId: row.contactFlowId || plan(row.planId).contactFlowId || '', executionQueueId:row.executionQueueId||row.executionConfig?.executionQueueId||'', transferEnabled: !!row.transferEnabled, maxAttemptCount: row.maxAttemptCount ?? '', minAttemptInterval: row.minAttemptInterval ?? '', sourceRef: '' };
    drafts.unshift(copied); persist(); sessionStorage.setItem(activeKey, copied.draftId); AppState.setDirty(true);
    showToast('已复制任务配置；客户需重新分配', 'success');
    navigateTo('cloud-task-create', { draftId: copied.draftId });
  }

  window.addEventListener('app:save-draft', function () { if (activeDraft()) saveDraft(true); });
  window.addEventListener('wizard:configuration-complete', function (event) {
    const draft = activeDraft();
    if (!draft || event.detail?.returnOptions?.draftId !== draft.draftId) return;
    showToast(`${event.detail.requirementLabel || '配置'}已记录变更，提交时会重新校验`, 'warning');
  });

  window.CloudTaskWorkspace = { deleteTask,canDeleteTask,centerActions,filterCustomers,toggleCustomer,clearCustomers,selectFilteredCustomers,start, render, update, setTenant, selectPlan, setResource, saveDraft, next, previous, goStep, goConfigure, submit, cancel, listDraftTasks, openTask, renderCenter, setTaskTab, controlTask, copyTask, clearActiveContext, pauseForNumber, syncAssignedCustomers,
    isLocalSimulationTask(row){return !!row&&row.localPrototypeTask===true&&row.simulation===true&&row.customerSourceMode==='assigned'&&!row.displayOnly&&createdTasks.some(t=>t.taskId===row.taskId&&t.localPrototypeTask===true&&t.tenantId===row.tenantId&&t.instanceId===row.instanceId&&t.callType===row.callType);},
    saveDemoTask(row){if(canAccessObject(row)&&row.simulation){persistCreatedTask(row);return true;}return false;},
    simulationResourceError(row){return canAccessObject(row)?dependencyError(row,false):'当前无权操作此任务';}
  };
  window.Pages = window.Pages || {};
  window.Pages['cloud-task-workspace'] = { render, init() {} };
  window.Pages['cloud-task-center'] = { render: renderCenter, init() {} };
})();
