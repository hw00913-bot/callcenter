(() => {
  'use strict';

  const catalog = window.DIntegrationApplications;
  const e = DUI.esc;
  const labels = ['应用名称','应用场景','接口名称','接口地址','appid','appsecret','适用品牌','适用租户','备注','被引用','操作'];
  const scopeKey = context => JSON.stringify([context?.account?.id,context?.scope?.id]);

  function active(view) {
    const context = DSession.context();
    return view.root.isConnected && DApp.currentPage()==='PAGE-2220' && view.tab==='dependency' &&
      scopeKey(context)===view.scope && catalog.canManage(context);
  }

  function canOpenCategories(view,context) {
    return context?.scope?.kind==='tenant' && context.scope.id===view.tenantId && DSession.allowed('PAGE-2006',context);
  }

  function button(label,action,id='',primary=false) {
    const cls = primary ? 'btn btn-primary' : 'btn-link';
    return '<button type="button" class="'+cls+'" data-integration-action="dependency-'+e(action)+
      '" data-id="'+e(id)+'">'+e(label)+'</button>';
  }

  function field(label,name,value,options='',required=false) {
    const mark = required ? ' <b class="d-access-required" aria-hidden="true">*</b>' : '';
    return '<label class="field"><span>'+e(label)+mark+'</span><input name="'+e(name)+'" value="'+e(value ?? '')+
      '" '+options+(required?' required':'')+'></label>';
  }

  function scenarioField(record,preset) {
    const selected = catalog.dependencyScenario(record || {type:preset?.key});
    return '<label class="field"><span>应用场景 <b class="d-access-required" aria-hidden="true">*</b></span>' +
      '<select name="applicationScenario" required><option value="">请选择应用场景</option>' +
      catalog.dependencyScenarios.map(value=>'<option value="'+e(value)+'"'+
        (value===selected?' selected':'')+'>'+e(value)+'</option>').join('')+'</select></label>';
  }

  function secretField(configured) {
    return '<label class="field"><span>appsecret</span>'+
      '<input type="password" name="appSecret" maxlength="200" autocomplete="new-password"'+
      (configured?' aria-describedby="dependency-secret-hint"':'')+'>'+
      (configured?'<small class="field-hint" id="dependency-secret-hint">已登记，留空沿用。</small>':'')+'</label>';
  }

  function table(rows,message) {
    return '<div class="table-card"><div class="table-scroll" role="region" tabindex="0" aria-label="外部依赖列表">'+
      '<table class="platform-table"><thead><tr>'+labels.map(label=>'<th scope="col">'+e(label)+'</th>').join('')+
      '</tr></thead><tbody>'+(rows.length ? rows.map(columns=>'<tr>'+columns.map(cell=>'<td>'+cell+'</td>').join('')+'</tr>').join('') :
        '<tr><td colspan="'+labels.length+'"><div class="d-page-empty">'+e(message)+'</div></td></tr>')+'</tbody></table></div></div>';
  }

  function draw(view) {
    if (!active(view)) return;
    const context = DSession.context(), tenants = catalog.tenants(context);
    if (!tenants.some(tenant=>tenant.id===view.tenantId)) view.tenantId=tenants[0]?.id;
    if (!view.tenantId) {
      view.body.innerHTML = '<p class="d-page-empty">当前没有可管理的租户。</p>';
      return;
    }
    const result = catalog.dependencies(context,view.tenantId);
    const scope = catalog.isGlobal(context) ? '<div class="filter-panel"><label class="field"><span>配置租户</span>'+
      '<select data-integration-tenant>'+tenants.map(tenant=>'<option value="'+e(tenant.id)+'" '+
        (tenant.id===view.tenantId?'selected':'')+'>'+e(tenant.name)+'</option>').join('')+'</select></label></div>' : '';
    const writable = catalog.canWriteDependencies(context,view.tenantId);
    const rows = [];
    if (result.ok) {
      const renderRow = (key,defaultName,record) => {
        const {brandNames,tenantNames} = DIntegrationScopeUI.labels(context,view.tenantId,record);
        const editable = writable && record?.editable!==false;
        const impact = record ? catalog.dependencyReferences(context,view.tenantId,key) : {ok:true,rows:[]};
        const references = record ? button(impact.ok ? String(impact.rows.length)+' 处' : '待核对','references',key) : '—';
        const actions = editable ? button(record?'编辑':'配置','edit',key)+
          (record ? button('删除','delete',key) : '') : '—';
        return [e(record?.name || defaultName),e(catalog.dependencyScenario(record || {type:key}) || '—'),e(record?.interfaceName || '—'),e(record?.interfaceUrl || '—'),
          e(record?.id || '—'),record?.secretConfigured?'已登记':'—',e(brandNames),e(tenantNames),
          e(record?.remarks || '—'),references,
          '<div class="table-actions">'+(record?.editable===false?'共享配置':actions)+'</div>'];
      };
      const presetKeys = new Set(catalog.dependencyTypes.map(type=>type.key));
      for (const type of catalog.dependencyTypes) {
        rows.push(renderRow(type.key,type.label,result.rows.find(row=>row.key===type.key)));
      }
      for (const row of result.rows) {
        if (!presetKeys.has(row.key)) rows.push(renderRow(row.key,row.name,row));
      }
    }
    view.body.innerHTML = scope+(result.ok ? '<p class="field-hint">登记预评分或优秀话术接口后，在对应二级分类的「场景应用」中关联。 '+
      (canOpenCategories(view,context) ? button('打开业务分类','categories') : '')+'</p><div class="list-toolbar"><div class="toolbar-primary">'+
      (writable ? button('新增外部依赖','edit','',true) : '')+'</div>'+button('调用记录','calls')+'</div>' : '')+table(rows,result.message);
  }

  function impactList(rows) {
    return '<ul>'+rows.map(row=>'<li>'+e(row.tenantName || '')+' · '+e(row.kind)+' · '+e(row.name)+
      (row.detail?' · '+e(row.detail):'')+'</li>').join('')+'</ul>';
  }

  function confirmImpact(rows) {
    return new Promise(resolve=>{
      let decided = false;
      const decide = (close,value)=>{if(decided)return;decided=true;close();resolve(value);};
      DUI.dialog('确认应用变更影响','<p>此变更涉及接口、凭证、应用场景或适用范围。以下业务关联将需要重新核对并保存：</p>'+impactList(rows),[
        {label:'返回编辑',run:close=>decide(close,false)},
        {label:'确认变更',primary:true,run:close=>decide(close,true)}
      ],{stack:true,dismissible:false});
    });
  }

  function showReferences(view,record) {
    const result = catalog.dependencyReferences(DSession.context(),view.tenantId,record.key);
    DUI.dialog('应用被引用位置','<p>'+e(record.name)+'</p>'+(result.ok ?
      (result.rows.length?impactList(result.rows):'<p>当前没有配置引用此应用。</p>'):'<p role="alert">'+e(result.message)+'</p>'),[
      {label:'关闭',run:close=>close()}
    ],{stack:true,dismissible:true});
  }

  function callTime(value) {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat('zh-CN',{
      timeZone:'Asia/Shanghai',dateStyle:'short',timeStyle:'medium',hour12:false
    }).format(date) : '—';
  }

  function callStatus(value) {
    return {success:'成功',available:'成功',failure:'失败',failed:'失败',timeout:'超时',
      missing:'无结果',unavailable:'不可用',pending:'处理中'}[value] || value || '—';
  }

  function showCalls(view) {
    const result = catalog.scenarioCalls(DSession.context(),{tenantId:view.tenantId});
    const rows = result.ok ? result.rows : [];
    const content = !result.ok ? '<p role="alert">'+e(result.message)+'</p>' :
      '<p>仅显示本租户的场景调用与办理结果，全部为原型模拟。</p><div class="table-scroll"><table class="platform-table">'+
      '<thead><tr>'+['时间','应用场景','应用 / 配置版本','操作','任务 / 轮次','结果','外部单号 / 原因'].map(label=>'<th>'+e(label)+'</th>').join('')+
      '</tr></thead><tbody>'+(rows.slice(0,100).map(row=>'<tr><td>'+e(callTime(row.at))+'</td><td>'+e(row.scenario)+'</td><td>'+e(row.applicationName || row.applicationId)+
      '<br><small>'+e(row.revision || '—')+'</small></td><td>'+e(row.operation)+'</td><td>'+e(row.taskId || '—')+'<br>'+e(row.roundId || '—')+
      '</td><td>'+e(callStatus(row.status))+'</td><td>'+e(row.externalId || row.message || '—')+'</td></tr>').join('') ||
      '<tr><td colspan="7">暂无调用记录。</td></tr>')+'</tbody></table></div>';
    DUI.dialog('场景应用调用记录',content,[{label:'关闭',run:close=>close()}],{stack:true,dismissible:true,drawer:true});
  }

  function openForm(view,tenantId,title,fields,submit) {
    const modal = DUI.dialog(title,'<form data-integration-editor class="form-grid">'+fields+
      '<p class="form-error full" role="alert" hidden></p></form>',[
        {label:'取消',run:close=>close()},
        {label:'保存',primary:true,run:commit}
      ],{dismissible:true,stack:true});
    const form = modal.element.querySelector('form');
    const error = form.querySelector('[role="alert"]');
    DIntegrationScopeUI.bind(form);
    form.onsubmit=event=>{event.preventDefault();modal.buttons.at(-1).click();};
    async function commit(close,control) {
      if (!active(view) || view.tenantId!==tenantId || !form.reportValidity()) return;
      control.disabled = true;
      try {
        const data = new FormData(form), scope = DIntegrationScopeUI.read(form);
        let result = await submit(data,scope,false);
        if (result.requiresConfirmation) {
          const confirmed = await confirmImpact(result.references || []);
          if (!confirmed || !active(view) || !modal.element.isConnected) return;
          result = await submit(data,scope,true);
        }
        if (!active(view) || !modal.element.isConnected) return;
        if (!result.ok) throw Error(result.message || '暂未保存。');
        close();
        draw(view);
        DUI.toast('已保存');
      } catch (problem) {
        error.textContent = problem.message;
        error.hidden = false;
      } finally {
        control.disabled = false;
      }
    }
  }

  function edit(view,key,record) {
    const preset = catalog.dependencyTypes.find(type=>type.key===key);
    if (key && !record && !preset) return;
    const tenantId = view.tenantId;
    const context = DSession.context();
    const title = record ? '编辑外部依赖' : preset ? '配置'+preset.label : '新增外部依赖';
    openForm(view,tenantId,title,
      field('应用名称','name',record?.name ?? preset?.label,'maxlength="60"',true)+
      scenarioField(record,preset)+
      field('接口名称','interfaceName',record?.interfaceName,'maxlength="100"')+
      field('接口地址','interfaceUrl',record?.interfaceUrl,'type="url" maxlength="500" placeholder="https://"')+
      field('appid','id',record?.id,'maxlength="120" autocomplete="off"')+
      secretField(record?.secretConfigured)+
      DIntegrationScopeUI.fields(context,tenantId,record)+
      '<label class="field full"><span>备注</span><textarea name="remarks" maxlength="300" rows="3">'+
      e(record?.remarks || '')+'</textarea></label>',
      (form,scope,confirmReferences)=>catalog.saveDependency(context,{tenantId,key,expected:record?.updatedAt || '',...scope,confirmReferences,
        name:form.get('name'),applicationScenario:form.get('applicationScenario'),interfaceName:form.get('interfaceName'),interfaceUrl:form.get('interfaceUrl'),
        id:form.get('id'),appSecret:form.get('appSecret'),remarks:form.get('remarks')}));
  }

  function confirmDelete(view,record) {
    const tenantId = view.tenantId;
    DUI.dialog('删除外部依赖','<p>确认删除「'+e(record.name)+'」？</p><p role="alert" class="form-error" hidden></p>',[
      {label:'取消',run:close=>close()},
      {label:'删除',primary:true,run:(close,control)=>{
        if (!active(view) || view.tenantId!==tenantId) return;
        const result = catalog.deleteDependency(DSession.context(),{tenantId,key:record.key,expected:record.updatedAt});
        if (result.ok) {
          close();
          draw(view);
          DUI.toast('已删除');
        } else {
          const error = control.closest('[role="dialog"]').querySelector('[role="alert"]');
          error.textContent = result.message;
          error.hidden = false;
        }
      }}
    ],{dismissible:true,stack:true});
  }

  function handleAction(view,action,id) {
    if (!active(view)) return;
    const context = DSession.context();
    if (action==='dependency-categories' && canOpenCategories(view,context)) return DApp.openPage('PAGE-2006',{menuEntry:true});
    if (action==='dependency-calls') return showCalls(view);
    const result = catalog.dependencies(context,view.tenantId);
    if (!result.ok) return DUI.toast(result.message);
    const record = result.rows.find(row=>row.key===id);
    if (action==='dependency-references' && record) return showReferences(view,record);
    if (!catalog.canWriteDependencies(context,view.tenantId) || record?.editable===false) return;
    if (action==='dependency-edit') return edit(view,id,record);
    if (action==='dependency-delete' && record) confirmDelete(view,record);
  }

  window.DExternalDependenciesPage = Object.freeze({draw,handleAction});
})();
