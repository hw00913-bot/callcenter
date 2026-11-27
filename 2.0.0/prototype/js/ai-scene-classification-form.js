/* Use the native business directory for AI scene categories and keep input source task-owned. */
(() => {
  'use strict';

  const ai = window.DNativeModules?.ai;
  if (!ai) return;

  let html = ai.html;
  function replace(oldText,newText) {
    const at = html.indexOf(oldText);
    if (at<0 || html.indexOf(oldText,at+oldText.length)>=0) {
      throw Error('无法定位 AI 业务场景表单。');
    }
    html = html.slice(0,at)+newText+html.slice(at+oldText.length);
  }

  function replaceSection(start,end,newText) {
    const first = html.indexOf(start);
    const last = html.indexOf(end,first+start.length);
    if (first<0 || last<0 || html.indexOf(start,first+start.length)>=0) {
      throw Error('无法定位 AI 业务场景表单区块。');
    }
    html = html.slice(0,first)+newText+html.slice(last);
  }

  replace('<label class="biz-form-label required">场景类型</label>','<label class="biz-form-label required">业务分类</label>');
  replace("        '<td>' + row.category + '</td>' +",
    "        '<td>' + escapeHtmlText(DUnifiedAI.scenes().find(category=>category.categoryId===row.unifiedCategoryId)?.name || row.category) + '</td>' +");
  replace("  function matches(row,id){return row.unifiedCategoryId?row.unifiedCategoryId===id:parent.DUnifiedCategories.definitions.some(d=>d.id===id&&d.label===row.category);}",
    "  function matches(row,id){if(row.unifiedCategoryId)return row.unifiedCategoryId===id;const found=scenes().filter(category=>category.name===row.category);return found.length===1 && found[0].categoryId===id;}");
  replaceSection('  function sceneOptions(checked){','  function registerContexts(data){',String.raw`  function sceneOptions(checked){
    const available=scenes().filter(category=>category.status==='enabled');
    const exact=available.find(category=>category.categoryId===checked);
    const names=exact?[]:available.filter(category=>category.name===checked);
    const selected=exact || (names.length===1?names[0]:null);
    return available.map(category=>'<label class="biz-radio"><input type="radio" name="sceneType" data-category-id="'+
      esc(category.categoryId)+'" value="'+esc(category.categoryId)+'"'+(selected?.categoryId===category.categoryId?' checked':'')+
      ' onchange="window.Pages[\'sys-scene\'].onSceneTypeChange()"><span>'+esc(category.name)+'</span></label>').join('')||
      '<span class="field-hint">当前业务分类目录没有可选分类。</span>';
  }
  function currentBusinessCategory(categoryId){
    const live=parent.DModuleHost.currentCatalog();
    if (!live.ok) throw Error(live.message || '当前业务分类暂不可用。');
    const found=live.rows.find(row=>row.id===categoryId && row.enabled!==false);
    if (!found) throw Error('所选业务分类已停用或移除，请重新选择。');
    return found;
  }
`);
  replace('window.DUnifiedAI={scenes,sceneOptions,filterOptions,matches,refresh,registerContexts,',
    'window.DUnifiedAI={scenes,sceneOptions,filterOptions,matches,refresh,registerContexts,currentBusinessCategory,');
  replace("          if(row.integrationTenantId!==context?.scope.id)throw Error('场景归属租户已变化，请重新打开。');",
    String.raw`          if(row.integrationTenantId!==context?.scope.id)throw Error('场景归属租户已变化，请重新打开。');
          if(window.DUnifiedAI.currentBusinessCategory(row.unifiedCategoryId).label!==row.category){
            throw Error('所选业务分类名称已更新，请重新打开场景后选择。');
          }`);
  replace("    var sceneTypeEl = document.querySelector('#bizAddSceneDrawer input[name=\"sceneType\"]:checked');",
    "    var sceneTypeEl = document.querySelector('#bizAddSceneDrawer input[name=\"sceneType\"]:checked:not(:disabled)');\n"+
    "    var sceneCategory = sceneTypeEl && DUnifiedAI.scenes().find(item=>item.categoryId===sceneTypeEl.dataset.categoryId && item.status==='enabled');");
  replace(String.raw`      category: sceneTypeEl ? sceneTypeEl.value : (SceneRows.find(s=>s.id===currentEditingId)?.category||''),
      ...((sceneTypeEl?.dataset.categoryId||SceneRows.find(s=>s.id===currentEditingId)?.unifiedCategoryId)?{unifiedCategoryId:sceneTypeEl?.dataset.categoryId||SceneRows.find(s=>s.id===currentEditingId)?.unifiedCategoryId}:{}),`,
    String.raw`      category: sceneCategory?.name || '',
      unifiedCategoryId: sceneCategory?.categoryId || '',`);
  replace(String.raw`    if (!data.category) return '请选择场景类型';
    var sourceIssue=dValidateSceneDataImportSource(data);if(sourceIssue)return sourceIssue;var importFieldIssue=dValidateSceneImportFields(data);if(importFieldIssue)return importFieldIssue;`,
    String.raw`    if (!data.unifiedCategoryId) return '请选择业务分类';
    try {
      if (DUnifiedAI.currentBusinessCategory(data.unifiedCategoryId).label!==data.category) {
        return '所选业务分类名称已更新，请重新打开场景后选择。';
      }
    } catch (error) { return error.message || '当前业务分类暂不可用。'; }
    var importFieldIssue=dValidateSceneImportFields(data);if(importFieldIssue)return importFieldIssue;`);

  replaceSection('              /* 冰兰专属：数据导入方式（手动导入/接口传入） */',
    '              /* 冰兰专属：呼叫通道 / 线路 */','');
  replaceSection('              /* 默认数据导入方式（手动导入/自动传入） */','              /* ===== 一知科技面板 ===== */','');
  replace(String.raw`    /* 冰兰专属行 vs 默认行 */
    var importRowBinglan = document.getElementById('importTypeRowBinglan');
    var importRowDefault = document.getElementById('importTypeRowDefault');`,'');
  for (const line of [
    "      if (importRowBinglan) importRowBinglan.classList.remove('hidden');",
    "      if (importRowDefault) importRowDefault.classList.add('hidden');",
    "      if (importRowBinglan) importRowBinglan.classList.add('hidden');",
    "      if (importRowDefault) importRowDefault.classList.remove('hidden');"
  ]) replace(line+'\n','');
  replace(String.raw`    var importName=row.platform==='冰兰'?'binglanImportType':'importType',importRadio=document.querySelector('input[name="'+importName+'"]:checked');
    row.importType=importRadio?importRadio.value:'';`,'');
  replace(String.raw`    var importName=data.platform==='冰兰'?'binglanImportType':'importType';document.querySelectorAll('input[name="'+importName+'"]').forEach(function(input){input.checked=input.value===data.importType;});`,'');
  replace(String.raw`      var importEl = document.querySelector('input[name="binglanImportType"]:checked');
      if (!importEl) return '请选择数据导入方式';`,'');
  replace('onPlatformChange();dStartSceneDataImportSource();dLoadSceneImportFields();','onPlatformChange();dLoadSceneImportFields();');
  replace('dRestoreCommonSceneForm(data);dStartSceneDataImportSource(data);dLoadSceneImportFields(data);',
    'dRestoreCommonSceneForm(data);dLoadSceneImportFields(data);');
  replace('integrationSceneGuard:dSceneGuard,changeDataImportSource:dChangeSceneDataImportSource,',
    'integrationSceneGuard:dSceneGuard,');

  replaceSection('  // Source mode is independent of supplier parameter drafts; never migrate on read.',
    '  function renderInputFieldRows()',String.raw`  // Existing source evidence follows the same provider task, and remains read-only.
  function sameSceneExecution(previous,row){
    if (!previous || previous.platform!==row.platform) return false;
    if (row.platform==='厚朴') return previous.taskId===row.taskId && previous.houpuAccountId===row.houpuAccountId;
    return previous.sceneId===row.sceneId && previous.localAccountSelection===row.localAccountSelection;
  }
  function dApplySceneConfiguration(row,changed){
    if (!sameSceneExecution(row,changed)) {
      delete row.importType;
      delete row.dataImportSource;
    }
    Object.assign(row,changed);
  }
  function dSceneDataImportLabel(row){
    if (!Object.hasOwn(row,'importType') && !Object.hasOwn(row,'dataImportSource')) return '随任务来源';
    return (window.DAISceneImportSource || parent.DAISceneImportSource)?.label(row) || '待核';
  }

`);
  replace('    dCollectSceneImportFields(row);dCollectSceneDataImportSource(row);','    dCollectSceneImportFields(row);');
  replace('      if (row) Object.assign(row, data);','      if (row) dApplySceneConfiguration(row,data);');
  replace('Object.assign(row,data);}\n    else{id=next.reduce','dApplySceneConfiguration(row,data);}\n    else{id=next.reduce');

  ai.html = html;
})();
