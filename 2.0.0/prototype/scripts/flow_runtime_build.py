"""Project-owned explicit local Mock evidence entry. Never edits reference sources."""
from pathlib import Path


def one(code, before, after):
    if code.count(before) != 1:
        raise ValueError('Routing runtime hook conflict: ' + before[:110])
    return code.replace(before, after, 1)


def transform(kind, path, code):
    if kind != 'cloud':
        return code
    here = Path(__file__).parent
    if path == 'js/components/business-flow-store.js':
        if 'function routingEvidenceContext(' in code:
            raise ValueError('Routing runtime store already injected')
        marker = '  window.BusinessFlowStore={'
        helper = (here / 'flow-runtime-store.js').read_text()
        return one(code, marker, helper + '\n' + marker + 'routingEvidenceContext,')
    if path != 'js/pages/business-flow.js':
        return code
    if 'function makeRoutingMockProof(' in code:
        raise ValueError('Routing runtime UI already injected')
    start = code.index('  function renderSimulation(row) {')
    end = code.index('  function currentDetail()', start)
    fragment = code[start:end]
    fragment = one(fragment, '<select id="bfEventSegment">', '<select id="bfEventSegment" onchange="BusinessFlow.routingMockChanged()">')
    fragment = one(fragment, 'seg.segmentId === segments.at(-1).segmentId', 'seg.segmentId === routingMockSelectedSegment(row,segments)')
    fragment = one(fragment, "+ '</div></details>';", "+ routingMockPanel(row) + '</div></details>';")
    code = code[:start] + fragment + code[end:]
    helper = (here / 'flow-runtime-ui.js').read_text()
    # The original page exports BusinessFlow and keeps call()/selectedId private.
    marker = '  const api = {'
    return one(code, marker, helper + '\n' + marker + 'routingMockChanged,submitRoutingEvidence,')
