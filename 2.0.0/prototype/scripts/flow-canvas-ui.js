  // Presentation-only canvas. All connections continue through the original edge model.
  const canvasStartId='__start__',canvasStartPoint={x:260,y:120};
  function canvasValidationNode(issue){
    const key=issue?.key||issue?.id||'',nodes=editor?.values.nodes||[];
    if(issue?.nodeId===canvasStartId||key==='fcStart')return canvasStartId;
    if(nodes.some(node=>node.nodeId===issue?.nodeId))return issue.nodeId;
    const edge=editor?.values.edges?.find(row=>row.edgeId===issue?.edgeId||edgeControlId(row.edgeId)===key);
    return edge?.fromNodeId||nodes.find(node=>key.startsWith(nodeFieldId(node.nodeId,'')))?.nodeId||'';
  }
  function canvasValidationSnapshot(nodeId){
    const values=editor.values;
    return JSON.stringify(nodeId===canvasStartId?[values.startNodeId,values.entryRules]:[values.nodes.find(node=>node.nodeId===nodeId),values.edges.filter(edge=>edge.fromNodeId===nodeId)]);
  }
  function markCanvasValidationError(issue){
    let nodeId=canvasValidationNode(issue);
    // The store can return a combined validation message without location data.
    // Recover only the matching presentation location; the save result stays authoritative.
    if(!nodeId&&window.DFlowRouting&&editor.values.routingCatalog){
      try{const result=DFlowRouting.validate(clone(editor.values),editor.values.routingCatalog),matched=(result.issues||[]).find(item=>item.message&&String(issue.text||'').includes(item.message)&&canvasValidationNode(item));if(matched)nodeId=canvasValidationNode(matched);}catch(_){}
    }
    editor.validationIssue=nodeId?{nodeId,snapshot:canvasValidationSnapshot(nodeId)}:null;
  }
  function canvasNodeInvalid(nodeId){
    if(!editor||editor.readOnly)return false;
    if(editor.targetIssue?.nodeId===nodeId)return true;
    const issue=editor.validationIssue;
    return issue?.nodeId===nodeId&&issue.snapshot===canvasValidationSnapshot(nodeId);
  }
  function refreshCanvasValidation(){
    if(!editor)return;
    const card=document.activeElement?.closest?.('.fc-node-card');
    if(card?.dataset.nodeId===editor.validationIssue?.nodeId)editor.validationIssue=null;
    for(const element of document.querySelectorAll('#fcCanvas [data-canvas-node],#fcCanvas .fc-canvas-start-node')){
      const invalid=!!canvasNodeInvalid(element.dataset.canvasNode||canvasStartId);
      element.classList.toggle('fc-node-error',invalid);
      if(invalid)element.setAttribute('aria-invalid','true');else element.removeAttribute('aria-invalid');
    }
  }
  function canvasZoom(){return editor?.zoom||1;}
  function canvasLabelText(edge){return edge._entry?fourEntryPathLabel(edge._entry):fourPathLabel(edge);}
  function canvasLabelWidth(text){return Math.max(32,Array.from(text).reduce((width,ch)=>width+(ch.codePointAt(0)>255?11:/\s/.test(ch)?4:/[MW@#%&]/.test(ch)?10:7),0)+16);}
  function canvasLabelLayout(){
    const positions=Object.values(editor.positions||{}),margin=12,height=24,gap=8;
    let width=Math.max(1400,...positions.map(p=>p.x+260)),canvasHeight=Math.max(800,...positions.map(p=>p.y+180));
    const nodes=editor.values.nodes.flatMap(n=>{const p=editor.positions[n.nodeId];return p?[{x:p.x,y:p.y,width:180,height:96}]:[]});
    nodes.push({x:canvasStartPoint.x,y:canvasStartPoint.y,width:72,height:64});
    const labels=editor.values.edges.concat(fourCanvasEntryEdges()).flatMap(edge=>{const text=canvasLabelText(edge),from=canvasPortPoint(edge.fromNodeId),to=canvasPortPoint(edge.toNodeId,true);return text&&from&&to?[{edge,text,width:canvasLabelWidth(text),from,to}]:[];});
    width=Math.max(width,...labels.map(label=>label.width+margin*2));
    const placed=[],overlaps=(a,b)=>a.x<b.x+b.width+gap&&a.x+a.width+gap>b.x&&a.y<b.y+b.height+gap&&a.y+a.height+gap>b.y;
    const occupied=rect=>nodes.concat(placed).some(other=>overlaps(rect,other));
    const railX=Math.max(...nodes.map(node=>node.x+node.width))+margin*2;
    for(const label of labels){
      const centerX=(label.from.x+label.to.x)/2,baseline=(label.from.y+label.to.y)/2-10;
      const preferred={x:Math.max(margin,Math.min(width-margin-label.width,centerX-label.width/2)),y:Math.max(margin,Math.min(canvasHeight-margin-height,baseline-16))},stepX=Math.min(label.width+gap,160),stepY=height+gap;
      let rect=null;
      const tryAt=(dx,dy)=>{if(rect)return;const candidate={x:Math.max(margin,Math.min(width-margin-label.width,preferred.x+dx)),y:Math.max(margin,Math.min(canvasHeight-margin-height,preferred.y+dy)),width:label.width,height};if(!occupied(candidate))rect=candidate;};
      // At most 65 nearby candidates. Dense layouts use a separate, scrollable
      // label column instead of overlapping nodes or hiding text beyond an edge.
      const candidates=[[0,0]];
      for(let ring=1;ring<=8;ring++)for(const [x,y]of [[0,-1],[0,1],[-1,0],[1,0],[-1,-1],[1,-1],[-1,1],[1,1]])candidates.push([x*ring*stepX,y*ring*stepY]);
      candidates.sort((a,b)=>a[0]*a[0]+a[1]*a[1]-b[0]*b[0]-b[1]*b[1]);
      for(const [x,y]of candidates){tryAt(x,y);if(rect)break;}
      if(!rect){
        rect={x:railX,y:margin,width:label.width,height};
        for(let attempt=0;attempt<=placed.length;attempt++){const blockers=placed.filter(other=>overlaps(rect,other));if(!blockers.length)break;rect.y=Math.max(...blockers.map(other=>other.y+other.height))+gap;}
      }
      placed.push(rect);label.rect=rect;label.x=rect.x+rect.width/2;label.y=rect.y+16;
      width=Math.max(width,rect.x+rect.width+margin);canvasHeight=Math.max(canvasHeight,rect.y+rect.height+margin);
    }
    return {width,height:canvasHeight,labels};
  }
  function canvasSize(){const layout=canvasLabelLayout();return {width:layout.width,height:layout.height};}
  function canvasCurve(from,to){const bend=Math.max(48,Math.abs(to.x-from.x)*.45);return 'M '+from.x+' '+from.y+' C '+(from.x+bend)+' '+from.y+' '+(to.x-bend)+' '+to.y+' '+to.x+' '+to.y;}
  function canvasPortPoint(id,input=false){if(id===canvasStartId)return {x:canvasStartPoint.x+72,y:canvasStartPoint.y+32};const p=editor.positions[id];return p?{x:p.x+(input?0:180),y:p.y+43}:null;}
  function canvasLinks(layout=canvasLabelLayout()){
    const size=layout,v=editor.values,selected=editor.selectedNodeId;
    const line=(from,to,classes,attrs='')=>'<path class="'+classes+'" '+attrs+' d="'+canvasCurve(from,to)+'" fill="none" marker-end="url(#fcCanvasArrow)"/>';
    let paths='';
    paths+=v.edges.concat(fourCanvasEntryEdges(v)).map(edge=>{
      const from=canvasPortPoint(edge.fromNodeId),to=canvasPortPoint(edge.toNodeId,true);if(!from||!to)return '';
      const label=layout.labels.find(label=>label.edge.edgeId===edge.edgeId);
      return line(from,to,(edge._entry?'fc-start-line ':'')+'fc-edge-line'+(edge.fromNodeId===selected?' fc-edge-selected':''),'data-canvas-edge="'+e(edge.edgeId)+'"')+(label?'<text class="fc-edge-label" data-canvas-edge-label="'+e(edge.edgeId)+'" x="'+label.x+'" y="'+label.y+'" text-anchor="middle">'+e(label.text)+'</text>':'');
    }).join('');
    const preview=editor.connectionPreview,origin=canvasPortPoint(editor.connectionFrom);if(preview&&origin)paths+='<path class="fc-connection-preview" d="'+canvasCurve(origin,preview)+'" fill="none"/>';
    return '<svg class="fc-canvas-links" aria-label="节点连接" width="'+size.width+'" height="'+size.height+'"><defs><marker id="fcCanvasArrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#8ea8c6"/></marker></defs>'+paths+'</svg>';
  }
  function refreshCanvasLinks(){const layout=canvasLabelLayout(),canvas=document.getElementById('fcCanvas'),svg=document.querySelector('#fcCanvas .fc-canvas-links');if(canvas){canvas.style.width=layout.width+'px';canvas.style.height=layout.height+'px';}if(svg)svg.outerHTML=canvasLinks(layout);}
  function canvasPort(id,input){
    if(!editableCanvas())return '';
    const name=id===canvasStartId?'开始':nodeLabel(editor.values.nodes.find(n=>n.nodeId===id)||{},editor.values.nodes.findIndex(n=>n.nodeId===id)),arg=e(JSON.stringify(id));
    return '<button type="button" class="fc-port fc-port-'+(input?'input':'output')+(editor.connectionFrom===id?' active':'')+'" data-port-'+(input?'to':'from')+'="'+e(id)+'" aria-label="'+e(name)+(input?'的输入端口':'的输出端口')+'" title="'+(input?'连接到此节点':'拖动连线，或点击后选择输入端口')+'" '+(input?'onclick="FlowConfiguration.chooseCanvasInput(event,'+arg+')"':'onpointerdown="FlowConfiguration.beginCanvasConnection(event,'+arg+')" onclick="FlowConfiguration.chooseCanvasOutput(event,'+arg+')"')+'></button>';
  }
  function canvasNode(n,index){
    const p=editor.positions[n.nodeId],selected=editor.selectedNodeId===n.nodeId,readonly=!editableCanvas(),invalid=canvasNodeInvalid(n.nodeId);
    return '<div class="fc-canvas-node'+(selected?' selected':'')+(invalid?' fc-node-error':'')+'" data-node-type="'+e(n.type)+'" role="group"'+(invalid?' aria-invalid="true"':'')+' aria-label="'+e(nodeLabel(n,index))+'" tabindex="0" data-canvas-node="'+e(n.nodeId)+'" style="left:'+p.x+'px;top:'+p.y+'px" onclick="'+call('selectCanvasNode',n.nodeId)+'" onkeydown="FlowConfiguration.canvasKey(event,'+e(JSON.stringify(n.nodeId))+')"'+(readonly?'':' onpointerdown="FlowConfiguration.beginCanvasMove(event,'+e(JSON.stringify(n.nodeId))+')"')+'><div class="fc-canvas-drag-handle"><span class="fc-node-type">'+e(nodeTypes[n.type]||'待配置类型')+'</span><span aria-hidden="true">⠿</span></div><strong class="fc-canvas-title" data-canvas-title>'+e(nodeLabel(n,index))+'</strong><div class="fc-node-meta">'+(editor.values.startNodeId===n.nodeId?'起始节点 · ':'')+e(n.type==='TRANSFER'?'按分支确定承接方':n.type==='END'?fourEndActionLabel(n):fourRecipientLabel(n.recipient))+'</div>'+canvasPort(n.nodeId,true)+(n.type&&n.type!=='END'?canvasPort(n.nodeId,false):'')+'</div>';
  }
  function visualEditor(v){
    const readonly=editor.readOnly,locked=!editableCanvas(),selected=editor.inspectorClosed?null:editor.selectedNodeId===canvasStartId?{nodeId:canvasStartId,type:'START',name:'开始'}:v.nodes.find(n=>n.nodeId===editor.selectedNodeId),size=canvasLabelLayout();
    const groups=[{title:'流程流转',tone:'amber',types:['TRANSFER']},{title:'呼叫办理',tone:'blue',types:['PROCESS']},{title:'流程结束',tone:'green',types:['END']}],symbols={PROCESS:'◷',TRANSFER:'⇄',END:'✓'};
    const library=readonly?'':'<aside class="fc-node-library" aria-label="节点组件库"><div class="fc-library-heading">节点组件<span>拖拽添加</span></div><section class="fc-library-group"><h4>流程开始</h4><button type="button" class="fc-library-node" data-library-type="START" disabled aria-label="开始节点默认存在且唯一"><span class="fc-library-icon">▶</span><strong>开始</strong><small>已存在</small></button></section>'+groups.map(group=>'<section class="fc-library-group" data-tone="'+group.tone+'"><h4>'+group.title+'</h4>'+group.types.map(type=>'<button type="button" class="fc-library-node"'+(type==='PROCESS'?' id="fcAddNode"':'')+' data-library-type="'+type+'" draggable="'+!locked+'" ondragstart="FlowConfiguration.beginLibraryDrag(event,\''+type+'\')" onclick="FlowConfiguration.addCanvasNode(\''+type+'\')"'+(locked?' disabled':'')+'><span class="fc-library-icon" aria-hidden="true">'+symbols[type]+'</span><strong>'+e(nodeTypes[type])+'</strong><span class="fc-library-grip" aria-hidden="true">⠿</span></button>').join('')+'</section>').join('')+'<p class="fc-library-note">拖入节点后，从圆点拉出连线。点击节点配置规则。</p></aside>';
    const tools='<div class="fc-canvas-toolbar"><strong>'+(v.nodes.length+1)+' 个节点 <small>· '+(v.edges.filter(edge=>edge.toNodeId&&v.nodes.some(node=>node.nodeId===edge.toNodeId)).length+fourCanvasEntryEdges(v).length)+' 条路径</small></strong><div class="fc-canvas-tools"><button id="fcZoomOut" type="button" aria-label="缩小画布" onclick="FlowConfiguration.zoomCanvas(-0.1)">−</button><button id="fcZoomReset" type="button" title="恢复100%" onclick="FlowConfiguration.zoomCanvas(0)">'+Math.round(canvasZoom()*100)+'%</button><button id="fcZoomIn" type="button" aria-label="放大画布" onclick="FlowConfiguration.zoomCanvas(0.1)">+</button><button type="button" onclick="FlowConfiguration.arrangeCanvas()"'+(editor.busy||editor.pending?' disabled':'')+'>整理布局</button></div></div>';
    const startInvalid=canvasNodeInvalid(canvasStartId),start='<div class="fc-canvas-start-node'+(editor.selectedNodeId===canvasStartId?' selected':'')+(startInvalid?' fc-node-error':'')+'" style="left:'+canvasStartPoint.x+'px;top:'+canvasStartPoint.y+'px" role="group"'+(startInvalid?' aria-invalid="true"':'')+' aria-label="开始" tabindex="0" onclick="'+call('selectCanvasNode',canvasStartId)+'" onkeydown="FlowConfiguration.canvasKey(event,'+e(JSON.stringify(canvasStartId))+')"><span>开始</span>'+canvasPort(canvasStartId,false)+'</div>';
    const libraryToggle=readonly?'':'<button id="fcToggleLibrary" class="fc-library-toggle" type="button" aria-label="'+(editor.libraryCollapsed?'展开节点组件库':'收起节点组件库')+'" title="'+(editor.libraryCollapsed?'展开节点组件库':'收起节点组件库')+'" aria-expanded="'+!editor.libraryCollapsed+'" onclick="FlowConfiguration.toggleCanvasLibrary()">'+(editor.libraryCollapsed?'›':'‹')+'</button>';
    const canvas='<div class="fc-canvas-column">'+tools+'<div class="fc-canvas-viewport" id="fcCanvasViewport"><div id="fcCanvas" class="fc-canvas" style="width:'+size.width+'px;height:'+size.height+'px;zoom:'+canvasZoom()+'" onpointerdown="FlowConfiguration.beginCanvasPan(event)" ondragover="FlowConfiguration.canvasDragOver(event)" ondrop="FlowConfiguration.dropCanvasNode(event)">'+canvasLinks(size)+start+v.nodes.map(canvasNode).join('')+(!v.nodes.length?'<div class="fc-canvas-empty"><strong>拖入节点，开始编排</strong><span>连接“开始”与第一个节点，明确流程起点</span></div>':'')+'</div></div><p id="fcCanvasHint" class="fc-canvas-hint" role="status">'+e(editor.canvasHint||'拖动空白处平移 · 点击节点配置 · 从圆点拖出连线')+'</p></div>';
    const panel=selected?'<aside class="fc-config-panel" aria-label="节点配置"><div class="fc-inspector-heading"><h3>节点配置</h3><button id="fcCloseInspector" type="button" aria-label="收起节点配置" onclick="FlowConfiguration.closeCanvasInspector()">×</button></div><div id="fcNodes">'+nodeCard(selected,v.nodes.indexOf(selected),v.nodes)+'</div></aside>':'';
    const unsupported=editor.compatibilityIssues?.length?'<div class="fc-error" role="alert"><strong>节点配置有误</strong><p>请检查以下节点和路径配置，修正后保存。</p><ul>'+editor.compatibilityIssues.map(issue=>'<li>'+e(issue)+'</li>').join('')+'</ul></div>':'';
    return unsupported+'<div class="fc-visual-editor fc-reference-canvas'+(readonly?' fc-visual-readonly':'')+(selected?' fc-inspector-open':'')+(editor.libraryCollapsed?' fc-library-collapsed':'')+'">'+canvas+library+libraryToggle+panel+'</div>';
  }
  function selectCanvasNode(id){if(!editor||editor.ignoreCanvasClick||editor.busy||editor.pending||id!==canvasStartId&&!editor.values.nodes.some(n=>n.nodeId===id))return;readValues();editor.selectedNodeId=id;editor.inspectorClosed=false;editor.expanded=new Set([id]);draw();}
  function toggleCanvasLibrary(){if(!editor||editor.busy||editor.pending)return;readValues();editor.libraryCollapsed=!editor.libraryCollapsed;draw();}
  function closeCanvasInspector(){if(!editor||editor.busy||editor.pending)return;readValues();editor.inspectorClosed=true;draw();const current=editor;requestAnimationFrame(()=>{if(editor===current)Array.from(document.querySelectorAll('[data-canvas-node]')).find(n=>n.dataset.canvasNode===current.selectedNodeId)?.focus({preventScroll:true});});}
  function canvasKey(event,id){if(event.target.closest('.fc-port'))return;if(event.key==='Enter'||event.key===' '){event.preventDefault();selectCanvasNode(id);}}
  function canvasPoint(clientX,clientY){const rect=document.getElementById('fcCanvas').getBoundingClientRect(),z=canvasZoom();return {x:(clientX-rect.left)/z,y:(clientY-rect.top)/z};}
  function addCanvasNode(type,point){
    if(!editableCanvas()||!['PROCESS','TRANSFER','END'].includes(type))return;
    readValues();touch();let i=1;while(editor.usedNodeIds.has('node-'+i))i++;const nodeId='node-'+i;editor.usedNodeIds.add(nodeId);
    const vp=document.getElementById('fcCanvasViewport'),z=canvasZoom();
    const base=nodeTypes[type],names=new Set(editor.values.nodes.map(node=>node.name));let number=1;while(names.has(base+' '+number))number++;editor.values.nodes.push({nodeId,name:base+' '+number,type,duty:'CURRENT',methods:[],next:[],...(type==='END'?{endAction:'CLOSE'}:{}),...(type==='PROCESS'?{recipient:{kind:'TENANT',scope:'CURRENT'}}:{}),...(v2()?{conditionSource:{scope:type==='TRANSFER'?'CURRENT_ROUND':'CURRENT_NODE'}}:{})});
    if(type!=='END')fourInitializeBranchDraft(nodeId);
    editor.positions[nodeId]=point||{x:Math.round((vp?.scrollLeft||0)/z+420+((i-1)%2)*230),y:Math.round((vp?.scrollTop||0)/z+120+Math.floor((i-1)/2)*140)};editor.selectedNodeId=nodeId;editor.inspectorClosed=false;editor.expanded=new Set([nodeId]);draw();requestAnimationFrame(()=>focusNodeField(nodeId,'name'));
  }
  function beginLibraryDrag(event,type){if(!editableCanvas()){event.preventDefault();return;}event.dataTransfer.setData('application/x-flow-node',type);event.dataTransfer.effectAllowed='copy';}
  function canvasDragOver(event){if(editableCanvas()&&Array.from(event.dataTransfer.types).includes('application/x-flow-node')){event.preventDefault();event.dataTransfer.dropEffect='copy';}}
  function dropCanvasNode(event){if(!editableCanvas())return;const type=event.dataTransfer.getData('application/x-flow-node');if(!['PROCESS','TRANSFER','END'].includes(type))return;event.preventDefault();const p=canvasPoint(event.clientX,event.clientY);addCanvasNode(type,{x:Math.max(12,Math.min(3000,Math.round(p.x-90))),y:Math.max(12,Math.min(3000,Math.round(p.y-43)))});}
  function beginCanvasMove(event,id){
    if(!editableCanvas()||event.button!==0||event.target.closest('button,input,select'))return;event.preventDefault();event.stopPropagation();readValues();
    const current=editor,start={...editor.positions[id]},node=event.currentTarget.closest('[data-canvas-node]'),canvas=document.getElementById('fcCanvas'),x=event.clientX,y=event.clientY,z=canvasZoom(),vp=document.getElementById('fcCanvasViewport'),sx=vp.scrollLeft,sy=vp.scrollTop;
    let moved=false;const move=ev=>{if(editor!==current)return;const dx=(ev.clientX-x+vp.scrollLeft-sx)/z,dy=(ev.clientY-y+vp.scrollTop-sy)/z;if(Math.abs(dx)+Math.abs(dy)>3)moved=true;current.positions[id]={x:Math.max(12,Math.min(3000,Math.round(start.x+dx))),y:Math.max(12,Math.min(3000,Math.round(start.y+dy)))};node.style.left=current.positions[id].x+'px';node.style.top=current.positions[id].y+'px';node.classList.add('dragging');refreshCanvasLinks();};
    const finish=(abort=false)=>{document.removeEventListener('pointermove',move);document.removeEventListener('pointerup',up);document.removeEventListener('pointercancel',cancelMove);if(editor!==current)return;if(abort)current.positions[id]=start;else if(moved)current.layoutDirty=true;else{current.selectedNodeId=id;current.inspectorClosed=false;current.expanded=new Set([id]);}current.ignoreCanvasClick=moved;draw();setTimeout(()=>{if(editor===current)current.ignoreCanvasClick=false;},0);};
    const up=()=>finish(),cancelMove=()=>finish(true);document.addEventListener('pointermove',move);document.addEventListener('pointerup',up,{once:true});document.addEventListener('pointercancel',cancelMove,{once:true});
  }
  function canvasHint(text){if(!editor)return;editor.canvasHint=text;const hint=document.getElementById('fcCanvasHint');if(hint)hint.textContent=text;}
  function stopCanvasConnection(){if(!editor)return;editor.connectionCleanup?.();editor.connectionCleanup=null;editor.connectionFrom=null;editor.connectionPreview=null;document.querySelectorAll('.fc-port.active').forEach(p=>p.classList.remove('active'));refreshCanvasLinks();canvasHint('拖动空白处平移 · 点击节点配置 · 从圆点拖出连线');}
  function connectCanvasNodes(fromId,toId){
    if(!editableCanvas())return;readValues();const target=editor.values.nodes.find(n=>n.nodeId===toId),source=editor.values.nodes.find(n=>n.nodeId===fromId);if(!target)return;
    if(fromId===canvasStartId){const rows=fourEnsureEntries(),fallback=rows.find(row=>row.branch?.kind==='ELSE');if(!fallback?.toNodeId)fourSetEntryDefault(toId);else if(!rows.some(row=>row.toNodeId===toId))fourAddEntry(toId);else canvasHint('此节点已连接开始入口，请点击开始配置其条件。');editor.connectionFrom=null;editor.connectionPreview=null;editor.selectedNodeId=canvasStartId;editor.inspectorClosed=false;draw();return;}
    if(!source||!source.type||source.type==='END'){canvasHint('结束节点不能连接出口。');return;}
    if(source.next.includes(toId)){canvasHint('这两个节点已有连接，点击源节点可配置路径条件。');return;}
    if(!fourConnectTarget(fromId,toId)){editor.connectionFrom=null;editor.connectionPreview=null;refreshCanvasLinks();return;}touch();editor.connectionFrom=null;editor.connectionPreview=null;editor.selectedNodeId=fromId;editor.inspectorClosed=false;editor.expanded=new Set([fromId]);editor.canvasHint='已选择下一节点，请设置判断条件。';draw();
  }
  function chooseCanvasOutput(event,id){event.stopPropagation();if(!editableCanvas()||editor.ignoreConnectionClick)return;readValues();const active=editor.connectionFrom===id;stopCanvasConnection();if(active)return;editor.connectionFrom=id;event.currentTarget.classList.add('active');canvasHint('请选择后续节点左侧的输入圆点，按 Esc 取消。');}
  function chooseCanvasInput(event,id){event.stopPropagation();if(!editableCanvas()||!editor.connectionFrom)return;const from=editor.connectionFrom;stopCanvasConnection();connectCanvasNodes(from,id);}
  function beginCanvasConnection(event,id){
    if(!editableCanvas()||event.button!==0)return;event.preventDefault();event.stopPropagation();readValues();stopCanvasConnection();const current=editor,x=event.clientX,y=event.clientY;let moved=false;current.connectionFrom=id;
    const move=ev=>{if(editor!==current)return;if(Math.abs(ev.clientX-x)+Math.abs(ev.clientY-y)>4)moved=true;current.connectionPreview=canvasPoint(ev.clientX,ev.clientY);refreshCanvasLinks();};
    const cleanup=()=>{document.removeEventListener('pointermove',move);document.removeEventListener('pointerup',up);document.removeEventListener('pointercancel',abort);};
    const up=ev=>{cleanup();if(editor!==current)return;current.connectionCleanup=null;current.connectionPreview=null;current.connectionFrom=null;if(moved){current.ignoreConnectionClick=true;const target=document.elementFromPoint(ev.clientX,ev.clientY)?.closest('[data-port-to]');if(target)connectCanvasNodes(id,target.dataset.portTo);else canvasHint('连线已取消。请拖到节点左侧圆点完成连接。');setTimeout(()=>{if(editor===current)current.ignoreConnectionClick=false;},0);}refreshCanvasLinks();};
    const abort=()=>{cleanup();if(editor===current)stopCanvasConnection();};current.connectionCleanup=cleanup;document.addEventListener('pointermove',move);document.addEventListener('pointerup',up,{once:true});document.addEventListener('pointercancel',abort,{once:true});
  }
  function beginCanvasPan(event){
    if(!editor||event.button!==0||event.target.closest('[data-canvas-node],.fc-canvas-start-node,button'))return;if(editor.connectionFrom){event.preventDefault();stopCanvasConnection();return;}
    const current=editor,vp=document.getElementById('fcCanvasViewport'),x=event.clientX,y=event.clientY,left=vp.scrollLeft,top=vp.scrollTop;let moved=false;event.preventDefault();
    const move=ev=>{if(editor!==current)return;const dx=ev.clientX-x,dy=ev.clientY-y;if(Math.abs(dx)+Math.abs(dy)>4)moved=true;vp.scrollLeft=left-dx;vp.scrollTop=top-dy;};
    const done=()=>{document.removeEventListener('pointermove',move);document.removeEventListener('pointerup',done);document.removeEventListener('pointercancel',done);if(editor===current&&!moved)closeCanvasInspector();};document.addEventListener('pointermove',move);document.addEventListener('pointerup',done,{once:true});document.addEventListener('pointercancel',done,{once:true});
  }
  function zoomCanvas(delta){if(!editor||editor.busy||editor.pending)return;readValues();const viewport=document.getElementById('fcCanvasViewport'),old=canvasZoom(),next=delta?Math.min(1.5,Math.max(.5,Math.round((old+delta)*10)/10)):1;const left=viewport.scrollLeft,top=viewport.scrollTop;editor.zoom=next;draw();editor.canvasViewport={left:Math.max(0,(left+viewport.clientWidth/2)*next/old-viewport.clientWidth/2),top:Math.max(0,(top+viewport.clientHeight/2)*next/old-viewport.clientHeight/2)};restoreCanvasViewport();}
  function arrangeCanvas(){if(!editor||editor.busy||editor.pending)return;readValues();editor.positions=initialLayoutIgnoringSaved();if(!editor.readOnly)editor.layoutDirty=true;draw();}
  function initialLayoutIgnoringSaved(){const id=editor.id;editor.id='';try{return initialLayout();}finally{editor.id=id;}}
