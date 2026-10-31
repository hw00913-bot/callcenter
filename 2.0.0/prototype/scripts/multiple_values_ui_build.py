"""Make comparison-set semantics explicit in ordinary and START conditions."""


def one(code, before, after):
    if code.count(before) != 1:
        raise ValueError('Multiple comparison UI source conflict: ' + before[:140])
    return code.replace(before, after, 1)


HELPERS = r'''
  function comparisonSet(operator){return ['IN','NOT_IN','CONTAINS_ANY','CONTAINS_ALL'].includes(operator);}
  function comparisonExample(type){return type==='date'?'2026-10-30\n2026-11-01':type==='datetime'?'2026-10-30T10:00:00+08:00\n2026-10-31T10:00:00+08:00':'多个值请换行填写';}
  function comparisonPlaceholder(type,operator){return comparisonSet(operator)?comparisonExample(type):'请输入一个比较值';}
  function comparisonValueHelp(type,operator,options=false,entry=false){
    return comparisonSet(operator)&&!options?'<small class="fc-comparison-help">多个值请换行填写，每行一个值；判断方式请选择“属于任一值”或“不属于任一值”。</small>':'';
  }
'''


RULE_CHANGE_HELPERS = r'''
  function comparisonValuesFit(values,type,operator,operators,available=[]){
    if(!values.length)return true;
    if(!operators.includes(operator)||['IS_EMPTY','IS_NOT_EMPTY'].includes(operator))return false;
    if(!values.every(value=>typeof value==='string'||typeof value==='boolean'||typeof value==='number'&&Number.isFinite(value)))return false;
    if(!comparisonSet(operator)&&values.length!==1)return false;
    if(new Set(values.map(value=>JSON.stringify(value))).size!==values.length)return false;
    if(['select','enum','multiselect'].includes(type))return values.every(value=>available.some(item=>JSON.stringify(item.id)===JSON.stringify(value)));
    if(!type)return false;
    return values.every(value=>{const normalized=DFlowRouting.normalizeSavedField?.(value,type,'Asia/Shanghai');return normalized?.ok===true&&JSON.stringify(normalized.value)===JSON.stringify(value);});
  }
  function ruleValuesCompatible(rule){
    const node=nodeById(editor.values.edges.find(edge=>edge.conditions?.rules?.some(item=>item.ruleId===rule.ruleId))?.fromNodeId);
    return comparisonValuesFit(Array.isArray(rule.values)?rule.values:[],ruleType(rule),rule.operator,ruleOperators(rule),ruleValueOptions(rule,node,routingDirectory().data||{}));
  }
  function changeRule(edgeId,ruleId,key,value){
    if(!editableRouting()||!['source','fieldId','operator','scope'].includes(key)||typeof value!=='string')return;
    readValues();
    const edge=editor.values.edges.find(item=>item.edgeId===edgeId),rule=edge?.conditions?.rules?.find(item=>item.ruleId===ruleId),node=edge&&nodeById(edge.fromNodeId);
    if(!rule||!node||rule[key]===value)return;
    const data=routingDirectory().data||{},channel=node.conditionSource?.channel,allowed=channel==='AI'?['CALL_STATUS','AI_TAG','IMPORT']:channel==='CLOUD'?['CALL_STATUS','FOLLOWUP','IMPORT']:['IMPORT'];
    if(key==='source'&&value&&!allowed.includes(value))return;
    if(key==='fieldId'&&(!['IMPORT','FOLLOWUP'].includes(rule.source)||value&&!(data.fields||[]).some(field=>field.source===rule.source&&(field.id||field.fieldId)===value&&field.enabled!==false)))return;
    if(key==='operator'&&value&&!ruleOperators(rule).includes(value))return;
    if(key==='scope'&&value&&!routingScopes.some(item=>item.value===value))return;
    const priorValues=Array.isArray(rule.values)?rule.values:Array.isArray(rule.optionIds)?rule.optionIds:[],identityChanged=key==='source'||key==='fieldId';
    rule[key]=value;
    if(key==='source'&&!['IMPORT','FOLLOWUP'].includes(value))delete rule.fieldId;
    else if(key==='source'&&!(data.fields||[]).some(field=>field.source===value&&(field.id||field.fieldId)===rule.fieldId&&field.enabled!==false))delete rule.fieldId;
    if(!ruleOperators(rule).includes(rule.operator))rule.operator='';
    if(identityChanged||!ruleValuesCompatible(rule))rule.values=[];
    delete rule.optionIds;
    editor.ruleChanges={};
    if(identityChanged&&editor.categoryFieldIssues)editor.categoryFieldIssues=editor.categoryFieldIssues.filter(issue=>issue.ruleId!==ruleId);
    touch();draw();
    if(priorValues.length&&!(rule.values||[]).length)window.showToast?.('比较值已清空。','info');
  }
  function requestRuleChange(edgeId,ruleId,key,value){return changeRule(edgeId,ruleId,key,value);}
  function clearRuleValues(edgeId,ruleId){
    if(!editableRouting())return;readValues();const rule=editor.values.edges.find(edge=>edge.edgeId===edgeId)?.conditions?.rules?.find(item=>item.ruleId===ruleId);if(!rule)return;
    rule.values=[];delete rule.optionIds;editor.ruleChanges={};touch();draw();
  }
'''


ENTRY_CHANGE = r'''
  function fourChangeEntryRule(entryId,ruleId,key,value){
    if(!editableRouting()||!['source','operator','values'].includes(key))return;readValues();
    const row=fourEnsureEntries().find(item=>item.entryId===entryId),rule=row?.conditions?.rules?.find(item=>item.ruleId===ruleId);if(!rule||row.branch?.kind==='ELSE')return;
    const priorValues=Array.isArray(rule.values)?rule.values:[];
    if(key==='source'){
      let tuple;try{tuple=value===''?['','']:JSON.parse(value);}catch(_){return;}
      if(!Array.isArray(tuple)||tuple.length!==2||!['IMPORT','CONTEXT',''].includes(tuple[0])||typeof tuple[1]!=='string')return;
      if(tuple[0]){const data=fourEntryDirectory(),fields=tuple[0]==='CONTEXT'?data.contexts||fourEntryContexts:data.fields||[];if(!fields.some(field=>field.id===tuple[1]&&field.enabled!==false))return;}
      if(rule.source===tuple[0]&&rule.fieldId===tuple[1])return;
      rule.source=tuple[0];rule.fieldId=tuple[1];rule.values=[];delete rule.optionIds;
      if(!(DFlowRouting.operators?.(fourEntryDefinition(rule)?.type)||[]).includes(rule.operator))rule.operator='';
    }else if(key==='operator'){
      const definition=fourEntryDefinition(rule),operators=DFlowRouting.operators?.(definition?.type)||[];
      if(typeof value!=='string'||value&&!operators.includes(value)||rule.operator===value)return;
      rule.operator=value;
      if(!comparisonValuesFit(priorValues,definition?.type,value,operators,definition?.options||[]))rule.values=[];
    }else rule.values=['IS_EMPTY','IS_NOT_EMPTY'].includes(rule.operator)?[]:DFlowRouting.parseComparisonValues(value,fourEntryDefinition(rule)?.type);
    editor.ruleChanges={};fourEntryChanged();
    if(key!=='values'&&priorValues.length&&!(rule.values||[]).length)window.showToast?.('比较值已清空。','info');
  }
'''


def replace_function(code, name, replacement):
    import re
    marker='  function '+name+'('
    if code.count(marker)!=1:raise ValueError('Rule change function conflict: '+name)
    start=code.index(marker)
    found=re.search(r'^  (?:async )?function ',code[start+len(marker):],re.M)
    if not found:raise ValueError('Rule change function end missing: '+name)
    end=start+len(marker)+found.start()
    return code[:start]+replacement.strip('\n')+'\n'+code[end:]


def transform(kind, path, code):
    if kind != 'cloud' or path != 'js/pages/flow-configuration.js':
        return code
    code = one(code, '  function conditionRule(', HELPERS.lstrip('\n') + '\n  function conditionRule(')
    code = one(code, "NOT_IN:'不属于所选值'", "NOT_IN:'不属于任一值'")
    code = one(code, "e(pending.key+' → '+pending.value)", "e(pending.key==='operator'?'判断方式 → '+(routingOperatorNames[pending.value]||pending.value):pending.key+' → '+pending.value)")
    code = one(code, "?.label||String(v)+'（原值）'", "?.label||String(v)")
    code = one(code, "IN:'属于',GT:", "IN:'属于任一值',NOT_IN:'不属于任一值',GT:")
    code = one(code, "IN:'属于任一',GT:", "IN:'属于任一值',NOT_IN:'不属于任一值',GT:")
    code = one(code, "const multiple=['IN','CONTAINS_ANY','CONTAINS_ALL'].includes(rule.operator)", "const multiple=comparisonSet(rule.operator)")
    code = one(code, "!['IN','CONTAINS_ANY','CONTAINS_ALL'].includes(rule.operator)&&rule.values.length!==1", "!comparisonSet(rule.operator)&&rule.values.length!==1")

    old = r'''else{const def=fourEntryDefinition(rule),raw=Array.isArray(value)?value:String(value).split(/\r?\n/).map(s=>s.trim()).filter(Boolean);rule.values=raw.map(item=>{if(['number','date','datetime','boolean'].includes(def?.type)){const parsed=def.type==='boolean'&&typeof item==='string'&&['true','false'].includes(item)?{ok:true,value:item==='true'}:DFlowRouting.normalizeSavedField?.(item,def.type,'Asia/Shanghai');if(parsed?.ok)return parsed.value;}return item;});}'''
    code = one(code, old, "else{rule.values=DFlowRouting.parseComparisonValues(value,fourEntryDefinition(rule)?.type);}")
    old = r'''rule.values=input.value===''?[]:input.value.split(/\r?\n/).map(x=>type==='number'&&x.trim()!==''&&Number.isFinite(Number(x))?Number(x):x);'''
    code = one(code, old, 'rule.values=DFlowRouting.parseComparisonValues(input.value,type);')

    code = one(code,
               "['date','datetime'].includes(type)&&values.length<=1?",
               "['date','datetime'].includes(type)&&!comparisonSet(rule.operator)&&values.length<=1?")
    code = one(code,
               r'''+' placeholder="每行一个比较值">'+e(shown)+'</textarea>';''',
               r'''+' rows="'+(comparisonSet(rule.operator)?4:2)+'" placeholder="'+e(comparisonPlaceholder(type,rule.operator))+'">'+e(shown)+'</textarea>';''')
    old = r'''      valueControl+='<small>'+(type==='datetime'?'时间须使用包含时区的ISO文本，例如 2026-10-28T10:00:00+08:00。':type==='date'?'日期使用 YYYY-MM-DD 文本。':'每行一个比较值，按 '+e(type||'待选择字段')+' 类型校验；空白不会转为数字0。')+'接口取数字段不能用于条件。</small>';}'''
    code = one(code, old, '    }\n    valueControl+=comparisonValueHelp(ruleType(rule),rule.operator,enumType);')

    old = r'''else valueControl='<textarea id="'+e(controlId)+'" aria-label="入口比较值" rows="2" placeholder="每行一个比较值"'+disabled+(empty?' disabled':'')+' onchange="'+change('values')+'">'+e((rule.values||[]).join('\n'))+'</textarea>';'''
    new = r'''else valueControl='<textarea id="'+e(controlId)+'" aria-label="入口比较值" rows="'+(comparisonSet(rule.operator)?4:2)+'" placeholder="'+e(comparisonPlaceholder(def?.type,rule.operator))+'"'+disabled+(empty?' disabled':'')+' onchange="'+change('values')+'">'+e((rule.values||[]).join('\n'))+'</textarea>';
    valueControl+=comparisonValueHelp(def?.type,rule.operator,!!def?.options?.length,true);'''
    code = one(code, old, new)
    # Keep control edits in the draft, without a second apply/cancel workflow.
    code = replace_function(code, 'applyRuleChange', '')
    code = replace_function(code, 'cancelRuleChange', '')
    code = replace_function(code, 'clearRuleValues', '')
    code = replace_function(code, 'requestRuleChange', RULE_CHANGE_HELPERS)
    code = replace_function(code, 'fourChangeEntryRule', ENTRY_CHANGE)
    code = one(code, 'const pending=editor.ruleChanges?.[rule.ruleId],sourceItems=', 'const sourceItems=')
    import re
    code, removed = re.subn(r'(?m)^    if\(pending\)notices\+=.*\n', '', code)
    if removed != 1:raise ValueError('Rule change confirmation markup conflict')
    code = one(code, "if(Object.keys(editor.ruleChanges||{}).length)return {text:'请先应用或取消待确认的规则变更，再保存模板。',id:'fcStatus'};", '')
    code = one(code, 'window.FlowConfiguration={', 'window.FlowConfiguration={changeRule,')
    code = one(code, ',applyRuleChange,cancelRuleChange,', ',')
    code = one(code, '>明确清空比较值</button>', '>清空</button>')
    return code
