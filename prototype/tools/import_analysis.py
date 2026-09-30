#!/usr/bin/env python3
"""Verify and import a frozen requirement-analysis baseline into a prototype project."""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from datetime import datetime
from html import escape as html_escape
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import sys
import tempfile
from typing import Any, Callable
import zipfile


CONTRACT = {"name": "requirement-analysis-to-prototype", "version": "1.0"}
ANALYSIS_WORKFLOW_VERSION = "stories-flows-interfaces-sequences-pages-features@1"
MAX_FILES = 5000
MAX_TOTAL_BYTES = 200 * 1024 * 1024
ALLOWED_IMPORT_STAGES = {"s0", "s1", "s2"}
REQUIRED_ENTRYPOINTS = {
    "normalized_user_stories",
    "scenario_index",
    "sequence_index",
    "interface_index",
    "project_facts",
    "business_rules",
    "feature_list",
    "page_index",
    "traceability",
    "open_items",
    "verification_report",
    "business_scenario_atlas",
    "interaction_sequence_atlas",
    "interface_verification_matrix",
    "product_baseline",
    "feature_list_view",
    "page_planning",
}


class ImportError(RuntimeError):
    pass


def now() -> str:
    return datetime.now().astimezone().isoformat(timespec="seconds")


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def canonical_hash(value: Any) -> str:
    data = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return sha256_bytes(data)


def load_json_bytes(data: bytes, label: str) -> dict[str, Any]:
    try:
        value = json.loads(data.decode("utf-8-sig"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise ImportError(f"{label} 不是有效 UTF-8 JSON：{exc}") from exc
    if not isinstance(value, dict):
        raise ImportError(f"{label} 顶层必须是对象")
    return value


def read_json(path: Path) -> dict[str, Any]:
    try:
        return load_json_bytes(path.read_bytes(), str(path))
    except FileNotFoundError as exc:
        raise ImportError(f"缺少文件：{path}") from exc


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(value, ensure_ascii=False, indent=2) + "\n"
    fd, temp_name = tempfile.mkstemp(dir=str(path.parent), prefix=path.name + ".", suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            handle.write(payload)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temp_name, path)
    finally:
        if os.path.exists(temp_name):
            os.unlink(temp_name)


def write_text(path: Path, value: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if not value.endswith("\n"):
        value += "\n"
    path.write_text(value, encoding="utf-8")


def safe_archive_path(raw: str) -> str:
    if not isinstance(raw, str) or not raw.strip() or "\\" in raw or "\x00" in raw:
        raise ImportError(f"交付包包含不安全路径：{raw!r}")
    path = PurePosixPath(raw)
    if path.is_absolute() or any(part in {"", ".", ".."} for part in path.parts):
        raise ImportError(f"交付包包含不安全路径：{raw!r}")
    normalized = path.as_posix()
    if normalized != raw:
        raise ImportError(f"交付包路径未规范化：{raw!r}")
    return normalized


def safe_project_relative(project: Path, raw: str) -> Path:
    normalized = safe_archive_path(raw)
    candidate = (project / normalized).resolve()
    try:
        candidate.relative_to(project.resolve())
    except ValueError as exc:
        raise ImportError(f"项目相对路径越界：{raw}") from exc
    return candidate


@dataclass
class VerifiedPackage:
    manifest: dict[str, Any]
    handoff: dict[str, Any]
    manifest_bytes: bytes
    payloads: dict[str, bytes]
    source: str

    @property
    def manifest_sha256(self) -> str:
        return sha256_bytes(self.manifest_bytes)

    @property
    def baseline_id(self) -> str:
        return str(self.handoff["baseline"]["id"])

    @property
    def fingerprint(self) -> str:
        return str(self.handoff["baseline"]["fingerprint"])


def package_reader(package: Path) -> tuple[Callable[[str], bytes], set[str], Callable[[], None]]:
    package = package.expanduser().resolve()
    if package.is_dir():
        def read(relative: str) -> bytes:
            path = safe_project_relative(package, relative)
            try:
                return path.read_bytes()
            except FileNotFoundError as exc:
                raise ImportError(f"交付目录缺少文件：{relative}") from exc

        names = {
            path.relative_to(package).as_posix()
            for path in package.rglob("*")
            if path.is_file()
        }
        return read, names, lambda: None
    if not package.is_file():
        raise ImportError(f"交付包不存在：{package}")
    if not zipfile.is_zipfile(package):
        raise ImportError(f"只支持冻结 ZIP 或已解压目录：{package}")
    archive = zipfile.ZipFile(package, "r")
    infos = [info for info in archive.infolist() if not info.is_dir()]
    if len(infos) > MAX_FILES:
        archive.close()
        raise ImportError(f"交付包文件过多：{len(infos)} > {MAX_FILES}")
    total = sum(info.file_size for info in infos)
    if total > MAX_TOTAL_BYTES:
        archive.close()
        raise ImportError(f"交付包解压后过大：{total} bytes")
    names: set[str] = set()
    for info in infos:
        name = safe_archive_path(info.filename)
        if name in names:
            archive.close()
            raise ImportError(f"交付包存在重复路径：{name}")
        names.add(name)
        unix_mode = (info.external_attr >> 16) & 0o170000
        if unix_mode == 0o120000:
            archive.close()
            raise ImportError(f"交付包不允许符号链接：{name}")

    def read(relative: str) -> bytes:
        try:
            return archive.read(relative)
        except KeyError as exc:
            raise ImportError(f"交付包缺少文件：{relative}") from exc

    return read, names, archive.close


def entrypoint_path(handoff: dict[str, Any], name: str) -> str:
    entry = handoff.get("entrypoints", {}).get(name)
    if not isinstance(entry, dict):
        raise ImportError(f"原型交接契约缺少入口：{name}")
    path = entry.get("path")
    return safe_archive_path(str(path or ""))


def derive_id_catalog(payloads: dict[str, bytes], handoff: dict[str, Any]) -> dict[str, list[str]]:
    def entry_json(name: str) -> dict[str, Any]:
        relative = entrypoint_path(handoff, name)
        if relative not in payloads:
            raise ImportError(f"无法从交付内容读取 ID 目录入口：{name}")
        return load_json_bytes(payloads[relative], relative)

    stories = entry_json("normalized_user_stories").get("user_stories", [])
    scenarios = entry_json("scenario_index").get("scenarios", [])
    sequences = entry_json("sequence_index").get("sequences", [])
    interfaces = entry_json("interface_index").get("interfaces", [])
    features = entry_json("feature_list").get("features", [])
    pages = entry_json("page_index").get("pages", [])

    def ids(items: Any) -> list[str]:
        return sorted({str(item.get("id")) for item in items if isinstance(item, dict) and item.get("id")}) if isinstance(items, list) else []

    acceptance_ids = sorted({
        str(criteria.get("id"))
        for story in stories if isinstance(story, dict)
        for criteria in story.get("acceptance_criteria", [])
        if isinstance(criteria, dict) and criteria.get("id")
    }) if isinstance(stories, list) else []
    in_scope_stories = [story for story in stories if isinstance(story, dict) and story.get("status", "in_scope") == "in_scope"] if isinstance(stories, list) else []
    required_acceptance_ids = sorted({
        str(criteria.get("id"))
        for story in in_scope_stories
        for criteria in story.get("acceptance_criteria", [])
        if isinstance(criteria, dict) and criteria.get("id")
    })
    action_ids = sorted({
        str(action.get("id"))
        for page in pages if isinstance(page, dict)
        for action in page.get("actions", [])
        if isinstance(action, dict) and action.get("id")
    }) if isinstance(pages, list) else []
    return {
        "user_story_ids": ids(stories),
        "in_scope_user_story_ids": ids(in_scope_stories),
        "acceptance_ids": acceptance_ids,
        "required_acceptance_ids": required_acceptance_ids,
        "scenario_ids": ids(scenarios),
        "in_scope_scenario_ids": ids([
            item for item in scenarios
            if isinstance(item, dict) and item.get("scope", "in_scope") == "in_scope"
        ]),
        "sequence_ids": ids(sequences),
        "interface_ids": ids(interfaces),
        "feature_ids": ids(features),
        "page_ids": ids(pages),
        "action_ids": action_ids,
    }


def verify_package(package: Path, *, strict_zip_contents: bool = True) -> VerifiedPackage:
    read, names, close = package_reader(package)
    try:
        manifest_bytes = read("delivery-manifest.json")
        manifest = load_json_bytes(manifest_bytes, "delivery-manifest.json")
        if manifest.get("schema_version") != "1.1":
            raise ImportError("delivery-manifest.json schema_version 必须为 1.1")
        if manifest.get("handoff_contract") != CONTRACT:
            raise ImportError("交付清单的 handoff_contract 不受支持")
        entries = manifest.get("files")
        if not isinstance(entries, list) or not entries:
            raise ImportError("交付清单 files 必须是非空数组")
        if len(entries) > MAX_FILES:
            raise ImportError(f"交付清单文件过多：{len(entries)} > {MAX_FILES}")

        payloads: dict[str, bytes] = {}
        normalized_entries: list[dict[str, Any]] = []
        declared: set[str] = set()
        total = 0
        for entry in entries:
            if not isinstance(entry, dict):
                raise ImportError("交付清单 files[] 必须是对象")
            relative = safe_archive_path(str(entry.get("path") or ""))
            if relative == "delivery-manifest.json" or relative in declared:
                raise ImportError(f"交付清单存在重复或保留路径：{relative}")
            declared.add(relative)
            data = read(relative)
            expected_bytes = entry.get("bytes")
            expected_hash = str(entry.get("sha256") or "")
            if not isinstance(expected_bytes, int) or expected_bytes < 0:
                raise ImportError(f"交付清单 bytes 不合法：{relative}")
            if len(data) != expected_bytes:
                raise ImportError(f"文件大小校验失败：{relative}")
            if not re.fullmatch(r"[0-9a-f]{64}", expected_hash) or sha256_bytes(data) != expected_hash:
                raise ImportError(f"SHA-256 校验失败：{relative}")
            total += len(data)
            if total > MAX_TOTAL_BYTES:
                raise ImportError(f"交付包校验内容过大：{total} bytes")
            payloads[relative] = data
            normalized_entries.append({"path": relative, "bytes": expected_bytes, "sha256": expected_hash})

        if strict_zip_contents and package.is_file():
            extras = names - declared - {"delivery-manifest.json"}
            missing = declared - names
            if extras:
                raise ImportError("交付包包含清单外文件：" + ", ".join(sorted(extras)[:10]))
            if missing:
                raise ImportError("交付包缺少清单文件：" + ", ".join(sorted(missing)[:10]))

        if "prototype-handoff.json" not in payloads:
            raise ImportError("交付清单未包含 prototype-handoff.json")
        handoff = load_json_bytes(payloads["prototype-handoff.json"], "prototype-handoff.json")
        if handoff.get("schema_version") != "1.0" or handoff.get("contract") != CONTRACT:
            raise ImportError("prototype-handoff.json 契约名称或版本不受支持")
        baseline = handoff.get("baseline")
        if not isinstance(baseline, dict) or not baseline.get("id") or not baseline.get("fingerprint"):
            raise ImportError("prototype-handoff.json 缺少 baseline.id 或 baseline.fingerprint")
        if manifest.get("baseline_id") != baseline.get("id"):
            raise ImportError("交付清单与交接契约的 baseline_id 不一致")
        if manifest.get("baseline_fingerprint") != baseline.get("fingerprint"):
            raise ImportError("交付清单与交接契约的 baseline_fingerprint 不一致")

        gates = handoff.get("gates")
        if not isinstance(gates, dict):
            raise ImportError("prototype-handoff.json 缺少 gates")
        for gate_id in ("G1", "G2", "G3"):
            if not isinstance(gates.get(gate_id), dict) or gates[gate_id].get("status") != "approved":
                raise ImportError(f"需求分析门禁 {gate_id} 未批准")
        verification = handoff.get("verification")
        if not isinstance(verification, dict) or verification.get("status") != "pass":
            raise ImportError("需求分析全局核验未通过")
        if manifest.get("verification_status") != "pass":
            raise ImportError("交付清单 verification_status 不是 pass")

        entrypoints = handoff.get("entrypoints")
        if not isinstance(entrypoints, dict):
            raise ImportError("prototype-handoff.json 缺少 entrypoints")
        workflow_version = handoff.get("analysis_workflow_version")
        if workflow_version is not None and workflow_version != ANALYSIS_WORKFLOW_VERSION:
            raise ImportError("不支持的需求分析生成顺序版本")
        required = REQUIRED_ENTRYPOINTS | ({"page_structure_atlas"} if workflow_version else set())
        missing_entrypoints = required - set(entrypoints)
        if missing_entrypoints:
            raise ImportError("prototype-handoff.json 缺少必要入口：" + ", ".join(sorted(missing_entrypoints)))
        for name in entrypoints:
            relative = entrypoint_path(handoff, name)
            if relative not in declared:
                raise ImportError(f"交接入口未纳入交付清单：{name} -> {relative}")
            if name in (required | {"page_structure_atlas"}) and relative.startswith("inputs/"):
                raise ImportError(f"原始输入不能作为原型事实/视图入口：{name}；请回到需求分析 Loop 冻结结论")
        if "source_index" in entrypoints and entrypoints["source_index"].get("role") != "provenance_only":
            raise ImportError("source_index 只能作为 provenance_only 来源元数据入口")
        consumer_rules = handoff.get("consumer_rules", {})
        if not isinstance(consumer_rules, dict):
            raise ImportError("consumer_rules 必须为对象")
        if consumer_rules.get("llm_wiki_consumed_by", "requirement-analysis-loop") != "requirement-analysis-loop":
            raise ImportError("LLM Wiki 只能由需求分析 Loop 消费")
        if consumer_rules.get("raw_inputs_are_audit_only", True) is not True:
            raise ImportError("原始输入只能作为审计证据，不能供原型重新提取事实")

        derived_catalog = derive_id_catalog(payloads, handoff)
        if handoff.get("id_catalog") != derived_catalog:
            raise ImportError("prototype-handoff.json 的 id_catalog 与冻结事实文件不一致")
        for key, prefix in (("required_acceptance_ids", "AC"), ("feature_ids", "FUNC"), ("page_ids", "PAGE"), ("action_ids", "ACTION")):
            values = derived_catalog[key]
            if key in {"required_acceptance_ids", "feature_ids"} and not values:
                raise ImportError(f"原型交接缺少必要 ID：{key}")
            if any(not re.fullmatch(rf"{prefix}-\d{{3,}}", value) for value in values):
                raise ImportError(f"原型交接包含非法 {prefix} ID")

        report_path = entrypoint_path(handoff, "verification_report")
        report = load_json_bytes(payloads[report_path], report_path)
        if report.get("status") != "pass":
            raise ImportError("交付包内 verification-report.json 不是 pass")

        semantic_entries = sorted(
            (entry for entry in normalized_entries if entry["path"] != "prototype-handoff.json"),
            key=lambda entry: entry["path"],
        )
        expected_fingerprint = canonical_hash({"project": handoff.get("project", {}), "files": semantic_entries})
        if baseline.get("fingerprint") != expected_fingerprint:
            raise ImportError("需求分析基线指纹无法由交付文件重算")
        if manifest.get("project") != handoff.get("project"):
            raise ImportError("交付清单与交接契约的项目信息不一致")
        return VerifiedPackage(manifest, handoff, manifest_bytes, payloads, str(package))
    finally:
        close()


def slug(value: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9._-]+", "-", value).strip("-_.")
    return cleaned or "analysis-baseline"


def workflow_state(project: Path) -> tuple[str, bool]:
    workflow = read_json(project / "config" / "workflow.json")
    stage = str(workflow.get("stage") or "").strip().lower()
    iteration = workflow.get("currentIteration") if isinstance(workflow.get("currentIteration"), dict) else {}
    return stage, iteration.get("planConfirmed") is True


def imported_config(project: Path) -> dict[str, Any]:
    path = project / "config" / "requirement-analysis.json"
    return read_json(path) if path.exists() else {}


def baseline_root(project: Path, config: dict[str, Any]) -> Path:
    relative = str(config.get("baselineRoot") or "")
    if not relative:
        raise ImportError("config/requirement-analysis.json 缺少 baselineRoot")
    return safe_project_relative(project, relative)


def make_baseline_files_read_only(root: Path) -> None:
    """Discourage accidental edits; hash checks remain the actual integrity gate."""
    for path in root.rglob("*"):
        if path.is_file() and not path.is_symlink():
            path.chmod(path.stat().st_mode & ~0o222)


def verify_imported_project(project: Path) -> VerifiedPackage:
    config = imported_config(project)
    if config.get("mode") != "imported" or config.get("status") != "verified":
        raise ImportError("项目没有已验证的需求分析基线")
    root = baseline_root(project, config)
    verified = verify_package(root, strict_zip_contents=False)
    if verified.manifest_sha256 != config.get("manifestSha256"):
        raise ImportError("已导入基线的 manifest SHA-256 与配置不一致")
    if verified.baseline_id != config.get("baselineId"):
        raise ImportError("已导入基线 ID 与配置不一致")
    if verified.fingerprint != config.get("baselineFingerprint"):
        raise ImportError("已导入基线指纹与配置不一致")
    return verified


def write_import_summary(project: Path, verified: VerifiedPackage, config: dict[str, Any]) -> None:
    gates = verified.handoff["gates"]
    risks = verified.handoff.get("accepted_risks", [])
    lines = [
        "# 需求分析基线导入",
        "",
        f"- Baseline ID: `{verified.baseline_id}`",
        f"- Baseline fingerprint: `{verified.fingerprint}`",
        f"- Manifest SHA-256: `{verified.manifest_sha256}`",
        f"- Contract: `{CONTRACT['name']}@{CONTRACT['version']}`",
        f"- Project: {verified.handoff.get('project', {}).get('name', '未命名项目')}",
        f"- Version: {verified.handoff.get('project', {}).get('version', 'unknown')}",
        f"- Frozen at: {verified.handoff.get('baseline', {}).get('frozen_at', 'unknown')}",
        f"- Imported at: {config.get('importedAt')}",
        "- Fact policy: 业务范围、功能清单、规则、接口结论和页面规划按冻结事实只读消费；展示决策可在原型 Loop 内补充。",
        "- Wiki policy: LLM Wiki 只在需求分析 Loop 消费；原型不查询知识库、不读取 query/loop-context 正文。来源元数据只作追溯，原始证据只供脚本核验完整性。",
        "",
        "## Upstream Gates",
        "",
        "| Gate | Status | Approved By | Approved At | Note |",
        "| --- | --- | --- | --- | --- |",
    ]
    for gate_id in ("G1", "G2", "G3"):
        gate = gates[gate_id]
        lines.append(
            f"| {gate_id} | {gate.get('status')} | {md(gate.get('approved_by'))} | "
            f"{md(gate.get('approved_at'))} | {md(gate.get('note'))} |"
        )
    lines.extend(["", "## Accepted Risks", ""])
    if risks:
        for risk in risks:
            lines.append(f"- `{risk.get('id')}` {risk.get('summary') or '已接受风险'}；关联：{', '.join(risk.get('related_ids', [])) or 'none'}")
    else:
        lines.append("- No accepted risks recorded in the frozen baseline.")
    write_text(project / "memory" / "requirement-analysis-import.md", "\n".join(lines))


def import_package(project: Path, package: Path) -> VerifiedPackage:
    project = project.expanduser().resolve()
    if not project.is_dir():
        raise ImportError(f"原型项目目录不存在：{project}")
    stage, confirmed = workflow_state(project)
    existing = imported_config(project)
    verified = verify_package(package)
    if existing.get("manifestSha256") == verified.manifest_sha256:
        verify_imported_project(project)
        print(f"需求分析基线已存在且校验通过：{verified.baseline_id}")
        return verified
    if stage not in ALLOWED_IMPORT_STAGES or confirmed:
        raise ImportError("新需求分析基线只能在原型 S0/S1/S2 且计划批准前导入；范围变化需开启新一轮原型 Loop")

    root_relative = Path("inputs") / "requirement-analysis" / slug(verified.baseline_id)
    destination = project / root_relative
    destination.parent.mkdir(parents=True, exist_ok=True)
    if destination.exists():
        existing_package = verify_package(destination, strict_zip_contents=False)
        if existing_package.manifest_sha256 != verified.manifest_sha256:
            raise ImportError(f"同名基线目录已存在且内容不同：{destination}")
    else:
        staging = Path(tempfile.mkdtemp(prefix=destination.name + ".", dir=str(destination.parent)))
        try:
            (staging / "delivery-manifest.json").write_bytes(verified.manifest_bytes)
            for relative, data in verified.payloads.items():
                output = safe_project_relative(staging, relative)
                output.parent.mkdir(parents=True, exist_ok=True)
                output.write_bytes(data)
            verify_package(staging, strict_zip_contents=False)
            staging.replace(destination)
        finally:
            if staging.exists():
                shutil.rmtree(staging)
    make_baseline_files_read_only(destination)

    config = {
        "schemaVersion": 1,
        "mode": "imported",
        "status": "verified",
        "baselineId": verified.baseline_id,
        "baselineRoot": root_relative.as_posix(),
        "manifestSha256": verified.manifest_sha256,
        "baselineFingerprint": verified.fingerprint,
        "handoffContract": CONTRACT,
        "project": verified.handoff.get("project", {}),
        "importedAt": now(),
        "materializedAt": None,
        "materializedManifestSha256": None,
        "diagramPublication": None,
    }
    write_json(project / "config" / "requirement-analysis.json", config)
    write_import_summary(project, verified, config)
    print(f"已导入需求分析冻结基线：{verified.baseline_id}")
    print(f"基线目录：{root_relative.as_posix()}")
    return verified


def md(value: Any) -> str:
    if value is None or value == "":
        return "none"
    if isinstance(value, (list, dict)):
        value = json.dumps(value, ensure_ascii=False, sort_keys=True)
    return str(value).replace("|", "\\|").replace("\n", "<br>")


def load_entry_json(root: Path, handoff: dict[str, Any], name: str) -> dict[str, Any]:
    return read_json(root / entrypoint_path(handoff, name))


def item_names(items: Any, key: str = "name") -> list[str]:
    if not isinstance(items, list):
        return []
    return [str(item.get(key)) for item in items if isinstance(item, dict) and item.get(key)]


def frozen_context_lines(verified: VerifiedPackage, config: dict[str, Any], facts: dict[str, Any]) -> list[str]:
    """Keep basic facts and scoped diagram/sequence inputs discoverable from memory."""
    lines = [
        "", "## 基础确认事实与上游状态", "",
        "以下内容由冻结 project_facts 原样物化；字段中的假设、缺口或风险状态不因导入而升级。", "",
        "| 事实类别 | 冻结记录 |", "| --- | --- |",
    ]
    for key, label in (("actors", "角色与职责"), ("systems", "系统与责任边界"),
                       ("product_structure", "产品结构"), ("state_models", "状态与转换")):
        records = facts.get(key, [])
        if not isinstance(records, list):
            raise ImportError(f"冻结 project_facts.{key} 必须为数组")
        if records:
            lines.extend(f"| {label} | {md(record)} |" for record in records)
        else:
            lines.append(f"| {label} | 冻结基线未单列；不自行补写 |")
    lines.extend([
        "", "## 完整冻结输入入口", "",
        "路径相对于原型项目根目录。结构化事实约束实现，Markdown/HTML 用于对照确认与图集复用；本记忆摘要不替代这些入口。", "",
        "| Entry | Role | Frozen Path |", "| --- | --- | --- |",
    ])
    context_entries = REQUIRED_ENTRYPOINTS | ({"page_structure_atlas"} if "page_structure_atlas" in verified.handoff["entrypoints"] else set())
    for name in sorted(context_entries):
        relative = entrypoint_path(verified.handoff, name)
        role = verified.handoff["entrypoints"][name].get("role")
        lines.append(f"| {name} | {md(role)} | {md(config['baselineRoot'])}/{md(relative)} |")
    lines.extend([
        "", "## 场景与交互时序定位", "",
        "S6/S7/S8 按相关 ID 读取下列冻结明细与图集，落实消息顺序、回调和异常分支；不是只发布图页。", "",
        "| ID | Name | Scenario | Frozen Detail |", "| --- | --- | --- | --- |",
    ])
    for entry_name, collection in (("scenario_index", "scenarios"), ("sequence_index", "sequences")):
        relative = entrypoint_path(verified.handoff, entry_name)
        index = load_json_bytes(verified.payloads[relative], relative)
        records = index.get(collection, [])
        if not isinstance(records, list):
            raise ImportError(f"冻结 {entry_name}.{collection} 必须为数组")
        for record in records:
            if not isinstance(record, dict):
                raise ImportError(f"冻结 {entry_name} 包含非对象记录")
            if collection == "scenarios" and record.get("scope", "in_scope") != "in_scope":
                continue
            detail = safe_archive_path(str(record.get("file") or ""))
            if detail.startswith("inputs/") or detail not in verified.payloads:
                raise ImportError(f"{record.get('id')} 明细必须是 manifest 保护的结构化事实，不能指向原始输入：{detail}")
            scenario_id = record.get("scenario_id") if collection == "sequences" else record.get("id")
            lines.append(f"| {md(record.get('id'))} | {md(record.get('name'))} | {md(scenario_id)} | {md(config['baselineRoot'])}/{md(detail)} |")
    return lines


def materialize_project_memory(project: Path) -> None:
    project = project.expanduser().resolve()
    stage, confirmed = workflow_state(project)
    if stage != "s3" or not confirmed:
        raise ImportError("需求分析基线只能在原型计划批准后的 S3 物化为项目记忆")
    config = imported_config(project)
    verified = verify_imported_project(project)
    workflow = read_json(project / "config" / "workflow.json")
    iteration = workflow.get("currentIteration", {})
    if iteration.get("approvedRequirementAnalysisManifestSha256") != verified.manifest_sha256:
        raise ImportError("S2 计划批准记录未绑定当前需求分析 manifest；请重新执行 approve-plan")

    root = baseline_root(project, config)
    handoff = verified.handoff
    facts = load_entry_json(root, handoff, "project_facts")
    rules = load_entry_json(root, handoff, "business_rules")
    features_data = load_entry_json(root, handoff, "feature_list")
    pages_data = load_entry_json(root, handoff, "page_index")
    interfaces_data = load_entry_json(root, handoff, "interface_index")
    open_data = load_entry_json(root, handoff, "open_items")
    iteration_name = str(iteration.get("name") or "已确认迭代")
    project_info = facts.get("project") if isinstance(facts.get("project"), dict) else handoff.get("project", {})
    actors = item_names(facts.get("actors"))
    pages = pages_data.get("pages") if isinstance(pages_data.get("pages"), list) else []
    features = features_data.get("features") if isinstance(features_data.get("features"), list) else []
    flows = rules.get("business_flows") if isinstance(rules.get("business_flows"), list) else []
    scope = facts.get("scope") if isinstance(facts.get("scope"), dict) else {}
    data_objects = facts.get("data_objects") if isinstance(facts.get("data_objects"), list) else []

    project_lines = [
        f"# 项目记忆 — 当前迭代 {iteration_name}",
        "",
        "## 项目定位",
        "",
        f"- 项目名称：{project_info.get('name') or handoff.get('project', {}).get('name') or project.name}",
        f"- 当前迭代：{iteration_name}",
        f"- 需求版本：{project_info.get('version') or handoff.get('project', {}).get('version') or 'unknown'}",
        f"- 冻结基线：`{verified.baseline_id}` / `{verified.fingerprint}`",
        "- 类型：无构建步骤的静态前端演示原型",
        "- 入口：`index.html`",
        "",
        "## 产品目标",
        "",
        str(project_info.get("objective") or "按照已冻结需求分析基线实现可演示、可验证、可追溯的产品原型。"),
        "",
        "## 目标用户",
        "",
        *(f"- {name}" for name in (actors or ["以冻结需求分析基线中的角色定义为准"])),
        "",
        "## 核心页面列表",
        "",
        *(f"- `{page.get('id')}` {page.get('name')}：{' / '.join(page.get('menu_path', [])) or '独立入口'}；"
          f"场景 {md(page.get('scenario_ids', []))}；时序 {md(page.get('sequence_ids', []))}；功能 {md(page.get('function_ids', []))}"
          for page in pages if isinstance(page, dict)),
        "",
        "## 核心用户路径",
        "",
        *(f"- `{flow.get('id')}` {flow.get('name')}：{' → '.join(str(step) for step in flow.get('steps', []))}" for flow in flows if isinstance(flow, dict)),
        "",
        "## 主要数据对象",
        "",
        *(f"- {md(item)}" for item in data_objects),
        *([] if data_objects else ["- 冻结基线未单列数据对象；按已冻结场景、字段与状态模型定位，不从功能名称反推对象。"]),
        "",
        "## 交付方式",
        "",
        "以本地静态 HTML 原型交付；业务流程图和时序交互图复用冻结基线中的自包含 HTML，并由原型交付导航统一打开。",
        "",
        "## 上游假设与确认边界",
        "",
        "保留上游假设的原文与状态；G3 接受风险不等于接口或业务假设已获验证。",
        "",
    ]
    assumptions = facts.get("assumptions") if isinstance(facts.get("assumptions"), list) else []
    project_lines.extend(f"- {item}" for item in assumptions)
    if not assumptions:
        project_lines.append("- 未新增原型侧业务假设；所有业务事实以冻结基线为准。")
    project_lines.extend([
        "",
        "## 范围",
        "",
        f"- In scope：{md(scope.get('in', []))}",
        f"- Out of scope：{md(scope.get('out', []))}",
        "",
        "## 未确认 open items 引用",
        "",
        "- 见 `memory/open-items.md`；上游已接受风险保持原决策，不在原型 Loop 内静默改写。",
        "",
        "## 目录结构",
        "",
        "- `inputs/requirement-analysis/` — 已校验、只读的需求分析冻结基线",
        "- `memory/requirement-analysis-baseline.json` — 原型侧追溯目录",
        "- `memory/feature-list.md` — 功能事实视图",
        "- `flowcharts/` — 从冻结图集发布的本地 HTML 交付页",
        "- `pages/`、`js/`、`mock/` — 原型页面、交互与模拟数据",
        "",
        "## 工作原则",
        "",
        "- 业务事实只从冻结基线读取；范围、功能、规则或接口结论变化时回到需求分析 Loop 生成新基线。",
        "- 原型 Loop 只补充展示、交互、Mock 和演示编排决策，并通过上游 ID 保持追溯。",
        "- 不消费 LLM Wiki/query 正文，不沿来源引用回查知识库；新材料与事实缺口交还需求分析 Loop。",
    ])
    project_lines.extend(frozen_context_lines(verified, config, facts))
    write_text(project / "memory" / "project.md", "\n".join(project_lines))

    rule_lines = [
        "# 业务规则",
        "",
        f"> 来源：冻结需求分析基线 `{verified.baseline_id}`。下列业务规则为只读事实。",
        "",
        "## Rules",
        "",
        "| Rule ID | Name | Statement | Scenario IDs |",
        "| --- | --- | --- | --- |",
    ]
    business_rules = rules.get("business_rules") if isinstance(rules.get("business_rules"), list) else []
    for rule in business_rules:
        if isinstance(rule, dict):
            rule_lines.append(f"| {md(rule.get('id'))} | {md(rule.get('name'))} | {md(rule.get('statement'))} | {md(rule.get('source_scenario_ids', []))} |")
    if not business_rules:
        rule_lines.append("| BR-NONE | 无独立业务规则 | 冻结基线未列出独立规则；场景步骤仍按原文执行 | none |")
    rule_lines.extend(["", "## Business Flows", "", "| Flow ID | Name | Scenario IDs | Steps |", "| --- | --- | --- | --- |"])
    for flow in flows:
        if isinstance(flow, dict):
            rule_lines.append(f"| {md(flow.get('id'))} | {md(flow.get('name'))} | {md(flow.get('scenario_ids', []))} | {md(flow.get('steps', []))} |")
    if not flows:
        rule_lines.append("| FLOW-NONE | 无跨场景汇总流程 | none | 直接依据各 SC-* 场景实现 |")
    write_text(project / "memory" / "business-rules.md", "\n".join(rule_lines))

    manifest_inputs = sorted(
        entry["path"] for entry in verified.manifest.get("files", [])
        if isinstance(entry, dict) and str(entry.get("path", "")).startswith("inputs/")
    )
    source_lines = [
        "# 资料来源",
        "",
        "| Source ID | Name | Type | Location | Version | Status |",
        "| --- | --- | --- | --- | --- | --- |",
        f"| SRC-001 | 需求分析冻结基线 | verified-package | {config['baselineRoot']} | {md(handoff.get('project', {}).get('version'))} | verified / immutable |",
    ]
    for index, relative in enumerate(manifest_inputs, start=2):
        source_lines.append(f"| SRC-{index:03d} | {md(Path(relative).name)} | upstream-evidence-index | {md(relative)} | frozen | integrity-checked / evidence-only |")
    if "source_index" in handoff.get("entrypoints", {}):
        # Deliberately read only registered provenance fields, never snapshot_path,
        # wiki_ref or raw_ref targets. Hash verification above is byte-level only.
        source_data = load_entry_json(root, handoff, "source_index")
        source_records = source_data.get("sources", [])
        if not isinstance(source_records, list):
            raise ImportError("冻结 source_index.sources 必须为数组")
        wiki_sources = [item for item in source_records if isinstance(item, dict) and item.get("type") == "llm_wiki"]
        if wiki_sources:
            source_lines.extend([
                "", "## Upstream Wiki Provenance (metadata only)", "",
                "| Upstream Source | wiki_ref | raw_ref | Version | Received At | Status | Coverage | Issues |",
                "| --- | --- | --- | --- | --- | --- | --- | --- |",
            ])
            for source in wiki_sources:
                source_lines.append("| " + " | ".join([
                    f"RA:{md(source.get('id'))}",
                    *(md(source.get(key)) for key in ("wiki_ref", "raw_ref", "version", "received_at", "status", "coverage", "issue_ids")),
                ]) + " |")
    source_lines.extend([
        "",
        "## Source Policy",
        "",
        "- `SRC-001` 是本轮原型的权威业务事实源；其 manifest 和所有文件会在每个后续门禁重新校验。",
        "- 其他 SRC-* 是上游证据索引，仅用于审计追溯；完整性通过不代表原始内容已被业务确认。",
        "- 原型 Agent 不读取 LLM Wiki/query 正文，不访问 wiki_ref/raw_ref 目标；这些字段只保留来源、覆盖与风险元数据。",
        "- 原型业务与字段事实只由冻结结构化结论物化；新增 Wiki 材料或缺口退回需求分析 Loop。",
    ])
    write_text(project / "memory" / "source-materials.md", "\n".join(source_lines))

    write_feature_list(project, verified, features, features_data.get("granularity_version"))
    write_field_map(project, pages, interfaces_data.get("interfaces", []))
    write_open_items(project, verified, open_data.get("items", []))

    catalog = handoff.get("id_catalog") if isinstance(handoff.get("id_catalog"), dict) else {}
    metadata = {
        "schemaVersion": 1,
        "baselineId": verified.baseline_id,
        "baselineFingerprint": verified.fingerprint,
        "manifestSha256": verified.manifest_sha256,
        "contract": CONTRACT,
        "baselineRoot": config["baselineRoot"],
        "entrypoints": handoff.get("entrypoints", {}),
        "acceptedRisks": handoff.get("accepted_risks", []),
        "featureListSha256": sha256_bytes((project / "memory" / "feature-list.md").read_bytes()),
        "requiredSourceIds": sorted(
            set(catalog.get("required_acceptance_ids", []))
            | set(catalog.get("feature_ids", []))
            | set(catalog.get("page_ids", []))
            | set(catalog.get("action_ids", []))
        ),
        "acceptanceIds": catalog.get("acceptance_ids", []),
        "requiredAcceptanceIds": catalog.get("required_acceptance_ids", []),
        "featureIds": catalog.get("feature_ids", []),
        "pageIds": catalog.get("page_ids", []),
        "actionIds": catalog.get("action_ids", []),
        "scenarioIds": catalog.get("scenario_ids", []),
        "sequenceIds": catalog.get("sequence_ids", []),
        "interfaceIds": catalog.get("interface_ids", []),
        "materializedAt": now(),
    }
    write_json(project / "memory" / "requirement-analysis-baseline.json", metadata)
    append_import_decision(project, verified)
    config["materializedAt"] = metadata["materializedAt"]
    config["materializedManifestSha256"] = verified.manifest_sha256
    write_json(project / "config" / "requirement-analysis.json", config)
    print(f"已从冻结基线生成原型项目记忆：{verified.baseline_id}")


def write_feature_list(project: Path, verified: VerifiedPackage, features: list[Any], granularity_version: Any = None) -> None:
    lines = [
        "# 功能清单",
        "",
        f"> 唯一业务事实源：需求分析基线 `{verified.baseline_id}`；原型实现必须通过 FUNC-* 保持追溯。",
        "",
        "| Feature ID | Version | 一级模块 | 二级模块 | 三级模块 | 功能名称 | 功能说明 | 备注 | 修改类型 | Story IDs | Acceptance IDs | Scenario IDs |",
        "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ]
    for feature in features:
        if not isinstance(feature, dict):
            continue
        change = {"new": "新增", "iteration": "迭代"}.get(str(feature.get("change_type")), feature.get("change_type"))
        lines.append(
            "| " + " | ".join(
                md(value)
                for value in [
                    feature.get("id"), feature.get("version"), feature.get("module_l1"), feature.get("module_l2"),
                    feature.get("module_l3"), feature.get("name"), feature.get("description"), feature.get("notes"), change,
                    feature.get("source_story_ids", []), feature.get("source_acceptance_ids", []), feature.get("source_scenario_ids", []),
                ]
            ) + " |"
        )
    if not features:
        raise ImportError("冻结需求分析基线没有 FUNC-* 功能清单，不能物化原型记忆")
    labels = {
        "business_object": "业务对象", "primary_action": "单一主操作",
        "system_boundary": "系统与交付责任边界", "initiator": "业务发起方", "trigger": "触发事件",
        "primary_outcome": "主要业务目的", "completion_result": "完成结果", "split_rationale": "拆分／合并依据",
        "included_scope": "包含范围", "excluded_scope": "不包含范围", "business_rules": "处理规则",
        "exception_paths": "异常范围", "dependencies": "依赖条件", "assumptions": "假设与待确认边界",
        "before": "变更前", "after": "变更后", "impact": "本轮变更范围",
    }
    story_path = entrypoint_path(verified.handoff, "normalized_user_stories")
    stories = json.loads(verified.payloads[story_path]).get("user_stories", [])
    acceptance = {ac["id"]: ac.get("statement", "") for story in stories for ac in story.get("acceptance_criteria", [])}
    lines.extend(["", "## 功能范围与验收明细", "", f"粒度规则版本：{md(granularity_version) if granularity_version else '历史基线未声明（保留原事实，不自行补造）'}"])
    for feature in features:
        if not isinstance(feature, dict):
            continue
        lines.extend(["", f"### {md(feature.get('id'))} · {md(feature.get('name'))}", ""])
        for key, title in (("boundary", "业务过程边界"), ("change_detail", "版本差异")):
            value = feature.get(key)
            if isinstance(value, dict):
                # Preserve every field, including future compatible extensions; never infer missing scope.
                lines.append(f"- {title}：")
                lines.extend(f"  - {labels.get(field, field)}：{md(detail)}" for field, detail in value.items())
            elif key not in feature:
                lines.append(f"- {title}：历史冻结基线未提供；不视为无边界或可自由补充。")
            else:
                lines.append(f"- {title}（冻结原值）：{md(value)}")
        lines.append("- 验收依据：")
        lines.extend(f"  - {md(aid)}：{md(acceptance.get(aid))}" for aid in feature.get("source_acceptance_ids", []))
    lines.extend([
        "", "## Consumption Rules", "",
        "- 页面和操作只能实现本表功能或已记录的原型框架能力；范围、排除项、依赖、异常与版本差异均是只读事实。",
        "- 新版 FUNC 按业务对象＋单一主操作＋可验收结果拆分，不能按 SC／页面把独立操作重新合并。一个 FUNC 可拆多个实现步骤，不因此新增 FUNC；条目数不等于标准功能点数、工作量或价格。历史基线保持原粒度，调整须回上游确认。",
        "- 新增业务功能、改变边界或补齐历史缺口时必须回需求分析生成新的冻结基线，原型不能推断补造。",
        "- 说明文档、标注与报价只按明确要求生成；引用完整范围与验收，不能只按名称承诺交付。",
    ])
    write_text(project / "memory" / "feature-list.md", "\n".join(lines))


def normalized_field(raw: Any, fallback_name: str) -> dict[str, Any]:
    if isinstance(raw, dict):
        name = raw.get("name") or raw.get("display_name") or raw.get("field") or raw.get("key") or fallback_name
        return {**raw, "name": str(name)}
    return {"name": str(raw or fallback_name)}


def write_field_map(project: Path, pages: list[Any], interfaces: Any) -> None:
    candidates: list[dict[str, Any]] = []
    for page in pages:
        if not isinstance(page, dict):
            continue
        page_id = str(page.get("id") or "PAGE")
        page_name = str(page.get("name") or page_id)
        for index, raw in enumerate(page.get("fields", []), start=1):
            field = normalized_field(raw, f"field-{index}")
            candidates.append({"area": f"{page_id} {page_name}", "kind": "page", "field": field, "used": page_id})
    if isinstance(interfaces, list):
        for interface in interfaces:
            if not isinstance(interface, dict):
                continue
            api_id = str(interface.get("id") or "API")
            api_name = str(interface.get("name") or api_id)
            for direction, values in (("request", interface.get("request_fields", [])), ("response", interface.get("response_fields", []))):
                if not isinstance(values, list):
                    continue
                for index, raw in enumerate(values, start=1):
                    field = normalized_field(raw, f"{direction}-{index}")
                    candidates.append({"area": f"{api_id} {api_name}", "kind": direction, "field": field, "used": api_id})
    unique: dict[tuple[str, str, str], dict[str, Any]] = {}
    for item in candidates:
        field = item["field"]
        signature = (item["area"], item["kind"], str(field.get("name")))
        unique.setdefault(signature, item)
    ordered = [unique[key] for key in sorted(unique)]
    used_ids: set[str] = set()
    next_id = 1
    rows: list[list[Any]] = []
    for item in ordered:
        field = item["field"]
        proposed = str(field.get("id") or "")
        if re.fullmatch(r"FLD-\d{3,}", proposed) and proposed not in used_ids:
            field_id = proposed
        else:
            while f"FLD-{next_id:03d}" in used_ids:
                next_id += 1
            field_id = f"FLD-{next_id:03d}"
            next_id += 1
        used_ids.add(field_id)
        display_name = str(field.get("display_name") or field.get("label") or field.get("name"))
        data_field = str(field.get("field") or field.get("key") or field.get("name"))
        definition = field.get("description") or field.get("business_definition") or f"冻结需求基线中用于{item['area']}的业务字段“{display_name}”。"
        value_logic = field.get("value_logic") or f"按冻结来源的 {data_field} 取值；原型使用等价 Mock 值展示。"
        display_format = field.get("display_format") or field.get("format") or "按来源语义展示"
        enum_mapping = field.get("enum") or field.get("mapping") or "none"
        empty_rule = field.get("empty_rule") or field.get("error_rule") or "缺失时展示明确空态；异常时不伪造成功值"
        rows.append([
            field_id, "SRC-001", item["area"], data_field, display_name, definition, value_logic,
            display_format, enum_mapping, empty_rule, f"{item['used']} 的 {display_name}", item["used"],
        ])
    lines = [
        "# 字段映射",
        "",
        "> 字段从冻结需求分析中的页面规划和接口索引确定性提取；`SRC-001` 指向整份已校验基线。",
        "",
        "| Field ID | Source ID | Page / Area | API / Data Field | Display Name | Business Definition | Value Logic | Display Format | Enum / Mapping | Empty / Error Rule | Annotation Point | Used In |",
        "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ]
    if rows:
        lines.extend("| " + " | ".join(md(value) for value in row) + " |" for row in rows)
    else:
        lines.extend([
            "",
            "No field-level source: 冻结需求分析基线未提供页面字段或接口字段；本轮原型不得凭空定义业务字段。",
            "如后续演示需要新增字段，应先回到需求分析 Loop 补充字段事实并重新冻结交付包，而不是在原型实现中静默假设。",
        ])
    lines.extend(["", "## Open Field Questions", "", "- None; any new field requires a refreshed requirement-analysis baseline."])
    write_text(project / "memory" / "field-map.md", "\n".join(lines))


def write_open_items(project: Path, verified: VerifiedPackage, items: Any) -> None:
    values = items if isinstance(items, list) else []
    lines = [
        "# Open Items",
        "",
        f"> 同步自冻结需求分析基线 `{verified.baseline_id}`；原型 Loop 不改变上游风险处置状态。",
        "",
        "| ID | Severity | Status | Summary | Related IDs | Resolution |",
        "| --- | --- | --- | --- | --- | --- |",
    ]
    for item in values:
        if isinstance(item, dict):
            lines.append(
                f"| {md(item.get('id'))} | {md(item.get('severity'))} | {md(item.get('status'))} | "
                f"{md(item.get('summary') or item.get('title') or item.get('description'))} | "
                f"{md(item.get('related_ids', []))} | {md(item.get('resolution') or item.get('decision') or item.get('note'))} |"
            )
    if not values:
        lines.append("| ITEM-NONE | none | closed | 冻结基线没有开放问题 | none | 无需原型侧处理 |")
    lines.extend(["", "## Prototype-only Questions", "", "- None recorded during deterministic baseline materialization; later presentation questions must be added with an explicit decision record."])
    write_text(project / "memory" / "open-items.md", "\n".join(lines))


def append_import_decision(project: Path, verified: VerifiedPackage) -> None:
    path = project / "docs" / "decisions.md"
    marker = f"analysis-baseline:{verified.manifest_sha256}"
    existing = path.read_text(encoding="utf-8", errors="ignore") if path.exists() else "# Decisions\n"
    if marker in existing:
        return
    entry = "\n".join([
        "",
        "## 冻结需求分析基线作为原型事实源",
        "",
        f"- Marker: `{marker}`",
        f"- Baseline: `{verified.baseline_id}`",
        f"- Fingerprint: `{verified.fingerprint}`",
        "- Decision: 业务范围、规则、功能清单、接口结论、页面规划和图集均只读复用；原型 Loop 只新增展示与交互实现决策。",
        "- Change rule: 任何业务事实变化都返回需求分析 Loop，并以新的 G3 冻结包开启新的原型迭代。",
        "",
    ])
    write_text(path, existing.rstrip() + "\n" + entry)


def semantic_flow_metadata(root: Path, handoff: dict[str, Any]) -> str:
    index = load_entry_json(root, handoff, "scenario_index")
    lanes: list[str] = []
    nodes: list[str] = []
    edges: list[str] = []
    for scenario in index.get("scenarios", []):
        if not isinstance(scenario, dict):
            continue
        if scenario.get("scope", "in_scope") != "in_scope":
            continue
        scenario_id = str(scenario.get("id") or "SC")
        relative = safe_archive_path(str(scenario.get("file") or ""))
        detail = read_json(root / relative)
        diagram = detail.get("flow_diagram") if isinstance(detail.get("flow_diagram"), dict) else {}
        for lane in diagram.get("lanes", []):
            if isinstance(lane, dict) and lane.get("id"):
                lanes.append(f"{scenario_id}-{lane['id']}")
        for node in diagram.get("nodes", []):
            if isinstance(node, dict) and node.get("id"):
                nodes.append(f"{scenario_id}-{node['id']}")
        for idx, edge in enumerate(diagram.get("edges", []), start=1):
            if isinstance(edge, dict):
                edges.append(f"{scenario_id}-E{idx:03d}-{edge.get('from')}-{edge.get('to')}")
    if len(lanes) < 1 or len(nodes) < 2 or len(edges) < 1:
        raise ImportError("冻结业务场景图缺少可发布的泳道、节点或连线语义")
    pieces = [
        '<div hidden data-delivery-diagram="business-process" data-diagram-state="ready" data-analysis-provenance="frozen-baseline">',
        *(f'<span data-flow-lane="{html_escape(value, quote=True)}"></span>' for value in lanes),
        *(f'<span data-flow-node="{html_escape(value, quote=True)}"></span>' for value in nodes),
        *(f'<span data-flow-edge="{html_escape(value, quote=True)}"></span>' for value in edges),
        "</div>",
    ]
    return "\n".join(pieces)


def semantic_sequence_metadata(root: Path, handoff: dict[str, Any]) -> str:
    index = load_entry_json(root, handoff, "sequence_index")
    participants: list[str] = []
    messages: list[str] = []
    for sequence in index.get("sequences", []):
        if not isinstance(sequence, dict):
            continue
        sequence_id = str(sequence.get("id") or "SEQ")
        relative = safe_archive_path(str(sequence.get("file") or ""))
        detail = read_json(root / relative)
        for participant in detail.get("participants", []):
            if isinstance(participant, dict) and participant.get("id"):
                participants.append(f"{sequence_id}-{participant['id']}")
        for idx, message in enumerate(detail.get("messages", []), start=1):
            if isinstance(message, dict):
                messages.append(f"{sequence_id}-M{idx:03d}-{message.get('from')}-{message.get('to')}")
    if len(participants) < 2 or len(messages) < 1:
        raise ImportError("冻结交互时序图缺少可发布的参与方或消息语义")
    pieces = [
        '<div hidden data-delivery-diagram="sequence-interaction" data-diagram-state="ready" data-analysis-provenance="frozen-baseline">',
        *(f'<span data-sequence-participant="{html_escape(value, quote=True)}"></span>' for value in participants),
        *(f'<span data-sequence-message="{html_escape(value, quote=True)}"></span>' for value in messages),
        "</div>",
    ]
    return "\n".join(pieces)


def adapt_html(source: str, metadata: str, verified: VerifiedPackage) -> str:
    provenance = (
        f'<meta name="requirement-analysis-baseline" content="{html_escape(verified.baseline_id, quote=True)}">\n'
        f'<meta name="requirement-analysis-fingerprint" content="{verified.fingerprint}">'
    )
    output = re.sub(r"</head\s*>", provenance + "\n</head>", source, count=1, flags=re.IGNORECASE)
    if output == source:
        raise ImportError("上游 HTML 图集缺少 </head>，无法注入来源标识")
    output = re.sub(r"<body([^>]*)>", lambda match: f"<body{match.group(1)}>\n{metadata}", output, count=1, flags=re.IGNORECASE)
    if metadata not in output:
        raise ImportError("上游 HTML 图集缺少 <body>，无法注入交付语义")
    output = re.sub(
        r"</body\s*>",
        '  <script src="../js/delivery-nav.js"></script>\n</body>',
        output,
        count=1,
        flags=re.IGNORECASE,
    )
    return output


def publish_diagrams(project: Path) -> None:
    project = project.expanduser().resolve()
    stage, _ = workflow_state(project)
    if stage not in {"s7", "s8", "s9", "none"}:
        raise ImportError("冻结 HTML 图集只在原型 S7 及后续阶段发布")
    config = imported_config(project)
    verified = verify_imported_project(project)
    if config.get("materializedManifestSha256") != verified.manifest_sha256:
        raise ImportError("需求分析基线尚未在 S3 物化，不能发布图集")
    root = baseline_root(project, config)
    business_path = root / entrypoint_path(verified.handoff, "business_scenario_atlas")
    sequence_path = root / entrypoint_path(verified.handoff, "interaction_sequence_atlas")
    business = adapt_html(
        business_path.read_text(encoding="utf-8"),
        semantic_flow_metadata(root, verified.handoff),
        verified,
    )
    sequence = adapt_html(
        sequence_path.read_text(encoding="utf-8"),
        semantic_sequence_metadata(root, verified.handoff),
        verified,
    )
    write_text(project / "flowcharts" / "business-process.html", business)
    write_text(project / "flowcharts" / "sequence-interaction.html", sequence)
    config["diagramPublication"] = {
        "manifestSha256": verified.manifest_sha256,
        "publishedAt": now(),
        "businessSourceSha256": sha256_bytes(business_path.read_bytes()),
        "sequenceSourceSha256": sha256_bytes(sequence_path.read_bytes()),
        "mode": "reuse-with-provenance-adapter",
    }
    write_json(project / "config" / "requirement-analysis.json", config)
    print("已复用冻结 HTML 图集并发布到原型交付页；未重新计算或改写图形几何。")


def inspect_package(package: Path) -> None:
    verified = verify_package(package)
    catalog = verified.handoff.get("id_catalog", {})
    print(json.dumps({
        "valid": True,
        "contract": CONTRACT,
        "baselineId": verified.baseline_id,
        "baselineFingerprint": verified.fingerprint,
        "manifestSha256": verified.manifest_sha256,
        "project": verified.handoff.get("project", {}),
        "verification": verified.handoff.get("verification", {}),
        "acceptedRiskCount": len(verified.handoff.get("accepted_risks", [])),
        "counts": {key: len(value) for key, value in catalog.items() if isinstance(value, list)},
    }, ensure_ascii=False, indent=2))


def main() -> int:
    parser = argparse.ArgumentParser(description="导入并复用需求分析 Loop 的 G3 冻结基线")
    sub = parser.add_subparsers(dest="command", required=True)
    inspect_parser = sub.add_parser("inspect", help="只读检查冻结包")
    inspect_parser.add_argument("package")
    import_parser = sub.add_parser("import", help="在 S0/S1/S2 计划批准前导入冻结包")
    import_parser.add_argument("project")
    import_parser.add_argument("package")
    verify_parser = sub.add_parser("verify", help="重新校验项目内已导入基线")
    verify_parser.add_argument("project")
    materialize_parser = sub.add_parser("materialize", help="在 S3 将冻结事实物化为原型记忆")
    materialize_parser.add_argument("project")
    publish_parser = sub.add_parser("publish-diagrams", help="在 S7 复用冻结 HTML 图集")
    publish_parser.add_argument("project")
    args = parser.parse_args()
    try:
        if args.command == "inspect":
            inspect_package(Path(args.package))
        elif args.command == "import":
            import_package(Path(args.project), Path(args.package))
        elif args.command == "verify":
            verified = verify_imported_project(Path(args.project).expanduser().resolve())
            print(f"需求分析基线校验通过：{verified.baseline_id} ({verified.manifest_sha256})")
        elif args.command == "materialize":
            materialize_project_memory(Path(args.project))
        elif args.command == "publish-diagrams":
            publish_diagrams(Path(args.project))
    except ImportError as exc:
        print(f"- ERROR: {exc}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
