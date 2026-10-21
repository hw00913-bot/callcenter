"""Export the complete change record from its authored Markdown source.

docs/change-log.md is the single source of truth. This script never rewrites it;
the HTML, release-notes compatibility files, and JSON indexes are derived from it.
"""

from collections import Counter
from html import escape
import json
import re

from build_delivery import DOC, dump, heading_id, markdown_html, shell


HEADING = re.compile(r"^##[ \t]+(.+?)[ \t]*$", re.M)
DECISION = re.compile(r"^(D-(\d{3}))(?:\s+|$)(.*)$")
VERSION_LINE = re.compile(
    r"^版本[ \t]+([^\s·]+)[ \t]*·[ \t]*(\d{4}-\d{2}-\d{2})[ \t]*$", re.M
)
PREVIOUS_LINE = re.compile(r"^上一版业务文档：([^。\s]+)", re.M)


def sections(markdown):
    """Return second-level sections without discarding their original body text."""
    matches = list(HEADING.finditer(markdown))
    return [
        {
            "heading": match.group(1).strip(),
            "body": markdown[match.end():matches[index + 1].start()].strip()
            if index + 1 < len(matches) else markdown[match.end():].strip(),
        }
        for index, match in enumerate(matches)
    ]


def unique_matches(pattern, value):
    return list(dict.fromkeys(re.findall(pattern, value)))


def labeled_line(body, *labels):
    for label in labels:
        match = re.search(r"^" + re.escape(label) + r"：\s*(.+)$", body, re.M)
        if match:
            return match.group(1).strip()
    return None


def first_paragraph(body):
    for paragraph in re.split(r"\n\s*\n", body):
        paragraph = paragraph.strip()
        if paragraph:
            return re.sub(r"^[-*] \s*", "", paragraph.splitlines()[0]).strip()
    return ""


def parse_history(markdown, previous_changes):
    all_sections = sections(markdown)
    start = next(
        (index for index, section in enumerate(all_sections)
         if section["heading"] == "修改清单"),
        None,
    )
    if start is None:
        raise ValueError("change-log.md 缺少“修改清单”标题；未生成任何文件")

    old_by_id = {row["id"]: row for row in previous_changes if "id" in row}
    changes = []
    historical_notes = []
    for section in all_sections[start + 1:]:
        heading, body = section["heading"], section["body"]
        match = DECISION.match(heading)
        if not match:
            historical_notes.append(dict(title=heading, body=body))
            continue

        decision_id = match.group(1)
        title = match.group(3).lstrip("·—–-:： ").strip()
        if not title or not body:
            raise ValueError(f"{decision_id} 缺少标题或正文；未生成任何文件")

        # Carry forward evidence metadata recorded by earlier structured exports.
        # The heading and body always come from the authored Markdown.
        row = dict(old_by_id.get(decision_id, {}))
        row.update(id=decision_id, title=title, heading=heading, body=body)
        row["before"] = labeled_line(body, "修改前") or row.get("before", "")
        row["after"] = labeled_line(body, "当次处理", "当前处理") or first_paragraph(body)
        row["acceptance"] = labeled_line(body, "核对重点") or row.get("acceptance", "")
        row.setdefault("sections", unique_matches(r"\bFS-\d{2}\b", body))
        row.setdefault("fields", unique_matches(r"\bFA-\d{3}\b", body))
        row.setdefault("rules", [])
        row.setdefault("sources", unique_matches(r"\b(?:API|DOC)-\d{3}\b", body))
        row.setdefault(
            "runtime",
            unique_matches(
                r"\[[^\]]+\]\(\.\./((?:js|assets|mock|documentation|qa)/[^)#]+)\)",
                body,
            ),
        )
        changes.append(row)

    numbers = [int(row["id"][2:]) for row in changes]
    duplicate_ids = sorted(number for number, count in Counter(numbers).items() if count > 1)
    if duplicate_ids:
        raise ValueError(f"变更编号重复：{duplicate_ids}；未生成任何文件")

    # D-002 was never assigned in the original decisions. Preserve that gap
    # without inventing a decision, while guarding every evidenced entry.
    latest = max(numbers, default=0)
    expected = {1, *range(3, latest + 1)} if latest >= 80 else set()
    missing = sorted(expected - set(numbers))
    unexpected = sorted(set(numbers) - expected)
    if latest < 80 or missing or unexpected:
        raise ValueError(
            f"历史变更应包含 D-001、D-003 至 D-{latest:03d}（至少 D-080）；"
            f"缺失 {missing}，额外编号 {unexpected}；未生成任何文件"
        )
    return all_sections, changes, historical_notes


def current_change_ids(all_sections, known_ids, newest_id):
    """Read the current release list from the authored 本版变化 table."""
    current = next(
        (section["body"] for section in all_sections
         if section["heading"] == "本版变化"),
        "",
    )
    ids = []
    for line in current.splitlines():
        if not line.startswith("|"):
            continue
        first_cell = line.strip().strip("|").split("|", 1)[0]
        match = re.search(r"\bD-\d{3}\b", first_cell)
        if match and match.group() in known_ids and match.group() not in ids:
            ids.append(match.group())
    return ids or [newest_id]


def markdown_navigation(markdown):
    """Match markdown_html's heading IDs, including duplicate suffixes."""
    headings = Counter()
    navigation = []
    in_code = False
    for line in markdown.splitlines():
        if line.startswith("```"):
            in_code = not in_code
            continue
        if in_code:
            continue
        match = re.match(r"^(#{1,6}) (.+)", line)
        if not match:
            continue
        title = match.group(2)
        anchor = heading_id(title)
        headings[anchor] += 1
        if headings[anchor] > 1:
            anchor += f"-{headings[anchor]}"
        if len(match.group(1)) == 2:
            navigation.append((anchor, title))
    return navigation


def rendered_html(markdown, version):
    content = markdown_html(markdown)
    content = content.replace(
        '<h2 id="本版数量与边界">',
        '<span id="本次交付范围"></span><h2 id="本版数量与边界">',
    )
    # Existing links use both #D-080 and the longer heading slug.
    content = re.sub(
        r'(<h2 id="[^"]+">)(D-\d{3})(?=\s|<)',
        lambda match: f'<span id="{match.group(2)}"></span>{match.group(0)}',
        content,
    )
    html = shell(
        "版本与变更记录", content, markdown_navigation(markdown),
        "change-log.md", "changes",
    )
    # shell shares functional-spec styling; use the Markdown's revision for
    # these cache keys, rather than its older functional_content.VERSION.
    return re.sub(
        r'((?:delivery-docs\.css|documentation-nav\.js)\?v=)[^"]+',
        lambda match: match.group(1) + escape(version, quote=True),
        html,
    )


def current_counts():
    """Refresh existing count metadata from the other generated documents."""
    spec = json.loads((DOC / "functional-spec.json").read_text())
    fields = json.loads((DOC / "field-alignment.json").read_text())
    rules = json.loads((DOC / "rules-appendix.json").read_text())
    pending = json.loads((DOC / "remaining-confirmations.json").read_text())
    return dict(
        functions=spec["featureCount"],
        plannedPages=spec["pageCount"],
        fieldMappings=len(fields["mappings"]),
        appendixRules=rules["ruleCount"],
        supplierDocuments=len(fields["sources"]),
        supplierConfirmations=len(pending["items"]),
        preparations=len(pending["preparations"]),
    )


def main():
    markdown = (DOC / "change-log.md").read_text()
    version_match = VERSION_LINE.search(markdown)
    if not version_match:
        raise ValueError("change-log.md 缺少“版本 <编号> · <日期>”行；未生成任何文件")
    version, date = version_match.groups()

    old_change_log_path = DOC / "change-log.json"
    old_release_path = DOC / "release-notes.json"
    old_change_log = json.loads(old_change_log_path.read_text()) if old_change_log_path.exists() else {}
    old_release = json.loads(old_release_path.read_text()) if old_release_path.exists() else {}
    all_sections, changes, historical_notes = parse_history(
        markdown, old_change_log.get("changes", []),
    )
    change_by_id = {row["id"]: row for row in changes}
    latest_id = max(change_by_id, key=lambda value: int(value[2:]))
    current_ids = current_change_ids(all_sections, change_by_id, latest_id)
    current_changes = [change_by_id[decision_id] for decision_id in current_ids]
    previous_match = PREVIOUS_LINE.search(markdown)
    previous_version = (
        previous_match.group(1) if previous_match else
        old_change_log.get("previousDocumentVersion", "")
    )
    counts = current_counts()

    current_release = dict(old_release or old_change_log.get("currentRelease", {}))
    current_release.update(
        version=version, date=date, previousVersion=previous_version,
        changeIds=current_ids, changes=current_changes, counts=counts,
    )
    for compatibility_key in (
        "canonicalDocument", "compatibilityExport", "historicalChanges",
        "historicalNotes", "currentChanges",
    ):
        current_release.pop(compatibility_key, None)

    intro = markdown.split("\n## ", 1)[0].splitlines()
    overview = [line.strip() for line in intro if line.strip() and not line.startswith("#")]
    change_log = dict(old_change_log)
    change_log.update(
        version=version, date=date, title="版本与变更记录",
        canonicalDocument="change-log.html", documentationRevision=version,
        documentationChanges=[row["after"] for row in current_changes],
        previousDocumentVersion=previous_version,
        basis=overview[1] if len(overview) > 1 else "以 change-log.md 为准",
        scope=overview[2] if len(overview) > 2 else "完整历史变更",
        counts=counts, currentRelease=current_release, changes=changes,
        historicalNotes=historical_notes,
    )
    release_notes = dict(current_release)
    release_notes.update(
        canonicalDocument="change-log.json", compatibilityExport=True,
        changes=changes, currentChanges=current_changes,
        historicalChanges=changes, historicalNotes=historical_notes,
    )

    # Render and validate everything before touching generated files.
    html = rendered_html(markdown, version)
    expected_anchors = [f'id="{row["id"]}"' for row in changes]
    if any(anchor not in html for anchor in expected_anchors):
        raise ValueError("生成的 HTML 缺少变更编号锚点；未生成任何文件")
    (DOC / "change-log.html").write_text(html)
    (DOC / "release-notes.md").write_text(markdown)
    (DOC / "release-notes.html").write_text(
        '<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8">'
        '<title>版本与变更记录</title><link rel="canonical" href="change-log.html">'
        '<script>location.replace("change-log.html"+location.search+location.hash);</script>'
        '</head><body><a href="change-log.html">版本与变更记录</a></body></html>'
    )
    dump(old_change_log_path, change_log)
    dump(old_release_path, release_notes)
    print(json.dumps({
        "version": version, "currentChanges": len(current_changes),
        "historicalChanges": len(changes), "historicalNotes": len(historical_notes),
        "counts": counts,
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
