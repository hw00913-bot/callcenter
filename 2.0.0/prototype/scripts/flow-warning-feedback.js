  let routingWarningFrame=null;
  function collectRoutingWarnings(){
    if(!editor||!v2()||editor.stage!=='canvas')return [];
    try{const directory=routingDirectory(true);if(directory.status!=='success')return [];return (window.DFlowRouting?.validate?.(editor.values,directory.data)?.warnings||[]).filter(w=>w&&typeof w.message==='string');}catch(_){return [];}
  }
  function routingWarningsContent(){
    const warnings=collectRoutingWarnings();if(editor)editor.routingWarnings=warnings;
    return warnings.map(w=>'<div class="fc-pending" data-routing-warning="'+e(w.code||'WARNING')+'">'+e(w.message)+'</div>').join('');
  }
  function routingWarningsMarkup(){return '<div id="fcRoutingWarnings" class="fc-status" style="max-height:160px;overflow:auto" role="status" aria-live="polite">'+routingWarningsContent()+'</div>';}
  function scheduleRoutingWarnings(){
    if(routingWarningFrame!==null)cancelAnimationFrame(routingWarningFrame);
    const current=editor;
    routingWarningFrame=requestAnimationFrame(()=>{
      routingWarningFrame=null;
      if(editor!==current||!editor||editor.pending||editor.busy||editor.readOnly||!v2()||editor.stage!=='canvas')return;
      readEdgeValues();
      // The reader compares against the rendered baseline. After a live read,
      // advance that baseline too, so typing/toggling back is not mistaken for
      // an unchanged control and cannot leave the previous draft value behind.
      document.querySelectorAll('#fcNodes [data-v2-values]').forEach(input=>{input.dataset.v2Rendered=input.value;});
      document.querySelectorAll('#fcNodes [data-v2-enum]').forEach(group=>{group.dataset.v2Rendered=JSON.stringify(Array.from(group.querySelectorAll('[data-v2-value]:checked')).map(input=>input.value));});
      const target=document.getElementById('fcRoutingWarnings');if(target)target.innerHTML=routingWarningsContent();
    });
  }
