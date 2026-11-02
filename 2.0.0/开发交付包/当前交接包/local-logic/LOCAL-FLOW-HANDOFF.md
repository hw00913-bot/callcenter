# LOCAL-FLOW-HANDOFF 管理员移交准确请求核对责任

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md) · [全局逻辑](../global-logic.md)

- [保存本轮跟进、准确通话事实并唯一归档 · FUNC\-2032](../features/FUNC-2032.md)

## 职责与触发

所属工程模块：未填写

功能：FUNC-2032

触发：对准确未知request选择本租户核对人并说明原因

## 前置条件

- 当前owner租户有权管理员及该request存在本租户待核

## 必须遵守的全局规则

- [GR-AUTH](../global-logic.md#GR-AUTH)
- [GR-SCOPE](../global-logic.md#GR-SCOPE)
- [GR-PRIVACY](../global-logic.md#GR-PRIVACY)
- [GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)

## 输入与输出

输入：[FIELD-FLOW-REQUEST-ID](../field-specs.md#FIELD-FLOW-REQUEST-ID)、[FIELD-FLOW-REVIEW-ASSIGNEE](../field-specs.md#FIELD-FLOW-REVIEW-ASSIGNEE)、[FIELD-FLOW-REASON](../field-specs.md#FIELD-FLOW-REASON)

输出：[FIELD-FLOW-REVIEW-ASSIGNEE](../field-specs.md#FIELD-FLOW-REVIEW-ASSIGNEE)、[FIELD-FLOW-REQUEST-STATUS](../field-specs.md#FIELD-FLOW-REQUEST-STATUS)

## 处理步骤

### STEP-FLOW-HANDOFF-1

明确唯一请求和本租户有效账号，不按记录模糊移交所有权限

读取：FIELD-FLOW-REQUEST-ID, FIELD-FLOW-REVIEW-ASSIGNEE；写入：无

规则：GR-AUTH, GR-SCOPE, GR-PRIVACY, GR-UNKNOWN

### STEP-FLOW-HANDOFF-2

保存本次移交人/接收人/原因/时间，接收人只核该request

读取：FIELD-FLOW-REASON, FIELD-FLOW-REVIEW-ASSIGNEE；写入：FIELD-FLOW-REVIEW-ASSIGNEE

规则：GR-AUTH, GR-SCOPE, GR-PRIVACY, GR-UNKNOWN

## 分支与异常

### BRANCH-FLOW-HANDOFF-1

条件：请求不唯一、失效或人员无效

结果：拒并保选择，不扩大原权限

涉及字段：FIELD-FLOW-REQUEST-ID, FIELD-FLOW-REVIEW-ASSIGNEE

验证：CHECK-FLOW-HANDOFF

### BRANCH-FLOW-HANDOFF-2

条件：明确移交

结果：myReviewWork可定位准确事项，不能读整档案、重放原操作、代填

涉及字段：FIELD-FLOW-REVIEW-ASSIGNEE

验证：CHECK-FLOW-HANDOFF

## 完成后的状态

- 不改变原业务owner和责任跟进人

## 字段定义

- [FIELD-FLOW-REQUEST-ID](../field-specs.md#FIELD-FLOW-REQUEST-ID)
- [FIELD-FLOW-REVIEW-ASSIGNEE](../field-specs.md#FIELD-FLOW-REVIEW-ASSIGNEE)
- [FIELD-FLOW-REASON](../field-specs.md#FIELD-FLOW-REASON)
- [FIELD-FLOW-REQUEST-STATUS](../field-specs.md#FIELD-FLOW-REQUEST-STATUS)

## 来源与验证

来源条目：acceptance:AC-2122, features:FUNC-2032, features:FUNC-2032/behavior_spec/7/branches/0, features:FUNC-2032/behavior_spec/7/branches/1, features:FUNC-2032/behavior_spec/7/postconditions/0, features:FUNC-2032/behavior_spec/7/preconditions/0, features:FUNC-2032/behavior_spec/7/steps/0, features:FUNC-2032/behavior_spec/7/steps/1, pages:PAGE-2006/fields/38, pages:PAGE-2006/fields/39, pages:PAGE-2204/fields/50, pages:PAGE-2204/fields/51, pages:PAGE-2227, pages:PAGE-2227/fields/75, pages:PAGE-2227/fields/81, pages:PAGE-2227/fields/82, pages:PAGE-2227/fields/87, pages:PAGE-2228/fields/17, pages:PAGE-2228/fields/18, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/116, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/120, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/121, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/122, scenarios:FLOW-CURRENT-CUSTOMER/steps/36

验证：CHECK-FLOW-HANDOFF

## 实施任务

- [TASK-029](../tasks/TASK-029.md)
