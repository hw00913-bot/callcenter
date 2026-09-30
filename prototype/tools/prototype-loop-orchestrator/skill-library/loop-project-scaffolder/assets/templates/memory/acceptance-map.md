# 验收映射

> 将需求条目映射到可观察的验收标准和验证方式。

| Requirement ID | Requirement | Acceptance Criteria | Verification | Status | Decision / Reason | Source IDs |
| --- | --- | --- | --- | --- | --- | --- |
| R-001 | 原型项目可以本地运行 | 入口页通过 HTTP 正常打开，无阻塞错误 | 浏览器打开 `index.html`，检查 console 和资源请求 | Planned | 进入 S7/S8 后更新 | LOCAL |

## 规则

- 每个核心需求至少对应一条验收标准。
- 验收标准必须可观察、可验证。
- 不确定需求写入 `memory/open-items.md`，不要写入已确认验收项。
- 导入需求分析冻结基线时，`Source IDs` 必须引用对应的 `AC-*`、`FUNC-*`、`PAGE-*`、`ACTION-*`；纯原型框架项可写 `LOCAL`。
- 所有上游 `AC-*`、`FUNC-*`、`PAGE-*`、`ACTION-*` 至少被一条验收映射覆盖。
- `Status` 如使用 `n/a`、`deferred`、`descoped`、`skipped`、`不适用`、`已取消` 或 `跳过`，必须在 `Decision / Reason` 写明产品或范围决策原因。
