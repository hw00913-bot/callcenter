# LOCAL-PLAT-BAN-AI 人工确认AI明确拒联后入库

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md) · [全局逻辑](../global-logic.md)

- [人工确认AI明确拒联并入库 · FUNC\-2023](../features/FUNC-2023.md)

## 职责与触发

所属工程模块：未填写

功能：FUNC-2023

触发：有权租户人员在准确AI通话上明确确认拒联并提交

## 前置条件

- 本租户管理员或明确有拒联新增权运营；超管只读不可提交
- 能够读取准确来源通话

## 必须遵守的全局规则

- [GR-IDENTITY](../global-logic.md#GR-IDENTITY)
- [GR-SCOPE](../global-logic.md#GR-SCOPE)
- [GR-AUTH](../global-logic.md#GR-AUTH)
- [GR-SERIAL](../global-logic.md#GR-SERIAL)
- [GR-CONTACT](../global-logic.md#GR-CONTACT)
- [GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)

## 输入与输出

输入：[FIELD-PLAT-CALL-ID](../field-specs.md#FIELD-PLAT-CALL-ID)、[FIELD-PLAT-AI-TAG-RESULT](../field-specs.md#FIELD-PLAT-AI-TAG-RESULT)、[FIELD-PLAT-BAN-PHONE](../field-specs.md#FIELD-PLAT-BAN-PHONE)、[FIELD-PLAT-BAN-REASON](../field-specs.md#FIELD-PLAT-BAN-REASON)、[FIELD-PLAT-REQUEST](../field-specs.md#FIELD-PLAT-REQUEST)

输出：[FIELD-PLAT-BAN-ID](../field-specs.md#FIELD-PLAT-BAN-ID)、[FIELD-PLAT-BAN-SOURCE](../field-specs.md#FIELD-PLAT-BAN-SOURCE)、[FIELD-PLAT-BAN-LIFETIME](../field-specs.md#FIELD-PLAT-BAN-LIFETIME)、[FIELD-PLAT-BAN-STATE](../field-specs.md#FIELD-PLAT-BAN-STATE)、[FIELD-PLAT-AUDIT](../field-specs.md#FIELD-PLAT-AUDIT)

## 处理步骤

### LOCAL-PLAT-BAN-AI-S1

AI通话原列表每行仅保详情，不追加逐行确认拒联。原准确详情保录音/文本及有权原来源人工确认入口，准确通话、租户、供应商、联系号码和原权限再次校验；不按标签/状态自动拒联，不新增待审队列，不扩大解除权。 展示准确通话、原始结果和来源，要求人工明确确认而非自动按标签判拒联

读取：FIELD-PLAT-CALL-ID, FIELD-PLAT-AI-TAG-RESULT, FIELD-PLAT-BAN-PHONE, FIELD-PLAT-BAN-REASON, FIELD-PLAT-REQUEST；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-SERIAL, GR-CONTACT, GR-UNKNOWN

### LOCAL-PLAT-BAN-AI-S2

无意向/拒接/挂机/混合等级/供应商拦截均不能代替明确拒联证据

读取：FIELD-PLAT-CALL-ID, FIELD-PLAT-AI-TAG-RESULT, FIELD-PLAT-BAN-PHONE, FIELD-PLAT-BAN-REASON, FIELD-PLAT-REQUEST；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-SERIAL, GR-CONTACT, GR-UNKNOWN

### LOCAL-PLAT-BAN-AI-S3

以来源请求幂等保存长期拒联，新增权不包含解除权

读取：FIELD-PLAT-CALL-ID, FIELD-PLAT-AI-TAG-RESULT, FIELD-PLAT-BAN-PHONE, FIELD-PLAT-BAN-REASON, FIELD-PLAT-REQUEST；写入：FIELD-PLAT-BAN-ID, FIELD-PLAT-BAN-SOURCE, FIELD-PLAT-BAN-LIFETIME, FIELD-PLAT-BAN-STATE, FIELD-PLAT-AUDIT

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-SERIAL, GR-CONTACT, GR-UNKNOWN

## 分支与异常

### LOCAL-PLAT-BAN-AI-B1

条件：前提、字段及对象修订校验通过且结果明确成功

结果：准确人工确认的AI拒联来源入库；不因AI标签自动入库

涉及字段：FIELD-PLAT-CALL-ID, FIELD-PLAT-AI-TAG-RESULT, FIELD-PLAT-BAN-PHONE, FIELD-PLAT-BAN-REASON, FIELD-PLAT-REQUEST, FIELD-PLAT-BAN-ID, FIELD-PLAT-BAN-SOURCE, FIELD-PLAT-BAN-LIFETIME, FIELD-PLAT-BAN-STATE, FIELD-PLAT-AUDIT

验证：CHECK-PLAT-BAN-AI

### LOCAL-PLAT-BAN-AI-B2

条件：无权/字段不合法/对象失效/修订冲突

结果：明确显示本次拒绝原因，保留可继续的输入和已确认原值，不作变更

涉及字段：FIELD-PLAT-CALL-ID, FIELD-PLAT-AI-TAG-RESULT, FIELD-PLAT-BAN-PHONE, FIELD-PLAT-BAN-REASON, FIELD-PLAT-REQUEST, FIELD-PLAT-BAN-ID, FIELD-PLAT-BAN-SOURCE, FIELD-PLAT-BAN-LIFETIME, FIELD-PLAT-BAN-STATE, FIELD-PLAT-AUDIT

验证：CHECK-PLAT-BAN-AI

### LOCAL-PLAT-BAN-AI-B3

条件：提交失败或结果未知

结果：失败保留原确认值；未知显示待核并按同请求核对，不重复提交或假报成功

涉及字段：FIELD-PLAT-CALL-ID, FIELD-PLAT-AI-TAG-RESULT, FIELD-PLAT-BAN-PHONE, FIELD-PLAT-BAN-REASON, FIELD-PLAT-REQUEST, FIELD-PLAT-BAN-ID, FIELD-PLAT-BAN-SOURCE, FIELD-PLAT-BAN-LIFETIME, FIELD-PLAT-BAN-STATE, FIELD-PLAT-AUDIT

验证：CHECK-PLAT-BAN-AI

## 完成后的状态

- 准确人工确认的AI拒联来源入库；不因AI标签自动入库

## 字段定义

- [FIELD-PLAT-AI-TAG-RESULT](../field-specs.md#FIELD-PLAT-AI-TAG-RESULT)
- [FIELD-PLAT-AUDIT](../field-specs.md#FIELD-PLAT-AUDIT)
- [FIELD-PLAT-BAN-ID](../field-specs.md#FIELD-PLAT-BAN-ID)
- [FIELD-PLAT-BAN-LIFETIME](../field-specs.md#FIELD-PLAT-BAN-LIFETIME)
- [FIELD-PLAT-BAN-PHONE](../field-specs.md#FIELD-PLAT-BAN-PHONE)
- [FIELD-PLAT-BAN-REASON](../field-specs.md#FIELD-PLAT-BAN-REASON)
- [FIELD-PLAT-BAN-SOURCE](../field-specs.md#FIELD-PLAT-BAN-SOURCE)
- [FIELD-PLAT-BAN-STATE](../field-specs.md#FIELD-PLAT-BAN-STATE)
- [FIELD-PLAT-CALL-ID](../field-specs.md#FIELD-PLAT-CALL-ID)
- [FIELD-PLAT-REQUEST](../field-specs.md#FIELD-PLAT-REQUEST)

## 来源与验证

来源条目：acceptance:AC-2054, acceptance:AC-2055, acceptance:AC-2056, features:FUNC-2023, features:FUNC-2023/behavior_spec/0/branches/0, features:FUNC-2023/behavior_spec/0/branches/1, features:FUNC-2023/behavior_spec/0/branches/2, features:FUNC-2023/behavior_spec/0/postconditions/0, features:FUNC-2023/behavior_spec/0/preconditions/0, features:FUNC-2023/behavior_spec/0/preconditions/1, features:FUNC-2023/behavior_spec/0/steps/0, features:FUNC-2023/behavior_spec/0/steps/1, features:FUNC-2023/behavior_spec/0/steps/2, pages:PAGE-2003/fields/2, pages:PAGE-2003/fields/22, pages:PAGE-2004/fields/0, pages:PAGE-2004/fields/4, pages:PAGE-2005/fields/0, pages:PAGE-2005/fields/8, pages:PAGE-2006/fields/56, pages:PAGE-2007, pages:PAGE-2007/actions/1, pages:PAGE-2007/fields/0, pages:PAGE-2007/fields/1, pages:PAGE-2007/fields/10, pages:PAGE-2007/fields/12, pages:PAGE-2007/fields/13, pages:PAGE-2007/fields/16, pages:PAGE-2007/fields/17, pages:PAGE-2007/fields/18, pages:PAGE-2007/fields/24, pages:PAGE-2007/fields/9, pages:PAGE-2103/fields/19, pages:PAGE-2103/fields/3, pages:PAGE-2103/fields/4, pages:PAGE-2103/fields/5, pages:PAGE-2103/fields/6, pages:PAGE-2108, pages:PAGE-2108/actions/1, pages:PAGE-2108/fields/10, pages:PAGE-2108/fields/12, pages:PAGE-2108/fields/18, pages:PAGE-2108/fields/3, pages:PAGE-2108/fields/4, pages:PAGE-2108/fields/5, pages:PAGE-2108/fields/6, pages:PAGE-2108/fields/7, pages:PAGE-2108/fields/8, pages:PAGE-2108/fields/9, pages:PAGE-2109/fields/1, pages:PAGE-2109/fields/3, pages:PAGE-2109/fields/4, pages:PAGE-2110/fields/7, pages:PAGE-2111/fields/12, pages:PAGE-2111/fields/13, pages:PAGE-2111/fields/8, pages:PAGE-2112/fields/13, pages:PAGE-2112/fields/6, pages:PAGE-2202/fields/1, pages:PAGE-2202/fields/2, pages:PAGE-2202/fields/28, pages:PAGE-2202/fields/3, pages:PAGE-2202/fields/4, pages:PAGE-2202/fields/5, pages:PAGE-2202/fields/7, pages:PAGE-2203/fields/55, pages:PAGE-2204/fields/71, pages:PAGE-2204/fields/72, pages:PAGE-2204/fields/82, pages:PAGE-2205/fields/0, pages:PAGE-2205/fields/1, pages:PAGE-2205/fields/15, pages:PAGE-2205/fields/2, pages:PAGE-2205/fields/3, pages:PAGE-2205/fields/4, pages:PAGE-2206/fields/0, pages:PAGE-2206/fields/1, pages:PAGE-2206/fields/15, pages:PAGE-2206/fields/2, pages:PAGE-2206/fields/3, pages:PAGE-2206/fields/4, pages:PAGE-2207/fields/0, pages:PAGE-2207/fields/17, pages:PAGE-2207/fields/2, pages:PAGE-2208/fields/0, pages:PAGE-2208/fields/2, pages:PAGE-2209/fields/0, pages:PAGE-2210/fields/0, pages:PAGE-2210/fields/5, pages:PAGE-2211/fields/0, pages:PAGE-2211/fields/4, pages:PAGE-2212/fields/0, pages:PAGE-2212/fields/9, pages:PAGE-2213/fields/0, pages:PAGE-2213/fields/25, pages:PAGE-2214/fields/0, pages:PAGE-2214/fields/4, pages:PAGE-2215/fields/0, pages:PAGE-2215/fields/6, pages:PAGE-2216/fields/0, pages:PAGE-2216/fields/10, pages:PAGE-2217/fields/0, pages:PAGE-2217/fields/17, pages:PAGE-2218/fields/0, pages:PAGE-2218/fields/5, pages:PAGE-2219/fields/0, pages:PAGE-2219/fields/11, pages:PAGE-2220/fields/17, pages:PAGE-2220/fields/7, pages:PAGE-2220/fields/8, pages:PAGE-2221/fields/0, pages:PAGE-2221/fields/2, pages:PAGE-2221/fields/6, pages:PAGE-2222/fields/0, pages:PAGE-2223/fields/35, pages:PAGE-2227/fields/119, pages:PAGE-2227/fields/120, pages:PAGE-2227/fields/121, pages:PAGE-2227/fields/122, pages:PAGE-2227/fields/123, pages:PAGE-2227/fields/124, pages:PAGE-2227/fields/126, pages:PAGE-2227/fields/136, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/200, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/202, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/229, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/250, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/257, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/258, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/261, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/262, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/263, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/264, scenarios:FLOW-CURRENT-PLATFORM/steps/43

验证：CHECK-PLAT-BAN-AI

## 实施任务

- [TASK-039](../tasks/TASK-039.md)
