# TASK-018 明确单条及同组批量起呼

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md)

- [明确发起当前呼叫及同组批呼叫 · FUNC\-2031](../features/FUNC-2031.md)

## 目标

起呼时重核准确业务、负责方、周期/节点、前段归档、本人能力、资源/场景与联系限制。；每条新跟进捕获最新实际分类及有效值，批量AI/预外呼逐条反馈；受理不冒充真实拨打。

## 产品依据

- FUNC-2031 明确发起当前呼叫及同组批呼叫：明确发起同租户DIRECT或TEMPLATE当前CALL的AI/人工/预外呼；按准确模式身份核串行、本人/场景/资源和联系限制，同组AI/预外呼可逐条核验后批量发起。 已完成直接业务可显式选下一次方式建立独立直接周期，清旧责任安排后重新分配。；来源 documentation/input/functions.json#FUNC-2031

来源根：`/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/开发交付包/工作资料/续接输入`；来源指纹：`0904ba9de2798ea9878d0602f5fbc337ae523a60911c1b10dac967c13febffbe`

## 前置任务

- TASK-016
- TASK-031
- TASK-039
- TASK-042

## 只读代码上下文

未指定既有代码文件；从工程规范和产品依据读取上下文。

## 允许修改的文件

- 未填写

代码库根：`None`。未列出的文件不属于本任务修改范围；扩大范围需回到计划。

## 变更安排

- 未填写

## 逻辑与字段依据

先读 [全局逻辑](../global-logic.md)，再读本任务关联的局部逻辑与字段定义。

全局规则：[GR-AUTH](../global-logic.md#GR-AUTH)、[GR-CONTACT](../global-logic.md#GR-CONTACT)、[GR-DATA-FACTS](../global-logic.md#GR-DATA-FACTS)、[GR-HANDLING-MODE](../global-logic.md#GR-HANDLING-MODE)、[GR-SCOPE](../global-logic.md#GR-SCOPE)、[GR-SERIAL](../global-logic.md#GR-SERIAL)、[GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)

局部逻辑：[LOCAL-FLOW-START](../local-logic/LOCAL-FLOW-START.md)、[LOCAL-FLOW-START-BATCH](../local-logic/LOCAL-FLOW-START-BATCH.md)

字段：[FIELD-FLOW-ACTOR](../field-specs.md#FIELD-FLOW-ACTOR)、[FIELD-FLOW-ACTUAL-HANDLER](../field-specs.md#FIELD-FLOW-ACTUAL-HANDLER)、[FIELD-FLOW-AI-SCENE](../field-specs.md#FIELD-FLOW-AI-SCENE)、[FIELD-FLOW-ALLOW-DIRECT-FOLLOWUP](../field-specs.md#FIELD-FLOW-ALLOW-DIRECT-FOLLOWUP)、[FIELD-FLOW-ARRANGEMENT](../field-specs.md#FIELD-FLOW-ARRANGEMENT)、[FIELD-FLOW-BASIS](../field-specs.md#FIELD-FLOW-BASIS)、[FIELD-FLOW-CALLS](../field-specs.md#FIELD-FLOW-CALLS)、[FIELD-FLOW-CATEGORY-ID](../field-specs.md#FIELD-FLOW-CATEGORY-ID)、[FIELD-FLOW-CATEGORY-PRIORITY](../field-specs.md#FIELD-FLOW-CATEGORY-PRIORITY)、[FIELD-FLOW-CONTACT-POLICY](../field-specs.md#FIELD-FLOW-CONTACT-POLICY)、[FIELD-FLOW-DIRECT-CYCLE-ID](../field-specs.md#FIELD-FLOW-DIRECT-CYCLE-ID)、[FIELD-FLOW-DIRECT-METHOD](../field-specs.md#FIELD-FLOW-DIRECT-METHOD)、[FIELD-FLOW-DIRECT-STATUS](../field-specs.md#FIELD-FLOW-DIRECT-STATUS)、[FIELD-FLOW-END-FOLLOWUP-ORIGIN](../field-specs.md#FIELD-FLOW-END-FOLLOWUP-ORIGIN)、[FIELD-FLOW-EXECUTION-STATE](../field-specs.md#FIELD-FLOW-EXECUTION-STATE)、[FIELD-FLOW-FOLLOWER](../field-specs.md#FIELD-FLOW-FOLLOWER)、[FIELD-FLOW-FOLLOWUP-ID](../field-specs.md#FIELD-FLOW-FOLLOWUP-ID)、[FIELD-FLOW-FOLLOWUP-VALUES](../field-specs.md#FIELD-FLOW-FOLLOWUP-VALUES)、[FIELD-FLOW-HANDLING-MODE](../field-specs.md#FIELD-FLOW-HANDLING-MODE)、[FIELD-FLOW-IMPORT-VALUES](../field-specs.md#FIELD-FLOW-IMPORT-VALUES)、[FIELD-FLOW-METHOD](../field-specs.md#FIELD-FLOW-METHOD)、[FIELD-FLOW-PHONE](../field-specs.md#FIELD-FLOW-PHONE)、[FIELD-FLOW-RECORD-ID](../field-specs.md#FIELD-FLOW-RECORD-ID)、[FIELD-FLOW-RECORD-REVISION](../field-specs.md#FIELD-FLOW-RECORD-REVISION)、[FIELD-FLOW-REQUEST-ID](../field-specs.md#FIELD-FLOW-REQUEST-ID)、[FIELD-FLOW-REQUEST-STATUS](../field-specs.md#FIELD-FLOW-REQUEST-STATUS)、[FIELD-FLOW-RESOURCE-SNAPSHOT](../field-specs.md#FIELD-FLOW-RESOURCE-SNAPSHOT)、[FIELD-FLOW-SCENE-SNAPSHOT](../field-specs.md#FIELD-FLOW-SCENE-SNAPSHOT)、[FIELD-FLOW-VALUE-SOURCES](../field-specs.md#FIELD-FLOW-VALUE-SOURCES)

## UI 依据

[全局 UI 规范](../ui-spec.md)

- [UI-PAGE-2204](../ui-pages/UI-PAGE-2204.md)
- [UI-PAGE-2227](../ui-pages/UI-PAGE-2227.md)

## 实现要求

- 起呼时重核准确业务、负责方、周期/节点、前段归档、本人能力、资源/场景与联系限制。
- 每条新跟进捕获最新实际分类及有效值，批量AI/预外呼逐条反馈；受理不冒充真实拨打。
- 同业务/同号在途、排队、重试或未知未收敛不得再次发起；不借新周期豁免。
- 按所引LOCAL逐动作落实触发/前后置/分支；业务定义只读同源规格，不另抄一套规则。
- 依赖表示实施契约/共享守卫先就绪，不新增用户操作门槛；跨任务端到端由验收批次合并检查。
- 目标库、模块/服务/表/接口、精确可写文件及命令由开发在开工前绑定；当前空文件清单不授代码写入权。

## 产品验收

- **AC-2090**：总部CALL节点可配置一种AI/预外呼/人工；本次方式由捕获节点确定，人员明确启动，非导入/分配再选。
  依据：docs/functional-spec.json#AC-2090

- **AC-2091**：门店CALL方式同样由节点确定为单一AI/预外呼/人工，使用目标本租户有效场景/方案和真实身份。
  依据：docs/functional-spec.json#AC-2091

- **AC-2120**：开始/转交/呼叫/结束组件直接定类型；人员明确发起实际CALL或确认后续动作，配置/分配/条件命中不自动执行。
  依据：docs/functional-spec.json#AC-2120

- **AC-2121**：同业务本run执行串行；排队/重试/unknown不放行。新起呼、CALL退出及有前执行的转交核最近必要内容与事实已归档；初次纯IMPORT转交无先填表/先呼叫要求。
  依据：docs/functional-spec.json#AC-2121

- **AC-2122**：受理、真实拨打、执行终态、内容保存、唯一归档、节点、owner及业务结论分别确认；未知核原请求而非新身份重发。
  依据：docs/functional-spec.json#AC-2122

## 测试要求（尚未执行）

### CHECK-FLOW-START / manual

步骤：按当前续接版本执行：确认开始本次办理。前提：对准确业务有当前本租户办理权；确认业务/owner/模式及并发依据一致；TEMPLATE另核准确run/node；已安排责任人，DIRECT分类当前允许且显式方式明确；必要AI场景当前有效；前次所需内容和事实已归档，所有在途/重试/未知已收敛，联系限制与号码协调允许；DIRECT须当前周期ACTIVE；COMPLETED须显式再次直接跟进，不能以旧安排直接起呼。。操作：重核当前人/owner/模式、DIRECT开关/显式方式或TEMPLATE准确run/node、场景与唯一资源、所有联系限制和号码协调；人工本人拨打，管理员可用本人已有效坐席，明确实际人与责任人不同；两模式均产生准确唯一跟进并封最新分类定义/值和真实方式/场景；DIRECT不生成run/node，TEMPLATE绑定准确当前run/node，受理不当拨打。分别构造：资格/资源/场景/频次失败；明确受理；受理结果未知；当前直接周期具有可靠END接续来源。

预期：不自动推进节点或改变owner；无新执行段，保原安排并准确原因；执行中但calls可为空，等待真实事实；持同请求核对，不再起第二次；可以按已确认END继续人工跟进；普通DIRECT开关不替代此来源，但当前分类/本人/资源/联系/必要归档照常核验。

覆盖：AC-2090, AC-2091, AC-2120, AC-2121, AC-2122

### CHECK-FLOW-START-BATCH / manual

步骤：本动作适用模式以当前前置条件为准；原模板例仅用于TEMPLATE。勾选同组AI/预外呼并明确确认发起。对准确业务有当前本租户办理权；确认业务/run/node/owner及并发依据仍一致；每行有startMany资格，分类/模板/节点/方式/场景同组。依次执行：按分类优先及同级先后逐条重核，不抢占已有执行；每记录独立建立跟进/受理结果，仍对同号执行协调。分别构造：部分受理/失败/未知；人工或跨组混选

预期：逐行准确反馈和身份，已受理不回滚成未发生，失败不自动续拨；阻批发起，人工本人逐条处理；分配批次与执行批次不是同一成功口径

覆盖：AC-2120, AC-2121, AC-2122

## 完成条件

- 起呼时重核准确业务、负责方、周期/节点、前段归档、本人能力、资源/场景与联系限制。
- 每条新跟进捕获最新实际分类及有效值，批量AI/预外呼逐条反馈；受理不冒充真实拨打。
- 本任务全部同ID验收检查有当前实现、正常/拒绝/失败/未知证据，关联页面五态及字段权限符合原规格。
- 开发完成目标库/精确文件/模块/数据接口/测试执行绑定，必要共享文件先后依赖已补齐，工程问题有可靠结论。
- 产品变动回产品规格重审；不可用局部实现或Mock结论替代真实远端与正式开工许可。

需保留实际改动、测试结果和 Review 证据。仅修改完成不等于验收通过。


## 本轮工程绑定边界

本任务为可承接的业务实施分解，尚未绑定生产仓库/技术栈。开发确定真实文件后填写allowed_files、context_files、changes并复检共享文件依赖；不得把原型参考文件当作生产可写授权。

只读原型行为参考：

- [four-node-model.js](../../../prototype/scripts/four-node-model.js) · 只读行为参考，非生产可写目标
- [four-node-execution.js](../../../prototype/js/adapters/four-node-execution.js) · 只读行为参考，非生产可写目标

需开发处理的问题：ENG-FLOW-EXECUTION, EQ-PLAT-PHONE。
