"""Pure Cloud display-order hooks and timestamps for explicit local saves.

The shared DListOrder client is supplied by the host build.  These hooks sort
filtered display copies before slicing, never the execution/configuration
arrays.  Import row order, priorities, node paths and historical rounds retain
their original meaning.
"""


def one(code, before, after):
    if code.count(before) != 1:
        raise ValueError('Cloud list order source conflict: ' + before[:150])
    return code.replace(before, after, 1)


RECORD_OPTIONS = "{keys:[...window.DListOrder.updateKeys,'events[].at','rounds[].openedAt','rounds[].segments[].savedAt','rounds[].segments[].occurredAt','rounds[].segments[].endedAt'],fallbackKeys:['cutoffAt','createdAt','at']}"
DCC_OPTIONS = "{keys:[...window.DListOrder.updateKeys,'supplierDeletedAt','submittedAt','syncResponses[].receivedAt','importFailureEvidence[].receivedAt','evidence[].receivedAt','responses[].receivedAt','attempts[].at','history[].at'],fallbackKeys:['newBatchCreatedAt','originalImportedAt','receivedAt','confirmedAt','createdAt']}"


def _line(code, contains, change):
    lines = [line for line in code.splitlines() if contains in line]
    if len(lines) != 1:
        raise ValueError('Cloud list order line conflict: ' + contains)
    return one(code, lines[0], change(lines[0]))


def _wrap_filtered_line(code, contains, variable, options='{}'):
    def change(line):
        before = 'const ' + variable + '='
        if before not in line:
            before = 'const ' + variable + ' = '
        return line.replace(before, before + 'window.DListOrder.rows(', 1).rsplit(';', 1)[0] + ',' + options + ');'
    return _line(code, contains, change)


def _configuration_timestamps(code):
    helper = """  // List metadata is excluded from the fixed business schema signature.
  function listSortCloudSchemaRow(row) {
    if (!row) return null;
    const value = {...row}; delete value.updatedAt; delete value.createdAt; return value;
  }
  function listSortCloudPreserveKeys(value,previous) {
    if (!previous) return value;
    const ordered={};
    for (const key of Object.keys(previous)) if (Object.hasOwn(value,key)) ordered[key]=value[key];
    for (const key of Object.keys(value)) if (!Object.hasOwn(ordered,key)) ordered[key]=value[key];
    return ordered;
  }
"""
    code = one(code, '  function mutate(source, options, change, commitGuard) {', helper + '  function mutate(source, options, change, commitGuard) {')
    code = one(code, 'options,enabled:input.enabled !== false,...(input.usage!==undefined?', "options,enabled:input.enabled !== false,...(typeof input.createdAt==='string'?{createdAt:input.createdAt}:{}),...(typeof input.updatedAt==='string'?{updatedAt:input.updatedAt}:{}),...(input.usage!==undefined?")
    code = one(code, '      const result = change(target); if (!result.ok) return result;', """      const result = change(target); if (!result.ok) return result;
      const listSavedAt=new Date().toISOString(),explicitCategory=result.message==='业务分类已保存';
      let savedField=result.message==='自定义字段已保存'?target.fields.find(field=>field.id===result.row?.id):null;
      if (savedField) {
        const previous=originalFields.find(field=>field.id===savedField.id);
        if (previous && fieldUsage(previous)==='FOLLOWUP' && fieldUsage(savedField)==='FOLLOWUP') {
          if (!Object.hasOwn(previous,'usage')) delete savedField.usage;
          if (!Object.hasOwn(previous,'brandId') && savedField.brandId===target.brandId) delete savedField.brandId;
        }
        if (previous) savedField.options=savedField.options.map(option=>listSortCloudPreserveKeys(option,previous.options?.find(row=>row.id===option.id)));
        const fieldIndex=target.fields.indexOf(savedField);
        savedField=listSortCloudPreserveKeys(savedField,previous); target.fields[fieldIndex]=savedField;
        if (previous?.createdAt!==undefined) savedField.createdAt=previous.createdAt;
        else if (!previous) savedField.createdAt=listSavedAt;
        savedField.updatedAt=listSavedAt; result.row=clone(savedField);
      }""")
    code = one(code, "['configurationVersion','flowBinding','flowBindingHistory']", "['configurationVersion','flowBinding','flowBindingHistory','updatedAt','createdAt']")
    code = _line(code, 'for(const row of target.types){const previous=originalTypes.find', lambda _: """      for (let row of target.types) {
        const previous=originalTypes.find(item=>item.id===row.id);
        const rowIndex=target.types.indexOf(row); row=listSortCloudPreserveKeys(row,previous); target.types[rowIndex]=row;
        const changed=!previous || JSON.stringify(baseOnly(previous))!==JSON.stringify(baseOnly(row)) ||
          JSON.stringify(categoryFieldRefs(previous).map(ref=>listSortCloudSchemaRow(originalFields.find(field=>field.id===ref.fieldId))))!==JSON.stringify(categoryFieldRefs(row).map(ref=>listSortCloudSchemaRow(target.fields.find(field=>field.id===ref.fieldId))));
        row.configurationVersion=previous?Number(previous.configurationVersion||1)+(changed?1:0):1;
        if (previous?.createdAt!==undefined) row.createdAt=previous.createdAt;
        else if (!previous) row.createdAt=listSavedAt;
        if (changed || explicitCategory && result.row?.id===row.id) row.updatedAt=listSavedAt;
        else if (previous?.updatedAt!==undefined) row.updatedAt=previous.updatedAt;
        if (explicitCategory && result.row?.id===row.id) result.row=clone(row);
      }""")
    code = one(code, 'fields:definitions.filter(f=>categoryFieldRefs(row).some(ref=>ref.fieldId===f.id))', 'fields:definitions.filter(f=>categoryFieldRefs(row).some(ref=>ref.fieldId===f.id)).map(listSortCloudSchemaRow)')
    code = one(code, 'if(committed){if(oldBinding)', 'if(committed){current.updatedAt=at;if(oldBinding)')
    return code


def _ledger_timestamps(code):
    code = one(code, '      const outcome=options.outcome||\'success\';', """      // Only a committed explicit action changes these timestamps. Reads and
      // repeated request receipts leave the stored records untouched.
      const listSavedAt=now();
      for (const name of ['records','templates','categories','batches']) for (const row of next[name] || []) {
        const idKey={records:'recordId',templates:'templateId',categories:'categoryId',batches:'batchId'}[name];
        const previous=(s[name] || []).find(item=>item[idKey]===row[idKey]);
        if (!previous || JSON.stringify(previous)!==JSON.stringify(row)) row.updatedAt=listSavedAt;
      }
      const outcome=options.outcome||'success';""")
    code = one(code, "createdAt:own?b.at:undefined,at:own?b.at:undefined,", "createdAt:own?b.at:undefined,at:own?b.at:undefined,updatedAt:listSortCloudBatchTime(records,own?b:null),")
    marker = '  function batchView('
    if marker not in code:
        # The effective source uses projectBatch; assert either known spelling.
        marker = '  function projectBatch('
    helper = """  function listSortCloudBatchTime(records,batch) {
    const values=[window.DListOrder.time(batch,{fallbackKeys:['at']})];
    for (const row of records) values.push(window.DListOrder.time(row,""" + RECORD_OPTIONS + """));
    const known=values.filter(value=>value!==null && Number.isFinite(value));
    return known.length?new Date(Math.max(...known)).toISOString():undefined;
  }
"""
    # Use a stable existing declaration, without rewriting any projection scope.
    if marker not in code:
        marker = '  function batchRecords('
    code = one(code, marker, helper + marker)
    code = code.replace("kind:q.kind,status:q.status,message:q.message}", "kind:q.kind,status:q.status,message:q.message,at:q.at}")
    code = one(code, "return {kind:q.kind,status:q.status,result:", "return {kind:q.kind,status:q.status,at:q.at,result:")
    code = one(code, "return {status,requestId,message:q.message,data:", "return {status,requestId,at:q.at,message:q.message,data:")
    code = one(code, "return {status:previous.status,requestId,message:previous.message,data:", "return {status:previous.status,requestId,at:previous.at,message:previous.message,data:")
    return code


def transform(kind, path, code):
    if kind != 'cloud':
        return code
    if path == 'js/components/customer-business.js':
        return _configuration_timestamps(code)
    if path == 'js/components/business-data.js':
        code = one(code, '      saved.data.revision += 1;', '      row.updatedAt=new Date().toISOString();\n      saved.data.revision += 1;')
        return one(code, "const row = {id,...check.value,sourceRevision:0,tenantRevisions:{}};", "const row = {id,...check.value,sourceRevision:0,tenantRevisions:{},createdAt:new Date().toISOString()};")
    if path == 'js/components/business-flow-store.js':
        return _ledger_timestamps(code)
    if path == 'js/components/brand-lead-store.js':
        code = one(code, "row = {brandId:'BRAND-' + crypto.randomUUID()};", "row = {brandId:'BRAND-' + crypto.randomUUID(),createdAt:new Date().toISOString()};")
        return one(code, "Object.assign(row, {name,remark:String(remark || '').trim()});", "Object.assign(row, {name,remark:String(remark || '').trim(),updatedAt:new Date().toISOString()});")
    if path == 'js/pages/business-data-dictionary.js':
        return _wrap_filtered_line(code, 'const filtered = data.filter(', 'filtered')
    if path == 'js/pages/flow-configuration.js':
        code = _wrap_filtered_line(code, 'const rows=(data.templates || []).filter', 'rows', "{keys:[...window.DListOrder.updateKeys,'versions[].savedAt'],fallbackKeys:['savedAt']}")
        return _wrap_filtered_line(code, 'const rows=(result.data || []).filter', 'rows', "{fallbackKeys:['at']}")
    if path == 'js/pages/business-categories.js':
        return one(code, 'return ui.sortByUpdated?.(rows,[]) || rows;', "return window.DListOrder.rows(rows,{keys:[...window.DListOrder.updateKeys,'flowBinding.savedAt']});")
    if path == 'js/pages/brand-archives.js':
        return one(code, "const rows=S.fresh().brands.filter(b=>(b.name+' '+b.brandId).toLowerCase().includes(keyword.toLowerCase()));", "const rows=window.DListOrder.rows(S.fresh().brands.filter(b=>(b.name+' '+b.brandId).toLowerCase().includes(keyword.toLowerCase())));")
    if path == 'js/pages/brand-leads.js':
        return _wrap_filtered_line(code, 'const rows=all.filter(r=>', 'rows', RECORD_OPTIONS)
    if path == 'js/pages/business-flow.js':
        code = one(code, "const rows = listState.rows || [], batchRows = [...(listState.batches || [])];", "const rows = window.DListOrder.rows(listState.rows || []," + RECORD_OPTIONS + "), batchRows = window.DListOrder.rows(listState.batches || [],{fallbackKeys:['at']});")
        code = _line(code, 'const b=ret.data,records=(b.records||[]).filter', lambda line: line.replace('records=(b.records||[]).filter', 'records=window.DListOrder.rows((b.records||[]).filter', 1).rsplit(';', 1)[0] + ',' + RECORD_OPTIONS + ');')
        code = one(code, 'pending.push({ requestId: result.requestId, kind: kindName(kind), recordId, context: activeContext });', "pending.push({ requestId: result.requestId, kind: kindName(kind), recordId, context: activeContext, at:window.DListOrder.parse(result.at)!==null?result.at:new Date().toISOString() });")
        code = one(code, 'return readPending().filter(item => !recordId || item.recordId === recordId).map(item =>', "return window.DListOrder.rows(readPending().filter(item => !recordId || item.recordId === recordId),{fallbackKeys:['at']}).map(item =>")
        code = one(code, "rememberPending({ status: 'unknown', requestId: request.requestId },", "rememberPending({ status: 'unknown', requestId: request.requestId, at:request.at },")
        return code
    if path == 'js/pages/customer-tasks.js':
        code = one(code, 'templatePending.push({requestId:ret.requestId,kind,batchKey,context:batchContext()});', "templatePending.push({requestId:ret.requestId,kind,batchKey,context:batchContext(),at:window.DListOrder.parse(ret.at)!==null?ret.at:new Date().toISOString()});")
        code = one(code, 'return templatePending.filter(p=>p.context===batchContext()).map(p=>', "return window.DListOrder.rows(templatePending.filter(p=>p.context===batchContext()),{fallbackKeys:['at']}).map(p=>")
        before="saveTemplatePending({status:'unknown',requestId:q.requestId},"
        if code.count(before)!=2:
            raise ValueError('Cloud pending projection source conflict')
        return code.replace(before,"saveTemplatePending({status:'unknown',requestId:q.requestId,at:q.at},")
    if path == 'js/pages/report-center.js':
        return one(code, "      else if (['customers', 'outbound'].includes(key)) model.rows = sortRows(model.rows);", """      else if (['customers', 'outbound'].includes(key)) model.rows = sortRows(model.rows);
      else model.rows = window.DListOrder.rows(model.rows,{
        keys:[...window.DListOrder.updateKeys,'calls[].updatedAt','calls[].updateTime','calls[].localUpdatedAt','calls[].customerFollowup.updatedAt','items[].updatedAt'],
        fallback:row=>(row.calls || []).flatMap(call=>callFallback(call)).map(metrics.timestamp).filter(value=>value!==null).sort((a,b)=>b-a)
      });""")
    if path == 'js/components/dcc-records.js':
        # These arrays are display copies. Runtime submission/pending order and
        # the original row indices in the editable import preview are unchanged.
        code = one(code, "  function renderImport(task,data) {", "  const listSortCloudDcc=rows=>window.DListOrder.rows(rows || []," + DCC_OPTIONS + ");\n  function renderImport(task,data) {")
        code = one(code, 'const {records,localFailures,submissions}=data,feedback=', 'const records=listSortCloudDcc(data.records),localFailures=data.localFailures||[],submissions=data.submissions||[],feedback=')
        code = one(code, 'records=data.records||[],requests=data.deletionRequests||[];', 'records=listSortCloudDcc(data.records),requests=listSortCloudDcc(data.deletionRequests);')
        code = one(code, "const rows=data.actualResults||[],calls=rows.filter(row=>row.kind==='call'),events=rows.filter(row=>row.kind==='no_cdr_failure')", "const rows=listSortCloudDcc(data.actualResults),calls=rows.filter(row=>row.kind==='call'),events=rows.filter(row=>row.kind==='no_cdr_failure')")
        code = one(code, 'const details=data.failureDetails||[],events=data.failureEvents||[],groups=data.failureGroups||[],snapshots=data.exportSnapshots||[];', 'const details=listSortCloudDcc(data.failureDetails),events=data.failureEvents||[],groups=data.failureGroups||[],snapshots=listSortCloudDcc(data.exportSnapshots);')
        code = one(code, 'snapshots.slice().reverse().map(snapshot=>', 'snapshots.map(snapshot=>')
        code = one(code, 'return \'<h3>业务系统回传</h3>\'+deliveries.map(delivery=>', "return '<h3>业务系统回传</h3>'+listSortCloudDcc(deliveries).map(delivery=>")
        code = one(code, 'const plans=view.data.plans.filter(row=>!data.filteredRecord||row.recordId===data.filteredRecord.recordId),attempts=view.data.attempts;', 'const plans=listSortCloudDcc(view.data.plans.filter(row=>!data.filteredRecord||row.recordId===data.filteredRecord.recordId)),attempts=view.data.attempts;')
        return code
    return code
