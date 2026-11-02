# LOCAL-FLOW-TEMPLATE-READ 只读查看模板与节点条件

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md) · [全局逻辑](../global-logic.md)

- [查看当前模板及绑定方案说明 · FUNC\-2041](../features/FUNC-2041.md)

## 职责与触发

所属工程模块：未填写

功能：FUNC-2041

触发：从列表、分类路由或业务方案查看模板说明

## 前置条件

- 有本品牌模板查看资格；不要求修改/删除权
- 读取业务run捕获方案时须有该业务准确读取权，不因此取得当前模板配置权
- 当前新建/修改模板的END固定正常结束CLOSE，不提供是否直接跟进配置，当前新导入/路由/重开不得接纳旧DIRECT_FOLLOWUP配置；已运行历史按原捕获方案和原合法来源收尾，不改历史为CLOSE，不借旧END来源授权当前新周期。新TASK/DIRECT始终直接跟进，不显示启用流程；旧无TASK来源DIRECT仅保原合法转换能力。

## 必须遵守的全局规则

- [GR-CONFIG](../global-logic.md#GR-CONFIG)
- [GR-SCOPE](../global-logic.md#GR-SCOPE)
- [GR-AUTH](../global-logic.md#GR-AUTH)
- [GR-PRIVACY](../global-logic.md#GR-PRIVACY)
- [GR-END-ACTION](../global-logic.md#GR-END-ACTION)
- [GR-EXECUTION-ARRANGEMENT](../global-logic.md#GR-EXECUTION-ARRANGEMENT)

## 输入与输出

输入：[FIELD-FLOW-BRANCH-KIND](../field-specs.md#FIELD-FLOW-BRANCH-KIND)、[FIELD-FLOW-BRANCH-PRIORITY](../field-specs.md#FIELD-FLOW-BRANCH-PRIORITY)、[FIELD-FLOW-BRAND-ID](../field-specs.md#FIELD-FLOW-BRAND-ID)、[FIELD-FLOW-EDGE-ID](../field-specs.md#FIELD-FLOW-EDGE-ID)、[FIELD-FLOW-EDGES](../field-specs.md#FIELD-FLOW-EDGES)、[FIELD-FLOW-ENTRY-CONTEXT](../field-specs.md#FIELD-FLOW-ENTRY-CONTEXT)、[FIELD-FLOW-ENTRY-RULES](../field-specs.md#FIELD-FLOW-ENTRY-RULES)、[FIELD-FLOW-GROUP-MODE](../field-specs.md#FIELD-FLOW-GROUP-MODE)、[FIELD-FLOW-METHOD](../field-specs.md#FIELD-FLOW-METHOD)、[FIELD-FLOW-NEXT-NODE](../field-specs.md#FIELD-FLOW-NEXT-NODE)、[FIELD-FLOW-NODE-ID](../field-specs.md#FIELD-FLOW-NODE-ID)、[FIELD-FLOW-NODE-NAME](../field-specs.md#FIELD-FLOW-NODE-NAME)、[FIELD-FLOW-NODE-TYPE](../field-specs.md#FIELD-FLOW-NODE-TYPE)、[FIELD-FLOW-NODES](../field-specs.md#FIELD-FLOW-NODES)、[FIELD-FLOW-RECIPIENT](../field-specs.md#FIELD-FLOW-RECIPIENT)、[FIELD-FLOW-RESULT-SOURCE](../field-specs.md#FIELD-FLOW-RESULT-SOURCE)、[FIELD-FLOW-RULE-FIELD](../field-specs.md#FIELD-FLOW-RULE-FIELD)、[FIELD-FLOW-RULE-ID](../field-specs.md#FIELD-FLOW-RULE-ID)、[FIELD-FLOW-RULE-OPERATOR](../field-specs.md#FIELD-FLOW-RULE-OPERATOR)、[FIELD-FLOW-RULE-SOURCE](../field-specs.md#FIELD-FLOW-RULE-SOURCE)、[FIELD-FLOW-RULE-VALUES](../field-specs.md#FIELD-FLOW-RULE-VALUES)、[FIELD-FLOW-RULES](../field-specs.md#FIELD-FLOW-RULES)、[FIELD-FLOW-TEMPLATE-ID](../field-specs.md#FIELD-FLOW-TEMPLATE-ID)、[FIELD-FLOW-TEMPLATE-NAME](../field-specs.md#FIELD-FLOW-TEMPLATE-NAME)、[FIELD-FLOW-TEMPLATE-REF-CATEGORY](../field-specs.md#FIELD-FLOW-TEMPLATE-REF-CATEGORY)、[FIELD-FLOW-TEMPLATE-REVISION](../field-specs.md#FIELD-FLOW-TEMPLATE-REVISION)、[FIELD-FLOW-NODE-EXECUTION-PRIORITY](../field-specs.md#FIELD-FLOW-NODE-EXECUTION-PRIORITY)、[FIELD-FLOW-NODE-EXECUTION-DEFAULTS](../field-specs.md#FIELD-FLOW-NODE-EXECUTION-DEFAULTS)、[FIELD-FLOW-NODE-MANUAL-ASSIGNMENT-MODE](../field-specs.md#FIELD-FLOW-NODE-MANUAL-ASSIGNMENT-MODE)

输出：[FIELD-FLOW-TEMPLATE-ID](../field-specs.md#FIELD-FLOW-TEMPLATE-ID)、[FIELD-FLOW-BRAND-ID](../field-specs.md#FIELD-FLOW-BRAND-ID)、[FIELD-FLOW-TEMPLATE-NAME](../field-specs.md#FIELD-FLOW-TEMPLATE-NAME)、[FIELD-FLOW-TEMPLATE-REF-CATEGORY](../field-specs.md#FIELD-FLOW-TEMPLATE-REF-CATEGORY)、[FIELD-FLOW-TEMPLATE-REVISION](../field-specs.md#FIELD-FLOW-TEMPLATE-REVISION)、[FIELD-FLOW-NODES](../field-specs.md#FIELD-FLOW-NODES)、[FIELD-FLOW-EDGES](../field-specs.md#FIELD-FLOW-EDGES)、[FIELD-FLOW-ENTRY-RULES](../field-specs.md#FIELD-FLOW-ENTRY-RULES)、[FIELD-FLOW-NODE-ID](../field-specs.md#FIELD-FLOW-NODE-ID)、[FIELD-FLOW-NODE-NAME](../field-specs.md#FIELD-FLOW-NODE-NAME)、[FIELD-FLOW-NODE-TYPE](../field-specs.md#FIELD-FLOW-NODE-TYPE)、[FIELD-FLOW-RECIPIENT](../field-specs.md#FIELD-FLOW-RECIPIENT)、[FIELD-FLOW-METHOD](../field-specs.md#FIELD-FLOW-METHOD)、[FIELD-FLOW-NEXT-NODE](../field-specs.md#FIELD-FLOW-NEXT-NODE)、[FIELD-FLOW-EDGE-ID](../field-specs.md#FIELD-FLOW-EDGE-ID)、[FIELD-FLOW-BRANCH-KIND](../field-specs.md#FIELD-FLOW-BRANCH-KIND)、[FIELD-FLOW-BRANCH-PRIORITY](../field-specs.md#FIELD-FLOW-BRANCH-PRIORITY)、[FIELD-FLOW-GROUP-MODE](../field-specs.md#FIELD-FLOW-GROUP-MODE)、[FIELD-FLOW-RULES](../field-specs.md#FIELD-FLOW-RULES)、[FIELD-FLOW-RULE-ID](../field-specs.md#FIELD-FLOW-RULE-ID)、[FIELD-FLOW-RULE-SOURCE](../field-specs.md#FIELD-FLOW-RULE-SOURCE)、[FIELD-FLOW-RULE-FIELD](../field-specs.md#FIELD-FLOW-RULE-FIELD)、[FIELD-FLOW-RULE-OPERATOR](../field-specs.md#FIELD-FLOW-RULE-OPERATOR)、[FIELD-FLOW-RULE-VALUES](../field-specs.md#FIELD-FLOW-RULE-VALUES)、[FIELD-FLOW-RESULT-SOURCE](../field-specs.md#FIELD-FLOW-RESULT-SOURCE)、[FIELD-FLOW-ENTRY-CONTEXT](../field-specs.md#FIELD-FLOW-ENTRY-CONTEXT)

## 处理步骤

### STEP-FLOW-TEMPLATE-READ-1

读取准确当前模板或业务run捕获方案

读取：FIELD-FLOW-TEMPLATE-ID, FIELD-FLOW-BRAND-ID, FIELD-FLOW-TEMPLATE-NAME, FIELD-FLOW-TEMPLATE-REF-CATEGORY, FIELD-FLOW-TEMPLATE-REVISION, FIELD-FLOW-NODES, FIELD-FLOW-EDGES, FIELD-FLOW-ENTRY-RULES, FIELD-FLOW-EFFECTIVE-PLAN；写入：无

规则：GR-CONFIG, GR-SCOPE, GR-AUTH, GR-PRIVACY

### STEP-FLOW-TEMPLATE-READ-2

分开显示字段参考和实际应用、入口、方式、承接方、条件及业务结论 当前新建/修改模板的END固定正常结束CLOSE，不提供是否直接跟进配置，当前新导入/路由/重开不得接纳旧DIRECT_FOLLOWUP配置；旧无TASK来源DIRECT仅保原合法转换能力。 当前新建/修改模板的END固定正常结束CLOSE，不提供是否直接跟进配置，当前新导入/路由/重开不得接纳旧DIRECT_FOLLOWUP配置；已运行历史按原捕获方案和原合法来源收尾，不改历史为CLOSE，不借旧END来源授权当前新周期。新TASK/DIRECT始终直接跟进，不显示启用流程；旧无TASK来源DIRECT仅保原合法转换能力。

读取：FIELD-FLOW-TEMPLATE-ID, FIELD-FLOW-BRAND-ID, FIELD-FLOW-TEMPLATE-NAME, FIELD-FLOW-TEMPLATE-REF-CATEGORY, FIELD-FLOW-TEMPLATE-REVISION, FIELD-FLOW-NODES, FIELD-FLOW-EDGES, FIELD-FLOW-ENTRY-RULES, FIELD-FLOW-NODE-ID, FIELD-FLOW-NODE-NAME, FIELD-FLOW-NODE-TYPE, FIELD-FLOW-RECIPIENT, FIELD-FLOW-METHOD, FIELD-FLOW-NEXT-NODE, FIELD-FLOW-EDGE-ID, FIELD-FLOW-BRANCH-KIND, FIELD-FLOW-BRANCH-PRIORITY, FIELD-FLOW-GROUP-MODE, FIELD-FLOW-RULES, FIELD-FLOW-RULE-ID, FIELD-FLOW-RULE-SOURCE, FIELD-FLOW-RULE-FIELD, FIELD-FLOW-RULE-OPERATOR, FIELD-FLOW-RULE-VALUES, FIELD-FLOW-RESULT-SOURCE, FIELD-FLOW-ENTRY-CONTEXT, FIELD-FLOW-CATEGORY-ID, FIELD-FLOW-END-ACTION, FIELD-FLOW-NODE-EXECUTION-PRIORITY, FIELD-FLOW-NODE-EXECUTION-DEFAULTS, FIELD-FLOW-NODE-MANUAL-ASSIGNMENT-MODE；写入：无

规则：GR-CONFIG, GR-SCOPE, GR-AUTH, GR-PRIVACY, GR-EXECUTION-ARRANGEMENT

## 分支与异常

### BRANCH-FLOW-TEMPLATE-READ-1

条件：无权或读取失败

结果：明确无权/失败，不伪装没有配置

涉及字段：FIELD-FLOW-TEMPLATE-ID

验证：CHECK-FLOW-TEMPLATE-READ

### BRANCH-FLOW-TEMPLATE-READ-2

条件：可读配置

结果：只读呈现，不生成运行或改变分类绑定

涉及字段：FIELD-FLOW-TEMPLATE-ID, FIELD-FLOW-BRAND-ID, FIELD-FLOW-TEMPLATE-NAME, FIELD-FLOW-TEMPLATE-REF-CATEGORY, FIELD-FLOW-TEMPLATE-REVISION, FIELD-FLOW-NODES, FIELD-FLOW-EDGES, FIELD-FLOW-ENTRY-RULES, FIELD-FLOW-NODE-ID, FIELD-FLOW-NODE-NAME, FIELD-FLOW-NODE-TYPE, FIELD-FLOW-RECIPIENT, FIELD-FLOW-METHOD, FIELD-FLOW-NEXT-NODE, FIELD-FLOW-EDGE-ID, FIELD-FLOW-BRANCH-KIND, FIELD-FLOW-BRANCH-PRIORITY, FIELD-FLOW-GROUP-MODE, FIELD-FLOW-RULES, FIELD-FLOW-RULE-ID, FIELD-FLOW-RULE-SOURCE, FIELD-FLOW-RULE-FIELD, FIELD-FLOW-RULE-OPERATOR, FIELD-FLOW-RULE-VALUES, FIELD-FLOW-RESULT-SOURCE, FIELD-FLOW-ENTRY-CONTEXT

验证：CHECK-FLOW-TEMPLATE-READ

## 完成后的状态

- 只读不暴露无权业务/其他租户场景

## 字段定义

- [FIELD-FLOW-BRANCH-KIND](../field-specs.md#FIELD-FLOW-BRANCH-KIND)
- [FIELD-FLOW-BRANCH-PRIORITY](../field-specs.md#FIELD-FLOW-BRANCH-PRIORITY)
- [FIELD-FLOW-BRAND-ID](../field-specs.md#FIELD-FLOW-BRAND-ID)
- [FIELD-FLOW-EDGE-ID](../field-specs.md#FIELD-FLOW-EDGE-ID)
- [FIELD-FLOW-EDGES](../field-specs.md#FIELD-FLOW-EDGES)
- [FIELD-FLOW-ENTRY-CONTEXT](../field-specs.md#FIELD-FLOW-ENTRY-CONTEXT)
- [FIELD-FLOW-ENTRY-RULES](../field-specs.md#FIELD-FLOW-ENTRY-RULES)
- [FIELD-FLOW-GROUP-MODE](../field-specs.md#FIELD-FLOW-GROUP-MODE)
- [FIELD-FLOW-METHOD](../field-specs.md#FIELD-FLOW-METHOD)
- [FIELD-FLOW-NEXT-NODE](../field-specs.md#FIELD-FLOW-NEXT-NODE)
- [FIELD-FLOW-NODE-ID](../field-specs.md#FIELD-FLOW-NODE-ID)
- [FIELD-FLOW-NODE-NAME](../field-specs.md#FIELD-FLOW-NODE-NAME)
- [FIELD-FLOW-NODE-TYPE](../field-specs.md#FIELD-FLOW-NODE-TYPE)
- [FIELD-FLOW-NODES](../field-specs.md#FIELD-FLOW-NODES)
- [FIELD-FLOW-RECIPIENT](../field-specs.md#FIELD-FLOW-RECIPIENT)
- [FIELD-FLOW-RESULT-SOURCE](../field-specs.md#FIELD-FLOW-RESULT-SOURCE)
- [FIELD-FLOW-RULE-FIELD](../field-specs.md#FIELD-FLOW-RULE-FIELD)
- [FIELD-FLOW-RULE-ID](../field-specs.md#FIELD-FLOW-RULE-ID)
- [FIELD-FLOW-RULE-OPERATOR](../field-specs.md#FIELD-FLOW-RULE-OPERATOR)
- [FIELD-FLOW-RULE-SOURCE](../field-specs.md#FIELD-FLOW-RULE-SOURCE)
- [FIELD-FLOW-RULE-VALUES](../field-specs.md#FIELD-FLOW-RULE-VALUES)
- [FIELD-FLOW-RULES](../field-specs.md#FIELD-FLOW-RULES)
- [FIELD-FLOW-TEMPLATE-ID](../field-specs.md#FIELD-FLOW-TEMPLATE-ID)
- [FIELD-FLOW-TEMPLATE-NAME](../field-specs.md#FIELD-FLOW-TEMPLATE-NAME)
- [FIELD-FLOW-TEMPLATE-REF-CATEGORY](../field-specs.md#FIELD-FLOW-TEMPLATE-REF-CATEGORY)
- [FIELD-FLOW-TEMPLATE-REVISION](../field-specs.md#FIELD-FLOW-TEMPLATE-REVISION)
- [FIELD-FLOW-NODE-EXECUTION-PRIORITY](../field-specs.md#FIELD-FLOW-NODE-EXECUTION-PRIORITY)
- [FIELD-FLOW-NODE-EXECUTION-DEFAULTS](../field-specs.md#FIELD-FLOW-NODE-EXECUTION-DEFAULTS)
- [FIELD-FLOW-NODE-MANUAL-ASSIGNMENT-MODE](../field-specs.md#FIELD-FLOW-NODE-MANUAL-ASSIGNMENT-MODE)
- [FIELD-FLOW-EFFECTIVE-PLAN](../field-specs.md#FIELD-FLOW-EFFECTIVE-PLAN)
- [FIELD-FLOW-CATEGORY-ID](../field-specs.md#FIELD-FLOW-CATEGORY-ID)
- [FIELD-FLOW-END-ACTION](../field-specs.md#FIELD-FLOW-END-ACTION)

## 来源与验证

来源条目：acceptance:AC-2136, features:FUNC-2041, features:FUNC-2041/behavior_spec/0/branches/0, features:FUNC-2041/behavior_spec/0/branches/1, features:FUNC-2041/behavior_spec/0/postconditions/0, features:FUNC-2041/behavior_spec/0/preconditions/0, features:FUNC-2041/behavior_spec/0/preconditions/1, features:FUNC-2041/behavior_spec/0/preconditions/2, features:FUNC-2041/behavior_spec/0/steps/0, features:FUNC-2041/behavior_spec/0/steps/1, pages:PAGE-2006, pages:PAGE-2006/fields/0, pages:PAGE-2006/fields/1, pages:PAGE-2006/fields/11, pages:PAGE-2006/fields/12, pages:PAGE-2006/fields/13, pages:PAGE-2006/fields/14, pages:PAGE-2006/fields/15, pages:PAGE-2006/fields/2, pages:PAGE-2006/fields/24, pages:PAGE-2006/fields/25, pages:PAGE-2006/fields/26, pages:PAGE-2006/fields/27, pages:PAGE-2006/fields/28, pages:PAGE-2006/fields/29, pages:PAGE-2006/fields/30, pages:PAGE-2006/fields/37, pages:PAGE-2006/fields/40, pages:PAGE-2006/fields/43, pages:PAGE-2006/fields/44, pages:PAGE-2006/fields/45, pages:PAGE-2006/fields/46, pages:PAGE-2006/fields/47, pages:PAGE-2006/fields/48, pages:PAGE-2006/fields/5, pages:PAGE-2006/fields/50, pages:PAGE-2006/fields/51, pages:PAGE-2006/fields/52, pages:PAGE-2006/fields/53, pages:PAGE-2006/fields/60, pages:PAGE-2103/fields/31, pages:PAGE-2203/fields/10, pages:PAGE-2203/fields/28, pages:PAGE-2203/fields/31, pages:PAGE-2203/fields/7, pages:PAGE-2204/fields/10, pages:PAGE-2204/fields/19, pages:PAGE-2204/fields/20, pages:PAGE-2204/fields/21, pages:PAGE-2204/fields/23, pages:PAGE-2204/fields/41, pages:PAGE-2204/fields/42, pages:PAGE-2204/fields/47, pages:PAGE-2204/fields/54, pages:PAGE-2204/fields/7, pages:PAGE-2205/fields/58, pages:PAGE-2223/fields/1, pages:PAGE-2223/fields/11, pages:PAGE-2223/fields/12, pages:PAGE-2223/fields/13, pages:PAGE-2223/fields/22, pages:PAGE-2223/fields/30, pages:PAGE-2223/fields/31, pages:PAGE-2223/fields/32, pages:PAGE-2223/fields/33, pages:PAGE-2223/fields/4, pages:PAGE-2226/fields/13, pages:PAGE-2226/fields/23, pages:PAGE-2226/fields/24, pages:PAGE-2226/fields/5, pages:PAGE-2226/fields/8, pages:PAGE-2227, pages:PAGE-2227/fields/109, pages:PAGE-2227/fields/11, pages:PAGE-2227/fields/110, pages:PAGE-2227/fields/111, pages:PAGE-2227/fields/112, pages:PAGE-2227/fields/12, pages:PAGE-2227/fields/13, pages:PAGE-2227/fields/17, pages:PAGE-2227/fields/30, pages:PAGE-2227/fields/31, pages:PAGE-2227/fields/32, pages:PAGE-2227/fields/33, pages:PAGE-2227/fields/35, pages:PAGE-2227/fields/47, pages:PAGE-2227/fields/57, pages:PAGE-2227/fields/59, pages:PAGE-2227/fields/61, pages:PAGE-2227/fields/62, pages:PAGE-2227/fields/64, pages:PAGE-2227/fields/65, pages:PAGE-2227/fields/76, pages:PAGE-2227/fields/85, pages:PAGE-2227/fields/91, pages:PAGE-2227/fields/92, pages:PAGE-2227/fields/93, pages:PAGE-2227/fields/94, pages:PAGE-2227/fields/95, pages:PAGE-2227/fields/96, pages:PAGE-2228, pages:PAGE-2228/actions/2, pages:PAGE-2228/fields/0, pages:PAGE-2228/fields/1, pages:PAGE-2228/fields/10, pages:PAGE-2228/fields/11, pages:PAGE-2228/fields/12, pages:PAGE-2228/fields/13, pages:PAGE-2228/fields/14, pages:PAGE-2228/fields/15, pages:PAGE-2228/fields/16, pages:PAGE-2228/fields/19, pages:PAGE-2228/fields/2, pages:PAGE-2228/fields/21, pages:PAGE-2228/fields/22, pages:PAGE-2228/fields/23, pages:PAGE-2228/fields/24, pages:PAGE-2228/fields/25, pages:PAGE-2228/fields/26, pages:PAGE-2228/fields/27, pages:PAGE-2228/fields/28, pages:PAGE-2228/fields/29, pages:PAGE-2228/fields/3, pages:PAGE-2228/fields/30, pages:PAGE-2228/fields/32, pages:PAGE-2228/fields/33, pages:PAGE-2228/fields/34, pages:PAGE-2228/fields/35, pages:PAGE-2228/fields/4, pages:PAGE-2228/fields/5, pages:PAGE-2228/fields/6, pages:PAGE-2228/fields/7, pages:PAGE-2228/fields/8, pages:PAGE-2228/fields/9, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/0, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/157, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/164, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/165, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/167, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/17, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/24, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/25, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/26, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/27, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/28, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/29, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/30, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/31, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/32, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/33, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/34, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/35, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/36, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/37, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/38, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/39, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/40, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/41, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/42, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/43, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/44, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/45, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/46, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/47, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/48, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/51, scenarios:FLOW-CURRENT-CUSTOMER/steps/9

验证：CHECK-FLOW-TEMPLATE-READ

## 实施任务

- [TASK-011](../tasks/TASK-011.md)
