# LOCAL-FLOW-ASSIGN-BATCH 同组批量安排

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md) · [全局逻辑](../global-logic.md)

- [分配本租户责任跟进人与AI安排 · FUNC\-2037](../features/FUNC-2037.md)

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

## 输入与输出

输入：[FIELD-FLOW-RECORD-ID](../field-specs.md#FIELD-FLOW-RECORD-ID)、[FIELD-FLOW-FOLLOWER](../field-specs.md#FIELD-FLOW-FOLLOWER)、[FIELD-FLOW-AI-SCENE](../field-specs.md#FIELD-FLOW-AI-SCENE)、[FIELD-FLOW-ARRANGEMENT](../field-specs.md#FIELD-FLOW-ARRANGEMENT)、[FIELD-FLOW-RECORD-REVISION](../field-specs.md#FIELD-FLOW-RECORD-REVISION)、[FIELD-FLOW-ALLOW-DIRECT-FOLLOWUP](../field-specs.md#FIELD-FLOW-ALLOW-DIRECT-FOLLOWUP)、[FIELD-FLOW-HANDLING-MODE](../field-specs.md#FIELD-FLOW-HANDLING-MODE)、[FIELD-FLOW-DIRECT-METHOD](../field-specs.md#FIELD-FLOW-DIRECT-METHOD)、[FIELD-FLOW-DIRECT-CYCLE-ID](../field-specs.md#FIELD-FLOW-DIRECT-CYCLE-ID)、[FIELD-FLOW-DIRECT-STATUS](../field-specs.md#FIELD-FLOW-DIRECT-STATUS)

输出：[FIELD-FLOW-FOLLOWER](../field-specs.md#FIELD-FLOW-FOLLOWER)、[FIELD-FLOW-ARRANGEMENT](../field-specs.md#FIELD-FLOW-ARRANGEMENT)

## 处理步骤

### STEP-FLOW-ASSIGN-BATCH-1

逐条读取实际可安排上下文并求共同有效候选

读取：FIELD-FLOW-RECORD-ID, FIELD-FLOW-ARRANGEMENT；写入：无

规则：GR-AUTH, GR-SCOPE, GR-SERIAL, GR-CONFIG

### STEP-FLOW-ASSIGN-BATCH-2

同组选择人及必要AI场景，提交前每行重核

读取：FIELD-FLOW-FOLLOWER, FIELD-FLOW-AI-SCENE, FIELD-FLOW-RECORD-REVISION；写入：FIELD-FLOW-FOLLOWER, FIELD-FLOW-ARRANGEMENT

规则：GR-AUTH, GR-SCOPE, GR-SERIAL, GR-CONFIG

### STEP-FLOW-ASSIGN-BATCH-3

DIRECT按模式/分类/方式/场景等当前权威安排分组，TEMPLATE另按run捕获方案和CALL身份分组；混组拒绝，不以空nodeId误合直接业务

读取：FIELD-FLOW-HANDLING-MODE, FIELD-FLOW-DIRECT-METHOD；写入：无

规则：GR-AUTH, GR-SCOPE, GR-SERIAL, GR-CONFIG, GR-HANDLING-MODE

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

- [FIELD-FLOW-AI-SCENE](../field-specs.md#FIELD-FLOW-AI-SCENE)
- [FIELD-FLOW-ALLOW-DIRECT-FOLLOWUP](../field-specs.md#FIELD-FLOW-ALLOW-DIRECT-FOLLOWUP)
- [FIELD-FLOW-ARRANGEMENT](../field-specs.md#FIELD-FLOW-ARRANGEMENT)
- [FIELD-FLOW-DIRECT-CYCLE-ID](../field-specs.md#FIELD-FLOW-DIRECT-CYCLE-ID)
- [FIELD-FLOW-DIRECT-METHOD](../field-specs.md#FIELD-FLOW-DIRECT-METHOD)
- [FIELD-FLOW-DIRECT-STATUS](../field-specs.md#FIELD-FLOW-DIRECT-STATUS)
- [FIELD-FLOW-FOLLOWER](../field-specs.md#FIELD-FLOW-FOLLOWER)
- [FIELD-FLOW-HANDLING-MODE](../field-specs.md#FIELD-FLOW-HANDLING-MODE)
- [FIELD-FLOW-RECORD-ID](../field-specs.md#FIELD-FLOW-RECORD-ID)
- [FIELD-FLOW-RECORD-REVISION](../field-specs.md#FIELD-FLOW-RECORD-REVISION)

## 来源与验证

来源条目：acceptance:AC-2119, features:FUNC-2037, features:FUNC-2037/behavior_spec/1/branches/0, features:FUNC-2037/behavior_spec/1/branches/1, features:FUNC-2037/behavior_spec/1/postconditions/0, features:FUNC-2037/behavior_spec/1/preconditions/0, features:FUNC-2037/behavior_spec/1/preconditions/1, features:FUNC-2037/behavior_spec/1/steps/0, features:FUNC-2037/behavior_spec/1/steps/1, features:FUNC-2037/behavior_spec/1/steps/2, pages:PAGE-2006/fields/59, pages:PAGE-2203/fields/18, pages:PAGE-2203/fields/39, pages:PAGE-2203/fields/64, pages:PAGE-2203/fields/65, pages:PAGE-2203/fields/66, pages:PAGE-2204, pages:PAGE-2204/fields/2, pages:PAGE-2204/fields/29, pages:PAGE-2204/fields/3, pages:PAGE-2204/fields/48, pages:PAGE-2204/fields/49, pages:PAGE-2204/fields/85, pages:PAGE-2204/fields/86, pages:PAGE-2204/fields/87, pages:PAGE-2226/fields/16, pages:PAGE-2226/fields/2, pages:PAGE-2226/fields/28, pages:PAGE-2226/fields/35, pages:PAGE-2226/fields/36, pages:PAGE-2226/fields/37, pages:PAGE-2227/fields/138, pages:PAGE-2227/fields/139, pages:PAGE-2227/fields/140, pages:PAGE-2227/fields/4, pages:PAGE-2227/fields/42, pages:PAGE-2227/fields/7, pages:PAGE-2227/fields/79, pages:PAGE-2227/fields/80, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/147, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/148, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/149, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/150, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/151, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/60, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/68, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/69, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/70, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/73, scenarios:FLOW-CURRENT-CUSTOMER/steps/16

验证：CHECK-FLOW-ASSIGN-BATCH

## 实施任务

- [TASK-016](../tasks/TASK-016.md)
