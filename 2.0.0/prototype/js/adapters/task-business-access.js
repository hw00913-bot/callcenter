/* A synchronous business-ledger scope for AI-only task imports. No Cloud grant or state writes. */
(function(root){
  'use strict';
  let scope=null;
  const methods=new Set(['taskImportContext','previewTaskImport','importTaskRecords','taskImportRecords','taskRosterRecords','reconcileTaskImport']);
  const clone=value=>JSON.parse(JSON.stringify(value));
  function current(write=false){
    const c=root.parent.DSession.context(),owner=root.DNativeContext?.context;
    if(!c||c.scope.kind!=='tenant'||c.scope.tenant?.enabled!==true||c.account.id!==owner?.account.id||c.scope.id!==owner?.scope.id||root.parent.DApp.currentPage()!=='PAGE-2103'||!root.parent.DSession.allowed('PAGE-2103')||c.scope.tenant.modules?.ai!==true||!c.scope.grant.modules?.includes('ai'))throw Error('当前AI任务业务范围已变化。');
    if(write&&(c.scope.grant.role!=='admin'||!root.parent.DSession.canWrite('PAGE-2103')||!root.parent.DSession.can('F24')))throw Error('任务内统一业务导入需当前租户有权管理员办理。');
    return c;
  }
  function active(){try{if(!scope)return false;const c=current(scope.write);return c.account.id===scope.accountId&&c.scope.id===scope.tenantId;}catch(_){return false;}}
  function access(){if(!active())return {valid:false};const c=current(scope.write),role=c.scope.grant.role==='admin'?'ADMIN':c.scope.grant.role==='super'?'SUPER_ADMIN':'OPERATOR';return {valid:true,accountId:c.account.id,userId:c.account.id,roleCode:role,roleId:role,roleLabel:role==='ADMIN'?'租户管理员':'任务业务只读',tenantId:c.scope.id,tenantIds:[c.scope.id],enterpriseId:c.scope.tenant.enterpriseId||'',enterpriseIds:c.scope.tenant.enterpriseId?[c.scope.tenant.enterpriseId]:[],capabilitySet:[],activeDomain:'TASK_AI_BUSINESS',dataScopeLabel:c.scope.tenant.name,taskBusinessScope:clone(scope)};}
  function state(){const a=access();return {...a,sessionId:'task-business-'+a.accountId,authStage:a.valid?'READY':'DENIED'};}
  function tenants(){if(!active())return [];const c=current(scope.write),row=(root.CloudCallData?.tenants||[]).find(item=>item.tenantId===c.scope.id);return [clone(row||{tenantId:c.scope.id,enterpriseId:c.scope.tenant.enterpriseId||'',brandId:c.scope.tenant.brandId,status:'启用',name:c.scope.tenant.name,capabilitySet:[]})];}
  function tenantValid(tenantId){return active()&&tenantId===scope.tenantId;}
  function action(permission){return active()&&scope.write===true&&['customer.import','task.create'].includes(permission)&&root.parent.DSession.can('F24')&&root.parent.DSession.canWrite('PAGE-2103');}
  function owns(permission,object){if(!active()||!object||permission&&!action(permission))return false;const c=current(scope.write),tenantId=object.tenantId||object.ownerTenantId;return (!tenantId||tenantId===c.scope.id)&&(!object.enterpriseId||String(object.enterpriseId)===String(c.scope.tenant.enterpriseId||''))&&(!object.brandId||object.brandId===c.scope.tenant.brandId)&&!!(tenantId||object.brandId);}
  function invoke(name,spec,extra,write=true){
    if(!methods.has(name)||spec?.method!=='AI'||!String(spec.taskId||''))throw Error('当前共享业务通道只允许准确AI任务的导入或读取。');
    const c=current(write);
    // Existing full-Cloud users continue through their unchanged native access.
    if(c.scope.tenant.modules.cloud===true&&c.scope.grant.modules.includes('cloud'))return name==='reconcileTaskImport'?root.BusinessFlowStore[name](spec.requestId,spec):root.BusinessFlowStore[name](spec,extra);
    const previous=scope;scope={accountId:c.account.id,tenantId:c.scope.id,taskId:String(spec.taskId),method:'AI',write:write===true};
    try{const result=name==='reconcileTaskImport'?root.BusinessFlowStore[name](spec.requestId,spec):root.BusinessFlowStore[name](spec,extra);if(result?.then)throw Error('共享业务事务必须同步完成。');return result;}finally{scope=previous;}
  }
  root.DTaskBusinessAccess={invoke,active,access,state,tenants,tenantValid,action,owns};
})(window);
