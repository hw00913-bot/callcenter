# TASK-047 十类专业报表查询、明细和导出

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md)

- [进入有权工作位置与保留专业能力 · FUNC\-2002](../features/FUNC-2002.md)

## 目标

按Cloud七类/AI三类的粒度、归期、列、单位、分母和有效样本解释统计。；明细只沿准确业务/任务/call键查询；已实现导出承接同一筛选，未实现指标明确展示。

## 产品依据

- FUNC-2002 进入有权工作位置与保留专业能力：当前五顶栏只负责功能归位。按稳定页面/动作身份保留AI与Cloud现行专业操作、状态、资源、报表和业务接口，分别校验模块、成员、对象、读写/导出权。；来源 documentation/input/functions.json#FUNC-2002

来源根：`/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/开发交付包/工作资料/续接输入`；来源指纹：`b0292b83ba50e66ed754b44bc97cfa25bab040c4f00b70baa8e542df666aeccf`

## 前置任务

- TASK-021
- TASK-036
- TASK-043
- TASK-046

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

局部逻辑：[LOCAL-PLAT-REPORT-QUERY](../local-logic/LOCAL-PLAT-REPORT-QUERY.md)、[LOCAL-PLAT-REPORT-DRILL](../local-logic/LOCAL-PLAT-REPORT-DRILL.md)、[LOCAL-PLAT-REPORT-EXPORT](../local-logic/LOCAL-PLAT-REPORT-EXPORT.md)

字段：[FIELD-PLAT-CALL-ID](../field-specs.md#FIELD-PLAT-CALL-ID)、[FIELD-PLAT-CUSTOMER-ID](../field-specs.md#FIELD-PLAT-CUSTOMER-ID)、[FIELD-PLAT-PAGING](../field-specs.md#FIELD-PLAT-PAGING)、[FIELD-PLAT-QUERY](../field-specs.md#FIELD-PLAT-QUERY)、[FIELD-PLAT-REPORT-DATA](../field-specs.md#FIELD-PLAT-REPORT-DATA)、[FIELD-PLAT-REPORT-EXPORT](../field-specs.md#FIELD-PLAT-REPORT-EXPORT)、[FIELD-PLAT-REPORT-KIND](../field-specs.md#FIELD-PLAT-REPORT-KIND)、[FIELD-PLAT-RESOURCE-SCOPE](../field-specs.md#FIELD-PLAT-RESOURCE-SCOPE)、[FIELD-PLAT-TASK-ID](../field-specs.md#FIELD-PLAT-TASK-ID)

## UI 依据

[全局 UI 规范](../ui-spec.md)

- [UI-PAGE-2105](../ui-pages/UI-PAGE-2105.md)
- [UI-PAGE-2106](../ui-pages/UI-PAGE-2106.md)
- [UI-PAGE-2107](../ui-pages/UI-PAGE-2107.md)
- [UI-PAGE-2209](../ui-pages/UI-PAGE-2209.md)

## 实现要求

- 按Cloud七类/AI三类的粒度、归期、列、单位、分母和有效样本解释统计。
- 明细只沿准确业务/任务/call键查询；已实现导出承接同一筛选，未实现指标明确展示。
- 未知/缺时长不补0；联系次数/接通/处理完成/业务达成不混算。
- 按所引LOCAL逐动作落实触发/前后置/分支；业务定义只读同源规格，不另抄一套规则。
- 依赖表示实施契约/共享守卫先就绪，不新增用户操作门槛；跨任务端到端由验收批次合并检查。
- 目标库、模块/服务/表/接口、精确可写文件及命令由开发在开工前绑定；当前空文件清单不授代码写入权。

## 产品验收

- **AC-2063**：保留已确认的222项AI/Cloud原专业能力，按稳定operation_key、PAGE、ACTION逐项关联当前触发/输入/权限/状态/终态；原仅有界面但未实现或缺证控制不自动升级，Mock交互不证明真实生产可用。
  依据：docs/functional-spec.json#AC-2063

- **AC-2064**：AI任务、通话/计费/线索统计、通话/线索记录、场景、标签及服务能力保留；原首页摘要/使用归AI用量与服务。AI场景使用与标签配置权分离；标签按准确supplier/tenant/type/tagScene/category/brand/revision执行段快照校验。原始与映射结果保留，未匹配不回退首项。准确映射标签可作人工确认路径条件，不直接写业务字段，不因AI回执自动推进。
  依据：docs/functional-spec.json#AC-2064

- **AC-2065**：账号租户资料统一维护后，AI原专属资源、统一分钟池和服务账务继续独立于Cloud；五角色按范围可只读账户和充值流水，四租户角色仅本租户。套餐办理/充值/调账/同请求核对/服务汇总导出仅超管有权，不能凭读权办理。
  依据：docs/functional-spec.json#AC-2065

- **AC-2072**：保留坐席/技能/外呼组/队列/号码/号码池/分机/时间条件/账号资源、呼入规则、通话记录核对、七类Cloud报表、应用接入及必要DCC导入/回传。原专业字段和任务两态有独立语义；同号仅按tenant+enterprise+规范号码关联有权联系历史，不合并业务。确已缺失原任务且无通话/未处理中，仅原有权管理员可手工恢复待分配，不自动回收或增公海。五角色按读权播放/暂停/拖动有权录音。
  依据：docs/functional-spec.json#AC-2072

- **AC-2078**：仅有原财务导出权超管，将当前授权AI租户交集的同次可靠服务快照导出固定8列：租户名称、租户ID、租户类型、可用分钟、冻结分钟、累计消耗分钟、有效期、呼叫控制状态。映射或任必需值未知阻止出文件；不受原计费日期/平台或公共租户列表筛选隐式改变，不恢复旧金额列或换算旧账。
  依据：docs/functional-spec.json#AC-2078

## 测试要求（尚未执行）

### CHECK-PLAT-REPORT-QUERY / manual

步骤：在准确有权范围触发“查询AI三类与Cloud七类专业报表”；分别执行正常输入、明确无权/失效/冲突、失败及未知结果分支；按所列字段边界复查保存与显示。逐个打开Cloud七类与AI三类，核对列、基数及单位；用Cloud接通8/未接2/未知1、0秒有效样本、缺失时长、首队列多次流转、同号跨批次、AI80次名单50接通12未接数据检查公式与明细。

预期：独立专业报表正确展示，AI/Cloud指标与账务不混合；无权及非法输入不得写入；失败与未知分别显示且不扩范围、不重复产生副作用。；Cloud接通80.0%且未知不入分母、0秒有效无样本—；AI例为接通62.50%/触达77.50%；累计/周期、客户/尝试、客户时长/双方时长/计费分钟不混用。

覆盖：AC-2063, AC-2064, AC-2065, AC-2072

### CHECK-PLAT-REPORT-DRILL / manual

步骤：在准确有权范围触发“查看七类Cloud报表明细”；分别执行正常输入、明确无权/失效/冲突、失败及未知结果分支；按所列字段边界复查保存与显示。逐个打开Cloud七类与AI三类，核对列、基数及单位；用Cloud接通8/未接2/未知1、0秒有效样本、缺失时长、首队列多次流转、同号跨批次、AI80次名单50接通12未接数据检查公式与明细。

预期：显示对应Cloud报表授权明细，不因图表可读获取业务写权；无权及非法输入不得写入；失败与未知分别显示且不扩范围、不重复产生副作用。；Cloud接通80.0%且未知不入分母、0秒有效无样本—；AI例为接通62.50%/触达77.50%；累计/周期、客户/尝试、客户时长/双方时长/计费分钟不混用。

覆盖：AC-2072

### CHECK-PLAT-REPORT-EXPORT / manual

步骤：在准确有权范围触发“导出七类Cloud专业报表”；分别执行正常输入、明确无权/失效/冲突、失败及未知结果分支；按所列字段边界复查保存与显示。逐个打开Cloud七类与AI三类，核对列、基数及单位；用Cloud接通8/未接2/未知1、0秒有效样本、缺失时长、首队列多次流转、同号跨批次、AI80次名单50接通12未接数据检查公式与明细。

预期：准确Cloud报表文件生成，原AI仅有界面但未实现不假报导出成功；无权及非法输入不得写入；失败与未知分别显示且不扩范围、不重复产生副作用。；Cloud接通80.0%且未知不入分母、0秒有效无样本—；AI例为接通62.50%/触达77.50%；累计/周期、客户/尝试、客户时长/双方时长/计费分钟不混用。

覆盖：AC-2072, AC-2078

## 完成条件

- 按Cloud七类/AI三类的粒度、归期、列、单位、分母和有效样本解释统计。
- 明细只沿准确业务/任务/call键查询；已实现导出承接同一筛选，未实现指标明确展示。
- 本任务全部同ID验收检查有当前实现、正常/拒绝/失败/未知证据，关联页面五态及字段权限符合原规格。
- 开发完成目标库/精确文件/模块/数据接口/测试执行绑定，必要共享文件先后依赖已补齐，工程问题有可靠结论。
- 产品变动回产品规格重审；不可用局部实现或Mock结论替代真实远端与正式开工许可。

需保留实际改动、测试结果和 Review 证据。仅修改完成不等于验收通过。


## 本轮工程绑定边界

本任务为可承接的业务实施分解，尚未绑定生产仓库/技术栈。开发确定真实文件后填写allowed_files、context_files、changes并复检共享文件依赖；不得把原型参考文件当作生产可写授权。

只读原型行为参考：

- [module-host.js](../../../prototype/js/components/module-host.js) · 只读行为参考，非生产可写目标
- [list-order.js](../../../prototype/js/components/list-order.js) · 只读行为参考，非生产可写目标

需开发处理的问题：EQ-PLAT-PROFESSIONAL, EQ-PLAT-FINANCE。

原专业操作：

- [ai-query-call-statistics](../原专业操作任务映射.md#ai-query-call-statistics)
- [ai-query-billing-statistics](../原专业操作任务映射.md#ai-query-billing-statistics)
- [ai-query-lead-statistics](../原专业操作任务映射.md#ai-query-lead-statistics)
- [ai-view-billing-detail](../原专业操作任务映射.md#ai-view-billing-detail)
- [cloud-query-report-overview](../原专业操作任务映射.md#cloud-query-report-overview)
- [cloud-query-report-leads](../原专业操作任务映射.md#cloud-query-report-leads)
- [cloud-query-report-customers](../原专业操作任务映射.md#cloud-query-report-customers)
- [cloud-query-report-outbound](../原专业操作任务映射.md#cloud-query-report-outbound)
- [cloud-query-report-agents](../原专业操作任务映射.md#cloud-query-report-agents)
- [cloud-query-report-inbound](../原专业操作任务映射.md#cloud-query-report-inbound)
- [cloud-query-report-skills](../原专业操作任务映射.md#cloud-query-report-skills)
- [retained-source-cloud-export-report-agents](../原专业操作任务映射.md#retained-source-cloud-export-report-agents)
- [retained-source-cloud-export-report-customers](../原专业操作任务映射.md#retained-source-cloud-export-report-customers)
- [retained-source-cloud-export-report-inbound](../原专业操作任务映射.md#retained-source-cloud-export-report-inbound)
- [retained-source-cloud-export-report-leads](../原专业操作任务映射.md#retained-source-cloud-export-report-leads)
- [retained-source-cloud-export-report-outbound](../原专业操作任务映射.md#retained-source-cloud-export-report-outbound)
- [retained-source-cloud-export-report-overview](../原专业操作任务映射.md#retained-source-cloud-export-report-overview)
- [retained-source-cloud-export-report-skills](../原专业操作任务映射.md#retained-source-cloud-export-report-skills)
- [retained-source-cloud-drill-report-overview](../原专业操作任务映射.md#retained-source-cloud-drill-report-overview)
- [retained-source-cloud-drill-report-leads](../原专业操作任务映射.md#retained-source-cloud-drill-report-leads)
- [retained-source-cloud-drill-report-customers](../原专业操作任务映射.md#retained-source-cloud-drill-report-customers)
- [retained-source-cloud-drill-report-outbound](../原专业操作任务映射.md#retained-source-cloud-drill-report-outbound)
- [retained-source-cloud-drill-report-agents](../原专业操作任务映射.md#retained-source-cloud-drill-report-agents)
- [retained-source-cloud-drill-report-inbound](../原专业操作任务映射.md#retained-source-cloud-drill-report-inbound)
- [retained-source-cloud-drill-report-skills](../原专业操作任务映射.md#retained-source-cloud-drill-report-skills)
