# TASK-008 品牌导入/填写字段库与稳定选项

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md)

- [创建品牌共用业务分类与字段基础 · FUNC\-2016](../features/FUNC-2016.md)
- [维护品牌共用业务分类、字段及取数规则 · FUNC\-2017](../features/FUNC-2017.md)

## 目标

两种用途独立存储与引用，同名不合并；IMPORT业务编码必填。；字段及选项的编辑、启停、删除按当前与快照引用保护；不增加格式配置。

## 产品依据

- FUNC-2016 创建品牌共用业务分类与字段基础：在有权品牌维护独立IMPORT/FOLLOWUP字段库及分类双Tab，明确业务域、字段与入口必填；当前无直接跟进开关；任务DIRECT/分类TEMPLATE由准确入口派生；保存基础不绑定模板或起呼。；来源 documentation/input/functions.json#FUNC-2016
- FUNC-2017 维护品牌共用业务分类、字段及取数规则：按引用保护维护分类字段；当前不编辑历史allowDirectFollowup；关闭不删旧直接事实或阻必要收尾，不自动切换模式；新跟进读当前定义，旧运行及正式快照保持。；来源 documentation/input/functions.json#FUNC-2017

来源根：`/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/开发交付包/工作资料/续接输入`；来源指纹：`b0292b83ba50e66ed754b44bc97cfa25bab040c4f00b70baa8e542df666aeccf`

## 前置任务

- TASK-003
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

全局规则：[GR-AUTH](../global-logic.md#GR-AUTH)、[GR-CONFIG](../global-logic.md#GR-CONFIG)、[GR-DATA-FACTS](../global-logic.md#GR-DATA-FACTS)、[GR-FIELDS](../global-logic.md#GR-FIELDS)、[GR-SCOPE](../global-logic.md#GR-SCOPE)、[GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)

局部逻辑：[LOCAL-FLOW-FIELD-CREATE](../local-logic/LOCAL-FLOW-FIELD-CREATE.md)、[LOCAL-FLOW-FIELD-EDIT](../local-logic/LOCAL-FLOW-FIELD-EDIT.md)、[LOCAL-FLOW-FIELD-STATUS](../local-logic/LOCAL-FLOW-FIELD-STATUS.md)、[LOCAL-FLOW-FIELD-DELETE](../local-logic/LOCAL-FLOW-FIELD-DELETE.md)

字段：[FIELD-FLOW-BASIS](../field-specs.md#FIELD-FLOW-BASIS)、[FIELD-FLOW-BRAND-ID](../field-specs.md#FIELD-FLOW-BRAND-ID)、[FIELD-FLOW-BUSINESS-FAMILY](../field-specs.md#FIELD-FLOW-BUSINESS-FAMILY)、[FIELD-FLOW-CATEGORY-FOLLOWUP-REFS](../field-specs.md#FIELD-FLOW-CATEGORY-FOLLOWUP-REFS)、[FIELD-FLOW-CATEGORY-ID](../field-specs.md#FIELD-FLOW-CATEGORY-ID)、[FIELD-FLOW-CATEGORY-IMPORT-REFS](../field-specs.md#FIELD-FLOW-CATEGORY-IMPORT-REFS)、[FIELD-FLOW-CATEGORY-LABEL](../field-specs.md#FIELD-FLOW-CATEGORY-LABEL)、[FIELD-FLOW-CATEGORY-REVISION](../field-specs.md#FIELD-FLOW-CATEGORY-REVISION)、[FIELD-FLOW-CODE-LABEL](../field-specs.md#FIELD-FLOW-CODE-LABEL)、[FIELD-FLOW-CONTENT-SNAPSHOT](../field-specs.md#FIELD-FLOW-CONTENT-SNAPSHOT)、[FIELD-FLOW-DICTIONARY-ID](../field-specs.md#FIELD-FLOW-DICTIONARY-ID)、[FIELD-FLOW-EDGES](../field-specs.md#FIELD-FLOW-EDGES)、[FIELD-FLOW-EFFECTIVE-PLAN](../field-specs.md#FIELD-FLOW-EFFECTIVE-PLAN)、[FIELD-FLOW-ENTRY-RULES](../field-specs.md#FIELD-FLOW-ENTRY-RULES)、[FIELD-FLOW-FIELD-DEPENDS](../field-specs.md#FIELD-FLOW-FIELD-DEPENDS)、[FIELD-FLOW-FIELD-ENABLED](../field-specs.md#FIELD-FLOW-FIELD-ENABLED)、[FIELD-FLOW-FIELD-ID](../field-specs.md#FIELD-FLOW-FIELD-ID)、[FIELD-FLOW-FIELD-KEY](../field-specs.md#FIELD-FLOW-FIELD-KEY)、[FIELD-FLOW-FIELD-LABEL](../field-specs.md#FIELD-FLOW-FIELD-LABEL)、[FIELD-FLOW-FIELD-OPTIONS](../field-specs.md#FIELD-FLOW-FIELD-OPTIONS)、[FIELD-FLOW-FIELD-TYPE](../field-specs.md#FIELD-FLOW-FIELD-TYPE)、[FIELD-FLOW-FIELD-USAGE](../field-specs.md#FIELD-FLOW-FIELD-USAGE)、[FIELD-FLOW-NODES](../field-specs.md#FIELD-FLOW-NODES)、[FIELD-FLOW-OPTION-ENABLED](../field-specs.md#FIELD-FLOW-OPTION-ENABLED)、[FIELD-FLOW-OPTION-ID](../field-specs.md#FIELD-FLOW-OPTION-ID)、[FIELD-FLOW-OPTION-KEY](../field-specs.md#FIELD-FLOW-OPTION-KEY)、[FIELD-FLOW-OPTION-LABEL](../field-specs.md#FIELD-FLOW-OPTION-LABEL)、[FIELD-FLOW-PARAM-BINDINGS](../field-specs.md#FIELD-FLOW-PARAM-BINDINGS)、[FIELD-FLOW-QUERY-CONDITIONS](../field-specs.md#FIELD-FLOW-QUERY-CONDITIONS)、[FIELD-FLOW-SELECTION-MODE](../field-specs.md#FIELD-FLOW-SELECTION-MODE)、[FIELD-FLOW-TEMPLATE-ID](../field-specs.md#FIELD-FLOW-TEMPLATE-ID)、[FIELD-FLOW-TEMPLATE-NAME](../field-specs.md#FIELD-FLOW-TEMPLATE-NAME)、[FIELD-FLOW-TEMPLATE-REF-CATEGORY](../field-specs.md#FIELD-FLOW-TEMPLATE-REF-CATEGORY)、[FIELD-FLOW-TEMPLATE-REVISION](../field-specs.md#FIELD-FLOW-TEMPLATE-REVISION)

## UI 依据

[全局 UI 规范](../ui-spec.md)

- [UI-PAGE-2006](../ui-pages/UI-PAGE-2006.md)
- [UI-PAGE-2223](../ui-pages/UI-PAGE-2223.md)

## 实现要求

- 两种用途独立存储与引用，同名不合并；IMPORT业务编码必填。
- 字段及选项的编辑、启停、删除按当前与快照引用保护；不增加格式配置。
- 品牌/用途/类型/编码和已有稳定选项不能通过改名换义；未启用项不能新选。
- 按所引LOCAL逐动作落实触发/前后置/分支；业务定义只读同源规格，不另抄一套规则。
- 依赖表示实施契约/共享守卫先就绪，不新增用户操作门槛；跨任务端到端由验收批次合并检查。
- 目标库、模块/服务/表/接口、精确可写文件及命令由开发在开工前绑定；当前空文件清单不授代码写入权。

## 产品验收

- **AC-2038**：有品牌配置权的超管及租户管理员维护同品牌分类与两类独立字段库，普通运营只按权限选择；配置权不扩大业务数据权。
  依据：docs/functional-spec.json#AC-2038

- **AC-2041**：修改分类基础仅更新名称、编码列名、业务域及导入/填写有序引用和校验规则，不提交或覆盖路由；已开run及正式快照保持。
  依据：docs/functional-spec.json#AC-2041

- **AC-2042**：字段库与分类基础各有唯一维护入口；IMPORT编码必填、无格式配置，FOLLOWUP可用接口单/多选及明确依赖参数映射，实际取数仍按租户授权。
  依据：docs/functional-spec.json#AC-2042

- **AC-2135**：分类BASE、独立ROUTE、模板字段参考互不覆盖；实际绑定按所用稳定ID/用途/类型/选项/AI上下文校验，新跟进取最新资料而正式/运行快照不追改，未操作/缺失/明确清空分开。
  依据：docs/functional-spec.json#AC-2135

## 测试要求（尚未执行）

### CHECK-FLOW-FIELD-CREATE / manual

步骤：本动作适用模式以当前前置条件为准；原模板例仅用于TEMPLATE。从业务字段或分类Tab新建字段。当前品牌及配置管理资格真实有效；提交来源与当前上下文一致。依次执行：明确品牌、IMPORT/FOLLOWUP用途及当前类型，生成独立稳定ID；校名称/编码唯一、选项和引用能力；IMPORT必有编码且无接口类型。分别构造：合法新定义；用途/编码/选项不合法或当前无权

预期：保存字段库，提示尚未加入分类；不自动产生业务或分类引用；保输入并拒绝，不生成半条字段；字段可被同品牌同用途分类显式添加

覆盖：AC-2038, AC-2042

### CHECK-FLOW-FIELD-EDIT / manual

步骤：本动作适用模式以当前前置条件为准；原模板例仅用于TEMPLATE。打开已有字段并保存修改。当前品牌及配置管理资格真实有效；提交来源与当前上下文一致。依次执行：读取当前定义和实际使用位置，锁定已用身份、用途、品牌、类型、编码；保存保持含义的文案/允许选项修改，重核分类和接口依赖闭包。分别构造：已有使用引用且请求改关键含义；仅合法文案或允许状态变更

预期：拒绝并显示使用位置，需新建字段身份；保存当前定义；已捕获快照不追改；普通编辑保原输入与稳定ID

覆盖：AC-2041, AC-2042, AC-2135

### CHECK-FLOW-FIELD-STATUS / manual

步骤：本动作适用模式以当前前置条件为准；原模板例仅用于TEMPLATE。确认字段或选项启停。当前品牌及配置管理资格真实有效；提交来源与当前上下文一致。依次执行：核有效分类/接口依赖及预置统计保护；只更新获允许状态，不删除稳定身份。分别构造：停用破坏已启用分类依赖或为受保护预置选项；允许状态变化

预期：明确拒绝，原状态保持；新选择候选更新，旧快照和已知值仍可按当时定义显示；停用不绕过引用删除保护

覆盖：AC-2041, AC-2042

### CHECK-FLOW-FIELD-DELETE / manual

步骤：本动作适用模式以当前前置条件为准；原模板例仅用于TEMPLATE。从字段使用预检确认删除。当前品牌及配置管理资格真实有效；提交来源与当前上下文一致。依次执行：读取分类、条件、接口、当前run/form/内容等实际引用；对无引用准确对象重新核上下文与前后定义后移除。分别构造：存在引用、引用未知或期间变化；无引用且前后校验一致

预期：阻删并保对象及使用位置；删除本次定义，不级联删业务/其他字段；字段存在与删除结果可准确回读

覆盖：AC-2041, AC-2135

## 完成条件

- 两种用途独立存储与引用，同名不合并；IMPORT业务编码必填。
- 字段及选项的编辑、启停、删除按当前与快照引用保护；不增加格式配置。
- 本任务全部同ID验收检查有当前实现、正常/拒绝/失败/未知证据，关联页面五态及字段权限符合原规格。
- 开发完成目标库/精确文件/模块/数据接口/测试执行绑定，必要共享文件先后依赖已补齐，工程问题有可靠结论。
- 产品变动回产品规格重审；不可用局部实现或Mock结论替代真实远端与正式开工许可。

需保留实际改动、测试结果和 Review 证据。仅修改完成不等于验收通过。


## 本轮工程绑定边界

本任务为可承接的业务实施分解，尚未绑定生产仓库/技术栈。开发确定真实文件后填写allowed_files、context_files、changes并复检共享文件依赖；不得把原型参考文件当作生产可写授权。

只读原型行为参考：

- [field_model_build.py](../../../prototype/scripts/field_model_build.py) · 只读行为参考，非生产可写目标
- [field_ui_build.py](../../../prototype/scripts/field_ui_build.py) · 只读行为参考，非生产可写目标

需开发处理的问题：ENG-FLOW-PERSISTENCE。
