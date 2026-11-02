# LOCAL-PLAT-PHONE-INBOUND 正常呼入接听与振铃填写

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md) · [全局逻辑](../global-logic.md)

- [进入有权工作位置与保留专业能力 · FUNC\-2002](../features/FUNC-2002.md)

## 职责与触发

所属工程模块：未填写

功能：FUNC-2002

触发：当前本人收到合法呼入/预外呼分配电话并点击接听

## 前置条件

- 有效本人坐席与当前接听能力；精确callId

## 必须遵守的全局规则

- [GR-IDENTITY](../global-logic.md#GR-IDENTITY)
- [GR-SCOPE](../global-logic.md#GR-SCOPE)
- [GR-AUTH](../global-logic.md#GR-AUTH)
- [GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)
- [GR-LIST-ORDER](../global-logic.md#GR-LIST-ORDER)

## 输入与输出

输入：[FIELD-PLAT-PHONE-STATE](../field-specs.md#FIELD-PLAT-PHONE-STATE)、[FIELD-PLAT-INBOUND-TYPE](../field-specs.md#FIELD-PLAT-INBOUND-TYPE)、[FIELD-PLAT-INBOUND-PROPERTY](../field-specs.md#FIELD-PLAT-INBOUND-PROPERTY)、[FIELD-PLAT-CALL-ID](../field-specs.md#FIELD-PLAT-CALL-ID)、[FIELD-PLAT-PRO-FILL](../field-specs.md#FIELD-PLAT-PRO-FILL)

输出：[FIELD-PLAT-CALL-STATE](../field-specs.md#FIELD-PLAT-CALL-STATE)、[FIELD-PLAT-CALL-ACTOR](../field-specs.md#FIELD-PLAT-CALL-ACTOR)、[FIELD-PLAT-PHONE-STATE](../field-specs.md#FIELD-PLAT-PHONE-STATE)

## 处理步骤

### LOCAL-PLAT-PHONE-INBOUND-S1

按原振铃现场展示客户和当前可填写字段；公共拒联不拦正常呼入

读取：FIELD-PLAT-PHONE-STATE, FIELD-PLAT-INBOUND-TYPE, FIELD-PLAT-INBOUND-PROPERTY, FIELD-PLAT-CALL-ID, FIELD-PLAT-PRO-FILL；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

### LOCAL-PLAT-PHONE-INBOUND-S2

本人接听后锁定实际接听人，不能以分配负责人冒填

读取：FIELD-PLAT-PHONE-STATE, FIELD-PLAT-INBOUND-TYPE, FIELD-PLAT-INBOUND-PROPERTY, FIELD-PLAT-CALL-ID, FIELD-PLAT-PRO-FILL；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

### LOCAL-PLAT-PHONE-INBOUND-S3

通话与必要话后保护，错过/转移/未知保持准确事实

读取：FIELD-PLAT-PHONE-STATE, FIELD-PLAT-INBOUND-TYPE, FIELD-PLAT-INBOUND-PROPERTY, FIELD-PLAT-CALL-ID, FIELD-PLAT-PRO-FILL；写入：FIELD-PLAT-CALL-STATE, FIELD-PLAT-CALL-ACTOR, FIELD-PLAT-PHONE-STATE

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

## 分支与异常

### LOCAL-PLAT-PHONE-INBOUND-B1

条件：前提、字段及对象修订校验通过且结果明确成功

结果：准确实际接听人取得本次填写资格，必要话后仍须独立保存

涉及字段：FIELD-PLAT-PHONE-STATE, FIELD-PLAT-INBOUND-TYPE, FIELD-PLAT-INBOUND-PROPERTY, FIELD-PLAT-CALL-ID, FIELD-PLAT-PRO-FILL, FIELD-PLAT-CALL-STATE, FIELD-PLAT-CALL-ACTOR

验证：CHECK-PLAT-PHONE-INBOUND

### LOCAL-PLAT-PHONE-INBOUND-B2

条件：无权/字段不合法/对象失效/修订冲突

结果：明确显示本次拒绝原因，保留可继续的输入和已确认原值，不作变更

涉及字段：FIELD-PLAT-PHONE-STATE, FIELD-PLAT-INBOUND-TYPE, FIELD-PLAT-INBOUND-PROPERTY, FIELD-PLAT-CALL-ID, FIELD-PLAT-PRO-FILL, FIELD-PLAT-CALL-STATE, FIELD-PLAT-CALL-ACTOR

验证：CHECK-PLAT-PHONE-INBOUND

### LOCAL-PLAT-PHONE-INBOUND-B3

条件：提交失败或结果未知

结果：失败保留原确认值；未知显示待核并按同请求核对，不重复提交或假报成功

涉及字段：FIELD-PLAT-PHONE-STATE, FIELD-PLAT-INBOUND-TYPE, FIELD-PLAT-INBOUND-PROPERTY, FIELD-PLAT-CALL-ID, FIELD-PLAT-PRO-FILL, FIELD-PLAT-CALL-STATE, FIELD-PLAT-CALL-ACTOR

验证：CHECK-PLAT-PHONE-INBOUND

## 完成后的状态

- 准确实际接听人取得本次填写资格，必要话后仍须独立保存

## 字段定义

- [FIELD-PLAT-CALL-ACTOR](../field-specs.md#FIELD-PLAT-CALL-ACTOR)
- [FIELD-PLAT-CALL-ID](../field-specs.md#FIELD-PLAT-CALL-ID)
- [FIELD-PLAT-CALL-STATE](../field-specs.md#FIELD-PLAT-CALL-STATE)
- [FIELD-PLAT-INBOUND-PROPERTY](../field-specs.md#FIELD-PLAT-INBOUND-PROPERTY)
- [FIELD-PLAT-INBOUND-TYPE](../field-specs.md#FIELD-PLAT-INBOUND-TYPE)
- [FIELD-PLAT-PHONE-STATE](../field-specs.md#FIELD-PLAT-PHONE-STATE)
- [FIELD-PLAT-PRO-FILL](../field-specs.md#FIELD-PLAT-PRO-FILL)

## 来源与验证

来源条目：acceptance:AC-2052, acceptance:AC-2057, acceptance:AC-2066, acceptance:AC-2067, features:FUNC-2002, features:FUNC-2002/behavior_spec/27/branches/0, features:FUNC-2002/behavior_spec/27/branches/1, features:FUNC-2002/behavior_spec/27/branches/2, features:FUNC-2002/behavior_spec/27/postconditions/0, features:FUNC-2002/behavior_spec/27/preconditions/0, features:FUNC-2002/behavior_spec/27/steps/0, features:FUNC-2002/behavior_spec/27/steps/1, features:FUNC-2002/behavior_spec/27/steps/2, pages:PAGE-2007/fields/18, pages:PAGE-2108/fields/11, pages:PAGE-2108/fields/12, pages:PAGE-2108/fields/13, pages:PAGE-2109/fields/4, pages:PAGE-2111/fields/13, pages:PAGE-2202, pages:PAGE-2202/actions/2, pages:PAGE-2202/fields/15, pages:PAGE-2202/fields/16, pages:PAGE-2202/fields/23, pages:PAGE-2202/fields/24, pages:PAGE-2202/fields/6, pages:PAGE-2202/fields/7, pages:PAGE-2202/fields/8, pages:PAGE-2203/fields/55, pages:PAGE-2204/fields/72, pages:PAGE-2205/fields/4, pages:PAGE-2205/fields/5, pages:PAGE-2206/fields/4, pages:PAGE-2206/fields/5, pages:PAGE-2207, pages:PAGE-2207/fields/1, pages:PAGE-2207/fields/13, pages:PAGE-2207/fields/15, pages:PAGE-2207/fields/16, pages:PAGE-2207/fields/2, pages:PAGE-2207/fields/3, pages:PAGE-2207/fields/7, pages:PAGE-2208/fields/1, pages:PAGE-2208/fields/2, pages:PAGE-2208/fields/3, pages:PAGE-2209/fields/0, pages:PAGE-2220/fields/8, pages:PAGE-2221/fields/2, pages:PAGE-2221/fields/3, pages:PAGE-2227/fields/125, pages:PAGE-2227/fields/126, pages:PAGE-2227/fields/127, pages:PAGE-2227/fields/132, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/227, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/229, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/230, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/231, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/236, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/371, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/372, scenarios:FLOW-CURRENT-PLATFORM/steps/54

验证：CHECK-PLAT-PHONE-INBOUND

## 实施任务

- [TASK-042](../tasks/TASK-042.md)
