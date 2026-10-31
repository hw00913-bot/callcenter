/* Inserted into the existing DccRecords scope. The native submit/permission guards stay authoritative. */
  function dManualSchema(){
    const meta=manualBusiness(manualType());if(!meta)return [];
    const aliases={name:['客户姓名','姓名','称呼'],phone:['手机号','手机号码','号码','tel'],leadCode:['leadCode'],externalDocumentId:['业务编码','外部单据标识','businessCode'],priority:['最终优先级'],note:['备注'],R:['r']};
    const limits={name:40,leadCode:100,externalDocumentId:100,note:500};
    return manualFields().map(key=>{const field=importedManualFields().find(f=>f.key===key);return {key,label:manualLabel(key),required:!optionalManualField(key),type:field?.type||(key==='phone'?'phone':key==='priority'?'number':key==='leadCreatedAt'?'datetime':'text'),maxLength:limits[key],options:field?.options,aliases:aliases[key]||[]};});
  }
  function dSchemaFingerprint(){const meta=manualBusiness(manualType());return JSON.stringify([meta?.id,meta?.configurationVersion||meta?.version||1,dManualSchema()]);}
  function dRenderManualSchema(){const schema=dManualSchema();return schema.length?'<table class="customer-import-guide"><thead><tr>'+schema.map(c=>'<th>'+esc(c.label)+(c.required?' <em>*</em>':'（选填）')+'</th>').join('')+'</tr></thead><tbody><tr>'+schema.map(c=>'<td>'+esc(DImportFiles.describe(c))+'</td>').join('')+'</tr></tbody></table>':'<p>请先选择业务类型，查看本次导入列和格式要求。</p>';}
  function dManualChecks(rows){
    if(!rows.length)return [];
    const schema=dManualSchema();if(!schema.length)return rows.map(()=>({errors:['请选择已启用的业务类型'],warnings:[]}));
    const table=[schema.map(c=>c.label),...rows.map(r=>Object.assign(schema.map(c=>r[c.key]??''),{_sourceLine:r._line}))];
    const checked=DImportFiles.inspect(table,schema,{duplicatePhone:'warn',codeKey:manualType()==='lead'?'leadCode':'externalDocumentId'}).rows;
    return checked.map((r,i)=>{rows[i]._schemaWarnings=r._schemaWarnings;return {errors:r._schemaErrors,warnings:r._schemaWarnings};});
  }
  function dManualReadiness(){
    if(!manualDraft)return '请先打开本次导入';if(manualDraft.busy)return '正在导入，请等待本次结果';
    if(manualDraft.readingFile)return '正在读取文件，请稍候';if(manualDraft.importFileError)return manualDraft.importFileError;
    const f=manualForm();if(!manualBusiness(f.businessType))return '请先选择业务类型';
    if(!f.importBatchName.trim())return '请填写批次名称后再检查名单';if(f.importBatchName.trim().length>50)return '批次名称不能超过50字';
    if(!f.text.trim())return '请选择.xlsx / CSV文件，或填写名单后再检查';return '';
  }
  function dRefreshManualReadiness(){
    if(!manualDraft)return;const reason=dManualReadiness(),check=document.getElementById('dccManualCheck'),status=document.getElementById('dccManualReadiness'),name=document.getElementById('dccManualBatchName');
    if(check){check.disabled=!!reason;check.title=reason||'检查名单，确认前不会提交';check.setAttribute('aria-describedby','dccManualReadiness');}
    if(status)status.textContent=reason||'可以检查名单；检查通过后再确认导入。';
    if(name){name.setAttribute('aria-required','true');name.setAttribute('aria-invalid',String(!name.value.trim()));}
  }
  function dManualWarnings(){const host=document.getElementById('dccManualWarnings');if(host)host.innerHTML=manualDraft.rows.flatMap(r=>r._schemaWarnings||[]).map(s=>'<p>'+esc(s)+'</p>').join('');}
  function dEditManualText(){if(manualDraft){manualDraft.importFileError='';manualDraft.fileName='';const label=document.getElementById('dccManualFilename');if(label)label.textContent='已编辑名单，请重新检查';}return invalidateManualPreview();}
  async function dReadManualFile(file){
    if(!file||!draftAllowed())return false;const draft=manualDraft,input=document.getElementById('dccManualCsv'),sequence=++draft.fileSequence;
    draft.importFileError='';draft.readingFile=true;invalidateManualPreview();const revision=draft.revision;let applied=false;
    try{const result=await DImportFiles.readFile(file);
      if(manualDraft!==draft||sequence!==draft.fileSequence||revision!==draft.revision||input!==document.getElementById('dccManualCsv')||!manualContextAllowed(draft))return false;
      input.value=result.text;draft.fileName=file.name;const label=document.getElementById('dccManualFilename');if(label)label.textContent=file.name;
      invalidateManualPreview();applied=true;return true;
    }catch(error){if(manualDraft===draft&&sequence===draft.fileSequence){draft.importFileError=error.message;const feedback=document.getElementById('dccManualFeedback');if(feedback)feedback.innerHTML=ui().alert('warning','文件未载入',error.message);const label=document.getElementById('dccManualFilename');if(label)label.textContent='文件未载入：'+file.name;}return false;
    }finally{if(manualDraft===draft&&sequence===draft.fileSequence){draft.readingFile=false;if(!applied&&!draft.importFileError)draft.importFileError='读取期间基础信息已变化，请重新选择文件';drawManualRows();}}
  }
  async function dDownloadManualTemplate(format){
    if(!draftAllowed())return false;const draft=manualDraft,meta=manualBusiness(manualType()),schema=dManualSchema(),stamp=dSchemaFingerprint();
    if(!meta||!schema.length){const feedback=document.getElementById('dccManualFeedback');if(feedback)feedback.innerHTML=ui().alert('warning','模板未生成','请先选择业务类型；下载模板不要求填写批次名称。');return false;}
    try{const file=await DImportFiles.template(schema,meta.label||manualType(),format);if(manualDraft!==draft||!manualContextAllowed(draft)||stamp!==dSchemaFingerprint())throw Error('分类或工作范围已变化，请重新下载模板');
      DImportFiles.save(file);const status=document.getElementById('dccManualTemplateStatus');if(status)status.textContent='已生成 '+file.fileName+'，请在浏览器下载中保存。';return true;
    }catch(error){const status=document.getElementById('dccManualTemplateStatus');if(status)status.textContent=error.message;return false;}
  }
  function dPreviewManualCsv(){
    if(!draftAllowed()||manualDraft.readingFile)return false;const form=manualForm();invalidateManualPreview();
    try{const reason=dManualReadiness();if(reason)throw Error(reason);const schema=dManualSchema(),meta=manualBusiness(form.businessType),value=form.text.replace(/^\uFEFF/,'');
      if(new Blob([value]).size>DImportFiles.MAX_BYTES)throw Error('名单内容不能超过1 MB');
      const table=DImportFiles.parseCsv(value),legacyCode={key:'externalDocumentId',label:'业务编码',type:'text',required:false,maxLength:100,aliases:['外部单据标识','businessCode']};
      const checkSchema=form.businessType==='lead'?schema.concat(legacyCode):schema;
      const parsed=DImportFiles.inspect(table,checkSchema,{duplicatePhone:'warn',codeKey:form.businessType==='lead'?'leadCode':'externalDocumentId'});
      if(form.businessType==='lead')for(const row of parsed.rows)if(String(row.externalDocumentId??'').trim()&&row.externalDocumentId!==row.leadCode)throw Error('第'+row._line+'行：旧业务编码与线索编码不同，请核对后移除旧编码列');
      manualDraft.rows=parsed.rows.map(r=>({...r,phone:String(r.phone??'').replace(/[\s-]/g,''),priority:manualPriorityValue(r.priority)}));
      manualDraft.previewSource=form.text;manualDraft.previewMeta={businessType:form.businessType,importBatchName:form.importBatchName,codeLabel:meta.codeLabel,schemaFingerprint:dSchemaFingerprint()};manualDraft.form=form;drawManualRows();return true;
    }catch(error){const feedback=document.getElementById('dccManualFeedback');if(feedback)feedback.innerHTML=ui().alert('warning','名单未通过检查',error.message);dRefreshManualReadiness();return false;}
  }
