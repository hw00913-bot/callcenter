# TASK-051 技能目录与坐席技能关联

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md)

- [进入有权工作位置与保留专业能力 · FUNC\-2002](../features/FUNC-2002.md)

## 目标

维护有权技能目录及坐席技能等级/成员，按准确tenant/enterprise与稳定ID。；配置和实际电话资格保持原联动，不以名称或首项替代。

## 产品依据

- FUNC-2002 进入有权工作位置与保留专业能力：当前五顶栏只负责功能归位。按稳定页面/动作身份保留AI与Cloud现行专业操作、状态、资源、报表和业务接口，分别校验模块、成员、对象、读写/导出权。；来源 documentation/input/functions.json#FUNC-2002

来源根：`/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/开发交付包/工作资料/续接输入`；来源指纹：`b0292b83ba50e66ed754b44bc97cfa25bab040c4f00b70baa8e542df666aeccf`

## 前置任务

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

局部逻辑：[LOCAL-PLAT-RESOURCE-SKILL-QUERY](../local-logic/LOCAL-PLAT-RESOURCE-SKILL-QUERY.md)、[LOCAL-PLAT-RESOURCE-SKILL-SAVE](../local-logic/LOCAL-PLAT-RESOURCE-SKILL-SAVE.md)、[LOCAL-PLAT-SKILL-MEMBER](../local-logic/LOCAL-PLAT-SKILL-MEMBER.md)

字段：[FIELD-PLAT-AUDIT](../field-specs.md#FIELD-PLAT-AUDIT)、[FIELD-PLAT-OP-STATE](../field-specs.md#FIELD-PLAT-OP-STATE)、[FIELD-PLAT-PAGING](../field-specs.md#FIELD-PLAT-PAGING)、[FIELD-PLAT-QUERY](../field-specs.md#FIELD-PLAT-QUERY)、[FIELD-PLAT-REQUEST](../field-specs.md#FIELD-PLAT-REQUEST)、[FIELD-PLAT-RESOURCE-SCOPE](../field-specs.md#FIELD-PLAT-RESOURCE-SCOPE)、[FIELD-PLAT-RESOURCE-STATE](../field-specs.md#FIELD-PLAT-RESOURCE-STATE)、[FIELD-PLAT-REVISION](../field-specs.md#FIELD-PLAT-REVISION)、[FIELD-PLAT-SEAT-ID](../field-specs.md#FIELD-PLAT-SEAT-ID)、[FIELD-PLAT-SKILL-ID](../field-specs.md#FIELD-PLAT-SKILL-ID)、[FIELD-PLAT-SKILL-LEVEL](../field-specs.md#FIELD-PLAT-SKILL-LEVEL)、[FIELD-PLAT-SKILL-MEMBERS](../field-specs.md#FIELD-PLAT-SKILL-MEMBERS)、[FIELD-PLAT-SKILL-NAME](../field-specs.md#FIELD-PLAT-SKILL-NAME)

## UI 依据

[全局 UI 规范](../ui-spec.md)

- [UI-PAGE-2211](../ui-pages/UI-PAGE-2211.md)

## 实现要求

- 维护有权技能目录及坐席技能等级/成员，按准确tenant/enterprise与稳定ID。
- 配置和实际电话资格保持原联动，不以名称或首项替代。
- 无权/缺资源/未知映射不开放拨接资格。
- 按所引LOCAL逐动作落实触发/前后置/分支；业务定义只读同源规格，不另抄一套规则。
- 依赖表示实施契约/共享守卫先就绪，不新增用户操作门槛；跨任务端到端由验收批次合并检查。
- 目标库、模块/服务/表/接口、精确可写文件及命令由开发在开工前绑定；当前空文件清单不授代码写入权。

## 产品验收

- **AC-2071**：所有专业资源按准确租户+供应商+enterprise+nativeId及用途判定；资源独立平台授权不是新角色或业务数据共享。IVR必须真实外呼可执行流程，本地/呼入流程ID不可替代。
  依据：docs/functional-spec.json#AC-2071

- **AC-2072**：保留坐席/技能/外呼组/队列/号码/号码池/分机/时间条件/账号资源、呼入规则、通话记录核对、七类Cloud报表、应用接入及必要DCC导入/回传。原专业字段和任务两态有独立语义；同号仅按tenant+enterprise+规范号码关联有权联系历史，不合并业务。确已缺失原任务且无通话/未处理中，仅原有权管理员可手工恢复待分配，不自动回收或增公海。五角色按读权播放/暂停/拖动有权录音。
  依据：docs/functional-spec.json#AC-2072

## 测试要求（尚未执行）

### CHECK-PLAT-RESOURCE-SKILL-QUERY / manual

步骤：在准确有权范围触发“查询和查看技能”；分别执行正常输入、明确无权/失效/冲突、失败及未知结果分支；按所列字段边界复查保存与显示。

预期：有权技能当前目录与状态可读，读权不授写/导入/监管；无权及非法输入不得写入；失败与未知分别显示且不扩范围、不重复产生副作用。

覆盖：AC-2071, AC-2072

### CHECK-PLAT-RESOURCE-SKILL-SAVE / manual

步骤：在准确有权范围触发“创建、编辑或按允许动作保存技能”；分别执行正常输入、明确无权/失效/冲突、失败及未知结果分支；按所列字段边界复查保存与显示。

预期：准确技能允许配置确认保存；不假报供应商生效或静默改其他资源；无权及非法输入不得写入；失败与未知分别显示且不扩范围、不重复产生副作用。

覆盖：AC-2071, AC-2072

### CHECK-PLAT-SKILL-MEMBER / manual

步骤：在准确有权范围触发“增删坐席技能或调整技能等级”；分别执行正常输入、明确无权/失效/冲突、失败及未知结果分支；按所列字段边界复查保存与显示。

预期：准确成员关系与等级状态确认保存，未生效配置保持待提交/待核；无权及非法输入不得写入；失败与未知分别显示且不扩范围、不重复产生副作用。

覆盖：AC-2071, AC-2072

## 完成条件

- 维护有权技能目录及坐席技能等级/成员，按准确tenant/enterprise与稳定ID。
- 配置和实际电话资格保持原联动，不以名称或首项替代。
- 本任务全部同ID验收检查有当前实现、正常/拒绝/失败/未知证据，关联页面五态及字段权限符合原规格。
- 开发完成目标库/精确文件/模块/数据接口/测试执行绑定，必要共享文件先后依赖已补齐，工程问题有可靠结论。
- 产品变动回产品规格重审；不可用局部实现或Mock结论替代真实远端与正式开工许可。

需保留实际改动、测试结果和 Review 证据。仅修改完成不等于验收通过。


## 本轮工程绑定边界

本任务为可承接的业务实施分解，尚未绑定生产仓库/技术栈。开发确定真实文件后填写allowed_files、context_files、changes并复检共享文件依赖；不得把原型参考文件当作生产可写授权。

只读原型行为参考：

- [module-host.js](../../../prototype/js/components/module-host.js) · 只读行为参考，非生产可写目标

需开发处理的问题：EQ-PLAT-PROFESSIONAL。

原专业操作：

- [retained-source-cloud-agent-skill-query](../原专业操作任务映射.md#retained-source-cloud-agent-skill-query)
- [retained-source-cloud-agent-skill-unassign](../原专业操作任务映射.md#retained-source-cloud-agent-skill-unassign)
- [retained-source-cloud-agent-skill-submit-pending](../原专业操作任务映射.md#retained-source-cloud-agent-skill-submit-pending)
- [retained-source-cloud-agent-skill-level](../原专业操作任务映射.md#retained-source-cloud-agent-skill-level)
- [retained-source-cloud-skill-query](../原专业操作任务映射.md#retained-source-cloud-skill-query)
- [retained-source-cloud-skill-detail](../原专业操作任务映射.md#retained-source-cloud-skill-detail)
- [retained-source-cloud-skill-create](../原专业操作任务映射.md#retained-source-cloud-skill-create)
- [retained-source-cloud-skill-edit](../原专业操作任务映射.md#retained-source-cloud-skill-edit)
- [retained-source-cloud-agent-skill-add](../原专业操作任务映射.md#retained-source-cloud-agent-skill-add)
