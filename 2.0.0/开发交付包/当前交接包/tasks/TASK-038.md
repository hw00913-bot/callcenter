# TASK-038 名单来源详情与供应商同步核对

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md)

- [进入有权工作位置与保留专业能力 · FUNC\-2002](../features/FUNC-2002.md)
- [查询本租户黑名单分组及号码 · FUNC\-2020](../features/FUNC-2020.md)
- [查看黑名单来源及远端同步详情 · FUNC\-2021](../features/FUNC-2021.md)

## 目标

逐来源展示期限、同步状态、准确供应商企业及当前结果。；配置/启停/重试按准确原请求和终态核对，不用本方保存冒充远端生效。

## 产品依据

- FUNC-2002 进入有权工作位置与保留专业能力：当前五顶栏只负责功能归位。按稳定页面/动作身份保留AI与Cloud现行专业操作、状态、资源、报表和业务接口，分别校验模块、成员、对象、读写/导出权。；来源 documentation/input/functions.json#FUNC-2002
- FUNC-2020 查询本租户黑名单分组及号码：沿原分组+号码唯一主维护模型查询本租户名单及客户拒联来源；超管仅查看，租户管理员/运营各按既有操作资格。；来源 documentation/input/functions.json#FUNC-2020
- FUNC-2021 查看黑名单来源及远端同步详情：显示准确号码来源、通话、原因、有效期、解除和逐来源远端足迹；本地生效与供应商终态明确分开。；来源 documentation/input/functions.json#FUNC-2021

来源根：`/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/开发交付包/工作资料/续接输入`；来源指纹：`ac24ea3af455fa8052e0daeaa799eea0265f5d02f520b26bdd98ac1e620a1a6c`

## 前置任务

- TASK-037
- TASK-055

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

局部逻辑：[LOCAL-PLAT-BAN-DETAIL](../local-logic/LOCAL-PLAT-BAN-DETAIL.md)、[LOCAL-PLAT-BAN-SYNC](../local-logic/LOCAL-PLAT-BAN-SYNC.md)

字段：[FIELD-PLAT-AUDIT](../field-specs.md#FIELD-PLAT-AUDIT)、[FIELD-PLAT-BAN-BINDING](../field-specs.md#FIELD-PLAT-BAN-BINDING)、[FIELD-PLAT-BAN-GROUP](../field-specs.md#FIELD-PLAT-BAN-GROUP)、[FIELD-PLAT-BAN-ID](../field-specs.md#FIELD-PLAT-BAN-ID)、[FIELD-PLAT-BAN-LIFETIME](../field-specs.md#FIELD-PLAT-BAN-LIFETIME)、[FIELD-PLAT-BAN-RELEASE](../field-specs.md#FIELD-PLAT-BAN-RELEASE)、[FIELD-PLAT-BAN-REMOTE](../field-specs.md#FIELD-PLAT-BAN-REMOTE)、[FIELD-PLAT-BAN-SOURCE](../field-specs.md#FIELD-PLAT-BAN-SOURCE)、[FIELD-PLAT-BAN-STATE](../field-specs.md#FIELD-PLAT-BAN-STATE)、[FIELD-PLAT-REQUEST](../field-specs.md#FIELD-PLAT-REQUEST)、[FIELD-PLAT-REVISION](../field-specs.md#FIELD-PLAT-REVISION)

## UI 依据

[全局 UI 规范](../ui-spec.md)

- [UI-PAGE-2007](../ui-pages/UI-PAGE-2007.md)

## 实现要求

- 逐来源展示期限、同步状态、准确供应商企业及当前结果。
- 配置/启停/重试按准确原请求和终态核对，不用本方保存冒充远端生效。
- 共享来源与单来源解除分开；失败未知不清其他有效来源。
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

- **AC-2059**：供应商已接收未拨号码的拦截/取消/删除能力逐供应商核验，能力不足须提交差异，不能降低已确认覆盖目标。
  依据：docs/functional-spec.json#AC-2059

- **AC-2061**：只有业务运营或只有新增名单权限者不能解除；保留原入库来源和解除历史。
  依据：docs/functional-spec.json#AC-2061

- **AC-2062**：解除仅影响准确本来源，不清其他仍有效来源；已解除/到期不能被旧事件重放复活。新拒联使用新来源请求；本地与远端终态分开，未知先核对同请求，不伪造成功。
  依据：docs/functional-spec.json#AC-2062

## 测试要求（尚未执行）

### CHECK-PLAT-BAN-DETAIL / manual

步骤：在准确有权范围触发“查看限制来源和同步详情”；分别执行正常输入、明确无权/失效/冲突、失败及未知结果分支；按所列字段边界复查保存与显示。

预期：准确来源及本地/远端状态可追溯，读权不授解除或同步权；无权及非法输入不得写入；失败与未知分别显示且不扩范围、不重复产生副作用。

覆盖：AC-2048, AC-2049, AC-2050, AC-2061, AC-2062

### CHECK-PLAT-BAN-SYNC / manual

步骤：在准确有权范围触发“配置、启停或重试供应商黑名单同步”；分别执行正常输入、明确无权/失效/冲突、失败及未知结果分支；按所列字段边界复查保存与显示。

预期：本地配置与逐来源远端状态真实分离，准确终态才显示同步成功；无权及非法输入不得写入；失败与未知分别显示且不扩范围、不重复产生副作用。

覆盖：AC-2048, AC-2050, AC-2059

## 完成条件

- 逐来源展示期限、同步状态、准确供应商企业及当前结果。
- 配置/启停/重试按准确原请求和终态核对，不用本方保存冒充远端生效。
- 本任务全部同ID验收检查有当前实现、正常/拒绝/失败/未知证据，关联页面五态及字段权限符合原规格。
- 开发完成目标库/精确文件/模块/数据接口/测试执行绑定，必要共享文件先后依赖已补齐，工程问题有可靠结论。
- 产品变动回产品规格重审；不可用局部实现或Mock结论替代真实远端与正式开工许可。

需保留实际改动、测试结果和 Review 证据。仅修改完成不等于验收通过。


## 本轮工程绑定边界

本任务为可承接的业务实施分解，尚未绑定生产仓库/技术栈。开发确定真实文件后填写allowed_files、context_files、changes并复检共享文件依赖；不得把原型参考文件当作生产可写授权。

只读原型行为参考：

- [contact-policy.js](../../../prototype/js/components/contact-policy.js) · 只读行为参考，非生产可写目标
- [module-host.js](../../../prototype/js/components/module-host.js) · 只读行为参考，非生产可写目标

需开发处理的问题：EQ-PLAT-REMOTE。

原专业操作：

- [retained-source-ai-legacy-ban-view-record](../原专业操作任务映射.md#retained-source-ai-legacy-ban-view-record)
- [retained-source-ai-legacy-ban-view-sync-config](../原专业操作任务映射.md#retained-source-ai-legacy-ban-view-sync-config)
- [retained-source-ai-legacy-ban-enable-sync](../原专业操作任务映射.md#retained-source-ai-legacy-ban-enable-sync)
- [retained-source-ai-legacy-ban-disable-sync](../原专业操作任务映射.md#retained-source-ai-legacy-ban-disable-sync)
- [retained-source-ai-legacy-ban-retry-sync](../原专业操作任务映射.md#retained-source-ai-legacy-ban-retry-sync)
