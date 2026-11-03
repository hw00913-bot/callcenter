# TASK-034 AI任务共享导入与原名单投影

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md)

- [进入有权工作位置与保留专业能力 · FUNC\-2002](../features/FUNC-2002.md)
- [按共同分类字段预检并导入统一业务 · FUNC\-2036](../features/FUNC-2036.md)
- [分配本租户具体任务或坐席及执行优先级 · FUNC\-2037](../features/FUNC-2037.md)

## 目标

准确AI任务自动带入scene/class，不重复选择或重填业务元信息；手工入口共享填写/检查/确认，API入口只读接收该场景正式字段。；正式字段取对应scene/platform业务映射和CUSTOM_COLUMN，保分类定义/参数快照与专属值隔离；全行校验、权限、容量和原请求核对保持。；导入和执行使用一致的完整配置指纹/权威任务资格；已证明等价旧包装仅只读兼容，真实来源/映射/任务状态变化仍拒绝，不写回旧快照。；AI外呼任务列表卡片不显示供应商徽标；保任务名称、执行状态、导入方式标签及原统计/动作。所属平台筛选与刷新仍按准确供应商身份工作，详情和供应商映射保留原平台信息；不能通过删除card-tag通用样式误删导入方式或详情标签。

## 产品依据

- FUNC-2002 进入有权工作位置与保留专业能力：当前五顶栏只负责功能归位。按稳定页面/动作身份保留AI与Cloud现行专业操作、状态、资源、报表和业务接口，分别校验模块、成员、对象、读写/导出权。；来源 documentation/input/functions.json#FUNC-2002
- FUNC-2036 按共同分类字段预检并导入统一业务：客户维护与AI/预外呼任务三入口共用分类IMPORT和code等系统必需校验。客户维护按原DIRECT/TEMPLATE；任务内固定准确任务/必要scene并默认DIRECT，须ADMIN+customer.import、原模块/任务/来源及分类允许，保存完整值/快照/taskImportSource/等级和直接周期。专业名单只读recordId投影，不写第二账本/原生行或重复提交供应商，旧历史不迁移。；来源 documentation/input/functions.json#FUNC-2036
- FUNC-2037 分配本租户具体任务或坐席及执行优先级：DIRECT与TEMPLATE共用任务或人工分配方式/坐席及五档等级：人工默认待分配、指定坐席才必选seat；PRED只任务，AI任务+scene。模板/导入/分配无独立责任人输入，实际人员由坐席分配及真实执行/接听事实记录；保留原单条/批量分配，不改owner或自动起呼。；来源 documentation/input/functions.json#FUNC-2037

来源根：`/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/开发交付包/工作资料/续接输入`；来源指纹：`ac24ea3af455fa8052e0daeaa799eea0265f5d02f520b26bdd98ac1e620a1a6c`

## 前置任务

- TASK-032
- TASK-039

## 只读代码上下文

未指定既有代码文件；从工程规范和产品依据读取上下文。

## 允许修改的文件

- 未填写

代码库根：`None`。未列出的文件不属于本任务修改范围；扩大范围需回到计划。

## 变更安排

- 未填写

## 逻辑与字段依据

先读 [全局逻辑](../global-logic.md)，再读本任务关联的局部逻辑与字段定义。

全局规则：[GR-AUTH](../global-logic.md#GR-AUTH)、[GR-IDENTITY](../global-logic.md#GR-IDENTITY)、[GR-LIST-ORDER](../global-logic.md#GR-LIST-ORDER)、[GR-SCOPE](../global-logic.md#GR-SCOPE)、[GR-TASK-UNIFIED-IMPORT](../global-logic.md#GR-TASK-UNIFIED-IMPORT)、[GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)

局部逻辑：[LOCAL-PLAT-AI-TASK-QUERY](../local-logic/LOCAL-PLAT-AI-TASK-QUERY.md)、[LOCAL-PLAT-AI-LIST-IMPORT](../local-logic/LOCAL-PLAT-AI-LIST-IMPORT.md)、[LOCAL-PLAT-AI-LIST-REMOVE](../local-logic/LOCAL-PLAT-AI-LIST-REMOVE.md)、[LOCAL-PLAT-AI-IMPORT-HISTORY](../local-logic/LOCAL-PLAT-AI-IMPORT-HISTORY.md)、[LOCAL-PLAT-AI-IMPORT-TEMPLATE](../local-logic/LOCAL-PLAT-AI-IMPORT-TEMPLATE.md)

字段：[FIELD-FLOW-ALLOW-DIRECT-FOLLOWUP](../field-specs.md#FIELD-FLOW-ALLOW-DIRECT-FOLLOWUP)、[FIELD-FLOW-CATEGORY-ID](../field-specs.md#FIELD-FLOW-CATEGORY-ID)、[FIELD-FLOW-CATEGORY-IMPORT-REFS](../field-specs.md#FIELD-FLOW-CATEGORY-IMPORT-REFS)、[FIELD-FLOW-DIRECT-CYCLE-ID](../field-specs.md#FIELD-FLOW-DIRECT-CYCLE-ID)、[FIELD-FLOW-EXECUTION-PRIORITY](../field-specs.md#FIELD-FLOW-EXECUTION-PRIORITY)、[FIELD-FLOW-HANDLING-MODE](../field-specs.md#FIELD-FLOW-HANDLING-MODE)、[FIELD-FLOW-IMPORT-ORIGINAL](../field-specs.md#FIELD-FLOW-IMPORT-ORIGINAL)、[FIELD-FLOW-IMPORT-VALUES](../field-specs.md#FIELD-FLOW-IMPORT-VALUES)、[FIELD-FLOW-RECORD-ID](../field-specs.md#FIELD-FLOW-RECORD-ID)、[FIELD-FLOW-TASK-IMPORT-PARAMETERS](../field-specs.md#FIELD-FLOW-TASK-IMPORT-PARAMETERS)、[FIELD-FLOW-TASK-IMPORT-SOURCE](../field-specs.md#FIELD-FLOW-TASK-IMPORT-SOURCE)、[FIELD-PLAT-AI-IMPORT-FIELD-MAPPINGS](../field-specs.md#FIELD-PLAT-AI-IMPORT-FIELD-MAPPINGS)、[FIELD-PLAT-AI-IMPORT-MAPPING-CATEGORY](../field-specs.md#FIELD-PLAT-AI-IMPORT-MAPPING-CATEGORY)、[FIELD-PLAT-AI-SCENE-ID](../field-specs.md#FIELD-PLAT-AI-SCENE-ID)、[FIELD-PLAT-AI-TENANT](../field-specs.md#FIELD-PLAT-AI-TENANT)、[FIELD-PLAT-AUDIT](../field-specs.md#FIELD-PLAT-AUDIT)、[FIELD-PLAT-CUSTOMER-ID](../field-specs.md#FIELD-PLAT-CUSTOMER-ID)、[FIELD-PLAT-IMPORT-BATCH](../field-specs.md#FIELD-PLAT-IMPORT-BATCH)、[FIELD-PLAT-IMPORT-ROWS](../field-specs.md#FIELD-PLAT-IMPORT-ROWS)、[FIELD-PLAT-OP-STATE](../field-specs.md#FIELD-PLAT-OP-STATE)、[FIELD-PLAT-PAGING](../field-specs.md#FIELD-PLAT-PAGING)、[FIELD-PLAT-PRO-FIELD-DEF](../field-specs.md#FIELD-PLAT-PRO-FIELD-DEF)、[FIELD-PLAT-QUERY](../field-specs.md#FIELD-PLAT-QUERY)、[FIELD-PLAT-REPORT-EXPORT](../field-specs.md#FIELD-PLAT-REPORT-EXPORT)、[FIELD-PLAT-REQUEST](../field-specs.md#FIELD-PLAT-REQUEST)、[FIELD-PLAT-REVISION](../field-specs.md#FIELD-PLAT-REVISION)、[FIELD-PLAT-TASK-BUSINESS-RECORD-ID](../field-specs.md#FIELD-PLAT-TASK-BUSINESS-RECORD-ID)、[FIELD-PLAT-TASK-ID](../field-specs.md#FIELD-PLAT-TASK-ID)、[FIELD-PLAT-TASK-NAME](../field-specs.md#FIELD-PLAT-TASK-NAME)、[FIELD-PLAT-TASK-RESOURCES](../field-specs.md#FIELD-PLAT-TASK-RESOURCES)、[FIELD-PLAT-TASK-STATE](../field-specs.md#FIELD-PLAT-TASK-STATE)

## UI 依据

[全局 UI 规范](../ui-spec.md)

- [UI-PAGE-2103](../ui-pages/UI-PAGE-2103.md)

## 实现要求

- 准确AI任务自动带入scene/class，不重复选择或重填业务元信息；手工入口共享填写/检查/确认，API入口只读接收该场景正式字段。
- 正式字段取对应scene/platform业务映射和CUSTOM_COLUMN，保分类定义/参数快照与专属值隔离；全行校验、权限、容量和原请求核对保持。
- 导入和执行使用一致的完整配置指纹/权威任务资格；已证明等价旧包装仅只读兼容，真实来源/映射/任务状态变化仍拒绝，不写回旧快照。
- AI外呼任务列表卡片不显示供应商徽标；保任务名称、执行状态、导入方式标签及原统计/动作。所属平台筛选与刷新仍按准确供应商身份工作，详情和供应商映射保留原平台信息；不能通过删除card-tag通用样式误删导入方式或详情标签。
- 原任务表承接统一recordId投影和历史空字段，不建第二账本；保存业务不等供应商受理、拨打或已完成。
- 只删除卡片供应商徽标；导入方式、平台筛选、详情和供应商映射仍保原身份。
- 按所引LOCAL逐动作落实触发/前后置/分支；业务定义只读同源规格，不另抄一套规则。
- 依赖表示实施契约/共享守卫先就绪，不新增用户操作门槛；跨任务端到端由验收批次合并检查。
- 目标库、模块/服务/表/接口、精确可写文件及命令由开发在开工前绑定；当前空文件清单不授代码写入权。

## 产品验收

- **AC-2063**：保留已确认的222项AI/Cloud原专业能力，按稳定operation_key、PAGE、ACTION逐项关联当前触发/输入/权限/状态/终态；原仅有界面但未实现或缺证控制不自动升级，Mock交互不证明真实生产可用。
  依据：docs/functional-spec.json#AC-2063

- **AC-2064**：AI任务、通话/计费/线索统计、通话/线索记录、场景、标签及服务能力保留；原首页摘要/使用归AI用量与服务。AI场景使用与标签配置权分离；标签按准确supplier/tenant/type/tagScene/category/brand/revision执行段快照校验。原始与映射结果保留，未匹配不回退首项。准确映射标签可作人工确认路径条件，不直接写业务字段，不因AI回执自动推进。
  依据：docs/functional-spec.json#AC-2064

- **AC-2160**：当前由入口决定办理模式：准确AI/预外呼任务入口固定TASK/DIRECT，按任务MANUAL/API渠道导入；业务分类入口固定CATEGORY/TEMPLATE，人工或接口进入当前分类模板。没有中央模式选择、分类允许直接跟进开关或AI第三种FLOW来源，TEMPLATE失败不降级。旧无TASK来源的DIRECT及旧已捕获END来源分别只按原历史合同核验，不补新来源。 任务配置保存准确业务分类；AI从准确场景取得分类和供应商映射，PRED从任务配置取得分类。导入自动带入并锁定，不在导入时临时重选或按名称/首项猜。顶部入口只选择目标任务，随即同窗展示相同导入表。缺失、冲突、失效关联到任务/场景配置维护。MANUAL任务仅手工上传/粘贴，AUTO/API仅只读接收字段与要求；本地静态演示不提供真实接口上传或假造API结果。 统一业务及批次保存entrySource.kind=TASK/CATEGORY、importChannel=MANUAL/API、handlingMode及准确分类/租户；TASK的taskImportSource按schema2保存method/taskId/aiSceneId?/categoryId/tenantId/brandId/batchId/importChannel/dataImportSource及targetFingerprint/parameterMappingFingerprint。每行规范业务值与独立供应商customValues/定义/参数快照同次捕获；不把供应商专属值混record.fields，不持久第二份专业业务行，不按手机号认领旧业务或重复供应商导入。
  依据：docs/functional-spec.json#AC-2160

- **AC-2162**：当前TASK导入ADMIN+customer.import叠原模块/准确任务/渠道资格，AI-only不需Cloud菜单，不增Cloud授权；API仅可读字段/要求与已有记录，接口接入待开发。AI/PRED共用轻量导入：文件或粘贴名单→检查及逐行编辑→确认。主区不要求重填场景、分类、批次或优先级；批次默认文件名或任务名+本次窗口时间，选填折叠项可修改，五档默认中。文件读取中禁用旧检查；0有效确认禁用且底部说明/表外行号编码原因可见，编辑后旧结果失效需重检。AI全部行通过才确认；PRED允许当前检查的合法有效子集二次确认。成功行封存不重导，剩余失败草稿可保留/重开/更正后以新请求重检续入，原物理行号与当前编辑行号明确区分，成功后关闭按钮显示关闭。
  依据：docs/functional-spec.json#AC-2162

## 测试要求（尚未执行）

### CHECK-PLAT-AI-TASK-QUERY / manual

步骤：按当前三入口统一导入规则：AI外呼页查询、查看任务或名单；按当前筛选/平台/场景和任务ID读取任务、已呼/未呼名单及状态计数；更新时间倒序后分页；进入任务详情再次验对象范围；原启动/暂停/终止/删除仅有界面但未实现控件保持明确不可用，不显示假成功；本轮新AI/PRED业务仅按准确taskImportSource和原任务读取权投影recordId/必要字段；旧专业名单/历史依其原身份显示，不能按手机号补链，不以业务记录数改写供应商受理或通话事实；投影办理模式及详情副标题读当前有权业务的真实handlingMode；新TASK DIRECT不启用模板；旧无TASK历史明确合法启用后才可TEMPLATE，不能以导入来源硬写DIRECT；转出方仅本方截止历史 业务分类列表提供导入名单并锁定准确分类；原旧导入菜单改为导入批次，业务名单保独立，业务名单保独立，业务名单保独立，业务名单保独立，业务名单保独立，以批次结果/详情为主。独立业务名单保工作队列、原单条/同组批量手动分配及明确发起；主菜单打开/刷新不带临时批次过滤，准确批次详情和recordId详情各保自身上下文，账号/租户/撤权重新核验。； ； ； ； ； ； ； ； ； ； ； ； ； ； ； ； AI外呼任务列表卡片不显示供应商徽标；保任务名称、执行状态、导入方式标签及原统计/动作。所属平台筛选与刷新仍按准确供应商身份工作，详情和供应商映射保留原平台信息；不能通过删除card-tag通用样式误删导入方式或详情标签。； ；。构造无权、来源锁定、字段/任务/窗口变化及失败/未知。 实际查看全部AI任务卡片，再按所属平台筛选刷新；核供应商徽标已去掉，导入方式及原任务名称/状态/统计仍在，详情供应商未移除。

预期：当前AI专业任务/名单可读；不重建专业任务或宣称未实现控制已受理；原资格/历史/未知守卫保持，不把新统一记录或投影说成供应商已受理/拨打。 AI外呼任务列表卡片不显示供应商徽标；保任务名称、执行状态、导入方式标签及原统计/动作。所属平台筛选与刷新仍按准确供应商身份工作，详情和供应商映射保留原平台信息；不能通过删除card-tag通用样式误删导入方式或详情标签。

覆盖：AC-2063, AC-2064

### CHECK-PLAT-AI-LIST-IMPORT / manual

步骤：按当前准确场景/平台：只读任务概览不物化意向草稿；任务内导入从准确scene实际分类读取共同IMPORT schema、code/姓名/号码等系统必需列，校必填/类型/选项/映射及统一重复编码；排除FOLLOWUP，业务定义不自由复制；当前scene/platform专属customFields附加于模板和列映射，按text/number/date/required逐行校验，rows拆fields与customValues独立字典；共享读取/预检采用准确目标context.importLimits而非任意调用参数：保AI大众100行、厚朴150000行、其他2000行及16MB文件，预外呼2000行/1MB；超限明示分批且不截断，旧AI parser只作历史兼容不成第二新写入口；显式准备并等待本租户共享联系只读模型，再逐号码核对公共禁呼、专业/业务占用、间隔及当日频控；AI-only成员不依赖Cloud页面或Cloud授权，不增加Cloud权利；模型/台账未知保持待核；异步返回后重核账号/tenant/ADMIN+customer.import、AI模块、任务/场景/分类/映射/文件及原来源锁定；当前上下文与预检一致才同请求写一次统一业务账本/DIRECT周期，保存原始联系号码（联系协调用规范明文，非源CSV列原文副本）、实际操作人、全部规范字段及taskImportSource；只读专业投影recordId，不新写原生名单或再提交供应商；不把保存说成已受理/拨打；AI-only使用共享业务服务的精确账号/tenant/task导入及同源请求核对范围，schema只读，完成/异常恢复原访问，不持久授Cloudcap/成员/菜单，不能借此配置/起呼或访问其他Cloud动作；本行record.fields仅业务值，专属列规范值及customFields在taskImportParameterSnapshot和originalImportSnapshot.taskImportParameterSnapshot独立封存，保parameters/mappings/fingerprint；批次映射快照保customFields，后改平台/配置不追改；构造无权、平台/分类切换、旧修订及取消/失败/未知。

预期：当前准确任务+场景的新DIRECT业务/周期及完整IMPORT值/快照/来源/等级形成；专业视图按recordId只读投影，无新原生行或重复供应商提交；失败保输入，未知核同请求，原权限/联系/来源守卫继续。

覆盖：AC-2063, AC-2064

### CHECK-FLOW-AI-TASK-DIRECT-IMPORT / manual

步骤：准确AI任务打开共享导入，不重选分类/场景；检查缺专属必填、typed错误、重复及合法名单；确认后从原列表/业务详情明确开始。

预期：任务配置保存准确业务分类；AI从准确场景取得分类和供应商映射，PRED从任务配置取得分类。导入自动带入并锁定，不在导入时临时重选或按名称/首项猜。顶部入口只选择目标任务，随即同窗展示相同导入表。缺失、冲突、失效关联到任务/场景配置维护。MANUAL任务仅手工上传/粘贴，AUTO/API仅只读接收字段与要求；本地静态演示不提供真实接口上传或假造API结果。 AI/PRED共用轻量导入：文件或粘贴名单→检查及逐行编辑→确认。主区不要求重填场景、分类、批次或优先级；批次默认文件名或任务名+本次窗口时间，选填折叠项可修改，五档默认中。文件读取中禁用旧检查；0有效确认禁用且底部说明/表外行号编码原因可见，编辑后旧结果失效需重检。AI全部行通过才确认；PRED允许当前检查的合法有效子集二次确认。成功行封存不重导，剩余失败草稿可保留/重开/更正后以新请求重检续入，原物理行号与当前编辑行号明确区分，成功后关闭按钮显示关闭。 统一业务及批次保存entrySource.kind=TASK/CATEGORY、importChannel=MANUAL/API、handlingMode及准确分类/租户；TASK的taskImportSource按schema2保存method/taskId/aiSceneId?/categoryId/tenantId/brandId/batchId/importChannel/dataImportSource及targetFingerprint/parameterMappingFingerprint。每行规范业务值与独立供应商customValues/定义/参数快照同次捕获；不把供应商专属值混record.fields，不持久第二份专业业务行，不按手机号认领旧业务或重复供应商导入。 厚朴场景查询并保存已有准确供应商任务后，只读投影到同一任务目录和导入/执行入口，按tenant/brand/account/taskId/唯一scene稳定关联，不创建供应商任务、不按名称猜；实时读取准确任务状态，未知供应商计数显示待核。已知权威taskStatusCode使用准确可执行枚举，原status='unknown'仅属兼容状态文本，不覆盖权威taskStatusCode明确枚举；权威code为null或未知仍拒绝。 导入与明确执行使用相同底层配置语义指纹；已知成功准入包装字段和对象键序不构成业务配置变化。旧schema2 TASK/DIRECT仅在完整准确身份及已知wrapper/basis证明等价时只读兼容；未知附加项或真实映射/来源/模板/状态变化继续拒绝，不回写旧快照，TEMPLATE标签依赖保完整指纹。

覆盖：AC-2160, AC-2162

### CHECK-PLAT-AI-LIST-REMOVE / manual

步骤：在准确有权范围触发“移除准确AI任务待处理联系人”；分别执行正常输入、明确无权/失效/冲突、失败及未知结果分支；按所列字段边界复查保存与显示。

预期：允许的任务名单项移除；已产生通话/业务事实保留；无权及非法输入不得写入；失败与未知分别显示且不扩范围、不重复产生副作用。

覆盖：AC-2063, AC-2064

### CHECK-PLAT-AI-IMPORT-HISTORY / manual

步骤：按当前三入口统一导入规则：AI任务查看导入历史；按任务稳定ID过滤本租户批次；展示原文件/条数/提交人/时间/结果，未知与失败区分；本轮新AI/PRED业务仅按准确taskImportSource和原任务读取权投影recordId/必要字段；旧专业名单/历史依其原身份显示，不能按手机号补链，不以业务记录数改写供应商受理或通话事实；投影办理模式及详情副标题读当前有权业务的真实handlingMode；新TASK DIRECT不启用模板；旧无TASK历史明确合法启用后才可TEMPLATE，不能以导入来源硬写DIRECT；转出方仅本方截止历史；；。构造无权、来源锁定、字段/任务/窗口变化及失败/未知。

预期：仅显示该任务授权导入历史，不连带文件下载或任务控制权；原资格/历史/未知守卫保持，不把新统一记录或投影说成供应商已受理/拨打。

覆盖：AC-2063, AC-2064

### CHECK-PLAT-AI-IMPORT-TEMPLATE / manual

步骤：同分类配置两个供应商/场景的不同IMPORT_FIELD及CUSTOM_COLUMN，分别从任务和模板入口选择场景后准备下载/映射。

预期：先确定实际呼叫方式、条件首路径和必要AI场景，再生成本次schema：系统业务编码/客户称呼/客户号码必需；TEMPLATE保留本次IMPORT条件分流字段，其余只取该scene/platform实际IMPORT_FIELD引用及CUSTOM_COLUMN专属列，未引用的分类额外必填不阻AI导入。非AI仍按实际分类IMPORT。FOLLOWUP不混入；下载CSV/XLSX、列映射、逐行校验、参数生成与规范值/定义快照使用同一准确schema。场景/字段/资料/目标变化失效旧预检。 下载生成与实际文件落地验收分开。

覆盖：AC-2063, AC-2064

## 完成条件

- 准确AI任务自动带入scene/class，不重复选择或重填业务元信息；手工入口共享填写/检查/确认，API入口只读接收该场景正式字段。
- 正式字段取对应scene/platform业务映射和CUSTOM_COLUMN，保分类定义/参数快照与专属值隔离；全行校验、权限、容量和原请求核对保持。
- 导入和执行使用一致的完整配置指纹/权威任务资格；已证明等价旧包装仅只读兼容，真实来源/映射/任务状态变化仍拒绝，不写回旧快照。
- AI外呼任务列表卡片不显示供应商徽标；保任务名称、执行状态、导入方式标签及原统计/动作。所属平台筛选与刷新仍按准确供应商身份工作，详情和供应商映射保留原平台信息；不能通过删除card-tag通用样式误删导入方式或详情标签。
- 本任务全部同ID验收检查有当前实现、正常/拒绝/失败/未知证据，关联页面五态及字段权限符合原规格。
- 开发完成目标库/精确文件/模块/数据接口/测试执行绑定，必要共享文件先后依赖已补齐，工程问题有可靠结论。
- 产品变动回产品规格重审；不可用局部实现或Mock结论替代真实远端与正式开工许可。

需保留实际改动、测试结果和 Review 证据。仅修改完成不等于验收通过。


## 本轮工程绑定边界

本任务为可承接的业务实施分解，尚未绑定生产仓库/技术栈。开发确定真实文件后填写allowed_files、context_files、changes并复检共享文件依赖；不得把原型参考文件当作生产可写授权。

只读原型行为参考：

- [module-host.js](../../../prototype/js/components/module-host.js) · 只读行为参考，非生产可写目标
- [ai_import_parse_build.py](../../../prototype/scripts/ai_import_parse_build.py) · 只读行为参考，非生产可写目标
- [task-business-import.js](../../../prototype/js/adapters/task-business-import.js) · 只读行为参考，非生产可写目标
- [task-roster-view.js](../../../prototype/js/adapters/task-roster-view.js) · 只读行为参考，非生产可写目标
- [four-node-execution.js](../../../prototype/js/adapters/four-node-execution.js) · 只读行为参考，非生产可写目标
- [build-modules.py](../../../prototype/scripts/build-modules.py) · 只读行为参考，非生产可写目标
- [check-ai-task-directory.cjs](../../../prototype/scripts/check-ai-task-directory.cjs) · 只读行为参考，非生产可写目标

需开发处理的问题：EQ-PLAT-PROFESSIONAL, EQ-PLAT-ACCEPTED-CALL。

原专业操作：

- [ai-query-tasks](../原专业操作任务映射.md#ai-query-tasks)
- [ai-view-task](../原专业操作任务映射.md#ai-view-task)
- [ai-query-call-list](../原专业操作任务映射.md#ai-query-call-list)
- [ai-import-task-contacts](../原专业操作任务映射.md#ai-import-task-contacts)
- [ai-query-import-records](../原专业操作任务映射.md#ai-query-import-records)
- [ai-remove-assigned-contact](../原专业操作任务映射.md#ai-remove-assigned-contact)
- [retained-source-ai-download-import-template](../原专业操作任务映射.md#retained-source-ai-download-import-template)
