# TASK-026 废弃运行、再次跟进与归属纠偏

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md)

- [明确发起当前呼叫及同组批呼叫 · FUNC\-2031](../features/FUNC-2031.md)
- [保存本轮跟进、准确通话事实并唯一归档 · FUNC\-2032](../features/FUNC-2032.md)
- [创建四节点流转模板 · FUNC\-2034](../features/FUNC-2034.md)
- [判断并确认本租户后继节点 · FUNC\-2038](../features/FUNC-2038.md)
- [在实际业务分类独立绑定单模板路由 · FUNC\-2040](../features/FUNC-2040.md)

## 目标

废弃先收敛执行/待核与必要归档；原终态留存。；结束或废弃完成后按当前负责方和当前有效分类流程显式新run，重核入口/人员/场景，纠偏带原因。

## 产品依据

- FUNC-2031 明确发起当前呼叫及同组批呼叫：明确发起同租户DIRECT或TEMPLATE当前CALL的AI/人工/预外呼；按准确模式身份核串行、本人/场景/资源和联系限制，同组AI/预外呼可逐条核验后批量发起。 已完成直接业务可显式选下一次方式建立独立直接周期，清旧责任安排后重新分配。；来源 documentation/input/functions.json#FUNC-2031
- FUNC-2032 保存本轮跟进、准确通话事实并唯一归档：DIRECT与TEMPLATE均按准确实际办理/接听人保存必要内容、真实通话及当时定义和值快照，重试可靠收敛后唯一归档；当前更正独立留痕，不借旧事实完成新节点。 直接周期完成须明确业务结论、全部执行与必要归档收敛，并有真实完成跟进或NO_CALL+原因；不能自动从归档完成。；来源 documentation/input/functions.json#FUNC-2032
- FUNC-2034 创建四节点流转模板：以字段参考分类读取条件来源，在唯一开始锚点编排转交、呼叫、结束，组件定类型、每CALL单方式、有序首命中路径，保存模板不绑定业务。；来源 documentation/input/functions.json#FUNC-2034
- FUNC-2038 判断并确认本租户后继节点：按准确条件确认后继，END执行无模板跟进/业务结束两动作；原run先结束，原业务与事实保留。；来源 documentation/input/functions.json#FUNC-2038
- FUNC-2040 在实际业务分类独立绑定单模板路由：分类路由是唯一实际应用绑定处；同品牌不同字段参考分类可复用，按实际所用字段、AI准确上下文及业务域校验，确认保存不覆盖BASE。；来源 documentation/input/functions.json#FUNC-2040

来源根：`/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/开发交付包/工作资料/续接输入`；来源指纹：`0904ba9de2798ea9878d0602f5fbc337ae523a60911c1b10dac967c13febffbe`

## 前置任务

- TASK-024
- TASK-025
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

全局规则：[GR-AUTH](../global-logic.md#GR-AUTH)、[GR-CONFIG](../global-logic.md#GR-CONFIG)、[GR-DATA-FACTS](../global-logic.md#GR-DATA-FACTS)、[GR-HANDLING-MODE](../global-logic.md#GR-HANDLING-MODE)、[GR-SCOPE](../global-logic.md#GR-SCOPE)、[GR-SERIAL](../global-logic.md#GR-SERIAL)、[GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)

局部逻辑：[LOCAL-FLOW-ABANDON](../local-logic/LOCAL-FLOW-ABANDON.md)、[LOCAL-FLOW-REOPEN](../local-logic/LOCAL-FLOW-REOPEN.md)

字段：[FIELD-FLOW-ARCHIVE-STATE](../field-specs.md#FIELD-FLOW-ARCHIVE-STATE)、[FIELD-FLOW-ARRANGEMENT](../field-specs.md#FIELD-FLOW-ARRANGEMENT)、[FIELD-FLOW-CATEGORY-ID](../field-specs.md#FIELD-FLOW-CATEGORY-ID)、[FIELD-FLOW-CONTENT-SNAPSHOT](../field-specs.md#FIELD-FLOW-CONTENT-SNAPSHOT)、[FIELD-FLOW-EFFECTIVE-PLAN](../field-specs.md#FIELD-FLOW-EFFECTIVE-PLAN)、[FIELD-FLOW-ENTRY-DECISION](../field-specs.md#FIELD-FLOW-ENTRY-DECISION)、[FIELD-FLOW-EXECUTION-STATE](../field-specs.md#FIELD-FLOW-EXECUTION-STATE)、[FIELD-FLOW-HANDLING-MODE](../field-specs.md#FIELD-FLOW-HANDLING-MODE)、[FIELD-FLOW-IMPORT-VALUES](../field-specs.md#FIELD-FLOW-IMPORT-VALUES)、[FIELD-FLOW-OWNER-TENANT](../field-specs.md#FIELD-FLOW-OWNER-TENANT)、[FIELD-FLOW-REASON](../field-specs.md#FIELD-FLOW-REASON)、[FIELD-FLOW-RECORD-ID](../field-specs.md#FIELD-FLOW-RECORD-ID)、[FIELD-FLOW-REQUEST-STATUS](../field-specs.md#FIELD-FLOW-REQUEST-STATUS)、[FIELD-FLOW-ROUTE-MAIN](../field-specs.md#FIELD-FLOW-ROUTE-MAIN)、[FIELD-FLOW-RUN-ID](../field-specs.md#FIELD-FLOW-RUN-ID)、[FIELD-FLOW-RUN-PURPOSE](../field-specs.md#FIELD-FLOW-RUN-PURPOSE)、[FIELD-FLOW-RUN-STATUS](../field-specs.md#FIELD-FLOW-RUN-STATUS)

## UI 依据

[全局 UI 规范](../ui-spec.md)

- [UI-PAGE-2227](../ui-pages/UI-PAGE-2227.md)

## 实现要求

- 废弃先收敛执行/待核与必要归档；原终态留存。
- 结束或废弃完成后按当前负责方和当前有效分类流程显式新run，重核入口/人员/场景，纠偏带原因。
- 不回到初始导入租户，不复活旧回执；重复导入不能代替重开。
- 按所引LOCAL逐动作落实触发/前后置/分支；业务定义只读同源规格，不另抄一套规则。
- 依赖表示实施契约/共享守卫先就绪，不新增用户操作门槛；跨任务端到端由验收批次合并检查。
- 目标库、模块/服务/表/接口、精确可写文件及命令由开发在开工前绑定；当前空文件清单不授代码写入权。

## 产品验收

- **AC-2108**：新运行使用当前明确确认的分类/模板；已定位首业务节点的run保持原方案，只可完成或废弃后新run，不运行中换绑。
  依据：docs/functional-spec.json#AC-2108

- **AC-2110**：新run捕获完整有效plan并按实际分类记录，模板后续编辑/删除不追改已开run；导入成功定位即已开始。
  依据：docs/functional-spec.json#AC-2110

- **AC-2122**：受理、真实拨打、执行终态、内容保存、唯一归档、节点、owner及业务结论分别确认；未知核原请求而非新身份重发。
  依据：docs/functional-spec.json#AC-2122

- **AC-2140**：对当前可可靠读取schema内、启用且支持条件的非必填IMPORT字段，新导入/新run准备时缺列规范化为null用于判断；必填缺失或schema读取失败仍拒绝，通话/填写未知及已捕获历史缺失不在读取时补空。
  依据：docs/functional-spec.json#AC-2140

## 测试要求（尚未执行）

### CHECK-FLOW-ABANDON / manual

步骤：本动作适用模式以当前前置条件为准；原模板例仅用于TEMPLATE。当前管理员确认废弃并写原因。对准确业务有当前本租户办理权；确认业务/run/node/owner及并发依据仍一致；有废弃资格且run ACTIVE或ABANDONING。依次执行：登记本次废弃意图及原因，保实际已发生事实；核所有执行/重试及同业务unknown已收敛，才能标废弃完成。分别构造：仍在途/排队/重试/unknown；已准确终止并核结果

预期：ABANDONING，不能另起或宣称完成；ABANDONED，保旧plan/内容/通话；可经受控新run入口；不把废弃当业务达成或删除真实通话

覆盖：AC-2122, AC-2110

### CHECK-FLOW-REOPEN / manual

步骤：按当前续接版本执行：原流程完成或废弃完成后管理员开始再次办理。前提：handlingMode=TEMPLATE且准确当前run/node可核；对准确业务有当前本租户办理权；确认业务/run/node/owner及并发依据仍一致；原run ENDED/ABANDONED且无未核执行；实际分类当前路由及模板保存均明确确认可用。操作：再次跟进或带原因纠偏，从实际当前owner/目的重核入口和首呼合法性；读取实际分类最新字段/确认模板，建新run并清旧安排，保旧run/seg。分别构造：路由或模板结果待核、无合法入口、仍在执行；明确创建；当前业务为DIRECT。

预期：纠偏不直接改owner或门店互转，不在原流程插节点；拒新run且原业务不变；同record/owner新run，重核分配/场景；CURRENT_NODE/CURRENT_ROUND不借旧run结果，显式HISTORY仅沿其准确本租户历史资格；拒绝模板判断、推进、转交、废弃运行或模板重开；同租户再次直接跟进沿直接起呼入口，后续流程走独立“启用流程”预检。。

覆盖：AC-2108, AC-2110, AC-2122, AC-2140

## 完成条件

- 废弃先收敛执行/待核与必要归档；原终态留存。
- 结束或废弃完成后按当前负责方和当前有效分类流程显式新run，重核入口/人员/场景，纠偏带原因。
- 本任务全部同ID验收检查有当前实现、正常/拒绝/失败/未知证据，关联页面五态及字段权限符合原规格。
- 开发完成目标库/精确文件/模块/数据接口/测试执行绑定，必要共享文件先后依赖已补齐，工程问题有可靠结论。
- 产品变动回产品规格重审；不可用局部实现或Mock结论替代真实远端与正式开工许可。

需保留实际改动、测试结果和 Review 证据。仅修改完成不等于验收通过。


## 本轮工程绑定边界

本任务为可承接的业务实施分解，尚未绑定生产仓库/技术栈。开发确定真实文件后填写allowed_files、context_files、changes并复检共享文件依赖；不得把原型参考文件当作生产可写授权。

只读原型行为参考：

- [four-node-model.js](../../../prototype/scripts/four-node-model.js) · 只读行为参考，非生产可写目标
- [four-node-workspace.js](../../../prototype/js/adapters/four-node-workspace.js) · 只读行为参考，非生产可写目标

需开发处理的问题：ENG-FLOW-PERSISTENCE, EQ-PLAT-ACCEPTED-CALL。
