/* AI associations only. Category/field/template facts continue to use the original shared model. */
(function(){
  'use strict';
  const key=DSession.prefix+'ai-category-associations',pending=new Set();
  const clone=x=>JSON.parse(JSON.stringify(x));
  function read(){let raw;try{raw=localStorage.getItem(key);}catch(_){throw Error('场景关联读取失败，原记录已保留，请重试读取。');}if(raw===null)return {version:1,rows:[]};let d;try{d=JSON.parse(raw);}catch(_){throw Error('场景关联记录读取失败，原记录已保留。');}if(d.version!==1||!Array.isArray(d.rows))throw Error('场景关联记录格式待核。');return d;}
  function scope(){const c=DSession.context();if(!c||c.scope.kind!=='tenant')throw Error('请在有权业务租户内配置 AI 场景关联。');return c;}
  function current(sceneId){const c=scope(),row=clone(read().rows.find(r=>r.tenantId===c.scope.id&&String(r.sceneId)===String(sceneId))||null);pending.delete(c.scope.id+':'+sceneId);return row;}
  async function choices(options={}){const c=scope();if(!DSession.allowed('PAGE-2111')&&!DSession.allowed('PAGE-2006'))throw Error('没有分类目录使用权限。');const result=await DModuleHost.readCatalog(options);const latest=scope();if(latest.account.id!==c.account.id||latest.scope.id!==c.scope.id)throw Error('使用范围已变化，请重新打开配置。');if(!result.ok)throw Error(result.message||'公共分类读取失败。');return result;}
  async function save(sceneId,categoryId,evidence){const c=scope(),operationKey=c.scope.id+':'+sceneId;if(pending.has(operationKey))throw Error('上次关联结果待核，请先重新读取本场景，勿重复提交。');if(!DSession.allowed('PAGE-2111')||!DSession.canWrite('PAGE-2111'))throw Error('没有 AI 专业配置维护权限。');
    const relation=(DSeed.aiSceneRelations||[]).find(r=>r.tenantId===c.scope.id&&String(r.sceneId)===String(sceneId));
    if(!relation||!evidence||relation.executionSceneId!==evidence.executionSceneId||relation.platform!==evidence.platform||relation.supplierId!==evidence.supplierId||relation.tagSceneId!==evidence.tagSceneId||relation.tenantType!==evidence.tenantType||evidence.available!==true)throw Error('执行场景与供应商标签配置的对应关系尚未核定。');
    const selectedScope=evidence.categoryScope||(c.scope.tenant.brandId?'brand':'tenant');if(!['brand','tenant'].includes(selectedScope))throw Error('请选择有效配置目录');const catalog=await choices({legacy:selectedScope==='tenant'}),latest=scope();if(latest.account.id!==c.account.id||latest.scope.id!==c.scope.id)throw Error('使用范围已变化，本次未保存。');if((catalog.legacy===true?'tenant':'brand')!==selectedScope)throw Error('所选目录范围无法核定，本次未保存。');const row=catalog.rows.find(r=>r.id===categoryId),previous=current(sceneId);
    if(!row)throw Error('请选择当前目录内的有效分类。');const previousScope=previous?.categoryScope||(previous?.brandId?'brand':'tenant');if(row.enabled===false&&(previous?.categoryId!==categoryId||previousScope!==selectedScope))throw Error('停用分类不能新选择或新关联，原已有场景关联保持。');
    if(!DSession.canWrite('PAGE-2111'))throw Error('权限已变化，本次未保存。');
    const data=read(),index=data.rows.findIndex(r=>r.tenantId===c.scope.id&&String(r.sceneId)===String(sceneId));
    const next={tenantId:c.scope.id,brandId:selectedScope==='brand'?c.scope.tenant.brandId:'',categoryScope:selectedScope,sceneId:String(sceneId),categoryId,supplierId:relation.supplierId,tagSceneId:relation.tagSceneId,tenantType:relation.tenantType,updatedAt:new Date().toISOString(),operatorId:c.account.id};
    if(index<0)data.rows.push(next);else data.rows[index]=next;
    try{localStorage.setItem(key,JSON.stringify(data));}catch(_){throw Error('保存失败，原关联保持不变，请保留选择后重试。');}let saved;try{saved=current(sceneId);if(JSON.stringify(saved)!==JSON.stringify(next))throw Error();}catch(_){pending.add(operationKey);throw Error('关联保存结果待核，请先重新读取本场景，勿重复提交。');}return saved;
  }
  window.DCatalog={choices,current,save,key,links(categoryId,categoryScope='brand'){const c=scope();return clone(read().rows.filter(r=>r.tenantId===c.scope.id&&(r.categoryScope||(r.brandId?'brand':'tenant'))===categoryScope&&(categoryScope==='tenant'||r.brandId===c.scope.tenant.brandId)&&r.categoryId===categoryId));}};
})();
