2026-09-29 当前增量 D-086：AliCti技术新确认经用户转述，同一enterpriseId支持多个外显导航，一个导航可使用多个号码池。账号资料登记多个线下提供的名称与标识；两类任务创建时显式选择一个导航，可选择多个本租户号码池。D-083的单一默认导航及自动带入口径已被替代，其预测座席阈值规则仍有效；官方任务接口仅证明单任务一个`customerClidsGroup`和可选`clidPoolList`，导航查询、标识有效性与选号继续列CF-15联调。当前资料版本`2026-09-29-multiple-caller-navigation-1`、附表1.55。

2026-09-24 当前范围：原型与正式说明只覆盖 AliCti 云联络中心；登录后直接进入当前租户的工作台，租户配置只维护本系统信息。旧系统页面、菜单、计费样例和蓝图节点已退出当前交付；冻结输入与历史变更记录保留来源事实。

2026-09-24 当前增量 D-085：业务分类直接引用本租户独立字段库；分类有序fields数组每项为fieldId、enabled、required，数组位置决定顺序。取消独立业务模板实体，线索分类须直接含六项预置统计字段；D-074/D-077的三层关系仅留历史。字段及选项业务编码仍为本地选填映射，不进入AliCti请求；原型不兼容旧模板数据。当前资料版本`2026-09-24-business-category-fields-1`、附表1.54。

2026-09-23 当前增量 D-084：班长坐席事件日志页签按平台接收/观察时间倒序预览最近5条，“查看全部事件”进入每页10条的二级页；列表只显示时间、坐席/工号、事件或状态、来源。静态原型仅保存当前浏览器交互产生的演示记录，并非全租户实时采集；生产全量历史由本方后端订阅及回调汇总、授权过滤、去重、持久化并提供分页查询。API-316仅提供企业事件订阅，API-315 type=9仅证明状态变更推送可配置，DOC-344仅提供当前状态。当前资料版本`2026-09-23-supervisor-event-history-1`、附表1.53；[本轮原型与文档回归](../qa/supervisor-event-history-regression-20260923.json)通过，D-083及此前历史记录保留。

2026-09-23 当前增量 D-083：预测任务minAvailableAgentCount默认10、范围1–10，低于任务内可用座席数阈值自动暂停；仅autoStart=1且因座席不足暂停的任务在人数恢复达阈值时自动启动。每enterpriseId统一使用一个线下提供、由自建系统单值管理的固定默认外显导航，任务自动带入，号码池仍可选。自动恢复与供应商侧导航唯一性为用户转述技术口径，分别列CF-18/CF-15待真实联调。API-311/API-404只证明阈值、定时字段、不足暂停和单次任务导航字段。当前资料版本`2026-09-23-task-seat-threshold-default-navigation-1`、附表1.52；D-082及此前规则保留。

# 说明文档维护

2026-09-23 当前增量 D-082：班长监控把本租户今日已结束外呼统计、逐工号只读坐席状态与已有事件日志开放给未关联本人坐席或未上线的本租户ADMIN；队列实时状态和管理置忙、置闲、下线仍要求关联有效班长坐席、本人上线、供应商班长资格和本租户授权队列。班长监控内增设“监控概览／坐席事件日志”二级页签。DOC-344 `agentStatus/get`按企业和原工号查询状态；后台限频、租户过滤及页签布局是本方规则，未新增供应商能力声明。当前资料版本`2026-09-23-supervisor-monitor-access-1`、附表1.51；D-080事件来源和历史日志保留。

2026-09-23 任务外显接口纠偏：D-078核对API-311/API-404没有任务级指定号码字段后，两类新建任务只保留必选外显导航、可选号码池与客户接听等待时间；API-312的`taskTelList[].clid`只属于逐客户名单行，不能由任务或批次设置自动生成。该阶段资料版本`2026-09-23-task-caller-contract-1`，附表1.49；D-081阶段版本为`2026-09-23-tenant-number-pool-1`、附表1.50，补齐本租户号码池四接口。D-077业务配置统一入口继续适用。

上一版坐席退出增量：D-076规定普通退出固定提交`logoutMode=1`、`removeBinding=0`，保留AliCti侧坐席与接听分机的绑定，退出界面不提供解绑选项；本地坐席分机配置不清空。API-304原文支持`removeBinding=1`，仅作为接口能力保留，不用于本产品普通退出。上一版资料版本`2026-09-23-seat-logout-1`，附表1.47。

2026-09-23 任务设置增量：按用户提供的 AliCti 后台截图确认界面入口，以现有 API-311 / DOC-338 快照核对请求字段、值域和默认值。FS-08～FS-10、FA-200～FA-212、附表 C-77～C-81 记录描述与业务标签、任务完成和到时结束、仅当天生效、呼叫顺序、并发及预测专用流转、数值与预热。截图中的 `quotiety=3.00` 和 `maxWaitTime=15秒` 是表单示例；官方默认分别为 1 和 40 秒。截图归档在 `../references/user-task-settings/`，不作为供应商联调证据。

上一版业务基线 `2026-09-23-auto-task-fields-1`：D-075把预外呼和自动外呼的任务名称、描述、供应商业务标签及已采用通用设置贯通创建、确认、查看管理与编辑。已建自动任务从可见入口编辑名称、描述和标签，按原taskId仅提交实际改动，DOC-334回查成功才刷新当前设置与planSnapshot；失败或未知保留原值与输入。任务级语音流程名称优先本任务冻结快照；既有customerTimeout缺失显示未记录，不套新建默认30秒。API-404的ivrId/ivrName行描述虽涉及自动外呼，却落在仅type=1生效章节；已建type=2的IVR更改保持只读，CF-17待供应商确认，不宣称已支持或不支持。附表版本1.46；D-073原任务编辑继续适用；D-074业务模板规则现仅作历史，现行按D-085。

## 当前事实与生成源

- `functional_content.py` 是功能说明源，`build_delivery.py` 生成 HTML、Markdown 和结构化索引；当前原型仅展示 AliCti 云联络中心，正式功能说明为 23 个章节，FS-22～FS-24 对应分机、时间条件、业务分类。
- `input/functions.json` 和 `input/pages.json` 是当前范围的规范化清单。旧 `memory/feature-list.md` 与上级冻结分析仅用于追溯；重建时先筛除已移除范围，再写入规范化清单，不能把历史条目交给代码生成工具当作现行需求。
- 当前字段、附表覆盖与产品决定统一编写于 `input/consolidated-reviewed-facts.json`，由 `refresh_reviewed_facts.py` 更新正式字段清单、待确认、附表与decisions。附表正文保留 `../docs/rules-appendix.md` 及原编号；既有官方核验快照不改写。
- 简短开发入口为 `../docs/development.html` 和 `../docs/development.md`，按任务指向现有正式资料，不再另建模型、契约、任务或验收副本。官方接口快照与供应商澄清证据保存于 `../references/`。
- 流程源为 `../blueprint/current-business-diagrams.json` 与 `current-task-sequences.json`，蓝图源为 `../blueprint/build_blueprint.py`。不修改冻结分析输入或供应商原始快照来冒充新规则。
- 当前规则包括：技能不再关联 ServiceType；新增坐席技能非必填；预测分配采用指定坐席或外呼组；分机通过独立目录受控选择；电话工具条自动选择人工外显，正式保存后自动置闲；任务关联时间条件；业务分类页内统一维护分类及字段，分类直接引用字段库并配置 `required`。重呼草稿可未填完整地保存或退出，下一步与确认创建严格校验。再次联系保持原任务 ID，仅追加新的批次与执行条目，不新建任务；时间优先级手工必填正整数，同账号内唯一。
- 沿用展示规则：客户列表不固定“线索 / 意向”，导入记录不嵌套查看批次；任务列表不显示内部执行配置或下一次重呼推断。两类任务确认及设置详情共用三个信息分组，并展示本任务保存或冻结值。有接口来源时，通话结果、时间、工号和时长来自相应话单接口；来源或字段不可用不补本地值，纯本地演示记录仍按本地来源展示；关联任务按账号、租户、类型和任务标识核对，冲突不回退到其他任务。关联设置默认折叠，不带管理入口。

功能、字段、附表、流程时序、蓝图与待确认项使用同一事实版本。供应商原文、用户转述澄清、本地产品设计、原型模拟与生产目标分别记录。早期线路登记、号码绑定技能/坐席、技能团队选人、固定六项全部选填或保存后手动置闲仅是历史背景，不再描述为现行操作。

## 完整生成顺序

在原型根目录运行，使用 Python 标准库。先生成正式说明，再生成图集和变更记录，最后核验内容与链接。

```sh
python3 documentation/refresh_reviewed_facts.py
python3 documentation/build_delivery.py
python3 documentation/build_development_guide.py
python3 blueprint/build_blueprint.py
python3 blueprint/build_current_task_diagrams.py
python3 blueprint/build_current_business_diagrams.py
python3 documentation/build_exception_definitions.py
python3 documentation/build_change_log.py
python3 documentation/verify_documentation.py
```

开发阅读指引与正式文档共同维护，不生成 ZIP、文件哈希清单或重复的开发交付目录。正式文档更新后，复核阅读指引中的章节入口即可。

蓝图维护见 `../blueprint/README.md`。规范化输入及归档快照仍支持本地重建现有正式文档。版本说明和变更记录统一为 `change-log`，旧 `release-notes` 地址仅导出同一内容或跳转。

## 回归与事实边界

`qa/run-offline-checks.py` 检查本地契约及交互，`documentation/verify_documentation.py` 统一检查正式资料、链接与原文。本版验证见[坐席登录回归](../qa/seat-login-regression-20260923.json)；[工作模式专项回归](../qa/working-mode-regression-20260923.json)与[工作模式首版验证](../qa/working-mode-verification-20260922.json)保留为前一阶段证据。[账号多导航验证](../qa/multi-caller-navigation-verification-20260922.json)保留为此前版本证据。[单账号唯一业务租户验证](../qa/single-tenant-verification-20260922.json)保留为上一版证据。[文档同步验证](../qa/ui-field-docs-verification-20260921.json)、[任务详情对齐](../qa/task-detail-alignment-20260921.json)、[通话详情对齐](../qa/call-detail-alignment-20260921.json)、[原任务再次联系验证](../qa/same-task-repeat-verification-20260921.json)和[手工优先级验证](../qa/time-priority-manual-verification-20260921.json)保留为9月21日各对应修改的历史证据，不重新标成本轮验证。[9 月 20 日回归报告](../reviews/daily-regression-20260920.html)、[当日统一验证记录](../qa/daily-alignment-verification-20260920.json)、此前 `full-regression-20260920` 及其 `evidence-20260920` 均保留为历史，不重新标成本轮证据。

供应商主题当前为 9 项（CF-15外显导航，CF-16工作模式与呼入，CF-17自动任务IVR更新）、接入准备 3 类；本地回归通过不表示供应商真实接入完成。CF-11 的 `Monitor.setOffline` 回执标识等未决问题继续保留；当前调用采用官方字段及本地保护，不把模拟回执当作真实保证。

不迁移旧业务模型或建设历史字段配置版本；字段配置按当前业务分类读取。演示存储的无损压缩仅改变保存形式，读取时恢复原 JSON 内容。新建任务 `callStrategy` 默认 4，模板和复制缺失时要求重选；再次联系沿用原任务配置，不出现重选向导。在线只新增技能关系可待提交，等级修改、移除和实际提交仍须下线并由管理员操作。工具链历史门禁差异单独记录，不修改 Loop 阶段，不声明 S8 通过。

发布目标为 `feat-test / Demo`，实际发布状态以 GitLab 提交历史为准。

## 当前外显导航与预测座席阈值

D-086：AliCti线下提供外显导航标识，自建系统在既有账号资料中按enterpriseId登记多个名称与标识。预外呼和自动外呼创建时从当前账号显式选择一个，提交customerClidsCategory=5、单个customerClidsGroup；可从本租户AliCti hybridGroup/list选择多个号码池。未选择或账号无导航时阻断新任务，已建任务快照和原taskId保持。客户接听等待customerTimeout默认30秒、范围5–60秒。

已建任务启动/继续时若保存的customerClidsGroup已从当前账号目录移除，先阻断并从原任务编辑重新选择，以API-404 task/update提交新标识，DOC-334 task/get回查同一taskId及可读值后才启动。编辑期间目录变化则拒绝过期提交并保留输入。任务中心“演示座席人数变化”是折叠的本地演示入口，仅对运行/暂停的预外呼任务显示；输入观察人数只模拟状态变化，不读取实时座席人数或执行供应商任务操作。

预测任务minAvailableAgentCount默认10、范围1–10，任务内可用座席数低于阈值自动暂停。仅设置autoStart=1定时开始且因座席不足自动暂停的任务，人数恢复到不少于阈值时自动启动；手工暂停、号码停用保护暂停和结束不恢复。自动外呼不显示或提交该字段。API-311/API-404只证明阈值、定时字段、不足自动暂停及单次任务的外显导航和池字段；自动恢复待CF-18、导航有效性与选号待CF-15真实联调。原型只模拟请求和状态流转，不证明供应商已执行。

API-311/API-404无任务级指定号码字段；逐客户clid仅按API-312名单行显式提供时可选。D-083单一默认导航假设仅为历史阶段记录，以D-086为当前规则。任务号码池priority手动选填整数，数字越小越优先；空池、同优先级、运行中池变更和号码停用排除仍见CF-15。
