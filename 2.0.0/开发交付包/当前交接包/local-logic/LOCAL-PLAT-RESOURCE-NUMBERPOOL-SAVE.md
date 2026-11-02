# LOCAL-PLAT-RESOURCE-NUMBERPOOL-SAVE 创建、编辑或按允许动作保存号码池

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md) · [全局逻辑](../global-logic.md)

- [进入有权工作位置与保留专业能力 · FUNC\-2002](../features/FUNC-2002.md)

## 职责与触发

所属工程模块：未填写

功能：FUNC-2002

触发：有原号码池对应操作权者新增/编辑/导入/启停或配置后明确保存

## 前置条件

- 原该动作权及当前合法资源范围
- 创建类型0/1，已有池类型只读
- 每企业最多一个默认，默认不可取消或删除
- 完整号码集合更新；明确清空才移除全部，未设企业上限须少于500

## 必须遵守的全局规则

- [GR-IDENTITY](../global-logic.md#GR-IDENTITY)
- [GR-SCOPE](../global-logic.md#GR-SCOPE)
- [GR-AUTH](../global-logic.md#GR-AUTH)
- [GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)
- [GR-LIST-ORDER](../global-logic.md#GR-LIST-ORDER)

## 输入与输出

输入：[FIELD-PLAT-RESOURCE-SCOPE](../field-specs.md#FIELD-PLAT-RESOURCE-SCOPE)、[FIELD-PLAT-POOL-NAME](../field-specs.md#FIELD-PLAT-POOL-NAME)、[FIELD-PLAT-POOL-COMMENT](../field-specs.md#FIELD-PLAT-POOL-COMMENT)、[FIELD-PLAT-POOL-TYPE](../field-specs.md#FIELD-PLAT-POOL-TYPE)、[FIELD-PLAT-POOL-DEFAULT](../field-specs.md#FIELD-PLAT-POOL-DEFAULT)、[FIELD-PLAT-POOL-NUMBERS](../field-specs.md#FIELD-PLAT-POOL-NUMBERS)、[FIELD-PLAT-REVISION](../field-specs.md#FIELD-PLAT-REVISION)、[FIELD-PLAT-REQUEST](../field-specs.md#FIELD-PLAT-REQUEST)

输出：[FIELD-PLAT-POOL-NAME](../field-specs.md#FIELD-PLAT-POOL-NAME)、[FIELD-PLAT-POOL-COMMENT](../field-specs.md#FIELD-PLAT-POOL-COMMENT)、[FIELD-PLAT-POOL-TYPE](../field-specs.md#FIELD-PLAT-POOL-TYPE)、[FIELD-PLAT-POOL-DEFAULT](../field-specs.md#FIELD-PLAT-POOL-DEFAULT)、[FIELD-PLAT-POOL-NUMBERS](../field-specs.md#FIELD-PLAT-POOL-NUMBERS)、[FIELD-PLAT-RESOURCE-STATE](../field-specs.md#FIELD-PLAT-RESOURCE-STATE)、[FIELD-PLAT-AUDIT](../field-specs.md#FIELD-PLAT-AUDIT)、[FIELD-PLAT-OP-STATE](../field-specs.md#FIELD-PLAT-OP-STATE)

## 处理步骤

### LOCAL-PLAT-RESOURCE-NUMBERPOOL-SAVE-S1

按准确动作变体逐字段校验；导入保选中候选，启停保原状态约束

读取：FIELD-PLAT-RESOURCE-SCOPE, FIELD-PLAT-POOL-NAME, FIELD-PLAT-POOL-COMMENT, FIELD-PLAT-POOL-TYPE, FIELD-PLAT-POOL-DEFAULT, FIELD-PLAT-POOL-NUMBERS, FIELD-PLAT-REVISION, FIELD-PLAT-REQUEST；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

### LOCAL-PLAT-RESOURCE-NUMBERPOOL-SAVE-S2

最终复核scope/修订/引用/在用状态，不能因原页面有入口忽略动作权

读取：FIELD-PLAT-RESOURCE-SCOPE, FIELD-PLAT-POOL-NAME, FIELD-PLAT-POOL-COMMENT, FIELD-PLAT-POOL-TYPE, FIELD-PLAT-POOL-DEFAULT, FIELD-PLAT-POOL-NUMBERS, FIELD-PLAT-REVISION, FIELD-PLAT-REQUEST；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

### LOCAL-PLAT-RESOURCE-NUMBERPOOL-SAVE-S3

分别保存明确本地结果和外部受理/终态；失败保输入、未知先核对

读取：FIELD-PLAT-RESOURCE-SCOPE, FIELD-PLAT-POOL-NAME, FIELD-PLAT-POOL-COMMENT, FIELD-PLAT-POOL-TYPE, FIELD-PLAT-POOL-DEFAULT, FIELD-PLAT-POOL-NUMBERS, FIELD-PLAT-REVISION, FIELD-PLAT-REQUEST；写入：FIELD-PLAT-POOL-NAME, FIELD-PLAT-POOL-COMMENT, FIELD-PLAT-POOL-TYPE, FIELD-PLAT-POOL-DEFAULT, FIELD-PLAT-POOL-NUMBERS, FIELD-PLAT-RESOURCE-STATE, FIELD-PLAT-AUDIT, FIELD-PLAT-OP-STATE

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

## 分支与异常

### LOCAL-PLAT-RESOURCE-NUMBERPOOL-SAVE-B1

条件：前提、字段及对象修订校验通过且结果明确成功

结果：准确号码池允许配置确认保存；不假报供应商生效或静默改其他资源

涉及字段：FIELD-PLAT-RESOURCE-SCOPE, FIELD-PLAT-POOL-NAME, FIELD-PLAT-POOL-COMMENT, FIELD-PLAT-POOL-TYPE, FIELD-PLAT-POOL-DEFAULT, FIELD-PLAT-POOL-NUMBERS, FIELD-PLAT-REVISION, FIELD-PLAT-REQUEST, FIELD-PLAT-RESOURCE-STATE, FIELD-PLAT-AUDIT, FIELD-PLAT-OP-STATE

验证：CHECK-PLAT-RESOURCE-NUMBERPOOL-SAVE

### LOCAL-PLAT-RESOURCE-NUMBERPOOL-SAVE-B2

条件：无权/字段不合法/对象失效/修订冲突

结果：明确显示本次拒绝原因，保留可继续的输入和已确认原值，不作变更

涉及字段：FIELD-PLAT-RESOURCE-SCOPE, FIELD-PLAT-POOL-NAME, FIELD-PLAT-POOL-COMMENT, FIELD-PLAT-POOL-TYPE, FIELD-PLAT-POOL-DEFAULT, FIELD-PLAT-POOL-NUMBERS, FIELD-PLAT-REVISION, FIELD-PLAT-REQUEST, FIELD-PLAT-RESOURCE-STATE, FIELD-PLAT-AUDIT, FIELD-PLAT-OP-STATE

验证：CHECK-PLAT-RESOURCE-NUMBERPOOL-SAVE

### LOCAL-PLAT-RESOURCE-NUMBERPOOL-SAVE-B3

条件：提交失败或结果未知

结果：失败保留原确认值；未知显示待核并按同请求核对，不重复提交或假报成功

涉及字段：FIELD-PLAT-RESOURCE-SCOPE, FIELD-PLAT-POOL-NAME, FIELD-PLAT-POOL-COMMENT, FIELD-PLAT-POOL-TYPE, FIELD-PLAT-POOL-DEFAULT, FIELD-PLAT-POOL-NUMBERS, FIELD-PLAT-REVISION, FIELD-PLAT-REQUEST, FIELD-PLAT-RESOURCE-STATE, FIELD-PLAT-AUDIT, FIELD-PLAT-OP-STATE

验证：CHECK-PLAT-RESOURCE-NUMBERPOOL-SAVE

## 完成后的状态

- 准确号码池允许配置确认保存；不假报供应商生效或静默改其他资源

## 字段定义

- [FIELD-PLAT-AUDIT](../field-specs.md#FIELD-PLAT-AUDIT)
- [FIELD-PLAT-OP-STATE](../field-specs.md#FIELD-PLAT-OP-STATE)
- [FIELD-PLAT-POOL-COMMENT](../field-specs.md#FIELD-PLAT-POOL-COMMENT)
- [FIELD-PLAT-POOL-DEFAULT](../field-specs.md#FIELD-PLAT-POOL-DEFAULT)
- [FIELD-PLAT-POOL-NAME](../field-specs.md#FIELD-PLAT-POOL-NAME)
- [FIELD-PLAT-POOL-NUMBERS](../field-specs.md#FIELD-PLAT-POOL-NUMBERS)
- [FIELD-PLAT-POOL-TYPE](../field-specs.md#FIELD-PLAT-POOL-TYPE)
- [FIELD-PLAT-REQUEST](../field-specs.md#FIELD-PLAT-REQUEST)
- [FIELD-PLAT-RESOURCE-SCOPE](../field-specs.md#FIELD-PLAT-RESOURCE-SCOPE)
- [FIELD-PLAT-RESOURCE-STATE](../field-specs.md#FIELD-PLAT-RESOURCE-STATE)
- [FIELD-PLAT-REVISION](../field-specs.md#FIELD-PLAT-REVISION)

## 来源与验证

来源条目：acceptance:AC-2071, acceptance:AC-2072, features:FUNC-2002, features:FUNC-2002/behavior_spec/66/branches/0, features:FUNC-2002/behavior_spec/66/branches/1, features:FUNC-2002/behavior_spec/66/branches/2, features:FUNC-2002/behavior_spec/66/postconditions/0, features:FUNC-2002/behavior_spec/66/preconditions/0, features:FUNC-2002/behavior_spec/66/preconditions/1, features:FUNC-2002/behavior_spec/66/preconditions/2, features:FUNC-2002/behavior_spec/66/preconditions/3, features:FUNC-2002/behavior_spec/66/steps/0, features:FUNC-2002/behavior_spec/66/steps/1, features:FUNC-2002/behavior_spec/66/steps/2, pages:PAGE-2003/fields/17, pages:PAGE-2003/fields/2, pages:PAGE-2003/fields/22, pages:PAGE-2003/fields/23, pages:PAGE-2003/fields/24, pages:PAGE-2004/fields/0, pages:PAGE-2004/fields/2, pages:PAGE-2004/fields/4, pages:PAGE-2004/fields/5, pages:PAGE-2005/fields/0, pages:PAGE-2005/fields/5, pages:PAGE-2005/fields/8, pages:PAGE-2005/fields/9, pages:PAGE-2006/fields/56, pages:PAGE-2006/fields/58, pages:PAGE-2007/fields/1, pages:PAGE-2007/fields/21, pages:PAGE-2007/fields/24, pages:PAGE-2007/fields/25, pages:PAGE-2103/fields/13, pages:PAGE-2103/fields/19, pages:PAGE-2103/fields/20, pages:PAGE-2103/fields/3, pages:PAGE-2105/fields/4, pages:PAGE-2106/fields/9, pages:PAGE-2107/fields/4, pages:PAGE-2108/fields/18, pages:PAGE-2108/fields/19, pages:PAGE-2108/fields/4, pages:PAGE-2109/fields/3, pages:PAGE-2109/fields/9, pages:PAGE-2110/fields/12, pages:PAGE-2110/fields/7, pages:PAGE-2110/fields/8, pages:PAGE-2111/fields/12, pages:PAGE-2111/fields/16, pages:PAGE-2112/fields/11, pages:PAGE-2112/fields/13, pages:PAGE-2112/fields/14, pages:PAGE-2112/fields/6, pages:PAGE-2202/fields/1, pages:PAGE-2202/fields/21, pages:PAGE-2202/fields/28, pages:PAGE-2202/fields/29, pages:PAGE-2202/fields/30, pages:PAGE-2203/fields/63, pages:PAGE-2204/fields/71, pages:PAGE-2204/fields/77, pages:PAGE-2204/fields/82, pages:PAGE-2204/fields/83, pages:PAGE-2204/fields/84, pages:PAGE-2205/fields/0, pages:PAGE-2205/fields/10, pages:PAGE-2205/fields/15, pages:PAGE-2205/fields/16, pages:PAGE-2205/fields/17, pages:PAGE-2206/fields/0, pages:PAGE-2206/fields/10, pages:PAGE-2206/fields/15, pages:PAGE-2206/fields/16, pages:PAGE-2206/fields/17, pages:PAGE-2207/fields/0, pages:PAGE-2207/fields/14, pages:PAGE-2207/fields/17, pages:PAGE-2207/fields/18, pages:PAGE-2208/fields/9, pages:PAGE-2209/fields/7, pages:PAGE-2210/fields/0, pages:PAGE-2210/fields/1, pages:PAGE-2210/fields/5, pages:PAGE-2210/fields/6, pages:PAGE-2210/fields/7, pages:PAGE-2210/fields/8, pages:PAGE-2211/fields/0, pages:PAGE-2211/fields/1, pages:PAGE-2211/fields/4, pages:PAGE-2211/fields/5, pages:PAGE-2211/fields/6, pages:PAGE-2211/fields/7, pages:PAGE-2212/fields/0, pages:PAGE-2212/fields/1, pages:PAGE-2212/fields/10, pages:PAGE-2212/fields/11, pages:PAGE-2212/fields/12, pages:PAGE-2212/fields/9, pages:PAGE-2213/fields/0, pages:PAGE-2213/fields/1, pages:PAGE-2213/fields/25, pages:PAGE-2213/fields/26, pages:PAGE-2213/fields/27, pages:PAGE-2213/fields/28, pages:PAGE-2214/fields/0, pages:PAGE-2214/fields/2, pages:PAGE-2214/fields/4, pages:PAGE-2214/fields/5, pages:PAGE-2215/fields/0, pages:PAGE-2215/fields/3, pages:PAGE-2215/fields/6, pages:PAGE-2215/fields/7, pages:PAGE-2215/fields/8, pages:PAGE-2215/fields/9, pages:PAGE-2216, pages:PAGE-2216/actions/0, pages:PAGE-2216/fields/0, pages:PAGE-2216/fields/1, pages:PAGE-2216/fields/10, pages:PAGE-2216/fields/11, pages:PAGE-2216/fields/12, pages:PAGE-2216/fields/13, pages:PAGE-2216/fields/3, pages:PAGE-2216/fields/4, pages:PAGE-2216/fields/5, pages:PAGE-2216/fields/6, pages:PAGE-2216/fields/7, pages:PAGE-2217/fields/0, pages:PAGE-2217/fields/13, pages:PAGE-2217/fields/17, pages:PAGE-2217/fields/18, pages:PAGE-2217/fields/19, pages:PAGE-2217/fields/20, pages:PAGE-2218/fields/0, pages:PAGE-2218/fields/1, pages:PAGE-2218/fields/5, pages:PAGE-2218/fields/6, pages:PAGE-2218/fields/7, pages:PAGE-2218/fields/8, pages:PAGE-2219/fields/0, pages:PAGE-2219/fields/11, pages:PAGE-2219/fields/12, pages:PAGE-2219/fields/13, pages:PAGE-2219/fields/14, pages:PAGE-2219/fields/8, pages:PAGE-2220/fields/12, pages:PAGE-2220/fields/17, pages:PAGE-2220/fields/18, pages:PAGE-2220/fields/19, pages:PAGE-2220/fields/20, pages:PAGE-2220/fields/7, pages:PAGE-2221/fields/0, pages:PAGE-2221/fields/6, pages:PAGE-2221/fields/7, pages:PAGE-2222/fields/0, pages:PAGE-2222/fields/4, pages:PAGE-2223/fields/35, pages:PAGE-2223/fields/39, pages:PAGE-2225/fields/2, pages:PAGE-2227/fields/120, pages:PAGE-2227/fields/136, pages:PAGE-2227/fields/137, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/204, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/205, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/206, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/207, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/283, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/284, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/302, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/303, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/304, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/305, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/330, scenarios:FLOW-CURRENT-PLATFORM/steps/94

验证：CHECK-PLAT-RESOURCE-NUMBERPOOL-SAVE

## 实施任务

- [TASK-053](../tasks/TASK-053.md)
