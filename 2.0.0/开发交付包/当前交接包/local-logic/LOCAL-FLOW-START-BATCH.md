# LOCAL-FLOW-START-BATCH 同组AI／预外呼逐条批发起

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md) · [全局逻辑](../global-logic.md)

- [明确发起当前呼叫及同组批呼叫 · FUNC\-2031](../features/FUNC-2031.md)

## 职责与触发

所属工程模块：未填写

功能：FUNC-2031

触发：勾选同组AI/预外呼并明确确认发起

## 前置条件

- 对准确业务有当前本租户办理权
- 确认业务/run/node/owner及并发依据仍一致
- 每行有startMany资格，分类/模板/节点/方式/场景同组

## 必须遵守的全局规则

- [GR-SERIAL](../global-logic.md#GR-SERIAL)
- [GR-CONTACT](../global-logic.md#GR-CONTACT)
- [GR-AUTH](../global-logic.md#GR-AUTH)
- [GR-DATA-FACTS](../global-logic.md#GR-DATA-FACTS)
- [GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)
- [GR-HANDLING-MODE](../global-logic.md#GR-HANDLING-MODE)
- [GR-EXECUTION-ARRANGEMENT](../global-logic.md#GR-EXECUTION-ARRANGEMENT)
- [GR-ASSIGNMENT-SIMPLIFICATION](../global-logic.md#GR-ASSIGNMENT-SIMPLIFICATION)

## 输入与输出

输入：[FIELD-FLOW-RECORD-ID](../field-specs.md#FIELD-FLOW-RECORD-ID)、[FIELD-FLOW-ARRANGEMENT](../field-specs.md#FIELD-FLOW-ARRANGEMENT)、[FIELD-FLOW-METHOD](../field-specs.md#FIELD-FLOW-METHOD)、[FIELD-FLOW-CONTACT-POLICY](../field-specs.md#FIELD-FLOW-CONTACT-POLICY)、[FIELD-FLOW-ALLOW-DIRECT-FOLLOWUP](../field-specs.md#FIELD-FLOW-ALLOW-DIRECT-FOLLOWUP)、[FIELD-FLOW-HANDLING-MODE](../field-specs.md#FIELD-FLOW-HANDLING-MODE)、[FIELD-FLOW-DIRECT-METHOD](../field-specs.md#FIELD-FLOW-DIRECT-METHOD)、[FIELD-FLOW-DIRECT-CYCLE-ID](../field-specs.md#FIELD-FLOW-DIRECT-CYCLE-ID)、[FIELD-FLOW-DIRECT-STATUS](../field-specs.md#FIELD-FLOW-DIRECT-STATUS)、[FIELD-FLOW-EXECUTION-RESOURCE](../field-specs.md#FIELD-FLOW-EXECUTION-RESOURCE)、[FIELD-FLOW-EXECUTION-PRIORITY](../field-specs.md#FIELD-FLOW-EXECUTION-PRIORITY)、[FIELD-FLOW-EXECUTION-QUEUED-AT](../field-specs.md#FIELD-FLOW-EXECUTION-QUEUED-AT)、[FIELD-FLOW-EXECUTION-QUEUE-SEQUENCE](../field-specs.md#FIELD-FLOW-EXECUTION-QUEUE-SEQUENCE)、[FIELD-FLOW-MANUAL-ASSIGNMENT-MODE](../field-specs.md#FIELD-FLOW-MANUAL-ASSIGNMENT-MODE)

输出：[FIELD-FLOW-FOLLOWUP-ID](../field-specs.md#FIELD-FLOW-FOLLOWUP-ID)、[FIELD-FLOW-EXECUTION-STATE](../field-specs.md#FIELD-FLOW-EXECUTION-STATE)、[FIELD-FLOW-REQUEST-STATUS](../field-specs.md#FIELD-FLOW-REQUEST-STATUS)

## 处理步骤

### STEP-FLOW-START-BATCH-1

同资源可办理待执行项按五档执行优先级降序、同级入队时间及稳定序号升序逐条重核；不同资源独立办理，不抢占已受理执行

读取：FIELD-FLOW-RECORD-ID, FIELD-FLOW-CATEGORY-PRIORITY, FIELD-FLOW-ARRANGEMENT；写入：无

规则：GR-SERIAL, GR-CONTACT, GR-AUTH, GR-DATA-FACTS, GR-UNKNOWN

### STEP-FLOW-START-BATCH-2

每记录独立建立跟进/受理结果，仍对同号执行协调

读取：FIELD-FLOW-RECORD-ID, FIELD-FLOW-PHONE, FIELD-FLOW-ARRANGEMENT；写入：FIELD-FLOW-FOLLOWUP-ID, FIELD-FLOW-EXECUTION-STATE, FIELD-FLOW-REQUEST-STATUS

规则：GR-SERIAL, GR-CONTACT, GR-AUTH, GR-DATA-FACTS, GR-UNKNOWN

### STEP-FLOW-START-BATCH-4

DIRECT同方式同有效安排组也可明确批量发起AI/预外呼；逐条重核模式、串行占用及联系限制，人工仍逐条本人办理 当前/旧/generic供应商专属快照与兼容副本只按可信原始任务/批次租户及品牌投影，所有值和配置指纹均受同一范围约束，不泄露给来源方或另一租户；新运行未安排清当前queue别名，显示未记录，不能借旧运行队列时间或业务createdAt抢队。相同当前运行/资源仅重存或调等级保原FIFO，新运行重新分配同资源才产生新queuedAt/queueSequence。未安排待办排序与队列时间展示分开，按当前节点进入/当前周期开始的可信时间，身份未知保持未知。 当前/旧/generic供应商专属快照与兼容副本只按可信原始任务/批次租户及品牌投影，所有值和配置指纹均受同一范围约束，不泄露给来源方或另一租户；公共业务资料及原截止历史保持。预外呼新安排/执行同核已配置分类和品牌，统一历史未知不在读取时首次补类或换类。 导入与明确执行使用相同底层配置语义指纹；已知成功准入包装字段和对象键序不构成业务配置变化。旧schema2 TASK/DIRECT仅在完整准确身份及已知wrapper/basis证明等价时只读兼容；未知附加项或真实映射/来源/模板/状态变化继续拒绝，不回写旧快照，TEMPLATE标签依赖保完整指纹。 当前排队事实仅属于准确当前run/nodeRun/directCycle及有效资源安排；新运行未安排清当前queue别名，显示未记录，不能借旧运行队列时间或业务createdAt抢队。相同当前运行/资源仅重存或调等级保原FIFO，新运行重新分配同资源才产生新queuedAt/queueSequence。未安排待办排序与队列时间展示分开，按当前节点进入/当前周期开始的可信时间，身份未知保持未知。

读取：FIELD-FLOW-ALLOW-DIRECT-FOLLOWUP, FIELD-FLOW-HANDLING-MODE, FIELD-FLOW-DIRECT-METHOD, FIELD-FLOW-EXECUTION-RESOURCE, FIELD-FLOW-EXECUTION-PRIORITY, FIELD-FLOW-EXECUTION-QUEUED-AT, FIELD-FLOW-EXECUTION-QUEUE-SEQUENCE, FIELD-FLOW-MANUAL-ASSIGNMENT-MODE；写入：无

规则：GR-SERIAL, GR-CONTACT, GR-AUTH, GR-DATA-FACTS, GR-UNKNOWN, GR-HANDLING-MODE, GR-EXECUTION-ARRANGEMENT, GR-ASSIGNMENT-SIMPLIFICATION

## 分支与异常

### BRANCH-FLOW-START-BATCH-1

条件：部分受理/失败/未知

结果：逐行准确反馈和身份，已受理不回滚成未发生，失败不自动续拨

涉及字段：FIELD-FLOW-REQUEST-STATUS, FIELD-FLOW-FOLLOWUP-ID

验证：CHECK-FLOW-START-BATCH

### BRANCH-FLOW-START-BATCH-2

条件：人工或跨组混选

结果：阻批发起，人工本人逐条处理

涉及字段：FIELD-FLOW-METHOD, FIELD-FLOW-ARRANGEMENT

验证：CHECK-FLOW-START-BATCH

## 完成后的状态

- 分配批次与执行批次不是同一成功口径

## 字段定义

- [FIELD-FLOW-RECORD-ID](../field-specs.md#FIELD-FLOW-RECORD-ID)
- [FIELD-FLOW-ARRANGEMENT](../field-specs.md#FIELD-FLOW-ARRANGEMENT)
- [FIELD-FLOW-METHOD](../field-specs.md#FIELD-FLOW-METHOD)
- [FIELD-FLOW-CONTACT-POLICY](../field-specs.md#FIELD-FLOW-CONTACT-POLICY)
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
- [FIELD-FLOW-EXECUTION-STATE](../field-specs.md#FIELD-FLOW-EXECUTION-STATE)
- [FIELD-FLOW-REQUEST-STATUS](../field-specs.md#FIELD-FLOW-REQUEST-STATUS)
- [FIELD-FLOW-CATEGORY-PRIORITY](../field-specs.md#FIELD-FLOW-CATEGORY-PRIORITY)
- [FIELD-FLOW-PHONE](../field-specs.md#FIELD-FLOW-PHONE)

## 来源与验证

来源条目：acceptance:AC-2120, acceptance:AC-2121, acceptance:AC-2122, acceptance:AC-2152, features:FUNC-2031, features:FUNC-2031/behavior_spec/2/branches/0, features:FUNC-2031/behavior_spec/2/branches/1, features:FUNC-2031/behavior_spec/2/postconditions/0, features:FUNC-2031/behavior_spec/2/preconditions/0, features:FUNC-2031/behavior_spec/2/preconditions/1, features:FUNC-2031/behavior_spec/2/preconditions/2, features:FUNC-2031/behavior_spec/2/steps/0, features:FUNC-2031/behavior_spec/2/steps/1, features:FUNC-2031/behavior_spec/2/steps/2, pages:PAGE-2006/fields/25, pages:PAGE-2006/fields/39, pages:PAGE-2006/fields/59, pages:PAGE-2103/fields/32, pages:PAGE-2103/fields/33, pages:PAGE-2203/fields/19, pages:PAGE-2203/fields/28, pages:PAGE-2203/fields/35, pages:PAGE-2203/fields/39, pages:PAGE-2203/fields/64, pages:PAGE-2203/fields/65, pages:PAGE-2203/fields/66, pages:PAGE-2204, pages:PAGE-2204/fields/12, pages:PAGE-2204/fields/15, pages:PAGE-2204/fields/26, pages:PAGE-2204/fields/3, pages:PAGE-2204/fields/30, pages:PAGE-2204/fields/41, pages:PAGE-2204/fields/46, pages:PAGE-2204/fields/48, pages:PAGE-2204/fields/51, pages:PAGE-2204/fields/85, pages:PAGE-2204/fields/86, pages:PAGE-2204/fields/87, pages:PAGE-2204/fields/91, pages:PAGE-2204/fields/92, pages:PAGE-2204/fields/93, pages:PAGE-2204/fields/94, pages:PAGE-2204/fields/95, pages:PAGE-2205/fields/60, pages:PAGE-2205/fields/61, pages:PAGE-2226/fields/15, pages:PAGE-2226/fields/17, pages:PAGE-2226/fields/2, pages:PAGE-2226/fields/23, pages:PAGE-2226/fields/27, pages:PAGE-2226/fields/28, pages:PAGE-2226/fields/35, pages:PAGE-2226/fields/36, pages:PAGE-2226/fields/37, pages:PAGE-2226/fields/39, pages:PAGE-2226/fields/40, pages:PAGE-2226/fields/41, pages:PAGE-2226/fields/42, pages:PAGE-2226/fields/43, pages:PAGE-2227/fields/138, pages:PAGE-2227/fields/139, pages:PAGE-2227/fields/140, pages:PAGE-2227/fields/144, pages:PAGE-2227/fields/145, pages:PAGE-2227/fields/146, pages:PAGE-2227/fields/147, pages:PAGE-2227/fields/148, pages:PAGE-2227/fields/19, pages:PAGE-2227/fields/39, pages:PAGE-2227/fields/43, pages:PAGE-2227/fields/57, pages:PAGE-2227/fields/7, pages:PAGE-2227/fields/70, pages:PAGE-2227/fields/79, pages:PAGE-2227/fields/82, pages:PAGE-2228/fields/10, pages:PAGE-2228/fields/18, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/105, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/121, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/125, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/128, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/147, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/148, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/149, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/150, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/151, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/160, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/161, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/162, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/163, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/166, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/35, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/60, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/63, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/69, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/83, scenarios:FLOW-CURRENT-CUSTOMER/steps/19

验证：CHECK-FLOW-START-BATCH, CHECK-FLOW-EXECUTION-PRIORITY

## 实施任务

- [TASK-018](../tasks/TASK-018.md)
