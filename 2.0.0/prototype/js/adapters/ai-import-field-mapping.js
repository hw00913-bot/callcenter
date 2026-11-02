/* Scene/provider input mapping. Shared business fields and private supplier columns stay separate. */
(function(root){
  'use strict';
  const clone=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));
  const empty=value=>value===undefined||value===null||typeof value==='string'&&!value.trim()||Array.isArray(value)&&!value.length;
  const parameter=value=>typeof value==='string'&&/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(value)&&!['__proto__','prototype','constructor'].includes(value);
  const identity=value=>typeof value==='string'&&!!value.trim()&&value.length<=160;
  function valueType(type,legacy=false){
    const raw=String(type||'text'),known={text:'text',string:'text','文本':'text',number:'number','数字':'number','数值':'number',date:'date','日期':'date'};
    const result=known[legacy?raw.toLowerCase():raw];if(!result)throw Error('供应商导入列类型须为文本、数字或日期。');return result;
  }
  function typeForImportField(field){return field.type==='number'?'number':field.type==='date'?'date':'text';}
  function customKey(scene,id){const part=value=>encodeURIComponent(String(value)).replace(/_/g,'%5F');return '__AI_CUSTOM__'+part(scene.platform||'')+'__'+part(scene.id??scene.sceneId??'DRAFT')+'__'+part(id);}
  function fixedFields(scene){
    let rows=[];
    const fixed=row=>({parameter:row.parameter||row.paramName||row.field,label:row.label||row.fieldName||row.parameter||row.paramName||row.field,required:!!row.required,...(row.type?{type:valueType(row.type,true)}:{})});
    if(scene.platform==='一知科技')rows=(root.MockDefaultInputFields||[]).map(fixed);
    else if(scene.platform==='中科金智能')rows=[{parameter:'name',label:'姓名',required:true}];
    else if(scene.platform==='冰兰'&&scene.importFixedParameters)rows=clone(scene.importFixedParameters).map(fixed);
    else if(scene.platform==='厚朴'){
      const templates=(root.MockHoupuTemplates||[]).filter(row=>row.templateId===scene.templateId);
      if(templates.length!==1)throw Error('厚朴任务的号码模板字段尚未唯一核定，请先查询任务配置。');
      rows=templates[0].fields.map(fixed);
    }
    for(const row of scene.customInputFields||[])rows.push({parameter:row.code,label:row.name||row.code,required:!!row.required,type:valueType(row.type||row.fieldType,true),legacy:true});
    const seen=new Set();for(const row of rows){if(!parameter(row.parameter)||seen.has(row.parameter))throw Error('供应商传入参数缺失或重复，请先核对场景配置。');seen.add(row.parameter);}return rows;
  }
  function normalizeCustom(field,raw){
    if(Array.isArray(raw)||raw&&typeof raw==='object')throw Error(field.label+'需要明确的'+({text:'文本',number:'数字',date:'日期'}[field.type])+'值。');
    if(field.type==='text'){if(!['string','number','boolean'].includes(typeof raw))throw Error(field.label+'文本值无效。');return String(raw);}
    if(field.type==='number'){
      if(typeof raw!=='number'&&!(typeof raw==='string'&&/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?$/.test(raw.trim())))throw Error(field.label+'需要填写数字。');
      const value=Number(raw);if(!Number.isFinite(value))throw Error(field.label+'数字值无效。');return value;
    }
    const value=String(raw);if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value+'T00:00:00Z'))||new Date(value+'T00:00:00Z').toISOString().slice(0,10)!==value)throw Error(field.label+'需要有效日期（YYYY-MM-DD）。');return value;
  }
  function review(input){
    try{
      const {scene,categoryId,fields,values}=input||{},customValues=input?.customValues;
      if(!scene||!scene.platform||!categoryId||!Array.isArray(fields))throw Error('当前场景、供应商或分类导入字段尚未就绪。');
      if(scene.importFieldMappingSchema!==undefined&&![1,2].includes(scene.importFieldMappingSchema))throw Error('场景导入字段映射版本待核，请保留原配置。');
      const version=scene.importFieldMappingSchema||1;
      if(version===2&&scene.importFieldPlatform!==undefined&&scene.importFieldPlatform!==scene.platform)throw Error('原映射属于其他供应商，请读取当前供应商的独立参数配置。');
      const allowed=fields.filter(field=>field.enabled!==false&&(!field.usage||field.usage==='IMPORT')&&!['FOLLOWUP','AI_CUSTOM'].includes(field.source)&&field.type!=='interface'),byId=new Map();
      for(const field of allowed){const id=field.fieldId||field.id||field.key;if(!id||byId.has(id))throw Error('分类导入字段身份缺失或重复。');byId.set(id,field);}
      const rows=scene.importFieldMappings===undefined?[]:scene.importFieldMappings;if(!Array.isArray(rows)||rows.length>100)throw Error('场景字段映射格式待核，请保留原配置。');
      if(rows.some(row=>(row?.source||'IMPORT_FIELD')==='IMPORT_FIELD')&&scene.importFieldCategoryId!==categoryId)throw Error('场景字段映射所属分类已变化，请重新选择当前分类的导入字段。');
      const mapped=[],customFields=[],usedParameters=new Set(),usedIds=new Set();
      function addCustom(row,flags={}){
        if(!identity(row.id)||usedIds.has(row.id))throw Error('场景供应商字段身份缺失或重复，请重新配置该列。');usedIds.add(row.id);
        const key=customKey(scene,row.id);if(byId.has(key)||customFields.some(field=>field.key===key))throw Error('场景供应商列与现有导入列身份冲突。');
        const field={id:key,key,businessKey:key,mappingId:row.id,sceneId:String(scene.id??scene.sceneId??'DRAFT'),platform:scene.platform,parameter:row.parameter,label:String(row.label||row.parameter).trim(),type:valueType(row.type,!!flags.legacy),required:row.required===true,source:'AI_CUSTOM',usage:'SUPPLIER_PARAMETER',aliases:[row.parameter],...flags};
        if(!field.label)throw Error('请填写供应商导入列名称。');customFields.push(field);mapped.push({id:row.id,source:'CUSTOM_COLUMN',key,parameter:row.parameter,label:field.label,type:field.type,required:field.required,...flags});usedParameters.add(row.parameter);
      }
      for(let index=0;index<rows.length;index++){
        const row=rows[index];if(!row||!parameter(row.parameter))throw Error('供应商参数名无效或未填写：'+(row?.parameter||row?.label||row?.fieldId||'')+'。');if(usedParameters.has(row.parameter))throw Error('供应商参数名重复：'+row.parameter+'。');if(row.required!==undefined&&typeof row.required!=='boolean')throw Error('场景参数必需标记格式无效。');
        const source=version===2?row.source:'IMPORT_FIELD',id=version===2?row.id:row.id||'legacy-import-'+index+'-'+row.parameter;
        if(source==='CUSTOM_COLUMN')addCustom({...row,id});
        else if(source==='IMPORT_FIELD'){
          if(!identity(id)||usedIds.has(id))throw Error('场景字段映射身份缺失或重复。');
          if(typeof row.fieldId!=='string'||!byId.has(row.fieldId))throw Error('场景引用的导入字段已停用、移除或不属于当前分类，请调整映射。');const field=byId.get(row.fieldId),type=typeForImportField(field);
          if(version===2&&row.type!==undefined&&row.type!==type)throw Error('引用业务字段的类型随字段定义读取，不能在供应商映射中更改。');usedIds.add(id);usedParameters.add(row.parameter);mapped.push({id,source,fieldId:row.fieldId,parameter:row.parameter,label:field.label,type,required:row.required===true,...(version===1?{legacySchema:true}:{})});
        }else throw Error('请选择引用业务导入字段或供应商自定义导入列。');
      }
      const fixed=input.fixedFields||fixedFields(scene),core={name:'name',customerName:'name',calleeNo:'phone',remark:'note'};
      for(const target of fixed){
        if(!parameter(target.parameter))throw Error('供应商固定参数定义无效。');let ref=mapped.find(row=>row.parameter===target.parameter);
        if(!ref&&core[target.parameter]){const field=allowed.find(row=>row.key===core[target.parameter]||row.businessKey===core[target.parameter]);if(field){const id='system-'+target.parameter;if(usedIds.has(id))throw Error('场景字段身份与系统协议来源冲突，请重新配置该映射。');usedIds.add(id);ref={id,source:'IMPORT_FIELD',fieldId:field.fieldId||field.id||field.key,parameter:target.parameter,label:field.label,type:typeForImportField(field),required:!!target.required,system:true};mapped.push(ref);usedParameters.add(target.parameter);}}
        if(!ref){const id=(target.legacy?'legacy-custom-':'fixed-')+target.parameter;addCustom({id,parameter:target.parameter,label:target.label||target.parameter,type:target.type||'text',required:!!target.required},{system:!target.legacy,fixed:!target.legacy,...(target.legacy?{legacy:true}:{})});ref=mapped.find(row=>row.parameter===target.parameter);}
        if(target.required){ref.required=true;if(ref.source==='CUSTOM_COLUMN')customFields.find(field=>field.key===ref.key).required=true;}
        if(target.type&&version===2&&ref.type!==valueType(target.type,true))throw Error('供应商固定参数“'+target.parameter+'”类型与当前来源不兼容。');
      }
      const normalizedCustom=Object.create(null),parameters=Object.create(null),rowMode=values!==undefined||customValues!==undefined;
      if(customValues!==undefined&&(!customValues||typeof customValues!=='object'||Array.isArray(customValues)))throw Error('供应商自定义列值须使用当前场景独立字段对象。');
      const allowedCustomKeys=new Set(customFields.map(field=>field.key));for(const key of Object.keys(customValues||{}))if(!allowedCustomKeys.has(key))throw Error('存在不属于当前场景或供应商的自定义导入列，请重新检查映射。');
      if(rowMode){
        if(scene.id===undefined&&scene.sceneId===undefined)throw Error('请先保存准确场景后再导入供应商列。');
        for(const ref of mapped){
          if(ref.source==='CUSTOM_COLUMN'){
            const field=customFields.find(item=>item.key===ref.key),provided=Object.hasOwn(customValues||{},field.key),raw=provided?customValues[field.key]:undefined;
            if(ref.required&&empty(raw))throw Error('供应商参数“'+ref.parameter+'”需要填写'+field.label+'。');if(!provided)continue;
            if(empty(raw)){normalizedCustom[field.key]=clone(raw);continue;}const value=normalizeCustom(field,raw);normalizedCustom[field.key]=value;parameters[ref.parameter]=clone(value);continue;
          }
          const field=byId.get(ref.fieldId),keys=[field.key,field.fieldId,field.id,field.businessKey].filter(Boolean),provided=keys.filter(key=>Object.hasOwn(values||{},key)),raw=provided.length?values[provided[0]]:undefined;
          if(provided.some(key=>JSON.stringify(values[key])!==JSON.stringify(raw)))throw Error('同一导入字段存在不同值：'+field.label);if(ref.required&&empty(raw))throw Error('供应商参数“'+ref.parameter+'”需要填写'+field.label+'。');if(empty(raw))continue;
          const encode=value=>{if(!['select','multiselect','enum'].includes(field.type))return clone(value);const found=(field.options||[]).filter(option=>option.enabled!==false&&(option.id===value||option.businessKey===value||option.label===value));if(found.length!==1)throw Error(field.label+'包含未知或歧义选项。');return found[0].businessKey||found[0].label;};parameters[ref.parameter]=Array.isArray(raw)?raw.map(encode):encode(raw);
        }
      }
      const fingerprint=JSON.stringify({schema:version,categoryId,sceneId:String(scene.id??scene.sceneId??'DRAFT'),platform:scene.platform,importFieldPlatform:scene.importFieldPlatform??scene.platform,fixed,mappings:rows,customFields,fields:allowed.map(field=>({id:field.fieldId||field.id||field.key,key:field.key,businessKey:field.businessKey,type:field.type,required:(field.businessRequired??field.required)===true,options:field.options}))});
      // The field directory remains complete for reference validation. The
      // import form contains only immutable customer identity and actual
      // sources selected by this scene (including protocol defaults).
      const referenced=new Set(mapped.filter(row=>row.source==='IMPORT_FIELD').map(row=>row.fieldId));
      const businessFields=allowed.filter(field=>['code','name','phone'].includes(field.key)||referenced.has(field.fieldId||field.id||field.key)).map(field=>({...clone(field),required:['code','name','phone'].includes(field.key)||field.required===true||mapped.some(row=>row.source==='IMPORT_FIELD'&&row.fieldId===(field.fieldId||field.id||field.key)&&row.required)}));
      return {ok:true,parameters:clone(parameters),mappings:clone(mapped),fixedFields:clone(fixed),businessFields,customFields:clone(customFields),customValues:clone(normalizedCustom),fingerprint};
    }catch(error){return {ok:false,message:error.message||'场景导入字段映射待核。'};}
  }
  root.DAIImportFieldMapping={review,fixedFields,customKey,typeForImportField};
})(window);
