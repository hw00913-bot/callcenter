"""Reapply the S8 container-only repair after official business atlas rendering.

Preserves all SVG/script bytes. This is not the historical canonical renderer.
"""
from pathlib import Path
import re

CSS = ".atlas-desktop main,.atlas-desktop .card,.atlas-desktop .section,.atlas-desktop .diagram-versions,.atlas-desktop .diagram-version,.atlas-desktop .diagram-panel{min-width:0;max-width:100%}.atlas-desktop .diagram-versions{grid-template-columns:minmax(0,1fr)}.atlas-desktop .diagram{min-width:0;max-width:100%;box-sizing:border-box}"


def repair(path):
    if path.is_symlink():
        raise ValueError("Refusing a linked atlas")
    original = path.read_text()
    if CSS in original:
        return False
    if original.count("</style>") != 1 or 'class="diagram-versions"' not in original:
        raise ValueError("Atlas structure changed; inspect before applying")
    updated = original.replace("</style>", CSS + "\n</style>", 1)
    for tag in ("svg", "script"):
        pattern = rf"<{tag}\b.*?</{tag}>"
        if re.findall(pattern, original, re.S) != re.findall(pattern, updated, re.S):
            raise ValueError("Unexpected diagram/script change")
    path.write_text(updated)
    return True


if __name__ == "__main__":
    target = Path(__file__).resolve().parent.parent / "outputs/business-scenario-atlas.html"
    print("container CSS applied" if repair(target) else "container CSS already present")
