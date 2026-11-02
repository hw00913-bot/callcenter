# LOCAL-PLAT-AI-SCENE-DELETE 删除未被引用的AI专业场景／类型

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md) · [全局逻辑](../global-logic.md)

- [进入有权工作位置与保留专业能力 · FUNC\-2002](../features/FUNC-2002.md)

## 职责与触发

所属工程模块：未填写

功能：FUNC-2002

触发：原专业入口点击删除并确认

## 前置条件

- 有原删除权；当前对象可删且引用明确允许

## 必须遵守的全局规则

- [GR-IDENTITY](../global-logic.md#GR-IDENTITY)
- [GR-SCOPE](../global-logic.md#GR-SCOPE)
- [GR-AUTH](../global-logic.md#GR-AUTH)
- [GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)
- [GR-LIST-ORDER](../global-logic.md#GR-LIST-ORDER)

## 输入与输出

输入：[FIELD-PLAT-AI-SCENE-ID](../field-specs.md#FIELD-PLAT-AI-SCENE-ID)、[FIELD-PLAT-AI-TYPE](../field-specs.md#FIELD-PLAT-AI-TYPE)、[FIELD-PLAT-REFERENCE-STATE](../field-specs.md#FIELD-PLAT-REFERENCE-STATE)、[FIELD-PLAT-REVISION](../field-specs.md#FIELD-PLAT-REVISION)

输出：[FIELD-PLAT-AUDIT](../field-specs.md#FIELD-PLAT-AUDIT)、[FIELD-PLAT-OP-STATE](../field-specs.md#FIELD-PLAT-OP-STATE)

## 处理步骤

### LOCAL-PLAT-AI-SCENE-DELETE-S1

显示准确场景/类型，不删除关联业务分类

读取：FIELD-PLAT-AI-SCENE-ID, FIELD-PLAT-AI-TYPE, FIELD-PLAT-REFERENCE-STATE, FIELD-PLAT-REVISION；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

### LOCAL-PLAT-AI-SCENE-DELETE-S2

检查原专业引用与当前修订；未知拒绝删除

读取：FIELD-PLAT-AI-SCENE-ID, FIELD-PLAT-AI-TYPE, FIELD-PLAT-REFERENCE-STATE, FIELD-PLAT-REVISION；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

### LOCAL-PLAT-AI-SCENE-DELETE-S3

保留已受理任务/通话/业务快照

读取：FIELD-PLAT-AI-SCENE-ID, FIELD-PLAT-AI-TYPE, FIELD-PLAT-REFERENCE-STATE, FIELD-PLAT-REVISION；写入：FIELD-PLAT-AUDIT, FIELD-PLAT-OP-STATE

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

## 分支与异常

### LOCAL-PLAT-AI-SCENE-DELETE-B1

条件：前提、字段及对象修订校验通过且结果明确成功

结果：只删除原允许的准确专业对象，不清除任务结果

涉及字段：FIELD-PLAT-AI-SCENE-ID, FIELD-PLAT-AI-TYPE, FIELD-PLAT-REFERENCE-STATE, FIELD-PLAT-REVISION, FIELD-PLAT-AUDIT, FIELD-PLAT-OP-STATE

验证：CHECK-PLAT-AI-SCENE-DELETE

### LOCAL-PLAT-AI-SCENE-DELETE-B2

条件：无权/字段不合法/对象失效/修订冲突

结果：明确显示本次拒绝原因，保留可继续的输入和已确认原值，不作变更

涉及字段：FIELD-PLAT-AI-SCENE-ID, FIELD-PLAT-AI-TYPE, FIELD-PLAT-REFERENCE-STATE, FIELD-PLAT-REVISION, FIELD-PLAT-AUDIT, FIELD-PLAT-OP-STATE

验证：CHECK-PLAT-AI-SCENE-DELETE

### LOCAL-PLAT-AI-SCENE-DELETE-B3

条件：提交失败或结果未知

结果：失败保留原确认值；未知显示待核并按同请求核对，不重复提交或假报成功

涉及字段：FIELD-PLAT-AI-SCENE-ID, FIELD-PLAT-AI-TYPE, FIELD-PLAT-REFERENCE-STATE, FIELD-PLAT-REVISION, FIELD-PLAT-AUDIT, FIELD-PLAT-OP-STATE

验证：CHECK-PLAT-AI-SCENE-DELETE

## 完成后的状态

- 只删除原允许的准确专业对象，不清除任务结果

## 字段定义

- [FIELD-PLAT-AI-SCENE-ID](../field-specs.md#FIELD-PLAT-AI-SCENE-ID)
- [FIELD-PLAT-AI-TYPE](../field-specs.md#FIELD-PLAT-AI-TYPE)
- [FIELD-PLAT-AUDIT](../field-specs.md#FIELD-PLAT-AUDIT)
- [FIELD-PLAT-OP-STATE](../field-specs.md#FIELD-PLAT-OP-STATE)
- [FIELD-PLAT-REFERENCE-STATE](../field-specs.md#FIELD-PLAT-REFERENCE-STATE)
- [FIELD-PLAT-REVISION](../field-specs.md#FIELD-PLAT-REVISION)

## 来源与验证

来源条目：acceptance:AC-2063, acceptance:AC-2064, features:FUNC-2002, features:FUNC-2002/behavior_spec/3/branches/0, features:FUNC-2002/behavior_spec/3/branches/1, features:FUNC-2002/behavior_spec/3/branches/2, features:FUNC-2002/behavior_spec/3/postconditions/0, features:FUNC-2002/behavior_spec/3/preconditions/0, features:FUNC-2002/behavior_spec/3/steps/0, features:FUNC-2002/behavior_spec/3/steps/1, features:FUNC-2002/behavior_spec/3/steps/2, pages:PAGE-2003/fields/17, pages:PAGE-2003/fields/2, pages:PAGE-2003/fields/21, pages:PAGE-2003/fields/24, pages:PAGE-2004/fields/0, pages:PAGE-2004/fields/2, pages:PAGE-2004/fields/3, pages:PAGE-2004/fields/5, pages:PAGE-2005/fields/0, pages:PAGE-2005/fields/5, pages:PAGE-2005/fields/9, pages:PAGE-2006/fields/56, pages:PAGE-2006/fields/57, pages:PAGE-2006/fields/58, pages:PAGE-2007/fields/1, pages:PAGE-2007/fields/21, pages:PAGE-2007/fields/25, pages:PAGE-2103/fields/1, pages:PAGE-2103/fields/13, pages:PAGE-2103/fields/20, pages:PAGE-2103/fields/3, pages:PAGE-2108/fields/1, pages:PAGE-2108/fields/4, pages:PAGE-2109/fields/3, pages:PAGE-2109/fields/9, pages:PAGE-2110, pages:PAGE-2110/actions/0, pages:PAGE-2110/fields/11, pages:PAGE-2110/fields/12, pages:PAGE-2110/fields/2, pages:PAGE-2110/fields/6, pages:PAGE-2110/fields/7, pages:PAGE-2110/fields/8, pages:PAGE-2111/fields/11, pages:PAGE-2111/fields/12, pages:PAGE-2111/fields/16, pages:PAGE-2111/fields/3, pages:PAGE-2112/fields/11, pages:PAGE-2112/fields/14, pages:PAGE-2112/fields/6, pages:PAGE-2202/fields/1, pages:PAGE-2202/fields/21, pages:PAGE-2202/fields/30, pages:PAGE-2204/fields/71, pages:PAGE-2204/fields/77, pages:PAGE-2204/fields/84, pages:PAGE-2205/fields/0, pages:PAGE-2205/fields/10, pages:PAGE-2205/fields/17, pages:PAGE-2206/fields/0, pages:PAGE-2206/fields/10, pages:PAGE-2206/fields/17, pages:PAGE-2207/fields/0, pages:PAGE-2207/fields/14, pages:PAGE-2207/fields/18, pages:PAGE-2210/fields/0, pages:PAGE-2210/fields/1, pages:PAGE-2210/fields/4, pages:PAGE-2210/fields/8, pages:PAGE-2211/fields/0, pages:PAGE-2211/fields/1, pages:PAGE-2211/fields/7, pages:PAGE-2212/fields/0, pages:PAGE-2212/fields/1, pages:PAGE-2212/fields/12, pages:PAGE-2212/fields/8, pages:PAGE-2213/fields/0, pages:PAGE-2213/fields/1, pages:PAGE-2213/fields/28, pages:PAGE-2214/fields/0, pages:PAGE-2214/fields/2, pages:PAGE-2215/fields/0, pages:PAGE-2215/fields/3, pages:PAGE-2215/fields/9, pages:PAGE-2216/fields/0, pages:PAGE-2216/fields/1, pages:PAGE-2216/fields/13, pages:PAGE-2216/fields/9, pages:PAGE-2217/fields/0, pages:PAGE-2217/fields/13, pages:PAGE-2217/fields/16, pages:PAGE-2217/fields/20, pages:PAGE-2218/fields/0, pages:PAGE-2218/fields/1, pages:PAGE-2218/fields/4, pages:PAGE-2218/fields/8, pages:PAGE-2219/fields/0, pages:PAGE-2219/fields/14, pages:PAGE-2219/fields/8, pages:PAGE-2220/fields/12, pages:PAGE-2220/fields/16, pages:PAGE-2220/fields/20, pages:PAGE-2220/fields/7, pages:PAGE-2221/fields/0, pages:PAGE-2222/fields/0, pages:PAGE-2223/fields/35, pages:PAGE-2223/fields/38, pages:PAGE-2223/fields/39, pages:PAGE-2227/fields/120, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/203, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/204, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/206, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/207, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/244, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/247, scenarios:FLOW-CURRENT-PLATFORM/steps/23

验证：CHECK-PLAT-AI-SCENE-DELETE

## 实施任务

- [TASK-032](../tasks/TASK-032.md)
