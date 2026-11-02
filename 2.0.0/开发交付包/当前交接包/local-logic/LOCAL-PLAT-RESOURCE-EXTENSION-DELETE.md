# LOCAL-PLAT-RESOURCE-EXTENSION-DELETE 删除可删除的分机

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md) · [全局逻辑](../global-logic.md)

- [进入有权工作位置与保留专业能力 · FUNC\-2002](../features/FUNC-2002.md)

## 职责与触发

所属工程模块：未填写

功能：FUNC-2002

触发：有原删除权者对准确分机确认删除

## 前置条件

- 原该对象删除能力存在且有权；无引用/在用/待核冲突
- 当前企业准确软电话分机；已占用或在用不能删除/换绑
- 导入先预检选择，再独立保存，不自动选择全部

## 必须遵守的全局规则

- [GR-IDENTITY](../global-logic.md#GR-IDENTITY)
- [GR-SCOPE](../global-logic.md#GR-SCOPE)
- [GR-AUTH](../global-logic.md#GR-AUTH)
- [GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)
- [GR-LIST-ORDER](../global-logic.md#GR-LIST-ORDER)

## 输入与输出

输入：[FIELD-PLAT-RESOURCE-SCOPE](../field-specs.md#FIELD-PLAT-RESOURCE-SCOPE)、[FIELD-PLAT-EXTENSION-ID](../field-specs.md#FIELD-PLAT-EXTENSION-ID)、[FIELD-PLAT-REFERENCE-STATE](../field-specs.md#FIELD-PLAT-REFERENCE-STATE)、[FIELD-PLAT-RESOURCE-STATE](../field-specs.md#FIELD-PLAT-RESOURCE-STATE)、[FIELD-PLAT-REVISION](../field-specs.md#FIELD-PLAT-REVISION)

输出：[FIELD-PLAT-AUDIT](../field-specs.md#FIELD-PLAT-AUDIT)、[FIELD-PLAT-OP-STATE](../field-specs.md#FIELD-PLAT-OP-STATE)、[FIELD-PLAT-EXTENSION-PASSWORD](../field-specs.md#FIELD-PLAT-EXTENSION-PASSWORD)、[FIELD-PLAT-EXTENSION-AREA](../field-specs.md#FIELD-PLAT-EXTENSION-AREA)、[FIELD-PLAT-EXTENSION-ACTIVE](../field-specs.md#FIELD-PLAT-EXTENSION-ACTIVE)、[FIELD-PLAT-EXTENSION-OUTBOUND](../field-specs.md#FIELD-PLAT-EXTENSION-OUTBOUND)、[FIELD-PLAT-EXTENSION-DIRECT](../field-specs.md#FIELD-PLAT-EXTENSION-DIRECT)、[FIELD-PLAT-EXTENSION-IBRECORD](../field-specs.md#FIELD-PLAT-EXTENSION-IBRECORD)、[FIELD-PLAT-EXTENSION-OBRECORD](../field-specs.md#FIELD-PLAT-EXTENSION-OBRECORD)、[FIELD-PLAT-EXTENSION-JITTER](../field-specs.md#FIELD-PLAT-EXTENSION-JITTER)、[FIELD-PLAT-EXTENSION-DENOISE](../field-specs.md#FIELD-PLAT-EXTENSION-DENOISE)、[FIELD-PLAT-EXTENSION-POWER](../field-specs.md#FIELD-PLAT-EXTENSION-POWER)、[FIELD-PLAT-EXTENSION-NETWORK](../field-specs.md#FIELD-PLAT-EXTENSION-NETWORK)

## 处理步骤

### LOCAL-PLAT-RESOURCE-EXTENSION-DELETE-S1

展示准确对象并最终检查原默认/预置/引用/在用保护

读取：FIELD-PLAT-RESOURCE-SCOPE, FIELD-PLAT-EXTENSION-ID, FIELD-PLAT-REFERENCE-STATE, FIELD-PLAT-RESOURCE-STATE, FIELD-PLAT-REVISION；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

### LOCAL-PLAT-RESOURCE-EXTENSION-DELETE-S2

只删除本对象允许的目录记录，不清任务/通话/账务或其他资源

读取：FIELD-PLAT-RESOURCE-SCOPE, FIELD-PLAT-EXTENSION-ID, FIELD-PLAT-REFERENCE-STATE, FIELD-PLAT-RESOURCE-STATE, FIELD-PLAT-REVISION；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

### LOCAL-PLAT-RESOURCE-EXTENSION-DELETE-S3

只有确认成功刷新，失败/未知保可核对状态

读取：FIELD-PLAT-RESOURCE-SCOPE, FIELD-PLAT-EXTENSION-ID, FIELD-PLAT-REFERENCE-STATE, FIELD-PLAT-RESOURCE-STATE, FIELD-PLAT-REVISION；写入：FIELD-PLAT-AUDIT, FIELD-PLAT-OP-STATE, FIELD-PLAT-EXTENSION-PASSWORD, FIELD-PLAT-EXTENSION-AREA, FIELD-PLAT-EXTENSION-ACTIVE, FIELD-PLAT-EXTENSION-OUTBOUND, FIELD-PLAT-EXTENSION-DIRECT, FIELD-PLAT-EXTENSION-IBRECORD, FIELD-PLAT-EXTENSION-OBRECORD, FIELD-PLAT-EXTENSION-JITTER, FIELD-PLAT-EXTENSION-DENOISE, FIELD-PLAT-EXTENSION-POWER, FIELD-PLAT-EXTENSION-NETWORK

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

## 分支与异常

### LOCAL-PLAT-RESOURCE-EXTENSION-DELETE-B1

条件：前提、字段及对象修订校验通过且结果明确成功

结果：仅准确可删分机确认删除；原不提供删除能力的变体不得被通用入口新增

涉及字段：FIELD-PLAT-RESOURCE-SCOPE, FIELD-PLAT-EXTENSION-ID, FIELD-PLAT-REFERENCE-STATE, FIELD-PLAT-RESOURCE-STATE, FIELD-PLAT-REVISION, FIELD-PLAT-AUDIT, FIELD-PLAT-OP-STATE

验证：CHECK-PLAT-RESOURCE-EXTENSION-DELETE

### LOCAL-PLAT-RESOURCE-EXTENSION-DELETE-B2

条件：无权/字段不合法/对象失效/修订冲突

结果：明确显示本次拒绝原因，保留可继续的输入和已确认原值，不作变更

涉及字段：FIELD-PLAT-RESOURCE-SCOPE, FIELD-PLAT-EXTENSION-ID, FIELD-PLAT-REFERENCE-STATE, FIELD-PLAT-RESOURCE-STATE, FIELD-PLAT-REVISION, FIELD-PLAT-AUDIT, FIELD-PLAT-OP-STATE

验证：CHECK-PLAT-RESOURCE-EXTENSION-DELETE

### LOCAL-PLAT-RESOURCE-EXTENSION-DELETE-B3

条件：提交失败或结果未知

结果：失败保留原确认值；未知显示待核并按同请求核对，不重复提交或假报成功

涉及字段：FIELD-PLAT-RESOURCE-SCOPE, FIELD-PLAT-EXTENSION-ID, FIELD-PLAT-REFERENCE-STATE, FIELD-PLAT-RESOURCE-STATE, FIELD-PLAT-REVISION, FIELD-PLAT-AUDIT, FIELD-PLAT-OP-STATE

验证：CHECK-PLAT-RESOURCE-EXTENSION-DELETE

## 完成后的状态

- 仅准确可删分机确认删除；原不提供删除能力的变体不得被通用入口新增

## 字段定义

- [FIELD-PLAT-AUDIT](../field-specs.md#FIELD-PLAT-AUDIT)
- [FIELD-PLAT-EXTENSION-ACTIVE](../field-specs.md#FIELD-PLAT-EXTENSION-ACTIVE)
- [FIELD-PLAT-EXTENSION-AREA](../field-specs.md#FIELD-PLAT-EXTENSION-AREA)
- [FIELD-PLAT-EXTENSION-DENOISE](../field-specs.md#FIELD-PLAT-EXTENSION-DENOISE)
- [FIELD-PLAT-EXTENSION-DIRECT](../field-specs.md#FIELD-PLAT-EXTENSION-DIRECT)
- [FIELD-PLAT-EXTENSION-IBRECORD](../field-specs.md#FIELD-PLAT-EXTENSION-IBRECORD)
- [FIELD-PLAT-EXTENSION-ID](../field-specs.md#FIELD-PLAT-EXTENSION-ID)
- [FIELD-PLAT-EXTENSION-JITTER](../field-specs.md#FIELD-PLAT-EXTENSION-JITTER)
- [FIELD-PLAT-EXTENSION-NETWORK](../field-specs.md#FIELD-PLAT-EXTENSION-NETWORK)
- [FIELD-PLAT-EXTENSION-OBRECORD](../field-specs.md#FIELD-PLAT-EXTENSION-OBRECORD)
- [FIELD-PLAT-EXTENSION-OUTBOUND](../field-specs.md#FIELD-PLAT-EXTENSION-OUTBOUND)
- [FIELD-PLAT-EXTENSION-PASSWORD](../field-specs.md#FIELD-PLAT-EXTENSION-PASSWORD)
- [FIELD-PLAT-EXTENSION-POWER](../field-specs.md#FIELD-PLAT-EXTENSION-POWER)
- [FIELD-PLAT-OP-STATE](../field-specs.md#FIELD-PLAT-OP-STATE)
- [FIELD-PLAT-REFERENCE-STATE](../field-specs.md#FIELD-PLAT-REFERENCE-STATE)
- [FIELD-PLAT-RESOURCE-SCOPE](../field-specs.md#FIELD-PLAT-RESOURCE-SCOPE)
- [FIELD-PLAT-RESOURCE-STATE](../field-specs.md#FIELD-PLAT-RESOURCE-STATE)
- [FIELD-PLAT-REVISION](../field-specs.md#FIELD-PLAT-REVISION)

## 来源与验证

来源条目：acceptance:AC-2071, acceptance:AC-2072, features:FUNC-2002, features:FUNC-2002/behavior_spec/70/branches/0, features:FUNC-2002/behavior_spec/70/branches/1, features:FUNC-2002/behavior_spec/70/branches/2, features:FUNC-2002/behavior_spec/70/postconditions/0, features:FUNC-2002/behavior_spec/70/preconditions/0, features:FUNC-2002/behavior_spec/70/preconditions/1, features:FUNC-2002/behavior_spec/70/preconditions/2, features:FUNC-2002/behavior_spec/70/steps/0, features:FUNC-2002/behavior_spec/70/steps/1, features:FUNC-2002/behavior_spec/70/steps/2, pages:PAGE-2003/fields/17, pages:PAGE-2003/fields/2, pages:PAGE-2003/fields/21, pages:PAGE-2003/fields/23, pages:PAGE-2003/fields/24, pages:PAGE-2004/fields/0, pages:PAGE-2004/fields/2, pages:PAGE-2004/fields/3, pages:PAGE-2004/fields/5, pages:PAGE-2005/fields/0, pages:PAGE-2005/fields/5, pages:PAGE-2005/fields/9, pages:PAGE-2006/fields/56, pages:PAGE-2006/fields/57, pages:PAGE-2006/fields/58, pages:PAGE-2007/fields/1, pages:PAGE-2007/fields/21, pages:PAGE-2007/fields/25, pages:PAGE-2103/fields/13, pages:PAGE-2103/fields/20, pages:PAGE-2103/fields/3, pages:PAGE-2105/fields/4, pages:PAGE-2106/fields/9, pages:PAGE-2107/fields/4, pages:PAGE-2108/fields/19, pages:PAGE-2108/fields/4, pages:PAGE-2109/fields/3, pages:PAGE-2109/fields/9, pages:PAGE-2110/fields/11, pages:PAGE-2110/fields/12, pages:PAGE-2110/fields/7, pages:PAGE-2110/fields/8, pages:PAGE-2111/fields/12, pages:PAGE-2111/fields/16, pages:PAGE-2112/fields/11, pages:PAGE-2112/fields/14, pages:PAGE-2112/fields/6, pages:PAGE-2202/fields/1, pages:PAGE-2202/fields/21, pages:PAGE-2202/fields/29, pages:PAGE-2202/fields/30, pages:PAGE-2203/fields/63, pages:PAGE-2204/fields/71, pages:PAGE-2204/fields/77, pages:PAGE-2204/fields/83, pages:PAGE-2204/fields/84, pages:PAGE-2205/fields/0, pages:PAGE-2205/fields/10, pages:PAGE-2205/fields/16, pages:PAGE-2205/fields/17, pages:PAGE-2206/fields/0, pages:PAGE-2206/fields/10, pages:PAGE-2206/fields/16, pages:PAGE-2206/fields/17, pages:PAGE-2207/fields/0, pages:PAGE-2207/fields/14, pages:PAGE-2207/fields/18, pages:PAGE-2208/fields/9, pages:PAGE-2209/fields/7, pages:PAGE-2210/fields/0, pages:PAGE-2210/fields/1, pages:PAGE-2210/fields/4, pages:PAGE-2210/fields/6, pages:PAGE-2210/fields/7, pages:PAGE-2210/fields/8, pages:PAGE-2211/fields/0, pages:PAGE-2211/fields/1, pages:PAGE-2211/fields/5, pages:PAGE-2211/fields/6, pages:PAGE-2211/fields/7, pages:PAGE-2212/fields/0, pages:PAGE-2212/fields/1, pages:PAGE-2212/fields/10, pages:PAGE-2212/fields/11, pages:PAGE-2212/fields/12, pages:PAGE-2212/fields/8, pages:PAGE-2213/fields/0, pages:PAGE-2213/fields/1, pages:PAGE-2213/fields/26, pages:PAGE-2213/fields/27, pages:PAGE-2213/fields/28, pages:PAGE-2214/fields/0, pages:PAGE-2214/fields/2, pages:PAGE-2214/fields/5, pages:PAGE-2215/fields/0, pages:PAGE-2215/fields/3, pages:PAGE-2215/fields/7, pages:PAGE-2215/fields/8, pages:PAGE-2215/fields/9, pages:PAGE-2216/fields/0, pages:PAGE-2216/fields/1, pages:PAGE-2216/fields/11, pages:PAGE-2216/fields/12, pages:PAGE-2216/fields/13, pages:PAGE-2216/fields/9, pages:PAGE-2217, pages:PAGE-2217/actions/0, pages:PAGE-2217/fields/0, pages:PAGE-2217/fields/1, pages:PAGE-2217/fields/10, pages:PAGE-2217/fields/11, pages:PAGE-2217/fields/12, pages:PAGE-2217/fields/13, pages:PAGE-2217/fields/16, pages:PAGE-2217/fields/18, pages:PAGE-2217/fields/19, pages:PAGE-2217/fields/2, pages:PAGE-2217/fields/20, pages:PAGE-2217/fields/3, pages:PAGE-2217/fields/4, pages:PAGE-2217/fields/5, pages:PAGE-2217/fields/6, pages:PAGE-2217/fields/7, pages:PAGE-2217/fields/8, pages:PAGE-2217/fields/9, pages:PAGE-2218/fields/0, pages:PAGE-2218/fields/1, pages:PAGE-2218/fields/4, pages:PAGE-2218/fields/6, pages:PAGE-2218/fields/7, pages:PAGE-2218/fields/8, pages:PAGE-2219/fields/0, pages:PAGE-2219/fields/12, pages:PAGE-2219/fields/13, pages:PAGE-2219/fields/14, pages:PAGE-2219/fields/8, pages:PAGE-2220/fields/12, pages:PAGE-2220/fields/16, pages:PAGE-2220/fields/18, pages:PAGE-2220/fields/19, pages:PAGE-2220/fields/20, pages:PAGE-2220/fields/7, pages:PAGE-2221/fields/0, pages:PAGE-2221/fields/7, pages:PAGE-2222/fields/0, pages:PAGE-2222/fields/4, pages:PAGE-2223/fields/35, pages:PAGE-2223/fields/38, pages:PAGE-2223/fields/39, pages:PAGE-2225/fields/2, pages:PAGE-2227/fields/120, pages:PAGE-2227/fields/137, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/203, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/204, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/206, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/207, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/283, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/284, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/306, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/350, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/351, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/352, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/353, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/354, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/355, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/356, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/357, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/358, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/359, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/360, scenarios:FLOW-CURRENT-PLATFORM/steps/98

验证：CHECK-PLAT-RESOURCE-EXTENSION-DELETE

## 实施任务

- [TASK-054](../tasks/TASK-054.md)
