/* Resource-only local scope: never grants SUPER_ADMIN or a business membership. */
(function(){
  'use strict';
  const menuPages={'agents.manage':['PAGE-2210','PAGE-2212'],'agents.sync':['PAGE-2214'],'settings.skills':['PAGE-2211'],'settings.queues':['PAGE-2213'],'resources.numbers':['PAGE-2215'],'settings.numberPools':['PAGE-2216'],'resources.extensions':['PAGE-2217'],'settings.times':['PAGE-2218'],'system.instances':['PAGE-2219'],'system.applications':['PAGE-2220'],'system.events':['PAGE-2221'],'system.audit':['PAGE-2222']};
  function context(){const c=parent.DSession.context(),g=parent.DSeed.resourceGrants?.[c?.account.id];return c&&g&&c.account.id===DNativeContext.context.account.id&&c.scope.id===DNativeContext.context.scope.id&&c.scope.kind==='platform'&&g.scopeId===c.scope.id?{c,g}:null;}
  const active=()=>!!context();
  function page(id){const x=context();return !!x&&x.g.pages.includes(id)&&x.c.scope.grant.pages.includes(id);}
  function enterpriseIds(){const x=context();return x?x.g.enterpriseIds.filter(id=>(x.c.scope.grant.enterpriseIds||[]).includes(id)):[];}
  function instances(){const ids=enterpriseIds();return (window.CloudCallData?.instances||[]).filter(row=>ids.includes(row.enterpriseId));}
  function tenants(state){const ids=enterpriseIds();return (window.CloudCallData?.tenants||[]).filter(t=>!t.builtIn&&t.status==='启用'&&ids.includes(t.enterpriseId)&&(!state||t.enterpriseId===state.enterpriseId));}
  function owns(row){if(!active()||!row)return false;const ids=enterpriseIds();if(row.enterpriseId&&!ids.includes(row.enterpriseId))return false;if(row.tenantId&&!tenants().some(t=>t.tenantId===row.tenantId))return false;return !!row.enterpriseId||!!row.tenantId;}
  function access(state){const x=context(),instance=instances().find(i=>i.enterpriseId===state.enterpriseId),list=tenants(state);return {valid:!!x&&!!instance&&instance.status==='RUNNING',accountId:x?.c.account.id||'',roleCode:'RESOURCE_ADMIN',roleId:'RESOURCE_ADMIN',roleLabel:'资源管理员',tenantId:list.length===1?list[0].tenantId:'',tenantType:'resource-scope',tenantIds:list.map(t=>t.tenantId),enterpriseId:state.enterpriseId,enterpriseIds:enterpriseIds(),activeDomain:'CLOUD_CONTACT_CENTER',capabilitySet:['CLOUD_CONTACT_CENTER'],dataScopeLabel:'有权呼叫资源'};}
  function initialize(state){const ids=enterpriseIds();if(!ids.includes(state.enterpriseId))state.enterpriseId=ids[0]||'';const list=tenants(state);state.tenantId=list.length===1?list[0].tenantId:'';state.activeDomain='CLOUD_CONTACT_CENTER';state.authStage='READY';}
  function menu(permission,state){const id=state?.enterpriseId||enterpriseIds()[0];if(permission!=='system.instances'&&!instances().some(r=>r.enterpriseId===id&&r.status==='RUNNING'))return false;return (menuPages[permission]||[]).some(page);}
  function action(permission){const map={'instance.manage':'PAGE-2219','number.manage':'PAGE-2215','line.manage':'PAGE-2215','skill.template.manage':'PAGE-2211'};return !!map[permission]&&page(map[permission]);}
  window.DResourceAccess={active,page,enterpriseIds,instances,tenants,owns,access,initialize,menu,action};
})();

/* Production roles are orthogonal to native resource scopes and telephone identities. */
(function(){
  'use strict';
  function current(){const c=parent.DSession.context(),o=DNativeContext.context;return c&&c.account.id===o.account.id&&c.scope.id===o.scope.id&&parent.DSession.roleKey(c)?c:null;}
  function boundSeat(){const c=current();if(!c||c.scope.kind!=='tenant'||c.scope.authorityScopeId)return false;const t=c.scope.tenant,rows=(window.CloudCallData?.agents||[]).filter(a=>a.accountId===c.account.id&&a.tenantId===t.id&&String(a.enterpriseId)===String(t.enterpriseId)&&a.lifecycleStatus!=='已删除');return rows.length===1&&rows[0].lifecycleStatus==='已启用'&&rows[0].callEnabled!==false&&!!rows[0].contactCenterIdentityId&&!!rows[0].cno;}
  const menus={'system.events':'PAGE-2221','system.audit':'PAGE-2222','settings.routes':'PAGE-2207'};
  function menu(permission){const c=current();if(!c)return null;if(permission==='settings.routes')return parent.DSession.can('F35',c);const id=menus[permission];return id?parent.DSession.policyPage(id,c):null;}
  const actions={'recording.play':'F31','customer.import':'F24','task.create':'F33','task.start':'F34','task.pause':'F34','task.resume':'F34','task.abort':'F34','application.manage':'F51','instance.manage':'F41','number.manage':'F40','line.manage':'F40','skill.template.manage':'F40','tenant.manage':'F08','tenant.view':'F01'};
  function action(permission){const c=current();if(!c)return null;if(permission==='report.export')return parent.DSession.can(parent.DApp.currentPage()==='PAGE-2222'?'F44':'F30',c);const id=actions[permission];return id?parent.DSession.can(id,c):null;}
  function sensitive(permission){const c=current();if(!c)return null;if(permission==='number.plain')return parent.DSession.can('F32',c);if(/record|audio/i.test(permission))return parent.DSession.can('F31',c);return null;}
  window.DProductionAccess={active:()=>!!current(),current,boundSeat,menu,action,sensitive};
})();
