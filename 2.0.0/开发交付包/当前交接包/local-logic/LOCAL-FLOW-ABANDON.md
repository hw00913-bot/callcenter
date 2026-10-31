# LOCAL-FLOW-ABANDON 请求并明确废弃本运行

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md) · [全局逻辑](../global-logic.md)

- [保存本轮跟进、准确通话事实并唯一归档 · FUNC\-2032](../features/FUNC-2032.md)
- [判断并确认本租户后继节点 · FUNC\-2038](../features/FUNC-2038.md)

## 职责与触发

所属工程模块：未填写

功能：FUNC-2038, FUNC-2032

触发：当前管理员确认废弃并写原因

## 前置条件

- handlingMode=TEMPLATE且准确当前run/node可核
- 对准确业务有当前本租户办理权
- 确认业务/run/node/owner及并发依据仍一致
- 有废弃资格且run ACTIVE或ABANDONING

## 必须遵守的全局规则

- [GR-SERIAL](../global-logic.md#GR-SERIAL)
- [GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)
- [GR-DATA-FACTS](../global-logic.md#GR-DATA-FACTS)
- [GR-AUTH](../global-logic.md#GR-AUTH)
- [GR-HANDLING-MODE](../global-logic.md#GR-HANDLING-MODE)

## 输入与输出

输入：[FIELD-FLOW-RUN-ID](../field-specs.md#FIELD-FLOW-RUN-ID)、[FIELD-FLOW-RUN-STATUS](../field-specs.md#FIELD-FLOW-RUN-STATUS)、[FIELD-FLOW-REASON](../field-specs.md#FIELD-FLOW-REASON)、[FIELD-FLOW-EXECUTION-STATE](../field-specs.md#FIELD-FLOW-EXECUTION-STATE)、[FIELD-FLOW-HANDLING-MODE](../field-specs.md#FIELD-FLOW-HANDLING-MODE)

输出：[FIELD-FLOW-RUN-STATUS](../field-specs.md#FIELD-FLOW-RUN-STATUS)、[FIELD-FLOW-ARCHIVE-STATE](../field-specs.md#FIELD-FLOW-ARCHIVE-STATE)

## 处理步骤

### STEP-FLOW-ABANDON-1

登记本次废弃意图及原因，保实际已发生事实

读取：FIELD-FLOW-RUN-ID, FIELD-FLOW-REASON；写入：FIELD-FLOW-RUN-STATUS

规则：GR-SERIAL, GR-UNKNOWN, GR-DATA-FACTS, GR-AUTH

### STEP-FLOW-ABANDON-2

核所有执行/重试及同业务unknown已收敛，才能标废弃完成

读取：FIELD-FLOW-EXECUTION-STATE, FIELD-FLOW-REQUEST-STATUS；写入：FIELD-FLOW-RUN-STATUS, FIELD-FLOW-ARCHIVE-STATE

规则：GR-SERIAL, GR-UNKNOWN, GR-DATA-FACTS, GR-AUTH

## 分支与异常

### BRANCH-FLOW-ABANDON-1

条件：仍在途/排队/重试/unknown

结果：ABANDONING，不能另起或宣称完成

涉及字段：FIELD-FLOW-RUN-STATUS

验证：CHECK-FLOW-ABANDON

### BRANCH-FLOW-ABANDON-2

条件：已准确终止并核结果

结果：ABANDONED，保旧plan/内容/通话；可经受控新run入口

涉及字段：FIELD-FLOW-RUN-STATUS, FIELD-FLOW-EFFECTIVE-PLAN, FIELD-FLOW-CONTENT-SNAPSHOT

验证：CHECK-FLOW-ABANDON

### BRANCH-FLOW-ABANDON-DIRECT

条件：当前业务为DIRECT

结果：拒绝模板判断、推进、转交、废弃运行或模板重开；同租户再次直接跟进沿直接起呼入口，后续流程走独立“启用流程”预检。

涉及字段：FIELD-FLOW-HANDLING-MODE

验证：CHECK-FLOW-ABANDON

## 完成后的状态

- 不把废弃当业务达成或删除真实通话

## 字段定义

- [FIELD-FLOW-ARCHIVE-STATE](../field-specs.md#FIELD-FLOW-ARCHIVE-STATE)
- [FIELD-FLOW-CONTENT-SNAPSHOT](../field-specs.md#FIELD-FLOW-CONTENT-SNAPSHOT)
- [FIELD-FLOW-EFFECTIVE-PLAN](../field-specs.md#FIELD-FLOW-EFFECTIVE-PLAN)
- [FIELD-FLOW-EXECUTION-STATE](../field-specs.md#FIELD-FLOW-EXECUTION-STATE)
- [FIELD-FLOW-HANDLING-MODE](../field-specs.md#FIELD-FLOW-HANDLING-MODE)
- [FIELD-FLOW-REASON](../field-specs.md#FIELD-FLOW-REASON)
- [FIELD-FLOW-REQUEST-STATUS](../field-specs.md#FIELD-FLOW-REQUEST-STATUS)
- [FIELD-FLOW-RUN-ID](../field-specs.md#FIELD-FLOW-RUN-ID)
- [FIELD-FLOW-RUN-STATUS](../field-specs.md#FIELD-FLOW-RUN-STATUS)

## 来源与验证

来源条目：acceptance:AC-2110, acceptance:AC-2122, features:FUNC-2032, features:FUNC-2032/behavior_spec/4/branches/0, features:FUNC-2032/behavior_spec/4/branches/1, features:FUNC-2032/behavior_spec/4/branches/2, features:FUNC-2032/behavior_spec/4/postconditions/0, features:FUNC-2032/behavior_spec/4/preconditions/0, features:FUNC-2032/behavior_spec/4/preconditions/1, features:FUNC-2032/behavior_spec/4/preconditions/2, features:FUNC-2032/behavior_spec/4/preconditions/3, features:FUNC-2032/behavior_spec/4/steps/0, features:FUNC-2032/behavior_spec/4/steps/1, features:FUNC-2038, features:FUNC-2038/behavior_spec/2/branches/0, features:FUNC-2038/behavior_spec/2/branches/1, features:FUNC-2038/behavior_spec/2/branches/2, features:FUNC-2038/behavior_spec/2/postconditions/0, features:FUNC-2038/behavior_spec/2/preconditions/0, features:FUNC-2038/behavior_spec/2/preconditions/1, features:FUNC-2038/behavior_spec/2/preconditions/2, features:FUNC-2038/behavior_spec/2/preconditions/3, features:FUNC-2038/behavior_spec/2/steps/0, features:FUNC-2038/behavior_spec/2/steps/1, pages:PAGE-2006/fields/13, pages:PAGE-2006/fields/39, pages:PAGE-2203/fields/13, pages:PAGE-2203/fields/3, pages:PAGE-2203/fields/43, pages:PAGE-2203/fields/64, pages:PAGE-2204/fields/20, pages:PAGE-2204/fields/26, pages:PAGE-2204/fields/51, pages:PAGE-2204/fields/56, pages:PAGE-2204/fields/57, pages:PAGE-2204/fields/85, pages:PAGE-2223/fields/12, pages:PAGE-2223/fields/9, pages:PAGE-2226/fields/13, pages:PAGE-2226/fields/15, pages:PAGE-2226/fields/29, pages:PAGE-2226/fields/30, pages:PAGE-2226/fields/35, pages:PAGE-2226/fields/9, pages:PAGE-2227, pages:PAGE-2227/fields/138, pages:PAGE-2227/fields/21, pages:PAGE-2227/fields/32, pages:PAGE-2227/fields/39, pages:PAGE-2227/fields/5, pages:PAGE-2227/fields/75, pages:PAGE-2227/fields/82, pages:PAGE-2227/fields/97, pages:PAGE-2227/fields/99, pages:PAGE-2228/fields/18, pages:PAGE-2228/fields/6, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/105, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/116, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/121, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/148, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/51, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/75, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/77, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/91, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/93, scenarios:FLOW-CURRENT-CUSTOMER/steps/27

验证：CHECK-FLOW-ABANDON

## 实施任务

- [TASK-026](../tasks/TASK-026.md)
