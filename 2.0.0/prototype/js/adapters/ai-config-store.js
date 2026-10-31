/* Persist original AI scene/tag models within one explicit local scope. */
(function(){
  'use strict';
  const names=['MockLocalTagSets','MockSupplierLocalTagMappings','MockSupplierTagPool','MockTagConfigs','MockTagScenes','MockTagSuppliers','MockTenantTypes'];
  const clone=v=>JSON.parse(JSON.stringify(v));
  const owner=DNativeContext.context,key=parent.DSession.prefix+'ai-config:'+owner.scope.kind+':'+owner.scope.id;
  let revision=0,raw=null,committed=null,candidate=null,error='',pending=false,sceneStage=null;
  const sceneControlStates=new Map();
  const contextValid=()=>{const c=parent.DSession.context();return c&&c.account.id===owner.account.id&&c.scope.id===owner.scope.id;};
  function normalizeAssignments(){window.DAIAssignmentIdentity.normalize(window.MockAssignedData||{},owner.scope.id);}
  function snapshot(){normalizeAssignments();return {sceneRows:clone(sceneStage||window.Pages?.['sys-scene']?.integrationState?.()||window.MockSceneRows||[]),tags:Object.fromEntries(names.map(n=>[n,clone(window[n])])),imports:{assigned:clone(window.MockAssignedData||{}),history:clone(window.MockImportHistory||[])},intentLevels:clone(window.Pages?.['scene-list']?.integrationIntents?.()||window.DPersistedIntentLevels||{})};}
  function apply(data){window.MockSceneRows=clone(data.sceneRows);window.Pages?.['sys-scene']?.restoreIntegrationState?.(clone(data.sceneRows));names.forEach(n=>{window[n]=clone(data.tags[n]);});if(data.imports){window.MockAssignedData=clone(data.imports.assigned);window.MockImportHistory=clone(data.imports.history);normalizeAssignments();}window.DPersistedIntentLevels=clone(data.intentLevels||{});window.Pages?.['scene-list']?.restoreIntegrationIntents?.(window.DPersistedIntentLevels);}
  function validIntents(value){return value&&typeof value==='object'&&!Array.isArray(value)&&Object.entries(value).every(([key,levels])=>!['__proto__','constructor','prototype'].includes(key)&&Array.isArray(levels)&&levels.every(level=>level&&typeof level.label==='string'&&Array.isArray(level.tags)&&level.tags.length<=3&&level.tags.every(tag=>typeof tag==='string')));}
  function validate(data){if(!data||!Array.isArray(data.sceneRows)||!data.tags||!names.every(n=>data.tags[n]&&typeof data.tags[n]==='object')||data.imports&&(!Array.isArray(data.imports.history)||!data.imports.assigned||typeof data.imports.assigned!=='object')||data.intentLevels!==undefined&&!validIntents(data.intentLevels))throw Error('已保存的AI资料格式待核，原数据保留。');}
  function load(){try{const value=localStorage.getItem(key);if(value!==null){const doc=JSON.parse(value);if(doc.schema!==1||!Number.isSafeInteger(doc.revision)||doc.revision<1)throw Error('已保存的AI配置版本待核。');validate(doc.data);apply(doc.data);revision=doc.revision;}raw=value;committed=snapshot();error='';return true;}catch(e){error=/^[\u4e00-\u9fff]/.test(e.message||'')?e.message:'AI配置暂时无法读取，原数据已保留。';return false;}}
  function lockSceneControls(){
    if(sceneStage){for(const node of document.querySelectorAll('#bizAddSceneBackdrop input,#bizAddSceneBackdrop select,#bizAddSceneBackdrop textarea,#bizAddSceneBackdrop button')){if(!sceneControlStates.has(node))sceneControlStates.set(node,node.disabled);node.disabled=true;}}
    else{for(const [node,disabled] of sceneControlStates)if(node.isConnected)node.disabled=disabled;sceneControlStates.clear();}
  }
  function banner(){lockSceneControls();document.getElementById('d-ai-config-save-error')?.remove();if(!error)return;const box=document.createElement('div');box.id='d-ai-config-save-error';box.className='platform-alert warning';box.setAttribute('role','alert');box.style.cssText='position:fixed;bottom:16px;left:24px;right:24px;z-index:12000';const text=document.createElement('span');text.textContent=error;box.appendChild(text);const button=document.createElement('button');button.className='btn';button.textContent=pending?'重新保存':'重新读取';button.onclick=()=>{if(pending)flush();else if(load())window.Nav?.navigateTo(parent.DSession.page(parent.DApp.currentPage()).route.split('#')[0]);banner();};box.appendChild(button);document.body.appendChild(box);}
  function flush(){if(!contextValid()||!parent.DSession.canWrite(parent.DApp.currentPage())){error='当前配置权限已变化，尚未保存的修改保留在本页。';banner();return false;}try{
      const existing=localStorage.getItem(key);if(candidate&&existing===candidate){const doc=JSON.parse(existing);validate(doc.data);apply(doc.data);raw=existing;revision=doc.revision;committed=clone(doc.data);pending=false;candidate=null;sceneStage=null;error='';banner();return true;}
      if(existing!==raw)throw Error('其他窗口已更新配置，请先核对；本页修改尚未覆盖保存。');
      const data=snapshot();if(parent.DSession.can('F20'))window.DUnifiedAI?.registerContexts?.(data);else if(committed&&JSON.stringify(data.tags)!==JSON.stringify(committed.tags))throw Error('当前没有AI标签配置权限，标签修改未保存。');validate(data);candidate=JSON.stringify({schema:1,revision:revision+1,data});localStorage.setItem(key,candidate);
      if(localStorage.getItem(key)!==candidate)throw Error('本次保存结果待核，请重新保存以核对同次结果。');
      raw=candidate;candidate=null;revision++;committed=data;apply(data);pending=false;sceneStage=null;error='';banner();return true;
    }catch(e){pending=true;error=e.name==='QuotaExceededError'?'本地存储空间不足，修改已保留，请重新保存。':/^[\u4e00-\u9fff]/.test(e.message||'')?e.message:'本地保存未完成，修改已保留，请重试。';banner();return false;}}
  function saveSceneRows(rows){
    if(!Array.isArray(rows)){error='场景候选资料格式待核，当前表单已保留。';banner();return false;}
    if(pending&&!sceneStage||sceneStage&&JSON.stringify(sceneStage)!==JSON.stringify(rows)){error='已有本次配置保存待核，请先核对原候选。';banner();return false;}
    try{if(!pending&&!error&&committed&&JSON.stringify(committed.sceneRows)===JSON.stringify(rows)&&localStorage.getItem(key)===raw)return true;}catch(_){}
    sceneStage=clone(rows);pending=true;return flush();
  }
  function cancelSceneSave(rows){
    if(!contextValid())throw Error('使用范围已变化，请先核对本次保存。');
    let existing;try{existing=localStorage.getItem(key);}catch(_){throw Error('本次保存暂时无法读取，请保留当前表单。');}
    if(sceneStage&&JSON.stringify(sceneStage)!==JSON.stringify(rows))throw Error('原场景候选已变化，请先核对。');
    if(sceneStage&&candidate&&existing===candidate){const doc=JSON.parse(existing);validate(doc.data);apply(doc.data);raw=existing;revision=doc.revision;committed=clone(doc.data);pending=false;candidate=null;sceneStage=null;error='';banner();return 'saved';}
    if(existing!==raw)throw Error('配置已由其他窗口更新，请保留当前表单后核对。');
    if(sceneStage){sceneStage=null;pending=false;candidate=null;error='';banner();return 'draft';}
    if(pending)throw Error('已有其他配置保存待核，请先确认原结果。');
    return committed&&JSON.stringify(committed.sceneRows)===JSON.stringify(rows)?'saved':'draft';
  }
  function guard(){return {isDirty:()=>pending,save:flush,discard(){if(sceneStage){cancelSceneSave(sceneStage);return;}const outcome=cancelIntentSave();if(outcome==='saved')return;if(committed)apply(committed);banner();}};}
  // Cancel only the uncommitted intent draft. An uncertain write must be read back
  // before it can be discarded; a confirmed write is retained as the saved result.
  function cancelIntentSave(){
    if(!pending)return 'draft';
    if(!contextValid())throw Error('使用范围已变化，请先核对本次保存结果。');
    let existing;try{existing=localStorage.getItem(key);}catch(_){throw Error('本次保存结果暂时无法读取，请保留当前内容后重试。');}
    if(candidate&&existing===candidate){const doc=JSON.parse(existing);validate(doc.data);apply(doc.data);raw=existing;revision=doc.revision;committed=clone(doc.data);pending=false;candidate=null;error='';banner();return 'saved';}
    if(existing!==raw)throw Error('配置已由其他窗口更新，请先核对；当前内容已保留。');
    pending=false;candidate=null;error='';banner();return 'draft';
  }
  // Read-only, current-model proof for guarded destructive operations. No reload or write.
  function reviewCurrent(){
    if(!contextValid()||!parent.DSession.canWrite(parent.DApp.currentPage()))return {ok:false,reason:'当前配置权限已变化，请重新打开。'};
    if(pending||error)return {ok:false,reason:'配置有未提交或待核结果，请先核对原操作。'};
    if(!Number.isSafeInteger(revision)||revision<0||revision>=Number.MAX_SAFE_INTEGER)return {ok:false,reason:'配置版本无法安全继续保存，请保留原资料。'};
    try{
      if(localStorage.getItem(key)!==raw)return {ok:false,reason:'其他窗口已更新配置，请重新读取后核对。'};
      if(raw!==null){
        const only=(value,allowed)=>!!value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).every(name=>allowed.includes(name));
        const doc=JSON.parse(raw),data=doc?.data;
        if(!only(doc,['schema','revision','data'])||doc.schema!==1||doc.revision!==revision||!only(data,['sceneRows','tags','imports','intentLevels'])||!only(data.tags,names)||!names.every(name=>Object.hasOwn(data.tags,name))||data.imports!=null&&!only(data.imports,['assigned','history']))return {ok:false,reason:'持久配置含未知或无法完整核验的专业资料，请保留原内容。'};
      }
      const current=snapshot();validate(current);
      if(JSON.stringify(current)!==JSON.stringify(committed))return {ok:false,reason:'当前配置尚未提交，请先保存或取消。'};
      return {ok:true,revision};
    }catch(_){return {ok:false,reason:'配置当前版本暂时无法读取，请保留原资料。'};}
  }

  function changed(){if(!contextValid()||!['PAGE-2110','PAGE-2111'].includes(parent.DApp?.currentPage())||!parent.DSession.canWrite(parent.DApp.currentPage())||pending||error)return;if(JSON.stringify(snapshot())!==JSON.stringify(committed)){pending=true;if(!flush())parent.DApp.setDraftGuard(guard());}}
  load();
  ['click','change'].forEach(type=>document.addEventListener(type,event=>{
    if(!['PAGE-2110','PAGE-2111'].includes(parent.DApp?.currentPage()))return;
    if((pending||error)&&!event.target.closest('#d-ai-config-save-error')){event.preventDefault();event.stopImmediatePropagation();banner();if(pending)parent.DApp.setDraftGuard(guard());return;}
    // A microtask may run between capture and target handlers in the browser.
    // Wait until the complete original click/change handler has updated its model.
    setTimeout(changed,0);
  },true));
  window.DAIConfigStore={saveSceneRows,cancelSceneSave,sceneSavePending:()=>!!sceneStage,reviewCurrent,ready:()=>!error||pending,error:()=>error,snapshot,flush,load,banner,guard,key,cancelIntentSave,saveIntent(){pending=true;return flush();},saveImport(){pending=true;const ok=flush();if(!ok)parent.DApp.setDraftGuard(guard());return ok;}};
})();
