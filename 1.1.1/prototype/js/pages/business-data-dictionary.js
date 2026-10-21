/** 取数接口字典，可独立显示或作为业务配置的第三个页签。 */
(function (root) {
  'use strict';
  const ui = root.PlatformUI, model = root.BusinessData, esc = ui.escape;
  const layerId = 'business-data-editor';
  const referenceLayerId='business-data-references',deleteLayerId='business-data-delete-confirm';
  const command = (name,...args) => esc("window.Pages['business-data-dictionary']."+name+'('+args.map(value=>JSON.stringify(value)).join(',')+')');
  const contextKey = () => { const state=root.AppState?.get?.()||{};return JSON.stringify([model.context?.()||[state.accountId,state.sessionId,state.enterpriseId,state.tenantId,state.activeDomain],embedded,usageScope]); };
  let context = '', keyword = '', status = '', page = 1, editor = null;
  let embedded=false,usageScope=null,intent=0;
  const pageSize = 10;
  const allowed = () => model.canManage() && context === contextKey();
  const notify = (message,tone) => root.showToast?.(message,tone);
  function denied() {
    return '<section class="platform-page"><div class="route-denied"><div class="denied-mark">!</div><h1>当前身份无权访问</h1><p>仅超级管理员可维护取数接口字典。</p><button class="btn btn-primary" onclick="navigateTo(\'home\')">返回工作台</button></div></section>';
  }
  function refresh() { if(root.RouteRuntime?.refreshCurrent)return root.RouteRuntime.refreshCurrent();return root.navigateTo?.('business-data-dictionary'); }
  function tenantText(ids) {
    if (!ids.length) return '未授权租户';
    const tenants = model.tenants();
    return ids.map(id=>tenants.find(row=>row.tenantId===id)?.name||id).join('、');
  }
  function render(options={}) {
    embedded=options.embedded===true;usageScope=options.scope?{enterpriseId:options.scope.enterpriseId,tenantId:options.scope.tenantId}:null;
    if (!model.canManage()) return denied();
    if (context !== contextKey()) { context=contextKey();keyword='';status='';page=1;editor=null;intent++;ui.closeLayer(layerId);ui.closeLayer(referenceLayerId);ui.closeLayer(deleteLayerId); }
    const data = model.entries();
    const filtered = data.filter(row=>(!keyword || row.name.toLocaleLowerCase().includes(keyword.toLocaleLowerCase())) && (!status || row.enabled === (status==='enabled')));
    page=Math.max(1,Math.min(page,Math.ceil(filtered.length/pageSize)||1));
    const visible=filtered.slice((page-1)*pageSize,page*pageSize),reviews=new Map(visible.map(row=>[row.id,model.usage(row.id,usageScope)]));
    return '<section class="'+(embedded?'business-data-page':'platform-page business-data-page')+'" data-page-id="PAGE-006"'+(embedded?' data-business-data-embedded':'')+'>'+
      (embedded?'':ui.pageHeader('取数接口字典','统一维护可供字段选择的取数接口，并设置可用租户。'))+
      '<form class="filter-panel" onsubmit="event.preventDefault();'+command('query')+'"><label class="field grow"><span>接口名称</span><input id="business-data-keyword" value="'+esc(keyword)+'" placeholder="输入接口名称"></label><label class="field"><span>状态</span><select id="business-data-status"><option value="">全部状态</option><option value="enabled"'+(status==='enabled'?' selected':'')+'>启用</option><option value="disabled"'+(status==='disabled'?' selected':'')+'>停用</option></select></label><div class="filter-actions"><button class="btn" type="button" onclick="'+command('reset')+'">重置</button><button class="btn btn-primary" type="submit">查询</button></div></form>'+
      (model.error?'<p class="form-error" role="alert">'+esc(model.error)+'</p>':'')+
      '<div class="management-list-shell">'+ui.toolbar('<button class="btn btn-primary" type="button" onclick="'+command('open')+'">新增接口</button>','<button class="btn" type="button" onclick="'+command('refresh')+'">刷新</button>')+
      ui.table([
        {key:'name',label:'接口名称',render:value=>'<strong>'+esc(value)+'</strong>'},
        {key:'capabilityId',label:'取数能力',render:value=>esc(model.capability(value)?.label||'未知能力')},
        {key:'tenantIds',label:'可用租户',className:'business-data-tenants-cell',render:value=>esc(tenantText(value))},
        {key:'enabled',label:'状态',width:'110px',render:value=>ui.status(value?'启用':'停用')},
        {key:'id',label:'使用情况',width:'150px',render:id=>{const checked=reviews.get(id),label=!checked?.ok?'使用关系待核对':checked.refs.length?'已被 '+checked.refs.length+' 处使用':'未被使用';return '<button class="btn-link" type="button" onclick="'+command('references',id)+'">'+esc(label)+'</button>';}},
        {key:'id',label:'操作',width:'280px',render:(id,row)=>'<div class="table-actions"><button class="btn-link" type="button" onclick="'+command('open',id)+'">编辑</button><button class="btn-link" type="button" onclick="'+command('open',id,'tenants')+'">租户授权</button><button class="btn-link" type="button" onclick="'+command('toggle',id)+'">'+(row.enabled?'停用':'启用')+'</button><button class="btn-link business-delete-action" type="button" title="'+esc(reviews.get(id)?.canDelete?'删除未使用接口':'查看不能删除的原因')+'" onclick="'+command('remove',id)+'">删除</button></div>'}
      ],visible,{emptyText:keyword||status?'暂无符合条件的接口':'暂无取数接口',emptyDetail:'可新增接口，选择已接入的取数能力。'})+
      ui.pagination(filtered.length,page,pageSize,"window.Pages['business-data-dictionary'].setPage")+'</div></section>';
  }
  function tenantChoices(selected) {
    return model.tenants().map(row=>'<label class="business-data-check"><input type="checkbox" name="businessDataTenant" value="'+esc(row.tenantId)+'"'+(selected.includes(row.tenantId)?' checked':'')+'><span>'+esc(row.name)+'</span></label>').join('');
  }
  function open(id, section) {
    if (!allowed()) return notify('身份或工作范围已变化，请刷新后操作','warning');
    intent++;
    const row=id?model.entry(id):null;
    if(id&&!row)return notify('接口条目不存在，请刷新后重试','warning');
    const review=id?model.capabilityEditReview(id,usageScope):null, current=row||{name:'',capabilityId:'series',tenantIds:[],enabled:true};
    editor={id:id||'',context:contextKey(),original:JSON.stringify(row),section:section||''};
    const capabilityLocked=!!id&&(!review?.ok||!review.canDelete);
    ui.openLayer(layerId,'<div class="layer-header"><div><h2>'+(id?'编辑取数接口':'新增取数接口')+'</h2></div><button aria-label="关闭" onclick="'+command('close')+'">×</button></div><div class="layer-body"><form id="business-data-form" class="business-data-form" onsubmit="event.preventDefault();'+command('save')+'">'+
      '<label class="field"><span>接口名称 <b class="business-data-required">*</b></span><input id="business-data-name" maxlength="60" required value="'+esc(current.name)+'" placeholder="例如：意向车系"><small class="field-hint">最多60字，全局不重名，英文不区分大小写；请使用运营能识别的业务名称。</small></label>'+
      '<label class="field"><span>取数能力 <b class="business-data-required">*</b></span><select id="business-data-capability"'+(capabilityLocked?' disabled':'')+'>'+model.capabilities.map(cap=>'<option value="'+esc(cap.id)+'"'+(cap.id===current.capabilityId?' selected':'')+'>'+esc(cap.label)+'</option>').join('')+'</select><small class="field-hint">'+(capabilityLocked?(!review?.ok?'使用关系暂时无法核对，当前不能更换取数能力。':'已被字段或业务资料引用，取数能力固定；更换来源请新增接口。'):(id?'当前未被使用，可以更换取数能力；保存时会再次核对引用。':'选择研发已接入的能力，无需填写接口技术参数；同一能力可建立多个不同名称的条目。'))+'</small></label>'+
      '<fieldset class="business-data-tenant-field"><legend>可用租户</legend><div class="business-data-tenant-options">'+tenantChoices(current.tenantIds)+'</div><p class="field-hint">勾选允许使用此接口的租户；未勾选的租户不能查询或选择新数据。</p></fieldset>'+
      '<label class="field"><span>状态</span><select id="business-data-enabled"><option value="true"'+(current.enabled?' selected':'')+'>启用</option><option value="false"'+(!current.enabled?' selected':'')+'>停用</option></select></label>'+
      '<p id="business-data-form-error" class="form-error" role="alert" aria-live="polite"></p></form></div><div class="layer-footer"><button class="btn" type="button" onclick="'+command('close')+'">取消</button><button class="btn btn-primary" type="submit" form="business-data-form">保存</button></div>','small');
    if(section==='tenants') root.document.querySelector('#'+layerId+' input[name="businessDataTenant"]')?.focus();
  }
  function close() { intent++;editor=null;ui.closeLayer(layerId); }
  function references(id) {
    if(!allowed())return notify('身份或工作范围已变化，请刷新后操作','warning');
    const row=model.entry(id);if(!row)return notify('接口条目不存在，请刷新后核对','warning');
    intent++;const checked=model.usage(id,usageScope),tenants=root.CloudCallData?.tenants||[];
    const items=checked.refs.map(ref=>{const tenant=tenants.find(value=>value.enterpriseId===ref.enterpriseId&&value.tenantId===ref.tenantId);return '<li><strong>'+esc(tenant?.name||ref.tenantId)+'</strong><p>'+esc(ref.message)+'</p><small>'+esc([ref.categoryLabel,ref.fieldLabel,ref.callId||ref.objectId,ref.sourceLabel].filter(Boolean).join(' · '))+'</small></li>';}).join('');
    ui.openLayer(referenceLayerId,'<div class="layer-header"><div><h2>接口使用情况 · '+esc(row.name)+'</h2><p>'+esc(checked.reason)+'</p></div><button type="button" aria-label="关闭使用情况" onclick="PlatformUI.closeLayer(\''+referenceLayerId+'\')">×</button></div><div class="layer-body">'+(items?'<ul>'+items+'</ul>':'<p>'+esc(checked.ok?'当前未发现配置引用或业务使用。':'资料暂时无法完整核对，请保留原记录并重试。')+'</p>')+'</div><div class="layer-footer"><button type="button" class="btn" onclick="PlatformUI.closeLayer(\''+referenceLayerId+'\')">关闭</button></div>','large');return checked;
  }
  function remove(id) {
    if(!allowed())return notify('身份或工作范围已变化，请刷新后操作','warning');
    const row=model.entry(id),state=model.catalogState();if(!row||!state.ok)return notify(state.message||'接口条目已变化，请刷新后核对','warning');
    const checked=model.usage(id,usageScope);if(!checked.ok||!checked.canDelete)return references(id);
    const captured={context:contextKey(),scope:usageScope?{...usageScope}:null,row:JSON.stringify(row),revision:state.revision,modelContext:state.context,token:checked.token,intent:++intent,pageOwner:root.document.querySelector('.business-data-page')};let owner;
    ui.confirm({id:deleteLayerId,title:'删除取数接口',body:'<p>确定删除“'+esc(row.name)+'”？</p><p>当前未发现配置引用或业务使用。确认时会再次核对。</p>',confirmText:'删除接口',danger:true,onConfirm(){
      if(!allowed()||captured.context!==contextKey()||captured.intent!==intent||!captured.pageOwner?.isConnected||root.document.querySelector('.business-data-page')!==captured.pageOwner||!owner?.isConnected||root.document.getElementById(deleteLayerId)!==owner||JSON.stringify(model.entry(id))!==captured.row){notify('身份、接口或当前页面已变化，请重新核对后操作','warning');return false;}
      const fresh=root.BusinessConfigurationUsage?.verifyFresh?.(captured.token);if(!fresh?.ok||!fresh.canDelete){notify(fresh?.reason||'使用关系暂时无法核对','warning');return false;}
      const result=model.remove(id,{scope:captured.scope,expectedContext:captured.modelContext,expectedRevision:captured.revision,expectedUsageFingerprint:captured.token.fingerprint});
      if(!result.ok){notify(result.message,'warning');return false;}intent++;refresh();notify(result.message,'success');return true;
    }});owner=root.document.getElementById(deleteLayerId);return true;
  }
  function formError(message) { const target=root.document.getElementById('business-data-form-error');if(target)target.textContent=message;return false; }
  function save() {
    if(!allowed()||!editor||editor.context!==contextKey()) return formError('身份或工作范围已变化，请重新打开接口配置');
    const form=root.document.getElementById('business-data-form');
    if(!form?.reportValidity()) return false;
    if(editor.id && JSON.stringify(model.entry(editor.id))!==editor.original)return formError('接口配置已更新，请关闭后重新编辑');
    const input={name:root.document.getElementById('business-data-name').value.trim(),capabilityId:root.document.getElementById('business-data-capability').value,
      tenantIds:Array.from(form.querySelectorAll('input[name="businessDataTenant"]:checked')).map(node=>node.value),enabled:root.document.getElementById('business-data-enabled').value==='true'};
    const result=editor.id?model.update(editor.id,input,{scope:usageScope}):model.create(input);
    if(!result.ok)return formError(result.message);
    close();refresh();notify(result.message+'；已授权租户可在“业务分类 → 自定义字段”选择此接口。','success');return result;
  }
  function toggle(id) {
    if(!allowed())return false;
    const row=model.entry(id);if(!row)return false;
    const originalContext=contextKey(), original=JSON.stringify(row), enable=!row.enabled;
    ui.confirm({id:'business-data-state-confirm',title:(enable?'启用':'停用')+'接口',body:'<p>确定'+(enable?'启用':'停用')+'“'+esc(row.name)+'”？</p><p>'+(enable?'重新启用后，之前未提交的选择需重新查询并确认。':'停用后，未提交的选择保留显示，但暂停作为有效值；已保存的历史记录保留。')+'</p>',confirmText:enable?'启用接口':'停用接口',danger:!enable,onConfirm(){
      if(!allowed()||originalContext!==contextKey()||JSON.stringify(model.entry(id))!==original){notify('身份或接口配置已变化，请刷新后操作','warning');return false;}
      const result=model.setEnabled(id,enable);if(!result.ok){notify(result.message,'warning');return false;}refresh();notify(enable?'接口已启用':'接口已停用','success');return true;
    }});return true;
  }
  function query() {if(!allowed())return;keyword=root.document.getElementById('business-data-keyword')?.value.trim()||'';status=root.document.getElementById('business-data-status')?.value||'';page=1;refresh();}
  function reset() {if(!allowed())return;keyword='';status='';page=1;refresh();}
  function setPage(value) {if(!allowed())return;page=Math.max(1,Number(value)||1);refresh();}
  root.Pages=root.Pages||{};
  root.Pages['business-data-dictionary']={render,init(){},open,close,save,toggle,remove,references,query,reset,setPage,refresh};
})(window);
