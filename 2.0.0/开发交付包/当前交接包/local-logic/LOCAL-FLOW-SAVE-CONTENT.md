# LOCAL-FLOW-SAVE-CONTENT 实际办理人正式保存本轮内容

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md) · [全局逻辑](../global-logic.md)

- [保存本轮跟进、准确通话事实并唯一归档 · FUNC\-2032](../features/FUNC-2032.md)

## 职责与触发

所属工程模块：未填写

功能：FUNC-2032

触发：实际拨打/接听人从准确原段表单正式保存

## 前置条件

- 原段已结束，仍未contentSaved
- 提交者准确等于原实际办理/接听账号且tenant一致

## 必须遵守的全局规则

- [GR-DATA-FACTS](../global-logic.md#GR-DATA-FACTS)
- [GR-FIELDS](../global-logic.md#GR-FIELDS)
- [GR-AUTH](../global-logic.md#GR-AUTH)
- [GR-PRIVACY](../global-logic.md#GR-PRIVACY)
- [GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)
- [GR-HANDLING-MODE](../global-logic.md#GR-HANDLING-MODE)

## 输入与输出

输入：[FIELD-FLOW-ACTIVITY-INTEREST](../field-specs.md#FIELD-FLOW-ACTIVITY-INTEREST)、[FIELD-FLOW-ACTUAL-ANSWER](../field-specs.md#FIELD-FLOW-ACTUAL-ANSWER)、[FIELD-FLOW-FOLLOWUP-ID](../field-specs.md#FIELD-FLOW-FOLLOWUP-ID)、[FIELD-FLOW-FOLLOWUP-SUMMARY](../field-specs.md#FIELD-FLOW-FOLLOWUP-SUMMARY)、[FIELD-FLOW-FORM-VALUES](../field-specs.md#FIELD-FLOW-FORM-VALUES)、[FIELD-FLOW-INTENTION-LEVEL](../field-specs.md#FIELD-FLOW-INTENTION-LEVEL)、[FIELD-FLOW-INTERESTED-ITEMS](../field-specs.md#FIELD-FLOW-INTERESTED-ITEMS)、[FIELD-FLOW-LEAD-LEVEL](../field-specs.md#FIELD-FLOW-LEAD-LEVEL)、[FIELD-FLOW-MAPPING-SERIES](../field-specs.md#FIELD-FLOW-MAPPING-SERIES)、[FIELD-FLOW-MODIFIED-FIELDS](../field-specs.md#FIELD-FLOW-MODIFIED-FIELDS)、[FIELD-FLOW-NEXT-SERVICE](../field-specs.md#FIELD-FLOW-NEXT-SERVICE)、[FIELD-FLOW-PARTICIPANTS](../field-specs.md#FIELD-FLOW-PARTICIPANTS)、[FIELD-FLOW-PLANNED-STORE](../field-specs.md#FIELD-FLOW-PLANNED-STORE)、[FIELD-FLOW-PLANNED-VISIT](../field-specs.md#FIELD-FLOW-PLANNED-VISIT)、[FIELD-FLOW-SERVICE-CONCERN](../field-specs.md#FIELD-FLOW-SERVICE-CONCERN)、[FIELD-FLOW-SERVICE-SATISFACTION](../field-specs.md#FIELD-FLOW-SERVICE-SATISFACTION)、[FIELD-FLOW-TESTDRIVE-INTENTION](../field-specs.md#FIELD-FLOW-TESTDRIVE-INTENTION)、[FIELD-FLOW-VALUE-CONFLICT](../field-specs.md#FIELD-FLOW-VALUE-CONFLICT)、[FIELD-FLOW-VALUE-SOURCES](../field-specs.md#FIELD-FLOW-VALUE-SOURCES)、[FIELD-FLOW-VISIT-INTENTION](../field-specs.md#FIELD-FLOW-VISIT-INTENTION)、[FIELD-FLOW-HANDLING-MODE](../field-specs.md#FIELD-FLOW-HANDLING-MODE)、[FIELD-FLOW-DIRECT-CYCLE-ID](../field-specs.md#FIELD-FLOW-DIRECT-CYCLE-ID)、[FIELD-FLOW-DIRECT-STATUS](../field-specs.md#FIELD-FLOW-DIRECT-STATUS)

输出：[FIELD-FLOW-CONTENT-SNAPSHOT](../field-specs.md#FIELD-FLOW-CONTENT-SNAPSHOT)、[FIELD-FLOW-CONTENT-SAVED](../field-specs.md#FIELD-FLOW-CONTENT-SAVED)、[FIELD-FLOW-CONFIRMED-FIELDS](../field-specs.md#FIELD-FLOW-CONFIRMED-FIELDS)、[FIELD-FLOW-ROUTING-FIELD-SNAPSHOT](../field-specs.md#FIELD-FLOW-ROUTING-FIELD-SNAPSHOT)、[FIELD-FLOW-FOLLOWUP-VALUES](../field-specs.md#FIELD-FLOW-FOLLOWUP-VALUES)

## 处理步骤

### STEP-FLOW-SAVE-CONTENT-1

使用本次basis实际展示定义，校必填/类型/选项和原businessType

读取：FIELD-FLOW-BASIS, FIELD-FLOW-FORM-VALUES；写入：无

规则：GR-DATA-FACTS, GR-FIELDS, GR-AUTH, GR-PRIVACY, GR-UNKNOWN

### STEP-FLOW-SAVE-CONTENT-2

比较开始后当前有效值差异，未确认则保草稿等待核对

读取：FIELD-FLOW-FORM-VALUES, FIELD-FLOW-MODIFIED-FIELDS, FIELD-FLOW-VALUE-CONFLICT；写入：无

规则：GR-DATA-FACTS, GR-FIELDS, GR-AUTH, GR-PRIVACY, GR-UNKNOWN

### STEP-FLOW-SAVE-CONTENT-3

同次封内容/修改/确认快照；仅准确当前owner/stage且同一办理模式身份的provided更新当前值；TEMPLATE另要求同run，DIRECT以准确直接段身份隔离

读取：FIELD-FLOW-BASIS, FIELD-FLOW-FORM-VALUES, FIELD-FLOW-MODIFIED-FIELDS, FIELD-FLOW-HANDLING-MODE；写入：FIELD-FLOW-CONTENT-SNAPSHOT, FIELD-FLOW-CONTENT-SAVED, FIELD-FLOW-CONFIRMED-FIELDS, FIELD-FLOW-ROUTING-FIELD-SNAPSHOT, FIELD-FLOW-FOLLOWUP-VALUES

规则：GR-DATA-FACTS, GR-FIELDS, GR-AUTH, GR-PRIVACY, GR-UNKNOWN, GR-HANDLING-MODE

### STEP-FLOW-SAVE-CONTENT-4

DIRECT沿准确record/owner/followup/attempt和实际办理人处理，同样保本人填写、正式快照、当前值权限及迟到隔离；无run/node不构造假模板身份。TEMPLATE仍核原准确run/node。

读取：FIELD-FLOW-HANDLING-MODE；写入：无

规则：GR-DATA-FACTS, GR-FIELDS, GR-AUTH, GR-PRIVACY, GR-UNKNOWN, GR-HANDLING-MODE

## 分支与异常

### BRANCH-FLOW-SAVE-CONTENT-1

条件：管理员/责任人但非实际人，或已正式保存

结果：拒代填/重写，原段快照不变

涉及字段：FIELD-FLOW-ACTUAL-HANDLER, FIELD-FLOW-CONTENT-SNAPSHOT

验证：CHECK-FLOW-SAVE-CONTENT

### BRANCH-FLOW-SAVE-CONTENT-2

条件：基础已知预填但未修改且正式确认

结果：可纳confirmed用于条件，modified仍为空，不要求重输

涉及字段：FIELD-FLOW-CONFIRMED-FIELDS, FIELD-FLOW-MODIFIED-FIELDS

验证：CHECK-FLOW-SAVE-CONTENT

### BRANCH-FLOW-SAVE-CONTENT-3

条件：基础absent默认空

结果：不成为已知人工确认；显式provided清空才known empty

涉及字段：FIELD-FLOW-ROUTING-FIELD-SNAPSHOT

验证：CHECK-FLOW-SAVE-CONTENT

### BRANCH-FLOW-SAVE-CONTENT-4

条件：并发当前值改变且无准确确认令牌

结果：保三方差异和输入，阻覆盖

涉及字段：FIELD-FLOW-VALUE-CONFLICT, FIELD-FLOW-FORM-VALUES

验证：CHECK-FLOW-SAVE-CONTENT

## 完成后的状态

- 内容保存成功不自动宣称整次执行完成

## 字段定义

- [FIELD-FLOW-ACTIVITY-INTEREST](../field-specs.md#FIELD-FLOW-ACTIVITY-INTEREST)
- [FIELD-FLOW-ACTUAL-ANSWER](../field-specs.md#FIELD-FLOW-ACTUAL-ANSWER)
- [FIELD-FLOW-FOLLOWUP-ID](../field-specs.md#FIELD-FLOW-FOLLOWUP-ID)
- [FIELD-FLOW-FOLLOWUP-SUMMARY](../field-specs.md#FIELD-FLOW-FOLLOWUP-SUMMARY)
- [FIELD-FLOW-FORM-VALUES](../field-specs.md#FIELD-FLOW-FORM-VALUES)
- [FIELD-FLOW-INTENTION-LEVEL](../field-specs.md#FIELD-FLOW-INTENTION-LEVEL)
- [FIELD-FLOW-INTERESTED-ITEMS](../field-specs.md#FIELD-FLOW-INTERESTED-ITEMS)
- [FIELD-FLOW-LEAD-LEVEL](../field-specs.md#FIELD-FLOW-LEAD-LEVEL)
- [FIELD-FLOW-MAPPING-SERIES](../field-specs.md#FIELD-FLOW-MAPPING-SERIES)
- [FIELD-FLOW-MODIFIED-FIELDS](../field-specs.md#FIELD-FLOW-MODIFIED-FIELDS)
- [FIELD-FLOW-NEXT-SERVICE](../field-specs.md#FIELD-FLOW-NEXT-SERVICE)
- [FIELD-FLOW-PARTICIPANTS](../field-specs.md#FIELD-FLOW-PARTICIPANTS)
- [FIELD-FLOW-PLANNED-STORE](../field-specs.md#FIELD-FLOW-PLANNED-STORE)
- [FIELD-FLOW-PLANNED-VISIT](../field-specs.md#FIELD-FLOW-PLANNED-VISIT)
- [FIELD-FLOW-SERVICE-CONCERN](../field-specs.md#FIELD-FLOW-SERVICE-CONCERN)
- [FIELD-FLOW-SERVICE-SATISFACTION](../field-specs.md#FIELD-FLOW-SERVICE-SATISFACTION)
- [FIELD-FLOW-TESTDRIVE-INTENTION](../field-specs.md#FIELD-FLOW-TESTDRIVE-INTENTION)
- [FIELD-FLOW-VALUE-CONFLICT](../field-specs.md#FIELD-FLOW-VALUE-CONFLICT)
- [FIELD-FLOW-VALUE-SOURCES](../field-specs.md#FIELD-FLOW-VALUE-SOURCES)
- [FIELD-FLOW-VISIT-INTENTION](../field-specs.md#FIELD-FLOW-VISIT-INTENTION)
- [FIELD-FLOW-HANDLING-MODE](../field-specs.md#FIELD-FLOW-HANDLING-MODE)
- [FIELD-FLOW-DIRECT-CYCLE-ID](../field-specs.md#FIELD-FLOW-DIRECT-CYCLE-ID)
- [FIELD-FLOW-DIRECT-STATUS](../field-specs.md#FIELD-FLOW-DIRECT-STATUS)
- [FIELD-FLOW-CONTENT-SNAPSHOT](../field-specs.md#FIELD-FLOW-CONTENT-SNAPSHOT)
- [FIELD-FLOW-CONTENT-SAVED](../field-specs.md#FIELD-FLOW-CONTENT-SAVED)
- [FIELD-FLOW-CONFIRMED-FIELDS](../field-specs.md#FIELD-FLOW-CONFIRMED-FIELDS)
- [FIELD-FLOW-ROUTING-FIELD-SNAPSHOT](../field-specs.md#FIELD-FLOW-ROUTING-FIELD-SNAPSHOT)
- [FIELD-FLOW-FOLLOWUP-VALUES](../field-specs.md#FIELD-FLOW-FOLLOWUP-VALUES)
- [FIELD-FLOW-BASIS](../field-specs.md#FIELD-FLOW-BASIS)
- [FIELD-FLOW-ACTUAL-HANDLER](../field-specs.md#FIELD-FLOW-ACTUAL-HANDLER)

## 来源与验证

来源条目：acceptance:AC-2092, acceptance:AC-2123, acceptance:AC-2135, features:FUNC-2032, features:FUNC-2032/behavior_spec/1/branches/0, features:FUNC-2032/behavior_spec/1/branches/1, features:FUNC-2032/behavior_spec/1/branches/2, features:FUNC-2032/behavior_spec/1/branches/3, features:FUNC-2032/behavior_spec/1/postconditions/0, features:FUNC-2032/behavior_spec/1/preconditions/0, features:FUNC-2032/behavior_spec/1/preconditions/1, features:FUNC-2032/behavior_spec/1/steps/0, features:FUNC-2032/behavior_spec/1/steps/1, features:FUNC-2032/behavior_spec/1/steps/2, features:FUNC-2032/behavior_spec/1/steps/3, pages:PAGE-2103/fields/33, pages:PAGE-2203, pages:PAGE-2203/fields/0, pages:PAGE-2203/fields/1, pages:PAGE-2203/fields/11, pages:PAGE-2203/fields/12, pages:PAGE-2203/fields/13, pages:PAGE-2203/fields/19, pages:PAGE-2203/fields/2, pages:PAGE-2203/fields/20, pages:PAGE-2203/fields/21, pages:PAGE-2203/fields/22, pages:PAGE-2203/fields/24, pages:PAGE-2203/fields/25, pages:PAGE-2203/fields/26, pages:PAGE-2203/fields/27, pages:PAGE-2203/fields/29, pages:PAGE-2203/fields/30, pages:PAGE-2203/fields/34, pages:PAGE-2203/fields/36, pages:PAGE-2203/fields/37, pages:PAGE-2203/fields/42, pages:PAGE-2203/fields/45, pages:PAGE-2203/fields/46, pages:PAGE-2203/fields/49, pages:PAGE-2203/fields/5, pages:PAGE-2203/fields/51, pages:PAGE-2203/fields/52, pages:PAGE-2203/fields/53, pages:PAGE-2203/fields/64, pages:PAGE-2203/fields/66, pages:PAGE-2204/fields/1, pages:PAGE-2204/fields/30, pages:PAGE-2204/fields/31, pages:PAGE-2204/fields/4, pages:PAGE-2204/fields/64, pages:PAGE-2204/fields/85, pages:PAGE-2204/fields/87, pages:PAGE-2205/fields/61, pages:PAGE-2223/fields/0, pages:PAGE-2223/fields/9, pages:PAGE-2226/fields/0, pages:PAGE-2226/fields/1, pages:PAGE-2226/fields/17, pages:PAGE-2226/fields/18, pages:PAGE-2226/fields/19, pages:PAGE-2226/fields/3, pages:PAGE-2226/fields/33, pages:PAGE-2226/fields/35, pages:PAGE-2226/fields/37, pages:PAGE-2226/fields/9, pages:PAGE-2227, pages:PAGE-2227/actions/3, pages:PAGE-2227/fields/0, pages:PAGE-2227/fields/102, pages:PAGE-2227/fields/103, pages:PAGE-2227/fields/113, pages:PAGE-2227/fields/115, pages:PAGE-2227/fields/116, pages:PAGE-2227/fields/117, pages:PAGE-2227/fields/138, pages:PAGE-2227/fields/140, pages:PAGE-2227/fields/18, pages:PAGE-2227/fields/2, pages:PAGE-2227/fields/20, pages:PAGE-2227/fields/21, pages:PAGE-2227/fields/3, pages:PAGE-2227/fields/43, pages:PAGE-2227/fields/44, pages:PAGE-2227/fields/45, pages:PAGE-2227/fields/46, pages:PAGE-2227/fields/53, pages:PAGE-2227/fields/54, pages:PAGE-2227/fields/55, pages:PAGE-2227/fields/56, pages:PAGE-2227/fields/58, pages:PAGE-2227/fields/60, pages:PAGE-2227/fields/69, pages:PAGE-2227/fields/71, pages:PAGE-2227/fields/72, pages:PAGE-2227/fields/9, pages:PAGE-2227/fields/90, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/129, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/130, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/131, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/132, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/133, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/134, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/135, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/136, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/137, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/138, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/139, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/140, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/141, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/142, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/143, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/144, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/148, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/150, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/151, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/66, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/83, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/85, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/87, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/88, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/89, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/90, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/91, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/92, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/95, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/96, scenarios:FLOW-CURRENT-CUSTOMER/steps/21

验证：CHECK-FLOW-SAVE-CONTENT

## 实施任务

- [TASK-020](../tasks/TASK-020.md)
