# TASK-028 原直接业务显式启用当前流程

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md)

- [创建四节点流转模板 · FUNC\-2034](../features/FUNC-2034.md)
- [按实际分类严格预检并导入业务 · FUNC\-2036](../features/FUNC-2036.md)
- [查询业务、批次和工作队列 · FUNC\-2039](../features/FUNC-2039.md)

## 目标

在同record上重新预检当前路由、实际入口、资料及AI场景；旧执行、重试、待核及必要归档必须收敛。；成功才建新run并封直接转换事件；不强制先完成直接周期，已完成周期结论保留。

## 产品依据

- FUNC-2034 创建四节点流转模板：以字段参考分类读取条件来源，在唯一开始锚点编排转交、呼叫、结束，组件定类型、每CALL单方式、有序首命中路径，保存模板不绑定业务。；来源 documentation/input/functions.json#FUNC-2034
- FUNC-2036 按实际分类严格预检并导入业务：整批明确DIRECT或TEMPLATE后严格预检及导入：DIRECT须分类显式允许、方式明确且AI场景必选，仅豁免路由附加资料，不建run/node；TEMPLATE沿当前路由建run。已有直接业务后续显式启用流程，在旧执行与必要归档收敛且当前路由资料通过后于原业务建新run，不重复导入。；来源 documentation/input/functions.json#FUNC-2036
- FUNC-2039 查询业务、批次和工作队列：查询模式、批次、队列和下一步；DIRECT显示同租户待安排/起呼/结果/本人填写/待核及再次跟进，允许有权人经独立预检显式启用流程。；来源 documentation/input/functions.json#FUNC-2039

来源根：`/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/开发交付包/工作资料/续接输入`；来源指纹：`0904ba9de2798ea9878d0602f5fbc337ae523a60911c1b10dac967c13febffbe`

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

全局规则：[GR-AUTH](../global-logic.md#GR-AUTH)、[GR-CONFIG](../global-logic.md#GR-CONFIG)、[GR-DATA-FACTS](../global-logic.md#GR-DATA-FACTS)、[GR-FIELDS](../global-logic.md#GR-FIELDS)、[GR-HANDLING-MODE](../global-logic.md#GR-HANDLING-MODE)、[GR-SCOPE](../global-logic.md#GR-SCOPE)、[GR-SERIAL](../global-logic.md#GR-SERIAL)、[GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)

局部逻辑：[LOCAL-FLOW-ENABLE-TEMPLATE](../local-logic/LOCAL-FLOW-ENABLE-TEMPLATE.md)

字段：[FIELD-FLOW-ARCHIVE-STATE](../field-specs.md#FIELD-FLOW-ARCHIVE-STATE)、[FIELD-FLOW-ARRANGEMENT](../field-specs.md#FIELD-FLOW-ARRANGEMENT)、[FIELD-FLOW-CATEGORY-ID](../field-specs.md#FIELD-FLOW-CATEGORY-ID)、[FIELD-FLOW-DIRECT-CYCLE-ID](../field-specs.md#FIELD-FLOW-DIRECT-CYCLE-ID)、[FIELD-FLOW-DIRECT-CYCLES](../field-specs.md#FIELD-FLOW-DIRECT-CYCLES)、[FIELD-FLOW-DIRECT-STATUS](../field-specs.md#FIELD-FLOW-DIRECT-STATUS)、[FIELD-FLOW-EFFECTIVE-PLAN](../field-specs.md#FIELD-FLOW-EFFECTIVE-PLAN)、[FIELD-FLOW-ENABLE-FLOW-TOKEN](../field-specs.md#FIELD-FLOW-ENABLE-FLOW-TOKEN)、[FIELD-FLOW-END-FOLLOWUP-ORIGIN](../field-specs.md#FIELD-FLOW-END-FOLLOWUP-ORIGIN)、[FIELD-FLOW-ENTRY-DECISION](../field-specs.md#FIELD-FLOW-ENTRY-DECISION)、[FIELD-FLOW-EXECUTION-STATE](../field-specs.md#FIELD-FLOW-EXECUTION-STATE)、[FIELD-FLOW-HANDLING-MODE](../field-specs.md#FIELD-FLOW-HANDLING-MODE)、[FIELD-FLOW-IMPORT-VALUES](../field-specs.md#FIELD-FLOW-IMPORT-VALUES)、[FIELD-FLOW-NODE-RUN-ID](../field-specs.md#FIELD-FLOW-NODE-RUN-ID)、[FIELD-FLOW-OWNER-TENANT](../field-specs.md#FIELD-FLOW-OWNER-TENANT)、[FIELD-FLOW-RECORD-ID](../field-specs.md#FIELD-FLOW-RECORD-ID)、[FIELD-FLOW-RECORD-REVISION](../field-specs.md#FIELD-FLOW-RECORD-REVISION)、[FIELD-FLOW-REQUEST-ID](../field-specs.md#FIELD-FLOW-REQUEST-ID)、[FIELD-FLOW-ROUTE-MAIN](../field-specs.md#FIELD-FLOW-ROUTE-MAIN)、[FIELD-FLOW-RUN-ID](../field-specs.md#FIELD-FLOW-RUN-ID)

## UI 依据

[全局 UI 规范](../ui-spec.md)

- [UI-PAGE-2204](../ui-pages/UI-PAGE-2204.md)
- [UI-PAGE-2227](../ui-pages/UI-PAGE-2227.md)

## 实现要求

- 在同record上重新预检当前路由、实际入口、资料及AI场景；旧执行、重试、待核及必要归档必须收敛。
- 成功才建新run并封直接转换事件；不强制先完成直接周期，已完成周期结论保留。
- 并发schema变化按稳定字段保输入并重检；不复制业务、不让旧DIRECT事实完成新CALL或留下双执行入口。
- 按所引LOCAL逐动作落实触发/前后置/分支；业务定义只读同源规格，不另抄一套规则。
- 依赖表示实施契约/共享守卫先就绪，不新增用户操作门槛；跨任务端到端由验收批次合并检查。
- 目标库、模块/服务/表/接口、精确可写文件及命令由开发在开工前绑定；当前空文件清单不授代码写入权。

## 产品验收

- **AC-2112**：条件支持独立IMPORT，AI状态/标签与人工/预外呼状态/填写；转交精确上游来源，条件配置不授自动呼叫/推进权。 整批明确DIRECT/TEMPLATE；DIRECT仍严守基础必填、类型、映射和唯一性，仅豁免路由附加资料，且不建run/node。
  依据：docs/functional-spec.json#AC-2112

- **AC-2113**：组ALL/ANY明确且已知时计算，标量IN/NOT_IN每行多个值，EQ/NE/大小比较单值；多选及AI标签包含任一/全部，空值独立。 DIRECT显式选择AI/MANUAL/PREDICTIVE，AI场景必选；已有业务启用流程不重复导入。
  依据：docs/functional-spec.json#AC-2113

- **AC-2129**：超管在管理范围仅监管查询，列表/详情/直接访问一致，不代分配、起呼、填结果或转交。
  依据：docs/functional-spec.json#AC-2129

- **AC-2140**：对当前可可靠读取schema内、启用且支持条件的非必填IMPORT字段，新导入/新run准备时缺列规范化为null用于判断；必填缺失或schema读取失败仍拒绝，通话/填写未知及已捕获历史缺失不在读取时补空。
  依据：docs/functional-spec.json#AC-2140

## 测试要求（尚未执行）

### CHECK-FLOW-ENABLE-TEMPLATE / manual

步骤：按当前续接版本执行：当前有权管理员在DIRECT业务详情明确选择“启用流程”并预检确认。前提：当前负责租户管理员具有本条业务维护与流程启用动作资格；当前业务为DIRECT且同一稳定record、brand、category、owner及修订依据明确；全部旧直接执行、排队、重试和未知请求可靠收敛；实际办理人必要内容与归档均完成；当前实际分类存在明确生效的兼容路由；所有基础必填、类型/映射/唯一性及本次路由必要资料已按受控入口补齐；当前DIRECT周期可以ACTIVE或COMPLETED；不强制先“完成直接跟进”，只要求全部旧执行与必要归档可靠收敛。。操作：在准确原业务检查当前路由、首路径及必需资料；只按稳定字段身份复用当前值，缺资料经有权维护补齐后重新预检，不重复导入 输出enableFlowContext的逐项issues及validationToken；本租户首CALL为AI时显式重新选场景。；提交前重核全部旧执行及必要归档收敛、owner和当前配置；未满足或预览过期均不改模式、不建run validationToken必须绑定准确record/revision/directCycleId/owner、当前字段/值/plan及必要场景；任一变化即保输入重新检查。；同次记录启用事件、DIRECT→TEMPLATE、新run及当前完整方案，按当前负责方定位首节点并清旧人/场景安排；旧事实只归旧直接段 当前directStatus封FLOW_ENABLED；原ACTIVE周期转FLOW_ENABLED，原COMPLETED周期保完成历史结论。。分别构造：路由无效、必需资料不齐、旧执行未知/在途、必要本人归档未完成或并发冲突；明确成功；同次启用结果未知或重复确认。

预期：原业务与原批次保持；明确成功后模式变为TEMPLATE，创建新的run并封当前方案及首节点，清旧安排；不自动转交或起呼；全部旧DIRECT事实与快照保持原身份，不能完成新run的CURRENT_NODE/CURRENT_ROUND节点要求；显式HISTORY仍只按准确授权读取；启用流程不要求先完成直接周期；已完成周期结论保持，未完成但收敛周期按启用事件结束；新run与旧directCycle严格隔离。；保原业务DIRECT及全部输入，具体显示缺口与合法处理入口，不创建run或假归档。；原record同owner创建新run；后续按模板分配、转交及实际新呼叫规则办理，旧直接通话/标签/内容不能完成新节点。；按准确原请求核对或返回同次已创建run，不另建第二run、不重新导入业务。。

覆盖：AC-2112, AC-2113, AC-2129, AC-2140

## 完成条件

- 在同record上重新预检当前路由、实际入口、资料及AI场景；旧执行、重试、待核及必要归档必须收敛。
- 成功才建新run并封直接转换事件；不强制先完成直接周期，已完成周期结论保留。
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
