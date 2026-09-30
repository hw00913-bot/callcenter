# 项目协作规则

@memory/project.md
@memory/project-startup-plan.md
@memory/business-rules.md
@memory/feature-list.md
@memory/source-materials.md
@memory/open-items.md

## 本地运行

在项目根目录执行以下命令启动本地 HTTP 服务：

```bash
python3 -m http.server 8080
```

然后在浏览器中打开 http://localhost:8080

> 注意：本项目通过 fetch 加载 `config/nav.json`，必须通过 HTTP 服务器访问。
> 直接双击 `index.html`（file:// 协议）会导致导航菜单无法加载。

## 语法校验

```bash
# 校验所有 JS 文件语法
find . -path './tools/prototype-loop-orchestrator' -prune -o -name '*.js' -print -exec node --check {} \;
```

## Loop 阶段预检

进入下一阶段前运行对应门禁：

```bash
python3 tools/loop_run.py check . --preflight-stage s4
python3 tools/loop_run.py check . --preflight-stage s6
python3 tools/loop_run.py check . --preflight-stage s7
python3 tools/loop_run.py check . --preflight-stage s8
python3 tools/loop_run.py check . --preflight-stage s9
python3 tools/loop_run.py check . --preflight-stage final
```

预检失败时必须回到提示的阶段补齐产物，不能继续实现、标注或交付。

每个阶段完成后必须通过 `python3 tools/loop_run.py complete . --stage Sx ...` 更新 `config/workflow.json` 并追加 `memory/stage-log.md`。不要手写阶段完成或手动把阶段标记为 pass。

## 开始工作前

1. 阅读 `memory/project-startup-plan.md` 了解启动时的初始规划；S2 后该文件只读，不得回改。
2. 阅读 `memory/project.md`、`memory/business-rules.md`、`memory/feature-list.md`、`memory/source-materials.md`、`memory/field-map.md` 和 `memory/open-items.md`，这些文件是 S3 后的当前项目事实。
3. 若 `config/requirement-analysis.json` 的 mode 为 `imported`，读取 `memory/requirement-analysis-baseline.json`，并把冻结基线中的业务事实视为只读。
4. 涉及历史变更时阅读 `docs/decisions.md` 和 `memory/change-log.md`。
5. 涉及页面标注时以 `.clauderules` 为唯一规则源，并优先引用 `memory/source-materials.md` 中的来源编号和 `memory/field-map.md` 中的字段编号。
6. 先理解现有代码和逻辑；非必要不得修改既有业务板块。

## 项目执行边界

- 未完成 PM 目标、范围、核心流程、数据对象和交付目标确认前，不进入实现。
- S1 未写入 `memory/project-startup-plan.md` 前，不进入 S2；S2 后不得修改该文件，只能作为溯源读取。
- S2 未写入本文件的项目级执行规则前，不进入 S3。
- S3 未初始化项目记忆、业务规则、功能清单、资料记录、字段映射和开放问题前，不进入拆分或实现。
- 实现必须以 `memory/project.md`、`memory/business-rules.md`、`memory/feature-list.md`、`memory/source-materials.md`、`memory/field-map.md` 和 `docs/decisions.md` 为准。
- 已导入需求分析基线时，不得在原型 Loop 内改写其范围、规则、功能、接口结论或图形几何；业务变化必须回到需求分析 Loop 重新冻结。
- 冻结输入不止功能清单：还包括基础确认事实、业务流程/泳道、交互时序及其 SC/SEQ 明细、接口核验和页面规划。按当前步骤从已验证入口读取，将时序与分支落实到页面状态、Mock 和验收；不能只发布图页。
- LLM Wiki 只由需求分析 Loop 消费。原型不查询知识库、不读取 query/loop-context 正文；新 Wiki 材料先回上游分析。包内原始证据仅供脚本校验完整性，来源元数据只用于追溯。
- 如果启动规划、资料和项目记忆之间冲突，先回到需求确认或记录 open item，不直接实现。

## 修改约束

- 本项目是无构建步骤的静态前端原型，入口为 `index.html`。
- 可复用 B 端公共组件放入 `js/components/`，页面逻辑放入 `js/pages/`。
- 修改业务规则后同步更新 `memory/business-rules.md`（该文件已被 CLAUDE.md 自动加载）。
- 功能范围和说明必须与 `memory/feature-list.md` 中的 `FUNC-*` 一致；原型页和操作保留上游 ID。
- 新增或使用外部资料后同步更新 `memory/source-materials.md`。
- 涉及 API 字段、参考项目字段、枚举、表格列、筛选项或详情字段时，同步更新 `memory/field-map.md`。
- 未确认的问题写入 `memory/open-items.md`（该文件已被 CLAUDE.md 自动加载）。
- JS 修改后执行语法检查；资源路径修改后进行浏览器验证。
- 进入实现、全局验证、标注和交付前必须通过对应 `tools/loop_run.py check` 阶段预检。
- 阶段完成后使用 `tools/loop_run.py complete` 更新阶段状态，不能只在对话上下文中说明。
- 验证失败和熔断计数必须写入 `memory/circuit-state.json`，不能只写在对话上下文里。

## 安全规则 (Safety Rules)

- **数据与逻辑分离**：所有大型 B 端数据集和 Mock 表格必须存放在 `mock/data.js` 中。严禁在 `js/pages/` 内部硬编码原始数据表。
- **配置文件架构分离**：CLAUDE.md 严格限定于本地开发/校验命令（运行、测试、语法检查等），而 `.clauderules` 专门用于页面标注系统的安装、维护和运行时规则。
