# 执行步骤

> 本轮S6计划，10稳定step-01～10，所有行为待S7实测。仅01缓存、02/03官方冻结图发布与关联壳、10现行投影更新；04～09 verify-only。禁止改tools、冻结inputs、readonly事实/field-map、批准/控制。基线676248563fbe9e8e，manifest 6d42db2b593b28e48c174e76218db68283c1076c17397bdb2736c6f5056aa94d。

各FLD来源为本轮memory/source-materials SRC-001，字段96项只读；实际文件已存在，不创建HTML/目录。step10聚合例外由D-011/总控授权。辅助VM/浏览器只在/tmp调用；S6不先执行任何验证。

## Step 01: 绑定唯一入口、隔离与当前阅读导航

Step ID: `step-01`

### Requirement Sources

- SRC-001, FUNC-001, FUNC-002, FUNC-015, FUNC-016, FUNC-018, FUNC-019, FUNC-020, FUNC-021, PAGE-001, PAGE-002, PAGE-003, PAGE-004, PAGE-005, ACTION-001, ACTION-004, ACTION-005, ACTION-014, ACTION-015, ACTION-016, ACTION-017, ACTION-018, ACTION-019, ACTION-020, ACTION-021, ACTION-022, ACTION-023, ACTION-024, SC-001, SC-002, SC-003, SC-004, SC-005, SEQ-001, SEQ-002, SEQ-003, SEQ-004, SEQ-005, SEQ-006, SEQ-007, SEQ-009, AC-028
- SC/SEQ明细参与方、消息顺序、同步/异步、回调/超时/失败/补偿按冻结原文消费，不只发布图；接口风险不升级。

### Goal

唯一HTTP入口、业务上下文与四必选交付阅读正常；frame版本绑定新676。

### Files

- `index.html`
- `js/alicti-storage.js`
- `js/app.js`
- `js/nav.js`
- `js/delivery-nav.js`
- `js/review-view-cache.js`
- `config/nav.json`

### Expected Change

- update
- 仅Work声明的当前cache文件可更新，其他Files复验。

### Inputs

- `docs/decisions.md`
- `memory/project-startup-plan.md`
- `memory/project.md`
- `memory/business-rules.md`
- `memory/feature-list.md`
- `memory/source-materials.md`
- `memory/field-map.md`
- `memory/open-items.md`
- `memory/project-structure.md`
- `memory/requirement-analysis-baseline.json`
- 当前冻结目录 `inputs/requirement-analysis/ra---v1.1.0---676248563fbe9e8e` 的相关SC/SEQ/接口/页面/FUNC明细与图集，只读。

### Field Contracts

- 租户/身份来源取AppState；授权不由菜单或存储快照提升。来源与返回只读，不新设身份参数。
- 精确FLD：FLD-003, FLD-005, FLD-006, FLD-069, FLD-070, FLD-071, FLD-074, FLD-078, FLD-088, FLD-091, FLD-092, FLD-093, FLD-094, FLD-095, FLD-096。

| FLD | SRC | 页面／接口区域 | 来源字段 |
| --- | --- | --- | --- |
| FLD-003 | SRC-001 | API-001 应用凭证换指定租户token与DCC导入接收 | tenantId |
| FLD-005 | SRC-001 | API-001 应用凭证换指定租户token与DCC导入接收 | 应用凭证（真实字段名/类型待核） |
| FLD-006 | SRC-001 | API-001 应用凭证换指定租户token与DCC导入接收 | 租户token |
| FLD-069 | SRC-001 | PAGE-001 应用接入列表 | 应用名称/appId/创建时间 |
| FLD-070 | SRC-001 | PAGE-001 应用接入列表 | 应用名称或appId查询条件 |
| FLD-071 | SRC-001 | PAGE-001 应用接入列表 | 结果总数和分页 |
| FLD-074 | SRC-001 | PAGE-002 预外呼任务记录页 | 供应商taskId/租户归属 |
| FLD-078 | SRC-001 | PAGE-002 预外呼任务记录页 | 已锁定任务来源（创建向导确认创建前可选；记录页只读） |
| FLD-088 | SRC-001 | PAGE-003 新增应用 | 创建后生成演示appId/appSecret；非表单预填密钥 |
| FLD-091 | SRC-001 | PAGE-004 应用详情 | 可访问租户/创建时间 |
| FLD-092 | SRC-001 | PAGE-004 应用详情 | 应用名称/appId |
| FLD-093 | SRC-001 | PAGE-004 应用详情 | 演示appSecret（默认掩码） |
| FLD-094 | SRC-001 | PAGE-005 修改应用 | appId/创建时间/演示appSecret保持，仅详情查看 |
| FLD-095 | SRC-001 | PAGE-005 修改应用 | 已有可访问租户（必填） |
| FLD-096 | SRC-001 | PAGE-005 修改应用 | 已有应用名称（必填） |

### Work

- 仅更新已有review-view-cache.js当前阅读版本绑定；其他Files为verify-only，不重建骨架/复制工作区/改角色。
- 核入口加载、RouteRuntime业务与交付导航分离、应用四view和task返回/当前身份守卫，维持既有演示存储隔离。
- 普通exact入口reload及反复frame切换，不禁缓存/删状态掩盖旧图或observer循环。

### Acceptance

- 四必选视图和既有版本入口可达，身份拒绝/返回正确，后台FUNC002无日常交换控件。
- 当前meta/fingerprint与显示一致，无阻塞console/404/frame循环。
- 对应R行见acceptance-map，全Planned；实际完成只能依本步新证据。

### Verification

- prototype-verifier以1440/1920/2560普通HTTP入口检查DOM/console/资源与frame切换、源码SHA。
- 实际入口JS语法及身份/存储隔离反例，仅合成；记录当前新证据。
- 浏览器辅助入口 `python3 /private/tmp/dcc-run-frozen676-browser.py KIND` 只选本步KIND；统一隔离session=dcc-update-verification，绑定当前源码SHA/执行时间/URL/状态。图检查脚本由验证owner发布后适配，不编造命令。

### Verification Skill

- `prototype-verifier`

### Browser Evidence Tool

- `playwright-cli when needed`

### Support Skills

- `verification-before-completion`：新证据齐备后确认本步，不是S8全局。
- `systematic-debugging`：失败后区分事实/实现/资源/证据问题，不静默改基线。

### Dependencies

- None

### Failure Handling

- 原始输入/失败留存，由prototype-verifier记录并交owner；verify-only不得先改readonly字段/业务来放行。
- 范围/字段/规则变更回04；派生发布由总控按官方入口修复；实际缺陷由owner按授权边界处理后同点复验。
- 同点连续失败走熔断，不造pass/complete/批准。本计划不调用complete，S6未运行模型或浏览器。

## Step 02: 复用并发布冻结业务流程与五场景图集

Step ID: `step-02`

### Requirement Sources

- SRC-001, FUNC-001, FUNC-002, FUNC-004, FUNC-005, FUNC-006, FUNC-009, FUNC-010, FUNC-011, FUNC-012, FUNC-013, FUNC-015, FUNC-016, FUNC-017, FUNC-018, FUNC-019, FUNC-020, FUNC-021, PAGE-001, PAGE-002, PAGE-003, PAGE-004, PAGE-005, SC-001, SC-002, SC-003, SC-004, SC-005, SEQ-001, SEQ-002, SEQ-003, SEQ-004, SEQ-005, SEQ-006, SEQ-007, SEQ-009
- SC/SEQ明细参与方、消息顺序、同步/异步、回调/超时/失败/补偿按冻结原文消费，不只发布图；接口风险不升级。

### Goal

2FLOW/5SC当前官方业务HTML图集原样发布，源SVG精确一致且宽屏可读。

### Files

- `flowcharts/business-process.html`

### Expected Change

- update
- 仅现有派生阅读/投影，不改源SVG/业务事实/工具。

### Inputs

- `docs/decisions.md`
- `memory/project-startup-plan.md`
- `memory/project.md`
- `memory/business-rules.md`
- `memory/feature-list.md`
- `memory/source-materials.md`
- `memory/field-map.md`
- `memory/open-items.md`
- `memory/project-structure.md`
- `memory/requirement-analysis-baseline.json`
- 当前冻结目录 `inputs/requirement-analysis/ra---v1.1.0---676248563fbe9e8e` 的相关SC/SEQ/接口/页面/FUNC明细与图集，只读。

### Field Contracts

- 纯发布，无新字段。SC/FLOW所有分支取冻结明细，SVG原样保持。
- FLD: None，本步纯冻结图/关系展示，无新增表单字段。

### Work

- 由owner执行 python3 tools/import_analysis.py publish-diagrams .；工具仅调用入口，不是Files/修改目标。命令发布现有两HTML图集。
- 单独核business-process.html对当前冻结business-scenario-atlas.html的meta、SC/FLOW标识与每个SVG逐字节一致；不重生成、人工修/重排几何。
- 保留上游全宽/折叠目录/宽图滚动/fit/zoom/fullscreen/下载；图中的确认交互由后续业务步骤消费。

### Acceptance

- 2FLOW/5SC包含SC005应用独立操作、删除成功失败及可选DCC独立请求，来源676正确。
- 无几何漂移/缺图；宽屏工具可用，业务图与时序图各独立验收。
- 对应R行见acceptance-map，全Planned；实际完成只能依本步新证据。

### Verification

- 官方publish后逐SVG字节及来源SHA对账；prototype-verifier浏览器核目录/缩放/全屏/下载与滚动。
- publish可同时输出时序，本步只验业务，step03独立验时序；不把显示图当业务执行通过。
- 浏览器辅助入口 `python3 /private/tmp/dcc-run-frozen676-browser.py KIND` 只选本步KIND；统一隔离session=dcc-update-verification，绑定当前源码SHA/执行时间/URL/状态。图检查脚本由验证owner发布后适配，不编造命令。

### Verification Skill

- `prototype-verifier`

### Browser Evidence Tool

- `playwright-cli when needed`

### Support Skills

- `verification-before-completion`：新证据齐备后确认本步，不是S8全局。
- `systematic-debugging`：失败后区分事实/实现/资源/证据问题，不静默改基线。

### Dependencies

- step-01

### Failure Handling

- 原始输入/失败留存，由prototype-verifier记录并交owner；verify-only不得先改readonly字段/业务来放行。
- 范围/字段/规则变更回04；派生发布由总控按官方入口修复；实际缺陷由owner按授权边界处理后同点复验。
- 同点连续失败走熔断，不造pass/complete/批准。本计划不调用complete，S6未运行模型或浏览器。

## Step 03: 独立复验正式时序并呈现关联阅读壳

Step ID: `step-03`

### Requirement Sources

- SRC-001, FUNC-001, FUNC-002, FUNC-004, FUNC-005, FUNC-006, FUNC-009, FUNC-010, FUNC-011, FUNC-012, FUNC-013, FUNC-015, FUNC-016, FUNC-017, FUNC-018, FUNC-019, FUNC-020, FUNC-021, PAGE-001, PAGE-002, PAGE-003, PAGE-004, PAGE-005, SC-001, SC-002, SC-003, SC-004, SC-005, SEQ-001, SEQ-002, SEQ-003, SEQ-004, SEQ-005, SEQ-006, SEQ-007, SEQ-009
- SC/SEQ明细参与方、消息顺序、同步/异步、回调/超时/失败/补偿按冻结原文消费，不只发布图；接口风险不升级。

### Goal

8原生SEQ原样发布、独立可读；关联壳按冻结systems显示DCC/平台/供应商与身份边界。

### Files

- `flowcharts/sequence-interaction.html`
- `related-systems/index.html`

### Expected Change

- update
- 仅现有派生阅读/投影，不改源SVG/业务事实/工具。

### Inputs

- `docs/decisions.md`
- `memory/project-startup-plan.md`
- `memory/project.md`
- `memory/business-rules.md`
- `memory/feature-list.md`
- `memory/source-materials.md`
- `memory/field-map.md`
- `memory/open-items.md`
- `memory/project-structure.md`
- `memory/requirement-analysis-baseline.json`
- 当前冻结目录 `inputs/requirement-analysis/ra---v1.1.0---676248563fbe9e8e` 的相关SC/SEQ/接口/页面/FUNC明细与图集，只读。

### Field Contracts

- 纯图/系统关系展示，无新增业务字段；参与方/消息/状态只读冻结SEQ。
- FLD: None，本步纯冻结图/关系展示，无新增表单字段。

### Work

- 沿官方publish-diagrams输出：若step02已发布则本步独立核验，不重复生成。sequence-interaction.html对冻结时序SVG逐字节，退役008不恢复。
- 已有related-systems/index.html取当前S3 systems/FLOW，只展示DCC导入/priority/重导、平台批次/结果交付、供应商内部执行；租户业务身份不授应用管理。
- 不从旧blueprint增业务/页面，不新建说明或模块，真实API partial/missing保持。

### Acceptance

- 8原生SEQ/participants/messages及source-meta本轮676；来源SVG精确一致。
- 时序/关联统一导航可达，现有宽屏目录fit/zoom/fullscreen等可用，无旧scope或生产保证。
- 对应R行见acceptance-map，全Planned；实际完成只能依本步新证据。

### Verification

- prototype-verifier独立核SEQ001～007/009 native标识、消息覆盖、来源SHA/SVG。
- 浏览器普通reload新676，时序/关联frame工具和0阻塞console/404；图不替代交互实测。
- 浏览器辅助入口 `python3 /private/tmp/dcc-run-frozen676-browser.py KIND` 只选本步KIND；统一隔离session=dcc-update-verification，绑定当前源码SHA/执行时间/URL/状态。图检查脚本由验证owner发布后适配，不编造命令。

### Verification Skill

- `prototype-verifier`

### Browser Evidence Tool

- `playwright-cli when needed`

### Support Skills

- `verification-before-completion`：新证据齐备后确认本步，不是S8全局。
- `systematic-debugging`：失败后区分事实/实现/资源/证据问题，不静默改基线。

### Dependencies

- step-02

### Failure Handling

- 原始输入/失败留存，由prototype-verifier记录并交owner；verify-only不得先改readonly字段/业务来放行。
- 范围/字段/规则变更回04；派生发布由总控按官方入口修复；实际缺陷由owner按授权边界处理后同点复验。
- 同点连续失败走熔断，不造pass/complete/批准。本计划不调用complete，S6未运行模型或浏览器。

## Step 04: 复验应用五操作与后台租户身份

Step ID: `step-04`

### Requirement Sources

- SRC-001, FUNC-001, FUNC-002, FUNC-018, FUNC-019, FUNC-020, FUNC-021, PAGE-001, PAGE-003, PAGE-004, PAGE-005, ACTION-001, ACTION-016, ACTION-017, ACTION-018, ACTION-019, ACTION-020, ACTION-021, ACTION-022, ACTION-023, ACTION-024, SC-005, SC-001, SEQ-005, SEQ-001, AC-017, AC-028, AC-044, AC-045, AC-053, AC-054, AC-055, AC-056, AC-057, AC-058
- SC/SEQ明细参与方、消息顺序、同步/异步、回调/超时/失败/补偿按冻结原文消费，不只发布图；接口风险不升级。

### Goal

列表/新增/详情/修改/删除独立结果及后台有效/拒绝身份有新证据，日常无交换技术UI。

### Files

- `js/pages/application-access.js`
- `js/components/dcc-runtime.js`
- `js/app.js`
- `js/nav.js`
- `mock/dcc-v1.1.0.js`
- `assets/css/dcc-v1.1.0.css`

### Expected Change

- verify-only
- Files现有对象为复验，不改成未授权业务重写。

### Inputs

- `docs/decisions.md`
- `memory/project-startup-plan.md`
- `memory/project.md`
- `memory/business-rules.md`
- `memory/feature-list.md`
- `memory/source-materials.md`
- `memory/field-map.md`
- `memory/open-items.md`
- `memory/project-structure.md`
- `memory/requirement-analysis-baseline.json`
- 当前冻结目录 `inputs/requirement-analysis/ra---v1.1.0---676248563fbe9e8e` 的相关SC/SEQ/接口/页面/FUNC明细与图集，只读。

### Field Contracts

- 名称/可访问租户必填；详情secret默认掩码、显示复制合成值且失败不改配置；普通修改保持凭据。真实字段/生命周期missing，tenant身份失败不造成功UI。
- 精确FLD：FLD-003, FLD-005, FLD-006, FLD-069, FLD-070, FLD-071, FLD-088, FLD-089, FLD-090, FLD-091, FLD-092, FLD-093, FLD-094, FLD-095, FLD-096。

| FLD | SRC | 页面／接口区域 | 来源字段 |
| --- | --- | --- | --- |
| FLD-003 | SRC-001 | API-001 应用凭证换指定租户token与DCC导入接收 | tenantId |
| FLD-005 | SRC-001 | API-001 应用凭证换指定租户token与DCC导入接收 | 应用凭证（真实字段名/类型待核） |
| FLD-006 | SRC-001 | API-001 应用凭证换指定租户token与DCC导入接收 | 租户token |
| FLD-069 | SRC-001 | PAGE-001 应用接入列表 | 应用名称/appId/创建时间 |
| FLD-070 | SRC-001 | PAGE-001 应用接入列表 | 应用名称或appId查询条件 |
| FLD-071 | SRC-001 | PAGE-001 应用接入列表 | 结果总数和分页 |
| FLD-088 | SRC-001 | PAGE-003 新增应用 | 创建后生成演示appId/appSecret；非表单预填密钥 |
| FLD-089 | SRC-001 | PAGE-003 新增应用 | 可访问租户（必填） |
| FLD-090 | SRC-001 | PAGE-003 新增应用 | 应用名称（必填） |
| FLD-091 | SRC-001 | PAGE-004 应用详情 | 可访问租户/创建时间 |
| FLD-092 | SRC-001 | PAGE-004 应用详情 | 应用名称/appId |
| FLD-093 | SRC-001 | PAGE-004 应用详情 | 演示appSecret（默认掩码） |
| FLD-094 | SRC-001 | PAGE-005 修改应用 | appId/创建时间/演示appSecret保持，仅详情查看 |
| FLD-095 | SRC-001 | PAGE-005 修改应用 | 已有可访问租户（必填） |
| FLD-096 | SRC-001 | PAGE-005 修改应用 | 已有应用名称（必填） |

### Work

- 按FUNC018/019/020/001/021分别测五操作，现有同route四view/PAGE标记保持；显示复制归020。
- 创建合成凭据，修改原appId/secret保持；取消、强制存储失败、目标/身份变化不假成功或先撤权。
- FUNC002用实际DccRuntime/AppState后台合成VM验证授权tenant及撤权/删除旧身份拒绝；页面仅凭证前置上下文。
- 60字/重名/恢复防御仅demo额外检查，不升级冻结规则，不调用生产认证。

### Acceptance

- AC017/044/045/053～058可观察；FUNC001有本轮真实修改证据，五操作互不代替。
- 租户管理员/运营菜单直达/模型拒绝；取消失败不误撤权，不级联任务或其他应用/仍授权tenant。
- 对应R行见acceptance-map，全Planned；实际完成只能依本步新证据。

### Verification

- node /private/tmp/dcc-frozen676-application-model.js；node /private/tmp/dcc-frozen676-payload.js（当前真实源码/合成fixtures）。
- 浏览器runner KIND=application/application-extra/application-edge/markers，3宽实点创建/修改/复制/取消失败/删不级联/身份反例。
- 浏览器辅助入口 `python3 /private/tmp/dcc-run-frozen676-browser.py KIND` 只选本步KIND；统一隔离session=dcc-update-verification，绑定当前源码SHA/执行时间/URL/状态。图检查脚本由验证owner发布后适配，不编造命令。

### Verification Skill

- `prototype-verifier`

### Browser Evidence Tool

- `playwright-cli when needed`

### Support Skills

- `verification-before-completion`：新证据齐备后确认本步，不是S8全局。
- `systematic-debugging`：失败后区分事实/实现/资源/证据问题，不静默改基线。

### Dependencies

- step-01, step-03

### Failure Handling

- 原始输入/失败留存，由prototype-verifier记录并交owner；verify-only不得先改readonly字段/业务来放行。
- 范围/字段/规则变更回04；派生发布由总控按官方入口修复；实际缺陷由owner按授权边界处理后同点复验。
- 同点连续失败走熔断，不造pass/complete/批准。本计划不调用complete，S6未运行模型或浏览器。

## Step 05: 复验来源锁定、常驻导入、当前CSV与主子请求

Step ID: `step-05`

### Requirement Sources

- SRC-001, FUNC-004, FUNC-005, FUNC-015, FUNC-016, PAGE-002, ACTION-004, ACTION-005, ACTION-006, ACTION-014, ACTION-015, SC-001, SC-002, SEQ-001, SEQ-006, SEQ-007, AC-001, AC-005, AC-006, AC-007, AC-009, AC-010, AC-011, AC-012, AC-013, AC-014, AC-015, AC-019, AC-029, AC-030, AC-031, AC-032, AC-035, AC-036, AC-039, AC-045, AC-046, AC-047, AC-048, AC-049, AC-050, AC-051, AC-052, AC-059, AC-060
- SC/SEQ明细参与方、消息顺序、同步/异步、回调/超时/失败/补偿按冻结原文消费，不只发布图；接口风险不升级。

### Goal

来源锁定下当前有效行独立保存提交；CSV旧稿失效、DCC新业务主子与技术重传区分。

### Files

- `js/pages/cloud-call-tasks.js`
- `js/pages/cloud-task-workspace.js`
- `js/pages/customer-tasks.js`
- `js/components/dcc-records.js`
- `js/components/dcc-runtime.js`
- `mock/dcc-v1.1.0.js`
- `assets/css/task-create.css`
- `assets/css/dcc-v1.1.0.css`

### Expected Change

- verify-only
- Files现有对象为复验，不改成未授权业务重写。

### Inputs

- `docs/decisions.md`
- `memory/project-startup-plan.md`
- `memory/project.md`
- `memory/business-rules.md`
- `memory/feature-list.md`
- `memory/source-materials.md`
- `memory/field-map.md`
- `memory/open-items.md`
- `memory/project-structure.md`
- `memory/requirement-analysis-baseline.json`
- 当前冻结目录 `inputs/requirement-analysis/ra---v1.1.0---676248563fbe9e8e` 的相关SC/SEQ/接口/页面/FUNC明细与图集，只读。

### Field Contracts

- R缺省有效、priority本次必填。request为请求级，flag逐行可选Boolean/missing=false；完整有效内容幂等先行，固定tenant/原supplierTask/lead/phone，新行record/batch/root。手工无DCC输入；供应商fileId独立实际批、数量/未知不補成功。
- 精确FLD：FLD-001, FLD-002, FLD-003, FLD-004, FLD-005, FLD-006, FLD-007, FLD-008, FLD-009, FLD-010, FLD-011, FLD-012, FLD-013, FLD-014, FLD-015, FLD-016, FLD-017, FLD-018, FLD-019, FLD-020, FLD-021, FLD-022, FLD-023, FLD-024, FLD-025, FLD-026, FLD-074, FLD-075, FLD-076, FLD-078, FLD-080, FLD-081, FLD-082, FLD-085。

| FLD | SRC | 页面／接口区域 | 来源字段 |
| --- | --- | --- | --- |
| FLD-001 | SRC-001 | API-001 应用凭证换指定租户token与DCC导入接收 | R渠道（可选来源元数据） |
| FLD-002 | SRC-001 | API-001 应用凭证换指定租户token与DCC导入接收 | requestId（一次请求可含多行） |
| FLD-003 | SRC-001 | API-001 应用凭证换指定租户token与DCC导入接收 | tenantId |
| FLD-004 | SRC-001 | API-001 应用凭证换指定租户token与DCC导入接收 | 原supplier taskId |
| FLD-005 | SRC-001 | API-001 应用凭证换指定租户token与DCC导入接收 | 应用凭证（真实字段名/类型待核） |
| FLD-006 | SRC-001 | API-001 应用凭证换指定租户token与DCC导入接收 | 租户token |
| FLD-007 | SRC-001 | API-001 应用凭证换指定租户token与DCC导入接收 | 逐行isNewBatch（可选Boolean，missing=false） |
| FLD-008 | SRC-001 | API-001 应用凭证换指定租户token与DCC导入接收 | 逐行leadCode/phone（同组phone固定） |
| FLD-009 | SRC-001 | API-001 应用凭证换指定租户token与DCC导入接收 | 逐行priority（本次DCC值） |
| FLD-010 | SRC-001 | API-001 应用凭证换指定租户token与DCC导入接收 | batchId |
| FLD-011 | SRC-001 | API-001 应用凭证换指定租户token与DCC导入接收 | recordId |
| FLD-012 | SRC-001 | API-001 应用凭证换指定租户token与DCC导入接收 | requestId |
| FLD-013 | SRC-001 | API-001 应用凭证换指定租户token与DCC导入接收 | rootBatchId |
| FLD-014 | SRC-001 | API-001 应用凭证换指定租户token与DCC导入接收 | tenant/task/leadCode/phone及isNewBatch归一值/实际主子归属 |
| FLD-015 | SRC-001 | API-001 应用凭证换指定租户token与DCC导入接收 | 原已保存逐行接收结果及行定位（实际结构待开发） |
| FLD-016 | SRC-001 | API-002 供应商单号码批次导入 | fileId（文档：可选，提供则向现有批次增加号码） |
| FLD-017 | SRC-001 | API-002 供应商单号码批次导入 | taskId |
| FLD-018 | SRC-001 | API-002 供应商单号码批次导入 | taskTelList[].priority |
| FLD-019 | SRC-001 | API-002 供应商单号码批次导入 | taskTelList[].tel |
| FLD-020 | SRC-001 | API-002 供应商单号码批次导入 | data.fileId |
| FLD-021 | SRC-001 | API-002 供应商单号码批次导入 | data.importTotal 请求号码总数 |
| FLD-022 | SRC-001 | API-002 供应商单号码批次导入 | data.invalidTotal 非法号码数 |
| FLD-023 | SRC-001 | API-002 供应商单号码批次导入 | data.successTotal 成功导入号码数 |
| FLD-024 | SRC-001 | API-002 供应商单号码批次导入 | data.taskId |
| FLD-025 | SRC-001 | API-002 供应商单号码批次导入 | description |
| FLD-026 | SRC-001 | API-002 供应商单号码批次导入 | result |
| FLD-074 | SRC-001 | PAGE-002 预外呼任务记录页 | 供应商taskId/租户归属 |
| FLD-075 | SRC-001 | PAGE-002 预外呼任务记录页 | 原导入时间/各批次创建时间（仅审计）/本次priority（无每日衰减或旧值强制继承）/可选R |
| FLD-076 | SRC-001 | PAGE-002 预外呼任务记录页 | 同步importTotal/successTotal/invalidTotal及来源 |
| FLD-078 | SRC-001 | PAGE-002 预外呼任务记录页 | 已锁定任务来源（创建向导确认创建前可选；记录页只读） |
| FLD-080 | SRC-001 | PAGE-002 预外呼任务记录页 | 待提交顺序：高priority优先/同级本地时间FIFO；仅同任务，不同任务独立 |
| FLD-081 | SRC-001 | PAGE-002 预外呼任务记录页 | 手工CSV当前文本/有效预览对应状态/提交前最终逐行priority |
| FLD-082 | SRC-001 | PAGE-002 预外呼任务记录页 | 接口行isNewBatch（可选Boolean缺省false）/已保存rootBatchId主子分组；请求级requestId和行定位沿既有协议追溯，同归一内容重传与异内容冲突；手工不增加DCC标识或归组输入 |
| FLD-085 | SRC-001 | PAGE-002 预外呼任务记录页 | 线索编码/手机号/接口来源主批及子批/当前recordId、batchId、rootBatchId/精准供应商fileId、真实callID或稳定事件关联 |

### Work

- 创建前选来源，提交后锁；列表/任务内常驻入口按同目标source分派，无权/只读/状态不许禁用明因，旧历史仅未启动补导累计。
- 手工仅当前成功预览可交，改文本/失败空预览禁旧稿；统一/逐行priority、busy锁定、落账前身份/任务/文本复核，不有DCC字段。
- DCC鉴权归属后missing flag=false归一完整request幂等先行；仅新ID每有效行总新record/batch。true多主、false有主新子无主首主，最近主只保存稳定顺序。
- 多行隔离、sameID异内容整重复拒绝、后有新主原重传仍旧root；本次priority不继承旧值，高先同级FIFO仅同任务；准确同步证据/未知不重交。

### Acceptance

- AC001/005～007/009～012/014/019/029～032/036/046～051/059/060按正/异常oracle新验证。
- 无父必填/R字典/平台额度/衰减，自动单号提交不保证供应商再次接收或拨打。
- 对应R行见acceptance-map，全Planned；实际完成只能依本步新证据。

### Verification

- node /private/tmp/dcc-frozen676-s05-regression.cjs；node /private/tmp/dcc-frozen676-main-child-regression.cjs；node /private/tmp/dcc-frozen676-manual-race-model.js。
- 浏览器runner records/batch/manual-race/operator：实点来源/常驻导入、普通运营、CSV竞态与busy、主子旧root/无效行反馈。
- 浏览器辅助入口 `python3 /private/tmp/dcc-run-frozen676-browser.py KIND` 只选本步KIND；统一隔离session=dcc-update-verification，绑定当前源码SHA/执行时间/URL/状态。图检查脚本由验证owner发布后适配，不编造命令。

### Verification Skill

- `prototype-verifier`

### Browser Evidence Tool

- `playwright-cli when needed`

### Support Skills

- `verification-before-completion`：新证据齐备后确认本步，不是S8全局。
- `systematic-debugging`：失败后区分事实/实现/资源/证据问题，不静默改基线。

### Dependencies

- step-04

### Failure Handling

- 原始输入/失败留存，由prototype-verifier记录并交owner；verify-only不得先改readonly字段/业务来放行。
- 范围/字段/规则变更回04；派生发布由总控按官方入口修复；实际缺陷由owner按授权边界处理后同点复验。
- 同点连续失败走熔断，不造pass/complete/批准。本计划不调用complete，S6未运行模型或浏览器。

## Step 06: 复验同步异步导入失败、下载快照与补送

Step ID: `step-06`

### Requirement Sources

- SRC-001, FUNC-005, FUNC-006, FUNC-010, FUNC-013, FUNC-015, FUNC-017, PAGE-002, ACTION-006, ACTION-007, ACTION-014, SC-001, SC-003, SEQ-001, SEQ-003, SEQ-006, SEQ-007, AC-008, AC-013, AC-031, AC-035, AC-039, AC-040, AC-041, AC-042, AC-043, AC-045, AC-052
- SC/SEQ明细参与方、消息顺序、同步/异步、回调/超时/失败/补偿按冻结原文消费，不只发布图；接口风险不升级。

### Goal

失败/分片/导出成员精确可观察；CSV点击不等可信清理，补送不新导入或call。

### Files

- `js/components/dcc-runtime.js`
- `js/components/dcc-records.js`
- `mock/dcc-v1.1.0.js`
- `assets/css/dcc-v1.1.0.css`

### Expected Change

- verify-only
- Files现有对象为复验，不改成未授权业务重写。

### Inputs

- `docs/decisions.md`
- `memory/project-startup-plan.md`
- `memory/project.md`
- `memory/business-rules.md`
- `memory/feature-list.md`
- `memory/source-materials.md`
- `memory/field-map.md`
- `memory/open-items.md`
- `memory/project-structure.md`
- `memory/requirement-analysis-baseline.json`
- 当前冻结目录 `inputs/requirement-analysis/ra---v1.1.0---676248563fbe9e8e` 的相关SC/SEQ/接口/页面/FUNC明细与图集，只读。

### Field Contracts

- 53 total/currentBatchCount是片；fileId/原始号码精准。下载成员/版本/完整性/failedReason源值保持；清理不删root/去重/交付。1060只供应商原事件记录，不恢复平台priority衰减。
- 精确FLD：FLD-016, FLD-017, FLD-018, FLD-019, FLD-020, FLD-021, FLD-022, FLD-023, FLD-024, FLD-025, FLD-026, FLD-027, FLD-028, FLD-029, FLD-030, FLD-031, FLD-032, FLD-033, FLD-034, FLD-035, FLD-036, FLD-037, FLD-038, FLD-039, FLD-058, FLD-059, FLD-060, FLD-061, FLD-062, FLD-063, FLD-064, FLD-065, FLD-066, FLD-067, FLD-068, FLD-072, FLD-073, FLD-074, FLD-076, FLD-077, FLD-083, FLD-085。

| FLD | SRC | 页面／接口区域 | 来源字段 |
| --- | --- | --- | --- |
| FLD-016 | SRC-001 | API-002 供应商单号码批次导入 | fileId（文档：可选，提供则向现有批次增加号码） |
| FLD-017 | SRC-001 | API-002 供应商单号码批次导入 | taskId |
| FLD-018 | SRC-001 | API-002 供应商单号码批次导入 | taskTelList[].priority |
| FLD-019 | SRC-001 | API-002 供应商单号码批次导入 | taskTelList[].tel |
| FLD-020 | SRC-001 | API-002 供应商单号码批次导入 | data.fileId |
| FLD-021 | SRC-001 | API-002 供应商单号码批次导入 | data.importTotal 请求号码总数 |
| FLD-022 | SRC-001 | API-002 供应商单号码批次导入 | data.invalidTotal 非法号码数 |
| FLD-023 | SRC-001 | API-002 供应商单号码批次导入 | data.successTotal 成功导入号码数 |
| FLD-024 | SRC-001 | API-002 供应商单号码批次导入 | data.taskId |
| FLD-025 | SRC-001 | API-002 供应商单号码批次导入 | description |
| FLD-026 | SRC-001 | API-002 供应商单号码批次导入 | result |
| FLD-027 | SRC-001 | API-003 预测呼叫/导入失败及降级结果事件 | 推送设置配置（不是业务回调完整契约） |
| FLD-028 | SRC-001 | API-003 预测呼叫/导入失败及降级结果事件 | 53.currentBatchCount |
| FLD-029 | SRC-001 | API-003 预测呼叫/导入失败及降级结果事件 | 53.enterpriseId |
| FLD-030 | SRC-001 | API-003 预测呼叫/导入失败及降级结果事件 | 53.failedTelList[].failedReason |
| FLD-031 | SRC-001 | API-003 预测呼叫/导入失败及降级结果事件 | 53.failedTelList[].原始导入数据 |
| FLD-032 | SRC-001 | API-003 预测呼叫/导入失败及降级结果事件 | 53.fileId |
| FLD-033 | SRC-001 | API-003 预测呼叫/导入失败及降级结果事件 | 53.fileName |
| FLD-034 | SRC-001 | API-003 预测呼叫/导入失败及降级结果事件 | 53.taskId |
| FLD-035 | SRC-001 | API-003 预测呼叫/导入失败及降级结果事件 | 53.totalBatchCount |
| FLD-036 | SRC-001 | API-003 预测呼叫/导入失败及降级结果事件 | 53.totalFailedCount |
| FLD-037 | SRC-001 | API-003 预测呼叫/导入失败及降级结果事件 | 事件1060降级执行结果 |
| FLD-038 | SRC-001 | API-003 预测呼叫/导入失败及降级结果事件 | 事件52预测呼叫失败 |
| FLD-039 | SRC-001 | API-003 预测呼叫/导入失败及降级结果事件 | 事件53导入号码失败 |
| FLD-058 | SRC-001 | API-010 平台向DCC每次结果回传 | finishRetryFlag Integer1/0及未知状态 |
| FLD-059 | SRC-001 | API-010 平台向DCC每次结果回传 | recordId |
| FLD-060 | SRC-001 | API-010 平台向DCC每次结果回传 | requestId（对应原业务请求） |
| FLD-061 | SRC-001 | API-010 平台向DCC每次结果回传 | 原行定位及tenant/原task/leadCode/固定phone |
| FLD-062 | SRC-001 | API-010 平台向DCC每次结果回传 | 发生时间/阶段/结果或失败原因 |
| FLD-063 | SRC-001 | API-010 平台向DCC每次结果回传 | 客户/坐席实际接听/秒挂识别 |
| FLD-064 | SRC-001 | API-010 平台向DCC每次结果回传 | 已保存rootBatchId |
| FLD-065 | SRC-001 | API-010 平台向DCC每次结果回传 | 当前batchId |
| FLD-066 | SRC-001 | API-010 平台向DCC每次结果回传 | 真实call或稳定事件关联 |
| FLD-067 | SRC-001 | API-010 平台向DCC每次结果回传 | 话单状态/SIP原字段及来源 |
| FLD-068 | SRC-001 | API-010 平台向DCC每次结果回传 | 接收确认（契约交开发） |
| FLD-072 | SRC-001 | PAGE-002 预外呼任务记录页 | failedReason原始码及解释/本次导出快照范围 |
| FLD-073 | SRC-001 | PAGE-002 预外呼任务记录页 | 供应商fileId/失败结果分片总片数与片号/收齐状态 |
| FLD-074 | SRC-001 | PAGE-002 预外呼任务记录页 | 供应商taskId/租户归属 |
| FLD-076 | SRC-001 | PAGE-002 预外呼任务记录页 | 同步importTotal/successTotal/invalidTotal及来源 |
| FLD-077 | SRC-001 | PAGE-002 预外呼任务记录页 | 导出后必要去重/关联/回传状态保留 |
| FLD-083 | SRC-001 | PAGE-002 预外呼任务记录页 | 每次回传状态/晚更新/待核原因/下载与删除状态 |
| FLD-085 | SRC-001 | PAGE-002 预外呼任务记录页 | 线索编码/手机号/接口来源主批及子批/当前recordId、batchId、rootBatchId/精准供应商fileId、真实callID或稳定事件关联 |

### Work

- 本地校验/供应商同步53导入失败/实际呼叫失败分开，保留原数量/原因/来源，result0/汇总不盲推。
- 53核enterprise映tenant/task/fileId/原始号码精确回查，乱序重复迟到/声明冲突待核，片号不batch，收齐非全终态。
- 固定本次成员版本/完整性；浏览器下载仅点击，独立合成可信成功才清本次明细文件，失败中断保留。
- 下载后新失败下次导出、旧重复不再生；request/root/去重分片交付及成功客户保留，接口补送仅交付、手工不交付。

### Acceptance

- AC008/013/031/039～043/052新验证成员前后及原原因。
- 无推送不推0失败、不清全导入，补送不重复供应商提交。
- 对应R行见acceptance-map，全Planned；实际完成只能依本步新证据。

### Verification

- node /private/tmp/dcc-frozen676-s06-regression.cjs --ready；S06为历史caseID，日志Step用step-06。
- 浏览器runner failure/operator：新实际CSV/普通运营下载和解析，独立成功/失败/中断信号；非生产下载信号证明。
- 浏览器辅助入口 `python3 /private/tmp/dcc-run-frozen676-browser.py KIND` 只选本步KIND；统一隔离session=dcc-update-verification，绑定当前源码SHA/执行时间/URL/状态。图检查脚本由验证owner发布后适配，不编造命令。

### Verification Skill

- `prototype-verifier`

### Browser Evidence Tool

- `playwright-cli when needed`

### Support Skills

- `verification-before-completion`：新证据齐备后确认本步，不是S8全局。
- `systematic-debugging`：失败后区分事实/实现/资源/证据问题，不静默改基线。

### Dependencies

- step-05

### Failure Handling

- 原始输入/失败留存，由prototype-verifier记录并交owner；verify-only不得先改readonly字段/业务来放行。
- 范围/字段/规则变更回04；派生发布由总控按官方入口修复；实际缺陷由owner按授权边界处理后同点复验。
- 同点连续失败走熔断，不造pass/complete/批准。本计划不调用complete，S6未运行模型或浏览器。

## Step 07: 复验每次话单、SIP、短挂与无话单结果

Step ID: `step-07`

### Requirement Sources

- SRC-001, FUNC-010, FUNC-011, FUNC-012, FUNC-013, FUNC-015, PAGE-002, ACTION-010, ACTION-011, ACTION-012, ACTION-014, SC-002, SC-003, SC-004, SC-001, SEQ-002, SEQ-003, SEQ-004, SEQ-007, SEQ-001, AC-002, AC-003, AC-004, AC-018, AC-020, AC-021, AC-022, AC-023, AC-024, AC-026, AC-027, AC-033, AC-034, AC-035, AC-037, AC-038, AC-041, AC-043, AC-052, AC-062
- SC/SEQ明细参与方、消息顺序、同步/异步、回调/超时/失败/补偿按冻结原文消费，不只发布图；接口风险不升级。

### Goal

精确call/稳定事件结果与交付版本正确，未可信SIP不毒化随后可信更新。

### Files

- `js/components/dcc-runtime.js`
- `js/components/dcc-records.js`
- `mock/dcc-v1.1.0.js`
- `assets/css/dcc-v1.1.0.css`

### Expected Change

- verify-only
- Files现有对象为复验，不改成未授权业务重写。

### Inputs

- `docs/decisions.md`
- `memory/project-startup-plan.md`
- `memory/project.md`
- `memory/business-rules.md`
- `memory/feature-list.md`
- `memory/source-materials.md`
- `memory/field-map.md`
- `memory/open-items.md`
- `memory/project-structure.md`
- `memory/requirement-analysis-baseline.json`
- 当前冻结目录 `inputs/requirement-analysis/ra---v1.1.0---676248563fbe9e8e` 的相关SC/SEQ/接口/页面/FUNC明细与图集，只读。

### Field Contracts

- 客户时长可信源/单位，0/2有效、null/异常不补值；finish1/0/未知独立于SIP。未可信SIP独立不毒化。055～057所属not_required API007不转为本轮输入或执行。
- 精确FLD：FLD-027, FLD-028, FLD-029, FLD-030, FLD-031, FLD-032, FLD-033, FLD-034, FLD-035, FLD-036, FLD-037, FLD-038, FLD-039, FLD-040, FLD-041, FLD-042, FLD-043, FLD-044, FLD-045, FLD-046, FLD-047, FLD-048, FLD-049, FLD-050, FLD-051, FLD-052, FLD-055, FLD-056, FLD-057, FLD-058, FLD-059, FLD-060, FLD-061, FLD-062, FLD-063, FLD-064, FLD-065, FLD-066, FLD-067, FLD-068, FLD-074, FLD-083, FLD-084, FLD-085, FLD-086, FLD-087。

| FLD | SRC | 页面／接口区域 | 来源字段 |
| --- | --- | --- | --- |
| FLD-027 | SRC-001 | API-003 预测呼叫/导入失败及降级结果事件 | 推送设置配置（不是业务回调完整契约） |
| FLD-028 | SRC-001 | API-003 预测呼叫/导入失败及降级结果事件 | 53.currentBatchCount |
| FLD-029 | SRC-001 | API-003 预测呼叫/导入失败及降级结果事件 | 53.enterpriseId |
| FLD-030 | SRC-001 | API-003 预测呼叫/导入失败及降级结果事件 | 53.failedTelList[].failedReason |
| FLD-031 | SRC-001 | API-003 预测呼叫/导入失败及降级结果事件 | 53.failedTelList[].原始导入数据 |
| FLD-032 | SRC-001 | API-003 预测呼叫/导入失败及降级结果事件 | 53.fileId |
| FLD-033 | SRC-001 | API-003 预测呼叫/导入失败及降级结果事件 | 53.fileName |
| FLD-034 | SRC-001 | API-003 预测呼叫/导入失败及降级结果事件 | 53.taskId |
| FLD-035 | SRC-001 | API-003 预测呼叫/导入失败及降级结果事件 | 53.totalBatchCount |
| FLD-036 | SRC-001 | API-003 预测呼叫/导入失败及降级结果事件 | 53.totalFailedCount |
| FLD-037 | SRC-001 | API-003 预测呼叫/导入失败及降级结果事件 | 事件1060降级执行结果 |
| FLD-038 | SRC-001 | API-003 预测呼叫/导入失败及降级结果事件 | 事件52预测呼叫失败 |
| FLD-039 | SRC-001 | API-003 预测呼叫/导入失败及降级结果事件 | 事件53导入号码失败 |
| FLD-040 | SRC-001 | API-004 预测话单查询及秒挂候选数据 | startTime |
| FLD-041 | SRC-001 | API-004 预测话单查询及秒挂候选数据 | startTimeEnd |
| FLD-042 | SRC-001 | API-004 预测话单查询及秒挂候选数据 | 任务/批次/号码定位（需逐字段核对） |
| FLD-043 | SRC-001 | API-004 预测话单查询及秒挂候选数据 | customerBridgeDuration：Integer客户接听时长 |
| FLD-044 | SRC-001 | API-004 预测话单查询及秒挂候选数据 | degradeRound Integer |
| FLD-045 | SRC-001 | API-004 预测话单查询及秒挂候选数据 | endTime：Long结束时间 |
| FLD-046 | SRC-001 | API-004 预测话单查询及秒挂候选数据 | finishRetryFlag Integer：1最后一条，0否；未知分开 |
| FLD-047 | SRC-001 | API-004 预测话单查询及秒挂候选数据 | obSipCause String |
| FLD-048 | SRC-001 | API-004 预测话单查询及秒挂候选数据 | onHookSource：响应String，示例客户挂断 |
| FLD-049 | SRC-001 | API-004 预测话单查询及秒挂候选数据 | sipCause Integer原字段口径 |
| FLD-050 | SRC-001 | API-004 预测话单查询及秒挂候选数据 | sipCauseAsyncUpdateFlag Integer（非最后一通） |
| FLD-051 | SRC-001 | API-004 预测话单查询及秒挂候选数据 | status Integer及statusDesc |
| FLD-052 | SRC-001 | API-004 预测话单查询及秒挂候选数据 | telRetryRound Integer |
| FLD-055 | SRC-001 | API-007 平台换主叫接口（退出当前范围） | 原任务同线索关联新批次 |
| FLD-056 | SRC-001 | API-007 平台换主叫接口（退出当前范围） | 线路风控语义（专用标识/路由契约未核实） |
| FLD-057 | SRC-001 | API-007 平台换主叫接口（退出当前范围） | 主叫选择及再次呼叫结果（未核实） |
| FLD-058 | SRC-001 | API-010 平台向DCC每次结果回传 | finishRetryFlag Integer1/0及未知状态 |
| FLD-059 | SRC-001 | API-010 平台向DCC每次结果回传 | recordId |
| FLD-060 | SRC-001 | API-010 平台向DCC每次结果回传 | requestId（对应原业务请求） |
| FLD-061 | SRC-001 | API-010 平台向DCC每次结果回传 | 原行定位及tenant/原task/leadCode/固定phone |
| FLD-062 | SRC-001 | API-010 平台向DCC每次结果回传 | 发生时间/阶段/结果或失败原因 |
| FLD-063 | SRC-001 | API-010 平台向DCC每次结果回传 | 客户/坐席实际接听/秒挂识别 |
| FLD-064 | SRC-001 | API-010 平台向DCC每次结果回传 | 已保存rootBatchId |
| FLD-065 | SRC-001 | API-010 平台向DCC每次结果回传 | 当前batchId |
| FLD-066 | SRC-001 | API-010 平台向DCC每次结果回传 | 真实call或稳定事件关联 |
| FLD-067 | SRC-001 | API-010 平台向DCC每次结果回传 | 话单状态/SIP原字段及来源 |
| FLD-068 | SRC-001 | API-010 平台向DCC每次结果回传 | 接收确认（契约交开发） |
| FLD-074 | SRC-001 | PAGE-002 预外呼任务记录页 | 供应商taskId/租户归属 |
| FLD-083 | SRC-001 | PAGE-002 预外呼任务记录页 | 每次回传状态/晚更新/待核原因/下载与删除状态 |
| FLD-084 | SRC-001 | PAGE-002 预外呼任务记录页 | 独立未可信SIP待核证据与已确认呼叫对象区分 |
| FLD-085 | SRC-001 | PAGE-002 预外呼任务记录页 | 线索编码/手机号/接口来源主批及子批/当前recordId、batchId、rootBatchId/精准供应商fileId、真实callID或稳定事件关联 |
| FLD-086 | SRC-001 | PAGE-002 预外呼任务记录页 | 话单status/SIP字段及来源/finishRetryFlag1或0或未知 |
| FLD-087 | SRC-001 | PAGE-002 预外呼任务记录页 | 風控失败原因/客户与坐席实际接听/秒挂识别 |

### Work

- 实际batch/fileId/原始号码/call或事件定位，root原保存；新主不重算旧结果，不仅leadCode/最新主混并。
- 秒挂客户真接通/客户挂断/可信客户时长0～2含0/2；坐席桥接/null/未接通/异常不纳。
- 无话单稳定失败即时按来源记录交付，不等话单/恢复，不造callID/默认最后一通。
- 两种未可信SIP先后顺序独立待核后可信call/SIP仍同对象/交付版本；真可信非SIP冲突仍待核。
- finish1/0/未知与SIP分开，重复/晚更新/补送不新call；FLD055～057只退出API007源边界，不造换主叫动作。

### Acceptance

- AC002～004/018/020～023/026/027/033～035/037/038/052/062正/异常，手工只查看。
- 无平台次数预算/30分钟/额外4次/强制换主叫，未可信SIP不伪造非SIP冲突。
- 对应R行见acceptance-map，全Planned；实际完成只能依本步新证据。

### Verification

- node /private/tmp/dcc-frozen676-s07-regression.cjs --ready；node /private/tmp/dcc-frozen676-sip-regression.cjs；S07只是历史caseID。
- 浏览器runner result/batch：实际call/0/2/非短挂/无话单/SIP晚更新补送/未知，比较对象/导入/交付计数，VM不证明真实供应商。
- 浏览器辅助入口 `python3 /private/tmp/dcc-run-frozen676-browser.py KIND` 只选本步KIND；统一隔离session=dcc-update-verification，绑定当前源码SHA/执行时间/URL/状态。图检查脚本由验证owner发布后适配，不编造命令。

### Verification Skill

- `prototype-verifier`

### Browser Evidence Tool

- `playwright-cli when needed`

### Support Skills

- `verification-before-completion`：新证据齐备后确认本步，不是S8全局。
- `systematic-debugging`：失败后区分事实/实现/资源/证据问题，不静默改基线。

### Dependencies

- step-05, step-06

### Failure Handling

- 原始输入/失败留存，由prototype-verifier记录并交owner；verify-only不得先改readonly字段/业务来放行。
- 范围/字段/规则变更回04；派生发布由总控按官方入口修复；实际缺陷由owner按授权边界处理后同点复验。
- 同点连续失败走熔断，不造pass/complete/批准。本计划不调用complete，S6未运行模型或浏览器。

## Step 08: 复验当前业务记录查询与取消日龄状态

Step ID: `step-08`

### Requirement Sources

- SRC-001, FUNC-004, FUNC-005, FUNC-015, FUNC-016, PAGE-002, ACTION-004, ACTION-005, ACTION-006, ACTION-007, ACTION-014, ACTION-015, SC-001, SC-002, SC-003, SC-004, SEQ-007, SEQ-001, SEQ-002, SEQ-003, SEQ-004, SEQ-006, SEQ-009, AC-014, AC-015, AC-019, AC-026, AC-027, AC-028, AC-029, AC-032, AC-037, AC-038, AC-039, AC-040, AC-042, AC-052, AC-059
- SC/SEQ明细参与方、消息顺序、同步/异步、回调/超时/失败/补偿按冻结原文消费，不只发布图；接口风险不升级。

### Goal

任务级查询展示主子/请求/实际结果可信状态，跨页签上下文保持，退休daily不执行。

### Files

- `js/components/dcc-records.js`
- `js/components/dcc-runtime.js`
- `js/pages/cloud-task-workspace.js`
- `js/pages/cloud-call-tasks.js`
- `assets/css/dcc-v1.1.0.css`

### Expected Change

- verify-only
- Files现有对象为复验，不改成未授权业务重写。

### Inputs

- `docs/decisions.md`
- `memory/project-startup-plan.md`
- `memory/project.md`
- `memory/business-rules.md`
- `memory/feature-list.md`
- `memory/source-materials.md`
- `memory/field-map.md`
- `memory/open-items.md`
- `memory/project-structure.md`
- `memory/requirement-analysis-baseline.json`
- 当前冻结目录 `inputs/requirement-analysis/ra---v1.1.0---676248563fbe9e8e` 的相关SC/SEQ/接口/页面/FUNC明细与图集，只读。

### Field Contracts

- 任务来源只读，priority/时间不按年龄计算。root只分类，实际batch/fileId/call定位；未知空态/不完整不伪造最终。
- 精确FLD：FLD-010, FLD-011, FLD-012, FLD-013, FLD-014, FLD-015, FLD-058, FLD-059, FLD-060, FLD-061, FLD-064, FLD-065, FLD-066, FLD-067, FLD-072, FLD-073, FLD-074, FLD-075, FLD-076, FLD-077, FLD-078, FLD-079, FLD-080, FLD-081, FLD-082, FLD-083, FLD-084, FLD-085, FLD-086, FLD-087。

| FLD | SRC | 页面／接口区域 | 来源字段 |
| --- | --- | --- | --- |
| FLD-010 | SRC-001 | API-001 应用凭证换指定租户token与DCC导入接收 | batchId |
| FLD-011 | SRC-001 | API-001 应用凭证换指定租户token与DCC导入接收 | recordId |
| FLD-012 | SRC-001 | API-001 应用凭证换指定租户token与DCC导入接收 | requestId |
| FLD-013 | SRC-001 | API-001 应用凭证换指定租户token与DCC导入接收 | rootBatchId |
| FLD-014 | SRC-001 | API-001 应用凭证换指定租户token与DCC导入接收 | tenant/task/leadCode/phone及isNewBatch归一值/实际主子归属 |
| FLD-015 | SRC-001 | API-001 应用凭证换指定租户token与DCC导入接收 | 原已保存逐行接收结果及行定位（实际结构待开发） |
| FLD-058 | SRC-001 | API-010 平台向DCC每次结果回传 | finishRetryFlag Integer1/0及未知状态 |
| FLD-059 | SRC-001 | API-010 平台向DCC每次结果回传 | recordId |
| FLD-060 | SRC-001 | API-010 平台向DCC每次结果回传 | requestId（对应原业务请求） |
| FLD-061 | SRC-001 | API-010 平台向DCC每次结果回传 | 原行定位及tenant/原task/leadCode/固定phone |
| FLD-064 | SRC-001 | API-010 平台向DCC每次结果回传 | 已保存rootBatchId |
| FLD-065 | SRC-001 | API-010 平台向DCC每次结果回传 | 当前batchId |
| FLD-066 | SRC-001 | API-010 平台向DCC每次结果回传 | 真实call或稳定事件关联 |
| FLD-067 | SRC-001 | API-010 平台向DCC每次结果回传 | 话单状态/SIP原字段及来源 |
| FLD-072 | SRC-001 | PAGE-002 预外呼任务记录页 | failedReason原始码及解释/本次导出快照范围 |
| FLD-073 | SRC-001 | PAGE-002 预外呼任务记录页 | 供应商fileId/失败结果分片总片数与片号/收齐状态 |
| FLD-074 | SRC-001 | PAGE-002 预外呼任务记录页 | 供应商taskId/租户归属 |
| FLD-075 | SRC-001 | PAGE-002 预外呼任务记录页 | 原导入时间/各批次创建时间（仅审计）/本次priority（无每日衰减或旧值强制继承）/可选R |
| FLD-076 | SRC-001 | PAGE-002 预外呼任务记录页 | 同步importTotal/successTotal/invalidTotal及来源 |
| FLD-077 | SRC-001 | PAGE-002 预外呼任务记录页 | 导出后必要去重/关联/回传状态保留 |
| FLD-078 | SRC-001 | PAGE-002 预外呼任务记录页 | 已锁定任务来源（创建向导确认创建前可选；记录页只读） |
| FLD-079 | SRC-001 | PAGE-002 预外呼任务记录页 | 当前精确删除record/batch/fileId与结果样例及绑定反馈 |
| FLD-080 | SRC-001 | PAGE-002 预外呼任务记录页 | 待提交顺序：高priority优先/同级本地时间FIFO；仅同任务，不同任务独立 |
| FLD-081 | SRC-001 | PAGE-002 预外呼任务记录页 | 手工CSV当前文本/有效预览对应状态/提交前最终逐行priority |
| FLD-082 | SRC-001 | PAGE-002 预外呼任务记录页 | 接口行isNewBatch（可选Boolean缺省false）/已保存rootBatchId主子分组；请求级requestId和行定位沿既有协议追溯，同归一内容重传与异内容冲突；手工不增加DCC标识或归组输入 |
| FLD-083 | SRC-001 | PAGE-002 预外呼任务记录页 | 每次回传状态/晚更新/待核原因/下载与删除状态 |
| FLD-084 | SRC-001 | PAGE-002 预外呼任务记录页 | 独立未可信SIP待核证据与已确认呼叫对象区分 |
| FLD-085 | SRC-001 | PAGE-002 预外呼任务记录页 | 线索编码/手机号/接口来源主批及子批/当前recordId、batchId、rootBatchId/精准供应商fileId、真实callID或稳定事件关联 |
| FLD-086 | SRC-001 | PAGE-002 预外呼任务记录页 | 话单status/SIP字段及来源/finishRetryFlag1或0或未知 |
| FLD-087 | SRC-001 | PAGE-002 预外呼任务记录页 | 風控失败原因/客户与坐席实际接听/秒挂识别 |

### Work

- 按锁source查导入、独立主子、每call/失败/交付，record/batch/root与精确file/call可追溯，手工无DCC输入。
- 跨导入/失败/结果/交付/删除及详情返回、常驻导入目标/状态不丢，三阶段/未知/完整性分开。
- 当前priority和时间只审计，跨日/新主/重传不改旧数据；007/008/SEQ008/ACTION008退役，无每日查询衰减写回任务。

### Acceptance

- FUNC015独立查询结果及AC014/015/028/029/032/037～043/047～052/059可观察。
- 无全局新页/计时器/每日按钮，既有结果不因daily退役丢失。
- 对应R行见acceptance-map，全Planned；实际完成只能依本步新证据。

### Verification

- prototype-verifier对模型task/record/result/failure投影与UI比较，不生成新查询服务。
- 浏览器runner records/batch/markers核5页签/详情返回、旧root/三阶段/空未知/本次priority；活动源码/入口无API005/daily操作。
- 浏览器辅助入口 `python3 /private/tmp/dcc-run-frozen676-browser.py KIND` 只选本步KIND；统一隔离session=dcc-update-verification，绑定当前源码SHA/执行时间/URL/状态。图检查脚本由验证owner发布后适配，不编造命令。

### Verification Skill

- `prototype-verifier`

### Browser Evidence Tool

- `playwright-cli when needed`

### Support Skills

- `verification-before-completion`：新证据齐备后确认本步，不是S8全局。
- `systematic-debugging`：失败后区分事实/实现/资源/证据问题，不静默改基线。

### Dependencies

- step-05, step-06, step-07

### Failure Handling

- 原始输入/失败留存，由prototype-verifier记录并交owner；verify-only不得先改readonly字段/业务来放行。
- 范围/字段/规则变更回04；派生发布由总控按官方入口修复；实际缺陷由owner按授权边界处理后同点复验。
- 同点连续失败走熔断，不造pass/complete/批准。本计划不调用complete，S6未运行模型或浏览器。

## Step 09: 复验精准删除与DCC真实新请求再次导入

Step ID: `step-09`

### Requirement Sources

- SRC-001, FUNC-004, FUNC-005, FUNC-009, FUNC-010, FUNC-015, PAGE-002, ACTION-005, ACTION-009, ACTION-010, ACTION-014, SC-001, SC-002, SC-004, SEQ-009, SEQ-001, SEQ-002, SEQ-004, SEQ-007, AC-016, AC-019, AC-024, AC-025, AC-052, AC-061
- SC/SEQ明细参与方、消息顺序、同步/异步、回调/超时/失败/补偿按冻结原文消费，不只发布图；接口风险不升级。

### Goal

删仅当前实际批，本地谱系/交付保留；DCC自主新request取本次priority与确认主子规则。

### Files

- `js/components/dcc-runtime.js`
- `js/components/dcc-records.js`
- `mock/dcc-v1.1.0.js`
- `assets/css/dcc-v1.1.0.css`

### Expected Change

- verify-only
- Files现有对象为复验，不改成未授权业务重写。

### Inputs

- `docs/decisions.md`
- `memory/project-startup-plan.md`
- `memory/project.md`
- `memory/business-rules.md`
- `memory/feature-list.md`
- `memory/source-materials.md`
- `memory/field-map.md`
- `memory/open-items.md`
- `memory/project-structure.md`
- `memory/requirement-analysis-baseline.json`
- 当前冻结目录 `inputs/requirement-analysis/ra---v1.1.0---676248563fbe9e8e` 的相关SC/SEQ/接口/页面/FUNC明细与图集，只读。

### Field Contracts

- 精确目标组合校验，成功/拒绝/未知分开；切样例清反馈不抹证据，root不扩删范围，新业务priority取本次。
- 精确FLD：FLD-002, FLD-003, FLD-004, FLD-007, FLD-008, FLD-009, FLD-010, FLD-011, FLD-012, FLD-013, FLD-014, FLD-015, FLD-016, FLD-020, FLD-053, FLD-054, FLD-059, FLD-060, FLD-061, FLD-064, FLD-065, FLD-066, FLD-074, FLD-075, FLD-079, FLD-082, FLD-083, FLD-085。

| FLD | SRC | 页面／接口区域 | 来源字段 |
| --- | --- | --- | --- |
| FLD-002 | SRC-001 | API-001 应用凭证换指定租户token与DCC导入接收 | requestId（一次请求可含多行） |
| FLD-003 | SRC-001 | API-001 应用凭证换指定租户token与DCC导入接收 | tenantId |
| FLD-004 | SRC-001 | API-001 应用凭证换指定租户token与DCC导入接收 | 原supplier taskId |
| FLD-007 | SRC-001 | API-001 应用凭证换指定租户token与DCC导入接收 | 逐行isNewBatch（可选Boolean，missing=false） |
| FLD-008 | SRC-001 | API-001 应用凭证换指定租户token与DCC导入接收 | 逐行leadCode/phone（同组phone固定） |
| FLD-009 | SRC-001 | API-001 应用凭证换指定租户token与DCC导入接收 | 逐行priority（本次DCC值） |
| FLD-010 | SRC-001 | API-001 应用凭证换指定租户token与DCC导入接收 | batchId |
| FLD-011 | SRC-001 | API-001 应用凭证换指定租户token与DCC导入接收 | recordId |
| FLD-012 | SRC-001 | API-001 应用凭证换指定租户token与DCC导入接收 | requestId |
| FLD-013 | SRC-001 | API-001 应用凭证换指定租户token与DCC导入接收 | rootBatchId |
| FLD-014 | SRC-001 | API-001 应用凭证换指定租户token与DCC导入接收 | tenant/task/leadCode/phone及isNewBatch归一值/实际主子归属 |
| FLD-015 | SRC-001 | API-001 应用凭证换指定租户token与DCC导入接收 | 原已保存逐行接收结果及行定位（实际结构待开发） |
| FLD-016 | SRC-001 | API-002 供应商单号码批次导入 | fileId（文档：可选，提供则向现有批次增加号码） |
| FLD-020 | SRC-001 | API-002 供应商单号码批次导入 | data.fileId |
| FLD-053 | SRC-001 | API-006 精准删除供应商任务内号码 | 供应商taskId/批次/手机号（精确字段未核实） |
| FLD-054 | SRC-001 | API-006 精准删除供应商任务内号码 | 成功/失败/未知（具体码未核实） |
| FLD-059 | SRC-001 | API-010 平台向DCC每次结果回传 | recordId |
| FLD-060 | SRC-001 | API-010 平台向DCC每次结果回传 | requestId（对应原业务请求） |
| FLD-061 | SRC-001 | API-010 平台向DCC每次结果回传 | 原行定位及tenant/原task/leadCode/固定phone |
| FLD-064 | SRC-001 | API-010 平台向DCC每次结果回传 | 已保存rootBatchId |
| FLD-065 | SRC-001 | API-010 平台向DCC每次结果回传 | 当前batchId |
| FLD-066 | SRC-001 | API-010 平台向DCC每次结果回传 | 真实call或稳定事件关联 |
| FLD-074 | SRC-001 | PAGE-002 预外呼任务记录页 | 供应商taskId/租户归属 |
| FLD-075 | SRC-001 | PAGE-002 预外呼任务记录页 | 原导入时间/各批次创建时间（仅审计）/本次priority（无每日衰减或旧值强制继承）/可选R |
| FLD-079 | SRC-001 | PAGE-002 预外呼任务记录页 | 当前精确删除record/batch/fileId与结果样例及绑定反馈 |
| FLD-082 | SRC-001 | PAGE-002 预外呼任务记录页 | 接口行isNewBatch（可选Boolean缺省false）/已保存rootBatchId主子分组；请求级requestId和行定位沿既有协议追溯，同归一内容重传与异内容冲突；手工不增加DCC标识或归组输入 |
| FLD-083 | SRC-001 | PAGE-002 预外呼任务记录页 | 每次回传状态/晚更新/待核原因/下载与删除状态 |
| FLD-085 | SRC-001 | PAGE-002 预外呼任务记录页 | 线索编码/手机号/接口来源主批及子批/当前recordId、batchId、rootBatchId/精准供应商fileId、真实callID或稳定事件关联 |

### Work

- 明确tenant/原task/record/batch/fileId/phone，可信成功才已删；拒绝/未知不标成功、不按root删整组。
- 切目标/样例清旧反馈，旧已存证据保留；删除状态补送只交付，不重做删除。
- DCC新request按false/缺省新子或true新主，新编号/本次priority。旧技术重传原root不因删/新主重选。
- 本地request结果/phone组/root/file/call保留，不加先删/等finish门禁、不保证在途取消或再次拨打。

### Acceptance

- AC016/019/024/025/052/061及本次priority有目标前后证据。
- 无旧priority继承、平台计划，其他同号批独立。
- 对应R行见acceptance-map，全Planned；实际完成只能依本步新证据。

### Verification

- node /private/tmp/dcc-frozen676-deletion-regression.cjs；node /private/tmp/dcc-frozen676-main-child-regression.cjs。
- 浏览器runner batch/records实切目标/样例、可信/拒绝/未知、本地保留、新request批/priority；日志Step用step-09。
- 浏览器辅助入口 `python3 /private/tmp/dcc-run-frozen676-browser.py KIND` 只选本步KIND；统一隔离session=dcc-update-verification，绑定当前源码SHA/执行时间/URL/状态。图检查脚本由验证owner发布后适配，不编造命令。

### Verification Skill

- `prototype-verifier`

### Browser Evidence Tool

- `playwright-cli when needed`

### Support Skills

- `verification-before-completion`：新证据齐备后确认本步，不是S8全局。
- `systematic-debugging`：失败后区分事实/实现/资源/证据问题，不静默改基线。

### Dependencies

- step-05, step-07, step-08

### Failure Handling

- 原始输入/失败留存，由prototype-verifier记录并交owner；verify-only不得先改readonly字段/业务来放行。
- 范围/字段/规则变更回04；派生发布由总控按官方入口修复；实际缺陷由owner按授权边界处理后同点复验。
- 同点连续失败走熔断，不造pass/complete/批准。本计划不调用complete，S6未运行模型或浏览器。

## Step 10: 重建现行产品评审输入并保留审批边界

Step ID: `step-10`

### Requirement Sources

- SRC-001, FUNC-001, FUNC-002, FUNC-004, FUNC-005, FUNC-006, FUNC-009, FUNC-010, FUNC-011, FUNC-012, FUNC-013, FUNC-015, FUNC-016, FUNC-017, FUNC-018, FUNC-019, FUNC-020, FUNC-021, PAGE-001, PAGE-002, PAGE-003, PAGE-004, PAGE-005, ACTION-001, ACTION-004, ACTION-005, ACTION-006, ACTION-007, ACTION-009, ACTION-010, ACTION-011, ACTION-012, ACTION-014, ACTION-015, ACTION-016, ACTION-017, ACTION-018, ACTION-019, ACTION-020, ACTION-021, ACTION-022, ACTION-023, ACTION-024, SC-001, SC-002, SC-003, SC-004, SC-005, SEQ-001, SEQ-002, SEQ-003, SEQ-004, SEQ-005, SEQ-006, SEQ-007, SEQ-009
- SC/SEQ明细参与方、消息顺序、同步/异步、回调/超时/失败/补偿按冻结原文消费，不只发布图；接口风险不升级。

### Goal

现有product-input.json按本轮676与真实当前实现受控重建，旧15/46/2退出现行，产品审批pending。

### Files

- `product-input.json`

### Expected Change

- update
- 仅现有派生阅读/投影，不改源SVG/业务事实/工具。

### Inputs

- `docs/decisions.md`
- `memory/project-startup-plan.md`
- `memory/project.md`
- `memory/business-rules.md`
- `memory/feature-list.md`
- `memory/source-materials.md`
- `memory/field-map.md`
- `memory/open-items.md`
- `memory/project-structure.md`
- `memory/requirement-analysis-baseline.json`
- 当前冻结目录 `inputs/requirement-analysis/ra---v1.1.0---676248563fbe9e8e` 的相关SC/SEQ/接口/页面/FUNC明细与图集，只读。

### Field Contracts

- 96FLD均来自当前SRC001/field-map，只记录事实/实现映射；未核生产类型枚举保持，退出API007字段不造控件。
- 精确FLD：FLD-001, FLD-002, FLD-003, FLD-004, FLD-005, FLD-006, FLD-007, FLD-008, FLD-009, FLD-010, FLD-011, FLD-012, FLD-013, FLD-014, FLD-015, FLD-016, FLD-017, FLD-018, FLD-019, FLD-020, FLD-021, FLD-022, FLD-023, FLD-024, FLD-025, FLD-026, FLD-027, FLD-028, FLD-029, FLD-030, FLD-031, FLD-032, FLD-033, FLD-034, FLD-035, FLD-036, FLD-037, FLD-038, FLD-039, FLD-040, FLD-041, FLD-042, FLD-043, FLD-044, FLD-045, FLD-046, FLD-047, FLD-048, FLD-049, FLD-050, FLD-051, FLD-052, FLD-053, FLD-054, FLD-055, FLD-056, FLD-057, FLD-058, FLD-059, FLD-060, FLD-061, FLD-062, FLD-063, FLD-064, FLD-065, FLD-066, FLD-067, FLD-068, FLD-069, FLD-070, FLD-071, FLD-072, FLD-073, FLD-074, FLD-075, FLD-076, FLD-077, FLD-078, FLD-079, FLD-080, FLD-081, FLD-082, FLD-083, FLD-084, FLD-085, FLD-086, FLD-087, FLD-088, FLD-089, FLD-090, FLD-091, FLD-092, FLD-093, FLD-094, FLD-095, FLD-096。

| FLD | SRC | 页面／接口区域 | 来源字段 |
| --- | --- | --- | --- |
| FLD-001 | SRC-001 | API-001 应用凭证换指定租户token与DCC导入接收 | R渠道（可选来源元数据） |
| FLD-002 | SRC-001 | API-001 应用凭证换指定租户token与DCC导入接收 | requestId（一次请求可含多行） |
| FLD-003 | SRC-001 | API-001 应用凭证换指定租户token与DCC导入接收 | tenantId |
| FLD-004 | SRC-001 | API-001 应用凭证换指定租户token与DCC导入接收 | 原supplier taskId |
| FLD-005 | SRC-001 | API-001 应用凭证换指定租户token与DCC导入接收 | 应用凭证（真实字段名/类型待核） |
| FLD-006 | SRC-001 | API-001 应用凭证换指定租户token与DCC导入接收 | 租户token |
| FLD-007 | SRC-001 | API-001 应用凭证换指定租户token与DCC导入接收 | 逐行isNewBatch（可选Boolean，missing=false） |
| FLD-008 | SRC-001 | API-001 应用凭证换指定租户token与DCC导入接收 | 逐行leadCode/phone（同组phone固定） |
| FLD-009 | SRC-001 | API-001 应用凭证换指定租户token与DCC导入接收 | 逐行priority（本次DCC值） |
| FLD-010 | SRC-001 | API-001 应用凭证换指定租户token与DCC导入接收 | batchId |
| FLD-011 | SRC-001 | API-001 应用凭证换指定租户token与DCC导入接收 | recordId |
| FLD-012 | SRC-001 | API-001 应用凭证换指定租户token与DCC导入接收 | requestId |
| FLD-013 | SRC-001 | API-001 应用凭证换指定租户token与DCC导入接收 | rootBatchId |
| FLD-014 | SRC-001 | API-001 应用凭证换指定租户token与DCC导入接收 | tenant/task/leadCode/phone及isNewBatch归一值/实际主子归属 |
| FLD-015 | SRC-001 | API-001 应用凭证换指定租户token与DCC导入接收 | 原已保存逐行接收结果及行定位（实际结构待开发） |
| FLD-016 | SRC-001 | API-002 供应商单号码批次导入 | fileId（文档：可选，提供则向现有批次增加号码） |
| FLD-017 | SRC-001 | API-002 供应商单号码批次导入 | taskId |
| FLD-018 | SRC-001 | API-002 供应商单号码批次导入 | taskTelList[].priority |
| FLD-019 | SRC-001 | API-002 供应商单号码批次导入 | taskTelList[].tel |
| FLD-020 | SRC-001 | API-002 供应商单号码批次导入 | data.fileId |
| FLD-021 | SRC-001 | API-002 供应商单号码批次导入 | data.importTotal 请求号码总数 |
| FLD-022 | SRC-001 | API-002 供应商单号码批次导入 | data.invalidTotal 非法号码数 |
| FLD-023 | SRC-001 | API-002 供应商单号码批次导入 | data.successTotal 成功导入号码数 |
| FLD-024 | SRC-001 | API-002 供应商单号码批次导入 | data.taskId |
| FLD-025 | SRC-001 | API-002 供应商单号码批次导入 | description |
| FLD-026 | SRC-001 | API-002 供应商单号码批次导入 | result |
| FLD-027 | SRC-001 | API-003 预测呼叫/导入失败及降级结果事件 | 推送设置配置（不是业务回调完整契约） |
| FLD-028 | SRC-001 | API-003 预测呼叫/导入失败及降级结果事件 | 53.currentBatchCount |
| FLD-029 | SRC-001 | API-003 预测呼叫/导入失败及降级结果事件 | 53.enterpriseId |
| FLD-030 | SRC-001 | API-003 预测呼叫/导入失败及降级结果事件 | 53.failedTelList[].failedReason |
| FLD-031 | SRC-001 | API-003 预测呼叫/导入失败及降级结果事件 | 53.failedTelList[].原始导入数据 |
| FLD-032 | SRC-001 | API-003 预测呼叫/导入失败及降级结果事件 | 53.fileId |
| FLD-033 | SRC-001 | API-003 预测呼叫/导入失败及降级结果事件 | 53.fileName |
| FLD-034 | SRC-001 | API-003 预测呼叫/导入失败及降级结果事件 | 53.taskId |
| FLD-035 | SRC-001 | API-003 预测呼叫/导入失败及降级结果事件 | 53.totalBatchCount |
| FLD-036 | SRC-001 | API-003 预测呼叫/导入失败及降级结果事件 | 53.totalFailedCount |
| FLD-037 | SRC-001 | API-003 预测呼叫/导入失败及降级结果事件 | 事件1060降级执行结果 |
| FLD-038 | SRC-001 | API-003 预测呼叫/导入失败及降级结果事件 | 事件52预测呼叫失败 |
| FLD-039 | SRC-001 | API-003 预测呼叫/导入失败及降级结果事件 | 事件53导入号码失败 |
| FLD-040 | SRC-001 | API-004 预测话单查询及秒挂候选数据 | startTime |
| FLD-041 | SRC-001 | API-004 预测话单查询及秒挂候选数据 | startTimeEnd |
| FLD-042 | SRC-001 | API-004 预测话单查询及秒挂候选数据 | 任务/批次/号码定位（需逐字段核对） |
| FLD-043 | SRC-001 | API-004 预测话单查询及秒挂候选数据 | customerBridgeDuration：Integer客户接听时长 |
| FLD-044 | SRC-001 | API-004 预测话单查询及秒挂候选数据 | degradeRound Integer |
| FLD-045 | SRC-001 | API-004 预测话单查询及秒挂候选数据 | endTime：Long结束时间 |
| FLD-046 | SRC-001 | API-004 预测话单查询及秒挂候选数据 | finishRetryFlag Integer：1最后一条，0否；未知分开 |
| FLD-047 | SRC-001 | API-004 预测话单查询及秒挂候选数据 | obSipCause String |
| FLD-048 | SRC-001 | API-004 预测话单查询及秒挂候选数据 | onHookSource：响应String，示例客户挂断 |
| FLD-049 | SRC-001 | API-004 预测话单查询及秒挂候选数据 | sipCause Integer原字段口径 |
| FLD-050 | SRC-001 | API-004 预测话单查询及秒挂候选数据 | sipCauseAsyncUpdateFlag Integer（非最后一通） |
| FLD-051 | SRC-001 | API-004 预测话单查询及秒挂候选数据 | status Integer及statusDesc |
| FLD-052 | SRC-001 | API-004 预测话单查询及秒挂候选数据 | telRetryRound Integer |
| FLD-053 | SRC-001 | API-006 精准删除供应商任务内号码 | 供应商taskId/批次/手机号（精确字段未核实） |
| FLD-054 | SRC-001 | API-006 精准删除供应商任务内号码 | 成功/失败/未知（具体码未核实） |
| FLD-055 | SRC-001 | API-007 平台换主叫接口（退出当前范围） | 原任务同线索关联新批次 |
| FLD-056 | SRC-001 | API-007 平台换主叫接口（退出当前范围） | 线路风控语义（专用标识/路由契约未核实） |
| FLD-057 | SRC-001 | API-007 平台换主叫接口（退出当前范围） | 主叫选择及再次呼叫结果（未核实） |
| FLD-058 | SRC-001 | API-010 平台向DCC每次结果回传 | finishRetryFlag Integer1/0及未知状态 |
| FLD-059 | SRC-001 | API-010 平台向DCC每次结果回传 | recordId |
| FLD-060 | SRC-001 | API-010 平台向DCC每次结果回传 | requestId（对应原业务请求） |
| FLD-061 | SRC-001 | API-010 平台向DCC每次结果回传 | 原行定位及tenant/原task/leadCode/固定phone |
| FLD-062 | SRC-001 | API-010 平台向DCC每次结果回传 | 发生时间/阶段/结果或失败原因 |
| FLD-063 | SRC-001 | API-010 平台向DCC每次结果回传 | 客户/坐席实际接听/秒挂识别 |
| FLD-064 | SRC-001 | API-010 平台向DCC每次结果回传 | 已保存rootBatchId |
| FLD-065 | SRC-001 | API-010 平台向DCC每次结果回传 | 当前batchId |
| FLD-066 | SRC-001 | API-010 平台向DCC每次结果回传 | 真实call或稳定事件关联 |
| FLD-067 | SRC-001 | API-010 平台向DCC每次结果回传 | 话单状态/SIP原字段及来源 |
| FLD-068 | SRC-001 | API-010 平台向DCC每次结果回传 | 接收确认（契约交开发） |
| FLD-069 | SRC-001 | PAGE-001 应用接入列表 | 应用名称/appId/创建时间 |
| FLD-070 | SRC-001 | PAGE-001 应用接入列表 | 应用名称或appId查询条件 |
| FLD-071 | SRC-001 | PAGE-001 应用接入列表 | 结果总数和分页 |
| FLD-072 | SRC-001 | PAGE-002 预外呼任务记录页 | failedReason原始码及解释/本次导出快照范围 |
| FLD-073 | SRC-001 | PAGE-002 预外呼任务记录页 | 供应商fileId/失败结果分片总片数与片号/收齐状态 |
| FLD-074 | SRC-001 | PAGE-002 预外呼任务记录页 | 供应商taskId/租户归属 |
| FLD-075 | SRC-001 | PAGE-002 预外呼任务记录页 | 原导入时间/各批次创建时间（仅审计）/本次priority（无每日衰减或旧值强制继承）/可选R |
| FLD-076 | SRC-001 | PAGE-002 预外呼任务记录页 | 同步importTotal/successTotal/invalidTotal及来源 |
| FLD-077 | SRC-001 | PAGE-002 预外呼任务记录页 | 导出后必要去重/关联/回传状态保留 |
| FLD-078 | SRC-001 | PAGE-002 预外呼任务记录页 | 已锁定任务来源（创建向导确认创建前可选；记录页只读） |
| FLD-079 | SRC-001 | PAGE-002 预外呼任务记录页 | 当前精确删除record/batch/fileId与结果样例及绑定反馈 |
| FLD-080 | SRC-001 | PAGE-002 预外呼任务记录页 | 待提交顺序：高priority优先/同级本地时间FIFO；仅同任务，不同任务独立 |
| FLD-081 | SRC-001 | PAGE-002 预外呼任务记录页 | 手工CSV当前文本/有效预览对应状态/提交前最终逐行priority |
| FLD-082 | SRC-001 | PAGE-002 预外呼任务记录页 | 接口行isNewBatch（可选Boolean缺省false）/已保存rootBatchId主子分组；请求级requestId和行定位沿既有协议追溯，同归一内容重传与异内容冲突；手工不增加DCC标识或归组输入 |
| FLD-083 | SRC-001 | PAGE-002 预外呼任务记录页 | 每次回传状态/晚更新/待核原因/下载与删除状态 |
| FLD-084 | SRC-001 | PAGE-002 预外呼任务记录页 | 独立未可信SIP待核证据与已确认呼叫对象区分 |
| FLD-085 | SRC-001 | PAGE-002 预外呼任务记录页 | 线索编码/手机号/接口来源主批及子批/当前recordId、batchId、rootBatchId/精准供应商fileId、真实callID或稳定事件关联 |
| FLD-086 | SRC-001 | PAGE-002 预外呼任务记录页 | 话单status/SIP字段及来源/finishRetryFlag1或0或未知 |
| FLD-087 | SRC-001 | PAGE-002 预外呼任务记录页 | 風控失败原因/客户与坐席实际接听/秒挂识别 |
| FLD-088 | SRC-001 | PAGE-003 新增应用 | 创建后生成演示appId/appSecret；非表单预填密钥 |
| FLD-089 | SRC-001 | PAGE-003 新增应用 | 可访问租户（必填） |
| FLD-090 | SRC-001 | PAGE-003 新增应用 | 应用名称（必填） |
| FLD-091 | SRC-001 | PAGE-004 应用详情 | 可访问租户/创建时间 |
| FLD-092 | SRC-001 | PAGE-004 应用详情 | 应用名称/appId |
| FLD-093 | SRC-001 | PAGE-004 应用详情 | 演示appSecret（默认掩码） |
| FLD-094 | SRC-001 | PAGE-005 修改应用 | appId/创建时间/演示appSecret保持，仅详情查看 |
| FLD-095 | SRC-001 | PAGE-005 修改应用 | 已有可访问租户（必填） |
| FLD-096 | SRC-001 | PAGE-005 修改应用 | 已有应用名称（必填） |

### Work

- 只从新冻结JSON/S3/96FLD/真实Files/routes/step新证据重建同名聚合，旧结构仅schema兼容参考；不另建说明/副本，旧原件走现有归档/前镜像。
- 完整17FUNC/62AC/21BR/2FLOW/5SC/8SEQ/5PAGE20ACTION及本轮来源/真实路径/后台FUNC002执行边界。
- 4退休FUNC与ACTION002/008/SEQ008历史保留不混active；055～057只有退出源元数据。
- documents空，业务运营pending/05未建，单步证据不伪造S8全局通过或产品冻结。

### Acceptance

- 当前projection的ID/正文/关系/96FLD/manifest/fingerprint/实际实施一致，无旧目录混当前。
- 审批/真实API风险/后台与UI边界清楚；docs空，不以生成JSON当全局验收。
- 对应R行见acceptance-map，全Planned；实际完成只能依本步新证据。

### Verification

- JSON解析/ID/AC关系/5PAGE20ACTION/96FLD映射/读取源SHA确定性对账，与真实model/UI路径对照。
- node /private/tmp/dcc-frozen676-payload.js和浏览器runner markers仅该投影链路；S8/产品评审另外执行。
- 浏览器辅助入口 `python3 /private/tmp/dcc-run-frozen676-browser.py KIND` 只选本步KIND；统一隔离session=dcc-update-verification，绑定当前源码SHA/执行时间/URL/状态。图检查脚本由验证owner发布后适配，不编造命令。

### Verification Skill

- `prototype-verifier`

### Browser Evidence Tool

- `playwright-cli when needed`

### Support Skills

- `verification-before-completion`：新证据齐备后确认本步，不是S8全局。
- `systematic-debugging`：失败后区分事实/实现/资源/证据问题，不静默改基线。

### Dependencies

- step-01, step-02, step-03, step-04, step-05, step-06, step-07, step-08, step-09

### Failure Handling

- 原始输入/失败留存，由prototype-verifier记录并交owner；verify-only不得先改readonly字段/业务来放行。
- 范围/字段/规则变更回04；派生发布由总控按官方入口修复；实际缺陷由owner按授权边界处理后同点复验。
- 同点连续失败走熔断，不造pass/complete/批准。本计划不调用complete，S6未运行模型或浏览器。

