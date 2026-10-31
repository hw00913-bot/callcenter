# LOCAL-PLAT-BAN-NUMBERS 新增或批量导入普通黑名单号码

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md) · [全局逻辑](../global-logic.md)

- [进入有权工作位置与保留专业能力 · FUNC\-2002](../features/FUNC-2002.md)
- [查询本租户黑名单分组及号码 · FUNC\-2020](../features/FUNC-2020.md)

## 职责与触发

所属工程模块：未填写

功能：FUNC-2002, FUNC-2020

触发：手工新增或文件导入到明确普通组

## 前置条件

- 原新增/导入权；超管只读；目标组有效

## 必须遵守的全局规则

- [GR-IDENTITY](../global-logic.md#GR-IDENTITY)
- [GR-SCOPE](../global-logic.md#GR-SCOPE)
- [GR-AUTH](../global-logic.md#GR-AUTH)
- [GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)
- [GR-LIST-ORDER](../global-logic.md#GR-LIST-ORDER)

## 输入与输出

输入：[FIELD-PLAT-BAN-GROUP](../field-specs.md#FIELD-PLAT-BAN-GROUP)、[FIELD-PLAT-BAN-PHONE](../field-specs.md#FIELD-PLAT-BAN-PHONE)、[FIELD-PLAT-BAN-CUSTOMER](../field-specs.md#FIELD-PLAT-BAN-CUSTOMER)、[FIELD-PLAT-BAN-ADD-TYPE](../field-specs.md#FIELD-PLAT-BAN-ADD-TYPE)、[FIELD-PLAT-BAN-REASON](../field-specs.md#FIELD-PLAT-BAN-REASON)、[FIELD-PLAT-IMPORT-ROWS](../field-specs.md#FIELD-PLAT-IMPORT-ROWS)、[FIELD-PLAT-BAN-EXPIRY](../field-specs.md#FIELD-PLAT-BAN-EXPIRY)、[FIELD-PLAT-REQUEST](../field-specs.md#FIELD-PLAT-REQUEST)

输出：[FIELD-PLAT-BAN-ID](../field-specs.md#FIELD-PLAT-BAN-ID)、[FIELD-PLAT-BAN-LIFETIME](../field-specs.md#FIELD-PLAT-BAN-LIFETIME)、[FIELD-PLAT-BAN-STATE](../field-specs.md#FIELD-PLAT-BAN-STATE)、[FIELD-PLAT-BAN-REMOTE](../field-specs.md#FIELD-PLAT-BAN-REMOTE)、[FIELD-PLAT-AUDIT](../field-specs.md#FIELD-PLAT-AUDIT)

## 处理步骤

### LOCAL-PLAT-BAN-NUMBERS-S1

单条或逐行校验真实规范号码、添加类型、重复、目标组和期限

读取：FIELD-PLAT-BAN-GROUP, FIELD-PLAT-BAN-PHONE, FIELD-PLAT-BAN-CUSTOMER, FIELD-PLAT-BAN-ADD-TYPE, FIELD-PLAT-BAN-REASON, FIELD-PLAT-IMPORT-ROWS, FIELD-PLAT-BAN-EXPIRY, FIELD-PLAT-REQUEST；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

### LOCAL-PLAT-BAN-NUMBERS-S2

客户明确拒联须对应人工话后/AI人工确认路径，普通导入不能伪造来源

读取：FIELD-PLAT-BAN-GROUP, FIELD-PLAT-BAN-PHONE, FIELD-PLAT-BAN-CUSTOMER, FIELD-PLAT-BAN-ADD-TYPE, FIELD-PLAT-BAN-REASON, FIELD-PLAT-IMPORT-ROWS, FIELD-PLAT-BAN-EXPIRY, FIELD-PLAT-REQUEST；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

### LOCAL-PLAT-BAN-NUMBERS-S3

保存当前目标组的逐条结果，失败/未知不误报整批成功；同步分开显示

读取：FIELD-PLAT-BAN-GROUP, FIELD-PLAT-BAN-PHONE, FIELD-PLAT-BAN-CUSTOMER, FIELD-PLAT-BAN-ADD-TYPE, FIELD-PLAT-BAN-REASON, FIELD-PLAT-IMPORT-ROWS, FIELD-PLAT-BAN-EXPIRY, FIELD-PLAT-REQUEST；写入：FIELD-PLAT-BAN-ID, FIELD-PLAT-BAN-LIFETIME, FIELD-PLAT-BAN-STATE, FIELD-PLAT-BAN-REMOTE, FIELD-PLAT-AUDIT

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

## 分支与异常

### LOCAL-PLAT-BAN-NUMBERS-B1

条件：前提、字段及对象修订校验通过且结果明确成功

结果：仅准确目标组的合法号码入库，范围与期限明确

涉及字段：FIELD-PLAT-BAN-GROUP, FIELD-PLAT-BAN-PHONE, FIELD-PLAT-BAN-CUSTOMER, FIELD-PLAT-BAN-ADD-TYPE, FIELD-PLAT-BAN-REASON, FIELD-PLAT-IMPORT-ROWS, FIELD-PLAT-BAN-EXPIRY, FIELD-PLAT-REQUEST, FIELD-PLAT-BAN-ID, FIELD-PLAT-BAN-LIFETIME, FIELD-PLAT-BAN-STATE, FIELD-PLAT-BAN-REMOTE, FIELD-PLAT-AUDIT

验证：CHECK-PLAT-BAN-NUMBERS

### LOCAL-PLAT-BAN-NUMBERS-B2

条件：无权/字段不合法/对象失效/修订冲突

结果：明确显示本次拒绝原因，保留可继续的输入和已确认原值，不作变更

涉及字段：FIELD-PLAT-BAN-GROUP, FIELD-PLAT-BAN-PHONE, FIELD-PLAT-BAN-CUSTOMER, FIELD-PLAT-BAN-ADD-TYPE, FIELD-PLAT-BAN-REASON, FIELD-PLAT-IMPORT-ROWS, FIELD-PLAT-BAN-EXPIRY, FIELD-PLAT-REQUEST, FIELD-PLAT-BAN-ID, FIELD-PLAT-BAN-LIFETIME, FIELD-PLAT-BAN-STATE, FIELD-PLAT-BAN-REMOTE, FIELD-PLAT-AUDIT

验证：CHECK-PLAT-BAN-NUMBERS

### LOCAL-PLAT-BAN-NUMBERS-B3

条件：提交失败或结果未知

结果：失败保留原确认值；未知显示待核并按同请求核对，不重复提交或假报成功

涉及字段：FIELD-PLAT-BAN-GROUP, FIELD-PLAT-BAN-PHONE, FIELD-PLAT-BAN-CUSTOMER, FIELD-PLAT-BAN-ADD-TYPE, FIELD-PLAT-BAN-REASON, FIELD-PLAT-IMPORT-ROWS, FIELD-PLAT-BAN-EXPIRY, FIELD-PLAT-REQUEST, FIELD-PLAT-BAN-ID, FIELD-PLAT-BAN-LIFETIME, FIELD-PLAT-BAN-STATE, FIELD-PLAT-BAN-REMOTE, FIELD-PLAT-AUDIT

验证：CHECK-PLAT-BAN-NUMBERS

## 完成后的状态

- 仅准确目标组的合法号码入库，范围与期限明确

## 字段定义

- [FIELD-PLAT-AUDIT](../field-specs.md#FIELD-PLAT-AUDIT)
- [FIELD-PLAT-BAN-ADD-TYPE](../field-specs.md#FIELD-PLAT-BAN-ADD-TYPE)
- [FIELD-PLAT-BAN-CUSTOMER](../field-specs.md#FIELD-PLAT-BAN-CUSTOMER)
- [FIELD-PLAT-BAN-EXPIRY](../field-specs.md#FIELD-PLAT-BAN-EXPIRY)
- [FIELD-PLAT-BAN-GROUP](../field-specs.md#FIELD-PLAT-BAN-GROUP)
- [FIELD-PLAT-BAN-ID](../field-specs.md#FIELD-PLAT-BAN-ID)
- [FIELD-PLAT-BAN-LIFETIME](../field-specs.md#FIELD-PLAT-BAN-LIFETIME)
- [FIELD-PLAT-BAN-PHONE](../field-specs.md#FIELD-PLAT-BAN-PHONE)
- [FIELD-PLAT-BAN-REASON](../field-specs.md#FIELD-PLAT-BAN-REASON)
- [FIELD-PLAT-BAN-REMOTE](../field-specs.md#FIELD-PLAT-BAN-REMOTE)
- [FIELD-PLAT-BAN-STATE](../field-specs.md#FIELD-PLAT-BAN-STATE)
- [FIELD-PLAT-IMPORT-ROWS](../field-specs.md#FIELD-PLAT-IMPORT-ROWS)
- [FIELD-PLAT-REQUEST](../field-specs.md#FIELD-PLAT-REQUEST)

## 来源与验证

来源条目：acceptance:AC-2048, acceptance:AC-2049, acceptance:AC-2050, features:FUNC-2002, features:FUNC-2002/behavior_spec/16/branches/0, features:FUNC-2002/behavior_spec/16/branches/1, features:FUNC-2002/behavior_spec/16/branches/2, features:FUNC-2002/behavior_spec/16/postconditions/0, features:FUNC-2002/behavior_spec/16/preconditions/0, features:FUNC-2002/behavior_spec/16/steps/0, features:FUNC-2002/behavior_spec/16/steps/1, features:FUNC-2002/behavior_spec/16/steps/2, features:FUNC-2020, features:FUNC-2020/behavior_spec/3/branches/0, features:FUNC-2020/behavior_spec/3/branches/1, features:FUNC-2020/behavior_spec/3/branches/2, features:FUNC-2020/behavior_spec/3/postconditions/0, features:FUNC-2020/behavior_spec/3/preconditions/0, features:FUNC-2020/behavior_spec/3/steps/0, features:FUNC-2020/behavior_spec/3/steps/1, features:FUNC-2020/behavior_spec/3/steps/2, pages:PAGE-2003/fields/2, pages:PAGE-2003/fields/22, pages:PAGE-2004/fields/0, pages:PAGE-2004/fields/4, pages:PAGE-2005/fields/0, pages:PAGE-2005/fields/8, pages:PAGE-2006/fields/56, pages:PAGE-2007, pages:PAGE-2007/actions/7, pages:PAGE-2007/actions/8, pages:PAGE-2007/fields/1, pages:PAGE-2007/fields/10, pages:PAGE-2007/fields/12, pages:PAGE-2007/fields/13, pages:PAGE-2007/fields/15, pages:PAGE-2007/fields/17, pages:PAGE-2007/fields/2, pages:PAGE-2007/fields/20, pages:PAGE-2007/fields/24, pages:PAGE-2007/fields/5, pages:PAGE-2007/fields/7, pages:PAGE-2007/fields/8, pages:PAGE-2007/fields/9, pages:PAGE-2103/fields/12, pages:PAGE-2103/fields/19, pages:PAGE-2103/fields/3, pages:PAGE-2103/fields/4, pages:PAGE-2103/fields/6, pages:PAGE-2108/fields/10, pages:PAGE-2108/fields/18, pages:PAGE-2108/fields/4, pages:PAGE-2108/fields/5, pages:PAGE-2108/fields/6, pages:PAGE-2108/fields/7, pages:PAGE-2108/fields/8, pages:PAGE-2109/fields/3, pages:PAGE-2110/fields/7, pages:PAGE-2111/fields/12, pages:PAGE-2112/fields/13, pages:PAGE-2112/fields/6, pages:PAGE-2202/fields/1, pages:PAGE-2202/fields/2, pages:PAGE-2202/fields/28, pages:PAGE-2202/fields/3, pages:PAGE-2202/fields/5, pages:PAGE-2204/fields/71, pages:PAGE-2204/fields/76, pages:PAGE-2204/fields/82, pages:PAGE-2205/fields/0, pages:PAGE-2205/fields/1, pages:PAGE-2205/fields/15, pages:PAGE-2205/fields/3, pages:PAGE-2205/fields/9, pages:PAGE-2206/fields/0, pages:PAGE-2206/fields/1, pages:PAGE-2206/fields/15, pages:PAGE-2206/fields/3, pages:PAGE-2206/fields/9, pages:PAGE-2207/fields/0, pages:PAGE-2207/fields/17, pages:PAGE-2210/fields/0, pages:PAGE-2210/fields/5, pages:PAGE-2211/fields/0, pages:PAGE-2211/fields/4, pages:PAGE-2212/fields/0, pages:PAGE-2212/fields/9, pages:PAGE-2213/fields/0, pages:PAGE-2213/fields/25, pages:PAGE-2214/fields/0, pages:PAGE-2214/fields/4, pages:PAGE-2215/fields/0, pages:PAGE-2215/fields/6, pages:PAGE-2216/fields/0, pages:PAGE-2216/fields/10, pages:PAGE-2217/fields/0, pages:PAGE-2217/fields/17, pages:PAGE-2218/fields/0, pages:PAGE-2218/fields/5, pages:PAGE-2219/fields/0, pages:PAGE-2219/fields/11, pages:PAGE-2220/fields/17, pages:PAGE-2220/fields/7, pages:PAGE-2221/fields/0, pages:PAGE-2221/fields/6, pages:PAGE-2222/fields/0, pages:PAGE-2223/fields/35, pages:PAGE-2227/fields/120, pages:PAGE-2227/fields/121, pages:PAGE-2227/fields/122, pages:PAGE-2227/fields/124, pages:PAGE-2227/fields/136, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/186, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/188, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/206, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/238, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/241, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/243, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/244, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/245, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/246, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/248, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/249, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/250, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/253, scenarios:FLOW-CURRENT-PLATFORM/steps/38

验证：CHECK-PLAT-BAN-NUMBERS

## 实施任务

- [TASK-037](../tasks/TASK-037.md)
