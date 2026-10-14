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
Scope: step | global | diagram
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

图集记录使用 `Step: business-flow` 或 `sequence-flow`、`Scope: diagram`，并增加 `Visible Elements: 实际可见节点或参与者数`（至少 2）。Evidence 必须来自浏览器实际渲染与截图，不能统计隐藏语义标记。先追加单步结果，再追加图集及全局结果；门禁取最新记录，脚本写入 verification-epoch 分隔符后，历史结果不再作为本轮通过证据。

## History

- 待补充
