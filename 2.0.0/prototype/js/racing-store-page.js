(() => {
  'use strict';

  const pageId='PAGE-21026';
  const api=()=>window.DRacingStoreRules;
  const e=value=>DUI.esc(value);
  const copy=value=>structuredClone(value);
  const scopeKey=context=>JSON.stringify([context?.account?.id,context?.scope?.id,
    context?.scope?.tenant?.brandId,context?.scope?.tenant?.enterpriseId]);
  const canManage=context=>Boolean(api()?.canManage(context));
  const canView=context=>canManage(context) || Boolean(DSession.allowed('PAGE-2223',context));
  const categoryOf=(catalog,id)=>catalog?.categories?.find(category=>category.id===id);
  const assignmentOf=(catalog,id)=>catalog?.assignmentRules?.find(rule=>rule.id===id);
  const categoryName=category=>Array.isArray(category?.path)?category.path.join(' / '):category?.path || category?.label || '';
  const assignmentName=(catalog,rule)=>assignmentOf(catalog,rule.assignmentRuleId)?.name || rule.assignmentRuleName || rule.assignmentRuleId || '待绑定分配规则';
  const assignmentOption=rule=>[rule.name,rule.version?'v'+String(rule.version).replace(/^v/,''):'',rule.categoryLabel || rule.categoryId].filter(Boolean).join(' · ');
  const derivedCategory=(catalog,rule)=>{
    const assignment=assignmentOf(catalog,rule.assignmentRuleId);
    return assignment?.categoryLabel || categoryName(categoryOf(catalog,assignment?.categoryId || rule.categoryId)) || assignment?.categoryId || rule.categoryId || '选择分配规则后自动带出';
  };
  const time=value=>{
    const date=new Date(value);return Number.isFinite(date.getTime())?date.toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false}):'—';
  };
  function issuesFor(rule,catalog) {
    if(!rule.assignmentRuleId)return ['待绑定分配规则'];
    const assignment=assignmentOf(catalog,rule.assignmentRuleId);
    if(!assignment)return ['原分配规则已失效或不在当前范围'];
    return [];
  }
  function active(view) {
    return view.root.isConnected && DApp.currentPage()===pageId &&
      scopeKey(DSession.context())===view.scope && canView(DSession.context());
  }
  function readRules() {
    try {return api()?.read(DSession.context()) || {ok:false,error:'赛马门店配置服务暂不可用。'};}
    catch (_) {return {ok:false,error:'赛马门店配置读取失败，原配置未修改。'};}
  }
  function feedback(view,message,isError=false) {
    const node=view.root.querySelector('[data-race-feedback]');if(!node)return;
    node.textContent=message || '';node.hidden=!message;node.classList.toggle('is-error',isError);
  }
  async function load(view) {
    const request=++view.sequence;view.loading=true;view.error='';draw(view);
    const stored=readRules();let catalog;
    try {catalog=await api()?.loadCatalog(DSession.context());}
    catch (_) {catalog={ok:false,error:'分配规则目录读取失败。'};}
    if(!active(view) || request!==view.sequence)return;
    view.loading=false;
    if(!stored.ok || !catalog?.ok){view.error=stored.error || stored.message || catalog?.error || catalog?.message || '配置暂时无法读取。';draw(view);return;}
    view.rules=stored.rules || [];view.revision=stored.revision;view.catalog=catalog;draw(view);
  }
  function accept(view,result,message) {
    if(!result?.ok){feedback(view,result?.error || result?.message || '配置未保存，请重试。',true);return false;}
    view.rules=result.rules || readRules().rules || view.rules;view.revision=result.revision;
    draw(view);DUI.toast(message);return true;
  }
  function draw(view) {
    if(!active(view))return;
    const body=view.root.querySelector('[data-race-body]'),writable=canManage(DSession.context());
    if(view.loading){body.innerHTML='<div class="race-page-state" role="status">正在读取现有分配规则与配置…</div>';return;}
    if(view.error){body.innerHTML='<div class="race-page-state is-error" role="alert"><h2>暂时无法读取赛马门店配置</h2><p>'+e(view.error)+'</p><p>原配置保持不变。</p><button type="button" class="btn" data-race-reload>重新读取</button></div>';body.querySelector('[data-race-reload]').onclick=()=>load(view);return;}
    const filters=view.filters,assignments=view.catalog?.assignmentRules || [];
    const filtered=view.rules.filter(rule=>{
      const issues=issuesFor(rule,view.catalog),status=!rule.assignmentRuleId?'unbound':issues.length?'invalid':rule.enabled?'enabled':'disabled';
      const text=[assignmentName(view.catalog,rule),derivedCategory(view.catalog,rule)].join(' ').toLowerCase();
      return (!filters.assignment || filters.assignment===rule.assignmentRuleId) && (!filters.status || filters.status===status) && (!filters.keyword || text.includes(filters.keyword.toLowerCase()));
    });
    body.innerHTML=`${writable?'':'<p class="race-readonly" role="status">当前账号仅可查看配置，不能维护配置。</p>'}
      <div class="filter-panel race-filters"><label class="field"><span>分配规则</span><select data-race-filter-assignment><option value="">全部分配规则</option>${assignments.map(rule=>`<option value="${e(rule.id)}"${filters.assignment===rule.id?' selected':''}>${e(assignmentOption(rule))}</option>`).join('')}</select></label><label class="field"><span>状态</span><select data-race-filter-status>${[['','全部状态'],['enabled','已启用'],['disabled','已停用'],['unbound','待绑定'],['invalid','待修复']].map(([value,label])=>`<option value="${value}"${filters.status===value?' selected':''}>${label}</option>`).join('')}</select></label><label class="field race-filter-keyword"><span>关键词</span><input data-race-filter-keyword value="${e(filters.keyword)}" maxlength="100" placeholder="分配规则或分类名称"></label><div class="race-inline-actions"><button type="button" class="btn btn-primary" data-race-query>查询</button><button type="button" class="btn" data-race-reset>重置</button></div></div>
      <div class="race-list-toolbar"><span>每条分配规则最多一条配置 · 当前 ${filtered.length} 条</span><div class="race-inline-actions"><button type="button" class="btn" data-race-reload>刷新</button><button type="button" class="btn btn-primary" data-race-create${!writable?' disabled':''}>新建配置</button></div></div><p class="race-feedback" data-race-feedback role="status" hidden></p>
      ${!assignments.length?'<p class="race-readonly">当前没有可关联的分配规则，请先维护现有分配规则，再刷新目录。</p>':''}
      <p class="race-source">排序依据：线索导入时的意向门店（固定）。缺少该值或未命中赛马组时，沿用原门店顺序。</p>
      <div class="table-card"><div class="table-scroll" role="region" aria-label="赛马门店配置列表" tabindex="0"><table class="platform-table race-config-table"><thead><tr><th>分配规则</th><th>二级分类（自动带出）</th><th>状态</th><th>更新时间</th><th>操作</th></tr></thead><tbody>${filtered.length?filtered.map(rule=>{
        const issues=issuesFor(rule,view.catalog);
        return `<tr data-race-rule="${e(rule.id)}"><td><strong>${e(assignmentName(view.catalog,rule))}</strong>${issues.length?'<small class="race-repair">'+e(issues.join('；'))+'</small>':''}</td><td>${e(derivedCategory(view.catalog,rule))}${!rule.assignmentRuleId?'<small>原分类信息，仅供修复参考</small>':''}</td><td><span class="status-badge ${issues.length?'warning':rule.enabled?'success':''}">${!rule.assignmentRuleId?'待绑定':issues.length?'待修复':rule.enabled?'已启用':'已停用'}</span>${issues.length?'<small>原状态：'+(rule.enabled?'启用':'停用')+' · 当前不运行</small>':''}</td><td>${e(time(rule.updatedAt))}</td><td><div class="table-actions"><button type="button" data-race-edit="${e(rule.id)}">${writable?'编辑':'查看'}</button>${writable?`<button type="button" data-race-toggle="${e(rule.id)}"${!rule.enabled && issues.length?' disabled title="请先绑定有效分配规则"':''}>${rule.enabled?'停用':'启用'}</button><button type="button" class="race-delete" data-race-delete="${e(rule.id)}">删除</button>`:''}</div></td></tr>`;
      }).join(''):`<tr><td colspan="5"><div class="race-empty"><h2>${view.rules.length?'没有符合条件的配置':'尚未配置赛马门店优先'}</h2><p>${view.rules.length?'调整分配规则、状态或关键词后重新查询。':'新建配置，选择分配规则并确认启用状态；首次默认为停用。'}</p><p>同分类的不同分配规则独立生效；未启用时沿用原门店顺序。</p></div></td></tr>`}</tbody></table></div></div>`;
    const query=()=>{view.filters={assignment:body.querySelector('[data-race-filter-assignment]').value,status:body.querySelector('[data-race-filter-status]').value,keyword:body.querySelector('[data-race-filter-keyword]').value.trim()};draw(view);};
    body.querySelector('[data-race-query]').onclick=query;
    body.querySelector('[data-race-filter-keyword]').onkeydown=event=>{if(event.key==='Enter'){event.preventDefault();query();}};
    body.querySelector('[data-race-reset]').onclick=()=>{view.filters={assignment:'',status:'',keyword:''};draw(view);};
    body.querySelector('[data-race-reload]').onclick=()=>load(view);
    body.querySelector('[data-race-create]').onclick=()=>{
      const context=DSession.context();
      if(!active(view) || !canManage(context))return;
      if(assignments.length)return openEditor(view);
      DUI.dialog('新建赛马门店配置','<p>当前租户没有可关联的已启用分配规则。请先维护分配规则，再回来新建赛马门店配置。</p>',[
        {label:'关闭',run:close=>close()},...(DSession.allowed('PAGE-21011',context)?[
          {label:'前往分配规则',primary:true,run:close=>{
            if(!active(view) || !canManage(DSession.context()))return;
            close();DApp.openPage('PAGE-21011',{menuEntry:true});
          }}
        ]:[])
      ],{stack:true,dismissible:true});
    };
    body.querySelectorAll('[data-race-edit]').forEach(button=>button.onclick=()=>openEditor(view,view.rules.find(rule=>rule.id===button.dataset.raceEdit)));
    body.querySelectorAll('[data-race-toggle]').forEach(button=>button.onclick=()=>{
      if(!active(view) || !canManage(DSession.context()))return;
      const rule=view.rules.find(item=>item.id===button.dataset.raceToggle);if(!rule)return;
      let result;try {result=api().toggle(DSession.context(),{id:rule.id,enabled:!rule.enabled,expectedRevision:view.revision,catalogRevision:view.catalog.revision});}
      catch (_) {result={ok:false,error:'配置状态未保存，请重试。'};}
      accept(view,result,rule.enabled?'配置已停用。':'配置已启用。');
    });
    body.querySelectorAll('[data-race-delete]').forEach(button=>button.onclick=()=>removeRule(view,view.rules.find(rule=>rule.id===button.dataset.raceDelete)));
  }
  function removeRule(view,rule) {
    if(!rule || !active(view) || !canManage(DSession.context()))return;
    let error;
    const modal=DUI.dialog('删除赛马门店配置',`<p>删除「${e(assignmentName(view.catalog,rule))}」的配置？</p><p>只删除此分配规则的排序配置，基础赛马组、门店和评分保持不变。</p><p class="form-error" role="alert" hidden></p>`,[
      {label:'取消',run:close=>close()},{label:'删除配置',primary:true,run:close=>{
        if(!active(view) || !canManage(DSession.context()))return;
        let result;try {result=api().remove(DSession.context(),{id:rule.id,expectedRevision:view.revision});}
        catch (_) {result={ok:false,error:'删除未保存，请重试。'};}
        if(!result?.ok){error.textContent=result?.error || result?.message || '删除未保存。';error.hidden=false;return;}
        close();accept(view,result,'赛马门店配置已删除。');
      }}],{stack:true,dismissible:true});
    error=modal.element.querySelector('[role="alert"]');
  }

  function openEditor(view,original) {
    if(!active(view))return;
    const readonly=!canManage(DSession.context());if(!original && readonly)return;
    const expectedRevision=view.revision,catalog=view.catalog,assignments=catalog.assignmentRules || [];
    const draft=original?copy(original):{assignmentRuleId:'',enabled:false};
    if(!draft.assignmentRuleId)draft.enabled=false;
    const modal=DUI.dialog((readonly?'查看':original?'编辑':'新建')+'赛马门店配置',`<form class="race-editor" data-race-editor novalidate>
      <p class="race-boundary">仅改变实际选店顺序，候选资格、已选/必选、数量与审核不变。</p>
      ${readonly?'<p class="race-readonly">当前账号仅可查看，不能保存配置。</p>':''}
      <div class="race-editor-grid" data-race-settings>
        <label class="field race-full"><span>分配规则 <b>*</b></span><select name="assignmentRuleId"><option value="">请选择分配规则</option>${draft.assignmentRuleId && !assignmentOf(catalog,draft.assignmentRuleId)?`<option value="${e(draft.assignmentRuleId)}" disabled selected>原分配规则已失效（${e(draft.assignmentRuleId)}）</option>`:''}${assignments.map(assignment=>{
          const occupied=view.rules.some(rule=>rule.id!==draft.id && rule.assignmentRuleId===assignment.id);
          return `<option value="${e(assignment.id)}"${draft.assignmentRuleId===assignment.id?' selected':''}${occupied?' disabled':''}>${e(assignmentOption(assignment))}${occupied?'（已有配置，请编辑原配置）':''}</option>`;
        }).join('')}</select></label>
        <label class="field race-full"><span>二级分类（自动带出）</span><input name="categoryLabel" value="${e(draft.assignmentRuleId || draft.categoryId?derivedCategory(catalog,draft):'')}" readonly placeholder="选择分配规则后自动带出"></label>
        <label class="race-enable"><input type="checkbox" name="enabled"${draft.enabled?' checked':''}>启用本分配规则赛马门店优先</label>
      </div>
      <p class="race-source">排序依据：线索导入时的意向门店（固定）。缺少该值或未命中赛马组时，沿用原门店顺序。</p>
      <p class="race-editor-notice" data-race-notice role="status" hidden></p>
    </form>`,[
      {label:readonly?'关闭':'取消',run:close=>close()},...(!readonly?[{label:'保存配置',primary:true,run:close=>save(close)}]:[])
    ],{stack:true,dismissible:true});
    const dialog=modal.element.querySelector('.d-dialog');dialog.classList.add('race-dialog');
    const form=modal.element.querySelector('[data-race-editor]'),notice=form.querySelector('[data-race-notice]');
    const error=document.createElement('p');error.className='race-editor-error';error.hidden=true;error.setAttribute('role','alert');dialog.querySelector('footer').prepend(error);
    const alive=()=>form.isConnected && active(view);
    const fail=message=>{error.textContent=message;error.hidden=false;};
    function renderSelection() {
      form.elements.categoryLabel.value=draft.assignmentRuleId || draft.categoryId?derivedCategory(catalog,draft):'';
      form.elements.enabled.checked=Boolean(draft.enabled);
      if(readonly)form.querySelectorAll('[data-race-settings] input,[data-race-settings] select').forEach(control=>{control.disabled=true;});
    }
    form.elements.assignmentRuleId.addEventListener('change',()=>{
      if(readonly)return;
      const resetsExistingChoice=Boolean(draft.assignmentRuleId);
      draft.assignmentRuleId=form.elements.assignmentRuleId.value;
      draft.categoryId=assignmentOf(catalog,draft.assignmentRuleId)?.categoryId || '';
      draft.enabled=false;renderSelection();error.hidden=true;
      notice.textContent='分配规则已切换，分类已自动刷新；请确认启用状态。';notice.hidden=!resetsExistingChoice;
    });
    form.elements.enabled.addEventListener('change',()=>{if(readonly)return;draft.enabled=form.elements.enabled.checked;error.hidden=true;});
    function save(close) {
      if(!alive() || !canManage(DSession.context()))return fail('当前账号或使用范围已变化，不能保存。');
      const issues=issuesFor(draft,catalog);if(issues.length)return fail(issues.join('；'));
      if(view.rules.some(rule=>rule.id!==draft.id && rule.assignmentRuleId===draft.assignmentRuleId))return fail('此分配规则已有赛马配置，请编辑原配置，不能重复新建。');
      let result;try {result=api().save(DSession.context(),{rule:{...(draft.id?{id:draft.id}:{}),assignmentRuleId:draft.assignmentRuleId,enabled:draft.enabled},expectedRevision,catalogRevision:catalog.revision});}
      catch (_) {result={ok:false,error:'配置未保存，当前草稿已保留，请重试。'};}
      if(!result?.ok)return fail(result?.error || result?.message || '配置未保存。');close();accept(view,result,'赛马门店配置已保存。');
    }
    form.onsubmit=event=>{event.preventDefault();if(!readonly)modal.buttons.at(-1).click();};
    renderSelection();
    const issues=original?issuesFor(draft,catalog):[];
    if(issues.length){notice.textContent='当前配置'+(!draft.assignmentRuleId?'待绑定分配规则':'待修复')+'：'+issues.join('；')+'。原引用保持，不会自动关联，请明确选择分配规则后重新配置。';notice.hidden=false;}
  }

  if(!DNav.pages.some(page=>page.id===pageId))DNav.pages.push({id:pageId,name:'赛马门店配置',area:'业务&客户',group:'业务配置',route:'',menu:true,module:'public',phoneDomain:'outside'});
  const priorPage=DRolePermissions.page;
  DRolePermissions.page=(id,context,seat)=>id===pageId?canView(context):priorPage(id,context,seat);
  const priorWrite=DRolePermissions.writable;
  DRolePermissions.writable=(id,context,seat)=>id===pageId?canManage(context):priorWrite(id,context,seat);
  window.Pages ||= {};
  Pages[pageId]={
    render:()=>'<section class="platform-page racing-store-page" data-racing-store-page><header class="d-page-heading"><h1>赛马门店配置</h1><p>按分配规则启用赛马门店优先，仅在实际下发选店时调整候选门店的优先顺序。</p></header><div data-race-body><p role="status">正在读取配置…</p></div></section>',
    init(context) {const root=document.querySelector('[data-racing-store-page]');if(!root || !canView(context))return;void load({root,scope:scopeKey(context),sequence:0,loading:false,error:'',catalog:null,rules:[],revision:0,filters:{assignment:'',status:'',keyword:''}});}
  };
})();
