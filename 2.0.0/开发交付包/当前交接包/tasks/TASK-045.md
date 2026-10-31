# TASK-045 预外呼/IVR任务配置和名单导入

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md)

- [进入有权工作位置与保留专业能力 · FUNC\-2002](../features/FUNC-2002.md)

## 目标

查询及维护原任务、计划、唯一执行资源和名单导入，方式与资源用途不能混用。；供应商流程/本地映射、计划起止、主叫/号码池、任务内重呼等原参数按规格解释。

## 产品依据

- FUNC-2002 进入有权工作位置与保留专业能力：当前五顶栏只负责功能归位。按稳定页面/动作身份保留AI与Cloud现行专业操作、状态、资源、报表和业务接口，分别校验模块、成员、对象、读写/导出权。；来源 documentation/input/functions.json#FUNC-2002

来源根：`/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/开发交付包/工作资料/续接输入`；来源指纹：`0904ba9de2798ea9878d0602f5fbc337ae523a60911c1b10dac967c13febffbe`

## 前置任务

- TASK-005
- TASK-039
- TASK-052
- TASK-053
- TASK-054
- TASK-055

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

局部逻辑：[LOCAL-PLAT-CLOUD-TASK-QUERY](../local-logic/LOCAL-PLAT-CLOUD-TASK-QUERY.md)、[LOCAL-PLAT-CLOUD-TASK-SAVE](../local-logic/LOCAL-PLAT-CLOUD-TASK-SAVE.md)、[LOCAL-PLAT-CLOUD-TASK-IMPORT](../local-logic/LOCAL-PLAT-CLOUD-TASK-IMPORT.md)

字段：[FIELD-PLAT-AUDIT](../field-specs.md#FIELD-PLAT-AUDIT)、[FIELD-PLAT-IMPORT-BATCH](../field-specs.md#FIELD-PLAT-IMPORT-BATCH)、[FIELD-PLAT-IMPORT-ROWS](../field-specs.md#FIELD-PLAT-IMPORT-ROWS)、[FIELD-PLAT-OP-STATE](../field-specs.md#FIELD-PLAT-OP-STATE)、[FIELD-PLAT-PAGING](../field-specs.md#FIELD-PLAT-PAGING)、[FIELD-PLAT-QUERY](../field-specs.md#FIELD-PLAT-QUERY)、[FIELD-PLAT-REQUEST](../field-specs.md#FIELD-PLAT-REQUEST)、[FIELD-PLAT-RESOURCE-SCOPE](../field-specs.md#FIELD-PLAT-RESOURCE-SCOPE)、[FIELD-PLAT-REVISION](../field-specs.md#FIELD-PLAT-REVISION)、[FIELD-PLAT-TASK-AGENT-TIMEOUT](../field-specs.md#FIELD-PLAT-TASK-AGENT-TIMEOUT)、[FIELD-PLAT-TASK-ANSWER-RATE](../field-specs.md#FIELD-PLAT-TASK-ANSWER-RATE)、[FIELD-PLAT-TASK-BUSINESS-TAGS](../field-specs.md#FIELD-PLAT-TASK-BUSINESS-TAGS)、[FIELD-PLAT-TASK-CALL-STRATEGY](../field-specs.md#FIELD-PLAT-TASK-CALL-STRATEGY)、[FIELD-PLAT-TASK-CALLER-NAV](../field-specs.md#FIELD-PLAT-TASK-CALLER-NAV)、[FIELD-PLAT-TASK-CALLER-POOLS](../field-specs.md#FIELD-PLAT-TASK-CALLER-POOLS)、[FIELD-PLAT-TASK-CALLPRIORITY](../field-specs.md#FIELD-PLAT-TASK-CALLPRIORITY)、[FIELD-PLAT-TASK-CALLROUTE](../field-specs.md#FIELD-PLAT-TASK-CALLROUTE)、[FIELD-PLAT-TASK-CNOS](../field-specs.md#FIELD-PLAT-TASK-CNOS)、[FIELD-PLAT-TASK-COMPLETE](../field-specs.md#FIELD-PLAT-TASK-COMPLETE)、[FIELD-PLAT-TASK-CONCURRENCY](../field-specs.md#FIELD-PLAT-TASK-CONCURRENCY)、[FIELD-PLAT-TASK-CONTACT-FLOW](../field-specs.md#FIELD-PLAT-TASK-CONTACT-FLOW)、[FIELD-PLAT-TASK-CUSTOMER-TIMEOUT](../field-specs.md#FIELD-PLAT-TASK-CUSTOMER-TIMEOUT)、[FIELD-PLAT-TASK-DESC](../field-specs.md#FIELD-PLAT-TASK-DESC)、[FIELD-PLAT-TASK-FAILURES](../field-specs.md#FIELD-PLAT-TASK-FAILURES)、[FIELD-PLAT-TASK-FORCEEND](../field-specs.md#FIELD-PLAT-TASK-FORCEEND)、[FIELD-PLAT-TASK-GROUP-TYPE](../field-specs.md#FIELD-PLAT-TASK-GROUP-TYPE)、[FIELD-PLAT-TASK-ID](../field-specs.md#FIELD-PLAT-TASK-ID)、[FIELD-PLAT-TASK-IVR-ID](../field-specs.md#FIELD-PLAT-TASK-IVR-ID)、[FIELD-PLAT-TASK-MAXWAIT](../field-specs.md#FIELD-PLAT-TASK-MAXWAIT)、[FIELD-PLAT-TASK-MIN-AGENTS](../field-specs.md#FIELD-PLAT-TASK-MIN-AGENTS)、[FIELD-PLAT-TASK-MODE](../field-specs.md#FIELD-PLAT-TASK-MODE)、[FIELD-PLAT-TASK-NAME](../field-specs.md#FIELD-PLAT-TASK-NAME)、[FIELD-PLAT-TASK-OUTBOUND-GROUP](../field-specs.md#FIELD-PLAT-TASK-OUTBOUND-GROUP)、[FIELD-PLAT-TASK-PREDICTADJUST](../field-specs.md#FIELD-PLAT-TASK-PREDICTADJUST)、[FIELD-PLAT-TASK-QUOTIETY](../field-specs.md#FIELD-PLAT-TASK-QUOTIETY)、[FIELD-PLAT-TASK-RESOURCES](../field-specs.md#FIELD-PLAT-TASK-RESOURCES)、[FIELD-PLAT-TASK-RETRY-POLICY](../field-specs.md#FIELD-PLAT-TASK-RETRY-POLICY)、[FIELD-PLAT-TASK-RETRYTODAY](../field-specs.md#FIELD-PLAT-TASK-RETRYTODAY)、[FIELD-PLAT-TASK-REWARM](../field-specs.md#FIELD-PLAT-TASK-REWARM)、[FIELD-PLAT-TASK-SCHEDULE](../field-specs.md#FIELD-PLAT-TASK-SCHEDULE)、[FIELD-PLAT-TASK-SCHEDULE-AT](../field-specs.md#FIELD-PLAT-TASK-SCHEDULE-AT)、[FIELD-PLAT-TASK-SCHEDULE-MODE](../field-specs.md#FIELD-PLAT-TASK-SCHEDULE-MODE)、[FIELD-PLAT-TASK-STATE](../field-specs.md#FIELD-PLAT-TASK-STATE)、[FIELD-PLAT-TASK-STOP-AT](../field-specs.md#FIELD-PLAT-TASK-STOP-AT)、[FIELD-PLAT-TASK-STOP-SCHEDULED](../field-specs.md#FIELD-PLAT-TASK-STOP-SCHEDULED)、[FIELD-PLAT-TASK-WARMUP](../field-specs.md#FIELD-PLAT-TASK-WARMUP)、[FIELD-PLAT-TASK-WRAP](../field-specs.md#FIELD-PLAT-TASK-WRAP)

## UI 依据

[全局 UI 规范](../ui-spec.md)

- [UI-PAGE-2205](../ui-pages/UI-PAGE-2205.md)
- [UI-PAGE-2206](../ui-pages/UI-PAGE-2206.md)

## 实现要求

- 查询及维护原任务、计划、唯一执行资源和名单导入，方式与资源用途不能混用。
- 供应商流程/本地映射、计划起止、主叫/号码池、任务内重呼等原参数按规格解释。
- 专业IVR保原能力，不新增为四节点CALL方式或要求新业务选择任务/队列。
- 预外呼/IVR页面保原列表/查询/重置/空态，不增加今日任务名单分布；不删除独立专业报表能力。
- 按所引LOCAL逐动作落实触发/前后置/分支；业务定义只读同源规格，不另抄一套规则。
- 依赖表示实施契约/共享守卫先就绪，不新增用户操作门槛；跨任务端到端由验收批次合并检查。
- 目标库、模块/服务/表/接口、精确可写文件及命令由开发在开工前绑定；当前空文件清单不授代码写入权。

## 产品验收

- **AC-2068**：保留预外呼任务创建/修改/名单导入/资源/执行控制/正常重呼/异常补提交/结果与失败下载。客户明细导出在当前taskId任务详情，不改成导入批次导出；失败分类、次数、额度按预外呼原策略，未知先核对。
  依据：docs/functional-spec.json#AC-2068

- **AC-2069**：每次首次/重呼/异常补交均检查当前公共禁呼；仍保供应商明确失败分类及额度，不把预外呼策略套人工或IVR，未知旧请求不得当明确失败补交。
  依据：docs/functional-spec.json#AC-2069

- **AC-2070**：保留IVR专业任务、真实供应商可执行外呼语音流程、名单导入、原允许执行/暂停/继续/结束及结果；未提交/未启动删除按原条件，已执行记录保留，不与人工/预外呼混用。
  依据：docs/functional-spec.json#AC-2070

- **AC-2071**：所有专业资源按准确租户+供应商+enterprise+nativeId及用途判定；资源独立平台授权不是新角色或业务数据共享。IVR必须真实外呼可执行流程，本地/呼入流程ID不可替代。
  依据：docs/functional-spec.json#AC-2071

- **AC-2148**：预外呼及IVR页不额外显示“今日任务名单分布”，保原任务查询/筛选/空态/重置和专业报表口径；不因此删除底层任务状态或统计能力。
  依据：docs/functional-spec.json#AC-2148

## 测试要求（尚未执行）

### CHECK-PLAT-CLOUD-TASK-QUERY / manual

步骤：按当前续接版本执行：预外呼或IVR任务页查询/查看。前提：相应方式原任务读权。操作：按mode分别读取准确任务，不混淆IVR与预外呼资源/状态；任务详情显示已受理与远端终态、名单及失败分类；列表更新时间倒序后分页，任务ID及当前scope进入详情复核。分别构造：前提、字段及对象修订校验通过且结果明确成功；无权/字段不合法/对象失效/修订冲突；提交失败或结果未知。

预期：准确原专业任务可查；查看不授控制、导入或导出；准确原专业任务可查；查看不授控制、导入或导出；明确显示本次拒绝原因，保留可继续的输入和已确认原值，不作变更；失败保留原确认值；未知显示待核并按同请求核对，不重复提交或假报成功。

覆盖：AC-2068, AC-2069, AC-2070, AC-2071, AC-2148

### CHECK-PLAT-CLOUD-TASK-SAVE / manual

步骤：在准确有权范围触发“创建或修改预外呼／IVR任务”；分别执行正常输入、明确无权/失效/冲突、失败及未知结果分支；按所列字段边界复查保存与显示。

预期：合法专业任务配置保存，未因创建直接宣称已执行；无权及非法输入不得写入；失败与未知分别显示且不扩范围、不重复产生副作用。

覆盖：AC-2068, AC-2069, AC-2070, AC-2071

### CHECK-PLAT-CLOUD-TASK-IMPORT / manual

步骤：在准确有权范围触发“向预外呼／IVR任务导入名单”；分别执行正常输入、明确无权/失效/冲突、失败及未知结果分支；按所列字段边界复查保存与显示。

预期：准确任务合法名单导入；异常行有定位和可恢复结果；无权及非法输入不得写入；失败与未知分别显示且不扩范围、不重复产生副作用。

覆盖：AC-2068, AC-2070, AC-2071

## 完成条件

- 查询及维护原任务、计划、唯一执行资源和名单导入，方式与资源用途不能混用。
- 供应商流程/本地映射、计划起止、主叫/号码池、任务内重呼等原参数按规格解释。
- 本任务全部同ID验收检查有当前实现、正常/拒绝/失败/未知证据，关联页面五态及字段权限符合原规格。
- 开发完成目标库/精确文件/模块/数据接口/测试执行绑定，必要共享文件先后依赖已补齐，工程问题有可靠结论。
- 产品变动回产品规格重审；不可用局部实现或Mock结论替代真实远端与正式开工许可。

需保留实际改动、测试结果和 Review 证据。仅修改完成不等于验收通过。


## 本轮工程绑定边界

本任务为可承接的业务实施分解，尚未绑定生产仓库/技术栈。开发确定真实文件后填写allowed_files、context_files、changes并复检共享文件依赖；不得把原型参考文件当作生产可写授权。

只读原型行为参考：

- [module-host.js](../../../prototype/js/components/module-host.js) · 只读行为参考，非生产可写目标
- [customer-import-enhancements.js](../../../prototype/js/adapters/customer-import-enhancements.js) · 只读行为参考，非生产可写目标

需开发处理的问题：EQ-PLAT-PROFESSIONAL, EQ-PLAT-ACCEPTED-CALL。

原专业操作：

- [predictive-create](../原专业操作任务映射.md#predictive-create)
- [predictive-edit](../原专业操作任务映射.md#predictive-edit)
- [predictive-import](../原专业操作任务映射.md#predictive-import)
- [predictive-query](../原专业操作任务映射.md#predictive-query)
- [predictive-detail](../原专业操作任务映射.md#predictive-detail)
- [ivr-create](../原专业操作任务映射.md#ivr-create)
- [ivr-edit](../原专业操作任务映射.md#ivr-edit)
- [ivr-import](../原专业操作任务映射.md#ivr-import)
- [ivr-query](../原专业操作任务映射.md#ivr-query)
- [ivr-detail](../原专业操作任务映射.md#ivr-detail)
