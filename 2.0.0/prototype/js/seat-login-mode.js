(() => {
    "use strict";

    // Adapt the 2.1 review entry while keeping the shared 2.0 bundle intact.
    const cloud = window.DNativeModules?.cloud;
    if (!cloud?.html) return;
    const taskRequired = JSON.stringify("请从已分配的外呼任务发起拨打");
    const noTask = `{showToast(${taskRequired},'warning');return false;}`;
    const temporaryButtons = cloud.html.split("\n").filter(line=>line.includes('id="seat-temporary"'));
    const temporaryEntry = cloud.html.split("\n").find(line=>line.trim().startsWith("function openTemporary()"));
    if (temporaryButtons.length !== 2 || !temporaryEntry) throw new Error("无法定位临时外呼入口。");

    const changes = [
        [temporaryEntry.trim(), `function openTemporary()${noTask}`],
        [temporaryButtons[0].trim(), "details+'</div>';"],
        [temporaryButtons[1].trim(), "'</div>';"],
        [
            "if (!workspaceTab || workspaceTab==='monitor'&&!supervisor) workspaceTab=supervisor?'monitor':'outbound';",
            "if (!workspaceTab || workspaceTab==='monitor'&&!supervisor) workspaceTab=supervisor&&window.DProductionAccess?.boundSeat()!==true?'monitor':'outbound';"
        ],
        [
            "'本页仅本人范围；预览外呼不改变导入批次进度。处理分配客户请点击名单中的联系客户。'",
            "'待联络客户仅显示本人事项。人工外呼从待办发起，预外呼接听成功后形成待办。'"
        ],
        ["'填写客户信息后发起预览外呼'", taskRequired],
        [
            ":'预览外呼';",
            ":'人工外呼';"
        ],
        [
            "const modeLabels = { '0': '预览与预测同时', '4': '预览外呼', '5': '预测外呼' };",
            "const modeLabels = { '4': '人工外呼', '5': '预外呼' };\n  const selectableMode = value => typeof value === 'string' && Object.hasOwn(modeLabels, value);"
        ],
        [
            "if (valid.profile.workingMode == null) return fail('请先选择工作模式，再保存登录设置');",
            "if (!selectableMode(valid.profile.workingMode)) return fail('请选择人工外呼或预外呼，再保存登录设置');"
        ],
        [
            "if (checked.profile.workingMode == null) return fail('请先在“登录设置”中选择工作模式，再登录电话');",
            "if (!selectableMode(input?.workingMode) || !selectableMode(checked.profile.workingMode)) return fail('请选择人工外呼或预外呼，再登录电话');"
        ],
        [
            "Object.keys(input).some(k => k !== 'workingMode') || !validMode(input.workingMode)",
            "Object.keys(input).some(k => k !== 'workingMode') || !selectableMode(input.workingMode)"
        ],
        [
            "kind === 'predictive' && usable() && adapter().session.workingMode !== '4'",
            "kind === 'predictive' && usable() && adapter().session.workingMode === '5'"
        ],
        [
            "if (!usable() || adapter().session.workingMode === '5') return false;",
            "if (!usable() || adapter().session.workingMode !== '4') return false;"
        ],
        [
            "const modeLabels = () => service()?.modeLabels || { '0': '预览与预测同时', '4': '预览外呼', '5': '预测外呼' };",
            "const modeLabels = () => service()?.modeLabels || { '4': '人工外呼', '5': '预外呼' };"
        ],
        [
            "const modeName = () => modeLabels()[state()?.workingMode || '0'] || modeLabels()['0'];",
            "const modeName = () => modeLabels()[state()?.workingMode] || '待选择';"
        ],
        [
            "const current = state()?.workingMode || '0';",
            "const current = state()?.workingMode || '';"
        ],
        [
            "const options = Object.entries(modeLabels()).map(([value,label])=>'<option value=\"'+value+'\"'+selected(value,current)+'>'+esc(label)+'</option>').join('');",
            "const options = (Object.hasOwn(modeLabels(),current)?'':'<option value=\"\" disabled selected>请选择外呼方式</option>') + Object.entries(modeLabels()).map(([value,label])=>'<option value=\"'+value+'\"'+selected(value,current)+'>'+esc(label)+'</option>').join('');"
        ],
        [
            "    const previewBlocked = local.busy || blocked || (local.online && (s?.presence !== 'ready' || s.resumeRequired || s.workingMode === '5'));\n"+
            "    const previewTitle = local.online && s?.workingMode === '5' ? '预测外呼模式下不能主动拨号，请先切换工作模式' : local.online && s?.presence !== 'ready' ? '请先置闲，再进行预览外呼' : '';\n",
            ""
        ],
        [
            "'本次登录使用所选模式，登录后也可在工具条切换'",
            "'选择人工外呼或预外呼其中一种。'"
        ],
        [
            "view.message='请先选择工作模式';draw();return {ok:false};",
            "view.message='请选择人工外呼或预外呼';draw();return {ok:false};"
        ],
        [
            "return window.AliCtiSeatOperations.login(agent,input);a.trace=[];",
            "return window.AliCtiSeatOperations.login(agent,input);if(!['4','5'].includes(input?.workingMode))return {ok:false,message:'请选择人工外呼或预外呼'};a.trace=[];"
        ],
        [
            "bindType:3,workingMode:'0'},pending:[],mock:true,source:'本地登录材料示例，不连接电话网关'};a.session={enterpriseId:agent.enterpriseId,cno:a.authDraft.fields.cno,bindType:3,workingMode:'0'",
            "bindType:3,workingMode:input.workingMode},pending:[],mock:true,source:'本地登录材料示例，不连接电话网关'};a.session={enterpriseId:agent.enterpriseId,cno:a.authDraft.fields.cno,bindType:3,workingMode:input.workingMode"
        ],
        [
            "a.previewOutcall=(agent,phone,caller,source)=>{const connection=",
            `a.previewOutcall=(agent,phone,caller,source)=>{
  const item=source?.customerTaskItemId?window.CustomerTasks?.row(source.customerTaskItemId):null;
  if(!item||item.r.phone!==phone||item.b.tenantId!==agent?.tenantId||
      String(item.b.enterpriseId)!==String(agent?.enterpriseId)||!CustomerTasks.canCall(item.r))
    return {ok:false,message:${taskRequired}};
  if(a.session?.workingMode!=='4')return {ok:false,message:'请在人工外呼方式下拨打'};const connection=`
        ],
        [
            "  function callBlockedReason(r){if(r?.ledgerRecord===true)return",
            `  function outboundTaskId(r){
    const id=String(r?.followupAssignment?.originalTaskId||r?.taskId||'').trim();
    if(!id)return '';
    if(r.ledgerRecord===true)return id;
    const scope=ctx();
    const matches=CloudCallData.tasks.filter(task=>String(task.taskId)===id&&task.tenantId===scope.tenantId&&
      String(task.enterpriseId)===String(scope.enterpriseId));
    return matches.length===1?matches[0].taskId:'';
  }
  function callBlockedReason(r){if(r&&!outboundTaskId(r))return ${taskRequired};if(r?.ledgerRecord===true)return`
        ],
        [
            "Object.assign(window.CustomerTasks,{reportSnapshot,receivingItem,",
            "Object.assign(window.CustomerTasks,{outboundTaskId,reportSnapshot,receivingItem,"
        ],
        [
            "function canCall(r){if(r?.ledgerRecord===true)",
            "function canCall(r){if(!outboundTaskId(r))return false;if(r?.ledgerRecord===true)"
        ],
        [
            "function openDialog(){if(cultivationWorkbenchPage())return false;ensureScope();modalMode=true;",
            `function openDialog(){if(cultivationWorkbenchPage())return false;ensureScope();
    if(!busy()){
      const item=draft.customerTaskItemId?window.CustomerTasks?.row(draft.customerTaskItemId):null;
      if(!item||!CustomerTasks.canCall(item.r))${noTask}
    }
    modalMode=true;`
        ],
        [
            "if(busy()){open();return showToast('请先完成当前通话及结果填写','warning');}receivingOrigin=false;returnFocus=",
            `if(busy()){open();return showToast('请先完成当前通话及结果填写','warning');}
    const item=r?.id?window.CustomerTasks?.row(r.id):null;
    if(!item||!CustomerTasks.canCall(item.r))${noTask}
    r=item.r;receivingOrigin=false;returnFocus=`
        ],
        [
            "  function dial() {\n    if (busy()) return false;",
            `  function dial() {
    if (busy()) return false;
    const item=draft.customerTaskItemId?window.CustomerTasks?.row(draft.customerTaskItemId):null;
    if(!item||!CustomerTasks.canCall(item.r))${noTask}
    const taskId=CustomerTasks.outboundTaskId(item.r);`
        ],
        [
            "if(draft.customerTaskItemId){const item=CustomerTasks.row(draft.customerTaskItemId);if(!item||!CustomerTasks.canCall(item.r)||item.r.phone!==phone)return fail('该客户分配已改变，请重新选择待联系客户');}",
            "if(item.r.phone!==phone)return fail('任务关联的客户号码已变化，请重新选择任务');"
        ],
        [
            "customerTaskItemId:draft.customerTaskItemId||'', simulation: true, simulationOutcome: demoResult",
            "taskId, customerTaskItemId:item.r.id, simulation: true, simulationOutcome: demoResult"
        ]
    ];

    let html = cloud.html;
    for (const [original, adapted] of changes) {
        const position = html.indexOf(original);
        if (position < 0 || html.indexOf(original, position + original.length) >= 0) {
            throw new Error("无法定位 2.1 坐席外呼方式配置。" + original.slice(0, 50));
        }
        html = html.slice(0, position) + adapted + html.slice(position + original.length);
    }
    cloud.html = html.replace(/>预览外呼<\/button>/g, ">人工外呼</button>");
})();
