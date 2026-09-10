/** 平台账号与业务账号的租户内关联；坐席关系独立维护。 */
(function(){
  'use strict';const ui=PlatformUI,esc=ui.escape;
  const contextKey=()=>BusinessSystemAccess.context();
  const tenantName=id=>CloudCallRuntime.tenant(id)?.name||id;
  function accounts(systemId,tenantId=AppState.get().tenantId){
    const tenant=CloudCallRuntime.tenant(tenantId);
    return CloudCallData.accounts.filter(a=>a.status==='启用'&&CloudCallData.memberships.some(m=>m.accountId===a.accountId&&m.tenantId===tenantId&&m.status==='启用')).map(a=>{
      const binding=CloudCallData.businessAccountBindings.find(b=>b.accountId===a.accountId&&b.tenantId===tenantId&&b.businessSystemId===systemId);
      return {...a,userName:a.name,tenantId,instanceId:tenant?.instanceId,businessSystemId:systemId,businessUserId:binding?.businessUserId||'',businessBinding:binding};
    });
  }
  // 校验读取最新的按 ID 查询模拟响应，不回写双方资料或绑定快照。
  function validate({tenantId,businessSystemId,accountId,businessUserId}={}){
    const fail=(code,reason,state='关联失效')=>({valid:false,code,state,reason});
    const tenant=CloudCallRuntime.tenant(tenantId),system=BusinessSystemAccess.system(businessSystemId);
    if(!tenant||tenant.status!=='启用'||!tenant.capabilitySet.includes('CLOUD_CONTACT_CENTER'))return fail('TENANT_DISABLED','租户不可使用云呼叫，请联系管理员');
    if(!system||system.instanceId!==tenant.instanceId||!BusinessSystemAccess.forTenant(tenantId).some(s=>s.businessSystemId===businessSystemId))return fail('SYSTEM_UNAUTHORIZED','业务系统未接入或租户授权已撤销，请联系超级管理员');
    const account=CloudCallData.accounts.find(a=>a.accountId===accountId);
    if(!account||account.status!=='启用')return fail('PLATFORM_ACCOUNT_DISABLED','平台账号已停用或删除，请联系租户管理员');
    if(!CloudCallData.memberships.some(m=>m.accountId===accountId&&m.tenantId===tenantId&&m.status==='启用'))return fail('MEMBERSHIP_DISABLED','平台账号已不属于本租户的有效成员，请联系租户管理员');
    const bindings=CloudCallData.businessAccountBindings.filter(b=>b.tenantId===tenantId&&b.businessSystemId===businessSystemId);
    const matches=bindings.filter(b=>b.accountId===accountId),binding=matches[0];
    if(!binding)return fail('NOT_BOUND','尚未关联业务账号，请联系租户管理员','未关联');
    if(matches.length!==1||!binding.businessUserId||binding.instanceId!==tenant.instanceId||bindings.filter(b=>b.businessUserId===binding.businessUserId).length!==1)return fail('BINDING_CONFLICT','关联记录冲突，请联系租户管理员核对');
    if(businessUserId!==undefined&&businessUserId!==binding.businessUserId)return fail('IDENTITY_MISMATCH','发起账号与已有绑定不一致，请联系租户管理员核对');
    if(system.accountValidationStatus!=='可校验')return fail('VALIDATION_UNAVAILABLE','暂时无法校验业务账号，请稍后重试；本次不能通过该关联发起外呼','待校验');
    const users=(CloudCallData.businessUserDirectory||[]).filter(u=>u.tenantId===tenantId&&u.businessSystemId===businessSystemId&&u.businessUserId===binding.businessUserId);
    if(users.length!==1)return fail('BUSINESS_ACCOUNT_MISSING','业务账号已删除或账号标识异常，请联系租户管理员核对关联');
    if(users[0].status!=='启用')return fail('BUSINESS_ACCOUNT_DISABLED','业务账号未启用，请在业务系统处理后重新校验');
    return {valid:true,code:'VALID',state:'关联有效',reason:'双方账号、租户授权及绑定关系有效；姓名和手机号变更不影响已有绑定'};
  }
  function reviewAccounts(systemId,tenantId=AppState.get().tenantId){
    const rows=accounts(systemId,tenantId);
    for(const b of CloudCallData.businessAccountBindings.filter(b=>b.tenantId===tenantId&&b.businessSystemId===systemId)){
      if(rows.some(a=>a.accountId===b.accountId))continue;
      const a=CloudCallData.accounts.find(a=>a.accountId===b.accountId);
      rows.push({...a,accountId:b.accountId,loginUsername:a?.loginUsername||'已删除的平台账号',userName:a?.name||'—',mobile:a?.mobile||'—',tenantId,instanceId:b.instanceId,businessSystemId:systemId,businessUserId:b.businessUserId,businessBinding:b});
    }
    return rows.map(a=>({...a,validity:validate(a)}));
  }
  // 当前登录发起人专用入口；管理员查看别人的关联不能代替本人外呼鉴权。
  function checkForOutbound(businessSystemId,businessUserId){
    const access=AppState.effectiveAccess(),state=AppState.get();
    if(!access.valid||access.activeDomain!=='CLOUD_CONTACT_CENTER'||AppState.isSuper())return {valid:false,code:'SESSION_INVALID',state:'不能发起',reason:'请使用本租户有效平台账号进入云呼叫'};
    if(!businessUserId)return {valid:false,code:'IDENTITY_REQUIRED',state:'不能发起',reason:'未提供业务账号标识，请先完成账号关联'};
    return validate({tenantId:state.tenantId,accountId:state.accountId,businessSystemId,businessUserId});
  }
  function accountById(id){return accounts(bindingContext?.systemId).find(a=>a.accountId===id);}
  function availableForBinding(a){return a&&BusinessSystemAccess.canUse(a.businessSystemId)&&accounts(a.businessSystemId).some(x=>x.accountId===a.accountId);}
  function bindingOwner(u){return CloudCallData.businessAccountBindings.find(b=>b.tenantId===u.tenantId&&b.businessSystemId===u.businessSystemId&&b.businessUserId===u.businessUserId);}
  let bindingContext=null,lookupVersion=0,lookupResult=null;
  function clearLookup(){
    lookupVersion++;lookupResult=null;
    const box=document.getElementById('businessLookupResult'),button=document.getElementById('confirmBusinessBinding');
    if(box)box.innerHTML=ui.empty('请输入手机号查询','查询已接入业务系统中的账号，再核对关联。');
    if(button)button.disabled=true;
    const query=document.getElementById('queryBusinessUser');if(query){query.disabled=false;query.textContent='查询';}
  }
  function closeBinding(){clearLookup();bindingContext=null;ui.closeLayer('business-binding');}
  function openBinding(id,systemId){
    if(!BusinessSystemAccess.canUse(systemId))return showToast('请从本租户已授权的业务系统菜单进入账号关联','warning');
    const agents=accounts(systemId);
    if(!agents.length)return showToast('当前租户暂无可关联的平台账号，请先在账号管理中维护本租户平台账号','warning');
    const agent=id?agents.find(a=>a.accountId===id):(agents.find(a=>!a.businessUserId)||agents[0]);
    if(!agent)return showToast('当前平台账号不可关联','warning');
    bindingContext={context:contextKey(),systemId};lookupResult=null;lookupVersion++;
    ui.openLayer('business-binding',`<div class="layer-header"><div><h2>关联业务账号</h2><p>${esc(BusinessSystemAccess.system(systemId).name)} · 按手机号查询并核对账号</p></div><button onclick="BusinessAccountBinding.closeBinding()">×</button></div><div class="layer-body"><div class="form-grid"><label class="field"><span>平台账号</span><select id="bindingAccount" onchange="BusinessAccountBinding.bindingAccountChanged()">${agents.map(a=>`<option value="${esc(a.accountId)}" ${a===agent?'selected':''}>${esc(a.loginUsername)} · ${esc(a.userName)}${a.businessUserId?'（已关联）':''}</option>`).join('')}</select></label><label class="field"><span>所属租户</span><input id="bindingTenantName" readonly></label><label class="field"><span>已接入业务系统</span><select id="bindingSystem" disabled></select></label><label class="field"><span>业务账号手机号</span><input id="bindingMobile" type="tel" inputmode="numeric" maxlength="11" placeholder="请输入完整的 11 位手机号" oninput="BusinessAccountBinding.clearLookup()"></label></div><div class="filter-actions"><button id="queryBusinessUser" class="btn btn-primary" onclick="BusinessAccountBinding.queryBusinessUser()">查询</button></div><div id="businessLookupResult" aria-live="polite"></div></div><div class="layer-footer"><span class="layer-footer-note">${ui.help('手机号仅用于查询。确认后绑定业务系统账号 ID 与现有平台账号 ID；双方资料各自维护；外呼前只校验关联有效性。查询结果为本地演示数据。')}</span><button class="btn" onclick="BusinessAccountBinding.closeBinding()">取消</button><button id="confirmBusinessBinding" class="btn btn-primary" disabled onclick="BusinessAccountBinding.confirmBusinessBinding()">确认绑定</button></div>`,'wide');
    bindingAccountChanged();
  }
  function bindingAccountChanged(){
    clearLookup();
    const agent=accountById(document.getElementById('bindingAccount')?.value);
    if(!agent||!availableForBinding(agent))return;
    document.getElementById('bindingTenantName').value=tenantName(agent.tenantId);
    document.getElementById('bindingMobile').value='';
    document.getElementById('bindingSystem').innerHTML=BusinessSystemAccess.forTenant(agent.tenantId).filter(s=>s.businessSystemId===bindingContext?.systemId).map(s=>`<option value="${esc(s.businessSystemId)}">${esc(s.name)}</option>`).join('')||'<option value="">本租户暂无已接入业务系统</option>';
  }
  function lookupScope(){
    const agent=accountById(document.getElementById('bindingAccount')?.value);
    const system=agent&&BusinessSystemAccess.forTenant(agent.tenantId).find(s=>s.businessSystemId===document.getElementById('bindingSystem')?.value);
    const mobile=document.getElementById('bindingMobile')?.value.trim()||'';
    if(!bindingContext||!BusinessSystemAccess.canUse(bindingContext.systemId)||system?.businessSystemId!==bindingContext.systemId||bindingContext.context!==contextKey()||!availableForBinding(agent)||!system)return null;
    return {agent,system,mobile,key:[contextKey(),agent.accountId,system.businessSystemId,mobile].join('|')};
  }
  // 按需查询的业务系统响应样本；不是同步到云呼叫的账号目录。
  function queryBusinessUser(){
    clearLookup();const scope=lookupScope(),box=document.getElementById('businessLookupResult');
    if(!scope)return showToast('请确认租户权限、平台账号状态及已接入业务系统','warning');
    if(!/^1[3-9]\d{9}$/.test(scope.mobile)){box.innerHTML=ui.alert('warning','手机号格式不正确','请输入完整的 11 位手机号。');return;}
    const version=lookupVersion,button=document.getElementById('queryBusinessUser');button.disabled=true;button.textContent='查询中…';
    box.innerHTML=ui.empty('正在查询业务系统','请稍候');
    setTimeout(()=>{
      if(version!==lookupVersion||scope.key!==lookupScope()?.key||!document.getElementById('businessLookupResult'))return;
      button.disabled=false;button.textContent='查询';
      if(scope.system.accountQueryStatus!=='可查询'){box.innerHTML=ui.alert('warning','查询失败','业务系统暂未返回结果，请稍后重新查询。');return;}
      const rows=(CloudCallData.businessUserDirectory||[]).filter(u=>u.businessSystemId===scope.system.businessSystemId&&u.tenantId===scope.agent.tenantId&&u.mobile===scope.mobile).map(u=>({...u}));
      if(!rows.length){box.innerHTML=ui.empty('未查到业务账号','请核对业务系统和手机号；如尚无账号，请先在业务系统创建后重新查询。');return;}
      lookupResult={key:scope.key,rows};
      box.innerHTML=`<div class="candidate-list">${rows.map((u,i)=>{const owner=bindingOwner(u),invalid=!u.businessUserId||rows.filter(x=>x.businessUserId===u.businessUserId).length!==1;const blocked=invalid||u.status!=='启用'||Boolean(owner)||Boolean(scope.agent.businessUserId);const state=u.status!=='启用'?'业务账号未启用':invalid?'账号资料不完整或重复':owner?(owner.accountId===scope.agent.accountId?'已关联当前平台账号':'已关联其他平台账号'):scope.agent.businessUserId?'当前平台账号已有关联':'待确认';return `<label class="candidate-row"><input type="radio" name="businessLookupUser" value="${i}" ${blocked?'disabled':''} onchange="BusinessAccountBinding.selectBusinessUser()"><div><strong>${esc(u.name)}</strong><small>${esc(u.mobile)} · ${esc(u.organization)} · ${esc(scope.system.name)}</small></div><span>${ui.status(state)}</span></label>`;}).join('')}</div><p class="field-hint">核对姓名、手机号和所属组织，选择账号后确认绑定。</p>`;
    },350);
  }
  function selectBusinessUser(){
    const scope=lookupScope(),radio=document.querySelector('input[name="businessLookupUser"]:checked');
    const user=radio&&lookupResult?.rows[Number(radio.value)];
    const valid=scope&&lookupResult?.key===scope.key&&user&&user.businessUserId&&user.status==='启用'&&!bindingOwner(user)&&!scope.agent.businessUserId;
    const button=document.getElementById('confirmBusinessBinding');if(button)button.disabled=!valid;
  }
  function confirmBusinessBinding(){
    const scope=lookupScope(),radio=document.querySelector('input[name="businessLookupUser"]:checked');
    const user=radio&&lookupResult?.rows[Number(radio.value)];
    if(!scope||!lookupResult||lookupResult.key!==scope.key||!user||!user.businessUserId)return showToast('查询结果已失效，请重新查询并选择业务账号','warning');
    const current=(CloudCallData.businessUserDirectory||[]).filter(u=>u.businessSystemId===scope.system.businessSystemId&&u.businessUserId===user.businessUserId&&u.tenantId===scope.agent.tenantId);
    if(scope.system.accountQueryStatus!=='可查询'||current.length!==1||current[0].status!=='启用'||current[0].tenantId!==scope.agent.tenantId||current[0].mobile!==scope.mobile||current[0].name!==user.name||current[0].organization!==user.organization){clearLookup();return showToast('业务账号资料已变化，请重新查询','warning');}
    if(scope.agent.businessUserId||bindingOwner(user))return showToast('该平台账号或业务账号已有关联，不能重复绑定','warning');
    const agent=scope.agent;
    // 双方既有主键建立映射，手机号不参与保存后的身份解析；不创建任一方账号。
    CloudCallData.businessAccountBindings.push({businessSystemId:user.businessSystemId,businessUserId:user.businessUserId,accountId:agent.accountId,tenantId:agent.tenantId,instanceId:agent.instanceId,businessUserName:user.name,boundByAccountId:AppState.get().accountId,boundAt:new Date().toLocaleString('zh-CN'),method:'MANUAL_PHONE_LOOKUP'});
    CloudCallRuntime.addAudit('手工关联业务账号',agent.accountId,agent.tenantId,'未关联',user.businessSystemId+' / '+user.businessUserId);
    CloudResourceRules.changed(agent.tenantId);closeBinding();showToast('业务账号已关联','success');navigateTo('tenant-business-systems',{businessSystemId:user.businessSystemId});
  }
  window.BusinessAccountBinding={accounts,reviewAccounts,validate,checkForOutbound,openBinding,closeBinding,bindingAccountChanged,clearLookup,queryBusinessUser,selectBusinessUser,confirmBusinessBinding};
})();
