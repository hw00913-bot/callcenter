# LOCAL-PLAT-FINANCE-QUERY 查询AI用量及服务明细

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md) · [全局逻辑](../global-logic.md)

- [进入有权工作位置与保留专业能力 · FUNC\-2002](../features/FUNC-2002.md)

## 职责与触发

所属工程模块：未填写

功能：FUNC-2002

触发：AI用量与服务查看摘要/使用天数/任务明细

## 前置条件

- 五角色中有原服务或用量读取资格；四租户角色限本租户

## 必须遵守的全局规则

- [GR-IDENTITY](../global-logic.md#GR-IDENTITY)
- [GR-SCOPE](../global-logic.md#GR-SCOPE)
- [GR-AUTH](../global-logic.md#GR-AUTH)
- [GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)
- [GR-LIST-ORDER](../global-logic.md#GR-LIST-ORDER)

## 输入与输出

输入：[FIELD-PLAT-QUERY](../field-specs.md#FIELD-PLAT-QUERY)、[FIELD-PLAT-AI-TENANT](../field-specs.md#FIELD-PLAT-AI-TENANT)、[FIELD-PLAT-SERVICE-MANUAL](../field-specs.md#FIELD-PLAT-SERVICE-MANUAL)

输出：[FIELD-PLAT-SERVICE-STATE](../field-specs.md#FIELD-PLAT-SERVICE-STATE)、[FIELD-PLAT-SERVICE-VALIDITY](../field-specs.md#FIELD-PLAT-SERVICE-VALIDITY)、[FIELD-PLAT-MINUTES-AVAILABLE](../field-specs.md#FIELD-PLAT-MINUTES-AVAILABLE)、[FIELD-PLAT-MINUTES-FROZEN](../field-specs.md#FIELD-PLAT-MINUTES-FROZEN)、[FIELD-PLAT-MINUTES-CONSUMED](../field-specs.md#FIELD-PLAT-MINUTES-CONSUMED)、[FIELD-PLAT-SERVICE-CONTROL](../field-specs.md#FIELD-PLAT-SERVICE-CONTROL)、[FIELD-PLAT-REPORT-DATA](../field-specs.md#FIELD-PLAT-REPORT-DATA)

## 处理步骤

### LOCAL-PLAT-FINANCE-QUERY-S1

摘要、按天、按任务的原指标及筛选分别读取，不合并Cloud账务

读取：FIELD-PLAT-QUERY, FIELD-PLAT-AI-TENANT；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

### LOCAL-PLAT-FINANCE-QUERY-S2

服务数据缺失/失败/待核不填0；余额不由累计统计反算

读取：FIELD-PLAT-QUERY, FIELD-PLAT-AI-TENANT；写入：FIELD-PLAT-SERVICE-STATE, FIELD-PLAT-SERVICE-VALIDITY, FIELD-PLAT-MINUTES-AVAILABLE, FIELD-PLAT-MINUTES-FROZEN, FIELD-PLAT-MINUTES-CONSUMED, FIELD-PLAT-SERVICE-CONTROL, FIELD-PLAT-REPORT-DATA

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

## 分支与异常

### LOCAL-PLAT-FINANCE-QUERY-B1

条件：前提、字段及对象修订校验通过且结果明确成功

结果：当前授权服务/用量可靠展示；读取不授充值、调整或导出权

涉及字段：FIELD-PLAT-QUERY, FIELD-PLAT-AI-TENANT, FIELD-PLAT-SERVICE-STATE, FIELD-PLAT-SERVICE-VALIDITY, FIELD-PLAT-MINUTES-AVAILABLE, FIELD-PLAT-MINUTES-FROZEN, FIELD-PLAT-MINUTES-CONSUMED, FIELD-PLAT-SERVICE-CONTROL, FIELD-PLAT-REPORT-DATA

验证：CHECK-PLAT-FINANCE-QUERY

### LOCAL-PLAT-FINANCE-QUERY-B2

条件：无权/字段不合法/对象失效/修订冲突

结果：明确显示本次拒绝原因，保留可继续的输入和已确认原值，不作变更

涉及字段：FIELD-PLAT-QUERY, FIELD-PLAT-AI-TENANT, FIELD-PLAT-SERVICE-STATE, FIELD-PLAT-SERVICE-VALIDITY, FIELD-PLAT-MINUTES-AVAILABLE, FIELD-PLAT-MINUTES-FROZEN, FIELD-PLAT-MINUTES-CONSUMED, FIELD-PLAT-SERVICE-CONTROL, FIELD-PLAT-REPORT-DATA

验证：CHECK-PLAT-FINANCE-QUERY

### LOCAL-PLAT-FINANCE-QUERY-B3

条件：提交失败或结果未知

结果：失败保留原确认值；未知显示待核并按同请求核对，不重复提交或假报成功

涉及字段：FIELD-PLAT-QUERY, FIELD-PLAT-AI-TENANT, FIELD-PLAT-SERVICE-STATE, FIELD-PLAT-SERVICE-VALIDITY, FIELD-PLAT-MINUTES-AVAILABLE, FIELD-PLAT-MINUTES-FROZEN, FIELD-PLAT-MINUTES-CONSUMED, FIELD-PLAT-SERVICE-CONTROL, FIELD-PLAT-REPORT-DATA

验证：CHECK-PLAT-FINANCE-QUERY

## 完成后的状态

- 当前授权服务/用量可靠展示；读取不授充值、调整或导出权

## 字段定义

- [FIELD-PLAT-AI-TENANT](../field-specs.md#FIELD-PLAT-AI-TENANT)
- [FIELD-PLAT-MINUTES-AVAILABLE](../field-specs.md#FIELD-PLAT-MINUTES-AVAILABLE)
- [FIELD-PLAT-MINUTES-CONSUMED](../field-specs.md#FIELD-PLAT-MINUTES-CONSUMED)
- [FIELD-PLAT-MINUTES-FROZEN](../field-specs.md#FIELD-PLAT-MINUTES-FROZEN)
- [FIELD-PLAT-QUERY](../field-specs.md#FIELD-PLAT-QUERY)
- [FIELD-PLAT-REPORT-DATA](../field-specs.md#FIELD-PLAT-REPORT-DATA)
- [FIELD-PLAT-SERVICE-CONTROL](../field-specs.md#FIELD-PLAT-SERVICE-CONTROL)
- [FIELD-PLAT-SERVICE-MANUAL](../field-specs.md#FIELD-PLAT-SERVICE-MANUAL)
- [FIELD-PLAT-SERVICE-STATE](../field-specs.md#FIELD-PLAT-SERVICE-STATE)
- [FIELD-PLAT-SERVICE-VALIDITY](../field-specs.md#FIELD-PLAT-SERVICE-VALIDITY)

## 来源与验证

来源条目：acceptance:AC-2063, acceptance:AC-2064, acceptance:AC-2065, features:FUNC-2002, features:FUNC-2002/behavior_spec/20/branches/0, features:FUNC-2002/behavior_spec/20/branches/1, features:FUNC-2002/behavior_spec/20/branches/2, features:FUNC-2002/behavior_spec/20/postconditions/0, features:FUNC-2002/behavior_spec/20/preconditions/0, features:FUNC-2002/behavior_spec/20/steps/0, features:FUNC-2002/behavior_spec/20/steps/1, pages:PAGE-2002/fields/4, pages:PAGE-2003/fields/20, pages:PAGE-2005/fields/7, pages:PAGE-2007/fields/23, pages:PAGE-2102, pages:PAGE-2102/actions/0, pages:PAGE-2102/fields/0, pages:PAGE-2102/fields/1, pages:PAGE-2102/fields/10, pages:PAGE-2102/fields/2, pages:PAGE-2102/fields/3, pages:PAGE-2102/fields/4, pages:PAGE-2102/fields/5, pages:PAGE-2102/fields/6, pages:PAGE-2102/fields/8, pages:PAGE-2102/fields/9, pages:PAGE-2103/fields/17, pages:PAGE-2103/fields/2, pages:PAGE-2105/fields/1, pages:PAGE-2105/fields/2, pages:PAGE-2106/fields/0, pages:PAGE-2106/fields/10, pages:PAGE-2106/fields/11, pages:PAGE-2106/fields/12, pages:PAGE-2106/fields/13, pages:PAGE-2106/fields/2, pages:PAGE-2106/fields/3, pages:PAGE-2106/fields/4, pages:PAGE-2106/fields/6, pages:PAGE-2106/fields/7, pages:PAGE-2107/fields/1, pages:PAGE-2107/fields/2, pages:PAGE-2108/fields/16, pages:PAGE-2109/fields/2, pages:PAGE-2109/fields/7, pages:PAGE-2110/fields/10, pages:PAGE-2110/fields/5, pages:PAGE-2111/fields/10, pages:PAGE-2111/fields/15, pages:PAGE-2112/fields/10, pages:PAGE-2112/fields/12, pages:PAGE-2112/fields/15, pages:PAGE-2112/fields/20, pages:PAGE-2112/fields/25, pages:PAGE-2112/fields/26, pages:PAGE-2112/fields/5, pages:PAGE-2112/fields/8, pages:PAGE-2112/fields/9, pages:PAGE-2202/fields/26, pages:PAGE-2203/fields/61, pages:PAGE-2204/fields/81, pages:PAGE-2205/fields/13, pages:PAGE-2206/fields/13, pages:PAGE-2208/fields/6, pages:PAGE-2209/fields/3, pages:PAGE-2209/fields/4, pages:PAGE-2210/fields/3, pages:PAGE-2211/fields/3, pages:PAGE-2212/fields/7, pages:PAGE-2213/fields/3, pages:PAGE-2215/fields/5, pages:PAGE-2216/fields/8, pages:PAGE-2217/fields/15, pages:PAGE-2218/fields/3, pages:PAGE-2219/fields/10, pages:PAGE-2220/fields/15, pages:PAGE-2225/fields/1, pages:PAGE-2227/fields/134, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/216, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/243, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/274, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/275, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/276, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/277, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/278, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/279, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/324, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/404, scenarios:FLOW-CURRENT-PLATFORM/steps/46

验证：CHECK-PLAT-FINANCE-QUERY

## 实施任务

- [TASK-040](../tasks/TASK-040.md)
