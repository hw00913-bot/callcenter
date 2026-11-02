  let dImportMapping=null;
  function dMappingStamp(columns){return JSON.stringify(columns.map(c=>[c.key,c.businessKey,c.label,c.type,c.required,c.options]));}
  function dConfigureImportMapping(){
    if(!templateImport)return showToast('请从按分类导入入口配置列映射','warning');
    try{
      const raw=DImportFiles.parseCsv(document.getElementById('customer-import-text')?.value||''),columns=templateImportColumns();
      if(!raw.length||!columns.length)throw Error('请先选择业务分类并载入带表头的名单');
      const header=raw[0].map(x=>String(x).trim()),stamp=dMappingStamp(columns),headerStamp=JSON.stringify(header);
      if(!dImportMapping||dImportMapping.headerStamp!==headerStamp||dImportMapping.stamp!==stamp)dImportMapping={headerStamp,stamp,keys:header.map(x=>DImportFiles.headerKey(x,columns))};
      const host=document.getElementById('customer-field-mapping');
      if(host)host.innerHTML='<p class="table-sub">每列选择对应业务字段，业务编码自动带出；同一目标只能对应一列。</p><table class="customer-import-guide"><thead><tr><th>导入列</th><th>对应业务字段</th><th>业务编码</th></tr></thead><tbody>'+header.map((label,index)=>{
        const key=dImportMapping.keys[index],selected=columns.find(c=>c.key===key);
        return '<tr><td>'+esc(label||'未命名列')+'</td><td><select aria-label="第'+(index+1)+'列映射" onchange="CustomerTasks.changeImportMapping('+index+',this.value)"><option value="">请选择字段</option>'+columns.map(c=>'<option value="'+esc(c.key)+'"'+(key===c.key?' selected':'')+'>'+esc(c.label)+(c.fieldId?'〔导入〕':'〔系统〕')+'</option>').join('')+'</select></td><td>'+(selected?esc(selected.businessKey||selected.key):'待选择')+'</td></tr>';
      }).join('')+'</tbody></table>';
    }catch(error){showToast(error.message,'warning');}
  }
  function dChangeImportMapping(index,key){if(!dImportMapping||templateImportBusy||templateImportMeta?.unknown)return;dImportMapping.keys[index]=key;invalidateTemplatePreview();dConfigureImportMapping();}
  function dMappedImportRows(text,columns){
    let table=DImportFiles.parseCsv(text);if(!table.length)throw Error('名单为空');
    const header=table[0].map(x=>String(x).trim()),stamp=dMappingStamp(columns),manual=dImportMapping&&dImportMapping.headerStamp===JSON.stringify(header)&&dImportMapping.stamp===stamp;
    if(manual){
      if(dImportMapping.keys.some(key=>!key))throw Error('请为每个导入列选择对应业务字段');
      if(new Set(dImportMapping.keys).size!==dImportMapping.keys.length)throw Error('同一业务字段不能同时映射多个导入列');
      table=[dImportMapping.keys,...table.slice(1)];
    }else if(!header.some(value=>DImportFiles.headerKey(value,columns))&&!columns.some(c=>c.fieldId)){
      // Retain the original headerless input convention for existing categories.
      table=[columns.map(c=>c.key),...table];
    }
    return DImportFiles.inspect(table,columns,{duplicatePhone:'warn',codeKey:'code'});
  }
  function dImportSampleValue(column,row){
    const value=row[column.key]??row[column.businessKey];if(value!==undefined)return value;
    if(column.options?.length){const option=column.options.find(o=>o.enabled!==false);return option?.label||option?.id||'';}
    if(column.type==='number')return '1';if(column.type==='date')return '2026-10-29';if(column.type==='datetime')return '2026-10-29T09:00:00+08:00';
    return column.required?'示例'+column.label:'';
  }
