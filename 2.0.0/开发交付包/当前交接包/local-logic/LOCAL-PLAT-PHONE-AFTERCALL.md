# LOCAL-PLAT-PHONE-AFTERCALL 原客户任务保存人工跟进结果

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md) · [全局逻辑](../global-logic.md)

- [进入有权工作位置与保留专业能力 · FUNC\-2002](../features/FUNC-2002.md)
- [人工明确拒联成功保存后自动入库 · FUNC\-2022](../features/FUNC-2022.md)

## 职责与触发

所属工程模块：未填写

功能：FUNC-2002, FUNC-2022

触发：实际拨打/接听人提交本轮跟进

## 前置条件

- 当前准确通话的实际拨打/接听人有处理权；本轮开始已取得并展示最新字段定义与当前有效值

## 必须遵守的全局规则

- [GR-IDENTITY](../global-logic.md#GR-IDENTITY)
- [GR-SCOPE](../global-logic.md#GR-SCOPE)
- [GR-AUTH](../global-logic.md#GR-AUTH)
- [GR-DATA-FACTS](../global-logic.md#GR-DATA-FACTS)
- [GR-SERIAL](../global-logic.md#GR-SERIAL)
- [GR-FIELDS](../global-logic.md#GR-FIELDS)
- [GR-CONTACT](../global-logic.md#GR-CONTACT)
- [GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)

## 输入与输出

输入：[FIELD-PLAT-CALL-ID](../field-specs.md#FIELD-PLAT-CALL-ID)、[FIELD-PLAT-CALL-ACTOR](../field-specs.md#FIELD-PLAT-CALL-ACTOR)、[FIELD-PLAT-CUSTOMER-ID](../field-specs.md#FIELD-PLAT-CUSTOMER-ID)、[FIELD-PLAT-PRO-FOLLOW-STATE](../field-specs.md#FIELD-PLAT-PRO-FOLLOW-STATE)、[FIELD-PLAT-PRO-FILL](../field-specs.md#FIELD-PLAT-PRO-FILL)、[FIELD-PLAT-FOLLOW-NOTE](../field-specs.md#FIELD-PLAT-FOLLOW-NOTE)、[FIELD-PLAT-REVISION](../field-specs.md#FIELD-PLAT-REVISION)、[FIELD-PLAT-REQUEST](../field-specs.md#FIELD-PLAT-REQUEST)

输出：[FIELD-PLAT-PRO-FOLLOW-STATE](../field-specs.md#FIELD-PLAT-PRO-FOLLOW-STATE)、[FIELD-PLAT-PRO-FILL](../field-specs.md#FIELD-PLAT-PRO-FILL)、[FIELD-PLAT-API-RESULT](../field-specs.md#FIELD-PLAT-API-RESULT)、[FIELD-PLAT-AUDIT](../field-specs.md#FIELD-PLAT-AUDIT)、[FIELD-PLAT-PHONE-STATE](../field-specs.md#FIELD-PLAT-PHONE-STATE)

## 处理步骤

### LOCAL-PLAT-PHONE-AFTERCALL-S1

按本轮开始已展示/捕获的字段定义及当前有效值基准校验必填、选项与明确修改；保存不临时换schema，不拼入本轮未展示的新字段或值；若并发冲突已使提交不安全，保输入并明确提示核对/重载，不静默替换本轮定义

读取：FIELD-PLAT-CALL-ID, FIELD-PLAT-CALL-ACTOR, FIELD-PLAT-CUSTOMER-ID, FIELD-PLAT-PRO-FOLLOW-STATE, FIELD-PLAT-PRO-FILL, FIELD-PLAT-FOLLOW-NOTE, FIELD-PLAT-REVISION, FIELD-PLAT-REQUEST；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-DATA-FACTS, GR-SERIAL, GR-FIELDS, GR-CONTACT, GR-UNKNOWN

### LOCAL-PLAT-PHONE-AFTERCALL-S2

原任务结果待继续跟进或已完成独立保存；与新业务运行终态分开

读取：FIELD-PLAT-CALL-ID, FIELD-PLAT-CALL-ACTOR, FIELD-PLAT-CUSTOMER-ID, FIELD-PLAT-PRO-FOLLOW-STATE, FIELD-PLAT-PRO-FILL, FIELD-PLAT-FOLLOW-NOTE, FIELD-PLAT-REVISION, FIELD-PLAT-REQUEST；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-DATA-FACTS, GR-SERIAL, GR-FIELDS, GR-CONTACT, GR-UNKNOWN

### LOCAL-PLAT-PHONE-AFTERCALL-S3

明确拒联接入BAN-HUMAN；原完成结果回传按准确业务任务，不把待回传说成已成功

读取：FIELD-PLAT-CALL-ID, FIELD-PLAT-CALL-ACTOR, FIELD-PLAT-CUSTOMER-ID, FIELD-PLAT-PRO-FOLLOW-STATE, FIELD-PLAT-PRO-FILL, FIELD-PLAT-FOLLOW-NOTE, FIELD-PLAT-REVISION, FIELD-PLAT-REQUEST；写入：FIELD-PLAT-PRO-FOLLOW-STATE, FIELD-PLAT-PRO-FILL, FIELD-PLAT-API-RESULT, FIELD-PLAT-AUDIT, FIELD-PLAT-PHONE-STATE

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-DATA-FACTS, GR-SERIAL, GR-FIELDS, GR-CONTACT, GR-UNKNOWN

## 分支与异常

### LOCAL-PLAT-PHONE-AFTERCALL-B1

条件：前提、字段及对象修订校验通过且结果明确成功

结果：跟进成功后记录当时字段/值/处理人；必要入库/回传失败显示可恢复待处理，不假报完整完成

涉及字段：FIELD-PLAT-CALL-ID, FIELD-PLAT-CALL-ACTOR, FIELD-PLAT-CUSTOMER-ID, FIELD-PLAT-PRO-FOLLOW-STATE, FIELD-PLAT-PRO-FILL, FIELD-PLAT-FOLLOW-NOTE, FIELD-PLAT-REVISION, FIELD-PLAT-REQUEST, FIELD-PLAT-API-RESULT, FIELD-PLAT-AUDIT, FIELD-PLAT-PHONE-STATE

验证：CHECK-PLAT-PHONE-AFTERCALL

### LOCAL-PLAT-PHONE-AFTERCALL-B2

条件：无权/字段不合法/对象失效/修订冲突

结果：明确显示本次拒绝原因，保留可继续的输入和已确认原值，不作变更

涉及字段：FIELD-PLAT-CALL-ID, FIELD-PLAT-CALL-ACTOR, FIELD-PLAT-CUSTOMER-ID, FIELD-PLAT-PRO-FOLLOW-STATE, FIELD-PLAT-PRO-FILL, FIELD-PLAT-FOLLOW-NOTE, FIELD-PLAT-REVISION, FIELD-PLAT-REQUEST, FIELD-PLAT-API-RESULT, FIELD-PLAT-AUDIT, FIELD-PLAT-PHONE-STATE

验证：CHECK-PLAT-PHONE-AFTERCALL

### LOCAL-PLAT-PHONE-AFTERCALL-B3

条件：提交失败或结果未知

结果：失败保留原确认值；未知显示待核并按同请求核对，不重复提交或假报成功

涉及字段：FIELD-PLAT-CALL-ID, FIELD-PLAT-CALL-ACTOR, FIELD-PLAT-CUSTOMER-ID, FIELD-PLAT-PRO-FOLLOW-STATE, FIELD-PLAT-PRO-FILL, FIELD-PLAT-FOLLOW-NOTE, FIELD-PLAT-REVISION, FIELD-PLAT-REQUEST, FIELD-PLAT-API-RESULT, FIELD-PLAT-AUDIT, FIELD-PLAT-PHONE-STATE

验证：CHECK-PLAT-PHONE-AFTERCALL

## 完成后的状态

- 跟进成功后记录当时字段/值/处理人；必要入库/回传失败显示可恢复待处理，不假报完整完成

## 字段定义

- [FIELD-PLAT-API-RESULT](../field-specs.md#FIELD-PLAT-API-RESULT)
- [FIELD-PLAT-AUDIT](../field-specs.md#FIELD-PLAT-AUDIT)
- [FIELD-PLAT-CALL-ACTOR](../field-specs.md#FIELD-PLAT-CALL-ACTOR)
- [FIELD-PLAT-CALL-ID](../field-specs.md#FIELD-PLAT-CALL-ID)
- [FIELD-PLAT-CUSTOMER-ID](../field-specs.md#FIELD-PLAT-CUSTOMER-ID)
- [FIELD-PLAT-FOLLOW-NOTE](../field-specs.md#FIELD-PLAT-FOLLOW-NOTE)
- [FIELD-PLAT-PHONE-STATE](../field-specs.md#FIELD-PLAT-PHONE-STATE)
- [FIELD-PLAT-PRO-FILL](../field-specs.md#FIELD-PLAT-PRO-FILL)
- [FIELD-PLAT-PRO-FOLLOW-STATE](../field-specs.md#FIELD-PLAT-PRO-FOLLOW-STATE)
- [FIELD-PLAT-REQUEST](../field-specs.md#FIELD-PLAT-REQUEST)
- [FIELD-PLAT-REVISION](../field-specs.md#FIELD-PLAT-REVISION)

## 来源与验证

来源条目：acceptance:AC-2051, acceptance:AC-2053, acceptance:AC-2066, acceptance:AC-2067, acceptance:AC-2072, features:FUNC-2002, features:FUNC-2002/behavior_spec/28/branches/0, features:FUNC-2002/behavior_spec/28/branches/1, features:FUNC-2002/behavior_spec/28/branches/2, features:FUNC-2002/behavior_spec/28/postconditions/0, features:FUNC-2002/behavior_spec/28/preconditions/0, features:FUNC-2002/behavior_spec/28/steps/0, features:FUNC-2002/behavior_spec/28/steps/1, features:FUNC-2002/behavior_spec/28/steps/2, features:FUNC-2022, features:FUNC-2022/behavior_spec/1/branches/0, features:FUNC-2022/behavior_spec/1/branches/1, features:FUNC-2022/behavior_spec/1/branches/2, features:FUNC-2022/behavior_spec/1/postconditions/0, features:FUNC-2022/behavior_spec/1/preconditions/0, features:FUNC-2022/behavior_spec/1/steps/0, features:FUNC-2022/behavior_spec/1/steps/1, features:FUNC-2022/behavior_spec/1/steps/2, pages:PAGE-2003/fields/2, pages:PAGE-2003/fields/22, pages:PAGE-2003/fields/24, pages:PAGE-2004/fields/0, pages:PAGE-2004/fields/4, pages:PAGE-2004/fields/5, pages:PAGE-2005/fields/0, pages:PAGE-2005/fields/8, pages:PAGE-2005/fields/9, pages:PAGE-2006/fields/56, pages:PAGE-2006/fields/58, pages:PAGE-2007/fields/1, pages:PAGE-2007/fields/18, pages:PAGE-2007/fields/24, pages:PAGE-2007/fields/25, pages:PAGE-2103/fields/10, pages:PAGE-2103/fields/19, pages:PAGE-2103/fields/20, pages:PAGE-2103/fields/3, pages:PAGE-2103/fields/9, pages:PAGE-2108/fields/11, pages:PAGE-2108/fields/12, pages:PAGE-2108/fields/18, pages:PAGE-2108/fields/4, pages:PAGE-2109/fields/3, pages:PAGE-2109/fields/4, pages:PAGE-2109/fields/5, pages:PAGE-2109/fields/9, pages:PAGE-2110/fields/12, pages:PAGE-2110/fields/7, pages:PAGE-2111/fields/12, pages:PAGE-2111/fields/13, pages:PAGE-2111/fields/16, pages:PAGE-2112/fields/13, pages:PAGE-2112/fields/14, pages:PAGE-2112/fields/6, pages:PAGE-2202, pages:PAGE-2202/actions/3, pages:PAGE-2202/fields/0, pages:PAGE-2202/fields/1, pages:PAGE-2202/fields/11, pages:PAGE-2202/fields/13, pages:PAGE-2202/fields/23, pages:PAGE-2202/fields/24, pages:PAGE-2202/fields/25, pages:PAGE-2202/fields/28, pages:PAGE-2202/fields/30, pages:PAGE-2202/fields/6, pages:PAGE-2202/fields/7, pages:PAGE-2203/fields/55, pages:PAGE-2203/fields/56, pages:PAGE-2203/fields/60, pages:PAGE-2204/fields/67, pages:PAGE-2204/fields/71, pages:PAGE-2204/fields/72, pages:PAGE-2204/fields/73, pages:PAGE-2204/fields/80, pages:PAGE-2204/fields/82, pages:PAGE-2204/fields/84, pages:PAGE-2205/fields/0, pages:PAGE-2205/fields/15, pages:PAGE-2205/fields/17, pages:PAGE-2205/fields/4, pages:PAGE-2206/fields/0, pages:PAGE-2206/fields/15, pages:PAGE-2206/fields/17, pages:PAGE-2206/fields/4, pages:PAGE-2207/fields/0, pages:PAGE-2207/fields/1, pages:PAGE-2207/fields/15, pages:PAGE-2207/fields/16, pages:PAGE-2207/fields/17, pages:PAGE-2207/fields/18, pages:PAGE-2207/fields/2, pages:PAGE-2208/fields/1, pages:PAGE-2208/fields/2, pages:PAGE-2209/fields/0, pages:PAGE-2209/fields/1, pages:PAGE-2210/fields/0, pages:PAGE-2210/fields/5, pages:PAGE-2210/fields/8, pages:PAGE-2211/fields/0, pages:PAGE-2211/fields/4, pages:PAGE-2211/fields/7, pages:PAGE-2212/fields/0, pages:PAGE-2212/fields/12, pages:PAGE-2212/fields/9, pages:PAGE-2213/fields/0, pages:PAGE-2213/fields/25, pages:PAGE-2213/fields/28, pages:PAGE-2214/fields/0, pages:PAGE-2214/fields/4, pages:PAGE-2215/fields/0, pages:PAGE-2215/fields/6, pages:PAGE-2215/fields/9, pages:PAGE-2216/fields/0, pages:PAGE-2216/fields/10, pages:PAGE-2216/fields/13, pages:PAGE-2217/fields/0, pages:PAGE-2217/fields/17, pages:PAGE-2217/fields/20, pages:PAGE-2218/fields/0, pages:PAGE-2218/fields/5, pages:PAGE-2218/fields/8, pages:PAGE-2219/fields/0, pages:PAGE-2219/fields/11, pages:PAGE-2219/fields/14, pages:PAGE-2220/fields/1, pages:PAGE-2220/fields/14, pages:PAGE-2220/fields/17, pages:PAGE-2220/fields/20, pages:PAGE-2220/fields/7, pages:PAGE-2220/fields/8, pages:PAGE-2220/fields/9, pages:PAGE-2221/fields/0, pages:PAGE-2221/fields/2, pages:PAGE-2221/fields/6, pages:PAGE-2222/fields/0, pages:PAGE-2223/fields/35, pages:PAGE-2223/fields/39, pages:PAGE-2227/fields/120, pages:PAGE-2227/fields/125, pages:PAGE-2227/fields/126, pages:PAGE-2227/fields/129, pages:PAGE-2227/fields/132, pages:PAGE-2227/fields/133, pages:PAGE-2227/fields/136, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/185, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/186, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/188, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/208, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/212, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/213, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/214, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/215, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/217, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/222, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/298, scenarios:FLOW-CURRENT-PLATFORM/steps/55

验证：CHECK-PLAT-PHONE-AFTERCALL

## 实施任务

- [TASK-042](../tasks/TASK-042.md)
