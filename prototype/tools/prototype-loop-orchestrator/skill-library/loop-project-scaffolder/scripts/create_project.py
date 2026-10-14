#!/usr/bin/env python3
"""Create or conservatively migrate a static frontend prototype project."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
from datetime import date
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit


SKILL_ROOT = Path(__file__).resolve().parent.parent
REPO_ROOT = SKILL_ROOT.parent.parent
ORCHESTRATOR_SCRIPTS = REPO_ROOT / "orchestrator" / "scripts"
ANNOTATION_ASSETS = SKILL_ROOT / "assets" / "annotation-kit"
TEMPLATES_DIR = SKILL_ROOT / "assets" / "templates"

MIGRATION_MAP = {
    "style.css": "assets/css/app.css",
    "data/mock.js": "mock/data.js",
    "data/annotations.js": "annotations/annotations.js",
    "annotations-tool/annotation-runtime.js": "annotations/annotation-runtime.js",
    "annotations-tool/annotation.css": "annotations/annotation.css",
    "interaction.html": "docs/interaction.html",
    "fix_report_clue.py": "tools/fix_report_clue.py",
}

# Dormant annotation runtime copied into every project. It does not make
# annotations a required deliverable; content remains empty unless requested.
ANNOTATION_COPY_ASSETS = [
    ("annotation-runtime.js", "annotations/annotation-runtime.js"),
    ("annotation.css", "annotations/annotation.css"),
    ("clauderules.template", ".clauderules"),
]

SCRIPT_COPY_ASSETS = [
    ("import_analysis.py", "tools/import_analysis.py"),
    ("project_versions.py", "tools/project_versions.py"),
    ("loop_preflight.py", "tools/loop_preflight.py"),
    ("loop_run.py", "tools/loop_run.py"),
]

RUNTIME_PACKAGE_ROOT = "tools/prototype-loop-orchestrator"
RUNTIME_PACKAGE_COPY_PATHS = [
    "SKILL.md",
    "VERSION_WORKFLOW.md",
    "docs/design-principles.md",
    "docs/loop-overview.md",
    "docs/pm-guide.md",
    "orchestrator/workflow.yaml",
    "orchestrator/artifacts.yaml",
    "orchestrator/gates.yaml",
    "orchestrator/scripts/loop_preflight.py",
    "orchestrator/scripts/loop_run.py",
    "orchestrator/scripts/import_analysis.py",
    "orchestrator/scripts/project_versions.py",
    "skill-library/annotation-generator/SKILL.md",
    "skill-library/loop-project-scaffolder/SKILL.md",
    "skill-library/memory-generator/SKILL.md",
    "skill-library/playwright-cli/SKILL.md",
    "skill-library/project-decomposer/SKILL.md",
    "skill-library/prototype-builder/SKILL.md",
    "skill-library/prototype-verifier/SKILL.md",
    "skill-library/structure-reader/SKILL.md",
    "skill-library/superpowers-pm-prototype/skills/brainstorming/SKILL.md",
    "skill-library/superpowers-pm-prototype/skills/systematic-debugging/SKILL.md",
    "skill-library/superpowers-pm-prototype/skills/verification-before-completion/SKILL.md",
    "skill-library/loop-project-scaffolder/scripts/create_project.py",
]
RUNTIME_PACKAGE_COPY_GLOBS = [
    "orchestrator/agent-contracts/*.yaml",
    "skill-library/loop-project-scaffolder/assets/annotation-kit/*",
    "skill-library/loop-project-scaffolder/assets/templates/**/*",
]

# Framework files that must exist in every project (beyond those in templates).
REQUIRED_FRAMEWORK_PATHS = [
    "flowcharts/business-process.html",
    "flowcharts/sequence-interaction.html",
    "related-systems/index.html",
    "assets/css/delivery-diagrams.css",
    "js/delivery-nav.js",
    ".clauderules",
    "tools/loop_preflight.py",
    "tools/loop_run.py",
    "tools/import_analysis.py",
]

# These are real deliverables, not framework placeholders. S9 creates them only
# when config/workflow.json records an explicit request.
OPTIONAL_OUTPUT_TEMPLATE_PATHS = {
    "docs/interaction.html",
    "memory/annotation-coverage.md",
    "memory/annotation-prompt.md",
}

# These source templates remain available for an explicit legacy command, but
# never belong to modern generated projects or their installed runtime package.
RETIRED_TEMPLATE_PATHS = frozenset({
    "flowcharts/index.html",
    "flowcharts/processon-links.txt",
})
TEMPLATE_SOURCE_PREFIX = "skill-library/loop-project-scaffolder/assets/templates/"

# Files/directories that must never be copied from an iteration base into a
# fresh generated project. They belong to local tooling, dependencies, or VCS
# state rather than the prototype itself.
BASE_COPY_EXCLUDED_NAMES = {
    ".git",
    ".loop-history",
    ".workbuddy",
    ".DS_Store",
    "__pycache__",
    "node_modules",
    "playwright-report",
    "test-results",
}

BASE_COPY_EXCLUDED_RELATIVE_PREFIXES = {
    RUNTIME_PACKAGE_ROOT,
}

DATA_ANNO_SOURCE_SUFFIXES = {".html", ".js", ".mjs", ".jsx", ".ts", ".tsx"}
DATA_ANNO_STRIP_PATTERNS = [
    re.compile(r'\sdata-anno\s*=\s*"[^"]*"'),
    re.compile(r"\sdata-anno\s*=\s*'[^']*'"),
    re.compile(r'\sdata-anno\s*=\s*\\"[^"]*\\"'),
    re.compile(r'\sdata-anno\s*=\s*[^\s>]+'),
]

# Project state that must be reset when a new project is created from an
# existing base. Business pages/assets may be kept; loop memory, workflow state,
# project identity, and annotation content must not leak from the base project.
BASE_STATE_RESET_PATHS = {
    "CLAUDE.md",
    ".clauderules",
    "annotations/annotations.js",
    "config/project.json",
    "config/requirement-analysis.json",
    "config/workflow.json",
    "docs/decisions.md",
    "docs/interaction.html",
    "flowcharts/business-process.html",
    "flowcharts/sequence-interaction.html",
    "related-systems/index.html",
    "memory/acceptance-map.md",
    "memory/annotation-coverage.md",
    "memory/annotation-prompt.md",
    "memory/business-rules.md",
    "memory/change-log.md",
    "memory/circuit-state.json",
    "memory/execution-steps.md",
    "memory/field-map.md",
    "memory/feature-list.md",
    "memory/loop-status.md",
    "memory/open-items.md",
    "memory/project.md",
    "memory/requirement-analysis-baseline.json",
    "memory/requirement-analysis-import.md",
    "memory/project-startup-plan.md",
    "memory/project-structure.md",
    "memory/source-materials.md",
    "memory/stage-log.md",
    "memory/task-plan.md",
    "memory/verification-log.md",
}

BASE_STATE_RESET_DIRECTORIES = {
    "annotations",
    "flowcharts",
    "memory",
    "related-systems",
}

BASE_STATE_REMOVE_PATHS = {
    "docs/index.html",
    "flowcharts/index.html",
    "flowcharts/processon-links.txt",
}

# These HTML pages contain project-specific content. Runtime refresh creates
# missing pages but never overwrites diagrams already produced for the project.
DELIVERY_CONTENT_TEMPLATE_PATHS = {
    "flowcharts/business-process.html",
    "flowcharts/sequence-interaction.html",
    "related-systems/index.html",
    "version-history.html",
}

DELIVERY_SHELL_TEMPLATE_PATHS = {
    "assets/css/delivery-diagrams.css",
    "js/delivery-nav.js",
    "js/version-nav.js",
    "assets/css/version-history.css",
}

RUNTIME_SUPPORT_TEMPLATE_PATHS = {
    "config/requirement-analysis.json",
    "memory/feature-list.md",
}

LEGACY_DELIVERY_PATHS = RETIRED_TEMPLATE_PATHS

SEED_COPY_PATHS = [
    "CLAUDE.md",
    "docs/decisions.md",
    "memory/project.md",
    "memory/project-startup-plan.md",
    "memory/business-rules.md",
    "memory/source-materials.md",
    "memory/field-map.md",
    "memory/task-plan.md",
    "memory/open-items.md",
]

REFERENCE_PATTERN = re.compile(
    r"(?P<prefix>\b(?:src|href)\s*=\s*)(?P<quote>[\"'])(?P<url>[^\"']+)(?P=quote)",
    re.IGNORECASE,
)

# Placeholder files that only exist to keep empty directories in git.
GITKEEP_SUFFIX = "/.gitkeep"


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "prototype"


def _compute_project_id(name: str, target: Path) -> str:
    """Derive a stable project id from a name and filesystem path."""
    digest = hashlib.sha256(str(target).encode("utf-8")).hexdigest()[:8]
    return f"{slugify(name)}-{digest}"


def project_id(name: str, target: Path) -> str:
    """Return the project id, preferring the persisted value in config/project.json."""
    config_file = target / "config" / "project.json"
    if config_file.is_file():
        try:
            data = json.loads(config_file.read_text(encoding="utf-8"))
            if data.get("projectId"):
                return data["projectId"]
        except (json.JSONDecodeError, OSError):
            pass
    return _compute_project_id(name, target)


def version_index_script_ref(target: Path) -> str:
    """Infer a parent project only from its existing explicit registry binding."""
    binding_path = target / "project-version.json"
    if binding_path.is_file():
        try:
            binding = json.loads(binding_path.read_text(encoding="utf-8"))
            if not isinstance(binding, dict):
                return "./版本清单.js"
            registry = binding.get("registry")
            if isinstance(registry, str) and registry:
                registry_path = Path(registry).expanduser()
                if not registry_path.is_absolute():
                    registry_path = target / registry_path
                registry_path = registry_path.resolve()
                if registry_path.name == "project-versions.json" and registry_path.parent.name == "memory":
                    if registry_path.parent.parent == target.resolve().parent:
                        return "../版本清单.js"
        except (json.JSONDecodeError, OSError, TypeError, ValueError):
            pass
    return "./版本清单.js"


def interaction_doc_requested(target: Path) -> bool:
    """Project UI uses a generation-time projection of the explicit option."""
    try:
        workflow = json.loads((target / "config/workflow.json").read_text(encoding="utf-8"))
        return workflow.get("currentIteration", {}).get("requestedDeliverables", {}).get("interactionDoc") is True
    except (json.JSONDecodeError, OSError, AttributeError, TypeError):
        return False


def load_templates(name: str, target: Path) -> dict[str, str]:
    """Load all template files from TEMPLATES_DIR and substitute placeholders.

    Only known placeholders (including the static version/data-option mounts) are
    replaced; all other curly-brace pairs (JS object literals, JSON, CSS
    blocks, etc.) are left untouched.
    """
    annotation_project_id = project_id(name, target)
    today = date.today().isoformat()
    variables = {
        "name": name,
        "today": today,
        "annotation_project_id": annotation_project_id,
        "version_index_script": version_index_script_ref(target),
        "include_interaction_doc": "true" if interaction_doc_requested(target) else "false",
    }
    placeholder_re = re.compile(
        r"\{(" + "|".join(re.escape(k) for k in variables) + r")\}"
    )

    def _substitute(content: str) -> str:
        return placeholder_re.sub(lambda m: variables.get(m.group(1), m.group(0)), content)

    result: dict[str, str] = {}
    for template_file in TEMPLATES_DIR.rglob("*"):
        if template_file.is_dir():
            continue
        relative = template_file.relative_to(TEMPLATES_DIR).as_posix()
        if relative in OPTIONAL_OUTPUT_TEMPLATE_PATHS or relative in RETIRED_TEMPLATE_PATHS:
            continue
        content = template_file.read_text(encoding="utf-8")
        if relative.endswith("/.gitkeep"):
            result[relative] = content
            continue
        result[relative] = _substitute(content)
    return result


def _persist_project_config(target: Path, annotation_project_id: str, today: str) -> None:
    """Write config/project.json so the project id survives folder moves."""
    config_dir = target / "config"
    config_dir.mkdir(parents=True, exist_ok=True)
    config_file = config_dir / "project.json"
    if not config_file.exists():
        config_file.write_text(
            json.dumps(
                {"projectId": annotation_project_id, "created": today},
                ensure_ascii=False,
                indent=2,
            ),
            encoding="utf-8",
        )


def copy_asset(source_name: str, target: Path, relative_path: str, merge: bool) -> str:
    destination = target / relative_path
    if destination.exists():
        return "skipped" if merge else "conflict"
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(ANNOTATION_ASSETS / source_name, destination)
    return "created"


def copy_script_asset(source_name: str, target: Path, relative_path: str, merge: bool) -> str:
    destination = target / relative_path
    if destination.exists():
        return "skipped" if merge else "conflict"
    destination.parent.mkdir(parents=True, exist_ok=True)
    source = ORCHESTRATOR_SCRIPTS / source_name
    if not source.exists():
        raise FileNotFoundError(
            f"Missing loop script asset: {source_name}. Install the full prototype-loop-orchestrator package."
        )
    shutil.copy2(source, destination)
    return "created"


def _is_excluded_base_path(path: Path, base_dir: Path) -> bool:
    relative = path.relative_to(base_dir)
    relative_posix = relative.as_posix()
    if any(part in BASE_COPY_EXCLUDED_NAMES for part in relative.parts):
        return True
    return any(
        relative_posix == prefix or relative_posix.startswith(prefix + "/")
        for prefix in BASE_COPY_EXCLUDED_RELATIVE_PREFIXES
    )


def _is_data_anno_source(path: Path, target: Path) -> bool:
    if not path.is_file() or path.suffix.lower() not in DATA_ANNO_SOURCE_SUFFIXES:
        return False
    try:
        relative = path.relative_to(target)
    except ValueError:
        return False
    if any(part in {".git", "node_modules", "tools", "annotations"} for part in relative.parts):
        return False
    return True


def strip_data_anno_anchors(target: Path) -> tuple[int, int]:
    """Remove stale data-anno anchors copied from a base project.

    Annotation content is reset for a new iteration, so old physical anchors in
    base HTML/JS must not be scanned later as current S9 candidates.
    """
    changed_files = 0
    removed_attrs = 0
    for path in sorted(target.rglob("*")):
        if not _is_data_anno_source(path, target):
            continue
        original = path.read_text(encoding="utf-8", errors="ignore")
        updated = original
        file_removed = 0
        for pattern in DATA_ANNO_STRIP_PATTERNS:
            updated, count = pattern.subn("", updated)
            file_removed += count
        if updated != original:
            path.write_text(updated, encoding="utf-8")
            changed_files += 1
            removed_attrs += file_removed
    return changed_files, removed_attrs


def copy_base_project(base_dir: Path, target: Path) -> list[str]:
    """Copy business files from a base project while excluding local state."""
    base_dir = base_dir.expanduser().resolve()
    if not base_dir.is_dir():
        raise FileNotFoundError(f"Base directory does not exist: {base_dir}")
    if target.exists() and any(target.iterdir()):
        raise FileExistsError("--from-base requires an empty or non-existing target folder")
    if target == base_dir or base_dir in target.parents:
        raise ValueError("Target cannot be the base directory or a child of the base directory")

    copied: list[str] = []
    target.mkdir(parents=True, exist_ok=True)
    for source in base_dir.rglob("*"):
        if _is_excluded_base_path(source, base_dir):
            continue
        relative = source.relative_to(base_dir)
        destination = target / relative
        if source.is_dir():
            destination.mkdir(parents=True, exist_ok=True)
            continue
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination)
        copied.append(relative.as_posix())
    return copied


def reset_base_state(target: Path, name: str) -> list[str]:
    """Reset loop-owned state after copying or migrating from an iteration base."""
    for relative_path in sorted(BASE_STATE_RESET_DIRECTORIES):
        path = target / relative_path
        if path.exists():
            shutil.rmtree(path)
    for relative_path in sorted(BASE_STATE_REMOVE_PATHS):
        path = target / relative_path
        if path.exists():
            path.unlink()
    for relative_path in sorted(OPTIONAL_OUTPUT_TEMPLATE_PATHS):
        path = target / relative_path
        if path.is_file() or path.is_symlink():
            path.unlink()
    old_project_config = target / "config" / "project.json"
    if old_project_config.exists():
        old_project_config.unlink()
    generated = load_templates(name, target)
    reset: list[str] = []
    for relative_path in sorted(
        BASE_STATE_RESET_PATHS
        | DELIVERY_CONTENT_TEMPLATE_PATHS
        | DELIVERY_SHELL_TEMPLATE_PATHS
    ):
        content = generated.get(relative_path)
        if content is None:
            continue
        destination = target / relative_path
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text(content, encoding="utf-8")
        reset.append(relative_path)

    for source_name, relative_path in ANNOTATION_COPY_ASSETS:
        destination = target / relative_path
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(ANNOTATION_ASSETS / source_name, destination)
        if relative_path not in reset:
            reset.append(relative_path)

    for source_name, relative_path in SCRIPT_COPY_ASSETS:
        destination = target / relative_path
        destination.parent.mkdir(parents=True, exist_ok=True)
        source = ORCHESTRATOR_SCRIPTS / source_name
        if not source.exists():
            raise FileNotFoundError(
                f"Missing loop script asset: {source_name}. Install the full prototype-loop-orchestrator package."
            )
        shutil.copy2(source, destination)
        if relative_path not in reset:
            reset.append(relative_path)
    for relative_path in sync_runtime_package(target):
        if relative_path not in reset:
            reset.append(relative_path)
    return reset


def runtime_package_paths() -> list[str]:
    paths = set(RUNTIME_PACKAGE_COPY_PATHS)
    for pattern in RUNTIME_PACKAGE_COPY_GLOBS:
        for source in REPO_ROOT.glob(pattern):
            if source.is_file():
                paths.add(source.relative_to(REPO_ROOT).as_posix())
    retired_sources = {
        TEMPLATE_SOURCE_PREFIX + relative for relative in RETIRED_TEMPLATE_PATHS
    }
    return sorted(paths - retired_sources)


def sync_runtime_package(target: Path) -> list[str]:
    """Copy the minimal readable loop package used by dispatch into a project."""
    package_root = target / RUNTIME_PACKAGE_ROOT
    if REPO_ROOT.resolve() == package_root.resolve():
        return [
            (Path(RUNTIME_PACKAGE_ROOT) / relative_path).as_posix()
            for relative_path in runtime_package_paths()
            if (REPO_ROOT / relative_path).is_file()
        ]
    if package_root.exists():
        shutil.rmtree(package_root)
    copied: list[str] = []
    for relative_path in runtime_package_paths():
        source = REPO_ROOT / relative_path
        if not source.is_file():
            raise FileNotFoundError(f"Missing runtime package asset: {relative_path}")
        destination = package_root / relative_path
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination)
        copied.append((Path(RUNTIME_PACKAGE_ROOT) / relative_path).as_posix())
    return copied


def sync_loop_tools(target: Path) -> list[str]:
    """Overwrite generated project loop tools and readable dispatch package."""
    if not target.exists():
        raise FileNotFoundError(f"Target project does not exist: {target}")
    synced: list[str] = []
    for source_name, relative_path in SCRIPT_COPY_ASSETS:
        destination = target / relative_path
        destination.parent.mkdir(parents=True, exist_ok=True)
        source = ORCHESTRATOR_SCRIPTS / source_name
        if not source.exists():
            raise FileNotFoundError(
                f"Missing loop script asset: {source_name}. Install the full prototype-loop-orchestrator package."
            )
        shutil.copy2(source, destination)
        synced.append(relative_path)
    synced.extend(sync_runtime_package(target))
    generated = load_templates(target.name, target)
    for relative_path in sorted(RUNTIME_SUPPORT_TEMPLATE_PATHS):
        destination = target / relative_path
        if destination.exists():
            continue
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text(generated[relative_path], encoding="utf-8")
        synced.append(relative_path)
    return synced


def _load_json_file(path: Path) -> dict:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def _write_json_file(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def preserve_legacy_delivery_assets(target: Path) -> list[str]:
    """Leave existing legacy content and custom business navigation untouched."""
    return [
        relative for relative in sorted(LEGACY_DELIVERY_PATHS)
        if (target / relative).is_file() or (target / relative).is_symlink()
    ]


def ensure_flowchart_navigation(target: Path) -> tuple[list[str], list[str]]:
    """Add a legacy viewer entry only for the explicitly requested old command."""
    nav_path = target / "config" / "nav.json"
    if nav_path.is_symlink():
        return [], ["config/nav.json 是符号链接，保持原导航；旧查看器可直接打开"]
    if not nav_path.is_file():
        return [], ["缺少 config/nav.json，旧图集可通过 flowcharts/index.html 直接查看"]
    try:
        nav_data = json.loads(nav_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return [], ["config/nav.json 不是有效 JSON，未改写已有导航"]
    menu = nav_data.get("menu")
    if not isinstance(menu, list):
        return [], ["config/nav.json.menu 不是数组，未改写已有导航"]
    if any(isinstance(item, dict) and item.get("href") == "flowcharts/index.html" for item in menu):
        return [], []
    if any(isinstance(item, dict) and item.get("label") == "流程图集" for item in menu):
        return [], ["已有自定义流程图集导航，保持原配置；旧查看器路径为 flowcharts/index.html"]
    menu.append({"label": "流程图集", "icon": "流", "href": "flowcharts/index.html"})
    _write_json_file(nav_path, nav_data)
    return ["config/nav.json"], []


def check_legacy_flowchart_links(target: Path) -> list[str]:
    """Retain the old ProcessOn domain check without making it a modern gate."""
    path = target / "flowcharts" / "processon-links.txt"
    if path.is_symlink():
        return ["旧图集链接清单为符号链接，未读取或修改；请先明确本地链接清单"]
    if not path.is_file():
        return []
    errors: list[str] = []
    for line_number, raw_line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        parts = [part.strip() for part in line.split("|")]
        raw_url = parts[0] if len(parts) == 1 else parts[1] if len(parts) == 2 else "|".join(parts[2:]).strip()
        parsed = urlsplit(raw_url)
        host = (parsed.hostname or "").lower()
        if parsed.scheme not in {"http", "https"} or not host or (
            host != "processon.com" and not host.endswith(".processon.com")
        ):
            errors.append(f"旧图集包含无效 ProcessOn 链接：flowcharts/processon-links.txt:{line_number}")
    return errors


def sync_flowchart_assets(target: Path, name: str) -> tuple[list[str], list[str], list[str]]:
    """Explicit source-only compatibility: install missing viewer, preserve data."""
    if not target.is_dir():
        raise FileNotFoundError(f"Target project does not exist: {target}")
    errors = check_legacy_flowchart_links(target)
    if errors:
        raise ValueError("\n".join(errors))
    missing = [
        relative for relative in sorted(LEGACY_DELIVERY_PATHS)
        if not (target / relative).exists() and not (target / relative).is_symlink()
    ]
    for relative in missing:
        if not (TEMPLATES_DIR / relative).is_file():
            raise FileNotFoundError(
                "旧图集兼容模板只保留在维护源码；请使用02源码的 --sync-flowcharts，"
                "个人安装态不会重新携带已退休模板"
            )
    updated: list[str] = []
    preserved = preserve_legacy_delivery_assets(target)
    for relative in missing:
        destination = target / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        content = (TEMPLATES_DIR / relative).read_text(encoding="utf-8")
        if relative.endswith(".html"):
            content = content.replace("{name}", name)
            # The old shared switcher assumes a three-view host. Keep the
            # recovered viewer standalone so it cannot replace modern navigation.
            content = content.replace('  <script src="../js/delivery-nav.js"></script>\n', '')
            content = content.replace(
                "<body>",
                '<body>\n<a href="../index.html" style="position:fixed;right:20px;top:12px;z-index:10001">返回原型</a>',
                1,
            )
        destination.write_text(content, encoding="utf-8")
        updated.append(relative)
    nav_changed, warnings = ensure_flowchart_navigation(target)
    updated.extend(nav_changed)
    modern_pages = (target / "flowcharts/business-process.html").is_file()
    if modern_pages:
        delivery_changed, delivery_warnings = ensure_delivery_navigation(target)
        updated.extend(delivery_changed)
        warnings.extend(delivery_warnings)
    warnings.append("旧图集兼容命令不推进阶段或签署审批；现代交付仍使用冻结本地图集")
    return updated, preserved, warnings


def mount_version_projection(text: str, script_ref: str) -> str:
    """Patch real HTML tag ranges only; scripts/styles/comments remain opaque."""
    tag = f'<script src="{script_ref}" data-project-version-index></script>'
    offsets = [0]
    offsets.extend(match.end() for match in re.finditer(r'\n', text))

    class MountParser(HTMLParser):
        def __init__(self):
            super().__init__(convert_charrefs=False)
            self.patches: list[tuple[int, int, str]] = []
            self.marked: list[tuple[int, int]] = []
            self.anchor: int | None = None
            self.body_end: int | None = None
            self.open_script: tuple[int, int] | None = None

        def position(self) -> int:
            line, column = self.getpos()
            return offsets[line - 1] + column

        def handle_starttag(self, name, attributes):
            start = self.position()
            raw = self.get_starttag_text()
            end = start + len(raw)
            attrs = dict(attributes)
            updated = raw
            if name == "body":
                updated = re.sub(r'\s+data-version-index-url\s*=\s*(?:"[^"]*"|\'[^\']*\')', '', updated, flags=re.IGNORECASE)
            if ("data-version-history" in attrs or "data-version-nav" in attrs or
                    attrs.get("data-delivery-open") == "versions" or attrs.get("data-delivery-switch") == "versions"):
                updated = re.sub(r'\s+data-index-url\s*=\s*(?:"[^"]*"|\'[^\']*\')', '', updated, flags=re.IGNORECASE)
            if updated != raw:
                self.patches.append((start, end, updated))
            if name == "script":
                self.open_script = (start, end) if "data-project-version-index" in attrs else None
                src = attrs.get("src") or ""
                if self.anchor is None and re.search(r'(?:^|/)(?:version-nav|delivery-nav)\.js$', urlsplit(src).path):
                    self.anchor = start

        def handle_endtag(self, name):
            start = self.position()
            if name == "body" and self.body_end is None:
                self.body_end = start
            if name == "script" and self.open_script:
                opening, content_start = self.open_script
                closing = re.match(r'</script\s*>', text[start:], flags=re.IGNORECASE)
                if closing and not text[content_start:start].strip():
                    self.marked.append((opening, start + len(closing.group(0))))
                self.open_script = None

    parser = MountParser()
    parser.feed(text)
    parser.close()
    if parser.marked:
        for number, (start, end) in enumerate(parser.marked):
            parser.patches.append((start, end, tag if number == 0 else ''))
    else:
        point = parser.anchor if parser.anchor is not None else parser.body_end
        if point is not None:
            parser.patches.append((point, point, tag + '\n  '))
    for start, end, replacement in sorted(parser.patches, reverse=True):
        text = text[:start] + replacement + text[end:]
    return text


def ensure_delivery_navigation(target: Path) -> tuple[list[str], list[str]]:
    """Attach four core views plus the explicitly requested optional document view."""
    changed: list[str] = []
    warnings: list[str] = []
    pages = {
        "index.html": "js/delivery-nav.js",
        "version-history.html": "js/delivery-nav.js",
        "docs/interaction.html": "../js/delivery-nav.js",
        "flowcharts/business-process.html": "../js/delivery-nav.js",
        "flowcharts/sequence-interaction.html": "../js/delivery-nav.js",
        "related-systems/index.html": "../js/delivery-nav.js",
    }
    for relative, script_ref in pages.items():
        page_path = target / relative
        if not page_path.exists():
            if relative == "docs/interaction.html":
                continue
            warnings.append(f"缺少 {relative}，未自动加入交付视图内部切换脚本")
            continue

        text = page_path.read_text(encoding="utf-8", errors="ignore")
        if relative in {"index.html", "version-history.html"}:
            mounted = mount_version_projection(text, version_index_script_ref(target))
            if mounted != text:
                page_path.write_text(mounted, encoding="utf-8")
                changed.append(relative)
                text = mounted
        if script_ref in text:
            continue
        if not re.search(r"</body\s*>", text, flags=re.IGNORECASE):
            warnings.append(f"{relative} 缺少 </body>，未自动加入交付视图内部切换脚本")
            continue

        script_tag = f'  <script src="{script_ref}"></script>\n'
        updated = re.sub(
            r"</body\s*>",
            script_tag + "</body>",
            text,
            count=1,
            flags=re.IGNORECASE,
        )
        page_path.write_text(updated, encoding="utf-8")
        changed.append(relative)
    return changed, warnings


def sync_delivery_assets(target: Path, name: str) -> tuple[list[str], list[str], list[str]]:
    """Refresh core delivery infrastructure without creating optional documents."""
    if not target.is_dir():
        raise FileNotFoundError(f"Target project does not exist: {target}")
    templates = load_templates(name, target)
    updated: list[str] = []
    preserved: list[str] = []
    preserved.extend(preserve_legacy_delivery_assets(target))
    obsolete_docs_index = target / "docs" / "index.html"
    if obsolete_docs_index.exists():
        preserved.append("docs/index.html")
    for relative in sorted(DELIVERY_SHELL_TEMPLATE_PATHS):
        destination = target / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        content = templates.get(relative)
        if content is None:
            raise FileNotFoundError(f"Missing delivery template: {relative}")
        destination.write_text(content, encoding="utf-8")
        updated.append(relative)
    for relative in sorted(DELIVERY_CONTENT_TEMPLATE_PATHS):
        destination = target / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        if destination.exists():
            preserved.append(relative)
            continue
        content = templates.get(relative)
        if content is None:
            raise FileNotFoundError(f"Missing delivery template: {relative}")
        destination.write_text(content, encoding="utf-8")
        updated.append(relative)
    warnings: list[str] = []
    delivery_changed, delivery_warnings = ensure_delivery_navigation(target)
    updated.extend(delivery_changed)
    warnings.extend(delivery_warnings)
    return updated, preserved, warnings


def sync_runtime_assets(
    target: Path, name: str
) -> tuple[list[str], list[str], list[str], list[str]]:
    """Refresh loop runtime and delivery shells without touching project content."""
    synced_tools = sync_loop_tools(target)
    updated_delivery, preserved, warnings = sync_delivery_assets(target, name)
    return synced_tools, updated_delivery, preserved, warnings


def apply_seed_files(target: Path, seed_dir: Path | None) -> list[str]:
    """Copy S1-S3 draft artifacts into the generated project."""
    if not seed_dir:
        return []
    seed_dir = seed_dir.expanduser().resolve()
    if not seed_dir.is_dir():
        raise FileNotFoundError(f"Seed directory does not exist: {seed_dir}")
    copied: list[str] = []
    for relative_path in SEED_COPY_PATHS:
        source = seed_dir / relative_path
        if not source.is_file():
            continue
        destination = target / relative_path
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination)
        copied.append(relative_path)
    return copied


def migration_moves(target: Path) -> list[tuple[Path, Path]]:
    moves = []
    for source_name, destination_name in MIGRATION_MAP.items():
        source = target / source_name
        destination = target / destination_name
        if source.exists() and source.resolve() != destination.resolve():
            moves.append((source, destination))
    return moves


def migration_conflicts(moves: list[tuple[Path, Path]]) -> list[Path]:
    return [destination for _, destination in moves if destination.exists()]


def destination_for(path: Path, target: Path, moves: list[tuple[Path, Path]]) -> Path:
    resolved = path.resolve()
    for source, destination in moves:
        if resolved == source.resolve():
            return destination
    return path


def rewrite_html(
    content: str,
    source_html: Path,
    destination_html: Path,
    target: Path,
    moves: list[tuple[Path, Path]],
) -> str:
    move_lookup = {source.resolve(): destination.resolve() for source, destination in moves}

    def replace(match: re.Match[str]) -> str:
        raw_url = match.group("url")
        parsed = urlsplit(raw_url)
        if parsed.scheme or parsed.netloc or raw_url.startswith(
            ("/", "#", "data:", "mailto:", "javascript:")
        ):
            return match.group(0)

        referenced_source = (source_html.parent / parsed.path).resolve()
        referenced_destination = move_lookup.get(referenced_source, referenced_source)
        if (
            referenced_destination == referenced_source
            and destination_html.resolve() == source_html.resolve()
        ):
            return match.group(0)

        relative = Path(
            os.path.relpath(referenced_destination, destination_html.parent.resolve())
        ).as_posix()
        rewritten_url = urlunsplit(("", "", relative, parsed.query, parsed.fragment))
        return (
            f"{match.group('prefix')}{match.group('quote')}"
            f"{rewritten_url}{match.group('quote')}"
        )

    return REFERENCE_PATTERN.sub(replace, content)


def pending_projection_tag_ranges(target: Path, html: Path, content: str) -> list[tuple[int, int]]:
    """S0 may precede a first public projection; all established assets stay required."""
    if html.relative_to(target).as_posix() not in {"index.html", "version-history.html"}:
        return []
    try:
        workflow = json.loads((target / "config/workflow.json").read_text(encoding="utf-8"))
        if not isinstance(workflow, dict) or workflow.get("stage") != "s0":
            return []
        script_ref = version_index_script_ref(target)
        project_root = target.resolve()
        marker = target / "project-version.json"
        if marker.is_symlink():
            return []
        if marker.exists():
            binding = json.loads(marker.read_text(encoding="utf-8"))
            if not isinstance(binding, dict) or not all(isinstance(binding.get(key), str) and binding[key].strip()
                                                       for key in ("registry", "project_id", "version_id")):
                return []
            registry = Path(binding["registry"]).expanduser()
            registry = (registry if registry.is_absolute() else target / registry).resolve()
            if registry.name != "project-versions.json" or registry.parent.name != "memory":
                return []
            project_root = registry.parent.parent
            if project_root not in {target.resolve(), target.resolve().parent}:
                return []
        raw_expected = target / script_ref
        # Inspect the actual display path before resolve can hide a dangling
        # link. Check only its project nodes, not global macOS /tmp aliases.
        project_nodes = [target]
        if script_ref.startswith("../"):
            project_nodes.append(target.parent)
        if raw_expected.is_symlink() or any(node.is_symlink() for node in project_nodes):
            return []
        expected = raw_expected.resolve()
        if expected.parent != project_root or expected.exists() or expected.is_symlink():
            return []
        json_projection = project_root / "版本清单.json"
        if json_projection.exists() or json_projection.is_symlink():
            return []
    except (json.JSONDecodeError, OSError, TypeError, ValueError):
        return []

    offsets = [0] + [match.end() for match in re.finditer(r'\n', content)]
    ranges: list[tuple[int, int]] = []

    class ProjectionTagParser(HTMLParser):
        def handle_starttag(self, tag, attrs):
            names = [key for key, _ in attrs]
            if tag != "script" or names.count("src") != 1 or names.count("data-project-version-index") != 1:
                return
            if dict(attrs).get("src") != script_ref:
                return
            line, column = self.getpos()
            start = offsets[line - 1] + column
            ranges.append((start, start + len(self.get_starttag_text())))

    parser = ProjectionTagParser(convert_charrefs=False)
    parser.feed(content)
    parser.close()
    return ranges if len(ranges) == 1 else []


def local_reference_errors(target: Path, pending: list[str] | None = None) -> list[str]:
    errors = []
    for html in target.rglob("*.html"):
        relative = html.relative_to(target)
        if any(part in {".git", ".loop-history", "node_modules"} for part in relative.parts):
            continue
        if relative.as_posix().startswith(RUNTIME_PACKAGE_ROOT + "/"):
            continue
        content = html.read_text(encoding="utf-8", errors="ignore")
        projection_ranges = pending_projection_tag_ranges(target, html, content)
        for match in REFERENCE_PATTERN.finditer(content):
            raw_url = match.group("url")
            parsed = urlsplit(raw_url)
            if parsed.scheme or parsed.netloc or raw_url.startswith(
                ("/", "#", "data:", "mailto:", "javascript:")
            ):
                continue
            referenced = (html.parent / parsed.path).resolve()
            if not referenced.exists():
                if match.group("prefix").lower().lstrip().startswith("src") and any(start <= match.start() < end for start, end in projection_ranges):
                    if pending is not None:
                        pending.append(f"{html.relative_to(target)} -> {raw_url}（展示投影待建立；批准状态未知）")
                    continue
                errors.append(f"{html.relative_to(target)} -> {raw_url}")
    return errors


def validate_javascript(target: Path) -> list[str]:
    node = shutil.which("node")
    if not node:
        return ["Node.js not available; JavaScript syntax check skipped."]

    errors = []
    for script in target.rglob("*.js"):
        if any(part in {".git", "node_modules"} for part in script.parts):
            continue
        result = subprocess.run(
            [node, "--check", str(script)],
            capture_output=True,
            text=True,
            check=False,
        )
        if result.returncode:
            errors.append(f"{script.relative_to(target)}: {result.stderr.strip()}")
    return errors


def print_migration_plan(
    target: Path, moves: list[tuple[Path, Path]], name: str, applying: bool
) -> None:
    print(f"Migration target: {target}")
    if moves:
        print("Planned safe moves:")
        for source, destination in moves:
            print(f"- {source.relative_to(target)} -> {destination.relative_to(target)}")
    else:
        print("No recognized legacy paths require moving.")

    generated = load_templates(name, target)
    planned_destinations = {destination.resolve() for _, destination in moves}
    missing_support = [
        path
        for path in generated
        if not (target / path).exists()
        and (target / path).resolve() not in planned_destinations
        and not (path.endswith(GITKEEP_SUFFIX) and (target / path).parent.is_dir())
    ]
    missing_support.extend(
        path
        for path in REQUIRED_FRAMEWORK_PATHS
        if not (target / path).exists()
        and (target / path).resolve() not in planned_destinations
    )
    if missing_support:
        print("Missing framework files to create without overwriting:")
        for path in sorted(set(missing_support)):
            print(f"- {path}")

    if not applying:
        print("Run again with --migrate --apply after reviewing this plan.")


def migrate_project(
    target: Path,
    name: str,
    apply: bool,
    seed_dir: Path | None = None,
    reset_iteration_state: bool = False,
) -> int:
    if not target.is_dir():
        print(f"Migration target is not a directory: {target}", file=sys.stderr)
        return 2

    html_sources = [
        path
        for path in target.rglob("*.html")
        if not any(part in {".git", "node_modules"} for part in path.parts)
    ]
    moves = migration_moves(target)
    conflicts = migration_conflicts(moves)
    if conflicts:
        print("Migration stopped because destination files already exist:", file=sys.stderr)
        for path in conflicts:
            print(f"- {path.relative_to(target)}", file=sys.stderr)
        return 2

    print_migration_plan(target, moves, name, apply)
    if not apply:
        return 0

    html_snapshots = {
        html: html.read_text(encoding="utf-8", errors="ignore") for html in html_sources
    }
    for source, destination in moves:
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(source), str(destination))

    for legacy_dir in ("data", "annotations-tool"):
        path = target / legacy_dir
        if path.is_dir() and not any(path.iterdir()):
            path.rmdir()

    for source_html, content in html_snapshots.items():
        destination_html = destination_for(source_html, target, moves)
        rewritten = rewrite_html(content, source_html, destination_html, target, moves)
        destination_html.write_text(rewritten, encoding="utf-8")

    generated = load_templates(name, target)
    created = []
    skip_placeholders: set[str] = set()
    for relative_path, content in generated.items():
        destination = target / relative_path
        if (
            destination.exists()
            or relative_path in skip_placeholders
            or (relative_path.endswith(GITKEEP_SUFFIX) and destination.parent.is_dir())
        ):
            continue
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text(content, encoding="utf-8")
        created.append(relative_path)

    for source_name, relative_path in ANNOTATION_COPY_ASSETS:
        if not (target / relative_path).exists():
            copy_asset(source_name, target, relative_path, merge=True)
            created.append(relative_path)

    for source_name, relative_path in SCRIPT_COPY_ASSETS:
        if not (target / relative_path).exists():
            copy_script_asset(source_name, target, relative_path, merge=True)
            created.append(relative_path)

    legacy_delivery_preserved = preserve_legacy_delivery_assets(target)
    delivery_nav_changed, delivery_nav_warnings = ensure_delivery_navigation(target)
    runtime_synced = sync_runtime_package(target)

    seeded = apply_seed_files(target, seed_dir)
    reset = reset_base_state(target, name) if reset_iteration_state else []
    stripped_data_anno = strip_data_anno_anchors(target) if reset_iteration_state else (0, 0)

    pending_projections: list[str] = []
    reference_errors = local_reference_errors(target, pending_projections)
    syntax_errors = validate_javascript(target)
    print("Migration applied.")
    print(f"Moved files: {len(moves)}")
    print(f"Created missing framework files: {len(created)}")
    for pending_projection in pending_projections:
        print(f"Pending public version projection: {pending_projection}")
    if legacy_delivery_preserved:
        print("Legacy delivery assets preserved: " + ", ".join(legacy_delivery_preserved))
    if delivery_nav_changed:
        print("Delivery pagination updated: " + ", ".join(delivery_nav_changed))
    for warning in delivery_nav_warnings:
        print(f"Delivery pagination warning: {warning}", file=sys.stderr)
    print(f"Synced runtime package files: {len(runtime_synced)}")
    if seeded:
        print(f"Seeded draft files: {len(seeded)}")
    if reset:
        print(f"Reset iteration state files: {len(reset)}")
    if stripped_data_anno[1]:
        print(f"Removed stale data-anno anchors: {stripped_data_anno[1]} attrs in {stripped_data_anno[0]} files")
    if reference_errors:
        print("Broken local references detected:", file=sys.stderr)
        for error in reference_errors:
            print(f"- {error}", file=sys.stderr)
    if syntax_errors:
        print("JavaScript validation notes:", file=sys.stderr)
        for error in syntax_errors:
            print(f"- {error}", file=sys.stderr)
    return 1 if reference_errors or any("skipped" not in item for item in syntax_errors) else 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("target", help="Target project folder")
    parser.add_argument("--name", help="Project display name")
    parser.add_argument("--merge", action="store_true", help="Create missing files only")
    parser.add_argument(
        "--migrate",
        action="store_true",
        help="Analyze an existing project and plan a safe structure migration",
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Apply the migration plan; only valid with --migrate",
    )
    parser.add_argument(
        "--seed-dir",
        type=Path,
        help="Directory containing S1-S3 draft artifacts to copy into the generated project",
    )
    parser.add_argument(
        "--from-base",
        type=Path,
        help="Copy an existing prototype as an iteration base, excluding VCS/dependency/local state and resetting loop-owned files",
    )
    parser.add_argument(
        "--reset-iteration-state",
        action="store_true",
        help="With --migrate --apply, reset annotations, memory, workflow config, CLAUDE.md, and .clauderules for a new iteration project",
    )
    parser.add_argument(
        "--sync-tools",
        action="store_true",
        help="Overwrite an existing generated project's tools/loop_run.py and tools/loop_preflight.py with the current orchestrator scripts",
    )
    parser.add_argument(
        "--sync-runtime",
        action="store_true",
        help="Refresh tools, readable stage skills, and delivery-page shells before continuing an existing project",
    )
    parser.add_argument(
        "--sync-delivery-pages",
        action="store_true",
        help="Install or refresh the five local-HTML delivery pages without replacing existing page content",
    )
    parser.add_argument(
        "--sync-flowcharts",
        action="store_true",
        help="Explicit source-only legacy ProcessOn viewer recovery; preserve existing links and navigation",
    )
    args = parser.parse_args()

    target = Path(args.target).expanduser().resolve()
    name = (args.name or target.name).strip() or "新原型项目"
    if args.sync_flowcharts and any((
        args.sync_runtime, args.sync_delivery_pages, args.sync_tools,
        args.migrate, args.apply, args.from_base, args.reset_iteration_state,
    )):
        parser.error("--sync-flowcharts 是显式旧图集兼容命令，不能与现代同步或迁移命令混用")
    if args.sync_runtime:
        synced_tools, updated_delivery, preserved, warnings = sync_runtime_assets(target, name)
        print(f"Loop runtime synced at: {target}")
        for item in synced_tools:
            print(f"- runtime: {item}")
        for item in updated_delivery:
            print(f"- delivery: {item}")
        for item in preserved:
            print(f"- preserved: {item}")
        for warning in warnings:
            print(f"- warning: {warning}", file=sys.stderr)
        return 0
    if args.sync_delivery_pages:
        updated, preserved, warnings = sync_delivery_assets(target, name)
        print(f"Delivery pages synced at: {target}")
        for item in updated:
            print(f"- updated: {item}")
        for item in preserved:
            print(f"- preserved: {item}")
        for warning in warnings:
            print(f"- warning: {warning}", file=sys.stderr)
        return 0
    if args.sync_flowcharts:
        updated, preserved, warnings = sync_flowchart_assets(target, name)
        print(f"Legacy flowchart viewer synced at: {target}")
        for item in updated:
            print(f"- updated: {item}")
        for item in preserved:
            print(f"- preserved: {item}")
        for warning in warnings:
            print(f"- warning: {warning}", file=sys.stderr)
        return 0
    if args.sync_tools:
        synced = sync_loop_tools(target)
        print(f"Loop tools synced at: {target}")
        for item in synced:
            print(f"- {item}")
        return 0

    if args.apply and not args.migrate:
        parser.error("--apply must be used with --migrate")
    if args.from_base and args.migrate:
        parser.error("--from-base cannot be combined with --migrate")
    if args.reset_iteration_state and not (args.migrate and args.apply):
        parser.error("--reset-iteration-state must be used with --migrate --apply")
    if args.migrate:
        return migrate_project(
            target,
            name,
            args.apply,
            args.seed_dir,
            reset_iteration_state=args.reset_iteration_state,
        )

    copied_from_base: list[str] = []
    if args.from_base:
        copied_from_base = copy_base_project(args.from_base, target)
    reset_from_base = reset_base_state(target, name) if args.from_base else []
    stripped_data_anno_from_base = strip_data_anno_anchors(target) if args.from_base else (0, 0)

    generated = load_templates(name, target)
    annotation_project_id = project_id(name, target)
    today = date.today().isoformat()

    conflicts: list[str] = []
    if not args.from_base:
        conflicts = [path for path in generated if (target / path).exists()]
        conflicts.extend(
            path
            for path in REQUIRED_FRAMEWORK_PATHS
            if (target / path).exists()
        )
    if conflicts and not args.merge:
        print("Refusing to overwrite existing files:", file=sys.stderr)
        for path in sorted(set(conflicts)):
            print(f"- {path}", file=sys.stderr)
        print("Inspect the folder and rerun with --merge to create missing files only.", file=sys.stderr)
        return 2

    target.mkdir(parents=True, exist_ok=True)
    created: list[str] = []
    skipped: list[str] = []

    for relative_path, content in generated.items():
        destination = target / relative_path
        if destination.exists():
            skipped.append(relative_path)
            continue
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text(content, encoding="utf-8")
        created.append(relative_path)

    for source, relative_path in ANNOTATION_COPY_ASSETS:
        status = copy_asset(source, target, relative_path, args.merge)
        if status == "created":
            created.append(relative_path)
        elif status == "skipped":
            skipped.append(relative_path)

    for source, relative_path in SCRIPT_COPY_ASSETS:
        status = copy_script_asset(source, target, relative_path, args.merge)
        if status == "created":
            created.append(relative_path)
        elif status == "skipped":
            skipped.append(relative_path)

    legacy_delivery_preserved = preserve_legacy_delivery_assets(target)
    delivery_nav_changed, delivery_nav_warnings = ensure_delivery_navigation(target)
    runtime_synced = sync_runtime_package(target)

    seeded = apply_seed_files(target, args.seed_dir)

    # Persist project id so it survives folder moves / renames.
    _persist_project_config(target, annotation_project_id, today)

    print(f"Project created at: {target}")
    print(f"Annotation projectId: {annotation_project_id}")
    if copied_from_base:
        print(f"Copied base files: {len(copied_from_base)}")
    if reset_from_base:
        print(f"Reset iteration state files: {len(reset_from_base)}")
    if stripped_data_anno_from_base[1]:
        print(f"Removed stale data-anno anchors: {stripped_data_anno_from_base[1]} attrs in {stripped_data_anno_from_base[0]} files")
    print(f"Created files: {len(created)}")
    if legacy_delivery_preserved:
        print("Legacy delivery assets preserved: " + ", ".join(legacy_delivery_preserved))
    if delivery_nav_changed:
        print("Delivery pagination updated: " + ", ".join(delivery_nav_changed))
    for warning in delivery_nav_warnings:
        print(f"Delivery pagination warning: {warning}", file=sys.stderr)
    print(f"Synced runtime package files: {len(runtime_synced)}")
    if seeded:
        print(f"Seeded draft files: {len(seeded)}")
    if skipped:
        print(f"Skipped existing files: {len(skipped)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
