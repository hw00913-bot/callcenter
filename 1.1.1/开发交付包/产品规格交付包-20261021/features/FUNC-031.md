# 删除未使用取数接口字典条目 · FUNC\-031

**READY\_FOR\_ENGINEERING\_DESIGN — 产品可交接，工程设计需补齐**

[返回功能目录](README.md) · [返回开发包入口](../README.md)

## 本功能做什么

超级管理员可在“客户管理→业务分类→取数接口字典”第三Tab，对无使用引用的接口条目发起并确认删除；该字典仍为全局维护，租户授权规则不变，非超管不能执行。 使用引用阻止并说明位置，成功仅移除目标且刷新不补回。

来源业务域：未提供；来源业务模块：未提供。

本页是同一份规划的功能阅读视图，仅整理已声明的关联，不增加业务规则，也不代表本功能已通过完整性核验。

## 推荐阅读顺序

1. 看下面的相关页面，确认用户从哪里进入。
2. 阅读局部逻辑，再按需打开字段定义。
3. 对照本功能验收，查看实施任务及其前置依赖。

[全局逻辑](../global-logic.md)和[通用 UI 规范](../ui-spec.md)供核对共同规则；无需每次从头通读。

## 相关页面

- [取数接口字典 · UI\-PAGE\-006](../ui-pages/UI-PAGE-006.md) — 共用页面，另有 6 个功能

## 局部逻辑

- [确认删除未使用接口条目 · LOCAL\-DICT\-DELETE](../local-logic/LOCAL-DICT-DELETE.md)

本局部说明只声明关联当前功能，以下内容直接取自同一份规划。

### 触发与前置条件

触发：超管从第三Tab对指定条目点击删除

- 当前账号、企业/租户/对象和处理阶段有对应权限；输入来自本局部声明的当前对象。
- 沿当前已确认范围执行；不借原型或历史ID扩张权限。

### 处理步骤

1. **LOCAL\-DICT\-DELETE\-STEP\-1**：只读核对实际字段/归档/业务和未完通话来源引用，列具体位置

2. **LOCAL\-DICT\-DELETE\-STEP\-2**：确认后重查权限、目标/配置版本及使用状态，未知时不删除

3. **LOCAL\-DICT\-DELETE\-STEP\-3**：仅移除未用目标，异常不报成功且只回滚自有写入，刷新不补默认

### 分支与异常

- **LOCAL\-DICT\-DELETE\-BRANCH\-1**：当有配置/归档/业务或本通保留来源，阻止物理删除并列租户、字段、记录/通话位置，不级联。

- **LOCAL\-DICT\-DELETE\-BRANCH\-2**：当确认期间新增引用/权限版本变化/读取或写入异常，保留目标与草稿，不覆盖外部新写。

- **LOCAL\-DICT\-DELETE\-BRANCH\-3**：当未用默认条目明确删除，可删除；fresh不生悬空默认引用，停用/撤权/读坏不当删除。

### 完成后的状态

- 仅本次动作的合法结果生效；取消或核对/保存异常保留原对象与输入，不宣称成功。

## 本功能明确关联的字段

这些关系来自已声明的页面／局部说明；字段仍可能被其他功能复用。

- [通话及业务对象上下文 · FIELD\-CALL\-CONTEXT](../field-specs.md#FIELD-CALL-CONTEXT)；依据：[确认删除未使用接口条目 · LOCAL\-DICT\-DELETE](../local-logic/LOCAL-DICT-DELETE.md)

- [取数能力 · FIELD\-CAPABILITY](../field-specs.md#FIELD-CAPABILITY)；依据：[确认删除未使用接口条目 · LOCAL\-DICT\-DELETE](../local-logic/LOCAL-DICT-DELETE.md)

- [已删除分类保留定义 · FIELD\-CATEGORY\-ARCHIVE](../field-specs.md#FIELD-CATEGORY-ARCHIVE)；依据：[确认删除未使用接口条目 · LOCAL\-DICT\-DELETE](../local-logic/LOCAL-DICT-DELETE.md)

- [字段定义整体 · FIELD\-DEFINITION](../field-specs.md#FIELD-DEFINITION)；依据：[确认删除未使用接口条目 · LOCAL\-DICT\-DELETE](../local-logic/LOCAL-DICT-DELETE.md)

- [取数接口条目标识 · FIELD\-DICT\-ID](../field-specs.md#FIELD-DICT-ID)；依据：[确认删除未使用接口条目 · LOCAL\-DICT\-DELETE](../local-logic/LOCAL-DICT-DELETE.md)

## 共用说明中的字段上下文

以下字段来自共用页面、局部说明或任务，用于定位上下文；不等于本功能都需要实现。

- [接口启用状态 · FIELD\-DICT\-ENABLED](../field-specs.md#FIELD-DICT-ENABLED)；依据：[取数接口字典 · UI\-PAGE\-006](../ui-pages/UI-PAGE-006.md)

- [接口名称 · FIELD\-DICT\-NAME](../field-specs.md#FIELD-DICT-NAME)；依据：[取数接口字典 · UI\-PAGE\-006](../ui-pages/UI-PAGE-006.md)

- [可用租户集合 · FIELD\-TENANT\-GRANTS](../field-specs.md#FIELD-TENANT-GRANTS)；依据：[取数接口字典 · UI\-PAGE\-006](../ui-pages/UI-PAGE-006.md)

## 本功能验收

- **AC\-139**：超级管理员可在“客户管理→业务分类→取数接口字典”第三Tab，对无使用引用的接口条目发起并确认删除；该字典仍为全局维护，租户授权规则不变，非超管不能执行。

- **AC\-140**：任一当前字段定义引用该接口（含停用/隐藏/撤权租户中的实际配置）、实际已保存业务数据引用，或进行中/话后未保存通话需要保留其数据来源时，拒绝删除并说明租户、字段/记录或通话等位置。未定类型通话按冻结目录中仍可选类别的可见字段及全部依赖闭包保留来源，直至本通结果保存完成；不假称这些库存字段已经填写，不扫孤立的全字段库存。

- **AC\-141**：删除确认时再次核对权限、目标及引用；取消、引用新增、状态变化、读取无法确认或保存失败均不宣称删除成功，也不自动清理别的字段/分类/草稿。进行中通话和历史快照保持原样，不用删除冒充停用/撤权。

- **AC\-142**：删除成功后仅移除该未使用条目，刷新/重新进入不读回或自动补默认；不级联删除字段或分类。未初始化租户仅在字典可读且默认来源被明确删除时不生成该来源的默认Mapping字段/引用；停用、撤权或读取异常不当作删除，已有持久配置不重新投影。

## 实施任务

本产品阶段阅读版不展示实施任务。开发接手后需核对工程方案与任务拆分，具体见[开发补充清单](../developer-supplement.md)。

## 来源与范围边界

本页仅整理本次范围内的 FUNC\-031。产品：云外呼平台 v1\.1\.1 业务数据接口字典与字段取数联动 / 1\.1\.1。

来源类型：analysis；来源指纹：923aae4c88f95eb803ba79f89afa043755adfc82a01a706894c286491c7857ff。

- memory/feature\-list\.json\#FUNC\-031

涉及来源变化、规则冲突或缺失时，回到产品事实和规划修订；[覆盖核对](../completeness-matrix.md)保留逐项追踪依据。
