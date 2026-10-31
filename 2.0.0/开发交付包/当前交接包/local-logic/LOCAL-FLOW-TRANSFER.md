# LOCAL-FLOW-TRANSFER 确认本租户继续或合法跨租户转交

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md) · [全局逻辑](../global-logic.md)

- [按路径确认同品牌线索转交 · FUNC\-2030](../features/FUNC-2030.md)

## 职责与触发

所属工程模块：未填写

功能：FUNC-2030

触发：在TRANSFER命中路径确认目标

## 前置条件

- handlingMode=TEMPLATE且准确当前run/node可核
- 对准确业务有当前本租户办理权
- 确认业务/run/node/owner及并发依据仍一致
- 线索域有效分支；CURRENT保持本租户，OTHER按同品牌HQ↔STORE
- 无在途/重试/unknown，已有前执行的必要内容/事实已归档

## 必须遵守的全局规则

- [GR-SCOPE](../global-logic.md#GR-SCOPE)
- [GR-AUTH](../global-logic.md#GR-AUTH)
- [GR-PRIVACY](../global-logic.md#GR-PRIVACY)
- [GR-SERIAL](../global-logic.md#GR-SERIAL)
- [GR-DATA-FACTS](../global-logic.md#GR-DATA-FACTS)
- [GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)
- [GR-HANDLING-MODE](../global-logic.md#GR-HANDLING-MODE)
- [GR-LOCAL-ROUTE](../global-logic.md#GR-LOCAL-ROUTE)

## 输入与输出

输入：[FIELD-FLOW-EDGE-ID](../field-specs.md#FIELD-FLOW-EDGE-ID)、[FIELD-FLOW-EVALUATION-TOKEN](../field-specs.md#FIELD-FLOW-EVALUATION-TOKEN)、[FIELD-FLOW-INTENDED-STORE](../field-specs.md#FIELD-FLOW-INTENDED-STORE)、[FIELD-FLOW-INTENDED-STORE-NAME](../field-specs.md#FIELD-FLOW-INTENDED-STORE-NAME)、[FIELD-FLOW-RESOLUTION-TOKEN](../field-specs.md#FIELD-FLOW-RESOLUTION-TOKEN)、[FIELD-FLOW-TARGET-TENANT](../field-specs.md#FIELD-FLOW-TARGET-TENANT)、[FIELD-FLOW-HANDLING-MODE](../field-specs.md#FIELD-FLOW-HANDLING-MODE)

输出：[FIELD-FLOW-OWNER-TENANT](../field-specs.md#FIELD-FLOW-OWNER-TENANT)、[FIELD-FLOW-STAGE-ID](../field-specs.md#FIELD-FLOW-STAGE-ID)、[FIELD-FLOW-STAGE-TRANSFER](../field-specs.md#FIELD-FLOW-STAGE-TRANSFER)、[FIELD-FLOW-DEPARTURE-SNAPSHOT](../field-specs.md#FIELD-FLOW-DEPARTURE-SNAPSHOT)、[FIELD-FLOW-NODE-RUN-ID](../field-specs.md#FIELD-FLOW-NODE-RUN-ID)、[FIELD-FLOW-ARRANGEMENT](../field-specs.md#FIELD-FLOW-ARRANGEMENT)

## 处理步骤

### STEP-FLOW-TRANSFER-1

先区分CURRENT与OTHER；CURRENT锚定准确当前负责方，不查任意门店目标；OTHER仍按意向唯一锚定或HQ ADMIN同次指派

读取：FIELD-FLOW-INTENDED-STORE, FIELD-FLOW-DESTINATION, FIELD-FLOW-TARGET-TENANT；写入：无

规则：GR-SCOPE, GR-AUTH, GR-PRIVACY, GR-SERIAL, GR-DATA-FACTS, GR-UNKNOWN

### STEP-FLOW-TRANSFER-2

重核selected/路径令牌和当前目标版本；CURRENT不能指定外租户或冒充OTHER承接，后继CALL仍核准确方式/AI上下文

读取：FIELD-FLOW-EVALUATION-TOKEN, FIELD-FLOW-RESOLUTION-TOKEN, FIELD-FLOW-RECIPIENT；写入：无

规则：GR-SCOPE, GR-AUTH, GR-PRIVACY, GR-SERIAL, GR-DATA-FACTS, GR-UNKNOWN

### STEP-FLOW-TRANSFER-3

CURRENT仅推进合法后继并记LOCAL_ROUTE，保持owner/run/租户阶段及已有安排和封存结果；OTHER才封截止/切owner建轮次并清旧安排

读取：FIELD-FLOW-OWNER-TENANT, FIELD-FLOW-STAGE-ID, FIELD-FLOW-RECIPIENT；写入：FIELD-FLOW-DEPARTURE-SNAPSHOT, FIELD-FLOW-OWNER-TENANT, FIELD-FLOW-STAGE-ID, FIELD-FLOW-STAGE-TRANSFER, FIELD-FLOW-NODE-RUN-ID, FIELD-FLOW-FOLLOWER, FIELD-FLOW-ARRANGEMENT

规则：GR-SCOPE, GR-AUTH, GR-PRIVACY, GR-SERIAL, GR-DATA-FACTS, GR-UNKNOWN

## 分支与异常

### BRANCH-FLOW-TRANSFER-1

条件：跨品牌、OTHER非法同租户/门店直转/映射不明，或CURRENT伪造外目标/冒充OTHER资格

结果：拒绝并保原事实；当前本租户路径本身不是非法跨租户转交

涉及字段：FIELD-FLOW-OWNER-TENANT, FIELD-FLOW-DESTINATION

验证：CHECK-FLOW-TRANSFER

### BRANCH-FLOW-TRANSFER-2

条件：明确成功

结果：CURRENT不产生跨租户授权/截止/新轮次；OTHER按原准确目标接续，目标另行安排

涉及字段：FIELD-FLOW-RECORD-ID, FIELD-FLOW-OWNER-TENANT, FIELD-FLOW-ARRANGEMENT

验证：CHECK-FLOW-TRANSFER

### BRANCH-FLOW-TRANSFER-3

条件：失败或未知

结果：原事实保留，未知按同请求核对，不重复owner切换

涉及字段：FIELD-FLOW-REQUEST-ID, FIELD-FLOW-REQUEST-STATUS

验证：CHECK-FLOW-TRANSFER

### BRANCH-FLOW-TRANSFER-DIRECT

条件：当前业务为DIRECT

结果：拒绝模板判断、推进、转交、废弃运行或模板重开；同租户再次直接跟进沿直接起呼入口，后续流程走独立“启用流程”预检。

涉及字段：FIELD-FLOW-HANDLING-MODE

验证：CHECK-FLOW-TRANSFER

## 完成后的状态

- 转交不生成客户跟进，不自动呼叫

## 字段定义

- [FIELD-FLOW-ARRANGEMENT](../field-specs.md#FIELD-FLOW-ARRANGEMENT)
- [FIELD-FLOW-DEPARTURE-SNAPSHOT](../field-specs.md#FIELD-FLOW-DEPARTURE-SNAPSHOT)
- [FIELD-FLOW-DESTINATION](../field-specs.md#FIELD-FLOW-DESTINATION)
- [FIELD-FLOW-EDGE-ID](../field-specs.md#FIELD-FLOW-EDGE-ID)
- [FIELD-FLOW-EVALUATION-TOKEN](../field-specs.md#FIELD-FLOW-EVALUATION-TOKEN)
- [FIELD-FLOW-FOLLOWER](../field-specs.md#FIELD-FLOW-FOLLOWER)
- [FIELD-FLOW-HANDLING-MODE](../field-specs.md#FIELD-FLOW-HANDLING-MODE)
- [FIELD-FLOW-INTENDED-STORE](../field-specs.md#FIELD-FLOW-INTENDED-STORE)
- [FIELD-FLOW-INTENDED-STORE-NAME](../field-specs.md#FIELD-FLOW-INTENDED-STORE-NAME)
- [FIELD-FLOW-NODE-RUN-ID](../field-specs.md#FIELD-FLOW-NODE-RUN-ID)
- [FIELD-FLOW-OWNER-TENANT](../field-specs.md#FIELD-FLOW-OWNER-TENANT)
- [FIELD-FLOW-RECIPIENT](../field-specs.md#FIELD-FLOW-RECIPIENT)
- [FIELD-FLOW-RECORD-ID](../field-specs.md#FIELD-FLOW-RECORD-ID)
- [FIELD-FLOW-REQUEST-ID](../field-specs.md#FIELD-FLOW-REQUEST-ID)
- [FIELD-FLOW-REQUEST-STATUS](../field-specs.md#FIELD-FLOW-REQUEST-STATUS)
- [FIELD-FLOW-RESOLUTION-TOKEN](../field-specs.md#FIELD-FLOW-RESOLUTION-TOKEN)
- [FIELD-FLOW-STAGE-ID](../field-specs.md#FIELD-FLOW-STAGE-ID)
- [FIELD-FLOW-STAGE-TRANSFER](../field-specs.md#FIELD-FLOW-STAGE-TRANSFER)
- [FIELD-FLOW-TARGET-TENANT](../field-specs.md#FIELD-FLOW-TARGET-TENANT)

## 来源与验证

来源条目：acceptance:AC-2084, acceptance:AC-2085, acceptance:AC-2086, acceptance:AC-2087, acceptance:AC-2088, acceptance:AC-2089, acceptance:AC-2097, acceptance:AC-2098, acceptance:AC-2099, acceptance:AC-2100, acceptance:AC-2101, acceptance:AC-2145, features:FUNC-2030, features:FUNC-2030/behavior_spec/1/branches/0, features:FUNC-2030/behavior_spec/1/branches/1, features:FUNC-2030/behavior_spec/1/branches/2, features:FUNC-2030/behavior_spec/1/branches/3, features:FUNC-2030/behavior_spec/1/postconditions/0, features:FUNC-2030/behavior_spec/1/preconditions/0, features:FUNC-2030/behavior_spec/1/preconditions/1, features:FUNC-2030/behavior_spec/1/preconditions/2, features:FUNC-2030/behavior_spec/1/preconditions/3, features:FUNC-2030/behavior_spec/1/preconditions/4, features:FUNC-2030/behavior_spec/1/steps/0, features:FUNC-2030/behavior_spec/1/steps/1, features:FUNC-2030/behavior_spec/1/steps/2, pages:PAGE-2006/fields/11, pages:PAGE-2006/fields/37, pages:PAGE-2006/fields/38, pages:PAGE-2006/fields/39, pages:PAGE-2203/fields/18, pages:PAGE-2203/fields/32, pages:PAGE-2203/fields/39, pages:PAGE-2203/fields/64, pages:PAGE-2204, pages:PAGE-2204/fields/17, pages:PAGE-2204/fields/18, pages:PAGE-2204/fields/19, pages:PAGE-2204/fields/25, pages:PAGE-2204/fields/29, pages:PAGE-2204/fields/3, pages:PAGE-2204/fields/39, pages:PAGE-2204/fields/40, pages:PAGE-2204/fields/43, pages:PAGE-2204/fields/45, pages:PAGE-2204/fields/47, pages:PAGE-2204/fields/48, pages:PAGE-2204/fields/50, pages:PAGE-2204/fields/51, pages:PAGE-2204/fields/52, pages:PAGE-2204/fields/59, pages:PAGE-2204/fields/60, pages:PAGE-2204/fields/62, pages:PAGE-2204/fields/85, pages:PAGE-2226/fields/12, pages:PAGE-2226/fields/16, pages:PAGE-2226/fields/2, pages:PAGE-2226/fields/22, pages:PAGE-2226/fields/26, pages:PAGE-2226/fields/28, pages:PAGE-2226/fields/35, pages:PAGE-2227, pages:PAGE-2227/actions/1, pages:PAGE-2227/actions/2, pages:PAGE-2227/actions/4, pages:PAGE-2227/fields/104, pages:PAGE-2227/fields/105, pages:PAGE-2227/fields/108, pages:PAGE-2227/fields/138, pages:PAGE-2227/fields/25, pages:PAGE-2227/fields/26, pages:PAGE-2227/fields/30, pages:PAGE-2227/fields/37, pages:PAGE-2227/fields/42, pages:PAGE-2227/fields/51, pages:PAGE-2227/fields/52, pages:PAGE-2227/fields/63, pages:PAGE-2227/fields/67, pages:PAGE-2227/fields/7, pages:PAGE-2227/fields/76, pages:PAGE-2227/fields/79, pages:PAGE-2227/fields/81, pages:PAGE-2227/fields/82, pages:PAGE-2227/fields/83, pages:PAGE-2228/fields/16, pages:PAGE-2228/fields/17, pages:PAGE-2228/fields/18, pages:PAGE-2228/fields/4, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/110, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/111, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/112, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/113, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/114, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/120, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/121, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/146, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/148, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/34, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/37, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/60, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/67, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/68, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/69, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/79, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/80, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/81, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/82, scenarios:FLOW-CURRENT-CUSTOMER/steps/26

验证：CHECK-FLOW-TRANSFER

## 实施任务

- [TASK-025](../tasks/TASK-025.md)
