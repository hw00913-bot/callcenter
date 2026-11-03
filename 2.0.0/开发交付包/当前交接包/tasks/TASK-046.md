# TASK-046 专业任务控制、重呼、补交与结果导出

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md)

- [进入有权工作位置与保留专业能力 · FUNC\-2002](../features/FUNC-2002.md)
- [统一检查所有新外呼、重呼和补提交 · FUNC\-2024](../features/FUNC-2024.md)
- [导出当前专业任务客户明细 · FUNC\-2043](../features/FUNC-2043.md)

## 目标

按每个准确状态控制/暂停/继续/结束/删除，正常重呼与明确异常补交分开。；原失败名单、任务列表/客户明细导出及结果终态精确关联，受理/排队/执行/结束分开。

## 产品依据

- FUNC-2002 进入有权工作位置与保留专业能力：当前五顶栏只负责功能归位。按稳定页面/动作身份保留AI与Cloud现行专业操作、状态、资源、报表和业务接口，分别校验模块、成员、对象、读写/导出权。；来源 documentation/input/functions.json#FUNC-2002
- FUNC-2024 统一检查所有新外呼、重呼和补提交：公共明确拒联阻止本租户AI/人工/PRED/IVR；每次新发起实时检查，失败/未知不放行；正常呼入继续接听，已在途电话不静默取消。；来源 documentation/input/functions.json#FUNC-2024
- FUNC-2043 导出当前专业任务客户明细：入口位于当前预外呼任务详情客户名单，按准确taskId与当前筛选授权明细生成文件；不改成导入批次导出。；来源 documentation/input/functions.json#FUNC-2043

来源根：`/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/开发交付包/工作资料/续接输入`；来源指纹：`ac24ea3af455fa8052e0daeaa799eea0265f5d02f520b26bdd98ac1e620a1a6c`

## 前置任务

- TASK-045

## 只读代码上下文

未指定既有代码文件；从工程规范和产品依据读取上下文。

## 允许修改的文件

- 未填写

代码库根：`None`。未列出的文件不属于本任务修改范围；扩大范围需回到计划。

## 变更安排

- 未填写

## 逻辑与字段依据

先读 [全局逻辑](../global-logic.md)，再读本任务关联的局部逻辑与字段定义。

全局规则：[GR-AUTH](../global-logic.md#GR-AUTH)、[GR-IDENTITY](../global-logic.md#GR-IDENTITY)、[GR-LIST-ORDER](../global-logic.md#GR-LIST-ORDER)、[GR-SCOPE](../global-logic.md#GR-SCOPE)、[GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)

局部逻辑：[LOCAL-PLAT-CLOUD-TASK-CONTROL](../local-logic/LOCAL-PLAT-CLOUD-TASK-CONTROL.md)、[LOCAL-PLAT-CLOUD-TASK-RECALL](../local-logic/LOCAL-PLAT-CLOUD-TASK-RECALL.md)、[LOCAL-PLAT-CLOUD-TASK-RESUBMIT](../local-logic/LOCAL-PLAT-CLOUD-TASK-RESUBMIT.md)、[LOCAL-PLAT-CLOUD-TASK-RESULT](../local-logic/LOCAL-PLAT-CLOUD-TASK-RESULT.md)、[LOCAL-PLAT-TASK-EXPORT](../local-logic/LOCAL-PLAT-TASK-EXPORT.md)、[LOCAL-PLAT-EXPORT-CUSTOMERS](../local-logic/LOCAL-PLAT-EXPORT-CUSTOMERS.md)

字段：[FIELD-PLAT-AUDIT](../field-specs.md#FIELD-PLAT-AUDIT)、[FIELD-PLAT-CALL-ID](../field-specs.md#FIELD-PLAT-CALL-ID)、[FIELD-PLAT-CALL-STATE](../field-specs.md#FIELD-PLAT-CALL-STATE)、[FIELD-PLAT-CONTACT-DECISION](../field-specs.md#FIELD-PLAT-CONTACT-DECISION)、[FIELD-PLAT-OP-STATE](../field-specs.md#FIELD-PLAT-OP-STATE)、[FIELD-PLAT-QUERY](../field-specs.md#FIELD-PLAT-QUERY)、[FIELD-PLAT-REPORT-EXPORT](../field-specs.md#FIELD-PLAT-REPORT-EXPORT)、[FIELD-PLAT-REQUEST](../field-specs.md#FIELD-PLAT-REQUEST)、[FIELD-PLAT-RESOURCE-SCOPE](../field-specs.md#FIELD-PLAT-RESOURCE-SCOPE)、[FIELD-PLAT-REVISION](../field-specs.md#FIELD-PLAT-REVISION)、[FIELD-PLAT-TASK-AGENT-TIMEOUT](../field-specs.md#FIELD-PLAT-TASK-AGENT-TIMEOUT)、[FIELD-PLAT-TASK-ANSWER-RATE](../field-specs.md#FIELD-PLAT-TASK-ANSWER-RATE)、[FIELD-PLAT-TASK-BUSINESS-TAGS](../field-specs.md#FIELD-PLAT-TASK-BUSINESS-TAGS)、[FIELD-PLAT-TASK-CALL-STRATEGY](../field-specs.md#FIELD-PLAT-TASK-CALL-STRATEGY)、[FIELD-PLAT-TASK-CALLER-NAV](../field-specs.md#FIELD-PLAT-TASK-CALLER-NAV)、[FIELD-PLAT-TASK-CALLER-POOLS](../field-specs.md#FIELD-PLAT-TASK-CALLER-POOLS)、[FIELD-PLAT-TASK-CALLROUTE](../field-specs.md#FIELD-PLAT-TASK-CALLROUTE)、[FIELD-PLAT-TASK-CNOS](../field-specs.md#FIELD-PLAT-TASK-CNOS)、[FIELD-PLAT-TASK-CONTACT-FLOW](../field-specs.md#FIELD-PLAT-TASK-CONTACT-FLOW)、[FIELD-PLAT-TASK-CUSTOMER-TIMEOUT](../field-specs.md#FIELD-PLAT-TASK-CUSTOMER-TIMEOUT)、[FIELD-PLAT-TASK-DESC](../field-specs.md#FIELD-PLAT-TASK-DESC)、[FIELD-PLAT-TASK-FAILURES](../field-specs.md#FIELD-PLAT-TASK-FAILURES)、[FIELD-PLAT-TASK-GROUP-TYPE](../field-specs.md#FIELD-PLAT-TASK-GROUP-TYPE)、[FIELD-PLAT-TASK-ID](../field-specs.md#FIELD-PLAT-TASK-ID)、[FIELD-PLAT-TASK-IVR-ID](../field-specs.md#FIELD-PLAT-TASK-IVR-ID)、[FIELD-PLAT-TASK-MAXWAIT](../field-specs.md#FIELD-PLAT-TASK-MAXWAIT)、[FIELD-PLAT-TASK-MIN-AGENTS](../field-specs.md#FIELD-PLAT-TASK-MIN-AGENTS)、[FIELD-PLAT-TASK-MODE](../field-specs.md#FIELD-PLAT-TASK-MODE)、[FIELD-PLAT-TASK-OUTBOUND-GROUP](../field-specs.md#FIELD-PLAT-TASK-OUTBOUND-GROUP)、[FIELD-PLAT-TASK-PREDICTADJUST](../field-specs.md#FIELD-PLAT-TASK-PREDICTADJUST)、[FIELD-PLAT-TASK-QUOTIETY](../field-specs.md#FIELD-PLAT-TASK-QUOTIETY)、[FIELD-PLAT-TASK-RESOURCES](../field-specs.md#FIELD-PLAT-TASK-RESOURCES)、[FIELD-PLAT-TASK-RETRY-POLICY](../field-specs.md#FIELD-PLAT-TASK-RETRY-POLICY)、[FIELD-PLAT-TASK-REWARM](../field-specs.md#FIELD-PLAT-TASK-REWARM)、[FIELD-PLAT-TASK-SCHEDULE-AT](../field-specs.md#FIELD-PLAT-TASK-SCHEDULE-AT)、[FIELD-PLAT-TASK-SCHEDULE-MODE](../field-specs.md#FIELD-PLAT-TASK-SCHEDULE-MODE)、[FIELD-PLAT-TASK-STATE](../field-specs.md#FIELD-PLAT-TASK-STATE)、[FIELD-PLAT-TASK-STOP-AT](../field-specs.md#FIELD-PLAT-TASK-STOP-AT)、[FIELD-PLAT-TASK-STOP-SCHEDULED](../field-specs.md#FIELD-PLAT-TASK-STOP-SCHEDULED)、[FIELD-PLAT-TASK-WARMUP](../field-specs.md#FIELD-PLAT-TASK-WARMUP)、[FIELD-PLAT-TASK-WRAP](../field-specs.md#FIELD-PLAT-TASK-WRAP)

## UI 依据

[全局 UI 规范](../ui-spec.md)

- [UI-PAGE-2205](../ui-pages/UI-PAGE-2205.md)
- [UI-PAGE-2206](../ui-pages/UI-PAGE-2206.md)

## 实现要求

- 按每个准确状态控制/暂停/继续/结束/删除，正常重呼与明确异常补交分开。
- 原失败名单、任务列表/客户明细导出及结果终态精确关联，受理/排队/执行/结束分开。
- 暂停整任务不证明某条号码不再呼叫；未知请求不能重复补交或报成功。
- 按所引LOCAL逐动作落实触发/前后置/分支；业务定义只读同源规格，不另抄一套规则。
- 依赖表示实施契约/共享守卫先就绪，不新增用户操作门槛；跨任务端到端由验收批次合并检查。
- 目标库、模块/服务/表/接口、精确可写文件及命令由开发在开工前绑定；当前空文件清单不授代码写入权。

## 产品验收

- **AC-2058**：首次外呼、重呼及异常补提交须接入禁呼检查，不能以供应商restrict tel补提交规则绕过客户明确拒联。
  依据：docs/functional-spec.json#AC-2058

- **AC-2059**：供应商已接收未拨号码的拦截/取消/删除能力逐供应商核验，能力不足须提交差异，不能降低已确认覆盖目标。
  依据：docs/functional-spec.json#AC-2059

- **AC-2068**：保留预外呼任务创建/修改/名单导入/资源/执行控制/正常重呼/异常补提交/结果与失败下载。客户明细导出在当前taskId任务详情，不改成导入批次导出；失败分类、次数、额度按预外呼原策略，未知先核对。
  依据：docs/functional-spec.json#AC-2068

- **AC-2069**：每次首次/重呼/异常补交均检查当前公共禁呼；仍保供应商明确失败分类及额度，不把预外呼策略套人工或IVR，未知旧请求不得当明确失败补交。
  依据：docs/functional-spec.json#AC-2069

- **AC-2070**：保留IVR专业任务、真实供应商可执行外呼语音流程、名单导入、原允许执行/暂停/继续/结束及结果；未提交/未启动删除按原条件，已执行记录保留，不与人工/预外呼混用。
  依据：docs/functional-spec.json#AC-2070

- **AC-2071**：所有专业资源按准确租户+供应商+enterprise+nativeId及用途判定；资源独立平台授权不是新角色或业务数据共享。IVR必须真实外呼可执行流程，本地/呼入流程ID不可替代。
  依据：docs/functional-spec.json#AC-2071

- **AC-2072**：保留坐席/技能/外呼组/队列/号码/号码池/分机/时间条件/账号资源、呼入规则、通话记录核对、七类Cloud报表、应用接入及必要DCC导入/回传。原专业字段和任务两态有独立语义；同号仅按tenant+enterprise+规范号码关联有权联系历史，不合并业务。确已缺失原任务且无通话/未处理中，仅原有权管理员可手工恢复待分配，不自动回收或增公海。五角色按读权播放/暂停/拖动有权录音。
  依据：docs/functional-spec.json#AC-2072

## 测试要求（尚未执行）

### CHECK-PLAT-CLOUD-TASK-CONTROL / manual

步骤：在准确有权范围触发“执行、暂停、继续、结束或删除专业任务”；分别执行正常输入、明确无权/失效/冲突、失败及未知结果分支；按所列字段边界复查保存与显示。

预期：准确任务动作终态生效；保留名单、结果与历史，不以UI点击伪造供应商成功；无权及非法输入不得写入；失败与未知分别显示且不扩范围、不重复产生副作用。

覆盖：AC-2068, AC-2069, AC-2070, AC-2071

### CHECK-PLAT-CLOUD-TASK-RECALL / manual

步骤：在准确有权范围触发“预外呼正常重呼”；分别执行正常输入、明确无权/失效/冲突、失败及未知结果分支；按所列字段边界复查保存与显示。

预期：只对符合正常重呼条件且当前可呼号码发起，不套人工或IVR策略；无权及非法输入不得写入；失败与未知分别显示且不扩范围、不重复产生副作用。

覆盖：AC-2058, AC-2068, AC-2069

### CHECK-PLAT-CLOUD-TASK-RESUBMIT / manual

步骤：在准确有权范围触发“预外呼明确异常补提交”；分别执行正常输入、明确无权/失效/冲突、失败及未知结果分支；按所列字段边界复查保存与显示。

预期：仅允许的明确异常补交发生一次；被禁呼或未知号码不提交；无权及非法输入不得写入；失败与未知分别显示且不扩范围、不重复产生副作用。

覆盖：AC-2058, AC-2059, AC-2068, AC-2069

### CHECK-PLAT-CLOUD-TASK-RESULT / manual

步骤：在准确有权范围触发“接收任务结果及下载失败名单”；分别执行正常输入、明确无权/失效/冲突、失败及未知结果分支；按所列字段边界复查保存与显示。

预期：专业任务事实和失败名单准确展示/下载，未知结果仍待核；无权及非法输入不得写入；失败与未知分别显示且不扩范围、不重复产生副作用。

覆盖：AC-2068, AC-2069, AC-2070, AC-2072

### CHECK-PLAT-TASK-EXPORT / manual

步骤：在准确有权范围触发“导出预外呼／IVR任务列表”；分别执行正常输入、明确无权/失效/冲突、失败及未知结果分支；按所列字段边界复查保存与显示。

预期：仅导出该方式有权任务列表，不把任务客户明细混作列表；无权及非法输入不得写入；失败与未知分别显示且不扩范围、不重复产生副作用。

覆盖：AC-2068, AC-2070

### CHECK-PLAT-EXPORT-CUSTOMERS / manual

步骤：在准确有权范围触发“导出当前专业任务客户明细”；分别执行正常输入、明确无权/失效/冲突、失败及未知结果分支；按所列字段边界复查保存与显示。

预期：下载当前专业任务客户明细，不导出其他任务或所有批次；无权及非法输入不得写入；失败与未知分别显示且不扩范围、不重复产生副作用。

覆盖：AC-2068

## 完成条件

- 按每个准确状态控制/暂停/继续/结束/删除，正常重呼与明确异常补交分开。
- 原失败名单、任务列表/客户明细导出及结果终态精确关联，受理/排队/执行/结束分开。
- 本任务全部同ID验收检查有当前实现、正常/拒绝/失败/未知证据，关联页面五态及字段权限符合原规格。
- 开发完成目标库/精确文件/模块/数据接口/测试执行绑定，必要共享文件先后依赖已补齐，工程问题有可靠结论。
- 产品变动回产品规格重审；不可用局部实现或Mock结论替代真实远端与正式开工许可。

需保留实际改动、测试结果和 Review 证据。仅修改完成不等于验收通过。


## 本轮工程绑定边界

本任务为可承接的业务实施分解，尚未绑定生产仓库/技术栈。开发确定真实文件后填写allowed_files、context_files、changes并复检共享文件依赖；不得把原型参考文件当作生产可写授权。

只读原型行为参考：

- [module-host.js](../../../prototype/js/components/module-host.js) · 只读行为参考，非生产可写目标

需开发处理的问题：EQ-PLAT-ACCEPTED-CALL, EQ-PLAT-PROFESSIONAL。

原专业操作：

- [predictive-execute](../原专业操作任务映射.md#predictive-execute)
- [predictive-recall](../原专业操作任务映射.md#predictive-recall)
- [predictive-resubmit](../原专业操作任务映射.md#predictive-resubmit)
- [predictive-pause](../原专业操作任务映射.md#predictive-pause)
- [predictive-end](../原专业操作任务映射.md#predictive-end)
- [predictive-download-failures](../原专业操作任务映射.md#predictive-download-failures)
- [predictive-receive-result](../原专业操作任务映射.md#predictive-receive-result)
- [ivr-execute](../原专业操作任务映射.md#ivr-execute)
- [ivr-receive-result](../原专业操作任务映射.md#ivr-receive-result)
- [retained-source-predictive-export-tasks](../原专业操作任务映射.md#retained-source-predictive-export-tasks)
- [retained-source-ivr-export-tasks](../原专业操作任务映射.md#retained-source-ivr-export-tasks)
- [retained-source-ivr-pause](../原专业操作任务映射.md#retained-source-ivr-pause)
- [retained-source-ivr-resume](../原专业操作任务映射.md#retained-source-ivr-resume)
- [retained-source-ivr-end](../原专业操作任务映射.md#retained-source-ivr-end)
- [retained-source-ivr-delete-task](../原专业操作任务映射.md#retained-source-ivr-delete-task)
