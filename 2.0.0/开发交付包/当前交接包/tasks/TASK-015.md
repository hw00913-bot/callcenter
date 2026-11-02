# TASK-015 统一业务、导入入口标识与失败草稿

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md)

- [按共同分类字段预检并导入统一业务 · FUNC\-2036](../features/FUNC-2036.md)

## 目标

只写统一业务账本，entrySource区分TASK/CATEGORY及MANUAL/API；任务DIRECT不创建模板run/node，分类TEMPLATE捕获当前方案。；准确taskImportSource与逐行参数/业务schema快照同次封存；PRED成功行移出剩余草稿且不重复保存，失败草稿保检查时物理原行信息，AI保全通过约束。；批次名和中档默认可自动带入，五档等选项收起为选填；成功完成后关闭文案与禁用状态同步，不自动起呼。

## 产品依据

- FUNC-2036 按共同分类字段预检并导入统一业务：客户维护与AI/预外呼任务三入口共用分类IMPORT和code等系统必需校验。客户维护按原DIRECT/TEMPLATE；任务内固定准确任务/必要scene并默认DIRECT，须ADMIN+customer.import、原模块/任务/来源及分类允许，保存完整值/快照/taskImportSource/等级和直接周期。专业名单只读recordId投影，不写第二账本/原生行或重复提交供应商，旧历史不迁移。；来源 documentation/input/functions.json#FUNC-2036

来源根：`/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/开发交付包/工作资料/续接输入`；来源指纹：`b0292b83ba50e66ed754b44bc97cfa25bab040c4f00b70baa8e542df666aeccf`

## 前置任务

- TASK-014

## 只读代码上下文

未指定既有代码文件；从工程规范和产品依据读取上下文。

## 允许修改的文件

- 未填写

代码库根：`None`。未列出的文件不属于本任务修改范围；扩大范围需回到计划。

## 变更安排

- 未填写

## 逻辑与字段依据

先读 [全局逻辑](../global-logic.md)，再读本任务关联的局部逻辑与字段定义。

全局规则：[GR-ASSIGNMENT-SIMPLIFICATION](../global-logic.md#GR-ASSIGNMENT-SIMPLIFICATION)、[GR-AUTH](../global-logic.md#GR-AUTH)、[GR-CONFIG](../global-logic.md#GR-CONFIG)、[GR-DATA-FACTS](../global-logic.md#GR-DATA-FACTS)、[GR-EXECUTION-ARRANGEMENT](../global-logic.md#GR-EXECUTION-ARRANGEMENT)、[GR-FIELDS](../global-logic.md#GR-FIELDS)、[GR-HANDLING-MODE](../global-logic.md#GR-HANDLING-MODE)、[GR-SCOPE](../global-logic.md#GR-SCOPE)、[GR-TASK-UNIFIED-IMPORT](../global-logic.md#GR-TASK-UNIFIED-IMPORT)、[GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)

局部逻辑：[LOCAL-FLOW-IMPORT-COMMIT](../local-logic/LOCAL-FLOW-IMPORT-COMMIT.md)

字段：[FIELD-FLOW-AI-SCENE](../field-specs.md#FIELD-FLOW-AI-SCENE)、[FIELD-FLOW-ALLOW-DIRECT-FOLLOWUP](../field-specs.md#FIELD-FLOW-ALLOW-DIRECT-FOLLOWUP)、[FIELD-FLOW-BATCH-ID](../field-specs.md#FIELD-FLOW-BATCH-ID)、[FIELD-FLOW-BATCH-NAME](../field-specs.md#FIELD-FLOW-BATCH-NAME)、[FIELD-FLOW-BUSINESS-CODE](../field-specs.md#FIELD-FLOW-BUSINESS-CODE)、[FIELD-FLOW-CATEGORY-ID](../field-specs.md#FIELD-FLOW-CATEGORY-ID)、[FIELD-FLOW-DIRECT-CYCLE-ID](../field-specs.md#FIELD-FLOW-DIRECT-CYCLE-ID)、[FIELD-FLOW-DIRECT-METHOD](../field-specs.md#FIELD-FLOW-DIRECT-METHOD)、[FIELD-FLOW-DIRECT-STATUS](../field-specs.md#FIELD-FLOW-DIRECT-STATUS)、[FIELD-FLOW-EFFECTIVE-PLAN](../field-specs.md#FIELD-FLOW-EFFECTIVE-PLAN)、[FIELD-FLOW-ENTRY-CONTEXT](../field-specs.md#FIELD-FLOW-ENTRY-CONTEXT)、[FIELD-FLOW-ENTRY-DECISION](../field-specs.md#FIELD-FLOW-ENTRY-DECISION)、[FIELD-FLOW-ENTRY-RULES](../field-specs.md#FIELD-FLOW-ENTRY-RULES)、[FIELD-FLOW-EXECUTION-PRIORITY](../field-specs.md#FIELD-FLOW-EXECUTION-PRIORITY)、[FIELD-FLOW-EXECUTION-QUEUE-SEQUENCE](../field-specs.md#FIELD-FLOW-EXECUTION-QUEUE-SEQUENCE)、[FIELD-FLOW-EXECUTION-QUEUED-AT](../field-specs.md#FIELD-FLOW-EXECUTION-QUEUED-AT)、[FIELD-FLOW-EXECUTION-RESOURCE](../field-specs.md#FIELD-FLOW-EXECUTION-RESOURCE)、[FIELD-FLOW-FILE-PENDING](../field-specs.md#FIELD-FLOW-FILE-PENDING)、[FIELD-FLOW-HANDLING-MODE](../field-specs.md#FIELD-FLOW-HANDLING-MODE)、[FIELD-FLOW-IMPORT-ORIGINAL](../field-specs.md#FIELD-FLOW-IMPORT-ORIGINAL)、[FIELD-FLOW-IMPORT-PREVIEW](../field-specs.md#FIELD-FLOW-IMPORT-PREVIEW)、[FIELD-FLOW-IMPORT-TOKEN](../field-specs.md#FIELD-FLOW-IMPORT-TOKEN)、[FIELD-FLOW-IMPORT-VALUES](../field-specs.md#FIELD-FLOW-IMPORT-VALUES)、[FIELD-FLOW-INTENDED-STORE-NAME](../field-specs.md#FIELD-FLOW-INTENDED-STORE-NAME)、[FIELD-FLOW-MANUAL-ASSIGNMENT-MODE](../field-specs.md#FIELD-FLOW-MANUAL-ASSIGNMENT-MODE)、[FIELD-FLOW-NODE-EXECUTION-DEFAULTS](../field-specs.md#FIELD-FLOW-NODE-EXECUTION-DEFAULTS)、[FIELD-FLOW-NODE-EXECUTION-PRIORITY](../field-specs.md#FIELD-FLOW-NODE-EXECUTION-PRIORITY)、[FIELD-FLOW-NODE-RUN-ID](../field-specs.md#FIELD-FLOW-NODE-RUN-ID)、[FIELD-FLOW-OUTCOME](../field-specs.md#FIELD-FLOW-OUTCOME)、[FIELD-FLOW-OWNER-TENANT](../field-specs.md#FIELD-FLOW-OWNER-TENANT)、[FIELD-FLOW-RECORD-ID](../field-specs.md#FIELD-FLOW-RECORD-ID)、[FIELD-FLOW-REQUEST-ID](../field-specs.md#FIELD-FLOW-REQUEST-ID)、[FIELD-FLOW-REQUEST-STATUS](../field-specs.md#FIELD-FLOW-REQUEST-STATUS)、[FIELD-FLOW-ROUTE-MAIN](../field-specs.md#FIELD-FLOW-ROUTE-MAIN)、[FIELD-FLOW-RUN-ID](../field-specs.md#FIELD-FLOW-RUN-ID)、[FIELD-FLOW-RUN-STATUS](../field-specs.md#FIELD-FLOW-RUN-STATUS)、[FIELD-FLOW-TASK-IMPORT-PARAMETERS](../field-specs.md#FIELD-FLOW-TASK-IMPORT-PARAMETERS)、[FIELD-FLOW-TASK-IMPORT-SOURCE](../field-specs.md#FIELD-FLOW-TASK-IMPORT-SOURCE)、[FIELD-PLAT-TASK-BUSINESS-RECORD-ID](../field-specs.md#FIELD-PLAT-TASK-BUSINESS-RECORD-ID)

## UI 依据

[全局 UI 规范](../ui-spec.md)

- [UI-PAGE-2103](../ui-pages/UI-PAGE-2103.md)
- [UI-PAGE-2204](../ui-pages/UI-PAGE-2204.md)
- [UI-PAGE-2205](../ui-pages/UI-PAGE-2205.md)

## 实现要求

- 只写统一业务账本，entrySource区分TASK/CATEGORY及MANUAL/API；任务DIRECT不创建模板run/node，分类TEMPLATE捕获当前方案。
- 准确taskImportSource与逐行参数/业务schema快照同次封存；PRED成功行移出剩余草稿且不重复保存，失败草稿保检查时物理原行信息，AI保全通过约束。
- 批次名和中档默认可自动带入，五档等选项收起为选填；成功完成后关闭文案与禁用状态同步，不自动起呼。
- 原请求未知先核同次，不允许关闭/重开逃避待核；专业表只读投影，不双写原生新行或重复提交供应商。
- 按所引LOCAL逐动作落实触发/前后置/分支；业务定义只读同源规格，不另抄一套规则。
- 依赖表示实施契约/共享守卫先就绪，不新增用户操作门槛；跨任务端到端由验收批次合并检查。
- 目标库、模块/服务/表/接口、精确可写文件及命令由开发在开工前绑定；当前空文件清单不授代码写入权。

## 产品验收

- **AC-2115**：按实际分类生成系统必需和IMPORT列及必填校验；合法等待名单数据中性提示，检查后具体报字段/节点/条件；正式提交所有行通过且token一致。
  依据：docs/functional-spec.json#AC-2115

- **AC-2116**：LEAD同品牌统一编码跨分类/来源唯一，ORDINARY同品牌同分类唯一；不凭手机号合并，不覆盖重复业务或自动重开。
  依据：docs/functional-spec.json#AC-2116

- **AC-2117**：导入失败保名单可重检；确认全部通过才同次创建批次/记录/实际run及首节点；重复/冲突不改原owner/值/结果。
  依据：docs/functional-spec.json#AC-2117

- **AC-2140**：对当前可可靠读取schema内、启用且支持条件的非必填IMPORT字段，新导入/新run准备时缺列规范化为null用于判断；必填缺失或schema读取失败仍拒绝，通话/填写未知及已捕获历史缺失不在读取时补空。
  依据：docs/functional-spec.json#AC-2140

- **AC-2161**：原专业名单直接在原列表展示：保姓名、电话、批次、原操作与原统计，新业务按准确recordId只读回链；旧原生行缺业务编码/业务分类/五档执行优先级/导入入口四项时直接留空，不单列历史名单、不按手机号补链。统一业务数/办理状态不冒充供应商受理、真实拨打、接通或话单数。 未知导入先核对原请求；服务端产出的记录必须按原请求/准确任务/租户/渠道关联，读取故障不解除请求身份，不允许以新请求重试产生重复副作用。基础名称/编码/手机号/优先级按原类型和别名严格校验，旧已捕获请求只读重放不接受客户端伪报。
  依据：docs/functional-spec.json#AC-2161

## 测试要求（尚未执行）

### CHECK-FLOW-IMPORT-COMMIT / manual

步骤：分别确认合法TASK DIRECT及CATEGORY TEMPLATE；构造重复、缺必填、API/手工混用、旧token、原请求未知与有效子集。

预期：统一业务及批次保存entrySource.kind=TASK/CATEGORY、importChannel=MANUAL/API、handlingMode及准确分类/租户；TASK的taskImportSource按schema2保存method/taskId/aiSceneId?/categoryId/tenantId/brandId/batchId/importChannel/dataImportSource及targetFingerprint/parameterMappingFingerprint。每行规范业务值与独立供应商customValues/定义/参数快照同次捕获；不把供应商专属值混record.fields，不持久第二份专业业务行，不按手机号认领旧业务或重复供应商导入。 未知导入先核对原请求；服务端产出的记录必须按原请求/准确任务/租户/渠道关联，读取故障不解除请求身份，不允许以新请求重试产生重复副作用。基础名称/编码/手机号/优先级按原类型和别名严格校验，旧已捕获请求只读重放不接受客户端伪报。 AI/PRED共用轻量导入：文件或粘贴名单→检查及逐行编辑→确认。主区不要求重填场景、分类、批次或优先级；批次默认文件名或任务名+本次窗口时间，选填折叠项可修改，五档默认中。文件读取中禁用旧检查；0有效确认禁用且底部说明/表外行号编码原因可见，编辑后旧结果失效需重检。AI全部行通过才确认；PRED允许当前检查的合法有效子集二次确认。成功行封存不重导，剩余失败草稿可保留/重开/更正后以新请求重检续入，原物理行号与当前编辑行号明确区分，成功后关闭按钮显示关闭。

覆盖：AC-2115, AC-2116, AC-2117, AC-2140

### CHECK-FLOW-TASK-IMPORT-REPLAY / manual

步骤：原请求返回未知后核对同次；首次success/unknown显式requestId不符、服务端已有产出、读取故障、跨租户/generic副本、旧周期冲突及typed伪报分别核验。

预期：未知导入先核对原请求；服务端产出的记录必须按原请求/准确任务/租户/渠道关联，读取故障不解除请求身份，不允许以新请求重试产生重复副作用。基础名称/编码/手机号/优先级按原类型和别名严格校验，旧已捕获请求只读重放不接受客户端伪报。 当前/旧/generic供应商专属快照与兼容副本只按可信原始任务/批次租户及品牌投影，所有值和配置指纹均受同一范围约束，不泄露给来源方或另一租户；公共业务资料及原截止历史保持。预外呼新安排/执行同核已配置分类和品牌，统一历史未知不在读取时首次补类或换类。 首次异requestId保持本次原ID待核，不解锁或接受异请求产出，不重复写成功行。

覆盖：AC-2161

## 完成条件

- 只写统一业务账本，entrySource区分TASK/CATEGORY及MANUAL/API；任务DIRECT不创建模板run/node，分类TEMPLATE捕获当前方案。
- 准确taskImportSource与逐行参数/业务schema快照同次封存；PRED成功行移出剩余草稿且不重复保存，失败草稿保检查时物理原行信息，AI保全通过约束。
- 批次名和中档默认可自动带入，五档等选项收起为选填；成功完成后关闭文案与禁用状态同步，不自动起呼。
- 本任务全部同ID验收检查有当前实现、正常/拒绝/失败/未知证据，关联页面五态及字段权限符合原规格。
- 开发完成目标库/精确文件/模块/数据接口/测试执行绑定，必要共享文件先后依赖已补齐，工程问题有可靠结论。
- 产品变动回产品规格重审；不可用局部实现或Mock结论替代真实远端与正式开工许可。

需保留实际改动、测试结果和 Review 证据。仅修改完成不等于验收通过。


## 本轮工程绑定边界

本任务为可承接的业务实施分解，尚未绑定生产仓库/技术栈。开发确定真实文件后填写allowed_files、context_files、changes并复检共享文件依赖；不得把原型参考文件当作生产可写授权。

只读原型行为参考：

- [four-node-model.js](../../../prototype/scripts/four-node-model.js) · 只读行为参考，非生产可写目标
- [current_planning_build.py](../../../prototype/scripts/current_planning_build.py) · 只读行为参考，非生产可写目标
- [task-business-import.js](../../../prototype/js/adapters/task-business-import.js) · 只读行为参考，非生产可写目标
- [task-business-import-model.js](../../../prototype/scripts/task-business-import-model.js) · 只读行为参考，非生产可写目标

需开发处理的问题：ENG-FLOW-PERSISTENCE。
