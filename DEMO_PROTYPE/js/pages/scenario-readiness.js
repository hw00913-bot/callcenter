/** 云联络中心四场景准备度：按租户独立计算，不把配置完整度等同于可用。 */
(function () {
  'use strict';
  const ui = PlatformUI;
  const esc = ui.escape;
  const meta = {
    MANUAL_OUTBOUND: { label: '人工外呼', icon: '人', description: '在业务系统 PhoneBar 发起；中台负责身份、方案、号码与结果。', entry: 'manual-outbound' },
    PREDICTIVE: { label: '预外呼', icon: '预', description: '客户先接通，再进入本租户服务团队分配空闲坐席。', entry: 'predictive-tasks' },
    IVR_OUTBOUND: { label: 'IVR 外呼', icon: 'IVR', description: '按已发布联系流自动完成通知、按键收集及结构化结果。', entry: 'ivr-tasks' },
    INBOUND: { label: '呼入服务', icon: '入', description: '实例级 IVR 锁定租户后，仅在本租户技能组排队与接听。', entry: 'inbound-service' }
  };
  const statusMeta = {
    UNCONFIGURED: { label: '未配置', detail: '存在阻断运行的必要配置缺项' },
    PENDING_TEST: { label: '已配置待验证', detail: '配置已齐全，但尚未完成首次或变更后测试' },
    AVAILABLE: { label: '演示可用', detail: '本地配置与模拟测试通过；真实上线仍需完成 POC' },
    ABNORMAL: { label: '异常', detail: '配置齐全但最近测试失败，或运行依赖出现异常' }
  };
  let selectedType = 'MANUAL_OUTBOUND';
  let selectedTenantId = '';
  CloudCallData.scenarioConfigurationOverrides = CloudCallData.scenarioConfigurationOverrides || [];

  function tenant(tenantId) { return (CloudCallData.tenants || []).find(item => item.tenantId === tenantId); }
  function instanceOf(row) { return (CloudCallData.instances || []).find(item => item.instanceId === row?.instanceId); }
  function yes(key, label, detail, route, state, verification) { return { key, label, detail, route, ready: true, state: state || '已配置', verification: verification || '' }; }
  function no(key, label, detail, route) { return { key, label, detail, route, ready: false, state: '缺失', verification: '' }; }

  function facts(tenantId) {
    const row = tenant(tenantId);
    const instance = instanceOf(row);
    const agents = (CloudCallData.agents || []).filter(item => item.tenantId === tenantId && item.instanceId === row?.instanceId && item.lifecycleStatus === '已启用');
    const groups = (CloudCallData.physicalSkillGroups || []).filter(item => item.tenantId === tenantId && item.instanceId === row?.instanceId && item.status === '已启用' && CloudResourceRules.members(item).length > 0);
    const numbers = (CloudCallData.phoneNumbers || []).filter(item => item.instanceId === row?.instanceId && item.businessStatus === '正常' && (item.authorizedTenantIds || []).includes(tenantId));
    const outboundNumbers = numbers.filter(item => CloudResourceRules.usableNumber(item,tenantId,'呼出'));
    const inboundNumbers = numbers.filter(item => CloudResourceRules.usableNumber(item,tenantId,'呼入'));
    const plans = (CloudCallData.callPlans || []).filter(item => item.tenantId === tenantId && item.instanceId === row?.instanceId && item.status === '已发布' && !item.supersededBy);
    const systems = (CloudCallData.businessSystems || []).filter(item => item.instanceId === row?.instanceId && item.status === '已接入' && (item.authorizedTenantIds||[]).includes(tenantId));
    const routes = (CloudCallData.inboundRoutes || []).filter(item => item.instanceId === row?.instanceId && item.status === '已发布');
    const inboundBranches = routes.flatMap(route => (route.branches || []).filter(branch => branch.tenantId === tenantId).map(branch => ({ ...branch, route })));
    return { row, instance, agents, groups, numbers, outboundNumbers, inboundNumbers, plans, systems, routes, inboundBranches };
  }

  function requirementsFor(tenantId, type) {
    const f = facts(tenantId);
    const predictivePlan = f.plans.find(item => item.callType === '预外呼');
    const ivrPlan = f.plans.find(item => item.callType === 'IVR 外呼' && item.contactFlowId);
    const inboundPlan = f.plans.find(item => item.callType === '呼入');
    const phonebar = f.systems.find(item => item.phoneBarPocStatus && item.phoneBarPocStatus !== '未验证');
    const commonAgent = f.agents.length ? yes('agent', '已开通坐席', `${f.agents.length} 名已启用坐席，归属当前租户`, 'agent-maintenance') : no('agent', '已开通坐席', '需要在云呼叫管理页面维护至少一名已启用坐席', 'agent-maintenance');
    const commonSkill = f.groups.length ? yes('skill', '租户服务团队', `${f.groups.length} 个技能组具有有效成员`, 'agent-skills') : no('skill', '租户服务团队', '需要建立本租户物理组并分配有效成员', 'agent-skills');
    const outboundNumber = f.outboundNumbers.length ? yes('number', '授权呼出号码', `${f.outboundNumbers.length} 个同实例号码可用于呼出`, 'numbers') : no('number', '授权呼出号码', '需要超管授权同实例可用呼出号码', 'numbers');
    if (type === 'MANUAL_OUTBOUND') return [
      f.systems.length ? yes('business-system', '业务系统接入', `${f.systems[0].name} 已接入，支持管理员按手机号查询账号`, 'business-systems') : no('business-system', '业务系统接入', '需要先完成业务系统接入，再按手机号查询并关联账号', 'business-systems'),
      commonAgent,
      f.systems.some(s=>BusinessAccountBinding.reviewAccounts(s.businessSystemId,tenantId).some(a=>a.validity.valid)) ? yes('business-binding', '业务账号关联', '本租户存在有效账号关联；每次外呼仍须校验实际发起人的账号、租户授权与绑定关系', 'tenant-business-systems') : no('business-binding', '业务账号关联', '暂无有效关联，请租户管理员检查双方账号状态、租户授权及绑定关系', 'tenant-business-systems'),
      commonSkill,
      outboundNumber,
      phonebar ? yes('phonebar', 'PhoneBar 接入', `${phonebar.name}：${phonebar.phoneBarPocStatus}，仍需完成接入验证`, 'business-systems', '待接入验证', 'POC-01') : no('phonebar', 'PhoneBar 接入', '需在业务系统完成 PhoneBar 组件及本人鉴权配置', 'business-systems')
    ];
    const flowUsage=type==='PREDICTIVE'?'预外呼':'IVR外呼';
    const flows=CloudCallData.contactFlows.filter(x=>x.instanceId===f.row?.instanceId&&x.status==='已发布'&&x.usage===flowUsage);
    const flowCheck=flows.length?yes('ivr','可用语音流程',flows.length+' 个已发布流程，创建任务时选择','call-plans'):no('ivr','可用语音流程','请先在阿里发布对应流程并同步','call-plans');
    if(type==='PREDICTIVE')return [commonAgent,commonSkill,outboundNumber,flowCheck];
    if(type==='IVR_OUTBOUND')return [outboundNumber,flowCheck,CloudCallData.physicalSkillGroups.some(g=>g.instanceId===f.row?.instanceId&&g.tenantId===tenantId&&g.status==='已启用')?yes('execution-config','活动执行资源','任务中选择已有执行资源；无人工调度需实际验证','call-plans'):no('execution-config','活动执行资源','请管理员维护本租户执行资源','skill-mappings')];
    const validBranch = f.inboundBranches.find(item => item.physicalGroupId);
    return [
      f.inboundNumbers.length ? yes('number', '呼入号码', `${f.inboundNumbers.length} 个同实例号码具备呼入用途`, 'numbers') : no('number', '呼入号码', '需要可用呼入号码并绑定入口 IVR', 'numbers'),
      validBranch ? yes('route', '租户锁定与路由', `${validBranch.route.contactFlowId} → ${validBranch.physicalGroupId}`, 'inbound-routes') : no('route', '租户锁定与路由', '需要入口 IVR 分支/默认规则锁定当前租户', 'inbound-routes'),
      commonSkill,
      commonAgent
    ];
  }

  function calculate(tenantId, type) {
    const requirements = requirementsFor(tenantId, type);
    const test = (CloudCallData.scenarioTests || []).filter(item => item.tenantId === tenantId && item.scenarioType === type).sort((a, b) => String(b.testedAt).localeCompare(String(a.testedAt)))[0] || null;
    const readyCount = requirements.filter(item => item.ready).length;
    const readinessPercent = requirements.length ? Math.round(readyCount / requirements.length * 100) : 0;
    let status = readyCount < requirements.length ? 'UNCONFIGURED' : 'PENDING_TEST';
    if (readyCount === requirements.length && test?.status === 'PASS' && !requirements.some(item=>item.verification)) status = 'AVAILABLE';
    if (readyCount === requirements.length && test?.status === 'FAIL') status = 'ABNORMAL';
    return {
      tenantId, type, ...meta[type], requirements, readinessPercent, missing: requirements.filter(item => !item.ready),
      verificationItems: requirements.filter(item => item.verification), test, status, statusLabel: statusMeta[status].label,
      statusExplanation: statusMeta[status].detail
    };
  }

  function list(tenantId) { return Object.keys(meta).map(type => calculate(tenantId, type)); }

  function activeTenantId() {
    if (!AppState.isSuper()) return AppState.get().tenantId;
    const ids = AppState.availableTenants().map(item => item.tenantId);
    if (!ids.includes(selectedTenantId)) selectedTenantId = ids[0] || '';
    return selectedTenantId;
  }

  function renderCard(item) {
    const missingCopy = item.missing.length ? `${item.missing.length} 项缺失：${item.missing.map(row => row.label).join('、')}` : item.statusExplanation;
    return `<button class="readiness-card status-${item.status.toLowerCase()}" onclick="ScenarioReadiness.open('${item.type}','${item.tenantId}')"><div><span class="scenario-icon">${esc(item.icon)}</span><div><strong>${esc(item.label)}</strong><small>${esc(item.description)}</small></div></div><div class="readiness-card-state">${ui.status(item.statusLabel)}<b>${item.readinessPercent}%</b></div><div class="readiness-progress"><i style="width:${item.readinessPercent}%"></i></div><p>${esc(missingCopy)}</p><em>查看条件与测试 →</em></button>`;
  }

  function cards(tenantId) { return `<div class="readiness-card-grid" data-anno-page="home" data-anno-label="四场景独立准备度" data-anno-kind="region" data-anno-fields="FLD-009,FLD-010,FLD-011,FLD-012,FLD-013,FLD-014">${list(tenantId).map(renderCard).join('')}</div>`; }

  function testMarkup(test) {
    if (!test) return `<div class="test-empty"><span>未测试</span><strong>配置齐全后执行本场景首次验证</strong><p>测试结果必须记录方法、时间与摘要。</p></div>`;
    const labels = { PASS: '模拟通过', FAIL: '失败', STALE: '需复测', POC_PENDING: '待 POC' };
    const tone = test.status === 'PASS' ? 'pass' : test.status === 'FAIL' ? 'fail' : 'pending';
    return `<div class="test-result ${tone}"><span>${labels[test.status] || '待确认'}</span><strong>${esc(test.testedAt)}</strong></div><dl><dt>测试方式</dt><dd>${esc(test.method)}</dd><dt>结果摘要</dt><dd>${esc(test.summary)}</dd></dl>`;
  }

  function nextStepMarkup(current) {
    const available = current.status === 'AVAILABLE';
    const labels = {
      MANUAL_OUTBOUND: ['查看人工外呼通话', '该场景在接入业务系统的 PhoneBar 发起，中台不创建任务。'],
      PREDICTIVE: ['创建预外呼任务', '先保存呼叫配置，再从客户任务分配名单。'],
      IVR_OUTBOUND: ['创建 IVR 外呼任务', '先保存联系流和执行配置，再从客户任务分配名单。'],
      INBOUND: ['查看呼入通话', '呼入由客户来电触发，中台不创建任务。']
    };
    const copy = labels[current.type];
    return `<div class="scenario-next-step ${available ? 'ready' : 'blocked'}"><div><span>${available ? '下一步' : '尚未开放下一步'}</span><strong>${esc(copy[0])}</strong><small>${esc(available ? copy[1] : '请先补齐必要配置并通过最近一次场景测试。')}</small></div><button class="btn btn-primary" ${available ? '' : 'disabled'} onclick="ScenarioReadiness.next('${current.type}')">${esc(copy[0])}</button></div>`;
  }

  function render(options) {
    const opts = options || {};
    if (opts.tenantId && AppState.isSuper() && AppState.availableTenants().some(item => item.tenantId === opts.tenantId)) selectedTenantId = opts.tenantId;
    if (opts.scenario && meta[opts.scenario]) selectedType = opts.scenario;
    const tenantId = activeTenantId();
    const current = calculate(tenantId, selectedType);
    const currentTenant = tenant(tenantId) || {};
    const role = AppState.effectiveAccess().roleCode;
    const canConfigure = role !== 'OPERATOR';
    const tenantSelector = AppState.isSuper() ? `<label class="scenario-tenant-select"><span>查看租户</span><select onchange="window.Pages['scenario-readiness'].selectTenant(this.value)">${AppState.availableTenants().map(row => `<option value="${row.tenantId}" ${row.tenantId === tenantId ? 'selected' : ''}>${esc(row.name)}（${esc(row.organizationLabel)}）</option>`).join('')}</select></label>` : '';
    const taskScenario = ['PREDICTIVE', 'IVR_OUTBOUND'].includes(current.type);
    const journeyActions = taskScenario && current.status === 'AVAILABLE'
      ? { create: `ScenarioReadiness.next('${current.type}')` }
      : !taskScenario && current.status === 'AVAILABLE'
        ? { records: `ScenarioReadiness.next('${current.type}')` }
        : {};
    return `<section class="platform-page scenario-readiness-page" data-anno-page="scenario-readiness" data-anno-label="场景准备度详情" data-anno-kind="region" data-anno-fields="FLD-009,FLD-010,FLD-011,FLD-012,FLD-013,FLD-014">
      ${ui.pageHeader('场景准备度', `${currentTenant.name || '当前租户'} · 配置完整度只说明必要项是否齐全，可用状态还必须通过场景测试。`, `<button class="btn" onclick="PlatformUI.openCapabilityCenter()">支持与待验证事项</button><button class="btn" onclick="navigateTo('home')">返回工作台</button>`)}
      ${ui.journey({ current: 'prepare', context: `${current.label} · ${current.statusLabel}`, branch: taskScenario ? '任务型场景' : `${current.label}无需中台任务`, actions: journeyActions, skipped: taskScenario ? [] : ['create', 'monitor'], notes: taskScenario ? {} : { create: '无需创建任务', monitor: current.type === 'MANUAL_OUTBOUND' ? '在业务系统执行' : '由客户来电触发' } })}
      <div class="scenario-context-row">${tenantSelector}<span>当前实例：${esc(instanceOf(currentTenant)?.brandCustomerName || '—')}</span><span>数据范围：${esc(currentTenant.organizationLabel || '—')}</span></div>
      <div class="scenario-detail-tabs">${list(tenantId).map(item => `<button class="${item.type === selectedType ? 'active' : ''}" onclick="window.Pages['scenario-readiness'].selectScenario('${item.type}')"><span>${esc(item.icon)}</span><div><strong>${esc(item.label)}</strong><small>${esc(item.statusLabel)} · ${item.readinessPercent}%</small></div></button>`).join('')}</div>
      <div class="scenario-detail-hero status-${current.status.toLowerCase()}"><div><span>${esc(current.label)}当前状态</span><h2>${esc(current.statusLabel)}</h2><p>${esc(current.statusExplanation)}</p></div><div class="scenario-score"><strong>${current.readinessPercent}%</strong><span>配置完整度</span></div></div>
      ${nextStepMarkup(current)}
      <div class="content-grid scenario-detail-grid">
        <article class="panel-card span-8"><div class="panel-header"><div><h2>必要条件</h2><p>${current.requirements.length - current.missing.length}/${current.requirements.length} 项已满足</p></div></div><div class="panel-body requirement-list">${current.requirements.map(item => `<div class="requirement-row ${item.ready ? 'ready' : 'missing'}"><span>${item.ready ? '✓' : '!'}</span><div><strong>${esc(item.label)}</strong><small>${esc(item.detail)}</small>${item.verification ? `<em>上线前须完成真实环境验证</em>` : ''}</div>${ui.status(item.state)}${canConfigure && window.RouteRuntime?.canRoute(item.route) ? `<button onclick="ScenarioReadiness.configure('${current.type}','${item.key}','${item.route}','${esc(item.label)}',${item.ready})">${item.ready ? '查看配置' : '去配置'}</button>` : canConfigure ? '<i>超管维护</i>' : '<i>只读</i>'}</div>`).join('')}</div></article>
        <article class="panel-card span-4"><div class="panel-header"><div><h2>最近场景测试</h2><p>首次可用与关键变更后均需测试</p></div></div><div class="panel-body scenario-test-panel">${testMarkup(current.test)}<button class="btn btn-primary" ${current.missing.length || !canConfigure ? 'disabled' : ''} onclick="ScenarioReadiness.previewTest('${current.type}')">${current.test ? '重新测试' : '开始首次测试'}</button>${current.missing.length ? `<small class="test-blocked">仍有 ${current.missing.length} 项缺失，暂不能测试</small>` : ''}</div></article>
        <article class="panel-card span-12"><div class="panel-header"><div><h2>状态如何计算</h2><p>不允许管理员手工把场景改成“可用”</p></div></div><div class="panel-body readiness-rule-chain"><div><span>1</span><strong>必要配置</strong><small>有缺项 → 未配置</small></div><i>→</i><div><span>2</span><strong>场景验证</strong><small>未测 → 已配置待验证</small></div><i>→</i><div><span>3</span><strong>最近结果</strong><small>通过 → 可用；失败 → 异常</small></div><i>→</i><div><span>4</span><strong>关键变更</strong><small>受影响场景退回待验证</small></div></div></article>
      </div>
    </section>`;
  }

  function open(type, tenantId) { selectedType = meta[type] ? type : 'MANUAL_OUTBOUND'; if (tenantId) selectedTenantId = tenantId; navigateTo('scenario-readiness', { scenario: selectedType, tenantId: selectedTenantId }); }
  function next(type) {
    const current = calculate(activeTenantId(), type);
    if (current.status !== 'AVAILABLE') { showToast(`请先让${current.label}场景通过测试`, 'warning'); return false; }
    if (type === 'PREDICTIVE') return CloudTaskWorkspace.start('预外呼');
    if (type === 'IVR_OUTBOUND') return CloudTaskWorkspace.start('IVR 外呼');
    navigateTo('cloud-call-records', { type: type === 'INBOUND' ? '呼入' : '人工外呼' });
    return true;
  }
  function configure(type, requirement, route, requirementLabel, wasReady) {
    showToast(`进入“${meta[type].label} / ${requirementLabel}”配置`, 'info');
    AppState.beginConfiguration(route, { contextType: 'scenario', fromRoute: 'scenario-readiness', scenarioType: type, tenantId: activeTenantId(), requirementKey: requirement, requirementLabel, wasReady: !!wasReady });
  }

  function markConfigurationCompleted(context) {
    const existing = CloudCallData.scenarioConfigurationOverrides.find(item => item.tenantId === context.tenantId && item.scenarioType === context.scenarioType && item.requirementKey === context.requirementKey);
    const now = new Date().toLocaleString('zh-CN', { hour12: false }).replaceAll('/', '-');
    if (existing) existing.updatedAt = now;
    else CloudCallData.scenarioConfigurationOverrides.push({ tenantId: context.tenantId, scenarioType: context.scenarioType, requirementKey: context.requirementKey, summary: '已在原型中完成配置动作', updatedAt: now });
    CloudCallData.scenarioTests.unshift({ testId: `STALE-${Date.now()}`, tenantId: context.tenantId, scenarioType: context.scenarioType, status: 'STALE', testedAt: now, method: `${context.requirementLabel}发生关键变更`, summary: '原测试结果已失效，场景必须重新验证后才能恢复可用。' });
    showToast(`${meta[context.scenarioType].label}已退回“已配置待验证”`, 'warning');
  }

  function previewTest(type) {
    const current = calculate(activeTenantId(), type);
    if (current.missing.length) { showToast('仍有必要配置缺项，暂不能测试', 'warning'); return; }
    const methods = {
      MANUAL_OUTBOUND: '由白名单业务用户在 DCC PhoneBar 发起本人呼叫，核对身份、租户、默认方案、号码与结果回流。',
      PREDICTIVE: '使用 20 条白名单客户执行小批量预外呼，核对先接通客户、再分配本租户空闲坐席。',
      IVR_OUTBOUND: '使用白名单号码走完整 IVR，核对联系流版本、节点、按键与终态；纯 IVR 不检查录音。',
      INBOUND: '拨打共享号码走指定分支，核对租户锁定、排队、人工接听、录音和结果。'
    };
    const hasPoc = current.verificationItems.length > 0;
    ui.openLayer('scenario-test-run', `<div class="layer-header"><div><span>场景验证</span><h2>${esc(current.label)}测试</h2></div><button onclick="PlatformUI.closeLayer('scenario-test-run')">×</button></div><div class="layer-body" data-anno-page="scenario-readiness" data-anno-label="场景测试方法与结果" data-anno-kind="region" data-anno-fields="FLD-013,FLD-014,FLD-054">${ui.alert(hasPoc ? 'warning' : 'info', hasPoc ? '存在投产 POC 阻断' : '本次使用静态白名单模拟', hasPoc ? `${current.verificationItems.map(item => item.verification).join('、')} 仍需真实环境验收；本次不会记录为可用。` : '演示只更新原型内的最近测试结果，不调用真实阿里云或业务系统。')}<div class="test-method-card"><span>验证方法</span><strong>${esc(methods[type])}</strong></div><div class="test-check-grid">${current.requirements.map(item => `<div><span>✓</span><strong>${esc(item.label)}</strong><small>${esc(item.state)}</small></div>`).join('')}</div></div><div class="layer-footer"><button class="btn" onclick="PlatformUI.closeLayer('scenario-test-run')">取消</button><button class="btn btn-primary" onclick="ScenarioReadiness.completeTest('${type}','${hasPoc ? 'POC_PENDING' : 'PASS'}')">${hasPoc ? '记录为待 POC' : '记录模拟检查结果'}</button></div>`, 'wide');
  }

  function completeTest(type, status) {
    const current=calculate(activeTenantId(),type);
    if(!AppState.canMenu('settings.plans')||current.missing.length)return;
    status=current.verificationItems.length?'POC_PENDING':'PASS';
    const now = new Date().toLocaleString('zh-CN', { hour12: false }).replaceAll('/', '-');
    const summaries = {
      PASS: '本地模拟检查完成；没有执行真实电话，不能作为 POC 或上线验收证据。',
      POC_PENDING: '中台配置检查已完成，但真实 PhoneBar 本人鉴权仍需 POC，不标记可用。'
    };
    CloudCallData.scenarioTests.unshift({ testId: `TEST-${Date.now()}`, tenantId: activeTenantId(), scenarioType: type, status, testedAt: now, method: '按页面展示的白名单场景方法执行', summary: summaries[status] });
    ui.closeLayer('scenario-test-run');
    showToast(status === 'PASS' ? '本地模拟检查通过；真实 POC 状态未改变' : '已记录待 POC，场景仍不可标记可用', status === 'PASS' ? 'success' : 'warning');
    navigateTo('scenario-readiness', { scenario: type, tenantId: activeTenantId(), historyNavigation: true });
  }

  window.ScenarioReadiness = { meta, statusMeta, calculate, list, cards, open, next, configure, previewTest, completeTest, markConfigurationCompleted };
  window.Pages = window.Pages || {};
  window.Pages['scenario-readiness'] = {
    render,
    init() {},
    selectScenario(type) { selectedType = type; navigateTo('scenario-readiness', { scenario: type, tenantId: activeTenantId(), historyNavigation: true }); },
    selectTenant(tenantId) { selectedTenantId = tenantId; navigateTo('scenario-readiness', { scenario: selectedType, tenantId, historyNavigation: true }); }
  };
  window.addEventListener('scenario:configuration-complete', event => markConfigurationCompleted(event.detail || {}));
})();
