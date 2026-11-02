# LOCAL-FLOW-TEMPLATE-DELETE 移除当前未使用模板定义

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md) · [全局逻辑](../global-logic.md)

- [删除当前未被使用的模板定义 · FUNC\-2042](../features/FUNC-2042.md)

## 职责与触发

所属工程模块：未填写

功能：FUNC-2042

触发：在准确模板删除预检后确认

## 前置条件

- 当前品牌及配置管理资格真实有效
- 提交来源与当前上下文一致

## 必须遵守的全局规则

- [GR-CONFIG](../global-logic.md#GR-CONFIG)
- [GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)
- [GR-NO-HISTORY](../global-logic.md#GR-NO-HISTORY)
- [GR-AUTH](../global-logic.md#GR-AUTH)

## 输入与输出

输入：[FIELD-FLOW-TEMPLATE-ID](../field-specs.md#FIELD-FLOW-TEMPLATE-ID)、[FIELD-FLOW-TEMPLATE-REVISION](../field-specs.md#FIELD-FLOW-TEMPLATE-REVISION)、[FIELD-FLOW-ROUTE-MAIN](../field-specs.md#FIELD-FLOW-ROUTE-MAIN)、[FIELD-FLOW-REQUEST-STATUS](../field-specs.md#FIELD-FLOW-REQUEST-STATUS)

输出：[FIELD-FLOW-TEMPLATE-ID](../field-specs.md#FIELD-FLOW-TEMPLATE-ID)、[FIELD-FLOW-REQUEST-STATUS](../field-specs.md#FIELD-FLOW-REQUEST-STATUS)

## 处理步骤

### STEP-FLOW-TEMPLATE-DELETE-1

只核当前实际分类绑定与未核配置，读取前后使用指纹

读取：FIELD-FLOW-TEMPLATE-ID, FIELD-FLOW-ROUTE-MAIN, FIELD-FLOW-REQUEST-STATUS；写入：无

规则：GR-CONFIG, GR-UNKNOWN, GR-NO-HISTORY, GR-AUTH

### STEP-FLOW-TEMPLATE-DELETE-2

准确对象和并发依据一致时移除当前定义，记录本次请求结果

读取：FIELD-FLOW-TEMPLATE-ID, FIELD-FLOW-TEMPLATE-REVISION, FIELD-FLOW-REQUEST-ID；写入：FIELD-FLOW-TEMPLATE-ID, FIELD-FLOW-REQUEST-STATUS

规则：GR-CONFIG, GR-UNKNOWN, GR-NO-HISTORY, GR-AUTH

## 分支与异常

### BRANCH-FLOW-TEMPLATE-DELETE-1

条件：当前类别仍绑定或同模板配置待核

结果：阻删并说明实际使用/核对入口；分类当前只支持更换路由模板，无解绑按钮

涉及字段：FIELD-FLOW-ROUTE-MAIN, FIELD-FLOW-REQUEST-STATUS

验证：CHECK-FLOW-TEMPLATE-DELETE

### BRANCH-FLOW-TEMPLATE-DELETE-2

条件：仅当前run捕获依赖且没有当前绑定

结果：可以删除定义，run完整快照仍可继续

涉及字段：FIELD-FLOW-TEMPLATE-ID, FIELD-FLOW-EFFECTIVE-PLAN

验证：CHECK-FLOW-TEMPLATE-DELETE

### BRANCH-FLOW-TEMPLATE-DELETE-3

条件：结果unknown

结果：保原requestId核对，不重复删除

涉及字段：FIELD-FLOW-REQUEST-ID, FIELD-FLOW-REQUEST-STATUS

验证：CHECK-FLOW-TEMPLATE-DELETE

## 完成后的状态

- 不维护旧模板归档兼容索引，不损已捕获业务事实

## 字段定义

- [FIELD-FLOW-TEMPLATE-ID](../field-specs.md#FIELD-FLOW-TEMPLATE-ID)
- [FIELD-FLOW-TEMPLATE-REVISION](../field-specs.md#FIELD-FLOW-TEMPLATE-REVISION)
- [FIELD-FLOW-ROUTE-MAIN](../field-specs.md#FIELD-FLOW-ROUTE-MAIN)
- [FIELD-FLOW-REQUEST-STATUS](../field-specs.md#FIELD-FLOW-REQUEST-STATUS)
- [FIELD-FLOW-REQUEST-ID](../field-specs.md#FIELD-FLOW-REQUEST-ID)
- [FIELD-FLOW-EFFECTIVE-PLAN](../field-specs.md#FIELD-FLOW-EFFECTIVE-PLAN)

## 来源与验证

来源条目：acceptance:AC-2137, features:FUNC-2042, features:FUNC-2042/behavior_spec/0/branches/0, features:FUNC-2042/behavior_spec/0/branches/1, features:FUNC-2042/behavior_spec/0/branches/2, features:FUNC-2042/behavior_spec/0/postconditions/0, features:FUNC-2042/behavior_spec/0/preconditions/0, features:FUNC-2042/behavior_spec/0/preconditions/1, features:FUNC-2042/behavior_spec/0/steps/0, features:FUNC-2042/behavior_spec/0/steps/1, pages:PAGE-2006/fields/13, pages:PAGE-2006/fields/38, pages:PAGE-2006/fields/39, pages:PAGE-2006/fields/41, pages:PAGE-2006/fields/50, pages:PAGE-2006/fields/53, pages:PAGE-2204/fields/20, pages:PAGE-2204/fields/50, pages:PAGE-2204/fields/51, pages:PAGE-2204/fields/55, pages:PAGE-2223/fields/12, pages:PAGE-2223/fields/30, pages:PAGE-2223/fields/33, pages:PAGE-2226/fields/13, pages:PAGE-2227/fields/109, pages:PAGE-2227/fields/112, pages:PAGE-2227/fields/32, pages:PAGE-2227/fields/81, pages:PAGE-2227/fields/82, pages:PAGE-2227/fields/88, pages:PAGE-2228, pages:PAGE-2228/actions/3, pages:PAGE-2228/fields/17, pages:PAGE-2228/fields/18, pages:PAGE-2228/fields/20, pages:PAGE-2228/fields/27, pages:PAGE-2228/fields/30, pages:PAGE-2228/fields/6, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/120, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/121, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/24, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/27, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/49, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/51, scenarios:FLOW-CURRENT-CUSTOMER/steps/10

验证：CHECK-FLOW-TEMPLATE-DELETE

## 实施任务

- [TASK-011](../tasks/TASK-011.md)
