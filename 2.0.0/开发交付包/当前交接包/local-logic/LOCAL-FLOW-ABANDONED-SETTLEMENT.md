# LOCAL-FLOW-ABANDONED-SETTLEMENT 确认本租户已废弃旧段的缺失收尾

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md) · [全局逻辑](../global-logic.md)

- [判断并确认本租户后继节点 · FUNC\-2038](../features/FUNC-2038.md)

## 职责与触发

所属工程模块：未填写

功能：FUNC-2038

触发：当前业务详情核对旧ABANDONED运行，当前ownerADMIN选择准确历史运行并确认无法补填

## 前置条件

- 当前负责租户ADMIN且有本业务废弃/收尾动作权；准确旧run为ABANDONED，只有本tenant旧seg可确认
- 原真实执行/重试/unknown/事实冲突已可靠收敛；其他tenant欠项只保摘要，不代其确认或放整体新run
- 不要求当前handlingMode=TEMPLATE或当前run ACTIVE；这不是废弃当前DIRECT周期或更改当前执行

## 必须遵守的全局规则

- [GR-SERIAL](../global-logic.md#GR-SERIAL)
- [GR-AUTH](../global-logic.md#GR-AUTH)
- [GR-SCOPE](../global-logic.md#GR-SCOPE)
- [GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)
- [GR-DATA-FACTS](../global-logic.md#GR-DATA-FACTS)
- [GR-NO-HISTORY](../global-logic.md#GR-NO-HISTORY)
- [GR-LIFECYCLE-SETTLEMENT](../global-logic.md#GR-LIFECYCLE-SETTLEMENT)

## 输入与输出

输入：[FIELD-FLOW-RECORD-ID](../field-specs.md#FIELD-FLOW-RECORD-ID)、[FIELD-FLOW-RUN-ID](../field-specs.md#FIELD-FLOW-RUN-ID)、[FIELD-FLOW-RECORD-REVISION](../field-specs.md#FIELD-FLOW-RECORD-REVISION)、[FIELD-FLOW-REASON](../field-specs.md#FIELD-FLOW-REASON)、[FIELD-FLOW-MISSING-CONTENT-CONFIRM](../field-specs.md#FIELD-FLOW-MISSING-CONTENT-CONFIRM)、[FIELD-FLOW-ABANDON-CONFIRMATION](../field-specs.md#FIELD-FLOW-ABANDON-CONFIRMATION)、[FIELD-FLOW-ABANDONMENT-SETTLEMENT](../field-specs.md#FIELD-FLOW-ABANDONMENT-SETTLEMENT)、[FIELD-FLOW-EXECUTION-STATE](../field-specs.md#FIELD-FLOW-EXECUTION-STATE)、[FIELD-FLOW-HANDLING-MODE](../field-specs.md#FIELD-FLOW-HANDLING-MODE)

输出：[FIELD-FLOW-ABANDONMENT-SETTLEMENT](../field-specs.md#FIELD-FLOW-ABANDONMENT-SETTLEMENT)、[FIELD-FLOW-RECORD-REVISION](../field-specs.md#FIELD-FLOW-RECORD-REVISION)

## 处理步骤

### STEP-FLOW-ABANDONED-SETTLEMENT-1

abandonedSettlementContext读取可核旧ABANDONED运行及本tenant缺失摘要/确认指纹/expectedRevision，不给私有字段值；选择run只是目标引用，不改当前run

读取：FIELD-FLOW-RECORD-ID, FIELD-FLOW-RUN-ID, FIELD-FLOW-EXECUTION-STATE, FIELD-FLOW-ABANDONMENT-SETTLEMENT；写入：FIELD-FLOW-ABANDON-CONFIRMATION

规则：GR-SERIAL, GR-AUTH, GR-SCOPE, GR-UNKNOWN, GR-LIFECYCLE-SETTLEMENT

### STEP-FLOW-ABANDONED-SETTLEMENT-2

confirmAbandonedSettlement提交必有runId、无法补填确认、原因及confirmationFingerprint/expectedRevision，重新核当前ownerADMIN、缺失范围/实际人/字段scope/接通calls及真实停止

读取：FIELD-FLOW-RUN-ID, FIELD-FLOW-RECORD-REVISION, FIELD-FLOW-REASON, FIELD-FLOW-MISSING-CONTENT-CONFIRM, FIELD-FLOW-ABANDON-CONFIRMATION, FIELD-FLOW-EXECUTION-STATE；写入：FIELD-FLOW-ABANDONMENT-SETTLEMENT

规则：GR-SERIAL, GR-AUTH, GR-SCOPE, GR-UNKNOWN, GR-LIFECYCLE-SETTLEMENT

### STEP-FLOW-ABANDONED-SETTLEMENT-3

只写该旧run的本tenant seg证据/确认历史及ABANDONED_SETTLEMENT事件(原run/segmentIDs/admin/reason/time)和revision；读回剩余欠项，不改变当前DIRECT/运行/执行/字段，不自动重开

读取：FIELD-FLOW-HANDLING-MODE, FIELD-FLOW-RUN-ID, FIELD-FLOW-ABANDONMENT-SETTLEMENT；写入：FIELD-FLOW-ABANDONMENT-SETTLEMENT, FIELD-FLOW-RECORD-REVISION

规则：GR-SERIAL, GR-DATA-FACTS, GR-NO-HISTORY, GR-LIFECYCLE-SETTLEMENT

## 分支与异常

### BRANCH-FLOW-ABANDONED-SETTLEMENT-1

条件：非当前ownerADMIN、旧run不准或请求跨tenant seg

结果：拒绝且不写证据/当前状态，不代填或泄露其他tenant私有值

涉及字段：FIELD-FLOW-ABANDONMENT-SETTLEMENT, FIELD-FLOW-RUN-ID

验证：CHECK-FLOW-ABANDON-DIRECT-SETTLEMENT

### BRANCH-FLOW-ABANDONED-SETTLEMENT-2

条件：无明确确认/原因，指纹或记录revision过期，原执行/unknown/冲突未收敛

结果：保输入重读/核对，不结清或解锁；确认不能替代真实停止

涉及字段：FIELD-FLOW-MISSING-CONTENT-CONFIRM, FIELD-FLOW-ABANDON-CONFIRMATION, FIELD-FLOW-RECORD-REVISION, FIELD-FLOW-EXECUTION-STATE

验证：CHECK-FLOW-ABANDON-DIRECT-SETTLEMENT

### BRANCH-FLOW-ABANDONED-SETTLEMENT-3

条件：本tenant旧欠项合法确认，可能仍有其他tenant欠项

结果：只结清本tenant可确认部分并保整体剩余阻塞；同请求重复读原结果，不更当前run/direct/exec/arrangement/字段

涉及字段：FIELD-FLOW-ABANDONMENT-SETTLEMENT, FIELD-FLOW-HANDLING-MODE, FIELD-FLOW-RECORD-REVISION

验证：CHECK-FLOW-ABANDON-DIRECT-SETTLEMENT

## 完成后的状态

- 只更新本tenant旧seg.abandonmentSettlement、r.events的ABANDONED_SETTLEMENT及record revision；当前run/direct/exec/arrangement/字段不变
- 缺失/未完成及旧本人内容保事实，不伪archived/completed；后续完成DIRECT/启用流程重新按正常及可靠弃收尾判据核验

## 字段定义

- [FIELD-FLOW-RECORD-ID](../field-specs.md#FIELD-FLOW-RECORD-ID)
- [FIELD-FLOW-RUN-ID](../field-specs.md#FIELD-FLOW-RUN-ID)
- [FIELD-FLOW-RECORD-REVISION](../field-specs.md#FIELD-FLOW-RECORD-REVISION)
- [FIELD-FLOW-REASON](../field-specs.md#FIELD-FLOW-REASON)
- [FIELD-FLOW-MISSING-CONTENT-CONFIRM](../field-specs.md#FIELD-FLOW-MISSING-CONTENT-CONFIRM)
- [FIELD-FLOW-ABANDON-CONFIRMATION](../field-specs.md#FIELD-FLOW-ABANDON-CONFIRMATION)
- [FIELD-FLOW-ABANDONMENT-SETTLEMENT](../field-specs.md#FIELD-FLOW-ABANDONMENT-SETTLEMENT)
- [FIELD-FLOW-EXECUTION-STATE](../field-specs.md#FIELD-FLOW-EXECUTION-STATE)
- [FIELD-FLOW-HANDLING-MODE](../field-specs.md#FIELD-FLOW-HANDLING-MODE)

## 来源与验证

来源条目：acceptance:AC-2164, features:FUNC-2038, features:FUNC-2038/behavior_spec/7/branches/0, features:FUNC-2038/behavior_spec/7/branches/1, features:FUNC-2038/behavior_spec/7/branches/2, features:FUNC-2038/behavior_spec/7/postconditions/0, features:FUNC-2038/behavior_spec/7/postconditions/1, features:FUNC-2038/behavior_spec/7/preconditions/0, features:FUNC-2038/behavior_spec/7/preconditions/1, features:FUNC-2038/behavior_spec/7/preconditions/2, features:FUNC-2038/behavior_spec/7/steps/0, features:FUNC-2038/behavior_spec/7/steps/1, features:FUNC-2038/behavior_spec/7/steps/2, pages:PAGE-2103/fields/33, pages:PAGE-2203/fields/39, pages:PAGE-2203/fields/43, pages:PAGE-2203/fields/64, pages:PAGE-2204/fields/26, pages:PAGE-2204/fields/48, pages:PAGE-2204/fields/49, pages:PAGE-2204/fields/56, pages:PAGE-2204/fields/85, pages:PAGE-2205/fields/61, pages:PAGE-2226/fields/15, pages:PAGE-2226/fields/28, pages:PAGE-2226/fields/29, pages:PAGE-2226/fields/35, pages:PAGE-2227, pages:PAGE-2227/fields/138, pages:PAGE-2227/fields/151, pages:PAGE-2227/fields/152, pages:PAGE-2227/fields/153, pages:PAGE-2227/fields/39, pages:PAGE-2227/fields/75, pages:PAGE-2227/fields/79, pages:PAGE-2227/fields/80, pages:PAGE-2227/fields/97, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/105, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/116, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/148, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/170, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/171, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/172, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/60, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/73, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/75, scenarios:FLOW-CURRENT-CUSTOMER/steps/43

验证：CHECK-FLOW-ABANDON-DIRECT-SETTLEMENT

## 实施任务

- [TASK-026](../tasks/TASK-026.md)
