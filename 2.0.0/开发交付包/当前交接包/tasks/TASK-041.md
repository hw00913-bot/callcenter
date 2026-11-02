# TASK-041 AI服务汇总八列导出

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md)

- [导出当前租户AI服务汇总8列 · FUNC\-2027](../features/FUNC-2027.md)

## 目标

按准确有权AI租户范围输出名称/ID/类型/可用/冻结/累计消耗分钟/有效期/控制状态八列。；当前筛选与同次快照一致，导出权限与普通账户只读分开。

## 产品依据

- FUNC-2027 导出当前租户AI服务汇总8列：仅有原财务导出权超管按当前授权AI租户精确映射和同次可靠服务快照导出固定8列；未知字段或范围不可靠阻止文件。；来源 documentation/input/functions.json#FUNC-2027

来源根：`/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/开发交付包/工作资料/续接输入`；来源指纹：`b0292b83ba50e66ed754b44bc97cfa25bab040c4f00b70baa8e542df666aeccf`

## 前置任务

- TASK-040

## 只读代码上下文

未指定既有代码文件；从工程规范和产品依据读取上下文。

## 允许修改的文件

- 未填写

代码库根：`None`。未列出的文件不属于本任务修改范围；扩大范围需回到计划。

## 变更安排

- 未填写

## 逻辑与字段依据

先读 [全局逻辑](../global-logic.md)，再读本任务关联的局部逻辑与字段定义。

全局规则：[GR-AUTH](../global-logic.md#GR-AUTH)、[GR-DATA-FACTS](../global-logic.md#GR-DATA-FACTS)、[GR-IDENTITY](../global-logic.md#GR-IDENTITY)、[GR-PRIVACY](../global-logic.md#GR-PRIVACY)、[GR-SCOPE](../global-logic.md#GR-SCOPE)、[GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)

局部逻辑：[LOCAL-PLAT-FINANCE-EXPORT](../local-logic/LOCAL-PLAT-FINANCE-EXPORT.md)

字段：[FIELD-PLAT-AI-TENANT](../field-specs.md#FIELD-PLAT-AI-TENANT)、[FIELD-PLAT-FINANCE-EXPORT](../field-specs.md#FIELD-PLAT-FINANCE-EXPORT)、[FIELD-PLAT-MINUTES-AVAILABLE](../field-specs.md#FIELD-PLAT-MINUTES-AVAILABLE)、[FIELD-PLAT-MINUTES-CONSUMED](../field-specs.md#FIELD-PLAT-MINUTES-CONSUMED)、[FIELD-PLAT-MINUTES-FROZEN](../field-specs.md#FIELD-PLAT-MINUTES-FROZEN)、[FIELD-PLAT-SERVICE-CONTROL](../field-specs.md#FIELD-PLAT-SERVICE-CONTROL)、[FIELD-PLAT-SERVICE-MANUAL](../field-specs.md#FIELD-PLAT-SERVICE-MANUAL)、[FIELD-PLAT-SERVICE-STATE](../field-specs.md#FIELD-PLAT-SERVICE-STATE)、[FIELD-PLAT-SERVICE-VALIDITY](../field-specs.md#FIELD-PLAT-SERVICE-VALIDITY)、[FIELD-PLAT-SESSION](../field-specs.md#FIELD-PLAT-SESSION)

## UI 依据

[全局 UI 规范](../ui-spec.md)

- [UI-PAGE-2106](../ui-pages/UI-PAGE-2106.md)
- [UI-PAGE-2112](../ui-pages/UI-PAGE-2112.md)

## 实现要求

- 按准确有权AI租户范围输出名称/ID/类型/可用/冻结/累计消耗分钟/有效期/控制状态八列。
- 当前筛选与同次快照一致，导出权限与普通账户只读分开。
- 未知分钟不补0，不恢复旧金额或大小模型余额口径。
- 按所引LOCAL逐动作落实触发/前后置/分支；业务定义只读同源规格，不另抄一套规则。
- 依赖表示实施契约/共享守卫先就绪，不新增用户操作门槛；跨任务端到端由验收批次合并检查。
- 目标库、模块/服务/表/接口、精确可写文件及命令由开发在开工前绑定；当前空文件清单不授代码写入权。

## 产品验收

- **AC-2078**：仅有原财务导出权超管，将当前授权AI租户交集的同次可靠服务快照导出固定8列：租户名称、租户ID、租户类型、可用分钟、冻结分钟、累计消耗分钟、有效期、呼叫控制状态。映射或任必需值未知阻止出文件；不受原计费日期/平台或公共租户列表筛选隐式改变，不恢复旧金额列或换算旧账。
  依据：docs/functional-spec.json#AC-2078

## 测试要求（尚未执行）

### CHECK-PLAT-FINANCE-EXPORT / manual

步骤：在准确有权范围触发“导出8列租户AI服务汇总”；分别执行正常输入、明确无权/失效/冲突、失败及未知结果分支；按所列字段边界复查保存与显示。

预期：下载准确8列授权服务快照；不恢复旧大小模型金额列，不换算旧账；无权及非法输入不得写入；失败与未知分别显示且不扩范围、不重复产生副作用。

覆盖：AC-2078

## 完成条件

- 按准确有权AI租户范围输出名称/ID/类型/可用/冻结/累计消耗分钟/有效期/控制状态八列。
- 当前筛选与同次快照一致，导出权限与普通账户只读分开。
- 本任务全部同ID验收检查有当前实现、正常/拒绝/失败/未知证据，关联页面五态及字段权限符合原规格。
- 开发完成目标库/精确文件/模块/数据接口/测试执行绑定，必要共享文件先后依赖已补齐，工程问题有可靠结论。
- 产品变动回产品规格重审；不可用局部实现或Mock结论替代真实远端与正式开工许可。

需保留实际改动、测试结果和 Review 证据。仅修改完成不等于验收通过。


## 本轮工程绑定边界

本任务为可承接的业务实施分解，尚未绑定生产仓库/技术栈。开发确定真实文件后填写allowed_files、context_files、changes并复检共享文件依赖；不得把原型参考文件当作生产可写授权。

只读原型行为参考：

- [ai-finance.js](../../../prototype/js/adapters/ai-finance.js) · 只读行为参考，非生产可写目标

需开发处理的问题：EQ-PLAT-FINANCE。
