# LOCAL-FLOW-ADVANCE 确认本租户节点推进或END

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md) · [全局逻辑](../global-logic.md)

- [判断并确认本租户后继节点 · FUNC\-2038](../features/FUNC-2038.md)

## 职责与触发

所属工程模块：未填写

功能：FUNC-2038

触发：人员确认唯一已满足后继路径

## 前置条件

- handlingMode=TEMPLATE且准确当前run/node可核
- 对准确业务有当前本租户办理权
- 确认业务/run/node/owner及并发依据仍一致
- 当前CALL实际拨打及必要跟进已归档
- 无执行/重试/unknown占用

## 必须遵守的全局规则

- [GR-SERIAL](../global-logic.md#GR-SERIAL)
- [GR-DATA-FACTS](../global-logic.md#GR-DATA-FACTS)
- [GR-AUTH](../global-logic.md#GR-AUTH)
- [GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)
- [GR-HANDLING-MODE](../global-logic.md#GR-HANDLING-MODE)

## 输入与输出

输入：[FIELD-FLOW-EDGE-ID](../field-specs.md#FIELD-FLOW-EDGE-ID)、[FIELD-FLOW-EVALUATION-TOKEN](../field-specs.md#FIELD-FLOW-EVALUATION-TOKEN)、[FIELD-FLOW-RECORD-ID](../field-specs.md#FIELD-FLOW-RECORD-ID)、[FIELD-FLOW-HANDLING-MODE](../field-specs.md#FIELD-FLOW-HANDLING-MODE)

输出：[FIELD-FLOW-NODE-RUN-ID](../field-specs.md#FIELD-FLOW-NODE-RUN-ID)、[FIELD-FLOW-RUN-STATUS](../field-specs.md#FIELD-FLOW-RUN-STATUS)、[FIELD-FLOW-OUTCOME](../field-specs.md#FIELD-FLOW-OUTCOME)

## 处理步骤

### STEP-FLOW-ADVANCE-1

重算同一selected边、token及后继承接范围，不静默改选

读取：FIELD-FLOW-EVALUATION-TOKEN, FIELD-FLOW-EDGE-ID, FIELD-FLOW-RECIPIENT；写入：无

规则：GR-SERIAL, GR-DATA-FACTS, GR-AUTH, GR-UNKNOWN

### STEP-FLOW-ADVANCE-2

进入准确后继；到END由系统按endAction先结束原run，再接续无模板人工周期或关闭，不把运行结束等同业务成交

读取：FIELD-FLOW-NEXT-NODE, FIELD-FLOW-EFFECTIVE-PLAN, FIELD-FLOW-END-ACTION, FIELD-FLOW-RUN-END-ACTION；写入：FIELD-FLOW-NODE-RUN-ID, FIELD-FLOW-RUN-STATUS, FIELD-FLOW-OUTCOME

规则：GR-SERIAL, GR-DATA-FACTS, GR-AUTH, GR-UNKNOWN

## 分支与异常

### BRANCH-FLOW-ADVANCE-1

条件：未做实际CALL或未归档/旧确认过期

结果：拒推进并保原node/owner

涉及字段：FIELD-FLOW-NODE-RUN-ID, FIELD-FLOW-EVALUATION-TOKEN

验证：CHECK-FLOW-ADVANCE

### BRANCH-FLOW-ADVANCE-2

条件：明确成功

结果：只推进节点，不自动起呼、不隐式转交

涉及字段：FIELD-FLOW-NODE-RUN-ID, FIELD-FLOW-RUN-STATUS

验证：CHECK-FLOW-ADVANCE

### BRANCH-FLOW-ADVANCE-3

条件：请求未知

结果：核同request，不重复进入节点

涉及字段：FIELD-FLOW-REQUEST-ID, FIELD-FLOW-REQUEST-STATUS

验证：CHECK-FLOW-ADVANCE

### BRANCH-FLOW-ADVANCE-DIRECT

条件：当前业务为DIRECT

结果：拒绝模板判断、推进、转交、废弃运行或模板重开；同租户再次直接跟进沿直接起呼入口，后续流程走独立“启用流程”预检。

涉及字段：FIELD-FLOW-HANDLING-MODE

验证：CHECK-FLOW-ADVANCE

## 完成后的状态

- 无需呼叫业务应在START直接END，不能默认出口绕CALL

## 字段定义

- [FIELD-FLOW-EDGE-ID](../field-specs.md#FIELD-FLOW-EDGE-ID)
- [FIELD-FLOW-EFFECTIVE-PLAN](../field-specs.md#FIELD-FLOW-EFFECTIVE-PLAN)
- [FIELD-FLOW-END-ACTION](../field-specs.md#FIELD-FLOW-END-ACTION)
- [FIELD-FLOW-EVALUATION-TOKEN](../field-specs.md#FIELD-FLOW-EVALUATION-TOKEN)
- [FIELD-FLOW-HANDLING-MODE](../field-specs.md#FIELD-FLOW-HANDLING-MODE)
- [FIELD-FLOW-NEXT-NODE](../field-specs.md#FIELD-FLOW-NEXT-NODE)
- [FIELD-FLOW-NODE-RUN-ID](../field-specs.md#FIELD-FLOW-NODE-RUN-ID)
- [FIELD-FLOW-OUTCOME](../field-specs.md#FIELD-FLOW-OUTCOME)
- [FIELD-FLOW-RECIPIENT](../field-specs.md#FIELD-FLOW-RECIPIENT)
- [FIELD-FLOW-RECORD-ID](../field-specs.md#FIELD-FLOW-RECORD-ID)
- [FIELD-FLOW-REQUEST-ID](../field-specs.md#FIELD-FLOW-REQUEST-ID)
- [FIELD-FLOW-REQUEST-STATUS](../field-specs.md#FIELD-FLOW-REQUEST-STATUS)
- [FIELD-FLOW-RUN-END-ACTION](../field-specs.md#FIELD-FLOW-RUN-END-ACTION)
- [FIELD-FLOW-RUN-STATUS](../field-specs.md#FIELD-FLOW-RUN-STATUS)

## 来源与验证

来源条目：acceptance:AC-2120, acceptance:AC-2122, acceptance:AC-2125, features:FUNC-2038, features:FUNC-2038/behavior_spec/1/branches/0, features:FUNC-2038/behavior_spec/1/branches/1, features:FUNC-2038/behavior_spec/1/branches/2, features:FUNC-2038/behavior_spec/1/branches/3, features:FUNC-2038/behavior_spec/1/postconditions/0, features:FUNC-2038/behavior_spec/1/preconditions/0, features:FUNC-2038/behavior_spec/1/preconditions/1, features:FUNC-2038/behavior_spec/1/preconditions/2, features:FUNC-2038/behavior_spec/1/preconditions/3, features:FUNC-2038/behavior_spec/1/preconditions/4, features:FUNC-2038/behavior_spec/1/steps/0, features:FUNC-2038/behavior_spec/1/steps/1, pages:PAGE-2006/fields/11, pages:PAGE-2006/fields/13, pages:PAGE-2006/fields/26, pages:PAGE-2006/fields/37, pages:PAGE-2006/fields/38, pages:PAGE-2006/fields/39, pages:PAGE-2006/fields/60, pages:PAGE-2203/fields/39, pages:PAGE-2203/fields/64, pages:PAGE-2204/fields/19, pages:PAGE-2204/fields/20, pages:PAGE-2204/fields/25, pages:PAGE-2204/fields/43, pages:PAGE-2204/fields/44, pages:PAGE-2204/fields/47, pages:PAGE-2204/fields/48, pages:PAGE-2204/fields/50, pages:PAGE-2204/fields/51, pages:PAGE-2204/fields/57, pages:PAGE-2204/fields/85, pages:PAGE-2223/fields/12, pages:PAGE-2226/fields/13, pages:PAGE-2226/fields/25, pages:PAGE-2226/fields/28, pages:PAGE-2226/fields/30, pages:PAGE-2226/fields/35, pages:PAGE-2227, pages:PAGE-2227/actions/4, pages:PAGE-2227/fields/138, pages:PAGE-2227/fields/30, pages:PAGE-2227/fields/32, pages:PAGE-2227/fields/37, pages:PAGE-2227/fields/59, pages:PAGE-2227/fields/63, pages:PAGE-2227/fields/66, pages:PAGE-2227/fields/76, pages:PAGE-2227/fields/79, pages:PAGE-2227/fields/81, pages:PAGE-2227/fields/82, pages:PAGE-2227/fields/99, pages:PAGE-2228/fields/11, pages:PAGE-2228/fields/16, pages:PAGE-2228/fields/17, pages:PAGE-2228/fields/18, pages:PAGE-2228/fields/32, pages:PAGE-2228/fields/4, pages:PAGE-2228/fields/6, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/110, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/117, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/120, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/121, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/148, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/157, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/158, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/34, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/36, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/37, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/51, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/60, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/77, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/79, scenarios:FLOW-CURRENT-CUSTOMER/steps/25

验证：CHECK-FLOW-ADVANCE

## 实施任务

- [TASK-024](../tasks/TASK-024.md)
