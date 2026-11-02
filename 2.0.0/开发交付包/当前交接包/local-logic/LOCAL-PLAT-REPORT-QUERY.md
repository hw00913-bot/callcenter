# LOCAL-PLAT-REPORT-QUERY 查询AI三类与Cloud七类专业报表

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md) · [全局逻辑](../global-logic.md)

- [进入有权工作位置与保留专业能力 · FUNC\-2002](../features/FUNC-2002.md)

## 职责与触发

所属工程模块：未填写

功能：FUNC-2002

触发：统计报表页选择报表并查询

## 前置条件

- 该具体报表读权，当前模块及对象范围合法

## 必须遵守的全局规则

- [GR-IDENTITY](../global-logic.md#GR-IDENTITY)
- [GR-SCOPE](../global-logic.md#GR-SCOPE)
- [GR-AUTH](../global-logic.md#GR-AUTH)
- [GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)
- [GR-LIST-ORDER](../global-logic.md#GR-LIST-ORDER)

## 输入与输出

输入：[FIELD-PLAT-QUERY](../field-specs.md#FIELD-PLAT-QUERY)、[FIELD-PLAT-REPORT-KIND](../field-specs.md#FIELD-PLAT-REPORT-KIND)、[FIELD-PLAT-RESOURCE-SCOPE](../field-specs.md#FIELD-PLAT-RESOURCE-SCOPE)

输出：[FIELD-PLAT-REPORT-DATA](../field-specs.md#FIELD-PLAT-REPORT-DATA)、[FIELD-PLAT-PAGING](../field-specs.md#FIELD-PLAT-PAGING)

## 处理步骤

### LOCAL-PLAT-REPORT-QUERY-S1

按FIELD-PLAT-REPORT-DATA.report_variants明确的Cloud七类/AI三类粒度、实际列、计量单位、归期、接通率分母、有效时长样本和质量统计分别计算/读取，禁止把AI/Cloud同名指标混算

读取：FIELD-PLAT-QUERY, FIELD-PLAT-REPORT-KIND, FIELD-PLAT-RESOURCE-SCOPE；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

### LOCAL-PLAT-REPORT-QUERY-S2

来源概览片段只保片段读权，不授整页或导出；未知不补0

读取：FIELD-PLAT-QUERY, FIELD-PLAT-REPORT-KIND, FIELD-PLAT-RESOURCE-SCOPE；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

### LOCAL-PLAT-REPORT-QUERY-S3

更新时间列表与时间趋势序列区分，趋势按时间轴展示

读取：FIELD-PLAT-QUERY, FIELD-PLAT-REPORT-KIND, FIELD-PLAT-RESOURCE-SCOPE；写入：FIELD-PLAT-REPORT-DATA, FIELD-PLAT-PAGING

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

## 分支与异常

### LOCAL-PLAT-REPORT-QUERY-B1

条件：前提、字段及对象修订校验通过且结果明确成功

结果：独立专业报表正确展示，AI/Cloud指标与账务不混合

涉及字段：FIELD-PLAT-QUERY, FIELD-PLAT-REPORT-KIND, FIELD-PLAT-RESOURCE-SCOPE, FIELD-PLAT-REPORT-DATA, FIELD-PLAT-PAGING

验证：CHECK-PLAT-REPORT-QUERY

### LOCAL-PLAT-REPORT-QUERY-B2

条件：无权/字段不合法/对象失效/修订冲突

结果：明确显示本次拒绝原因，保留可继续的输入和已确认原值，不作变更

涉及字段：FIELD-PLAT-QUERY, FIELD-PLAT-REPORT-KIND, FIELD-PLAT-RESOURCE-SCOPE, FIELD-PLAT-REPORT-DATA, FIELD-PLAT-PAGING

验证：CHECK-PLAT-REPORT-QUERY

### LOCAL-PLAT-REPORT-QUERY-B3

条件：提交失败或结果未知

结果：失败保留原确认值；未知显示待核并按同请求核对，不重复提交或假报成功

涉及字段：FIELD-PLAT-QUERY, FIELD-PLAT-REPORT-KIND, FIELD-PLAT-RESOURCE-SCOPE, FIELD-PLAT-REPORT-DATA, FIELD-PLAT-PAGING

验证：CHECK-PLAT-REPORT-QUERY

## 完成后的状态

- 独立专业报表正确展示，AI/Cloud指标与账务不混合

## 字段定义

- [FIELD-PLAT-PAGING](../field-specs.md#FIELD-PLAT-PAGING)
- [FIELD-PLAT-QUERY](../field-specs.md#FIELD-PLAT-QUERY)
- [FIELD-PLAT-REPORT-DATA](../field-specs.md#FIELD-PLAT-REPORT-DATA)
- [FIELD-PLAT-REPORT-KIND](../field-specs.md#FIELD-PLAT-REPORT-KIND)
- [FIELD-PLAT-RESOURCE-SCOPE](../field-specs.md#FIELD-PLAT-RESOURCE-SCOPE)

## 来源与验证

来源条目：acceptance:AC-2063, acceptance:AC-2064, acceptance:AC-2065, acceptance:AC-2072, features:FUNC-2002, features:FUNC-2002/behavior_spec/46/branches/0, features:FUNC-2002/behavior_spec/46/branches/1, features:FUNC-2002/behavior_spec/46/branches/2, features:FUNC-2002/behavior_spec/46/postconditions/0, features:FUNC-2002/behavior_spec/46/preconditions/0, features:FUNC-2002/behavior_spec/46/steps/0, features:FUNC-2002/behavior_spec/46/steps/1, features:FUNC-2002/behavior_spec/46/steps/2, pages:PAGE-2002/fields/2, pages:PAGE-2002/fields/4, pages:PAGE-2003/fields/18, pages:PAGE-2003/fields/20, pages:PAGE-2003/fields/23, pages:PAGE-2005/fields/6, pages:PAGE-2005/fields/7, pages:PAGE-2007/fields/22, pages:PAGE-2007/fields/23, pages:PAGE-2102/fields/4, pages:PAGE-2102/fields/5, pages:PAGE-2103/fields/14, pages:PAGE-2103/fields/17, pages:PAGE-2105, pages:PAGE-2105/actions/0, pages:PAGE-2105/fields/0, pages:PAGE-2105/fields/1, pages:PAGE-2105/fields/2, pages:PAGE-2105/fields/3, pages:PAGE-2105/fields/4, pages:PAGE-2106, pages:PAGE-2106/actions/0, pages:PAGE-2106/fields/5, pages:PAGE-2106/fields/6, pages:PAGE-2106/fields/7, pages:PAGE-2106/fields/8, pages:PAGE-2106/fields/9, pages:PAGE-2107, pages:PAGE-2107/actions/0, pages:PAGE-2107/fields/0, pages:PAGE-2107/fields/1, pages:PAGE-2107/fields/2, pages:PAGE-2107/fields/3, pages:PAGE-2107/fields/4, pages:PAGE-2108/fields/15, pages:PAGE-2108/fields/16, pages:PAGE-2108/fields/19, pages:PAGE-2109/fields/6, pages:PAGE-2109/fields/7, pages:PAGE-2110/fields/10, pages:PAGE-2110/fields/9, pages:PAGE-2111/fields/14, pages:PAGE-2111/fields/15, pages:PAGE-2112/fields/12, pages:PAGE-2202/fields/26, pages:PAGE-2202/fields/29, pages:PAGE-2203/fields/58, pages:PAGE-2203/fields/61, pages:PAGE-2203/fields/63, pages:PAGE-2204/fields/78, pages:PAGE-2204/fields/81, pages:PAGE-2204/fields/83, pages:PAGE-2205/fields/11, pages:PAGE-2205/fields/13, pages:PAGE-2205/fields/16, pages:PAGE-2206/fields/11, pages:PAGE-2206/fields/13, pages:PAGE-2206/fields/16, pages:PAGE-2208/fields/5, pages:PAGE-2208/fields/6, pages:PAGE-2208/fields/9, pages:PAGE-2209, pages:PAGE-2209/actions/0, pages:PAGE-2209/fields/2, pages:PAGE-2209/fields/3, pages:PAGE-2209/fields/4, pages:PAGE-2209/fields/6, pages:PAGE-2209/fields/7, pages:PAGE-2210/fields/2, pages:PAGE-2210/fields/3, pages:PAGE-2210/fields/6, pages:PAGE-2211/fields/2, pages:PAGE-2211/fields/3, pages:PAGE-2211/fields/5, pages:PAGE-2212/fields/10, pages:PAGE-2212/fields/6, pages:PAGE-2212/fields/7, pages:PAGE-2213/fields/2, pages:PAGE-2213/fields/26, pages:PAGE-2213/fields/3, pages:PAGE-2214/fields/3, pages:PAGE-2214/fields/5, pages:PAGE-2215/fields/4, pages:PAGE-2215/fields/5, pages:PAGE-2215/fields/7, pages:PAGE-2216/fields/11, pages:PAGE-2216/fields/2, pages:PAGE-2216/fields/8, pages:PAGE-2217/fields/14, pages:PAGE-2217/fields/15, pages:PAGE-2217/fields/18, pages:PAGE-2218/fields/2, pages:PAGE-2218/fields/3, pages:PAGE-2218/fields/6, pages:PAGE-2219/fields/10, pages:PAGE-2219/fields/12, pages:PAGE-2219/fields/9, pages:PAGE-2220/fields/13, pages:PAGE-2220/fields/15, pages:PAGE-2220/fields/18, pages:PAGE-2221/fields/4, pages:PAGE-2221/fields/7, pages:PAGE-2222/fields/2, pages:PAGE-2222/fields/4, pages:PAGE-2225/fields/0, pages:PAGE-2225/fields/1, pages:PAGE-2225/fields/2, pages:PAGE-2227/fields/130, pages:PAGE-2227/fields/134, pages:PAGE-2227/fields/137, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/211, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/212, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/278, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/318, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/319, scenarios:FLOW-CURRENT-PLATFORM/steps/74

验证：CHECK-PLAT-REPORT-QUERY

## 实施任务

- [TASK-047](../tasks/TASK-047.md)
