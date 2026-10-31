# LOCAL-PLAT-PRO-FIELD 维护或预览云呼叫专业字段

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md) · [全局逻辑](../global-logic.md)

- [进入有权工作位置与保留专业能力 · FUNC\-2002](../features/FUNC-2002.md)
- [停用当前专业域目录分类 · FUNC\-2018](../features/FUNC-2018.md)

## 职责与触发

所属工程模块：未填写

功能：FUNC-2002, FUNC-2018

触发：原专业字段入口查询/预览/新增/编辑/启停/删除

## 前置条件

- 原当前租户字段配置权；预览只需读权

## 必须遵守的全局规则

- [GR-IDENTITY](../global-logic.md#GR-IDENTITY)
- [GR-SCOPE](../global-logic.md#GR-SCOPE)
- [GR-AUTH](../global-logic.md#GR-AUTH)
- [GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)
- [GR-LIST-ORDER](../global-logic.md#GR-LIST-ORDER)

## 输入与输出

输入：[FIELD-PLAT-PRO-FIELD-ID](../field-specs.md#FIELD-PLAT-PRO-FIELD-ID)、[FIELD-PLAT-PRO-FIELD-DEF](../field-specs.md#FIELD-PLAT-PRO-FIELD-DEF)、[FIELD-PLAT-REVISION](../field-specs.md#FIELD-PLAT-REVISION)、[FIELD-PLAT-REFERENCE-STATE](../field-specs.md#FIELD-PLAT-REFERENCE-STATE)

输出：[FIELD-PLAT-PRO-FIELD-DEF](../field-specs.md#FIELD-PLAT-PRO-FIELD-DEF)、[FIELD-PLAT-AUDIT](../field-specs.md#FIELD-PLAT-AUDIT)

## 处理步骤

### LOCAL-PLAT-PRO-FIELD-S1

查询及previewOnly只显示当前已保存控件/选项，无保存客户值按钮

读取：FIELD-PLAT-PRO-FIELD-ID, FIELD-PLAT-PRO-FIELD-DEF, FIELD-PLAT-REVISION, FIELD-PLAT-REFERENCE-STATE；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

### LOCAL-PLAT-PRO-FIELD-S2

新增/编辑提交当前同源字段库的label/type/businessKey/options/enabled及接口原子输入；品牌与IMPORT/FOLLOWUP用途遵守FIELD-FLOW定义；原专业入口不复制旧租户目录，不以原选填规则放宽导入编码必填

读取：FIELD-PLAT-PRO-FIELD-ID, FIELD-PLAT-PRO-FIELD-DEF, FIELD-PLAT-REVISION, FIELD-PLAT-REFERENCE-STATE；写入：无

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

### LOCAL-PLAT-PRO-FIELD-S3

预置字段保护；任意分类引用不得删除，启用分类显示引用不得停用；并发修订拒绝

读取：FIELD-PLAT-PRO-FIELD-ID, FIELD-PLAT-PRO-FIELD-DEF, FIELD-PLAT-REVISION, FIELD-PLAT-REFERENCE-STATE；写入：FIELD-PLAT-PRO-FIELD-DEF, FIELD-PLAT-AUDIT

规则：GR-IDENTITY, GR-SCOPE, GR-AUTH, GR-UNKNOWN, GR-LIST-ORDER

## 分支与异常

### LOCAL-PLAT-PRO-FIELD-B1

条件：前提、字段及对象修订校验通过且结果明确成功

结果：专业字段定义准确维护或只读预览，原字段引用及独立专业语义保留

涉及字段：FIELD-PLAT-PRO-FIELD-ID, FIELD-PLAT-PRO-FIELD-DEF, FIELD-PLAT-REVISION, FIELD-PLAT-REFERENCE-STATE, FIELD-PLAT-AUDIT

验证：CHECK-PLAT-PRO-FIELD

### LOCAL-PLAT-PRO-FIELD-B2

条件：无权/字段不合法/对象失效/修订冲突

结果：明确显示本次拒绝原因，保留可继续的输入和已确认原值，不作变更

涉及字段：FIELD-PLAT-PRO-FIELD-ID, FIELD-PLAT-PRO-FIELD-DEF, FIELD-PLAT-REVISION, FIELD-PLAT-REFERENCE-STATE, FIELD-PLAT-AUDIT

验证：CHECK-PLAT-PRO-FIELD

### LOCAL-PLAT-PRO-FIELD-B3

条件：提交失败或结果未知

结果：失败保留原确认值；未知显示待核并按同请求核对，不重复提交或假报成功

涉及字段：FIELD-PLAT-PRO-FIELD-ID, FIELD-PLAT-PRO-FIELD-DEF, FIELD-PLAT-REVISION, FIELD-PLAT-REFERENCE-STATE, FIELD-PLAT-AUDIT

验证：CHECK-PLAT-PRO-FIELD

## 完成后的状态

- 当前同源字段库准确定义维护或只读预览；专业入口保留但不复制字段实体，已有引用和快照不变

## 字段定义

- [FIELD-PLAT-AUDIT](../field-specs.md#FIELD-PLAT-AUDIT)
- [FIELD-PLAT-PRO-FIELD-DEF](../field-specs.md#FIELD-PLAT-PRO-FIELD-DEF)
- [FIELD-PLAT-PRO-FIELD-ID](../field-specs.md#FIELD-PLAT-PRO-FIELD-ID)
- [FIELD-PLAT-REFERENCE-STATE](../field-specs.md#FIELD-PLAT-REFERENCE-STATE)
- [FIELD-PLAT-REVISION](../field-specs.md#FIELD-PLAT-REVISION)

## 来源与验证

来源条目：acceptance:AC-2043, acceptance:AC-2044, acceptance:AC-2072, features:FUNC-2002, features:FUNC-2002/behavior_spec/45/branches/0, features:FUNC-2002/behavior_spec/45/branches/1, features:FUNC-2002/behavior_spec/45/branches/2, features:FUNC-2002/behavior_spec/45/postconditions/0, features:FUNC-2002/behavior_spec/45/preconditions/0, features:FUNC-2002/behavior_spec/45/steps/0, features:FUNC-2002/behavior_spec/45/steps/1, features:FUNC-2002/behavior_spec/45/steps/2, features:FUNC-2018, features:FUNC-2018/behavior_spec/1/branches/0, features:FUNC-2018/behavior_spec/1/branches/1, features:FUNC-2018/behavior_spec/1/branches/2, features:FUNC-2018/behavior_spec/1/postconditions/0, features:FUNC-2018/behavior_spec/1/preconditions/0, features:FUNC-2018/behavior_spec/1/steps/0, features:FUNC-2018/behavior_spec/1/steps/1, features:FUNC-2018/behavior_spec/1/steps/2, pages:PAGE-2003/fields/2, pages:PAGE-2003/fields/21, pages:PAGE-2003/fields/24, pages:PAGE-2004/fields/0, pages:PAGE-2004/fields/3, pages:PAGE-2004/fields/5, pages:PAGE-2005/fields/0, pages:PAGE-2005/fields/9, pages:PAGE-2006/fields/56, pages:PAGE-2006/fields/57, pages:PAGE-2006/fields/58, pages:PAGE-2007/fields/1, pages:PAGE-2007/fields/25, pages:PAGE-2103/fields/16, pages:PAGE-2103/fields/20, pages:PAGE-2103/fields/3, pages:PAGE-2108/fields/4, pages:PAGE-2109/fields/3, pages:PAGE-2109/fields/9, pages:PAGE-2110/fields/11, pages:PAGE-2110/fields/12, pages:PAGE-2110/fields/7, pages:PAGE-2111/fields/12, pages:PAGE-2111/fields/16, pages:PAGE-2112/fields/14, pages:PAGE-2112/fields/6, pages:PAGE-2202/fields/1, pages:PAGE-2202/fields/30, pages:PAGE-2204/fields/71, pages:PAGE-2204/fields/79, pages:PAGE-2204/fields/84, pages:PAGE-2205/fields/0, pages:PAGE-2205/fields/17, pages:PAGE-2206/fields/0, pages:PAGE-2206/fields/17, pages:PAGE-2207/fields/0, pages:PAGE-2207/fields/18, pages:PAGE-2210/fields/0, pages:PAGE-2210/fields/4, pages:PAGE-2210/fields/8, pages:PAGE-2211/fields/0, pages:PAGE-2211/fields/7, pages:PAGE-2212/fields/0, pages:PAGE-2212/fields/12, pages:PAGE-2212/fields/8, pages:PAGE-2213/fields/0, pages:PAGE-2213/fields/28, pages:PAGE-2214/fields/0, pages:PAGE-2215/fields/0, pages:PAGE-2215/fields/9, pages:PAGE-2216/fields/0, pages:PAGE-2216/fields/13, pages:PAGE-2216/fields/9, pages:PAGE-2217/fields/0, pages:PAGE-2217/fields/16, pages:PAGE-2217/fields/20, pages:PAGE-2218/fields/0, pages:PAGE-2218/fields/4, pages:PAGE-2218/fields/8, pages:PAGE-2219/fields/0, pages:PAGE-2219/fields/14, pages:PAGE-2220/fields/16, pages:PAGE-2220/fields/20, pages:PAGE-2220/fields/7, pages:PAGE-2221/fields/0, pages:PAGE-2222/fields/0, pages:PAGE-2223, pages:PAGE-2223/actions/0, pages:PAGE-2223/fields/35, pages:PAGE-2223/fields/36, pages:PAGE-2223/fields/37, pages:PAGE-2223/fields/38, pages:PAGE-2223/fields/39, pages:PAGE-2227/fields/120, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/184, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/185, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/188, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/299, project_facts:FIELD-ALIGNMENT-CURRENT/mappings/300, scenarios:FLOW-CURRENT-PLATFORM/steps/73

验证：CHECK-PLAT-PRO-FIELD

## 实施任务

- [TASK-010](../tasks/TASK-010.md)
