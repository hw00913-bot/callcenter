"""Bind AI import failure exports to their saved local batch receipts.

Apply after the existing scene-list transforms in build-modules.py. This changes
neither assignment identities nor tombstones, and never fabricates old receipts.
"""

def one(code, old, new):
    if code.count(old) != 1:
        raise ValueError('AI import receipt anchor changed: ' + old[:100])
    return code.replace(old, new, 1)


HELPERS = r'''  function dImportFailureContext() {
    var c=parent.DSession.context(),owner=DNativeContext.context;
    if(!c||c.scope.kind!=='tenant'||c.account.id!==owner.account.id||c.scope.id!==owner.scope.id||owner.scope.kind!==c.scope.kind||parent.DApp.currentPage()!=='PAGE-2103'||!parent.DSession.allowed('PAGE-2103')||!parent.DSession.canWrite('PAGE-2103')||!currentDetailItem)throw Error('当前没有本任务失败明细导出权限，请重新打开任务。');
    return {context:c,taskId:String(currentDetailItem.id)};
  }
  function dImportFailureReceipt(results,sceneId,fileName) {
    var checked=dImportFailureContext(),c=checked.context;
    if(checked.taskId!==String(sceneId)||!Array.isArray(results.success)||!Array.isArray(results.fail)||!Number.isSafeInteger(results.total)||results.total<0||results.total!==results.success.length+results.fail.length||results.fail.some(function(r){return !r||typeof r.phone!=='string'||typeof r.reason!=='string'||!r.reason.trim();}))throw Error('本次导入失败明细尚未完整核定，未保存新批次。');
    return {id:'AIIMPORT-'+crypto.randomUUID(),snapshot:{schema:1,tenantId:c.scope.id,taskId:checked.taskId,actorId:c.account.id,batchId:'',fileName:String(fileName||''),total:results.total,success:results.success.length,fail:results.fail.length,source:'local-import-validation',rows:results.fail.map(function(r){return {phone:r.phone,reason:r.reason};})}};
  }
  function dImportFailureAction(row) {
    var handler="window.Pages['scene-list'].exportImportResult("+JSON.stringify(row.importHistoryId||'')+")";
    return '<td><button type="button" class="card-action-link" onclick="'+escapeHtml(handler)+'">导出失败记录</button></td>';
  }
  function dImportFailureReview(historyId) {
    var checked=dImportFailureContext(),proof=window.DAIConfigStore.reviewCurrent();
    if(!proof.ok)throw Error(proof.reason||'当前导入资料有未核结果，请先核对。');
    if(typeof historyId!=='string'||!/^AIIMPORT-[0-9a-f-]{36}$/i.test(historyId))throw Error('此历史批次未保存可核对的失败明细，不能生成失败文件。');
    var matches=(window.MockImportHistory||[]).filter(function(r){return r.importHistoryId===historyId;});
    if(matches.length!==1)throw Error('导入批次无法唯一定位，未生成文件。');
    var row=matches[0],s=row.failureSnapshot;
    if(String(row.sceneId)!==checked.taskId||!s||s.schema!==1||s.tenantId!==checked.context.scope.id||s.taskId!==checked.taskId||s.batchId!==row.batchId||!s.batchId||s.fileName!==row.name||s.source!=='local-import-validation'||typeof s.actorId!=='string'||!s.actorId||!Array.isArray(s.rows)||!['total','success','fail'].every(function(k){return Number.isSafeInteger(s[k])&&s[k]>=0&&s[k]===row[k];})||s.total!==s.success+s.fail||s.fail!==s.rows.length||s.rows.some(function(r){return !r||typeof r.phone!=='string'||typeof r.reason!=='string'||!r.reason.trim();}))throw Error('本批次失败明细的范围或内容待核，未生成文件。');
    return {row:row,revision:proof.revision,accountId:checked.context.account.id,tenantId:checked.context.scope.id,taskId:checked.taskId,fingerprint:JSON.stringify(row)};
  }
  function dImportFailureCell(value) {
    var text=String(value==null?'':value);
    if(/^[\u0000-\u0020]*[=+\-@]/.test(text)||/^[\t\r\n]/.test(text))text="'"+text;
    return '"'+text.replace(/"/g,'""')+'"';
  }
  function exportImportResult(historyId) {
    var url='';
    try {
      var proof=dImportFailureReview(historyId),snapshot=proof.row.failureSnapshot;
      if(!snapshot.rows.length){showToast('本批次没有失败记录，未生成文件','info');return false;}
      var rows=[['批次号','手机号','失败原因']].concat(snapshot.rows.map(function(r){return [snapshot.batchId,r.phone,r.reason];}));
      var csv='\uFEFF'+rows.map(function(r){return r.map(dImportFailureCell).join(',');}).join('\r\n');
      var fresh=dImportFailureReview(historyId);
      if(fresh.revision!==proof.revision||fresh.accountId!==proof.accountId||fresh.tenantId!==proof.tenantId||fresh.taskId!==proof.taskId||fresh.fingerprint!==proof.fingerprint)throw Error('导入资料或权限已变化，请重新核对本批次。');
      var link=document.createElement('a');url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));link.href=url;link.download='AI导入失败记录_'+historyId+'.csv';document.body.appendChild(link);link.click();link.remove();var savedUrl=url;setTimeout(function(){URL.revokeObjectURL(savedUrl);},1000);url='';
      showToast('已生成本批次 '+snapshot.rows.length+' 条失败明细，请在浏览器下载中保存。','success');return true;
    } catch(error) {if(url)URL.revokeObjectURL(url);showToast(error.message||'失败明细暂时无法核对，未生成文件。','warning');return false;}
  }

'''


def transform(kind, path, code):
    if kind != 'ai' or path != 'js/pages/scene-list.js':
        return code
    code = one(code, '  function applyImportResults(sceneId, results, fileName) {',
               '  function applyImportResults(sceneId, results, fileName) {\n    var dImportReceipt=dImportFailureReceipt(results,sceneId,fileName);')
    code = one(code, '    window.MockImportHistory.unshift({',
               '    dImportReceipt.snapshot.batchId=batchId;\n    window.MockImportHistory.unshift({\n      importHistoryId:dImportReceipt.id, failureSnapshot:dImportReceipt.snapshot,')
    lines = [line for line in code.splitlines() if '.exportImportResult(' in line and 'r.fail' in line]
    if len(lines) != 1:
        raise ValueError('AI failure export button anchor changed')
    code = one(code, lines[0], "        dImportFailureAction(r) +")
    start = code.index('  function exportImportResult(failCount) {')
    end = code.index('  /* 厚朴通话原始状态码', start)
    code = code[:start] + HELPERS + code[end:]
    return code
