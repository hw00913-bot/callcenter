# 版本与变更记录

版本 2026-09-24-business-category-fields-1 · 2026-09-24

2026-09-28 话后操作位置调整：“保存并完成”与符合整理态条件时的“延长整理时间”移至填写弹窗顶栏，紧邻“收起”，始终可见；表单内容独立滚动，底部不再重复放置操作。原有保存校验和延长整理接口条件不变。

2026-09-28 坐席填写弹窗精简：移除重复的“沟通记录”标题、操作说明与“填写内容已自动暂存”常驻提示。备注、处理结果和业务字段继续自动暂存；只有会话暂存失败时，在沟通备注旁提示且保留当前输入。正式保存仍在话后按原规则确认。

2026-09-24 交互补充：联系客户先在页面中央确认并发起呼叫，拨号与振铃阶段继续显示呼叫状态；坐席接通后自动打开居中填写弹窗，未接通而结束时进入话后结果确认。手动收起和切页保留同一通话草稿，可从电话工具条重开。此现行交互更新了 D-038、D-058 历史阶段关于拨号期填写和右侧非模态面板的描述，不改变其原始变更记录。

本版 D-085：业务分类直接关联独立字段库，取消业务模板实体；分类的有序fields引用逐项配置显示与必填，线索分类直接含六项预置字段，原型不兼容旧模板存储。D-074/D-077三层关系保留历史。上一版业务文档：2026-09-23-supervisor-event-history-1。D-084：班长坐席事件按平台接收/观察时间倒序；页签仅预览最近5条，“查看全部事件”进入分页二级页。列表只保留时间、坐席/工号、事件或状态和来源。静态原型仅有当前浏览器演示记录，并非全租户实时采集；生产历史须本方后端订阅及回调汇总、鉴权持久化并提供分页查询。API-316提供企业事件订阅、API-315 type=9仅证明推送可配置、DOC-344仅提供当前状态。D-083任务默认导航和预测阈值、D-082离线只读班长监控继续适用。

版本说明和变更记录继续合并在本页。D-085业务分类直接引用独立字段库为现行规则；D-074/D-077的三层关系只保留为历史。D-076普通坐席退出保留电话绑定和D-075任务字段对齐继续适用。D-073原任务ID编辑与回查规则经D-075补齐自动任务通用字段入口。D-072坐席登录和D-071在线切换继续适用。D-078取代D-069/D-070中任务级固定号码分支；D-070的多导航目录与任务单选现由D-083固定默认导航自动带入取代，客户等待时间继续适用；号码池来源与管理由D-081更新。D-068替代D-036/D-040的同账号多业务租户、D-046的号码租户分配及相关共享资源口径；未变更的权限和历史规则继续适用。D-032曾采用新建任务再次联系，现由D-060原任务追加名单取代。历史条目保留当时背景，批量坐席查证以D-051、两类断线处理以D-052、预测异步识别以D-053、呼入接听与识别适用范围以D-054为准；D-049队列计数、D-050重建及其他仍有效决定继续适用。


本页保留已编号变更的原始历史：D-001、D-003～D-085。原始资料未分配 D-002 编号；D-001 后的“冻结需求分析基线”保持原始未编号标题，不补造决策号。早期条目沿用[项目决策原文](decisions.md)；逐次修复与发布经过另见[原始实施流水](../memory/change-log.md)。旧决定与本版冲突时，以最新条目说明的现行范围为准。

## 文档维护范围

按用户要求取消独立开发交付包，删除ZIP、重复生成的模型、契约、任务、验收清单及相关生成依赖。保留现有原型、Mock、功能说明、附表、字段清单、待确认事项、流程时序和蓝图；供应商官方快照与回复原件移至 references，内容保持不变。
原开发交付入口保留原URL，改为[开发阅读指引](development.html)，开发按任务读取相关材料。[原始参考资料](../references/README.md)只按引用编号查看。原型定向回归与本版文档检查分别留证，不将演示或本地测试等同真实供应商联调。

## 本版变化

| 本版修改 | 规则概览 |
|---|---|
| [D-085 业务分类直接配置独立自定义字段](#D-085-业务分类直接配置独立自定义字段) | 分类在同一页面直接引用独立字段库，按有序fields配置显示和必填；取消业务模板实体与选择，线索分类须含六项预置字段。原型不迁移旧模板；供应商接口无新增字段。 |
| [D-084 班长坐席事件预览与全部事件查询](#D-084-班长坐席事件预览与全部事件查询) | 事件页签最近5条倒序预览；全部事件在二级页每页10条查看。列表保留时间、坐席/工号、事件或状态、来源；原型只有当前浏览器演示记录，生产全量历史由本方后端订阅及回调汇总、持久化并分页查询。 |
| [D-083 预测任务座席阈值与默认外显导航](#D-083-预测任务座席阈值与默认外显导航) | 预测任务阈值默认10、范围1–10；不足自动暂停。仅设置定时开始且因此暂停的任务在人数恢复时自动启动。每enterpriseId固定一个线下提供的默认导航标识，任务自动带入；自动恢复和唯一性待联调。 |
| [D-082 班长监控离线只读能力与二级事件日志](#D-082-班长监控离线只读能力与二级事件日志) | 本租户ADMIN未关联本人坐席或未上线时可查看本租户今日已结束外呼统计、逐工号只读坐席状态和已有事件日志；队列实时状态与管理操作仍须关联有效班长坐席、本人上线和班长授权。事件日志移入班长监控二级页签。 |
| [D-081 租户号码池管理与任务引用](#D-081-租户号码池管理与任务引用) | 按当前租户关联的enterpriseId查询并维护AliCti号码池；支持获取、新增、删除、更新四接口契约。预外呼与自动外呼只选择本租户池名，静态原型模拟请求和回执，不发真实写请求；全部历史变更记录继续保留。 |
| [D-080 班长坐席事件日志](#D-080-班长坐席事件日志) | 历史阶段建立事件来源与观察口径；当时的“原型日志不超过15条”已由D-084取消，现有交互生成的记录不按演示数量截断。 |
| [D-079 新增弹窗误触遮罩保护](#D-079) | 已修改但未保存的新增和编辑表单误点遮罩时先确认继续填写或放弃；空白表单直接关闭，既有专用保护不重复提示。 |
| [D-078 任务外显配置按接口字段纠偏](#D-078) | API-311/API-404没有任务级指定号码字段，API-312逐客户clid只属于名单行；该阶段导航显式单选规则已由D-083固定默认导航自动带入取代。 |

D-085取代D-074/D-077的分类→模板→字段三层关系；字段定义及业务编码保留。D-084精简坐席事件列并区分供应商订阅、状态快照与本方历史存储；D-080/D-082的来源和离线只读范围仍有效。D-083以单值默认外显导航取代D-070多导航目录；预测任务的座席不足自动暂停有API依据，定时自动恢复为用户转述供应商业务口径并列CF-18待联调。D-082将班长监控的只读查看与队列实时操作分别设门禁，D-080事件来源和去重规则不变。D-081补齐号码池管理和本租户池目录；D-078将任务外显配置缩至API-311/API-404支持的导航、可选号码池和客户等待时间；API-312的逐客户clid不属于任务字段。D-069/D-070任务级固定号码分支和D-070多导航目录均仅作历史记录。

## 演示与验收路径

1. 打开新增业务分类，未输入时点击弹窗外侧可直接关闭；输入后误点外侧出现二次确认，“继续填写”保留原输入，确认放弃才关闭。
2. 在业务分类中添加字段引用后返回，父级未保存的分类内容仍受保护；AliCti账号等已有专用确认的表单只显示一次确认。
3. 新建预外呼和自动外呼任务，确认外显导航自动带入当前enterpriseId的固定默认标识，界面没有导航选择或维护；账号缺标识时阻断创建，号码池仍可选。
4. 由本租户管理员在号码池管理查询、新增、更新和删除本租户号码池；新建后通过更新添加号码，写入后重查列表。预外呼与自动外呼任务仅从当前租户关联enterpriseId的池列表选择名称，并可设置客户接听等待时间。
5. 核对创建确认、查看管理、编辑、复制和原任务再次联系：默认导航及号码池保存值一致，任务请求不包含固定号码。预测任务阈值1/10及默认10均按接口范围校验；autoStart=1且座席不足暂停后人数恢复达阈值才自动启动，手工暂停、号码停用、结束不自动恢复；自动外呼没有阈值。
6. 名单导入不从任务或批次自动赋clid；若逐客户显式提供完整号码，按API-312名单字段处理，导航同传优先关系仍待CF-15。
7. 切换租户后核对池列表与任务候选不混入其他enterpriseId；失败、默认池限制和任务引用保护保留原值。
8. 本租户ADMIN未关联本人坐席或班长本人未上线时打开“班长监控”，在“监控概览”查看今日已结束外呼统计与只读坐席状态；切换“坐席事件日志”二级页签，核对最近5条按平台接收/观察时间倒序预览；点“查看全部事件”进入分页二级页。重复刷新不新增同状态事件，切换租户不带出原租户记录；初始为空，交互生成的记录不截断。
9. 未关联有效班长坐席或未上线时队列实时状态和管理置忙、置闲、下线不可用；先关联有效班长坐席，再由本人上线并确认供应商班长资格与本租户授权队列后可用。只读状态的逐工号查询不触发queueStatus或Monitor写请求。

[预外呼任务](functional-spec.html#FS-08) · [字段边界](field-alignment.html#FA-196) · [开发阅读指引](development.html)

## 实施与边界

| 对象 | 当前规则 |
|---|---|
| 坐席退出 | 普通退出固定logoutMode=1、removeBinding=0，AliCti侧坐席与接听分机绑定及本地分机配置保留；不显示解绑选项。API-304支持removeBinding=1仅作官方能力记录。 |
| 坐席登录 | 点击坐席登录直接打开单一面板：每次工作模式初始未选，须当次单选0预览与预测同时、4预览外呼或5预测外呼；状态默认置闲，可改置忙，置忙原因选填。点击登录直接调用Agent.login，不先保存设置；取消无请求，失败保留本次输入。旧偏好不自动选择模式；bindType=3仍由平台统一提供。 |
| 工具条在线切换 | 登录后工具条直接显示工作模式下拉，不收入更多菜单；选择后即时调用CTILink.Agent.changeWorkingMode（单值必选）。置忙可切换；通话、振铃、话后整理及未知结果期间拒绝切换并保留原模式；失败保留原模式。 |
| 模式互斥 | 模式4不再接受预测外呼分配，模式5禁用预览外呼入口（按钮禁用并提示）。呼入不受工作模式限制是本地假设，登记CF-16待供应商确认；任务callStrategy及队列strategy与坐席workingMode独立。 |
| 守卫与证据 | 切换前核对当前阶段与请求结果；失败、未知均保留原模式且不重放写请求。断线重登保留当前会话模式与暂停状态，区别于普通登录。changeBindTel维持不开放。验证以本轮坐席登录回归为准。 |
| 账号与租户 | enterpriseId关联0或1个总部/门店业务租户，内置超级租户不计入。tenantId及enterpriseId分别保存，登录账号可按成员授权加入多个租户。 |
| 号码归属 | 导入默认归属账号唯一业务租户；无有效业务租户不能导入。无号码租户分配与三类嵌套入口，仍保留状态、用途和租户权限检查。 |
| 号码池管理 | 租户管理员按本租户关联enterpriseId读取、创建、更新、删除AliCti号码池；默认池和容量遵守官方限制。静态原型只模拟四接口请求与结果，真实接入须服务端鉴权及回查。 |
| 班长监控 | 本租户ADMIN即使未关联本人坐席或未上线，也可在“监控概览”查看今日已结束外呼统计及按enterpriseId、原cno逐席查询的只读状态，平台再过滤tenantId授权范围；“坐席事件日志”二级页签预览最近5条，“查看全部事件”在分页二级页只读查看已采集历史。队列实时状态、排队实况和Monitor管理操作须关联有效班长坐席、本人上线、供应商班长资格及授权队列均确认。 |
| 统计范围 | 当前所选账号仅统计唯一业务租户，不新增跨账号汇总。后续授权跨账号线索汇总须用brandId+完整线索编码；当前不合并未授权数据。 |
| 客户档案 | 列表删除固定线索/意向列；动态字段按业务分类直接引用字段库在详情展示。导入与分配记录只读，没有查看批次操作；独立导入与分配菜单保留。 |
| 未知结果 | 客户档案和通话记录的结果未知是已有UNKNOWN的展示文案，不是新增接口状态，也不等于未接通。 |
| 任务列表 | 不显示内部执行配置名、V1或缺乏依据的后续重呼。有无下一次安排不从hasNextAttempt、任务状态或单条话单finishRetryFlag推断。 |
| 任务设置 | 两类新建任务自动带入当前enterpriseId固定默认外显导航，号码池从当前租户关联enterpriseId的列表选名称，可填客户等待时间；预测任务才设置最小可用座席数，默认10、范围1–10。API-311/API-404无任务级固定号码字段。已建自动任务名称、描述和标签按API-404差量更新并以DOC-334回查。逐客clid只在名单行显式提供时可选，不由任务或批次推导；自动任务IVR编辑列CF-17待确认，通话详情摘要只读。 |
| 本通话单 | 人工、预测、自动、呼入分别按API-317/318/362/319读取。客户与坐席接听、客户与双方时长、呼入系统应答与首次人工接听分别展示，秒只转换一次。 |
| 任务关联 | 同账号、租户、通话类型和明确任务ID一致才展示关联任务只读设置；本地/供应商任务ID冲突不改绑其他任务、不开放再次联系操作。 |
| 缺失与来源 | 已有接口来源却缺少raw或字段、或来源不可用时，不以旧本地时间/工号/时长补接口事实；真实0秒保留。没有接口来源的纯本地演示仍按本地来源展示。队列取话单qno/firstCallQno，不从技能关系倒推，不展示虚构IVR节点和版本。 |
| 再次联系 | D-060继续适用：只向原任务追加名单批次和执行条目，保留原任务ID及通话。新预测任务名单耗尽暂停，已结束任务不重开。 |
| 业务配置入口 | 客户管理仅显示业务分类菜单；分类直接引用独立字段库，以数组位置确定顺序，逐项配置显示和必填。取消模板实体，不增加供应商接口字段。 |
| 交付范围 | 继续维护一套原型、正式说明、图集与原始参考资料；开发按阅读指引选读。独立开发包与ZIP保持取消；发布目标为feat-test / Demo，实际状态以GitLab提交历史为准。 |

## 文档入口

| 内容 | 入口 |
|---|---|
| 功能说明 | [完整功能说明](functional-spec.html) |
| 规则与字段 | [附表](interaction.html) / [字段级对齐](field-alignment.html) |
| 流程与架构 | [业务流程](../flowcharts/business-process.html) / [时序图](../flowcharts/sequence-interaction.html) / [系统蓝图](../related-systems/index.html) |
| 待确认 | [待确认与接入准备](remaining-confirmations.html) |
| 开发阅读 | [开发阅读指引](development.html) / [原始参考资料](../references/README.md) |

## 本版数量与边界

| 项目 | 数量 |
|---|---|
| 保留功能编号 | 82 |
| 保留页面规划 | 47 |
| 字段映射 | 218 |
| 附表规则 | 454 |
| 官方文档快照 | 101 |
| 供应商确认主题 | 9 |
| 接入准备类别 | 3 |

references 保留供应商回复原件与既有101份官方快照；本版另增AliCti号码池四接口的紧凑官方摘录及源URL，不改原快照数量和内容。异常定义表与Excel未新增类型，保持原版本。

## 检查与发布状态

本版补充D-085业务分类直接关联独立字段库并移除业务模板，D-074/D-077三层关系仅作历史。[本轮业务分类原型与文档回归](../qa/business-category-direct-fields-regression-20260924.json)记录离线原型64套零失败、业务分类专项11/11、浏览器可见检查零失败，以及文档661项与3743个链接通过。上一版D-084坐席事件预览、全部事件分页与接口边界及D-083预测任务座席阈值与固定默认外显导航、D-082班长监控离线只读能力、D-081号码池四接口、D-080事件来源及D-078任务外显字段边界继续适用。[上一轮坐席事件原型回归](../qa/supervisor-event-history-regression-20260923.json)记录离线64套零失败、事件专项75项通过、浏览器空态与操作后事件展示，以及文档661项与3733个链接通过；普通坐席越权由专项离线检查覆盖。本地验证不作为真实供应商联调证据。[上一版原型与文档回归](../qa/prototype-document-regression-20260923.json)、D-076坐席普通退出、D-075任务字段对齐与CF-17边界及更早报告保留为各自历史证据。
本版发布目标为[feat-test / Demo](http://gitlab.chebaba.com/ai-call-center/ai-pipeline-factory-docs/-/tree/feat-test/Demo)，实际发布状态以[GitLab提交历史](http://gitlab.chebaba.com/ai-call-center/ai-pipeline-factory-docs/-/commits/feat-test)为准。

## 修改清单

以下保留历次变更；旧条目的“当前处理”表示该次修改时的处理，本版变化优先。

## D-085 业务分类直接配置独立自定义字段

修改前：业务分类需先关联业务模板，再通过模板引用独立字段。现有分类与模板基本一对一，增加了创建、关联和启停操作。

当次处理：客户管理仍只保留“业务分类”菜单；取消业务模板实体及其维护入口。分类直接保存有序`fields`数组，每项仅保存稳定`fieldId`、`enabled`和`required`；数组位置决定显示顺序，`required`默认`false`，隐藏字段不参加必填校验。分类可零字段，线索分类必须直接包含六项预置统计字段；不同分类可共用字段定义并分别配置显示与必填。字段与选项选填`businessKey`只用于本地业务映射，导入分类、通话记录、客户档案和线索统计的现行规则继续适用。

接口边界：分类、字段库和业务编码都是本方平台配置，不新增AliCti入参或供应商实体。本项目仅为原型，不迁移或兼容旧模板存储。D-074/D-077当时的分类→模板→字段关系保留历史，不作为当前开发依据。

核对重点：新建/编辑分类不再出现模板名称、模板选择或模板启停；同分类重复fieldId及跨租户引用拒绝保存，线索分类六项预置字段保留稳定ID、类型与统计语义；草稿可缺必填，正式保存按当前分类配置校验；不同分类共用字段时显示与必填相互独立，AliCti请求不含本地业务编码。

本轮回归：[业务分类原型与文档核验记录](../qa/business-category-direct-fields-regression-20260924.json)显示离线原型64套零失败、业务分类专项11/11通过；浏览器核对分类直接关联、字段新建、顺序、显隐、必填和遮罩保护均通过，文档661项与3743个链接通过。本地演示验证不代表供应商联调。

## D-084 班长坐席事件预览与全部事件查询

修改前：班长监控“坐席事件日志”页签直接展示全部演示记录，固定显示“状态变化”和“说明”两列；页面没有独立的全部事件分页入口，容易把演示记录误读为供应商实时事件。

当次处理：事件页签按平台接收/观察时间倒序预览最近5条，点击“查看全部事件”打开独立二级页面倒序分页；静态原型只展示当前浏览器演示记录，生产才查询后端汇总的本租户授权事件。主列表仅保留时间、坐席姓名与原字符串工号、事件或当前状态、来源。删除固定“状态变化”和“说明”列；目前供应商资料没有统一提供每种事件的前态、说明、发生时间或去重键，不能将推测值当作接口字段。明确的连接回调、成功操作回执和状态快照差异按各自来源标注；快照差异只能称“观察到的变化”。

接口边界：API-316支持企业WebSocket `/user/agent`订阅，默认可接收全企业坐席事件，却没有历史查询接口或统一消息体字段；API-315 `type=9`只说明可配置座席状态变更推送，不提供可直接用于列表的统一载荷；DOC-344 `agentStatus/get`只返回当前坐席状态。生产“全部事件”应由本方后端鉴权订阅、汇总回调/操作回执，按`enterpriseId`、`tenantId`及原`cno`授权过滤、去重、持久化并提供分页查询。静态原型事件列表初始为空，只保存当前浏览器内本地接口模拟操作、回调或快照观察产生的演示记录；跨设备不会汇总，也非全租户实时采集，后续记录不因演示数据上限截断。D-080/D-082历史原文保留，离线只读及管理门禁继续适用。

核对重点：页签最近5条和全部事件页的排序口径一致；二级页每页10条，不因刷新或重复状态生成假事件；列表无前态/说明虚构列，时间明确是平台接收/观察时间；普通坐席、跨租户和未授权工号无访问权。供应商推送载荷、时间和去重语义仍待真实联调。

说明与接口：[FS-12](functional-spec.html#FS-12)、[G-64](interaction.html#G-64)、[FA-218](field-alignment.html#FA-218)；API-316、API-315、DOC-344、API-304。

本轮回归：[原型与文档核验记录](../qa/supervisor-event-history-regression-20260923.json)。离线64套与事件专项75项均通过；本地HTTP浏览器核对空态、全部事件二级页及返回、模拟登录产生事件后两处同步展示。控制台无错误，普通坐席越权由专项离线测试覆盖；本轮不证明真实AliCti推送、历史接口或跨设备汇总已接入。

## D-083 预测任务座席阈值与默认外显导航

修改前：预测任务已有最小可用座席数字段，但界面文案没有说明低于阈值自动暂停及定时任务恢复的边界；账号可本地维护多个外显导航，任务需要显式选择一个。

当次处理：预测任务`minAvailableAgentCount`默认10、整数1–10，任务内可用座席数低于阈值自动暂停。仅`autoStart=1`且确为座席不足自动暂停的任务，在可用人数恢复到不少于阈值时自动启动；手工暂停、号码停用保护暂停、已结束任务不因人数恢复启动。自动外呼不显示或提交该字段。同一`enterpriseId`统一使用一个默认外显导航，固定标识由AliCti线下提供、自建系统按账号单值管理；账号不维护多导航目录，任务不选择导航，创建时自动带入`customerClidsCategory=5`及当前账号的`customerClidsGroup`，号码池仍从本账号列表选填。缺少默认标识时阻断新任务；已建任务的标识快照和原`taskId`保持。启动/继续时若旧任务保存标识与当前账号默认值不同，须先阻断，再从原任务编辑以API-404 `task/update`提交新标识，经DOC-334 `task/get`核对同一`taskId`和可回读值成功后才能启动；编辑期间默认值变化则拒绝过期提交、保留输入并重开核对。

依据边界：API-311/API-404明确阈值默认10、范围1–10、低于阈值自动暂停，以及`autoStart=1`的定时开始字段；两份官方原文均未明说人数恢复后自动启动，也未证明供应商侧每账号默认导航唯一。后两项来自用户转述AliCti技术答复，源记为SRC-111；自动恢复的触发、暂停原因与`task/get`回查见CF-18，默认标识有效性及唯一性见CF-15。原型仅演示规则，不宣称真实供应商联调通过。D-070多导航登记与任务单选是历史阶段设计，当前由D-083取代；D-078取消任务级固定号码、D-081号码池管理继续适用。

核对重点：同账号两类任务自动带入同一默认标识，切换账号不混用；界面没有多导航维护或选择器，缺标识阻断新建。旧任务导航快照不回填，默认值变化后先更新原任务、回查同一任务成功才启动；编辑期间默认值再变则阻断。预测阈值默认10、1和10可保存、越界拒绝；低于阈值暂停，只有设置定时开始且暂停原因是座席不足才在恢复达阈值时自动启动，其他暂停和结束不恢复。自动外呼没有该字段，号码池仍可选。任务中心折叠的“演示座席人数变化”只在本地演示预外呼运行/暂停任务中展示，输入观察人数仅模拟状态变化，不读取实时人数或执行供应商任务操作。

说明与来源：[FS-08](functional-spec.html#FS-08)、[FA-197](field-alignment.html#FA-197)、[FA-217](field-alignment.html#FA-217)、[C-86](interaction.html#C-86)；API-311、API-404、DOC-334、DOC-338；SRC-111为用户转述供应商技术答复。

## D-082 班长监控离线只读能力与二级事件日志

修改前：班长监控把查看本租户今日外呼统计、坐席当前状态、队列实况和管理操作一并要求班长本人上线；坐席事件日志直接置于监控主视图，查看路径较长。

当次处理：本租户ADMIN进入坐席工作台“班长监控”后，即使本人未关联坐席或电话未上线，也可查看本租户今日已结束外呼统计与只读坐席当前状态；只读状态按当前`enterpriseId`及目标原字符串`cno`逐席使用`agentStatus/get`，再由平台按`tenantId`授权范围过滤，查询频率由后台控制。班长监控下设“监控概览／坐席事件日志”二级页签；已有事件日志可只读查看，仍按D-080保留事件来源、本地观察时间、同状态去重和本租户范围。队列实时状态、排队实况与管理置忙、置闲、下线仍须关联有效班长坐席、本人上线、供应商班长资格和本租户授权队列均核验通过；只读权限不触发`queueStatus`或`Monitor`写操作。

依据边界：`agentStatus/get`是按企业签名及逐工号取得坐席状态的服务端接口，`queueStatus`和`Monitor`是另行要求班长权限的工具条能力。今日统计、租户过滤、后台限频、二级页签和离线日志查看属于本方产品规则；本轮没有供应商关于这些产品行为的新答复，也不把状态快照差异说成已接收type=9事件推送。静态原型仍须真实服务端鉴权、状态回读和后端频率控制才能生产接入。

核对重点：未关联本人坐席或未上线的本租户ADMIN可看到统计、授权坐席只读状态和已有日志，并提示先关联班长坐席才能使用队列实况与管理。关联有效坐席、本人上线且班长授权确认后才开放队列与管理；普通坐席、跨租户、伪造工号均不可借只读入口越权。二级页签切换保留本人通话草稿，日志重复刷新不增加同状态事件。

说明与来源：[FS-12](functional-spec.html#FS-12)、[G-12](interaction.html#G-12)、[FA-177](field-alignment.html#FA-177)；DOC-344、API-304、DOC-395。D-080及此前历史变更保持原条目。

## D-081 租户号码池管理与任务引用

修改前：任务设置虽支持`clidPoolList[].name`，却没有查询或维护本租户号码池的入口；旧D-069/D-070阶段性规则还排除本地号码池管理，预外呼任务无法可靠取得可选池名。

当次处理：按当前租户唯一关联的`enterpriseId`查询AliCti号码池，并由本租户管理员维护。对接`/interface/v10/hybridGroup/list`、`create`、`delete`、`update`四接口的请求、结果和限制；超级管理员仅在已授权账号范围内维护。账号/租户切换后重新读取池目录，不沿用上一租户选择。预外呼及自动外呼任务的`clidPoolList[].name`只取本账号查询到的池名，`priority`仍手填可空整数、越小越优先；任务传名称，不传号码池`groupId`。本地号码列表不能充当供应商池。静态原型只模拟四接口契约，不发真实AliCti请求，也不保存生产鉴权密钥。

接口限制：列表按鉴权账号返回`id/name/numbers/type/isDefault/comment/createTime`，无业务分页参数。创建需同企业唯一`name`、`type`和`isDefault`，`comment`可选；成功回执不含池ID，创建后须更新才能加入号码，并重查列表。删除按`groupId`；官方失败示例显示使用中的默认池不能删除。更新按`groupId`、唯一`name`、`numbers`逗号串和`isDefault`提交；空串清空号码，`comment`省略不更新，不能通过更新改变`type`；企业未另设上限时号码少于500条，默认池不能改名或取消默认。写入后查询核对；删除前另核本租户任务引用。四接口均使用v10鉴权参数，本项目使用`validateType=2`和当前`enterpriseId`。池实际选号、空池、同优先级、运行任务中的变更生效时点及本地停用排除仍列CF-15待联调。

核对重点：租户管理员可完成查询、新增、更新、删除的完整演示；两个任务类型只见本租户池，切换租户、池改名或删除后的候选及时变化；接口失败保留原值，默认池限制明确，历史任务和通话记录不被改写。D-069/D-070旧的“不新增号码池管理”语句保留作历史，不再作为现行约束；D-001、D-003～D-080全文继续保留。

说明与来源：[FS-06](functional-spec.html#FS-06)、[FS-08](functional-spec.html#FS-08)、[FA-198](field-alignment.html#FA-198)、[规则附表C-74](interaction.html#C-74)；[获取号码池列表](https://wiki.alicti.cn/html/wiki/API/号码池管理/获取号码池列表接口.html)、[新增号码池](https://wiki.alicti.cn/html/wiki/API/号码池管理/新增号码池接口.html)、[删除号码池](https://wiki.alicti.cn/html/wiki/API/号码池管理/删除号码池接口.html)、[更新号码池](https://wiki.alicti.cn/html/wiki/API/号码池管理/更新号码池接口.html)。

## D-080 班长坐席事件日志

修改前：班长监控只显示刷新后的坐席状态，没有状态变化和连接异常的可回看记录。

当次处理：本租户班长页增加坐席事件日志，记录观察时间、坐席/工号、事件、来源及前后状态。上线、下线、置闲、置忙归为常规事件；明确的`breakLine`断开/恢复及`sipDisconnected`软电话断开另标连接异常。AliCti API-315允许配置type=9座席状态变更推送，但现有资料未定义其具体载荷、时间戳和去重键，真实接入前须核对；原型不冒充已收到供应商推送。API-304队列成员与DOC-344单坐席查询仅为状态快照，快照差异仅标“观察到的变化”并使用本地观察时间，同一状态重复刷新不记新事件。离线或终端不可达不直接推断网络断线原因。只显示当前enterpriseId、tenantId和授权范围内的坐席，原型本地演示日志最多15条，与操作审计分开。

核对重点：常规事件与异常分开，来源及时间口径清楚；重复刷新不产生日志；切换租户不出现另一租户记录；信令断线须有明确连接回调才作该断言，不直接归因为网络故障。真实供应商推送和长期持久化仍待联调。

说明与接口：[FS-12](functional-spec.html#FS-12)；API-303、API-304、API-315、DOC-344；断线解释沿用D-052。

## D-079 新增弹窗误触遮罩保护

修改前：部分新增和编辑弹窗在填写后误点外侧空白遮罩会直接关闭，未保存的输入随之丢失。

当次处理：带保存动作的表单在遮罩关闭前检查输入变化；有未保存内容时先显示“继续填写 / 放弃填写并关闭”，没有改动则直接关闭。跨步骤重绘的业务分类表单保留草稿判断；原本自带未保存确认的弹窗沿用原流程，不重复弹窗。独立实现的新增弹窗遵循相同规则；保存成功的关闭不受影响。该变更仅涉及本地原型交互，不新增接口字段。

核对重点：空白表单点击外侧可直接关闭；填写后误点外侧可继续填写且内容不丢，确认放弃后才关闭；已有专用确认的页面只提示一次。

运行文件：[js/components/platform-ui.js](../js/components/platform-ui.js)、[js/pages/business-categories.js](../js/pages/business-categories.js)、`js/pages/sys-scene.js`（历史文件，已移除）、`js/pages/scene-block.js`（历史文件，已移除）、`js/pages/sys-tags.js`（历史文件，已移除）、`js/pages/scene-list.js`（历史文件，已移除）。

## D-078 任务外显配置按接口字段纠偏

修改前：任务创建错误地提供“指定号码/外显导航”二选一，并把名单逐客户clid误当作任务级固定号码配置。

当次处理：核对AliCti的API-311任务创建和API-404任务更新后，确认没有任务级指定号码字段。预外呼与自动外呼新建任务只保留账号已登记的外显导航并要求显式单选一个；虽然接口将导航字段列为可选，此必选是为明确选号口径而设的本原型产品约束；提交customerClidsCategory=5、单个customerClidsGroup、可选clidPoolList和customerTimeout，任务编辑仅提交API-404支持的实际改动。取消任务级固定号码/导航二选一、固定号码快照和由任务或批次自动写名单clid的逻辑。API-312的taskTelList[].clid仅是逐客户名单行的可选字段，可在名单导入显式映射时传完整号码；其与导航同传的优先关系继续列CF-15，不能自行推断。D-069/D-070中的固定号码任务分支为历史设计，账号多导航目录及任务单选规则继续有效；已发生通话的实际外显号码仍以话单为准。

核对重点：新建预外呼和自动外呼只能从当前账号目录显式选一个外显导航；创建/编辑不提交无接口字段的任务固定号码，确认、详情、复制同口径。API-312名单逐客clid仅在行内显式输入时可选，不从任务或批次带入；与导航同传优先关系列CF-15，原型模拟不等于供应商联调。

说明与字段：[FS-06](functional-spec.html#FS-06)、[FS-08](functional-spec.html#FS-08)、[FS-09](functional-spec.html#FS-09)、[FS-10](functional-spec.html#FS-10)；FA-054,FA-196,FA-197,FA-198,FA-199

接口依据：API-311、API-312、API-404

运行文件：`js/components/task-caller-settings.js`（历史阶段文件）、[js/components/alicti-fields.js](../js/components/alicti-fields.js)、[js/pages/cloud-task-workspace.js](../js/pages/cloud-task-workspace.js)

## D-077 业务配置统一从业务分类进入

修改前：业务分类、业务模板和自定义字段分别占用客户管理菜单，配置人员需要在三个入口间切换。

当次处理：客户管理只保留业务分类菜单；在业务分类页面内创建和维护分类、业务模板及自定义字段。D-074三层配置关系、复用规则、业务编码与必填校验继续适用，仅收敛导航和操作路径，不新增实体、供应商接口字段或数据迁移。

核对重点：客户管理菜单只显示业务分类；在该页能完成分类、模板、字段的创建和维护，分类→模板→字段引用、业务编码及必填规则保持。旧独立菜单入口不再提供；AliCti请求及客户保存结构不变。

说明与字段：[FS-07](functional-spec.html#FS-07)、[FS-24](functional-spec.html#FS-24)；FA-192,FA-193,FA-214,FA-215

接口依据：用户确认的本方业务规则，不新增AliCti参数。

运行文件：[js/pages/business-categories.js](../js/pages/business-categories.js)、[js/components/customer-business.js](../js/components/customer-business.js)

## D-076 坐席普通退出保留接听分机绑定

修改前：退出面板勾选“同时解除接听电话绑定”后会提交removeBinding=1，普通退出可能解除坐席与接听分机的绑定。

当次处理：普通退出固定提交logoutMode=1、removeBinding=0，完全下线并保留AliCti侧坐席与接听分机的绑定；退出面板移除解绑选项。本地坐席分机配置不清空。API-304仍记载removeBinding=1的官方能力，但本产品不开放；班长管理下线原本固定0的行为不变。

核对重点：正常退出请求只有logoutMode=1、removeBinding=0，不显示解绑复选项；退出成功后电话会话结束且绑定与本地分机配置保留。通话中或业务记录未保存时阻止退出，失败及未知结果不提前显示离线；本地Mock不等于真实供应商联调。

说明与字段：[FS-12](functional-spec.html#FS-12)；FA-011,FA-171

接口依据：API-304

运行文件：[js/components/alicti-seat-operations.js](../js/components/alicti-seat-operations.js)、[js/components/seat-operation-ui.js](../js/components/seat-operation-ui.js)、[js/pages/agent-workbench.js](../js/pages/agent-workbench.js)

## D-075 自动外呼任务创建、编辑与查看字段对齐

修改前：自动外呼已建任务缺少名称、描述和业务标签的清晰编辑入口，任务级语音流程名称及缺失等待时间可能取到当前目录或新建默认值。

当次处理：两类任务在创建、确认、详情和查看管理中共用本任务保存的通用字段；已建自动任务可见编辑名称、描述和供应商业务标签，仅将实际改动按API-404差量提交，DOC-334回查成功后刷新当前设置与planSnapshot。任务级流程名称优先冻结快照；既有customerTimeout缺失显示未记录，新建任务仍默认30秒。API-404的IVR行与仅type=1生效章节冲突，已建type=2的IVR保持只读并列CF-17待供应商确认。

核对重点：名称、描述和标签在自动任务查看与管理中可见可编辑；原taskId差量更新且回查前不更新本地保存值。创建确认和详情通用字段一致；流程名来自本任务快照，缺失等待时间不补30秒；自动任务IVR只读，预测专用字段不混入自动编辑。原型模拟不等于供应商联调。

说明与字段：[FS-08](functional-spec.html#FS-08)、[FS-09](functional-spec.html#FS-09)、[FS-10](functional-spec.html#FS-10)；FA-199,FA-200,FA-201,FA-213,FA-216

接口依据：API-311、API-404、DOC-334、DOC-338

运行文件：[js/pages/cloud-task-workspace.js](../js/pages/cloud-task-workspace.js)、[js/components/alicti-fields.js](../js/components/alicti-fields.js)

## D-074 独立业务字段、业务模板与选填业务编码

修改前：业务分类直接内嵌字段定义，选项只有显示文本；同一字段难以跨分类复用，也没有本地外部业务映射编码。

当次处理：业务分类可不绑定模板；绑定时只选一个，线索分类须绑定含六项预置字段的启用模板；多个分类可共用模板；独立字段库维护七种字段及选项，模板引用字段并配置顺序、显示和必填。字段和单选/多选选项分别增加选填业务编码，按字符串保留前导零并在本租户字段库/所属字段内校验唯一；表单及统计继续使用稳定内部ID。

核对重点：导入选择分类，客服按关联模板填写，正式保存后通话详情和客户档案一致。模板字段required默认false；跨租户引用与重复编码拒绝；选项保存内部option.id，预置线索六项统计口径稳定；业务编码不传AliCti。原型不做旧数据迁移。

说明与字段：[FS-07](functional-spec.html#FS-07)、[FS-11](functional-spec.html#FS-11)、[FS-14](functional-spec.html#FS-14)、[FS-24](functional-spec.html#FS-24)；FA-192,FA-193,FA-194,FA-195,FA-214,FA-215

接口依据：用户确认的本方业务规则，不新增AliCti参数。

运行文件：[js/components/customer-business.js](../js/components/customer-business.js)、[js/pages/business-categories.js](../js/pages/business-categories.js)、[js/components/customer-followup.js](../js/components/customer-followup.js)、[js/components/customer-directory.js](../js/components/customer-directory.js)

## D-073 已建外呼任务按供应商更新接口编辑

修改前：已建任务仅能查看设置或复制为新草稿，不能按原任务ID修改；通话详情关联设置与任务中心操作混用只读口径。

当次处理：D-073：预外呼与自动外呼任务的“查看与管理”增加编辑任务入口，回填当前原型任务配置，提交时以原供应商taskId调用task/update。仅有明确供应商任务ID、权限有效、未结束且无待核对结果的任务可编辑。只编辑当前原型已采用且更新接口列明的属性；任务类型type、接听分支callGroupType、客户名单/排重与指定号码clid不在更新接口内，保持原值，自动外呼IVR更改本期不开放。差量请求只提交实际改动字段，不建设旧任务数据兼容或旧功能迁移；省略字段保留语义待联调；成功回执后task/get核对同一任务及可回读字段，核对成功才更新本地当前配置与planSnapshot，并将编辑前设置副本写入taskSettingHistory；失败、未知或无法核实不改原配置并保留输入。复制任务创建新草稿继续保留。D-065保留为历史变更记录，任务中心按本决定可编辑，通话详情内关联任务摘要仍只读。运行中改动何时影响后续呼叫官方未明确，真实联调前不承诺即时生效；已发生通话与客户记录不回写。

核对重点：有真实或明确模拟供应商taskId、授权有效、未结束且无待核对结果才可编辑；仅改已采用且task/update列明的属性，差量提交，成功后task/get核对再更新当前planSnapshot，编辑前设置副本写入taskSettingHistory。失败或未知保留原配置与输入；不回写已发生通话和客户记录，运行中生效时点待联调。

说明与字段：[FS-08](functional-spec.html#FS-08)、[FS-09](functional-spec.html#FS-09)、[FS-10](functional-spec.html#FS-10)；FA-213,FA-200,FA-201,FA-202,FA-203,FA-204,FA-205,FA-206,FA-207,FA-208,FA-209,FA-210,FA-211,FA-212

接口依据：API-404、DOC-334

运行文件：[js/pages/cloud-task-workspace.js](../js/pages/cloud-task-workspace.js)、[js/components/alicti-fields.js](../js/components/alicti-fields.js)

## D-072 坐席登录单面板直接提交

修改前：原坐席登录须先打开设置保存工作模式偏好，再回到工具条点击登录；用户需要操作两次。

当次处理：D-072：每次点击坐席登录都打开同一登录面板，工作模式初始为请选择，须当次单选0/4/5；登录状态默认置闲，可改置忙，置忙原因选填。点击登录直接调用Agent.login，取消不发请求，失败保留本次输入便于重试。不再先保存设置或依赖旧偏好自动选择工作模式。置忙登录成功后禁用主动预览外呼并提示先置闲。断线重登独立保留当前会话模式及暂停状态；D-071在线切换与模式互斥规则继续适用。

核对重点：点击坐席登录只打开一次面板；每次普通登录模式初始未选，状态默认置闲可改置忙，原因选填；点击登录直接提交，不先保存设置。未选或取消不发请求，失败保留本次输入；断线重登保留会话模式和暂停状态。

说明与字段：[FS-12](functional-spec.html#FS-12)；FA-170,FA-176

接口依据：API-304

运行文件：[js/components/seat-operation-ui.js](../js/components/seat-operation-ui.js)、[js/pages/agent-workbench.js](../js/pages/agent-workbench.js)、[js/components/alicti-seat-operations.js](../js/components/alicti-seat-operations.js)

## D-071 坐席工作模式选择与在线切换

修改前：坐席上线固定提交workingMode="0"，未选择模式也可登录，工具条无工作模式入口，在线不能调整预览与预测分工。

当次处理：D-071：上线设置新增工作模式单选（0预览与预测同时、4预览外呼、5预测外呼），保存为本人电话偏好并随下次login提交；登录后工具条直接显示模式下拉，在线即时调用CTILink.Agent.changeWorkingMode切换，不收入更多菜单。置忙可切换；通话、振铃、话后整理及未知结果期间禁止切换并保留原模式。模式4不再接受预测外呼分配，模式5禁用预览外呼入口；呼入不受模式限制是本地假设，登记CF-16。不开放登录逗号多值；changeBindTel维持拒绝。

核对重点：登录前须先选择工作模式：未选择时登录设置保存与登录提交均被阻止且不发请求，不以默认模式0代替本人选择；上线设置可单选0/4/5并随login提交；工具条直接显示模式下拉，置忙可切换，通话/振铃/整理/未知拒绝并保留原模式；模式4不接受预测分配、模式5禁用预览入口；呼入不受限为本地假设见CF-16；changeBindTel维持拒绝；56套离线回归全过。

说明与字段：[FS-12](functional-spec.html#FS-12)；FA-170,FA-176

接口依据：API-304

运行文件：[js/components/alicti-seat-operations.js](../js/components/alicti-seat-operations.js)、[js/components/seat-operation-ui.js](../js/components/seat-operation-ui.js)、[mock/seat-operations.js](../mock/seat-operations.js)、[assets/css/agent-workbench.css](../assets/css/agent-workbench.css)、[qa/verify-working-mode.cjs](../qa/verify-working-mode.cjs)

## D-070 账号多外显导航目录与任务显式单选

修改前：账号仅登记一个默认导航，任务沿用该值，误将任务单个标识限制扩大为账号目录限制。

当次处理：D-070：同一enterpriseId可本地登记多个AliCti已有外显导航，超级管理员维护名称与标识列表，标识同账号唯一，不设置本地数量上限。两类任务从当前账号目录显式单选一个，不自动选择首项；任务customerClidsGroup仍为单个String，callerNavigationName仅为本地名称快照。客户接听等待时间默认30秒、5–60秒；号码池可多条、priority手动选填。账号数量上限、资源查询、选号与停用排除仍待CF-15确认，未声称供应商已经证实多导航。超级管理员（SUPER）在既有AliCti账号编辑的“外显导航”区维护callerNavigations:[{name,customerClidsGroup}]，可登记多个已存在AliCti导航；每行名称和标识必填，标识同账号唯一，不设置本地数量上限，不新增菜单或实体模块。目录是本地登记，移除条目不等于远端删除或停用。旧instance.customerClidsGroup单值仅在读取时兼容为一条，不自动重写；没有目录不推造候选。创建、草稿及复制的导航候选仅取当前账号目录，下拉显式单选一个，无自动首项默认。新提交前复核所选标识仍在目录，被移除须重选；名称改名不阻断，旧草稿有标识但无名称时只从匹配候选补名称。切换到另一个导航清空原clidPoolList，保留customerTimeout。任务保存外显方式、导航名称及标识、号码池和等待时间快照；callerNavigationName仅作本地名称快照、不传API，task/create仍只传单个String customerClidsGroup。账号目录改名或移除不回填已保存任务快照，也不覆写草稿及复制已有的名称；已创建任务和原任务再次联系保留快照及原taskId。创建确认、任务设置及复制采用一致字段；草稿和复制在新提交时复核当前账号目录，已移除标识须重选。通话详情仅展示话单实际外显号码，不能用池名称或本地挑选结果冒充供应商选号事实。现有官方材料只说明单次任务传一个导航标识，未确认同enterpriseId的导航数量上限或账号内查询接口；本地多行登记是D-070产品修正，不冒充供应商答复。目录移除不等于远端删除或停用，CF-15继续未决。

核对重点：账号多导航仅SUPER维护、标识同账号唯一；任务显式单选无默认、候选当前账号；改名保留快照，移除后新提交重选，已创建任务及再次联系保留原taskId；切换清池保留等待时间；旧单值仅读取兼容；未把本地规则当成供应商数量证明。

说明与字段：[FS-01](functional-spec.html#FS-01)、[FS-08](functional-spec.html#FS-08)、[FS-09](functional-spec.html#FS-09)、[FS-10](functional-spec.html#FS-10)、[FS-14](functional-spec.html#FS-14)；FA-196,FA-197,FA-198,FA-199

接口依据：API-311、DOC-338

运行文件：[js/components/alicti-accounts.js](../js/components/alicti-accounts.js)、[js/pages/alicti-accounts.js](../js/pages/alicti-accounts.js)、`js/components/task-caller-settings.js`（历史阶段文件）、[js/components/alicti-fields.js](../js/components/alicti-fields.js)、[js/pages/cloud-task-workspace.js](../js/pages/cloud-task-workspace.js)

## D-069 任务外显导航与客户接听等待时间

修改前：任务只支持指定固定号码，缺少外显导航和客户接听等待时间配置。

当次处理：D-069：预外呼与自动外呼提供指定号码和外显导航两种互斥方式。账号仅由超级管理员选填既有外显导航标识；任务保存导航及号码池配置快照，号码池优先级手动选填整数、数字越小越优先。客户接听等待时间默认30秒、5–60秒。导航名单不混传clid，不新建号码池实体；来源、选号和停用排除边界保留CF-15。指定号码沿用完整号码task/importTaskTel.taskTelList[].clid；外显导航在task/create传customerClidsCategory=5、customerClidsGroup及可选clidPoolList，导航模式导入名单绝不混传clid。两类任务均传customerTimeout，默认30秒且范围5–60秒。号码池名称来自AliCti已有配置，不把本地号码列表当成池、不新增号码池菜单或创建能力。priority手动选填整数且数字越小越优先；留空省略，不自动分配。空池、同优先级和资源来源查询待CF-15确认，不承诺失败自动切池。任务保存外显方式、导航标识、号码池及等待时间快照；修改账号默认导航不回填已有任务。创建确认、任务设置及复制采用一致字段；复制仍校验当前权限，原任务再次联系沿用原配置和原taskId。通话详情仅展示话单实际外显号码，不能用池名称或本地挑选结果冒充供应商选号事实。本地停用仅能约束本地直接选号，不能保证AliCti外显导航号码池排除该号码；全局阻断须经供应商停用或排除机制核验。既有通话正常继续；此边界不增加异常入口。

核对重点：两类任务外显方式互斥；导航名单不传clid；快照、复制和原任务再次联系一致；超管维护账号导航；CF-15边界不伪造供应商事实。

说明与字段：[FS-01](functional-spec.html#FS-01)、[FS-08](functional-spec.html#FS-08)、[FS-09](functional-spec.html#FS-09)、[FS-10](functional-spec.html#FS-10)、[FS-14](functional-spec.html#FS-14)；FA-054,FA-196,FA-197,FA-198,FA-199

接口依据：API-311、API-312、DOC-338

运行文件：[js/components/alicti-accounts.js](../js/components/alicti-accounts.js)、[js/pages/alicti-accounts.js](../js/pages/alicti-accounts.js)、[js/components/alicti-fields.js](../js/components/alicti-fields.js)、`js/components/task-caller-settings.js`（历史阶段文件）、[js/pages/cloud-task-workspace.js](../js/pages/cloud-task-workspace.js)、[js/pages/scenario-demo.js](../js/pages/scenario-demo.js)、[js/pages/agent-workbench.js](../js/pages/agent-workbench.js)

## D-068 AliCti账号关联唯一业务租户

修改前：此前账号可关联多个业务租户，号码导入后另行分配使用租户，号码详情包含多层入口。

当次处理：每个enterpriseId只关联0或1个总部/门店业务租户，内置超级租户不计入；每个业务租户仍只关联一个AliCti账号。tenantId与enterpriseId分别保留，平台登录账号仍可按成员授权加入多个租户。总部7522240与门店7522241属于同一品牌，但资源和业务数据按各自账号及租户隔离。号码导入时默认归属当前账号唯一有效业务租户，不再提供号码租户分配或多选授权；账号无有效业务租户时阻止导入。号码详情只读展示归属和使用情况，不嵌套呼入规则、外显用途或原始属性入口。号码状态、方向及外显资格仍按已存事实校验，呼入规则在独立菜单管理。队列、坐席、技能、分机、时间条件与呼入规则继续核验租户和角色权限，取消同账号多租户共享配置。当前报表仅统计所选enterpriseId的唯一业务租户，不新增跨账号汇总。若后续经明确授权建设同品牌跨账号线索汇总，业务唯一键应为brandId+完整线索编码；当前不得按品牌名合并或加载未授权账号数据。

核对重点：同账号第二个业务租户被拒绝，超级租户不占名额；号码导入自动归属，角色与资源权限保留；当前统计不跨账号汇总。

说明与字段：[FS-01](functional-spec.html#FS-01)、[FS-02](functional-spec.html#FS-02)、[FS-06](functional-spec.html#FS-06)、[FS-16](functional-spec.html#FS-16)、[FS-17](functional-spec.html#FS-17)、[FS-22](functional-spec.html#FS-22)、[FS-23](functional-spec.html#FS-23)；FA-001,FA-084,FA-129,FA-134,FA-148,FA-155,FA-187,FA-189,FA-190

接口依据：用户确认的本方业务规则，不新增AliCti参数。

运行文件：[js/components/alicti-accounts.js](../js/components/alicti-accounts.js)、[js/components/account-tenant-forms.js](../js/components/account-tenant-forms.js)、[js/components/alicti-number-import.js](../js/components/alicti-number-import.js)、[js/pages/resource-lines.js](../js/pages/resource-lines.js)

## D-067 号码详情取消嵌套管理入口

修改前：此前账号可关联多个业务租户，号码导入后另行分配使用租户，号码详情包含多层入口。

当次处理：号码详情去掉呼入规则、外显用途与属性的嵌套入口，相关供应商原始数据及独立呼入规则管理保留。

核对重点：同账号第二个业务租户被拒绝，超级租户不占名额；号码导入自动归属，角色与资源权限保留；当前统计不跨账号汇总。

说明与字段：[FS-01](functional-spec.html#FS-01)、[FS-02](functional-spec.html#FS-02)、[FS-06](functional-spec.html#FS-06)、[FS-16](functional-spec.html#FS-16)、[FS-17](functional-spec.html#FS-17)、[FS-22](functional-spec.html#FS-22)、[FS-23](functional-spec.html#FS-23)；FA-084,FA-094,FA-148

接口依据：用户确认的本方业务规则，不新增AliCti参数。

运行文件：[js/components/alicti-accounts.js](../js/components/alicti-accounts.js)、[js/components/account-tenant-forms.js](../js/components/account-tenant-forms.js)、[js/components/alicti-number-import.js](../js/components/alicti-number-import.js)、[js/pages/resource-lines.js](../js/pages/resource-lines.js)

## D-066 四类通话记录事实与严格任务关联

修改前：原型交互已有调整，正式说明需要同步当前业务规则。

当次处理：通话列表、详情与任务内通话使用同一只读解析，对齐API-317/318/319/362的身份、接听状态、时间、时长、工号、实际队列、流程及原始话单。已有接口来源对象但raw缺失/不可用或接口字段缺失时，不借旧结束标签、时长和agentAnswerResult补接口事实；没有接口来源对象的纯本地演示记录仍按明确本地来源展示；有效0秒保留。关联任务必须核对账号、租户、类型和明确平台/供应商taskId，冲突不改绑且不开放再次联系。关联任务设置默认折叠只读，复用任务设置摘要；移除旧技能、虚构IVR节点/版本及补齐控件。四类及全部日期查询按实际话单开始时间筛选。

核对重点：按本版对应功能说明、字段清单、规则附表和计划验收核对；原型回归不等于真实供应商联调。

说明与字段：[FS-10](functional-spec.html#FS-10)、[FS-14](functional-spec.html#FS-14)、[FS-16](functional-spec.html#FS-16)；FA-049,FA-065,FA-068,FA-080,FA-115,FA-116,FA-117,FA-118,FA-119,FA-120,FA-121,FA-122,FA-123

接口依据：API-317、API-318、API-319、API-362

运行文件：[js/pages/cloud-call-records.js](../js/pages/cloud-call-records.js)、[js/pages/cloud-task-workspace.js](../js/pages/cloud-task-workspace.js)、[js/components/alicti-report-facts.js](../js/components/alicti-report-facts.js)、[qa/verify-call-detail-alignment.cjs](../qa/verify-call-detail-alignment.cjs)

## D-065 创建确认与任务设置一致

修改前：原型交互已有调整，正式说明需要同步当前业务规则。

当次处理：两类任务详情统一任务设置，按创建确认的任务与客户、接听团队配置或任务与语音流程、时间与重呼三组及顺序展示。cnos原工号、外呼组、最低人数、号码和流程名称、时间及重呼采用本任务保存值与首次启动冻结快照；旧不完整快照仅从本任务原值补显示，显式空值不覆盖，不从共享模板或当前技能成员重算。只读缺失策略显示未记录，复制时要求补选并不继承原名单及预约日期。移除内部配置名称/版本、编号和变更说明面板。

核对重点：按本版对应功能说明、字段清单、规则附表和计划验收核对；原型回归不等于真实供应商联调。

说明与字段：[FS-08](functional-spec.html#FS-08)、[FS-09](functional-spec.html#FS-09)、[FS-10](functional-spec.html#FS-10)；FA-036,FA-037,FA-038,FA-039,FA-041,FA-042,FA-043,FA-169,FA-191

接口依据：API-311、API-312

运行文件：[js/pages/cloud-task-workspace.js](../js/pages/cloud-task-workspace.js)

## D-064 任务列表精简与后续重呼证据边界

修改前：原型交互已有调整，正式说明需要同步当前业务规则。

当次处理：预外呼与自动外呼列表移除内部执行配置名称、V1版本和后续重呼列，备用客户表移除hasNext占位。finishRetryFlag、telRetryRound描述单条话单，retryStrategy描述配置，均不直接证明后续重呼已安排。实际参数、模板复用、任务控制及原任务待再次联系保留。

核对重点：按本版对应功能说明、字段清单、规则附表和计划验收核对；原型回归不等于真实供应商联调。

说明与字段：[FS-08](functional-spec.html#FS-08)、[FS-09](functional-spec.html#FS-09)、[FS-10](functional-spec.html#FS-10)；FA-123

接口依据：API-318、DOC-334

运行文件：[js/pages/cloud-call-tasks.js](../js/pages/cloud-call-tasks.js)、[js/pages/cloud-task-workspace.js](../js/pages/cloud-task-workspace.js)

## D-063 客户档案精简与未知结果文案

修改前：原型交互已有调整，正式说明需要同步当前业务规则。

当次处理：客户档案导入与分配记录删除查看批次和操作列，保留九项业务字段、分页及独立导入管理；列表删除固定线索/意向列，详情按业务分类显示动态字段。未知接听结果显示结果未知，仅调整展示用语，不新增接口状态、号码识别码或改写原数据。

核对重点：按本版对应功能说明、字段清单、规则附表和计划验收核对；原型回归不等于真实供应商联调。

说明与字段：[FS-07](functional-spec.html#FS-07)、[FS-14](functional-spec.html#FS-14)、[FS-24](functional-spec.html#FS-24)；FA-085,FA-086,FA-195

接口依据：用户确认的本方业务规则，不新增AliCti参数。

运行文件：[js/pages/customer-directory.js](../js/pages/customer-directory.js)、[js/components/customer-directory.js](../js/components/customer-directory.js)

## D-062 轻量文档交付与演示存储维护

修改前：原型交互已有调整，正式说明需要同步当前业务规则。

当次处理：按用户要求删除重复开发交付包及ZIP，保留现有功能说明、附表、字段对齐、流程图、时序图、蓝图、待确认事项和开发阅读指引，原始官方快照集中在references。原型对三个大体量JSON存储项采用无损压缩以恢复演示数据持久化，读取还原原JSON，不删除历史记录、不改业务schema；这属于实现维护，不增加历史模型迁移或供应商接口能力。

核对重点：按本版对应功能说明、字段清单、规则附表和计划验收核对；原型回归不等于真实供应商联调。

说明与字段：`FS-20`（历史章节，已移除）；

接口依据：用户确认的本方业务规则，不新增AliCti参数。

运行文件：[documentation/build_development_guide.py](../documentation/build_development_guide.py)、[references/README.md](../references/README.md)、[js/alicti-storage.js](../js/alicti-storage.js)

## D-061 时间条件手动维护优先级与精简展示

修改前：原型交互已有调整，正式说明需要同步当前业务规则。

当次处理：时间条件priority仍为接口必填字段，由用户手动填写正整数，同enterpriseId内唯一（含其他租户）。新增为空、不推荐或自动分配；编辑带入已有值，部分更新未传priority时保留原值。列表和详情展示优先级，时间类型并入适用时间摘要，去掉重复共享只读标签和使用位置；共享条件由超管维护的权限及引用保护继续保留。此项补充D-056，替代此前短暂采用的自动分配优先级方案。

核对重点：按本版对应功能说明、字段清单、规则附表和计划验收核对；原型回归不等于真实供应商联调。

说明与字段：[FS-23](functional-spec.html#FS-23)；FA-189,FA-190,FA-191

接口依据：API-400、API-401、DOC-356、DOC-359

运行文件：[js/components/alicti-time-conditions.js](../js/components/alicti-time-conditions.js)、[js/pages/time-condition-management.js](../js/pages/time-condition-management.js)

## D-060 原任务再次联系与名单耗尽暂停

修改前：原型交互已有调整，正式说明需要同步当前业务规则。

当次处理：用户确认再次预外呼仅针对原任务、保留原任务ID。按任务展示待再次联系，在原taskId下新增批次和客户行；沿用原资源、策略及执行安排，importTaskTel仅导入本次名单并显式isRepeat=0、importTelAutoStart=0。来源、占用及业务联系次数按账号/租户/任务隔离，拒绝联系仍按客户拦截。新预测任务autoComplete=0，名单耗尽暂停；自动外呼保持1。结束任务不可重开，旧新建任务式再次联系入口停止使用。原通话和处理结果保留，本次批次及任务汇总保存失败通过独立记录恢复，不覆盖后续终止状态或重复追加。此项取代D-032中新建任务和全局待再次联系池的方案。

核对重点：按本版对应功能说明、字段清单、规则附表和计划验收核对；原型回归不等于真实供应商联调。

说明与字段：[FS-08](functional-spec.html#FS-08)、[FS-09](functional-spec.html#FS-09)、[FS-11](functional-spec.html#FS-11)；FA-047,FA-144,FA-145,FA-146,FA-169

接口依据：API-311、API-312、DOC-333、DOC-334

运行文件：[js/components/repeat-predictive.js](../js/components/repeat-predictive.js)、[js/pages/cloud-task-workspace.js](../js/pages/cloud-task-workspace.js)、[js/components/alicti-fields.js](../js/components/alicti-fields.js)、[mock/demo-activity.js](../mock/demo-activity.js)

## D-059 业务分类与可配置必填客户字段

修改前：原型交互已有调整，正式说明需要同步当前业务规则。

当次处理：客户管理新增业务分类，租户管理员维护本租户字典，超管按租户维护；字段支持文本、多行、数字、单选、多选、日期和日期时间，可排序/隐藏/必填，默认选填。导入选择字典分类，坐席按该分类填写；草稿可不完整，最终保存按当前配置校验。客户档案按业务分类和单据分组，通话详情保留本通值；预置线索指标稳定以维持报表。按用户要求不做历史配置版本或历史数据迁移。

核对重点：按本版对应功能说明、字段清单、规则附表和计划验收核对；原型回归不等于真实供应商联调。

说明与字段：[FS-07](functional-spec.html#FS-07)、[FS-11](functional-spec.html#FS-11)、[FS-14](functional-spec.html#FS-14)、[FS-24](functional-spec.html#FS-24)；FA-192,FA-193,FA-194,FA-195,FA-107,FA-108,FA-109,FA-110,FA-111,FA-112,FA-113

接口依据：用户确认的本方业务规则，不新增AliCti参数。

运行文件：[js/components/customer-business.js](../js/components/customer-business.js)、[js/pages/business-categories.js](../js/pages/business-categories.js)、[js/components/customer-followup.js](../js/components/customer-followup.js)

## D-058 电话工具条与记录保存自动置闲

修改前：原型交互已有调整，正式说明需要同步当前业务规则。

当次处理：本人具备坐席时顶部常驻电话工具条，统一登录/退出、置忙/置闲、预览外呼、接听、静音、挂断及延长整理；记录从非模态右侧面板填写，切页可收起、同通草稿保留。上线和人工拨号去掉技能与外显选择，拨号时自动取本租户可用号码。挂断后业务保存成功且idle时调用unpause自动置闲，成功才恢复接听；失败保留记录可重试、未知先核对。来电不展示拒接入口。菜单主页面不显示返回，二级抽屉左上返回右上关闭，二次确认置顶。 回归修复：未完成重呼配置也能关闭/返回保存草稿，下一步和确认创建仍严格检查；窄窗侧栏保留菜单文字，不用只有图标的父项替代导航。

核对重点：按本版对应功能说明、字段清单、规则附表和计划验收核对；原型回归不等于真实供应商联调。

说明与字段：[FS-11](functional-spec.html#FS-11)、[FS-12](functional-spec.html#FS-12)；FA-029,FA-138,FA-140,FA-141,FA-142,FA-170,FA-171,FA-172,FA-173,FA-175,FA-178

接口依据：API-304、API-305、API-306

运行文件：[js/pages/agent-workbench.js](../js/pages/agent-workbench.js)、[js/components/alicti-seat-operations.js](../js/components/alicti-seat-operations.js)

## D-057 坐席技能、状态和任务占用统一

修改前：原型交互已有调整，正式说明需要同步当前业务规则。

当次处理：界面统一技能，不再维护服务类型。坐席创建移除联系手机号、可不选技能，后续配置；列表仅官方state话务状态和active启用状态，不再列技能数量或本地同步状态。人工客户可分给本租户有有效坐席的管理员或运营。外呼组一坐席一组，同组或同席不可并行参与两个运行预测任务，启动/继续跨两种分配方式复检；暂停/结束确认后释放，未知保留占用。

核对重点：按本版对应功能说明、字段清单、规则附表和计划验收核对；原型回归不等于真实供应商联调。

说明与字段：[FS-04](functional-spec.html#FS-04)、[FS-05](functional-spec.html#FS-05)、[FS-07](functional-spec.html#FS-07)、[FS-21](functional-spec.html#FS-21)；FA-016,FA-021,FA-022,FA-023,FA-092,FA-181,FA-035,FA-036,FA-037

接口依据：API-307、API-308、DOC-342、DOC-344、API-311、API-386、API-391

运行文件：[js/pages/agent-center.js](../js/pages/agent-center.js)、[js/components/outbound-groups.js](../js/components/outbound-groups.js)

## D-056 时间条件维护与任务关联

修改前：原型交互已有调整，正式说明需要同步当前业务规则。

当次处理：系统管理新增时间条件，按enterpriseTime/create、update、delete、list维护星期/日期、起止时间、连续/间隔和企业唯一名称优先级。管理员维护本租户独占条件，共享条件由超管维护。预外呼/自动外呼多选可呼叫和禁呼条件，分别映射autoTriggerTimeStrategy/timeStrategy逗号串；呼入继续分号。去掉使用位置展示，内部引用保护保留，不自建时间执行引擎。

核对重点：按本版对应功能说明、字段清单、规则附表和计划验收核对；原型回归不等于真实供应商联调。

说明与字段：[FS-08](functional-spec.html#FS-08)、[FS-23](functional-spec.html#FS-23)；FA-189,FA-190,FA-191

接口依据：API-400、API-401、API-402、DOC-356、DOC-359、API-311

运行文件：[js/components/alicti-time-conditions.js](../js/components/alicti-time-conditions.js)、[js/pages/time-condition-management.js](../js/pages/time-condition-management.js)

## D-055 分机资源管理与受控分机选择

修改前：原型交互已有调整，正式说明需要同步当前业务规则。

当次处理：系统管理新增独立分机管理，按exten/create、update、get、list及batchDelete管理已有软电话资源，资源type=2，登录bindType=3。坐席不再自由输入分机，只选择同账号同租户已启用未占用资源，配置在下次登录读取。维护密码只用于瞬时输入，追踪脱敏；本地租户授权不进入供应商请求。单删除exten Int与其他String差异保留原文，当前采用batchDelete单元素及查询核实。

核对重点：按本版对应功能说明、字段清单、规则附表和计划验收核对；原型回归不等于真实供应商联调。

说明与字段：[FS-04](functional-spec.html#FS-04)、[FS-22](functional-spec.html#FS-22)；FA-184,FA-185,FA-186,FA-187,FA-188,FA-008,FA-170

接口依据：API-396、API-397、API-398、API-399、API-403、DOC-355、API-304

运行文件：[js/components/alicti-extensions.js](../js/components/alicti-extensions.js)、[js/pages/extension-management.js](../js/pages/extension-management.js)

## D-054 呼入号码识别适用范围与软电话接听口径

修改前：CF-13仍询问呼入是否有号码识别，软电话来电缺少识别值容易被列为待确认。

当次处理：供应商明确呼入也有号码识别，一般针对坐席绑定手机号；软电话大概率识别不到。本项目按API-319响应status判断接听，识别缺失正常留空，不作为异常、未接听或开发阻断。CF-13仅保留自动外呼识别字段与号码字典对应。原型对识别缺失返回中性值；status缺失/未知不沿用旧接通标签，明确接听事件仍保留。

核对重点：四个中文status原枚举分别处理，系统应答与人工接听分开；缺失号码识别不影响接听展示与统计，原始识别值保留，不外推预测异步标识。状态与时间冲突仍核对，未知status不补造；D-053历史与上一回归证据不改写。D-054/SRC-084。

说明与字段：[FS-13](functional-spec.html#FS-13)、[FS-14](functional-spec.html#FS-14)、[FS-16](functional-spec.html#FS-16)；FA-069

接口依据：API-319、API-327

运行文件：[js/components/alicti-number-status.js](../js/components/alicti-number-status.js)、[js/components/alicti-report-facts.js](../js/components/alicti-report-facts.js)

## D-053 预测号码识别异步标识澄清与开发包同步

修改前：预测话单异步标识含义和补偿时机仍待确认，开发包尚未纳入D-046以后的规则。

当次处理：按供应商答复，sipCauseAsyncUpdateFlag=1表示识别结果已异步写回原sipCause，0表示同步。提示音可识别不出，补偿识别可能延迟约1–2分钟。CF-13只保留自动外呼及呼入的字段覆盖和编码对应；开发包统一纳入D-046至D-053。

核对重点：0不作为等待中，1不等于识别必成功，两分钟不是完成SLA。迟到结果只更新原通话，未知和缺失保留，不重复计数、不由本地触发重呼。模型、契约、任务及计划验收同步；真实联调保持待执行。D-053/SRC-083。

说明与字段：[FS-14](functional-spec.html#FS-14)、[FS-16](functional-spec.html#FS-16)；FA-071

接口依据：API-318、API-327

运行文件：

## D-052 CF-11信令与软电话断线处理明确

修改前：电话连接生命周期仍笼统待确认，原型未区分两类断线。

当次处理：breakLine由SDK最多20次重连，code=-1断开、0重连成功；sipDisconnected要求重新登录。原型区分提示和保护，保留通话与草稿。CF-11仅保留异常退出、跨设备互斥、可靠媒体/最终状态核验及setOffline回执命名。

核对重点：不另启20次重连循环，不凭-1回调次数判断耗尽；code=0不证明媒体或原通话恢复。软电话断开重新登录，草稿和历史保留；未明确的问题继续待确认。D-052/SRC-082。

说明与字段：[FS-12](functional-spec.html#FS-12)；FA-138,FA-170,FA-178,FA-179

接口依据：API-303、API-304、DOC-344、DOC-395

运行文件：[js/components/alicti-seat-operations.js](../js/components/alicti-seat-operations.js)、[js/pages/agent-workbench.js](../js/pages/agent-workbench.js)、[js/components/alicti-adapter.js](../js/components/alicti-adapter.js)

## D-051 CF-08批量回执与未知写入查证关闭

修改前：批量other/success关系、技能失败工号定位和未知写入证明仍待供应商澄清。

当次处理：供应商明确other包含于success，不能重复计数；cnos含全部建成工号，queryAgentSkill单独核实技能。未知主记录以agent/query新id与请求窗口内createTime查证，CF-08关闭。原型补批量回执解析和查询开通结果。

核对重点：other是success子集，fail与success不重叠；不将存在或技能关系当作本次主记录写入证明。未知结果先查询、不自动重放。当前批量表单不新增技能配置，技能查证是纯契约。D-051/SRC-081。

说明与字段：[FS-04](functional-spec.html#FS-04)；FA-027,FA-090,FA-091

接口依据：DOC-331、DOC-341、DOC-342、DOC-343

运行文件：[js/components/alicti-fields.js](../js/components/alicti-fields.js)、[js/components/alicti-seat-import.js](../js/components/alicti-seat-import.js)

## D-050 CF-08同工号重建与历史话单归属

修改前：同工号重建的配置身份和历史统计归属不明；本地导入查重仍可能包含已删除坐席。

当次处理：供应商配置侧重建为新id/createTime，不继承旧技能、队列成员和绑定电话；话单侧只记cno，按工号查询或报表合并新旧通话。同步原型重建与统计处理，CF-08仅保留批量回执和未知写入查证。

核对重点：新旧配置不共用主键和当前绑定；同cno历史不删除、不重复归给多位坐席，不从当前姓名倒推历史身份。权限范围仍按已有本地归属过滤。CF-08未答复的批量及未知结果问题不关闭。来源D-050/SRC-080。

说明与字段：[FS-04](functional-spec.html#FS-04)、[FS-16](functional-spec.html#FS-16)；FA-027,FA-091,FA-127

接口依据：DOC-332、DOC-341、DOC-342、DOC-343、API-366

运行文件：[js/pages/agent-center.js](../js/pages/agent-center.js)、[js/components/alicti-seat-import.js](../js/components/alicti-seat-import.js)、[js/components/report-data.js](../js/components/report-data.js)

## D-049 CF-14队列报表计数明确

修改前：两个计数字段的含义与英文命名容易混淆，列CF-14待确认。

当次处理：按供应商回复，telEnterCount为队列来电接听数，telAnswerCount为进入队列来电数，两者均String；保留原键值，新增明确语义别名。CF-14关闭，剩余6个供应商确认主题。

核对重点：接听数取telEnterCount，进入数取telAnswerCount；原始String及供应商比率不改，异常值不补零；未构建原生队列报表UI。来源为用户提供供应商回复截图D-049/SRC-079。

说明与字段：[FS-16](functional-spec.html#FS-16)；FA-128

接口依据：API-368、DOC-369、DOC-376

运行文件：[js/components/alicti-report-summary.js](../js/components/alicti-report-summary.js)

## D-048 CF-06号码停用与本地使用控制

修改前：号码停用对已发起通话的影响未明确，并保留供应商永久解绑需求。

当次处理：供应商答复明确停用号码不再用于后续选号，已有通话正常继续。用户取消远端解绑，列表改为本地使用启停，供应商status维护独立保留在详情。新增FA-183，CF-06关闭，剩余7个供应商确认主题。

核对重点：本地停用不调用供应商写接口，后续选号、任务新发起及工作台新拨号被阻止；既有通话/授权/路由/历史保留。本地恢复不得绕过供应商停用或自动继续任务。D-048/SRC-078分别记录供应商答复和用户范围决定。

说明与字段：[FS-06](functional-spec.html#FS-06)、[FS-08](functional-spec.html#FS-08)、[FS-11](functional-spec.html#FS-11)；FA-093,FA-183

接口依据：API-310、DOC-345

运行文件：[js/pages/resource-lines.js](../js/pages/resource-lines.js)、[js/components/resource-rules.js](../js/components/resource-rules.js)

## D-047 CF-04任务暂停结束与已发起通话收尾明确

修改前：暂停或结束后，已发起拨号、振铃及已接通通话的处理与话单曾列为CF-04待确认。

当次处理：依据用户转述的供应商答复，暂停或结束只管理任务调度，尚未呼叫的号码不再发起；已发起通话正常进行并生成正常话单。CF-04关闭，待确认主题由9项减为8项。既定暂停继续、结束不重开与正常话单回补规则保留。

核对重点：按暂停/结束分别核验未发起、拨号振铃、已接通三类状态；已有通话不强制挂断，不因任务状态改写通话结果，话单回补不恢复结束任务或触发后续重呼。来源D-047/SRC-077为user_relayed_supplier_feedback，官方快照不改，生产联调未验证。

说明与字段：[FS-10](functional-spec.html#FS-10)、[FS-11](functional-spec.html#FS-11)、[FS-14](functional-spec.html#FS-14)；FA-051,FA-052

接口依据：API-313、API-314、DOC-333、DOC-334、DOC-338

运行文件：[js/pages/cloud-task-workspace.js](../js/pages/cloud-task-workspace.js)

## D-046 软电话分机配置与号码租户授权解耦

修改前：坐席分机缺少管理入口；号码管理、任务候选及技能详情残留号码与技能组或坐席绑定规则，业务引用仍使用旧固定数据。

当次处理：坐席维护新增软电话分机配置，上线使用已保存字符串并保留前导零，缺失不猜测。号码仅设置总部/门店使用范围，任务和工作台按租户授权、状态与用途选号码。实际任务及当前呼入规则用于引用展示和操作保护。同步说明文档、附表、字段清单、流程时序和蓝图；本轮不重生开发交付包。

核对重点：分机保存、前导零、刷新恢复、空值阻断上线和本地上下线通过验证；号码无技能组或坐席仍可按授权使用，保留账号租户隔离及用途检查。当前呼入规则影响撤销授权，停用未删规则仍保护解绑；旧号码技能字段不参与判断。本地38组963项检查通过，不代表供应商真实接入。

说明与字段：[FS-04](functional-spec.html#FS-04)、[FS-05](functional-spec.html#FS-05)、[FS-06](functional-spec.html#FS-06)、[FS-08](functional-spec.html#FS-08)、[FS-11](functional-spec.html#FS-11)、[FS-12](functional-spec.html#FS-12)、[FS-13](functional-spec.html#FS-13)；FA-008,FA-009,FA-026,FA-029,FA-084,FA-094,FA-148,FA-170,FA-178

接口依据：API-304、API-308、API-310、API-352、DOC-336

运行文件：[js/components/seat-phone-config.js](../js/components/seat-phone-config.js)、[js/pages/agent-center.js](../js/pages/agent-center.js)、[js/components/account-seat.js](../js/components/account-seat.js)、[js/components/alicti-seat-operations.js](../js/components/alicti-seat-operations.js)、[js/pages/agent-workbench.js](../js/pages/agent-workbench.js)、[js/pages/resource-lines.js](../js/pages/resource-lines.js)、[js/components/resource-rules.js](../js/components/resource-rules.js)、[js/components/alicti-number-import.js](../js/components/alicti-number-import.js)、[js/components/alicti-inbound.js](../js/components/alicti-inbound.js)、[js/pages/cloud-task-workspace.js](../js/pages/cloud-task-workspace.js)

## D-045 当前原型回归与交付材料统一对齐

修改前：其他AI连续修改后，线路、队列、外呼组、班长管理、技能待提交和任务导入的当前功能与说明、图集及开发包存在差异。

当次处理：取消独立线路管理；队列独立菜单支持租户管理员及多技能关联；补齐独立外呼组与预测任务选用、班长页签及置忙置闲下线、在线追加技能待离线提交、人工外显号码独立选择和预测任务直接导入。按D-043完整队列字段及D-044无旧数据迁移统一现行文档、流程时序、蓝图与开发输出。

核对重点：回归角色与租户隔离、队列多技能保存恢复、外呼组响应包装与成员跨组变更在途保护；技能在线只允许新增待提交，等级变更仍须下线；不提供班长管理上线。官方事实与本地设计分开，实际测试结果以本轮验证报告为准，不把工具链legacy preflight视为S8通过。

说明与字段：[FS-04](functional-spec.html#FS-04)、[FS-05](functional-spec.html#FS-05)、[FS-06](functional-spec.html#FS-06)、[FS-09](functional-spec.html#FS-09)、[FS-11](functional-spec.html#FS-11)、[FS-12](functional-spec.html#FS-12)、[FS-19](functional-spec.html#FS-19)、[FS-21](functional-spec.html#FS-21)；FA-025,FA-059,FA-147,FA-148,FA-158,FA-165,FA-166,FA-169,FA-179,FA-180,FA-181,FA-182

接口依据：API-309、API-310、API-311、API-377、API-378、API-383、API-385、DOC-395

运行文件：[js/nav.js](../js/nav.js)、[js/pages/queue-management.js](../js/pages/queue-management.js)、[js/components/alicti-queues.js](../js/components/alicti-queues.js)、[js/components/outbound-groups.js](../js/components/outbound-groups.js)、[js/pages/outbound-group-management.js](../js/pages/outbound-group-management.js)、[js/components/alicti-demo.js](../js/components/alicti-demo.js)、[js/components/alicti-seat-operations.js](../js/components/alicti-seat-operations.js)、[js/pages/agent-workbench.js](../js/pages/agent-workbench.js)、[js/components/manual-skill-access.js](../js/components/manual-skill-access.js)、[js/pages/customer-tasks.js](../js/pages/customer-tasks.js)、[js/pages/cloud-task-workspace.js](../js/pages/cloud-task-workspace.js)

## D-044 原型移除历史数据兼容

修改前：原型保留跨版本历史数据兼容：存储键双向迁移、旧身份快照修复、旧账号区域字段忽略、坐席旧偏好行迁移、旧技能组缓存清除、旧重呼basic模式、预测分配缺省1回退、业务类型未分类回退、队列旧快照默认值比对及旧供应商术语运行时清洗。

当次处理：以上兼容机制全部移除。旧格式存储记录一律按无效处理并保留原存储；预测分配缺失时须重新选择，不再自动按1解释；重呼仅保留unset/advanced两种模式；报表不再提供未分类回退；队列表单缺字段按空值展示；页面与夹具中的旧供应商术语在源头清理，不再运行时改写。冻结决策D-018/D-020/D-035/D-037/D-041及BR-203的历史数据处理口径仍保留于生产规则文档。

核对重点：旧DEMO-ENT-001存储键不再读写；身份快照缺随包对象整体拒绝；含regionCode或未知字段的账号记录拒绝并保留原存储；坐席旧偏好行视为无效；技能组旧缓存不读取不删除；basic重呼草稿须重新配置；callStrategy缺失显示请重新选择且不进入请求；未分类选项与回退移除；队列旧快照缺字段按空值展示且不产生变更；页面不再运行时清洗供应商术语。

说明与字段：[FS-01](functional-spec.html#FS-01)、[FS-05](functional-spec.html#FS-05)、[FS-08](functional-spec.html#FS-08)、[FS-12](functional-spec.html#FS-12)、[FS-16](functional-spec.html#FS-16)；FA-163,FA-164,FA-165

接口依据：用户确认的本方业务规则，不新增AliCti参数。

运行文件：[js/alicti-storage.js](../js/alicti-storage.js)、[js/app.js](../js/app.js)、[js/components/alicti-accounts.js](../js/components/alicti-accounts.js)、[js/components/alicti-seat-operations.js](../js/components/alicti-seat-operations.js)、[js/components/alicti-retry.js](../js/components/alicti-retry.js)、[js/components/alicti-fields.js](../js/components/alicti-fields.js)、[js/components/queue-config.js](../js/components/queue-config.js)、[js/components/queue-detail.js](../js/components/queue-detail.js)、[js/components/customer-business.js](../js/components/customer-business.js)、[js/components/customer-directory.js](../js/components/customer-directory.js)、[js/pages/contact-center-settings.js](../js/pages/contact-center-settings.js)、[js/pages/report-center.js](../js/pages/report-center.js)、[js/components/alicti-adapter.js](../js/components/alicti-adapter.js)、[mock/data.js](../mock/data.js)、[mock/workbench-fixtures.js](../mock/workbench-fixtures.js)

## D-043 队列管理补齐官方必选字段配置

修改前：队列新增与编辑只暴露名称、编号、分配方式、优先级和四个等待字段，官方 queue/create 必选的等待语音、工号播报、呼叫下一坐席间隔、服务水平、VIP、允许排队状态及固定语音与位置播报没有配置入口，与接口快照和已有默认值规则不一致。

当次处理：新增与编辑补齐九个官方必选字段界面配置：等待与接听增加呼叫下一坐席间隔 retry 与服务水平 serviceLevel；语音与播报配置等待语音 class、坐席工号播报、固定语音播报与排队位置播报及位置播报周期；高级配置 VIP 支持与允许排队的坐席状态（置忙/通话中/振铃/无效/整理多选求和）。announceSound 开启时条件必填播报周期与语音文件，announcePosition 选 1/2 时条件必填不小于 2 的人数阈值；关闭的开关不附带空条件字段。默认值沿用接口默认与已声明本地选择；旧快照缺字段按默认值展示且不产生假变更。

核对重点：九个必选字段全部可配置且预填默认值；retry/serviceLevel 非负、vipSupport 0/1、joinEmpty 位求和 0–31、announceSound 0/1、announcePosition 0/1/2、位置播报周期非负；固定语音开启缺周期或文件拒绝，位置播报阈值小于2拒绝；maxPauseAgent 组与 youarenext 不开放；创建请求带全量必选默认，更新只传变化字段，旧快照未动新字段不重发，失败保留草稿。

说明与字段：[FS-05](functional-spec.html#FS-05)；FA-163,FA-164,FA-165

接口依据：API-377、API-378

运行文件：[js/components/queue-config.js](../js/components/queue-config.js)、[js/components/queue-detail.js](../js/components/queue-detail.js)、[js/components/alicti-queues.js](../js/components/alicti-queues.js)、[js/components/alicti-queue-contracts.js](../js/components/alicti-queue-contracts.js)、[mock/queue-resources.js](../mock/queue-resources.js)

## D-042 本人坐席电话操作与授权队列监控

修改前：原上线缺少完整状态与整理操作；前一版把官方设备和模式切换全部展开，与本项目统一软电话的业务范围不一致。

当次处理：坐席统一浏览器软电话，工作模式由平台固定为兼顾主动联系和预外呼；上线设置只留状态与选填原因，去掉设备和模式切换，保留暂停/恢复、完整下线与延长整理。保存业务记录后暂停等待本人恢复，失败分层核对；独立阿里班长权限才可监控本租户队列。

核对重点：登录固定设备3和String0，只有1/2状态及原因可配置；旧设备/模式/号码偏好忽略，直接非固定输入拒绝；pause有类型及必填原因、unpause无业务参数、logoutMode1和removeBinding显式0/1。设备/模式切换不开放且直接调用拒绝，整理30–600秒；未知只在原型通过LOCAL_MOCK.inspectSeatSession读取本地快照，正式DOC-344状态字段不证明设备/模式/截止时间，旧回执失效。业务保存不因pause失败回滚或重复；平台角色不代替供应商班长权限。未采用方法的命名冲突只作CF-11参考，不阻断；真实SDK接入仍需核验，原型不运行真实SDK。

说明与字段：[FS-11](functional-spec.html#FS-11)、[FS-12](functional-spec.html#FS-12)；FA-008,FA-009,FA-010,FA-011,FA-170,FA-171,FA-172,FA-173,FA-174,FA-175,FA-176,FA-177,FA-178

接口依据：API-304、DOC-339、DOC-344

运行文件：[js/components/alicti-seat-operations.js](../js/components/alicti-seat-operations.js)、[js/components/seat-operation-ui.js](../js/components/seat-operation-ui.js)、[mock/seat-operations.js](../mock/seat-operations.js)、[js/components/alicti-adapter.js](../js/components/alicti-adapter.js)、[js/pages/agent-workbench.js](../js/pages/agent-workbench.js)

## D-041 预测任务独立坐席分配方式

修改前：预测任务未展示独立分配方式，易与队列策略、技能等级混淆。

当次处理：呼叫安排增加默认折叠的坐席分配方式。新建预外呼默认当前空闲最长4；旧任务或草稿缺配置沿用官方随机1，保留历史。官方1–4字符串枚举在模板、复制、再次联系、确认和执行快照中一致；自动外呼不展示或提交。

核对重点：新建4、旧缺省1、合法数字响应转String、非法拒绝；自动IVR不带callStrategy，队列strategy/weight不注入任务，不依赖是否已配队列。

说明与字段：[FS-09](functional-spec.html#FS-09)；FA-169

接口依据：API-311

运行文件：[js/components/alicti-fields.js](../js/components/alicti-fields.js)、[js/pages/cloud-task-workspace.js](../js/pages/cloud-task-workspace.js)

## D-040 租户专用接听队列与管理员自主管理

修改前：技能组缺少队列的配置与核对入口；租户列表的账号显示与配置不一致。

当次处理：技能组新增接听队列列和直接接听配置入口，支持新增、关联、参数修改、成员技能核对与受保护解除。超管维护当前账号，租户管理员维护本租户，队列不跨租户共享，查看独立只读。租户列表展示已配置AliCti账号名称及ID。

核对重点：ADMIN只看选本租户候选且可完成管理，跨租户直接调用拒绝；同号唯一，原始工号和历史不变；技能与成员分开核对，空空不误判。既有队列关联只存本地映射，创建和部分更新是官方形状模拟请求；损坏、失败及旧版本保留原值，正式后端需事务。

说明与字段：[FS-02](functional-spec.html#FS-02)、[FS-05](functional-spec.html#FS-05)；FA-158,FA-159,FA-160,FA-161,FA-162,FA-163,FA-164,FA-165,FA-166,FA-167,FA-168,FA-155

接口依据：API-377、API-378、API-379、API-380、API-381、API-382、API-383、API-384、API-385、DOC-342

运行文件：[js/components/alicti-queue-contracts.js](../js/components/alicti-queue-contracts.js)、[js/components/alicti-queues.js](../js/components/alicti-queues.js)、[js/components/queue-config.js](../js/components/queue-config.js)、[js/pages/contact-center-settings.js](../js/pages/contact-center-settings.js)、[js/pages/account-tenant.js](../js/pages/account-tenant.js)、[mock/queue-resources.js](../mock/queue-resources.js)、[assets/css/queue-config.css](../assets/css/queue-config.css)

## D-039 账号详情只读，租户管理统一入口

修改前：账号查看中包含新增租户、管理租户、编辑、启用及进入账号使用等操作，关联数据又可打开更多抽屉，层级复杂。

当次处理：查看仅展示账号资料、状态、凭据配置及关联租户表格，底部仅关闭；列表中的租户数量直接打开只读清单。账号编辑启停保留列表，新增或编辑保存后回到列表。租户新增和管理统一从租户管理进入，新建表单选择已登记启用账号，包含尚无租户的新账号。

核对重点：查看不切换账号或租户，不写入资料及审计；关闭返回保留列表筛选和分页。移除详情资源历史的嵌套入口但保留原历史。跨账号新增成功后显示目标账号租户列表；先校验当前通话、未保存输入、权限和目标状态，既有业务归属锁不变。

说明与字段：[FS-01](functional-spec.html#FS-01)、[FS-02](functional-spec.html#FS-02)；FA-150,FA-151,FA-152,FA-155,FA-156

接口依据：用户确认的本方业务规则，不新增AliCti参数。

运行文件：[js/pages/alicti-accounts.js](../js/pages/alicti-accounts.js)、[js/pages/account-tenant.js](../js/pages/account-tenant.js)、[js/components/account-tenant-forms.js](../js/components/account-tenant-forms.js)、[assets/css/alicti-accounts.css](../assets/css/alicti-accounts.css)

## D-038 通话中记录，挂断后确认保存

修改前：坐席需等通话结束后才能填写处理结果与沟通记录，无法边沟通边记录。

当次处理：人工外呼从拨号时、呼入及预外呼分配从坐席接通后开放记录。处理结果、沟通备注和六项选填业务信息随输入暂存；静音、收起、返回及挂断保留同一草稿。挂断后确认保存，更新本通记录和客户档案。

核对重点：暂存不提交正式处理结果、不释放占用、不安排再次联系或永久拒呼；接听前不可填写。状态更新不重建输入区，联系事项只读；暂存失败保留当前输入，最终保存失败保留草稿和占用。刷新只恢复已持久化的原型会话，不能宣称恢复真实话路。

说明与字段：[FS-07](functional-spec.html#FS-07)、[FS-09](functional-spec.html#FS-09)、[FS-11](functional-spec.html#FS-11)、[FS-13](functional-spec.html#FS-13)、[FS-14](functional-spec.html#FS-14)；FA-107,FA-108,FA-109,FA-110,FA-111,FA-112,FA-113,FA-135,FA-142

接口依据：用户确认的本方业务规则，不新增AliCti参数。

运行文件：[js/pages/agent-workbench.js](../js/pages/agent-workbench.js)、[assets/css/agent-workbench.css](../assets/css/agent-workbench.css)

## D-037 移除账号服务区域字段

修改前：新增账号要求选择服务区域，但原型未使用它进行接口路由，增加了不必要的填写。

当次处理：移除新增/编辑、账号列表、详情及登录选择中的服务区域，取消必填、默认值和新保存字段。既有 v1 目录读取时仅忽略旧 regionCode，保留账号标识、版本及租户关联，后续合法保存使用无区域结构。

核对重点：不填区域可新增、编辑及启停；旧目录读取不被当作损坏且不自动写回。不得从 enterpriseId 猜测区域或默认华东1；正式接口地址属于后端接入配置，不恢复为业务输入。

说明与字段：[FS-01](functional-spec.html#FS-01)、[FS-02](functional-spec.html#FS-02)；FA-157

接口依据：用户确认的本方业务规则，不新增AliCti参数。

运行文件：[js/components/alicti-accounts.js](../js/components/alicti-accounts.js)、[js/pages/alicti-accounts.js](../js/pages/alicti-accounts.js)、[js/app.js](../js/app.js)

## D-036 AliCti 账号本地维护

修改前：供应商账号来自预置数据，缺少本地登记、资料维护和启停管理入口。

当次处理：系统管理增加仅超级管理员可用的 AliCti 账号管理，支持登记、查询、编辑、启停、关联总部或门店以及历史只读查看。一个租户关联一个账号，同一账号可关联多个租户；无租户的新账号可创建首个租户，全停用时仍可恢复管理。

核对重点：账号目录先于租户和登录范围恢复；configId、enterpriseId、客户/品牌保存后固定。跨标签版本冲突与存储失败不覆盖原记录，未保存切换不丢输入。停用不删除原业务、不调用供应商开通或挂断；凭据仅布尔登记，未宣称连接核验通过。

说明与字段：[FS-01](functional-spec.html#FS-01)、[FS-02](functional-spec.html#FS-02)、[FS-19](functional-spec.html#FS-19)；FA-001,FA-149,FA-150,FA-151,FA-152,FA-153,FA-154,FA-155,FA-156

接口依据：API-301

运行文件：[js/components/alicti-accounts.js](../js/components/alicti-accounts.js)、[js/pages/alicti-accounts.js](../js/pages/alicti-accounts.js)、[js/components/account-tenant-forms.js](../js/components/account-tenant-forms.js)、[js/app.js](../js/app.js)、[js/nav.js](../js/nav.js)、[assets/css/alicti-accounts.css](../assets/css/alicti-accounts.css)

## D-035 服务类型与租户技能组权限

修改前：技能模板和技能组均需超级管理员创建，租户管理员只能维护成员；同租户同模板只能一组，难以拆分白班与晚班团队。

当次处理：界面将技能模板称为服务类型。超级管理员创建当前enterpriseId品牌通用服务类型，ADMIN选择已有类型创建和配置本租户组；同租户同类型允许多组、组名租户内唯一，运营无配置权。各组独立成员、等级和号码范围，不继承其他同类型组。

核对重点：验证类型创建、ADMIN本租户增改、多组及组名唯一性、跨租户/跨账号/运营拒绝、成员号码隔离；原型清理旧技能演示缓存及失效成员号码引用，刷新不回灌；保留AliCti skillId及精确字符串cno契约，未真实同步不显示供应商已生效。

说明与字段：[FS-05](functional-spec.html#FS-05)、[FS-06](functional-spec.html#FS-06)；FA-022,FA-023,FA-024,FA-025,FA-026

接口依据：API-309、DOC-328、DOC-329、DOC-330

运行文件：[js/pages/contact-center-settings.js](../js/pages/contact-center-settings.js)、[js/components/manual-skill-access.js](../js/components/manual-skill-access.js)

## D-034 计划到店门店自由文本

修改前：计划到店门店只能从本地租户候选中选择，无法记录其他门店名称。

当次处理：客户处理结果中的计划到店门店改为选填文本框。按名称保存在通话快照和客户档案，线索成效按最新已填名称汇总并支持名称包含查询。

核对重点：输入不要求存在对应租户；改名或清空不残留旧门店ID，原名称不变可保留历史兼容ID；同通话清空仅撤销其贡献，后续留空不擦除其他历史已填值，权限仍按客户和通话判断。

说明与字段：[FS-07](functional-spec.html#FS-07)、[FS-11](functional-spec.html#FS-11)、[FS-14](functional-spec.html#FS-14)、[FS-16](functional-spec.html#FS-16)；FA-112,FA-113,FA-133,FA-134

接口依据：用户确认的本方业务规则，不新增AliCti参数。

运行文件：[js/components/customer-followup.js](../js/components/customer-followup.js)、[js/components/lead-report.js](../js/components/lead-report.js)、[js/components/report-data.js](../js/components/report-data.js)、[js/pages/report-center.js](../js/pages/report-center.js)

## D-033 从 AliCti 导入号码

修改前：已有添加号码流程需先选线路，缺少直接按AliCti账号查询、勾选并导入的入口。

当次处理：号码管理新增从AliCti导入，支持完整号码、启停筛选和跨页多选；确认平台线路与使用方向后保存原始号码属性，再设置总部、门店、技能组和关联坐席。

核对重点：已有号码不重复导入；停用号码可导入但保持停用；不改外显设置、不创建供应商号码。失败不新增，刷新恢复号码及所选新登记线路；使用范围另行保存。

说明与字段：[FS-05](functional-spec.html#FS-05)、[FS-06](functional-spec.html#FS-06)、[FS-12](functional-spec.html#FS-12)；FA-059,FA-060,FA-061,FA-062,FA-063,FA-064,FA-147,FA-148

接口依据：API-310

运行文件：[js/components/alicti-number-import.js](../js/components/alicti-number-import.js)、[mock/number-onboarding.js](../mock/number-onboarding.js)、[js/pages/resource-lines.js](../js/pages/resource-lines.js)、[js/components/number-import-history.js](../js/components/number-import-history.js)

## D-032 再次预外呼与待人工跟进

修改前：客户接通后需要再次联系时，缺少保留原线索和历史的新安排。

当次处理：已由坐席接听的客户可以再次安排；客户已接通而人工未接听的客户进入待人工跟进。选定后创建新的预外呼任务并设置联系时间，保留来源与同一线索历史。

核对重点：业务联系次数与供应商重呼round独立；在途、话后未保存、拒绝联系或已有未执行安排时阻止重复；原任务不重开，仅本地未开始安排可撤销，暂停仍占用。

说明与字段：[FS-07](functional-spec.html#FS-07)、[FS-09](functional-spec.html#FS-09)、[FS-10](functional-spec.html#FS-10)、[FS-11](functional-spec.html#FS-11)、[FS-14](functional-spec.html#FS-14)、[FS-16](functional-spec.html#FS-16)；FA-144,FA-145,FA-146

接口依据：用户确认的本方业务规则，不新增AliCti参数。

运行文件：[js/components/repeat-predictive.js](../js/components/repeat-predictive.js)、[js/pages/customer-tasks.js](../js/pages/customer-tasks.js)、[js/pages/cloud-task-workspace.js](../js/pages/cloud-task-workspace.js)、[js/components/customer-directory.js](../js/components/customer-directory.js)、[js/pages/cloud-call-records.js](../js/pages/cloud-call-records.js)

## D-031 租户运营工作台入口

修改前：租户运营的运营工作台与坐席工作台入口并存，身份不明确。

当次处理：当前租户有关联坐席的租户运营进入坐席工作台并隐藏运营工作台；无坐席关联时进入运营工作台。离线或临时停用不改变工作台身份。

核对重点：按当前账号、租户、供应商账号的非删除坐席关联判断；旧书签及返回入口遵循同一规则，不扩大原有菜单权限。

说明与字段：[FS-01](functional-spec.html#FS-01)、[FS-03](functional-spec.html#FS-03)、[FS-06](functional-spec.html#FS-06)、[FS-11](functional-spec.html#FS-11)；FA-143

接口依据：用户确认的本方业务规则，不新增AliCti参数。

运行文件：[js/nav.js](../js/nav.js)、[js/pages/agent-workbench.js](../js/pages/agent-workbench.js)

## D-030 呼入与预外呼分配接听

修改前：缺少坐席待接听及预外呼分配接听流程，来电演示设置复杂。

当次处理：坐席工作台承接呼入与预外呼分配来电；点击接听先等待结果，匹配的通话事件确认接听。来电演示默认两个直接入口，特殊场景收在更多演示场景。

核对重点：客户接通与人工接听分离；工号原值一致，关联任务和客户条目精确；重复、迟到、取消、未接听、失败重试及刷新恢复不串通话。

说明与字段：[FS-06](functional-spec.html#FS-06)、[FS-09](functional-spec.html#FS-09)、[FS-11](functional-spec.html#FS-11)、[FS-13](functional-spec.html#FS-13)、[FS-14](functional-spec.html#FS-14)；FA-140,FA-141,FA-142

接口依据：API-302、API-303、API-304、API-305、API-316

运行文件：[js/components/alicti-receiving.js](../js/components/alicti-receiving.js)、[js/pages/agent-workbench.js](../js/pages/agent-workbench.js)、[js/pages/scenario-demo.js](../js/pages/scenario-demo.js)

## D-029 线索成效与业务资料保存刷新

修改前：仅通话维度难以评估重复联系后的线索成效，业务信息首次保存与返回展示存在旧版本问题。

当次处理：新增线索成效，按授权范围内同品牌和账号的原线索编码汇总。首导入日期选线索，完整可见历史计算联系和跟进，提供六项业务资料筛选/展示及全部筛选导出；保存后返回抽屉刷新当前数据。

核对重点：同码跨批合并，同手机号异码分开，缺码独立；权限先过滤，首次保存与陈旧表单保护，导出不截当前页。

说明与字段：[FS-07](functional-spec.html#FS-07)、[FS-11](functional-spec.html#FS-11)、[FS-14](functional-spec.html#FS-14)、[FS-16](functional-spec.html#FS-16)；FA-129,FA-130,FA-131,FA-132,FA-133,FA-134

接口依据：用户确认的本方业务规则，不新增AliCti参数。

运行文件：[js/components/lead-report.js](../js/components/lead-report.js)、[js/pages/report-center.js](../js/pages/report-center.js)、[js/components/customer-followup.js](../js/components/customer-followup.js)、[mock/report-fixtures.js](../mock/report-fixtures.js)、[js/nav.js](../js/nav.js)

## D-028 报表接口与统计口径对齐

修改前：部分话单参与方、时长和累计次数混算，官方统计路径未纳入交付。

当次处理：按呼叫类型归一官方事实，采用任务累计与自动话单；补齐日报、坐席和队列纯适配边界，人工桥接与客户侧时长分开。CF-05按时间证据关闭，队列说明冲突独立列CF-14。

核对重点：秒/分钟/HH:mm:ss各自转换；未知不补零；calledCount含重呼；纯自动不计人工时长；原生适配不冒充页面已接入。

说明与字段：[FS-14](functional-spec.html#FS-14)、[FS-16](functional-spec.html#FS-16)；FA-115,FA-116,FA-117,FA-118,FA-119,FA-120,FA-121,FA-122,FA-123,FA-124,FA-125,FA-126,FA-127,FA-128

接口依据：API-360、API-361、API-362、API-363、API-364、API-365、API-366、API-367、API-368、DOC-369、DOC-370、DOC-371、DOC-372、DOC-373、DOC-374、DOC-375、DOC-376

运行文件：[js/components/alicti-report-facts.js](../js/components/alicti-report-facts.js)、[js/components/alicti-report-summary.js](../js/components/alicti-report-summary.js)、[js/components/report-metrics.js](../js/components/report-metrics.js)、[js/components/report-data.js](../js/components/report-data.js)、[mock/report-summaries.js](../mock/report-summaries.js)

## D-027 全原型回归修复

修改前：字段身份、失败回写及旧数据兼容存在问题。

当次处理：完成 RG-01 至 RG-16 与 K01 修复，统一精确身份和权限复核；客户关联及话后保存失败可恢复，保存成功后才更新共享数据。

核对重点：0012与12独立、旧表单拒绝覆盖、失败保留输入和占用、重试不重复历史；未知字段安全展示。

说明与字段：[FS-04](functional-spec.html#FS-04)、[FS-09](functional-spec.html#FS-09)、[FS-11](functional-spec.html#FS-11)、[FS-13](functional-spec.html#FS-13)、[FS-18](functional-spec.html#FS-18)、[FS-19](functional-spec.html#FS-19)；FA-135,FA-136,FA-137,FA-138,FA-139

接口依据：API-302、API-317、API-318、API-319

运行文件：[js/pages/cloud-task-workspace.js](../js/pages/cloud-task-workspace.js)、[js/pages/agent-workbench.js](../js/pages/agent-workbench.js)、[js/pages/system-center.js](../js/pages/system-center.js)

## D-026 线路、号码与使用坐席的连续操作

修改前：线路和号码概念抽象，添加来源与分配坐席的关系不清楚。

当次处理：按添加线路、添加已开通号码、设置使用坐席组织操作。已有资源从AliCti号码列表读取，新线路仅登记待供应商开通。号码按总部/门店、技能组逐层选择，一次保存使用范围，并展示实际成员。

核对重点：已开通号码提交前查询核验、重复和未知不新增；初始无使用授权；范围原子保存、历史关系及旧版本保护；外显号码与坐席接听设备分开。

说明与字段：[FS-05](functional-spec.html#FS-05)、[FS-06](functional-spec.html#FS-06)、[FS-12](functional-spec.html#FS-12)；FA-008,FA-029,FA-059,FA-084,FA-093,FA-094

接口依据：API-310、API-304、API-305、API-308、DOC-345

运行文件：[js/components/number-import-history.js](../js/components/number-import-history.js)、[js/pages/resource-lines.js](../js/pages/resource-lines.js)、[js/components/alicti-adapter.js](../js/components/alicti-adapter.js)、[mock/number-onboarding.js](../mock/number-onboarding.js)、[assets/css/resource-onboarding.css](../assets/css/resource-onboarding.css)、[assets/css/number-assignment.css](../assets/css/number-assignment.css)

## D-025 客户业务信息与通话快照

修改前：话务处理缺少客户线索、意向和到店计划信息。

当次处理：新增线索等级、意向等级、到店意向、试驾意向、计划到店时间、计划到店门店六项选填。话后和已有通话详情均可填写，保存当次快照并汇总到客户档案。

核对重点：新通话空值不覆盖其他通话非空值；同通话编辑清空只移除其贡献；历史快照独立、复合身份隔离、旧表单版本冲突和保存失败保护。

说明与字段：[FS-07](functional-spec.html#FS-07)、[FS-11](functional-spec.html#FS-11)、[FS-14](functional-spec.html#FS-14)；FA-107,FA-108,FA-109,FA-110,FA-111,FA-112,FA-113

接口依据：用户确认的本方业务规则，不新增AliCti参数。

运行文件：[js/components/customer-followup.js](../js/components/customer-followup.js)、[js/components/customer-directory.js](../js/components/customer-directory.js)、[js/pages/agent-workbench.js](../js/pages/agent-workbench.js)、[js/pages/customer-directory.js](../js/pages/customer-directory.js)、[js/pages/cloud-call-records.js](../js/pages/cloud-call-records.js)、[mock/customer-followup.js](../mock/customer-followup.js)

## D-024 呼入服务采用官方路由接口

修改前：原型创建流程未对齐已公开呼入路由接口。

当次处理：按ivrRouter/create、update、list、get、delete实现规则管理，支持语音导航、电话号码、分机三类目标和优先级、启停及可选条件；CF-10仅保留未明确的匹配和归属边界。

核对重点：目标对应字段、账号内唯一正优先级、active显式、以id更新、停用后删除、权限及失败未知处理。

说明与字段：[FS-13](functional-spec.html#FS-13)；FA-095,FA-096,FA-097,FA-098,FA-099,FA-100,FA-101,FA-102,FA-103,FA-104,FA-105,FA-106

接口依据：API-350、API-351、API-352、API-353、API-354、DOC-348、DOC-355、DOC-356、DOC-357、DOC-358、DOC-359

运行文件：[js/pages/inbound-routing.js](../js/pages/inbound-routing.js)、[js/pages/cloud-call-tasks.js](../js/pages/cloud-call-tasks.js)、[js/components/alicti-inbound.js](../js/components/alicti-inbound.js)、[mock/inbound-routing.js](../mock/inbound-routing.js)

## D-023 配置记录按原因处理

修改前：含义不明的“重新处理·待确认”阻断了具体处理。

当次处理：失败坐席可修改资料或查看原因；未知技能只查看原因。原失败原因、最新结果和修复历史分别保留，已成功记录禁止重复新增。

核对重点：修复关联原记录，刷新后结果保留；未知操作不盲目重放。

说明与字段：[FS-04](functional-spec.html#FS-04)、[FS-05](functional-spec.html#FS-05)、[FS-19](functional-spec.html#FS-19)；FA-114

接口依据：API-307、DOC-342、DOC-343

运行文件：[js/pages/agent-center.js](../js/pages/agent-center.js)、[js/components/account-seat.js](../js/components/account-seat.js)、[js/components/business-issues.js](../js/components/business-issues.js)

## D-022 已有坐席同步入口与来源

修改前：“导入已有坐席”的来源和用途不清楚。

当次处理：改为“从 AliCti 同步坐席”，显示来源账号与本地目标租户；query/get核对后保存本地归属，重复跳过，不新增供应商坐席。

核对重点：来源与目标分离；原工号字符串保留；归属冲突不覆盖。

说明与字段：[FS-04](functional-spec.html#FS-04)；FA-091

接口依据：DOC-342、DOC-343

运行文件：[js/pages/agent-center.js](../js/pages/agent-center.js)、[js/components/alicti-seat-import.js](../js/components/alicti-seat-import.js)

## 早期历史原文与来源

以下逐条保留 D-001、D-003～D-021 的原始决策内容；原始实施与发布流水继续保存在[项目记忆变更记录](../memory/change-log.md)，不因合并版本说明而删除。

## D-021 · 暂停继续及结束后的执行范围（2026-09-15）

- 来源SRC-053为用户本轮产品确认，类型`user_product_confirmation`，不是用户转述阿里反馈，不把本轮决定作为官方接口新增承诺或真实供应商响应保证。
- 用户确认暂停后可以继续；结束后不再执行后续呼叫，包含尚未执行的重呼。两类外呼任务一致采用该产品规则，不由本地设置重呼队列、恢复计时或新接口入参。D-017的暂停省略pauseDuration、继续get确认原任务status=2→start→get、接口受理不等于运行、失败未知保留历史不重放、已结束不重开保持。
- 已核实结束的任务收到迟到事件、话单或旧状态，只回补原通话、客户记录及统计；不重新开启、不继续或触发新重呼。状态矛盾保留原始证据并待核对，不擅自改变已确认的通话结果或结束原因。
- CF-04仍开放，但仅保留暂停/结束对已经发起的拨号或振铃、已接通通话如何收尾。未执行的后续呼叫和重呼执行范围已经明确，不再列为供应商问题；不擅自挂断正在进行的通话。
- D-020预测与自动外呼按号码状态重呼支持、关闭省略重呼参数，D-019常用设置默认收起等保持。版本`2026-09-15-task-execution-1`，附表v1.15；94字段仍68已修正/18已对齐/1待确认/7平台字段，9个供应商主题和3类接入准备。82功能、47页面、265规则、46官方来源、30模型、15适配、20任务及131计划验收保持；原官方快照不改写。

## 2026-09-18 用户修订：预外呼坐席重叠不阻断启动

本次确认覆盖 D-027 中本地任务坐席互斥规则。启动与继续不因共用坐席或坐席通话中而要求先暂停其他任务；其余权限、配置、资源及任务状态查询继续保留。不表示供应商并发支持已完成实测。

## 2026-09-20 外呼组与预测任务互斥（用户最新确认）

本条覆盖 2026-09-18 允许预测任务共用坐席的旧决定。一个坐席不能同时属于多个外呼组；同一外呼组同一时刻最多运行一个预测任务；同一坐席不能同时参与两个运行中的预测任务。按组与按指定坐席交叉校验，启动和继续均复检。确认暂停或结束的任务释放运行占用；状态未知先核对，不自动视为释放。转组仍按现有明确提示移出原组。此条依据用户产品要求，不冒充供应商新文档或真实联调证明。


## 2026-09-20 客户分配支持租户管理员（用户确认）
人工外呼客户可以分配给本租户已关联有效坐席的租户管理员或租户运营。候选及提交均检查账号、租户成员、坐席启用与允许接收任务；管理权限不自动取得个人坐席或跨租户分配资格。分配结果进入接收人坐席工作台的本人待联系名单。

## D-020 · 采用预测状态重呼支持并关闭CF-03（2026-09-15）

- 来源SRC-052：用户转述供应商确认预测外呼支持按号码状态重呼，性质为`user_relayed_supplier_feedback`；关闭处理另为当前项目采用口径。两者不冒充官方网页已修订或真实联调结果，原官方快照保持原文。
- 预测type=1与自动外呼type=2均使用一组`condition.sipCause`多码数组。开启时至少选择一个官方号码状态，次数、间隔与计时依据全部必填；旧basic配置缺状态仍由用户补选，不自动默认或丢码降级。校验通过后映射并创建任务，移除预测仅存草稿及创建、启动、继续的CF-03阻断；失败未知与接口受理不等于运行等规则保持。
- 关闭省略`retryStrategy`、`retryStrategyTimeType`及`templateName`，按不启用重呼处理，保留本地配置。此前关于省略时默认重呼的疑问缺少依据撤出，不作为供应商缺口；真实关闭行为纳入常规联调，不将项目采用表述为供应商默认行为保证。条件匹配、轮次、计数及调度交由阿里，不要求使用方梳理算法。
- FA-046已修正，CF-03关闭。当前94项映射为68已修正、18已对齐、1待确认（FA-068）、7平台字段；9个供应商确认主题和3类接入准备分别管理。D-017的暂停不传pauseDuration、继续get确认原任务status=2→start→get、已结束不重开，以及D-019常用设置默认收起与业务语言界面保持；其余未决不代为关闭。
- 版本`2026-09-15-retry-supported-1`，附表v1.14。82功能、47页面、265规则、46官方来源、30模型、15适配边界、20开发任务及131计划验收保持；本轮更新原型与交付资料，不代表真实接入或GitLab发布。

## D-019 · 精简任务创建页面与常用设置（2026-09-14）

- 用户反馈模板过于突出，预外呼及自动外呼创建页存在过多技术和模拟说明。本轮仅调整界面组织与文案，不新增业务功能或接口能力。
- 复用、保存常用设置统一放到必需资源之后的紧凑可选入口，默认收起；展开后沿用既有功能、权限、参数值及保存行为，收起不清空输入。
- 创建业务页面以必要填写和下一步操作为主，移除重复的模拟实现说明与技术细节；字段校验、资源不可用、保存失败及不能发起任务的实际原因保留，用业务语言解释。说明文档、接口核验与开发交付仍明确模拟及真实接入边界。
- D-018两类任务重呼状态必填、旧基础配置补选、预测条件映射待核验，以及D-017暂停继续控制规则保持不变；供应商确认统计不变。
- 版本2026-09-14-task-ui-1，附表v1.13。82功能、47页面、94字段映射（67/18/2/7）、265规则、46来源、30模型、15适配、20开发任务及131计划验收不变；本轮不新增业务功能或验收用例。

## D-018 · 两类任务统一保留重呼状态选择（2026-09-14）

本节保留当时决定；预测映射及关闭重呼疑问现由D-020替代，当前不再作为待确认或创建控制阻断。

- 用户明确要求预测外呼和自动外呼均可选择呼叫状态。两类任务开启重呼都必须选择至少一个官方号码状态，并填写次数、间隔与计时依据；不提供会隐藏状态选择的基础/高级切换。此界面范围覆盖D-007、D-010、D-016的旧类型限制。
- 旧基础策略缺状态时保留原输入并要求用户补选，不自动选择状态；关闭开关保留本地配置但不发送重呼字段。条件、轮次、计数和调度算法仍交阿里处理，本地不增加重呼引擎。
- 自动外呼按已明确的一组condition.sipCause多码JSON数组字符串映射。预测外呼保存完整本地配置、草稿及确认展示；实际条件传输/执行映射仍在FA-046/CF-03核验，不能静默丢弃状态退成基础对象，不能以本地配置宣称远端已创建或运行。
- 2026-09-14重新取得API-311与DOC-338，内容与现存快照逐字节一致：创建页把retryStrategy放入两类通用参数，TaskProperty仍限定高级模式目前仅自动外呼。供应商工作簿缺口总览I17未澄清预测条件范围。用户产品要求不等于供应商新增支持声明，原快照不改写。
- CF-03包括预测条件映射及关闭重呼意图的实际接入映射；不重新要求使用方设计条件算法。其余D-017暂停不传时长、继续get→start→get及结束不重开保持。
- 版本2026-09-14-retry-status-1，附表v1.12；46官方来源、94字段映射（67/18/2/7）、265规则、82功能、47页面、30模型、15适配、20开发任务、131计划验收保持；待确认字段仍FA-046/FA-068、供应商主题仍10项。

## D-017 · 暂停省略时长与继续任务（2026-09-14）

- 用户明确：pauseDuration为非必填，本期调用暂停接口始终不提交该字段；不提供暂停时长输入、分钟/秒转换、默认0解释或本地自动恢复计时。此决定替代D-013关于暂停时长的对应处理；旧草稿中的时长也不得重新进入请求。
- 用户转述阿里反馈：暂停后继续 = 再次调用/interface/v10/task/start，先task/get确认当前暂停态。该依据分类为用户转述供应商反馈，并非官方页面已更新；官方原文快照保留。
- 继续操作仍执行本地权限、归属和资源校验；前置task/get须成功、原taskId匹配且status=2才发送start，再通过task/get查证实际状态。start受理不等于运行；前置查询失败、未知、非暂停或ID不符不写，后续失败未知保留历史和待核对证据、不自动重放。
- 功能范围明确不做结束重新开启；供应商status=3、平台已完成/已终止均不可借继续入口重启。复制任务始终生成新草稿与新对象，不复用原供应商任务ID。
- CF-04收窄为暂停/结束对在途通话及已排队重呼的影响，用户本轮未答复这两项，不关闭整个主题。FA-051/FA-052按当前方案已修正；94映射仍67已修正、18已对齐、2待确认、7平台字段；待确认字段仍FA-046/FA-068，供应商主题仍10项。
- 版本2026-09-14-pause-resume-1，附表v1.11；官方来源仍46份，82功能、47页面、265规则、30模型、15适配边界、20任务及131待执行生产验收用例不变。本轮为本地原型和交付更新，不代表真实接口联调或GitLab发布。

## D-016 本地重呼开关与自动外呼选流（2026-09-14）

- 用户批准前轮五项建议：条件匹配、计数与轮次执行直接交由阿里，使用方无需梳理跨条件算法；本地不实现重呼调度引擎。本决定替代D-007/D-010中相关界面和待确认口径，不宣称供应商新确认了共享计数算法。
- 新任务重呼开关默认关闭；开启后重呼次数、间隔、计时依据必填，自动外呼高级模式还必须选择至少一个官方号码状态。关闭只省略全部重呼参数；本地开关不成为供应商字段。
- 两类任务共享基础重呼设置；依据DOC-338的范围限制，按状态高级策略仅开放自动外呼的一组多码配置。预测式高级重呼不在本期实现范围，不自行增加适配层重呼引擎。
- 普通页面统一使用“自动外呼”对应type=2，IVR表示可复用语音流程。自动外呼四步为选择语音流程、呼叫设置、选择客户、确认创建；预外呼保留客户与任务、呼叫安排、时间与重呼、确认四步。
- 自动外呼从ivrProfile/list取得资源，筛选当前enterpriseId、ivrType=1且本租户有外呼授权的条目，列表id映射到providerIvrId，按接口Int写ivrId；名称仅展示。listDetail可按需查详情，不作为发布、版本或外呼可用凭据；流程维护交由阿里。
- 常用设置仅为本地配置，不传供应商templateName。API-311说明省略/空参数会继承模板，因此本地关闭不能作为远端已关闭证明；CF-03收窄为正式接入时由开发与阿里核验关闭意图的映射，不再要求使用方解释轮次及计数。
- CF-10收窄为呼入发布/版本、共享号码分租户及兜底，自动外呼的资源列表来源已解决，真实资源授权归PRE-03。仍有2项字段待确认（FA-046、FA-068）、10个供应商确认主题和3类接入准备。
- 新增DOC-348/DOC-349两份官方来源，现46份快照；94项映射、265条规则、82项功能、47项页面、30模型、15适配边界、20开发任务、131待执行生产验收用例保持。版本2026-09-14-retry-ivr-1，附表v1.10。本轮为本地原型与交付文档改造，未发布GitLab或进行生产联调。

## D-015 统一RASR文本与预览转写门控（2026-09-14）

- 用户确认采用“RASR查询＋供应商截图的预览转写规则”。本期通话文本统一由rasrEvent/query按供应商uniqueId获取；API-321旧asr/get不作为当前实现路径。来源DOC-346/DOC-347及docs/supplier-clarifications.json，原文快照保持原貌。
- RASR result=0成功、-1失败；data为数组，text/botText为JSON字符串，解析后保留条目、字段来源和原始值。monitorSide=1坐席侧、2客户侧，webcall分别为第二侧/第一侧；botText始终为机器人，不映射为人工坐席。未知侧别显示来源未知，不猜测；任一文本来源结构异常时整份响应待核对，不用旧文本冒充成功。
- 预览规则的前提是企业已开启自动转写且按坐席过滤。isAsr=1且cdrIsAsr=1/不传才允许，仍需满足时长等规则；isAsr=0或cdrIsAsr=0均不转写。单次开启不能覆盖坐席关闭，此规则不推广至其他呼叫类型；企业真实开通及实际产文属于接入验证。
- 文本阅读、搜索及独立录音播放器保留。不会因允许转写就生成成功结果，不采用旧ASR的-2处理中语义，不由时间字段推算跨来源排序或播放定位；D-012取消的功能不恢复。
- FA-018、FA-078已修正，CF-02关闭。当前94项映射=67已修正/18已对齐/2待确认/7平台字段；10个未决供应商主题与3类接入准备。44份官方来源、1278条目录字段，规则附表v1.9，265规则。
- 同步当前原型、功能说明、附表、系统蓝图、确认清单与开发包。冻结输入与历史阶段不变；纯本地演示，未执行供应商业务请求，本轮未提交GitLab。

## D-014 工号统一字符串与身份精确匹配（2026-09-14）

- 用户转述供应商确认：鉴权文档cno的Int为笔误，实际所有接口均为String；鉴权与登录工号必须一致，0012与12是两个工号。该澄清覆盖当前工号类型契约，CF-01关闭、FA-005改为已修正；保留官方原文快照，不将澄清冒充已更新的官网正文。
- 鉴权与SDK登录原样保留数字文本及前导零，不转整数、不补零归一。坐席唯一性仍为enterpriseId＋完整cno；新增3–10位、非全零的规则不变，举例12不代表放宽新增范围。
- 未知批次重提检查按供应商账号和完整工号集合求交集，不再数值比较前导零工号。非字符串的查询工号及失败工号回执保留原始响应并标异常，不根据转换后的身份推断成功。旧演示标识迁移仅作用于明确的样例标识。
- 当前94项字段：65已修正、18已对齐、4待确认、7平台字段；剩余11个供应商确认主题与3类接入准备。附表v1.8，265条规则；功能说明、系统蓝图、字段清单与开发包同步更新。
- 本轮为本地演示与交付材料更新，不执行供应商业务请求、不改冻结输入或Loop阶段；未提交GitLab。

## D-013 供应商澄清后的五项调整（2026-09-14）

- 用户本轮确认按官方能力和字段调整、按接口导入、在线限制以接口为准、分钟与秒在本地转换、技能等级改为1–10。本决定替换D-008中技能1–999的旧范围；不改变D-012取消文本定位录音的范围。
- 号码采用POST enterpriseHotline/batchUpdateNumber，numberList为完整号码数组、最多1000，只发本次变化的status或九项外显用途。listPage以offset/limit查证顶层data数组；启停保留当前授权、路由和其他用途，不自动恢复任务。isIbRight是坐席侧外显，不是来电路由开关。
- 已有坐席通过query/get只读同步后在平台关联。query按data.agents[].agent解包；批量新建为连续cno/endCno、公共姓名/区号、最多100个，非任意行数组。起止同位数是本地输入约束。cnos/success/fail/other与本地保存分别记录，未知不重建、other不证明技能成功。
- agent/update和批量技能更新列出20023在线错误。本期统一先下线再修改，启用不代替本人电话登录，不实现在线例外，CF-09关闭；失败或状态未知保留原配置。
- 暂停处理已被D-017替代，当前省略pauseDuration、查询确认暂停后继续；本条仅保留决策演进标识，不作为当前实施依据。
- 技能等级统一1–10整数，小值优先。历史越界值保留并标待调整，修正前不作为有效成员；同席多项历史越界可一起修正，不静默截断旧值。
- 新增DOC-341至DOC-345共5份官方原文及7项采用映射。当前42份来源、94项映射（64已修正/18已对齐/5待确认/7平台字段）、265条附表；12个未决供应商主题与3类接入准备分别统计。
- 本次为当前原型局部改造和同步交付材料；冻结输入、历史评估及Loop阶段记录保留，当前开发以本决定和本版文档为准。未执行供应商业务请求；本轮未发布GitLab。

## D-012 取消文本到录音定位（2026-09-14）

- 用户明确“CF02的需求可以取消，不做这个录音定位”。取消范围为点击转写文本或片段时间跳转录音、逐字定位及随播放联动高亮；不再把 ASR 时间单位、起点和多文件音频衔接列为本期确认问题。
- 保留录音独立播放、暂停、倍速、音量、进度控制与下载，保留文本阅读和搜索。真实返回与演示样例使用相同的展示范围。
- CF-02 继续保留坐席 isAsr 与单次 cdrIsAsr 优先级、side 与客户/坐席对应关系两项疑问。FA-078 缩减为 ASR 说话方；仍为待确认，统计保持 6 项字段与 13 个供应商主题。
- 当前文档、规则 L-06/L-12/M-11、页面、模型、任务及验收说明同步取消定位。原始响应时间字段仅留存，不计算播放定位值；不新增 startMs 等定位字段。此为用户批准的范围缩减，不是供应商已支持或已澄清。
- 不改写历史冻结输入及 Loop 阶段记录；当前实施以本决定及本版功能说明为准。沿用既有 GitLab feat-test / Demo 同步本次交付修订。

## D-011 完整说明与开发交付 2026-09-13

- 用户明确要求依次生成完整功能说明、更新原附表、生成开发输出物并提交 GitLab。此新指令恢复 TODO-001，不等待周一；未决供应商问题仍保留具体编号和阻断分支。
- 主文档为 docs/functional-spec.html/.md/.json，原附表保留 docs/interaction.html#A–N 和既有规则编号；新增规则并更新到 v1.5。说明入口指向完整功能说明，左侧可进入附表、字段、确认项与开发包。
- 开发材料含当前功能/页面映射、37份官方快照、87项采用字段、本方逻辑数据模型、状态与权限、适配层模块、任务依赖、验收用例和启动提示。平台设计明确区别于供应商事实，不推定目标开发技术栈。
- 当前82项功能完整覆盖；审计导出原型仅提示，登记为本方待开发项IMP-01，不计供应商缺口。仍为6项字段、13个供应商主题与3类接入准备。
- 本次为用户明确请求的文档和开发交付，不改变冻结输入、启动规划或既有Loop阶段记录。交付验证单独记录，不借用既有S9日志宣称新全局门禁通过。
- GitLab沿用已确认的feat-test分支Demo目录，发布前核对远端最新提交，仅提交本次可独立运行交付包。

## D-010 重呼设置简化（2026-09-13）

- 用户进一步反馈重呼设置不好用。将常用配置收敛为号码状态（仅 IVR）、最大重呼次数和统一间隔；次数支持直接输入及加减，间隔用数值＋分钟/小时/天，不再每次拆填三个时间单位。
- 单位支持可精确换算到完整分钟的小数，如 0.5 小时为 30 分钟；不足一分钟、非整数次数和不安全数值阻断。单次输入最多 1000 次是本地演示渲染保护，不是供应商次数上限。
- 新草稿及重新配置默认 timeType=2（上次呼叫）；此为界面显式选择，接口默认1的事实不变。旧草稿的计时类型和原值保留，非均匀策略自动进入逐次设置。切换首次/上次计时时，合法时间序列按累计值/差值换算；不静默迁移旧配置。
- 逐次设置按需展开；用户选择统一间隔时，按首个间隔重建其余各次，规则摘要同步说明。最大次数始终不含首次；策略仍只使用原版本 policy 的 round/time 和基础对象或高级数组。
- 状态使用可搜索的多选菜单和可移除标签；保留16个官方编码及715/183的完整同码描述。预外呼仅配置次数/间隔，按状态的支持范围继续待确认；暂不设置不等于关闭重呼。
- 编辑时不重建当前输入框；未完成/非法输入存于草稿编辑状态，继续与提交前校验，不能用上一次有效策略绕过错误。编辑器状态不进入任务接口字段，模板与复制重新从原策略推导视图。
- 新增 alicti-retry-editor.js 承载呈现，AliCtiRetry 继续承担原契约校验和映射。更新当前字段报告操作描述与代码定位，87项字段和6项待确认结论不变。

## D-009 预外呼与 IVR 创建体验调整（2026-09-13）

- 用户反馈两类任务创建样式、顺序与术语难用，本轮直接调整既有任务工作区。流程统一为“任务与客户 → 呼叫安排 → 时间与重拨 → 确认创建”；取消独立技术前置检查页，权限和资源条件仍在继续与提交时校验。
- 预外呼先选接听团队，再选兼容的来电号码，保留 1–10 可用坐席与可选忙时语音流程。IVR 先选已发布语音流程，按需展开人工团队；纯 IVR 无坐席或执行队列必填。客户选择和重复号码处理放在首步；草稿不占用名单。
- 页面采用分区表单、四步导航、右侧任务预览和固定可见操作区。业务文案使用“来电号码”“坐席忙时”“再次呼叫”等用语，确认页展示实际名称；不在任务创建表单展示 JSON 或接口编号。接口事实仍在现有字段报告中维护。
- 新草稿默认“准备好后手动开始”，保留预约选择。该默认值为界面选择，不改写供应商默认值；手动与预约仍分别生成 autoStart=0/1。已存草稿和模板的配置不静默更改。
- 号码状态折叠多选，仍逐字复用官方 16 个编码的描述，715/183 不拆码。重拨次数、每次间隔与两种计时方式复用原映射；暂不设置保持默认行为待确认。未新增重拨适用范围。
- 兼容旧草稿步骤编号；返回修改可直接回到确认。局部选择保留滚动和焦点，错误就近显示；组织切换清空客户与组织资源。常用设置可带入并修改，切换为手动填写不清空当前值。
- 更新字段报告的代码证据定位，87 项映射及 6 项待确认结论不变。TODO-001 继续挂起，冻结输入与阶段配置不写入。

## D-008 已确认账号与演示范围收敛（2026-09-12）

- 用户明确enterpriseId=7522240；UUID不参与账号鉴权。主账号模型与已有演示存储采用该字符串，本地请求按文档输出Int。其他品牌保持独立。
- 用户明确仅演示，不计算实际MD5。原型使用32位小写格式占位sign并标记mock；不保存生产token、不连接供应商网关。
- 当时用户指定技能合法值域1–999；该范围已由D-013替换为当前1–10。新增、修改和全量替换均校验整数边界；不把该值域描述为供应商原文事实。
- 依官方正文补齐可演示的参数、状态与失败路径；真实资源、密钥与开通材料单列接入准备。task/start/get、技能增改和坐席删除有文档，不因未联调而列为接口缺失。
- 当前复核87项字段：56已修正、18已对齐、6待确认、7平台字段。原21项待确认关闭16项，保留5项；新增FA-068返回时间格式确认。合并资源/事件规则后13个确认主题，独立3类接入准备。
- 当前规则与待答复问题见docs/remaining-confirmations.html/json；只更新演示与现有说明，不生成D-006挂起的开发Agent交付包，不推进Loop全局阶段。

## D-007 按 AliCti 契约配置重呼（2026-09-12）

- 用户要求将原型改为当前接口支持的重呼方案。保持现有新建任务步骤，在执行时间页配置号码条件、逐轮间隔、最大重呼次数和起算方式。
- API-311 的 retryStrategy 为 JSON 字符串，基础模式传对象，高级模式传数组；retry 不含首次，轮次由 1 连续生成。retryStrategyTimeType 显式选择 1 首次或 2 上次呼叫；首次起算时严格递增。
- DOC-338 当前明确高级模式仅适用于自动外呼。因此自动 IVR 可先配置高级策略，实际号码识别开通仍待确认；预外呼使用基础策略，高级选项与字段输出均受限。
- 直接复用 API-327 的 16 个号码编码；715 和 183 的同码描述合并选中。多个编码使用同一组策略；不同条件组之间 round 的含义尚未明确，本轮不推断跨组轮次。
- 用户通过增删轮次设置次数。天、小时、分钟采用标准时间单位输入；每轮至少 1 分钟是本原型配置校验，示例默认 10 分钟不是供应商默认值。文档未给出重呼次数上限，不添加供应商上限声明。
- “暂不配置”仅省略可选参数，不等于已确认不重呼；供应商默认行为待确认。既存任务没有完整规则时，复制后要求重新配置，不用不完整值构造请求。
- 任务确认、保存、详情、复制和常用模板使用同一份规则；当前仅生成本地请求字段草稿。同步现有字段复核、附表和蓝图说明，未生成挂起中的开发交付包，未改动冻结输入或推进阶段。

## D-006 开发交付包暂缓生成（2026-09-11）

- 用户要求将 coding agent 开发交付包列为待办并挂起，周一（2026-09-14）等待供应商澄清后再考虑生成。
- 本次只记录待办和后续复议安排，不生成功能规格、开发任务包或其他新增开发交付文件。
- 供应商澄清后先更新具体字段和规则，再由用户决定是否继续生成；不把周一到达或已有原型验证通过当作继续生成的指令。
- 待办记录：memory/open-items.md / TODO-001。

## D-005 关联系统架构蓝图（2026-09-11）

- 用户要求在原型补充各系统、系统内模块、接口适配层与 AliCti 模块的关系。沿用 PAGE-207 关联系统交付页，作为当前已确认范围的说明补充；不新增实际业务接入或改写冻结图集。
- 系统总览呈现业务来源、使用人员 / 浏览器、统一外呼中台、平台适配层、AliCti、线路与客户电话、既有 AI 链路。未确定的业务系统名称按线索 / 售后 / 活动归类，当前数据关系标明文件导入，自动双向业务接口不作既定事实。
- 平台内部和适配层为本方设计职责视图，本原型采用本地模拟，真实服务端实现和联调不属于本轮验证；浏览器 CTILink / WebRTC 连接与后端 API、事件归集分开表达。
- AliCti 模块按公开接口功能归类，连接描述公开业务对象的归属、参数引用与结果产出。供应商内部服务、进程、数据库及部署拓扑未核实，不据此绘制已确认的内部调用。
- 所有关系保留平台职责、文档有依据、待确认三类标识；文档有依据只表示存在接口说明，不升级原有 partial 结论。
- 本次只实现和验证本地原型的说明视图，不推进已开放的完整功能点说明阶段；已有 GitLab 发布记录保留为前一发布版本。

## D-004 复用号码状态识别编码（2026-09-11）

- 用户明确“通话状态”指 AliCti《号码状态识别编码》，要求直接复用文档，不自定义状态。当前新增事实记录在 analysis/inputs/alicti-number-status-review.md，冻结输入包未修改。
- 通话记录原“通话状态”列展示号码状态编码及官方名称；详情用“通话进度”保留操作提示，客户 / 坐席接通与统计判定独立。
- 715 与 183 均保留三条官方描述；未核定具体项时待确认。人工 SIP 183 不直接解释成某一识别结果。缺失或未列出编码保留原值并待确认。
- 新增 API-327 仅为项目字段文档索引。人工、预测外呼按各自响应字段读取，保留原始数据；呼入及自动 IVR 的字段适用范围未核实，不补造映射。
- B-01 至 B-30 既有编号保持稳定；官方编码表新增 B-31 至 B-50，复用规则新增 B-51 至 B-60，并在附表 B 中置于最前。HTML 与 Markdown 同步更新为 v1.1。
- 新增代码例仅用于本地模拟；没有调用供应商业务接口，不把展示验证当成真实识别开通或联调通过。完整功能点说明仍按用户要求留待后续。

## D-003 说明文档先交付规则附表（2026-09-11）

- 用户明确要求先生成通话状态、任务状态、账号、租户、角色、坐席、技能组和总部与门店权限等规则附表，暂不生成功能点说明。
- 使用官方 request-deliverables 记录说明文档请求，输出 docs/interaction.html 与 docs/rules-appendix.md；保持既有表格文档视觉，附表目录置于左侧。
- 用户的本次范围及“新接口未明确支持则展示待确认”优先于 annotation-generator 的完整五章模板与禁止待确认占位约束。待确认项均写明具体缺口及依据，不使用空白占位。
- 本次仅归纳当前确认规则及现有原型行为；总部普通成员不自动取得门店范围，坐席关联不提升平台角色，文档不改变业务权限实现。
- 本次附表已完成；完整功能说明尚未被要求在本次生成，S9 文档阶段保持开放。不能将“附表校验通过”写成“完整功能说明门禁通过”。
- request-deliverables 重开 S9 后，单独运行 s9 预检会因旧 S9 pass 日志与新的 pending 状态不一致而失败；未手工改写阶段日志或冻结输入。原 S8 验证保持有效，本次另有附表静态及浏览器验证证据。

## D-001 静态原型架构

使用 HTML、CSS 和原生 JavaScript，不引入构建工具，除非后续需求明确要求。

## 冻结需求分析基线作为原型事实源

- Marker: `analysis-baseline:1bea81e5d803feeab25cf282bdce25e0bfa38b495981d5259b2c6b66eea4bbf7`
- Baseline: `ra-alicti独立原型需求分析-5706c147e80c7271`
- Fingerprint: `5706c147e80c7271b7be98cf76424c50f0c7339cf5bbb60aa71ecbc19dd8a706`
- Decision: 业务范围、规则、功能清单、接口结论、页面规划和图集均只读复用；原型 Loop 只新增展示与交互实现决策。
- Change rule: 任何业务事实变化都返回需求分析 Loop，并以新的 G3 冻结包开启新的原型迭代。
