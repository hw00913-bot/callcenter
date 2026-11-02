"""Join confirmed existing HP tasks into the original AI list without mutating native data."""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]

def one(code,old,new):
    if code.count(old)!=1:raise ValueError('AI task directory source anchor changed: '+old[:100])
    return code.replace(old,new,1)

def transform(kind,path,code):
    if kind!='ai' or path!='js/pages/scene-list.js':return code
    helper='''  function dProfessionalTaskRows(){return window.DAITaskDirectory?window.DAITaskDirectory.rows():(window.MockSceneList||[]);}
  function dProfessionalTaskArgument(id){return escapeHtml(JSON.stringify(id));}
  function dProfessionalTaskCount(item,key){return item._linkedProfessionalTask?(Number.isSafeInteger(item[key])&&item[key]>=0?item[key]:'待核'):(item[key]||0);}
  function dProfessionalTaskError(error){return '<div class="platform-alert warning" role="alert">'+escapeHtml(error.message||'AI专业任务暂时无法读取，请重新进入。')+'</div>';}
  function dProfessionalTaskIssues(){try{var issues=window.DAITaskDirectory?.read().issues||[];return issues.length?'<div class="platform-alert warning" role="status">'+issues.map(escapeHtml).join('；')+'</div>':'';}catch(error){return '<div class="platform-alert warning" role="alert">'+escapeHtml(error.message)+'</div>';}}
'''
    code=one(code,'  function renderCard(item) {',helper+'\n  function renderCard(item) {')
    if code.count('(window.MockSceneList || [])')<5:raise ValueError('AI task list source reads changed')
    code=code.replace('(window.MockSceneList || [])','dProfessionalTaskRows()')
    code=one(code,'  function render() {','  function render() {\n    try{dProfessionalTaskRows();}catch(error){return dProfessionalTaskError(error);}')
    code=one(code,'    var list = dProfessionalTaskRows().filter(function (item) {',"    var taskRows;try{taskRows=dProfessionalTaskRows();}catch(error){var failedGrid=page.querySelector('.scene-card-grid');if(failedGrid)failedGrid.innerHTML=dProfessionalTaskError(error);showToast(error.message,'warning');return;}\n    var list = taskRows.filter(function (item) {")
    code=code.replace('return d.id === id;','return String(d.id) === String(id);')
    code=one(code,"'<div class=\"scene-card\" data-id=\"' + item.id + '\">'", "'<div class=\"scene-card\" data-id=\"' + escapeHtml(item.id) + '\">'")
    code=one(code,".showDetail(' + item.id + ')",".showDetail(' + dProfessionalTaskArgument(item.id) + ')")
    code=one(code,".toggleMoreMenu(event,' + item.id + ')",".toggleMoreMenu(event,' + dProfessionalTaskArgument(item.id) + ')")
    for key in ['assigned','pending','called']:code=one(code,'(item.'+key+' || 0)',"dProfessionalTaskCount(item,'"+key+"')")
    for action in ['删除','暂停','终止','启动']:
        old=".onMenuAction(\\'"+action+"\\',' + id + ')"
        code=one(code,old,".onMenuAction(\\'"+action+"\\',' + dProfessionalTaskArgument(id) + ')")
    code=one(code,"id=\"moreMenu-' + id + '\" data-scene-id=\"' + id + '\"", "id=\"moreMenu-' + escapeHtml(id) + '\" data-scene-id=\"' + escapeHtml(id) + '\"")
    code=one(code,'    var d = window.MockHoupuTaskDetail && window.MockHoupuTaskDetail[item.id];','    var d = window.MockHoupuTaskDetail && window.MockHoupuTaskDetail[item.id];\n    if(!d&&item._linkedProfessionalTask)d=window.DAITaskDirectory?.detail(item.id);')
    code=one(code,'  function getOverviewStats() {',"  function getOverviewStats() {\n    if(currentDetailItem?._linkedProfessionalTask)return {imported:'待核',called:'待核',totalCalls:'待核',filtered:'待核',filteredRate:'待核',answered:'待核',answerRate:'待核',avgDuration:'待核'};")
    code=one(code,'  function renderDataOverview() {',"  function renderDataOverview() {\n    if(currentDetailItem?._linkedProfessionalTask)return '<div class=\"overview-section\"><p class=\"field-hint\">当前专业任务的统计尚未提供。业务名单请在“呼叫名单”查看，业务保存不代表供应商已受理或已拨打。</p>'+renderOverviewStatsBlock()+'</div>';")
    code=one(code,"'<div class=\"scene-card-grid\" data-anno-page=\"scene-list\"", "dProfessionalTaskIssues() + '<div class=\"scene-card-grid\" data-anno-page=\"scene-list\"")
    # Native filtering remains the same, with the associated remote task name searchable too.
    code=one(code,'if (name && name.value && item.name.indexOf(name.value) < 0) return false;',"if (name && name.value && (item.name+(item._linkedProfessionalTask?' '+item.taskName:'')).indexOf(name.value) < 0) return false;")
    code=one(code,"if (grid) grid.innerHTML = DListOrder.rows(list,{fallbackKeys:['createdAt','createTime','time']}).map(renderCard).join('');","if (grid) grid.innerHTML = list.length?DListOrder.rows(list,{fallbackKeys:['createdAt','createTime','time']}).map(renderCard).join(''):'<div class=\"report-empty\">暂无匹配的AI外呼任务，请核对查询条件或已保存的任务关联。</div>';")
    return code

def runtime_source():return (ROOT/'js/adapters/ai-task-directory.js').read_text()
