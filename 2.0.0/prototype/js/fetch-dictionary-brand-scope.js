/* PAGE-21016 only. Retain native IDs, storage schema, query adapters and usage
 * guards; replace this dictionary's retired tenant grants with brand ownership. */
(() => {
  'use strict';
  const cloud=window.DNativeModules?.cloud;
  if(!cloud)return;
  let html=cloud.html;
  function once(source,before,after) {
    const at=source.indexOf(before);
    if(at<0 || source.indexOf(before,at+before.length)>=0)throw Error('无法定位取数接口品牌归属配置：'+before.slice(0,70));
    return source.slice(0,at)+after+source.slice(at+before.length);
  }
  function between(source,start,end,after) {
    const from=source.indexOf(start),to=source.indexOf(end,from+start.length);
    if(from<0 || to<0)throw Error('取数接口字典片段不完整。');
    return once(source,source.slice(from,to),after);
  }
  const modelHeader='/** v1.1.1 本地模拟业务数据。无真实网络、凭据或生产接口契约。 */';
  const modelStart=html.indexOf(modelHeader),modelEnd=html.indexOf('</script>',modelStart);
  if(modelStart<0 || modelEnd<0)throw Error('取数接口字典模型未就绪。');
  const originalModel=html.slice(modelStart,modelEnd);let model=originalModel;
  model=between(model,'  function canManage(scope) {','  function mappingEntry() {',String.raw`  function brandIdForTenant(id) {
    const current=root.parent?.DSession?.context?.();
    if(current?.scope.kind==='tenant'&&current.scope.id===id)return current.scope.tenant?.brandId||'';
    try {return root.parent?.DOrganization?.tenants?.().find(row=>row.id===id)?.brandId||
      root.CloudCallData?.tenants?.find(row=>row.tenantId===id)?.brandId||'';} catch(_){return '';}
  }
  function brandContext(scope) {
    const session=root.parent?.DSession,current=session?.context?.(),owner=root.DNativeContext?.context;
    if(!current||current.scope.kind!=='tenant'||current.scope.tenant?.enabled!==true||!current.scope.tenant.brandId||
        current.account.id!==owner?.account?.id||current.scope.id!==owner?.scope?.id||
        current.scope.tenant.brandId!==owner.scope.tenant?.brandId||root.AppState?.isReady?.()!==true)return null;
    const brandId=current.scope.tenant.brandId;
    if(scope?.brandId&&scope.brandId!==brandId)return null;
    if(scope?.tenantId&&brandIdForTenant(scope.tenantId)!==brandId)return null;
    if(scope?.tenantId&&scope?.enterpriseId){
      const native=root.CloudCallData?.tenants?.find(row=>row.tenantId===scope.tenantId);
      if(native?.enterpriseId&&String(native.enterpriseId)!==String(scope.enterpriseId))return null;
    }
    return {current,brandId};
  }
  function brandInfo() {
    const active=brandContext();if(!active)return {brandId:'',name:'请选择有权业务租户'};
    let row;try{row=root.parent?.DOrganization?.brands?.().find(row=>row.id===active.brandId);}catch(_){}
    return {brandId:active.brandId,name:row?.name||(active.brandId==='BRAND-NISSAN'?'东风日产':active.brandId)};
  }
  function canRead(scope) {
    const active=brandContext(scope);
    return !!active&&root.parent.DSession.allowed('PAGE-2223',active.current)===true;
  }
  function canManage(scope) {
    const active=brandContext(scope),session=root.parent?.DSession;
    if(!active||root.HistorySnapshot?.read_only===true||!canRead(scope)||session.canWrite('PAGE-2223',active.current)!==true)return false;
    const role=session.roleKey?.(active.current),grant=active.current.scope.grant?.role;
    return ['hq_admin','store_admin','super'].includes(role)||['admin','super'].includes(grant);
  }
  const canGrant=()=>false;
  function canInspect(id,scope) {return canRead(scope)&&!!entry(id);}
  function editableRow(row,scope) {return !!row&&canManage(scope)&&row.brandId===brandContext(scope)?.brandId;}
  const canEdit=(id,scope)=>editableRow(entry(id),scope);
  function managementEntries(scope) {return canRead(scope)?entries():[];}
`);
  model=once(model,'.map(row => ({tenantId:row.tenantId,enterpriseId:row.enterpriseId,name:row.name}));',
    '.map(row => ({tenantId:row.tenantId,enterpriseId:row.enterpriseId,name:row.name,brandId:brandIdForTenant(row.tenantId)}))\n'+
    '      .filter(row=>row.brandId===brandContext()?.brandId);');
  model=once(model,"function mappingEntry() {return {id:'d-mapping-series',", "function mappingEntry() {return {brandId:'BRAND-NISSAN',id:'d-mapping-series',");
  model=once(model,"capabilityId:'mapping-series',tenantIds:tenants().map(row=>row.tenantId),enabled:true,",
    "capabilityId:'mapping-series',tenantIds:[],enabled:true,");
  model=once(model,'function defaults() { return {version:storageVersion,revision:0,entries:[mappingEntry()]}; }',
    'function defaults() { return {version:storageVersion,revision:0,brandScopeMigrationVersion:2,entries:[mappingEntry()]}; }');
  model=once(model,'      const raw = root.localStorage.getItem(storageKey);','      let raw = root.localStorage.getItem(storageKey);');
  model=once(model,"      lastError = '';\n      return {ok:true,data,raw};",String.raw`      if(data.entries.some(row=>row.brandId!==undefined&&typeof row.brandId!=='string'))throw Error('invalid brand ownership');
      if(data.brandScopeMigrationVersion!==undefined&&![1,2].includes(data.brandScopeMigrationVersion))throw Error('unsupported brand migration');
      if(data.brandScopeMigrationVersion!==2) {
        const before=raw,next=clone(data),migrated=[],retiredGrantCounts={};
        for(const row of next.entries) {
          // Existing tenant grants described consumers, never brand ownership.
          // Explicit brand ownership, including another brand, is left intact.
          if(!text(row.brandId).trim()){
            if(['ownerBrandId','sourceBrandId'].some(key=>row[key]!==undefined&&typeof row[key]!=='string'))throw Error('invalid declared brand');
            row.brandId=(row.ownerBrandId||row.sourceBrandId||'').trim()||'BRAND-NISSAN';migrated.push(row.id);
          }
          if(row.brandId==='BRAND-NISSAN') {
            if(row.sourceRevision>=Number.MAX_SAFE_INTEGER)throw Error('source version overflow');
            retiredGrantCounts[row.id]=row.tenantIds.length;
            row.tenantIds=[];row.tenantRevisions={};row.sourceRevision++;
          }
        }
        if(next.entries.some(row=>typeof row.brandId!=='string'||!row.brandId.trim()))throw Error('invalid migrated brand');
        next.brandScopeMigrationVersion=2;
        next.brandScopeMigration={version:2,legacyBrandId:'BRAND-NISSAN',entryIds:migrated,retiredGrantCounts};
        if(next.revision>=Number.MAX_SAFE_INTEGER)throw Error('dictionary version overflow');
        next.revision++;const bytes=JSON.stringify(next);let written=false;
        try {
          if(root.localStorage.getItem(storageKey)!==before)throw Error('changed before migration');
          written=true;root.localStorage.setItem(storageKey,bytes);
          if(root.localStorage.getItem(storageKey)!==bytes)throw Error('migration write failed');
          Object.assign(data,next);raw=bytes;
        } catch(_) {
          if(written)try{if(root.localStorage.getItem(storageKey)===bytes){if(before===null)root.localStorage.removeItem(storageKey);else root.localStorage.setItem(storageKey,before);}}catch(_){}
          const error=Error('取数接口品牌归属迁移未保存，请刷新后重试；原资料不会被覆盖。');error.brandMigration=true;throw error;
        }
      }
      if(data.entries.some(row=>typeof row.brandId!=='string'||!row.brandId.trim()))throw Error('missing brand ownership');
      lastError = '';
      return {ok:true,data,raw};`);
  model=once(model,"    } catch (_) {\n      lastError = '业务数据接口配置暂时无法读取，请刷新后重试；已保存的资料不会被覆盖。';",
    "    } catch (error) {\n      lastError = error?.brandMigration?error.message:'业务数据接口配置暂时无法读取，请刷新后重试；已保存的资料不会被覆盖。';");
  model=once(model,'function entries() { const saved = load(); return saved.ok ? clone(saved.data.entries) : []; }',
    'function entries() { const active=brandContext(),saved=load();return active&&saved.ok?clone(saved.data.entries.filter(row=>row.brandId===active.brandId)):[]; }');
  model=once(model,'entries:clone(saved.data.entries),context}',
    'entries:clone(saved.data.entries.filter(row=>row.brandId===brandContext()?.brandId)),brandId:brandContext()?.brandId||\'\',context}');
  model=once(model,'a.roleCode,a.valid,root.HistorySnapshot?.read_only===true]);}',
    'a.roleCode,a.valid,brandContext()?.brandId||\'\',canRead(),canManage(),root.HistorySnapshot?.read_only===true]);}');
  model=once(model,'return !!(row?.enabled && tenant && row.tenantIds.includes(tenant.tenantId) &&',
    'return !!(row?.enabled && tenant && row.brandId===brandContext(scope)?.brandId &&');
  model=once(model,"return row && scopeTenant(scope) ? JSON.stringify([row.id,row.sourceRevision,scope.enterpriseId,scope.tenantId,",
    "return row && scopeTenant(scope) && row.brandId===brandContext(scope)?.brandId ? JSON.stringify([row.id,row.brandId,row.sourceRevision,scope.enterpriseId,scope.tenantId,");
  model=once(model,"return scopeTenant(scope) ? JSON.stringify([row.id,row.sourceRevision,scope.enterpriseId,scope.tenantId,",
    "return scopeTenant(scope) && row.brandId===brandContext(scope)?.brandId ? JSON.stringify([row.id,row.brandId,row.sourceRevision,scope.enterpriseId,scope.tenantId,");
  model=once(model,"function usage(id,scope) {return root.BusinessConfigurationUsage?.inspect?.({kind:'interface',id,scope:scope||null})",
    "function usage(id,scope) {const active=brandContext(scope),state=root.AppState?.get?.()||{};const current=active?{enterpriseId:scope?.enterpriseId||active.current.scope.tenant.enterpriseId||state.enterpriseId,tenantId:scope?.tenantId||active.current.scope.id,brandId:active.brandId}:scope;return root.BusinessConfigurationUsage?.inspect?.({kind:'interface',id,scope:current||null})");
  model=between(model,'    const ownTenant=scopeTenant(root.AppState?.get?.());','    const enabled = input.enabled',String.raw`    const active=brandContext(scope);if(!active)return fail('当前品牌或业务租户无法核对');
    if(Object.hasOwn(input,'tenantIds'))return fail('取数接口按所属品牌使用，不再设置租户授权');
    if(input.brandId!==undefined&&input.brandId!==active.brandId)return fail('不能修改取数接口的所属品牌');
    const brandId=current?.brandId||active.brandId;
    if(brandId!==active.brandId)return fail('当前品牌无权维护此取数接口');
    const tenantIds=current?.tenantIds||[];
`);
  model=once(model,'value:{name,capabilityId,tenantIds:unique(tenantIds),enabled}',
    'value:{name,capabilityId,brandId,tenantIds:unique(tenantIds),enabled}');
  model=once(model,"if(!editableRow(row,options.scope))return fail('共享接口由超级管理员维护；租户管理员只能修改本租户专用接口');",
    "if(!editableRow(row,options.scope))return fail('当前账号没有此品牌取数接口的维护权限');");
  model=once(model,"if(!editableRow(row,options.scope))return fail('共享接口由超级管理员维护；租户管理员只能删除本租户专用接口');",
    "if(!editableRow(row,options.scope))return fail('当前账号没有此品牌取数接口的删除权限');");
  model=once(model,"const setTenants = (id,tenantIds) => canGrant()?update(id,{tenantIds}):fail('租户授权由超级管理员统一维护');",
    "const setTenants = () => fail('取数接口按所属品牌使用，不再设置租户授权');");
  model=once(model,'row,sourceChanged ? unique([...row.tenantIds,...changedTenants]) : changedTenants.length ? changedTenants : null,',
    'row,sourceChanged ? tenants().filter(tenant=>tenant.brandId===row.brandId).map(tenant=>tenant.tenantId) : null,');
  model=once(model,"return empty('来源不可用，请联系管理员检查接口状态与租户授权');",
    "return empty('来源不可用，请联系管理员检查接口状态与所属品牌');");
  model=once(model,'queryOptions,querySeries,queryStores,demoProfile,',
    'queryOptions,querySeries,queryStores,canRead,brandInfo,demoProfile,');
  html=once(html,originalModel,model);

  // Keep the existing usage inspector's all-interface scan and freshness tokens.
  // Other-tenant references remain deletion blockers without exposing records.
  html=once(html,'此接口仍有其他业务范围的保留使用，请联系超级管理员核对',
    '此接口仍有其他业务范围的保留使用，不能删除或更换取数能力');
  html=once(html,"if (permission === 'business.dictionary') return isReady() && (isSuper() || effectiveAccess().valid && currentRoleCode() === 'ADMIN' && state.activeDomain === 'CLOUD_CONTACT_CENTER' && canMenu('settings.business'));",
    "if (permission === 'business.dictionary') return window.BusinessData?.canRead?.()===true;");
  for(const [before,after] of [
    ['当前来源不可用，字段引用保留；请租户管理员检查专用接口；共享接口请联系超级管理员处理。','当前来源不可用，字段引用保留；请有权管理员在取数接口字典核对所属品牌及启停状态。'],
    ['只展示当前租户已授权且启用的接口。','只展示当前品牌下已启用的取数接口。'],
    ['当前租户暂无可用接口，请在“取数接口字典”新增或启用本租户专用接口；共享接口请联系超级管理员授权后再返回选择。','当前品牌暂无可用接口，请由有字段维护权限的管理员在“取数接口字典”新增或启用后再返回选择。']
  ])html=once(html,before,after);
  const oldSelection='请选择当前租户已授权且启用的取数接口';
  if(html.split(oldSelection).length!==3)throw Error('取数接口字段选择提示位置已变化。');
  html=html.split(oldSelection).join('请选择当前品牌下已启用的取数接口');

  const pageHeader='/** 取数接口字典，可独立显示或作为业务配置的第三个页签。 */';
  const pageStart=html.indexOf(pageHeader),pageEnd=html.indexOf('</script>',pageStart);
  if(pageStart<0||pageEnd<0)throw Error('取数接口字典页面未就绪。');
  const originalPage=html.slice(pageStart,pageEnd);let page=originalPage;
  page=once(page,'const allowed = () => model.canManage(usageScope)', 'const allowed = () => model.canRead(usageScope)');
  page=between(page,'  function tenantText(ids) {','  function render(options={}) {','');
  page=once(page,"embedded=options.embedded===true;usageScope=options.scope?{enterpriseId:options.scope.enterpriseId,tenantId:options.scope.tenantId}:model.canGrant()?null:{enterpriseId:state.enterpriseId,tenantId:state.tenantId};",
    "embedded=options.embedded===true;const owner=root.DNativeContext?.context;usageScope={enterpriseId:owner?.scope.tenant?.enterpriseId||state.enterpriseId,tenantId:owner?.scope.id||state.tenantId,brandId:model.brandInfo().brandId};");
  page=once(page,'if (!model.canManage(usageScope)) return denied();','if (!model.canRead(usageScope)) return denied();');
  page=once(page,'const global=model.canGrant(),data = model.managementEntries(usageScope);','const writable=model.canManage(usageScope),data = model.managementEntries(usageScope);');
  page=once(page,'data-page-id="PAGE-006"','data-page-id="PAGE-21016"');
  page=once(page,"ui.pageHeader('取数接口字典',global?'统一维护可供字段选择的取数接口，并设置可用租户。':'维护本租户专用接口，或使用超级管理员授权的共享接口。')",
    "ui.pageHeader('取数接口字典','维护当前所属品牌的取数接口，供本品牌业务字段使用。')");
  page=once(page,"(!global?'<p class=\"field-hint\" data-dictionary-tenant-guidance>可新增和维护本租户专用接口；共享接口可使用，由超级管理员修改。租户授权由超级管理员统一维护。</p>':'')",
    "('<p class=\"field-hint\" data-dictionary-brand>所属品牌：'+esc(model.brandInfo().name)+(writable?'':' · 当前账号只读，不可修改')+'</p>')");
  page=once(page,"ui.toolbar('<button class=\"btn btn-primary\" type=\"button\" onclick=\"'+command('open')+'\">新增接口</button>',",
    "ui.toolbar(writable?'<button class=\"btn btn-primary\" type=\"button\" onclick=\"'+command('open')+'\">新增接口</button>':'',");
  page=once(page,"{key:'tenantIds',label:global?'可用租户':'适用范围',className:'business-data-tenants-cell',render:value=>esc(global?tenantText(value):value.length===1?'本租户专用':'共享接口（已授权本租户）')},",
    "{key:'brandId',label:'所属品牌',render:()=>esc(model.brandInfo().name)},");
  page=once(page,"+(global?'<button class=\"btn-link\" type=\"button\" onclick=\"'+command('open',id,'tenants')+'\">租户授权</button>':'')",'');
  page=once(page,"'<span class=\"field-hint\" data-dictionary-shared-readonly>共享条目 · 仅超级管理员可修改</span>'",
    "'<span class=\"field-hint\">当前账号只读</span>'");
  page=between(page,'  function tenantChoices(selected) {','  function open(id, section) {','');
  page=once(page,"if (!allowed()) return notify('身份或工作范围已变化，请刷新后操作','warning');",
    "if (!allowed()||!model.canManage(usageScope)) return notify('当前账号没有此品牌取数接口的维护权限','warning');");
  page=once(page,"if(id&&!model.canEdit(id,usageScope)||section==='tenants'&&!model.canGrant())return notify('共享接口及租户授权由超级管理员维护；当前只能编辑本租户专用接口','warning');",
    "if(id&&!model.canEdit(id,usageScope)||section==='tenants')return notify('当前账号不能维护此接口或执行旧租户授权操作','warning');");
  page=once(page,"const global=model.canGrant(),review=id?model.capabilityEditReview(id,usageScope):null, current=row||{name:'',capabilityId:'series',tenantIds:global?[]:[usageScope.tenantId],enabled:true};",
    "const review=id?model.capabilityEditReview(id,usageScope):null,current=row||{name:'',capabilityId:'series',brandId:model.brandInfo().brandId,enabled:true};");
  page=once(page,"(global?'<fieldset class=\"business-data-tenant-field\"><legend>可用租户</legend><div class=\"business-data-tenant-options\">'+tenantChoices(current.tenantIds)+'</div><p class=\"field-hint\">勾选允许使用此接口的租户；未勾选的租户不能查询或选择新数据。</p></fieldset>':'<div class=\"field\"><span>可用租户</span><strong>'+esc(tenantText(current.tenantIds))+'</strong><small class=\"field-hint\">本租户专用；租户授权由超级管理员统一维护。</small></div>')",
    "('<div class=\"field\"><span>所属品牌</span><strong>'+esc(model.brandInfo().name)+'</strong></div>')");
  page=once(page,"    if(section==='tenants') root.document.querySelector('#'+layerId+' input[name=\"businessDataTenant\"]')?.focus();",'');
  page=once(page,"if(!model.canInspect(id,usageScope))return notify('当前租户未获此接口授权，无法查看使用情况','warning');",
    "if(!model.canInspect(id,usageScope))return notify('当前账号无权查看此品牌接口的使用情况','warning');");
  page=once(page,"if(!model.canEdit(id,usageScope))return notify('共享接口由超级管理员维护；当前只能删除本租户专用接口','warning');",
    "if(!model.canEdit(id,usageScope))return notify('当前账号没有此品牌取数接口的删除权限','warning');");
  page=once(page,"if(!allowed()||!editor||editor.context!==contextKey())",
    "if(!allowed()||!model.canManage(usageScope)||!editor||editor.context!==contextKey())");
  page=once(page,"return formError('接口维护权限已变化，请重新核对；共享接口由超级管理员维护');",
    "return formError('接口维护权限或所属品牌已变化，请重新核对');");
  page=once(page,"tenantIds:model.canGrant()?Array.from(form.querySelectorAll('input[name=\"businessDataTenant\"]:checked')).map(node=>node.value):[usageScope.tenantId],enabled:",
    'brandId:model.brandInfo().brandId,enabled:');
  page=once(page,"(model.canGrant()?'已授权租户':'本租户')", "'本品牌'");
  page=once(page,"if(!model.canEdit(id,usageScope))return notify('共享接口由超级管理员维护；当前只能启停本租户专用接口','warning');",
    "if(!model.canEdit(id,usageScope))return notify('当前账号没有此品牌取数接口的启停权限','warning');");
  html=once(html,originalPage,page);
  // This route's read-only controls remain read-only; no other route is changed.
  html=once(html,"    'report-center':new Set(['query'", "    'business-data-dictionary':new Set(['query','reset','setPage','refresh','references','close']),\n    'report-center':new Set(['query'");
  cloud.html=html;
})();
