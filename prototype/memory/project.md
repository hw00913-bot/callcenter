# 项目记忆 — 当前迭代 AliCti独立原型

## 项目定位

- 项目名称：AliCti独立原型与业务图集
- 当前迭代：AliCti独立原型
- 需求版本：0.1.0-alicti-review
- 冻结基线：`ra-alicti独立原型需求分析-5706c147e80c7271` / `5706c147e80c7271b7be98cf76424c50f0c7339cf5bbb60aa71ecbc19dd8a706`
- 类型：无构建步骤的静态前端演示原型
- 入口：`index.html`

## 产品目标

继承现有26场景及页面底座；enterpriseId承接供应商账号范围；形成独立原型、流程与时序，严格区分模拟与真实接口证据。

## 目标用户

- 超级管理员
- 租户管理员
- 租户运营
- 租户运营（关联本人坐席）

## 核心页面列表

- `PAGE-102` 运营工作台：运营工作台；场景 ["SC-105", "SC-201", "SC-104", "SC-005"]；时序 ["SEQ-105", "SEQ-201", "SEQ-104", "SEQ-005"]；功能 ["FUNC-255", "FUNC-256", "FUNC-110", "FUNC-230", "FUNC-217", "FUNC-270", "FUNC-265", "FUNC-214"]
- `PAGE-201` 登录与租户/业务域选择：独立入口；场景 ["SC-201"]；时序 ["SEQ-201"]；功能 ["FUNC-201", "FUNC-203", "FUNC-202"]
- `PAGE-202` 账号管理：账号与租户 / 账号管理；场景 ["SC-002", "SC-101", "SC-003"]；时序 ["SEQ-002", "SEQ-101", "SEQ-003"]；功能 ["FUNC-207", "FUNC-208", "FUNC-209", "FUNC-101", "FUNC-210"]
- `PAGE-203` 租户管理：账号与租户 / 租户管理；场景 ["SC-001", "SC-016"]；时序 ["SEQ-001", "SEQ-016"]；功能 ["FUNC-204", "FUNC-205", "FUNC-206", "FUNC-278", "FUNC-279", "FUNC-280", "FUNC-281"]
- `PAGE-101` 坐席维护与账号关联：坐席与技能组 / 坐席维护；场景 ["SC-003", "SC-005", "SC-101"]；时序 ["SEQ-003", "SEQ-005", "SEQ-101"]；功能 ["FUNC-210", "FUNC-211", "FUNC-101", "FUNC-214", "FUNC-215", "FUNC-216", "FUNC-217"]
- `PAGE-204` 技能组成员与等级：独立入口；场景 ["SC-007"]；时序 ["SEQ-007"]；功能 ["FUNC-221", "FUNC-222", "FUNC-223", "FUNC-224"]
- `PAGE-205` 配置记录：坐席与技能组 / 配置记录；场景 ["SC-003", "SC-006", "SC-007"]；时序 ["SEQ-003", "SEQ-006", "SEQ-007"]；功能 ["FUNC-218", "FUNC-213"]
- `PAGE-206` 技能组管理：坐席与技能组 / 技能组管理；场景 ["SC-006"]；时序 ["SEQ-006"]；功能 ["FUNC-219", "FUNC-220"]
- `PAGE-207` 关联系统展示：交付视图 / 关联系统展示；场景 ["SC-201"]；时序 ["SEQ-201"]；功能 ["FUNC-203"]
- `PAGE-209` 导入与分配：客户管理 / 导入与分配；场景 ["SC-203", "SC-204", "SC-205"]；时序 ["SEQ-203", "SEQ-204", "SEQ-205"]；功能 ["FUNC-239", "FUNC-238", "FUNC-242", "FUNC-243"]
- `PAGE-210` 导入客户弹窗：独立入口；场景 ["SC-203"]；时序 ["SEQ-203"]；功能 ["FUNC-238"]
- `PAGE-211` 批次客户与分配弹窗：独立入口；场景 ["SC-204", "SC-205"]；时序 ["SEQ-204", "SEQ-205"]；功能 ["FUNC-242", "FUNC-240", "FUNC-241", "FUNC-243", "FUNC-244"]
- `PAGE-213` 预外呼任务列表：云呼叫 / 预外呼；场景 ["SC-014", "SC-105", "SC-206"]；时序 ["SEQ-014", "SEQ-105", "SEQ-206"]；功能 ["FUNC-248", "FUNC-245", "FUNC-110", "FUNC-250"]
- `PAGE-214` IVR外呼任务列表：云呼叫 / IVR 外呼；场景 ["SC-015", "SC-105", "SC-206"]；时序 ["SEQ-015", "SEQ-105", "SEQ-206"]；功能 ["FUNC-248", "FUNC-246", "FUNC-110", "FUNC-250"]
- `PAGE-215` 创建预外呼/IVR任务向导：独立入口；场景 ["SC-014", "SC-015", "SC-204"]；时序 ["SEQ-014", "SEQ-015", "SEQ-204"]；功能 ["FUNC-247", "FUNC-240", "FUNC-245", "FUNC-246"]
- `PAGE-216` 任务详情与执行控制：独立入口；场景 ["SC-014", "SC-015", "SC-105", "SC-205", "SC-206"]；时序 ["SEQ-014", "SEQ-015", "SEQ-105", "SEQ-205", "SEQ-206"]；功能 ["FUNC-110", "FUNC-249", "FUNC-111", "FUNC-112", "FUNC-113", "FUNC-242", "FUNC-243"]
- `PAGE-217` 呼入服务：云呼叫 / 呼入服务；场景 ["SC-011", "SC-017", "SC-018"]；时序 ["SEQ-011", "SEQ-017", "SEQ-018"]；功能 ["FUNC-252", "FUNC-251", "FUNC-253", "FUNC-254"]
- `PAGE-218` 呼入规则配置：独立入口；场景 ["SC-011", "SC-017", "SC-018"]；时序 ["SEQ-011", "SEQ-017", "SEQ-018"]；功能 ["FUNC-251", "FUNC-252"]
- `PAGE-103` 通话记录列表：通话记录 / 通话记录；场景 ["SC-019", "SC-104"]；时序 ["SEQ-019", "SEQ-104"]；功能 ["FUNC-264", "FUNC-265", "FUNC-263"]
- `PAGE-104` 通话详情：独立入口；场景 ["SC-019", "SC-104"]；时序 ["SEQ-019", "SEQ-104"]；功能 ["FUNC-265", "FUNC-266", "FUNC-282"]
- `PAGE-220` 线路管理：线路与号码 / 线路管理；场景 ["SC-008", "SC-105"]；时序 ["SEQ-008", "SEQ-105"]；功能 ["FUNC-230", "FUNC-229"]
- `PAGE-221` 号码管理：线路与号码 / 号码管理；场景 ["SC-008", "SC-009"]；时序 ["SEQ-008", "SEQ-009"]；功能 ["FUNC-233", "FUNC-231", "FUNC-232", "FUNC-236", "FUNC-237"]
- `PAGE-222` 号码详情·使用范围：独立入口；场景 ["SC-008"]；时序 ["SEQ-008"]；功能 ["FUNC-235", "FUNC-234"]
- `PAGE-223` 通话数据异常：系统管理 / 通话数据异常；场景 ["SC-019", "SC-105"]；时序 ["SEQ-019", "SEQ-105"]；功能 ["FUNC-270", "FUNC-271"]
- `PAGE-224` 操作审计：系统管理 / 操作审计；场景 ["SC-020"]；时序 ["SEQ-020"]；功能 ["FUNC-274", "FUNC-275"]
- `PAGE-225` 通话总览：统计报表 / 通话总览；场景 ["SC-020", "SC-104"]；时序 ["SEQ-020", "SEQ-104"]；功能 ["FUNC-272", "FUNC-264", "FUNC-273", "FUNC-108", "FUNC-265"]
- `PAGE-246` 客户跟进：统计报表 / 客户跟进；场景 ["SC-020", "SC-203", "SC-205", "SC-104"]；时序 ["SEQ-020", "SEQ-203", "SEQ-205", "SEQ-104"]；功能 ["FUNC-108", "FUNC-272", "FUNC-273", "FUNC-242", "FUNC-243", "FUNC-277"]
- `PAGE-226` 外呼任务：统计报表 / 外呼任务；场景 ["SC-020", "SC-104"]；时序 ["SEQ-020", "SEQ-104"]；功能 ["FUNC-272", "FUNC-110", "FUNC-273", "FUNC-108"]
- `PAGE-227` 呼入服务：统计报表 / 呼入服务；场景 ["SC-020", "SC-104"]；时序 ["SEQ-020", "SEQ-104"]；功能 ["FUNC-272", "FUNC-264", "FUNC-273", "FUNC-108", "FUNC-265"]
- `PAGE-228` 坐席成效：统计报表 / 坐席成效；场景 ["SC-020", "SC-104"]；时序 ["SEQ-020", "SEQ-104"]；功能 ["FUNC-272", "FUNC-273", "FUNC-108", "FUNC-264", "FUNC-265"]
- `PAGE-229` 服务技能：统计报表 / 服务技能；场景 ["SC-020", "SC-104"]；时序 ["SEQ-020", "SEQ-104"]；功能 ["FUNC-272", "FUNC-273", "FUNC-108", "FUNC-264", "FUNC-265"]
- `PAGE-230` AI外呼列表：智能外呼 / 外呼列表；场景 ["SC-016"]；时序 ["SEQ-016"]；功能 ["FUNC-203"]
- `PAGE-231` AI外呼拦截：智能外呼 / 外呼拦截；场景 ["SC-016"]；时序 ["SEQ-016"]；功能 ["FUNC-203"]
- `PAGE-232` AI通道管理：智能外呼 / 通道管理；场景 ["SC-016"]；时序 ["SEQ-016"]；功能 ["FUNC-203"]
- `PAGE-233` AI业务场景：智能外呼 / 业务场景；场景 ["SC-016"]；时序 ["SEQ-016"]；功能 ["FUNC-203"]
- `PAGE-234` AI标签管理：智能外呼 / 标签管理；场景 ["SC-016"]；时序 ["SEQ-016"]；功能 ["FUNC-203"]
- `PAGE-235` AI通话记录：通话记录 / 通话记录；场景 ["SC-016", "SC-020"]；时序 ["SEQ-016", "SEQ-020"]；功能 ["FUNC-203"]
- `PAGE-236` AI线索记录：通话记录 / 线索记录；场景 ["SC-016", "SC-020"]；时序 ["SEQ-016", "SEQ-020"]；功能 ["FUNC-203"]
- `PAGE-237` AI通话统计：统计报表 / 通话统计；场景 ["SC-016", "SC-020"]；时序 ["SEQ-016", "SEQ-020"]；功能 ["FUNC-203"]
- `PAGE-238` AI计费统计：统计报表 / 计费统计；场景 ["SC-016", "SC-020"]；时序 ["SEQ-016", "SEQ-020"]；功能 ["FUNC-203"]
- `PAGE-239` AI线索统计：统计报表 / 线索统计；场景 ["SC-016", "SC-020"]；时序 ["SEQ-016", "SEQ-020"]；功能 ["FUNC-203"]
- `PAGE-240` 人工呼叫弹窗：独立入口；场景 ["SC-102", "SC-103", "SC-205"]；时序 ["SEQ-102", "SEQ-103", "SEQ-205"]；功能 ["FUNC-104", "FUNC-260", "FUNC-261", "FUNC-262", "FUNC-106", "FUNC-258", "FUNC-259"]
- `PAGE-241` AI任务详情及原有弹窗：独立入口；场景 ["SC-016"]；时序 ["SEQ-016"]；功能 ["FUNC-203"]
- `PAGE-242` 坐席工作台：坐席工作台；场景 ["SC-102", "SC-103", "SC-104", "SC-105", "SC-020"]；时序 ["SEQ-102", "SEQ-103", "SEQ-104", "SEQ-105", "SEQ-020"]；功能 ["FUNC-257", "FUNC-258", "FUNC-259", "FUNC-104", "FUNC-106", "FUNC-108"]
- `PAGE-243` 客户档案：客户管理 / 客户档案；场景 ["SC-203", "SC-205"]；时序 ["SEQ-203", "SEQ-205"]；功能 ["FUNC-276", "FUNC-277"]
- `PAGE-244` 客户档案详情：独立入口；场景 ["SC-205", "SC-104"]；时序 ["SEQ-205", "SEQ-104"]；功能 ["FUNC-277", "FUNC-243", "FUNC-265"]
- `PAGE-245` 关联坐席弹窗：独立入口；场景 ["SC-101", "SC-003"]；时序 ["SEQ-101", "SEQ-003"]；功能 ["FUNC-101", "FUNC-210"]

## 核心用户路径

- `FLOW-101` 平台内人工客户联系闭环：账号登录并选定租户和业务域；运营与坐席工作台分开 → 管理员关联本租户账号与已开通坐席，并配置技能和授权号码 → 选择线索/售后/活动类型，预览校验对应必填编码后导入有效客户；形成独立批次和手机号档案 → 分配人工外呼及有效坐席，客户进入本人待联络 → 本人绑定检查后完成CTILink初始化、短期令牌、登录和媒体就绪；人工预览外呼 → 后台话务事件按enterpriseId与通话归属持久化；客户接通和双方接听分别记录 → 保存话后结果与原批次业务来源；最终话单仅校准原通话并回到批次和手机号档案 → 同一callId回查独立可用的录音/文本；按六类云域口径查询与CSV导出，无外部系统投递
- `FLOW-201` 平台租户与资源准备：超管选定供应商账号并维护租户与产品能力 → 继承线上交互创建/编辑账号并加入目标租户 → 在enterpriseId下创建坐席，确认cno及租户归属；导入能力待确认 → 在账号管理关联现有或新建坐席，列表显示开通与关联状态 → 映射本租户技能/队列，全量更新成员技能并核对逐项失败与优先级 → 号码完成开通、导入/关联后授权同供应商账号租户；导入不等于线路可呼叫
- `FLOW-202` 预外呼与IVR批次执行：按线索/售后/活动类型及对应编码提前导入客户，形成未分配客户池；导入不启动呼叫 → 创建预外呼或IVR任务，可选部分客户或先保存配置 → 后续按需把客户分配到同类型未启动任务 → 单独启动前核对名单、供应商限额、坐席/外呼组互斥和最小可用坐席；明确关闭自动启动 → type=1预测或type=2自动IVR创建；启动/继续待确认，暂停/结束按文档，在途影响待确认 → 逐次通话结果及来源快照回到任务和原客户批次；纯IVR不等待人工录音 → 从未启动且无通话的任务可删除并释放客户，已执行记录保留
- `FLOW-203` 共享号码呼入服务：号码归属唯一供应商账号并授权多个租户 → 在已验证的号码入口上配置语音导航及租户分支；导入文件成功不等于发布生效 → 来电按IVR分支锁定唯一租户 → 本租户队列按技能与坐席状态承接 → 无人/非营业/超时按本租户兜底结束 → 保存唯一租户归属及业务结果，录音/文本独立按实际可用性展示；纯IVR不承诺人工录音
- `FLOW-204` 治理与数据异常闭环：运营工作台按超管/管理员/运营分角色展示供应商账号资源、任务和坐席信息 → 坐席工作台独立承载本人客户联系与通话成效 → 按对象下钻：坐席详情分开当前/历史，管理员复用原停用确认，运营只读；不强制挂断 → 号码业务隔离保留配置，仅影响引用该号码的任务 → 恢复号码后逐任务复检，任务暂停/继续/终止独立确认 → 事件去重、通道识别和最终话单校准；证据不足保留数据异常 → 补查只更新原通话与原批次；六报表周期/累计分列并同源下钻、导出，未知及缺陷独立保留
- `FLOW-205` 既有智能外呼能力保留：账号进入智能外呼业务域，保留既有租户/账号/任务/供应商链路 → 沿用外呼列表、场景、通道、标签、拦截与原 AI 外呼执行 → 按需进入既有计费入口，依最新方案处理套餐、充值及分钟调整并留审计 → 云联络业务域租户列表不展示充值关联操作 → 保留原通话、线索及计费等统计，不迁移到 AliCti 或新增 AI 场景

## 主要数据对象

- 冻结基线未单列数据对象；按已冻结场景、字段与状态模型定位，不从功能名称反推对象。

## 交付方式

以本地静态 HTML 原型交付；业务流程图和时序交互图复用冻结基线中的自包含 HTML，并由原型交付导航统一打开。

## 上游假设与确认边界

保留上游假设的原文与状态；G3 接受风险不等于接口或业务假设已获验证。

- 本轮仅模拟原型，不发真实电话或生产接口请求。
- 厂商资源隔离、路由发布、任务在途、结果关联与媒体时间轴均待POC；未冻结。

## 范围

- In scope：["按现有26个已确认业务场景整理需求与图集，稳定编号，业务范围不新增；本轮只改分析资料，原型参照fd44dce保持不变。", "原账号/租户和双业务域权限；账号页关联已有或新建坐席，同租户同供应商账号一对一，线上表单及坐席开通标识。", "保留智能外呼全部既有功能及 SRC050 最新套餐/分钟账户；云域租户列表隐藏充值相关展示和操作。", "坐席开通、导入、技能和生命周期；供应商账号线路/号码与租户授权；已发布 IVR 联系流及租户呼入路由。", "客户管理含手机号档案、导入与分配；新批次线索/售后/活动分别必填线索编码/售后单号/活动编码；历史未分类可空来源仍保留，跨批关系独立。", "预外呼/IVR 任务各自配置、草稿、名单分配、启动、暂停、继续、终止及未启动任务删除。", "运营与坐席工作台分开，坐席下钻当前/历史分区；人工弹窗、本方结果与话后跟进闭环、独立录音文本、六类云域报表与既有审计。", "自有UI + CTILink + 本人身份后端校验；后台接收话务事件、归一与分类话单校准，未知保留待确认。", "关联系统只留空态壳，不提供接入、授权、用户映射或投递；当前G1及G2条件分析已批准，G3未批准，真实接口POC及已知实现缺陷保留。"]
- Out of scope：["接入 DCC 等外部业务系统、外部账号查询/绑定/同步、外部客户或单据查询、外部通话结果投递及失败重发。", "内嵌电话条及独立 PhoneBar 集成方案、外部业务页面改造；不把 WebRTC 误写成无需 SDK 或无需服务端。", "恢复通用呼叫方案、命名人工配置、独立运行监控或场景准备度主菜单；原人工地址仅兼容跳转。", "新增完整 CRM、把手工外部单据标识当自动对接主键、以手机号跨租户合并客户。", "AI 转人工、咨询、三方通话、监听、强插、强挂及其他未确认话务操作。", "跨供应商账号共享坐席/物理技能组/号码，跨租户共享业务任务或总部默认获取门店数据。", "生产真实拨号、购买号码或云端写配置；本地模拟成功不作为供应商支持或联调证据。", "承诺纯 IVR 录音、把业务隔离称为运营商停号、把 400 号作为外呼主叫、虚构厂商删除活动接口。", "车辆召回及召回专属字段/流程；新接口自带但当前未确认的业务能力不自动纳入。", "真实ASR来源未核验，不以合成文本或IVR事件证明转写可用；不以原型媒体播放证明云端权限和媒体联调完成。"]

## 未确认 open items 引用

- 见 `memory/open-items.md`；上游已接受风险保持原决策，不在原型 Loop 内静默改写。

## 目录结构

- `inputs/requirement-analysis/` — 已校验、只读的需求分析冻结基线
- `memory/requirement-analysis-baseline.json` — 原型侧追溯目录
- `memory/feature-list.md` — 功能事实视图
- `flowcharts/` — 从冻结图集发布的本地 HTML 交付页
- `pages/`、`js/`、`mock/` — 原型页面、交互与模拟数据

## 工作原则

- 业务事实只从冻结基线读取；范围、功能、规则或接口结论变化时回到需求分析 Loop 生成新基线。
- 原型 Loop 只补充展示、交互、Mock 和演示编排决策，并通过上游 ID 保持追溯。
- 不消费 LLM Wiki/query 正文，不沿来源引用回查知识库；新材料与事实缺口交还需求分析 Loop。

## 基础确认事实与上游状态

以下内容由冻结 project_facts 原样物化；字段中的假设、缺口或风险状态不因导入而升级。

| 事实类别 | 冻结记录 |
| --- | --- |
| 角色与职责 | {"data_scope": "当前选定供应商账号全部总部与门店；不同时混看多个供应商账号", "description": "沿用特殊内置超级管理租户及管理组，角色与管理员、运营处于同一角色层级。必须选定一个客户/品牌供应商账号，可恢复上次有效供应商账号；仅该角色可切供应商账号。可管理选定供应商账号全部总部与门店租户及资源，并保留既有全局账号资料修改权限；界面检索范围仍受当前供应商账号约束。", "name": "超级管理员", "role_code": "SUPER_ADMIN", "source_refs": ["inputs/source-index.json#SRC-301"]} |
| 角色与职责 | {"data_scope": "总部租户仅本总部；门店租户仅本门店。总部身份不自动拥有门店数据", "description": "负责本租户成员、坐席与技能、客户导入分配、任务处置、已获授权资源的业务配置。只读查看租户资料及已有全局账号资料，不能改产品授权、品牌供应商账号和AI资金；工作台监控本租户任务与坐席并从对象详情介入。", "name": "租户管理员", "role_code": "ADMIN", "source_refs": ["inputs/source-index.json#SRC-301"]} |
| 角色与职责 | {"data_scope": "当前租户及其总部/门店组织范围；不得跨租户或跨供应商账号", "description": "在已授权业务域处理本租户任务和业务数据。工作台概览只读，但保留已有任务创建、启动、暂停、继续、终止权限；客户导入/分配、账号、坐席与资源配置仍限管理员，不将“概览只读”误解为全部任务只读。", "name": "租户运营", "role_code": "OPERATOR", "source_refs": ["inputs/source-index.json#SRC-301"]} |
| 角色与职责 | {"data_scope": "个人待联络任务与本人指标；租户概览沿用已有运营权限", "description": "运营成员叠加本人坐席关联，不新增角色；运营工作台保留租户概览，坐席工作台显示个人客户联系和通话成效并在弹窗内呼叫。不得冒用其他坐席、跳过授权或抢占其他标签/设备会话。", "name": "租户运营（关联本人坐席）", "role_code": "OPERATOR", "source_refs": ["inputs/source-index.json#SRC-301"]} |
| 系统与责任边界 | {"description": "维护平台账号/租户、客户分配、来源快照、话后、统一状态与报表；演示使用独立Mock。", "name": "平台前端与业务服务"} |
| 系统与责任边界 | {"description": "enterpriseId资源范围；供应商坐席、技能、号码、任务及话单/媒体候选接口。", "name": "AliCti API"} |
| 系统与责任边界 | {"description": "自有界面的电话控制与媒体；短期sessionKey、实际状态和设备条件独立验证。", "name": "CTILink与WebRTC"} |
| 系统与责任边界 | {"description": "接收企业事件/HTTP推送、归属隔离、持久化、去重与话单回查；不自动重拨。", "name": "后台推送与补偿服务"} |
| 系统与责任边界 | {"description": "原智能外呼业务域及计费报表保留，不自动迁移。", "name": "既有AI外呼供应商"} |
| 产品结构 | {"description": "超管聚焦当前供应商账号资源与异常；管理员/运营查看租户任务与坐席负荷，各区及下钻含义明确。", "name": "运营工作台"} |
| 产品结构 | {"description": "本人客户联系在左、通话成效在右；待联络客户、临时拨号、上下线及通话弹窗，不保留第三个拨号菜单。", "name": "坐席工作台"} |
| 产品结构 | {"description": "继承原任务、名单、拦截、通道、场景、标签、记录、线索和统计；AI 租户按最新套餐与统一分钟规则计费。", "name": "智能外呼"} |
| 产品结构 | {"description": "客户档案与导入与分配两个二级菜单；号码档案持续归集，批次与每次执行分开追溯。", "name": "客户管理"} |
| 产品结构 | {"description": "预外呼、IVR 外呼、呼入服务；配置归各场景，名单来自本平台客户池。", "name": "云呼叫"} |
| 产品结构 | {"description": "保持二级目录；云域仅通话记录，AI 域保留通话记录与线索记录；外部投递菜单移除。 云域同一通话独立展示录音工具条与文本，缺失不虚构。", "name": "通话记录"} |
| 产品结构 | {"description": "AI原通话/计费/线索统计保留；云域通话总览、客户跟进、外呼任务、坐席成效、呼入服务、服务技能六类同源筛选、图表、明细、下钻与CSV。", "name": "统计报表"} |
| 产品结构 | {"description": "共享原表单与权限；账号页关联坐席并显示开通状态，充值只在 AI 域相应权限中展示。", "name": "账号与租户"} |
| 产品结构 | {"description": "仅空态入口，无系统资料、租户授权、外部账号关联或操作。", "name": "关联系统"} |
| 产品结构 | {"description": "坐席维护、坐席技能、配置记录、服务技能与租户物理组映射；不依赖外部用户候选。", "name": "坐席与联络中心设置"} |
| 产品结构 | {"description": "线路来源、号码接入、租户用号授权；超管通话数据异常与审计，不再维护接入业务系统。", "name": "线路与号码、系统管理"} |
| 状态与转换 | {"id": "STATE-201", "name": "登录工作范围", "source_refs": ["scenarios/SC-001.json", "scenarios/SC-002.json", "scenarios/SC-201.json"], "states": ["待登录", "待选租户", "待选业务域", "已进入工作范围", "资格失效"], "transitions": ["账号或手机号认证后，多租户先选一个有效租户；双能力租户再选择业务域", "换租户须退出重登；只有超管可切当前供应商账号，并复检授权", "停用账号、成员或租户/撤销域授权后拒绝继续越权操作"]} |
| 状态与转换 | {"id": "STATE-202", "name": "账号、成员与租户启停（相互独立）", "source_refs": ["inputs/source-materials/产品结构与业务流程确认基线.md", "scenarios/SC-001.json", "scenarios/SC-002.json"], "states": ["平台账号启用/停用", "当前租户成员启用/停用", "租户启用/停用"], "transitions": ["全局账号状态变更影响全部租户登录，只有超管可修改既有账号全局资料/状态", "成员启停仅作用当前租户，管理员可在本租户操作", "租户启停仅超管操作，租户管理员只读；这些状态不是AliCti坐席厂商状态"]} |
| 状态与转换 | {"id": "STATE-203", "name": "坐席开通与独立生命周期", "source_refs": ["scenarios/SC-003.json", "scenarios/SC-005.json", "scenarios/SC-101.json"], "states": ["待补充", "待同步/处理中", "已启用", "同步失败/结果待核对", "停止接收新任务", "已停用", "已删除（保留历史）"], "transitions": ["坐席由管理员在中台开通或导入；显式核验厂商最终成功后生效；账号坐席关联不以开通成功代替技能及号码检查", "批量成功项独立生效；失败项保留，管理员单独点击重新同步", "停用先禁止新任务、允许当前通话完成；厂商结果未确认时不报已停用", "恢复按当前有效配置复检，不自动恢复过期技能或历史配置", "删除先验证状态与引用，保留历史及审计；重新使用按新的创建流程处理"]} |
| 状态与转换 | {"id": "STATE-204", "name": "电话服务与话后处理", "source_refs": ["scenarios/SC-102.json", "scenarios/SC-103.json", "inputs/src055-current-scope.md"], "states": ["未服务", "服务就绪", "呼叫中/振铃", "通话中", "话后待保存", "恢复就绪", "状态未知/待核对"], "transitions": ["本人身份、麦克风、SDK 注册/签入及资源校验就绪后开启服务；同坐席多标签/设备会话不抢占", "拨号前重新校验客户、技能、号码及禁止联系规则", "通话结束后保存本次处理结果，保存失败保留输入；成功后按真实话务状态结束话后", "通话/话后未保存期间禁止退出和切换上下文；未知结果先核对，不自动重拨"]} |
| 状态与转换 | {"id": "STATE-205", "name": "预外呼/IVR任务业务状态", "source_refs": ["scenarios/SC-014.json", "scenarios/SC-015.json", "scenarios/SC-105.json", "scenarios/SC-206.json"], "states": ["草稿", "待分配客户", "待启动", "启动结果待核对", "执行中", "已暂停", "异常", "已终止", "已完成", "已删除（仅未启动）"], "transitions": ["保存草稿不占用预选客户，不可直接启动", "确认提交无客户为待分配客户，有客户为待启动；提交不自动拨号", "管理员后续分配客户后成为待启动；启动须有名单并重新校验资源", "请求已受理不等于已执行；最终确认前保留待核对，避免重复投放", "执行中可暂停新呼叫，已发起通话继续完成；暂停后资源复检通过才可继续", "终止不可继续，保留客户关联、在途结果、历史与审计，不自动释放客户", "删除仅允许从未启动、无厂商执行标识、无完成量、无通话的本地任务；客户释放为待分配，已执行不可删除"]} |
| 状态与转换 | {"id": "STATE-206", "name": "客户导入、分配与跟进", "source_refs": ["scenarios/SC-203.json", "scenarios/SC-204.json", "scenarios/SC-205.json", "scenarios/SC-206.json"], "states": ["待预览", "有效行/无效行", "已导入待分配", "已分配人工坐席/预外呼任务/IVR任务", "待联络/已呼叫", "话后待完成", "跟进完成"], "transitions": ["新建批次选择三类业务类型并校验对应必填编码；类型、名单或工作范围变更使预览失效，提交再次校验；取消不入库；只导入有效行，同批同号保留首条有效记录。历史未分类可空数据不回填或删除。", "先选客户再弹窗选外呼方式和对应执行对象；默认待分配列表不混入已分配记录", "改派前复检通话、话后、跟进完成及任务启动状态，不允许重复占用", "每次尝试回到原批次客户；接通不自动变为跟进完成，同号码不同批次不相互覆盖"]} |
| 状态与转换 | {"id": "STATE-207", "name": "号码业务隔离与恢复", "source_refs": ["scenarios/SC-008.json", "scenarios/SC-009.json"], "states": ["待开通/待关联", "可用于授权业务", "隔离处理中", "已业务隔离", "恢复处理中", "失败/待核对"], "transitions": ["导入成功不等于线路开通、关联供应商账号成功或可呼叫", "隔离冻结新外呼并将正常业务呼入转至暂停服务IVR，保留配置快照与进行中结果", "业务隔离不是运营商停机；效果必须按真实联系流和任务控制验证", "恢复核对快照与实际资源；号码恢复不自动启动已暂停任务，管理员逐项复检后恢复"]} |
| 状态与转换 | {"id": "STATE-208", "name": "通话过程、接通、跟进及媒体独立状态", "source_refs": ["scenarios/SC-019.json", "scenarios/SC-104.json", "scenarios/SC-205.json", "inputs/src055-current-scope.md"], "states": ["通话过程：待呼叫/拨号中/客户振铃/通话中/已结束", "客户接通：已接通/未接通/待确认", "结果确认：实时/待话单/已校准/证据不足/冲突", "跟进：待联系/需再次联系/已完成", "录音：待生成/可用/不适用/缺失/过期/加载失败", "文本：待生成/可用/未提供/失败（独立于录音）"], "transitions": ["按呼叫类型的客户接听事件/话单确认客户接通；坐席接听不替代客户接通", "以同次通话终态证据确认结束；单侧事件不直接认定整通结束", "结束后通过对应类型AliCti话单校准，证据不足保持待确认；迟到证据不重新开启通话", "校准复用原 callId 更新档案、批次和统计，不重复建通话、不自动重拨", "纯IVR人工录音不适用，转人工仅按实际人工阶段；录音与文本分别判定来源、权限和可用性，不以IVR轨迹/备注替代文本。", "媒体样例仅明确标记的合成记录使用，不复制到新通话，不用样例时长覆盖话单。关闭、页面切换、退出或权限失效停止并释放播放器。"]} |
| 状态与转换 | {"id": "STATE-209", "name": "智能外呼服务状态", "source_refs": ["inputs/src055-current-scope.md", "inputs/source-index.json#SRC-050"], "states": ["未开通", "待生效", "有效", "已过期"], "transitions": ["套餐开通保存实际服务区间与统一分钟；租户启停不直接改服务状态", "有效商用叠加话费包只增加分钟，不延期", "时长/分钟手工调整分别记录原因和前后值，冻结分钟不受调整"]} |

## 完整冻结输入入口

路径相对于原型项目根目录。结构化事实约束实现，Markdown/HTML 用于对照确认与图集复用；本记忆摘要不替代这些入口。

| Entry | Role | Frozen Path |
| --- | --- | --- |
| business_rules | business_fact | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/memory/business-rules.json |
| business_scenario_atlas | review_view | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/outputs/business-scenario-atlas.html |
| feature_list | product_fact | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/memory/feature-list.json |
| feature_list_view | review_view | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/outputs/feature-list.md |
| interaction_sequence_atlas | review_view | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/outputs/interaction-sequence-atlas.html |
| interface_index | external_dependency_fact | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/interfaces/interface-index.json |
| interface_verification_matrix | review_view | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/outputs/system-sequence-interface-verification-matrix.md |
| normalized_user_stories | business_fact | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/memory/normalized-user-stories.json |
| open_items | risk_fact | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/runtime/open-items.json |
| page_index | prototype_planning_fact | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/planning/page-index.json |
| page_planning | review_view | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/outputs/menu-and-page-planning-reference.md |
| page_structure_atlas | review_view | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/outputs/page-structure-atlas.html |
| product_baseline | review_view | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/outputs/product-structure-and-business-process-baseline.md |
| project_facts | business_fact | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/memory/project-facts.json |
| scenario_index | business_fact | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/scenarios/scenario-index.json |
| sequence_index | interaction_fact | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/sequences/sequence-index.json |
| traceability | trace_fact | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/runtime/traceability.json |
| verification_report | verification_evidence | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/runtime/verification-report.json |

## 场景与交互时序定位

S6/S7/S8 按相关 ID 读取下列冻结明细与图集，落实消息顺序、回调和异常分支；不是只发布图页。

| ID | Name | Scenario | Frozen Detail |
| --- | --- | --- | --- |
| SC-001 | 超级管理员进入供应商账号并启用租户联络中心能力 | SC-001 | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/scenarios/SC-001.json |
| SC-002 | 创建或复用中台登录账号并加入租户 | SC-002 | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/scenarios/SC-002.json |
| SC-003 | 在中台开通供应商坐席 | SC-003 | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/scenarios/SC-003.json |
| SC-005 | 联络中心身份停用、恢复与删除 | SC-005 | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/scenarios/SC-005.json |
| SC-006 | 创建逻辑技能模板与租户物理技能组 | SC-006 | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/scenarios/SC-006.json |
| SC-007 | 为坐席分配多个技能组和技能等级 | SC-007 | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/scenarios/SC-007.json |
| SC-008 | 接入AliCti或外部线路号码并授权租户 | SC-008 | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/scenarios/SC-008.json |
| SC-009 | 隔离号码业务并处理关联业务 | SC-009 | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/scenarios/SC-009.json |
| SC-011 | 配置共享呼入号码、IVR 分流和租户人工路由 | SC-011 | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/scenarios/SC-011.json |
| SC-014 | 创建、配置与启动预外呼任务 | SC-014 | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/scenarios/SC-014.json |
| SC-015 | 创建、配置与启动IVR外呼任务 | SC-015 | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/scenarios/SC-015.json |
| SC-016 | 复用现有智能外呼中台执行 AI 外呼 | SC-016 | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/scenarios/SC-016.json |
| SC-017 | 客户呼入、IVR 导航与人工接听 | SC-017 | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/scenarios/SC-017.json |
| SC-018 | 呼入排队、拒接、客户匹配和非服务时间分支 | SC-018 | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/scenarios/SC-018.json |
| SC-019 | 通话结果归集与最终话单校准 | SC-019 | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/scenarios/SC-019.json |
| SC-020 | 分业务域查看统计报表与操作审计 | SC-020 | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/scenarios/SC-020.json |
| SC-101 | 在账号管理关联现有或新建坐席 | SC-101 | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/scenarios/SC-101.json |
| SC-102 | 开启或结束本人 WebRTC 电话服务 | SC-102 | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/scenarios/SC-102.json |
| SC-103 | 在坐席工作台完成人工外呼与话后处理 | SC-103 | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/scenarios/SC-103.json |
| SC-104 | 回查原生外呼结果并纳入既有统计 | SC-104 | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/scenarios/SC-104.json |
| SC-105 | 分别使用运营工作台和坐席工作台 | SC-105 | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/scenarios/SC-105.json |
| SC-201 | 选择登录租户及业务域 | SC-201 | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/scenarios/SC-201.json |
| SC-203 | 按业务类型导入客户并关联号码档案 | SC-203 | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/scenarios/SC-203.json |
| SC-204 | 按外呼方式分配或改派客户 | SC-204 | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/scenarios/SC-204.json |
| SC-205 | 回查客户档案与导入批次的执行结果 | SC-205 | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/scenarios/SC-205.json |
| SC-206 | 删除从未启动的外呼任务 | SC-206 | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/scenarios/SC-206.json |
| SEQ-001 | 超级管理员进入供应商账号并启用租户联络中心能力时序 | SC-001 | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/sequences/SEQ-001.json |
| SEQ-002 | 创建或复用中台登录账号并加入租户时序 | SC-002 | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/sequences/SEQ-002.json |
| SEQ-003 | 在中台开通供应商坐席时序 | SC-003 | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/sequences/SEQ-003.json |
| SEQ-005 | 联络中心身份停用、恢复与删除时序 | SC-005 | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/sequences/SEQ-005.json |
| SEQ-006 | 创建逻辑技能模板与租户物理技能组时序 | SC-006 | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/sequences/SEQ-006.json |
| SEQ-007 | 为坐席分配多个技能组和技能等级时序 | SC-007 | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/sequences/SEQ-007.json |
| SEQ-008 | 接入AliCti或外部线路号码并授权租户时序 | SC-008 | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/sequences/SEQ-008.json |
| SEQ-009 | 隔离号码业务并处理关联业务时序 | SC-009 | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/sequences/SEQ-009.json |
| SEQ-011 | 配置共享呼入号码、IVR 分流和租户人工路由时序 | SC-011 | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/sequences/SEQ-011.json |
| SEQ-014 | 创建、配置与启动预外呼任务时序 | SC-014 | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/sequences/SEQ-014.json |
| SEQ-015 | 创建、配置与启动IVR外呼任务时序 | SC-015 | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/sequences/SEQ-015.json |
| SEQ-016 | 复用现有智能外呼中台执行 AI 外呼时序 | SC-016 | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/sequences/SEQ-016.json |
| SEQ-017 | 客户呼入、IVR 导航与人工接听时序 | SC-017 | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/sequences/SEQ-017.json |
| SEQ-018 | 呼入排队、拒接、客户匹配和非服务时间分支时序 | SC-018 | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/sequences/SEQ-018.json |
| SEQ-019 | 通话结果归集与最终话单校准时序 | SC-019 | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/sequences/SEQ-019.json |
| SEQ-020 | 分业务域查看统计报表与操作审计时序 | SC-020 | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/sequences/SEQ-020.json |
| SEQ-101 | 在账号管理关联现有或新建坐席时序 | SC-101 | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/sequences/SEQ-101.json |
| SEQ-102 | 开启或结束本人 WebRTC 电话服务时序 | SC-102 | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/sequences/SEQ-102.json |
| SEQ-103 | 在坐席工作台完成人工外呼与话后处理时序 | SC-103 | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/sequences/SEQ-103.json |
| SEQ-104 | 回查原生外呼结果并纳入既有统计时序 | SC-104 | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/sequences/SEQ-104.json |
| SEQ-105 | 分别使用运营工作台和坐席工作台时序 | SC-105 | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/sequences/SEQ-105.json |
| SEQ-201 | 选择登录租户及业务域时序 | SC-201 | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/sequences/SEQ-201.json |
| SEQ-203 | 按业务类型导入客户并关联号码档案时序 | SC-203 | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/sequences/SEQ-203.json |
| SEQ-204 | 按外呼方式分配或改派客户时序 | SC-204 | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/sequences/SEQ-204.json |
| SEQ-205 | 回查客户档案与导入批次的执行结果时序 | SC-205 | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/sequences/SEQ-205.json |
| SEQ-206 | 删除从未启动的外呼任务时序 | SC-206 | inputs/requirement-analysis/ra-alicti--5706c147e80c7271/sequences/SEQ-206.json |
