# LOCAL-PLAT-SEAT-SUPERVISE 监管对目标准确坐席置忙、置闲或离线

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md) · [全局逻辑](../global-logic.md)

- [进入有权工作位置与保留专业能力 · FUNC\-2002](../features/FUNC-2002.md)

## 职责与触发

所属工程模块：未填写

功能：FUNC-2002

触发：有监管权者对目标坐席明确选择置忙/置闲/离线

## 前置条件

- 目标企业及坐席监管权；目标当前状态满足该动作

## 必须遵守的全局规则

- [GR-IDENTITY](../global-logic.md#GR-IDENTITY)
- [GR-SCOPE](../global-logic.md#GR-SCOPE)
- [GR-AUTH](../global-logic.md#GR-AUTH)
- [GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)
- [GR-LIST-ORDER](../global-logic.md#GR-LIST-ORDER)

## 输入与输出

输入：[FIELD-PLAT-SEAT-ID](../field-specs.md#FIELD-PLAT-SEAT-ID)、[FIELD-PLAT-PHONE-STATE](../field-specs.md#FIELD-PLAT-PHONE-STATE)、[FIELD-PLAT-RESOURCE-SCOPE](../field-specs.md#FIELD-PLAT-RESOURCE-SCOPE)、[FIELD-PLAT-REQUEST](../field-specs.md#FIELD-PLAT-REQUEST)

输出：[FIELD-PLAT-SEAT-EVENT](../field-specs.md#FIELD-PLAT-SEAT-EVENT)、[FIELD-PLAT-OP-STATE](../field-specs.md#FIELD-PLAT-OP-STATE)

## 处理步骤

### LOCAL-PLAT-SEAT-SUPERVISE-S1

核对目标准确nativeId及最新状态，监管人无需本人在线

读取：FIELD-PLAT-SEAT-ID, FIELD-PLAT-PHONE-STATE, FIELD-PLAT-RESOURCE-SCOPE, FIELD-PLAT-REQUEST；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

### LOCAL-PLAT-SEAT-SUPERVISE-S2

通话中/未知/不支持的状态转换拒绝，不把他人电话当本人切页保护

读取：FIELD-PLAT-SEAT-ID, FIELD-PLAT-PHONE-STATE, FIELD-PLAT-RESOURCE-SCOPE, FIELD-PLAT-REQUEST；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

### LOCAL-PLAT-SEAT-SUPERVISE-S3

原动作请求准确回执后刷新；未知先核对

读取：FIELD-PLAT-SEAT-ID, FIELD-PLAT-PHONE-STATE, FIELD-PLAT-RESOURCE-SCOPE, FIELD-PLAT-REQUEST；写入：FIELD-PLAT-SEAT-EVENT, FIELD-PLAT-OP-STATE

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

## 分支与异常

### LOCAL-PLAT-SEAT-SUPERVISE-B1

条件：前提、字段及对象修订校验通过且结果明确成功

结果：仅目标准许电话状态变更；读监管摘要不自动授监管操作权

涉及字段：FIELD-PLAT-SEAT-ID, FIELD-PLAT-PHONE-STATE, FIELD-PLAT-RESOURCE-SCOPE, FIELD-PLAT-REQUEST, FIELD-PLAT-SEAT-EVENT, FIELD-PLAT-OP-STATE

验证：CHECK-PLAT-SEAT-SUPERVISE

### LOCAL-PLAT-SEAT-SUPERVISE-B2

条件：无权/字段不合法/对象失效/修订冲突

结果：明确显示本次拒绝原因，保留可继续的输入和已确认原值，不作变更

涉及字段：FIELD-PLAT-SEAT-ID, FIELD-PLAT-PHONE-STATE, FIELD-PLAT-RESOURCE-SCOPE, FIELD-PLAT-REQUEST, FIELD-PLAT-SEAT-EVENT, FIELD-PLAT-OP-STATE

验证：CHECK-PLAT-SEAT-SUPERVISE

### LOCAL-PLAT-SEAT-SUPERVISE-B3

条件：提交失败或结果未知

结果：失败保留原确认值；未知显示待核并按同请求核对，不重复提交或假报成功

涉及字段：FIELD-PLAT-SEAT-ID, FIELD-PLAT-PHONE-STATE, FIELD-PLAT-RESOURCE-SCOPE, FIELD-PLAT-REQUEST, FIELD-PLAT-SEAT-EVENT, FIELD-PLAT-OP-STATE

验证：CHECK-PLAT-SEAT-SUPERVISE

## 完成后的状态

- 仅目标准许电话状态变更；读监管摘要不自动授监管操作权

## 字段定义

- [FIELD-PLAT-OP-STATE](../field-specs.md#FIELD-PLAT-OP-STATE)
- [FIELD-PLAT-PHONE-STATE](../field-specs.md#FIELD-PLAT-PHONE-STATE)
- [FIELD-PLAT-REQUEST](../field-specs.md#FIELD-PLAT-REQUEST)
- [FIELD-PLAT-RESOURCE-SCOPE](../field-specs.md#FIELD-PLAT-RESOURCE-SCOPE)
- [FIELD-PLAT-SEAT-EVENT](../field-specs.md#FIELD-PLAT-SEAT-EVENT)
- [FIELD-PLAT-SEAT-ID](../field-specs.md#FIELD-PLAT-SEAT-ID)

## 来源与验证

来源条目：acceptance:AC-2066, acceptance:AC-2072, features:FUNC-2002, features:FUNC-2002/behavior_spec/30/branches/0, features:FUNC-2002/behavior_spec/30/branches/1, features:FUNC-2002/behavior_spec/30/branches/2, features:FUNC-2002/behavior_spec/30/postconditions/0, features:FUNC-2002/behavior_spec/30/preconditions/0, features:FUNC-2002/behavior_spec/30/steps/0, features:FUNC-2002/behavior_spec/30/steps/1, features:FUNC-2002/behavior_spec/30/steps/2, pages:PAGE-2003/fields/17, pages:PAGE-2003/fields/22, pages:PAGE-2003/fields/23, pages:PAGE-2003/fields/26, pages:PAGE-2004/fields/2, pages:PAGE-2004/fields/4, pages:PAGE-2005/fields/5, pages:PAGE-2005/fields/8, pages:PAGE-2007/fields/21, pages:PAGE-2007/fields/24, pages:PAGE-2103/fields/13, pages:PAGE-2103/fields/19, pages:PAGE-2105/fields/4, pages:PAGE-2106/fields/9, pages:PAGE-2107/fields/4, pages:PAGE-2108/fields/18, pages:PAGE-2108/fields/19, pages:PAGE-2110/fields/8, pages:PAGE-2112/fields/11, pages:PAGE-2112/fields/13, pages:PAGE-2202, pages:PAGE-2202/actions/4, pages:PAGE-2202/actions/5, pages:PAGE-2202/actions/6, pages:PAGE-2202/fields/21, pages:PAGE-2202/fields/23, pages:PAGE-2202/fields/28, pages:PAGE-2202/fields/29, pages:PAGE-2202/fields/32, pages:PAGE-2202/fields/34, pages:PAGE-2203/fields/63, pages:PAGE-2204/fields/77, pages:PAGE-2204/fields/82, pages:PAGE-2204/fields/83, pages:PAGE-2205/fields/10, pages:PAGE-2205/fields/15, pages:PAGE-2205/fields/16, pages:PAGE-2206/fields/10, pages:PAGE-2206/fields/15, pages:PAGE-2206/fields/16, pages:PAGE-2207/fields/14, pages:PAGE-2207/fields/15, pages:PAGE-2207/fields/17, pages:PAGE-2208/fields/9, pages:PAGE-2209/fields/7, pages:PAGE-2210/fields/1, pages:PAGE-2210/fields/14, pages:PAGE-2210/fields/5, pages:PAGE-2210/fields/6, pages:PAGE-2211/fields/1, pages:PAGE-2211/fields/4, pages:PAGE-2211/fields/5, pages:PAGE-2211/fields/8, pages:PAGE-2212/fields/1, pages:PAGE-2212/fields/10, pages:PAGE-2212/fields/9, pages:PAGE-2213/fields/1, pages:PAGE-2213/fields/25, pages:PAGE-2213/fields/26, pages:PAGE-2214/fields/2, pages:PAGE-2214/fields/4, pages:PAGE-2214/fields/5, pages:PAGE-2214/fields/9, pages:PAGE-2215/fields/3, pages:PAGE-2215/fields/6, pages:PAGE-2215/fields/7, pages:PAGE-2216/fields/1, pages:PAGE-2216/fields/10, pages:PAGE-2216/fields/11, pages:PAGE-2217/fields/13, pages:PAGE-2217/fields/17, pages:PAGE-2217/fields/18, pages:PAGE-2218/fields/1, pages:PAGE-2218/fields/5, pages:PAGE-2218/fields/6, pages:PAGE-2219/fields/11, pages:PAGE-2219/fields/12, pages:PAGE-2219/fields/8, pages:PAGE-2220/fields/12, pages:PAGE-2220/fields/17, pages:PAGE-2220/fields/18, pages:PAGE-2221/fields/6, pages:PAGE-2221/fields/7, pages:PAGE-2222/fields/4, pages:PAGE-2225/fields/2, pages:PAGE-2225/fields/3, pages:PAGE-2227/fields/136, pages:PAGE-2227/fields/137, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/200, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/201, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/236, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/278, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/280, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/322, scenarios:FLOW-CURRENT-PLATFORM/steps/57

验证：CHECK-PLAT-SEAT-SUPERVISE

## 实施任务

- [TASK-042](../tasks/TASK-042.md)
