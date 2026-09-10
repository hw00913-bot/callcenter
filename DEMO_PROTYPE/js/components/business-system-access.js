/** 业务系统租户授权：超管维护，租户管理员按授权使用。 */
(function(){
  'use strict';
  const data=CloudCallData;
  const storageKey='cloud-business-system-grants-v1';
  function system(id){return data.businessSystems.find(s=>s.businessSystemId===id);}
  function context(){const s=AppState.get();return [s.accountId,s.sessionId,s.tenantId,s.instanceId,s.activeDomain].join('|');}
  function canManage(row){return AppState.isSuper()&&AppState.effectiveAccess().valid&&AppState.get().activeDomain==='CLOUD_CONTACT_CENTER'&&row?.instanceId===AppState.get().instanceId;}
  function forTenant(tenantId){const t=CloudCallRuntime.tenant(tenantId);return data.businessSystems.filter(s=>t&&t.status==='启用'&&t.capabilitySet.includes('CLOUD_CONTACT_CENTER')&&s.instanceId===t.instanceId&&s.status==='已接入'&&(s.authorizedTenantIds||[]).includes(tenantId));}
  function canUse(id){const a=AppState.effectiveAccess();return a.valid&&a.roleCode==='ADMIN'&&a.activeDomain==='CLOUD_CONTACT_CENTER'&&forTenant(a.tenantId).some(s=>s.businessSystemId===id);}
  function route(id){return 'business-system-'+encodeURIComponent(id);}
  function persist(){sessionStorage.setItem(storageKey,JSON.stringify(data.businessSystems.map(s=>({businessSystemId:s.businessSystemId,instanceId:s.instanceId,authorizedTenantIds:s.authorizedTenantIds||[]}))));}
  // 仅恢复当前标签页演示授权；不覆盖系统资料，不代表服务器权限存储。
  try{const saved=JSON.parse(sessionStorage.getItem(storageKey)||'null');if(Array.isArray(saved))for(const item of saved){const row=system(item?.businessSystemId);if(row&&item.instanceId===row.instanceId&&Array.isArray(item.authorizedTenantIds)&&item.authorizedTenantIds.every(id=>typeof id==='string'&&CloudCallRuntime.tenant(id)?.instanceId===row.instanceId))row.authorizedTenantIds=[...new Set(item.authorizedTenantIds)];}}catch(error){/* 无效快照保留演示初值。 */}
  window.BusinessSystemAccess={system,context,canManage,forTenant,canUse,route,persist};
})();
