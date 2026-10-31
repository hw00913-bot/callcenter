# LOCAL-PLAT-LEAD-QUERY 查询AI线索及详情

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md) · [全局逻辑](../global-logic.md)

- [进入有权工作位置与保留专业能力 · FUNC\-2002](../features/FUNC-2002.md)

## 职责与触发

所属工程模块：未填写

功能：FUNC-2002

触发：AI线索记录页查询/查看

## 前置条件

- AI线索读权

## 必须遵守的全局规则

- [GR-IDENTITY](../global-logic.md#GR-IDENTITY)
- [GR-SCOPE](../global-logic.md#GR-SCOPE)
- [GR-AUTH](../global-logic.md#GR-AUTH)
- [GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)
- [GR-LIST-ORDER](../global-logic.md#GR-LIST-ORDER)

## 输入与输出

输入：[FIELD-PLAT-QUERY](../field-specs.md#FIELD-PLAT-QUERY)、[FIELD-PLAT-AI-TENANT](../field-specs.md#FIELD-PLAT-AI-TENANT)

输出：[FIELD-PLAT-AI-LEAD](../field-specs.md#FIELD-PLAT-AI-LEAD)、[FIELD-PLAT-CALL-ID](../field-specs.md#FIELD-PLAT-CALL-ID)、[FIELD-PLAT-AI-TAG-RESULT](../field-specs.md#FIELD-PLAT-AI-TAG-RESULT)、[FIELD-PLAT-PAGING](../field-specs.md#FIELD-PLAT-PAGING)

## 处理步骤

### LOCAL-PLAT-LEAD-QUERY-S1

按当前平台/场景/时间筛选和准确线索ID查看

读取：FIELD-PLAT-QUERY, FIELD-PLAT-AI-TENANT；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

### LOCAL-PLAT-LEAD-QUERY-S2

显示来源任务/通话和原标签，未匹配保留原值

读取：FIELD-PLAT-QUERY, FIELD-PLAT-AI-TENANT；写入：FIELD-PLAT-AI-LEAD, FIELD-PLAT-CALL-ID, FIELD-PLAT-AI-TAG-RESULT, FIELD-PLAT-PAGING

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

## 分支与异常

### LOCAL-PLAT-LEAD-QUERY-B1

条件：前提、字段及对象修订校验通过且结果明确成功

结果：准确AI线索只读展示，不改人工跟进或客户有效值

涉及字段：FIELD-PLAT-QUERY, FIELD-PLAT-AI-TENANT, FIELD-PLAT-AI-LEAD, FIELD-PLAT-CALL-ID, FIELD-PLAT-AI-TAG-RESULT, FIELD-PLAT-PAGING

验证：CHECK-PLAT-LEAD-QUERY

### LOCAL-PLAT-LEAD-QUERY-B2

条件：无权/字段不合法/对象失效/修订冲突

结果：明确显示本次拒绝原因，保留可继续的输入和已确认原值，不作变更

涉及字段：FIELD-PLAT-QUERY, FIELD-PLAT-AI-TENANT, FIELD-PLAT-AI-LEAD, FIELD-PLAT-CALL-ID, FIELD-PLAT-AI-TAG-RESULT, FIELD-PLAT-PAGING

验证：CHECK-PLAT-LEAD-QUERY

### LOCAL-PLAT-LEAD-QUERY-B3

条件：提交失败或结果未知

结果：失败保留原确认值；未知显示待核并按同请求核对，不重复提交或假报成功

涉及字段：FIELD-PLAT-QUERY, FIELD-PLAT-AI-TENANT, FIELD-PLAT-AI-LEAD, FIELD-PLAT-CALL-ID, FIELD-PLAT-AI-TAG-RESULT, FIELD-PLAT-PAGING

验证：CHECK-PLAT-LEAD-QUERY

## 完成后的状态

- 准确AI线索只读展示，不改人工跟进或客户有效值

## 字段定义

- [FIELD-PLAT-AI-LEAD](../field-specs.md#FIELD-PLAT-AI-LEAD)
- [FIELD-PLAT-AI-TAG-RESULT](../field-specs.md#FIELD-PLAT-AI-TAG-RESULT)
- [FIELD-PLAT-AI-TENANT](../field-specs.md#FIELD-PLAT-AI-TENANT)
- [FIELD-PLAT-CALL-ID](../field-specs.md#FIELD-PLAT-CALL-ID)
- [FIELD-PLAT-PAGING](../field-specs.md#FIELD-PLAT-PAGING)
- [FIELD-PLAT-QUERY](../field-specs.md#FIELD-PLAT-QUERY)

## 来源与验证

来源条目：acceptance:AC-2063, acceptance:AC-2064, features:FUNC-2002, features:FUNC-2002/behavior_spec/12/branches/0, features:FUNC-2002/behavior_spec/12/branches/1, features:FUNC-2002/behavior_spec/12/branches/2, features:FUNC-2002/behavior_spec/12/postconditions/0, features:FUNC-2002/behavior_spec/12/preconditions/0, features:FUNC-2002/behavior_spec/12/steps/0, features:FUNC-2002/behavior_spec/12/steps/1, pages:PAGE-2002/fields/2, pages:PAGE-2002/fields/4, pages:PAGE-2003/fields/18, pages:PAGE-2003/fields/20, pages:PAGE-2005/fields/6, pages:PAGE-2005/fields/7, pages:PAGE-2007/fields/0, pages:PAGE-2007/fields/18, pages:PAGE-2007/fields/22, pages:PAGE-2007/fields/23, pages:PAGE-2102/fields/0, pages:PAGE-2102/fields/4, pages:PAGE-2103/fields/0, pages:PAGE-2103/fields/14, pages:PAGE-2103/fields/17, pages:PAGE-2103/fields/2, pages:PAGE-2105/fields/0, pages:PAGE-2105/fields/1, pages:PAGE-2106/fields/0, pages:PAGE-2106/fields/5, pages:PAGE-2106/fields/6, pages:PAGE-2107/fields/0, pages:PAGE-2107/fields/1, pages:PAGE-2108/fields/12, pages:PAGE-2108/fields/15, pages:PAGE-2108/fields/16, pages:PAGE-2108/fields/3, pages:PAGE-2109, pages:PAGE-2109/actions/0, pages:PAGE-2109/actions/1, pages:PAGE-2109/fields/0, pages:PAGE-2109/fields/1, pages:PAGE-2109/fields/2, pages:PAGE-2109/fields/4, pages:PAGE-2109/fields/6, pages:PAGE-2109/fields/7, pages:PAGE-2110/fields/10, pages:PAGE-2110/fields/5, pages:PAGE-2110/fields/9, pages:PAGE-2111/fields/10, pages:PAGE-2111/fields/13, pages:PAGE-2111/fields/14, pages:PAGE-2111/fields/15, pages:PAGE-2111/fields/8, pages:PAGE-2112/fields/12, pages:PAGE-2112/fields/5, pages:PAGE-2202/fields/26, pages:PAGE-2202/fields/7, pages:PAGE-2203/fields/55, pages:PAGE-2203/fields/58, pages:PAGE-2203/fields/61, pages:PAGE-2204/fields/72, pages:PAGE-2204/fields/78, pages:PAGE-2204/fields/81, pages:PAGE-2205/fields/11, pages:PAGE-2205/fields/13, pages:PAGE-2205/fields/4, pages:PAGE-2206/fields/11, pages:PAGE-2206/fields/13, pages:PAGE-2206/fields/4, pages:PAGE-2207/fields/2, pages:PAGE-2208/fields/0, pages:PAGE-2208/fields/2, pages:PAGE-2208/fields/5, pages:PAGE-2208/fields/6, pages:PAGE-2209/fields/0, pages:PAGE-2209/fields/2, pages:PAGE-2209/fields/3, pages:PAGE-2210/fields/2, pages:PAGE-2210/fields/3, pages:PAGE-2211/fields/2, pages:PAGE-2211/fields/3, pages:PAGE-2212/fields/6, pages:PAGE-2212/fields/7, pages:PAGE-2213/fields/2, pages:PAGE-2213/fields/3, pages:PAGE-2214/fields/3, pages:PAGE-2215/fields/4, pages:PAGE-2215/fields/5, pages:PAGE-2216/fields/2, pages:PAGE-2216/fields/8, pages:PAGE-2217/fields/14, pages:PAGE-2217/fields/15, pages:PAGE-2218/fields/2, pages:PAGE-2218/fields/3, pages:PAGE-2219/fields/10, pages:PAGE-2219/fields/9, pages:PAGE-2220/fields/13, pages:PAGE-2220/fields/15, pages:PAGE-2220/fields/8, pages:PAGE-2221/fields/2, pages:PAGE-2221/fields/4, pages:PAGE-2222/fields/2, pages:PAGE-2225/fields/0, pages:PAGE-2225/fields/1, pages:PAGE-2227/fields/119, pages:PAGE-2227/fields/126, pages:PAGE-2227/fields/130, pages:PAGE-2227/fields/134, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/197, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/198, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/215, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/224, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/236, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/237, scenarios:FLOW-CURRENT-PLATFORM/steps/32

验证：CHECK-PLAT-LEAD-QUERY

## 实施任务

- [TASK-035](../tasks/TASK-035.md)
