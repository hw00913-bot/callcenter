"""Pure final routing-feedback transform; main build owns writes and syntax checks."""
from pathlib import Path


def one(code, before, after):
    if code.count(before) != 1:
        raise ValueError('Routing feedback source conflict: ' + before[:140])
    return code.replace(before, after, 1)


def patch_store_helper(code):
    code = one(code,
        "configGuard(input.brandId);cleanRoutingTemplate(read(),input);return {ok:true,issues:[],warnings:[]};",
        "configGuard(input.brandId);const cleaned=cleanRoutingTemplate(read(),input);return DFlowRouting.validate(cleaned,cleaned.routingCatalog);")
    return one(code,
        "try{previousSaved(r);}catch(_){e.selectable=false;}",
        "try{previousSaved(r);}catch(error){e.selectable=false;if(e.status==='MATCHED')e.reason=error.message;}")


def transform(kind, path, code):
    if kind != 'cloud':
        return code
    if path == 'js/components/business-flow-store.js':
        code = one(code,
            "const paths=evaluationsRaw(s,r).edgeEvaluations;requireThat(paths.some(e=>e.status==='MATCHED'),'CONDITION_UNMATCHED',paths.map(e=>e.reason).join('；')||'没有本租户允许的后续节点');",
            "const paths=evaluationsRaw(s,r).edgeEvaluations;if(!paths.some(e=>e.selectable)){const matched=paths.find(e=>e.status==='MATCHED');if(matched&&nodeOf(s,r.templateRef,matched.toNodeId).type!=='TRANSFER')previousSaved(r);requireThat(false,'CONDITION_UNMATCHED',paths.map(e=>e.reason).join('；')||'没有本租户允许的后续节点');}")
        return one(code,
            "try{noRunning(r);if(n.type!=='TRANSFER'&&nodeOf(s,r.templateRef,e.toNodeId).type!=='TRANSFER')previousSaved(r);}catch(_){selectable=false;}",
            "try{noRunning(r);if(n.type!=='TRANSFER'&&nodeOf(s,r.templateRef,e.toNodeId).type!=='TRANSFER')previousSaved(r);}catch(error){selectable=false;if(status==='MATCHED')reason=error.message;}")
    if path == 'js/pages/business-flow.js':
        if 'function routingConditionPanel(row)' in code:
            raise ValueError('Routing condition feedback already injected')
        helper = Path(__file__).with_name('flow-condition-feedback.js').read_text()
        code = one(code, '  function conditionPanel(row) {', helper + '\n  function conditionPanel(row) {')
        return one(code,
            "    if(row.viewIdentity==='history'||!row.edgeEvaluations?.length)return '';",
            "    if(row.viewIdentity==='history'||!row.edgeEvaluations?.length)return '';\n    if(row.policy==='FIRST_MATCH_V1')return routingConditionPanel(row);")
    if path != 'js/pages/flow-configuration.js':
        return code
    if 'function collectRoutingWarnings()' in code:
        raise ValueError('Routing feedback already injected')
    # One live warning region owns feedback; the old per-node copy becomes stale
    # after editing controls without redrawing the node panel.
    code = one(code,
        "if(warnings.length)html+=message(warnings.map(x=>typeof x==='string'?x:x.message).join(' '),'pending');",
        "")
    helper = Path(__file__).with_name('flow-warning-feedback.js').read_text()
    code = one(code, '  function draw() {', helper + '\n  function draw() {')
    code = one(code,
        "+'<div id=\"fcStatus\" class=\"fc-status\">'",
        "+routingWarningsMarkup()+'<div id=\"fcStatus\" class=\"fc-status\">'")
    return one(code,
        "function touch() {if(editor && !editor.pending && !editor.busy && !editor.readOnly){editor.status='';editor.dirty=true;editor.requestId=newRequestId();}}",
        "function touch() {if(editor && !editor.pending && !editor.busy && !editor.readOnly){editor.status='';editor.dirty=true;editor.requestId=newRequestId();refreshCanvasValidation();scheduleRoutingWarnings();}}")
