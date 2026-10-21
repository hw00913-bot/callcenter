# LOCAL-DICT-DISABLE 停用接口条目

**READY_FOR_ENGINEERING_DESIGN — 产品可交接，工程设计需补齐**

[返回阅读入口](../README.md) · [功能目录](../features/README.md) · [全局逻辑](../global-logic.md)

- [停用业务数据接口条目 · FUNC\-026](../features/FUNC-026.md)

## 职责与触发

所属工程模块：开发接手后确定

功能：FUNC-026

触发：超管明确停用指定条目

## 前置条件

- 当前账号、企业/租户/对象和处理阶段有对应权限；输入来自本局部声明的当前对象。
- 沿当前已确认范围执行；不借原型或历史ID扩张权限。

## 必须遵守的全局规则

- [BR-023](../global-logic.md#BR-023)
- [BR-024](../global-logic.md#BR-024)
- [BR-025](../global-logic.md#BR-025)

## 输入与输出

输入：[FIELD-DICT-ID](../field-specs.md#FIELD-DICT-ID)、[FIELD-DICT-ENABLED](../field-specs.md#FIELD-DICT-ENABLED)

输出：[FIELD-DICT-ENABLED](../field-specs.md#FIELD-DICT-ENABLED)

## 处理步骤

### LOCAL-DICT-DISABLE-STEP-1

核对目标/权限及明确停用结果

读取：FIELD-DICT-ID, FIELD-DICT-ENABLED；写入：FIELD-DICT-ENABLED

规则：BR-023, BR-024, BR-025

### LOCAL-DICT-DISABLE-STEP-2

停止新查询/新选，使旧响应不能提供候选；保留配置、历史及未提交显示

读取：FIELD-DICT-ID, FIELD-DICT-ENABLED；写入：无

规则：BR-023, BR-024, BR-025

## 分支与异常

### LOCAL-DICT-DISABLE-BRANCH-1

条件：存在配置/历史/当前选择

结果：仍保留对象，未提交来源值不再作有效值

涉及字段：FIELD-DICT-ENABLED

验证：CHECK-130, CHECK-131

### LOCAL-DICT-DISABLE-BRANCH-2

条件：操作取消或保存异常

结果：维持原状态，不宣称停用成功

涉及字段：FIELD-DICT-ENABLED

验证：CHECK-130

## 完成后的状态

- 仅本次动作的合法结果生效；取消或核对/保存异常保留原对象与输入，不宣称成功。

## 字段定义

- [FIELD-DICT-ENABLED](../field-specs.md#FIELD-DICT-ENABLED)
- [FIELD-DICT-ID](../field-specs.md#FIELD-DICT-ID)

## 来源与验证

来源条目：acceptance:AC-123, acceptance:AC-130, acceptance:AC-131, features:FUNC-026, features:FUNC-026/boundary/business_rules/0, features:FUNC-026/boundary/business_rules/1, features:FUNC-026/boundary/business_rules/2, features:FUNC-026/boundary/exception_paths/0, features:FUNC-026/boundary/exception_paths/1, flows:FLOW-005, flows:FLOW-005/steps/0, flows:FLOW-005/steps/1, flows:FLOW-005/steps/2, flows:FLOW-005/steps/3, flows:FLOW-005/steps/4, interfaces:API-017, pages:PAGE-006, pages:PAGE-006/actions/0, pages:PAGE-006/actions/1, pages:PAGE-006/actions/2, pages:PAGE-006/actions/3, pages:PAGE-006/actions/4, pages:PAGE-006/actions/5, pages:PAGE-006/fields/0, pages:PAGE-006/fields/1, pages:PAGE-006/fields/2, pages:PAGE-006/fields/3, rules:BR-023, rules:BR-024, rules:BR-025, scenarios:SC-010, scenarios:SC-010/alternate_flows/0, scenarios:SC-010/alternate_flows/0/steps/0, scenarios:SC-010/alternate_flows/1, scenarios:SC-010/alternate_flows/1/steps/0, scenarios:SC-010/alternate_flows/1/steps/1, scenarios:SC-010/main_flow/0, scenarios:SC-010/main_flow/1, scenarios:SC-010/main_flow/2, scenarios:SC-010/main_flow/3, scenarios:SC-010/main_flow/4, scenarios:SC-010/postconditions/0, scenarios:SC-010/postconditions/1, scenarios:SC-010/postconditions/2, scenarios:SC-010/preconditions/0, scenarios:SC-010/preconditions/1, sequences:SEQ-012, sequences:SEQ-012/messages/0, sequences:SEQ-012/messages/1, sequences:SEQ-012/messages/10, sequences:SEQ-012/messages/11, sequences:SEQ-012/messages/12, sequences:SEQ-012/messages/13, sequences:SEQ-012/messages/14, sequences:SEQ-012/messages/15, sequences:SEQ-012/messages/2, sequences:SEQ-012/messages/3, sequences:SEQ-012/messages/4, sequences:SEQ-012/messages/5, sequences:SEQ-012/messages/6, sequences:SEQ-012/messages/7, sequences:SEQ-012/messages/8, sequences:SEQ-012/messages/9, stories:US-013, stories:US-013/preconditions/0, stories:US-013/preconditions/1, stories:US-014, stories:US-014/preconditions/0, stories:US-019, stories:US-019/preconditions/0, stories:US-019/preconditions/1

验证：CHECK-130, CHECK-131, CHECK-123

## 实施任务

未声明；请结合范围说明核对。
