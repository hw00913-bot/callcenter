# LOCAL-PLAT-AI-IMPORT-HISTORY 查询AI导入记录

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md) · [全局逻辑](../global-logic.md)

- [进入有权工作位置与保留专业能力 · FUNC\-2002](../features/FUNC-2002.md)

## 职责与触发

所属工程模块：未填写

功能：FUNC-2002

触发：AI任务查看导入历史

## 前置条件

- 准确任务导入记录读取权

## 必须遵守的全局规则

- [GR-IDENTITY](../global-logic.md#GR-IDENTITY)
- [GR-SCOPE](../global-logic.md#GR-SCOPE)
- [GR-AUTH](../global-logic.md#GR-AUTH)
- [GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)
- [GR-LIST-ORDER](../global-logic.md#GR-LIST-ORDER)
- [GR-TASK-UNIFIED-IMPORT](../global-logic.md#GR-TASK-UNIFIED-IMPORT)

## 输入与输出

输入：[FIELD-PLAT-TASK-ID](../field-specs.md#FIELD-PLAT-TASK-ID)、[FIELD-PLAT-QUERY](../field-specs.md#FIELD-PLAT-QUERY)、[FIELD-FLOW-TASK-IMPORT-SOURCE](../field-specs.md#FIELD-FLOW-TASK-IMPORT-SOURCE)、[FIELD-PLAT-TASK-BUSINESS-RECORD-ID](../field-specs.md#FIELD-PLAT-TASK-BUSINESS-RECORD-ID)

输出：[FIELD-PLAT-IMPORT-BATCH](../field-specs.md#FIELD-PLAT-IMPORT-BATCH)、[FIELD-PLAT-PAGING](../field-specs.md#FIELD-PLAT-PAGING)、[FIELD-PLAT-TASK-BUSINESS-RECORD-ID](../field-specs.md#FIELD-PLAT-TASK-BUSINESS-RECORD-ID)

## 处理步骤

### LOCAL-PLAT-AI-IMPORT-HISTORY-S1

按任务稳定ID过滤本租户批次

读取：FIELD-PLAT-TASK-ID, FIELD-PLAT-QUERY；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

### LOCAL-PLAT-AI-IMPORT-HISTORY-S2

展示原文件/条数/提交人/时间/结果，未知与失败区分；本轮新AI/PRED业务仅按准确taskImportSource和原任务读取权投影recordId/必要字段；旧专业名单/历史依其原身份显示，不能按手机号补链，不以业务记录数改写供应商受理或通话事实；投影办理模式及详情副标题读当前有权业务的真实handlingMode；新TASK DIRECT不启用模板；旧无TASK历史明确合法启用后才可TEMPLATE，不能以导入来源硬写DIRECT；转出方仅本方截止历史；；

读取：FIELD-PLAT-TASK-ID, FIELD-PLAT-QUERY, FIELD-FLOW-TASK-IMPORT-SOURCE, FIELD-PLAT-TASK-BUSINESS-RECORD-ID；写入：FIELD-PLAT-IMPORT-BATCH, FIELD-PLAT-PAGING, FIELD-PLAT-TASK-BUSINESS-RECORD-ID

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER, GR-TASK-UNIFIED-IMPORT

## 分支与异常

### LOCAL-PLAT-AI-IMPORT-HISTORY-B1

条件：前提、字段及对象修订校验通过且结果明确成功

结果：仅显示该任务授权导入历史，不连带文件下载或任务控制权

涉及字段：FIELD-PLAT-TASK-ID, FIELD-PLAT-QUERY, FIELD-PLAT-IMPORT-BATCH, FIELD-PLAT-PAGING

验证：CHECK-PLAT-AI-IMPORT-HISTORY

### LOCAL-PLAT-AI-IMPORT-HISTORY-B2

条件：无权/字段不合法/对象失效/修订冲突

结果：明确显示本次拒绝原因，保留可继续的输入和已确认原值，不作变更

涉及字段：FIELD-PLAT-TASK-ID, FIELD-PLAT-QUERY, FIELD-PLAT-IMPORT-BATCH, FIELD-PLAT-PAGING

验证：CHECK-PLAT-AI-IMPORT-HISTORY

### LOCAL-PLAT-AI-IMPORT-HISTORY-B3

条件：提交失败或结果未知

结果：失败保留原确认值；未知显示待核并按同请求核对，不重复提交或假报成功

涉及字段：FIELD-PLAT-TASK-ID, FIELD-PLAT-QUERY, FIELD-PLAT-IMPORT-BATCH, FIELD-PLAT-PAGING

验证：CHECK-PLAT-AI-IMPORT-HISTORY

## 完成后的状态

- 仅显示该任务授权导入历史，不连带文件下载或任务控制权

## 字段定义

- [FIELD-PLAT-TASK-ID](../field-specs.md#FIELD-PLAT-TASK-ID)
- [FIELD-PLAT-QUERY](../field-specs.md#FIELD-PLAT-QUERY)
- [FIELD-FLOW-TASK-IMPORT-SOURCE](../field-specs.md#FIELD-FLOW-TASK-IMPORT-SOURCE)
- [FIELD-PLAT-TASK-BUSINESS-RECORD-ID](../field-specs.md#FIELD-PLAT-TASK-BUSINESS-RECORD-ID)
- [FIELD-PLAT-IMPORT-BATCH](../field-specs.md#FIELD-PLAT-IMPORT-BATCH)
- [FIELD-PLAT-PAGING](../field-specs.md#FIELD-PLAT-PAGING)

## 来源与验证

来源条目：acceptance:AC-2063, acceptance:AC-2064, features:FUNC-2002, features:FUNC-2002/behavior_spec/8/branches/0, features:FUNC-2002/behavior_spec/8/branches/1, features:FUNC-2002/behavior_spec/8/branches/2, features:FUNC-2002/behavior_spec/8/postconditions/0, features:FUNC-2002/behavior_spec/8/preconditions/0, features:FUNC-2002/behavior_spec/8/steps/0, features:FUNC-2002/behavior_spec/8/steps/1, pages:PAGE-2002/fields/2, pages:PAGE-2002/fields/4, pages:PAGE-2003/fields/18, pages:PAGE-2003/fields/20, pages:PAGE-2005/fields/6, pages:PAGE-2005/fields/7, pages:PAGE-2007/fields/22, pages:PAGE-2007/fields/23, pages:PAGE-2102/fields/4, pages:PAGE-2103, pages:PAGE-2103/actions/2, pages:PAGE-2103/fields/11, pages:PAGE-2103/fields/14, pages:PAGE-2103/fields/17, pages:PAGE-2103/fields/21, pages:PAGE-2103/fields/28, pages:PAGE-2103/fields/30, pages:PAGE-2105/fields/0, pages:PAGE-2105/fields/1, pages:PAGE-2106/fields/5, pages:PAGE-2106/fields/6, pages:PAGE-2107/fields/0, pages:PAGE-2107/fields/1, pages:PAGE-2108/fields/15, pages:PAGE-2108/fields/16, pages:PAGE-2109/fields/6, pages:PAGE-2109/fields/7, pages:PAGE-2110/fields/10, pages:PAGE-2110/fields/9, pages:PAGE-2111/fields/14, pages:PAGE-2111/fields/15, pages:PAGE-2112/fields/12, pages:PAGE-2202/fields/26, pages:PAGE-2203/fields/58, pages:PAGE-2203/fields/61, pages:PAGE-2204/fields/75, pages:PAGE-2204/fields/78, pages:PAGE-2204/fields/81, pages:PAGE-2204/fields/96, pages:PAGE-2205/fields/11, pages:PAGE-2205/fields/13, pages:PAGE-2205/fields/35, pages:PAGE-2205/fields/56, pages:PAGE-2205/fields/57, pages:PAGE-2205/fields/8, pages:PAGE-2206/fields/11, pages:PAGE-2206/fields/13, pages:PAGE-2206/fields/35, pages:PAGE-2206/fields/8, pages:PAGE-2208/fields/5, pages:PAGE-2208/fields/6, pages:PAGE-2209/fields/2, pages:PAGE-2209/fields/3, pages:PAGE-2209/fields/8, pages:PAGE-2210/fields/2, pages:PAGE-2210/fields/3, pages:PAGE-2211/fields/2, pages:PAGE-2211/fields/3, pages:PAGE-2212/fields/6, pages:PAGE-2212/fields/7, pages:PAGE-2213/fields/2, pages:PAGE-2213/fields/3, pages:PAGE-2214/fields/3, pages:PAGE-2215/fields/4, pages:PAGE-2215/fields/5, pages:PAGE-2216/fields/2, pages:PAGE-2216/fields/8, pages:PAGE-2217/fields/14, pages:PAGE-2217/fields/15, pages:PAGE-2218/fields/2, pages:PAGE-2218/fields/3, pages:PAGE-2219/fields/10, pages:PAGE-2219/fields/9, pages:PAGE-2220/fields/11, pages:PAGE-2220/fields/13, pages:PAGE-2220/fields/15, pages:PAGE-2221/fields/4, pages:PAGE-2222/fields/2, pages:PAGE-2225/fields/0, pages:PAGE-2225/fields/1, pages:PAGE-2226/fields/44, pages:PAGE-2227/fields/130, pages:PAGE-2227/fields/134, pages:PAGE-2227/fields/149, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/168, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/216, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/217, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/218, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/226, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/426, scenarios:FLOW-CURRENT-PLATFORM/steps/28

验证：CHECK-PLAT-AI-IMPORT-HISTORY

## 实施任务

- [TASK-034](../tasks/TASK-034.md)
