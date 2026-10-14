# 全局业务逻辑

[22条规则讨论投影](business-rules.md) · [局部逻辑](local-logic.md) · [字段](field-specs.md)

**schema_version**：draft-logic-20261014

**状态**：DRAFT_INCREMENTAL_DISCUSSION_NOT_FROZEN

**generated_on**：2026-10-14

**范围**

**功能**

1. FUNC-001

2. FUNC-002

3. FUNC-004

4. FUNC-005

5. FUNC-006

6. FUNC-009

7. FUNC-010

8. FUNC-011

9. FUNC-012

10. FUNC-013

11. FUNC-014

12. FUNC-015

13. FUNC-016

14. FUNC-017

15. FUNC-018

16. FUNC-019

17. FUNC-020

18. FUNC-021

19. FUNC-022

**feature_count**：19

**acceptance_count**：104

**business_rule_count**：22

**user_story_count**：12

**scenario_count**：7

**feature_status**：19 existing FUNC identifiers carried forward; S7 mapping stale and pending rerun

**独立草案操作**

1. DRAFT-OP-MANUAL-ASSIGN

2. DRAFT-OP-FOLLOWUP

3. DRAFT-OP-COMPLETION-CALLBACK

**draft_rule_count**：28

**priority_policy_ref**：开发交付物/1.1.0/规划工作区/draft-20261014.json#priority_policy.user_request

**priority_groups**

#### P0-APP 应用接入

**标识**：P0-APP

**主题**：应用接入

**级别**：P0

#### P0-IMPORT 导入客户接口

**标识**：P0-IMPORT

**主题**：导入客户接口

**级别**：P0

#### P0-FOLLOWUP 外呼早填与未接通填单

**标识**：P0-FOLLOWUP

**主题**：外呼早填与未接通填单

**级别**：P0

**priority_boundary**：仅以上三组及明确列出的依赖最优先；原手工CSV导入不整体升P0，其他功能保留原优先级或未另排。本次没有删减其功能/规则或替代04/05门禁。

**source_boundary**

**requirements**：当前12故事/104验收/7场景；SRC125请求级业务类型增量由04独立S1/S2核验。G1/G2/G3pending，正式S3～S9stale。规范化US/AC及真实用户来源优先，原101条正文保留。

**prototype**：SRC124六项选填来源字段已局部实现原导入CSV/预览/详情/早填工作台及本call来源传递，21组定点源码检查通过，浏览器范围见新证据。此前早填/未接状态证据保留各自范围。正式多对多身份/双方式API/全部应用回调与完成事件仍未实现；局部证据不代表整版验收或门禁。 本地合成应用新增/编辑可保存callbackUrl，详情可回读；允许未配置应用先保存但合成接口导入会拒绝，手工UI导入不受该门槛影响。http(s)基础格式/禁止内嵌账号密码为本地演示校验，正式URL安全/积压选址/后端鉴权/ACK仍待核；未实现真实回调。 SRC125业务类型新证据41组通过，名单/详情浏览器定点通过。仅现有预外呼本地合成接收、准确记录/结果传播及原类型跟进表单；完整人工外呼接口、真实鉴权、业务批次号、完成沟通事件和真实回调仍未实现或未验证，未执行整版S8/三宽度验证。

**engineering**：后端仓库/栈及正式身份、回调、人工分配与供应商排他协议仍待核。本次是开发交付讨论稿，不批准生产开发或上线。

**格式**：独立增量讨论视图，非标准05正式导入或READY；既有FUNC/BR只保留稳定引用作本轮草案投影，不视作上游S3～S8现行结果。新增独立操作使用DRAFT-OP，不伪造正式FUNC。

**global**

**overview**：应用与租户多对多，各系统独立应用及回调；接口按明确租户身份接收，缺回调不得导入。预外呼用原任务组与既定失败策略，人工按工号分配待联系。工作台振铃可填写，未接人工状态独立保存，继续跟进保留待联系；预外呼转当前坐席人工且待核原任务排他。所有应用接口来源逐次回调，手工UI无应用仅查看。

**system_boundary**

**DCC/天网等接入业务系统**：各自应用凭据、显式租户身份提案、外呼方式及人工工号；在本应用回调地址接收每次结果和进度，不调度平台预测失败补提。

**云呼叫中心**：有效应用租户关联、缺回调拒绝、逐行保存、人工分配、预测导入、可信结果/人工记录区分、跟进待联系与回调补送。

**AliCti**：实际拨号/任务原生规则/导航/真实话单与失败；预外呼转人工的原生执行权与停止能力仍待证据。

**坐席**：既有人工/预外呼工作台从振铃写草稿，结束后按提案保存独立人工状态及处理结果；本人待联系主动拨打。

**actors**

1. 超管

2. 运营/管理员

3. DCC/天网

4. 云呼叫中心

5. AliCti

6. 坐席

**invariants**

#### BR-001

**标识**：BR-001

**statement**：超管独立管理应用列表、详情、新增、修改和删除。应用与租户多对多：一个应用可关联多个有效租户，一个租户可关联DCC、天网等多个应用，各业务系统使用自己的应用凭据与回调地址。认证识别稳定应用，业务身份明确当前租户且须有有效关联，任务归租户不另绑应用。来源由稳定应用登记识别；报文source若保留仅一致性校验，不能换系统/回调。正式登记/认证及token字段为待核设计，原型仅合成。 本期应用列表/查看/新增/修改/删除均仅超管可访问执行，非超管含租户管理员和普通运营不能通过菜单、直接页面或管理调用越权，拒绝不改配置。应用身份发放的租户业务权不能代替管理权限；不自动新增启停、重置、收费或管理权限授予操作。 应用凭据可针对已有效关联的租户取得该租户业务身份，不授应用管理或运营/管理员权。本方建议获取token时显式指定tenantId，核应用与租户关联后签发绑定稳定app和该tenant的token；缺失、无效或未授权租户拒绝，不默认首个/最近租户。导入body、原任务或指定坐席若与token租户不一致拒绝；切换租户需取得对应身份，不通过请求字段切租户。正式字段、时效、关联撤销和旧token处置待S4/工程核验，真实账号权限不改变。 创建/修改允许应用与租户多对多，核每个关联租户真实有效且关系不重复；同一租户已关联其他应用不是冲突。DCC/天网分别保留自己的appId/凭据/回调配置。历史已有多关联及业务记录保留，不按已取代的一对一方案静默删除、合并或迁移；解除关联后的token/在途请求和历史接收目标处置待S4/工程验证，不默认首个租户。 多租户身份验收提案：同一应用可分别申请已关联租户A/B身份并各自导入；缺tenantId、未关联租户、A身份请求B任务/坐席或正文租户时明确拒绝且不新增业务。另一应用在同租户的请求与回调仍归其自身配置，不按报文source切应用。关联撤销、旧token及并发变更的正式响应/有效期需S4和工程补证，不默认首个或最近租户。

**来源映射**：memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-044, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-085, memory/normalized-user-stories.json#AC-092, memory/project-facts.json

**验证引用**

1. CHECK-017

2. CHECK-044

3. CHECK-045

4. CHECK-085

5. CHECK-092

**状态**：draft_projection_current_S1_S2_not_upstream_BR_revision

#### BR-002

**标识**：BR-002

**statement**：预外呼范围：外部调用方（DCC／天网）接口同tenant/原supplierTaskId/leadCode固定phone的真实再次业务导入用新请求级requestId；有效新行创建新记录/单手机号batchId并归同组。isNewBatch=true另开独立主(root=batch)，false/未传有主则新子挂最近已保存同组主，无主自动首主；不要求外部调用方（DCC／天网）提供上一批次，不仅因同组历史相同而拒绝。同ID同归一后完整内容技术重传返原逐行映射，不新建重交。 外部接口每次业务请求携requestId、多行定位及leadCode/phone/priority，外呼方式按AC-080。各系统使用自己的稳定应用身份和明确的当前租户，须有效关联；接收前核该应用回调配置，缺失按AC-086拒绝，人工外呼也不豁免。预外呼沿可选Boolean isNewBatch及新record/单号batch/root，人工不套主子字段。原app/tenant/业务来源及交付关系保存；source若保留只校验与应用登记一致，不以名称/R或报文自行换来源。 仅预外呼新业务有效行按同tenant/原supplierTaskId/leadCode固定phone归组；true另开独立主root=batch，false/缺省新子挂最近已保存同组主，无主自动首主。最近主按本地主批稳定顺序，不按结果/priority/同号/子批，子不挂子，无需previousBatchId。应用与其登记来源仅用于鉴权审计及原记录回调，不加入预外呼业务组/失败预算键；同组不同应用各保留原接入来源，不按root决定子记录接收端。人工不使用本条主子规则。 仅预外呼新业务逐行核token租户、原supplierTaskId、leadCode及固定phone；改号、归属冲突或历史主关系不明拒绝/待核，其他有效行继续。isNewBatch必须Boolean，缺省false，不绕校验或重置正常任务轮次/失败额度。先核稳定app与token租户有效关联，按应用登记保存来源；source若保留仅一致性校验，非法/冲突不得改路由或默认DCC。应用/来源不分割既定业务组和额度，历史身份冲突不猜配。人工分支核同租户坐席，不虚构任务组。 鉴权稳定应用、当前租户及其有效关联，校验外呼方式和分支对象后，按建议tenant+stableApp+operation+requestId作用域核完整归一内容。技术重传返原逐行接收/拒绝/待核结果和实际映射，不新保存、分配、提交或呼叫。预外呼missing isNewBatch归一false，返原record/batch/root，不重选新主；人工只返真实客户/分配。外呼方式、坐席工号与保留的source一致性字段纳入内容比较；不能改source切换命名空间。不同应用或租户各自隔离，正式键与历史回执兼容待S4。 在已鉴权tenant+stableApp+operation的拟定作用域内，同requestId完整有效内容不同拒整个重复请求，不覆盖原回执或新增记录/分配/批次/供应商提交/呼叫。比较实际方式、预测原taskId或人工工号、行定位及leadCode/phone/priority/R等；保留source时还核与应用登记一致。预测missing isNewBatch与false归一相同，true不同。跨租户/应用不得借ID复用另一主体回执，正式命名空间、完整摘要及历史兼容待S4。 导入接口明确外呼方式（预外呼或人工外呼）；先核稳定应用与当前明确租户的有效关联及应用回调地址。预外呼按原任务坐席组，人工须指定同租户有效坐席工号按US-011。业务来源由应用登记识别，报文source若保留仅做一致性校验；不能用它换租户/系统或回调地址。全部应用接口来源均按原应用配置回调，人工外呼不等于手工UI来源。字段名/层级与身份传递为本方设计待S4。 SRC123补充：新接口请求必带可复用业务批次号，按原应用/租户保存回传，纳入requestId完整内容比较；不改变平台主子及供应商批次，不给原手工CSV新增必填。

**来源映射**：memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-080, memory/project-facts.json, memory/normalized-user-stories.json#AC-093, memory/normalized-user-stories.json#AC-094

**验证引用**

1. CHECK-010

2. CHECK-047

3. CHECK-048

4. CHECK-049

5. CHECK-050

6. CHECK-051

7. CHECK-080

8. CHECK-093

9. CHECK-094

**状态**：draft_projection_current_S1_S2_not_upstream_BR_revision

#### BR-003

**标识**：BR-003

**statement**：接口与原手工导入的R均可选来源元数据，无需字典/允许范围校验；未传不导致行失败，提供则保留追踪，priority独立。保留旧R，不新增默认R枚举；通用输入安全/长度等正式规范仍待核。 外部调用方（DCC／天网）每条业务导入priority沿原规则必填，未传仅该条失败，不补默认值；本次值独立于R，且不强制继承旧批次。预外呼按保存priority排序并提交原供应商任务；人工外呼保存该字段但不因此进入预测任务队列、不透传预测号码导入或自动拨号。人工列表排序是否使用priority未新增规则。 本地保存原客户称呼、号码、备注和按业务类型的编码，以及leadCode/最终priority/可选R；线索类新导入的单一编码同源写入leadCode与兼容externalDocumentId，其他类型及历史记录不批量改写。外部接口保存requestId/行、验真租户/稳定应用、由应用登记识别的业务来源及外呼方式；人工分配另保存原坐席工号及解析后的身份。预外呼保存原任务、record/batch/root、原时间和实际供应商映射，失败补提固定触发root/priority及共享连续额度；人工不伪造预测映射或预算。原接入来源不因应用改名/删除或后续同组记录改变。所有已鉴权并保存接入应用/source的接口来源准确结果（含DCC、天网）按US-006回调；原手工UI导入且无接入应用者仅平台查看，秒挂不补提交。 预外呼范围：手工priority统一/逐条填写，仅提交前可改；确认时每个有效行最终priority必填，保存后单手机号独立拆批自动提交。提交后无人工改priority或日龄自动降级；本轮恢复原手工界面体验，统一/逐条调整留在原检查区，原客户信息保留；不新增对外请求或主子控制输入。 预外呼范围：手工线索类只显示并填写一个必需的“线索编码”，复用原动态编码输入，不额外要求同义“业务编码”。保留原基础信息、称呼、号码、备注、CSV文件上传／粘贴／检查／确认；最终priority必填且提交前可统一或逐行填写，联系备注和R选填后置。R无需字典维护/范围校验，缺R不失败；一手机号一批次，失败沿本次可信成功下载后的快照清理规则。 原客户信息完整保留，原编码按实际业务类型命名。线索类使用一个“线索编码”输入，本次新导入以同一值保存leadCode和兼容键externalDocumentId，不批量改写历史记录；售后类／活动类继续对应单据名称及现有独立leadCode，本轮不重定义。原CSV选文件／粘贴与检查确认保持；旧线索类CSV若含两编码列且值相同可兼容，值不一致应提示并保留输入供修正，不静默覆盖或丢弃原信息。

**来源映射**：memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-069, memory/project-facts.json

**验证引用**

1. CHECK-005

2. CHECK-009

3. CHECK-014

4. CHECK-030

5. CHECK-031

6. CHECK-069

**状态**：draft_projection_current_S1_S2_not_upstream_BR_revision

#### BR-004

**标识**：BR-004

**statement**：一次已鉴权外部调用方（DCC／天网）传入多客户，某条记录业务校验失败仅拒绝该条，其余有效记录继续；预外呼按原单手机号批次处理，人工外呼有效行按US-011保存并分配，不因单行业务失败整请求回滚。请求级身份、来源/外呼方式或技术重传冲突另按AC-080/050/051处理。 预外呼范围：有效手工客户完成当前校验、本地新增独立记录及单手机号批次后，以该原任务已保存的准确供应商任务ID和最终priority自动提交供应商接口，无需运营再手动提交；不采用统一预设供应商任务、不猜任务映射。 仅预外呼导入携带准确的原供应商任务ID taskId；自动提交供应商时直接使用，不做本地任务ID猜测、不采用统一预设任务。人工外呼按US-011分配指定坐席；复用现有人工流程、无需预测taskId为本方设计建议待范围审阅，不伪造预测任务或fileId。 预外呼范围：本地校验保存成功但供应商明确拒绝接收时，纳入导入失败记录，供运营下载并展示供应商返回失败原因。 同步及53异步明确导入失败均适用，未知不误判；导入失败与呼叫失败分开。 预外呼范围：同步返回result=0不代表逐条全成功：分别展示本地校验/保存、供应商导入、呼叫阶段；保留importTotal/successTotal/invalidTotal原始数量与来源。有准确同步证据的成功正常记录；仅汇总数量不能任意指定成功行，未知/矛盾待核，不将同步响应一概降为仅受理。 预外呼范围：导入阶段明确失败保存并展示原始原因及准确tenant/原task/record/batch/root/leadCode/phone与实际fileId关联；无准确关联待核。已鉴权保存应用/source的全部接口来源按US-006回调准确导入失败，无接入应用的手工UI来源仅平台查看；导入失败不计实际呼叫、不触发11类呼叫失败补提交，结果交付失败不重新提交供应商。 导入接口明确外呼方式（预外呼或人工外呼）；先核稳定应用与当前明确租户的有效关联及应用回调地址。预外呼按原任务坐席组，人工须指定同租户有效坐席工号按US-011。业务来源由应用登记识别，报文source若保留仅做一致性校验；不能用它换租户/系统或回调地址。全部应用接口来源均按原应用配置回调，人工外呼不等于手工UI来源。字段名/层级与身份传递为本方设计待S4。 应用未配置回调地址时不得接口导入，覆盖全部应用接入业务系统含DCC/天网和两种外呼方式；本方建议在新业务落账前统一检查，缺失则明确返回未配置原因，不新增客户/分配/预测批次/供应商提交，补配置后方可重新发起。不能先导入再排队等地址，也不回退到旧固定DCC地址或其他应用地址。正式错误结构、历史技术重传只读回执及地址删除并发守卫待S4，不把URL已填写当作已完成真实联调。

**来源映射**：memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-080, memory/normalized-user-stories.json#AC-086, memory/project-facts.json

**验证引用**

1. CHECK-007

2. CHECK-011

3. CHECK-012

4. CHECK-013

5. CHECK-039

6. CHECK-041

7. CHECK-080

8. CHECK-086

**状态**：draft_projection_current_S1_S2_not_upstream_BR_revision

#### BR-005

**标识**：BR-005

**statement**：预外呼范围：运营人员在云呼叫中心下载导入失败记录；未下载记录不设固定到期、持续保留；仅可信成功下载后删除本次成功导出的失败明细和对应文件，不影响成功客户和必要业务状态；失败、中断或未知保留。异步失败按固定快照清理，后到新失败留待下次，已导出重复不再生成；去重、关联、分片、内部尝试及累计已用/未知占用不随明细删除。 预外呼范围：既有失败导出入口生成本次固定失败明细快照并显示已知分片完整性；未收齐或未知显示不完整/待核。可信成功下载仅删除本快照明细与文件，失败、中断或未知保留，后到新失败进入后续下载；保留必要业务关联、去重、分片、计划/内部尝试、累计已用及未知占用，已导出重复不再生，不能清空整批客户。

**来源映射**：memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-042, memory/project-facts.json

**验证引用**

1. CHECK-008

2. CHECK-042

**状态**：draft_projection_current_S1_S2_not_upstream_BR_revision

#### BR-006

**标识**：BR-006

**statement**：平台取消每日定时查询当天/历史待跟进号码状态及自然日priority衰减，不因未拨、已拨未接通、跨日或原导入日期计算改写存量priority；仅服务衰减的状态查询退出。既有每次可信事件、话单/SIP及无话单失败记录和平台查看继续保留。 不执行每日状态查询、自然日priority衰减或存量priority改写。失败補提交用触发记录保存priority并留原时间审计；秒挂仅判定保存，应用接口来源含DCC/天网均按应用配置回调，无接入应用的手工UI来源平台查看，不提交重呼。

**来源映射**：memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-032, memory/project-facts.json

**验证引用**

1. CHECK-015

2. CHECK-032

**状态**：draft_projection_current_S1_S2_not_upstream_BR_revision

#### BR-007

**标识**：BR-007

**statement**：预外呼范围：有该原任务操作权限的运营或管理员选择并明确确认当前指定记录的供应商号码删除；服务端逐次核实当前权限、授权租户/原任务及准确record/batch/已保存实际fileId/phone，不按leadCode、root或同号整组扩大。只有指定供应商目标明确成功才标已删；本地客户记录、原来源审计、主子root、精确供应商/通话映射、去重和累计已用/未知占用继续保留。删除/取消意图已授权且目标准确后阻断该对象尚未执行失败计划，不影响其他批次；不假造已受理或在途呼叫撤回。 预外呼范围：指定记录删除/取消不抹本地原秒挂话单、准确关联、已保存三态判定及本地版本，不影响其他任务/同号其他批次。秒挂无待执行补提交计划，供应商指定删除只复用US-008当前权限与精确选择范围；不新增秒挂停止API，远端在途能力继续待核。 预外呼范围：对已授权且准确指定的删除/取消目标，原子停止仅该对象尚未执行失败计划；供应商明确成功后本地标记该目标已从供应商删除，失败或未知保持真实状态。平台分别展示本地计划停止与供应商删除结果，保存原记录/root/预算和证据；不清root整组、不影响其他同号批次、不释放已用或未知占用。在途取消和并发受理仍待核，不假造远端撤回。 预外呼范围：指定供应商删除切换目标记录或供应商结果样例时清除此前反馈，不把旧成功/失败显示为当前选择已处理。新操作由当前原任务权限的运营/管理员选择准确record/batch/fileId/phone并确认，服务端同时核实租户任务和当前权限；旧对象已保存删除证据继续留在旧记录。tels优先于fileId/fileName，不按AND交集选择；仅实际fileId独占精确单号目标时可采用不同时传tels的taskId+fileId候选，共享fileId多尝试不能精确定位则不外发。result=0可能跳过目标，必须核skippedCallingTels；skipRetry不保证取消原生重呼，正式skip选择及在途能力仍待核，不默认新增远端撤回。

**来源映射**：memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-061, memory/project-facts.json

**验证引用**

1. CHECK-016

2. CHECK-024

3. CHECK-025

4. CHECK-061

**状态**：draft_projection_current_S1_S2_not_upstream_BR_revision

#### BR-008

**标识**：BR-008

**statement**：接收线路侧每次可信话单/call/SIP及原始结果，精确关联保存，运营沿既有任务权限查看；已鉴权保存应用/source的接口来源结果（含DCC、天网）交US-006回调。呼叫过频和任务配置状态仅交AliCti原生重呼，11类失败转异常策略，秒挂仅判定不额外提交；原生覆盖/执行权互斥仍待核。 预外呼范围：三天五呼仅适用于任务重呼规则配置状态触发的正常重呼执行流程；呼叫过频只交任务规则，11类失败平台补提交不认作该次数。三天起算、五呼是否含初呼及跨子批延续口径仍待供应商确认，本平台不汇总改写为失败额外次数。 每次可信结果保存原供应商finishRetryFlag Integer1最后一条/0否，未知或未返回独立表示，与SIP更新分开；不能据该标志宣布任务结束或无在途。每次准确结果和可信晚更新均保存，应用接口来源含DCC/天网交US-006回调，不只保存/回传最后一条；无接入应用的手工UI来源同样保存每次准确原结果及可信晚更新，仅平台查看。 未可信纯SIP独立保留待核来源证据，不改已确认呼叫结果、不冒充可信非SIP冲突、不阻止随后准确可信call/SIP更新。验收未可信SIP→可信call→可信SIP及可信call→未可信SIP→可信SIP两种顺序：无其他真实可信矛盾时更新同一原call的SIP字段和本地版本，不新增呼叫；真正可信关联或非SIP结果冲突仍待核。

**来源映射**：memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-062, memory/project-facts.json

**验证引用**

1. CHECK-002

2. CHECK-026

3. CHECK-038

4. CHECK-062

**状态**：draft_projection_current_S1_S2_not_upstream_BR_revision

#### BR-009

**标识**：BR-009

**statement**：接收并保存可信准确预测呼叫失败原始原因，应用接口来源含DCC/天网交US-006回调，无接入应用的手工UI来源平台查看。无话单失败不等待客户状态推送或话单；准确稳定事件身份与原因映射仍待核。 可信准确的11类预测呼叫失败分类保存。禁呼、限呼、restrict tel即外呼黑名单三类从平台收到并确认每次失败起算120秒自动补提交，线路降级依赖供应商外显导航，不先取得解禁/降级成功回执；其余八类仅人工。自动/人工共享首次外最多2次，无话单可信失败直接记录；导航覆盖、配置、执行权和真实事件仍待核。 预外呼范围：除呼叫过频外11类失败：禁呼、限呼、restrict tel三类自动，其余无可用中继/bad tel/真实号码为空/no clid/bad clid/无可用中继信息/wrong obClidGroup/bad timeout range八类人工。过频只任务规则；未知原因、同步导入拒绝、53不进本策略。接口结果交付失败只补送，不能生成新的失败补提交。 预外呼范围：自动3类等待2分钟，依赖供应商外显导航降级线路，平台不直接换主叫、不自动修改priority，也不自行解禁。2分钟从平台收到并确认每次准确失败结果起算；导航覆盖/生效和同号再次接收未核时不能宣称生产可执行。人工8类由有权任务处理用户核对资源、数据或配置后明确发起，不要求全部等待2分钟，不静默修改真实phone。 预外呼范围：同一准确失败事件最多形成一份有效自动计划或待人工对象；重复推送、重复确认、SIP晚更新不重建、不重复消耗额度、不重启计时，自动/人工并发沿同一独占执行守卫。120秒取首次保存本次准确失败确认时间，新的真实补提失败才按新确认时间起下一轮，额度延续；事件身份或提交未知保持同尝试占用待核。

**来源映射**：memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/project-facts.json

**验证引用**

1. CHECK-003

2. CHECK-020

3. CHECK-063

4. CHECK-065

5. CHECK-066

**状态**：draft_projection_current_S1_S2_not_upstream_BR_revision

#### BR-010

**标识**：BR-010

**statement**：准确判定秒挂后保存真实呼叫、原话单、供应商原结果、本方秒挂/非秒挂/待核三态及证据；应用接口来源含DCC/天网交US-006明确回调，无接入应用的手工UI来源仅平台查看。秒挂不生成平台重导计划，不再提交供应商。 先准确关联同一真实呼叫；整体归属或可信证据冲突先待核。客户真实接听、客户主动挂断、可信客户有效接通时长0～2秒含真实0及2分别为true/false/unknown：任一可信false即明确非秒挂，即使其余unknown；三项均可信true才为秒挂；无false且至少一项unknown则待核。缺失/异常/负时长或单位未核为unknown，不补0，不以坐席桥接时长替代，生产字段/单位/挂断枚举仍待核。 秒挂不再提交重呼，不发放秒挂补提交额度、不设置等待间隔或计时器、不生成异常子批；撤销旧额外2次、30分钟和4次规则。仅预外呼的11类失败链共享最多额外2次保持独立，不因人工外呼分配新增该额度。 每次本地结果保留tenant、保存leadCode/fixedphone及准确真实call或稳定事件关系。预外呼另留原task/record/batch/root及实际fileId；人工只留实际客户/分配/坐席/通话关联，不伪造预测映射。接口均保存原requestId/行及与认证应用登记一致的来源；预测内部失败补提固定触发root，后有新主不改旧root。缺真实callId/稳定事件不按最近同号或近似时间猜配；符合US-006的全部应用接口来源准确结果交付（含DCC、天网），无接入应用的手工UI来源仅平台查看。人工生产结果映射待S4核验。 仅预外呼三天五呼针对任务重呼配置状态触发的呼叫，预测失败自动/人工共享额外2次不认作该次数。秒挂仅判定保存，全部应用接口来源且精确关联的记录按应用配置回调，绝无平台秒挂重呼计数/额度/计划；人工外呼分配不自动套用预测任务重呼规则。供应商原生覆盖仍待核，不新增再导入或停止其原生重呼。 能确认已接听、客户挂断且真实接听时长0秒，纳入秒挂；未接通、缺失或异常时长不纳入。

**来源映射**：memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-034, memory/project-facts.json

**验证引用**

1. CHECK-004

2. CHECK-021

3. CHECK-022

4. CHECK-023

5. CHECK-027

6. CHECK-034

**状态**：draft_projection_current_S1_S2_not_upstream_BR_revision

#### BR-011

**标识**：BR-011

**statement**：准确判定秒挂后保存真实呼叫、原话单、供应商原结果、本方秒挂/非秒挂/待核三态及证据；应用接口来源含DCC/天网交US-006明确回调，无接入应用的手工UI来源仅平台查看。秒挂不生成平台重导计划，不再提交供应商。 每次本地结果保留tenant、保存leadCode/fixedphone及准确真实call或稳定事件关系。预外呼另留原task/record/batch/root及实际fileId；人工只留实际客户/分配/坐席/通话关联，不伪造预测映射。接口均保存原requestId/行及与认证应用登记一致的来源；预测内部失败补提固定触发root，后有新主不改旧root。缺真实callId/稳定事件不按最近同号或近似时间猜配；符合US-006的全部应用接口来源准确结果交付（含DCC、天网），无接入应用的手工UI来源仅平台查看。人工生产结果映射待S4核验。 预外呼范围：指定记录删除/取消不抹本地原秒挂话单、准确关联、已保存三态判定及本地版本，不影响其他任务/同号其他批次。秒挂无待执行补提交计划，供应商指定删除只复用US-008当前权限与精确选择范围；不新增秒挂停止API，远端在途能力继续待核。 仅预外呼三天五呼针对任务重呼配置状态触发的呼叫，预测失败自动/人工共享额外2次不认作该次数。秒挂仅判定保存，全部应用接口来源且精确关联的记录按应用配置回调，绝无平台秒挂重呼计数/额度/计划；人工外呼分配不自动套用预测任务重呼规则。供应商原生覆盖仍待核，不新增再导入或停止其原生重呼。 能确认已接听、客户挂断且真实接听时长0秒，纳入秒挂；未接通、缺失或异常时长不纳入。 全部应用接口来源含DCC/天网均对准确秒挂输出明确本方分类并按应用配置回调；无接入应用的手工UI来源保存同样三态供本地查看。保留原供应商结果及真实call、实际request/行/客户/分配关联，预测字段仅用于真实预外呼对象；坐席人工选择的通话状态不替代秒挂证据或供应商结果。来源由认证应用的稳定业务系统登记识别；报文source若保留仅校验一致性，不改变身份或接收目标。字段/版本/ACK及人工话单映射待核；未知不标秒挂，补送不产生供应商提交、新分配或计时。

**来源映射**：memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-075, memory/project-facts.json

**验证引用**

1. CHECK-004

2. CHECK-023

3. CHECK-024

4. CHECK-027

5. CHECK-034

6. CHECK-075

**状态**：draft_projection_current_S1_S2_not_upstream_BR_revision

#### BR-012

**标识**：BR-012

**statement**：预外呼范围：外部调用方（DCC／天网）接口同tenant/原supplierTaskId/leadCode固定phone的真实再次业务导入用新请求级requestId；有效新行创建新记录/单手机号batchId并归同组。isNewBatch=true另开独立主(root=batch)，false/未传有主则新子挂最近已保存同组主，无主自动首主；不要求外部调用方（DCC／天网）提供上一批次，不仅因同组历史相同而拒绝。同ID同归一后完整内容技术重传返原逐行映射，不新建重交。 预外呼范围：平台异常补提交保留触发记录原任务、来源及保存root，用内部计划/尝试标识，新子批固定原root不随后来新主改变。外部来源保留原已验证应用、requestId/行审计及逐记录交付关系，接口来源含DCC/天网交US-006回调，无接入应用的手工UI来源平台查看；不伪造新的外部业务请求；独立内部执行继续遵守累计共享失败额度与UNKNOWN占用。 仅预外呼新业务有效行按同tenant/原supplierTaskId/leadCode固定phone归组；true另开独立主root=batch，false/缺省新子挂最近已保存同组主，无主自动首主。最近主按本地主批稳定顺序，不按结果/priority/同号/子批，子不挂子，无需previousBatchId。应用与其登记来源仅用于鉴权审计及原记录回调，不加入预外呼业务组/失败预算键；同组不同应用各保留原接入来源，不按root决定子记录接收端。人工不使用本条主子规则。 鉴权稳定应用、当前租户及其有效关联，校验外呼方式和分支对象后，按建议tenant+stableApp+operation+requestId作用域核完整归一内容。技术重传返原逐行接收/拒绝/待核结果和实际映射，不新保存、分配、提交或呼叫。预外呼missing isNewBatch归一false，返原record/batch/root，不重选新主；人工只返真实客户/分配。外呼方式、坐席工号与保留的source一致性字段纳入内容比较；不能改source切换命名空间。不同应用或租户各自隔离，正式键与历史回执兼容待S4。 在已鉴权tenant+stableApp+operation的拟定作用域内，同requestId完整有效内容不同拒整个重复请求，不覆盖原回执或新增记录/分配/批次/供应商提交/呼叫。比较实际方式、预测原taskId或人工工号、行定位及leadCode/phone/priority/R等；保留source时还核与应用登记一致。预测missing isNewBatch与false归一相同，true不同。跨租户/应用不得借ID复用另一主体回执，正式命名空间、完整摘要及历史兼容待S4。 准确结果保存其实际record、号码及可信callID或稳定事件，leadCode不能替代真实呼叫身份。预外呼另保存原task/batch/root及实际fileId；人工沿真实客户/坐席分配/呼叫关联，不伪造预测字段。接口来源保留原验真app/tenant、requestId/行和与认证应用登记一致的来源，原手工不新增对外协议。去重/审计不因下载或删除丢失；预外呼补提固定触发root。应用接口来源含DCC/天网且关联准确者按US-006回调，无接入应用的手工UI来源仅查看；来源或关联不足待核，不默认DCC。 预外呼范围：触发M1的失败迟到且本地已保存M2时，本方补提交单号子批仍关联触发记录保存的M1 root，不改挂最近主；本地新增内部触发事件/尝试映射，不新增第三层业务批次，不按root分别发额度。手工不增加主批选择控制字段，可信历史root不足先待核。

**来源映射**：memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-068, memory/project-facts.json

**验证引用**

1. CHECK-010

2. CHECK-019

3. CHECK-048

4. CHECK-050

5. CHECK-051

6. CHECK-052

7. CHECK-068

**状态**：draft_projection_current_S1_S2_not_upstream_BR_revision

#### BR-013

**标识**：BR-013

**statement**：预外呼范围：自动三类和人工八类按同租户＋原任务＋服务端已保存线索编码＋固定手机号累计，共享首次外最多2次失败补提交；另开主批、新子批、新fileId、原因、方式或操作人变化不重置。实际新的业务补提交发起占一次，明确接收或拒绝均计，未知保留占用待核；首次导入不计额外失败次数，正常任务重呼独立，秒挂无补提交。历史四元组或累计账不可恢复先待核，不以业务编码/空值/新root或新生成线索编码默认发2次；既有外部新业务记录亦不重置保存的累计账。 预外呼范围：同一准确失败事件最多形成一份有效自动计划或待人工对象；重复推送、重复确认、SIP晚更新不重建、不重复消耗额度、不重启计时，自动/人工并发沿同一独占执行守卫。120秒取首次保存本次准确失败确认时间，新的真实补提失败才按新确认时间起下一轮，额度延续；事件身份或提交未知保持同尝试占用待核。 预外呼范围：同一次后续执行在AliCti任务原生重呼与本方异常补提交之间保持互斥；不能按未查到话单、缺finishRetryFlag或单一最后标志推定无在途重呼。未核执行权时保持待核，不保证安全重提。 预外呼范围：自动3类计划到期或人工8类明确发起时，在失败额度可用、关联准确、任务可执行及供应商执行权不冲突的条件下，实际发起一次并占用一次。成功/失败均计数，未知保留占用待核，不自动释放再发。暂停挂起、终止停止尚未执行计划，恢复后重新核查；人工不能绕过停止状态或次数，在途/技术传输恢复仍待核。 预外呼范围：人工与自动失败按同租户+原任务+线索编码+固定手机号共享首次外2次，另开主批也不重置。额度用尽、已有占用/未知、任务暂停/终止或当前任务权限不足时按钮不可执行并说明原因。双击/并发/重复反馈不产生额外一次，原因/方式/操作人变化不重置；服务端同步校验，不能仅前端禁用。

**来源映射**：memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-078, memory/project-facts.json

**验证引用**

1. CHECK-064

2. CHECK-066

3. CHECK-067

4. CHECK-073

5. CHECK-078

**状态**：draft_projection_current_S1_S2_not_upstream_BR_revision

#### BR-014

**标识**：BR-014

**statement**：预外呼导入、呼叫结果、失败处理及秒挂判定沿既有任务级记录页和任务区域，常驻导入客户入口及原手工大弹窗保持，不新增顶级运营入口；恢复系统设置应用接入列表/新增/详情/修改/删除与后台租户token，仅超管管理，现有登录/租户/任务权限沿用。 预外呼“导入客户”入口常驻，本轮对已锁手工来源的任务打开既有手工导入。当前权限、只读或任务状态不可导入时保留禁用入口和原因，后端同时校验当前租户任务归属、来源与既有可导入状态；不通过按钮改变历史任务补导规则。历史接口来源记录保留，不切换为手工，不通过本轮新增名单混入。 预外呼范围：手工priority统一/逐条填写，仅提交前可改；确认时每个有效行最终priority必填，保存后单手机号独立拆批自动提交。提交后无人工改priority或日龄自动降级；本轮恢复原手工界面体验，统一/逐条调整留在原检查区，原客户信息保留；不新增对外请求或主子控制输入。 预外呼范围：手工线索类只显示并填写一个必需的“线索编码”，复用原动态编码输入，不额外要求同义“业务编码”。保留原基础信息、称呼、号码、备注、CSV文件上传／粘贴／检查／确认；最终priority必填且提交前可统一或逐行填写，联系备注和R选填后置。R无需字典维护/范围校验，缺R不失败；一手机号一批次，失败沿本次可信成功下载后的快照清理规则。 预外呼任务列表和任务内“导入客户”入口常驻，按所选任务已锁定来源使用对应既有入口；手工来源保持原大弹窗，接口来源不混入手工名单，不切换来源。无权/只读/状态不允许保持禁用及原因；历史可补导任务仅未启动状态沿原权限/名单策略，保留旧名单批次累计，不借入口扩大启动后的初始导入策略。供应商运行任务接收矩阵仍待核。 原手工导入的上传/粘贴内容、检查结果和最终行编辑必须绑定同一当前草稿；换文件、改文本、检查失败/空结果使旧预览失效。提交处理中锁定，落账前复核身份、任务、当前输入与优先级；取消不提交旧名单。 原客户信息完整保留，原编码按实际业务类型命名。线索类使用一个“线索编码”输入，本次新导入以同一值保存leadCode和兼容键externalDocumentId，不批量改写历史记录；售后类／活动类继续对应单据名称及现有独立leadCode，本轮不重定义。原CSV选文件／粘贴与检查确认保持；旧线索类CSV若含两编码列且值相同可兼容，值不一致应提示并保留输入供修正，不静默覆盖或丢弃原信息。

**来源映射**：memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-069, memory/project-facts.json

**验证引用**

1. CHECK-028

2. CHECK-029

3. CHECK-030

4. CHECK-031

5. CHECK-059

6. CHECK-060

7. CHECK-069

**状态**：draft_projection_current_S1_S2_not_upstream_BR_revision

#### BR-015

**标识**：BR-015

**statement**：关联不明、提交超时、状态未知或真正可信证据冲突保留待核，不伪造成功/失败/最终状态；重复及可信SIP晚更新沿同一已保存对象，不算新呼叫、不重新建立失败计划或发起供应商导入。 准确结果保存其实际record、号码及可信callID或稳定事件，leadCode不能替代真实呼叫身份。预外呼另保存原task/batch/root及实际fileId；人工沿真实客户/坐席分配/呼叫关联，不伪造预测字段。接口来源保留原验真app/tenant、requestId/行和与认证应用登记一致的来源，原手工不新增对外协议。去重/审计不因下载或删除丢失；预外呼补提固定触发root。应用接口来源含DCC/天网且关联准确者按US-006回调，无接入应用的手工UI来源仅查看；来源或关联不足待核，不默认DCC。 未可信纯SIP独立保留待核来源证据，不改已确认呼叫结果、不冒充可信非SIP冲突、不阻止随后准确可信call/SIP更新。验收未可信SIP→可信call→可信SIP及可信call→未可信SIP→可信SIP两种顺序：无其他真实可信矛盾时更新同一原call的SIP字段和本地版本，不新增呼叫；真正可信关联或非SIP结果冲突仍待核。 预外呼范围：同一准确失败事件最多形成一份有效自动计划或待人工对象；重复推送、重复确认、SIP晚更新不重建、不重复消耗额度、不重启计时，自动/人工并发沿同一独占执行守卫。120秒取首次保存本次准确失败确认时间，新的真实补提失败才按新确认时间起下一轮，额度延续；事件身份或提交未知保持同尝试占用待核。 预外呼范围：同一次后续执行在AliCti任务原生重呼与本方异常补提交之间保持互斥；不能按未查到话单、缺finishRetryFlag或单一最后标志推定无在途重呼。未核执行权时保持待核，不保证安全重提。 预外呼范围：自动3类计划到期或人工8类明确发起时，在失败额度可用、关联准确、任务可执行及供应商执行权不冲突的条件下，实际发起一次并占用一次。成功/失败均计数，未知保留占用待核，不自动释放再发。暂停挂起、终止停止尚未执行计划，恢复后重新核查；人工不能绕过停止状态或次数，在途/技术传输恢复仍待核。

**来源映射**：memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-073, memory/project-facts.json

**验证引用**

1. CHECK-035

2. CHECK-052

3. CHECK-062

4. CHECK-066

5. CHECK-067

6. CHECK-073

**状态**：draft_projection_current_S1_S2_not_upstream_BR_revision

#### BR-016

**标识**：BR-016

**statement**：预外呼任务创建按既定外部接口或原手工导入选择来源，提交后锁定；服务端校验当前token租户、原任务归属和锁定模式，任务归租户不另绑应用。接口模式接受与该租户有效关联的应用之同schema请求，保存稳定应用及其已登记业务来源，仍按原任务坐席组分配。人工外呼分支按US-011，不借此改预外呼来源或给历史任务混入名单。历史模式/数据保留，身份/归属不足不猜配。 仅预外呼任务沿原正常重呼配置，失败三类自动120秒/八类人工共享首次外2次，秒挂仅结果且全部应用接口来源按原应用配置回调，无补提次数/等待参数。预外呼接口/原手工来源提交后锁定，允许与当前租户有效关联的应用按接口模式导入；原应用及登记来源保留，任务不另绑应用且首次按任务坐席组分配。人工分支按US-011分配，预外呼继续跟进转当前坐席人工按US-012，不据此改原预测规则或宣称供应商已停止自动呼叫。 预外呼范围：人工补提交沿原任务现有操作权限，在授权tenant/task内有权运营和管理员处理八类已保存失败，逐次核当前权和准确对象；包括接口来源已保存失败，不等于向接入系统开放人工重提接口或应用token授予内部运营权限。保留原来源/request审计和触发root，创建内部尝试/必要子批，不迁来源、不伪造新的外部（DCC/天网）请求或给真实账号新权。 保存并继承触发记录已校验保存的原应用登记来源；全部应用接口来源进度含DCC/天网沿US-006交付，无接入应用的手工UI来源仅平台查看，运营操作者或共享root不改变原来源。

**来源映射**：memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-077, memory/project-facts.json

**验证引用**

1. CHECK-036

2. CHECK-072

3. CHECK-077

**状态**：draft_projection_current_S1_S2_not_upstream_BR_revision

#### BR-017

**标识**：BR-017

**statement**：全部通过应用接口接入的业务来源（含DCC、天网），对精确关联的每次结果及真实处理进度均按所属应用的回调配置交付。原应用身份、tenant、与认证应用登记一致的来源与接收时实际关联分别保存，不由外呼方式判断是否回调：接口人工外呼也回调，手工UI导入且没有接入应用才仅平台查看。预外呼保留真实任务/批次/话单及原finishRetryFlag，人工只携实际客户/分配/通话关联；真实客观通话结果与坐席人工记录分开。回调失败只补送同一结果，不重新导入、分配或拨号；各应用分别配置回调地址；积压结果选址仍待核。 全部接入业务系统（含天网）都需回调：本方服务使用应用配置的回调地址，不再只对DCC发送。应用未配置回调地址不得进行接口导入，按AC-086明确拒绝，不先收线索后等地址。仅超管沿应用配置维护地址，任务和导入报文不提供任意临时回调URL。手工UI来源无接入应用仍仅平台查看；各应用分别配置自己的回调地址，正式URL/鉴权/ACK及配置变更积压策略待核。 同一应用回调承接多个租户时，本方候选报文保留准确原tenantId、稳定应用及原业务记录/请求标识以区分归属，不按最近一次申请token的租户改路由；具体字段、签名、版本与ACK待S4。 全部应用接口来源（含DCC、天网）的准确结果和实际平台处理进度按所属应用回调配置交付；接入系统不因此接管平台预测失败补提。预外呼内部尝试继承触发记录原应用/source，不因执行者或后来同root记录改变；人工分配也保留实际客户/分配/通话关联并回调。补送只交同一结果，不重导供应商、不再分配或拨号。未配回调地址不得接口导入；应用地址变更后的接收目标、正式报文/ACK与地址变更积压选址待核。 全部应用接口来源含DCC/天网均对准确秒挂输出明确本方分类并按应用配置回调；无接入应用的手工UI来源保存同样三态供本地查看。保留原供应商结果及真实call、实际request/行/客户/分配关联，预测字段仅用于真实预外呼对象；坐席人工选择的通话状态不替代秒挂证据或供应商结果。来源由认证应用的稳定业务系统登记识别；报文source若保留仅校验一致性，不改变身份或接收目标。字段/版本/ACK及人工话单映射待核；未知不标秒挂，补送不产生供应商提交、新分配或计时。 SRC123补充：每次回调携原导入业务批次号；通话结束且具体处理结果为已完成沟通并可靠保存后，另交付本次通话与本次已保存客户业务信息快照，原结果/进度回调不被替代。

**来源映射**：memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-075, memory/project-facts.json, memory/normalized-user-stories.json#AC-096, memory/normalized-user-stories.json#AC-097

**验证引用**

1. CHECK-018

2. CHECK-037

3. CHECK-071

4. CHECK-075

5. CHECK-096

6. CHECK-097

**状态**：draft_projection_current_S1_S2_not_upstream_BR_revision

#### BR-018

**标识**：BR-018

**statement**：预外呼范围：同步返回result=0不代表逐条全成功：分别展示本地校验/保存、供应商导入、呼叫阶段；保留importTotal/successTotal/invalidTotal原始数量与来源。有准确同步证据的成功正常记录；仅汇总数量不能任意指定成功行，未知/矛盾待核，不将同步响应一概降为仅受理。 预外呼范围：接收53导入失败分片，按enterpriseId经核实租户映射、原taskId、实际fileId及原始号码数据精确回查本次记录、保存root和线索编码；多候选待核，不按最近同号盲配。totalBatchCount/currentBatchCount仅是失败推送分片，不是业务批次；去重、乱序、迟到保留。收齐只证明已声明该失败推送组，不证明全导入终态；未收到不推定零失败。 预外呼范围：导入阶段明确失败保存并展示原始原因及准确tenant/原task/record/batch/root/leadCode/phone与实际fileId关联；无准确关联待核。已鉴权保存应用/source的全部接口来源按US-006回调准确导入失败，无接入应用的手工UI来源仅平台查看；导入失败不计实际呼叫、不触发11类呼叫失败补提交，结果交付失败不重新提交供应商。 合成验收预外呼同步部分成功、53分片乱序/重复/迟到与准确关联、失败快照生命周期；各应用接口来源含DCC/天网及人工外呼均回调，无接入应用的手工UI来源仅查看。缺回调配置则接口导入拒绝且不落客户/分配/批次或供应商提交；回调补送不新导入、分配或呼叫。应用多租户使用明确租户身份，跨租户任务/坐席拒绝；来源声明不能更换应用身份/回调。幂等、登记和历史兼容仍待S4，本轮仅合成。

**来源映射**：memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-043, memory/project-facts.json

**验证引用**

1. CHECK-039

2. CHECK-040

3. CHECK-041

4. CHECK-043

**状态**：draft_projection_current_S1_S2_not_upstream_BR_revision

#### BR-019

**标识**：BR-019

**statement**：预外呼范围：运营人员在云呼叫中心下载导入失败记录；未下载记录不设固定到期、持续保留；仅可信成功下载后删除本次成功导出的失败明细和对应文件，不影响成功客户和必要业务状态；失败、中断或未知保留。异步失败按固定快照清理，后到新失败留待下次，已导出重复不再生成；去重、关联、分片、内部尝试及累计已用/未知占用不随明细删除。 预外呼范围：既有失败导出入口生成本次固定失败明细快照并显示已知分片完整性；未收齐或未知显示不完整/待核。可信成功下载仅删除本快照明细与文件，失败、中断或未知保留，后到新失败进入后续下载；保留必要业务关联、去重、分片、计划/内部尝试、累计已用及未知占用，已导出重复不再生，不能清空整批客户。 准确结果保存其实际record、号码及可信callID或稳定事件，leadCode不能替代真实呼叫身份。预外呼另保存原task/batch/root及实际fileId；人工沿真实客户/坐席分配/呼叫关联，不伪造预测字段。接口来源保留原验真app/tenant、requestId/行和与认证应用登记一致的来源，原手工不新增对外协议。去重/审计不因下载或删除丢失；预外呼补提固定触发root。应用接口来源含DCC/天网且关联准确者按US-006回调，无接入应用的手工UI来源仅查看；来源或关联不足待核，不默认DCC。

**来源映射**：memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-052, memory/project-facts.json

**验证引用**

1. CHECK-008

2. CHECK-042

3. CHECK-052

**状态**：draft_projection_current_S1_S2_not_upstream_BR_revision

#### BR-020

**标识**：BR-020

**statement**：超管独立管理应用列表、详情、新增、修改和删除。应用与租户多对多：一个应用可关联多个有效租户，一个租户可关联DCC、天网等多个应用，各业务系统使用自己的应用凭据与回调地址。认证识别稳定应用，业务身份明确当前租户且须有有效关联，任务归租户不另绑应用。来源由稳定应用登记识别；报文source若保留仅一致性校验，不能换系统/回调。正式登记/认证及token字段为待核设计，原型仅合成。 本期应用列表/查看/新增/修改/删除均仅超管可访问执行，非超管含租户管理员和普通运营不能通过菜单、直接页面或管理调用越权，拒绝不改配置。应用身份发放的租户业务权不能代替管理权限；不自动新增启停、重置、收费或管理权限授予操作。 超管可独立进入应用列表，看到已保存应用的名称和appId及详情、修改、删除入口，并可发起新增；没有应用时显示空列表和新增入口。列表读取不创建、修改或删除应用。无管理权限的身份不能通过菜单、直接页面或模型/服务端调用读取该管理列表。 超管查看具体应用详情，准确显示名称、appId、密钥、已关联业务租户列表与已保存回调配置；查看不修改配置或密钥。不可用合成密钥保留必要提示，不存在/已删除目标不显示其他应用详情。回调覆盖该应用接口导入的全部业务来源；无接入应用的手工UI来源不因同租户有配置而回调。 超管新增应用，填写名称、选择其关联的有效业务租户并配置本应用回调地址；支持多个租户，同租户也可关联其他应用。有效保存形成独立appId/密钥及关联，取消/失败不造成功。DCC/天网等分别使用自身应用及回调，未配置回调地址不得接口导入。应用自身无回调配置时是否允许先保存草稿及地址校验细节待S2/S4，不把保存配置等同于生产接入可用。 超管修改应用名称、已关联租户与本应用回调地址，保存后列表/详情一致，appId/密钥保持。支持多对多，新增/解除关联应核有效对象和权限；已有业务、历史来源和租户归属不随修改静默迁移。取消、冲突、目标不存在或写入失败保持原配置，其他应用不误改。解除关联后的token、在途导入及积压回调处置待S4/工程验证。 超管可针对具体应用独立发起删除并确认，取消不删除；保存成功后该应用从列表消失且不能再查看/修改或以其旧凭证获取新身份，合成模型使该应用已发身份失效。只作用选定应用，其他应用配置和身份不受影响；保存失败不先撤销身份或显示删除成功。已有业务任务、导入记录和结果/必要来源审计保留，不随删除应用级联删除。 应用页面简洁表达名称、关联租户、接入密钥与本应用回调地址，去掉日常运营不必要的技术解释及身份交换演示；多租户关联清晰可读，普通修改不重置密钥。来源采用稳定应用登记，具体配置字段待S3/S4，不增不必要管理菜单。管理权与租户业务权分开，原型合成凭据保留必要提示。 应用新增/修改提供本应用回调地址并持久保存，重开/详情显示相同值；普通保存不重置appId/密钥，取消/失败保持原配置。DCC、天网等各应用分别配置地址，全部接口来源必须先配置才能导入；无接入应用的手工UI来源不发送。URL格式/安全校验、变更后积压结果取值时点与正式ACK仍待核，不编造地址或试发真实请求。 创建/修改允许应用与租户多对多，核每个关联租户真实有效且关系不重复；同一租户已关联其他应用不是冲突。DCC/天网分别保留自己的appId/凭据/回调配置。历史已有多关联及业务记录保留，不按已取代的一对一方案静默删除、合并或迁移；解除关联后的token/在途请求和历史接收目标处置待S4/工程验证，不默认首个租户。

**来源映射**：memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-044, memory/normalized-user-stories.json#AC-053, memory/normalized-user-stories.json#AC-054, memory/normalized-user-stories.json#AC-055, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-084, memory/normalized-user-stories.json#AC-085, memory/project-facts.json

**验证引用**

1. CHECK-017

2. CHECK-044

3. CHECK-053

4. CHECK-054

5. CHECK-055

6. CHECK-056

7. CHECK-057

8. CHECK-058

9. CHECK-084

10. CHECK-085

**状态**：draft_projection_current_S1_S2_not_upstream_BR_revision

#### BR-021

**标识**：BR-021

**statement**：外部调用方（DCC／天网）每条业务导入priority沿原规则必填，未传仅该条失败，不补默认值；本次值独立于R，且不强制继承旧批次。预外呼按保存priority排序并提交原供应商任务；人工外呼保存该字段但不因此进入预测任务队列、不透传预测号码导入或自动拨号。人工列表排序是否使用priority未新增规则。 平台取消每日定时查询当天/历史待跟进号码状态及自然日priority衰减，不因未拨、已拨未接通、跨日或原导入日期计算改写存量priority；仅服务衰减的状态查询退出。既有每次可信事件、话单/SIP及无话单失败记录和平台查看继续保留。 预外呼范围：同一任务的待提交号码按优先级高先提交，同优先级按本地导入时间FIFO；不同任务独立。已提交不撤回重排，提交结果未知不为重排重复提交；一手机号一批次及priority透传保持，不承诺实际拨打顺序。 预外呼范围：本方自动或人工失败补提交保留原任务、触发记录保存priority和来源时间，按同任务待提交priority高先/同级本次排队FIFO；不因人工、导航降级或后来新主重取priority，不日衰减，已受理不撤回重排，未知不为排序重发。

**来源映射**：memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-074, memory/project-facts.json

**验证引用**

1. CHECK-009

2. CHECK-015

3. CHECK-046

4. CHECK-074

**状态**：draft_projection_current_S1_S2_not_upstream_BR_revision

#### BR-022

**标识**：BR-022

**statement**：预外呼范围：其余8类失败仅提供人工重提交，不生成自动2分钟计划。用户明确选择当前失败记录并确认，操作仅补提交该记录，不新增或编辑一份客户名单，不静默更换真实phone。 预外呼范围：人工补提交沿原任务现有操作权限，在授权tenant/task内有权运营和管理员处理八类已保存失败，逐次核当前权和准确对象；包括接口来源已保存失败，不等于向接入系统开放人工重提接口或应用token授予内部运营权限。保留原来源/request审计和触发root，创建内部尝试/必要子批，不迁来源、不伪造新的外部（DCC/天网）请求或给真实账号新权。 保存并继承触发记录已校验保存的原应用登记来源；全部应用接口来源进度含DCC/天网沿US-006交付，无接入应用的手工UI来源仅平台查看，运营操作者或共享root不改变原来源。 预外呼范围：人工与自动失败按同租户+原任务+线索编码+固定手机号共享首次外2次，另开主批也不重置。额度用尽、已有占用/未知、任务暂停/终止或当前任务权限不足时按钮不可执行并说明原因。双击/并发/重复反馈不产生额外一次，原因/方式/操作人变化不重置；服务端同步校验，不能仅前端禁用。

**来源映射**：memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/project-facts.json

**验证引用**

1. CHECK-076

2. CHECK-077

3. CHECK-078

**状态**：draft_projection_current_S1_S2_not_upstream_BR_revision

#### DGR-MANUAL-ASSIGN

**标识**：DGR-MANUAL-ASSIGN

**statement**：人工外呼行指定坐席工号，本方建议按租户及已有供应商实例关系查找唯一有效坐席，再解析关联账号/坐席身份；工号按原始字符串保存并保留前导零，不按显示姓名或跨租户同工号猜配。沿现有分配规则核账号及租户成员启用、有效坐席关联、坐席已启用/同步成功并接受新任务。工号缺失、无效、冲突或无可用关联时该行明确失败/待核且不自动改派，其他有效行继续；不要求坐席在线才保存分配，真实拨号前另核登录与当前可用状态。 人工外呼有效行保存独立客户/导入记录、原应用/租户、source、requestId/行、线索/号码及最终priority后，按已核实坐席分配到既有待联系区域；本方建议无需预测taskId，不生成虚构供应商fileId/预测主子root，也不调用importTaskTel或自动拨号。priority沿原必填保存但不进入预测队列。坐席本人从待联系点击联系客户后才按既有人工工作台拨号；预测三天五呼、3类120秒/8类共享2次和预测任务精准删除不自动套用人工分配。 同一人工导入在建议tenant+stableApp+operation+requestId作用域技术重传，返原保存与分配结果，不重复客户/派发/拨号；同ID改方式、工号或业务内容报冲突，不能重传换坐席或改source另获次数。不同应用/租户各自隔离。原子保存分配及未知恢复待工程核验，未完成/未知保留原处理如实反馈；分配前复核目标，失败不误写他人客户。保存原app/tenant及已登记来源供本应用回调；人工方式不等于手工UI来源。

**来源映射**：memory/normalized-user-stories.json#AC-081, memory/normalized-user-stories.json#AC-082, memory/normalized-user-stories.json#AC-083, memory/project-facts.json

**验证引用**

1. CHECK-081

2. CHECK-082

3. CHECK-083

**状态**：design_proposal_not_formal_BR

#### DGR-FOLLOWUP

**标识**：DGR-FOLLOWUP

**statement**：人工外呼客户振铃及预外呼坐席振铃时支持填写客户跟进表单。本方建议从准确通话对象建立后允许草稿编辑并持续暂存，接听/挂断和客户/坐席状态仍可见且可用，接通或结束时保留已填内容，不清空重开；正式保存等通话结束后执行，不在振铃阶段标记处理完成或释放通话占用。人工客户振铃与预外呼坐席振铃分开：后者可能客户已接通，坐席未接不改成客户未接。具体dialing/offered/answering覆盖与草稿恢复为待审设计，不扩呼入。 明确本次外呼客户未接通且通话已结束时，客服坐席须在原跟进表单选择“通话状态”才能保存；沿用AliCti API-327号码状态识别编码的完整20项描述（16个编码），包含712拒接。715和183同码多描述须同时保存所选编码与描述，不合并丢义；坐席明确选择183“未知”是有效选择，空白未选仍不得保存，不能因客观结果未知自动选为183。人工状态、录入人/时间与处理结果独立保存，不覆盖供应商原结果、客户/坐席客观接通证据、时长、接通统计或秒挂判据。客户接通情况未知或已接通时不猜为未接，预外呼客户已接而坐席未接不套该客户未接必选规则；呼入范围不扩展。已填草稿在未接结束后保留到可保存界面，不自动关窗丢失。正式存储字段与接口契约待S3/S4核验。 只有处理结果选择继续跟进且保存成功，线索才沿本规则保留待联系。人工客户保留原分配坐席；预外呼接入当前坐席后的继续跟进转该坐席后续人工处理，保留原客户/线索及历次跟进，不另造线索或自动拨号。本方建议兼容历史“需要再次联系”值，并保留原预测task/record/call/app/tenant溯源。人工后续与原任务自动呼叫不得并发；需核供应商停止/排他能力，未取得证据不宣称已停止或已可安全再次拨号。未接通不自动等于继续跟进。 保存跟进前复核当前坐席/租户/通话/客户归属及记录版本；未选必填处理结果或规定通话状态、业务字段校验失败、权限/对象变化或写入失败时，保留本次草稿和原名单状态，不假报成功、不提前移出待联系或误改他人线索。重复保存不新增重复跟进或重复待联系客户；保存与名单更新的原子/可恢复实现待工程核验。后到真实话单只更新客观证据，不覆写已保存人工通话状态或继续跟进决定。 未接通保存的通话状态条件按AC-088：明确外呼客户未接且已结束才必选，沿完整号码状态字典保存人工选择的编码与描述；空白未选与明确选择183“未知”区分。其余本方校验提案仍为校验处理结果及当时可获得的基础信息，不强迫填写必须经客户沟通才能获得的业务必填字段，也不虚构沟通内容。各业务表单的其他必填/可选清单及条件校验继续待S3/S6；校验/保存失败保草稿和原名单。未接通不默认继续跟进，只有选该处理结果才适用AC-089。

**来源映射**：memory/normalized-user-stories.json#AC-087, memory/normalized-user-stories.json#AC-088, memory/normalized-user-stories.json#AC-089, memory/normalized-user-stories.json#AC-090, memory/normalized-user-stories.json#AC-091, memory/project-facts.json, inputs/source-index.json#SRC-122

**验证引用**

1. CHECK-087

2. CHECK-088

3. CHECK-089

4. CHECK-090

5. CHECK-091

**状态**：current_draft_projection_SRC123_S1_S2_checked_not_formal_BR

#### DGR-BUSINESS-BATCH

**标识**：DGR-BUSINESS-BATCH

**statement**：业务批次号为业务系统提供的可复用追踪值，按原app/tenant隔离保存回传；requestId仍独立防技术重传，不替代平台主子/供应商fileId、不重置失败预算。

**来源映射**：memory/normalized-user-stories.json#AC-093, memory/normalized-user-stories.json#AC-094, inputs/source-index.json#SRC-123

**验证引用**

1. CHECK-093

2. CHECK-094

**状态**：draft_SRC123_business_fact_and_engineering_proposal_not_formal_BR

#### DGR-COMPLETION-CALLBACK

**标识**：DGR-COMPLETION-CALLBACK

**statement**：仅通话结束、处理结果恰为已完成沟通且可靠保存成功后，回调本call和本次业务表单快照及原业务批次；普通processingStatus已完成不触发。按原app路由，重试仅补送，每次结果/进度回调继续保留。 本次已填写选填业务字段必须回传配置的字段业务编码；有选项字段同时回传选中选项业务编码及对应值，多选包含全部选中编码。编码与值来自本次保存时原租户业务配置快照，后续改配置不改变原补送内容；不能仅发中文label或内部id。未填写字段不伪造取值；已填写字段或选项缺业务码标回调资料待完善/待核，不冒充完整发送成功，也不擅自阻断本地保存或丢失草稿。

**来源映射**：memory/normalized-user-stories.json#AC-095, memory/normalized-user-stories.json#AC-096, memory/normalized-user-stories.json#AC-097, inputs/source-index.json#SRC-123, memory/normalized-user-stories.json#AC-098

**验证引用**

1. CHECK-095

2. CHECK-096

3. CHECK-097

4. CHECK-098

**状态**：draft_SRC123_business_fact_and_engineering_proposal_not_formal_BR

#### DGR-IMPORTED-INTENT

**标识**：DGR-IMPORTED-INTENT

**statement**：本次六个导入资料字段均选填文本，保原编码前导零/大小写；从准确原记录传到本call并只读展示，完成沟通快照携原值。未填不猜，不替代计划到店字段，真实wire与回调仍待评审。 留资时间原值独立，不用平台时间填补。

**来源映射**：memory/normalized-user-stories.json#AC-099, memory/normalized-user-stories.json#AC-100, memory/normalized-user-stories.json#AC-101, inputs/source-index.json#SRC-124

**验证引用**

1. CHECK-099

2. CHECK-100

3. CHECK-101

**状态**：draft_SRC124_business_fact_and_working_assumption

#### DGR-IMPORT-BUSINESS-TYPE

**标识**：DGR-IMPORT-BUSINESS-TYPE

**statement**：请求级必填businessType，使用已验真的token租户当前启用的稳定业务类型编码；一次请求仅一种业务类型，适用预外呼及人工外呼。缺失、无效或已停用的新业务请求整次拒收，不保存客户、分配、占用补提交额度或提交供应商。不同类型分次导入，可复用同businessBatchNo；不以来源source或callMode代替类型。 在当前身份/授权复核后，先按原幂等作用域核完整请求内容；businessType纳入内容比较但不新增幂等命名空间。同requestId改类型是内容冲突；已受理同内容技术重放只读返回原回执、不再新增，即使该类型后来停用也不改写已受理记录。不因改类型改变原leadCode/手机号归组、主子批或共享失败累计键。 每条成功接收记录固化本次原businessType稳定码及当时显示名称，准确关联原app/tenant/request/row/record与本call；历史缺失不批量补值，不按最近同号、来源或外呼方式猜类型。后续名称/启停配置变化不改原类型码或来源快照。 每次结果/进度及已完成沟通回调均携准确原app/tenant/record/call导入时保存的businessType稳定码和既有businessBatchNo；补送沿原事件快照。类型后续改名或停用不重算原码，历史未知不猜值，不只回传类型名称，也不替代已填字段/选项业务编码。正式回调报文与ACK仍待契约及工程验证。

**来源映射**：inputs/source-index.json#SRC-125, memory/normalized-user-stories.json#AC-102, memory/normalized-user-stories.json#AC-103, memory/normalized-user-stories.json#AC-104

**验证引用**

1. CHECK-102

2. CHECK-103

3. CHECK-104

**状态**：draft_SRC125_confirmed_business_rule_not_formal_contract

**flows**

#### DFLOW-01 应用与租户业务接入

**标识**：DFLOW-01

**名称**：应用与租户业务接入

**branch_note**：为相关操作的职责链，非要求每次依次调用全部操作。应用CRUD各自独立；外部/手工互斥；三自动/八人工分流；秒挂不进补提。

**步骤**

#### DFLOW-01-S1

**标识**：DFLOW-01-S1

**actor**：超管

**action**：查询应用列表

**local_id**：DLOCAL-018

**on_failure**：按对应局部拒绝/挂起/停止/待核分支，不绕过授权/UNKNOWN守卫。

#### DFLOW-01-S2

**标识**：DFLOW-01-S2

**actor**：超管

**action**：创建应用

**local_id**：DLOCAL-019

**on_failure**：按对应局部拒绝/挂起/停止/待核分支，不绕过授权/UNKNOWN守卫。

#### DFLOW-01-S3

**标识**：DFLOW-01-S3

**actor**：超管

**action**：查看应用详情

**local_id**：DLOCAL-020

**on_failure**：按对应局部拒绝/挂起/停止/待核分支，不绕过授权/UNKNOWN守卫。

#### DFLOW-01-S4

**标识**：DFLOW-01-S4

**actor**：超管

**action**：修改应用

**local_id**：DLOCAL-001

**on_failure**：按对应局部拒绝/挂起/停止/待核分支，不绕过授权/UNKNOWN守卫。

#### DFLOW-01-S5

**标识**：DFLOW-01-S5

**actor**：超管

**action**：删除应用

**local_id**：DLOCAL-021

**on_failure**：按对应局部拒绝/挂起/停止/待核分支，不绕过授权/UNKNOWN守卫。

#### DFLOW-01-S6

**标识**：DFLOW-01-S6

**actor**：DCC/天网

**action**：交换明确租户身份

**local_id**：DLOCAL-002

**on_failure**：按对应局部拒绝/挂起/停止/待核分支，不绕过授权/UNKNOWN守卫。

**来源映射**：memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-044, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-053, memory/normalized-user-stories.json#AC-054, memory/normalized-user-stories.json#AC-055, memory/normalized-user-stories.json#AC-056, memory/normalized-user-stories.json#AC-057, memory/normalized-user-stories.json#AC-058, memory/normalized-user-stories.json#AC-084, memory/normalized-user-stories.json#AC-085, memory/normalized-user-stories.json#AC-092, memory/project-facts.json

**验证引用**

1. CHECK-017

2. CHECK-044

3. CHECK-045

4. CHECK-053

5. CHECK-054

6. CHECK-055

7. CHECK-056

8. CHECK-057

9. CHECK-058

10. CHECK-084

11. CHECK-085

12. CHECK-092

#### DFLOW-02 预外呼任务来源与接口双方式接收

**标识**：DFLOW-02

**名称**：预外呼任务来源与接口双方式接收

**branch_note**：接口和原手工UI是不同入口；接口按方式分支：预外呼走供应商导入，人工走指定坐席分配。来源不等于方式。

**步骤**

#### DFLOW-02-S1

**标识**：DFLOW-02-S1

**actor**：运营/管理员

**action**：创建预外呼任务并锁定初始来源

**local_id**：DLOCAL-016

**on_failure**：按对应局部拒绝/挂起/停止/待核分支，不绕过授权/UNKNOWN守卫。

#### DFLOW-02-S2

**标识**：DFLOW-02-S2

**actor**：DCC/天网

**action**：按应用租户与外呼方式接收接口线索

**local_id**：DLOCAL-004-EXTERNAL

**on_failure**：按对应局部拒绝/挂起/停止/待核分支，不绕过授权/UNKNOWN守卫。

#### DFLOW-02-S3

**标识**：DFLOW-02-S3

**actor**：运营/管理员

**action**：原弹窗手工接收

**local_id**：DLOCAL-004-MANUAL

**on_failure**：按对应局部拒绝/挂起/停止/待核分支，不绕过授权/UNKNOWN守卫。

#### DFLOW-02-S4

**标识**：DFLOW-02-S4

**actor**：云呼叫中心

**action**：预外呼自动提交导入批次

**local_id**：DLOCAL-005

**on_failure**：按对应局部拒绝/挂起/停止/待核分支，不绕过授权/UNKNOWN守卫。

#### DFLOW-02-S5

**标识**：DFLOW-02-S5

**actor**：AliCti

**action**：接收并关联预测异步导入失败

**local_id**：DLOCAL-017

**on_failure**：按对应局部拒绝/挂起/停止/待核分支，不绕过授权/UNKNOWN守卫。

#### DFLOW-02-S6

**标识**：DFLOW-02-S6

**actor**：云呼叫中心

**action**：按原应用向业务系统回调结果

**local_id**：DLOCAL-010

**on_failure**：按对应局部拒绝/挂起/停止/待核分支，不绕过授权/UNKNOWN守卫。

**来源映射**：memory/normalized-user-stories.json#AC-001, memory/normalized-user-stories.json#AC-005, memory/normalized-user-stories.json#AC-006, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-010, memory/normalized-user-stories.json#AC-011, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-015, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-026, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-030, memory/normalized-user-stories.json#AC-031, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-036, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-040, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-043, memory/normalized-user-stories.json#AC-046, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-060, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-069, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-072, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-080, memory/normalized-user-stories.json#AC-086, memory/normalized-user-stories.json#AC-092, memory/project-facts.json

**验证引用**

1. CHECK-001

2. CHECK-005

3. CHECK-006

4. CHECK-007

5. CHECK-009

6. CHECK-010

7. CHECK-011

8. CHECK-012

9. CHECK-013

10. CHECK-014

11. CHECK-015

12. CHECK-018

13. CHECK-026

14. CHECK-027

15. CHECK-028

16. CHECK-029

17. CHECK-030

18. CHECK-031

19. CHECK-032

20. CHECK-035

21. CHECK-036

22. CHECK-037

23. CHECK-039

24. CHECK-040

25. CHECK-041

26. CHECK-042

27. CHECK-043

28. CHECK-046

29. CHECK-047

30. CHECK-048

31. CHECK-049

32. CHECK-050

33. CHECK-051

34. CHECK-052

35. CHECK-059

36. CHECK-060

37. CHECK-064

38. CHECK-069

39. CHECK-071

40. CHECK-072

41. CHECK-075

42. CHECK-077

43. CHECK-080

44. CHECK-086

45. CHECK-092

#### DFLOW-03 每次呼叫结果与失败闭环

**标识**：DFLOW-03

**名称**：每次呼叫结果与失败闭环

**branch_note**：为相关操作的职责链，非要求每次依次调用全部操作。应用CRUD各自独立；外部/手工互斥；三自动/八人工分流；秒挂不进补提。

**步骤**

#### DFLOW-03-S1

**标识**：DFLOW-03-S1

**actor**：AliCti

**action**：接收关联并归一客观呼叫结果

**local_id**：DLOCAL-013

**on_failure**：按对应局部拒绝/挂起/停止/待核分支，不绕过授权/UNKNOWN守卫。

#### DFLOW-03-S2

**标识**：DFLOW-03-S2

**actor**：云呼叫中心

**action**：接收并分类预测呼叫失败

**local_id**：DLOCAL-012

**on_failure**：按对应局部拒绝/挂起/停止/待核分支，不绕过授权/UNKNOWN守卫。

#### DFLOW-03-S3

**标识**：DFLOW-03-S3

**actor**：云呼叫中心

**action**：识别客户秒挂结果

**local_id**：DLOCAL-011

**on_failure**：按对应局部拒绝/挂起/停止/待核分支，不绕过授权/UNKNOWN守卫。

#### DFLOW-03-S4

**标识**：DFLOW-03-S4

**actor**：云呼叫中心

**action**：自动补提交三类失败客户

**local_id**：DLOCAL-014

**on_failure**：按对应局部拒绝/挂起/停止/待核分支，不绕过授权/UNKNOWN守卫。

#### DFLOW-03-S5

**标识**：DFLOW-03-S5

**actor**：运营/管理员

**action**：人工补提交八类失败客户

**local_id**：DLOCAL-022

**on_failure**：按对应局部拒绝/挂起/停止/待核分支，不绕过授权/UNKNOWN守卫。

#### DFLOW-03-S6

**标识**：DFLOW-03-S6

**actor**：云呼叫中心

**action**：按原应用向业务系统回调结果

**local_id**：DLOCAL-010

**on_failure**：按对应局部拒绝/挂起/停止/待核分支，不绕过授权/UNKNOWN守卫。

#### DFLOW-03-S7

**标识**：DFLOW-03-S7

**actor**：运营/管理员

**action**：查询任务业务记录

**local_id**：DLOCAL-015

**on_failure**：按对应局部拒绝/挂起/停止/待核分支，不绕过授权/UNKNOWN守卫。

**来源映射**：memory/normalized-user-stories.json#AC-002, memory/normalized-user-stories.json#AC-003, memory/normalized-user-stories.json#AC-004, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-019, memory/normalized-user-stories.json#AC-020, memory/normalized-user-stories.json#AC-021, memory/normalized-user-stories.json#AC-022, memory/normalized-user-stories.json#AC-023, memory/normalized-user-stories.json#AC-027, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-033, memory/normalized-user-stories.json#AC-034, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-062, memory/normalized-user-stories.json#AC-063, memory/normalized-user-stories.json#AC-064, memory/normalized-user-stories.json#AC-065, memory/normalized-user-stories.json#AC-066, memory/normalized-user-stories.json#AC-067, memory/normalized-user-stories.json#AC-068, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-073, memory/normalized-user-stories.json#AC-074, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-076, memory/normalized-user-stories.json#AC-077, memory/normalized-user-stories.json#AC-078, memory/normalized-user-stories.json#AC-079, memory/project-facts.json

**验证引用**

1. CHECK-002

2. CHECK-003

3. CHECK-004

4. CHECK-014

5. CHECK-018

6. CHECK-019

7. CHECK-020

8. CHECK-021

9. CHECK-022

10. CHECK-023

11. CHECK-027

12. CHECK-028

13. CHECK-029

14. CHECK-032

15. CHECK-033

16. CHECK-034

17. CHECK-035

18. CHECK-037

19. CHECK-038

20. CHECK-039

21. CHECK-041

22. CHECK-042

23. CHECK-052

24. CHECK-059

25. CHECK-062

26. CHECK-063

27. CHECK-064

28. CHECK-065

29. CHECK-066

30. CHECK-067

31. CHECK-068

32. CHECK-070

33. CHECK-071

34. CHECK-073

35. CHECK-074

36. CHECK-075

37. CHECK-076

38. CHECK-077

39. CHECK-078

40. CHECK-079

#### DFLOW-04 运营查看下载与精准删除

**标识**：DFLOW-04

**名称**：运营查看下载与精准删除

**branch_note**：为相关操作的职责链，非要求每次依次调用全部操作。应用CRUD各自独立；外部/手工互斥；三自动/八人工分流；秒挂不进补提。

**步骤**

#### DFLOW-04-S1

**标识**：DFLOW-04-S1

**actor**：运营/管理员

**action**：查询任务业务记录

**local_id**：DLOCAL-015

**on_failure**：按对应局部拒绝/挂起/停止/待核分支，不绕过授权/UNKNOWN守卫。

#### DFLOW-04-S2

**标识**：DFLOW-04-S2

**actor**：运营/管理员

**action**：下载导入失败记录

**local_id**：DLOCAL-006

**on_failure**：按对应局部拒绝/挂起/停止/待核分支，不绕过授权/UNKNOWN守卫。

#### DFLOW-04-S3

**标识**：DFLOW-04-S3

**actor**：运营/管理员

**action**：删除指定供应商号码

**local_id**：DLOCAL-009

**on_failure**：按对应局部拒绝/挂起/停止/待核分支，不绕过授权/UNKNOWN守卫。

**来源映射**：memory/normalized-user-stories.json#AC-008, memory/normalized-user-stories.json#AC-013, memory/normalized-user-stories.json#AC-014, memory/normalized-user-stories.json#AC-016, memory/normalized-user-stories.json#AC-024, memory/normalized-user-stories.json#AC-025, memory/normalized-user-stories.json#AC-028, memory/normalized-user-stories.json#AC-029, memory/normalized-user-stories.json#AC-035, memory/normalized-user-stories.json#AC-038, memory/normalized-user-stories.json#AC-039, memory/normalized-user-stories.json#AC-041, memory/normalized-user-stories.json#AC-042, memory/normalized-user-stories.json#AC-052, memory/normalized-user-stories.json#AC-059, memory/normalized-user-stories.json#AC-061, memory/normalized-user-stories.json#AC-070, memory/normalized-user-stories.json#AC-078, memory/project-facts.json

**验证引用**

1. CHECK-008

2. CHECK-013

3. CHECK-014

4. CHECK-016

5. CHECK-024

6. CHECK-025

7. CHECK-028

8. CHECK-029

9. CHECK-035

10. CHECK-038

11. CHECK-039

12. CHECK-041

13. CHECK-042

14. CHECK-052

15. CHECK-059

16. CHECK-061

17. CHECK-070

18. CHECK-078

#### DFLOW-05 人工分配与坐席跟进

**标识**：DFLOW-05

**名称**：人工分配与坐席跟进

**步骤**

#### DFLOW-05-S1

**标识**：DFLOW-05-S1

**actor**：云呼叫中心

**action**：人工有效行分配指定坐席待联系

**local_id**：DLOCAL-MANUAL-ASSIGN

**on_failure**：行失败或未知保原处理，不改派/重派。

#### DFLOW-05-S2

**标识**：DFLOW-05-S2

**actor**：坐席

**action**：振铃写草稿，结束保存，继续跟进保待联系

**local_id**：DLOCAL-FOLLOWUP

**on_failure**：保草稿/原名单；预测转人工排他未知不能宣称安全再次拨号。

#### DFLOW-05-S3

**标识**：DFLOW-05-S3

**actor**：云呼叫中心

**action**：实际结果按原应用回调；无应用手工UI仅查看

**local_id**：DLOCAL-010

**on_failure**：同结果补送，不再导入/派发/呼叫。

**来源映射**：memory/normalized-user-stories.json#AC-018, memory/normalized-user-stories.json#AC-032, memory/normalized-user-stories.json#AC-037, memory/normalized-user-stories.json#AC-071, memory/normalized-user-stories.json#AC-075, memory/normalized-user-stories.json#AC-081, memory/normalized-user-stories.json#AC-082, memory/normalized-user-stories.json#AC-083, memory/normalized-user-stories.json#AC-087, memory/normalized-user-stories.json#AC-088, memory/normalized-user-stories.json#AC-089, memory/normalized-user-stories.json#AC-090, memory/normalized-user-stories.json#AC-091, memory/project-facts.json

**验证引用**

1. CHECK-018

2. CHECK-032

3. CHECK-037

4. CHECK-071

5. CHECK-075

6. CHECK-081

7. CHECK-082

8. CHECK-083

9. CHECK-087

10. CHECK-088

11. CHECK-089

12. CHECK-090

13. CHECK-091

**branch_note**：预外呼接入当前坐席同样进入跟进动作；不要求先执行人工分配。

#### DFLOW-07 完成沟通保存后回调业务系统

**标识**：DFLOW-07

**名称**：完成沟通保存后回调业务系统

**branch_note**：由本次跟进保存成功事件触发；不是普通结果回调的替代，不自动重呼。

**步骤**

#### DFLOW-07-S1

**标识**：DFLOW-07-S1

**actor**：坐席

**action**：通话结束且选择已完成沟通，可靠保存本次表单

**local_id**：DLOCAL-FOLLOWUP

**on_failure**：保存失败保草稿，不发完成事件。

#### DFLOW-07-S2

**标识**：DFLOW-07-S2

**actor**：云呼叫中心

**action**：固化本call/保存版本快照并向原应用业务系统交付

**local_id**：DLOCAL-COMPLETION-CALLBACK

**on_failure**：保留交付状态待补送/核验，不重做保存、导入或拨号。

**来源映射**：memory/normalized-user-stories.json#AC-095, memory/normalized-user-stories.json#AC-096, memory/normalized-user-stories.json#AC-097, inputs/source-index.json#SRC-123, memory/normalized-user-stories.json#AC-098

**验证引用**

1. CHECK-095

2. CHECK-096

3. CHECK-097

4. CHECK-098

**shared_state_rules**

1. 当前身份提案绑定稳定app和明确tenant；多对多允许，缺失/无关联/跨租户任务或工号拒绝，不选首个/最近租户。

2. 全部应用接口来源先有回调配置再导入；按原app配置及原tenant交付，不因callMode或来源文字改路由。无接入应用的手工UI来源仅平台查看。

3. 请求幂等提案tenant+stableApp+operation+requestId；source不能换作用域，callMode/工号/有效内容变化冲突；重传不新保存/分配/供应商提交。

4. 预测主子仅两层，真实fileId/attempt/call各自保存；人工不生成预测task/batch/root/fileId，不自动继承预测失败策略。

5. 预测失败同四元组跨主批/应用共享首次外2次；三类首次确认+120秒，八类人工，无秒挂重导；UNKNOWN保同尝试占用不盲发。

6. 人工dialing/ringing及预测offered/answering可编辑草稿但不完成通话；正式保存等结束。明确外呼客户未接才按AC-088必选人工编码+描述，183未知明确选择不同于空白，客观未知不代选；客户已接而坐席未接不套此规则，呼入不扩。迟到话单不覆盖人工选择。

7. 继续跟进成功保存才保待联系；预测转当前坐席人工不造新线索，排他能力未知保待确认，不能宣称原任务已停。

8. 配置/导入/分配/跟进保存失败保原状态；并发原子及恢复仍待工程，下载清理/精准删除/回调补送不重置业务额度或重执业务。

9. 业务批次号与requestId、平台batchId/rootBatchId、供应商fileId是四类不同身份：复用业务批次仍需新requestId发起新业务，所有回调保留原记录业务批次。

10. 已完成沟通是具体处理结果，通用已保存状态不能代替；完成快照与本次可靠保存关联，不取跨通话客户aggregate，后台补送不重做业务。

11. 本次已填写选填业务字段必须回传配置的字段业务编码；有选项字段同时回传选中选项业务编码及对应值，多选包含全部选中编码。编码与值来自本次保存时原租户业务配置快照，后续改配置不改变原补送内容；不能仅发中文label或内部id。未填写字段不伪造取值；已填写字段或选项缺业务码标回调资料待完善/待核，不冒充完整发送成功，也不擅自阻断本地保存或丢失草稿。

**data_ownership**

1. 超管管理应用关联租户及本应用回调；稳定来源由应用登记识别，用户报文不能改身份或临时指定URL。

2. 平台绑定接收时原app/tenant/request/行及方式；人工保存原工号和解析身份，预测保存真实task/批次/供应商映射。

3. AliCti产生客观呼叫证据；坐席人工选择另存，不能变更接通统计、时长或秒挂证据。

4. 坐席拥有自己当前通话草稿与跟进保存权限；名单归属经服务端校验，预测继续跟进保原始溯源。

5. 每个应用所属业务系统提供接收地址和正式ACK，平台记录独立交付状态；积压换址与关联撤销仍待定。

6. 业务系统提供businessBatchNo，平台按原记录保存并回传；AliCti客观通话事实和坐席本次保存表单各保来源，完成事件将两者的当次快照交原app。

7. 六个客户导入字段归本次原app/tenant/record来源，在本call上展示/快照，不从客户最新其他通话补；同意向名称不能猜业务编码。

**cross_module_contracts**



**cross_module_note**：本轮只有产品讨论稿；工程模块、物理接口和一致性协议待后端资料后补，不能当可直接实施包。

**open_questions**

#### DQ-01

**标识**：DQ-01

**topic**：供应商部署与执行权

**detail**：预测任务版本/模式、同号排重/isRepeat、独立fileId、运行接收矩阵、导航三类覆盖/生效和原生重呼互斥需实际证据；120秒不证明换线。

**timing**：关键规则先核，真实接入前闭合

#### DQ-02

**标识**：DQ-02

**topic**：三天五呼及事件证据

**detail**：窗口/含初呼/跨子批、稳定事件身份/验真/53推送组、客户真实时长单位和挂断枚举尚需供应商目标证据。

**timing**：正式判定/生产调度前

#### DQ-03

**标识**：DQ-03

**topic**：多租户应用身份与全部业务系统回调契约

**detail**：token绑定明确tenant/app为提案；有效关联撤销、旧token/在途、来源登记、命名空间兼容、每应用URL/签名/版本/ACK及积压换址待核。缺回调禁止新接口导入已确认，不再是待选择问题。 SRC123已确认可复用业务批次并按原记录回传；拟名businessBatchNo的字段层级/长度/空白大小写和历史兼容、完成事件payload/ACK/版本、晚到话单补全仍需双方核定。 字段与选项业务码必须回传已确认；缺码历史数据、未填字段的省略/null表示、保存时配置版本与后续补全协议仍需细化。

**timing**：接口定稿联调前

#### DQ-04

**标识**：DQ-04

**topic**：本方工程实现

**detail**：需后端仓库/栈；先评审原子接收/主批稳定序、事件/action幂等、预算预占发起边界、崩溃恢复、权限/删除互斥，按已批准顺序开发后补实现证据。 新增本次跟进可靠保存与完成事件快照的一致性、相同call/保存版本去重、不可变补送与崩溃恢复设计，不能把本地浏览器保存当服务端原子证明。

**timing**：先设计评审，开发后验收实现

#### DQ-05

**标识**：DQ-05

**topic**：下载完成与清理

**detail**：已接受保存位置方式且本地合成写入关闭回读可行；正式浏览器兼容、页面报告授权/快照版本、后端清理与恢复仍待工程。普通下载保留。

**timing**：先产品及可行性，开发后实现验收

#### DQ-06

**标识**：DQ-06

**topic**：精准删除

**detail**：实际fileId独占、tels优先、skipCalling/skipRetry值和目标跳过/在途需部署证据；共享file多attempt不扩大目标。

**timing**：真实删除前

#### DQ-07

**标识**：DQ-07

**topic**：历史数据及原字段

**detail**：原四元组/root/来源不足待核不猜配；同号多lead未决不放开。其他手工类型沿既有规则，未确认字段限制不从演示冻结。

**timing**：工程设计与历史兼容评审

#### DQ-08

**标识**：DQ-08

**topic**：人工外呼接口分配

**detail**：callMode及逐行agentWorkNo字段名/层级、有效工号映射、原子保存分配、未知恢复、人工呼叫关联及实际接收回执待S4/工程。

**timing**：接口定稿及人工外呼真实接入前

#### DQ-09

**标识**：DQ-09

**topic**：工作台跟进条件与预测转人工

**detail**：SRC-122已收敛人工通话状态为API-327完整20项/16码，明确外呼客户未接且已结束才必选，编码与描述独立保存；局部原型有条件校验/恢复证据。各业务其他条件必填、正式草稿保存/名单原子与恢复仍待细化；预测转当前坐席已确认，但原任务停止/排他须供应商工程证据，不因局部通过关闭。

**timing**：S3/S6产品细化；真实后续人工拨打前闭合排他

#### DQ-10

**标识**：DQ-10

**topic**：应用不完整配置保存

**detail**：缺callback不得接口导入已确认；是否允许先保存无回调应用草稿、URL规则和配置变更积压选址未确认。

**timing**：应用表单/接口定稿前

**field_scope**

**mode**：field_level

**原因**：131项语义字段：原125项保留，SRC124新增DFIELD126～131六个选填来源字段。留资时间与平台时间区别；正式wire待定，局部页面实现和真实API分开。 SRC125复用DFIELD024业务类型，补请求级必填/逐条原码保存与回调，不重复新增字段。

**来源**：需求/1.1.0/分析工作区/memory/normalized-user-stories.json, 需求/1.1.0/分析工作区/memory/project-facts.json

**updated_at**：2026-10-14T15:30:48.231740+08:00
