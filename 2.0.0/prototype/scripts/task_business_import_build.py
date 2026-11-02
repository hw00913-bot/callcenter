"""Connect native task hand-import entry points to the shared DIRECT business import UI.

This deterministic transform runs after all existing native transforms. It does not
change reference sources or old professional histories. Predictive tasks additionally
keep their explicitly selected business category as local task metadata, outside provider payloads. Interface entry is a read-only contract viewer for the shared ledger.
"""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]


def one(code, before, after):
    if code.count(before) != 1:
        raise ValueError('Task business import source conflict: ' + before[:140])
    return code.replace(before, after, 1)


def replace_function(code, name, replacement):
    start = re.search(r'^  (?:async )?function '+re.escape(name)+r'\(', code, re.M)
    if not start:
        raise ValueError('Missing task business import function: ' + name)
    end = re.search(r'^  (?:async )?function [A-Za-z_$][\w$]*\(', code[start.end():], re.M)
    if not end:
        raise ValueError('Missing function boundary after: ' + name)
    stop = start.end()+end.start()
    return code[:start.start()]+replacement+'\n\n'+code[stop:]



PREDICTIVE_CATEGORY_UI = r'''  function taskBusinessCategoryId(row){const a=String(row?.unifiedCategoryId||''),b=String(row?.categoryId||'');return a&&b&&a!==b?'':a||b;}
  function taskBusinessCategoryDirectory(draft){
    const target=(CloudCallData.tenants||[]).find(row=>row.tenantId===draft.tenantId&&row.enterpriseId===draft.enterpriseId),binding=window.BrandLeadStore?.binding?.(draft.tenantId),brands=[target?.brandId,binding?.brandId].filter(Boolean);if(!target||!brands.length||new Set(brands).size!==1)return {ok:false,message:'当前任务的租户和品牌关联尚未核清，请先核对所属组织。',rows:[]};const scope={tenantId:draft.tenantId,enterpriseId:draft.enterpriseId,brandId:brands[0]};
    try{const catalog=window.CustomerBusiness?.catalog?.(scope);if(!catalog?.ok)return {ok:false,message:catalog?.message||'当前品牌业务分类暂不可读取，请稍后重新打开。',scope,rows:[]};const rows=(catalog.rows||[]).filter(row=>row.enabled!==false&&(!row.brandId||row.brandId===scope.brandId)&&(!row.categoryRef?.brandId||row.categoryRef.brandId===scope.brandId)).map(row=>({id:String(row.id||row.categoryId),label:row.label||row.name||''})).filter(row=>row.id&&row.label);return {ok:true,scope,rows};}catch(error){return {ok:false,message:error.message||'业务分类目录暂不可读取。',scope,rows:[]};}
  }
  function taskBusinessCategoryHistory(row){
    const ids=new Set(),categoryOf=record=>Object.hasOwn(record?.taskImportSource||{},'categoryId')?record.taskImportSource.categoryId:record?.categoryId;let hasHistory=Number(row.total)>0,unifiedKnown=false,nativeKnown=false;try{const result=window.BusinessFlowStore?.taskImportRecords?.({method:'PREDICTIVE',taskId:String(row.taskId)}),rows=Array.isArray(result?.data)?result.data:Array.isArray(result?.data?.rows)?result.data.rows:Array.isArray(result?.data?.records)?result.data.records:null;if(result?.status==='success'&&rows&&rows.every(record=>record&&typeof record==='object'&&!Array.isArray(record)&&typeof categoryOf(record)==='string'&&!!categoryOf(record).trim())){unifiedKnown=true;hasHistory||=rows.length>0;for(const record of rows)ids.add(String(categoryOf(record)));}}catch(_){}
    if(window.DccRuntime?.isManagedTask?.(row))try{const result=DccRuntime.taskRecords(row.taskId);if(result?.ok&&Array.isArray(result.data?.records)){nativeKnown=true;hasHistory||=result.data.records.length>0;}}catch(_){}else nativeKnown=Number.isFinite(Number(row.total));
    return {hasHistory,unknown:!unifiedKnown||!nativeKnown,unifiedKnown,nativeKnown,categoryIds:[...ids]};
  }
  function taskBusinessCategoryState(draft){const row=draft.editTaskId?taskById(draft.editTaskId):null,rawA=String(row?.unifiedCategoryId||''),rawB=String(row?.categoryId||''),original=taskBusinessCategoryId(row),directory=taskBusinessCategoryDirectory(draft),history=row?taskBusinessCategoryHistory(row):{hasHistory:false,unknown:false,categoryIds:[]},conflict=!!(rawA&&rawB&&rawA!==rawB)||history.categoryIds.length>1||!!(original&&history.categoryIds.some(id=>id!==original));return {row,original,directory,history,conflict,locked:!!original&&(history.hasHistory||history.unknown)||conflict};}
  function taskBusinessCategoryIssue(draft){
    if(draft.type!=='预外呼'||draft.repeatPredictive)return null;const state=taskBusinessCategoryState(draft),selected=String(draft.values.unifiedCategoryId||''),fail=message=>({message,target:'wizardUnifiedCategoryId'});if(state.conflict)return fail('当前任务的分类配置或既有名单存在冲突，请先核对，不能自动改写归属。');if(state.row&&selected===state.original)return null;if(state.row&&state.history.unifiedKnown!==true)return fail('当前任务的统一业务名单历史尚未核清，请重新读取后再关联或更换业务分类。');if(!selected)return fail('请选择当前任务关联的业务分类，后续导入自动使用该分类。');if(!state.directory.ok)return fail(state.directory.message);if(!state.directory.rows.some(row=>row.id===selected))return fail('所选业务分类已停用或不属于当前任务品牌，请重新选择。');if(state.locked&&selected!==state.original)return fail('任务已有名单或历史尚待核对，业务分类不能随意更换。');if(state.history.categoryIds.length===1&&selected!==state.history.categoryIds[0])return fail('该任务已有统一业务名单，请关联其原有业务分类，避免混入其他分类。');return null;
  }
  function taskBusinessCategoryLabel(draft){const state=taskBusinessCategoryState(draft),selected=String(draft.values.unifiedCategoryId||'');return state.directory.rows.find(row=>row.id===selected)?.label||(selected?'原业务分类已不可用，请核对':'未配置（导入前需关联）');}
  function taskBusinessCategoryControl(draft){
    if(draft.type!=='预外呼'||draft.repeatPredictive)return '';const state=taskBusinessCategoryState(draft),selected=String(draft.values.unifiedCategoryId||''),required=state.history.categoryIds.length===1?state.history.categoryIds[0]:'',choices=state.directory.rows.filter(row=>!required||row.id===required),disabled=state.locked||!!state.row&&state.history.unifiedKnown!==true||!state.directory.ok;let options='<option value="">请选择业务分类</option>';if(selected&&!choices.some(row=>row.id===selected))options+='<option value="'+esc(selected)+'" selected>原业务分类已不可用，请核对</option>';options+=choices.map(row=>'<option value="'+esc(row.id)+'"'+(row.id===selected?' selected':'')+'>'+esc(row.label)+'</option>').join('');
    const hint=state.conflict?'分类配置或既有名单存在冲突，不能自动替换。':state.row&&state.history.unifiedKnown!==true?'统一业务名单历史尚未核清，请重新读取后再关联或更换分类；原平台配置仍可按原权限维护。':state.locked?(state.history.hasHistory?'已有名单的任务保持原分类，原客户和历史不变。':'名单历史尚未核清，暂不更换原业务分类。'):required?'该任务已有统一业务名单，只能关联其原有分类。':draft.editTaskId?'可为旧任务补齐分类，后续导入自动带入；原专业名单和历史保留原样。':'创建前关联业务分类，后续手工或接口导入自动带入，无需临时选择。';return '<label class="field"><span>业务分类'+(!draft.editTaskId?' <b>*</b>':'（导入前需关联）')+'</span><select id="wizardUnifiedCategoryId"'+(disabled?' disabled':'')+' onchange="CloudTaskWorkspace.setTaskBusinessCategory(this.value)">'+options+'</select><small class="field-hint">'+esc(state.directory.ok?(state.directory.rows.length?hint:'当前品牌暂无可用业务分类，请先由有权管理员配置。'):state.directory.message)+'</small>'+errorSlot('wizardUnifiedCategoryId')+'</label>';
  }
  function setTaskBusinessCategory(value){const draft=activeDraft();if(!draft||draft.type!=='预外呼'||draft.repeatPredictive)return false;if(draft.editTaskId&&!canEditTask(taskById(draft.editTaskId)))return false;const before=draft.values.unifiedCategoryId;draft.values.unifiedCategoryId=String(value||'');const issue=taskBusinessCategoryIssue(draft);if(issue){draft.values.unifiedCategoryId=before;showFormError(issue);return false;}persist();AppState.setDirty(true);clearFormErrors();refresh(true);refreshPreview();return true;}
  function taskBusinessVendorDraft(draft){if(draft.type!=='预外呼')return draft;const value=structuredClone(draft);delete value.values.unifiedCategoryId;delete value.values.unifiedCategoryBrandId;if(value.editOriginalValues){delete value.editOriginalValues.unifiedCategoryId;delete value.editOriginalValues.unifiedCategoryBrandId;}delete value.taskBusinessInitialValues;return value;}
  function applyTaskBusinessCategory(next,draft){if(draft.type!=='预外呼')return;const selected=String(draft.values.unifiedCategoryId||''),original=taskBusinessCategoryId(next);if(selected===original)return;const issue=taskBusinessCategoryIssue(draft);if(issue)throw Error(issue.message);const directory=taskBusinessCategoryDirectory(draft);if(!selected||!directory.ok)throw Error('当前业务分类尚未核清，未保存任务配置。');next.unifiedCategoryId=selected;next.unifiedCategoryBrandId=directory.scope.brandId;if(Object.hasOwn(next,'categoryId'))next.categoryId=selected;next.taskSettingHistory=[...(next.taskSettingHistory||[]),{at:nowText(),source:'LOCAL_BUSINESS_CATEGORY',localOnly:true,previousCategoryId:original,categoryId:selected,brandId:directory.scope.brandId}];}
  function saveTaskBusinessCategoryOnly(draft,row){
    if(draft.type!=='预外呼'||String(draft.values.unifiedCategoryId||'')===taskBusinessCategoryId(row))return null;const baseline=draft.taskBusinessInitialValues||draft.editOriginalValues||{},changed=Object.keys(draft.values).filter(key=>key!=='unifiedCategoryId'&&key!=='unifiedCategoryBrandId'&&key!=='retryEditor'&&JSON.stringify(draft.values[key])!==JSON.stringify(baseline[key]));if(changed.length)return null;const next=structuredClone(row);try{applyTaskBusinessCategory(next,draft);next.updatedAt=nowText();persistCreatedTask(next);publishStoredTask(next);}catch(error){showFormError({message:error.message||'业务分类未保存，原任务配置保持不变。',target:'wizardUnifiedCategoryId'});return false;}drafts=drafts.filter(item=>item.draftId!==draft.draftId);persist();sessionStorage.removeItem(activeKey);AppState.setDirty(false);showToast('业务分类已保存，后续导入自动使用该分类','success');RouteRuntime.back({fallback:routeForType(draft.type),refresh:true});return true;
  }
'''


def predictive_category_configuration(code):
    if '  function taskBusinessCategoryDirectory(' in code:
        if PREDICTIVE_CATEGORY_UI not in code:
            raise ValueError('Rebuild the stale predictive category UI before composing a source probe')
        return code
    code = one(code, '  function basicStep(draft) {', PREDICTIVE_CATEGORY_UI+'\n  function basicStep(draft) {')
    code = one(code, "        name: '',\n        description:", "        name: '',\n        ...(type==='预外呼'?{unifiedCategoryId:''}:{}),\n        description:")
    code = one(code, "      ${automatic?'':taskIdentity(draft)}", "      ${automatic?'':taskIdentity(draft)}\n      ${taskBusinessCategoryControl(draft)}")
    code = one(code, "${taskIdentity(draft)}</section>${resourceStep(draft)}", "${taskIdentity(draft)}${taskBusinessCategoryControl(draft)}</section>${resourceStep(draft)}")
    code = one(code, "['所属组织',tenant(draft.tenantId).name],['导入来源'", "['所属组织',tenant(draft.tenantId).name],['业务分类',taskBusinessCategoryLabel(draft)],['导入来源'")
    code = one(code, "<dt>平台任务 ID</dt>", "${draft.type==='预外呼'?'<dt>业务分类</dt><dd>'+esc(taskBusinessCategoryLabel(draft))+'</dd>':''}<dt>平台任务 ID</dt>")
    code = one(code, "      dccImportSource:row.dccImportSource||'',", "      dccImportSource:row.dccImportSource||'',unifiedCategoryId:taskBusinessCategoryId(row),")
    code = one(code, "    draft.editOriginalValues.customerClidsGroup=taskCallerSettings(row).customerClidsGroup;", "    draft.editOriginalValues.customerClidsGroup=taskCallerSettings(row).customerClidsGroup;\n    draft.taskBusinessInitialValues=structuredClone(draft.values);")
    code = one(code, "draft.tenantId = tenantId; draft.values.customerIds=[];", "draft.tenantId = tenantId;if(draft.type==='预外呼')draft.values.unifiedCategoryId=''; draft.values.customerIds=[];")
    code = one(code, "        minAvailableAgentCount:v.minAvailableAgentCount??'',callStrategy:v.callStrategy,", "        unifiedCategoryId:taskBusinessCategoryId(row),minAvailableAgentCount:v.minAvailableAgentCount??'',callStrategy:v.callStrategy,")
    code = one(code, "    if(step===2){", "    if(step===2){\n      const categoryIssue=taskBusinessCategoryIssue(draft);if(categoryIssue)return categoryIssue;")
    code = one(code, "...(draft.type==='预外呼'?{dccManaged:true,dccSourceLocked:true,dccImportSource:draft.values.dccImportSource}:{}),", "...(draft.type==='预外呼'?{dccManaged:true,dccSourceLocked:true,dccImportSource:draft.values.dccImportSource,unifiedCategoryId:String(draft.values.unifiedCategoryId),unifiedCategoryBrandId:taskBusinessCategoryDirectory(draft).scope.brandId}:{}),")
    code = one(code, "callType:row.callType,providerTaskId:explicitSupplierTaskId(row),status:row.status,", "unifiedCategoryId:row.unifiedCategoryId||'',categoryId:row.categoryId||'',unifiedCategoryBrandId:row.unifiedCategoryBrandId||'',callType:row.callType,providerTaskId:explicitSupplierTaskId(row),status:row.status,")
    code = one(code, "    const requestDraft=AliCtiFields.taskFields(draft,CloudCallData,callerPoolValidation(draft));", "    const requestDraft=AliCtiFields.taskFields(taskBusinessVendorDraft(draft),CloudCallData,callerPoolValidation(draft));")
    code = one(code, "    const request=AliCtiFields.taskUpdateFields(draft,row,CloudCallData,callerPoolValidation(draft));", "    const request=AliCtiFields.taskUpdateFields(taskBusinessVendorDraft(draft),row,CloudCallData,callerPoolValidation(draft));")
    marker="    if(!String(draft.values.name||'').trim()||Array.from(String(draft.values.name||'').trim()).length>=50){"
    code = one(code, marker, "    const categoryIssue=taskBusinessCategoryIssue(draft);if(categoryIssue){showFormError(categoryIssue);return false;}\n    const localCategory=saveTaskBusinessCategoryOnly(draft,row);if(localCategory!==null)return localCategory;\n"+marker)
    code = one(code, "    next.updatedAt=at;\n    const prior=createdTasks;", "    try{applyTaskBusinessCategory(next,draft);}catch(error){showFormError({message:error.message,target:'wizardUnifiedCategoryId'});return false;}\n    next.updatedAt=at;\n    const prior=createdTasks;")
    code = one(code, "只向 task/update 提交实际修改的接口字段；成功后再按原任务编号查询。失败或结果未知时原配置保持不变。", "业务分类用于后续名单导入，不改变已有客户和通话；其他任务设置沿原流程校验保存。")
    code = one(code, "  window.CloudTaskWorkspace = {", "  window.CloudTaskWorkspace = { setTaskBusinessCategory,")
    return code


def transform(kind, path, code):
    if kind == 'cloud' and path == 'js/app.js':
        for marker,hook in {
            '  function effectiveAccess() {':'if(window.DTaskBusinessAccess?.active())return DTaskBusinessAccess.access();',
            '  function canMenu(permission) {':'if(window.DTaskBusinessAccess?.active())return false;',
            '  function canAction(permission) {':'if(window.DTaskBusinessAccess?.active())return DTaskBusinessAccess.action(permission);',
            '  function authorizeObject(permission, object) {':'if(window.DTaskBusinessAccess?.active())return DTaskBusinessAccess.owns(permission,object);'
        }.items():
            code=one(code,marker,marker+'\n    '+hook)
    if kind == 'cloud' and path == 'js/components/customer-business.js':
        code=one(code,'const state = () => root.DSharedConfiguration?.active()?', 'const state = () => root.DTaskBusinessAccess?.active()?root.DTaskBusinessAccess.state():root.DSharedConfiguration?.active()?')
        code=one(code,'const ready = () => access().valid === true && (root.DSharedConfiguration?.active() ||', 'const ready = () => access().valid === true && (root.DTaskBusinessAccess?.active() || root.DSharedConfiguration?.active() ||')
        code=one(code,'const canManage = () => root.DSharedConfiguration?.active()?', 'const canManage = () => root.DTaskBusinessAccess?.active()?false:root.DSharedConfiguration?.active()?')
        code=one(code,'  function tenants() {', '  function tenants() {\n    if(root.DTaskBusinessAccess?.active())return root.DTaskBusinessAccess.tenants().map(clone);')
    if kind == 'cloud' and path == 'js/components/business-flow-store.js':
        code=one(code,'  function tenantValid(tenantId){', '  function tenantValid(tenantId){if(window.DTaskBusinessAccess?.active())return DTaskBusinessAccess.tenantValid(tenantId);')
    if kind == 'ai' and path == 'js/pages/scene-list.js':
        helper = r'''  function taskBusinessImportSpec(){
    if(!currentDetailItem)throw Error('请先打开准确的AI外呼任务。');
    var taskId=String(currentDetailItem.id),helper=window.DAISceneImportSource||window.parent?.DAISceneImportSource;
    var source=helper?.mode({importType:currentDetailItem.source})||'UNKNOWN',importChannel=source==='MANUAL'?'MANUAL':source==='AUTO'?'API':'UNKNOWN';
    return {method:'AI',taskId:taskId,importChannel:importChannel};
  }
  function taskBusinessImportLabel(){try{var channel=taskBusinessImportSpec().importChannel;return channel==='API'?'接口接收':channel==='MANUAL'?'手工导入':'核对导入配置';}catch(_){return '查看导入配置';}}
  function showTaskImportHistory(){
    if(!currentDetailItem||document.getElementById('importModalBackdrop'))return false;
    var html='<div class="import-modal-backdrop" id="importModalBackdrop" onclick="window.Pages[\'scene-list\'].closeImportModal(event)"><div class="import-modal" onclick="event.stopPropagation()"><div class="import-modal-header"><span class="title">导入记录</span><span class="close-btn" onclick="window.Pages[\'scene-list\'].closeImportModal()">&times;</span></div><div class="import-modal-body" id="importModalContent">'+renderImportRecordContent()+'</div></div></div>';
    document.body.insertAdjacentHTML('beforeend',html);document.body.style.overflow='hidden';return true;
  }
'''
        code = one(code, '  function showImportModal() {', helper+'\n  function showImportModal() {')
        code = replace_function(code, 'showImportModal', """  function showImportModal() {
    try{const spec=taskBusinessImportSpec();return (spec.importChannel==='API'?window.DTaskBusinessImport?.openAPI(spec):window.DTaskBusinessImport?.open(spec))||false;}
    catch(error){showToast(error.message,'warning');return false;}
  }""")
        code = replace_function(code, 'doStartUpload', "  function doStartUpload() {return showImportModal();}")
        code = replace_function(code, 'downloadTemplate', """  function downloadTemplate() {
    try{return window.DTaskBusinessImport?.downloadForTask(taskBusinessImportSpec(),'csv')||false;}
    catch(error){showToast(error.message,'warning');return false;}
  }""")
        code = one(code, '>手动导入</button><button class="btn btn-default">批量移除', ">'+taskBusinessImportLabel()+'</button><button class=\"btn btn-default\">批量移除")
        code = one(code, "  window.Pages['scene-list'] = {", "  window.Pages['scene-list'] = {\n    showTaskImportHistory:showTaskImportHistory,")
    if kind == 'cloud' and path == 'js/pages/cloud-task-workspace.js':
        code = predictive_category_configuration(code)
        code = one(code,
            "    if(window.DccRuntime?.isManagedTask(row))return window.DccRecords?.openImport(row.taskId)||false;\n    CustomerTasks.importDialog(row.taskId);return true;",
            "    if(row.callType==='预外呼')return (row.dccImportSource==='api'?window.DTaskBusinessImport?.openAPI({method:'PREDICTIVE',taskId:String(row.taskId)}):window.DTaskBusinessImport?.open({method:'PREDICTIVE',taskId:String(row.taskId)}))||false;\n    if(window.DccRuntime?.isManagedTask(row))return window.DccRecords?.openImport(row.taskId)||false;\n    CustomerTasks.importDialog(row.taskId);return true;")
        code = one(code, '>导入客户</button>`;', ">${row.dccImportSource==='api'?'接口接收':'导入客户'}</button>`;")
        code = one(code, "任务已创建，请到“客户与处理记录”页手工导入逐行线索。", "任务已创建，可在“客户与处理记录”导入新名单，业务分类自动沿用任务配置。")
        code = replace_function(code, 'openCustomerImport', """  async function openCustomerImport(taskId) {
    if(!taskId){
      const reply=await parent.DModuleHost?.readTaskImportDirectory?.({method:'PREDICTIVE'}),context=parent.DSession?.context?.();
      if(reply?.status!=='success'){showToast(reply?.message||'任务目录暂未就绪，请重试','warning');return false;}
      if(reply.data?.identity!==context?.account.id+'|'+context?.scope.id)return false;
      const tasks=reply.data.tasks||[],preferred=tasks.find(item=>!item.disabledReason);
      return window.DTaskBusinessImport?.openTaskSelector({method:'PREDICTIVE'},tasks,preferred?.taskId)||false;
    }
    const row=taskById(taskId),reason=customerImportReason(row);
    if(reason){showToast(reason,'warning');return false;}
    return (row.dccImportSource==='api'?window.DTaskBusinessImport?.openAPI({method:'PREDICTIVE',taskId:String(row.taskId)}):window.DTaskBusinessImport?.open({method:'PREDICTIVE',taskId:String(row.taskId)}))||false;
  }""")
    if kind == 'cloud' and path == 'js/components/dcc-records.js':
        helper = """  let taskBusinessImportTarget='';
  function taskBusinessManualOpen(taskId){
    const task=canonical(taskId),reason=window.CloudTaskWorkspace?.customerImportReason?.(task);
    if(!task||task.callType!=='预外呼'||task.dccImportSource==='api'||!canWrite(task)||reason){window.showToast?.(reason||'当前任务来源或权限不允许手工导入','warning');return false;}
    taskBusinessImportTarget=String(taskId);return window.DTaskBusinessImport?.open({method:'PREDICTIVE',taskId:String(taskId)})||false;
  }
  function taskBusinessDownloadTemplate(format,taskId){
    const id=taskId||taskBusinessImportTarget,task=id&&canonical(id),reason=task&&window.CloudTaskWorkspace?.customerImportReason?.(task);
    if(!task||task.callType!=='预外呼'||task.dccImportSource==='api'||!canWrite(task)||reason){window.showToast?.(reason||'请先在任务配置关联业务分类，再打开当前任务导入','warning');return false;}
    return window.DTaskBusinessImport?.downloadForTask({method:'PREDICTIVE',taskId:String(id)},format||'xlsx')||false;
  }
"""
        code = one(code, '  function openManual(taskId) {', helper+'\n  function openManual(taskId) {')
        code = replace_function(code, 'openManual', "  function openManual(taskId) {return taskBusinessManualOpen(taskId);}")
        code = replace_function(code, 'openImport', """  function openImport(taskId) {
    const task=canonical(taskId),reason=window.CloudTaskWorkspace?.customerImportReason?.(task);
    if(!task||!canWrite(task)||reason){window.showToast?.(reason||'当前任务导入权限或状态已变化','warning');return false;}
    return task.dccImportSource==='api'?window.DTaskBusinessImport?.openAPI({method:'PREDICTIVE',taskId:String(taskId)})||false:taskBusinessManualOpen(taskId);
  }""")
        code = one(code, '>导入客户</button></div>', ">${task.dccImportSource==='api'?'接口接收':'导入客户'}</button></div>")
        code = one(code, 'downloadImportTemplate:dDownloadManualTemplate', 'downloadImportTemplate:taskBusinessDownloadTemplate')
    if kind == 'cloud' and path == 'js/pages/customer-tasks.js':
        marker = "    if(!taskId)return openUnifiedImport();"
        replacement = marker+"""
    const unifiedTask=[...(CloudCallData.tasks||[]),...(CloudCallData.predictiveTasks||[])].find(row=>String(row.taskId)===String(taskId)&&row.callType==='预外呼');
    if(unifiedTask){
      if(unifiedTask.dccImportSource==='api'){showToast('当前任务已锁定接口来源，不能混入手工名单','warning');return false;}
      if(!canImportCustomers()){showToast('仅租户管理员可导入客户','warning');return false;}
      const reason=window.CloudTaskWorkspace?.customerImportReason?.(unifiedTask);if(reason){showToast(reason,'warning');return false;}
      return window.DTaskBusinessImport?.open({method:'PREDICTIVE',taskId:String(unifiedTask.taskId)})||false;
    }"""
        code = one(code, marker, replacement)
    return code


def runtime_source():
    return (ROOT/'js/adapters/task-business-import.js').read_text()


def style_source():
    return (ROOT/'js/adapters/task-business-import.css').read_text()
