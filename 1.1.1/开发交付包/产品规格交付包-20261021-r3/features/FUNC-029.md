# 保存接口车系及通用取数字段配置 · FUNC\-029

**READY\_FOR\_ENGINEERING\_DESIGN — 产品可交接，工程设计需补齐**

[返回功能目录](README.md) · [返回开发包入口](../README.md)

## 本功能做什么

复用现有接口取数和分类配置绑定Mapping车系且无上游；通用单上游映射继续，字段入库和分类另存分别生效。新配置下一通生效，不改变当前通话版本，原门店文本规则不变。

来源业务域：未提供；来源业务模块：未提供。

本页是同一份规划的功能阅读视图，仅整理已声明的关联，不增加业务规则，也不代表本功能已通过完整性核验。

## 推荐阅读顺序

1. 看下面的相关页面，确认用户从哪里进入。
2. 阅读局部逻辑，再按需打开字段定义。
3. 对照本功能验收，查看实施任务及其前置依赖。

[全局逻辑](../global-logic.md)和[通用 UI 规范](../ui-spec.md)供核对共同规则；无需每次从头通读。

## 相关页面

- [业务分类与字段配置 · UI\-PAGE\-007](../ui-pages/UI-PAGE-007.md) — 共用页面，另有 2 个功能

## 局部逻辑

- [独立保存字段及通用条件 · LOCAL\-FIELD\-SAVE](../local-logic/LOCAL-FIELD-SAVE.md)

本局部说明只声明关联当前功能，以下内容直接取自同一份规划。

### 触发与前置条件

触发：有权管理员在自定义字段编辑器保存字段

- 当前账号、企业/租户/对象和处理阶段有对应权限；输入来自本局部声明的当前对象。
- 沿当前已确认范围执行；不借原型或历史ID扩张权限。

### 处理步骤

1. **LOCAL\-FIELD\-SAVE\-STEP\-1**：选择原填写方式或接口取数；本次车系绑定Mapping且无上游

2. **LOCAL\-FIELD\-SAVE\-STEP\-2**：普通接口开启条件时配置一个上游、声明属性、支持参数和必需性

3. **LOCAL\-FIELD\-SAVE\-STEP\-3**：校验来源授权、类型/属性/参数、定义及无环链，再独立保存字段库并重绘依赖概览

### 分支与异常

- **LOCAL\-FIELD\-SAVE\-BRANCH\-1**：当本次意向车系，固定唯一单选接口及无上游，原门店文本仍普通字段。

- **LOCAL\-FIELD\-SAVE\-BRANCH\-2**：当条件关闭，不要求映射，不触发下游取数参数。

- **LOCAL\-FIELD\-SAVE\-BRANCH\-3**：当自身/循环/缺定义/不支持参数或类型不兼容，拒绝保存并指出配置项，不静默删参或转换旧配置。

- **LOCAL\-FIELD\-SAVE\-BRANCH\-4**：当保存字段但未保存分类，只完成字段入库，不自动加入分类或改变客服当前通话。

### 完成后的状态

- 仅本次动作的合法结果生效；取消或核对/保存异常保留原对象与输入，不宣称成功。

- [保存分类引用、显示顺序与必填 · LOCAL\-CLASS\-FIELDS\-SAVE](../local-logic/LOCAL-CLASS-FIELDS-SAVE.md)

本局部说明只声明关联当前功能，以下内容直接取自同一份规划。

### 触发与前置条件

触发：管理员在业务分类配置添加/移除、排序和保存字段引用

- 当前账号、企业/租户/对象和处理阶段有对应权限；输入来自本局部声明的当前对象。
- 沿当前已确认范围执行；不借原型或历史ID扩张权限。

### 处理步骤

1. **LOCAL\-CLASS\-FIELDS\-SAVE\-STEP\-1**：引用已存字段，分别设置顺序、显示和必填，可移除预置引用

2. **LOCAL\-CLASS\-FIELDS\-SAVE\-STEP\-2**：检查必需依赖可在分类提供；可选缺失仅说明而不强补

3. **LOCAL\-CLASS\-FIELDS\-SAVE\-STEP\-3**：保存分类新配置供后续通话使用，不改健康本通整版

### 分支与异常

- **LOCAL\-CLASS\-FIELDS\-SAVE\-BRANCH\-1**：当必需上游未加入/不显示，明确定位所需来源，用户调整后再保存，不自动改其他必填。

- **LOCAL\-CLASS\-FIELDS\-SAVE\-BRANCH\-2**：当可选上游未加入/隐藏，可保存；后续按条件无值规则省参。

- **LOCAL\-CLASS\-FIELDS\-SAVE\-BRANCH\-3**：当明确空引用集合，允许沿原规则保存且刷新不补；当前有效通话照旧版。

### 完成后的状态

- 仅本次动作的合法结果生效；取消或核对/保存异常保留原对象与输入，不宣称成功。

- [启用当前字段定义 · LOCAL\-FIELD\-ENABLE](../local-logic/LOCAL-FIELD-ENABLE.md)

本局部说明只声明关联当前功能，以下内容直接取自同一份规划。

### 触发与前置条件

触发：有权管理员在字段列表点击已停用字段的启用

- 本租户及成员维护权限有效，目标当前存在，当前版本可可靠核对。
- 此入口承载已有字段配置维护，不新增独立本期功能或接口授权。

### 处理步骤

1. **LOCAL\-FIELD\-ENABLE\-STEP\-1**：读取目标字段及明确的启用true目标，所有字段使用相同行操作。

2. **LOCAL\-FIELD\-ENABLE\-STEP\-2**：重查权限、目标版本、定义及依赖完整性；启用不扩大接口/租户资格。

3. **LOCAL\-FIELD\-ENABLE\-STEP\-3**：同次保存目标状态与定义，成功后刷新状态及相反操作按钮；不改变进行中通话版。

### 分支与异常

- **LOCAL\-FIELD\-ENABLE\-BRANCH\-1**：当身份/目标版本、读取或保存条件发生变化，保留原定义与状态，提示当前不能完成；不覆盖其他写入。。

- **LOCAL\-FIELD\-ENABLE\-BRANCH\-2**：当已有本通整版或历史快照，继续原独立快照，新字段状态不替换本通；字典启停与接口授权仍实时。。

### 完成后的状态

- 成功仅更新当前字段定义及启停状态；旧通话/话后和历史快照保持，异常保留原配置。

- [停用当前字段定义 · LOCAL\-FIELD\-DISABLE](../local-logic/LOCAL-FIELD-DISABLE.md)

本局部说明只声明关联当前功能，以下内容直接取自同一份规划。

### 触发与前置条件

触发：有权管理员在字段列表点击已启用字段的停用

- 本租户及成员维护权限有效，目标当前存在，当前版本可可靠核对。
- 此入口承载已有字段配置维护，不新增独立本期功能或接口授权。

### 处理步骤

1. **LOCAL\-FIELD\-DISABLE\-STEP\-1**：读取目标字段及明确的停用false目标，所有字段使用相同行操作。

2. **LOCAL\-FIELD\-DISABLE\-STEP\-2**：重查权限、目标版本、定义及依赖完整性；当前启用分类仍显示时提示先关闭分类显示，不自动改分类或依赖。

3. **LOCAL\-FIELD\-DISABLE\-STEP\-3**：同次保存目标状态与定义，成功后刷新状态及相反操作按钮；不改变进行中通话版。

### 分支与异常

- **LOCAL\-FIELD\-DISABLE\-BRANCH\-1**：当身份/目标版本、读取或保存条件发生变化，保留原定义与状态，提示当前不能完成；不覆盖其他写入。。

- **LOCAL\-FIELD\-DISABLE\-BRANCH\-2**：当已有本通整版或历史快照，继续原独立快照，新字段状态不替换本通；字典启停与接口授权仍实时。。

- **LOCAL\-FIELD\-DISABLE\-BRANCH\-3**：当当前启用分类显示该字段或必要配置依赖不满足，说明需调整的当前配置，保持启用；与删除时所有当前引用均须解除的规则区分。。

### 完成后的状态

- 成功仅更新当前字段定义及启停状态；旧通话/话后和历史快照保持，异常保留原配置。

## 本功能明确关联的字段

这些关系来自已声明的页面／局部说明；字段仍可能被其他功能复用。

- [字段定义整体 · FIELD\-DEFINITION](../field-specs.md#FIELD-DEFINITION)；依据：[独立保存字段及通用条件 · LOCAL\-FIELD\-SAVE](../local-logic/LOCAL-FIELD-SAVE.md)、[保存分类引用、显示顺序与必填 · LOCAL\-CLASS\-FIELDS\-SAVE](../local-logic/LOCAL-CLASS-FIELDS-SAVE.md)、[启用当前字段定义 · LOCAL\-FIELD\-ENABLE](../local-logic/LOCAL-FIELD-ENABLE.md)、[停用当前字段定义 · LOCAL\-FIELD\-DISABLE](../local-logic/LOCAL-FIELD-DISABLE.md)

- [自定义字段稳定标识 · FIELD\-DEFINITION\-ID](../field-specs.md#FIELD-DEFINITION-ID)；依据：[独立保存字段及通用条件 · LOCAL\-FIELD\-SAVE](../local-logic/LOCAL-FIELD-SAVE.md)、[启用当前字段定义 · LOCAL\-FIELD\-ENABLE](../local-logic/LOCAL-FIELD-ENABLE.md)、[停用当前字段定义 · LOCAL\-FIELD\-DISABLE](../local-logic/LOCAL-FIELD-DISABLE.md)

- [字段名称 · FIELD\-DEFINITION\-LABEL](../field-specs.md#FIELD-DEFINITION-LABEL)；依据：[独立保存字段及通用条件 · LOCAL\-FIELD\-SAVE](../local-logic/LOCAL-FIELD-SAVE.md)

- [填写方式 · FIELD\-DEFINITION\-TYPE](../field-specs.md#FIELD-DEFINITION-TYPE)；依据：[独立保存字段及通用条件 · LOCAL\-FIELD\-SAVE](../local-logic/LOCAL-FIELD-SAVE.md)

- [上游依赖展示 · FIELD\-DEPENDENCY\-SUMMARY](../field-specs.md#FIELD-DEPENDENCY-SUMMARY)；依据：[独立保存字段及通用条件 · LOCAL\-FIELD\-SAVE](../local-logic/LOCAL-FIELD-SAVE.md)

- [字段取数接口引用 · FIELD\-DICTIONARY\-REF](../field-specs.md#FIELD-DICTIONARY-REF)；依据：[独立保存字段及通用条件 · LOCAL\-FIELD\-SAVE](../local-logic/LOCAL-FIELD-SAVE.md)

- [下游入参字段名 · FIELD\-DOWNSTREAM\-PARAM](../field-specs.md#FIELD-DOWNSTREAM-PARAM)；依据：[独立保存字段及通用条件 · LOCAL\-FIELD\-SAVE](../local-logic/LOCAL-FIELD-SAVE.md)

- [查询条件是否必需 · FIELD\-QUERY\-REQUIRED](../field-specs.md#FIELD-QUERY-REQUIRED)；依据：[独立保存字段及通用条件 · LOCAL\-FIELD\-SAVE](../local-logic/LOCAL-FIELD-SAVE.md)

- [上游字段 · FIELD\-UPSTREAM\-ID](../field-specs.md#FIELD-UPSTREAM-ID)；依据：[独立保存字段及通用条件 · LOCAL\-FIELD\-SAVE](../local-logic/LOCAL-FIELD-SAVE.md)

- [上游取值属性 · FIELD\-UPSTREAM\-PROPERTY](../field-specs.md#FIELD-UPSTREAM-PROPERTY)；依据：[独立保存字段及通用条件 · LOCAL\-FIELD\-SAVE](../local-logic/LOCAL-FIELD-SAVE.md)

- [是否使用其他字段作为条件 · FIELD\-USE\-UPSTREAM](../field-specs.md#FIELD-USE-UPSTREAM)；依据：[独立保存字段及通用条件 · LOCAL\-FIELD\-SAVE](../local-logic/LOCAL-FIELD-SAVE.md)

- [字段库启用状态 · FIELD\-DEFINITION\-ENABLED](../field-specs.md#FIELD-DEFINITION-ENABLED)；依据：[独立保存字段及通用条件 · LOCAL\-FIELD\-SAVE](../local-logic/LOCAL-FIELD-SAVE.md)、[启用当前字段定义 · LOCAL\-FIELD\-ENABLE](../local-logic/LOCAL-FIELD-ENABLE.md)、[停用当前字段定义 · LOCAL\-FIELD\-DISABLE](../local-logic/LOCAL-FIELD-DISABLE.md)

- [业务分类识别与配置 · FIELD\-CATEGORY\-DEFINITION](../field-specs.md#FIELD-CATEGORY-DEFINITION)；依据：[保存分类引用、显示顺序与必填 · LOCAL\-CLASS\-FIELDS\-SAVE](../local-logic/LOCAL-CLASS-FIELDS-SAVE.md)、[停用当前字段定义 · LOCAL\-FIELD\-DISABLE](../local-logic/LOCAL-FIELD-DISABLE.md)

- [分类字段引用集合 · FIELD\-CLASS\-FIELD\-REFS](../field-specs.md#FIELD-CLASS-FIELD-REFS)；依据：[保存分类引用、显示顺序与必填 · LOCAL\-CLASS\-FIELDS\-SAVE](../local-logic/LOCAL-CLASS-FIELDS-SAVE.md)、[停用当前字段定义 · LOCAL\-FIELD\-DISABLE](../local-logic/LOCAL-FIELD-DISABLE.md)

- [分类字段顺序 · FIELD\-CLASS\-ORDER](../field-specs.md#FIELD-CLASS-ORDER)；依据：[保存分类引用、显示顺序与必填 · LOCAL\-CLASS\-FIELDS\-SAVE](../local-logic/LOCAL-CLASS-FIELDS-SAVE.md)

- [分类字段是否必填 · FIELD\-CLASS\-REQUIRED](../field-specs.md#FIELD-CLASS-REQUIRED)；依据：[保存分类引用、显示顺序与必填 · LOCAL\-CLASS\-FIELDS\-SAVE](../local-logic/LOCAL-CLASS-FIELDS-SAVE.md)

- [分类字段是否显示 · FIELD\-CLASS\-VISIBLE](../field-specs.md#FIELD-CLASS-VISIBLE)；依据：[保存分类引用、显示顺序与必填 · LOCAL\-CLASS\-FIELDS\-SAVE](../local-logic/LOCAL-CLASS-FIELDS-SAVE.md)、[停用当前字段定义 · LOCAL\-FIELD\-DISABLE](../local-logic/LOCAL-FIELD-DISABLE.md)

## 共用说明中的字段上下文

以下字段来自共用页面、局部说明或任务，用于定位上下文；不等于本功能都需要实现。

- [通话及业务对象上下文 · FIELD\-CALL\-CONTEXT](../field-specs.md#FIELD-CALL-CONTEXT)；依据：[业务分类与字段配置 · UI\-PAGE\-007](../ui-pages/UI-PAGE-007.md)

- [已删除分类保留定义 · FIELD\-CATEGORY\-ARCHIVE](../field-specs.md#FIELD-CATEGORY-ARCHIVE)；依据：[业务分类与字段配置 · UI\-PAGE\-007](../ui-pages/UI-PAGE-007.md)

## 本功能验收

- **AC\-109**：本次意向车系改为“接口取数”，引用超管配置并授权的Mapping车系编码查询条目，唯一单选且无上游条件；管理员不再手工维护该字段车系候选。通用接口条件映射继续，原计划到店门店仍普通文本，本期不启用接口门店选择。 本期直接初始化当前Mapping接口车系单选与原计划到店门店文本，不读取、转换或合并旧原型预置配置，不做历史配置或业务数据迁移，不保留旧预置关联的兼容告警与自动修补路径。当版新建字段标识在后续维护中保持稳定，各分类对当前字段的正常引用沿各自顺序、显示、必填及权限规则保存；普通自定义字段、有效通用上下游依赖和当前通话整版配置保护继续保留。旧资料仅作历史追溯，不作为本版运行输入。

- **AC\-110**：字段按名称选择“取数接口”，稳定ID引用。配置是否使用其他字段；否无需映射。是时选择一个上游接口字段、从声明返回属性中选择取值字段，填写下游入参名并选择该条件必需／可选，可带默认且可改。超管仍四项，URL、鉴权与底层适配由研发维护。

- **AC\-111**：本期不新建或启用接口意向门店字段供客服查选，不维护自定义门店候选库；门店使用原计划到店门店文本。本期无初始存量，不要求旧接口车系、单/多门店格式转换、数据迁移、回填或历史兼容验收；保留项目历史讨论、材料及实际旧文件。

- **AC\-120**：本次接口车系与原门店文本分别沿通话开始固定的业务分类配置是否必填；车系必填需一个有效接口项，门店按原文本规则。未接通仍沿v1\.1\.0准确条件，不统一强制门店接口选择。

- **AC\-121**：接口条件必需/可选与业务字段必填分别配置；本期车系无上游条件，原门店文本无车系依赖；分类必填沿当前通话配置版本，不受管理员新配置追溯改变。

- **AC\-124**：通用接口字段最多一个直接上游，支持无环A→B→C；校验自身/循环/定义存在/属性类型，仅必需边要求分类加入且显示，可选不强制，不能自动补字段或改必填。本次Mapping车系无上游，原门店文本不配车系依赖；无初始存量迁移。

## 实施任务

本产品阶段阅读版不展示实施任务。开发接手后需核对工程方案与任务拆分，具体见[开发补充清单](../developer-supplement.md)。

## 来源与范围边界

本页仅整理本次范围内的 FUNC\-029。产品：云外呼平台 v1\.1\.1 业务数据接口字典与字段取数联动 / 1\.1\.1。

来源类型：analysis；来源指纹：06ff20c0417423ef883d38c2ea13ade0cef280e7d0d2cc08c26587440970627a。

- memory/feature\-list\.json\#FUNC\-029

涉及来源变化、规则冲突或缺失时，回到产品事实和规划修订；[覆盖核对](../completeness-matrix.md)保留逐项追踪依据。
