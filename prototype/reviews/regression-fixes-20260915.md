# 原型回归修复结果

本轮已修复并针对性验证 16 项新问题及 1 项既有异常详情崩溃。原始审计报告保留，修复状态以本报告为准。

|编号|问题|修复后行为|
|---|---|---|
|RG-01|已有工号 12 被丢弃，空坐席列表仍可创建任务|已有工号按字符串原值同步、引用和修改技能，保留 12 与 0012 的区别。空或非法坐席列表不能创建或启动预测任务；新建坐席仍保留原长度要求。|
|RG-02|显示用的脱敏号码进入外显参数|任务名单导入使用资源中完整的 hotline；页面脱敏文字不再进入 clid。只有脱敏值而缺少完整号码时提示重新核对。|
|RG-03|异账号坐席回执被归入当前账号|同步前核对返回坐席的账号和工号；异账号、错工号记录不能勾选或写入本地归属。|
|RG-04|任务保存失败，客户仍占用在不存在的任务中|任务、客户占用和草稿均保存成功才展示创建成功。中途失败按恢复记录撤回本次变更；刷新后可恢复并重试，保护其他客户的后续修改。|
|RG-05|话后保存失败仍提示成功，客户无法再联系|话后处理未完整保存时保留通话、填写内容和重试入口，不提示整体成功。即使恢复写入也失败，持久化记录仍为待填写；刷新重试后只保留一条联系历史。|
|RG-06|旧表单改备注，意外重新启用已停用的呼入规则|提交呼入规则前重新核对编辑时的快照。规则已被其他操作修改时拒绝旧表单覆盖，保留输入并提示重新打开。|
|RG-07|迟到失败话单反转已确认的客户接通结果|迟到的失败话单不会抹除已确认接通事件；保留原始状态并标出矛盾，通话列表和报表共用这一判断。|
|RG-08|在线坐席同步成离线，并允许提交停用|按供应商状态区分在线、离线和待核对。在线或状态未核实的坐席须先确认下线，不能直接演示为维护成功。|
|RG-09|未知启用值在不同页面被解释成相反状态|启用状态只接受明确的 0/1。缺失或未知值显示核对原因，不默认成已启用或已停用，也不计作同步成功。|
|RG-10|区号 abc 可保存成创建成功|单个和批量新增均校验区号为数字，拒绝 abc 等格式；不额外编造官方未规定的区号长度。|
|RG-11|同一坐席可同时运行两个预测任务|启动或继续前检查同账号、同工号是否被运行任务占用；暂停或结束后按当前状态重新判断。结束的任务仍不能重新开启。|
|RG-12|人工未接听被报表算成结果未知|供应商明确返回人工未接听时计入人工未接听，系统应答与人工接通分别统计；缺少人工时长时不自行补造。|
|RG-13|按录音过期筛选找不到已过期的记录|录音过期展示与筛选采用一致状态，选择过期能够找到对应记录。|
|RG-14|租户保存失败后表单关闭，刷新丢失新增数据|租户、账号、成员新增编辑及启停先保存候选数据，再更新界面共享状态。失败时原数据不变，表单和输入保留，重试后刷新保持一致。|
|RG-15|审计详情方法缺少权限复核|操作审计详情每次打开和上下文变化后均重新检查菜单与对象权限；无权直接调用也会拒绝。|
|RG-16|电话首页未显示上线失败原因|电话首页直接展示鉴权或媒体初始化失败原因；失败保持离线，并可在原入口重试。|
|K-01|历史通话异常样例详情崩溃|补齐旧异常样例的必要结构，并兼容缺少 trace 等字段的历史记录，异常详情可正常打开。|

验证：196项自动检查；资源44项、管理20项、任务36项、通话31项浏览器针对检查；另复验141次主菜单打开（33个菜单）、5项客户正常流程及54项现有交付页面检查。各报告未出现未捕获页面错误或失败资源。

## 逐项证据

- **RG-01**：[shared-fields-results.json](../memory/evidence/regression-fixes-20260915/shared-fields-results.json)、[resources-results.json](../memory/evidence/regression-fixes-20260915/resources-results.json)、[tasks-verification.json](../memory/evidence/regression-fixes-20260915/tasks-verification.json)。验收：既有 12、0012 均可同步、改技能和创建预测任务，二者仍是不同身份；真正空的 cnos 不能提交。
- **RG-02**：[shared-fields-results.json](../memory/evidence/regression-fixes-20260915/shared-fields-results.json)、[tasks-verification.json](../memory/evidence/regression-fixes-20260915/tasks-verification.json)。验收：选择现有脱敏显示号码，列表仍按原设计展示，导入草稿 clid 等于完整原始 hotline 且不含星号。
- **RG-03**：[resources-results.json](../memory/evidence/regression-fixes-20260915/resources-results.json)。验收：请求 7522240，响应坐席账号 7522241 时不得同步成功；本地没有新归属，合法同账号记录仍可同步。
- **RG-04**：[tasks-verification.json](../memory/evidence/regression-fixes-20260915/tasks-verification.json)、[node-results.json](../memory/evidence/regression-fixes-20260915/node-results.json)。验收：只让任务存储失败：刷新后客户仍可分配或可恢复原操作，不存在悬空 taskId；恢复存储后重试只产生一个任务。
- **RG-05**：[calls-verification.json](../memory/evidence/regression-fixes-20260915/calls-verification.json)。验收：只让客户名单保存失败：不提示整体成功，不清空话后重试入口；恢复后重试完成，客户占用解除且记录不重复。
- **RG-06**：[tasks-verification.json](../memory/evidence/regression-fixes-20260915/tasks-verification.json)。验收：打开启用规则后由另一处停用，原表单仅改备注并保存，active 保持 2 或提示需刷新；不能静默改回 1。
- **RG-07**：[calls-verification.json](../memory/evidence/regression-fixes-20260915/calls-verification.json)、[node-results.json](../memory/evidence/regression-fixes-20260915/node-results.json)。验收：先确认客户接通再收到 status=40，同一通话保留接通证据且有矛盾提示；不重复建话单，不直接把接通率改为零。
- **RG-08**：[resources-results.json](../memory/evidence/regression-fixes-20260915/resources-results.json)。验收：响应 status=1 不显示离线；在线或未核实的坐席不能被原型直接演示为停用成功。真实接口成功与否仍由返回决定。
- **RG-09**：[resources-results.json](../memory/evidence/regression-fixes-20260915/resources-results.json)。验收：active=9 或缺失时不显示已启用/已停用，不计作成功同步；active=0/1 的合法映射保持一致。
- **RG-10**：[shared-fields-results.json](../memory/evidence/regression-fixes-20260915/shared-fields-results.json)、[resources-results.json](../memory/evidence/regression-fixes-20260915/resources-results.json)。验收：单个和批量新增填写 abc 时均不生成成功记录，显示区号格式提示；合法区号仍可提交。
- **RG-11**：[tasks-verification.json](../memory/evidence/regression-fixes-20260915/tasks-verification.json)。验收：两个新任务同 enterpriseId、同 cno：第一个运行后，第二个不能同时模拟成功；结束第一个后再按规则启动。
- **RG-12**：[calls-verification.json](../memory/evidence/regression-fixes-20260915/calls-verification.json)、[node-results.json](../memory/evidence/regression-fixes-20260915/node-results.json)。验收：status=人工未接听 时 humanUnanswered=1、humanPending=0；系统应答不等于人工接通。
- **RG-13**：[calls-verification.json](../memory/evidence/regression-fixes-20260915/calls-verification.json)。验收：已明确过期的记录在不筛选及过期筛选下均出现；其他状态不会混入。
- **RG-14**：[management-results.json](../memory/evidence/regression-fixes-20260915/management-results.json)。验收：仅令身份存储失败时不出现虚假的新增租户，表单与输入保留；恢复存储后可正常保存和刷新。
- **RG-15**：[calls-verification.json](../memory/evidence/regression-fixes-20260915/calls-verification.json)。验收：无审计权限或无目标租户范围时直接调用详情也被拒绝；有权角色可打开同一条记录。
- **RG-16**：[calls-verification.json](../memory/evidence/regression-fixes-20260915/calls-verification.json)。验收：内置 expired、media-error 场景均保持离线，并在发起操作的首页显示具体原因和可执行的重试。
- **K-01**：[calls-verification.json](../memory/evidence/regression-fixes-20260915/calls-verification.json)。验收：总部、门店旧样例及缺少 trace 的记录可打开，不出现页面脚本错误。

## 范围与限制

- 本轮为本地原型回归修复，使用模拟供应商回执及定点存储故障；未进行真实供应商签名、拨号、调度或业务联调。
- 17项问题均有针对性复验；菜单打开覆盖不等于每项业务所有组合和并发场景均已穷尽。
- 持续无法写入浏览器存储时保留恢复入口，不能保证用户手动清除存储或恢复记录后的数据可恢复。
- 说明文档、附表、流程、开发交付包未同步本轮改动；现有交付页面54项检查只验证展示和链接，不代表开发包已包含本轮修复。
- 历史工作流状态与验证日志格式问题（Q-02）维持原记录，不推进或补写S8/S9通过状态；不影响此次经用户授权的独立修复。

未提交或发布GitLab。180个说明、交付、流程及配置来源文件未变，冻结需求基线核验通过。
