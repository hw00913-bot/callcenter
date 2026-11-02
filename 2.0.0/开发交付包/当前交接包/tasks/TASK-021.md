# TASK-021 唯一跟进归档与统计事实

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md)

- [保存本轮跟进、准确通话事实并唯一归档 · FUNC\-2032](../features/FUNC-2032.md)

## 目标

通话终态、全部重试、必要人内容及依赖证据可靠齐备才唯一归档。；纯AI/明确无人由系统记真实摘要；零拨失败不算完成跟进，统计按真实通话去重。

## 产品依据

- FUNC-2032 保存本轮跟进、准确通话事实并唯一归档：按准确实际办理/接听人保存本次内容、真实通话及定义/值快照，正常条件满足唯一归档。受控缺失废弃保未完成且与正常archive分开；可靠旧弃结清不永久阻后继DIRECT，但不贡献完成数或绕真实unknown/冲突。原受理迟到事实归原ID入账，内容更正/当前值按原规则。；来源 documentation/input/functions.json#FUNC-2032

来源根：`/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/开发交付包/工作资料/续接输入`；来源指纹：`edc5225b5022e6100a5e5848c84fb590eba1e70c2a584fffa610b9133c191a29`

## 前置任务

- TASK-019
- TASK-020

## 只读代码上下文

未指定既有代码文件；从工程规范和产品依据读取上下文。

## 允许修改的文件

- 未填写

代码库根：`None`。未列出的文件不属于本任务修改范围；扩大范围需回到计划。

## 变更安排

- 未填写

## 逻辑与字段依据

先读 [全局逻辑](../global-logic.md)，再读本任务关联的局部逻辑与字段定义。

全局规则：[GR-DATA-FACTS](../global-logic.md#GR-DATA-FACTS)、[GR-HANDLING-MODE](../global-logic.md#GR-HANDLING-MODE)、[GR-SERIAL](../global-logic.md#GR-SERIAL)、[GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)

局部逻辑：[LOCAL-FLOW-ARCHIVE](../local-logic/LOCAL-FLOW-ARCHIVE.md)

字段：[FIELD-FLOW-ACTUAL-ANSWER](../field-specs.md#FIELD-FLOW-ACTUAL-ANSWER)、[FIELD-FLOW-ACTUAL-HANDLER](../field-specs.md#FIELD-FLOW-ACTUAL-HANDLER)、[FIELD-FLOW-ARCHIVE-STATE](../field-specs.md#FIELD-FLOW-ARCHIVE-STATE)、[FIELD-FLOW-ARCHIVED](../field-specs.md#FIELD-FLOW-ARCHIVED)、[FIELD-FLOW-CALLS](../field-specs.md#FIELD-FLOW-CALLS)、[FIELD-FLOW-CONFIRMED-FIELDS](../field-specs.md#FIELD-FLOW-CONFIRMED-FIELDS)、[FIELD-FLOW-CONTENT-SAVED](../field-specs.md#FIELD-FLOW-CONTENT-SAVED)、[FIELD-FLOW-CONTENT-SNAPSHOT](../field-specs.md#FIELD-FLOW-CONTENT-SNAPSHOT)、[FIELD-FLOW-DIRECT-CYCLE-ID](../field-specs.md#FIELD-FLOW-DIRECT-CYCLE-ID)、[FIELD-FLOW-DIRECT-STATUS](../field-specs.md#FIELD-FLOW-DIRECT-STATUS)、[FIELD-FLOW-FOLLOWUP-ID](../field-specs.md#FIELD-FLOW-FOLLOWUP-ID)、[FIELD-FLOW-FOLLOWUP-SUMMARY](../field-specs.md#FIELD-FLOW-FOLLOWUP-SUMMARY)、[FIELD-FLOW-HANDLING-MODE](../field-specs.md#FIELD-FLOW-HANDLING-MODE)、[FIELD-FLOW-HUMAN-ANSWER](../field-specs.md#FIELD-FLOW-HUMAN-ANSWER)、[FIELD-FLOW-RETRIES-COMPLETE](../field-specs.md#FIELD-FLOW-RETRIES-COMPLETE)、[FIELD-FLOW-ROUTING-EVIDENCE](../field-specs.md#FIELD-FLOW-ROUTING-EVIDENCE)、[FIELD-FLOW-ROUTING-FIELD-SNAPSHOT](../field-specs.md#FIELD-FLOW-ROUTING-FIELD-SNAPSHOT)、[FIELD-FLOW-STATISTICS](../field-specs.md#FIELD-FLOW-STATISTICS)、[FIELD-FLOW-TAG-EVIDENCE](../field-specs.md#FIELD-FLOW-TAG-EVIDENCE)

## UI 依据

[全局 UI 规范](../ui-spec.md)

- [UI-PAGE-2203](../ui-pages/UI-PAGE-2203.md)
- [UI-PAGE-2227](../ui-pages/UI-PAGE-2227.md)

## 实现要求

- 通话终态、全部重试、必要人内容及依赖证据可靠齐备才唯一归档。
- 纯AI/明确无人由系统记真实摘要；零拨失败不算完成跟进，统计按真实通话去重。
- 已归档/重复回执不能重复封内容或计数；未知不补0，不伪人工确认。
- 按所引LOCAL逐动作落实触发/前后置/分支；业务定义只读同源规格，不另抄一套规则。
- 依赖表示实施契约/共享守卫先就绪，不新增用户操作门槛；跨任务端到端由验收批次合并检查。
- 目标库、模块/服务/表/接口、精确可写文件及命令由开发在开工前绑定；当前空文件清单不授代码写入权。

## 产品验收

- **AC-2092**：每次实际办理独立followup，开始捕获最新实际分类资料，实际办理/接听人唯一正式提交；纯AI/无人时系统按真实事实唯一归档。正式内容不重写，更正直改当前有效值并留因，旧段迟到不覆盖新值。
  依据：docs/functional-spec.json#AC-2092

- **AC-2121**：同业务串行，真实在途/排队/重试/unknown及冲突不放新执行。正常当前CALL仍依必要内容/事实归档；旧已废弃段可靠结清另判，不强求正常archive。转交仍原独立准入，初次纯IMPORT不先造呼叫/填写。
  依据：docs/functional-spec.json#AC-2121

- **AC-2122**：受理、真实拨打、执行终态、内容保存、唯一归档、节点、owner及业务结论分别确认；未知核原请求而非新身份重发。
  依据：docs/functional-spec.json#AC-2122

## 测试要求（尚未执行）

### CHECK-FLOW-ARCHIVE / manual

步骤：本动作适用模式以当前前置条件为准；原模板例仅用于TEMPLATE。通话终态/人工保存/必要证据齐备后系统评估。同followup准确身份；真实所有拨打结束、重试完毕、实际人工事实和必要状态/下游tags可核。依次执行：有人工必须由实际人先保存内容；纯AI/明确无人由系统保存事实摘要；必要终态/内容/下游依赖全部明确才唯一COMPLETE。分别构造：首通结束但重试或人/标签事实未知；SYSTEM未接听自动归档；完成或同事件重复到达。具体复现：AI节点出边只用状态，下游转交另用本AI标签。首通结束但重试尚未收敛、随后重试结束而标签PENDING、再提供与实际sceneSnapshot一致NONE；另做零拨启动失败。。2026-10-30两模式复现：DIRECT首通结束但重试未收敛，随后必要人工内容未保存，再全部满足。

预期：保持待结果/待核，不计完成；只记录真实事实，不以继承旧result值造新人工confirmed；不重复封内容或计完成；真实零拨失败只记异常；完成跟进与流程END及业务达成分开。该例预期：前两状态不得归档完成；准确NONE可满足明确无标签事实，不造人工字段确认；零拨异常可封档而completedFollowup与dials不增加。。2026-10-30两模式复现：前两状态不完成；全部明确才唯一归档，返回同租户待跟进，不创建下一通或新run，也不把通话当模板节点完成。

覆盖：AC-2092, AC-2121, AC-2122

## 完成条件

- 通话终态、全部重试、必要人内容及依赖证据可靠齐备才唯一归档。
- 纯AI/明确无人由系统记真实摘要；零拨失败不算完成跟进，统计按真实通话去重。
- 本任务全部同ID验收检查有当前实现、正常/拒绝/失败/未知证据，关联页面五态及字段权限符合原规格。
- 开发完成目标库/精确文件/模块/数据接口/测试执行绑定，必要共享文件先后依赖已补齐，工程问题有可靠结论。
- 产品变动回产品规格重审；不可用局部实现或Mock结论替代真实远端与正式开工许可。

需保留实际改动、测试结果和 Review 证据。仅修改完成不等于验收通过。


## 本轮工程绑定边界

本任务为可承接的业务实施分解，尚未绑定生产仓库/技术栈。开发确定真实文件后填写allowed_files、context_files、changes并复检共享文件依赖；不得把原型参考文件当作生产可写授权。

只读原型行为参考：

- [four-node-model.js](../../../prototype/scripts/four-node-model.js) · 只读行为参考，非生产可写目标

需开发处理的问题：ENG-FLOW-PERSISTENCE, ENG-FLOW-EXECUTION。
