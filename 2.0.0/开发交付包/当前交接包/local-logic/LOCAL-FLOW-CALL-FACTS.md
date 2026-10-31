# LOCAL-FLOW-CALL-FACTS 登记准确执行和通话回执

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md) · [全局逻辑](../global-logic.md)

- [保存本轮跟进、准确通话事实并唯一归档 · FUNC\-2032](../features/FUNC-2032.md)

## 职责与触发

所属工程模块：未填写

功能：FUNC-2032

触发：外部执行事实或本地明确模拟事件到达

## 前置条件

- 原执行段/尝试身份可唯一关联
- 事实来源授权与原tenant/method一致

## 必须遵守的全局规则

- [GR-DATA-FACTS](../global-logic.md#GR-DATA-FACTS)
- [GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)
- [GR-SERIAL](../global-logic.md#GR-SERIAL)
- [GR-PRIVACY](../global-logic.md#GR-PRIVACY)
- [GR-HANDLING-MODE](../global-logic.md#GR-HANDLING-MODE)
- [GR-CUSTOMER-SIP](../global-logic.md#GR-CUSTOMER-SIP)

## 输入与输出

输入：[FIELD-FLOW-ACTUAL-ANSWER](../field-specs.md#FIELD-FLOW-ACTUAL-ANSWER)、[FIELD-FLOW-ATTEMPT-ID](../field-specs.md#FIELD-FLOW-ATTEMPT-ID)、[FIELD-FLOW-CALL-STATE](../field-specs.md#FIELD-FLOW-CALL-STATE)、[FIELD-FLOW-CUSTOMER-ANSWERED](../field-specs.md#FIELD-FLOW-CUSTOMER-ANSWERED)、[FIELD-FLOW-DIALED](../field-specs.md#FIELD-FLOW-DIALED)、[FIELD-FLOW-DIALED-AT](../field-specs.md#FIELD-FLOW-DIALED-AT)、[FIELD-FLOW-EVENT-ID](../field-specs.md#FIELD-FLOW-EVENT-ID)、[FIELD-FLOW-FOLLOWUP-ID](../field-specs.md#FIELD-FLOW-FOLLOWUP-ID)、[FIELD-FLOW-HUMAN-ANSWER](../field-specs.md#FIELD-FLOW-HUMAN-ANSWER)、[FIELD-FLOW-PROVIDER-CALL-ID](../field-specs.md#FIELD-FLOW-PROVIDER-CALL-ID)、[FIELD-FLOW-RETRIES-COMPLETE](../field-specs.md#FIELD-FLOW-RETRIES-COMPLETE)、[FIELD-FLOW-ROUTING-EVIDENCE](../field-specs.md#FIELD-FLOW-ROUTING-EVIDENCE)、[FIELD-FLOW-TAG-EVIDENCE](../field-specs.md#FIELD-FLOW-TAG-EVIDENCE)、[FIELD-FLOW-HANDLING-MODE](../field-specs.md#FIELD-FLOW-HANDLING-MODE)、[FIELD-FLOW-DIRECT-CYCLE-ID](../field-specs.md#FIELD-FLOW-DIRECT-CYCLE-ID)、[FIELD-FLOW-DIRECT-STATUS](../field-specs.md#FIELD-FLOW-DIRECT-STATUS)

输出：[FIELD-FLOW-CALLS](../field-specs.md#FIELD-FLOW-CALLS)、[FIELD-FLOW-EXECUTION-STATE](../field-specs.md#FIELD-FLOW-EXECUTION-STATE)、[FIELD-FLOW-ROUTING-EVIDENCE](../field-specs.md#FIELD-FLOW-ROUTING-EVIDENCE)、[FIELD-FLOW-TAG-EVIDENCE](../field-specs.md#FIELD-FLOW-TAG-EVIDENCE)

## 处理步骤

### STEP-FLOW-CALL-FACTS-1

按准确record/run/stage/nodeRun/followup/attempt归原事实，不凭号码或当前指针

读取：FIELD-FLOW-RECORD-ID, FIELD-FLOW-RUN-ID, FIELD-FLOW-STAGE-ID, FIELD-FLOW-NODE-RUN-ID, FIELD-FLOW-FOLLOWUP-ID, FIELD-FLOW-ATTEMPT-ID；写入：FIELD-FLOW-CALLS

规则：GR-DATA-FACTS, GR-UNKNOWN, GR-SERIAL, GR-PRIVACY

### STEP-FLOW-CALL-FACTS-2

区分受理/排队/实际dial/客户接通/实际人工身份/重试收敛

读取：FIELD-FLOW-DIALED, FIELD-FLOW-DIALED-AT, FIELD-FLOW-CUSTOMER-ANSWERED, FIELD-FLOW-HUMAN-ANSWER, FIELD-FLOW-RETRIES-COMPLETE；写入：FIELD-FLOW-CALLS, FIELD-FLOW-EXECUTION-STATE

规则：GR-DATA-FACTS, GR-UNKNOWN, GR-SERIAL, GR-PRIVACY

### STEP-FLOW-CALL-FACTS-3

标签事实只匹配实际sceneSnapshot七元组及合法命中子集，NONE准确空也是已知

读取：FIELD-FLOW-SCENE-SNAPSHOT, FIELD-FLOW-TAG-EVIDENCE；写入：FIELD-FLOW-ROUTING-EVIDENCE, FIELD-FLOW-TAG-EVIDENCE

规则：GR-DATA-FACTS, GR-UNKNOWN, GR-SERIAL, GR-PRIVACY

### STEP-FLOW-CALL-FACTS-4

DIRECT沿准确record/owner/followup/attempt和实际办理人处理，同样保本人填写、正式快照、当前值权限及迟到隔离；无run/node不构造假模板身份。TEMPLATE仍核原准确run/node。

读取：FIELD-FLOW-HANDLING-MODE；写入：无

规则：GR-DATA-FACTS, GR-UNKNOWN, GR-SERIAL, GR-PRIVACY, GR-HANDLING-MODE

## 分支与异常

### BRANCH-FLOW-CALL-FACTS-1

条件：同事件同内容重复

结果：读原结果，不重复拨打、接通、跟进计数

涉及字段：FIELD-FLOW-EVENT-ID, FIELD-FLOW-STATISTICS

验证：CHECK-FLOW-CALL-FACTS

### BRANCH-FLOW-CALL-FACTS-2

条件：相反终态/身份或其他scene回调

结果：保原事实，拒或冲突待核，不复活已结束通话

涉及字段：FIELD-FLOW-CALLS, FIELD-FLOW-ROUTING-EVIDENCE

验证：CHECK-FLOW-CALL-FACTS

### BRANCH-FLOW-CALL-FACTS-3

条件：迟到原段准确信息

结果：只补原段，不改新run/currentowner/已封内容

涉及字段：FIELD-FLOW-FOLLOWUP-ID, FIELD-FLOW-CONTENT-SNAPSHOT, FIELD-FLOW-EXECUTION-STATE

验证：CHECK-FLOW-CALL-FACTS

### BRANCH-FLOW-CALL-FACTS-ANSWER-PROOF

条件：预外呼仅登记坐席接听、客户接通未知或明确未接通，或同call出现相反明确接通回执

结果：未具同次真实客户接通和准确接听账号证据时不赋人工填写；未知不完成归档，明确未接通可系统事实归档；相反明确回执保原事实并标待核，阻止继续办理。

涉及字段：FIELD-FLOW-ACTUAL-ANSWER, FIELD-FLOW-CALLS, FIELD-FLOW-HUMAN-ANSWER

验证：CHECK-FLOW-CALL-FACTS

## 完成后的状态

- 普通AI可记录本轮实际新标签版本，不能用run旧catalog误拒准确可选标签事实

## 字段定义

- [FIELD-FLOW-ACTUAL-ANSWER](../field-specs.md#FIELD-FLOW-ACTUAL-ANSWER)
- [FIELD-FLOW-ATTEMPT-ID](../field-specs.md#FIELD-FLOW-ATTEMPT-ID)
- [FIELD-FLOW-CALL-STATE](../field-specs.md#FIELD-FLOW-CALL-STATE)
- [FIELD-FLOW-CALLS](../field-specs.md#FIELD-FLOW-CALLS)
- [FIELD-FLOW-CONTENT-SNAPSHOT](../field-specs.md#FIELD-FLOW-CONTENT-SNAPSHOT)
- [FIELD-FLOW-CUSTOMER-ANSWERED](../field-specs.md#FIELD-FLOW-CUSTOMER-ANSWERED)
- [FIELD-FLOW-DIALED](../field-specs.md#FIELD-FLOW-DIALED)
- [FIELD-FLOW-DIALED-AT](../field-specs.md#FIELD-FLOW-DIALED-AT)
- [FIELD-FLOW-DIRECT-CYCLE-ID](../field-specs.md#FIELD-FLOW-DIRECT-CYCLE-ID)
- [FIELD-FLOW-DIRECT-STATUS](../field-specs.md#FIELD-FLOW-DIRECT-STATUS)
- [FIELD-FLOW-EVENT-ID](../field-specs.md#FIELD-FLOW-EVENT-ID)
- [FIELD-FLOW-EXECUTION-STATE](../field-specs.md#FIELD-FLOW-EXECUTION-STATE)
- [FIELD-FLOW-FOLLOWUP-ID](../field-specs.md#FIELD-FLOW-FOLLOWUP-ID)
- [FIELD-FLOW-HANDLING-MODE](../field-specs.md#FIELD-FLOW-HANDLING-MODE)
- [FIELD-FLOW-HUMAN-ANSWER](../field-specs.md#FIELD-FLOW-HUMAN-ANSWER)
- [FIELD-FLOW-NODE-RUN-ID](../field-specs.md#FIELD-FLOW-NODE-RUN-ID)
- [FIELD-FLOW-PROVIDER-CALL-ID](../field-specs.md#FIELD-FLOW-PROVIDER-CALL-ID)
- [FIELD-FLOW-RECORD-ID](../field-specs.md#FIELD-FLOW-RECORD-ID)
- [FIELD-FLOW-RETRIES-COMPLETE](../field-specs.md#FIELD-FLOW-RETRIES-COMPLETE)
- [FIELD-FLOW-ROUTING-EVIDENCE](../field-specs.md#FIELD-FLOW-ROUTING-EVIDENCE)
- [FIELD-FLOW-RUN-ID](../field-specs.md#FIELD-FLOW-RUN-ID)
- [FIELD-FLOW-SCENE-SNAPSHOT](../field-specs.md#FIELD-FLOW-SCENE-SNAPSHOT)
- [FIELD-FLOW-STAGE-ID](../field-specs.md#FIELD-FLOW-STAGE-ID)
- [FIELD-FLOW-STATISTICS](../field-specs.md#FIELD-FLOW-STATISTICS)
- [FIELD-FLOW-TAG-EVIDENCE](../field-specs.md#FIELD-FLOW-TAG-EVIDENCE)

## 来源与验证

来源条目：acceptance:AC-2092, acceptance:AC-2122, acceptance:AC-2123, acceptance:AC-2144, features:FUNC-2032, features:FUNC-2032/behavior_spec/0/branches/0, features:FUNC-2032/behavior_spec/0/branches/1, features:FUNC-2032/behavior_spec/0/branches/2, features:FUNC-2032/behavior_spec/0/branches/3, features:FUNC-2032/behavior_spec/0/postconditions/0, features:FUNC-2032/behavior_spec/0/preconditions/0, features:FUNC-2032/behavior_spec/0/preconditions/1, features:FUNC-2032/behavior_spec/0/steps/0, features:FUNC-2032/behavior_spec/0/steps/1, features:FUNC-2032/behavior_spec/0/steps/2, features:FUNC-2032/behavior_spec/0/steps/3, pages:PAGE-2203/fields/1, pages:PAGE-2203/fields/13, pages:PAGE-2203/fields/19, pages:PAGE-2203/fields/23, pages:PAGE-2203/fields/39, pages:PAGE-2203/fields/40, pages:PAGE-2203/fields/41, pages:PAGE-2203/fields/43, pages:PAGE-2203/fields/47, pages:PAGE-2203/fields/48, pages:PAGE-2203/fields/64, pages:PAGE-2203/fields/66, pages:PAGE-2203/fields/9, pages:PAGE-2204/fields/26, pages:PAGE-2204/fields/30, pages:PAGE-2204/fields/43, pages:PAGE-2204/fields/48, pages:PAGE-2204/fields/56, pages:PAGE-2204/fields/58, pages:PAGE-2204/fields/59, pages:PAGE-2204/fields/61, pages:PAGE-2204/fields/85, pages:PAGE-2204/fields/87, pages:PAGE-2204/fields/9, pages:PAGE-2223/fields/9, pages:PAGE-2226/fields/0, pages:PAGE-2226/fields/15, pages:PAGE-2226/fields/17, pages:PAGE-2226/fields/28, pages:PAGE-2226/fields/29, pages:PAGE-2226/fields/31, pages:PAGE-2226/fields/35, pages:PAGE-2226/fields/37, pages:PAGE-2226/fields/7, pages:PAGE-2226/fields/9, pages:PAGE-2227, pages:PAGE-2227/actions/3, pages:PAGE-2227/fields/100, pages:PAGE-2227/fields/104, pages:PAGE-2227/fields/106, pages:PAGE-2227/fields/107, pages:PAGE-2227/fields/138, pages:PAGE-2227/fields/140, pages:PAGE-2227/fields/15, pages:PAGE-2227/fields/16, pages:PAGE-2227/fields/2, pages:PAGE-2227/fields/21, pages:PAGE-2227/fields/23, pages:PAGE-2227/fields/27, pages:PAGE-2227/fields/28, pages:PAGE-2227/fields/38, pages:PAGE-2227/fields/39, pages:PAGE-2227/fields/43, pages:PAGE-2227/fields/48, pages:PAGE-2227/fields/63, pages:PAGE-2227/fields/73, pages:PAGE-2227/fields/79, pages:PAGE-2227/fields/8, pages:PAGE-2227/fields/86, pages:PAGE-2227/fields/89, pages:PAGE-2227/fields/97, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/100, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/101, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/102, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/103, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/104, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/105, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/106, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/107, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/108, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/124, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/142, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/148, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/150, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/151, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/60, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/71, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/75, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/79, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/80, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/83, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/86, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/91, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/97, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/98, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/99, scenarios:FLOW-CURRENT-CUSTOMER/steps/20

验证：CHECK-FLOW-CALL-FACTS

## 实施任务

- [TASK-019](../tasks/TASK-019.md)
