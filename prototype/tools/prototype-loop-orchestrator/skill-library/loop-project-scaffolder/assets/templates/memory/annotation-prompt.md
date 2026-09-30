# 手动标注提示词

> S9 生成。用于 PM 在全局验证通过后，手动复制到标注生成器或对话窗口生成评审标注。不要把本文件当成已经回写的标注数据。

## 标注输入资料

- 项目目标：见 `memory/project.md`
- 启动规划：见 `memory/project-startup-plan.md`（只读溯源）
- 当前项目事实：见 `memory/project.md`、`memory/business-rules.md`、`docs/decisions.md`
- 验收映射：见 `memory/acceptance-map.md`
- 变更记录：见 `memory/change-log.md`
- 验证记录：见 `memory/verification-log.md`
- 资料来源：见 `memory/source-materials.md`
- 字段映射：见 `memory/field-map.md`

## 可用 data-anno 锚点清单

> S9 必须把当前源码中可用于标注的锚点及其语义合同列在这里。标注生成器只能使用本清单里的 selector，不能猜测或新造 target。

格式：

- page: 待补充 | data-anno: 待补充 | selector: [data-anno="待补充"] | label: 待补充 | kind: 待补充 | fieldRefs: none | file: 待补充

## 手动标注提示词

请基于已通过全局验证的静态原型，生成面向产品经理评审的页面标注。标注必须覆盖本轮核心页面、验收项、资料来源和字段事实。

输入边界：

- 只基于本提示词列出的本轮页面、验收项、`SRC-*` 来源、`FLD-*` 字段和 `## 可用 data-anno 锚点清单` 生成标注。
- 不读取、不复用、不续写旧项目或底座项目的 `annotations/annotations.js`。
- 不继承浏览器缓存、旧导出 JSON、历史 `annotation-prompt.md` 或历史 `annotation-coverage.md`。
- 如果输入资料不足，输出缺口说明，不生成“待确认”占位标注。

必须遵守：

- 标注 ID 在整个项目全局唯一，必须是从 `"1"` 开始到 `"N"` 的连续数字字符串；跨页面继续递增，不能按页面重新编号，不能使用 `001`、`anno-1`、`page-001` 或 slug。
- 每条标注必须引用 `sourceRefs`，值来自 `memory/source-materials.md` 的 `SRC-*`。
- 如果 `memory/field-map.md` 存在 `FLD-*` 字段行，字段相关标注必须引用 `fieldRefs`。
- 标注内容要解释页面目的、关键控件、数据来源、字段含义、交互状态、判断规则、空状态或异常状态。
- sections.functionName 必须与锚点清单中的 label 一致，fieldRefs 必须与该锚点清单声明的 fieldRefs 一致。
- sections.fieldDesc 中每个字段必须单独一行，格式为：FLD-* 字段名｜定义：业务含义｜逻辑：取值/计算/映射逻辑｜格式：展示格式｜异常：空值或异常规则。
- 不允许只罗列字段名、接口字段名或 FLD 编号；多个字段不能写在同一行。
- 不要把未确认内容写成已确认事实；遇到 partial、待核对或缺口时，在标注正文中说明。
- 不要修改业务实现来适配标注。

## 标注生成要求

- 核心验收页面至少一条标注。
- `memory/acceptance-map.md` 中通过的核心验收项必须能追溯到标注或 `docs/interaction.html`。
- 页面字段、筛选项、枚举、状态、详情弹窗和空状态优先标注。
- 如页面缺少稳定锚点，先回到 S7 补 `data-anno`，不要使用模糊选择器。
- 每条标注的 `target` 必须逐字使用锚点清单中的 `selector`。
- 第一条标注使用 `id: "1"`，后续标注按全局顺序递增到 `id: "N"`。
- `memory/annotation-coverage.md` 只记录本轮提示词覆盖情况，不得把底座旧标注或历史 Annotation ID 记为本轮覆盖。

## 回写说明

如果 PM 确认要把生成的标注写回项目，Agent 必须先确认 annotations/annotations.js 是本轮空骨架；若文件已有非空内容，应停止并确认来源，不能合并历史标注。回写时一次性写入本轮完整 AnnotationData。项目已进入终态时，运行 python3 tools/loop_run.py approve-annotations .；脚本会重跑 final、刷新终态快照，并校验全局 ID、来源、字段解释和锚点语义合同。
