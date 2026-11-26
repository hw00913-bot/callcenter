(() => {
  'use strict';

  const pageId='PAGE-21025';
  const e=value=>DUI.esc(value);
  const engine=()=>window.DFieldLinkageRules;
  const scopeKey=context=>JSON.stringify([context?.account?.id,context?.scope?.id,
    context?.scope?.tenant?.brandId,context?.scope?.tenant?.enterpriseId]);
  const canManage=context=>Boolean(engine()?.canManage(context));
  const canView=context=>canManage(context) || Boolean(DSession.allowed('PAGE-2223',context));
  const copy=value=>structuredClone(value);
  const callModes=[['ai','AI 外呼'],['human','人工外呼/预外呼']];
  const modeLabel=mode=>callModes.find(([key])=>key===mode)?.[1] || '';
  let editorSequence=0;
  const emptyBranch=()=>({conditions:[{fieldId:'',values:[]}],targetFieldId:'',action:'restrict',values:[],required:true});
  const branchEmpty=branch=>!branch || !branch.targetFieldId && !(branch.values || []).length && !branch.prefillText &&
    !(branch.conditions || []).some(condition=>condition.fieldId || condition.values?.length);
  const modeConfig=(rule,mode)=>engine()?.modeConfig ? engine().modeConfig(rule,mode) :
    rule?.modeConfigs ? rule.modeConfigs[mode] || null : mode==='human' && rule?.conditions ? rule : null;
  const configuredModes=rule=>callModes.filter(([mode])=>Boolean(modeConfig(rule,mode)));

  const categoryOf=(catalog,id)=>catalog?.categories?.find(category=>category.id===id);
  const assignmentOf=(catalog,id)=>catalog?.assignmentRules?.find(rule=>rule.id===id);
  const sourceFor=(rule,catalog)=>assignmentOf(catalog,rule.assignmentRuleId) || categoryOf(catalog,rule.categoryId);
  const versionLabel=value=>value?'v'+String(value).replace(/^v/,''):'';
  const assignmentName=(rule,catalog)=>assignmentOf(catalog,rule.assignmentRuleId)?.name || rule.assignmentRuleName || rule.assignmentRuleId || '待绑定分配规则';
  const assignmentOption=rule=>[rule.name,versionLabel(rule.version),rule.categoryLabel || categoryLabel(rule)].filter(Boolean).join(' · ');
  const fieldOf=(category,id)=>category?.fields?.find(field=>field.id===id);
  const categoryLabel=category=>Array.isArray(category?.path)?category.path.join(' / '):category?.path || category?.label || '';
  const fieldLabel=(category,id)=>fieldOf(category,id)?.label || '失效字段（'+id+'）';
  const optionLabel=(field,value)=>field?.options?.find(option=>option.value===value)?.label || '失效选项（'+value+'）';
  const fieldTypes=new Set(['select','multiselect']);
  const textTypes=new Set(['text','textarea']);
  const textLimit=field=>engine().prefillTextLimit(field);
  const selectable=(category,targets=false)=>(category?.fields || []).filter(field=>fieldTypes.has(field.type) || targets && textTypes.has(field.type));
  const time=value=>{
    const date=new Date(value);
    return Number.isFinite(date.getTime())?date.toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false}):'—';
  };

  function active(view) {
    return view.root.isConnected && DApp.currentPage()===pageId &&
      scopeKey(DSession.context())===view.scope && canView(DSession.context());
  }
  function branchIssues(branch,category) {
    const issues=[],conditions=Array.isArray(branch?.conditions)?branch.conditions:[];
    if(!conditions.length)issues.push('尚未配置上游条件');
    const seen=new Set();
    conditions.forEach(condition=>{
      const field=fieldOf(category,condition.fieldId);
      if(!field || !fieldTypes.has(field.type)){issues.push(fieldLabel(category,condition.fieldId));return;}
      if(seen.has(field.id))issues.push('条件字段重复：'+field.label);
      seen.add(field.id);
      if(!condition.values?.length || condition.values.some(value=>!field.options.some(option=>option.value===value)))issues.push(field.label+'的条件值缺失或已失效');
    });
    const target=fieldOf(category,branch?.targetFieldId);
    if(!target || !fieldTypes.has(target.type) && !textTypes.has(target.type))issues.push('目标字段缺失或已失效');
    else {
      if(seen.has(target.id))issues.push('目标字段不能同时作为上游条件');
      if(textTypes.has(target.type)){
        if(branch.action!=='prefill' || !branch.prefillText?.trim() || branch.prefillText.length>textLimit(target))issues.push('请输入 1 到 '+textLimit(target)+' 字的预填文案');
        if(target.type==='text' && /[\r\n]/.test(branch.prefillText || ''))issues.push('单行文本不能包含换行');
      } else {
        if(branch.action==='prefill')issues.push('仅文本字段支持预填文案');
        if(!branch.values?.length || branch.values.some(value=>!target.options.some(option=>option.value===value)))issues.push(target.label+'的联动值缺失或已失效');
        if(branch.action==='fixed' && branch.values?.length!==1)issues.push('固定值必须且只能选择一项');
      }
    }
    if(!['restrict','fixed','prefill'].includes(branch?.action))issues.push('联动方式无效');
    return issues;
  }
  function issuesFor(rule,catalog) {
    const issues=[],category=assignmentOf(catalog,rule.assignmentRuleId);
    if(!rule.assignmentRuleId)return ['待绑定分配规则'];
    if(!category)return ['原分配规则已停用、移除或不在当前范围'];
    if(rule.categoryId!==category.categoryId)issues.push('原分配规则与二级分类不一致，请重新绑定');
    const modes=configuredModes(rule);
    if(!modes.length)issues.push('请至少配置 AI 外呼或人工外呼/预外呼中的一边');
    for(const [mode,label] of modes)issues.push(...branchIssues(modeConfig(rule,mode),category).map(issue=>label+'：'+issue));
    return issues;
  }
  function conditionText(rule,category) {
    return (rule.conditions || []).map(condition=>fieldLabel(category,condition.fieldId)+' 是 '+
      (condition.values || []).map(value=>optionLabel(fieldOf(category,condition.fieldId),value)).join(' / ')).join('，并且 ');
  }
  function effectText(rule,category) {
    if(rule.action==='prefill')return fieldLabel(category,rule.targetFieldId)+'：空白时预填 '+(rule.prefillText || '')+(rule.required?'；必须填写':'');
    return fieldLabel(category,rule.targetFieldId)+'：'+(rule.action==='fixed'?'固定为 ':'可选范围 ')+
      (rule.values || []).map(value=>optionLabel(fieldOf(category,rule.targetFieldId),value)).join(' / ')+
      (rule.required?'；必须填写':'；沿用字段原有必填设置');
  }
  function modeSummary(rule,category,render) {
    return configuredModes(rule).map(([mode,label])=>label+'：'+render(modeConfig(rule,mode),category)).join('；');
  }
  function modeSummaryMarkup(rule,category,render) {
    const modes=configuredModes(rule);
    return modes.length ? modes.map(([mode,label])=>'<div class="fl-mode-summary"><span>'+e(label)+'</span>'+e(render(modeConfig(rule,mode),category))+'</div>').join('') : '尚未配置任一呼叫方式';
  }
  function feedback(view,message,isError=false) {
    const node=view.root.querySelector('[data-fl-feedback]');
    if(!node)return;
    node.hidden=!message;node.textContent=message || '';node.classList.toggle('is-error',isError);
  }
  function readState() {
    try {return engine()?.read(DSession.context()) || {ok:false,error:'填写联动规则服务暂不可用。'};}
    catch (_) {return {ok:false,error:'填写联动规则读取失败，原配置未修改。'};}
  }
  async function load(view) {
    const sequence=++view.sequence;
    view.loading=true;view.error='';draw(view);
    const stored=readState();
    let catalog;
    try {catalog=await engine()?.loadCatalog(DSession.context());}
    catch (_) {catalog={ok:false,error:'分配规则和填写字段读取失败。'};}
    if(!active(view) || sequence!==view.sequence)return;
    view.loading=false;
    if(!stored.ok || !catalog?.ok){view.error=stored.error || stored.message || catalog?.error || catalog?.message || '读取失败，请重试。';draw(view);return;}
    view.rules=stored.rules || [];view.revision=stored.revision;view.catalog=catalog;draw(view);
  }
  function accept(view,result,message) {
    if(!result?.ok){feedback(view,result?.error || result?.message || '操作未保存，请重试。',true);return false;}
    view.rules=result.rules || readState().rules || view.rules;
    view.revision=result.revision;draw(view);DUI.toast(message);return true;
  }
  function draw(view) {
    if(!active(view))return;
    const writable=canManage(DSession.context());
    const body=view.root.querySelector('[data-fl-body]');
    if(view.loading){body.innerHTML='<div class="fl-state" role="status">正在读取当前分配规则、填写字段与联动规则…</div>';return;}
    if(view.error){body.innerHTML='<div class="fl-state is-error" role="alert"><h2>暂时无法读取填写联动规则</h2><p>'+e(view.error)+'</p><p>原配置保持不变。</p><button type="button" class="btn" data-fl-reload>重新读取</button></div>';body.querySelector('[data-fl-reload]').onclick=()=>load(view);return;}
    const filters=view.filters,categories=view.catalog?.categories || [],assignments=view.catalog?.assignmentRules || [];
    const assignmentFilters=new Map(assignments.map(rule=>[rule.id,assignmentOption(rule)]));
    for(const rule of view.rules)if(rule.assignmentRuleId && !assignmentFilters.has(rule.assignmentRuleId))assignmentFilters.set(rule.assignmentRuleId,assignmentName(rule,view.catalog)+'（原引用已失效）');
    const matches=view.rules.filter(rule=>{
      const invalid=issuesFor(rule,view.catalog).length>0;
      const state=invalid?'invalid':rule.enabled?'enabled':'disabled';
      const category=sourceFor(rule,view.catalog);
      const text=[rule.name,assignmentName(rule,view.catalog),categoryLabel(categoryOf(view.catalog,rule.categoryId)),modeSummary(rule,category,conditionText),modeSummary(rule,category,effectText)].join(' ').toLowerCase();
      return (!filters.assignment || (filters.assignment==='__unbound__'?!rule.assignmentRuleId:rule.assignmentRuleId===filters.assignment)) &&
        (!filters.category || rule.categoryId===filters.category) && (!filters.status || state===filters.status) &&
        (!filters.keyword || text.includes(filters.keyword.toLowerCase()));
    });
    const pages=Math.max(1,Math.ceil(matches.length/view.pageSize));view.page=Math.min(view.page,pages);
    const records=matches.slice((view.page-1)*view.pageSize,view.page*view.pageSize);
    body.innerHTML=`${writable?'':'<p class="fl-readonly" role="status">当前账号仅可查看规则和预览效果，不能维护配置。</p>'}
      <div class="filter-panel fl-filters"><label class="field"><span>分配规则</span><select data-fl-filter-assignment><option value="">全部分配规则</option><option value="__unbound__"${filters.assignment==='__unbound__'?' selected':''}>待绑定分配规则</option>${[...assignmentFilters].map(([id,label])=>`<option value="${e(id)}"${filters.assignment===id?' selected':''}>${e(label)}</option>`).join('')}</select></label>
        <label class="field"><span>二级分类</span><select data-fl-filter-category><option value="">全部分类</option>${categories.map(category=>`<option value="${e(category.id)}"${filters.category===category.id?' selected':''}>${e(categoryLabel(category))}</option>`).join('')}</select></label>
        <label class="field"><span>状态</span><select data-fl-filter-status>${[['','全部状态'],['enabled','已启用'],['disabled','已停用'],['invalid','待修复']].map(([value,label])=>`<option value="${value}"${filters.status===value?' selected':''}>${label}</option>`).join('')}</select></label>
        <label class="field fl-keyword"><span>关键词</span><input data-fl-filter-keyword maxlength="100" value="${e(filters.keyword)}" placeholder="联动规则、分配规则、字段或条件值"></label>
        <div class="fl-query-actions"><button type="button" class="btn btn-primary" data-fl-query>查询</button><button type="button" class="btn" data-fl-reset>重置</button></div>
      </div>
      <div class="fl-list-toolbar"><span>共 ${matches.length} 条规则</span><div><button type="button" class="btn" data-fl-reload>刷新</button><button type="button" class="btn btn-primary" data-fl-create${!writable?' disabled':''}>新建规则</button></div></div>
      <p data-fl-feedback class="fl-feedback" role="status" hidden></p>
      ${!assignments.length?'<p class="fl-readonly">当前没有可用于配置的分配规则。请先创建并保存可用的分配规则，并在其关联二级分类配置填写字段，再刷新此页。</p>':''}
      <div class="table-card"><div class="table-scroll" role="region" aria-label="填写联动规则列表" tabindex="0"><table class="platform-table fl-table"><thead><tr><th>规则名称</th><th>适用分配规则</th><th>二级分类</th><th>条件摘要</th><th>联动效果</th><th>状态</th><th>更新时间</th><th>操作</th></tr></thead><tbody>
        ${records.length?records.map(rule=>{
          const category=sourceFor(rule,view.catalog),assignment=assignmentOf(view.catalog,rule.assignmentRuleId),issues=issuesFor(rule,view.catalog);
          const versions=[rule.assignmentRuleVersion?'配置时 '+versionLabel(rule.assignmentRuleVersion):'',assignment?.version&&assignment.version!==rule.assignmentRuleVersion?'当前 '+versionLabel(assignment.version):''].filter(Boolean).join(' · ');
          return `<tr data-fl-rule="${e(rule.id)}"><td><strong>${e(rule.name)}</strong><div class="fl-mode-tags">${configuredModes(rule).map(([mode,label])=>`<span data-fl-configured-mode="${mode}">${e(label)}</span>`).join('')}</div>${issues.length?'<small class="fl-repair">待修复：'+e(issues.join('；'))+'</small>':''}</td><td>${e(assignmentName(rule,view.catalog))}${versions?'<small>'+e(versions)+'</small>':''}</td><td>${e(categoryLabel(categoryOf(view.catalog,rule.categoryId)) || '原分类已失效（'+rule.categoryId+'）')}</td><td>${modeSummaryMarkup(rule,category,conditionText)}</td><td>${modeSummaryMarkup(rule,category,effectText)}</td><td><span class="status-badge ${issues.length?'warning':rule.enabled?'success':''}">${issues.length?'待修复':rule.enabled?'已启用':'已停用'}</span>${issues.length?'<small>原状态：'+(rule.enabled?'启用':'停用')+'</small>':''}</td><td>${e(time(rule.updatedAt))}</td><td><div class="table-actions"><button type="button" data-fl-edit="${e(rule.id)}">${writable?'编辑':'查看'}</button>${writable?`<button type="button" data-fl-toggle="${e(rule.id)}"${!rule.enabled && issues.length?' disabled title="修复后才可启用"':''}>${rule.enabled?'停用':'启用'}</button><button type="button" class="fl-delete" data-fl-delete="${e(rule.id)}">删除</button>`:''}</div></td></tr>`;
        }).join(''):`<tr><td colspan="8"><div class="fl-empty"><h2>${view.rules.length?'没有符合条件的规则':'尚未配置填写联动规则'}</h2><p>${view.rules.length?'调整分配规则、分类、状态或关键词后重新查询。':'新建规则 → 选择适用分配规则 → 读取填写字段 → 配置联动。规则保存后才会生效。'}</p>${!view.rules.length?'<p class="fl-example">示例：当回访结果为指定值时，将意向级别限制为所选分配规则填写字段中的部分等级。此处仅作文字说明，不会自动创建规则。</p>':''}</div></td></tr>`}
      </tbody></table></div><div class="fl-pagination"><span>第 ${view.page} / ${pages} 页 · 每页 ${view.pageSize} 条</span><div><button type="button" class="btn" data-fl-page="${view.page-1}"${view.page<=1?' disabled':''}>上一页</button><button type="button" class="btn" data-fl-page="${view.page+1}"${view.page>=pages?' disabled':''}>下一页</button></div></div></div>`;
    body.querySelector('[data-fl-query]').onclick=()=>{
      view.filters={assignment:body.querySelector('[data-fl-filter-assignment]').value,category:body.querySelector('[data-fl-filter-category]').value,status:body.querySelector('[data-fl-filter-status]').value,keyword:body.querySelector('[data-fl-filter-keyword]').value.trim()};view.page=1;draw(view);
    };
    body.querySelector('[data-fl-filter-keyword]').onkeydown=event=>{if(event.key==='Enter'){event.preventDefault();body.querySelector('[data-fl-query]').click();}};
    body.querySelector('[data-fl-reset]').onclick=()=>{view.filters={assignment:'',category:'',status:'',keyword:''};view.page=1;draw(view);};
    body.querySelector('[data-fl-reload]').onclick=()=>load(view);
    body.querySelector('[data-fl-create]').onclick=()=>{
      const context=DSession.context();
      if(!active(view) || !canManage(context))return;
      if(assignments.length)return openEditor(view);
      DUI.dialog('新建填写联动规则','<p>当前租户没有可关联的已启用分配规则。请先维护分配规则，并确认其业务分类已配置填写字段。</p>',[
        {label:'关闭',run:close=>close()},...(DSession.allowed('PAGE-21011',context)?[
          {label:'前往分配规则',primary:true,run:close=>{
            if(!active(view) || !canManage(DSession.context()))return;
            close();DApp.openPage('PAGE-21011',{menuEntry:true});
          }}
        ]:[])
      ],{stack:true,dismissible:true});
    };
    body.querySelectorAll('[data-fl-page]').forEach(button=>button.onclick=()=>{view.page=Number(button.dataset.flPage);draw(view);});
    body.querySelectorAll('[data-fl-edit]').forEach(button=>button.onclick=()=>openEditor(view,view.rules.find(rule=>rule.id===button.dataset.flEdit)));
    body.querySelectorAll('[data-fl-toggle]').forEach(button=>button.onclick=()=>{
      if(!active(view) || !canManage(DSession.context()))return;
      const rule=view.rules.find(item=>item.id===button.dataset.flToggle);
      if(!rule)return;
      let result;try {result=engine().toggle(DSession.context(),{id:rule.id,enabled:!rule.enabled,expectedRevision:view.revision,catalogRevision:view.catalog.revision});}
      catch (_) {result={ok:false,error:'状态未保存，请重试。'};}
      accept(view,result,rule.enabled?'规则已停用。':'规则已启用。');
    });
    body.querySelectorAll('[data-fl-delete]').forEach(button=>button.onclick=()=>removeRule(view,view.rules.find(rule=>rule.id===button.dataset.flDelete)));
  }

  function removeRule(view,rule) {
    if(!rule || !active(view) || !canManage(DSession.context()))return;
    let error;
    const modal=DUI.dialog('删除填写联动规则',`<p>确定删除「${e(rule.name)}」？删除后，新填写内容不再应用此规则。</p><p class="form-error" role="alert" hidden></p>`,[
      {label:'取消',run:close=>close()},
      {label:'删除规则',primary:true,run:close=>{
        if(!active(view) || !canManage(DSession.context()))return;
        let result;try {result=engine().remove(DSession.context(),{id:rule.id,expectedRevision:view.revision});}
        catch (_) {result={ok:false,error:'删除未保存，请重试。'};}
        if(!result?.ok){error.textContent=result?.error || result?.message || '删除未保存。';error.hidden=false;return;}
        close();accept(view,result,'规则已删除。');
      }}
    ],{stack:true,dismissible:true});
    error=modal.element.querySelector('[role="alert"]');
  }

  function openEditor(view,original) {
    if(!active(view))return;
    const readonly=!canManage(DSession.context());
    if(!original && readonly)return;
    const expectedRevision=view.revision,catalog=view.catalog;
    const draft=original?copy(original):{name:'',assignmentRuleId:'',categoryId:'',enabled:false};
    const branches=Object.fromEntries(callModes.map(([mode])=>[mode,copy(modeConfig(original,mode) || emptyBranch())]));
    let selectedMode=modeConfig(original,'ai')?'ai':modeConfig(original,'human')?'human':'ai';
    const current=()=>branches[selectedMode];
    const assignments=catalog.assignmentRules || [],initialAssignment=assignmentOf(catalog,draft.assignmentRuleId);
    const previewByMode={ai:{},human:{}},previewValues=()=>previewByMode[selectedMode];
    const tabBase='fl-call-mode-'+(++editorSequence);
    const modal=DUI.dialog((readonly?'查看':original?'编辑':'新建')+'填写联动规则',`<form class="fl-editor" data-fl-editor novalidate>
      ${readonly?'<p class="fl-readonly">当前为只读查看。可切换呼叫方式，分别预览已配置的填写效果。</p>':''}
      <section data-fl-configuration><div class="fl-editor-grid"><label class="field"><span>规则名称 <b>*</b></span><input name="ruleName" value="${e(draft.name)}" maxlength="60" placeholder="例如：指定回访结果限制意向级别"></label>
        <label class="field"><span>适用分配规则 <b>*</b></span><select name="assignmentRuleId"><option value="">请选择分配规则</option>${draft.assignmentRuleId && !initialAssignment?`<option value="${e(draft.assignmentRuleId)}" disabled selected>${e(assignmentName(draft,catalog))}（原分配规则已失效）</option>`:''}${assignments.map(rule=>`<option value="${e(rule.id)}"${draft.assignmentRuleId===rule.id?' selected':''}>${e(assignmentOption(rule))}</option>`).join('')}</select></label>
        <label class="field"><span>所属二级分类</span><input name="categoryLabel" data-fl-bound-category value="${e(initialAssignment?.categoryLabel || categoryLabel(categoryOf(catalog,draft.categoryId)))}" readonly placeholder="选择分配规则后自动读取"></label></div>
        <p class="fl-help fl-source-help" data-fl-field-source></p>
        <p class="fl-editor-notice" data-fl-editor-notice role="status" hidden></p>
        <div class="fl-mode-tabs" role="tablist" aria-label="呼叫方式">${callModes.map(([mode,label])=>`<button type="button" role="tab" id="${tabBase}-${mode}" aria-controls="${tabBase}-panel" data-fl-mode="${mode}">${label}<span data-fl-mode-state="${mode}"></span></button>`).join('')}</div>
        <p class="fl-help fl-mode-help">两类呼叫方式独立配置，填写其中一边或两边均可。切换 Tab 会保留本次填写。</p>
        <section role="tabpanel" id="${tabBase}-panel" data-fl-mode-panel>
          <div class="fl-mode-panel-heading"><p data-fl-active-mode-label></p><button type="button" class="btn-link fl-delete" data-fl-clear-mode>清空本侧配置</button></div>
          <section class="fl-editor-section"><div class="fl-section-heading"><h3>上游条件</h3><button type="button" class="btn" data-fl-add-condition>添加条件</button></div><p class="fl-help">不同条件之间为“并且（AND）”；同一条件内选择多个值，任意一个匹配即可（OR）。</p><div data-fl-conditions></div></section>
          <section class="fl-editor-section"><h3>下游联动结果</h3><div class="fl-editor-grid"><label class="field"><span>目标字段 <b>*</b></span><select name="targetFieldId"></select></label><label class="field"><span>联动方式 <b>*</b></span><select name="action"></select></label></div><div class="fl-target-values" data-fl-target-values></div>
            <div class="fl-editor-checks"><label><input type="checkbox" name="required">命中后必须填写</label></div><p class="fl-help">“必须填写”仅对本侧配置生效，不会取消字段本身已有的必填设置。</p></section>
          <details class="fl-preview-section" open><summary>预览填写效果（不保存）</summary><p class="fl-help">只预览当前呼叫方式与分配规则内的联动效果，另一侧配置不会参与本次预览。</p><div class="fl-preview-inputs" data-fl-preview-inputs></div><button type="button" class="btn" data-fl-run-preview>预览填写效果</button><section class="fl-preview-result" data-fl-preview-result aria-live="polite"><p>选择分配规则和字段后，输入上游值进行预览。</p></section></details>
        </section>
        <div class="fl-editor-checks fl-rule-enabled"><label><input type="checkbox" name="enabled"${draft.enabled?' checked':''}>启用本规则</label><span class="fl-help">启用后，已配置的一侧或两侧分别用于对应呼叫方式。</span></div>
      </section>
    </form>`,[
      {label:readonly?'关闭':'取消',run:close=>close()},
      ...(!readonly?[{label:'保存规则',primary:true,run:close=>save(close)}]:[])
    ],{stack:true,dismissible:true});
    const dialog=modal.element.querySelector('.d-dialog');dialog.classList.add('fl-dialog');
    const form=modal.element.querySelector('[data-fl-editor]'),config=form.querySelector('[data-fl-configuration]');
    const notice=form.querySelector('[data-fl-editor-notice]');
    const footerMessage=document.createElement('p');footerMessage.className='fl-editor-error';footerMessage.setAttribute('role','alert');footerMessage.hidden=true;dialog.querySelector('footer').prepend(footerMessage);
    const alive=()=>form.isConnected && active(view);
    const category=()=>assignmentOf(catalog,draft.assignmentRuleId);
    function fail(message) {footerMessage.textContent=message;footerMessage.hidden=false;}
    function updateTabs() {
      for(const [mode] of callModes) {
        const tab=form.querySelector('[data-fl-mode="'+mode+'"]'),selected=selectedMode===mode;
        tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;
        const branch=branches[mode];
        form.querySelector('[data-fl-mode-state="'+mode+'"]').textContent=branchEmpty(branch)?'未配置':branchIssues(branch,category()).length?'待补全':'已填写';
      }
      form.querySelector('[data-fl-mode-panel]').setAttribute('aria-labelledby',tabBase+'-'+selectedMode);
      form.querySelector('[data-fl-active-mode-label]').textContent='当前配置：'+modeLabel(selectedMode);
    }
    function changed(message) {
      footerMessage.hidden=true;
      notice.textContent=message || '';notice.hidden=!message;
      form.querySelector('[data-fl-preview-result]').innerHTML='<p>配置或输入已变化，请重新预览；当前草稿尚未保存。</p>';
      updateTabs();setReadonly();
    }
    function fieldOptions(selected,targets=false) {
      const fields=selectable(category(),targets);
      return '<option value="">'+(category()?'请选择字段':'请先选择分配规则')+'</option>'+(!fields.some(field=>field.id===selected) && selected?`<option value="${e(selected)}" disabled selected>${e(fieldLabel(categoryOf(catalog,draft.categoryId),selected))}（待重新选择）</option>`:'')+
        fields.map(field=>`<option value="${e(field.id)}"${selected===field.id?' selected':''}>${e(field.label)}${field.type==='multiselect'?'（多选）':textTypes.has(field.type)?'（文本）':''}</option>`).join('');
    }
    function choices(field,values,attribute) {
      if(!field)return '<p class="fl-help">'+(category()?'请先选择有效字段。':'请先选择分配规则，读取其配置的填写字段。')+'</p>';
      const invalid=(values || []).filter(value=>!field.options.some(option=>option.value===value));
      return `<div class="fl-chips" role="group" aria-label="${e(field.label)}的可选值">${field.options.map(option=>`<label class="fl-chip"><input type="checkbox" ${attribute} value="${e(option.value)}"${values.includes(option.value)?' checked':''}><span>${e(option.label)}</span></label>`).join('')}</div>${invalid.length?`<div class="fl-invalid-values">${invalid.map(value=>`<span>失效选项（${e(value)}）<button type="button" ${attribute.replace('data-fl-','data-fl-remove-')}="${e(value)}" aria-label="移除失效选项${e(value)}">×</button></span>`).join('')}</div><p class="fl-repair">原选项已失效，请明确移除并重新选择。</p>`:''}`;
    }
    function renderConditions() {
      const branch=current(),host=form.querySelector('[data-fl-conditions]');
      host.innerHTML=branch.conditions.map((condition,index)=>`<div class="fl-condition" data-fl-condition="${index}"><div class="fl-condition-heading"><span>条件 ${index+1}${index?' · 并且':''}</span><button type="button" class="btn-link" data-fl-remove-condition="${index}"${branch.conditions.length===1?' disabled':''}>移除</button></div><label class="field"><span>条件字段 <b>*</b></span><select data-fl-condition-field>${fieldOptions(condition.fieldId)}</select></label><div><span class="fl-field-caption">满足以下任一值 <b>*</b></span>${choices(fieldOf(category(),condition.fieldId),condition.values,'data-fl-condition-value')}</div></div>`).join('');
      setReadonly();
    }
    function renderTarget() {
      const branch=current();form.elements.targetFieldId.innerHTML=fieldOptions(branch.targetFieldId,true);form.elements.required.checked=branch.required!==false;
      const field=fieldOf(category(),branch.targetFieldId),host=form.querySelector('[data-fl-target-values]'),isText=textTypes.has(field?.type);
      form.elements.action.innerHTML=isText?'<option value="prefill">预填文本（空白时）</option>':
        '<option value="restrict">限制可选范围</option><option value="fixed">固定为一个值并锁定</option>';
      form.elements.action.value=branch.action;
      if(!field)host.innerHTML='<p class="fl-help">先选择目标字段，再配置联动值。</p>';
      else if(isText){
        const max=textLimit(field);
        const input=field.type==='textarea'?`<textarea data-fl-prefill-text maxlength="${max}" rows="3" placeholder="输入命中规则时的预填文案"></textarea>`:
          `<input type="text" data-fl-prefill-text maxlength="${max}" placeholder="输入命中规则时的预填文案">`;
        host.innerHTML='<label class="field"><span>预填文案 <b>*</b></span>'+input+'</label><p class="fl-help">仅在目标字段为空时填写，不锁定，不覆盖已有内容。</p>';
        host.querySelector('[data-fl-prefill-text]').value=branch.prefillText || '';
      } else if(branch.action==='fixed'){
        const invalid=branch.values.length!==1 || !field.options.some(option=>option.value===branch.values[0]);
        host.innerHTML=`<label class="field"><span>固定值 <b>*</b></span><select data-fl-fixed-value><option value="">请选择固定值</option>${branch.values.length===1 && invalid?`<option value="${e(branch.values[0])}" disabled selected>原固定值已失效（${e(branch.values[0])}）</option>`:''}${field.options.map(option=>`<option value="${e(option.value)}"${branch.values.length===1 && branch.values[0]===option.value?' selected':''}>${e(option.label)}</option>`).join('')}</select></label>${branch.values.length>1?'<p class="fl-repair">原选择包含多个值，固定方式只能保留一项，请明确重新选择。</p>':''}<p class="fl-help">命中时自动填写此值并锁定，显示规则名称作为原因。</p>`;
      } else host.innerHTML='<span class="fl-field-caption">允许选择的范围 <b>*</b></span>'+choices(field,branch.values,'data-fl-target-value')+'<p class="fl-help">命中时只保留此范围内的选项；已有范围内值继续保留，范围外值将提示清理并重选。</p>';
      setReadonly();
    }
    function renderPreviewInputs() {
      const fields=[...new Set(current().conditions.map(condition=>condition.fieldId))].map(id=>fieldOf(category(),id)).filter(Boolean),values=previewValues();
      form.querySelector('[data-fl-preview-inputs]').innerHTML=fields.length?fields.map(field=>`<label class="field"><span>${e(field.label)}${field.type==='multiselect'?'（可多选）':''}</span><select data-fl-preview-field="${e(field.id)}"${field.type==='multiselect'?' multiple size="3"':''}>${field.type==='multiselect'?'':'<option value="">未填写</option>'}${field.options.map(option=>`<option value="${e(option.value)}"${(Array.isArray(values[field.id])?values[field.id]:[values[field.id]]).includes(option.value)?' selected':''}>${e(option.label)}</option>`).join('')}</select></label>`).join(''):'<p class="fl-help">配置有效的上游条件后，这里显示可输入的字段。</p>';
    }
    function setReadonly() {
      const assignment=category();
      config.querySelectorAll('input,textarea,select,button').forEach(control=>{
        if(control.hasAttribute('data-fl-mode'))return;
        if(control.closest('.fl-preview-section')){control.disabled=!assignment;return;}
        control.disabled=readonly || !assignment && Boolean(control.closest('[data-fl-mode-panel]')) ||
          control.hasAttribute('data-fl-remove-condition') && current().conditions.length===1;
      });
      form.querySelector('[data-fl-run-preview]').disabled=!assignment;
      form.querySelector('[data-fl-clear-mode]').disabled=readonly || !assignment || branchEmpty(current());
    }
    function renderSource() {
      const assignment=category();form.elements.categoryLabel.value=assignment?.categoryLabel || categoryLabel(categoryOf(catalog,draft.categoryId));
      form.querySelector('[data-fl-field-source]').textContent=assignment ? '填写字段来源：'+assignment.name+'（'+versionLabel(assignment.version)+'） → '+
        (assignment.categoryLabel || categoryLabel(categoryOf(catalog,assignment.categoryId)))+'的填写配置。'+
        (selectable(assignment).length?'上游可选 '+selectable(assignment).length+' 个枚举字段，下游还可选择文本字段。':'当前没有有效的上游枚举字段，请先维护该分配规则关联分类的填写配置。') :
        '请先选择适用分配规则；条件字段、目标字段和枚举均从该规则已关联的填写配置读取。';
    }
    function selectMode(mode,focus=false) {
      if(!callModes.some(([key])=>key===mode))return;
      selectedMode=mode;renderConditions();renderTarget();renderPreviewInputs();updateTabs();
      form.querySelector('[data-fl-preview-result]').innerHTML='<p>当前为'+e(modeLabel(mode))+'。输入本侧上游值后预览；另一侧草稿已保留。</p>';
      if(focus)form.querySelector('[data-fl-mode="'+mode+'"]').focus({preventScroll:true});
    }
    function canonicalDraft() {
      const result={...copy(draft),modeConfigs:Object.fromEntries(callModes.map(([mode])=>[mode,branchEmpty(branches[mode])?null:copy(branches[mode])]))};
      for(const key of ['conditions','targetFieldId','action','values','required','prefillText'])delete result[key];
      return result;
    }
    form.elements.ruleName.addEventListener('input',()=>{draft.name=form.elements.ruleName.value;changed();});
    form.elements.assignmentRuleId.addEventListener('change',()=>{
      if(readonly)return;draft.assignmentRuleId=form.elements.assignmentRuleId.value;const assignment=category();
      draft.categoryId=assignment?.categoryId || '';draft.assignmentRuleName=assignment?.name || '';draft.assignmentRuleVersion=assignment?.version || '';
      for(const [mode] of callModes){branches[mode]=emptyBranch();previewByMode[mode]={};}
      renderSource();selectMode(selectedMode);changed('适用分配规则已切换，两类呼叫方式的原条件字段、条件值、目标字段及联动值已清空，请重新配置。');
    });
    form.querySelectorAll('[data-fl-mode]').forEach(tab=>{
      tab.onclick=()=>selectMode(tab.dataset.flMode);
      tab.onkeydown=event=>{
        if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
        event.preventDefault();const index=callModes.findIndex(([mode])=>mode===selectedMode);
        const next=event.key==='Home'?0:event.key==='End'?callModes.length-1:(index+(event.key==='ArrowRight'?1:callModes.length-1))%callModes.length;
        selectMode(callModes[next][0],true);
      };
    });
    form.querySelector('[data-fl-clear-mode]').onclick=()=>{if(readonly)return;branches[selectedMode]=emptyBranch();previewByMode[selectedMode]={};selectMode(selectedMode);changed(modeLabel(selectedMode)+'配置已清空，另一侧配置保留；保存时至少保留一侧完整配置。');};
    form.querySelector('[data-fl-add-condition]').onclick=()=>{if(readonly)return;current().conditions.push({fieldId:'',values:[]});renderConditions();changed();};
    const conditionsHost=form.querySelector('[data-fl-conditions]');
    conditionsHost.addEventListener('click',event=>{
      if(readonly)return;const remove=event.target.closest('[data-fl-remove-condition]');
      if(remove && current().conditions.length>1){current().conditions.splice(Number(remove.dataset.flRemoveCondition),1);renderConditions();renderPreviewInputs();changed();return;}
      const invalid=event.target.closest('[data-fl-remove-condition-value]');if(invalid){const condition=current().conditions[Number(invalid.closest('[data-fl-condition]').dataset.flCondition)];condition.values=condition.values.filter(value=>value!==invalid.dataset.flRemoveConditionValue);renderConditions();changed();}
    });
    conditionsHost.addEventListener('change',event=>{
      if(readonly)return;const node=event.target.closest('[data-fl-condition]');if(!node)return;const condition=current().conditions[Number(node.dataset.flCondition)];
      if(event.target.matches('[data-fl-condition-field]')){condition.fieldId=event.target.value;condition.values=[];renderConditions();renderPreviewInputs();changed('条件字段已切换，请重新选择对应条件值。');}
      else if(event.target.matches('[data-fl-condition-value]')){const valid=[...node.querySelectorAll('[data-fl-condition-value]:checked')].map(input=>input.value),field=fieldOf(category(),condition.fieldId);condition.values=[...valid,...condition.values.filter(value=>!field.options.some(option=>option.value===value))];changed();}
    });
    form.elements.targetFieldId.addEventListener('change',()=>{
      if(readonly)return;
      const branch=current();
      branch.targetFieldId=form.elements.targetFieldId.value;branch.values=[];delete branch.prefillText;
      if(textTypes.has(fieldOf(category(),branch.targetFieldId)?.type))branch.action='prefill';
      else if(branch.action==='prefill')branch.action='restrict';
      renderTarget();changed('目标字段已切换，请重新配置联动结果。');
    });
    form.querySelector('[data-fl-target-values]').addEventListener('input',event=>{
      if(readonly || !event.target.matches('[data-fl-prefill-text]'))return;
      current().prefillText=event.target.value;changed();
    });
    form.elements.action.addEventListener('change',()=>{if(readonly)return;current().action=form.elements.action.value;renderTarget();changed();});
    form.querySelector('[data-fl-target-values]').addEventListener('change',event=>{
      if(readonly)return;const branch=current();
      if(event.target.matches('[data-fl-fixed-value]'))branch.values=event.target.value?[event.target.value]:[];
      else if(event.target.matches('[data-fl-target-value]')){const field=fieldOf(category(),branch.targetFieldId);branch.values=[...form.querySelectorAll('[data-fl-target-value]:checked')].map(input=>input.value).concat(branch.values.filter(value=>!field.options.some(option=>option.value===value)));}
      changed();
    });
    form.querySelector('[data-fl-target-values]').addEventListener('click',event=>{const button=event.target.closest('[data-fl-remove-target-value]');if(!button || readonly)return;current().values=current().values.filter(value=>value!==button.dataset.flRemoveTargetValue);renderTarget();changed();});
    form.elements.required.addEventListener('change',()=>{current().required=form.elements.required.checked;changed();});
    form.elements.enabled.addEventListener('change',()=>{draft.enabled=form.elements.enabled.checked;changed();});
    form.querySelector('[data-fl-preview-inputs]').addEventListener('change',event=>{const input=event.target.closest('[data-fl-preview-field]');if(!input)return;previewValues()[input.dataset.flPreviewField]=input.multiple?[...input.selectedOptions].map(option=>option.value):input.value;changed();});
    form.querySelector('[data-fl-run-preview]').onclick=()=>{
      if(!alive())return;const resultHost=form.querySelector('[data-fl-preview-result]'),branch=current();
      const issues=!category()?['请先选择适用分配规则']:branchEmpty(branch)?['当前呼叫方式尚未配置']:branchIssues(branch,category());
      if(issues.length){resultHost.innerHTML='<p class="fl-repair">'+e(modeLabel(selectedMode))+'：请先补齐或修复配置：'+e(issues.join('；'))+'</p>';return;}
      const temporary={...canonicalDraft(),id:draft.id || '__field_linkage_preview__',name:draft.name.trim() || '当前草稿',enabled:true,
        modeConfigs:{ai:null,human:null,[selectedMode]:copy(branch)}};
      let result;try {result=engine().compute({rules:[...view.rules.filter(rule=>rule.id!==draft.id),temporary],categoryId:draft.categoryId,
        assignmentRuleId:draft.assignmentRuleId,assignmentRuleVersion:category().version,callMode:selectedMode,fields:category().fields,values:copy(previewValues())});}
      catch (_) {result={ok:false,errors:['预览暂不可用，请重试。']};}
      const errors=(result.errors || []).map(item=>typeof item==='string'?item:item.message || item.error || String(item));
      if(!result.ok || errors.length){resultHost.innerHTML='<p class="fl-repair">'+e(errors.join('；') || result.error || '配置之间存在冲突，请修复后预览。')+'</p>';return;}
      const target=fieldOf(category(),branch.targetFieldId),constraint=result.constraints?.[target.id],matched=result.matchedRuleIds?.includes(temporary.id),allowed=constraint?.allowedValues || target.options.map(option=>option.value),fixed=constraint?.fixedValue;
      if(branch.action==='prefill'){
        resultHost.innerHTML=`<strong>${e(modeLabel(selectedMode))} · ${matched?'本条规则命中':'本条规则未命中'}</strong><dl><div><dt>下游字段</dt><dd>${e(target.label)}</dd></div><div><dt>空白时预填</dt><dd>${e(result.values?.[target.id] || '不预填')}</dd></div><div><dt>是否必填</dt><dd>${constraint?.required || target.required?'是':'否'}</dd></div></dl><p class="fl-help">已有内容不会被覆盖；当前仅预览，尚未保存。</p>`;
        return;
      }
      resultHost.innerHTML=`<strong>${e(modeLabel(selectedMode))} · ${matched?'本条规则命中':'本条规则未命中'}</strong><p>${e(matched?conditionText(branch,category()):'当前上游输入尚未同时满足本条全部条件。')}</p><dl><div><dt>下游字段</dt><dd>${e(target.label)}</dd></div><div><dt>可选范围</dt><dd>${e(allowed.map(value=>optionLabel(target,value)).join(' / ') || '无可用值')}</dd></div><div><dt>固定锁定</dt><dd>${fixed!=null?e(optionLabel(target,fixed))+'（只读）':'不锁定'}</dd></div><div><dt>是否必填</dt><dd>${constraint?.required || target.required?'是':'否'}</dd></div></dl>${constraint?.ruleNames?.length?'<p class="fl-help">共同生效规则：'+e(constraint.ruleNames.join('、'))+'</p>':''}<p class="fl-help">仅预览当前呼叫方式，尚未保存。</p>`;
    };
    function save(close) {
      if(!alive() || !canManage(DSession.context()))return fail('当前权限或使用范围已变化，请重新打开。');
      draft.name=form.elements.ruleName.value.trim();if(!draft.name)return fail('请填写规则名称。');
      const resultDraft=canonicalDraft();
      for(const [mode,label] of callModes){const branch=resultDraft.modeConfigs[mode];if(!branch)continue;const issues=branchIssues(branch,category());if(issues.length){selectMode(mode);return fail(label+'：'+issues.join('；'));}}
      const issues=issuesFor(resultDraft,catalog);if(issues.length)return fail(issues.join('；'));
      let result;try {result=engine().save(DSession.context(),{rule:resultDraft,expectedRevision,catalogRevision:catalog.revision});}
      catch (_) {result={ok:false,error:'规则未保存，当前草稿已保留，请重试。'};}
      if(!result?.ok)return fail(result?.error || result?.message || '规则未保存。');close();accept(view,result,'填写联动规则已保存。');
    }
    form.onsubmit=event=>{event.preventDefault();if(!readonly)modal.buttons.at(-1).click();};
    renderSource();selectMode(selectedMode);setReadonly();
    const initialIssues=original?issuesFor(draft,catalog):[];
    if(initialIssues.length){notice.textContent='此规则待修复：'+initialIssues.join('；')+'。原引用已保留，不会自动替换。'+
      (!draft.assignmentRuleId?'原配置：'+modeSummary(draft,categoryOf(catalog,draft.categoryId),conditionText)+' → '+modeSummary(draft,categoryOf(catalog,draft.categoryId),effectText)+'。选择分配规则后重新配置。':'');notice.hidden=false;}
  }


  if(!DNav.pages.some(page=>page.id===pageId))DNav.pages.push({id:pageId,name:'填写联动规则',area:'业务&客户',group:'业务配置',route:'',menu:true,module:'public',phoneDomain:'outside'});
  const previousPage=DRolePermissions.page;
  DRolePermissions.page=(id,context,seat)=>id===pageId?canView(context):previousPage(id,context,seat);
  const previousWritable=DRolePermissions.writable;
  DRolePermissions.writable=(id,context,seat)=>id===pageId?canManage(context):previousWritable(id,context,seat);
  window.Pages ||= {};
  Pages[pageId]={
    render:()=>'<section class="platform-page field-linkage-page" data-field-linkage-page><header class="d-page-heading"><h1>填写联动规则</h1><p>按分配规则设置适用范围，从其关联的填写配置读取字段，设置上游值如何限制下游填写范围或固定值。</p></header><div data-fl-body><p role="status">正在读取填写联动规则…</p></div></section>',
    init(context) {
      const root=document.querySelector('[data-field-linkage-page]');if(!root || !canView(context))return;
      const view={root,scope:scopeKey(context),catalog:null,rules:[],revision:0,sequence:0,loading:false,error:'',filters:{assignment:'',category:'',status:'',keyword:''},page:1,pageSize:10};
      void load(view);
    }
  };
})();
