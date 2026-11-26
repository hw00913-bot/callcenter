/* The AI blacklist has its own scope data. Keep the original cloud provider records and shared refusals. */
(() => {
  'use strict';

  const policy = window.DContactPolicy;
  const {check,checkBatch} = policy;
  const key = policy.key;
  const isTianrunCode = code => code === '天润' || code === 'TIANRUN';
  const isTianrun = binding => binding?.providerCode === 'TIANRUN' || isTianrunCode(binding?.platformCode);
  const withoutTianrun = bindings => (bindings || []).filter(binding => !isTianrun(binding));

  function projectScope(scope) {
    const groups = (scope.groups || []).concat(scope.deletedGroups || []);
    function projectGroup(group) {
      return {
        ...group, platformBindings:withoutTianrun(group.platformBindings),
        ...(group._retiredBindings ? {_retiredBindings:withoutTianrun(group._retiredBindings)} : {})
      };
    }
    function projectRow(row) {
      const group = groups.find(item => item.id === row.groupId);
      const footprints = (row._retiredRemote || []).concat(group?.platformBindings || [],
        row._remoteHistoryKnown === true ? [] : group?._retiredBindings || []);
      const syncEntries = Object.entries(row.platformSync || {});
      const aiReleaseComplete = row._removalPending === true &&
        (footprints.some(isTianrun) || syncEntries.some(([code]) => isTianrunCode(code))) &&
        footprints.every(isTianrun) && syncEntries.every(([code]) => isTianrunCode(code));
      const sync = Object.fromEntries(syncEntries.filter(([code]) => !isTianrunCode(code)));
      const next = {
        ...row, platformSync:sync,
        ...(row._retiredRemote ? {_retiredRemote:withoutTianrun(row._retiredRemote)} : {})
      };
      if (aiReleaseComplete) {
        next._terminal = 'released';
        delete next._removalPending;
      }
      return next;
    }
    return {
      ...scope,
      ...(Array.isArray(scope.groups) ? {groups:scope.groups.map(projectGroup)} : {}),
      ...(Array.isArray(scope.deletedGroups) ? {deletedGroups:scope.deletedGroups.map(projectGroup)} : {}),
      ...(Array.isArray(scope.rows) ? {rows:scope.rows.map(projectRow)} : {}),
      ...(Array.isArray(scope.history) ? {history:scope.history.map(projectRow)} : {})
    };
  }

  // Reuse the original policy's validation, refusal journal and revision checks.
  // Its AI view reads a projection of any old scope until that view is saved.
  const storage = {
    getItem(name) {
      const stored = localStorage.getItem(name);
      if (name !== key || stored === null) return stored;
      const data = JSON.parse(stored);
      const {aiSpecialScopes,...view} = data;
      if (view.specialScopes) {
        view.specialScopes = aiSpecialScopes || Object.fromEntries(
          Object.entries(view.specialScopes).map(([scope,value]) => [scope,projectScope(value)])
        );
      }
      return JSON.stringify(view);
    },
    setItem(name,value) {
      if (name !== key) return localStorage.setItem(name,value);
      const stored = localStorage.getItem(key);
      const prior = stored === null ? null : JSON.parse(stored);
      const next = JSON.parse(value);
      localStorage.setItem(key,JSON.stringify({
        ...prior,...next,
        specialScopes:prior?.specialScopes || {},
        aiSpecialScopes:next.specialScopes
      }));
    }
  };

  function fixtures(scope) {
    const source = scope === undefined || scope === 'platform:ai-original-demo'
      ? window.DNativeModules?.ai?.fixtures : window.DSeed.specialFixtures?.[scope];
    return projectScope(source || {groups:[],rows:[],calls:[]});
  }

  const ai = window.createDContactPolicy(window.DSession,storage,fixtures);
  policy.getSpecial = ai.getSpecial;
  policy.reconcileSpecial = ai.reconcileSpecial;
  policy.saveSpecial = function (scope,snapshot,operation,version,requestId,target) {
    if (isTianrunCode(target?.platformCode) ||
        snapshot?.groups?.some(group => group.platformBindings?.some(isTianrun)) ||
        snapshot?.rows?.some(row => Object.keys(row.platformSync || {}).some(isTianrunCode))) {
      throw new Error('AI 外呼黑名单仅支持原有 AI 平台。');
    }
    return ai.saveSpecial(scope,snapshot,operation,version,requestId,target);
  };
  policy.check = (tenantId,phone,method,options) =>
    (method === 'AI' ? ai.check : check)(tenantId,phone,method,options);
  policy.checkBatch = (tenantId,numbers,method,complete,options) =>
    (method === 'AI' ? ai.checkBatch : checkBatch)(tenantId,numbers,method,complete,options);
})();
