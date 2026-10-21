# 启用业务数据接口条目 · FUNC\-025

**READY\_FOR\_ENGINEERING\_DESIGN — 产品可交接，工程设计需补齐**

[返回功能目录](README.md) · [返回开发包入口](../README.md)

## 本功能做什么

超管把指定条目设为启用，后续查询仍受租户授权约束；来源恢复不自动使未提交旧值有效。

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

- [启用接口条目 · LOCAL\-DICT\-ENABLE](../local-logic/LOCAL-DICT-ENABLE.md)

本局部说明只声明关联当前功能，以下内容直接取自同一份规划。

### 触发与前置条件

触发：超管明确将停用条目启用

- 当前账号、企业/租户/对象和处理阶段有对应权限；输入来自本局部声明的当前对象。
- 沿当前已确认范围执行；不借原型或历史ID扩张权限。

### 处理步骤

1. **LOCAL\-DICT\-ENABLE\-STEP\-1**：核对目标及权限，保存明确启用目标

2. **LOCAL\-DICT\-ENABLE\-STEP\-2**：新使用仍核对租户授权，既有不可用值按恢复规则处理

### 分支与异常

- **LOCAL\-DICT\-ENABLE\-BRANCH\-1**：当未授权租户尝试新查询，仍拒绝，不因启用变成全租户可用。

- **LOCAL\-DICT\-ENABLE\-BRANCH\-2**：当已有不可用旧值，保留待核对，不自动有效。

### 完成后的状态

- 仅本次动作的合法结果生效；取消或核对/保存异常保留原对象与输入，不宣称成功。

## 本功能明确关联的字段

这些关系来自已声明的页面／局部说明；字段仍可能被其他功能复用。

- [接口启用状态 · FIELD\-DICT\-ENABLED](../field-specs.md#FIELD-DICT-ENABLED)；依据：[启用接口条目 · LOCAL\-DICT\-ENABLE](../local-logic/LOCAL-DICT-ENABLE.md)

- [取数接口条目标识 · FIELD\-DICT\-ID](../field-specs.md#FIELD-DICT-ID)；依据：[启用接口条目 · LOCAL\-DICT\-ENABLE](../local-logic/LOCAL-DICT-ENABLE.md)

- [可用租户集合 · FIELD\-TENANT\-GRANTS](../field-specs.md#FIELD-TENANT-GRANTS)；依据：[启用接口条目 · LOCAL\-DICT\-ENABLE](../local-logic/LOCAL-DICT-ENABLE.md)

## 共用说明中的字段上下文

以下字段来自共用页面、局部说明或任务，用于定位上下文；不等于本功能都需要实现。

- [通话及业务对象上下文 · FIELD\-CALL\-CONTEXT](../field-specs.md#FIELD-CALL-CONTEXT)；依据：[取数接口字典 · UI\-PAGE\-006](../ui-pages/UI-PAGE-006.md)

- [取数能力 · FIELD\-CAPABILITY](../field-specs.md#FIELD-CAPABILITY)；依据：[取数接口字典 · UI\-PAGE\-006](../ui-pages/UI-PAGE-006.md)

- [已删除分类保留定义 · FIELD\-CATEGORY\-ARCHIVE](../field-specs.md#FIELD-CATEGORY-ARCHIVE)；依据：[取数接口字典 · UI\-PAGE\-006](../ui-pages/UI-PAGE-006.md)

- [字段定义整体 · FIELD\-DEFINITION](../field-specs.md#FIELD-DEFINITION)；依据：[取数接口字典 · UI\-PAGE\-006](../ui-pages/UI-PAGE-006.md)

- [接口名称 · FIELD\-DICT\-NAME](../field-specs.md#FIELD-DICT-NAME)；依据：[取数接口字典 · UI\-PAGE\-006](../ui-pages/UI-PAGE-006.md)

## 本功能验收

- **AC\-129**：超管能够将停用的接口字典条目设置为启用；启用后的租户使用范围仍受可用租户配置约束。

- **AC\-131**：已被字段配置引用的接口字典条目保留；编辑、启停或租户授权调整不自动删除条目、原引用配置和历史已保存数据。

## 实施任务

本产品阶段阅读版不展示实施任务。开发接手后需核对工程方案与任务拆分，具体见[开发补充清单](../developer-supplement.md)。

## 来源与范围边界

本页仅整理本次范围内的 FUNC\-025。产品：云外呼平台 v1\.1\.1 业务数据接口字典与字段取数联动 / 1\.1\.1。

来源类型：analysis；来源指纹：923aae4c88f95eb803ba79f89afa043755adfc82a01a706894c286491c7857ff。

- memory/feature\-list\.json\#FUNC\-025

涉及来源变化、规则冲突或缺失时，回到产品事实和规划修订；[覆盖核对](../completeness-matrix.md)保留逐项追踪依据。
