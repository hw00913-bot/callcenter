# TASK-017 TASK直接周期完成、再次办理与旧来源边界

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md)

- [明确发起当前呼叫及同组批呼叫 · FUNC\-2031](../features/FUNC-2031.md)
- [保存本轮跟进、准确通话事实并唯一归档 · FUNC\-2032](../features/FUNC-2032.md)
- [按共同分类字段预检并导入统一业务 · FUNC\-2036](../features/FUNC-2036.md)
- [分配本租户具体任务或坐席及执行优先级 · FUNC\-2037](../features/FUNC-2037.md)
- [查询业务、批次和工作队列 · FUNC\-2039](../features/FUNC-2039.md)

## 目标

完成当前直接周期须真实执行/重试及必要本人内容归档收敛，或合法无需联系并说明依据；业务结论显式选择，不把归档视为业务达成。；新TASK DIRECT的再次周期沿准确当前任务/场景/分类/渠道资格，不读已移除的分类开关；旧无TASK来源按原准入，旧END例外仅准确原首MANUAL周期，不授新输入或其他周期。

## 产品依据

- FUNC-2031 明确发起当前呼叫及同组批呼叫：明确发起同租户DIRECT或TEMPLATE当前CALL的AI/人工/预外呼，重核准确资源/场景、本人资格、串行和联系限制。人工待分配不先起呼，AI/PRED无独立责任人要求；同组AI/预外呼按五档/FIFO统一总序逐条核验及反馈，不抢占在途。直接周期完成后显式下一方式建立新周期，旧事实保持。；来源 documentation/input/functions.json#FUNC-2031
- FUNC-2032 保存本轮跟进、准确通话事实并唯一归档：按准确实际办理/接听人保存本次内容、真实通话及定义/值快照，正常条件满足唯一归档。受控缺失废弃保未完成且与正常archive分开；可靠旧弃结清不永久阻后继DIRECT，但不贡献完成数或绕真实unknown/冲突。原受理迟到事实归原ID入账，内容更正/当前值按原规则。；来源 documentation/input/functions.json#FUNC-2032
- FUNC-2036 按共同分类字段预检并导入统一业务：客户维护与AI/预外呼任务三入口共用分类IMPORT和code等系统必需校验。客户维护按原DIRECT/TEMPLATE；任务内固定准确任务/必要scene并默认DIRECT，须ADMIN+customer.import、原模块/任务/来源及分类允许，保存完整值/快照/taskImportSource/等级和直接周期。专业名单只读recordId投影，不写第二账本/原生行或重复提交供应商，旧历史不迁移。；来源 documentation/input/functions.json#FUNC-2036
- FUNC-2037 分配本租户具体任务或坐席及执行优先级：DIRECT与TEMPLATE共用任务或人工分配方式/坐席及五档等级：人工默认待分配、指定坐席才必选seat；PRED只任务，AI任务+scene。模板/导入/分配无独立责任人输入，实际人员由坐席分配及真实执行/接听事实记录；保留原单条/批量分配，不改owner或自动起呼。；来源 documentation/input/functions.json#FUNC-2037
- FUNC-2039 查询业务、批次和工作队列：查询模式、批次、队列和下一步；DIRECT显示同租户待安排/起呼/结果/本人填写/待核及再次跟进，允许有权人经独立预检显式启用流程。 列表和详情展示具体目标与五档等级；待执行视图按资源内等级与入队先后，普通历史列表仍更新时间倒序，长期等待可提示。；来源 documentation/input/functions.json#FUNC-2039

来源根：`/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/开发交付包/工作资料/续接输入`；来源指纹：`ac24ea3af455fa8052e0daeaa799eea0265f5d02f520b26bdd98ac1e620a1a6c`

## 前置任务

- TASK-021

## 只读代码上下文

未指定既有代码文件；从工程规范和产品依据读取上下文。

## 允许修改的文件

- 未填写

代码库根：`None`。未列出的文件不属于本任务修改范围；扩大范围需回到计划。

## 变更安排

- 未填写

## 逻辑与字段依据

先读 [全局逻辑](../global-logic.md)，再读本任务关联的局部逻辑与字段定义。

全局规则：[GR-AUTH](../global-logic.md#GR-AUTH)、[GR-DATA-FACTS](../global-logic.md#GR-DATA-FACTS)、[GR-HANDLING-MODE](../global-logic.md#GR-HANDLING-MODE)、[GR-LIFECYCLE-SETTLEMENT](../global-logic.md#GR-LIFECYCLE-SETTLEMENT)、[GR-SCOPE](../global-logic.md#GR-SCOPE)、[GR-SERIAL](../global-logic.md#GR-SERIAL)、[GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)

局部逻辑：[LOCAL-FLOW-COMPLETE-DIRECT](../local-logic/LOCAL-FLOW-COMPLETE-DIRECT.md)、[LOCAL-FLOW-RESUME-DIRECT](../local-logic/LOCAL-FLOW-RESUME-DIRECT.md)

字段：[FIELD-FLOW-AI-SCENE](../field-specs.md#FIELD-FLOW-AI-SCENE)、[FIELD-FLOW-ALLOW-DIRECT-FOLLOWUP](../field-specs.md#FIELD-FLOW-ALLOW-DIRECT-FOLLOWUP)、[FIELD-FLOW-ARCHIVE-STATE](../field-specs.md#FIELD-FLOW-ARCHIVE-STATE)、[FIELD-FLOW-ARRANGEMENT](../field-specs.md#FIELD-FLOW-ARRANGEMENT)、[FIELD-FLOW-DIRECT-CYCLE-ID](../field-specs.md#FIELD-FLOW-DIRECT-CYCLE-ID)、[FIELD-FLOW-DIRECT-CYCLES](../field-specs.md#FIELD-FLOW-DIRECT-CYCLES)、[FIELD-FLOW-DIRECT-METHOD](../field-specs.md#FIELD-FLOW-DIRECT-METHOD)、[FIELD-FLOW-DIRECT-OUTCOME](../field-specs.md#FIELD-FLOW-DIRECT-OUTCOME)、[FIELD-FLOW-DIRECT-OUTCOME-CODE](../field-specs.md#FIELD-FLOW-DIRECT-OUTCOME-CODE)、[FIELD-FLOW-DIRECT-OUTCOME-LABEL](../field-specs.md#FIELD-FLOW-DIRECT-OUTCOME-LABEL)、[FIELD-FLOW-DIRECT-STATUS](../field-specs.md#FIELD-FLOW-DIRECT-STATUS)、[FIELD-FLOW-END-FOLLOWUP-ORIGIN](../field-specs.md#FIELD-FLOW-END-FOLLOWUP-ORIGIN)、[FIELD-FLOW-FOLLOWER](../field-specs.md#FIELD-FLOW-FOLLOWER)、[FIELD-FLOW-HANDLING-MODE](../field-specs.md#FIELD-FLOW-HANDLING-MODE)、[FIELD-FLOW-REASON](../field-specs.md#FIELD-FLOW-REASON)、[FIELD-FLOW-RECORD-REVISION](../field-specs.md#FIELD-FLOW-RECORD-REVISION)

## UI 依据

[全局 UI 规范](../ui-spec.md)

- [UI-PAGE-2204](../ui-pages/UI-PAGE-2204.md)
- [UI-PAGE-2227](../ui-pages/UI-PAGE-2227.md)

## 实现要求

- 完成当前直接周期须真实执行/重试及必要本人内容归档收敛，或合法无需联系并说明依据；业务结论显式选择，不把归档视为业务达成。
- 新TASK DIRECT的再次周期沿准确当前任务/场景/分类/渠道资格，不读已移除的分类开关；旧无TASK来源按原准入，旧END例外仅准确原首MANUAL周期，不授新输入或其他周期。
- 新TASK来源不显示启用模板，不复制业务或清旧事实；旧unknown/在途/必要内容阻断新周期，不能借旧受控废弃确认覆盖新缺失。
- 按所引LOCAL逐动作落实触发/前后置/分支；业务定义只读同源规格，不另抄一套规则。
- 依赖表示实施契约/共享守卫先就绪，不新增用户操作门槛；跨任务端到端由验收批次合并检查。
- 目标库、模块/服务/表/接口、精确可写文件及命令由开发在开工前绑定；当前空文件清单不授代码写入权。

## 产品验收

- **AC-2115**：按实际分类生成系统必需和IMPORT列及必填校验；合法等待名单数据中性提示，检查后具体报字段/节点/条件；正式提交所有行通过且token一致。
  依据：docs/functional-spec.json#AC-2115

- **AC-2116**：LEAD同品牌统一编码跨分类/来源唯一，ORDINARY同品牌同分类唯一；不凭手机号合并，不覆盖重复业务或自动重开。
  依据：docs/functional-spec.json#AC-2116

- **AC-2118**：两模式按方式安排任务或人工分配方式/坐席、必要scene及五档等级；模板、导入、分配不再选择独立责任人。人工MANUAL可先待分配，PRED只任务，AI任务+scene，不改owner或自动起呼。
  依据：docs/functional-spec.json#AC-2118

- **AC-2122**：受理、真实拨打、执行终态、内容保存、唯一归档、节点、owner及业务结论分别确认；未知核原请求而非新身份重发。
  依据：docs/functional-spec.json#AC-2122

- **AC-2129**：超管在管理范围仅监管查询，列表/详情/直接访问一致，不代分配、起呼、填结果或转交。
  依据：docs/functional-spec.json#AC-2129

- **AC-2165**：当前模板END固定CLOSE，旧已捕获END来源及其受控首周期历史合法性单独保留；新TASK来源再次直接跟进核准确任务/渠道，不依赖已移除旧allowDirect标志；旧来源不授新TASK周期资格。
  依据：docs/functional-spec.json#AC-2165

## 测试要求（尚未执行）

### CHECK-FLOW-COMPLETE-DIRECT / manual

步骤：按当前Step45生命周期规则：有当前直接业务办理资格者明确选择“完成直接跟进”并确认业务结论；重新核准确直接周期、当前资格及全部旧执行/必要归档收敛；不以最后单条结束或超时作为全收敛。；正常段必要内容/事实正常归档；已可靠废弃结清的旧段另判，不强制archived=true。旧已弃段原人后来补齐或合法确认后可可靠收尾，不永久阻本次后继办理；旧弃不贡献正常完成数。各当前动作仍按自己的独立前置，不能把完成DIRECT周期强加到重开或启用流程。；校明确结论编码非UNSPECIFIED，显示名1～80字；无真实完成跟进时只允许NO_CALL+明确原因。；同次封当前业务结论、原周期结论、COMPLETED状态、结束时刻和有权操作者事件；不制造通话、跟进完成数或模板END。；构造无权/缺确认/过期/真实在途或unknown/事实冲突对照。

预期：完成直接周期与跟进归档、实际拨打和业务成功分开；原段/周期快照不被当前结论改写。；保原身份/当前值/未完成事实及真实统计，不代填、不借历史END给新周期续权、不提前释放。

覆盖：AC-2118, AC-2122, AC-2129

### CHECK-FLOW-RESUME-DIRECT / manual

步骤：当前TASK DIRECT完成后明确再次直接跟进；改变准确任务/场景/渠道或保留旧未知，再测旧无TASK/END历史来源。

预期：当前由入口决定办理模式：准确AI/预外呼任务入口固定TASK/DIRECT，按任务MANUAL/API渠道导入；业务分类入口固定CATEGORY/TEMPLATE，人工或接口进入当前分类模板。没有中央模式选择、分类允许直接跟进开关或AI第三种FLOW来源，TEMPLATE失败不降级。旧无TASK来源的DIRECT及旧已捕获END来源分别只按原历史合同核验，不补新来源。 当前新建/修改模板的END固定正常结束CLOSE，不提供是否直接跟进配置，当前新导入/路由/重开不得接纳旧DIRECT_FOLLOWUP配置；已运行历史按原捕获方案和原合法来源收尾，不改历史为CLOSE，不借旧END来源授权当前新周期。新TASK/DIRECT始终直接跟进，不显示启用流程；旧无TASK来源DIRECT仅保原合法转换能力。 旧执行/必要归档不收敛时拒绝新周期。

覆盖：AC-2115, AC-2116, AC-2129

### CHECK-FLOW-END-CURRENT-CYCLE / manual

步骤：当前模板新配置/换绑/重开时试用旧DIRECT_FOLLOWUP；读取已捕获旧END历史，再分别创建当前新周期。

预期：当前新建/修改模板的END固定正常结束CLOSE，不提供是否直接跟进配置，当前新导入/路由/重开不得接纳旧DIRECT_FOLLOWUP配置；已运行历史按原捕获方案和原合法来源收尾，不改历史为CLOSE，不借旧END来源授权当前新周期。新TASK/DIRECT始终直接跟进，不显示启用流程；旧无TASK来源DIRECT仅保原合法转换能力。 旧已捕获证明保持原样，不授新输入例外。

覆盖：AC-2165

## 完成条件

- 完成当前直接周期须真实执行/重试及必要本人内容归档收敛，或合法无需联系并说明依据；业务结论显式选择，不把归档视为业务达成。
- 新TASK DIRECT的再次周期沿准确当前任务/场景/分类/渠道资格，不读已移除的分类开关；旧无TASK来源按原准入，旧END例外仅准确原首MANUAL周期，不授新输入或其他周期。
- 本任务全部同ID验收检查有当前实现、正常/拒绝/失败/未知证据，关联页面五态及字段权限符合原规格。
- 开发完成目标库/精确文件/模块/数据接口/测试执行绑定，必要共享文件先后依赖已补齐，工程问题有可靠结论。
- 产品变动回产品规格重审；不可用局部实现或Mock结论替代真实远端与正式开工许可。

需保留实际改动、测试结果和 Review 证据。仅修改完成不等于验收通过。


## 本轮工程绑定边界

本任务为可承接的业务实施分解，尚未绑定生产仓库/技术栈。开发确定真实文件后填写allowed_files、context_files、changes并复检共享文件依赖；不得把原型参考文件当作生产可写授权。

只读原型行为参考：

- [four-node-model.js](../../../prototype/scripts/four-node-model.js) · 只读行为参考，非生产可写目标
- [four-node-workspace.js](../../../prototype/js/adapters/four-node-workspace.js) · 只读行为参考，非生产可写目标

需开发处理的问题：ENG-FLOW-PERSISTENCE。
