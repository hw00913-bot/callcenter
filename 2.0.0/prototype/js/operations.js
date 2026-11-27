(function () {
  'use strict';
  const e = value => window.DUI.esc(value == null ? '' : String(value));
  const dt = value => value ? new Date(value).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false}) : '—';
  const assignmentPage = 'PAGE-21008';
  function actor() { return DSession.context(); }
  function canView(context) {
    return DReview21.allowedScope(context) && DReview21.isAdmin(context) && DSession.allowed('PAGE-2226',context);
  }
  function canManage(context=actor()) {
    return canView(context)&&DSession.roleKey(context).endsWith('_admin')&&DSession.can('F24',context);
  }
  function same(state) { return canManage() && state?.tenant === actor()?.scope.id; }
  function modeOf(state, seat) { return state.seatModes?.[seat.id] || ''; }
  const isSkynetTask = task => Boolean(task?.skynet);
  function canViewTask(task, context=actor()) {
    return !isSkynetTask(task) || canManage(context) && window.DSkynetIntake?.inScope(context,task) === true;
  }
  const unowned = (state,task) => task?.tenant === state.tenant && Boolean(task.taskId) && !task.ownerId;
  const settled = task => !task.assignmentPending&&!task.pendingReassignment;
  const deliveryState = task => window.DSkynetIntake?.deliveryState?.(task);
  const awaitsDeliveryOwner = task => !task.ownerId && deliveryState(task)?.status === '待下发';
  function pendingWecomAssignment(state,task) {
    if (!isSkynetTask(task) || task.tenant!==state?.tenant || !canViewTask(task)) return null;
    const assignment = window.DSkynetIntake?.wecomAssignmentState?.(state,actor(),task);
    return assignment?.status==='待指定' || assignment?.status==='待改派' ? assignment : null;
  }
  function canQueue(state, task) {
    if (pendingWecomAssignment(state,task)) return true;
    if (unowned(state,task) && awaitsDeliveryOwner(task)) return canViewTask(task);
    return unowned(state,task) && task.taskStatus === '待分配' &&
      (isSkynetTask(task) ? canViewTask(task) && task.requiredMode === '人工外呼' &&
        (!task.skynet.processing || task.skynet.processing.method === '人工外呼') : ['人工外呼', '预外呼'].includes(task.requiredMode));
  }
  function canAssign(state, task) {
    return canQueue(state,task) && settled(task) &&
      (!isSkynetTask(task) || Boolean(task.skynet.roundId) &&
        (!task.skynet.assignment || Boolean(pendingWecomAssignment(state,task))));
  }
  function canRedispatch(state,task) {
    return !isSkynetTask(task)&&unowned(state,task)&&settled(task)&&task.taskStatus==='未接听'&&
      (task.requiredMode==='预外呼'||!task.requiredMode&&Boolean(task.expectedSeatId));
  }
  function deliveryOwnerEligibility(state,seat) {
    const member = DOrganization.members(state.tenant).find(row=>row.account.id===seat.accountId);
    const grant = member?.member;
    return member?.account.enabled && grant?.enabled && grant.modules?.includes('cloud') && grant.pages?.includes('PAGE-2202')
      ? '' : '坐席账号需具备工作台权限';
  }
  function eligibility(state, task, seat) {
    if (!seat || seat.tenant !== state.tenant) return '请选择本租户坐席';
    const skynet = isSkynetTask(task);
    if (skynet && (!canViewTask(task) || seat.brandId && seat.brandId !== task.brandId)) return '请选择当前授权范围内的坐席';
    if (skynet && (seat.enabled !== true || seat.bindingState !== '已关联' || !seat.accountId)) return '坐席需启用并关联内部账号';
    if (task.eligibleSeatIds && !task.eligibleSeatIds.includes(seat.id)) return '不在本任务可分配范围';
    if (pendingWecomAssignment(state,task)) {
      return window.DSkynetIntake?.wecomSeatEligibility?.(state,actor(),task,seat) ?? '无法核对企微坐席资格';
    }
    if (awaitsDeliveryOwner(task)) return deliveryOwnerEligibility(state,seat);
    if (DReview21Workbench.contactBusy(state,task)) return DReview21Workbench.contactWaitReason;
    const reason = DReview21Workbench.seatCapacity(state,seat);
    if (reason) return reason;
    const mode = modeOf(state,seat);
    const required = canRedispatch(state,task)?'预外呼':task.requiredMode;
    if (!required) return '任务呼叫方式待确认';
    if (mode !== required) return mode ? '外呼方式不匹配' : '坐席未上线';
    return '';
  }
  function waitReason(state, task) {
    if (task.assignmentPending) return '分配结果确认中';
    if (task.taskStatus==='待接听') return '正在安排电话，等待实际接听';
    if (task.pendingReassignment) return '正在安排电话，原跟进人暂时保留';
    if (awaitsDeliveryOwner(task)) return '等待管理员指派下发坐席';
    const wecom = pendingWecomAssignment(state,task);
    if (wecom) return wecom.reason || (wecom.status==='待改派' ? '等待管理员改派企微坐席' : '等待管理员指定企微坐席');
    const processing = task.skynet?.processing;
    if (processing && processing.method !== '人工外呼') return task.waitReason || processing.destination;
    if (isSkynetTask(task) && task.taskStatus === '待处理') return task.waitReason || '等待后续处理';
    if (isSkynetTask(task) && task.taskStatus === '待分配' && processing?.allocation?.workWindow) {
      return task.waitReason || processing.allocation.reason;
    }
    if (DReview21Workbench.contactBusy(state,task)) return DReview21Workbench.contactWaitReason;
    if (isSkynetTask(task)) {
      if (task.requiredMode==='人工外呼' && !state.seats.some(seat=>seat.tenant===state.tenant &&
          (!seat.brandId || seat.brandId===task.brandId) && modeOf(state,seat)==='人工外呼')) {
        return '暂无坐席登录人工外呼，任务等待符合条件的坐席上线';
      }
      return state.seats.some(seat=>!eligibility(state,task,seat)) ? '等待管理员指派' : '暂无符合条件的坐席';
    }
    if (canRedispatch(state,task)) return '本次预外呼未接听，可重新分配';
    if (task.taskStatus==='待安排'&&task.waitReason) return task.waitReason;
    if (!task.requiredMode) return '任务呼叫方式待确认';
    const seats=state.seats.filter(s=>s.tenant===state.tenant && s.enabled && s.bindingState==='已关联');
    if (!seats.length) return '暂无符合条件的坐席';
    const qualified=seats.filter(seat=>!DReview21Workbench.seatCapacity(state,{...seat,quotaMax:null}));
    if (!qualified.length) return '暂无值班坐席';
    const matching=qualified.filter(s=>modeOf(state,s)===task.requiredMode && (!task.eligibleSeatIds || task.eligibleSeatIds.includes(s.id)));
    if (!matching.length) return '暂无符合条件的坐席';
    const capacity = matching.map(seat=>DReview21Workbench.seatCapacity(state,seat));
    if (capacity.every(reason=>reason==='今日接收量已满')) return '坐席接收量已满';
    if (capacity.every(Boolean) && capacity.includes('今日接收量暂不可核对')) return '坐席接收量暂不可核对';
    return '等待管理员分配';
  }
  function assign(state, task, seat) {
    const redispatch = canRedispatch(state,task);
    const skynet = isSkynetTask(task);
    if (!same(state) || !(redispatch||canAssign(state,task)) ||
        skynet && (!state.records.includes(task) || !state.seats.includes(seat) || !DReview21.isLatest(state)) ||
        eligibility(state, task, seat)) return false;
    const pendingDelivery = awaitsDeliveryOwner(task) ? deliveryState(task) : null;
    const wecom = pendingWecomAssignment(state,task);
    if (redispatch) task.requiredMode='预外呼';
    if (wecom) {
      if (!window.DSkynetIntake?.assignWecomSeat?.(state,actor(),task,seat)) return false;
      task.assignedOn = state.today;
    } else if (pendingDelivery) {
      Object.assign(task,{ownerId:seat.id,assignedOn:state.today,taskStatus:'待下发',requiredMode:'',waitReason:''});
      task.skynet = {...task.skynet,delivery:pendingDelivery};
    } else if (task.requiredMode==='预外呼') {
      task.taskStatus='待接听';
      task.expectedSeatId=seat.id;task.waitReason='正在安排通话';
    } else {
      DReview21Workbench.assign(state,task,seat);task.waitReason='';task.assignmentType='人工分配';
    }
    const at = new Date().toISOString();
    task.lastCheckedAt=at;
    if (skynet) {
      const {account} = actor();
      task.skynet = {...task.skynet,assignment:{roundId:task.skynet.roundId, seatId:seat.id, operatorId:account.id, operatorName:account.name, at}};
    }
    return true;
  }
  const style=`
    .op-task-dialog [hidden]{display:none!important}
    .op-help{color:var(--ui-text-muted,#8c8c8c);font-size:12px;margin:8px 0}
    .op-empty{padding:36px;text-align:center;color:var(--ui-text-muted,#8c8c8c)}
    .op-task-dialog{
      margin:auto;width:min(660px,calc(100vw - 32px));max-height:calc(100dvh - 40px);
      overflow:hidden;border:1px solid var(--ui-border,#e8e8e8);border-radius:var(--ui-card-radius,8px);
      padding:0;color:var(--ui-text,#262626);background:#fff;box-shadow:0 12px 36px #10182829
    }
    .op-task-dialog[open]{display:flex;flex-direction:column}
    .op-task-dialog::backdrop{background:rgba(16,24,40,.38)}
    .op-dialog-header,.op-task-dialog>.layer-footer{
      flex:none;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:12px 20px
    }
    .op-dialog-header{border-bottom:1px solid var(--ui-border,#e8e8e8)}
    .op-dialog-header h2{margin:0;font-size:16px;line-height:24px}
    .op-dialog-header .btn{padding:0 8px;font-size:19px}
    .op-dialog-content{flex:1 1 auto;min-height:0;overflow:auto;padding:16px 20px}
    .op-dialog-content dl{display:grid;grid-template-columns:110px minmax(0,1fr);gap:10px 12px;margin:0}
    .op-dialog-content dt{color:var(--ui-text-secondary,#595959)}
    .op-dialog-content dd{margin:0;overflow-wrap:anywhere}
    .op-dialog-content .field{display:grid;gap:6px;margin-top:12px}
    .op-dialog-content .field :is(textarea,select){width:100%;box-sizing:border-box}
    .op-task-dialog>.layer-footer{justify-content:flex-end;flex-wrap:wrap;border-top:1px solid var(--ui-border,#e8e8e8);background:#fff}
    .op-alert{background:#fff7e6;color:#874d00;border-radius:6px;padding:10px 12px;margin:12px 0}
    .op-dialog-error{flex:none;background:#fff2f0;color:#a8071a;margin:0 20px 8px}
    .op-pill{display:inline-block;border-radius:5px;background:#e6f4ff;color:#0958d9;padding:3px 7px}
  `;
  function current(entry) {
    const context=actor();
    return canView(context)&&entry.state.tenant===context.scope.id&&entry.identity===context.account.id+'|'+context.scope.id&&
      DApp.currentPage()===entry.pageId&&DSession.allowed(entry.pageId)&&entry.host.isConnected;
  }
  function commit(entry,affected,change) {
    if(!current(entry)||!canManage()||!DReview21.isLatest(entry.state))return false;
    const state=entry.state;
    const snapshots=[...new Set(affected)].map(item=>[item,structuredClone(item)]);
    try {
      if(change()&&DReview21.save(state))return true;
    } catch (_) { /* Restore the affected tasks and seats before reporting the failure. */ }
    for(const [item,before] of snapshots){
      for(const key of Object.keys(item))if(!Object.hasOwn(before,key))delete item[key];
      Object.assign(item,before);
    }
    return false;
  }
  function refresh(entry,message) { if(!current(entry))return;entry.refresh?.(entry);if(message)DUI.toast(message); }
  function taskDialog(entry,title,content,actions,feedback,extraClass='') {
    const node=entry.host.ownerDocument.createElement('dialog');
    node.className=`op-task-dialog ${extraClass}`.trim();
    node.setAttribute('aria-label',title);
    node.innerHTML=`<header class="op-dialog-header"><h2>${e(title)}</h2>
      <button type="button" class="btn btn-quiet" data-close autofocus aria-label="关闭${e(title)}">×</button></header>
      <div class="op-dialog-content">${content}</div>${feedback}<footer class="layer-footer">${actions}</footer>`;
    entry.host.parentElement.append(node);
    node.addEventListener('close',()=>node.remove(),{once:true});
    node.querySelectorAll('[data-close]').forEach(button=>button.onclick=()=>node.close());
    node.showModal();
    return node;
  }

  function taskDetailFields(state,record,ownerId) {
    const fields=[
      ['客户',record.name+' · '+record.phone],['业务分类',record.category],['培育任务',record.taskId||'—'],
      ['线索编码',record.originalKey],['线索来源',record.source],
      ['跟进人',state.seats.find(seat=>seat.id===ownerId)?.name || '—'],['已完成跟进',(record.followupCount||0)+' 次'],
      ['任务状态',record.taskStatus||'—'],['意向车系',record.intentionSeries||record.visitDetails?.intentCar]
    ];
    if (isSkynetTask(record)) {
      const {roundId, nurtureTemplateName, nurtureTemplateVersion, deliveryTemplateName, deliveryTemplateVersion,
        intakeId, latestIntakeId, assignment, processing, internalHandoff} = record.skynet;
      fields.push(['当前轮次',roundId],['培育模板版本',[nurtureTemplateName, nurtureTemplateVersion].filter(Boolean).join(' · ')],
        ['下发模板版本',[deliveryTemplateName, deliveryTemplateVersion].filter(Boolean).join(' · ')],['原来件编号',intakeId]);
      if (internalHandoff?.receiptId) {
        fields.push(['接收流水单号',internalHandoff.receiptId],
          ['发送租户',internalHandoff.senderTenantName || internalHandoff.senderTenantId],
          ['发送方原任务',internalHandoff.senderTaskId],['发送方原轮次',internalHandoff.senderRoundId]);
      }
      if (processing) {
        fields.push(['处理方式',processing.method],['处理去向',processing.destination]);
        if (processing.targetTaskId) fields.push(['目标外呼任务',processing.targetTaskName],['目标外呼任务 ID',processing.targetTaskId]);
        const priority = Number.isInteger(processing.priority) ? '（优先级 ' + processing.priority + '）' : '';
        if (Number.isInteger(processing.ruleNumber)) fields.push([processing.missingFields?.length ? '待补数据的规则' : '命中策略规则',
          '第 ' + processing.ruleNumber + ' 条' + priority]);
        if (processing.missingFields?.length) fields.push(['缺少的字段',processing.missingFields.join('、')]);
      }
      const handoff=record.skynet.predictiveHandoff;
      if (handoff?.roundId===roundId) {
        fields.push(['计划呼叫渠道','预外呼'],['是否转 AI',handoff.transferred===true?'是':handoff.transferred===false?'否':'待确认']);
        if (handoff.actualMethod) fields.push(['实际呼叫渠道',handoff.actualMethod]);
        if (handoff.predictiveCallId) fields.push(['预外呼通话编号',handoff.predictiveCallId]);
        if (handoff.aiCallId) fields.push(['AI 通话编号',handoff.aiCallId]);
      }
      if (record.taskStatus === '待处理' && record.waitReason && (record.ownerId || handoff?.stage==='admin')) fields.push(['等待原因',record.waitReason]);
      if (latestIntakeId && latestIntakeId !== intakeId) fields.push(['最近来件编号',latestIntakeId]);
      if (assignment) fields.push(['指派记录',assignment.operatorName+' · '+dt(assignment.at)]);
      const delivery = deliveryState(record);
      if (delivery) fields.push(['下发状态',delivery.status === '已下发' ?
        (delivery.trigger === 'automatic' ? '已自动下发（模拟）' : '已下发（模拟）') : delivery.status]);
      if (delivery?.modeLabel) fields.push(['下发方式',delivery.modeLabel]);
      if (delivery?.targets?.length) fields.push(['接收租户',delivery.targets.map(target=>target.label).join('、')]);
      else if (delivery?.target) fields.push([delivery.target.type === 'internalTenant' ? '接收租户' : '接收系统',delivery.target.label]);
      if (delivery?.directStore) fields.push(['下发门店',delivery.directStore.name]);
      if (delivery?.targetLabel) fields.push(['意向门店',delivery.targetLabel]);
      if (record.skynet.endReason) fields.push(['结束原因',record.skynet.endReason]);
      const cold = record.skynet.coldTransfer;
      if (cold) fields.push(['冷线索分配规则',cold.targetRuleName || cold.targetRuleId],['冷线索任务',cold.taskId]);
    }
    return fields;
  }

  function modal(entry,record) {
    if(!current(entry)||record.tenant!==entry.state.tenant||!entry.state.records.includes(record)||
       !canViewTask(record))return;
    const skynetRound=record.skynet?.roundId;
    const seatName=id=>entry.state.seats.find(seat=>seat.id===id)?.name || '—';
    const writable=entry.pageId===assignmentPage && canManage();
    const wecom=pendingWecomAssignment(entry.state,record);
    const redispatch=canRedispatch(entry.state,record);
    const showAssign=writable&&(canAssign(entry.state,record)||redispatch);
    const fields=taskDetailFields(entry.state,record,record.ownerId);
    if(record.expectedSeatId&&!record.ownerId)fields.push(['拟接听坐席',seatName(record.expectedSeatId)]);
    if(record.lastUnanswered)fields.push(['上次未接听',seatName(record.lastUnanswered.seatId)+' · '+dt(record.lastUnanswered.at)]);
    if(wecom) fields.push(['企微承接状态',wecom.status]);
    if(wecom||record.taskId&&!record.ownerId&&(record.taskStatus!=='已结束'||awaitsDeliveryOwner(record))) {
      fields.push(['等待原因',waitReason(entry.state,record)||record.waitReason||'等待分配']);
    }
    if(record.assignedOn)fields.push(['分配日期',record.assignedOn]);
    if(record.followupResult)fields.push(['最近回访结果',record.followupResult]);
    const details=fields.map(([label,value])=>`<dt>${e(label)}</dt><dd>${e(value==null||value===''?'暂未对接数据':value)}</dd>`).join('');
    const history=record.followupHistory?.length ? `<details><summary>回访记录（${record.followupHistory.length}）</summary><ol>${
      [...record.followupHistory].reverse().map(visit=>`<li>${e(dt(visit.at||visit.date))} · ${e(seatName(visit.seat))} · ${e(visit.result)}<p>${e(visit.note)}</p></li>`).join('')
    }</ol></details>` : '';
    const nonmanual = record.skynet?.processing && record.skynet.processing.method !== '人工外呼';
    const title=wecom?(wecom.status==='待改派'?'改派企微坐席':'指定企微坐席'):nonmanual?'培育任务详情':'分配详情';
    const content=`<dl>${details}</dl>${history}
      ${skynetRound && DSession.allowed('PAGE-2204') ? '<p class="op-help"><button type="button" class="btn" data-open-skynet-receipt>查看导入来件</button></p>' : ''}
      ${!writable?'<p class="op-help">当前账号可查看本租户任务。</p>':''}
      ${showAssign?`<label class="field"><span>${wecom?'企微坐席':awaitsDeliveryOwner(record)?'下发坐席':skynetRound?'指派坐席':'安排坐席'}</span><select class="form-select" name="seat"><option value="">请选择可用坐席</option>${entry.state.seats.map(s=>{const reason=eligibility(entry.state,record,s);return `<option value="${e(s.id)}" ${reason?'disabled':''}>${e(s.name)}${reason?' · '+e(reason):''}</option>`;}).join('')}</select></label>`:''}`;
    const actions=`<button type="button" class="btn" data-close>关闭</button>${showAssign?`<button type="button" class="btn btn-primary" data-assign>${wecom?.status==='待改派'?'确认改派':skynetRound?'确认指派':redispatch?'确认重新分配':'确认分配'}</button>`:''}`;
    const node=taskDialog(entry,title,content,actions,'<p class="op-alert op-dialog-error" data-error role="alert" hidden></p>');
    const error=message=>{const msg=node.querySelector('[data-error]');msg.hidden=false;msg.textContent=DReview21.saveFailure(entry.state,message);};
    node.querySelector('[data-open-skynet-receipt]')?.addEventListener('click',()=>{
      if (!current(entry) || !canViewTask(record)) return;
      const open = window.DReview21InlineIntake?.openSkynetReceipt(record.skynet.intakeId);
      if (open && node.open) node.close();
      if (!open) error('当前无法打开这条来件。');
    });
    node.querySelector('[data-assign]')?.addEventListener('click',()=>{
      if(entry.pageId!==assignmentPage || !current(entry) || !canManage())return;
      const seat=entry.state.seats.find(s=>s.id===node.querySelector('[name=seat]').value);
      if(skynetRound && record.skynet?.roundId!==skynetRound)return error('轮次已变化，请重新查看。');
      const currentWecom = pendingWecomAssignment(entry.state,record);
      if((wecom||currentWecom) && wecom?.status!==currentWecom?.status)return error('企微承接状态已变化，请重新查看。');
      if(!canAssign(entry.state,record)&&!canRedispatch(entry.state,record))return error('任务状态已变化，请重新查看。');
      const reason=eligibility(entry.state,record,seat);
      if(reason)return error(reason);
      const pendingDelivery=awaitsDeliveryOwner(record);
      if(!commit(entry,[record,seat],()=>assign(entry.state,record,seat))){
        const message=DReview21.saveFailure(entry.state,'分配未保存，请重试。');
        const log=window.DBatchFailureLog;
        const receipt=entry.state.skynetReceipts?.find(item=>item.id===record.skynet?.intakeId);
        log?.record(actor(),'assignment',{...log.reference(record,receipt),reason:message});
        return error(message);
      }
      node.close();
      refresh(entry,wecom?(wecom.status==='待改派'?'已改派企微坐席':'已指定企微坐席')+'，'+record.waitReason:
        pendingDelivery?'已指派到坐席的待下发队列':record.requiredMode==='预外呼'?'正在安排电话，接听后承接':'已分配到坐席待办');
    });
  }
  // The integration lifecycle retains this hook for the shared operations API.
  window.DReview21Operations={canView,canManage,canViewTask,isSkynetTask,current,canQueue,canAssign,canRedispatch,awaitsDeliveryOwner,eligibility,assign,commit,waitReason,showDetail:modal,taskDialog,taskDetailFields,style};
})();
