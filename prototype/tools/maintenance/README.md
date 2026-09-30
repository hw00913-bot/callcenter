# 项目局部门禁维护

适配版本：`2026-09-06-analysis-generation-order-v1`。只修改项目局部运行时；安装技能和同步源副本保持原样。

保留原批准的一行 `@memory/feature-list.md` 迁移：删除恰好该行后必须还原原审批字节，原审批 ID、启动规划摘要和其他规则不能改变。阶段判断使用最新且来源校验有效的记录；验证判断使用最新单步/全局记录，旧 pass 不覆盖新 fail 或 pending。

## 同步后的恢复

从项目目录执行 `python3 tools/maintenance/restore_gate_patch.py .`。脚本仅接受已核验的 BASE 或 FIXED 精确 SHA-256，补丁和兼容模块也必须匹配；未知、混合或污染版本拒绝写入。新版本必须重新审查差异、更新补丁及回归，不能放宽摘要检查。

回归：`PYTHONDONTWRITEBYTECODE=1 python3 tools/maintenance/test_gate_regressions.py`。测试仅在临时目录操作，不修改业务项目控制状态。

## 恢复本地修复的授权记录

只有用户明确要求恢复修复时，验证 owner 才可在 `memory/circuit-state.json` 根节点登记 `localRepairAuthorization`。本脚本不登记授权，也不从等待时长或历史通过推断授权。

```json
{
  "localRepairAuthorization": {
    "kind": "s7-local-browser-repair-only-v1",
    "status": "active",
    "writer": "prototype-verifier",
    "authorizedBy": "PM",
    "authorizedAt": "本次实际登记的 ISO 时间，不早于当前失败日期",
    "authorization": "用户明确授权原文、日期及仅恢复本地修复的边界",
    "projectId": "config/project.json 中的 projectId",
    "planApprovalId": "当前未改变的 currentIteration.planApprovalId",
    "allowedStage": "s7",
    "browserRetryAllowed": false,
    "deliveryAllowed": false,
    "checkpoints": [
      {
        "stepId": "step-15",
        "checkpoint": "browser-visual-and-e2e",
        "failureSha256": "当前 failures 对应完整对象的摘要",
        "pendingCheckSha256": "当前 pendingChecks 对应完整对象的摘要"
      }
    ]
  }
}
```

摘要使用 `loop_rule_compat.snapshot_digest(entry)`，算法为：`json.dumps(entry, ensure_ascii=False, sort_keys=True, separators=(",", ":"))` 的 UTF-8 字节 SHA-256。

必须原样保留对应失败记录及 `not_verified` 待验记录，两侧次数必须相等；新增失败或任何证据字段变化都会使旧授权失效。只允许确切的 `browser-visual-and-e2e` 检查点，其他熔断继续阻断。

授权仅让 S7 本地修复预检继续，输出中仍提示未验证、失败次数及禁止重试。它不授权浏览器访问、不改变 URL 策略、不覆盖审批或其他门禁。S7 完成实际调用 S8 门禁；S8、S9、final 始终被未完成浏览器证据及保留的熔断阻断。授权也不能自动赋予通关、消除失败或允许修改冻结业务范围。
