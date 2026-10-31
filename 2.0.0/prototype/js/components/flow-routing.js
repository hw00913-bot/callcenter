/* Project-owned conditional routing for the local template prototype.
 * Does not write storage, invoke a provider, or advance a business record.
 * Raw call codes remain scoped to their documented source domain.
 */
(function(root){
  'use strict';
  const POLICY='FIRST_MATCH_V1',clone=v=>v===undefined?null:JSON.parse(JSON.stringify(v));
  const has=(v,k)=>!!v&&Object.prototype.hasOwnProperty.call(v,k),object=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
  const SOURCES=['CALL_STATUS','AI_TAG','IMPORT','FOLLOWUP'],SCOPES=['CURRENT_NODE','CURRENT_ROUND','HISTORY'];
  const EMPTY=['IS_EMPTY','IS_NOT_EMPTY'];
  const primitive=v=>typeof v==='string'||typeof v==='number'&&Number.isFinite(v)||typeof v==='boolean';
  const unique=rows=>new Set(rows.map(v=>JSON.stringify(v))).size===rows.length;
  function operators(type){
    if(['CALL_STATUS','select','enum'].includes(type))return ['IN','NOT_IN','EQ','NE'].concat(EMPTY);
    if(['AI_TAG','multiselect'].includes(type))return ['CONTAINS_ANY','CONTAINS_ALL'].concat(EMPTY);
    if(['number','date','datetime'].includes(type))return ['EQ','NE','IN','NOT_IN','GT','GTE','LT','LTE'].concat(EMPTY);
    if(type==='boolean')return ['EQ','NE'].concat(EMPTY);
    if(['text','textarea','phone'].includes(type))return ['EQ','NE','IN','NOT_IN'].concat(EMPTY);
    return [];
  }
  function typeFor(rule,catalog){
    if(rule.source==='CALL_STATUS'||rule.source==='AI_TAG')return rule.source;
    return (catalog?.fields||[]).find(f=>f.source===rule.source&&f.id===rule.fieldId)?.type||'';
  }
  const domainFor=(node,catalog)=>(catalog?.domains||[]).find(d=>d.id===node?.conditionSource?.domainId&&d.channel===node?.conditionSource?.channel);
  function contextFor(node,catalog){
    const source=node?.conditionSource||{};
    if(source.revision===undefined||!['supplierId','tenantId','tenantType','tagSceneId'].every(k=>typeof source[k]==='string'&&source[k]))return null;
    return (catalog?.aiContexts||[]).find(c=>['supplierId','tenantId','tenantType','tagSceneId','revision'].every(k=>c[k]===source[k]));
  }
  function categoryIssue(ref,actual){
    if(!ref||!actual)return '模板或记录缺少固定业务分类版本';
    for(const k of ['categoryId','version','fieldsVersion'])if(ref[k]===undefined||actual[k]===undefined||ref[k]!==actual[k])return '业务分类或字段固定版本不一致：'+k;
    for(const k of ['brandId','categoryScope','tenantId'])if(ref[k]!==undefined&&actual[k]!==ref[k])return '业务分类使用范围不一致：'+k;
    return '';
  }
  function comparable(value,type){
    if(type==='number')return typeof value==='number'&&Number.isFinite(value)?value:null;
    if(type==='date'){
      if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;
      const n=Date.parse(value+'T00:00:00Z');return Number.isFinite(n)&&new Date(n).toISOString().slice(0,10)===value?n:null;
    }
    if(type==='datetime'){
      // An explicit offset is required; locale/timezone guesses must not route a record.
      if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(value))return null;
      const day=Date.parse(value.slice(0,10)+'T00:00:00Z'),time=value.slice(11).match(/^(\d{2}):(\d{2})(?::(\d{2}))?/);
      if(!Number.isFinite(day)||new Date(day).toISOString().slice(0,10)!==value.slice(0,10)||Number(time[1])>23||Number(time[2])>59||Number(time[3]||0)>59)return null;
      const n=Date.parse(value);return Number.isFinite(n)?n:null;
    }
    if(type==='boolean')return typeof value==='boolean'?value:null;
    return primitive(value)?value:null;
  }
  // Form controls emit numeric text and timezone-free datetime-local values.
  // An explicitly labelled save binds local time to Asia/Shanghai.
  function normalizeSavedField(value,type,timeZone){
    if(value===null||value==='')return {ok:true,value};
    if(type==='number'){
      if(typeof value==='string'&&/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(value.trim()))value=Number(value);
      return typeof value==='number'&&Number.isFinite(value)?{ok:true,value}:{ok:false};
    }
    if(type==='datetime'){
      if(typeof value!=='string')return {ok:false};
      if(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)){
        if(timeZone!=='Asia/Shanghai')return {ok:false};
        const local=value,instant=Date.parse(local+':00+08:00');
        if(!Number.isFinite(instant)||new Date(instant+8*3600000).toISOString().slice(0,16)!==local)return {ok:false};
        return {ok:true,value:local+':00+08:00'};
      }
      return comparable(value,type)!==null?{ok:true,value}:{ok:false};
    }
    if(type==='date')return comparable(value,type)!==null?{ok:true,value}:{ok:false};
    if(type==='boolean')return typeof value==='boolean'?{ok:true,value}:{ok:false};
    if(type==='multiselect')return Array.isArray(value)&&value.every(primitive)&&unique(value)?{ok:true,value:clone(value)}:{ok:false};
    return typeof value==='string'?{ok:true,value}:{ok:false};
  }
  function parseComparisonValues(raw,type){
    const rows=Array.isArray(raw)?raw:String(raw??'').split(/\r?\n/);
    return rows.filter(value=>typeof value!=='string'||value.trim()!=='').map(value=>{
      if(!['number','date','datetime','boolean'].includes(type))return value;
      const text=typeof value==='string'?value.trim():value;
      if(type==='boolean'&&['true','false'].includes(text))return text==='true';
      const normalized=normalizeSavedField(text,type,'Asia/Shanghai');
      return normalized.ok?normalized.value:value;
    });
  }
  function validate(input,catalog,options={}){
    const issues=[],warnings=[],add=(code,message,detail={})=>issues.push({code,message,...detail});
    if(input?.routingPolicy!==POLICY)return {ok:true,legacy:true,issues,warnings};
    const category=categoryIssue(input.categoryRef,catalog?.categoryRef);if(category)add('CATEGORY_VERSION',category);
    if(!Array.isArray(input.nodes)||!input.nodes.length){add('NODES_REQUIRED','请配置节点');return {ok:false,issues,warnings};}
    const ids=new Set(),nodes=input.nodes.filter(object),edges=Array.isArray(input.edges)?input.edges.filter(object):null;
    if(nodes.length!==input.nodes.length)add('NODE_INVALID','节点结构无效，请保留原配置并重新核对');
    for(const node of nodes){if(!node?.nodeId||ids.has(node.nodeId))add('NODE_ID','节点稳定标识为空或重复',{nodeId:node?.nodeId});ids.add(node?.nodeId);}
    if(!Array.isArray(edges)){add('EDGES_REQUIRED','路径及稳定标识未配置');return {ok:false,issues,warnings};}
    if(edges.length!==input.edges.length)add('EDGE_INVALID','路径结构无效，请保留原配置并重新核对');
    if(!ids.has(input.startNodeId))add('START_MISSING','请选择有效起始节点');
    const edgeIds=new Set(),pairs=new Set();
    for(const edge of edges){
      const info={edgeId:edge?.edgeId,nodeId:edge?.fromNodeId},pair=JSON.stringify([edge?.fromNodeId,edge?.toNodeId]);
      if(!edge?.edgeId||edgeIds.has(edge.edgeId)||pairs.has(pair))add('EDGE_ID','路径稳定标识或目标重复',info);
      edgeIds.add(edge?.edgeId);pairs.add(pair);
      if(!ids.has(edge?.fromNodeId)||!ids.has(edge?.toNodeId))add('DANGLING_NODE','路径指向不存在的节点',info);
      if(!['IF','ELSEIF','ELSE'].includes(edge?.branch?.kind)||!Number.isSafeInteger(edge?.branch?.priority)||edge.branch.priority<1)add('BRANCH_INVALID','路径类型或顺序无效，请在节点配置中核对',info);
    }
    for(const node of nodes){
      const detail={nodeId:node.nodeId},out=edges.filter(e=>e.fromNodeId===node.nodeId).sort((a,b)=>(a.branch?.priority||0)-(b.branch?.priority||0));
      // Saving also checks the configured execution method for each call node.
      if(options.forSave===true&&node.type==='PROCESS'&&(!Array.isArray(node.methods)||node.methods.length!==1||!['AI','PREDICTIVE','MANUAL'].includes(node.methods[0])))add('METHOD_SINGLE','每个处理节点请选择且仅选择一种处理方式（AI、预外呼或人工）',detail);
      const targets=Array.isArray(node.next)?node.next:[];
      if(!Array.isArray(node.next)||!unique(targets)||out.length!==targets.length||out.some(e=>!targets.includes(e.toNodeId)))add('PATH_MAPPING','后续节点与路径须一一对应',detail);
      if(node.type==='END'){if(out.length)add('END_EXIT','结束节点不能有出口',detail);continue;}
      if(!out.length){add('PATH_MISSING','非结束节点必须有出口',detail);continue;}
      if(out.some((e,i)=>e.branch?.priority!==i+1))add('BRANCH_ORDER','出口优先级须从 1 连续且不能重复',detail);
      const fallback=out.filter(e=>e.branch?.kind==='ELSE'),conditionalPaths=out.filter(e=>e.branch?.kind!=='ELSE'),nodeName=node.name||'当前节点';
      // Every current node with exits has one complete, ordered branch chain.
      if(!fallback.length)add('ELSE_REQUIRED','请选择“'+nodeName+'”的其他情况下一节点',detail);
      if(fallback.length>1||fallback.length&&out.at(-1)?.branch?.kind!=='ELSE')add('BRANCH_ORDER','“'+nodeName+'”最多配置一条默认路径，并放在最后',detail);
      if(conditionalPaths.some((edge,index)=>edge.branch?.kind!==(index===0?'IF':'ELSEIF')))add('BRANCH_ORDER','“'+nodeName+'”的条件路径顺序无效，请重新调整路径顺序',detail);
      const source=node.conditionSource||{},conditional=out.some(e=>e.branch?.kind!=='ELSE');
      const rules=out.filter(edge=>edge.branch?.kind!=='ELSE').flatMap(edge=>Array.isArray(edge.conditions?.rules)?edge.conditions.rules:[]);
      const needsCallResult=rules.some(rule=>['CALL_STATUS','AI_TAG'].includes(rule?.source));
      const needsChannel=needsCallResult||rules.some(rule=>rule?.source==='FOLLOWUP');
      if(needsChannel&&source.sourceNodeId){
        const origin=nodes.find(n=>n.nodeId===source.sourceNodeId),upstream=new Set(),queue=[node.nodeId];
        while(queue.length){const id=queue.shift();for(const e of edges.filter(e=>e.toNodeId===id))if(!upstream.has(e.fromNodeId)){upstream.add(e.fromNodeId);queue.push(e.fromNodeId);}}
        if(!origin||origin.type!=='PROCESS'||source.sourceNodeId!==node.nodeId&&!upstream.has(source.sourceNodeId))add('SOURCE_NODE','结果来源必须是本节点或可达上游呼叫节点',detail);
        if(origin?.conditionSource&&['channel','domainId'].some(k=>source[k]!==origin.conditionSource[k]))add('SOURCE_NODE_DOMAIN','来源呼叫节点的渠道和状态域必须一致',detail);
      }
      // Original imported values belong to the record, independently of whether
      // this node has made a call or retained an old call-source selection.
      if(conditional&&needsChannel&&!['AI','CLOUD'].includes(source.channel))add('CHANNEL_REQUIRED','通话、意向标签或填写字段条件须选择对应的 AI 或云外呼来源',detail);
      if(needsChannel&&source.scope!==undefined&&!SCOPES.includes(source.scope))add('SOURCE_SCOPE','外呼结果的来源轮次或节点范围无效',detail);
      // A mixed PROCESS can choose its routing source explicitly; other node types
      // may route using a prior saved source only with an explicit source scope.
      if(needsChannel&&node.type==='PROCESS'&&source.channel&&Array.isArray(node.methods)){
        if(source.channel==='AI'&&!node.methods.includes('AI')||source.channel==='CLOUD'&&!node.methods.some(m=>['MANUAL','PREDICTIVE'].includes(m)))add('CHANNEL_METHOD','条件来源不属于本处理节点允许的外呼方式',detail);
      }
      const domain=domainFor(node,catalog),ai=contextFor(node,catalog);
      if(conditional&&needsCallResult&&node.type==='PROCESS'&&domain?.methods&&!domain.methods.some(m=>node.methods?.includes(m)))add('DOMAIN_METHOD','状态接口不属于本节点允许的处理方式',detail);
      for(const edge of out){
        const info={nodeId:node.nodeId,edgeId:edge.edgeId},conditions=edge.conditions;
        if(edge.branch?.kind==='ELSE'){
          if(conditions?.enabled===true||(conditions?.rules||[]).length)add('ELSE_CONDITION','默认路径不能附带条件；请确认是否保留原条件',info);
          continue;
        }
        if(conditions?.enabled!==true||!['ALL','ANY'].includes(conditions.mode)||!Array.isArray(conditions.rules)||!conditions.rules.length){add('CONDITION_REQUIRED','IF / ELSEIF 须开启条件并选择且 / 或及至少一条规则',info);continue;}
        const ruleIds=new Set();
        for(const rule of conditions.rules){
          const rinfo={...info,ruleId:rule?.ruleId};
          if(!rule?.ruleId||ruleIds.has(rule.ruleId))add('RULE_ID','规则稳定标识为空或重复',rinfo);ruleIds.add(rule?.ruleId);
          if(!SOURCES.includes(rule?.source)){add('RULE_SOURCE','请选择合法条件来源',rinfo);continue;}
          if(has(rule,'optionIds'))add('LEGACY_RULE','旧多选规则尚未明确重配；请明确清空旧比较值后配置当前来源',rinfo);
          if(rule.source!=='IMPORT'&&(source.channel==='AI'?!['CALL_STATUS','AI_TAG'].includes(rule.source):source.channel==='CLOUD'?!['CALL_STATUS','FOLLOWUP'].includes(rule.source):true))add('SOURCE_NOT_ALLOWED','此节点类型不允许原条件来源，请明确修改或移除后保存',rinfo);
          if(rule.source!=='IMPORT'&&rule.scope!==undefined&&!SCOPES.includes(rule.scope))add('SOURCE_SCOPE','字段来源轮次或节点范围无效',rinfo);
          const type=typeFor(rule,catalog),field=(catalog?.fields||[]).find(f=>f.source===rule.source&&f.id===rule.fieldId);
          if(['IMPORT','FOLLOWUP'].includes(rule.source)&&(!field||field.enabled===false))add('FIELD_UNAVAILABLE','此分类未启用或无权读取所选字段',rinfo);
          if(!operators(type).includes(rule.operator))add('OPERATOR_TYPE','当前字段类型不支持该运算符',rinfo);
          if(rule.source==='CALL_STATUS'&&(!domain||!Array.isArray(domain.statuses)))add('STATUS_DOMAIN','当前渠道状态枚举尚未核定',rinfo);
          if(rule.source==='AI_TAG'&&(!domain||domain.channel!=='AI'||!Array.isArray(domain.statuses)))add('STATUS_DOMAIN','AI意向标签须保留准确的 AI 通话来源接口',rinfo);
          if(rule.source==='AI_TAG'&&(!ai||!Array.isArray(ai.tags)))add('AI_CONTEXT','供应商 / 租户 / 分类的稳定标签配置尚未核定',rinfo);
          const values=rule.values;
          if(!Array.isArray(values)||!unique(values)||!values.every(primitive)){add('RULE_VALUES','条件值须为不重复的明确值集合',rinfo);continue;}
          if(EMPTY.includes(rule.operator)){if(values.length)add('RULE_VALUES','空值判断不能同时携带比较值',rinfo);continue;}
          if(!values.length)add('RULE_VALUES','请至少填写一个比较值，每行一个值',rinfo);
          else if(!['IN','NOT_IN','CONTAINS_ANY','CONTAINS_ALL'].includes(rule.operator)&&values.length!==1)add('RULE_VALUES','此判断只允许一个比较值；多个值请使用“属于任一值”或“不属于任一值”',rinfo);
          const available=rule.source==='CALL_STATUS'?(domain?.statuses||[]).map(s=>s.value):rule.source==='AI_TAG'?(ai?.tags||[]).map(t=>t.id):['select','multiselect','enum'].includes(type)?(field?.options||[]).filter(o=>o.enabled!==false).map(o=>o.id):null;
          if(available&&values.some(v=>!available.includes(v)))add('VALUE_UNAVAILABLE','比较值不属于当前范围的稳定状态 / 字段选项 / 标签标识',rinfo);
          if(!available&&values.some(v=>comparable(v,type)===null))add('VALUE_TYPE','比较值不符合字段类型；时间须注明时区',rinfo);
        }
      }
      // Exact duplicates are always redundant; simple intersecting single-rule
      // predicates warn about overlap; ordered first-match permits useful numeric bands.
      const conditionalEdges=out.filter(e=>e.branch?.kind!=='ELSE'&&Array.isArray(e.conditions?.rules));
      const canonicalRule=r=>JSON.stringify([r?.source,r?.fieldId||'',r?.scope||'CURRENT_NODE',r?.operator,(Array.isArray(r?.values)?r.values:[]).slice().sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)))]);
      const canonical=e=>JSON.stringify([e.conditions.mode,e.conditions.rules.map(canonicalRule).sort()]);
      for(let i=0;i<conditionalEdges.length;i++)for(let j=i+1;j<conditionalEdges.length;j++){
        const a=conditionalEdges[i],b=conditionalEdges[j];
        if(canonical(a)===canonical(b))add('CONDITION_DUPLICATE','不同出口含相同条件，较后出口永远无法优先命中',{...detail,edgeId:b.edgeId});
        else if(a.conditions.rules.length===1&&b.conditions.rules.length===1&&object(a.conditions.rules[0])&&object(b.conditions.rules[0])&&overlap(a.conditions.rules[0],b.conditions.rules[0],catalog))warnings.push({code:'CONDITION_OVERLAP',message:'出口条件存在交集，将按优先级只选首个命中分支',...detail,edgeId:b.edgeId});
      }
    }
    const visiting=new Set(),done=new Set(),cycle=new Set();let cycleEdge=null;
    function visit(id,incoming){if(visiting.has(id)){cycle.add(id);cycleEdge||=incoming;return;}if(done.has(id))return;visiting.add(id);edges.filter(e=>e.fromNodeId===id&&ids.has(e.toNodeId)).forEach(e=>visit(e.toNodeId,e));visiting.delete(id);done.add(id);}
    nodes.forEach(n=>visit(n.nodeId));if(cycle.size)add('CYCLE','路径形成循环，请选择其他下一节点。',{nodeId:cycleEdge?.fromNodeId||[...cycle][0],...(cycleEdge?{edgeId:cycleEdge.edgeId}:{})});
    const reached=new Set(),todo=[input.startNodeId,...(Array.isArray(input.entryRules)?input.entryRules:[]).map(entry=>entry.toNodeId).filter(id=>ids.has(id))];while(todo.length){const id=todo.shift();if(reached.has(id))continue;reached.add(id);edges.filter(e=>e.fromNodeId===id).forEach(e=>todo.push(e.toNodeId));}
    for(const node of nodes)if(!reached.has(node.nodeId))add('UNREACHABLE','存在无法从起始节点到达的节点',{nodeId:node.nodeId});
    if(!nodes.some(n=>n.type==='END'))add('NO_END','请添加结束节点');
    return {ok:issues.length===0,issues,warnings};
  }
  function overlap(a,b,catalog){
    if(a.source!==b.source||a.fieldId!==b.fieldId||(a.scope||'CURRENT_NODE')!==(b.scope||'CURRENT_NODE'))return false;
    const one=['IN','EQ'];if(one.includes(a.operator)&&one.includes(b.operator))return (a.values||[]).some(v=>(b.values||[]).includes(v));
    if(a.operator==='CONTAINS_ANY'&&b.operator==='CONTAINS_ANY')return (a.values||[]).some(v=>(b.values||[]).includes(v));
    if(EMPTY.includes(a.operator)||EMPTY.includes(b.operator))return a.operator===b.operator;
    const type=typeFor(a,catalog);if(!['number','date','datetime'].includes(type))return false;
    const interval=r=>{const v=comparable(r.values?.[0],type);if(v===null)return null;return ({EQ:[v,true,v,true],GT:[v,false,Infinity,false],GTE:[v,true,Infinity,false],LT:[-Infinity,false,v,false],LTE:[-Infinity,false,v,true]})[r.operator]||null;};
    const x=interval(a),y=interval(b);if(!x||!y)return false;const lo=Math.max(x[0],y[0]),hi=Math.min(x[2],y[2]);return lo<hi||lo===hi&&(x[0]!==lo||x[1])&&(y[0]!==lo||y[1])&&(x[2]!==hi||x[3])&&(y[2]!==hi||y[3]);
  }
  function evaluate(version,node,record,catalog,options={}){
    if(version?.routingPolicy!==POLICY)return null;
    record=object(record)?record:{};node=object(node)?node:{};
    catalog=catalog||version.routingCatalog;
    const round=record?.rounds?.at(-1),edges=(Array.isArray(version.edges)?version.edges:[]).filter(e=>object(e)&&e.fromNodeId===node?.nodeId).sort((a,b)=>(a.branch?.priority||0)-(b.branch?.priority||0));
    const actualRef=record?.categorySnapshot?.categoryRef||{categoryId:record?.categoryId,version:record?.categorySnapshot?.version,fieldsVersion:record?.categorySnapshot?.fieldsVersion,brandId:record?.brandId,categoryScope:record?.categorySnapshot?.categoryScope,tenantId:record?.categorySnapshot?.tenantId};
    const contextProblem=categoryIssue(version.categoryRef,actualRef)||categoryIssue(version.categoryRef,catalog?.categoryRef)||(!round||round.tenantId!==record.ownerTenantId?'当前租户轮次无法核定':'')||(record.nodeId!==node?.nodeId?'当前节点不一致':'');
    const pending=(reason,extra={})=>({state:'PENDING',reason,...extra});
    function evidence(){
      const source=node.conditionSource||{},scope=source.scope||'CURRENT_NODE';
      const rounds=scope==='HISTORY'?(record.rounds||[]).filter(r=>r.tenantId===record.ownerTenantId):[round];
      const candidates=rounds.flatMap(r=>(r?.segments||[]).map(segment=>({round:r,segment}))).filter(({segment:s})=>s.tenantId===record.ownerTenantId&&(!record.runId||scope==='HISTORY'||s.runId===record.runId)&&(!source.sourceNodeId||s.nodeId===source.sourceNodeId)&&(scope!=='CURRENT_NODE'||s.nodeRunId===record.nodeRunId)&&(source.channel==='AI'?s.method==='AI':source.channel==='CLOUD'?['MANUAL','PREDICTIVE'].includes(s.method):false));
      // Select the last relevant segment before reading evidence. A newer unknown
      // result may never fall back to an older known call merely to find a match.
      const candidate=candidates.at(-1),segment=candidate?.segment,sourceRound=candidate?.round;
      const ev=segment?.routingEvidence||(record.routingEvidence?.segmentId===segment?.segmentId?record.routingEvidence:null);
      if(!segment||!object(ev)||ev.segmentId!==segment.segmentId||ev.tenantId!==record.ownerTenantId||ev.roundId!==sourceRound?.roundId||ev.nodeRunId!==segment.nodeRunId||ev.channel!==source.channel||ev.domainId!==source.domainId||scope==='CURRENT_NODE'&&ev.nodeRunId!==record.nodeRunId)return pending('所选节点、轮次或渠道的最终结果尚未就绪',{sourceScope:scope});
      if(ev.conflict===true)return pending('原执行段条件证据存在冲突，请核对原结果');
      const currentExecution=segment.nodeRunId===record.nodeRunId;
      if(segment.roundId!==ev.roundId||segment.ended!==true||ev.completed!==true||ev.retriesCompleted!==true||currentExecution&&(record.execution?.state!=='ended'||record.execution?.noMoreCalls!==true))return pending('单次呼叫结果不能代替重试结束后的节点最终结果',{sourceScope:scope});
      if(source.channel==='AI'&&segment.method!=='AI'||source.channel==='CLOUD'&&!['MANUAL','PREDICTIVE'].includes(segment.method))return pending('结果所属处理方式与条件来源不同');
      const domain=domainFor(node,catalog);
      if(!domain||!Array.isArray(domain.statuses))return pending('所选通话来源接口或渠道尚未核定',{sourceScope:scope,domainId:source.domainId});
      if(domain?.methods&&!domain.methods.includes(segment.method))return pending('原执行段处理方式不适用所选通话状态接口',{sourceScope:scope,method:segment.method,domainId:source.domainId});
      if((sourceRound?.segments||[]).some(s=>s.nodeRunId===segment.nodeRunId&&s.tenantId===record.ownerTenantId&&s.ended!==true))return pending('所选来源节点仍有未结束处理段',{sourceScope:scope});
      return {state:'KNOWN',reason:scope==='HISTORY'?'明确选取本租户历史最后处理节点最终结果':scope==='CURRENT_ROUND'?'本租户本轮最后处理节点最终结果':'当前租户本轮本节点的最终结果快照',...clone(ev),sourceScope:scope};
    }
    function fieldValue(rule){
      const def=(catalog?.fields||[]).find(f=>f.id===rule.fieldId&&f.source===rule.source);
      if(!def||def.enabled===false||options.readableFieldIds&&!options.readableFieldIds.includes(rule.fieldId))return pending('字段定义或当前租户读取权限待核',{fieldId:rule.fieldId});
      if(rule.source==='IMPORT')return has(record.fields,rule.fieldId)&&record.fields[rule.fieldId]!==undefined?{state:'KNOWN',value:clone(record.fields[rule.fieldId]),reason:'该记录固定分类的原始导入快照',fieldId:rule.fieldId,sourceScope:'IMPORT',categoryRef:clone(version.categoryRef)}:pending('原始导入快照未提供该字段；不视为空',{fieldId:rule.fieldId});
      if(node.conditionSource?.channel!=='CLOUD')return pending('填写字段须使用人工或预外呼的已保存表单来源',{fieldId:rule.fieldId});
      const scope=rule.scope||'CURRENT_NODE',explicit=record.routingFieldValues?.[rule.fieldId];
      if(explicit){
        if(explicit.sourceKind==='CORRECTION'){
          const audit=(record.corrections||[]).find(c=>c.correctionId===explicit.correctionId),change=audit?.changes?.find(c=>c.fieldId===rule.fieldId&&c.source==='FOLLOWUP');
          const valid=explicit.state==='KNOWN'&&has(explicit,'value')&&audit&&audit.tenantId===record.ownerTenantId&&audit.runId===record.runId&&audit.stageId===round?.roundId&&explicit.tenantId===audit.tenantId&&explicit.runId===audit.runId&&explicit.stageId===audit.stageId&&explicit.categoryRef?.categoryId===version.categoryRef.categoryId&&change&&JSON.stringify(change.after)===JSON.stringify(explicit.value)&&(!node.conditionSource?.sourceNodeId||explicit.sourceNodeId===node.conditionSource.sourceNodeId);
          if(!valid)return pending('当前更正值的审计、运行或来源节点待核',{fieldId:rule.fieldId,sourceScope:scope});
          const normalized=normalizeSavedField(explicit.value,def.type);if(!normalized.ok)return pending('当前更正值类型不符合条件字段',{fieldId:rule.fieldId});
          return {...clone(explicit),value:clone(normalized.value),reason:'有权人员直接更正的当前有效值，原跟进快照保持',sourceScope:scope};
        }
        const identity=explicit.tenantId===record.ownerTenantId&&(!record.runId||scope==='HISTORY'||explicit.runId===record.runId)&&explicit.categoryId===version.categoryRef.categoryId&&explicit.categoryVersion===version.categoryRef.version&&explicit.fieldsVersion===version.categoryRef.fieldsVersion;
        const sourceRound=record.rounds?.find(r=>r.roundId===explicit.roundId),segment=sourceRound?.segments?.find(s=>s.segmentId===explicit.segmentId),sameNode=explicit.nodeRunId===record.nodeRunId;
        if(!identity||!sourceRound||sourceRound.tenantId!==record.ownerTenantId||!segment||node.conditionSource?.sourceNodeId&&segment.nodeId!==node.conditionSource.sourceNodeId||!['MANUAL','PREDICTIVE'].includes(segment.method)||segment.tenantId!==record.ownerTenantId||segment.nodeRunId!==explicit.nodeRunId||segment.saved!==true||segment.ended!==true||scope==='CURRENT_NODE'&&(!sameNode||explicit.roundId!==round.roundId)||scope==='CURRENT_ROUND'&&explicit.roundId!==round.roundId)return pending('培育字段的保存来源或版本范围待核',{fieldId:rule.fieldId,sourceScope:scope});
        return explicit.state==='KNOWN'&&has(explicit,'value')?{...clone(explicit),reason:'已保存的明确字段快照',sourceScope:scope}:pending('培育字段尚未明确保存',{fieldId:rule.fieldId,sourceScope:scope});
      }
      const rounds=scope==='HISTORY'?(record.rounds||[]).filter(r=>r.tenantId===record.ownerTenantId):[round];
      const candidates=rounds.flatMap(r=>(r?.segments||[]).map((segment,index)=>({round:r,segment,index}))).filter(({segment:s})=>s.tenantId===record.ownerTenantId&&(!record.runId||scope==='HISTORY'||s.runId===record.runId)&&(!node.conditionSource?.sourceNodeId||s.nodeId===node.conditionSource.sourceNodeId)&&['MANUAL','PREDICTIVE'].includes(s.method)&&s.saved===true&&s.ended===true&&(scope!=='CURRENT_NODE'||s.nodeRunId===record.nodeRunId));
      // Order is the immutable round/segment sequence, never unreliable callback arrival.
      for(const candidate of candidates.reverse()){
        const segment=candidate.segment,snapshot=segment.routingFieldSnapshot;
        // System archival confirms call facts, not new human field values.
        if(!has(segment,'routingFieldSnapshot'))continue;
        if(!object(snapshot)||snapshot.schema!==1||snapshot.recordId!==record.recordId||snapshot.tenantId!==segment.tenantId||snapshot.roundId!==candidate.round.roundId||snapshot.nodeRunId!==segment.nodeRunId||snapshot.segmentId!==segment.segmentId||categoryIssue(version.categoryRef,snapshot.categoryRef)||!Array.isArray(snapshot.providedFieldIds)||!unique(snapshot.providedFieldIds)||!object(snapshot.values))return pending('原段字段确认快照或归属待核',{fieldId:rule.fieldId,sourceScope:scope});
        if(snapshot.confirmedFieldIds!==undefined&&(!Array.isArray(snapshot.confirmedFieldIds)||!unique(snapshot.confirmedFieldIds)))return pending('原段已确认字段标记无效',{fieldId:rule.fieldId,sourceScope:scope});
        if(![...snapshot.providedFieldIds,...(snapshot.confirmedFieldIds||[])].includes(rule.fieldId))continue;
        if(!has(snapshot.values,rule.fieldId))return pending('原段已确认字段缺少保存值',{fieldId:rule.fieldId,sourceScope:scope});
        const value=snapshot.values[rule.fieldId];
        const form=segment.formSchema,definition=form?.fields?.find(f=>f.id===rule.fieldId);
        if(!definition||definition.type!==def.type||form.category?.id!==version.categoryRef.categoryId)return pending('原段字段定义与模板固定类型不一致',{fieldId:rule.fieldId,sourceScope:scope});
        const normalized=normalizeSavedField(value,def.type);
        if(!normalized.ok)return pending('原段培育值类型或时间所属时区待核',{fieldId:rule.fieldId,sourceScope:scope});
        return {state:'KNOWN',value:clone(normalized.value),fieldId:rule.fieldId,sourceScope:scope,tenantId:record.ownerTenantId,roundId:candidate.round.roundId,nodeRunId:segment.nodeRunId,segmentId:segment.segmentId,reason:scope==='HISTORY'?'明确选取本租户历史已保存值':scope==='CURRENT_ROUND'?'本轮最后有效已保存值':'本节点最后有效已保存值'};
      }
      return pending('此来源范围尚无已保存培育字段；不视为空',{fieldId:rule.fieldId,sourceScope:scope});
    }
    function actual(rule){
      if(contextProblem)return pending(contextProblem);
      if(rule.source==='IMPORT'||rule.source==='FOLLOWUP')return fieldValue(rule);
      const ev=evidence();if(ev.state!=='KNOWN')return ev;
      if(rule.source==='CALL_STATUS'){
        const domain=domainFor(node,catalog);
        if(domain?.rawVerification){const normalized=root.DFlowNormalizeStatus?.(ev.domainId,ev.rawDomain||(ev.channel==='CLOUD'?ev.domainId:''),ev.rawCode);if(normalized?.state!=='KNOWN'||normalized.value!==ev.statusValue)return pending('原始code与该接口的已核映射不一致，保留原始值待核',{rawCode:ev.rawCode,rawLabel:ev.rawLabel,rawDomain:ev.rawDomain});}
        if(ev.state!=='KNOWN'||ev.conflict===true||typeof ev.rawCode!=='string'||ev.rawCode.length===0||typeof ev.rawLabel!=='string'||!domain?.statuses?.some(s=>s.value===ev.statusValue))return pending('原始通话状态未知、冲突或映射待核',{channel:ev.channel,domainId:ev.domainId,rawCode:ev.rawCode,rawLabel:ev.rawLabel,sourceScope:ev.sourceScope});
        return {...ev,value:ev.statusValue};
      }
      if(rule.source==='AI_TAG'){
        const ctx=contextFor(node,catalog),tags=ev.tags;
        if(!ctx||!tags||!['KNOWN','NONE'].includes(tags.state)||!Array.isArray(tags.ids)||!unique(tags.ids)||['supplierId','tenantId','tenantType','tagSceneId','categoryId','brandId'].some(k=>tags[k]!==ctx[k])||ctx.tenantId!==record.ownerTenantId||tags.revision!==ctx.revision||tags.ids.some(id=>!ctx.tags.some(t=>t.id===id))||tags.state==='NONE'&&tags.ids.length)return pending('意向标签待识别、未映射或供应商 / 租户 / 分类配置版本待核');
        return {...clone(tags),state:'KNOWN',value:clone(tags.ids),recognitionState:tags.state,simulation:ev.simulation===true,sourceScope:ev.sourceScope,reason:tags.state==='NONE'?'已识别完成，明确无标签':'已识别完成并映射至固定标准标签',evidence:{tenantId:ev.tenantId,roundId:ev.roundId,nodeRunId:ev.nodeRunId,segmentId:ev.segmentId}};
      }
      return pending('未知条件来源');
    }
    const empty=v=>v===null||v===''||Array.isArray(v)&&v.length===0;
    function ruleResult(rule){
      const source=actual(rule),type=typeFor(rule,catalog),info={ruleId:rule.ruleId,fieldId:rule.fieldId||null,source:clone(source),actual:has(source,'value')?clone(source.value):null};
      if(source.state!=='KNOWN')return {...info,status:'PENDING',reason:source.reason};
      if(!operators(type).includes(rule.operator)||!Array.isArray(rule.values))return {...info,status:'PENDING',reason:'固定规则类型或运算符无效'};
      const value=source.value,values=rule.values;let match=false;
      if(EMPTY.includes(rule.operator))match=rule.operator==='IS_EMPTY'?empty(value):!empty(value);
      else if(empty(value))match=false;
      else if(type==='AI_TAG'||type==='multiselect'){
        const allowed=rule.source==='AI_TAG'?contextFor(node,catalog)?.tags:(catalog.fields||[]).find(f=>f.id===rule.fieldId&&f.source===rule.source)?.options;
        if(!Array.isArray(value)||value.some(v=>!allowed?.some(o=>o.id===v)))return {...info,status:'PENDING',reason:'已保存多选值不符合固定选项定义'};
        match=rule.operator==='CONTAINS_ALL'?values.every(v=>value.includes(v)):values.some(v=>value.includes(v));
      }else{
        const v=comparable(value,type),expected=values.map(x=>comparable(x,type));
        const def=rule.source==='CALL_STATUS'?domainFor(node,catalog)?.statuses:(catalog.fields||[]).find(f=>f.source===rule.source&&f.id===rule.fieldId)?.options;
        if(v===null||expected.some(x=>x===null)||['select','enum'].includes(type)&&!def?.some(o=>o.id===value))return {...info,status:'PENDING',reason:'已保存值类型或稳定选项无法核定'};
        match=({IN:()=>expected.includes(v),NOT_IN:()=>!expected.includes(v),EQ:()=>v===expected[0],NE:()=>v!==expected[0],GT:()=>v>expected[0],GTE:()=>v>=expected[0],LT:()=>v<expected[0],LTE:()=>v<=expected[0]})[rule.operator]?.()||false;
      }
      return {...info,status:match?'MATCHED':'UNMATCHED',reason:match?'本条条件满足':'已知值不满足本条条件'};
    }
    const checked=validate(version,catalog),configurationProblem=checked.ok?'':checked.issues.map(i=>i.message).join('；');
    const results=[];let selected=null,blocked=false;
    for(const edge of edges){
      let status='UNMATCHED',reason='较高优先级路径已命中',rules=[];
      if(configurationProblem||contextProblem){status='PENDING';reason=configurationProblem||contextProblem;blocked=true;}
      else if(!selected){
        if(blocked){status='PENDING';reason='前方条件尚未明确，暂不进入后续路径或默认路径';}
        else if(edge.branch.kind==='ELSE'){status='MATCHED';reason='前方条件均已明确不匹配，使用默认路径';selected=edge.edgeId;}
        else{
          rules=edge.conditions.rules.map(ruleResult);const any=s=>rules.some(r=>r.status===s);
          // A not-ready source is never silently treated as a false condition
          // while deciding whether ELSE may become eligible.
          status=any('PENDING')?'PENDING':edge.conditions.mode==='ALL'?(any('UNMATCHED')?'UNMATCHED':'MATCHED'):(any('MATCHED')?'MATCHED':'UNMATCHED');
          reason=status==='MATCHED'?'按优先级命中此唯一出口':status==='PENDING'?'条件取值尚未就绪，后续分支暂停':'本路径条件已明确不匹配';
          if(status==='MATCHED')selected=edge.edgeId;if(status==='PENDING')blocked=true;
        }
      }
      results.push({...clone(edge),status,reason,rules,sources:{categoryRef:clone(version.categoryRef),conditionSource:clone(node.conditionSource),rules:rules.map(r=>clone(r.source))},selectable:status==='MATCHED'&&options.eligible!==false});
    }
    return {policy:POLICY,selectedEdgeId:selected,edgeEvaluations:results,sources:{categoryRef:clone(version.categoryRef),conditionSource:clone(node?.conditionSource)},pending:blocked};
  }
  root.DFlowRouting=Object.freeze({POLICY,operators,validate,evaluate,normalizeSavedField,parseComparisonValues});
})(typeof window==='undefined'?globalThis:window);
