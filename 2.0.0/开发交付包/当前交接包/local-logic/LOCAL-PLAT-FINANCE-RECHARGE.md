# LOCAL-PLAT-FINANCE-RECHARGE 办理试用、年度服务或通话加油包

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md) · [全局逻辑](../global-logic.md)

- [进入有权工作位置与保留专业能力 · FUNC\-2002](../features/FUNC-2002.md)

## 职责与触发

所属工程模块：未填写

功能：FUNC-2002

触发：超管服务管理选择产品后确认办理

## 前置条件

- 超级管理员且原服务办理权；准确AI租户映射及当前产品可确认

## 必须遵守的全局规则

- [GR-IDENTITY](../global-logic.md#GR-IDENTITY)
- [GR-SCOPE](../global-logic.md#GR-SCOPE)
- [GR-AUTH](../global-logic.md#GR-AUTH)
- [GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)
- [GR-LIST-ORDER](../global-logic.md#GR-LIST-ORDER)

## 输入与输出

输入：[FIELD-PLAT-TENANT-ID](../field-specs.md#FIELD-PLAT-TENANT-ID)、[FIELD-PLAT-AI-TENANT](../field-specs.md#FIELD-PLAT-AI-TENANT)、[FIELD-PLAT-SERVICE-PACKAGE](../field-specs.md#FIELD-PLAT-SERVICE-PACKAGE)、[FIELD-PLAT-SERVICE-COUNT](../field-specs.md#FIELD-PLAT-SERVICE-COUNT)、[FIELD-PLAT-SERVICE-PRICE](../field-specs.md#FIELD-PLAT-SERVICE-PRICE)、[FIELD-PLAT-SERVICE-CREDIT](../field-specs.md#FIELD-PLAT-SERVICE-CREDIT)、[FIELD-PLAT-SERVICE-START](../field-specs.md#FIELD-PLAT-SERVICE-START)、[FIELD-PLAT-SERVICE-END](../field-specs.md#FIELD-PLAT-SERVICE-END)、[FIELD-PLAT-SERVICE-REASON](../field-specs.md#FIELD-PLAT-SERVICE-REASON)、[FIELD-PLAT-REVISION](../field-specs.md#FIELD-PLAT-REVISION)、[FIELD-PLAT-REQUEST](../field-specs.md#FIELD-PLAT-REQUEST)、[FIELD-PLAT-SERVICE-MANUAL](../field-specs.md#FIELD-PLAT-SERVICE-MANUAL)

输出：[FIELD-PLAT-SERVICE-STATE](../field-specs.md#FIELD-PLAT-SERVICE-STATE)、[FIELD-PLAT-SERVICE-VALIDITY](../field-specs.md#FIELD-PLAT-SERVICE-VALIDITY)、[FIELD-PLAT-MINUTES-AVAILABLE](../field-specs.md#FIELD-PLAT-MINUTES-AVAILABLE)、[FIELD-PLAT-SERVICE-HISTORY](../field-specs.md#FIELD-PLAT-SERVICE-HISTORY)、[FIELD-PLAT-OP-STATE](../field-specs.md#FIELD-PLAT-OP-STATE)、[FIELD-PLAT-AUDIT](../field-specs.md#FIELD-PLAT-AUDIT)

## 处理步骤

### LOCAL-PLAT-FINANCE-RECHARGE-S1

逐产品校验资格、数量、允许分钟与有效期；四租户角色不可提交

读取：FIELD-PLAT-TENANT-ID, FIELD-PLAT-AI-TENANT, FIELD-PLAT-SERVICE-PACKAGE, FIELD-PLAT-SERVICE-COUNT, FIELD-PLAT-SERVICE-PRICE, FIELD-PLAT-SERVICE-CREDIT, FIELD-PLAT-SERVICE-START, FIELD-PLAT-SERVICE-END, FIELD-PLAT-SERVICE-REASON, FIELD-PLAT-REVISION, FIELD-PLAT-REQUEST；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

### LOCAL-PLAT-FINANCE-RECHARGE-S2

捕获当前服务修订与请求，明确确认后提交

读取：FIELD-PLAT-TENANT-ID, FIELD-PLAT-AI-TENANT, FIELD-PLAT-SERVICE-PACKAGE, FIELD-PLAT-SERVICE-COUNT, FIELD-PLAT-SERVICE-PRICE, FIELD-PLAT-SERVICE-CREDIT, FIELD-PLAT-SERVICE-START, FIELD-PLAT-SERVICE-END, FIELD-PLAT-SERVICE-REASON, FIELD-PLAT-REVISION, FIELD-PLAT-REQUEST；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

### LOCAL-PLAT-FINANCE-RECHARGE-S3

按准确请求终态更新当前服务和历史；pending/unknown不再下单

读取：FIELD-PLAT-TENANT-ID, FIELD-PLAT-AI-TENANT, FIELD-PLAT-SERVICE-PACKAGE, FIELD-PLAT-SERVICE-COUNT, FIELD-PLAT-SERVICE-PRICE, FIELD-PLAT-SERVICE-CREDIT, FIELD-PLAT-SERVICE-START, FIELD-PLAT-SERVICE-END, FIELD-PLAT-SERVICE-REASON, FIELD-PLAT-REVISION, FIELD-PLAT-REQUEST；写入：FIELD-PLAT-SERVICE-STATE, FIELD-PLAT-SERVICE-VALIDITY, FIELD-PLAT-MINUTES-AVAILABLE, FIELD-PLAT-SERVICE-HISTORY, FIELD-PLAT-OP-STATE, FIELD-PLAT-AUDIT

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

## 分支与异常

### LOCAL-PLAT-FINANCE-RECHARGE-B1

条件：前提、字段及对象修订校验通过且结果明确成功

结果：只有确认成功才增加/开通服务，失败不改变余额；待核保留同请求

涉及字段：FIELD-PLAT-TENANT-ID, FIELD-PLAT-AI-TENANT, FIELD-PLAT-SERVICE-PACKAGE, FIELD-PLAT-SERVICE-COUNT, FIELD-PLAT-SERVICE-PRICE, FIELD-PLAT-SERVICE-CREDIT, FIELD-PLAT-SERVICE-START, FIELD-PLAT-SERVICE-END, FIELD-PLAT-SERVICE-REASON, FIELD-PLAT-REVISION, FIELD-PLAT-REQUEST, FIELD-PLAT-SERVICE-STATE, FIELD-PLAT-SERVICE-VALIDITY, FIELD-PLAT-MINUTES-AVAILABLE, FIELD-PLAT-SERVICE-HISTORY, FIELD-PLAT-OP-STATE, FIELD-PLAT-AUDIT

验证：CHECK-PLAT-FINANCE-RECHARGE

### LOCAL-PLAT-FINANCE-RECHARGE-B2

条件：无权/字段不合法/对象失效/修订冲突

结果：明确显示本次拒绝原因，保留可继续的输入和已确认原值，不作变更

涉及字段：FIELD-PLAT-TENANT-ID, FIELD-PLAT-AI-TENANT, FIELD-PLAT-SERVICE-PACKAGE, FIELD-PLAT-SERVICE-COUNT, FIELD-PLAT-SERVICE-PRICE, FIELD-PLAT-SERVICE-CREDIT, FIELD-PLAT-SERVICE-START, FIELD-PLAT-SERVICE-END, FIELD-PLAT-SERVICE-REASON, FIELD-PLAT-REVISION, FIELD-PLAT-REQUEST, FIELD-PLAT-SERVICE-STATE, FIELD-PLAT-SERVICE-VALIDITY, FIELD-PLAT-MINUTES-AVAILABLE, FIELD-PLAT-SERVICE-HISTORY, FIELD-PLAT-OP-STATE, FIELD-PLAT-AUDIT

验证：CHECK-PLAT-FINANCE-RECHARGE

### LOCAL-PLAT-FINANCE-RECHARGE-B3

条件：提交失败或结果未知

结果：失败保留原确认值；未知显示待核并按同请求核对，不重复提交或假报成功

涉及字段：FIELD-PLAT-TENANT-ID, FIELD-PLAT-AI-TENANT, FIELD-PLAT-SERVICE-PACKAGE, FIELD-PLAT-SERVICE-COUNT, FIELD-PLAT-SERVICE-PRICE, FIELD-PLAT-SERVICE-CREDIT, FIELD-PLAT-SERVICE-START, FIELD-PLAT-SERVICE-END, FIELD-PLAT-SERVICE-REASON, FIELD-PLAT-REVISION, FIELD-PLAT-REQUEST, FIELD-PLAT-SERVICE-STATE, FIELD-PLAT-SERVICE-VALIDITY, FIELD-PLAT-MINUTES-AVAILABLE, FIELD-PLAT-SERVICE-HISTORY, FIELD-PLAT-OP-STATE, FIELD-PLAT-AUDIT

验证：CHECK-PLAT-FINANCE-RECHARGE

## 完成后的状态

- 只有确认成功才增加/开通服务，失败不改变余额；待核保留同请求

## 字段定义

- [FIELD-PLAT-AI-TENANT](../field-specs.md#FIELD-PLAT-AI-TENANT)
- [FIELD-PLAT-AUDIT](../field-specs.md#FIELD-PLAT-AUDIT)
- [FIELD-PLAT-MINUTES-AVAILABLE](../field-specs.md#FIELD-PLAT-MINUTES-AVAILABLE)
- [FIELD-PLAT-OP-STATE](../field-specs.md#FIELD-PLAT-OP-STATE)
- [FIELD-PLAT-REQUEST](../field-specs.md#FIELD-PLAT-REQUEST)
- [FIELD-PLAT-REVISION](../field-specs.md#FIELD-PLAT-REVISION)
- [FIELD-PLAT-SERVICE-COUNT](../field-specs.md#FIELD-PLAT-SERVICE-COUNT)
- [FIELD-PLAT-SERVICE-CREDIT](../field-specs.md#FIELD-PLAT-SERVICE-CREDIT)
- [FIELD-PLAT-SERVICE-END](../field-specs.md#FIELD-PLAT-SERVICE-END)
- [FIELD-PLAT-SERVICE-HISTORY](../field-specs.md#FIELD-PLAT-SERVICE-HISTORY)
- [FIELD-PLAT-SERVICE-MANUAL](../field-specs.md#FIELD-PLAT-SERVICE-MANUAL)
- [FIELD-PLAT-SERVICE-PACKAGE](../field-specs.md#FIELD-PLAT-SERVICE-PACKAGE)
- [FIELD-PLAT-SERVICE-PRICE](../field-specs.md#FIELD-PLAT-SERVICE-PRICE)
- [FIELD-PLAT-SERVICE-REASON](../field-specs.md#FIELD-PLAT-SERVICE-REASON)
- [FIELD-PLAT-SERVICE-START](../field-specs.md#FIELD-PLAT-SERVICE-START)
- [FIELD-PLAT-SERVICE-STATE](../field-specs.md#FIELD-PLAT-SERVICE-STATE)
- [FIELD-PLAT-SERVICE-VALIDITY](../field-specs.md#FIELD-PLAT-SERVICE-VALIDITY)
- [FIELD-PLAT-TENANT-ID](../field-specs.md#FIELD-PLAT-TENANT-ID)

## 来源与验证

来源条目：acceptance:AC-2064, acceptance:AC-2065, features:FUNC-2002, features:FUNC-2002/behavior_spec/22/branches/0, features:FUNC-2002/behavior_spec/22/branches/1, features:FUNC-2002/behavior_spec/22/branches/2, features:FUNC-2002/behavior_spec/22/postconditions/0, features:FUNC-2002/behavior_spec/22/preconditions/0, features:FUNC-2002/behavior_spec/22/steps/0, features:FUNC-2002/behavior_spec/22/steps/1, features:FUNC-2002/behavior_spec/22/steps/2, pages:PAGE-2003/fields/17, pages:PAGE-2003/fields/2, pages:PAGE-2003/fields/22, pages:PAGE-2003/fields/24, pages:PAGE-2004/fields/0, pages:PAGE-2004/fields/12, pages:PAGE-2004/fields/2, pages:PAGE-2004/fields/4, pages:PAGE-2004/fields/5, pages:PAGE-2005/fields/0, pages:PAGE-2005/fields/11, pages:PAGE-2005/fields/5, pages:PAGE-2005/fields/8, pages:PAGE-2005/fields/9, pages:PAGE-2006/fields/56, pages:PAGE-2006/fields/58, pages:PAGE-2007/fields/1, pages:PAGE-2007/fields/21, pages:PAGE-2007/fields/24, pages:PAGE-2007/fields/25, pages:PAGE-2102/fields/0, pages:PAGE-2102/fields/1, pages:PAGE-2102/fields/10, pages:PAGE-2102/fields/11, pages:PAGE-2102/fields/7, pages:PAGE-2102/fields/8, pages:PAGE-2102/fields/9, pages:PAGE-2103/fields/13, pages:PAGE-2103/fields/19, pages:PAGE-2103/fields/2, pages:PAGE-2103/fields/20, pages:PAGE-2103/fields/3, pages:PAGE-2106/fields/0, pages:PAGE-2106/fields/11, pages:PAGE-2106/fields/12, pages:PAGE-2106/fields/13, pages:PAGE-2106/fields/2, pages:PAGE-2108/fields/18, pages:PAGE-2108/fields/4, pages:PAGE-2109/fields/2, pages:PAGE-2109/fields/3, pages:PAGE-2109/fields/9, pages:PAGE-2110/fields/12, pages:PAGE-2110/fields/5, pages:PAGE-2110/fields/7, pages:PAGE-2110/fields/8, pages:PAGE-2111/fields/10, pages:PAGE-2111/fields/12, pages:PAGE-2111/fields/16, pages:PAGE-2112, pages:PAGE-2112/actions/0, pages:PAGE-2112/fields/11, pages:PAGE-2112/fields/13, pages:PAGE-2112/fields/14, pages:PAGE-2112/fields/16, pages:PAGE-2112/fields/17, pages:PAGE-2112/fields/18, pages:PAGE-2112/fields/19, pages:PAGE-2112/fields/20, pages:PAGE-2112/fields/21, pages:PAGE-2112/fields/22, pages:PAGE-2112/fields/23, pages:PAGE-2112/fields/24, pages:PAGE-2112/fields/25, pages:PAGE-2112/fields/26, pages:PAGE-2112/fields/28, pages:PAGE-2112/fields/5, pages:PAGE-2112/fields/6, pages:PAGE-2112/fields/8, pages:PAGE-2202/fields/1, pages:PAGE-2202/fields/21, pages:PAGE-2202/fields/28, pages:PAGE-2202/fields/30, pages:PAGE-2204/fields/71, pages:PAGE-2204/fields/77, pages:PAGE-2204/fields/82, pages:PAGE-2204/fields/84, pages:PAGE-2205/fields/0, pages:PAGE-2205/fields/10, pages:PAGE-2205/fields/15, pages:PAGE-2205/fields/17, pages:PAGE-2206/fields/0, pages:PAGE-2206/fields/10, pages:PAGE-2206/fields/15, pages:PAGE-2206/fields/17, pages:PAGE-2207/fields/0, pages:PAGE-2207/fields/14, pages:PAGE-2207/fields/17, pages:PAGE-2207/fields/18, pages:PAGE-2210/fields/0, pages:PAGE-2210/fields/1, pages:PAGE-2210/fields/5, pages:PAGE-2210/fields/8, pages:PAGE-2211/fields/0, pages:PAGE-2211/fields/1, pages:PAGE-2211/fields/4, pages:PAGE-2211/fields/7, pages:PAGE-2212/fields/0, pages:PAGE-2212/fields/1, pages:PAGE-2212/fields/12, pages:PAGE-2212/fields/9, pages:PAGE-2213/fields/0, pages:PAGE-2213/fields/1, pages:PAGE-2213/fields/25, pages:PAGE-2213/fields/28, pages:PAGE-2214/fields/0, pages:PAGE-2214/fields/2, pages:PAGE-2214/fields/4, pages:PAGE-2215/fields/0, pages:PAGE-2215/fields/3, pages:PAGE-2215/fields/6, pages:PAGE-2215/fields/9, pages:PAGE-2216/fields/0, pages:PAGE-2216/fields/1, pages:PAGE-2216/fields/10, pages:PAGE-2216/fields/13, pages:PAGE-2217/fields/0, pages:PAGE-2217/fields/13, pages:PAGE-2217/fields/17, pages:PAGE-2217/fields/20, pages:PAGE-2218/fields/0, pages:PAGE-2218/fields/1, pages:PAGE-2218/fields/5, pages:PAGE-2218/fields/8, pages:PAGE-2219/fields/0, pages:PAGE-2219/fields/11, pages:PAGE-2219/fields/14, pages:PAGE-2219/fields/8, pages:PAGE-2220/fields/12, pages:PAGE-2220/fields/17, pages:PAGE-2220/fields/20, pages:PAGE-2220/fields/7, pages:PAGE-2221/fields/0, pages:PAGE-2221/fields/6, pages:PAGE-2222/fields/0, pages:PAGE-2223/fields/35, pages:PAGE-2223/fields/39, pages:PAGE-2227/fields/120, pages:PAGE-2227/fields/136, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/188, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/199, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/200, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/201, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/202, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/238, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/269, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/270, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/271, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/275, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/276, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/381, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/382, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/383, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/384, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/385, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/386, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/399, scenarios:FLOW-CURRENT-PLATFORM/steps/48

验证：CHECK-PLAT-FINANCE-RECHARGE

## 实施任务

- [TASK-040](../tasks/TASK-040.md)
