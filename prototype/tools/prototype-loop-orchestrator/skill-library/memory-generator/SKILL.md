---
name: memory-generator
description: PM 原型 loop 的项目记忆生成技能。Use at S3 to materialize the frozen requirement-analysis baseline and approved prototype startup plan into read-only project memory, feature facts, source provenance, field maps, and open items. Do not consume LLM Wiki or query outputs directly.
---

# 项目记忆生成

使用本技能，在 S2 计划门禁通过后，把**冻结需求基线与已批准的原型启动规划**物化为当前项目记忆。S3 之后，下游阶段把这些记忆当作只读契约消费。LLM Wiki 的分析属于上游需求分析 Loop。

本技能**只对 S3 产物负责**：不创建项目结构、不写页面代码、不驱动其它阶段、**不调用 `loop_run.py complete`**（推进由总控负责）。

## 适用阶段

- S3 项目记忆生成

## 调用前置条件

- S1 启动规划已写入 `memory/project-startup-plan.md`。
- S2 计划门禁通过：PM 已确认、启动规划已冻结为只读、项目级 `CLAUDE.md` 已写入。

启动规划缺节或仍含占位内容时，不要生成记忆——退回让总控补 S1/S2。

## 输入

- `memory/project-startup-plan.md`（**只读溯源**，不回改）
- 项目级 `CLAUDE.md`（S2 写入的执行规则）
- 已验真的需求分析冻结包及其结构化事实入口；只读来源索引不等于原始正文输入
- 基础确认事实、业务流程/场景泳道与交互时序图集、对应 `SC/SEQ` 结构化明细、页面结构图及页面索引、接口核验及冻结风险；不能把输入缩减为功能和页面
- 已确认范围内的原型专属展示决策；既有项目的纯视觉/交互表现迭代可沿用已确认记忆

## 输出

必须生成或更新（产物清单由本技能约定，机器门禁见 `orchestrator/artifacts.yaml`，二者由 `check_workflow_sync.py` 绑定）：

- `memory/project.md` — 当前项目事实（定位、目标、用户、核心页面、核心路径、数据对象、交付方式、已确认假设）
- `memory/business-rules.md` — 业务对象定义、关键字段含义、状态枚举、权限边界、异常/空状态规则
- `memory/feature-list.md` — 版本功能事实，包含稳定 `FUNC-*`、模块层级、说明、备注、修改类型、上游引用、业务过程范围边界、AC 判据与版本差异
- `memory/source-materials.md` — 输入资料的 `SRC-*` 编号记录
- `memory/field-map.md` — API/参考项目字段级事实的 `FLD-*` 编号记录
- `memory/open-items.md` — 未确认项
- `docs/decisions.md` — 关键决策记录
- 导入模式额外生成 `memory/requirement-analysis-baseline.json`，并维护 `config/requirement-analysis.json` 的物化证据

## 导入需求分析基线模式

当 `config/requirement-analysis.json` 的 mode 为 `imported` 时：

1. 先运行 `python3 tools/import_analysis.py verify .`，确认基线未漂移且与 S2 计划批准摘要一致。
2. 运行 `python3 tools/import_analysis.py materialize .`，由确定性适配器生成 `project.md`、`business-rules.md`、`feature-list.md`、`source-materials.md`、`field-map.md`、`open-items.md`、基线元数据和导入决策。
3. 只可补充原型专属的展示决策；不得覆盖适配器生成的范围、规则、功能、接口或页面事实，不得修改 `inputs/requirement-analysis/`。
4. 上游资料没有字段级结构时，保留适配器生成的 `No field-level source` 声明；不得为通过门禁臆造字段。
5. 保留 `project-facts` 中的角色职责、系统边界、产品结构和状态模型；在 `project.md` 提供完整冻结入口及 `SC/SEQ` 明细索引，供后续按步骤读取。记忆摘要不得替代或缩减上游事实；假设与接受风险保持原状态。
6. 新顺序包必须保留 `page_structure_atlas` 入口及页面的 SC/SEQ/FUNC 关联；只消费 S7 已完成最终功能映射且通过 G3 的版本。历史包缺少新增图时保持兼容，不原地补图。
7. 保留每项功能的 `boundary` 和 `change_detail` 全部字段：不能把范围明细缩减为名称、说明和行数。新版 FUNC 是“业务对象＋单一主操作＋可验收结果”，保留 `business_object/primary_action` 与操作拆分复核；不能因多个 FUNC 属于同一 SC 或页面而合并。条目数不是标准功能点数或报价。历史包缺少明细时标明上游未提供，不推断补齐，不将空缺视为没有限制，也不因规则升级重拆已冻结事实。

## LLM Wiki 与原始证据边界

- 不查询 Wiki、不读取 query/loop-context 正文，也不从包内原始证据重新提取字段、枚举、规则或功能。
- `source_index` 中的 `wiki_ref`、`raw_ref`、`status`、`coverage` 只允许作为上游来源元数据保留；文件哈希通过不代表原始内容已被业务确认。
- 字段和规则来自冻结事实，`partial`、缺口与风险来自上游已冻结的问题清单，不在本阶段自行核实或升级为已确认事实。
- 未纳入基线的 Wiki 材料或业务事实缺口反馈总控，退回需求分析 Loop，不绕过 G3 在原型记忆补写。

## 工作方式

1. 先读启动规划、CLAUDE.md 与冻结基线入口；导入模式执行上述确定性物化流程，不读取原始 Wiki 正文。
2. 区分**已确认事实**、合理假设和阻塞问题；只把已确认事实写进 `project.md` / `business-rules.md`。
3. 涉及字段、枚举、状态、详情、表格列、筛选项时，必须拆到字段级写入 `field-map.md` 的 `FLD-*`，并标来源 `SRC-*` 与 `status`。
4. 在 `project.md` 末尾给一段**记忆复核摘要**：哪些来自冻结基线、哪些是原型展示决策、哪些是上游已保留的风险，便于 PM 复核；来源为 Wiki 不构成重新读取或解释它的理由。
5. 完成后不写 `complete`；把"S3 记忆已生成、待复核要点"反馈给总控，由总控推进。

## 禁止事项

- 不调用 `loop_run.py complete`（推进 = 总控职责）。
- 不创建项目结构、不写页面代码、不生成标注。
- 不回改 `memory/project-startup-plan.md`（S2 后只读）。
- 不把 `partial`/待核对资料当作已确认事实写入当前记忆。
- 不手工重写冻结基线的 `FUNC-*`，也不从菜单或页面标题重新推导功能清单。
- 不复述其它阶段的产物清单或门禁阈值。

## 专门 Agent 边界

本技能在 prototype loop 中承担 S3 项目记忆生成专门 Agent。

### 本 Agent 负责

- 将冻结需求基线、启动规划和项目级执行规则整理为当前项目记忆。
- 物化已冻结的业务对象、规则、页面、功能与字段事实，保留资料来源。
- 维护当前项目事实、业务规则、来源记录、字段映射和未确认项。
- 每个 FLD-* 必须同时记录业务定义和取值逻辑。业务定义解释字段代表什么，取值逻辑解释字段如何直接取得、计算、映射或组合；不能只复制字段名、接口名或代码变量名。

### 本 Agent 不负责

- 不回改 `memory/project-startup-plan.md`。
- 不创建或迁移项目结构。
- 不拆分实现步骤。
- 不写页面、样式、mock 或交互代码。
- 不生成标注提示词，不写标注数据。
- 不推进阶段，不写 `config/workflow.json` 或 `memory/stage-log.md`。

### Token 加载策略

- 默认读取冻结需求入口、启动规划和项目级执行规则。
- 原型表现资料按需读取；业务资料缺口交还需求分析 Loop，不打开 Wiki 或原始接口材料重建事实。
- 输出当前项目记忆后，下游阶段只按步骤消费记忆文件与冻结事实。
