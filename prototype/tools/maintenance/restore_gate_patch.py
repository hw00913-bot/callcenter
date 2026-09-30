"""Restore this project's reviewed gate fix after a runtime sync.

Fail closed on a different upstream runtime; never patch a new version by
guessing. Does not edit installed skills, approvals, stages or business pages.
"""
import argparse
import hashlib
from pathlib import Path
import subprocess

BASE = {
    "loop_run.py": "ebeacdc6a469a3a24948245e030f0e342b55d9ec27b3653b09482fdce1f37ac7",
    "loop_preflight.py": "69f1315f61edafeb763a3738648a1171b371877bdc118bb442b81c0c69dd91ec",
}
FIXED = {
    "loop_run.py": "f38bb79ad779247f5e8fcd76f1a03f549cd3ed05d170f0c2ab01da3a286026c3",
    "loop_preflight.py": "9bd749552e224f9dfeda494689123574bc4e88c263e42909aab778e09d08f39a",
}
HELPER_HASH = "2be8652393775f390a21cc496ccbe2c7d4129f0b84d882f3d7a93929971eb491"
PATCH_HASH = "4bd69bd97ae052ffca094e2c33cf0ed8cc6d8c9cb086a04e85a1d622fbe4a924"


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest() if path.is_file() else "missing"


def restore(project):
    patch = Path(__file__).with_name("runtime-gates.patch")
    if sha(patch) != PATCH_HASH or sha(project / "tools/loop_rule_compat.py") != HELPER_HASH:
        print("拒绝恢复：补丁或兼容校验模块不完整。")
        return 1
    actual = {name: sha(project / "tools" / name) for name in BASE}
    if actual == FIXED:
        print("项目门禁补丁已生效，无需重复修改。")
        return 0
    if actual != BASE:
        print("拒绝覆盖：运行时与已核验版本不一致，需要先评估新版本差异。")
        return 1
    command = ["/usr/bin/patch", "--batch", "--forward", "--fuzz=0", "-p0", "-i", str(patch)]
    checked = subprocess.run(command + ["--dry-run"], cwd=project, capture_output=True, text=True)
    if checked.returncode:
        print(checked.stdout + checked.stderr)
        return 1
    applied = subprocess.run(command, cwd=project, capture_output=True, text=True)
    if applied.returncode:
        print(applied.stdout + applied.stderr)
        return 1
    if {name: sha(project / "tools" / name) for name in FIXED} != FIXED:
        print("恢复后摘要不匹配，不能继续门禁。")
        return 1
    print("项目门禁补丁恢复完成；审批、阶段状态和业务产物未修改。")
    return 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("project", nargs="?", default=str(Path(__file__).resolve().parents[2]))
    args = parser.parse_args()
    raise SystemExit(restore(Path(args.project).resolve()))
