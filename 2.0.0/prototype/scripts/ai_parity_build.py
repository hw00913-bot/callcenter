"""Asserted AI source fixes for retained queries and atomic scene drafts.

Apply last in the existing native AI source transformation chain. No file writes.
"""

def one(code, old, new):
    if code.count(old) != 1:
        raise ValueError('AI parity source anchor changed: ' + old[:100])
    return code.replace(old, new, 1)

SCENE_LIFECYCLE = r'''  function dScenePrepareOpen(){
    const layers=Array.from(document.querySelectorAll('#bizAddSceneBackdrop'));
    if(layers.some(layer=>layer.getAttribute('data-scene-closing')!=='1')){showToast('请先保存或关闭当前业务场景，再打开其他场景。','warning');return false;}
    // Only an already-authorized close can mark a layer. Remove it before any
    // ID-based form initialization so a new drawer cannot bind to old nodes.
    layers.forEach(layer=>layer.remove());return true;
  }
'''

def scene_lifecycle_transform(code):
    """Single live scene drawer; delayed close owns only its captured layer."""
    if '  function dScenePrepareOpen()' in code:
        if SCENE_LIFECYCLE not in code:raise ValueError('AI scene lifecycle source differs; rebuild before checking')
        return code
    code=one(code,'  var dSceneWrite=null,',SCENE_LIFECYCLE+'  var dSceneWrite=null,')
    code=one(code,'  function showAddModal(modalTitle) {','  function showAddModal(modalTitle) {\n    if(!dScenePrepareOpen())return false;')
    code=one(code,'  function showEditModal(sceneId) {','  function showEditModal(sceneId) {\n    if(!dScenePrepareOpen())return false;')
    start=code.index('  function closeAddModal(e) {');end=code.index('  function updateCharCount(',start)
    section=code[start:end]
    section=one(section,'    if (!backdrop && !drawer) return;','    if (!backdrop && !drawer) return;\n    if(backdrop)backdrop.setAttribute(\'data-scene-closing\',\'1\');')
    section=one(section,"      document.body.style.overflow = '';","      if(!document.getElementById('bizAddSceneBackdrop'))document.body.style.overflow = '';")
    return code[:start]+section+code[end:]

SCENE = r'''  var dSceneWrite=null,dSceneDraftBase='',dSceneStartEditingId=null,dSceneClosing=false;
  function dSceneSignature(){
    var form=document.getElementById('bizAddSceneDrawer');if(!form)return '';
    return JSON.stringify({controls:Array.from(form.querySelectorAll('input,select,textarea')).map(function(input){return [input.id,input.name,input.value,!!input.checked];}),inputs:customInputFields,extracts:customExtractFields,platformInputs:platformInputRows});
  }
  function dSceneStartDraft(){dSceneClosing=false;dSceneWrite=null;dSceneStartEditingId=currentEditingId;dSceneDraftBase=dSceneSignature();}
  function dSceneDraftDirty(){return !dSceneClosing&&!!document.getElementById('bizAddSceneBackdrop')&&(!!dSceneWrite||!!dSceneNested()||window.DAIConfigStore?.sceneSavePending()||dSceneSignature()!==dSceneDraftBase);}
  function dSceneNested(){return document.getElementById('bizFieldBackdrop')||document.getElementById('bizInputFieldEditBackdrop')||document.getElementById('bizInputFieldDeleteBackdrop');}
  function dSceneFinishWrite(){
    if(!dSceneWrite)return false;
    if(!window.DAIConfigStore?.saveSceneRows(dSceneWrite.rows))return false;
    currentEditingId=dSceneWrite.id;dSceneWrite=null;dSceneDraftBase=dSceneSignature();dSceneClosing=true;
    closeAddModal();refreshSceneTable();showToast('场景已保存','success');return true;
  }
  function dSceneSubmit(){
    var context=parent.DSession.context(),owner=DNativeContext.context;
    if(!context||context.account.id!==owner.account.id||context.scope.id!==owner.scope.id||parent.DApp.currentPage()!=='PAGE-2110'||!parent.DSession.canWrite('PAGE-2110')){showToast('当前场景保存权限已变化，请保留表单后重新核对。','warning');return false;}
    if(dSceneNested()){showToast('请先确认或取消当前字段弹窗，再保存整个业务场景。','warning');return false;}
    if(dSceneWrite){
      if(!window.DAIConfigStore?.sceneSavePending()&&JSON.stringify(SceneRows)===JSON.stringify(dSceneWrite.rows)){currentEditingId=dSceneWrite.id;if(dSceneSignature()===dSceneWrite.draftSignature){dSceneWrite=null;dSceneDraftBase=dSceneSignature();dSceneClosing=true;closeAddModal();refreshSceneTable();showToast('此前保存已确认生效','info');return true;}dSceneWrite=null;}
      else return dSceneFinishWrite();
    }
    var error=validateDrawerForm();if(error){showToast(error,'warning');return false;}
    var data=collectFormSceneRow();
    if(data.platform==='电声'){var estimate=buildDianshengTaskEstimate();data.callTimeWindow=estimate.callTimeWindow;data.nDayMCallPolicy=estimate.nDayMCallPolicy;data.autoStart=estimate.autoStart;}
    var next=JSON.parse(JSON.stringify(SceneRows)),id=currentEditingId;
    if(id){var row=next.find(function(item){return item.id===id;});if(!row){showToast('原场景已变化，请保留表单后核对。','warning');return false;}Object.assign(row,data);}
    else{id=next.reduce(function(max,item){return Math.max(max,item.id||0);},0)+1;next.push(Object.assign({id:id},data));}
    dSceneWrite={id:id,rows:next,draftSignature:dSceneSignature()};return dSceneFinishWrite();
  }
  function dSceneDiscard(){
    if(dSceneWrite){var outcome=window.DAIConfigStore.cancelSceneSave(dSceneWrite.rows);if(outcome==='saved')showToast('此前保存已确认生效，当前表单已关闭。','info');dSceneWrite=null;}
    if(dSceneNested()){closeFieldModal();closeInputFieldEditModal();closeInputFieldDeleteConfirm();}
    currentEditingId=dSceneStartEditingId;dSceneDraftBase=dSceneSignature();dSceneClosing=true;closeAddModal();refreshSceneTable();
  }
  function dSceneGuard(){return {isDirty:dSceneDraftDirty,save:dSceneSubmit,discard:dSceneDiscard};}
  function dSceneClose(event){
    if(event&&event.target!==event.currentTarget)return;
    if(dSceneDraftDirty())return parent.DApp.leave(null,function(){dSceneDiscard();});
    dSceneDraftBase=dSceneSignature();dSceneClosing=true;closeAddModal();
  }

'''

# Input formats follow these original date/date-time controls. End dates are inclusive.
DATES = r'''  function dDateBound(value,end){
    var text=String(value||'').trim().replace(' ','T');if(!text)return '';
    if(!/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2})?)?$/.test(text))throw Error('请使用 YYYY-MM-DD 或 YYYY-MM-DD HH:mm 的时间格式。');
    var day=text.slice(0,10),date=new Date(day+'T00:00:00Z');if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==day)throw Error('请输入有效的日期。');
    if(text.length>10&&(Number(text.slice(11,13))>23||Number(text.slice(14,16))>59||text.length>16&&Number(text.slice(17,19))>59))throw Error('请输入有效的时间。');
    return text.length===10?text+(end?'T23:59:59':'T00:00:00'):text.length===16?text+(end?':59':':00'):text;
  }
  function dDateRange(inputs,offset){var from=dDateBound(inputs[offset]?.value,false),to=dDateBound(inputs[offset+1]?.value,true);if(from&&to&&from>to)throw Error('开始时间不能晚于结束时间。');return {from:from,to:to};}
  function dDateMatches(value,range){if(!range.from&&!range.to)return true;var text=String(value||'').trim().replace(' ','T');if(!/^\d{4}-\d{2}-\d{2}/.test(text))return false;if(text.length===10)text+='T00:00:00';return (!range.from||text>=range.from)&&(!range.to||text<=range.to);}
'''

CALL_QUERY = r'''  var dCallView='call';
  function dQueryCallStats(quiet){
    var page=document.querySelector('.report-call-page');if(!page)return false;
    var range;try{range=dDateRange(page.querySelectorAll('.filter-date-range input'),0);}catch(error){showToast(error.message,'warning');return false;}
    var selects=page.querySelectorAll('.filter-select'),scene=selects[0]?.value||'',platform=selects[1]?.value||'',body=page.querySelector('.report-table tbody');
    var selected=rows.filter(function(row){return dDateMatches(row.date,range)&&(!scene||row.sceneName===scene)&&(!platform||row.platformName===platform);});
    function escape(value){return String(value==null?'':value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
    var count=dCallView==='customer'?8:11;
    if(body)body.innerHTML=selected.length?selected.map(function(row,index){var cells=dCallView==='customer'?[index+1,row.date,row.sceneName,row.platformName,row.rosterTotal,row.connectedTotal,row.duration,'-']:[index+1,row.date,row.sceneName,row.platformName,row.dialTotal,row.rosterTotal,row.connectedTotal,row.missedTotal,formatRate(row.connectedTotal,row.rosterTotal),formatRate(row.connectedTotal+row.missedTotal,row.dialTotal),row.duration];return '<tr>'+cells.map(function(value){return '<td>'+escape(value)+'</td>';}).join('')+'</tr>';}).join(''):'<tr><td colspan="'+count+'"><div class="report-empty">暂无符合条件的数据</div></td></tr>';
    if(!quiet)showToast('已按当前条件查询','info');return true;
  }
  function doQuery(){return dQueryCallStats(false);}

'''


def transform(kind,path,code):
    if kind!='ai':return code
    if path=='js/common.js':
        start=code.index('function doExport(event) {');end=code.index('\nfunction doQuery()',start)
        old=code[start:end]
        if '导出成功！文件已准备就绪。' not in old or '导出任务已提交' not in old:
            raise ValueError('AI generic export placeholder anchor changed')
        code=code[:start]+"function doExport(event) {\n  if(event&&typeof event.preventDefault==='function')event.preventDefault();\n  showToast('此导出功能尚未接入，本次未生成文件。', 'info');\n  return false;\n}\n"+code[end:]
    if path=='js/pages/sys-scene.js':
        code=one(code,'    onPlatformChange();\n  }\n\n  function showEditModal', '    onPlatformChange();dSceneStartDraft();\n  }\n\n  function showEditModal')
        code=one(code,'    dRestoreCommonSceneForm(data);','    dRestoreCommonSceneForm(data);dSceneStartDraft();')
        marker="  window.Pages = window.Pages || {};\n  window.Pages['sys-scene'] = {"
        code=one(code,marker,SCENE+marker+'\n    integrationSceneGuard:dSceneGuard,')
        code=one(code,'    closeAddModal: closeAddModal,','    closeAddModal: dSceneClose,')
        code=one(code,'    submitAddModal: submitAddModal,','    submitAddModal: dSceneSubmit,')
        code=scene_lifecycle_transform(code)
    if path=='js/pages/report-call.js':
        start=code.index('  function doQuery() {');end=code.index('  function resetFilters() {',start)
        code=code[:start]+DATES+CALL_QUERY+code[end:]
        code=one(code,'      tbody.innerHTML = renderRows();','      dQueryCallStats(true);')
        code=one(code,'  function render() {',"  function render() {\n    dCallView='call';")
        code=one(code,'  function switchTab(el, tabName) {','  function switchTab(el, tabName) {\n    dCallView=tabName;')
        code=one(code,'    if (content) content.innerHTML = renderTabContent(tabName);','    if (content) content.innerHTML = renderTabContent(tabName);\n    dQueryCallStats(true);')
        code=one(code,'init: function () {}','init: function () {dQueryCallStats(true);}')
    if path=='js/pages/result-records.js':
        code=one(code,'  function getFilteredRows() {',DATES+'\n  function getFilteredRows() {')
        code=one(code,"    var list = rows.filter(function (item) {", "    var dates=page.querySelectorAll('.filter-date-range input'),startRange=dDateRange(dates,0),endRange=dDateRange(dates,2);\n    var list = rows.filter(function (item) {\n      if(!dDateMatches(item.startTime,startRange)||!dDateMatches(item.endTime,endRange))return false;")
        code=one(code,'  function doQuery() {',"  function doQuery() {\n    try{var page=document.querySelector('.result-records-page'),dates=page?.querySelectorAll('.filter-date-range input')||[];dDateRange(dates,0);dDateRange(dates,2);}catch(error){showToast(error.message,'warning');return false;}")
        code=one(code,'  function toggleSort(field, el) {',"  function toggleSort(field, el) {\n    try{var page=document.querySelector('.result-records-page'),dates=page?.querySelectorAll('.filter-date-range input')||[];dDateRange(dates,0);dDateRange(dates,2);}catch(error){showToast(error.message,'warning');return false;}")
        code=code.replace('导出任务已提交，系统正在生成报表...', '本通话记录导出尚未接入，本次未生成文件。')
    if path=='js/pages/result-clue.js':
        code=one(code,'  function getFilteredRows() {',DATES+'\n  function getFilteredRows() {')
        code=one(code,'    return allRows.filter(function (item) {',"    var dates=document.querySelectorAll('.clue-records-page .filter-date-range input'),range=dDateRange(dates,0);\n    return allRows.filter(function (item) {\n      if(!dDateMatches(item.lastVisitTime,range))return false;")
        code=one(code,'  function doQuery() {',"  function doQuery() {\n    try{dDateRange(document.querySelectorAll('.clue-records-page .filter-date-range input'),0);}catch(error){showToast(error.message,'warning');return false;}")
        code=one(code,'  function resetFilters() {',"  function resetFilters() {\n    document.querySelectorAll('.clue-records-page .filter-date-range input').forEach(function(input){input.value='';});")
    return code
