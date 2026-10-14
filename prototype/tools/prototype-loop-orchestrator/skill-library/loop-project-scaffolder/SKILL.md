---
name: loop-project-scaffolder
description: 创建、迁移或确认静态原型项目结构。Use from the loop source or installed skill to create, migrate, reset, or refresh a prototype with scripts/create_project.py; inside a generated project, use it at S4 only to confirm the existing structure.
---

# 原型项目脚手架

本技能负责确定性项目结构操作。先判断上下文，不能把“创建项目”和“S4 确认结构”混为一件事。

## 适用阶段

- S4 项目初始化

## 两种上下文

### Loop 源码或本地安装技能

存在 `skill-library/loop-project-scaffolder/scripts/create_project.py` 时，可以运行脚本创建、迁移、裁剪底座或刷新已有项目。

### 已生成业务项目

当技能位于 `tools/prototype-loop-orchestrator/`，或当前目录已有 `config/workflow.json` 时，S4 只做结构确认：

1. 不创建外部项目，不复制底座，不迁移业务目录。
2. 确认 `.clauderules`、`index.html`、`CLAUDE.md`、`assets/`、`js/`、`mock/`、`docs/`、`flowcharts/`、`related-systems/`、`memory/`、`config/`、`annotations/` 和 `tools/` 存在。
3. 确认 S1-S3 产物存在，包括启动规划、项目规则、项目记忆、业务规则、来源记录、字段映射和开放问题。
4. 运行 `python3 tools/loop_run.py check . --preflight-stage s4`，把结果交回总控。

本技能不运行 `complete`，不推进阶段，也不承担 S5 结构读取或 S6 需求拆分。

## 确定性命令

以下命令只从 Loop 源码或当前安装技能执行，路径必须使用绝对路径。

### 创建空项目

```bash
python3 skill-library/loop-project-scaffolder/scripts/create_project.py "/absolute/project" --name "项目名称"
```

已有 S1-S3 草稿时增加 `--seed-dir "/absolute/seed"`。

### 基于底座创建

```bash
python3 skill-library/loop-project-scaffolder/scripts/create_project.py "/absolute/new-project" --name "项目名称" --from-base "/absolute/base-project"
```

禁止先整包复制底座再直接实现。脚本会保留业务页面、样式、组件和可复用 Mock 形态，重置当前迭代状态。

### 迁移非标准项目

先预览，再应用：

```bash
python3 skill-library/loop-project-scaffolder/scripts/create_project.py "/absolute/project" --migrate
python3 skill-library/loop-project-scaffolder/scripts/create_project.py "/absolute/project" --migrate --apply
```

手工复制底座后开始新项目，应用时增加 `--reset-iteration-state`。只补缺失框架文件时使用 `--merge`。

### 刷新已有项目

继续已有项目之前优先使用：

```bash
python3 skill-library/loop-project-scaffolder/scripts/create_project.py "/absolute/project" --sync-runtime
```

它刷新确定性脚本、项目内阶段技能和“四个核心视图 + 可选说明文档”导航壳，保留业务文件、当前 memory、标注数据、已有说明正文以及已经生成的本地 HTML 业务流程图、时序交互图和关联系统内容。

其它定点命令：

- `--sync-tools`：刷新工具脚本和项目内可读运行包。
- `--sync-delivery-pages`：刷新四个核心视图与可选说明文档导航；不主动创建说明文档，已有内容页只保留、不覆盖。
- `--sync-flowcharts`：仅维护源码的显式旧图集兼容入口；先核验已有链接，仅补缺失查看器/链接，保留自填内容和自定义菜单。现代安装包不携带退休模板，缺模板时拒绝恢复，不产生部分文件。
- `--help`：查看完整参数，不在本说明重复脚本参数表。

旧项目越过 S2 后缺少新审批记录时，必须由 PM 重新核对当前启动规划和 `CLAUDE.md`，再使用 `tools/loop_run.py approve-plan ... --reapprove-existing` 显式确认；不得从历史日志自动推定。

## 底座隔离保证

新迭代不得继承：

- `.git/`、依赖、测试报告、系统缓存和工具缓存。
- 旧 `CLAUDE.md`、`.clauderules`、workflow/project 配置。
- 旧 `memory/`、阶段日志、验证日志、终态快照和熔断状态。
- 旧标注数据、浏览器标注状态、源码 `data-anno*` 锚点。
- 旧说明正文、决策记录、旧流程图内容和旧关联系统内容。

S1 启动规划必须记录底座路径、保留项、重置项和禁止修改项。

## 结构和安全保证

- 新项目始终以 `stage: "s0"` 启动。
- 原型、业务流程图、时序交互图和关联系统展示通过 `js/delivery-nav.js` 在同一宿主页面切换；只有工作流明确请求说明文档时才增加该视图。
- 新项目不创建 `docs/interaction.html`、`memory/annotation-prompt.md` 或 `memory/annotation-coverage.md` 占位文件；S9 只按显式开关生成。
- 新建或从底座创建新迭代不继承旧 `flowcharts/index.html`、`flowcharts/processon-links.txt`，默认流程图采用本地 HTML；刷新已有项目时保留用户旧文件和自定义导航。旧模板只作为源码兼容资产，不进入现代新建、嵌入运行包或个人安装包。
- Mock 数据与页面逻辑分离；默认不引入前端框架、npm 或构建工具。
- `annotations/annotations.js` 使用空对象初始化，不生成历史或示例标注。
- 目标非空时先分析迁移；未经预览不应用破坏性迁移。
- `tools/prototype-loop-orchestrator/` 是控制工具包，不属于业务实现、标注覆盖或交付统计。

## 唯一资源源

- 阶段工具主源：`orchestrator/scripts/loop_run.py`、`orchestrator/scripts/loop_preflight.py`。
- 项目创建脚本：`skill-library/loop-project-scaffolder/scripts/create_project.py`。
- 项目模板：`skill-library/loop-project-scaffolder/assets/templates/`。
- 标注运行时模板：`skill-library/loop-project-scaffolder/assets/annotation-kit/`。

不要在其它技能目录维护这些资源的副本。

## 版本浏览增量

新项目提供 version-history.html、js/version-nav.js 和 assets/css/version-history.css，以版本清单派生视图展示多版本、多变更及确认快照。新增版本与变更视图使用现有 js/delivery-nav.js 导航。清单缺失时明确显示未连接，不能默认批准。已有项目需获准后才调用刷新命令；本轮不批量同步业务项目。刷新时更新版本脚本和样式，并补缺失版本页；已有版本页正文、标题与清单路径保持，现有历史版本和台账不自动迁移或删除。
