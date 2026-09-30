---
name: annotation-generator
description: PM 原型 loop 的 S9 可选交付生成技能。Use after global verification passes only when the workflow explicitly requests an interaction document or annotation prompt; otherwise return control for finalization without generating them.
---

# 按需说明文档与标注准备

使用本技能，在 S9 阶段读取 `config/workflow.json#currentIteration.requestedDeliverables`，只生成被明确请求的说明文档或标注准备产物。两项默认都不生成，也都不是原型交付完成条件。

第一版不强制自动写入 `annotations/annotations.js`。自动标注内容生成暂时停用，避免 Agent 在字段事实不充分时生成大量“待确认”标注。

## 适用阶段

- S9 按需补充与收尾

## 调用前置条件

调用前必须完成：

- S7 所有步骤单步验证通过。
- S8 全局验证通过。
- `python3 tools/loop_run.py check . --preflight-stage s9` 通过。
- `memory/acceptance-map.md` 存在并覆盖本轮核心验收页面。
- `memory/change-log.md` 和实际修改文件一致，或差异已解释。
- `requestedDeliverables.interactionDoc` 或 `requestedDeliverables.annotations` 至少一项为 `true`。

如果两个开关均为 `false` 或字段不存在，不生成 `docs/interaction.html`、`memory/annotation-prompt.md`、`memory/annotation-coverage.md`，直接把“本轮无可选交付请求，可执行 final”反馈给总控。不得自行把开关改成 true。

## 输入

- `memory/acceptance-map.md`
- `memory/execution-steps.md`
- `memory/change-log.md`
- `memory/verification-log.md`
- `memory/project-startup-plan.md`（只读溯源）
- `config/workflow.json`（只读，用于判断两个可选开关）
- `memory/project.md`
- `memory/feature-list.md`
- `memory/requirement-analysis-baseline.json`（导入模式）
- `memory/source-materials.md`
- `memory/field-map.md`
- `docs/decisions.md`
- 实际修改文件清单
- 页面中的 `data-anno` 锚点

以下锚点输入要求只在 `requestedDeliverables.annotations=true` 时生效：

- S9 必须扫描当前源码中的 `data-anno` 锚点，并在 `memory/annotation-prompt.md` 写入 `## 可用 data-anno 锚点清单`。
- 清单必须使用稳定格式：page: 页面标识 | data-anno: 锚点值 | selector: [data-anno="锚点值"] | label: 功能名称 | kind: action/field/status/region/table/dialog/chart/filter | fieldRefs: FLD-* 或 none | file: 文件路径。
- 清单中的 page/label/kind/fieldRefs 必须来自源码同一元素的 data-anno-page/data-anno-label/data-anno-kind/data-anno-fields，不能由 S9 猜测。
- 标注生成器只能从该清单选择 `target`，不得基于页面语义猜测、翻译、缩写或新造 selector。
- 如果某个要标注的区域不在清单里，先回到 S7 补 `data-anno`，再重新生成提示词。

输入边界：

- 只读取本轮 S1-S8 产生并验证过的项目记忆、验收映射、变更记录、字段映射、来源记录和页面锚点。
- 如果项目基于底座迭代，底座历史标注只能作为 `memory/source-materials.md` 中的参考来源记录，不能直接进入本轮标注提示词。
- 不把旧项目或底座的 `annotations/annotations.js` 当作 S9 输入。
- 不从浏览器缓存、旧导出 JSON、历史 `memory/annotation-prompt.md` 或历史 `memory/annotation-coverage.md` 继承标注内容。
- 若发现 `annotations/annotations.js` 已包含历史标注，先回到 S4/S5 要求重置或说明来源，不能继续生成本轮标注提示词。

## 输出

- `interactionDoc=true`：仅生成或更新 `docs/interaction.html`。
- `annotations=true`：仅生成或更新 `memory/annotation-prompt.md` 与 `memory/annotation-coverage.md`；不自动写 `annotations/annotations.js`。
- 两项都为 true：生成以上三项。
- 两项都为 false：不创建上述文件，只反馈“本轮无可选交付请求，可执行 final”。
- 请求项完成后，把“S9 已请求产物就绪、可收尾”反馈给总控，由总控运行 final 并完成 S9（技能不写 `complete`）。

## 提示词规则（仅 annotations=true）

提示词必须要求每条标注说明：

- 页面目的、关键控件或业务区块。
- 来源编号：来自 `memory/source-materials.md` 的 `SRC-*`，无外部资料时写 `SRC-000`。
- 字段编号：来自 `memory/field-map.md` 的 `FLD-*`；无字段级资料时必须说明原因。
- 每条标注按以下 10 个维度生成对应内容；维度不适用于当前对象时写明原因，不得为填满字段而编造规则：
  1. 功能名称 (functionName)：显示功能的具体名称，不可含糊。
  2. 功能说明 (functionDesc)：主要说明功能的使用场景和目的。
  3. 权限范围 (permissionScope)：说明哪些角色有权使用此功能或查看此数据（如：仅管理员，或全部用户可见）。
  4. 数据来源 (dataSource)：说明数据来源于哪个系统或接口。如果依赖数据流入，必须写清楚具体的数据来源系统名称。
  5. 取值逻辑 (valueLogic)：如果涉及数据取值，说明输入数据到输出数据的完整流向及计算转换逻辑。
  6. 字段说明 (fieldDesc)：每个字段单独一行，固定使用 FLD-* 字段名｜定义：...｜逻辑：...｜格式：...｜异常：...；不能只罗列字段名或把多个字段挤在同一行。
  7. 交互说明 (interactionDesc)：描述用户操作此元素时的触发动作及对应的页面响应反馈与页面流转。
  8. 判断规则 (judgeRule)：规定满足什么业务前提条件才能执行该操作，或相关的状态分支判断规则。
  9. 异常规则 (exceptionRule)：描述在数据为空、断网、接口失败、格式校验错误等异常情况下的系统处理逻辑。
  10. 其他说明 (otherDesc)：其他需要特别提示 PM、开发或测试关注的已知限制、决策点或技术细节。

提示词必须明确要求标注生成器：

- 标注对象只从本轮 `acceptance-map.md` 和 `field-map.md` 明确涉及的列表页、详情页、操作按钮、弹窗、表单输入项、状态标签、数据图表、筛选与页签中选择；不得扩展到范围外页面，也不得对无业务含义的普通文本或装饰元素生成标注。
- 只基于提示词中列出的本轮页面、验收项、`SRC-*` 来源和 `FLD-*` 字段生成标注。
- 导入模式下同时保留验收映射中的 `AC-*`、`FUNC-*`、`PAGE-*`、`ACTION-*`，功能名称和说明优先取自冻结 `memory/feature-list.md`。
- 不复用、续写或补全任何历史标注。
- 不沿用旧项目的标注 ID、页面说明、来源引用或字段引用。
- 所有标注按当前文件全局顺序编号：第一条 `id: "1"`，第二条 `id: "2"`，直到 `id: "N"`；跨页面继续递增。
- 如果输入资料不足，输出缺口说明，不生成“待确认”占位标注。
- 标注的 sections.functionName 必须与源码锚点的 data-anno-label 一致；fieldRefs 必须与锚点声明的 data-anno-fields 一致。

## 交互说明要求（仅 interactionDoc=true）

`docs/interaction.html` 必须以 `loop-project-scaffolder/assets/templates/docs/interaction.html` 为唯一结构与视觉基线，不得自行改成 Hero、卡片看板、标签墙或营销页。生成时只替换占位内容并按实际功能复制功能小节，保留基线的容器、标题、表格、分隔线和蓝色跳转按钮样式。

文档固定包含五章：

1. `一. 版本说明`：表头固定为“版本号 / 更新时间 / 更新内容”。
2. `二. 项目范围`：表头固定为“系统名称 / 涉及板块 / 功能范围 / 对接系统范围”，每个本轮板块至少一行。
3. `三. 逻辑说明`：表头固定为“流程名称 / 跳转地址”，使用项目内相对路径链接 `../flowcharts/business-process.html`、`../flowcharts/sequence-interaction.html` 和 `../related-systems/index.html`；不得引用 ProcessOn 或其它外部流程图地址。关联系统内容为空时仍保留该本地分页入口。
4. `四. 功能说明`：按页面或完整业务功能拆分编号小节。每个小节固定写“1）功能名称、2）交互说明、3）数据来源、4）逻辑说明、5）功能明细”，功能明细表头固定为“功能名称 / 功能说明 / 数据来源 / 取值逻辑 / 数据格式 / 默认值 / 异常处理”。
5. `五. 其他说明`：记录状态枚举、权限、跨页对账、演示限制、未接真实接口和待确认事项；无内容时也要明确写“本期无其他说明”，不能留占位符。

内容约束：

- 页面交互、成功/空/错误状态和跨页面联动写入对应功能小节，不另造卡片式概览。
- 数据来源必须引用真实 `SRC-*`，字段相关内容引用必要的 `FLD-*`，并说明它们在页面中的展示或取值位置。
- `partial`、参考底座和待联调内容必须在“数据来源”“逻辑说明”或“异常处理”中显式标明，不能写成已确认事实。
- 文档入口固定使用 `../index.html`，标题固定使用“功能说明文档”。
- 不得保留“待补充、待确认、TODO、TBD”或初始化模板内容。

不得只保留初始化模板，也不得引用已删除的 `docs/requirements.md`。

## 支持技能

- `superpowers-pm-prototype/skills/systematic-debugging`：锚点扫描、资料追溯、字段映射或手动回写校验失败且原因不清时使用。

## 覆盖规则（仅 annotations=true）

- 每个本轮核心验收页面至少有一条标注。
- 本轮验收范围内被标记为核心、且源码已有唯一 `data-anno` 的对象必须覆盖；需要覆盖但缺少锚点时回到 S7 补锚点，不在 S9 临时修改源码或使用模糊选择器。
- `acceptance-map.md` 中标记为 pass 的核心验收点必须能追溯到标注或交互说明。
- 导入模式下，交互说明和标注覆盖必须能回指 `acceptance-map.md` 的上游 Source IDs，不得把原型内部 `R-*` 当成唯一需求来源。
- 标注 `id` 必须在整个 `annotations/annotations.js` 全局唯一，且必须是从 `"1"` 开始到 `"N"` 的连续数字字符串；不能按页面重新从 1 开始，不能使用 `001`、`anno-1`、`page-001` 或 slug。
- 每条标注应包含 `sourceRefs`，引用 `memory/source-materials.md` 中的 `SRC-*` 编号；确无外部资料时使用 `SRC-000`。
- 如果 `memory/field-map.md` 存在 `FLD-*` 字段行，每条字段相关标注必须包含 `fieldRefs`，并引用真实存在的 `FLD-*` 编号。
- 如果 `memory/field-map.md` 声明 `No field-level source`，不要伪造 `fieldRefs`；应在标注正文或交互说明中说明没有字段级来源。
- 如果页面没有可用 `data-anno` 锚点，必须先回到 S7 补锚点，不能用模糊选择器硬写标注。
- 每个源码锚点必须绑定最小可解释业务元素，并同时声明 data-anno-page、data-anno-label、data-anno-kind；涉及字段时声明 data-anno-fields。大容器或布局容器只有明确使用 data-anno-kind="region" 且 label 指向完整业务区块时才可作为锚点。
- `memory/annotation-prompt.md` 必须列出本轮可用 `data-anno` 锚点清单；清单中未出现的锚点不能用于生成标注。
- 如果 PM 手动生成并要求回写 `annotations/annotations.js`，每个 `target` 都必须逐字匹配锚点清单中的 `selector`。
- `memory/annotation-coverage.md` 只记录本轮提示词覆盖情况；不得把底座旧标注或历史 Annotation ID 记为本轮覆盖。
- 不把 `tools/prototype-loop-orchestrator/` 纳入标注范围。
- 不把 `docs/`、`flowcharts/` 或 `related-systems/` 纳入页面标注范围。

## 禁止事项

- 不在全局验证失败时生成标注。
- 不用空对象 `window.AnnotationData = {};` 冒充已完成标注；空标注文件只代表尚未手动回写。
- 不读取底座旧 `annotations/annotations.js` 作为标注生成输入。
- 不把历史标注内容复制进 `memory/annotation-prompt.md`。
- 不把历史标注 ID 写入 `memory/annotation-coverage.md`。
- 不把代码变量名、Mock 字段名直接当作面向 PM 的正式字段说明，除非它就是页面展示字段。
- 不允许 fieldDesc 只列出字段名、接口字段名或 FLD 编号；每个引用字段都必须独立说明定义、取值逻辑、格式和异常规则。
- 不修改业务逻辑来配合标注。

## 专门 Agent 边界

本技能在 prototype loop 中承担 S9 可选说明文档与标注准备专门 Agent。

### 本 Agent 负责

- 先读取两个显式开关，不推定用户需要可选产物。
- annotations=true 时扫描当前源码锚点，生成手动标注提示词和覆盖清单。
- interactionDoc=true 时生成固定结构的功能说明文档。

### 本 Agent 不负责

- 不自动写入 `annotations/annotations.js`。
- 不读取旧项目或底座的标注数据。
- 不继承浏览器缓存、旧导出 JSON 或历史提示词。
- 不修改业务逻辑来配合标注。
- 不推进阶段，不写 `config/workflow.json` 或 `memory/stage-log.md`。

### Token 加载策略

- 默认只读取当前验收映射、来源记录、字段映射、验证记录和源码锚点片段。
- 不读取历史标注文件，不读取全量旧项目。
- 页面源码只读取包含锚点或本轮核心页面相关的片段。
