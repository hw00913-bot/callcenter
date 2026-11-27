(() => {
  'use strict';

  const kinds = ['import','assignment','delivery'];
  const text = value => typeof value === 'string' ? value.trim() : '';
  const skippedAllocation = '当前状态不可自动分配，请由管理员指派。';
  const ruleFailures = new Set([
    '当前匹配缺少可用的培育模板或下发模板。',
    '本次来件指定的分配规则版本不可用，请按原来件核对。',
    '当前分配规则缺少此结果的处理动作。',
    '配置的后续节点无法继续执行。'
  ]);

  function activeScope(context) {
    const current = window.DSession.context();
    if (current?.scope?.kind !== 'tenant' || context?.account?.id !== current.account.id ||
        context?.scope?.id !== current.scope.id || !current.scope.tenant?.brandId ||
        context?.scope?.tenant?.brandId !== current.scope.tenant.brandId ||
        !window.DRolePermissions.moduleEnabled('cloud',current)) return null;
    return current;
  }

  function canView(context) {
    const current = activeScope(context);
    return Boolean(current && /_admin$/.test(window.DSession.roleKey(current)) &&
      window.DSession.allowed('PAGE-2204',current));
  }

  const deletedImport = Object.freeze({deletedImport:true});
  const exportTokens = new WeakMap();
  function canDeleteImport(context) {
    return canView(context) && window.DSession.canWrite?.('PAGE-2204') === true &&
      window.DSession.can?.('F24',activeScope(context)) === true;
  }

  function prefix(context) {
    return window.DSession.prefix + 'batch-failure-v1:' +
      [context.scope.id,context.scope.tenant.brandId].map(encodeURIComponent).join(':') + ':';
  }

  function record(context, kind, input) {
    const current = activeScope(context);
    const reason = text(input?.reason).slice(0,500);
    if (!current || !kinds.includes(kind) || !reason) return {ok:false,error:'失败记录缺少有效的业务信息。'};
    try {
      const reference = text(input.key) || crypto.randomUUID();
      const key = prefix(current) + kind + ':' + encodeURIComponent(reference);
      const previous = localStorage.getItem(key);
      if (previous !== null) {
        const row = JSON.parse(previous);
        if (kind === 'import' && row?.deletedImport === true) return {ok:true,deleted:true};
        const batchId = text(input.batchId).slice(0,160);
        const rowNumber = sourceLine(input.rowNumber);
        if (row?.tenantId === current.scope.id && row.brandId === current.scope.tenant.brandId && row.kind === kind &&
            ((!row.batchId && batchId) || (!row.rowNumber && rowNumber))) {
          if (!row.batchId && batchId) row.batchId = batchId;
          if (!row.rowNumber && rowNumber) row.rowNumber = rowNumber;
          localStorage.setItem(key,JSON.stringify(row));
        }
        return {ok:true,row};
      }
      const row = {
        serial:'FAIL-' + crypto.randomUUID().toUpperCase(),
        tenantId:current.scope.id,brandId:current.scope.tenant.brandId,kind,reason,
        batchId:text(input.batchId).slice(0,160),leadCode:text(input.leadCode).slice(0,160),
        taskId:text(input.taskId).slice(0,160),requestId:text(input.requestId).slice(0,240),
        ...(kind==='import' && text(input.phone) ? {phone:text(input.phone).slice(0,40)} : {}),
        rowNumber:sourceLine(input.rowNumber),
        at:new Date().toISOString()
      };
      localStorage.setItem(key,JSON.stringify(row));
      return {ok:true,row};
    } catch (_) {
      return {ok:false,error:'失败日志暂未保存，请核对本地存储。'};
    }
  }

  function list(context, committedManualBatchIds) {
    if (!canView(context)) return {rows:[],error:'当前账号没有本租户的失败日志查看权限。'};
    const scopedPrefix = prefix(activeScope(context));
    const committedBatches = Array.isArray(committedManualBatchIds) ? new Set(committedManualBatchIds) : null;
    try {
      const rows = [];
      for (let index = 0; index < localStorage.length; index++) {
        const key = localStorage.key(index);
        if (!key?.startsWith(scopedPrefix)) continue;
        const row = JSON.parse(localStorage.getItem(key));
        if (row?.tenantId !== context.scope.id || row.brandId !== context.scope.tenant.brandId ||
            !kinds.includes(row.kind) || !text(row.serial) || !text(row.at)) continue;
        const reference = decodeURIComponent(key.slice(scopedPrefix.length + row.kind.length + 1));
        if (row.kind !== 'import' && reference.startsWith('target:') ||
            row.kind === 'assignment' && reference.startsWith('auto:') && row.reason === skippedAllocation ||
            row.kind === 'assignment' && reference.startsWith('rule:') && !ruleFailures.has(row.reason) ||
            row.kind === 'assignment' && reference.startsWith('file:') && row.reason === '当前租户资料已变化，请刷新后再操作。') continue;
        if (row.kind === 'import' && /^manual-import\/[^/]+\/save\//.test(reference)) row.batchId = '';
        const manualRow = row.kind === 'import' && reference.match(/^manual-import\/([^/]+)\/row\/\d+$/);
        if (manualRow && committedBatches) {
          row.batchId = committedBatches.has(manualRow[1]) ? manualRow[1] : '';
        }
        rows.push(row);
      }
      return {rows:rows.sort((a,b)=>b.at.localeCompare(a.at) || a.serial.localeCompare(b.serial))};
    } catch (_) {
      return {rows:[],error:'本地失败日志暂时无法读取。'};
    }
  }

  function prepareImportExport(context, serial) {
    const current = activeScope(context);
    if (!current || !canDeleteImport(current) || !text(serial)) return {ok:false,error:'当前账号无权删除导入失败记录。'};
    try {
      const base = prefix(current) + 'import:';
      const matches = [];
      for (let index=0;index<localStorage.length;index++) {
        const key = localStorage.key(index);
        if (!key?.startsWith(base)) continue;
        const raw = localStorage.getItem(key);
        const row = JSON.parse(raw);
        if (row?.kind==='import' && row.serial===serial && row.tenantId===current.scope.id &&
            row.brandId===current.scope.tenant.brandId) matches.push({key,raw,row});
      }
      if (matches.length!==1) return {ok:false,error:'这条导入失败记录已变化，请重新打开。'};
      const {key,raw,row} = matches[0];
      const token = Object.freeze({});
      exportTokens.set(token,{key,raw,serial,actor:current.account.id,scope:base});
      return {ok:true,row,token};
    } catch (_) { return {ok:false,error:'无法读取导入失败记录，未删除。'}; }
  }

  function deleteExportedImport(context, token) {
    const current = activeScope(context);
    const proof = token && exportTokens.get(token);
    if (!current || !canDeleteImport(current) || !proof || proof.actor!==current.account.id ||
        proof.scope!==prefix(current)+'import:') return {ok:false,error:'请在当前租户下载这条导入失败记录后再删除。'};
    try {
      if (localStorage.getItem(proof.key)!==proof.raw) {
        exportTokens.delete(token);
        return {ok:false,error:'导入失败记录已变化，请重新下载后再删除。'};
      }
      const tombstone = JSON.stringify(deletedImport);
      localStorage.setItem(proof.key,tombstone);
      if (localStorage.getItem(proof.key)!==tombstone) return {ok:false,error:'无法确认删除结果，请重新打开失败日志。'};
      exportTokens.delete(token);
      return {ok:true,serial:proof.serial};
    } catch (_) { return {ok:false,error:'导入失败记录未删除，请重试。'}; }
  }

  function isImportRowDeleted(context,batchId,line) {
    const current=activeScope(context);
    if (!current || !canView(current) || !text(batchId) || !sourceLine(line)) return false;
    try {
      return JSON.parse(localStorage.getItem(prefix(current)+'import:'+encodeURIComponent('manual-import/'+batchId+'/row/'+line)))?.deletedImport===true;
    } catch (_) { return false; }
  }

  function sourceLine(value) {
    return Number.isSafeInteger(value) && value > 0 ? value : undefined;
  }

  function reference(task, receipt) {
    return {
      batchId:receipt?.importBatchId || receipt?.id || task?.skynet?.intakeId,
      leadCode:task?.localLeadCode || receipt?.localLeadCode || receipt?.originalKey || task?.originalKey,
      taskId:task?.taskId || receipt?.taskId,requestId:receipt?.requestId,rowNumber:sourceLine(receipt?.sourceLine)
    };
  }

  function receiptFailure(receipt) {
    if (!receipt?.completedAt) return null;
    const invalid = receipt.trace?.find(step=>step.nodeId === 'fields' && step.branch === 'invalid');
    if (invalid) return {kind:'import',key:'fields:' + receipt.id,reason:invalid.reason || receipt.reason};
    const reason = receipt.assignmentFailure || receipt.reason;
    return ruleFailures.has(reason) ? {kind:'assignment',key:'rule:' + receipt.id,reason} : null;
  }

  function confirmedAllocationFailure(allocation) {
    return Boolean(allocation?.outcome === 'pending' && !allocation.preview &&
      text(allocation.reason) && allocation.reason !== skippedAllocation);
  }

  function capture(context, state) {
    if (!activeScope(context) || state?.tenant !== context.scope.id) return;
    const brandId = context.scope.tenant.brandId;
    const inScope = row => row.tenant === state.tenant && row.brandId === brandId;
    const receipts = new Map((state.skynetReceipts || []).filter(inScope).map(receipt=>[receipt.id,receipt]));
    for (const receipt of receipts.values()) {
      const failure = receiptFailure(receipt);
      if (failure) record(context,failure.kind,{...reference(null,receipt),...failure});
    }
    for (const task of state.records || []) {
      const processing = task.skynet?.processing;
      if (!inScope(task) || !processing || !task.skynet.roundId) continue;
      const source = reference(task,receipts.get(task.skynet.intakeId));
      const scopedRound = task.taskId + ':' + (processing.followupRoundId || task.skynet.roundId);
      const allocation = processing.allocation;
      if (confirmedAllocationFailure(allocation)) record(context,'assignment',{
        ...source,key:'auto:' + scopedRound,reason:allocation.reason
      });
    }
  }

  function discardDemoRecords(context, {taskIds,receiptIds,requestIds}) {
    const current = activeScope(context);
    if (!current) return;
    try {
      for (const key of Object.keys(localStorage)) {
        if (!key.startsWith(prefix(current))) continue;
        try {
          const row = JSON.parse(localStorage.getItem(key));
          if (row?.tenantId === current.scope.id && row.brandId === current.scope.tenant.brandId &&
              (taskIds.has(row.taskId) || receiptIds.has(row.batchId) || requestIds.has(row.requestId))) {
            localStorage.removeItem(key);
          }
        } catch (_) { /* Leave unreadable records for normal storage recovery. */ }
      }
    } catch (_) { /* The task cleanup is already committed. */ }
  }

  window.DBatchFailureLog = Object.freeze({canView,canDeleteImport,prepareImportExport,deleteExportedImport,isImportRowDeleted,list,record,capture,reference,receiptFailure,confirmedAllocationFailure,discardDemoRecords});
})();
