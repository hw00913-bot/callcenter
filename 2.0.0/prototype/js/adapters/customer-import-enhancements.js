/* Reuse the original customer-import validators and committers; share offline file/template I/O. */
  let dCustomerFileSequence=0,dCustomerReading=false,dCustomerFileError='';
  function dCustomerSchema(){
    const type=document.getElementById('customer-import-business-type')?.value;if(!type)return [];
    if(templateImport){if(!importCategoryMeta())return [];return templateImportColumns().map(c=>({...c,type:c.type||'text',aliases:c.key==='name'?['姓名','客户姓名']:c.key==='phone'?['手机号','联系电话']:[]}));}
    const meta=importBusiness(type);if(!meta)return [];
    return [{key:'name',label:'客户称呼',type:'text',required:true,maxLength:40},{key:'phone',label:'客户号码',type:'phone',required:true},{key:'note',label:'联系备注',type:'text',required:false,maxLength:500},{key:'externalDocumentId',label:meta.codeLabel,type:'text',required:true,maxLength:100},...importedFields().map(f=>({...f,type:f.type||(f.key==='leadCreatedAt'?'datetime':'text'),required:false}))];
  }
  function dCustomerReason(){
    if(!canImportCustomers())return '当前身份没有导入权限';if(dCustomerReading)return '正在读取文件，请稍候';if(dCustomerFileError)return dCustomerFileError;
    if(templateImport&&(templateImportBusy||templateImportMeta?.unknown))return '本次导入正在处理或结果待核，请先核对原请求';
    if(!dCustomerSchema().length)return '请先选择业务类型';const name=document.getElementById('customer-batch-name')?.value||'';
    if(!name.trim())return '请填写批次名称后再检查名单';if(name.trim().length>50)return '批次名称不能超过50字';
    if(!document.getElementById('customer-import-text')?.value.trim())return '请选择.xlsx / CSV文件，或填写名单后再检查';return '';
  }
  function dCustomerReadiness(){
    if(!document.getElementById('customer-import'))return;const reason=dCustomerReason(),button=document.getElementById('customer-import-check'),status=document.getElementById('customer-import-readiness'),name=document.getElementById('customer-batch-name');
    if(button){button.disabled=!!reason;button.title=reason||'检查通过后再确认导入';}if(status)status.textContent=reason||'可以检查名单；尚未提交导入。';
    if(name){name.setAttribute('aria-required','true');name.setAttribute('aria-invalid',String(!name.value.trim()));name.setAttribute('aria-describedby','customer-import-readiness');}
  }
  function dCustomerOpened(){dCustomerReading=false;dCustomerFileError='';dCustomerFileSequence++;dCustomerReadiness();}
  async function dCustomerReadFile(file,isTemplate){
    if(!file||!canImportCustomers()||isTemplate&&(templateImportBusy||templateImportMeta?.unknown))return false;
    const input=document.getElementById('customer-import-text'),scope=[ctx().tenantId,ctx().enterpriseId,ctx().accountId].join('|'),owner=isTemplate?templateImportMeta:importTaskContext,sequence=++dCustomerFileSequence;
    dCustomerReading=true;dCustomerFileError='';(isTemplate?invalidateTemplatePreview:invalidatePreview)();const revision=importRevision;dCustomerReadiness();let applied=false;
    try{const result=await DImportFiles.readFile(file);
      if(sequence!==dCustomerFileSequence||scope!==[ctx().tenantId,ctx().enterpriseId,ctx().accountId].join('|')||!canImportCustomers()||revision!==importRevision||input!==document.getElementById('customer-import-text')||owner!==(isTemplate?templateImportMeta:importTaskContext)||isTemplate&&templateImportMeta?.unknown)return false;
      input.value=result.text;const label=document.getElementById('customer-import-filename');if(label)label.textContent=file.name;(isTemplate?invalidateTemplatePreview:invalidatePreview)();applied=true;return true;
    }catch(error){if(sequence===dCustomerFileSequence){dCustomerFileError=error.message;const label=document.getElementById('customer-import-filename');if(label)label.textContent='文件未载入：'+error.message;}return false;
    }finally{if(sequence===dCustomerFileSequence){dCustomerReading=false;if(!applied&&!dCustomerFileError)dCustomerFileError='读取期间基础信息已变化，请重新选择文件';dCustomerReadiness();}}
  }
  async function dCustomerDownloadTemplate(format){
    const schema=dCustomerSchema(),type=document.getElementById('customer-import-business-type')?.value,meta=templateImport?importCategoryMeta():importBusiness(type),status=document.getElementById('customer-import-readiness');
    if(!canImportCustomers()||!schema.length){if(status)status.textContent='请先选择业务类型；下载模板不要求填写批次名称。';return false;}
    const fingerprint=JSON.stringify(schema),scope=[ctx().tenantId,ctx().enterpriseId,ctx().accountId].join('|');
    try{const file=await DImportFiles.template(schema,meta?.name||meta?.label||type,format,'客户导入模板');if(fingerprint!==JSON.stringify(dCustomerSchema())||scope!==[ctx().tenantId,ctx().enterpriseId,ctx().accountId].join('|')||!canImportCustomers())throw Error('分类或工作范围已变化，请重新下载模板');DImportFiles.save(file);if(status)status.textContent='已生成 '+file.fileName+'，请在浏览器下载中保存。';return true;}catch(error){if(status)status.textContent=error.message;return false;}
  }
  document.addEventListener('input',event=>{if(!event.target.closest?.('#customer-import'))return;if(event.target.id==='customer-import-text')dCustomerFileError='';dCustomerReadiness();});
  document.addEventListener('change',event=>{if(event.target.closest?.('#customer-import'))dCustomerReadiness();});
