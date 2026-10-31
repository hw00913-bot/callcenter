# TASK-012 实际分类独立绑定当前路由

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md)

- [在实际业务分类独立绑定单模板路由 · FUNC\-2040](../features/FUNC-2040.md)

## 目标

在业务分类独立路由入口选一个同品牌兼容模板，准确核用到的字段/选项/AI上下文。；新运行消费当前明确配置，已开始运行保持封存方案；基础配置与路由互不覆盖。

## 产品依据

- FUNC-2040 在实际业务分类独立绑定单模板路由：分类路由是唯一实际应用绑定处；同品牌不同字段参考分类可复用，按实际所用字段、AI准确上下文及业务域校验，确认保存不覆盖BASE。；来源 documentation/input/functions.json#FUNC-2040

来源根：`/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/开发交付包/工作资料/续接输入`；来源指纹：`0904ba9de2798ea9878d0602f5fbc337ae523a60911c1b10dac967c13febffbe`

## 前置任务

- TASK-011

## 只读代码上下文

未指定既有代码文件；从工程规范和产品依据读取上下文。

## 允许修改的文件

- 未填写

代码库根：`None`。未列出的文件不属于本任务修改范围；扩大范围需回到计划。

## 变更安排

- 未填写

## 逻辑与字段依据

先读 [全局逻辑](../global-logic.md)，再读本任务关联的局部逻辑与字段定义。

全局规则：[GR-AUTH](../global-logic.md#GR-AUTH)、[GR-CONFIG](../global-logic.md#GR-CONFIG)、[GR-END-ACTION](../global-logic.md#GR-END-ACTION)、[GR-FIELDS](../global-logic.md#GR-FIELDS)、[GR-SCOPE](../global-logic.md#GR-SCOPE)、[GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)

局部逻辑：[LOCAL-FLOW-ROUTE-BIND](../local-logic/LOCAL-FLOW-ROUTE-BIND.md)

字段：[FIELD-FLOW-BRANCH-KIND](../field-specs.md#FIELD-FLOW-BRANCH-KIND)、[FIELD-FLOW-BRANCH-PRIORITY](../field-specs.md#FIELD-FLOW-BRANCH-PRIORITY)、[FIELD-FLOW-BRAND-ID](../field-specs.md#FIELD-FLOW-BRAND-ID)、[FIELD-FLOW-CATEGORY-ID](../field-specs.md#FIELD-FLOW-CATEGORY-ID)、[FIELD-FLOW-CATEGORY-REVISION](../field-specs.md#FIELD-FLOW-CATEGORY-REVISION)、[FIELD-FLOW-EDGE-ID](../field-specs.md#FIELD-FLOW-EDGE-ID)、[FIELD-FLOW-EDGES](../field-specs.md#FIELD-FLOW-EDGES)、[FIELD-FLOW-EFFECTIVE-PLAN](../field-specs.md#FIELD-FLOW-EFFECTIVE-PLAN)、[FIELD-FLOW-END-ACTION](../field-specs.md#FIELD-FLOW-END-ACTION)、[FIELD-FLOW-ENTRY-CONTEXT](../field-specs.md#FIELD-FLOW-ENTRY-CONTEXT)、[FIELD-FLOW-ENTRY-RULES](../field-specs.md#FIELD-FLOW-ENTRY-RULES)、[FIELD-FLOW-FIELD-ENABLED](../field-specs.md#FIELD-FLOW-FIELD-ENABLED)、[FIELD-FLOW-FIELD-ID](../field-specs.md#FIELD-FLOW-FIELD-ID)、[FIELD-FLOW-FIELD-KEY](../field-specs.md#FIELD-FLOW-FIELD-KEY)、[FIELD-FLOW-FIELD-LABEL](../field-specs.md#FIELD-FLOW-FIELD-LABEL)、[FIELD-FLOW-FIELD-OPTIONS](../field-specs.md#FIELD-FLOW-FIELD-OPTIONS)、[FIELD-FLOW-FIELD-TYPE](../field-specs.md#FIELD-FLOW-FIELD-TYPE)、[FIELD-FLOW-FIELD-USAGE](../field-specs.md#FIELD-FLOW-FIELD-USAGE)、[FIELD-FLOW-GROUP-MODE](../field-specs.md#FIELD-FLOW-GROUP-MODE)、[FIELD-FLOW-METHOD](../field-specs.md#FIELD-FLOW-METHOD)、[FIELD-FLOW-NEXT-NODE](../field-specs.md#FIELD-FLOW-NEXT-NODE)、[FIELD-FLOW-NODE-ID](../field-specs.md#FIELD-FLOW-NODE-ID)、[FIELD-FLOW-NODE-NAME](../field-specs.md#FIELD-FLOW-NODE-NAME)、[FIELD-FLOW-NODE-TYPE](../field-specs.md#FIELD-FLOW-NODE-TYPE)、[FIELD-FLOW-NODES](../field-specs.md#FIELD-FLOW-NODES)、[FIELD-FLOW-RECIPIENT](../field-specs.md#FIELD-FLOW-RECIPIENT)、[FIELD-FLOW-REQUEST-ID](../field-specs.md#FIELD-FLOW-REQUEST-ID)、[FIELD-FLOW-REQUEST-STATUS](../field-specs.md#FIELD-FLOW-REQUEST-STATUS)、[FIELD-FLOW-RESULT-SOURCE](../field-specs.md#FIELD-FLOW-RESULT-SOURCE)、[FIELD-FLOW-ROUTE-MAIN](../field-specs.md#FIELD-FLOW-ROUTE-MAIN)、[FIELD-FLOW-ROUTE-VERSION](../field-specs.md#FIELD-FLOW-ROUTE-VERSION)、[FIELD-FLOW-RULE-FIELD](../field-specs.md#FIELD-FLOW-RULE-FIELD)、[FIELD-FLOW-RULE-ID](../field-specs.md#FIELD-FLOW-RULE-ID)、[FIELD-FLOW-RULE-OPERATOR](../field-specs.md#FIELD-FLOW-RULE-OPERATOR)、[FIELD-FLOW-RULE-SOURCE](../field-specs.md#FIELD-FLOW-RULE-SOURCE)、[FIELD-FLOW-RULE-VALUES](../field-specs.md#FIELD-FLOW-RULE-VALUES)、[FIELD-FLOW-RULES](../field-specs.md#FIELD-FLOW-RULES)、[FIELD-FLOW-TEMPLATE-ID](../field-specs.md#FIELD-FLOW-TEMPLATE-ID)、[FIELD-FLOW-TEMPLATE-NAME](../field-specs.md#FIELD-FLOW-TEMPLATE-NAME)、[FIELD-FLOW-TEMPLATE-REF-CATEGORY](../field-specs.md#FIELD-FLOW-TEMPLATE-REF-CATEGORY)、[FIELD-FLOW-TEMPLATE-REVISION](../field-specs.md#FIELD-FLOW-TEMPLATE-REVISION)

## UI 依据

[全局 UI 规范](../ui-spec.md)

- [UI-PAGE-2006](../ui-pages/UI-PAGE-2006.md)

## 实现要求

- 在业务分类独立路由入口选一个同品牌兼容模板，准确核用到的字段/选项/AI上下文。
- 新运行消费当前明确配置，已开始运行保持封存方案；基础配置与路由互不覆盖。
- 模板字段参考分类不能冒充实际绑定；DIRECT不得因为本能力存在而被要求绑定模板。
- 按所引LOCAL逐动作落实触发/前后置/分支；业务定义只读同源规格，不另抄一套规则。
- 依赖表示实施契约/共享守卫先就绪，不新增用户操作门槛；跨任务端到端由验收批次合并检查。
- 目标库、模块/服务/表/接口、精确可写文件及命令由开发在开工前绑定；当前空文件清单不授代码写入权。

## 产品验收

- **AC-2104**：实际应用绑定唯一在分类路由；同品牌不同字段参考分类模板可选，校实际所需字段及AI上下文，只有一个当前模板，无主备/接续映射。
  依据：docs/functional-spec.json#AC-2104

- **AC-2106**：分类列表独立路由入口和独立保存，基础表单不嵌模板；预览区分字段参考分类与实际应用分类，用目标目录显示条件。
  依据：docs/functional-spec.json#AC-2106

- **AC-2107**：路由仅更新本次单模板应用及兼容依据，提交核基础/字段/路由并发，不覆盖BASE；unknown配置不进入新业务。 DIRECT只由分类显式allowDirectFollowup开放；TEMPLATE路由缺失/待核不能自动降级DIRECT。
  依据：docs/functional-spec.json#AC-2107

- **AC-2108**：新运行使用当前明确确认的分类/模板；已定位首业务节点的run保持原方案，只可完成或废弃后新run，不运行中换绑。
  依据：docs/functional-spec.json#AC-2108

- **AC-2134**：路由保存需当前配置资格、同品牌、真实兼容目标字段与类型/用途/选项、AI准确配置，失败/过期/unknown均有明确反馈并保本次草稿。
  依据：docs/functional-spec.json#AC-2134

- **AC-2135**：分类BASE、独立ROUTE、模板字段参考互不覆盖；实际绑定按所用稳定ID/用途/类型/选项/AI上下文校验，新跟进取最新资料而正式/运行快照不追改，未操作/缺失/明确清空分开。
  依据：docs/functional-spec.json#AC-2135

- **AC-2139**：所有有出口的当前新配置须有且仅有一个末位ELSE；IF/ELSE IF按优先级首命中，明确不匹配才到兜底，未知继续PENDING。保存/新导入/重开/启用均校验，不依赖DIRECT绕开分流。
  依据：docs/functional-spec.json#AC-2139

## 测试要求（尚未执行）

### CHECK-FLOW-ROUTE-BIND / manual

步骤：按当前续接版本执行：从已保存分类的路由配置选择并保存模板。前提：当前品牌及配置管理资格真实有效；提交来源与当前上下文一致。操作：列本品牌全部当前模板，不按字段参考分类硬筛选；按实际分类所用稳定字段/用途/类型/选项、AI上下文、LEAD转交域生成有效预览；只保存必选单模板应用关系或更换该模板，不提供解绑；重核BASE/fields/route依据，不写基础。分别构造：缺所用字段/上下文、跨品牌或配置待核；明确成功；结果未知或冲突。

预期：参考与应用保持分离，分类字段/名称不被覆盖；阻保存并具体说明，不按同名猜配；新run用本次当前关系，已开run按原完整plan；保本次选择，核同请求或重读，不接收新run。

覆盖：AC-2104, AC-2106, AC-2107, AC-2108, AC-2134, AC-2135, AC-2139

## 完成条件

- 在业务分类独立路由入口选一个同品牌兼容模板，准确核用到的字段/选项/AI上下文。
- 新运行消费当前明确配置，已开始运行保持封存方案；基础配置与路由互不覆盖。
- 本任务全部同ID验收检查有当前实现、正常/拒绝/失败/未知证据，关联页面五态及字段权限符合原规格。
- 开发完成目标库/精确文件/模块/数据接口/测试执行绑定，必要共享文件先后依赖已补齐，工程问题有可靠结论。
- 产品变动回产品规格重审；不可用局部实现或Mock结论替代真实远端与正式开工许可。

需保留实际改动、测试结果和 Review 证据。仅修改完成不等于验收通过。


## 本轮工程绑定边界

本任务为可承接的业务实施分解，尚未绑定生产仓库/技术栈。开发确定真实文件后填写allowed_files、context_files、changes并复检共享文件依赖；不得把原型参考文件当作生产可写授权。

只读原型行为参考：

- [four-node-model.js](../../../prototype/scripts/four-node-model.js) · 只读行为参考，非生产可写目标
- [flow-routing-store.js](../../../prototype/scripts/flow-routing-store.js) · 只读行为参考，非生产可写目标

需开发处理的问题：ENG-FLOW-SCENE。
