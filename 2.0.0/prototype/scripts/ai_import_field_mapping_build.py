"""Scene-local supplier fields: modal selection/configuration and atomic parent draft persistence."""
from pathlib import Path
import json
import re
ROOT = Path(__file__).resolve().parents[1]


def one(code, old, new):
    if code.count(old) != 1:
        raise ValueError('AI shared import field anchor changed: ' + old[:120])
    return code.replace(old, new, 1)


def block(code, name):
    start = re.search(r'^  (?:async )?function '+re.escape(name)+r'\(', code, re.M)
    if not start:
        raise ValueError('Missing AI field dialog function: '+name)
    following = re.search(r'^  (?:async )?function [A-Za-z_$][\w$]*\(', code[start.end():], re.M)
    if not following:
        raise ValueError('Missing AI field dialog boundary: '+name)
    return start.start(),start.end()+following.start()


def transform(kind, path, code):
    if kind != 'ai':
        return code
    if path != 'js/pages/sys-scene.js':
        return code
    css = json.dumps(style_source(),ensure_ascii=False)
    helper = '  const dSceneImportFieldDialogCss='+css+';\n'+(ROOT/'scripts/ai-import-field-ui.js').read_text()+'\n'
    code = one(code, '  function renderInputFieldRows() {', helper+'  function renderInputFieldRows() {')
    a,b = block(code,'renderInputFieldRows')
    code = code[:a]+'  function renderInputFieldRows() {return dRenderProtocolInputRows();}\n\n'+code[b:]
    old = '''<div class="biz-add-field-row" id="bizInputAddRow"><a href="#" class="biz-add-link" onclick="event.preventDefault();window.Pages[\\'sys-scene\\'].showFieldModal(\\'场景传入信息\\')">+ 添加字段</a></div>'''
    code = one(code, old, old+'<div id="d-scene-import-field-mappings"></div>')
    # Protocol rows stay independent; only the old user-defined rows move to the compact modal editor.
    original_head = '<th>序号</th><th>字段名称</th><th>参数名</th><th>是否必填</th><th>操作</th>'
    supplier_head = '<th>序号</th><th>字段名称</th><th>参数名</th><th>是否必填</th><th>当前来源</th><th>操作</th>'
    a,b = block(code,'refreshInputTable')
    segment = one(code[a:b],original_head,supplier_head)
    segment = one(segment, "? '<th>字段名称</th><th>参数名</th><th>是否必填</th><th>操作</th>'", "? '<th>字段名称</th><th>参数名</th><th>是否必填</th><th>当前来源</th><th>操作</th>'")
    code = code[:a]+segment+code[b:]
    a = code.index('<table class="biz-inner-table" id="bizInputTable">')
    b = code.index('<tbody id="bizInputFieldTbody">',a)
    code = code[:a]+one(code[a:b],original_head,supplier_head)+code[b:]
    code = one(code, '    if (tbody) tbody.innerHTML = renderInputFieldRows();', '    if (tbody) tbody.innerHTML = renderInputFieldRows();\n    dRenderSceneImportFields();')
    code = one(code, "    onPlatformChange();dSceneStartDraft();\n  }\n\n  function showEditModal", "    onPlatformChange();dStartSceneDataImportSource();dLoadSceneImportFields();dSceneStartDraft();\n  }\n\n  function showEditModal")
    code = one(code, '    dRestoreCommonSceneForm(data);dSceneStartDraft();', '    dRestoreCommonSceneForm(data);dStartSceneDataImportSource(data);dLoadSceneImportFields(data);dSceneStartDraft();')
    code = one(code, "    if (getCurrentPlatform() === '电声') onDianshengSceneTypeChange();", "    if (getCurrentPlatform() === '电声') onDianshengSceneTypeChange();\n    dLoadSceneImportFields();")
    a,b = block(code,'onPlatformChange')
    segment = code[a:b]
    closing = segment.rfind('\n  }')
    if closing < 0:
        raise ValueError('Missing platform switch closure')
    segment = segment[:closing]+'\n    dLoadSceneImportFields();'+segment[closing:]
    code = code[:a]+segment+code[b:]
    code = one(code, '    renderHoupuTemplateFields(task.templateId);', '    renderHoupuTemplateFields(task.templateId);\n    dRenderSceneImportFields();')
    code = one(code, '    dCollectCommonSceneForm(row);', '    dCollectCommonSceneForm(row);\n    dCollectSceneImportFields(row);dCollectSceneDataImportSource(row);')
    code = one(code, "    if (!data.category) return '请选择场景类型';", "    if (!data.category) return '请选择场景类型';\n    var sourceIssue=dValidateSceneDataImportSource(data);if(sourceIssue)return sourceIssue;var importFieldIssue=dValidateSceneImportFields(data);if(importFieldIssue)return importFieldIssue;")
    code = one(code, '  function removeCustomField(kind, index) {', "  function removeCustomField(kind, index) {\n    if(kind!=='extract'){showToast('请在供应商传入字段摘要中按准确配置移除。','info');return false;}")
    code = one(code, '  function showFieldModal(bizType) {', "  function showFieldModal(bizType) {\n    if(bizType==='场景传入信息')return dOpenImportFieldChoice();")
    code = one(code, "function dSceneNested(){return document.getElementById('bizFieldBackdrop')", "function dSceneNested(){return dImportDialogNested()||document.getElementById('bizFieldBackdrop')")
    code = one(code, "if(dSceneNested()){closeFieldModal();closeInputFieldEditModal();closeInputFieldDeleteConfirm();}", "if(dSceneNested()){dCloseSceneImportDialog();closeFieldModal();closeInputFieldEditModal();closeInputFieldDeleteConfirm();}")
    code = one(code, '  function closeAddModal(e) {\n    if (e && e.target !== e.currentTarget) return;', '  function closeAddModal(e) {\n    if (e && e.target !== e.currentTarget) return;\n    dFinishSceneImportFieldDraft();')
    exports = 'changeDataImportSource:dChangeSceneDataImportSource,chooseImportFieldPath:dChooseImportFieldPath,selectImportField:dOpenImportFieldSelection,addCustomImportColumn:dOpenCustomImportColumn,editImportFieldMapping:dEditImportFieldMapping,removeImportFieldMapping:dRemoveImportFieldMapping,configureProtocolImportSource:dConfigureProtocolImportSource,closeImportFieldDialog:dCloseSceneImportDialog,searchImportFields:dSearchImportFields,pickImportField:dPickImportField,changeImportDialogSource:dChangeImportDialogSource,confirmImportFieldSelection:dConfirmImportFieldSelection,confirmImportFieldConfiguration:dConfirmImportFieldConfiguration,changeImportFieldReference:dChangeImportFieldReference,confirmImportFieldDialogAction:dConfirmDialogAction,restoreImportFieldDraft:dRestoreImportFieldDraft,changeImportFieldMapping:dSceneImportMappingChange,removeStaleImportMapping:dRemoveStaleImportMapping,resetImportFieldMappings:dResetSceneImportMappings,reloadImportFields:dLoadSceneImportFields,'
    code = one(code, '    integrationSceneGuard:dSceneGuard,', '    integrationSceneGuard:dSceneGuard,'+exports)
    code = one(code, 'inputs:customInputFields,extracts:customExtractFields', 'importMappings:dImportFieldState.mappings,importMappingCategory:dImportFieldState.categoryId,importMappingPlatform:dImportFieldState.platform,inputs:customInputFields,extracts:customExtractFields')
    handler=r"window.Pages[\'sys-scene\'].changeDataImportSource()"
    for name,values in [('importType',['手动导入','自动传入']),('binglanImportType',['手动导入','接口传入'])]:
        for value in values:
            old='<input type="radio" name="'+name+'" value="'+value+'">'
            new=old[:-1]+' onchange="'+handler+'">'
            code=one(code,old,new)
    code=one(code,'<th>所属平台</th><th>可用租户</th>','<th>所属平台</th><th>数据导入方式</th><th>可用租户</th>')
    cell="        '<td>' + (row.platform || '一知科技') + '</td>' +"
    code=one(code,cell,cell+"\n        '<td>' + escapeHtmlText(dSceneDataImportLabel(row)) + '</td>' +")
    code=one(code,'<td colspan="9" style="text-align:center;padding:28px">暂无符合条件的场景','<td colspan="10" style="text-align:center;padding:28px">暂无符合条件的场景')
    return code



def runtime_source():
    return (ROOT/'js/adapters/ai-import-field-mapping.js').read_text()


def style_source():
    return (ROOT/'scripts/ai-import-field-ui.css').read_text()
