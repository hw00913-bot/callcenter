"""Reuse offline CSV/OOXML I/O for AI imports, preserving provider row limits.

Load the existing JSZip/SAX/import-workbook scripts in both native modules.
Pass import-workbook.js through io_source() before bundling; default Cloud limits
remain unchanged. Apply transform() after the existing scene-list transforms.
"""

def one(code, old, new):
    if code.count(old) != 1:
        raise ValueError('AI offline import anchor changed: ' + old[:110])
    return code.replace(old, new, 1)


def io_source(code):
    code = one(code, '  const MAX_BYTES=1048576,MAX_ROWS=2000,MAX_COLS=100;', '''  const MAX_BYTES=1048576,MAX_ROWS=2000,MAX_COLS=100;
  function readLimits(options={}){
    const maxRows=options.maxRows??MAX_ROWS,maxBytes=options.maxBytes??MAX_BYTES;
    if(!Number.isSafeInteger(maxRows)||maxRows<1||maxRows>150000||!Number.isSafeInteger(maxBytes)||maxBytes<1||maxBytes>16777216)throw Error('文件解析范围无效');
    return {maxRows,maxBytes,xmlChars:maxRows>MAX_ROWS?48000000:12000000,xmlNodes:maxRows>MAX_ROWS?2000000:150000,zipBytes:maxRows>MAX_ROWS?64000000:24000000};
  }''')
    code = one(code, '  function xml(input){', '  function xml(input,limits=readLimits()){')
    code = one(code, 'if(input.length>12000000)', 'if(input.length>limits.xmlChars)')
    code = one(code, 'if(++nodes>150000)', 'if(++nodes>limits.xmlNodes)')
    code = one(code, '  function zipBudget(bytes){', '  function zipBudget(bytes,limits=readLimits()){')
    code = one(code, 'if(total>24000000)', 'if(total>limits.zipBytes)')
    code = one(code, '  async function readXlsx(bytes){', '  async function readXlsx(bytes,options={}){\n    const limits=readLimits(options);')
    code = one(code, "throw Error('本地Excel解析组件未就绪');zipBudget(bytes);", "throw Error('本地Excel解析组件未就绪');zipBudget(bytes,limits);")
    code = one(code, "return xml(await f.async('string'));", "return xml(await f.async('string'),limits);")
    code = one(code, "if(pos.r>MAX_ROWS||pos.c>=MAX_COLS)throw Error('Excel最多2000条数据、100列，请删除多余数据后重试');", "if(pos.r>limits.maxRows||pos.c>=MAX_COLS)throw Error('Excel最多'+limits.maxRows+'条数据、100列，请删除多余数据后重试');")
    code = one(code, '  async function readFile(file){', '  async function readFile(file,options={}){\n    const limits=readLimits(options),sizeMessage=\'文件不能超过\'+(limits.maxBytes/1048576)+\' MB\';')
    code = one(code, "if(!file||!Number.isFinite(file.size)||file.size>MAX_BYTES)throw Error('文件不能超过1 MB');", "if(!file||!Number.isFinite(file.size)||file.size<0||file.size>limits.maxBytes)throw Error(sizeMessage);")
    code = one(code, "if(bytes.length>MAX_BYTES)throw Error('文件不能超过1 MB');", "if(bytes.length>limits.maxBytes)throw Error(sizeMessage);")
    code = one(code, 'else rows=await readXlsx(bytes);', 'else rows=await readXlsx(bytes,options);')
    code = one(code, "if(rows.length>MAX_ROWS+1)throw Error('每次导入最多2000条客户');", "if(rows.length>limits.maxRows+1)throw Error('每次导入最多'+limits.maxRows+'条客户');")
    code = one(code, "  function inspect(table,schema,{duplicatePhone='warn',codeKey='leadCode'}={}){", "  function inspect(table,schema,{duplicatePhone='warn',codeKey='leadCode',maxRows=MAX_ROWS}={}){\n    const inspectionLimit=readLimits({maxRows}).maxRows;")
    code = one(code, "if(!entries.length||entries.length>MAX_ROWS)throw Error('请填写1至2000条客户，空模板不能提交');", "if(!entries.length||entries.length>inspectionLimit)throw Error('请填写1至'+inspectionLimit+'条客户，空模板不能提交');")
    return code


PARSER = r'''  function dAIUploadReset() {
    dAIUploadSequence++;dAIUploadPending=null;
    var button=document.getElementById('btnStartUpload'),unresolved=window.DAIConfigStore?.guard().isDirty();
    if(button){button.disabled=!!unresolved;button.textContent=unresolved?'请先核对保存结果':'开始上传';}
  }
  function dAIUploadScope() {
    var c=parent.DSession.context(),owner=DNativeContext.context;
    if(!c||c.scope.kind!=='tenant'||c.account.id!==owner.account.id||c.scope.id!==owner.scope.id||parent.DApp.currentPage()!=='PAGE-2103'||!parent.DSession.allowed('PAGE-2103')||!parent.DSession.canWrite('PAGE-2103')||!currentDetailItem)throw Error('当前任务或导入权限已变化，请重新打开。');
    var proof=window.DAIConfigStore.reviewCurrent();if(!proof.ok)throw Error(proof.reason||'当前导入保存结果待核，请先核对原请求。');
    return {accountId:c.account.id,tenantId:c.scope.id,taskId:String(currentDetailItem.id),platform:currentDetailItem.platform,revision:proof.revision};
  }
  function dAIUploadCurrent(token) {
    if(dAIUploadPending!==token||token.sequence!==dAIUploadSequence||pendingUploadFile!==token.file||document.getElementById('importModalBackdrop')!==token.modal||!token.modal.isConnected)return false;
    var scope=dAIUploadScope();if(!['accountId','tenantId','taskId','platform','revision'].every(function(k){return scope[k]===token[k];}))throw Error('读取期间任务、账号或配置版本已变化，未提交；请重新核对。');return true;
  }
  function parseCSVText(text) {
    var table=DImportFiles.parseCsv(text);return {headers:table[0]||[],rows:table.slice(1).filter(function(row){return row.some(function(value){return String(value).trim();});})};
  }
  async function processUploadFile(file, callback) {
    var token;
    try {
      if(dAIUploadPending)throw Error('正在读取本次文件，请等待或关闭本次导入。');
      var modal=document.getElementById('importModalBackdrop');if(!modal||!modal.isConnected||pendingUploadFile!==file)throw Error('本次导入窗口或文件已变化，请重新选择文件。');
      token=Object.assign({sequence:++dAIUploadSequence,file:file,modal:modal},dAIUploadScope());dAIUploadPending=token;
      var ext=String(file.name||'').toLowerCase().split('.').pop();
      if(ext==='xls')throw Error('不支持旧版.xls，请另存为.xlsx或UTF-8 CSV后重新选择。');
      if(!['csv','txt','xlsx'].includes(ext))throw Error('请选择.xlsx、UTF-8 CSV，或使用CSV格式的UTF-8 TXT。');
      var readable=ext==='txt'?{name:String(file.name).replace(/\.txt$/i,'.csv'),size:file.size,arrayBuffer:function(){return file.arrayBuffer();}}:file;
      // AI keeps its original provider limits; the Cloud callers retain the
      // shared reader's default 2,000-row/1-MB limits.
      var parsed=await DImportFiles.readFile(readable,{maxRows:150000,maxBytes:16777216});
      if(!dAIUploadCurrent(token))return false;
      var headers=parsed.rows[0]||[],rows=parsed.rows.slice(1).filter(function(row){return row.some(function(value){return String(value).trim();});});
      if(!headers.length||!String(headers[0]||'').trim()||validatePhone(String(headers[0]).trim()))throw Error('首行须为表头，首列为手机号；请使用原导入模板。');
      if(!rows.length)throw Error('文件只有表头或空白行，请填写名单后再上传。');
      var limit=token.platform==='大众通信'?100:token.platform==='厚朴'?150000:2000;
      if(rows.length>limit)throw Error(token.platform+'单次最多导入 '+limit.toLocaleString()+' 条号码，当前 '+rows.length.toLocaleString()+' 条，请拆分后重新上传。');
      var results={success:[],fail:[],total:rows.length};
      rows.forEach(function(cols){var phone=String(cols[0]||'').trim();if(cols.length>headers.length)results.fail.push({phone:phone,reason:'列数超出本次表头，请核对CSV引号或动态属性列'});else if(validatePhone(phone))results.success.push(phone);else results.fail.push({phone:phone,reason:phone?'手机号格式有误':'手机号为空'});});
      if(!dAIUploadCurrent(token))return false;
      await callback(results,token);return true;
    } catch(error) {
      // A closed/replaced dialog owns neither this result nor its error UI.
      if(!token||dAIUploadPending===token&&token.modal.isConnected&&document.getElementById('importModalBackdrop')===token.modal){var message=error.message||'文件读取或处理结果待核，请保留当前文件。',preview=document.getElementById('uploadPreview');if(preview){preview.style.display='block';preview.textContent=message+' 当前文件已保留，请按提示核对。';}showToast(message,'warning');}
      return false;
    } finally {
      if(token&&dAIUploadPending===token){dAIUploadPending=null;var button=document.getElementById('btnStartUpload'),unresolved=window.DAIConfigStore?.guard().isDirty();if(button&&token.modal.isConnected){button.disabled=!!unresolved;button.textContent=unresolved?'请先核对保存结果':'开始上传';}}
    }
  }

'''


def transform(kind, path, code):
    if kind != 'ai' or path != 'js/pages/scene-list.js':
        return code
    code = one(code, '  var pendingUploadFile = null;', '  var pendingUploadFile = null, dAIUploadSequence=0, dAIUploadPending=null;')
    start=code.index('  function parseCSVText(text) {')
    end=code.index('  function applyImportResults(sceneId, results, fileName) {',start)
    code=code[:start]+PARSER+code[end:]
    code=one(code, "    if (document.getElementById('importModalBackdrop')) return;\n    pendingUploadFile = null;", "    if (document.getElementById('importModalBackdrop')) return;\n    dAIUploadReset();pendingUploadFile = null;")
    code=one(code, "  function closeImportModal(e) {\n    if (e && e.target !== e.currentTarget) return;", "  function closeImportModal(e) {\n    if (e && e.target !== e.currentTarget) return;\n    dAIUploadReset();")
    code=one(code, '      pendingUploadFile = input.files[0];', '      dAIUploadReset();pendingUploadFile = input.files[0];')
    code=one(code, '      pendingUploadFile = files[0];', '      dAIUploadReset();pendingUploadFile = files[0];')
    code=one(code, '  function doStartUpload() {', "  function doStartUpload() {\n    if(dAIUploadPending){showToast('正在读取本次文件，请勿重复提交','warning');return false;}\n    try{dAIUploadScope();}catch(error){showToast(error.message,'warning');return false;}")
    code=one(code, '    processUploadFile(pendingUploadFile, function (results) {', '    return processUploadFile(pendingUploadFile, async function (results, token) {')
    code=one(code, 'accept=".csv,.txt,.xls,.xlsx"', 'accept=".csv,.txt,.xlsx"')
    code=one(code, '支持文件：csv 、 txt 、 xls 、 xlsx 文件，', '支持.xlsx、UTF-8 CSV及CSV格式TXT（最大16 MB）；.xls请另存.xlsx，')
    code=one(code, '<br>您可以选择重新上传，但重新上传会覆盖原有上传的号码', '<br>新上传追加到本任务；原导入历史与名单保留。Excel使用“导入名单”或唯一名单工作表，公式须先转为值。')
    return code
