# LOCAL-FLOW-EVALUATE 读取准确事实并有序判断路径

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md) · [全局逻辑](../global-logic.md)

- [按路径确认同品牌线索转交 · FUNC\-2030](../features/FUNC-2030.md)
- [判断并确认本租户后继节点 · FUNC\-2038](../features/FUNC-2038.md)

## 职责与触发

所属工程模块：未填写

功能：FUNC-2038, FUNC-2030

触发：判断当前后续路径

## 前置条件

- handlingMode=TEMPLATE且准确当前run/node可核
- 对准确业务有当前本租户办理权
- 确认业务/run/node/owner及并发依据仍一致

## 必须遵守的全局规则

- [GR-DATA-FACTS](../global-logic.md#GR-DATA-FACTS)
- [GR-FIELDS](../global-logic.md#GR-FIELDS)
- [GR-SERIAL](../global-logic.md#GR-SERIAL)
- [GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)
- [GR-SCOPE](../global-logic.md#GR-SCOPE)
- [GR-HANDLING-MODE](../global-logic.md#GR-HANDLING-MODE)
- [GR-CUSTOMER-SIP](../global-logic.md#GR-CUSTOMER-SIP)

## 输入与输出

输入：[FIELD-FLOW-EFFECTIVE-PLAN](../field-specs.md#FIELD-FLOW-EFFECTIVE-PLAN)、[FIELD-FLOW-FOLLOWUP-VALUES](../field-specs.md#FIELD-FLOW-FOLLOWUP-VALUES)、[FIELD-FLOW-IMPORT-VALUES](../field-specs.md#FIELD-FLOW-IMPORT-VALUES)、[FIELD-FLOW-INTENDED-STORE-NAME](../field-specs.md#FIELD-FLOW-INTENDED-STORE-NAME)、[FIELD-FLOW-RECORD-ID](../field-specs.md#FIELD-FLOW-RECORD-ID)、[FIELD-FLOW-ROUTING-EVIDENCE](../field-specs.md#FIELD-FLOW-ROUTING-EVIDENCE)、[FIELD-FLOW-ROUTING-FIELD-SNAPSHOT](../field-specs.md#FIELD-FLOW-ROUTING-FIELD-SNAPSHOT)、[FIELD-FLOW-TAG-EVIDENCE](../field-specs.md#FIELD-FLOW-TAG-EVIDENCE)、[FIELD-FLOW-HANDLING-MODE](../field-specs.md#FIELD-FLOW-HANDLING-MODE)

输出：[FIELD-FLOW-EVALUATION](../field-specs.md#FIELD-FLOW-EVALUATION)、[FIELD-FLOW-EVALUATION-TOKEN](../field-specs.md#FIELD-FLOW-EVALUATION-TOKEN)

## 处理步骤

### STEP-FLOW-EVALUATE-1

按规则精确来源和声明scope读取已确认事实，IMPORT无需呼叫

读取：FIELD-FLOW-RULE-SOURCE, FIELD-FLOW-RULE-FIELD, FIELD-FLOW-RESULT-SOURCE, FIELD-FLOW-IMPORT-VALUES, FIELD-FLOW-ROUTING-FIELD-SNAPSHOT；写入：无

规则：GR-DATA-FACTS, GR-FIELDS, GR-SERIAL, GR-UNKNOWN, GR-SCOPE

### STEP-FLOW-EVALUATE-2

计算类型允许单值/多值条件、组和优先路径，未知阻后序/default

读取：FIELD-FLOW-RULE-OPERATOR, FIELD-FLOW-RULE-VALUES, FIELD-FLOW-GROUP-MODE, FIELD-FLOW-BRANCH-PRIORITY；写入：FIELD-FLOW-EVALUATION

规则：GR-DATA-FACTS, GR-FIELDS, GR-SERIAL, GR-UNKNOWN, GR-SCOPE

### STEP-FLOW-EVALUATE-3

记录一致事实与唯一selected边，生成确认token

读取：FIELD-FLOW-RECORD-REVISION, FIELD-FLOW-EVALUATION；写入：FIELD-FLOW-EVALUATION-TOKEN

规则：GR-DATA-FACTS, GR-FIELDS, GR-SERIAL, GR-UNKNOWN, GR-SCOPE

## 分支与异常

### BRANCH-FLOW-EVALUATE-1

条件：缺失、草稿、错租户/错run/错scene或冲突

结果：PENDING并解释来源，不反向当NOT_IN成功

涉及字段：FIELD-FLOW-EVALUATION

验证：CHECK-FLOW-EVALUATE

### BRANCH-FLOW-EVALUATE-2

条件：已知空与非空

结果：空只用为空类命中，EQ/NE/集合不借空放行

涉及字段：FIELD-FLOW-EVALUATION

验证：CHECK-FLOW-EVALUATE

### BRANCH-FLOW-EVALUATE-3

条件：当前新方案缺唯一末位ELSE，或所有条件明确不匹配

结果：缺ELSE的新方案在保存/新输入准入时拒绝；合法方案明确不匹配才用ELSE；未知不落兜底

涉及字段：FIELD-FLOW-WORK-STATE, FIELD-FLOW-EVALUATION

验证：CHECK-FLOW-EVALUATE

### BRANCH-FLOW-EVALUATE-4

条件：首个合法条件或default命中

结果：只选一个，仍需人员确认动作

涉及字段：FIELD-FLOW-EVALUATION, FIELD-FLOW-EVALUATION-TOKEN

验证：CHECK-FLOW-EVALUATE

### BRANCH-FLOW-EVALUATE-DIRECT

条件：当前业务为DIRECT

结果：拒绝模板判断、推进、转交、废弃运行或模板重开；同租户再次直接跟进沿直接起呼入口，后续流程走独立“启用流程”预检。

涉及字段：FIELD-FLOW-HANDLING-MODE

验证：CHECK-FLOW-EVALUATE

### LOCAL-FLOW-EVALUATE-OPTIONAL-NULL

条件：当前新输入中合法启用选填IMPORT缺列

结果：在输入捕获时规范化null，按为空或ELSE判断；必填/目录异常和通话/填写未知不补空；不读改旧快照

涉及字段：FIELD-FLOW-IMPORT-VALUES, FIELD-FLOW-RULE-VALUES

验证：CHECK-FLOW-EVALUATE

## 完成后的状态

- 本次判断不自动执行或改归属；SYSTEM不刷新也不抹除同scope先前有效人工确认

## 字段定义

- [FIELD-FLOW-BRANCH-PRIORITY](../field-specs.md#FIELD-FLOW-BRANCH-PRIORITY)
- [FIELD-FLOW-EFFECTIVE-PLAN](../field-specs.md#FIELD-FLOW-EFFECTIVE-PLAN)
- [FIELD-FLOW-EVALUATION](../field-specs.md#FIELD-FLOW-EVALUATION)
- [FIELD-FLOW-EVALUATION-TOKEN](../field-specs.md#FIELD-FLOW-EVALUATION-TOKEN)
- [FIELD-FLOW-FOLLOWUP-VALUES](../field-specs.md#FIELD-FLOW-FOLLOWUP-VALUES)
- [FIELD-FLOW-GROUP-MODE](../field-specs.md#FIELD-FLOW-GROUP-MODE)
- [FIELD-FLOW-HANDLING-MODE](../field-specs.md#FIELD-FLOW-HANDLING-MODE)
- [FIELD-FLOW-IMPORT-VALUES](../field-specs.md#FIELD-FLOW-IMPORT-VALUES)
- [FIELD-FLOW-INTENDED-STORE-NAME](../field-specs.md#FIELD-FLOW-INTENDED-STORE-NAME)
- [FIELD-FLOW-RECORD-ID](../field-specs.md#FIELD-FLOW-RECORD-ID)
- [FIELD-FLOW-RECORD-REVISION](../field-specs.md#FIELD-FLOW-RECORD-REVISION)
- [FIELD-FLOW-RESULT-SOURCE](../field-specs.md#FIELD-FLOW-RESULT-SOURCE)
- [FIELD-FLOW-ROUTING-EVIDENCE](../field-specs.md#FIELD-FLOW-ROUTING-EVIDENCE)
- [FIELD-FLOW-ROUTING-FIELD-SNAPSHOT](../field-specs.md#FIELD-FLOW-ROUTING-FIELD-SNAPSHOT)
- [FIELD-FLOW-RULE-FIELD](../field-specs.md#FIELD-FLOW-RULE-FIELD)
- [FIELD-FLOW-RULE-OPERATOR](../field-specs.md#FIELD-FLOW-RULE-OPERATOR)
- [FIELD-FLOW-RULE-SOURCE](../field-specs.md#FIELD-FLOW-RULE-SOURCE)
- [FIELD-FLOW-RULE-VALUES](../field-specs.md#FIELD-FLOW-RULE-VALUES)
- [FIELD-FLOW-TAG-EVIDENCE](../field-specs.md#FIELD-FLOW-TAG-EVIDENCE)
- [FIELD-FLOW-WORK-STATE](../field-specs.md#FIELD-FLOW-WORK-STATE)

## 来源与验证

来源条目：acceptance:AC-2105, acceptance:AC-2123, acceptance:AC-2124, acceptance:AC-2125, acceptance:AC-2144, features:FUNC-2030, features:FUNC-2030/behavior_spec/0/branches/0, features:FUNC-2030/behavior_spec/0/branches/1, features:FUNC-2030/behavior_spec/0/branches/2, features:FUNC-2030/behavior_spec/0/branches/3, features:FUNC-2030/behavior_spec/0/branches/4, features:FUNC-2030/behavior_spec/0/branches/5, features:FUNC-2030/behavior_spec/0/postconditions/0, features:FUNC-2030/behavior_spec/0/preconditions/0, features:FUNC-2030/behavior_spec/0/preconditions/1, features:FUNC-2030/behavior_spec/0/preconditions/2, features:FUNC-2030/behavior_spec/0/steps/0, features:FUNC-2030/behavior_spec/0/steps/1, features:FUNC-2030/behavior_spec/0/steps/2, features:FUNC-2038, features:FUNC-2038/behavior_spec/0/branches/0, features:FUNC-2038/behavior_spec/0/branches/1, features:FUNC-2038/behavior_spec/0/branches/2, features:FUNC-2038/behavior_spec/0/branches/3, features:FUNC-2038/behavior_spec/0/branches/4, features:FUNC-2038/behavior_spec/0/branches/5, features:FUNC-2038/behavior_spec/0/postconditions/0, features:FUNC-2038/behavior_spec/0/preconditions/0, features:FUNC-2038/behavior_spec/0/preconditions/1, features:FUNC-2038/behavior_spec/0/preconditions/2, features:FUNC-2038/behavior_spec/0/steps/0, features:FUNC-2038/behavior_spec/0/steps/1, features:FUNC-2038/behavior_spec/0/steps/2, pages:PAGE-2006/fields/1, pages:PAGE-2006/fields/13, pages:PAGE-2006/fields/24, pages:PAGE-2006/fields/40, pages:PAGE-2006/fields/43, pages:PAGE-2006/fields/45, pages:PAGE-2006/fields/46, pages:PAGE-2006/fields/47, pages:PAGE-2006/fields/54, pages:PAGE-2203/fields/21, pages:PAGE-2203/fields/39, pages:PAGE-2203/fields/41, pages:PAGE-2203/fields/42, pages:PAGE-2203/fields/48, pages:PAGE-2203/fields/54, pages:PAGE-2203/fields/64, pages:PAGE-2204/fields/20, pages:PAGE-2204/fields/24, pages:PAGE-2204/fields/25, pages:PAGE-2204/fields/31, pages:PAGE-2204/fields/38, pages:PAGE-2204/fields/40, pages:PAGE-2204/fields/48, pages:PAGE-2204/fields/49, pages:PAGE-2204/fields/54, pages:PAGE-2204/fields/65, pages:PAGE-2204/fields/85, pages:PAGE-2223/fields/12, pages:PAGE-2226/fields/13, pages:PAGE-2226/fields/14, pages:PAGE-2226/fields/19, pages:PAGE-2226/fields/21, pages:PAGE-2226/fields/22, pages:PAGE-2226/fields/28, pages:PAGE-2226/fields/34, pages:PAGE-2226/fields/35, pages:PAGE-2227, pages:PAGE-2227/actions/4, pages:PAGE-2227/fields/107, pages:PAGE-2227/fields/118, pages:PAGE-2227/fields/12, pages:PAGE-2227/fields/138, pages:PAGE-2227/fields/32, pages:PAGE-2227/fields/36, pages:PAGE-2227/fields/37, pages:PAGE-2227/fields/45, pages:PAGE-2227/fields/47, pages:PAGE-2227/fields/50, pages:PAGE-2227/fields/52, pages:PAGE-2227/fields/79, pages:PAGE-2227/fields/80, pages:PAGE-2227/fields/85, pages:PAGE-2227/fields/89, pages:PAGE-2227/fields/90, pages:PAGE-2227/fields/91, pages:PAGE-2227/fields/93, pages:PAGE-2227/fields/94, pages:PAGE-2227/fields/95, pages:PAGE-2228/fields/1, pages:PAGE-2228/fields/19, pages:PAGE-2228/fields/21, pages:PAGE-2228/fields/23, pages:PAGE-2228/fields/24, pages:PAGE-2228/fields/25, pages:PAGE-2228/fields/31, pages:PAGE-2228/fields/6, pages:PAGE-2228/fields/9, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/106, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/107, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/109, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/110, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/123, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/146, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/148, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/39, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/40, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/43, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/44, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/45, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/46, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/47, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/51, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/60, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/65, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/66, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/73, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/95, scenarios:FLOW-CURRENT-CUSTOMER/steps/24

验证：CHECK-FLOW-EVALUATE

## 实施任务

- [TASK-023](../tasks/TASK-023.md)
