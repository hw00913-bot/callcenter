# TASK-007 账号与租户引用保护删除

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md)

- [删除无引用且无其他租户关联的准确账号 · FUNC\-2028](../features/FUNC-2028.md)
- [删除无业务引用的准确租户 · FUNC\-2029](../features/FUNC-2029.md)

## 目标

仅在当前权限、准确对象、全部必要业务引用均可核时删除。；多租户账号、默认管理组和既有任务/通话/财务引用保持保护。

## 产品依据

- FUNC-2028 删除无引用且无其他租户关联的准确账号：沿独立原删除权，最终一致校验引用/关联/修订；引用未知不删，不等同成员移除或坐席删除，保必要审计。；来源 documentation/input/functions.json#FUNC-2028
- FUNC-2029 删除无业务引用的准确租户：沿独立原删除权及默认管理组保护，引用/权限/修订终提交再验；不级联清账、任务、品牌和其他租户。；来源 documentation/input/functions.json#FUNC-2029

来源根：`/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/开发交付包/工作资料/续接输入`；来源指纹：`ac24ea3af455fa8052e0daeaa799eea0265f5d02f520b26bdd98ac1e620a1a6c`

## 前置任务

- TASK-005

## 只读代码上下文

未指定既有代码文件；从工程规范和产品依据读取上下文。

## 允许修改的文件

- 未填写

代码库根：`None`。未列出的文件不属于本任务修改范围；扩大范围需回到计划。

## 变更安排

- 未填写

## 逻辑与字段依据

先读 [全局逻辑](../global-logic.md)，再读本任务关联的局部逻辑与字段定义。

全局规则：[GR-AUTH](../global-logic.md#GR-AUTH)、[GR-IDENTITY](../global-logic.md#GR-IDENTITY)、[GR-LIST-ORDER](../global-logic.md#GR-LIST-ORDER)、[GR-SCOPE](../global-logic.md#GR-SCOPE)、[GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)

局部逻辑：[LOCAL-PLAT-ACCOUNT-DELETE](../local-logic/LOCAL-PLAT-ACCOUNT-DELETE.md)、[LOCAL-PLAT-TENANT-DELETE](../local-logic/LOCAL-PLAT-TENANT-DELETE.md)

字段：[FIELD-PLAT-ACCOUNT-ID](../field-specs.md#FIELD-PLAT-ACCOUNT-ID)、[FIELD-PLAT-AUDIT](../field-specs.md#FIELD-PLAT-AUDIT)、[FIELD-PLAT-OP-STATE](../field-specs.md#FIELD-PLAT-OP-STATE)、[FIELD-PLAT-REFERENCE-STATE](../field-specs.md#FIELD-PLAT-REFERENCE-STATE)、[FIELD-PLAT-REQUEST](../field-specs.md#FIELD-PLAT-REQUEST)、[FIELD-PLAT-REVISION](../field-specs.md#FIELD-PLAT-REVISION)、[FIELD-PLAT-TENANT-ID](../field-specs.md#FIELD-PLAT-TENANT-ID)

## UI 依据

[全局 UI 规范](../ui-spec.md)

- [UI-PAGE-2003](../ui-pages/UI-PAGE-2003.md)
- [UI-PAGE-2004](../ui-pages/UI-PAGE-2004.md)

## 实现要求

- 仅在当前权限、准确对象、全部必要业务引用均可核时删除。
- 多租户账号、默认管理组和既有任务/通话/财务引用保持保护。
- 必要审计本身不虚构成禁止删除的业务引用；HTTP200不等于已删除。
- 按所引LOCAL逐动作落实触发/前后置/分支；业务定义只读同源规格，不另抄一套规则。
- 依赖表示实施契约/共享守卫先就绪，不新增用户操作门槛；跨任务端到端由验收批次合并检查。
- 目标库、模块/服务/表/接口、精确可写文件及命令由开发在开工前绑定；当前空文件清单不授代码写入权。

## 产品验收

- **AC-2079**：原AI账号删除在PAGE-2003沿原删除权承接为准确账号主体删除，独立于本租户成员移除、停用和坐席删除；仅无任务、通话、账务等业务引用且没有其他租户关联时允许删除，有业务历史则禁止删除，必要删除审计及稳定身份追溯保留。复用原确认和反馈，提交前及最终提交时一致校验准确对象、原权和资格；未核实体/原权/一致执行能力时不调用DELETE，明确失败保留可确认状态，结果未知先按已有可靠能力核对、不盲重试，HTTP200或列表查不到不单独算成功，不因超管称谓授予删除权。
  依据：docs/functional-spec.json#AC-2079

- **AC-2080**：原AI租户删除在PAGE-2004沿原删除权只作用于准确单个业务租户；仅无任务、通话、账务等业务引用时可删，有业务历史继续保留，必要删除审计保留并维持原默认管理组不可删保护。复用原确认和反馈，最终提交中一致校验对象、原权和资格，引用/授权并发变化时拒绝或按真实结果处理；实体/能力未核不调用DELETE，失败或未知不假报成功、不盲重试，HTTP200或列表查不到不能单独证明已删。不级联清历史、自动清账/取消任务，不删除品牌或其他租户，不增租户停用或新增删除权限。
  依据：docs/functional-spec.json#AC-2080

## 测试要求（尚未执行）

### CHECK-PLAT-ACCOUNT-DELETE / manual

步骤：在准确有权范围触发“删除无业务引用的全局账号”；分别执行正常输入、明确无权/失效/冲突、失败及未知结果分支；按所列字段边界复查保存与显示。

预期：仅准确无引用对象被确认删除；必要审计保留，失败/未知不假报成功；无权及非法输入不得写入；失败与未知分别显示且不扩范围、不重复产生副作用。

覆盖：AC-2079

### CHECK-PLAT-TENANT-DELETE / manual

步骤：在准确有权范围触发“删除无业务引用的准确租户”；分别执行正常输入、明确无权/失效/冲突、失败及未知结果分支；按所列字段边界复查保存与显示。

预期：仅准确无引用对象被确认删除；必要审计保留，失败/未知不假报成功；无权及非法输入不得写入；失败与未知分别显示且不扩范围、不重复产生副作用。

覆盖：AC-2080

## 完成条件

- 仅在当前权限、准确对象、全部必要业务引用均可核时删除。
- 多租户账号、默认管理组和既有任务/通话/财务引用保持保护。
- 本任务全部同ID验收检查有当前实现、正常/拒绝/失败/未知证据，关联页面五态及字段权限符合原规格。
- 开发完成目标库/精确文件/模块/数据接口/测试执行绑定，必要共享文件先后依赖已补齐，工程问题有可靠结论。
- 产品变动回产品规格重审；不可用局部实现或Mock结论替代真实远端与正式开工许可。

需保留实际改动、测试结果和 Review 证据。仅修改完成不等于验收通过。


## 本轮工程绑定边界

本任务为可承接的业务实施分解，尚未绑定生产仓库/技术栈。开发确定真实文件后填写allowed_files、context_files、changes并复检共享文件依赖；不得把原型参考文件当作生产可写授权。

只读原型行为参考：

- [organization-store.js](../../../prototype/js/components/organization-store.js) · 只读行为参考，非生产可写目标

需开发处理的问题：EQ-PLAT-DELETE。
