# TASK-037 原黑名单分组和号码维护

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md)

- [进入有权工作位置与保留专业能力 · FUNC\-2002](../features/FUNC-2002.md)
- [查询本租户黑名单分组及号码 · FUNC\-2020](../features/FUNC-2020.md)

## 目标

维护本租户准确原分组/号码模型，查询、导入、移动、删除分别按来源资格。；超管只读，原运营维护不扩大到客户拒联解除；空组和系统分组保护保留。

## 产品依据

- FUNC-2002 进入有权工作位置与保留专业能力：当前五顶栏只负责功能归位。按稳定页面/动作身份保留AI与Cloud现行专业操作、状态、资源、报表和业务接口，分别校验模块、成员、对象、读写/导出权。；来源 documentation/input/functions.json#FUNC-2002
- FUNC-2020 查询本租户黑名单分组及号码：沿原分组+号码唯一主维护模型查询本租户名单及客户拒联来源；超管仅查看，租户管理员/运营各按既有操作资格。；来源 documentation/input/functions.json#FUNC-2020

来源根：`/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/开发交付包/工作资料/续接输入`；来源指纹：`edc5225b5022e6100a5e5848c84fb590eba1e70c2a584fffa610b9133c191a29`

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

局部逻辑：[LOCAL-PLAT-BAN-QUERY](../local-logic/LOCAL-PLAT-BAN-QUERY.md)、[LOCAL-PLAT-BAN-GROUP-SAVE](../local-logic/LOCAL-PLAT-BAN-GROUP-SAVE.md)、[LOCAL-PLAT-BAN-GROUP-DELETE](../local-logic/LOCAL-PLAT-BAN-GROUP-DELETE.md)、[LOCAL-PLAT-BAN-NUMBERS](../local-logic/LOCAL-PLAT-BAN-NUMBERS.md)、[LOCAL-PLAT-BAN-MOVE](../local-logic/LOCAL-PLAT-BAN-MOVE.md)、[LOCAL-PLAT-BAN-REMOVE](../local-logic/LOCAL-PLAT-BAN-REMOVE.md)

字段：[FIELD-PLAT-AUDIT](../field-specs.md#FIELD-PLAT-AUDIT)、[FIELD-PLAT-BAN-ADD-TYPE](../field-specs.md#FIELD-PLAT-BAN-ADD-TYPE)、[FIELD-PLAT-BAN-COUNT](../field-specs.md#FIELD-PLAT-BAN-COUNT)、[FIELD-PLAT-BAN-CUSTOMER](../field-specs.md#FIELD-PLAT-BAN-CUSTOMER)、[FIELD-PLAT-BAN-DESC](../field-specs.md#FIELD-PLAT-BAN-DESC)、[FIELD-PLAT-BAN-EXPIRY](../field-specs.md#FIELD-PLAT-BAN-EXPIRY)、[FIELD-PLAT-BAN-GROUP](../field-specs.md#FIELD-PLAT-BAN-GROUP)、[FIELD-PLAT-BAN-ID](../field-specs.md#FIELD-PLAT-BAN-ID)、[FIELD-PLAT-BAN-LIFETIME](../field-specs.md#FIELD-PLAT-BAN-LIFETIME)、[FIELD-PLAT-BAN-NAME](../field-specs.md#FIELD-PLAT-BAN-NAME)、[FIELD-PLAT-BAN-PHONE](../field-specs.md#FIELD-PLAT-BAN-PHONE)、[FIELD-PLAT-BAN-REASON](../field-specs.md#FIELD-PLAT-BAN-REASON)、[FIELD-PLAT-BAN-REMOTE](../field-specs.md#FIELD-PLAT-BAN-REMOTE)、[FIELD-PLAT-BAN-STATE](../field-specs.md#FIELD-PLAT-BAN-STATE)、[FIELD-PLAT-CURRENT-TENANT](../field-specs.md#FIELD-PLAT-CURRENT-TENANT)、[FIELD-PLAT-IMPORT-ROWS](../field-specs.md#FIELD-PLAT-IMPORT-ROWS)、[FIELD-PLAT-OP-STATE](../field-specs.md#FIELD-PLAT-OP-STATE)、[FIELD-PLAT-PAGING](../field-specs.md#FIELD-PLAT-PAGING)、[FIELD-PLAT-QUERY](../field-specs.md#FIELD-PLAT-QUERY)、[FIELD-PLAT-REQUEST](../field-specs.md#FIELD-PLAT-REQUEST)、[FIELD-PLAT-REVISION](../field-specs.md#FIELD-PLAT-REVISION)、[FIELD-PLAT-UPDATED](../field-specs.md#FIELD-PLAT-UPDATED)

## UI 依据

[全局 UI 规范](../ui-spec.md)

- [UI-PAGE-2007](../ui-pages/UI-PAGE-2007.md)

## 实现要求

- 维护本租户准确原分组/号码模型，查询、导入、移动、删除分别按来源资格。
- 超管只读，原运营维护不扩大到客户拒联解除；空组和系统分组保护保留。
- 不新建平行禁呼主维护，不因同品牌共享号码限制。
- 按所引LOCAL逐动作落实触发/前后置/分支；业务定义只读同源规格，不另抄一套规则。
- 依赖表示实施契约/共享守卫先就绪，不新增用户操作门槛；跨任务端到端由验收批次合并检查。
- 目标库、模块/服务/表/接口、精确可写文件及命令由开发在开工前绑定；当前空文件清单不授代码写入权。

## 产品验收

- **AC-2048**：呼叫拦截沿当前租户原AI分组+号码唯一主维护页面，客户拒联来源在同页展示；不设置公共/专项两套名单页签。超管只读，租户管理员/运营按原操作及来源权限维护，不跨租户/品牌共享。
  依据：docs/functional-spec.json#AC-2048

- **AC-2049**：普通组有效期/用途、人工/AI确认拒联来源和当前本地有效状态分别判断；已解除/到期不生效、未知不补永久。只处理当前有效源及今后事件，取消旧历史名单迁移/对账范围。
  依据：docs/functional-spec.json#AC-2049

- **AC-2050**：本地生效与已有供应商同步状态分开表达；没有实际回执不能显示远端已成功。
  依据：docs/functional-spec.json#AC-2050

- **AC-2062**：解除仅影响准确本来源，不清其他仍有效来源；已解除/到期不能被旧事件重放复活。新拒联使用新来源请求；本地与远端终态分开，未知先核对同请求，不伪造成功。
  依据：docs/functional-spec.json#AC-2062

## 测试要求（尚未执行）

### CHECK-PLAT-BAN-QUERY / manual

步骤：在准确有权范围触发“查询黑名单分组与号码”；分别执行正常输入、明确无权/失效/冲突、失败及未知结果分支；按所列字段边界复查保存与显示。

预期：原分组、号码、来源和同步状态可查；未增加公共/专项两套名单；无权及非法输入不得写入；失败与未知分别显示且不扩范围、不重复产生副作用。

覆盖：AC-2048, AC-2049, AC-2050

### CHECK-PLAT-BAN-GROUP-SAVE / manual

步骤：在准确有权范围触发“创建或修改普通黑名单分组”；分别执行正常输入、明确无权/失效/冲突、失败及未知结果分支；按所列字段边界复查保存与显示。

预期：普通分组配置准确保存；客户拒联证据和长期来源不被覆盖；无权及非法输入不得写入；失败与未知分别显示且不扩范围、不重复产生副作用。

覆盖：AC-2048, AC-2049, AC-2050

### CHECK-PLAT-BAN-GROUP-DELETE / manual

步骤：在准确有权范围触发“删除空的普通黑名单分组”；分别执行正常输入、明确无权/失效/冲突、失败及未知结果分支；按所列字段边界复查保存与显示。

预期：只有准确可删空组被删除；取消/失败不清任何号码；无权及非法输入不得写入；失败与未知分别显示且不扩范围、不重复产生副作用。

覆盖：AC-2048, AC-2050

### CHECK-PLAT-BAN-NUMBERS / manual

步骤：在准确有权范围触发“新增或批量导入普通黑名单号码”；分别执行正常输入、明确无权/失效/冲突、失败及未知结果分支；按所列字段边界复查保存与显示。

预期：仅准确目标组的合法号码入库，范围与期限明确；无权及非法输入不得写入；失败与未知分别显示且不扩范围、不重复产生副作用。

覆盖：AC-2048, AC-2049, AC-2050

### CHECK-PLAT-BAN-MOVE / manual

步骤：在准确有权范围触发“移动普通分组号码”；分别执行正常输入、明确无权/失效/冲突、失败及未知结果分支；按所列字段边界复查保存与显示。

预期：仅选中可移动普通记录更换组，不改来源或其他组号码；无权及非法输入不得写入；失败与未知分别显示且不扩范围、不重复产生副作用。

覆盖：AC-2048, AC-2050

### CHECK-PLAT-BAN-REMOVE / manual

步骤：在准确有权范围触发“移除普通组号码”；分别执行正常输入、明确无权/失效/冲突、失败及未知结果分支；按所列字段边界复查保存与显示。

预期：普通组选中记录按准确终态移除，其余来源仍可阻止外呼；无权及非法输入不得写入；失败与未知分别显示且不扩范围、不重复产生副作用。

覆盖：AC-2048, AC-2050, AC-2062

## 完成条件

- 维护本租户准确原分组/号码模型，查询、导入、移动、删除分别按来源资格。
- 超管只读，原运营维护不扩大到客户拒联解除；空组和系统分组保护保留。
- 本任务全部同ID验收检查有当前实现、正常/拒绝/失败/未知证据，关联页面五态及字段权限符合原规格。
- 开发完成目标库/精确文件/模块/数据接口/测试执行绑定，必要共享文件先后依赖已补齐，工程问题有可靠结论。
- 产品变动回产品规格重审；不可用局部实现或Mock结论替代真实远端与正式开工许可。

需保留实际改动、测试结果和 Review 证据。仅修改完成不等于验收通过。


## 本轮工程绑定边界

本任务为可承接的业务实施分解，尚未绑定生产仓库/技术栈。开发确定真实文件后填写allowed_files、context_files、changes并复检共享文件依赖；不得把原型参考文件当作生产可写授权。

只读原型行为参考：

- [contact-policy.js](../../../prototype/js/components/contact-policy.js) · 只读行为参考，非生产可写目标
- [module-host.js](../../../prototype/js/components/module-host.js) · 只读行为参考，非生产可写目标

需开发处理的问题：EQ-PLAT-CONTACT-STATE。

原专业操作：

- [retained-source-ai-legacy-ban-query-groups](../原专业操作任务映射.md#retained-source-ai-legacy-ban-query-groups)
- [retained-source-ai-legacy-ban-query-records](../原专业操作任务映射.md#retained-source-ai-legacy-ban-query-records)
- [retained-source-ai-legacy-ban-create-group](../原专业操作任务映射.md#retained-source-ai-legacy-ban-create-group)
- [retained-source-ai-legacy-ban-update-group](../原专业操作任务映射.md#retained-source-ai-legacy-ban-update-group)
- [retained-source-ai-legacy-ban-delete-group](../原专业操作任务映射.md#retained-source-ai-legacy-ban-delete-group)
- [retained-source-ai-legacy-ban-add-number](../原专业操作任务映射.md#retained-source-ai-legacy-ban-add-number)
- [retained-source-ai-legacy-ban-import-numbers](../原专业操作任务映射.md#retained-source-ai-legacy-ban-import-numbers)
- [retained-source-ai-legacy-ban-move-numbers](../原专业操作任务映射.md#retained-source-ai-legacy-ban-move-numbers)
- [retained-source-ai-legacy-ban-remove-numbers](../原专业操作任务映射.md#retained-source-ai-legacy-ban-remove-numbers)
