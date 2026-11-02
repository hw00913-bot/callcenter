# TASK-044 原业务系统入站与结果回传

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md)

- [进入有权工作位置与保留专业能力 · FUNC\-2002](../features/FUNC-2002.md)

## 目标

按准确应用、租户、原客户任务接收既有导入及指定坐席；回传原完成结果。；失败/重复/回传未知保同次身份，不把新四节点事件自动扩为新的逐轮回传合同。

## 产品依据

- FUNC-2002 进入有权工作位置与保留专业能力：当前五顶栏只负责功能归位。按稳定页面/动作身份保留AI与Cloud现行专业操作、状态、资源、报表和业务接口，分别校验模块、成员、对象、读写/导出权。；来源 documentation/input/functions.json#FUNC-2002

来源根：`/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/开发交付包/工作资料/续接输入`；来源指纹：`edc5225b5022e6100a5e5848c84fb590eba1e70c2a584fffa610b9133c191a29`

## 前置任务

- TASK-043

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

局部逻辑：[LOCAL-PLAT-BUSINESS-API-IMPORT](../local-logic/LOCAL-PLAT-BUSINESS-API-IMPORT.md)、[LOCAL-PLAT-BUSINESS-API-RESULT](../local-logic/LOCAL-PLAT-BUSINESS-API-RESULT.md)

字段：[FIELD-PLAT-API-PAYLOAD](../field-specs.md#FIELD-PLAT-API-PAYLOAD)、[FIELD-PLAT-API-RESULT](../field-specs.md#FIELD-PLAT-API-RESULT)、[FIELD-PLAT-APP-CALLBACK](../field-specs.md#FIELD-PLAT-APP-CALLBACK)、[FIELD-PLAT-APP-ID](../field-specs.md#FIELD-PLAT-APP-ID)、[FIELD-PLAT-APP-TENANTS](../field-specs.md#FIELD-PLAT-APP-TENANTS)、[FIELD-PLAT-AUDIT](../field-specs.md#FIELD-PLAT-AUDIT)、[FIELD-PLAT-CALL-ID](../field-specs.md#FIELD-PLAT-CALL-ID)、[FIELD-PLAT-CUSTOMER-ID](../field-specs.md#FIELD-PLAT-CUSTOMER-ID)、[FIELD-PLAT-FOLLOWER](../field-specs.md#FIELD-PLAT-FOLLOWER)、[FIELD-PLAT-IMPORT-BATCH](../field-specs.md#FIELD-PLAT-IMPORT-BATCH)、[FIELD-PLAT-OP-STATE](../field-specs.md#FIELD-PLAT-OP-STATE)、[FIELD-PLAT-PRO-FOLLOW-STATE](../field-specs.md#FIELD-PLAT-PRO-FOLLOW-STATE)、[FIELD-PLAT-REQUEST](../field-specs.md#FIELD-PLAT-REQUEST)

## UI 依据

[全局 UI 规范](../ui-spec.md)

- [UI-PAGE-2204](../ui-pages/UI-PAGE-2204.md)
- [UI-PAGE-2220](../ui-pages/UI-PAGE-2220.md)

## 实现要求

- 按准确应用、租户、原客户任务接收既有导入及指定坐席；回传原完成结果。
- 失败/重复/回传未知保同次身份，不把新四节点事件自动扩为新的逐轮回传合同。
- 不扩大为通用CRM集成，不要求外部业务携带内部模板ID。
- 按所引LOCAL逐动作落实触发/前后置/分支；业务定义只读同源规格，不另抄一套规则。
- 依赖表示实施契约/共享守卫先就绪，不新增用户操作门槛；跨任务端到端由验收批次合并检查。
- 目标库、模块/服务/表/接口、精确可写文件及命令由开发在开工前绑定；当前空文件清单不授代码写入权。

## 产品验收

- **AC-2066**：保留原Cloud本人电话上线/离线、人工主动外呼、正常呼入、振铃填写和必要话后跟进；须当前有效成员、Cloud模块、作业权及本人有效坐席资源。谁实际接听谁填写，管理员配置/只读不以本人坐席为前提。
  依据：docs/functional-spec.json#AC-2066

- **AC-2067**：保留原接口客户任务指定坐席、振铃填写和后续人工跟进；原任务结果为待继续跟进/已完成，与新四节点运行终态不同。分配负责人和实际接听人分开，按准确业务ID归属，不用手机号合并任务。
  依据：docs/functional-spec.json#AC-2067

- **AC-2072**：保留坐席/技能/外呼组/队列/号码/号码池/分机/时间条件/账号资源、呼入规则、通话记录核对、七类Cloud报表、应用接入及必要DCC导入/回传。原专业字段和任务两态有独立语义；同号仅按tenant+enterprise+规范号码关联有权联系历史，不合并业务。确已缺失原任务且无通话/未处理中，仅原有权管理员可手工恢复待分配，不自动回收或增公海。五角色按读权播放/暂停/拖动有权录音。
  依据：docs/functional-spec.json#AC-2072

- **AC-2073**：原业务接口承接不扩为完整DCC或通用自动引擎；品牌四节点业务链条按本轮确认独立定义并与原任务准确映射。两条链以业务ID/执行段/任务/通话证据连接，不能把原专业完成等同新业务运行完成。
  依据：docs/functional-spec.json#AC-2073

## 测试要求（尚未执行）

### CHECK-PLAT-BUSINESS-API-IMPORT / manual

步骤：在准确有权范围触发“接收原业务系统导入与指定坐席”；分别执行正常输入、明确无权/失效/冲突、失败及未知结果分支；按所列字段边界复查保存与显示。

预期：原业务客户任务/分配结果准确受理，可按同请求核对，不扩大完整DCC范围；无权及非法输入不得写入；失败与未知分别显示且不扩范围、不重复产生副作用。

覆盖：AC-2067, AC-2072, AC-2073

### CHECK-PLAT-BUSINESS-API-RESULT / manual

步骤：在准确有权范围触发“回传原客户任务完成结果”；分别执行正常输入、明确无权/失效/冲突、失败及未知结果分支；按所列字段边界复查保存与显示。

预期：完成结果准确回传或保持待回传可恢复状态，不能以发出请求当对端已收；无权及非法输入不得写入；失败与未知分别显示且不扩范围、不重复产生副作用。

覆盖：AC-2066, AC-2067, AC-2072, AC-2073

## 完成条件

- 按准确应用、租户、原客户任务接收既有导入及指定坐席；回传原完成结果。
- 失败/重复/回传未知保同次身份，不把新四节点事件自动扩为新的逐轮回传合同。
- 本任务全部同ID验收检查有当前实现、正常/拒绝/失败/未知证据，关联页面五态及字段权限符合原规格。
- 开发完成目标库/精确文件/模块/数据接口/测试执行绑定，必要共享文件先后依赖已补齐，工程问题有可靠结论。
- 产品变动回产品规格重审；不可用局部实现或Mock结论替代真实远端与正式开工许可。

需保留实际改动、测试结果和 Review 证据。仅修改完成不等于验收通过。


## 本轮工程绑定边界

本任务为可承接的业务实施分解，尚未绑定生产仓库/技术栈。开发确定真实文件后填写allowed_files、context_files、changes并复检共享文件依赖；不得把原型参考文件当作生产可写授权。

只读原型行为参考：

- [module-host.js](../../../prototype/js/components/module-host.js) · 只读行为参考，非生产可写目标
- [business-link.js](../../../prototype/js/components/business-link.js) · 只读行为参考，非生产可写目标

需开发处理的问题：EQ-PLAT-PROFESSIONAL, ENG-FLOW-EXECUTION。

原专业操作：

- [cloud-receive-business-import](../原专业操作任务映射.md#cloud-receive-business-import)
- [cloud-deliver-business-result](../原专业操作任务映射.md#cloud-deliver-business-result)
