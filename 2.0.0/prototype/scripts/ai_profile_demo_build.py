"""Correct seven explicitly identified demo phone literals at build time only.

This is sample-data authoring. It is not a production identity resolver, masked
phone recovery, runtime source join, or saved-data migration.
"""
from pathlib import Path
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]
FACTS = ROOT / 'mock/ai-profile-phone-facts.json'
DECLARATION = re.compile(r'var MockClueRecordRows = \[[\s\S]*?\n\];')


def _string_field(chunk, name):
    values = re.findall(r'\b' + re.escape(name) + r"\s*:\s*'([^'\\]*)'", chunk)
    if len(values) > 1:
        raise ValueError('Ambiguous AI demo source field: ' + name)
    return values[0] if values else None


def transform(kind, path, code):
    if kind != 'ai' or path != 'mock/data.js':
        return code
    facts = json.loads(FACTS.read_text())
    if facts.get('schema') != 'ai-profile-demo-phone-facts@1' or facts.get('scope') != 'DEMO_ONLY':
        raise ValueError('AI demo phone facts require an explicit demo-only scope')
    source = facts.get('source', {})
    if source.get('kind') != kind or source.get('path') != path or source.get('declaration') != 'MockClueRecordRows':
        raise ValueError('AI demo source identity changed')
    declarations = list(DECLARATION.finditer(code))
    if len(declarations) != 1:
        raise ValueError('AI demo followup declaration is missing or repeated')
    match = declarations[0]
    original = match.group(0)
    if hashlib.sha256(original.encode()).hexdigest() != source.get('expectedDeclarationSha256'):
        raise ValueError('AI demo followup facts changed; review explicit sample correspondence before building')
    starts = list(re.finditer(r'(?m)^  \{ phone: ', original))
    if len(starts) != source.get('expectedRows') or len(starts) != 12:
        raise ValueError('AI demo followup row layout changed')
    entries = facts.get('rows', [])
    if len(entries) != 7:
        raise ValueError('AI demo phone correction must identify exactly seven rows')
    identities = [(row.get('platform'), row.get('originalPhone')) for row in entries]
    if len(set(identities)) != 7 or len({row.get('fullPhone') for row in entries}) != 7:
        raise ValueError('AI demo phone correspondences are not unique')
    chunks = []
    seen = set()
    for index, start in enumerate(starts):
        end = starts[index + 1].start() if index + 1 < len(starts) else len(original)
        chunk = original[start.start():end]
        identity = (_string_field(chunk, 'platform'), _string_field(chunk, 'phone'))
        if identity in identities:
            row = entries[identities.index(identity)]
            if identity in seen or not re.fullmatch(r'1[3-9]\d{9}', row.get('fullPhone', '')):
                raise ValueError('AI demo phone correction is repeated or incomplete')
            for key, expected in row.get('expected', {}).items():
                if key not in {'sceneName', 'lastVisitTime', 'callid', 'taskId', 'batchId'} or _string_field(chunk, key) != expected:
                    raise ValueError('AI demo row identity changed: ' + str(identity) + ' / ' + key)
            old = "phone: '" + row['originalPhone'] + "'"
            if chunk.count(old) != 1:
                raise ValueError('AI demo phone literal changed')
            chunk = chunk.replace(old, "phone: '" + row['fullPhone'] + "'", 1)
            seen.add(identity)
        chunks.append(chunk)
    if len(seen) != 7:
        raise ValueError('AI demo phone correction did not resolve exactly seven known fixture rows')
    changed = original[:starts[0].start()] + ''.join(chunks)
    return code[:match.start()] + changed + code[match.end():]
