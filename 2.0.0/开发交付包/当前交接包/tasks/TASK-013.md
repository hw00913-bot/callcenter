# TASK-013 按准确方式与场景读取文件和列映射

**DRAFT — 供讨论与补充，尚未完成本阶段交接**

[返回阅读入口](../README.md) · [功能目录](../features/README.md)

- [按共同分类字段预检并导入统一业务 · FUNC\-2036](../features/FUNC-2036.md)

## 目标

先由入口/任务/当前模板分流确定呼叫方式及必要AI场景，再形成正式导入字段；AI取该scene/platform的业务字段映射和供应商专属列，PRED取任务已关联分类IMPORT。；保CSV/TSV/XLSX、前导零、物理原始行号及显式列映射；文件异步回调按窗口/账号/租户/序号失效，变化使检查token失效。

## 产品依据

- FUNC-2036 按共同分类字段预检并导入统一业务：客户维护与AI/预外呼任务三入口共用分类IMPORT和code等系统必需校验。客户维护按原DIRECT/TEMPLATE；任务内固定准确任务/必要scene并默认DIRECT，须ADMIN+customer.import、原模块/任务/来源及分类允许，保存完整值/快照/taskImportSource/等级和直接周期。专业名单只读recordId投影，不写第二账本/原生行或重复提交供应商，旧历史不迁移。；来源 documentation/input/functions.json#FUNC-2036

来源根：`/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/开发交付包/工作资料/续接输入`；来源指纹：`b0292b83ba50e66ed754b44bc97cfa25bab040c4f00b70baa8e542df666aeccf`

## 前置任务

- TASK-009

## 只读代码上下文

未指定既有代码文件；从工程规范和产品依据读取上下文。

## 允许修改的文件

- 未填写

代码库根：`None`。未列出的文件不属于本任务修改范围；扩大范围需回到计划。

## 变更安排

- 未填写

## 逻辑与字段依据

先读 [全局逻辑](../global-logic.md)，再读本任务关联的局部逻辑与字段定义。

全局规则：[GR-AUTH](../global-logic.md#GR-AUTH)、[GR-DATA-FACTS](../global-logic.md#GR-DATA-FACTS)、[GR-FIELDS](../global-logic.md#GR-FIELDS)、[GR-HANDLING-MODE](../global-logic.md#GR-HANDLING-MODE)、[GR-UNKNOWN](../global-logic.md#GR-UNKNOWN)

局部逻辑：[LOCAL-FLOW-IMPORT-MAP](../local-logic/LOCAL-FLOW-IMPORT-MAP.md)

字段：[FIELD-FLOW-AI-SCENE](../field-specs.md#FIELD-FLOW-AI-SCENE)、[FIELD-FLOW-ALLOW-DIRECT-FOLLOWUP](../field-specs.md#FIELD-FLOW-ALLOW-DIRECT-FOLLOWUP)、[FIELD-FLOW-CATEGORY-ID](../field-specs.md#FIELD-FLOW-CATEGORY-ID)、[FIELD-FLOW-CATEGORY-IMPORT-REFS](../field-specs.md#FIELD-FLOW-CATEGORY-IMPORT-REFS)、[FIELD-FLOW-DIRECT-METHOD](../field-specs.md#FIELD-FLOW-DIRECT-METHOD)、[FIELD-FLOW-FILE-PENDING](../field-specs.md#FIELD-FLOW-FILE-PENDING)、[FIELD-FLOW-FILE-READ](../field-specs.md#FIELD-FLOW-FILE-READ)、[FIELD-FLOW-HANDLING-MODE](../field-specs.md#FIELD-FLOW-HANDLING-MODE)、[FIELD-FLOW-IMPORT-MAPPING](../field-specs.md#FIELD-FLOW-IMPORT-MAPPING)、[FIELD-FLOW-IMPORT-PREVIEW](../field-specs.md#FIELD-FLOW-IMPORT-PREVIEW)、[FIELD-FLOW-IMPORT-TEXT](../field-specs.md#FIELD-FLOW-IMPORT-TEXT)、[FIELD-FLOW-IMPORT-TOKEN](../field-specs.md#FIELD-FLOW-IMPORT-TOKEN)

## UI 依据

[全局 UI 规范](../ui-spec.md)

- [UI-PAGE-2204](../ui-pages/UI-PAGE-2204.md)

## 实现要求

- 先由入口/任务/当前模板分流确定呼叫方式及必要AI场景，再形成正式导入字段；AI取该scene/platform的业务字段映射和供应商专属列，PRED取任务已关联分类IMPORT。
- 保CSV/TSV/XLSX、前导零、物理原始行号及显式列映射；文件异步回调按窗口/账号/租户/序号失效，变化使检查token失效。
- 模板下载的落地/回读是独立验收，上传成功或生成提示不等于下载通过；容量按准确context.importLimits，不截断。
- 按所引LOCAL逐动作落实触发/前后置/分支；业务定义只读同源规格，不另抄一套规则。
- 依赖表示实施契约/共享守卫先就绪，不新增用户操作门槛；跨任务端到端由验收批次合并检查。
- 目标库、模块/服务/表/接口、精确可写文件及命令由开发在开工前绑定；当前空文件清单不授代码写入权。

## 产品验收

- **AC-2115**：按实际分类生成系统必需和IMPORT列及必填校验；合法等待名单数据中性提示，检查后具体报字段/节点/条件；正式提交所有行通过且token一致。
  依据：docs/functional-spec.json#AC-2115

## 测试要求（尚未执行）

### CHECK-FLOW-IMPORT-MAP / manual

步骤：先确定入口/方式/实际AI场景，下载本次schema或上传/粘贴并映射；切场景后检查旧映射和token。

预期：先确定实际呼叫方式、条件首路径和必要AI场景，再生成本次schema：系统业务编码/客户称呼/客户号码必需；TEMPLATE保留本次IMPORT条件分流字段，其余只取该scene/platform实际IMPORT_FIELD引用及CUSTOM_COLUMN专属列，未引用的分类额外必填不阻AI导入。非AI仍按实际分类IMPORT。FOLLOWUP不混入；下载CSV/XLSX、列映射、逐行校验、参数生成与规范值/定义快照使用同一准确schema。场景/字段/资料/目标变化失效旧预检。 不出现未引用分类列强制AI导入；格式或映射改变重新检查。

覆盖：AC-2115

## 完成条件

- 先由入口/任务/当前模板分流确定呼叫方式及必要AI场景，再形成正式导入字段；AI取该scene/platform的业务字段映射和供应商专属列，PRED取任务已关联分类IMPORT。
- 保CSV/TSV/XLSX、前导零、物理原始行号及显式列映射；文件异步回调按窗口/账号/租户/序号失效，变化使检查token失效。
- 本任务全部同ID验收检查有当前实现、正常/拒绝/失败/未知证据，关联页面五态及字段权限符合原规格。
- 开发完成目标库/精确文件/模块/数据接口/测试执行绑定，必要共享文件先后依赖已补齐，工程问题有可靠结论。
- 产品变动回产品规格重审；不可用局部实现或Mock结论替代真实远端与正式开工许可。

需保留实际改动、测试结果和 Review 证据。仅修改完成不等于验收通过。


## 本轮工程绑定边界

本任务为可承接的业务实施分解，尚未绑定生产仓库/技术栈。开发确定真实文件后填写allowed_files、context_files、changes并复检共享文件依赖；不得把原型参考文件当作生产可写授权。

只读原型行为参考：

- [import-workbook.js](../../../prototype/js/components/import-workbook.js) · 只读行为参考，非生产可写目标
- [four-node-workspace.js](../../../prototype/js/adapters/four-node-workspace.js) · 只读行为参考，非生产可写目标

需开发处理的问题：ENG-FLOW-CHECKS。
