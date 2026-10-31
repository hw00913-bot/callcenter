  function importSchema(id,categoryId,catalog){
    const core=[{key:'name',label:'客户称呼',type:'text',required:true},{key:'phone',label:'客户号码',type:'phone',required:true},{key:'note',label:'联系备注',type:'text',required:false}];
    if(!id||!categoryId)return core.concat((window.CustomerBusiness?.importedFields||[]).map(f=>({...clone(f),type:'text',required:false})));
    const cfg=catalog||brandConfiguration(id),category=cfg.rows.find(c=>c.id===canonicalCategory(categoryId));
    requireThat(category,'CATEGORY_MISSING','业务分类不存在');
    // A missing importFields property belongs to the original immutable schema.
    if(!Object.hasOwn(category,'importFields'))return importSchema();
    const result=CustomerBusiness.importSchema(category.id,{...cfg.scope,brandId:id});
    requireThat(result.ok,'IMPORT_FIELDS_UNAVAILABLE',result.message||'分类导入字段无法读取');
    const fields=clone(core),ids=new Set(result.fields.map(f=>f.id)),targets=new Set();
    for(const field of result.fields){
      const target=String(field.businessKey||'');
      requireThat(target&&!['__proto__','prototype','constructor','code'].includes(target)&&(!ids.has(target)||target===field.id)&&!targets.has(target),'IMPORT_MAPPING_INVALID','导入字段业务编码缺失、重复或与保留字段冲突：'+field.label);
      targets.add(target);
      const position=fields.findIndex(f=>f.key===target&&!f.fieldId);
      requireThat(position<0||field.type==='text'||target==='note'&&field.type==='textarea','IMPORT_SYSTEM_TYPE','映射系统客户称呼、号码或备注时请使用对应文本字段：'+field.label);
      const definition={...clone(field),key:position>=0?target:field.id,fieldId:field.id,targetKey:target,aliases:[target,field.id],source:'IMPORT'};
      if(position>=0)fields[position]={...definition,type:fields[position].type,required:fields[position].required||definition.required};
      else fields.push(definition);
    }
    const labels=new Set(),keys=new Set();
    for(const field of fields){requireThat(!labels.has(field.label)&&!keys.has(field.key),'IMPORT_COLUMN_CONFLICT','导入列名与系统必需字段重复，请调整字段名称：'+field.label);labels.add(field.label);keys.add(field.key);}
    return fields;
  }
  function projectedImportSchema(id,categoryId,catalog){
    try{return {fields:importSchema(id,categoryId,catalog),issue:''};}
    catch(error){return {fields:importSchema().slice(0,3),issue:'导入字段配置需复核：'+error.message};}
  }
  function normalizeImportFields(cfg,input){
    const fields=clone(input),schema=cfg.fields||[],owned=new Map();
    try{
      for(const field of schema){
        const aliases=[field.key,...(field.fieldId?[field.fieldId,field.businessKey]:[])].filter(Boolean),provided=aliases.filter(key=>Object.hasOwn(input,key));
        if(!provided.length)continue;
        const first=input[provided[0]];
        requireThat(provided.every(key=>JSON.stringify(input[key])===JSON.stringify(first)),'IMPORT_MAPPING_CONFLICT','同一业务字段存在不同来源值：'+field.label);
        let value=clone(first);
        requireThat(!['text','textarea'].includes(field.type)||value===null||typeof value==='string','IMPORT_VALUE_TYPE',field.label+'须为文本');
        if(field.fieldId&&value!==null&&value!==''){
          if(['select','multiselect'].includes(field.type)){
            const raw=field.type==='multiselect'?(Array.isArray(value)?value:String(value).split('|').map(x=>x.trim()).filter(Boolean)):[value];
            const resolved=raw.map(item=>{const found=(field.options||[]).filter(o=>o.enabled!==false&&(o.id===item||o.label===item||o.businessKey&&o.businessKey===item));requireThat(found.length===1,'IMPORT_OPTION_INVALID',field.label+'包含未知或歧义选项：'+item);return found[0].id;});
            requireThat(new Set(resolved).size===resolved.length,'IMPORT_OPTION_DUPLICATE',field.label+'包含重复选项');value=field.type==='multiselect'?resolved:resolved[0];
          }
          if(field.type==='datetime'&&typeof value==='string'){
            value=value.replace(' ','T');
            if(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(value))value+=(value.length===16?':00':'')+'+08:00';
          }
          if(['number','date','datetime','multiselect'].includes(field.type)){
            const normalized=DFlowRouting.normalizeSavedField(value,field.type,'Asia/Shanghai');requireThat(normalized.ok,'IMPORT_VALUE_TYPE',field.label+'与字段类型不符');value=normalized.value;
          }
        }
        const destinations=[field.key,...(field.fieldId?[field.fieldId,field.businessKey]:[])].filter(Boolean);
        for(const key of destinations){
          requireThat(!['__proto__','prototype','constructor'].includes(key)&&(!owned.has(key)||owned.get(key)===field.key),'IMPORT_MAPPING_CONFLICT','导入字段映射目标重复：'+field.label);
          owned.set(key,field.key);fields[key]=clone(value);
        }
      }return {fields,error:''};
    }catch(error){return {fields,error:error.message};}
  }
