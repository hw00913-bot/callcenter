# LOCAL-PLAT-PHONE-CONTINUE 继续原客户任务跟进

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md) · [全局逻辑](../global-logic.md)

- [进入有权工作位置与保留专业能力 · FUNC\-2002](../features/FUNC-2002.md)

## 职责与触发

所属工程模块：未填写

功能：FUNC-2002

触发：进入待继续跟进任务或下一条原任务

## 前置条件

- 当前原任务作业权；本人所需坐席能力

## 必须遵守的全局规则

- [GR-IDENTITY](../global-logic.md#GR-IDENTITY)
- [GR-SCOPE](../global-logic.md#GR-SCOPE)
- [GR-AUTH](../global-logic.md#GR-AUTH)
- [GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)
- [GR-LIST-ORDER](../global-logic.md#GR-LIST-ORDER)

## 输入与输出

输入：[FIELD-PLAT-CUSTOMER-ID](../field-specs.md#FIELD-PLAT-CUSTOMER-ID)、[FIELD-PLAT-PRO-FOLLOW-STATE](../field-specs.md#FIELD-PLAT-PRO-FOLLOW-STATE)、[FIELD-PLAT-PHONE-STATE](../field-specs.md#FIELD-PLAT-PHONE-STATE)、[FIELD-PLAT-QUERY](../field-specs.md#FIELD-PLAT-QUERY)

输出：[FIELD-PLAT-PRO-FILL](../field-specs.md#FIELD-PLAT-PRO-FILL)、[FIELD-PLAT-FOLLOWER](../field-specs.md#FIELD-PLAT-FOLLOWER)、[FIELD-PLAT-PRO-FOLLOW-STATE](../field-specs.md#FIELD-PLAT-PRO-FOLLOW-STATE)

## 处理步骤

### LOCAL-PLAT-PHONE-CONTINUE-S1

只取当前本人合法任务范围；本轮重新读取最新字段与当前有效值；新轮开始捕获并展示本轮定义/有效值基准，后续保存沿该依据，不能保存时再取另一套最新schema

读取：FIELD-PLAT-CUSTOMER-ID, FIELD-PLAT-PRO-FOLLOW-STATE, FIELD-PLAT-PHONE-STATE, FIELD-PLAT-QUERY；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

### LOCAL-PLAT-PHONE-CONTINUE-S2

已完成/失权/在处理中不能作为新待办重复领取；缺失任务恢复仅管理员手工且原明确条件满足

读取：FIELD-PLAT-CUSTOMER-ID, FIELD-PLAT-PRO-FOLLOW-STATE, FIELD-PLAT-PHONE-STATE, FIELD-PLAT-QUERY；写入：FIELD-PLAT-PRO-FILL, FIELD-PLAT-FOLLOWER, FIELD-PLAT-PRO-FOLLOW-STATE

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

## 分支与异常

### LOCAL-PLAT-PHONE-CONTINUE-B1

条件：前提、字段及对象修订校验通过且结果明确成功

结果：可开始合法待继续跟进作业，不重置已完成结果或自动回收给公海

涉及字段：FIELD-PLAT-CUSTOMER-ID, FIELD-PLAT-PRO-FOLLOW-STATE, FIELD-PLAT-PHONE-STATE, FIELD-PLAT-QUERY, FIELD-PLAT-PRO-FILL, FIELD-PLAT-FOLLOWER

验证：CHECK-PLAT-PHONE-CONTINUE

### LOCAL-PLAT-PHONE-CONTINUE-B2

条件：无权/字段不合法/对象失效/修订冲突

结果：明确显示本次拒绝原因，保留可继续的输入和已确认原值，不作变更

涉及字段：FIELD-PLAT-CUSTOMER-ID, FIELD-PLAT-PRO-FOLLOW-STATE, FIELD-PLAT-PHONE-STATE, FIELD-PLAT-QUERY, FIELD-PLAT-PRO-FILL, FIELD-PLAT-FOLLOWER

验证：CHECK-PLAT-PHONE-CONTINUE

### LOCAL-PLAT-PHONE-CONTINUE-B3

条件：提交失败或结果未知

结果：失败保留原确认值；未知显示待核并按同请求核对，不重复提交或假报成功

涉及字段：FIELD-PLAT-CUSTOMER-ID, FIELD-PLAT-PRO-FOLLOW-STATE, FIELD-PLAT-PHONE-STATE, FIELD-PLAT-QUERY, FIELD-PLAT-PRO-FILL, FIELD-PLAT-FOLLOWER

验证：CHECK-PLAT-PHONE-CONTINUE

## 完成后的状态

- 可开始合法待继续跟进作业，不重置已完成结果或自动回收给公海

## 字段定义

- [FIELD-PLAT-CUSTOMER-ID](../field-specs.md#FIELD-PLAT-CUSTOMER-ID)
- [FIELD-PLAT-FOLLOWER](../field-specs.md#FIELD-PLAT-FOLLOWER)
- [FIELD-PLAT-PHONE-STATE](../field-specs.md#FIELD-PLAT-PHONE-STATE)
- [FIELD-PLAT-PRO-FILL](../field-specs.md#FIELD-PLAT-PRO-FILL)
- [FIELD-PLAT-PRO-FOLLOW-STATE](../field-specs.md#FIELD-PLAT-PRO-FOLLOW-STATE)
- [FIELD-PLAT-QUERY](../field-specs.md#FIELD-PLAT-QUERY)

## 来源与验证

来源条目：acceptance:AC-2066, acceptance:AC-2067, acceptance:AC-2072, features:FUNC-2002, features:FUNC-2002/behavior_spec/29/branches/0, features:FUNC-2002/behavior_spec/29/branches/1, features:FUNC-2002/behavior_spec/29/branches/2, features:FUNC-2002/behavior_spec/29/postconditions/0, features:FUNC-2002/behavior_spec/29/preconditions/0, features:FUNC-2002/behavior_spec/29/steps/0, features:FUNC-2002/behavior_spec/29/steps/1, pages:PAGE-2002/fields/4, pages:PAGE-2003/fields/20, pages:PAGE-2005/fields/7, pages:PAGE-2007/fields/23, pages:PAGE-2102/fields/4, pages:PAGE-2103/fields/17, pages:PAGE-2103/fields/9, pages:PAGE-2105/fields/1, pages:PAGE-2106/fields/6, pages:PAGE-2107/fields/1, pages:PAGE-2108/fields/16, pages:PAGE-2109/fields/7, pages:PAGE-2110/fields/10, pages:PAGE-2111/fields/15, pages:PAGE-2112/fields/12, pages:PAGE-2202, pages:PAGE-2202/actions/3, pages:PAGE-2202/fields/11, pages:PAGE-2202/fields/14, pages:PAGE-2202/fields/23, pages:PAGE-2202/fields/24, pages:PAGE-2202/fields/25, pages:PAGE-2202/fields/26, pages:PAGE-2203/fields/56, pages:PAGE-2203/fields/60, pages:PAGE-2203/fields/61, pages:PAGE-2204/fields/73, pages:PAGE-2204/fields/74, pages:PAGE-2204/fields/80, pages:PAGE-2204/fields/81, pages:PAGE-2205/fields/13, pages:PAGE-2206/fields/13, pages:PAGE-2207/fields/15, pages:PAGE-2207/fields/16, pages:PAGE-2208/fields/6, pages:PAGE-2209/fields/1, pages:PAGE-2209/fields/3, pages:PAGE-2210/fields/3, pages:PAGE-2211/fields/3, pages:PAGE-2212/fields/7, pages:PAGE-2213/fields/3, pages:PAGE-2215/fields/5, pages:PAGE-2216/fields/8, pages:PAGE-2217/fields/15, pages:PAGE-2218/fields/3, pages:PAGE-2219/fields/10, pages:PAGE-2220/fields/10, pages:PAGE-2220/fields/14, pages:PAGE-2220/fields/15, pages:PAGE-2220/fields/9, pages:PAGE-2225/fields/1, pages:PAGE-2227/fields/132, pages:PAGE-2227/fields/133, pages:PAGE-2227/fields/134, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/197, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/208, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/211, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/212, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/213, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/222, scenarios:FLOW-CURRENT-PLATFORM/steps/56

验证：CHECK-PLAT-PHONE-CONTINUE

## 实施任务

- [TASK-042](../tasks/TASK-042.md)
