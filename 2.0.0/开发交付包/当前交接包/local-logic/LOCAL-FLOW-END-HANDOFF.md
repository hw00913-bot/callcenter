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

## 必须遵守的全局规则

- [GR-DATA-FACTS](../global-logic.md#GR-DATA-FACTS)
- [GR-SERIAL](../global-logic.md#GR-SERIAL)
- [GR-HANDLING-MODE](../global-logic.md#GR-HANDLING-MODE)
- [GR-PRIVACY](../global-logic.md#GR-PRIVACY)
- [GR-END-ACTION](../global-logic.md#GR-END-ACTION)

## 输入与输出

输入：[FIELD-FLOW-END-ACTION](../field-specs.md#FIELD-FLOW-END-ACTION)、[FIELD-FLOW-RECORD-ID](../field-specs.md#FIELD-FLOW-RECORD-ID)、[FIELD-FLOW-OWNER-TENANT](../field-specs.md#FIELD-FLOW-OWNER-TENANT)、[FIELD-FLOW-RUN-ID](../field-specs.md#FIELD-FLOW-RUN-ID)、[FIELD-FLOW-NODE-ID](../field-specs.md#FIELD-FLOW-NODE-ID)

输出：[FIELD-FLOW-RUN-END-ACTION](../field-specs.md#FIELD-FLOW-RUN-END-ACTION)、[FIELD-FLOW-END-FOLLOWUP-ORIGIN](../field-specs.md#FIELD-FLOW-END-FOLLOWUP-ORIGIN)、[FIELD-FLOW-RUN-STATUS](../field-specs.md#FIELD-FLOW-RUN-STATUS)、[FIELD-FLOW-HANDLING-MODE](../field-specs.md#FIELD-FLOW-HANDLING-MODE)、[FIELD-FLOW-DIRECT-CYCLE-ID](../field-specs.md#FIELD-FLOW-DIRECT-CYCLE-ID)、[FIELD-FLOW-DIRECT-CYCLES](../field-specs.md#FIELD-FLOW-DIRECT-CYCLES)、[FIELD-FLOW-DIRECT-STATUS](../field-specs.md#FIELD-FLOW-DIRECT-STATUS)、[FIELD-FLOW-DIRECT-METHOD](../field-specs.md#FIELD-FLOW-DIRECT-METHOD)、[FIELD-FLOW-OUTCOME](../field-specs.md#FIELD-FLOW-OUTCOME)

## 处理步骤

### STEP-FLOW-END-HANDOFF-1

先封原run结束时间/节点/租户和准确endAction；系统摘要是结束/转无模板，不配置业务达成

读取：FIELD-FLOW-END-ACTION, FIELD-FLOW-RUN-ID, FIELD-FLOW-NODE-ID, FIELD-FLOW-OWNER-TENANT；写入：FIELD-FLOW-RUN-END-ACTION, FIELD-FLOW-RUN-STATUS, FIELD-FLOW-OUTCOME

规则：GR-DATA-FACTS, GR-SERIAL, GR-END-ACTION

### STEP-FLOW-END-HANDOFF-2

DIRECT_FOLLOWUP保同record/owner和已结束历史，清当前run/节点引用，新建MANUAL周期及可信END来源；原责任人仅当前仍有效且具电话资格才沿用，否则待安排

读取：FIELD-FLOW-RUN-END-ACTION, FIELD-FLOW-RECORD-ID, FIELD-FLOW-OWNER-TENANT；写入：FIELD-FLOW-END-FOLLOWUP-ORIGIN, FIELD-FLOW-HANDLING-MODE, FIELD-FLOW-DIRECT-CYCLE-ID, FIELD-FLOW-DIRECT-CYCLES, FIELD-FLOW-DIRECT-STATUS, FIELD-FLOW-DIRECT-METHOD

规则：GR-HANDLING-MODE, GR-END-ACTION, GR-PRIVACY

## 分支与异常

### BRANCH-FLOW-END-HANDOFF-CLOSE

条件：捕获动作CLOSE

结果：原run结束且不建直接周期/不再跟进，不虚构成交或通话

涉及字段：FIELD-FLOW-RUN-END-ACTION, FIELD-FLOW-RUN-STATUS

验证：CHECK-FLOW-END-HANDOFF

### BRANCH-FLOW-END-HANDOFF-DIRECT

条件：捕获动作DIRECT_FOLLOWUP且来源可核

结果：合法END来源可授权无模板接续，不要求分类允许普通DIRECT导入；原角色/资源/联系/实际本人保存仍检查，人工起呼仍须明确发起

涉及字段：FIELD-FLOW-END-FOLLOWUP-ORIGIN, FIELD-FLOW-DIRECT-METHOD, FIELD-FLOW-HANDLING-MODE

验证：CHECK-FLOW-END-HANDOFF

### BRANCH-FLOW-END-HANDOFF-DENY

条件：未选动作、伪造来源/旧租户请求或原执行未收敛

结果：拒绝或待核，不写半次结束/新周期，不泄露目标方后续资料

涉及字段：FIELD-FLOW-END-ACTION, FIELD-FLOW-END-FOLLOWUP-ORIGIN, FIELD-FLOW-OWNER-TENANT

验证：CHECK-FLOW-END-HANDOFF

## 完成后的状态

- 原run明确结束且保原计划/节点/通话/快照
- CLOSE关闭不再跟进；DIRECT_FOLLOWUP建立当前租户MANUAL直接周期但不自动起呼

## 字段定义

- [FIELD-FLOW-DIRECT-CYCLE-ID](../field-specs.md#FIELD-FLOW-DIRECT-CYCLE-ID)
- [FIELD-FLOW-DIRECT-CYCLES](../field-specs.md#FIELD-FLOW-DIRECT-CYCLES)
- [FIELD-FLOW-DIRECT-METHOD](../field-specs.md#FIELD-FLOW-DIRECT-METHOD)
- [FIELD-FLOW-DIRECT-STATUS](../field-specs.md#FIELD-FLOW-DIRECT-STATUS)
- [FIELD-FLOW-END-ACTION](../field-specs.md#FIELD-FLOW-END-ACTION)
- [FIELD-FLOW-END-FOLLOWUP-ORIGIN](../field-specs.md#FIELD-FLOW-END-FOLLOWUP-ORIGIN)
- [FIELD-FLOW-HANDLING-MODE](../field-specs.md#FIELD-FLOW-HANDLING-MODE)
- [FIELD-FLOW-NODE-ID](../field-specs.md#FIELD-FLOW-NODE-ID)
- [FIELD-FLOW-OUTCOME](../field-specs.md#FIELD-FLOW-OUTCOME)
- [FIELD-FLOW-OWNER-TENANT](../field-specs.md#FIELD-FLOW-OWNER-TENANT)
- [FIELD-FLOW-RECORD-ID](../field-specs.md#FIELD-FLOW-RECORD-ID)
- [FIELD-FLOW-RUN-END-ACTION](../field-specs.md#FIELD-FLOW-RUN-END-ACTION)
- [FIELD-FLOW-RUN-ID](../field-specs.md#FIELD-FLOW-RUN-ID)
- [FIELD-FLOW-RUN-STATUS](../field-specs.md#FIELD-FLOW-RUN-STATUS)

## 来源与验证

来源条目：acceptance:AC-2141, features:FUNC-2038, features:FUNC-2038/behavior_spec/6/branches/0, features:FUNC-2038/behavior_spec/6/branches/1, features:FUNC-2038/behavior_spec/6/branches/2, features:FUNC-2038/behavior_spec/6/postconditions/0, features:FUNC-2038/behavior_spec/6/postconditions/1, features:FUNC-2038/behavior_spec/6/preconditions/0, features:FUNC-2038/behavior_spec/6/preconditions/1, features:FUNC-2038/behavior_spec/6/steps/0, features:FUNC-2038/behavior_spec/6/steps/1, pages:PAGE-2006/fields/27, pages:PAGE-2006/fields/60, pages:PAGE-2203/fields/31, pages:PAGE-2203/fields/32, pages:PAGE-2203/fields/39, pages:PAGE-2203/fields/43, pages:PAGE-2203/fields/64, pages:PAGE-2203/fields/65, pages:PAGE-2203/fields/66, pages:PAGE-2204/fields/42, pages:PAGE-2204/fields/44, pages:PAGE-2204/fields/45, pages:PAGE-2204/fields/48, pages:PAGE-2204/fields/56, pages:PAGE-2204/fields/57, pages:PAGE-2204/fields/85, pages:PAGE-2204/fields/86, pages:PAGE-2204/fields/87, pages:PAGE-2226/fields/24, pages:PAGE-2226/fields/25, pages:PAGE-2226/fields/26, pages:PAGE-2226/fields/28, pages:PAGE-2226/fields/29, pages:PAGE-2226/fields/30, pages:PAGE-2226/fields/35, pages:PAGE-2226/fields/36, pages:PAGE-2226/fields/37, pages:PAGE-2227, pages:PAGE-2227/fields/138, pages:PAGE-2227/fields/139, pages:PAGE-2227/fields/140, pages:PAGE-2227/fields/61, pages:PAGE-2227/fields/66, pages:PAGE-2227/fields/67, pages:PAGE-2227/fields/79, pages:PAGE-2227/fields/97, pages:PAGE-2227/fields/99, pages:PAGE-2228/fields/12, pages:PAGE-2228/fields/32, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/117, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/148, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/149, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/150, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/151, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/152, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/157, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/158, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/159, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/31, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/60, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/67, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/75, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/77, scenarios:FLOW-CURRENT-CUSTOMER/steps/42

验证：CHECK-FLOW-END-HANDOFF

## 实施任务

- [TASK-024](../tasks/TASK-024.md)
