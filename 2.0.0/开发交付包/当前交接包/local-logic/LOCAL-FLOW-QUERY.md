# LOCAL-FLOW-QUERY 查询统一台账及工作队列

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md) · [全局逻辑](../global-logic.md)

- [查询业务、批次和工作队列 · FUNC\-2039](../features/FUNC-2039.md)

## 职责与触发

所属工程模块：未填写

功能：FUNC-2039

触发：进入导入批次与业务名单／业务列表并筛选队列

## 前置条件

- 当前身份及租户范围可核

## 必须遵守的全局规则

- [GR-LIST-ORDER](../global-logic.md#GR-LIST-ORDER)
- [GR-SCOPE](../global-logic.md#GR-SCOPE)
- [GR-AUTH](../global-logic.md#GR-AUTH)
- [GR-DATA-FACTS](../global-logic.md#GR-DATA-FACTS)
- [GR-PRIVACY](../global-logic.md#GR-PRIVACY)
- [GR-HANDLING-MODE](../global-logic.md#GR-HANDLING-MODE)
- [GR-EXECUTION-ARRANGEMENT](../global-logic.md#GR-EXECUTION-ARRANGEMENT)
- [GR-TASK-UNIFIED-IMPORT](../global-logic.md#GR-TASK-UNIFIED-IMPORT)

## 输入与输出

输入：[FIELD-FLOW-CATEGORY-ID](../field-specs.md#FIELD-FLOW-CATEGORY-ID)、[FIELD-FLOW-WORK-STATE](../field-specs.md#FIELD-FLOW-WORK-STATE)、[FIELD-FLOW-OWNER-TENANT](../field-specs.md#FIELD-FLOW-OWNER-TENANT)、[FIELD-FLOW-DIRECT-CYCLE-ID](../field-specs.md#FIELD-FLOW-DIRECT-CYCLE-ID)、[FIELD-FLOW-DIRECT-STATUS](../field-specs.md#FIELD-FLOW-DIRECT-STATUS)、[FIELD-FLOW-EXECUTION-RESOURCE](../field-specs.md#FIELD-FLOW-EXECUTION-RESOURCE)、[FIELD-FLOW-EXECUTION-PRIORITY](../field-specs.md#FIELD-FLOW-EXECUTION-PRIORITY)、[FIELD-FLOW-EXECUTION-QUEUED-AT](../field-specs.md#FIELD-FLOW-EXECUTION-QUEUED-AT)、[FIELD-FLOW-EXECUTION-QUEUE-SEQUENCE](../field-specs.md#FIELD-FLOW-EXECUTION-QUEUE-SEQUENCE)、[FIELD-FLOW-MANUAL-ASSIGNMENT-MODE](../field-specs.md#FIELD-FLOW-MANUAL-ASSIGNMENT-MODE)、[FIELD-FLOW-TASK-IMPORT-SOURCE](../field-specs.md#FIELD-FLOW-TASK-IMPORT-SOURCE)

输出：[FIELD-FLOW-BATCH-ID](../field-specs.md#FIELD-FLOW-BATCH-ID)、[FIELD-FLOW-BRAND-ID](../field-specs.md#FIELD-FLOW-BRAND-ID)、[FIELD-FLOW-BUSINESS-CODE](../field-specs.md#FIELD-FLOW-BUSINESS-CODE)、[FIELD-FLOW-CATEGORY-ID](../field-specs.md#FIELD-FLOW-CATEGORY-ID)、[FIELD-FLOW-CUSTOMER-NAME](../field-specs.md#FIELD-FLOW-CUSTOMER-NAME)、[FIELD-FLOW-FOLLOWER](../field-specs.md#FIELD-FLOW-FOLLOWER)、[FIELD-FLOW-METHOD](../field-specs.md#FIELD-FLOW-METHOD)、[FIELD-FLOW-NODE-ID](../field-specs.md#FIELD-FLOW-NODE-ID)、[FIELD-FLOW-OUTCOME](../field-specs.md#FIELD-FLOW-OUTCOME)、[FIELD-FLOW-OWNER-TENANT](../field-specs.md#FIELD-FLOW-OWNER-TENANT)、[FIELD-FLOW-PHONE](../field-specs.md#FIELD-FLOW-PHONE)、[FIELD-FLOW-RECORD-ID](../field-specs.md#FIELD-FLOW-RECORD-ID)、[FIELD-FLOW-RUN-ID](../field-specs.md#FIELD-FLOW-RUN-ID)、[FIELD-FLOW-STATISTICS](../field-specs.md#FIELD-FLOW-STATISTICS)、[FIELD-FLOW-UPDATED-AT](../field-specs.md#FIELD-FLOW-UPDATED-AT)、[FIELD-FLOW-WORK-STATE](../field-specs.md#FIELD-FLOW-WORK-STATE)、[FIELD-FLOW-HANDLING-MODE](../field-specs.md#FIELD-FLOW-HANDLING-MODE)、[FIELD-FLOW-DIRECT-METHOD](../field-specs.md#FIELD-FLOW-DIRECT-METHOD)、[FIELD-FLOW-DIRECT-CYCLES](../field-specs.md#FIELD-FLOW-DIRECT-CYCLES)、[FIELD-FLOW-DIRECT-OUTCOME](../field-specs.md#FIELD-FLOW-DIRECT-OUTCOME)

## 处理步骤

### STEP-FLOW-QUERY-1

从同权威账本按当前/截止历史/管理监管资格投影，不用品牌配置权扩范围

读取：FIELD-FLOW-BATCH-ID, FIELD-FLOW-BRAND-ID, FIELD-FLOW-BUSINESS-CODE, FIELD-FLOW-CATEGORY-ID, FIELD-FLOW-CUSTOMER-NAME, FIELD-FLOW-DEPARTURE-SNAPSHOT, FIELD-FLOW-FOLLOWER, FIELD-FLOW-METHOD, FIELD-FLOW-NODE-ID, FIELD-FLOW-OWNER-TENANT, FIELD-FLOW-PHONE, FIELD-FLOW-RUN-ID, FIELD-FLOW-UPDATED-AT；写入：无

规则：GR-LIST-ORDER, GR-SCOPE, GR-AUTH, GR-DATA-FACTS, GR-PRIVACY

### STEP-FLOW-QUERY-2

算工作状态、下一步和阻塞原因，先更新时间倒序全量过滤再分页

读取：FIELD-FLOW-RUN-STATUS, FIELD-FLOW-EXECUTION-STATE, FIELD-FLOW-ARRANGEMENT, FIELD-FLOW-EVALUATION；写入：FIELD-FLOW-WORK-STATE, FIELD-FLOW-STATISTICS

规则：GR-LIST-ORDER, GR-SCOPE, GR-AUTH, GR-DATA-FACTS, GR-PRIVACY

### STEP-FLOW-QUERY-3

入口按钮按行实际动作资格，普通运营可起呼但不导入/分配

读取：FIELD-FLOW-WORK-STATE；写入：无

规则：GR-LIST-ORDER, GR-SCOPE, GR-AUTH, GR-DATA-FACTS, GR-PRIVACY

### STEP-FLOW-QUERY-4

按准确身份展示模式与方式；DIRECT无当前run/节点显示“直接跟进”，保完整有权跟进/通话/快照及当前资料更正入口，不显示可办理模板转交或推进。；列表/详情展示mode、具体任务/坐席及等级；待执行视图以资源内等级降序、入队时间和稳定序号升序推荐，普通历史查询仍更新时间倒序；长期等待提示处理。 业务分类列表提供导入名单并锁定准确分类；原旧导入菜单改为导入批次，业务名单保独立，业务名单保独立，业务名单保独立，业务名单保独立，业务名单保独立，以批次结果/详情为主。独立业务名单保工作队列、原单条/同组批量手动分配及明确发起；主菜单打开/刷新不带临时批次过滤，准确批次详情和recordId详情各保自身上下文，账号/租户/撤权重新核验。 原专业名单直接在原列表展示：保姓名、电话、批次、原操作与原统计，新业务按准确recordId只读回链；旧原生行缺业务编码/业务分类/五档执行优先级/导入入口四项时直接留空，不单列历史名单、不按手机号补链。统一业务数/办理状态不冒充供应商受理、真实拨打、接通或话单数。 业务分类列表提供导入名单并锁定准确分类；原导入与分配改为导入批次，以批次结果/详情为主。独立业务名单保工作队列、原单条/同组批量手动分配及明确发起；主菜单打开/刷新不带临时批次过滤，准确批次详情和recordId详情各保自身上下文，账号/租户/撤权重新核验。

读取：FIELD-FLOW-HANDLING-MODE, FIELD-FLOW-DIRECT-METHOD, FIELD-FLOW-EXECUTION-RESOURCE, FIELD-FLOW-EXECUTION-PRIORITY, FIELD-FLOW-EXECUTION-QUEUED-AT, FIELD-FLOW-EXECUTION-QUEUE-SEQUENCE, FIELD-FLOW-MANUAL-ASSIGNMENT-MODE, FIELD-FLOW-TASK-IMPORT-SOURCE；写入：无

规则：GR-LIST-ORDER, GR-SCOPE, GR-AUTH, GR-DATA-FACTS, GR-PRIVACY, GR-HANDLING-MODE, GR-EXECUTION-ARRANGEMENT, GR-TASK-UNIFIED-IMPORT

## 分支与异常

### BRANCH-FLOW-QUERY-1

条件：确定空记录

结果：显示空态及有权下一步，不假造条数

涉及字段：FIELD-FLOW-RECORD-ID

验证：CHECK-FLOW-QUERY

### BRANCH-FLOW-QUERY-2

条件：范围或读取失败

结果：显示错误/无权而非空成功

涉及字段：FIELD-FLOW-WORK-STATE

验证：CHECK-FLOW-QUERY

### BRANCH-FLOW-QUERY-3

条件：当前记录可办

结果：队列可定位待转交/待安排/待起呼/待结果/待填写/待流转/条件未满足/待核等

涉及字段：FIELD-FLOW-WORK-STATE

验证：CHECK-FLOW-QUERY

## 完成后的状态

- 读取不改变业务更新时间或状态

## 字段定义

- [FIELD-FLOW-CATEGORY-ID](../field-specs.md#FIELD-FLOW-CATEGORY-ID)
- [FIELD-FLOW-WORK-STATE](../field-specs.md#FIELD-FLOW-WORK-STATE)
- [FIELD-FLOW-OWNER-TENANT](../field-specs.md#FIELD-FLOW-OWNER-TENANT)
- [FIELD-FLOW-DIRECT-CYCLE-ID](../field-specs.md#FIELD-FLOW-DIRECT-CYCLE-ID)
- [FIELD-FLOW-DIRECT-STATUS](../field-specs.md#FIELD-FLOW-DIRECT-STATUS)
- [FIELD-FLOW-EXECUTION-RESOURCE](../field-specs.md#FIELD-FLOW-EXECUTION-RESOURCE)
- [FIELD-FLOW-EXECUTION-PRIORITY](../field-specs.md#FIELD-FLOW-EXECUTION-PRIORITY)
- [FIELD-FLOW-EXECUTION-QUEUED-AT](../field-specs.md#FIELD-FLOW-EXECUTION-QUEUED-AT)
- [FIELD-FLOW-EXECUTION-QUEUE-SEQUENCE](../field-specs.md#FIELD-FLOW-EXECUTION-QUEUE-SEQUENCE)
- [FIELD-FLOW-MANUAL-ASSIGNMENT-MODE](../field-specs.md#FIELD-FLOW-MANUAL-ASSIGNMENT-MODE)
- [FIELD-FLOW-TASK-IMPORT-SOURCE](../field-specs.md#FIELD-FLOW-TASK-IMPORT-SOURCE)
- [FIELD-FLOW-BATCH-ID](../field-specs.md#FIELD-FLOW-BATCH-ID)
- [FIELD-FLOW-BRAND-ID](../field-specs.md#FIELD-FLOW-BRAND-ID)
- [FIELD-FLOW-BUSINESS-CODE](../field-specs.md#FIELD-FLOW-BUSINESS-CODE)
- [FIELD-FLOW-CUSTOMER-NAME](../field-specs.md#FIELD-FLOW-CUSTOMER-NAME)
- [FIELD-FLOW-FOLLOWER](../field-specs.md#FIELD-FLOW-FOLLOWER)
- [FIELD-FLOW-METHOD](../field-specs.md#FIELD-FLOW-METHOD)
- [FIELD-FLOW-NODE-ID](../field-specs.md#FIELD-FLOW-NODE-ID)
- [FIELD-FLOW-OUTCOME](../field-specs.md#FIELD-FLOW-OUTCOME)
- [FIELD-FLOW-PHONE](../field-specs.md#FIELD-FLOW-PHONE)
- [FIELD-FLOW-RECORD-ID](../field-specs.md#FIELD-FLOW-RECORD-ID)
- [FIELD-FLOW-RUN-ID](../field-specs.md#FIELD-FLOW-RUN-ID)
- [FIELD-FLOW-STATISTICS](../field-specs.md#FIELD-FLOW-STATISTICS)
- [FIELD-FLOW-UPDATED-AT](../field-specs.md#FIELD-FLOW-UPDATED-AT)
- [FIELD-FLOW-HANDLING-MODE](../field-specs.md#FIELD-FLOW-HANDLING-MODE)
- [FIELD-FLOW-DIRECT-METHOD](../field-specs.md#FIELD-FLOW-DIRECT-METHOD)
- [FIELD-FLOW-DIRECT-CYCLES](../field-specs.md#FIELD-FLOW-DIRECT-CYCLES)
- [FIELD-FLOW-DIRECT-OUTCOME](../field-specs.md#FIELD-FLOW-DIRECT-OUTCOME)
- [FIELD-FLOW-DEPARTURE-SNAPSHOT](../field-specs.md#FIELD-FLOW-DEPARTURE-SNAPSHOT)
- [FIELD-FLOW-RUN-STATUS](../field-specs.md#FIELD-FLOW-RUN-STATUS)
- [FIELD-FLOW-EXECUTION-STATE](../field-specs.md#FIELD-FLOW-EXECUTION-STATE)
- [FIELD-FLOW-ARRANGEMENT](../field-specs.md#FIELD-FLOW-ARRANGEMENT)
- [FIELD-FLOW-EVALUATION](../field-specs.md#FIELD-FLOW-EVALUATION)

## 来源与验证

来源条目：acceptance:AC-2129, acceptance:AC-2130, acceptance:AC-2131, acceptance:AC-2132, features:FUNC-2039, features:FUNC-2039/behavior_spec/0/branches/0, features:FUNC-2039/behavior_spec/0/branches/1, features:FUNC-2039/behavior_spec/0/branches/2, features:FUNC-2039/behavior_spec/0/postconditions/0, features:FUNC-2039/behavior_spec/0/preconditions/0, features:FUNC-2039/behavior_spec/0/steps/0, features:FUNC-2039/behavior_spec/0/steps/1, features:FUNC-2039/behavior_spec/0/steps/2, features:FUNC-2039/behavior_spec/0/steps/3, pages:PAGE-2006/fields/2, pages:PAGE-2006/fields/25, pages:PAGE-2006/fields/27, pages:PAGE-2006/fields/5, pages:PAGE-2006/fields/54, pages:PAGE-2103/fields/28, pages:PAGE-2103/fields/31, pages:PAGE-2103/fields/32, pages:PAGE-2103/fields/33, pages:PAGE-2203/fields/10, pages:PAGE-2203/fields/14, pages:PAGE-2203/fields/18, pages:PAGE-2203/fields/28, pages:PAGE-2203/fields/31, pages:PAGE-2203/fields/32, pages:PAGE-2203/fields/35, pages:PAGE-2203/fields/39, pages:PAGE-2203/fields/43, pages:PAGE-2203/fields/47, pages:PAGE-2203/fields/50, pages:PAGE-2203/fields/54, pages:PAGE-2203/fields/6, pages:PAGE-2203/fields/64, pages:PAGE-2203/fields/65, pages:PAGE-2203/fields/66, pages:PAGE-2203/fields/67, pages:PAGE-2203/fields/7, pages:PAGE-2203/fields/8, pages:PAGE-2204, pages:PAGE-2204/fields/10, pages:PAGE-2204/fields/16, pages:PAGE-2204/fields/17, pages:PAGE-2204/fields/24, pages:PAGE-2204/fields/26, pages:PAGE-2204/fields/29, pages:PAGE-2204/fields/3, pages:PAGE-2204/fields/41, pages:PAGE-2204/fields/42, pages:PAGE-2204/fields/44, pages:PAGE-2204/fields/45, pages:PAGE-2204/fields/46, pages:PAGE-2204/fields/48, pages:PAGE-2204/fields/5, pages:PAGE-2204/fields/56, pages:PAGE-2204/fields/57, pages:PAGE-2204/fields/61, pages:PAGE-2204/fields/63, pages:PAGE-2204/fields/65, pages:PAGE-2204/fields/7, pages:PAGE-2204/fields/8, pages:PAGE-2204/fields/85, pages:PAGE-2204/fields/86, pages:PAGE-2204/fields/87, pages:PAGE-2204/fields/88, pages:PAGE-2204/fields/91, pages:PAGE-2204/fields/92, pages:PAGE-2204/fields/93, pages:PAGE-2204/fields/94, pages:PAGE-2204/fields/95, pages:PAGE-2204/fields/96, pages:PAGE-2205/fields/56, pages:PAGE-2205/fields/58, pages:PAGE-2205/fields/60, pages:PAGE-2205/fields/61, pages:PAGE-2223/fields/1, pages:PAGE-2223/fields/4, pages:PAGE-2226, pages:PAGE-2226/actions/0, pages:PAGE-2226/fields/11, pages:PAGE-2226/fields/12, pages:PAGE-2226/fields/14, pages:PAGE-2226/fields/15, pages:PAGE-2226/fields/16, pages:PAGE-2226/fields/2, pages:PAGE-2226/fields/23, pages:PAGE-2226/fields/24, pages:PAGE-2226/fields/25, pages:PAGE-2226/fields/26, pages:PAGE-2226/fields/27, pages:PAGE-2226/fields/28, pages:PAGE-2226/fields/29, pages:PAGE-2226/fields/30, pages:PAGE-2226/fields/31, pages:PAGE-2226/fields/32, pages:PAGE-2226/fields/34, pages:PAGE-2226/fields/35, pages:PAGE-2226/fields/36, pages:PAGE-2226/fields/37, pages:PAGE-2226/fields/38, pages:PAGE-2226/fields/39, pages:PAGE-2226/fields/4, pages:PAGE-2226/fields/40, pages:PAGE-2226/fields/41, pages:PAGE-2226/fields/42, pages:PAGE-2226/fields/43, pages:PAGE-2226/fields/44, pages:PAGE-2226/fields/5, pages:PAGE-2226/fields/6, pages:PAGE-2226/fields/8, pages:PAGE-2227/fields/10, pages:PAGE-2227/fields/106, pages:PAGE-2227/fields/114, pages:PAGE-2227/fields/118, pages:PAGE-2227/fields/13, pages:PAGE-2227/fields/138, pages:PAGE-2227/fields/139, pages:PAGE-2227/fields/14, pages:PAGE-2227/fields/140, pages:PAGE-2227/fields/141, pages:PAGE-2227/fields/144, pages:PAGE-2227/fields/145, pages:PAGE-2227/fields/146, pages:PAGE-2227/fields/147, pages:PAGE-2227/fields/148, pages:PAGE-2227/fields/149, pages:PAGE-2227/fields/17, pages:PAGE-2227/fields/24, pages:PAGE-2227/fields/25, pages:PAGE-2227/fields/36, pages:PAGE-2227/fields/39, pages:PAGE-2227/fields/42, pages:PAGE-2227/fields/57, pages:PAGE-2227/fields/61, pages:PAGE-2227/fields/66, pages:PAGE-2227/fields/67, pages:PAGE-2227/fields/7, pages:PAGE-2227/fields/70, pages:PAGE-2227/fields/79, pages:PAGE-2227/fields/97, pages:PAGE-2227/fields/99, pages:PAGE-2228/fields/10, pages:PAGE-2228/fields/12, pages:PAGE-2228/fields/2, pages:PAGE-2228/fields/3, pages:PAGE-2228/fields/31, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/0, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/105, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/109, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/117, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/123, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/124, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/148, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/149, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/150, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/151, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/152, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/153, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/160, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/161, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/162, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/163, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/166, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/168, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/17, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/31, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/35, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/56, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/60, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/61, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/62, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/63, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/67, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/68, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/69, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/74, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/75, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/77, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/82, scenarios:FLOW-CURRENT-CUSTOMER/steps/30

验证：CHECK-FLOW-QUERY

## 实施任务

- [TASK-030](../tasks/TASK-030.md)
