# LOCAL-PLAT-ACCOUNT-STOP 全局停用登录账号

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md) · [全局逻辑](../global-logic.md)

- [全局停用登录账号 · FUNC\-2014](../features/FUNC-2014.md)

## 职责与触发

所属工程模块：未填写

功能：FUNC-2014

触发：超管确认停用准确全局账号

## 前置条件

- 独立全局账号停用权，租户管理员不可代办

## 必须遵守的全局规则

- [GR-IDENTITY](../global-logic.md#GR-IDENTITY)
- [GR-SCOPE](../global-logic.md#GR-SCOPE)
- [GR-AUTH](../global-logic.md#GR-AUTH)
- [GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)
- [GR-LIST-ORDER](../global-logic.md#GR-LIST-ORDER)

## 输入与输出

输入：[FIELD-PLAT-ACCOUNT-ID](../field-specs.md#FIELD-PLAT-ACCOUNT-ID)、[FIELD-PLAT-ACCOUNT-STATE](../field-specs.md#FIELD-PLAT-ACCOUNT-STATE)、[FIELD-PLAT-GUARD-STATE](../field-specs.md#FIELD-PLAT-GUARD-STATE)、[FIELD-PLAT-REQUEST](../field-specs.md#FIELD-PLAT-REQUEST)

输出：[FIELD-PLAT-ACCOUNT-STATE](../field-specs.md#FIELD-PLAT-ACCOUNT-STATE)、[FIELD-PLAT-LIMITED](../field-specs.md#FIELD-PLAT-LIMITED)、[FIELD-PLAT-AUDIT](../field-specs.md#FIELD-PLAT-AUDIT)

## 处理步骤

### LOCAL-PLAT-ACCOUNT-STOP-S1

对所有租户和工作区禁新增操作；不取消既有已受理后台任务

读取：FIELD-PLAT-ACCOUNT-ID, FIELD-PLAT-ACCOUNT-STATE, FIELD-PLAT-GUARD-STATE, FIELD-PLAT-REQUEST；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

### LOCAL-PLAT-ACCOUNT-STOP-S2

只保停用时已接通电话及必要话后有限收尾

读取：FIELD-PLAT-ACCOUNT-ID, FIELD-PLAT-ACCOUNT-STATE, FIELD-PLAT-GUARD-STATE, FIELD-PLAT-REQUEST；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

### LOCAL-PLAT-ACCOUNT-STOP-S3

不删除已有记录，不自动重新启用或转交

读取：FIELD-PLAT-ACCOUNT-ID, FIELD-PLAT-ACCOUNT-STATE, FIELD-PLAT-GUARD-STATE, FIELD-PLAT-REQUEST；写入：FIELD-PLAT-ACCOUNT-STATE, FIELD-PLAT-LIMITED, FIELD-PLAT-AUDIT

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

## 分支与异常

### LOCAL-PLAT-ACCOUNT-STOP-B1

条件：前提、字段及对象修订校验通过且结果明确成功

结果：全局账号停用且范围收敛，不因前端隐藏宣称真实会话撤销已验证

涉及字段：FIELD-PLAT-ACCOUNT-ID, FIELD-PLAT-ACCOUNT-STATE, FIELD-PLAT-GUARD-STATE, FIELD-PLAT-REQUEST, FIELD-PLAT-LIMITED, FIELD-PLAT-AUDIT

验证：CHECK-PLAT-ACCOUNT-STOP

### LOCAL-PLAT-ACCOUNT-STOP-B2

条件：无权/字段不合法/对象失效/修订冲突

结果：明确显示本次拒绝原因，保留可继续的输入和已确认原值，不作变更

涉及字段：FIELD-PLAT-ACCOUNT-ID, FIELD-PLAT-ACCOUNT-STATE, FIELD-PLAT-GUARD-STATE, FIELD-PLAT-REQUEST, FIELD-PLAT-LIMITED, FIELD-PLAT-AUDIT

验证：CHECK-PLAT-ACCOUNT-STOP

### LOCAL-PLAT-ACCOUNT-STOP-B3

条件：提交失败或结果未知

结果：失败保留原确认值；未知显示待核并按同请求核对，不重复提交或假报成功

涉及字段：FIELD-PLAT-ACCOUNT-ID, FIELD-PLAT-ACCOUNT-STATE, FIELD-PLAT-GUARD-STATE, FIELD-PLAT-REQUEST, FIELD-PLAT-LIMITED, FIELD-PLAT-AUDIT

验证：CHECK-PLAT-ACCOUNT-STOP

## 完成后的状态

- 全局账号停用且范围收敛，不因前端隐藏宣称真实会话撤销已验证

## 字段定义

- [FIELD-PLAT-ACCOUNT-ID](../field-specs.md#FIELD-PLAT-ACCOUNT-ID)
- [FIELD-PLAT-ACCOUNT-STATE](../field-specs.md#FIELD-PLAT-ACCOUNT-STATE)
- [FIELD-PLAT-AUDIT](../field-specs.md#FIELD-PLAT-AUDIT)
- [FIELD-PLAT-GUARD-STATE](../field-specs.md#FIELD-PLAT-GUARD-STATE)
- [FIELD-PLAT-LIMITED](../field-specs.md#FIELD-PLAT-LIMITED)
- [FIELD-PLAT-REQUEST](../field-specs.md#FIELD-PLAT-REQUEST)

## 来源与验证

来源条目：acceptance:AC-2030, acceptance:AC-2031, acceptance:AC-2032, features:FUNC-2014, features:FUNC-2014/behavior_spec/0/branches/0, features:FUNC-2014/behavior_spec/0/branches/1, features:FUNC-2014/behavior_spec/0/branches/2, features:FUNC-2014/behavior_spec/0/postconditions/0, features:FUNC-2014/behavior_spec/0/preconditions/0, features:FUNC-2014/behavior_spec/0/steps/0, features:FUNC-2014/behavior_spec/0/steps/1, features:FUNC-2014/behavior_spec/0/steps/2, pages:PAGE-2001/fields/1, pages:PAGE-2002/fields/1, pages:PAGE-2003, pages:PAGE-2003/actions/3, pages:PAGE-2003/fields/0, pages:PAGE-2003/fields/1, pages:PAGE-2003/fields/2, pages:PAGE-2003/fields/22, pages:PAGE-2003/fields/5, pages:PAGE-2003/fields/6, pages:PAGE-2004/fields/0, pages:PAGE-2004/fields/4, pages:PAGE-2005/fields/0, pages:PAGE-2005/fields/8, pages:PAGE-2006/fields/56, pages:PAGE-2007/fields/1, pages:PAGE-2007/fields/24, pages:PAGE-2103/fields/19, pages:PAGE-2103/fields/3, pages:PAGE-2108/fields/18, pages:PAGE-2108/fields/4, pages:PAGE-2109/fields/3, pages:PAGE-2110/fields/7, pages:PAGE-2111/fields/12, pages:PAGE-2112/fields/13, pages:PAGE-2112/fields/6, pages:PAGE-2202/fields/1, pages:PAGE-2202/fields/17, pages:PAGE-2202/fields/28, pages:PAGE-2204/fields/71, pages:PAGE-2204/fields/82, pages:PAGE-2205/fields/0, pages:PAGE-2205/fields/15, pages:PAGE-2206/fields/0, pages:PAGE-2206/fields/15, pages:PAGE-2207/fields/0, pages:PAGE-2207/fields/17, pages:PAGE-2210/fields/0, pages:PAGE-2210/fields/5, pages:PAGE-2211/fields/0, pages:PAGE-2211/fields/4, pages:PAGE-2212/fields/0, pages:PAGE-2212/fields/9, pages:PAGE-2213/fields/0, pages:PAGE-2213/fields/25, pages:PAGE-2214/fields/0, pages:PAGE-2214/fields/4, pages:PAGE-2215/fields/0, pages:PAGE-2215/fields/6, pages:PAGE-2216/fields/0, pages:PAGE-2216/fields/10, pages:PAGE-2217/fields/0, pages:PAGE-2217/fields/17, pages:PAGE-2218/fields/0, pages:PAGE-2218/fields/5, pages:PAGE-2219/fields/0, pages:PAGE-2219/fields/11, pages:PAGE-2220/fields/17, pages:PAGE-2220/fields/7, pages:PAGE-2221/fields/0, pages:PAGE-2221/fields/6, pages:PAGE-2222/fields/0, pages:PAGE-2223/fields/35, pages:PAGE-2227/fields/120, pages:PAGE-2227/fields/136, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/179, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/185, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/189, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/205, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/207, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/215, scenarios:FLOW-CURRENT-PLATFORM/steps/15

验证：CHECK-PLAT-ACCOUNT-STOP

## 实施任务

- [TASK-006](../tasks/TASK-006.md)
