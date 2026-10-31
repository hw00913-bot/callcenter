"""Asserted source hooks for category-bound, first-match template versions. No writes."""
def one(code,before,after):
    if code.count(before)!=1: raise ValueError('Routing source conflict: '+before[:110])
    return code.replace(before,after,1)

def transform(kind,path,code):
    if kind=='cloud' and path=='js/components/customer-followup.js':
        before="    return '<input' + start + ' type=\"' + inputType"
        after="    const routingTimeHint=field.type==='datetime'&&call?.businessFlowRoutingFields?.schema===1?'<p class=\"field-hint\">日期和时间按北京时间（UTC+08:00）保存。</p>':'';\n    return routingTimeHint+'<input' + start + ' type=\"' + inputType"
        code=one(code,before,after)
        # datetime-local input must use its declared saving timezone even if the
        # browser is elsewhere (including that browser's daylight-saving gaps).
        before="          const date = new Date(field.type === 'date' ? value + 'T00:00:00' : value);"
        after="          const routingTime=field.type==='datetime'&&call?.businessFlowRoutingFields?.schema===1;\n          const date = new Date(field.type === 'date' ? value + 'T00:00:00' : routingTime?value+':00+08:00':value);"
        code=one(code,before,after)
        before="          const components = [date.getFullYear(),date.getMonth()+1,date.getDate(),date.getHours(),date.getMinutes()].slice(0,field.type === 'date' ? 3 : 5);"
        after="          const fixed=new Date(date.getTime()+8*3600000);\n          const components = (routingTime?[fixed.getUTCFullYear(),fixed.getUTCMonth()+1,fixed.getUTCDate(),fixed.getUTCHours(),fixed.getUTCMinutes()]:[date.getFullYear(),date.getMonth()+1,date.getDate(),date.getHours(),date.getMinutes()]).slice(0,field.type === 'date' ? 3 : 5);"
        return one(code,before,after)
    if kind=='cloud' and path=='js/components/business-configuration-usage.js':
        return one(code,"      for(const record of unified?.records||[])","""      for(const template of unified?.templates||[]){
        if(!model.canManageBrand(template.brandId))continue;
        const owner=model.brandScope(template.brandId);if(!owner.ok){issue('模板分类引用');continue;}
        for(const version of template.versions||[]){
          if(version.routingPolicy!=='FIRST_MATCH_V1')continue;
          if(!version.categoryRef?.categoryId||version.categoryRef.brandId!==template.brandId){issue('模板分类引用');continue;}
          category(version.categoryRef.categoryId,owner.scope,{kind:'configuration',source:'conditional-template',sourceLabel:'流转模板分类引用',objectId:template.templateId,version:version.version,blocking:true,message:'流转模板 '+(version.name||template.templateId)+' V'+version.version+' 已关联此分类'});
        }
      }
      for(const record of unified?.records||[])""")
    if kind!='cloud' or path!='js/components/business-flow-store.js': return code
    code=one(code,'  function cleanTemplate(s,input){',"  function cleanTemplate(s,input){\n    requireThat((Array.isArray(input.nodes)?input.nodes:[]).filter(n=>n?.type==='PROCESS').every(n=>Array.isArray(n.methods)&&n.methods.length===1&&['AI','PREDICTIVE','MANUAL'].includes(n.methods[0])),'METHOD_SINGLE','每个处理节点请选择且仅选择一种处理方式（AI、预外呼或人工）');\n    if(input.routingPolicy==='FIRST_MATCH_V1')return cleanRoutingTemplate(s,input);")
    code=one(code,'  function evaluationsRaw(s,r,a=access()){',"  function evaluationsRaw(s,r,a=access()){\n    if(templateVersion(s,r.templateRef).routingPolicy==='FIRST_MATCH_V1')return routingEvaluations(s,r,a);")
    code=one(code,"    const available=fields.filter(f=>f.enabled!==false&&f.type==='multiselect'&&category.fields.some(ref=>ref.fieldId===f.id&&ref.enabled!==false));", "    const chosen=templateVersion(s,data.main);if(chosen.routingPolicy==='FIRST_MATCH_V1'){const current=routingCatalogRaw(input.brandId,category.id);requireThat(chosen.categoryRef?.categoryId===category.id&&JSON.stringify(chosen.categoryRef)===JSON.stringify(current.categoryRef),'ROUTE_CATEGORY_STALE','模板关联分类或字段版本已变化，请保存兼容新模板版本');return {main:data.main,backup:null,mappings:[]};}\n    const available=fields.filter(f=>f.enabled!==false&&f.type==='multiselect'&&category.fields.some(ref=>ref.fieldId===f.id&&ref.enabled!==false));")
    code=one(code,"versions:[{version,baseVersion:version,routeVersion:","versions:[{version,baseVersion:version,categoryRef:routingCategoryRef(id,c,cfg),fieldsVersion:CustomerBusiness.routingFieldsVersion(c,cfg.fields),routeVersion:")
    code=one(code,"    return {call,values,fields:clone(schema.fields),revision:r.revision,tagContext,fieldContexts};", "    if(templateVersion(s,seg.templateRef).routingPolicy==='FIRST_MATCH_V1')call.businessFlowRoutingFields={schema:1,timeZone:'Asia/Shanghai'};\n    return {call,values,fields:clone(schema.fields),revision:r.revision,tagContext,fieldContexts};")
    code=one(code,"if(seg.saved)return seg;const call=flowCall(r,seg);let values,fieldSnapshot;", "if(seg.saved)return seg;const call=flowCall(r,seg);if(templateVersion(s,seg.templateRef).routingPolicy==='FIRST_MATCH_V1')call.businessFlowRoutingFields={schema:1,timeZone:'Asia/Shanghai'};let values,fieldSnapshot;")
    code=one(code,"    applyResult(seg,input.summary||'本段人工业务信息已保存',seg.endedAt);", "    captureRoutingFields(s,r,round,seg,input,values||input.values);\n    applyResult(seg,input.summary||'本段人工业务信息已保存',seg.endedAt);")
    code=one(code,'  function captureCallEvidence(r,round,seg,input){', '  function captureCallEvidence(r,round,seg,input){\n    captureRoutingEvidence(r,round,seg,input);')
    code=one(code,"if(previous){requireThat(previous.type===input.type,'EVENT_CONFLICT','同一事件编号不能用于不同类型');return seg;}","if(previous){requireThat(previous.type===input.type&&(templateVersion(s,seg.templateRef).routingPolicy!=='FIRST_MATCH_V1'||(previous.routingSignature||JSON.stringify(null))===JSON.stringify(input.routingEvidence||null)),'EVENT_CONFLICT','同一事件编号不能用于不同类型或条件证据');return seg;}")
    code=one(code,"seg.events.push({eventId:input.eventId,type:input.type,occurredAt:at});", "seg.events.push({eventId:input.eventId,type:input.type,occurredAt:at,...(input.routingEvidence?{routingSignature:JSON.stringify(input.routingEvidence)}:{})});")
    code=one(code,"    if(edge.conditions.enabled)requireThat(opts.expectedEvaluationToken", "    if(edge.conditions.enabled||templateVersion(s,r.templateRef).routingPolicy==='FIRST_MATCH_V1')requireThat(opts.expectedEvaluationToken")
    code=one(code,"requireThat(next,'PATH_INVALID','目标不是固定模板允许的本租户后续节点');enter(s,r,r.templateRef,next.nodeId,'ADVANCE');","requireThat(next,'PATH_INVALID','目标不是固定模板允许的本租户后续节点');if(next.type!=='TRANSFER')previousSaved(r);enter(s,r,r.templateRef,next.nodeId,'ADVANCE');")
    code=one(code,"try{noRunning(r);}catch(_){selectable=false;}","try{noRunning(r);if(n.type!=='TRANSFER'&&nodeOf(s,r.templateRef,e.toNodeId).type!=='TRANSFER')previousSaved(r);}catch(_){selectable=false;}")
    code=one(code,'上一处理段须实际结束且结果已保存，才能启动下一方式','上一处理段须实际结束且结果已保存，才能启动下一方式或进入下一节点')
    marker='  window.BusinessFlowStore={'
    at=code.index(marker)
    helper=__import__('pathlib').Path(__file__).with_name('flow-routing-store.js').read_text()
    code=code[:at]+helper+'\n'+code[at:]
    return one(code,marker,marker+'routingCatalog,validateRoutingTemplate,')
