(() => {
  'use strict';

  const evidencePrefix = 'd-contact-210-skynet-delivery-result-v1:';
  const externalOutcomes = ['unknown','failed','accepted'];
  const missingRecord = '当前租户没有这条下发记录，或记录已不可用。';

  function create(readCommittedState, commitTask) {
    const {fields} = window.DSkynetIntakeFixtures;
    const deliveryPeers = direction => window.DOrganization?.deliveryPeers?.(direction,{includeInactive:true}) || [];

    function authority(direction) {
      const current = DSession.context();
      if (current?.scope?.kind !== 'tenant' || !current.scope.tenant?.brandId ||
          !DRolePermissions.moduleEnabled('cloud',current)) return null;
      if (direction === 'sent' && DSkynetConfig.canManage(current)) return current;
      if (direction === 'incoming' && /_(admin|ops)$/.test(DSession.roleKey(current)) &&
          DSession.allowed('PAGE-2204',current)) return current;
      return null;
    }

    function canAct(direction) {
      const current = authority(direction);
      return Boolean(current && DSession.can('F26',current) && DSession.canWrite('PAGE-2204'));
    }

    function deliveryDestinations(delivery) {
      if (Array.isArray(delivery?.targets)) {
        const targets = delivery.targets.filter(target => ['internalTenant','externalSystem'].includes(target?.type) && typeof target.id === 'string' && target.id);
        return [...new Map(targets.map(target => [[target.type,target.id].join(':'),target])).values()];
      }
      return delivery?.target ? [delivery.target] : [];
    }

    function applicationSnapshot(target,delivery) {
      const source = target.application || delivery.application;
      if (!source) return null;
      if (target.application && delivery.application && ['id','revision','connectionKey'].some(key=>
          target.application[key] !== delivery.application[key])) return null;
      if (source.id !== target.id || !['id','revision','connectionKey'].every(key=>
          typeof source[key]==='string' && source[key].trim())) return null;
      const keys = ['id','key','name','appId','interfaceName','revision','connectionKey'];
      return Object.fromEntries(keys.flatMap(key=>typeof source[key]==='string' ? [[key,source[key]]] : []));
    }

    // Project only committed sends so a failed source save cannot create an incoming record.
    function outgoing(scope, peers, incomingOnly = false, state = readCommittedState(scope.id), records = state?.records) {
      if (!state) return [];
      const batches = new Map((state.skynetReceipts || []).filter(receipt=>receipt.tenant===scope.id &&
        receipt.brandId===scope.tenant.brandId).map(receipt=>[receipt.id,receipt]));
      return (records || []).flatMap(task => {
        const delivery = task.skynet?.delivery;
        if (task.tenant !== scope.id || task.brandId !== scope.tenant.brandId || task.taskStatus !== '已结束' ||
            delivery?.status !== '已下发' || delivery.simulated !== true ||
            !task.taskId || delivery.taskId !== task.taskId || delivery.roundId !== task.skynet.roundId ||
            !delivery.sentAt || !['manual','automatic'].includes(delivery.trigger)) return [];
        const targets = deliveryDestinations(delivery);
        const batchId = batches.get(task.skynet.intakeId)?.importBatchId || task.skynet.intakeId;
        const originalReference = [scope.id,task.taskId,delivery.roundId].map(encodeURIComponent).join('/');
        return targets.flatMap(target => {
          const application = target.type === 'externalSystem' ? applicationSnapshot(target,delivery) : null;
          const storeMatch = target.type === 'internalTenant' ? target.storeMatch || delivery.storeMatch : null;
          if (target.type === 'externalSystem' && (target.application || delivery.application) && !application) return [];
          // Completed external sends are historical facts. Their visibility never depends on today's application directory.
          const destination = target.type === 'internalTenant'
            ? peers.find(peer => peer.id === target.id && peer.id !== scope.id && peer.brandId === task.brandId)
            : !incomingOnly && target.type === 'externalSystem' && typeof target.id === 'string' && target.id ?
              {id:target.id,label:target.label || application?.name || target.id} : null;
          if (!destination) return [];
          const reference = targets.length > 1 ? originalReference + '/to/' + encodeURIComponent(target.id) : originalReference;
          return [{
            id:'DL-' + reference,requestId:'REQ-' + reference,taskId:task.taskId,roundId:delivery.roundId,
            batchId,leadCode:task.localLeadCode || task.originalKey,
            templateId:delivery.templateId,templateName:delivery.templateName,templateVersion:delivery.templateVersion,
            trigger:delivery.trigger,typeLabel:delivery.typeLabel,modeLabel:delivery.modeLabel,
            ...(delivery.directStore ? {storeName:delivery.directStore.name,storeCode:delivery.directStore.id} :
              storeMatch?.storeCode ? {storeName:storeMatch.storeName || storeMatch.store?.name || '',storeCode:storeMatch.storeCode} : {}),
            target:{id:destination.id,label:target.label || destination.name || destination.label,type:target.type,
              ...(application ? {application} : {}),...(storeMatch ? {storeMatch:JSON.parse(JSON.stringify(storeMatch))} : {}),
              ...(target.additionalReceiver ? {additionalReceiver:true} : {})},
            ...(storeMatch ? {storeMatch:JSON.parse(JSON.stringify(storeMatch))} : {}),
            ...(target.additionalReceiver ? {additionalReceiver:true} : {}),
            ...(application ? {application,applicationId:application.id,applicationName:application.name,
              revision:application.revision,connectionKey:application.connectionKey,externalId:delivery.externalId || 'EXT-' + reference} :
              target.type === 'externalSystem' ? {legacyApplication:true,externalId:delivery.externalId || ''} : {}),
            senderTenantId:scope.id,senderTenantName:scope.tenant.name,sentAt:delivery.sentAt,simulated:true
          }];
        });
      });
    }

    function incoming(scope) {
      const receiver = {id:scope.id,name:scope.tenant.name,brandId:scope.tenant.brandId};
      return deliveryPeers('incoming').filter(peer => peer.id !== scope.id && peer.brandId === receiver.brandId)
        .flatMap(peer => outgoing({id:peer.id,tenant:peer},[receiver],true));
    }

    function evidenceKey(row) {
      const tenantId = row.target.type === 'internalTenant' ? row.target.id : row.senderTenantId;
      return evidencePrefix + encodeURIComponent(tenantId) + ':' + row.id;
    }

    function result(row) {
      const stored = JSON.parse(localStorage.getItem(evidenceKey(row)));
      if (!stored) return {status:'awaitingReceipt',attempt:1,scenarioCalls:[]};
      const internal = row.target.type === 'internalTenant';
      const statuses = internal ? ['received'] : ['awaitingReceipt',...externalOutcomes];
      if (stored.requestId !== row.requestId || stored.targetId !== row.target.id ||
          stored.targetType !== row.target.type || stored.sentAt !== row.sentAt || !statuses.includes(stored.status) ||
          stored.senderTenantId !== row.senderTenantId || stored.taskId !== row.taskId || stored.roundId !== row.roundId ||
          !Number.isSafeInteger(stored.attempt) || stored.attempt < 1 ||
          !internal && row.application && (stored.applicationId !== row.application.id ||
            stored.revision !== row.application.revision || stored.connectionKey !== row.application.connectionKey || stored.externalId !== row.externalId) ||
          stored.scenarioCalls !== undefined && !Array.isArray(stored.scenarioCalls) ||
          (['received','accepted'].includes(stored.status) && (!stored.receiptId || !stored.resultAt))) {
        throw Error('交接凭据与原请求不一致。');
      }
      const {status,attempt,receiptId,resultAt} = stored;
      return {status,attempt,receiptId,resultAt,scenarioCalls:stored.scenarioCalls || []};
    }

    function receiverTask(row, direction, brandId) {
      if (row.target.type !== 'internalTenant' || row.status !== 'received' || !row.receiptId) return {};
      const receiver = readCommittedState(row.target.id);
      const task = receiver?.records.find(item => {
        const link = item.skynet?.internalHandoff;
        return item.tenant === row.target.id && item.brandId === brandId && link?.deliveryId === row.id &&
          link.receiptId === row.receiptId && link.requestId === row.requestId && link.senderTenantId === row.senderTenantId &&
          link.senderTaskId === row.taskId && link.senderRoundId === row.roundId;
      });
      if (!task) return {};
      const {skynet} = task;
      const {receiverRoundId,taskCreatedAt} = skynet.internalHandoff;
      return {receiverTaskId:task.taskId,receiverRoundId,taskCreatedAt,
        ...(direction === 'incoming' ? {receiverTaskStatus:task.taskStatus,
          receiverRuleName:skynet.assignmentRuleName,receiverRuleVersion:skynet.assignmentRuleVersion,
          receiverStrategyName:skynet.nurtureTemplateName,receiverStrategyVersion:skynet.nurtureTemplateVersion} : {})};
    }

    function list(direction) {
      const current = authority(direction);
      if (!current) return {rows:[],error:'当前账号没有本租户的下发记录查看权限。'};
      try {
        const rows = direction === 'sent' ? outgoing(current.scope,deliveryPeers('outgoing')) : incoming(current.scope);
        return {rows:rows.map(row => {
          const settled = {...row,...result(row)};
          return {...settled,...receiverTask(settled,direction,current.scope.tenant.brandId)};
        })
          .sort((a,b) => b.sentAt.localeCompare(a.sentAt) || a.id.localeCompare(b.id))};
      } catch (_) {
        return {rows:[],error:'本地交接记录暂时无法读取，请核对原记录。'};
      }
    }

    function statusLabel(row) {
      const labels = {
        received:'已接收（模拟）',accepted:'已受理（模拟）',failed:'明确失败（模拟）',unknown:'回执待核'
      };
      return labels[row.status] || (row.target.type === 'internalTenant' ? '待接收' : '待回执');
    }

    function forResponsibleSeat(taskId, roundId) {
      const current = DSession.context();
      const scope = current?.scope;
      const accountId = current?.account?.id;
      const brandId = scope?.tenant?.brandId;
      if (scope?.kind !== 'tenant' || !brandId || !accountId || !taskId || !roundId ||
          !DRolePermissions.moduleEnabled('cloud',current) ||
          !DSession.allowed('PAGE-2202',current) || !DSession.can('F37',current)) return null;

      try {
        const state = readCommittedState(scope.id);
        const task = state?.records.find(item => item.tenant === scope.id && item.brandId === brandId &&
          item.taskId === taskId && item.skynet?.roundId === roundId && item.skynet.delivery?.roundId === roundId);
        const seat = task?.ownerId && state.seats?.find(item => item.id === task.ownerId && item.tenant === scope.id &&
          (!item.brandId || item.brandId === brandId) && item.accountId === accountId &&
          item.enabled === true && item.bindingState === '已关联');
        if (!seat) return null;

        const rows = outgoing(scope,deliveryPeers('outgoing'),false,state,[task]).map(row => {
          const {status,attempt,receiptId} = result(row);
          return {target:row.target,application:row.application,externalId:row.externalId,requestId:row.requestId,status,attempt,receiptId};
        });
        return {rows};
      } catch (_) {
        return {rows:[],error:'当前任务的下发凭据暂时无法读取，请刷新结果。'};
      }
    }

    function actionRow(direction, id, type) {
      if (!canAct(direction)) return {error:'当前账号没有本租户的交接办理权限。'};
      const {rows,error} = list(direction);
      const row = rows.find(item => item.id === id && item.target.type === type);
      return row ? {row} : {error:error || missingRecord};
    }

    function rememberExternalFailure(row) {
      return window.DBatchFailureLog?.record(DSession.context(),'delivery',{
        key:'external:' + row.id + ':' + row.attempt,batchId:row.batchId,leadCode:row.leadCode,taskId:row.taskId,
        requestId:row.requestId,reason:'外部下发第 ' + row.attempt + ' 次请求明确失败（模拟）。'
      }) || {ok:true};
    }

    function storedExternalFailure(row) {
      const logged = rememberExternalFailure(row);
      return logged.ok ? {row} : {row,error:'失败回执已保存。' + logged.error};
    }

    function externalEvidence(row,status,receiptId,attempt,at) {
      if (!row.application) return [];
      const app = row.application;
      const labels = {awaitingReceipt:'已按原应用和原请求重新发送（模拟）。',accepted:'原下发请求已获外部应用受理（模拟）。',
        failed:'原下发请求收到明确失败回执（模拟）。',unknown:'原下发请求回执待核（模拟）。'};
      return [{callId:[row.requestId,app.connectionKey,attempt,status,at].join(':'),at,scenario:'下发',
        applicationId:app.id,applicationName:app.name || '',revision:app.revision,connectionKey:app.connectionKey,
        operation:status === 'awaitingReceipt' ? '外部下发重试' : '外部下发回执',taskId:row.taskId,roundId:row.roundId,
        requestId:row.requestId,externalId:receiptId || row.externalId,status:status === 'accepted' ? 'success' :
          status === 'failed' ? 'failed' : status === 'unknown' ? 'unavailable' : 'pending',message:labels[status],simulated:true}];
    }

    function store(row, status, receiptId, attempt = row.attempt) {
      const at = new Date().toISOString();
      const result = {status,attempt,receiptId,resultAt:status === 'awaitingReceipt' ? undefined : at,
        scenarioCalls:[...(row.scenarioCalls || []),...externalEvidence(row,status,receiptId,attempt,at)]};
      try {
        localStorage.setItem(evidenceKey(row),JSON.stringify({
          ...result,requestId:row.requestId,taskId:row.taskId,roundId:row.roundId,senderTenantId:row.senderTenantId,
          targetId:row.target.id,targetType:row.target.type,sentAt:row.sentAt,
          ...(row.application ? {applicationId:row.application.id,applicationName:row.application.name,
            revision:row.application.revision,connectionKey:row.application.connectionKey,externalId:row.externalId} : {})
        }));
        const saved = {...row,...result};
        return status === 'failed' ? storedExternalFailure(saved) : {row:saved};
      } catch (_) {
        return {error:'本次模拟交接结果未保存，请重试。'};
      }
    }

    function accept(id) {
      const {row,error} = actionRow('incoming',id,'internalTenant');
      if (!row) return {error};
      if (row.status === 'received') return {row};
      return store(row,'received','RCV-' + row.id.slice(3));
    }

    function taskOptions(id) {
      const {row,error} = actionRow('incoming',id,'internalTenant');
      if (!row || row.status !== 'received' || !row.receiptId || row.receiverTaskId) {
        return {rules:[],strategies:[],error:error || '请先确认接收流水，每条流水可建立一个本租户任务。'};
      }
      return DSkynetIntake.handoffOptions(DReview21.state(),DSession.context());
    }

    function receivedInput(row, current) {
      const source = readCommittedState(row.senderTenantId);
      const {brandId} = current.scope.tenant;
      const task = source?.records.find(item => {
        const delivery = item.skynet?.delivery;
        return item.tenant === row.senderTenantId && item.brandId === brandId && item.taskId === row.taskId &&
          item.taskStatus === '已结束' && delivery?.status === '已下发' && delivery.roundId === row.roundId &&
          delivery.sentAt === row.sentAt &&
          deliveryDestinations(delivery).some(target => target.type === 'internalTenant' && target.id === current.scope.id);
      });
      if (!task) return null;
      const intake = source.skynetReceipts?.find(item => item.id === task.skynet.intakeId &&
        item.tenant === row.senderTenantId && item.brandId === brandId);
      const snapshot = task.businessImportSnapshot?.values || {};
      return Object.fromEntries(fields.map(({key,businessKey}) => [key,
        intake?.mapped?.[key] ?? snapshot[businessKey] ?? task[businessKey] ?? task[key]]));
    }

    async function createTask(id, selection) {
      const initial = authority('incoming');
      if (!initial || !canAct('incoming')) return {error:'当前账号没有本租户的接收建任务权限。'};
      const createForReceipt = async () => {
        const state = await DReview21.ensureState();
        const current = authority('incoming');
        if (!current || current.account.id !== initial.account.id || current.scope.id !== initial.scope.id ||
            current.scope.tenant.brandId !== initial.scope.tenant.brandId || state?.tenant !== current.scope.id) {
          return {error:'当前租户或账号已变化，请重新打开接收记录。'};
        }
        const {row,error} = actionRow('incoming',id,'internalTenant');
        if (!row) return {error};
        if (row.receiverTaskId) return {row,duplicate:true};
        if (row.status !== 'received' || !row.receiptId) return {error:'请先确认本租户接收流水。'};
        const input = receivedInput(row,current);
        if (!input) return {error:'原接收线索资料暂不可用，请核对原请求。'};
        const handoff = {deliveryId:row.id,receiptId:row.receiptId,requestId:row.requestId,
          senderTenantId:row.senderTenantId,senderTenantName:row.senderTenantName,
          senderTaskId:row.taskId,senderRoundId:row.roundId,
          ...(row.storeMatch ? {storeMatch:JSON.parse(JSON.stringify(row.storeMatch))} : {}),
          ...(row.additionalReceiver ? {additionalReceiver:true} : {})};
        const output = commitTask(state,(draft,nativeWindow) =>
          DSkynetIntake.stageHandoffTask(draft,current,handoff,input,selection,nativeWindow));
        if (output.error) return output;
        return {row:{...row,...receiverTask(row,'incoming',current.scope.tenant.brandId)}};
      };
      try {
        const locks = window.navigator?.locks;
        return await (locks ? locks.request(evidencePrefix + 'create:' + initial.scope.id,createForReceipt) : createForReceipt());
      } catch (_) {
        return {error:'本次任务尚未确认建立，请刷新后核对原流水。'};
      }
    }

    function expectedExternalIdentity(row,expected) {
      return expected && expected.requestId === row.requestId && expected.targetId === row.target.id &&
        expected.applicationId === row.application?.id && expected.connectionKey === row.application?.connectionKey;
    }

    function simulateExternal(id, outcome, expectedAttempt, expected) {
      const {row,error} = actionRow('sent',id,'externalSystem');
      if (!row) return {error};
      if (expectedAttempt !== undefined && row.attempt !== expectedAttempt) return {error:'原请求已重试，请刷新后核对。'};
      if (!externalOutcomes.includes(outcome)) return {error:'请选择有效的模拟回执结果。'};
      if (!row.application && row.status === 'accepted' && outcome === 'accepted') return {row};
      if (!row.application) return {error:'历史下发记录尚无应用关联，仅可查看原凭据。'};
      if (!expectedExternalIdentity(row,expected)) return {error:'回执的请求、目标或应用连接身份与原次下发不一致。'};
      if (row.status === outcome) return outcome === 'failed' ? storedExternalFailure(row) : {row};
      if (row.status === 'accepted') return {error:'原请求已受理，可查看原受理回执。'};
      if (row.status === 'failed') return {error:'原请求已明确失败，请先按原请求重试。'};
      return store(row,outcome,outcome === 'accepted' ? 'ACK-' + row.id.slice(3) : undefined);
    }

    function retryExternal(id, expected) {
      const {row,error} = actionRow('sent',id,'externalSystem');
      if (!row) return {error};
      if (row.status !== 'failed') return {error:'仅明确失败的原请求可重试。'};
      if (!row.application) return {error:'原请求未关联可核验的下发应用，不能重新发送。'};
      if (expected?.attempt !== row.attempt || !expectedExternalIdentity(row,expected)) {
        return {error:'原请求次数、目标或应用连接身份已变化，请刷新后核对。'};
      }
      let selected;
      try { selected = window.DIntegrationApplications?.resolveScenarioApplication(DSession.context(),'下发',row.application.id,row.application); }
      catch (_) { return {error:'原下发应用暂不可核对，未重新发送。'}; }
      if (!selected?.ok || selected.status !== 'available' || selected.application?.id !== row.application.id ||
          selected.application.connectionKey !== row.application.connectionKey) {
        return {error:selected?.message || '原下发应用已失效或配置版本已变化，未重新发送。'};
      }
      const logged = rememberExternalFailure(row);
      if (!logged.ok) return {error:logged.error};
      return store(row,'awaitingReceipt',undefined,row.attempt + 1);
    }

    function discardDemoEvidence(context, taskIds) {
      const current = DSession.context();
      if (!taskIds.size || current?.scope.kind !== 'tenant' || current.account.id !== context.account.id ||
          current.scope.id !== context.scope.id) return;
      try {
        for (const key of Object.keys(localStorage)) {
          if (!key.startsWith(evidencePrefix)) continue;
          try {
            const row = JSON.parse(localStorage.getItem(key));
            if (row?.senderTenantId === current.scope.id && taskIds.has(row.taskId)) localStorage.removeItem(key);
          } catch (_) { /* Leave unreadable records for normal storage recovery. */ }
        }
      } catch (_) { /* The task cleanup is already committed. */ }
    }

    return Object.freeze({canView:direction => Boolean(authority(direction)),canAct,list,forResponsibleSeat,statusLabel,
      accept,taskOptions,createTask,simulateExternal,retryExternal,discardDemoEvidence});
  }

  window.createSkynetDeliveryRecords = create;
})();
