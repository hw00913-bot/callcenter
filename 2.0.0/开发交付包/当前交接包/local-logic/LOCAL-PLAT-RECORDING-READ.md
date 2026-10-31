# LOCAL-PLAT-RECORDING-READ 播放、暂停和定位有权录音

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md) · [全局逻辑](../global-logic.md)

- [进入有权工作位置与保留专业能力 · FUNC\-2002](../features/FUNC-2002.md)

## 职责与触发

所属工程模块：未填写

功能：FUNC-2002

触发：在通话/跟进详情点击录音播放、暂停或拖动

## 前置条件

- 五角色中有对应通话读权；录音确实存在可解析

## 必须遵守的全局规则

- [GR-IDENTITY](../global-logic.md#GR-IDENTITY)
- [GR-SCOPE](../global-logic.md#GR-SCOPE)
- [GR-AUTH](../global-logic.md#GR-AUTH)
- [GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)
- [GR-LIST-ORDER](../global-logic.md#GR-LIST-ORDER)

## 输入与输出

输入：[FIELD-PLAT-CALL-ID](../field-specs.md#FIELD-PLAT-CALL-ID)、[FIELD-PLAT-RECORDING](../field-specs.md#FIELD-PLAT-RECORDING)

输出：[FIELD-PLAT-RECORDING](../field-specs.md#FIELD-PLAT-RECORDING)

## 处理步骤

### LOCAL-PLAT-RECORDING-READ-S1

按准确callId重新检查对象读权后取得受控录音

读取：FIELD-PLAT-CALL-ID, FIELD-PLAT-RECORDING；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

### LOCAL-PLAT-RECORDING-READ-S2

播放/暂停/seek只改变本次播放位置，不要求编辑权

读取：FIELD-PLAT-CALL-ID, FIELD-PLAT-RECORDING；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

### LOCAL-PLAT-RECORDING-READ-S3

无录音/过期/网络失败/失权分别显示，不暴露其他租户录音

读取：FIELD-PLAT-CALL-ID, FIELD-PLAT-RECORDING；写入：FIELD-PLAT-RECORDING

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

## 分支与异常

### LOCAL-PLAT-RECORDING-READ-B1

条件：前提、字段及对象修订校验通过且结果明确成功

结果：有权用户按读权使用录音；失败不修改通话和跟进事实

涉及字段：FIELD-PLAT-CALL-ID, FIELD-PLAT-RECORDING

验证：CHECK-PLAT-RECORDING-READ

### LOCAL-PLAT-RECORDING-READ-B2

条件：无权/字段不合法/对象失效/修订冲突

结果：明确显示本次拒绝原因，保留可继续的输入和已确认原值，不作变更

涉及字段：FIELD-PLAT-CALL-ID, FIELD-PLAT-RECORDING

验证：CHECK-PLAT-RECORDING-READ

### LOCAL-PLAT-RECORDING-READ-B3

条件：提交失败或结果未知

结果：失败保留原确认值；未知显示待核并按同请求核对，不重复提交或假报成功

涉及字段：FIELD-PLAT-CALL-ID, FIELD-PLAT-RECORDING

验证：CHECK-PLAT-RECORDING-READ

## 完成后的状态

- 有权用户按读权使用录音；失败不修改通话和跟进事实

## 字段定义

- [FIELD-PLAT-CALL-ID](../field-specs.md#FIELD-PLAT-CALL-ID)
- [FIELD-PLAT-RECORDING](../field-specs.md#FIELD-PLAT-RECORDING)

## 来源与验证

来源条目：acceptance:AC-2063, acceptance:AC-2064, acceptance:AC-2066, acceptance:AC-2072, features:FUNC-2002, features:FUNC-2002/behavior_spec/10/branches/0, features:FUNC-2002/behavior_spec/10/branches/1, features:FUNC-2002/behavior_spec/10/branches/2, features:FUNC-2002/behavior_spec/10/postconditions/0, features:FUNC-2002/behavior_spec/10/preconditions/0, features:FUNC-2002/behavior_spec/10/steps/0, features:FUNC-2002/behavior_spec/10/steps/1, features:FUNC-2002/behavior_spec/10/steps/2, pages:PAGE-2007/fields/18, pages:PAGE-2108, pages:PAGE-2108/fields/12, pages:PAGE-2108/fields/17, pages:PAGE-2109, pages:PAGE-2109/fields/4, pages:PAGE-2109/fields/8, pages:PAGE-2111/fields/13, pages:PAGE-2202, pages:PAGE-2202/fields/27, pages:PAGE-2202/fields/7, pages:PAGE-2203, pages:PAGE-2203/fields/55, pages:PAGE-2203/fields/62, pages:PAGE-2204/fields/72, pages:PAGE-2205/fields/4, pages:PAGE-2206/fields/4, pages:PAGE-2207/fields/2, pages:PAGE-2208, pages:PAGE-2208/fields/2, pages:PAGE-2208/fields/7, pages:PAGE-2209/fields/0, pages:PAGE-2220/fields/8, pages:PAGE-2221/fields/2, pages:PAGE-2227, pages:PAGE-2227/fields/126, pages:PAGE-2227/fields/135, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/215, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/219, scenarios:FLOW-CURRENT-PLATFORM/steps/30

验证：CHECK-PLAT-RECORDING-READ

## 实施任务

- [TASK-036](../tasks/TASK-036.md)
