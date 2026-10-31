# LOCAL-PLAT-LIMITED-FINISH 结束停用后的有限收尾

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md) · [全局逻辑](../global-logic.md)

- [结束停用范围有限收尾 · FUNC\-2015](../features/FUNC-2015.md)

## 职责与触发

所属工程模块：未填写

功能：FUNC-2015

触发：已被停用的实际接听人完成当前电话必要话后

## 前置条件

- 仅有准确callId的有限收尾资格

## 必须遵守的全局规则

- [GR-IDENTITY](../global-logic.md#GR-IDENTITY)
- [GR-SCOPE](../global-logic.md#GR-SCOPE)
- [GR-AUTH](../global-logic.md#GR-AUTH)
- [GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)
- [GR-LIST-ORDER](../global-logic.md#GR-LIST-ORDER)

## 输入与输出

输入：[FIELD-PLAT-LIMITED](../field-specs.md#FIELD-PLAT-LIMITED)、[FIELD-PLAT-CALL-ID](../field-specs.md#FIELD-PLAT-CALL-ID)、[FIELD-PLAT-CALL-STATE](../field-specs.md#FIELD-PLAT-CALL-STATE)、[FIELD-PLAT-PRO-FOLLOW-STATE](../field-specs.md#FIELD-PLAT-PRO-FOLLOW-STATE)、[FIELD-PLAT-PRO-FILL](../field-specs.md#FIELD-PLAT-PRO-FILL)、[FIELD-PLAT-FOLLOW-NOTE](../field-specs.md#FIELD-PLAT-FOLLOW-NOTE)

输出：[FIELD-PLAT-LIMITED](../field-specs.md#FIELD-PLAT-LIMITED)、[FIELD-PLAT-PHONE-STATE](../field-specs.md#FIELD-PLAT-PHONE-STATE)、[FIELD-PLAT-AUDIT](../field-specs.md#FIELD-PLAT-AUDIT)

## 处理步骤

### LOCAL-PLAT-LIMITED-FINISH-S1

仅允许当前已接通电话和必要话后保存，不允许新拨或打开无关对象

读取：FIELD-PLAT-LIMITED, FIELD-PLAT-CALL-ID, FIELD-PLAT-CALL-STATE, FIELD-PLAT-PRO-FOLLOW-STATE, FIELD-PLAT-PRO-FILL, FIELD-PLAT-FOLLOW-NOTE；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

### LOCAL-PLAT-LIMITED-FINISH-S2

成功保存后确认离线并结束有限范围；未知继续待核

读取：FIELD-PLAT-LIMITED, FIELD-PLAT-CALL-ID, FIELD-PLAT-CALL-STATE, FIELD-PLAT-PRO-FOLLOW-STATE, FIELD-PLAT-PRO-FILL, FIELD-PLAT-FOLLOW-NOTE；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

### LOCAL-PLAT-LIMITED-FINISH-S3

提示账号/成员仍停用，回合法剩余范围或登录页

读取：FIELD-PLAT-LIMITED, FIELD-PLAT-CALL-ID, FIELD-PLAT-CALL-STATE, FIELD-PLAT-PRO-FOLLOW-STATE, FIELD-PLAT-PRO-FILL, FIELD-PLAT-FOLLOW-NOTE；写入：FIELD-PLAT-LIMITED, FIELD-PLAT-PHONE-STATE, FIELD-PLAT-AUDIT

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

## 分支与异常

### LOCAL-PLAT-LIMITED-FINISH-B1

条件：前提、字段及对象修订校验通过且结果明确成功

结果：原电话完成并结束有限访问，不重开成员/全局账号权限

涉及字段：FIELD-PLAT-LIMITED, FIELD-PLAT-CALL-ID, FIELD-PLAT-CALL-STATE, FIELD-PLAT-PRO-FOLLOW-STATE, FIELD-PLAT-PRO-FILL, FIELD-PLAT-FOLLOW-NOTE, FIELD-PLAT-PHONE-STATE, FIELD-PLAT-AUDIT

验证：CHECK-PLAT-LIMITED-FINISH

### LOCAL-PLAT-LIMITED-FINISH-B2

条件：无权/字段不合法/对象失效/修订冲突

结果：明确显示本次拒绝原因，保留可继续的输入和已确认原值，不作变更

涉及字段：FIELD-PLAT-LIMITED, FIELD-PLAT-CALL-ID, FIELD-PLAT-CALL-STATE, FIELD-PLAT-PRO-FOLLOW-STATE, FIELD-PLAT-PRO-FILL, FIELD-PLAT-FOLLOW-NOTE, FIELD-PLAT-PHONE-STATE, FIELD-PLAT-AUDIT

验证：CHECK-PLAT-LIMITED-FINISH

### LOCAL-PLAT-LIMITED-FINISH-B3

条件：提交失败或结果未知

结果：失败保留原确认值；未知显示待核并按同请求核对，不重复提交或假报成功

涉及字段：FIELD-PLAT-LIMITED, FIELD-PLAT-CALL-ID, FIELD-PLAT-CALL-STATE, FIELD-PLAT-PRO-FOLLOW-STATE, FIELD-PLAT-PRO-FILL, FIELD-PLAT-FOLLOW-NOTE, FIELD-PLAT-PHONE-STATE, FIELD-PLAT-AUDIT

验证：CHECK-PLAT-LIMITED-FINISH

## 完成后的状态

- 原电话完成并结束有限访问，不重开成员/全局账号权限

## 字段定义

- [FIELD-PLAT-AUDIT](../field-specs.md#FIELD-PLAT-AUDIT)
- [FIELD-PLAT-CALL-ID](../field-specs.md#FIELD-PLAT-CALL-ID)
- [FIELD-PLAT-CALL-STATE](../field-specs.md#FIELD-PLAT-CALL-STATE)
- [FIELD-PLAT-FOLLOW-NOTE](../field-specs.md#FIELD-PLAT-FOLLOW-NOTE)
- [FIELD-PLAT-LIMITED](../field-specs.md#FIELD-PLAT-LIMITED)
- [FIELD-PLAT-PHONE-STATE](../field-specs.md#FIELD-PLAT-PHONE-STATE)
- [FIELD-PLAT-PRO-FILL](../field-specs.md#FIELD-PLAT-PRO-FILL)
- [FIELD-PLAT-PRO-FOLLOW-STATE](../field-specs.md#FIELD-PLAT-PRO-FOLLOW-STATE)

## 来源与验证

来源条目：acceptance:AC-2029, acceptance:AC-2032, features:FUNC-2015, features:FUNC-2015/behavior_spec/0/branches/0, features:FUNC-2015/behavior_spec/0/branches/1, features:FUNC-2015/behavior_spec/0/branches/2, features:FUNC-2015/behavior_spec/0/postconditions/0, features:FUNC-2015/behavior_spec/0/preconditions/0, features:FUNC-2015/behavior_spec/0/steps/0, features:FUNC-2015/behavior_spec/0/steps/1, features:FUNC-2015/behavior_spec/0/steps/2, pages:PAGE-2003/fields/2, pages:PAGE-2003/fields/6, pages:PAGE-2004/fields/0, pages:PAGE-2005/fields/0, pages:PAGE-2006/fields/56, pages:PAGE-2007/fields/1, pages:PAGE-2007/fields/18, pages:PAGE-2103/fields/10, pages:PAGE-2103/fields/3, pages:PAGE-2108/fields/12, pages:PAGE-2108/fields/13, pages:PAGE-2108/fields/4, pages:PAGE-2109/fields/3, pages:PAGE-2109/fields/4, pages:PAGE-2109/fields/5, pages:PAGE-2110/fields/7, pages:PAGE-2111/fields/12, pages:PAGE-2111/fields/13, pages:PAGE-2112/fields/6, pages:PAGE-2202, pages:PAGE-2202/fields/1, pages:PAGE-2202/fields/13, pages:PAGE-2202/fields/17, pages:PAGE-2202/fields/23, pages:PAGE-2202/fields/24, pages:PAGE-2202/fields/25, pages:PAGE-2202/fields/7, pages:PAGE-2202/fields/8, pages:PAGE-2203/fields/55, pages:PAGE-2203/fields/60, pages:PAGE-2204/fields/71, pages:PAGE-2204/fields/72, pages:PAGE-2204/fields/80, pages:PAGE-2205/fields/0, pages:PAGE-2205/fields/4, pages:PAGE-2205/fields/5, pages:PAGE-2206/fields/0, pages:PAGE-2206/fields/4, pages:PAGE-2206/fields/5, pages:PAGE-2207/fields/0, pages:PAGE-2207/fields/15, pages:PAGE-2207/fields/16, pages:PAGE-2207/fields/2, pages:PAGE-2207/fields/3, pages:PAGE-2208/fields/2, pages:PAGE-2208/fields/3, pages:PAGE-2209/fields/0, pages:PAGE-2210/fields/0, pages:PAGE-2211/fields/0, pages:PAGE-2212/fields/0, pages:PAGE-2213/fields/0, pages:PAGE-2214/fields/0, pages:PAGE-2215/fields/0, pages:PAGE-2216/fields/0, pages:PAGE-2217/fields/0, pages:PAGE-2218/fields/0, pages:PAGE-2219/fields/0, pages:PAGE-2220/fields/14, pages:PAGE-2220/fields/7, pages:PAGE-2220/fields/8, pages:PAGE-2221/fields/0, pages:PAGE-2221/fields/2, pages:PAGE-2221/fields/3, pages:PAGE-2222/fields/0, pages:PAGE-2223/fields/35, pages:PAGE-2227/fields/120, pages:PAGE-2227/fields/126, pages:PAGE-2227/fields/127, pages:PAGE-2227/fields/129, pages:PAGE-2227/fields/132, pages:PAGE-2227/fields/133, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/188, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/196, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/212, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/213, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/214, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/215, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/216, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/222, scenarios:FLOW-CURRENT-PLATFORM/steps/16

验证：CHECK-PLAT-LIMITED-FINISH

## 实施任务

- [TASK-006](../tasks/TASK-006.md)
