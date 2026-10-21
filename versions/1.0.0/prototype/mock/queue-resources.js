/** Fictional AliCti queue snapshots. No provider request or actual provisioning. */
(function () {
  'use strict';
  const data = window.CloudCallData;
  if (!data || window.AliCtiQueueFixtures) return;
  const scopes = window.DemoFixtureKit?.scopes || [];
  const groups = data.physicalSkillGroups || [];
  function members(group) {
    if (!group) return [];
    const ids = new Set((data.agentSkills || []).filter(r => r.physicalGroupId === group.physicalGroupId && r.status === '已生效' && /^[0-9]+$/.test(String(r.skillLevel)) && Number(r.skillLevel) >= 1 && Number(r.skillLevel) <= 10).map(r => r.identityId));
    return [...new Set((data.agents || []).filter(a => ids.has(a.contactCenterIdentityId) && a.tenantId === group.tenantId && a.enterpriseId === group.enterpriseId && a.lifecycleStatus === '已启用' && a.acceptNewTasks !== false).map(a => a.cno).filter(cno => typeof cno === 'string' && cno))];
  }
  const rows = [], bindings = [];
  for (const [code, tenantId, first] of [['HQ', 'TEN-NISSAN-HQ', '61'], ['SH', 'TEN-NISSAN-SH', '62']]) {
    const scope = scopes.find(s => s.code === code);
    const enterpriseId = scope?.enterpriseId || (code === 'HQ' ? '7522240' : '7522241');
    const sales = groups.find(g => g.physicalGroupId === (scope?.physicalGroupId || `PHY-${code}-SALES`) && g.tenantId === tenantId && g.enterpriseId === enterpriseId);
    const after = groups.find(g => g.physicalGroupId === (scope?.aftersalesPhysicalGroupId || `PHY-${code}-AFTER`) && g.tenantId === tenantId && g.enterpriseId === enterpriseId);
    const label = code === 'HQ' ? '总部' : '上海门店';
    const salesMembers = members(sales);
    rows.push({ enterpriseId, tenantId, qno: first + '01', name: label + '销售接听队列', status: 'ACTIVE', statusLabel: '可关联', strategy: 'rrmemory', strategyLabel: '轮选', cnos: salesMembers, simulation: true });
    rows.push({ enterpriseId, tenantId, qno: first + '02', name: label + '售后接听队列', status: 'ACTIVE', statusLabel: '可关联', strategy: 'rrmemory', strategyLabel: '轮选', cnos: members(after).slice(0, 1), simulation: true });
    rows.push({ enterpriseId, tenantId, qno: first + '03', name: label + '备用接听队列', status: 'ACTIVE', statusLabel: '可关联', strategy: 'rrmemory', strategyLabel: '轮选', cnos: [], simulation: true });
    rows.push({ enterpriseId, tenantId, qno: first + '04', name: label + '暂停接听队列', status: 'STOPPED', statusLabel: '不可关联', strategy: 'rrmemory', strategyLabel: '轮选', cnos: [], simulation: true });
    if (sales) bindings.push({ enterpriseId: sales.enterpriseId, tenantId, physicalGroupId: sales.physicalGroupId, qno: first + '01', checkedAt: '', checkedFingerprint: '', updatedAt: '', updatedBy: '', simulation: true });
  }
  rows.push({ enterpriseId: 'DEMO-ENT-003', tenantId: 'TEN-EPI-HQ', qno: '6101', name: '奕派总部接听队列', status: 'ACTIVE', statusLabel: '可关联', strategy: 'rrmemory', strategyLabel: '轮选', cnos: [], simulation: true });
  const supplierSkills = groups.map((g, index) => ({ enterpriseId: g.enterpriseId, tenantId: g.tenantId, physicalGroupId: g.physicalGroupId, skillId: Number.isSafeInteger(g.providerSkillId) && g.providerSkillId > 0 ? g.providerSkillId : 900 + index, demoSkillId: !(Number.isSafeInteger(g.providerSkillId) && g.providerSkillId > 0), cnos: members(g), simulation: true }));
  rows.forEach(q => { q.description = q.name; q.weight = 1; q.queueTimeout = 600; q.memberTimeout = 25; q.wrapupTime = 30; q.maxLen = 0; q.musicClass = 'default'; q.sayAgentno = false; q.retry = 5; q.serviceLevel = 10; q.vipSupport = 0; q.joinEmpty = 0; q.announceSound = 0; q.announcePosition = 0; q.announcePositionFrequency = 0; const scope = scopes.find(s => s.tenantId === q.tenantId); const physical = q.qno.endsWith('01') ? scope?.physicalGroupId : q.qno.endsWith('02') ? scope?.aftersalesPhysicalGroupId : null; const skill = supplierSkills.find(s => s.physicalGroupId === physical && s.enterpriseId === q.enterpriseId); q.queueSkills = skill ? [{ skillId: skill.skillId, skillLevel: 1 }] : []; q.demoSkillId = !!skill?.demoSkillId; });
  // Deep freezing prevents local member edits from silently rewriting provider snapshots.
  function freeze(value) { Object.freeze(value); for (const child of Object.values(value)) if (child && typeof child === 'object' && !Object.isFrozen(child)) freeze(child); return value; }
  window.AliCtiQueueFixtures = freeze({ schemaVersion: 1, simulation: true, source: 'LOCAL_DEMONSTRATION', queues: rows, bindings, supplierSkills });
})();
