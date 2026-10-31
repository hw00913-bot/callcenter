# LOCAL-FLOW-ASSIGN 安排当前租户责任跟进人

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md) · [全局逻辑](../global-logic.md)

- [分配本租户责任跟进人与AI安排 · FUNC\-2037](../features/FUNC-2037.md)

## 职责与触发

所属工程模块：未填写

功能：FUNC-2037

触发：在直接跟进业务或当前CALL记录点击安排

## 前置条件

- 当前owner租户管理员及task.assign动作权
- DIRECT分类当前允许且方式明确，或TEMPLATE为ACTIVE run的CALL节点；无在途/排队/重试/未知执行及必要未归档内容
- DIRECT须当前周期ACTIVE；COMPLETED须显式再次直接跟进，不能以旧安排直接起呼。

## 必须遵守的全局规则

- [GR-AUTH](../global-logic.md#GR-AUTH)
- [GR-SCOPE](../global-logic.md#GR-SCOPE)
- [GR-SERIAL](../global-logic.md#GR-SERIAL)
- [GR-CONFIG](../global-logic.md#GR-CONFIG)
- [GR-HANDLING-MODE](../global-logic.md#GR-HANDLING-MODE)

## 输入与输出

输入：[FIELD-FLOW-RECORD-ID](../field-specs.md#FIELD-FLOW-RECORD-ID)、[FIELD-FLOW-RECORD-REVISION](../field-specs.md#FIELD-FLOW-RECORD-REVISION)、[FIELD-FLOW-FOLLOWER](../field-specs.md#FIELD-FLOW-FOLLOWER)、[FIELD-FLOW-AI-SCENE](../field-specs.md#FIELD-FLOW-AI-SCENE)、[FIELD-FLOW-ARRANGEMENT](../field-specs.md#FIELD-FLOW-ARRANGEMENT)、[FIELD-FLOW-ALLOW-DIRECT-FOLLOWUP](../field-specs.md#FIELD-FLOW-ALLOW-DIRECT-FOLLOWUP)、[FIELD-FLOW-HANDLING-MODE](../field-specs.md#FIELD-FLOW-HANDLING-MODE)、[FIELD-FLOW-DIRECT-METHOD](../field-specs.md#FIELD-FLOW-DIRECT-METHOD)、[FIELD-FLOW-DIRECT-CYCLE-ID](../field-specs.md#FIELD-FLOW-DIRECT-CYCLE-ID)、[FIELD-FLOW-DIRECT-STATUS](../field-specs.md#FIELD-FLOW-DIRECT-STATUS)

输出：[FIELD-FLOW-FOLLOWER](../field-specs.md#FIELD-FLOW-FOLLOWER)、[FIELD-FLOW-ARRANGEMENT](../field-specs.md#FIELD-FLOW-ARRANGEMENT)

## 处理步骤

### STEP-FLOW-ASSIGN-1

按DIRECT显式方式或TEMPLATE节点方式读取同源候选；人工核电话资格，AI/预外呼责任人不强坐席

读取：FIELD-FLOW-RECORD-ID, FIELD-FLOW-METHOD, FIELD-FLOW-RECIPIENT, FIELD-FLOW-HANDLING-MODE, FIELD-FLOW-DIRECT-METHOD；写入：FIELD-FLOW-FOLLOWER

规则：GR-AUTH, GR-SCOPE, GR-SERIAL, GR-CONFIG, GR-HANDLING-MODE

### STEP-FLOW-ASSIGN-2

仅选择本租户跟进人；AI场景在同一导入与分配安排入口明确且有效，DIRECT不要求节点标签路由依赖；保存不改方式或owner

读取：FIELD-FLOW-FOLLOWER, FIELD-FLOW-AI-SCENE, FIELD-FLOW-METHOD, FIELD-FLOW-ALLOW-DIRECT-FOLLOWUP, FIELD-FLOW-HANDLING-MODE, FIELD-FLOW-DIRECT-METHOD, FIELD-FLOW-END-FOLLOWUP-ORIGIN；写入：FIELD-FLOW-ARRANGEMENT, FIELD-FLOW-RECORD-REVISION

规则：GR-AUTH, GR-SCOPE, GR-SERIAL, GR-CONFIG, GR-HANDLING-MODE

## 分支与异常

### BRANCH-FLOW-ASSIGN-1

条件：人员失效、原安排不适配或源配置变更

结果：具体说明并保选择，不能保存无权安排

涉及字段：FIELD-FLOW-FOLLOWER, FIELD-FLOW-AI-SCENE

验证：CHECK-FLOW-ASSIGN

### BRANCH-FLOW-ASSIGN-2

条件：合法保存

结果：只改责任及场景安排，不改owner/方式、不起呼

涉及字段：FIELD-FLOW-FOLLOWER, FIELD-FLOW-ARRANGEMENT, FIELD-FLOW-OWNER-TENANT

验证：CHECK-FLOW-ASSIGN

### LOCAL-FLOW-ASSIGN-END-ORIGIN

条件：当前直接周期具有可靠END接续来源

结果：可以按已确认END继续人工跟进；普通DIRECT开关不替代此来源，但当前分类/本人/资源/联系/必要归档照常核验

涉及字段：FIELD-FLOW-END-FOLLOWUP-ORIGIN

验证：CHECK-FLOW-ASSIGN

## 完成后的状态

- 按钮、上下文和模型动作资格一致

## 字段定义

- [FIELD-FLOW-AI-SCENE](../field-specs.md#FIELD-FLOW-AI-SCENE)
- [FIELD-FLOW-ALLOW-DIRECT-FOLLOWUP](../field-specs.md#FIELD-FLOW-ALLOW-DIRECT-FOLLOWUP)
- [FIELD-FLOW-ARRANGEMENT](../field-specs.md#FIELD-FLOW-ARRANGEMENT)
- [FIELD-FLOW-DIRECT-CYCLE-ID](../field-specs.md#FIELD-FLOW-DIRECT-CYCLE-ID)
- [FIELD-FLOW-DIRECT-METHOD](../field-specs.md#FIELD-FLOW-DIRECT-METHOD)
- [FIELD-FLOW-DIRECT-STATUS](../field-specs.md#FIELD-FLOW-DIRECT-STATUS)
- [FIELD-FLOW-END-FOLLOWUP-ORIGIN](../field-specs.md#FIELD-FLOW-END-FOLLOWUP-ORIGIN)
- [FIELD-FLOW-FOLLOWER](../field-specs.md#FIELD-FLOW-FOLLOWER)
- [FIELD-FLOW-HANDLING-MODE](../field-specs.md#FIELD-FLOW-HANDLING-MODE)
- [FIELD-FLOW-METHOD](../field-specs.md#FIELD-FLOW-METHOD)
- [FIELD-FLOW-OWNER-TENANT](../field-specs.md#FIELD-FLOW-OWNER-TENANT)
- [FIELD-FLOW-RECIPIENT](../field-specs.md#FIELD-FLOW-RECIPIENT)
- [FIELD-FLOW-RECORD-ID](../field-specs.md#FIELD-FLOW-RECORD-ID)
- [FIELD-FLOW-RECORD-REVISION](../field-specs.md#FIELD-FLOW-RECORD-REVISION)

## 来源与验证

来源条目：acceptance:AC-2118, acceptance:AC-2119, features:FUNC-2037, features:FUNC-2037/behavior_spec/0/branches/0, features:FUNC-2037/behavior_spec/0/branches/1, features:FUNC-2037/behavior_spec/0/branches/2, features:FUNC-2037/behavior_spec/0/postconditions/0, features:FUNC-2037/behavior_spec/0/preconditions/0, features:FUNC-2037/behavior_spec/0/preconditions/1, features:FUNC-2037/behavior_spec/0/preconditions/2, features:FUNC-2037/behavior_spec/0/steps/0, features:FUNC-2037/behavior_spec/0/steps/1, pages:PAGE-2006/fields/25, pages:PAGE-2006/fields/37, pages:PAGE-2006/fields/59, pages:PAGE-2203/fields/18, pages:PAGE-2203/fields/28, pages:PAGE-2203/fields/32, pages:PAGE-2203/fields/39, pages:PAGE-2203/fields/64, pages:PAGE-2203/fields/65, pages:PAGE-2203/fields/66, pages:PAGE-2204, pages:PAGE-2204/fields/2, pages:PAGE-2204/fields/29, pages:PAGE-2204/fields/3, pages:PAGE-2204/fields/41, pages:PAGE-2204/fields/45, pages:PAGE-2204/fields/47, pages:PAGE-2204/fields/48, pages:PAGE-2204/fields/49, pages:PAGE-2204/fields/85, pages:PAGE-2204/fields/86, pages:PAGE-2204/fields/87, pages:PAGE-2226/fields/16, pages:PAGE-2226/fields/2, pages:PAGE-2226/fields/23, pages:PAGE-2226/fields/26, pages:PAGE-2226/fields/28, pages:PAGE-2226/fields/35, pages:PAGE-2226/fields/36, pages:PAGE-2226/fields/37, pages:PAGE-2227, pages:PAGE-2227/actions/5, pages:PAGE-2227/fields/138, pages:PAGE-2227/fields/139, pages:PAGE-2227/fields/140, pages:PAGE-2227/fields/4, pages:PAGE-2227/fields/42, pages:PAGE-2227/fields/57, pages:PAGE-2227/fields/67, pages:PAGE-2227/fields/7, pages:PAGE-2227/fields/76, pages:PAGE-2227/fields/79, pages:PAGE-2227/fields/80, pages:PAGE-2228/fields/10, pages:PAGE-2228/fields/16, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/147, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/148, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/149, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/150, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/151, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/159, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/34, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/35, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/60, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/67, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/68, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/69, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/70, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/73, scenarios:FLOW-CURRENT-CUSTOMER/steps/15

验证：CHECK-FLOW-ASSIGN

## 实施任务

- [TASK-016](../tasks/TASK-016.md)
