# 阶段日志

> 记录 S0-S9 每个阶段的完成情况。它用于恢复上下文、检查阶段跳过和定位 loop 卡点，不替代 `change-log.md` 或 `verification-log.md`。

## 记录格式

每个阶段完成后追加一条记录。`Stage` 使用 `S0`、`S1`、`S5` 等稳定编号；`Gate Result` 只能在阶段产物和门禁都完成后写 `pass`。

```text
Date:
Writer:
Stage: <S0>
Stage Name:
Input Artifacts:
Output Artifacts:
Preflight:
Gate Result: pass | fail
Decision:
Next Stage:
Blocked By:
Notes:
```

## History
