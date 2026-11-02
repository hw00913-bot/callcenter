# LOCAL-PLAT-BAN-DETAIL 查看限制来源和同步详情

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md) · [全局逻辑](../global-logic.md)

- [查看黑名单来源及远端同步详情 · FUNC\-2021](../features/FUNC-2021.md)

## 职责与触发

所属工程模块：未填写

功能：FUNC-2021

触发：点击准确号码记录详情

## 前置条件

- 准确当前租户记录读权；超管可只读

## 必须遵守的全局规则

- [GR-IDENTITY](../global-logic.md#GR-IDENTITY)
- [GR-SCOPE](../global-logic.md#GR-SCOPE)
- [GR-AUTH](../global-logic.md#GR-AUTH)
- [GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)
- [GR-LIST-ORDER](../global-logic.md#GR-LIST-ORDER)

## 输入与输出

输入：[FIELD-PLAT-BAN-ID](../field-specs.md#FIELD-PLAT-BAN-ID)、[FIELD-PLAT-BAN-GROUP](../field-specs.md#FIELD-PLAT-BAN-GROUP)

输出：[FIELD-PLAT-BAN-SOURCE](../field-specs.md#FIELD-PLAT-BAN-SOURCE)、[FIELD-PLAT-BAN-LIFETIME](../field-specs.md#FIELD-PLAT-BAN-LIFETIME)、[FIELD-PLAT-BAN-STATE](../field-specs.md#FIELD-PLAT-BAN-STATE)、[FIELD-PLAT-BAN-RELEASE](../field-specs.md#FIELD-PLAT-BAN-RELEASE)、[FIELD-PLAT-BAN-REMOTE](../field-specs.md#FIELD-PLAT-BAN-REMOTE)

## 处理步骤

### LOCAL-PLAT-BAN-DETAIL-S1

展示来源通话/确认人/时间/原因、有效期限、解除及远端足迹

读取：FIELD-PLAT-BAN-ID, FIELD-PLAT-BAN-GROUP；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

### LOCAL-PLAT-BAN-DETAIL-S2

正常普通组与受保护拒联来源明确区分；只读者无修改/同步入口

读取：FIELD-PLAT-BAN-ID, FIELD-PLAT-BAN-GROUP；写入：FIELD-PLAT-BAN-SOURCE, FIELD-PLAT-BAN-LIFETIME, FIELD-PLAT-BAN-STATE, FIELD-PLAT-BAN-RELEASE, FIELD-PLAT-BAN-REMOTE

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

## 分支与异常

### LOCAL-PLAT-BAN-DETAIL-B1

条件：前提、字段及对象修订校验通过且结果明确成功

结果：准确来源及本地/远端状态可追溯，读权不授解除或同步权

涉及字段：FIELD-PLAT-BAN-ID, FIELD-PLAT-BAN-GROUP, FIELD-PLAT-BAN-SOURCE, FIELD-PLAT-BAN-LIFETIME, FIELD-PLAT-BAN-STATE, FIELD-PLAT-BAN-RELEASE, FIELD-PLAT-BAN-REMOTE

验证：CHECK-PLAT-BAN-DETAIL

### LOCAL-PLAT-BAN-DETAIL-B2

条件：无权/字段不合法/对象失效/修订冲突

结果：明确显示本次拒绝原因，保留可继续的输入和已确认原值，不作变更

涉及字段：FIELD-PLAT-BAN-ID, FIELD-PLAT-BAN-GROUP, FIELD-PLAT-BAN-SOURCE, FIELD-PLAT-BAN-LIFETIME, FIELD-PLAT-BAN-STATE, FIELD-PLAT-BAN-RELEASE, FIELD-PLAT-BAN-REMOTE

验证：CHECK-PLAT-BAN-DETAIL

### LOCAL-PLAT-BAN-DETAIL-B3

条件：提交失败或结果未知

结果：失败保留原确认值；未知显示待核并按同请求核对，不重复提交或假报成功

涉及字段：FIELD-PLAT-BAN-ID, FIELD-PLAT-BAN-GROUP, FIELD-PLAT-BAN-SOURCE, FIELD-PLAT-BAN-LIFETIME, FIELD-PLAT-BAN-STATE, FIELD-PLAT-BAN-RELEASE, FIELD-PLAT-BAN-REMOTE

验证：CHECK-PLAT-BAN-DETAIL

## 完成后的状态

- 准确来源及本地/远端状态可追溯，读权不授解除或同步权

## 字段定义

- [FIELD-PLAT-BAN-GROUP](../field-specs.md#FIELD-PLAT-BAN-GROUP)
- [FIELD-PLAT-BAN-ID](../field-specs.md#FIELD-PLAT-BAN-ID)
- [FIELD-PLAT-BAN-LIFETIME](../field-specs.md#FIELD-PLAT-BAN-LIFETIME)
- [FIELD-PLAT-BAN-RELEASE](../field-specs.md#FIELD-PLAT-BAN-RELEASE)
- [FIELD-PLAT-BAN-REMOTE](../field-specs.md#FIELD-PLAT-BAN-REMOTE)
- [FIELD-PLAT-BAN-SOURCE](../field-specs.md#FIELD-PLAT-BAN-SOURCE)
- [FIELD-PLAT-BAN-STATE](../field-specs.md#FIELD-PLAT-BAN-STATE)

## 来源与验证

来源条目：acceptance:AC-2048, acceptance:AC-2049, acceptance:AC-2050, acceptance:AC-2061, acceptance:AC-2062, features:FUNC-2021, features:FUNC-2021/behavior_spec/0/branches/0, features:FUNC-2021/behavior_spec/0/branches/1, features:FUNC-2021/behavior_spec/0/branches/2, features:FUNC-2021/behavior_spec/0/postconditions/0, features:FUNC-2021/behavior_spec/0/preconditions/0, features:FUNC-2021/behavior_spec/0/steps/0, features:FUNC-2021/behavior_spec/0/steps/1, pages:PAGE-2007, pages:PAGE-2007/actions/0, pages:PAGE-2007/actions/3, pages:PAGE-2007/fields/10, pages:PAGE-2007/fields/14, pages:PAGE-2007/fields/15, pages:PAGE-2007/fields/16, pages:PAGE-2007/fields/17, pages:PAGE-2007/fields/8, pages:PAGE-2007/fields/9, pages:PAGE-2103/fields/4, pages:PAGE-2103/fields/5, pages:PAGE-2103/fields/6, pages:PAGE-2108/fields/10, pages:PAGE-2108/fields/5, pages:PAGE-2108/fields/6, pages:PAGE-2108/fields/9, pages:PAGE-2202/fields/2, pages:PAGE-2202/fields/3, pages:PAGE-2202/fields/4, pages:PAGE-2202/fields/5, pages:PAGE-2205/fields/1, pages:PAGE-2205/fields/2, pages:PAGE-2205/fields/3, pages:PAGE-2206/fields/1, pages:PAGE-2206/fields/2, pages:PAGE-2206/fields/3, pages:PAGE-2227/fields/121, pages:PAGE-2227/fields/122, pages:PAGE-2227/fields/123, pages:PAGE-2227/fields/124, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/252, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/257, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/261, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/263, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/264, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/265, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/267, scenarios:FLOW-CURRENT-PLATFORM/steps/35

验证：CHECK-PLAT-BAN-DETAIL

## 实施任务

- [TASK-038](../tasks/TASK-038.md)
