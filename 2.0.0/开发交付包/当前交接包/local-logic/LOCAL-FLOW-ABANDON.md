# LOCAL-FLOW-ABANDON 请求及受控完成运行废弃

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
- 要完成缺内容废弃时仅当前ownerADMIN确认无法补填+原因及准确run/本tenant缺失指纹/版本；真实执行或核对阻塞时可先普通reason登记停止，不强求未来内容确认，其他角色无缺内容结清例外

## 必须遵守的全局规则

- [GR-SERIAL](../global-logic.md#GR-SERIAL)
- [GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)
- [GR-DATA-FACTS](../global-logic.md#GR-DATA-FACTS)
- [GR-AUTH](../global-logic.md#GR-AUTH)
- [GR-HANDLING-MODE](../global-logic.md#GR-HANDLING-MODE)
- [GR-LIFECYCLE-SETTLEMENT](../global-logic.md#GR-LIFECYCLE-SETTLEMENT)

## 输入与输出

输入：[FIELD-FLOW-RUN-ID](../field-specs.md#FIELD-FLOW-RUN-ID)、[FIELD-FLOW-RUN-STATUS](../field-specs.md#FIELD-FLOW-RUN-STATUS)、[FIELD-FLOW-REASON](../field-specs.md#FIELD-FLOW-REASON)、[FIELD-FLOW-EXECUTION-STATE](../field-specs.md#FIELD-FLOW-EXECUTION-STATE)、[FIELD-FLOW-HANDLING-MODE](../field-specs.md#FIELD-FLOW-HANDLING-MODE)、[FIELD-FLOW-MISSING-CONTENT-CONFIRM](../field-specs.md#FIELD-FLOW-MISSING-CONTENT-CONFIRM)、[FIELD-FLOW-ABANDON-CONFIRMATION](../field-specs.md#FIELD-FLOW-ABANDON-CONFIRMATION)、[FIELD-FLOW-ABANDONMENT-SETTLEMENT](../field-specs.md#FIELD-FLOW-ABANDONMENT-SETTLEMENT)、[FIELD-FLOW-ABANDON-TENANT](../field-specs.md#FIELD-FLOW-ABANDON-TENANT)

输出：[FIELD-FLOW-RUN-STATUS](../field-specs.md#FIELD-FLOW-RUN-STATUS)、[FIELD-FLOW-ARCHIVE-STATE](../field-specs.md#FIELD-FLOW-ARCHIVE-STATE)、[FIELD-FLOW-ABANDONMENT-SETTLEMENT](../field-specs.md#FIELD-FLOW-ABANDONMENT-SETTLEMENT)、[FIELD-FLOW-ABANDON-TENANT](../field-specs.md#FIELD-FLOW-ABANDON-TENANT)

## 处理步骤

### STEP-FLOW-ABANDON-1

当前run有EXECUTION_ACTIVE/REQUEST_UNKNOWN/FACT_CONFLICT时，ADMIN普通reason可先登记停止→ABANDONING，不先强求未来内容确认；derived canRegisterStopping只指这些真实执行/核对阻塞，FOREIGN_CONTENT不冒充在途

读取：FIELD-FLOW-RUN-ID, FIELD-FLOW-REASON；写入：FIELD-FLOW-RUN-STATUS

规则：GR-SERIAL, GR-UNKNOWN, GR-DATA-FACTS, GR-AUTH

### STEP-FLOW-ABANDON-2

原执行/排队/重试/unknown/冲突可靠收敛，正常必要内容已归档或缺内容已有合法受控确认时，才ABANDONED；保archiveState=ABANDONED及未正常完成，不把废弃结清写成archived=true

读取：FIELD-FLOW-EXECUTION-STATE, FIELD-FLOW-REQUEST-STATUS, FIELD-FLOW-MISSING-CONTENT-CONFIRM, FIELD-FLOW-ABANDON-CONFIRMATION, FIELD-FLOW-ABANDONMENT-SETTLEMENT, FIELD-FLOW-ABANDON-TENANT；写入：FIELD-FLOW-RUN-STATUS, FIELD-FLOW-ARCHIVE-STATE, FIELD-FLOW-ABANDONMENT-SETTLEMENT, FIELD-FLOW-ABANDON-TENANT

规则：GR-SERIAL, GR-UNKNOWN, GR-DATA-FACTS, GR-AUTH, GR-LIFECYCLE-SETTLEMENT

## 分支与异常

### BRANCH-FLOW-ABANDON-1

条件：仍在途/排队/重试/unknown

结果：保ABANDONING且禁止新增派发/新run，不提前释放；准确原已受理事实仍归原seg/attempt登记

涉及字段：FIELD-FLOW-RUN-STATUS

验证：CHECK-FLOW-ABANDON

### BRANCH-FLOW-ABANDON-2

条件：真实执行/回执及必要正常归档或合法缺失受控收尾都已明确

结果：ABANDONED保旧plan/内容/通话/缺失和未完成，后续可按受控新run入口，不计正常完成

涉及字段：FIELD-FLOW-RUN-STATUS, FIELD-FLOW-EFFECTIVE-PLAN, FIELD-FLOW-CONTENT-SNAPSHOT

验证：CHECK-FLOW-ABANDON

### BRANCH-FLOW-ABANDON-DIRECT

条件：当前业务为DIRECT

结果：拒绝模板判断、推进、转交、废弃运行或模板重开；同租户再次直接跟进沿直接起呼入口，新TASK来源不得启用模板；仅旧无TASK来源历史的后续流程可走独立“启用流程”预检。

涉及字段：FIELD-FLOW-HANDLING-MODE

验证：CHECK-FLOW-ABANDON

### BRANCH-FLOW-ABANDON-MISSING-CONFIRM

条件：必要本人内容缺失而未获当前ownerADMIN有效确认/原因，或缺失范围已变化

结果：不能完成缺内容废弃或重开；如有真实执行/核对阻塞可先普通reason登记ABANDONING，不代填或以确认替代停止；已可靠停止后缺失确认必须补齐

涉及字段：FIELD-FLOW-REASON, FIELD-FLOW-RUN-STATUS, FIELD-FLOW-CONTENT-SAVED

验证：CHECK-FLOW-CONTROLLED-ABANDON

## 完成后的状态

- 正常归档与可靠废弃结清分开，保缺失及未完成；不代填、不造archived/completedFollowup或正常完成计数；不删除真实通话/内容/历史

## 字段定义

- [FIELD-FLOW-RUN-ID](../field-specs.md#FIELD-FLOW-RUN-ID)
- [FIELD-FLOW-RUN-STATUS](../field-specs.md#FIELD-FLOW-RUN-STATUS)
- [FIELD-FLOW-REASON](../field-specs.md#FIELD-FLOW-REASON)
- [FIELD-FLOW-EXECUTION-STATE](../field-specs.md#FIELD-FLOW-EXECUTION-STATE)
- [FIELD-FLOW-HANDLING-MODE](../field-specs.md#FIELD-FLOW-HANDLING-MODE)
- [FIELD-FLOW-MISSING-CONTENT-CONFIRM](../field-specs.md#FIELD-FLOW-MISSING-CONTENT-CONFIRM)
- [FIELD-FLOW-ABANDON-CONFIRMATION](../field-specs.md#FIELD-FLOW-ABANDON-CONFIRMATION)
- [FIELD-FLOW-ABANDONMENT-SETTLEMENT](../field-specs.md#FIELD-FLOW-ABANDONMENT-SETTLEMENT)
- [FIELD-FLOW-ABANDON-TENANT](../field-specs.md#FIELD-FLOW-ABANDON-TENANT)
- [FIELD-FLOW-ARCHIVE-STATE](../field-specs.md#FIELD-FLOW-ARCHIVE-STATE)
- [FIELD-FLOW-REQUEST-STATUS](../field-specs.md#FIELD-FLOW-REQUEST-STATUS)
- [FIELD-FLOW-EFFECTIVE-PLAN](../field-specs.md#FIELD-FLOW-EFFECTIVE-PLAN)
- [FIELD-FLOW-CONTENT-SNAPSHOT](../field-specs.md#FIELD-FLOW-CONTENT-SNAPSHOT)
- [FIELD-FLOW-CONTENT-SAVED](../field-specs.md#FIELD-FLOW-CONTENT-SAVED)

## 来源与验证

来源条目：acceptance:AC-2110, acceptance:AC-2122, acceptance:AC-2163, features:FUNC-2032, features:FUNC-2032/behavior_spec/4/branches/0, features:FUNC-2032/behavior_spec/4/branches/1, features:FUNC-2032/behavior_spec/4/branches/2, features:FUNC-2032/behavior_spec/4/branches/3, features:FUNC-2032/behavior_spec/4/postconditions/0, features:FUNC-2032/behavior_spec/4/preconditions/0, features:FUNC-2032/behavior_spec/4/preconditions/1, features:FUNC-2032/behavior_spec/4/preconditions/2, features:FUNC-2032/behavior_spec/4/preconditions/3, features:FUNC-2032/behavior_spec/4/preconditions/4, features:FUNC-2032/behavior_spec/4/steps/0, features:FUNC-2032/behavior_spec/4/steps/1, features:FUNC-2038, features:FUNC-2038/behavior_spec/2/branches/0, features:FUNC-2038/behavior_spec/2/branches/1, features:FUNC-2038/behavior_spec/2/branches/2, features:FUNC-2038/behavior_spec/2/branches/3, features:FUNC-2038/behavior_spec/2/postconditions/0, features:FUNC-2038/behavior_spec/2/preconditions/0, features:FUNC-2038/behavior_spec/2/preconditions/1, features:FUNC-2038/behavior_spec/2/preconditions/2, features:FUNC-2038/behavior_spec/2/preconditions/3, features:FUNC-2038/behavior_spec/2/preconditions/4, features:FUNC-2038/behavior_spec/2/steps/0, features:FUNC-2038/behavior_spec/2/steps/1, pages:PAGE-2006/fields/13, pages:PAGE-2006/fields/39, pages:PAGE-2103/fields/33, pages:PAGE-2203/fields/12, pages:PAGE-2203/fields/13, pages:PAGE-2203/fields/3, pages:PAGE-2203/fields/43, pages:PAGE-2203/fields/64, pages:PAGE-2204/fields/20, pages:PAGE-2204/fields/26, pages:PAGE-2204/fields/51, pages:PAGE-2204/fields/56, pages:PAGE-2204/fields/57, pages:PAGE-2204/fields/85, pages:PAGE-2205/fields/61, pages:PAGE-2223/fields/12, pages:PAGE-2223/fields/9, pages:PAGE-2226/fields/13, pages:PAGE-2226/fields/15, pages:PAGE-2226/fields/29, pages:PAGE-2226/fields/30, pages:PAGE-2226/fields/35, pages:PAGE-2226/fields/9, pages:PAGE-2227, pages:PAGE-2227/fields/138, pages:PAGE-2227/fields/151, pages:PAGE-2227/fields/152, pages:PAGE-2227/fields/153, pages:PAGE-2227/fields/154, pages:PAGE-2227/fields/20, pages:PAGE-2227/fields/21, pages:PAGE-2227/fields/32, pages:PAGE-2227/fields/39, pages:PAGE-2227/fields/5, pages:PAGE-2227/fields/75, pages:PAGE-2227/fields/82, pages:PAGE-2227/fields/97, pages:PAGE-2227/fields/99, pages:PAGE-2228/fields/18, pages:PAGE-2228/fields/6, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/105, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/116, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/121, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/148, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/170, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/171, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/172, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/173, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/51, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/75, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/77, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/91, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/92, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/93, scenarios:FLOW-CURRENT-CUSTOMER/steps/27

验证：CHECK-FLOW-ABANDON, CHECK-FLOW-CONTROLLED-ABANDON

## 实施任务

- [TASK-026](../tasks/TASK-026.md)
