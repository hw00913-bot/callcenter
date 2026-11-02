# LOCAL-PLAT-AI-CATEGORY-BIND 具体AI场景关联业务分类

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md) · [全局逻辑](../global-logic.md)

- [为具体AI执行场景维护业务分类引用 · FUNC\-2019](../features/FUNC-2019.md)

## 职责与触发

所属工程模块：未填写

功能：FUNC-2019

触发：AI标签管理→场景配置显式选择分类并保存

## 前置条件

- AI专业配置权；当前品牌分类有权可选

## 必须遵守的全局规则

- [GR-IDENTITY](../global-logic.md#GR-IDENTITY)
- [GR-SCOPE](../global-logic.md#GR-SCOPE)
- [GR-AUTH](../global-logic.md#GR-AUTH)
- [GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)
- [GR-LIST-ORDER](../global-logic.md#GR-LIST-ORDER)

## 输入与输出

输入：[FIELD-PLAT-AI-SCENE-ID](../field-specs.md#FIELD-PLAT-AI-SCENE-ID)、[FIELD-PLAT-AI-CATEGORY](../field-specs.md#FIELD-PLAT-AI-CATEGORY)、[FIELD-PLAT-AI-TYPE](../field-specs.md#FIELD-PLAT-AI-TYPE)、[FIELD-PLAT-AI-SUPPLIER](../field-specs.md#FIELD-PLAT-AI-SUPPLIER)、[FIELD-PLAT-REVISION](../field-specs.md#FIELD-PLAT-REVISION)

输出：[FIELD-PLAT-AI-CATEGORY](../field-specs.md#FIELD-PLAT-AI-CATEGORY)、[FIELD-PLAT-AUDIT](../field-specs.md#FIELD-PLAT-AUDIT)

## 处理步骤

### LOCAL-PLAT-AI-CATEGORY-BIND-S1

按具体执行场景稳定ID关联分类，保留原AI新/冷类型和供应商参数

读取：FIELD-PLAT-AI-SCENE-ID, FIELD-PLAT-AI-CATEGORY, FIELD-PLAT-AI-TYPE, FIELD-PLAT-AI-SUPPLIER, FIELD-PLAT-REVISION；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

### LOCAL-PLAT-AI-CATEGORY-BIND-S2

分类只作业务引用，不自动绑定流转模板；实际路由来自分类路由配置

读取：FIELD-PLAT-AI-SCENE-ID, FIELD-PLAT-AI-CATEGORY, FIELD-PLAT-AI-TYPE, FIELD-PLAT-AI-SUPPLIER, FIELD-PLAT-REVISION；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

### LOCAL-PLAT-AI-CATEGORY-BIND-S3

重新校验分类/品牌/当前修订，禁止同名或首项兜底

读取：FIELD-PLAT-AI-SCENE-ID, FIELD-PLAT-AI-CATEGORY, FIELD-PLAT-AI-TYPE, FIELD-PLAT-AI-SUPPLIER, FIELD-PLAT-REVISION；写入：FIELD-PLAT-AI-CATEGORY, FIELD-PLAT-AUDIT

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

## 分支与异常

### LOCAL-PLAT-AI-CATEGORY-BIND-B1

条件：前提、字段及对象修订校验通过且结果明确成功

结果：准确场景业务分类引用保存，未扩大品牌数据或AI专业能力

涉及字段：FIELD-PLAT-AI-SCENE-ID, FIELD-PLAT-AI-CATEGORY, FIELD-PLAT-AI-TYPE, FIELD-PLAT-AI-SUPPLIER, FIELD-PLAT-REVISION, FIELD-PLAT-AUDIT

验证：CHECK-PLAT-AI-CATEGORY-BIND

### LOCAL-PLAT-AI-CATEGORY-BIND-B2

条件：无权/字段不合法/对象失效/修订冲突

结果：明确显示本次拒绝原因，保留可继续的输入和已确认原值，不作变更

涉及字段：FIELD-PLAT-AI-SCENE-ID, FIELD-PLAT-AI-CATEGORY, FIELD-PLAT-AI-TYPE, FIELD-PLAT-AI-SUPPLIER, FIELD-PLAT-REVISION, FIELD-PLAT-AUDIT

验证：CHECK-PLAT-AI-CATEGORY-BIND

### LOCAL-PLAT-AI-CATEGORY-BIND-B3

条件：提交失败或结果未知

结果：失败保留原确认值；未知显示待核并按同请求核对，不重复提交或假报成功

涉及字段：FIELD-PLAT-AI-SCENE-ID, FIELD-PLAT-AI-CATEGORY, FIELD-PLAT-AI-TYPE, FIELD-PLAT-AI-SUPPLIER, FIELD-PLAT-REVISION, FIELD-PLAT-AUDIT

验证：CHECK-PLAT-AI-CATEGORY-BIND

## 完成后的状态

- 准确场景业务分类引用保存，未扩大品牌数据或AI专业能力

## 字段定义

- [FIELD-PLAT-AI-CATEGORY](../field-specs.md#FIELD-PLAT-AI-CATEGORY)
- [FIELD-PLAT-AI-SCENE-ID](../field-specs.md#FIELD-PLAT-AI-SCENE-ID)
- [FIELD-PLAT-AI-SUPPLIER](../field-specs.md#FIELD-PLAT-AI-SUPPLIER)
- [FIELD-PLAT-AI-TYPE](../field-specs.md#FIELD-PLAT-AI-TYPE)
- [FIELD-PLAT-AUDIT](../field-specs.md#FIELD-PLAT-AUDIT)
- [FIELD-PLAT-REVISION](../field-specs.md#FIELD-PLAT-REVISION)

## 来源与验证

来源条目：acceptance:AC-2045, acceptance:AC-2046, acceptance:AC-2047, acceptance:AC-2149, features:FUNC-2019, features:FUNC-2019/behavior_spec/0/branches/0, features:FUNC-2019/behavior_spec/0/branches/1, features:FUNC-2019/behavior_spec/0/branches/2, features:FUNC-2019/behavior_spec/0/postconditions/0, features:FUNC-2019/behavior_spec/0/preconditions/0, features:FUNC-2019/behavior_spec/0/steps/0, features:FUNC-2019/behavior_spec/0/steps/1, features:FUNC-2019/behavior_spec/0/steps/2, pages:PAGE-2003/fields/2, pages:PAGE-2003/fields/24, pages:PAGE-2004/fields/0, pages:PAGE-2004/fields/5, pages:PAGE-2005/fields/0, pages:PAGE-2005/fields/9, pages:PAGE-2006/fields/55, pages:PAGE-2006/fields/56, pages:PAGE-2006/fields/58, pages:PAGE-2007/fields/1, pages:PAGE-2007/fields/25, pages:PAGE-2103/fields/1, pages:PAGE-2103/fields/20, pages:PAGE-2103/fields/3, pages:PAGE-2108/fields/1, pages:PAGE-2108/fields/4, pages:PAGE-2109/fields/3, pages:PAGE-2109/fields/9, pages:PAGE-2110, pages:PAGE-2110/fields/0, pages:PAGE-2110/fields/12, pages:PAGE-2110/fields/2, pages:PAGE-2110/fields/4, pages:PAGE-2110/fields/6, pages:PAGE-2110/fields/7, pages:PAGE-2111, pages:PAGE-2111/actions/1, pages:PAGE-2111/fields/0, pages:PAGE-2111/fields/11, pages:PAGE-2111/fields/12, pages:PAGE-2111/fields/16, pages:PAGE-2111/fields/3, pages:PAGE-2111/fields/5, pages:PAGE-2112/fields/14, pages:PAGE-2112/fields/6, pages:PAGE-2202/fields/1, pages:PAGE-2202/fields/30, pages:PAGE-2204/fields/71, pages:PAGE-2204/fields/84, pages:PAGE-2205/fields/0, pages:PAGE-2205/fields/17, pages:PAGE-2206/fields/0, pages:PAGE-2206/fields/17, pages:PAGE-2207/fields/0, pages:PAGE-2207/fields/18, pages:PAGE-2210/fields/0, pages:PAGE-2210/fields/8, pages:PAGE-2211/fields/0, pages:PAGE-2211/fields/7, pages:PAGE-2212/fields/0, pages:PAGE-2212/fields/12, pages:PAGE-2213/fields/0, pages:PAGE-2213/fields/28, pages:PAGE-2214/fields/0, pages:PAGE-2215/fields/0, pages:PAGE-2215/fields/9, pages:PAGE-2216/fields/0, pages:PAGE-2216/fields/13, pages:PAGE-2217/fields/0, pages:PAGE-2217/fields/20, pages:PAGE-2218/fields/0, pages:PAGE-2218/fields/8, pages:PAGE-2219/fields/0, pages:PAGE-2219/fields/14, pages:PAGE-2220/fields/20, pages:PAGE-2220/fields/7, pages:PAGE-2221/fields/0, pages:PAGE-2222/fields/0, pages:PAGE-2223/fields/34, pages:PAGE-2223/fields/35, pages:PAGE-2223/fields/39, pages:PAGE-2227/fields/120, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/199, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/202, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/239, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/241, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/242, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/244, scenarios:FLOW-CURRENT-PLATFORM/steps/20

验证：CHECK-PLAT-AI-CATEGORY-BIND

## 实施任务

- [TASK-032](../tasks/TASK-032.md)
