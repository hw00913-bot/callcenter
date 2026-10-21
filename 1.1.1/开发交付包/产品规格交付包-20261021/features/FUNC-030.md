# 查询单选接口车系并保存本次意向信息 · FUNC\-030

**READY\_FOR\_ENGINEERING\_DESIGN — 产品可交接，工程设计需补齐**

[返回功能目录](README.md) · [返回开发包入口](../README.md)

## 本功能做什么

在原表单下拉查询Mapping车系，唯一单选并按官方ID确认导入，保存code/name及媒体/状态来源快照；门店文本原规则。加载/异常/空集、来源授权/旧响应保护及当前通话整版版本隔离属于同次填写保存明细。

来源业务域：未提供；来源业务模块：未提供。

本页是同一份规划的功能阅读视图，仅整理已声明的关联，不增加业务规则，也不代表本功能已通过完整性核验。

## 推荐阅读顺序

1. 看下面的相关页面，确认用户从哪里进入。
2. 阅读局部逻辑，再按需打开字段定义。
3. 对照本功能验收，查看实施任务及其前置依赖。

[全局逻辑](../global-logic.md)和[通用 UI 规范](../ui-spec.md)供核对共同规则；无需每次从头通读。

## 相关页面

- [坐席工作台通话与话后处理 · UI\-PAGE\-008](../ui-pages/UI-PAGE-008.md) — 共用页面，另有 1 个功能

- [通话详情（本次客户业务信息） · UI\-PAGE\-009](../ui-pages/UI-PAGE-009.md) — 共用页面，另有 1 个功能

- [客户档案（业务信息汇总） · UI\-PAGE\-010](../ui-pages/UI-PAGE-010.md) — 共用页面，另有 1 个功能

## 局部逻辑

- [固定本通表单和合法原业务上下文 · LOCAL\-CALL\-FORM](../local-logic/LOCAL-CALL-FORM.md)

**共用说明，尚未按功能细分步骤。** 该说明同时包含其他功能；其中全部步骤、分支和字段不能直接当成本功能专属逻辑。

- [查询并单选本次Mapping车系 · LOCAL\-SERIES\-QUERY](../local-logic/LOCAL-SERIES-QUERY.md)

本局部说明只声明关联当前功能，以下内容直接取自同一份规划。

### 触发与前置条件

触发：客服打开本次意向车系下拉、搜索或重试

- 当前账号、企业/租户/对象和处理阶段有对应权限；输入来自本局部声明的当前对象。
- 沿当前已确认范围执行；不借原型或历史ID扩张权限。

### 处理步骤

1. **LOCAL\-SERIES\-QUERY\-STEP\-1**：核对本人通话、固定字段绑定及当前接口启停/授权，再发起预置Mapping查询

2. **LOCAL\-SERIES\-QUERY\-STEP\-2**：识别加载、完整成功、空集、异常，校验候选与请求上下文；完全同记录可去重，同官方ID冲突不任取

3. **LOCAL\-SERIES\-QUERY\-STEP\-3**：在完整有效候选内搜索并唯一选择，保留编码、当时名称和来源快照

### 分支与异常

- **LOCAL\-SERIES\-QUERY\-BRANCH\-1**：当来源停用/撤权或响应上下文过期，停止新查选，丢弃旧响应写入；保留原输入和历史。

- **LOCAL\-SERIES\-QUERY\-BRANCH\-2**：当成功空集，明确无候选，不显示查询异常，不自由创建。

- **LOCAL\-SERIES\-QUERY\-BRANCH\-3**：当异常/不完整/同官方ID冲突，保留输入重试，完整结果前不新选，不因异常判旧值失配。

- **LOCAL\-SERIES\-QUERY\-BRANCH\-4**：当已有当前有效依据，保存前无需重复强制查询；来源与权限仍实时核对。

- **LOCAL\-SERIES\-QUERY\-BRANCH\-5**：当来源恢复，重查匹配后客服确认才恢复旧未提交值。

### 完成后的状态

- 仅本次动作的合法结果生效；取消或核对/保存异常保留原对象与输入，不宣称成功。

- [执行普通接口的通用单上游查询 · LOCAL\-GENERIC\-QUERY](../local-logic/LOCAL-GENERIC-QUERY.md)

本局部说明只声明关联当前功能，以下内容直接取自同一份规划。

### 触发与前置条件

触发：实际启用的普通接口字段查询或任一上游变化

- 当前账号、企业/租户/对象和处理阶段有对应权限；输入来自本局部声明的当前对象。
- 沿当前已确认范围执行；不借原型或历史ID扩张权限。

### 处理步骤

1. **LOCAL\-GENERIC\-QUERY\-STEP\-1**：按本通定义读取条件开关和一个上游；区分真缺值与已填无效

2. **LOCAL\-GENERIC\-QUERY\-STEP\-2**：仅关闭或可选确实缺失时省参；有效映射按声明传参；必需缺失/值或参数问题明确阻止

3. **LOCAL\-GENERIC\-QUERY\-STEP\-3**：上游变化传递作废下游旧请求/确认并保留显示；完整新结果重判，仍有效可留，待重选恢复需确认

### 分支与异常

- **LOCAL\-GENERIC\-QUERY\-BRANCH\-1**：当可选未加入/隐藏/未填或条件关闭，按预置无参范围查询，不猜范围。

- **LOCAL\-GENERIC\-QUERY\-BRANCH\-2**：当必需缺失或任意已填无效/缺属性/不兼容，不查询，不用可选名义静默删参扩大结果。

- **LOCAL\-GENERIC\-QUERY\-BRANCH\-3**：当完整匹配/失配/来源恢复，区分保留有效与待重选，后者重匹配仍须人工确认。

- **LOCAL\-GENERIC\-QUERY\-BRANCH\-4**：当原门店文本或本次独立车系，不施加该上游链，门店文本不随车系变动。

### 完成后的状态

- 仅本次动作的合法结果生效；取消或核对/保存异常保留原对象与输入，不宣称成功。

- [只读导入核对并明确带入车系 · LOCAL\-IMPORT\-CONFIRM](../local-logic/LOCAL-IMPORT-CONFIRM.md)

本局部说明只声明关联当前功能，以下内容直接取自同一份规划。

### 触发与前置条件

触发：客服切导入页签并明确发起车系核对/确认

- 当前账号、企业/租户/对象和处理阶段有对应权限；输入来自本局部声明的当前对象。
- 沿当前已确认范围执行；不借原型或历史ID扩张权限。

### 处理步骤

1. **LOCAL\-IMPORT\-CONFIRM\-STEP\-1**：展示原导入只读，页签切换保留本次填写；明确操作后核对导入官方编码

2. **LOCAL\-IMPORT\-CONFIRM\-STEP\-2**：查询并按官方code精确匹配，反馈进度与结果；提交带入前核对上下文及后续编辑

3. **LOCAL\-IMPORT\-CONFIRM\-STEP\-3**：只有匹配且明确确认才带入本次选择，并回本次填写供检查

### 分支与异常

- **LOCAL\-IMPORT\-CONFIRM\-BRANCH\-1**：当未匹配/仅同名或媒体ID/取消，不改本次值，不猜匹配，不回写原导入或门店文本。

- **LOCAL\-IMPORT\-CONFIRM\-BRANCH\-2**：当切换通话/租户或继续编辑后旧结果返回，丢弃过期带入，不覆盖新输入。

### 完成后的状态

- 仅本次动作的合法结果生效；取消或核对/保存异常保留原对象与输入，不宣称成功。

- [按本通整版校验并保存结果 · LOCAL\-FOLLOWUP\-SAVE](../local-logic/LOCAL-FOLLOWUP-SAVE.md)

**共用说明，尚未按功能细分步骤。** 该说明同时包含其他功能；其中全部步骤、分支和字段不能直接当成本功能专属逻辑。

- [按具体通次读取当时业务快照 · LOCAL\-READ\-CALL](../local-logic/LOCAL-READ-CALL.md)

**共用说明，尚未按功能细分步骤。** 该说明同时包含其他功能；其中全部步骤、分支和字段不能直接当成本功能专属逻辑。

- [沿原规则展示档案业务汇总及来源 · LOCAL\-READ\-CUSTOMER](../local-logic/LOCAL-READ-CUSTOMER.md)

**共用说明，尚未按功能细分步骤。** 该说明同时包含其他功能；其中全部步骤、分支和字段不能直接当成本功能专属逻辑。

## 本功能明确关联的字段

这些关系来自已声明的页面／局部说明；字段仍可能被其他功能复用。

- [通话及业务对象上下文 · FIELD\-CALL\-CONTEXT](../field-specs.md#FIELD-CALL-CONTEXT)；依据：[查询并单选本次Mapping车系 · LOCAL\-SERIES\-QUERY](../local-logic/LOCAL-SERIES-QUERY.md)、[执行普通接口的通用单上游查询 · LOCAL\-GENERIC\-QUERY](../local-logic/LOCAL-GENERIC-QUERY.md)、[只读导入核对并明确带入车系 · LOCAL\-IMPORT\-CONFIRM](../local-logic/LOCAL-IMPORT-CONFIRM.md)

- [本通整版业务表单 · FIELD\-CALL\-VERSION](../field-specs.md#FIELD-CALL-VERSION)；依据：[查询并单选本次Mapping车系 · LOCAL\-SERIES\-QUERY](../local-logic/LOCAL-SERIES-QUERY.md)、[执行普通接口的通用单上游查询 · LOCAL\-GENERIC\-QUERY](../local-logic/LOCAL-GENERIC-QUERY.md)、[只读导入核对并明确带入车系 · LOCAL\-IMPORT\-CONFIRM](../local-logic/LOCAL-IMPORT-CONFIRM.md)

- [字段取数接口引用 · FIELD\-DICTIONARY\-REF](../field-specs.md#FIELD-DICTIONARY-REF)；依据：[查询并单选本次Mapping车系 · LOCAL\-SERIES\-QUERY](../local-logic/LOCAL-SERIES-QUERY.md)、[执行普通接口的通用单上游查询 · LOCAL\-GENERIC\-QUERY](../local-logic/LOCAL-GENERIC-QUERY.md)

- [Mapping预置媒体范围 · FIELD\-MAPPING\-MEDIA\-FILTER](../field-specs.md#FIELD-MAPPING-MEDIA-FILTER)；依据：[查询并单选本次Mapping车系 · LOCAL\-SERIES\-QUERY](../local-logic/LOCAL-SERIES-QUERY.md)

- [Mapping预置状态范围 · FIELD\-MAPPING\-STATE\-FILTER](../field-specs.md#FIELD-MAPPING-STATE-FILTER)；依据：[查询并单选本次Mapping车系 · LOCAL\-SERIES\-QUERY](../local-logic/LOCAL-SERIES-QUERY.md)

- [官方车系ID · FIELD\-OFFICIAL\-SERIES\-ID](../field-specs.md#FIELD-OFFICIAL-SERIES-ID)；依据：[查询并单选本次Mapping车系 · LOCAL\-SERIES\-QUERY](../local-logic/LOCAL-SERIES-QUERY.md)

- [本次车系编码 · FIELD\-SERIES\-CODE](../field-specs.md#FIELD-SERIES-CODE)；依据：[查询并单选本次Mapping车系 · LOCAL\-SERIES\-QUERY](../local-logic/LOCAL-SERIES-QUERY.md)、[只读导入核对并明确带入车系 · LOCAL\-IMPORT\-CONFIRM](../local-logic/LOCAL-IMPORT-CONFIRM.md)

- [媒体车系ID来源快照 · FIELD\-SERIES\-MEDIA\-ID](../field-specs.md#FIELD-SERIES-MEDIA-ID)；依据：[查询并单选本次Mapping车系 · LOCAL\-SERIES\-QUERY](../local-logic/LOCAL-SERIES-QUERY.md)

- [车系当时名称 · FIELD\-SERIES\-NAME](../field-specs.md#FIELD-SERIES-NAME)；依据：[查询并单选本次Mapping车系 · LOCAL\-SERIES\-QUERY](../local-logic/LOCAL-SERIES-QUERY.md)

- [本次接口车系单选 · FIELD\-SERIES\-SELECTION](../field-specs.md#FIELD-SERIES-SELECTION)；依据：[查询并单选本次Mapping车系 · LOCAL\-SERIES\-QUERY](../local-logic/LOCAL-SERIES-QUERY.md)、[执行普通接口的通用单上游查询 · LOCAL\-GENERIC\-QUERY](../local-logic/LOCAL-GENERIC-QUERY.md)、[只读导入核对并明确带入车系 · LOCAL\-IMPORT\-CONFIRM](../local-logic/LOCAL-IMPORT-CONFIRM.md)

- [车系状态原值快照 · FIELD\-SERIES\-SOURCE\-STATE](../field-specs.md#FIELD-SERIES-SOURCE-STATE)；依据：[查询并单选本次Mapping车系 · LOCAL\-SERIES\-QUERY](../local-logic/LOCAL-SERIES-QUERY.md)

- [字段定义整体 · FIELD\-DEFINITION](../field-specs.md#FIELD-DEFINITION)；依据：[执行普通接口的通用单上游查询 · LOCAL\-GENERIC\-QUERY](../local-logic/LOCAL-GENERIC-QUERY.md)

- [下游入参字段名 · FIELD\-DOWNSTREAM\-PARAM](../field-specs.md#FIELD-DOWNSTREAM-PARAM)；依据：[执行普通接口的通用单上游查询 · LOCAL\-GENERIC\-QUERY](../local-logic/LOCAL-GENERIC-QUERY.md)

- [其他既有业务字段值 · FIELD\-OTHER\-BUSINESS\-VALUES](../field-specs.md#FIELD-OTHER-BUSINESS-VALUES)；依据：[执行普通接口的通用单上游查询 · LOCAL\-GENERIC\-QUERY](../local-logic/LOCAL-GENERIC-QUERY.md)

- [计划到店门店原文本 · FIELD\-PLANNED\-STORE](../field-specs.md#FIELD-PLANNED-STORE)；依据：[执行普通接口的通用单上游查询 · LOCAL\-GENERIC\-QUERY](../local-logic/LOCAL-GENERIC-QUERY.md)

- [查询条件是否必需 · FIELD\-QUERY\-REQUIRED](../field-specs.md#FIELD-QUERY-REQUIRED)；依据：[执行普通接口的通用单上游查询 · LOCAL\-GENERIC\-QUERY](../local-logic/LOCAL-GENERIC-QUERY.md)

- [上游字段 · FIELD\-UPSTREAM\-ID](../field-specs.md#FIELD-UPSTREAM-ID)；依据：[执行普通接口的通用单上游查询 · LOCAL\-GENERIC\-QUERY](../local-logic/LOCAL-GENERIC-QUERY.md)

- [上游取值属性 · FIELD\-UPSTREAM\-PROPERTY](../field-specs.md#FIELD-UPSTREAM-PROPERTY)；依据：[执行普通接口的通用单上游查询 · LOCAL\-GENERIC\-QUERY](../local-logic/LOCAL-GENERIC-QUERY.md)

- [是否使用其他字段作为条件 · FIELD\-USE\-UPSTREAM](../field-specs.md#FIELD-USE-UPSTREAM)；依据：[执行普通接口的通用单上游查询 · LOCAL\-GENERIC\-QUERY](../local-logic/LOCAL-GENERIC-QUERY.md)

- [原导入意向信息 · FIELD\-IMPORTED\-INTENTION](../field-specs.md#FIELD-IMPORTED-INTENTION)；依据：[只读导入核对并明确带入车系 · LOCAL\-IMPORT\-CONFIRM](../local-logic/LOCAL-IMPORT-CONFIRM.md)

## 共用说明中的字段上下文

以下字段来自共用页面、局部说明或任务，用于定位上下文；不等于本功能都需要实现。

- [已删除分类保留定义 · FIELD\-CATEGORY\-ARCHIVE](../field-specs.md#FIELD-CATEGORY-ARCHIVE)；依据：[坐席工作台通话与话后处理 · UI\-PAGE\-008](../ui-pages/UI-PAGE-008.md)、[通话详情（本次客户业务信息） · UI\-PAGE\-009](../ui-pages/UI-PAGE-009.md)、[客户档案（业务信息汇总） · UI\-PAGE\-010](../ui-pages/UI-PAGE-010.md)、[固定本通表单和合法原业务上下文 · LOCAL\-CALL\-FORM](../local-logic/LOCAL-CALL-FORM.md)、[按本通整版校验并保存结果 · LOCAL\-FOLLOWUP\-SAVE](../local-logic/LOCAL-FOLLOWUP-SAVE.md)、[按具体通次读取当时业务快照 · LOCAL\-READ\-CALL](../local-logic/LOCAL-READ-CALL.md)、[沿原规则展示档案业务汇总及来源 · LOCAL\-READ\-CUSTOMER](../local-logic/LOCAL-READ-CUSTOMER.md)

- [业务分类识别与配置 · FIELD\-CATEGORY\-DEFINITION](../field-specs.md#FIELD-CATEGORY-DEFINITION)；依据：[坐席工作台通话与话后处理 · UI\-PAGE\-008](../ui-pages/UI-PAGE-008.md)、[固定本通表单和合法原业务上下文 · LOCAL\-CALL\-FORM](../local-logic/LOCAL-CALL-FORM.md)

- [分类字段引用集合 · FIELD\-CLASS\-FIELD\-REFS](../field-specs.md#FIELD-CLASS-FIELD-REFS)；依据：[坐席工作台通话与话后处理 · UI\-PAGE\-008](../ui-pages/UI-PAGE-008.md)、[固定本通表单和合法原业务上下文 · LOCAL\-CALL\-FORM](../local-logic/LOCAL-CALL-FORM.md)

- [同通业务字段与来源快照 · FIELD\-SAVED\-BUSINESS\-SNAPSHOT](../field-specs.md#FIELD-SAVED-BUSINESS-SNAPSHOT)；依据：[坐席工作台通话与话后处理 · UI\-PAGE\-008](../ui-pages/UI-PAGE-008.md)、[通话详情（本次客户业务信息） · UI\-PAGE\-009](../ui-pages/UI-PAGE-009.md)、[客户档案（业务信息汇总） · UI\-PAGE\-010](../ui-pages/UI-PAGE-010.md)、[按本通整版校验并保存结果 · LOCAL\-FOLLOWUP\-SAVE](../local-logic/LOCAL-FOLLOWUP-SAVE.md)、[按具体通次读取当时业务快照 · LOCAL\-READ\-CALL](../local-logic/LOCAL-READ-CALL.md)、[沿原规则展示档案业务汇总及来源 · LOCAL\-READ\-CUSTOMER](../local-logic/LOCAL-READ-CUSTOMER.md)

## 本功能验收

- **AC\-112**：本次意向车系只有一个且单选，候选来自Mapping车系接口完整成功响应；点击下拉加载并按名称或编码查找、选一个，不增加查询卡片或自由创建入口。门店仍原plannedStoreName文本，不启用接口门店多选。

- **AC\-113**：当前候选接口为GET /mapping/api/open/mapping\-car\-series/code，裸数组name、relation\_id、car\_state、media\_car\_series\_id；code暂采用String\(relation\_id\)、name展示，媒体ID与状态单独保留，不与DCC编码混用。默认media\_id=10/car\_state=1，不传brand\_id/is\_nev\_car\_type\_flag；编码选择和范围为本轮实施假定，正式接入前核对，不补状态枚举。

- **AC\-114**：门店使用原plannedStoreName文本；更换或清空接口车系不查询门店，不限制文本为NEV/ICE门店，不自动清空或改写门店文本。

- **AC\-115**：车系接口尚无环境主机及真实响应，原型按净化契约使用合成数据展示加载/成功/空集/异常；不冒称线上接通。查询异常保留输入重试，成功空结果与异常分开，旧响应不得覆盖当前通话/租户/配置/编辑版本。门店接口继续暂缓，不作为本期车系接入阻断。

- **AC\-116**：保留本次记录的原始意向车系和门店信息；本次填写不覆盖原导入值。

- **AC\-117**：原导入只读；客服明确确认后，按导入车系编码与当前接口官方ID的字符串code精确匹配并带入。未匹配/过期/取消不改当前值；不以同名或媒体ID猜测。导入编码实际口径待正式核对，导入门店不自动写入原文本。

- **AC\-118**：所配置上游值或查询映射变化后，传递使各下游旧条件请求及旧确认立即失效并保留已填显示；在完整新结果下逐项重判，仍匹配的原有效项可保留，失配项保留待重选，不默删或提交。无依赖字段不受无关车系变化影响。

- **AC\-119**：待重选项不作为当前条件有效值提交或回传；重新匹配后须客服明确确认或选择才恢复。多选中有无效项须处理或移除，不静默过滤；此规则适用于依赖下游字段，不另加必填要求。

- **AC\-125**：通用接口按所选上游属性及下游入参映射；可选未加入/隐藏/未填时不传，必需缺值停止，已填无效/属性类型/参数异常不当空放宽。Mapping车系默认独立查询文档默认媒体/状态范围；原门店文本不调用外部链，不要求DCC编码映射。

- **AC\-126**：通用接口依赖链任一上游变化，作废传递下游的旧查询和旧条件确认并保留显示；完整新结果逐项判断，仍匹配原有效项可保留，失配待重选，待重选重匹配或来源恢复须确认。本期原计划到店门店文本无车系依赖，不因车系变更而失效。

- **AC\-132**：包括本次车系在内实际启用接口查询异常导致本通配置必填无法完成时，保留全部当前输入供重试，不用自由选项绕过来源；原门店文本可继续填写。未接通原规则保持，生产草稿持久化/跨设备恢复契约未由模拟验证。

- **AC\-133**：进行中通话及话后处理固定开始时整版分类、字段、必填、选项、依赖与接口绑定配置，保存使用同一版，新配置从下一通生效，不因新增必填/隐藏/删字段/改类型/选项/依赖而丢值或卡住收尾。账号权限及接口启停/租户授权实时校验。保存按原通话条件、本版有效单选车系、原门店文本及其他字段校验；无初始存量兼容，生产草稿承诺不扩大。

- **AC\-134**：通用接口查询条件必需时，上游须加入分类并显示且有效非空；未满足提示补齐，不查下游。可选条件上游未加入/隐藏/未填写时不传参数独立查询，有效值才传，已填无效不能作为空值放宽。关闭条件无需映射。条件必需性与分类字段必填分开，本期原计划到店门店文本不应用接口条件。

- **AC\-135**：当前独立或关联条件的查询失败或不完整时保留输入并提示重试，查全后才允许新选择；不以此判旧值失配。已填值按当前条件依据和原保存规则校验，参数配置不匹配须明确报配置问题，不能回退为全部。

- **AC\-136**：通用接口清空必需上游停止下游并保留待重选，可选清空切无该参数完整重判；待重选重匹配须确认，普通仍匹配有效项可保留。Mapping车系无上游；清空该车系不改原门店文本。

- **AC\-137**：接口重新启用或租户重新获得授权后，尚未提交的来源不可用旧值须按当前条件重新查询，确认仍匹配并由客服明确确认或选择后才恢复有效；失败、部分失败或不匹配不能直接恢复。已保存历史不受影响。

- **AC\-138**：每次保存唯一车系官方ID字符串code和当时name，同时保留relation\_id、media\_car\_series\_id、car\_state来源快照；详情读当时值，后续改名不回写。plannedStoreName每通/详情/档案汇总沿原普通字段规则，不新增跨通配对或空文本清空汇总。原导入只读；无初始存量迁移/回填/旧格式兼容。

## 实施任务

本产品阶段阅读版不展示实施任务。开发接手后需核对工程方案与任务拆分，具体见[开发补充清单](../developer-supplement.md)。

## 来源与范围边界

本页仅整理本次范围内的 FUNC\-030。产品：云外呼平台 v1\.1\.1 业务数据接口字典与字段取数联动 / 1\.1\.1。

来源类型：analysis；来源指纹：923aae4c88f95eb803ba79f89afa043755adfc82a01a706894c286491c7857ff。

- memory/feature\-list\.json\#FUNC\-030

涉及来源变化、规则冲突或缺失时，回到产品事实和规划修订；[覆盖核对](../completeness-matrix.md)保留逐项追踪依据。
