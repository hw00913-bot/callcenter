/* Organization management shares one identity and scope model. */
(function () {
  'use strict';
  const e=DUI.esc, labels={ai:'AI外呼',cloud:'云呼叫',reader:'只读',operator:'运营',admin:'管理员'};
  let filters={},current='',tenantId='',formToken=0;
  const store=()=>DOrganization, val=id=>document.getElementById(id)?.value||'', checked=id=>document.getElementById(id)?.checked===true;
  const fixture=a=>DSeed.demoLogin?.accounts?.[a.id]||{};
  const loginLabel=a=>a.login&&a.login!==a.id?a.login:fixture(a).username||a.login;
  const mobileLabel=a=>a.mobile||fixture(a).mobile||'';
  const roleLabel=m=>DRolePermissions.matrix.roles[DRolePermissions.memberRole(m,store().snapshot().tenants.find(t=>t.id===m.tenantId))]||'历史成员（待调整）';
  const matchesRole=m=>!filters.role||m.role===filters.role||(m.role==='seat'&&filters.role==='operator')||DRolePermissions.memberRole(m,store().snapshot().tenants.find(t=>t.id===m.tenantId))===filters.role;
  const moduleLabel=(m,key)=>(m.modules||[]).includes(key)?'已授权':'未授权';
  const accountType=a=>(DSeed.legacyDemonstrationIds||[]).includes(a.id)||(DSeed.syntheticLegacy?.accounts||[]).some(x=>x.id===a.id)?'历史演示账号':a.platform?.role==='super'?'超级管理员':a.memberships?.length?'租户账号':'未关联租户';
  const globalAdmin=()=>store().globalAdministrator();
  const canProfile=()=>store().permission('account.disable')&&store().permission('member.manage',tenantId);
  function field(text,id,v,extra=''){
    let control='<input id="'+id+'" value="'+e(v??'')+'" '+extra+'>';
    if(/type="password"/.test(extra))control='<span class="d-org-password">'+control+'<button type="button" class="d-org-password-toggle" data-password-toggle="'+id+'" aria-label="显示密码" aria-pressed="false">显示</button></span>';
    const limit=/maxlength="(\d+)"/.exec(extra)?.[1];if(limit&&['account-name','account-mobile','tenant-name'].includes(id))control='<span class="d-org-input-count">'+control+'<small class="d-org-counter" data-count-for="'+id+'">'+String(v||'').length+' / '+limit+'</small></span>';
    return '<label class="field"><span>'+e(text)+'</span>'+control+'</label>';
  }
  function textarea(text,id,v,max){return '<label class="field full"><span>'+e(text)+'</span><textarea id="'+id+'" maxlength="'+max+'">'+e(v||'')+'</textarea>'+(id==='tenant-desc'?'<small class="d-org-counter" data-count-for="'+id+'">'+String(v||'').length+' / '+max+'</small>':'')+'</label>';}
  function bindFormControls(root){
    root.querySelectorAll('[data-password-toggle]').forEach(button=>button.onclick=()=>{const input=root.querySelector('#'+button.dataset.passwordToggle);if(!input||input.disabled)return;const visible=input.type==='password';input.type=visible?'text':'password';button.textContent=visible?'隐藏':'显示';button.setAttribute('aria-label',visible?'隐藏密码':'显示密码');button.setAttribute('aria-pressed',String(visible));});
    root.querySelectorAll('[data-count-for]').forEach(counter=>{const input=root.querySelector('#'+counter.dataset.countFor);if(input)input.addEventListener('input',()=>{counter.textContent=input.value.length+' / '+input.maxLength;});});
  }
  const commercialLabel=t=>({trial:'试用',commercial:'商用'}[t.commercialFlag]||'未记录');
  function updateMetadata(a,m){const records=[a,...(Array.isArray(m)?m:m?[m]:[])].filter(row=>row?.updatedAt&&Number.isFinite(Date.parse(row.updatedAt))).sort((x,y)=>Date.parse(y.updatedAt)-Date.parse(x.updatedAt)),row=records[0];return row?[e(row.updatedBy||'未记录'),e(new Date(row.updatedAt).toLocaleString('zh-CN',{hour12:false}))]:['未记录','未记录'];}
  function seatCells(id){return ['<span data-account-seat-state="'+e(id)+'">待核对</span>','<span data-account-seat-name="'+e(id)+'">待核对</span>'];}
  function select(text,id,options,selected,extra=''){return '<label class="field"><span>'+e(text)+'</span><select id="'+id+'" '+extra+'>'+options.map(([v,n])=>'<option value="'+e(v)+'" '+(String(v)===String(selected)?'selected':'')+'>'+e(n)+'</option>').join('')+'</select></label>';}
  function section(title,html,note=''){return '<section class="d-org-section"><h3>'+e(title)+'</h3>'+(note?'<p class="field-hint">'+e(note)+'</p>':'')+'<div class="form-grid">'+html+'</div></section>';}
  function roleSelect(module,selected,enabled){return select(labels[module]+'使用权限','role-'+module,[['','不授权'+(!enabled?'（租户未开通）':'')],['enabled','允许使用']],selected?'enabled':'',!enabled?'disabled':'');}
  function action(text,kind,id,disabled=false,title='',memberTenant=''){return '<button type="button" class="btn-link" data-org-action="'+kind+'" data-id="'+e(id)+'" '+(memberTenant?'data-member-tenant="'+e(memberTenant)+'" ':'')+(disabled?'disabled':'')+' title="'+e(title)+'">'+e(text)+'</button>';}
  function serviceAction(t){return DSession.allowed('PAGE-2112')?action('AI充值','tenant-service',t.id,!DModuleHost.canService(t.id),!t.enabled?'租户已停用':!DSeed.aiTenantIds[t.id]?'尚未关联AI服务账户':!DModuleHost.canService(t.id)?'不在当前AI充值授权范围':'进入该租户的充值管理'):'';}
  function badge(text,ok){return '<span class="status-badge '+(ok?'success':'')+'">'+e(text)+'</span>';}
  function table(headers,rows){return '<div class="table-card"><div class="table-scroll"><table class="platform-table"><thead><tr>'+headers.map(h=>'<th>'+e(h)+'</th>').join('')+'</tr></thead><tbody>'+(rows.length?rows.map(cells=>'<tr>'+cells.map(v=>'<td>'+v+'</td>').join('')+'</tr>').join(''):'<tr><td colspan="'+headers.length+'"><div class="d-page-empty">当前条件下无可查看记录</div></td></tr>')+'</tbody></table></div></div>';}
  function accountTable(headers,rows){
    const pages=Math.max(1,Math.ceil(rows.length/10)),page=Math.min(pages,Math.max(1,Math.floor(Number(filters.accountPage)||1))),start=(page-1)*10;
    return table(['序号',...headers],rows.slice(start,start+10).map((row,index)=>[String(start+index+1),...row]))+'<nav class="d-org-pagination" aria-label="账号列表分页"><span>第 '+(rows.length?start+1:0)+'–'+Math.min(start+10,rows.length)+' 条 / 共 '+rows.length+' 条</span><button type="button" class="btn" data-org-page="'+(page-1)+'" '+(page===1?'disabled':'')+'>上一页</button><span>'+page+' / '+pages+'</span><button type="button" class="btn" data-org-page="'+(page+1)+'" '+(page===pages?'disabled':'')+'>下一页</button></nav>';
  }
  function brandName(id){const b=store().brands().find(b=>b.id===id);return b?b.name+'（'+b.id+'）':'待补关联';}
  function toolbar(){
    let scope='';
    if(current==='PAGE-2004')scope=select('组织类型','org-kind',[['','全部'],['总部','总部'],['门店','门店']],filters.organization||'');
    const status=current==='PAGE-2005'?'':select(current==='PAGE-2003'?(globalAdmin()&&!tenantId?'账号状态':'成员状态'):'租户状态','org-status',[['','全部'],['enabled','启用'],['disabled','停用']],filters.status||'');
    const roleFilter=current==='PAGE-2003'?select('租户角色','org-role',[['','全部'],...Object.entries(DRolePermissions.matrix.roles).filter(([id])=>globalAdmin()||id!=='super')],filters.role||''):'';
    const placeholder=current==='PAGE-2003'?'账号 / 昵称 / 手机号':current==='PAGE-2004'?'租户名称 / 门店编码':'品牌名称 / 标识';
    let create='';
    if(current==='PAGE-2005'&&store().permission('brand.write'))create=action('新建品牌','brand-new','');
    if(current==='PAGE-2004'&&store().permission('tenant.create'))create=action('新建租户','tenant-new','');
    if(current==='PAGE-2003'&&store().permission('account.create',tenantId))create=action('新增账号 / 关联成员','account-new','',!!tenantId&&!store().tenants().find(t=>t.id===tenantId)?.enabled,'先按手机号核对，已有账号直接加入当前租户');
    return '<div class="filter-panel">'+scope+field('关键词','org-search',filters.search,'placeholder="'+placeholder+'"')+roleFilter+status+'<div class="d-org-filter-actions"><button class="btn btn-primary" id="org-query">查询</button><button class="btn" id="org-reset">重置</button></div></div><div class="list-toolbar"><div class="toolbar-primary d-org-create">'+create+'</div>'+(filters.focusTenantId?'<span class="d-org-focus">已定位关联租户 '+action('查看全部租户','clear-focus','')+'</span>':'')+'</div>';
  }
  function tenantPanel(choices){
    const cards=choices.map(t=>'<button type="button" class="account-tenant-card'+(t.id===tenantId?' active':'')+'" data-org-tenant="'+e(t.id)+'" aria-pressed="'+(t.id===tenantId)+'"><div class="account-tenant-card-header"><span class="account-tenant-name" title="'+e(t.name)+'">'+e(t.name)+'</span><span class="account-tenant-count">'+store().members(t.id).length+' 人</span></div><div class="account-tenant-desc">'+e(t.organization)+' · '+e(store().brands().find(b=>b.id===t.brandId)?.name||'待关联品牌')+'</div><div class="account-tenant-status"><i class="account-tenant-dot '+(t.enabled?'healthy':'')+'" aria-hidden="true"></i>'+e(t.enabled?'启用':'停用')+'</div></button>').join('');
    const all=globalAdmin()?'<button type="button" class="account-tenant-card'+(!tenantId?' active':'')+'" data-org-tenant="" aria-pressed="'+(!tenantId)+'"><div class="account-tenant-card-header"><span class="account-tenant-name">全部账号</span><span class="account-tenant-count">'+store().accounts().length+' 个</span></div><div class="account-tenant-desc">跨租户账号统一管理</div></button>':'';
    return '<aside class="account-tenant-panel" aria-label="租户列表"><div class="account-tenant-panel-title"><strong>租户列表</strong><span>'+choices.length+' 个</span></div>'+all+(cards||'<div class="d-page-empty">暂无可管理租户</div>')+'</aside>';
  }
  function render(id,context,saved){
    current=id;filters=saved||{};formToken++;const choices=store().tenants();tenantId=choices.some(t=>t.id===filters.tenantId)?filters.tenantId:globalAdmin()?'':choices.some(t=>t.id===context.scope.id)?context.scope.id:choices[0]?.id||'';
    const includes=(...names)=>!filters.search||names.some(n=>String(n||'').toLowerCase().includes(filters.search.toLowerCase()));
    const status=enabled=>!filters.status||enabled===(filters.status==='enabled');let rows,content;
    if(id==='PAGE-2005'){
      rows=store().brands().filter(b=>includes(b.name,b.id)).map(b=>{const ts=store().tenants(b.id);return ['<strong>'+e(b.name)+'</strong><div class="table-sub">'+e(b.id)+'</div>',e(ts.filter(t=>t.organization==='总部').map(t=>t.name).join('、')||(globalAdmin()?'尚未创建总部':'当前范围未展示总部')),e(ts.filter(t=>t.organization==='门店').length+' 家门店'),e(b.remark||'—'),'<div class="table-actions">'+action('查看租户（'+ts.length+'）','brand-tenants',b.id)+action('编辑品牌','brand-edit',b.id,!store().permission('brand.write'))+'</div>'];});content=table(['品牌','总部租户','关联门店','备注','操作'],rows);
    }else if(id==='PAGE-2004'){
      rows=choices.filter(t=>(!filters.focusTenantId||t.id===filters.focusTenantId)&&(!filters.organization||t.organization===filters.organization)&&status(t.enabled)&&includes(t.name,t.storeCode)).map(t=>[
        '<strong>'+e(t.name)+'</strong><div class="table-sub">'+e(t.organization)+(t.storeCode?' · '+e(t.storeCode):'')+'</div>',e(brandName(t.brandId)),e(commercialLabel(t)),badge(t.enabled?'启用':'停用',t.enabled),e(t.contact||'—'),'<div class="d-org-module-states">'+badge('AI外呼 · '+(t.modules.ai?'已开通':'未开通'),t.modules.ai)+badge('云呼叫 · '+(t.modules.cloud?'已开通':'未开通'),t.modules.cloud)+'</div>',e(store().members(t.id).length+' 人'),'<div class="table-actions">'+action('查看','tenant-view',t.id)+action('成员账号','tenant-members',t.id,!DSession.allowed('PAGE-2003'))+action('编辑','tenant-edit',t.id,!store().permission('tenant.update',t.id))+action('模块开通','module',t.id,!store().permission('module.open',t.id))+serviceAction(t)+action('删除','tenant-delete',t.id,!store().permission('tenant.delete',t.id)||!!store().deletionReason('tenant',t.id),store().deletionReason('tenant',t.id))+'</div>'
      ]);content=table(['租户名称 / 类型','归属品牌','商用标记','租户状态','联系人','模块开通','成员数','操作'],rows);
    }else if(globalAdmin()&&!tenantId){
      rows=store().accounts().filter(a=>includes(a.name,loginLabel(a),mobileLabel(a))&&status(a.enabled)&&(!filters.role||(filters.role==='super'&&a.platform?.role==='super')||(a.memberships||[]).some(matchesRole))).map(a=>{
        const memberships=a.memberships||[],reason=store().deletionReason('account',a.id,'');
        const names=memberships.map(m=>{const t=choices.find(t=>t.id===m.tenantId);return (t?.name||'租户资料待核')+(m.enabled?'':'（成员停用）');});
        return ['<strong>'+e(a.name)+'</strong><div class="table-sub">'+e(loginLabel(a))+'</div>',e(mobileLabel(a)||'未登记'),badge(a.enabled?'启用':'全局停用',a.enabled),e(accountType(a)),e(names.join('、')||'—'),...updateMetadata(a,memberships),'<div class="table-actions">'+action('详情 / 成员关系','account-view',a.id)+(canProfile()?action('编辑资料','account-edit',a.id,a.builtIn):'')+(store().permission('account.disable')?action(a.enabled?'停用账号':'恢复账号','account-toggle',a.id,a.builtIn):'')+(store().permission('account.delete')?action('删除','account-delete',a.id,!!reason,reason):'')+'</div>'];
      });content=accountTable(['昵称 / 登录账号','手机号','账号状态','账号类型','关联租户','更新人','更新时间','操作'],rows);
    }else{
      rows=store().members(tenantId).filter(({account:a,member:m})=>includes(a.name,loginLabel(a),mobileLabel(a))&&status(m.enabled)&&matchesRole(m)).map(({account:a,member:m})=>{const reason=store().deletionReason('account',a.id,tenantId);return [
        '<strong>'+e(a.name)+'</strong><div class="table-sub">'+e(loginLabel(a))+'</div>',e(mobileLabel(a)||'未登记'),e(roleLabel(m)),badge(a.enabled?'启用':'全局停用',a.enabled),badge(m.enabled?'启用':'本租户停用',m.enabled),e(moduleLabel(m,'ai')),e(moduleLabel(m,'cloud')),...seatCells(a.id),...updateMetadata(a,m),'<div class="table-actions">'+action('详情','account-view',a.id)+(canProfile()?action('编辑资料','account-edit',a.id,a.builtIn):'')+action('成员权限','member-roles',a.id,!store().permission('member.manage',tenantId))+action(m.enabled?'停用成员':'恢复成员','member-toggle',a.id,!store().permission('member.disable',tenantId))+action('关联坐席','seat-link',a.id,!store().permission('seat.link',tenantId)||(DSession.context().scope.kind!=='tenant'||DSession.context().scope.id!==tenantId)||!m.modules.includes('cloud')||!m.enabled||!a.enabled,(DSession.context().scope.kind!=='tenant'||DSession.context().scope.id!==tenantId)?'请先在顶部切换至此业务租户，再维护电话坐席关联':'')+(store().permission('account.disable')?action(a.enabled?'停用账号':'恢复账号','account-toggle',a.id,a.builtIn):'')+(store().permission('account.delete',tenantId)?action('删除','account-delete',a.id,!!reason,reason):'')+'</div>'
      ];});content=accountTable(['昵称 / 登录账号','手机号','租户角色','账号状态','成员状态','AI外呼权限','云呼叫权限','坐席开通','关联坐席','更新人','更新时间','操作'],rows);
    }
    const t=choices.find(t=>t.id===tenantId),contextLine=id==='PAGE-2003'&&t?'<div class="d-org-context"><span>'+e(brandName(t.brandId))+' / <strong>'+e(t.name)+'</strong></span>'+badge(t.enabled?'租户启用':'租户停用',t.enabled)+action('查看租户资料','tenant-view',t.id)+'</div>':'';
    const cloudSummary=id==='PAGE-2004'&&globalAdmin()?'<div id="org-cloud-summary" class="d-org-context" role="status">当前云服务接入：正在读取…</div>':'';
    const body=id==='PAGE-2003'?'<div class="account-main-layout">'+tenantPanel(choices)+'<div class="account-content-panel">'+toolbar()+contextLine+content+'</div></div>':cloudSummary+toolbar()+contextLine+content;
    return '<section class="d-org-page'+(id==='PAGE-2003'?' d-org-accounts':'')+'"><div class="d-page-heading"><h1>'+e(DSession.page(id).name)+'</h1><p>'+e(id==='PAGE-2003'?(globalAdmin()?'统一查看全部账号；左侧租户仅作为本页筛选，不跟随顶部业务租户。':'选择左侧租户，管理该租户关联的账号及使用权限。'):id==='PAGE-2004'?'先维护租户及品牌归属，再开通模块、添加成员并授权。':'一个品牌关联一个总部及多家门店，可继续管理关联租户、成员与模块。')+'</p></div>'+(globalAdmin()?'<p class="d-org-context">全平台管理 · 不随顶部品牌或租户切换过滤。</p>':'')+body+'</section>';
  }
  function bindActions(root){root.querySelectorAll('[data-org-action]').forEach(b=>b.onclick=()=>Promise.resolve(dispatch(b.dataset.orgAction,b.dataset.id,b.dataset.memberTenant)).catch(error=>DUI.toast(error.message)));}
  function form(title,html,submit,options={}){
    const requestId='OP-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),context=DSession.context(),identity=context.account.id+'|'+context.scope.id,originPage=current;
    let pending='',dirty=false,saving=false,dialog;
    async function save(navigation={}){
      if(saving||!dialog.element.isConnected)return false;
      const c=DSession.context();if(identity!==c?.account.id+'|'+c?.scope.id){DUI.toast('使用范围已变化，请重新打开资料。');return false;}
      const node=dialog.element.querySelector('#org-form');if(!pending&&!node.reportValidity())return false;
      saving=true;const button=dialog.buttons[1];button.disabled=true;
      try{
        const result=pending?store().reconcile(pending):await submit(requestId);
        if(result.status==='unknown'){pending=result.requestId;dialog.element.querySelector('#org-form-error').textContent=result.message;node.querySelectorAll('input,select,textarea,button').forEach(n=>n.disabled=true);button.textContent='核对本次结果';return false;}
        if(result.status!=='success')throw Error(result.message||'本次保存尚未确认，请重试。');
        dirty=false;DApp.setDraftGuard(null);dialog.close();DUI.toast(options.success||'已保存');
        try{if(options.onCommitted?.(result.result)===true&&navigation.continueNavigation)DApp.refresh();}catch(error){DUI.toast('资料已保存，工作范围恢复未完成：'+error.message);return false;}
        if(!navigation.continueNavigation){try{if(options.afterSave)options.afterSave(result.result);else DApp.refresh();}catch(error){DUI.toast('资料已保存，页面刷新未完成：'+error.message);}}return true;
      }catch(error){if(dialog.element.isConnected){const errorNode=dialog.element.querySelector('#org-form-error');errorNode.textContent=error.message;errorNode.scrollIntoView({block:'nearest'});}return false;}
      finally{saving=false;if(button.isConnected)button.disabled=false;}
    }
    dialog=DUI.dialog(title,'<form id="org-form" class="d-org-form">'+html+'<p id="org-form-error" role="alert" class="form-error"></p></form>',[{label:'取消',run:close=>{if(saving)return;const finish=()=>{DApp.setDraftGuard(null);close();DApp.openPage(originPage,{initial:true});};if(dirty||pending)return DApp.leave(DSession.page(originPage),finish);finish();}},{label:options.saveLabel||'保存',primary:true,run:()=>save()}],{drawer:options.drawer!==false});
    bindFormControls(dialog.element);
    const node=dialog.element.querySelector('#org-form');['input','change'].forEach(name=>node.addEventListener(name,()=>{dirty=true;}));node.onsubmit=ev=>{ev.preventDefault();save();};
    DApp.setDraftGuard({isDirty:()=>dirty||saving||!!pending,discard:()=>{if(saving||pending)throw Error('本次保存仍在核对，请先确认结果。');dialog.close();},save});
    return {dialog,changed:()=>{dirty=true;}};
  }
  function readDialog(title,html){const d=DUI.dialog(title,html,[{label:'关闭',run:close=>close()}],{drawer:true});bindActions(d.element);return d;}
  function brandForm(id){const b=store().brands().find(b=>b.id===id)||{};form(id?'编辑品牌':'新建品牌',section('品牌资料',(id?field('品牌标识','brand-id',b.id,'readonly'):'')+field('品牌名称 *','brand-name',b.name,'required maxlength="60"')+textarea('备注（选填）','brand-remark',b.remark,500)),req=>store().saveBrand({id,name:val('brand-name'),remark:val('brand-remark')},req),{afterSave:result=>{if(!globalAdmin()&&!id&&DSession.brandChoices().some(b=>b.id===result.id))DSession.selectBrand(result.id);DApp.openPage('PAGE-2005',{pageFilters:{search:''}});DApp.refresh();}});}
  function restoreTenantContext(result){if(!DSession.context()){const row=store().snapshot().tenants.find(t=>t.id===result.id);if(DSession.scopes().some(s=>s.id===result.id))DSession.selectScope(result.id);else if(row)DSession.selectBrand(row.brandId);return true;}return false;}
  async function tenantForm(id,preselectedBrand){
    const context=DSession.context(),key=context.account.id+'|'+context.scope.id,page=DApp.currentPage(),token=++formToken;
    let resources={known:false};if(id||store().canBindResource(id)){try{resources=await DModuleHost.prepareIntegration();}catch(_){}}
    const now=DSession.context();if(key!==now?.account.id+'|'+now?.scope.id||DApp.currentPage()!==page||token!==formToken)return;
    const t=store().snapshot().tenants.find(t=>t.id===id)||{},info=id?store().tenantInfo(id):{codeKnown:true,storeCode:'',hasBusinessData:false};
    const canBind=!id||store().permission('tenant.brand',id),locked=!!(t.brandId&&info.hasBusinessData!==false),disabled=!canBind||locked;
    const canResource=store().canBindResource(id)&&resources.known&&!(t.enterpriseId&&info.hasBusinessData!==false),codeDisabled=!canBind||!info.codeKnown;
    const brands=store().brands(),selectedBrand=t.brandId||preselectedBrand||(brands.length===1?brands[0].id:'');
    const resourceSelect=canResource?'<select id="tenant-enterprise"><option value="" '+(t.enterpriseId?'disabled':'')+'>暂不关联</option>'+resources.value.map(r=>{const occupied=r.tenantIds.some(x=>x!==id)||store().snapshot().tenants.some(x=>x.id!==id&&x.enterpriseId===r.enterpriseId);return '<option value="'+e(r.enterpriseId)+'" '+(r.enterpriseId===t.enterpriseId?'selected':'')+' '+(occupied||r.status!=='RUNNING'?'disabled':'')+'>'+e(r.name)+'（'+e(r.enterpriseId)+(occupied?' · 已关联其他租户':r.status!=='RUNNING'?' · 已停止':'')+'）</option>';}).join('')+'</select>':'<input id="tenant-enterprise" readonly value="'+e(t.enterpriseId||'')+'" placeholder="暂未关联">';
    const basic=field('租户名称 *','tenant-name',t.name,'required maxlength="50"')+field('联系人（选填）','tenant-contact',t.contact,'maxlength="60"')+select('商用标记'+(!id?' *':''),'tenant-commercial',[...(id&&!t.commercialFlag?[['','未记录，请核对']]:[]),['trial','试用'],['commercial','商用']],t.commercialFlag||(!id?'trial':''),store().permission('tenant.create')?(!id?'required':''):'disabled')+select('租户状态','tenant-enabled',[['yes','启用'],['no','停用']],t.enabled===false?'no':'yes',!store().permission('tenant.create')?'disabled':'')+textarea('描述（选填）','tenant-desc',t.desc,50);
    const binding=select('归属品牌 *','tenant-brand',[['','请选择品牌'],...brands.map(b=>[b.id,b.name+'（'+b.id+'）'])],selectedBrand,disabled?'disabled':'required')+select('组织类型 *','tenant-organization',[['总部','总部'],['门店','门店']],t.organization||'总部',disabled?'disabled':'')+'<label class="field" id="tenant-code-field"><span>门店业务编码（选填）</span><input id="tenant-code" maxlength="80" value="'+e(info.storeCode)+'" '+(codeDisabled?'disabled':'')+' placeholder="用于识别客户意向门店"></label>';
    const html=section('基本资料',basic)+section('品牌与组织归属',binding,locked?'已有业务记录或引用待核，品牌及组织类型已锁定；门店编码按原权限维护。':'一个品牌只能有一个总部；同品牌门店业务编码唯一。')+(!brands.length?'<p class="field-hint">暂无可用品牌，请先返回品牌管理新建品牌。</p>':'')+section('云呼叫资源','<label class="field full"><span>AliCti / 云呼叫账号</span>'+resourceSelect+'</label>','关联已有资源后，在“模块开通”中分别开通 AI 外呼或云呼叫；AI 外呼不依赖此账号。')+(!resources.known&&store().canBindResource(id)?'<p class="field-hint">云呼叫账号目录暂未读到，可先保存基础资料，稍后补齐关联。</p>':'')+(!store().canBindResource(id)&&context.scope.kind==='platform'?'<p class="field-hint">云呼叫账号关联需由具有平台资源维护授权的人员办理，可先保存基础资料。</p>':'');
    form(id?'编辑租户资料':'新建租户',html,async req=>{
      const input={id,name:val('tenant-name'),contact:val('tenant-contact'),desc:val('tenant-desc'),...(store().permission('tenant.create')&&val('tenant-commercial')?{commercialFlag:val('tenant-commercial')}:{}),...(store().permission('tenant.create')?{enabled:val('tenant-enabled')==='yes'}:{}),...(id?{expectedStamp:info.stamp}:{}),...(disabled?{}:{brandId:val('tenant-brand'),organization:val('tenant-organization')})};
      if(canResource&&val('tenant-enterprise')!==(t.enterpriseId||''))input.enterpriseId=val('tenant-enterprise');
      if(!codeDisabled&&(val('tenant-code')!==info.storeCode||val('tenant-organization')!==(t.organization||'总部')))Object.assign(input,{storeCode:val('tenant-code'),...(id?{expectedCode:info.storeCode}:{})});
      if(Object.hasOwn(input,'enterpriseId')||Object.hasOwn(input,'storeCode'))await DModuleHost.prepareIntegration();
      if(key!==DSession.context()?.account.id+'|'+DSession.context()?.scope.id)throw Error('使用范围已变化，请重新打开资料。');
      return store().saveTenant(input,req);
    },{success:id?'租户资料已保存':'租户已创建，可继续开通模块和添加成员',onCommitted:restoreTenantContext,afterSave:result=>{DApp.openPage('PAGE-2004',{pageFilters:{search:'',organization:'',status:'',focusTenantId:result.id}});DApp.refresh();}});
    const showCode=()=>{document.getElementById('tenant-code-field').hidden=val('tenant-organization')!=='门店';};showCode();document.getElementById('tenant-organization').addEventListener('change',showCode);
  }
  function memberSettings(m,t){return section('本租户成员身份',select('租户角色 *','member-role',[['operator','租户'+t.organization+'运营'],['admin','租户'+t.organization+'管理员']],m?.role==='admin'?'admin':'operator')+select('成员状态','member-enabled',[['yes','启用'],['no','停用']],m?.enabled===false?'no':'yes'),'只影响「'+t.name+'」的成员关系，其他租户的身份保持独立。')+section('模块使用权限',roleSelect('ai',m?.moduleRoles?.ai,t.modules.ai)+roleSelect('cloud',m?.moduleRoles?.cloud,t.modules.cloud),'租户开通模块后才能授权；两个模块按需授权，具体功能按本租户角色控制。')+'<label class="checkbox-row"><input id="contact-add-right" type="checkbox" '+(m?.contactAdd?'checked':'')+'> 允许人工确认 AI 拒联并新增黑名单</label><p class="field-hint">模块授权不会自动创建或启用电话坐席，电话权限需另行关联已有坐席。</p>';}
  function memberGrants(m,t){const role=val('member-role');return {ai:(t.modules.ai?val('role-ai'):m?.moduleRoles?.ai)?role:'',cloud:(t.modules.cloud?val('role-cloud'):m?.moduleRoles?.cloud)?role:'',publicAdd:checked('contact-add-right'),role,enabled:val('member-enabled')==='yes'};}
  function avatarField(avatar){return '<div class="field full"><span>头像（选填）</span><div class="d-org-avatar"><span id="account-avatar-preview">'+(avatar&&/^data:image\//.test(avatar)?'<img src="'+e(avatar)+'" alt="账号头像">':'暂无头像')+'</span><label class="btn">选择图片<input id="account-avatar" type="file" accept="image/png,image/jpeg,image/webp" hidden></label><button type="button" class="btn" id="account-avatar-clear">移除</button></div><small class="field-hint">支持 PNG、JPEG、WebP，最大 2 MB。</small></div>';}
  function bindAvatar(initial,changed){let avatar=initial||'',pending=false;const input=document.getElementById('account-avatar'),preview=document.getElementById('account-avatar-preview');const draw=()=>{preview.innerHTML=avatar&&/^data:image\//.test(avatar)?'<img src="'+e(avatar)+'" alt="账号头像">':'暂无头像';};input.onchange=async()=>{const file=input.files?.[0];if(!file)return;if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>2*1024*1024){input.value='';DUI.toast('请选择不超过 2 MB 的 PNG、JPEG 或 WebP 图片。');return;}pending=true;try{avatar=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(Error('图片读取失败，请重新选择。'));r.readAsDataURL(file);});if(preview.isConnected){draw();changed();}}catch(error){DUI.toast(error.message);}finally{pending=false;}};document.getElementById('account-avatar-clear').onclick=()=>{avatar='';input.value='';draw();changed();};return ()=>{if(pending)throw Error('图片正在读取，请稍后保存。');return avatar;};}
  function memberForm(id,targetTenantId=tenantId){
    const a=store().snapshot().accounts.find(a=>a.id===id),m=a?.memberships.find(m=>m.tenantId===targetTenantId),t=store().tenants().find(t=>t.id===targetTenantId);if(!t)return;
    if(id)return form('成员权限 · '+a.name,'<div class="d-org-context">'+e(t.name)+'</div>'+memberSettings(m,t),req=>store().setMemberRoles(id,targetTenantId,memberGrants(m,t),req));
    let lookup=null,avatarValue=()=>'';
    const identity=field('登录账号 *','account-login','','required minlength="4" maxlength="32" pattern="[A-Za-z0-9._-]{4,32}" autocomplete="off" placeholder="4–32 位字母、数字或 . _ -"')+field('账号昵称 *','account-name','','required maxlength="20"')+field('初始密码 *','account-password','','type="password" required minlength="8" maxlength="16" autocomplete="new-password"')+'<p class="field-hint">密码为 8–16 位，包含大小写字母、数字和符号。</p>'+avatarField('');
    const html='<div class="d-org-context">添加到 <strong>'+e(t.name)+'</strong></div>'+section('先核对登录手机号',field('手机号 *','account-mobile','','type="tel" required pattern="1[0-9]{10}" maxlength="11" autocomplete="off"')+'<div class="d-org-lookup-action"><button type="button" id="account-lookup" class="btn">查询已有账号</button></div>')+'<p id="account-lookup-message" role="status" class="d-org-lookup-message">输入手机号后查询；已有账号直接关联，无需重复创建。</p><div id="account-identity">'+section('新账号资料',identity)+'</div><label class="checkbox-row" id="account-create-confirm"><input id="explicit-create" type="checkbox"> 确认创建新账号并加入此租户</label>'+memberSettings(null,t);
    const f=form('新增账号 / 关联成员',html,req=>{
      const mobile=val('account-mobile').trim();if(!lookup||lookup.mobile!==mobile)throw Error('请先按当前手机号查询账号，再保存。');
      const fresh=store().lookupAccount(mobile,targetTenantId);if(fresh.status!==lookup.status||fresh.account?.id!==lookup.account?.id)throw Error('账号资料已变化，请重新查询手机号。');
      const roles=memberGrants(null,t),input={roles,role:roles.role,enabled:roles.enabled};
      if(lookup.status==='existing'){if(fresh.member)throw Error('该账号已属于此租户，请返回列表调整成员权限。');return store().linkAccount(targetTenantId,{...input,accountId:lookup.account.id,mobile},req);}
      if(!checked('explicit-create'))throw Error('请勾选确认创建新账号并加入此租户。');
      return store().createAccount(targetTenantId,{...input,name:val('account-name'),login:val('account-login'),mobile,password:val('account-password'),avatar:avatarValue()},req);
    },{saveLabel:'保存并加入租户',success:'账号与租户成员关系已保存',afterSave:()=>{DApp.openPage('PAGE-2003',{pageFilters:{tenantId:targetTenantId,search:'',status:'',role:'',accountPage:1}});DApp.refresh();}});
    avatarValue=bindAvatar('',f.changed);
    const identityBox=document.getElementById('account-identity'),confirm=document.getElementById('account-create-confirm'),message=document.getElementById('account-lookup-message');
    const reset=()=>{lookup=null;identityBox.hidden=false;confirm.hidden=false;identityBox.querySelectorAll('input').forEach(n=>n.disabled=false);message.textContent='手机号已变化，请重新查询账号。';document.getElementById('explicit-create').checked=false;};
    document.getElementById('account-mobile').addEventListener('input',reset);
    document.getElementById('account-lookup').onclick=()=>{try{lookup=store().lookupAccount(val('account-mobile').trim(),targetTenantId);const existing=lookup.status==='existing';identityBox.hidden=existing;confirm.hidden=existing;identityBox.querySelectorAll('input').forEach(n=>n.disabled=existing);document.getElementById('explicit-create').checked=false;message.textContent=existing?(lookup.member?'该账号已属于此租户，请返回列表调整成员权限。':'找到 '+lookup.account.name+'（'+loginLabel(lookup.account)+'），保存后加入此租户，原账号资料保留。'):'该手机号尚未注册，请填写新账号资料并确认创建。';f.changed();}catch(error){lookup=null;message.textContent=error.message;}};
    document.getElementById('account-mobile').onblur=()=>{if(/^1\d{10}$/.test(val('account-mobile').trim()))document.getElementById('account-lookup').onclick();};
  }
  function profileForm(id){const a=store().snapshot().accounts.find(a=>a.id===id);if(!a||!canProfile())throw Error('当前没有账号资料维护权限。');let avatarValue;
    const f=form('编辑账号资料 · '+a.name,section('跨租户共用的账号资料',field('登录账号 *','account-login',loginLabel(a),'required minlength="4" maxlength="32"')+field('账号昵称 *','account-name',a.name,'required maxlength="20"')+field('手机号 *','account-mobile',mobileLabel(a),'type="tel" required pattern="1[0-9]{10}" maxlength="11"')+field('新密码（选填）','account-password','','type="password" minlength="8" maxlength="16" autocomplete="new-password" placeholder="不修改请留空"')+avatarField(a.avatar),'保存后影响此账号在所有租户的登录资料。密码不回显；留空保留原密码。'),req=>store().updateAccount(id,tenantId,{name:val('account-name'),login:val('account-login'),mobile:val('account-mobile'),password:val('account-password'),avatar:avatarValue()},req));avatarValue=bindAvatar(a.avatar,f.changed);
  }
  function details(rows){return '<dl class="d-org-details full">'+rows.map(([k,v])=>'<dt>'+e(k)+'</dt><dd>'+e(v??'未填写')+'</dd>').join('')+'</dl>';}
  function tenantView(id){const t=store().tenants().find(t=>t.id===id);if(!t)throw Error('没有该租户的查看权限。');readDialog('租户详情 · '+t.name,section('租户资料',details([['租户名称',t.name],['归属品牌',brandName(t.brandId)],['组织类型',t.organization],['商用标记',commercialLabel(t)],['联系人',t.contact||'未填写'],['描述',t.desc||'未填写'],['状态',t.enabled?'启用':'停用'],['云呼叫账号',t.enterpriseId||'未关联'],['AI外呼',t.modules.ai?'已开通':'未开通'],['云呼叫',t.modules.cloud?'已开通':'未开通']]))+'<div class="d-org-detail-actions">'+action('管理成员账号（'+store().members(id).length+'）','tenant-members',id,!DSession.allowed('PAGE-2003'))+action('编辑租户资料','tenant-edit',id,!store().permission('tenant.update',id))+action('办理模块开通','module',id,!store().permission('module.open',id))+'</div>');}
  function accountView(id){
    if(globalAdmin()&&!tenantId){
      const a=store().accounts().find(a=>a.id===id);if(!a)throw Error('账号不存在或当前无权查看。');
      const rows=(a.memberships||[]).map(m=>{const t=store().tenants().find(t=>t.id===m.tenantId);return [e(t?.name||'租户资料待核'),e(roleLabel(m)),badge(m.enabled?'启用':'停用',m.enabled),e(moduleLabel(m,'ai')),e(moduleLabel(m,'cloud')),action('成员权限','member-roles',id,!store().permission('member.manage',m.tenantId),'',m.tenantId)];});
      return readDialog('账号详情',section('账号资料',details([['账号昵称',a.name],['登录账号',loginLabel(a)],['手机号',mobileLabel(a)||'未登记'],['账号状态',a.enabled?'启用':'停用'],['账号类型',accountType(a)]]))+section('全部租户成员关系',table(['所属租户','租户角色','成员状态','AI外呼权限','云呼叫权限','操作'],rows))+'<div class="d-org-detail-actions">'+(canProfile()?action('编辑账号资料','account-edit',id,a.builtIn):'')+'</div>');
    }
const row=store().members(tenantId).find(r=>r.account.id===id);if(!row)throw Error('没有该成员的查看权限。');const a=row.account,m=row.member,t=store().tenants().find(t=>t.id===tenantId);readDialog('账号详情',section('账号资料',details([['账号昵称',a.name],['登录账号',loginLabel(a)],['手机号',mobileLabel(a)||'未登记'],['全局状态',a.enabled?'启用':'停用']]))+section('本租户成员关系',details([['所属租户',t.name],['租户角色',roleLabel(m)],['成员状态',m.enabled?'启用':'停用'],['AI外呼权限',moduleLabel(m,'ai')],['云呼叫权限',moduleLabel(m,'cloud')]]))+'<div class="d-org-detail-actions">'+(canProfile()?action('编辑账号资料','account-edit',id,a.builtIn):'')+action('调整本租户权限','member-roles',id,!store().permission('member.manage',tenantId))+'</div>');}
  function moduleForm(id){const t=store().tenants().find(t=>t.id===id);form('模块开通 · '+t.name,section('选择办理模块',select('本次办理模块','module-kind',[['ai','AI外呼'],['cloud','云呼叫']],'ai')+select('目标状态','module-status',[['yes','开通使用'],['no','关闭使用']],t.modules.ai?'yes':'no'))+'<p id="module-current" class="field-hint"></p><p class="field-hint">开通后需在成员账号中分别授予模块使用权限；需进行本人电话作业的成员另行关联坐席。</p>',async req=>{const module=val('module-kind'),enabled=val('module-status')==='yes';if(module==='cloud'&&enabled)await DModuleHost.prepareIntegration();return store().setModule(id,module,enabled,req);});const sync=()=>{const module=val('module-kind');document.getElementById('module-status').value=t.modules[module]?'yes':'no';document.getElementById('module-current').textContent='当前'+labels[module]+(t.modules[module]?'已开通。':'未开通。')+(module==='cloud'&&!t.enterpriseId?'请先在租户资料中关联 AliCti / 云呼叫账号。':'');};document.getElementById('module-kind').onchange=sync;sync();}
  function confirmChange(title,message,fn){form(title,'<p>'+e(message)+'</p>',fn,{drawer:false});}
  function chooseMemberTenant(id){
    const a=id?store().snapshot().accounts.find(a=>a.id===id):null;
    const choices=store().tenants().filter(t=>t.enabled&&store().permission(id?'member.manage':'account.create',t.id)&&(!a||a.memberships.some(m=>m.tenantId===t.id)));
    if(!choices.length)return DUI.toast('暂无可办理此操作的租户。');
    return DUI.dialog(id?'选择成员所属租户':'选择要加入的租户',select('租户','member-target-tenant',choices.map(t=>[t.id,t.name]),choices[0].id),[{label:'取消',run:close=>close()},{label:'继续',primary:true,run:close=>{const target=val('member-target-tenant');if(!choices.some(t=>t.id===target))return;close();memberForm(id,target);}}],{stack:true});
  }
  function dispatch(kind,id,memberTenant){
    try{
      formToken++;
      if(kind==='brand-new'||kind==='brand-edit')return brandForm(id);
      if(kind==='tenant-new'||kind==='tenant-edit')return tenantForm(id);
      if(kind==='tenant-from-brand')return tenantForm('',id);
      if(kind==='tenant-view')return tenantView(id);
      if(kind==='account-view')return accountView(id);
      if(kind==='account-edit')return profileForm(id);
      if(kind==='tenant-members'){document.getElementById('dialog-root').replaceChildren();return DApp.openPage('PAGE-2003',{pageFilters:{tenantId:id,search:'',status:'',role:'',accountPage:1}});}
      if(kind==='tenant-service')return DModuleHost.openService(id);
      if(kind==='account-new'||kind==='member-roles'){const target=memberTenant||tenantId;if(!target&&globalAdmin())return chooseMemberTenant(id);return memberForm(id,target);}
      if(kind==='clear-focus'){DApp.saveFilters({...filters,focusTenantId:''});return DApp.openPage(current,{initial:true});}
      if(kind==='brand-tenants'){const b=store().brands().find(b=>b.id===id);if(!b)throw Error('没有该品牌的查看权限。');return readDialog(b.name+' · 关联租户','<p class="field-hint">'+e(b.id)+' · 仅展示当前权限范围内的租户。</p>'+(store().permission('tenant.create')?'<div class="d-org-detail-actions">'+action('为此品牌新建租户','tenant-from-brand',id)+'</div>':'')+table(['租户名称','类型','状态','操作'],store().tenants(id).map(t=>[e(t.name),e(t.organization),e(t.enabled?'启用':'停用'),'<div class="table-actions">'+action('查看资料','tenant-view',t.id)+action('管理成员','tenant-members',t.id,!DSession.allowed('PAGE-2003'))+'</div>'])));}
      if(kind==='module')return moduleForm(id);
      const a=store().snapshot().accounts.find(a=>a.id===id),m=a?.memberships.find(m=>m.tenantId===tenantId);
      if(kind==='member-toggle')return confirmChange(m.enabled?'停用本租户成员':'恢复本租户成员',a.name+'：仅影响本租户，其他租户授权保持不变。当前已接通电话及必要话后处理可收尾，已受理任务按原规则继续。',req=>store().setEnabled(id,tenantId,!m.enabled,req));
      if(kind==='account-toggle')return confirmChange(a.enabled?'停用整个登录账号':'恢复整个登录账号',a.name+'：影响此账号所有租户。当前已接通电话可收尾，已受理任务按原规则继续。',req=>store().setEnabled(id,null,!a.enabled,req));
      if(kind==='account-delete'||kind==='tenant-delete'){const type=kind==='account-delete'?'account':'tenant';return confirmChange(type==='account'?'删除账号':'删除租户','确认删除此无业务引用对象？提交时再次校验资格，并保留操作记录。',req=>store().remove(type,id,tenantId,req));}
      if(kind==='seat-link')return DModuleHost.openSeatLink(id,tenantId);
    }catch(error){DUI.toast(error.message);}
  }
  function init(){
    const collect=()=>({search:val('org-search').trim(),tenantId,organization:val('org-kind'),status:val('org-status'),role:val('org-role'),accountPage:1});
    document.getElementById('org-query').onclick=()=>{DApp.saveFilters(collect());DApp.openPage(current,{initial:true});};
    document.getElementById('org-search').onkeydown=ev=>{if(ev.key==='Enter'){ev.preventDefault();document.getElementById('org-query').click();}};
    document.getElementById('org-reset').onclick=()=>{DApp.saveFilters({tenantId:globalAdmin()?'':tenantId});DApp.openPage(current,{initial:true});};
    document.querySelectorAll('#app [data-org-tenant]').forEach(button=>button.onclick=()=>{const id=button.dataset.orgTenant;if(id===tenantId||!id&&!globalAdmin()||id&&!store().tenants().some(t=>t.id===id))return;DApp.openPage('PAGE-2003',{pageFilters:{tenantId:id,search:'',status:'',role:'',accountPage:1}});});
    document.querySelectorAll('#app [data-org-page]').forEach(button=>button.onclick=()=>DApp.openPage('PAGE-2003',{pageFilters:{...filters,accountPage:Number(button.dataset.orgPage)}}));
    bindActions(document.getElementById('app'));
    if(current==='PAGE-2004'&&globalAdmin()&&typeof DModuleHost.readCloudTenantSummary==='function'){
      const token=formToken,c=DSession.context(),identity=c.account.id+'|'+c.scope.id,enterprise=c.scope.tenant?.enterpriseId||'';
      Promise.resolve(DModuleHost.readCloudTenantSummary()).then(result=>{const now=DSession.context(),node=document.getElementById('org-cloud-summary');if(!node||current!=='PAGE-2004'||token!==formToken||identity!==now?.account.id+'|'+now?.scope.id||enterprise!==(now?.scope.tenant?.enterpriseId||''))return;const valid=result?.known===true&&result.enterpriseId===enterprise&&['total','enabled','disabled','headquarters','stores'].every(k=>Number.isSafeInteger(result[k])&&result[k]>=0);node.textContent=valid?'当前云服务接入：'+(result.enterpriseName||result.enterpriseId)+' · 共 '+result.total+' 个租户（启用 '+result.enabled+'、停用 '+result.disabled+'；总部 '+result.headquarters+'、门店 '+result.stores+'）':'当前云服务接入：'+(result?.message||'暂未就绪，请稍后重新读取。');}).catch(()=>{const now=DSession.context(),node=document.getElementById('org-cloud-summary');if(node&&current==='PAGE-2004'&&token===formToken&&identity===now?.account.id+'|'+now?.scope.id)node.textContent='当前云服务接入：暂未就绪，请稍后重新读取。';});
    }
    if(current==='PAGE-2003'&&tenantId&&typeof DModuleHost.readAccountSeatSummaries==='function'){
      const target=tenantId,enterprise=store().tenants().find(t=>t.id===tenantId)?.enterpriseId||'',token=formToken,c=DSession.context(),identity=c.account.id+'|'+c.scope.id,ids=[...document.querySelectorAll('#app [data-account-seat-state]')].map(n=>n.dataset.accountSeatState);
      Promise.resolve(DModuleHost.readAccountSeatSummaries(target,ids)).then(result=>{const now=DSession.context();if(current!=='PAGE-2003'||tenantId!==target||store().tenants().find(t=>t.id===target)?.enterpriseId!==enterprise||token!==formToken||identity!==now?.account.id+'|'+now?.scope.id)return;for(const id of ids){const matches=result?.known===true?(result.rows||[]).filter(r=>r.accountId===id&&r.tenantId===target&&r.enterpriseId===enterprise):[],row=matches.length===1?matches[0]:null;const state=row&&typeof row.opened==='boolean'?(row.opened?'已开通'+(row.state?' · '+row.state:''):'未开通'):'待核对',name=row?.opened===true?row.seatName||'名称待核':row?.opened===false?'未关联':'待核对';document.querySelectorAll('#app [data-account-seat-state]').forEach(n=>{if(n.dataset.accountSeatState===id)n.textContent=state;});document.querySelectorAll('#app [data-account-seat-name]').forEach(n=>{if(n.dataset.accountSeatName===id)n.textContent=name;});}}).catch(()=>{});
    }
  }
  ['PAGE-2003','PAGE-2004','PAGE-2005'].forEach(id=>{window.Pages=window.Pages||{};Pages[id]={render:(context,saved)=>render(id,context,saved),init};});
})();
