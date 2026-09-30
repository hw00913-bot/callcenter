"""Narrow, auditable migration for the newly required feature-memory reference.

This never approves a changed plan. The original approval remains valid only
when removing exactly this one standalone line restores the approved bytes.
"""
import hashlib
import json
from datetime import datetime
from pathlib import Path

REFERENCE = b"@memory/feature-list.md\n"
KIND = "add-feature-memory-reference-v1"
LOCAL_REPAIR_KIND = "s7-local-browser-repair-only-v1"
LOCAL_REPAIR_CHECKPOINT = "browser-visual-and-e2e"


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def before_reference(data: bytes) -> bytes | None:
    lines = data.splitlines(keepends=True)
    if lines.count(REFERENCE) != 1:
        return None
    return b"".join(line for line in lines if line != REFERENCE)


def approved_rule_hash(project: Path, iteration: dict) -> str:
    path = project / "CLAUDE.md"
    if not path.exists():
        return ""
    data = path.read_bytes()
    actual = digest(data)
    migration = iteration.get("ruleReferenceMigration")
    if not isinstance(migration, dict):
        return actual
    old_data = before_reference(data)
    if (migration.get("kind") == KIND
            and migration.get("writer") == "tools/loop_run.py"
            and migration.get("originalPlanApprovalId") == iteration.get("planApprovalId")
            and migration.get("beforeSha256") == iteration.get("approvedClaudeSha256")
            and migration.get("afterSha256") == actual
            and len(str(migration.get("authorization", "")).strip()) >= 6
            and old_data is not None
            and digest(old_data) == migration.get("beforeSha256")):
        return migration["beforeSha256"]
    return actual


def snapshot_digest(value: dict) -> str:
    """Bind an authorization to the complete unchanged failure/pending entry."""
    return digest(json.dumps(value, ensure_ascii=False, sort_keys=True,
                             separators=(",", ":")).encode("utf-8"))


def local_browser_repair_authorized(project: Path, state: dict, failure: dict, stage: str) -> bool:
    """Only permit S7 local work; never retry a browser or satisfy a gate.

    The verification owner records a user's explicit resume instruction. This
    metadata does not replace plan approval, erase failures, or mark a pending
    check passed. S7 completion runs the S8 gate and cannot use this exception.
    """
    if stage != "s7" or failure.get("checkpoint") != LOCAL_REPAIR_CHECKPOINT:
        return False
    auth = state.get("localRepairAuthorization")
    if not isinstance(auth, dict):
        return False
    required = {
        "kind": LOCAL_REPAIR_KIND, "status": "active", "writer": "prototype-verifier",
        "authorizedBy": "PM", "allowedStage": "s7",
    }
    if any(auth.get(key) != value for key, value in required.items()):
        return False
    if auth.get("browserRetryAllowed") is not False or auth.get("deliveryAllowed") is not False:
        return False
    if not isinstance(auth.get("authorization"), str) or len(auth["authorization"].strip()) < 6:
        return False
    try:
        authorized_at = datetime.fromisoformat(auth["authorizedAt"])
        failure_date = datetime.fromisoformat(failure["updatedAt"])
        if authorized_at.date() < failure_date.date():
            return False
        config = json.loads((project / "config/project.json").read_text(encoding="utf-8"))
        workflow = json.loads((project / "config/workflow.json").read_text(encoding="utf-8"))
    except (KeyError, TypeError, ValueError, OSError):
        return False
    if not isinstance(config, dict) or not isinstance(workflow, dict):
        return False
    iteration = workflow.get("currentIteration")
    if not isinstance(iteration, dict) or not iteration.get("planApprovalId"):
        return False
    if (workflow.get("stage") != "s7"
            or not config.get("projectId") or auth.get("projectId") != config["projectId"]
            or auth.get("planApprovalId") != iteration["planApprovalId"]):
        return False
    entries = auth.get("checkpoints")
    pending = state.get("pendingChecks")
    if not isinstance(entries, list) or not isinstance(pending, list):
        return False
    matches = [entry for entry in entries if isinstance(entry, dict)
               and entry.get("stepId") == failure.get("stepId")
               and entry.get("checkpoint") == failure.get("checkpoint")]
    checks = [entry for entry in pending if isinstance(entry, dict)
              and entry.get("stepId") == failure.get("stepId")
              and entry.get("checkpoint") == failure.get("checkpoint")]
    if len(matches) != 1 or len(checks) != 1:
        return False
    entry, check = matches[0], checks[0]
    if (check.get("status") != "not_verified"
            or type(failure.get("consecutiveFailures")) is not int
            or type(check.get("consecutiveRetries")) is not int
            or check["consecutiveRetries"] != failure.get("consecutiveFailures")):
        return False
    return (entry.get("failureSha256") == snapshot_digest(failure)
            and entry.get("pendingCheckSha256") == snapshot_digest(check))
