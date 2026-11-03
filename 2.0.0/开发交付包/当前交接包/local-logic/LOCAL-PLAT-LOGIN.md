# LOCAL-PLAT-LOGIN 登录与选择合法入口

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md) · [全局逻辑](../global-logic.md)

- [登录并进入合法入口 · FUNC\-2001](../features/FUNC-2001.md)

## 职责与触发

所属工程模块：未填写

功能：FUNC-2001

触发：未认证用户提交账号密码，或恢复会话

## 前置条件

- 准确认证服务和当前授权范围可确认

## 必须遵守的全局规则

- [GR-IDENTITY](../global-logic.md#GR-IDENTITY)
- [GR-SCOPE](../global-logic.md#GR-SCOPE)
- [GR-AUTH](../global-logic.md#GR-AUTH)
- [GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)
- [GR-LIST-ORDER](../global-logic.md#GR-LIST-ORDER)

## 输入与输出

输入：[FIELD-PLAT-LOGIN-NAME](../field-specs.md#FIELD-PLAT-LOGIN-NAME)、[FIELD-PLAT-PASSWORD](../field-specs.md#FIELD-PLAT-PASSWORD)

输出：[FIELD-PLAT-SESSION](../field-specs.md#FIELD-PLAT-SESSION)、[FIELD-PLAT-CURRENT-TENANT](../field-specs.md#FIELD-PLAT-CURRENT-TENANT)、[FIELD-PLAT-POSITION](../field-specs.md#FIELD-PLAT-POSITION)

## 处理步骤

### LOCAL-PLAT-LOGIN-S1

认证账号，分别识别认证失败、范围读取失败、无合法入口

读取：FIELD-PLAT-LOGIN-NAME, FIELD-PLAT-PASSWORD；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

### LOCAL-PLAT-LOGIN-S2

单租户直达、多租户首次选择、恢复上次仍合法租户；独立平台范围按本身资格进入

读取：FIELD-PLAT-LOGIN-NAME, FIELD-PLAT-PASSWORD；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

### LOCAL-PLAT-LOGIN-S3

首次按本人作业/监管/原Cloud合法意图落点；原综合概览默认且同时有导入分配与Cloud报表权者到导入批次与业务名单；没有业务但有公共管理权到首个合法管理页 合法已启用账号在已启用总部或门店租户的管理员成员关系中，业务管理的业务分类PAGE-2006、业务字段PAGE-2223、流转模板PAGE-2228属于已确认角色的有效页面投影；旧组织快照缺这三个pages条目不能压掉菜单或原有配置资格。只补本次有效会话副本，不重写旧组织pages、审计或业务存储；运营、禁用/未知身份、其它租户、原独立模块及其它conditional显式页面约束不扩大。原SUPER配置范围仍沿既有合同，不因菜单兼容取得租户任务代建或安排权。

读取：FIELD-PLAT-LOGIN-NAME, FIELD-PLAT-PASSWORD；写入：FIELD-PLAT-SESSION, FIELD-PLAT-CURRENT-TENANT, FIELD-PLAT-POSITION

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

## 分支与异常

### LOCAL-PLAT-LOGIN-B1

条件：前提、字段及对象修订校验通过且结果明确成功

结果：只建立真实有权会话；AI与Cloud共用身份，不重复填写另一套凭据

涉及字段：FIELD-PLAT-LOGIN-NAME, FIELD-PLAT-PASSWORD, FIELD-PLAT-SESSION, FIELD-PLAT-CURRENT-TENANT, FIELD-PLAT-POSITION

验证：CHECK-PLAT-LOGIN

### LOCAL-PLAT-LOGIN-B2

条件：无权/字段不合法/对象失效/修订冲突

结果：明确显示本次拒绝原因，保留可继续的输入和已确认原值，不作变更

涉及字段：FIELD-PLAT-LOGIN-NAME, FIELD-PLAT-PASSWORD, FIELD-PLAT-SESSION, FIELD-PLAT-CURRENT-TENANT, FIELD-PLAT-POSITION

验证：CHECK-PLAT-LOGIN

### LOCAL-PLAT-LOGIN-B3

条件：提交失败或结果未知

结果：失败保留原确认值；未知显示待核并按同请求核对，不重复提交或假报成功

涉及字段：FIELD-PLAT-LOGIN-NAME, FIELD-PLAT-PASSWORD, FIELD-PLAT-SESSION, FIELD-PLAT-CURRENT-TENANT, FIELD-PLAT-POSITION

验证：CHECK-PLAT-LOGIN

## 完成后的状态

- 只建立真实有权会话；AI与Cloud共用身份，不重复填写另一套凭据

## 字段定义

- [FIELD-PLAT-CURRENT-TENANT](../field-specs.md#FIELD-PLAT-CURRENT-TENANT)
- [FIELD-PLAT-LOGIN-NAME](../field-specs.md#FIELD-PLAT-LOGIN-NAME)
- [FIELD-PLAT-PASSWORD](../field-specs.md#FIELD-PLAT-PASSWORD)
- [FIELD-PLAT-POSITION](../field-specs.md#FIELD-PLAT-POSITION)
- [FIELD-PLAT-SESSION](../field-specs.md#FIELD-PLAT-SESSION)

## 来源与验证

来源条目：acceptance:AC-2001, acceptance:AC-2002, acceptance:AC-2003, acceptance:AC-2004, decisions:CHG-057-TENANT-BUSINESS-MENU, features:FUNC-2001, features:FUNC-2001/behavior_spec/0/branches/0, features:FUNC-2001/behavior_spec/0/branches/1, features:FUNC-2001/behavior_spec/0/branches/2, features:FUNC-2001/behavior_spec/0/postconditions/0, features:FUNC-2001/behavior_spec/0/preconditions/0, features:FUNC-2001/behavior_spec/0/steps/0, features:FUNC-2001/behavior_spec/0/steps/1, features:FUNC-2001/behavior_spec/0/steps/2, pages:PAGE-2001, pages:PAGE-2001/actions/0, pages:PAGE-2001/actions/1, pages:PAGE-2001/fields/0, pages:PAGE-2001/fields/2, pages:PAGE-2001/fields/3, pages:PAGE-2001/fields/4, pages:PAGE-2001/fields/5, pages:PAGE-2002/fields/0, pages:PAGE-2002/fields/3, pages:PAGE-2002/fields/5, pages:PAGE-2003/fields/19, pages:PAGE-2003/fields/4, pages:PAGE-2003/fields/7, pages:PAGE-2005/fields/10, pages:PAGE-2007/fields/19, pages:PAGE-2103/fields/8, pages:PAGE-2106/fields/14, pages:PAGE-2112/fields/27, pages:PAGE-2202/fields/10, pages:PAGE-2202/fields/35, pages:PAGE-2205/fields/7, pages:PAGE-2206/fields/7, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/180, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/183, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/186, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/187, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/188, scenarios:FLOW-CURRENT-PLATFORM/steps/0

验证：CHECK-PLAT-LOGIN

## 实施任务

- [TASK-001](../tasks/TASK-001.md)
