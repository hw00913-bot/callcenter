(() => {
  'use strict';

  const pageId = 'PAGE-2220';
  const catalog = window.DIntegrationApplications;
  const e = DUI.esc;
  const scopeKey = context => JSON.stringify([context?.account?.id,context?.scope?.id]);
  const tabLabels = {dependency:'外部依赖',external:'外部接入'};
  const pageSize = 10;

  function active(view) {
    const context = DSession.context();
    return view.root.isConnected && DApp.currentPage()===pageId && scopeKey(context)===view.scope &&
      catalog.canManage(context);
  }

  function actionButton(label,action,id='',className='btn') {
    return `<button type="button" class="${className}" data-integration-action="${action}" data-id="${e(id)}">${e(label)}</button>`;
  }

  function dateLabel(value) {
    const date = new Date(value || '');
    return Number.isFinite(date.getTime()) ? date.toLocaleString('zh-CN',{hour12:false}) : '—';
  }

  function callbackStatus(row) {
    if (row.shared) return '—';
    if (!row.callbackUrl) return '未配置';
    if (!/^https?:\/\//i.test(row.callbackUrl) || /[\u0000-\u0020\u007f]/.test(row.callbackUrl)) return '地址待修正';
    try {
      const url = new URL(row.callbackUrl);
      return url.hostname && !url.username && !url.password ? '已配置回调地址' : '地址待修正';
    } catch (_) {
      return '地址待修正';
    }
  }

  function draw(view) {
    if (!active(view)) return;
    view.tabs.querySelectorAll('[data-integration-tab]').forEach(button=>{
      const selected = button.dataset.integrationTab===view.tab;
      button.classList.toggle('active',selected);
      button.setAttribute('aria-selected',String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    view.body.setAttribute('aria-labelledby','integration-tab-'+view.tab);
    if (view.tab==='dependency') DExternalDependenciesPage.draw(view);
    else drawExternal(view);
  }

  function drawExternal(view) {
    const state = view.external;
    const {result,mode,id} = state;
    const app = result?.ok && result.data.find(row=>row.applicationId===id);
    if (!result) {
      view.body.innerHTML='<p role="status">正在读取外部接入应用…</p>';
    } else if (!result.ok) {
      view.body.innerHTML=`<div class="platform-alert warning" role="alert">${e(result.reason || result.message)}
        ${actionButton('重新读取','refresh')}</div>`;
    } else if (mode==='detail' && app) {
      view.body.innerHTML=detail(view,app);
    } else if (mode==='create' || mode==='edit' && app?.editable) {
      view.body.innerHTML=editor(view,mode==='edit'?app:null);
    } else {
      view.body.innerHTML=list(view);
    }
  }

  function list(view) {
    const state = view.external;
    const keyword = state.keyword.toLowerCase();
    const rows = state.result.data.filter(row=>[row.name,row.applicationId].some(value=>
      String(value || '').toLowerCase().includes(keyword)));
    rows.sort((a,b)=>String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
    const totalPages = Math.max(1,Math.ceil(rows.length/pageSize));
    state.page=Math.min(state.page,totalPages);
    const start = (state.page-1)*pageSize;
    const canWrite = DSession.canWrite(pageId);
    const dataRows = rows.slice(start,start+pageSize).map(row=>`<tr>
      <td>${actionButton(row.name || row.applicationId,'detail',row.applicationId,'table-link')}</td>
      <td><code>${e(row.applicationId)}</code></td><td>${e(callbackStatus(row))}</td>
      <td>${e(dateLabel(row.createdAt))}</td>
      <td><div class="table-actions">${actionButton('详情','detail',row.applicationId,'btn-link')}${
        canWrite && row.editable ? actionButton('修改','edit',row.applicationId,'btn-link')+
          actionButton('删除','delete',row.applicationId,'btn-link') : ''}</div></td></tr>`).join('');
    return `<form class="filter-panel" data-external-search data-rtl-region="filters">
      <label class="field grow"><span>应用名称 / appId</span><input name="keyword" type="search"
        value="${e(state.keyword)}" placeholder="输入应用名称或 appId"></label>
      <button class="btn btn-primary" type="submit">查询</button>${actionButton('重置','reset')}
    </form>
    <div class="table-card">
      <div class="list-toolbar" data-rtl-region="toolbar"><div class="toolbar-primary">${canWrite ?
        actionButton('新增应用','create','','btn btn-primary') : ''}</div>${actionButton('刷新','refresh')}</div>
      <div class="table-scroll" role="region" tabindex="0" aria-label="外部接入应用">
        <table class="platform-table" data-rtl-region="table"><thead><tr>
          ${['应用名称','appId','结果回传','创建时间','操作'].map(label=>`<th scope="col">${label}</th>`).join('')}
        </tr></thead><tbody>${dataRows || '<tr><td colspan="5"><div class="d-page-empty">暂无符合条件的应用。</div></td></tr>'}</tbody></table>
      </div>
      <div class="d-org-pagination" data-rtl-region="pagination">
        <span>共 ${rows.length} 个应用</span>
        <button class="btn" type="button" data-integration-action="previous" ${state.page===1?'disabled':''}>上一页</button>
        <span>第 ${state.page} / ${totalPages} 页</span>
        <button class="btn" type="button" data-integration-action="next" ${state.page===totalPages?'disabled':''}>下一页</button>
      </div>
    </div>`;
  }

  function editor(view,app) {
    const context = DSession.context();
    const global = catalog.isGlobal(context);
    const audience = app?.authorizedTenantIds || (global ? [] : [context.scope.id]);
    const tenants = catalog.tenants(context);
    const scopeChoices = tenants.map(tenant=>`<label>
      <input name="authorizedTenantIds" type="checkbox" value="${e(tenant.id)}"${audience.includes(tenant.id)?' checked':''}${global?'':' disabled'}>
      ${e(tenant.name)}</label>`).join('');
    const authorizedTenants = scopeChoices || '<span class="field-hint">当前没有可授权的租户。</span>';
    return `<section class="d-access-flow" data-external-view="${app?'edit':'create'}">
      ${actionButton('← 返回应用列表','back','','btn-link')}
      <div class="d-page-heading"><h2>${app?'修改应用':'新增应用'}</h2>${app?'':'<p>保存后生成 appId 和 appSecret。</p>'}</div>
      <form class="table-card d-access-form" data-external-editor>
        <label class="field"><span>应用名称 <b aria-hidden="true">*</b></span>
          <input name="name" value="${e(app?.name || '')}" maxlength="60" required autocomplete="off" placeholder="请输入应用名称">
        </label>
        <fieldset><legend>可访问租户 <b aria-hidden="true">*</b></legend><div class="checkbox-row">${authorizedTenants}</div></fieldset>
        <label class="field"><span>回调地址</span>
          <input name="callbackUrl" type="url" value="${e(app?.callbackUrl || '')}" autocomplete="off" placeholder="https://业务系统地址/回调路径">
          <small class="field-hint">用于回传通话结果和客户业务信息。配置后可通过接口导入客户。</small>
        </label>
        <p role="alert" class="form-error" data-external-error hidden></p>
        <div class="d-access-form-actions">${actionButton('取消','back')}
          <button type="submit" class="btn btn-primary">${app?'保存修改':'创建应用'}</button>
        </div>
      </form>
    </section>`;
  }

  function detail(view,app) {
    const canWrite = DSession.canWrite(pageId) && app.editable;
    const tenants = catalog.tenants(DSession.context());
    const names = app.authorizedTenantIds.map(id=>tenants.find(tenant=>tenant.id===id)?.name || id);
    const revealed = view.external.revealed;
    const secret = app.credentialPlaceholder;
    return `<section class="d-access-flow" data-external-view="detail">
      ${actionButton('← 返回应用列表','back','','btn-link')}
      <div class="d-page-heading"><h2>应用详情</h2></div>
      <div class="table-card d-access-detail">
        <div class="list-toolbar"><h3>${e(app.name || app.applicationId)}</h3>
          ${canWrite ? `<div class="toolbar-primary">${actionButton('修改应用','edit',app.applicationId)}
            ${actionButton('删除应用','delete',app.applicationId)}</div>` : ''}
        </div>
        <dl class="d-org-details">
          <dt>appId</dt><dd class="d-access-credential"><code>${e(app.applicationId)}</code>${actionButton('复制 appId','copy-id')}</dd>
          ${secret && !app.shared ? `<dt>appSecret</dt><dd><div class="d-access-credential">
            <code data-external-secret>${revealed?e(secret):'••••••••••••••••••••'}</code>
            <button class="btn" type="button" data-integration-action="toggle-secret" aria-pressed="${revealed}">${revealed?'隐藏':'显示'}</button>
            ${actionButton('复制 appSecret','copy-secret')}</div><small class="field-hint">本地演示密钥。</small></dd>` : ''}
          <dt>回调地址</dt><dd>${e(app.shared?'—':app.callbackUrl || '未配置')}</dd>
          <dt>可访问租户</dt><dd>${e(names.join('、') || '—')}</dd>
          <dt>创建时间</dt><dd>${e(dateLabel(app.createdAt))}</dd>
        </dl>
      </div>
    </section>`;
  }

  async function openExternal(view,mode,id='') {
    Object.assign(view.external,{mode,id,revealed:false});
    if (mode==='detail') await loadExternal(view);
    else draw(view);
    const focusTarget = view.body.querySelector('[data-external-editor] input[name="name"]') ||
      view.body.querySelector('[data-integration-action="back"]');
    if (active(view) && view.tab==='external') focusTarget?.focus();
  }

  async function loadExternal(view) {
    const state = view.external;
    const request = ++state.request;
    state.result = null;
    draw(view);
    const result = await window.DModuleHost.manageExternalApplications('list');
    if (!active(view) || state.request!==request) return false;
    state.result = result;
    if (view.tab==='external') draw(view);
    return true;
  }

  function formError(form,message) {
    const error = form.querySelector('[data-external-error]');
    error.textContent = message;
    error.hidden = false;
  }

  async function saveExternal(view,form) {
    const state = view.external;
    if (state.busy || !DSession.canWrite(pageId) || !form.reportValidity()) return;
    const data = new FormData(form);
    const editing = state.mode==='edit';
    const name = data.get('name').trim();
    const input = {name,callbackUrl:data.get('callbackUrl').trim(),expectedRevision:state.result.revision};
    if (!name) return formError(form,'请输入应用名称。');
    if (catalog.isGlobal(DSession.context())) {
      input.authorizedTenantIds = data.getAll('authorizedTenantIds');
      if (!input.authorizedTenantIds.length) return formError(form,'请选择至少一个可访问租户。');
    }
    if (editing) input.applicationId = state.id;
    const submit = form.querySelector('[type="submit"]');
    state.busy = true;
    submit.disabled = true;
    const result = await window.DModuleHost.manageExternalApplications(editing?'save':'create',input);
    state.busy = false;
    if (!active(view) || !form.isConnected) return;
    submit.disabled = false;
    if (!result.ok) {
      formError(form,result.reason || result.message || '应用暂未保存。');
      return;
    }
    Object.assign(state,{mode:'detail',id:result.data.applicationId,revealed:false});
    if (await loadExternal(view)) DUI.toast(editing?'应用已修改':'应用已创建，接入密钥已生成。');
  }

  function removeExternal(view,app) {
    const state = view.external;
    const revision = state.result.revision;
    const modal = DUI.dialog('删除应用',`<p>确定删除「${e(app.name)}」？删除后，该应用的接入密钥将无法继续获取 token。</p>
      <p role="alert" class="form-error" hidden></p>`,[
      {label:'取消',run:close=>close()},
      {label:'删除应用',primary:true,run:async (close,button)=>{
        if (!active(view) || view.tab!=='external' || state.busy || !DSession.canWrite(pageId)) return;
        state.busy = true;
        button.disabled = true;
        const result = await window.DModuleHost.manageExternalApplications('delete',{
          applicationId:app.applicationId,expectedRevision:revision
        });
        state.busy = false;
        if (!active(view)) return;
        if (result.ok) {
          close();
          Object.assign(state,{mode:'list',id:'',revealed:false});
          if (await loadExternal(view)) DUI.toast('应用已删除。');
        } else if (button.isConnected) {
          const error = modal.element.querySelector('[role="alert"]');
          error.textContent = result.reason || result.message || '应用暂未删除。';
          error.hidden = false;
          button.disabled = false;
        }
      }}
    ],{dismissible:true,stack:true});
  }

  async function copyCredential(view,app,secret) {
    if (!app || secret && (app.shared || !app.credentialPlaceholder)) return;
    try {
      await navigator.clipboard.writeText(secret?app.credentialPlaceholder:app.applicationId);
      if (active(view)) DUI.toast(secret?'appSecret 已复制。':'appId 已复制。');
    } catch (_) {
      if (active(view)) DUI.toast(secret?'复制失败，请显示 appSecret 后手动复制。':'复制失败，请选中 appId 后手动复制。');
    }
  }

  function externalAction(view,action,id) {
    const state = view.external;
    if (state.busy) return;
    if (action==='refresh') return loadExternal(view);
    if (!state.result?.ok) return;
    if (action==='back') return openExternal(view,'list');
    if (action==='reset') {
      Object.assign(state,{keyword:'',page:1});
      return draw(view);
    }
    if (action==='previous' || action==='next') {
      state.page += action==='next'?1:-1;
      return draw(view);
    }
    const canWrite = DSession.canWrite(pageId);
    if (action==='create' && canWrite) return openExternal(view,'create');
    const app = state.result.data.find(row=>row.applicationId===(id || state.id));
    if (!app) return;
    if (action==='detail') return openExternal(view,'detail',app.applicationId);
    if (action==='edit' && canWrite && app.editable) return openExternal(view,'edit',app.applicationId);
    if (action==='delete' && canWrite && app.editable) return removeExternal(view,app);
    if (state.mode!=='detail') return;
    if (['toggle-secret','copy-secret'].includes(action)) return credentialAction(view,action,app);
    if (action==='copy-id') return copyCredential(view,app,false);
  }

  function showSecret(view,control,secret) {
    view.external.revealed = Boolean(secret);
    control.textContent = secret?'隐藏':'显示';
    control.setAttribute('aria-pressed',String(Boolean(secret)));
    view.body.querySelector('[data-external-secret]').textContent = secret || '••••••••••••••••••••';
  }

  async function credentialAction(view,action,app) {
    if (app.shared || !app.credentialPlaceholder) return;
    const state = view.external;
    const control = view.body.querySelector('[data-integration-action="'+action+'"]');
    if (action==='toggle-secret' && state.revealed) return showSecret(view,control,'');
    control.disabled = true;
    const result = await window.DModuleHost.manageExternalApplications('list');
    if (!active(view) || view.tab!=='external' || !control.isConnected) return;
    control.disabled = false;
    const latest = result.ok && result.data.find(row=>row.applicationId===app.applicationId);
    state.result = result;
    if (!latest?.editable || !latest.credentialPlaceholder) {
      state.revealed = false;
      draw(view);
      DUI.toast(result.reason || '当前账号没有此应用的凭据读取权限。');
    } else if (action==='toggle-secret') {
      showSecret(view,control,latest.credentialPlaceholder);
    } else {
      await copyCredential(view,latest,true);
    }
  }

  function init(context) {
    const root = document.querySelector('[data-integration-applications]');
    const view = {root,scope:scopeKey(context),tab:'dependency',tenantId:context.scope.id,
      tabs:root.querySelector('[role="tablist"]'),body:root.querySelector('[role="tabpanel"]'),
      external:{keyword:'',page:1,mode:'list',id:'',revealed:false,result:null,request:0,busy:false}};
    const switchTab = (tab,focus=false)=>{
      if (view.external.busy || view.tab===tab) return;
      view.tab = tab;
      Object.assign(view.external,{mode:'list',id:'',revealed:false});
      if (tab==='external') loadExternal(view);
      else draw(view);
      if (focus) view.tabs.querySelector('[aria-selected="true"]')?.focus();
    };
    view.tabs.onclick=event=>{
      const button = event.target.closest('[data-integration-tab]');
      if (active(view) && button) switchTab(button.dataset.integrationTab);
    };
    view.tabs.onkeydown=event=>{
      if (!active(view) || !['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
      event.preventDefault();
      switchTab(event.key==='Home'?'dependency':event.key==='End'?'external':
        view.tab==='dependency'?'external':'dependency',true);
    };
    view.body.onchange=event=>{
      if (!active(view) || !event.target.matches('[data-integration-tenant]')) return;
      view.tenantId=event.target.value;
      draw(view);
      view.body.querySelector('[data-integration-tenant]')?.focus();
    };
    view.body.onclick=event=>{
      const target = event.target.closest('[data-integration-action]');
      if (!active(view) || !target) return;
      const {integrationAction:action,id} = target.dataset;
      if (view.tab==='dependency') DExternalDependenciesPage.handleAction(view,action,id);
      else externalAction(view,action,id);
    };
    view.body.onsubmit=event=>{
      if (view.tab!=='external' || !active(view)) return;
      const form = event.target;
      event.preventDefault();
      if (form.matches('[data-external-editor]')) return saveExternal(view,form);
      if (form.matches('[data-external-search]')) {
        Object.assign(view.external,{keyword:form.elements.keyword.value.trim(),page:1});
        draw(view);
      }
    };
    draw(view);
  }

  window.Pages ||= {};
  window.Pages[pageId] = {
    render:()=>'<section class="platform-page" data-integration-applications data-rtl-page-type="list">'+
      '<header class="d-page-heading" data-rtl-region="page-header"><h1>应用接入</h1></header>'+
      '<div class="platform-tabs" role="tablist" aria-label="接入类型">'+Object.entries(tabLabels).map(([key,label])=>
        '<button class="platform-tab" type="button" id="integration-tab-'+key+'" data-integration-tab="'+key+'" role="tab" '+
        'aria-controls="integration-applications-panel">'+e(label)+'</button>').join('')+'</div>'+
      '<div role="tabpanel" id="integration-applications-panel"></div></section>',
    init
  };
})();
