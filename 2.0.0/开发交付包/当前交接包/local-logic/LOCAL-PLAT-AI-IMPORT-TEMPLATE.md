# LOCAL-PLAT-AI-IMPORT-TEMPLATE 下载具体AI任务导入模板

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md) · [全局逻辑](../global-logic.md)

- [进入有权工作位置与保留专业能力 · FUNC\-2002](../features/FUNC-2002.md)

## 职责与触发

所属工程模块：未填写

功能：FUNC-2002

触发：AI任务导入弹层点击原下载模板

## 前置条件

- 当前准确AI任务/场景读取及导入资格

## 必须遵守的全局规则

- [GR-IDENTITY](../global-logic.md#GR-IDENTITY)
- [GR-SCOPE](../global-logic.md#GR-SCOPE)
- [GR-AUTH](../global-logic.md#GR-AUTH)
- [GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)
- [GR-LIST-ORDER](../global-logic.md#GR-LIST-ORDER)

## 输入与输出

输入：[FIELD-PLAT-TASK-ID](../field-specs.md#FIELD-PLAT-TASK-ID)、[FIELD-PLAT-AI-SCENE-ID](../field-specs.md#FIELD-PLAT-AI-SCENE-ID)、[FIELD-PLAT-PRO-FIELD-DEF](../field-specs.md#FIELD-PLAT-PRO-FIELD-DEF)

输出：[FIELD-PLAT-REPORT-EXPORT](../field-specs.md#FIELD-PLAT-REPORT-EXPORT)

## 处理步骤

### LOCAL-PLAT-AI-IMPORT-TEMPLATE-S1

取当前场景允许字段/必需项形成准确表头模板

读取：FIELD-PLAT-TASK-ID, FIELD-PLAT-AI-SCENE-ID, FIELD-PLAT-PRO-FIELD-DEF；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

### LOCAL-PLAT-AI-IMPORT-TEMPLATE-S2

无当前定义/无权/生成失败不给空白假模板；下载不执行导入

读取：FIELD-PLAT-TASK-ID, FIELD-PLAT-AI-SCENE-ID, FIELD-PLAT-PRO-FIELD-DEF；写入：FIELD-PLAT-REPORT-EXPORT

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

## 分支与异常

### LOCAL-PLAT-AI-IMPORT-TEMPLATE-B1

条件：前提、字段及对象修订校验通过且结果明确成功

结果：该具体场景导入模板可下载，不把其他AI导出仅有界面但未实现当可用

涉及字段：FIELD-PLAT-TASK-ID, FIELD-PLAT-AI-SCENE-ID, FIELD-PLAT-PRO-FIELD-DEF, FIELD-PLAT-REPORT-EXPORT

验证：CHECK-PLAT-AI-IMPORT-TEMPLATE

### LOCAL-PLAT-AI-IMPORT-TEMPLATE-B2

条件：无权/字段不合法/对象失效/修订冲突

结果：明确显示本次拒绝原因，保留可继续的输入和已确认原值，不作变更

涉及字段：FIELD-PLAT-TASK-ID, FIELD-PLAT-AI-SCENE-ID, FIELD-PLAT-PRO-FIELD-DEF, FIELD-PLAT-REPORT-EXPORT

验证：CHECK-PLAT-AI-IMPORT-TEMPLATE

### LOCAL-PLAT-AI-IMPORT-TEMPLATE-B3

条件：提交失败或结果未知

结果：失败保留原确认值；未知显示待核并按同请求核对，不重复提交或假报成功

涉及字段：FIELD-PLAT-TASK-ID, FIELD-PLAT-AI-SCENE-ID, FIELD-PLAT-PRO-FIELD-DEF, FIELD-PLAT-REPORT-EXPORT

验证：CHECK-PLAT-AI-IMPORT-TEMPLATE

## 完成后的状态

- 该具体场景导入模板可下载，不把其他AI导出仅有界面但未实现当可用

## 字段定义

- [FIELD-PLAT-AI-SCENE-ID](../field-specs.md#FIELD-PLAT-AI-SCENE-ID)
- [FIELD-PLAT-PRO-FIELD-DEF](../field-specs.md#FIELD-PLAT-PRO-FIELD-DEF)
- [FIELD-PLAT-REPORT-EXPORT](../field-specs.md#FIELD-PLAT-REPORT-EXPORT)
- [FIELD-PLAT-TASK-ID](../field-specs.md#FIELD-PLAT-TASK-ID)

## 来源与验证

来源条目：acceptance:AC-2063, acceptance:AC-2064, features:FUNC-2002, features:FUNC-2002/behavior_spec/88/branches/0, features:FUNC-2002/behavior_spec/88/branches/1, features:FUNC-2002/behavior_spec/88/branches/2, features:FUNC-2002/behavior_spec/88/postconditions/0, features:FUNC-2002/behavior_spec/88/preconditions/0, features:FUNC-2002/behavior_spec/88/steps/0, features:FUNC-2002/behavior_spec/88/steps/1, pages:PAGE-2103, pages:PAGE-2103/actions/1, pages:PAGE-2103/fields/1, pages:PAGE-2103/fields/16, pages:PAGE-2103/fields/18, pages:PAGE-2103/fields/21, pages:PAGE-2108/fields/1, pages:PAGE-2110/fields/2, pages:PAGE-2111/fields/3, pages:PAGE-2204/fields/79, pages:PAGE-2205/fields/14, pages:PAGE-2205/fields/35, pages:PAGE-2206/fields/14, pages:PAGE-2206/fields/35, pages:PAGE-2208/fields/8, pages:PAGE-2209/fields/5, pages:PAGE-2209/fields/8, pages:PAGE-2222/fields/3, pages:PAGE-2223/fields/36, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/199, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/225, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/300, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/306, scenarios:FLOW-CURRENT-PLATFORM/steps/116

验证：CHECK-PLAT-AI-IMPORT-TEMPLATE

## 实施任务

- [TASK-034](../tasks/TASK-034.md)
