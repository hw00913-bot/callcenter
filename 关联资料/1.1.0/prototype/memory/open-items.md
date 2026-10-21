# Open Items

> 同步自冻结需求分析基线 `ra-云呼叫中心-v1.1.0-原始需求重新分析草稿-676248563fbe9e8e`；原型 Loop 不改变上游风险处置状态。

| ID | Severity | Status | Summary | Related IDs | Resolution |
| --- | --- | --- | --- | --- | --- |
| ISSUE-001 | low | resolved | 9月30日历史原件仍缺失 | ["SRC-001"] | SRC-050明确作废9月30日，不再作为有效基线阻塞；原文未恢复事实保留 |
| ISSUE-002 | high | accepted_risk | DCC请求规范化、主子批次接收与原子并发工程落实 | ["SRC-002", "API-001", "API-002"] | none |
| ISSUE-003 | high | resolved | 供应商线路风控/换主叫契约 | ["SRC-002", "API-007"] | 平台换主叫接口退出当前范围，供应商导航不承诺绝对换号。 |
| ISSUE-004 | high | accepted_risk | 系统限制解除契约缺失 | ["SRC-002", "API-008"] | none |
| ISSUE-005 | high | accepted_risk | 秒挂供应商字段映射 | ["SRC-002", "API-004"] | none |
| ISSUE-006 | high | resolved | 结果与能力证据 | ["SRC-002", "API-003", "API-004", "API-005", "API-006", "API-007", "API-008"] | 平台换主叫接口退出当前范围，供应商导航不承诺绝对换号。 |
| ISSUE-007 | high | resolved | 线索类R渠道缺失或无效处理 | ["SRC-003", "US-001", "SC-001"] | SRC-062：R可选，不维护字典，不做字典范围校验，接口和手工缺R不失败；提供则保留追踪。历史R必填决定仅保留追溯。 |
| ISSUE-008 | high | accepted_risk | 真实下载成功信号 | ["SRC-003", "SC-001", "US-001", "SRC-005", "API-009"] | 成功下载只清本次快照失败明细/文件，成功客户与关联/去重/分片/回传依据保留；真实可信下载成功判据仍待开发核实，不以点击或生成文件替代。 |
| ISSUE-009 | high | resolved | 失败导出本次或历史范围 | ["SRC-006", "US-001", "SC-001"] | 原回答SRC-007现被SRC-009留存变更替代；未下载记录持续保留，历史检索页面仍未指定。 |
| ISSUE-010 | high | resolved | 接口导入失败结果使用方 | ["SRC-006", "SRC-007", "US-001", "SC-001"] | SRC-008确认运营人员在云呼叫中心下载，临时保存3天；不再待定DCC接收或运营下载。 |
| ISSUE-011 | high | resolved | 3天精确计时及到期处理口径 | ["SRC-008", "US-001", "SC-001"] | SRC-009替代3天期限；72小时与固定到期清理不再是当前方案。 |
| ISSUE-012 | high | resolved | 下载后删除对象范围 | ["SRC-009", "US-001", "SC-001"] | SRC-011确认删除本次成功导出的失败明细和对应文件、不影响成功导入客户；SRC-010成功/失败保护保持。技术判定后续核实。 |
| ISSUE-013 | high | resolved | 导入接口优先级业务用途 | ["SRC-011", "US-001", "SC-001"] | SRC-012确认用于供应商接口priority字段，不新增本地排序或R优先级映射。 |
| ISSUE-014 | high | resolved | priority必填与缺失处理 | ["SRC-012", "US-001", "SC-001"] | SRC-013确认priority必填、未传该条失败、不补默认，其他有效记录继续；供应商约束另核实。 |
| ISSUE-015 | high | resolved | 同线索固定手机号的主批/子批业务关联 | ["US-001", "SC-001", "SRC-002"] | SRC-084～086确认同tenant/原task/leadCode固定同phone归组，不传previous。true新独立主root=batch；false/缺省生成新子root=最近已保存主，无主自动首主。每有效新业务行独立record/batch，本次priority不旧继承，root及请求关系用于审计；同request重传原结果，不重新选最近主。 |
| ISSUE-016 | high | resolved | 每次推送本地客户保存记录关系 | ["SRC-014", "US-001", "SC-001"] | SRC-015确认每次有效导入新增独立本地记录并关联本次新批次，不覆盖以前记录。 |
| ISSUE-017 | high | resolved | 成功保存拆批后的供应商提交时机 | ["US-001", "SC-001", "SRC-015"] | SRC-016确认有效客户保存拆批后自动提交供应商，无运营手动提交门槛。 |
| ISSUE-018 | high | resolved | 自动提交供应商的目标任务 | ["SRC-016", "US-001", "SC-001"] | SRC-017确认DCC携带taskId，不采用统一预配置任务；ID命名空间另待确认。 |
| ISSUE-019 | high | resolved | taskId命名空间 | ["SRC-017", "US-001", "SC-001"] | SRC-018确认供应商任务ID直接提交，不做本地任务ID映射；必要归属/有效性及参数层级另核。 |
| ISSUE-020 | high | resolved | 供应商明确拒绝纳入失败导出 | ["SRC-016", "US-001", "SC-001"] | SRC-019已确认供应商明确拒绝进入失败导出并携原因。 |
| ISSUE-021 | low | open | 父摘要原消息正文及时间追溯 | ["SRC-020", "SRC-021", "SRC-022", "SRC-023", "SRC-024", "SRC-025", "SRC-026", "SRC-027", "SRC-028", "SRC-029", "SRC-030", "SRC-031", "SRC-032", "SRC-033", "SRC-034", "SRC-035", "SRC-036", "SRC-037", "SRC-038", "SRC-039", "SRC-040", "SRC-041", "SRC-042", "SRC-043", "SRC-044"] | none |
| ISSUE-022 | high | accepted_risk | 精准删除实际接口并发与幂等缺口 | ["SC-001", "US-001", "API-006"] | none |
| ISSUE-023 | high | resolved | 重呼异常计次与真实换主叫能力 | ["US-002", "SC-002", "API-002", "API-003", "API-007"] | 平台换主叫接口退出当前范围，供应商导航不承诺绝对换号。 |
| ISSUE-024 | high | accepted_risk | 解除信号缺失，原型仅暂停 | ["US-003", "SC-003", "API-008"] | none |
| ISSUE-025 | high | resolved | 秒挂异常提交计次 | ["US-004", "SC-004", "SRC-045", "API-002", "API-004"] | SRC-063职责收敛：业务重导/计数由DCC负责，平台不建调度或预算；供应商内部尝试映射仍由开发核实。 |
| ISSUE-026 | medium | accepted_risk | DCC逐行回执和每次结果主子关联可靠交付工程落实 | ["API-010", "AC-037", "AC-038"] | 本方主/子字段与默认业务分支已确认，真实服务/工程实现未验证；新G3未批准，用户继续审阅。 |
| ISSUE-027 | medium | accepted_risk | 53推送完整协议与准确关联待核 | ["API-002", "API-003", "FUNC-017", "AC-039", "AC-040", "AC-042"] | none |
| ISSUE-028 | medium | resolved | 提交优先级与FIFO排序口径及范围待确认 | ["SRC-075", "FUNC-005", "API-002"] | SRC-076确认口径，SRC-077确认同任务范围、不同任务独立，不保证实际拨打次序。 |
| ISSUE-029 | medium | accepted_risk | 供应商呼叫时段与禁呼规则覆盖及任务状态行为待核 | ["API-002", "FUNC-005", "SC-001", "SRC-080"] | none |
| ISSUE-030 | medium | resolved | 旧供应商反馈重复转交定位已纠正 | ["API-003", "API-007", "SC-003", "SRC-082"] | 重复转交/追溯补录定位完成，撤销重复新增问题；G2仍pending，既有DCC职责和范围不变。 |
| ISSUE-031 | medium | accepted_risk | 应用CRUD及密钥生命周期的生产工程契约仍未联调 | ["SRC-087", "SRC-088", "API-001", "SC-005"] | 保留仅合成演示边界和API-001 missing，后续05设计/真实联调需明确契约；本次不宣称生产冻结已验证。 |

## Prototype-only Questions

- None recorded during deterministic baseline materialization; later presentation questions must be added with an explicit decision record.

## 本轮正式输入及独立评审边界

04新G3由用户明确批准，标准包已正常验真导入并S3物化；当前基线17FUNC/62AC/21BR/5SC/8SEQ/5PAGE/20ACTION与96FLD。原上游accepted_risk与低风险来源追溯项保留，不改状态。本轮只做合成本地演示，真实API/并发/密钥与token生命周期、供应商重复导入/在途、可靠回传、下载成功判据仍由后续工程核实。02业务/运营方案批准仍待实际确认，05未开始。旧审阅记录原件在现有归档ZIP；不使用旧pass证明本轮。


## 2026-10-14 · 回传入口收敛后的来源展示边界

用户已批准移除独立DCC回传页签，回传状态和失败补送进入各对象详情。此调整已局部实现与验证，不改变冻结输入或正式Loop状态。

当前历史合成runtime只有api/manual与sourceApplicationId，未物化上游当前方案的DCC／天网正式来源枚举和按原应用分流。UI仅以明确历史样例DEMO-DCC-APP-A/B及精确接收方／对象关联兼容显示；自建或未知应用来源不推定DCC。手工与明确天网投影隐藏回传信息的局部验证，不等于已完成天网端到端对接或真实来源路由。后续当前需求正式导入和运行时实现需补齐不可变来源身份，并同时对齐回传生成点及权限；不得用本轮UI隐藏宣称生产缺口已关闭。


### 2026-10-14 · 拨号即填单局部修复及剩余边界

用户再次指出原型仍需接通后填单。本轮修正人工拨号/振铃及预外呼坐席振铃的表单时机、接听操作与草稿保留，对应当前讨论AC-087的界面行为；未改只读冻结事实。独立15项及浏览器局部核验通过。新增人工未接通通话状态字典、预外呼继续跟进转当前坐席人工归属及远端排他仍属另行实现/验证内容，本次不以已有“需要再次联系”手工路径替代完整新方案。当前开发包与GitLab仍为上一提交快照，正式阶段状态不变。


### 2026-10-14 · 未接通状态局部补齐

SRC-122要求的人工号码状态选择、本地保存与详情，以及明确未接通时的业务条件必填处理已完成局部核验，见[证据](verification-evidence/workbench-manual-status-20261014.json)。此处更新上节“另行实现”的本地界面部分；预外呼转人工归属、完整跟进契约、远端排他和生产验证仍待完成，ISSUE-046不据此整体关闭。正式需求增量待重验；开发包与GitLab本轮未刷新。
