# 设计原则

## 分层

```text
docs/                 人类说明层
orchestrator/*.yaml   机器可读规则层
orchestrator/scripts  确定性执行层
skill-library/*       具体能力层
生成项目 memory/      项目运行记录层
```

## 权威来源

- 状态机：`orchestrator/workflow.yaml`
- 产物要求：`orchestrator/artifacts.yaml`
- 门禁策略：`orchestrator/gates.yaml`
- 阶段推进：`orchestrator/scripts/loop_run.py`
- 阶段预检：`orchestrator/scripts/loop_preflight.py`
- 跨 Loop 交接：`orchestrator/scripts/import_analysis.py`；需求分析事实与原型实现通过冻结 manifest 连接，不共享状态机。
- 具体技能规则：各技能目录的 `SKILL.md`
- 阶段 → 技能归属：`orchestrator/workflow.yaml` 的 `primary_worker`（**唯一源**；`loop_run.py` 内的 `STAGE_DISPATCH` 是受 `check_workflow_sync.py` 校验的运行时派发缓存，不作为独立规则源）

## 角色边界

- 总控脚本决定能否进入下一阶段。
- Agent 负责需求整理、字段抽取、代码生成和验证执行；只有 PM 明确请求时才生成说明文档或标注文案。
- 技能包只负责自己的阶段，不决定全局状态。
- `memory/stage-log.md` 和 `config/workflow.json` 由脚本写入，不能由 Agent 手写 pass。

## 不变约束

改任何技能或阶段都不得违反：

- **S9 可选交付显式触发**：说明文档和标注默认不生成、不阻塞原型交付。只有工作流开关明确为 true 才生成对应内容；标注启用后也**绝不自动写 `annotations/annotations.js`**。
- **S7 单一构建 owner**：实现由 `prototype-builder` 负责；`prototype-verifier` 只作为 S7 支持验证技能，并在 S8 承担全局验证 owner。
- **create-prototype 结构资产只读**：`create_project.py`、`assets/templates/*`、`assets/annotation-kit/`、生成结构图不可删改；只收回它越界的阶段驱动。
- **交付推送为 loop 外手工步骤**：loop 在 S9 收尾终检后结束，GitHub 推送手工执行（见 `docs/pm-guide.md`），不进状态机。
- **complete 归总控**：技能可 `loop_run.py check` 自检产物，但**不得调用 `loop_run.py complete`**（改状态 = 总控职责）。
- **冻结业务事实只读**：导入后不改 `inputs/requirement-analysis/`，不在原型 Loop 内重排业务图几何或改写 `FUNC-*`；业务变化回到需求分析 Loop 重新冻结。
- **Wiki 只在需求分析消费**：Wiki 及 query 输出先进入需求分析，原型只读取冻结结论；来源元数据可追溯，原始证据不得重新解释为事实。

## 维护规则

新增运行规则时，先改 `orchestrator/` 和对应脚本，再更新 docs 的说明。不要新增一份并行 Markdown 规则源。

## 必要环节专门 Agent

阶段归属仍以 `orchestrator/workflow.yaml` 的 `primary_worker` 为唯一源。`orchestrator/agent-contracts/` 只描述 owner 的读写边界、支持技能和交接信息，并由 `check_workflow_sync.py` 与 workflow、dispatch 和 create-project 运行包对账；它不定义阶段顺序或通过条件。

只在高语义、高风险、历史上容易跑偏的环节强化专门 Agent 边界：

- S1 项目讨论：防止目标、范围、底座和资料未确认。
- S3 项目记忆生成：防止资料和字段事实缺失。
- S6 需求实现拆分：防止步骤颗粒度过粗。
- S7 原型实现构建：防止总控、实现和验证混在一起，明确构建 owner 与验证支持的边界。
- S9 按需补充与收尾：无可选请求时直接收尾；有请求时防止说明文档失真、历史标注污染、锚点猜测和字段来源缺失。

这些专门 Agent 只负责阶段内分析和产物生成。阶段推进、门禁、状态、阶段日志和 final 快照仍由脚本负责。

## Token 分层加载

Agent 不默认读取全量 loop 仓库或业务项目。总控只读取当前阶段所需的最小规则和状态；阶段 Agent 只读取本阶段技能声明的输入。业务资料由需求分析 Loop 收敛为冻结事实，原型优先消费项目记忆、来源索引和字段映射，不读取 Wiki/query 正文。

S7 由构建 owner 按单个执行步骤读取相关文件；S9 只读取生成已请求可选产物所需的当前验收、来源、字段、验证记录和必要源码片段。无请求时不加载标注上下文。
