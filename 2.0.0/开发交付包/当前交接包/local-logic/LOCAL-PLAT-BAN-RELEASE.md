# LOCAL-PLAT-BAN-RELEASE 管理员填写原因解除准确拒联来源

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md) · [全局逻辑](../global-logic.md)

- [管理员填原因解除准确拒联来源 · FUNC\-2025](../features/FUNC-2025.md)

## 职责与触发

所属工程模块：未填写

功能：FUNC-2025

触发：本租户管理员在来源详情确认解除本条

## 前置条件

- 本租户管理员且有解除权；超管只读与运营均不允许
- 原话后或原请求无待完成冲突

## 必须遵守的全局规则

- [GR-IDENTITY](../global-logic.md#GR-IDENTITY)
- [GR-SCOPE](../global-logic.md#GR-SCOPE)
- [GR-AUTH](../global-logic.md#GR-AUTH)
- [GR-SERIAL](../global-logic.md#GR-SERIAL)
- [GR-CONTACT](../global-logic.md#GR-CONTACT)
- [GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)

## 输入与输出

输入：[FIELD-PLAT-BAN-ID](../field-specs.md#FIELD-PLAT-BAN-ID)、[FIELD-PLAT-BAN-SOURCE](../field-specs.md#FIELD-PLAT-BAN-SOURCE)、[FIELD-PLAT-BAN-STATE](../field-specs.md#FIELD-PLAT-BAN-STATE)、[FIELD-PLAT-BAN-RELEASE](../field-specs.md#FIELD-PLAT-BAN-RELEASE)、[FIELD-PLAT-REVISION](../field-specs.md#FIELD-PLAT-REVISION)、[FIELD-PLAT-REQUEST](../field-specs.md#FIELD-PLAT-REQUEST)

输出：[FIELD-PLAT-BAN-RELEASE](../field-specs.md#FIELD-PLAT-BAN-RELEASE)、[FIELD-PLAT-BAN-STATE](../field-specs.md#FIELD-PLAT-BAN-STATE)、[FIELD-PLAT-BAN-REMOTE](../field-specs.md#FIELD-PLAT-BAN-REMOTE)、[FIELD-PLAT-AUDIT](../field-specs.md#FIELD-PLAT-AUDIT)

## 处理步骤

### LOCAL-PLAT-BAN-RELEASE-S1

必填明确解除原因，锁定准确来源而不是整个号码

读取：FIELD-PLAT-BAN-ID, FIELD-PLAT-BAN-SOURCE, FIELD-PLAT-BAN-STATE, FIELD-PLAT-BAN-RELEASE, FIELD-PLAT-REVISION, FIELD-PLAT-REQUEST；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-SERIAL, GR-CONTACT, GR-UNKNOWN

### LOCAL-PLAT-BAN-RELEASE-S2

保留原来源及解除历史，其他仍有效来源不变

读取：FIELD-PLAT-BAN-ID, FIELD-PLAT-BAN-SOURCE, FIELD-PLAT-BAN-STATE, FIELD-PLAT-BAN-RELEASE, FIELD-PLAT-REVISION, FIELD-PLAT-REQUEST；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-SERIAL, GR-CONTACT, GR-UNKNOWN

### LOCAL-PLAT-BAN-RELEASE-S3

远端解除保留原目标方向与请求，未知先核对；旧事件不复活本条

读取：FIELD-PLAT-BAN-ID, FIELD-PLAT-BAN-SOURCE, FIELD-PLAT-BAN-STATE, FIELD-PLAT-BAN-RELEASE, FIELD-PLAT-REVISION, FIELD-PLAT-REQUEST；写入：FIELD-PLAT-BAN-RELEASE, FIELD-PLAT-BAN-STATE, FIELD-PLAT-BAN-REMOTE, FIELD-PLAT-AUDIT

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-SERIAL, GR-CONTACT, GR-UNKNOWN

## 分支与异常

### LOCAL-PLAT-BAN-RELEASE-B1

条件：前提、字段及对象修订校验通过且结果明确成功

结果：仅本来源解除并留原因/操作人/时间，号码是否可呼须重新聚合其他有效来源

涉及字段：FIELD-PLAT-BAN-ID, FIELD-PLAT-BAN-SOURCE, FIELD-PLAT-BAN-STATE, FIELD-PLAT-BAN-RELEASE, FIELD-PLAT-REVISION, FIELD-PLAT-REQUEST, FIELD-PLAT-BAN-REMOTE, FIELD-PLAT-AUDIT

验证：CHECK-PLAT-BAN-RELEASE

### LOCAL-PLAT-BAN-RELEASE-B2

条件：无权/字段不合法/对象失效/修订冲突

结果：明确显示本次拒绝原因，保留可继续的输入和已确认原值，不作变更

涉及字段：FIELD-PLAT-BAN-ID, FIELD-PLAT-BAN-SOURCE, FIELD-PLAT-BAN-STATE, FIELD-PLAT-BAN-RELEASE, FIELD-PLAT-REVISION, FIELD-PLAT-REQUEST, FIELD-PLAT-BAN-REMOTE, FIELD-PLAT-AUDIT

验证：CHECK-PLAT-BAN-RELEASE

### LOCAL-PLAT-BAN-RELEASE-B3

条件：提交失败或结果未知

结果：失败保留原确认值；未知显示待核并按同请求核对，不重复提交或假报成功

涉及字段：FIELD-PLAT-BAN-ID, FIELD-PLAT-BAN-SOURCE, FIELD-PLAT-BAN-STATE, FIELD-PLAT-BAN-RELEASE, FIELD-PLAT-REVISION, FIELD-PLAT-REQUEST, FIELD-PLAT-BAN-REMOTE, FIELD-PLAT-AUDIT

验证：CHECK-PLAT-BAN-RELEASE

## 完成后的状态

- 仅本来源解除并留原因/操作人/时间，号码是否可呼须重新聚合其他有效来源

## 字段定义

- [FIELD-PLAT-AUDIT](../field-specs.md#FIELD-PLAT-AUDIT)
- [FIELD-PLAT-BAN-ID](../field-specs.md#FIELD-PLAT-BAN-ID)
- [FIELD-PLAT-BAN-RELEASE](../field-specs.md#FIELD-PLAT-BAN-RELEASE)
- [FIELD-PLAT-BAN-REMOTE](../field-specs.md#FIELD-PLAT-BAN-REMOTE)
- [FIELD-PLAT-BAN-SOURCE](../field-specs.md#FIELD-PLAT-BAN-SOURCE)
- [FIELD-PLAT-BAN-STATE](../field-specs.md#FIELD-PLAT-BAN-STATE)
- [FIELD-PLAT-REQUEST](../field-specs.md#FIELD-PLAT-REQUEST)
- [FIELD-PLAT-REVISION](../field-specs.md#FIELD-PLAT-REVISION)

## 来源与验证

来源条目：acceptance:AC-2060, acceptance:AC-2061, acceptance:AC-2062, features:FUNC-2025, features:FUNC-2025/behavior_spec/0/branches/0, features:FUNC-2025/behavior_spec/0/branches/1, features:FUNC-2025/behavior_spec/0/branches/2, features:FUNC-2025/behavior_spec/0/postconditions/0, features:FUNC-2025/behavior_spec/0/preconditions/0, features:FUNC-2025/behavior_spec/0/preconditions/1, features:FUNC-2025/behavior_spec/0/steps/0, features:FUNC-2025/behavior_spec/0/steps/1, features:FUNC-2025/behavior_spec/0/steps/2, pages:PAGE-2003/fields/2, pages:PAGE-2003/fields/22, pages:PAGE-2003/fields/24, pages:PAGE-2004/fields/0, pages:PAGE-2004/fields/4, pages:PAGE-2004/fields/5, pages:PAGE-2005/fields/0, pages:PAGE-2005/fields/8, pages:PAGE-2005/fields/9, pages:PAGE-2006/fields/56, pages:PAGE-2006/fields/58, pages:PAGE-2007, pages:PAGE-2007/actions/2, pages:PAGE-2007/fields/1, pages:PAGE-2007/fields/14, pages:PAGE-2007/fields/15, pages:PAGE-2007/fields/16, pages:PAGE-2007/fields/17, pages:PAGE-2007/fields/24, pages:PAGE-2007/fields/25, pages:PAGE-2007/fields/9, pages:PAGE-2103/fields/19, pages:PAGE-2103/fields/20, pages:PAGE-2103/fields/3, pages:PAGE-2103/fields/5, pages:PAGE-2103/fields/6, pages:PAGE-2108/fields/10, pages:PAGE-2108/fields/18, pages:PAGE-2108/fields/4, pages:PAGE-2108/fields/5, pages:PAGE-2108/fields/9, pages:PAGE-2109/fields/3, pages:PAGE-2109/fields/9, pages:PAGE-2110/fields/12, pages:PAGE-2110/fields/7, pages:PAGE-2111/fields/12, pages:PAGE-2111/fields/16, pages:PAGE-2112/fields/13, pages:PAGE-2112/fields/14, pages:PAGE-2112/fields/6, pages:PAGE-2202/fields/1, pages:PAGE-2202/fields/2, pages:PAGE-2202/fields/28, pages:PAGE-2202/fields/30, pages:PAGE-2202/fields/4, pages:PAGE-2202/fields/5, pages:PAGE-2204/fields/71, pages:PAGE-2204/fields/82, pages:PAGE-2204/fields/84, pages:PAGE-2205/fields/0, pages:PAGE-2205/fields/15, pages:PAGE-2205/fields/17, pages:PAGE-2205/fields/2, pages:PAGE-2205/fields/3, pages:PAGE-2206/fields/0, pages:PAGE-2206/fields/15, pages:PAGE-2206/fields/17, pages:PAGE-2206/fields/2, pages:PAGE-2206/fields/3, pages:PAGE-2207/fields/0, pages:PAGE-2207/fields/17, pages:PAGE-2207/fields/18, pages:PAGE-2210/fields/0, pages:PAGE-2210/fields/5, pages:PAGE-2210/fields/8, pages:PAGE-2211/fields/0, pages:PAGE-2211/fields/4, pages:PAGE-2211/fields/7, pages:PAGE-2212/fields/0, pages:PAGE-2212/fields/12, pages:PAGE-2212/fields/9, pages:PAGE-2213/fields/0, pages:PAGE-2213/fields/25, pages:PAGE-2213/fields/28, pages:PAGE-2214/fields/0, pages:PAGE-2214/fields/4, pages:PAGE-2215/fields/0, pages:PAGE-2215/fields/6, pages:PAGE-2215/fields/9, pages:PAGE-2216/fields/0, pages:PAGE-2216/fields/10, pages:PAGE-2216/fields/13, pages:PAGE-2217/fields/0, pages:PAGE-2217/fields/17, pages:PAGE-2217/fields/20, pages:PAGE-2218/fields/0, pages:PAGE-2218/fields/5, pages:PAGE-2218/fields/8, pages:PAGE-2219/fields/0, pages:PAGE-2219/fields/11, pages:PAGE-2219/fields/14, pages:PAGE-2220/fields/17, pages:PAGE-2220/fields/20, pages:PAGE-2220/fields/7, pages:PAGE-2221/fields/0, pages:PAGE-2221/fields/6, pages:PAGE-2222/fields/0, pages:PAGE-2223/fields/35, pages:PAGE-2223/fields/39, pages:PAGE-2227/fields/120, pages:PAGE-2227/fields/121, pages:PAGE-2227/fields/123, pages:PAGE-2227/fields/124, pages:PAGE-2227/fields/136, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/185, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/186, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/188, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/243, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/247, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/250, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/251, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/253, scenarios:FLOW-CURRENT-PLATFORM/steps/45

验证：CHECK-PLAT-BAN-RELEASE

## 实施任务

- [TASK-039](../tasks/TASK-039.md)
