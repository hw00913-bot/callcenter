# 字段级逻辑说明

**READY_FOR_ENGINEERING_DESIGN — 产品可交接，工程设计需补齐**

[返回阅读入口](README.md) · [按功能阅读](features/README.md)

本文件供按字段查询；先在功能页选择相关字段，再跳到这里阅读完整规则。本包的定义由同一份规划生成。

## 字段范围

模式：field_level

包含接口字典、通用字段/分类引用、接口候选、本通输入和历史归档；按业务实体与键复用字段，不将历史DCC物理候选当本期协议。

范围依据：
- memory/business-rules.json
- planning/page-index.json
- interfaces/interface-index.json

## 字段索引

- [FIELD-DICT-ID](field-specs.md#FIELD-DICT-ID) 取数接口条目.id — 取数接口条目标识
- [FIELD-DICT-NAME](field-specs.md#FIELD-DICT-NAME) 取数接口条目.name — 接口名称
- [FIELD-CAPABILITY](field-specs.md#FIELD-CAPABILITY) 取数接口条目.capability — 取数能力
- [FIELD-TENANT-GRANTS](field-specs.md#FIELD-TENANT-GRANTS) 取数接口条目.tenants — 可用租户集合
- [FIELD-DICT-ENABLED](field-specs.md#FIELD-DICT-ENABLED) 取数接口条目.enabled — 接口启用状态
- [FIELD-DEFINITION-ID](field-specs.md#FIELD-DEFINITION-ID) 字段定义.id — 自定义字段稳定标识
- [FIELD-DEFINITION-LABEL](field-specs.md#FIELD-DEFINITION-LABEL) 字段定义.label — 字段名称
- [FIELD-DEFINITION-TYPE](field-specs.md#FIELD-DEFINITION-TYPE) 字段定义.type — 填写方式
- [FIELD-DICTIONARY-REF](field-specs.md#FIELD-DICTIONARY-REF) 字段定义.dictionaryRef — 字段取数接口引用
- [FIELD-USE-UPSTREAM](field-specs.md#FIELD-USE-UPSTREAM) 字段查询条件.enabled — 是否使用其他字段作为条件
- [FIELD-UPSTREAM-ID](field-specs.md#FIELD-UPSTREAM-ID) 字段查询条件.upstreamField — 上游字段
- [FIELD-UPSTREAM-PROPERTY](field-specs.md#FIELD-UPSTREAM-PROPERTY) 字段查询条件.sourceProperty — 上游取值属性
- [FIELD-DOWNSTREAM-PARAM](field-specs.md#FIELD-DOWNSTREAM-PARAM) 字段查询条件.targetParameter — 下游入参字段名
- [FIELD-QUERY-REQUIRED](field-specs.md#FIELD-QUERY-REQUIRED) 字段查询条件.required — 查询条件是否必需
- [FIELD-DEPENDENCY-SUMMARY](field-specs.md#FIELD-DEPENDENCY-SUMMARY) 字段查询条件.displaySummary — 上游依赖展示
- [FIELD-DEFINITION](field-specs.md#FIELD-DEFINITION) 字段库.definition — 字段定义整体
- [FIELD-CLASS-REQUIRED](field-specs.md#FIELD-CLASS-REQUIRED) 分类字段引用.required — 分类字段是否必填
- [FIELD-CLASS-VISIBLE](field-specs.md#FIELD-CLASS-VISIBLE) 分类字段引用.visible — 分类字段是否显示
- [FIELD-CLASS-ORDER](field-specs.md#FIELD-CLASS-ORDER) 分类字段引用.order — 分类字段顺序
- [FIELD-CLASS-FIELD-REFS](field-specs.md#FIELD-CLASS-FIELD-REFS) 业务分类.fieldReferences — 分类字段引用集合
- [FIELD-CATEGORY-DEFINITION](field-specs.md#FIELD-CATEGORY-DEFINITION) 业务分类.definition — 业务分类识别与配置
- [FIELD-CATEGORY-ARCHIVE](field-specs.md#FIELD-CATEGORY-ARCHIVE) 业务分类归档.retainedDefinition — 已删除分类保留定义
- [FIELD-CALL-CONTEXT](field-specs.md#FIELD-CALL-CONTEXT) 本次业务处理.context — 通话及业务对象上下文
- [FIELD-CALL-VERSION](field-specs.md#FIELD-CALL-VERSION) 本次业务处理.formDefinition — 本通整版业务表单
- [FIELD-OFFICIAL-SERIES-ID](field-specs.md#FIELD-OFFICIAL-SERIES-ID) 车系来源记录.relation_id — 官方车系ID
- [FIELD-SERIES-CODE](field-specs.md#FIELD-SERIES-CODE) 本次意向车系.code — 本次车系编码
- [FIELD-SERIES-NAME](field-specs.md#FIELD-SERIES-NAME) 本次意向车系.name — 车系当时名称
- [FIELD-SERIES-MEDIA-ID](field-specs.md#FIELD-SERIES-MEDIA-ID) 车系来源记录.media_car_series_id — 媒体车系ID来源快照
- [FIELD-SERIES-SOURCE-STATE](field-specs.md#FIELD-SERIES-SOURCE-STATE) 车系来源记录.car_state — 车系状态原值快照
- [FIELD-SERIES-SELECTION](field-specs.md#FIELD-SERIES-SELECTION) 本次业务填写.series — 本次接口车系单选
- [FIELD-MAPPING-MEDIA-FILTER](field-specs.md#FIELD-MAPPING-MEDIA-FILTER) 车系查询.media_id — Mapping预置媒体范围
- [FIELD-MAPPING-STATE-FILTER](field-specs.md#FIELD-MAPPING-STATE-FILTER) 车系查询.car_state — Mapping预置状态范围
- [FIELD-PLANNED-STORE](field-specs.md#FIELD-PLANNED-STORE) 本次业务填写.plannedStoreName — 计划到店门店原文本
- [FIELD-IMPORTED-INTENTION](field-specs.md#FIELD-IMPORTED-INTENTION) 客户原始导入.intention — 原导入意向信息
- [FIELD-OTHER-BUSINESS-VALUES](field-specs.md#FIELD-OTHER-BUSINESS-VALUES) 本次业务填写.otherValues — 其他既有业务字段值
- [FIELD-SAVED-BUSINESS-SNAPSHOT](field-specs.md#FIELD-SAVED-BUSINESS-SNAPSHOT) 已保存业务信息.fieldSnapshot — 同通业务字段与来源快照
- [FIELD-DEFINITION-ENABLED](field-specs.md#FIELD-DEFINITION-ENABLED) 可复用字段定义.enabled — 字段库启用状态

<a id="FIELD-DICT-ID"></a>

## FIELD-DICT-ID 取数接口条目标识

单功能页面／局部明确关联：

- [新增业务数据接口条目 · FUNC\-023](features/FUNC-023.md)
- [编辑取数接口条目 · FUNC\-024](features/FUNC-024.md)
- [启用业务数据接口条目 · FUNC\-025](features/FUNC-025.md)
- [停用业务数据接口条目 · FUNC\-026](features/FUNC-026.md)
- [开放接口条目的租户使用范围 · FUNC\-027](features/FUNC-027.md)
- [撤销接口条目的租户使用授权 · FUNC\-028](features/FUNC-028.md)
- [删除未使用取数接口字典条目 · FUNC\-031](features/FUNC-031.md)

业务对象：`取数接口条目`

字段：`id`

类型：string

格式/枚举/单位/精度：平台生成的稳定不透明标识，区别于接口名称及车系编码。

允许 null：False

必填条件：新增成功后的条目身份、编辑/启停/授权/删除及字段引用时必需；由系统生成，不让超管手填。

### 默认与初始化

模式：none；值：`null`

没有独立业务默认值；创建前不造值，编辑保留当前有效值，不用空默认覆盖既有数据。

### 校验与关联约束

- 新增成功时生成且唯一；改名、启停、授权及合法换能力均不改ID。
- 不得使用该ID冒充外部车系编码或租户标识。

### 读写权限

可读：
- 超管及被授权租户按业务权限查看可用来源

可写：
- 平台或来源系统按本字段生命周期生成；用户不得直接伪造系统/来源值

### 各状态行为

- 填写或配置：平台生成的稳定不透明标识，区别于接口名称及车系编码。；显示和编辑服从权限、来源与动作条件。
- 提交核对：提交时按本字段约束及相关局部分支核对；拒绝时保留当前输入和原有效对象。
- 保存完成/历史：仅在本字段约定的时机写入；已保存历史按当时快照读取，不因新配置回写。

### 来源与计算

来源类型：system

规则：平台生成的稳定不透明标识，区别于接口名称及车系编码。

依赖字段：无

### 保存与更新

方式：stored

物理映射：由开发补充

业务保存或更新时机：所属配置保存成功时按稳定对象标识写入；取消或提交核对不通过不修改已存对象。

### 接口映射

由开发依据本字段业务规则补充接口映射，见[开发补充清单](developer-supplement.md)。



### 边界示例

合法：
- 系统生成的不透明条目标识（合成）

非法/拒绝：
- 把接口名称或车系code当作条目标识

### 依据、使用位置与验证

来源：
- memory/business-rules.json#BR-034

来源条目：
- rules:BR-034

局部说明：[LOCAL-DICT-CREATE](local-logic/LOCAL-DICT-CREATE.md)、[LOCAL-DICT-EDIT](local-logic/LOCAL-DICT-EDIT.md)、[LOCAL-DICT-ENABLE](local-logic/LOCAL-DICT-ENABLE.md)、[LOCAL-DICT-DISABLE](local-logic/LOCAL-DICT-DISABLE.md)、[LOCAL-TENANT-GRANT](local-logic/LOCAL-TENANT-GRANT.md)、[LOCAL-TENANT-REVOKE](local-logic/LOCAL-TENANT-REVOKE.md)、[LOCAL-DICT-DELETE](local-logic/LOCAL-DICT-DELETE.md)

任务：

测试：CHECK-105, CHECK-127, CHECK-128

<a id="FIELD-DICT-NAME"></a>

## FIELD-DICT-NAME 接口名称

单功能页面／局部明确关联：

- [新增业务数据接口条目 · FUNC\-023](features/FUNC-023.md)
- [编辑取数接口条目 · FUNC\-024](features/FUNC-024.md)

共享页面／局部／任务上下文（不等于字段专属归属）：

- [启用业务数据接口条目 · FUNC\-025](features/FUNC-025.md)
- [停用业务数据接口条目 · FUNC\-026](features/FUNC-026.md)
- [开放接口条目的租户使用范围 · FUNC\-027](features/FUNC-027.md)
- [撤销接口条目的租户使用授权 · FUNC\-028](features/FUNC-028.md)
- [删除未使用取数接口字典条目 · FUNC\-031](features/FUNC-031.md)

业务对象：`取数接口条目`

字段：`name`

类型：string

格式/枚举/单位/精度：运营可识别的业务名称，去首尾空格后1至60字。

允许 null：False

必填条件：新增或编辑接口名称保存时必填，trim后1至60字。

### 默认与初始化

模式：none；值：`null`

没有独立业务默认值；创建前不造值，编辑保留当前有效值，不用空默认覆盖既有数据。

### 校验与关联约束

- 必填；trim后最多60字。
- 在全局字典中按英文大小写不敏感比较，不重名；同能力不同名称允许多条。

### 读写权限

可读：
- 超管及被授权租户按业务权限查看可用来源

可写：
- 仅超级管理员维护；引用后能力受锁定规则约束

### 各状态行为

- 填写或配置：运营可识别的业务名称，去首尾空格后1至60字。；显示和编辑服从权限、来源与动作条件。
- 提交核对：提交时按本字段约束及相关局部分支核对；拒绝时保留当前输入和原有效对象。
- 保存完成/历史：仅在本字段约定的时机写入；已保存历史按当时快照读取，不因新配置回写。

### 来源与计算

来源类型：input

规则：由具备权限的操作者通过既有控件明确填写或选择；不擅自从其他字段猜测。

依赖字段：无

### 保存与更新

方式：stored

物理映射：由开发补充

业务保存或更新时机：所属配置保存成功时按稳定对象标识写入；取消或提交核对不通过不修改已存对象。

### 接口映射

由开发依据本字段业务规则补充接口映射，见[开发补充清单](developer-supplement.md)。



### 边界示例

合法：
- 意向车系

非法/拒绝：
- 61字、全空格或已有名称的英文大小写变体

### 依据、使用位置与验证

来源：
- planning/page-index.json#PAGE-006
- memory/business-rules.json#BR-034

来源条目：
- pages:PAGE-006/fields/0
- rules:BR-034

局部说明：[LOCAL-DICT-CREATE](local-logic/LOCAL-DICT-CREATE.md)、[LOCAL-DICT-EDIT](local-logic/LOCAL-DICT-EDIT.md)

任务：

测试：CHECK-105, CHECK-127, CHECK-128, CHECK-AUTH

<a id="FIELD-CAPABILITY"></a>

## FIELD-CAPABILITY 取数能力

单功能页面／局部明确关联：

- [新增业务数据接口条目 · FUNC\-023](features/FUNC-023.md)
- [编辑取数接口条目 · FUNC\-024](features/FUNC-024.md)
- [删除未使用取数接口字典条目 · FUNC\-031](features/FUNC-031.md)

共享页面／局部／任务上下文（不等于字段专属归属）：

- [启用业务数据接口条目 · FUNC\-025](features/FUNC-025.md)
- [停用业务数据接口条目 · FUNC\-026](features/FUNC-026.md)
- [开放接口条目的租户使用范围 · FUNC\-027](features/FUNC-027.md)
- [撤销接口条目的租户使用授权 · FUNC\-028](features/FUNC-028.md)

业务对象：`取数接口条目`

字段：`capability`

类型：string

格式/枚举/单位/精度：研发预置能力的稳定引用；不是URL、任意脚本或车系编码。

允许 null：False

必填条件：新增条目必选；更换时必须当前无实际或保留引用且提交核对通过。

### 默认与初始化

模式：none；值：`null`

没有独立业务默认值；创建前不造值，编辑保留当前有效值，不用空默认覆盖既有数据。

### 校验与关联约束

- 必须为研发已声明的可选择能力。
- 当前无实际/保留引用才可更换；有引用或无法核对则固定，提交时重查。
- 同能力可有独立条目；不因新增条目宣称真实接通。

### 读写权限

可读：
- 超管及被授权租户按业务权限查看可用来源

可写：
- 仅超级管理员维护；引用后能力受锁定规则约束

### 各状态行为

- 填写或配置：研发预置能力的稳定引用；不是URL、任意脚本或车系编码。；显示和编辑服从权限、来源与动作条件。
- 提交核对：提交时按本字段约束及相关局部分支核对；拒绝时保留当前输入和原有效对象。
- 保存完成/历史：仅在本字段约定的时机写入；已保存历史按当时快照读取，不因新配置回写。

### 来源与计算

来源类型：input

规则：由具备权限的操作者通过既有控件明确填写或选择；不擅自从其他字段猜测。

依赖字段：无

### 保存与更新

方式：stored

物理映射：由开发补充

业务保存或更新时机：所属配置保存成功时按稳定对象标识写入；取消或提交核对不通过不修改已存对象。

### 接口映射

由开发依据本字段业务规则补充接口映射，见[开发补充清单](developer-supplement.md)。



### 边界示例

合法：
- 选择预置的Mapping车系查询能力

非法/拒绝：
- 已有字段引用时直接换成另一能力

### 依据、使用位置与验证

来源：
- planning/page-index.json#PAGE-006
- memory/business-rules.json#BR-034

来源条目：
- pages:PAGE-006/fields/1
- rules:BR-034

局部说明：[LOCAL-DICT-CREATE](local-logic/LOCAL-DICT-CREATE.md)、[LOCAL-DICT-EDIT](local-logic/LOCAL-DICT-EDIT.md)、[LOCAL-DICT-DELETE](local-logic/LOCAL-DICT-DELETE.md)

任务：

测试：CHECK-105, CHECK-128, CHECK-REFERENCE-RACE, CHECK-IMPLICIT-REFERENCE

<a id="FIELD-TENANT-GRANTS"></a>

## FIELD-TENANT-GRANTS 可用租户集合

单功能页面／局部明确关联：

- [新增业务数据接口条目 · FUNC\-023](features/FUNC-023.md)
- [启用业务数据接口条目 · FUNC\-025](features/FUNC-025.md)
- [开放接口条目的租户使用范围 · FUNC\-027](features/FUNC-027.md)
- [撤销接口条目的租户使用授权 · FUNC\-028](features/FUNC-028.md)

共享页面／局部／任务上下文（不等于字段专属归属）：

- [编辑取数接口条目 · FUNC\-024](features/FUNC-024.md)
- [停用业务数据接口条目 · FUNC\-026](features/FUNC-026.md)
- [删除未使用取数接口字典条目 · FUNC\-031](features/FUNC-031.md)

业务对象：`取数接口条目`

字段：`tenants`

类型：array<string>

格式/枚举/单位/精度：由超管勾选的允许使用本条目的租户稳定标识集合。

允许 null：False

必填条件：保存字典/授权操作时必须是明确集合，可为空；不是逐租户都必选。

### 默认与初始化

模式：literal；值：`[]`

新建未勾选时没有任何租户授权；编辑沿原集合。

### 校验与关联约束

- 集合去重且每项是有效可配置租户。
- 空集合表示未开放租户，不等于全部租户。
- 成员业务权限及对象归属仍独立校验，授权只限当前条目。

### 读写权限

可读：
- 超管及被授权租户按业务权限查看可用来源

可写：
- 仅超级管理员维护；引用后能力受锁定规则约束

### 各状态行为

- 填写或配置：由超管勾选的允许使用本条目的租户稳定标识集合。；显示和编辑服从权限、来源与动作条件。
- 提交核对：提交时按本字段约束及相关局部分支核对；拒绝时保留当前输入和原有效对象。
- 保存完成/历史：仅在本字段约定的时机写入；已保存历史按当时快照读取，不因新配置回写。

### 来源与计算

来源类型：input

规则：由具备权限的操作者通过既有控件明确填写或选择；不擅自从其他字段猜测。

依赖字段：无

### 保存与更新

方式：stored

物理映射：由开发补充

业务保存或更新时机：所属配置保存成功时按稳定对象标识写入；取消或提交核对不通过不修改已存对象。

### 接口映射

由开发依据本字段业务规则补充接口映射，见[开发补充清单](developer-supplement.md)。



### 边界示例

合法：
- 仅勾租户甲和乙，或明确不开放任何租户

非法/拒绝：
- 用空集合代表全部租户或伪造租户ID

### 依据、使用位置与验证

来源：
- planning/page-index.json#PAGE-006
- memory/business-rules.json#BR-034

来源条目：
- pages:PAGE-006/fields/2
- rules:BR-034

局部说明：[LOCAL-DICT-CREATE](local-logic/LOCAL-DICT-CREATE.md)、[LOCAL-DICT-ENABLE](local-logic/LOCAL-DICT-ENABLE.md)、[LOCAL-TENANT-GRANT](local-logic/LOCAL-TENANT-GRANT.md)、[LOCAL-TENANT-REVOKE](local-logic/LOCAL-TENANT-REVOKE.md)

任务：

测试：CHECK-107, CHECK-108, CHECK-122, CHECK-123

<a id="FIELD-DICT-ENABLED"></a>

## FIELD-DICT-ENABLED 接口启用状态

单功能页面／局部明确关联：

- [新增业务数据接口条目 · FUNC\-023](features/FUNC-023.md)
- [启用业务数据接口条目 · FUNC\-025](features/FUNC-025.md)
- [停用业务数据接口条目 · FUNC\-026](features/FUNC-026.md)
- [开放接口条目的租户使用范围 · FUNC\-027](features/FUNC-027.md)

共享页面／局部／任务上下文（不等于字段专属归属）：

- [编辑取数接口条目 · FUNC\-024](features/FUNC-024.md)
- [撤销接口条目的租户使用授权 · FUNC\-028](features/FUNC-028.md)
- [删除未使用取数接口字典条目 · FUNC\-031](features/FUNC-031.md)

业务对象：`取数接口条目`

字段：`enabled`

类型：boolean

格式/枚举/单位/精度：条目的启用/停用目标；启用不扩大租户范围，停用不删除。

允许 null：False

必填条件：新增或启停提交时必须有明确boolean目标；编辑保持未改状态。

### 默认与初始化

模式：literal；值：`true`

沿当前原型新建表单默认启用且明确显示；编辑保原状态，用户可在保存前选择停用。

### 校验与关联约束

- 保存时必须是明确的启用或停用状态。
- 停用/撤权实时停止新查询/新选，历史保留；恢复未提交旧值需重查确认。

### 读写权限

可读：
- 超管及被授权租户按业务权限查看可用来源

可写：
- 仅超级管理员维护；引用后能力受锁定规则约束

### 各状态行为

- 填写或配置：条目的启用/停用目标；启用不扩大租户范围，停用不删除。；显示和编辑服从权限、来源与动作条件。
- 提交核对：提交时按本字段约束及相关局部分支核对；拒绝时保留当前输入和原有效对象。
- 保存完成/历史：仅在本字段约定的时机写入；已保存历史按当时快照读取，不因新配置回写。

### 来源与计算

来源类型：input

规则：由具备权限的操作者通过既有控件明确填写或选择；不擅自从其他字段猜测。

依赖字段：无

### 保存与更新

方式：stored

物理映射：由开发补充

业务保存或更新时机：所属配置保存成功时按稳定对象标识写入；取消或提交核对不通过不修改已存对象。

### 接口映射

由开发依据本字段业务规则补充接口映射，见[开发补充清单](developer-supplement.md)。



### 边界示例

合法：
- 新建表单明确显示启用；用户可改停用

非法/拒绝：
- 停用后顺便删历史或向未授权租户开放

### 依据、使用位置与验证

来源：
- planning/page-index.json#PAGE-006
- memory/business-rules.json#BR-034

来源条目：
- pages:PAGE-006/fields/3
- rules:BR-034

局部说明：[LOCAL-DICT-CREATE](local-logic/LOCAL-DICT-CREATE.md)、[LOCAL-DICT-ENABLE](local-logic/LOCAL-DICT-ENABLE.md)、[LOCAL-DICT-DISABLE](local-logic/LOCAL-DICT-DISABLE.md)、[LOCAL-TENANT-GRANT](local-logic/LOCAL-TENANT-GRANT.md)

任务：

测试：CHECK-129, CHECK-130, CHECK-131, CHECK-137

<a id="FIELD-DEFINITION-ID"></a>

## FIELD-DEFINITION-ID 自定义字段稳定标识

单功能页面／局部明确关联：

- [保存接口车系及通用取数字段配置 · FUNC\-029](features/FUNC-029.md)
- [删除自定义字段并保留通话快照 · FUNC\-032](features/FUNC-032.md)

共享页面／局部／任务上下文（不等于字段专属归属）：

- [逻辑删除业务分类 · FUNC\-033](features/FUNC-033.md)

业务对象：`字段定义`

字段：`id`

类型：string

格式/枚举/单位/精度：字段独立且稳定的标识，区别于业务主键、接口条目ID和候选编码。

允许 null：False

必填条件：字段首次保存成功后及被分类/依赖引用或删除核对时必需。

### 默认与初始化

模式：none；值：`null`

没有独立业务默认值；创建前不造值，编辑保留当前有效值，不用空默认覆盖既有数据。

### 校验与关联约束

- 创建字段保存成功后稳定，引用按ID而非名称。
- 不能通过复用旧ID绕过已删对象或归档边界。

### 读写权限

可读：
- 具有对应配置/对象查看权限的人员

可写：
- 平台或来源系统按本字段生命周期生成；用户不得直接伪造系统/来源值

### 各状态行为

- 填写或配置：字段独立且稳定的标识，区别于业务主键、接口条目ID和候选编码。；显示和编辑服从权限、来源与动作条件。
- 提交核对：提交时按本字段约束及相关局部分支核对；拒绝时保留当前输入和原有效对象。
- 保存完成/历史：仅在本字段约定的时机写入；已保存历史按当时快照读取，不因新配置回写。

### 来源与计算

来源类型：system

规则：字段独立且稳定的标识，区别于业务主键、接口条目ID和候选编码。

依赖字段：无

### 保存与更新

方式：stored

物理映射：由开发补充

业务保存或更新时机：所属配置保存成功时按稳定对象标识写入；取消或提交核对不通过不修改已存对象。

### 接口映射

由开发依据本字段业务规则补充接口映射，见[开发补充清单](developer-supplement.md)。



### 边界示例

合法：
- 字段f-demo-01（仅合成标识）

非法/拒绝：
- 以显示名称代替稳定ID，或复用已删ID冒充旧对象

### 依据、使用位置与验证

来源：
- memory/business-rules.json#BR-026

来源条目：
- rules:BR-026

局部说明：[LOCAL-FIELD-SAVE](local-logic/LOCAL-FIELD-SAVE.md)、[LOCAL-FIELD-DELETE](local-logic/LOCAL-FIELD-DELETE.md)、[LOCAL-FIELD-ENABLE](local-logic/LOCAL-FIELD-ENABLE.md)、[LOCAL-FIELD-DISABLE](local-logic/LOCAL-FIELD-DISABLE.md)

任务：

测试：CHECK-109, CHECK-110, CHECK-146

<a id="FIELD-DEFINITION-LABEL"></a>

## FIELD-DEFINITION-LABEL 字段名称

单功能页面／局部明确关联：

- [保存接口车系及通用取数字段配置 · FUNC\-029](features/FUNC-029.md)

共享页面／局部／任务上下文（不等于字段专属归属）：

- [删除自定义字段并保留通话快照 · FUNC\-032](features/FUNC-032.md)
- [逻辑删除业务分类 · FUNC\-033](features/FUNC-033.md)

业务对象：`字段定义`

字段：`label`

类型：string

格式/枚举/单位/精度：租户维护的字段展示名称，沿现有字段名称约束。

允许 null：False

必填条件：保存字段定义时按既有字段名称约束必需；本次不重定义其他字段的长度。

### 默认与初始化

模式：none；值：`null`

没有独立业务默认值；创建前不造值，编辑保留当前有效值，不用空默认覆盖既有数据。

### 校验与关联约束

- 名称与字段ID分离，改名不重写旧通话快照。
- 本版不改变既有普通字段名称长度/重名约束。

### 读写权限

可读：
- 具有对应配置/对象查看权限的人员

可写：
- 对应维护权限的超级管理员或本租户业务配置管理员

### 各状态行为

- 填写或配置：租户维护的字段展示名称，沿现有字段名称约束。；显示和编辑服从权限、来源与动作条件。
- 提交核对：提交时按本字段约束及相关局部分支核对；拒绝时保留当前输入和原有效对象。
- 保存完成/历史：仅在本字段约定的时机写入；已保存历史按当时快照读取，不因新配置回写。

### 来源与计算

来源类型：input

规则：由具备权限的操作者通过既有控件明确填写或选择；不擅自从其他字段猜测。

依赖字段：无

### 保存与更新

方式：stored

物理映射：由开发补充

业务保存或更新时机：所属配置保存成功时按稳定对象标识写入；取消或提交核对不通过不修改已存对象。

### 接口映射

由开发依据本字段业务规则补充接口映射，见[开发补充清单](developer-supplement.md)。



### 边界示例

合法：
- 本次意向车系

非法/拒绝：
- 改名时同步改写已存通话的旧字段名称

### 依据、使用位置与验证

来源：
- planning/page-index.json#PAGE-007
- memory/business-rules.json#BR-026

来源条目：
- pages:PAGE-007/fields/0
- rules:BR-026

局部说明：[LOCAL-FIELD-SAVE](local-logic/LOCAL-FIELD-SAVE.md)

任务：

测试：CHECK-109, CHECK-133, CHECK-138

<a id="FIELD-DEFINITION-TYPE"></a>

## FIELD-DEFINITION-TYPE 填写方式

单功能页面／局部明确关联：

- [保存接口车系及通用取数字段配置 · FUNC\-029](features/FUNC-029.md)

共享页面／局部／任务上下文（不等于字段专属归属）：

- [删除自定义字段并保留通话快照 · FUNC\-032](features/FUNC-032.md)
- [逻辑删除业务分类 · FUNC\-033](features/FUNC-033.md)

业务对象：`字段定义`

字段：`type`

类型：string

格式/枚举/单位/精度：沿原文本/单选等填写方式，扩展接口取数；本次意向车系必须接口唯一单选。

允许 null：False

必填条件：字段定义保存时必需；本次意向车系固定接口单选语义。

### 默认与初始化

模式：none；值：`null`

没有独立业务默认值；创建前不造值，编辑保留当前有效值，不用空默认覆盖既有数据。

### 校验与关联约束

- 当前意向车系不改为手工候选或多选。
- 仍存预置定义的类型/选项沿既有保护；未使用可删除不等于任意修改定义。

### 读写权限

可读：
- 具有对应配置/对象查看权限的人员

可写：
- 对应维护权限的超级管理员或本租户业务配置管理员

### 各状态行为

- 填写或配置：沿原文本/单选等填写方式，扩展接口取数；本次意向车系必须接口唯一单选。；显示和编辑服从权限、来源与动作条件。
- 提交核对：提交时按本字段约束及相关局部分支核对；拒绝时保留当前输入和原有效对象。
- 保存完成/历史：仅在本字段约定的时机写入；已保存历史按当时快照读取，不因新配置回写。

### 来源与计算

来源类型：input

规则：由具备权限的操作者通过既有控件明确填写或选择；不擅自从其他字段猜测。

依赖字段：无

### 保存与更新

方式：stored

物理映射：由开发补充

业务保存或更新时机：所属配置保存成功时按稳定对象标识写入；取消或提交核对不通过不修改已存对象。

### 接口映射

由开发依据本字段业务规则补充接口映射，见[开发补充清单](developer-supplement.md)。



### 边界示例

合法：
- 接口取数且车系唯一单选

非法/拒绝：
- 将本次车系改成手工多选候选

### 依据、使用位置与验证

来源：
- memory/normalized-user-stories.json#AC-143
- planning/page-index.json#PAGE-007
- memory/business-rules.json#BR-026

来源条目：
- acceptance:AC-143
- pages:PAGE-007/fields/0
- rules:BR-026

局部说明：[LOCAL-FIELD-SAVE](local-logic/LOCAL-FIELD-SAVE.md)

任务：

测试：CHECK-109, CHECK-112, CHECK-146

<a id="FIELD-DICTIONARY-REF"></a>

## FIELD-DICTIONARY-REF 字段取数接口引用

单功能页面／局部明确关联：

- [保存接口车系及通用取数字段配置 · FUNC\-029](features/FUNC-029.md)
- [查询单选接口车系并保存本次意向信息 · FUNC\-030](features/FUNC-030.md)

共享页面／局部／任务上下文（不等于字段专属归属）：

- [删除自定义字段并保留通话快照 · FUNC\-032](features/FUNC-032.md)
- [逻辑删除业务分类 · FUNC\-033](features/FUNC-033.md)

业务对象：`字段定义`

字段：`dictionaryRef`

类型：string

格式/枚举/单位/精度：按可读名称选择并保存接口条目稳定引用；本次车系绑定Mapping来源。

允许 null：True

必填条件：字段为接口取数且新增/换绑时必需；普通文本不适用，既有撤权引用保留供修复。

### 默认与初始化

模式：none；值：`null`

没有独立业务默认值；创建前不造值，编辑保留当前有效值，不用空默认覆盖既有数据。

### 校验与关联约束

- 新增引用只接受当前租户已授权且启用的条目。
- 撤权/停用保留原引用供修复，不能静默换绑；本次车系无上游。

### 读写权限

可读：
- 具有对应配置/对象查看权限的人员

可写：
- 对应维护权限的超级管理员或本租户业务配置管理员

### 各状态行为

- 填写或配置：按可读名称选择并保存接口条目稳定引用；本次车系绑定Mapping来源。；显示和编辑服从权限、来源与动作条件。
- 提交核对：提交时按本字段约束及相关局部分支核对；拒绝时保留当前输入和原有效对象。
- 保存完成/历史：仅在本字段约定的时机写入；已保存历史按当时快照读取，不因新配置回写。

### 来源与计算

来源类型：input

规则：由具备权限的操作者通过既有控件明确填写或选择；不擅自从其他字段猜测。

依赖字段：无

### 保存与更新

方式：stored

物理映射：由开发补充

业务保存或更新时机：所属配置保存成功时按稳定对象标识写入；取消或提交核对不通过不修改已存对象。

### 接口映射

由开发依据本字段业务规则补充接口映射，见[开发补充清单](developer-supplement.md)。



### 边界示例

合法：
- 引用已授权Mapping条目的稳定ID

非法/拒绝：
- 把URL/名称当引用，或新增引用未授权来源

### 依据、使用位置与验证

来源：
- planning/page-index.json#PAGE-007
- memory/business-rules.json#BR-024
- memory/business-rules.json#BR-026

来源条目：
- pages:PAGE-007/fields/1
- pages:PAGE-007/fields/3
- rules:BR-024
- rules:BR-026

局部说明：[LOCAL-FIELD-SAVE](local-logic/LOCAL-FIELD-SAVE.md)、[LOCAL-SERIES-QUERY](local-logic/LOCAL-SERIES-QUERY.md)、[LOCAL-GENERIC-QUERY](local-logic/LOCAL-GENERIC-QUERY.md)

任务：

测试：CHECK-108, CHECK-109, CHECK-110, CHECK-123, CHECK-133

<a id="FIELD-USE-UPSTREAM"></a>

## FIELD-USE-UPSTREAM 是否使用其他字段作为条件

单功能页面／局部明确关联：

- [保存接口车系及通用取数字段配置 · FUNC\-029](features/FUNC-029.md)
- [查询单选接口车系并保存本次意向信息 · FUNC\-030](features/FUNC-030.md)

共享页面／局部／任务上下文（不等于字段专属归属）：

- [删除自定义字段并保留通话快照 · FUNC\-032](features/FUNC-032.md)
- [逻辑删除业务分类 · FUNC\-033](features/FUNC-033.md)

业务对象：`字段查询条件`

字段：`enabled`

类型：boolean

格式/枚举/单位/精度：普通接口字段是否配置一个上游条件；本次意向车系为否。

允许 null：False

必填条件：配置接口取数条件时必须明确是/否；本次意向车系明确为否。

### 默认与初始化

模式：literal；值：`false`

新字段默认不关联；已有配置编辑保原选择，不自动迁移旧预置。

### 校验与关联约束

- 关闭时不要求映射；本次Mapping车系无上游。
- 非接口普通字段不执行接口条件，原门店文本不配车系依赖。

### 读写权限

可读：
- 具有对应配置/对象查看权限的人员

可写：
- 对应维护权限的超级管理员或本租户业务配置管理员

### 各状态行为

- 填写或配置：普通接口字段是否配置一个上游条件；本次意向车系为否。；显示和编辑服从权限、来源与动作条件。
- 提交核对：提交时按本字段约束及相关局部分支核对；拒绝时保留当前输入和原有效对象。
- 保存完成/历史：仅在本字段约定的时机写入；已保存历史按当时快照读取，不因新配置回写。

### 来源与计算

来源类型：input

规则：由具备权限的操作者通过既有控件明确填写或选择；不擅自从其他字段猜测。

依赖字段：无

### 保存与更新

方式：stored

物理映射：由开发补充

业务保存或更新时机：所属配置保存成功时按稳定对象标识写入；取消或提交核对不通过不修改已存对象。

### 接口映射

由开发依据本字段业务规则补充接口映射，见[开发补充清单](developer-supplement.md)。



### 边界示例

合法：
- 否：当前车系独立查询；是：普通接口按声明映射

非法/拒绝：
- 给原门店文本强加车系依赖

### 依据、使用位置与验证

来源：
- planning/page-index.json#PAGE-007
- memory/business-rules.json#BR-035

来源条目：
- pages:PAGE-007/fields/4
- rules:BR-035

局部说明：[LOCAL-FIELD-SAVE](local-logic/LOCAL-FIELD-SAVE.md)、[LOCAL-GENERIC-QUERY](local-logic/LOCAL-GENERIC-QUERY.md)

任务：

测试：CHECK-110, CHECK-124, CHECK-125

<a id="FIELD-UPSTREAM-ID"></a>

## FIELD-UPSTREAM-ID 上游字段

单功能页面／局部明确关联：

- [保存接口车系及通用取数字段配置 · FUNC\-029](features/FUNC-029.md)
- [查询单选接口车系并保存本次意向信息 · FUNC\-030](features/FUNC-030.md)

共享页面／局部／任务上下文（不等于字段专属归属）：

- [删除自定义字段并保留通话快照 · FUNC\-032](features/FUNC-032.md)
- [逻辑删除业务分类 · FUNC\-033](features/FUNC-033.md)

业务对象：`字段查询条件`

字段：`upstreamField`

类型：string

格式/枚举/单位/精度：一个现有接口字段的稳定ID；无多上游聚合。

允许 null：True

必填条件：条件开启时必须指定一个存在且合法的上游定义；条件关闭时不要求。

### 默认与初始化

模式：none；值：`null`

没有独立业务默认值；创建前不造值，编辑保留当前有效值，不用空默认覆盖既有数据。

### 校验与关联约束

- 条件开启时选择一项且定义存在。
- 排除自身及循环；支持合法A→B→C。
- 可选依赖允许上游未加入当前分类，必需依赖要求加入且显示。

### 读写权限

可读：
- 具有对应配置/对象查看权限的人员

可写：
- 对应维护权限的超级管理员或本租户业务配置管理员

### 各状态行为

- 填写或配置：一个现有接口字段的稳定ID；无多上游聚合。；显示和编辑服从权限、来源与动作条件。
- 提交核对：提交时按本字段约束及相关局部分支核对；拒绝时保留当前输入和原有效对象。
- 保存完成/历史：仅在本字段约定的时机写入；已保存历史按当时快照读取，不因新配置回写。

### 来源与计算

来源类型：input

规则：由具备权限的操作者通过既有控件明确填写或选择；不擅自从其他字段猜测。

依赖字段：无

### 保存与更新

方式：stored

物理映射：由开发补充

业务保存或更新时机：所属配置保存成功时按稳定对象标识写入；取消或提交核对不通过不修改已存对象。

### 接口映射

由开发依据本字段业务规则补充接口映射，见[开发补充清单](developer-supplement.md)。



### 边界示例

合法：
- 从现有定义选择上游字段A

非法/拒绝：
- 选自身、循环链或不存在的字段定义

### 依据、使用位置与验证

来源：
- planning/page-index.json#PAGE-007
- memory/business-rules.json#BR-035

来源条目：
- pages:PAGE-007/fields/5
- rules:BR-035

局部说明：[LOCAL-FIELD-SAVE](local-logic/LOCAL-FIELD-SAVE.md)、[LOCAL-GENERIC-QUERY](local-logic/LOCAL-GENERIC-QUERY.md)

任务：

测试：CHECK-110, CHECK-111, CHECK-124, CHECK-125, CHECK-134

<a id="FIELD-UPSTREAM-PROPERTY"></a>

## FIELD-UPSTREAM-PROPERTY 上游取值属性

单功能页面／局部明确关联：

- [保存接口车系及通用取数字段配置 · FUNC\-029](features/FUNC-029.md)
- [查询单选接口车系并保存本次意向信息 · FUNC\-030](features/FUNC-030.md)

共享页面／局部／任务上下文（不等于字段专属归属）：

- [删除自定义字段并保留通话快照 · FUNC\-032](features/FUNC-032.md)
- [逻辑删除业务分类 · FUNC\-033](features/FUNC-033.md)

业务对象：`字段查询条件`

字段：`sourceProperty`

类型：string

格式/枚举/单位/精度：从上游已选记录的声明返回属性中选择，例如编码code。

允许 null：True

必填条件：条件开启时必须选中声明的上游返回属性，查询可选不等于定义可缺。

### 默认与初始化

模式：none；值：`null`

没有独立业务默认值；创建前不造值，编辑保留当前有效值，不用空默认覆盖既有数据。

### 校验与关联约束

- 开启映射时必须来自能力声明属性。
- 校验值类型/编码域与目标参数兼容，缺属性或已填无效不能当空。

### 读写权限

可读：
- 具有对应配置/对象查看权限的人员

可写：
- 对应维护权限的超级管理员或本租户业务配置管理员

### 各状态行为

- 填写或配置：从上游已选记录的声明返回属性中选择，例如编码code。；显示和编辑服从权限、来源与动作条件。
- 提交核对：提交时按本字段约束及相关局部分支核对；拒绝时保留当前输入和原有效对象。
- 保存完成/历史：仅在本字段约定的时机写入；已保存历史按当时快照读取，不因新配置回写。

### 来源与计算

来源类型：input

规则：由具备权限的操作者通过既有控件明确填写或选择；不擅自从其他字段猜测。

依赖字段：无

### 保存与更新

方式：stored

物理映射：由开发补充

业务保存或更新时机：所属配置保存成功时按稳定对象标识写入；取消或提交核对不通过不修改已存对象。

### 接口映射

由开发依据本字段业务规则补充接口映射，见[开发补充清单](developer-supplement.md)。



### 边界示例

合法：
- 在已声明返回属性中选择code

非法/拒绝：
- 任意猜测未声明属性，或把缺属性当可选无值

### 依据、使用位置与验证

来源：
- planning/page-index.json#PAGE-007
- memory/business-rules.json#BR-030

来源条目：
- pages:PAGE-007/fields/6
- rules:BR-030

局部说明：[LOCAL-FIELD-SAVE](local-logic/LOCAL-FIELD-SAVE.md)、[LOCAL-GENERIC-QUERY](local-logic/LOCAL-GENERIC-QUERY.md)

任务：

测试：CHECK-110, CHECK-124, CHECK-125, CHECK-134

<a id="FIELD-DOWNSTREAM-PARAM"></a>

## FIELD-DOWNSTREAM-PARAM 下游入参字段名

单功能页面／局部明确关联：

- [保存接口车系及通用取数字段配置 · FUNC\-029](features/FUNC-029.md)
- [查询单选接口车系并保存本次意向信息 · FUNC\-030](features/FUNC-030.md)

共享页面／局部／任务上下文（不等于字段专属归属）：

- [删除自定义字段并保留通话快照 · FUNC\-032](features/FUNC-032.md)
- [逻辑删除业务分类 · FUNC\-033](features/FUNC-033.md)

业务对象：`字段查询条件`

字段：`targetParameter`

类型：string

格式/枚举/单位/精度：将所选上游属性赋给下游能力支持的入参名。

允许 null：True

必填条件：条件开启时必须有下游支持的参数名，条件关闭不要求。

### 默认与初始化

模式：none；值：`null`

没有独立业务默认值；创建前不造值，编辑保留当前有效值，不用空默认覆盖既有数据。

### 校验与关联约束

- 条件开启时必需且符合预置能力支持范围。
- 允许能力带默认名后修改；不支持/类型不符须明确提示，不静默删参放宽。

### 读写权限

可读：
- 具有对应配置/对象查看权限的人员

可写：
- 对应维护权限的超级管理员或本租户业务配置管理员

### 各状态行为

- 填写或配置：将所选上游属性赋给下游能力支持的入参名。；显示和编辑服从权限、来源与动作条件。
- 提交核对：提交时按本字段约束及相关局部分支核对；拒绝时保留当前输入和原有效对象。
- 保存完成/历史：仅在本字段约定的时机写入；已保存历史按当时快照读取，不因新配置回写。

### 来源与计算

来源类型：input

规则：由具备权限的操作者通过既有控件明确填写或选择；不擅自从其他字段猜测。

依赖字段：无

### 保存与更新

方式：stored

物理映射：由开发补充

业务保存或更新时机：所属配置保存成功时按稳定对象标识写入；取消或提交核对不通过不修改已存对象。

### 接口映射

由开发依据本字段业务规则补充接口映射，见[开发补充清单](developer-supplement.md)。



### 边界示例

合法：
- 预置能力确实声明支持的示例参数seriesCode

非法/拒绝：
- 填写未支持参数后静默删掉它扩大查询

### 依据、使用位置与验证

来源：
- planning/page-index.json#PAGE-007
- memory/business-rules.json#BR-030

来源条目：
- pages:PAGE-007/fields/7
- rules:BR-030

局部说明：[LOCAL-FIELD-SAVE](local-logic/LOCAL-FIELD-SAVE.md)、[LOCAL-GENERIC-QUERY](local-logic/LOCAL-GENERIC-QUERY.md)

任务：

测试：CHECK-110, CHECK-124, CHECK-125, CHECK-134

<a id="FIELD-QUERY-REQUIRED"></a>

## FIELD-QUERY-REQUIRED 查询条件是否必需

单功能页面／局部明确关联：

- [保存接口车系及通用取数字段配置 · FUNC\-029](features/FUNC-029.md)
- [查询单选接口车系并保存本次意向信息 · FUNC\-030](features/FUNC-030.md)

共享页面／局部／任务上下文（不等于字段专属归属）：

- [删除自定义字段并保留通话快照 · FUNC\-032](features/FUNC-032.md)
- [逻辑删除业务分类 · FUNC\-033](features/FUNC-033.md)

业务对象：`字段查询条件`

字段：`required`

类型：boolean

格式/枚举/单位/精度：仅表示上游条件能否省略，与客服字段必填不同。

允许 null：False

必填条件：条件开启时必须明确该条件必需或可选，与客服字段必填独立。

### 默认与初始化

模式：derived；值：`null`

由所选预置能力声明给出默认，编辑保留未修改值；提交值必须明确。

### 校验与关联约束

- 开启条件时明确必需或可选。
- 可选只有未加入/隐藏/未填才省参；已填无效仍阻止查询。

### 读写权限

可读：
- 具有对应配置/对象查看权限的人员

可写：
- 对应维护权限的超级管理员或本租户业务配置管理员

### 各状态行为

- 填写或配置：仅表示上游条件能否省略，与客服字段必填不同。；显示和编辑服从权限、来源与动作条件。
- 提交核对：提交时按本字段约束及相关局部分支核对；拒绝时保留当前输入和原有效对象。
- 保存完成/历史：仅在本字段约定的时机写入；已保存历史按当时快照读取，不因新配置回写。

### 来源与计算

来源类型：input

规则：由具备权限的操作者通过既有控件明确填写或选择；不擅自从其他字段猜测。

依赖字段：无

### 保存与更新

方式：stored

物理映射：由开发补充

业务保存或更新时机：所属配置保存成功时按稳定对象标识写入；取消或提交核对不通过不修改已存对象。

### 接口映射

由开发依据本字段业务规则补充接口映射，见[开发补充清单](developer-supplement.md)。



### 边界示例

合法：
- 可选且未填上游时省参；必需缺值时停止

非法/拒绝：
- 可选但已填无效仍冒充缺失来放宽结果

### 依据、使用位置与验证

来源：
- planning/page-index.json#PAGE-007
- memory/business-rules.json#BR-030
- memory/business-rules.json#BR-035

来源条目：
- pages:PAGE-007/fields/8
- rules:BR-030
- rules:BR-035

局部说明：[LOCAL-FIELD-SAVE](local-logic/LOCAL-FIELD-SAVE.md)、[LOCAL-GENERIC-QUERY](local-logic/LOCAL-GENERIC-QUERY.md)

任务：

测试：CHECK-111, CHECK-124, CHECK-125, CHECK-134

<a id="FIELD-DEPENDENCY-SUMMARY"></a>

## FIELD-DEPENDENCY-SUMMARY 上游依赖展示

单功能页面／局部明确关联：

- [保存接口车系及通用取数字段配置 · FUNC\-029](features/FUNC-029.md)

共享页面／局部／任务上下文（不等于字段专属归属）：

- [删除自定义字段并保留通话快照 · FUNC\-032](features/FUNC-032.md)
- [逻辑删除业务分类 · FUNC\-033](features/FUNC-033.md)

业务对象：`字段查询条件`

字段：`displaySummary`

类型：string

格式/枚举/单位/精度：字段列表显示无、必需·上游名或可选·上游名。

允许 null：False

必填条件：字段列表展示时从当前定义计算，无上游时显示无，不要求用户填写。

### 默认与初始化

模式：none；值：`null`

没有独立业务默认值；创建前不造值，编辑保留当前有效值，不用空默认覆盖既有数据。

### 校验与关联约束

- 由当前定义及条件生成，不以展示文本当字段ID保存。

### 读写权限

可读：
- 具有对应配置/对象查看权限的人员

可写：
- 平台或来源系统按本字段生命周期生成；用户不得直接伪造系统/来源值

### 各状态行为

- 填写或配置：字段列表显示无、必需·上游名或可选·上游名。；显示和编辑服从权限、来源与动作条件。
- 提交核对：提交时按本字段约束及相关局部分支核对；拒绝时保留当前输入和原有效对象。
- 保存完成/历史：仅在本字段约定的时机写入；已保存历史按当时快照读取，不因新配置回写。

### 来源与计算

来源类型：calculated

规则：字段列表显示无、必需·上游名或可选·上游名。

依赖字段：[FIELD-USE-UPSTREAM](field-specs.md#FIELD-USE-UPSTREAM)、[FIELD-UPSTREAM-ID](field-specs.md#FIELD-UPSTREAM-ID)、[FIELD-QUERY-REQUIRED](field-specs.md#FIELD-QUERY-REQUIRED)

### 保存与更新

方式：transient

物理映射：由开发补充

业务保存或更新时机：字段列表按当前配置渲染时计算；不独立保存为业务事实。

### 接口映射

由开发依据本字段业务规则补充接口映射，见[开发补充清单](developer-supplement.md)。



### 边界示例

合法：
- 无；必需·上游字段A；可选·上游字段A

非法/拒绝：
- 把展示名称当字段ID，或在未声明上游时显示虚假绑定

### 依据、使用位置与验证

来源：
- planning/page-index.json#PAGE-007

来源条目：
- pages:PAGE-007/fields/10

局部说明：[LOCAL-FIELD-SAVE](local-logic/LOCAL-FIELD-SAVE.md)

任务：

测试：CHECK-110, CHECK-111, CHECK-124

<a id="FIELD-DEFINITION"></a>

## FIELD-DEFINITION 字段定义整体

单功能页面／局部明确关联：

- [保存接口车系及通用取数字段配置 · FUNC\-029](features/FUNC-029.md)
- [查询单选接口车系并保存本次意向信息 · FUNC\-030](features/FUNC-030.md)
- [删除未使用取数接口字典条目 · FUNC\-031](features/FUNC-031.md)
- [删除自定义字段并保留通话快照 · FUNC\-032](features/FUNC-032.md)
- [逻辑删除业务分类 · FUNC\-033](features/FUNC-033.md)

共享页面／局部／任务上下文（不等于字段专属归属）：

- [新增业务数据接口条目 · FUNC\-023](features/FUNC-023.md)
- [编辑取数接口条目 · FUNC\-024](features/FUNC-024.md)
- [启用业务数据接口条目 · FUNC\-025](features/FUNC-025.md)
- [停用业务数据接口条目 · FUNC\-026](features/FUNC-026.md)
- [开放接口条目的租户使用范围 · FUNC\-027](features/FUNC-027.md)
- [撤销接口条目的租户使用授权 · FUNC\-028](features/FUNC-028.md)

业务对象：`字段库`

字段：`definition`

类型：object

格式/枚举/单位/精度：既有字段定义及其普通属性、选项、接口来源、条件的逻辑整体，不规定生产JSON或数据库列。

允许 null：False

必填条件：保存字段、分类引用、本通捕获及归档时需要可可靠解释的对应定义。

### 默认与初始化

模式：none；值：`null`

没有独立业务默认值；创建前不造值，编辑保留当前有效值，不用空默认覆盖既有数据。

### 校验与关联约束

- 普通字段、预置类型/选项沿原机制。
- 接口配置校验完整，无环且类型兼容；字段独立入库，分类另存才用于新业务。
- 归档保留必要定义，与live修改隔离。

### 读写权限

可读：
- 具有对应配置/对象查看权限的人员

可写：
- 平台或来源系统按本字段生命周期生成；用户不得直接伪造系统/来源值

### 各状态行为

- 填写或配置：既有字段定义及其普通属性、选项、接口来源、条件的逻辑整体，不规定生产JSON或数据库列。；显示和编辑服从权限、来源与动作条件。
- 提交核对：提交时按本字段约束及相关局部分支核对；拒绝时保留当前输入和原有效对象。
- 保存完成/历史：仅在本字段约定的时机写入；已保存历史按当时快照读取，不因新配置回写。

### 来源与计算

来源类型：system

规则：既有字段定义及其普通属性、选项、接口来源、条件的逻辑整体，不规定生产JSON或数据库列。

依赖字段：[FIELD-DEFINITION-ID](field-specs.md#FIELD-DEFINITION-ID)、[FIELD-DEFINITION-LABEL](field-specs.md#FIELD-DEFINITION-LABEL)、[FIELD-DEFINITION-TYPE](field-specs.md#FIELD-DEFINITION-TYPE)、[FIELD-DICTIONARY-REF](field-specs.md#FIELD-DICTIONARY-REF)、[FIELD-USE-UPSTREAM](field-specs.md#FIELD-USE-UPSTREAM)、[FIELD-UPSTREAM-ID](field-specs.md#FIELD-UPSTREAM-ID)、[FIELD-UPSTREAM-PROPERTY](field-specs.md#FIELD-UPSTREAM-PROPERTY)、[FIELD-DOWNSTREAM-PARAM](field-specs.md#FIELD-DOWNSTREAM-PARAM)、[FIELD-QUERY-REQUIRED](field-specs.md#FIELD-QUERY-REQUIRED)

### 保存与更新

方式：stored

物理映射：由开发补充

业务保存或更新时机：所属配置保存成功时按稳定对象标识写入；取消或提交核对不通过不修改已存对象。

### 接口映射

由开发依据本字段业务规则补充接口映射，见[开发补充清单](developer-supplement.md)。



### 边界示例

合法：
- 普通文本定义与合法单上游接口定义分别保存

非法/拒绝：
- 把另一租户字段或当前live修改覆盖归档定义

### 依据、使用位置与验证

来源：
- planning/page-index.json#PAGE-007
- memory/business-rules.json#BR-026
- memory/business-rules.json#BR-035

来源条目：
- pages:PAGE-007/fields/2
- rules:BR-026
- rules:BR-035

局部说明：[LOCAL-FIELD-SAVE](local-logic/LOCAL-FIELD-SAVE.md)、[LOCAL-CLASS-FIELDS-SAVE](local-logic/LOCAL-CLASS-FIELDS-SAVE.md)、[LOCAL-CALL-FORM](local-logic/LOCAL-CALL-FORM.md)、[LOCAL-GENERIC-QUERY](local-logic/LOCAL-GENERIC-QUERY.md)、[LOCAL-DICT-DELETE](local-logic/LOCAL-DICT-DELETE.md)、[LOCAL-FIELD-DELETE](local-logic/LOCAL-FIELD-DELETE.md)、[LOCAL-CATEGORY-RETIRE](local-logic/LOCAL-CATEGORY-RETIRE.md)、[LOCAL-FIELD-ENABLE](local-logic/LOCAL-FIELD-ENABLE.md)、[LOCAL-FIELD-DISABLE](local-logic/LOCAL-FIELD-DISABLE.md)

任务：

测试：CHECK-109, CHECK-110, CHECK-111, CHECK-133, CHECK-146, CHECK-148

<a id="FIELD-CLASS-REQUIRED"></a>

## FIELD-CLASS-REQUIRED 分类字段是否必填

单功能页面／局部明确关联：

- [保存接口车系及通用取数字段配置 · FUNC\-029](features/FUNC-029.md)

共享页面／局部／任务上下文（不等于字段专属归属）：

- [删除自定义字段并保留通话快照 · FUNC\-032](features/FUNC-032.md)
- [逻辑删除业务分类 · FUNC\-033](features/FUNC-033.md)

业务对象：`分类字段引用`

字段：`required`

类型：boolean

格式/枚举/单位/精度：每个分类对各显示字段独立设置客服是否必须填写。

允许 null：False

必填条件：分类每个字段引用保存时有明确必填勾选；只在本通应校验且字段显示时要求用户补值。

### 默认与初始化

模式：derived；值：`null`

沿当前分类已显示的明确勾选；新加入项沿原分类控件初始化，不因接口来源隐式升级为必填。

### 校验与关联约束

- 车系与原门店文本分别设置，不因接口来源统一必填。
- 本通实际显示且原保存条件需要校验时生效；其他字段不被自动改必填。

### 读写权限

可读：
- 具有对应配置/对象查看权限的人员

可写：
- 对应维护权限的超级管理员或本租户业务配置管理员

### 各状态行为

- 填写或配置：每个分类对各显示字段独立设置客服是否必须填写。；显示和编辑服从权限、来源与动作条件。
- 提交核对：提交时按本字段约束及相关局部分支核对；拒绝时保留当前输入和原有效对象。
- 保存完成/历史：仅在本字段约定的时机写入；已保存历史按当时快照读取，不因新配置回写。

### 来源与计算

来源类型：input

规则：由具备权限的操作者通过既有控件明确填写或选择；不擅自从其他字段猜测。

依赖字段：无

### 保存与更新

方式：stored

物理映射：由开发补充

业务保存或更新时机：所属配置保存成功时按稳定对象标识写入；取消或提交核对不通过不修改已存对象。

### 接口映射

由开发依据本字段业务规则补充接口映射，见[开发补充清单](developer-supplement.md)。



### 边界示例

合法：
- 车系必填、原门店文本选填，或按分类反向设置

非法/拒绝：
- 因接口来源将两者统一强制必填

### 依据、使用位置与验证

来源：
- planning/page-index.json#PAGE-007
- memory/business-rules.json#BR-027

来源条目：
- pages:PAGE-007/fields/9
- rules:BR-027

局部说明：[LOCAL-CLASS-FIELDS-SAVE](local-logic/LOCAL-CLASS-FIELDS-SAVE.md)

任务：

测试：CHECK-120, CHECK-121, CHECK-132, CHECK-133

<a id="FIELD-CLASS-VISIBLE"></a>

## FIELD-CLASS-VISIBLE 分类字段是否显示

单功能页面／局部明确关联：

- [保存接口车系及通用取数字段配置 · FUNC\-029](features/FUNC-029.md)

共享页面／局部／任务上下文（不等于字段专属归属）：

- [删除自定义字段并保留通话快照 · FUNC\-032](features/FUNC-032.md)
- [逻辑删除业务分类 · FUNC\-033](features/FUNC-033.md)

业务对象：`分类字段引用`

字段：`visible`

类型：boolean

格式/枚举/单位/精度：该分类是否向客服显示此字段，沿原分类配置。

允许 null：False

必填条件：分类每个字段引用保存时有明确显示勾选，不让隐藏字段产生新增输入阻断。

### 默认与初始化

模式：derived；值：`null`

沿当前分类显示勾选，编辑不擅自改变其他引用；新增项沿既有控件初始化。

### 校验与关联约束

- 隐藏字段不产生新增客服必填阻断。
- 必需上游必须在分类可提供，选填依赖不强制补字段。

### 读写权限

可读：
- 具有对应配置/对象查看权限的人员

可写：
- 对应维护权限的超级管理员或本租户业务配置管理员

### 各状态行为

- 填写或配置：该分类是否向客服显示此字段，沿原分类配置。；显示和编辑服从权限、来源与动作条件。
- 提交核对：提交时按本字段约束及相关局部分支核对；拒绝时保留当前输入和原有效对象。
- 保存完成/历史：仅在本字段约定的时机写入；已保存历史按当时快照读取，不因新配置回写。

### 来源与计算

来源类型：input

规则：由具备权限的操作者通过既有控件明确填写或选择；不擅自从其他字段猜测。

依赖字段：无

### 保存与更新

方式：stored

物理映射：由开发补充

业务保存或更新时机：所属配置保存成功时按稳定对象标识写入；取消或提交核对不通过不修改已存对象。

### 接口映射

由开发依据本字段业务规则补充接口映射，见[开发补充清单](developer-supplement.md)。



### 边界示例

合法：
- 按当前分类勾选显示；隐藏配置仍是实际引用

非法/拒绝：
- 隐藏字段在客服看不到时仍强迫填写

### 依据、使用位置与验证

来源：
- memory/business-rules.json#BR-032
- memory/business-rules.json#BR-035

来源条目：
- rules:BR-032
- rules:BR-035

局部说明：[LOCAL-CLASS-FIELDS-SAVE](local-logic/LOCAL-CLASS-FIELDS-SAVE.md)、[LOCAL-FIELD-DISABLE](local-logic/LOCAL-FIELD-DISABLE.md)

任务：

测试：CHECK-111, CHECK-120, CHECK-133

<a id="FIELD-CLASS-ORDER"></a>

## FIELD-CLASS-ORDER 分类字段顺序

单功能页面／局部明确关联：

- [保存接口车系及通用取数字段配置 · FUNC\-029](features/FUNC-029.md)

共享页面／局部／任务上下文（不等于字段专属归属）：

- [删除自定义字段并保留通话快照 · FUNC\-032](features/FUNC-032.md)
- [逻辑删除业务分类 · FUNC\-033](features/FUNC-033.md)

业务对象：`分类字段引用`

字段：`order`

类型：integer

格式/枚举/单位/精度：分类中显示及填写顺序；使用原上下移/排序机制，不规定物理索引。

允许 null：False

必填条件：分类引用顺序保存时每个引用有确定位置，界面序号从1展示；底层索引由研发映射。

### 默认与初始化

模式：derived；值：`null`

新加入项沿原列表追加位置；移动后按原序列形成新顺序。

### 校验与关联约束

- 同分类引用次序确定，不重复引用相同字段。
- 新顺序只影响后续通话，本通版保原顺序。

### 读写权限

可读：
- 具有对应配置/对象查看权限的人员

可写：
- 对应维护权限的超级管理员或本租户业务配置管理员

### 各状态行为

- 填写或配置：分类中显示及填写顺序；使用原上下移/排序机制，不规定物理索引。；显示和编辑服从权限、来源与动作条件。
- 提交核对：提交时按本字段约束及相关局部分支核对；拒绝时保留当前输入和原有效对象。
- 保存完成/历史：仅在本字段约定的时机写入；已保存历史按当时快照读取，不因新配置回写。

### 来源与计算

来源类型：input

规则：由具备权限的操作者通过既有控件明确填写或选择；不擅自从其他字段猜测。

依赖字段：无

### 保存与更新

方式：stored

物理映射：由开发补充

业务保存或更新时机：所属配置保存成功时按稳定对象标识写入；取消或提交核对不通过不修改已存对象。

### 接口映射

由开发依据本字段业务规则补充接口映射，见[开发补充清单](developer-supplement.md)。



### 边界示例

合法：
- 同分类按车系、门店文本顺序显示

非法/拒绝：
- 同一字段重复引用或后台排序改动直接改变本通版

### 依据、使用位置与验证

来源：
- memory/business-rules.json#BR-026
- memory/business-rules.json#BR-032

来源条目：
- rules:BR-026
- rules:BR-032

局部说明：[LOCAL-CLASS-FIELDS-SAVE](local-logic/LOCAL-CLASS-FIELDS-SAVE.md)

任务：

测试：CHECK-120, CHECK-133

<a id="FIELD-CLASS-FIELD-REFS"></a>

## FIELD-CLASS-FIELD-REFS 分类字段引用集合

单功能页面／局部明确关联：

- [保存接口车系及通用取数字段配置 · FUNC\-029](features/FUNC-029.md)
- [查询单选接口车系并保存本次意向信息 · FUNC\-030](features/FUNC-030.md)
- [删除自定义字段并保留通话快照 · FUNC\-032](features/FUNC-032.md)
- [逻辑删除业务分类 · FUNC\-033](features/FUNC-033.md)

业务对象：`业务分类`

字段：`fieldReferences`

类型：array<object>

格式/枚举/单位/精度：有序引用字段ID及显示、必填，允许清空；不是复制另一份字段定义。

允许 null：False

必填条件：分类保存及本通版捕获时必须是明确的有序集合，允许用户确认后的空集合。

### 默认与初始化

模式：derived；值：`null`

编辑加载当前分类已存集合；用户明确添加、移除或清空后保存，不重投影旧预置。

### 校验与关联约束

- 不强绑定六个统计字段或默认车系；预置也可移除分类引用。
- 校验引用定义和必需依赖闭合；可选不强制加入，不自动补字段。
- 显式空分类引用刷新仍为空。

### 读写权限

可读：
- 具有对应配置/对象查看权限的人员

可写：
- 平台或来源系统按本字段生命周期生成；用户不得直接伪造系统/来源值

### 各状态行为

- 填写或配置：有序引用字段ID及显示、必填，允许清空；不是复制另一份字段定义。；显示和编辑服从权限、来源与动作条件。
- 提交核对：提交时按本字段约束及相关局部分支核对；拒绝时保留当前输入和原有效对象。
- 保存完成/历史：仅在本字段约定的时机写入；已保存历史按当时快照读取，不因新配置回写。

### 来源与计算

来源类型：calculated

规则：有序引用字段ID及显示、必填，允许清空；不是复制另一份字段定义。

依赖字段：[FIELD-DEFINITION-ID](field-specs.md#FIELD-DEFINITION-ID)、[FIELD-CLASS-REQUIRED](field-specs.md#FIELD-CLASS-REQUIRED)、[FIELD-CLASS-VISIBLE](field-specs.md#FIELD-CLASS-VISIBLE)、[FIELD-CLASS-ORDER](field-specs.md#FIELD-CLASS-ORDER)

### 保存与更新

方式：stored

物理映射：由开发补充

业务保存或更新时机：所属配置保存成功时按稳定对象标识写入；取消或提交核对不通过不修改已存对象。

### 接口映射

由开发依据本字段业务规则补充接口映射，见[开发补充清单](developer-supplement.md)。



### 边界示例

合法：
- 明确空引用集合，或两项独立的显示/必填引用

非法/拒绝：
- 缺少必需来源却自动补进分类并改其他必填

### 依据、使用位置与验证

来源：
- planning/page-index.json#PAGE-007
- memory/business-rules.json#BR-026
- memory/business-rules.json#BR-035

来源条目：
- pages:PAGE-007/fields/11
- rules:BR-026
- rules:BR-035

局部说明：[LOCAL-CLASS-FIELDS-SAVE](local-logic/LOCAL-CLASS-FIELDS-SAVE.md)、[LOCAL-CALL-FORM](local-logic/LOCAL-CALL-FORM.md)、[LOCAL-FIELD-DELETE](local-logic/LOCAL-FIELD-DELETE.md)、[LOCAL-CATEGORY-RETIRE](local-logic/LOCAL-CATEGORY-RETIRE.md)、[LOCAL-FIELD-DISABLE](local-logic/LOCAL-FIELD-DISABLE.md)

任务：

测试：CHECK-109, CHECK-111, CHECK-120, CHECK-133, CHECK-146, CHECK-150

<a id="FIELD-CATEGORY-DEFINITION"></a>

## FIELD-CATEGORY-DEFINITION 业务分类识别与配置

单功能页面／局部明确关联：

- [保存接口车系及通用取数字段配置 · FUNC\-029](features/FUNC-029.md)
- [查询单选接口车系并保存本次意向信息 · FUNC\-030](features/FUNC-030.md)
- [逻辑删除业务分类 · FUNC\-033](features/FUNC-033.md)

共享页面／局部／任务上下文（不等于字段专属归属）：

- [删除自定义字段并保留通话快照 · FUNC\-032](features/FUNC-032.md)

业务对象：`业务分类`

字段：`definition`

类型：object

格式/枚举/单位/精度：既有分类稳定标识、当时名称/编码规则、状态和字段引用；保留原分类编辑约束。

允许 null：False

必填条件：配置/删除所针对的分类以及本通目录中实际使用的分类须身份和定义明确；不让客服伪造旧ID。

### 默认与初始化

模式：none；值：`null`

没有独立业务默认值；创建前不造值，编辑保留当前有效值，不用空默认覆盖既有数据。

### 校验与关联约束

- 新业务只使用当前可选分类。
- 已删除分类ID不可用save/启用冒充复活，任意旧ID不表示已有业务资格。
- 分类逻辑删除不级联删除字段、接口或业务数据。

### 读写权限

可读：
- 具有对应配置/对象查看权限的人员

可写：
- 平台或来源系统按本字段生命周期生成；用户不得直接伪造系统/来源值

### 各状态行为

- 填写或配置：既有分类稳定标识、当时名称/编码规则、状态和字段引用；保留原分类编辑约束。；显示和编辑服从权限、来源与动作条件。
- 提交核对：提交时按本字段约束及相关局部分支核对；拒绝时保留当前输入和原有效对象。
- 保存完成/历史：仅在本字段约定的时机写入；已保存历史按当时快照读取，不因新配置回写。

### 来源与计算

来源类型：system

规则：既有分类稳定标识、当时名称/编码规则、状态和字段引用；保留原分类编辑约束。

依赖字段：[FIELD-CLASS-FIELD-REFS](field-specs.md#FIELD-CLASS-FIELD-REFS)

### 保存与更新

方式：stored

物理映射：由开发补充

业务保存或更新时机：所属配置保存成功时按稳定对象标识写入；取消或提交核对不通过不修改已存对象。

### 接口映射

由开发依据本字段业务规则补充接口映射，见[开发补充清单](developer-supplement.md)。



### 边界示例

合法：
- 合法稳定分类及既有名称/编码规则和引用

非法/拒绝：
- 仅凭任意已删分类ID要求作为新业务保存

### 依据、使用位置与验证

来源：
- memory/business-rules.json#BR-042

来源条目：
- rules:BR-042

局部说明：[LOCAL-CLASS-FIELDS-SAVE](local-logic/LOCAL-CLASS-FIELDS-SAVE.md)、[LOCAL-CALL-FORM](local-logic/LOCAL-CALL-FORM.md)、[LOCAL-CATEGORY-RETIRE](local-logic/LOCAL-CATEGORY-RETIRE.md)、[LOCAL-FIELD-DISABLE](local-logic/LOCAL-FIELD-DISABLE.md)

任务：

测试：CHECK-120, CHECK-133, CHECK-147, CHECK-148, CHECK-149, CHECK-150

<a id="FIELD-CATEGORY-ARCHIVE"></a>

## FIELD-CATEGORY-ARCHIVE 已删除分类保留定义

单功能页面／局部明确关联：

- [查询单选接口车系并保存本次意向信息 · FUNC\-030](features/FUNC-030.md)
- [删除未使用取数接口字典条目 · FUNC\-031](features/FUNC-031.md)
- [删除自定义字段并保留通话快照 · FUNC\-032](features/FUNC-032.md)
- [逻辑删除业务分类 · FUNC\-033](features/FUNC-033.md)

共享页面／局部／任务上下文（不等于字段专属归属）：

- [新增业务数据接口条目 · FUNC\-023](features/FUNC-023.md)
- [编辑取数接口条目 · FUNC\-024](features/FUNC-024.md)
- [启用业务数据接口条目 · FUNC\-025](features/FUNC-025.md)
- [停用业务数据接口条目 · FUNC\-026](features/FUNC-026.md)
- [开放接口条目的租户使用范围 · FUNC\-027](features/FUNC-027.md)
- [撤销接口条目的租户使用授权 · FUNC\-028](features/FUNC-028.md)
- [保存接口车系及通用取数字段配置 · FUNC\-029](features/FUNC-029.md)

业务对象：`业务分类归档`

字段：`retainedDefinition`

类型：object

格式/枚举/单位/精度：目标分类当时名称/编码、实际全部refs及必要依赖defs/选项的只读归档。

允许 null：True

必填条件：逻辑删除成功时必须可靠保存目标分类闭包；尚未删除时允许没有归档。

### 默认与初始化

模式：none；值：`null`

没有独立业务默认值；创建前不造值，编辑保留当前有效值，不用空默认覆盖既有数据。

### 校验与关联约束

- 归档与逻辑删除同次成功，无法可靠归档时保留原分类。
- 只保目标引用及必要依赖，不归档整租户无关库存。
- 归档定义独立保留，不阻挡当前字段库删除；取数接口所需来源继续受保护，无恢复/清理/迁移UI。

### 读写权限

可读：
- 具有对应配置/对象查看权限的人员

可写：
- 平台或来源系统按本字段生命周期生成；用户不得直接伪造系统/来源值

### 各状态行为

- 填写或配置：目标分类当时名称/编码、实际全部refs及必要依赖defs/选项的只读归档。；显示和编辑服从权限、来源与动作条件。
- 提交核对：提交时按本字段约束及相关局部分支核对；拒绝时保留当前输入和原有效对象。
- 保存完成/历史：仅在本字段约定的时机写入；已保存历史按当时快照读取，不因新配置回写。

### 来源与计算

来源类型：system

规则：目标分类当时名称/编码、实际全部refs及必要依赖defs/选项的只读归档。

依赖字段：[FIELD-CATEGORY-DEFINITION](field-specs.md#FIELD-CATEGORY-DEFINITION)、[FIELD-CLASS-FIELD-REFS](field-specs.md#FIELD-CLASS-FIELD-REFS)、[FIELD-DEFINITION](field-specs.md#FIELD-DEFINITION)

### 保存与更新

方式：stored

物理映射：由开发补充

业务保存或更新时机：逻辑删除确认成功时与分类退出新业务选择一起保存，后续既有业务和历史只读使用。

### 接口映射

由开发依据本字段业务规则补充接口映射，见[开发补充清单](developer-supplement.md)。



### 边界示例

合法：
- 只保目标分类字段A及依赖B；无关C不归档

非法/拒绝：
- 复制整个租户库存并让无关字段永久被保留引用锁住

### 依据、使用位置与验证

来源：
- memory/business-rules.json#BR-042

来源条目：
- rules:BR-042

局部说明：[LOCAL-CALL-FORM](local-logic/LOCAL-CALL-FORM.md)、[LOCAL-FOLLOWUP-SAVE](local-logic/LOCAL-FOLLOWUP-SAVE.md)、[LOCAL-READ-CALL](local-logic/LOCAL-READ-CALL.md)、[LOCAL-READ-CUSTOMER](local-logic/LOCAL-READ-CUSTOMER.md)、[LOCAL-DICT-DELETE](local-logic/LOCAL-DICT-DELETE.md)、[LOCAL-FIELD-DELETE](local-logic/LOCAL-FIELD-DELETE.md)、[LOCAL-CATEGORY-RETIRE](local-logic/LOCAL-CATEGORY-RETIRE.md)

任务：

测试：CHECK-148, CHECK-149, CHECK-150, CHECK-ARCHIVE-CLOSURE

<a id="FIELD-CALL-CONTEXT"></a>

## FIELD-CALL-CONTEXT 通话及业务对象上下文

单功能页面／局部明确关联：

- [查询单选接口车系并保存本次意向信息 · FUNC\-030](features/FUNC-030.md)
- [删除未使用取数接口字典条目 · FUNC\-031](features/FUNC-031.md)
- [删除自定义字段并保留通话快照 · FUNC\-032](features/FUNC-032.md)
- [逻辑删除业务分类 · FUNC\-033](features/FUNC-033.md)

共享页面／局部／任务上下文（不等于字段专属归属）：

- [新增业务数据接口条目 · FUNC\-023](features/FUNC-023.md)
- [编辑取数接口条目 · FUNC\-024](features/FUNC-024.md)
- [启用业务数据接口条目 · FUNC\-025](features/FUNC-025.md)
- [停用业务数据接口条目 · FUNC\-026](features/FUNC-026.md)
- [开放接口条目的租户使用范围 · FUNC\-027](features/FUNC-027.md)
- [撤销接口条目的租户使用授权 · FUNC\-028](features/FUNC-028.md)
- [保存接口车系及通用取数字段配置 · FUNC\-029](features/FUNC-029.md)

业务对象：`本次业务处理`

字段：`context`

类型：object

格式/枚举/单位/精度：既有账号、租户、企业、客户/具体通话及处理阶段身份；不是仅凭旧分类ID构造的权限。

允许 null：False

必填条件：发起查询、导入带入、正式保存及只读具体业务记录时都需有效授权上下文。

### 默认与初始化

模式：none；值：`null`

没有独立业务默认值；创建前不造值，编辑保留当前有效值，不用空默认覆盖既有数据。

### 校验与关联约束

- 查询、导入带入和保存均核对上下文及编辑版本。
- 归档处理须真实已有任务/名单或有效本通上下文，不凭伪造ID获得旧分类。

### 读写权限

可读：
- 当前通话本人或按原权限可读该具体通话/档案的人员

可写：
- 平台或来源系统按本字段生命周期生成；用户不得直接伪造系统/来源值

### 各状态行为

- 填写或配置：既有账号、租户、企业、客户/具体通话及处理阶段身份；不是仅凭旧分类ID构造的权限。；显示和编辑服从权限、来源与动作条件。
- 提交核对：提交时按本字段约束及相关局部分支核对；拒绝时保留当前输入和原有效对象。
- 保存完成/历史：仅在本字段约定的时机写入；已保存历史按当时快照读取，不因新配置回写。

### 来源与计算

来源类型：system

规则：既有账号、租户、企业、客户/具体通话及处理阶段身份；不是仅凭旧分类ID构造的权限。

依赖字段：无

### 保存与更新

方式：stored

物理映射：由开发补充

业务保存或更新时机：沿原通话/任务机制建立并保留处理身份；本功能不新建一套会话存储。

### 接口映射

由开发依据本字段业务规则补充接口映射，见[开发补充清单](developer-supplement.md)。



### 边界示例

合法：
- 租户甲/本人通话X/实际有权的业务对象

非法/拒绝：
- 跨租户、跨通话，或伪造旧任务ID获得归档资格

### 依据、使用位置与验证

来源：
- planning/page-index.json#PAGE-010
- memory/business-rules.json#BR-032
- memory/business-rules.json#BR-042

来源条目：
- pages:PAGE-010/fields/2
- rules:BR-032
- rules:BR-042

局部说明：[LOCAL-CALL-FORM](local-logic/LOCAL-CALL-FORM.md)、[LOCAL-SERIES-QUERY](local-logic/LOCAL-SERIES-QUERY.md)、[LOCAL-GENERIC-QUERY](local-logic/LOCAL-GENERIC-QUERY.md)、[LOCAL-IMPORT-CONFIRM](local-logic/LOCAL-IMPORT-CONFIRM.md)、[LOCAL-FOLLOWUP-SAVE](local-logic/LOCAL-FOLLOWUP-SAVE.md)、[LOCAL-READ-CALL](local-logic/LOCAL-READ-CALL.md)、[LOCAL-READ-CUSTOMER](local-logic/LOCAL-READ-CUSTOMER.md)、[LOCAL-DICT-DELETE](local-logic/LOCAL-DICT-DELETE.md)、[LOCAL-FIELD-DELETE](local-logic/LOCAL-FIELD-DELETE.md)、[LOCAL-CATEGORY-RETIRE](local-logic/LOCAL-CATEGORY-RETIRE.md)

任务：

测试：CHECK-115, CHECK-133, CHECK-148, CHECK-150, CHECK-AUTH

<a id="FIELD-CALL-VERSION"></a>

## FIELD-CALL-VERSION 本通整版业务表单

单功能页面／局部明确关联：

- [查询单选接口车系并保存本次意向信息 · FUNC\-030](features/FUNC-030.md)

共享页面／局部／任务上下文（不等于字段专属归属）：

- [逻辑删除业务分类 · FUNC\-033](features/FUNC-033.md)

业务对象：`本次业务处理`

字段：`formDefinition`

类型：object

格式/枚举/单位/精度：通话开始时固定分类目录、字段、必填、顺序、选项、依赖和接口绑定，直至话后保存完成。

允许 null：False

必填条件：合法通话开始即形成并保持至话后完成，未选类型也先固定目录；不让后台新配置自动替换。

### 默认与初始化

模式：none；值：`null`

没有独立业务默认值；创建前不造值，编辑保留当前有效值，不用空默认覆盖既有数据。

### 校验与关联约束

- 尚未选类型也先固定可用目录。
- 后台新配置不替换健康本通版，新通话再用新配置。
- 权限与接口启停/授权仍实时校验，缺失/损坏版保稿明示，不自动套最新。

### 读写权限

可读：
- 当前通话本人或按原权限可读该具体通话/档案的人员

可写：
- 平台或来源系统按本字段生命周期生成；用户不得直接伪造系统/来源值

### 各状态行为

- 填写或配置：通话开始时固定分类目录、字段、必填、顺序、选项、依赖和接口绑定，直至话后保存完成。；显示和编辑服从权限、来源与动作条件。
- 提交核对：提交时按本字段约束及相关局部分支核对；拒绝时保留当前输入和原有效对象。
- 保存完成/历史：仅在本字段约定的时机写入；已保存历史按当时快照读取，不因新配置回写。

### 来源与计算

来源类型：system

规则：通话开始时固定分类目录、字段、必填、顺序、选项、依赖和接口绑定，直至话后保存完成。

依赖字段：[FIELD-CATEGORY-DEFINITION](field-specs.md#FIELD-CATEGORY-DEFINITION)、[FIELD-DEFINITION](field-specs.md#FIELD-DEFINITION)、[FIELD-CLASS-FIELD-REFS](field-specs.md#FIELD-CLASS-FIELD-REFS)

### 保存与更新

方式：stored

物理映射：由开发补充

业务保存或更新时机：通话开始建立并在本通至话后完成范围保留；生产持有/恢复实现交研发，不能承诺跨设备。

### 接口映射

由开发依据本字段业务规则补充接口映射，见[开发补充清单](developer-supplement.md)。



### 边界示例

合法：
- 本通固定版A，后台版B仅下一通使用

非法/拒绝：
- 后台加必填后直接替换健康本通版导致收尾阻断

### 依据、使用位置与验证

来源：
- planning/page-index.json#PAGE-008
- memory/business-rules.json#BR-032

来源条目：
- pages:PAGE-008/fields/3
- rules:BR-032

局部说明：[LOCAL-CALL-FORM](local-logic/LOCAL-CALL-FORM.md)、[LOCAL-SERIES-QUERY](local-logic/LOCAL-SERIES-QUERY.md)、[LOCAL-GENERIC-QUERY](local-logic/LOCAL-GENERIC-QUERY.md)、[LOCAL-IMPORT-CONFIRM](local-logic/LOCAL-IMPORT-CONFIRM.md)、[LOCAL-FOLLOWUP-SAVE](local-logic/LOCAL-FOLLOWUP-SAVE.md)

任务：

测试：CHECK-133, CHECK-150, CHECK-CALL-VERSION

<a id="FIELD-OFFICIAL-SERIES-ID"></a>

## FIELD-OFFICIAL-SERIES-ID 官方车系ID

单功能页面／局部明确关联：

- [查询单选接口车系并保存本次意向信息 · FUNC\-030](features/FUNC-030.md)

共享页面／局部／任务上下文（不等于字段专属归属）：

- [逻辑删除业务分类 · FUNC\-033](features/FUNC-033.md)

业务对象：`车系来源记录`

字段：`relation_id`

类型：integer

格式/枚举/单位/精度：接口声明的官方整数ID原值；实际取值范围和精度由联调核对，不猜正负上下限。

允许 null：False

必填条件：完整候选记录及有车系选择的来源快照按API声明具备；未选车系不伪造一条记录。

### 默认与初始化

模式：none；值：`null`

没有独立业务默认值；创建前不造值，编辑保留当前有效值，不用空默认覆盖既有数据。

### 校验与关联约束

- 不与媒体车系ID互换，不以名称生成ID。
- 完整无损保留，上游类型/精度与声明不符应明确报错，不截断猜测。

### 读写权限

可读：
- 当前通话本人或按原权限可读该具体通话/档案的人员

可写：
- 平台或来源系统按本字段生命周期生成；用户不得直接伪造系统/来源值

### 各状态行为

- 当前有效选择：来源有效且当前上下文匹配时保留实际来源；不以显示名称替代编码。
- 正式保存：与当次业务结果同次保存；提交不成功时不形成成功历史。
- 历史查看：按当通保存的值只读展示，后续接口改名、停用和配置变化不回写。

### 来源与计算

来源类型：external

规则：接口声明的官方整数ID原值；实际取值范围和精度由联调核对，不猜正负上下限。

依赖字段：无

### 保存与更新

方式：stored

物理映射：由开发补充

业务保存或更新时机：查询候选不直接成为正式业务；客服选择后保留本通输入，正式保存成功时与该次结果保存来源快照，历史只读。

### 接口映射

由开发依据本字段业务规则补充接口映射，见[开发补充清单](developer-supplement.md)。



### 边界示例

合法：
- 合成官方整数ID 910001

非法/拒绝：
- 以媒体编码或名称推测官方ID，或截断损失精度

### 依据、使用位置与验证

来源：
- interfaces/interface-index.json#API-015

来源条目：
- interfaces:API-015/response_fields/1

局部说明：[LOCAL-SERIES-QUERY](local-logic/LOCAL-SERIES-QUERY.md)

任务：

测试：CHECK-113, CHECK-117, CHECK-138

<a id="FIELD-SERIES-CODE"></a>

## FIELD-SERIES-CODE 本次车系编码

单功能页面／局部明确关联：

- [查询单选接口车系并保存本次意向信息 · FUNC\-030](features/FUNC-030.md)

共享页面／局部／任务上下文（不等于字段专属归属）：

- [逻辑删除业务分类 · FUNC\-033](features/FUNC-033.md)

业务对象：`本次意向车系`

字段：`code`

类型：string

格式/枚举/单位/精度：当前按官方relation_id无损字符串化；编码口径为已接受的实施假定，研发联调核实。

允许 null：False

必填条件：有有效单选车系并正式保存时必须有官方ID字符串编码；选填且无选择时不造值。

### 默认与初始化

模式：none；值：`null`

没有独立业务默认值；创建前不造值，编辑保留当前有效值，不用空默认覆盖既有数据。

### 校验与关联约束

- 与导入编码精确比较，不猜同名或媒体ID。
- 编码作为标识不做数值运算，不能丢精度或擅改语义。

### 读写权限

可读：
- 当前通话本人或按原权限可读该具体通话/档案的人员

可写：
- 平台或来源系统按本字段生命周期生成；用户不得直接伪造系统/来源值

### 各状态行为

- 当前有效选择：来源有效且当前上下文匹配时保留实际来源；不以显示名称替代编码。
- 正式保存：与当次业务结果同次保存；提交不成功时不形成成功历史。
- 历史查看：按当通保存的值只读展示，后续接口改名、停用和配置变化不回写。

### 来源与计算

来源类型：calculated

规则：当前按官方relation_id无损字符串化；编码口径为已接受的实施假定，研发联调核实。

依赖字段：[FIELD-OFFICIAL-SERIES-ID](field-specs.md#FIELD-OFFICIAL-SERIES-ID)

### 保存与更新

方式：stored

物理映射：由开发补充

业务保存或更新时机：查询候选不直接成为正式业务；客服选择后保留本通输入，正式保存成功时与该次结果保存来源快照，历史只读。

### 接口映射

由开发依据本字段业务规则补充接口映射，见[开发补充清单](developer-supplement.md)。



### 边界示例

合法：
- 合成官方ID910001对应字符串910001

非法/拒绝：
- 用媒体ID替代官方编码或按同名猜匹配

### 依据、使用位置与验证

来源：
- memory/business-rules.json#BR-029
- memory/business-rules.json#BR-037

来源条目：
- rules:BR-029
- rules:BR-037

局部说明：[LOCAL-SERIES-QUERY](local-logic/LOCAL-SERIES-QUERY.md)、[LOCAL-IMPORT-CONFIRM](local-logic/LOCAL-IMPORT-CONFIRM.md)

任务：

测试：CHECK-113, CHECK-117, CHECK-138

<a id="FIELD-SERIES-NAME"></a>

## FIELD-SERIES-NAME 车系当时名称

单功能页面／局部明确关联：

- [查询单选接口车系并保存本次意向信息 · FUNC\-030](features/FUNC-030.md)

共享页面／局部／任务上下文（不等于字段专属归属）：

- [逻辑删除业务分类 · FUNC\-033](features/FUNC-033.md)

业务对象：`本次意向车系`

字段：`name`

类型：string

格式/枚举/单位/精度：选择该车系时接口给出的展示名称，编码仍是身份依据。

允许 null：False

必填条件：有车系选择时保存该次名称，名称不作为身份或导入匹配依据。

### 默认与初始化

模式：none；值：`null`

没有独立业务默认值；创建前不造值，编辑保留当前有效值，不用空默认覆盖既有数据。

### 校验与关联约束

- 不能用名称代替编码做导入匹配。
- 保存后名称快照不随来源后来改名回写。

### 读写权限

可读：
- 当前通话本人或按原权限可读该具体通话/档案的人员

可写：
- 平台或来源系统按本字段生命周期生成；用户不得直接伪造系统/来源值

### 各状态行为

- 当前有效选择：来源有效且当前上下文匹配时保留实际来源；不以显示名称替代编码。
- 正式保存：与当次业务结果同次保存；提交不成功时不形成成功历史。
- 历史查看：按当通保存的值只读展示，后续接口改名、停用和配置变化不回写。

### 来源与计算

来源类型：external

规则：选择该车系时接口给出的展示名称，编码仍是身份依据。

依赖字段：无

### 保存与更新

方式：stored

物理映射：由开发补充

业务保存或更新时机：查询候选不直接成为正式业务；客服选择后保留本通输入，正式保存成功时与该次结果保存来源快照，历史只读。

### 接口映射

由开发依据本字段业务规则补充接口映射，见[开发补充清单](developer-supplement.md)。



### 边界示例

合法：
- 车系示例甲：选择和保存时名称

非法/拒绝：
- 查看历史时改成今天上游返回的名称

### 依据、使用位置与验证

来源：
- interfaces/interface-index.json#API-015

来源条目：
- interfaces:API-015/response_fields/0

局部说明：[LOCAL-SERIES-QUERY](local-logic/LOCAL-SERIES-QUERY.md)

任务：

测试：CHECK-117, CHECK-138

<a id="FIELD-SERIES-MEDIA-ID"></a>

## FIELD-SERIES-MEDIA-ID 媒体车系ID来源快照

单功能页面／局部明确关联：

- [查询单选接口车系并保存本次意向信息 · FUNC\-030](features/FUNC-030.md)

共享页面／局部／任务上下文（不等于字段专属归属）：

- [逻辑删除业务分类 · FUNC\-033](features/FUNC-033.md)

业务对象：`车系来源记录`

字段：`media_car_series_id`

类型：string

格式/枚举/单位/精度：接口媒体车系字符串ID，独立于官方编码，仅保存来源，不新增客服输入。

允许 null：False

必填条件：按当前接口声明保存已选记录的媒体ID；不要求客服补填，联调发现契约差异须核对。

### 默认与初始化

模式：none；值：`null`

没有独立业务默认值；创建前不造值，编辑保留当前有效值，不用空默认覆盖既有数据。

### 校验与关联约束

- 按当前声明保存实际返回，不补造。
- 不能用它替代官方code或当作门店编码。

### 读写权限

可读：
- 当前通话本人或按原权限可读该具体通话/档案的人员

可写：
- 平台或来源系统按本字段生命周期生成；用户不得直接伪造系统/来源值

### 各状态行为

- 当前有效选择：来源有效且当前上下文匹配时保留实际来源；不以显示名称替代编码。
- 正式保存：与当次业务结果同次保存；提交不成功时不形成成功历史。
- 历史查看：按当通保存的值只读展示，后续接口改名、停用和配置变化不回写。

### 来源与计算

来源类型：external

规则：接口媒体车系字符串ID，独立于官方编码，仅保存来源，不新增客服输入。

依赖字段：无

### 保存与更新

方式：stored

物理映射：由开发补充

业务保存或更新时机：查询候选不直接成为正式业务；客服选择后保留本通输入，正式保存成功时与该次结果保存来源快照，历史只读。

### 接口映射

由开发依据本字段业务规则补充接口映射，见[开发补充清单](developer-supplement.md)。



### 边界示例

合法：
- 媒体示例ID media-demo-01

非法/拒绝：
- 将媒体ID当官方code或门店编码

### 依据、使用位置与验证

来源：
- interfaces/interface-index.json#API-015

来源条目：
- interfaces:API-015/response_fields/3

局部说明：[LOCAL-SERIES-QUERY](local-logic/LOCAL-SERIES-QUERY.md)

任务：

测试：CHECK-113, CHECK-117, CHECK-138

<a id="FIELD-SERIES-SOURCE-STATE"></a>

## FIELD-SERIES-SOURCE-STATE 车系状态原值快照

单功能页面／局部明确关联：

- [查询单选接口车系并保存本次意向信息 · FUNC\-030](features/FUNC-030.md)

共享页面／局部／任务上下文（不等于字段专属归属）：

- [逻辑删除业务分类 · FUNC\-033](features/FUNC-033.md)

业务对象：`车系来源记录`

字段：`car_state`

类型：integer

格式/枚举/单位/精度：接口原状态整数；业务枚举含义尚未说明，不猜NEV/ICE或营业状态。

允许 null：False

必填条件：按当前声明保存已选记录状态原值，包括合法0；不要求客服解释枚举。

### 默认与初始化

模式：none；值：`null`

没有独立业务默认值；创建前不造值，编辑保留当前有效值，不用空默认覆盖既有数据。

### 校验与关联约束

- 保留合法零值，不用真假值判断成空。
- 不凭原状态推导未提供的业务含义。

### 读写权限

可读：
- 当前通话本人或按原权限可读该具体通话/档案的人员

可写：
- 平台或来源系统按本字段生命周期生成；用户不得直接伪造系统/来源值

### 各状态行为

- 当前有效选择：来源有效且当前上下文匹配时保留实际来源；不以显示名称替代编码。
- 正式保存：与当次业务结果同次保存；提交不成功时不形成成功历史。
- 历史查看：按当通保存的值只读展示，后续接口改名、停用和配置变化不回写。

### 来源与计算

来源类型：external

规则：接口原状态整数；业务枚举含义尚未说明，不猜NEV/ICE或营业状态。

依赖字段：无

### 保存与更新

方式：stored

物理映射：由开发补充

业务保存或更新时机：查询候选不直接成为正式业务；客服选择后保留本通输入，正式保存成功时与该次结果保存来源快照，历史只读。

### 接口映射

由开发依据本字段业务规则补充接口映射，见[开发补充清单](developer-supplement.md)。



### 边界示例

合法：
- 原状态0：仅保存原值、不解释枚举

非法/拒绝：
- 把0当空覆盖成1或据此猜营业状态

### 依据、使用位置与验证

来源：
- interfaces/interface-index.json#API-015

来源条目：
- interfaces:API-015/response_fields/2

局部说明：[LOCAL-SERIES-QUERY](local-logic/LOCAL-SERIES-QUERY.md)

任务：

测试：CHECK-113, CHECK-138

<a id="FIELD-SERIES-SELECTION"></a>

## FIELD-SERIES-SELECTION 本次接口车系单选

单功能页面／局部明确关联：

- [查询单选接口车系并保存本次意向信息 · FUNC\-030](features/FUNC-030.md)

共享页面／局部／任务上下文（不等于字段专属归属）：

- [逻辑删除业务分类 · FUNC\-033](features/FUNC-033.md)

业务对象：`本次业务填写`

字段：`series`

类型：object

格式/枚举/单位/精度：单个确认有效的接口车系，含code/name和官方/媒体/状态来源快照。

允许 null：True

必填条件：本通实际显示且分类将该字段设必填、原保存条件需校验时必须一项有效选择；选填可空，已填无效仍需处理。

### 默认与初始化

模式：none；值：`null`

没有独立业务默认值；创建前不造值，编辑保留当前有效值，不用空默认覆盖既有数据。

### 校验与关联约束

- 唯一单选，只能从完整有效接口候选中选择，不自由创建。
- 来源/上下文/条件无效时可保显示但不作有效值；待重选或来源恢复须重查确认。
- 已有当前有效依据无需每次保存前强制重查，选填可明确清除。

### 读写权限

可读：
- 当前通话本人或按原权限可读该具体通话/档案的人员

可写：
- 平台或来源系统按本字段生命周期生成；用户不得直接伪造系统/来源值

### 各状态行为

- 填写或配置：单个确认有效的接口车系，含code/name和官方/媒体/状态来源快照。；显示和编辑服从权限、来源与动作条件。
- 提交核对：提交时按本字段约束及相关局部分支核对；拒绝时保留当前输入和原有效对象。
- 保存完成/历史：仅在本字段约定的时机写入；已保存历史按当时快照读取，不因新配置回写。

### 来源与计算

来源类型：external

规则：单个确认有效的接口车系，含code/name和官方/媒体/状态来源快照。

依赖字段：[FIELD-SERIES-CODE](field-specs.md#FIELD-SERIES-CODE)、[FIELD-SERIES-NAME](field-specs.md#FIELD-SERIES-NAME)、[FIELD-OFFICIAL-SERIES-ID](field-specs.md#FIELD-OFFICIAL-SERIES-ID)、[FIELD-SERIES-MEDIA-ID](field-specs.md#FIELD-SERIES-MEDIA-ID)、[FIELD-SERIES-SOURCE-STATE](field-specs.md#FIELD-SERIES-SOURCE-STATE)

### 保存与更新

方式：stored

物理映射：由开发补充

业务保存或更新时机：当前选择先在本通编辑中保留；正式保存成功时与同通业务结果写入快照。

### 接口映射

由开发依据本字段业务规则补充接口映射，见[开发补充清单](developer-supplement.md)。



### 边界示例

合法：
- 一项当前有效的合成code/name及来源记录

非法/拒绝：
- 多项车系、自由创建候选或保留失效值当有效提交

### 依据、使用位置与验证

来源：
- planning/page-index.json#PAGE-008
- memory/business-rules.json#BR-033
- memory/business-rules.json#BR-037

来源条目：
- pages:PAGE-008/fields/0
- rules:BR-033
- rules:BR-037

局部说明：[LOCAL-SERIES-QUERY](local-logic/LOCAL-SERIES-QUERY.md)、[LOCAL-GENERIC-QUERY](local-logic/LOCAL-GENERIC-QUERY.md)、[LOCAL-IMPORT-CONFIRM](local-logic/LOCAL-IMPORT-CONFIRM.md)、[LOCAL-FOLLOWUP-SAVE](local-logic/LOCAL-FOLLOWUP-SAVE.md)

任务：

测试：CHECK-112, CHECK-115, CHECK-119, CHECK-132, CHECK-135, CHECK-137, CHECK-138

<a id="FIELD-MAPPING-MEDIA-FILTER"></a>

## FIELD-MAPPING-MEDIA-FILTER Mapping预置媒体范围

单功能页面／局部明确关联：

- [查询单选接口车系并保存本次意向信息 · FUNC\-030](features/FUNC-030.md)

共享页面／局部／任务上下文（不等于字段专属归属）：

- [逻辑删除业务分类 · FUNC\-033](features/FUNC-033.md)

业务对象：`车系查询`

字段：`media_id`

类型：integer

格式/枚举/单位/精度：研发预置查询范围，当前文档默认10，非运营维护参数。

允许 null：False

必填条件：预置Mapping查询按文档默认或明确参数处理；不要求客服填写，省略/空字符串沿文档默认。

### 默认与初始化

模式：literal；值：`10`

沿文档当前默认媒体10作实施假定，研发联调核对；不向客服增加参数输入。

### 校验与关联约束

- 当前本次车系不传品牌/能源附加筛选。
- 范围为实施假定，联调需证明业务覆盖；不得把示例当真实授权。

### 读写权限

可读：
- 当前通话本人或按原权限可读该具体通话/档案的人员

可写：
- 平台或来源系统按本字段生命周期生成；用户不得直接伪造系统/来源值

### 各状态行为

- 填写或配置：研发预置查询范围，当前文档默认10，非运营维护参数。；显示和编辑服从权限、来源与动作条件。
- 提交核对：提交时按本字段约束及相关局部分支核对；拒绝时保留当前输入和原有效对象。
- 保存完成/历史：仅在本字段约定的时机写入；已保存历史按当时快照读取，不因新配置回写。

### 来源与计算

来源类型：system

规则：研发预置查询范围，当前文档默认10，非运营维护参数。

依赖字段：无

### 保存与更新

方式：transient

物理映射：由开发补充

业务保存或更新时机：调用预置车系能力时使用；正式业务只保存实际来源快照，不另存一份用户参数配置。

### 接口映射

由开发依据本字段业务规则补充接口映射，见[开发补充清单](developer-supplement.md)。



### 边界示例

合法：
- 当前媒体10实施假定；由研发联调核对覆盖

非法/拒绝：
- 客服任意填写媒体或隐式增加品牌/能源筛选

### 依据、使用位置与验证

来源：
- interfaces/interface-index.json#API-015

来源条目：
- interfaces:API-015/request_fields/2

局部说明：[LOCAL-SERIES-QUERY](local-logic/LOCAL-SERIES-QUERY.md)

任务：

测试：CHECK-113

<a id="FIELD-MAPPING-STATE-FILTER"></a>

## FIELD-MAPPING-STATE-FILTER Mapping预置状态范围

单功能页面／局部明确关联：

- [查询单选接口车系并保存本次意向信息 · FUNC\-030](features/FUNC-030.md)

共享页面／局部／任务上下文（不等于字段专属归属）：

- [逻辑删除业务分类 · FUNC\-033](features/FUNC-033.md)

业务对象：`车系查询`

字段：`car_state`

类型：integer

格式/枚举/单位/精度：当前文档默认1的预置过滤，含义及范围交联调，不新增客服状态筛选。

允许 null：False

必填条件：预置Mapping查询按文档默认或明确参数处理；显式0不当空，不让客服选择未经声明的状态。

### 默认与初始化

模式：literal；值：`1`

沿文档当前默认状态1作实施假定；显式传入0按0保留，最终范围联调核对。

### 校验与关联约束

- 显式合法0不能被当成未填替换为默认1。
- 返回需符合本次明确请求条件，未知枚举不猜测。

### 读写权限

可读：
- 当前通话本人或按原权限可读该具体通话/档案的人员

可写：
- 平台或来源系统按本字段生命周期生成；用户不得直接伪造系统/来源值

### 各状态行为

- 填写或配置：当前文档默认1的预置过滤，含义及范围交联调，不新增客服状态筛选。；显示和编辑服从权限、来源与动作条件。
- 提交核对：提交时按本字段约束及相关局部分支核对；拒绝时保留当前输入和原有效对象。
- 保存完成/历史：仅在本字段约定的时机写入；已保存历史按当时快照读取，不因新配置回写。

### 来源与计算

来源类型：system

规则：当前文档默认1的预置过滤，含义及范围交联调，不新增客服状态筛选。

依赖字段：无

### 保存与更新

方式：transient

物理映射：由开发补充

业务保存或更新时机：预置能力发起查询时使用；原状态按实际响应保存来源快照。

### 接口映射

由开发依据本字段业务规则补充接口映射，见[开发补充清单](developer-supplement.md)。



### 边界示例

合法：
- 当前状态1实施假定；明确传0时保留0

非法/拒绝：
- 用真假值判断将显式0重置成默认1

### 依据、使用位置与验证

来源：
- interfaces/interface-index.json#API-015

来源条目：
- interfaces:API-015/request_fields/3

局部说明：[LOCAL-SERIES-QUERY](local-logic/LOCAL-SERIES-QUERY.md)

任务：

测试：CHECK-113, CHECK-115

<a id="FIELD-PLANNED-STORE"></a>

## FIELD-PLANNED-STORE 计划到店门店原文本

单功能页面／局部明确关联：

- [查询单选接口车系并保存本次意向信息 · FUNC\-030](features/FUNC-030.md)

共享页面／局部／任务上下文（不等于字段专属归属）：

- [逻辑删除业务分类 · FUNC\-033](features/FUNC-033.md)

业务对象：`本次业务填写`

字段：`plannedStoreName`

类型：string

格式/枚举/单位/精度：沿原普通文本字段由客服自行填写，无车系依赖及门店候选库。

允许 null：True

必填条件：仅本通显示、分类设该普通文本必填且原保存条件需校验时必填；选填可空，长度等沿原字段。

### 默认与初始化

模式：none；值：`null`

没有独立业务默认值；创建前不造值，编辑保留当前有效值，不用空默认覆盖既有数据。

### 校验与关联约束

- 分别沿本通分类配置判断必填，其余文本长度/字符约束复用原字段。
- 车系选择/清空不改文本，导入门店不自动写入。
- 不新增门店编码、NEV/ICE或车系门店匹配校验。

### 读写权限

可读：
- 当前通话本人或按原权限可读该具体通话/档案的人员

可写：
- 客服仅写本人可处理的当前通话输入；平台按确认和保存结果生成系统/来源字段

### 各状态行为

- 填写或配置：沿原普通文本字段由客服自行填写，无车系依赖及门店候选库。；显示和编辑服从权限、来源与动作条件。
- 提交核对：提交时按本字段约束及相关局部分支核对；拒绝时保留当前输入和原有效对象。
- 保存完成/历史：仅在本字段约定的时机写入；已保存历史按当时快照读取，不因新配置回写。

### 来源与计算

来源类型：input

规则：由具备权限的操作者通过既有控件明确填写或选择；不擅自从其他字段猜测。

依赖字段：无

### 保存与更新

方式：stored

物理映射：由开发补充

业务保存或更新时机：沿原每通业务保存机制；通话详情及档案汇总沿普通文本规则，不新增空值清空汇总语义。

### 接口映射

由开发依据本字段业务规则补充接口映射，见[开发补充清单](developer-supplement.md)。



### 边界示例

合法：
- 计划到示例门店：普通文本

非法/拒绝：
- 因换车系清空文本，或以门店对象数组替代原文本

### 依据、使用位置与验证

来源：
- planning/page-index.json#PAGE-008
- planning/page-index.json#PAGE-009
- planning/page-index.json#PAGE-010
- memory/business-rules.json#BR-037

来源条目：
- pages:PAGE-008/fields/1
- pages:PAGE-009/fields/1
- pages:PAGE-010/fields/1
- rules:BR-037

局部说明：[LOCAL-GENERIC-QUERY](local-logic/LOCAL-GENERIC-QUERY.md)、[LOCAL-FOLLOWUP-SAVE](local-logic/LOCAL-FOLLOWUP-SAVE.md)、[LOCAL-READ-CALL](local-logic/LOCAL-READ-CALL.md)、[LOCAL-READ-CUSTOMER](local-logic/LOCAL-READ-CUSTOMER.md)

任务：

测试：CHECK-114, CHECK-120, CHECK-121, CHECK-138

<a id="FIELD-IMPORTED-INTENTION"></a>

## FIELD-IMPORTED-INTENTION 原导入意向信息

单功能页面／局部明确关联：

- [查询单选接口车系并保存本次意向信息 · FUNC\-030](features/FUNC-030.md)

共享页面／局部／任务上下文（不等于字段专属归属）：

- [逻辑删除业务分类 · FUNC\-033](features/FUNC-033.md)

业务对象：`客户原始导入`

字段：`intention`

类型：object

格式/枚举/单位/精度：既有导入的原始车系/门店编码和名称等，只读保留，缺项显示未提供。

允许 null：True

必填条件：只有实际有导入资料时读取；无导入时显示未提供，不向客服增加补原始数据要求。

### 默认与初始化

模式：none；值：`null`

没有独立业务默认值；创建前不造值，编辑保留当前有效值，不用空默认覆盖既有数据。

### 校验与关联约束

- 不覆盖原导入，不按媒体ID或同名猜测带入。
- 仅车系明确确认且精确code匹配后带入本次选择；门店不自动改文本。

### 读写权限

可读：
- 当前通话本人或按原权限可读该具体通话/档案的人员

可写：
- 平台或来源系统按本字段生命周期生成；用户不得直接伪造系统/来源值

### 各状态行为

- 当前有效选择：来源有效且当前上下文匹配时保留实际来源；不以显示名称替代编码。
- 正式保存：与当次业务结果同次保存；提交不成功时不形成成功历史。
- 历史查看：按当通保存的值只读展示，后续接口改名、停用和配置变化不回写。

### 来源与计算

来源类型：external

规则：既有导入的原始车系/门店编码和名称等，只读保留，缺项显示未提供。

依赖字段：无

### 保存与更新

方式：stored

物理映射：由开发补充

业务保存或更新时机：原导入流程保存时写入；本功能仅读取，不在确认带入或本次保存时回写原始信息。

### 接口映射

由开发依据本字段业务规则补充接口映射，见[开发补充清单](developer-supplement.md)。



### 边界示例

合法：
- 原导入编码/名称与门店信息分别只读

非法/拒绝：
- 仅切页签就覆盖当前填写或按同名/媒体ID带入

### 依据、使用位置与验证

来源：
- planning/page-index.json#PAGE-008
- planning/page-index.json#PAGE-009
- memory/business-rules.json#BR-028

来源条目：
- pages:PAGE-008/fields/2
- pages:PAGE-009/fields/2
- rules:BR-028

局部说明：[LOCAL-IMPORT-CONFIRM](local-logic/LOCAL-IMPORT-CONFIRM.md)、[LOCAL-FOLLOWUP-SAVE](local-logic/LOCAL-FOLLOWUP-SAVE.md)、[LOCAL-READ-CALL](local-logic/LOCAL-READ-CALL.md)

任务：

测试：CHECK-114, CHECK-117, CHECK-IMPORT-RACE, CHECK-116

<a id="FIELD-OTHER-BUSINESS-VALUES"></a>

## FIELD-OTHER-BUSINESS-VALUES 其他既有业务字段值

单功能页面／局部明确关联：

- [查询单选接口车系并保存本次意向信息 · FUNC\-030](features/FUNC-030.md)

共享页面／局部／任务上下文（不等于字段专属归属）：

- [逻辑删除业务分类 · FUNC\-033](features/FUNC-033.md)

业务对象：`本次业务填写`

字段：`otherValues`

类型：object

格式/枚举/单位/精度：当前分类中其他普通/接口字段按稳定字段标识保存的值，沿原填写类型和业务语义。

允许 null：True

必填条件：各现有字段按本通显示、原类型及分别必填判断；合法0/false不等于空，已填无效值仍须校验。

### 默认与初始化

模式：none；值：`null`

没有独立业务默认值；创建前不造值，编辑保留当前有效值，不用空默认覆盖既有数据。

### 校验与关联约束

- 保留合法0/false，未知/隐藏非空值不静默丢弃。
- 普通字段沿原校验，启用通用接口字段另核对依赖和有效性。
- 本期不新建原六个统计字段等一套替代模型。

### 读写权限

可读：
- 当前通话本人或按原权限可读该具体通话/档案的人员

可写：
- 客服仅写本人可处理的当前通话输入；平台按确认和保存结果生成系统/来源字段

### 各状态行为

- 填写或配置：当前分类中其他普通/接口字段按稳定字段标识保存的值，沿原填写类型和业务语义。；显示和编辑服从权限、来源与动作条件。
- 提交核对：提交时按本字段约束及相关局部分支核对；拒绝时保留当前输入和原有效对象。
- 保存完成/历史：仅在本字段约定的时机写入；已保存历史按当时快照读取，不因新配置回写。

### 来源与计算

来源类型：input

规则：由具备权限的操作者通过既有控件明确填写或选择；不擅自从其他字段猜测。

依赖字段：无

### 保存与更新

方式：stored

物理映射：由开发补充

业务保存或更新时机：沿原本通编辑与正式保存机制，按本通固定定义校验并写入。

### 接口映射

由开发依据本字段业务规则补充接口映射，见[开发补充清单](developer-supplement.md)。



### 边界示例

合法：
- 原类型允许的0/false与其他实际字段值

非法/拒绝：
- 把合法零值当空丢弃，或将无效值静默过滤后报成功

### 依据、使用位置与验证

来源：
- planning/page-index.json#PAGE-009
- memory/business-rules.json#BR-032

来源条目：
- pages:PAGE-009/fields/3
- rules:BR-032

局部说明：[LOCAL-GENERIC-QUERY](local-logic/LOCAL-GENERIC-QUERY.md)、[LOCAL-FOLLOWUP-SAVE](local-logic/LOCAL-FOLLOWUP-SAVE.md)、[LOCAL-READ-CALL](local-logic/LOCAL-READ-CALL.md)、[LOCAL-READ-CUSTOMER](local-logic/LOCAL-READ-CUSTOMER.md)

任务：

测试：CHECK-119, CHECK-125, CHECK-133, CHECK-138, CHECK-UNCONNECTED

<a id="FIELD-SAVED-BUSINESS-SNAPSHOT"></a>

## FIELD-SAVED-BUSINESS-SNAPSHOT 同通业务字段与来源快照

单功能页面／局部明确关联：

- [查询单选接口车系并保存本次意向信息 · FUNC\-030](features/FUNC-030.md)

共享页面／局部／任务上下文（不等于字段专属归属）：

- [逻辑删除业务分类 · FUNC\-033](features/FUNC-033.md)

业务对象：`已保存业务信息`

字段：`fieldSnapshot`

类型：object

格式/枚举/单位/精度：当通字段标识/当时名称/类型和值、车系来源和本通分类的快照，供详情及档案使用。

允许 null：False

必填条件：仅正式保存成功形成对应业务快照；查看无业务结果时显示空态，不从其他通次造值。

### 默认与初始化

模式：none；值：`null`

没有独立业务默认值；创建前不造值，编辑保留当前有效值，不用空默认覆盖既有数据。

### 校验与关联约束

- 只从同一合法通话/业务上下文正式保存结果读取。
- 后续改名/字段变更/分类删除不污染当时结果。
- 门店文本汇总沿原规则，不新增跨通配对或空文本清空汇总。

### 读写权限

可读：
- 当前通话本人或按原权限可读该具体通话/档案的人员

可写：
- 平台或来源系统按本字段生命周期生成；用户不得直接伪造系统/来源值

### 各状态行为

- 当前有效选择：来源有效且当前上下文匹配时保留实际来源；不以显示名称替代编码。
- 正式保存：与当次业务结果同次保存；提交不成功时不形成成功历史。
- 历史查看：按当通保存的值只读展示，后续接口改名、停用和配置变化不回写。

### 来源与计算

来源类型：system

规则：当通字段标识/当时名称/类型和值、车系来源和本通分类的快照，供详情及档案使用。

依赖字段：[FIELD-CALL-CONTEXT](field-specs.md#FIELD-CALL-CONTEXT)、[FIELD-CALL-VERSION](field-specs.md#FIELD-CALL-VERSION)、[FIELD-SERIES-SELECTION](field-specs.md#FIELD-SERIES-SELECTION)、[FIELD-PLANNED-STORE](field-specs.md#FIELD-PLANNED-STORE)、[FIELD-OTHER-BUSINESS-VALUES](field-specs.md#FIELD-OTHER-BUSINESS-VALUES)

### 保存与更新

方式：stored

物理映射：由开发补充

业务保存或更新时机：原保存并完成成功时与本次结果同次保存；提交异常不生成成功历史，历史只读。

### 接口映射

由开发依据本字段业务规则补充接口映射，见[开发补充清单](developer-supplement.md)。



### 边界示例

合法：
- 通话X当时字段、车系名称及来源快照

非法/拒绝：
- 用通话Y或今天的定义补写通话X，或凭归档库存造历史

### 依据、使用位置与验证

来源：
- planning/page-index.json#PAGE-009
- planning/page-index.json#PAGE-010
- memory/business-rules.json#BR-037
- memory/business-rules.json#BR-042

来源条目：
- pages:PAGE-009/fields/0
- pages:PAGE-010/fields/0
- rules:BR-037
- rules:BR-042

局部说明：[LOCAL-FOLLOWUP-SAVE](local-logic/LOCAL-FOLLOWUP-SAVE.md)、[LOCAL-READ-CALL](local-logic/LOCAL-READ-CALL.md)、[LOCAL-READ-CUSTOMER](local-logic/LOCAL-READ-CUSTOMER.md)

任务：

测试：CHECK-138, CHECK-133, CHECK-148, CHECK-150, CHECK-HISTORY-ISOLATION

<a id="FIELD-DEFINITION-ENABLED"></a>

## FIELD-DEFINITION-ENABLED 字段库启用状态

单功能页面／局部明确关联：

- [保存接口车系及通用取数字段配置 · FUNC\-029](features/FUNC-029.md)

共享页面／局部／任务上下文（不等于字段专属归属）：

- [删除自定义字段并保留通话快照 · FUNC\-032](features/FUNC-032.md)
- [逻辑删除业务分类 · FUNC\-033](features/FUNC-033.md)

业务对象：`可复用字段定义`

字段：`enabled`

类型：boolean

格式/枚举/单位/精度：字段自身的启用/停用状态；不等同于分类是否显示、接口是否启用或租户接口授权。

允许 null：False

必填条件：新增字段保存及明确启停时必须有boolean目标；false是停用，不等于缺值。

### 默认与初始化

模式：literal；值：`true`

沿现有字段新建表单默认启用；编辑保留当前状态，禁止因读取或重新进入自动恢复启用。

### 校验与关联约束

- 预置统计字段、Mapping和普通字段按同一启停入口维护；预置填写类型/选项及Mapping接口单选语义保持。
- 当前启用分类仍显示该字段时拒绝停用，提示先在分类关闭显示；必要依赖及配置完整性沿原规则核对，不自动改分类。
- 停用不解除分类或字段依赖引用，物理删除仍须解除当前引用；启用不授予接口使用资格。
- 保存核对本租户权限、目标版本和当前条件；原字段、其他配置、历史及本通快照不被失败提交改写。

### 读写权限

可读：
- 具备本租户字段配置查看权限的人员

可写：
- 具备本租户业务配置维护权限的管理员

### 各状态行为

- 当前启用：列表显示启用状态及停用操作，满足当前配置约束后可停用。
- 当前停用：列表显示停用状态及启用操作，持久保留定义、类型、选项和来源绑定。
- 本通已捕获：当前通话/话后继续使用开始版中的字段状态；后台启停只改变后续配置，不绕过实时接口授权。

### 来源与计算

来源类型：input

规则：由有权人员明确点击行操作给出true/false；默认沿既有表单，不从分类或字典状态推断。

依赖字段：无

### 保存与更新

方式：stored

物理映射：由开发补充

业务保存或更新时机：首次字段保存或本租户启停提交成功时，与当前字段定义同次保存；提交异常保留原状态，通话快照独立不回写。

### 接口映射

由开发依据本字段业务规则补充接口映射，见[开发补充清单](developer-supplement.md)。



### 边界示例

合法：
- 字段库停用false持久保留，行操作变为启用
- 旧通话保留开始时true定义，之后仍能按该版保存

非法/拒绝：
- 只隐藏预置字段启停按钮或读取时把false改回true
- 把字段停用当作接口撤权或自动解除分类引用

### 依据、使用位置与验证

来源：
- planning/page-index.json#PAGE-007
- memory/business-rules.json#BR-026
- memory/business-rules.json#BR-032

来源条目：
- pages:PAGE-007/actions/0

局部说明：[LOCAL-FIELD-SAVE](local-logic/LOCAL-FIELD-SAVE.md)、[LOCAL-FIELD-ENABLE](local-logic/LOCAL-FIELD-ENABLE.md)、[LOCAL-FIELD-DISABLE](local-logic/LOCAL-FIELD-DISABLE.md)

任务：

测试：CHECK-FIELD-LIFECYCLE, CHECK-133
