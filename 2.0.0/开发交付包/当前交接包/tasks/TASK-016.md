# TASK-016 任务确认与人工分配方式/坐席

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md)

- [明确发起当前呼叫及同组批呼叫 · FUNC\-2031](../features/FUNC-2031.md)
- [创建四节点流转模板 · FUNC\-2034](../features/FUNC-2034.md)
- [分配本租户具体任务或坐席及执行优先级 · FUNC\-2037](../features/FUNC-2037.md)

## 目标

人工默认MANUAL待分配，可随后原单条/批量分配seat；SPECIFIC_SEAT才必选seat。PRED只任务，AI任务+scene。；模板、导入及分配独立责任人控件全部移除；人工责任由有效seat.accountId派生，AI/PRED不伪填actor为负责人。

## 产品依据

- FUNC-2031 明确发起当前呼叫及同组批呼叫：明确发起同租户DIRECT或TEMPLATE当前CALL的AI/人工/预外呼，重核准确资源/场景、本人资格、串行和联系限制。人工待分配不先起呼，AI/PRED无独立责任人要求；同组AI/预外呼按五档/FIFO统一总序逐条核验及反馈，不抢占在途。直接周期完成后显式下一方式建立新周期，旧事实保持。；来源 documentation/input/functions.json#FUNC-2031
- FUNC-2034 创建四节点流转模板：以字段参考分类读取条件来源，在唯一开始锚点编排转交、呼叫、结束；每CALL单方式、有序首命中路径。人工默认MANUAL可无seat先保存，SPECIFIC_SEAT才必选有效seat；PRED默认只任务，AI默认任务+scene，无默认责任人控件。CALL默认五档等级与分租户目标维护不扩大资源权，保存模板不绑定业务。；来源 documentation/input/functions.json#FUNC-2034
- FUNC-2037 分配本租户具体任务或坐席及执行优先级：DIRECT与TEMPLATE共用任务或人工分配方式/坐席及五档等级：人工默认待分配、指定坐席才必选seat；PRED只任务，AI任务+scene。模板/导入/分配无独立责任人输入，实际人员由坐席分配及真实执行/接听事实记录；保留原单条/批量分配，不改owner或自动起呼。；来源 documentation/input/functions.json#FUNC-2037

来源根：`/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/开发交付包/工作资料/续接输入`；来源指纹：`b0292b83ba50e66ed754b44bc97cfa25bab040c4f00b70baa8e542df666aeccf`

## 前置任务

- TASK-015
- TASK-032
- TASK-049

## 只读代码上下文

未指定既有代码文件；从工程规范和产品依据读取上下文。

## 允许修改的文件

- 未填写

代码库根：`None`。未列出的文件不属于本任务修改范围；扩大范围需回到计划。

## 变更安排

- 未填写

## 逻辑与字段依据

先读 [全局逻辑](../global-logic.md)，再读本任务关联的局部逻辑与字段定义。

全局规则：[GR-ASSIGNMENT-SIMPLIFICATION](../global-logic.md#GR-ASSIGNMENT-SIMPLIFICATION)、[GR-AUTH](../global-logic.md#GR-AUTH)、[GR-CONFIG](../global-logic.md#GR-CONFIG)、[GR-DATA-FACTS](../global-logic.md#GR-DATA-FACTS)、[GR-EXECUTION-ARRANGEMENT](../global-logic.md#GR-EXECUTION-ARRANGEMENT)、[GR-HANDLING-MODE](../global-logic.md#GR-HANDLING-MODE)、[GR-LIFECYCLE-SETTLEMENT](../global-logic.md#GR-LIFECYCLE-SETTLEMENT)、[GR-SCOPE](../global-logic.md#GR-SCOPE)、[GR-SERIAL](../global-logic.md#GR-SERIAL)

局部逻辑：[LOCAL-FLOW-ASSIGN](../local-logic/LOCAL-FLOW-ASSIGN.md)、[LOCAL-FLOW-ASSIGN-BATCH](../local-logic/LOCAL-FLOW-ASSIGN-BATCH.md)、[LOCAL-FLOW-AI-SCENE](../local-logic/LOCAL-FLOW-AI-SCENE.md)

字段：[FIELD-FLOW-AI-SCENE](../field-specs.md#FIELD-FLOW-AI-SCENE)、[FIELD-FLOW-ALLOW-DIRECT-FOLLOWUP](../field-specs.md#FIELD-FLOW-ALLOW-DIRECT-FOLLOWUP)、[FIELD-FLOW-ARRANGEMENT](../field-specs.md#FIELD-FLOW-ARRANGEMENT)、[FIELD-FLOW-CATEGORY-ID](../field-specs.md#FIELD-FLOW-CATEGORY-ID)、[FIELD-FLOW-DIRECT-CYCLE-ID](../field-specs.md#FIELD-FLOW-DIRECT-CYCLE-ID)、[FIELD-FLOW-DIRECT-METHOD](../field-specs.md#FIELD-FLOW-DIRECT-METHOD)、[FIELD-FLOW-DIRECT-STATUS](../field-specs.md#FIELD-FLOW-DIRECT-STATUS)、[FIELD-FLOW-EFFECTIVE-PLAN](../field-specs.md#FIELD-FLOW-EFFECTIVE-PLAN)、[FIELD-FLOW-END-FOLLOWUP-ORIGIN](../field-specs.md#FIELD-FLOW-END-FOLLOWUP-ORIGIN)、[FIELD-FLOW-EXECUTION-PRIORITY](../field-specs.md#FIELD-FLOW-EXECUTION-PRIORITY)、[FIELD-FLOW-EXECUTION-QUEUE-SEQUENCE](../field-specs.md#FIELD-FLOW-EXECUTION-QUEUE-SEQUENCE)、[FIELD-FLOW-EXECUTION-QUEUED-AT](../field-specs.md#FIELD-FLOW-EXECUTION-QUEUED-AT)、[FIELD-FLOW-EXECUTION-RESOURCE](../field-specs.md#FIELD-FLOW-EXECUTION-RESOURCE)、[FIELD-FLOW-FOLLOWER](../field-specs.md#FIELD-FLOW-FOLLOWER)、[FIELD-FLOW-HANDLING-MODE](../field-specs.md#FIELD-FLOW-HANDLING-MODE)、[FIELD-FLOW-MANUAL-ASSIGNMENT-MODE](../field-specs.md#FIELD-FLOW-MANUAL-ASSIGNMENT-MODE)、[FIELD-FLOW-METHOD](../field-specs.md#FIELD-FLOW-METHOD)、[FIELD-FLOW-OWNER-TENANT](../field-specs.md#FIELD-FLOW-OWNER-TENANT)、[FIELD-FLOW-RECIPIENT](../field-specs.md#FIELD-FLOW-RECIPIENT)、[FIELD-FLOW-RECORD-ID](../field-specs.md#FIELD-FLOW-RECORD-ID)、[FIELD-FLOW-RECORD-REVISION](../field-specs.md#FIELD-FLOW-RECORD-REVISION)、[FIELD-FLOW-RESULT-SOURCE](../field-specs.md#FIELD-FLOW-RESULT-SOURCE)、[FIELD-FLOW-SCENE-SNAPSHOT](../field-specs.md#FIELD-FLOW-SCENE-SNAPSHOT)

## UI 依据

[全局 UI 规范](../ui-spec.md)

- [UI-PAGE-2204](../ui-pages/UI-PAGE-2204.md)
- [UI-PAGE-2227](../ui-pages/UI-PAGE-2227.md)

## 实现要求

- 人工默认MANUAL待分配，可随后原单条/批量分配seat；SPECIFIC_SEAT才必选seat。PRED只任务，AI任务+scene。
- 模板、导入及分配独立责任人控件全部移除；人工责任由有效seat.accountId派生，AI/PRED不伪填actor为负责人。
- 实际人工起呼须为所选坐席对应本人，责任跟进人单独保留；任务内线路/队列参数沿专业配置，不自动授电话权或起呼。
- 实际发起/拨打/接听及填写事实分别记录，谁接听谁填写；取消person必填不扩大任务/租户/模块权。
- 按所引LOCAL逐动作落实触发/前后置/分支；业务定义只读同源规格，不另抄一套规则。
- 依赖表示实施契约/共享守卫先就绪，不新增用户操作门槛；跨任务端到端由验收批次合并检查。
- 目标库、模块/服务/表/接口、精确可写文件及命令由开发在开工前绑定；当前空文件清单不授代码写入权。

## 产品验收

- **AC-2111**：同品牌模板/实际分类字段与业务域兼容；CALL不隐式换owner，OTHER先转交，不允许普通业务或门店直转越权。
  依据：docs/functional-spec.json#AC-2111

- **AC-2118**：两模式按方式安排任务或人工分配方式/坐席、必要scene及五档等级；模板、导入、分配不再选择独立责任人。人工MANUAL可先待分配，PRED只任务，AI任务+scene，不改owner或自动起呼。
  依据：docs/functional-spec.json#AC-2118

- **AC-2119**：仅当前管理员及分配动作权；核active run/本租户/节点/无在途执行/人员与场景。批量同权威组任一不满足全组不写；普通运营仍可按资格AI/预外呼起呼。
  依据：docs/functional-spec.json#AC-2119

- **AC-2150**：两模式AI任务+scene、PRED仅任务，人工MANUAL待分配或SPECIFIC_SEAT才必选seat；实际发起复核准确资源，人工须已分配且本人办理，不选择独立责任人。
  依据：docs/functional-spec.json#AC-2150

- **AC-2156**：预外呼只必选具体任务，坐席/队列/策略沿任务；AI仍必选任务和适配scene。模板默认、导入和分配均无独立责任跟进人选择，不因缺少该值阻合法任务安排/发起，也不伪填当前actor为负责人。
  依据：docs/functional-spec.json#AC-2156

## 测试要求（尚未执行）

### CHECK-FLOW-ASSIGN / manual

步骤：按当前Step45生命周期规则：在直接跟进业务或当前CALL记录点击安排；按当前模式/方式读取本租户有权任务/场景或坐席；不读取独立责任人候选作为必填；人工默认MANUAL可先待分配，SPECIFIC_SEAT才必选seat；PRED只任务，AI任务+scene，不选择独立责任人；保存五档等级，人员仅由seat或真实执行事实产生，不改owner/模板方式、不自动起呼；构造无权/缺确认/过期/真实在途或unknown/事实冲突对照。

预期：按钮、上下文和模型动作资格一致；保原身份/当前值/未完成事实及真实统计，不代填、不借历史END给新周期续权、不提前释放。

覆盖：AC-2118, AC-2119

### CHECK-FLOW-EXECUTION-TARGET / manual

步骤：按当前Step45生命周期规则：在直接跟进业务或当前CALL记录点击安排；按当前模式/方式读取本租户有权任务/场景或坐席；不读取独立责任人候选作为必填；人工默认MANUAL可先待分配，SPECIFIC_SEAT才必选seat；PRED只任务，AI任务+scene，不选择独立责任人；保存五档等级，人员仅由seat或真实执行事实产生，不改owner/模板方式、不自动起呼；构造无权/缺确认/过期/真实在途或unknown/事实冲突对照。

预期：按钮、上下文和模型动作资格一致；保原身份/当前值/未完成事实及真实统计，不代填、不借历史END给新周期续权、不提前释放。

覆盖：AC-2118, AC-2150

### CHECK-FLOW-TASK-WITHOUT-FOLLOWER / manual

步骤：按当前Step45生命周期规则：在直接跟进业务或当前CALL记录点击安排；按当前模式/方式读取本租户有权任务/场景或坐席；不读取独立责任人候选作为必填；人工默认MANUAL可先待分配，SPECIFIC_SEAT才必选seat；PRED只任务，AI任务+scene，不选择独立责任人；保存五档等级，人员仅由seat或真实执行事实产生，不改owner/模板方式、不自动起呼；构造无权/缺确认/过期/真实在途或unknown/事实冲突对照。

预期：按钮、上下文和模型动作资格一致；保原身份/当前值/未完成事实及真实统计，不代填、不借历史END给新周期续权、不提前释放。

覆盖：AC-2156

### CHECK-FLOW-ASSIGN-BATCH / manual

步骤：按当前Step43安排规则：勾选同组记录后分配跟进人；逐条读取实际可安排上下文并求共同有效候选；同组按方式确认任务或人工分配方式/坐席、必要scene及五档等级，不选择独立责任人；任一资源无权或失效全组不写；DIRECT按模式/分类/方式/场景等当前权威安排分组，TEMPLATE另按run捕获方案和CALL身份分组；混组拒绝，不以空nodeId误合直接业务；同组共同候选中选择本方式具体任务或人工分配方式/坐席、必要AI场景及五档等级，逐条重核后同次写入；任一行失败全组不写，保原手动分配入口。；。同时构造资源失效、异租户、未知/在途及人工SPECIFIC缺seat反例。

预期：不按相同nodeId误合不同模板组；全组不写，提示分组或具体不合格原因；同次保存组内安排，不自动批起呼；人工MANUAL可先待分配；PRED只任务/AI任务+scene无独立人员必填，权限/五档/FIFO与历史继续。

覆盖：AC-2119

### CHECK-FLOW-AI-SCENE / manual

步骤：本动作适用模式以当前前置条件为准；原模板例仅用于TEMPLATE。导入直接AI或当前AI安排显式选择场景。实际执行租户及当前成员有AI使用模块；真实场景目录可核。依次执行：只投影实际租户/分类当前启用场景，不要求标签维护权；汇总本CALL及下游取数节点的AI_TAG依赖，核supplier/tenant/type/tagScene/revision与合法tag IDs。分别构造：需标签依赖但当前上下文不一致；普通AI无标签条件依赖；首节点先转交

预期：阻选择/起呼并指出需核流程与场景，不把其他租户标签替代；沿执行配置有效性可正常选/起呼，不因闲置标签metadata强绑；原方不选目标私有场景，接收方接续再选；场景不是客户永久属性，受理后按实际快照保留

覆盖：AC-2118, AC-2119, AC-2111

## 完成条件

- 人工默认MANUAL待分配，可随后原单条/批量分配seat；SPECIFIC_SEAT才必选seat。PRED只任务，AI任务+scene。
- 模板、导入及分配独立责任人控件全部移除；人工责任由有效seat.accountId派生，AI/PRED不伪填actor为负责人。
- 本任务全部同ID验收检查有当前实现、正常/拒绝/失败/未知证据，关联页面五态及字段权限符合原规格。
- 开发完成目标库/精确文件/模块/数据接口/测试执行绑定，必要共享文件先后依赖已补齐，工程问题有可靠结论。
- 产品变动回产品规格重审；不可用局部实现或Mock结论替代真实远端与正式开工许可。

需保留实际改动、测试结果和 Review 证据。仅修改完成不等于验收通过。


## 本轮工程绑定边界

本任务为可承接的业务实施分解，尚未绑定生产仓库/技术栈。开发确定真实文件后填写allowed_files、context_files、changes并复检共享文件依赖；不得把原型参考文件当作生产可写授权。

只读原型行为参考：

- [four-node-model.js](../../../prototype/scripts/four-node-model.js) · 只读行为参考，非生产可写目标
- [four-node-workspace.js](../../../prototype/js/adapters/four-node-workspace.js) · 只读行为参考，非生产可写目标
- [four-node-execution.js](../../../prototype/js/adapters/four-node-execution.js) · 只读行为参考，非生产可写目标

需开发处理的问题：ENG-FLOW-SCENE。
