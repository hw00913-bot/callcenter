# LOCAL-PLAT-SEAT-BATCH-CREATE 批量开通供应商坐席

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md) · [全局逻辑](../global-logic.md)

- [进入有权工作位置与保留专业能力 · FUNC\-2002](../features/FUNC-2002.md)

## 职责与触发

所属工程模块：未填写

功能：FUNC-2002

触发：坐席页原批量开通表单预检查后独立提交

## 前置条件

- 原坐席开通权，准确企业和工号候选

## 必须遵守的全局规则

- [GR-IDENTITY](../global-logic.md#GR-IDENTITY)
- [GR-SCOPE](../global-logic.md#GR-SCOPE)
- [GR-AUTH](../global-logic.md#GR-AUTH)
- [GR-SERIAL](../global-logic.md#GR-SERIAL)
- [GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)

## 输入与输出

输入：[FIELD-PLAT-RESOURCE-SCOPE](../field-specs.md#FIELD-PLAT-RESOURCE-SCOPE)、[FIELD-PLAT-SEAT-BATCH](../field-specs.md#FIELD-PLAT-SEAT-BATCH)、[FIELD-PLAT-REQUEST](../field-specs.md#FIELD-PLAT-REQUEST)

输出：[FIELD-PLAT-SEAT-BATCH](../field-specs.md#FIELD-PLAT-SEAT-BATCH)、[FIELD-PLAT-RESOURCE-STATE](../field-specs.md#FIELD-PLAT-RESOURCE-STATE)、[FIELD-PLAT-AUDIT](../field-specs.md#FIELD-PLAT-AUDIT)

## 处理步骤

### LOCAL-PLAT-SEAT-BATCH-CREATE-S1

逐工号检查合法、重复、本地/远端存在性；捕获同journal请求

读取：FIELD-PLAT-RESOURCE-SCOPE, FIELD-PLAT-SEAT-BATCH, FIELD-PLAT-REQUEST；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-SERIAL, GR-UNKNOWN

### LOCAL-PLAT-SEAT-BATCH-CREATE-S2

逐项记录确认已建/明确失败/未知，部分成功不伪造整批成功或回滚

读取：FIELD-PLAT-RESOURCE-SCOPE, FIELD-PLAT-SEAT-BATCH, FIELD-PLAT-REQUEST；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-SERIAL, GR-UNKNOWN

### LOCAL-PLAT-SEAT-BATCH-CREATE-S3

未知工号不重新创建，交专门核对；本地持久错误不掩饰远端已建

读取：FIELD-PLAT-RESOURCE-SCOPE, FIELD-PLAT-SEAT-BATCH, FIELD-PLAT-REQUEST；写入：FIELD-PLAT-SEAT-BATCH, FIELD-PLAT-RESOURCE-STATE, FIELD-PLAT-AUDIT

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-SERIAL, GR-UNKNOWN

## 分支与异常

### LOCAL-PLAT-SEAT-BATCH-CREATE-B1

条件：前提、字段及对象修订校验通过且结果明确成功

结果：批量结果逐工号可追溯，不重复创建待核工号

涉及字段：FIELD-PLAT-RESOURCE-SCOPE, FIELD-PLAT-SEAT-BATCH, FIELD-PLAT-REQUEST, FIELD-PLAT-RESOURCE-STATE, FIELD-PLAT-AUDIT

验证：CHECK-PLAT-SEAT-BATCH-CREATE

### LOCAL-PLAT-SEAT-BATCH-CREATE-B2

条件：无权/字段不合法/对象失效/修订冲突

结果：明确显示本次拒绝原因，保留可继续的输入和已确认原值，不作变更

涉及字段：FIELD-PLAT-RESOURCE-SCOPE, FIELD-PLAT-SEAT-BATCH, FIELD-PLAT-REQUEST, FIELD-PLAT-RESOURCE-STATE, FIELD-PLAT-AUDIT

验证：CHECK-PLAT-SEAT-BATCH-CREATE

### LOCAL-PLAT-SEAT-BATCH-CREATE-B3

条件：提交失败或结果未知

结果：失败保留原确认值；未知显示待核并按同请求核对，不重复提交或假报成功

涉及字段：FIELD-PLAT-RESOURCE-SCOPE, FIELD-PLAT-SEAT-BATCH, FIELD-PLAT-REQUEST, FIELD-PLAT-RESOURCE-STATE, FIELD-PLAT-AUDIT

验证：CHECK-PLAT-SEAT-BATCH-CREATE

## 完成后的状态

- 批量结果逐工号可追溯，不重复创建待核工号

## 字段定义

- [FIELD-PLAT-AUDIT](../field-specs.md#FIELD-PLAT-AUDIT)
- [FIELD-PLAT-REQUEST](../field-specs.md#FIELD-PLAT-REQUEST)
- [FIELD-PLAT-RESOURCE-SCOPE](../field-specs.md#FIELD-PLAT-RESOURCE-SCOPE)
- [FIELD-PLAT-RESOURCE-STATE](../field-specs.md#FIELD-PLAT-RESOURCE-STATE)
- [FIELD-PLAT-SEAT-BATCH](../field-specs.md#FIELD-PLAT-SEAT-BATCH)

## 来源与验证

来源条目：acceptance:AC-2071, acceptance:AC-2072, features:FUNC-2002, features:FUNC-2002/behavior_spec/79/branches/0, features:FUNC-2002/behavior_spec/79/branches/1, features:FUNC-2002/behavior_spec/79/branches/2, features:FUNC-2002/behavior_spec/79/postconditions/0, features:FUNC-2002/behavior_spec/79/preconditions/0, features:FUNC-2002/behavior_spec/79/steps/0, features:FUNC-2002/behavior_spec/79/steps/1, features:FUNC-2002/behavior_spec/79/steps/2, pages:PAGE-2003/fields/2, pages:PAGE-2003/fields/22, pages:PAGE-2003/fields/23, pages:PAGE-2004/fields/0, pages:PAGE-2004/fields/4, pages:PAGE-2005/fields/0, pages:PAGE-2005/fields/8, pages:PAGE-2006/fields/56, pages:PAGE-2007/fields/1, pages:PAGE-2007/fields/24, pages:PAGE-2103/fields/19, pages:PAGE-2103/fields/3, pages:PAGE-2105/fields/4, pages:PAGE-2106/fields/9, pages:PAGE-2107/fields/4, pages:PAGE-2108/fields/18, pages:PAGE-2108/fields/19, pages:PAGE-2108/fields/4, pages:PAGE-2109/fields/3, pages:PAGE-2110/fields/7, pages:PAGE-2111/fields/12, pages:PAGE-2112/fields/13, pages:PAGE-2112/fields/6, pages:PAGE-2202/fields/1, pages:PAGE-2202/fields/28, pages:PAGE-2202/fields/29, pages:PAGE-2203/fields/63, pages:PAGE-2204/fields/71, pages:PAGE-2204/fields/82, pages:PAGE-2204/fields/83, pages:PAGE-2205/fields/0, pages:PAGE-2205/fields/15, pages:PAGE-2205/fields/16, pages:PAGE-2206/fields/0, pages:PAGE-2206/fields/15, pages:PAGE-2206/fields/16, pages:PAGE-2207/fields/0, pages:PAGE-2207/fields/17, pages:PAGE-2208/fields/9, pages:PAGE-2209/fields/7, pages:PAGE-2210, pages:PAGE-2210/actions/0, pages:PAGE-2210/fields/0, pages:PAGE-2210/fields/11, pages:PAGE-2210/fields/5, pages:PAGE-2210/fields/6, pages:PAGE-2210/fields/7, pages:PAGE-2211/fields/0, pages:PAGE-2211/fields/4, pages:PAGE-2211/fields/5, pages:PAGE-2211/fields/6, pages:PAGE-2212/fields/0, pages:PAGE-2212/fields/10, pages:PAGE-2212/fields/11, pages:PAGE-2212/fields/9, pages:PAGE-2213/fields/0, pages:PAGE-2213/fields/25, pages:PAGE-2213/fields/26, pages:PAGE-2213/fields/27, pages:PAGE-2214/fields/0, pages:PAGE-2214/fields/4, pages:PAGE-2214/fields/5, pages:PAGE-2214/fields/7, pages:PAGE-2215/fields/0, pages:PAGE-2215/fields/6, pages:PAGE-2215/fields/7, pages:PAGE-2215/fields/8, pages:PAGE-2216/fields/0, pages:PAGE-2216/fields/10, pages:PAGE-2216/fields/11, pages:PAGE-2216/fields/12, pages:PAGE-2217/fields/0, pages:PAGE-2217/fields/17, pages:PAGE-2217/fields/18, pages:PAGE-2217/fields/19, pages:PAGE-2218/fields/0, pages:PAGE-2218/fields/5, pages:PAGE-2218/fields/6, pages:PAGE-2218/fields/7, pages:PAGE-2219/fields/0, pages:PAGE-2219/fields/11, pages:PAGE-2219/fields/12, pages:PAGE-2219/fields/13, pages:PAGE-2220/fields/17, pages:PAGE-2220/fields/18, pages:PAGE-2220/fields/19, pages:PAGE-2220/fields/7, pages:PAGE-2221/fields/0, pages:PAGE-2221/fields/6, pages:PAGE-2221/fields/7, pages:PAGE-2222/fields/0, pages:PAGE-2222/fields/4, pages:PAGE-2223/fields/35, pages:PAGE-2225/fields/2, pages:PAGE-2227/fields/120, pages:PAGE-2227/fields/136, pages:PAGE-2227/fields/137, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/186, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/188, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/264, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/265, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/272, scenarios:FLOW-CURRENT-PLATFORM/steps/107

验证：CHECK-PLAT-SEAT-BATCH-CREATE

## 实施任务

- [TASK-050](../tasks/TASK-050.md)
