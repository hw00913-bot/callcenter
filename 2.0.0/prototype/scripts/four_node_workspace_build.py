"""Attach four-node runtime views while preserving original professional pages."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def one(code, before, after):
    if code.count(before) != 1:
        raise ValueError('Four-node workspace source conflict: ' + before[:140])
    return code.replace(before, after, 1)


def transform(kind, path, code):
    if kind != 'cloud':
        return code
    if path == 'js/pages/customer-directory.js':
        # The current workspace owns the shared title and tabs around both views.
        code = one(code, '<section class="platform-page customer-directory-page">', '<section class="customer-directory-page">')
        code = one(
            code,
            "ui.pageHeader('客户档案', '按客户号码查看联系历史，保留每次导入和跟进进度。', '<button class=\"btn\" onclick=\"' + api + '.refresh()\">刷新</button>')",
            "''",
        )
        code = one(
            code,
            'callTable(customer) + batchTable(customer)',
            "(window.FourNodeWorkspace?.customerTimeline(customer)||'') + callTable(customer) + batchTable(customer)",
        )
    if path == 'js/pages/cloud-call-records.js':
        marker = "ui.detailSection('本次客户业务信息',CustomerFollowup.detail(call.customerFollowup,call))+"
        code = one(code, marker, "(window.FourNodeWorkspace?.callBusinessLink(call)||'')+" + marker)
    return code


def runtime_source():
    """Append after the store, original Cloud adapter and execution bridge."""
    return (ROOT / 'js/adapters/four-node-workspace.js').read_text()


def style_source():
    return (ROOT / 'js/adapters/four-node-workspace.css').read_text()
