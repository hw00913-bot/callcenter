/* Display native AI tasks only when they have verified ownership in the shared directory. */
(() => {
  'use strict';

  const native = window.DNativeModules?.ai;
  if (!native) return;
  let html = native.html;

  function replace(source, replacement) {
    const start = html.indexOf(source);
    if (start<0 || html.indexOf(source,start+source.length)>=0) throw Error('无法定位 AI 任务租户目录入口。');
    html = html.slice(0,start)+replacement+html.slice(start+source.length);
  }

  // The original fixtures lack tenant IDs. Never attribute them to whoever opens the page.
  replace("    // Original no-tenant task fixtures are instantiated separately in this scope.\n    (window.MockSceneList||[]).forEach(row=>{row.integrationTenantId=s.id;});",'');
  replace('  const live=create(()=>({context:root.parent?.DSession?.context?.(),owner:root.DNativeContext?.context,nativeRows:root.MockSceneList,scenes:',
    String.raw`  function committedTaskScenes() {
    const key=root.DAIConfigStore?.key;
    if(!key)throw Error('当前租户 AI 场景目录尚未就绪。');
    const raw=root.localStorage.getItem(key);
    if(raw===null)return root.Pages?.['sys-scene']?.integrationState?.()||root.MockSceneRows;
    try {
      const saved=JSON.parse(raw);
      if(saved?.schema!==1||!Number.isSafeInteger(saved.revision)||saved.revision<1||!Array.isArray(saved.data?.sceneRows))throw Error();
      return saved.data.sceneRows;
    }catch(_){throw Error('已保存的 AI 场景目录无法核对。');}
  }
  function taskRowsInScope() {
    const current=root.parent?.DSession?.context?.(), owner=root.DNativeContext?.context;
    const tenant=current?.scope?.tenant, directory=root.parent?.DTenantDirectory;
    if(!tenant || !owner || !directory || current.account.id!==owner.account.id ||
       current.scope.id!==owner.scope.id || !root.parent.DSession.allowed('PAGE-2103',current) ||
       !directory.label(current.scope.id,current)){
      throw Error('当前账号没有本租户 AI 任务的读取权限，请重新核对使用范围。');
    }
    const source=root.MockSceneList;
    if(!Array.isArray(source))return source;
    const relations=root.parent.DSeed?.aiSceneRelations || [];
    const rows=[];
    for(const row of source){
      if(!row || row.brandId && row.brandId!==tenant.brandId)continue;
      const ownerIds=[row.integrationTenantId,row.ownerTenantId,row.tenantId].filter(value=>value!==undefined && value!==null && value!=='');
      const explicit=new Set(ownerIds);
      if(explicit.size>1)continue;
      const remoteId=identity(row.professionalTaskId || row.task_id || row.taskId || row.uuid || row.taskUuid || row.taskCode);
      const matched=new Set(remoteId && row.platform ? relations.filter(ref=>
        ref.professionalTaskId===remoteId && ref.platform===row.platform).map(ref=>ref.tenantId) : []);
      if(matched.size>1)continue;
      const [declared]=explicit, [proven]=matched;
      if(declared && proven && declared!==proven)continue;
      const tenantId=declared || proven;
      if(tenantId!==current.scope.id)continue;
      if(row.integrationTenantId!==tenantId)row.integrationTenantId=tenantId;
      rows.push(row);
    }
    return rows;
  }
  const live=create(()=>({context:root.parent?.DSession?.context?.(),owner:root.DNativeContext?.context,nativeRows:taskRowsInScope(),scenes:`);

  replace('        const own=scene.integrationTenantId===scope.id||scene.tenantId===scope.id||Array.isArray(scene.tenantIds)&&scene.tenantIds.includes(scope.id);',
    '        const own=Array.isArray(scene.tenantIds) ? scene.tenantIds.includes(scope.id) : scene.integrationTenantId===scope.id||scene.tenantId===scope.id;');

  // These rows expose only the saved linkage. Provider data and list operations
  // continue to require a native task with verified ownership and state.
  replace('      return {rows,issues:[...new Set(issues)],tenantId:scope.id,brandId:tenant.brandId};',
    String.raw`      const associations=input.associations||[], linked=new Map();
      const remoteKey=(platform,id)=>JSON.stringify([platform,id]);
      const nativeProviderRefs=new Set(rows.flatMap(row=>[
        row.task_id,row.taskId,row.professionalTaskId,row.uuid,row.taskUuid,row.taskCode,row.sceneId
      ].filter(value=>identity(value)).map(value=>remoteKey(row.platform,String(value)))));
      for(const row of associations){
        if(!row?._sceneAssociationOnly||row.integrationTenantId!==scope.id||row.brandId!==tenant.brandId||
          !text(row.taskId)||!text(row.platform))continue;
        const key=remoteKey(row.platform,row.taskId);
        if(nativeProviderRefs.has(key))continue;
        const matches=linked.get(key)||[];
        matches.push(row);linked.set(key,matches);
      }
      for(const matches of linked.values()){
        if(matches.length!==1){issues.push('同一平台标识存在多个业务场景关联，请先核对。');continue;}
        const [row]=matches;
        if(nativeIds.has(row.id)){issues.push('业务场景关联的本地标识重复，请先核对。');continue;}
        rows.push(row);nativeIds.add(row.id);
      }
      return {rows,issues:[...new Set(issues)],tenantId:scope.id,brandId:tenant.brandId};`);
  replace('nativeRows:taskRowsInScope(),scenes:',
    'nativeRows:taskRowsInScope(),associations:root.parent?.DModuleHost?.readAISceneAssociations(root.DNativeContext?.context),scenes:');
  replace("scenes:root.Pages?.['sys-scene']?.integrationState?.()||root.MockSceneRows,remoteTasks:",
    'scenes:committedTaskScenes(),remoteTasks:');

  replace('  function getTaskStatusInfo(item) {',String.raw`  function getTaskStatusInfo(item) {
    if(item?._sceneAssociationOnly)return {code:null,info:{label:'本地已关联',dot:'#8a95a5',color:'#52657c'}};`);
  replace("return item._linkedProfessionalTask?(Number.isSafeInteger(item[key])&&item[key]>=0?item[key]:'待核'):(item[key]||0);",
    "return item._sceneAssociationOnly||item._linkedProfessionalTask?(Number.isSafeInteger(item[key])&&item[key]>=0?item[key]:'待核'):(item[key]||0);");
  replace('  function dProfessionalTaskArgument(id){return escapeHtml(JSON.stringify(id));}',
    String.raw`  function dProfessionalTaskArgument(id){return escapeHtml(JSON.stringify(id));}
  function dProfessionalTaskTenant(item){
    const current=parent.DSession.context(), owner=window.DNativeContext?.context;
    if(!current || !owner || current.account.id!==owner.account.id || current.scope.id!==owner.scope.id ||
       item.integrationTenantId!==current.scope.id || !parent.DSession.allowed('PAGE-2103',current))return '租户待核';
    return parent.DTenantDirectory?.label(item.integrationTenantId,current) || '租户待核';
  }`);

  replace(
    `        '<div class="card-tag" style="background:' + tag.bg + ';color:' + tag.color + ';border:1px solid ' + tag.border + '">' + item.source + '</div>' +`,
    `        '<div class="ai-task-tenant"><span>归属租户</span> ' + escapeHtml(dProfessionalTaskTenant(item)) + '</div>' +\n`+
    `        '<div class="card-tag" style="background:' + tag.bg + ';color:' + tag.color + ';border:1px solid ' + tag.border + '">' + escapeHtml(item.source) + '</div>' +`);
  replace(
    String.raw`          '<span class="card-action-more" onclick="window.Pages[\'scene-list\'].toggleMoreMenu(event,' + dProfessionalTaskArgument(item.id) + ')">⋮</span>' +`,
    String.raw`          (item._sceneAssociationOnly?'':'<span class="card-action-more" onclick="window.Pages[\'scene-list\'].toggleMoreMenu(event,' + dProfessionalTaskArgument(item.id) + ')">⋮</span>') +`);
  replace('  function toggleMoreMenu(e, id) {',String.raw`  function toggleMoreMenu(e, id) {
    if(window.DAITaskDirectory?.find(id)?._sceneAssociationOnly)return;`);
  replace('  function onMenuAction(action, id) {',String.raw`  function onMenuAction(action, id) {
    if(window.DAITaskDirectory?.find(id)?._sceneAssociationOnly)return;`);
  replace('  var currentDetailItem = null;',
    '  var currentDetailItem = null;\n  var currentSceneAssociation = null;');
  replace('  function renderDataOverview() {',String.raw`  function associationOverviewBlock(title,color,rows) {
    return '<section class="overview-block"><div class="overview-block-header"><div class="overview-block-title '+color+'">'+
      title+'</div></div><div class="overview-block-body">'+rows.map(labels=>
        '<div class="overview-grid cols-'+labels.length+'">'+labels.map(label=>
          '<div class="overview-card"><div class="overview-card-title">'+escapeHtml(label)+'</div>'+
          '<div class="overview-card-value" aria-label="待核">—</div></div>'
        ).join('')+'</div>'
      ).join('')+'</div></section>';
  }

  function renderAssociationOverview() {
    return '<div class="overview-section ai-association-overview"><p class="ai-association-note" role="status">'+
      '平台任务状态待核，暂无可确认的外呼统计。</p>'+
      associationOverviewBlock('外呼数据','blue',[['导入客户数','外呼客户数','去重过滤客户数','接听客户数','平均通话时长']])+
      associationOverviewBlock('意向分类','orange',[
        ['高意向客户占比','潜在客户占比','高意向及潜在客户占比'],
        ['高意向客户数','潜在客户数','高意向及潜在客户数']
      ])+
      '<section class="overview-block"><div class="overview-block-header"><div class="overview-block-title blue">意向洞察</div></div>'+
      '<div class="overview-block-body"><p class="ai-association-empty">暂无意向洞察数据。</p></div></section></div>';
  }

  function renderDataOverview() {
    if(currentSceneAssociation)return renderAssociationOverview();`);
  replace('  function renderSubContent(tabName) {',String.raw`  function renderAssociationRoster(tabName) {
    const columns=(SubTabConfig[tabName]||SubTabConfig['已分配']).cols.filter(label=>label!=='操作');
    return '<div class="ai-association-roster"><p class="ai-association-note" role="status">尚未取得平台呼叫名单。</p>'+
      '<div class="scene-detail-table-wrap"><table class="scene-detail-table" aria-label="'+escapeHtml(tabName)+'">'+
      '<thead><tr>'+columns.map(label=>'<th scope="col">'+escapeHtml(label)+'</th>').join('')+'</tr></thead>'+
      '<tbody><tr><td colspan="'+columns.length+'"><p class="ai-association-empty">暂无可展示的'+escapeHtml(tabName)+'记录。</p></td></tr></tbody>'+
      '</table></div></div>';
  }

  function renderSubContent(tabName) {
    if(currentSceneAssociation)return renderAssociationRoster(tabName);`);
  replace('  function renderTaskDetail() {',String.raw`  function renderAssociationTaskDetail(item) {
    const rows=[
      ['场景名称',item.name],['归属租户',dProfessionalTaskTenant(item)],['所属平台',item.platform],
      ['平台场景或任务 ID',item.taskId],['平台状态','待核']
    ];
    return '<div class="task-detail-section ai-association-task-detail">'+rows.map(([label,value])=>
      '<div class="task-detail-row"><div class="task-detail-label">'+escapeHtml(label)+'</div>'+
      '<div class="task-detail-value">'+escapeHtml(value)+'</div></div>'
    ).join('')+'<p class="ai-association-note">已保存场景关联，暂无可确认的平台任务详情。</p></div>';
  }

  function renderTaskDetail() {
    if(currentSceneAssociation)return renderAssociationTaskDetail(currentSceneAssociation);`);
  replace('  function showIntentConfig() {',String.raw`  function showIntentConfig() {
    if(currentSceneAssociation)return false;`);
  replace('    if (!item) return;\n    currentDetailItem = item;',
    '    if (!item) return;\n    currentSceneAssociation = item._sceneAssociationOnly ? item : null;\n    currentDetailItem = currentSceneAssociation ? null : item;');
  replace('    if (noTogglePlatforms.indexOf(platformName) === -1) {',
    '    if (!currentSceneAssociation && noTogglePlatforms.indexOf(platformName) === -1) {');
  replace("    if (!backdrop || !drawer) return;\n    backdrop.classList.remove('open');",
    "    if (!backdrop || !drawer) return;\n    currentSceneAssociation = null;\n    backdrop.classList.remove('open');");
  replace("    var cards = DListOrder.rows(dProfessionalTaskRows(),{fallbackKeys:['createdAt','createTime','time']}).map(renderCard).join('');",
    "    var cards = DListOrder.rows(dProfessionalTaskRows(),{fallbackKeys:['createdAt','createTime','time']}).map(renderCard).join('') || '<div class=\"report-empty\">暂无本租户的 AI 外呼任务。</div>';");
  replace(
    `              '<div class="scene-detail-tags">' +`,
    `              '<div class="ai-task-tenant"><span>归属租户</span> ' + escapeHtml(dProfessionalTaskTenant(item)) + '</div>' +\n`+
    `              '<div class="scene-detail-tags">' +`);
  html=html.replace('</head>',String.raw`<style>
    .ai-task-tenant { margin:4px 0 8px; color:#40536b; font-size:13px; overflow-wrap:anywhere; }
    .ai-task-tenant span { color:#697b91; margin-right:4px; }
    .ai-association-note { margin:0 0 16px; color:#52657c; line-height:1.6; }
    .ai-association-empty { margin:0; padding:24px 12px; color:#697b91; text-align:center; }
    .ai-association-overview .overview-grid + .overview-grid { margin-top:14px; }
    .ai-association-roster .scene-detail-table-wrap { overflow-x:auto; }
    .ai-association-task-detail .ai-association-note { margin-top:14px; }
    @media(max-width:1150px) {
      .ai-association-overview .overview-grid { flex-wrap:wrap; }
      .ai-association-overview .overview-card { min-width:140px; }
    }
  </style></head>`);

  native.html = html;
})();
