"""Current-template maintenance for the four-node planning model."""
import re


def one(code, before, after):
    if code.count(before) != 1:
        raise ValueError('Template lifecycle source conflict: ' + before[:140])
    return code.replace(before, after, 1)


STORE = r'''
  function pendingTemplateRequests(s,t,categories){
    const runtimeKinds=new Set(['import','assign','assignMany','start','startMany','event','saveResult','advance','transfer','correctValues','abandon','reopen','reclassify','saveContactPolicy','handoffReview','completeDirect','resumeDirect','enableFlow']);
    const configurationKinds=new Set(['saveCategory','saveTemplate','deleteTemplate','saveRoute','saveRouting']);
    const requests=s.requests.filter(q=>q.configuration===true||configurationKinds.has(q.kind)||q.configuration!==false&&!runtimeKinds.has(q.kind));
    return allPendingTemplateRequests({...s,requests},t,categories);
  }
  function templateUsageRaw(s,t){
    const config=configurationReferences(t.brandId),references=[];
    for(const row of config.catalog.rows)if(containsTemplateRef(row.flowBinding,t.templateId))references.push({kind:'category',label:'业务分类「'+row.label+'」的当前流程',count:1});
    for(const source of config.sources)if(containsTemplateRef(source.row,t.templateId))references.push({kind:'pending',label:source.label,count:1});
    const pendingCount=pendingTemplateRequests(s,t,projectedCategories(s,t.brandId)).length;if(pendingCount)references.push({kind:'pending',label:'尚待核对的配置请求',count:pendingCount});
    const data={templateId:t.templateId,brandId:t.brandId,name:t.name,latestVersion:t.latestVersion,canDelete:references.length===0,references};
    data.fingerprint=usageFingerprint({configuration:config.token,...data});
    return {data,configurationToken:config.token};
  }
  function deleteTemplate(input,opts={}){
    let configurationToken;
    return commit('deleteTemplate',null,input,opts,(s,a)=>{
      configGuard(input.brandId);const template=s.templates.find(t=>t.templateId===input.templateId);
      requireThat(template&&template.brandId===input.brandId,'TEMPLATE_MISSING','模板不存在或不在当前品牌');
      requireThat(Number(opts.expectedVersion)===template.latestVersion,'STALE_VERSION','当前配置已变化，请重新打开后核对');
      const inspected=templateUsageRaw(s,template),usage=inspected.data;configurationToken=inspected.configurationToken;
      requireThat(usage.canDelete,'TEMPLATE_REFERENCED','当前分类关联或配置操作仍在使用此模板：'+usage.references.map(r=>r.label+'（'+r.count+'）').join('；'));
      requireThat(opts.expectedUsageFingerprint===undefined||opts.expectedUsageFingerprint===usage.fingerprint,'STALE_USAGE','模板关联已变化，请重新核对');
      s.templates=s.templates.filter(t=>t.templateId!==template.templateId);s.deletedTemplateIds.push(template.templateId);
      return {templateId:template.templateId,brandId:template.brandId,name:template.name,deleted:true,latestVersion:template.latestVersion,historyRetained:false};
    },()=>requireThat(configurationReferences(input.brandId).token===configurationToken,'STALE_USAGE','分类关联已变化，请重新核对后删除'));
  }
'''


DELETE_UI = r'''
  function drawDelete(){
    if(!deletion)return;const d=deletion,u=d.usage,references=u?.references||[],allowed=u?.canDelete===true;
    const list=rows=>'<ul>'+rows.map(ref=>'<li>'+e(ref.label||ref.kind)+(ref.count!==undefined?' · '+e(ref.count)+' 处':'')+'</li>').join('')+'</ul>';
    const reason=!u?message(d.status||'暂时无法核对当前关联，请返回列表后重试。'):allowed?'<div class="fc-note">确认删除此模板？当前分类仍在使用时不能删除。已经启动的运行保留自身流程快照。</div>':'<div class="fc-delete-blocked" role="status"><strong>当前仍有配置在使用此模板，暂不能删除</strong><p>当前分类关联请先在“业务分类 → 路由配置”更换；配置操作待核时，请先核对原保存或删除结果。</p>'+list(references)+'</div>';
    const status=d.status?message(d.status,d.statusKind):'';
    const simulation=allowed?'<details class="fc-simulation"><summary>本地模拟场景</summary>'+field('本次删除响应','<select id="fcDeleteOutcome" onchange="FlowConfiguration.setDeleteOutcome(this.value)">'+options([{value:'success',label:'明确删除成功'},{value:'fail',label:'明确删除失败'},{value:'unknown-committed',label:'已删除，响应待核'},{value:'unknown-uncommitted',label:'未删除，响应待核'},{value:'unknown-pending',label:'结果仍待核'}],d.outcome)+'</select>')+'</details>':'';
    ui.openLayer(deleteLayerId,'<div class="layer-header"><h2>删除流转模板</h2><button aria-label="关闭" onclick="FlowConfiguration.closeDelete()">×</button></div><div class="layer-body fc-delete-body"><dl class="fc-delete-facts"><div><dt>模板名称</dt><dd>'+e(u?.name||d.name)+'</dd></div><div><dt>所属品牌</dt><dd>'+e(d.brandName||d.brandId)+'</dd></div></dl>'+reason+simulation+'<div id="fcDeleteStatus">'+status+'</div></div><div class="layer-footer"><button class="btn" onclick="FlowConfiguration.closeDelete()"'+(d.busy?' disabled':'')+'>'+(d.pending?'关闭':'取消')+'</button>'+(d.pending?'<button id="fcDeleteReconcile" class="btn btn-primary" onclick="FlowConfiguration.reconcileDelete()">核对同次删除结果</button>':'<button id="fcDeleteConfirm" class="btn btn-danger" data-local-action="delete-template" onclick="FlowConfiguration.confirmDelete()"'+(!allowed||d.busy?' disabled':'')+'>'+(d.busy?'正在提交…':'确认删除')+'</button>')+'</div>','small fc-delete-dialog',{objectKey:'delete-flow-template-'+d.templateId,onBackdropClick:()=>closeDelete()});
    if(d.pending||d.busy)document.querySelectorAll('#'+deleteLayerId+' .layer-body input,#'+deleteLayerId+' .layer-body select,#'+deleteLayerId+' .layer-body button').forEach(el=>{el.disabled=true;});
  }
'''


def transform(kind, path, code):
    if kind != 'cloud':
        return code
    if path == 'js/components/business-flow-store.js':
        for name, renamed in [('pendingTemplateRequests','allPendingTemplateRequests'),('templateUsageRaw','retainedTemplateUsageRaw'),('deleteTemplate','retainedDeleteTemplate')]:
            code=one(code,'  function '+name+'(','  function '+renamed+'(')
        code=one(code,'  window.BusinessFlowStore={',STORE+'\n  window.BusinessFlowStore={')
    if path == 'js/pages/flow-configuration.js':
        start=code.index('  function drawDelete(')
        match=re.search(r'\n  function ',code[start+20:])
        if not match:raise ValueError('Template delete UI boundary missing')
        end=start+20+match.start()
        code=code[:start]+DELETE_UI.strip('\n')+'\n'+code[end:]
        code=one(code,'deletion={templateId:id,brandId,scopeKey,','deletion={templateId:id,brandId,brandName:data.data.brands.find(row=>(row.brandId||row.id)===brandId)?.name||brandId,scopeKey,')
        code=one(code,"text:'模板“'+(target.usage?.name || target.name)+'”已删除。'", "text:'模板“'+(target.usage?.name || target.name)+'”已删除。'")
        code=one(code,"showToast('模板已删除','success')", "showToast('模板已删除','success')")
    return code
