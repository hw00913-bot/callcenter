# LOCAL-FLOW-FIELD-STATUS 停启字段或选项

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md) · [全局逻辑](../global-logic.md)

- [维护品牌共用业务分类、字段及取数规则 · FUNC\-2017](../features/FUNC-2017.md)

## 职责与触发

所属工程模块：未填写

功能：FUNC-2017

触发：确认字段或选项启停

## 前置条件

- 当前品牌及配置管理资格真实有效
- 提交来源与当前上下文一致

## 必须遵守的全局规则

- [GR-FIELDS](../global-logic.md#GR-FIELDS)
- [GR-CONFIG](../global-logic.md#GR-CONFIG)
- [GR-AUTH](../global-logic.md#GR-AUTH)

## 输入与输出

输入：[FIELD-FLOW-FIELD-ID](../field-specs.md#FIELD-FLOW-FIELD-ID)、[FIELD-FLOW-FIELD-ENABLED](../field-specs.md#FIELD-FLOW-FIELD-ENABLED)、[FIELD-FLOW-FIELD-OPTIONS](../field-specs.md#FIELD-FLOW-FIELD-OPTIONS)、[FIELD-FLOW-OPTION-ID](../field-specs.md#FIELD-FLOW-OPTION-ID)、[FIELD-FLOW-OPTION-LABEL](../field-specs.md#FIELD-FLOW-OPTION-LABEL)、[FIELD-FLOW-OPTION-KEY](../field-specs.md#FIELD-FLOW-OPTION-KEY)、[FIELD-FLOW-OPTION-ENABLED](../field-specs.md#FIELD-FLOW-OPTION-ENABLED)

输出：[FIELD-FLOW-FIELD-ENABLED](../field-specs.md#FIELD-FLOW-FIELD-ENABLED)、[FIELD-FLOW-FIELD-OPTIONS](../field-specs.md#FIELD-FLOW-FIELD-OPTIONS)

## 处理步骤

### STEP-FLOW-FIELD-STATUS-1

核有效分类/接口依赖及预置统计保护

读取：FIELD-FLOW-FIELD-ID, FIELD-FLOW-FIELD-ENABLED, FIELD-FLOW-FIELD-OPTIONS, FIELD-FLOW-DICTIONARY-ID, FIELD-FLOW-SELECTION-MODE, FIELD-FLOW-QUERY-CONDITIONS, FIELD-FLOW-FIELD-DEPENDS, FIELD-FLOW-PARAM-BINDINGS；写入：无

规则：GR-FIELDS, GR-CONFIG, GR-AUTH

### STEP-FLOW-FIELD-STATUS-2

只更新获允许状态，不删除稳定身份

读取：FIELD-FLOW-FIELD-ENABLED, FIELD-FLOW-FIELD-OPTIONS；写入：FIELD-FLOW-FIELD-ENABLED, FIELD-FLOW-FIELD-OPTIONS

规则：GR-FIELDS, GR-CONFIG, GR-AUTH

## 分支与异常

### BRANCH-FLOW-FIELD-STATUS-1

条件：停用破坏已启用分类依赖或为受保护预置选项

结果：明确拒绝，原状态保持

涉及字段：FIELD-FLOW-FIELD-ENABLED, FIELD-FLOW-OPTION-ENABLED

验证：CHECK-FLOW-FIELD-STATUS

### BRANCH-FLOW-FIELD-STATUS-2

条件：允许状态变化

结果：新选择候选更新，旧快照和已知值仍可按当时定义显示

涉及字段：FIELD-FLOW-FIELD-ENABLED, FIELD-FLOW-OPTION-ENABLED

验证：CHECK-FLOW-FIELD-STATUS

## 完成后的状态

- 停用不绕过引用删除保护

## 字段定义

- [FIELD-FLOW-FIELD-ID](../field-specs.md#FIELD-FLOW-FIELD-ID)
- [FIELD-FLOW-FIELD-ENABLED](../field-specs.md#FIELD-FLOW-FIELD-ENABLED)
- [FIELD-FLOW-FIELD-OPTIONS](../field-specs.md#FIELD-FLOW-FIELD-OPTIONS)
- [FIELD-FLOW-OPTION-ID](../field-specs.md#FIELD-FLOW-OPTION-ID)
- [FIELD-FLOW-OPTION-LABEL](../field-specs.md#FIELD-FLOW-OPTION-LABEL)
- [FIELD-FLOW-OPTION-KEY](../field-specs.md#FIELD-FLOW-OPTION-KEY)
- [FIELD-FLOW-OPTION-ENABLED](../field-specs.md#FIELD-FLOW-OPTION-ENABLED)
- [FIELD-FLOW-DICTIONARY-ID](../field-specs.md#FIELD-FLOW-DICTIONARY-ID)
- [FIELD-FLOW-SELECTION-MODE](../field-specs.md#FIELD-FLOW-SELECTION-MODE)
- [FIELD-FLOW-QUERY-CONDITIONS](../field-specs.md#FIELD-FLOW-QUERY-CONDITIONS)
- [FIELD-FLOW-FIELD-DEPENDS](../field-specs.md#FIELD-FLOW-FIELD-DEPENDS)
- [FIELD-FLOW-PARAM-BINDINGS](../field-specs.md#FIELD-FLOW-PARAM-BINDINGS)

## 来源与验证

来源条目：acceptance:AC-2041, acceptance:AC-2042, features:FUNC-2017, features:FUNC-2017/behavior_spec/1/branches/0, features:FUNC-2017/behavior_spec/1/branches/1, features:FUNC-2017/behavior_spec/1/postconditions/0, features:FUNC-2017/behavior_spec/1/preconditions/0, features:FUNC-2017/behavior_spec/1/preconditions/1, features:FUNC-2017/behavior_spec/1/steps/0, features:FUNC-2017/behavior_spec/1/steps/1, pages:PAGE-2006/fields/10, pages:PAGE-2006/fields/16, pages:PAGE-2006/fields/17, pages:PAGE-2006/fields/18, pages:PAGE-2006/fields/21, pages:PAGE-2006/fields/31, pages:PAGE-2006/fields/32, pages:PAGE-2006/fields/33, pages:PAGE-2006/fields/34, pages:PAGE-2006/fields/35, pages:PAGE-2006/fields/36, pages:PAGE-2006/fields/49, pages:PAGE-2203/fields/15, pages:PAGE-2203/fields/16, pages:PAGE-2203/fields/17, pages:PAGE-2203/fields/33, pages:PAGE-2203/fields/38, pages:PAGE-2203/fields/44, pages:PAGE-2223, pages:PAGE-2223/fields/10, pages:PAGE-2223/fields/14, pages:PAGE-2223/fields/15, pages:PAGE-2223/fields/16, pages:PAGE-2223/fields/19, pages:PAGE-2223/fields/23, pages:PAGE-2223/fields/24, pages:PAGE-2223/fields/25, pages:PAGE-2223/fields/26, pages:PAGE-2223/fields/27, pages:PAGE-2223/fields/28, pages:PAGE-2223/fields/29, pages:PAGE-2227/fields/101, pages:PAGE-2227/fields/29, pages:PAGE-2227/fields/40, pages:PAGE-2227/fields/41, pages:PAGE-2227/fields/68, pages:PAGE-2227/fields/74, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/1, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/10, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/11, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/12, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/13, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/14, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/15, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/16, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/6, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/7, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/8, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/9, scenarios:FLOW-CURRENT-CUSTOMER/steps/2

验证：CHECK-FLOW-FIELD-STATUS

## 实施任务

- [TASK-008](../tasks/TASK-008.md)
