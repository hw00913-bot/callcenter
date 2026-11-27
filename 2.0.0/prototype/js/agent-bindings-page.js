(() => {
  'use strict';

  const id = 'PAGE-21022';
  const name = '智能体关联';
  const catalog = DIntegrationApplications;
  const scopeUI = DIntegrationScopeUI;
  const e = DUI.esc;
  const access = context => catalog.canManage(context) && DSession.canWrite('PAGE-2220');
  const identity = context => JSON.stringify([context?.account?.id,context?.scope?.id]);
  const labelOf = type => type.label.replace(/ Agent$/, '');
  const nameOf = (type,record) => !record?.name || record.name===type.label ? labelOf(type) : record.name;
  const interfaceOf = record => !record?'未配置':record.directBailian?'已配置 · '+record.appId:!record.interfaceKey?'待补全应用配置':record.interfaceName || '接口名称待核对';

  function init(context) {
    const host = document.querySelector('[data-agent-bindings]');
    if (!host || !access(context)) return;
    const originalIdentity = identity(context);
    const tenants = catalog.tenants(context);
    const active = () => host.isConnected && DApp.currentPage()===id &&
      identity(DSession.context())===originalIdentity && access(DSession.context());
    if (!tenants.length) {
      host.textContent = '当前没有可配置的租户。';
      return;
    }
    let tenantId = tenants.some(row=>row.id===context.scope.id) ? context.scope.id : tenants[0].id;
    const tenantPicker = `<div class="filter-panel">
      <label class="field"><span>配置租户</span><select data-agent-tenant${tenants.length===1?' disabled':''}>
        ${tenants.map(row=>`<option value="${e(row.id)}">${e(row.name)}</option>`).join('')}
      </select></label></div>`;

    function draw() {
      if (!active()) return;
      const current = DSession.context();
      const result = catalog.bindings(current,tenantId);
      const tableRows = result.ok ? catalog.agentTypes.map(type=>{
        const record = result.rows.find(row=>row.type===type.key);
        const label = labelOf(type);
        const agentName = nameOf(type,record);
        const {brandNames,tenantNames} = scopeUI.labels(current,tenantId,record);
        const operation = record?.editable===false ? '<span class="status-badge">共享配置</span>' :
          `<button type="button" data-agent-edit="${e(type.key)}"
            aria-label="${e((record?'编辑':'配置')+label)}">${record?'编辑':'配置'}</button>`;
        return `<tr data-agent-row="${e(type.key)}">
          <td><div class="table-main">${e(agentName)}</div>
            ${agentName!==label?`<div class="table-sub">${e(label)}</div>`:''}</td>
          <td>${e(interfaceOf(record))}
            ${record?.interfaceKey && record.interfaceAvailable===false?'<span class="status-badge warning">接口已失效</span>':''}
            ${record?.enabled===false?'<span class="status-badge">已停用</span>':''}</td>
          <td>${e(brandNames)}</td>
          <td>${e(tenantNames)}</td>
          <td>${e(record?.remarks || '—')}</td>
          <td><div class="table-actions">${operation}${type.key==='leadRating'?'<button type="button" data-rating-rules>评级规则</button>':''}</div></td>
        </tr>`;
      }).join('') : '';
      const custom = catalog.customAgents(current,tenantId);
      const customRows=custom.ok ? custom.rows.map(row=>{
        const {brandNames,tenantNames}=scopeUI.labels(current,tenantId,row);
        return `<tr data-custom-agent-row="${e(row.id)}">
          <td><div class="table-main">${e(row.name)}</div><div class="table-sub">自定义</div></td>
          <td>${e(interfaceOf(row))}${row.interfaceAvailable===false?'<span class="status-badge warning">接口已失效</span>':''}</td>
          <td>${e(brandNames)}</td><td>${e(tenantNames)}</td><td>${e(row.remarks || '—')}</td>
          <td><div class="table-actions">${row.editable?`<button type="button" data-custom-agent-edit="${e(row.id)}" aria-label="${e('编辑'+row.name)}">编辑</button>`:'<span class="status-badge">共享配置</span>'}</div></td>
        </tr>`;
      }).join('') : '';
      const toolbar=custom.ok?'<div class="list-toolbar"><div class="toolbar-primary"><button type="button" class="btn btn-primary" data-custom-agent-add>新增自定义智能体</button></div></div>':'';
      host.innerHTML = tenantPicker + toolbar + (result.ok ? `<div class="table-card"><div class="table-scroll" role="region" aria-label="智能体列表" tabindex="0">
        <table class="platform-table"><thead><tr><th scope="col">智能体名称</th><th scope="col">阿里百炼应用</th>
          <th scope="col">适用品牌</th><th scope="col">适用租户</th><th scope="col">备注</th>
          <th scope="col">操作</th></tr></thead><tbody>${tableRows}${customRows}</tbody></table>
        </div></div>` : `<p class="form-error" role="alert">${e(result.message)}</p>`) + (custom.ok?'':`<p class="form-error" role="alert">${e(custom.message)}</p>`);
      host.querySelector('[data-agent-tenant]').value = tenantId;
    }

    function edit(type,onSaved,customId) {
      const custom = type===null;
      const editedTenant = tenantId;
      const current = DSession.context();
      const result = custom ? catalog.customAgents(current,editedTenant) : catalog.bindings(current,editedTenant);
      if (!result.ok) {
        draw();
        return;
      }
      const record = custom ? result.rows.find(row=>row.id===customId) : result.rows.find(row=>row.type===type.key);
      if (record?.editable===false || customId!==undefined && !record) return;
      const appId=record?.appId || (!custom ? record?.id || '' : '');
      const keySaved=record?.directBailian===true && record.secretConfigured===true;
      const modal = DUI.dialog(custom?(record?'编辑自定义智能体':'新增自定义智能体'):'配置'+labelOf(type),`<form class="form-grid" data-agent-binding-editor>
        <label class="field"><span>智能体名称 <span aria-hidden="true">*</span></span>
          <input name="name" value="${e(custom ? record?.name || '' : nameOf(type,record))}" maxlength="60" required autocomplete="off"></label>
        <label class="field"><span>应用 ID <span aria-hidden="true">*</span></span>
          <input name="appId" value="${e(appId)}" maxlength="120" required autocomplete="off" placeholder="请输入阿里百炼应用 ID"></label>
        <label class="field"><span>API Key <span aria-hidden="true">*</span></span>
          <input type="password" name="apiKey" maxlength="300"${keySaved?'':' required'} autocomplete="new-password" placeholder="${keySaved?'留空保留原 API Key':'请输入 API Key'}">
          <small class="field-hint">原型只验证配置，请使用测试值，不要输入真实密钥。</small></label>
        <label class="field"><span>业务空间 ID</span>
          <input name="workspaceId" value="${e(record?.workspaceId || '')}" maxlength="120" autocomplete="off" placeholder="选填"></label>
        ${scopeUI.fields(current,editedTenant,record)}
        <label class="field full"><span>备注</span>
          <textarea name="remarks" maxlength="300" rows="3">${e(record?.remarks || '')}</textarea></label>
        ${record && !custom?'<div class="full"><button type="button" class="btn-link" data-agent-unlink>解除关联</button></div>':''}
        <p class="form-error full" data-agent-binding-error role="alert" hidden></p>
      </form>`,[
        {label:'取消',run:close=>close()},
        {label:'保存',primary:true,run:async close=>{
          if (!active() || tenantId!==editedTenant) {
            error.textContent='配置租户或账号已切换，请重新打开。';error.hidden=false;return;
          }
          if (!form.reportValidity()) return;
          error.hidden=true;
          modal.buttons.at(-1).disabled=true;
          const input={...scopeUI.read(form)};
          for (const key of ['name','remarks','appId','apiKey','workspaceId']) input[key]=form.elements[key].value;
          let saved;
          try {
            saved=custom ? await catalog.saveDirectCustomAgent(current,{tenantId:editedTenant,recordId:customId,expected:result.revision,input}) :
              await catalog.saveDirectBinding(current,{tenantId:editedTenant,type:type.key,expected:result.revision,input});
          } catch (_) {saved={ok:false,message:'配置未保存，请重试。'};}
          if (!form.isConnected) return;
          modal.buttons.at(-1).disabled=false;
          if (!saved.ok) {error.textContent=saved.message;error.hidden=false;return;}
          form.elements.apiKey.value='';
          close();
          draw();
          if (typeof onSaved==='function') onSaved(saved);
          else if(custom) (host.querySelector(`[data-custom-agent-edit="${saved.id}"]`) || host.querySelector('[data-custom-agent-add]'))?.focus();
          else host.querySelector(`[data-agent-edit="${type.key}"]`)?.focus();
          DUI.toast(custom?'自定义智能体已保存。':'智能体配置已保存。');
        }}
      ],{dismissible:true,stack:true});
      const form = modal.element.querySelector('form');
      const error = form.querySelector('[data-agent-binding-error]');
      scopeUI.bind(form);
      form.querySelector('[data-agent-unlink]')?.addEventListener('click',()=>{
        DUI.dialog('解除智能体关联','<p>解除后，当前关联范围内的业务将不再使用此智能体。</p>',[
          {label:'取消',run:close=>close()},
          {label:'确认解除',primary:true,run:close=>{
            if (!active() || tenantId!==editedTenant) return close();
            const removed=catalog.saveBindings(current,{tenantId:editedTenant,expected:result.revision,
              changes:{[type.key]:{interfaceKey:''}}});
            close();
            if (!removed.ok) {error.textContent=removed.message;error.hidden=false;return;}
            modal.close();draw();host.querySelector(`[data-agent-edit="${type.key}"]`)?.focus();
            DUI.toast('智能体关联已解除。');
          }}
        ],{dismissible:true,stack:true});
      });
      const appInput=form.elements.appId,keyInput=form.elements.apiKey;
      appInput.addEventListener('input',()=>{keyInput.required=!keySaved || appInput.value.trim()!==appId;});
      form.onsubmit = event=>{event.preventDefault();modal.buttons.at(-1).click();};
    }

    host.onchange = event=>{
      if (active() && event.target.matches('[data-agent-tenant]')) {
        tenantId = event.target.value;
        draw();
        host.querySelector('[data-agent-tenant]').focus();
      }
    };
    function ratingRules() {
      const editedTenant=tenantId;
      const tenant=tenants.find(row=>row.id===editedTenant);
      const engine=window.DLeadRatingRules;
      const scenes=Array.isArray(engine?.fixedScenes)?engine.fixedScenes:[];
      const type=catalog.agentTypes.find(row=>row.key==='leadRating');
      const live=()=>active() && tenantId===editedTenant;
      const bindings=()=>catalog.bindings(DSession.context(),editedTenant);
      const agent=result=>result?.ok?result.rows.find(row=>row.type==='leadRating'):null;
      const inTenant=()=>{
        const current=DSession.context();
        return current?.scope?.kind==='tenant' && current.scope.id===editedTenant &&
          current.scope.tenant?.brandId===tenant?.brandId;
      };
      const available=row=>Boolean(row?.id && row.enabled!==false &&
        (!row.tenantIds || row.tenantIds.includes(editedTenant)) &&
        (!row.brandIds || row.brandIds.includes(tenant?.brandId)) &&
        (!inTenant() || catalog.status(DSession.context(),'leadRating')?.status==='connected'));
      const writable=()=>live() && inTenant() && bindings().ok && agent(bindings())?.editable!==false;
      const brand=window.DOrganization?.brands?.().find(row=>row.id===tenant?.brandId);
      let saved;
      try {saved=engine?.readConfig(DSession.context(),editedTenant) || {ok:false,error:'评级规则暂不可用，请稍后重新打开。'};}
      catch (_) {saved={ok:false,error:'评级规则读取失败，请稍后重新打开。'};}
      let options=[],fallbackOptions=[],categories=[],categoryIds=[];
      let optionsRevision=null,loaded=false,loadSequence=0,draftRows=[],sceneIds=[];
      let baseline='';
      const modal=DUI.dialog('线索智能评级 · 评级规则',`<form class="rating-rules-form" data-rating-rules-form>
        <dl class="rating-rules-context">
          <div><dt>配置租户</dt><dd>${e(tenant?.name || editedTenant)}</dd></div>
          <div><dt>所属品牌</dt><dd>${e(brand?.name || tenant?.brandId || '未关联品牌')}</dd></div>
          <div><dt>阿里百炼应用</dt><dd data-rating-rules-interface></dd></div>
        </dl>
        <p class="rating-rules-association" data-rating-rules-association></p>
        <p class="rating-rules-readonly" data-rating-rules-readonly hidden></p>
        <section class="rating-rules-settings" aria-label="评级规则配置">
          <section class="rating-rules-scope" aria-label="固定触发范围">
            <strong>固定触发范围</strong><p>仅${e([...new Set(scenes.flatMap(scene=>scene.modes))].join('、'))}；接触状态为「已接通（正常接通）」，且符合所选二级分类和场景。</p>
          </section>
          <fieldset class="rating-rules-scene-picker" data-rating-rules-category-picker>
            <legend>适用二级分类 <span aria-hidden="true">*</span></legend>
            <div data-rating-rules-category-choices>正在读取业务分类…</div>
            <p data-rating-rules-category-note>至少勾选一个二级分类。</p>
          </fieldset>
          <fieldset class="rating-rules-scene-picker" data-rating-rules-scene-picker>
            <legend>关联场景 <span aria-hidden="true">*</span></legend>
            <div>${scenes.map(scene=>`<label><input type="checkbox" data-rating-rules-scene-choice value="${e(scene.id)}">${e(scene.label)}</label>`).join('')}</div>
            <p>至少选择一个场景，评级规则对所选场景生效。</p>
          </fieldset>
          <div class="rating-rules-toolbar">
            <label class="rating-rules-enable"><input type="checkbox" name="rulesEnabled" role="switch"${saved.ok && saved.enabled?' checked':''}>启用评级规则</label>
            <button type="button" class="button secondary" data-rating-rules-example>填入示例</button>
          </div>
          <p class="rating-rules-explain">人工填写值和 AI 返回值<strong>分别命中各自集合时，采用 AI 返回值</strong>。任一未命中、人工未填、AI 空值或调用失败时，使用本场景默认值。任一集合未选值时，本场景使用默认值。</p>
          <div class="rating-rules-table-scroll" role="region" aria-label="关联场景的评级规则" tabindex="0" data-rating-rules-table><p role="status">正在读取现有评级枚举…</p></div>
          <p class="rating-rules-enum-note" data-rating-rules-enum-note></p>
        </section>
      </form>`,[
        {label:'关闭',run:close=>{close();draw();}},
        {label:'保存规则',primary:true,run:()=>save()}
      ],{dismissible:true,stack:true});
      const dialog=modal.element.querySelector('.d-dialog');
      dialog.classList.add('rating-rules-dialog');
      const form=modal.element.querySelector('form');
      const enabled=form.elements.rulesEnabled;
      const saveButton=modal.buttons[1];
      const footer=dialog.querySelector('footer');
      const footerMessage=document.createElement('div');
      footerMessage.className='rating-rules-footer-message';
      footerMessage.innerHTML='<p data-rating-rules-save-state role="status"></p><p class="form-error" data-rating-rules-error role="alert" hidden></p>';
      footer.prepend(footerMessage);
      const status=footerMessage.querySelector('[data-rating-rules-save-state]');
      const error=footerMessage.querySelector('[data-rating-rules-error]');
      const table=form.querySelector('[data-rating-rules-table]');
      const scenePicker=form.querySelector('[data-rating-rules-scene-picker]');
      const sceneChoices=[...scenePicker.querySelectorAll('[data-rating-rules-scene-choice]')];
      const categoryPicker=form.querySelector('[data-rating-rules-category-picker]');
      const categoryChoices=()=>[...categoryPicker.querySelectorAll('[data-rating-rules-category-choice]')];
      const serialized=()=>JSON.stringify({enabled:enabled.checked,categoryIds,sceneIds,rows:draftRows});
      const dirty=()=>loaded && serialized()!==baseline;
      function showError(message) {error.textContent=message;error.hidden=false;}
      function stateText() {
        if(!saved.ok)return saved.error || saved.message || '当前规则读取失败。';
        if(!loaded)return '正在读取评级枚举…';
        if(dirty())return '当前草稿未生效；保存后才会应用新规则。';
        return saved.revision?'已保存 v'+saved.revision+' · '+(saved.enabled?'已启用':'未启用'):'尚未保存规则，当前未启用。';
      }
      function refreshState() {
        if(!live() || !form.isConnected)return;
        const result=bindings(),record=agent(result),canWrite=writable(),linked=available(record);
        const connection=inTenant()?catalog.status(DSession.context(),'leadRating'):null;
        form.querySelector('[data-rating-rules-interface]').textContent=interfaceOf(record)+(record?.interfaceAvailable===false?'（已失效）':'');
        const association=form.querySelector('[data-rating-rules-association]');
        association.innerHTML=`<span>${e(!result.ok?result.message || '关联状态待核对':linked?'智能体已关联':connection?.status==='unavailable'?connection.message:record?.enabled===false?'智能体关联已停用':'尚未关联线索智能评级智能体')}</span>${canWrite?`<button type="button" class="btn-link" data-rating-rules-link>${linked?'更换关联':'关联智能体'}</button>`:''}`;
        association.querySelector('[data-rating-rules-link]')?.addEventListener('click',()=>edit(type,()=>{
          if(form.isConnected && live()){refreshState();form.querySelector('[data-rating-rules-link]')?.focus();}
        }));
        const readonly=form.querySelector('[data-rating-rules-readonly]');
        readonly.hidden=canWrite;
        readonly.textContent=!inTenant()?'当前仅查看此租户的规则。请先从顶部切换到「'+(tenant?.name || editedTenant)+'」后配置。':'当前智能体关联为共享只读配置，请由有权维护该关联的管理员配置。';
        enabled.disabled=!canWrite || !loaded || !saved.ok || !linked && !enabled.checked;
        sceneChoices.forEach(choice=>{choice.disabled=!canWrite || !loaded || !saved.ok;});
        categoryChoices().forEach(choice=>{choice.disabled=!canWrite || !loaded || !saved.ok || choice.dataset.unavailable==='true' && !choice.checked;});
        form.querySelector('[data-rating-rules-example]').disabled=!canWrite || !loaded || !saved.ok || !sceneIds.length || !fallbackOptions.length;
        table.querySelectorAll('input,select,button').forEach(control=>{control.disabled=!canWrite;});
        saveButton.disabled=!canWrite || !loaded || !saved.ok || enabled.checked && !linked;
        if(enabled.checked && !linked && saved.ok)showError('启用保存前请先关联可用的线索智能评级智能体。当前草稿已保留。');
        status.textContent=stateText();
      }
      function renderCategoryChoices() {
        const missing=categoryIds.filter(id=>!categories.some(category=>category.id===id));
        const rows=[...categories,...missing.map(id=>({id,label:id,options:[],missing:true}))];
        categoryPicker.querySelector('[data-rating-rules-category-choices]').innerHTML=rows.map(category=>{
          const label=category.label+(category.missing?'（已失效）':category.options.length?'':'（缺少可用意向级别）');
          return `<label><input type="checkbox" data-rating-rules-category-choice data-unavailable="${!category.options.length}" value="${e(category.id)}"${categoryIds.includes(category.id)?' checked':''}>${e(label)}</label>`;
        }).join('') || '当前租户暂无启用的二级分类。';
        categoryPicker.querySelector('[data-rating-rules-category-note]').textContent=saved.categoryIds===null ?
          '旧规则适用全部分类。请勾选二级分类后保存新范围。' : '从当前租户的业务分类读取，至少勾选一项。';
      }
      function refreshOptions() {
        ({options,fallbackOptions}=engine.selectionOptions(categories,categoryIds));
        form.querySelector('[data-rating-rules-enum-note]').textContent=categoryIds.length ?
          '参照集合使用已选分类的评级字段，默认值须在每个所选分类中可用。' : '';
      }
      function renderRows() {
        if(!sceneIds.length || !categoryIds.length){
          table.innerHTML='<p class="rating-rules-enum-note">勾选二级分类和关联场景后可配置评级规则。</p>';
          refreshState();return;
        }
        if(!fallbackOptions.length){
          table.innerHTML='<p class="form-error" role="status">所选二级分类没有共同的意向级别，请调整选择。</p>';
          refreshState();return;
        }
        const headings=['关联场景','人工填写值','AI 输出值','未命中默认值'];
        const chips=(row,scene,property,caption)=>{
          const invalid=row[property].filter(value=>!options.some(option=>option.value===value));
          return `<div class="rating-rules-chips" role="group" aria-label="${e(scene.label+'的'+caption)}">${options.map(option=>`<label class="rating-rules-chip"><input type="checkbox" ${property==='manualValues'?'data-rating-rules-manual':'data-rating-rules-ai'} data-rating-rules-collection="${property}" value="${e(option.value)}"${row[property].includes(option.value)?' checked':''}><span>${e(option.label)}</span></label>`).join('')}</div>${invalid.length?`<p class="form-error">已失效：${e(invalid.join('、'))} <button type="button" class="btn-link" data-rating-rules-clear-invalid="${property}">移除</button></p>`:''}`;
        };
        table.innerHTML=`<table class="rating-rules-table"><thead><tr>${headings.map(text=>`<th scope="col">${text}</th>`).join('')}</tr></thead><tbody>${draftRows.map((row,index)=>{
          if(!sceneIds.includes(row.id))return '';
          const scene=scenes.find(item=>item.id===row.id);
          const fallbackInvalid=row.fallback && !fallbackOptions.some(option=>option.value===row.fallback);
          return `<tr data-rating-rules-row="${index}" data-rating-rules-scene="${e(row.id)}">
            <th scope="row"><strong>${e(scene.label)}</strong><small>线索状态「${e(scene.leadStatus)}」<br>＋回访结果「${e(scene.result)}」</small></th>
            <td>${chips(row,scene,'manualValues','人工填写值')}</td>
            <td>${chips(row,scene,'aiValues','AI 输出值')}</td>
            <td><select aria-label="${e(scene.label)}的未命中默认值" data-rating-rules-fallback><option value="">请选择默认值</option>${fallbackInvalid?`<option value="${e(row.fallback)}" selected>${e(row.fallback)}（当前分类不可用）</option>`:''}${fallbackOptions.map(option=>`<option value="${e(option.value)}"${row.fallback===option.value?' selected':''}>${e(option.label)}</option>`).join('')}</select></td>
          </tr>`;
        }).join('')}</tbody></table>`;
        refreshState();
      }
      function draftChanged() {error.hidden=true;refreshState();}
      table.addEventListener('change',event=>{
        const row=draftRows[Number(event.target.closest('[data-rating-rules-row]')?.dataset.ratingRulesRow)];
        if(!row || !writable())return;
        const property=event.target.dataset.ratingRulesCollection;
        if(['manualValues','aiValues'].includes(property))row[property]=options.filter(option=>
          [...event.target.closest('tr').querySelectorAll(`[data-rating-rules-collection="${property}"]:checked`)].some(control=>control.value===option.value)).map(option=>option.value);
        if(event.target.matches('[data-rating-rules-fallback]'))row.fallback=event.target.value;
        draftChanged();
      });
      table.addEventListener('click',event=>{
        const button=event.target.closest('[data-rating-rules-clear-invalid]');
        if(!button || !writable())return;
        const row=draftRows[Number(button.closest('tr').dataset.ratingRulesRow)];
        const property=button.dataset.ratingRulesClearInvalid;
        if(!['manualValues','aiValues'].includes(property))return;
        row[property]=row[property].filter(value=>options.some(option=>option.value===value));renderRows();draftChanged();
      });
      enabled.addEventListener('change',draftChanged);
      categoryPicker.addEventListener('change',()=>{
        if(!writable() || !loaded)return;
        categoryIds=categoryChoices().filter(choice=>choice.checked).map(choice=>choice.value);
        error.hidden=true;refreshOptions();renderRows();
      });
      scenePicker.addEventListener('change',()=>{
        if(!writable() || !loaded)return;
        sceneIds=sceneChoices.filter(choice=>choice.checked).map(choice=>choice.value);
        error.hidden=true;renderRows();
      });
      form.querySelector('[data-rating-rules-example]').addEventListener('click',()=>{
        if(!writable() || !loaded)return;
        const values=options.map(option=>option.value),valid=list=>list.filter(value=>values.includes(value));
        const defaults=fallbackOptions.map(option=>option.value);
        draftRows=draftRows.map(row=>{
          if(!sceneIds.includes(row.id))return row;
          return row.id==='highIntent'?{id:row.id,manualValues:valid(['A','B']),aiValues:valid(['H','A','B']),fallback:defaults.includes('A')?'A':defaults[0]}:
            {id:row.id,manualValues:valid(['E','F']),aiValues:valid(['F']),fallback:defaults.includes('F')?'F':defaults[0]};
        });
        renderRows();draftChanged();status.textContent='已填入关联场景的示例，请核对后保存。';
      });
      function save() {
        if(!live() || !writable() || !loaded || !saved.ok)return;
        error.hidden=true;
        if(!categoryIds.length){categoryChoices().find(choice=>!choice.disabled)?.focus();return showError('请至少勾选一个适用二级分类。');}
        if(!sceneIds.length){sceneChoices[0]?.focus();return showError('请至少选择一个关联场景。');}
        if(categoryChoices().some(choice=>choice.checked && choice.dataset.unavailable==='true'))return showError('请取消已失效或缺少意向级别的二级分类。');
        if(!fallbackOptions.length)return showError('所选二级分类没有共同的意向级别，请调整选择。');
        const missing=draftRows.findIndex(row=>sceneIds.includes(row.id) && (!row.fallback || !fallbackOptions.some(option=>option.value===row.fallback)));
        if(missing>=0){const control=table.querySelector(`[data-rating-rules-row="${missing}"] [data-rating-rules-fallback]`);control?.scrollIntoView({block:'nearest'});control?.focus();return showError('请为「'+scenes.find(scene=>scene.id===draftRows[missing].id)?.label+'」选择当前有效的未命中默认值。');}
        if(enabled.checked && !available(agent(bindings())))return showError('启用保存前请先关联可用的线索智能评级智能体。');
        let result;
        try {result=engine.saveConfig(DSession.context(),{tenantId:editedTenant,expectedRevision:saved.revision,enabled:enabled.checked,
          sceneIds:[...sceneIds],categoryIds:[...categoryIds],rows:draftRows.map(row=>({...row,manualValues:[...row.manualValues],aiValues:[...row.aiValues]})),optionsRevision});}
        catch (_) {result={ok:false,error:'保存失败，当前草稿已保留，请重试。'};}
        if(!result.ok)return showError(result.error || result.message || '规则未保存，当前草稿已保留。');
        modal.close();
        draw();
        host.querySelector('[data-rating-rules]')?.focus();
        DUI.toast('评级规则已保存 v'+result.revision+'。');
      }
      async function loadOptions() {
        const sequence=++loadSequence;
        let result;
        try {result=await engine?.loadOptions(DSession.context(),editedTenant);}
        catch (_) {result={ok:false,error:'评级枚举读取失败。'};}
        if(!form.isConnected || !live() || sequence!==loadSequence)return;
        if(!result?.ok || !Array.isArray(result.categories) || result.tenantId!==editedTenant || result.brandId!==tenant?.brandId || scenes.length!==2){
          categoryPicker.querySelector('[data-rating-rules-category-choices]').textContent='二级分类暂时无法读取。';
          table.innerHTML='<p class="form-error">'+e(result?.error || result?.message || '当前租户评级枚举暂不可用。')+'</p>';showError('请核对当前租户的评级字段后重新打开；原配置保持不变。');refreshState();return;
        }
        categories=result.categories;optionsRevision=result.revision;loaded=true;
        categoryIds=[...(saved.categoryIds || [])];
        sceneIds=[...(saved.sceneIds || [])];
        sceneChoices.forEach(choice=>{choice.checked=sceneIds.includes(choice.value);});
        const existing=new Map((saved.rows || []).map(row=>[row.id,row]));
        draftRows=scenes.map(scene=>{
          const row=existing.get(scene.id);
          return {id:scene.id,manualValues:[...(row?.manualValues || [])],aiValues:[...(row?.aiValues || [])],fallback:row?.fallback || ''};
        });
        baseline=serialized();
        renderCategoryChoices();refreshOptions();
        renderRows();if(!saved.ok)showError(saved.error || saved.message || '原配置读取失败。');
      }
      form.addEventListener('submit',event=>{event.preventDefault();save();});
      refreshState();void loadOptions();
    }
    host.onclick = event=>{
      if(active() && event.target.closest('[data-custom-agent-add]')){edit(null);return;}
      const customButton=event.target.closest('[data-custom-agent-edit]');
      if(active() && customButton){edit(null,null,customButton.dataset.customAgentEdit);return;}
      if(active() && event.target.closest('[data-rating-rules]')){ratingRules();return;}
      const button = event.target.closest('[data-agent-edit]');
      if (!active() || !button) return;
      const type = catalog.agentTypes.find(row=>row.key===button.dataset.agentEdit);
      if (type) edit(type);
    };
    draw();
  }

  DNav.pages.push({id,name,area:'系统管理',group:'接入配置',route:'',menu:true,module:'public',phoneDomain:'outside'});
  const priorPage = DRolePermissions.page;
  DRolePermissions.page = (page,context,seat) => page===id ? access(context) : priorPage(page,context,seat);
  const priorWrite = DRolePermissions.writable;
  DRolePermissions.writable = (page,context,seat) => page===id ? access(context) : priorWrite(page,context,seat);
  window.Pages ||= {};
  Pages[id] = {render:()=>`<section class="platform-page" data-rtl-page-type="list">
    <header class="d-page-heading" data-rtl-region="page-header"><h1>${name}</h1></header>
    <div data-agent-bindings data-rtl-region="list"></div></section>`,init};
})();
