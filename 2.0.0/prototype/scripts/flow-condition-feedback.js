  // V2 evidence has typed sources and stable values; legacy presentation stays intact.
  function routingConditionPanel(row){
    const snapshot=row.categorySnapshot||{},definitions=[...(snapshot.conditionFieldDefinitions||[]),...(snapshot.followupFields||[]),...(snapshot.fields||[])];
    const fieldName=id=>definitions.find(f=>f.id===id||f.fieldId===id||f.key===id)?.label||id||'字段待核';
    const statusName=value=>({MATCHED:'符合',UNMATCHED:'不符合',PENDING:'待核'}[value]||'待核');
    const sourceNames={CALL_STATUS:'通话状态',AI_TAG:'AI意向标签',IMPORT:'分类导入字段',FOLLOWUP:'分类培育字段'};
    const opNames={EQ:'等于',NE:'不等于',IN:'属于任一值',CONTAINS_ANY:'包含任一标签或选项',CONTAINS_ALL:'包含全部标签或选项',GT:'大于',GTE:'大于或等于',LT:'小于',LTE:'小于或等于',IS_EMPTY:'为空',IS_NOT_EMPTY:'不为空'};
    const scopeNames={CURRENT_NODE:'本节点本次结果',CURRENT_ROUND:'本租户本轮最近结果',HISTORY:'显式历史结果',IMPORT:'固定分类导入快照'};
    function renderValue(rule,value,source,path){
      const values=Array.isArray(value)?value:[value],definition=definitions.find(f=>f.id===rule.fieldId||f.fieldId===rule.fieldId||f.key===rule.fieldId);
      const domainId=source?.domainId||path.sources?.conditionSource?.domainId||row.currentNode?.conditionSource?.domainId;
      const domain=(window.DFlowStatusDomains||[]).find(d=>d.id===domainId);
      return values.length?values.map(v=>{
        if(v===null||v==='')return '明确为空';
        if(rule.source==='CALL_STATUS'){const item=domain?.statuses?.find(s=>s.value===v);return item?.label?item.label+'（'+String(v)+'）':String(v);}
        if(rule.source==='AI_TAG')return '标签ID '+String(v);
        return definition?.options?.find(o=>o.id===v)?.label||String(v);
      }).join('、'):'明确为空';
    }
    return '<div class="bf-card"><h3>后续路径与流转条件</h3><p class="bf-muted">按 IF / ELSEIF 优先级只选首个命中分支；ELSE 为唯一兜底。条件证据未就绪时暂停判断，不进入 ELSE。</p>'+row.edgeEvaluations.map(path=>{
      const rules=path.conditions?.rules||[],parts=(path.rules||[]).map(result=>{
        const rule=rules.find(item=>item.ruleId===result.ruleId)||{},source=result.source||{},name=(sourceNames[rule.source]||'条件来源待核')+(rule.fieldId?' · '+fieldName(rule.fieldId):'');
        const label=name+' '+(opNames[rule.operator]||rule.operator||'判断待核')+(['IS_EMPTY','IS_NOT_EMPTY'].includes(rule.operator)?'':'：'+renderValue(rule,rule.values||[],source,path));
        const actual=source.state==='KNOWN'?renderValue(rule,result.actual,source,path):'待核：'+(result.reason||source.reason||'取值尚未就绪');
        const origin=source.evidence||source,details=[];
        if(source.sourceScope)details.push('取值范围：'+(scopeNames[source.sourceScope]||source.sourceScope));
        if(source.domainId)details.push('状态域：'+source.domainId);
        if(source.rawDomain)details.push('渠道原始状态域：'+source.rawDomain);
        if(source.rawCode!==undefined)details.push('渠道原始码：'+source.rawCode);
        if(source.rawLabel!==undefined)details.push('渠道原始说明：'+source.rawLabel);
        for(const [key,label] of [['tenantId','租户'],['roundId','轮次'],['nodeRunId','节点执行'],['segmentId','执行段']])if(origin[key])details.push(label+'：'+origin[key]);
        if(source.simulation===true)details.push('本地模拟证据，非供应商实际执行');
        return '<p class="bf-muted">'+e(label)+' · '+e(statusName(result.status))+'<br>实际值：'+e(actual)+'</p>'+(details.length?'<details><summary>查看取值来源</summary><small>'+details.map(value=>e(value)).join('<br>')+'</small></details>':'');
      }).join('');
      const branch=path.branch?path.branch.kind+' · 优先级 '+path.branch.priority+' → ':'';
      return '<div class="bf-segment"><strong>'+e(branch+(path.toName||path.toNodeId))+'</strong> '+tag(statusName(path.status),path.status==='MATCHED'?'green':'amber')+'<p>'+e(path.reason||'条件取值待核')+'</p>'+(path.conditions?.enabled?'<p class="bf-muted">条件关系：'+(path.conditions.mode==='ALL'?'全部满足':'任一满足')+'</p>':'')+parts+'</div>';
    }).join('')+'</div>';
  }
