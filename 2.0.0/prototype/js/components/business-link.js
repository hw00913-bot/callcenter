/* Integration authorization only; the existing record/template engine stays authoritative. */
(function(){
  'use strict';
  const configKinds={saveCategory:'PAGE-2006',saveRoute:'PAGE-2006',saveRouting:'PAGE-2006',saveTemplate:'PAGE-2228',deleteTemplate:'PAGE-2228'};
  function authorize(kind,payload,nativeAccess){
    const c=DSession.context();if(!c)return {ok:false,message:'当前身份或租户已不可用，请重新进入。'};
    if(nativeAccess?.regulationOnly)return {ok:false,message:'当前为监管只读范围，不能代为配置或办理业务记录。'};
    if(configKinds[kind])return DSession.allowed(configKinds[kind])&&DSession.canWrite(configKinds[kind])?{ok:true}:{ok:false,message:'当前账号没有本次业务配置的维护权限。'};
    if(c.scope.kind!=='tenant'||!DSession.allowed('PAGE-2227')||!DSession.canWrite('PAGE-2227'))return {ok:false,message:'当前身份仅可查看，不能办理此业务记录。'};
    if(nativeAccess.accountId!==c.account.id||nativeAccess.tenantId!==c.scope.id)return {ok:false,message:'办理范围已变化，请重新打开记录。'};
    if(['reclassify','saveContactPolicy'].includes(kind)&&c.scope.grant.role!=='admin')return {ok:false,message:'本次操作仅当前有权租户管理员可办理。'};
    if(kind==='startMany'&&!['AI','PREDICTIVE'].includes(payload.method))return {ok:false,message:'仅AI或预外呼支持按组发起，人工需本人逐条办理。'};
    if(kind==='start'||kind==='startMany'){
      const module=payload.method==='AI'?'ai':'cloud',role=c.scope.grant.moduleRoles?.[module];
      if(!c.scope.tenant.modules[module]||!c.scope.grant.modules.includes(module)||!role||role==='reader')return {ok:false,message:'本租户或当前成员尚无'+(module==='ai'?'AI外呼':'云呼叫')+'执行权限。'};
    }
    return {ok:true};
  }
  window.DBusinessLink={authorize};
})();
