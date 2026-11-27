(() => {
  'use strict';

  const catalog = window.DIntegrationApplications;
  const scenarios = ['预评分','优秀话术'];
  const identity = context => JSON.stringify([context?.account?.id,context?.scope?.id,context?.scope?.tenant?.brandId]);
  const e = value => window.DUI.esc(value ?? '');
  const option = (value,label,selected,disabled = false) => '<option value="'+e(value)+'"'+
    (value===selected?' selected':'')+(disabled?' disabled':'')+'>'+e(label)+'</option>';
  let opened = null;

  function canOpenCategory(categoryId,brandId) {
    const context = window.DSession.context();
    return Boolean(categoryId && context?.scope?.kind==='tenant' && context.scope.tenant?.enabled===true &&
      context.scope.tenant.brandId===brandId &&
      window.DSession.allowed('PAGE-2006',context));
  }

  function openCategory(categoryId,{brandId,trigger} = {}) {
    if (window.DApp.currentPage()!=='PAGE-2006' || !canOpenCategory(categoryId,brandId) || opened?.modal.element.isConnected) return false;
    const context = window.DSession.context(), initialIdentity = identity(context);
    const category = window.DSkynetConfig?.businessType(context,categoryId);
    if (!category) { window.DUI.toast('当前分类已停用或不可用，请刷新后核对。'); return false; }
    let saveAction = () => false;
    const modal = window.DUI.dialog('场景应用 · '+category.label,
      '<section class="dependency-scenario-settings" data-dependency-scenario-settings></section>',[
        {label:'关闭',run:() => requestClose()},
        {label:'保存关联',primary:true,run:() => saveAction()}
      ],{stack:true,dismissible:true});
    modal.buttons[1].dataset.dependencyScenarioSave='';
    modal.buttons[1].hidden=true;
    modal.element.querySelector('.d-dialog').classList.add('dependency-scenario-dialog');
    const section = modal.element.querySelector('[data-dependency-scenario-settings]');
    const view = {modal};
    opened = view;
    let original = null, form = null;
    const active = () => opened===view && modal.element.isConnected && window.DApp.currentPage()==='PAGE-2006' && identity(window.DSession.context())===initialIdentity &&
      canOpenCategory(categoryId,brandId) && Boolean(window.DSkynetConfig?.businessType(window.DSession.context(),categoryId));
    const values = () => form ? Object.fromEntries(scenarios.map(scenario=>[scenario,form.elements.namedItem(scenario).value])) : null;
    const dirty = () => Boolean(original && form && JSON.stringify(values())!==JSON.stringify(original));
    function close() {
      modal.close();
      if (opened===view) { opened=null;window.DApp.setDraftGuard(null); }
      observer.disconnect();
      if (trigger?.isConnected && window.DApp.currentPage()==='PAGE-2006') trigger.focus({preventScroll:true});
    }
    function requestClose() {
      if (!active() || !dirty()) return close();
      window.DUI.dialog('关联尚未保存','<p>关闭后将放弃本次场景应用选择。</p>',[
        {label:'继续配置',run:done=>done()},
        {label:'放弃修改',run:done=>{done();close();}}
      ],{stack:true,dismissible:true});
    }
    const observer = new MutationObserver(()=>{if (!active()) close();});
    observer.observe(document.getElementById('workspace'),{childList:true,subtree:true});
    function draw() {
      if (!active()) return close();
      saveAction=()=>false;
      modal.buttons[1].hidden=true;
      let stored, directories;
      try {
        stored = catalog.scenarioBindings(context,categoryId);
        directories = Object.fromEntries(scenarios.map(scenario=>[scenario,catalog.scenarioApplications(context,scenario)]));
      } catch (_) { /* Preserve existing bindings if their directory is unavailable. */ }
      const heading = '<div class="dependency-scenario-context"><p>业务分类：<strong>'+e(category.label)+'</strong></p>'+
        '<p>当前租户：'+e(context.scope.tenant.name || context.scope.id)+'</p></div>'+
        '<p class="field-hint">为当前分类选择预评分和优秀话术来源。培育预评级与坐席智能预评共用已保存的预评分应用。</p>';
      if (!stored?.ok || scenarios.some(scenario=>!directories?.[scenario]?.ok)) {
        section.innerHTML = heading+'<p class="form-error" role="alert">'+e(stored?.message || scenarios.map(s=>directories?.[s]?.message).find(Boolean) ||
          '分类关联或应用目录暂不可读取，请重新打开。')+'</p>';
        form=null;original=null;
        return;
      }
      const writable = catalog.canWriteScenarioBindings(context,context.scope.id);
      modal.buttons[1].hidden=!writable;
      section.innerHTML = heading+'<form data-dependency-scenario-form><div class="dependency-scenario-grid">'+scenarios.map(scenario=>{
        const saved = stored.bindings?.[scenario], rows = directories[scenario].rows || [], selected = saved?.id || '';
        const found = rows.find(row=>row.id===selected);
        const valid = !saved || found && found.revision===saved.revision && found.connectionKey===saved.connectionKey;
        const options = option('','暂不关联',selected)+rows.map(row=>option(row.id,row.name+' · '+row.interfaceName,selected)).join('')+
          (selected && !found ? option(selected,(saved.name || selected)+'（已失效）',selected,true) : '');
        return '<label class="field"><span>'+e(scenario)+'应用</span><select name="'+e(scenario)+'"'+(writable?'':' disabled')+'>'+options+'</select>'+
          '<small class="field-hint" data-dependency-scenario-state="'+e(scenario)+'">'+e(saved ? valid ? '已保存 · '+(found?.name || saved.name) :
            '已绑定应用或版本失效，请核对应用配置并重新保存关联。' : rows.length ? '尚未关联。选择应用后保存，供当前分类使用。' :
            '暂无可用应用，请在应用接入的外部依赖中登记对应场景的完整接口。')+'</small></label>';
      }).join('')+'</div><p class="form-error" role="alert" hidden></p><div class="dependency-scenario-actions">'+
        (writable?'':'<span class="field-hint">当前账号只读。</span>')+
        '<span class="field-hint" data-dependency-scenario-feedback>关联仅对上方显示的分类和租户生效。</span></div></form>';
      form = section.querySelector('form');
      original = values();
      form.onchange = () => { form.querySelector('[data-dependency-scenario-feedback]').textContent = dirty() ? '关联有未保存修改。' : '当前选择与已保存关联一致。'; };
      const save = (closeAfterSave = false) => {
        if (!active() || !catalog.canWriteScenarioBindings(window.DSession.context(),context.scope.id)) return false;
        const alert = form.querySelector('[role="alert"]');alert.hidden=true;
        let result;
        try { result = catalog.saveScenarioBindings(window.DSession.context(),{tenantId:context.scope.id,categoryId,
          expected:stored.revision,bindings:values()}); } catch (_) { /* Report failed writes without claiming success. */ }
        if (!result?.ok) { alert.textContent=result?.message || '关联未保存，请重新读取后重试。';alert.hidden=false;return false; }
        window.DUI.toast('当前分类的场景应用关联已保存');
        if (closeAfterSave) close(); else draw();
        return true;
      };
      saveAction=save;
      form.onsubmit=event=>{event.preventDefault();save();};
      window.DApp.setDraftGuard({isDirty:()=>active()&&dirty(),discard:close,save:()=>save(true)});
      section.querySelector('select')?.focus();
    }
    draw();
    return true;
  }

  function adapt(html) {
    const replace = (before,after) => {
      const at=html.indexOf(before);
      if(at<0 || html.indexOf(before,at+before.length)>=0) throw Error('业务分类场景应用入口无法定位。');
      html=html.slice(0,at)+after+html.slice(at+before.length);
    };
    replace('  function rowActions(kind,row,data) {', `  function categoryScenarioAction(row) {
    const scope=currentScope(), bridge=parent.DDependencyScenarioSettings;
    if(scope.legacy || row.enabled===false || !bridge?.canOpenCategory(row.id,scope.brandId)) return '';
    return '<button type="button" data-category-scenario="'+esc(row.id)+'" data-brand-id="'+esc(scope.brandId)+
      '" onclick="parent.DDependencyScenarioSettings.openCategory(this.dataset.categoryScenario,{brandId:this.dataset.brandId,trigger:this})">场景应用</button>';
  }
  function rowActions(kind,row,data) {`);
    const start=html.indexOf('  function rowActions(kind,row,data) {');
    const end=html.indexOf('  function tableColumns(',start);
    const actions=html.slice(start,end);
    if (end<start || !actions.includes('<div class="table-actions">')) throw Error('业务分类行操作无法定位。');
    html=html.slice(0,start)+actions.replaceAll('<div class="table-actions">',
      '<div class="table-actions">${kind===\'category\'?categoryScenarioAction(row):\'\'}')+html.slice(end);
    return html;
  }

  window.DDependencyScenarioSettings = Object.freeze({openCategory,canOpenCategory,adapt});
})();
