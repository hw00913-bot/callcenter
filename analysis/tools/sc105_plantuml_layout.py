"""Project-only SC-105 layout adapter; derive every label and edge from its graph.

An all-terminating branch may be rendered before the continuing branch rather
than nesting that continuation in ``else``. This changes no node, edge or fact.
The official renderer still owns SVG sanitization and source metadata.
"""
from __future__ import annotations

from collections import Counter
import hashlib
import json
from pathlib import Path
import sys

SCRIPTS = Path('/Users/huhaowen/.codex/skills/requirement-analysis-loop/scripts')
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))

from plantuml_renderer import (  # noqa: E402
    _ActivityCompiler,
    _edge_label,
    _safe_text,
    PlantUMLRenderError,
    compile_plantuml_activity as official_compile,
    render_plantuml_svg,
    resolve_plantuml_runtime,
)


def fingerprint(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()).hexdigest()


class SC105LayoutCompiler(_ActivityCompiler):
    # IDs choose presentation order only. Text/conditions never come from here.
    terminal_first = {'N4': 'FAIL4', 'N6': 'FAIL6', 'CONFIRM': 'CANCEL', 'N7': 'LOCAL_CHOICE'}

    def __init__(self, detail):
        super().__init__(detail)
        self.node_emissions = []
        self.edge_emissions = []
        self.layout_mapping = []

    def _emit_path(self, node_id, stop_at, active):
        if node_id != stop_at:
            self.node_emissions.append(node_id)
            if self.nodes[node_id]['type'] != 'decision':
                self.edge_emissions.extend(self.outgoing.get(node_id, []))
        return super()._emit_path(node_id, stop_at, active)

    def _emit_decision(self, node_id, node, outer_stop, active):
        edges = self.outgoing[node_id]
        self.edge_emissions.extend(edges)
        self.layout_mapping.append({
            'node_id': node_id,
            'question': node['label'],
            'branches': [{'from': edge['from'], 'to': edge['to'], 'label': _edge_label(edge)} for edge in edges],
            'layout': 'terminal_guard_then_continuation' if node_id in self.terminal_first else 'official_structured_branch',
        })
        if node_id not in self.terminal_first:
            return super()._emit_decision(node_id, node, outer_stop, active)
        if len(edges) != 2:
            raise PlantUMLRenderError(f'{node_id}: SC-105 presentation shape changed; re-review adapter')
        guard_edges = [edge for edge in edges if str(edge['to']) == self.terminal_first[node_id]]
        if len(guard_edges) != 1:
            raise PlantUMLRenderError(f'{node_id}: missing expected terminal branch')
        guard = guard_edges[0]
        continuation = next(edge for edge in edges if edge is not guard)
        guard_nodes = self._descendants(str(guard['to']))
        continuation_nodes = self._descendants(str(continuation['to']))
        if guard_nodes & continuation_nodes:
            raise PlantUMLRenderError(f'{node_id}: branches now join; terminal-first layout is not equivalent')
        leaves = [item for item in guard_nodes if not self.outgoing.get(item)]
        if not leaves or any(self.nodes[item]['type'] != 'end' for item in leaves):
            raise PlantUMLRenderError(f'{node_id}: guard does not terminate on every path')
        if outer_stop is not None and outer_stop in guard_nodes:
            raise PlantUMLRenderError(f'{node_id}: guard unexpectedly reaches outer join')
        self.lines.append(f"if ({_safe_text(node['label'])}) then ({_edge_label(guard)})")
        self._emit_path(str(guard['to']), None, active)
        self.lines.append(f"else ({_edge_label(continuation)})")
        self.lines.append('endif')
        self._emit_path(str(continuation['to']), outer_stop, active)


def compile_with_audit(detail):
    if detail.get('id') != 'SC-105':
        return official_compile(detail), None
    before = fingerprint(detail)
    compiler = SC105LayoutCompiler(detail)
    source = compiler.compile()
    expected_nodes = Counter(str(node['id']) for node in detail['flow_diagram']['nodes'])
    actual_nodes = Counter(compiler.node_emissions)
    expected_edges = Counter(fingerprint(edge) for edge in detail['flow_diagram']['edges'])
    actual_edges = Counter(fingerprint(edge) for edge in compiler.edge_emissions)
    if actual_nodes != expected_nodes or actual_edges != expected_edges or fingerprint(detail) != before:
        raise PlantUMLRenderError('SC-105 adapter changed graph facts or omitted/duplicated a node/edge')
    for node in detail['flow_diagram']['nodes']:
        if _safe_text(node['label']) not in source:
            raise PlantUMLRenderError(f"Missing SC-105 label: {node['id']}")
    for item in compiler.layout_mapping:
        for edge in item['branches']:
            if f"({edge['label']})" not in source:
                raise PlantUMLRenderError(f"Missing SC-105 branch: {edge['from']} -> {edge['to']}")
    audit = {
        'scenario_id': detail['id'],
        'source_sha256_before': before,
        'source_sha256_after': fingerprint(detail),
        'flow_graph_sha256': fingerprint(detail['flow_diagram']),
        'source_mutated': False,
        'all_nodes_emitted_exactly_once': actual_nodes == expected_nodes,
        'all_edges_consumed_exactly_once': actual_edges == expected_edges,
        'node_count': sum(expected_nodes.values()),
        'edge_count': sum(expected_edges.values()),
        'node_labels_and_lanes': [{'id': node['id'], 'lane_id': node['lane_id'], 'label': node['label']} for node in detail['flow_diagram']['nodes']],
        'edges': detail['flow_diagram']['edges'],
        'decision_label_mapping': compiler.layout_mapping,
        'puml_sha256': hashlib.sha256(source.encode()).hexdigest(),
        'note': 'Only the layout of four terminal branches is flattened. All text, lanes, edges and conditions originate from the unchanged scenario graph. Native SVG geometry is not touched.',
    }
    return source, audit


def compile_current_activity(detail):
    return compile_with_audit(detail)[0]
