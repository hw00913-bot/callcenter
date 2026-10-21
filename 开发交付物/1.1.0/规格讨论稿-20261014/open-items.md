# 待核问题与分阶段验收

13高、9中、1低，状态保持open；ISSUE-024沿004/039证据，不重复新增业务。用户已批准先审本方工程方案、开发后验证实现；未批准风险豁免。

## ISSUE-002 [high] DCC/手工及内部操作原子保存、去重与恢复

手工及内部操作去重、record/batch/root与来源保存业务规则已定。剩余为本方身份规范、唯一约束、事务和并发/部分响应/崩溃恢复实现证据；供应商同号受理由037、预算执行由038承接。公共HTTP200接收不等本方持久原子保存，DCC requestId完整归一、逐行原子保存和响应丢失恢复已恢复本轮待核。 SRC-121已确认应用与租户多对多，各业务系统应用分别配置回调地址。建议获取token显式tenantId，校验app关联tenant后绑定token租户；导入/task/坐席不得跨token租户。来源按已认证应用登记，body声明仅校验一致性；建议请求幂等按tenant+稳定app+operation+requestId，完整内容含方式/人工工号。关联变更、token撤销、旧共享应用记录/回执迁移及真实协议待S3/S4，不静默改写历史归属或重置预测失败额度。

**issue_id**：ISSUE-002

**primary_owner**：平台工程

**primary_evidence_group**：engineering

**prerequisite_before_design_finalization**：先核应用可信身份/请求规范与供应商同号边界（依031/037）；不从body推断来源

**design_review_now**：完整请求规范化、逐行原子保存、稳定主子顺序、原来源与回执、响应丢失恢复

**implementation_evidence_after_development_before_release**：真实后端并发/部分响应/崩溃/换token重放与跨租户/应用隔离及同应用声明来源请求隔离（不证明两系统独立身份）

**depends_on**

1. ISSUE-031

2. ISSUE-037

3. ISSUE-038

**design_review_status**：awaiting_engineering_review

**implementation_validation_status**：not_started

**closure_status**：open_unchanged

**decision_ref**：runtime/staged-acceptance-user-decision-20261014.json

## ISSUE-004 [high] 八类人工失败补提交的生产资源、数据与配置依据

八类失败原标签及人工触发/权限已明确，公共HTTP接收和导航配置文档已找到。剩余为本项目实际资源/解析解密/外显或组/超时配置与错误补充信息的准确依据，以及保存原记录人工补提的生产映射；不增加恢复成功回执、自动等待或配置编辑功能。

**issue_id**：ISSUE-004

**primary_owner**：AliCti＋平台工程

**primary_evidence_group**：external

**prerequisite_before_design_finalization**：八类保存失败对象与本项目资源、数据、外显/组、超时配置依据；不新增恢复回执门槛

**design_review_now**：保存原失败对象、任务权限与原对象补提映射

**implementation_evidence_after_development_before_release**：实际工程的权限/重复动作/原对象映射及补提轨迹

**depends_on**

1. ISSUE-038

**design_review_status**：awaiting_engineering_review

**implementation_validation_status**：not_started

**closure_status**：open_unchanged

**decision_ref**：runtime/staged-acceptance-user-decision-20261014.json

## ISSUE-005 [high] 秒挂判定与原生重呼交互

秒挂0..2秒闭区间与本地三态规则已定；预测接听状态、呼叫字段及批次话单查询候选已有文档。剩余是客户有效时长单位/精度/真实0与缺失区分、预测客户主动挂断的映射和原生重呼对该真实结果的行为；不跨接口拼装字段或增加真人识别门槛。

**issue_id**：ISSUE-005

**primary_owner**：AliCti＋平台工程

**primary_evidence_group**：external

**prerequisite_before_design_finalization**：目标预测版本的客户应答/主动挂断、有效时长单位与精度、真实0/缺失及原生重呼交互

**design_review_now**：只使用已核同call字段，承接本方三态与版本方案

**implementation_evidence_after_development_before_release**：字段证据之上的真实归一、迟到/冲突与不补导测试

**depends_on**

1. ISSUE-033

2. ISSUE-041

**design_review_status**：awaiting_engineering_review

**implementation_validation_status**：not_started

**closure_status**：open_unchanged

**decision_ref**：runtime/staged-acceptance-user-decision-20261014.json

## ISSUE-008 [high] 真实下载成功信号

失败快照及成功后只清本次成员版本/文件的业务生命周期已定。供应商HTTP推送200ACK与文件实际下载完成不同；剩余为本方可信下载完成事件及实现/异常验证，不要求供应商补一个下载成功接口。

**issue_id**：ISSUE-008

**primary_owner**：平台下载工程

**primary_evidence_group**：engineering

**prerequisite_before_design_finalization**：可信下载完成判据及现有技术可行性须先证明；若无法实现单独提出业务差异，不替换为点击或HTTP成功

**design_review_now**：快照/成员版本/完成凭证与条件清理事务

**implementation_evidence_after_development_before_release**：真实成功/中断/撤权/重复/错快照/迟到及清理恢复

**depends_on**



**design_review_status**：awaiting_engineering_review

**implementation_validation_status**：not_started

**closure_status**：open_unchanged

**decision_ref**：runtime/staged-acceptance-user-decision-20261014.json

## ISSUE-021 [low] 父摘要原消息正文及时间追溯

本次补同步为父对话摘要；仅明确标引语保留原话，具体时间及完整消息待父任务来源。业务决定据父确认记录，不假造逐字文本。

**note**：历史原消息追溯项；不伪造缺失正文。

## ISSUE-022 [high] 精准删除与补提交取消并发

删除选择器优先级/运行条件/跳过字段已经定义，精确批次查询文档候选可供取证。剩余为当前单号fileId独占映射、单次attempt目标与实际删除/跳过/在途行为；本方删除取消与失败计划/预算的原子互斥由工程落实。维持原任务权限，不扩大整组删除。

**issue_id**：ISSUE-022

**primary_owner**：AliCti＋平台工程

**primary_evidence_group**：external

**prerequisite_before_design_finalization**：当前单号fileId/attempt独占映射及真实删除、跳过、在途行为

**design_review_now**：本地取消与补提执行权互斥、原权限与未知保留

**implementation_evidence_after_development_before_release**：后端删除/补提并发、权限、未知、保护对象与额度审计

**depends_on**

1. ISSUE-029

2. ISSUE-035

3. ISSUE-037

4. ISSUE-038

**design_review_status**：awaiting_engineering_review

**implementation_validation_status**：not_started

**closure_status**：open_unchanged

**decision_ref**：runtime/staged-acceptance-user-decision-20261014.json

## ISSUE-024 [high] 人工处理与导航依赖的历史证据别名

保留稳定ID和旧供应商研究出处，不删除历史。当前原失败标签、公共HTTP接收、传输重试及CRN配置已有文档；八类实际资源/数据依据由004、三类降级覆盖/部署由039复核。本条不另外创造恢复回执或重复功能/能力验证。

**issue_id**：ISSUE-024

**primary_owner**：跟随004／039

**primary_evidence_group**：alias

**prerequisite_before_design_finalization**：历史别名，沿004／039前置核实，不重复造验证任务

**design_review_now**：沿004／039相应设计责任

**implementation_evidence_after_development_before_release**：沿主问题证据复用，不能先于主问题关闭

**depends_on**

1. ISSUE-004

2. ISSUE-039

**design_review_status**：awaiting_engineering_review

**implementation_validation_status**：not_started

**closure_status**：open_unchanged

**decision_ref**：runtime/staged-acceptance-user-decision-20261014.json

## ISSUE-026 [medium] 接入业务系统结果及处理进度交付协议

新增本方异常状态/内部尝试/固定原root的字段与ACK待定义，补送不补导。旧每次结果交付契约不能自动证明新字段可靠。 SRC-121已确认应用与租户多对多，各业务系统应用分别配置回调地址。建议获取token显式tenantId，校验app关联tenant后绑定token租户；导入/task/坐席不得跨token租户。来源按已认证应用登记，body声明仅校验一致性；建议请求幂等按tenant+稳定app+operation+requestId，完整内容含方式/人工工号。关联变更、token撤销、旧共享应用记录/回执迁移及真实协议待S3/S4，不静默改写历史归属或重置预测失败额度。

**issue_id**：ISSUE-026

**primary_owner**：DCC＋平台工程

**primary_evidence_group**：engineering

**prerequisite_before_design_finalization**：双方正式结果/进度报文、原记录关联、粒度、版本、认证、兼容和ACK须先确认；候选Schema不替代正式契约

**design_review_now**：持久交付项、原来源路由、补送、逐版ACK与失败恢复

**implementation_evidence_after_development_before_release**：实际双方重复/乱序/错误版本ACK、响应丢失、补送与天网无异步交付

**depends_on**

1. ISSUE-031

2. ISSUE-041

**design_review_status**：awaiting_engineering_review

**implementation_validation_status**：not_started

**closure_status**：open_unchanged

**decision_ref**：runtime/staged-acceptance-user-decision-20261014.json

## ISSUE-027 [medium] 53推送完整协议与准确关联待核

53变量、六类导入失败、分片字段、数组定义/编码字符串示例已有原文，公共HTTP200接收与可配置重试机制也已明。剩余收窄为52/53回调验真、响应body及错误/超时具体重发判据、稳定导入组/事件身份、零失败/终态/迟到更正；本方准确租户映射、两种表达归一和幂等保存另属工程。片齐仍不当全导入完成。

**issue_id**：ISSUE-027

**primary_owner**：AliCti＋平台工程

**primary_evidence_group**：external

**prerequisite_before_design_finalization**：52/53验真及错误重发、稳定事件/导入组、零失败、终态和迟到更正契约

**design_review_now**：准确映射、两种报文归一、分片/去重与持久接收后响应

**implementation_evidence_after_development_before_release**：真实后端乱序/重传/缺片/崩溃与ACK丢失恢复

**depends_on**

1. ISSUE-002

2. ISSUE-035

**design_review_status**：awaiting_engineering_review

**implementation_validation_status**：not_started

**closure_status**：open_unchanged

**decision_ref**：runtime/staged-acceptance-user-decision-20261014.json

## ISSUE-029 [high] 运行任务及时间窗口下的供应商补提交受理矩阵

任务获取/开始/暂停/停止和号码/批次查询已有文档，运行中按号/批删除有明确条款。仍未证明预测任务运行/暂停/结束及呼叫/禁呼窗口下同号补导的受理、排队与恢复矩阵，或单号原生/导航无在途；不得用批次状态、autoStart或删除result替代。

**issue_id**：ISSUE-029

**primary_owner**：AliCti＋平台工程

**primary_evidence_group**：external

**prerequisite_before_design_finalization**：目标模式/version下状态×窗口×受理/在途的补导与恢复矩阵

**design_review_now**：本方按已核状态执行守卫并保留未知

**implementation_evidence_after_development_before_release**：真实后端使用已核矩阵的调度/恢复测试

**depends_on**

1. ISSUE-033

2. ISSUE-035

3. ISSUE-037

**design_review_status**：awaiting_engineering_review

**implementation_validation_status**：not_started

**closure_status**：open_unchanged

**decision_ref**：runtime/staged-acceptance-user-decision-20261014.json

## ISSUE-031 [medium] 应用CRUD及密钥生命周期的生产工程契约仍未联调

用户已明确应用列表/新增/详情/修改/删除和密钥获取token目的；原型当前仅合成演示。生产生成/存储密钥、CRUD持久化接口、既有token撤销/时效机制未确认，不把演示立即失效、60字名称或当前重名规则提升为生产事实。 SRC-121已确认应用与租户多对多，各业务系统应用分别配置回调地址。建议获取token显式tenantId，校验app关联tenant后绑定token租户；导入/task/坐席不得跨token租户。来源按已认证应用登记，body声明仅校验一致性；建议请求幂等按tenant+稳定app+operation+requestId，完整内容含方式/人工工号。关联变更、token撤销、旧共享应用记录/回执迁移及真实协议待S3/S4，不静默改写历史归属或重置预测失败额度。

**issue_id**：ISSUE-031

**primary_owner**：平台应用工程

**primary_evidence_group**：engineering

**prerequisite_before_design_finalization**：先明确稳定app/租户身份、凭据与历史来源兼容的可实现设计；不复用AliCti座席token结论

**design_review_now**：五操作、密钥保存/展示、token时效/撤销、当前授权优先及原来源保留

**implementation_evidence_after_development_before_release**：真实CRUD持久化/撤权/换token/删除/旧来源恢复与权限矩阵

**depends_on**



**design_review_status**：awaiting_engineering_review

**implementation_validation_status**：not_started

**closure_status**：open_unchanged

**decision_ref**：runtime/staged-acceptance-user-decision-20261014.json

## ISSUE-033 [high] 正常任务三天五呼的模式、版本、窗口与轮次适用性

正常重呼仍只按任务规则触发，与平台失败共享额外2次分开；基础/高级策略的retry重试次数、round轮次、time天小时分钟和计时依据已有文档。预测高级适用性仍与TaskProperty仅自动限制冲突；三天起算、五呼是否含初呼和跨补导批次延续不得由平台自定。先核供应商既有配置/行为，若无法表达再提出业务口径选择。

**issue_id**：ISSUE-033

**primary_owner**：AliCti＋平台工程

**primary_evidence_group**：external

**prerequisite_before_design_finalization**：预测高级策略适用性、三天起算/窗口、五呼含初呼与跨fileId轮次；不能自定供应商行为

**design_review_now**：按已核任务规则分流，与失败额外2次分开

**implementation_evidence_after_development_before_release**：真实工程分流、原生轮次与失败预算独立验证

**depends_on**

1. ISSUE-029

2. ISSUE-037

**design_review_status**：awaiting_engineering_review

**implementation_validation_status**：not_started

**closure_status**：open_unchanged

**decision_ref**：runtime/staged-acceptance-user-decision-20261014.json

## ISSUE-035 [high] 失败事件身份及原生重呼执行权

失败原字段及原因、公共HTTP200接收/传输重试已明确，按实际taskFileId查询话单及推送日志回查有文档候选。剩余为52失败可信来源、稳定事件/去重和准确attempt关联、具体重发/更正协议及原生/导航待执行权；没有callId或话单不等无在途。

**issue_id**：ISSUE-035

**primary_owner**：AliCti＋平台工程

**primary_evidence_group**：external

**prerequisite_before_design_finalization**：52稳定可信事件身份、准确attempt/原file对应、重发/更正及原生/导航执行权

**design_review_now**：本方去重/关联、首次确认时刻、未知和外发前守卫

**implementation_evidence_after_development_before_release**：真实后端重复/崩溃/计时与独占外发测试；本地锁不替代供应商证据

**depends_on**

1. ISSUE-002

2. ISSUE-037

3. ISSUE-038

**design_review_status**：awaiting_engineering_review

**implementation_validation_status**：not_started

**closure_status**：open_unchanged

**decision_ref**：runtime/staged-acceptance-user-decision-20261014.json

## ISSUE-036 [medium] 原手工客户字段与新字段工程映射

原大弹窗、CSV选文件／粘贴／检查／确认保持。SRC117纠正线索类重复编码：单一线索编码输入，新导入同源保存leadCode与兼容externalDocumentId；称呼／号码／备注和其他类型现有单据字段保留，不批量改写历史记录。最终priority必填，备注／R选填后置。供应商TaskTel和priority等字段已有定义；剩余为本方CSV列/类型长度/校验/持久化与供应商property映射、兼容和错误行实现证据，不重新设计UI或新增模板下载。 SRC-121已确认应用与租户多对多，各业务系统应用分别配置回调地址。建议获取token显式tenantId，校验app关联tenant后绑定token租户；导入/task/坐席不得跨token租户。来源按已认证应用登记，body声明仅校验一致性；建议请求幂等按tenant+稳定app+operation+requestId，完整内容含方式/人工工号。关联变更、token撤销、旧共享应用记录/回执迁移及真实协议待S3/S4，不静默改写历史归属或重置预测失败额度。

**issue_id**：ISSUE-036

**primary_owner**：平台导入工程

**primary_evidence_group**：engineering

**prerequisite_before_design_finalization**：沿已核TaskTel/priority定义，字段兼容冲突须先核；原界面和原字段保留

**design_review_now**：CSV列、类型／长度／空值、线索类单输入兼容映射及其他类型原单据字段、priority必填和property映射；历史不批量回写。

**implementation_evidence_after_development_before_release**：实际导入坏行、缺失/非法值、兼容、保存和原界面回归

**depends_on**

1. ISSUE-002

**design_review_status**：awaiting_engineering_review

**implementation_validation_status**：not_started

**closure_status**：open_unchanged

**decision_ref**：runtime/staged-acceptance-user-decision-20261014.json

## ISSUE-037 [high] 供应商复用fileId或新批次补导未验证

复用fileId追加、排重枚举/默认及原始同步数量已明；当前有taskFileId请求/返回的版本式预测话单查询，以及任务号码/批次查询入口。应删除笼统“供应商无批次查询”的表述；剩余是实际同号旧/新fileId受理/异步失败、唯一预期呼叫与轮次/在途互斥、不同尝试查询删除不串批。

**issue_id**：ISSUE-037

**primary_owner**：AliCti＋平台工程

**primary_evidence_group**：external

**prerequisite_before_design_finalization**：目标预测任务旧/新fileId、明确isRepeat的同号受理/异步失败、预期执行、轮次和查询删除不串批

**design_review_now**：每实际attempt保留真实file映射与未知查证协议

**implementation_evidence_after_development_before_release**：真实后端映射/未知恢复与查询删除使用测试

**depends_on**

1. ISSUE-029

2. ISSUE-033

3. ISSUE-035

**design_review_status**：awaiting_engineering_review

**implementation_validation_status**：not_started

**closure_status**：open_unchanged

**decision_ref**：runtime/staged-acceptance-user-decision-20261014.json

## ISSUE-038 [high] 拟定持久预占、实际发起计次与未知恢复状态协议

共享四元组额外2次及实际发起计次/未知保占用业务约束已定，HTTP推送接收依据和批次查询可协助查证但不证明恰好一次业务外发。剩余为本方预占/独占权/实际已用转换、并发取消和崩溃/未知恢复的持久原子协议与实现证据；供应商受理查证归037/035。 SRC-121已确认应用与租户多对多，各业务系统应用分别配置回调地址。建议获取token显式tenantId，校验app关联tenant后绑定token租户；导入/task/坐席不得跨token租户。来源按已认证应用登记，body声明仅校验一致性；建议请求幂等按tenant+稳定app+operation+requestId，完整内容含方式/人工工号。关联变更、token撤销、旧共享应用记录/回执迁移及真实协议待S3/S4，不静默改写历史归属或重置预测失败额度。

**issue_id**：ISSUE-038

**primary_owner**：平台调度工程

**primary_evidence_group**：engineering

**prerequisite_before_design_finalization**：037/035供应商受理及在途执行权仍前置；本方事务不能自证供应商恰好一次

**design_review_now**：四元组共享额度、reserved/used、独占发起、取消与未知恢复持久协议

**implementation_evidence_after_development_before_release**：真实后端抢最后一槽、自动人工并发、外发前后崩溃、取消竞态与跨app/root/file累计

**depends_on**

1. ISSUE-002

2. ISSUE-035

3. ISSUE-037

**design_review_status**：awaiting_engineering_review

**implementation_validation_status**：not_started

**closure_status**：open_unchanged

**decision_ref**：runtime/staged-acceptance-user-decision-20261014.json

## ISSUE-039 [high] 外显导航自动降级支持边界

导航标识/号码池字段和现行CRN权重节点查询/增量更新契约已明确，不能再笼统称无导航配置接口。剩余是本项目导航配置、三类失败到降级的触发覆盖、生效及再次导入使用资源、黑名单作用对象和原生交互。120秒是已定业务等待，不要求先取得导航成功或解禁回执、不保证绝对换线路。

**issue_id**：ISSUE-039

**primary_owner**：AliCti＋平台工程

**primary_evidence_group**：external

**prerequisite_before_design_finalization**：本项目导航部署、三类触发覆盖/生效/资源、黑名单作用对象及原生交互；不新增导航成功回执前置

**design_review_now**：沿首次可信失败确认＋120秒及共享额度设计

**implementation_evidence_after_development_before_release**：真实工程重复事件不重置、到期/受理轨迹及权限/预算验证

**depends_on**

1. ISSUE-035

2. ISSUE-038

**design_review_status**：awaiting_engineering_review

**implementation_validation_status**：not_started

**closure_status**：open_unchanged

**decision_ref**：runtime/staged-acceptance-user-decision-20261014.json

## ISSUE-041 [high] 秒挂本地三态归一与可信证据更新契约

本地秒挂/非秒挂/待核逻辑及不再补导已定；普通预测call身份/原结果和批次查询候选有定义。剩余供应商字段可信单位/挂断方与模式证据共享005，本方需落实同call关联、可信false与unknown、原status/SIP/证据版本并存及迟到/冲突处理。DCC字段/version/ACK恢复本轮，正式交付协议由026共同承接；HTTP公共ACK不替代本地持久版本协议。

**issue_id**：ISSUE-041

**primary_owner**：平台结果工程

**primary_evidence_group**：engineering

**prerequisite_before_design_finalization**：005可信同call/客户字段及026正式DCC报文/ACK仍前置

**design_review_now**：同call原证据、三态判据、冲突优先待核、结果版本与交付原子保存

**implementation_evidence_after_development_before_release**：真实后端重复/乱序/晚补/冲突/重启、0与2边界、旧ACK、原结果不丢及不新建补导

**depends_on**

1. ISSUE-005

2. ISSUE-026

**design_review_status**：awaiting_engineering_review

**implementation_validation_status**：not_started

**closure_status**：open_unchanged

**decision_ref**：runtime/staged-acceptance-user-decision-20261014.json

## ISSUE-043 [medium] 人工外呼接收、坐席工号与结果关联契约

人工外呼接收并可选分配坐席已确认。建议同租户工号映射至有效坐席及账号后保存待联系；预测taskId仅预外呼必需，人工不构造供应商taskId/fileId。行级工号、priority与主子字段分支、重复分配、人工结果回传关联及正式坐席权限仍需S3/S4核对。

**note**：历史原消息追溯项；不伪造缺失正文。

## ISSUE-044 [medium] 应用租户多对多、租户token身份及历史请求迁移契约

SRC-121已确认应用与租户多对多，各业务系统应用分别配置回调地址。建议获取token显式tenantId，校验app关联tenant后绑定token租户；导入/task/坐席不得跨token租户。来源按已认证应用登记，body声明仅校验一致性；建议请求幂等按tenant+稳定app+operation+requestId，完整内容含方式/人工工号。关联变更、token撤销、旧共享应用记录/回执迁移及真实协议待S3/S4，不静默改写历史归属或重置预测失败额度。 SRC-123新增业务批次号必传且同app+tenant可复用；正式字段名/请求层级/长度、内容归一、同requestId改号冲突及旧请求缺值兼容待S4，不能用此号代替requestId/平台或供应商批次、重置额度。

**note**：历史原消息追溯项；不伪造缺失正文。

## ISSUE-045 [medium] 应用回调地址配置与积压结果路由

SRC120已确认所有接入业务系统均回调、未配置回调地址不得接口导入；SRC121已确认应用租户多对多且各应用分别配置回调地址。空地址策略及旧共享app地址问题已明确，不再待用户答复。待核地址变更后的既有未发/补送目标、配置版本与准确原app/tenant/record绑定、删除/解除关联后的积压保留、URL校验与正式回调版本/ACK；不接受导入body任意地址，不把配置成功当结果交付成功。 SRC-123新增本次外呼已结束且已完成沟通保存成功后的本次通话+已保存业务信息快照回调，全部每次回调带原businessBatchNo，原结果回调不撤销。须补本call动态字段/选项与配置版本、事件ID/版本/业务ACK、晚到话单和补送的正式双方契约；不发送aggregate跨通话合并。 SRC123补充要求已填写选填字段与枚举选项携保存时业务编码和值；多选全量，未填不伪造。须定义原租户配置编码/版本快照、历史缺码兼容和补全恢复；现有配置businessKey允许空、保存无编码快照。缺码不能以label/内部ID替代并宣称完整交付。

**note**：历史原消息追溯项；不伪造缺失正文。

## ISSUE-046 [medium] 振铃跟进草稿、人工状态与保存契约

SRC-119明确振铃可填写、未接通选择通话状态保存及继续跟进留待联系。SRC-122收敛其中状态字典子项：API-327完整20项/16码，715/183编码与描述成对保存；明确外呼客户未接且已结束时必选，183“未知”是明确选择而非空白，客观未知不自动代选。正式字段与保存契约、草稿恢复、旧“需要再次联系”兼容、其他业务表单条件必填及关联保存幂等仍待S3/S4/S6核验，因此本项保持开放。人工记录不得覆盖供应商结果/接通统计/秒挂证据；预外呼客户已接而坐席未接不套客户未接必选，不扩大呼入范围。字典核对不是生产联调。 SRC-123要求已完成沟通保存成功后形成该次已保存业务快照与交付事件；保存失败不触发，重复保存/后续修改的事件身份、快照原子性与恢复待工程；通用处理状态已完成不能代替该处理结果，不把人工选择当客观接通。 AC098将业务码快照绑定本次保存；已填缺码只标回调资料待完善，不阻断原校验有效的坐席保存或丢失草稿。字段/选项编码捕获、后续配置变化隔离、历史缺码补全与可靠事件恢复仍待工程核验。

**note**：历史原消息追溯项；不伪造缺失正文。

## ISSUE-047 [medium] 预外呼继续跟进的个人归属与排他联系

SRC121明确预外呼坐席选择继续跟进后，由当前坐席后续人工跟进，转入其待联系列表。个人归属不再待用户答复；仍须定义准确原线索/通话/任务溯源、同租户坐席权限、重复保存去重及与原预测任务后续拨打的排他处理。供应商原生重呼停止/取消须验证实际能力和结果；本地方保存跟进、建立个人待联系不等于已停止远端拨打，未确认前不得制造并行人工呼叫。

**note**：历史原消息追溯项；不伪造缺失正文。
