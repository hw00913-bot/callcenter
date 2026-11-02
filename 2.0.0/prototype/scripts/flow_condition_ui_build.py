"""Pure flow-editor fixes for independent import conditions and latest categories.

Saved versions remain immutable.  Editable drafts refresh only their category
catalog/ref; stable node, edge, field and comparison identities are retained.
"""
import re


def one(code, before, after):
    if code.count(before) != 1:
        raise ValueError('Flow condition UI source conflict: ' + before[:150])
    return code.replace(before, after, 1)


def function(code, name, replacement):
    marker = '  function ' + name + '('
    if code.count(marker) != 1:
        raise ValueError('Flow condition UI function conflict: ' + name)
    start = code.index(marker)
    match = re.search(r'^  (?:async )?function ', code[start + len(marker):], re.M)
    if not match:
        raise ValueError('Flow condition UI end boundary missing: ' + name)
    end = start + len(marker) + match.start()
    return code[:start] + replacement.strip('\n') + '\n' + code[end:]


HELPERS = r'''
  function categoryRuleIssues(values,data,previous={}) {
    const issues=[];
    for(const edge of values.edges||[])for(const rule of edge.conditions?.rules||[]){
      if(!['IMPORT','FOLLOWUP'].includes(rule.source)||!rule.fieldId)continue;
      const field=(data.fields||[]).find(item=>item.source===rule.source&&(item.id||item.fieldId)===rule.fieldId),old=(previous.fields||[]).find(item=>item.source===rule.source&&(item.id||item.fieldId)===rule.fieldId),remembered=editor?.categoryFieldLabels?.[rule.source+':'+rule.fieldId],label=field?.label||old?.label||remembered?.label||rule.fieldId,prefix=(rule.source==='IMPORT'?'导入字段':'填写字段')+'“'+label+'”';
      if(!field||field.enabled===false){issues.push({edgeId:edge.edgeId,ruleId:rule.ruleId,message:prefix+'在字段参考分类中已移除、停用或不可用，请调整此条件；原字段引用和比较值已保留。'});continue;}
      if(['select','multiselect','enum'].includes(field.type)){
        const options=field.options||[],values=Array.isArray(rule.values)?rule.values:Array.isArray(rule.optionIds)?rule.optionIds:[],invalid=values.filter(value=>!options.some(option=>option.enabled!==false&&String(option.id)===String(value)));
        if(invalid.length)issues.push({edgeId:edge.edgeId,ruleId:rule.ruleId,message:prefix+'的比较选项 '+invalid.map(value=>(old?.options||[]).find(option=>String(option.id)===String(value))?.label||remembered?.options?.[value]||String(value)).join('、')+' 在当前分类中已停用或不存在，请核对；原比较值已保留。'});
      }
    }
    return issues;
  }
  function refreshTemplateCategory(settings={}) {
    if(!editor)return {status:'failed',message:'模板编辑上下文不可用。'};
    if(editor.readOnly)return editor.values.routingCatalog?{status:'success',data:clone(editor.values.routingCatalog),historical:true}:{status:'success',historical:true};
    if(editor.busy||editor.pending)return {status:'pending',message:'保存办理中，保留本次提交的字段参考分类与条件。'};
    if(settings.capture!==false)readValues();
    const id=settings.categoryId||editor.values.categoryRef?.categoryId;
    if(!id)return {status:'failed',message:'请先选择字段参考分类。'};
    let result;try{result=S()?.routingCatalog?.(editor.brandId,id);}catch(error){result={status:'failed',message:error.message};}
    if(result?.status!=='success'||!result.data?.categoryRef){editor.categoryReadIssue=result?.message||'字段参考分类的字段暂时无法读取，原草稿保留。';return result||{status:'failed',message:editor.categoryReadIssue};}
    const previous=editor.values.routingCatalog||{};
    editor.categoryFieldLabels||={};for(const field of [...(previous.fields||[]),...(result.data.fields||[])]){const key=field.source+':'+(field.id||field.fieldId),remembered=editor.categoryFieldLabels[key]||{};editor.categoryFieldLabels[key]={label:field.label||remembered.label,options:{...(remembered.options||{}),...Object.fromEntries((field.options||[]).map(option=>[option.id,option.label]))}};}
    editor.categoryFieldIssues=categoryRuleIssues(editor.values,result.data,previous);
    editor.values.categoryRef=clone(result.data.categoryRef);editor.values.routingCatalog=clone(result.data);editor.categoryReadIssue='';refreshCloudStatusSources();
    if(settings.redraw!==false)draw();
    return result;
  }
  function groupedRuleSourceOptions(rule,node) {
    const channel=node?.conditionSource?.channel,selected=value=>rule.source===value?' selected':'',option=(value,label)=>'<option value="'+value+'"'+selected(value)+'>'+e(label)+'</option>';
    let html='<option value="">请选择条件来源</option>',allowed=['IMPORT'];
    if(channel==='AI'){allowed.push('CALL_STATUS','AI_TAG');html+='<optgroup label="AI处理结果">'+option('CALL_STATUS','通话状态')+option('AI_TAG','意向标签')+'</optgroup>';}
    if(channel==='CLOUD'){allowed.push('CALL_STATUS','FOLLOWUP');html+='<optgroup label="人工／预外呼处理结果">'+option('CALL_STATUS','通话状态')+option('FOLLOWUP','填写字段')+'</optgroup>';}
    html+='<optgroup label="独立数据">'+option('IMPORT','导入字段')+'</optgroup>';
    if(rule.source&&!allowed.includes(rule.source))html+='<optgroup label="原条件需调整">'+option(rule.source,(routingSources[rule.source]||rule.source)+'（当前处理来源不可用，原值保留）')+'</optgroup>';
    return html;
  }
'''


CATEGORY_CONTROL = r'''
  function templateCategoryControl(){
    const current=editor.values.categoryRef,id=current?.categoryId||'',choices=categoryChoices(),selected=choices.find(x=>x.value===id);
    const items=choices.filter(x=>x.enabled||x.value===id),opts=items.map(x=>'<option value="'+e(x.value)+'"'+(x.value===id?' selected':'')+(!x.enabled?' disabled':'')+'>'+e(x.label+(!x.enabled?'（已停用）':''))+'</option>').join('');
    const unavailable=id&&!selected?'<option selected value="'+e(id)+'">'+e(editor.values.routingCatalog?.categoryLabel||current.label||id)+'（当前不可用）</option>':'';
    const errors=[editor.categoryReadIssue,...(editor.categoryFieldIssues||[]).map(issue=>issue.message)].filter(Boolean);
    return field('字段参考分类 <span class="required">*</span>','<select id="fcCategory" onchange="FlowConfiguration.selectTemplateCategory(this.value)"><option value="">请选择字段参考分类</option>'+opts+unavailable+'</select>','',true)+(errors.length?message(errors.join(' '),'error'):'');
  }
'''


SELECT_CATEGORY = r'''
  function selectTemplateCategory(id){
    if(!editor||editor.readOnly||editor.busy||editor.pending)return;readValues();
    const choice=categoryChoices().find(x=>x.value===id&&x.enabled);
    if(!choice){draw();return status('请选择当前品牌内启用的有效字段参考分类。','error');}
    const legacy=!v2(),result=refreshTemplateCategory({categoryId:id,capture:false,redraw:false});
    if(result?.status!=='success'){draw();return status(result?.message||'分类字段定义无法可靠读取，本次未改变分类。','error');}
    editor.values.routingPolicy=routingPolicy;editor.compatibilityIssues=compatibilityIssues(editor.values);touch();
    editor.status=editor.categoryFieldIssues?.length?editor.categoryFieldIssues.map(issue=>issue.message).join(' '):legacy?'分类已选择，旧条件保持原样，请逐条核对来源和比较值。':'已使用当前业务分类，原条件和比较值保持。';editor.statusKind=editor.categoryFieldIssues?.length?'error':'success';draw();
  }
'''


def transform(kind, path, code):
    if kind != 'cloud' or path != 'js/pages/flow-configuration.js':
        return code
    code = one(code, '  function routingDirectory(force=false){', HELPERS + '\n  function routingDirectory(force=false){')
    code = function(code,'templateCategoryControl',CATEGORY_CONTROL)
    code = function(code,'selectTemplateCategory',SELECT_CATEGORY)
    code = one(code, '    editor.compatibilityIssues=compatibilityIssues(values);draw();', '    refreshTemplateCategory({capture:false,redraw:false});editor.initial=JSON.stringify(editor.values);editor.compatibilityIssues=compatibilityIssues(values);draw();')
    code = one(code, '    if(!editor) return;captureCanvasViewport();', '    if(!editor) return;refreshTemplateCategory({capture:false,redraw:false});captureCanvasViewport();')
    code = one(code, "    readValues();if(!v2()||!editor.values.categoryRef?.categoryId){status('请明确选择业务分类后进入节点编排；旧模板须确认升级本次草稿。','error');", "    readValues();const latest=refreshTemplateCategory({capture:false,redraw:false});if(latest?.status!=='success'){status(latest?.message||'字段参考分类的字段暂时无法读取，原草稿保留。','error');return;}if(!v2()||!editor.values.categoryRef?.categoryId){status('请选择业务分类后进入节点编排；旧规则保持原样，请逐条核对。','error');")
    code = one(code, "(value.routingCatalog?.categoryLabel||value.categoryRef.categoryId)+' · 分类V'+value.categoryRef.version", "value.routingCatalog?.categoryLabel||value.categoryRef.categoryId")
    code = one(code, "+' · 分类V'+e(template.categoryRef?.version||'待核')+' · 起始：'", "+' · 起始：'")
    code = one(code, "<span>基础配置 V'+e(data.baseVersion)+' · 路由配置 V'+e(data.routeVersion)+'</span>", "<span>按当前业务分类配置校验</span>")
    code = one(code, "allowed=channel==='AI'?['CALL_STATUS','AI_TAG']:channel==='CLOUD'?['CALL_STATUS','IMPORT','FOLLOWUP']:[]", "allowed=channel==='AI'?['CALL_STATUS','AI_TAG','IMPORT']:channel==='CLOUD'?['CALL_STATUS','FOLLOWUP','IMPORT']:['IMPORT']")
    code = one(code, "options(sourceItems,rule.source||'','请选择允许的条件来源')", 'groupedRuleSourceOptions(rule,node)')
    code = one(code, "    let notices='';if(rule.optionIds!==undefined||!rule.source)", "    let notices=(editor.categoryFieldIssues||[]).filter(issue=>issue.ruleId===rule.ruleId).map(issue=>message(issue.message,'error')).join('');if(rule.optionIds!==undefined||!rule.source)")
    code = one(code, "    if(!v2())return legacyValidateConditions();const methodMissing=", "    if(!v2())return legacyValidateConditions();const latest=refreshTemplateCategory({capture:false,redraw:false});if(latest?.status!=='success')return {text:latest?.message||'当前分类字段暂时无法读取。',id:'fcCategory'};if(editor.categoryFieldIssues?.length){const issue=editor.categoryFieldIssues[0];return {text:issue.message,id:issue.edgeId?edgeControlId(issue.edgeId):'fcStatus'};}const methodMissing=")
    code = one(code, "    const result=ret.data||ret,issues=result.issues||result.errors||[];editor.routingWarnings=result.warnings||[];", "    const result=ret.data||ret,issues=result.issues||result.errors||[];if(result.categoryRef&&result.routingCatalog&&!editor.pending&&!editor.busy){editor.values.categoryRef=clone(result.categoryRef);editor.values.routingCatalog=clone(result.routingCatalog);}editor.routingWarnings=result.warnings||[];")
    code = one(code, "+' · '+scopeLabel(rule.scope||node.conditionSource?.scope);", "+' · '+(rule.source==='IMPORT'?'原始导入值（独立判断）':scopeLabel(rule.scope||node.conditionSource?.scope));")
    code = one(code, "return (c.channel==='AI'?'AI':c.channel==='CLOUD'?'云呼叫':'未选处理渠道')", "return !c.channel?'独立导入字段（无需呼叫结果）':(c.channel==='AI'?'AI':c.channel==='CLOUD'?'云呼叫':'未选处理渠道')")
    code = one(code, 'window.FlowConfiguration={', 'window.FlowConfiguration={refreshTemplateCategory,')
    return code
