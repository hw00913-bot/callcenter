# LOCAL-PLAT-CUSTOMER-ASSIGN 原客户任务分配跟进人

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md) · [全局逻辑](../global-logic.md)

- [进入有权工作位置与保留专业能力 · FUNC\-2002](../features/FUNC-2002.md)

## 职责与触发

所属工程模块：未填写

功能：FUNC-2002

触发：有原分配权者选择合法任务及人员确认分配

## 前置条件

- 当前任务可分配且本企业人员有资格

## 必须遵守的全局规则

- [GR-IDENTITY](../global-logic.md#GR-IDENTITY)
- [GR-SCOPE](../global-logic.md#GR-SCOPE)
- [GR-AUTH](../global-logic.md#GR-AUTH)
- [GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)
- [GR-LIST-ORDER](../global-logic.md#GR-LIST-ORDER)

## 输入与输出

输入：[FIELD-PLAT-CUSTOMER-ID](../field-specs.md#FIELD-PLAT-CUSTOMER-ID)、[FIELD-PLAT-FOLLOWER](../field-specs.md#FIELD-PLAT-FOLLOWER)、[FIELD-PLAT-REVISION](../field-specs.md#FIELD-PLAT-REVISION)

输出：[FIELD-PLAT-FOLLOWER](../field-specs.md#FIELD-PLAT-FOLLOWER)、[FIELD-PLAT-AUDIT](../field-specs.md#FIELD-PLAT-AUDIT)

## 处理步骤

### LOCAL-PLAT-CUSTOMER-ASSIGN-S1

只改当前准确任务负责人，外呼方式由导入/当前任务定义确定

读取：FIELD-PLAT-CUSTOMER-ID, FIELD-PLAT-FOLLOWER, FIELD-PLAT-REVISION；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

### LOCAL-PLAT-CUSTOMER-ASSIGN-S2

失效成员、需要但无有效坐席或已在处理冲突时拒绝

读取：FIELD-PLAT-CUSTOMER-ID, FIELD-PLAT-FOLLOWER, FIELD-PLAT-REVISION；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

### LOCAL-PLAT-CUSTOMER-ASSIGN-S3

确已缺失原任务且无通话/未处理中只允许原有权管理员手工恢复待分配

读取：FIELD-PLAT-CUSTOMER-ID, FIELD-PLAT-FOLLOWER, FIELD-PLAT-REVISION；写入：FIELD-PLAT-FOLLOWER, FIELD-PLAT-AUDIT

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

## 分支与异常

### LOCAL-PLAT-CUSTOMER-ASSIGN-B1

条件：前提、字段及对象修订校验通过且结果明确成功

结果：准确负责人分配成功，实际接听人填写责任不变；不自动回收或转移业务归属

涉及字段：FIELD-PLAT-CUSTOMER-ID, FIELD-PLAT-FOLLOWER, FIELD-PLAT-REVISION, FIELD-PLAT-AUDIT

验证：CHECK-PLAT-CUSTOMER-ASSIGN

### LOCAL-PLAT-CUSTOMER-ASSIGN-B2

条件：无权/字段不合法/对象失效/修订冲突

结果：明确显示本次拒绝原因，保留可继续的输入和已确认原值，不作变更

涉及字段：FIELD-PLAT-CUSTOMER-ID, FIELD-PLAT-FOLLOWER, FIELD-PLAT-REVISION, FIELD-PLAT-AUDIT

验证：CHECK-PLAT-CUSTOMER-ASSIGN

### LOCAL-PLAT-CUSTOMER-ASSIGN-B3

条件：提交失败或结果未知

结果：失败保留原确认值；未知显示待核并按同请求核对，不重复提交或假报成功

涉及字段：FIELD-PLAT-CUSTOMER-ID, FIELD-PLAT-FOLLOWER, FIELD-PLAT-REVISION, FIELD-PLAT-AUDIT

验证：CHECK-PLAT-CUSTOMER-ASSIGN

## 完成后的状态

- 准确负责人分配成功，实际接听人填写责任不变；不自动回收或转移业务归属

## 字段定义

- [FIELD-PLAT-AUDIT](../field-specs.md#FIELD-PLAT-AUDIT)
- [FIELD-PLAT-CUSTOMER-ID](../field-specs.md#FIELD-PLAT-CUSTOMER-ID)
- [FIELD-PLAT-FOLLOWER](../field-specs.md#FIELD-PLAT-FOLLOWER)
- [FIELD-PLAT-REVISION](../field-specs.md#FIELD-PLAT-REVISION)

## 来源与验证

来源条目：acceptance:AC-2067, acceptance:AC-2072, features:FUNC-2002, features:FUNC-2002/behavior_spec/33/branches/0, features:FUNC-2002/behavior_spec/33/branches/1, features:FUNC-2002/behavior_spec/33/branches/2, features:FUNC-2002/behavior_spec/33/postconditions/0, features:FUNC-2002/behavior_spec/33/preconditions/0, features:FUNC-2002/behavior_spec/33/steps/0, features:FUNC-2002/behavior_spec/33/steps/1, features:FUNC-2002/behavior_spec/33/steps/2, pages:PAGE-2003/fields/2, pages:PAGE-2003/fields/24, pages:PAGE-2004/fields/0, pages:PAGE-2004/fields/5, pages:PAGE-2005/fields/0, pages:PAGE-2005/fields/9, pages:PAGE-2006/fields/56, pages:PAGE-2006/fields/58, pages:PAGE-2007/fields/1, pages:PAGE-2007/fields/25, pages:PAGE-2103/fields/20, pages:PAGE-2103/fields/3, pages:PAGE-2103/fields/9, pages:PAGE-2108/fields/4, pages:PAGE-2109/fields/3, pages:PAGE-2109/fields/9, pages:PAGE-2110/fields/12, pages:PAGE-2110/fields/7, pages:PAGE-2111/fields/12, pages:PAGE-2111/fields/16, pages:PAGE-2112/fields/14, pages:PAGE-2112/fields/6, pages:PAGE-2202/fields/1, pages:PAGE-2202/fields/11, pages:PAGE-2202/fields/14, pages:PAGE-2202/fields/30, pages:PAGE-2203/fields/56, pages:PAGE-2204, pages:PAGE-2204/actions/2, pages:PAGE-2204/fields/71, pages:PAGE-2204/fields/73, pages:PAGE-2204/fields/74, pages:PAGE-2204/fields/84, pages:PAGE-2205/fields/0, pages:PAGE-2205/fields/17, pages:PAGE-2206/fields/0, pages:PAGE-2206/fields/17, pages:PAGE-2207/fields/0, pages:PAGE-2207/fields/18, pages:PAGE-2209/fields/1, pages:PAGE-2210/fields/0, pages:PAGE-2210/fields/8, pages:PAGE-2211/fields/0, pages:PAGE-2211/fields/7, pages:PAGE-2212/fields/0, pages:PAGE-2212/fields/12, pages:PAGE-2213/fields/0, pages:PAGE-2213/fields/28, pages:PAGE-2214/fields/0, pages:PAGE-2215/fields/0, pages:PAGE-2215/fields/9, pages:PAGE-2216/fields/0, pages:PAGE-2216/fields/13, pages:PAGE-2217/fields/0, pages:PAGE-2217/fields/20, pages:PAGE-2218/fields/0, pages:PAGE-2218/fields/8, pages:PAGE-2219/fields/0, pages:PAGE-2219/fields/14, pages:PAGE-2220/fields/10, pages:PAGE-2220/fields/20, pages:PAGE-2220/fields/7, pages:PAGE-2220/fields/9, pages:PAGE-2221/fields/0, pages:PAGE-2222/fields/0, pages:PAGE-2223/fields/35, pages:PAGE-2223/fields/39, pages:PAGE-2227/fields/120, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/204, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/207, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/227, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/230, scenarios:FLOW-CURRENT-PLATFORM/steps/60

验证：CHECK-PLAT-CUSTOMER-ASSIGN

## 实施任务

- [TASK-043](../tasks/TASK-043.md)
