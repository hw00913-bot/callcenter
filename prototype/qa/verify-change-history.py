"""Verify that every documented D change remains in both delivery formats.

This check reads local files only. It does not rebuild documentation or write
verification artifacts.
"""

from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import json
import re
import sys


ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
DECISION_ID = re.compile(r"^#{2,6}[ \t]+(D-\d{3})(?=[ \t]|[·：:—-]|$)", re.MULTILINE)
ID_IN_TEXT = re.compile(r"\bD-\d{3}\b")
EARLY_IDS = {"D-001"} | {f"D-{number:03}" for number in range(3, 22)}
LATER_IDS = {f"D-{number:03}" for number in range(22, 81)}
REQUIRED_IDS = EARLY_IDS | LATER_IDS
IMPLEMENTATION_LOG = (ROOT / "memory/change-log.md").resolve()
failures = []


def check(condition, message):
    if not condition:
        failures.append(message)


def count_ids(label, ids):
    counts = Counter(ids)
    invalid = sorted(value for value in counts if not re.fullmatch(r"D-\d{3}", value))
    duplicate = sorted(value for value, count in counts.items() if count != 1)
    check(not invalid, f"{label} 含无效 D 编号：{invalid}")
    check(not duplicate, f"{label} 含重复 D 条目：{duplicate}")
    return set(counts)


def local_target(base, href):
    parsed = urlsplit(href.strip().strip("<>"))
    if parsed.scheme or parsed.netloc:
        return None
    return (base / unquote(parsed.path)).resolve()


class ChangePage(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.element_ids = []
        self.links = []
        self.directory_links = []
        self.headings = []
        self.in_sidebar = False
        self.in_directory = False
        self.active_link = None
        self.active_heading = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if "id" in attrs:
            self.element_ids.append(attrs["id"])
        if tag == "aside" and "doc-sidebar" in attrs.get("class", "").split():
            self.in_sidebar = True
        elif tag == "nav" and self.in_sidebar:
            self.in_directory = True
        elif tag == "a":
            href = attrs.get("href", "")
            self.links.append(href)
            if self.in_directory:
                self.active_link = [href, []]
        elif re.fullmatch(r"h[2-6]", tag):
            self.active_heading = [attrs.get("id", ""), []]

    def handle_data(self, data):
        if self.active_link is not None:
            self.active_link[1].append(data)
        if self.active_heading is not None:
            self.active_heading[1].append(data)

    def handle_endtag(self, tag):
        if tag == "a" and self.active_link is not None:
            href, text = self.active_link
            self.directory_links.append((href, "".join(text).strip()))
            self.active_link = None
        elif re.fullmatch(r"h[2-6]", tag) and self.active_heading is not None:
            heading_id, text = self.active_heading
            self.headings.append((heading_id, "".join(text).strip()))
            self.active_heading = None
        elif tag == "nav" and self.in_directory:
            self.in_directory = False
        elif tag == "aside" and self.in_sidebar:
            self.in_sidebar = False


def json_change_ids(path):
    data = json.loads(path.read_text(encoding="utf-8"))
    changes = data.get("changes") if isinstance(data, dict) else None
    check(isinstance(changes, list), f"{path.name} 缺少完整的 changes 数组")
    if not isinstance(changes, list):
        return set()
    ids = []
    for index, item in enumerate(changes):
        value = item.get("id") if isinstance(item, dict) else None
        check(isinstance(value, str), f"{path.name} changes[{index}] 缺少字符串 id")
        ids.append(value if isinstance(value, str) else "")
    return count_ids(path.name, ids)


def main():
    decision_text = (DOCS / "decisions.md").read_text(encoding="utf-8")
    certified_early = count_ids("早期决策源", [
        value for value in DECISION_ID.findall(decision_text) if int(value[2:]) <= 21
    ])
    check(EARLY_IDS <= certified_early,
          f"docs/decisions.md 缺少早期编号：{sorted(EARLY_IDS - certified_early)}")

    canonical_bytes = (DOCS / "change-log.md").read_bytes()
    legacy_bytes = (DOCS / "release-notes.md").read_bytes()
    check(canonical_bytes == legacy_bytes, "release-notes.md 与 change-log.md 不逐字节一致")
    canonical_text = canonical_bytes.decode("utf-8")
    legacy_text = legacy_bytes.decode("utf-8")
    markdown_ids = count_ids("change-log.md", DECISION_ID.findall(canonical_text))
    legacy_ids = count_ids("release-notes.md", DECISION_ID.findall(legacy_text))

    page = ChangePage()
    page.feed((DOCS / "change-log.html").read_text(encoding="utf-8"))
    decision_headings = [
        (heading_id, match.group()) for heading_id, title in page.headings
        if (match := ID_IN_TEXT.match(title)) is not None
    ]
    html_ids = count_ids("change-log.html 标题", [decision_id for _, decision_id in decision_headings])
    duplicate_anchors = sorted(value for value, count in Counter(page.element_ids).items() if count != 1)
    check(not duplicate_anchors, f"change-log.html 存在重复锚点：{duplicate_anchors}")
    anchor_ids = set(page.element_ids)
    heading_targets = {decision_id: heading_id for heading_id, decision_id in decision_headings}
    for heading_id, decision_id in decision_headings:
        check(bool(heading_id) and heading_id in anchor_ids,
              f"change-log.html 条目标题缺少锚点：{decision_id}")
    directory_ids = []
    for href, title in page.directory_links:
        fragment = unquote(urlsplit(href).fragment)
        check(bool(fragment) and fragment in anchor_ids,
              f"change-log.html 目录目标不可达：{title} -> {href}")
        match = ID_IN_TEXT.match(title)
        if match is None:
            continue
        decision_id = match.group()
        directory_ids.append(decision_id)
        check(fragment == decision_id or fragment == heading_targets.get(decision_id),
              f"change-log.html 目录条目指向错误编号：{title} -> {href}")
    directory_set = count_ids("change-log.html 目录", directory_ids)
    check(directory_set == html_ids,
          f"HTML 标题与目录编号不一致：仅标题 {sorted(html_ids-directory_set)}；仅目录 {sorted(directory_set-html_ids)}")

    json_ids = json_change_ids(DOCS / "change-log.json")
    legacy_json_ids = json_change_ids(DOCS / "release-notes.json")
    sets = {
        "change-log.md": markdown_ids,
        "change-log.html": html_ids,
        "change-log.json": json_ids,
        "release-notes.md": legacy_ids,
        "release-notes.json": legacy_json_ids,
    }
    for name, ids in sets.items():
        check(REQUIRED_IDS <= ids,
              f"{name} 缺少必须保留的 D 条目：{sorted(REQUIRED_IDS-ids)}")
        check(ids == markdown_ids,
              f"{name} 与统一 Markdown 条目不一致：仅本文件 {sorted(ids-markdown_ids)}；仅统一页 {sorted(markdown_ids-ids)}")

    md_links = re.findall(r"\]\(([^)]+)\)", canonical_text)
    check(IMPLEMENTATION_LOG.is_file(), "原始实施流水文件不存在")
    check(any(local_target(DOCS, href) == IMPLEMENTATION_LOG for href in md_links),
          "change-log.md 缺少原始实施流水链接")
    check(any(local_target(DOCS, href) == IMPLEMENTATION_LOG for href in page.links),
          "change-log.html 缺少原始实施流水链接")

    result = {
        "result": "pass" if not failures else "fail",
        "requiredCount": len(REQUIRED_IDS),
        "documentedCount": len(markdown_ids),
        "sources": {name: len(ids) for name, ids in sets.items()},
        "failures": failures,
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if not failures else 1


if __name__ == "__main__":
    sys.exit(main())
