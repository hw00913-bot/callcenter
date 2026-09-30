/** Independent fictional supplier telephone state; no SDK connection or real credentials. */
(function () {
  'use strict';
  const freeze = value => { Object.freeze(value); Object.values(value).forEach(child => { if (child && typeof child === 'object' && !Object.isFrozen(child)) freeze(child); }); return value; };
  const localTime = timestamp => {
    const d = new Date(timestamp), pad = value => String(value).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };
  // Private tenant metadata is filtered before returning official QueueEntry fields. No waitTime unit is assumed.
  const entry = (tenantId, customerNumber, elapsedSeconds, uniqueId) => ({ tenantId, customerNumber, startTime: localTime(Date.now() - (elapsedSeconds + 5) * 1000), joinTime: localTime(Date.now() - elapsedSeconds * 1000), priority: 0, uniqueId, position: 1 });
  const data = window.CloudCallData, installation = { added: [], reused: [], skipped: [] };
  const supervisorSeeds = [
    { enterpriseId: '7522240', tenantId: 'TEN-NISSAN-HQ', accountId: 'ACC-ADMIN-018', identityId: 'DEMO-TENANT-SUPERVISOR-HQ-9001', cno: '9001', qnos: ['6101', '6102'], bindTel: '80009001' },
    { enterpriseId: '7522241', tenantId: 'TEN-NISSAN-SH', accountId: 'ACC-ADMIN-018', identityId: 'DEMO-TENANT-SUPERVISOR-SH-9002', cno: '9002', qnos: ['6201', '6202'], bindTel: '80009002' }
  ];
  let storedSeatsReadable = true;
  try {
    const raw = window.localStorage?.getItem('account-seat-v1');
    if (raw) { const saved = JSON.parse(raw); storedSeatsReadable = saved?.version === 1 && Array.isArray(saved.seats) && Array.isArray(saved.attempts); }
  } catch (_) { storedSeatsReadable = false; }
  const baseSeats = [
    { enterpriseId: '7522240', tenantId: 'TEN-NISSAN-HQ', cno: '0012', qnos: ['6101', '6102'], bindTel: '80000012', bindType: 3, power: 0 },
    { enterpriseId: '7522240', tenantId: 'TEN-NISSAN-HQ', cno: '1001', qnos: ['6101'], bindTel: '80001001', bindType: 3, power: 0 },
    { enterpriseId: '7522240', tenantId: 'TEN-NISSAN-HQ', cno: '1201', qnos: ['6101'], bindTel: '80001201', bindType: 3, power: 0 },
    { enterpriseId: '7522240', tenantId: 'TEN-NISSAN-HQ', cno: '2103', qnos: ['6102'], bindTel: '80002103', bindType: 3, power: 0 },
    { enterpriseId: '7522241', tenantId: 'TEN-NISSAN-SH', cno: '2201', qnos: ['6201', '6202'], bindTel: '80002201', bindType: 3, power: 0 },
    { enterpriseId: '7522241', tenantId: 'TEN-NISSAN-SH', cno: '2202', qnos: ['6201'], bindTel: '80002202', bindType: 3, power: 0 },
    { enterpriseId: '7522241', tenantId: 'TEN-NISSAN-SH', cno: '2203', qnos: ['6202'], bindTel: '80002203', bindType: 3, power: 0 }
  ];
  const validText = value => typeof value === 'string' && value.length > 0 && value === value.trim();
  const seatKey = seat => JSON.stringify([seat.enterpriseId, seat.tenantId, seat.cno]);
  function existingSeatError(agent) {
    if (!validText(agent.contactCenterIdentityId) || !validText(agent.agentRecordId) || !validText(agent.cno)) return '已有坐席身份或工号无效，未配置班长演示';
    if (agent.lifecycleStatus !== '已启用' || agent.syncStatus !== '同步成功' || agent.callEnabled === false || agent.acceptNewTasks === false) return '已有坐席未启用或未同步成功，未配置班长演示';
    if (data.agents.some(row => row !== agent && (row.contactCenterIdentityId === agent.contactCenterIdentityId || row.agentRecordId === agent.agentRecordId || (row.enterpriseId === agent.enterpriseId && String(row.cno) === agent.cno && row.lifecycleStatus !== '已删除')))) return '已有坐席身份或工号存在冲突，未配置班长演示';
    return '';
  }
  const supervisors = [];
  for (const seed of supervisorSeeds) {
    const skip = reason => installation.skipped.push({ identityId: seed.identityId, tenantId: seed.tenantId, accountId: seed.accountId, reason });
    if (!storedSeatsReadable) { skip('本地坐席记录无法读取，未新增演示坐席'); continue; }
    if (!data || !Array.isArray(data.agents) || window.TenantSupervisorPolicy?.powerFor(seed) !== 1) { skip('没有对应租户的有效管理员关系'); continue; }
    const account = data.accounts.find(row => row.accountId === seed.accountId);
    const existing = data.agents.filter(row => row.tenantId === seed.tenantId && row.enterpriseId === seed.enterpriseId && row.lifecycleStatus !== '已删除' && (row.accountId === seed.accountId || (!row.accountId && row.contactCenterIdentityId === account.linkedIdentityId)));
    if (existing.length > 1) { skip('管理员存在多个坐席关联，保留现有资料并等待核对'); continue; }
    let receipt = seed;
    if (existing.length === 1) {
      const agent = existing[0], error = existingSeatError(agent);
      if (error) { skip(error); continue; }
      const source = baseSeats.find(row => seatKey(row) === seatKey(agent));
      // Reuse this seeded demo administrator's exact existing binding. Never rewrite user data.
      receipt = { ...seed, identityId: agent.contactCenterIdentityId, cno: agent.cno, bindTel: Object.hasOwn(agent, 'softphoneExtension') ? agent.softphoneExtension : source?.bindTel || agent.demoBindTel || (agent.cno === seed.cno ? seed.bindTel : '') };
      installation.reused.push({ identityId: agent.contactCenterIdentityId, agentRecordId: agent.agentRecordId, tenantId: seed.tenantId, accountId: seed.accountId, cno: agent.cno });
    }
    if (!existing.length) {
      if (data.agents.some(row => row.contactCenterIdentityId === seed.identityId || row.agentRecordId === seed.identityId || (row.enterpriseId === seed.enterpriseId && row.cno === seed.cno && row.lifecycleStatus !== '已删除'))) { skip('演示坐席身份或工号已占用，未覆盖现有资料'); continue; }
      data.agents.push({ agentRecordId: seed.identityId, contactCenterIdentityId: seed.identityId, accountId: seed.accountId, tenantId: seed.tenantId, enterpriseId: seed.enterpriseId, cno: seed.cno, userName: account.name || account.nickname || '租户管理员', mobile: account.mobile || '', areaCode: '021', roleId: 'Agent', workMode: 'WEBRTC', lifecycleStatus: '已启用', agentStatus: '离线', syncStatus: '同步成功', callEnabled: true, acceptNewTasks: true, currentCall: false, isAsr: 0, isQualityCheck: 1, simulation: true, evidenceType: 'DEMO', realVerification: '未验证', supervisorFixture: true });
      installation.added.push({ identityId: seed.identityId, tenantId: seed.tenantId, accountId: seed.accountId, cno: seed.cno });
    }
    // Explicit independent supplier fixture. A platform role alone never creates this receipt.
    supervisors.push({ ...receipt, power: 1, confirmed: true, mock: true, source: 'LOCAL_SUPPLIER_TELEPHONE_FIXTURE' });
  }
  window.AliCtiSeatOperationFixtures = freeze({
    simulation: true, source: 'LOCAL_SUPPLIER_TELEPHONE_FIXTURE',
    installation,
    seats: [...new Map([...baseSeats, ...supervisors.map(seed => ({ ...seed, bindType: 3 }))].map(seat => [seatKey(seat), seat])).values()],
    supervisors,
    queues: [
      { enterpriseId: '7522240', tenantId: 'TEN-NISSAN-HQ', qno: '6101', name: '总部销售接听队列', wrapupTime: 30, agentStatuses: [{ cno: '0012', name: '王静', state: '通话' }, { cno: '1201', name: '许佳宁', state: '空闲' }], queueEntries: [entry('TEN-NISSAN-HQ', '13900000881', 12, 'DEMO-QUEUE-HQ-001')] },
      { enterpriseId: '7522240', tenantId: 'TEN-NISSAN-HQ', qno: '6102', name: '总部售后接听队列', wrapupTime: 45, agentStatuses: [{ cno: '0012', name: '王静', state: '通话' }, { cno: '2103', name: '陆文博', state: '整理' }], queueEntries: [] },
      { enterpriseId: '7522241', tenantId: 'TEN-NISSAN-SH', qno: '6201', name: '上海门店销售接听队列', wrapupTime: 30, agentStatuses: [{ cno: '2201', name: '周岚', state: '呼叫中' }, { cno: '2202', name: '沈可欣', state: '空闲' }], queueEntries: [entry('TEN-NISSAN-SH', '13900000982', 8, 'DEMO-QUEUE-SH-001')] },
      { enterpriseId: '7522241', tenantId: 'TEN-NISSAN-SH', qno: '6202', name: '上海门店售后接听队列', wrapupTime: 30, agentStatuses: [{ cno: '2201', name: '周岚', state: '呼叫中' }, { cno: '2203', name: '高宇航', state: '置忙' }], queueEntries: [] }
    ].map(queue => ({ ...queue, agentStatuses: [...new Map([...queue.agentStatuses, ...supervisors.filter(seed => seed.enterpriseId === queue.enterpriseId && seed.tenantId === queue.tenantId && seed.qnos.includes(queue.qno)).map(seed => ({ cno: seed.cno, name: data.accounts.find(account => account.accountId === seed.accountId)?.name || '租户管理员', state: '离线' }))].map(agent => [agent.cno, agent])).values()] }))
  });
})();
