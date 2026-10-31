# TASK-034 原AI任务及名单导入维护

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md)

- [进入有权工作位置与保留专业能力 · FUNC\-2002](../features/FUNC-2002.md)

## 目标

保准确AI任务查询、名单导入/移除、批次历史及具体场景模板下载。；当前确未实现的专业控制/导出不假报成功，专业名单不伪造四节点run。

## 产品依据

- FUNC-2002 进入有权工作位置与保留专业能力：当前五顶栏只负责功能归位。按稳定页面/动作身份保留AI与Cloud现行专业操作、状态、资源、报表和业务接口，分别校验模块、成员、对象、读写/导出权。；来源 documentation/input/functions.json#FUNC-2002

来源根：`/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/开发交付包/工作资料/续接输入`；来源指纹：`0904ba9de2798ea9878d0602f5fbc337ae523a60911c1b10dac967c13febffbe`

## 前置任务

- TASK-032
- TASK-039

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

局部逻辑：[LOCAL-PLAT-AI-TASK-QUERY](../local-logic/LOCAL-PLAT-AI-TASK-QUERY.md)、[LOCAL-PLAT-AI-LIST-IMPORT](../local-logic/LOCAL-PLAT-AI-LIST-IMPORT.md)、[LOCAL-PLAT-AI-LIST-REMOVE](../local-logic/LOCAL-PLAT-AI-LIST-REMOVE.md)、[LOCAL-PLAT-AI-IMPORT-HISTORY](../local-logic/LOCAL-PLAT-AI-IMPORT-HISTORY.md)、[LOCAL-PLAT-AI-IMPORT-TEMPLATE](../local-logic/LOCAL-PLAT-AI-IMPORT-TEMPLATE.md)

字段：[FIELD-PLAT-AI-SCENE-ID](../field-specs.md#FIELD-PLAT-AI-SCENE-ID)、[FIELD-PLAT-AI-TENANT](../field-specs.md#FIELD-PLAT-AI-TENANT)、[FIELD-PLAT-AUDIT](../field-specs.md#FIELD-PLAT-AUDIT)、[FIELD-PLAT-CUSTOMER-ID](../field-specs.md#FIELD-PLAT-CUSTOMER-ID)、[FIELD-PLAT-IMPORT-BATCH](../field-specs.md#FIELD-PLAT-IMPORT-BATCH)、[FIELD-PLAT-IMPORT-ROWS](../field-specs.md#FIELD-PLAT-IMPORT-ROWS)、[FIELD-PLAT-OP-STATE](../field-specs.md#FIELD-PLAT-OP-STATE)、[FIELD-PLAT-PAGING](../field-specs.md#FIELD-PLAT-PAGING)、[FIELD-PLAT-PRO-FIELD-DEF](../field-specs.md#FIELD-PLAT-PRO-FIELD-DEF)、[FIELD-PLAT-QUERY](../field-specs.md#FIELD-PLAT-QUERY)、[FIELD-PLAT-REPORT-EXPORT](../field-specs.md#FIELD-PLAT-REPORT-EXPORT)、[FIELD-PLAT-REQUEST](../field-specs.md#FIELD-PLAT-REQUEST)、[FIELD-PLAT-REVISION](../field-specs.md#FIELD-PLAT-REVISION)、[FIELD-PLAT-TASK-ID](../field-specs.md#FIELD-PLAT-TASK-ID)、[FIELD-PLAT-TASK-NAME](../field-specs.md#FIELD-PLAT-TASK-NAME)、[FIELD-PLAT-TASK-RESOURCES](../field-specs.md#FIELD-PLAT-TASK-RESOURCES)、[FIELD-PLAT-TASK-STATE](../field-specs.md#FIELD-PLAT-TASK-STATE)

## UI 依据

[全局 UI 规范](../ui-spec.md)

- [UI-PAGE-2103](../ui-pages/UI-PAGE-2103.md)

## 实现要求

- 保准确AI任务查询、名单导入/移除、批次历史及具体场景模板下载。
- 当前确未实现的专业控制/导出不假报成功，专业名单不伪造四节点run。
- 专业导入与新业务严格导入各有实体身份；受理不宣称远端已完成。
- 按所引LOCAL逐动作落实触发/前后置/分支；业务定义只读同源规格，不另抄一套规则。
- 依赖表示实施契约/共享守卫先就绪，不新增用户操作门槛；跨任务端到端由验收批次合并检查。
- 目标库、模块/服务/表/接口、精确可写文件及命令由开发在开工前绑定；当前空文件清单不授代码写入权。

## 产品验收

- **AC-2063**：保留已确认的222项AI/Cloud原专业能力，按稳定operation_key、PAGE、ACTION逐项关联当前触发/输入/权限/状态/终态；原仅有界面但未实现或缺证控制不自动升级，Mock交互不证明真实生产可用。
  依据：docs/functional-spec.json#AC-2063

- **AC-2064**：AI任务、通话/计费/线索统计、通话/线索记录、场景、标签及服务能力保留；原首页摘要/使用归AI用量与服务。AI场景使用与标签配置权分离；标签按准确supplier/tenant/type/tagScene/category/brand/revision执行段快照校验。原始与映射结果保留，未匹配不回退首项。准确映射标签可作人工确认路径条件，不直接写业务字段，不因AI回执自动推进。
  依据：docs/functional-spec.json#AC-2064

## 测试要求（尚未执行）

### CHECK-PLAT-AI-TASK-QUERY / manual

步骤：在准确有权范围触发“查询AI任务及任务名单”；分别执行正常输入、明确无权/失效/冲突、失败及未知结果分支；按所列字段边界复查保存与显示。

预期：当前AI专业任务/名单可读；不重建专业任务或宣称未实现控制已受理；无权及非法输入不得写入；失败与未知分别显示且不扩范围、不重复产生副作用。

覆盖：AC-2063, AC-2064

### CHECK-PLAT-AI-LIST-IMPORT / manual

步骤：在准确有权范围触发“向准确AI任务导入联系人”；分别执行正常输入、明确无权/失效/冲突、失败及未知结果分支；按所列字段边界复查保存与显示。；以仅授权AI的总部/门店管理员及运营冷启动后直接导入完整号码，测试共享模型等待、公共限制、活动占用和联系频控；在等待时撤权/换账号租户/修改AI修订/关闭换文件，及损坏/缺失已初始化台账、读取失败后同文件重试。

预期：准确任务联系人及导入批次形成，冲突/失败行不虚报成功；无权及非法输入不得写入；失败与未知分别显示且不扩范围、不重复产生副作用。；正常AI-only导入成功且未获Cloud权限；所有限制仍拒绝，未知不放行、不清台账，过期异步结果不写入；可可靠重试，失败保原文件。

覆盖：AC-2063, AC-2064

### CHECK-PLAT-AI-LIST-REMOVE / manual

步骤：在准确有权范围触发“移除准确AI任务待处理联系人”；分别执行正常输入、明确无权/失效/冲突、失败及未知结果分支；按所列字段边界复查保存与显示。

预期：允许的任务名单项移除；已产生通话/业务事实保留；无权及非法输入不得写入；失败与未知分别显示且不扩范围、不重复产生副作用。

覆盖：AC-2063, AC-2064

### CHECK-PLAT-AI-IMPORT-HISTORY / manual

步骤：在准确有权范围触发“查询AI导入记录”；分别执行正常输入、明确无权/失效/冲突、失败及未知结果分支；按所列字段边界复查保存与显示。

预期：仅显示该任务授权导入历史，不连带文件下载或任务控制权；无权及非法输入不得写入；失败与未知分别显示且不扩范围、不重复产生副作用。

覆盖：AC-2063, AC-2064

### CHECK-PLAT-AI-IMPORT-TEMPLATE / manual

步骤：在准确有权范围触发“下载具体AI任务导入模板”；分别执行正常输入、明确无权/失效/冲突、失败及未知结果分支；按所列字段边界复查保存与显示。

预期：该具体场景导入模板可下载，不把其他AI导出仅有界面但未实现当可用；无权及非法输入不得写入；失败与未知分别显示且不扩范围、不重复产生副作用。

覆盖：AC-2063, AC-2064

## 完成条件

- 保准确AI任务查询、名单导入/移除、批次历史及具体场景模板下载。
- 当前确未实现的专业控制/导出不假报成功，专业名单不伪造四节点run。
- 本任务全部同ID验收检查有当前实现、正常/拒绝/失败/未知证据，关联页面五态及字段权限符合原规格。
- 开发完成目标库/精确文件/模块/数据接口/测试执行绑定，必要共享文件先后依赖已补齐，工程问题有可靠结论。
- 产品变动回产品规格重审；不可用局部实现或Mock结论替代真实远端与正式开工许可。

需保留实际改动、测试结果和 Review 证据。仅修改完成不等于验收通过。


## 本轮工程绑定边界

本任务为可承接的业务实施分解，尚未绑定生产仓库/技术栈。开发确定真实文件后填写allowed_files、context_files、changes并复检共享文件依赖；不得把原型参考文件当作生产可写授权。

只读原型行为参考：

- [module-host.js](../../../prototype/js/components/module-host.js) · 只读行为参考，非生产可写目标
- [ai_import_parse_build.py](../../../prototype/scripts/ai_import_parse_build.py) · 只读行为参考，非生产可写目标

需开发处理的问题：EQ-PLAT-PROFESSIONAL, EQ-PLAT-ACCEPTED-CALL。

原专业操作：

- [ai-query-tasks](../原专业操作任务映射.md#ai-query-tasks)
- [ai-view-task](../原专业操作任务映射.md#ai-view-task)
- [ai-query-call-list](../原专业操作任务映射.md#ai-query-call-list)
- [ai-import-task-contacts](../原专业操作任务映射.md#ai-import-task-contacts)
- [ai-query-import-records](../原专业操作任务映射.md#ai-query-import-records)
- [ai-remove-assigned-contact](../原专业操作任务映射.md#ai-remove-assigned-contact)
- [retained-source-ai-download-import-template](../原专业操作任务映射.md#retained-source-ai-download-import-template)
