---
name: structure-reader
description: PM 原型 loop 的项目结构读取技能。Use at S5, after project initialization, to read the real generated file structure (excluding the orchestrator toolkit) and record an editable-file and split-boundary summary for decomposition.
---

# 项目结构读取

使用本技能，在 S4 项目初始化后，读取**真实**的项目文件结构，排除总控工具包，产出供 S6 拆分使用的结构摘要与可编辑边界。

本技能**只对 S5 产物负责**：不修改任何业务文件、不拆任务、**不调用 `loop_run.py complete`**（推进由总控负责）。

## 适用阶段

- S5 项目结构读取

## 调用前置条件

- S4 项目初始化已完成：标准结构与 S3 记忆已就位。

## 输入

- 真实项目文件树（`index.html`、`assets/`、`js/`、`mock/`、`config/`、`docs/`、`memory/` 等）
- 页面入口与导航结构（`config/nav.json`、`js/nav.js`）
- `memory/project.md`（S3 记忆，了解项目范围）

## 输出

必须生成或更新（产物清单由本技能约定，机器门禁见 `orchestrator/artifacts.yaml`）：

- `memory/project-structure.md` — 真实结构摘要：可编辑业务文件清单、页面入口、导航/路由结构、mock 数据位置、标注运行时位置，以及**明确排除**的目录。

## 输出格式

`memory/project-structure.md` 至少包含以下结构，S6 只按这里的可编辑边界拆分：

```markdown
# 项目结构摘要

## 可编辑业务文件清单
| 路径 | 类型 | 责任 | 可编辑原因 |
|---|---|---|---|
| index.html | entry | 页面入口 | 原型入口页面 |
| js/pages/example.js | page | 页面实现 | 当前需求页面 |

## 页面与入口
- `index.html`：入口。
- `config/nav.json`：导航配置。
- `js/pages/*.js`：页面渲染文件。

## 公共组件与复用边界
- `js/components/`：公共组件，修改前说明影响范围。

## 数据与配置来源
- `mock/data.js`：mock 数据源。
- `config/project.json`：项目配置。

## 可选交付与流程图位置
- 标注运行时：`annotations/`（基础设施可存在；只有明确请求标注时才纳入实现与验证边界）。
- 交互说明：`docs/interaction.html`（只有明确请求时才应存在）。
- 业务流程图：`flowcharts/business-process.html`。
- 时序交互图：`flowcharts/sequence-interaction.html`。
- 关联系统展示：`related-systems/index.html`（页面壳必选，内容可为空）。

## 不纳入实现/交付的目录
- `tools/prototype-loop-orchestrator/`：总控工具包，不作为业务实现范围。
```

如果项目结构与示例不同，以真实文件为准，但章节不能缺失。

## 工作方式

1. 读真实文件树，不臆测——以磁盘实际存在的文件为准。
2. **排除** `tools/prototype-loop-orchestrator/`：它是项目内总控工具包，不属于业务可编辑文件，不进入拆分边界、不计入实现步骤落点。
3. 区分「可编辑业务文件」与「框架/配置/工具文件」，标清后续拆分应落点的目录（`js/pages/`、`js/components/`、`mock/data.js`、`config/nav.json` 等）。
4. 记录页面入口、导航结构、mock 数据与可选交付位置；文件不存在时记录“本轮未请求”，不得为了补结构摘要而创建。
5. 完成后不写 `complete`；把"结构已读取、可编辑边界已建立"反馈给总控，由总控推进。

## 禁止事项

- 不调用 `loop_run.py complete`（推进 = 总控职责）。
- 不修改任何业务文件、不创建新文件、不拆任务、不写实现步骤。
- 不把 `tools/prototype-loop-orchestrator/` 当作业务文件纳入可编辑清单或拆分边界。
