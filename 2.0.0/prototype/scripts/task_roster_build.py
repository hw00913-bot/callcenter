"""Render authorized new and historical task rows in each original customer table.

Reference models and saved professional rows remain unchanged. Apply after the
existing task import transform; the runtime performs a scope-checked read overlay.
"""
from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]

def one(code,before,after):
    if code.count(before)!=1:raise ValueError('Task roster source boundary changed: '+before[:140])
    return code.replace(before,after,1)

def function_bounds(code,name):
    start=re.search(r'^  (?:async )?function '+re.escape(name)+r'\(',code,re.M)
    if not start:raise ValueError('Task roster missing function: '+name)
    end=re.search(r'^  (?:async )?function [A-Za-z_$][\w$]*\(',code[start.end():],re.M)
    if not end:raise ValueError('Task roster missing function end: '+name)
    return start.start(),start.end()+end.start()

def matching(code,start,opening,closing):
    depth=0;quote=None;escape=False;i=start
    while i<len(code):
        char=code[i]
        if quote:
            if escape:escape=False
            elif char=='\\':escape=True
            elif char==quote:quote=None
        elif char in "'\"`":quote=char
        elif code.startswith('//',i):
            newline=code.find('\n',i);i=len(code) if newline<0 else newline;continue
        elif code.startswith('/*',i):
            end=code.find('*/',i+2)
            if end<0:raise ValueError('Task roster unterminated comment')
            i=end+2;continue
        elif char==opening:depth+=1
        elif char==closing:
            depth-=1
            if depth==0:return i
        i+=1
    raise ValueError('Task roster unmatched expression')

def table_overlay(code,name,table_prefix,rows_name,spec,mode='predictive',native_scoped=True):
    start,end=function_bounds(code,name);source=code[start:end]
    at=source.find(table_prefix)
    if at<0:raise ValueError('Task roster missing native table '+name)
    paren=at+len(table_prefix)-1;stop=matching(source,paren,'(',')');array=source.find('[',paren);array_end=matching(source,array,'[',']');columns=source[array:array_end+1]
    # Keep native cell render closures in their original scope and pass only real
    # native objects to them. New business rows never enter professional actions.
    constant='    const taskRosterColumns='+columns+';\n'
    marker='    return '
    pos=source.find(marker)
    if pos<0:raise ValueError('Task roster missing return '+name)
    source=source[:pos]+constant+source[pos:]
    # Added text precedes the old table call; locate it again after insertion.
    at=source.find(table_prefix,source.find(marker)+len(marker));paren=at+len(table_prefix)-1;stop=matching(source,paren,'(',')')
    expression="window.DTaskRosterView.%s({spec:%s,rows:%s,columns:taskRosterColumns,nativeScoped:%s,renderNative:record=>window.DTaskRosterView.extractCells(%s(taskRosterColumns,[record],{numbered:false}))})"%(mode,spec,rows_name,'true' if native_scoped else 'false',table_prefix[:-1])
    source=source[:at]+expression+source[stop+1:]
    return code[:start]+source+code[end:]

def transform(kind,path,code):
    if kind=='ai' and path=='js/pages/scene-list.js':
        start,end=function_bounds(code,'renderSubContent')
        replacement=r'''  function renderSubContent(tabName) {
    var cfg=SubTabConfig[tabName]||SubTabConfig['已分配'];
    var actionsHtml=cfg.actions?'<div class="scene-detail-actions"><button class="btn btn-default" onclick="window.Pages[\'scene-list\'].showImportModal()">'+taskBusinessImportLabel()+'</button><button class="btn btn-default">批量移除</button><button class="btn btn-default" onclick="window.Pages[\'scene-list\'].showTaskImportHistory()">导入记录</button></div>':'';
    var exportHtml=cfg.exportBtn?'<button class="btn btn-primary" onclick="showToast(\'导出功能开发中\',\'info\')">导出</button>':'';
    var records=typeof cfg.getRows==='function'?cfg.getRows():(cfg.rows||[]);
    return window.DTaskRosterView.ai({spec:taskBusinessImportSpec(),tab:tabName,rows:records,columns:cfg.cols,actions:actionsHtml+exportHtml,renderNative:cfg.renderRow||function(){return ''}});
  }

'''
        code=code[:start]+replacement+code[end:]
    if kind=='cloud' and path=='js/components/dcc-records.js':
        # Remove only the old standalone business section if an older caller
        # still supplies it; current root transform no longer adds this section.
        code=table_overlay(code,'renderImport','ui().table(','records',"{method:'PREDICTIVE',taskId:String(task.taskId)}")
        code=one(code,'<div class="dcc-section-title"><h2>客户名单</h2><span>共 ${records.length} 条</span></div>','<div class="dcc-section-title"><h2>客户名单</h2></div>')
        code=one(code,"ui().kpi('已保存客户',records.length,'信息校验未通过 '+localFailures.length+' 条')","window.DTaskRosterView.savedKpi({method:'PREDICTIVE',taskId:String(task.taskId)},records,'信息校验未通过 '+localFailures.length+' 条')")
    if kind=='cloud' and path=='js/pages/cloud-call-tasks.js':
        code=one(code,"{ key: 'total', label: '名单条数' }","{ key: 'total', label: '名单条数', render: (_,task) => task.callType==='预外呼'?window.DTaskRosterView.count({method:'PREDICTIVE',taskId:String(task.taskId)},window.DTaskRosterView.nativeTaskRows(task)):esc(task.total) }")
        start,end=function_bounds(code,'exportTasks');original=code[start:end].replace('function exportTasks(','function nativeTaskRosterExportTasks(',1)
        wrapped=r"""  async function exportTasks(type) {
    if(type!=='预外呼')return nativeTaskRosterExportTasks(type);
    var rows=taskRows(type);if(!rows.length)return showToast('当前没有可导出的任务','warning');
    var owner=window.DTaskRosterView.scopeToken();
    try{
      var totals=await Promise.all(rows.map(row=>window.DTaskRosterView.countValue({method:'PREDICTIVE',taskId:String(row.taskId)},window.DTaskRosterView.nativeTaskRows(row))));
      if(owner!==window.DTaskRosterView.scopeToken())return false;
      var headers=['任务名称','类型','状态','名单条数','已完成','已接通','负责人','更新时间'];
      var lines=rows.map(function(row,index){var updated=ui.updatedTimestamp?.(row);return [row.name,'预外呼',row.status,totals[index],row.completed??0,row.connected??0,row.owner||'',updated==null?'':new Date(updated).toLocaleString('sv-SE')].map(csvCell).join(',');});
      var blob=new Blob(['\uFEFF'+headers.map(csvCell).join(',')+'\n'+lines.join('\n')],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),anchor=document.createElement('a');anchor.href=url;anchor.download='预外呼任务.csv';document.body.appendChild(anchor);anchor.click();anchor.remove();setTimeout(function(){URL.revokeObjectURL(url);},1000);return true;
    }catch(error){showToast(error.message||'名单数量尚未完整读取，请刷新后重试。','warning');return false;}
  }

"""
        code=code[:start]+original+wrapped+code[end:]

    if kind=='cloud' and path=='js/pages/cloud-task-workspace.js':
        start,end=function_bounds(code,'centerCustomers');source=code[start:end]
        # Assigned native customer rows are complete; keep their real renderers,
        # including repeat-contact operations, for those rows alone.
        marker='${ui.table([';at=source.find(marker)
        if at<0:raise ValueError('Task roster missing assigned customer table')
        call=at+2;paren=call+len('ui.table');stop=matching(source,paren,'(',')');array=source.find('[',paren);array_end=matching(source,array,'[',']');columns=source[array:array_end+1]
        expression="window.DTaskRosterView.predictive({spec:{method:'PREDICTIVE',taskId:String(row.taskId)},rows:assigned,columns:"+columns+",renderNative:record=>window.DTaskRosterView.extractCells(ui.table("+columns+",[record],{numbered:false}))})"
        source=source[:call]+"(row.callType==='预外呼'?"+expression+":"+source[call:stop+1]+")"+source[stop+1:]
        source=source.replace('本任务呼叫名单 · ${assigned.length} 条',"${row.callType==='预外呼'?'客户名单':'本任务呼叫名单 · '+assigned.length+' 条'}",1)
        # Preserve the original sample/history rendering branch too; no real
        # data is inferred from row.total or fabricated by the new overlay.
        at=source.find('${ui.table([')
        if at>=0:
            call=at+2;paren=call+len('ui.table');stop=matching(source,paren,'(',')');array=source.find('[',paren);array_end=matching(source,array,'[',']');columns=source[array:array_end+1]
            expression="window.DTaskRosterView.predictive({spec:{method:'PREDICTIVE',taskId:String(row.taskId)},rows:customerRows(row),columns:"+columns+",nativeScoped:true,renderNative:record=>window.DTaskRosterView.extractCells(ui.table("+columns+",[record],{numbered:false}))})"
            source=source[:call]+"(row.callType==='预外呼'?"+expression+":"+source[call:stop+1]+")"+source[stop+1:]
            source=source.replace('<h2>客户数据</h2><p>${esc(row.listSource)} · 共 ${row.total} 条，仅展示前 ${Math.min(row.total, 8)} 条记录</p>',"<h2>${row.callType==='预外呼'?'客户名单':'客户数据'}</h2>${row.callType==='预外呼'?'':`<p>${esc(row.listSource)} · 共 ${row.total} 条，仅展示前 ${Math.min(row.total, 8)} 条记录</p>`}",1)
        code=code[:start]+source+code[end:]
        code=one(code,'<strong data-dcc-local-count>${count}</strong>',"<strong data-dcc-local-count>${window.DTaskRosterView.count({method:'PREDICTIVE',taskId:String(row.taskId)},data?.records)}</strong>")
        code=one(code,'<strong>已保存客户 ${localCount}</strong>',"<strong>名单记录 ${window.DTaskRosterView.count({method:'PREDICTIVE',taskId:String(row.taskId)},recordResult?.ok?recordResult.data.records:null)}</strong>")
    return code

def runtime_source():return (ROOT/'js/adapters/task-roster-view.js').read_text()
def style_source():return (ROOT/'js/adapters/task-roster-view.css').read_text()
