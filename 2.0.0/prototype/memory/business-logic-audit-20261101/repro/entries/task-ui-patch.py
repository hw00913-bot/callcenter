from pathlib import Path
p=Path('js/adapters/task-business-import.js');s=p.read_text()
s=s.replace("  const panels=new Map();let current=null,sequence=0;", "  const panels=new Map(),partialDrafts=new Map();let current=null,sequence=0;")
marker='  function controls(){'
helpers=r'''  function partialDraftIdentity(d){return JSON.stringify([d.owner,d.spec.method,String(d.spec.taskId),d.spec.importChannel,d.context?.categoryId||d.spec.categoryId,stampSchema(d)]);}
  function rememberPartialDraft(d=current){
    if(!d?.partialRemainder||!manual(d)||d.spec.method!=='PREDICTIVE'||!d.context||!alive(d))return false;
    capture(d);const key=partialDraftIdentity(d);if(d.partialDraftKey&&d.partialDraftKey!==key)partialDrafts.delete(d.partialDraftKey);d.partialDraftKey=key;
    partialDrafts.set(key,{owner:d.owner,spec:clone(d.spec),schema:stampSchema(d),name:d.name,text:d.text,priority:d.priority,mapping:clone(d.mapping),editRows:clone(d.predEditRows),sourceTable:clone(d.predSourceTable),previewData:clone(d.previewData),fileName:d.fileName||'',contextFingerprint:d.context.targetFingerprint});return true;
  }
  function restorePartialDraft(d){
    if(!d.restorePartialOnLoad||d.spec.method!=='PREDICTIVE'||!manual(d)||d.context?.schemaReady!==true||d.context?.categoryLocked!==true)return false;
    d.restorePartialOnLoad=false;const key=partialDraftIdentity(d),saved=partialDrafts.get(key);if(!saved||saved.owner!==d.owner||saved.schema!==stampSchema(d))return false;
    Object.assign(d,{name:saved.name,text:saved.text,priority:saved.priority,mapping:clone(saved.mapping),predEditRows:clone(saved.editRows),predSourceTable:clone(saved.sourceTable),previewData:clone(saved.previewData),fileName:saved.fileName,partialRemainder:true,partialDraftKey:key,dirty:true,completed:false,preview:null,requestPayload:null,requestId:uid()});
    d.message='已恢复当前任务未通过的名单草稿；成功行已封存，请修正后重新检查。';d.messageTone='info';return true;
  }
  function finishPartialImport(d,count){
    if(d.spec.method!=='PREDICTIVE'||!d.previewData||!d.predEditRows||!d.predSourceTable)return false;
    const failed=(d.previewData.rows||[]).map((row,index)=>row.status!=='success'?index:-1).filter(index=>index>=0);if(!failed.length)return false;
    const header=clone(d.predSourceTable[0]||[]),sourceRows=d.predSourceTable.slice(1),remaining=failed.map(index=>clone(d.predEditRows[index]));
    if(failed.some(index=>!sourceRows[index]||!d.predEditRows[index]))throw Error('已保存有效行，但未通过草稿的原行对应关系待核，请保留当前内容后核对。');
    const retained={...clone(d.previewData),rows:failed.map((index,newIndex)=>({...clone(d.previewData.rows[index]),index:newIndex})),counts:{success:0,failed:failed.length,duplicate:0,unknown:0}};delete retained.importBasisToken;
    Object.assign(d,{pendingRequestId:'',completed:false,dirty:true,preview:null,requestPayload:null,requestId:uid(),partialRemainder:true,predEditRows:remaining,predSourceTable:[header,...failed.map(index=>clone(sourceRows[index]))],previewData:retained,previewPage:1});d.text=root.DImportFiles.toCsv(d.predSourceTable);
    d.message='已建立 '+count+' 条直接跟进业务；剩余 '+failed.length+' 行未通过内容已保留，可修正后重新检查。成功行不会再次提交。';d.messageTone='success';render();rememberPartialDraft(d);return true;
  }
  function keepPartialAndClose(){const d=current;if(!d?.partialRemainder||d.busy||d.pendingRequestId)return false;rememberPartialDraft(d);return close(true);}
'''
assert marker in s;s=s.replace(marker,helpers+marker,1)
s=s.replace("d.context=clone(ctx);if(ctx.categoryId)", "d.context=clone(ctx);if(ctx.categoryId)")
s=s.replace("if(priorSchema&&priorSchema!==stampSchema(d))d.mapping=null;d.message='';render();return true;", "if(priorSchema&&priorSchema!==stampSchema(d))d.mapping=null;d.message='';restorePartialDraft(d);render();return true;")
s=s.replace("context:null,preview:null,previewData:null,mapping:null,message:'',requestPayload:null", "context:null,preview:null,previewData:null,mapping:null,message:'',requestPayload:null,restorePartialOnLoad:true")
# Preserve source-row identity while preflighting and editing a mapped partial import.
s=s.replace("const source=table();let projected=source;", "const source=table();if(d.spec.method==='PREDICTIVE')d.predSourceTable=[clone(source[0]||[]),...source.slice(1).filter(row=>row.some(cell=>String(cell).trim())).map(clone)];let projected=source;")
s=s.replace("if(!writable(d)||d.spec.method!=='PREDICTIVE'||!manual(d)||!Number.isInteger(index)||!d.predEditRows?.[index]", "if(!writable(d)||d.spec.method!=='PREDICTIVE'||!manual(d)||!d.previewData||!Number.isInteger(index)||!d.predEditRows?.[index]")
old="const fields=schema(d);d.text=root.DImportFiles.toCsv([fields.map(field=>field.label),...d.predEditRows.map(item=>fields.map(field=>field.key==='code'?item.code:item.fields[field.key]??''))]);"
new="const fields=schema(d),source=d.predSourceTable,keys=d.mapping?.keys||source?.[0]?.map(label=>root.DImportFiles.headerKey(String(label).trim(),fields)),column=keys?.indexOf(key);if(source?.[index+1]&&column>=0){source[index+1][column]=String(next);d.text=root.DImportFiles.toCsv(source);}else{d.predSourceTable=[fields.map(field=>field.label),...d.predEditRows.map(item=>fields.map(field=>field.key==='code'?item.code:item.fields[field.key]??''))];d.text=root.DImportFiles.toCsv(d.predSourceTable);d.mapping=null;}"
assert old in s;s=s.replace(old,new,1)
s=s.replace("if(text)text.value=d.text;d.mapping=null;d.preview=null;d.requestPayload=null;", "if(text)text.value=d.text;d.preview=null;d.requestPayload=null;")
# Replace reconciliation normalization and the mutation outcome branch as one bounded function.
start=s.index('  function normalizeReceipt(');end=s.index('  async function downloadTemplate',start)
replacement=r'''  function normalizeReceipt(ret,pendingRequestId=''){
    const status=ret?.data?.status,known=['unknown','failed','success'].includes(status),reportedId=ret?.requestId||ret?.data?.requestId;
    if(pendingRequestId){
      const matches=!reportedId||String(reportedId)===String(pendingRequestId),canonical=matches&&known&&(ret?.status==='success'||ret?.status==='failed'&&status==='failed'&&String(reportedId||'')===String(pendingRequestId));
      if(!canonical)return {status:'unknown',requestId:pendingRequestId,message:ret?.message||'原次回执暂时无法可靠读取，请继续核对同次请求；本次未发起新的导入。'};
      return status==='success'?{status:'success',requestId:pendingRequestId,data:ret.data.result||ret.data.data||ret.data}:{status,requestId:pendingRequestId,message:ret.data.message||ret.message||'原次请求状态待核'};
    }
    if(ret?.status==='success'&&known)return status==='success'?{status:'success',data:ret.data.result||ret.data.data||ret.data}:{status,requestId:ret.data.requestId||ret.requestId,message:ret.data.message||ret.message};return ret;
  }
  async function submit(){
    const d=current;if(!manual(d)||!alive(d)||d.busy||d.loading||d.completed)return false;let payload;
    if(!d.pendingRequestId){try{payload=input(d.spec.method==='PREDICTIVE');if(!d.preview||d.preview.stamp!==inputStamp(payload))throw Error('请先按当前任务、名单、字段和优先级重新检查。');d.requestPayload={...clone(d.preview.submissionPayload||payload),importBasisToken:d.preview.token,requestId:d.requestId};}catch(error){showMessage(error.message);return false;}}
    const pendingRequestId=d.pendingRequestId;d.busy=true;showMessage(pendingRequestId?'正在核对原次导入结果…':'正在保存本批直接跟进业务…','info');controls();
    let raw;try{raw=pendingRequestId?await call('reconcileTaskImport',pendingRequestId,clone(d.spec)):await call('importTaskRecords',clone(d.requestPayload),{requestId:d.requestId});}catch(error){raw={status:'unknown',requestId:pendingRequestId||d.requestId,message:error.message||'原次结果仍待核对'};}
    const ret=normalizeReceipt(raw,pendingRequestId);if(!alive(d))return false;d.busy=false;
    if(ret?.status==='unknown'){d.pendingRequestId=pendingRequestId||ret.requestId||d.requestId;showMessage(ret.message||'本次结果待核，请核对同次请求，不能重新导入。','warning');controls();return false;}
    if(ret?.status!=='success'){d.pendingRequestId='';d.preview=null;d.requestPayload=null;d.requestId=uid();showMessage(ret?.message||'本次导入未成功，原名单与历史保留，请重新检查。');controls();return false;}
    d.pendingRequestId='';const count=ret.data?.rows?.length??ret.data?.createdCount??ret.data?.counts?.success,partial=finishPartialImport(d,Number.isInteger(count)?count:d.requestPayload?.rows?.length||0);
    if(!partial){if(d.partialDraftKey)partialDrafts.delete(d.partialDraftKey);d.partialRemainder=false;d.partialDraftKey='';d.completed=true;d.dirty=false;d.preview=null;showMessage((Number.isInteger(count)?'已建立 '+count+' 条直接跟进业务':'本批直接跟进业务已保存')+'，已关联当前任务；尚未发起呼叫。','success');controls();}
    refreshPanels(d.spec);root.document.dispatchEvent?.(new root.CustomEvent('task-business-imported',{detail:{spec:clone(d.spec),data:clone(ret.data)}}));return true;
  }
'''
s=s[:start]+replacement+s[end:]
# Unknown requests block both close and discard; partial-only closure preserves the scoped remainder.
start=s.index('  function close(force=false)');end=s.index('  function cancelClose()',start)
s=s[:start]+r'''  function close(force=false){const d=current;if(!d)return true;if(d.busy||d.pendingRequestId){showMessage('本次仍在办理或结果待核，请先核对同次结果。');return false;}if(d.dirty&&!d.completed&&!force){const host=root.document.getElementById('tbi-close-confirm');if(host)host.innerHTML=d.partialRemainder?'<div class="tbi-discard"><p>本窗口仅剩未通过的名单。可保留草稿后关闭，或明确放弃这些未提交内容。</p>'+button('继续修正','cancelClose')+button('保留草稿并关闭','keepPartialAndClose',[],true)+button('放弃未通过草稿并关闭','discard')+'</div>':'<div class="tbi-discard"><p>本次名单尚未提交，是否放弃未保存内容？原业务和历史不受影响。</p>'+button('继续编辑','cancelClose')+button('放弃并关闭','discard',[],true)+'</div>';return false;}if(d.partialRemainder)rememberPartialDraft(d);d.fileVersion++;d.contextVersion++;if(d.spec.method==='PREDICTIVE'&&root.PlatformUI?.closeLayer)root.PlatformUI.closeLayer(modalId);else d.modal.remove();current=null;root.parent?.DApp?.setDraftGuard?.(null);return true;}
'''+s[end:]
s=s.replace("  function discard(){return close(true);}", "  function discard(){const d=current;if(d?.busy||d?.pendingRequestId){showMessage('原次导入在途或待核，不能丢弃同次结果。');return false;}if(d?.partialDraftKey&&d.owner===scopeKey())partialDrafts.delete(d.partialDraftKey);if(d){d.partialRemainder=false;d.partialDraftKey='';}return close(true);}")
s=s.replace(";close(true);}};}", ";discard();}};}")
s=s.replace("{open,openTaskConfiguration,fillSample", "{open,keepPartialAndClose,openTaskConfiguration,fillSample")
p.write_text(s)
