"""Gate regression tests: only temporary fixtures, never business state."""
import hashlib
import json
from pathlib import Path
import sys
import tempfile
import unittest
import shutil
import subprocess
from argparse import Namespace

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import loop_preflight as gate
import loop_run as runner
from loop_rule_compat import (approved_rule_hash, REFERENCE, KIND, LOCAL_REPAIR_KIND,
                              snapshot_digest)


class GateRegression(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix="loop-gate-test-")
        self.root = Path(self.tmp.name)
        (self.root / "memory").mkdir()
        (self.root / "config").mkdir()
        self.put("config/project.json", '{"projectId":"test-project"}')

    def tearDown(self):
        self.tmp.cleanup()

    def put(self, name, content):
        (self.root / name).write_text(content, encoding="utf-8")

    def record(self, result, number=1, stage="S7", authentic=True):
        date = f"2026-09-06T10:00:{number:02d}"
        record_id = gate.expected_record_id_v2(self.root, stage, date) if authentic else "invalid"
        return (f"\n## Attempt {number}\n- date: {date}\n- stage: {stage}\n"
                f"- gate_result: {result}\n- writer: tools/loop_run.py\n"
                f"- record_id: {record_id}\n- record_id_version: project-salted-v2\n"
                f"- preflight_result_hash: {'a' * 16}\n")

    def consistency(self, records, status, exempt=None):
        self.put("memory/stage-log.md", records)
        errors = []
        gate.check_workflow_stage_log_consistency(self.root, {"stages": {"s7": status}}, "s7", errors, exempt)
        return errors

    def test_old_pass_then_failed_redo_can_remain_pending(self):
        self.assertEqual([], self.consistency(self.record("pass") + self.record("fail", 2), "pending"))

    def test_pass_without_redo_still_requires_completed(self):
        self.assertTrue(self.consistency(self.record("pass"), "pending"))

    def test_latest_failure_cannot_be_completed(self):
        self.assertTrue(self.consistency(self.record("pass") + self.record("fail", 2), "completed"))

    def test_recovery_after_failure_can_complete(self):
        self.assertEqual([], self.consistency(self.record("fail") + self.record("pass", 2), "completed"))

    def test_forged_failure_cannot_clear_old_pass(self):
        self.assertTrue(self.consistency(self.record("pass") + self.record("fail", 2, authentic=False), "pending"))

    def test_force_exempts_only_target_stage(self):
        records = self.record("pass") + self.record("pass", 2, "S8")
        self.put("memory/stage-log.md", records)
        errors = []
        gate.check_workflow_stage_log_consistency(self.root, {"stages": {"s7": "pending", "s8": "pending"}}, "s7", errors, "S7")
        self.assertEqual(1, len(errors))
        self.assertIn("S8", errors[0])

    def verification(self, result, step="step-01", scope="step"):
        return (f"\n## Verification\nStep: {step}\nScope: {scope}\nResult: {result}\n"
                "Local URL / File: index.html\nTool: unit-test\nCommand / Check: assert DOM states\n"
                "Passed: 3 assertions\nFailed: None\nEvidence: Fixture has three verified assertions and a saved screenshot.\nConsecutive Failures: 0\n")

    def verify_errors(self, log, stage="s8"):
        self.put("memory/execution-steps.md", "## Step 01: test\n")
        self.put("memory/verification-log.md", log)
        errors = []
        gate.check_verification_records(self.root, stage, errors)
        return errors

    def test_later_step_failure_invalidates_old_pass(self):
        self.assertTrue(self.verify_errors(self.verification("pass") + self.verification("fail")))

    def test_later_step_pending_invalidates_old_pass(self):
        self.assertTrue(self.verify_errors(self.verification("pass") + self.verification("pending")))

    def test_malformed_scope_cannot_hide_later_failure(self):
        self.assertTrue(self.verify_errors(self.verification("pass") + self.verification("fail", scope="step; commentary")))

    def test_ambiguous_result_is_not_pass(self):
        self.assertTrue(self.verify_errors(self.verification("pass with exceptions")))

    def test_new_pass_recovers_failed_step(self):
        self.assertEqual([], self.verify_errors(self.verification("fail") + self.verification("pass")))

    def test_later_global_failure_invalidates_old_pass(self):
        log = self.verification("pass") + self.verification("pass", "global", "global") + self.verification("fail", "global", "global")
        self.assertTrue(self.verify_errors(log, "s9"))

    def test_global_before_latest_step_is_stale(self):
        log = self.verification("pass", "global", "global") + self.verification("pass")
        self.assertTrue(self.verify_errors(log, "s9"))

    def test_unrelated_section_does_not_overwrite_result(self):
        self.assertEqual([], self.verify_errors(self.verification("pass") + "\n## Diagnosis\nResult: not a verification record\n"))

    def test_pass_with_real_failure_evidence_still_rejected(self):
        self.assertTrue(self.verify_errors(self.verification("pass").replace("Failed: None", "Failed: one test")))

    def test_v2_version_is_not_lost_in_parser(self):
        self.put("memory/stage-log.md", self.record("pass"))
        self.assertEqual("project-salted-v2", gate.stage_log_records(self.root)[0].get("record_id_version"))

    def test_empty_error_array_is_not_failure(self):
        self.assertFalse(gate.evidence_indicates_failure("checks=17, failed=0, runtimeErrors=[], missing=[]"))

    def test_nonempty_error_array_is_failure(self):
        self.assertTrue(gate.evidence_indicates_failure('runtimeErrors=["TypeError"]'))

    def test_pending_browser_allows_work_but_blocks_delivery(self):
        self.put("memory/circuit-state.json", json.dumps({"failures": [], "pendingChecks": [{"stepId": "step-15", "checkpoint": "browser", "status": "not_verified"}]}))
        errors = []
        gate.check_circuit_breaker(self.root, "s7", errors)
        self.assertEqual([], errors)
        gate.check_circuit_breaker(self.root, "s8", errors)
        self.assertTrue(errors)

    def approval_fixture(self, extra=b""):
        before = b"# Rules\n@memory/project.md\n"
        self.put("CLAUDE.md", (before + REFERENCE + extra).decode())
        self.put("memory/project-startup-plan.md", "Frozen plan")
        sha = lambda data: hashlib.sha256(data).hexdigest()
        iteration = {"name": "Test", "pmApprovedAt": "2026-09-04T20:16:19", "pmApprovedBy": "PM", "pmApprovalEvidence": "original approval", "approvedStartupPlanSha256": sha(b"Frozen plan"), "approvedClaudeSha256": sha(before)}
        iteration["planApprovalId"] = runner.plan_approval_id(self.root, iteration["name"], iteration["pmApprovedAt"], "PM", "original approval", sha(b"Frozen plan"), sha(before))
        self.put("config/workflow.json", json.dumps({"stage": "s7", "stages": {"s7": "pending"}, "currentIteration": iteration}))
        return iteration

    def test_reference_migration_preserves_approval_and_stages(self):
        old = self.approval_fixture()
        self.assertEqual(0, runner.register_rule_reference(Namespace(project=str(self.root), evidence="User authorized gate maintenance")))
        current = json.loads((self.root / "config/workflow.json").read_text())
        self.assertEqual({"s7": "pending"}, current["stages"])
        self.assertEqual("s7", current["stage"])
        for key, value in old.items():
            self.assertEqual(value, current["currentIteration"][key])
        self.assertEqual([], runner.validate_plan_approval(self.root))
        self.assertEqual(old["planApprovalId"], gate.expected_plan_approval_id(self.root, current["currentIteration"]))

    def test_reference_migration_rejects_unrelated_rule_changes(self):
        self.approval_fixture(b"New business permission\n")
        before = (self.root / "config/workflow.json").read_bytes()
        self.assertEqual(1, runner.register_rule_reference(Namespace(project=str(self.root), evidence="User authorized gate maintenance")))
        self.assertEqual(before, (self.root / "config/workflow.json").read_bytes())

    def test_reference_migration_cannot_approve_plan_drift(self):
        self.approval_fixture()
        self.put("memory/project-startup-plan.md", "Changed scope")
        self.assertEqual(1, runner.register_rule_reference(Namespace(project=str(self.root), evidence="User authorized gate maintenance")))

    def test_post_migration_rule_drift_is_rejected(self):
        self.approval_fixture()
        runner.register_rule_reference(Namespace(project=str(self.root), evidence="User authorized gate maintenance"))
        self.put("CLAUDE.md", (self.root / "CLAUDE.md").read_text() + "Different permission\n")
        self.assertTrue(runner.validate_plan_approval(self.root))

    def test_missing_migration_cannot_hide_reference_edit(self):
        self.approval_fixture()
        self.assertTrue(runner.validate_plan_approval(self.root))

    def test_migration_is_idempotent(self):
        self.approval_fixture()
        args = Namespace(project=str(self.root), evidence="User authorized gate maintenance")
        self.assertEqual(0, runner.register_rule_reference(args))
        before = (self.root / "config/workflow.json").read_bytes()
        self.assertEqual(0, runner.register_rule_reference(args))
        self.assertEqual(before, (self.root / "config/workflow.json").read_bytes())

    def restore_fixture(self):
        source = Path(__file__).resolve().parents[1]
        (self.root / "tools").mkdir()
        for name in ["loop_run.py", "loop_preflight.py"]:
            shutil.copy2(source / "prototype-loop-orchestrator/orchestrator/scripts" / name, self.root / "tools" / name)
        shutil.copy2(source / "loop_rule_compat.py", self.root / "tools/loop_rule_compat.py")
        return [sys.executable, str(Path(__file__).with_name("restore_gate_patch.py")), str(self.root)]

    def test_restoration_after_upstream_sync_and_idempotence(self):
        cmd = self.restore_fixture()
        first = subprocess.run(cmd, capture_output=True, text=True)
        self.assertEqual(0, first.returncode, first.stdout + first.stderr)
        before = (self.root / "tools/loop_preflight.py").read_bytes()
        self.assertEqual(0, subprocess.run(cmd, capture_output=True).returncode)
        self.assertEqual(before, (self.root / "tools/loop_preflight.py").read_bytes())

    def test_restoration_rejects_unknown_runtime_without_writes(self):
        cmd = self.restore_fixture()
        self.put("tools/loop_preflight.py", "Unrecognized runtime")
        before = (self.root / "tools/loop_run.py").read_bytes()
        self.assertEqual(1, subprocess.run(cmd, capture_output=True).returncode)
        self.assertEqual(before, (self.root / "tools/loop_run.py").read_bytes())

    def repair_fixture(self, count=4):
        self.put("config/workflow.json", json.dumps({"stage": "s7", "currentIteration": {"planApprovalId": "original-approval"}}))
        failure = {"stepId": "step-15", "checkpoint": "browser-visual-and-e2e",
                   "consecutiveFailures": count, "lastError": "URL policy blocks this action",
                   "updatedAt": "2026-09-06"}
        pending = {"stepId": "step-15", "checkpoint": "browser-visual-and-e2e",
                   "status": "not_verified", "consecutiveRetries": count,
                   "reason": "Browser not inspected; local checks are not browser evidence"}
        state = {"threshold": 3, "failures": [failure], "pendingChecks": [pending]}
        state["localRepairAuthorization"] = {
            "kind": LOCAL_REPAIR_KIND, "status": "active", "writer": "prototype-verifier",
            "authorizedBy": "PM", "authorizedAt": "2026-09-08T10:00:00+08:00",
            "authorization": "用户明确授权继续本地修复；浏览器及交付仍未验证",
            "projectId": "test-project", "planApprovalId": "original-approval",
            "allowedStage": "s7", "browserRetryAllowed": False, "deliveryAllowed": False,
            "checkpoints": [{"stepId": failure["stepId"], "checkpoint": failure["checkpoint"],
                             "failureSha256": snapshot_digest(failure),
                             "pendingCheckSha256": snapshot_digest(pending)}],
        }
        return state

    def circuit_errors(self, state, stage="s7"):
        self.put("memory/circuit-state.json", json.dumps(state, ensure_ascii=False))
        before = (self.root / "memory/circuit-state.json").read_bytes()
        errors = []
        gate.check_circuit_breaker(self.root, stage, errors)
        self.assertEqual(before, (self.root / "memory/circuit-state.json").read_bytes())
        return errors

    def test_explicit_repair_resumes_local_work_without_clearing_evidence(self):
        state = self.repair_fixture()
        self.assertEqual([], self.circuit_errors(state))
        self.assertEqual(4, state["failures"][0]["consecutiveFailures"])
        self.assertEqual("not_verified", state["pendingChecks"][0]["status"])

    def test_new_retry_count_can_be_explicitly_authorized(self):
        self.assertEqual([], self.circuit_errors(self.repair_fixture(count=5)))

    def test_local_repair_reports_its_limits_in_preflight_warnings(self):
        state = self.repair_fixture(count=5)
        self.put("memory/circuit-state.json", json.dumps(state, ensure_ascii=False))
        errors, warnings = [], []
        gate.check_circuit_breaker(self.root, "s7", errors, warnings)
        self.assertEqual([], errors)
        self.assertEqual(1, len(warnings))
        self.assertIn("保留连续失败 5 次及 not_verified", warnings[0])
        self.assertIn("不允许浏览器重试", warnings[0])

    def test_local_repair_never_allows_s8_s9_or_final(self):
        state = self.repair_fixture()
        for stage in ["s8", "s9", "final"]:
            with self.subTest(stage=stage):
                errors = self.circuit_errors(state, stage)
                self.assertTrue(any("熔断已触发" in item for item in errors))
                self.assertTrue(any("必要验证尚未完成" in item for item in errors))

    def test_local_repair_cannot_complete_s7(self):
        state = self.repair_fixture()
        self.assertEqual("s8", runner.COMPLETION_GATES["S7"])
        self.assertTrue(self.circuit_errors(state, runner.COMPLETION_GATES["S7"]))

    def test_no_explicit_repair_authorization_still_blocks(self):
        state = self.repair_fixture()
        del state["localRepairAuthorization"]
        self.assertTrue(self.circuit_errors(state))

    def test_invalid_repair_metadata_does_not_relax_gate(self):
        invalid = {"kind": "wildcard-repair", "status": "resolved", "writer": "prototype-builder",
                   "authorizedBy": "agent", "authorization": "", "authorizedAt": "later",
                   "allowedStage": "all", "browserRetryAllowed": True, "deliveryAllowed": True,
                   "projectId": "other-project", "planApprovalId": "new-approval", "checkpoints": {}}
        for key, value in invalid.items():
            with self.subTest(key=key):
                state = self.repair_fixture()
                state["localRepairAuthorization"][key] = value
                self.assertTrue(self.circuit_errors(state))

    def test_missing_false_flags_do_not_grant_repair(self):
        for key in ["browserRetryAllowed", "deliveryAllowed"]:
            for value in [None, 0, "false"]:
                with self.subTest(key=key, value=value):
                    state = self.repair_fixture()
                    state["localRepairAuthorization"][key] = value
                    self.assertTrue(self.circuit_errors(state))

    def test_repair_authorization_cannot_precede_failure(self):
        state = self.repair_fixture()
        state["localRepairAuthorization"]["authorizedAt"] = "2026-09-01T10:00:00+08:00"
        self.assertTrue(self.circuit_errors(state))

    def test_new_failure_invalidates_previous_repair(self):
        state = self.repair_fixture()
        state["failures"][0]["consecutiveFailures"] = 5
        state["pendingChecks"][0]["consecutiveRetries"] = 5
        self.assertTrue(self.circuit_errors(state))

    def test_changed_error_invalidates_previous_repair(self):
        state = self.repair_fixture()
        state["failures"][0]["lastError"] = "New browser failure"
        self.assertTrue(self.circuit_errors(state))

    def test_changed_pending_evidence_invalidates_previous_repair(self):
        state = self.repair_fixture()
        state["pendingChecks"][0]["reason"] = "Different evidence"
        self.assertTrue(self.circuit_errors(state))

    def test_forged_pass_cannot_reuse_repair_authorization(self):
        state = self.repair_fixture()
        state["pendingChecks"][0]["status"] = "pass"
        state["localRepairAuthorization"]["checkpoints"][0]["pendingCheckSha256"] = snapshot_digest(state["pendingChecks"][0])
        self.assertTrue(self.circuit_errors(state))

    def test_nonbrowser_failure_remains_blocking_with_authorization(self):
        state = self.repair_fixture()
        nonbrowser = {**state["failures"][0], "checkpoint": "javascript-runtime"}
        state["failures"].append(nonbrowser)
        errors = self.circuit_errors(state)
        self.assertEqual(1, len(errors))
        self.assertIn("javascript-runtime", errors[0])

    def test_authorization_cannot_widen_to_other_checkpoints(self):
        state = self.repair_fixture()
        for entry in [state["failures"][0], state["pendingChecks"][0], state["localRepairAuthorization"]["checkpoints"][0]]:
            entry["checkpoint"] = "javascript-runtime"
        auth_entry = state["localRepairAuthorization"]["checkpoints"][0]
        auth_entry["failureSha256"] = snapshot_digest(state["failures"][0])
        auth_entry["pendingCheckSha256"] = snapshot_digest(state["pendingChecks"][0])
        self.assertTrue(self.circuit_errors(state))

    def test_authorization_requires_one_unchanged_pending_check(self):
        for mutation in ["missing", "duplicate", "wrong-step", "count-mismatch"]:
            with self.subTest(mutation=mutation):
                state = self.repair_fixture()
                if mutation == "missing": state["pendingChecks"] = []
                elif mutation == "duplicate": state["pendingChecks"].append(dict(state["pendingChecks"][0]))
                elif mutation == "wrong-step": state["pendingChecks"][0]["stepId"] = "step-16"
                else: state["pendingChecks"][0]["consecutiveRetries"] = 3
                self.assertTrue(self.circuit_errors(state))

    def test_authorization_cannot_reuse_after_iteration_or_stage_change(self):
        for workflow in [{"stage": "s8", "currentIteration": {"planApprovalId": "original-approval"}},
                         {"stage": "s7", "currentIteration": {"planApprovalId": "new-approval"}}]:
            state = self.repair_fixture()
            self.put("config/workflow.json", json.dumps(workflow))
            self.assertTrue(self.circuit_errors(state))

    def test_repair_does_not_approve_changed_startup_plan(self):
        state = self.repair_fixture()
        iteration = self.approval_fixture()
        state["localRepairAuthorization"]["planApprovalId"] = iteration["planApprovalId"]
        runner.register_rule_reference(Namespace(project=str(self.root), evidence="User authorized gate maintenance"))
        self.put("memory/project-startup-plan.md", "Unapproved changed business scope")
        self.assertEqual([], self.circuit_errors(state))
        self.assertTrue(runner.validate_plan_approval(self.root))

    def test_malformed_pending_item_is_not_accepted_for_local_work(self):
        state = self.repair_fixture()
        state["pendingChecks"].append("invalid")
        self.assertTrue(self.circuit_errors(state))

    def test_threshold_cannot_be_raised_to_bypass_delivery(self):
        state = self.repair_fixture()
        state["threshold"] = 100
        self.assertTrue(self.circuit_errors(state))

    def test_latest_record_with_tampered_provenance_is_rejected(self):
        for changed in ["record_id_version: unknown", "preflight_result_hash: bogus", "writer: manual"]:
            field = changed.split(":")[0]
            latest = self.record("fail", 2)
            import re
            latest = re.sub(rf"(?m)^- {field}:.*$", "- " + changed, latest)
            self.assertTrue(self.consistency(self.record("pass") + latest, "pending"))

    def test_rule_migration_rejects_duplicate_reference_lines(self):
        self.approval_fixture(REFERENCE)
        self.assertEqual(1, runner.register_rule_reference(Namespace(project=str(self.root), evidence="User authorized gate maintenance")))

    def test_restoration_rejects_mixed_runtime_without_writes(self):
        cmd = self.restore_fixture()
        source = Path(__file__).resolve().parents[1]
        shutil.copy2(source / "loop_run.py", self.root / "tools/loop_run.py")
        before = {name: (self.root / "tools" / name).read_bytes() for name in ["loop_run.py", "loop_preflight.py"]}
        self.assertEqual(1, subprocess.run(cmd, capture_output=True).returncode)
        for name, content in before.items(): self.assertEqual(content, (self.root / "tools" / name).read_bytes())

    def test_restoration_rejects_tampered_helper_without_writes(self):
        cmd = self.restore_fixture()
        self.put("tools/loop_rule_compat.py", "Unreviewed helper")
        before = {name: (self.root / "tools" / name).read_bytes() for name in ["loop_run.py", "loop_preflight.py"]}
        self.assertEqual(1, subprocess.run(cmd, capture_output=True).returncode)
        for name, content in before.items(): self.assertEqual(content, (self.root / "tools" / name).read_bytes())


if __name__ == "__main__":
    unittest.main()
