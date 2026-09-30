# 验证记录

> 记录每步验证和全局验证结果。失败项必须能追溯到具体步骤或需求。

## 最新状态

- Overall: Pending
- Last verified: 未验证

## 机器可读记录格式

每条记录必须包含以下键值行。`Step` 必须使用 `step-01`、`step-02` 等稳定 ID，且与 `memory/execution-steps.md` 对应。

```text
Date:
Step: step-01
Scope: step | global
Local URL / File:
Tool:
Command / Check:
Passed:
Failed:
Evidence:
Result: pass | fail
Consecutive Failures:
Next Action:
```

全局验证记录使用：

```text
Date:
Step: global
Scope: global
Local URL / File:
Tool:
Command / Check:
Passed:
Failed:
Evidence:
Result: pass | fail
Consecutive Failures:
Next Action:
```

## History

- 待补充
