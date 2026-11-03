# LOCAL-PLAT-CUSTOMER-DIRECTORY 查询原客户联系档案与关联历史

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md) · [全局逻辑](../global-logic.md)

- [进入有权工作位置与保留专业能力 · FUNC\-2002](../features/FUNC-2002.md)

## 职责与触发

所属工程模块：未填写

功能：FUNC-2002

触发：原客户联系视图查询或查看准确客户任务

## 前置条件

- 原客户对象读权及当前tenant+enterprise

## 必须遵守的全局规则

- [GR-IDENTITY](../global-logic.md#GR-IDENTITY)
- [GR-SCOPE](../global-logic.md#GR-SCOPE)
- [GR-AUTH](../global-logic.md#GR-AUTH)
- [GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)
- [GR-LIST-ORDER](../global-logic.md#GR-LIST-ORDER)

## 输入与输出

输入：[FIELD-PLAT-QUERY](../field-specs.md#FIELD-PLAT-QUERY)、[FIELD-PLAT-CUSTOMER-ID](../field-specs.md#FIELD-PLAT-CUSTOMER-ID)、[FIELD-PLAT-RESOURCE-SCOPE](../field-specs.md#FIELD-PLAT-RESOURCE-SCOPE)

输出：[FIELD-PLAT-CUSTOMER-ID](../field-specs.md#FIELD-PLAT-CUSTOMER-ID)、[FIELD-PLAT-CUSTOMER-NAME](../field-specs.md#FIELD-PLAT-CUSTOMER-NAME)、[FIELD-PLAT-PHONE](../field-specs.md#FIELD-PLAT-PHONE)、[FIELD-PLAT-PRO-FOLLOW-STATE](../field-specs.md#FIELD-PLAT-PRO-FOLLOW-STATE)、[FIELD-PLAT-CALL-ID](../field-specs.md#FIELD-PLAT-CALL-ID)、[FIELD-PLAT-PAGING](../field-specs.md#FIELD-PLAT-PAGING)

## 处理步骤

### LOCAL-PLAT-CUSTOMER-DIRECTORY-S1

按准确业务记录ID查看；按tenant+enterprise+规范号码关联有权联系历史

读取：FIELD-PLAT-QUERY, FIELD-PLAT-CUSTOMER-ID, FIELD-PLAT-RESOURCE-SCOPE；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

### LOCAL-PLAT-CUSTOMER-DIRECTORY-S2

相同号码只关联展示，不合并不同业务记录和业务归属

读取：FIELD-PLAT-QUERY, FIELD-PLAT-CUSTOMER-ID, FIELD-PLAT-RESOURCE-SCOPE；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

### LOCAL-PLAT-CUSTOMER-DIRECTORY-S3

号码明文、录音、详情分别按读权，失败/空结果区分 各来源成功、加载、失败、无权不适用分别表达；只可靠已知空才显示为空，未知/失败保可靠子集与明确notice，不复用旧成功快照冒当前完整结果。无效客户身份可留在内部unlinked诊断DTO，既不造客户，也不在客户档案另列可办理名单；无专用查看待核记录动作。查询仅读瞬态投影；对原已存话单只读hydrate，不启动同步定时器、推进回执或覆盖业务备注；导航偏好及原详情控制器既有缓存沿原合同，不声称浏览器绝对零写入。 用户确认AI生产来源提供完整客户手机号；原AI通话和独立AI回访按准确tenant/enterprise及完整源号码归入原客户主列表。没有脱敏号码待核表、折叠待核名单或人工核对业务，不开放pendingTable/openUnlinked产品入口。异常号码、归属冲突或来源读取失败仍不造客户，保来源notice及原有读取/对象权限，不能通过放宽身份校验消除异常。 各来源成功、加载、失败、无权不适用分别表达；只可靠已知空才显示为空，未知/失败保可靠子集与明确notice，不复用旧成功快照冒当前完整结果。无效客户身份可留在内部unlinked诊断DTO，既不造客户，也不在客户档案另列可办理名单；无专用查看待核记录动作。查询仅读瞬态投影；对原已存话单只读hydrate，不启动同步定时器、推进回执或覆盖业务备注；导航偏好及原详情控制器既有缓存沿原合同，不声称浏览器绝对零写入。 客户档案原入口权限与各来源原模块/对象/人员范围分别满足；AI通话核PAGE-2108，独立AI回访核PAGE-2109，不要求同时拥有两者。运营同号不取得他人记录；监管和转出截止沿权威已授权投影，不以当前owner再次猜测过滤。聚合身份不授CustomerDirectory.find或原编辑/再次联系资格；详情和录音重核准确原来源及原媒体权限。 各来源成功、加载、失败、无权不适用分别表达；只可靠已知空才显示为空，未知/失败保可靠子集与明确notice，不复用旧成功快照冒当前完整结果。无效客户身份可留在内部unlinked诊断DTO，既不造客户，也不在客户档案另列可办理名单；无专用查看待核记录动作。查询仅读瞬态投影；对原已存话单只读hydrate，不启动同步定时器、推进回执或覆盖业务备注；导航偏好及原详情控制器既有缓存沿原合同，不声称浏览器绝对零写入。

读取：FIELD-PLAT-QUERY, FIELD-PLAT-CUSTOMER-ID, FIELD-PLAT-RESOURCE-SCOPE；写入：FIELD-PLAT-CUSTOMER-ID, FIELD-PLAT-CUSTOMER-NAME, FIELD-PLAT-PHONE, FIELD-PLAT-PRO-FOLLOW-STATE, FIELD-PLAT-CALL-ID, FIELD-PLAT-PAGING

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

## 分支与异常

### LOCAL-PLAT-CUSTOMER-DIRECTORY-B1

条件：前提、字段及对象修订校验通过且结果明确成功

结果：显示原客户任务及有权联系历史，不创建客户公海或跨租户共享

涉及字段：FIELD-PLAT-QUERY, FIELD-PLAT-CUSTOMER-ID, FIELD-PLAT-RESOURCE-SCOPE, FIELD-PLAT-CUSTOMER-NAME, FIELD-PLAT-PHONE, FIELD-PLAT-PRO-FOLLOW-STATE, FIELD-PLAT-CALL-ID, FIELD-PLAT-PAGING

验证：CHECK-PLAT-CUSTOMER-DIRECTORY

### LOCAL-PLAT-CUSTOMER-DIRECTORY-B2

条件：无权/字段不合法/对象失效/修订冲突

结果：明确显示本次拒绝原因，保留可继续的输入和已确认原值，不作变更

涉及字段：FIELD-PLAT-QUERY, FIELD-PLAT-CUSTOMER-ID, FIELD-PLAT-RESOURCE-SCOPE, FIELD-PLAT-CUSTOMER-NAME, FIELD-PLAT-PHONE, FIELD-PLAT-PRO-FOLLOW-STATE, FIELD-PLAT-CALL-ID, FIELD-PLAT-PAGING

验证：CHECK-PLAT-CUSTOMER-DIRECTORY

### LOCAL-PLAT-CUSTOMER-DIRECTORY-B3

条件：提交失败或结果未知

结果：失败保留原确认值；未知显示待核并按同请求核对，不重复提交或假报成功

涉及字段：FIELD-PLAT-QUERY, FIELD-PLAT-CUSTOMER-ID, FIELD-PLAT-RESOURCE-SCOPE, FIELD-PLAT-CUSTOMER-NAME, FIELD-PLAT-PHONE, FIELD-PLAT-PRO-FOLLOW-STATE, FIELD-PLAT-CALL-ID, FIELD-PLAT-PAGING

验证：CHECK-PLAT-CUSTOMER-DIRECTORY

## 完成后的状态

- 显示原客户任务及有权联系历史，不创建客户公海或跨租户共享

## 字段定义

- [FIELD-PLAT-CALL-ID](../field-specs.md#FIELD-PLAT-CALL-ID)
- [FIELD-PLAT-CUSTOMER-ID](../field-specs.md#FIELD-PLAT-CUSTOMER-ID)
- [FIELD-PLAT-CUSTOMER-NAME](../field-specs.md#FIELD-PLAT-CUSTOMER-NAME)
- [FIELD-PLAT-PAGING](../field-specs.md#FIELD-PLAT-PAGING)
- [FIELD-PLAT-PHONE](../field-specs.md#FIELD-PLAT-PHONE)
- [FIELD-PLAT-PRO-FOLLOW-STATE](../field-specs.md#FIELD-PLAT-PRO-FOLLOW-STATE)
- [FIELD-PLAT-QUERY](../field-specs.md#FIELD-PLAT-QUERY)
- [FIELD-PLAT-RESOURCE-SCOPE](../field-specs.md#FIELD-PLAT-RESOURCE-SCOPE)

## 来源与验证

来源条目：acceptance:AC-2066, acceptance:AC-2067, acceptance:AC-2072, acceptance:AC-2073, acceptance:AC-2147, decisions:CHG-055-CUSTOMER-PROFILE, decisions:CHG-059-AI-FULL-PHONE, features:FUNC-2002, features:FUNC-2002/behavior_spec/31/branches/0, features:FUNC-2002/behavior_spec/31/branches/1, features:FUNC-2002/behavior_spec/31/branches/2, features:FUNC-2002/behavior_spec/31/postconditions/0, features:FUNC-2002/behavior_spec/31/preconditions/0, features:FUNC-2002/behavior_spec/31/steps/0, features:FUNC-2002/behavior_spec/31/steps/1, features:FUNC-2002/behavior_spec/31/steps/2, pages:PAGE-2002/fields/2, pages:PAGE-2002/fields/4, pages:PAGE-2003/fields/18, pages:PAGE-2003/fields/20, pages:PAGE-2003/fields/23, pages:PAGE-2005/fields/6, pages:PAGE-2005/fields/7, pages:PAGE-2007/fields/18, pages:PAGE-2007/fields/22, pages:PAGE-2007/fields/23, pages:PAGE-2102/fields/4, pages:PAGE-2103/fields/14, pages:PAGE-2103/fields/15, pages:PAGE-2103/fields/17, pages:PAGE-2103/fields/9, pages:PAGE-2105/fields/0, pages:PAGE-2105/fields/1, pages:PAGE-2105/fields/4, pages:PAGE-2106/fields/5, pages:PAGE-2106/fields/6, pages:PAGE-2106/fields/9, pages:PAGE-2107/fields/0, pages:PAGE-2107/fields/1, pages:PAGE-2107/fields/4, pages:PAGE-2108/fields/12, pages:PAGE-2108/fields/15, pages:PAGE-2108/fields/16, pages:PAGE-2108/fields/19, pages:PAGE-2109/fields/4, pages:PAGE-2109/fields/6, pages:PAGE-2109/fields/7, pages:PAGE-2110/fields/10, pages:PAGE-2110/fields/9, pages:PAGE-2111/fields/13, pages:PAGE-2111/fields/14, pages:PAGE-2111/fields/15, pages:PAGE-2112/fields/12, pages:PAGE-2202/fields/11, pages:PAGE-2202/fields/22, pages:PAGE-2202/fields/25, pages:PAGE-2202/fields/26, pages:PAGE-2202/fields/29, pages:PAGE-2202/fields/7, pages:PAGE-2203, pages:PAGE-2203/actions/0, pages:PAGE-2203/fields/55, pages:PAGE-2203/fields/56, pages:PAGE-2203/fields/57, pages:PAGE-2203/fields/58, pages:PAGE-2203/fields/59, pages:PAGE-2203/fields/60, pages:PAGE-2203/fields/61, pages:PAGE-2203/fields/63, pages:PAGE-2204/fields/72, pages:PAGE-2204/fields/73, pages:PAGE-2204/fields/78, pages:PAGE-2204/fields/80, pages:PAGE-2204/fields/81, pages:PAGE-2204/fields/83, pages:PAGE-2205/fields/11, pages:PAGE-2205/fields/12, pages:PAGE-2205/fields/13, pages:PAGE-2205/fields/16, pages:PAGE-2205/fields/4, pages:PAGE-2206/fields/11, pages:PAGE-2206/fields/12, pages:PAGE-2206/fields/13, pages:PAGE-2206/fields/16, pages:PAGE-2206/fields/4, pages:PAGE-2207/fields/2, pages:PAGE-2208/fields/2, pages:PAGE-2208/fields/5, pages:PAGE-2208/fields/6, pages:PAGE-2208/fields/9, pages:PAGE-2209/fields/0, pages:PAGE-2209/fields/1, pages:PAGE-2209/fields/2, pages:PAGE-2209/fields/3, pages:PAGE-2209/fields/7, pages:PAGE-2210/fields/2, pages:PAGE-2210/fields/3, pages:PAGE-2210/fields/6, pages:PAGE-2211/fields/2, pages:PAGE-2211/fields/3, pages:PAGE-2211/fields/5, pages:PAGE-2212/fields/10, pages:PAGE-2212/fields/6, pages:PAGE-2212/fields/7, pages:PAGE-2213/fields/2, pages:PAGE-2213/fields/26, pages:PAGE-2213/fields/3, pages:PAGE-2214/fields/3, pages:PAGE-2214/fields/5, pages:PAGE-2215/fields/4, pages:PAGE-2215/fields/5, pages:PAGE-2215/fields/7, pages:PAGE-2216/fields/11, pages:PAGE-2216/fields/2, pages:PAGE-2216/fields/8, pages:PAGE-2217/fields/14, pages:PAGE-2217/fields/15, pages:PAGE-2217/fields/18, pages:PAGE-2218/fields/2, pages:PAGE-2218/fields/3, pages:PAGE-2218/fields/6, pages:PAGE-2219/fields/10, pages:PAGE-2219/fields/12, pages:PAGE-2219/fields/9, pages:PAGE-2220/fields/13, pages:PAGE-2220/fields/14, pages:PAGE-2220/fields/15, pages:PAGE-2220/fields/18, pages:PAGE-2220/fields/8, pages:PAGE-2220/fields/9, pages:PAGE-2221/fields/2, pages:PAGE-2221/fields/4, pages:PAGE-2221/fields/7, pages:PAGE-2222/fields/2, pages:PAGE-2222/fields/4, pages:PAGE-2225/fields/0, pages:PAGE-2225/fields/1, pages:PAGE-2225/fields/2, pages:PAGE-2227/fields/126, pages:PAGE-2227/fields/130, pages:PAGE-2227/fields/131, pages:PAGE-2227/fields/133, pages:PAGE-2227/fields/134, pages:PAGE-2227/fields/137, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/216, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/217, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/227, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/228, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/229, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/231, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/234, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/283, scenarios:FLOW-CURRENT-PLATFORM/steps/58

验证：CHECK-PLAT-CUSTOMER-DIRECTORY

## 实施任务

- [TASK-043](../tasks/TASK-043.md)
