"""Use the official renderer with project-local reading/layout corrections.

The source skill is read-only. Geometry, factual fingerprints and SVG rendering
remain source-bound. Prevent a grid item's intrinsic SVG width from pushing the
toolbar and the entire document outside the viewport; scroll only the diagram.
"""
import importlib.util
import inspect
import sys
import textwrap
from html import escape
from pathlib import Path

scripts = Path('/Users/huhaowen/.codex/skills/requirement-analysis-loop/scripts')
sys.path.insert(0, str(scripts))
spec = importlib.util.spec_from_file_location('current_atlas_renderer', scripts / 'render_atlases.py')
renderer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(renderer)
layout_spec = importlib.util.spec_from_file_location('current_flow_layout', Path(__file__).with_name('sc105_plantuml_layout.py'))
layout_module = importlib.util.module_from_spec(layout_spec)
layout_spec.loader.exec_module(layout_module)
renderer.compile_plantuml_activity = layout_module.compile_current_activity

# The installed renderer clips native labels to three lines and uses fixed
# node heights. Keep its collision-aware router, but size each node from the
# exact, untruncated lines rendered below. The installed skill stays untouched.
def current_lines(value, width):
    return [line for paragraph in str(value or '').split('\n')
            for line in (textwrap.wrap(paragraph, width=width,
                                       break_long_words=True,
                                       break_on_hyphens=False) or [''])]


def current_node_size(raw):
    kind = raw.get('type', 'action')
    wrap_width = 12 if kind in {'start', 'end', 'decision'} else 15
    font_size = 11 if kind == 'decision' else 12
    line_count = len(current_lines(raw.get('label', raw['id']), wrap_width))
    text_width = wrap_width * font_size
    text_height = line_count * 14
    if kind == 'decision':
        # Fit the full text into the diamond's central inscribed rectangle.
        return 2 * (text_width + 20), 2 * (text_height + 20)
    return text_width + 32, max(42, text_height + 20)


def current_svg_text(x, y, label, width=14, color='#172033', size=12):
    lines = current_lines(label, width)
    start_y = y - (len(lines) - 1) * 7
    spans = ''.join(f'<tspan x="{x}" y="{start_y + i * 14}">{escape(line)}</tspan>'
                    for i, line in enumerate(lines))
    return (f'<text x="{x}" y="{y}" text-anchor="middle" font-size="{size}" '
            f'fill="{color}">{spans}</text>')


native_layout_spec = importlib.util.spec_from_file_location(
    'current_native_flow_layout', scripts / 'swimlane_layout.py')
native_layout = importlib.util.module_from_spec(native_layout_spec)
native_layout_spec.loader.exec_module(native_layout)
layout_source = inspect.getsource(native_layout.build_swimlane_layout)
fixed_size_line = 'width, height = NODE_SIZES.get(node_type, NODE_SIZES["action"])'
if layout_source.count(fixed_size_line) != 1:
    raise RuntimeError('Official native node sizing changed; re-review this wrapper.')
native_layout.current_node_size = current_node_size
exec(compile(layout_source.replace(fixed_size_line, 'width, height = current_node_size(raw)'),
             str(Path(__file__)) + '#source-bound-native-sizing', 'exec'), vars(native_layout))
renderer.build_swimlane_layout = native_layout.build_swimlane_layout
renderer.svg_text = current_svg_text

# All three atlas kinds share the same wide desktop reading policy. In
# particular the page tree must not inherit the narrow document+sidebar shell:
# its SVG keeps its natural readable width and the directory starts collapsed.
original_page_shell = renderer.page_shell


def current_page_shell(title, project, records, body, desktop=False):
    return original_page_shell(title, project, records, body, desktop=True)


renderer.page_shell = current_page_shell
renderer.BASE_CSS += '''
/* Project-local reading fix: keep the toolbar inside the viewport. */
.diagram-versions{grid-template-columns:minmax(0,1fr)}
.diagram-version,.diagram-panel,.diagram{min-width:0;max-width:100%}
.diagram-panel.atlas-expanded{position:fixed;inset:0;z-index:9999;margin:0;
  width:100vw;height:100vh;max-width:none;background:#fff;padding:16px;
  display:flex;flex-direction:column;overflow:hidden}
.atlas-expanded .diagram-toolbar{flex:none;background:#fff}
.atlas-expanded .diagram{flex:1;min-height:0;overflow:auto}
body.atlas-focus-open{overflow:hidden}
'''
original_fullscreen = '''    if (document.fullscreenElement === panel && document.exitFullscreen) document.exitFullscreen();
    else if (panel.requestFullscreen) panel.requestFullscreen().catch(() => { status.textContent = "全屏未开启，可继续缩放或使用浏览器全屏。"; });
    else status.textContent = "当前环境不支持全屏，可继续缩放或使用浏览器全屏。";'''
expanded_reading = '''    const expanded = panel.classList.toggle("atlas-expanded");
    document.body.classList.toggle("atlas-focus-open", expanded);
    button.textContent = expanded ? "退出全屏" : "全屏";
    button.setAttribute("aria-label", expanded ? "退出图集全屏" : "全屏查看流程图");
    status.textContent = expanded ? "页面内全屏 · Esc 退出" : "";
    if (panel.dataset.viewMode === "fit") fitWidth(panel);'''
if original_fullscreen not in renderer.PAGE_SCRIPT:
    raise RuntimeError('Official fullscreen handler changed; re-review this wrapper.')
renderer.PAGE_SCRIPT = renderer.PAGE_SCRIPT.replace(original_fullscreen, expanded_reading)
original_readable = '''  if (action === "readable") {
    delete panel.dataset.scale;
    panel.dataset.viewMode = "readable";
    svg.style.width = "";
    svg.style.height = "";
    svg.style.minWidth = "";
    svg.style.maxWidth = "";
  }'''
if original_readable not in renderer.PAGE_SCRIPT:
    raise RuntimeError('Official readable handler changed; re-review this wrapper.')
renderer.PAGE_SCRIPT = renderer.PAGE_SCRIPT.replace(original_readable, '  if (action === "readable") applyScale(panel, 1, "readable");')
renderer.PAGE_SCRIPT += '''
document.addEventListener("keydown", function(event) {
  if (event.key !== "Escape") return;
  const panel = document.querySelector(".diagram-panel.atlas-expanded");
  if (panel) panel.querySelector('[data-diagram-action="fullscreen"]').click();
});
'''
if __name__ == '__main__':
    raise SystemExit(renderer.main())
