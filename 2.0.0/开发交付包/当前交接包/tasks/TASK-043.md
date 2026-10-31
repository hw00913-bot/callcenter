# TASK-043 原客户任务、联系档案和批次

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md)

- [进入有权工作位置与保留专业能力 · FUNC\-2002](../features/FUNC-2002.md)

## 目标

原professionalCustomer任务/批次、导入、分配与联系档案按稳定原身份保持。；原客户任务待继续跟进/已完成仍独立；同号联系归集不合并新业务身份。

## 产品依据

- FUNC-2002 进入有权工作位置与保留专业能力：当前五顶栏只负责功能归位。按稳定页面/动作身份保留AI与Cloud现行专业操作、状态、资源、报表和业务接口，分别校验模块、成员、对象、读写/导出权。；来源 documentation/input/functions.json#FUNC-2002

来源根：`/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/开发交付包/工作资料/续接输入`；来源指纹：`0904ba9de2798ea9878d0602f5fbc337ae523a60911c1b10dac967c13febffbe`

## 前置任务

- TASK-005
- TASK-009
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

全局规则：[GR-AUTH](../global-logic.md#GR-AUTH)、[GR-IDENTITY](../global-logic.md#GR-IDENTITY)、[GR-LIST-ORDER](../global-logic.md#GR-LIST-ORDER)、[GR-SCOPE](../global-logic.md#GR-SCOPE)、[GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)

局部逻辑：[LOCAL-PLAT-CUSTOMER-DIRECTORY](../local-logic/LOCAL-PLAT-CUSTOMER-DIRECTORY.md)、[LOCAL-PLAT-CUSTOMER-IMPORT](../local-logic/LOCAL-PLAT-CUSTOMER-IMPORT.md)、[LOCAL-PLAT-CUSTOMER-ASSIGN](../local-logic/LOCAL-PLAT-CUSTOMER-ASSIGN.md)、[LOCAL-PLAT-IMPORT-BATCH](../local-logic/LOCAL-PLAT-IMPORT-BATCH.md)

字段：[FIELD-PLAT-AUDIT](../field-specs.md#FIELD-PLAT-AUDIT)、[FIELD-PLAT-CALL-ID](../field-specs.md#FIELD-PLAT-CALL-ID)、[FIELD-PLAT-CUSTOMER-ID](../field-specs.md#FIELD-PLAT-CUSTOMER-ID)、[FIELD-PLAT-CUSTOMER-NAME](../field-specs.md#FIELD-PLAT-CUSTOMER-NAME)、[FIELD-PLAT-FOLLOWER](../field-specs.md#FIELD-PLAT-FOLLOWER)、[FIELD-PLAT-IMPORT-BATCH](../field-specs.md#FIELD-PLAT-IMPORT-BATCH)、[FIELD-PLAT-IMPORT-ROWS](../field-specs.md#FIELD-PLAT-IMPORT-ROWS)、[FIELD-PLAT-OP-STATE](../field-specs.md#FIELD-PLAT-OP-STATE)、[FIELD-PLAT-PAGING](../field-specs.md#FIELD-PLAT-PAGING)、[FIELD-PLAT-PHONE](../field-specs.md#FIELD-PLAT-PHONE)、[FIELD-PLAT-PRO-FIELD-DEF](../field-specs.md#FIELD-PLAT-PRO-FIELD-DEF)、[FIELD-PLAT-PRO-FOLLOW-STATE](../field-specs.md#FIELD-PLAT-PRO-FOLLOW-STATE)、[FIELD-PLAT-QUERY](../field-specs.md#FIELD-PLAT-QUERY)、[FIELD-PLAT-REQUEST](../field-specs.md#FIELD-PLAT-REQUEST)、[FIELD-PLAT-RESOURCE-SCOPE](../field-specs.md#FIELD-PLAT-RESOURCE-SCOPE)、[FIELD-PLAT-REVISION](../field-specs.md#FIELD-PLAT-REVISION)

## UI 依据

[全局 UI 规范](../ui-spec.md)

- [UI-PAGE-2203](../ui-pages/UI-PAGE-2203.md)
- [UI-PAGE-2204](../ui-pages/UI-PAGE-2204.md)

## 实现要求

- 原professionalCustomer任务/批次、导入、分配与联系档案按稳定原身份保持。
- 原客户任务待继续跟进/已完成仍独立；同号联系归集不合并新业务身份。
- 原专业坐席/任务分配不能替代新业务责任跟进人安排；不删除原能力。
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

- **AC-2147**：业务跟进/联系档案统一页签与tabpanel，键盘方向/Home/End可用；同身份切换保各自查询/分页，跨身份不恢复旧状态，显式客户详情与原摘要刷新仍定位正确。
  依据：docs/functional-spec.json#AC-2147

## 测试要求（尚未执行）

### CHECK-PLAT-CUSTOMER-DIRECTORY / manual

步骤：按当前续接版本执行：原客户联系视图查询或查看准确客户任务。前提：原客户对象读权及当前tenant+enterprise。操作：按准确业务记录ID查看；按tenant+enterprise+规范号码关联有权联系历史；相同号码只关联展示，不合并不同业务记录和业务归属；号码明文、录音、详情分别按读权，失败/空结果区分。分别构造：前提、字段及对象修订校验通过且结果明确成功；无权/字段不合法/对象失效/修订冲突；提交失败或结果未知。

预期：显示原客户任务及有权联系历史，不创建客户公海或跨租户共享；显示原客户任务及有权联系历史，不创建客户公海或跨租户共享；明确显示本次拒绝原因，保留可继续的输入和已确认原值，不作变更；失败保留原确认值；未知显示待核并按同请求核对，不重复提交或假报成功。

覆盖：AC-2066, AC-2067, AC-2072, AC-2073, AC-2147

### CHECK-PLAT-CUSTOMER-IMPORT / manual

步骤：在准确有权范围触发“原客户任务导入与字段映射校验”；分别执行正常输入、明确无权/失效/冲突、失败及未知结果分支；按所列字段边界复查保存与显示。

预期：合法专业名单入库并可分配；原专业导入不是新四节点模板自动启动；无权及非法输入不得写入；失败与未知分别显示且不扩范围、不重复产生副作用。

覆盖：AC-2067, AC-2072, AC-2073

### CHECK-PLAT-CUSTOMER-ASSIGN / manual

步骤：在准确有权范围触发“原客户任务分配跟进人”；分别执行正常输入、明确无权/失效/冲突、失败及未知结果分支；按所列字段边界复查保存与显示。

预期：准确负责人分配成功，实际接听人填写责任不变；不自动回收或转移业务归属；无权及非法输入不得写入；失败与未知分别显示且不扩范围、不重复产生副作用。

覆盖：AC-2067, AC-2072

### CHECK-PLAT-IMPORT-BATCH / manual

步骤：在准确有权范围触发“查询专业导入批次与详情”；分别执行正常输入、明确无权/失效/冲突、失败及未知结果分支；按所列字段边界复查保存与显示。

预期：可追溯原专业批次处理情况，与新业务导入链条按来源身份分开；无权及非法输入不得写入；失败与未知分别显示且不扩范围、不重复产生副作用。

覆盖：AC-2072, AC-2073

## 完成条件

- 原professionalCustomer任务/批次、导入、分配与联系档案按稳定原身份保持。
- 原客户任务待继续跟进/已完成仍独立；同号联系归集不合并新业务身份。
- 本任务全部同ID验收检查有当前实现、正常/拒绝/失败/未知证据，关联页面五态及字段权限符合原规格。
- 开发完成目标库/精确文件/模块/数据接口/测试执行绑定，必要共享文件先后依赖已补齐，工程问题有可靠结论。
- 产品变动回产品规格重审；不可用局部实现或Mock结论替代真实远端与正式开工许可。

需保留实际改动、测试结果和 Review 证据。仅修改完成不等于验收通过。


## 本轮工程绑定边界

本任务为可承接的业务实施分解，尚未绑定生产仓库/技术栈。开发确定真实文件后填写allowed_files、context_files、changes并复检共享文件依赖；不得把原型参考文件当作生产可写授权。

只读原型行为参考：

- [business-link.js](../../../prototype/js/components/business-link.js) · 只读行为参考，非生产可写目标
- [customer-import-enhancements.js](../../../prototype/js/adapters/customer-import-enhancements.js) · 只读行为参考，非生产可写目标

需开发处理的问题：EQ-PLAT-PROFESSIONAL。

原专业操作：

- [cloud-query-customers](../原专业操作任务映射.md#cloud-query-customers)
- [cloud-view-customer](../原专业操作任务映射.md#cloud-view-customer)
- [cloud-import-customers](../原专业操作任务映射.md#cloud-import-customers)
- [cloud-assign-customers](../原专业操作任务映射.md#cloud-assign-customers)
- [retained-source-cloud-import-batch-query](../原专业操作任务映射.md#retained-source-cloud-import-batch-query)
- [retained-source-cloud-import-batch-detail](../原专业操作任务映射.md#retained-source-cloud-import-batch-detail)
