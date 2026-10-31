# TASK-032 AI专业目录、执行场景与分类引用

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md)

- [进入有权工作位置与保留专业能力 · FUNC\-2002](../features/FUNC-2002.md)
- [停用当前专业域目录分类 · FUNC\-2018](../features/FUNC-2018.md)
- [为具体AI执行场景维护业务分类引用 · FUNC\-2019](../features/FUNC-2019.md)

## 目标

保专业目录、AI业务类型和具体场景身份、供应商与本租户资源参数。；具体场景引用业务分类，不因此绑定模板路由；原引用/删除及专业权限保护保持。

## 产品依据

- FUNC-2002 进入有权工作位置与保留专业能力：当前五顶栏只负责功能归位。按稳定页面/动作身份保留AI与Cloud现行专业操作、状态、资源、报表和业务接口，分别校验模块、成员、对象、读写/导出权。；来源 documentation/input/functions.json#FUNC-2002
- FUNC-2018 停用当前专业域目录分类：仍有专业用途的原目录能力保留准确专业身份，禁止新选/新关联，已有场景与受理任务按专业规则完成；不恢复已取消旧v2历史台账兼容。；来源 documentation/input/functions.json#FUNC-2018
- FUNC-2019 为具体AI执行场景维护业务分类引用：在AI标签管理→场景配置按具体场景ID关联当前品牌有权分类，保原AI细分和供应商参数；业务引用不等于模板实际路由绑定。；来源 documentation/input/functions.json#FUNC-2019

来源根：`/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/开发交付包/工作资料/续接输入`；来源指纹：`0904ba9de2798ea9878d0602f5fbc337ae523a60911c1b10dac967c13febffbe`

## 前置任务

- TASK-005
- TASK-009
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

局部逻辑：[LOCAL-PLAT-AI-CATEGORY-STOP](../local-logic/LOCAL-PLAT-AI-CATEGORY-STOP.md)、[LOCAL-PLAT-AI-CATEGORY-BIND](../local-logic/LOCAL-PLAT-AI-CATEGORY-BIND.md)、[LOCAL-PLAT-AI-SCENE-QUERY](../local-logic/LOCAL-PLAT-AI-SCENE-QUERY.md)、[LOCAL-PLAT-AI-SCENE-SAVE](../local-logic/LOCAL-PLAT-AI-SCENE-SAVE.md)、[LOCAL-PLAT-AI-SCENE-DELETE](../local-logic/LOCAL-PLAT-AI-SCENE-DELETE.md)

字段：[FIELD-PLAT-AI-CATEGORY](../field-specs.md#FIELD-PLAT-AI-CATEGORY)、[FIELD-PLAT-AI-PARAMS](../field-specs.md#FIELD-PLAT-AI-PARAMS)、[FIELD-PLAT-AI-SCENE-ID](../field-specs.md#FIELD-PLAT-AI-SCENE-ID)、[FIELD-PLAT-AI-SCENE-NAME](../field-specs.md#FIELD-PLAT-AI-SCENE-NAME)、[FIELD-PLAT-AI-SUPPLIER](../field-specs.md#FIELD-PLAT-AI-SUPPLIER)、[FIELD-PLAT-AI-TENANT](../field-specs.md#FIELD-PLAT-AI-TENANT)、[FIELD-PLAT-AI-TYPE](../field-specs.md#FIELD-PLAT-AI-TYPE)、[FIELD-PLAT-AUDIT](../field-specs.md#FIELD-PLAT-AUDIT)、[FIELD-PLAT-OP-STATE](../field-specs.md#FIELD-PLAT-OP-STATE)、[FIELD-PLAT-PAGING](../field-specs.md#FIELD-PLAT-PAGING)、[FIELD-PLAT-QUERY](../field-specs.md#FIELD-PLAT-QUERY)、[FIELD-PLAT-REFERENCE-STATE](../field-specs.md#FIELD-PLAT-REFERENCE-STATE)、[FIELD-PLAT-REVISION](../field-specs.md#FIELD-PLAT-REVISION)

## UI 依据

[全局 UI 规范](../ui-spec.md)

- [UI-PAGE-2006](../ui-pages/UI-PAGE-2006.md)
- [UI-PAGE-2110](../ui-pages/UI-PAGE-2110.md)
- [UI-PAGE-2111](../ui-pages/UI-PAGE-2111.md)
- [UI-PAGE-2223](../ui-pages/UI-PAGE-2223.md)

## 实现要求

- 保专业目录、AI业务类型和具体场景身份、供应商与本租户资源参数。
- 具体场景引用业务分类，不因此绑定模板路由；原引用/删除及专业权限保护保持。
- 场景使用不等于标签字典维护；分类共享不共享私有场景。
- 按所引LOCAL逐动作落实触发/前后置/分支；业务定义只读同源规格，不另抄一套规则。
- 依赖表示实施契约/共享守卫先就绪，不新增用户操作门槛；跨任务端到端由验收批次合并检查。
- 目标库、模块/服务/表/接口、精确可写文件及命令由开发在开工前绑定；当前空文件清单不授代码写入权。

## 产品验收

- **AC-2043**：有权租户管理员按准确专业目录ID停用其专业分类；品牌共用分类治理另按当前统一入口和品牌配置权。专业域当前能力仍保留，不恢复旧v2历史目录兼容台账或自动新增物理删除权。
  依据：docs/functional-spec.json#AC-2043

- **AC-2044**：专业目录停用禁止新选择和新关联；已有准确AI场景关联及已受理专业任务按本身规则完成，不自动解除场景或改写已生成事实；品牌分类实际路由独立保存。
  依据：docs/functional-spec.json#AC-2044

- **AC-2045**：在原标签管理→场景配置入口补充公共分类关联，保留AI原分类、标签及供应商配置。
  依据：docs/functional-spec.json#AC-2045

- **AC-2046**：公共分类维护权不下放AI专业配置权，新/冷细分及供应商执行允许值沿原规则。保原供应商标签池按supplierId、标签启用与映射按supplierId+总部/门店租户类型+AI标签场景、本地标准集按租户类型+标签场景的作用域；标签场景、具体AI执行场景及公共分类以准确身份关联，不因品牌共用就共享全部标签。
  依据：docs/functional-spec.json#AC-2046

- **AC-2047**：按本租户具体AI执行场景稳定ID关联当前品牌有权分类；同一类型不同场景可分别归类，保AI新/冷细分、供应商参数及原专业权。分类仅业务引用，模板实际路由以分类路由配置绑定为准；不定义旧v2目录迁移或同名合并。
  依据：docs/functional-spec.json#AC-2047

- **AC-2063**：保留已确认的222项AI/Cloud原专业能力，按稳定operation_key、PAGE、ACTION逐项关联当前触发/输入/权限/状态/终态；原仅有界面但未实现或缺证控制不自动升级，Mock交互不证明真实生产可用。
  依据：docs/functional-spec.json#AC-2063

- **AC-2064**：AI任务、通话/计费/线索统计、通话/线索记录、场景、标签及服务能力保留；原首页摘要/使用归AI用量与服务。AI场景使用与标签配置权分离；标签按准确supplier/tenant/type/tagScene/category/brand/revision执行段快照校验。原始与映射结果保留，未匹配不回退首项。准确映射标签可作人工确认路径条件，不直接写业务字段，不因AI回执自动推进。
  依据：docs/functional-spec.json#AC-2064

- **AC-2149**：业务分类行只保编辑/路由配置/预览/删除；不恢复AI标签配置快捷按钮。标签维护仍在呼叫中心AI配置的独立有权入口，原具体AI场景分类引用及其稳定身份保留。
  依据：docs/functional-spec.json#AC-2149

## 测试要求（尚未执行）

### CHECK-PLAT-AI-CATEGORY-STOP / manual

步骤：在准确有权范围触发“停用专业目录分类”；分别执行正常输入、明确无权/失效/冲突、失败及未知结果分支；按所列字段边界复查保存与显示。

预期：专业分类停止新选；不物理删除、不自动解除AI场景或改业务路由；无权及非法输入不得写入；失败与未知分别显示且不扩范围、不重复产生副作用。

覆盖：AC-2043, AC-2044

### CHECK-PLAT-AI-CATEGORY-BIND / manual

步骤：按当前续接版本执行：AI标签管理→场景配置显式选择分类并保存。前提：AI专业配置权；当前品牌分类有权可选。操作：按具体执行场景稳定ID关联分类，保留原AI新/冷类型和供应商参数；分类只作业务引用，不自动绑定流转模板；实际路由来自分类路由配置；重新校验分类/品牌/当前修订，禁止同名或首项兜底。分别构造：前提、字段及对象修订校验通过且结果明确成功；无权/字段不合法/对象失效/修订冲突；提交失败或结果未知。

预期：准确场景业务分类引用保存，未扩大品牌数据或AI专业能力；准确场景业务分类引用保存，未扩大品牌数据或AI专业能力；明确显示本次拒绝原因，保留可继续的输入和已确认原值，不作变更；失败保留原确认值；未知显示待核并按同请求核对，不重复提交或假报成功。

覆盖：AC-2045, AC-2046, AC-2047, AC-2149

### CHECK-PLAT-AI-SCENE-QUERY / manual

步骤：在准确有权范围触发“查询AI场景及原类型”；分别执行正常输入、明确无权/失效/冲突、失败及未知结果分支；按所列字段边界复查保存与显示。

预期：显示当前合法场景；仅有使用权可使用但不可维护标签；无权及非法输入不得写入；失败与未知分别显示且不扩范围、不重复产生副作用。

覆盖：AC-2045, AC-2046, AC-2047, AC-2063, AC-2064

### CHECK-PLAT-AI-SCENE-SAVE / manual

步骤：在准确有权范围触发“创建或编辑AI业务场景与场景类型”；分别执行正常输入、明确无权/失效/冲突、失败及未知结果分支；按所列字段边界复查保存与显示。

预期：专业场景/类型准确配置；执行能力以供应商真实资源为准；无权及非法输入不得写入；失败与未知分别显示且不扩范围、不重复产生副作用。

覆盖：AC-2045, AC-2046, AC-2047, AC-2063, AC-2064

### CHECK-PLAT-AI-SCENE-DELETE / manual

步骤：在准确有权范围触发“删除未被引用的AI专业场景／类型”；分别执行正常输入、明确无权/失效/冲突、失败及未知结果分支；按所列字段边界复查保存与显示。

预期：只删除原允许的准确专业对象，不清除任务结果；无权及非法输入不得写入；失败与未知分别显示且不扩范围、不重复产生副作用。

覆盖：AC-2063, AC-2064

## 完成条件

- 保专业目录、AI业务类型和具体场景身份、供应商与本租户资源参数。
- 具体场景引用业务分类，不因此绑定模板路由；原引用/删除及专业权限保护保持。
- 本任务全部同ID验收检查有当前实现、正常/拒绝/失败/未知证据，关联页面五态及字段权限符合原规格。
- 开发完成目标库/精确文件/模块/数据接口/测试执行绑定，必要共享文件先后依赖已补齐，工程问题有可靠结论。
- 产品变动回产品规格重审；不可用局部实现或Mock结论替代真实远端与正式开工许可。

需保留实际改动、测试结果和 Review 证据。仅修改完成不等于验收通过。


## 本轮工程绑定边界

本任务为可承接的业务实施分解，尚未绑定生产仓库/技术栈。开发确定真实文件后填写allowed_files、context_files、changes并复检共享文件依赖；不得把原型参考文件当作生产可写授权。

只读原型行为参考：

- [category_build.py](../../../prototype/scripts/category_build.py) · 只读行为参考，非生产可写目标
- [module-host.js](../../../prototype/js/components/module-host.js) · 只读行为参考，非生产可写目标

需开发处理的问题：ENG-FLOW-SCENE, EQ-PLAT-PROFESSIONAL。

原专业操作：

- [retained-source-ai-business-scene-create](../原专业操作任务映射.md#retained-source-ai-business-scene-create)
- [retained-source-ai-business-scene-delete](../原专业操作任务映射.md#retained-source-ai-business-scene-delete)
- [retained-source-ai-business-scene-query](../原专业操作任务映射.md#retained-source-ai-business-scene-query)
- [retained-source-ai-business-scene-update](../原专业操作任务映射.md#retained-source-ai-business-scene-update)
