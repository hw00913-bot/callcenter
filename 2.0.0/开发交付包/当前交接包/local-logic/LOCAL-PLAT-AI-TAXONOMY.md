# LOCAL-PLAT-AI-TAXONOMY 维护标签场景和标签供应商目录

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md) · [全局逻辑](../global-logic.md)

- [进入有权工作位置与保留专业能力 · FUNC\-2002](../features/FUNC-2002.md)

## 职责与触发

所属工程模块：未填写

功能：FUNC-2002

触发：AI标签配置场景/供应商目录查询、创建、编辑、启停或删除

## 前置条件

- 当前AI标签配置权；总部/门店运营无此目录维护/管理页权

## 必须遵守的全局规则

- [GR-IDENTITY](../global-logic.md#GR-IDENTITY)
- [GR-SCOPE](../global-logic.md#GR-SCOPE)
- [GR-AUTH](../global-logic.md#GR-AUTH)
- [GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)
- [GR-LIST-ORDER](../global-logic.md#GR-LIST-ORDER)

## 输入与输出

输入：[FIELD-PLAT-AI-TAG-SCENE](../field-specs.md#FIELD-PLAT-AI-TAG-SCENE)、[FIELD-PLAT-AI-SUPPLIER](../field-specs.md#FIELD-PLAT-AI-SUPPLIER)、[FIELD-PLAT-TAG-SCENE-NAME](../field-specs.md#FIELD-PLAT-TAG-SCENE-NAME)、[FIELD-PLAT-TAG-SCENE-STATE](../field-specs.md#FIELD-PLAT-TAG-SCENE-STATE)、[FIELD-PLAT-TAG-SUPPLIER-NAME](../field-specs.md#FIELD-PLAT-TAG-SUPPLIER-NAME)、[FIELD-PLAT-TAG-SUPPLIER-STATE](../field-specs.md#FIELD-PLAT-TAG-SUPPLIER-STATE)、[FIELD-PLAT-REVISION](../field-specs.md#FIELD-PLAT-REVISION)

输出：[FIELD-PLAT-TAG-SCENE-CODE](../field-specs.md#FIELD-PLAT-TAG-SCENE-CODE)、[FIELD-PLAT-TAG-SCENE-NAME](../field-specs.md#FIELD-PLAT-TAG-SCENE-NAME)、[FIELD-PLAT-TAG-SCENE-STATE](../field-specs.md#FIELD-PLAT-TAG-SCENE-STATE)、[FIELD-PLAT-TAG-SUPPLIER-CODE](../field-specs.md#FIELD-PLAT-TAG-SUPPLIER-CODE)、[FIELD-PLAT-TAG-SUPPLIER-NAME](../field-specs.md#FIELD-PLAT-TAG-SUPPLIER-NAME)、[FIELD-PLAT-TAG-SUPPLIER-STATE](../field-specs.md#FIELD-PLAT-TAG-SUPPLIER-STATE)、[FIELD-PLAT-AUDIT](../field-specs.md#FIELD-PLAT-AUDIT)

## 处理步骤

### LOCAL-PLAT-AI-TAXONOMY-S1

标签场景与具体AI业务场景、业务类型分开；供应商目录与具体场景选择supplier引用分开

读取：FIELD-PLAT-AI-TAG-SCENE, FIELD-PLAT-AI-SUPPLIER, FIELD-PLAT-TAG-SCENE-NAME, FIELD-PLAT-TAG-SCENE-STATE, FIELD-PLAT-TAG-SUPPLIER-NAME, FIELD-PLAT-TAG-SUPPLIER-STATE, FIELD-PLAT-REVISION；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

### LOCAL-PLAT-AI-TAXONOMY-S2

新增非空唯一名称并生成稳定本地编码；编辑不变ID/code，启停不清原池/映射

读取：FIELD-PLAT-AI-TAG-SCENE, FIELD-PLAT-AI-SUPPLIER, FIELD-PLAT-TAG-SCENE-NAME, FIELD-PLAT-TAG-SCENE-STATE, FIELD-PLAT-TAG-SUPPLIER-NAME, FIELD-PLAT-TAG-SUPPLIER-STATE, FIELD-PLAT-REVISION；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

### LOCAL-PLAT-AI-TAXONOMY-S3

删除需原配置引用明确为空；有引用/未知阻止；准确修订成功才更新

读取：FIELD-PLAT-AI-TAG-SCENE, FIELD-PLAT-AI-SUPPLIER, FIELD-PLAT-TAG-SCENE-NAME, FIELD-PLAT-TAG-SCENE-STATE, FIELD-PLAT-TAG-SUPPLIER-NAME, FIELD-PLAT-TAG-SUPPLIER-STATE, FIELD-PLAT-REVISION；写入：FIELD-PLAT-TAG-SCENE-CODE, FIELD-PLAT-TAG-SCENE-NAME, FIELD-PLAT-TAG-SCENE-STATE, FIELD-PLAT-TAG-SUPPLIER-CODE, FIELD-PLAT-TAG-SUPPLIER-NAME, FIELD-PLAT-TAG-SUPPLIER-STATE, FIELD-PLAT-AUDIT

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

## 分支与异常

### LOCAL-PLAT-AI-TAXONOMY-B1

条件：前提、字段及对象修订校验通过且结果明确成功

结果：准确标签场景或供应商目录确认维护，场景使用权不会获得标签维护权

涉及字段：FIELD-PLAT-AI-TAG-SCENE, FIELD-PLAT-AI-SUPPLIER, FIELD-PLAT-TAG-SCENE-NAME, FIELD-PLAT-TAG-SCENE-STATE, FIELD-PLAT-TAG-SUPPLIER-NAME, FIELD-PLAT-TAG-SUPPLIER-STATE, FIELD-PLAT-REVISION, FIELD-PLAT-TAG-SCENE-CODE, FIELD-PLAT-TAG-SUPPLIER-CODE, FIELD-PLAT-AUDIT

验证：CHECK-PLAT-AI-TAXONOMY

### LOCAL-PLAT-AI-TAXONOMY-B2

条件：无权/字段不合法/对象失效/修订冲突

结果：明确显示本次拒绝原因，保留可继续的输入和已确认原值，不作变更

涉及字段：FIELD-PLAT-AI-TAG-SCENE, FIELD-PLAT-AI-SUPPLIER, FIELD-PLAT-TAG-SCENE-NAME, FIELD-PLAT-TAG-SCENE-STATE, FIELD-PLAT-TAG-SUPPLIER-NAME, FIELD-PLAT-TAG-SUPPLIER-STATE, FIELD-PLAT-REVISION, FIELD-PLAT-TAG-SCENE-CODE, FIELD-PLAT-TAG-SUPPLIER-CODE, FIELD-PLAT-AUDIT

验证：CHECK-PLAT-AI-TAXONOMY

### LOCAL-PLAT-AI-TAXONOMY-B3

条件：提交失败或结果未知

结果：失败保留原确认值；未知显示待核并按同请求核对，不重复提交或假报成功

涉及字段：FIELD-PLAT-AI-TAG-SCENE, FIELD-PLAT-AI-SUPPLIER, FIELD-PLAT-TAG-SCENE-NAME, FIELD-PLAT-TAG-SCENE-STATE, FIELD-PLAT-TAG-SUPPLIER-NAME, FIELD-PLAT-TAG-SUPPLIER-STATE, FIELD-PLAT-REVISION, FIELD-PLAT-TAG-SCENE-CODE, FIELD-PLAT-TAG-SUPPLIER-CODE, FIELD-PLAT-AUDIT

验证：CHECK-PLAT-AI-TAXONOMY

## 完成后的状态

- 准确标签场景或供应商目录确认维护，场景使用权不会获得标签维护权

## 字段定义

- [FIELD-PLAT-AI-SUPPLIER](../field-specs.md#FIELD-PLAT-AI-SUPPLIER)
- [FIELD-PLAT-AI-TAG-SCENE](../field-specs.md#FIELD-PLAT-AI-TAG-SCENE)
- [FIELD-PLAT-AUDIT](../field-specs.md#FIELD-PLAT-AUDIT)
- [FIELD-PLAT-REVISION](../field-specs.md#FIELD-PLAT-REVISION)
- [FIELD-PLAT-TAG-SCENE-CODE](../field-specs.md#FIELD-PLAT-TAG-SCENE-CODE)
- [FIELD-PLAT-TAG-SCENE-NAME](../field-specs.md#FIELD-PLAT-TAG-SCENE-NAME)
- [FIELD-PLAT-TAG-SCENE-STATE](../field-specs.md#FIELD-PLAT-TAG-SCENE-STATE)
- [FIELD-PLAT-TAG-SUPPLIER-CODE](../field-specs.md#FIELD-PLAT-TAG-SUPPLIER-CODE)
- [FIELD-PLAT-TAG-SUPPLIER-NAME](../field-specs.md#FIELD-PLAT-TAG-SUPPLIER-NAME)
- [FIELD-PLAT-TAG-SUPPLIER-STATE](../field-specs.md#FIELD-PLAT-TAG-SUPPLIER-STATE)

## 来源与验证

来源条目：acceptance:AC-2046, acceptance:AC-2063, acceptance:AC-2064, features:FUNC-2002, features:FUNC-2002/behavior_spec/90/branches/0, features:FUNC-2002/behavior_spec/90/branches/1, features:FUNC-2002/behavior_spec/90/branches/2, features:FUNC-2002/behavior_spec/90/postconditions/0, features:FUNC-2002/behavior_spec/90/preconditions/0, features:FUNC-2002/behavior_spec/90/steps/0, features:FUNC-2002/behavior_spec/90/steps/1, features:FUNC-2002/behavior_spec/90/steps/2, pages:PAGE-2003/fields/2, pages:PAGE-2003/fields/24, pages:PAGE-2004/fields/0, pages:PAGE-2004/fields/5, pages:PAGE-2005/fields/0, pages:PAGE-2005/fields/9, pages:PAGE-2006/fields/56, pages:PAGE-2006/fields/58, pages:PAGE-2007/fields/1, pages:PAGE-2007/fields/25, pages:PAGE-2103/fields/20, pages:PAGE-2103/fields/3, pages:PAGE-2108/fields/4, pages:PAGE-2109/fields/3, pages:PAGE-2109/fields/9, pages:PAGE-2110/fields/12, pages:PAGE-2110/fields/4, pages:PAGE-2110/fields/7, pages:PAGE-2111, pages:PAGE-2111/actions/0, pages:PAGE-2111/fields/12, pages:PAGE-2111/fields/16, pages:PAGE-2111/fields/17, pages:PAGE-2111/fields/18, pages:PAGE-2111/fields/19, pages:PAGE-2111/fields/20, pages:PAGE-2111/fields/21, pages:PAGE-2111/fields/22, pages:PAGE-2111/fields/5, pages:PAGE-2111/fields/9, pages:PAGE-2112/fields/14, pages:PAGE-2112/fields/6, pages:PAGE-2202/fields/1, pages:PAGE-2202/fields/30, pages:PAGE-2204/fields/71, pages:PAGE-2204/fields/84, pages:PAGE-2205/fields/0, pages:PAGE-2205/fields/17, pages:PAGE-2206/fields/0, pages:PAGE-2206/fields/17, pages:PAGE-2207/fields/0, pages:PAGE-2207/fields/18, pages:PAGE-2210/fields/0, pages:PAGE-2210/fields/8, pages:PAGE-2211/fields/0, pages:PAGE-2211/fields/7, pages:PAGE-2212/fields/0, pages:PAGE-2212/fields/12, pages:PAGE-2213/fields/0, pages:PAGE-2213/fields/28, pages:PAGE-2214/fields/0, pages:PAGE-2215/fields/0, pages:PAGE-2215/fields/9, pages:PAGE-2216/fields/0, pages:PAGE-2216/fields/13, pages:PAGE-2217/fields/0, pages:PAGE-2217/fields/20, pages:PAGE-2218/fields/0, pages:PAGE-2218/fields/8, pages:PAGE-2219/fields/0, pages:PAGE-2219/fields/14, pages:PAGE-2220/fields/20, pages:PAGE-2220/fields/7, pages:PAGE-2221/fields/0, pages:PAGE-2222/fields/0, pages:PAGE-2223/fields/35, pages:PAGE-2223/fields/39, pages:PAGE-2227/fields/120, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/204, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/207, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/246, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/250, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/418, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/419, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/420, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/421, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/422, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/423, scenarios:FLOW-CURRENT-PLATFORM/steps/118

验证：CHECK-PLAT-AI-TAXONOMY

## 实施任务

- [TASK-033](../tasks/TASK-033.md)
