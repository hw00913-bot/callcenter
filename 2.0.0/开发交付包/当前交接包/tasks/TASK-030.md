# TASK-030 统一业务队列、批次、详情与联系时间线

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md)

- [查看业务、运行和有权跟进通话详情 · FUNC\-2033](../features/FUNC-2033.md)
- [查询业务、批次和工作队列 · FUNC\-2039](../features/FUNC-2039.md)

## 目标

两模式无run/有run均可见且工作队列指向真实下一步；分类、负责方、责任与实际人分开。；客户同号视图只归集有权业务，不合并身份；当前/本方截止、业务跟进/联系历史分别表达。

## 产品依据

- FUNC-2033 查看业务、运行和有权跟进通话详情：查看有权业务的实际模式、当前资料、完整跟进和通话快照；DIRECT无run或节点，模板方案/运行只对真实TEMPLATE显示，转出截止和最小本人表单资格保持。；来源 documentation/input/functions.json#FUNC-2033
- FUNC-2039 查询业务、批次和工作队列：查询模式、批次、队列和下一步；DIRECT显示同租户待安排/起呼/结果/本人填写/待核及再次跟进，允许有权人经独立预检显式启用流程。；来源 documentation/input/functions.json#FUNC-2039

来源根：`/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/开发交付包/工作资料/续接输入`；来源指纹：`0904ba9de2798ea9878d0602f5fbc337ae523a60911c1b10dac967c13febffbe`

## 前置任务

- TASK-015
- TASK-017
- TASK-021
- TASK-022
- TASK-025

## 只读代码上下文

未指定既有代码文件；从工程规范和产品依据读取上下文。

## 允许修改的文件

- 未填写

代码库根：`None`。未列出的文件不属于本任务修改范围；扩大范围需回到计划。

## 变更安排

- 未填写

## 逻辑与字段依据

先读 [全局逻辑](../global-logic.md)，再读本任务关联的局部逻辑与字段定义。

全局规则：[GR-AUTH](../global-logic.md#GR-AUTH)、[GR-DATA-FACTS](../global-logic.md#GR-DATA-FACTS)、[GR-HANDLING-MODE](../global-logic.md#GR-HANDLING-MODE)、[GR-LIST-ORDER](../global-logic.md#GR-LIST-ORDER)、[GR-PRIVACY](../global-logic.md#GR-PRIVACY)、[GR-SCOPE](../global-logic.md#GR-SCOPE)

局部逻辑：[LOCAL-FLOW-QUERY](../local-logic/LOCAL-FLOW-QUERY.md)、[LOCAL-FLOW-BATCH-READ](../local-logic/LOCAL-FLOW-BATCH-READ.md)、[LOCAL-FLOW-DETAIL](../local-logic/LOCAL-FLOW-DETAIL.md)、[LOCAL-FLOW-CUSTOMER-TIMELINE](../local-logic/LOCAL-FLOW-CUSTOMER-TIMELINE.md)

字段：[FIELD-FLOW-ACTIVITY-INTEREST](../field-specs.md#FIELD-FLOW-ACTIVITY-INTEREST)、[FIELD-FLOW-ACTUAL-ANSWER](../field-specs.md#FIELD-FLOW-ACTUAL-ANSWER)、[FIELD-FLOW-ACTUAL-HANDLER](../field-specs.md#FIELD-FLOW-ACTUAL-HANDLER)、[FIELD-FLOW-ARRANGEMENT](../field-specs.md#FIELD-FLOW-ARRANGEMENT)、[FIELD-FLOW-BASIS](../field-specs.md#FIELD-FLOW-BASIS)、[FIELD-FLOW-BATCH-ID](../field-specs.md#FIELD-FLOW-BATCH-ID)、[FIELD-FLOW-BRAND-ID](../field-specs.md#FIELD-FLOW-BRAND-ID)、[FIELD-FLOW-BUSINESS-CODE](../field-specs.md#FIELD-FLOW-BUSINESS-CODE)、[FIELD-FLOW-CALLS](../field-specs.md#FIELD-FLOW-CALLS)、[FIELD-FLOW-CATEGORY-ID](../field-specs.md#FIELD-FLOW-CATEGORY-ID)、[FIELD-FLOW-CONTENT-SNAPSHOT](../field-specs.md#FIELD-FLOW-CONTENT-SNAPSHOT)、[FIELD-FLOW-CORRECTIONS](../field-specs.md#FIELD-FLOW-CORRECTIONS)、[FIELD-FLOW-CUSTOMER-NAME](../field-specs.md#FIELD-FLOW-CUSTOMER-NAME)、[FIELD-FLOW-DEPARTURE-SNAPSHOT](../field-specs.md#FIELD-FLOW-DEPARTURE-SNAPSHOT)、[FIELD-FLOW-DIRECT-CYCLE-ID](../field-specs.md#FIELD-FLOW-DIRECT-CYCLE-ID)、[FIELD-FLOW-DIRECT-CYCLES](../field-specs.md#FIELD-FLOW-DIRECT-CYCLES)、[FIELD-FLOW-DIRECT-METHOD](../field-specs.md#FIELD-FLOW-DIRECT-METHOD)、[FIELD-FLOW-DIRECT-OUTCOME](../field-specs.md#FIELD-FLOW-DIRECT-OUTCOME)、[FIELD-FLOW-DIRECT-STATUS](../field-specs.md#FIELD-FLOW-DIRECT-STATUS)、[FIELD-FLOW-EFFECTIVE-PLAN](../field-specs.md#FIELD-FLOW-EFFECTIVE-PLAN)、[FIELD-FLOW-END-FOLLOWUP-ORIGIN](../field-specs.md#FIELD-FLOW-END-FOLLOWUP-ORIGIN)、[FIELD-FLOW-EVALUATION](../field-specs.md#FIELD-FLOW-EVALUATION)、[FIELD-FLOW-EXECUTION-STATE](../field-specs.md#FIELD-FLOW-EXECUTION-STATE)、[FIELD-FLOW-FOLLOWER](../field-specs.md#FIELD-FLOW-FOLLOWER)、[FIELD-FLOW-FOLLOWUP-ID](../field-specs.md#FIELD-FLOW-FOLLOWUP-ID)、[FIELD-FLOW-FOLLOWUP-SUMMARY](../field-specs.md#FIELD-FLOW-FOLLOWUP-SUMMARY)、[FIELD-FLOW-FOLLOWUP-VALUES](../field-specs.md#FIELD-FLOW-FOLLOWUP-VALUES)、[FIELD-FLOW-HANDLING-MODE](../field-specs.md#FIELD-FLOW-HANDLING-MODE)、[FIELD-FLOW-IMPORT-PREVIEW](../field-specs.md#FIELD-FLOW-IMPORT-PREVIEW)、[FIELD-FLOW-IMPORT-VALUES](../field-specs.md#FIELD-FLOW-IMPORT-VALUES)、[FIELD-FLOW-INTENDED-STORE-NAME](../field-specs.md#FIELD-FLOW-INTENDED-STORE-NAME)、[FIELD-FLOW-INTENTION-LEVEL](../field-specs.md#FIELD-FLOW-INTENTION-LEVEL)、[FIELD-FLOW-INTERESTED-ITEMS](../field-specs.md#FIELD-FLOW-INTERESTED-ITEMS)、[FIELD-FLOW-LEAD-LEVEL](../field-specs.md#FIELD-FLOW-LEAD-LEVEL)、[FIELD-FLOW-MAPPING-SERIES](../field-specs.md#FIELD-FLOW-MAPPING-SERIES)、[FIELD-FLOW-METHOD](../field-specs.md#FIELD-FLOW-METHOD)、[FIELD-FLOW-NEXT-SERVICE](../field-specs.md#FIELD-FLOW-NEXT-SERVICE)、[FIELD-FLOW-NODE-ID](../field-specs.md#FIELD-FLOW-NODE-ID)、[FIELD-FLOW-OUTCOME](../field-specs.md#FIELD-FLOW-OUTCOME)、[FIELD-FLOW-OWNER-TENANT](../field-specs.md#FIELD-FLOW-OWNER-TENANT)、[FIELD-FLOW-PARTICIPANTS](../field-specs.md#FIELD-FLOW-PARTICIPANTS)、[FIELD-FLOW-PHONE](../field-specs.md#FIELD-FLOW-PHONE)、[FIELD-FLOW-PLANNED-STORE](../field-specs.md#FIELD-FLOW-PLANNED-STORE)、[FIELD-FLOW-PLANNED-VISIT](../field-specs.md#FIELD-FLOW-PLANNED-VISIT)、[FIELD-FLOW-RECORD-ID](../field-specs.md#FIELD-FLOW-RECORD-ID)、[FIELD-FLOW-RUN-END-ACTION](../field-specs.md#FIELD-FLOW-RUN-END-ACTION)、[FIELD-FLOW-RUN-ID](../field-specs.md#FIELD-FLOW-RUN-ID)、[FIELD-FLOW-RUN-STATUS](../field-specs.md#FIELD-FLOW-RUN-STATUS)、[FIELD-FLOW-SERVICE-CONCERN](../field-specs.md#FIELD-FLOW-SERVICE-CONCERN)、[FIELD-FLOW-SERVICE-SATISFACTION](../field-specs.md#FIELD-FLOW-SERVICE-SATISFACTION)、[FIELD-FLOW-STATISTICS](../field-specs.md#FIELD-FLOW-STATISTICS)、[FIELD-FLOW-TESTDRIVE-INTENTION](../field-specs.md#FIELD-FLOW-TESTDRIVE-INTENTION)、[FIELD-FLOW-UPDATED-AT](../field-specs.md#FIELD-FLOW-UPDATED-AT)、[FIELD-FLOW-VALUE-SOURCES](../field-specs.md#FIELD-FLOW-VALUE-SOURCES)、[FIELD-FLOW-VISIT-INTENTION](../field-specs.md#FIELD-FLOW-VISIT-INTENTION)、[FIELD-FLOW-WORK-STATE](../field-specs.md#FIELD-FLOW-WORK-STATE)

## UI 依据

[全局 UI 规范](../ui-spec.md)

- [UI-PAGE-2203](../ui-pages/UI-PAGE-2203.md)
- [UI-PAGE-2204](../ui-pages/UI-PAGE-2204.md)
- [UI-PAGE-2226](../ui-pages/UI-PAGE-2226.md)
- [UI-PAGE-2227](../ui-pages/UI-PAGE-2227.md)

## 实现要求

- 两模式无run/有run均可见且工作队列指向真实下一步；分类、负责方、责任与实际人分开。
- 客户同号视图只归集有权业务，不合并身份；当前/本方截止、业务跟进/联系历史分别表达。
- 普通列表先更新时间倒序后分页；时间线与字段/优先级按语义顺序；失败不装空态。
- 客户档案统一标题、可聚焦页签和tabpanel；同身份保两视图查询/分页，跨身份不恢复旧对象，显式详情/摘要刷新定位正确。
- 按所引LOCAL逐动作落实触发/前后置/分支；业务定义只读同源规格，不另抄一套规则。
- 依赖表示实施契约/共享守卫先就绪，不新增用户操作门槛；跨任务端到端由验收批次合并检查。
- 目标库、模块/服务/表/接口、精确可写文件及命令由开发在开工前绑定；当前空文件清单不授代码写入权。

## 产品验收

- **AC-2093**：接收方在明确转交后按本租户资格读取同条线索基础资料，不因共享模板获得其他租户业务范围。
  依据：docs/functional-spec.json#AC-2093

- **AC-2094**：有权接收方可查看同条业务按既定范围可读的原跟进/通话事实；转出方严格本方截止投影，最小接听表单不等整档案读取。
  依据：docs/functional-spec.json#AC-2094

- **AC-2129**：超管在管理范围仅监管查询，列表/详情/直接访问一致，不代分配、起呼、填结果或转交。
  依据：docs/functional-spec.json#AC-2129

- **AC-2130**：所有监管和办理读同权威业务事实，不造第二份线索账本或冒用目标身份。
  依据：docs/functional-spec.json#AC-2130

- **AC-2131**：同台账工作区承载分类导入、批次、记录详情、工作状态、当前有效值及各轮快照；默认列表按更新时间倒序再分页。
  依据：docs/functional-spec.json#AC-2131

- **AC-2132**：当前负责、有权本方截止历史和超管管理范围监管分别投影；辅助运行API不泄露接收方后续节点/场景。
  依据：docs/functional-spec.json#AC-2132

- **AC-2133**：本轮无旧规划数据迁移或旧模板适配；未来本版业务/运行/跟进/通话快照按发生时保存，名称/配置更改不重画已开run或正式内容。
  依据：docs/functional-spec.json#AC-2133

- **AC-2147**：业务跟进/联系档案统一页签与tabpanel，键盘方向/Home/End可用；同身份切换保各自查询/分页，跨身份不恢复旧状态，显式客户详情与原摘要刷新仍定位正确。
  依据：docs/functional-spec.json#AC-2147

## 测试要求（尚未执行）

### CHECK-FLOW-QUERY / manual

步骤：本动作适用模式以当前前置条件为准；原模板例仅用于TEMPLATE。进入导入与分配／业务列表并筛选队列。当前身份及租户范围可核。依次执行：从同权威账本按当前/截止历史/管理监管资格投影，不用品牌配置权扩范围；算工作状态、下一步和阻塞原因，先更新时间倒序全量过滤再分页；入口按钮按行实际动作资格，普通运营可起呼但不导入/分配。分别构造：确定空记录；范围或读取失败；当前记录可办。具体复现：准备更新时间为10:00、12:00、11:00的三条有权业务和一条无权业务；每页两条，查询后重复打开详情。

预期：显示空态及有权下一步，不假造条数；显示错误/无权而非空成功；队列可定位待转交/待安排/待起呼/待结果/待填写/待流转/条件未满足/待核等；读取不改变业务更新时间或状态。该例预期：过滤后先按12:00、11:00、10:00倒序再分页；无权行不计入可见集；只读不改变时间，分支/字段业务顺序不被排序规则打乱。

覆盖：AC-2129, AC-2130, AC-2131, AC-2132

### CHECK-FLOW-BATCH-READ / manual

步骤：本动作适用模式以当前前置条件为准；原模板例仅用于TEMPLATE。从当前台账打开批次查看业务。本次批次可见范围有效。依次执行：按实际可见记录裁剪批次及私有行，准确表明部分可见；可见集按真实更新时间倒序分页，关联到准确业务。分别构造：本范围无可见内容；有可见行

预期：明确无权/不可读，不暴露其他租户名单；展示真实逐行结果和当前办理入口，不按手机号猜记录；不通过批次扩大跨租户字段或电话读取

覆盖：AC-2131, AC-2132

### CHECK-FLOW-DETAIL / manual

步骤：本动作适用模式以当前前置条件为准；原模板例仅用于TEMPLATE。打开准确业务详情或辅助run/timeline接口。当前读取资格和准确业务身份可核。依次执行：分别投影当前负责、超管管理只读、本方转出截止三身份；按各自快照显示当前资料、实际run、原段内容和通话，辅助接口同样裁剪。分别构造：实际接听人只有原段资格；转出方历史；超管监管。具体复现：总部向门店成功转交后，门店更正字段并选私有AI场景；分别以原总部、门店、超管和仅有原段待填权实际接听人读取详情与辅助timeline/runContext。

预期：只通过最小待填写入口，不由detail获得整档案；不返回接收方当前run/node/arrangement/后续值；只读真实数据，不出现代办按钮；查看不创建跟进或运行。该例预期：总部只见本方截止；门店按当前业务资格；超管管理范围只读；最小待填人不能用辅助接口取整档案或门店后续私有资料。

覆盖：AC-2093, AC-2094, AC-2131, AC-2132, AC-2133

### CHECK-FLOW-CUSTOMER-TIMELINE / manual

步骤：按当前续接版本执行：客户档案切换业务跟进或联系档案、打开关联业务。前提：各来源本来有权读取，不因归集新增授权。操作：同租户规范号码仅展示归集有权业务，不合并身份/编码/结果；保原联系档案/独立呼入临时通话，业务followup按准确关联展示；按准确身份展示模式与方式；DIRECT无当前run/节点显示“直接跟进”，保完整有权跟进/通话/快照及当前资料更正入口，不显示可办理模板转交或推进。。分别构造：独立来电或临时通话无业务关联；同号多业务。

预期：档案归集不是第二套可变业务账本；显示有权联系历史，不猜挂某条业务；各自可打开有权记录及跟进，仍有独立run和联系策略。

覆盖：AC-2130, AC-2131, AC-2132, AC-2147

## 完成条件

- 两模式无run/有run均可见且工作队列指向真实下一步；分类、负责方、责任与实际人分开。
- 客户同号视图只归集有权业务，不合并身份；当前/本方截止、业务跟进/联系历史分别表达。
- 本任务全部同ID验收检查有当前实现、正常/拒绝/失败/未知证据，关联页面五态及字段权限符合原规格。
- 开发完成目标库/精确文件/模块/数据接口/测试执行绑定，必要共享文件先后依赖已补齐，工程问题有可靠结论。
- 产品变动回产品规格重审；不可用局部实现或Mock结论替代真实远端与正式开工许可。

需保留实际改动、测试结果和 Review 证据。仅修改完成不等于验收通过。


## 本轮工程绑定边界

本任务为可承接的业务实施分解，尚未绑定生产仓库/技术栈。开发确定真实文件后填写allowed_files、context_files、changes并复检共享文件依赖；不得把原型参考文件当作生产可写授权。

只读原型行为参考：

- [four-node-workspace.js](../../../prototype/js/adapters/four-node-workspace.js) · 只读行为参考，非生产可写目标
- [business-link.js](../../../prototype/js/components/business-link.js) · 只读行为参考，非生产可写目标
- [list-order.js](../../../prototype/js/components/list-order.js) · 只读行为参考，非生产可写目标

需开发处理的问题：ENG-FLOW-PERSISTENCE。
