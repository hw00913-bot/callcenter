/* Shared tenant identities for AI forms and native references. */
(() => {
  'use strict';

  const scenePage = 'PAGE-2110';
  const fail = message => ({ok:false,rows:[],message});

  function current(requested = DSession.context()) {
    const context = DSession.context();
    return context && context.account.id===requested?.account?.id && context.scope.id===requested?.scope?.id ? context : null;
  }

  function directory(requested) {
    const context = current(requested);
    if (!context || !window.DOrganization) return null;
    const organization = DOrganization.snapshot();
    const brands = new Map(organization.brands.map(brand=>[brand.id,brand.name]));
    const scopes = new Map(DSession.scopes().filter(scope=>scope.kind==='tenant').map(scope=>[scope.id,scope]));
    const global = DSession.isGlobalAdministrator(context);
    const member = organization.accounts.find(account=>account.id===context.account.id && account.enabled);
    if (!member) return null;
    const membership = new Set((member.memberships || []).filter(row=>row.enabled).map(row=>row.tenantId));
    // Global management sees all directory rows that belong to a real brand.
    // Row visibility alone never grants a tenant operation.
    const rows = organization.tenants.filter(tenant=>global ? brands.has(tenant.brandId) : membership.has(tenant.id));
    return {context,brands,scopes,global,rows,allTenants:organization.tenants};
  }

  function eligibility(tenant,scope,info) {
    if (!tenant.enabled) return '租户已停用';
    if (!info.brands.has(tenant.brandId)) return '租户尚未关联品牌';
    if (!tenant.modules?.ai) return '未开通 AI 外呼';
    if (!scope) return '当前账号无该租户权限';
    const target = {...info.context,scope};
    if (!DSession.allowed(scenePage,target)) return '当前账号无该租户权限';
    if (!DRolePermissions.writable(scenePage,target)) {
      return '当前账号只有查看权限';
    }
    return '';
  }

  function choices(use,requested) {
    if (use!=='scene') return [];
    const info = directory(requested);
    if (!info || !DSession.allowed(scenePage,info.context)) return [];
    return DListOrder.rows(info.rows).map(tenant=>{
      const reason = eligibility(tenant,info.scopes.get(tenant.id),info);
      return {id:tenant.id,name:tenant.name,brandId:tenant.brandId || '',brandName:info.brands.get(tenant.brandId) || '',
        selectable:!reason,reason};
    });
  }

  function resolve(ids,use,requested) {
    const info = directory(requested);
    if (!info || use!=='scene' || !DSession.allowed(scenePage,info.context) ||
        !DSession.canWrite(scenePage)) return fail('当前账号没有配置权限。');
    if (!Array.isArray(ids) || !ids.length || ids.some(id=>typeof id!=='string' || !id) ||
        new Set(ids).size!==ids.length) return fail('请选择有效的可用租户。');
    const rows = new Map(choices(use,info.context).map(row=>[row.id,row]));
    const selected = ids.map(id=>rows.get(id));
    if (selected.some(row=>!row?.selectable)) return fail('所选租户已失效或超出当前账号的权限，请重新选择。');
    return {ok:true,rows:selected};
  }

  function canManageScene(row,requested) {
    const info = directory(requested);
    if (!info || !DSession.allowed(scenePage,info.context) || !DSession.canWrite(scenePage)) return false;
    if (info.global || !Array.isArray(row?.tenantIds)) return true;
    return row.tenantIds.every(id=>{
      const tenant = info.rows.find(item=>item.id===id);
      return tenant && !eligibility(tenant,info.scopes.get(id),info);
    });
  }

  function label(id,requested) {
    return directory(requested)?.rows.find(tenant=>tenant.id===id)?.name || '';
  }

  function referenceIds(row,requested) {
    const info = directory(requested);
    if (!info || !row) return [];
    const byId = new Map(info.rows.map(tenant=>[tenant.id,tenant]));
    if (Array.isArray(row.tenantIds)) return [...new Set(row.tenantIds.filter(id=>byId.has(id)))];
    const verified = [row.integrationTenantId,row.tenantId].filter(id=>byId.has(id));
    const relations = (window.DSeed?.aiSceneRelations || []).filter(relation=>byId.has(relation.tenantId) &&
      relation.sceneId===String(row.id) && relation.executionSceneId===row.sceneId &&
      relation.platform===row.platform && (!relation.professionalTaskId ||
        relation.professionalTaskId===String(row.taskId ?? row.task_id ?? '')));
    // Historical name-only links count only when exactly one real directory row matches.
    const options = Array.isArray(row.tenants) ? row.tenants : String(row.tenant || '').split('、');
    for (const option of options) {
      const exact = info.allTenants.filter(tenant=>tenant.name===option);
      if (exact.length===1 && byId.has(exact[0].id)) verified.push(exact[0].id);
    }
    return [...new Set([...verified,...relations.map(relation=>relation.tenantId)])];
  }

  window.DTenantDirectory = Object.freeze({choices,resolve,canManageScene,label,referenceIds});
})();
