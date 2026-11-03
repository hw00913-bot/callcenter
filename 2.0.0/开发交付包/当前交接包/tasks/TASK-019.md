# TASK-019 准确通话回执、重试与AI标签事实

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md)

- [进入有权工作位置与保留专业能力 · FUNC\-2002](../features/FUNC-2002.md)
- [为具体AI执行场景维护业务分类引用 · FUNC\-2019](../features/FUNC-2019.md)
- [保存本轮跟进、准确通话事实并唯一归档 · FUNC\-2032](../features/FUNC-2032.md)

## 目标

按准确record/run/stage/followup/attempt记录真实拨打/接通/终态，停止请求不等真实停止。；ACTIVE/ABANDONING原已受理且未可靠关闭的事实照常登记去重计数；已闭段未知新attempt仍按EXECUTION_CLOSED/冲突，不抹真实事实或授权新派发。

## 产品依据

- FUNC-2002 进入有权工作位置与保留专业能力：当前五顶栏只负责功能归位。按稳定页面/动作身份保留AI与Cloud现行专业操作、状态、资源、报表和业务接口，分别校验模块、成员、对象、读写/导出权。；来源 documentation/input/functions.json#FUNC-2002
- FUNC-2019 为具体AI执行场景维护业务分类引用：有权AI场景按准确scene/platform通过弹窗选择实际分类IMPORT引用及配置专属供应商列/参数；分类业务定义权威、供应商列和值独立，主场景保存才持久，固定专业项/权限/历史保留，不授任务导入或分类维护权。；来源 documentation/input/functions.json#FUNC-2019
- FUNC-2032 保存本轮跟进、准确通话事实并唯一归档：按准确实际办理/接听人保存本次内容、真实通话及定义/值快照，正常条件满足唯一归档。受控缺失废弃保未完成且与正常archive分开；可靠旧弃结清不永久阻后继DIRECT，但不贡献完成数或绕真实unknown/冲突。原受理迟到事实归原ID入账，内容更正/当前值按原规则。；来源 documentation/input/functions.json#FUNC-2032

来源根：`/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/开发交付包/工作资料/续接输入`；来源指纹：`ac24ea3af455fa8052e0daeaa799eea0265f5d02f520b26bdd98ac1e620a1a6c`

## 前置任务

- TASK-018
- TASK-033

## 只读代码上下文

未指定既有代码文件；从工程规范和产品依据读取上下文。

## 允许修改的文件

- 未填写

代码库根：`None`。未列出的文件不属于本任务修改范围；扩大范围需回到计划。

## 变更安排

- 未填写

## 逻辑与字段依据

先读 [全局逻辑](../global-logic.md)，再读本任务关联的局部逻辑与字段定义。

全局规则：[GR-CONFIG](../global-logic.md#GR-CONFIG)、[GR-CUSTOMER-SIP](../global-logic.md#GR-CUSTOMER-SIP)、[GR-DATA-FACTS](../global-logic.md#GR-DATA-FACTS)、[GR-HANDLING-MODE](../global-logic.md#GR-HANDLING-MODE)、[GR-IDENTITY](../global-logic.md#GR-IDENTITY)、[GR-LIFECYCLE-SETTLEMENT](../global-logic.md#GR-LIFECYCLE-SETTLEMENT)、[GR-PRIVACY](../global-logic.md#GR-PRIVACY)、[GR-SCOPE](../global-logic.md#GR-SCOPE)、[GR-SERIAL](../global-logic.md#GR-SERIAL)、[GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)

局部逻辑：[LOCAL-FLOW-CALL-FACTS](../local-logic/LOCAL-FLOW-CALL-FACTS.md)、[LOCAL-PLAT-AI-TAG-RESULT](../local-logic/LOCAL-PLAT-AI-TAG-RESULT.md)

字段：[FIELD-FLOW-ACTUAL-ANSWER](../field-specs.md#FIELD-FLOW-ACTUAL-ANSWER)、[FIELD-FLOW-ATTEMPT-ID](../field-specs.md#FIELD-FLOW-ATTEMPT-ID)、[FIELD-FLOW-CALL-STATE](../field-specs.md#FIELD-FLOW-CALL-STATE)、[FIELD-FLOW-CALLS](../field-specs.md#FIELD-FLOW-CALLS)、[FIELD-FLOW-CONTENT-SNAPSHOT](../field-specs.md#FIELD-FLOW-CONTENT-SNAPSHOT)、[FIELD-FLOW-CUSTOMER-ANSWERED](../field-specs.md#FIELD-FLOW-CUSTOMER-ANSWERED)、[FIELD-FLOW-DIALED](../field-specs.md#FIELD-FLOW-DIALED)、[FIELD-FLOW-DIALED-AT](../field-specs.md#FIELD-FLOW-DIALED-AT)、[FIELD-FLOW-DIRECT-CYCLE-ID](../field-specs.md#FIELD-FLOW-DIRECT-CYCLE-ID)、[FIELD-FLOW-DIRECT-STATUS](../field-specs.md#FIELD-FLOW-DIRECT-STATUS)、[FIELD-FLOW-EVENT-ID](../field-specs.md#FIELD-FLOW-EVENT-ID)、[FIELD-FLOW-EXECUTION-STATE](../field-specs.md#FIELD-FLOW-EXECUTION-STATE)、[FIELD-FLOW-FOLLOWUP-ID](../field-specs.md#FIELD-FLOW-FOLLOWUP-ID)、[FIELD-FLOW-HANDLING-MODE](../field-specs.md#FIELD-FLOW-HANDLING-MODE)、[FIELD-FLOW-HUMAN-ANSWER](../field-specs.md#FIELD-FLOW-HUMAN-ANSWER)、[FIELD-FLOW-NODE-RUN-ID](../field-specs.md#FIELD-FLOW-NODE-RUN-ID)、[FIELD-FLOW-PROVIDER-CALL-ID](../field-specs.md#FIELD-FLOW-PROVIDER-CALL-ID)、[FIELD-FLOW-RECORD-ID](../field-specs.md#FIELD-FLOW-RECORD-ID)、[FIELD-FLOW-RETRIES-COMPLETE](../field-specs.md#FIELD-FLOW-RETRIES-COMPLETE)、[FIELD-FLOW-ROUTING-EVIDENCE](../field-specs.md#FIELD-FLOW-ROUTING-EVIDENCE)、[FIELD-FLOW-RUN-ID](../field-specs.md#FIELD-FLOW-RUN-ID)、[FIELD-FLOW-SCENE-SNAPSHOT](../field-specs.md#FIELD-FLOW-SCENE-SNAPSHOT)、[FIELD-FLOW-STAGE-ID](../field-specs.md#FIELD-FLOW-STAGE-ID)、[FIELD-FLOW-STATISTICS](../field-specs.md#FIELD-FLOW-STATISTICS)、[FIELD-FLOW-TAG-EVIDENCE](../field-specs.md#FIELD-FLOW-TAG-EVIDENCE)、[FIELD-PLAT-AI-MAPPING](../field-specs.md#FIELD-PLAT-AI-MAPPING)、[FIELD-PLAT-AI-SCENE-ID](../field-specs.md#FIELD-PLAT-AI-SCENE-ID)、[FIELD-PLAT-AI-TAG-CONTEXT](../field-specs.md#FIELD-PLAT-AI-TAG-CONTEXT)、[FIELD-PLAT-AI-TAG-RESULT](../field-specs.md#FIELD-PLAT-AI-TAG-RESULT)、[FIELD-PLAT-AUDIT](../field-specs.md#FIELD-PLAT-AUDIT)、[FIELD-PLAT-CALL-ID](../field-specs.md#FIELD-PLAT-CALL-ID)

## UI 依据

[全局 UI 规范](../ui-spec.md)

- [UI-PAGE-2108](../ui-pages/UI-PAGE-2108.md)
- [UI-PAGE-2111](../ui-pages/UI-PAGE-2111.md)
- [UI-PAGE-2227](../ui-pages/UI-PAGE-2227.md)

## 实现要求

- 按准确record/run/stage/followup/attempt记录真实拨打/接通/终态，停止请求不等真实停止。
- ACTIVE/ABANDONING原已受理且未可靠关闭的事实照常登记去重计数；已闭段未知新attempt仍按EXECUTION_CLOSED/冲突，不抹真实事实或授权新派发。
- 旧DIRECT回执不推进新run或改新值；跨attempt身份、未核human事实不能开放代填。
- 人工/预外呼路由回执分别用TIANRUN_MANUAL_SIP_CAUSE/TIANRUN_PREDICTIVE_SIP_CAUSE客户侧200/710～724，不从旧1～4接听标记推算；AI域和其他专业显示字段不强改。
- 按所引LOCAL逐动作落实触发/前后置/分支；业务定义只读同源规格，不另抄一套规则。
- 依赖表示实施契约/共享守卫先就绪，不新增用户操作门槛；跨任务端到端由验收批次合并检查。
- 目标库、模块/服务/表/接口、精确可写文件及命令由开发在开工前绑定；当前空文件清单不授代码写入权。

## 产品验收

- **AC-2046**：公共分类维护权不下放AI专业配置权，新/冷细分及供应商执行允许值沿原规则。保原供应商标签池按supplierId、标签启用与映射按supplierId+总部/门店租户类型+AI标签场景、本地标准集按租户类型+标签场景的作用域；标签场景、具体AI执行场景及公共分类以准确身份关联，不因品牌共用就共享全部标签。
  依据：docs/functional-spec.json#AC-2046

- **AC-2064**：AI任务、通话/计费/线索统计、通话/线索记录、场景、标签及服务能力保留；原首页摘要/使用归AI用量与服务。AI场景使用与标签配置权分离；标签按准确supplier/tenant/type/tagScene/category/brand/revision执行段快照校验。原始与映射结果保留，未匹配不回退首项。准确映射标签可作人工确认路径条件，不直接写业务字段，不因AI回执自动推进。
  依据：docs/functional-spec.json#AC-2064

- **AC-2092**：每次实际办理独立followup，开始捕获最新实际分类资料，实际办理/接听人唯一正式提交；纯AI/无人时系统按真实事实唯一归档。正式内容不重写，更正直改当前有效值并留因，旧段迟到不覆盖新值。
  依据：docs/functional-spec.json#AC-2092

- **AC-2122**：受理、真实拨打、执行终态、内容保存、唯一归档、节点、owner及业务结论分别确认；未知核原请求而非新身份重发。
  依据：docs/functional-spec.json#AC-2122

- **AC-2123**：IMPORT独立读取当前有效导入值；FOLLOWUP读取指定范围正式确认或授权更正，SYSTEM继承result不冒充新确认；通话/AI标签按准确run/stage/sourceNode/执行场景和版本，不借其他租户；CURRENT_NODE/CURRENT_ROUND不借旧run，显式HISTORY另按本租户准确历史范围核验。
  依据：docs/functional-spec.json#AC-2123

- **AC-2144**：流转判断分别使用TIANRUN_MANUAL_SIP_CAUSE和TIANRUN_PREDICTIVE_SIP_CAUSE客户侧结果：200已接通、710～724当前字典；不再用1～4接听标记推断，不改AI状态域或原专业记录的其他状态展示。新回执与实际方式/原段/场景准确关联，未知PENDING。
  依据：docs/functional-spec.json#AC-2144

- **AC-2166**：ABANDONING不准新派发，但原已受理且未可靠关闭的准确seg/attempt迟到真实拨打/接通/终态归原ID去重计数，不误标0或挂当前，不提前释放；已闭段未知新attempt仍拒/保冲突证据，停止请求不是真停止。
  依据：docs/functional-spec.json#AC-2166

## 测试要求（尚未执行）

### CHECK-FLOW-CALL-FACTS / manual

步骤：按当前Step45生命周期规则：外部执行事实或本地明确模拟事件到达；按准确record/run/stage/nodeRun/followup/attempt归原事实，不凭号码或当前指针；区分受理/排队/实际dial/接通/实际人工/重试收敛；新派发准入与入站事实分开；ACTIVE/ABANDONING原已受理且未可靠关闭的准确seg/attempt迟到拨打/接通/终态按原ID归账去重计数，不因非ACTIVE误标dialed=false/0或假冲突；不授新派发、不挂新run/当前身份、不提前释放。已闭段未知新attempt仍原EXECUTION_CLOSED/冲突规则。；标签事实只匹配实际sceneSnapshot七元组及合法命中子集，NONE准确空也是已知；DIRECT沿准确record/owner/followup/attempt和实际办理人处理，同样保本人填写、正式快照、当前值权限及迟到隔离；无run/node不构造假模板身份。TEMPLATE仍核原准确run/node。；构造无权/缺确认/过期/真实在途或unknown/事实冲突对照。

预期：普通AI可记录本轮实际新标签版本，不能用run旧catalog误拒准确可选标签事实；新派发准入与入站事实分开；ACTIVE/ABANDONING原已受理且未可靠关闭的准确seg/attempt迟到拨打/接通/终态按原ID归账去重计数，不因非ACTIVE误标dialed=false/0或假冲突；不授新派发、不挂新run/当前身份、不提前释放。已闭段未知新attempt仍原EXECUTION_CLOSED/冲突规则。；保原身份/当前值/未完成事实及真实统计，不代填、不借历史END给新周期续权、不提前释放。

覆盖：AC-2092, AC-2122, AC-2123, AC-2144

### CHECK-FLOW-STOPPING-RECEIPTS / manual

步骤：原受理排队→请求停止/ABANDONING→原attempt迟到拨打/接通/结束，含乱序/重复及新run隔离；核已闭段未知新attempt、停止仅受理而未实际结束。

预期：真实原事实按原seg/attempt入账计数去重，禁止新派发/误挂当前；不提前释放，不抹拨打/伪冲突；已闭未知新attempt依原拒绝/冲突规则。

覆盖：AC-2166

### CHECK-PLAT-AI-TAG-RESULT / manual

步骤：在准确有权范围触发“校验AI执行段标签并保留准确结果”；分别执行正常输入、明确无权/失效/冲突、失败及未知结果分支；按所列字段边界复查保存与显示。

预期：原始及准确映射结果保留，可供人工判断且不污染业务字段或运行状态；无权及非法输入不得写入；失败与未知分别显示且不扩范围、不重复产生副作用。

覆盖：AC-2046, AC-2064

## 完成条件

- 按准确record/run/stage/followup/attempt记录真实拨打/接通/终态，停止请求不等真实停止。
- ACTIVE/ABANDONING原已受理且未可靠关闭的事实照常登记去重计数；已闭段未知新attempt仍按EXECUTION_CLOSED/冲突，不抹真实事实或授权新派发。
- 本任务全部同ID验收检查有当前实现、正常/拒绝/失败/未知证据，关联页面五态及字段权限符合原规格。
- 开发完成目标库/精确文件/模块/数据接口/测试执行绑定，必要共享文件先后依赖已补齐，工程问题有可靠结论。
- 产品变动回产品规格重审；不可用局部实现或Mock结论替代真实远端与正式开工许可。

需保留实际改动、测试结果和 Review 证据。仅修改完成不等于验收通过。


## 本轮工程绑定边界

本任务为可承接的业务实施分解，尚未绑定生产仓库/技术栈。开发确定真实文件后填写allowed_files、context_files、changes并复检共享文件依赖；不得把原型参考文件当作生产可写授权。

只读原型行为参考：

- [four-node-model.js](../../../prototype/scripts/four-node-model.js) · 只读行为参考，非生产可写目标
- [four-node-execution.js](../../../prototype/js/adapters/four-node-execution.js) · 只读行为参考，非生产可写目标

需开发处理的问题：ENG-FLOW-EXECUTION, ENG-FLOW-SCENE。
