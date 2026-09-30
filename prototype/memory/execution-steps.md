# 执行步骤

## Step 1 供应商账号、坐席与资源适配
### Files
index.html, js/app.js, js/nav.js, js/pages/*.js, js/components/*.js, mock/*.js, config/nav.json；新增js/components/alicti-adapter.js统一能力边界。
### Expected Change
供应商上下文采用enterpriseId；坐席cno和areaCode；全存储前缀隔离；新文档不支持的资源/导入/发布/启动恢复显示待确认并阻断写入。保留页面布局及本地账号客户AI能力。
### Verification Skill
prototype-verifier；语法、浏览器表单及待确认状态与数据不变检查。
### Acceptance
按本步骤预期变更与所列冻结来源核对，不支持动作保持待确认且数据不误变更。
### Verification
语法检查、浏览器操作、状态断言及相关源文件核对。
Sources: SC-001 SC-003 SC-005 SC-006 SC-007 SC-008 SC-009 SC-011 SC-101 SC-201；对应SEQ及FUNC/PAGE/ACTION见验收映射。

## Step 2 电话与任务执行状态适配
### Files
js/components/alicti-adapter.js, js/pages/agent-workbench.js, js/pages/cloud-task-workspace.js, js/components/account-seat.js, js/pages/agent-center.js, mock/data.js, mock/call-media.js。
### Expected Change
模拟setup→事件→短期令牌→登录→媒体就绪；创建及导入不自动启动；未明确支持的启动恢复不生成通话；暂停结束未知在途保持待确认；人工/预测话单分别解释，ASR和录音独立状态。
### Verification Skill
prototype-verifier；状态与参数断言及浏览器人工呼叫闭环。
### Acceptance
按本步骤预期变更与所列冻结来源核对，不支持动作保持待确认且数据不误变更。
### Verification
语法检查、浏览器操作、状态断言及相关源文件核对。
Sources: SC-014 SC-015 SC-017 SC-018 SC-019 SC-102 SC-103 SC-104 SC-105 SC-206；对应SEQ在冻结入口。

## Step 3 发布图集与交付整合
### Files
flowcharts/business-process.html, flowcharts/sequence-interaction.html, flowcharts/page-structure.html, related-systems/index.html, js/delivery-nav.js, assets/css/atlas-sidebar.css, index.html。
### Expected Change
用import_analysis publish-diagrams只读复用图集；交付导航在宿主切换；旧接口说明不进入产品页面，全部角色入口保留。
### Verification Skill
prototype-verifier；全路由、404/console、四视图与冻结完整性核验。
### Acceptance
按本步骤预期变更与所列冻结来源核对，不支持动作保持待确认且数据不误变更。
### Verification
语法检查、浏览器操作、状态断言及相关源文件核对。
Sources: 全部FUNC/PAGE/ACTION；未单列的客户/统计/AI业务沿用并执行回归。

## Step 4 关联系统架构蓝图（2026-09-11 交付说明补充）
### Files
related-systems/index.html、related-systems/blueprint-data.js、related-systems/blueprint.js、assets/css/system-blueprint.css、js/delivery-nav.js、config/nav.json、index.html；蓝图生成源位于 ../blueprint/。
### Expected Change
以已确认系统范围和接口证据补充系统总览、平台模块、接口适配层、AliCti 能力模块及接口对照。表现平台设计职责与公开接口关联，不新增业务接口、不声称供应商内部部署拓扑已核实。保留现有交付导航和页面；图集目录在左侧，支持模块 / 连线详情、查找、待确认连接突出、缩放、全屏及 SVG 导出。
### Verification Skill
prototype-verifier、verification-before-completion；本地浏览器与数据结构专项核对。
### Acceptance
四层关系完整可读；每个模块和连接可追溯到当前业务规则、接口或明确的设计说明；企业账号和平台租户不混同，浏览器媒体链路与后端业务接口分开；未知能力不补造端点；接口索引覆盖当前 27 项来源；图页在直接打开及原型嵌入两种方式下均可用。
### Verification
核验节点与关系引用、SVG 几何、接口索引与冻结值一致性、语法和链接；浏览器验证四视图切换、搜索、节点 / 连线详情、待确认连接、缩放、全屏、导出和原型导航。
Sources: PAGE-207、API-301–API-327；当前规则附表、号码状态补充核验；本次用户明确要求系统架构蓝图。仅补充交付说明和架构职责视图，不重新冻结或修改既有业务功能事实。

### Step 4 本步结果

已完成四层蓝图、接口对照及交互，并更新 README 和说明附表中的入口。相关节点累计 47 个，逻辑关系 50 条，接口 / 字段依据 27 项；专项验证通过，详见 memory/system-blueprint-verification.json。未推进 S9 完整功能说明阶段。


## D-016 · 重呼开关与自动外呼选流局部迭代

用户已确认本轮五项执行方案。沿用当前原型，重呼配置、自动外呼创建及相应交付内容依据 docs/decisions.md D-016 更新；不推进 Loop 阶段，不改写冻结输入。

实施与验收：本地开关默认关闭、开启适用项必填；两类任务共用基础设置、自动外呼可选号码状态；执行交由阿里。自动外呼从官方 IVR 列表选择有本地外呼授权的流程，按流程→设置→客户→确认完成创建；旧草稿可恢复，保存失败不能跳走或丢失；字段请求、异常反馈、说明、附表、蓝图及开发包一致。

结果及依据：memory/retry-ivr-verification-20260914.json；当前逻辑、浏览器和交付包专项验证通过，非真实联调。


## D-017 · 暂停与继续局部迭代

用户已明确暂停省略pauseDuration；阿里反馈继续复用task/start且先get确认暂停；本期不实现结束重开。沿用既有页面和当前交付内容，不推进Loop阶段、不改冻结输入。

实施与验收：暂停无时长输入、换算或本地计时；继续先校验权限资源，再get核对原任务ID及状态2，start后再get确认；失败未知保持待核对，无自动重放。原任务进度、通话、启动时间及快照不变，结束不重开。说明、附表、字段、状态模型、流程、时序、蓝图及开发包一致。

结果：memory/pause-resume-verification-20260914.json；本地逻辑、浏览器和解压交付包通过，真实在途及排队重呼影响仍为CF-04。


## D-018 · 两类重呼必填呼叫状态局部迭代

用户明确要求恢复预外呼和自动外呼的呼叫状态选择且必填。沿用既有向导和官方编码，不推进Loop、不改冻结输入。开启后立即展示多选；状态、次数、间隔和计时依据缺一阻断完整保存/继续，关闭保留原值，旧basic须用户补选。

自动外呼采用已明确的状态数组；预测配置完整保存但实际执行映射仍待CF-03确认，不丢条件、不伪造供应商创建/运行。说明、附表、schema、验收、流程与开发包同步。结果见memory/retry-status-verification-20260914.json，本地验证通过。


## D-019 · 创建页面操作简化

用户要求降低两类任务模板保存/引用的视觉权重，并删除技术模拟数据说明。仅调整创建四步的呈现：常用设置默认折叠为次要入口，主表单优先业务必填；技术说明移出业务页面，实际校验失败和能力边界以业务语言保留。

不变更接口能力、D018状态必填、D017暂停继续或冻结输入。常用设置引用、保存、草稿保留、任务创建及响应式浏览器验证通过，开发包同步。结果见memory/task-ui-verification-20260914.json。


## D-020 · 预测按号码状态重呼支持落地

目标：按SRC052用户转述供应商反馈，两类任务统一输出状态条件重呼策略，移除预测仅草稿、创建及启动继续能力阻断；关闭按省略配置处理。必填、旧草稿补码、权限资源、D017状态查证及D019呈现保持。

验收：71字段/26重呼/24向导/28生命周期既有检查及预测真实组件创建控制联动、浏览器两类创建流程与文档导航；CF03关闭、FA046已修正，68/18/1/7字段、9主题3准备；265附表/82功能/47页面/131计划验收保持，源及解压包校验通过。业务图、任务时序和系统蓝图使用当前投影，冻结输入不变。


## D-021 · 暂停可继续、结束不再执行后续呼叫

目标：以SRC053用户确认明确后续任务执行规则，结束后不再发起首次或重呼且不重开，迟到结果只归历史。既有控制已具备结束状态门禁，本轮以提示、规则与开发交付同步为主；CF04仅收窄为已发起通话收尾。

验证：既有生命周期检查及结束禁止后续/保留历史、未知结果不伪造终态；浏览器核对暂停继续和结束提示、文档/附表/图稿一致；9主题/1字段/3准备、265规则和131计划案例保持，包及冻结输入完整性。


## DEMO-DATA-01 · 模块虚拟演示数据（2026-09-15）

依据用户明确要求，在mock目录按当前逻辑补齐总部与门店资源、任务、客户和通话。覆盖正常、暂停、结束、未知、在途及今日/近7日报表；通过真实页面操作验证，保留已有用户编辑和租户隔离。只更改mock、index加载及演示说明/校验，不增加业务能力、不改冻结事实。
