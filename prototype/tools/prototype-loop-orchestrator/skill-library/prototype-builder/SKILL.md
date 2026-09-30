---
name: prototype-builder
description: PM 原型 loop 的 S7 实现 owner。Use at S7 to implement execution steps one by one from project memory, call verification support after each step, and record change, verification, and circuit-state evidence without advancing workflow state.
---

# 原型实现构建器

使用本技能，在 S6 拆分完成后，按 `memory/execution-steps.md` 的步骤逐项实现原型页面、样式、mock 数据和交互，并在每一步完成后调用验证能力。

本技能只对 S7 阶段内的实现闭环负责：读当前步骤、改业务原型文件、调用验证支持、记录变更和验证证据。阶段推进由总控脚本完成。

## 适用阶段

- S7 实现与单步验证循环

## 调用前置条件

- S0-S6 已按顺序完成。
- `python3 tools/loop_run.py check . --preflight-stage s7` 已通过。
- `memory/execution-steps.md`、`memory/acceptance-map.md` 和 `memory/task-plan.md` 已存在且不是占位内容。
- 项目级 `CLAUDE.md` 已写入，并引用当前项目记忆。

如果前置条件不满足，不要开始写页面代码；先把缺口反馈给总控。

## 输入

默认读取：

- `CLAUDE.md`
- `memory/project.md`
- `memory/business-rules.md`
- `memory/feature-list.md`
- `memory/requirement-analysis-baseline.json`（导入模式）
- `memory/source-materials.md`
- `memory/field-map.md`
- `memory/project-structure.md`
- `memory/task-plan.md`
- `memory/execution-steps.md`
- `memory/acceptance-map.md`
- 当前步骤涉及的页面、脚本、样式、mock 和配置文件

按需读取：

- `memory/open-items.md`
- `docs/decisions.md`
- `memory/circuit-state.json`
- 当前步骤失败时的最近验证记录
- 当前步骤引用的冻结基础事实、SC/SEQ 结构化明细及图集对应部分、接口核验结论；从已验证 entrypoints 定位，不回查 Wiki

## 输出

必须生成或更新：

- 当前步骤涉及的业务原型文件，例如 `index.html`、`pages/**/*.html`、`assets/css/**/*.css`、`js/**/*.js`、`mock/**/*.js`、`config/nav.json`。
- `memory/change-log.md`
- 通过 `prototype-verifier` 生成或更新 `memory/verification-log.md`
- 通过 `prototype-verifier` 生成或更新 `memory/circuit-state.json`

可按需要更新：

- `memory/open-items.md`（只记录 S7 执行时发现的阻塞问题）

## 工作方式

1. 只选择当前未完成的一个执行步骤，不并行修改多个无关步骤。
2. 读取该步骤的目标、文件、输入、工作和验证方式；只有 `requestedDeliverables.annotations=true` 时才读取并执行标注影响。
3. 根据项目记忆和项目级规则修改业务原型文件，并按拆分步骤生成本地 HTML 业务流程图与时序交互图。导入模式下不生成新图：在对应步骤运行 `python3 tools/import_analysis.py publish-diagrams .` 复用冻结图集。
   业务页面的交互必须同时落实当前 SC/SEQ：按已确认消息顺序显示提交、处理中、成功/失败等状态，并模拟基线明确要求的回调、超时和补偿。发布 HTML 时序图不能代替实现这些行为；不得把未核验接口或接受风险当作已验证能力。
4. 只有 `requestedDeliverables.annotations=true` 时，才在执行步骤指定的最小业务元素上补稳定 data-anno 锚点，并声明 page/label/kind/fieldRefs 语义合同；未请求标注时，锚点不是实现或交付条件。
5. 保留并验证四个核心交付视图：`index.html`、`flowcharts/business-process.html`、`flowcharts/sequence-interaction.html`、`related-systems/index.html`。只有 `requestedDeliverables.interactionDoc=true` 时才生成并加入 `docs/interaction.html` 视图；所有已存在视图都加载 `js/delivery-nav.js` 并在当前页面内切换。
6. 完成当前步骤后，调用 `prototype-verifier` 的 step 单步验证模式；需要浏览器或 DOM 检查时，由 `prototype-verifier` 决定是否使用工具型 `playwright-cli` 采集证据。
7. 验证通过后由 builder 追加 `memory/change-log.md`，并调用 `prototype-verifier` 追加 `memory/verification-log.md`；验证失败时由 `prototype-verifier` 更新 `memory/circuit-state.json` 并按错误类型修复或回流。
8. 所有步骤都有 pass 记录后，把“S7 产物已就绪”反馈给总控，由总控运行阶段边界脚本。

## 交付图 HTML 合同

- 若存在导入基线，两个图页必须由 `publish-diagrams` 从冻结 HTML 复制并注入来源 meta、原型语义 data 属性和 `delivery-nav.js`；不得通过手工复制、截图或新渲染改变几何。`inputs/requirement-analysis/` 全目录只读。

- `flowcharts/business-process.html` 是必选产物。根节点保持 `data-delivery-diagram="business-process"`，完成后把 `data-diagram-state` 改为 `ready`；至少使用一个唯一 `data-flow-lane`、两个唯一 `data-flow-node` 和一个唯一 `data-flow-edge` 表达角色泳道、业务节点和流转关系。
- `flowcharts/sequence-interaction.html` 是必选产物。根节点保持 `data-delivery-diagram="sequence-interaction"`，完成后把 `data-diagram-state` 改为 `ready`；至少使用两个唯一 `data-sequence-participant` 和一个唯一 `data-sequence-message` 表达参与者和按时间顺序发生的交互。
- `related-systems/index.html` 页面壳必选、内容可选。没有关联系统时保持 `data-related-systems-state="empty"` 和 `data-related-systems-empty`；存在关联系统时改为 `ready`，每个系统使用全局唯一 `data-related-system`。
- 三类页面必须直接包含可阅读的 HTML 内容，不使用 ProcessOn 链接、远程 iframe、图片截图或外部流程图作为正文。
- 图内容必须来自本轮项目记忆和执行步骤，不读取底座旧图作为事实来源；图节点文案应说明真实业务动作、条件或交互，不使用“步骤一/系统处理”等无语义占位文字。

## 支持技能

- `prototype-verifier`：S7 单步验证协调器。
- `playwright-cli`：浏览器证据采集工具，由 `prototype-verifier` 按需调用。
- `superpowers-pm-prototype/skills/systematic-debugging`：验证失败且原因不清时定位问题。
- `superpowers-pm-prototype/skills/verification-before-completion`：需要完成前复核时使用。

## 回流规则

- 如果步骤本身颗粒度过粗、文件落点不清、验收不可验证，回到 S6 修订拆分。
- 如果冻结事实存在但记忆摘要遗漏，回到 S3 重新物化；如果基线本身缺少字段、时序或业务结论，回到需求分析 Loop，不在原型补写事实。
- 如果页面锚点缺失或锚点与业务区域不匹配，留在 S7 补源码锚点并重新验证。
- 如果同一检查点连续失败达到熔断阈值，记录现场并暂停自动重试，等待 PM 或总控决策。

## 禁止事项

- 不修改 `memory/project-startup-plan.md`。
- 不修改 `config/workflow.json`、`memory/stage-log.md` 或 `memory/final-snapshot.json`。
- 不直接写 `memory/verification-log.md` 或 `memory/circuit-state.json`；这两个文件由 `prototype-verifier` 写入。
- 不调用阶段推进命令。
- 不生成或回写 `annotations/annotations.js`。
- 不读取旧项目或底座的历史标注作为实现依据。
- 不把 `tools/prototype-loop-orchestrator/` 作为业务实现文件修改。
- 不修改 `inputs/requirement-analysis/`、`memory/requirement-analysis-baseline.json` 或冻结功能事实；业务差异回流需求分析 Loop。
- 不在单步验证失败时继续做后续步骤。

## 专门 Agent 边界

本技能在 prototype loop 中承担 S7 原型实现构建专门 Agent。

### 本 Agent 负责

- 按执行步骤实现当前业务原型页面、样式、mock、配置和交互。
- 生成本轮业务流程图、时序交互图，并在存在外部系统事实时生成关联系统展示。
- 在本轮明确请求标注时，为指定业务区域补稳定源码锚点。
- 调用验证支持；builder 记录单步变更，`prototype-verifier` 记录单步验证和熔断状态。

### 本 Agent 不负责

- 不制定项目目标、范围或启动规划。
- 不初始化项目记忆或资料来源。
- 不拆分实现步骤。
- 不执行 S8 全局验证 owner 职责。
- 不生成标注提示词，不写标注数据。
- 不推进阶段，不写 `config/workflow.json` 或 `memory/stage-log.md`。

### Token 加载策略

- 默认只读取当前步骤块、步骤引用的项目记忆和涉及文件。
- 大型参考资料只通过 `memory/source-materials.md` 和 `memory/field-map.md` 消费；缺口明确时再请求总控回到对应阶段补齐。
- 不默认扫描全项目历史、不读取旧标注、不读取 loop 工具包源码。
