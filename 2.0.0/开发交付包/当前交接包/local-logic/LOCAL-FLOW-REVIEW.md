# LOCAL-FLOW-REVIEW 核对同次未知请求

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md) · [全局逻辑](../global-logic.md)

- [保存本轮跟进、准确通话事实并唯一归档 · FUNC\-2032](../features/FUNC-2032.md)
- [判断并确认本租户后继节点 · FUNC\-2038](../features/FUNC-2038.md)

## 职责与触发

所属工程模块：未填写

功能：FUNC-2032, FUNC-2038

触发：从待核列表打开准确requestId

## 前置条件

- 仅原本可核人员或被明确移交的本租户核对人

## 必须遵守的全局规则

- [GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)
- [GR-AUTH](../global-logic.md#GR-AUTH)
- [GR-PRIVACY](../global-logic.md#GR-PRIVACY)
- [GR-DATA-FACTS](../global-logic.md#GR-DATA-FACTS)

## 输入与输出

输入：[FIELD-FLOW-REQUEST-ID](../field-specs.md#FIELD-FLOW-REQUEST-ID)、[FIELD-FLOW-REQUEST-STATUS](../field-specs.md#FIELD-FLOW-REQUEST-STATUS)

输出：[FIELD-FLOW-REQUEST-STATUS](../field-specs.md#FIELD-FLOW-REQUEST-STATUS)、[FIELD-FLOW-WORK-STATE](../field-specs.md#FIELD-FLOW-WORK-STATE)

## 处理步骤

### STEP-FLOW-REVIEW-1

读取准确原请求实际状态及最小可见结果，unknown不当成功/失败

读取：FIELD-FLOW-REQUEST-ID；写入：FIELD-FLOW-REQUEST-STATUS

规则：GR-UNKNOWN, GR-AUTH, GR-PRIVACY, GR-DATA-FACTS

### STEP-FLOW-REVIEW-2

明确原已执行或未执行后只改变确认表达，不重办原动作

读取：FIELD-FLOW-REQUEST-STATUS；写入：FIELD-FLOW-REQUEST-STATUS, FIELD-FLOW-WORK-STATE

规则：GR-UNKNOWN, GR-AUTH, GR-PRIVACY, GR-DATA-FACTS

## 分支与异常

### BRANCH-FLOW-REVIEW-1

条件：仍unknown

结果：继续待核并保同身份，不释放占用或新request重发

涉及字段：FIELD-FLOW-REQUEST-ID, FIELD-FLOW-WORK-STATE

验证：CHECK-FLOW-REVIEW

### BRANCH-FLOW-REVIEW-2

条件：确认先前已成功

结果：返回原一次结果，不再建followup、转交或删模板

涉及字段：FIELD-FLOW-REQUEST-STATUS

验证：CHECK-FLOW-REVIEW

### BRANCH-FLOW-REVIEW-3

条件：核对人缺原业务权限

结果：只见最小请求，不授数据详情或原动作重放

涉及字段：FIELD-FLOW-REQUEST-ID

验证：CHECK-FLOW-REVIEW

## 完成后的状态

- 核对不是业务代办或人工结果代填

## 字段定义

- [FIELD-FLOW-REQUEST-ID](../field-specs.md#FIELD-FLOW-REQUEST-ID)
- [FIELD-FLOW-REQUEST-STATUS](../field-specs.md#FIELD-FLOW-REQUEST-STATUS)
- [FIELD-FLOW-WORK-STATE](../field-specs.md#FIELD-FLOW-WORK-STATE)

## 来源与验证

来源条目：acceptance:AC-2122, features:FUNC-2032, features:FUNC-2032/behavior_spec/6/branches/0, features:FUNC-2032/behavior_spec/6/branches/1, features:FUNC-2032/behavior_spec/6/branches/2, features:FUNC-2032/behavior_spec/6/postconditions/0, features:FUNC-2032/behavior_spec/6/preconditions/0, features:FUNC-2032/behavior_spec/6/steps/0, features:FUNC-2032/behavior_spec/6/steps/1, features:FUNC-2038, features:FUNC-2038/behavior_spec/5/branches/0, features:FUNC-2038/behavior_spec/5/branches/1, features:FUNC-2038/behavior_spec/5/branches/2, features:FUNC-2038/behavior_spec/5/postconditions/0, features:FUNC-2038/behavior_spec/5/preconditions/0, features:FUNC-2038/behavior_spec/5/steps/0, features:FUNC-2038/behavior_spec/5/steps/1, pages:PAGE-2006, pages:PAGE-2006/fields/38, pages:PAGE-2006/fields/39, pages:PAGE-2006/fields/54, pages:PAGE-2203/fields/54, pages:PAGE-2204, pages:PAGE-2204/fields/50, pages:PAGE-2204/fields/51, pages:PAGE-2204/fields/65, pages:PAGE-2226/fields/34, pages:PAGE-2227, pages:PAGE-2227/fields/118, pages:PAGE-2227/fields/81, pages:PAGE-2227/fields/82, pages:PAGE-2228, pages:PAGE-2228/fields/17, pages:PAGE-2228/fields/18, pages:PAGE-2228/fields/31, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/120, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/121, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/123, scenarios:FLOW-CURRENT-CUSTOMER/steps/35

验证：CHECK-FLOW-REVIEW

## 实施任务

- [TASK-029](../tasks/TASK-029.md)
