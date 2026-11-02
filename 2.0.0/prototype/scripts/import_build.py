"""Bounded source transforms for Excel/template/required-state import fixes."""
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]

def one(code,old,new):
    if code.count(old)!=1:raise ValueError('Import integration anchor changed: '+old[:100])
    return code.replace(old,new,1)

def function(code,name,next_name,replacement):
    start=code.index('  '+('async ' if '  async function '+name+'(' in code else '')+'function '+name+'(')
    end=code.index('  '+('async ' if '  async function '+next_name+'(' in code else '')+'function '+next_name+'(',start+1)
    return code[:start]+replacement+'\n'+code[end:]

def transform(kind,path,code):
    if kind!='cloud':return code
    if path=='js/components/dcc-records.js':
        code=function(code,'manualSchema','rememberManualDraft','  function manualSchema(){return dRenderManualSchema();}')
        code=function(code,'readManualFile','parseManualCsv','  async function readManualFile(file){return dReadManualFile(file);}')
        code=function(code,'previewManualCsv','updateManualRow','  function previewManualCsv(){return dPreviewManualCsv();}')
        code=one(code,"draft.previewMeta?.codeLabel===meta.codeLabel;","draft.previewMeta?.codeLabel===meta.codeLabel&&draft.previewMeta?.schemaFingerprint===dSchemaFingerprint();")
        code=one(code,"    const form=manualForm(),meta=manualBusiness(form.businessType,draft),good=[],errors=[];","    const form=manualForm(),meta=manualBusiness(form.businessType,draft),good=[],errors=[],schemaChecks=dManualChecks(rows);")
        code=one(code,"      let reason=row._inputError||'';","      let reason=(schemaChecks[index]?.errors||[]).join('；')||row._inputError||'';")
        code=one(code,"    const current=manualPreviewCurrent(),validation=validateManualRows(manualDraft.rows),submit=", "    dRefreshManualReadiness();\n    const current=manualPreviewCurrent(),validation=validateManualRows(manualDraft.rows),submit=")
        # Add warnings after the native preview table without changing submit semantics.
        start=code.index('  function drawManualRows()');end=code.index('  function manualInput(',start)
        chunk=code[start:end];closing=chunk.rfind('\n  }')
        chunk=chunk[:closing]+"\n    node.innerHTML+='<div id=\"dccManualWarnings\" role=\"status\"></div>';dManualWarnings();"+chunk[closing:]
        code=code[:start]+chunk+code[end:]
        code=one(code,"    manualDraft.form=manualForm();manualDraft.revision++;manualDraft.rows=[];manualDraft.previewSource=null;manualDraft.previewMeta=null;clearManualFeedback();drawManualRows();return true;", "    manualDraft.form=manualForm();manualDraft.revision++;manualDraft.rows=[];manualDraft.previewSource=null;manualDraft.previewMeta=null;clearManualFeedback();drawManualRows();dRefreshManualReadiness();return true;")
        code=one(code,"id=\"dccManualBatchName\" maxlength=\"50\"", "id=\"dccManualBatchName\" aria-required=\"true\" aria-describedby=\"dccManualBatchNameHint\" maxlength=\"50\"")
        code=one(code,"oninput=\"DccRecords.invalidateManualPreview()\"></label></div>", "oninput=\"DccRecords.invalidateManualPreview()\"><small id=\"dccManualBatchNameHint\">必填，1—50字；用于识别本次导入。</small></label></div>")
        code=one(code,'选择 CSV 文件','选择Excel / CSV文件')
        code=one(code,'accept=".csv,text/csv"','accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"')
        code=one(code,'未选择文件 · UTF-8 格式，最大 1 MB','支持.xlsx、UTF-8 CSV，最大1 MB；.xls请另存为.xlsx或CSV。Excel使用“导入名单”或唯一名单工作表，公式请先转为值。')
        code=one(code,'onclick="DccRecords.loadManualSample()">填入示例</button>', 'onclick="DccRecords.loadManualSample()">填入示例</button><button class="btn" type="button" onclick="DccRecords.downloadImportTemplate(\'xlsx\')">下载Excel模板</button><button class="btn" type="button" onclick="DccRecords.downloadImportTemplate(\'csv\')">下载CSV模板</button>')
        code=one(code,'<div id="dccManualSchema">${manualSchema()}</div>', '<p id="dccManualTemplateStatus" role="status"></p><div id="dccManualSchema">${manualSchema()}</div>')
        code=one(code,'oninput="DccRecords.invalidateManualPreview()" placeholder="${esc(manualFields()', 'oninput="DccRecords.editManualText()" placeholder="${esc(manualFields()')
        code=one(code,'<div class="layer-footer"><button class="btn" type="button" onclick="DccRecords.closeManual()">取消', '<div class="layer-footer"><span id="dccManualReadiness" role="status" aria-live="polite" style="margin-right:auto;color:#b54708;max-width:60%"></span><button class="btn" type="button" onclick="DccRecords.closeManual()">取消')
        code=one(code,'id="dccManualCheck" onclick=', 'id="dccManualCheck" aria-describedby="dccManualReadiness" onclick=')
        code=one(code,"    manualDraft.fileName='';const label=", "    manualDraft.fileName='';manualDraft.importFileError='';const label=")
        start=code.index('  function setManualBusy(');end=code.index('  function manualRowsStillMatch(',start);chunk=code[start:end];at=chunk.rfind('\n  }');chunk=chunk[:at]+'\n    dRefreshManualReadiness();'+chunk[at:];code=code[:start]+chunk+code[end:]
        code=one(code,'  window.DccRecords={', (ROOT/'js/adapters/dcc-import-enhancements.js').read_text()+"\n  window.DccRecords={downloadImportTemplate:dDownloadManualTemplate,editManualText:dEditManualText,manualImportSchema:dManualSchema,manualImportReadiness:dManualReadiness,")
    if path=='js/pages/customer-tasks.js':
        code=customer_transform(code)
    return code

def customer_transform(code):
    helper=(ROOT/'js/adapters/customer-import-enhancements.js').read_text()
    code=function(code,'readFile','prepare','  async function readFile(file){return dCustomerReadFile(file,false);}')
    code=function(code,'readTemplateFile','prepareTemplateImport','  async function readTemplateFile(file){return dCustomerReadFile(file,true);}')
    code=code.replace('选择 CSV 文件','选择Excel / CSV文件').replace('accept=".csv,text/csv"','accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"').replace('未选择文件 · UTF-8 格式，最大 1 MB','支持.xlsx、UTF-8 CSV，最大1 MB；.xls请另存为.xlsx或CSV')
    # Both native customer editors use the same I/O and schema helper, while their native validators/committers remain.
    for fill in ['fillSample','fillTemplateSample']:
        old='onclick="CustomerTasks.'+fill+'()">填入示例</button>'
        new=old+'<button class="btn" type="button" onclick="CustomerTasks.downloadImportTemplate(&quot;xlsx&quot;)">下载Excel模板</button><button class="btn" type="button" onclick="CustomerTasks.downloadImportTemplate(&quot;csv&quot;)">下载CSV模板</button>'
        code=one(code,old,new)
    code=code.replace('id="customer-batch-name" maxlength="50"','id="customer-batch-name" aria-required="true" maxlength="50"')
    code=code.replace('onclick="CustomerTasks.previewImport()">检查名单','id="customer-import-check" aria-describedby="customer-import-readiness" onclick="CustomerTasks.previewImport()">检查名单').replace('onclick="CustomerTasks.previewTemplateImport()">检查名单','id="customer-import-check" aria-describedby="customer-import-readiness" onclick="CustomerTasks.previewTemplateImport()">检查名单')
    start=code.index('  function importDialog(');end=code.index('  const importedFields',start);chunk=code[start:end];chunk=one(chunk,'<div class="layer-footer">','<div class="layer-footer"><span id="customer-import-readiness" role="status" aria-live="polite" style="margin-right:auto;color:#b54708;max-width:60%"></span>');at=chunk.rfind('\n  }');chunk=chunk[:at]+'\n    dCustomerOpened();'+chunk[at:];code=code[:start]+chunk+code[end:]
    start=code.index('  function openUnifiedImport(');end=code.index('  function importCategoryMeta(',start);chunk=code[start:end];chunk=one(chunk,'<div class="layer-footer">','<div class="layer-footer"><span id="customer-import-readiness" role="status" aria-live="polite" style="margin-right:auto;color:#b54708;max-width:60%"></span>');code=code[:start]+chunk+code[end:]
    code=one(code,'    templateTypeChanged();\n  }','    templateTypeChanged();dCustomerOpened();\n  }')
    code=one(code,"invalidatePreview();showToast('已填入 '+sample.rows.length+' 位示例客户','success');", "invalidatePreview();dCustomerFileError='';dCustomerReadiness();showToast('已填入 '+sample.rows.length+' 位示例客户','success');")
    start=code.index('  function fillTemplateSample(');end=code.index('  async function readTemplateFile(',start);chunk=code[start:end];at=chunk.rfind('}');chunk=chunk[:at]+"dCustomerFileError='';dCustomerReadiness();"+chunk[at:];code=code[:start]+chunk+code[end:]
    code=one(code,'  window.CustomerTasks={',helper+'\n  window.CustomerTasks={downloadImportTemplate:dCustomerDownloadTemplate,importFileSchema:dCustomerSchema,')
    return code
