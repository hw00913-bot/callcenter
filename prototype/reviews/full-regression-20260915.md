# 云外呼原型全量回归问题报告

基线：`0b98f4b` · `2026-09-15-resource-ux-1` · 回归日期：2026-09-15。

本轮确认 **16 项新问题：7 项 P1、9 项 P2**。其中 **9 项接口对齐问题、7 项平台行为问题**；另有 **1 项已知未修复问题** 和 **2 项验证工具/记录问题**，分开计数。P1 表示本期应优先修复的身份、无效请求、状态反转或数据不可恢复问题；P2 表示其余已确认的功能、反馈和保护缺陷。级别用于本原型整改排序，不代表生产事故定级。

检查覆盖 33 个唯一主菜单，5 种角色/租户身份范围、2 个业务域，共 141 次菜单打开。页面错误和失败资源均为 0；更深的操作与异常检查仍发现下列问题。172 项既有字段/重呼/IVR/任务/模拟数据检查，以及 242 项交付一致性检查和 1114 个链接检查通过，说明现有检查未覆盖这些跨模块和异常分支，不能据此声称原型已经全面可用。

本次只新增回归报告及证据。300 个业务、模拟数据、说明、交付和流程源文件与回归前哈希一致；未修改实现、未发布 GitLab。证据中的数据均来自隔离原型会话，未发起供应商业务请求。

## 新问题总表

| 编号 | 优先级 | 分类 | 问题 | 关联接口或功能 |
|---|---|---|---|---|
| [RG-01](#rg-01) | P1 | 接口对齐 | 已有工号 12 被丢弃，空坐席列表仍可创建任务 | task/create · cnos；坐席同步与技能更新 · cno |
| [RG-02](#rg-02) | P1 | 接口对齐 | 显示用的脱敏号码进入外显参数 | task/importTaskTel · taskTelList[].clid |
| [RG-03](#rg-03) | P1 | 接口对齐 | 异账号坐席回执被归入当前账号 | 座席详细信息列表/详情 · enterpriseId |
| [RG-04](#rg-04) | P1 | 平台行为 | 任务保存失败，客户仍占用在不存在的任务中 | 本地任务创建与客户分配保存 |
| [RG-05](#rg-05) | P1 | 平台行为 | 话后保存失败仍提示成功，客户无法再联系 | 本地话后处理与客户名单保存 |
| [RG-06](#rg-06) | P1 | 平台行为 | 旧表单改备注，意外重新启用已停用的呼入规则 | ivrRouter/update · description / active |
| [RG-07](#rg-07) | P1 | 接口对齐 | 迟到失败话单反转已确认的客户接通结果 | 预测外呼话单 · status；本地事件与话单归集 |
| [RG-08](#rg-08) | P2 | 接口对齐 | 在线坐席同步成离线，并允许提交停用 | 坐席查询 · status；座席更新 · active |
| [RG-09](#rg-09) | P2 | 接口对齐 | 未知启用值在不同页面被解释成相反状态 | 坐席查询 · active |
| [RG-10](#rg-10) | P2 | 接口对齐 | 区号 abc 可保存成创建成功 | 座席新增/批量新增 · areaCode |
| [RG-11](#rg-11) | P2 | 接口对齐 | 同一坐席可同时运行两个预测任务 | task/create · cnos；task/start 运行约束 |
| [RG-12](#rg-12) | P2 | 接口对齐 | 人工未接听被报表算成结果未知 | 客户来电记录 · status / statusResult |
| [RG-13](#rg-13) | P2 | 平台行为 | 按录音过期筛选找不到已过期的记录 | 录音状态筛选；record/getUrl |
| [RG-14](#rg-14) | P2 | 平台行为 | 租户保存失败后表单关闭，刷新丢失新增数据 | 本地租户管理持久化 |
| [RG-15](#rg-15) | P2 | 平台行为 | 审计详情方法缺少权限复核 | 本地审计详情对象权限 |
| [RG-16](#rg-16) | P2 | 平台行为 | 电话首页未显示上线失败原因 | 电话首页鉴权/音频连接失败反馈 |

## 逐项复现与整改验收

### RG-01

**已有工号 12 被丢弃，空坐席列表仍可创建任务** · P1 · 接口对齐 · 来源编号 TASK-AUDIT-04。

复现方式：既有供应商坐席字段注入 + 正常页面处理器完整提交。

1. 在隔离会话中将已有效归属总部团队的坐席CCI-N-001的cno临时改为字符串12，模拟供应商已确认存在的短工号；其余属性不变。
2. 创建总部预外呼任务，选该坐席所在SG-ALI-HQ-SALES、NUM-400-8801、最少坐席1及一位客户，按四步完成创建。
3. 检查task/create草稿后恢复原工号。

实际：UI团队仍有有效成员，但taskFields把12过滤掉，生成callGroupType=1、cnos=""，pending有“所选团队尚无可用坐席工号”；errors为空导致submit继续生成成功响应和待启动任务。

预期：既有工号按D-014字符串原值保留；若必填坐席列表确实为空，则确认页阻止创建。

影响：合法的供应商既有坐席无法参与预测任务；演示仍显示创建成功，开发可能沿用无效请求。

整改方向：区分新增与既有工号校验；既有工号保持完整字符串。提交前必须检查所有必填字段，不能只检查 errors 而忽略无效必填参数。

验收：既有 12、0012 均可同步、改技能和创建预测任务，二者仍是不同身份；真正空的 cnos 不能提交。

边界：没有主张新建坐席的3–10位要求可以取消；此例只针对供应商已存在工号的读取、引用及任务映射。

同源影响：已有工号 `12` 在坐席查询结果映射、同步构建和技能更新也被新增长度规则拒绝；合并为本项，不重复计数。

依据：[D-014 / CF-01已关闭](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/docs/decisions.md>)；[API-311](<https://wiki.alicti.cn/html/wiki/API/预测式外呼/新增任务接口.html>)。

代码：[js/components/alicti-fields.js:49](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/js/components/alicti-fields.js:49>)；[js/components/alicti-fields.js:50](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/js/components/alicti-fields.js:50>)；[js/pages/cloud-task-workspace.js:645](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/js/pages/cloud-task-workspace.js:645>)；[js/components/alicti-fields.js:84](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/js/components/alicti-fields.js:84>)；[js/components/alicti-fields.js:129](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/js/components/alicti-fields.js:129>)；[js/components/alicti-seat-import.js:84](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/js/components/alicti-seat-import.js:84>)；[js/pages/agent-center.js:75](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/js/pages/agent-center.js:75>)。

完整证据：[task-audit.json · TASK-AUDIT-04](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/memory/evidence/full-regression-20260915/task-audit.json>)。

### RG-02

**显示用的脱敏号码进入外显参数** · P1 · 接口对齐 · 来源编号 TASK-AUDIT-01。

复现方式：代码调用（正常页面处理器，参数来自当前可选项；无业务数据注入）。

1. 进入总部预外呼新建任务，填写名称并选择一位未分配客户。
2. 接听团队选择 SG-ALI-HQ-SALES，来电号码选择可用的 NUM-400-8801，最少可用坐席填写1。
3. 依次通过四步确认创建，读取此任务 alictiImportDrafts。

实际：任务成功创建并模拟导入，clid=400****801，pending为空。选中资源原始 alictiNumber.hotline=4000001002。

预期：外显字段使用所选资源的完整原始热线号码4000001002；显示掩码不得进入接口号码参数。

影响：真实接口将收到非电话号码字符串，可能拒绝导入或无法按用户选择的号码外显；演示成功掩盖字段错误。

整改方向：从选中号码资源读取完整 hotline，将显示文案与请求原值分离；提交前检查号码参数不含掩码。

验收：选择现有脱敏显示号码，列表仍按原设计展示，导入草稿 clid 等于完整原始 hotline 且不含星号。

边界：此例使用现有遗留400号码的界面可选项；是否应允许此400号码外呼属于资源模块另行审核。即使资源类型修正，共享映射读取显示number而非原始hotline的问题仍存在。

依据：[API-312](<https://wiki.alicti.cn/html/wiki/API/预测式外呼/任务号码导入接口.html>)；[D-026](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/docs/decisions.md>)。

代码：[js/pages/cloud-task-workspace.js:715](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/js/pages/cloud-task-workspace.js:715>)；[js/components/alicti-fields.js:69](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/js/components/alicti-fields.js:69>)。

完整证据：[task-audit.json · TASK-AUDIT-01](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/memory/evidence/full-regression-20260915/task-audit.json>)。

### RG-03

**异账号坐席回执被归入当前账号** · P1 · 接口对齐 · 来源编号 RES-01。

复现方式：browser_supplier_shaped_fixture_injection。

1. 在隔离浏览器的已有坐席模拟响应池加入外层请求账号7522240、agent.enterpriseId=7522241、cno=88881的记录。
2. 超级管理员进入从 AliCti 同步坐席，目标租户为东风日产总部。
3. 翻到第二页，勾选工号88881并同步。

实际：返回坐席 enterpriseId=7522241，仍显示同步成功；本地新坐席 enterpriseId 被 buildAgent 重写成7522240，tenantId=TEN-NISSAN-HQ。

预期：比对请求账号、回执账号、所选工号和回执身份；不一致时保留异常证据并拒绝本地归属写入。

影响：来自不同供应商账号的同工号可能被错误认作当前身份；后续技能或启停请求会作用于错误账号下的同工号。

整改方向：核对请求、回执与本地目标的账号和工号身份，再进行归属保存；不匹配记录保留核对原因。

验收：请求 7522240，响应坐席账号 7522241 时不得同步成功；本地没有新归属，合法同账号记录仍可同步。

依据：[DOC-342](<https://wiki.alicti.cn/html/wiki/API/座席数据管理/座席详细信息列表获取.html>)；[DOC-343](<https://wiki.alicti.cn/html/wiki/API/座席数据管理/座席详细信息获取.html>)；[DOC-336](<https://wiki.alicti.cn/html/wiki/API/dataType/Agent.html>)；D-014；D-022。

代码：[js/components/alicti-fields.js:84](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/js/components/alicti-fields.js:84>)；[js/components/alicti-seat-import.js:84](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/js/components/alicti-seat-import.js:84>)；[js/components/alicti-seat-import.js:86](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/js/components/alicti-seat-import.js:86>)。

完整证据：[resource-audit.json · RES-01](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/memory/evidence/full-regression-20260915/resource-audit.json>)。

### RG-04

**任务保存失败，客户仍占用在不存在的任务中** · P1 · 平台行为 · 来源编号 TASK-AUDIT-02。

复现方式：异常存储注入（正常页面处理器创建，仅针对一个存储key抛QuotaExceededError）。

1. 总部新建预外呼，选择 SHOWCASE-HQ-SKILL-SALES、SHOWCASE-HQ-NUM、至少一位待分配客户，通过确认页。
2. 只令 sessionStorage.setItem(cloud-task-created-v1) 抛QuotaExceededError，其余存储正常，点击创建。
3. 恢复存储并刷新页面，检查任务列表和同一批次客户行。

实际：客户分配已先写入localStorage；任务sessionStorage保存抛异常且草稿未提交。刷新后任务不存在，客户仍携带失效taskId，不在待分配列表且不可按现有逻辑重新分配。

预期：失败应保留可重试草稿；任务和客户占用要么一并成功，要么回滚分配，不能留下孤立任务引用。

影响：浏览器配额满或保存异常时客户从可用名单消失，用户无法继续任务且需要人工恢复数据。

整改方向：任务、客户分配和草稿提交采用一致的成功边界；持久化失败时回滚占用或保留明确可恢复的未完成操作。

验收：只让任务存储失败：刷新后客户仍可分配或可恢复原操作，不存在悬空 taskId；恢复存储后重试只产生一个任务。

依据：[FS-08 / FUNC-247](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/docs/functional-spec.md>)；API-311 / API-312。

代码：[js/pages/cloud-task-workspace.js:688](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/js/pages/cloud-task-workspace.js:688>)；[js/pages/cloud-task-workspace.js:694](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/js/pages/cloud-task-workspace.js:694>)；[js/pages/cloud-task-workspace.js:67](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/js/pages/cloud-task-workspace.js:67>)；[js/pages/customer-tasks.js:40](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/js/pages/customer-tasks.js:40>)。

完整证据：[task-audit.json · TASK-AUDIT-02](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/memory/evidence/full-regression-20260915/task-audit.json>)。

### RG-05

**话后保存失败仍提示成功，客户无法再联系** · P1 · 平台行为 · 来源编号 CALL-A01。

复现方式：正常操作路径+单点浏览器存储故障注入。

1. 用王静账号进入电话首页并选择总部试驾邀约团队，上线后选择分配给本人的未联系客户。
2. 完成一通模拟外呼并结束，进入话后处理。
3. 仅令Storage.setItem(customer-task-batches-v1)抛QuotaExceededError，其余存储正常。
4. 选择已完成沟通并保存。

实际：通话处理状态已完成，弹窗关闭并提示客户名单和通话记录已更新；原客户activeCallId仍指向本通，followup=待联系，canCall=false，话后状态已清空。

预期：关联客户保存失败时不能完整宣称成功或丢失重试入口；须保留话后上下文或提供明确修复，成功后才解除客户占用。

影响：造成通话与客户跟进事实不一致，客户从可联系列表消失且无法按正常入口再次联系。

整改方向：关联客户写入失败时向上返回失败；保留话后输入和通话上下文，直到关联写入完整成功。

验收：只让客户名单保存失败：不提示整体成功，不清空话后重试入口；恢复后重试完成，客户占用解除且记录不重复。

依据：FS-11 坐席工作台与话后处理；D-025 本地客户业务快照；本方保存一致性要求，不涉及供应商接口失败。

代码：[js/pages/agent-workbench.js:39](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/js/pages/agent-workbench.js:39>)；[js/pages/agent-workbench.js:361](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/js/pages/agent-workbench.js:361>)；[js/pages/customer-tasks.js:157](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/js/pages/customer-tasks.js:157>)。

完整证据：[call-audit.json · CALL-A01](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/memory/evidence/full-regression-20260915/call-audit.json>)。

### RG-06

**旧表单改备注，意外重新启用已停用的呼入规则** · P1 · 平台行为 · 来源编号 TASK-AUDIT-03。

复现方式：异常并发状态注入 + 正常DOM填写/点击（第二处修改以service.setActive模拟；旧表单保存通过真实页面按钮）。

1. 以超级管理员打开启用状态的路由97001编辑抽屉，保持不提交。
2. 模拟另一处有效操作将同一路由active改为2并保存成功。
3. 原抽屉只修改备注，点击保存。

实际：旧表单仍携带active=1，save将其连同备注全量提交，路由恢复active=1；没有发现旧版本或提示覆盖状态。

预期：保存前检测规则已变化并要求刷新/确认，或仅更新用户实际编辑的字段；备注修改不得悄悄撤销他人的停用。

影响：本已关闭的接听规则可被意外重新启用，业务状态与用户操作意图相反。

整改方向：保存前核对当前规则；只提交用户实际修改的字段，或明确处理旧版本冲突。无需虚构供应商版本接口。

验收：打开启用规则后由另一处停用，原表单仅改备注并保存，active 保持 2 或提示需刷新；不能静默改回 1。

边界：接口未声明ETag或版本号；缺陷是平台旧表单覆盖，并非要求供应商提供未文档化并发接口。

依据：[API-351](<https://wiki.alicti.cn/html/wiki/API/配置管理/呼入路由管理/更新呼入路由设置接口.html>)。

代码：[js/pages/inbound-routing.js:77](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/js/pages/inbound-routing.js:77>)；[js/pages/inbound-routing.js:82](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/js/pages/inbound-routing.js:82>)；[js/components/alicti-inbound.js:94](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/js/components/alicti-inbound.js:94>)；[js/components/alicti-inbound.js:98](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/js/components/alicti-inbound.js:98>)。

完整证据：[task-audit.json · TASK-AUDIT-03](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/memory/evidence/full-regression-20260915/task-audit.json>)。

### RG-07

**迟到失败话单反转已确认的客户接通结果** · P1 · 接口对齐 · 来源编号 CALL-A02。

复现方式：白盒构造状态+实际共享归一函数执行。

1. 在同一通话CallState.start后接收客户侧Established，再finish；此时客户已接通。
2. 追加同账号预测话单alictiCdr.raw.status=40并调用页面和报表共用的CallState.view。
3. 读取CloudReportMetrics.stats。

实际：客户已接通变成未接通，issues为空；报表connected=0、unanswered=1、rate=0.0%。

预期：保留明确接通证据，对矛盾结束资料标待核对，不直接覆盖为未接通。

影响：同一通话详情、客户联系历史和统计可能被迟到失败消息反转。

整改方向：归集时保留明确接通证据；遇到矛盾回执记录原始值和核对事项，不能直接覆盖已确认结果。

验收：先确认客户接通再收到 status=40，同一通话保留接通证据且有矛盾提示；不重复建话单，不直接把接通率改为零。

依据：[预测外呼话单](<https://wiki.alicti.cn/html/wiki/API/通话记录/预测式外呼/预测外呼通话记录接口.html>)；D-021 迟到/矛盾结果保留原证据；附表B-11/BR-019；API-318 status=40客户未接听。

代码：[js/components/call-state.js:264](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/js/components/call-state.js:264>)。

完整证据：[call-audit.json · CALL-A02](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/memory/evidence/full-regression-20260915/call-audit.json>)。

### RG-08

**在线坐席同步成离线，并允许提交停用** · P2 · 接口对齐 · 来源编号 RES-02。

复现方式：browser_supplier_shaped_fixture_injection。

1. 在模拟已有坐席响应中设置cno88880、status=1、active=1。
2. 从 AliCti 同步到总部。
3. 查看本地话务状态，并触发该坐席停用。

实际：本地agentStatus被置为离线，inUse返回false；原型允许生成agent/update active=0请求并模拟显示已停用，没有按已知在线事实阻止维护。此证据不代表真实接口会成功停用在线坐席。

预期：按DOC-336保留status=0离线、status=1在线事实；在线或未明确查证的状态不能用新建默认离线覆盖。按D-013采用口径，先取得有效离线状态再允许维护。

影响：用户看到错误在线状态，原型允许提交本应先下线的配置动作并模拟成功；真实接口可返回API-308列出的20023在线错误，本审计未验证真实调用结果。

整改方向：同步映射在线事实，不能套用新建坐席的离线默认值；维护前核对可维护状态，并保留供应商拒绝原因。

验收：响应 status=1 不显示离线；在线或未核实的坐席不能被原型直接演示为停用成功。真实接口成功与否仍由返回决定。

依据：[DOC-336](<https://wiki.alicti.cn/html/wiki/API/dataType/Agent.html>)；[DOC-342](<https://wiki.alicti.cn/html/wiki/API/座席数据管理/座席详细信息列表获取.html>)；[DOC-344](<https://wiki.alicti.cn/html/wiki/API/座席数据管理/座席实时状态获取接口.html>)；[API-308](<https://wiki.alicti.cn/html/wiki/API/座席数据管理/座席更新.html>)；D-013；D-022。

代码：[js/components/alicti-seat-import.js:84](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/js/components/alicti-seat-import.js:84>)；[js/components/alicti-seat-import.js:86](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/js/components/alicti-seat-import.js:86>)；[js/pages/agent-center.js:78](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/js/pages/agent-center.js:78>)；[js/components/account-seat.js:83](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/js/components/account-seat.js:83>)；[js/components/alicti-demo.js:49](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/js/components/alicti-demo.js:49>)。

完整证据：[resource-audit.json · RES-02](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/memory/evidence/full-regression-20260915/resource-audit.json>)。

### RG-09

**未知启用值在不同页面被解释成相反状态** · P2 · 接口对齐 · 来源编号 RES-03。

复现方式：browser_supplier_shaped_fixture_injection。

1. 模拟cno88882返回active=9。
2. 打开同步列表，观察配置状态，再选中同步。
3. 查看保存后的 lifecycleStatus、acceptNewTasks 与同步结果。

实际：列表以 active===1 否则停用显示为停用；保存时 active===0 否则启用，最终 lifecycleStatus=已启用、acceptNewTasks=false，并计入成功。

预期：仅映射0/1。缺失或未知值显示待核对，不隐式解释启用/停用，更不能写入自相矛盾状态。

影响：未知供应商状态被冒认为成功配置，影响维护按钮和坐席可用性判断。

整改方向：只映射文档明确值，未知或缺失值保留为待核对；列表、详情、可接任务状态使用同一映射。

验收：active=9 或缺失时不显示已启用/已停用，不计作成功同步；active=0/1 的合法映射保持一致。

依据：[DOC-336](<https://wiki.alicti.cn/html/wiki/API/dataType/Agent.html>)；[DOC-342](<https://wiki.alicti.cn/html/wiki/API/座席数据管理/座席详细信息列表获取.html>)；D-022。

代码：[js/components/alicti-fields.js:84](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/js/components/alicti-fields.js:84>)；[js/components/alicti-seat-import.js:43](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/js/components/alicti-seat-import.js:43>)；[js/components/alicti-seat-import.js:86](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/js/components/alicti-seat-import.js:86>)。

完整证据：[resource-audit.json · RES-03](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/memory/evidence/full-regression-20260915/resource-audit.json>)。

### RG-10

**区号 abc 可保存成创建成功** · P2 · 接口对齐 · 来源编号 RES-05。

复现方式：ordinary_browser_form。

1. 新增坐席填写审计区号、cno88910，区号填abc。
2. 点击保存并重新加载页面。

实际：成功保存坐席，alictiCreateDraft.fields.areaCode=abc；刷新后仍保留。批量 seatBatchFields 同样只检查非空。

预期：官方对areaCode仅写“区号格式”，未给出精确长度或正则。至少拒绝abc这类明显非区号文本并保留表单提示；完整区号值域须另行核实，不能自行声称某个长度或正则为官方规则。

影响：明显不符合区号语义的必填值仍被模拟开通成功，不能作为字段级对齐已完成的证据；本审计未调用真实创建接口，不断言真实回执的具体错误码。

整改方向：拒绝明显不符合区号格式的输入并保留表单；官方未给出的精确长度和正则不得冒充官方规则。

验收：单个和批量新增填写 abc 时均不生成成功记录，显示区号格式提示；合法区号仍可提交。

依据：[API-307](<https://wiki.alicti.cn/html/wiki/API/座席数据管理/座席新增.html>)；[DOC-341](<https://wiki.alicti.cn/html/wiki/API/座席数据管理/座席批量新增.html>)。

代码：[js/pages/agent-center.js:75](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/js/pages/agent-center.js:75>)；[js/components/alicti-fields.js:106](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/js/components/alicti-fields.js:106>)。

完整证据：[resource-audit.json · RES-05](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/memory/evidence/full-regression-20260915/resource-audit.json>)。

### RG-11

**同一坐席可同时运行两个预测任务** · P2 · 接口对齐 · 来源编号 TASK-AUDIT-05。

复现方式：代码调用（两个新任务通过正常页面处理器创建；启动调用页面使用的适配器确认后入口，没有注入任务状态或请求字段）。

1. 总部创建两个全新的预测任务，均选择SG-ALI-HQ-SALES和坐席1001，各分配不同的客户。
2. 先启动“审计-互斥甲”，其task/get确认status=1。
3. 再启动“审计-互斥乙”，检查两个任务当前状态及其创建cnos。

实际：两次启动均ok=true，两任务同enterpriseId=7522240、cnos="1001"，均显示执行中。guard只检查单任务状态、名单和资源，没有检查其他运行任务占用同一cno。

预期：发现已运行任务占用同一enterpriseId+cno时阻止第二任务启动/继续，或正确演示供应商拒绝；不能将违反已明确规则的双运行状态展示为成功。

影响：原型让使用者认为同一坐席可并行执行多个任务；交付开发后与API已声明限制冲突。

整改方向：启动及继续时检查同账号同工号的运行任务占用，并正确呈现供应商可能的拒绝；明确该限制与本地资源范围。

验收：两个新任务同 enterpriseId、同 cno：第一个运行后，第二个不能同时模拟成功；结束第一个后再按规则启动。

边界：所有响应明确mock，本发现不指真实AliCti允许并行，只指本地保护与成功演示不符合明确契约。

依据：[API-311](<https://wiki.alicti.cn/html/wiki/API/预测式外呼/新增任务接口.html>)；[FS-10 / FA-036](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/docs/functional-spec.md>)。

代码：[js/components/alicti-task-control.js:19](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/js/components/alicti-task-control.js:19>)；[js/components/alicti-task-control.js:25](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/js/components/alicti-task-control.js:25>)；[js/pages/cloud-task-workspace.js:965](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/js/pages/cloud-task-workspace.js:965>)。

完整证据：[task-audit.json · TASK-AUDIT-05](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/memory/evidence/full-regression-20260915/task-audit.json>)。

### RG-12

**人工未接听被报表算成结果未知** · P2 · 接口对齐 · 来源编号 CALL-A04。

复现方式：按官方明确状态构造话单并执行实际归一与统计函数。

1. 构造已结束呼入记录：status=人工未接听，statusResult=振铃未接，存在系统answerTime。
2. normalizeCdr返回customerAnswered=true、agentAnswered=false。
3. 将记录交给CallState.view和CloudReportMetrics.stats。

实际：CallState未传递agentAnswered=false；humanUnanswered=0、humanPending=1、humanKnown=0。

预期：官方明确的人工未接听应保留为人工未接通，不应丢成未知；此判断不依赖响应时间单位。

影响：呼入、坐席及技能人工未接通数量和人工接通率分母失真。

整改方向：在共享通话视图和指标之间完整传递人工接听的 true/false/unknown，不丢弃明确的 false。

验收：status=人工未接听 时 humanUnanswered=1、humanPending=0；系统应答不等于人工接通。

依据：[客户来电记录](<https://wiki.alicti.cn/html/wiki/API/通话记录/来电/客户来电记录接口.html>)；API-319 返回status字符串枚举：人工未接听；FA-069/FA-086。

代码：[js/components/alicti-fields.js:220](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/js/components/alicti-fields.js:220>)；[js/components/call-state.js:268](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/js/components/call-state.js:268>)；[js/components/report-metrics.js:67](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/js/components/report-metrics.js:67>)。

完整证据：[call-audit.json · CALL-A04](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/memory/evidence/full-regression-20260915/call-audit.json>)。

### RG-13

**按录音过期筛选找不到已过期的记录** · P2 · 平台行为 · 来源编号 CALL-A05。

复现方式：构造官方record/getUrl成功响应及已明确过期时间，实际页面筛选。

1. 在授权通话上提供alictiRecording={result:0,data:合法HTTPS地址}与过去的recordingUrlExpiresAt。
2. 按通话编号查询可见该记录，录音显示链接已过期。
3. 选择录音状态=录音链接已过期并查询。

实际：列表变成0条；resolve返回链接已过期，recordRows按录音链接已过期严格比较。

预期：统一状态枚举或映射，过期筛选应返回这条已知过期记录。

影响：用户无法通过提供的筛选入口找出需刷新地址的录音。

整改方向：录音状态使用统一标识，显示文字可以不同但筛选不得直接比较不一致的中文标签。

验收：已明确过期的记录在不筛选及过期筛选下均出现；其他状态不会混入。

依据：[录音状态筛选；record/getUrl](<https://wiki.alicti.cn/html/wiki/API/通话记录/获取通话录音地址接口.html>)；API-320 默认有效期可配置，过期重新获取；已有明确过期时间，本例未把默认120分钟当实际到期时刻。

代码：[js/components/alicti-fields.js:230](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/js/components/alicti-fields.js:230>)；[js/components/call-media.js:38](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/js/components/call-media.js:38>)；[js/pages/cloud-call-records.js:87](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/js/pages/cloud-call-records.js:87>)。

完整证据：[call-audit.json · CALL-A05](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/memory/evidence/full-regression-20260915/call-audit.json>)。

### RG-14

**租户保存失败后表单关闭，刷新丢失新增数据** · P2 · 平台行为 · 来源编号 RES-06。

复现方式：browser_storage_failure_injection。

1. 超级管理员新增租户审计存储失败，勾选云呼叫。
2. 仅对unified-call-demo-identities-v1注入浏览器存储满异常，点击确定。
3. 恢复存储写入，刷新页面对比。

实际：租户数量4→5，内存已有新租户，表单关闭；异常未捕获，没有保留编辑入口。持久化没有新记录，刷新后租户消失。

预期：持久化成功后再更新业务状态并关闭表单；失败应保留输入、显示失败且不提交内存状态。

影响：用户无法区分真实保存与临时内存改变，重复录入或刷新会丢失配置；账号新增/成员编辑也采用相同先修改后持久化路径（本次动态复现限定租户新增）。

整改方向：保存成功后才提交页面状态和关闭表单；异常时保留输入并显示失败。

验收：仅令身份存储失败时不出现虚假的新增租户，表单与输入保留；恢复存储后可正常保存和刷新。

依据：平台本地保存的基本成功/失败边界；非供应商API缺口。。

代码：[js/components/account-tenant-forms.js:229](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/js/components/account-tenant-forms.js:229>)；[js/components/account-tenant-forms.js:237](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/js/components/account-tenant-forms.js:237>)；[js/app.js:86](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/js/app.js:86>)；[js/pages/account-tenant.js:486](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/js/pages/account-tenant.js:486>)。

完整证据：[resource-audit.json · RES-06](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/memory/evidence/full-regression-20260915/resource-audit.json>)。

### RG-15

**审计详情方法缺少权限复核** · P2 · 平台行为 · 来源编号 CALL-A03。

复现方式：白盒直接调用公开页面方法，未找到正常菜单越权路径。

1. 登录总部运营王静。
2. 确认system.audit=false且对上海门店审计authorizeObject返回false。
3. 调用Pages[system-center].openAudit(SHOWCASE-SH-AUDIT-3)。

实际：显示上海门店操作人、对象、租户及前后配置。

预期：详情入口再次核对当前角色和目标对象范围，无权时拒绝展示。

影响：前端授权不一致，开发复用此入口时易遗漏鉴权；这不是已证实的生产数据泄露。

整改方向：详情方法同时检查菜单权限和目标对象范围；不要仅依赖上一级菜单隐藏。生产后端仍需独立鉴权。

验收：无审计权限或无目标租户范围时直接调用详情也被拒绝；有权角色可打开同一条记录。

依据：本方角色与租户范围规则；FS-19 审计。

代码：[js/pages/system-center.js:21](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/js/pages/system-center.js:21>)。

完整证据：[call-audit.json · CALL-A03](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/memory/evidence/full-regression-20260915/call-audit.json>)。

### RG-16

**电话首页未显示上线失败原因** · P2 · 平台行为 · 来源编号 CALL-A06。

复现方式：正常电话首页上线，选择内置失败演示情景。

1. 进入门店周岚电话首页，选择可用技能组。
2. 将内置电话情景置为media-error或expired，点击上线并等待调用结束。
3. 比较电话首页与在同一状态打开的通话弹窗。

实际：坐席保持离线，但首页没有失败原因或seat-error，最后进度仍为连接音频/申请登录材料；同一状态打开弹窗可见音频连接失败错误。

预期：当前执行上线操作的首页应显示失败原因并允许按原因重试。

影响：用户无法分辨登录资料失效、媒体失败还是仍在连接，无法按提示处理。

整改方向：首页与通话弹窗复用失败状态展示，停止过时的连接进度，提供对应的重试入口。

验收：内置 expired、media-error 场景均保持离线，并在发起操作的首页显示具体原因和可执行的重试。

依据：FS-12 电话登录及媒体就绪分别判断；API-302/API-303 相关登录链路；失败反馈为本方交互要求。

代码：[js/pages/agent-workbench.js:226](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/js/pages/agent-workbench.js:226>)；[js/pages/agent-workbench.js:254](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/js/pages/agent-workbench.js:254>)；[js/pages/agent-workbench.js:458](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/js/pages/agent-workbench.js:458>)。

完整证据：[call-audit.json · CALL-A06](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/memory/evidence/full-regression-20260915/call-audit.json>)。

## 已知未修复与验证问题

- **K-01 · 两个旧VIEW样例详情崩溃**：TypeError: Cannot read properties of undefined (reading length)，详情打不开；样例缺trace和type/impact等。 已记载于异常定义边界，仍未修复。证据：[call-smoke.json](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/memory/evidence/full-regression-20260915/call-smoke.json>)。
- **Q-01 · 交付浏览器检查仍硬编码旧蓝图版本**：原脚本执行停在 blueprint current version，预期 v1.7，当前蓝图为 v1.8；其后分支未执行。 更新与版本相关的校验依据，并在修复后重跑整条脚本；本轮不修改脚本以制造通过。 证据：[full-audit-delivery-browser-results.txt](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/memory/evidence/full-regression-20260915/full-audit-delivery-browser-results.txt>)。
- **Q-02 · 历史工作流状态和验证记录不一致**：S8 预检查失败：stage-log 写 S9 pass、workflow 写 pending，旧步骤缺结构化证据。另有旧式导航字符串断言，不能直接等同当前页面故障。 核对历史记录与工具适配；保持现有失败证据，不回填虚假的阶段通过。本次独立回归没有推进工作流阶段。 证据：[workflow-preflight.txt](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/memory/evidence/full-regression-20260915/workflow-preflight.txt>)。

## 观察项，不计确认缺陷

- 批量新增 `result=-1`：仅证明请求失败，没有证据证明零创建或已回滚。不能要求直接重放；建议完善失败原因与查证入口。复核后已从初步问题清单移出。
- 常用设置保留当前重呼状态是现有明确验收口径，本轮不判错；新草稿与主动关闭是否应区分可以后续讨论。
- 常用设置刷新后消失已观察到，但本期跨刷新生命周期未明确；不作为本轮接口对齐缺陷。
- 既有坐席同步后的远端技能保留、多窗口配置竞争等尚未完成动态复现，留在模块未测范围，不写成既成故障。

## 覆盖和未测范围

| 章节 | 模块 | 本轮验证 | 边界与结论 |
|---|---|---|---|
| FS-01 | 登录与工作范围 | 角色/租户/业务域切换，前导零工号登录，范围复核 | 入口与主要权限路径；未测全部跨品牌组合 |
| FS-02 | 租户与产品授权 | 新增、保存、刷新、越权拒绝；存储失败注入 | 发现 RG-14；未测全部租户迁移组合 |
| FS-03 | 账号成员与坐席关联 | 新增、手机号跨租户复用、单租户停用、刷新保持 | 已测正向路径通过；未做双浏览器同账号竞争 |
| FS-04 | 坐席开通、同步、配置 | 单个/批量必填校验，同步回执身份/状态，失败回执 | 发现 RG-01/03/08/09/10；未遍历全部错误码及未知回执组合 |
| FS-05 | 技能组与多技能等级 | 等级 1–10、清空、跨租户拒绝、创建/更新字段静态检查 | 发现 RG-01；本轮未重走所有新增组及 queryAgentSkill 远端保留流程 |
| FS-06 | 线路、号码与使用坐席 | 资源语义、范围保存重开与刷新、非超管拒绝、跨账号不可用 | 发现共用外显映射 RG-02；未逐个重走所有号码添加失败场景 |
| FS-07 | 客户导入分配与档案 | CSV 引号/重复/编码，分配、本人范围、刷新；关联保存异常 | 正常导入分配 5 项通过；关联保存问题见 RG-04/05；六业务字段全排列未穷举 |
| FS-08 | 两类外呼任务创建 | 四步页面处理器提交、接口草稿、工号与外显、存储失败 | 发现 RG-01/02/04；追加纯 DOM 外显复现未完成，不冒充鼠标全路径通过 |
| FS-09 | 重呼条件次数与间隔 | 两类任务相同状态多选、关闭省略、round、时间、无效值 | 已测映射通过；真实供应商调度和轮次执行未联调 |
| FS-10 | 任务查询执行与历史 | 启动、暂停、继续、结束；失败未知、错 ID、跨账号、坐席互斥 | 发现 RG-11；在途通话收尾仍是既有 CF-04，未新增默认重呼疑问 |
| FS-11 | 工作台与话后处理 | 分配客户外呼、结束、保存、占用释放、写入失败 | 发现 RG-05；注入故障与正常流程明确区分 |
| FS-12 | 电话上线及通话控制 | 0012 登录、通话中退出阻断、媒体及鉴权失败 | 发现 RG-16；未进行真实麦克风/供应商网络联调 |
| FS-13 | 呼入服务与规则 | IVR/电话/分机三种目标各创建、改、停用、删；旧表单覆盖 | 发现 RG-06；条件组合及真实租户归属仍按既有 CF-10 |
| FS-14 | 通话记录与结果 | 号码编码多义/缺失/未知；官方话单状态、迟到矛盾 | 发现 RG-07/12；未重定义供应商状态 |
| FS-15 | 录音与转写 | 播放、速度音量、关闭释放、范围切换、RASR 多种回执、过期筛选 | 发现 RG-13；已取消的录音文本定位不算缺口 |
| FS-16 | 六类云报表与导出 | 六表范围、强传越界条件、CSV、日期/分页/时间单位边界 | 发现 RG-07/12；客户报表实际下载，其余 CSV 生成核对 |
| FS-17 | 运营工作台 | 各角色首页、菜单与对象入口；电话首页交互 | 入口检查通过；未穷举每个统计卡片的所有下钻组合 |
| FS-18 | 通话数据异常 | 入口、列表及样例详情 | 已知 K-01 仍可复现；未将历史样例缺字段算作新接口缺口 |
| FS-19 | 操作审计 | 角色范围与详情调用权限，异常显示 | 发现 RG-15，仅白盒复现；既有审计导出 IMP-01 不重复计缺陷 |
| FS-20 | 既有智能外呼与分钟账户 | 五种身份范围下 AI 域可见菜单及页面入口 | 本轮为入口冒烟，不声称计费、充值及场景全流程已重新深测 |

## 依据与验证边界

代码与当前56份官方来源快照/已采纳用户确认对照；6份关键官方页面本轮重新读取；隔离浏览器角色入口、主路径、页面处理器、官方形状回执、故障注入和白盒检查。未发起供应商业务请求。

- 没有真实签名、供应商请求、拨号、录音生成或调度验收；不能据此声称生产接口已联调。
- 33 个菜单入口已覆盖，不等于每项业务的全部状态、组合和并发场景已穷尽；按模块列出深测与未测范围。
- 部分发现通过异常回执或存储故障注入，白盒权限项未找到普通界面越权路径，不是已证实的生产泄露。
- 本轮保留既有供应商未决事项，不重开已关闭 CF-01/02/03，不补造默认重呼行为，取消的录音定位不列缺口。

优先修复 RG-01～RG-07，然后统一状态、校验、筛选和反馈。每项修复应针对本报告的复现输入验证，重新覆盖相关模块与共享映射，而不是只补一个“页面可打开”检查。

[机器可读问题清单](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/reviews/full-regression-20260915.json>) · [浏览版报告](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/reviews/full-regression-20260915.html>) · [角色菜单证据](</Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/memory/evidence/full-regression-20260915/role-menu-smoke.json>)
