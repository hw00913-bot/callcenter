# LOCAL-PLAT-BAN-REMOVE 移除普通组号码

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md) · [全局逻辑](../global-logic.md)

- [进入有权工作位置与保留专业能力 · FUNC\-2002](../features/FUNC-2002.md)
- [查询本租户黑名单分组及号码 · FUNC\-2020](../features/FUNC-2020.md)

## 职责与触发

所属工程模块：未填写

功能：FUNC-2002, FUNC-2020

触发：勾选普通组号码点击移除并确认

## 前置条件

- 原普通移除权；超管只读；拒联来源解除走独立管理员动作

## 必须遵守的全局规则

- [GR-IDENTITY](../global-logic.md#GR-IDENTITY)
- [GR-SCOPE](../global-logic.md#GR-SCOPE)
- [GR-AUTH](../global-logic.md#GR-AUTH)
- [GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)
- [GR-LIST-ORDER](../global-logic.md#GR-LIST-ORDER)

## 输入与输出

输入：[FIELD-PLAT-BAN-ID](../field-specs.md#FIELD-PLAT-BAN-ID)、[FIELD-PLAT-BAN-GROUP](../field-specs.md#FIELD-PLAT-BAN-GROUP)、[FIELD-PLAT-REVISION](../field-specs.md#FIELD-PLAT-REVISION)、[FIELD-PLAT-REQUEST](../field-specs.md#FIELD-PLAT-REQUEST)

输出：[FIELD-PLAT-BAN-STATE](../field-specs.md#FIELD-PLAT-BAN-STATE)、[FIELD-PLAT-BAN-REMOTE](../field-specs.md#FIELD-PLAT-BAN-REMOTE)、[FIELD-PLAT-AUDIT](../field-specs.md#FIELD-PLAT-AUDIT)

## 处理步骤

### LOCAL-PLAT-BAN-REMOVE-S1

按选中原组准确记录处理，本地解除与远端移除分别记状态

读取：FIELD-PLAT-BAN-ID, FIELD-PLAT-BAN-GROUP, FIELD-PLAT-REVISION, FIELD-PLAT-REQUEST；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

### LOCAL-PLAT-BAN-REMOVE-S2

远端未知保留原足迹和待核，不能生成反向新请求

读取：FIELD-PLAT-BAN-ID, FIELD-PLAT-BAN-GROUP, FIELD-PLAT-REVISION, FIELD-PLAT-REQUEST；写入：FIELD-PLAT-BAN-STATE, FIELD-PLAT-BAN-REMOTE, FIELD-PLAT-AUDIT

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

## 分支与异常

### LOCAL-PLAT-BAN-REMOVE-B1

条件：前提、字段及对象修订校验通过且结果明确成功

结果：普通组选中记录按准确终态移除，其余来源仍可阻止外呼

涉及字段：FIELD-PLAT-BAN-ID, FIELD-PLAT-BAN-GROUP, FIELD-PLAT-REVISION, FIELD-PLAT-REQUEST, FIELD-PLAT-BAN-STATE, FIELD-PLAT-BAN-REMOTE, FIELD-PLAT-AUDIT

验证：CHECK-PLAT-BAN-REMOVE

### LOCAL-PLAT-BAN-REMOVE-B2

条件：无权/字段不合法/对象失效/修订冲突

结果：明确显示本次拒绝原因，保留可继续的输入和已确认原值，不作变更

涉及字段：FIELD-PLAT-BAN-ID, FIELD-PLAT-BAN-GROUP, FIELD-PLAT-REVISION, FIELD-PLAT-REQUEST, FIELD-PLAT-BAN-STATE, FIELD-PLAT-BAN-REMOTE, FIELD-PLAT-AUDIT

验证：CHECK-PLAT-BAN-REMOVE

### LOCAL-PLAT-BAN-REMOVE-B3

条件：提交失败或结果未知

结果：失败保留原确认值；未知显示待核并按同请求核对，不重复提交或假报成功

涉及字段：FIELD-PLAT-BAN-ID, FIELD-PLAT-BAN-GROUP, FIELD-PLAT-REVISION, FIELD-PLAT-REQUEST, FIELD-PLAT-BAN-STATE, FIELD-PLAT-BAN-REMOTE, FIELD-PLAT-AUDIT

验证：CHECK-PLAT-BAN-REMOVE

## 完成后的状态

- 普通组选中记录按准确终态移除，其余来源仍可阻止外呼

## 字段定义

- [FIELD-PLAT-AUDIT](../field-specs.md#FIELD-PLAT-AUDIT)
- [FIELD-PLAT-BAN-GROUP](../field-specs.md#FIELD-PLAT-BAN-GROUP)
- [FIELD-PLAT-BAN-ID](../field-specs.md#FIELD-PLAT-BAN-ID)
- [FIELD-PLAT-BAN-REMOTE](../field-specs.md#FIELD-PLAT-BAN-REMOTE)
- [FIELD-PLAT-BAN-STATE](../field-specs.md#FIELD-PLAT-BAN-STATE)
- [FIELD-PLAT-REQUEST](../field-specs.md#FIELD-PLAT-REQUEST)
- [FIELD-PLAT-REVISION](../field-specs.md#FIELD-PLAT-REVISION)

## 来源与验证

来源条目：acceptance:AC-2048, acceptance:AC-2050, acceptance:AC-2062, features:FUNC-2002, features:FUNC-2002/behavior_spec/18/branches/0, features:FUNC-2002/behavior_spec/18/branches/1, features:FUNC-2002/behavior_spec/18/branches/2, features:FUNC-2002/behavior_spec/18/postconditions/0, features:FUNC-2002/behavior_spec/18/preconditions/0, features:FUNC-2002/behavior_spec/18/steps/0, features:FUNC-2002/behavior_spec/18/steps/1, features:FUNC-2020, features:FUNC-2020/behavior_spec/5/branches/0, features:FUNC-2020/behavior_spec/5/branches/1, features:FUNC-2020/behavior_spec/5/branches/2, features:FUNC-2020/behavior_spec/5/postconditions/0, features:FUNC-2020/behavior_spec/5/preconditions/0, features:FUNC-2020/behavior_spec/5/steps/0, features:FUNC-2020/behavior_spec/5/steps/1, pages:PAGE-2003/fields/2, pages:PAGE-2003/fields/22, pages:PAGE-2003/fields/24, pages:PAGE-2004/fields/0, pages:PAGE-2004/fields/4, pages:PAGE-2004/fields/5, pages:PAGE-2005/fields/0, pages:PAGE-2005/fields/8, pages:PAGE-2005/fields/9, pages:PAGE-2006/fields/56, pages:PAGE-2006/fields/58, pages:PAGE-2007, pages:PAGE-2007/actions/10, pages:PAGE-2007/fields/1, pages:PAGE-2007/fields/15, pages:PAGE-2007/fields/17, pages:PAGE-2007/fields/24, pages:PAGE-2007/fields/25, pages:PAGE-2007/fields/8, pages:PAGE-2007/fields/9, pages:PAGE-2103/fields/19, pages:PAGE-2103/fields/20, pages:PAGE-2103/fields/3, pages:PAGE-2103/fields/6, pages:PAGE-2108/fields/10, pages:PAGE-2108/fields/18, pages:PAGE-2108/fields/4, pages:PAGE-2108/fields/5, pages:PAGE-2109/fields/3, pages:PAGE-2109/fields/9, pages:PAGE-2110/fields/12, pages:PAGE-2110/fields/7, pages:PAGE-2111/fields/12, pages:PAGE-2111/fields/16, pages:PAGE-2112/fields/13, pages:PAGE-2112/fields/14, pages:PAGE-2112/fields/6, pages:PAGE-2202/fields/1, pages:PAGE-2202/fields/2, pages:PAGE-2202/fields/28, pages:PAGE-2202/fields/30, pages:PAGE-2202/fields/5, pages:PAGE-2204/fields/71, pages:PAGE-2204/fields/82, pages:PAGE-2204/fields/84, pages:PAGE-2205/fields/0, pages:PAGE-2205/fields/15, pages:PAGE-2205/fields/17, pages:PAGE-2205/fields/3, pages:PAGE-2206/fields/0, pages:PAGE-2206/fields/15, pages:PAGE-2206/fields/17, pages:PAGE-2206/fields/3, pages:PAGE-2207/fields/0, pages:PAGE-2207/fields/17, pages:PAGE-2207/fields/18, pages:PAGE-2210/fields/0, pages:PAGE-2210/fields/5, pages:PAGE-2210/fields/8, pages:PAGE-2211/fields/0, pages:PAGE-2211/fields/4, pages:PAGE-2211/fields/7, pages:PAGE-2212/fields/0, pages:PAGE-2212/fields/12, pages:PAGE-2212/fields/9, pages:PAGE-2213/fields/0, pages:PAGE-2213/fields/25, pages:PAGE-2213/fields/28, pages:PAGE-2214/fields/0, pages:PAGE-2214/fields/4, pages:PAGE-2215/fields/0, pages:PAGE-2215/fields/6, pages:PAGE-2215/fields/9, pages:PAGE-2216/fields/0, pages:PAGE-2216/fields/10, pages:PAGE-2216/fields/13, pages:PAGE-2217/fields/0, pages:PAGE-2217/fields/17, pages:PAGE-2217/fields/20, pages:PAGE-2218/fields/0, pages:PAGE-2218/fields/5, pages:PAGE-2218/fields/8, pages:PAGE-2219/fields/0, pages:PAGE-2219/fields/11, pages:PAGE-2219/fields/14, pages:PAGE-2220/fields/17, pages:PAGE-2220/fields/20, pages:PAGE-2220/fields/7, pages:PAGE-2221/fields/0, pages:PAGE-2221/fields/6, pages:PAGE-2222/fields/0, pages:PAGE-2223/fields/35, pages:PAGE-2223/fields/39, pages:PAGE-2227/fields/120, pages:PAGE-2227/fields/121, pages:PAGE-2227/fields/124, pages:PAGE-2227/fields/136, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/204, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/205, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/207, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/257, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/262, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/269, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/272, scenarios:FLOW-CURRENT-PLATFORM/steps/40

验证：CHECK-PLAT-BAN-REMOVE

## 实施任务

- [TASK-037](../tasks/TASK-037.md)
