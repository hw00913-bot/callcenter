# TASK-028 旧无TASK直接业务的合法模板转换

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md)

- [创建四节点流转模板 · FUNC\-2034](../features/FUNC-2034.md)
- [按共同分类字段预检并导入统一业务 · FUNC\-2036](../features/FUNC-2036.md)
- [查询业务、批次和工作队列 · FUNC\-2039](../features/FUNC-2039.md)

## 目标

先核准确entrySource；新TASK DIRECT拒绝启用模板且不展示入口、不生成转换预检token，保持任务直接跟进。；仅旧无TASK标记的历史DIRECT沿原合法路由/资料/权限及执行/必要归档收敛条件显式转换，同record新run保旧周期快照及结论，不重导、不伪造TASK来源。

## 产品依据

- FUNC-2034 创建四节点流转模板：以字段参考分类读取条件来源，在唯一开始锚点编排转交、呼叫、结束；每CALL单方式、有序首命中路径。人工默认MANUAL可无seat先保存，SPECIFIC_SEAT才必选有效seat；PRED默认只任务，AI默认任务+scene，无默认责任人控件。CALL默认五档等级与分租户目标维护不扩大资源权，保存模板不绑定业务。；来源 documentation/input/functions.json#FUNC-2034
- FUNC-2036 按共同分类字段预检并导入统一业务：客户维护与AI/预外呼任务三入口共用分类IMPORT和code等系统必需校验。客户维护按原DIRECT/TEMPLATE；任务内固定准确任务/必要scene并默认DIRECT，须ADMIN+customer.import、原模块/任务/来源及分类允许，保存完整值/快照/taskImportSource/等级和直接周期。专业名单只读recordId投影，不写第二账本/原生行或重复提交供应商，旧历史不迁移。；来源 documentation/input/functions.json#FUNC-2036
- FUNC-2039 查询业务、批次和工作队列：查询模式、批次、队列和下一步；DIRECT显示同租户待安排/起呼/结果/本人填写/待核及再次跟进，允许有权人经独立预检显式启用流程。 列表和详情展示具体目标与五档等级；待执行视图按资源内等级与入队先后，普通历史列表仍更新时间倒序，长期等待可提示。；来源 documentation/input/functions.json#FUNC-2039

来源根：`/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/开发交付包/工作资料/续接输入`；来源指纹：`ac24ea3af455fa8052e0daeaa799eea0265f5d02f520b26bdd98ac1e620a1a6c`

## 前置任务

- TASK-012
- TASK-017
- TASK-021
- TASK-029

## 只读代码上下文

未指定既有代码文件；从工程规范和产品依据读取上下文。

## 允许修改的文件

- 未填写

代码库根：`None`。未列出的文件不属于本任务修改范围；扩大范围需回到计划。

## 变更安排

- 未填写

## 逻辑与字段依据

先读 [全局逻辑](../global-logic.md)，再读本任务关联的局部逻辑与字段定义。

全局规则：[GR-AUTH](../global-logic.md#GR-AUTH)、[GR-CONFIG](../global-logic.md#GR-CONFIG)、[GR-DATA-FACTS](../global-logic.md#GR-DATA-FACTS)、[GR-FIELDS](../global-logic.md#GR-FIELDS)、[GR-HANDLING-MODE](../global-logic.md#GR-HANDLING-MODE)、[GR-LIFECYCLE-SETTLEMENT](../global-logic.md#GR-LIFECYCLE-SETTLEMENT)、[GR-SCOPE](../global-logic.md#GR-SCOPE)、[GR-SERIAL](../global-logic.md#GR-SERIAL)、[GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)

局部逻辑：[LOCAL-FLOW-ENABLE-TEMPLATE](../local-logic/LOCAL-FLOW-ENABLE-TEMPLATE.md)

字段：[FIELD-FLOW-ARCHIVE-STATE](../field-specs.md#FIELD-FLOW-ARCHIVE-STATE)、[FIELD-FLOW-ARRANGEMENT](../field-specs.md#FIELD-FLOW-ARRANGEMENT)、[FIELD-FLOW-CATEGORY-ID](../field-specs.md#FIELD-FLOW-CATEGORY-ID)、[FIELD-FLOW-DIRECT-CYCLE-ID](../field-specs.md#FIELD-FLOW-DIRECT-CYCLE-ID)、[FIELD-FLOW-DIRECT-CYCLES](../field-specs.md#FIELD-FLOW-DIRECT-CYCLES)、[FIELD-FLOW-DIRECT-STATUS](../field-specs.md#FIELD-FLOW-DIRECT-STATUS)、[FIELD-FLOW-EFFECTIVE-PLAN](../field-specs.md#FIELD-FLOW-EFFECTIVE-PLAN)、[FIELD-FLOW-ENABLE-FLOW-TOKEN](../field-specs.md#FIELD-FLOW-ENABLE-FLOW-TOKEN)、[FIELD-FLOW-END-FOLLOWUP-ORIGIN](../field-specs.md#FIELD-FLOW-END-FOLLOWUP-ORIGIN)、[FIELD-FLOW-ENTRY-DECISION](../field-specs.md#FIELD-FLOW-ENTRY-DECISION)、[FIELD-FLOW-EXECUTION-STATE](../field-specs.md#FIELD-FLOW-EXECUTION-STATE)、[FIELD-FLOW-HANDLING-MODE](../field-specs.md#FIELD-FLOW-HANDLING-MODE)、[FIELD-FLOW-IMPORT-VALUES](../field-specs.md#FIELD-FLOW-IMPORT-VALUES)、[FIELD-FLOW-NODE-RUN-ID](../field-specs.md#FIELD-FLOW-NODE-RUN-ID)、[FIELD-FLOW-OWNER-TENANT](../field-specs.md#FIELD-FLOW-OWNER-TENANT)、[FIELD-FLOW-RECORD-ID](../field-specs.md#FIELD-FLOW-RECORD-ID)、[FIELD-FLOW-RECORD-REVISION](../field-specs.md#FIELD-FLOW-RECORD-REVISION)、[FIELD-FLOW-REQUEST-ID](../field-specs.md#FIELD-FLOW-REQUEST-ID)、[FIELD-FLOW-ROUTE-MAIN](../field-specs.md#FIELD-FLOW-ROUTE-MAIN)、[FIELD-FLOW-RUN-ID](../field-specs.md#FIELD-FLOW-RUN-ID)

## UI 依据

[全局 UI 规范](../ui-spec.md)

- [UI-PAGE-2204](../ui-pages/UI-PAGE-2204.md)
- [UI-PAGE-2227](../ui-pages/UI-PAGE-2227.md)

## 实现要求

- 先核准确entrySource；新TASK DIRECT拒绝启用模板且不展示入口、不生成转换预检token，保持任务直接跟进。
- 仅旧无TASK标记的历史DIRECT沿原合法路由/资料/权限及执行/必要归档收敛条件显式转换，同record新run保旧周期快照及结论，不重导、不伪造TASK来源。
- 旧历史转换不能变成新TASK业务模板入口；旧周期事实不完成新CALL，不迁移来源或留下双执行入口。
- 按所引LOCAL逐动作落实触发/前后置/分支；业务定义只读同源规格，不另抄一套规则。
- 依赖表示实施契约/共享守卫先就绪，不新增用户操作门槛；跨任务端到端由验收批次合并检查。
- 目标库、模块/服务/表/接口、精确可写文件及命令由开发在开工前绑定；当前空文件清单不授代码写入权。

## 产品验收

- **AC-2112**：条件支持独立IMPORT，AI状态/标签与人工/预外呼状态/填写；转交精确上游来源，条件配置不授自动呼叫/推进权。 按准确入口固定TASK/DIRECT或CATEGORY/TEMPLATE；DIRECT仍严守基础必填、类型、映射和唯一性，仅豁免路由附加资料，且不建run/node。
  依据：docs/functional-spec.json#AC-2112

- **AC-2113**：组ALL/ANY明确且已知时计算，标量IN/NOT_IN每行多个值，EQ/NE/大小比较单值；多选及AI标签包含任一/全部，空值独立。 TASK DIRECT由任务带入方式与必要场景，CATEGORY按首路径及分组确定方式/场景；仅旧无TASK来源历史的合法启用流程不重复导入。
  依据：docs/functional-spec.json#AC-2113

- **AC-2129**：超管在管理范围仅监管查询，列表/详情/直接访问一致，不代分配、起呼、填结果或转交。
  依据：docs/functional-spec.json#AC-2129

- **AC-2140**：对当前可可靠读取schema内、启用且支持条件的非必填IMPORT字段，新导入/新run准备时缺列规范化为null用于判断；必填缺失或schema读取失败仍拒绝，通话/填写未知及已捕获历史缺失不在读取时补空。
  依据：docs/functional-spec.json#AC-2140

## 测试要求（尚未执行）

### CHECK-FLOW-ENABLE-TEMPLATE / manual

步骤：对新TASK DIRECT与旧无TASK来源历史DIRECT分别打开办理；测试旧段未结清/未知和合法旧转换。

预期：当前新建/修改模板的END固定正常结束CLOSE，不提供是否直接跟进配置，当前新导入/路由/重开不得接纳旧DIRECT_FOLLOWUP配置；已运行历史按原捕获方案和原合法来源收尾，不改历史为CLOSE，不借旧END来源授权当前新周期。新TASK/DIRECT始终直接跟进，不显示启用流程；旧无TASK来源DIRECT仅保原合法转换能力。 未知导入先核对原请求；服务端产出的记录必须按原请求/准确任务/租户/渠道关联，读取故障不解除请求身份，不允许以新请求重试产生重复副作用。基础名称/编码/手机号/优先级按原类型和别名严格校验，旧已捕获请求只读重放不接受客户端伪报。

覆盖：AC-2112, AC-2113, AC-2129, AC-2140

## 完成条件

- 先核准确entrySource；新TASK DIRECT拒绝启用模板且不展示入口、不生成转换预检token，保持任务直接跟进。
- 仅旧无TASK标记的历史DIRECT沿原合法路由/资料/权限及执行/必要归档收敛条件显式转换，同record新run保旧周期快照及结论，不重导、不伪造TASK来源。
- 本任务全部同ID验收检查有当前实现、正常/拒绝/失败/未知证据，关联页面五态及字段权限符合原规格。
- 开发完成目标库/精确文件/模块/数据接口/测试执行绑定，必要共享文件先后依赖已补齐，工程问题有可靠结论。
- 产品变动回产品规格重审；不可用局部实现或Mock结论替代真实远端与正式开工许可。

需保留实际改动、测试结果和 Review 证据。仅修改完成不等于验收通过。


## 本轮工程绑定边界

本任务为可承接的业务实施分解，尚未绑定生产仓库/技术栈。开发确定真实文件后填写allowed_files、context_files、changes并复检共享文件依赖；不得把原型参考文件当作生产可写授权。

只读原型行为参考：

- [four-node-model.js](../../../prototype/scripts/four-node-model.js) · 只读行为参考，非生产可写目标
- [four-node-workspace.js](../../../prototype/js/adapters/four-node-workspace.js) · 只读行为参考，非生产可写目标

需开发处理的问题：ENG-FLOW-PERSISTENCE, ENG-FLOW-EXECUTION。
