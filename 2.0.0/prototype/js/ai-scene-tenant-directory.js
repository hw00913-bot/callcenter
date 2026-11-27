/* The original AI scene editor reads and validates tenants against the shared directory. */
(() => {
  'use strict';

  const ai = window.DNativeModules?.ai;
  if (!ai) return;

  let html = ai.html;
  const replace = (oldText,newText)=>{
    const start = html.indexOf(oldText);
    if (start<0 || html.indexOf(oldText,start+oldText.length)>=0) {
      throw Error('无法定位 AI 场景租户配置入口。');
    }
    html = html.slice(0,start)+newText+html.slice(start+oldText.length);
  };

  replace("var MockTenantOptions = ['东风日产-燃油车', '东风日产-点检', '重庆东风南方渝兴', '重庆东风南方渝发', '超级管理组'];\n",'');

  replace(String.raw`  function tenantCheckboxesHtml(selected) {
    return (window.MockTenantOptions || []).map(function (t) {
      var checked = selected && selected.indexOf(t) >= 0 ? ' checked' : '';
      return '<label class="biz-checkbox"><input type="checkbox" value="' + t + '"' + checked + '><span>' + t + '</span></label>';
    }).join('');
  }`,String.raw`  function sceneTenantContext() {
    var current=parent.DSession.context(), owner=DNativeContext.context;
    return current && current.account.id===owner.account.id && current.scope.id===owner.scope.id ? current : null;
  }

  function sceneTenantLabels(row) {
    var context=sceneTenantContext();
    var directory=parent.DTenantDirectory;
    if(!context||!directory) return '租户待核';
    var labels=directory.referenceIds(row,context).map(id=>directory.label(id,context)).filter(Boolean);
    return labels.length ? labels.join('、') : '租户待核';
  }

  function resolveSceneTenantSelection(ids) {
    var context=sceneTenantContext(),directory=parent.DTenantDirectory;
    if(!ids.length)return {ok:false,rows:[],message:'请选择可用租户'};
    return context && directory ? directory.resolve(ids,'scene',context) :
      {ok:false,rows:[],message:'租户目录暂不可用，请重新进入当前场景'};
  }

  function tenantCheckboxesHtml(selected) {
    var context=sceneTenantContext();
    var rows=context && parent.DTenantDirectory ? parent.DTenantDirectory.choices('scene',context) : [];
    if(!rows.length)return '<span class="field-hint">当前账号没有可用于该场景的租户。</span>';
    var brands=new Map();
    rows.forEach(function(row){
      if(!brands.has(row.brandId)) brands.set(row.brandId,{label:row.brandName||'待关联品牌',tenants:[]});
      brands.get(row.brandId).tenants.push(row);
    });
    return Array.from(brands.values()).map(function(brand){
      return '<fieldset class="biz-available-tenant-brand"><legend>'+escapeHtmlText(brand.label)+'</legend>'+
        brand.tenants.map(function(tenant){
          var checked=tenant.selectable && selected.includes(tenant.id) ? ' checked' : '';
          var disabled=tenant.selectable ? '' : ' disabled';
          var reason=tenant.selectable || !tenant.reason ? '' : '（'+escapeHtmlText(tenant.reason)+'）';
          return '<label class="biz-checkbox"><input type="checkbox" value="'+escapeHtmlText(tenant.id)+'"'+checked+disabled+
            '><span>'+escapeHtmlText(tenant.name)+reason+'</span></label>';
        }).join('')+'</fieldset>';
    }).join('');
  }`);

  replace(String.raw`    if (!row) return;
    if (isRunningScene(row)) {`,String.raw`    if (!row) return;
    var context=sceneTenantContext();
    if(!context||!parent.DTenantDirectory.canManageScene(row,context)){
      showToast('当前账号无权维护此场景的全部适用租户。','warning');
      return false;
    }
    if (isRunningScene(row)) {`);
  replace(String.raw`    SceneRows = SceneRows.filter(function (item) { return item.id !== sceneId; });
    closeDeleteConfirm();`,String.raw`    var row=SceneRows.find(item=>item.id===sceneId),context=sceneTenantContext();
    if(!row||!context||!parent.DTenantDirectory.canManageScene(row,context)){
      showToast('当前账号无权维护此场景的全部适用租户。','warning');
      return false;
    }
    SceneRows = SceneRows.filter(function (item) { return item.id !== sceneId; });
    closeDeleteConfirm();`);
  replace("        '<td>' + row.tenant + '</td>' +",
    "        '<td>' + escapeHtmlText(sceneTenantLabels(row)) + '</td>' +");
  replace("    var tenants = data.tenants || [];",
    "    var tenants = Array.isArray(data.tenantIds) ? data.tenantIds : [];");
  replace("    var data = Object.assign({}, row, { tenants: Array.isArray(row.tenants)?row.tenants.slice():(row.tenant?row.tenant.split('、'):[]) });",
    "    var context=sceneTenantContext();\n    if(!context||!parent.DTenantDirectory.canManageScene(row,context)){showToast('当前账号无权维护此场景的全部适用租户。','warning');return false;}\n    var data=Object.assign({},row,{tenantIds:parent.DTenantDirectory.referenceIds(row,context)});");
  replace(`    row.importType=importRadio?importRadio.value:'';row.tenants=getCheckedValues('#tenantCheckboxGroup input[type="checkbox"]:checked');`,
    "    row.importType=importRadio?importRadio.value:'';");
  replace("      tenant: tenants.join('、'),",
    "      tenantIds: tenants,\n      tenant: (resolveSceneTenantSelection(tenants).rows || []).map(tenant=>tenant.name).join('、'),");
  replace(`    if (!getCheckedValues('#tenantCheckboxGroup input[type="checkbox"]:checked').length) return '请选择可用租户';`,
    "    var available=resolveSceneTenantSelection(data.tenantIds);if(!available.ok)return available.message || '请选择当前可用租户';");

  // Run live authorization again for the exact staged candidate, including quota retries.
  replace("      const data=snapshot();if(parent.DSession.can('F20'))",
    String.raw`      if(sceneStage){
        const context=parent.DSession.context(), directory=parent.DTenantDirectory;
        const existingRows=new Map((committed?.sceneRows||[]).map(row=>[String(row.id),row]));
        const candidates=new Map(sceneStage.map(row=>[String(row.id),row]));
        for(const [id,previous] of existingRows){
          if(JSON.stringify(previous)!==JSON.stringify(candidates.get(id)) && !directory?.canManageScene(previous,context)){
            throw Error('当前账号无权维护此场景的全部适用租户。');
          }
        }
        const legacyTenantFields=['tenant','tenants','tenantId','integrationTenantId','ownerTenantId','sourceTenantId','brandId'];
        for(const row of sceneStage){
          const previous=existingRows.get(String(row.id));
          if(previous&&JSON.stringify(previous)===JSON.stringify(row))continue;
          // A pre-directory row can still be re-saved by legacy migration tooling.
          // A new row or one already linked by ID must pass the live directory check.
          if(previous&&!Object.hasOwn(row,'tenantIds')&&!Object.hasOwn(previous,'tenantIds')&&
              legacyTenantFields.every(key=>JSON.stringify(row[key])===JSON.stringify(previous[key])))continue;
          const result=Array.isArray(row.tenantIds)&&directory?.resolve(row.tenantIds,'scene',context);
          if(!result?.ok)throw Error(result?.message||'可用租户已变化，请核对后重新保存。');
          if(row.integrationTenantId!==context?.scope.id)throw Error('场景归属租户已变化，请重新打开。');
        }
      }
      const data=snapshot();if(parent.DSession.can('F20'))`);

  replace("    if(!dScenePrepareOpen())return false;\n    modalTitle = modalTitle || '新建业务场景';",
    "    if(!sceneTenantContext()||!parent.DSession.allowed('PAGE-2110')||!parent.DSession.canWrite('PAGE-2110'))return false;\n    if(!dScenePrepareOpen())return false;\n    modalTitle = modalTitle || '新建业务场景';");
  replace(
    `            '<span class="scene-page-subtitle">按任务查看客户名单、执行状态与呼叫结果。</span>' +`,
    String.raw`            '<span class="scene-page-subtitle">按任务查看客户名单、执行状态与呼叫结果。</span>' +
            (parent.DSession.allowed('PAGE-2110')&&parent.DSession.canWrite('PAGE-2110') ?
              '<button type="button" class="btn btn-primary" data-ai-new-task-config onclick="window.Pages[\'scene-list\'].integrationOpenNewScene()">新建业务场景</button>' : '') +`);
  replace("  Pages['scene-list'].integrationResetFilters=function(){",String.raw`  Pages['scene-list'].integrationOpenNewScene=function(){
    if(!contextValid()||activeRoute!=='scene-list'||parent.DApp.currentPage()!=='PAGE-2103'||
        !parent.DSession.allowed('PAGE-2103')||!parent.DSession.allowed('PAGE-2110')||!parent.DSession.canWrite('PAGE-2110'))return false;
    return parent.DApp.openPage('PAGE-2110',{nativeOptions:{openAiSceneCreate:true}});
  };
  Pages['scene-list'].integrationResetFilters=function(){`);
  replace("'integrationResetFilters','closeImportModal','closeIntentConfig'",
    "'integrationResetFilters','integrationOpenNewScene','closeImportModal','closeIntentConfig'");
  replace(
    "return original(route,options);}).catch(e=>{if(id!==request||before!==stamp())return;error=e.message;document.getElementById('page-content').textContent=error;});return true;",
    "const shown=original(route,options);if(shown&&route==='sys-scene'&&options.openAiSceneCreate&&parent.DApp.currentPage()==='PAGE-2110'&&document.getElementById('bizSceneTableBody'))Pages['sys-scene'].showAddModal();return shown;}).catch(e=>{if(id!==request||before!==stamp())return;error=e.message;document.getElementById('page-content').textContent=error;});return true;");
  html=html.replace('</head>',String.raw`<style>
    #tenantCheckboxGroup { display:grid; gap:8px; }
    #tenantCheckboxGroup .biz-available-tenant-brand { border:1px solid #e3e8ef; border-radius:6px;
      margin:0; min-width:0; padding:8px 10px; display:flex; gap:8px 14px; flex-wrap:wrap; }
    #tenantCheckboxGroup .biz-available-tenant-brand legend { padding:0 3px; font-size:12px; color:#52657c; }
    #tenantCheckboxGroup input:disabled + span { color:#8a95a5; }
  </style></head>`);

  ai.html = html;

  const cloud=window.DNativeModules.cloud;
  if(!cloud) return;
  html=cloud.html;
  // Catalog-only schema reads need the current tenant even when native Cloud has a super-admin session.
  replace('  DAdapter.readCatalog=function(options={}){readOnly=true;',String.raw`  DAdapter.readSceneImportContext=function(categoryId){
    const context=c(),owner=DNativeContext.context;
    if(context?.scope.kind!=='tenant'||!context.scope.tenant||context.account.id!==owner.account.id||
        context.scope.id!==owner.scope.id||parent.DApp.currentPage()!=='PAGE-2110'||!parent.DSession.allowed('PAGE-2110')){
      return {status:'failed',message:'当前没有本租户 AI 场景配置读取权限。'};
    }
    const previous=readOnly;
    readOnly=true;
    try { return BusinessFlowStore.importContext(categoryId,{handlingMode:'DIRECT',directMethod:'AI',catalogOnly:true}); }
    finally { readOnly=previous; }
  };
  DAdapter.readCatalog=function(options={}){readOnly=true;`);
  cloud.html = html;
})();
