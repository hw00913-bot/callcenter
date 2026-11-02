# LOCAL-FLOW-ASSIGN-BATCH 同组批量手动分配具体执行目标

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md) · [全局逻辑](../global-logic.md)

- [分配本租户具体任务或坐席及执行优先级 · FUNC\-2037](../features/FUNC-2037.md)

## 职责与触发

所属工程模块：未填写

功能：FUNC-2037

触发：勾选同组记录后分配跟进人

## 前置条件

- 管理员对每行有当前assign资格
- 分组含owner/分类/捕获模板/节点/方式/场景一致

## 必须遵守的全局规则

- [GR-AUTH](../global-logic.md#GR-AUTH)
- [GR-SCOPE](../global-logic.md#GR-SCOPE)
- [GR-SERIAL](../global-logic.md#GR-SERIAL)
- [GR-CONFIG](../global-logic.md#GR-CONFIG)
- [GR-HANDLING-MODE](../global-logic.md#GR-HANDLING-MODE)
- [GR-EXECUTION-ARRANGEMENT](../global-logic.md#GR-EXECUTION-ARRANGEMENT)
- [GR-ASSIGNMENT-SIMPLIFICATION](../global-logic.md#GR-ASSIGNMENT-SIMPLIFICATION)

## 输入与输出

输入：[FIELD-FLOW-RECORD-ID](../field-specs.md#FIELD-FLOW-RECORD-ID)、[FIELD-FLOW-AI-SCENE](../field-specs.md#FIELD-FLOW-AI-SCENE)、[FIELD-FLOW-ARRANGEMENT](../field-specs.md#FIELD-FLOW-ARRANGEMENT)、[FIELD-FLOW-RECORD-REVISION](../field-specs.md#FIELD-FLOW-RECORD-REVISION)、[FIELD-FLOW-ALLOW-DIRECT-FOLLOWUP](../field-specs.md#FIELD-FLOW-ALLOW-DIRECT-FOLLOWUP)、[FIELD-FLOW-HANDLING-MODE](../field-specs.md#FIELD-FLOW-HANDLING-MODE)、[FIELD-FLOW-DIRECT-METHOD](../field-specs.md#FIELD-FLOW-DIRECT-METHOD)、[FIELD-FLOW-DIRECT-CYCLE-ID](../field-specs.md#FIELD-FLOW-DIRECT-CYCLE-ID)、[FIELD-FLOW-DIRECT-STATUS](../field-specs.md#FIELD-FLOW-DIRECT-STATUS)、[FIELD-FLOW-EXECUTION-RESOURCE](../field-specs.md#FIELD-FLOW-EXECUTION-RESOURCE)、[FIELD-FLOW-EXECUTION-PRIORITY](../field-specs.md#FIELD-FLOW-EXECUTION-PRIORITY)、[FIELD-FLOW-EXECUTION-QUEUED-AT](../field-specs.md#FIELD-FLOW-EXECUTION-QUEUED-AT)、[FIELD-FLOW-EXECUTION-QUEUE-SEQUENCE](../field-specs.md#FIELD-FLOW-EXECUTION-QUEUE-SEQUENCE)、[FIELD-FLOW-MANUAL-ASSIGNMENT-MODE](../field-specs.md#FIELD-FLOW-MANUAL-ASSIGNMENT-MODE)

输出：[FIELD-FLOW-FOLLOWER](../field-specs.md#FIELD-FLOW-FOLLOWER)、[FIELD-FLOW-ARRANGEMENT](../field-specs.md#FIELD-FLOW-ARRANGEMENT)、[FIELD-FLOW-EXECUTION-RESOURCE](../field-specs.md#FIELD-FLOW-EXECUTION-RESOURCE)、[FIELD-FLOW-EXECUTION-PRIORITY](../field-specs.md#FIELD-FLOW-EXECUTION-PRIORITY)、[FIELD-FLOW-EXECUTION-QUEUED-AT](../field-specs.md#FIELD-FLOW-EXECUTION-QUEUED-AT)、[FIELD-FLOW-EXECUTION-QUEUE-SEQUENCE](../field-specs.md#FIELD-FLOW-EXECUTION-QUEUE-SEQUENCE)

## 处理步骤

### STEP-FLOW-ASSIGN-BATCH-1

逐条读取实际可安排上下文并求共同有效候选

读取：FIELD-FLOW-RECORD-ID, FIELD-FLOW-ARRANGEMENT；写入：无

规则：GR-AUTH, GR-SCOPE, GR-SERIAL, GR-CONFIG

### STEP-FLOW-ASSIGN-BATCH-2

同组按方式确认任务或人工分配方式/坐席、必要scene及五档等级，不选择独立责任人；任一资源无权或失效全组不写

读取：FIELD-FLOW-AI-SCENE, FIELD-FLOW-RECORD-REVISION；写入：FIELD-FLOW-FOLLOWER, FIELD-FLOW-ARRANGEMENT

规则：GR-AUTH, GR-SCOPE, GR-SERIAL, GR-CONFIG

### STEP-FLOW-ASSIGN-BATCH-3

DIRECT按模式/分类/方式/场景等当前权威安排分组，TEMPLATE另按run捕获方案和CALL身份分组；混组拒绝，不以空nodeId误合直接业务；同组共同候选中选择本方式具体任务或人工分配方式/坐席、必要AI场景及五档等级，逐条重核后同次写入；任一行失败全组不写，保原手动分配入口。 当前/旧/generic供应商专属快照与兼容副本只按可信原始任务/批次租户及品牌投影，所有值和配置指纹均受同一范围约束，不泄露给来源方或另一租户；公共业务资料及原截止历史保持。预外呼新安排/执行同核已配置分类和品牌，统一历史未知不在读取时首次补类或换类。 导入与明确执行使用相同底层配置语义指纹；已知成功准入包装字段和对象键序不构成业务配置变化。旧schema2 TASK/DIRECT仅在完整准确身份及已知wrapper/basis证明等价时只读兼容；未知附加项或真实映射/来源/模板/状态变化继续拒绝，不回写旧快照，TEMPLATE标签依赖保完整指纹。 当前排队事实仅属于准确当前run/nodeRun/directCycle及有效资源安排；新运行未安排清当前queue别名，显示未记录，不能借旧运行队列时间或业务createdAt抢队。相同当前运行/资源仅重存或调等级保原FIFO，新运行重新分配同资源才产生新queuedAt/queueSequence。未安排待办排序与队列时间展示分开，按当前节点进入/当前周期开始的可信时间，身份未知保持未知。

读取：FIELD-FLOW-HANDLING-MODE, FIELD-FLOW-DIRECT-METHOD, FIELD-FLOW-EXECUTION-RESOURCE, FIELD-FLOW-EXECUTION-PRIORITY, FIELD-FLOW-EXECUTION-QUEUED-AT, FIELD-FLOW-EXECUTION-QUEUE-SEQUENCE, FIELD-FLOW-MANUAL-ASSIGNMENT-MODE；写入：FIELD-FLOW-EXECUTION-RESOURCE, FIELD-FLOW-EXECUTION-PRIORITY, FIELD-FLOW-EXECUTION-QUEUED-AT, FIELD-FLOW-EXECUTION-QUEUE-SEQUENCE

规则：GR-AUTH, GR-SCOPE, GR-SERIAL, GR-CONFIG, GR-HANDLING-MODE, GR-EXECUTION-ARRANGEMENT, GR-ASSIGNMENT-SIMPLIFICATION

## 分支与异常

### BRANCH-FLOW-ASSIGN-BATCH-1

条件：跨组或任一记录/候选不合法

结果：全组不写，提示分组或具体不合格原因

涉及字段：FIELD-FLOW-ARRANGEMENT

验证：CHECK-FLOW-ASSIGN-BATCH

### BRANCH-FLOW-ASSIGN-BATCH-2

条件：全部合法

结果：同次保存组内安排，不自动批起呼

涉及字段：FIELD-FLOW-FOLLOWER, FIELD-FLOW-ARRANGEMENT

验证：CHECK-FLOW-ASSIGN-BATCH

## 完成后的状态

- 不按相同nodeId误合不同模板组

## 字段定义

- [FIELD-FLOW-RECORD-ID](../field-specs.md#FIELD-FLOW-RECORD-ID)
- [FIELD-FLOW-AI-SCENE](../field-specs.md#FIELD-FLOW-AI-SCENE)
- [FIELD-FLOW-ARRANGEMENT](../field-specs.md#FIELD-FLOW-ARRANGEMENT)
- [FIELD-FLOW-RECORD-REVISION](../field-specs.md#FIELD-FLOW-RECORD-REVISION)
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
- [FIELD-FLOW-FOLLOWER](../field-specs.md#FIELD-FLOW-FOLLOWER)

## 来源与验证

来源条目：acceptance:AC-2119, features:FUNC-2037, features:FUNC-2037/behavior_spec/1/branches/0, features:FUNC-2037/behavior_spec/1/branches/1, features:FUNC-2037/behavior_spec/1/postconditions/0, features:FUNC-2037/behavior_spec/1/preconditions/0, features:FUNC-2037/behavior_spec/1/preconditions/1, features:FUNC-2037/behavior_spec/1/steps/0, features:FUNC-2037/behavior_spec/1/steps/1, features:FUNC-2037/behavior_spec/1/steps/2, pages:PAGE-2006/fields/59, pages:PAGE-2103/fields/32, pages:PAGE-2103/fields/33, pages:PAGE-2203/fields/18, pages:PAGE-2203/fields/39, pages:PAGE-2203/fields/64, pages:PAGE-2203/fields/65, pages:PAGE-2203/fields/66, pages:PAGE-2204, pages:PAGE-2204/fields/2, pages:PAGE-2204/fields/29, pages:PAGE-2204/fields/3, pages:PAGE-2204/fields/48, pages:PAGE-2204/fields/49, pages:PAGE-2204/fields/85, pages:PAGE-2204/fields/86, pages:PAGE-2204/fields/87, pages:PAGE-2204/fields/91, pages:PAGE-2204/fields/92, pages:PAGE-2204/fields/93, pages:PAGE-2204/fields/94, pages:PAGE-2204/fields/95, pages:PAGE-2205/fields/60, pages:PAGE-2205/fields/61, pages:PAGE-2226/fields/16, pages:PAGE-2226/fields/2, pages:PAGE-2226/fields/28, pages:PAGE-2226/fields/35, pages:PAGE-2226/fields/36, pages:PAGE-2226/fields/37, pages:PAGE-2226/fields/39, pages:PAGE-2226/fields/40, pages:PAGE-2226/fields/41, pages:PAGE-2226/fields/42, pages:PAGE-2226/fields/43, pages:PAGE-2227/fields/138, pages:PAGE-2227/fields/139, pages:PAGE-2227/fields/140, pages:PAGE-2227/fields/144, pages:PAGE-2227/fields/145, pages:PAGE-2227/fields/146, pages:PAGE-2227/fields/147, pages:PAGE-2227/fields/148, pages:PAGE-2227/fields/4, pages:PAGE-2227/fields/42, pages:PAGE-2227/fields/7, pages:PAGE-2227/fields/79, pages:PAGE-2227/fields/80, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/147, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/148, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/149, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/150, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/151, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/160, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/161, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/162, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/163, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/166, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/60, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/68, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/69, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/70, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/73, scenarios:FLOW-CURRENT-CUSTOMER/steps/16

验证：CHECK-FLOW-ASSIGN-BATCH

## 实施任务

- [TASK-016](../tasks/TASK-016.md)
