# LOCAL-PLAT-CONTACT-CHECK 新外呼、重呼及补交的公共禁呼检查

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md) · [全局逻辑](../global-logic.md)

- [统一检查所有新外呼、重呼和补提交 · FUNC\-2024](../features/FUNC-2024.md)

## 职责与触发

所属工程模块：未填写

功能：FUNC-2024

触发：AI/人工/预外呼/IVR即将发起任一新拨、重呼或异常补提交

## 前置条件

- 准确租户与可靠规范号码；执行资格仍须独立满足

## 必须遵守的全局规则

- [GR-IDENTITY](../global-logic.md#GR-IDENTITY)
- [GR-SCOPE](../global-logic.md#GR-SCOPE)
- [GR-AUTH](../global-logic.md#GR-AUTH)
- [GR-CONTACT](../global-logic.md#GR-CONTACT)
- [GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)

## 输入与输出

输入：[FIELD-PLAT-CURRENT-TENANT](../field-specs.md#FIELD-PLAT-CURRENT-TENANT)、[FIELD-PLAT-PHONE](../field-specs.md#FIELD-PLAT-PHONE)、[FIELD-PLAT-TASK-MODE](../field-specs.md#FIELD-PLAT-TASK-MODE)、[FIELD-PLAT-BAN-STATE](../field-specs.md#FIELD-PLAT-BAN-STATE)、[FIELD-PLAT-BAN-LIFETIME](../field-specs.md#FIELD-PLAT-BAN-LIFETIME)、[FIELD-PLAT-BAN-SOURCE](../field-specs.md#FIELD-PLAT-BAN-SOURCE)

输出：[FIELD-PLAT-CONTACT-DECISION](../field-specs.md#FIELD-PLAT-CONTACT-DECISION)

## 处理步骤

### LOCAL-PLAT-CONTACT-CHECK-S1

查询所有当前有效公共拒联来源，任一有效则阻止四种外呼

读取：FIELD-PLAT-CURRENT-TENANT, FIELD-PLAT-PHONE, FIELD-PLAT-TASK-MODE, FIELD-PLAT-BAN-STATE, FIELD-PLAT-BAN-LIFETIME, FIELD-PLAT-BAN-SOURCE；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-CONTACT, GR-UNKNOWN

### LOCAL-PLAT-CONTACT-CHECK-S2

普通专项组按明确用途和期限校验，不扩大范围；正常呼入不经过拒接

读取：FIELD-PLAT-CURRENT-TENANT, FIELD-PLAT-PHONE, FIELD-PLAT-TASK-MODE, FIELD-PLAT-BAN-STATE, FIELD-PLAT-BAN-LIFETIME, FIELD-PLAT-BAN-SOURCE；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-CONTACT, GR-UNKNOWN

### LOCAL-PLAT-CONTACT-CHECK-S3

检查失败/未知阻止新发起；已接收未拨号码按供应商能力核验差异，在途电话不静默取消

读取：FIELD-PLAT-CURRENT-TENANT, FIELD-PLAT-PHONE, FIELD-PLAT-TASK-MODE, FIELD-PLAT-BAN-STATE, FIELD-PLAT-BAN-LIFETIME, FIELD-PLAT-BAN-SOURCE；写入：FIELD-PLAT-CONTACT-DECISION

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-CONTACT, GR-UNKNOWN

## 分支与异常

### LOCAL-PLAT-CONTACT-CHECK-B1

条件：前提、字段及对象修订校验通过且结果明确成功

结果：只有明确allow才提交本次新外呼；blocked或unknown不拨号且显示可处理原因

涉及字段：FIELD-PLAT-CURRENT-TENANT, FIELD-PLAT-PHONE, FIELD-PLAT-TASK-MODE, FIELD-PLAT-BAN-STATE, FIELD-PLAT-BAN-LIFETIME, FIELD-PLAT-BAN-SOURCE, FIELD-PLAT-CONTACT-DECISION

验证：CHECK-PLAT-CONTACT-CHECK

### LOCAL-PLAT-CONTACT-CHECK-B2

条件：无权/字段不合法/对象失效/修订冲突

结果：明确显示本次拒绝原因，保留可继续的输入和已确认原值，不作变更

涉及字段：FIELD-PLAT-CURRENT-TENANT, FIELD-PLAT-PHONE, FIELD-PLAT-TASK-MODE, FIELD-PLAT-BAN-STATE, FIELD-PLAT-BAN-LIFETIME, FIELD-PLAT-BAN-SOURCE, FIELD-PLAT-CONTACT-DECISION

验证：CHECK-PLAT-CONTACT-CHECK

### LOCAL-PLAT-CONTACT-CHECK-B3

条件：提交失败或结果未知

结果：失败保留原确认值；未知显示待核并按同请求核对，不重复提交或假报成功

涉及字段：FIELD-PLAT-CURRENT-TENANT, FIELD-PLAT-PHONE, FIELD-PLAT-TASK-MODE, FIELD-PLAT-BAN-STATE, FIELD-PLAT-BAN-LIFETIME, FIELD-PLAT-BAN-SOURCE, FIELD-PLAT-CONTACT-DECISION

验证：CHECK-PLAT-CONTACT-CHECK

## 完成后的状态

- 只有明确allow才提交本次新外呼；blocked或unknown不拨号且显示可处理原因

## 字段定义

- [FIELD-PLAT-BAN-LIFETIME](../field-specs.md#FIELD-PLAT-BAN-LIFETIME)
- [FIELD-PLAT-BAN-SOURCE](../field-specs.md#FIELD-PLAT-BAN-SOURCE)
- [FIELD-PLAT-BAN-STATE](../field-specs.md#FIELD-PLAT-BAN-STATE)
- [FIELD-PLAT-CONTACT-DECISION](../field-specs.md#FIELD-PLAT-CONTACT-DECISION)
- [FIELD-PLAT-CURRENT-TENANT](../field-specs.md#FIELD-PLAT-CURRENT-TENANT)
- [FIELD-PLAT-PHONE](../field-specs.md#FIELD-PLAT-PHONE)
- [FIELD-PLAT-TASK-MODE](../field-specs.md#FIELD-PLAT-TASK-MODE)

## 来源与验证

来源条目：acceptance:AC-2052, acceptance:AC-2055, acceptance:AC-2057, acceptance:AC-2058, acceptance:AC-2059, acceptance:AC-2069, features:FUNC-2024, features:FUNC-2024/behavior_spec/0/branches/0, features:FUNC-2024/behavior_spec/0/branches/1, features:FUNC-2024/behavior_spec/0/branches/2, features:FUNC-2024/behavior_spec/0/postconditions/0, features:FUNC-2024/behavior_spec/0/preconditions/0, features:FUNC-2024/behavior_spec/0/steps/0, features:FUNC-2024/behavior_spec/0/steps/1, features:FUNC-2024/behavior_spec/0/steps/2, pages:PAGE-2001/fields/0, pages:PAGE-2002/fields/0, pages:PAGE-2003/fields/4, pages:PAGE-2007/fields/10, pages:PAGE-2007/fields/16, pages:PAGE-2007/fields/17, pages:PAGE-2007/fields/19, pages:PAGE-2103, pages:PAGE-2103/fields/15, pages:PAGE-2103/fields/22, pages:PAGE-2103/fields/4, pages:PAGE-2103/fields/5, pages:PAGE-2103/fields/6, pages:PAGE-2103/fields/7, pages:PAGE-2103/fields/8, pages:PAGE-2108/fields/10, pages:PAGE-2108/fields/6, pages:PAGE-2108/fields/9, pages:PAGE-2202, pages:PAGE-2202/fields/10, pages:PAGE-2202/fields/22, pages:PAGE-2202/fields/3, pages:PAGE-2202/fields/36, pages:PAGE-2202/fields/4, pages:PAGE-2202/fields/5, pages:PAGE-2202/fields/9, pages:PAGE-2203/fields/59, pages:PAGE-2205, pages:PAGE-2205/fields/1, pages:PAGE-2205/fields/12, pages:PAGE-2205/fields/2, pages:PAGE-2205/fields/3, pages:PAGE-2205/fields/39, pages:PAGE-2205/fields/6, pages:PAGE-2205/fields/7, pages:PAGE-2206, pages:PAGE-2206/fields/1, pages:PAGE-2206/fields/12, pages:PAGE-2206/fields/2, pages:PAGE-2206/fields/3, pages:PAGE-2206/fields/39, pages:PAGE-2206/fields/6, pages:PAGE-2206/fields/7, pages:PAGE-2227/fields/122, pages:PAGE-2227/fields/123, pages:PAGE-2227/fields/124, pages:PAGE-2227/fields/131, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/168, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/200, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/210, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/247, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/249, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/250, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/254, scenarios:FLOW-CURRENT-PLATFORM/steps/44

验证：CHECK-PLAT-CONTACT-CHECK

## 实施任务

- [TASK-039](../tasks/TASK-039.md)
