# TASK-011 条件优先的四节点参考模板维护

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md)

- [创建四节点流转模板 · FUNC\-2034](../features/FUNC-2034.md)
- [编辑流转模板当前配置 · FUNC\-2035](../features/FUNC-2035.md)
- [查看当前模板及绑定方案说明 · FUNC\-2041](../features/FUNC-2041.md)
- [删除当前未被使用的模板定义 · FUNC\-2042](../features/FUNC-2042.md)

## 目标

四组件职责固定；按名称→条件→下一节点→继续条件编辑，空目标只是草稿且不产生虚连线。；当前有出口配置须唯一末位ELSE；条件即时改，兼容operator保值，来源/字段或不兼容类型/基数清不适用值。；END仅名称及DIRECT_FOLLOWUP/CLOSE二选一；多值换行提示、选择/拖线拒环、保存定位和错误同色反馈均按当前原型。

## 产品依据

- FUNC-2034 创建四节点流转模板：以字段参考分类读取条件来源，在唯一开始锚点编排转交、呼叫、结束，组件定类型、每CALL单方式、有序首命中路径，保存模板不绑定业务。；来源 documentation/input/functions.json#FUNC-2034
- FUNC-2035 编辑流转模板当前配置：有权修改最新模板配置，保规则身份与输入；配置待核先核同请求，业务执行待核不冻结独立配置维护，已开始run沿自身捕获方案。；来源 documentation/input/functions.json#FUNC-2035
- FUNC-2041 查看当前模板及绑定方案说明：只读查看四节点/入口/条件/承接方/方式，区分字段参考和实际应用分类，实际路由预览使用目标目录当前标签；不展示分类V1/V2选择。；来源 documentation/input/functions.json#FUNC-2041
- FUNC-2042 删除当前未被使用的模板定义：当前分类仍绑定或配置操作待核则阻删；否则在对象/品牌/并发依据一致时移除当前定义，不建旧模板归档兼容索引，已开始run靠完整planSnapshot继续办理。；来源 documentation/input/functions.json#FUNC-2042

来源根：`/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/开发交付包/工作资料/续接输入`；来源指纹：`0904ba9de2798ea9878d0602f5fbc337ae523a60911c1b10dac967c13febffbe`

## 前置任务

- TASK-009

## 只读代码上下文

未指定既有代码文件；从工程规范和产品依据读取上下文。

## 允许修改的文件

- 未填写

代码库根：`None`。未列出的文件不属于本任务修改范围；扩大范围需回到计划。

## 变更安排

- 未填写

## 逻辑与字段依据

先读 [全局逻辑](../global-logic.md)，再读本任务关联的局部逻辑与字段定义。

全局规则：[GR-AUTH](../global-logic.md#GR-AUTH)、[GR-CONFIG](../global-logic.md#GR-CONFIG)、[GR-END-ACTION](../global-logic.md#GR-END-ACTION)、[GR-FIELDS](../global-logic.md#GR-FIELDS)、[GR-NO-HISTORY](../global-logic.md#GR-NO-HISTORY)、[GR-PRIVACY](../global-logic.md#GR-PRIVACY)、[GR-SCOPE](../global-logic.md#GR-SCOPE)、[GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)

局部逻辑：[LOCAL-FLOW-TEMPLATE-CREATE](../local-logic/LOCAL-FLOW-TEMPLATE-CREATE.md)、[LOCAL-FLOW-TEMPLATE-EDIT](../local-logic/LOCAL-FLOW-TEMPLATE-EDIT.md)、[LOCAL-FLOW-TEMPLATE-READ](../local-logic/LOCAL-FLOW-TEMPLATE-READ.md)、[LOCAL-FLOW-TEMPLATE-DELETE](../local-logic/LOCAL-FLOW-TEMPLATE-DELETE.md)

字段：[FIELD-FLOW-BRANCH-KIND](../field-specs.md#FIELD-FLOW-BRANCH-KIND)、[FIELD-FLOW-BRANCH-PRIORITY](../field-specs.md#FIELD-FLOW-BRANCH-PRIORITY)、[FIELD-FLOW-BRAND-ID](../field-specs.md#FIELD-FLOW-BRAND-ID)、[FIELD-FLOW-CATEGORY-ID](../field-specs.md#FIELD-FLOW-CATEGORY-ID)、[FIELD-FLOW-EDGE-ID](../field-specs.md#FIELD-FLOW-EDGE-ID)、[FIELD-FLOW-EDGES](../field-specs.md#FIELD-FLOW-EDGES)、[FIELD-FLOW-EFFECTIVE-PLAN](../field-specs.md#FIELD-FLOW-EFFECTIVE-PLAN)、[FIELD-FLOW-END-ACTION](../field-specs.md#FIELD-FLOW-END-ACTION)、[FIELD-FLOW-ENTRY-CONTEXT](../field-specs.md#FIELD-FLOW-ENTRY-CONTEXT)、[FIELD-FLOW-ENTRY-RULES](../field-specs.md#FIELD-FLOW-ENTRY-RULES)、[FIELD-FLOW-GROUP-MODE](../field-specs.md#FIELD-FLOW-GROUP-MODE)、[FIELD-FLOW-METHOD](../field-specs.md#FIELD-FLOW-METHOD)、[FIELD-FLOW-NEXT-NODE](../field-specs.md#FIELD-FLOW-NEXT-NODE)、[FIELD-FLOW-NODE-ID](../field-specs.md#FIELD-FLOW-NODE-ID)、[FIELD-FLOW-NODE-NAME](../field-specs.md#FIELD-FLOW-NODE-NAME)、[FIELD-FLOW-NODE-TYPE](../field-specs.md#FIELD-FLOW-NODE-TYPE)、[FIELD-FLOW-NODES](../field-specs.md#FIELD-FLOW-NODES)、[FIELD-FLOW-RECIPIENT](../field-specs.md#FIELD-FLOW-RECIPIENT)、[FIELD-FLOW-REQUEST-ID](../field-specs.md#FIELD-FLOW-REQUEST-ID)、[FIELD-FLOW-REQUEST-STATUS](../field-specs.md#FIELD-FLOW-REQUEST-STATUS)、[FIELD-FLOW-RESULT-SOURCE](../field-specs.md#FIELD-FLOW-RESULT-SOURCE)、[FIELD-FLOW-ROUTE-MAIN](../field-specs.md#FIELD-FLOW-ROUTE-MAIN)、[FIELD-FLOW-RULE-FIELD](../field-specs.md#FIELD-FLOW-RULE-FIELD)、[FIELD-FLOW-RULE-ID](../field-specs.md#FIELD-FLOW-RULE-ID)、[FIELD-FLOW-RULE-OPERATOR](../field-specs.md#FIELD-FLOW-RULE-OPERATOR)、[FIELD-FLOW-RULE-SOURCE](../field-specs.md#FIELD-FLOW-RULE-SOURCE)、[FIELD-FLOW-RULE-VALUES](../field-specs.md#FIELD-FLOW-RULE-VALUES)、[FIELD-FLOW-RULES](../field-specs.md#FIELD-FLOW-RULES)、[FIELD-FLOW-TEMPLATE-ID](../field-specs.md#FIELD-FLOW-TEMPLATE-ID)、[FIELD-FLOW-TEMPLATE-NAME](../field-specs.md#FIELD-FLOW-TEMPLATE-NAME)、[FIELD-FLOW-TEMPLATE-REF-CATEGORY](../field-specs.md#FIELD-FLOW-TEMPLATE-REF-CATEGORY)、[FIELD-FLOW-TEMPLATE-REVISION](../field-specs.md#FIELD-FLOW-TEMPLATE-REVISION)

## UI 依据

[全局 UI 规范](../ui-spec.md)

- [UI-PAGE-2006](../ui-pages/UI-PAGE-2006.md)
- [UI-PAGE-2227](../ui-pages/UI-PAGE-2227.md)
- [UI-PAGE-2228](../ui-pages/UI-PAGE-2228.md)

## 实现要求

- 四组件职责固定；按名称→条件→下一节点→继续条件编辑，空目标只是草稿且不产生虚连线。
- 当前有出口配置须唯一末位ELSE；条件即时改，兼容operator保值，来源/字段或不兼容类型/基数清不适用值。
- END仅名称及DIRECT_FOLLOWUP/CLOSE二选一；多值换行提示、选择/拖线拒环、保存定位和错误同色反馈均按当前原型。
- 不恢复空白节点或V1/V2选择；历史运行用自身快照，当前配置未知请求仍须保护。
- 不恢复旧三按钮待应用层或END业务达成/承接配置；旧产品配置字段保留溯源，不改义复用。
- 按所引LOCAL逐动作落实触发/前后置/分支；业务定义只读同源规格，不另抄一套规则。
- 依赖表示实施契约/共享守卫先就绪，不新增用户操作门槛；跨任务端到端由验收批次合并检查。
- 目标库、模块/服务/表/接口、精确可写文件及命令由开发在开工前绑定；当前空文件清单不授代码写入权。

## 产品验收

- **AC-2109**：新模板自带唯一开始锚点，拖入转交/呼叫/结束即定类型和默认名称；首个业务节点及合法有序入口明确，不再空白节点二次选类型。
  依据：docs/functional-spec.json#AC-2109

- **AC-2110**：新run捕获完整有效plan并按实际分类记录，模板后续编辑/删除不追改已开run；导入成功定位即已开始。
  依据：docs/functional-spec.json#AC-2110

- **AC-2111**：同品牌模板/实际分类字段与业务域兼容；CALL不隐式换owner，OTHER先转交，不允许普通业务或门店直转越权。
  依据：docs/functional-spec.json#AC-2111

- **AC-2112**：条件支持独立IMPORT，AI状态/标签与人工/预外呼状态/填写；转交精确上游来源，条件配置不授自动呼叫/推进权。 整批明确DIRECT/TEMPLATE；DIRECT仍严守基础必填、类型、映射和唯一性，仅豁免路由附加资料，且不建run/node。
  依据：docs/functional-spec.json#AC-2112

- **AC-2113**：组ALL/ANY明确且已知时计算，标量IN/NOT_IN每行多个值，EQ/NE/大小比较单值；多选及AI标签包含任一/全部，空值独立。 DIRECT显式选择AI/MANUAL/PREDICTIVE，AI场景必选；已有业务启用流程不重复导入。
  依据：docs/functional-spec.json#AC-2113

- **AC-2114**：规则字段/选项/类型/作用域合法才可保存；未知不反向放行，逗号保文本，空白行忽略。普通交互保已有输入、比较值、滚动/展开；改变定义不静默丢值。
  依据：docs/functional-spec.json#AC-2114

- **AC-2136**：模板/实际路由只读说明展示当前四节点与入口、有序条件、承接方、方式和END后续动作（CLOSE或DIRECT_FOLLOWUP），参考与应用分明；记录内历史按其捕获方案只读，不提供V1/V2分类选择。
  依据：docs/functional-spec.json#AC-2136

- **AC-2137**：未被当前分类绑定且无同模板待核配置请求时可删除当前定义；前后对象/品牌/版本/引用重核，unknown核同请求，已开run和字段引用依靠自身快照，不建旧归档兼容索引。
  依据：docs/functional-spec.json#AC-2137

- **AC-2139**：所有有出口的当前新配置须有且仅有一个末位ELSE；IF/ELSE IF按优先级首命中，明确不匹配才到兜底，未知继续PENDING。保存/新导入/重开/启用均校验，不依赖DIRECT绕开分流。
  依据：docs/functional-spec.json#AC-2139

- **AC-2142**：节点按命名→条件→下一节点→继续条件编辑，末位轻量“其他情况”；未选目标可留编辑草稿但不产生业务连线，保存仍逐项拒绝缺项并定位。
  依据：docs/functional-spec.json#AC-2142

- **AC-2143**：条件修改直接进入当前草稿，不再显示待应用三按钮；兼容operator保值，字段/来源或不兼容类型/基数变化清不适用比较值，空判断清值。目标选择/拖线拒环并保原草稿，保存仍防绕过。
  依据：docs/functional-spec.json#AC-2143

- **AC-2145**：线索域转交组件允许CURRENT本租户分支；命中后保持owner、run及tenant阶段，不新建跨租户截止/轮次，不清原安排与封存结果，并重核后继CALL资格。OTHER仍执行原意向锚定和跨租户保护；CURRENT不冒充OTHER，拒伪造目标或过期令牌。
  依据：docs/functional-spec.json#AC-2145

- **AC-2146**：普通及START比较值提示“多个值请换行填写/每行一个值”，保持IN/NOT_IN类型含义；报错节点/START/提示区统一浅红，切换节点保留定位，编辑该节点清当前标记，保存重新判断，不改变原校验。
  依据：docs/functional-spec.json#AC-2146

## 测试要求（尚未执行）

### CHECK-FLOW-TEMPLATE-CREATE / manual

步骤：按当前续接版本执行：从流转模板新建／编辑当前配置。前提：当前品牌及配置管理资格真实有效；提交来源与当前上下文一致。操作：选择字段参考分类读最新字段，唯一开始锚点与组件确定类型；编排条件优先的入口/路径和单方式CALL，END仅选后续两动作；当前草稿可未选目标但不形成业务边；核稳定字段/类型/值/准确来源、唯一末位ELSE、合法目标/无环及并发后保存；报错定位当前节点。分别构造：单模板配置请求尚待核、条件不合法或并发已变；合法明确保存；条件已填但目标未选，或选择/拖线构成循环。

预期：业务执行待核不无必要冻结独立模板编辑，配置待核仍核原请求；保当前草稿并阻非法保存；字段/来源或不兼容类型/基数变化清不适用值，兼容operator保值，不再额外待应用确认；更新当前定义，不自动绑定任何分类、不起呼；已开run不追改；空目标仅留编辑草稿不生成虚连线；循环选择即时拒绝并保原目标；保存缺项/绕过仍拒绝并统一浅红定位。

覆盖：AC-2109, AC-2110, AC-2111, AC-2112, AC-2113, AC-2114, AC-2139, AC-2142, AC-2143, AC-2146

### CHECK-FLOW-TEMPLATE-EDIT / manual

步骤：按当前续接版本执行：从流转模板新建／编辑当前配置。前提：当前品牌及配置管理资格真实有效；提交来源与当前上下文一致。操作：选择字段参考分类读最新字段，唯一开始锚点与组件确定类型；编排条件优先的入口/路径和单方式CALL，END仅选后续两动作；当前草稿可未选目标但不形成业务边；核稳定字段/类型/值/准确来源、唯一末位ELSE、合法目标/无环及并发后保存；报错定位当前节点。分别构造：单模板配置请求尚待核、条件不合法或并发已变；合法明确保存；条件已填但目标未选，或选择/拖线构成循环。

预期：业务执行待核不无必要冻结独立模板编辑，配置待核仍核原请求；保当前草稿并阻非法保存；字段/来源或不兼容类型/基数变化清不适用值，兼容operator保值，不再额外待应用确认；更新当前定义，不自动绑定任何分类、不起呼；已开run不追改；空目标仅留编辑草稿不生成虚连线；循环选择即时拒绝并保原目标；保存缺项/绕过仍拒绝并统一浅红定位。

覆盖：AC-2109, AC-2110, AC-2111, AC-2112, AC-2113, AC-2114, AC-2139, AC-2142, AC-2143, AC-2145, AC-2146

### CHECK-FLOW-TEMPLATE-READ / manual

步骤：按当前续接版本执行：从列表、分类路由或业务方案查看模板说明。前提：有本品牌模板查看资格；不要求修改/删除权；读取业务run捕获方案时须有该业务准确读取权，不因此取得当前模板配置权。操作：读取准确当前模板或业务run捕获方案；分开显示字段参考和实际应用、入口、方式、承接方、条件及业务结论。分别构造：无权或读取失败；可读配置。

预期：只读不暴露无权业务/其他租户场景；明确无权/失败，不伪装没有配置；只读呈现，不生成运行或改变分类绑定。

覆盖：AC-2136

### CHECK-FLOW-TEMPLATE-DELETE / manual

步骤：本动作适用模式以当前前置条件为准；原模板例仅用于TEMPLATE。在准确模板删除预检后确认。当前品牌及配置管理资格真实有效；提交来源与当前上下文一致。依次执行：只核当前实际分类绑定与未核配置，读取前后使用指纹；准确对象和并发依据一致时移除当前定义，记录本次请求结果。分别构造：当前类别仍绑定或同模板配置待核；仅当前run捕获依赖且没有当前绑定；结果unknown

预期：阻删并说明实际使用/核对入口；分类当前只支持更换路由模板，无解绑按钮；可以删除定义，run完整快照仍可继续；保原requestId核对，不重复删除；不维护旧模板归档兼容索引，不损已捕获业务事实

覆盖：AC-2137

## 完成条件

- 四组件职责固定；按名称→条件→下一节点→继续条件编辑，空目标只是草稿且不产生虚连线。
- 当前有出口配置须唯一末位ELSE；条件即时改，兼容operator保值，来源/字段或不兼容类型/基数清不适用值。
- END仅名称及DIRECT_FOLLOWUP/CLOSE二选一；多值换行提示、选择/拖线拒环、保存定位和错误同色反馈均按当前原型。
- 本任务全部同ID验收检查有当前实现、正常/拒绝/失败/未知证据，关联页面五态及字段权限符合原规格。
- 开发完成目标库/精确文件/模块/数据接口/测试执行绑定，必要共享文件先后依赖已补齐，工程问题有可靠结论。
- 产品变动回产品规格重审；不可用局部实现或Mock结论替代真实远端与正式开工许可。

需保留实际改动、测试结果和 Review 证据。仅修改完成不等于验收通过。


## 本轮工程绑定边界

本任务为可承接的业务实施分解，尚未绑定生产仓库/技术栈。开发确定真实文件后填写allowed_files、context_files、changes并复检共享文件依赖；不得把原型参考文件当作生产可写授权。

只读原型行为参考：

- [four-node-model.js](../../../prototype/scripts/four-node-model.js) · 只读行为参考，非生产可写目标
- [flow-canvas-ui.js](../../../prototype/scripts/flow-canvas-ui.js) · 只读行为参考，非生产可写目标
- [flow-node-config.js](../../../prototype/scripts/flow-node-config.js) · 只读行为参考，非生产可写目标
- [template_lifecycle_build.py](../../../prototype/scripts/template_lifecycle_build.py) · 只读行为参考，非生产可写目标

需开发处理的问题：ENG-FLOW-PERSISTENCE。
