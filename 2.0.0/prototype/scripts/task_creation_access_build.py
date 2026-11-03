"""Expose the existing task creation guard in the retained task entry UI."""


def replace_once(code, before, after, label):
    if code.count(before) != 1:
        raise ValueError('Task creation source changed: ' + label)
    return code.replace(before, after, 1)


def transform(kind, path, code):
    if kind != 'cloud':
        return code
    if path == 'js/pages/cloud-task-workspace.js':
        marker = '  function canAccessObject(item) {'
        helper = """  function taskCreateReason() {
    if (canUseWorkspace()) return '';
    if (!AppState.effectiveAccess().valid || AppState.get().activeDomain !== 'CLOUD_CONTACT_CENTER') {
      return '当前账号或呼叫任务范围不可用，请重新进入有权的云呼叫租户。';
    }
    return '当前身份没有新建任务权限，请由已授权的租户管理员或运营办理。';
  }
"""
        code = replace_once(code, marker, helper + marker, 'creation reason')
        before = "    if (!canUseWorkspace() || !['预外呼', 'IVR 外呼'].includes(type)) return false;"
        after = """    const createReason = taskCreateReason();
    if (createReason) { showToast(createReason, 'warning'); return false; }
    if (!['预外呼', 'IVR 外呼'].includes(type)) { showToast('请选择预外呼或IVR外呼任务。', 'warning'); return false; }"""
        code = replace_once(code, before, after, 'start rejection feedback')
        code = replace_once(code, '  window.CloudTaskWorkspace = {',
                            '  window.CloudTaskWorkspace = { taskCreateReason,', 'public creation reason')
    elif path == 'js/pages/cloud-call-tasks.js':
        marker = '  function taskPage(type) {\n'
        code = replace_once(code, marker, marker + '    var createReason = CloudTaskWorkspace.taskCreateReason();\n', 'list creation state')
        marker = '<button class="btn btn-primary" onclick="window.Pages[\\\'cloud-call-tasks\\\'].openCreate('
        replacement = '<button type="button" class="btn btn-primary" \' + (createReason ? \'disabled aria-disabled="true" aria-describedby="cloud-task-create-reason" title="\' + esc(createReason) + \'" \' : \'\') + \'onclick="window.Pages[\\\'cloud-call-tasks\\\'].openCreate('
        code = replace_once(code, marker, replacement, 'disabled creation button')
        marker = '      ui.table([\n'
        # This controller has several tables; insert only at the task-list boundary.
        boundary = "'<span>' + ui.help(helpText, '任务说明') + '</span>') +\n" + marker
        reason = "      (createReason ? '<p id=\"cloud-task-create-reason\" class=\"field-hint\" role=\"status\">' + esc(createReason) + '</p>' : '') +\n"
        code = replace_once(code, boundary,
                            "'<span>' + ui.help(helpText, '任务说明') + '</span>') +\n" + reason + marker,
                            'visible creation explanation')
    return code
