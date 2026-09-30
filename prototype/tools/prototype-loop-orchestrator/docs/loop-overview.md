# Loop 概览

本文面向维护者，解释 S0-S9 的意图。运行时唯一控制源是：

- `orchestrator/workflow.yaml`
- `orchestrator/artifacts.yaml`
- `orchestrator/gates.yaml`
- `orchestrator/scripts/loop_run.py`
- `orchestrator/scripts/loop_preflight.py`
- `orchestrator/scripts/import_analysis.py`

本文只做说明，不作为执行规则来源。

## 核心原则

脚本控制 loop，Agent 只完成每个阶段里的生成任务。

- 阶段推进由 `loop_run.py` 完成。
- 阶段门禁由 `loop_preflight.py` 完成。
- 状态机、产物和门禁先改 `orchestrator/`。
- 技能执行规则写在各技能目录的 `SKILL.md`。
- docs 只保留人类说明。

## 阶段

```text
S0 总控启动
S1 项目讨论
S2 计划门禁
S3 项目记忆生成
S4 项目初始化
S5 项目结构读取
S6 需求实现拆分
S7 实现与单步验证循环
S8 全局验证
S9 按需补充与收尾
```

需求分析 Loop 与原型 Loop 保持两个独立状态机，通过 `requirement-analysis-to-prototype@1.0` 冻结契约串联：前者在 G3 后输出 checksummed ZIP，后者在 S0/S1 导入、S2 绑定 manifest、S3 物化记忆、S6 追踪上游 ID、S7 复用 HTML 图集、S8/final 重验完整性。任一业务事实变化都回到需求分析 Loop 生成新基线，不在原型状态机中“就地修正”。

原型输入同时包括基础确认事实、用户故事与验收、功能清单、业务规则、业务流程/场景泳道、交互时序、接口核验、字段、页面规划和风险状态。S3 保留完整入口和 SC/SEQ 索引，S6/S7 将图中时序与分支落实到页面交互和 Mock，S8 对照基线验收；图集发布成功不等于业务行为通过。Wiki 直接消费被移至上游，但上述冻结输入始终保留。

能力选择不再作为独立阶段。总控根据当前阶段从 `skill-library/` 运行时选择技能包；缺失能力写入 `memory/open-items.md` 或阶段日志，不单独推进一个 stage。

所有项目必须从 S0 开始由 `tools/loop_run.py complete . --stage S0` 写入阶段日志。不得因为目标目录已有缓存、历史 `workflow.json`、旧 `stage-log.md` 或生成脚本已创建项目结构而直接跳到 S4/S6/S7。S4 预检会检查 S0-S3 的阶段日志，缺失则阻塞。

S4 在生成项目内是结构确认阶段，不负责执行创建脚本。创建、迁移、底座裁剪和工具回灌由 loop 源仓库的 `skill-library/loop-project-scaffolder/scripts/create_project.py` 完成；生成项目 runtime package 只保留 S4 规则和调度上下文。

## 运行入口

生成项目后，常见阶段检查入口如下；实际可用门禁和阶段推进规则以 `orchestrator/` 和复制到项目内的 `tools/loop_run.py` 为准：

```bash
python3 tools/loop_run.py check . --preflight-stage s4
python3 tools/loop_run.py check . --preflight-stage s6
python3 tools/loop_run.py check . --preflight-stage s7
python3 tools/loop_run.py check . --preflight-stage s8
python3 tools/loop_run.py check . --preflight-stage s9
python3 tools/loop_run.py check . --preflight-stage final
```

> `final` 是 S9 完成时的收尾终检（全量交付物可追溯性检查）；loop 无独立交付阶段，GitHub 推送是 loop 外手工步骤——这就是 `gates.yaml` 有 `final` 而 `workflow.yaml` 无 S10 的原因。

阶段完成入口示例：

```bash
python3 tools/loop_run.py complete . --stage S6 --output-artifacts "memory/task-plan.md, memory/execution-steps.md, memory/acceptance-map.md"
```

S2 的 PM 确认是独立的 approve-plan 动作，不由 complete 自动生成。说明文档和标注通过 approve-plan 的显式参数记录，默认关闭；S2 后新增请求使用 request-deliverables，终态项目会回到 S9。已完成项目开始新一轮时使用 begin-iteration；已明确请求标注且手工回写后使用 approve-annotations。这些动作都会执行确定性状态处理，不能靠手改 workflow.json 代替。

冻结需求包的入口：

```bash
python3 tools/import_analysis.py inspect /path/to/prototype-input.zip
python3 tools/import_analysis.py import . /path/to/prototype-input.zip
python3 tools/import_analysis.py materialize .
python3 tools/import_analysis.py publish-diagrams .
python3 tools/import_analysis.py verify .
```

`inspect/import` 在 S2 计划批准前执行，`materialize` 只在 S3 执行，`publish-diagrams` 是 S7 图集步骤，`verify` 可在后续阶段重复运行。

这些示例只用于帮助维护者理解脚本入口，不替代 `orchestrator/` 中的控制配置。

## 字段级资料链路

字段级资料链路的设计意图是：如果输入包含 API 文档、字段表、参考项目数据结构或截图字段，项目应把字段事实整理到 `memory/field-map.md`，供拆分、验证和标注追溯使用。

- `memory/project-startup-plan.md` 记录 S1 启动规划，S2 后冻结为只读溯源。
- `CLAUDE.md` 记录 S2 后的项目级执行规则和记忆引用。
- `memory/project.md`、`memory/business-rules.md`、`memory/feature-list.md` 和 `docs/decisions.md` 记录 S3 后的当前项目事实。
- `memory/requirement-analysis-baseline.json` 记录导入模式下需要追踪的 `AC/FUNC/PAGE/ACTION` 和冻结入口。
- `memory/source-materials.md` 记录资料来源。
- `memory/stage-log.md` 记录阶段完成。
- `memory/loop-status.md` 记录面向 PM 的当前状态和下一步。
- `memory/circuit-state.json` 记录熔断状态。
- `SRC-*` 记录来源。
- `FLD-*` 记录字段事实。
- `FUNC-*` 记录版本功能事实；`acceptance-map.md` 的 Source IDs 把 `R-*` 验收映射回 `AC/FUNC/PAGE/ACTION`。
- `execution-steps.md` 引用 `FLD-*`。
- 只有 `requestedDeliverables.annotations=true` 时，`memory/annotation-prompt.md` 才保存可由 PM 手动投喂给标注生成器的提示词，`memory/annotation-coverage.md` 才记录覆盖关系。
- 只有 `requestedDeliverables.interactionDoc=true` 时，才生成并验证 `docs/interaction.html`。
- 已明确请求标注且 PM 手动回写 annotations.js 后，approve-annotations 会重新执行交付门禁，校验 sourceRefs、锚点语义合同、fieldRefs 和逐字段定义/逻辑，并刷新终态快照。

基础字段链路用于避免拆分过粗；标注链路只在显式启用后用于避免标注泛化或出现“待确认”。

## LLM Wiki 上游输入边界

LLM Wiki 只作为需求分析 Loop 的输入，与用户故事、业务资料和接口文档共同形成经过 G1/G2/G3 的冻结基线。原型 Loop 不再在 S1/S3 或后续阶段查询 Wiki、读取 query/loop-context 正文或重新提取事实。

- `memory/project-startup-plan.md`：记录冻结基线与原型专属决策，不再要求 Wiki 调用计划。
- `memory/source-materials.md`：只保留上游来源索引；`wiki_ref`、`raw_ref`、`status`、`coverage` 用于追溯，不是二次事实入口。
- `memory/field-map.md`：从冻结字段与接口结论物化，不从 Wiki 提取。
- `memory/open-items.md`：保留上游冻结的缺口与风险，新 Wiki 材料或事实冲突退回需求分析 Loop。

交付包保留的原始证据仅允许脚本做完整性校验，不向原型 Agent 作为输入正文加载。升级技能不回写旧项目的已批准规划；下一轮按新边界启动。
