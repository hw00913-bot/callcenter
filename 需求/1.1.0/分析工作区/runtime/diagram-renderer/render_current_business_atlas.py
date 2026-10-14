#!/usr/bin/env python3
"""Project-local replay entry for the explicit PlantUML glyph routing extension.

Keeps the installed toolkit read-only. Source JSON remains the only authority;
all local glyph, semantic, geometry and independent audits must pass before the
existing atlas is replaced. This entry does not approve a gate or browser QA.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import sys
import tempfile
import xml.etree.ElementTree as ET


def digest_file(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("project", type=Path)
    ap.add_argument("--skill-dir", type=Path,
                    default=Path.home() / ".codex/skills/requirement-analysis-loop")
    args = ap.parse_args()
    root = args.project.resolve()
    scripts = args.skill_dir.resolve() / "scripts"
    sys.path.insert(0, str(scripts))
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    import render_atlases as atlas
    import canonical_renderer as renderer
    import canonical_svg_qa as qa
    from business_diagrams import bind_business_svg, business_html_errors
    renderer.SKILL_SCRIPT_DIR = scripts

    index = atlas.load_json(root / "scenarios/scenario-index.json")
    extension_ids = {x["id"] for x in index["scenarios"]
                     if x.get("scope", "in_scope") == "in_scope"}
    flow_ids = {x["id"] for x in atlas.load_json(root / "memory/business-rules.json")["business_flows"]}
    expected_ids = extension_ids | flow_ids
    stock_render = atlas.render_plantuml_svg
    runtime = atlas.resolve_plantuml_runtime()
    original_path = root / "outputs/business-scenario-atlas.html"
    original_atlas = original_path.read_bytes()
    original_report_path = root / "runtime/plantuml-routing-replay-report.json"
    original_report = original_report_path.read_bytes() if original_report_path.exists() else None
    source_paths = [root / "memory/business-rules.json", root / "scenarios/scenario-index.json"]
    for item in atlas.load_json(root / "scenarios/scenario-index.json")["scenarios"]:
        source_paths.append(atlas.safe_path(root, item["file"]))
    dependency_paths = list(Path(__file__).parent.glob("*.py")) + list(Path(__file__).parent.glob("*.java"))
    dependency_paths += [scripts / n for n in ("render_atlases.py", "plantuml_renderer.py", "swimlane_layout.py")]
    before_hashes = {str(p): digest_file(p) for p in source_paths + dependency_paths}
    records = []

    def render(source, facts, local_runtime, kind="swimlane"):
        sid = facts["id"]
        if sid not in extension_ids:
            if sid not in flow_ids or kind != "business-process":
                raise RuntimeError("Unexpected formal diagram identity: " + sid)
            fresh = stock_render(source, facts, local_runtime, kind)
            records.append({"id": sid, "backend": "stock-local-plantuml",
                            "bound_svg_sha256": hashlib.sha256(fresh.encode()).hexdigest()})
            return fresh
        result = renderer.render_canonical_svg(facts)
        if not result["report"]["geometry_candidate_pass"] or result["report"]["geometry_problems"]:
            raise RuntimeError(sid + " producer geometry failed")
        svg = ET.fromstring(result["svg"])
        raw_engine_svg = result["raw_engine_svg"]
        inventory = result["inventory"]
        layout = result["layout"]
        svg.set("data-diagram-type", "swimlane")
        svg.set("data-renderer", "plantuml")
        svg.set("data-plantuml-render", "pass")
        svg.set("data-plantuml-render-method", "local-glyphs-canonical-routing")
        svg.attrib.pop("data-diagnostic-status", None)
        svg.set("data-plantuml-glyph-source-sha256", hashlib.sha256(
            raw_engine_svg.encode()).hexdigest())
        svg.set("data-plantuml-source-sha256", hashlib.sha256(result["compiled_source"].encode()).hexdigest())
        candidate = ET.tostring(svg, encoding="unicode")
        bound = bind_business_svg(candidate, facts)
        independent = qa.qa(facts, bound, inventory=inventory,
                             anchor_svg=result["original_anchor_svg"],
                             font_context={"puml": result["compiled_source"], "raw_engine_svg": raw_engine_svg})
        if not independent["pass"]:
            raise RuntimeError(sid + " independent QA failed: " + repr(independent["problems"]))
        records.append({"id": sid, "backend": renderer.BACKEND,
                        "metadata_coverage": result["report"]["metadata_coverage"],
                        "glyph_sizes_unchanged": True,
                        "producer_report": result["report"], "independent_qa": independent,
                        "width": layout["width"], "height": layout["height"],
                        "bound_svg_sha256": hashlib.sha256(bound.encode()).hexdigest()})
        return bound

    atlas.render_plantuml_svg = render
    # Current desktop atlas containment repair, retained as deterministic replay.
    atlas.BASE_CSS += "\n.atlas-desktop main,.atlas-desktop .card,.atlas-desktop .section,.atlas-desktop .diagram-versions,.atlas-desktop .diagram-version,.atlas-desktop .diagram-panel{min-width:0;max-width:100%}.atlas-desktop .diagram-versions{grid-template-columns:minmax(0,1fr)}.atlas-desktop .diagram{min-width:0;max-width:100%;box-sizing:border-box}\n"
    project = atlas.load_json(root / "runtime/loop-state.json")["project"]["name"]
    pending = {}
    original_write = atlas.write_text
    def hold_atlas(path, text):
        if Path(path) != original_path or pending:
            raise RuntimeError("Unexpected renderer output")
        pending["text"] = text
    atlas.write_text = hold_atlas
    output = atlas.render_scenarios(root, project, "compare", runtime)
    if {x["id"] for x in records} != expected_ids or len(records) != len(expected_ids):
        raise RuntimeError("Formal replay must cover exactly the current FLOW and in-scope SC diagrams")
    for sid in sorted(extension_ids):
        pattern = r'(<article\b[^>]*id="' + re.escape(sid) + r'".*?</article>)'
        # This is an honest visible description of the extended backend, not a new business requirement.
        old_caption = "纵向表示业务推进顺序，横向跨栏表示责任主体切换；PlantUML 模式由本地引擎生成并以内嵌 SVG 交付。"
        new_caption = "纵向表示业务推进顺序，横向跨栏表示责任主体切换。本图使用本地 PlantUML 字形，并按确认流程排布连线；交叉线不表示汇合，请沿箭头阅读。"
        def caption(match):
            card = match.group(1)
            if card.count(old_caption) != 1:
                raise RuntimeError("Required scenario caption was not uniquely located: " + sid)
            return card.replace(old_caption, new_caption)
        pending["text"], count = re.subn(pattern, caption, pending["text"], flags=re.S)
        if count != 1:
            raise RuntimeError("Required scenario card was not uniquely located: " + sid)
    with tempfile.TemporaryDirectory(prefix="callcenter-atlas-binding-") as td:
        check_root = Path(td).resolve()
        for relative in ["memory/business-rules.json", "scenarios/scenario-index.json"]:
            dest = check_root / relative
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(root / relative, dest)
        index = atlas.load_json(root / "scenarios/scenario-index.json")
        for item in index["scenarios"]:
            src = atlas.safe_path(root, item["file"])
            dest = atlas.safe_path(check_root, item["file"])
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(src, dest)
        dest = check_root / "outputs/business-scenario-atlas.html"
        dest.parent.mkdir(parents=True)
        dest.write_text(pending["text"])
        errors = business_html_errors(check_root)
        if errors:
            raise RuntimeError("Current business binding failed: " + repr(errors))
    atlas_bytes = pending["text"].encode()
    report = {"extension": renderer.BACKEND,
              "installed_toolkit_modified": False,
              "scope": sorted(extension_ids),
              "source_json_mutated": False,
              "local_plantuml_command": runtime.command,
              "diagram_records": records,
              "business_binding_errors": errors,
              "atlas_sha256": hashlib.sha256(atlas_bytes).hexdigest(),
              "source_files": {str(p.relative_to(root)): before_hashes[str(p)] for p in source_paths},
              "renderer_files": {p.name: digest_file(p) for p in dependency_paths if p.parent == Path(__file__).parent},
              "toolkit_sources": {n: digest_file(scripts / n) for n in
                                  ("render_atlases.py", "plantuml_renderer.py", "swimlane_layout.py")},
              "browser_visual_pass": False,
              "stage_or_gate_advanced": False}
    report_bytes = (json.dumps(report, ensure_ascii=False, indent=2) + "\n").encode()
    current_report = original_report_path.read_bytes() if original_report_path.exists() else None
    if (any(digest_file(Path(p)) != sha for p, sha in before_hashes.items())
            or original_path.read_bytes() != original_atlas or current_report != original_report):
        raise RuntimeError("Facts, dependencies or existing atlas changed during rendering")
    if output.is_symlink() or original_report_path.is_symlink():
        raise RuntimeError("Generated output paths cannot be symlinks")
    pending_files = []
    def staged(path, payload):
        with tempfile.NamedTemporaryFile(prefix=".routing-", dir=path.parent, delete=False) as handle:
            handle.write(payload)
            handle.flush()
            os.fsync(handle.fileno())
            temporary = Path(handle.name)
        pending_files.append(temporary)
        return temporary
    atlas_tmp = staged(output, atlas_bytes)
    report_tmp = staged(original_report_path, report_bytes)
    try:
        os.replace(atlas_tmp, output)
        os.replace(report_tmp, original_report_path)
    except Exception:
        os.replace(staged(output, original_atlas), output)
        if original_report is not None:
            os.replace(staged(original_report_path, original_report), original_report_path)
        raise
    finally:
        for p in pending_files:
            if p.exists():
                p.unlink()
    print(json.dumps({"output": str(output), "binding_errors": errors,
                      "extension_diagrams": sorted(extension_ids)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
