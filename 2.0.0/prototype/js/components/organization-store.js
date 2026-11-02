/* Unified local organization model. Business data and provider configuration remain native. */
(function () {
  'use strict';
  const clone=value=>JSON.parse(JSON.stringify(value));
  function create(seed,session,storage,clock=()=>new Date().toISOString()) {
    const fixedSpecialDemo=clone(seed.accounts.find(a=>a.id==='DEMO-AI-PLATFORM'));
    const fixedBuiltinPages=clone(seed.accounts.find(a=>a.id==='ACC-SUPER-001').platform.pages);
    const originalSeed=clone({brands:seed.brands,tenants:seed.tenants,accounts:seed.accounts});
    const key=session.prefix+'organization';let data,unknown=new Map(),listeners=[],referenceResolver=null,integrationResolver=null;
    const roles=['operator','admin'];
    function baseline(){return {version:1,revision:0,...clone(originalSeed),audit:[],operations:[]};}
    function read(){let raw;try{raw=storage.getItem(key);}catch(_){throw Error('读取失败，请重试；已保存数据保留。');}if(raw===null)return baseline();try{const d=JSON.parse(raw);if(d.version!==1||!['brands','tenants','accounts','audit','operations'].every(k=>Array.isArray(d[k])))throw Error();return d;}catch(_){throw Error('组织资料格式异常，原数据已保留，请先核对。');}}
    function apply(d){d=clone(d);if(fixedSpecialDemo&&!d.accounts.some(a=>a.id===fixedSpecialDemo.id))d.accounts.push(clone(fixedSpecialDemo));const builtin=d.accounts.find(a=>a.id==='ACC-SUPER-001');if(builtin?.platform)builtin.platform.pages=clone(fixedBuiltinPages);for(const kind of ['accounts','tenants'])for(const row of seed.syntheticLegacy?.[kind]||[])if(!d[kind].some(x=>x.id===row.id))d[kind].push(clone(row));data=d;seed.brands=clone(d.brands);seed.tenants=clone(d.tenants);seed.accounts=clone(d.accounts);}
    function load(){apply(read());return snapshot();}
    const snapshot=()=>clone(data);
    const ctx=()=>session.context();
    const globalAdministrator=()=>session.isGlobalAdministrator(ctx());
    const managementGrant=()=>globalAdministrator()?session.platformAuthority(ctx()):ctx()?.scope.grant;
    function permission(action,tenantId){
      const c=ctx();if(!c)return false;
      const grant=managementGrant(),explicit=grant?.permissions||[];
      const functions={'account.create':'F02','member.manage':'F04','member.disable':'F05','account.disable':'F06','brand.write':'F07','tenant.create':'F08','tenant.update':'F09','tenant.brand':'F10','module.open':'F11','seat.link':'F13','account.delete':'F14','tenant.delete':'F14'};
      if(session.roleKey(c)&&functions[action]&&!session.can(functions[action],c))return false;
      if(!explicit.includes(action))return false;
      if(!tenantId)return session.isPlatformContext(c);
      return session.isPlatformContext(c)?(grant.tenantIds||[]).includes(tenantId):c.scope.id===tenantId;
    }
    function requirePermission(action,tenantId){if(!permission(action,tenantId))throw Error('当前账号没有此对象的操作权限。');}
    function tenant(d,id){const t=d.tenants.find(t=>t.id===id);if(!t)throw Error('租户不存在，请刷新后重试。');return t;}
    function account(d,id){const a=d.accounts.find(a=>a.id===id);if(!a)throw Error('账号不存在，请刷新后重试。');return a;}
    function visibleTenantIds(){const c=ctx();return !c?[]:globalAdministrator()?data.tenants.map(t=>t.id):session.isPlatformContext(c)?(c.scope.grant.tenantIds||[]):[c.scope.id];}
    function tenants(brandId){const ids=visibleTenantIds();return DListOrder.rows(clone(data.tenants.filter(t=>ids.includes(t.id)&&(!brandId||t.brandId===brandId))));}
    function brands(){const c=ctx();if(!c)return [];const ids=globalAdministrator()?data.brands.map(b=>b.id):session.isPlatformContext(c)?(c.scope.grant.brandIds||[]):tenants().map(t=>t.brandId);return DListOrder.rows(clone(data.brands.filter(b=>ids.includes(b.id))));}
    function members(tenantId){if(!visibleTenantIds().includes(tenantId))return [];return DListOrder.rows(data.accounts.filter(a=>(globalAdministrator()||!(seed.syntheticLegacy?.accounts||[]).some(x=>x.id===a.id))&&a.memberships.some(m=>m.tenantId===tenantId)).map(a=>({account:clone(a),member:clone(a.memberships.find(m=>m.tenantId===tenantId))})),{keys:['account.updatedAt','member.updatedAt'],fallbackKeys:['member.createdAt','account.createdAt']});}
    function accounts(){if(!globalAdministrator()||!session.allowed('PAGE-2003'))throw Error('当前没有全局账号查看权限。');return DListOrder.rows(clone(data.accounts),{keys:[...DListOrder.updateKeys,'memberships[].updatedAt'],fallbackKeys:['createdAt','memberships[].createdAt']});}
    function identity(d){const c=ctx();if(!c)throw Error('当前会话已失效，请重新进入。');const a=account(d,c.account.id);if(!a.enabled)throw Error('账号已停用。');return a;}
    function commit(kind,objectId,fn,requestId){
      const op=requestId||('OP-'+Date.now()+'-'+Math.random().toString(36).slice(2,8));
      if(unknown.has(op))return {status:'unknown',requestId:op,message:'请先核对本次结果，不重复提交。'};
      const next=read();apply(clone(next));const actor=identity(next), existing=next.operations.find(x=>x.id===op);
      if(existing)return {status:'success',requestId:op,result:clone(existing.result)};
      const collection=kind==='维护租户'?'tenants':kind==='维护品牌'?'brands':null;
      const fields=collection==='tenants'?['id','name','contact','desc','commercialFlag','enabled','brandId','organization','storeCode','enterpriseId']:['id','name','remark'];
      const project=row=>row?Object.fromEntries(fields.filter(field=>Object.hasOwn(row,field)).map(field=>[field,clone(row[field])])):null;
      const before=collection?project(next[collection].find(row=>row.id===objectId)):null;
      const result=fn(next,actor)||{},actualId=result.id||objectId,at=clock();
      const mark=(row,created=false)=>{if(!row)return;row.updatedAt=at;row.updatedBy=actor.name||actor.login||actor.id;if(created){row.createdAt=at;row.createdBy=actor.name||actor.login||actor.id;}};
      if(collection)mark(next[collection].find(row=>row.id===actualId),before===null);
      if(['创建账号及成员','维护全局账号资料','调整全局账号状态'].includes(kind))mark(next.accounts.find(row=>row.id===actualId),kind==='创建账号及成员');
      if(['创建账号及成员','关联已有账号及成员','调整成员模块权限','调整本租户成员状态'].includes(kind))mark(next.accounts.find(row=>row.id===actualId)?.memberships.find(row=>row.tenantId===result.tenantId),['创建账号及成员','关联已有账号及成员'].includes(kind));
      if(kind==='调整模块开通')mark(next.tenants.find(row=>row.id===actualId));
      const audit={at,actorId:actor.id,kind,objectId:actualId,requestId:op};
      if(collection){
        const after=project(next[collection].find(row=>row.id===actualId));
        const changedFields=fields.filter(field=>Object.hasOwn(before||{},field)!==Object.hasOwn(after||{},field)||JSON.stringify(before?.[field])!==JSON.stringify(after?.[field]));
        Object.assign(audit,{objectType:collection==='tenants'?'tenant':'brand',change:before===null?'created':changedFields.length?'updated':'unchanged',before,after,changedFields});
      }
      next.revision++;next.audit.push(audit);
      next.operations.push({id:op,result:clone(result)});
      try{storage.setItem(key,JSON.stringify(next));}catch(_){throw Error('保存失败，修改未提交，请保留填写内容后重试。');}
      try{const saved=read();if(!saved.operations.some(x=>x.id===op))throw Error();apply(saved);}catch(_){unknown.set(op,true);return {status:'unknown',requestId:op,message:'保存结果暂时无法核对，请核对本次操作。'};}
      listeners.forEach(fn=>fn({kind,objectId}));return {status:'success',requestId:op,result:clone(result)};
    }
    function reconcile(id){const d=read(),op=d.operations.find(x=>x.id===id);if(!op)return {status:'unknown',requestId:id,message:'尚未查到可确认结果，请勿重复提交。'};unknown.delete(id);apply(d);listeners.forEach(fn=>fn({kind:'reconciled',objectId:''}));return {status:'success',requestId:id,result:clone(op.result)};}
    function name(value){const text=String(value||'').trim();if(!text||text.length>60)throw Error('请输入 1–60 个字的名称。');return text;}
    function integration(kind,id){try{return integrationResolver?.(kind,id)||{known:false};}catch(_){return {known:false};}}
    function canBindResource(tenantId){const c=ctx(),g=seed.tenantResourceGrants?.[c?.account.id];return !!c&&session.isPlatformContext(c)&&g?.scopeId===session.authorityScopeId(c)&&g.canBind===true&&session.allowed('PAGE-2219')&&permission(tenantId?'tenant.update':'tenant.create',tenantId);}
    function tenantStamp(t){return JSON.stringify([t.id,t.name,t.contact||'',t.desc||'',t.commercialFlag||'',t.enabled,t.brandId||'',t.organization||'',t.enterpriseId||'',Object.hasOwn(t,'storeCode')?t.storeCode:null]);}
    function currentCode(t){if(Object.hasOwn(t,'storeCode'))return {known:true,value:t.storeCode};const x=integration('binding',t.id);return x.known?{known:true,value:typeof x.value?.storeCode==='string'?x.value.storeCode:''}:{known:false,value:''};}
    function historyState(t){if(t.hasBusinessData)return true;const x=integration('history',t.id);return x.known?x.value===true:null;}
    function tenantInfo(id){if(!visibleTenantIds().includes(id))throw Error('没有该租户资料的查看权限。');const t=tenant(data,id),code=currentCode(t);return {stamp:tenantStamp(t),codeKnown:code.known,storeCode:code.value,hasBusinessData:historyState(t)};}
    function resource(d,t,eid){const result=integration('supplier',eid);if(!result.known)throw Error('云呼叫账号暂时无法核对，请先重新读取资源资料。');const row=result.value;if(!row||row.enterpriseId!==eid||row.status!=='RUNNING')throw Error('请选择当前有权且已启用的云呼叫账号。');if(d.tenants.some(x=>x.id!==t.id&&x.enterpriseId===eid)||(row.tenantIds||[]).some(id=>id!==t.id))throw Error('该云呼叫账号已关联其他租户，不能重复关联。');return row;}
    function storeCode(d,t,brandId,organization,value){if(typeof value!=='string'||value.trim().length>80)throw Error('门店编码须为不超过80个字的文本。');const code=organization==='门店'?value.trim():'';if(!code)return '';const old=integration('bindings',brandId);if(!old.known)throw Error('门店编码目录暂时无法核对，本次未保存。');const rows=new Map((old.value||[]).map(b=>[b.tenantId,{id:b.tenantId,brandId:b.brandId,organization:b.kind==='STORE'?'门店':'总部',storeCode:b.storeCode||''}]));for(const row of d.tenants){const prior=rows.get(row.id)||{};rows.set(row.id,{...prior,...row,storeCode:Object.hasOwn(row,'storeCode')?row.storeCode:prior.storeCode||''});}if([...rows.values()].some(x=>x.id!==t.id&&x.brandId===brandId&&x.organization==='门店'&&x.storeCode===code))throw Error('该品牌已有门店使用此编码，请核对后填写。');return code;}
    function binding(d,t,brandId,organization){
      if(!d.brands.some(b=>b.id===brandId))throw Error('请选择有效品牌。');
      if(!['总部','门店'].includes(organization))throw Error('请选择总部或门店。');
      if(t.brandId&&(t.brandId!==brandId||t.organization!==organization)){const history=historyState(t);if(history!==false)throw Error(history===true?'已有业务记录的租户不能更换品牌或总部／门店身份。':'历史引用尚待核对，暂不能更换品牌或总部／门店身份。');}
      if(organization==='总部'&&d.tenants.some(x=>x.id!==t.id&&x.brandId===brandId&&x.organization==='总部'))throw Error('该品牌已有总部租户，请选择门店或核对品牌。');
    }
    function saveBrand(input,requestId){requirePermission('brand.write');return commit('维护品牌',input.id||'',(d,a)=>{
      requirePermission('brand.write');const label=name(input.name),id=input.id||'BRAND-'+Date.now()+'-'+Math.random().toString(36).slice(2,6);
      if(input.remark!==undefined&&typeof input.remark!=='string')throw Error('品牌备注须为文本。');
      if(input.id){if(!(managementGrant()?.brandIds||[]).includes(id))throw Error('没有该品牌的维护权限。');const b=d.brands.find(b=>b.id===id);if(!b)throw Error('品牌不存在。');b.name=label;if(input.remark!==undefined)b.remark=input.remark.trim();}else{d.brands.push({id,name:label,remark:(input.remark||'').trim()});a.platform.brandIds.push(id);}
      return {id};
    },requestId);}
    function saveTenant(input,requestId){if(input.id)requirePermission('tenant.update',input.id);else requirePermission('tenant.create');return commit('维护租户',input.id||'',(d,a)=>{
      if(input.id)requirePermission('tenant.update',input.id);else requirePermission('tenant.create');const id=input.id||'TEN-'+Date.now()+'-'+Math.random().toString(36).slice(2,6);let t=input.id?tenant(d,id):{id,enabled:true,modules:{ai:false,cloud:false},enterpriseId:'',storeCode:'',hasBusinessData:false,mockCreated:true};
      if(input.id&&input.expectedStamp&&input.expectedStamp!==tenantStamp(t))throw Error('租户资料已更新，请重新读取后再保存。');
      const changesBrand=!input.id||input.brandId!==undefined&&input.brandId!==t.brandId||input.organization!==undefined&&input.organization!==t.organization;
      if(changesBrand){if(input.id)requirePermission('tenant.brand',id);else requirePermission('tenant.create');if(!(managementGrant()?.brandIds||[]).includes(input.brandId))throw Error('没有该品牌的归属维护权限。');binding(d,t,input.brandId,input.organization);t.brandId=input.brandId;t.organization=input.organization;}
      if(Object.hasOwn(input,'enterpriseId')&&input.enterpriseId!==(t.enterpriseId||'')){if(!canBindResource(input.id))throw Error('没有此租户的云呼叫账号关联权限。');if(typeof input.enterpriseId!=='string'||input.enterpriseId!==input.enterpriseId.trim())throw Error('请选择有效云呼叫账号。');if(t.enterpriseId){const history=historyState(t);if(history!==false)throw Error(history===true?'已有业务或资源引用，不能更换云呼叫账号。':'原资源引用尚未核清，不能更换云呼叫账号。');if(!input.enterpriseId)throw Error('已有云呼叫账号关联不能在此直接清空。');}if(input.enterpriseId)resource(d,t,input.enterpriseId);t.enterpriseId=input.enterpriseId;}
      if(Object.hasOwn(input,'storeCode')){if(input.id)requirePermission('tenant.brand',id);else requirePermission('tenant.create');const prior=currentCode(t);if(input.expectedCode!==undefined&&(!prior.known||prior.value!==input.expectedCode))throw Error('原门店编码已变化或未核定，请重新读取后保存。');t.storeCode=storeCode(d,t,t.brandId,t.organization,input.storeCode);}
      t.name=name(input.name);if(Object.hasOwn(input,'contact'))t.contact=String(input.contact||'').trim();
      if(Object.hasOwn(input,'desc')){if(typeof input.desc!=='string'||input.desc.trim().length>50)throw Error('描述不能超过50个字。');t.desc=input.desc.trim();}
      if(Object.hasOwn(input,'commercialFlag')&&input.commercialFlag!==t.commercialFlag){requirePermission('tenant.create');if(!['trial','commercial'].includes(input.commercialFlag))throw Error('请选择试用或商用标记。');t.commercialFlag=input.commercialFlag;}
      if(Object.hasOwn(input,'enabled')&&input.enabled!==t.enabled){requirePermission('tenant.create');if(typeof input.enabled!=='boolean')throw Error('请选择有效租户状态。');t.enabled=input.enabled;}
      if(!input.id){d.tenants.push(t);a.platform.tenantIds.push(id);}return {id};
    },requestId);}
    function setModule(tenantId,module,enabled,requestId){requirePermission('module.open',tenantId);if(!['ai','cloud'].includes(module))throw Error('模块不存在。');return commit('调整模块开通',tenantId,(d)=>{requirePermission('module.open',tenantId);const t=tenant(d,tenantId);if(module==='cloud'&&enabled){if(!t.enterpriseId)throw Error('请先在租户资料中关联云呼叫账号，再开通云呼叫。');resource(d,t,t.enterpriseId);}t.modules[module]=!!enabled;return {id:tenantId,module,enabled:t.modules[module],modules:clone(t.modules)};},requestId);}
    function validateMember(d,tenantId,grants,existing={}){const t=tenant(d,tenantId),c=ctx();const allowed=c.scope.grant.delegableRoles||{};
      for(const module of ['ai','cloud']){const role=grants[module]||'';if(!role)continue;if(!roles.includes(role)||!(allowed[module]||[]).includes(role))throw Error('该业务角色超出你的可授权范围。');if(!t.modules[module]&&!(existing.modules||[]).includes(module))throw Error('该租户尚未开通'+(module==='ai'?'AI外呼':'云呼叫')+'。');}
      const modules=['ai','cloud'].filter(k=>grants[k]);return {modules,contactAdd:grants.publicAdd===true,moduleRoles:{ai:grants.ai||'',cloud:grants.cloud||''},pages:seed.rolePages.publicOperator.concat(grants.publicAdd===true?['PAGE-2007']:[],...modules.map(k=>seed.rolePages[k][grants[k]]))};
    }
    // The account profile is global; membership role/status and module grants are tenant-local.
    function accountLogin(a){const fixture=seed.demoLogin?.accounts?.[a.id];return a.login&&a.login!==a.id?a.login:fixture?.username||a.login||a.id;}
    function accountMobile(a){return Object.hasOwn(a,'mobile')?a.mobile:seed.demoLogin?.accounts?.[a.id]?.mobile||'';}
    function mobile(value){const text=String(value||'').trim();if(!/^1\d{10}$/.test(text))throw Error('请输入正确的11位手机号。');return text;}
    function profile(d,input,existing){
      const login=String(input.login||'').trim(),label=String(input.name||'').trim(),phone=mobile(input.mobile);
      if(!/^[A-Za-z0-9._-]{4,32}$/.test(login)&&login!==accountLogin(existing||{}))throw Error('账号需为4–32位，支持字母、数字、点、横线和下划线。');
      if(!label||label.length>20)throw Error('请输入1–20字账号昵称。');
      if(d.accounts.some(a=>a.id!==existing?.id&&(accountLogin(a)===login||a.login===login)))throw Error('账号已存在，请核对已有账号。');
      if(d.accounts.some(a=>a.id!==existing?.id&&accountMobile(a)===phone))throw Error('手机号已关联已有账号，请先查找并关联该账号。');
      const password=String(input.password||'');
      if((!existing||password)&&!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,16}$/.test(password))throw Error('密码需为8–16位，包含大小写字母、数字和符号。');
      const next={login:existing&&login===accountLogin(existing)?existing.login||login:login,name:label,mobile:phone};
      if(password)next.password=password;
      if(Object.hasOwn(input,'avatar')){
        if(typeof input.avatar!=='string')throw Error('请选择有效头像图片。');
        if(input.avatar!==existing?.avatar&&input.avatar!==''&&(!/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(input.avatar)||input.avatar.length>Math.ceil(2*1024*1024*4/3)+100))throw Error('头像须为不超过2MB的PNG、JPEG或WebP图片。');
        next.avatar=input.avatar;
      }
      return next;
    }
    function membership(d,tenantId,grants,role,enabled,existing){
      const c=ctx(),chosen=role===undefined?(existing?.role==='seat'?'operator':existing?.role||'operator'):role;
      if(role!==undefined&&!['admin','operator'].includes(chosen))throw Error('请选择租户管理员或租户运营。');
      if(chosen==='admin'&&existing?.role!=='admin'&&!['admin','super'].includes(c.scope.grant.role))throw Error('当前身份不能授权租户管理员。');
      if(enabled!==undefined&&typeof enabled!=='boolean')throw Error('请选择有效成员状态。');
      const normalized={...grants,...Object.fromEntries(['ai','cloud'].map(k=>[k,grants[k]?chosen:'']))};
      const grant=validateMember(d,tenantId,normalized,existing),admin=chosen==='admin';
      const permissions=admin?['account.create','member.manage','member.disable','tenant.update','seat.link'].filter(p=>(c.scope.grant.permissions||[]).includes(p)):[];
      const pages=[...new Set((admin?seed.rolePages.publicAdmin.filter(id=>(c.scope.grant.pages||[]).includes(id)):[]).concat(grant.pages))];
      const t=tenant(d,tenantId),usable=pages.filter(id=>{const p=session.page(id);return p&&(p.module==='public'||t.modules[p.module]&&grant.modules.includes(p.module));});
      const landing=[...(admin?['PAGE-2003']:[]),...(grant.modules.includes('cloud')?['PAGE-2204']:[]),...(grant.modules.includes('ai')?['PAGE-2103']:[]),...usable].find(id=>usable.includes(id))||'';
      return {tenantId,role:chosen,enabled:enabled===undefined?(existing?.enabled??true):enabled,...grant,pages,landing,
        permissions,delegableRoles:admin?clone(c.scope.grant.delegableRoles||{}):{}};
    }
    function lookupAccount(value,tenantId){
      requirePermission('account.create',tenantId);const phone=mobile(value),rows=data.accounts.filter(a=>accountMobile(a)===phone);
      if(rows.length>1)throw Error('手机号关联不唯一，请先核对账号资料。');
      if(!rows.length)return {status:'new',mobile:phone};
      const a=rows[0];return {status:'existing',mobile:phone,account:{id:a.id,name:a.name,login:accountLogin(a),mobile:phone,avatar:a.avatar||'',enabled:a.enabled,builtIn:a.builtIn===true},member:clone(a.memberships.find(m=>m.tenantId===tenantId)||null)};
    }
    function createAccount(tenantId,input,requestId){requirePermission('account.create',tenantId);return commit('创建账号及成员',tenantId,d=>{
      requirePermission('account.create',tenantId);const t=tenant(d,tenantId);if(!t.enabled)throw Error('停用租户不能新增成员，请先恢复租户。');
      const next=profile(d,input),id='ACC-'+Date.now()+'-'+Math.random().toString(36).slice(2,6),m=membership(d,tenantId,input.roles||{},input.role,input.enabled);
      if(m.enabled&&!m.pages.length)throw Error('请先开通并授予至少一个模块使用权限，或选择租户管理员。');
      d.accounts.push({id,...next,label:'租户成员',enabled:true,mockCreated:true,hasBusinessData:false,memberships:[m]});return {id,tenantId,created:true};
    },requestId);}
    function linkAccount(tenantId,input,requestId){requirePermission('account.create',tenantId);return commit('关联已有账号及成员',input.accountId,d=>{
      requirePermission('account.create',tenantId);if(!tenant(d,tenantId).enabled)throw Error('停用租户不能新增成员，请先恢复租户。');
      const a=account(d,input.accountId),phone=mobile(input.mobile);
      if(accountMobile(a)!==phone||d.accounts.filter(x=>accountMobile(x)===phone).length!==1)throw Error('账号手机号已变化，请重新查找后关联。');
      if(a.builtIn||a.id==='ACC-SUPER-001')throw Error('内置超级管理员不能加入普通租户。');
      if(a.memberships.some(m=>m.tenantId===tenantId))throw Error('账号已属于当前租户，请返回列表编辑成员权限。');
      const m=membership(d,tenantId,input.roles||{},input.role,input.enabled);if(m.enabled&&!m.pages.length)throw Error('请先开通并授予至少一个模块使用权限，或选择租户管理员。');
      a.memberships.push(m);return {id:a.id,tenantId,created:false};
    },requestId);}
    function updateAccount(accountId,tenantId,input,requestId){requirePermission('account.disable');requirePermission('member.manage',tenantId);if(!tenantId&&!globalAdministrator())throw Error('当前没有全局账号资料维护权限。');return commit('维护全局账号资料',accountId,d=>{
      requirePermission('account.disable');requirePermission('member.manage',tenantId);const a=account(d,accountId);
      if(a.builtIn||a.id==='ACC-SUPER-001')throw Error('内置超级管理员资料不能在此修改。');
      if(tenantId&&!a.memberships.some(m=>m.tenantId===tenantId))throw Error('账号不是当前租户成员。');
      if(!tenantId&&!globalAdministrator())throw Error('当前没有全局账号资料维护权限。');
      const next=profile(d,input,a),changedCredentials=next.login!==a.login||next.mobile!==accountMobile(a)||!!input.password;
      Object.assign(a,next,changedCredentials?{credentialsUpdated:true}:{});return {id:accountId,tenantId};
    },requestId);}
    function setMemberRoles(accountId,tenantId,grants,requestId){requirePermission('member.manage',tenantId);return commit('调整成员模块权限',accountId,d=>{
      requirePermission('member.manage',tenantId);const a=account(d,accountId),m=a.memberships.find(m=>m.tenantId===tenantId);if(!m)throw Error('该账号不是本租户成员。');
      if(grants.enabled!==undefined&&grants.enabled!==m.enabled)requirePermission('member.disable',tenantId);
      const next=membership(d,tenantId,grants,grants.role,grants.enabled,m);
      // Preserve explicit independent configuration rights only while the public role stays unchanged.
      if(grants.role===undefined||grants.role===m.role){next.permissions=clone(m.permissions||next.permissions);next.delegableRoles=clone(m.delegableRoles||next.delegableRoles);const publicPages=(m.pages||[]).filter(id=>seed.rolePages.publicAdmin.includes(id)||['PAGE-2223','PAGE-2228'].includes(id));next.pages=[...new Set(publicPages.concat(next.pages))];}
      Object.assign(m,next);return {id:accountId,tenantId};
    },requestId);}
    function setEnabled(accountId,tenantId,enabled,requestId){requirePermission(tenantId?'member.disable':'account.disable',tenantId);return commit(tenantId?'调整本租户成员状态':'调整全局账号状态',accountId,d=>{
      requirePermission(tenantId?'member.disable':'account.disable',tenantId);const a=account(d,accountId);if(a.builtIn||a.id==='ACC-SUPER-001')throw Error('内置超级管理员账号不允许停用。');
      if(tenantId){const m=a.memberships.find(m=>m.tenantId===tenantId);if(!m)throw Error('成员关系不存在。');m.enabled=!!enabled;}else a.enabled=!!enabled;
      return {id:accountId,tenantId:tenantId||null,enabled:!!enabled,ongoingCalls:'finish-current-and-aftercall',acceptedTasks:'continue-original-rules'};
    },requestId);}
    function deletionReason(type,id,tenantId){
      if(type==='account'){const a=data.accounts.find(a=>a.id===id);if(!a)return '账号不存在';if(a.id==='ACC-SUPER-001'||a.builtIn)return '内置账号不能删除';if(a.memberships.some(m=>m.tenantId!==tenantId))return tenantId?'账号仍关联其他租户':'账号仍有关联租户，请先查看成员关系';if(!a.mockCreated||a.hasBusinessData)return '已有业务引用或引用尚未核清';}
      else{const t=data.tenants.find(t=>t.id===id);if(!t)return '租户不存在';if(!t.mockCreated||t.hasBusinessData)return '已有业务引用或引用尚未核清';if(data.accounts.some(a=>a.memberships.some(m=>m.tenantId===id)))return '租户仍有成员关联，请先核对';}
      if(referenceResolver){const result=referenceResolver(type,id);if(result===true)return '已有业务引用';if(result===null)return '引用状态暂时无法核清';if(result?.state==='referenced'||result?.state==='unknown')return result.message||'引用状态暂时无法核清';}
      return '';
    }
    function remove(type,id,tenantId,requestId){requirePermission(type==='account'?'account.delete':'tenant.delete',type==='account'?tenantId:id);return commit(type==='account'?'删除空账号':'删除空租户',id,d=>{
      requirePermission(type==='account'?'account.delete':'tenant.delete',type==='account'?tenantId:id);apply(clone(d));const reason=deletionReason(type,id,tenantId);if(reason)throw Error(reason+'，未执行删除。');
      const source=type==='account'?account(d,id):tenant(d,id),deletedObject={type,id,name:source.name,...(type==='account'?{login:source.login}:{brandId:source.brandId,organization:source.organization})};
      if(type==='account')d.accounts=d.accounts.filter(a=>a.id!==id);else d.tenants=d.tenants.filter(t=>t.id!==id);return {id,deleted:true,deletedObject};
    },requestId);}
    load();return {setReferenceResolver(fn){referenceResolver=fn;},setIntegrationResolver(fn){integrationResolver=fn;},tenantInfo,canBindResource,snapshot,load,permission,globalAdministrator,visibleTenantIds,tenants,brands,members,accounts,saveBrand,saveTenant,setModule,lookupAccount,createAccount,linkAccount,updateAccount,setMemberRoles,setEnabled,remove,deletionReason,reconcile,subscribe(fn){listeners.push(fn);},key};
  }
  window.createDOrganization=create;
  try{window.DOrganization=create(DSeed,DSession,localStorage);window.DOrganizationError=null;}catch(error){window.DOrganizationError=error;}
})();
