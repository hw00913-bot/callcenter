"""Read registered interface evidence from LLM Wiki without modifying the vault.

Current documents and historical project evidence deliberately have separate APIs.
All source HTML is returned as text; this module never renders or executes it.
"""
from __future__ import annotations

import argparse
import hashlib
import io
import json
import os
from pathlib import Path, PurePosixPath
import re
import sys
import zipfile


ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / "config/interface-sources.json"


class InterfaceSourceError(RuntimeError):
    """A missing, changed, unregistered or unsafe interface source."""


def _json_bytes(data: bytes, description: str) -> dict:
    try:
        result = json.loads(data.decode("utf-8"))
    except (UnicodeError, ValueError) as exc:
        raise InterfaceSourceError(f"{description}: invalid UTF-8 JSON") from exc
    if not isinstance(result, dict):
        raise InterfaceSourceError(f"{description}: expected a JSON object")
    return result


def _read(path: Path) -> bytes:
    try:
        return path.read_bytes()
    except OSError as exc:
        raise InterfaceSourceError(f"Cannot read {path}: {exc.strerror or type(exc).__name__}") from exc


def _relative_path(value: str) -> PurePosixPath:
    if not isinstance(value, str) or not value or "\\" in value or "\x00" in value:
        raise InterfaceSourceError("Invalid relative source path")
    path = PurePosixPath(value)
    if path.is_absolute() or any(part in (".", "..") for part in value.split("/")):
        raise InterfaceSourceError(f"Unsafe relative source path: {value}")
    if ":" in path.parts[0]:
        raise InterfaceSourceError(f"Unsafe relative source path: {value}")
    return path


def _inside(base: Path, value: str) -> Path:
    relative = _relative_path(value)
    resolved = (base / relative).resolve()
    if not resolved.is_relative_to(base.resolve()):
        raise InterfaceSourceError(f"Source path escapes its root: {value}")
    return resolved


def _check_bytes(data: bytes, record: dict, description: str) -> None:
    size, sha = record.get("size"), record.get("sha256")
    if not isinstance(size, int) or isinstance(size, bool) or size < 0:
        raise InterfaceSourceError(f"{description}: invalid expected size")
    if not isinstance(sha, str) or not re.fullmatch(r"[0-9a-f]{64}", sha):
        raise InterfaceSourceError(f"{description}: invalid expected SHA-256")
    if len(data) != size or hashlib.sha256(data).hexdigest() != sha:
        raise InterfaceSourceError(f"{description}: size/SHA-256 mismatch; source must be reviewed and rebound")


def _frontmatter(text: str) -> dict:
    lines = text.splitlines()
    if not lines or lines[0] != "---":
        raise InterfaceSourceError("Wiki page has no frontmatter")
    try:
        end = lines.index("---", 1)
    except ValueError as exc:
        raise InterfaceSourceError("Wiki page has unterminated frontmatter") from exc
    result = {}
    for line in lines[1:end]:
        match = re.fullmatch(r"([a-z_]+):\s*(.*)", line)
        if match:
            key, value = match.groups()
            if key in result:
                raise InterfaceSourceError(f"Duplicate wiki metadata: {key}")
            result[key] = value.strip().strip('"\'')
    sources = result.get("sources", "")
    if not sources.startswith("[") or not sources.endswith("]"):
        raise InterfaceSourceError("Wiki page sources must be an inline list")
    result["sources"] = [value.strip().strip('"\'') for value in sources[1:-1].split(",") if value.strip()]
    return result


class InterfaceSources:
    """One read-only resolver; config_path is useful for isolated validation."""

    def __init__(self, wiki_root=None, config_path=None, prototype_root=None):
        self.root = Path(prototype_root or ROOT).resolve()
        self.config_path = Path(config_path or self.root / "config/interface-sources.json")
        self.config = _json_bytes(_read(self.config_path), "Interface-source configuration")
        if self.config.get("schema_version") != 1 or self.config.get("mode") != "llmwiki-read-only":
            raise InterfaceSourceError("Unsupported interface-source configuration")
        if self.config.get("fallbackToLocalSnapshots") is not False:
            raise InterfaceSourceError("Current interface reads must not fall back to local snapshots")
        for key in ["sourceIndex", "manifest", "inventory", "moc"]:
            _relative_path(self.config.get(key))
        env_key = self.config.get("wikiRootEnvironment", "LLM_WIKI_ROOT")
        if not isinstance(env_key, str) or not re.fullmatch(r"[A-Z][A-Z0-9_]*", env_key):
            raise InterfaceSourceError("Invalid Wiki-root environment-variable name")
        configured_root = wiki_root or os.environ.get(env_key) or self.config.get("wikiRoot")
        if not configured_root:
            raise InterfaceSourceError("LLM Wiki root is required; set LLM_WIKI_ROOT or --wiki-root")
        self.wiki_root = Path(configured_root).expanduser().resolve()
        self.index = _json_bytes(_read(_inside(self.root, self.config["sourceIndex"])), "Interface-source index")
        self.sources, self.pages = self._validate_index()
        self._inventory = None
        self._manifest = None
        self._moc = None
        self._verified_pages = {}

    def _validate_index(self):
        index = self.index
        if index.get("schema_version") != 1 or index.get("readingMode") != "llmwiki-read-only":
            raise InterfaceSourceError("Unsupported interface-source index")
        rows, pages = index.get("sources"), index.get("wiki_pages")
        if not isinstance(rows, list) or index.get("sourceCount") != len(rows) or not rows:
            raise InterfaceSourceError("Interface-source index count is invalid")
        supplemental_count = sum(isinstance(row, dict) and row.get("supplemental") is True for row in rows)
        if index.get("legacySourceCount") != len(rows) - supplemental_count or index.get("supplementalSourceCount") != supplemental_count:
            raise InterfaceSourceError("Legacy/supplemental source counts do not match the index")
        if not isinstance(pages, list) or not isinstance(index.get("registrations"), dict):
            raise InterfaceSourceError("Interface-source index has no page/registration metadata")
        source_map, page_map = {}, {}
        for page in pages:
            if not isinstance(page, dict) or not page.get("id") or page["id"] in page_map:
                raise InterfaceSourceError("Duplicate or invalid Wiki page ID")
            _relative_path(page.get("path"))
            if not page["path"].startswith("wiki/"):
                raise InterfaceSourceError("Wiki page path must be inside wiki/")
            page_map[page["id"]] = page
        for row in rows:
            if not isinstance(row, dict) or not row.get("id") or row["id"] in source_map:
                raise InterfaceSourceError("Duplicate or invalid interface-source ID")
            if row.get("sourceKey") not in index["registrations"] or row.get("wiki_ref") not in page_map:
                raise InterfaceSourceError(f"{row['id']}: missing source registration or Wiki page binding")
            page = page_map[row["wiki_ref"]]
            if page["sourceKey"] != row["sourceKey"] or row.get("wiki_path") != page["path"]:
                raise InterfaceSourceError(f"{row['id']}: inconsistent Wiki page/source binding")
            if row.get("wiki_status") != page.get("status") or row.get("knowledge_mode") != page.get("knowledge_mode"):
                raise InterfaceSourceError(f"{row['id']}: inconsistent Wiki page status")
            if not isinstance(row.get("documents"), dict) or set(row["documents"]) != {"markdown", "html"}:
                raise InterfaceSourceError(f"{row['id']}: Markdown and HTML metadata are required")
            for fmt, record in row["documents"].items():
                if not isinstance(record, dict):
                    raise InterfaceSourceError(f"{row['id']}: invalid {fmt} metadata")
                _relative_path(record.get("path"))
            source_map[row["id"]] = row
        return source_map, page_map

    def _registry(self):
        if self._inventory is not None:
            return
        inventory = _json_bytes(_read(_inside(self.wiki_root, self.config["inventory"])), "Wiki inventory")
        if inventory.get("schema_version") != 1 or not isinstance(inventory.get("entries"), dict):
            raise InterfaceSourceError("Unsupported Wiki inventory")
        manifest_text = _read(_inside(self.wiki_root, self.config["manifest"])).decode("utf-8")
        manifest = {}
        for line in manifest_text.splitlines():
            if not line.startswith("|"):
                continue
            columns = [cell.strip().strip("`") for cell in line.strip().strip("|").split("|")]
            if len(columns) != 8 or columns[6] not in {"active", "superseded", "historical"}:
                continue
            source_id, category, kind, path, captured, version, relationship, targets = columns
            key = f"{source_id}@{version}"
            if key in manifest:
                raise InterfaceSourceError(f"Duplicate manifest registration: {key}")
            manifest[key] = {"sourceId": source_id, "category": category, "kind": kind,
                             "manifestPath": path, "capturedAt": captured, "version": version,
                             "relationship": relationship, "targets": [value.strip() for value in targets.split(",")]}
        moc = _read(_inside(self.wiki_root, self.config["moc"])).decode("utf-8")
        for key, expected in self.index["registrations"].items():
            actual = manifest.get(key)
            if not actual:
                raise InterfaceSourceError(f"Wiki manifest registration is missing: {key}")
            if key != f"{expected.get('sourceId')}@{expected.get('version')}":
                raise InterfaceSourceError(f"Source ID/version do not match registration key: {key}")
            for field in ["sourceId", "version", "relationship", "manifestPath", "capturedAt"]:
                if actual[field] != expected.get(field):
                    raise InterfaceSourceError(f"{key}: manifest {field} changed; review the binding")
            if actual["kind"] != expected.get("sourceType"):
                raise InterfaceSourceError(f"{key}: registered source type changed; review the binding")
            if actual["relationship"] != "active" or sum(row["relationship"] == "active" and row["sourceId"] == actual["sourceId"] for row in manifest.values()) != 1:
                raise InterfaceSourceError(f"{key}: source must be the only active version in its family")
            version_numbers = [int(row["version"][1:]) for row in manifest.values()
                               if row["sourceId"] == actual["sourceId"] and row["relationship"] != "historical"
                               and re.fullmatch(r"v\d+", row["version"])]
            if not re.fullmatch(r"v\d+", actual["version"]) or int(actual["version"][1:]) != max(version_numbers):
                raise InterfaceSourceError(f"{key}: active source is not the highest non-historical version")
            entry = inventory["entries"].get(key)
            if not isinstance(entry, dict) or entry.get("manifest_path") != actual["manifestPath"] or entry.get("mode") != expected.get("inventoryMode") or entry.get("mode") != "snapshot":
                raise InterfaceSourceError(f"{key}: inventory must bind the registered independent snapshot")
            _relative_path(actual["manifestPath"].rstrip("/"))
            if actual["category"] != "external" or not actual["manifestPath"].startswith("external/"):
                raise InterfaceSourceError(f"{key}: expected external interface evidence")
            registered = {}
            if not isinstance(entry.get("files"), list):
                raise InterfaceSourceError(f"{key}: inventory files are invalid")
            for record in entry["files"]:
                if not isinstance(record, dict):
                    raise InterfaceSourceError(f"{key}: invalid inventory record")
                relative = record.get("path")
                _relative_path(relative)
                if not relative.startswith(actual["manifestPath"]) or relative in registered:
                    raise InterfaceSourceError(f"{key}: duplicate/out-of-snapshot inventory file")
                registered[relative] = record
            entry["file_map"] = registered
        self._inventory, self._manifest, self._moc = inventory, manifest, moc

    def _page(self, row):
        self._registry()
        page_id = row["wiki_ref"]
        if page_id not in self._verified_pages:
            expected = self.pages[page_id]
            text_bytes = _read(_inside(self.wiki_root, expected["path"]))
            _check_bytes(text_bytes, expected, f"Wiki page {page_id}")
            text = text_bytes.decode("utf-8")
            actual = _frontmatter(text)
            for field in ["id", "status", "knowledge_mode", "updated"]:
                if actual.get(field) != expected.get(field):
                    raise InterfaceSourceError(f"{page_id}: Wiki metadata {field} changed")
            if actual["status"] not in {"current", "partial"} or actual["knowledge_mode"] != "current-only":
                raise InterfaceSourceError(f"{page_id}: Wiki page is not consumable current-only knowledge")
            source_key = expected["sourceKey"]
            if f"raw/{source_key}" not in actual["sources"] or page_id not in self._manifest[source_key]["targets"]:
                raise InterfaceSourceError(f"{page_id}: Wiki/manifest source binding is missing")
            moc_pattern = r"^\|\s*" + re.escape(page_id) + r"\s*\|[^\n]*\|\s*" + re.escape(actual["status"]) + r"\s*\|\s*$"
            if not re.search(moc_pattern, self._moc, re.M):
                raise InterfaceSourceError(f"{page_id}: Wiki MOC ID/status binding is missing")
            self._verified_pages[page_id] = (actual, text)
        actual, text = self._verified_pages[page_id]
        if "`" + row.get("officialPath", "") + "`" not in text:
            raise InterfaceSourceError(f"{row['id']}: official document is absent from its Wiki topic")
        return actual

    def _document_bytes(self, row, format):
        self._page(row)
        expected = row["documents"][format]
        path = expected["path"]
        registration = self.index["registrations"][row["sourceKey"]]
        if not path.startswith(registration["manifestPath"]):
            raise InterfaceSourceError(f"{row['id']}: document escapes its source snapshot")
        record = self._inventory["entries"][row["sourceKey"]]["file_map"].get(path)
        if not record or any(record.get(key) != expected.get(key) for key in ["size", "sha256"]):
            raise InterfaceSourceError(f"{row['id']}: index/inventory document binding changed")
        data = _read(_inside(self.wiki_root / "raw", path))
        _check_bytes(data, expected, f"{row['id']} {format} document")
        return data

    def read_document(self, source_id, format="markdown"):
        if format not in {"markdown", "html"}:
            raise InterfaceSourceError("Document format must be markdown or html")
        row = self.sources.get(source_id)
        if row is None:
            raise InterfaceSourceError(f"Unknown interface-source ID: {source_id}")
        try:
            return self._document_bytes(row, format).decode("utf-8")
        except UnicodeError as exc:
            raise InterfaceSourceError(f"{source_id}: document is not valid UTF-8") from exc

    def verify_all(self):
        errors, file_count, total_bytes = [], 0, 0
        try:
            self._registry()
        except (InterfaceSourceError, UnicodeError, KeyError, TypeError) as exc:
            errors.append(str(exc))
        if not errors:
            for row in self.sources.values():
                for format in ["markdown", "html"]:
                    try:
                        data = self._document_bytes(row, format)
                        file_count += 1
                        total_bytes += len(data)
                    except (InterfaceSourceError, UnicodeError, KeyError, TypeError) as exc:
                        errors.append(f"{row['id']} {format}: {exc}")
        return {"ok": not errors, "source_count": len(self.sources),
                "legacy_source_count": self.index["legacySourceCount"],
                "supplemental_source_count": self.index["supplementalSourceCount"], "file_count": file_count,
                "bytes": total_bytes, "wiki_root": str(self.wiki_root), "errors": errors,
                "wiki_pages": [{"id": page["id"], "status": page["status"],
                                "knowledge_mode": page["knowledge_mode"]} for page in self.pages.values()]}

    def legacy_snapshot_bytes(self, relativepath):
        """Read original archived bytes for historical validation, never current reads."""
        if self.config.get("legacyReadPolicy") != "historical-only":
            raise InterfaceSourceError("Historical archive policy is required")
        member = str(_relative_path(relativepath))
        if not member.startswith("references/alicti/"):
            member = "references/alicti/" + member
        _relative_path(member)
        archive_value = self.config.get("legacyArchive")
        if not isinstance(archive_value, str) or not archive_value:
            raise InterfaceSourceError("Historical interface archive is not configured")
        archive = (self.root / archive_value).resolve()
        try:
            archive_data = _read(archive)
            _check_bytes(archive_data, {"size": self.config.get("legacyArchiveSize"),
                                        "sha256": self.config.get("legacyArchiveSha256")},
                         "Historical interface archive")
            with zipfile.ZipFile(io.BytesIO(archive_data), "r") as bundle:
                names = bundle.namelist()
                if len(names) != len(set(names)):
                    raise InterfaceSourceError("Historical archive has duplicate members")
                manifest_name = str(_relative_path(self.config.get("legacyArchiveManifest", "archive-manifest.json")))
                if bundle.getinfo(manifest_name).file_size > 2 * 1024 * 1024:
                    raise InterfaceSourceError("Historical archive manifest exceeds the supported size")
                manifest = _json_bytes(bundle.read(manifest_name), "Historical archive manifest")
                if manifest.get("schema_version") != 1 or not isinstance(manifest.get("files"), list):
                    raise InterfaceSourceError("Unsupported historical archive manifest")
                records = {}
                for record in manifest["files"]:
                    if not isinstance(record, dict):
                        raise InterfaceSourceError("Invalid historical archive record")
                    path = str(_relative_path(record.get("path")))
                    if not path.startswith("references/alicti/") or path in records:
                        raise InterfaceSourceError("Historical archive records are duplicate or out of scope")
                    records[path] = record
                if member not in records:
                    raise InterfaceSourceError(f"Historical snapshot is not registered: {member}")
                if set(names) != set(records) | {manifest_name}:
                    raise InterfaceSourceError("Historical archive file set differs from its manifest")
                if bundle.getinfo(member).file_size != records[member].get("size"):
                    raise InterfaceSourceError(f"{member}: archive-member size differs from its manifest")
                data = bundle.read(member)
                _check_bytes(data, records[member], member)
                return data
        except (OSError, zipfile.BadZipFile, KeyError) as exc:
            raise InterfaceSourceError(f"Cannot read registered historical archive: {archive}") from exc


def load_index(wiki_root=None):
    """Load and validate the local metadata index without reading source bodies."""
    return InterfaceSources(wiki_root=wiki_root).index


def verify_all(wiki_root=None):
    return InterfaceSources(wiki_root=wiki_root).verify_all()


def read_document(source_id, format="markdown", wiki_root=None):
    return InterfaceSources(wiki_root=wiki_root).read_document(source_id, format)


def legacy_snapshot_bytes(relativepath):
    return InterfaceSources().legacy_snapshot_bytes(relativepath)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--wiki-root", help="Read-only Wiki root (overrides LLM_WIKI_ROOT and configuration)")
    actions = parser.add_subparsers(dest="action", required=True)
    actions.add_parser("verify", help="Verify every indexed current document and its source registration")
    read = actions.add_parser("read", help="Read a registered current interface document as UTF-8 text")
    read.add_argument("source_id")
    read.add_argument("--format", choices=["markdown", "html"], default="markdown")
    legacy = actions.add_parser("legacy", help="Read a historical project snapshot from the verified archive")
    legacy.add_argument("relativepath")
    args = parser.parse_args(argv)
    try:
        resolver = InterfaceSources(wiki_root=args.wiki_root)
        if args.action == "verify":
            result = resolver.verify_all()
            print(json.dumps(result, ensure_ascii=False, indent=2))
            return 0 if result["ok"] else 1
        if args.action == "read":
            sys.stdout.write(resolver.read_document(args.source_id, args.format))
        else:
            sys.stdout.buffer.write(resolver.legacy_snapshot_bytes(args.relativepath))
        return 0
    except (InterfaceSourceError, KeyError, TypeError, UnicodeError) as exc:
        print(f"Interface source verification failed: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
