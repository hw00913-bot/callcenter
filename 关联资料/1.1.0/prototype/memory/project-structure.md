# 项目结构摘要

> S5 于 2026-10-11T20:03:52+08:00 只读检查真实结构。唯一根目录：`/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype`。本摘要供 S6 确定现有代码落点，不拆任务、不创建页面或代码、不推进阶段；仅本文件由 structure-reader 写入。

## 读取基准与真实结构

- S4 已完成，S3 已物化于 `2026-10-11T19:57:27+08:00`；S2 planApprovalId 为 `33f310d70b71ef00`，两项可选交付均 false。冻结启动计划保持只读。
- 当前基线：`ra-云呼叫中心-v1.1.0-原始需求重新分析草稿-676248563fbe9e8e`；fingerprint `676248563fbe9e8e4daf04b88d37af45b92d8d653b4e1ba524acbcca0e3143d2`；manifest SHA-256 `6d42db2b593b28e48c174e76218db68283c1076c17397bdb2736c6f5056aa94d`。
- 当前记忆目录中的字段实数：**96 项，FLD-001～FLD-096**；`memory/field-map.md` 的 98 个表格行含表头和分隔行。字段ID以当前物化文件为准，不继承旧表的编号／数量。
- 范围：17 FUNC、62 AC、21 BR、5 SC、8有效SEQ、5逻辑PAGE、20有效ACTION，2 FLOW；它们不是文件数或新增页面数。
- 真实直接文件数（不计 `.gitkeep`／`.DS_Store`）：`js/pages/` 26、`js/components/` 55、`assets/css/` 41、`mock/` 26。多数为底座保留能力，不全纳入本轮修改。
- 排除工具、冻结输入和历史／过程目录后的路径清单摘要：`4c45a8586ad312b8d94629a0b37326e4c3875379e5db847cad04036815a948fd`。这里只记录结构，不能代替运行检查。

```text
prototype/
├── index.html                         单一业务入口、已存在的静态脚本装配
├── assets/
│   ├── css/                           底座与本轮专项样式
│   └── audio/                         既有本地合成演示资源
├── js/
│   ├── app.js                         AppState工作上下文
│   ├── nav.js                         业务菜单与RouteRuntime
│   ├── alicti-storage.js / common.js   共用隔离适配与助手
│   ├── delivery-nav.js                交付导航／frame壳
│   ├── review-view-cache.js           当前阅读frame缓存控制
│   ├── pages/                         26个已存在JS页面文件
│   │   ├── application-access.js      应用四view、4逻辑PAGE
│   │   ├── cloud-call-tasks.js         任务列表与操作
│   │   ├── cloud-task-workspace.js     任务向导／中心／记录页承载
│   │   └── customer-tasks.js           既有客户名单／历史补导衔接
│   └── components/                    55个已存在组件／模型文件
│       ├── dcc-runtime.js             DCC合成领域模型与台账
│       ├── dcc-records.js             DCC任务记录UI
│       └── platform-ui.js             通用表格／弹层／反馈
├── mock/
│   ├── data.js                        既有CloudCallData
│   └── dcc-v1.1.0.js                  本轮DccMock
├── config/
│   ├── nav.json                       四必选交付视图配置
│   ├── project.json                   项目元信息，依赖关闭
│   ├── requirement-analysis.json      已导入／物化绑定，由总控维护
│   └── workflow.json                  阶段／审批控制，只读
├── flowcharts/                        正式冻结图集派生发布页
│   ├── business-process.html
│   └── sequence-interaction.html
├── related-systems/index.html         必选关联阅读页壳已存在
├── annotations/                       设施存在，本轮不请求新增标注
├── memory/                            S3事实、S5摘要及后续规划／证据
├── docs/                              决策与底座历史阅读文件
├── inputs/requirement-analysis/        全部只读冻结源，不是业务修改落点
├── tools/                             总控与技能工具，不是业务实现
├── blueprint/ / documentation/         底座历史资料／工具，排除本轮修改
└── product-input.json / version-history.html / README.md
                                       兼容／阅读入口，非新业务事实源
```

实际不存在 `pages/` 目录或 `js/main.js`；不为套用模板补造这些文件。当前业务路由和渲染在既有 JS 中，5 PAGE 不要求新建5个HTML。

## 可编辑业务文件清单

以下是本轮已有文件的允许落点范围，只有明确关联冻结功能或必要兼容修复时才修改。S6不能将“存在于目录”视为应当改动；公共文件需限定影响与回归边界。

| 路径 | 类型 | 责任 | 可编辑原因 |
| --- | --- | --- | --- |
| `index.html` | entry | 统一HTML入口与脚本／样式装配 | 本轮业务入口；仅必要加载顺序、路径与布局壳维护 |
| `js/pages/application-access.js` | page | 应用list/create/detail/edit四视图 | PAGE-001/003/004/005及应用操作；显示／复制归详情，不增身份交换UI |
| `js/components/dcc-runtime.js` | component/model | 应用权限与凭据合成模型、请求／主子批台账、提交／结果／交付／下载／精确删除守卫 | 后台FUNC002与DCC核心共享模型；所有修改需保持冻结契约并复核受影响入口 |
| `js/components/dcc-records.js` | component/view | 任务内导入／失败／实际结果／交付／删除视图、CSV草稿与反馈 | PAGE002的可观察UI，调用模型；不在UI重复实现另一套主子／鉴权规则 |
| `js/pages/cloud-call-tasks.js` | page | 预外呼列表、行操作、常驻导入客户和任务详情衔接 | 本轮任务列表入口及既有状态守卫；保留其他任务类型 |
| `js/pages/cloud-task-workspace.js` | page | 既有创建向导、来源锁定、任务中心与记录页装配 | FUNC016和PAGE002既有承载；源选择仅创建前，提交后锁定 |
| `js/pages/customer-tasks.js` | page/integration | 既有客户导入／任务名单与历史补导衔接 | 仅与常驻入口／未启动历史补导相关的边界修复；不扩大通用客户模块 |
| `mock/dcc-v1.1.0.js` | mock | DccMock应用、导入、失败、实际结果、删除等合成样例 | 本轮显式合成输入／反例，无生产请求与真实客户 |
| `mock/data.js` | mock/shared | CloudCallData账户、租户、任务与通用随包演示数据 | 只在确有本轮字段／对象引用依赖时修正；不能从mock授予新权限 |
| `assets/css/dcc-v1.1.0.css` | style | 应用接入与DCC任务记录专项布局 | 沿底座风格在三桌面宽度适配当前5PAGE |
| `assets/css/task-create.css` | style | 既有任务创建向导样式 | 仅本轮来源与向导可用性相关表现 |
| `assets/css/secondary-navigation.css` | style | 任务／配置二级导航及返回上下文 | 本轮任务记录衔接可用性；修改后检查其他二级入口 |
| `assets/css/app.css` | style/shared | 后台页面公共基础样式 | 条件可编辑；只做本轮必要兼容，说明全站影响 |
| `assets/css/global.css` | style/shared | 通用按钮、表单、表格与反馈 | 条件可编辑；优先复用，必要修改须回归共用页面 |
| `js/components/platform-ui.js` | component/shared | 公共表格、分页、弹层、确认、反馈与转义 | 条件可编辑；不重复建UI框架，修改需说明调用方影响 |
| `js/nav.js` | navigation/route | 实际业务菜单、RouteRuntime、权限、主／次级上下文及返回 | 本轮入口/直接访问/来源返回边界；不是交付导航配置 |
| `js/app.js` | state/shared | AppState账户、租户、企业、业务域与角色上下文 | 条件可编辑；当前身份变化守卫复用，不能把浏览器快照提升权限 |
| `js/alicti-storage.js` | storage/shared | 本工作区既有演示存储隔离适配 | 仅必要兼容修复；不创建第二原型目录、不迁移/清空真实或历史业务 |
| `js/common.js` | shared | 既有公共助手 | 仅本轮实际依赖问题，保持调用兼容 |
| `js/delivery-nav.js` | navigation/shell | 顶层交付导航与嵌入frame切换 | 当前正式阅读页链接/上下文；optional交互说明关闭，不添新文档页 |
| `js/review-view-cache.js` | navigation/cache | 业务／时序／关联阅读frame的当前版本缓存边界 | 保证当前绑定阅读页不沿用旧frame；不重画上游几何 |
| `config/nav.json` | config/navigation | 四个必选交付视图配置 | 仅既有原型／业务流程／时序／关联地址与标签；不是业务菜单 |
| `related-systems/index.html` | view/shell | 既有关联系统阅读页壳 | 仅按当前冻结系统／场景维护展示与链接，不恢复旧蓝图业务或新增模块 |

- 未列入表的业务文件维持底座；若发现本轮依赖缺陷，先由 owner 说明真实调用关系和影响范围，再决定是否增加必要落点，不能自动把26页／55组件全列为实施任务。
- `flowcharts/*.html` 的正式SVG内容、页面结构原图与关联事实不手工编辑：由既有发布流程从当前冻结源复用。链接、页壳或缓存维护可以关联上表的交付导航文件；不能改源码几何冒充复用。
- `related-systems/index.html` 是现有必选壳；允许 owner 在冻结范围内维护展示／链接，当前没有独立的 `related-systems/*.js` 数据脚本。不得从旧蓝图自动扩出新模块或页面。
- S6的 `memory/task-plan.md`、`memory/execution-steps.md`、`memory/acceptance-map.md` 属于规划产物，不是业务代码；由 S6 owner 写，不在 S5填充。阶段记录与配置只由总控维护。

## 页面与入口

### 业务页面、路由与逻辑PAGE

- `index.html` 静态加载 mock、AppState／通用组件、业务页面、业务导航和交付导航；没有构建器、后端或 SPA 包管理步骤。
- `js/nav.js` 中的 `RouteRuntime` 与 `window.navigateTo` 管理菜单、当前主／二级页面、面包屑、权限拒绝和返回上下文；实际业务菜单在该JS，不从 `config/nav.json` 派生。
- `js/app.js` 提供账户／租户／enterprise／业务域／角色状态和对象授权；DCC模型每次操作复核当前权限／归属，不把页面菜单可见性当唯一权限边界。

| 逻辑PAGE | 实际文件与route/view | 业务职责与功能 |
| --- | --- | --- |
| PAGE-001 应用接入列表 | `js/pages/application-access.js`；`application-access` + `list` | FUNC018查询及FUNC019/020/001/021入口，列表不写配置 |
| PAGE-003 新增应用 | 同文件／route + `create` | FUNC019创建与必要校验；不在打开视图时创建 |
| PAGE-004 应用详情 | 同文件／route + `detail` | FUNC020只读显示／隐藏／复制，修改／删除复用既有功能；FUNC002仅凭据前置上下文 |
| PAGE-005 修改应用 | 同文件／route + `edit` | FUNC001保存已有应用修改；原appId/secret保持 |
| PAGE-002 预外呼任务记录页 | `cloud-call-tasks.js`列表、`cloud-task-workspace.js`向导／`cloud-task-center`、`dcc-records.js`任务记录区 | 来源创建后锁定、常驻导入、导入／失败／结果／交付／删除页签及FUNC004/005/006/009/010/011/012/013/015/016/017 |

- 任务入口使用既有预外呼菜单和 `cloud-task-create`／`cloud-task-center` 内部路由；新建向导属于现有任务流程，不是新增第六 PAGE。
- `application-access.js` 已有四view的实际 `data-page-id` 和 `data-func-id`，详情凭据查看标FUNC020，删除确认标FUNC021。FUNC002没有日常操作控件，不能把详情关联当页面执行身份交换；ACTION002仍退休。
- 任务列表与任务内统一“导入客户”按目标任务锁定来源打开 `DccRecords` 接口样例或手工CSV；接口任务不开放手工混入，不可导入显示禁用原因。保留既有历史任务仅未启动补导规则。

### 交付导航与四必选阅读视图

- `config/nav.json` 的4项为：原型 `index.html`、业务流程 `flowcharts/business-process.html`、时序 `flowcharts/sequence-interaction.html`、关联展示 `related-systems/index.html`。
- `js/delivery-nav.js` 使用已有顶层导航和 iframe 切换，另保留现有“版本与变更”入口。它与侧栏业务路由不同，不把交付tab计为新增业务PAGE／FUNC。
- `js/review-view-cache.js` 维护图页／关联页 frame 的当前审阅URL；正式绑定变化须由owner确认实际内容与版本一致，不能只改缓存字符串当作图集更新。
- `js/documentation-nav.js`、`js/version-nav.js` 属于现有阅读辅助；不据旧说明入口生成本轮交互说明。

## 公共组件与复用边界

- `dcc-runtime.js` 持有合成应用状态、已发身份、DCC业务台账；request归一幂等、主子root保存、精确供应商／结果关联、去重、下载快照、交付补送和精准删除是共享模型规则。UI只调用，不另建规则副本。
- `dcc-records.js` 是任务内投影／操作编排；CSV有效预览、busy与身份／任务变化守卫、当前删除目标反馈失效和独立未可信SIP显示落在此层／模型相应边界。不要改成全局结果中心或新任务类型。
- `platform-ui.js` 表格、分页、弹层、确认、提示、转义全站复用；`app.js`／`nav.js`共享所有模块的身份与导航。修改这些文件需检查其他入口、直接访问、返回上下文，不把超管应用管理限制误加到运营原有导入／下载。
- 创建来源锁定在 `cloud-task-workspace.js`，任务行与列表工具栏在 `cloud-call-tasks.js`；`customer-tasks.js` 保留旧名单／补导适配，不绕过DCC来源锁。
- `alicti-storage.js` 为既有演示隔离适配；DCC模型当前存储键为 `dcc-runtime-v1.1.0`，另有独立台账键，AppState与任务草稿使用既有本地状态。不能擅自重置存储／改变历史对象映射来满足新验证。
- `alicti-*`、坐席、IVR、客户、报表等其他55组件中的底座逻辑按原能力保留。供应商内部执行策略不是本轮新业务功能。

## 数据与配置来源

- `mock/dcc-v1.1.0.js` 提供 `window.DccMock`，`mock/data.js` 与其他随包mock提供 `window.CloudCallData` 及底座合成目录。应用、任务、phone、request、batch、fileId、call/事件均显式合成；不调用真实服务。
- 函数或mock已有内容只是实现观察，业务事实必须与已物化 `memory/project.md`、`business-rules.md`、`feature-list.md`、`field-map.md`、`source-materials.md`、`open-items.md`及其冻结来源对照。96字段行不由S5再生成或改写。
- `config/project.json` 当前 `allowDependencies=false`，无新框架／库安装选择。`config/nav.json` 只承载交付导航；业务菜单／角色判断在JS。
- `config/requirement-analysis.json`、`memory/requirement-analysis-baseline.json` 和导入摘要记录当前基线及物化；`config/workflow.json`、`project-version.json`、CLAUDE、冻结启动计划和审批记录属于控制／授权资料，S5只读，不作为业务可编辑落点。
- `product-input.json` 是底座留存的兼容聚合文件，不能替代当前已导入结构化入口与S3记忆。旧来源中的previous/parent或日衰减等历史文案不成为当前运行规则；不按它拆本轮任务。
- `index.html` 中本次静态扫描到152个本地src/href引用，去查询串后均存在于磁盘；该结构检查不等HTTP资源检查、JS执行或浏览器验收。

## 可选交付与流程图位置

- 源码锚点：现有业务页的 `data-page-id`／`data-func-id`，以及底座已有 `data-anno*`；当前字段源为96个FLD。追溯锚点不等新标注交付，不为关闭的标注补点或生成覆盖表。
- `annotations/annotation-runtime.js`、`annotation.css`、`annotations.js` 实际存在，属于保留基础设施；`requestedDeliverables.annotations=false`，本轮不增写标注、提示词、覆盖清单或验证统计。
- `docs/interaction.html` 实际不存在，`interactionDoc=false`；保持不生成，不创建占位文件。交付导航不能因为旧说明惯例新增tab或404入口。
- `docs/decisions.md` 是当前流程决策记录，不是要求新增功能说明；`docs/functional-spec.*`、`docs/development.*`及其他历史资料不等本轮可选文档请求，保持历史定位。

## 交付图页面

- 业务流程图：`flowcharts/business-process.html`，由已校验冻结 `outputs/business-scenario-atlas.html` 发布／复用，内容为2 FLOW和5 SC；正式图SVG与原生核验图保持源绑定。
- 时序交互图：`flowcharts/sequence-interaction.html`，由冻结 `outputs/interaction-sequence-atlas.html` 复用，8个原生SEQ；无恢复SEQ008或重画时序几何。
- 页面结构：冻结目录 `outputs/page-structure-atlas.html`，5逻辑PAGE，只读；通过现有阅读引用，不在S5新建页面结构文件。
- 关联展示：`related-systems/index.html`，已存在必选壳。当前目录无旧 `blueprint-data.js` 内容脚本，空内容不构成缺失业务页；后续若补充展示只取冻结系统／场景事实，不恢复未经确认模块。
- 对上游图集的发布与SHA对账由既有总控／物化／验证流程执行，不把工具包脚本列为业务改动落点。

## 不纳入实现/交付的目录

此节表示“不纳入本轮业务代码修改与新增交付范围”，不删除现存只读资料。

- `tools/`，包括 `tools/prototype-loop-orchestrator/` 及其内嵌skill／orchestrator：总控工具，全部排除业务修改、S6实现落点、功能计数与标注统计。不能通过修改工具门禁解决业务失败。
- `inputs/requirement-analysis/`：新旧冻结输入与raw/audit材料全只读；不改JSON／manifest／handoff／SVG，不读取Wiki/query正文。它是唯一业务来源，不是可编辑工程。
- `blueprint/`、`documentation/`、`docs/`内旧功能／开发／字段／说明文件、`product-input.json`等底座历史聚合资料：仅历史定位，排除本轮业务实现落点，不自动升级为新需求或新开发包。
- 父级 `归档/`、`需求/`／需求快照、开发输出目录、旧版本只读快照：不属于唯一prototype实现目录。原批准和已确认包保持原件。
- `.playwright-cli/`、`memory/verification-evidence/`、`downloads/`：保留的工具／证据／本地文件状态，不作为业务页面落点或业务功能。新证据只能由相应验证owner按流程记录，不能改旧结果冒充本轮通过。
- `annotations/`：关闭的可选交付，仅保留基础设施；不纳入本轮新增实现／覆盖验收。
- `config/workflow.json`、`config/requirement-analysis.json`、`project-version.json`、CLAUDE、冻结 startup与S3事实记忆、台账锁和审批：控制／只读事实，S6不当成业务实现文件修改；S5完全不修改。

## 结构读取结论与S6使用边界

当前真实落点已齐：单HTML入口、应用四view映射4PAGE、任务记录映射第5PAGE，DCC共享模型与UI、mock／样式、4必选交付壳均存在。无需新原型目录、`pages/`、`js/main.js`、交互说明或标注产物。

S6以本清单和当前冻结记忆定位可执行修改／复验；每个落点先有冻结FUNC/AC依据，共用能力复用既有模型，后台FUNC002靠后台身份证据，不靠新UI动作。本摘要不是任务计划或实现完成证明；总控负责后续阶段推进，业务／运营实际产品审批仍待确认，05未进入。

## 已读取关键来源摘要

| 真实文件 | SHA-256 | 用途 |
| --- | --- | --- |
| `memory/project.md` | `1cbd89d720afcbc9ec7249234f897533c22bba059c880b3fbe3cf1d4bc4a1aea` | 当前S3只读事实／配置 |
| `memory/field-map.md` | `5034ea8a0f44ef14d058ca663ff119f851b9e20525ef470db58f82b4aa5b6caa` | 当前S3只读事实／配置 |
| `memory/requirement-analysis-baseline.json` | `ec67892eeb46983dc199b17744b29a5319ffbdaafba47d490755251257c01c49` | 当前S3只读事实／配置 |
| `config/nav.json` | `96c4f252d464b9092e412860014e43be92328720a8c639e9644fc4fa53a82c99` | 当前S3只读事实／配置 |
| `config/project.json` | `604a7cd8727316c7c02173a7f7eaf39ab46729501f268d7f2a95ebb83ccca672` | 当前S3只读事实／配置 |
| `index.html` | `419691930ad7e658669f070c2307ccbaf1854f8e686bb6937e5a96153cd61e54` | 实际入口／实现结构 |
| `js/app.js` | `2eeee2d08664afd2b79bfe047ead53aa26d9243e1ada86df9571750588c38a0c` | 实际入口／实现结构 |
| `js/nav.js` | `9e7635f747306cf4fa8d5f78ae2343465779e089c20cc4d8b32b0d175f9505ab` | 实际入口／实现结构 |
| `js/pages/application-access.js` | `f36933d24f5b9c8ecf6033ae726c4162dc251738d6d4222bcdf3684223477f77` | 实际入口／实现结构 |
| `js/components/dcc-runtime.js` | `76cbf804cb885e385ceb520ff0f1fb9cf264cb03c5f887330bd91f497f8b7729` | 实际入口／实现结构 |
| `js/components/dcc-records.js` | `e3596871adf85bf6802846a26a97c62c6d67a7ca2f81b773a9c461c9f5417f4d` | 实际入口／实现结构 |
| `js/pages/cloud-call-tasks.js` | `9e1edfc32fd15405817cbec859bf0ce17cb896b5ac87afffae3d4e5bb86198fb` | 实际入口／实现结构 |
| `js/pages/cloud-task-workspace.js` | `4e6e2a8efe9f258e33d33b931b676b5307d1d12478571f371a9e3471a7a6c2ea` | 实际入口／实现结构 |
| `mock/dcc-v1.1.0.js` | `cfdd64f932d5a928a5f9546bf311479c5ae42b24717d2f59808fd4f4e05fb155` | 实际入口／实现结构 |
| `js/delivery-nav.js` | `dbbd29af01bc107960726720784e26c7863a9a0a284bd2b217533c28d0cb6f9c` | 实际入口／实现结构 |
| `js/review-view-cache.js` | `dddc7f481bf8ee26249668a38f9fb7413c605510369446affc5e9e32afc2e081` | 实际入口／实现结构 |
