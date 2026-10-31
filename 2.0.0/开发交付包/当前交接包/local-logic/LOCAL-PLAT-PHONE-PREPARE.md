# LOCAL-PLAT-PHONE-PREPARE 本人电话上线、离线及就绪检查

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md) · [全局逻辑](../global-logic.md)

- [进入有权工作位置与保留专业能力 · FUNC\-2002](../features/FUNC-2002.md)

## 职责与触发

所属工程模块：未填写

功能：FUNC-2002

触发：本人在坐席工作台点击上线/下线或置闲

## 前置条件

- 原本人电话操作权；当前Cloud开通/成员有效/唯一准确坐席映射

## 必须遵守的全局规则

- [GR-IDENTITY](../global-logic.md#GR-IDENTITY)
- [GR-SCOPE](../global-logic.md#GR-SCOPE)
- [GR-AUTH](../global-logic.md#GR-AUTH)
- [GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)
- [GR-LIST-ORDER](../global-logic.md#GR-LIST-ORDER)

## 输入与输出

输入：[FIELD-PLAT-SESSION](../field-specs.md#FIELD-PLAT-SESSION)、[FIELD-PLAT-MEMBER-STATE](../field-specs.md#FIELD-PLAT-MEMBER-STATE)、[FIELD-PLAT-MEMBER-GRANTS](../field-specs.md#FIELD-PLAT-MEMBER-GRANTS)、[FIELD-PLAT-MODULES](../field-specs.md#FIELD-PLAT-MODULES)、[FIELD-PLAT-SEAT-ID](../field-specs.md#FIELD-PLAT-SEAT-ID)、[FIELD-PLAT-SEAT-ACCOUNT](../field-specs.md#FIELD-PLAT-SEAT-ACCOUNT)、[FIELD-PLAT-SEAT-EXTENSION](../field-specs.md#FIELD-PLAT-SEAT-EXTENSION)、[FIELD-PLAT-PHONE-STATE](../field-specs.md#FIELD-PLAT-PHONE-STATE)

输出：[FIELD-PLAT-PHONE-STATE](../field-specs.md#FIELD-PLAT-PHONE-STATE)、[FIELD-PLAT-SEAT-EVENT](../field-specs.md#FIELD-PLAT-SEAT-EVENT)

## 处理步骤

### LOCAL-PLAT-PHONE-PREPARE-S1

上线前检查本人坐席未停用/删除、分机唯一可用和执行能力

读取：FIELD-PLAT-SESSION, FIELD-PLAT-MEMBER-STATE, FIELD-PLAT-MEMBER-GRANTS, FIELD-PLAT-MODULES, FIELD-PLAT-SEAT-ID, FIELD-PLAT-SEAT-ACCOUNT, FIELD-PLAT-SEAT-EXTENSION, FIELD-PLAT-PHONE-STATE；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

### LOCAL-PLAT-PHONE-PREPARE-S2

下线先检查拨号/振铃/通话/必要话后；未知需核对

读取：FIELD-PLAT-SESSION, FIELD-PLAT-MEMBER-STATE, FIELD-PLAT-MEMBER-GRANTS, FIELD-PLAT-MODULES, FIELD-PLAT-SEAT-ID, FIELD-PLAT-SEAT-ACCOUNT, FIELD-PLAT-SEAT-EXTENSION, FIELD-PLAT-PHONE-STATE；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

### LOCAL-PLAT-PHONE-PREPARE-S3

按准确电话事件确认状态；失败不伪装离线/就绪

读取：FIELD-PLAT-SESSION, FIELD-PLAT-MEMBER-STATE, FIELD-PLAT-MEMBER-GRANTS, FIELD-PLAT-MODULES, FIELD-PLAT-SEAT-ID, FIELD-PLAT-SEAT-ACCOUNT, FIELD-PLAT-SEAT-EXTENSION, FIELD-PLAT-PHONE-STATE；写入：FIELD-PLAT-PHONE-STATE, FIELD-PLAT-SEAT-EVENT

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

## 分支与异常

### LOCAL-PLAT-PHONE-PREPARE-B1

条件：前提、字段及对象修订校验通过且结果明确成功

结果：本人电话状态可确认；管理者无坐席仍可访问合法配置/监管/只读

涉及字段：FIELD-PLAT-SESSION, FIELD-PLAT-MEMBER-STATE, FIELD-PLAT-MEMBER-GRANTS, FIELD-PLAT-MODULES, FIELD-PLAT-SEAT-ID, FIELD-PLAT-SEAT-ACCOUNT, FIELD-PLAT-SEAT-EXTENSION, FIELD-PLAT-PHONE-STATE, FIELD-PLAT-SEAT-EVENT

验证：CHECK-PLAT-PHONE-PREPARE

### LOCAL-PLAT-PHONE-PREPARE-B2

条件：无权/字段不合法/对象失效/修订冲突

结果：明确显示本次拒绝原因，保留可继续的输入和已确认原值，不作变更

涉及字段：FIELD-PLAT-SESSION, FIELD-PLAT-MEMBER-STATE, FIELD-PLAT-MEMBER-GRANTS, FIELD-PLAT-MODULES, FIELD-PLAT-SEAT-ID, FIELD-PLAT-SEAT-ACCOUNT, FIELD-PLAT-SEAT-EXTENSION, FIELD-PLAT-PHONE-STATE, FIELD-PLAT-SEAT-EVENT

验证：CHECK-PLAT-PHONE-PREPARE

### LOCAL-PLAT-PHONE-PREPARE-B3

条件：提交失败或结果未知

结果：失败保留原确认值；未知显示待核并按同请求核对，不重复提交或假报成功

涉及字段：FIELD-PLAT-SESSION, FIELD-PLAT-MEMBER-STATE, FIELD-PLAT-MEMBER-GRANTS, FIELD-PLAT-MODULES, FIELD-PLAT-SEAT-ID, FIELD-PLAT-SEAT-ACCOUNT, FIELD-PLAT-SEAT-EXTENSION, FIELD-PLAT-PHONE-STATE, FIELD-PLAT-SEAT-EVENT

验证：CHECK-PLAT-PHONE-PREPARE

## 完成后的状态

- 本人电话状态可确认；管理者无坐席仍可访问合法配置/监管/只读

## 字段定义

- [FIELD-PLAT-MEMBER-GRANTS](../field-specs.md#FIELD-PLAT-MEMBER-GRANTS)
- [FIELD-PLAT-MEMBER-STATE](../field-specs.md#FIELD-PLAT-MEMBER-STATE)
- [FIELD-PLAT-MODULES](../field-specs.md#FIELD-PLAT-MODULES)
- [FIELD-PLAT-PHONE-STATE](../field-specs.md#FIELD-PLAT-PHONE-STATE)
- [FIELD-PLAT-SEAT-ACCOUNT](../field-specs.md#FIELD-PLAT-SEAT-ACCOUNT)
- [FIELD-PLAT-SEAT-EVENT](../field-specs.md#FIELD-PLAT-SEAT-EVENT)
- [FIELD-PLAT-SEAT-EXTENSION](../field-specs.md#FIELD-PLAT-SEAT-EXTENSION)
- [FIELD-PLAT-SEAT-ID](../field-specs.md#FIELD-PLAT-SEAT-ID)
- [FIELD-PLAT-SESSION](../field-specs.md#FIELD-PLAT-SESSION)

## 来源与验证

来源条目：acceptance:AC-2012, acceptance:AC-2015, acceptance:AC-2066, acceptance:AC-2067, acceptance:AC-2072, features:FUNC-2002, features:FUNC-2002/behavior_spec/25/branches/0, features:FUNC-2002/behavior_spec/25/branches/1, features:FUNC-2002/behavior_spec/25/branches/2, features:FUNC-2002/behavior_spec/25/postconditions/0, features:FUNC-2002/behavior_spec/25/preconditions/0, features:FUNC-2002/behavior_spec/25/steps/0, features:FUNC-2002/behavior_spec/25/steps/1, features:FUNC-2002/behavior_spec/25/steps/2, pages:PAGE-2001/fields/5, pages:PAGE-2002/fields/5, pages:PAGE-2003/fields/12, pages:PAGE-2003/fields/15, pages:PAGE-2003/fields/25, pages:PAGE-2003/fields/26, pages:PAGE-2003/fields/9, pages:PAGE-2004/fields/1, pages:PAGE-2005/fields/10, pages:PAGE-2005/fields/4, pages:PAGE-2106/fields/14, pages:PAGE-2112/fields/27, pages:PAGE-2202, pages:PAGE-2202/actions/0, pages:PAGE-2202/fields/18, pages:PAGE-2202/fields/19, pages:PAGE-2202/fields/20, pages:PAGE-2202/fields/23, pages:PAGE-2202/fields/31, pages:PAGE-2202/fields/32, pages:PAGE-2202/fields/33, pages:PAGE-2202/fields/34, pages:PAGE-2202/fields/35, pages:PAGE-2207/fields/15, pages:PAGE-2210/fields/13, pages:PAGE-2210/fields/14, pages:PAGE-2210/fields/9, pages:PAGE-2211/fields/8, pages:PAGE-2214/fields/9, pages:PAGE-2225/fields/3, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/167, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/182, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/194, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/195, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/222, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/266, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/270, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/271, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/308, scenarios:FLOW-CURRENT-PLATFORM/steps/52

验证：CHECK-PLAT-PHONE-PREPARE

## 实施任务

- [TASK-042](../tasks/TASK-042.md)
