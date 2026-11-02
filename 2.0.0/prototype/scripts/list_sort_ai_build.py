"""Pure AI list-order transforms; filters, row identities and config order stay intact.

Only ordinary data render lists are copied and ordered.  Saved timestamps are
added exclusively on existing explicit writes, never while loading old data.
"""
import re


def one(code, before, after):
    if code.count(before) != 1:
        raise ValueError('AI list-order source conflict: ' + before[:150])
    return code.replace(before, after, 1)


def body(code, name, change):
    marker = '  function ' + name + '('
    if code.count(marker) != 1:
        raise ValueError('AI list-order function conflict: ' + name)
    start = code.index(marker)
    match = re.search(r'^  function ', code[start + len(marker):], re.M)
    end = start + len(marker) + match.start() if match else code.index('\n  window.Pages', start)
    updated = change(code[start:end])
    return code[:start] + updated + code[end:]


def rows(expression, fallback=()):
    options = ',{fallbackKeys:[' + ','.join(repr(key) for key in fallback) + ']}' if fallback else ''
    return 'DListOrder.rows(' + expression + options + ')'


def wrap_filter(code, name, fallback=()):
    marker = '  function ' + name + '('
    replacement = '  function ' + name + '(){return ' + rows('dListOriginal_' + name + '.apply(this,arguments)', fallback) + ';}\n  function dListOriginal_' + name + '('
    return one(code, marker, replacement)


TAG_HELPERS = r'''
  function dListTagConfigTouch(ids) {
    if(!currentSupplier||!currentTenantType||!currentScene)return;
    var key=getConfigKey(currentSupplier,currentTenantType,currentScene),config=MockTagConfigs[key]||(MockTagConfigs[key]={enabledTagIds:[]});
    var now=new Date().toISOString();config.updatedAt=now;
    config.tagUpdatedAt=config.tagUpdatedAt||{};
    ids.forEach(function(id){config.tagUpdatedAt[id]=now;});
  }
  function dListTagRows(tags) {
    var key=getConfigKey(currentSupplier,currentTenantType,currentScene),stamps=MockTagConfigs[key]?.tagUpdatedAt||{};
    return DListOrder.rows(tags.map(function(tag){return stamps[tag.id]?Object.assign({},tag,{_listConfigUpdatedAt:stamps[tag.id]}):tag;}),{keys:DListOrder.updateKeys.concat(['_listConfigUpdatedAt'])});
  }
'''


def transform(kind, path, code):
    if kind != 'ai':
        return code
    if path == 'js/pages/scene-list.js':
        code = one(code, '(window.MockSceneList || []).map(renderCard)', rows('(window.MockSceneList || [])', ['createdAt','createTime','time']) + '.map(renderCard)')
        code = one(code, 'grid.innerHTML = list.map(renderCard)', 'grid.innerHTML = ' + rows('list', ['createdAt','createTime','time']) + '.map(renderCard)')
        code = one(code, 'bodyHtml = cfgRows.map(function (r)', 'bodyHtml = ' + rows('cfgRows', ['lastCallTime','filterTime','submitTime','assignedTime','createdAt']) + '.map(function (r)')
        code = one(code, 'var rows = records.map(function (r)', 'var rows = ' + rows('records', ['time','createdAt']) + '.map(function (r)')
        # Details bind their exact row as JSON, so sorting retains the operation target.
        code = one(code, 'var rowsHtml = mockRecords.map(function (r, i)', 'var rowsHtml = ' + rows('mockRecords', ['endTime','startTime','callTime']) + '.map(function (r, i)')
    elif path == 'js/pages/scene-block.js':
        code = wrap_filter(code, 'filteredRows', ['createdAt'])
        # This is the effective controller after the scoped blacklist adapter.
        code = one(code, 'renderGroups=function(){var list=groups.filter(function(g){return g.name.indexOf(groupKeyword)>=0;});', 'renderGroups=function(){var list=' + rows('groups.filter(function(g){return g.name.indexOf(groupKeyword)>=0;})', ['createdAt']) + ';')
        # Explicit policy writes add metadata only after allowed-delta checks;
        # this controller must not stamp special groups/records beforehand.
    elif path == 'js/pages/result-records.js':
        code = body(code, 'getFilteredRows', lambda part: one(part, 'if (!page) return rows;', 'if (!page) return ' + rows('rows',['endTime','startTime']) + ';'))
        code = one(code, '    if (!sortField) return list;', '    list=' + rows('list',['endTime','startTime']) + ';\n    if (!sortField) return list;')
        # Existing explicit column-sort controls remain available. Default order
        # is latest update, with real call times as the legacy fallback.
    elif path == 'js/pages/result-clue.js':
        code = wrap_filter(code, 'getFilteredRows', ['lastVisitTime','firstVisitTime'])
        code = body(code,'renderClueDetailModal',lambda part:one(part,'var rowsHtml = revisits.map(function (r, i) {','var rowsHtml = '+rows('revisits',['time'])+'.map(function (r) {var i=revisits.indexOf(r);'))
    elif path == 'js/pages/sys-scene.js':
        code = one(code, 'return dFilteredSceneRows().map(function (row)', 'return ' + rows('dFilteredSceneRows()') + '.map(function (row)')
        # collectFormSceneRow already writes the actual updateTime on explicit save.
    elif path == 'js/pages/sys-account.js':
        code = wrap_filter(code, 'getFilteredAccounts')
        code = one(code, 'var tenants = getTenants();', 'var tenants = ' + rows('getTenants()') + ';')
        # submitAccountFormModal already writes updateTime for both branches.
    elif path == 'js/pages/report-call.js':
        code = body(code, 'renderRows', lambda part: one(part, 'return rows.map(', 'return ' + rows('rows',['date']) + '.map('))
        code = body(code, 'renderCustomerRows', lambda part: one(part, 'return rows.map(', 'return ' + rows('rows',['date']) + '.map('))
        code = one(code, "selected.length?selected.map(function(row,index)", "selected.length?" + rows('selected',['date']) + ".map(function(row,index)")
    elif path == 'js/pages/report-billing.js':
        for name, fallback in [('renderRows',['dateTo','dateFrom']),('renderDetailRows',['date']),('renderCallDetailRows',['endTime','startTime'])]:
            code = body(code,name,lambda part,fallback=fallback:one(part,'return rows.map(', 'return '+rows('rows',fallback)+'.map('))
    elif path == 'js/pages/report-clue.js':
        for name,fallback in [('renderStatRows',['date']),('renderDetailRows',['callTime','importTime','time'])]:
            code = body(code,name,lambda part,fallback=fallback:one(part,'    var p = curPage || 1;', '    rows='+rows('rows',fallback)+';\n    var p = curPage || 1;'))
        code = body(code,'renderReturnRows',lambda part:one(part,'var data = rows || window.MockClueReturn || [];','var data = '+rows('(rows || window.MockClueReturn || [])',['date'])+';'))
    elif path == 'js/pages/usage.js':
        code = one(code, "var rows = (getData().dailyUsage || {})[tenantId] || [];", "var rows = " + rows('((getData().dailyUsage || {})[tenantId] || [])',['date']) + ';')
        code = one(code, 'var rows = tasks.map(function (item)', 'var rows = '+rows('tasks',['endTime','startTime','date'])+'.map(function (item)')
    elif path == 'js/pages/sys-tenant.js':
        code = one(code, 'var rows = matchingTenantRows();', 'var rows = '+rows('matchingTenantRows()')+';')
        for name,fallback in [('renderAdjustmentRows',['effectiveAt']),('renderHistoryRows',['bindTime']),('renderInternalRechargeRows',['operatedAt']),('renderIterationAdjustmentRows',['operatedAt'])]:
            variable = 'records' if name in ['renderInternalRechargeRows','renderIterationAdjustmentRows'] else 'rows'
            code=body(code,name,lambda part,variable=variable,fallback=fallback:one(part,'return '+variable+'.map(', 'return '+rows(variable,fallback)+'.map('))
        # Authoritative recharge writes already have operatedAt; tenant edits
        # already write updateTime. Do not invent a timestamp while reading.
    elif path == 'js/pages/sys-tags.js':
        code = one(code, '  function render() {', TAG_HELPERS + '\n  function render() {')
        code = one(code, 'configData.tags.forEach(function(tag, idx)', 'dListTagRows(configData.tags).forEach(function(tag, idx)')
        code = one(code, 'localTags.forEach(function(tag, idx)', rows('localTags')+'.forEach(function(tag, idx)')
        code = one(code, 'DUnifiedAI.scenes().forEach(function(sc, idx)', rows('DUnifiedAI.scenes()')+'.forEach(function(sc, idx)')
        code = one(code, 'MockTagSuppliers.forEach(function(sp, idx)', rows('MockTagSuppliers')+'.forEach(function(sp, idx)')
        code = one(code, '        pool[i][field] = value;', '        pool[i][field] = value;pool[i].updatedAt=new Date().toISOString();')
        code = one(code, '        tag.sort = newSort;', '        tag.sort = newSort;tag.updatedAt=new Date().toISOString();')
        code = one(code, '      pool.push(newTag);', '      newTag.createdAt=newTag.updatedAt=new Date().toISOString();pool.push(newTag);')
        code = one(code, "        localCode: nextLocalStandardTagCode(currentTenantType, currentScene),", "        localCode: nextLocalStandardTagCode(currentTenantType, currentScene),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),")
        code = one(code, '    if (supplier) supplier.name = newName;', '    if (supplier){supplier.name = newName;supplier.updatedAt=new Date().toISOString();}')
        code = one(code, "supplier.status = supplier.status === 'enabled' ? 'disabled' : 'enabled';", "supplier.status = supplier.status === 'enabled' ? 'disabled' : 'enabled';supplier.updatedAt=new Date().toISOString();")
        code = one(code, "MockTagSuppliers.push({ id: newId,", "MockTagSuppliers.push({ createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),id: newId,")
        code = body(code,'updateLocalMapping',lambda part:one(part,'    refreshMappedCount();', '    dListTagConfigTouch([tagId]);refreshMappedCount();loadTagList(currentSupplier,currentTenantType,currentScene);'))
        code = body(code,'toggleTagEnable',lambda part:one(part,'    // 更新行样式', '    dListTagConfigTouch([tagId]);\n    // 更新行样式'))
        code = body(code,'toggleTagEnable',lambda part:one(part,'    refreshMappedCount();', '    refreshMappedCount();loadTagList(currentSupplier,currentTenantType,currentScene);'))
        code = body(code,'setAllTagsEnabled',lambda part:one(part,"    config.enabledTagIds = enabled ? pool.map(function(tag) { return tag.id; }) : [];\n    MockTagConfigs[configKey] = config;", "    config.enabledTagIds = enabled ? pool.map(function(tag) { return tag.id; }) : [];\n    MockTagConfigs[configKey] = config;dListTagConfigTouch(pool.map(function(tag){return tag.id;}));"))
        code = body(code,'saveSupplierEdit',lambda part:one(part,'    refreshTreePanel();', '    refreshSupplierModalBody();refreshTreePanel();'))
        # Keep tag.sort and runtime option ordering intact. Only management
        # table projections above are ordered by their saved update metadata.
    return code
