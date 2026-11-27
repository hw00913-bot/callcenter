(() => {
  'use strict';

  const prefix = 'd-contact-cloud-v210-review:quality-model-config-v1:';
  const managerRoles = new Set(['hq_admin','store_admin','super']);
  const levelNames = ['大类','小类','细项'];
  const childKeys = ['groups','items'];
  const idPattern = /^[a-zA-Z0-9_-]{1,120}$/;
  const seedTime = '2026-11-22 14:00:00';
  const defaultTiers = [{lower:90,upper:100,score:100},{lower:50,upper:90,score:85},{lower:null,upper:50,score:75}];
  const clean = value => typeof value==='string'?value.trim():'';
  const copy = value => structuredClone(value);
  const fail = (error,path=[]) => ({ok:false,error,path,categoryIndex:path[0],groupIndex:path[1],itemIndex:path[2]});
  const modelStateTime = value => typeof value==='string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value);
  const metric = (id,name,description) => ({id,name,description,logic:'',formulaType:'ratioRange',tiers:copy(defaultTiers)});
  const group = (id,name,items) => ({id,name,items});

  function catalog() {
    const rubric = window.DQualityInspection?.model?.() || [];
    const observed = rubric.map(({id,name,groups})=>({id,name,groups:groups.map(row=>
      group(row.id,row.name,row.items.map(item=>metric(item.id,item.name,item.description))))}));
    const named = name => observed.find(category=>category.name===name);
    const photographed = [
      {id:'QMC-DILIGENCE',name:'勤勉程度',groups:[
        group('QMG-RESPOND','跟进及时性',[metric('QMI-RESPOND-30','新线索30分钟跟进率','分析坐席的新线索30分钟跟进率')]),
        group('QMG-PROACTIVE','跟进主动性',[metric('QMI-PROACTIVE','主动跟进率','分析坐席主动跟进线索的情况')])
      ]},
      {id:'QMC-PROCESS',name:'流程规范',groups:[
        group('QMG-RECORD','跟进记录',[metric('QMI-RECORD','回访信息完整率','分析坐席的回访信息记录完整情况')]),
        group('QMG-DELIVERY','线索下发',[metric('QMI-DELIVERY','下发确认率','分析线索下发前的确认流程')])
      ]},
      {id:'QMC-SCRIPT',name:'话术规范',groups:named('销售引导及话术标准')?.groups || [
        group('QMG-OPENING','开场白',[metric('QMI-OPENING','报品牌并自我介绍','开场报出品牌并做自我介绍')])
      ]},
      named('应对技巧') || {id:'QMC-RESPONSE',name:'应对技巧',groups:[
        group('QMG-OBJECTION','异议处理',[metric('QMI-OBJECTION','价格异议应对','合理回应客户的价格异议')])
      ]},
      named('服务态度') || {id:'QMC-SERVICE',name:'服务态度',groups:[
        group('QMG-ATTENTIVE','服务热情',[metric('QMI-ATTENTIVE','主动问候','接通后主动问候客户')])
      ]},
      {id:'QMC-EXPERTISE',name:'专业能力',groups:[
        group('QMG-PRODUCT','车型知识',[metric('QMI-PRODUCT','产品知识答复准确率','核对坐席答复的车型及配置信息')])
      ]}
    ];
    return [...photographed,...observed.filter(category=>!photographed.some(item=>item.id===category.id))];
  }

  function access(requested = window.DSession?.context()) {
    const identity = window.DQualityInspection?.access(requested);
    if (identity?.role!=='manager') return null;
    const role = window.DSession?.roleKey(requested);
    if (!managerRoles.has(role)) return null;
    const {tenantId,tenantName,brandId,accountId,accountName} = identity;
    return {tenantId,tenantName,brandId,accountId,accountName};
  }

  function exampleCategories(selection) {
    return selection.map(({id,name,groups},index)=>({
      id:'category-'+id,catalogId:id,name,weight:100/selection.length,order:index+1,
      groups:groups.slice(0,id==='QMC-DILIGENCE'?2:1).map((child,childIndex)=>({
        id:'group-'+child.id,catalogId:child.id,name:child.name,weight:childIndex===0?100:0,order:childIndex+1,
        items:child.items.slice(0,1).map(item=>({
          ...copy(item),id:'item-'+item.id,catalogId:item.id,weight:100,order:1
        }))
      }))
    }));
  }

  function builtIn(scope) {
    return {
      id:'QMODEL-'+scope.tenantId+'-0002',tenantId:scope.tenantId,brandId:scope.brandId,version:1,status:'active',
      createdAt:seedTime,createdBy:'演示管理员',updatedAt:seedTime,updatedBy:'演示管理员',
      categories:exampleCategories(catalog().slice(0,5))
    };
  }

  function numeric(value) {
    if (typeof value==='number') return Number.isFinite(value)?value:NaN;
    return typeof value==='string' && /^\d+(?:\.\d+)?$/.test(value.trim())?Number(value):NaN;
  }

  const optionalBound = value => value==null || typeof value==='string' && !value.trim()?null:numeric(value);
  const isPercent = value => Number.isFinite(value) && value>=0 && value<=100;

  function normalizeTiers(tiers,path) {
    if (!Array.isArray(tiers) || !tiers.length) return fail('请至少配置一条档位。',path);
    const bounds = [];
    const rows = [];
    for (const [index,row] of tiers.entries()) {
      const lower = optionalBound(row?.lower);
      const upper = optionalBound(row?.upper);
      const score = numeric(row?.score);
      const lo = lower??-Infinity;
      const hi = upper??Infinity;
      if ((lower!==null && !isPercent(lower)) || (upper!==null && !isPercent(upper)) ||
          !isPercent(score) || lo>=hi || lo===100) {
        return fail('档位上下限与分值须在 0–100 之间，填写两个边界时下限须小于上限。',[...path,index]);
      }
      if (bounds.some(([start,end])=>Math.max(lo,start)<Math.min(hi,end))) {
        return fail('档位区间不能重叠。',[...path,index]);
      }
      rows.push({lower,upper,score});
      bounds.push([lo,hi]);
    }
    return {ok:true,rows};
  }

  function normalizeNodes(nodes,options,path=[],depth=0) {
    const level = levelNames[depth];
    if (!Array.isArray(nodes) || !nodes.length) return fail('请至少配置一个'+level+'。',path);
    const rows = [];
    const ids = new Set();
    const chosenOptions = new Set();
    for (const [index,node] of nodes.entries()) {
      const position = [...path,index];
      const id = clean(node?.id);
      const name = clean(node?.name);
      const catalogId = clean(node?.catalogId);
      const chosen = options.find(option=>catalogId?option.id===catalogId:option.name===name);
      if (!idPattern.test(id) || !chosen || chosen.name!==name) return fail('请选择有效的'+level+'名称。',position);
      if (ids.has(id) || chosenOptions.has(chosen.id)) return fail('同一级不能重复配置'+level+'。',position);
      const weight = numeric(node.weight);
      const order = numeric(node.order);
      if (!isPercent(weight)) return fail('请填写 0–100% 的'+level+'权重。',position);
      if (!Number.isSafeInteger(order) || order<1) return fail('请填写大于 0 的整数排序。',position);
      const row = {id,catalogId:chosen.id,name,weight,order};
      const child = childKeys[depth];
      if (child) {
        const children = normalizeNodes(node[child],chosen[child],position,depth+1);
        if (!children.ok) return children;
        row[child] = children.rows;
      } else {
        const description = clean(node.description);
        const logic = clean(node.logic);
        if (!description || description.length>100) return fail('请填写细项描述，最多 100 字。',position);
        if (logic.length>100) return fail('评判逻辑简述最多 100 字。',position);
        if (node.formulaType!=='ratioRange') return fail('请选择计算公式类型。',position);
        const result = normalizeTiers(node.tiers,position);
        if (!result.ok) return result;
        Object.assign(row,{description,logic,formulaType:node.formulaType,tiers:result.rows});
      }
      ids.add(id);
      chosenOptions.add(chosen.id);
      rows.push(row);
    }
    if (Math.abs(rows.reduce((sum,row)=>sum+row.weight,0)-100)>1e-7) {
      return fail('同一级'+level+'的权重合计应为 100%。',path);
    }
    return {ok:true,rows:rows.sort((a,b)=>a.order-b.order)};
  }

  function readLegacy(scope) {
    const key = prefix+encodeURIComponent(scope.brandId)+':'+encodeURIComponent(scope.tenantId);
    try {
      const original = localStorage.getItem(key);
      if (original===null) return null;
      const data = JSON.parse(original);
      if (data?.version!==1 || !Number.isSafeInteger(data.revision) || data.revision<0 ||
          !Array.isArray(data.models) || !Array.isArray(data.history)) {
        return null;
      }
      const ids = new Set();
      const options = catalog();
      for (const model of data.models) {
        if (!model || typeof model.id!=='string' || !idPattern.test(model.id) || ids.has(model.id) ||
            scope.tenantId!==model.tenantId || scope.brandId!==model.brandId ||
            !['active','inactive'].includes(model.status) || !Number.isSafeInteger(model.version) || model.version<1 ||
            typeof model.createdBy!=='string' || typeof model.updatedBy!=='string' ||
            !modelStateTime(model.createdAt) || !modelStateTime(model.updatedAt) ||
            !normalizeNodes(model.categories,options).ok) {
          return null;
        }
        ids.add(model.id);
      }
      if (data.models.filter(model=>model.status==='active').length>1 ||
          !data.history.every(entry=>entry && ids.has(entry.modelId) && Number.isSafeInteger(entry.version) &&
            modelStateTime(entry.at) && Array.isArray(entry.categories))) {
        return null;
      }
      return data;
    } catch (_) {
      return null;
    }
  }

  function active(requested) {
    const scope = access(requested);
    if (!scope) return null;
    return readLegacy(scope)?.models.find(model=>model.status==='active') || builtIn(scope);
  }

  function getVersion(id,version,requested) {
    const scope = access(requested);
    if (!scope) return null;
    const legacy = readLegacy(scope);
    const current = legacy?.models.find(model=>model.id===id && model.version===version);
    if (current) return current;
    const archived = legacy?.history.findLast(event=>event.modelId===id && event.version===version);
    if (archived && normalizeNodes(archived.categories,catalog()).ok) return archived;
    const fallback = builtIn(scope);
    return fallback.id===id && fallback.version===version ? fallback : null;
  }

  window.DQualityModelConfig = Object.freeze({access,active,getVersion});
})();
