/* One product classification directory. Legacy AI codes are adapters, not editable directories. */
(function(root){
  'use strict';
  const definitions=[
    {id:'lead',label:'新线索',tagId:'xxs',codeLabel:'线索编码',prefix:'LEAD'},
    {id:'lxs',label:'冷线索',tagId:'lxs',codeLabel:'冷线索编码',prefix:'LXS'},
    {id:'db',label:'督办',tagId:'db',codeLabel:'督办编码',prefix:'DB'},
    {id:'fw',label:'服务',tagId:'fw',codeLabel:'服务编码',prefix:'FW'},
    {id:'hf',label:'回访',tagId:'hf',codeLabel:'回访编码',prefix:'HF'},
    {id:'aftersales',label:'售后类',tagId:'aftersales',codeLabel:'售后单号',prefix:'AS'},
    {id:'activity',label:'活动类',tagId:'activity',codeLabel:'活动编码',prefix:'ACT'}
  ];
  const clone=v=>JSON.parse(JSON.stringify(v));
  const canonical=id=>({'CAT-LEAD':'lead','CAT-AFTERSALES':'aftersales','CAT-ACTIVITY':'activity',xxs:'lead'}[id]||id);
  const tagId=id=>canonical(id)==='lead'?'xxs':canonical(id);
  function upgrade(input){
    const b=clone(input);
    if(b.unifiedCatalogVersion===1)return b;
    if(!Array.isArray(b.types)||!Array.isArray(b.fields))throw Error('分类目录格式待核，原资料保持');
    const retired=new Set((b.retiredTypes||[]).map(x=>x.row?.id));
    for(const def of definitions){
      const prior=b.types.find(x=>x.id===def.id);
      const collision=b.types.find(x=>x.id!==def.id&&x.label===def.label);
      if(collision)throw Error('统一分类名称与其他稳定实体冲突，请先核对：'+def.label);
      if(prior){
        if(def.id==='lead'&&prior.label==='线索类'){
          prior.classificationNameHistory=[...(prior.classificationNameHistory||[]),{name:prior.label,version:prior.configurationVersion||1}];
          prior.label=def.label;prior.configurationVersion=Number(prior.configurationVersion||1)+1;
        }
      }else if(!retired.has(def.id))b.types.push({id:def.id,label:def.label,codeLabel:def.codeLabel,prefix:def.prefix,enabled:true,fields:[],configurationVersion:1,flowBinding:{main:null,backup:null,mappings:[]}});
    }
    b.unifiedCatalogVersion=1;
    return b;
  }
  function aiRows(rows){return rows.map(r=>({id:tagId(r.id),categoryId:r.id,name:r.label,localCode:'SCN-'+tagId(r.id).toUpperCase(),status:r.enabled===false?'disabled':'enabled'}));}
  root.DUnifiedCategories=Object.freeze({definitions:clone(definitions),canonical,tagId,upgrade,aiRows});
})(window);
