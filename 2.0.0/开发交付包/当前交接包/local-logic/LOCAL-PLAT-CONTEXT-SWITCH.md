# LOCAL-PLAT-CONTEXT-SWITCH 正常切换上下文并保护身份与普通草稿

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md) · [全局逻辑](../global-logic.md)

- [切换合法上下文并保护普通草稿 · FUNC\-2003](../features/FUNC-2003.md)

## 职责与触发

所属工程模块：未填写

功能：FUNC-2003

触发：选择其他合法租户或跨电话保护边界进入AI/公共管理

## 前置条件

- 当前身份/目标范围或系统退出动作可核
- 普通未保存表单按保存/放弃/取消处理，失败保输入

## 必须遵守的全局规则

- [GR-IDENTITY](../global-logic.md#GR-IDENTITY)
- [GR-SCOPE](../global-logic.md#GR-SCOPE)
- [GR-AUTH](../global-logic.md#GR-AUTH)
- [GR-SERIAL](../global-logic.md#GR-SERIAL)
- [GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)
- [GR-NAVIGATION](../global-logic.md#GR-NAVIGATION)

## 输入与输出

输入：[FIELD-PLAT-CURRENT-TENANT](../field-specs.md#FIELD-PLAT-CURRENT-TENANT)、[FIELD-PLAT-SESSION](../field-specs.md#FIELD-PLAT-SESSION)、[FIELD-PLAT-GUARD-STATE](../field-specs.md#FIELD-PLAT-GUARD-STATE)、[FIELD-PLAT-POSITION](../field-specs.md#FIELD-PLAT-POSITION)

输出：[FIELD-PLAT-CURRENT-TENANT](../field-specs.md#FIELD-PLAT-CURRENT-TENANT)、[FIELD-PLAT-POSITION](../field-specs.md#FIELD-PLAT-POSITION)

## 处理步骤

### LOCAL-PLAT-CONTEXT-SWITCH-S1

正常导航/切换/系统退出不因本人电话拨号、振铃、通话、话后或未知而拦截，不要求先电话离线

读取：FIELD-PLAT-CURRENT-TENANT, FIELD-PLAT-SESSION, FIELD-PLAT-GUARD-STATE, FIELD-PLAT-POSITION；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-SERIAL, GR-UNKNOWN

### LOCAL-PLAT-CONTEXT-SWITCH-S2

继续核当前账号、目标租户/页面/数据权和普通未保存表单；不迁入旧租户客户对象/草稿或冒领电话资格

读取：FIELD-PLAT-CURRENT-TENANT, FIELD-PLAT-SESSION, FIELD-PLAT-GUARD-STATE, FIELD-PLAT-POSITION；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-SERIAL, GR-UNKNOWN

### LOCAL-PLAT-CONTEXT-SWITCH-S3

合法切换刷新准确范围，系统退出按实际会话结果回登录；不主动取消已受理后台任务；撤权有限收尾另走原机制

读取：FIELD-PLAT-CURRENT-TENANT, FIELD-PLAT-SESSION, FIELD-PLAT-GUARD-STATE, FIELD-PLAT-POSITION；写入：FIELD-PLAT-CURRENT-TENANT, FIELD-PLAT-POSITION

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-SERIAL, GR-UNKNOWN

## 分支与异常

### LOCAL-PLAT-CONTEXT-SWITCH-B1

条件：前提、字段及对象修订校验通过且结果明确成功

结果：身份及普通草稿条件满足则正常离开，不弹强制电话退出；失败/未知会话结果仍据真实反馈处理

涉及字段：FIELD-PLAT-CURRENT-TENANT, FIELD-PLAT-SESSION, FIELD-PLAT-GUARD-STATE, FIELD-PLAT-POSITION

验证：CHECK-PLAT-CONTEXT-SWITCH

### LOCAL-PLAT-CONTEXT-SWITCH-B2

条件：无权/字段不合法/对象失效/修订冲突

结果：明确显示本次拒绝原因，保留可继续的输入和已确认原值，不作变更

涉及字段：FIELD-PLAT-CURRENT-TENANT, FIELD-PLAT-SESSION, FIELD-PLAT-GUARD-STATE, FIELD-PLAT-POSITION

验证：CHECK-PLAT-CONTEXT-SWITCH

### LOCAL-PLAT-CONTEXT-SWITCH-B3

条件：提交失败或结果未知

结果：失败保留原确认值；未知显示待核并按同请求核对，不重复提交或假报成功

涉及字段：FIELD-PLAT-CURRENT-TENANT, FIELD-PLAT-SESSION, FIELD-PLAT-GUARD-STATE, FIELD-PLAT-POSITION

验证：CHECK-PLAT-CONTEXT-SWITCH

## 完成后的状态

- 导航不改变业务归属或执行事实；目标范围/退出结果可核，电话状态本身不阻离开

## 字段定义

- [FIELD-PLAT-CURRENT-TENANT](../field-specs.md#FIELD-PLAT-CURRENT-TENANT)
- [FIELD-PLAT-GUARD-STATE](../field-specs.md#FIELD-PLAT-GUARD-STATE)
- [FIELD-PLAT-POSITION](../field-specs.md#FIELD-PLAT-POSITION)
- [FIELD-PLAT-SESSION](../field-specs.md#FIELD-PLAT-SESSION)

## 来源与验证

来源条目：acceptance:AC-2011, acceptance:AC-2012, acceptance:AC-2013, acceptance:AC-2014, acceptance:AC-2015, acceptance:AC-2138, features:FUNC-2003, features:FUNC-2003/behavior_spec/0/branches/0, features:FUNC-2003/behavior_spec/0/branches/1, features:FUNC-2003/behavior_spec/0/branches/2, features:FUNC-2003/behavior_spec/0/postconditions/0, features:FUNC-2003/behavior_spec/0/preconditions/0, features:FUNC-2003/behavior_spec/0/preconditions/1, features:FUNC-2003/behavior_spec/0/steps/0, features:FUNC-2003/behavior_spec/0/steps/1, features:FUNC-2003/behavior_spec/0/steps/2, pages:PAGE-2001/fields/0, pages:PAGE-2001/fields/1, pages:PAGE-2001/fields/4, pages:PAGE-2001/fields/5, pages:PAGE-2002, pages:PAGE-2002/actions/0, pages:PAGE-2002/actions/1, pages:PAGE-2002/actions/2, pages:PAGE-2002/actions/3, pages:PAGE-2002/actions/5, pages:PAGE-2002/actions/6, pages:PAGE-2002/fields/0, pages:PAGE-2002/fields/1, pages:PAGE-2002/fields/3, pages:PAGE-2002/fields/5, pages:PAGE-2003/fields/4, pages:PAGE-2003/fields/5, pages:PAGE-2005/fields/10, pages:PAGE-2007/fields/19, pages:PAGE-2103/fields/8, pages:PAGE-2106/fields/14, pages:PAGE-2112/fields/27, pages:PAGE-2202/fields/10, pages:PAGE-2202/fields/35, pages:PAGE-2205/fields/7, pages:PAGE-2206/fields/7, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/181, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/182, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/183, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/184, scenarios:FLOW-CURRENT-PLATFORM/steps/2

验证：CHECK-PLAT-CONTEXT-SWITCH

## 实施任务

- [TASK-002](../tasks/TASK-002.md)
