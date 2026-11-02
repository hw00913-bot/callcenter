# LOCAL-PLAT-AI-SCENE-SAVE 弹窗配置并保存AI场景的供应商参数与导入列

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md) · [全局逻辑](../global-logic.md)

- [进入有权工作位置与保留专业能力 · FUNC\-2002](../features/FUNC-2002.md)
- [为具体AI执行场景维护业务分类引用 · FUNC\-2019](../features/FUNC-2019.md)

## 职责与触发

所属工程模块：未填写

功能：FUNC-2002, FUNC-2019

触发：有AI专业配置权者保存场景或类型

## 前置条件

- 准确租户/供应商专业配置权

## 必须遵守的全局规则

- [GR-IDENTITY](../global-logic.md#GR-IDENTITY)
- [GR-SCOPE](../global-logic.md#GR-SCOPE)
- [GR-AUTH](../global-logic.md#GR-AUTH)
- [GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)
- [GR-LIST-ORDER](../global-logic.md#GR-LIST-ORDER)
- [GR-TASK-UNIFIED-IMPORT](../global-logic.md#GR-TASK-UNIFIED-IMPORT)

## 输入与输出

输入：[FIELD-PLAT-AI-SCENE-ID](../field-specs.md#FIELD-PLAT-AI-SCENE-ID)、[FIELD-PLAT-AI-SCENE-NAME](../field-specs.md#FIELD-PLAT-AI-SCENE-NAME)、[FIELD-PLAT-AI-TYPE](../field-specs.md#FIELD-PLAT-AI-TYPE)、[FIELD-PLAT-AI-SUPPLIER](../field-specs.md#FIELD-PLAT-AI-SUPPLIER)、[FIELD-PLAT-AI-PARAMS](../field-specs.md#FIELD-PLAT-AI-PARAMS)、[FIELD-PLAT-AI-CATEGORY](../field-specs.md#FIELD-PLAT-AI-CATEGORY)、[FIELD-PLAT-REVISION](../field-specs.md#FIELD-PLAT-REVISION)、[FIELD-PLAT-AI-IMPORT-MAPPING-CATEGORY](../field-specs.md#FIELD-PLAT-AI-IMPORT-MAPPING-CATEGORY)、[FIELD-PLAT-AI-IMPORT-FIELD-MAPPINGS](../field-specs.md#FIELD-PLAT-AI-IMPORT-FIELD-MAPPINGS)、[FIELD-FLOW-CATEGORY-IMPORT-REFS](../field-specs.md#FIELD-FLOW-CATEGORY-IMPORT-REFS)

输出：[FIELD-PLAT-AI-SCENE-ID](../field-specs.md#FIELD-PLAT-AI-SCENE-ID)、[FIELD-PLAT-AI-PARAMS](../field-specs.md#FIELD-PLAT-AI-PARAMS)、[FIELD-PLAT-AUDIT](../field-specs.md#FIELD-PLAT-AUDIT)、[FIELD-PLAT-AI-IMPORT-MAPPING-CATEGORY](../field-specs.md#FIELD-PLAT-AI-IMPORT-MAPPING-CATEGORY)、[FIELD-PLAT-AI-IMPORT-FIELD-MAPPINGS](../field-specs.md#FIELD-PLAT-AI-IMPORT-FIELD-MAPPINGS)

## 处理步骤

### LOCAL-PLAT-AI-SCENE-SAVE-S1

新建/修改分开校验原必填、准确scene/platform及AI专业配置权；主场景保留原字段表、已配置摘要与唯一新增入口“添加字段”，不单页展开全部业务候选和新增参数编辑面板，不保两个主新增入口或大面板；已配置项的原配置/移除继续

读取：FIELD-PLAT-AI-SCENE-ID, FIELD-PLAT-AI-SCENE-NAME, FIELD-PLAT-AI-TYPE, FIELD-PLAT-AI-SUPPLIER, FIELD-PLAT-AI-PARAMS, FIELD-PLAT-AI-CATEGORY, FIELD-PLAT-REVISION；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

### LOCAL-PLAT-AI-SCENE-SAVE-S2

点击“添加字段”后才打开来源选择，二选一“选择导入字段”/“手工添加供应商字段”；导入字段进入原选择与下一步配置，手工弹窗用“添加场景信息”布局：业务信息只读=场景传入信息、字段名称、参数名、是否必填radio（必填/选填）、取消/确定，类型次要行保text/number/date，原80/64约束不改为截图50。弹窗独立草稿，选择来源本身不回填；IMPORT_FIELD/CUSTOM_COLUMN及一字段多参数沿原合同，最终配置确认合法才更新父草稿，取消/关闭无副作用，切平台不混用另一家草稿

读取：FIELD-PLAT-AI-SCENE-ID, FIELD-PLAT-AI-SCENE-NAME, FIELD-PLAT-AI-TYPE, FIELD-PLAT-AI-SUPPLIER, FIELD-PLAT-AI-PARAMS, FIELD-PLAT-AI-CATEGORY, FIELD-PLAT-REVISION；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

### LOCAL-PLAT-AI-SCENE-SAVE-S3

主场景明确保存时重核权限/修订/当前平台分类、参数唯一/原固定项与引用有效性，schema=2及importFieldCategoryId/importFieldPlatform/importFieldMappings同次保存；label/type引用源规则，FOLLOWUP/异分类/重复参数拒绝并保草稿。旧schema1和legacy customInputFields只读兼容，显式保存升级才清旧重复定义；不改分类字段/路由、已导入值/历史或触发任务导入 厚朴场景查询并保存已有准确供应商任务后，只读投影到同一任务目录和导入/执行入口，按tenant/brand/account/taskId/唯一scene稳定关联，不创建供应商任务、不按名称猜；实时读取准确任务状态，未知供应商计数显示待核。已知权威taskStatusCode使用准确可执行枚举，原status='unknown'仅属兼容状态文本，不覆盖权威taskStatusCode明确枚举；权威code为null或未知仍拒绝。 主场景只保原添加字段唯一入口→来源二选一→独立选择/配置弹窗→子确认入父草稿→主场景明确保存。下方有效必填按准确参数唯一映射、供应商必填及所引用当前分类字段合并；CUSTOM只取自身要求，失效/重复/未读显示待核，上方供应商原模板仍保raw。空AI责任人不画旧责任行，历史明确人员仍原名保留。 取消/放弃后关闭动画期间立即重开场景时，仅清除已获授权标记closing的旧层再初始化，活动未保存层拒绝重复打开；延时关闭只删除捕获的旧层，有新层不解锁其背景滚动，旧异步字段返回按sequence/owner不能覆盖新草稿。取消不保存、不删除原映射或误报新表单脏状态。 数据导入方式仅MANUAL/AUTO（手工/接口），模板可选其有效场景但须分类/供应商/执行租户资格；旧FLOW配置提示重新选择，不静默暗转。

读取：FIELD-PLAT-AI-SCENE-ID, FIELD-PLAT-AI-SCENE-NAME, FIELD-PLAT-AI-TYPE, FIELD-PLAT-AI-SUPPLIER, FIELD-PLAT-AI-PARAMS, FIELD-PLAT-AI-CATEGORY, FIELD-PLAT-REVISION, FIELD-PLAT-AI-IMPORT-MAPPING-CATEGORY, FIELD-PLAT-AI-IMPORT-FIELD-MAPPINGS, FIELD-FLOW-CATEGORY-IMPORT-REFS；写入：FIELD-PLAT-AI-SCENE-ID, FIELD-PLAT-AI-PARAMS, FIELD-PLAT-AUDIT, FIELD-PLAT-AI-IMPORT-MAPPING-CATEGORY, FIELD-PLAT-AI-IMPORT-FIELD-MAPPINGS

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER, GR-TASK-UNIFIED-IMPORT

## 分支与异常

### LOCAL-PLAT-AI-SCENE-SAVE-B1

条件：前提、字段及对象修订校验通过且结果明确成功

结果：本场景/供应商schema=2配置准确保存，分类IMPORT保持权威；专属列定义和值独立，固定专业项/原来源权及历史保留；子弹窗确认不等主场景保存

涉及字段：FIELD-PLAT-AI-SCENE-ID, FIELD-PLAT-AI-SCENE-NAME, FIELD-PLAT-AI-TYPE, FIELD-PLAT-AI-SUPPLIER, FIELD-PLAT-AI-PARAMS, FIELD-PLAT-AI-CATEGORY, FIELD-PLAT-REVISION, FIELD-PLAT-AUDIT

验证：CHECK-PLAT-AI-SCENE-SAVE

### LOCAL-PLAT-AI-SCENE-SAVE-B2

条件：无权/字段不合法/对象失效/修订冲突

结果：明确显示本次拒绝原因，保留可继续的输入和已确认原值，不作变更

涉及字段：FIELD-PLAT-AI-SCENE-ID, FIELD-PLAT-AI-SCENE-NAME, FIELD-PLAT-AI-TYPE, FIELD-PLAT-AI-SUPPLIER, FIELD-PLAT-AI-PARAMS, FIELD-PLAT-AI-CATEGORY, FIELD-PLAT-REVISION, FIELD-PLAT-AUDIT

验证：CHECK-PLAT-AI-SCENE-SAVE

### LOCAL-PLAT-AI-SCENE-SAVE-B3

条件：提交失败或结果未知

结果：失败保留原确认值；未知显示待核并按同请求核对，不重复提交或假报成功

涉及字段：FIELD-PLAT-AI-SCENE-ID, FIELD-PLAT-AI-SCENE-NAME, FIELD-PLAT-AI-TYPE, FIELD-PLAT-AI-SUPPLIER, FIELD-PLAT-AI-PARAMS, FIELD-PLAT-AI-CATEGORY, FIELD-PLAT-REVISION, FIELD-PLAT-AUDIT

验证：CHECK-PLAT-AI-SCENE-SAVE

### LOCAL-PLAT-AI-SCENE-SAVE-B-DIALOG-CANCEL

条件：取消或关闭选择/配置弹窗，或取消主场景编辑

结果：子取消不改父草稿；父取消不改已保存场景，旧schema1/legacy定义不升级或清除；不产生配置保存/导入副作用

涉及字段：FIELD-PLAT-AI-IMPORT-MAPPING-CATEGORY, FIELD-PLAT-AI-IMPORT-FIELD-MAPPINGS, FIELD-PLAT-AI-SUPPLIER

验证：CHECK-PLAT-AI-IMPORT-FIELD-MAPPING

## 完成后的状态

- 本场景/供应商schema=2配置准确保存，分类IMPORT保持权威；专属列定义和值独立，固定专业项/原来源权及历史保留；子弹窗确认不等主场景保存

## 字段定义

- [FIELD-PLAT-AI-SCENE-ID](../field-specs.md#FIELD-PLAT-AI-SCENE-ID)
- [FIELD-PLAT-AI-SCENE-NAME](../field-specs.md#FIELD-PLAT-AI-SCENE-NAME)
- [FIELD-PLAT-AI-TYPE](../field-specs.md#FIELD-PLAT-AI-TYPE)
- [FIELD-PLAT-AI-SUPPLIER](../field-specs.md#FIELD-PLAT-AI-SUPPLIER)
- [FIELD-PLAT-AI-PARAMS](../field-specs.md#FIELD-PLAT-AI-PARAMS)
- [FIELD-PLAT-AI-CATEGORY](../field-specs.md#FIELD-PLAT-AI-CATEGORY)
- [FIELD-PLAT-REVISION](../field-specs.md#FIELD-PLAT-REVISION)
- [FIELD-PLAT-AI-IMPORT-MAPPING-CATEGORY](../field-specs.md#FIELD-PLAT-AI-IMPORT-MAPPING-CATEGORY)
- [FIELD-PLAT-AI-IMPORT-FIELD-MAPPINGS](../field-specs.md#FIELD-PLAT-AI-IMPORT-FIELD-MAPPINGS)
- [FIELD-FLOW-CATEGORY-IMPORT-REFS](../field-specs.md#FIELD-FLOW-CATEGORY-IMPORT-REFS)
- [FIELD-PLAT-AUDIT](../field-specs.md#FIELD-PLAT-AUDIT)

## 来源与验证

来源条目：acceptance:AC-2045, acceptance:AC-2046, acceptance:AC-2047, acceptance:AC-2063, acceptance:AC-2064, acceptance:AC-2159, features:FUNC-2002, features:FUNC-2002/behavior_spec/2/branches/0, features:FUNC-2002/behavior_spec/2/branches/1, features:FUNC-2002/behavior_spec/2/branches/2, features:FUNC-2002/behavior_spec/2/branches/3, features:FUNC-2002/behavior_spec/2/postconditions/0, features:FUNC-2002/behavior_spec/2/preconditions/0, features:FUNC-2002/behavior_spec/2/steps/0, features:FUNC-2002/behavior_spec/2/steps/1, features:FUNC-2002/behavior_spec/2/steps/2, features:FUNC-2019, features:FUNC-2019/behavior_spec/2/branches/0, features:FUNC-2019/behavior_spec/2/branches/1, features:FUNC-2019/behavior_spec/2/branches/2, features:FUNC-2019/behavior_spec/2/branches/3, features:FUNC-2019/behavior_spec/2/postconditions/0, features:FUNC-2019/behavior_spec/2/preconditions/0, features:FUNC-2019/behavior_spec/2/steps/0, features:FUNC-2019/behavior_spec/2/steps/1, features:FUNC-2019/behavior_spec/2/steps/2, pages:PAGE-2003/fields/2, pages:PAGE-2003/fields/24, pages:PAGE-2004/fields/0, pages:PAGE-2004/fields/5, pages:PAGE-2005/fields/0, pages:PAGE-2005/fields/9, pages:PAGE-2006/fields/55, pages:PAGE-2006/fields/56, pages:PAGE-2006/fields/58, pages:PAGE-2006/fields/6, pages:PAGE-2007/fields/1, pages:PAGE-2007/fields/25, pages:PAGE-2103/fields/1, pages:PAGE-2103/fields/20, pages:PAGE-2103/fields/26, pages:PAGE-2103/fields/27, pages:PAGE-2103/fields/3, pages:PAGE-2108/fields/1, pages:PAGE-2108/fields/4, pages:PAGE-2109/fields/3, pages:PAGE-2109/fields/9, pages:PAGE-2110, pages:PAGE-2110/actions/0, pages:PAGE-2110/fields/0, pages:PAGE-2110/fields/1, pages:PAGE-2110/fields/12, pages:PAGE-2110/fields/13, pages:PAGE-2110/fields/14, pages:PAGE-2110/fields/15, pages:PAGE-2110/fields/2, pages:PAGE-2110/fields/3, pages:PAGE-2110/fields/4, pages:PAGE-2110/fields/6, pages:PAGE-2110/fields/7, pages:PAGE-2111/fields/0, pages:PAGE-2111/fields/11, pages:PAGE-2111/fields/12, pages:PAGE-2111/fields/16, pages:PAGE-2111/fields/3, pages:PAGE-2111/fields/4, pages:PAGE-2111/fields/5, pages:PAGE-2112/fields/14, pages:PAGE-2112/fields/6, pages:PAGE-2202/fields/1, pages:PAGE-2202/fields/30, pages:PAGE-2204/fields/11, pages:PAGE-2204/fields/71, pages:PAGE-2204/fields/84, pages:PAGE-2205/fields/0, pages:PAGE-2205/fields/17, pages:PAGE-2205/fields/59, pages:PAGE-2206/fields/0, pages:PAGE-2206/fields/17, pages:PAGE-2207/fields/0, pages:PAGE-2207/fields/18, pages:PAGE-2210/fields/0, pages:PAGE-2210/fields/8, pages:PAGE-2211/fields/0, pages:PAGE-2211/fields/7, pages:PAGE-2212/fields/0, pages:PAGE-2212/fields/12, pages:PAGE-2213/fields/0, pages:PAGE-2213/fields/28, pages:PAGE-2214/fields/0, pages:PAGE-2215/fields/0, pages:PAGE-2215/fields/9, pages:PAGE-2216/fields/0, pages:PAGE-2216/fields/13, pages:PAGE-2217/fields/0, pages:PAGE-2217/fields/20, pages:PAGE-2218/fields/0, pages:PAGE-2218/fields/8, pages:PAGE-2219/fields/0, pages:PAGE-2219/fields/14, pages:PAGE-2220/fields/20, pages:PAGE-2220/fields/7, pages:PAGE-2221/fields/0, pages:PAGE-2222/fields/0, pages:PAGE-2223/fields/34, pages:PAGE-2223/fields/35, pages:PAGE-2223/fields/39, pages:PAGE-2223/fields/5, pages:PAGE-2227/fields/120, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/204, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/207, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/21, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/244, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/245, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/246, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/247, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/248, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/249, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/424, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/425, scenarios:FLOW-CURRENT-PLATFORM/steps/22

验证：CHECK-PLAT-AI-SCENE-SAVE, CHECK-PLAT-AI-IMPORT-FIELD-MAPPING

## 实施任务

- [TASK-032](../tasks/TASK-032.md)
