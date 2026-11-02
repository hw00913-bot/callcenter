  function fourImportName(value,code='IMPORT_NAME'){
    requireThat(typeof value==='string',''+code,'批次名称须为1至50字文本');const name=value.trim();requireThat(name.length>0&&name.length<=50,code,'批次名称须为1至50字文本');return name;
  }
  function fourImportBusinessCode(row,label='业务编码'){
    requireThat(row&&typeof row==='object'&&!Array.isArray(row),'IMPORT_FIELDS','每行须使用准确业务字段对象');
    const keys=['code','businessCode'].filter(key=>Object.hasOwn(row,key));requireThat(keys.length>0,'IMPORT_FIELDS',label+'必填');
    requireThat(keys.every(key=>typeof row[key]==='string'),'IMPORT_FIELDS',label+'须为文本，不能转换数值或其他类型');
    const code=row[keys[0]].trim();requireThat(code,'IMPORT_FIELDS',label+'必填');requireThat(keys.every(key=>row[key].trim()===code),'IMPORT_FIELDS','业务编码存在冲突来源');return code;
  }
  function fourRequestRecordIds(kind,recordId,payload,result,state,committed){
    if(kind!=='import')return Array.isArray(payload.recordIds)?clone(payload.recordIds):undefined;
    if(!committed)return undefined;
    const rows=result?.rows,ids=Array.isArray(rows)?rows.map(row=>row.recordId):[];
    requireThat(ids.length>0&&new Set(ids).size===ids.length&&ids.every(id=>typeof id==='string'&&state.records.some(record=>record.recordId===id&&record.batchId===result.batchId&&record.ownerTenantId===result.tenantId)),'IMPORT_REQUEST_SCOPE','导入生成的业务身份无法准确关联原请求');return ids;
  }
