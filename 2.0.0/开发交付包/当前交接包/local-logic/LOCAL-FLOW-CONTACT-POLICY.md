# LOCAL-FLOW-CONTACT-POLICY 维护本租户同号联系协调

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md) · [全局逻辑](../global-logic.md)

- [明确发起当前呼叫及同组批呼叫 · FUNC\-2031](../features/FUNC-2031.md)
- [查询业务、批次和工作队列 · FUNC\-2039](../features/FUNC-2039.md)

## 职责与触发

所属工程模块：未填写

功能：FUNC-2031, FUNC-2039

触发：管理员从导入批次与业务名单维护联系协调设置

## 前置条件

- 仅当前实际租户管理员维护

## 必须遵守的全局规则

- [GR-CONTACT](../global-logic.md#GR-CONTACT)
- [GR-SERIAL](../global-logic.md#GR-SERIAL)
- [GR-AUTH](../global-logic.md#GR-AUTH)
- [GR-DATA-FACTS](../global-logic.md#GR-DATA-FACTS)
- [GR-EXECUTION-ARRANGEMENT](../global-logic.md#GR-EXECUTION-ARRANGEMENT)

## 输入与输出

输入：[FIELD-FLOW-CONTACT-INTERVAL](../field-specs.md#FIELD-FLOW-CONTACT-INTERVAL)、[FIELD-FLOW-CONTACT-DAILY-LIMIT](../field-specs.md#FIELD-FLOW-CONTACT-DAILY-LIMIT)、[FIELD-FLOW-CATEGORY-PRIORITY](../field-specs.md#FIELD-FLOW-CATEGORY-PRIORITY)、[FIELD-FLOW-EXECUTION-PRIORITY](../field-specs.md#FIELD-FLOW-EXECUTION-PRIORITY)、[FIELD-FLOW-EXECUTION-QUEUED-AT](../field-specs.md#FIELD-FLOW-EXECUTION-QUEUED-AT)、[FIELD-FLOW-EXECUTION-QUEUE-SEQUENCE](../field-specs.md#FIELD-FLOW-EXECUTION-QUEUE-SEQUENCE)

输出：[FIELD-FLOW-CONTACT-POLICY](../field-specs.md#FIELD-FLOW-CONTACT-POLICY)

## 处理步骤

### STEP-FLOW-CONTACT-POLICY-1

校0禁用额外频控及有效范围；旧分类权重仅有值时只读保留，当前界面不再编辑，五档等级从当前执行安排维护

读取：FIELD-FLOW-CONTACT-INTERVAL, FIELD-FLOW-CONTACT-DAILY-LIMIT, FIELD-FLOW-CATEGORY-PRIORITY；写入：FIELD-FLOW-CONTACT-POLICY

规则：GR-CONTACT, GR-SERIAL, GR-AUTH, GR-DATA-FACTS

### STEP-FLOW-CONTACT-POLICY-2

起呼按完整规范号、准确原专业及本账本事实协调占用与频次；同号码及同资源使用五档降序、queuedAt/queueSequence入队FIFO和稳定业务ID的统一总序，避免交叉等待；旧分类0～999仅保历史/原专业兼容，不参与新排序，当前UI只读，不抢占在途。

读取：FIELD-FLOW-PHONE, FIELD-FLOW-CALLS, FIELD-FLOW-CONTACT-POLICY, FIELD-FLOW-EXECUTION-PRIORITY, FIELD-FLOW-EXECUTION-QUEUED-AT, FIELD-FLOW-EXECUTION-QUEUE-SEQUENCE；写入：无

规则：GR-CONTACT, GR-SERIAL, GR-AUTH, GR-DATA-FACTS, GR-EXECUTION-ARRANGEMENT

## 分支与异常

### BRANCH-FLOW-CONTACT-POLICY-1

条件：已在途/排队/重试/unknown或频次/高优先条件不允

结果：阻新呼叫并给原因及可核最早时间，不自动续拨

涉及字段：FIELD-FLOW-CONTACT-POLICY, FIELD-FLOW-WORK-STATE

验证：CHECK-FLOW-CONTACT-POLICY

### BRANCH-FLOW-CONTACT-POLICY-2

条件：明确终止且事实完整/策略允许

结果：仅解除原占用，人员仍须明确发起

涉及字段：FIELD-FLOW-EXECUTION-STATE, FIELD-FLOW-CONTACT-POLICY

验证：CHECK-FLOW-CONTACT-POLICY

## 完成后的状态

- 不靠掩码猜号码，不因维护策略放松公共拒联或供应商边界

## 字段定义

- [FIELD-FLOW-CONTACT-INTERVAL](../field-specs.md#FIELD-FLOW-CONTACT-INTERVAL)
- [FIELD-FLOW-CONTACT-DAILY-LIMIT](../field-specs.md#FIELD-FLOW-CONTACT-DAILY-LIMIT)
- [FIELD-FLOW-CATEGORY-PRIORITY](../field-specs.md#FIELD-FLOW-CATEGORY-PRIORITY)
- [FIELD-FLOW-EXECUTION-PRIORITY](../field-specs.md#FIELD-FLOW-EXECUTION-PRIORITY)
- [FIELD-FLOW-EXECUTION-QUEUED-AT](../field-specs.md#FIELD-FLOW-EXECUTION-QUEUED-AT)
- [FIELD-FLOW-EXECUTION-QUEUE-SEQUENCE](../field-specs.md#FIELD-FLOW-EXECUTION-QUEUE-SEQUENCE)
- [FIELD-FLOW-CONTACT-POLICY](../field-specs.md#FIELD-FLOW-CONTACT-POLICY)
- [FIELD-FLOW-PHONE](../field-specs.md#FIELD-FLOW-PHONE)
- [FIELD-FLOW-CALLS](../field-specs.md#FIELD-FLOW-CALLS)
- [FIELD-FLOW-WORK-STATE](../field-specs.md#FIELD-FLOW-WORK-STATE)
- [FIELD-FLOW-EXECUTION-STATE](../field-specs.md#FIELD-FLOW-EXECUTION-STATE)

## 来源与验证

来源条目：acceptance:AC-2121, acceptance:AC-2122, features:FUNC-2031, features:FUNC-2031/behavior_spec/4/branches/0, features:FUNC-2031/behavior_spec/4/branches/1, features:FUNC-2031/behavior_spec/4/postconditions/0, features:FUNC-2031/behavior_spec/4/preconditions/0, features:FUNC-2031/behavior_spec/4/steps/0, features:FUNC-2031/behavior_spec/4/steps/1, features:FUNC-2039, features:FUNC-2039/behavior_spec/3/branches/0, features:FUNC-2039/behavior_spec/3/branches/1, features:FUNC-2039/behavior_spec/3/postconditions/0, features:FUNC-2039/behavior_spec/3/preconditions/0, features:FUNC-2039/behavior_spec/3/steps/0, features:FUNC-2039/behavior_spec/3/steps/1, pages:PAGE-2006/fields/54, pages:PAGE-2103/fields/32, pages:PAGE-2203/fields/35, pages:PAGE-2203/fields/54, pages:PAGE-2203/fields/9, pages:PAGE-2204, pages:PAGE-2204/fields/12, pages:PAGE-2204/fields/13, pages:PAGE-2204/fields/14, pages:PAGE-2204/fields/15, pages:PAGE-2204/fields/26, pages:PAGE-2204/fields/46, pages:PAGE-2204/fields/65, pages:PAGE-2204/fields/9, pages:PAGE-2204/fields/92, pages:PAGE-2204/fields/93, pages:PAGE-2204/fields/94, pages:PAGE-2205/fields/60, pages:PAGE-2226/fields/15, pages:PAGE-2226/fields/27, pages:PAGE-2226/fields/34, pages:PAGE-2226/fields/40, pages:PAGE-2226/fields/41, pages:PAGE-2226/fields/42, pages:PAGE-2226/fields/7, pages:PAGE-2227/fields/118, pages:PAGE-2227/fields/145, pages:PAGE-2227/fields/146, pages:PAGE-2227/fields/147, pages:PAGE-2227/fields/16, pages:PAGE-2227/fields/19, pages:PAGE-2227/fields/39, pages:PAGE-2227/fields/70, pages:PAGE-2228/fields/31, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/105, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/123, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/125, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/126, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/127, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/128, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/161, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/162, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/163, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/63, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/97, scenarios:FLOW-CURRENT-CUSTOMER/steps/37

验证：CHECK-FLOW-CONTACT-POLICY

## 实施任务

- [TASK-031](../tasks/TASK-031.md)
