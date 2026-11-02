"""Pure, context-checked build transform for the project-owned template editor.

Readonly reference files remain unchanged. This module never writes artifacts;
build-modules.py owns syntax validation, output files and cache revisions.
"""
from pathlib import Path
import hashlib,json

PATCH_PATH=Path(__file__).with_name('flow-editor.patch.json')

def _patch():
    raw=PATCH_PATH.read_bytes()
    return json.loads(raw),hashlib.sha256(raw).hexdigest()

def apply_controller(code):
    patch,patch_hash=_patch()
    if not code.startswith(patch['controllerPrefix']):
        raise ValueError('Unexpected flow-template controller; build stopped')
    updated=code;applied=0;already=0
    for index,operation in enumerate(patch['operations'],1):
        before,after=operation['before'],operation['after']
        if updated.count(after)==1:already+=1
        elif updated.count(before)==1:
            updated=updated.replace(before,after);applied+=1
        else:
            raise ValueError('Flow-template build patch conflict at chunk '+str(index)+'; build stopped')
    # Replace the original canvas presentation as one checked block. Business
    # configuration, edge identities, conditions and persistence stay upstream.
    canvas_path=Path(__file__).with_name('flow-canvas-ui.js')
    style_path=Path(__file__).with_name('flow-canvas-ui.css')
    start='  function canvasSize()'
    end='  function legacyTemplateEditor(v)'
    if updated.count(start)!=1 or updated.count(end)!=1:
        raise ValueError('Flow canvas presentation anchors changed; build stopped')
    a,b=updated.index(start),updated.index(end)
    updated=updated[:a]+canvas_path.read_text()+'\n'+updated[b:]
    def one(before,after):
        nonlocal updated
        if updated.count(before)!=1:
            raise ValueError('Flow canvas integration conflict: '+before[:90])
        updated=updated.replace(before,after,1)
    one('x:36+(rank%4)*254,y:42+Math.floor(rank/4)*250+row*154',
        'x:420+(rank%4)*260,y:120+Math.floor(rank/4)*270+row*160')
    one("editor.selectedNodeId=values.nodes[0]?.nodeId||'';", "editor.selectedNodeId='';editor.inspectorClosed=true;editor.zoom=1;")
    one('window.FlowConfiguration={',
        'window.FlowConfiguration={toggleCanvasLibrary,closeCanvasInspector,zoomCanvas,beginCanvasPan,beginCanvasConnection,chooseCanvasOutput,chooseCanvasInput,')
    one("if(event.key==='Escape'&&!event.defaultPrevented&&event.target.tagName!=='SELECT'){",
        "if(event.key==='Escape'&&editor.connectionFrom){event.preventDefault();event.stopPropagation();stopCanvasConnection();return;}\n    if(event.key==='Escape'&&!event.defaultPrevented&&event.target.tagName!=='SELECT'){")
    one("if(nodeId&&editor&&editor.selectedNodeId!==nodeId){editor.selectedNodeId=nodeId;editor.expanded=new Set([nodeId]);draw();}",
        "const revealId=nodeId||(editor?.values.edges||[]).find(edge=>edgeControlId(edge.edgeId)===key)?.fromNodeId;if(revealId&&editor&&(editor.selectedNodeId!==revealId||editor.inspectorClosed)){editor.selectedNodeId=revealId;editor.inspectorClosed=false;editor.expanded=new Set([revealId]);draw();}")
    one("function editableCanvas(){return editor&&!editor.readOnly", "function editableCanvas(){return editor&&editor.stage==='canvas'&&!editor.readOnly")
    one("function close(force) { if(editor?.busy && !force) return; editor=null;", "function close(force) { if(editor?.busy && !force) return; stopCanvasConnection();editor=null;")
    one("readValues();captureCanvasViewport();editor.stage='basics';", "readValues();stopCanvasConnection();captureCanvasViewport();editor.stage='basics';")
    config_path=Path(__file__).with_name('flow-node-config.js')
    config_style_path=Path(__file__).with_name('flow-node-config.css')
    one("function nodeCard(node,index,nodes){let html=legacyNodeCard(node,index,nodes);if(v2())html=html.replace(/(<div class=\"fc-node-body\"[^>]*>)/,'$1'+routingSourcePanel(node));return html;}",config_path.read_text().strip())
    one('window.FlowConfiguration={','window.FlowConfiguration={changeNodeExecution,loadNodeExecution,selectProcessMethod,selectBranchResultMethod,')
    one("if(type==='PROCESS'&&card.querySelector('[data-node-method]')?.disabled===false)","if(type==='PROCESS'&&!card.querySelector('[data-single-method]')&&card.querySelector('[data-node-method]')?.disabled===false)")
    one("source:'',operator:'',values:[],scope:''", "source:'',operator:'',values:[],scope:nodeById(edge.fromNodeId)?.conditionSource?.scope||'CURRENT_NODE'")
    one("if(!v2())return legacyValidateConditions();if(Object.keys(editor.ruleChanges||{}).length)",
        "if(!v2())return legacyValidateConditions();const methodMissing=editor.values.nodes.find(n=>n.type==='PROCESS'&&!processMethodChoice(n));if(methodMissing){editor.inspectorClosed=false;editor.selectedNodeId=methodMissing.nodeId;editor.expanded=new Set([methodMissing.nodeId]);return {text:'请为处理节点明确选择一种处理方式。',id:nodeFieldId(methodMissing.nodeId,'methods')};}if(Object.keys(editor.ruleChanges||{}).length)")
    # Result scope applies at the node for call/tag evidence and per field for FOLLOWUP.
    scope_field="field('字段/结果取值范围','<select data-rule-scope'+disabled+' onchange=\"'+change('scope')+'\">'+options(routingScopes,rule.scope||'','请选择明确范围')+'</select>')"
    one(scope_field,'ruleScopeControl(rule,node,disabled,change)')
    return updated,{
        'schema':'project-flow-template-editor@1',
        'referenceController':'js/pages/flow-configuration.js',
        'patchResource':'scripts/flow-editor.patch.json',
        'patchSha256':patch_hash,
        'transformResource':'scripts/flow_editor_build.py',
        'transformSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        'inputControllerSha256':hashlib.sha256(code.encode()).hexdigest(),
        'outputControllerSha256':hashlib.sha256(updated.encode()).hexdigest(),
        'reviewedBaselineSha256':patch['sourceSha256'],
        'reviewedResultSha256':patch['resultSha256'],
        'styleSha256':hashlib.sha256(patch['css'].encode()).hexdigest(),
        'appliedChunks':applied,'alreadyAppliedChunks':already,
        'nativeMenuLabel':'flow-templates: 流转模板',
        'canvasPresentation':{str(path.name):hashlib.sha256(path.read_bytes()).hexdigest() for path in [canvas_path,style_path,config_path,config_style_path]},
        'scope':'category-bound first-match template conditions; legacy versions and original execution/save guards retained'
    }

def canvas_style():
    patch,_=_patch()
    return '<style data-flow-canvas-style="1">'+(patch['css']+'\n'+Path(__file__).with_name('flow-canvas-ui.css').read_text()+'\n'+Path(__file__).with_name('flow-node-config.css').read_text()).replace('</style','<\\/style')+'</style>'
