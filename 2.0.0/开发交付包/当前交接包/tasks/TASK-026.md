# TASK-026 受控缺内容废弃及历史异常结清

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md)

- [明确发起当前呼叫及同组批呼叫 · FUNC\-2031](../features/FUNC-2031.md)
- [保存本轮跟进、准确通话事实并唯一归档 · FUNC\-2032](../features/FUNC-2032.md)
- [创建四节点流转模板 · FUNC\-2034](../features/FUNC-2034.md)
- [判断并确认本租户后继节点 · FUNC\-2038](../features/FUNC-2038.md)
- [在实际业务分类独立绑定单模板路由 · FUNC\-2040](../features/FUNC-2040.md)

## 目标

真实EXECUTION_ACTIVE/REQUEST_UNKNOWN/FACT_CONFLICT下ADMIN普通reason可先登记停止→ABANDONING，不先强未来内容确认；FOREIGN_CONTENT不当在途。；可靠停止后完成缺内容废弃才须当前ownerADMIN勾无法补填+原因及准确run/本tenant缺失指纹/record revision；正常archive与异常settlement分开。；原受理/在途/重试/unknown/冲突可靠收敛后才ABANDONED与新run，保缺失未完成，不代填/不假正常完成。；历史收尾确认不要求当前TEMPLATE；只更新本tenant旧seg.abandonmentSettlement与事件/revision，不废弃当前DIRECT或改当前run/exec/arrangement/字段。

## 产品依据

- FUNC-2031 明确发起当前呼叫及同组批呼叫：明确发起同租户DIRECT或TEMPLATE当前CALL的AI/人工/预外呼，重核准确资源/场景、本人资格、串行和联系限制。人工待分配不先起呼，AI/PRED无独立责任人要求；同组AI/预外呼按五档/FIFO统一总序逐条核验及反馈，不抢占在途。直接周期完成后显式下一方式建立新周期，旧事实保持。；来源 documentation/input/functions.json#FUNC-2031
- FUNC-2032 保存本轮跟进、准确通话事实并唯一归档：按准确实际办理/接听人保存本次内容、真实通话及定义/值快照，正常条件满足唯一归档。受控缺失废弃保未完成且与正常archive分开；可靠旧弃结清不永久阻后继DIRECT，但不贡献完成数或绕真实unknown/冲突。原受理迟到事实归原ID入账，内容更正/当前值按原规则。；来源 documentation/input/functions.json#FUNC-2032
- FUNC-2034 创建四节点流转模板：以字段参考分类读取条件来源，在唯一开始锚点编排转交、呼叫、结束；每CALL单方式、有序首命中路径。人工默认MANUAL可无seat先保存，SPECIFIC_SEAT才必选有效seat；PRED默认只任务，AI默认任务+scene，无默认责任人控件。CALL默认五档等级与分租户目标维护不扩大资源权，保存模板不绑定业务。；来源 documentation/input/functions.json#FUNC-2034
- FUNC-2038 判断并确认本租户后继节点：按准确条件确认后继及END两动作；受控废弃保缺失/未完成，原执行真实收敛后异常结清与新run，不伪造正常archive。END历史结构与准确首MANUAL当期例外分开；旧run/内容/通话/来源保留。；来源 documentation/input/functions.json#FUNC-2038
- FUNC-2040 在实际业务分类独立绑定单模板路由：分类路由是唯一实际应用绑定处；同品牌不同字段参考分类可复用，按实际所用字段、AI准确上下文及业务域校验，确认保存不覆盖BASE。；来源 documentation/input/functions.json#FUNC-2040

来源根：`/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/开发交付包/工作资料/续接输入`；来源指纹：`b0292b83ba50e66ed754b44bc97cfa25bab040c4f00b70baa8e542df666aeccf`

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

全局规则：[GR-AUTH](../global-logic.md#GR-AUTH)、[GR-CONFIG](../global-logic.md#GR-CONFIG)、[GR-DATA-FACTS](../global-logic.md#GR-DATA-FACTS)、[GR-HANDLING-MODE](../global-logic.md#GR-HANDLING-MODE)、[GR-LIFECYCLE-SETTLEMENT](../global-logic.md#GR-LIFECYCLE-SETTLEMENT)、[GR-NO-HISTORY](../global-logic.md#GR-NO-HISTORY)、[GR-SCOPE](../global-logic.md#GR-SCOPE)、[GR-SERIAL](../global-logic.md#GR-SERIAL)、[GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)

局部逻辑：[LOCAL-FLOW-ABANDON](../local-logic/LOCAL-FLOW-ABANDON.md)、[LOCAL-FLOW-REOPEN](../local-logic/LOCAL-FLOW-REOPEN.md)、[LOCAL-FLOW-ABANDONED-SETTLEMENT](../local-logic/LOCAL-FLOW-ABANDONED-SETTLEMENT.md)

字段：[FIELD-FLOW-ABANDON-CONFIRMATION](../field-specs.md#FIELD-FLOW-ABANDON-CONFIRMATION)、[FIELD-FLOW-ABANDON-TENANT](../field-specs.md#FIELD-FLOW-ABANDON-TENANT)、[FIELD-FLOW-ABANDONMENT-SETTLEMENT](../field-specs.md#FIELD-FLOW-ABANDONMENT-SETTLEMENT)、[FIELD-FLOW-ARCHIVE-STATE](../field-specs.md#FIELD-FLOW-ARCHIVE-STATE)、[FIELD-FLOW-ARRANGEMENT](../field-specs.md#FIELD-FLOW-ARRANGEMENT)、[FIELD-FLOW-CATEGORY-ID](../field-specs.md#FIELD-FLOW-CATEGORY-ID)、[FIELD-FLOW-CONTENT-SAVED](../field-specs.md#FIELD-FLOW-CONTENT-SAVED)、[FIELD-FLOW-CONTENT-SNAPSHOT](../field-specs.md#FIELD-FLOW-CONTENT-SNAPSHOT)、[FIELD-FLOW-EFFECTIVE-PLAN](../field-specs.md#FIELD-FLOW-EFFECTIVE-PLAN)、[FIELD-FLOW-ENTRY-DECISION](../field-specs.md#FIELD-FLOW-ENTRY-DECISION)、[FIELD-FLOW-EXECUTION-STATE](../field-specs.md#FIELD-FLOW-EXECUTION-STATE)、[FIELD-FLOW-HANDLING-MODE](../field-specs.md#FIELD-FLOW-HANDLING-MODE)、[FIELD-FLOW-IMPORT-VALUES](../field-specs.md#FIELD-FLOW-IMPORT-VALUES)、[FIELD-FLOW-MISSING-CONTENT-CONFIRM](../field-specs.md#FIELD-FLOW-MISSING-CONTENT-CONFIRM)、[FIELD-FLOW-OWNER-TENANT](../field-specs.md#FIELD-FLOW-OWNER-TENANT)、[FIELD-FLOW-REASON](../field-specs.md#FIELD-FLOW-REASON)、[FIELD-FLOW-RECORD-ID](../field-specs.md#FIELD-FLOW-RECORD-ID)、[FIELD-FLOW-RECORD-REVISION](../field-specs.md#FIELD-FLOW-RECORD-REVISION)、[FIELD-FLOW-REQUEST-STATUS](../field-specs.md#FIELD-FLOW-REQUEST-STATUS)、[FIELD-FLOW-ROUTE-MAIN](../field-specs.md#FIELD-FLOW-ROUTE-MAIN)、[FIELD-FLOW-RUN-ID](../field-specs.md#FIELD-FLOW-RUN-ID)、[FIELD-FLOW-RUN-PURPOSE](../field-specs.md#FIELD-FLOW-RUN-PURPOSE)、[FIELD-FLOW-RUN-STATUS](../field-specs.md#FIELD-FLOW-RUN-STATUS)

## UI 依据

[全局 UI 规范](../ui-spec.md)

- [UI-PAGE-2227](../ui-pages/UI-PAGE-2227.md)

## 实现要求

- 真实EXECUTION_ACTIVE/REQUEST_UNKNOWN/FACT_CONFLICT下ADMIN普通reason可先登记停止→ABANDONING，不先强未来内容确认；FOREIGN_CONTENT不当在途。
- 可靠停止后完成缺内容废弃才须当前ownerADMIN勾无法补填+原因及准确run/本tenant缺失指纹/record revision；正常archive与异常settlement分开。
- 原受理/在途/重试/unknown/冲突可靠收敛后才ABANDONED与新run，保缺失未完成，不代填/不假正常完成。
- 历史收尾确认不要求当前TEMPLATE；只更新本tenant旧seg.abandonmentSettlement与事件/revision，不废弃当前DIRECT或改当前run/exec/arrangement/字段。
- 不回到初始导入租户，不复活旧回执；重复导入不能代替重开。
- 不可代其他tenant确认；变更缺失范围重核，旧本人后来补录不把旧弃改正常完成；可靠旧弃收尾不得永久卡后继DIRECT。
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

- **AC-2163**：登记停止与完成废弃分开：EXECUTION_ACTIVE/REQUEST_UNKNOWN/FACT_CONFLICT下ADMIN普通reason可先ABANDONING，不强未来内容确认，FOREIGN_CONTENT不冒充在途。可靠停止后仍缺内容须当前ownerADMIN确认无法补填+原因/准确run/本tenant指纹版本才可ABANDONED；保缺失未完成，不代填或假正常archive/completed。
  依据：docs/functional-spec.json#AC-2163

- **AC-2164**：正常archive与可靠旧废弃结清分别判断；旧已弃段本人后来补齐或合法确认后可可靠收尾，不永久阻后继DIRECT完成/启用流程，也不贡献当前周期真实完成数或覆盖当前字段。当前必要内容/执行及实质冲突仍原准入。
  依据：docs/functional-spec.json#AC-2164

## 测试要求（尚未执行）

### CHECK-FLOW-ABANDON / manual

步骤：按当前Step45生命周期规则：当前管理员确认废弃并写原因；当前run有EXECUTION_ACTIVE/REQUEST_UNKNOWN/FACT_CONFLICT时，ADMIN普通reason可先登记停止→ABANDONING，不先强求未来内容确认；derived canRegisterStopping只指这些真实执行/核对阻塞，FOREIGN_CONTENT不冒充在途；原执行/排队/重试/unknown/冲突可靠收敛，正常必要内容已归档或缺内容已有合法受控确认时，才ABANDONED；保archiveState=ABANDONED及未正常完成，不把废弃结清写成archived=true；构造无权/缺确认/过期/真实在途或unknown/事实冲突对照。

预期：正常归档与可靠废弃结清分开，保缺失及未完成；不代填、不造archived/completedFollowup或正常完成计数；不删除真实通话/内容/历史；保原身份/当前值/未完成事实及真实统计，不代填、不借历史END给新周期续权、不提前释放。

覆盖：AC-2122, AC-2110

### CHECK-FLOW-CONTROLLED-ABANDON / manual

步骤：在途/REQUEST_UNKNOWN/FACT_CONFLICT时ADMIN普通reason先登记停止；原执行可靠停止后仍缺必要本人内容，核reason-only/非ownerADMIN/未确认/无原因/过期范围，再合法确认；FOREIGN_CONTENT单独反例。

预期：真实执行/核对阻塞可先ABANDONING不强未来确认；FOREIGN_CONTENT不是停止借口。完成缺失废弃须停止可靠且本tenant缺失合法确认，保缺失未完成、正常archived/completed不造；不提前释放，历史收尾不放宽。

覆盖：AC-2163

### CHECK-FLOW-REOPEN / manual

步骤：按当前Step45生命周期规则：原流程完成或废弃完成后管理员开始再次办理；再次跟进或带原因纠偏，从实际当前owner/目的重核入口和首呼合法性；正常段必要内容/事实正常归档；已可靠废弃结清的旧段另判，不强制archived=true。旧已弃段原人后来补齐或合法确认后可可靠收尾，不永久阻本次后继办理；旧弃不贡献正常完成数。各当前动作仍按自己的独立前置，不能把完成DIRECT周期强加到重开或启用流程。；读取实际分类最新字段/确认模板，建新run并清旧安排，保旧run/seg ；构造无权/缺确认/过期/真实在途或unknown/事实冲突对照。

预期：纠偏不直接改owner或门店互转，不在原流程插节点；保原身份/当前值/未完成事实及真实统计，不代填、不借历史END给新周期续权、不提前释放。

覆盖：AC-2108, AC-2110, AC-2122, AC-2140

### CHECK-FLOW-ABANDON-DIRECT-SETTLEMENT / manual

步骤：旧run受控废弃→重开正常完成→END首MANUAL→当前真实直接跟进归档；原本人后来补齐，或当前ownerADMIN用准确旧run/指纹/revision确认本tenant旧欠项，再完成当前DIRECT/启用流程。另含跨tenant/非ADMIN/过期/多个旧run/真实旧冲突。

预期：可靠旧弃收尾不要求正常archived=true，不永久卡DIRECT；只改本tenant旧seg证据/事件/revision，当前状态/字段不变。当前周期凭自身真实完成或合法NO_CALL，旧弃不计正常完成；外tenant/无权/旧unknown冲突仍原守卫。

覆盖：AC-2164

## 完成条件

- 真实EXECUTION_ACTIVE/REQUEST_UNKNOWN/FACT_CONFLICT下ADMIN普通reason可先登记停止→ABANDONING，不先强未来内容确认；FOREIGN_CONTENT不当在途。
- 可靠停止后完成缺内容废弃才须当前ownerADMIN勾无法补填+原因及准确run/本tenant缺失指纹/record revision；正常archive与异常settlement分开。
- 原受理/在途/重试/unknown/冲突可靠收敛后才ABANDONED与新run，保缺失未完成，不代填/不假正常完成。
- 历史收尾确认不要求当前TEMPLATE；只更新本tenant旧seg.abandonmentSettlement与事件/revision，不废弃当前DIRECT或改当前run/exec/arrangement/字段。
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
