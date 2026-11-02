# LOCAL-PLAT-AI-IMPORT-TEMPLATE 下载具体AI任务导入模板

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md) · [全局逻辑](../global-logic.md)

- [进入有权工作位置与保留专业能力 · FUNC\-2002](../features/FUNC-2002.md)

## 职责与触发

所属工程模块：未填写

功能：FUNC-2002

触发：AI任务导入弹层点击原下载模板

## 前置条件

- 当前准确AI任务/场景读取及原导入资格，分类/供应商映射可可靠取得

## 必须遵守的全局规则

- [GR-IDENTITY](../global-logic.md#GR-IDENTITY)
- [GR-SCOPE](../global-logic.md#GR-SCOPE)
- [GR-AUTH](../global-logic.md#GR-AUTH)
- [GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)
- [GR-LIST-ORDER](../global-logic.md#GR-LIST-ORDER)
- [GR-TASK-UNIFIED-IMPORT](../global-logic.md#GR-TASK-UNIFIED-IMPORT)

## 输入与输出

输入：[FIELD-PLAT-TASK-ID](../field-specs.md#FIELD-PLAT-TASK-ID)、[FIELD-PLAT-AI-SCENE-ID](../field-specs.md#FIELD-PLAT-AI-SCENE-ID)、[FIELD-PLAT-PRO-FIELD-DEF](../field-specs.md#FIELD-PLAT-PRO-FIELD-DEF)、[FIELD-PLAT-AI-IMPORT-MAPPING-CATEGORY](../field-specs.md#FIELD-PLAT-AI-IMPORT-MAPPING-CATEGORY)、[FIELD-PLAT-AI-IMPORT-FIELD-MAPPINGS](../field-specs.md#FIELD-PLAT-AI-IMPORT-FIELD-MAPPINGS)、[FIELD-FLOW-CATEGORY-IMPORT-REFS](../field-specs.md#FIELD-FLOW-CATEGORY-IMPORT-REFS)

输出：[FIELD-PLAT-REPORT-EXPORT](../field-specs.md#FIELD-PLAT-REPORT-EXPORT)

## 处理步骤

### LOCAL-PLAT-AI-IMPORT-TEMPLATE-S1

先确定实际呼叫方式、条件首路径和必要AI场景，再生成本次schema：系统业务编码/客户称呼/客户号码必需；TEMPLATE保留本次IMPORT条件分流字段，其余只取该scene/platform实际IMPORT_FIELD引用及CUSTOM_COLUMN专属列，未引用的分类额外必填不阻AI导入。非AI仍按实际分类IMPORT。FOLLOWUP不混入；下载CSV/XLSX、列映射、逐行校验、参数生成与规范值/定义快照使用同一准确schema。场景/字段/资料/目标变化失效旧预检。 任务配置保存准确业务分类；AI从准确场景取得分类和供应商映射，PRED从任务配置取得分类。导入自动带入并锁定，不在导入时临时重选或按名称/首项猜。顶部入口只选择目标任务，随即同窗展示相同导入表。缺失、冲突、失效关联到任务/场景配置维护。MANUAL任务仅手工上传/粘贴，AUTO/API仅只读接收字段与要求；本地静态演示不提供真实接口上传或假造API结果。

读取：FIELD-PLAT-TASK-ID, FIELD-PLAT-AI-SCENE-ID, FIELD-PLAT-PRO-FIELD-DEF；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

### LOCAL-PLAT-AI-IMPORT-TEMPLATE-S2

schema1/legacy只读兼容、schema2按本场景准确映射；无准确平台/分类/定义或供应商必需参数待核时不给假空模板。下载本身不导入、不改分类或升级场景；实际下载落地验收仍单列未验。

读取：FIELD-PLAT-TASK-ID, FIELD-PLAT-AI-SCENE-ID, FIELD-PLAT-PRO-FIELD-DEF, FIELD-PLAT-AI-IMPORT-MAPPING-CATEGORY, FIELD-PLAT-AI-IMPORT-FIELD-MAPPINGS, FIELD-FLOW-CATEGORY-IMPORT-REFS；写入：FIELD-PLAT-REPORT-EXPORT

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER, GR-TASK-UNIFIED-IMPORT

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

- [FIELD-PLAT-TASK-ID](../field-specs.md#FIELD-PLAT-TASK-ID)
- [FIELD-PLAT-AI-SCENE-ID](../field-specs.md#FIELD-PLAT-AI-SCENE-ID)
- [FIELD-PLAT-PRO-FIELD-DEF](../field-specs.md#FIELD-PLAT-PRO-FIELD-DEF)
- [FIELD-PLAT-AI-IMPORT-MAPPING-CATEGORY](../field-specs.md#FIELD-PLAT-AI-IMPORT-MAPPING-CATEGORY)
- [FIELD-PLAT-AI-IMPORT-FIELD-MAPPINGS](../field-specs.md#FIELD-PLAT-AI-IMPORT-FIELD-MAPPINGS)
- [FIELD-FLOW-CATEGORY-IMPORT-REFS](../field-specs.md#FIELD-FLOW-CATEGORY-IMPORT-REFS)
- [FIELD-PLAT-REPORT-EXPORT](../field-specs.md#FIELD-PLAT-REPORT-EXPORT)

## 来源与验证

来源条目：acceptance:AC-2063, acceptance:AC-2064, features:FUNC-2002, features:FUNC-2002/behavior_spec/88/branches/0, features:FUNC-2002/behavior_spec/88/branches/1, features:FUNC-2002/behavior_spec/88/branches/2, features:FUNC-2002/behavior_spec/88/postconditions/0, features:FUNC-2002/behavior_spec/88/preconditions/0, features:FUNC-2002/behavior_spec/88/steps/0, features:FUNC-2002/behavior_spec/88/steps/1, pages:PAGE-2006/fields/6, pages:PAGE-2103, pages:PAGE-2103/actions/1, pages:PAGE-2103/fields/1, pages:PAGE-2103/fields/16, pages:PAGE-2103/fields/18, pages:PAGE-2103/fields/21, pages:PAGE-2103/fields/26, pages:PAGE-2103/fields/27, pages:PAGE-2108/fields/1, pages:PAGE-2110/fields/13, pages:PAGE-2110/fields/14, pages:PAGE-2110/fields/15, pages:PAGE-2110/fields/2, pages:PAGE-2111/fields/3, pages:PAGE-2204/fields/11, pages:PAGE-2204/fields/79, pages:PAGE-2205/fields/14, pages:PAGE-2205/fields/35, pages:PAGE-2205/fields/59, pages:PAGE-2206/fields/14, pages:PAGE-2206/fields/35, pages:PAGE-2208/fields/8, pages:PAGE-2209/fields/5, pages:PAGE-2209/fields/8, pages:PAGE-2222/fields/3, pages:PAGE-2223/fields/36, pages:PAGE-2223/fields/5, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/21, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/218, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/244, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/319, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/325, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/424, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/425, scenarios:FLOW-CURRENT-PLATFORM/steps/116

验证：CHECK-PLAT-AI-IMPORT-TEMPLATE

## 实施任务

- [TASK-034](../tasks/TASK-034.md)
