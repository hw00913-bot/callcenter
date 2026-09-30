---
name: prototype-loop-orchestrator
description: "总控 PM 到演示原型的自动化工作流。当用户说‘开始计划项目’、‘基于底座迭代’、‘继续生成原型’，或要求把产品需求转成演示 Demo 时使用。Orchestrates requirement normalization, project decomposition, project initialization, iterative implementation, verification, and explicitly requested optional documentation or annotations."
---

# 原型循环总控

使用本技能，把产品经理需求转成已验证、可交付的静态原型项目。功能说明文档和标注是独立可选项，不是原型完成条件。

本文件只定义“调用时如何调度”。运行时唯一控制源在 `orchestrator/`：

- `orchestrator/workflow.yaml`：S0-S9 阶段状态机。
- `orchestrator/artifacts.yaml`：各阶段必需文件和内容门槛。
- `orchestrator/gates.yaml`：阶段门禁、熔断和标注硬规则。
- `orchestrator/scripts/loop_run.py`：阶段推进、状态写入和阶段日志入口。
- `orchestrator/scripts/loop_preflight.py`：确定性预检脚本。
- `orchestrator/scripts/import_analysis.py`：需求分析冻结包的验真、导入、记忆物化与 HTML 图集复用适配器。

`docs/` 只用于解释控制配置，不作为运行时权威来源。

## 触发时机

当产品经理输入“开始计划项目”、提交需求、提供目的/范围/FLOWCHART 流程图/外部资料/项目历史，或表达要生成演示原型时，先调用本总控技能。

总控启动后第一步判断是否进入“项目讨论状态”。进入后必须先完成 PM Brief Intake（目的、范围、非范围、输入材料、迭代方式、可选交付决定、验收方向），不得直接拆分、初始化或实现。

**Intake 的具体澄清问题与启动规划契约由 S1 技能 `skill-library/superpowers-pm-prototype/skills/brainstorming` 负责**；总控只在 S0 后派发它。缺项时由该技能向 PM 追问，未把 `memory/project-startup-plan.md` 写全前不进 S2。说明文档与标注默认均不生成；PM 明确要求时，总控分别用 `approve-plan --with-interaction-doc`、`approve-plan --with-annotations` 固化选择。标注启用后仍只准备人工提示词，**不自动生成 `annotations/annotations.js`**。

## S0 路由协议

S0 只判断是否启动或继续 loop，不产出需求结论。

- 用户表达“开始计划项目 / 新建原型 / 基于底座迭代 / 继续生成原型”时，进入 S0。
- 若输入包含新增或变化的业务需求事实，却没有 `requirement-analysis-to-prototype@1.0` 的 G3 冻结包：先调用 `requirement-analysis-loop` 完成需求分析，不启动原型 S1；G3 后再用冻结包进入本 Loop。若只是已确认范围内的视觉、文案或交互表现调整，可以沿用当前原型记忆直接迭代。
- LLM Wiki、query 输出或 loop-context 是需求分析输入，不是原型补充资料。新提交的 Wiki 材料尚未纳入冻结包时先路由需求分析 Loop；原型 S1/S3 及后续阶段不读取正文、不查询知识库、不重新提取事实。
- 用户提供冻结包时，先从当前技能包运行 `python3 <skill-dir>/orchestrator/scripts/import_analysis.py inspect <package>`；创建/同步原型目录后，在 S0/S1/S2 且计划批准前运行项目内 `python3 tools/import_analysis.py import . <package>`。导入脚本必须核对三个人工门禁、核验状态、整包清单、逐文件 SHA-256 和基线指纹。
- 目标目录不存在或没有 `config/workflow.json`：先在 loop 源仓库调用 create-project 脚手架创建最小结构，但生成项目状态仍必须从 S0 开始写日志。
- 目标目录已有 `config/workflow.json`：**在读取项目内任何工具前**，先从当前总控技能包调用 `skill-library/loop-project-scaffolder/scripts/create_project.py "目标目录" --sync-runtime`。该动作幂等刷新项目内确定性脚本、阶段技能和“四个核心视图 + 可选说明文档”切换壳，不覆盖业务文件、memory、annotations、已有 `docs/interaction.html` 正文或已经生成的本地 HTML 图内容；它会移除已停用的 ProcessOn 聚合页和链接清单。随后再读取 `python3 tools/loop_run.py status .` 和 `python3 tools/loop_run.py dispatch .`；不能因为缓存存在跳过 S0-S3。
- 用户只是询问、审计、维护 loop 本身或修改技能库时，不进入业务项目 loop。
- 已有项目处于 none 终态且需要继续一轮迭代时，先确认 final 快照无漂移，再运行 begin-iteration 并提供本轮名称。该动作归档上一轮控制状态、重置 loop-owned 记忆和标注并回到 S0，不能用强制完成 S0 伪装新一轮。
- S0 完成后必须进入 S1 项目讨论，由 S1 澄清目的、范围、非范围、资料、迭代方式、验收方向，以及是否明确要求说明文档或标注；未要求即记录为不生成。
- 已导入冻结基线时，S1 不重新讨论其中的范围、规则、功能、接口结论和页面规划，只补充演示目标、受众、视觉方向、设备、底座、交付和标注等原型专属决策，并在启动规划写入 baseline ID、fingerprint 与 manifest SHA-256。

## 冻结输入的消费范围

原型消费的是完整 G3 输入包，不只是功能清单或页面规划。按当前任务读取以下已冻结内容：

| 输入 | 对原型的约束 |
| --- | --- |
| 基础确认事实、产品结构与业务流程基线 | 产品目标、版本、范围/非范围、角色职责、系统边界、业务对象、状态模型与业务规则 |
| 功能清单、用户故事与验收条件 | 实现哪些能力、模块归属、版本变化和验收标准 |
| `FLOW-*` 业务流程与 `SC-*` 场景泳道图集 | 用户路径、参与方责任、分支、异常与回流 |
| `SEQ-*` 交互时序图集及对应结构化时序 | 请求/响应先后、异步回调、状态反馈、超时与补偿；用于交互和 Mock 设计，不仅用于展示图页 |
| 接口核验矩阵、字段、页面结构图和页面规划 | 外部依赖的已核验边界、数据含义、页面承载、操作与权限 |
| 冻结问题清单和接受风险 | 保留假设、缺口与风险状态，不把未核验内容提升为已确认事实 |

上游生成顺序固定为：用户故事 → 业务流程 → 接口核验 → 时序图 → 页面结构图 → 功能清单。原型只在最终功能清单已与页面/操作映射、通过 G3 后消费，不接收 S6 尚未回填功能的中间页面规划。新版包中的 `page_structure_atlas` 与 `page_index` 一起约束页面层级；历史冻结包保持只读兼容，不在原型侧重新生成上游缺失产物。

新一轮需求分析的绘图规则：仅 `FLOW/SC` 业务流程与场景泳道使用 PlantUML，`SEQ` 时序及页面结构使用原生 SVG，均以离线 HTML 交付。原型直接复用冻结图集，不自行改为 PlantUML；历史已冻结包保持只读，不因渲染规则升级自动重绘。

新生成的业务图集与时序图集面向桌面宽屏：充分使用页面宽度、默认折叠目录、保留等比缩放／宽图滚动／全屏，不要求移动端阅读。原型发布保留上游布局，不能再加固定窄容器；此约定不改变业务原型页面本身的设备要求。

新版 FUNC 按 `business-operation@2`，以“业务对象＋单一主操作＋可验收结果”为单位，不与 SC、模块、页面一一对应。开通／停用／恢复／删除、配置／发布／默认切换等已确认的独立操作，不在原型侧重新合并成管理包。S3 保留冻结 `boundary`（含 `business_object/primary_action`）、AC 与 `change_detail`，S6 依据操作边界拆实现任务；一个 FUNC 可对应多个任务，不能据此新增或重拆 FUNC。条目数不是标准功能点数或价格。历史包（含 `minimal-business-process@1`）保持只读，其粒度如需升级应退回需求分析，不能在原型补充／重编号。说明文档、标注和报价仍只按明确要求生成。

结构化 JSON 是事实源，Markdown/HTML 是其确认与评审视图；图文冲突回到需求分析 Loop，不在原型侧任选一个重写。S3 保留事实与图集入口，S6 按相关 SC/SEQ 拆分交互和验收，S7 实现并复用图集，S8 对照事实与时序核验行为。说明文档/标注仍是按明确要求生成的原型可选产物，不影响这些上游输入的必需性。

## 运行角色

### 原型后的功能基线反向复核

采用“原型前功能基线 → 原型验证 → 差异确认 → 新版基线”的闭环。上游 S1–S6 可预生成功能草案，但原型仍只消费 G3 冻结版本，不等待原型再确认初始范围。

S7 发现问题即记录，S8 必须在 `memory/verification-log.md` 汇总双向复核：每个 FUNC 的实现／非 UI 验证证据，以及每个业务页面操作的 FUNC 依据；检查遗漏、重复、粒度与边界，不按按钮计功能、不因无页面删除后台能力。无差异也须记录复核范围与依据。

有差异时在 `memory/open-items.md` 记录旧基线／版本、原 FUNC、页面／行为证据、修改前后、分类（实现缺陷／说明细化／拆分合并／范围变更／待确认）、来源、范围／AC／报价影响、用户决定及新基线定位。实现缺陷回 S6/S7；业务事实或功能清单修改先经用户确认，再回需求分析按最早受影响阶段更新版本、核验并重新 G3，开启新一轮原型迭代，不能就地覆盖导入事实。确认反馈建议不等于批准 G3。

本轮验收缺陷或影响现有范围的未决冲突阻断 S8；明确延期／拒绝且不影响当前验收的新增建议可保留，不自动扩大范围。纯视觉／文案表现优化不改变业务事实时可在本轮处理。新版基线导入后复验；说明文档／标注／报价仍按需生成，报价绑定基线版本，新增范围不默认含在原报价中。

你是工作流总控，只负责判断当前阶段、调用阶段能力、执行脚本入口和反馈脚本结果。

如果本总控整包被放在业务项目的 `tools/prototype-loop-orchestrator/` 中，它只是项目内总控工具包，用来让 Claude Code 在项目空间内读取和执行规则。除非用户明确要求维护 loop 本身，否则不要把该目录纳入业务文件清单、实现步骤、验证对账、标注覆盖或交付统计，也不要修改该目录。

不要把以下职责混在一起：

- 需求确认不等于任务拆分。
- 任务拆分不等于项目初始化。
- 项目初始化不等于页面实现。
- 页面实现不等于验证通过。
- 验证通过后即可进入收尾；可选说明文档或标注只在已明确请求时生成。

## 专门 Agent 调用原则

总控只在确有必要的高语义环节调用专门 Agent。允许强化专门 Agent 边界的阶段限定为 S1、S3、S6、S7、S9；具体阶段归属和技能路径仍以 `orchestrator/workflow.yaml` 的 `primary_worker` 为唯一源，不在本文件另建映射表。

其它阶段不新增专门 Agent：S0/S2 由总控处理，S4/S5 由既有技能和脚本完成，S8 调用验证 owner。专门 Agent 只做本阶段分析和产物生成，不推进阶段、不写运行状态、不宣布阶段通过。阶段边界仍由总控调用脚本完成。

## Token 分层加载原则

总控不得默认全量读取 loop 仓库或业务项目。默认只读取当前阶段所需的最小上下文：

- 总控常驻读取：`SKILL.md`、`orchestrator/workflow.yaml`、当前项目 `config/workflow.json`、当前项目 `memory/loop-status.md`。
- 阶段执行读取：只读取当前阶段技能声明的输入、当前阶段产物和脚本错误。
- 大型资料读取：优先读取冻结基线的结构化事实、项目记忆、来源记录和字段映射；业务资料缺口回到需求分析 Loop，不打开 Wiki 正文补齐。
- 实现阶段读取：按当前执行步骤读取涉及文件，不按默认全项目扫描。

如果信息不足，总控应让对应阶段 Agent 明确说明缺口和需要补读的文件，而不是为了保险读取全量历史。

## 派发与推进

- 阶段 → 技能的唯一源是 `orchestrator/workflow.yaml` 的 `primary_worker`，由 `check_workflow_sync.py` 校验技能 `适用阶段` 与之一致。总控按当前阶段的 `primary_worker` 派发对应技能。
- `知识 / 验证 / 脚手架` 阶段：派发该阶段 primary_worker 指定的技能；技能只产出本阶段产物，不推进。
- `流程` 阶段（S0 路由、S2 计划门禁）：总控直接处理，不派发技能。
- S2 不能由完成命令自动代替 PM 确认。PM 明确确认后，总控先运行 approve-plan，写入迭代名、确认人、确认依据、两个可选交付布尔开关及启动规划和 CLAUDE.md 摘要；未明确要求时不传可选参数。已导入基线时审批记录还必须绑定其 manifest SHA-256。只有所有摘要仍与文件一致时才能完成 S2。
- S3 若 `config/requirement-analysis.json` 为 `imported`，由 memory-generator 运行 `python3 tools/import_analysis.py materialize .`，确定性生成当前项目记忆、功能清单和基线 ID 目录；不得人工改写已导入业务事实。
- **每个阶段边界由总控运行 `python3 tools/loop_run.py complete . --stage SN`**——技能一律不写 `complete`。脚本跑该阶段门禁：通过则推进；失败则总控按脚本提示定位回到哪个阶段/技能重做，不自行改状态。
- S7 实现由 `prototype-builder` 依据 S3 记忆、项目级 `CLAUDE.md` 和 S6 执行步骤构建；导入模式下用 `python3 tools/import_analysis.py publish-diagrams .` 复用上游自包含 HTML 图集，只注入原型交付导航、语义标记和来源指纹，不重新渲染图形几何。`prototype-verifier` 在 S7 作为单步验证支持，在 S8 作为全局验证 owner。
- loop 在 S9 按需补充与收尾阶段结束：两个开关均为 false 时不生成说明文档、标注提示词或覆盖清单，直接执行 final；只验证明确请求的可选交付。推送 GitHub 是 loop 外的**手工**步骤，见 `docs/pm-guide.md`。
- 计划批准后或项目进入 none 终态后，PM 若新增明确要求，运行 `request-deliverables --interaction-doc` 或 `request-deliverables --annotations` 并记录请求人和依据；终态会自动回到 S9。生成所请求产物后重新完成 S9。
- 只有本轮已明确请求标注时，PM 手工回写后才运行 approve-annotations 重跑 final 并刷新终态快照；只运行 check 不会恢复干净终态。
- 任一门禁发现导入文件、manifest、handoff、基线指纹或验收映射中的 `AC/FUNC/PAGE/ACTION` 覆盖漂移时，停止原型 Loop；业务事实变化应回到需求分析 Loop 形成新 G3 基线，再开启新一轮原型迭代。

## LLM Wiki 的上游边界

LLM Wiki 仅由 `requirement-analysis-loop` 消费：先与用户故事、业务材料、接口证据一起分析，再通过 G1/G2/G3 形成冻结结论。原型继续消费上述完整冻结输入，包括基础确认事实、业务流程/泳道和交互时序；不从 Wiki 生成第二套事实。

冻结包可保留 Wiki 原始证据和来源元数据以维持审计链。原型脚本可校验这些文件的字节和哈希，但 Agent 不读取查询正文；`wiki_ref`、`raw_ref`、`status`、`coverage` 只作来源追溯，不授权回查或补写事实。新材料、缺口或冲突退回需求分析 Loop 形成新基线。

旧项目已冻结的启动规划与记忆不因技能升级被改写；历史“Wiki 调用计划”不再是运行指令。下一轮按新边界执行，现有业务事实需要重新核实时回到需求分析 Loop。

## 运行前读取

完整循环开始前，先读取 `orchestrator/workflow.yaml`、`orchestrator/artifacts.yaml`、`orchestrator/gates.yaml`。

已有项目继续迭代时，必须先完成 S0 路由协议中的 `--sync-runtime`。项目内 `tools/prototype-loop-orchestrator/` 只是上一次同步得到的可读副本，不能反向覆盖当前安装技能，也不能在未同步时作为最新规则来源。

需要解释性背景时，再按问题读取：

- `docs/loop-overview.md`：阶段说明。
- `docs/design-principles.md`：角色和架构边界。
- `docs/pm-guide.md`：产品经理视角。

## 调度方式

按 `orchestrator/workflow.yaml` 的阶段定义执行。总控不在本文件复述阶段门禁、产物要求或熔断阈值；这些规则由 `orchestrator/` 和生成项目内的 `tools/loop_run.py`、`tools/loop_preflight.py` 执行。

每个 loop 必须从 S0 起步。即使目标目录已有 `config/workflow.json`、`memory/stage-log.md`、历史缓存或上次运行记录，也必须先读取当前状态并确认 S0 已由 `tools/loop_run.py complete . --stage S0` 写入阶段日志；不能直接从 S4、S6 或实现阶段继续。若发现本地记录试图跳过 S0-S3，应回到 S0 重新启动，并让脚本按顺序推进。

本技能只负责：

- 判断用户是否要开始或继续一个 loop。
- 按当前阶段选择对应技能。
- 在阶段边界调用脚本，而不是手写阶段状态。
- 将脚本输出的状态、阻塞原因和下一步反馈给用户。

## 执行边界

- 需要阶段判断时，读取 `orchestrator/workflow.yaml`。
- 需要产物或门禁判断时，调用脚本或读取 `orchestrator/artifacts.yaml`、`orchestrator/gates.yaml`。
- 需要解释背景时，再读取 `docs/`。
- 如果本文件与 `orchestrator/` 不一致，以 `orchestrator/` 和生成项目内脚本为准。

如果脚本报告失败，总控只负责定位应回到哪个阶段或技能，不自行改写 `workflow.json`、`stage-log.md` 或伪造通过记录。
