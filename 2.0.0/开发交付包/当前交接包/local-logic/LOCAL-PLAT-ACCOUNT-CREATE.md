# LOCAL-PLAT-ACCOUNT-CREATE 新建账号并加入本租户

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md) · [全局逻辑](../global-logic.md)

- [创建账号或显式关联已有账号为本租户成员 · FUNC\-2011](../features/FUNC-2011.md)

## 职责与触发

所属工程模块：未填写

功能：FUNC-2011

触发：有权管理员新建成员选择创建新账号并保存

## 前置条件

- 本租户建号权；目标租户模块和委派范围可确认

## 必须遵守的全局规则

- [GR-IDENTITY](../global-logic.md#GR-IDENTITY)
- [GR-SCOPE](../global-logic.md#GR-SCOPE)
- [GR-AUTH](../global-logic.md#GR-AUTH)
- [GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)
- [GR-LIST-ORDER](../global-logic.md#GR-LIST-ORDER)

## 输入与输出

输入：[FIELD-PLAT-LOGIN-NAME](../field-specs.md#FIELD-PLAT-LOGIN-NAME)、[FIELD-PLAT-NICKNAME](../field-specs.md#FIELD-PLAT-NICKNAME)、[FIELD-PLAT-MOBILE](../field-specs.md#FIELD-PLAT-MOBILE)、[FIELD-PLAT-PASSWORD](../field-specs.md#FIELD-PLAT-PASSWORD)、[FIELD-PLAT-AVATAR](../field-specs.md#FIELD-PLAT-AVATAR)、[FIELD-PLAT-MEMBER-TENANT](../field-specs.md#FIELD-PLAT-MEMBER-TENANT)、[FIELD-PLAT-MEMBER-ROLE](../field-specs.md#FIELD-PLAT-MEMBER-ROLE)、[FIELD-PLAT-MEMBER-GRANTS](../field-specs.md#FIELD-PLAT-MEMBER-GRANTS)、[FIELD-PLAT-REQUEST](../field-specs.md#FIELD-PLAT-REQUEST)

输出：[FIELD-PLAT-ACCOUNT-ID](../field-specs.md#FIELD-PLAT-ACCOUNT-ID)、[FIELD-PLAT-MEMBER-ID](../field-specs.md#FIELD-PLAT-MEMBER-ID)、[FIELD-PLAT-MEMBER-STATE](../field-specs.md#FIELD-PLAT-MEMBER-STATE)、[FIELD-PLAT-AUDIT](../field-specs.md#FIELD-PLAT-AUDIT)、[FIELD-PLAT-OP-STATE](../field-specs.md#FIELD-PLAT-OP-STATE)

## 处理步骤

### LOCAL-PLAT-ACCOUNT-CREATE-S1

校验登录名/手机号唯一和密码强度、昵称/头像；发现已有账号转显式关联而不自动合并

读取：FIELD-PLAT-LOGIN-NAME, FIELD-PLAT-NICKNAME, FIELD-PLAT-MOBILE, FIELD-PLAT-PASSWORD, FIELD-PLAT-AVATAR, FIELD-PLAT-MEMBER-TENANT, FIELD-PLAT-MEMBER-ROLE, FIELD-PLAT-MEMBER-GRANTS, FIELD-PLAT-REQUEST；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

### LOCAL-PLAT-ACCOUNT-CREATE-S2

分别建立全局普通账号与当前租户唯一成员关系，限制角色及模块为可委派子集

读取：FIELD-PLAT-LOGIN-NAME, FIELD-PLAT-NICKNAME, FIELD-PLAT-MOBILE, FIELD-PLAT-PASSWORD, FIELD-PLAT-AVATAR, FIELD-PLAT-MEMBER-TENANT, FIELD-PLAT-MEMBER-ROLE, FIELD-PLAT-MEMBER-GRANTS, FIELD-PLAT-REQUEST；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

### LOCAL-PLAT-ACCOUNT-CREATE-S3

提交结果明确后展示账号与成员；失败/部分/未知分别记录，不伪造整批成功

读取：FIELD-PLAT-LOGIN-NAME, FIELD-PLAT-NICKNAME, FIELD-PLAT-MOBILE, FIELD-PLAT-PASSWORD, FIELD-PLAT-AVATAR, FIELD-PLAT-MEMBER-TENANT, FIELD-PLAT-MEMBER-ROLE, FIELD-PLAT-MEMBER-GRANTS, FIELD-PLAT-REQUEST；写入：FIELD-PLAT-ACCOUNT-ID, FIELD-PLAT-MEMBER-ID, FIELD-PLAT-MEMBER-STATE, FIELD-PLAT-AUDIT, FIELD-PLAT-OP-STATE

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

## 分支与异常

### LOCAL-PLAT-ACCOUNT-CREATE-B1

条件：前提、字段及对象修订校验通过且结果明确成功

结果：准确普通账号与本租户成员创建成功，不授超管或其他租户权限

涉及字段：FIELD-PLAT-LOGIN-NAME, FIELD-PLAT-NICKNAME, FIELD-PLAT-MOBILE, FIELD-PLAT-PASSWORD, FIELD-PLAT-AVATAR, FIELD-PLAT-MEMBER-TENANT, FIELD-PLAT-MEMBER-ROLE, FIELD-PLAT-MEMBER-GRANTS, FIELD-PLAT-REQUEST, FIELD-PLAT-ACCOUNT-ID, FIELD-PLAT-MEMBER-ID, FIELD-PLAT-MEMBER-STATE, FIELD-PLAT-AUDIT, FIELD-PLAT-OP-STATE

验证：CHECK-PLAT-ACCOUNT-CREATE

### LOCAL-PLAT-ACCOUNT-CREATE-B2

条件：无权/字段不合法/对象失效/修订冲突

结果：明确显示本次拒绝原因，保留可继续的输入和已确认原值，不作变更

涉及字段：FIELD-PLAT-LOGIN-NAME, FIELD-PLAT-NICKNAME, FIELD-PLAT-MOBILE, FIELD-PLAT-PASSWORD, FIELD-PLAT-AVATAR, FIELD-PLAT-MEMBER-TENANT, FIELD-PLAT-MEMBER-ROLE, FIELD-PLAT-MEMBER-GRANTS, FIELD-PLAT-REQUEST, FIELD-PLAT-ACCOUNT-ID, FIELD-PLAT-MEMBER-ID, FIELD-PLAT-MEMBER-STATE, FIELD-PLAT-AUDIT, FIELD-PLAT-OP-STATE

验证：CHECK-PLAT-ACCOUNT-CREATE

### LOCAL-PLAT-ACCOUNT-CREATE-B3

条件：提交失败或结果未知

结果：失败保留原确认值；未知显示待核并按同请求核对，不重复提交或假报成功

涉及字段：FIELD-PLAT-LOGIN-NAME, FIELD-PLAT-NICKNAME, FIELD-PLAT-MOBILE, FIELD-PLAT-PASSWORD, FIELD-PLAT-AVATAR, FIELD-PLAT-MEMBER-TENANT, FIELD-PLAT-MEMBER-ROLE, FIELD-PLAT-MEMBER-GRANTS, FIELD-PLAT-REQUEST, FIELD-PLAT-ACCOUNT-ID, FIELD-PLAT-MEMBER-ID, FIELD-PLAT-MEMBER-STATE, FIELD-PLAT-AUDIT, FIELD-PLAT-OP-STATE

验证：CHECK-PLAT-ACCOUNT-CREATE

## 完成后的状态

- 准确普通账号与本租户成员创建成功，不授超管或其他租户权限

## 字段定义

- [FIELD-PLAT-ACCOUNT-ID](../field-specs.md#FIELD-PLAT-ACCOUNT-ID)
- [FIELD-PLAT-AUDIT](../field-specs.md#FIELD-PLAT-AUDIT)
- [FIELD-PLAT-AVATAR](../field-specs.md#FIELD-PLAT-AVATAR)
- [FIELD-PLAT-LOGIN-NAME](../field-specs.md#FIELD-PLAT-LOGIN-NAME)
- [FIELD-PLAT-MEMBER-GRANTS](../field-specs.md#FIELD-PLAT-MEMBER-GRANTS)
- [FIELD-PLAT-MEMBER-ID](../field-specs.md#FIELD-PLAT-MEMBER-ID)
- [FIELD-PLAT-MEMBER-ROLE](../field-specs.md#FIELD-PLAT-MEMBER-ROLE)
- [FIELD-PLAT-MEMBER-STATE](../field-specs.md#FIELD-PLAT-MEMBER-STATE)
- [FIELD-PLAT-MEMBER-TENANT](../field-specs.md#FIELD-PLAT-MEMBER-TENANT)
- [FIELD-PLAT-MOBILE](../field-specs.md#FIELD-PLAT-MOBILE)
- [FIELD-PLAT-NICKNAME](../field-specs.md#FIELD-PLAT-NICKNAME)
- [FIELD-PLAT-OP-STATE](../field-specs.md#FIELD-PLAT-OP-STATE)
- [FIELD-PLAT-PASSWORD](../field-specs.md#FIELD-PLAT-PASSWORD)
- [FIELD-PLAT-REQUEST](../field-specs.md#FIELD-PLAT-REQUEST)

## 来源与验证

来源条目：acceptance:AC-2022, acceptance:AC-2023, acceptance:AC-2024, acceptance:AC-2025, features:FUNC-2011, features:FUNC-2011/behavior_spec/0/branches/0, features:FUNC-2011/behavior_spec/0/branches/1, features:FUNC-2011/behavior_spec/0/branches/2, features:FUNC-2011/behavior_spec/0/postconditions/0, features:FUNC-2011/behavior_spec/0/preconditions/0, features:FUNC-2011/behavior_spec/0/steps/0, features:FUNC-2011/behavior_spec/0/steps/1, features:FUNC-2011/behavior_spec/0/steps/2, pages:PAGE-2001/fields/2, pages:PAGE-2001/fields/3, pages:PAGE-2003, pages:PAGE-2003/actions/0, pages:PAGE-2003/fields/0, pages:PAGE-2003/fields/10, pages:PAGE-2003/fields/11, pages:PAGE-2003/fields/12, pages:PAGE-2003/fields/13, pages:PAGE-2003/fields/14, pages:PAGE-2003/fields/16, pages:PAGE-2003/fields/17, pages:PAGE-2003/fields/19, pages:PAGE-2003/fields/2, pages:PAGE-2003/fields/22, pages:PAGE-2003/fields/3, pages:PAGE-2003/fields/7, pages:PAGE-2003/fields/9, pages:PAGE-2004/fields/0, pages:PAGE-2004/fields/2, pages:PAGE-2004/fields/4, pages:PAGE-2005/fields/0, pages:PAGE-2005/fields/5, pages:PAGE-2005/fields/8, pages:PAGE-2006/fields/56, pages:PAGE-2007/fields/1, pages:PAGE-2007/fields/21, pages:PAGE-2007/fields/24, pages:PAGE-2103/fields/13, pages:PAGE-2103/fields/19, pages:PAGE-2103/fields/3, pages:PAGE-2108/fields/18, pages:PAGE-2108/fields/4, pages:PAGE-2109/fields/3, pages:PAGE-2110/fields/7, pages:PAGE-2110/fields/8, pages:PAGE-2111/fields/12, pages:PAGE-2112/fields/11, pages:PAGE-2112/fields/13, pages:PAGE-2112/fields/6, pages:PAGE-2202/fields/1, pages:PAGE-2202/fields/18, pages:PAGE-2202/fields/19, pages:PAGE-2202/fields/21, pages:PAGE-2202/fields/28, pages:PAGE-2204/fields/71, pages:PAGE-2204/fields/77, pages:PAGE-2204/fields/82, pages:PAGE-2205/fields/0, pages:PAGE-2205/fields/10, pages:PAGE-2205/fields/15, pages:PAGE-2206/fields/0, pages:PAGE-2206/fields/10, pages:PAGE-2206/fields/15, pages:PAGE-2207/fields/0, pages:PAGE-2207/fields/14, pages:PAGE-2207/fields/17, pages:PAGE-2210/fields/0, pages:PAGE-2210/fields/1, pages:PAGE-2210/fields/5, pages:PAGE-2211/fields/0, pages:PAGE-2211/fields/1, pages:PAGE-2211/fields/4, pages:PAGE-2212/fields/0, pages:PAGE-2212/fields/1, pages:PAGE-2212/fields/9, pages:PAGE-2213/fields/0, pages:PAGE-2213/fields/1, pages:PAGE-2213/fields/25, pages:PAGE-2214/fields/0, pages:PAGE-2214/fields/2, pages:PAGE-2214/fields/4, pages:PAGE-2215/fields/0, pages:PAGE-2215/fields/3, pages:PAGE-2215/fields/6, pages:PAGE-2216/fields/0, pages:PAGE-2216/fields/1, pages:PAGE-2216/fields/10, pages:PAGE-2217/fields/0, pages:PAGE-2217/fields/13, pages:PAGE-2217/fields/17, pages:PAGE-2218/fields/0, pages:PAGE-2218/fields/1, pages:PAGE-2218/fields/5, pages:PAGE-2219/fields/0, pages:PAGE-2219/fields/11, pages:PAGE-2219/fields/8, pages:PAGE-2220/fields/12, pages:PAGE-2220/fields/17, pages:PAGE-2220/fields/7, pages:PAGE-2221/fields/0, pages:PAGE-2221/fields/6, pages:PAGE-2222/fields/0, pages:PAGE-2223/fields/35, pages:PAGE-2227/fields/120, pages:PAGE-2227/fields/136, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/160, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/161, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/162, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/163, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/164, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/165, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/186, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/187, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/188, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/190, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/192, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/193, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/194, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/195, scenarios:FLOW-CURRENT-PLATFORM/steps/10

验证：CHECK-PLAT-ACCOUNT-CREATE

## 实施任务

- [TASK-005](../tasks/TASK-005.md)
