---
name: brainstorming
description: 面向 PM 原型 loop 的需求澄清技能。Use when a product requirement needs clarification before prototype planning, including target users, scenarios, scope, pages, assumptions, and acceptance direction.
---

# 需求澄清

使用本技能把产品经理输入的原始想法、截图、FLOWCHART 流程图、参考资料或口头需求，整理成可以进入原型计划的清晰上下文。

## Loop 上下文

本技能是 `prototype-loop-orchestrator` 的一部分，由总控在指定阶段或支持场景中调用。它只处理本技能职责内的分析、验证或失败定位，不自行推进阶段，不写 `config/workflow.json`，不写 `memory/stage-log.md`，不声明阶段通过。

## 适用阶段

- S1 项目讨论

## 目标

澄清这些内容：

- 产品目标
- 目标用户
- 使用场景
- 核心页面或视图
- 核心流程
- 关键业务对象
- 必要交互
- 参考资料和视觉方向
- 不做什么
- 输入材料：冻结需求基线、原型视觉参考、底座说明和交付约束；原始业务材料与 LLM Wiki 先交需求分析 Loop
- 迭代方式：新建项目或基于现有项目迭代
- 可选功能说明文档：默认不生成；只有用户明确要求时才生成
- 可选页面标注：默认不生成；只有用户明确要求时才准备手动标注提示词与覆盖清单
- 验收标准
- 未确认假设

## 输出位置

不要写入 Superpowers 默认路径。S1 只输出本项目标准启动快照：

- `memory/project-startup-plan.md`

S1 的未确认项必须写入 `memory/project-startup-plan.md` 的 `## S2 前待确认问题` 章节，不写 `memory/open-items.md`。S2 确认后由总控写入项目级 `CLAUDE.md`。S3 再把启动规划转换为 `memory/project.md`、`memory/business-rules.md`、`memory/source-materials.md`、`memory/field-map.md`、`memory/open-items.md` 和 `docs/decisions.md`。

## 工作方式

1. 先阅读已有项目文档和 memory。若 `config/requirement-analysis.json` 的 mode 为 `imported`，必须先读 `memory/requirement-analysis-import.md` 和冻结包的 `prototype-handoff.json`。
2. 区分已确认事实、合理假设和阻塞问题。
3. 一次只问一个会实质影响原型方向的问题。
4. 对低风险缺口可以提出默认假设，但必须记录。
5. S1 必须先写入 `memory/project-startup-plan.md`，记录启动来源、产品形态、目的、范围、UI 风格、参考资料、需求分析基线、数据字段来源、整体页面结构、核心流程、验收方向、两个可选交付决定、约束风险和 S2 前待确认问题。不制定或要求填写 Wiki 调用计划。说明文档和标注没有被明确要求时，必须分别写“不生成”，不能据习惯推定为需要。
6. 在进入 S2 前，给出简洁的原型计划摘要，并请 PM 明确确认。
7. 只有 PM 明确确认后，才允许完成 S2；S2 会冻结 `memory/project-startup-plan.md` 并要求项目级 `CLAUDE.md` 已写入。
8. S2 确认后 `memory/project-startup-plan.md` 只读；后续变更写入 `docs/decisions.md` 或 `memory/change-log.md`，不得回改启动规划。

## 导入需求分析基线模式

- 把 G3 冻结的范围、角色、故事、验收条件、场景、业务规则、接口结论、功能清单、页面规划和接受风险视为只读事实，不重新访谈或改写。
- S1 只确认原型专属决策：演示目的与受众、视觉方向、桌面/移动设备范围、新建或底座迭代、交付方式，以及是否明确要求功能说明文档或人工标注产物。
- 启动规划必须显式记录 baseline ID、baseline fingerprint、manifest SHA-256，并说明业务事实来源为冻结包；任何范围变化进入 `S2 前待确认问题` 并回到需求分析 Loop，而不是在本阶段补写。
- 页面规划可以补充布局与导航表现，但不得新增冻结 `FUNC-*` 之外的业务能力。
- LLM Wiki 不作为本阶段资料输入。收到新的 query/loop-context 文件时，不读取正文或从中推导页面与功能；交还总控路由需求分析 Loop，待新 G3 基线后再规划原型。

## 门禁

以下内容不清楚时，不进入任务拆分：

- 原型目标
- 目标用户
- 核心用户流程
- 页面范围
- 非本期范围
- 输入材料
- 迭代方式
- 功能说明文档是否明确要求（默认不生成）
- 页面标注是否明确要求（默认不生成）
- 主要业务对象
- 验收标准
- 交付方式

如果用户只说“开始计划项目”，必须先追问上述内容；不能直接生成项目记忆、拆分步骤或写页面代码。

S1 完成前，`memory/project-startup-plan.md` 不能有占位内容。S2 完成后，本文件只读，用于后续变更溯源。

## 禁止事项

- 不创建项目结构。
- 不写页面代码。
- 不生成最终标注。
- 不把未确认假设当成事实。
- 不在导入模式下重新解释、合并或重新编号 `AC-*`、`FUNC-*`、`PAGE-*`、`ACTION-*`。
- 不使用 `docs/superpowers/specs/` 作为默认输出路径。

## 专门 Agent 边界

本技能在 prototype loop 中承担 S1 项目讨论专门 Agent。

### 本 Agent 负责

- 澄清项目目标、目标用户、核心场景、页面范围和非本期范围。
- 确认项目是从 0 开始还是基于底座迭代。
- 确认底座保留内容、重置内容和禁止修改内容。
- 确认 UI 风格、原型参考资料、冻结基线引用、整体页面结构和验收方向。
- 将启动期已确认内容写入 `memory/project-startup-plan.md`。

### 本 Agent 不负责

- 不生成项目记忆。
- 不初始化项目结构。
- 不拆分实现步骤。
- 不写业务代码。
- 不生成标注提示词或标注数据。
- 不推进阶段，不写 `config/workflow.json` 或 `memory/stage-log.md`。

### Token 加载策略

- 优先读取 PM 当前的原型目标、冻结需求摘要与展示参考，不读取 LLM Wiki/query 正文。
- 基于底座迭代时，只读取用户指定的底座说明或必要结构摘要；不默认读取底座全量源码。
- 不读取历史项目 memory 作为当前事实，除非该历史资料已经被用户指定为参考输入。
