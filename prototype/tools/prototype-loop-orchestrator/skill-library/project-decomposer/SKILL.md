---
name: project-decomposer
description: 面向 PM 原型循环的需求实现拆分技能。Use after the prototype project structure has been generated, to decompose confirmed project memory into executable implementation steps based on real files, mock data, pages, components, acceptance criteria, and verification methods.
---

# 项目需求实现拆分

使用本技能，在项目结构已经生成之后，把已确认的原型需求拆成可执行、可验证的实现步骤。

## 适用阶段

- S6 需求实现拆分

## 调用前置条件

调用前必须已经完成：

- S2 计划门禁通过
- S3 项目记忆生成
- S4 项目初始化
- S5 项目结构读取

如果还没有真实项目结构，不要调用本技能。
如果 `python3 tools/loop_run.py check . --preflight-stage s6` 未通过，不要调用本技能。

## 输入

- `docs/decisions.md`
- `memory/project-startup-plan.md`（只读溯源，不作为后续变更写入位置）
- `memory/project.md`
- `memory/business-rules.md`
- `memory/feature-list.md`
- `memory/requirement-analysis-baseline.json`（导入模式）
- 当前功能涉及的冻结基础事实、`FLOW/SC/SEQ` 明细、业务/时序图集、页面结构 HTML 与接口核验结论（从已验证 entrypoints 定位，按相关 ID 读取；历史包未声明页面结构图时不自行补造）
- `memory/source-materials.md`
- `memory/field-map.md`
- `memory/open-items.md`
- `CLAUDE.md`
- `config/workflow.json`
- 项目结构摘要
- 可编辑文件清单
- 页面入口和导航结构
- mock 数据位置
- 标注运行时位置

拆分必须以 S3 初始化后的 `memory/*` 当前事实和 `docs/decisions.md` 为准。

新版基线已按“故事 → 流程 → 接口 → 时序 → 页面结构 → 功能清单”完成上游分析。先对照冻结 `page_structure_atlas/page_index` 确定页面层级，再以最终 FUNC 和 PAGE/ACTION 映射拆分实现；页面的 `sequence_ids` 定位交互依据。不得消费上游 S6 尚未确认功能的中间版本，也不从结构图反推新功能。

如果输入包含 API 文档、字段表、回调文档、参考项目数据结构或截图字段，必须先确认 `memory/field-map.md` 已整理字段级事实。缺少字段级事实时，不要只按页面名粗拆任务。

## 输出

必须生成或更新：

- `memory/task-plan.md`
- `memory/execution-steps.md`
- `memory/acceptance-map.md`
- `memory/open-items.md`
- `memory/field-map.md`

## 拆分标准

### 1. 按需求单元拆

这里拆的是实现任务，不是重新拆业务 FUNC。先读取对应 FUNC 的触发、完成结果、包含／排除范围、规则／异常、AC 与版本差异；一个 FUNC 可以覆盖多个页面、组件、状态和实现步骤，各步骤引用同一稳定 FUNC。不要把下面的页面／区块／字段级任务新增为功能清单行，也不因角色、入口或技术调用数量重复计功能。范围缺口或新增能力返回需求分析确认。

新版 FUNC 处于业务操作级，`boundary.business_object/primary_action` 明确对象与主操作；一个 SC 可以有多个 FUNC。上游已拆开的开通／停用／恢复、查询／导出、配置／发布，不因共用页面或实现组件再合并。历史上游清单过粗时提出回流需求分析的粒度复核，不在原型侧静默拆分、重编号或扩大范围。

每个需求单元应对应一个可观察的原型行为，例如：

- 一个页面
- 一个页面区块
- 一个业务对象的数据展示
- 一个用户操作路径
- 一个交互状态
- 一个异常或空状态
- 一个跨页面联动

不要按“写 CSS”“写 JS”“补数据”这种纯技术动作拆分，除非该动作本身就是独立基础设施步骤。

### 2. 按真实文件落点拆

每一步必须写清楚要修改哪些真实文件。

优先使用这些路径：

- `index.html`
- `assets/css/global.css`
- `assets/css/app.css`
- `js/app.js`
- `js/common.js`
- `js/nav.js`
- `js/components/`
- `js/pages/`
- `mock/data.js`
- `config/nav.json`
- `flowcharts/business-process.html`
- `flowcharts/sequence-interaction.html`
- `related-systems/index.html`

如果需要创建新文件，必须说明为什么已有结构不足。

先读取 `config/workflow.json#currentIteration.requestedDeliverables.annotations`。只有值为 `true` 时，拆分阶段才判断哪些页面或组件需要标注锚点和标注提示词；值为 `false` 或旧项目字段缺失时，不生成标注任务、不要求 Annotation Impact。即使启用标注，也不直接生成或编辑 `annotations/annotations.js`；S9 只准备 `memory/annotation-prompt.md` 和覆盖清单，由 PM 手动投喂标注生成器。

如果项目内存在 `tools/prototype-loop-orchestrator/`，它只能作为总控工具包存在，不能进入业务可编辑文件清单，也不能被写成原型实现步骤的文件落点。除非用户明确要求维护 loop 本身，否则不修改该目录。

拆分完成后**不写 `complete`**：把"拆分产物已就绪"反馈给总控，由总控运行 S6 阶段预检并推进。产物不全（缺 `memory/task-plan.md`、`memory/execution-steps.md` 或 `memory/acceptance-map.md`）时先补齐，不交给总控推进。

涉及页面字段、API 字段、枚举映射、详情弹窗、表格列、筛选项或表单项时，执行步骤必须引用 `memory/field-map.md` 中的 `FLD-*`，不能只引用 `SRC-*`。

### 3. 按依赖顺序拆

推荐顺序：

1. 基础配置和导航骨架。
2. 领域模型和 mock 数据。
3. 页面容器和共享布局。
4. 核心页面。
5. 页面组件。
6. 页面交互。
7. 跨页面流程。
8. 空状态、加载状态、错误状态。
9. 单步验证补强。

无论业务页面数量多少，S6 都必须拆出两个独立交付步骤：

- 根据项目记忆中的角色、核心流程、判断条件、异常和回流生成 `flowcharts/business-process.html`。
- 根据核心用户路径中的参与者、请求、响应和状态变化生成 `flowcharts/sequence-interaction.html`。

导入需求分析基线时，上述两个步骤必须改为“复用并发布冻结 HTML 图集”：执行 `python3 tools/import_analysis.py publish-diagrams .`，检查来源 meta、语义 data 属性和统一导航；不得重新生成、重新布局或手工修改上游泳道图/时序图几何。

业务图集和时序图集按桌面宽屏验收：保留上游全宽阅读壳、折叠目录、宽图滚动、等比缩放和全屏，不为这两类图增加移动端适配任务或固定窄容器。业务原型页面仍遵循已批准的设备要求。

图集发布之外，还必须消费图中的业务与交互约束：相关实现步骤在“需求来源”引用 `SC-*` / `SEQ-*`，按冻结参与方、消息顺序、同步/异步、回调、超时、失败或补偿分支拆出页面状态、Mock 响应和可观察验收。只拆图页发布任务不代表已覆盖时序。没有出现在本期基线中的分支不得自行新增；`partial/missing/conflict` 接口只采用上游明确允许的模拟边界。

`memory/acceptance-map.md` 每行保留原型内部 `R-*`，同时增加 `Source IDs`。业务验收必须引用对应 `AC-*`、`FUNC-*`、`PAGE-*`、`ACTION-*`，纯框架项可写 `LOCAL`；所有冻结的 AC、FUNC、PAGE、ACTION 至少被一行覆盖。

如果 `memory/project.md`、`memory/business-rules.md` 或 `memory/source-materials.md` 明确存在外部平台、上下游或依赖系统，再增加 `related-systems/index.html` 内容生成步骤；没有关联系统时保留脚手架空态，不把它伪造为业务步骤。

### 4. 每一步必须可验证且写明验证技能

每一步都必须包含至少一种验证方式：

- 浏览器打开页面
- DOM 节点存在
- 点击后状态变化
- 数据渲染正确
- console 无阻塞错误
- 资源无 404
- 移动端布局可接受（仅业务页面明确要求时；业务／时序图集不适用）

每一步还必须写明实现后要调用的验证技能和证据工具：

- `Verification Skill: prototype-verifier`：默认单步验证协调器和验证结论 owner。
- `Browser Evidence Tool: playwright-cli when needed`：需要浏览器、DOM、交互、资源、截图或响应式证据时，由 `prototype-verifier` 调用。
- `Support Skill: superpowers-pm-prototype/skills/verification-before-completion`：需要完成前门禁确认时使用。
- `Support Skill: superpowers-pm-prototype/skills/systematic-debugging`：验证失败后需要定位失败类型时使用。

### 5. 不确定项不能进入实现

如果需求会影响页面范围、核心流程、业务对象、视觉方向或交付方式，但尚未确认，必须写入 `memory/open-items.md`。

不要把不确定项伪装成实现步骤。

### 6. 字段级拆分

当需求来自 API 文档或参考项目时，不允许只写“接入某平台”“新增某页面字段”。必须拆到字段事实能落地：

- 哪个页面或区域展示该字段。
- 该字段来自哪个 `SRC-*`。
- 该字段对应哪个 `FLD-*`。
- 字段中文名、格式、枚举和空值规则。
- 验证时如何确认字段已正确展示或映射。
- 若本轮明确请求标注：说明标注应解释哪个字段事实，并写清目标页面、功能名称、锚点类型以及对应 FLD-*；S7 必须据此把锚点挂在最小业务元素，而不是只写 annotation-required: yes。

## 执行步骤模板

```markdown
## 步骤 01：短动词开头的步骤名称

### 需求来源
- 对应需求或决策。

### 目标
一个可观察的原型结果。

### 文件
- path/to/existing-file
- path/to/new-file（如果必须新增）

### 预期变更类型
- create | update | verify-only | no-change

### 输入
- memory/project-startup-plan.md
- memory/project.md
- memory/business-rules.md
- memory/source-materials.md
- memory/field-map.md
- docs/decisions.md

### 工作
- 具体动作。
- 具体动作。

### 验收
- 可观察的验收标准。
- 可观察的验收标准。

### 验证
- 具体命令或浏览器检查。
- DOM、console、资源、数据或交互检查。

### 验证技能
- Verification Skill: `prototype-verifier`
- Browser Evidence Tool: `playwright-cli when needed`

### 标注影响（仅 requestedDeliverables.annotations=true 时保留）
- affected-pages: page-key-1, page-key-2 或 None
- annotation-required: yes | no
- annotation-targets: 页面 key | 功能名称 | kind | FLD-* 或 none

### 依赖
- None 或步骤 ID。

### 失败处理
- 失败时应回到哪个阶段或修订什么。
```

## 质量门禁

输出合格的最低标准：

- 每个核心需求都能在 `acceptance-map.md` 中找到验收标准。
- 每个实现步骤引用所实现的 `FUNC-*`；页面和操作继续引用对应 `PAGE-*`、`ACTION-*`，导入模式下全量上游 ID 覆盖通过确定性门禁。
- 每个实现步骤都有真实文件路径。
- 每个实现步骤都排除了 `tools/prototype-loop-orchestrator/` 等总控工具目录。
- 每个实现步骤都能独立验证。
- 每个实现步骤都声明验证技能。
- 只有明确请求标注时，每个相关步骤才声明标注影响；未请求时该章节不作为门禁。
- 业务流程图与时序交互图各有独立实现步骤和验收项；关联系统内容按项目事实决定是否生成。
- 涉及字段、枚举、状态、筛选、表单或详情的步骤都引用 `FLD-*`。
- 步骤之间依赖清晰。
- 没有把全局验证、S9 可选交付生成和最终收尾混入普通实现步骤。

## 禁止事项

- 不创建项目结构。
- 不写应用代码。
- 不执行浏览器验证。
- 不生成最终标注。
- 不推送 GitHub。
- 不把项目内总控工具包当成业务原型代码修改。

## 专门 Agent 边界

本技能在 prototype loop 中承担 S6 需求实现拆分专门 Agent。

### 本 Agent 负责

- 基于当前项目记忆、字段事实、来源记录和真实项目结构拆分实现步骤。
- 将需求拆到页面、区域、文件、字段、来源、验收和验证方式；仅在明确请求标注时补充标注影响。
- 输出可被 S7 按步骤执行的任务计划、执行步骤和验收映射。

### 本 Agent 不负责

- 不写业务代码。
- 不修改 mock、页面、样式或交互。
- 不执行浏览器验证。
- 不生成标注提示词或标注数据。
- 不推进阶段，不写 `config/workflow.json` 或 `memory/stage-log.md`。

### Token 加载策略

- 默认读取项目记忆、来源记录、字段映射、项目结构摘要和可编辑边界。
- 通过冻结入口按当前功能读取基础事实与对应 SC/SEQ，而不是只看图集标题或功能名称；不读取 Wiki/query 正文。
- 不默认读取全量源码；需要判断具体落点时，只按相关文件路径读取局部文件。
- 不读取旧标注数据作为拆分依据。
