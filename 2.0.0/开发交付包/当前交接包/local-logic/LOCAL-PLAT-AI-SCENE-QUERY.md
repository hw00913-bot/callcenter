# LOCAL-PLAT-AI-SCENE-QUERY 查询AI场景及原类型

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md) · [全局逻辑](../global-logic.md)

- [进入有权工作位置与保留专业能力 · FUNC\-2002](../features/FUNC-2002.md)
- [为具体AI执行场景维护业务分类引用 · FUNC\-2019](../features/FUNC-2019.md)

## 职责与触发

所属工程模块：未填写

功能：FUNC-2002, FUNC-2019

触发：打开AI业务场景/场景配置或当前场景选择器

## 前置条件

- 场景读取/使用权；不要求标签维护权

## 必须遵守的全局规则

- [GR-IDENTITY](../global-logic.md#GR-IDENTITY)
- [GR-SCOPE](../global-logic.md#GR-SCOPE)
- [GR-AUTH](../global-logic.md#GR-AUTH)
- [GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)
- [GR-LIST-ORDER](../global-logic.md#GR-LIST-ORDER)
- [GR-TASK-UNIFIED-IMPORT](../global-logic.md#GR-TASK-UNIFIED-IMPORT)

## 输入与输出

输入：[FIELD-PLAT-QUERY](../field-specs.md#FIELD-PLAT-QUERY)、[FIELD-PLAT-AI-TENANT](../field-specs.md#FIELD-PLAT-AI-TENANT)、[FIELD-PLAT-AI-IMPORT-MAPPING-CATEGORY](../field-specs.md#FIELD-PLAT-AI-IMPORT-MAPPING-CATEGORY)、[FIELD-PLAT-AI-IMPORT-FIELD-MAPPINGS](../field-specs.md#FIELD-PLAT-AI-IMPORT-FIELD-MAPPINGS)、[FIELD-FLOW-CATEGORY-IMPORT-REFS](../field-specs.md#FIELD-FLOW-CATEGORY-IMPORT-REFS)

输出：[FIELD-PLAT-AI-SCENE-ID](../field-specs.md#FIELD-PLAT-AI-SCENE-ID)、[FIELD-PLAT-AI-SCENE-NAME](../field-specs.md#FIELD-PLAT-AI-SCENE-NAME)、[FIELD-PLAT-AI-TYPE](../field-specs.md#FIELD-PLAT-AI-TYPE)、[FIELD-PLAT-AI-SUPPLIER](../field-specs.md#FIELD-PLAT-AI-SUPPLIER)、[FIELD-PLAT-AI-CATEGORY](../field-specs.md#FIELD-PLAT-AI-CATEGORY)、[FIELD-PLAT-PAGING](../field-specs.md#FIELD-PLAT-PAGING)

## 处理步骤

### LOCAL-PLAT-AI-SCENE-QUERY-S1

按租户和供应商执行资格过滤场景/类型

读取：FIELD-PLAT-QUERY, FIELD-PLAT-AI-TENANT；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

### LOCAL-PLAT-AI-SCENE-QUERY-S2

准确显示启停/分类/参数可用性，未知不能用首项代替 厚朴场景查询并保存已有准确供应商任务后，只读投影到同一任务目录和导入/执行入口，按tenant/brand/account/taskId/唯一scene稳定关联，不创建供应商任务、不按名称猜；实时读取准确任务状态，未知供应商计数显示待核。已知权威taskStatusCode使用准确可执行枚举，原status='unknown'仅属兼容状态文本，不覆盖权威taskStatusCode明确枚举；权威code为null或未知仍拒绝。 主场景只保原添加字段唯一入口→来源二选一→独立选择/配置弹窗→子确认入父草稿→主场景明确保存。下方有效必填按准确参数唯一映射、供应商必填及所引用当前分类字段合并；CUSTOM只取自身要求，失效/重复/未读显示待核，上方供应商原模板仍保raw。空AI责任人不画旧责任行，历史明确人员仍原名保留。 取消/放弃后关闭动画期间立即重开场景时，仅清除已获授权标记closing的旧层再初始化，活动未保存层拒绝重复打开；延时关闭只删除捕获的旧层，有新层不解锁其背景滚动，旧异步字段返回按sequence/owner不能覆盖新草稿。取消不保存、不删除原映射或误报新表单脏状态。 数据导入方式仅MANUAL/AUTO（手工/接口），模板可选其有效场景但须分类/供应商/执行租户资格；旧FLOW配置提示重新选择，不静默暗转。

读取：FIELD-PLAT-QUERY, FIELD-PLAT-AI-TENANT, FIELD-PLAT-AI-IMPORT-MAPPING-CATEGORY, FIELD-PLAT-AI-IMPORT-FIELD-MAPPINGS, FIELD-FLOW-CATEGORY-IMPORT-REFS；写入：FIELD-PLAT-AI-SCENE-ID, FIELD-PLAT-AI-SCENE-NAME, FIELD-PLAT-AI-TYPE, FIELD-PLAT-AI-SUPPLIER, FIELD-PLAT-AI-CATEGORY, FIELD-PLAT-PAGING

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER, GR-TASK-UNIFIED-IMPORT

## 分支与异常

### LOCAL-PLAT-AI-SCENE-QUERY-B1

条件：前提、字段及对象修订校验通过且结果明确成功

结果：显示当前合法场景；仅有使用权可使用但不可维护标签

涉及字段：FIELD-PLAT-QUERY, FIELD-PLAT-AI-TENANT, FIELD-PLAT-AI-SCENE-ID, FIELD-PLAT-AI-SCENE-NAME, FIELD-PLAT-AI-TYPE, FIELD-PLAT-AI-SUPPLIER, FIELD-PLAT-AI-CATEGORY, FIELD-PLAT-PAGING

验证：CHECK-PLAT-AI-SCENE-QUERY

### LOCAL-PLAT-AI-SCENE-QUERY-B2

条件：无权/字段不合法/对象失效/修订冲突

结果：明确显示本次拒绝原因，保留可继续的输入和已确认原值，不作变更

涉及字段：FIELD-PLAT-QUERY, FIELD-PLAT-AI-TENANT, FIELD-PLAT-AI-SCENE-ID, FIELD-PLAT-AI-SCENE-NAME, FIELD-PLAT-AI-TYPE, FIELD-PLAT-AI-SUPPLIER, FIELD-PLAT-AI-CATEGORY, FIELD-PLAT-PAGING

验证：CHECK-PLAT-AI-SCENE-QUERY

### LOCAL-PLAT-AI-SCENE-QUERY-B3

条件：提交失败或结果未知

结果：失败保留原确认值；未知显示待核并按同请求核对，不重复提交或假报成功

涉及字段：FIELD-PLAT-QUERY, FIELD-PLAT-AI-TENANT, FIELD-PLAT-AI-SCENE-ID, FIELD-PLAT-AI-SCENE-NAME, FIELD-PLAT-AI-TYPE, FIELD-PLAT-AI-SUPPLIER, FIELD-PLAT-AI-CATEGORY, FIELD-PLAT-PAGING

验证：CHECK-PLAT-AI-SCENE-QUERY

## 完成后的状态

- 显示当前合法场景；仅有使用权可使用但不可维护标签

## 字段定义

- [FIELD-PLAT-QUERY](../field-specs.md#FIELD-PLAT-QUERY)
- [FIELD-PLAT-AI-TENANT](../field-specs.md#FIELD-PLAT-AI-TENANT)
- [FIELD-PLAT-AI-IMPORT-MAPPING-CATEGORY](../field-specs.md#FIELD-PLAT-AI-IMPORT-MAPPING-CATEGORY)
- [FIELD-PLAT-AI-IMPORT-FIELD-MAPPINGS](../field-specs.md#FIELD-PLAT-AI-IMPORT-FIELD-MAPPINGS)
- [FIELD-FLOW-CATEGORY-IMPORT-REFS](../field-specs.md#FIELD-FLOW-CATEGORY-IMPORT-REFS)
- [FIELD-PLAT-AI-SCENE-ID](../field-specs.md#FIELD-PLAT-AI-SCENE-ID)
- [FIELD-PLAT-AI-SCENE-NAME](../field-specs.md#FIELD-PLAT-AI-SCENE-NAME)
- [FIELD-PLAT-AI-TYPE](../field-specs.md#FIELD-PLAT-AI-TYPE)
- [FIELD-PLAT-AI-SUPPLIER](../field-specs.md#FIELD-PLAT-AI-SUPPLIER)
- [FIELD-PLAT-AI-CATEGORY](../field-specs.md#FIELD-PLAT-AI-CATEGORY)
- [FIELD-PLAT-PAGING](../field-specs.md#FIELD-PLAT-PAGING)

## 来源与验证

来源条目：acceptance:AC-2045, acceptance:AC-2046, acceptance:AC-2047, acceptance:AC-2063, acceptance:AC-2064, features:FUNC-2002, features:FUNC-2002/behavior_spec/1/branches/0, features:FUNC-2002/behavior_spec/1/branches/1, features:FUNC-2002/behavior_spec/1/branches/2, features:FUNC-2002/behavior_spec/1/postconditions/0, features:FUNC-2002/behavior_spec/1/preconditions/0, features:FUNC-2002/behavior_spec/1/steps/0, features:FUNC-2002/behavior_spec/1/steps/1, features:FUNC-2019, features:FUNC-2019/behavior_spec/1/branches/0, features:FUNC-2019/behavior_spec/1/branches/1, features:FUNC-2019/behavior_spec/1/branches/2, features:FUNC-2019/behavior_spec/1/postconditions/0, features:FUNC-2019/behavior_spec/1/preconditions/0, features:FUNC-2019/behavior_spec/1/steps/0, features:FUNC-2019/behavior_spec/1/steps/1, pages:PAGE-2002/fields/2, pages:PAGE-2002/fields/4, pages:PAGE-2003/fields/18, pages:PAGE-2003/fields/20, pages:PAGE-2005/fields/6, pages:PAGE-2005/fields/7, pages:PAGE-2006/fields/55, pages:PAGE-2006/fields/6, pages:PAGE-2007/fields/22, pages:PAGE-2007/fields/23, pages:PAGE-2102/fields/0, pages:PAGE-2102/fields/4, pages:PAGE-2103/fields/1, pages:PAGE-2103/fields/14, pages:PAGE-2103/fields/17, pages:PAGE-2103/fields/2, pages:PAGE-2103/fields/26, pages:PAGE-2103/fields/27, pages:PAGE-2105/fields/0, pages:PAGE-2105/fields/1, pages:PAGE-2106/fields/0, pages:PAGE-2106/fields/5, pages:PAGE-2106/fields/6, pages:PAGE-2107/fields/0, pages:PAGE-2107/fields/1, pages:PAGE-2108/fields/1, pages:PAGE-2108/fields/15, pages:PAGE-2108/fields/16, pages:PAGE-2109/fields/2, pages:PAGE-2109/fields/6, pages:PAGE-2109/fields/7, pages:PAGE-2110, pages:PAGE-2110/actions/0, pages:PAGE-2110/fields/0, pages:PAGE-2110/fields/10, pages:PAGE-2110/fields/13, pages:PAGE-2110/fields/14, pages:PAGE-2110/fields/15, pages:PAGE-2110/fields/2, pages:PAGE-2110/fields/3, pages:PAGE-2110/fields/4, pages:PAGE-2110/fields/5, pages:PAGE-2110/fields/6, pages:PAGE-2110/fields/9, pages:PAGE-2111, pages:PAGE-2111/fields/0, pages:PAGE-2111/fields/10, pages:PAGE-2111/fields/11, pages:PAGE-2111/fields/14, pages:PAGE-2111/fields/15, pages:PAGE-2111/fields/3, pages:PAGE-2111/fields/4, pages:PAGE-2111/fields/5, pages:PAGE-2112/fields/12, pages:PAGE-2112/fields/5, pages:PAGE-2202/fields/26, pages:PAGE-2203/fields/58, pages:PAGE-2203/fields/61, pages:PAGE-2204/fields/11, pages:PAGE-2204/fields/78, pages:PAGE-2204/fields/81, pages:PAGE-2205/fields/11, pages:PAGE-2205/fields/13, pages:PAGE-2205/fields/59, pages:PAGE-2206/fields/11, pages:PAGE-2206/fields/13, pages:PAGE-2208/fields/5, pages:PAGE-2208/fields/6, pages:PAGE-2209/fields/2, pages:PAGE-2209/fields/3, pages:PAGE-2210/fields/2, pages:PAGE-2210/fields/3, pages:PAGE-2211/fields/2, pages:PAGE-2211/fields/3, pages:PAGE-2212/fields/6, pages:PAGE-2212/fields/7, pages:PAGE-2213/fields/2, pages:PAGE-2213/fields/3, pages:PAGE-2214/fields/3, pages:PAGE-2215/fields/4, pages:PAGE-2215/fields/5, pages:PAGE-2216/fields/2, pages:PAGE-2216/fields/8, pages:PAGE-2217/fields/14, pages:PAGE-2217/fields/15, pages:PAGE-2218/fields/2, pages:PAGE-2218/fields/3, pages:PAGE-2219/fields/10, pages:PAGE-2219/fields/9, pages:PAGE-2220/fields/13, pages:PAGE-2220/fields/15, pages:PAGE-2221/fields/4, pages:PAGE-2222/fields/2, pages:PAGE-2223/fields/34, pages:PAGE-2223/fields/5, pages:PAGE-2225/fields/0, pages:PAGE-2225/fields/1, pages:PAGE-2227/fields/130, pages:PAGE-2227/fields/134, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/21, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/211, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/212, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/238, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/239, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/240, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/241, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/242, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/244, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/419, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/420, scenarios:FLOW-CURRENT-PLATFORM/steps/21

验证：CHECK-PLAT-AI-SCENE-QUERY

## 实施任务

- [TASK-032](../tasks/TASK-032.md)
