# LOCAL-FLOW-END-HANDOFF 执行END两动作并保原运行事实

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md) · [全局逻辑](../global-logic.md)

- [判断并确认本租户后继节点 · FUNC\-2038](../features/FUNC-2038.md)

## 职责与触发

所属工程模块：未填写

功能：FUNC-2038

触发：有权导入或路径确认可靠定位到当前捕获END后由系统执行

## 前置条件

- 原动作权限、准确业务/负责方/运行/节点及并发依据已核
- 原执行/重试/未知与必要归档门槛满足；纯无呼叫路径不制造跟进事实
- 当前新建/修改模板的END固定正常结束CLOSE，不提供是否直接跟进配置，当前新导入/路由/重开不得接纳旧DIRECT_FOLLOWUP配置；已运行历史按原捕获方案和原合法来源收尾，不改历史为CLOSE，不借旧END来源授权当前新周期。新TASK/DIRECT始终直接跟进，不显示启用流程；旧无TASK来源DIRECT仅保原合法转换能力。

## 必须遵守的全局规则

- [GR-DATA-FACTS](../global-logic.md#GR-DATA-FACTS)
- [GR-SERIAL](../global-logic.md#GR-SERIAL)
- [GR-HANDLING-MODE](../global-logic.md#GR-HANDLING-MODE)
- [GR-PRIVACY](../global-logic.md#GR-PRIVACY)
- [GR-END-ACTION](../global-logic.md#GR-END-ACTION)
- [GR-LIFECYCLE-SETTLEMENT](../global-logic.md#GR-LIFECYCLE-SETTLEMENT)

## 输入与输出

输入：[FIELD-FLOW-END-ACTION](../field-specs.md#FIELD-FLOW-END-ACTION)、[FIELD-FLOW-RECORD-ID](../field-specs.md#FIELD-FLOW-RECORD-ID)、[FIELD-FLOW-OWNER-TENANT](../field-specs.md#FIELD-FLOW-OWNER-TENANT)、[FIELD-FLOW-RUN-ID](../field-specs.md#FIELD-FLOW-RUN-ID)、[FIELD-FLOW-NODE-ID](../field-specs.md#FIELD-FLOW-NODE-ID)

输出：[FIELD-FLOW-RUN-END-ACTION](../field-specs.md#FIELD-FLOW-RUN-END-ACTION)、[FIELD-FLOW-END-FOLLOWUP-ORIGIN](../field-specs.md#FIELD-FLOW-END-FOLLOWUP-ORIGIN)、[FIELD-FLOW-RUN-STATUS](../field-specs.md#FIELD-FLOW-RUN-STATUS)、[FIELD-FLOW-HANDLING-MODE](../field-specs.md#FIELD-FLOW-HANDLING-MODE)、[FIELD-FLOW-DIRECT-CYCLE-ID](../field-specs.md#FIELD-FLOW-DIRECT-CYCLE-ID)、[FIELD-FLOW-DIRECT-CYCLES](../field-specs.md#FIELD-FLOW-DIRECT-CYCLES)、[FIELD-FLOW-DIRECT-STATUS](../field-specs.md#FIELD-FLOW-DIRECT-STATUS)、[FIELD-FLOW-DIRECT-METHOD](../field-specs.md#FIELD-FLOW-DIRECT-METHOD)、[FIELD-FLOW-OUTCOME](../field-specs.md#FIELD-FLOW-OUTCOME)

## 处理步骤

### STEP-FLOW-END-HANDOFF-1

当前准确CLOSE结束原run并封结束节点/时间/租户，不虚构业务达成或通话；旧已捕获END才按其原准确动作解释。

读取：FIELD-FLOW-END-ACTION, FIELD-FLOW-RUN-ID, FIELD-FLOW-NODE-ID, FIELD-FLOW-OWNER-TENANT；写入：FIELD-FLOW-RUN-END-ACTION, FIELD-FLOW-RUN-STATUS, FIELD-FLOW-OUTCOME

规则：GR-DATA-FACTS, GR-SERIAL, GR-END-ACTION

### STEP-FLOW-END-HANDOFF-2

新模板不产生END直接周期；仅旧已捕获DIRECT_FOLLOWUP按原record/owner/来源周期合法收尾，不反写旧事实，不授当前新TASK或新模板例外。

读取：FIELD-FLOW-RUN-END-ACTION, FIELD-FLOW-RECORD-ID, FIELD-FLOW-OWNER-TENANT；写入：FIELD-FLOW-END-FOLLOWUP-ORIGIN, FIELD-FLOW-HANDLING-MODE, FIELD-FLOW-DIRECT-CYCLE-ID, FIELD-FLOW-DIRECT-CYCLES, FIELD-FLOW-DIRECT-STATUS, FIELD-FLOW-DIRECT-METHOD

规则：GR-HANDLING-MODE, GR-END-ACTION, GR-PRIVACY, GR-LIFECYCLE-SETTLEMENT

## 分支与异常

### BRANCH-FLOW-END-HANDOFF-CLOSE

条件：捕获动作CLOSE

结果：原run结束且不建直接周期/不再跟进，不虚构成交或通话

涉及字段：FIELD-FLOW-RUN-END-ACTION, FIELD-FLOW-RUN-STATUS

验证：CHECK-FLOW-END-HANDOFF

### BRANCH-FLOW-END-HANDOFF-DIRECT

条件：仅旧已运行历史捕获动作DIRECT_FOLLOWUP且原来源可核（当前新配置/输入不得使用）

结果：旧准确END仅保其record/owner/来源directCycleId原首MANUAL合法接续；历史保留不授当前新TASK或新模板资格，后续新周期按各自原准入独立核验。

涉及字段：FIELD-FLOW-END-FOLLOWUP-ORIGIN, FIELD-FLOW-DIRECT-METHOD, FIELD-FLOW-HANDLING-MODE

验证：CHECK-FLOW-END-HANDOFF

### BRANCH-FLOW-END-HANDOFF-DENY

条件：未选动作、伪造来源/旧租户请求或原执行未收敛

结果：拒绝或待核，不写半次结束/新周期，不泄露目标方后续资料

涉及字段：FIELD-FLOW-END-ACTION, FIELD-FLOW-END-FOLLOWUP-ORIGIN, FIELD-FLOW-OWNER-TENANT

验证：CHECK-FLOW-END-HANDOFF

## 完成后的状态

- 当前准确run以CLOSE正常结束，保内容/通话/运行事实，不自动起呼。
- 旧已捕获END来源及旧独立直接周期按原合同只读或合法收尾，不生成新配置能力。

## 字段定义

- [FIELD-FLOW-END-ACTION](../field-specs.md#FIELD-FLOW-END-ACTION)
- [FIELD-FLOW-RECORD-ID](../field-specs.md#FIELD-FLOW-RECORD-ID)
- [FIELD-FLOW-OWNER-TENANT](../field-specs.md#FIELD-FLOW-OWNER-TENANT)
- [FIELD-FLOW-RUN-ID](../field-specs.md#FIELD-FLOW-RUN-ID)
- [FIELD-FLOW-NODE-ID](../field-specs.md#FIELD-FLOW-NODE-ID)
- [FIELD-FLOW-RUN-END-ACTION](../field-specs.md#FIELD-FLOW-RUN-END-ACTION)
- [FIELD-FLOW-END-FOLLOWUP-ORIGIN](../field-specs.md#FIELD-FLOW-END-FOLLOWUP-ORIGIN)
- [FIELD-FLOW-RUN-STATUS](../field-specs.md#FIELD-FLOW-RUN-STATUS)
- [FIELD-FLOW-HANDLING-MODE](../field-specs.md#FIELD-FLOW-HANDLING-MODE)
- [FIELD-FLOW-DIRECT-CYCLE-ID](../field-specs.md#FIELD-FLOW-DIRECT-CYCLE-ID)
- [FIELD-FLOW-DIRECT-CYCLES](../field-specs.md#FIELD-FLOW-DIRECT-CYCLES)
- [FIELD-FLOW-DIRECT-STATUS](../field-specs.md#FIELD-FLOW-DIRECT-STATUS)
- [FIELD-FLOW-DIRECT-METHOD](../field-specs.md#FIELD-FLOW-DIRECT-METHOD)
- [FIELD-FLOW-OUTCOME](../field-specs.md#FIELD-FLOW-OUTCOME)

## 来源与验证

来源条目：acceptance:AC-2141, features:FUNC-2038, features:FUNC-2038/behavior_spec/6/branches/0, features:FUNC-2038/behavior_spec/6/branches/1, features:FUNC-2038/behavior_spec/6/branches/2, features:FUNC-2038/behavior_spec/6/postconditions/0, features:FUNC-2038/behavior_spec/6/postconditions/1, features:FUNC-2038/behavior_spec/6/preconditions/0, features:FUNC-2038/behavior_spec/6/preconditions/1, features:FUNC-2038/behavior_spec/6/preconditions/2, features:FUNC-2038/behavior_spec/6/steps/0, features:FUNC-2038/behavior_spec/6/steps/1, pages:PAGE-2006/fields/27, pages:PAGE-2006/fields/60, pages:PAGE-2103/fields/33, pages:PAGE-2203/fields/31, pages:PAGE-2203/fields/32, pages:PAGE-2203/fields/39, pages:PAGE-2203/fields/43, pages:PAGE-2203/fields/64, pages:PAGE-2203/fields/65, pages:PAGE-2203/fields/66, pages:PAGE-2204/fields/42, pages:PAGE-2204/fields/44, pages:PAGE-2204/fields/45, pages:PAGE-2204/fields/48, pages:PAGE-2204/fields/56, pages:PAGE-2204/fields/57, pages:PAGE-2204/fields/85, pages:PAGE-2204/fields/86, pages:PAGE-2204/fields/87, pages:PAGE-2205/fields/61, pages:PAGE-2226/fields/24, pages:PAGE-2226/fields/25, pages:PAGE-2226/fields/26, pages:PAGE-2226/fields/28, pages:PAGE-2226/fields/29, pages:PAGE-2226/fields/30, pages:PAGE-2226/fields/35, pages:PAGE-2226/fields/36, pages:PAGE-2226/fields/37, pages:PAGE-2227, pages:PAGE-2227/fields/138, pages:PAGE-2227/fields/139, pages:PAGE-2227/fields/140, pages:PAGE-2227/fields/61, pages:PAGE-2227/fields/66, pages:PAGE-2227/fields/67, pages:PAGE-2227/fields/79, pages:PAGE-2227/fields/97, pages:PAGE-2227/fields/99, pages:PAGE-2228/fields/12, pages:PAGE-2228/fields/32, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/117, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/148, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/149, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/150, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/151, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/152, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/157, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/158, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/159, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/31, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/60, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/67, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/75, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/77, scenarios:FLOW-CURRENT-CUSTOMER/steps/42

验证：CHECK-FLOW-END-HANDOFF

## 实施任务

- [TASK-024](../tasks/TASK-024.md)
