# LOCAL-FLOW-START 明确发起本条CALL实际执行

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md) · [全局逻辑](../global-logic.md)

- [明确发起当前呼叫及同组批呼叫 · FUNC\-2031](../features/FUNC-2031.md)

## 职责与触发

所属工程模块：未填写

功能：FUNC-2031

触发：确认开始本次办理

## 前置条件

- 对准确业务有当前本租户办理权
- 确认业务/owner/模式及并发依据一致；TEMPLATE另核准确run/node
- 已安排责任人，DIRECT分类当前允许且显式方式明确；必要AI场景当前有效
- 前次所需内容和事实已归档，所有在途/重试/未知已收敛，联系限制与号码协调允许
- DIRECT须当前周期ACTIVE；COMPLETED须显式再次直接跟进，不能以旧安排直接起呼。

## 必须遵守的全局规则

- [GR-SCOPE](../global-logic.md#GR-SCOPE)
- [GR-AUTH](../global-logic.md#GR-AUTH)
- [GR-SERIAL](../global-logic.md#GR-SERIAL)
- [GR-CONTACT](../global-logic.md#GR-CONTACT)
- [GR-DATA-FACTS](../global-logic.md#GR-DATA-FACTS)
- [GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)
- [GR-HANDLING-MODE](../global-logic.md#GR-HANDLING-MODE)

## 输入与输出

输入：[FIELD-FLOW-AI-SCENE](../field-specs.md#FIELD-FLOW-AI-SCENE)、[FIELD-FLOW-ARRANGEMENT](../field-specs.md#FIELD-FLOW-ARRANGEMENT)、[FIELD-FLOW-METHOD](../field-specs.md#FIELD-FLOW-METHOD)、[FIELD-FLOW-PHONE](../field-specs.md#FIELD-FLOW-PHONE)、[FIELD-FLOW-RECORD-ID](../field-specs.md#FIELD-FLOW-RECORD-ID)、[FIELD-FLOW-RECORD-REVISION](../field-specs.md#FIELD-FLOW-RECORD-REVISION)、[FIELD-FLOW-VALUE-SOURCES](../field-specs.md#FIELD-FLOW-VALUE-SOURCES)、[FIELD-FLOW-ALLOW-DIRECT-FOLLOWUP](../field-specs.md#FIELD-FLOW-ALLOW-DIRECT-FOLLOWUP)、[FIELD-FLOW-HANDLING-MODE](../field-specs.md#FIELD-FLOW-HANDLING-MODE)、[FIELD-FLOW-DIRECT-METHOD](../field-specs.md#FIELD-FLOW-DIRECT-METHOD)、[FIELD-FLOW-DIRECT-CYCLE-ID](../field-specs.md#FIELD-FLOW-DIRECT-CYCLE-ID)、[FIELD-FLOW-DIRECT-STATUS](../field-specs.md#FIELD-FLOW-DIRECT-STATUS)

输出：[FIELD-FLOW-FOLLOWUP-ID](../field-specs.md#FIELD-FLOW-FOLLOWUP-ID)、[FIELD-FLOW-ACTOR](../field-specs.md#FIELD-FLOW-ACTOR)、[FIELD-FLOW-ACTUAL-HANDLER](../field-specs.md#FIELD-FLOW-ACTUAL-HANDLER)、[FIELD-FLOW-BASIS](../field-specs.md#FIELD-FLOW-BASIS)、[FIELD-FLOW-SCENE-SNAPSHOT](../field-specs.md#FIELD-FLOW-SCENE-SNAPSHOT)、[FIELD-FLOW-RESOURCE-SNAPSHOT](../field-specs.md#FIELD-FLOW-RESOURCE-SNAPSHOT)、[FIELD-FLOW-EXECUTION-STATE](../field-specs.md#FIELD-FLOW-EXECUTION-STATE)

## 处理步骤

### STEP-FLOW-START-1

重核当前人/owner/模式、DIRECT开关/显式方式或TEMPLATE准确run/node、场景与唯一资源、所有联系限制和号码协调

读取：FIELD-FLOW-RECORD-ID, FIELD-FLOW-ARRANGEMENT, FIELD-FLOW-METHOD, FIELD-FLOW-PHONE, FIELD-FLOW-CONTACT-POLICY, FIELD-FLOW-ALLOW-DIRECT-FOLLOWUP, FIELD-FLOW-HANDLING-MODE, FIELD-FLOW-DIRECT-METHOD；写入：无

规则：GR-SCOPE, GR-AUTH, GR-SERIAL, GR-CONTACT, GR-DATA-FACTS, GR-UNKNOWN, GR-HANDLING-MODE

### STEP-FLOW-START-2

人工本人拨打，管理员可用本人已有效坐席，明确实际人与责任人不同

读取：FIELD-FLOW-FOLLOWER, FIELD-FLOW-ACTOR, FIELD-FLOW-RESOURCE-SNAPSHOT；写入：FIELD-FLOW-ACTUAL-HANDLER

规则：GR-SCOPE, GR-AUTH, GR-SERIAL, GR-CONTACT, GR-DATA-FACTS, GR-UNKNOWN

### STEP-FLOW-START-3

两模式均产生准确唯一跟进并封最新分类定义/值和真实方式/场景；DIRECT不生成run/node，TEMPLATE绑定准确当前run/node，受理不当拨打

读取：FIELD-FLOW-CATEGORY-ID, FIELD-FLOW-IMPORT-VALUES, FIELD-FLOW-FOLLOWUP-VALUES, FIELD-FLOW-HANDLING-MODE, FIELD-FLOW-DIRECT-METHOD, FIELD-FLOW-END-FOLLOWUP-ORIGIN；写入：FIELD-FLOW-FOLLOWUP-ID, FIELD-FLOW-BASIS, FIELD-FLOW-SCENE-SNAPSHOT, FIELD-FLOW-RESOURCE-SNAPSHOT, FIELD-FLOW-EXECUTION-STATE

规则：GR-SCOPE, GR-AUTH, GR-SERIAL, GR-CONTACT, GR-DATA-FACTS, GR-UNKNOWN, GR-HANDLING-MODE

## 分支与异常

### BRANCH-FLOW-START-1

条件：资格/资源/场景/频次失败

结果：无新执行段，保原安排并准确原因

涉及字段：FIELD-FLOW-ARRANGEMENT, FIELD-FLOW-EXECUTION-STATE

验证：CHECK-FLOW-START

### BRANCH-FLOW-START-2

条件：明确受理

结果：执行中但calls可为空，等待真实事实

涉及字段：FIELD-FLOW-FOLLOWUP-ID, FIELD-FLOW-CALLS, FIELD-FLOW-EXECUTION-STATE

验证：CHECK-FLOW-START

### BRANCH-FLOW-START-3

条件：受理结果未知

结果：持同请求核对，不再起第二次

涉及字段：FIELD-FLOW-REQUEST-ID, FIELD-FLOW-EXECUTION-STATE

验证：CHECK-FLOW-START

### LOCAL-FLOW-START-END-ORIGIN

条件：当前直接周期具有可靠END接续来源

结果：可以按已确认END继续人工跟进；普通DIRECT开关不替代此来源，但当前分类/本人/资源/联系/必要归档照常核验

涉及字段：FIELD-FLOW-END-FOLLOWUP-ORIGIN

验证：CHECK-FLOW-START

## 完成后的状态

- 不自动推进节点或改变owner

## 字段定义

- [FIELD-FLOW-ACTOR](../field-specs.md#FIELD-FLOW-ACTOR)
- [FIELD-FLOW-ACTUAL-HANDLER](../field-specs.md#FIELD-FLOW-ACTUAL-HANDLER)
- [FIELD-FLOW-AI-SCENE](../field-specs.md#FIELD-FLOW-AI-SCENE)
- [FIELD-FLOW-ALLOW-DIRECT-FOLLOWUP](../field-specs.md#FIELD-FLOW-ALLOW-DIRECT-FOLLOWUP)
- [FIELD-FLOW-ARRANGEMENT](../field-specs.md#FIELD-FLOW-ARRANGEMENT)
- [FIELD-FLOW-BASIS](../field-specs.md#FIELD-FLOW-BASIS)
- [FIELD-FLOW-CALLS](../field-specs.md#FIELD-FLOW-CALLS)
- [FIELD-FLOW-CATEGORY-ID](../field-specs.md#FIELD-FLOW-CATEGORY-ID)
- [FIELD-FLOW-CONTACT-POLICY](../field-specs.md#FIELD-FLOW-CONTACT-POLICY)
- [FIELD-FLOW-DIRECT-CYCLE-ID](../field-specs.md#FIELD-FLOW-DIRECT-CYCLE-ID)
- [FIELD-FLOW-DIRECT-METHOD](../field-specs.md#FIELD-FLOW-DIRECT-METHOD)
- [FIELD-FLOW-DIRECT-STATUS](../field-specs.md#FIELD-FLOW-DIRECT-STATUS)
- [FIELD-FLOW-END-FOLLOWUP-ORIGIN](../field-specs.md#FIELD-FLOW-END-FOLLOWUP-ORIGIN)
- [FIELD-FLOW-EXECUTION-STATE](../field-specs.md#FIELD-FLOW-EXECUTION-STATE)
- [FIELD-FLOW-FOLLOWER](../field-specs.md#FIELD-FLOW-FOLLOWER)
- [FIELD-FLOW-FOLLOWUP-ID](../field-specs.md#FIELD-FLOW-FOLLOWUP-ID)
- [FIELD-FLOW-FOLLOWUP-VALUES](../field-specs.md#FIELD-FLOW-FOLLOWUP-VALUES)
- [FIELD-FLOW-HANDLING-MODE](../field-specs.md#FIELD-FLOW-HANDLING-MODE)
- [FIELD-FLOW-IMPORT-VALUES](../field-specs.md#FIELD-FLOW-IMPORT-VALUES)
- [FIELD-FLOW-METHOD](../field-specs.md#FIELD-FLOW-METHOD)
- [FIELD-FLOW-PHONE](../field-specs.md#FIELD-FLOW-PHONE)
- [FIELD-FLOW-RECORD-ID](../field-specs.md#FIELD-FLOW-RECORD-ID)
- [FIELD-FLOW-RECORD-REVISION](../field-specs.md#FIELD-FLOW-RECORD-REVISION)
- [FIELD-FLOW-REQUEST-ID](../field-specs.md#FIELD-FLOW-REQUEST-ID)
- [FIELD-FLOW-RESOURCE-SNAPSHOT](../field-specs.md#FIELD-FLOW-RESOURCE-SNAPSHOT)
- [FIELD-FLOW-SCENE-SNAPSHOT](../field-specs.md#FIELD-FLOW-SCENE-SNAPSHOT)
- [FIELD-FLOW-VALUE-SOURCES](../field-specs.md#FIELD-FLOW-VALUE-SOURCES)

## 来源与验证

来源条目：acceptance:AC-2090, acceptance:AC-2091, acceptance:AC-2120, acceptance:AC-2121, acceptance:AC-2122, features:FUNC-2031, features:FUNC-2031/behavior_spec/1/branches/0, features:FUNC-2031/behavior_spec/1/branches/1, features:FUNC-2031/behavior_spec/1/branches/2, features:FUNC-2031/behavior_spec/1/branches/3, features:FUNC-2031/behavior_spec/1/postconditions/0, features:FUNC-2031/behavior_spec/1/preconditions/0, features:FUNC-2031/behavior_spec/1/preconditions/1, features:FUNC-2031/behavior_spec/1/preconditions/2, features:FUNC-2031/behavior_spec/1/preconditions/3, features:FUNC-2031/behavior_spec/1/preconditions/4, features:FUNC-2031/behavior_spec/1/steps/0, features:FUNC-2031/behavior_spec/1/steps/1, features:FUNC-2031/behavior_spec/1/steps/2, pages:PAGE-2006/fields/25, pages:PAGE-2006/fields/38, pages:PAGE-2006/fields/5, pages:PAGE-2006/fields/59, pages:PAGE-2203/fields/10, pages:PAGE-2203/fields/18, pages:PAGE-2203/fields/19, pages:PAGE-2203/fields/2, pages:PAGE-2203/fields/21, pages:PAGE-2203/fields/28, pages:PAGE-2203/fields/35, pages:PAGE-2203/fields/39, pages:PAGE-2203/fields/5, pages:PAGE-2203/fields/52, pages:PAGE-2203/fields/64, pages:PAGE-2203/fields/65, pages:PAGE-2203/fields/66, pages:PAGE-2203/fields/9, pages:PAGE-2204, pages:PAGE-2204/fields/0, pages:PAGE-2204/fields/1, pages:PAGE-2204/fields/10, pages:PAGE-2204/fields/15, pages:PAGE-2204/fields/2, pages:PAGE-2204/fields/26, pages:PAGE-2204/fields/29, pages:PAGE-2204/fields/3, pages:PAGE-2204/fields/30, pages:PAGE-2204/fields/31, pages:PAGE-2204/fields/38, pages:PAGE-2204/fields/4, pages:PAGE-2204/fields/41, pages:PAGE-2204/fields/46, pages:PAGE-2204/fields/48, pages:PAGE-2204/fields/49, pages:PAGE-2204/fields/50, pages:PAGE-2204/fields/53, pages:PAGE-2204/fields/58, pages:PAGE-2204/fields/64, pages:PAGE-2204/fields/85, pages:PAGE-2204/fields/86, pages:PAGE-2204/fields/87, pages:PAGE-2204/fields/9, pages:PAGE-2223/fields/0, pages:PAGE-2223/fields/4, pages:PAGE-2226/fields/1, pages:PAGE-2226/fields/15, pages:PAGE-2226/fields/16, pages:PAGE-2226/fields/17, pages:PAGE-2226/fields/19, pages:PAGE-2226/fields/2, pages:PAGE-2226/fields/21, pages:PAGE-2226/fields/23, pages:PAGE-2226/fields/27, pages:PAGE-2226/fields/28, pages:PAGE-2226/fields/3, pages:PAGE-2226/fields/33, pages:PAGE-2226/fields/35, pages:PAGE-2226/fields/36, pages:PAGE-2226/fields/37, pages:PAGE-2226/fields/7, pages:PAGE-2226/fields/8, pages:PAGE-2227, pages:PAGE-2227/actions/0, pages:PAGE-2227/fields/1, pages:PAGE-2227/fields/100, pages:PAGE-2227/fields/116, pages:PAGE-2227/fields/138, pages:PAGE-2227/fields/139, pages:PAGE-2227/fields/140, pages:PAGE-2227/fields/16, pages:PAGE-2227/fields/17, pages:PAGE-2227/fields/19, pages:PAGE-2227/fields/3, pages:PAGE-2227/fields/39, pages:PAGE-2227/fields/4, pages:PAGE-2227/fields/42, pages:PAGE-2227/fields/43, pages:PAGE-2227/fields/45, pages:PAGE-2227/fields/50, pages:PAGE-2227/fields/57, pages:PAGE-2227/fields/7, pages:PAGE-2227/fields/70, pages:PAGE-2227/fields/79, pages:PAGE-2227/fields/80, pages:PAGE-2227/fields/81, pages:PAGE-2227/fields/84, pages:PAGE-2227/fields/9, pages:PAGE-2228/fields/10, pages:PAGE-2228/fields/17, pages:PAGE-2228/fields/3, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/105, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/120, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/125, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/144, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/147, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/148, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/149, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/150, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/151, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/159, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/17, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/35, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/60, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/63, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/65, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/66, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/68, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/69, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/70, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/71, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/72, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/73, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/83, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/84, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/85, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/87, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/97, scenarios:FLOW-CURRENT-CUSTOMER/steps/18

验证：CHECK-FLOW-START

## 实施任务

- [TASK-018](../tasks/TASK-018.md)
