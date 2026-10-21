# LOCAL-FIELD-DISABLE 停用当前字段定义

**READY_FOR_ENGINEERING_DESIGN — 产品可交接，工程设计需补齐**

[返回阅读入口](../README.md) · [功能目录](../features/README.md) · [全局逻辑](../global-logic.md)

- [保存接口车系及通用取数字段配置 · FUNC\-029](../features/FUNC-029.md)

## 职责与触发

所属工程模块：开发接手后确定

功能：FUNC-029

触发：有权管理员在字段列表点击已启用字段的停用

## 前置条件

- 本租户及成员维护权限有效，目标当前存在，当前版本可可靠核对。
- 此入口承载已有字段配置维护，不新增独立本期功能或接口授权。

## 必须遵守的全局规则

- [BR-026](../global-logic.md#BR-026)
- [BR-032](../global-logic.md#BR-032)
- [BR-024](../global-logic.md#BR-024)

## 输入与输出

输入：[FIELD-DEFINITION-ID](../field-specs.md#FIELD-DEFINITION-ID)、[FIELD-DEFINITION-ENABLED](../field-specs.md#FIELD-DEFINITION-ENABLED)、[FIELD-DEFINITION](../field-specs.md#FIELD-DEFINITION)、[FIELD-CATEGORY-DEFINITION](../field-specs.md#FIELD-CATEGORY-DEFINITION)、[FIELD-CLASS-FIELD-REFS](../field-specs.md#FIELD-CLASS-FIELD-REFS)、[FIELD-CLASS-VISIBLE](../field-specs.md#FIELD-CLASS-VISIBLE)

输出：[FIELD-DEFINITION-ENABLED](../field-specs.md#FIELD-DEFINITION-ENABLED)、[FIELD-DEFINITION](../field-specs.md#FIELD-DEFINITION)

## 处理步骤

### LOCAL-FIELD-DISABLE-STEP-1

读取目标字段及明确的停用false目标，所有字段使用相同行操作。

读取：FIELD-DEFINITION-ID, FIELD-DEFINITION-ENABLED, FIELD-DEFINITION；写入：无

规则：BR-026, BR-032, BR-024

### LOCAL-FIELD-DISABLE-STEP-2

重查权限、目标版本、定义及依赖完整性；当前启用分类仍显示时提示先关闭分类显示，不自动改分类或依赖。

读取：FIELD-DEFINITION-ID, FIELD-DEFINITION-ENABLED, FIELD-DEFINITION, FIELD-CATEGORY-DEFINITION, FIELD-CLASS-FIELD-REFS, FIELD-CLASS-VISIBLE；写入：无

规则：BR-026, BR-032, BR-024

### LOCAL-FIELD-DISABLE-STEP-3

同次保存目标状态与定义，成功后刷新状态及相反操作按钮；不改变进行中通话版。

读取：FIELD-DEFINITION-ID, FIELD-DEFINITION-ENABLED, FIELD-DEFINITION；写入：FIELD-DEFINITION-ENABLED, FIELD-DEFINITION

规则：BR-026, BR-032, BR-024

## 分支与异常

### LOCAL-FIELD-DISABLE-BRANCH-1

条件：身份/目标版本、读取或保存条件发生变化

结果：保留原定义与状态，提示当前不能完成；不覆盖其他写入。

涉及字段：FIELD-DEFINITION-ID, FIELD-DEFINITION-ENABLED

验证：CHECK-FIELD-LIFECYCLE, CHECK-133, CHECK-AUTH

### LOCAL-FIELD-DISABLE-BRANCH-2

条件：已有本通整版或历史快照

结果：继续原独立快照，新字段状态不替换本通；字典启停与接口授权仍实时。

涉及字段：FIELD-DEFINITION

验证：CHECK-133, CHECK-FIELD-LIFECYCLE

### LOCAL-FIELD-DISABLE-BRANCH-3

条件：当前启用分类显示该字段或必要配置依赖不满足

结果：说明需调整的当前配置，保持启用；与删除时所有当前引用均须解除的规则区分。

涉及字段：FIELD-CATEGORY-DEFINITION, FIELD-CLASS-FIELD-REFS, FIELD-CLASS-VISIBLE

验证：CHECK-FIELD-LIFECYCLE

## 完成后的状态

- 成功仅更新当前字段定义及启停状态；旧通话/话后和历史快照保持，异常保留原配置。

## 字段定义

- [FIELD-DEFINITION-ID](../field-specs.md#FIELD-DEFINITION-ID)
- [FIELD-DEFINITION-ENABLED](../field-specs.md#FIELD-DEFINITION-ENABLED)
- [FIELD-DEFINITION](../field-specs.md#FIELD-DEFINITION)
- [FIELD-CATEGORY-DEFINITION](../field-specs.md#FIELD-CATEGORY-DEFINITION)
- [FIELD-CLASS-FIELD-REFS](../field-specs.md#FIELD-CLASS-FIELD-REFS)
- [FIELD-CLASS-VISIBLE](../field-specs.md#FIELD-CLASS-VISIBLE)

## 来源与验证

来源条目：features:FUNC-029, pages:PAGE-007/actions/0, rules:BR-026, rules:BR-032

验证：CHECK-FIELD-LIFECYCLE, CHECK-133, CHECK-AUTH

## 实施任务

未声明；请结合范围说明核对。
