#!/usr/bin/env python3
"""Revalidate the actual current business atlas, including the local routing backend.

Run before S3 completion and before S8/global verification, G3 and packaging.
This does not approve business gates, real interfaces, or browser verification.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import re
import sys
import xml.etree.ElementTree as ET


def verify(root, scripts):
    sys.path.insert(0, str(scripts))
    sys.path.insert(0, str(Path(__file__).parent))
    import canonical_renderer as renderer
    import canonical_svg_qa as qa
    from business_diagrams import business_html_errors, content_hash
    from plantuml_renderer import compile_plantuml_business_flow, render_plantuml_svg
    from render_atlases import resolve_plantuml_runtime
    from loop import readiness_errors
    renderer.SKILL_SCRIPT_DIR = scripts
    errors = business_html_errors(root) + readiness_errors(root, "S3")
    atlas = root / "outputs/business-scenario-atlas.html"
    atlas_digest = hashlib.sha256(atlas.read_bytes()).hexdigest()
    all_svgs = re.findall(r"<svg\b.*?</svg\s*>", atlas.read_text(), re.S)
    records = []
    actual = {}
    index = json.loads((root / "scenarios/scenario-index.json").read_text())
    current = {x["id"]: x for x in index["scenarios"] if x.get("scope", "in_scope") == "in_scope"}
    flow_ids = {x["id"] for x in json.loads((root / "memory/business-rules.json").read_text())["business_flows"]}
    expected_ids = set(current) | flow_ids
    replay_path = root / "runtime/plantuml-routing-replay-report.json"
    replay_report = json.loads(replay_path.read_text())
    replay_digest = hashlib.sha256(replay_path.read_bytes()).hexdigest()
    if replay_report.get("atlas_sha256") != atlas_digest:
        errors.append("Atlas and replay report do not describe the same committed content")
    if set(replay_report.get("scope", [])) != set(current):
        errors.append("Replay report extension scope differs from current scenarios")
    if {x["id"] for x in replay_report.get("diagram_records", [])} != expected_ids:
        errors.append("Replay report diagram set differs from current source scope")
    expected_groups = {
        "source_files": {"memory/business-rules.json", "scenarios/scenario-index.json"}
                        | {x["file"] for x in index["scenarios"]},
        "renderer_files": {p.name for pattern in ("*.py", "*.java")
                           for p in Path(__file__).parent.glob(pattern)},
        "toolkit_sources": {"render_atlases.py", "plantuml_renderer.py", "swimlane_layout.py"},
    }
    dependency_snapshot = {}
    for group, base in (("source_files", root), ("renderer_files", Path(__file__).parent),
                        ("toolkit_sources", scripts)):
        if set(replay_report.get(group, {})) != expected_groups[group]:
            errors.append("Replay dependency inventory differs: " + group)
        for relative, expected in replay_report.get(group, {}).items():
            path = (base / relative).resolve()
            if not path.is_relative_to(base.resolve()) or not path.is_file():
                errors.append("Invalid replay dependency path: " + relative)
                continue
            if hashlib.sha256(path.read_bytes()).hexdigest() != expected:
                errors.append("Replay dependency changed: " + relative)
            dependency_snapshot[path] = hashlib.sha256(path.read_bytes()).hexdigest()
    for raw in all_svgs:
        svg = ET.fromstring(raw)
        if svg.get("data-renderer") != "plantuml":
            continue
        sid = svg.get("data-source-id")
        if sid in actual:
            errors.append("Duplicate formal diagram " + str(sid))
        actual[sid] = raw
    if set(actual) != expected_ids:
        errors.append("Formal diagram set differs from current source scope")
    for sid, entry in current.items():
        source_path = root / entry["file"]
        if source_path.resolve().parent != (root / "scenarios").resolve():
            raise RuntimeError("Unexpected scenario source path")
        source = json.loads(source_path.read_text())
        result = renderer.render_canonical_svg(source)
        if sid not in actual:
            errors.append("Missing extended formal diagram " + sid)
            continue
        report = qa.qa(source, actual[sid], inventory=result["inventory"],
                       anchor_svg=result["original_anchor_svg"],
                       font_context={"puml": result["compiled_source"], "raw_engine_svg": result["raw_engine_svg"]})
        if not report["pass"]:
            errors.extend(sid + ": " + str(x) for x in report["problems"])
        svg = ET.fromstring(actual[sid])
        source_digest = hashlib.sha256(result["compiled_source"].encode()).hexdigest()
        if svg.get("data-plantuml-source-sha256") != source_digest:
            errors.append(sid + " compiled-source hash changed")
        records.append({"id": sid, "qa": report,
                        "actual_svg_sha256": hashlib.sha256(actual[sid].encode()).hexdigest(),
                        "current_source_sha256": hashlib.sha256(source_path.read_bytes()).hexdigest(),
                        "compiled_source_sha256": source_digest,
                        "raw_engine_sha256": hashlib.sha256(result["raw_engine_svg"].encode()).hexdigest()})
    for sid, raw in actual.items():
        svg = ET.fromstring(raw)
        if sid not in current and svg.get("data-renderer-backend"):
            errors.append("Unexpected extension scope " + sid)
    # FLOW sources are simple ordered chains; reproduce the actual local engine
    # output too, rather than relying only on their fact/content binding.
    runtime = resolve_plantuml_runtime()
    for flow in json.loads((root / "memory/business-rules.json").read_text())["business_flows"]:
        sid = flow["id"]
        if sid not in actual:
            continue
        compiled = compile_plantuml_business_flow(flow)
        fresh = render_plantuml_svg(compiled, flow, runtime, "business-process")
        if content_hash(ET.fromstring(fresh)) != content_hash(ET.fromstring(actual[sid])):
            errors.append(sid + " actual stock SVG differs from current local engine replay")
        records.append({"id": sid, "backend": "stock-local-plantuml",
                        "actual_svg_sha256": hashlib.sha256(actual[sid].encode()).hexdigest(),
                        "compiled_source_sha256": hashlib.sha256(compiled.encode()).hexdigest(),
                        "local_engine_content_replayed": True})
    if (hashlib.sha256(atlas.read_bytes()).hexdigest() != atlas_digest
            or hashlib.sha256(replay_path.read_bytes()).hexdigest() != replay_digest
            or any(hashlib.sha256(p.read_bytes()).hexdigest() != value
                   for p, value in dependency_snapshot.items())):
        errors.append("Atlas, report, source or dependency changed during verification")
    return {"pass": not errors, "errors": errors, "formal_diagrams": len(actual),
            "extended_backend": renderer.BACKEND, "extension_records": records,
            "atlas_sha256": atlas_digest,
            "browser_visual_pass": False, "gate_approval": False}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("project", type=Path)
    ap.add_argument("--skill-dir", type=Path,
                    default=Path.home() / ".codex/skills/requirement-analysis-loop")
    ap.add_argument("--record", action="store_true")
    args = ap.parse_args()
    root = args.project.resolve()
    if args.record:
        state = json.loads((root / "runtime/loop-state.json").read_text())
        stage = state["run"]["current_stage"]
        if stage not in ("S3", "S8") or state["stages"][stage]["status"] != "in_progress":
            raise RuntimeError("Recording requires the matching S3 or S8 stage in progress")
    report = verify(root, args.skill_dir.resolve() / "scripts")
    if args.record:
        (root / "runtime/plantuml-routing-verification.json").write_text(
            json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({"pass": report["pass"], "errors": report["errors"],
                      "formal_diagrams": report["formal_diagrams"],
                      "browser_visual_pass": False}, ensure_ascii=False))
    return 0 if report["pass"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
