# 项目记忆 — 当前迭代 云呼叫中心 v1.1.0 正式需求对齐原型

## 项目定位

- 项目名称：云呼叫中心
- 当前迭代：云呼叫中心 v1.1.0 正式需求对齐原型
- 需求版本：1.1.0
- 冻结基线：`ra-云呼叫中心-v1.1.0-原始需求重新分析草稿-676248563fbe9e8e` / `676248563fbe9e8e4daf04b88d37af45b92d8d653b4e1ba524acbcca0e3143d2`
- 类型：无构建步骤的静态前端演示原型
- 入口：`index.html`

## 产品目标

DCC决定业务导入与本次priority；接口先鉴权/归一完整请求requestId幂等，仅新ID按tenant/原supplierTaskId/leadCode固定phone归组。每有效新行新record/单号batch，逐行可选Boolean isNewBatch missing=false，true独立主、false/缺省最近已保存同组主下新子、无主自动首主，root保存回执；无需DCC上一批次/不虚构parent。精准vendorfileId/实际batch/call事件每次结果匹配保持，旧请求重传原root不变。取消每日查询/衰减/旧priority继承，原时间审计，53失败/快照下载/超管应用管理/同任务本次priority FIFO保持。手工原输入/提交前最终priority独立拆批，不新增DCC协议。 SRC-087/088回归对齐应用五个独立操作、密钥/token用途简化与常驻预外呼入口；CSV当前草稿/精确删除反馈/未可信SIP后续更新纳入判据，再由正式流程核验进入后续阶段。

## 目标用户

- 超管
- 运营人员

## 核心页面列表

- `PAGE-001` 应用接入列表：系统设置 / 应用接入管理；场景 ["SC-005"]；时序 ["SEQ-005"]；功能 ["FUNC-018", "FUNC-019", "FUNC-020", "FUNC-001", "FUNC-021"]
- `PAGE-002` 预外呼任务记录页：云呼叫 / 预外呼 / 任务 / 记录页；场景 ["SC-001", "SC-002", "SC-003", "SC-004"]；时序 ["SEQ-001", "SEQ-002", "SEQ-003", "SEQ-004", "SEQ-006", "SEQ-007", "SEQ-009"]；功能 ["FUNC-004", "FUNC-005", "FUNC-006", "FUNC-009", "FUNC-010", "FUNC-011", "FUNC-012", "FUNC-013", "FUNC-015", "FUNC-016", "FUNC-017"]
- `PAGE-003` 新增应用：系统设置 / 应用接入管理；场景 ["SC-005"]；时序 ["SEQ-005"]；功能 ["FUNC-019"]
- `PAGE-004` 应用详情：系统设置 / 应用接入管理；场景 ["SC-005"]；时序 ["SEQ-005"]；功能 ["FUNC-020", "FUNC-002", "FUNC-001", "FUNC-021"]
- `PAGE-005` 修改应用：系统设置 / 应用接入管理；场景 ["SC-005"]；时序 ["SEQ-005"]；功能 ["FUNC-001"]

## 核心用户路径

- `FLOW-001` 导入、结果分流与主子批闭环：SC-005超管在应用接入独立建立或维护应用凭证：列表/详情/新增/修改/删除各可单独发起，普通修改保留密钥，精确删除不删业务记录。有效应用及授权租户范围作为DCC鉴权前置；日常页简化用途，原型只合成，真实凭证与token失效待核。 → 任务创建提交锁定接口/手工来源，校验tenant/原supplierTaskId，应用仅鉴权追踪 → 手工原输入/提交前统一逐条最终priority校验，有效行独立记录单号批次自动提交，不新增DCCflag/request/归组主子协议，无每日衰减；预外呼入口常驻、不可导入保留禁用原因，手工CSV当前文本/有效预览必须一致，新文本或失败预览不提交旧稿，历史补导不扩已启动规则 → DCC请求级requestId可多行，新业务新ID，各行定位/leadCode/phone/本次priority/可选Boolean isNewBatch，missing=false归一 → DCC鉴权及归属后先核requestId完整有效内容：同ID同内容返原逐行record/batch/root，不重拆交；异内容拒整重复，后来新主不改旧root → 仅新ID逐行固定phone组校验：tenant/原supplierTaskId/leadCode，改号/归属冲突/历史组主不明不提交、多lead同号未决不自动放开，其他有效行继续；不要求DCC previous、不盲配最近同号 → 每有效新行新record/batch，true新主root=batch；false/缺省有主新子挂按本地主批稳定创建順序最近已保存同组主、无主自动首主，不挂上一子/不虚构parent。保存回执request/行/组/batch/root，本次priority/FIFO提交，未知不重交 → 53分片以核实enterprise→tenant/原task/fileId/原始号码精确回查实际记录与保存root，接口回传手工查看，不计实际呼叫不推定全导入终态 → 每次话单事件以实际批次/原始号码/callID或稳定事件精确关联，leadCode仅组不替代匹配；无话单失败独立、秒挂真实条件、重复晚更新不制造新呼叫 → 接口每次结果携保存request/行/组/实际batch/root/call事件回传固定DCC地址，后有新主不改旧root；手工仅查看，失败补送不重导；未可信纯SIP独立待核、不污染已确认call或阻挡其后可信精准更新，真实非SIP矛盾仍待核 → DCC决定业务重导/priority/计数，新主子不重置计次；无平台每日查询/衰减/存量改写/重导计划。删除仅实际供应商批次，必要幂等/组/root/映射保留，原时间审计；同号重导排重执行中并行仍partial，不新增先删/等finishRetryFlag；切换精确删除目标/样例清旧反馈，不改旧对象证据
- `FLOW-002` 失败导出与业务记录保护：本地校验失败、供应商同步/异步导入失败分类进入既有失败下载入口；呼叫失败独立记录 → 按已知失败分片展示收齐或不完整/待核，不推定整个导入终态 → 生成本次失败快照和导出文件；点击/生成不等成功下载 → 可信成功下载只清本次快照明细和文件；中断/失败保留 → 两来源保留必要记录/事件去重/分片交付状态；接口另保原逐行requestId幂等结果/固定phone组/主子root/精准供应商通话映射。后到新失败下次下载，已导出重复不再生，手工不新增DCCflag/request/归组协议。

## 主要数据对象

- 冻结基线未单列数据对象；按已冻结场景、字段与状态模型定位，不从功能名称反推对象。

## 交付方式

以本地静态 HTML 原型交付；业务流程图和时序交互图复用冻结基线中的自包含 HTML，并由原型交付导航统一打开。

## 上游假设与确认边界

保留上游假设的原文与状态；G3 接受风险不等于接口或业务假设已获验证。

- P1仅分析排序，不是实施先后
- SRC-083确认取消每日状态查询、自然日priority衰减与存量priority改写；原导入时间仅审计，本次DCC priority直接保存透传，手工提交前最终priority保持。
- DCC管理业务导入、重导及计数，平台不建预算/计时器；供应商内部尝试完整性及SIP晚更新仍交开发核实。
- 工作时间边界（SRC-078/079，SRC-083修订）：按本次最终priority同任务高先/同级FIFO，已提交不撤回、未知不重交；不因时段到来提权或按日期降级。低priority不是禁止呼叫，供应商时段与禁呼配置证据仍待核。
- 仅DCC接口SRC-084～086：tenant/原supplierTaskId/leadCode固定phone组，逐行可选Boolean isNewBatch missing=false；true独立主，false/缺省有主新子挂按本地主批稳定创建顺序最近已保存同组主、无主自动首主。无需DCC previous，不挂上一子/虚构parent，不按最近同号/结果时间/priority选主。先鉴权/归一完整请求幂等，旧请求返原record/batch/root不随新主变动；手工无新flag/request/归组协议。真实规范化/技术作用域/行定位/稳定创建顺序/原子性/持久化/ACK/供应商排重执行中并行开发待核，不称verified。
- 同组仅已绑定phone，改号/归属冲突/历史组主不明拒绝或待核不提交，tenant/原任务隔离；多lead同phone未决不放开，主子不改DCC计次。精准vendorfileId/实际batch/call事件仍必需，leadCode单键/最近主不能替代；供应商同号重导排重执行中并行仍partial，DCC决策，不新增先删/等finishRetryFlag策略。
- 本期原型只用合成应用、不可用于真实服务的演示appSecret与不可用租户身份。生产凭证算法/安全存储、应用管理API、token时效及删除/授权变更后真实token失效机制尚missing/partial，不能从本地CRUD实测提升verified；不新增收费、启停、密钥重置或权限授予操作。演示名称60字/唯一性、分页大小等实现选择未被提升为冻结业务规则。
- SRC-088要求先回归需求与原型对齐再进入下一阶段；本临时事实修订不创建G3、02业务/运营审批或05开发事实。已有候选回归是本地合成观察，生产供应商/认证/CRUD接口缺口维持原状态。

## 范围

- In scope：["SC-001", "SC-002", "SC-003", "SC-004", "SC-005"]
- Out of scope：["真实凭据/token/呼叫/供应商删除", "自动解除未证实风控", "旧R排序/3秒/5分钟/1次默认", "05开发包/发布/039", "平台每日状态查询/自然日priority衰减/存量priority改写", "平台按旧priority或原导入时间决策再次导入；平台重导调度与预算", "同组改号或跨tenant/原任务混组；同号多lead未决关系自动放开", "以leadCode单键/最近同号/最近主替代fileId/实际batch/call事件匹配，虚构parent关系", "新增平台先删或等待finishRetryFlag后重导调度策略", "未经确认的收费、应用启停、密钥重置和权限自动授予", "把演示60字/重名等限制或合成CRUD/SIP实测提升为生产API已验证"]

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
| 角色与职责 | {"description": "应用管理仅超管；租户管理员菜单/页面/管理接口拒绝，不实际改变账号权限", "name": "超管"} |
| 角色与职责 | {"description": "按既有权限导入、查看及下载失败明细；不授予应用管理权", "name": "运营人员"} |
| 系统与责任边界 | {"decision_history": [{"before": {"description": "主动传入客户与精准删除请求"}, "reason": "SRC-083：用户确认取消平台全部每日衰减及仅服务衰减的状态查询；DCC决策本次导入priority，平台逐条幂等接收并精确维护父/根批次谱系。", "source_refs": [], "superseded_by": "SRC-083"}, {"before": {"description": "决策每次请求及各行本次priority；请求级requestId可多行，真重导换新ID并逐行指定previousBatchId；接收逐行父根批次回执和每次结果，管理业务计数及精准删除。"}, "decision_sequence": [{"decision": "仅同一手机号重复业务导入；tenant/原supplierTaskId/leadCode固定phone归组，不再要求DCC提供previousBatchId。", "source_id": "SRC-084"}, {"decision": "提出是否作为新批次的兼容字段；false生成关联主批的子级批次号，未传沿已有主批关联；主批选择及首次无主行为在该次尚待澄清。", "source_id": "SRC-085"}, {"decision": "最终确认逐行可选Boolean isNewBatch，missing=false；true可同组另开主批，false/缺省新子批挂最近已保存同组主批，无主自动首主；最近主按本地主批创建稳定顺序，技术重传不重新分配。", "source_id": "SRC-086"}], "reason": "SRC-084～086取代DCC必传父批次方案：固定phone同组，可选isNewBatch主/子批规则；request级归一后幂等先于新业务分配，保留本次priority及精确供应商/通话映射。没有生成审批或真实验证结论。", "source_refs": ["inputs/source-index.json#SRC-083"], "superseded_by": "SRC-086"}], "description": "DCC决定新业务请求/各行本次priority，新请求级requestId可多行，可选逐行Boolean isNewBatch missing=false；同tenant/原supplierTaskId/leadCode固定phone，true独立主、false/缺省最近已保存主下新子、无主自动首主，不必传previous。接收逐行request/定位/batch/root及精确每次结果；真实计次和精准删除职责不变，技术重传原逐行映射。", "name": "DCC", "source_refs": ["inputs/source-index.json#SRC-083", "inputs/source-index.json#SRC-084", "inputs/source-index.json#SRC-085", "inputs/source-index.json#SRC-086"]} |
| 系统与责任边界 | {"decision_history": [{"before": {"description": "本地留存、优先级、状态守卫与关联批次"}, "reason": "SRC-083：用户确认取消平台全部每日衰减及仅服务衰减的状态查询；DCC决策本次导入priority，平台逐条幂等接收并精确维护父/根批次谱系。", "source_refs": [], "superseded_by": "SRC-083"}, {"before": {"description": "接口来源先请求级requestId完整内容幂等，再按本次priority及明确父关联精确逐行单手机号拆批，回执/每次结果带当前父根映射；已知历史缺父不提交、不另开根、不猜最近同号。手工沿提交前逐条最终priority独立拆批，不要求DCC requestId或父链协议。两种来源原时间审计，无每日状态查询/衰减。"}, "decision_sequence": [{"decision": "仅同一手机号重复业务导入；tenant/原supplierTaskId/leadCode固定phone归组，不再要求DCC提供previousBatchId。", "source_id": "SRC-084"}, {"decision": "提出是否作为新批次的兼容字段；false生成关联主批的子级批次号，未传沿已有主批关联；主批选择及首次无主行为在该次尚待澄清。", "source_id": "SRC-085"}, {"decision": "最终确认逐行可选Boolean isNewBatch，missing=false；true可同组另开主批，false/缺省新子批挂最近已保存同组主批，无主自动首主；最近主按本地主批创建稳定顺序，技术重传不重新分配。", "source_id": "SRC-086"}], "reason": "SRC-084～086取代DCC必传父批次方案：固定phone同组，可选isNewBatch主/子批规则；request级归一后幂等先于新业务分配，保留本次priority及精确供应商/通话映射。没有生成审批或真实验证结论。", "source_refs": ["inputs/source-index.json#SRC-083"], "superseded_by": "SRC-086"}], "description": "接口先鉴权/归一完整有效请求幂等，仅新ID固定phone归组并新record/batch；true独立主、false/缺省最近已保存同组主下新子、无主首主，主按本地稳定创建顺序，root保存返回不虚构parent。fileId/实际batch/call事件精准匹配，后有新主不改旧请求/结果root；手工原输入最终priority独立拆批，无新DCCflag/request/归组协议，两来源无每日查询衰减、原时间审计。", "name": "云呼叫中心", "source_refs": ["inputs/source-index.json#SRC-083", "inputs/source-index.json#SRC-084", "inputs/source-index.json#SRC-085", "inputs/source-index.json#SRC-086"]} |
| 系统与责任边界 | {"description": "供应商任务、号码导入、实际调度/主叫选择与结果；真实能力待核", "name": "AliCti供应商"} |
| 产品结构 | {"description": "系统设置应用接入，超管可分别列表/新增/详情/修改/删除；日常页简化为生成密钥用于token，保留名称/可访问业务租户和必要不可用演示提示。原保存复用修改，合成凭证不能用于真实服务，生产契约待核。", "name": "系统设置/应用接入管理"} |
| 产品结构 | {"description": "预外呼任务级记录页及常驻导入客户入口；按锁来源进入DCC合成接收或既有手工导入，不可导入禁用并给原因。历史仅未启动补导保留原名单/批次，不扩旧启动策略；当前文本/预览、删除反馈与可信call/SIP精准归属纳入回归判据。", "name": "预外呼任务/记录页"} |
| 状态与转换 | {"decision_history": [{"before": {"states": ["本地校验失败", "本地保存", "供应商导入待提交", "供应商同步数量与准确成功证据", "供应商导入失败（同步/53）", "供应商结果未知/待核", "供应商已删除（本地保留）"], "transitions": ["有效行本地保存 → 同任务待提交priority高先/同级FIFO → 自动提交；已提交不重排", "同步准确证据正常记录；只汇总不盲指定成功行，未知待核", "53异步失败 → 分片关联合并 → 失败导出及按任务来源回传/查看，不计实际呼叫", "可信下载成功仅清本次快照明细/文件；保留关联、去重、分片、交付状态，后到新失败待再次下载", "精准删除明确成功 → 供应商已删除（本地保留）"]}, "reason": "SRC-083：用户确认取消平台全部每日衰减及仅服务衰减的状态查询；DCC决策本次导入priority，平台逐条幂等接收并精确维护父/根批次谱系。", "source_refs": [], "superseded_by": "SRC-083"}, {"before": {"states": ["本地校验失败", "本地保存", "供应商导入待提交", "供应商同步数量与准确成功证据", "供应商导入失败（同步/53）", "供应商结果未知/待核", "供应商已删除（本地保留）", "DCC接口导入父批次关联待核", "DCC接口requestId内容冲突拒绝"], "transitions": ["DCC接口分支：鉴权及租户/任务归属 → 请求级requestId核对完整内容；同ID同内容返回原逐行结果/映射，不重拆/不重交，首次原请求重传不被历史误拒", "DCC接口分支：同requestId异完整内容 → 明确冲突拒绝整个重复请求，不覆盖原逐行结果", "DCC接口分支：新业务请求逐行字段/历史校验 → 已知tenant/原任务/leadCode/phone组合缺父、指定父不明/冲突/多候选或既有改号/多号码歧义则不提交；其他有效行继续", "DCC接口分支：仅无既有链且无歧义的首次行可无父建根；已知链明确父校验后保存新记录/独立批次/父根映射 → 同任务本次priority高先/同级FIFO自动提交，已提交不重排", "手工分支：提交前统一/逐条最终priority → 逐行必填校验 → 有效行独立本地记录/单手机号批次 → 自动提交；无DCC requestId/父链校验，也无日龄衰减", "同步准确证据正常记录；只汇总不盲指定成功行，未知待核", "53异步失败 → 分片精确关联合并 → 失败导出及按任务来源回传/查看，不计实际呼叫", "可信下载成功仅清本次快照明细/文件；保留必要去重、分片、状态；接口来源另保留其requestId/父根映射，后到新失败待再次下载", "精准删除明确成功 → 仅指定供应商批次已删，本地记录/父根谱系保留；不产生priority策略变化"]}, "decision_sequence": [{"decision": "仅同一手机号重复业务导入；tenant/原supplierTaskId/leadCode固定phone归组，不再要求DCC提供previousBatchId。", "source_id": "SRC-084"}, {"decision": "提出是否作为新批次的兼容字段；false生成关联主批的子级批次号，未传沿已有主批关联；主批选择及首次无主行为在该次尚待澄清。", "source_id": "SRC-085"}, {"decision": "最终确认逐行可选Boolean isNewBatch，missing=false；true可同组另开主批，false/缺省新子批挂最近已保存同组主批，无主自动首主；最近主按本地主批创建稳定顺序，技术重传不重新分配。", "source_id": "SRC-086"}], "reason": "SRC-084～086取代DCC必传父批次方案：固定phone同组，可选isNewBatch主/子批规则；request级归一后幂等先于新业务分配，保留本次priority及精确供应商/通话映射。没有生成审批或真实验证结论。", "source_refs": ["inputs/source-index.json#SRC-083"], "superseded_by": "SRC-086"}], "id": "STATE-001", "name": "导入业务记录", "source_refs": ["inputs/source-index.json#SRC-083", "inputs/source-index.json#SRC-084", "inputs/source-index.json#SRC-085", "inputs/source-index.json#SRC-086"], "states": ["本地校验失败", "本地保存", "供应商导入待提交", "供应商同步数量与准确成功证据", "供应商导入失败（同步/53）", "供应商结果未知/待核", "供应商已删除（本地保留）", "DCC接口分组号码/归属或主批关系待核", "DCC接口requestId内容冲突拒绝"], "transitions": ["DCC鉴权与tenant/原任务归属 → missing flag=false归一 → requestId核完整有效内容；同ID同内容原逐行record/batch/root不重拆交，后来新主不改原root", "DCC同ID异归一完整有效内容 → 内容冲突拒整重复请求、不覆盖原结果", "DCC仅新ID逐行固定phone组：改号/归属冲突/历史组主不明不提交，多lead同号未决不放开，其他有效行继续", "DCC有效新行新record/batch：true独立主root=batch，false/缺省有主新子按本地主批稳定创建顺序挂最近已保存同组主，无主首主；保存root不虚构parent → 本次priority高先/同级FIFO自动提交，已提交不重排/未知不重交", "手工原输入/最终priority → 既有逐行校验 → 独立记录单号批次自动提交，无新DCCflag/request/归组主子协议或日龄衰减", "准确同步成功证据正常记录，仅汇总不任指行/未知待核；真实同号重导排重执行中并行仍partial", "53失败以核实enterprise/tenant/原task/fileId/原始号码精确映射实际record/batch/root → 导出或按来源回传查看，不计实际呼叫", "可信下载只清快照明细文件，去重分片交付状态保留；接口原逐行幂等/组/root/供应商通话映射保留，后到新失败下次下载", "精准删除明确成功只该实际供应商批次已删，必要本地记录/组/root/幂等/实际映射留存，不作用同组其他主子，不改priority策略", "手工当前文本改变或预览失败 → 旧草稿不可提交；重新有效预览后才可按最终priority提交，无旧名单误写"]} |
| 状态与转换 | {"decision_history": [{"before": {"transitions": ["每次结果/晚更新 → 同对象准确关联 → 接口回传或手工查看", "重复不新增呼叫；回传失败记录并补送，不改变业务结果"]}, "reason": "SRC-083：用户确认取消平台全部每日衰减及仅服务衰减的状态查询；DCC决策本次导入priority，平台逐条幂等接收并精确维护父/根批次谱系。", "source_refs": [], "superseded_by": "SRC-083"}, {"before": {"transitions": ["接口来源每次结果/晚更新 → 同对象精确关联requestId+行定位/当前父根批次 → 回传DCC；手工来源沿既有本地记录/独立批次/通话事件关联，仅平台查看，不新增DCC字段。", "重复不新增呼叫；回传失败记录并补送，不改变业务结果、不重新导入"]}, "decision_sequence": [{"decision": "仅同一手机号重复业务导入；tenant/原supplierTaskId/leadCode固定phone归组，不再要求DCC提供previousBatchId。", "source_id": "SRC-084"}, {"decision": "提出是否作为新批次的兼容字段；false生成关联主批的子级批次号，未传沿已有主批关联；主批选择及首次无主行为在该次尚待澄清。", "source_id": "SRC-085"}, {"decision": "最终确认逐行可选Boolean isNewBatch，missing=false；true可同组另开主批，false/缺省新子批挂最近已保存同组主批，无主自动首主；最近主按本地主批创建稳定顺序，技术重传不重新分配。", "source_id": "SRC-086"}], "reason": "SRC-084～086取代DCC必传父批次方案：固定phone同组，可选isNewBatch主/子批规则；request级归一后幂等先于新业务分配，保留本次priority及精确供应商/通话映射。没有生成审批或真实验证结论。", "source_refs": ["inputs/source-index.json#SRC-083"], "superseded_by": "SRC-086"}], "id": "STATE-002", "name": "每次结果与回传记录", "source_refs": ["inputs/source-index.json#SRC-083", "inputs/source-index.json#SRC-084", "inputs/source-index.json#SRC-085", "inputs/source-index.json#SRC-086"], "states": ["结果已关联", "结果待核", "接口回传待发送", "回传成功", "回传失败待补送", "手工仅平台查看"], "transitions": ["接口每次结果/晚更新经精确fileId/实际批次/原始号码/callID或稳定事件回查保存record，取该request/行/组/batch/root回传，后有新主不改旧root，leadCode仅组不替代匹配；手工沿原记录/独立批次/通话事件仅查看，无DCC协议新增。", "重复/晚更新不新呼叫，失败补送不改业务结果/重导，不虚构子挂子parent关系。", "未可信纯SIP → 独立来源待核证据，不污染原call非SIP结果；随后精准可信call/SIP且无其他真矛盾 → 更新同一call/交付版本，不新增呼叫"]} |
| 状态与转换 | {"id": "STATE-003", "name": "应用接入配置结果", "notes": "仅产品可判定配置结果模型，不是workflow state；真实凭证/API/token撤销待核。", "source_refs": ["inputs/source-index.json#SRC-087", "inputs/source-index.json#SRC-088"], "states": ["应用尚未保存", "应用已保存", "应用已删除"], "transitions": ["超管列表/详情只读，不改变配置", "超管新增有效保存 → 新应用及不可用合成appId/密钥；取消/失败不形成已保存应用", "超管修改有效保存 → 名称/租户授权更新、appId/密钥保持；取消/失败原配置不变", "超管确认精确删除且保存成功 → 该应用消失/合成身份失效，其他应用/业务任务记录保留；取消/失败不先撤权", "非超管管理请求 → 拒绝且配置不变；租户业务身份不升级管理权"]} |

## 完整冻结输入入口

路径相对于原型项目根目录。结构化事实约束实现，Markdown/HTML 用于对照确认与图集复用；本记忆摘要不替代这些入口。

| Entry | Role | Frozen Path |
| --- | --- | --- |
| business_rules | business_fact | inputs/requirement-analysis/ra---v1.1.0---676248563fbe9e8e/memory/business-rules.json |
| business_scenario_atlas | review_view | inputs/requirement-analysis/ra---v1.1.0---676248563fbe9e8e/outputs/business-scenario-atlas.html |
| feature_list | product_fact | inputs/requirement-analysis/ra---v1.1.0---676248563fbe9e8e/memory/feature-list.json |
| feature_list_view | review_view | inputs/requirement-analysis/ra---v1.1.0---676248563fbe9e8e/outputs/feature-list.md |
| interaction_sequence_atlas | review_view | inputs/requirement-analysis/ra---v1.1.0---676248563fbe9e8e/outputs/interaction-sequence-atlas.html |
| interface_index | external_dependency_fact | inputs/requirement-analysis/ra---v1.1.0---676248563fbe9e8e/interfaces/interface-index.json |
| interface_verification_matrix | review_view | inputs/requirement-analysis/ra---v1.1.0---676248563fbe9e8e/outputs/system-sequence-interface-verification-matrix.md |
| normalized_user_stories | business_fact | inputs/requirement-analysis/ra---v1.1.0---676248563fbe9e8e/memory/normalized-user-stories.json |
| open_items | risk_fact | inputs/requirement-analysis/ra---v1.1.0---676248563fbe9e8e/runtime/open-items.json |
| page_index | prototype_planning_fact | inputs/requirement-analysis/ra---v1.1.0---676248563fbe9e8e/planning/page-index.json |
| page_planning | review_view | inputs/requirement-analysis/ra---v1.1.0---676248563fbe9e8e/outputs/menu-and-page-planning-reference.md |
| page_structure_atlas | review_view | inputs/requirement-analysis/ra---v1.1.0---676248563fbe9e8e/outputs/page-structure-atlas.html |
| product_baseline | review_view | inputs/requirement-analysis/ra---v1.1.0---676248563fbe9e8e/outputs/product-structure-and-business-process-baseline.md |
| project_facts | business_fact | inputs/requirement-analysis/ra---v1.1.0---676248563fbe9e8e/memory/project-facts.json |
| scenario_index | business_fact | inputs/requirement-analysis/ra---v1.1.0---676248563fbe9e8e/scenarios/scenario-index.json |
| sequence_index | interaction_fact | inputs/requirement-analysis/ra---v1.1.0---676248563fbe9e8e/sequences/sequence-index.json |
| traceability | trace_fact | inputs/requirement-analysis/ra---v1.1.0---676248563fbe9e8e/runtime/traceability.json |
| verification_report | verification_evidence | inputs/requirement-analysis/ra---v1.1.0---676248563fbe9e8e/runtime/verification-report.json |

## 场景与交互时序定位

S6/S7/S8 按相关 ID 读取下列冻结明细与图集，落实消息顺序、回调和异常分支；不是只发布图页。

| ID | Name | Scenario | Frozen Detail |
| --- | --- | --- | --- |
| SC-001 | DCC客户接收与按手机号拆批 | SC-001 | inputs/requirement-analysis/ra---v1.1.0---676248563fbe9e8e/scenarios/SC-001.json |
| SC-002 | 线路侧风控结果关联与回传 | SC-002 | inputs/requirement-analysis/ra---v1.1.0---676248563fbe9e8e/scenarios/SC-002.json |
| SC-003 | 无话单失败原因记录与回传 | SC-003 | inputs/requirement-analysis/ra---v1.1.0---676248563fbe9e8e/scenarios/SC-003.json |
| SC-004 | 客户秒挂识别与每次结果回传 | SC-004 | inputs/requirement-analysis/ra---v1.1.0---676248563fbe9e8e/scenarios/SC-004.json |
| SC-005 | 超管建立与维护应用接入凭证 | SC-005 | inputs/requirement-analysis/ra---v1.1.0---676248563fbe9e8e/scenarios/SC-005.json |
| SEQ-001 | DCC导入逐行保存、单号拆批与自动提交 | SC-001 | inputs/requirement-analysis/ra---v1.1.0---676248563fbe9e8e/sequences/SEQ-001.json |
| SEQ-002 | 线路侧风控结果关联与回传 | SC-002 | inputs/requirement-analysis/ra---v1.1.0---676248563fbe9e8e/sequences/SEQ-002.json |
| SEQ-003 | 无话单失败原因记录与回传 | SC-003 | inputs/requirement-analysis/ra---v1.1.0---676248563fbe9e8e/sequences/SEQ-003.json |
| SEQ-004 | 客户秒挂识别与每次结果回传 | SC-004 | inputs/requirement-analysis/ra---v1.1.0---676248563fbe9e8e/sequences/SEQ-004.json |
| SEQ-005 | 应用列表、新增、详情、修改、删除与后台租户身份 | SC-005 | inputs/requirement-analysis/ra---v1.1.0---676248563fbe9e8e/sequences/SEQ-005.json |
| SEQ-006 | 手工线索导入与提交前priority覆盖 | SC-001 | inputs/requirement-analysis/ra---v1.1.0---676248563fbe9e8e/sequences/SEQ-006.json |
| SEQ-007 | 接口及手工失败下载生命周期 | SC-001 | inputs/requirement-analysis/ra---v1.1.0---676248563fbe9e8e/sequences/SEQ-007.json |
| SEQ-009 | DCC精准删除成功与本地留存 | SC-001 | inputs/requirement-analysis/ra---v1.1.0---676248563fbe9e8e/sequences/SEQ-009.json |
