"""Four-node business model hooks inside the existing authoritative ledger.

No separate store, read-time migration, provider call or workflow-stage write.
The caller applies this after the other project-owned source transforms.
"""
from pathlib import Path


def one(code, before, after):
    if code.count(before) != 1:
        raise ValueError('Four-node model source conflict: ' + before[:130])
    return code.replace(before, after, 1)


def transform(kind, path, code):
    if kind != 'cloud' or path != 'js/components/business-flow-store.js':
        return code
    names = ['validateRoute','templateVersion','cleanTemplate','cleanRoutingTemplate','validateDutyPaths','cleanRouteRaw','preview','importRecords',
             'assignmentRaw','assign','assignMany','start','editableManual','saveResult','followupContext',
             'snapshotForSegment','noRunning','previousSaved','advance','transfer','transferTargetsRaw','destinationRaw',
             'project','catalogs','executionEvent','pendingManualResults','routingEvaluations','formCatalog','flowCall','requestAllowed','requestStatus','reconcile','nodeGuard']
    for name in names:
        code = one(code, '  function '+name+'(', '  function fourBase'+name[0].upper()+name[1:]+'(')
    code = one(code, "  const dutyMatches=(node,b)=>node.duty==='CURRENT'||node.duty===b.kind;",
               "  const dutyMatches=(node,b)=>node.recipient?fourRecipientMatches(node.recipient,b,node):node.duty==='CURRENT'||node.duty===b.kind;")
    code = one(code, "if(recordId&&kind!=='event')", "if(recordId&&!['event','handoffReview','abandon'].includes(kind))")
    code = one(code, "requireThat(requestAllowed(previous,a),'REQUEST_DENIED','无权核对此次办理')",
               "requireThat(fourBaseRequestAllowed(previous,a),'REQUEST_DENIED','核对责任不授予原业务动作重放或结果读取权限')")
    code = one(code, "requireThat(dutyMatches(v.nodes.find(n=>n.nodeId===v.startNodeId),b),'START_DUTY','模板起始节点不适用于当前负责租户')",
               "void 0")
    code = one(code, "sourceKind:'TEMPLATE_BATCH',mechanism:'TEMPLATE'", "sourceKind:b.handlingMode==='DIRECT'?'DIRECT_BATCH':'TEMPLATE_BATCH',mechanism:b.handlingMode==='DIRECT'?'DIRECT':'TEMPLATE'")
    code = one(code, '  function evaluationsRaw(s,r,a=access()){', '  function evaluationsRaw(s,r,a=access()){fourFlowOnly(r);')
    marker = '  window.BusinessFlowStore={'
    code = one(code, marker, Path(__file__).with_name('four-node-model.js').read_text()+'\n'+marker)
    return one(code, marker, marker+'completeDirect,resumeDirect,enableFlowContext,enableFlow,entryCatalog,validateEntryRules,startContext,startMany,reclassifyContext,reclassify,contactPolicyContext,saveContactPolicy,contactOccupancy,contactPolicyRead,contactPolicyStatus,workContext,fourNode:true,importContext,arrangementContext,runContext,aiScenes,abandon,reopen,correctValues,handoffReview,reviewContext,myReviewWork,myFollowupWork,timeline,')
