# LOCAL-FLOW-HANDLER-INBOX 实际接听人最小原段待填写入口

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md) · [全局逻辑](../global-logic.md)

- [保存本轮跟进、准确通话事实并唯一归档 · FUNC\-2032](../features/FUNC-2032.md)
- [查看业务、运行和有权跟进通话详情 · FUNC\-2033](../features/FUNC-2033.md)

## 职责与触发

所属工程模块：未填写

功能：FUNC-2032, FUNC-2033

触发：实际办理/接听人打开自己的准确待填跟进

## 前置条件

- 本租户本账号真实关联该已结束未提交人工段

## 必须遵守的全局规则

- [GR-AUTH](../global-logic.md#GR-AUTH)
- [GR-PRIVACY](../global-logic.md#GR-PRIVACY)
- [GR-SCOPE](../global-logic.md#GR-SCOPE)
- [GR-DATA-FACTS](../global-logic.md#GR-DATA-FACTS)
- [GR-HANDLING-MODE](../global-logic.md#GR-HANDLING-MODE)

## 输入与输出

输入：[FIELD-FLOW-ACTUAL-ANSWER](../field-specs.md#FIELD-FLOW-ACTUAL-ANSWER)、[FIELD-FLOW-ACTUAL-HANDLER](../field-specs.md#FIELD-FLOW-ACTUAL-HANDLER)、[FIELD-FLOW-FOLLOWUP-ID](../field-specs.md#FIELD-FLOW-FOLLOWUP-ID)、[FIELD-FLOW-FOLLOWUP-SUMMARY](../field-specs.md#FIELD-FLOW-FOLLOWUP-SUMMARY)、[FIELD-FLOW-HANDLING-MODE](../field-specs.md#FIELD-FLOW-HANDLING-MODE)、[FIELD-FLOW-DIRECT-CYCLE-ID](../field-specs.md#FIELD-FLOW-DIRECT-CYCLE-ID)、[FIELD-FLOW-DIRECT-STATUS](../field-specs.md#FIELD-FLOW-DIRECT-STATUS)、[FIELD-FLOW-MANUAL-ASSIGNMENT-MODE](../field-specs.md#FIELD-FLOW-MANUAL-ASSIGNMENT-MODE)

输出：[FIELD-FLOW-BASIS](../field-specs.md#FIELD-FLOW-BASIS)、[FIELD-FLOW-FORM-VALUES](../field-specs.md#FIELD-FLOW-FORM-VALUES)、[FIELD-FLOW-CONTENT-SNAPSHOT](../field-specs.md#FIELD-FLOW-CONTENT-SNAPSHOT)

## 处理步骤

### STEP-FLOW-HANDLER-INBOX-1

只列本人真实关联且未contentSaved原段，不要求整业务detail资格

读取：FIELD-FLOW-FOLLOWUP-ID, FIELD-FLOW-ACTUAL-HANDLER, FIELD-FLOW-CONTENT-SAVED；写入：无

规则：GR-AUTH, GR-PRIVACY, GR-SCOPE, GR-DATA-FACTS

### STEP-FLOW-HANDLER-INBOX-2

读取本次必要定义和资料，按原分类表单提交，再沿正式保存规则校验

读取：FIELD-FLOW-BASIS, FIELD-FLOW-FORM-VALUES；写入：FIELD-FLOW-CONTENT-SNAPSHOT

规则：GR-AUTH, GR-PRIVACY, GR-SCOPE, GR-DATA-FACTS

### STEP-FLOW-HANDLER-INBOX-3

DIRECT沿准确record/owner/followup/attempt和实际办理人处理，同样保本人填写、正式快照、当前值权限及迟到隔离；无run/node不构造假模板身份。TEMPLATE仍核原准确run/node。

读取：FIELD-FLOW-HANDLING-MODE, FIELD-FLOW-MANUAL-ASSIGNMENT-MODE；写入：无

规则：GR-AUTH, GR-PRIVACY, GR-SCOPE, GR-DATA-FACTS, GR-HANDLING-MODE

## 分支与异常

### BRANCH-FLOW-HANDLER-INBOX-1

条件：只是责任人/管理员/核对人

结果：不取得代填权，保持原缺内容事实

涉及字段：FIELD-FLOW-ACTUAL-HANDLER

验证：CHECK-FLOW-HANDLER-INBOX

### BRANCH-FLOW-HANDLER-INBOX-2

条件：本人有效关联且未保存

结果：给最小表单，保存成功后移出待填写

涉及字段：FIELD-FLOW-CONTENT-SAVED, FIELD-FLOW-FORM-VALUES

验证：CHECK-FLOW-HANDLER-INBOX

## 完成后的状态

- 无自动全档案权或其他业务查阅权

## 字段定义

- [FIELD-FLOW-ACTUAL-ANSWER](../field-specs.md#FIELD-FLOW-ACTUAL-ANSWER)
- [FIELD-FLOW-ACTUAL-HANDLER](../field-specs.md#FIELD-FLOW-ACTUAL-HANDLER)
- [FIELD-FLOW-FOLLOWUP-ID](../field-specs.md#FIELD-FLOW-FOLLOWUP-ID)
- [FIELD-FLOW-FOLLOWUP-SUMMARY](../field-specs.md#FIELD-FLOW-FOLLOWUP-SUMMARY)
- [FIELD-FLOW-HANDLING-MODE](../field-specs.md#FIELD-FLOW-HANDLING-MODE)
- [FIELD-FLOW-DIRECT-CYCLE-ID](../field-specs.md#FIELD-FLOW-DIRECT-CYCLE-ID)
- [FIELD-FLOW-DIRECT-STATUS](../field-specs.md#FIELD-FLOW-DIRECT-STATUS)
- [FIELD-FLOW-MANUAL-ASSIGNMENT-MODE](../field-specs.md#FIELD-FLOW-MANUAL-ASSIGNMENT-MODE)
- [FIELD-FLOW-BASIS](../field-specs.md#FIELD-FLOW-BASIS)
- [FIELD-FLOW-FORM-VALUES](../field-specs.md#FIELD-FLOW-FORM-VALUES)
- [FIELD-FLOW-CONTENT-SNAPSHOT](../field-specs.md#FIELD-FLOW-CONTENT-SNAPSHOT)
- [FIELD-FLOW-CONTENT-SAVED](../field-specs.md#FIELD-FLOW-CONTENT-SAVED)

## 来源与验证

来源条目：acceptance:AC-2092, acceptance:AC-2132, features:FUNC-2032, features:FUNC-2032/behavior_spec/5/branches/0, features:FUNC-2032/behavior_spec/5/branches/1, features:FUNC-2032/behavior_spec/5/postconditions/0, features:FUNC-2032/behavior_spec/5/preconditions/0, features:FUNC-2032/behavior_spec/5/steps/0, features:FUNC-2032/behavior_spec/5/steps/1, features:FUNC-2032/behavior_spec/5/steps/2, features:FUNC-2033, features:FUNC-2033/behavior_spec/2/branches/0, features:FUNC-2033/behavior_spec/2/branches/1, features:FUNC-2033/behavior_spec/2/postconditions/0, features:FUNC-2033/behavior_spec/2/preconditions/0, features:FUNC-2033/behavior_spec/2/steps/0, features:FUNC-2033/behavior_spec/2/steps/1, features:FUNC-2033/behavior_spec/2/steps/2, pages:PAGE-2103/fields/33, pages:PAGE-2203, pages:PAGE-2203/fields/1, pages:PAGE-2203/fields/12, pages:PAGE-2203/fields/13, pages:PAGE-2203/fields/19, pages:PAGE-2203/fields/2, pages:PAGE-2203/fields/20, pages:PAGE-2203/fields/22, pages:PAGE-2203/fields/5, pages:PAGE-2203/fields/64, pages:PAGE-2203/fields/66, pages:PAGE-2204/fields/1, pages:PAGE-2204/fields/30, pages:PAGE-2204/fields/4, pages:PAGE-2204/fields/85, pages:PAGE-2204/fields/87, pages:PAGE-2204/fields/95, pages:PAGE-2205/fields/61, pages:PAGE-2223/fields/0, pages:PAGE-2223/fields/9, pages:PAGE-2226/fields/0, pages:PAGE-2226/fields/1, pages:PAGE-2226/fields/17, pages:PAGE-2226/fields/18, pages:PAGE-2226/fields/3, pages:PAGE-2226/fields/35, pages:PAGE-2226/fields/37, pages:PAGE-2226/fields/43, pages:PAGE-2226/fields/9, pages:PAGE-2227, pages:PAGE-2227/fields/138, pages:PAGE-2227/fields/140, pages:PAGE-2227/fields/148, pages:PAGE-2227/fields/2, pages:PAGE-2227/fields/20, pages:PAGE-2227/fields/21, pages:PAGE-2227/fields/3, pages:PAGE-2227/fields/43, pages:PAGE-2227/fields/44, pages:PAGE-2227/fields/46, pages:PAGE-2227/fields/9, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/142, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/143, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/148, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/150, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/151, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/166, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/83, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/85, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/87, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/88, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/91, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/92, scenarios:FLOW-CURRENT-CUSTOMER/steps/34

验证：CHECK-FLOW-HANDLER-INBOX

## 实施任务

- [TASK-020](../tasks/TASK-020.md)
