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
- 本方式执行安排有效：人工已落实有效坐席，PRED任务明确，AI任务及场景明确；DIRECT入口来源有效且方式确定，不依赖独立责任人值
- 前正常段必要内容/事实已正常归档或旧已废弃段可靠结清；全部真实在途/重试/unknown/冲突收敛，联系限制及同号/资源协调允许
- DIRECT须当前周期ACTIVE；COMPLETED须显式再次直接跟进，不能以旧安排直接起呼。

## 必须遵守的全局规则

- [GR-SCOPE](../global-logic.md#GR-SCOPE)
- [GR-AUTH](../global-logic.md#GR-AUTH)
- [GR-SERIAL](../global-logic.md#GR-SERIAL)
- [GR-CONTACT](../global-logic.md#GR-CONTACT)
- [GR-DATA-FACTS](../global-logic.md#GR-DATA-FACTS)
- [GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)
- [GR-HANDLING-MODE](../global-logic.md#GR-HANDLING-MODE)
- [GR-EXECUTION-ARRANGEMENT](../global-logic.md#GR-EXECUTION-ARRANGEMENT)
- [GR-ASSIGNMENT-SIMPLIFICATION](../global-logic.md#GR-ASSIGNMENT-SIMPLIFICATION)
- [GR-LIFECYCLE-SETTLEMENT](../global-logic.md#GR-LIFECYCLE-SETTLEMENT)

## 输入与输出

输入：[FIELD-FLOW-AI-SCENE](../field-specs.md#FIELD-FLOW-AI-SCENE)、[FIELD-FLOW-ARRANGEMENT](../field-specs.md#FIELD-FLOW-ARRANGEMENT)、[FIELD-FLOW-METHOD](../field-specs.md#FIELD-FLOW-METHOD)、[FIELD-FLOW-PHONE](../field-specs.md#FIELD-FLOW-PHONE)、[FIELD-FLOW-RECORD-ID](../field-specs.md#FIELD-FLOW-RECORD-ID)、[FIELD-FLOW-RECORD-REVISION](../field-specs.md#FIELD-FLOW-RECORD-REVISION)、[FIELD-FLOW-VALUE-SOURCES](../field-specs.md#FIELD-FLOW-VALUE-SOURCES)、[FIELD-FLOW-ALLOW-DIRECT-FOLLOWUP](../field-specs.md#FIELD-FLOW-ALLOW-DIRECT-FOLLOWUP)、[FIELD-FLOW-HANDLING-MODE](../field-specs.md#FIELD-FLOW-HANDLING-MODE)、[FIELD-FLOW-DIRECT-METHOD](../field-specs.md#FIELD-FLOW-DIRECT-METHOD)、[FIELD-FLOW-DIRECT-CYCLE-ID](../field-specs.md#FIELD-FLOW-DIRECT-CYCLE-ID)、[FIELD-FLOW-DIRECT-STATUS](../field-specs.md#FIELD-FLOW-DIRECT-STATUS)、[FIELD-FLOW-EXECUTION-RESOURCE](../field-specs.md#FIELD-FLOW-EXECUTION-RESOURCE)、[FIELD-FLOW-EXECUTION-PRIORITY](../field-specs.md#FIELD-FLOW-EXECUTION-PRIORITY)、[FIELD-FLOW-EXECUTION-QUEUED-AT](../field-specs.md#FIELD-FLOW-EXECUTION-QUEUED-AT)、[FIELD-FLOW-EXECUTION-QUEUE-SEQUENCE](../field-specs.md#FIELD-FLOW-EXECUTION-QUEUE-SEQUENCE)、[FIELD-FLOW-MANUAL-ASSIGNMENT-MODE](../field-specs.md#FIELD-FLOW-MANUAL-ASSIGNMENT-MODE)

输出：[FIELD-FLOW-FOLLOWUP-ID](../field-specs.md#FIELD-FLOW-FOLLOWUP-ID)、[FIELD-FLOW-ACTOR](../field-specs.md#FIELD-FLOW-ACTOR)、[FIELD-FLOW-ACTUAL-HANDLER](../field-specs.md#FIELD-FLOW-ACTUAL-HANDLER)、[FIELD-FLOW-BASIS](../field-specs.md#FIELD-FLOW-BASIS)、[FIELD-FLOW-SCENE-SNAPSHOT](../field-specs.md#FIELD-FLOW-SCENE-SNAPSHOT)、[FIELD-FLOW-RESOURCE-SNAPSHOT](../field-specs.md#FIELD-FLOW-RESOURCE-SNAPSHOT)、[FIELD-FLOW-EXECUTION-STATE](../field-specs.md#FIELD-FLOW-EXECUTION-STATE)

## 处理步骤

### STEP-FLOW-START-1

重核当前人/owner/模式、准确TASK来源/渠道/方式（旧无TASK历史另核原准入）或TEMPLATE准确run/node、场景与唯一资源、所有联系限制和号码协调

读取：FIELD-FLOW-RECORD-ID, FIELD-FLOW-ARRANGEMENT, FIELD-FLOW-METHOD, FIELD-FLOW-PHONE, FIELD-FLOW-CONTACT-POLICY, FIELD-FLOW-ALLOW-DIRECT-FOLLOWUP, FIELD-FLOW-HANDLING-MODE, FIELD-FLOW-DIRECT-METHOD；写入：无

规则：GR-SCOPE, GR-AUTH, GR-SERIAL, GR-CONTACT, GR-DATA-FACTS, GR-UNKNOWN, GR-HANDLING-MODE

### STEP-FLOW-START-2

人工须已明确有效seat且仅其本人办理；AI/PRED不要求独立assignedAccountId或followupAccountId，真实actor/拨打/接听事实分别写入

读取：FIELD-FLOW-ACTOR, FIELD-FLOW-RESOURCE-SNAPSHOT；写入：FIELD-FLOW-ACTUAL-HANDLER

规则：GR-SCOPE, GR-AUTH, GR-SERIAL, GR-CONTACT, GR-DATA-FACTS, GR-UNKNOWN

### STEP-FLOW-START-3

两模式均产生准确唯一跟进并封最新分类定义/值和真实方式/场景；DIRECT不生成run/node，TEMPLATE绑定准确当前run/node，受理不当拨打；按准确保存resourceId及场景重新核资源；manual仅所选坐席本人起呼。同资源高等级的可办理待办优先，既有执行不被抢占；所有原联系/资格限制先检查。 当前/旧/generic供应商专属快照与兼容副本只按可信原始任务/批次租户及品牌投影，所有值和配置指纹均受同一范围约束，不泄露给来源方或另一租户；新运行未安排清当前queue别名，显示未记录，不能借旧运行队列时间或业务createdAt抢队。相同当前运行/资源仅重存或调等级保原FIFO，新运行重新分配同资源才产生新queuedAt/queueSequence。未安排待办排序与队列时间展示分开，按当前节点进入/当前周期开始的可信时间，身份未知保持未知。 当前/旧/generic供应商专属快照与兼容副本只按可信原始任务/批次租户及品牌投影，所有值和配置指纹均受同一范围约束，不泄露给来源方或另一租户；公共业务资料及原截止历史保持。预外呼新安排/执行同核已配置分类和品牌，统一历史未知不在读取时首次补类或换类。 导入与明确执行使用相同底层配置语义指纹；已知成功准入包装字段和对象键序不构成业务配置变化。旧schema2 TASK/DIRECT仅在完整准确身份及已知wrapper/basis证明等价时只读兼容；未知附加项或真实映射/来源/模板/状态变化继续拒绝，不回写旧快照，TEMPLATE标签依赖保完整指纹。 当前排队事实仅属于准确当前run/nodeRun/directCycle及有效资源安排；新运行未安排清当前queue别名，显示未记录，不能借旧运行队列时间或业务createdAt抢队。相同当前运行/资源仅重存或调等级保原FIFO，新运行重新分配同资源才产生新queuedAt/queueSequence。未安排待办排序与队列时间展示分开，按当前节点进入/当前周期开始的可信时间，身份未知保持未知。

读取：FIELD-FLOW-CATEGORY-ID, FIELD-FLOW-IMPORT-VALUES, FIELD-FLOW-FOLLOWUP-VALUES, FIELD-FLOW-HANDLING-MODE, FIELD-FLOW-DIRECT-METHOD, FIELD-FLOW-END-FOLLOWUP-ORIGIN, FIELD-FLOW-EXECUTION-RESOURCE, FIELD-FLOW-EXECUTION-PRIORITY, FIELD-FLOW-EXECUTION-QUEUED-AT, FIELD-FLOW-EXECUTION-QUEUE-SEQUENCE, FIELD-FLOW-MANUAL-ASSIGNMENT-MODE；写入：FIELD-FLOW-FOLLOWUP-ID, FIELD-FLOW-BASIS, FIELD-FLOW-SCENE-SNAPSHOT, FIELD-FLOW-RESOURCE-SNAPSHOT, FIELD-FLOW-EXECUTION-STATE

规则：GR-SCOPE, GR-AUTH, GR-SERIAL, GR-CONTACT, GR-DATA-FACTS, GR-UNKNOWN, GR-HANDLING-MODE, GR-EXECUTION-ARRANGEMENT, GR-ASSIGNMENT-SIMPLIFICATION, GR-LIFECYCLE-SETTLEMENT

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

条件：当前周期恰为可靠END来源的首MANUAL，record/owner/origin directCycleId与当前cycle准确一致

结果：历史END证明与当前周期例外分开：只有同record/owner/来源directCycleId的首MANUAL当前周期可豁免旧allowDirect标志；TASK的resume新周期须当前准确任务/场景/渠道有效，旧无TASK历史按原准入，旧来源只保历史。

涉及字段：FIELD-FLOW-END-FOLLOWUP-ORIGIN

验证：CHECK-FLOW-START

## 完成后的状态

- 不自动推进节点或改变owner

## 字段定义

- [FIELD-FLOW-AI-SCENE](../field-specs.md#FIELD-FLOW-AI-SCENE)
- [FIELD-FLOW-ARRANGEMENT](../field-specs.md#FIELD-FLOW-ARRANGEMENT)
- [FIELD-FLOW-METHOD](../field-specs.md#FIELD-FLOW-METHOD)
- [FIELD-FLOW-PHONE](../field-specs.md#FIELD-FLOW-PHONE)
- [FIELD-FLOW-RECORD-ID](../field-specs.md#FIELD-FLOW-RECORD-ID)
- [FIELD-FLOW-RECORD-REVISION](../field-specs.md#FIELD-FLOW-RECORD-REVISION)
- [FIELD-FLOW-VALUE-SOURCES](../field-specs.md#FIELD-FLOW-VALUE-SOURCES)
- [FIELD-FLOW-ALLOW-DIRECT-FOLLOWUP](../field-specs.md#FIELD-FLOW-ALLOW-DIRECT-FOLLOWUP)
- [FIELD-FLOW-HANDLING-MODE](../field-specs.md#FIELD-FLOW-HANDLING-MODE)
- [FIELD-FLOW-DIRECT-METHOD](../field-specs.md#FIELD-FLOW-DIRECT-METHOD)
- [FIELD-FLOW-DIRECT-CYCLE-ID](../field-specs.md#FIELD-FLOW-DIRECT-CYCLE-ID)
- [FIELD-FLOW-DIRECT-STATUS](../field-specs.md#FIELD-FLOW-DIRECT-STATUS)
- [FIELD-FLOW-EXECUTION-RESOURCE](../field-specs.md#FIELD-FLOW-EXECUTION-RESOURCE)
- [FIELD-FLOW-EXECUTION-PRIORITY](../field-specs.md#FIELD-FLOW-EXECUTION-PRIORITY)
- [FIELD-FLOW-EXECUTION-QUEUED-AT](../field-specs.md#FIELD-FLOW-EXECUTION-QUEUED-AT)
- [FIELD-FLOW-EXECUTION-QUEUE-SEQUENCE](../field-specs.md#FIELD-FLOW-EXECUTION-QUEUE-SEQUENCE)
- [FIELD-FLOW-MANUAL-ASSIGNMENT-MODE](../field-specs.md#FIELD-FLOW-MANUAL-ASSIGNMENT-MODE)
- [FIELD-FLOW-FOLLOWUP-ID](../field-specs.md#FIELD-FLOW-FOLLOWUP-ID)
- [FIELD-FLOW-ACTOR](../field-specs.md#FIELD-FLOW-ACTOR)
- [FIELD-FLOW-ACTUAL-HANDLER](../field-specs.md#FIELD-FLOW-ACTUAL-HANDLER)
- [FIELD-FLOW-BASIS](../field-specs.md#FIELD-FLOW-BASIS)
- [FIELD-FLOW-SCENE-SNAPSHOT](../field-specs.md#FIELD-FLOW-SCENE-SNAPSHOT)
- [FIELD-FLOW-RESOURCE-SNAPSHOT](../field-specs.md#FIELD-FLOW-RESOURCE-SNAPSHOT)
- [FIELD-FLOW-EXECUTION-STATE](../field-specs.md#FIELD-FLOW-EXECUTION-STATE)
- [FIELD-FLOW-CONTACT-POLICY](../field-specs.md#FIELD-FLOW-CONTACT-POLICY)
- [FIELD-FLOW-CATEGORY-ID](../field-specs.md#FIELD-FLOW-CATEGORY-ID)
- [FIELD-FLOW-IMPORT-VALUES](../field-specs.md#FIELD-FLOW-IMPORT-VALUES)
- [FIELD-FLOW-FOLLOWUP-VALUES](../field-specs.md#FIELD-FLOW-FOLLOWUP-VALUES)
- [FIELD-FLOW-END-FOLLOWUP-ORIGIN](../field-specs.md#FIELD-FLOW-END-FOLLOWUP-ORIGIN)
- [FIELD-FLOW-CALLS](../field-specs.md#FIELD-FLOW-CALLS)
- [FIELD-FLOW-REQUEST-ID](../field-specs.md#FIELD-FLOW-REQUEST-ID)

## 来源与验证

来源条目：acceptance:AC-2090, acceptance:AC-2091, acceptance:AC-2120, acceptance:AC-2121, acceptance:AC-2122, acceptance:AC-2157, features:FUNC-2031, features:FUNC-2031/behavior_spec/1/branches/0, features:FUNC-2031/behavior_spec/1/branches/1, features:FUNC-2031/behavior_spec/1/branches/2, features:FUNC-2031/behavior_spec/1/branches/3, features:FUNC-2031/behavior_spec/1/postconditions/0, features:FUNC-2031/behavior_spec/1/preconditions/0, features:FUNC-2031/behavior_spec/1/preconditions/1, features:FUNC-2031/behavior_spec/1/preconditions/2, features:FUNC-2031/behavior_spec/1/preconditions/3, features:FUNC-2031/behavior_spec/1/preconditions/4, features:FUNC-2031/behavior_spec/1/steps/0, features:FUNC-2031/behavior_spec/1/steps/1, features:FUNC-2031/behavior_spec/1/steps/2, pages:PAGE-2006/fields/25, pages:PAGE-2006/fields/38, pages:PAGE-2006/fields/5, pages:PAGE-2006/fields/59, pages:PAGE-2103/fields/31, pages:PAGE-2103/fields/32, pages:PAGE-2103/fields/33, pages:PAGE-2103/fields/34, pages:PAGE-2203/fields/10, pages:PAGE-2203/fields/19, pages:PAGE-2203/fields/2, pages:PAGE-2203/fields/21, pages:PAGE-2203/fields/28, pages:PAGE-2203/fields/35, pages:PAGE-2203/fields/39, pages:PAGE-2203/fields/5, pages:PAGE-2203/fields/52, pages:PAGE-2203/fields/64, pages:PAGE-2203/fields/65, pages:PAGE-2203/fields/66, pages:PAGE-2203/fields/9, pages:PAGE-2204, pages:PAGE-2204/fields/0, pages:PAGE-2204/fields/1, pages:PAGE-2204/fields/10, pages:PAGE-2204/fields/15, pages:PAGE-2204/fields/2, pages:PAGE-2204/fields/26, pages:PAGE-2204/fields/3, pages:PAGE-2204/fields/30, pages:PAGE-2204/fields/31, pages:PAGE-2204/fields/38, pages:PAGE-2204/fields/4, pages:PAGE-2204/fields/41, pages:PAGE-2204/fields/46, pages:PAGE-2204/fields/48, pages:PAGE-2204/fields/49, pages:PAGE-2204/fields/50, pages:PAGE-2204/fields/53, pages:PAGE-2204/fields/58, pages:PAGE-2204/fields/64, pages:PAGE-2204/fields/85, pages:PAGE-2204/fields/86, pages:PAGE-2204/fields/87, pages:PAGE-2204/fields/9, pages:PAGE-2204/fields/91, pages:PAGE-2204/fields/92, pages:PAGE-2204/fields/93, pages:PAGE-2204/fields/94, pages:PAGE-2204/fields/95, pages:PAGE-2205/fields/58, pages:PAGE-2205/fields/60, pages:PAGE-2205/fields/61, pages:PAGE-2205/fields/62, pages:PAGE-2223/fields/0, pages:PAGE-2223/fields/4, pages:PAGE-2226/fields/1, pages:PAGE-2226/fields/15, pages:PAGE-2226/fields/17, pages:PAGE-2226/fields/19, pages:PAGE-2226/fields/2, pages:PAGE-2226/fields/21, pages:PAGE-2226/fields/23, pages:PAGE-2226/fields/27, pages:PAGE-2226/fields/28, pages:PAGE-2226/fields/3, pages:PAGE-2226/fields/33, pages:PAGE-2226/fields/35, pages:PAGE-2226/fields/36, pages:PAGE-2226/fields/37, pages:PAGE-2226/fields/39, pages:PAGE-2226/fields/40, pages:PAGE-2226/fields/41, pages:PAGE-2226/fields/42, pages:PAGE-2226/fields/43, pages:PAGE-2226/fields/7, pages:PAGE-2226/fields/8, pages:PAGE-2227, pages:PAGE-2227/actions/0, pages:PAGE-2227/fields/1, pages:PAGE-2227/fields/100, pages:PAGE-2227/fields/116, pages:PAGE-2227/fields/138, pages:PAGE-2227/fields/139, pages:PAGE-2227/fields/140, pages:PAGE-2227/fields/144, pages:PAGE-2227/fields/145, pages:PAGE-2227/fields/146, pages:PAGE-2227/fields/147, pages:PAGE-2227/fields/148, pages:PAGE-2227/fields/16, pages:PAGE-2227/fields/17, pages:PAGE-2227/fields/19, pages:PAGE-2227/fields/3, pages:PAGE-2227/fields/39, pages:PAGE-2227/fields/4, pages:PAGE-2227/fields/43, pages:PAGE-2227/fields/45, pages:PAGE-2227/fields/50, pages:PAGE-2227/fields/57, pages:PAGE-2227/fields/7, pages:PAGE-2227/fields/70, pages:PAGE-2227/fields/79, pages:PAGE-2227/fields/80, pages:PAGE-2227/fields/81, pages:PAGE-2227/fields/84, pages:PAGE-2227/fields/9, pages:PAGE-2228/fields/10, pages:PAGE-2228/fields/17, pages:PAGE-2228/fields/3, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/105, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/120, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/125, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/144, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/147, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/148, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/149, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/150, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/151, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/159, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/160, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/161, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/162, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/163, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/166, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/17, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/35, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/60, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/63, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/65, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/66, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/69, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/70, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/71, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/72, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/73, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/83, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/84, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/85, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/87, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/97, scenarios:FLOW-CURRENT-CUSTOMER/steps/18

验证：CHECK-FLOW-START, CHECK-FLOW-DERIVED-PEOPLE-HISTORY

## 实施任务

- [TASK-018](../tasks/TASK-018.md)
