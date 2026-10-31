# TASK-016 跟进人分配、同组批量及AI安排

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md)

- [明确发起当前呼叫及同组批呼叫 · FUNC\-2031](../features/FUNC-2031.md)
- [创建四节点流转模板 · FUNC\-2034](../features/FUNC-2034.md)
- [分配本租户责任跟进人与AI安排 · FUNC\-2037](../features/FUNC-2037.md)

## 目标

只安排当前负责租户的责任跟进人及必要本租户AI场景，保留原方式与归属。；同组批量分配逐条重核，整组提交失败不部分写；场景失效可在无执行占用时明确重选。

## 产品依据

- FUNC-2031 明确发起当前呼叫及同组批呼叫：明确发起同租户DIRECT或TEMPLATE当前CALL的AI/人工/预外呼；按准确模式身份核串行、本人/场景/资源和联系限制，同组AI/预外呼可逐条核验后批量发起。 已完成直接业务可显式选下一次方式建立独立直接周期，清旧责任安排后重新分配。；来源 documentation/input/functions.json#FUNC-2031
- FUNC-2034 创建四节点流转模板：以字段参考分类读取条件来源，在唯一开始锚点编排转交、呼叫、结束，组件定类型、每CALL单方式、有序首命中路径，保存模板不绑定业务。；来源 documentation/input/functions.json#FUNC-2034
- FUNC-2037 分配本租户责任跟进人与AI安排：按准确当前模式/方式只分配本租户责任跟进人，AI场景在导入与分配同一安排明确；不选择任务/线路/队列，不改owner/方式、不自动起呼。；来源 documentation/input/functions.json#FUNC-2037

来源根：`/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/开发交付包/工作资料/续接输入`；来源指纹：`0904ba9de2798ea9878d0602f5fbc337ae523a60911c1b10dac967c13febffbe`

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

全局规则：[GR-AUTH](../global-logic.md#GR-AUTH)、[GR-CONFIG](../global-logic.md#GR-CONFIG)、[GR-DATA-FACTS](../global-logic.md#GR-DATA-FACTS)、[GR-HANDLING-MODE](../global-logic.md#GR-HANDLING-MODE)、[GR-SCOPE](../global-logic.md#GR-SCOPE)、[GR-SERIAL](../global-logic.md#GR-SERIAL)

局部逻辑：[LOCAL-FLOW-ASSIGN](../local-logic/LOCAL-FLOW-ASSIGN.md)、[LOCAL-FLOW-ASSIGN-BATCH](../local-logic/LOCAL-FLOW-ASSIGN-BATCH.md)、[LOCAL-FLOW-AI-SCENE](../local-logic/LOCAL-FLOW-AI-SCENE.md)

字段：[FIELD-FLOW-AI-SCENE](../field-specs.md#FIELD-FLOW-AI-SCENE)、[FIELD-FLOW-ALLOW-DIRECT-FOLLOWUP](../field-specs.md#FIELD-FLOW-ALLOW-DIRECT-FOLLOWUP)、[FIELD-FLOW-ARRANGEMENT](../field-specs.md#FIELD-FLOW-ARRANGEMENT)、[FIELD-FLOW-CATEGORY-ID](../field-specs.md#FIELD-FLOW-CATEGORY-ID)、[FIELD-FLOW-DIRECT-CYCLE-ID](../field-specs.md#FIELD-FLOW-DIRECT-CYCLE-ID)、[FIELD-FLOW-DIRECT-METHOD](../field-specs.md#FIELD-FLOW-DIRECT-METHOD)、[FIELD-FLOW-DIRECT-STATUS](../field-specs.md#FIELD-FLOW-DIRECT-STATUS)、[FIELD-FLOW-EFFECTIVE-PLAN](../field-specs.md#FIELD-FLOW-EFFECTIVE-PLAN)、[FIELD-FLOW-END-FOLLOWUP-ORIGIN](../field-specs.md#FIELD-FLOW-END-FOLLOWUP-ORIGIN)、[FIELD-FLOW-FOLLOWER](../field-specs.md#FIELD-FLOW-FOLLOWER)、[FIELD-FLOW-HANDLING-MODE](../field-specs.md#FIELD-FLOW-HANDLING-MODE)、[FIELD-FLOW-METHOD](../field-specs.md#FIELD-FLOW-METHOD)、[FIELD-FLOW-OWNER-TENANT](../field-specs.md#FIELD-FLOW-OWNER-TENANT)、[FIELD-FLOW-RECIPIENT](../field-specs.md#FIELD-FLOW-RECIPIENT)、[FIELD-FLOW-RECORD-ID](../field-specs.md#FIELD-FLOW-RECORD-ID)、[FIELD-FLOW-RECORD-REVISION](../field-specs.md#FIELD-FLOW-RECORD-REVISION)、[FIELD-FLOW-RESULT-SOURCE](../field-specs.md#FIELD-FLOW-RESULT-SOURCE)、[FIELD-FLOW-SCENE-SNAPSHOT](../field-specs.md#FIELD-FLOW-SCENE-SNAPSHOT)

## UI 依据

[全局 UI 规范](../ui-spec.md)

- [UI-PAGE-2204](../ui-pages/UI-PAGE-2204.md)
- [UI-PAGE-2227](../ui-pages/UI-PAGE-2227.md)

## 实现要求

- 只安排当前负责租户的责任跟进人及必要本租户AI场景，保留原方式与归属。
- 同组批量分配逐条重核，整组提交失败不部分写；场景失效可在无执行占用时明确重选。
- 不新增坐席/任务/线路选择；场景使用不要求标签维护权；分配不自动起呼。
- 按所引LOCAL逐动作落实触发/前后置/分支；业务定义只读同源规格，不另抄一套规则。
- 依赖表示实施契约/共享守卫先就绪，不新增用户操作门槛；跨任务端到端由验收批次合并检查。
- 目标库、模块/服务/表/接口、精确可写文件及命令由开发在开工前绑定；当前空文件清单不授代码写入权。

## 产品验收

- **AC-2111**：同品牌模板/实际分类字段与业务域兼容；CALL不隐式换owner，OTHER先转交，不允许普通业务或门店直转越权。
  依据：docs/functional-spec.json#AC-2111

- **AC-2118**：分配只确定当前租户责任跟进人和必要AI场景，方式已由节点明确，不选择坐席/任务，不改owner、不自动起呼。
  依据：docs/functional-spec.json#AC-2118

- **AC-2119**：仅当前管理员及分配动作权；核active run/本租户/节点/无在途执行/人员与场景。批量同权威组任一不满足全组不写；普通运营仍可按资格AI/预外呼起呼。
  依据：docs/functional-spec.json#AC-2119

## 测试要求（尚未执行）

### CHECK-FLOW-ASSIGN / manual

步骤：按当前续接版本执行：在直接跟进业务或当前CALL记录点击安排。前提：当前owner租户管理员及task.assign动作权；DIRECT分类当前允许且方式明确，或TEMPLATE为ACTIVE run的CALL节点；无在途/排队/重试/未知执行及必要未归档内容；DIRECT须当前周期ACTIVE；COMPLETED须显式再次直接跟进，不能以旧安排直接起呼。。操作：按DIRECT显式方式或TEMPLATE节点方式读取同源候选；人工核电话资格，AI/预外呼责任人不强坐席；仅选择本租户跟进人；AI场景在同一导入与分配安排入口明确且有效，DIRECT不要求节点标签路由依赖；保存不改方式或owner。分别构造：人员失效、原安排不适配或源配置变更；合法保存；当前直接周期具有可靠END接续来源。

预期：按钮、上下文和模型动作资格一致；具体说明并保选择，不能保存无权安排；只改责任及场景安排，不改owner/方式、不起呼；可以按已确认END继续人工跟进；普通DIRECT开关不替代此来源，但当前分类/本人/资源/联系/必要归档照常核验。

覆盖：AC-2118, AC-2119

### CHECK-FLOW-ASSIGN-BATCH / manual

步骤：本动作适用模式以当前前置条件为准；原模板例仅用于TEMPLATE。勾选同组记录后分配跟进人。管理员对每行有当前assign资格；分组含owner/分类/捕获模板/节点/方式/场景一致。依次执行：逐条读取实际可安排上下文并求共同有效候选；同组选择人及必要AI场景，提交前每行重核。分别构造：跨组或任一记录/候选不合法；全部合法

预期：全组不写，提示分组或具体不合格原因；同次保存组内安排，不自动批起呼；不按相同nodeId误合不同模板组

覆盖：AC-2119

### CHECK-FLOW-AI-SCENE / manual

步骤：本动作适用模式以当前前置条件为准；原模板例仅用于TEMPLATE。导入直接AI或当前AI安排显式选择场景。实际执行租户及当前成员有AI使用模块；真实场景目录可核。依次执行：只投影实际租户/分类当前启用场景，不要求标签维护权；汇总本CALL及下游取数节点的AI_TAG依赖，核supplier/tenant/type/tagScene/revision与合法tag IDs。分别构造：需标签依赖但当前上下文不一致；普通AI无标签条件依赖；首节点先转交

预期：阻选择/起呼并指出需核流程与场景，不把其他租户标签替代；沿执行配置有效性可正常选/起呼，不因闲置标签metadata强绑；原方不选目标私有场景，接收方接续再选；场景不是客户永久属性，受理后按实际快照保留

覆盖：AC-2118, AC-2119, AC-2111

## 完成条件

- 只安排当前负责租户的责任跟进人及必要本租户AI场景，保留原方式与归属。
- 同组批量分配逐条重核，整组提交失败不部分写；场景失效可在无执行占用时明确重选。
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
