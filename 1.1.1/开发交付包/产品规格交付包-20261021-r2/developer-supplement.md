# 开发补充与开工清单

[返回阅读入口](README.md) · [按功能阅读](features/README.md)

阅读顺序：[七类工程决定](#engineering-decisions) → [产品缺口摘要](#product-issues) → [开发待确认问题](#development-questions) → [开发待办明细](#development-issues)。

产品交接门禁检查需求是否完整；开发开工门禁检查工程决定、字段和接口映射、任务及验证是否完整。产品交接通过不代表业务编码已经具备开工条件。

允许先做代码库建立、脚手架、技术验证和方案评估等准备工作。门禁约束正式业务实现；准备工作的结果须回填后再核验。

开发负责技术选择和实现映射。业务含义、字段值域、权限、状态、异常及 UI 行为有疑问时交回产品负责人确认，不得由开发或 AI 猜测补齐。

证据引用须来自当前代码库快照；继承已有规范还须填写版本和本次适用范围。结构检查只核验证据可定位与快照一致，不代替语义审阅，也不表示测试已经执行。

<a id="engineering-decisions"></a>

## 七类工程决定

| 类别 | 状态 | 负责人员或角色 |
| --- | --- | --- |
| [脚手架与代码库入口](#engineering-scaffold) | pending | 开发负责人及相关接口/平台维护人员 |
| [技术栈与版本](#engineering-stack) | pending | 开发负责人及相关接口/平台维护人员 |
| [后端框架与服务边界](#engineering-backend) | pending | 开发负责人及相关接口/平台维护人员 |
| [数据约定与字段映射](#engineering-data) | pending | 开发负责人及相关接口/平台维护人员 |
| [接口约定](#engineering-api) | pending | 开发负责人及相关接口/平台维护人员 |
| [编码与协作规范](#engineering-coding) | pending | 开发负责人及相关接口/平台维护人员 |
| [测试与运行约定](#engineering-verification) | pending | 开发负责人及相关接口/平台维护人员 |

<a id="engineering-scaffold"></a>

### 脚手架与代码库入口

状态：pending；负责人员或角色：开发负责人及相关接口/平台维护人员

应补内容：代码库、目录与入口、复用或新建方式、依赖准备方式。

验收方式：提供可复现的准备检查步骤、预期结果与代码库证据；记录实际执行证据时另行说明结果。

当前决定：提供正式仓库路径、基线版本、构建与启动/复验办法；当前HTML演示不是生产仓库。

适用范围：v1.1.1当前11项功能的工程设计与实现；不扩大已确认业务范围。

代码库证据：未填写

<a id="engineering-stack"></a>

### 技术栈与版本

状态：pending；负责人员或角色：开发负责人及相关接口/平台维护人员

应补内容：语言、运行时、核心依赖及采用的版本范围。

验收方式：对照依赖清单或工程规范，确认与当前代码库及交付范围一致。

当前决定：提供前后端语言/框架/运行时版本及适用团队标准，不由静态原型推定。

适用范围：v1.1.1当前11项功能的工程设计与实现；不扩大已确认业务范围。

代码库证据：未填写

<a id="engineering-backend"></a>

### 后端框架与服务边界

状态：pending；负责人员或角色：开发负责人及相关接口/平台维护人员

应补内容：后端框架、服务职责、部署边界及对接方式；没有服务端时说明原因。

验收方式：核对架构和模块边界；前端原型可以说明不适用，不能虚构后端已经存在。

当前决定：在真实工程明确接口字典、字段配置、授权查询、通话固定版、结果保存和分类归档的服务/模块责任。

适用范围：v1.1.1当前11项功能的工程设计与实现；不扩大已确认业务范围。

代码库证据：未填写

<a id="engineering-data"></a>

### 数据约定与字段映射

状态：pending；负责人员或角色：开发负责人及相关接口/平台维护人员

应补内容：业务字段到内存、传输或存储的映射；类型、空值、时间、标识、迁移约定。

验收方式：逐项对照字段规格；无数据库也需明确函数入参或本地数据约定。

当前决定：设计稳定标识、版本/并发控制、保留引用、分类归档、同通快照及草稿写入/恢复/正式保存后清理；不扩大跨设备承诺。

适用范围：v1.1.1当前11项功能的工程设计与实现；不扩大已确认业务范围。

代码库证据：未填写

<a id="engineering-api"></a>

### 接口约定

状态：pending；负责人员或角色：开发负责人及相关接口/平台维护人员

应补内容：协议、路径或函数签名、请求响应、错误格式、认证和幂等约定。

验收方式：核对本次实际接口和产品行为；无远程接口时解释本地接口由哪份规范承担。

当前决定：核实Mapping主机/鉴权/数据权限、官方与导入回传编码、媒体10/状态1业务覆盖、状态原值和重复冲突/异常约定；变更业务需回产品确认。

适用范围：v1.1.1当前11项功能的工程设计与实现；不扩大已确认业务范围。

代码库证据：未填写

<a id="engineering-coding"></a>

### 编码与协作规范

状态：pending；负责人员或角色：开发负责人及相关接口/平台维护人员

应补内容：命名、目录归属、依赖限制、错误处理、提交和代码审阅规则。

验收方式：引用适用规范及版本，核对计划修改路径与编码约定。

当前决定：引用团队目录、命名、错误、日志脱敏/凭据保护和代码评审约束的真实版本与仓库证据。

适用范围：v1.1.1当前11项功能的工程设计与实现；不扩大已确认业务范围。

代码库证据：未填写

<a id="engineering-verification"></a>

### 测试与运行约定

状态：pending；负责人员或角色：开发负责人及相关接口/平台维护人员

应补内容：运行方式、环境、测试命令或手工步骤、预期结果与验收责任。

验收方式：将产品验收关联到可复现的开发验证；未执行的测试仅标记为计划。

当前决定：用本包同ID业务CHECK补实际框架、隔离环境和命令，覆盖权限/并发/旧请求/通话版/归档/保存异常及真实接口运行证据。

适用范围：v1.1.1当前11项功能的工程设计与实现；不扩大已确认业务范围。

代码库证据：未填写

<a id="product-issues"></a>

## 仍需产品方确认

这些问题不能通过补技术栈或把状态改为已完成而关闭。

当前报告没有产品侧结构阻塞；仍以具名语义复核结果为准。

<a id="development-questions"></a>

## 开发待确认问题

技术问题保留原始描述和分类依据；若问题涉及业务行为，须转交产品负责人确认，不能通过改变负责方来绕过产品语义审阅。

### ENGINEERING-SCAFFOLD

正式仓库与脚手架：提供正式仓库路径、基线版本、构建与启动/复验办法；当前HTML演示不是生产仓库。

阻塞开发：是；工程类别：scaffold

分类依据：这属于正式工程资料、实现落点或运行核验的补充，产品业务范围/权限/状态/输入输出及验收已在本规格定义，不以该工程选择变更业务。

### ENGINEERING-STACK

团队技术栈：提供前后端语言/框架/运行时版本及适用团队标准，不由静态原型推定。

阻塞开发：是；工程类别：stack

分类依据：这属于正式工程资料、实现落点或运行核验的补充，产品业务范围/权限/状态/输入输出及验收已在本规格定义，不以该工程选择变更业务。

### ENGINEERING-BACKEND

后端责任落点：在真实工程明确接口字典、字段配置、授权查询、通话固定版、结果保存和分类归档的服务/模块责任。

阻塞开发：是；工程类别：backend

分类依据：这属于正式工程资料、实现落点或运行核验的补充，产品业务范围/权限/状态/输入输出及验收已在本规格定义，不以该工程选择变更业务。

### ENGINEERING-DATA

数据与一致性：设计稳定标识、版本/并发控制、保留引用、分类归档、同通快照及草稿写入/恢复/正式保存后清理；不扩大跨设备承诺。

阻塞开发：是；工程类别：data

分类依据：这属于正式工程资料、实现落点或运行核验的补充，产品业务范围/权限/状态/输入输出及验收已在本规格定义，不以该工程选择变更业务。

### ENGINEERING-API

正式接口及联调：核实Mapping主机/鉴权/数据权限、官方与导入回传编码、媒体10/状态1业务覆盖、状态原值和重复冲突/异常约定；变更业务需回产品确认。

阻塞开发：是；工程类别：api

分类依据：这属于正式工程资料、实现落点或运行核验的补充，产品业务范围/权限/状态/输入输出及验收已在本规格定义，不以该工程选择变更业务。

### ENGINEERING-CODING

编码与安全规范：引用团队目录、命名、错误、日志脱敏/凭据保护和代码评审约束的真实版本与仓库证据。

阻塞开发：是；工程类别：coding

分类依据：这属于正式工程资料、实现落点或运行核验的补充，产品业务范围/权限/状态/输入输出及验收已在本规格定义，不以该工程选择变更业务。

### ENGINEERING-VERIFICATION

可执行测试实施：用本包同ID业务CHECK补实际框架、隔离环境和命令，覆盖权限/并发/旧请求/通话版/归档/保存异常及真实接口运行证据。

阻塞开发：是；工程类别：verification

分类依据：这属于正式工程资料、实现落点或运行核验的补充，产品业务范围/权限/状态/输入输出及验收已在本规格定义，不以该工程选择变更业务。

<a id="development-issues"></a>

## 仍需开发方完成

开发侧另有 **1305** 项结构阻塞。共同依赖的产品缺口见上方摘要；不转派给开发方。

逐条补回 engineering.json 或计划中的相应技术字段，再运行开发开工检查；不要只在本阅读文档中打勾。

<details>
<summary>展开开发待办的完整路径与检查原因</summary>

- `repository.root`：Provide an explicit target repository directory; a new project may use an existing empty directory.（repository.root）
- `engineering.stack`：At least one concrete entry is required.（required）
- `engineering.coding_rules`：At least one concrete entry is required.（required）
- `engineering.modules`：At least one entry is required.（required）
- `plan.technical_design.modules`：At least one entry is required.（required）
- `plan.technical_design.modules`：Features lack a design module: FUNC-023, FUNC-024, FUNC-025, FUNC-026, FUNC-027, FUNC-028, FUNC-029, FUNC-030, FUNC-031, FUNC-032, FUNC-033（coverage.design）
- `plan.technical_design.data_changes`：At least one concrete entry is required.（required）
- `plan.technical_design.permissions`：At least one concrete entry is required.（required）
- `plan.technical_design.failure_handling`：At least one concrete entry is required.（required）
- `plan.technical_design.nonfunctional`：At least one concrete entry is required.（required）
- `plan.tasks`：At least one entry is required.（required）
- `plan.tasks`：Missing coverage: FUNC-023, FUNC-024, FUNC-025, FUNC-026, FUNC-027, FUNC-028, FUNC-029, FUNC-030, FUNC-031, FUNC-032, FUNC-033（coverage.features）
- `plan.tasks`：Missing coverage: AC-105, AC-106, AC-107, AC-108, AC-109, AC-110, AC-111, AC-112, AC-113, AC-114, AC-115, AC-116, AC-117, AC-118, AC-119, AC-120, AC-121, AC-122, AC-123, AC-124, AC-125, AC-126, AC-127, AC-128, AC-129, AC-130, AC-131, AC-132, AC-133, AC-134, AC-135, AC-136, AC-137, AC-138, AC-139, AC-140, AC-141, AC-142, AC-143, AC-144, AC-145, AC-146, AC-147, AC-148, AC-149, AC-150（coverage.acceptance）
- `plan.tasks.tests`：Missing coverage: AC-105, AC-106, AC-107, AC-108, AC-109, AC-110, AC-111, AC-112, AC-113, AC-114, AC-115, AC-116, AC-117, AC-118, AC-119, AC-120, AC-121, AC-122, AC-123, AC-124, AC-125, AC-126, AC-127, AC-128, AC-129, AC-130, AC-131, AC-132, AC-133, AC-134, AC-135, AC-136, AC-137, AC-138, AC-139, AC-140, AC-141, AC-142, AC-143, AC-144, AC-145, AC-146, AC-147, AC-148, AC-149, AC-150（coverage.tests）
- `plan.open_questions[0]`：Resolve blocking questions owned by this stage before export.（question.blocking）
- `plan.open_questions[1]`：Resolve blocking questions owned by this stage before export.（question.blocking）
- `plan.open_questions[2]`：Resolve blocking questions owned by this stage before export.（question.blocking）
- `plan.open_questions[3]`：Resolve blocking questions owned by this stage before export.（question.blocking）
- `plan.open_questions[4]`：Resolve blocking questions owned by this stage before export.（question.blocking）
- `plan.open_questions[5]`：Resolve blocking questions owned by this stage before export.（question.blocking）
- `plan.open_questions[6]`：Resolve blocking questions owned by this stage before export.（question.blocking）
- `plan.acceptance_checks[CHECK-105]`：Each product scenario needs a task test with the same ID.（acceptance_check.unimplemented）
- `plan.acceptance_checks[CHECK-106]`：Each product scenario needs a task test with the same ID.（acceptance_check.unimplemented）
- `plan.acceptance_checks[CHECK-107]`：Each product scenario needs a task test with the same ID.（acceptance_check.unimplemented）
- `plan.acceptance_checks[CHECK-108]`：Each product scenario needs a task test with the same ID.（acceptance_check.unimplemented）
- `plan.acceptance_checks[CHECK-109]`：Each product scenario needs a task test with the same ID.（acceptance_check.unimplemented）
- `plan.acceptance_checks[CHECK-110]`：Each product scenario needs a task test with the same ID.（acceptance_check.unimplemented）
- `plan.acceptance_checks[CHECK-111]`：Each product scenario needs a task test with the same ID.（acceptance_check.unimplemented）
- `plan.acceptance_checks[CHECK-112]`：Each product scenario needs a task test with the same ID.（acceptance_check.unimplemented）
- `plan.acceptance_checks[CHECK-113]`：Each product scenario needs a task test with the same ID.（acceptance_check.unimplemented）
- `plan.acceptance_checks[CHECK-114]`：Each product scenario needs a task test with the same ID.（acceptance_check.unimplemented）
- `plan.acceptance_checks[CHECK-115]`：Each product scenario needs a task test with the same ID.（acceptance_check.unimplemented）
- `plan.acceptance_checks[CHECK-116]`：Each product scenario needs a task test with the same ID.（acceptance_check.unimplemented）
- `plan.acceptance_checks[CHECK-117]`：Each product scenario needs a task test with the same ID.（acceptance_check.unimplemented）
- `plan.acceptance_checks[CHECK-118]`：Each product scenario needs a task test with the same ID.（acceptance_check.unimplemented）
- `plan.acceptance_checks[CHECK-119]`：Each product scenario needs a task test with the same ID.（acceptance_check.unimplemented）
- `plan.acceptance_checks[CHECK-120]`：Each product scenario needs a task test with the same ID.（acceptance_check.unimplemented）
- `plan.acceptance_checks[CHECK-121]`：Each product scenario needs a task test with the same ID.（acceptance_check.unimplemented）
- `plan.acceptance_checks[CHECK-122]`：Each product scenario needs a task test with the same ID.（acceptance_check.unimplemented）
- `plan.acceptance_checks[CHECK-123]`：Each product scenario needs a task test with the same ID.（acceptance_check.unimplemented）
- `plan.acceptance_checks[CHECK-124]`：Each product scenario needs a task test with the same ID.（acceptance_check.unimplemented）
- `plan.acceptance_checks[CHECK-125]`：Each product scenario needs a task test with the same ID.（acceptance_check.unimplemented）
- `plan.acceptance_checks[CHECK-126]`：Each product scenario needs a task test with the same ID.（acceptance_check.unimplemented）
- `plan.acceptance_checks[CHECK-127]`：Each product scenario needs a task test with the same ID.（acceptance_check.unimplemented）
- `plan.acceptance_checks[CHECK-128]`：Each product scenario needs a task test with the same ID.（acceptance_check.unimplemented）
- `plan.acceptance_checks[CHECK-129]`：Each product scenario needs a task test with the same ID.（acceptance_check.unimplemented）
- `plan.acceptance_checks[CHECK-130]`：Each product scenario needs a task test with the same ID.（acceptance_check.unimplemented）
- `plan.acceptance_checks[CHECK-131]`：Each product scenario needs a task test with the same ID.（acceptance_check.unimplemented）
- `plan.acceptance_checks[CHECK-132]`：Each product scenario needs a task test with the same ID.（acceptance_check.unimplemented）
- `plan.acceptance_checks[CHECK-133]`：Each product scenario needs a task test with the same ID.（acceptance_check.unimplemented）
- `plan.acceptance_checks[CHECK-134]`：Each product scenario needs a task test with the same ID.（acceptance_check.unimplemented）
- `plan.acceptance_checks[CHECK-135]`：Each product scenario needs a task test with the same ID.（acceptance_check.unimplemented）
- `plan.acceptance_checks[CHECK-136]`：Each product scenario needs a task test with the same ID.（acceptance_check.unimplemented）
- `plan.acceptance_checks[CHECK-137]`：Each product scenario needs a task test with the same ID.（acceptance_check.unimplemented）
- `plan.acceptance_checks[CHECK-138]`：Each product scenario needs a task test with the same ID.（acceptance_check.unimplemented）
- `plan.acceptance_checks[CHECK-139]`：Each product scenario needs a task test with the same ID.（acceptance_check.unimplemented）
- `plan.acceptance_checks[CHECK-140]`：Each product scenario needs a task test with the same ID.（acceptance_check.unimplemented）
- `plan.acceptance_checks[CHECK-141]`：Each product scenario needs a task test with the same ID.（acceptance_check.unimplemented）
- `plan.acceptance_checks[CHECK-142]`：Each product scenario needs a task test with the same ID.（acceptance_check.unimplemented）
- `plan.acceptance_checks[CHECK-143]`：Each product scenario needs a task test with the same ID.（acceptance_check.unimplemented）
- `plan.acceptance_checks[CHECK-144]`：Each product scenario needs a task test with the same ID.（acceptance_check.unimplemented）
- `plan.acceptance_checks[CHECK-145]`：Each product scenario needs a task test with the same ID.（acceptance_check.unimplemented）
- `plan.acceptance_checks[CHECK-146]`：Each product scenario needs a task test with the same ID.（acceptance_check.unimplemented）
- `plan.acceptance_checks[CHECK-147]`：Each product scenario needs a task test with the same ID.（acceptance_check.unimplemented）
- `plan.acceptance_checks[CHECK-148]`：Each product scenario needs a task test with the same ID.（acceptance_check.unimplemented）
- `plan.acceptance_checks[CHECK-149]`：Each product scenario needs a task test with the same ID.（acceptance_check.unimplemented）
- `plan.acceptance_checks[CHECK-150]`：Each product scenario needs a task test with the same ID.（acceptance_check.unimplemented）
- `plan.acceptance_checks[CHECK-AUTH]`：Each product scenario needs a task test with the same ID.（acceptance_check.unimplemented）
- `plan.acceptance_checks[CHECK-CALL-VERSION]`：Each product scenario needs a task test with the same ID.（acceptance_check.unimplemented）
- `plan.acceptance_checks[CHECK-REFERENCE-RACE]`：Each product scenario needs a task test with the same ID.（acceptance_check.unimplemented）
- `plan.acceptance_checks[CHECK-IMPLICIT-REFERENCE]`：Each product scenario needs a task test with the same ID.（acceptance_check.unimplemented）
- `plan.acceptance_checks[CHECK-OPTIONAL-CHAIN]`：Each product scenario needs a task test with the same ID.（acceptance_check.unimplemented）
- `plan.acceptance_checks[CHECK-QUERY-RACE]`：Each product scenario needs a task test with the same ID.（acceptance_check.unimplemented）
- `plan.acceptance_checks[CHECK-IMPORT-RACE]`：Each product scenario needs a task test with the same ID.（acceptance_check.unimplemented）
- `plan.acceptance_checks[CHECK-EMPTY-CATALOG]`：Each product scenario needs a task test with the same ID.（acceptance_check.unimplemented）
- `plan.acceptance_checks[CHECK-HISTORY-ISOLATION]`：Each product scenario needs a task test with the same ID.（acceptance_check.unimplemented）
- `plan.acceptance_checks[CHECK-DRAFT-RESULT]`：Each product scenario needs a task test with the same ID.（acceptance_check.unimplemented）
- `plan.acceptance_checks[CHECK-UNCONNECTED]`：Each product scenario needs a task test with the same ID.（acceptance_check.unimplemented）
- `plan.acceptance_checks[CHECK-ARCHIVE-CLOSURE]`：Each product scenario needs a task test with the same ID.（acceptance_check.unimplemented）
- `plan.acceptance_checks[CHECK-FIELD-LIFECYCLE]`：Each product scenario needs a task test with the same ID.（acceptance_check.unimplemented）
- `plan.acceptance_checks[CHECK-REFERENCE-EDIT]`：Each product scenario needs a task test with the same ID.（acceptance_check.unimplemented）
- `plan.logic.locals[LOCAL-DICT-CREATE].module`：Local logic must name an engineering module.（logic.local.module）
- `plan.logic.locals[LOCAL-DICT-EDIT].module`：Local logic must name an engineering module.（logic.local.module）
- `plan.logic.locals[LOCAL-DICT-ENABLE].module`：Local logic must name an engineering module.（logic.local.module）
- `plan.logic.locals[LOCAL-DICT-DISABLE].module`：Local logic must name an engineering module.（logic.local.module）
- `plan.logic.locals[LOCAL-TENANT-GRANT].module`：Local logic must name an engineering module.（logic.local.module）
- `plan.logic.locals[LOCAL-TENANT-REVOKE].module`：Local logic must name an engineering module.（logic.local.module）
- `plan.logic.locals[LOCAL-FIELD-SAVE].module`：Local logic must name an engineering module.（logic.local.module）
- `plan.logic.locals[LOCAL-CLASS-FIELDS-SAVE].module`：Local logic must name an engineering module.（logic.local.module）
- `plan.logic.locals[LOCAL-CALL-FORM].module`：Local logic must name an engineering module.（logic.local.module）
- `plan.logic.locals[LOCAL-SERIES-QUERY].module`：Local logic must name an engineering module.（logic.local.module）
- `plan.logic.locals[LOCAL-GENERIC-QUERY].module`：Local logic must name an engineering module.（logic.local.module）
- `plan.logic.locals[LOCAL-IMPORT-CONFIRM].module`：Local logic must name an engineering module.（logic.local.module）
- `plan.logic.locals[LOCAL-FOLLOWUP-SAVE].module`：Local logic must name an engineering module.（logic.local.module）
- `plan.logic.locals[LOCAL-READ-CALL].module`：Local logic must name an engineering module.（logic.local.module）
- `plan.logic.locals[LOCAL-READ-CUSTOMER].module`：Local logic must name an engineering module.（logic.local.module）
- `plan.logic.locals[LOCAL-DICT-DELETE].module`：Local logic must name an engineering module.（logic.local.module）
- `plan.logic.locals[LOCAL-FIELD-DELETE].module`：Local logic must name an engineering module.（logic.local.module）
- `plan.logic.locals[LOCAL-CATEGORY-RETIRE].module`：Local logic must name an engineering module.（logic.local.module）
- `plan.logic.locals[LOCAL-FIELD-ENABLE].module`：Local logic must name an engineering module.（logic.local.module）
- `plan.logic.locals[LOCAL-FIELD-DISABLE].module`：Local logic must name an engineering module.（logic.local.module）
- `plan.logic.fields[FIELD-DICT-ID].interface_note`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-DICT-ID].persistence.mapping`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-DICT-ID].interfaces`：Expected an array of objects.（logic.type.array）
- `plan.logic.fields[FIELD-DICT-NAME].interface_note`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-DICT-NAME].persistence.mapping`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-DICT-NAME].interfaces`：Expected an array of objects.（logic.type.array）
- `plan.logic.fields[FIELD-CAPABILITY].interface_note`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-CAPABILITY].persistence.mapping`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-CAPABILITY].interfaces`：Expected an array of objects.（logic.type.array）
- `plan.logic.fields[FIELD-TENANT-GRANTS].interface_note`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-TENANT-GRANTS].persistence.mapping`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-TENANT-GRANTS].interfaces`：Expected an array of objects.（logic.type.array）
- `plan.logic.fields[FIELD-DICT-ENABLED].interface_note`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-DICT-ENABLED].persistence.mapping`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-DICT-ENABLED].interfaces`：Expected an array of objects.（logic.type.array）
- `plan.logic.fields[FIELD-DEFINITION-ID].interface_note`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-DEFINITION-ID].persistence.mapping`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-DEFINITION-ID].interfaces`：Expected an array of objects.（logic.type.array）
- `plan.logic.fields[FIELD-DEFINITION-LABEL].interface_note`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-DEFINITION-LABEL].persistence.mapping`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-DEFINITION-LABEL].interfaces`：Expected an array of objects.（logic.type.array）
- `plan.logic.fields[FIELD-DEFINITION-TYPE].interface_note`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-DEFINITION-TYPE].persistence.mapping`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-DEFINITION-TYPE].interfaces`：Expected an array of objects.（logic.type.array）
- `plan.logic.fields[FIELD-DICTIONARY-REF].interface_note`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-DICTIONARY-REF].persistence.mapping`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-DICTIONARY-REF].interfaces`：Expected an array of objects.（logic.type.array）
- `plan.logic.fields[FIELD-USE-UPSTREAM].interface_note`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-USE-UPSTREAM].persistence.mapping`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-USE-UPSTREAM].interfaces`：Expected an array of objects.（logic.type.array）
- `plan.logic.fields[FIELD-UPSTREAM-ID].interface_note`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-UPSTREAM-ID].persistence.mapping`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-UPSTREAM-ID].interfaces`：Expected an array of objects.（logic.type.array）
- `plan.logic.fields[FIELD-UPSTREAM-PROPERTY].interface_note`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-UPSTREAM-PROPERTY].persistence.mapping`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-UPSTREAM-PROPERTY].interfaces`：Expected an array of objects.（logic.type.array）
- `plan.logic.fields[FIELD-DOWNSTREAM-PARAM].interface_note`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-DOWNSTREAM-PARAM].persistence.mapping`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-DOWNSTREAM-PARAM].interfaces`：Expected an array of objects.（logic.type.array）
- `plan.logic.fields[FIELD-QUERY-REQUIRED].interface_note`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-QUERY-REQUIRED].persistence.mapping`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-QUERY-REQUIRED].interfaces`：Expected an array of objects.（logic.type.array）
- `plan.logic.fields[FIELD-DEPENDENCY-SUMMARY].interface_note`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-DEPENDENCY-SUMMARY].persistence.mapping`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-DEPENDENCY-SUMMARY].interfaces`：Expected an array of objects.（logic.type.array）
- `plan.logic.fields[FIELD-DEFINITION].interface_note`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-DEFINITION].persistence.mapping`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-DEFINITION].interfaces`：Expected an array of objects.（logic.type.array）
- `plan.logic.fields[FIELD-CLASS-REQUIRED].interface_note`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-CLASS-REQUIRED].persistence.mapping`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-CLASS-REQUIRED].interfaces`：Expected an array of objects.（logic.type.array）
- `plan.logic.fields[FIELD-CLASS-VISIBLE].interface_note`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-CLASS-VISIBLE].persistence.mapping`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-CLASS-VISIBLE].interfaces`：Expected an array of objects.（logic.type.array）
- `plan.logic.fields[FIELD-CLASS-ORDER].interface_note`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-CLASS-ORDER].persistence.mapping`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-CLASS-ORDER].interfaces`：Expected an array of objects.（logic.type.array）
- `plan.logic.fields[FIELD-CLASS-FIELD-REFS].interface_note`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-CLASS-FIELD-REFS].persistence.mapping`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-CLASS-FIELD-REFS].interfaces`：Expected an array of objects.（logic.type.array）
- `plan.logic.fields[FIELD-CATEGORY-DEFINITION].interface_note`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-CATEGORY-DEFINITION].persistence.mapping`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-CATEGORY-DEFINITION].interfaces`：Expected an array of objects.（logic.type.array）
- `plan.logic.fields[FIELD-CATEGORY-ARCHIVE].interface_note`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-CATEGORY-ARCHIVE].persistence.mapping`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-CATEGORY-ARCHIVE].interfaces`：Expected an array of objects.（logic.type.array）
- `plan.logic.fields[FIELD-CALL-CONTEXT].interface_note`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-CALL-CONTEXT].persistence.mapping`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-CALL-CONTEXT].interfaces`：Expected an array of objects.（logic.type.array）
- `plan.logic.fields[FIELD-CALL-VERSION].interface_note`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-CALL-VERSION].persistence.mapping`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-CALL-VERSION].interfaces`：Expected an array of objects.（logic.type.array）
- `plan.logic.fields[FIELD-OFFICIAL-SERIES-ID].interface_note`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-OFFICIAL-SERIES-ID].persistence.mapping`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-OFFICIAL-SERIES-ID].interfaces`：Expected an array of objects.（logic.type.array）
- `plan.logic.fields[FIELD-SERIES-CODE].interface_note`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-SERIES-CODE].persistence.mapping`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-SERIES-CODE].interfaces`：Expected an array of objects.（logic.type.array）
- `plan.logic.fields[FIELD-SERIES-NAME].interface_note`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-SERIES-NAME].persistence.mapping`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-SERIES-NAME].interfaces`：Expected an array of objects.（logic.type.array）
- `plan.logic.fields[FIELD-SERIES-MEDIA-ID].interface_note`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-SERIES-MEDIA-ID].persistence.mapping`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-SERIES-MEDIA-ID].interfaces`：Expected an array of objects.（logic.type.array）
- `plan.logic.fields[FIELD-SERIES-SOURCE-STATE].interface_note`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-SERIES-SOURCE-STATE].persistence.mapping`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-SERIES-SOURCE-STATE].interfaces`：Expected an array of objects.（logic.type.array）
- `plan.logic.fields[FIELD-SERIES-SELECTION].interface_note`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-SERIES-SELECTION].persistence.mapping`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-SERIES-SELECTION].interfaces`：Expected an array of objects.（logic.type.array）
- `plan.logic.fields[FIELD-MAPPING-MEDIA-FILTER].interface_note`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-MAPPING-MEDIA-FILTER].persistence.mapping`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-MAPPING-MEDIA-FILTER].interfaces`：Expected an array of objects.（logic.type.array）
- `plan.logic.fields[FIELD-MAPPING-STATE-FILTER].interface_note`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-MAPPING-STATE-FILTER].persistence.mapping`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-MAPPING-STATE-FILTER].interfaces`：Expected an array of objects.（logic.type.array）
- `plan.logic.fields[FIELD-PLANNED-STORE].interface_note`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-PLANNED-STORE].persistence.mapping`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-PLANNED-STORE].interfaces`：Expected an array of objects.（logic.type.array）
- `plan.logic.fields[FIELD-IMPORTED-INTENTION].interface_note`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-IMPORTED-INTENTION].persistence.mapping`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-IMPORTED-INTENTION].interfaces`：Expected an array of objects.（logic.type.array）
- `plan.logic.fields[FIELD-OTHER-BUSINESS-VALUES].interface_note`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-OTHER-BUSINESS-VALUES].persistence.mapping`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-OTHER-BUSINESS-VALUES].interfaces`：Expected an array of objects.（logic.type.array）
- `plan.logic.fields[FIELD-SAVED-BUSINESS-SNAPSHOT].interface_note`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-SAVED-BUSINESS-SNAPSHOT].persistence.mapping`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-SAVED-BUSINESS-SNAPSHOT].interfaces`：Expected an array of objects.（logic.type.array）
- `plan.logic.fields[FIELD-DEFINITION-ENABLED].interface_note`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-DEFINITION-ENABLED].persistence.mapping`：Provide an explicit nonempty statement.（logic.required.text）
- `plan.logic.fields[FIELD-DEFINITION-ENABLED].interfaces`：Expected an array of objects.（logic.type.array）
- `plan.logic.units[BR-023].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[BR-023].test_refs`：Unknown task test: CHECK-123（logic.test.unknown）
- `plan.logic.units[BR-023].test_refs`：Unknown task test: CHECK-AUTH（logic.test.unknown）
- `plan.logic.units[BR-023].test_refs`：Unknown task test: CHECK-IMPLICIT-REFERENCE（logic.test.unknown）
- `plan.logic.units[BR-023].test_refs`：Unknown task test: CHECK-105（logic.test.unknown）
- `plan.logic.units[BR-023].test_refs`：Unknown task test: CHECK-130（logic.test.unknown）
- `plan.logic.units[BR-023].test_refs`：Unknown task test: CHECK-127（logic.test.unknown）
- `plan.logic.units[BR-023].test_refs`：Unknown task test: CHECK-128（logic.test.unknown）
- `plan.logic.units[BR-023].test_refs`：Unknown task test: CHECK-REFERENCE-RACE（logic.test.unknown）
- `plan.logic.units[BR-023].test_refs`：Unknown task test: CHECK-122（logic.test.unknown）
- `plan.logic.units[BR-023].test_refs`：Unknown task test: CHECK-129（logic.test.unknown）
- `plan.logic.units[BR-023].test_refs`：Unknown task test: CHECK-131（logic.test.unknown）
- `plan.logic.units[BR-023].test_refs`：Unknown task test: CHECK-106（logic.test.unknown）
- `plan.logic.units[BR-023].test_refs`：Unknown task test: CHECK-107（logic.test.unknown）
- `plan.logic.units[BR-024].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[BR-024].test_refs`：Unknown task test: CHECK-117（logic.test.unknown）
- `plan.logic.units[BR-024].test_refs`：Unknown task test: CHECK-137（logic.test.unknown）
- `plan.logic.units[BR-024].test_refs`：Unknown task test: CHECK-130（logic.test.unknown）
- `plan.logic.units[BR-024].test_refs`：Unknown task test: CHECK-138（logic.test.unknown）
- `plan.logic.units[BR-024].test_refs`：Unknown task test: CHECK-108（logic.test.unknown）
- `plan.logic.units[BR-024].test_refs`：Unknown task test: CHECK-133（logic.test.unknown）
- `plan.logic.units[BR-024].test_refs`：Unknown task test: CHECK-125（logic.test.unknown）
- `plan.logic.units[BR-024].test_refs`：Unknown task test: CHECK-132（logic.test.unknown）
- `plan.logic.units[BR-024].test_refs`：Unknown task test: CHECK-135（logic.test.unknown）
- `plan.logic.units[BR-024].test_refs`：Unknown task test: CHECK-118（logic.test.unknown）
- `plan.logic.units[BR-024].test_refs`：Unknown task test: CHECK-115（logic.test.unknown）
- `plan.logic.units[BR-024].test_refs`：Unknown task test: CHECK-OPTIONAL-CHAIN（logic.test.unknown）
- `plan.logic.units[BR-024].test_refs`：Unknown task test: CHECK-UNCONNECTED（logic.test.unknown）
- `plan.logic.units[BR-024].test_refs`：Unknown task test: CHECK-127（logic.test.unknown）
- `plan.logic.units[BR-024].test_refs`：Unknown task test: CHECK-112（logic.test.unknown）
- `plan.logic.units[BR-024].test_refs`：Unknown task test: CHECK-106（logic.test.unknown）
- `plan.logic.units[BR-024].test_refs`：Unknown task test: CHECK-DRAFT-RESULT（logic.test.unknown）
- `plan.logic.units[BR-024].test_refs`：Unknown task test: CHECK-CALL-VERSION（logic.test.unknown）
- `plan.logic.units[BR-024].test_refs`：Unknown task test: CHECK-AUTH（logic.test.unknown）
- `plan.logic.units[BR-024].test_refs`：Unknown task test: CHECK-105（logic.test.unknown）
- `plan.logic.units[BR-024].test_refs`：Unknown task test: CHECK-IMPORT-RACE（logic.test.unknown）
- `plan.logic.units[BR-024].test_refs`：Unknown task test: CHECK-129（logic.test.unknown）
- `plan.logic.units[BR-024].test_refs`：Unknown task test: CHECK-119（logic.test.unknown）
- `plan.logic.units[BR-024].test_refs`：Unknown task test: CHECK-131（logic.test.unknown）
- `plan.logic.units[BR-024].test_refs`：Unknown task test: CHECK-HISTORY-ISOLATION（logic.test.unknown）
- `plan.logic.units[BR-024].test_refs`：Unknown task test: CHECK-107（logic.test.unknown）
- `plan.logic.units[BR-024].test_refs`：Unknown task test: CHECK-113（logic.test.unknown）
- `plan.logic.units[BR-024].test_refs`：Unknown task test: CHECK-126（logic.test.unknown）
- `plan.logic.units[BR-024].test_refs`：Unknown task test: CHECK-QUERY-RACE（logic.test.unknown）
- `plan.logic.units[BR-024].test_refs`：Unknown task test: CHECK-136（logic.test.unknown）
- `plan.logic.units[BR-024].test_refs`：Unknown task test: CHECK-114（logic.test.unknown）
- `plan.logic.units[BR-025].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[BR-025].test_refs`：Unknown task test: CHECK-117（logic.test.unknown）
- `plan.logic.units[BR-025].test_refs`：Unknown task test: CHECK-137（logic.test.unknown）
- `plan.logic.units[BR-025].test_refs`：Unknown task test: CHECK-130（logic.test.unknown）
- `plan.logic.units[BR-025].test_refs`：Unknown task test: CHECK-138（logic.test.unknown）
- `plan.logic.units[BR-025].test_refs`：Unknown task test: CHECK-122（logic.test.unknown）
- `plan.logic.units[BR-025].test_refs`：Unknown task test: CHECK-133（logic.test.unknown）
- `plan.logic.units[BR-025].test_refs`：Unknown task test: CHECK-125（logic.test.unknown）
- `plan.logic.units[BR-025].test_refs`：Unknown task test: CHECK-135（logic.test.unknown）
- `plan.logic.units[BR-025].test_refs`：Unknown task test: CHECK-132（logic.test.unknown）
- `plan.logic.units[BR-025].test_refs`：Unknown task test: CHECK-118（logic.test.unknown）
- `plan.logic.units[BR-025].test_refs`：Unknown task test: CHECK-115（logic.test.unknown）
- `plan.logic.units[BR-025].test_refs`：Unknown task test: CHECK-123（logic.test.unknown）
- `plan.logic.units[BR-025].test_refs`：Unknown task test: CHECK-OPTIONAL-CHAIN（logic.test.unknown）
- `plan.logic.units[BR-025].test_refs`：Unknown task test: CHECK-UNCONNECTED（logic.test.unknown）
- `plan.logic.units[BR-025].test_refs`：Unknown task test: CHECK-112（logic.test.unknown）
- `plan.logic.units[BR-025].test_refs`：Unknown task test: CHECK-DRAFT-RESULT（logic.test.unknown）
- `plan.logic.units[BR-025].test_refs`：Unknown task test: CHECK-CALL-VERSION（logic.test.unknown）
- `plan.logic.units[BR-025].test_refs`：Unknown task test: CHECK-IMPORT-RACE（logic.test.unknown）
- `plan.logic.units[BR-025].test_refs`：Unknown task test: CHECK-131（logic.test.unknown）
- `plan.logic.units[BR-025].test_refs`：Unknown task test: CHECK-119（logic.test.unknown）
- `plan.logic.units[BR-025].test_refs`：Unknown task test: CHECK-HISTORY-ISOLATION（logic.test.unknown）
- `plan.logic.units[BR-025].test_refs`：Unknown task test: CHECK-107（logic.test.unknown）
- `plan.logic.units[BR-025].test_refs`：Unknown task test: CHECK-113（logic.test.unknown）
- `plan.logic.units[BR-025].test_refs`：Unknown task test: CHECK-126（logic.test.unknown）
- `plan.logic.units[BR-025].test_refs`：Unknown task test: CHECK-QUERY-RACE（logic.test.unknown）
- `plan.logic.units[BR-025].test_refs`：Unknown task test: CHECK-136（logic.test.unknown）
- `plan.logic.units[BR-025].test_refs`：Unknown task test: CHECK-114（logic.test.unknown）
- `plan.logic.units[BR-026].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[BR-026].test_refs`：Unknown task test: CHECK-OPTIONAL-CHAIN（logic.test.unknown）
- `plan.logic.units[BR-026].test_refs`：Unknown task test: CHECK-124（logic.test.unknown）
- `plan.logic.units[BR-026].test_refs`：Unknown task test: CHECK-110（logic.test.unknown）
- `plan.logic.units[BR-026].test_refs`：Unknown task test: CHECK-109（logic.test.unknown）
- `plan.logic.units[BR-026].test_refs`：Unknown task test: CHECK-120（logic.test.unknown）
- `plan.logic.units[BR-026].test_refs`：Unknown task test: CHECK-111（logic.test.unknown）
- `plan.logic.units[BR-026].test_refs`：Unknown task test: CHECK-121（logic.test.unknown）
- `plan.logic.units[BR-027].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[BR-027].test_refs`：Unknown task test: CHECK-117（logic.test.unknown）
- `plan.logic.units[BR-027].test_refs`：Unknown task test: CHECK-137（logic.test.unknown）
- `plan.logic.units[BR-027].test_refs`：Unknown task test: CHECK-138（logic.test.unknown）
- `plan.logic.units[BR-027].test_refs`：Unknown task test: CHECK-124（logic.test.unknown）
- `plan.logic.units[BR-027].test_refs`：Unknown task test: CHECK-110（logic.test.unknown）
- `plan.logic.units[BR-027].test_refs`：Unknown task test: CHECK-133（logic.test.unknown）
- `plan.logic.units[BR-027].test_refs`：Unknown task test: CHECK-125（logic.test.unknown）
- `plan.logic.units[BR-027].test_refs`：Unknown task test: CHECK-132（logic.test.unknown）
- `plan.logic.units[BR-027].test_refs`：Unknown task test: CHECK-135（logic.test.unknown）
- `plan.logic.units[BR-027].test_refs`：Unknown task test: CHECK-118（logic.test.unknown）
- `plan.logic.units[BR-027].test_refs`：Unknown task test: CHECK-115（logic.test.unknown）
- `plan.logic.units[BR-027].test_refs`：Unknown task test: CHECK-OPTIONAL-CHAIN（logic.test.unknown）
- `plan.logic.units[BR-027].test_refs`：Unknown task test: CHECK-UNCONNECTED（logic.test.unknown）
- `plan.logic.units[BR-027].test_refs`：Unknown task test: CHECK-109（logic.test.unknown）
- `plan.logic.units[BR-027].test_refs`：Unknown task test: CHECK-112（logic.test.unknown）
- `plan.logic.units[BR-027].test_refs`：Unknown task test: CHECK-DRAFT-RESULT（logic.test.unknown）
- `plan.logic.units[BR-027].test_refs`：Unknown task test: CHECK-CALL-VERSION（logic.test.unknown）
- `plan.logic.units[BR-027].test_refs`：Unknown task test: CHECK-IMPORT-RACE（logic.test.unknown）
- `plan.logic.units[BR-027].test_refs`：Unknown task test: CHECK-119（logic.test.unknown）
- `plan.logic.units[BR-027].test_refs`：Unknown task test: CHECK-HISTORY-ISOLATION（logic.test.unknown）
- `plan.logic.units[BR-027].test_refs`：Unknown task test: CHECK-113（logic.test.unknown）
- `plan.logic.units[BR-027].test_refs`：Unknown task test: CHECK-121（logic.test.unknown）
- `plan.logic.units[BR-027].test_refs`：Unknown task test: CHECK-126（logic.test.unknown）
- `plan.logic.units[BR-027].test_refs`：Unknown task test: CHECK-QUERY-RACE（logic.test.unknown）
- `plan.logic.units[BR-027].test_refs`：Unknown task test: CHECK-120（logic.test.unknown）
- `plan.logic.units[BR-027].test_refs`：Unknown task test: CHECK-136（logic.test.unknown）
- `plan.logic.units[BR-027].test_refs`：Unknown task test: CHECK-111（logic.test.unknown）
- `plan.logic.units[BR-027].test_refs`：Unknown task test: CHECK-114（logic.test.unknown）
- `plan.logic.units[BR-028].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[BR-028].test_refs`：Unknown task test: CHECK-117（logic.test.unknown）
- `plan.logic.units[BR-028].test_refs`：Unknown task test: CHECK-137（logic.test.unknown）
- `plan.logic.units[BR-028].test_refs`：Unknown task test: CHECK-138（logic.test.unknown）
- `plan.logic.units[BR-028].test_refs`：Unknown task test: CHECK-133（logic.test.unknown）
- `plan.logic.units[BR-028].test_refs`：Unknown task test: CHECK-125（logic.test.unknown）
- `plan.logic.units[BR-028].test_refs`：Unknown task test: CHECK-135（logic.test.unknown）
- `plan.logic.units[BR-028].test_refs`：Unknown task test: CHECK-132（logic.test.unknown）
- `plan.logic.units[BR-028].test_refs`：Unknown task test: CHECK-118（logic.test.unknown）
- `plan.logic.units[BR-028].test_refs`：Unknown task test: CHECK-115（logic.test.unknown）
- `plan.logic.units[BR-028].test_refs`：Unknown task test: CHECK-OPTIONAL-CHAIN（logic.test.unknown）
- `plan.logic.units[BR-028].test_refs`：Unknown task test: CHECK-UNCONNECTED（logic.test.unknown）
- `plan.logic.units[BR-028].test_refs`：Unknown task test: CHECK-112（logic.test.unknown）
- `plan.logic.units[BR-028].test_refs`：Unknown task test: CHECK-DRAFT-RESULT（logic.test.unknown）
- `plan.logic.units[BR-028].test_refs`：Unknown task test: CHECK-IMPORT-RACE（logic.test.unknown）
- `plan.logic.units[BR-028].test_refs`：Unknown task test: CHECK-114（logic.test.unknown）
- `plan.logic.units[BR-028].test_refs`：Unknown task test: CHECK-119（logic.test.unknown）
- `plan.logic.units[BR-028].test_refs`：Unknown task test: CHECK-HISTORY-ISOLATION（logic.test.unknown）
- `plan.logic.units[BR-028].test_refs`：Unknown task test: CHECK-113（logic.test.unknown）
- `plan.logic.units[BR-028].test_refs`：Unknown task test: CHECK-126（logic.test.unknown）
- `plan.logic.units[BR-028].test_refs`：Unknown task test: CHECK-QUERY-RACE（logic.test.unknown）
- `plan.logic.units[BR-028].test_refs`：Unknown task test: CHECK-136（logic.test.unknown）
- `plan.logic.units[BR-028].test_refs`：Unknown task test: CHECK-CALL-VERSION（logic.test.unknown）
- `plan.logic.units[BR-029].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[BR-029].test_refs`：Unknown task test: CHECK-117（logic.test.unknown）
- `plan.logic.units[BR-029].test_refs`：Unknown task test: CHECK-137（logic.test.unknown）
- `plan.logic.units[BR-029].test_refs`：Unknown task test: CHECK-138（logic.test.unknown）
- `plan.logic.units[BR-029].test_refs`：Unknown task test: CHECK-133（logic.test.unknown）
- `plan.logic.units[BR-029].test_refs`：Unknown task test: CHECK-125（logic.test.unknown）
- `plan.logic.units[BR-029].test_refs`：Unknown task test: CHECK-135（logic.test.unknown）
- `plan.logic.units[BR-029].test_refs`：Unknown task test: CHECK-132（logic.test.unknown）
- `plan.logic.units[BR-029].test_refs`：Unknown task test: CHECK-118（logic.test.unknown）
- `plan.logic.units[BR-029].test_refs`：Unknown task test: CHECK-115（logic.test.unknown）
- `plan.logic.units[BR-029].test_refs`：Unknown task test: CHECK-OPTIONAL-CHAIN（logic.test.unknown）
- `plan.logic.units[BR-029].test_refs`：Unknown task test: CHECK-UNCONNECTED（logic.test.unknown）
- `plan.logic.units[BR-029].test_refs`：Unknown task test: CHECK-112（logic.test.unknown）
- `plan.logic.units[BR-029].test_refs`：Unknown task test: CHECK-DRAFT-RESULT（logic.test.unknown）
- `plan.logic.units[BR-029].test_refs`：Unknown task test: CHECK-IMPORT-RACE（logic.test.unknown）
- `plan.logic.units[BR-029].test_refs`：Unknown task test: CHECK-114（logic.test.unknown）
- `plan.logic.units[BR-029].test_refs`：Unknown task test: CHECK-119（logic.test.unknown）
- `plan.logic.units[BR-029].test_refs`：Unknown task test: CHECK-HISTORY-ISOLATION（logic.test.unknown）
- `plan.logic.units[BR-029].test_refs`：Unknown task test: CHECK-113（logic.test.unknown）
- `plan.logic.units[BR-029].test_refs`：Unknown task test: CHECK-126（logic.test.unknown）
- `plan.logic.units[BR-029].test_refs`：Unknown task test: CHECK-QUERY-RACE（logic.test.unknown）
- `plan.logic.units[BR-029].test_refs`：Unknown task test: CHECK-136（logic.test.unknown）
- `plan.logic.units[BR-029].test_refs`：Unknown task test: CHECK-CALL-VERSION（logic.test.unknown）
- `plan.logic.units[BR-030].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[BR-030].test_refs`：Unknown task test: CHECK-117（logic.test.unknown）
- `plan.logic.units[BR-030].test_refs`：Unknown task test: CHECK-137（logic.test.unknown）
- `plan.logic.units[BR-030].test_refs`：Unknown task test: CHECK-138（logic.test.unknown）
- `plan.logic.units[BR-030].test_refs`：Unknown task test: CHECK-133（logic.test.unknown）
- `plan.logic.units[BR-030].test_refs`：Unknown task test: CHECK-125（logic.test.unknown）
- `plan.logic.units[BR-030].test_refs`：Unknown task test: CHECK-135（logic.test.unknown）
- `plan.logic.units[BR-030].test_refs`：Unknown task test: CHECK-132（logic.test.unknown）
- `plan.logic.units[BR-030].test_refs`：Unknown task test: CHECK-118（logic.test.unknown）
- `plan.logic.units[BR-030].test_refs`：Unknown task test: CHECK-115（logic.test.unknown）
- `plan.logic.units[BR-030].test_refs`：Unknown task test: CHECK-OPTIONAL-CHAIN（logic.test.unknown）
- `plan.logic.units[BR-030].test_refs`：Unknown task test: CHECK-UNCONNECTED（logic.test.unknown）
- `plan.logic.units[BR-030].test_refs`：Unknown task test: CHECK-112（logic.test.unknown）
- `plan.logic.units[BR-030].test_refs`：Unknown task test: CHECK-DRAFT-RESULT（logic.test.unknown）
- `plan.logic.units[BR-030].test_refs`：Unknown task test: CHECK-IMPORT-RACE（logic.test.unknown）
- `plan.logic.units[BR-030].test_refs`：Unknown task test: CHECK-114（logic.test.unknown）
- `plan.logic.units[BR-030].test_refs`：Unknown task test: CHECK-119（logic.test.unknown）
- `plan.logic.units[BR-030].test_refs`：Unknown task test: CHECK-HISTORY-ISOLATION（logic.test.unknown）
- `plan.logic.units[BR-030].test_refs`：Unknown task test: CHECK-113（logic.test.unknown）
- `plan.logic.units[BR-030].test_refs`：Unknown task test: CHECK-126（logic.test.unknown）
- `plan.logic.units[BR-030].test_refs`：Unknown task test: CHECK-QUERY-RACE（logic.test.unknown）
- `plan.logic.units[BR-030].test_refs`：Unknown task test: CHECK-136（logic.test.unknown）
- `plan.logic.units[BR-030].test_refs`：Unknown task test: CHECK-CALL-VERSION（logic.test.unknown）
- `plan.logic.units[BR-031].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[BR-031].test_refs`：Unknown task test: CHECK-117（logic.test.unknown）
- `plan.logic.units[BR-031].test_refs`：Unknown task test: CHECK-137（logic.test.unknown）
- `plan.logic.units[BR-031].test_refs`：Unknown task test: CHECK-138（logic.test.unknown）
- `plan.logic.units[BR-031].test_refs`：Unknown task test: CHECK-133（logic.test.unknown）
- `plan.logic.units[BR-031].test_refs`：Unknown task test: CHECK-125（logic.test.unknown）
- `plan.logic.units[BR-031].test_refs`：Unknown task test: CHECK-135（logic.test.unknown）
- `plan.logic.units[BR-031].test_refs`：Unknown task test: CHECK-132（logic.test.unknown）
- `plan.logic.units[BR-031].test_refs`：Unknown task test: CHECK-118（logic.test.unknown）
- `plan.logic.units[BR-031].test_refs`：Unknown task test: CHECK-115（logic.test.unknown）
- `plan.logic.units[BR-031].test_refs`：Unknown task test: CHECK-OPTIONAL-CHAIN（logic.test.unknown）
- `plan.logic.units[BR-031].test_refs`：Unknown task test: CHECK-UNCONNECTED（logic.test.unknown）
- `plan.logic.units[BR-031].test_refs`：Unknown task test: CHECK-112（logic.test.unknown）
- `plan.logic.units[BR-031].test_refs`：Unknown task test: CHECK-DRAFT-RESULT（logic.test.unknown）
- `plan.logic.units[BR-031].test_refs`：Unknown task test: CHECK-IMPORT-RACE（logic.test.unknown）
- `plan.logic.units[BR-031].test_refs`：Unknown task test: CHECK-114（logic.test.unknown）
- `plan.logic.units[BR-031].test_refs`：Unknown task test: CHECK-119（logic.test.unknown）
- `plan.logic.units[BR-031].test_refs`：Unknown task test: CHECK-HISTORY-ISOLATION（logic.test.unknown）
- `plan.logic.units[BR-031].test_refs`：Unknown task test: CHECK-113（logic.test.unknown）
- `plan.logic.units[BR-031].test_refs`：Unknown task test: CHECK-126（logic.test.unknown）
- `plan.logic.units[BR-031].test_refs`：Unknown task test: CHECK-QUERY-RACE（logic.test.unknown）
- `plan.logic.units[BR-031].test_refs`：Unknown task test: CHECK-136（logic.test.unknown）
- `plan.logic.units[BR-031].test_refs`：Unknown task test: CHECK-CALL-VERSION（logic.test.unknown）
- `plan.logic.units[BR-032].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[BR-032].test_refs`：Unknown task test: CHECK-117（logic.test.unknown）
- `plan.logic.units[BR-032].test_refs`：Unknown task test: CHECK-137（logic.test.unknown）
- `plan.logic.units[BR-032].test_refs`：Unknown task test: CHECK-138（logic.test.unknown）
- `plan.logic.units[BR-032].test_refs`：Unknown task test: CHECK-133（logic.test.unknown）
- `plan.logic.units[BR-032].test_refs`：Unknown task test: CHECK-125（logic.test.unknown）
- `plan.logic.units[BR-032].test_refs`：Unknown task test: CHECK-135（logic.test.unknown）
- `plan.logic.units[BR-032].test_refs`：Unknown task test: CHECK-132（logic.test.unknown）
- `plan.logic.units[BR-032].test_refs`：Unknown task test: CHECK-118（logic.test.unknown）
- `plan.logic.units[BR-032].test_refs`：Unknown task test: CHECK-115（logic.test.unknown）
- `plan.logic.units[BR-032].test_refs`：Unknown task test: CHECK-OPTIONAL-CHAIN（logic.test.unknown）
- `plan.logic.units[BR-032].test_refs`：Unknown task test: CHECK-UNCONNECTED（logic.test.unknown）
- `plan.logic.units[BR-032].test_refs`：Unknown task test: CHECK-112（logic.test.unknown）
- `plan.logic.units[BR-032].test_refs`：Unknown task test: CHECK-DRAFT-RESULT（logic.test.unknown）
- `plan.logic.units[BR-032].test_refs`：Unknown task test: CHECK-IMPORT-RACE（logic.test.unknown）
- `plan.logic.units[BR-032].test_refs`：Unknown task test: CHECK-114（logic.test.unknown）
- `plan.logic.units[BR-032].test_refs`：Unknown task test: CHECK-119（logic.test.unknown）
- `plan.logic.units[BR-032].test_refs`：Unknown task test: CHECK-HISTORY-ISOLATION（logic.test.unknown）
- `plan.logic.units[BR-032].test_refs`：Unknown task test: CHECK-113（logic.test.unknown）
- `plan.logic.units[BR-032].test_refs`：Unknown task test: CHECK-126（logic.test.unknown）
- `plan.logic.units[BR-032].test_refs`：Unknown task test: CHECK-QUERY-RACE（logic.test.unknown）
- `plan.logic.units[BR-032].test_refs`：Unknown task test: CHECK-136（logic.test.unknown）
- `plan.logic.units[BR-032].test_refs`：Unknown task test: CHECK-CALL-VERSION（logic.test.unknown）
- `plan.logic.units[BR-033].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[BR-033].test_refs`：Unknown task test: CHECK-117（logic.test.unknown）
- `plan.logic.units[BR-033].test_refs`：Unknown task test: CHECK-137（logic.test.unknown）
- `plan.logic.units[BR-033].test_refs`：Unknown task test: CHECK-138（logic.test.unknown）
- `plan.logic.units[BR-033].test_refs`：Unknown task test: CHECK-133（logic.test.unknown）
- `plan.logic.units[BR-033].test_refs`：Unknown task test: CHECK-125（logic.test.unknown）
- `plan.logic.units[BR-033].test_refs`：Unknown task test: CHECK-135（logic.test.unknown）
- `plan.logic.units[BR-033].test_refs`：Unknown task test: CHECK-132（logic.test.unknown）
- `plan.logic.units[BR-033].test_refs`：Unknown task test: CHECK-118（logic.test.unknown）
- `plan.logic.units[BR-033].test_refs`：Unknown task test: CHECK-115（logic.test.unknown）
- `plan.logic.units[BR-033].test_refs`：Unknown task test: CHECK-OPTIONAL-CHAIN（logic.test.unknown）
- `plan.logic.units[BR-033].test_refs`：Unknown task test: CHECK-UNCONNECTED（logic.test.unknown）
- `plan.logic.units[BR-033].test_refs`：Unknown task test: CHECK-112（logic.test.unknown）
- `plan.logic.units[BR-033].test_refs`：Unknown task test: CHECK-DRAFT-RESULT（logic.test.unknown）
- `plan.logic.units[BR-033].test_refs`：Unknown task test: CHECK-IMPORT-RACE（logic.test.unknown）
- `plan.logic.units[BR-033].test_refs`：Unknown task test: CHECK-114（logic.test.unknown）
- `plan.logic.units[BR-033].test_refs`：Unknown task test: CHECK-119（logic.test.unknown）
- `plan.logic.units[BR-033].test_refs`：Unknown task test: CHECK-HISTORY-ISOLATION（logic.test.unknown）
- `plan.logic.units[BR-033].test_refs`：Unknown task test: CHECK-113（logic.test.unknown）
- `plan.logic.units[BR-033].test_refs`：Unknown task test: CHECK-126（logic.test.unknown）
- `plan.logic.units[BR-033].test_refs`：Unknown task test: CHECK-QUERY-RACE（logic.test.unknown）
- `plan.logic.units[BR-033].test_refs`：Unknown task test: CHECK-136（logic.test.unknown）
- `plan.logic.units[BR-033].test_refs`：Unknown task test: CHECK-CALL-VERSION（logic.test.unknown）
- `plan.logic.units[BR-034].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[BR-034].test_refs`：Unknown task test: CHECK-AUTH（logic.test.unknown）
- `plan.logic.units[BR-034].test_refs`：Unknown task test: CHECK-IMPLICIT-REFERENCE（logic.test.unknown）
- `plan.logic.units[BR-034].test_refs`：Unknown task test: CHECK-OPTIONAL-CHAIN（logic.test.unknown）
- `plan.logic.units[BR-034].test_refs`：Unknown task test: CHECK-105（logic.test.unknown）
- `plan.logic.units[BR-034].test_refs`：Unknown task test: CHECK-124（logic.test.unknown）
- `plan.logic.units[BR-034].test_refs`：Unknown task test: CHECK-110（logic.test.unknown）
- `plan.logic.units[BR-034].test_refs`：Unknown task test: CHECK-127（logic.test.unknown）
- `plan.logic.units[BR-034].test_refs`：Unknown task test: CHECK-128（logic.test.unknown）
- `plan.logic.units[BR-034].test_refs`：Unknown task test: CHECK-109（logic.test.unknown）
- `plan.logic.units[BR-034].test_refs`：Unknown task test: CHECK-120（logic.test.unknown）
- `plan.logic.units[BR-034].test_refs`：Unknown task test: CHECK-131（logic.test.unknown）
- `plan.logic.units[BR-034].test_refs`：Unknown task test: CHECK-REFERENCE-RACE（logic.test.unknown）
- `plan.logic.units[BR-034].test_refs`：Unknown task test: CHECK-111（logic.test.unknown）
- `plan.logic.units[BR-034].test_refs`：Unknown task test: CHECK-106（logic.test.unknown）
- `plan.logic.units[BR-034].test_refs`：Unknown task test: CHECK-121（logic.test.unknown）
- `plan.logic.units[BR-035].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[BR-035].test_refs`：Unknown task test: CHECK-117（logic.test.unknown）
- `plan.logic.units[BR-035].test_refs`：Unknown task test: CHECK-137（logic.test.unknown）
- `plan.logic.units[BR-035].test_refs`：Unknown task test: CHECK-138（logic.test.unknown）
- `plan.logic.units[BR-035].test_refs`：Unknown task test: CHECK-124（logic.test.unknown）
- `plan.logic.units[BR-035].test_refs`：Unknown task test: CHECK-110（logic.test.unknown）
- `plan.logic.units[BR-035].test_refs`：Unknown task test: CHECK-133（logic.test.unknown）
- `plan.logic.units[BR-035].test_refs`：Unknown task test: CHECK-125（logic.test.unknown）
- `plan.logic.units[BR-035].test_refs`：Unknown task test: CHECK-132（logic.test.unknown）
- `plan.logic.units[BR-035].test_refs`：Unknown task test: CHECK-135（logic.test.unknown）
- `plan.logic.units[BR-035].test_refs`：Unknown task test: CHECK-118（logic.test.unknown）
- `plan.logic.units[BR-035].test_refs`：Unknown task test: CHECK-115（logic.test.unknown）
- `plan.logic.units[BR-035].test_refs`：Unknown task test: CHECK-OPTIONAL-CHAIN（logic.test.unknown）
- `plan.logic.units[BR-035].test_refs`：Unknown task test: CHECK-UNCONNECTED（logic.test.unknown）
- `plan.logic.units[BR-035].test_refs`：Unknown task test: CHECK-109（logic.test.unknown）
- `plan.logic.units[BR-035].test_refs`：Unknown task test: CHECK-112（logic.test.unknown）
- `plan.logic.units[BR-035].test_refs`：Unknown task test: CHECK-DRAFT-RESULT（logic.test.unknown）
- `plan.logic.units[BR-035].test_refs`：Unknown task test: CHECK-CALL-VERSION（logic.test.unknown）
- `plan.logic.units[BR-035].test_refs`：Unknown task test: CHECK-IMPORT-RACE（logic.test.unknown）
- `plan.logic.units[BR-035].test_refs`：Unknown task test: CHECK-119（logic.test.unknown）
- `plan.logic.units[BR-035].test_refs`：Unknown task test: CHECK-HISTORY-ISOLATION（logic.test.unknown）
- `plan.logic.units[BR-035].test_refs`：Unknown task test: CHECK-113（logic.test.unknown）
- `plan.logic.units[BR-035].test_refs`：Unknown task test: CHECK-121（logic.test.unknown）
- `plan.logic.units[BR-035].test_refs`：Unknown task test: CHECK-126（logic.test.unknown）
- `plan.logic.units[BR-035].test_refs`：Unknown task test: CHECK-QUERY-RACE（logic.test.unknown）
- `plan.logic.units[BR-035].test_refs`：Unknown task test: CHECK-120（logic.test.unknown）
- `plan.logic.units[BR-035].test_refs`：Unknown task test: CHECK-136（logic.test.unknown）
- `plan.logic.units[BR-035].test_refs`：Unknown task test: CHECK-111（logic.test.unknown）
- `plan.logic.units[BR-035].test_refs`：Unknown task test: CHECK-114（logic.test.unknown）
- `plan.logic.units[BR-036].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[BR-036].test_refs`：Unknown task test: CHECK-117（logic.test.unknown）
- `plan.logic.units[BR-036].test_refs`：Unknown task test: CHECK-137（logic.test.unknown）
- `plan.logic.units[BR-036].test_refs`：Unknown task test: CHECK-138（logic.test.unknown）
- `plan.logic.units[BR-036].test_refs`：Unknown task test: CHECK-108（logic.test.unknown）
- `plan.logic.units[BR-036].test_refs`：Unknown task test: CHECK-133（logic.test.unknown）
- `plan.logic.units[BR-036].test_refs`：Unknown task test: CHECK-125（logic.test.unknown）
- `plan.logic.units[BR-036].test_refs`：Unknown task test: CHECK-135（logic.test.unknown）
- `plan.logic.units[BR-036].test_refs`：Unknown task test: CHECK-132（logic.test.unknown）
- `plan.logic.units[BR-036].test_refs`：Unknown task test: CHECK-118（logic.test.unknown）
- `plan.logic.units[BR-036].test_refs`：Unknown task test: CHECK-115（logic.test.unknown）
- `plan.logic.units[BR-036].test_refs`：Unknown task test: CHECK-OPTIONAL-CHAIN（logic.test.unknown）
- `plan.logic.units[BR-036].test_refs`：Unknown task test: CHECK-UNCONNECTED（logic.test.unknown）
- `plan.logic.units[BR-036].test_refs`：Unknown task test: CHECK-112（logic.test.unknown）
- `plan.logic.units[BR-036].test_refs`：Unknown task test: CHECK-DRAFT-RESULT（logic.test.unknown）
- `plan.logic.units[BR-036].test_refs`：Unknown task test: CHECK-CALL-VERSION（logic.test.unknown）
- `plan.logic.units[BR-036].test_refs`：Unknown task test: CHECK-AUTH（logic.test.unknown）
- `plan.logic.units[BR-036].test_refs`：Unknown task test: CHECK-IMPORT-RACE（logic.test.unknown）
- `plan.logic.units[BR-036].test_refs`：Unknown task test: CHECK-129（logic.test.unknown）
- `plan.logic.units[BR-036].test_refs`：Unknown task test: CHECK-119（logic.test.unknown）
- `plan.logic.units[BR-036].test_refs`：Unknown task test: CHECK-131（logic.test.unknown）
- `plan.logic.units[BR-036].test_refs`：Unknown task test: CHECK-HISTORY-ISOLATION（logic.test.unknown）
- `plan.logic.units[BR-036].test_refs`：Unknown task test: CHECK-107（logic.test.unknown）
- `plan.logic.units[BR-036].test_refs`：Unknown task test: CHECK-113（logic.test.unknown）
- `plan.logic.units[BR-036].test_refs`：Unknown task test: CHECK-126（logic.test.unknown）
- `plan.logic.units[BR-036].test_refs`：Unknown task test: CHECK-QUERY-RACE（logic.test.unknown）
- `plan.logic.units[BR-036].test_refs`：Unknown task test: CHECK-136（logic.test.unknown）
- `plan.logic.units[BR-036].test_refs`：Unknown task test: CHECK-114（logic.test.unknown）
- `plan.logic.units[BR-037].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[BR-037].test_refs`：Unknown task test: CHECK-117（logic.test.unknown）
- `plan.logic.units[BR-037].test_refs`：Unknown task test: CHECK-137（logic.test.unknown）
- `plan.logic.units[BR-037].test_refs`：Unknown task test: CHECK-138（logic.test.unknown）
- `plan.logic.units[BR-037].test_refs`：Unknown task test: CHECK-133（logic.test.unknown）
- `plan.logic.units[BR-037].test_refs`：Unknown task test: CHECK-125（logic.test.unknown）
- `plan.logic.units[BR-037].test_refs`：Unknown task test: CHECK-135（logic.test.unknown）
- `plan.logic.units[BR-037].test_refs`：Unknown task test: CHECK-132（logic.test.unknown）
- `plan.logic.units[BR-037].test_refs`：Unknown task test: CHECK-118（logic.test.unknown）
- `plan.logic.units[BR-037].test_refs`：Unknown task test: CHECK-115（logic.test.unknown）
- `plan.logic.units[BR-037].test_refs`：Unknown task test: CHECK-OPTIONAL-CHAIN（logic.test.unknown）
- `plan.logic.units[BR-037].test_refs`：Unknown task test: CHECK-UNCONNECTED（logic.test.unknown）
- `plan.logic.units[BR-037].test_refs`：Unknown task test: CHECK-112（logic.test.unknown）
- `plan.logic.units[BR-037].test_refs`：Unknown task test: CHECK-DRAFT-RESULT（logic.test.unknown）
- `plan.logic.units[BR-037].test_refs`：Unknown task test: CHECK-IMPORT-RACE（logic.test.unknown）
- `plan.logic.units[BR-037].test_refs`：Unknown task test: CHECK-114（logic.test.unknown）
- `plan.logic.units[BR-037].test_refs`：Unknown task test: CHECK-119（logic.test.unknown）
- `plan.logic.units[BR-037].test_refs`：Unknown task test: CHECK-HISTORY-ISOLATION（logic.test.unknown）
- `plan.logic.units[BR-037].test_refs`：Unknown task test: CHECK-113（logic.test.unknown）
- `plan.logic.units[BR-037].test_refs`：Unknown task test: CHECK-126（logic.test.unknown）
- `plan.logic.units[BR-037].test_refs`：Unknown task test: CHECK-QUERY-RACE（logic.test.unknown）
- `plan.logic.units[BR-037].test_refs`：Unknown task test: CHECK-136（logic.test.unknown）
- `plan.logic.units[BR-037].test_refs`：Unknown task test: CHECK-CALL-VERSION（logic.test.unknown）
- `plan.logic.units[BR-038].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[BR-038].test_refs`：Unknown task test: CHECK-AUTH（logic.test.unknown）
- `plan.logic.units[BR-039].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[BR-039].test_refs`：Unknown task test: CHECK-EMPTY-CATALOG（logic.test.unknown）
- `plan.logic.units[BR-039].test_refs`：Unknown task test: CHECK-150（logic.test.unknown）
- `plan.logic.units[BR-039].test_refs`：Unknown task test: CHECK-REFERENCE-RACE（logic.test.unknown）
- `plan.logic.units[BR-039].test_refs`：Unknown task test: CHECK-147（logic.test.unknown）
- `plan.logic.units[BR-039].test_refs`：Unknown task test: CHECK-145（logic.test.unknown）
- `plan.logic.units[BR-039].test_refs`：Unknown task test: CHECK-149（logic.test.unknown）
- `plan.logic.units[BR-039].test_refs`：Unknown task test: CHECK-ARCHIVE-CLOSURE（logic.test.unknown）
- `plan.logic.units[BR-039].test_refs`：Unknown task test: CHECK-146（logic.test.unknown）
- `plan.logic.units[BR-039].test_refs`：Unknown task test: CHECK-AUTH（logic.test.unknown）
- `plan.logic.units[BR-039].test_refs`：Unknown task test: CHECK-140（logic.test.unknown）
- `plan.logic.units[BR-039].test_refs`：Unknown task test: CHECK-148（logic.test.unknown）
- `plan.logic.units[BR-039].test_refs`：Unknown task test: CHECK-HISTORY-ISOLATION（logic.test.unknown）
- `plan.logic.units[BR-039].test_refs`：Unknown task test: CHECK-IMPLICIT-REFERENCE（logic.test.unknown）
- `plan.logic.units[BR-039].test_refs`：Unknown task test: CHECK-144（logic.test.unknown）
- `plan.logic.units[BR-039].test_refs`：Unknown task test: CHECK-142（logic.test.unknown）
- `plan.logic.units[BR-039].test_refs`：Unknown task test: CHECK-143（logic.test.unknown）
- `plan.logic.units[BR-039].test_refs`：Unknown task test: CHECK-CALL-VERSION（logic.test.unknown）
- `plan.logic.units[BR-039].test_refs`：Unknown task test: CHECK-139（logic.test.unknown）
- `plan.logic.units[BR-039].test_refs`：Unknown task test: CHECK-141（logic.test.unknown）
- `plan.logic.units[BR-040].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[BR-040].test_refs`：Unknown task test: CHECK-EMPTY-CATALOG（logic.test.unknown）
- `plan.logic.units[BR-040].test_refs`：Unknown task test: CHECK-150（logic.test.unknown）
- `plan.logic.units[BR-040].test_refs`：Unknown task test: CHECK-REFERENCE-RACE（logic.test.unknown）
- `plan.logic.units[BR-040].test_refs`：Unknown task test: CHECK-147（logic.test.unknown）
- `plan.logic.units[BR-040].test_refs`：Unknown task test: CHECK-145（logic.test.unknown）
- `plan.logic.units[BR-040].test_refs`：Unknown task test: CHECK-149（logic.test.unknown）
- `plan.logic.units[BR-040].test_refs`：Unknown task test: CHECK-ARCHIVE-CLOSURE（logic.test.unknown）
- `plan.logic.units[BR-040].test_refs`：Unknown task test: CHECK-146（logic.test.unknown）
- `plan.logic.units[BR-040].test_refs`：Unknown task test: CHECK-AUTH（logic.test.unknown）
- `plan.logic.units[BR-040].test_refs`：Unknown task test: CHECK-140（logic.test.unknown）
- `plan.logic.units[BR-040].test_refs`：Unknown task test: CHECK-148（logic.test.unknown）
- `plan.logic.units[BR-040].test_refs`：Unknown task test: CHECK-HISTORY-ISOLATION（logic.test.unknown）
- `plan.logic.units[BR-040].test_refs`：Unknown task test: CHECK-IMPLICIT-REFERENCE（logic.test.unknown）
- `plan.logic.units[BR-040].test_refs`：Unknown task test: CHECK-144（logic.test.unknown）
- `plan.logic.units[BR-040].test_refs`：Unknown task test: CHECK-142（logic.test.unknown）
- `plan.logic.units[BR-040].test_refs`：Unknown task test: CHECK-143（logic.test.unknown）
- `plan.logic.units[BR-040].test_refs`：Unknown task test: CHECK-CALL-VERSION（logic.test.unknown）
- `plan.logic.units[BR-040].test_refs`：Unknown task test: CHECK-139（logic.test.unknown）
- `plan.logic.units[BR-040].test_refs`：Unknown task test: CHECK-141（logic.test.unknown）
- `plan.logic.units[BR-041].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[BR-041].test_refs`：Unknown task test: CHECK-EMPTY-CATALOG（logic.test.unknown）
- `plan.logic.units[BR-041].test_refs`：Unknown task test: CHECK-150（logic.test.unknown）
- `plan.logic.units[BR-041].test_refs`：Unknown task test: CHECK-REFERENCE-RACE（logic.test.unknown）
- `plan.logic.units[BR-041].test_refs`：Unknown task test: CHECK-147（logic.test.unknown）
- `plan.logic.units[BR-041].test_refs`：Unknown task test: CHECK-145（logic.test.unknown）
- `plan.logic.units[BR-041].test_refs`：Unknown task test: CHECK-149（logic.test.unknown）
- `plan.logic.units[BR-041].test_refs`：Unknown task test: CHECK-ARCHIVE-CLOSURE（logic.test.unknown）
- `plan.logic.units[BR-041].test_refs`：Unknown task test: CHECK-146（logic.test.unknown）
- `plan.logic.units[BR-041].test_refs`：Unknown task test: CHECK-AUTH（logic.test.unknown）
- `plan.logic.units[BR-041].test_refs`：Unknown task test: CHECK-140（logic.test.unknown）
- `plan.logic.units[BR-041].test_refs`：Unknown task test: CHECK-148（logic.test.unknown）
- `plan.logic.units[BR-041].test_refs`：Unknown task test: CHECK-HISTORY-ISOLATION（logic.test.unknown）
- `plan.logic.units[BR-041].test_refs`：Unknown task test: CHECK-IMPLICIT-REFERENCE（logic.test.unknown）
- `plan.logic.units[BR-041].test_refs`：Unknown task test: CHECK-144（logic.test.unknown）
- `plan.logic.units[BR-041].test_refs`：Unknown task test: CHECK-142（logic.test.unknown）
- `plan.logic.units[BR-041].test_refs`：Unknown task test: CHECK-143（logic.test.unknown）
- `plan.logic.units[BR-041].test_refs`：Unknown task test: CHECK-CALL-VERSION（logic.test.unknown）
- `plan.logic.units[BR-041].test_refs`：Unknown task test: CHECK-139（logic.test.unknown）
- `plan.logic.units[BR-041].test_refs`：Unknown task test: CHECK-141（logic.test.unknown）
- `plan.logic.units[BR-042].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[BR-042].test_refs`：Unknown task test: CHECK-AUTH（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-CONFIG].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[PLAN-FLOW-CONFIG].test_refs`：Unknown task test: CHECK-137（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-CONFIG].test_refs`：Unknown task test: CHECK-130（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-CONFIG].test_refs`：Unknown task test: CHECK-124（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-CONFIG].test_refs`：Unknown task test: CHECK-110（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-CONFIG].test_refs`：Unknown task test: CHECK-FIELD-LIFECYCLE（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-CONFIG].test_refs`：Unknown task test: CHECK-REFERENCE-RACE（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-CONFIG].test_refs`：Unknown task test: CHECK-108（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-CONFIG].test_refs`：Unknown task test: CHECK-122（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-CONFIG].test_refs`：Unknown task test: CHECK-133（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-CONFIG].test_refs`：Unknown task test: CHECK-125（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-CONFIG].test_refs`：Unknown task test: CHECK-123（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-CONFIG].test_refs`：Unknown task test: CHECK-127（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-CONFIG].test_refs`：Unknown task test: CHECK-128（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-CONFIG].test_refs`：Unknown task test: CHECK-109（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-CONFIG].test_refs`：Unknown task test: CHECK-146（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-CONFIG].test_refs`：Unknown task test: CHECK-106（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-CONFIG].test_refs`：Unknown task test: CHECK-105（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-CONFIG].test_refs`：Unknown task test: CHECK-131（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-CONFIG].test_refs`：Unknown task test: CHECK-129（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-CONFIG].test_refs`：Unknown task test: CHECK-107（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-CONFIG].test_refs`：Unknown task test: CHECK-121（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-CONFIG].test_refs`：Unknown task test: CHECK-IMPLICIT-REFERENCE（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-CONFIG].test_refs`：Unknown task test: CHECK-120（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-CONFIG].test_refs`：Unknown task test: CHECK-111（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-FOLLOWUP].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[PLAN-FLOW-FOLLOWUP].test_refs`：Unknown task test: CHECK-117（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-FOLLOWUP].test_refs`：Unknown task test: CHECK-137（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-FOLLOWUP].test_refs`：Unknown task test: CHECK-150（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-FOLLOWUP].test_refs`：Unknown task test: CHECK-138（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-FOLLOWUP].test_refs`：Unknown task test: CHECK-124（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-FOLLOWUP].test_refs`：Unknown task test: CHECK-133（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-FOLLOWUP].test_refs`：Unknown task test: CHECK-125（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-FOLLOWUP].test_refs`：Unknown task test: CHECK-135（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-FOLLOWUP].test_refs`：Unknown task test: CHECK-132（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-FOLLOWUP].test_refs`：Unknown task test: CHECK-115（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-FOLLOWUP].test_refs`：Unknown task test: CHECK-118（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-FOLLOWUP].test_refs`：Unknown task test: CHECK-OPTIONAL-CHAIN（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-FOLLOWUP].test_refs`：Unknown task test: CHECK-112（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-FOLLOWUP].test_refs`：Unknown task test: CHECK-DRAFT-RESULT（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-FOLLOWUP].test_refs`：Unknown task test: CHECK-CALL-VERSION（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-FOLLOWUP].test_refs`：Unknown task test: CHECK-IMPORT-RACE（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-FOLLOWUP].test_refs`：Unknown task test: CHECK-148（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-FOLLOWUP].test_refs`：Unknown task test: CHECK-119（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-FOLLOWUP].test_refs`：Unknown task test: CHECK-HISTORY-ISOLATION（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-FOLLOWUP].test_refs`：Unknown task test: CHECK-113（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-FOLLOWUP].test_refs`：Unknown task test: CHECK-121（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-FOLLOWUP].test_refs`：Unknown task test: CHECK-126（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-FOLLOWUP].test_refs`：Unknown task test: CHECK-120（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-FOLLOWUP].test_refs`：Unknown task test: CHECK-136（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-FOLLOWUP].test_refs`：Unknown task test: CHECK-114（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-DELETE].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[PLAN-FLOW-DELETE].test_refs`：Unknown task test: CHECK-145（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-DELETE].test_refs`：Unknown task test: CHECK-140（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-DELETE].test_refs`：Unknown task test: CHECK-144（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-DELETE].test_refs`：Unknown task test: CHECK-150（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-DELETE].test_refs`：Unknown task test: CHECK-149（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-DELETE].test_refs`：Unknown task test: CHECK-142（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-DELETE].test_refs`：Unknown task test: CHECK-148（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-DELETE].test_refs`：Unknown task test: CHECK-ARCHIVE-CLOSURE（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-DELETE].test_refs`：Unknown task test: CHECK-143（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-DELETE].test_refs`：Unknown task test: CHECK-146（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-DELETE].test_refs`：Unknown task test: CHECK-147（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-DELETE].test_refs`：Unknown task test: CHECK-139（logic.test.unknown）
- `plan.logic.units[PLAN-FLOW-DELETE].test_refs`：Unknown task test: CHECK-141（logic.test.unknown）
- `plan.logic.units[LOCAL-DICT-CREATE].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[LOCAL-DICT-CREATE].test_refs`：Unknown task test: CHECK-131（logic.test.unknown）
- `plan.logic.units[LOCAL-DICT-CREATE].test_refs`：Unknown task test: CHECK-127（logic.test.unknown）
- `plan.logic.units[LOCAL-DICT-CREATE].test_refs`：Unknown task test: CHECK-105（logic.test.unknown）
- `plan.logic.units[LOCAL-DICT-CREATE].test_refs`：Unknown task test: CHECK-106（logic.test.unknown）
- `plan.logic.units[LOCAL-DICT-EDIT].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[LOCAL-DICT-EDIT].test_refs`：Unknown task test: CHECK-REFERENCE-RACE（logic.test.unknown）
- `plan.logic.units[LOCAL-DICT-EDIT].test_refs`：Unknown task test: CHECK-131（logic.test.unknown）
- `plan.logic.units[LOCAL-DICT-EDIT].test_refs`：Unknown task test: CHECK-IMPLICIT-REFERENCE（logic.test.unknown）
- `plan.logic.units[LOCAL-DICT-EDIT].test_refs`：Unknown task test: CHECK-128（logic.test.unknown）
- `plan.logic.units[LOCAL-DICT-ENABLE].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[LOCAL-DICT-ENABLE].test_refs`：Unknown task test: CHECK-131（logic.test.unknown）
- `plan.logic.units[LOCAL-DICT-ENABLE].test_refs`：Unknown task test: CHECK-129（logic.test.unknown）
- `plan.logic.units[LOCAL-DICT-ENABLE].test_refs`：Unknown task test: CHECK-137（logic.test.unknown）
- `plan.logic.units[LOCAL-DICT-DISABLE].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[LOCAL-DICT-DISABLE].test_refs`：Unknown task test: CHECK-123（logic.test.unknown）
- `plan.logic.units[LOCAL-DICT-DISABLE].test_refs`：Unknown task test: CHECK-131（logic.test.unknown）
- `plan.logic.units[LOCAL-DICT-DISABLE].test_refs`：Unknown task test: CHECK-130（logic.test.unknown）
- `plan.logic.units[LOCAL-TENANT-GRANT].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[LOCAL-TENANT-GRANT].test_refs`：Unknown task test: CHECK-108（logic.test.unknown）
- `plan.logic.units[LOCAL-TENANT-GRANT].test_refs`：Unknown task test: CHECK-107（logic.test.unknown）
- `plan.logic.units[LOCAL-TENANT-GRANT].test_refs`：Unknown task test: CHECK-137（logic.test.unknown）
- `plan.logic.units[LOCAL-TENANT-REVOKE].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[LOCAL-TENANT-REVOKE].test_refs`：Unknown task test: CHECK-123（logic.test.unknown）
- `plan.logic.units[LOCAL-TENANT-REVOKE].test_refs`：Unknown task test: CHECK-107（logic.test.unknown）
- `plan.logic.units[LOCAL-TENANT-REVOKE].test_refs`：Unknown task test: CHECK-137（logic.test.unknown）
- `plan.logic.units[LOCAL-TENANT-REVOKE].test_refs`：Unknown task test: CHECK-122（logic.test.unknown）
- `plan.logic.units[LOCAL-FIELD-SAVE].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[LOCAL-FIELD-SAVE].test_refs`：Unknown task test: CHECK-124（logic.test.unknown）
- `plan.logic.units[LOCAL-FIELD-SAVE].test_refs`：Unknown task test: CHECK-110（logic.test.unknown）
- `plan.logic.units[LOCAL-FIELD-SAVE].test_refs`：Unknown task test: CHECK-FIELD-LIFECYCLE（logic.test.unknown）
- `plan.logic.units[LOCAL-FIELD-SAVE].test_refs`：Unknown task test: CHECK-109（logic.test.unknown）
- `plan.logic.units[LOCAL-FIELD-SAVE].test_refs`：Unknown task test: CHECK-108（logic.test.unknown）
- `plan.logic.units[LOCAL-FIELD-SAVE].test_refs`：Unknown task test: CHECK-133（logic.test.unknown）
- `plan.logic.units[LOCAL-FIELD-SAVE].test_refs`：Unknown task test: CHECK-125（logic.test.unknown）
- `plan.logic.units[LOCAL-FIELD-SAVE].test_refs`：Unknown task test: CHECK-111（logic.test.unknown）
- `plan.logic.units[LOCAL-FIELD-SAVE].test_refs`：Unknown task test: CHECK-134（logic.test.unknown）
- `plan.logic.units[LOCAL-CLASS-FIELDS-SAVE].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[LOCAL-CLASS-FIELDS-SAVE].test_refs`：Unknown task test: CHECK-124（logic.test.unknown）
- `plan.logic.units[LOCAL-CLASS-FIELDS-SAVE].test_refs`：Unknown task test: CHECK-109（logic.test.unknown）
- `plan.logic.units[LOCAL-CLASS-FIELDS-SAVE].test_refs`：Unknown task test: CHECK-120（logic.test.unknown）
- `plan.logic.units[LOCAL-CLASS-FIELDS-SAVE].test_refs`：Unknown task test: CHECK-133（logic.test.unknown）
- `plan.logic.units[LOCAL-CLASS-FIELDS-SAVE].test_refs`：Unknown task test: CHECK-146（logic.test.unknown）
- `plan.logic.units[LOCAL-CLASS-FIELDS-SAVE].test_refs`：Unknown task test: CHECK-111（logic.test.unknown）
- `plan.logic.units[LOCAL-CLASS-FIELDS-SAVE].test_refs`：Unknown task test: CHECK-121（logic.test.unknown）
- `plan.logic.units[LOCAL-CLASS-FIELDS-SAVE].test_refs`：Unknown task test: CHECK-134（logic.test.unknown）
- `plan.logic.units[LOCAL-CALL-FORM].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[LOCAL-CALL-FORM].test_refs`：Unknown task test: CHECK-133（logic.test.unknown）
- `plan.logic.units[LOCAL-CALL-FORM].test_refs`：Unknown task test: CHECK-CALL-VERSION（logic.test.unknown）
- `plan.logic.units[LOCAL-CALL-FORM].test_refs`：Unknown task test: CHECK-148（logic.test.unknown）
- `plan.logic.units[LOCAL-CALL-FORM].test_refs`：Unknown task test: CHECK-150（logic.test.unknown）
- `plan.logic.units[LOCAL-SERIES-QUERY].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[LOCAL-SERIES-QUERY].test_refs`：Unknown task test: CHECK-115（logic.test.unknown）
- `plan.logic.units[LOCAL-SERIES-QUERY].test_refs`：Unknown task test: CHECK-123（logic.test.unknown）
- `plan.logic.units[LOCAL-SERIES-QUERY].test_refs`：Unknown task test: CHECK-137（logic.test.unknown）
- `plan.logic.units[LOCAL-SERIES-QUERY].test_refs`：Unknown task test: CHECK-138（logic.test.unknown）
- `plan.logic.units[LOCAL-SERIES-QUERY].test_refs`：Unknown task test: CHECK-113（logic.test.unknown）
- `plan.logic.units[LOCAL-SERIES-QUERY].test_refs`：Unknown task test: CHECK-132（logic.test.unknown）
- `plan.logic.units[LOCAL-SERIES-QUERY].test_refs`：Unknown task test: CHECK-112（logic.test.unknown）
- `plan.logic.units[LOCAL-SERIES-QUERY].test_refs`：Unknown task test: CHECK-135（logic.test.unknown）
- `plan.logic.units[LOCAL-GENERIC-QUERY].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[LOCAL-GENERIC-QUERY].test_refs`：Unknown task test: CHECK-118（logic.test.unknown）
- `plan.logic.units[LOCAL-GENERIC-QUERY].test_refs`：Unknown task test: CHECK-OPTIONAL-CHAIN（logic.test.unknown）
- `plan.logic.units[LOCAL-GENERIC-QUERY].test_refs`：Unknown task test: CHECK-115（logic.test.unknown）
- `plan.logic.units[LOCAL-GENERIC-QUERY].test_refs`：Unknown task test: CHECK-137（logic.test.unknown）
- `plan.logic.units[LOCAL-GENERIC-QUERY].test_refs`：Unknown task test: CHECK-124（logic.test.unknown）
- `plan.logic.units[LOCAL-GENERIC-QUERY].test_refs`：Unknown task test: CHECK-126（logic.test.unknown）
- `plan.logic.units[LOCAL-GENERIC-QUERY].test_refs`：Unknown task test: CHECK-119（logic.test.unknown）
- `plan.logic.units[LOCAL-GENERIC-QUERY].test_refs`：Unknown task test: CHECK-125（logic.test.unknown）
- `plan.logic.units[LOCAL-GENERIC-QUERY].test_refs`：Unknown task test: CHECK-136（logic.test.unknown）
- `plan.logic.units[LOCAL-GENERIC-QUERY].test_refs`：Unknown task test: CHECK-114（logic.test.unknown）
- `plan.logic.units[LOCAL-GENERIC-QUERY].test_refs`：Unknown task test: CHECK-135（logic.test.unknown）
- `plan.logic.units[LOCAL-GENERIC-QUERY].test_refs`：Unknown task test: CHECK-121（logic.test.unknown）
- `plan.logic.units[LOCAL-GENERIC-QUERY].test_refs`：Unknown task test: CHECK-134（logic.test.unknown）
- `plan.logic.units[LOCAL-IMPORT-CONFIRM].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[LOCAL-IMPORT-CONFIRM].test_refs`：Unknown task test: CHECK-115（logic.test.unknown）
- `plan.logic.units[LOCAL-IMPORT-CONFIRM].test_refs`：Unknown task test: CHECK-117（logic.test.unknown）
- `plan.logic.units[LOCAL-IMPORT-CONFIRM].test_refs`：Unknown task test: CHECK-IMPORT-RACE（logic.test.unknown）
- `plan.logic.units[LOCAL-IMPORT-CONFIRM].test_refs`：Unknown task test: CHECK-116（logic.test.unknown）
- `plan.logic.units[LOCAL-IMPORT-CONFIRM].test_refs`：Unknown task test: CHECK-114（logic.test.unknown）
- `plan.logic.units[LOCAL-FOLLOWUP-SAVE].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[LOCAL-FOLLOWUP-SAVE].test_refs`：Unknown task test: CHECK-123（logic.test.unknown）
- `plan.logic.units[LOCAL-FOLLOWUP-SAVE].test_refs`：Unknown task test: CHECK-138（logic.test.unknown）
- `plan.logic.units[LOCAL-FOLLOWUP-SAVE].test_refs`：Unknown task test: CHECK-150（logic.test.unknown）
- `plan.logic.units[LOCAL-FOLLOWUP-SAVE].test_refs`：Unknown task test: CHECK-120（logic.test.unknown）
- `plan.logic.units[LOCAL-FOLLOWUP-SAVE].test_refs`：Unknown task test: CHECK-135（logic.test.unknown）
- `plan.logic.units[LOCAL-FOLLOWUP-SAVE].test_refs`：Unknown task test: CHECK-133（logic.test.unknown）
- `plan.logic.units[LOCAL-FOLLOWUP-SAVE].test_refs`：Unknown task test: CHECK-119（logic.test.unknown）
- `plan.logic.units[LOCAL-FOLLOWUP-SAVE].test_refs`：Unknown task test: CHECK-116（logic.test.unknown）
- `plan.logic.units[LOCAL-FOLLOWUP-SAVE].test_refs`：Unknown task test: CHECK-DRAFT-RESULT（logic.test.unknown）
- `plan.logic.units[LOCAL-FOLLOWUP-SAVE].test_refs`：Unknown task test: CHECK-114（logic.test.unknown）
- `plan.logic.units[LOCAL-FOLLOWUP-SAVE].test_refs`：Unknown task test: CHECK-132（logic.test.unknown）
- `plan.logic.units[LOCAL-FOLLOWUP-SAVE].test_refs`：Unknown task test: CHECK-121（logic.test.unknown）
- `plan.logic.units[LOCAL-READ-CALL].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[LOCAL-READ-CALL].test_refs`：Unknown task test: CHECK-150（logic.test.unknown）
- `plan.logic.units[LOCAL-READ-CALL].test_refs`：Unknown task test: CHECK-116（logic.test.unknown）
- `plan.logic.units[LOCAL-READ-CALL].test_refs`：Unknown task test: CHECK-148（logic.test.unknown）
- `plan.logic.units[LOCAL-READ-CALL].test_refs`：Unknown task test: CHECK-138（logic.test.unknown）
- `plan.logic.units[LOCAL-READ-CUSTOMER].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[LOCAL-READ-CUSTOMER].test_refs`：Unknown task test: CHECK-150（logic.test.unknown）
- `plan.logic.units[LOCAL-READ-CUSTOMER].test_refs`：Unknown task test: CHECK-HISTORY-ISOLATION（logic.test.unknown）
- `plan.logic.units[LOCAL-READ-CUSTOMER].test_refs`：Unknown task test: CHECK-148（logic.test.unknown）
- `plan.logic.units[LOCAL-READ-CUSTOMER].test_refs`：Unknown task test: CHECK-138（logic.test.unknown）
- `plan.logic.units[LOCAL-DICT-DELETE].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[LOCAL-DICT-DELETE].test_refs`：Unknown task test: CHECK-142（logic.test.unknown）
- `plan.logic.units[LOCAL-DICT-DELETE].test_refs`：Unknown task test: CHECK-139（logic.test.unknown）
- `plan.logic.units[LOCAL-DICT-DELETE].test_refs`：Unknown task test: CHECK-140（logic.test.unknown）
- `plan.logic.units[LOCAL-DICT-DELETE].test_refs`：Unknown task test: CHECK-141（logic.test.unknown）
- `plan.logic.units[LOCAL-FIELD-DELETE].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[LOCAL-FIELD-DELETE].test_refs`：Unknown task test: CHECK-145（logic.test.unknown）
- `plan.logic.units[LOCAL-FIELD-DELETE].test_refs`：Unknown task test: CHECK-144（logic.test.unknown）
- `plan.logic.units[LOCAL-FIELD-DELETE].test_refs`：Unknown task test: CHECK-143（logic.test.unknown）
- `plan.logic.units[LOCAL-FIELD-DELETE].test_refs`：Unknown task test: CHECK-146（logic.test.unknown）
- `plan.logic.units[LOCAL-FIELD-DELETE].test_refs`：Unknown task test: CHECK-REFERENCE-EDIT（logic.test.unknown）
- `plan.logic.units[LOCAL-CATEGORY-RETIRE].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[LOCAL-CATEGORY-RETIRE].test_refs`：Unknown task test: CHECK-150（logic.test.unknown）
- `plan.logic.units[LOCAL-CATEGORY-RETIRE].test_refs`：Unknown task test: CHECK-149（logic.test.unknown）
- `plan.logic.units[LOCAL-CATEGORY-RETIRE].test_refs`：Unknown task test: CHECK-ARCHIVE-CLOSURE（logic.test.unknown）
- `plan.logic.units[LOCAL-CATEGORY-RETIRE].test_refs`：Unknown task test: CHECK-148（logic.test.unknown）
- `plan.logic.units[LOCAL-CATEGORY-RETIRE].test_refs`：Unknown task test: CHECK-147（logic.test.unknown）
- `plan.logic.units[LOCAL-FIELD-ENABLE].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[LOCAL-FIELD-ENABLE].test_refs`：Unknown task test: CHECK-AUTH（logic.test.unknown）
- `plan.logic.units[LOCAL-FIELD-ENABLE].test_refs`：Unknown task test: CHECK-133（logic.test.unknown）
- `plan.logic.units[LOCAL-FIELD-ENABLE].test_refs`：Unknown task test: CHECK-FIELD-LIFECYCLE（logic.test.unknown）
- `plan.logic.units[LOCAL-FIELD-DISABLE].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[LOCAL-FIELD-DISABLE].test_refs`：Unknown task test: CHECK-AUTH（logic.test.unknown）
- `plan.logic.units[LOCAL-FIELD-DISABLE].test_refs`：Unknown task test: CHECK-133（logic.test.unknown）
- `plan.logic.units[LOCAL-FIELD-DISABLE].test_refs`：Unknown task test: CHECK-FIELD-LIFECYCLE（logic.test.unknown）
- `plan.logic.units[FIELD-DICT-ID].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[FIELD-DICT-ID].test_refs`：Unknown task test: CHECK-127（logic.test.unknown）
- `plan.logic.units[FIELD-DICT-ID].test_refs`：Unknown task test: CHECK-105（logic.test.unknown）
- `plan.logic.units[FIELD-DICT-ID].test_refs`：Unknown task test: CHECK-128（logic.test.unknown）
- `plan.logic.units[FIELD-DICT-NAME].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[FIELD-DICT-NAME].test_refs`：Unknown task test: CHECK-AUTH（logic.test.unknown）
- `plan.logic.units[FIELD-DICT-NAME].test_refs`：Unknown task test: CHECK-127（logic.test.unknown）
- `plan.logic.units[FIELD-DICT-NAME].test_refs`：Unknown task test: CHECK-105（logic.test.unknown）
- `plan.logic.units[FIELD-DICT-NAME].test_refs`：Unknown task test: CHECK-128（logic.test.unknown）
- `plan.logic.units[FIELD-CAPABILITY].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[FIELD-CAPABILITY].test_refs`：Unknown task test: CHECK-REFERENCE-RACE（logic.test.unknown）
- `plan.logic.units[FIELD-CAPABILITY].test_refs`：Unknown task test: CHECK-IMPLICIT-REFERENCE（logic.test.unknown）
- `plan.logic.units[FIELD-CAPABILITY].test_refs`：Unknown task test: CHECK-105（logic.test.unknown）
- `plan.logic.units[FIELD-CAPABILITY].test_refs`：Unknown task test: CHECK-128（logic.test.unknown）
- `plan.logic.units[FIELD-TENANT-GRANTS].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[FIELD-TENANT-GRANTS].test_refs`：Unknown task test: CHECK-108（logic.test.unknown）
- `plan.logic.units[FIELD-TENANT-GRANTS].test_refs`：Unknown task test: CHECK-107（logic.test.unknown）
- `plan.logic.units[FIELD-TENANT-GRANTS].test_refs`：Unknown task test: CHECK-123（logic.test.unknown）
- `plan.logic.units[FIELD-TENANT-GRANTS].test_refs`：Unknown task test: CHECK-122（logic.test.unknown）
- `plan.logic.units[FIELD-DICT-ENABLED].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[FIELD-DICT-ENABLED].test_refs`：Unknown task test: CHECK-131（logic.test.unknown）
- `plan.logic.units[FIELD-DICT-ENABLED].test_refs`：Unknown task test: CHECK-129（logic.test.unknown）
- `plan.logic.units[FIELD-DICT-ENABLED].test_refs`：Unknown task test: CHECK-137（logic.test.unknown）
- `plan.logic.units[FIELD-DICT-ENABLED].test_refs`：Unknown task test: CHECK-130（logic.test.unknown）
- `plan.logic.units[FIELD-DEFINITION-ID].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[FIELD-DEFINITION-ID].test_refs`：Unknown task test: CHECK-109（logic.test.unknown）
- `plan.logic.units[FIELD-DEFINITION-ID].test_refs`：Unknown task test: CHECK-110（logic.test.unknown）
- `plan.logic.units[FIELD-DEFINITION-ID].test_refs`：Unknown task test: CHECK-146（logic.test.unknown）
- `plan.logic.units[FIELD-DEFINITION-LABEL].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[FIELD-DEFINITION-LABEL].test_refs`：Unknown task test: CHECK-109（logic.test.unknown）
- `plan.logic.units[FIELD-DEFINITION-LABEL].test_refs`：Unknown task test: CHECK-133（logic.test.unknown）
- `plan.logic.units[FIELD-DEFINITION-LABEL].test_refs`：Unknown task test: CHECK-138（logic.test.unknown）
- `plan.logic.units[FIELD-DEFINITION-TYPE].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[FIELD-DEFINITION-TYPE].test_refs`：Unknown task test: CHECK-109（logic.test.unknown）
- `plan.logic.units[FIELD-DEFINITION-TYPE].test_refs`：Unknown task test: CHECK-146（logic.test.unknown）
- `plan.logic.units[FIELD-DEFINITION-TYPE].test_refs`：Unknown task test: CHECK-112（logic.test.unknown）
- `plan.logic.units[FIELD-DICTIONARY-REF].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[FIELD-DICTIONARY-REF].test_refs`：Unknown task test: CHECK-123（logic.test.unknown）
- `plan.logic.units[FIELD-DICTIONARY-REF].test_refs`：Unknown task test: CHECK-110（logic.test.unknown）
- `plan.logic.units[FIELD-DICTIONARY-REF].test_refs`：Unknown task test: CHECK-109（logic.test.unknown）
- `plan.logic.units[FIELD-DICTIONARY-REF].test_refs`：Unknown task test: CHECK-108（logic.test.unknown）
- `plan.logic.units[FIELD-DICTIONARY-REF].test_refs`：Unknown task test: CHECK-133（logic.test.unknown）
- `plan.logic.units[FIELD-USE-UPSTREAM].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[FIELD-USE-UPSTREAM].test_refs`：Unknown task test: CHECK-124（logic.test.unknown）
- `plan.logic.units[FIELD-USE-UPSTREAM].test_refs`：Unknown task test: CHECK-110（logic.test.unknown）
- `plan.logic.units[FIELD-USE-UPSTREAM].test_refs`：Unknown task test: CHECK-125（logic.test.unknown）
- `plan.logic.units[FIELD-UPSTREAM-ID].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[FIELD-UPSTREAM-ID].test_refs`：Unknown task test: CHECK-124（logic.test.unknown）
- `plan.logic.units[FIELD-UPSTREAM-ID].test_refs`：Unknown task test: CHECK-110（logic.test.unknown）
- `plan.logic.units[FIELD-UPSTREAM-ID].test_refs`：Unknown task test: CHECK-125（logic.test.unknown）
- `plan.logic.units[FIELD-UPSTREAM-ID].test_refs`：Unknown task test: CHECK-111（logic.test.unknown）
- `plan.logic.units[FIELD-UPSTREAM-ID].test_refs`：Unknown task test: CHECK-134（logic.test.unknown）
- `plan.logic.units[FIELD-UPSTREAM-PROPERTY].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[FIELD-UPSTREAM-PROPERTY].test_refs`：Unknown task test: CHECK-124（logic.test.unknown）
- `plan.logic.units[FIELD-UPSTREAM-PROPERTY].test_refs`：Unknown task test: CHECK-110（logic.test.unknown）
- `plan.logic.units[FIELD-UPSTREAM-PROPERTY].test_refs`：Unknown task test: CHECK-125（logic.test.unknown）
- `plan.logic.units[FIELD-UPSTREAM-PROPERTY].test_refs`：Unknown task test: CHECK-134（logic.test.unknown）
- `plan.logic.units[FIELD-DOWNSTREAM-PARAM].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[FIELD-DOWNSTREAM-PARAM].test_refs`：Unknown task test: CHECK-124（logic.test.unknown）
- `plan.logic.units[FIELD-DOWNSTREAM-PARAM].test_refs`：Unknown task test: CHECK-110（logic.test.unknown）
- `plan.logic.units[FIELD-DOWNSTREAM-PARAM].test_refs`：Unknown task test: CHECK-125（logic.test.unknown）
- `plan.logic.units[FIELD-DOWNSTREAM-PARAM].test_refs`：Unknown task test: CHECK-134（logic.test.unknown）
- `plan.logic.units[FIELD-QUERY-REQUIRED].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[FIELD-QUERY-REQUIRED].test_refs`：Unknown task test: CHECK-124（logic.test.unknown）
- `plan.logic.units[FIELD-QUERY-REQUIRED].test_refs`：Unknown task test: CHECK-125（logic.test.unknown）
- `plan.logic.units[FIELD-QUERY-REQUIRED].test_refs`：Unknown task test: CHECK-111（logic.test.unknown）
- `plan.logic.units[FIELD-QUERY-REQUIRED].test_refs`：Unknown task test: CHECK-134（logic.test.unknown）
- `plan.logic.units[FIELD-DEPENDENCY-SUMMARY].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[FIELD-DEPENDENCY-SUMMARY].test_refs`：Unknown task test: CHECK-124（logic.test.unknown）
- `plan.logic.units[FIELD-DEPENDENCY-SUMMARY].test_refs`：Unknown task test: CHECK-110（logic.test.unknown）
- `plan.logic.units[FIELD-DEPENDENCY-SUMMARY].test_refs`：Unknown task test: CHECK-111（logic.test.unknown）
- `plan.logic.units[FIELD-DEFINITION].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[FIELD-DEFINITION].test_refs`：Unknown task test: CHECK-110（logic.test.unknown）
- `plan.logic.units[FIELD-DEFINITION].test_refs`：Unknown task test: CHECK-148（logic.test.unknown）
- `plan.logic.units[FIELD-DEFINITION].test_refs`：Unknown task test: CHECK-109（logic.test.unknown）
- `plan.logic.units[FIELD-DEFINITION].test_refs`：Unknown task test: CHECK-133（logic.test.unknown）
- `plan.logic.units[FIELD-DEFINITION].test_refs`：Unknown task test: CHECK-146（logic.test.unknown）
- `plan.logic.units[FIELD-DEFINITION].test_refs`：Unknown task test: CHECK-111（logic.test.unknown）
- `plan.logic.units[FIELD-CLASS-REQUIRED].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[FIELD-CLASS-REQUIRED].test_refs`：Unknown task test: CHECK-120（logic.test.unknown）
- `plan.logic.units[FIELD-CLASS-REQUIRED].test_refs`：Unknown task test: CHECK-133（logic.test.unknown）
- `plan.logic.units[FIELD-CLASS-REQUIRED].test_refs`：Unknown task test: CHECK-132（logic.test.unknown）
- `plan.logic.units[FIELD-CLASS-REQUIRED].test_refs`：Unknown task test: CHECK-121（logic.test.unknown）
- `plan.logic.units[FIELD-CLASS-VISIBLE].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[FIELD-CLASS-VISIBLE].test_refs`：Unknown task test: CHECK-120（logic.test.unknown）
- `plan.logic.units[FIELD-CLASS-VISIBLE].test_refs`：Unknown task test: CHECK-133（logic.test.unknown）
- `plan.logic.units[FIELD-CLASS-VISIBLE].test_refs`：Unknown task test: CHECK-111（logic.test.unknown）
- `plan.logic.units[FIELD-CLASS-ORDER].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[FIELD-CLASS-ORDER].test_refs`：Unknown task test: CHECK-120（logic.test.unknown）
- `plan.logic.units[FIELD-CLASS-ORDER].test_refs`：Unknown task test: CHECK-133（logic.test.unknown）
- `plan.logic.units[FIELD-CLASS-FIELD-REFS].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[FIELD-CLASS-FIELD-REFS].test_refs`：Unknown task test: CHECK-150（logic.test.unknown）
- `plan.logic.units[FIELD-CLASS-FIELD-REFS].test_refs`：Unknown task test: CHECK-109（logic.test.unknown）
- `plan.logic.units[FIELD-CLASS-FIELD-REFS].test_refs`：Unknown task test: CHECK-120（logic.test.unknown）
- `plan.logic.units[FIELD-CLASS-FIELD-REFS].test_refs`：Unknown task test: CHECK-133（logic.test.unknown）
- `plan.logic.units[FIELD-CLASS-FIELD-REFS].test_refs`：Unknown task test: CHECK-146（logic.test.unknown）
- `plan.logic.units[FIELD-CLASS-FIELD-REFS].test_refs`：Unknown task test: CHECK-111（logic.test.unknown）
- `plan.logic.units[FIELD-CATEGORY-DEFINITION].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[FIELD-CATEGORY-DEFINITION].test_refs`：Unknown task test: CHECK-150（logic.test.unknown）
- `plan.logic.units[FIELD-CATEGORY-DEFINITION].test_refs`：Unknown task test: CHECK-149（logic.test.unknown）
- `plan.logic.units[FIELD-CATEGORY-DEFINITION].test_refs`：Unknown task test: CHECK-148（logic.test.unknown）
- `plan.logic.units[FIELD-CATEGORY-DEFINITION].test_refs`：Unknown task test: CHECK-120（logic.test.unknown）
- `plan.logic.units[FIELD-CATEGORY-DEFINITION].test_refs`：Unknown task test: CHECK-133（logic.test.unknown）
- `plan.logic.units[FIELD-CATEGORY-DEFINITION].test_refs`：Unknown task test: CHECK-147（logic.test.unknown）
- `plan.logic.units[FIELD-CATEGORY-ARCHIVE].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[FIELD-CATEGORY-ARCHIVE].test_refs`：Unknown task test: CHECK-149（logic.test.unknown）
- `plan.logic.units[FIELD-CATEGORY-ARCHIVE].test_refs`：Unknown task test: CHECK-ARCHIVE-CLOSURE（logic.test.unknown）
- `plan.logic.units[FIELD-CATEGORY-ARCHIVE].test_refs`：Unknown task test: CHECK-148（logic.test.unknown）
- `plan.logic.units[FIELD-CATEGORY-ARCHIVE].test_refs`：Unknown task test: CHECK-150（logic.test.unknown）
- `plan.logic.units[FIELD-CALL-CONTEXT].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[FIELD-CALL-CONTEXT].test_refs`：Unknown task test: CHECK-115（logic.test.unknown）
- `plan.logic.units[FIELD-CALL-CONTEXT].test_refs`：Unknown task test: CHECK-AUTH（logic.test.unknown）
- `plan.logic.units[FIELD-CALL-CONTEXT].test_refs`：Unknown task test: CHECK-150（logic.test.unknown）
- `plan.logic.units[FIELD-CALL-CONTEXT].test_refs`：Unknown task test: CHECK-148（logic.test.unknown）
- `plan.logic.units[FIELD-CALL-CONTEXT].test_refs`：Unknown task test: CHECK-133（logic.test.unknown）
- `plan.logic.units[FIELD-CALL-VERSION].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[FIELD-CALL-VERSION].test_refs`：Unknown task test: CHECK-133（logic.test.unknown）
- `plan.logic.units[FIELD-CALL-VERSION].test_refs`：Unknown task test: CHECK-CALL-VERSION（logic.test.unknown）
- `plan.logic.units[FIELD-CALL-VERSION].test_refs`：Unknown task test: CHECK-150（logic.test.unknown）
- `plan.logic.units[FIELD-OFFICIAL-SERIES-ID].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[FIELD-OFFICIAL-SERIES-ID].test_refs`：Unknown task test: CHECK-117（logic.test.unknown）
- `plan.logic.units[FIELD-OFFICIAL-SERIES-ID].test_refs`：Unknown task test: CHECK-113（logic.test.unknown）
- `plan.logic.units[FIELD-OFFICIAL-SERIES-ID].test_refs`：Unknown task test: CHECK-138（logic.test.unknown）
- `plan.logic.units[FIELD-SERIES-CODE].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[FIELD-SERIES-CODE].test_refs`：Unknown task test: CHECK-117（logic.test.unknown）
- `plan.logic.units[FIELD-SERIES-CODE].test_refs`：Unknown task test: CHECK-113（logic.test.unknown）
- `plan.logic.units[FIELD-SERIES-CODE].test_refs`：Unknown task test: CHECK-138（logic.test.unknown）
- `plan.logic.units[FIELD-SERIES-NAME].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[FIELD-SERIES-NAME].test_refs`：Unknown task test: CHECK-117（logic.test.unknown）
- `plan.logic.units[FIELD-SERIES-NAME].test_refs`：Unknown task test: CHECK-138（logic.test.unknown）
- `plan.logic.units[FIELD-SERIES-MEDIA-ID].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[FIELD-SERIES-MEDIA-ID].test_refs`：Unknown task test: CHECK-117（logic.test.unknown）
- `plan.logic.units[FIELD-SERIES-MEDIA-ID].test_refs`：Unknown task test: CHECK-113（logic.test.unknown）
- `plan.logic.units[FIELD-SERIES-MEDIA-ID].test_refs`：Unknown task test: CHECK-138（logic.test.unknown）
- `plan.logic.units[FIELD-SERIES-SOURCE-STATE].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[FIELD-SERIES-SOURCE-STATE].test_refs`：Unknown task test: CHECK-113（logic.test.unknown）
- `plan.logic.units[FIELD-SERIES-SOURCE-STATE].test_refs`：Unknown task test: CHECK-138（logic.test.unknown）
- `plan.logic.units[FIELD-SERIES-SELECTION].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[FIELD-SERIES-SELECTION].test_refs`：Unknown task test: CHECK-115（logic.test.unknown）
- `plan.logic.units[FIELD-SERIES-SELECTION].test_refs`：Unknown task test: CHECK-137（logic.test.unknown）
- `plan.logic.units[FIELD-SERIES-SELECTION].test_refs`：Unknown task test: CHECK-138（logic.test.unknown）
- `plan.logic.units[FIELD-SERIES-SELECTION].test_refs`：Unknown task test: CHECK-119（logic.test.unknown）
- `plan.logic.units[FIELD-SERIES-SELECTION].test_refs`：Unknown task test: CHECK-132（logic.test.unknown）
- `plan.logic.units[FIELD-SERIES-SELECTION].test_refs`：Unknown task test: CHECK-112（logic.test.unknown）
- `plan.logic.units[FIELD-SERIES-SELECTION].test_refs`：Unknown task test: CHECK-135（logic.test.unknown）
- `plan.logic.units[FIELD-MAPPING-MEDIA-FILTER].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[FIELD-MAPPING-MEDIA-FILTER].test_refs`：Unknown task test: CHECK-113（logic.test.unknown）
- `plan.logic.units[FIELD-MAPPING-STATE-FILTER].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[FIELD-MAPPING-STATE-FILTER].test_refs`：Unknown task test: CHECK-115（logic.test.unknown）
- `plan.logic.units[FIELD-MAPPING-STATE-FILTER].test_refs`：Unknown task test: CHECK-113（logic.test.unknown）
- `plan.logic.units[FIELD-PLANNED-STORE].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[FIELD-PLANNED-STORE].test_refs`：Unknown task test: CHECK-120（logic.test.unknown）
- `plan.logic.units[FIELD-PLANNED-STORE].test_refs`：Unknown task test: CHECK-114（logic.test.unknown）
- `plan.logic.units[FIELD-PLANNED-STORE].test_refs`：Unknown task test: CHECK-121（logic.test.unknown）
- `plan.logic.units[FIELD-PLANNED-STORE].test_refs`：Unknown task test: CHECK-138（logic.test.unknown）
- `plan.logic.units[FIELD-IMPORTED-INTENTION].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[FIELD-IMPORTED-INTENTION].test_refs`：Unknown task test: CHECK-116（logic.test.unknown）
- `plan.logic.units[FIELD-IMPORTED-INTENTION].test_refs`：Unknown task test: CHECK-114（logic.test.unknown）
- `plan.logic.units[FIELD-IMPORTED-INTENTION].test_refs`：Unknown task test: CHECK-117（logic.test.unknown）
- `plan.logic.units[FIELD-IMPORTED-INTENTION].test_refs`：Unknown task test: CHECK-IMPORT-RACE（logic.test.unknown）
- `plan.logic.units[FIELD-OTHER-BUSINESS-VALUES].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[FIELD-OTHER-BUSINESS-VALUES].test_refs`：Unknown task test: CHECK-138（logic.test.unknown）
- `plan.logic.units[FIELD-OTHER-BUSINESS-VALUES].test_refs`：Unknown task test: CHECK-UNCONNECTED（logic.test.unknown）
- `plan.logic.units[FIELD-OTHER-BUSINESS-VALUES].test_refs`：Unknown task test: CHECK-133（logic.test.unknown）
- `plan.logic.units[FIELD-OTHER-BUSINESS-VALUES].test_refs`：Unknown task test: CHECK-119（logic.test.unknown）
- `plan.logic.units[FIELD-OTHER-BUSINESS-VALUES].test_refs`：Unknown task test: CHECK-125（logic.test.unknown）
- `plan.logic.units[FIELD-SAVED-BUSINESS-SNAPSHOT].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[FIELD-SAVED-BUSINESS-SNAPSHOT].test_refs`：Unknown task test: CHECK-150（logic.test.unknown）
- `plan.logic.units[FIELD-SAVED-BUSINESS-SNAPSHOT].test_refs`：Unknown task test: CHECK-138（logic.test.unknown）
- `plan.logic.units[FIELD-SAVED-BUSINESS-SNAPSHOT].test_refs`：Unknown task test: CHECK-148（logic.test.unknown）
- `plan.logic.units[FIELD-SAVED-BUSINESS-SNAPSHOT].test_refs`：Unknown task test: CHECK-133（logic.test.unknown）
- `plan.logic.units[FIELD-SAVED-BUSINESS-SNAPSHOT].test_refs`：Unknown task test: CHECK-HISTORY-ISOLATION（logic.test.unknown）
- `plan.logic.units[FIELD-DEFINITION-ENABLED].test_refs`：Each logic unit and field must be referenced by an implementation task.（logic.unit.unowned）
- `plan.logic.units[FIELD-DEFINITION-ENABLED].test_refs`：Unknown task test: CHECK-133（logic.test.unknown）
- `plan.logic.units[FIELD-DEFINITION-ENABLED].test_refs`：Unknown task test: CHECK-FIELD-LIFECYCLE（logic.test.unknown）
- `plan.logic.locals[LOCAL-DICT-CREATE].branches[LOCAL-DICT-CREATE-BRANCH-1]`：Unknown branch test: CHECK-127（logic.test.unknown）
- `plan.logic.locals[LOCAL-DICT-CREATE].branches[LOCAL-DICT-CREATE-BRANCH-1]`：Unknown branch test: CHECK-105（logic.test.unknown）
- `plan.logic.locals[LOCAL-DICT-CREATE].branches[LOCAL-DICT-CREATE-BRANCH-2]`：Unknown branch test: CHECK-127（logic.test.unknown）
- `plan.logic.locals[LOCAL-DICT-CREATE].branches[LOCAL-DICT-CREATE-BRANCH-2]`：Unknown branch test: CHECK-105（logic.test.unknown）
- `plan.logic.locals[LOCAL-DICT-CREATE].branches[LOCAL-DICT-CREATE-BRANCH-3]`：Unknown branch test: CHECK-127（logic.test.unknown）
- `plan.logic.locals[LOCAL-DICT-EDIT].branches[LOCAL-DICT-EDIT-BRANCH-1]`：Unknown branch test: CHECK-IMPLICIT-REFERENCE（logic.test.unknown）
- `plan.logic.locals[LOCAL-DICT-EDIT].branches[LOCAL-DICT-EDIT-BRANCH-1]`：Unknown branch test: CHECK-128（logic.test.unknown）
- `plan.logic.locals[LOCAL-DICT-EDIT].branches[LOCAL-DICT-EDIT-BRANCH-2]`：Unknown branch test: CHECK-131（logic.test.unknown）
- `plan.logic.locals[LOCAL-DICT-EDIT].branches[LOCAL-DICT-EDIT-BRANCH-2]`：Unknown branch test: CHECK-128（logic.test.unknown）
- `plan.logic.locals[LOCAL-DICT-EDIT].branches[LOCAL-DICT-EDIT-BRANCH-3]`：Unknown branch test: CHECK-REFERENCE-RACE（logic.test.unknown）
- `plan.logic.locals[LOCAL-DICT-ENABLE].branches[LOCAL-DICT-ENABLE-BRANCH-1]`：Unknown branch test: CHECK-129（logic.test.unknown）
- `plan.logic.locals[LOCAL-DICT-ENABLE].branches[LOCAL-DICT-ENABLE-BRANCH-2]`：Unknown branch test: CHECK-137（logic.test.unknown）
- `plan.logic.locals[LOCAL-DICT-DISABLE].branches[LOCAL-DICT-DISABLE-BRANCH-1]`：Unknown branch test: CHECK-131（logic.test.unknown）
- `plan.logic.locals[LOCAL-DICT-DISABLE].branches[LOCAL-DICT-DISABLE-BRANCH-1]`：Unknown branch test: CHECK-130（logic.test.unknown）
- `plan.logic.locals[LOCAL-DICT-DISABLE].branches[LOCAL-DICT-DISABLE-BRANCH-2]`：Unknown branch test: CHECK-130（logic.test.unknown）
- `plan.logic.locals[LOCAL-TENANT-GRANT].branches[LOCAL-TENANT-GRANT-BRANCH-1]`：Unknown branch test: CHECK-108（logic.test.unknown）
- `plan.logic.locals[LOCAL-TENANT-GRANT].branches[LOCAL-TENANT-GRANT-BRANCH-1]`：Unknown branch test: CHECK-107（logic.test.unknown）
- `plan.logic.locals[LOCAL-TENANT-GRANT].branches[LOCAL-TENANT-GRANT-BRANCH-2]`：Unknown branch test: CHECK-AUTH（logic.test.unknown）
- `plan.logic.locals[LOCAL-TENANT-GRANT].branches[LOCAL-TENANT-GRANT-BRANCH-2]`：Unknown branch test: CHECK-107（logic.test.unknown）
- `plan.logic.locals[LOCAL-TENANT-REVOKE].branches[LOCAL-TENANT-REVOKE-BRANCH-1]`：Unknown branch test: CHECK-123（logic.test.unknown）
- `plan.logic.locals[LOCAL-TENANT-REVOKE].branches[LOCAL-TENANT-REVOKE-BRANCH-1]`：Unknown branch test: CHECK-122（logic.test.unknown）
- `plan.logic.locals[LOCAL-TENANT-REVOKE].branches[LOCAL-TENANT-REVOKE-BRANCH-2]`：Unknown branch test: CHECK-122（logic.test.unknown）
- `plan.logic.locals[LOCAL-FIELD-SAVE].branches[LOCAL-FIELD-SAVE-BRANCH-1]`：Unknown branch test: CHECK-109（logic.test.unknown）
- `plan.logic.locals[LOCAL-FIELD-SAVE].branches[LOCAL-FIELD-SAVE-BRANCH-2]`：Unknown branch test: CHECK-110（logic.test.unknown）
- `plan.logic.locals[LOCAL-FIELD-SAVE].branches[LOCAL-FIELD-SAVE-BRANCH-2]`：Unknown branch test: CHECK-125（logic.test.unknown）
- `plan.logic.locals[LOCAL-FIELD-SAVE].branches[LOCAL-FIELD-SAVE-BRANCH-3]`：Unknown branch test: CHECK-124（logic.test.unknown）
- `plan.logic.locals[LOCAL-FIELD-SAVE].branches[LOCAL-FIELD-SAVE-BRANCH-3]`：Unknown branch test: CHECK-110（logic.test.unknown）
- `plan.logic.locals[LOCAL-FIELD-SAVE].branches[LOCAL-FIELD-SAVE-BRANCH-4]`：Unknown branch test: CHECK-109（logic.test.unknown）
- `plan.logic.locals[LOCAL-FIELD-SAVE].branches[LOCAL-FIELD-SAVE-BRANCH-4]`：Unknown branch test: CHECK-133（logic.test.unknown）
- `plan.logic.locals[LOCAL-CLASS-FIELDS-SAVE].branches[LOCAL-CLASS-FIELDS-SAVE-BRANCH-1]`：Unknown branch test: CHECK-124（logic.test.unknown）
- `plan.logic.locals[LOCAL-CLASS-FIELDS-SAVE].branches[LOCAL-CLASS-FIELDS-SAVE-BRANCH-1]`：Unknown branch test: CHECK-111（logic.test.unknown）
- `plan.logic.locals[LOCAL-CLASS-FIELDS-SAVE].branches[LOCAL-CLASS-FIELDS-SAVE-BRANCH-1]`：Unknown branch test: CHECK-134（logic.test.unknown）
- `plan.logic.locals[LOCAL-CLASS-FIELDS-SAVE].branches[LOCAL-CLASS-FIELDS-SAVE-BRANCH-2]`：Unknown branch test: CHECK-124（logic.test.unknown）
- `plan.logic.locals[LOCAL-CLASS-FIELDS-SAVE].branches[LOCAL-CLASS-FIELDS-SAVE-BRANCH-2]`：Unknown branch test: CHECK-125（logic.test.unknown）
- `plan.logic.locals[LOCAL-CLASS-FIELDS-SAVE].branches[LOCAL-CLASS-FIELDS-SAVE-BRANCH-2]`：Unknown branch test: CHECK-111（logic.test.unknown）
- `plan.logic.locals[LOCAL-CLASS-FIELDS-SAVE].branches[LOCAL-CLASS-FIELDS-SAVE-BRANCH-2]`：Unknown branch test: CHECK-134（logic.test.unknown）
- `plan.logic.locals[LOCAL-CLASS-FIELDS-SAVE].branches[LOCAL-CLASS-FIELDS-SAVE-BRANCH-3]`：Unknown branch test: CHECK-146（logic.test.unknown）
- `plan.logic.locals[LOCAL-CLASS-FIELDS-SAVE].branches[LOCAL-CLASS-FIELDS-SAVE-BRANCH-3]`：Unknown branch test: CHECK-EMPTY-CATALOG（logic.test.unknown）
- `plan.logic.locals[LOCAL-CALL-FORM].branches[LOCAL-CALL-FORM-BRANCH-1]`：Unknown branch test: CHECK-133（logic.test.unknown）
- `plan.logic.locals[LOCAL-CALL-FORM].branches[LOCAL-CALL-FORM-BRANCH-1]`：Unknown branch test: CHECK-148（logic.test.unknown）
- `plan.logic.locals[LOCAL-CALL-FORM].branches[LOCAL-CALL-FORM-BRANCH-1]`：Unknown branch test: CHECK-150（logic.test.unknown）
- `plan.logic.locals[LOCAL-CALL-FORM].branches[LOCAL-CALL-FORM-BRANCH-2]`：Unknown branch test: CHECK-133（logic.test.unknown）
- `plan.logic.locals[LOCAL-CALL-FORM].branches[LOCAL-CALL-FORM-BRANCH-2]`：Unknown branch test: CHECK-CALL-VERSION（logic.test.unknown）
- `plan.logic.locals[LOCAL-CALL-FORM].branches[LOCAL-CALL-FORM-BRANCH-3]`：Unknown branch test: CHECK-148（logic.test.unknown）
- `plan.logic.locals[LOCAL-SERIES-QUERY].branches[LOCAL-SERIES-QUERY-BRANCH-1]`：Unknown branch test: CHECK-115（logic.test.unknown）
- `plan.logic.locals[LOCAL-SERIES-QUERY].branches[LOCAL-SERIES-QUERY-BRANCH-1]`：Unknown branch test: CHECK-130（logic.test.unknown）
- `plan.logic.locals[LOCAL-SERIES-QUERY].branches[LOCAL-SERIES-QUERY-BRANCH-1]`：Unknown branch test: CHECK-123（logic.test.unknown）
- `plan.logic.locals[LOCAL-SERIES-QUERY].branches[LOCAL-SERIES-QUERY-BRANCH-2]`：Unknown branch test: CHECK-115（logic.test.unknown）
- `plan.logic.locals[LOCAL-SERIES-QUERY].branches[LOCAL-SERIES-QUERY-BRANCH-2]`：Unknown branch test: CHECK-112（logic.test.unknown）
- `plan.logic.locals[LOCAL-SERIES-QUERY].branches[LOCAL-SERIES-QUERY-BRANCH-3]`：Unknown branch test: CHECK-115（logic.test.unknown）
- `plan.logic.locals[LOCAL-SERIES-QUERY].branches[LOCAL-SERIES-QUERY-BRANCH-3]`：Unknown branch test: CHECK-135（logic.test.unknown）
- `plan.logic.locals[LOCAL-SERIES-QUERY].branches[LOCAL-SERIES-QUERY-BRANCH-4]`：Unknown branch test: CHECK-133（logic.test.unknown）
- `plan.logic.locals[LOCAL-SERIES-QUERY].branches[LOCAL-SERIES-QUERY-BRANCH-4]`：Unknown branch test: CHECK-135（logic.test.unknown）
- `plan.logic.locals[LOCAL-SERIES-QUERY].branches[LOCAL-SERIES-QUERY-BRANCH-5]`：Unknown branch test: CHECK-137（logic.test.unknown）
- `plan.logic.locals[LOCAL-GENERIC-QUERY].branches[LOCAL-GENERIC-QUERY-BRANCH-1]`：Unknown branch test: CHECK-OPTIONAL-CHAIN（logic.test.unknown）
- `plan.logic.locals[LOCAL-GENERIC-QUERY].branches[LOCAL-GENERIC-QUERY-BRANCH-1]`：Unknown branch test: CHECK-125（logic.test.unknown）
- `plan.logic.locals[LOCAL-GENERIC-QUERY].branches[LOCAL-GENERIC-QUERY-BRANCH-1]`：Unknown branch test: CHECK-134（logic.test.unknown）
- `plan.logic.locals[LOCAL-GENERIC-QUERY].branches[LOCAL-GENERIC-QUERY-BRANCH-2]`：Unknown branch test: CHECK-125（logic.test.unknown）
- `plan.logic.locals[LOCAL-GENERIC-QUERY].branches[LOCAL-GENERIC-QUERY-BRANCH-2]`：Unknown branch test: CHECK-134（logic.test.unknown）
- `plan.logic.locals[LOCAL-GENERIC-QUERY].branches[LOCAL-GENERIC-QUERY-BRANCH-3]`：Unknown branch test: CHECK-126（logic.test.unknown）
- `plan.logic.locals[LOCAL-GENERIC-QUERY].branches[LOCAL-GENERIC-QUERY-BRANCH-3]`：Unknown branch test: CHECK-136（logic.test.unknown）
- `plan.logic.locals[LOCAL-GENERIC-QUERY].branches[LOCAL-GENERIC-QUERY-BRANCH-3]`：Unknown branch test: CHECK-137（logic.test.unknown）
- `plan.logic.locals[LOCAL-GENERIC-QUERY].branches[LOCAL-GENERIC-QUERY-BRANCH-4]`：Unknown branch test: CHECK-118（logic.test.unknown）
- `plan.logic.locals[LOCAL-GENERIC-QUERY].branches[LOCAL-GENERIC-QUERY-BRANCH-4]`：Unknown branch test: CHECK-114（logic.test.unknown）
- `plan.logic.locals[LOCAL-GENERIC-QUERY].branches[LOCAL-GENERIC-QUERY-BRANCH-4]`：Unknown branch test: CHECK-136（logic.test.unknown）
- `plan.logic.locals[LOCAL-IMPORT-CONFIRM].branches[LOCAL-IMPORT-CONFIRM-BRANCH-1]`：Unknown branch test: CHECK-117（logic.test.unknown）
- `plan.logic.locals[LOCAL-IMPORT-CONFIRM].branches[LOCAL-IMPORT-CONFIRM-BRANCH-2]`：Unknown branch test: CHECK-115（logic.test.unknown）
- `plan.logic.locals[LOCAL-IMPORT-CONFIRM].branches[LOCAL-IMPORT-CONFIRM-BRANCH-2]`：Unknown branch test: CHECK-IMPORT-RACE（logic.test.unknown）
- `plan.logic.locals[LOCAL-FOLLOWUP-SAVE].branches[LOCAL-FOLLOWUP-SAVE-BRANCH-1]`：Unknown branch test: CHECK-132（logic.test.unknown）
- `plan.logic.locals[LOCAL-FOLLOWUP-SAVE].branches[LOCAL-FOLLOWUP-SAVE-BRANCH-1]`：Unknown branch test: CHECK-119（logic.test.unknown）
- `plan.logic.locals[LOCAL-FOLLOWUP-SAVE].branches[LOCAL-FOLLOWUP-SAVE-BRANCH-1]`：Unknown branch test: CHECK-121（logic.test.unknown）
- `plan.logic.locals[LOCAL-FOLLOWUP-SAVE].branches[LOCAL-FOLLOWUP-SAVE-BRANCH-2]`：Unknown branch test: CHECK-135（logic.test.unknown）
- `plan.logic.locals[LOCAL-FOLLOWUP-SAVE].branches[LOCAL-FOLLOWUP-SAVE-BRANCH-3]`：Unknown branch test: CHECK-UNCONNECTED（logic.test.unknown）
- `plan.logic.locals[LOCAL-FOLLOWUP-SAVE].branches[LOCAL-FOLLOWUP-SAVE-BRANCH-4]`：Unknown branch test: CHECK-DRAFT-RESULT（logic.test.unknown）
- `plan.logic.locals[LOCAL-FOLLOWUP-SAVE].branches[LOCAL-FOLLOWUP-SAVE-BRANCH-4]`：Unknown branch test: CHECK-133（logic.test.unknown）
- `plan.logic.locals[LOCAL-FOLLOWUP-SAVE].branches[LOCAL-FOLLOWUP-SAVE-BRANCH-4]`：Unknown branch test: CHECK-132（logic.test.unknown）
- `plan.logic.locals[LOCAL-FOLLOWUP-SAVE].branches[LOCAL-FOLLOWUP-SAVE-BRANCH-5]`：Unknown branch test: CHECK-148（logic.test.unknown）
- `plan.logic.locals[LOCAL-FOLLOWUP-SAVE].branches[LOCAL-FOLLOWUP-SAVE-BRANCH-5]`：Unknown branch test: CHECK-150（logic.test.unknown）
- `plan.logic.locals[LOCAL-READ-CALL].branches[LOCAL-READ-CALL-BRANCH-1]`：Unknown branch test: CHECK-138（logic.test.unknown）
- `plan.logic.locals[LOCAL-READ-CALL].branches[LOCAL-READ-CALL-BRANCH-2]`：Unknown branch test: CHECK-148（logic.test.unknown）
- `plan.logic.locals[LOCAL-READ-CALL].branches[LOCAL-READ-CALL-BRANCH-2]`：Unknown branch test: CHECK-138（logic.test.unknown）
- `plan.logic.locals[LOCAL-READ-CUSTOMER].branches[LOCAL-READ-CUSTOMER-BRANCH-1]`：Unknown branch test: CHECK-HISTORY-ISOLATION（logic.test.unknown）
- `plan.logic.locals[LOCAL-READ-CUSTOMER].branches[LOCAL-READ-CUSTOMER-BRANCH-1]`：Unknown branch test: CHECK-138（logic.test.unknown）
- `plan.logic.locals[LOCAL-READ-CUSTOMER].branches[LOCAL-READ-CUSTOMER-BRANCH-2]`：Unknown branch test: CHECK-148（logic.test.unknown）
- `plan.logic.locals[LOCAL-READ-CUSTOMER].branches[LOCAL-READ-CUSTOMER-BRANCH-2]`：Unknown branch test: CHECK-150（logic.test.unknown）
- `plan.logic.locals[LOCAL-DICT-DELETE].branches[LOCAL-DICT-DELETE-BRANCH-1]`：Unknown branch test: CHECK-140（logic.test.unknown）
- `plan.logic.locals[LOCAL-DICT-DELETE].branches[LOCAL-DICT-DELETE-BRANCH-2]`：Unknown branch test: CHECK-REFERENCE-RACE（logic.test.unknown）
- `plan.logic.locals[LOCAL-DICT-DELETE].branches[LOCAL-DICT-DELETE-BRANCH-2]`：Unknown branch test: CHECK-141（logic.test.unknown）
- `plan.logic.locals[LOCAL-DICT-DELETE].branches[LOCAL-DICT-DELETE-BRANCH-3]`：Unknown branch test: CHECK-142（logic.test.unknown）
- `plan.logic.locals[LOCAL-DICT-DELETE].branches[LOCAL-DICT-DELETE-BRANCH-3]`：Unknown branch test: CHECK-EMPTY-CATALOG（logic.test.unknown）
- `plan.logic.locals[LOCAL-FIELD-DELETE].branches[LOCAL-FIELD-DELETE-BRANCH-1]`：Unknown branch test: CHECK-REFERENCE-EDIT（logic.test.unknown）
- `plan.logic.locals[LOCAL-FIELD-DELETE].branches[LOCAL-FIELD-DELETE-BRANCH-1]`：Unknown branch test: CHECK-144（logic.test.unknown）
- `plan.logic.locals[LOCAL-FIELD-DELETE].branches[LOCAL-FIELD-DELETE-BRANCH-2]`：Unknown branch test: CHECK-143（logic.test.unknown）
- `plan.logic.locals[LOCAL-FIELD-DELETE].branches[LOCAL-FIELD-DELETE-BRANCH-2]`：Unknown branch test: CHECK-146（logic.test.unknown）
- `plan.logic.locals[LOCAL-FIELD-DELETE].branches[LOCAL-FIELD-DELETE-BRANCH-3]`：Unknown branch test: CHECK-145（logic.test.unknown）
- `plan.logic.locals[LOCAL-CATEGORY-RETIRE].branches[LOCAL-CATEGORY-RETIRE-BRANCH-1]`：Unknown branch test: CHECK-147（logic.test.unknown）
- `plan.logic.locals[LOCAL-CATEGORY-RETIRE].branches[LOCAL-CATEGORY-RETIRE-BRANCH-1]`：Unknown branch test: CHECK-148（logic.test.unknown）
- `plan.logic.locals[LOCAL-CATEGORY-RETIRE].branches[LOCAL-CATEGORY-RETIRE-BRANCH-1]`：Unknown branch test: CHECK-150（logic.test.unknown）
- `plan.logic.locals[LOCAL-CATEGORY-RETIRE].branches[LOCAL-CATEGORY-RETIRE-BRANCH-2]`：Unknown branch test: CHECK-149（logic.test.unknown）
- `plan.logic.locals[LOCAL-CATEGORY-RETIRE].branches[LOCAL-CATEGORY-RETIRE-BRANCH-3]`：Unknown branch test: CHECK-148（logic.test.unknown）
- `plan.logic.locals[LOCAL-CATEGORY-RETIRE].branches[LOCAL-CATEGORY-RETIRE-BRANCH-4]`：Unknown branch test: CHECK-ARCHIVE-CLOSURE（logic.test.unknown）
- `plan.logic.locals[LOCAL-CATEGORY-RETIRE].branches[LOCAL-CATEGORY-RETIRE-BRANCH-4]`：Unknown branch test: CHECK-150（logic.test.unknown）
- `plan.logic.locals[LOCAL-FIELD-ENABLE].branches[LOCAL-FIELD-ENABLE-BRANCH-1]`：Unknown branch test: CHECK-AUTH（logic.test.unknown）
- `plan.logic.locals[LOCAL-FIELD-ENABLE].branches[LOCAL-FIELD-ENABLE-BRANCH-1]`：Unknown branch test: CHECK-133（logic.test.unknown）
- `plan.logic.locals[LOCAL-FIELD-ENABLE].branches[LOCAL-FIELD-ENABLE-BRANCH-1]`：Unknown branch test: CHECK-FIELD-LIFECYCLE（logic.test.unknown）
- `plan.logic.locals[LOCAL-FIELD-ENABLE].branches[LOCAL-FIELD-ENABLE-BRANCH-2]`：Unknown branch test: CHECK-133（logic.test.unknown）
- `plan.logic.locals[LOCAL-FIELD-ENABLE].branches[LOCAL-FIELD-ENABLE-BRANCH-2]`：Unknown branch test: CHECK-FIELD-LIFECYCLE（logic.test.unknown）
- `plan.logic.locals[LOCAL-FIELD-DISABLE].branches[LOCAL-FIELD-DISABLE-BRANCH-1]`：Unknown branch test: CHECK-AUTH（logic.test.unknown）
- `plan.logic.locals[LOCAL-FIELD-DISABLE].branches[LOCAL-FIELD-DISABLE-BRANCH-1]`：Unknown branch test: CHECK-133（logic.test.unknown）
- `plan.logic.locals[LOCAL-FIELD-DISABLE].branches[LOCAL-FIELD-DISABLE-BRANCH-1]`：Unknown branch test: CHECK-FIELD-LIFECYCLE（logic.test.unknown）
- `plan.logic.locals[LOCAL-FIELD-DISABLE].branches[LOCAL-FIELD-DISABLE-BRANCH-2]`：Unknown branch test: CHECK-133（logic.test.unknown）
- `plan.logic.locals[LOCAL-FIELD-DISABLE].branches[LOCAL-FIELD-DISABLE-BRANCH-2]`：Unknown branch test: CHECK-FIELD-LIFECYCLE（logic.test.unknown）
- `plan.logic.locals[LOCAL-FIELD-DISABLE].branches[LOCAL-FIELD-DISABLE-BRANCH-3]`：Unknown branch test: CHECK-FIELD-LIFECYCLE（logic.test.unknown）
- `plan.ui.pages[UI-PAGE-006]`：Each UI page needs an implementation task with ui_page_ids.（ui.task.owner）
- `plan.ui.pages[UI-PAGE-006]`：All page local logic must be implemented by tasks referencing this page.（ui.task.locals）
- `plan.ui.pages[UI-PAGE-006]`：UI fields must be implemented by tasks referencing this page.（ui.task.fields）
- `plan.ui.pages[UI-PAGE-006].test_refs`：UI test CHECK-123 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-006].test_refs`：UI test CHECK-IMPLICIT-REFERENCE must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-006].test_refs`：UI test CHECK-105 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-006].test_refs`：UI test CHECK-137 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-006].test_refs`：UI test CHECK-130 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-006].test_refs`：UI test CHECK-140 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-006].test_refs`：UI test CHECK-127 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-006].test_refs`：UI test CHECK-142 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-006].test_refs`：UI test CHECK-128 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-006].test_refs`：UI test CHECK-REFERENCE-RACE must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-006].test_refs`：UI test CHECK-108 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-006].test_refs`：UI test CHECK-131 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-006].test_refs`：UI test CHECK-129 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-006].test_refs`：UI test CHECK-122 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-006].test_refs`：UI test CHECK-106 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-006].test_refs`：UI test CHECK-107 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-006].test_refs`：UI test CHECK-139 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-006].test_refs`：UI test CHECK-141 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-007]`：Each UI page needs an implementation task with ui_page_ids.（ui.task.owner）
- `plan.ui.pages[UI-PAGE-007]`：All page local logic must be implemented by tasks referencing this page.（ui.task.locals）
- `plan.ui.pages[UI-PAGE-007]`：UI fields must be implemented by tasks referencing this page.（ui.task.fields）
- `plan.ui.pages[UI-PAGE-007].test_refs`：UI test CHECK-150 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-007].test_refs`：UI test CHECK-124 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-007].test_refs`：UI test CHECK-110 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-007].test_refs`：UI test CHECK-FIELD-LIFECYCLE must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-007].test_refs`：UI test CHECK-108 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-007].test_refs`：UI test CHECK-133 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-007].test_refs`：UI test CHECK-125 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-007].test_refs`：UI test CHECK-147 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-007].test_refs`：UI test CHECK-134 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-007].test_refs`：UI test CHECK-145 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-007].test_refs`：UI test CHECK-149 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-007].test_refs`：UI test CHECK-ARCHIVE-CLOSURE must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-007].test_refs`：UI test CHECK-109 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-007].test_refs`：UI test CHECK-146 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-007].test_refs`：UI test CHECK-148 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-007].test_refs`：UI test CHECK-121 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-007].test_refs`：UI test CHECK-144 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-007].test_refs`：UI test CHECK-120 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-007].test_refs`：UI test CHECK-143 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-007].test_refs`：UI test CHECK-111 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-007].test_refs`：UI test CHECK-REFERENCE-EDIT must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008]`：Each UI page needs an implementation task with ui_page_ids.（ui.task.owner）
- `plan.ui.pages[UI-PAGE-008]`：All page local logic must be implemented by tasks referencing this page.（ui.task.locals）
- `plan.ui.pages[UI-PAGE-008]`：UI fields must be implemented by tasks referencing this page.（ui.task.fields）
- `plan.ui.pages[UI-PAGE-008].test_refs`：UI test CHECK-117 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].test_refs`：UI test CHECK-137 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].test_refs`：UI test CHECK-150 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].test_refs`：UI test CHECK-138 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].test_refs`：UI test CHECK-124 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].test_refs`：UI test CHECK-133 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].test_refs`：UI test CHECK-125 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].test_refs`：UI test CHECK-135 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].test_refs`：UI test CHECK-132 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].test_refs`：UI test CHECK-134 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].test_refs`：UI test CHECK-115 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].test_refs`：UI test CHECK-123 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].test_refs`：UI test CHECK-118 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].test_refs`：UI test CHECK-OPTIONAL-CHAIN must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].test_refs`：UI test CHECK-112 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].test_refs`：UI test CHECK-DRAFT-RESULT must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].test_refs`：UI test CHECK-IMPORT-RACE must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].test_refs`：UI test CHECK-148 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].test_refs`：UI test CHECK-114 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].test_refs`：UI test CHECK-119 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].test_refs`：UI test CHECK-113 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].test_refs`：UI test CHECK-121 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].test_refs`：UI test CHECK-126 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].test_refs`：UI test CHECK-116 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].test_refs`：UI test CHECK-120 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].test_refs`：UI test CHECK-136 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].test_refs`：UI test CHECK-CALL-VERSION must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-009]`：Each UI page needs an implementation task with ui_page_ids.（ui.task.owner）
- `plan.ui.pages[UI-PAGE-009]`：All page local logic must be implemented by tasks referencing this page.（ui.task.locals）
- `plan.ui.pages[UI-PAGE-009]`：UI fields must be implemented by tasks referencing this page.（ui.task.fields）
- `plan.ui.pages[UI-PAGE-009].test_refs`：UI test CHECK-150 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-009].test_refs`：UI test CHECK-116 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-009].test_refs`：UI test CHECK-148 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-009].test_refs`：UI test CHECK-138 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-010]`：Each UI page needs an implementation task with ui_page_ids.（ui.task.owner）
- `plan.ui.pages[UI-PAGE-010]`：All page local logic must be implemented by tasks referencing this page.（ui.task.locals）
- `plan.ui.pages[UI-PAGE-010]`：UI fields must be implemented by tasks referencing this page.（ui.task.fields）
- `plan.ui.pages[UI-PAGE-010].test_refs`：UI test CHECK-150 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-010].test_refs`：UI test CHECK-HISTORY-ISOLATION must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-010].test_refs`：UI test CHECK-148 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-010].test_refs`：UI test CHECK-138 must belong to a task referencing the page.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-006].interactions[UI-PAGE-006-ACTION-1].test_refs`：Interaction test CHECK-131 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-006].interactions[UI-PAGE-006-ACTION-1].test_refs`：Interaction test CHECK-127 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-006].interactions[UI-PAGE-006-ACTION-1].test_refs`：Interaction test CHECK-105 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-006].interactions[UI-PAGE-006-ACTION-1].test_refs`：Interaction test CHECK-106 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-006].interactions[UI-PAGE-006-ACTION-2].test_refs`：Interaction test CHECK-REFERENCE-RACE must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-006].interactions[UI-PAGE-006-ACTION-2].test_refs`：Interaction test CHECK-131 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-006].interactions[UI-PAGE-006-ACTION-2].test_refs`：Interaction test CHECK-IMPLICIT-REFERENCE must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-006].interactions[UI-PAGE-006-ACTION-2].test_refs`：Interaction test CHECK-128 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-006].interactions[UI-PAGE-006-ACTION-3].test_refs`：Interaction test CHECK-131 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-006].interactions[UI-PAGE-006-ACTION-3].test_refs`：Interaction test CHECK-129 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-006].interactions[UI-PAGE-006-ACTION-3].test_refs`：Interaction test CHECK-137 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-006].interactions[UI-PAGE-006-ACTION-4].test_refs`：Interaction test CHECK-123 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-006].interactions[UI-PAGE-006-ACTION-4].test_refs`：Interaction test CHECK-131 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-006].interactions[UI-PAGE-006-ACTION-4].test_refs`：Interaction test CHECK-130 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-006].interactions[UI-PAGE-006-ACTION-5].test_refs`：Interaction test CHECK-108 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-006].interactions[UI-PAGE-006-ACTION-5].test_refs`：Interaction test CHECK-107 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-006].interactions[UI-PAGE-006-ACTION-5].test_refs`：Interaction test CHECK-137 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-006].interactions[UI-PAGE-006-ACTION-6].test_refs`：Interaction test CHECK-123 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-006].interactions[UI-PAGE-006-ACTION-6].test_refs`：Interaction test CHECK-107 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-006].interactions[UI-PAGE-006-ACTION-6].test_refs`：Interaction test CHECK-137 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-006].interactions[UI-PAGE-006-ACTION-6].test_refs`：Interaction test CHECK-122 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-006].interactions[UI-PAGE-006-ACTION-7].test_refs`：Interaction test CHECK-142 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-006].interactions[UI-PAGE-006-ACTION-7].test_refs`：Interaction test CHECK-139 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-006].interactions[UI-PAGE-006-ACTION-7].test_refs`：Interaction test CHECK-140 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-006].interactions[UI-PAGE-006-ACTION-7].test_refs`：Interaction test CHECK-141 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-007].interactions[UI-PAGE-007-ACTION-1].test_refs`：Interaction test CHECK-124 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-007].interactions[UI-PAGE-007-ACTION-1].test_refs`：Interaction test CHECK-110 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-007].interactions[UI-PAGE-007-ACTION-1].test_refs`：Interaction test CHECK-109 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-007].interactions[UI-PAGE-007-ACTION-1].test_refs`：Interaction test CHECK-108 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-007].interactions[UI-PAGE-007-ACTION-1].test_refs`：Interaction test CHECK-133 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-007].interactions[UI-PAGE-007-ACTION-1].test_refs`：Interaction test CHECK-125 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-007].interactions[UI-PAGE-007-ACTION-1].test_refs`：Interaction test CHECK-111 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-007].interactions[UI-PAGE-007-ACTION-1].test_refs`：Interaction test CHECK-134 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-007].interactions[UI-PAGE-007-ACTION-2].test_refs`：Interaction test CHECK-124 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-007].interactions[UI-PAGE-007-ACTION-2].test_refs`：Interaction test CHECK-109 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-007].interactions[UI-PAGE-007-ACTION-2].test_refs`：Interaction test CHECK-120 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-007].interactions[UI-PAGE-007-ACTION-2].test_refs`：Interaction test CHECK-133 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-007].interactions[UI-PAGE-007-ACTION-2].test_refs`：Interaction test CHECK-146 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-007].interactions[UI-PAGE-007-ACTION-2].test_refs`：Interaction test CHECK-111 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-007].interactions[UI-PAGE-007-ACTION-2].test_refs`：Interaction test CHECK-121 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-007].interactions[UI-PAGE-007-ACTION-2].test_refs`：Interaction test CHECK-134 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-007].interactions[UI-PAGE-007-ACTION-3].test_refs`：Interaction test CHECK-145 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-007].interactions[UI-PAGE-007-ACTION-3].test_refs`：Interaction test CHECK-144 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-007].interactions[UI-PAGE-007-ACTION-3].test_refs`：Interaction test CHECK-143 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-007].interactions[UI-PAGE-007-ACTION-3].test_refs`：Interaction test CHECK-146 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-007].interactions[UI-PAGE-007-ACTION-3].test_refs`：Interaction test CHECK-REFERENCE-EDIT must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-007].interactions[UI-PAGE-007-ACTION-4].test_refs`：Interaction test CHECK-150 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-007].interactions[UI-PAGE-007-ACTION-4].test_refs`：Interaction test CHECK-149 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-007].interactions[UI-PAGE-007-ACTION-4].test_refs`：Interaction test CHECK-ARCHIVE-CLOSURE must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-007].interactions[UI-PAGE-007-ACTION-4].test_refs`：Interaction test CHECK-148 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-007].interactions[UI-PAGE-007-ACTION-4].test_refs`：Interaction test CHECK-147 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-007].interactions[UI-PAGE-007-FIELD-ENABLE].test_refs`：Interaction test CHECK-AUTH must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-007].interactions[UI-PAGE-007-FIELD-ENABLE].test_refs`：Interaction test CHECK-133 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-007].interactions[UI-PAGE-007-FIELD-ENABLE].test_refs`：Interaction test CHECK-FIELD-LIFECYCLE must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-007].interactions[UI-PAGE-007-FIELD-DISABLE].test_refs`：Interaction test CHECK-AUTH must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-007].interactions[UI-PAGE-007-FIELD-DISABLE].test_refs`：Interaction test CHECK-133 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-007].interactions[UI-PAGE-007-FIELD-DISABLE].test_refs`：Interaction test CHECK-FIELD-LIFECYCLE must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].interactions[UI-PAGE-008-ACTION-1].test_refs`：Interaction test CHECK-133 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].interactions[UI-PAGE-008-ACTION-1].test_refs`：Interaction test CHECK-CALL-VERSION must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].interactions[UI-PAGE-008-ACTION-1].test_refs`：Interaction test CHECK-148 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].interactions[UI-PAGE-008-ACTION-1].test_refs`：Interaction test CHECK-150 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].interactions[UI-PAGE-008-ACTION-2].test_refs`：Interaction test CHECK-115 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].interactions[UI-PAGE-008-ACTION-2].test_refs`：Interaction test CHECK-123 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].interactions[UI-PAGE-008-ACTION-2].test_refs`：Interaction test CHECK-137 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].interactions[UI-PAGE-008-ACTION-2].test_refs`：Interaction test CHECK-138 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].interactions[UI-PAGE-008-ACTION-2].test_refs`：Interaction test CHECK-113 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].interactions[UI-PAGE-008-ACTION-2].test_refs`：Interaction test CHECK-132 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].interactions[UI-PAGE-008-ACTION-2].test_refs`：Interaction test CHECK-112 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].interactions[UI-PAGE-008-ACTION-2].test_refs`：Interaction test CHECK-135 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].interactions[UI-PAGE-008-ACTION-3].test_refs`：Interaction test CHECK-118 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].interactions[UI-PAGE-008-ACTION-3].test_refs`：Interaction test CHECK-OPTIONAL-CHAIN must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].interactions[UI-PAGE-008-ACTION-3].test_refs`：Interaction test CHECK-115 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].interactions[UI-PAGE-008-ACTION-3].test_refs`：Interaction test CHECK-137 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].interactions[UI-PAGE-008-ACTION-3].test_refs`：Interaction test CHECK-124 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].interactions[UI-PAGE-008-ACTION-3].test_refs`：Interaction test CHECK-126 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].interactions[UI-PAGE-008-ACTION-3].test_refs`：Interaction test CHECK-119 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].interactions[UI-PAGE-008-ACTION-3].test_refs`：Interaction test CHECK-125 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].interactions[UI-PAGE-008-ACTION-3].test_refs`：Interaction test CHECK-136 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].interactions[UI-PAGE-008-ACTION-3].test_refs`：Interaction test CHECK-114 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].interactions[UI-PAGE-008-ACTION-3].test_refs`：Interaction test CHECK-135 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].interactions[UI-PAGE-008-ACTION-3].test_refs`：Interaction test CHECK-121 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].interactions[UI-PAGE-008-ACTION-3].test_refs`：Interaction test CHECK-134 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].interactions[UI-PAGE-008-ACTION-4].test_refs`：Interaction test CHECK-115 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].interactions[UI-PAGE-008-ACTION-4].test_refs`：Interaction test CHECK-117 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].interactions[UI-PAGE-008-ACTION-4].test_refs`：Interaction test CHECK-IMPORT-RACE must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].interactions[UI-PAGE-008-ACTION-4].test_refs`：Interaction test CHECK-116 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].interactions[UI-PAGE-008-ACTION-4].test_refs`：Interaction test CHECK-114 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].interactions[UI-PAGE-008-ACTION-5].test_refs`：Interaction test CHECK-123 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].interactions[UI-PAGE-008-ACTION-5].test_refs`：Interaction test CHECK-138 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].interactions[UI-PAGE-008-ACTION-5].test_refs`：Interaction test CHECK-150 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].interactions[UI-PAGE-008-ACTION-5].test_refs`：Interaction test CHECK-120 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].interactions[UI-PAGE-008-ACTION-5].test_refs`：Interaction test CHECK-135 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].interactions[UI-PAGE-008-ACTION-5].test_refs`：Interaction test CHECK-133 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].interactions[UI-PAGE-008-ACTION-5].test_refs`：Interaction test CHECK-119 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].interactions[UI-PAGE-008-ACTION-5].test_refs`：Interaction test CHECK-116 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].interactions[UI-PAGE-008-ACTION-5].test_refs`：Interaction test CHECK-DRAFT-RESULT must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].interactions[UI-PAGE-008-ACTION-5].test_refs`：Interaction test CHECK-114 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].interactions[UI-PAGE-008-ACTION-5].test_refs`：Interaction test CHECK-132 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-008].interactions[UI-PAGE-008-ACTION-5].test_refs`：Interaction test CHECK-121 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-009].interactions[UI-PAGE-009-ACTION-1].test_refs`：Interaction test CHECK-150 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-009].interactions[UI-PAGE-009-ACTION-1].test_refs`：Interaction test CHECK-116 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-009].interactions[UI-PAGE-009-ACTION-1].test_refs`：Interaction test CHECK-148 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-009].interactions[UI-PAGE-009-ACTION-1].test_refs`：Interaction test CHECK-138 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-010].interactions[UI-PAGE-010-ACTION-1].test_refs`：Interaction test CHECK-150 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-010].interactions[UI-PAGE-010-ACTION-1].test_refs`：Interaction test CHECK-HISTORY-ISOLATION must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-010].interactions[UI-PAGE-010-ACTION-1].test_refs`：Interaction test CHECK-148 must be owned by a task implementing this page interaction.（ui.test.owner）
- `plan.ui.pages[UI-PAGE-010].interactions[UI-PAGE-010-ACTION-1].test_refs`：Interaction test CHECK-138 must be owned by a task implementing this page interaction.（ui.test.owner）
- `engineering.readiness.scaffold.status`：脚手架与代码库入口尚未补齐，由开发方完成后再检查开工门禁。（readiness.pending）
- `engineering.readiness.stack.status`：技术栈与版本尚未补齐，由开发方完成后再检查开工门禁。（readiness.pending）
- `engineering.readiness.backend.status`：后端框架与服务边界尚未补齐，由开发方完成后再检查开工门禁。（readiness.pending）
- `engineering.readiness.data.status`：数据约定与字段映射尚未补齐，由开发方完成后再检查开工门禁。（readiness.pending）
- `engineering.readiness.api.status`：接口约定尚未补齐，由开发方完成后再检查开工门禁。（readiness.pending）
- `engineering.readiness.coding.status`：编码与协作规范尚未补齐，由开发方完成后再检查开工门禁。（readiness.pending）
- `engineering.readiness.verification.status`：测试与运行约定尚未补齐，由开发方完成后再检查开工门禁。（readiness.pending）

</details>
