# TASK-022 当前有效资料更正与并发确认

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md)

- [保存本轮跟进、准确通话事实并唯一归档 · FUNC\-2032](../features/FUNC-2032.md)

## 目标

有权管理员带原因明确更正当前有效值，保前后值、操作者与来源。；旧段快照/原导入证据不可改，表单基准与当前值冲突时保输入并重新核对。

## 产品依据

- FUNC-2032 保存本轮跟进、准确通话事实并唯一归档：按准确实际办理/接听人保存本次内容、真实通话及定义/值快照，正常条件满足唯一归档。受控缺失废弃保未完成且与正常archive分开；可靠旧弃结清不永久阻后继DIRECT，但不贡献完成数或绕真实unknown/冲突。原受理迟到事实归原ID入账，内容更正/当前值按原规则。；来源 documentation/input/functions.json#FUNC-2032

来源根：`/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/开发交付包/工作资料/续接输入`；来源指纹：`b0292b83ba50e66ed754b44bc97cfa25bab040c4f00b70baa8e542df666aeccf`

## 前置任务

- TASK-015
- TASK-020
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

全局规则：[GR-AUTH](../global-logic.md#GR-AUTH)、[GR-DATA-FACTS](../global-logic.md#GR-DATA-FACTS)、[GR-FIELDS](../global-logic.md#GR-FIELDS)、[GR-HANDLING-MODE](../global-logic.md#GR-HANDLING-MODE)、[GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)

局部逻辑：[LOCAL-FLOW-CORRECT](../local-logic/LOCAL-FLOW-CORRECT.md)

字段：[FIELD-FLOW-ACTIVITY-INTEREST](../field-specs.md#FIELD-FLOW-ACTIVITY-INTEREST)、[FIELD-FLOW-CATEGORY-ID](../field-specs.md#FIELD-FLOW-CATEGORY-ID)、[FIELD-FLOW-CONTENT-SNAPSHOT](../field-specs.md#FIELD-FLOW-CONTENT-SNAPSHOT)、[FIELD-FLOW-CORRECTIONS](../field-specs.md#FIELD-FLOW-CORRECTIONS)、[FIELD-FLOW-DIRECT-CYCLE-ID](../field-specs.md#FIELD-FLOW-DIRECT-CYCLE-ID)、[FIELD-FLOW-DIRECT-STATUS](../field-specs.md#FIELD-FLOW-DIRECT-STATUS)、[FIELD-FLOW-FOLLOWUP-VALUES](../field-specs.md#FIELD-FLOW-FOLLOWUP-VALUES)、[FIELD-FLOW-HANDLING-MODE](../field-specs.md#FIELD-FLOW-HANDLING-MODE)、[FIELD-FLOW-IMPORT-ORIGINAL](../field-specs.md#FIELD-FLOW-IMPORT-ORIGINAL)、[FIELD-FLOW-IMPORT-VALUES](../field-specs.md#FIELD-FLOW-IMPORT-VALUES)、[FIELD-FLOW-INTENDED-STORE-NAME](../field-specs.md#FIELD-FLOW-INTENDED-STORE-NAME)、[FIELD-FLOW-INTENTION-LEVEL](../field-specs.md#FIELD-FLOW-INTENTION-LEVEL)、[FIELD-FLOW-INTERESTED-ITEMS](../field-specs.md#FIELD-FLOW-INTERESTED-ITEMS)、[FIELD-FLOW-LEAD-LEVEL](../field-specs.md#FIELD-FLOW-LEAD-LEVEL)、[FIELD-FLOW-MAPPING-SERIES](../field-specs.md#FIELD-FLOW-MAPPING-SERIES)、[FIELD-FLOW-NEXT-SERVICE](../field-specs.md#FIELD-FLOW-NEXT-SERVICE)、[FIELD-FLOW-PARTICIPANTS](../field-specs.md#FIELD-FLOW-PARTICIPANTS)、[FIELD-FLOW-PLANNED-STORE](../field-specs.md#FIELD-FLOW-PLANNED-STORE)、[FIELD-FLOW-PLANNED-VISIT](../field-specs.md#FIELD-FLOW-PLANNED-VISIT)、[FIELD-FLOW-REASON](../field-specs.md#FIELD-FLOW-REASON)、[FIELD-FLOW-RECORD-ID](../field-specs.md#FIELD-FLOW-RECORD-ID)、[FIELD-FLOW-RECORD-REVISION](../field-specs.md#FIELD-FLOW-RECORD-REVISION)、[FIELD-FLOW-SERVICE-CONCERN](../field-specs.md#FIELD-FLOW-SERVICE-CONCERN)、[FIELD-FLOW-SERVICE-SATISFACTION](../field-specs.md#FIELD-FLOW-SERVICE-SATISFACTION)、[FIELD-FLOW-TESTDRIVE-INTENTION](../field-specs.md#FIELD-FLOW-TESTDRIVE-INTENTION)、[FIELD-FLOW-VALUE-SOURCES](../field-specs.md#FIELD-FLOW-VALUE-SOURCES)、[FIELD-FLOW-VISIT-INTENTION](../field-specs.md#FIELD-FLOW-VISIT-INTENTION)

## UI 依据

[全局 UI 规范](../ui-spec.md)

- [UI-PAGE-2227](../ui-pages/UI-PAGE-2227.md)

## 实现要求

- 有权管理员带原因明确更正当前有效值，保前后值、操作者与来源。
- 旧段快照/原导入证据不可改，表单基准与当前值冲突时保输入并重新核对。
- 业务关系与字段稳定身份不按名称重配；转出方不得修改接收方当前资料。
- 按所引LOCAL逐动作落实触发/前后置/分支；业务定义只读同源规格，不另抄一套规则。
- 依赖表示实施契约/共享守卫先就绪，不新增用户操作门槛；跨任务端到端由验收批次合并检查。
- 目标库、模块/服务/表/接口、精确可写文件及命令由开发在开工前绑定；当前空文件清单不授代码写入权。

## 产品验收

- **AC-2092**：每次实际办理独立followup，开始捕获最新实际分类资料，实际办理/接听人唯一正式提交；纯AI/无人时系统按真实事实唯一归档。正式内容不重写，更正直改当前有效值并留因，旧段迟到不覆盖新值。
  依据：docs/functional-spec.json#AC-2092

- **AC-2135**：分类BASE、独立ROUTE、模板字段参考互不覆盖；实际绑定按所用稳定ID/用途/类型/选项/AI上下文校验，新跟进取最新资料而正式/运行快照不追改，未操作/缺失/明确清空分开。
  依据：docs/functional-spec.json#AC-2135

## 测试要求（尚未执行）

### CHECK-FLOW-CORRECT / manual

步骤：本动作适用模式以当前前置条件为准；原模板例仅用于TEMPLATE。更正当前资料并填写原因。对准确业务有当前本租户办理权；确认业务/run/node/owner及并发依据仍一致；当前管理员有资料维护资格。依次执行：仅显示当前启用可维护定义，分IMPORT/FOLLOWUP身份和类型校验；号码等允许清空为未知，后续实际起呼仍必须重校有效号码；按明确字段直接更新当前值及别名一致性，留before/after/来源和原因。分别构造：无权、未知字段/非法值或并发变化；合法明确更正

预期：拒并保输入，不动原当前值；当前判断可用此授权来源，原导入/跟进快照保持；更正不是重新提交原正式跟进，也不自动发起新run

覆盖：AC-2092, AC-2135

## 完成条件

- 有权管理员带原因明确更正当前有效值，保前后值、操作者与来源。
- 旧段快照/原导入证据不可改，表单基准与当前值冲突时保输入并重新核对。
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
