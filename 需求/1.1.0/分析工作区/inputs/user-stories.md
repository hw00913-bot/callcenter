# v1.1.0 当前用户故事与验收

04 S1规范化草稿：12个故事／104条验收；SRC-125请求级必填业务类型补全。JSON为事实源，原101条AC正文保留；本次局部修改/开发包/GitLab已授权，正式G1／G2／G3未批准，真实接口仍待核。

## US-001 原手工导入客户并按手机号拆批

角色：原权限范围内的运营人员；云呼叫中心。触发：运营在选定手工来源任务点击常驻导入客户入口并确认当前名单
目标：保留预外呼任务原手工大弹窗及CSV上传／粘贴／检查／确认；线索类单编码、最终priority必填、选填后置。预外呼手工与接口共用单号供应商导入、同步/53和失败下载；外部双方式接收由US-010、人工分配由US-011承接，不扩大原手工界面。
价值：保留原手工UI导入及预测内部闭环；接口来源含DCC/天网按应用配置回调，无接入应用的手工UI来源仅平台查看，外呼方式另行区分。

前置条件：

- 本故事既有原手工大弹窗/单号供应商批次适用于预外呼任务；外部接口新增人工外呼分配按US-011，二者不混淆。
- 当前身份沿既有名单导入权限，原tenant/task及手工来源准确
- 任务满足既有初始导入状态，历史启动后补导不扩大
- 应用与租户多对多：每个业务系统使用自己的应用凭据与回调配置，应用可授权多个租户、租户可关联多个应用。建议获取token时显式选tenantId并验证有效关联，token固定app/tenant；来源由稳定应用登记识别，报文source若保留仅校验一致性，不能切换身份或回调目标。全部应用接口来源须先配回调才能导入；无接入应用的手工UI来源才仅平台查看，人工外呼方式不等于手工来源。

验收：

- **AC-001**（main）预外呼范围：不同手机号形成独立批次，各批次带对应线索编码；R可选，提供则保留来源追踪，缺R不失败。〔confirmed_business_requirement〕
- **AC-005**（main）接口与原手工导入的R均可选来源元数据，无需字典/允许范围校验；未传不导致行失败，提供则保留追踪，priority独立。保留旧R，不新增默认R枚举；通用输入安全/长度等正式规范仍待核。〔confirmed_business_requirement〕
- **AC-006**（main）预外呼范围：每次有效手工新业务新增recordId和单手机号batchId，不覆盖旧记录，保存phone/leadCode/可选R；外部（DCC/天网）新业务与技术重传按US-010，分别新行映射/原映射回执。平台失败补提另存内部执行与必要单号子批，固定触发root，重复确认/事件不新交；手工界面不新增requestId/isNewBatch或主批控制。〔confirmed_business_requirement〕
- **AC-008**（exception）预外呼范围：运营人员在云呼叫中心下载导入失败记录；未下载记录不设固定到期、持续保留；仅可信成功下载后删除本次成功导出的失败明细和对应文件，不影响成功客户和必要业务状态；失败、中断或未知保留。异步失败按固定快照清理，后到新失败留待下次，已导出重复不再生成；去重、关联、分片、内部尝试及累计已用/未知占用不随明细删除。〔confirmed_business_requirement〕
- **AC-011**（main）预外呼范围：有效手工客户完成当前校验、本地新增独立记录及单手机号批次后，以该原任务已保存的准确供应商任务ID和最终priority自动提交供应商接口，无需运营再手动提交；不采用统一预设供应商任务、不猜任务映射。〔confirmed_business_requirement〕
- **AC-013**（exception）预外呼范围：本地校验保存成功但供应商明确拒绝接收时，纳入导入失败记录，供运营下载并展示供应商返回失败原因。 同步及53异步明确导入失败均适用，未知不误判；导入失败与呼叫失败分开。〔confirmed_business_requirement〕
- **AC-014**（main）本地保存原客户称呼、号码、备注和按业务类型的编码，以及leadCode/最终priority/可选R；线索类新导入的单一编码同源写入leadCode与兼容externalDocumentId，其他类型及历史记录不批量改写。外部接口保存requestId/行、验真租户/稳定应用、由应用登记识别的业务来源及外呼方式；人工分配另保存原坐席工号及解析后的身份。预外呼保存原任务、record/batch/root、原时间和实际供应商映射，失败补提固定触发root/priority及共享连续额度；人工不伪造预测映射或预算。原接入来源不因应用改名/删除或后续同组记录改变。所有已鉴权并保存接入应用/source的接口来源准确结果（含DCC、天网）按US-006回调；原手工UI导入且无接入应用者仅平台查看，秒挂不补提交。〔proposed_design_pending_scope_review〕
- **AC-015**（main）平台取消每日定时查询当天/历史待跟进号码状态及自然日priority衰减，不因未拨、已拨未接通、跨日或原导入日期计算改写存量priority；仅服务衰减的状态查询退出。既有每次可信事件、话单/SIP及无话单失败记录和平台查看继续保留。〔confirmed_business_requirement〕
- **AC-028**（main）预外呼导入、呼叫结果、失败处理及秒挂判定沿既有任务级记录页和任务区域，常驻导入客户入口及原手工大弹窗保持，不新增顶级运营入口；恢复系统设置应用接入列表/新增/详情/修改/删除与后台租户token，仅超管管理，现有登录/租户/任务权限沿用。〔confirmed_business_requirement〕
- **AC-029**（main）预外呼“导入客户”入口常驻，本轮对已锁手工来源的任务打开既有手工导入。当前权限、只读或任务状态不可导入时保留禁用入口和原因，后端同时校验当前租户任务归属、来源与既有可导入状态；不通过按钮改变历史任务补导规则。历史接口来源记录保留，不切换为手工，不通过本轮新增名单混入。〔confirmed_business_requirement〕
- **AC-030**（main）预外呼范围：手工priority统一/逐条填写，仅提交前可改；确认时每个有效行最终priority必填，保存后单手机号独立拆批自动提交。提交后无人工改priority或日龄自动降级；本轮恢复原手工界面体验，统一/逐条调整留在原检查区，原客户信息保留；不新增对外请求或主子控制输入。〔confirmed_business_requirement〕
- **AC-031**（main）预外呼范围：手工线索类只显示并填写一个必需的“线索编码”，复用原动态编码输入，不额外要求同义“业务编码”。保留原基础信息、称呼、号码、备注、CSV文件上传／粘贴／检查／确认；最终priority必填且提交前可统一或逐行填写，联系备注和R选填后置。R无需字典维护/范围校验，缺R不失败；一手机号一批次，失败沿本次可信成功下载后的快照清理规则。〔confirmed_business_requirement〕
- **AC-032**（main）不执行每日状态查询、自然日priority衰减或存量priority改写。失败補提交用触发记录保存priority并留原时间审计；秒挂仅判定保存，应用接口来源含DCC/天网均按应用配置回调，无接入应用的手工UI来源平台查看，不提交重呼。〔proposed_design_pending_scope_review〕
- **AC-035**（exception）关联不明、提交超时、状态未知或真正可信证据冲突保留待核，不伪造成功/失败/最终状态；重复及可信SIP晚更新沿同一已保存对象，不算新呼叫、不重新建立失败计划或发起供应商导入。〔confirmed_business_requirement〕
- **AC-036**（main）预外呼任务创建按既定外部接口或原手工导入选择来源，提交后锁定；服务端校验当前token租户、原任务归属和锁定模式，任务归租户不另绑应用。接口模式接受与该租户有效关联的应用之同schema请求，保存稳定应用及其已登记业务来源，仍按原任务坐席组分配。人工外呼分支按US-011，不借此改预外呼来源或给历史任务混入名单。历史模式/数据保留，身份/归属不足不猜配。〔proposed_design_pending_scope_review〕
- **AC-038**（main）每次可信结果保存原供应商finishRetryFlag Integer1最后一条/0否，未知或未返回独立表示，与SIP更新分开；不能据该标志宣布任务结束或无在途。每次准确结果和可信晚更新均保存，应用接口来源含DCC/天网交US-006回调，不只保存/回传最后一条；无接入应用的手工UI来源同样保存每次准确原结果及可信晚更新，仅平台查看。〔proposed_design_pending_scope_review〕
- **AC-039**（main）预外呼范围：同步返回result=0不代表逐条全成功：分别展示本地校验/保存、供应商导入、呼叫阶段；保留importTotal/successTotal/invalidTotal原始数量与来源。有准确同步证据的成功正常记录；仅汇总数量不能任意指定成功行，未知/矛盾待核，不将同步响应一概降为仅受理。〔confirmed_business_requirement〕
- **AC-040**（exception）预外呼范围：接收53导入失败分片，按enterpriseId经核实租户映射、原taskId、实际fileId及原始号码数据精确回查本次记录、保存root和线索编码；多候选待核，不按最近同号盲配。totalBatchCount/currentBatchCount仅是失败推送分片，不是业务批次；去重、乱序、迟到保留。收齐只证明已声明该失败推送组，不证明全导入终态；未收到不推定零失败。〔confirmed_business_requirement〕
- **AC-041**（exception）预外呼范围：导入阶段明确失败保存并展示原始原因及准确tenant/原task/record/batch/root/leadCode/phone与实际fileId关联；无准确关联待核。已鉴权保存应用/source的全部接口来源按US-006回调准确导入失败，无接入应用的手工UI来源仅平台查看；导入失败不计实际呼叫、不触发11类呼叫失败补提交，结果交付失败不重新提交供应商。〔proposed_design_pending_scope_review〕
- **AC-042**（exception）预外呼范围：既有失败导出入口生成本次固定失败明细快照并显示已知分片完整性；未收齐或未知显示不完整/待核。可信成功下载仅删除本快照明细与文件，失败、中断或未知保留，后到新失败进入后续下载；保留必要业务关联、去重、分片、计划/内部尝试、累计已用及未知占用，已导出重复不再生，不能清空整批客户。〔confirmed_business_requirement〕
- **AC-043**（exception）合成验收预外呼同步部分成功、53分片乱序/重复/迟到与准确关联、失败快照生命周期；各应用接口来源含DCC/天网及人工外呼均回调，无接入应用的手工UI来源仅查看。缺回调配置则接口导入拒绝且不落客户/分配/批次或供应商提交；回调补送不新导入、分配或呼叫。应用多租户使用明确租户身份，跨租户任务/坐席拒绝；来源声明不能更换应用身份/回调。幂等、登记和历史兼容仍待S4，本轮仅合成。〔proposed_design_pending_scope_review〕
- **AC-046**（main）预外呼范围：同一任务的待提交号码按优先级高先提交，同优先级按本地导入时间FIFO；不同任务独立。已提交不撤回重排，提交结果未知不为重排重复提交；一手机号一批次及priority透传保持，不承诺实际拨打顺序。〔confirmed_business_requirement〕
- **AC-052**（main）准确结果保存其实际record、号码及可信callID或稳定事件，leadCode不能替代真实呼叫身份。预外呼另保存原task/batch/root及实际fileId；人工沿真实客户/坐席分配/呼叫关联，不伪造预测字段。接口来源保留原验真app/tenant、requestId/行和与认证应用登记一致的来源，原手工不新增对外协议。去重/审计不因下载或删除丢失；预外呼补提固定触发root。应用接口来源含DCC/天网且关联准确者按US-006回调，无接入应用的手工UI来源仅查看；来源或关联不足待核，不默认DCC。〔proposed_design_pending_scope_review〕
- **AC-059**（main）预外呼任务列表和任务内“导入客户”入口常驻，按所选任务已锁定来源使用对应既有入口；手工来源保持原大弹窗，接口来源不混入手工名单，不切换来源。无权/只读/状态不允许保持禁用及原因；历史可补导任务仅未启动状态沿原权限/名单策略，保留旧名单批次累计，不借入口扩大启动后的初始导入策略。供应商运行任务接收矩阵仍待核。〔confirmed_business_requirement〕
- **AC-060**（exception）原手工导入的上传/粘贴内容、检查结果和最终行编辑必须绑定同一当前草稿；换文件、改文本、检查失败/空结果使旧预览失效。提交处理中锁定，落账前复核身份、任务、当前输入与优先级；取消不提交旧名单。〔confirmed_business_requirement〕
- **AC-069**（main）原客户信息完整保留，原编码按实际业务类型命名。线索类使用一个“线索编码”输入，本次新导入以同一值保存leadCode和兼容键externalDocumentId，不批量改写历史记录；售后类／活动类继续对应单据名称及现有独立leadCode，本轮不重定义。原CSV选文件／粘贴与检查确认保持；旧线索类CSV若含两编码列且值相同可兼容，值不一致应提示并保留输入供修正，不静默覆盖或丢弃原信息。〔confirmed_business_requirement〕

来源：inputs/user-original-20261009.txt#第1条；inputs/source-index.json#SRC-002；inputs/source-index.json#SRC-003；inputs/user-original-20261009.txt#场景1追加原文；inputs/source-index.json#SRC-004；inputs/source-index.json#SRC-005；inputs/source-index.json#SRC-006；inputs/source-index.json#SRC-007；inputs/source-index.json#SRC-008；inputs/source-index.json#SRC-009；inputs/source-index.json#SRC-010；inputs/source-index.json#SRC-011；inputs/source-index.json#SRC-012；inputs/source-index.json#SRC-013；inputs/source-index.json#SRC-014；inputs/source-index.json#SRC-015；inputs/source-index.json#SRC-016；inputs/source-index.json#SRC-017；inputs/source-index.json#SRC-018；inputs/source-index.json#SRC-019；inputs/source-index.json#SRC-020；inputs/source-index.json#SRC-021；inputs/source-index.json#SRC-022；inputs/source-index.json#SRC-023；inputs/source-index.json#SRC-024；inputs/source-index.json#SRC-025；inputs/source-index.json#SRC-026；inputs/source-index.json#SRC-027；inputs/source-index.json#SRC-028；inputs/source-index.json#SRC-029；inputs/source-index.json#SRC-030；inputs/source-index.json#SRC-031；inputs/source-index.json#SRC-032；inputs/source-index.json#SRC-033；inputs/source-index.json#SRC-034；inputs/source-index.json#SRC-035；inputs/source-index.json#SRC-062；inputs/source-index.json#SRC-063；inputs/source-index.json#SRC-064；inputs/source-index.json#SRC-065；inputs/source-index.json#SRC-066；inputs/source-index.json#SRC-067；inputs/source-index.json#SRC-068；inputs/source-index.json#SRC-069；inputs/source-index.json#SRC-070；inputs/source-index.json#SRC-071；inputs/source-index.json#SRC-072；inputs/source-index.json#SRC-073；inputs/source-index.json#SRC-074；inputs/source-index.json#SRC-075；inputs/source-index.json#SRC-076；inputs/source-index.json#SRC-078；inputs/source-index.json#SRC-079；inputs/source-index.json#SRC-083；inputs/source-index.json#SRC-084；inputs/source-index.json#SRC-085；inputs/source-index.json#SRC-086；inputs/source-index.json#SRC-087；inputs/source-index.json#SRC-088；inputs/source-index.json#SRC-089；inputs/source-index.json#SRC-091；inputs/source-index.json#SRC-094；inputs/source-index.json#SRC-095；inputs/source-index.json#SRC-096；inputs/source-index.json#SRC-106；inputs/source-index.json#SRC-109；inputs/source-index.json#SRC-110；inputs/source-index.json#SRC-115；inputs/source-index.json#SRC-116；inputs/source-index.json#SRC-117；inputs/source-index.json#SRC-118；inputs/source-index.json#SRC-119；inputs/source-index.json#SRC-120；inputs/source-index.json#SRC-121

未决边界：

- 真实供应商事件身份、话单秒挂字段/单位/枚举、导航三类覆盖/生效、同号再次受理/排重与原生执行权仍待核。
- 本方内部鉴权、精确关联/历史恢复、四元组额度原子预占及未知提交恢复、可信下载完成信号仍须工程验证；不自动关闭或降低既有缺口。
- 应用/业务系统稳定登记、正式凭证、token显式tenantId与关联撤销后失效机制、tenant+app+operation+requestId精确作用域及历史兼容仍待S3/S4与工程核验。
- 各应用分别配置回调、未配地址禁止接口导入已确认；URL安全校验、正式报文/鉴权/ACK、地址变更后积压结果采用何时配置仍待S3/S4。
- 人工外呼方式与手工UI导入来源分开；坐席人工通话状态和处理结果不能覆盖客观接通证据、统计或秒挂判定。
- 预外呼继续跟进由当前坐席后续人工处理已确认；保留原预测溯源，原任务自动呼叫与后续人工拨号排他/停止能力仍待供应商与工程证据，不宣称已停止。
- SRC-119/120/121本轮S1规范化；G1/G2/G3均pending，旧门禁只历史。未批准真实调用、生产风险或05交付。

## US-002 本地接收可信呼叫结果与SIP并按任务规则分流

角色：云呼叫中心；AliCti供应商；沿任务现有权限查看的运营人员。触发：每次供应商可信呼叫/话单结果或同一call的SIP更新到达
目标：明确承接每次普通call/话单/SIP的本地接收、精确关联、原始保存和可信更新，不仅处理失败或最终一次；任务配置状态与呼叫过频交原生规则，11类失败和秒挂分别转内部流程。
价值：每次call/话单/SIP可信保存形成准确本地状态，应用接口来源全部回调，手工UI来源无应用仅查看；结果补送不触发再次呼叫。

前置条件：

- 本故事的原任务、供应商批次、正常重呼及失败补提交/删除规则仅适用于预外呼，不套用于新增人工外呼分配。
- 准确关联租户、任务、线索及本次事件；任务来源已锁定
- 应用与租户多对多：每个业务系统使用自己的应用凭据与回调配置，应用可授权多个租户、租户可关联多个应用。建议获取token时显式选tenantId并验证有效关联，token固定app/tenant；来源由稳定应用登记识别，报文source若保留仅校验一致性，不能切换身份或回调目标。全部应用接口来源须先配回调才能导入；无接入应用的手工UI来源才仅平台查看，人工外呼方式不等于手工来源。

验收：

- **AC-002**（main）接收线路侧每次可信话单/call/SIP及原始结果，精确关联保存，运营沿既有任务权限查看；已鉴权保存应用/source的接口来源结果（含DCC、天网）交US-006回调。呼叫过频和任务配置状态仅交AliCti原生重呼，11类失败转异常策略，秒挂仅判定不额外提交；原生覆盖/执行权互斥仍待核。〔proposed_design_pending_scope_review〕
- **AC-019**（main）预外呼范围：平台异常补提交保留触发记录原任务、来源及保存root，用内部计划/尝试标识，新子批固定原root不随后来新主改变。外部来源保留原已验证应用、requestId/行审计及逐记录交付关系，接口来源含DCC/天网交US-006回调，无接入应用的手工UI来源平台查看；不伪造新的外部业务请求；独立内部执行继续遵守累计共享失败额度与UNKNOWN占用。〔proposed_design_pending_scope_review〕
- **AC-026**（main）预外呼范围：三天五呼仅适用于任务重呼规则配置状态触发的正常重呼执行流程；呼叫过频只交任务规则，11类失败平台补提交不认作该次数。三天起算、五呼是否含初呼及跨子批延续口径仍待供应商确认，本平台不汇总改写为失败额外次数。〔confirmed_business_requirement〕
- **AC-062**（exception）未可信纯SIP独立保留待核来源证据，不改已确认呼叫结果、不冒充可信非SIP冲突、不阻止随后准确可信call/SIP更新。验收未可信SIP→可信call→可信SIP及可信call→未可信SIP→可信SIP两种顺序：无其他真实可信矛盾时更新同一原call的SIP字段和本地版本，不新增呼叫；真正可信关联或非SIP结果冲突仍待核。〔confirmed_business_requirement〕

来源：inputs/user-original-20261009.txt#第2条；inputs/source-index.json#SRC-002；inputs/source-index.json#SRC-036；inputs/source-index.json#SRC-037；inputs/source-index.json#SRC-038；inputs/source-index.json#SRC-039；inputs/source-index.json#SRC-040；inputs/source-index.json#SRC-041；inputs/source-index.json#SRC-042；inputs/source-index.json#SRC-048；inputs/source-index.json#SRC-049；inputs/source-index.json#SRC-063；inputs/source-index.json#SRC-064；inputs/source-index.json#SRC-065；inputs/source-index.json#SRC-066；inputs/source-index.json#SRC-067；inputs/source-index.json#SRC-068；inputs/source-index.json#SRC-069；inputs/source-index.json#SRC-070；inputs/source-index.json#SRC-083；inputs/source-index.json#SRC-084；inputs/source-index.json#SRC-085；inputs/source-index.json#SRC-086；inputs/source-index.json#SRC-087；inputs/source-index.json#SRC-088；inputs/source-index.json#SRC-089；inputs/source-index.json#SRC-091；inputs/source-index.json#SRC-094；inputs/source-index.json#SRC-095；inputs/source-index.json#SRC-096；inputs/source-index.json#SRC-106；inputs/source-index.json#SRC-109；inputs/source-index.json#SRC-110；inputs/source-index.json#SRC-115；inputs/source-index.json#SRC-116；inputs/source-index.json#SRC-118；inputs/source-index.json#SRC-119；inputs/source-index.json#SRC-120；inputs/source-index.json#SRC-121

未决边界：

- 真实供应商事件身份、话单秒挂字段/单位/枚举、导航三类覆盖/生效、同号再次受理/排重与原生执行权仍待核。
- 本方内部鉴权、精确关联/历史恢复、四元组额度原子预占及未知提交恢复、可信下载完成信号仍须工程验证；不自动关闭或降低既有缺口。
- 应用/业务系统稳定登记、正式凭证、token显式tenantId与关联撤销后失效机制、tenant+app+operation+requestId精确作用域及历史兼容仍待S3/S4与工程核验。
- 各应用分别配置回调、未配地址禁止接口导入已确认；URL安全校验、正式报文/鉴权/ACK、地址变更后积压结果采用何时配置仍待S3/S4。
- 人工外呼方式与手工UI导入来源分开；坐席人工通话状态和处理结果不能覆盖客观接通证据、统计或秒挂判定。
- 预外呼继续跟进由当前坐席后续人工处理已确认；保留原预测溯源，原任务自动呼叫与后续人工拨号排他/停止能力仍待供应商与工程证据，不宣称已停止。
- SRC-119/120/121本轮S1规范化；G1/G2/G3均pending，旧门禁只历史。未批准真实调用、生产风险或05交付。

## US-003 识别并记录可信预测呼叫失败原因

角色：本平台；AliCti。触发：收到供应商预测呼叫失败原始事件，包括无话单失败
目标：准确保存预测11类失败并分流：过频走原任务规则，三类自动、八类人工；应用接口来源含DCC/天网的准确结果按US-006回调，无接入应用的手工UI来源本地查看。未知不猜，无话单可信失败不等待话单。
价值：实现该原文业务处理目标（分析概括）

前置条件：

- 本故事的原任务、供应商批次、正常重呼及失败补提交/删除规则仅适用于预外呼，不套用于新增人工外呼分配。
- 准确关联租户、任务、线索及本次事件；任务来源已锁定
- 应用与租户多对多：每个业务系统使用自己的应用凭据与回调配置，应用可授权多个租户、租户可关联多个应用。建议获取token时显式选tenantId并验证有效关联，token固定app/tenant；来源由稳定应用登记识别，报文source若保留仅校验一致性，不能切换身份或回调目标。全部应用接口来源须先配回调才能导入；无接入应用的手工UI来源才仅平台查看，人工外呼方式不等于手工来源。

验收：

- **AC-003**（main）接收并保存可信准确预测呼叫失败原始原因，应用接口来源含DCC/天网交US-006回调，无接入应用的手工UI来源平台查看。无话单失败不等待客户状态推送或话单；准确稳定事件身份与原因映射仍待核。〔proposed_design_pending_scope_review〕
- **AC-020**（main）可信准确的11类预测呼叫失败分类保存。禁呼、限呼、restrict tel即外呼黑名单三类从平台收到并确认每次失败起算120秒自动补提交，线路降级依赖供应商外显导航，不先取得解禁/降级成功回执；其余八类仅人工。自动/人工共享首次外最多2次，无话单可信失败直接记录；导航覆盖、配置、执行权和真实事件仍待核。〔confirmed_business_requirement〕
- **AC-033**（main）预外呼范围：无话单可信失败独立本地保存，允许无通话ID，以准确稳定事件关联原记录；未知/未返回不伪造话单、callId或默认最后一通标识。〔confirmed_business_requirement〕

来源：inputs/user-original-20261009.txt#第3条；inputs/source-index.json#SRC-002；inputs/source-index.json#SRC-043；inputs/source-index.json#SRC-063；inputs/source-index.json#SRC-064；inputs/source-index.json#SRC-065；inputs/source-index.json#SRC-066；inputs/source-index.json#SRC-067；inputs/source-index.json#SRC-068；inputs/source-index.json#SRC-069；inputs/source-index.json#SRC-070；inputs/source-index.json#SRC-084；inputs/source-index.json#SRC-085；inputs/source-index.json#SRC-086；inputs/source-index.json#SRC-089；inputs/source-index.json#SRC-091；inputs/source-index.json#SRC-094；inputs/source-index.json#SRC-095；inputs/source-index.json#SRC-096；inputs/source-index.json#SRC-102；inputs/source-index.json#SRC-106；inputs/source-index.json#SRC-109；inputs/source-index.json#SRC-110；inputs/source-index.json#SRC-115；inputs/source-index.json#SRC-116；inputs/source-index.json#SRC-118；inputs/source-index.json#SRC-119；inputs/source-index.json#SRC-120；inputs/source-index.json#SRC-121

未决边界：

- 真实供应商事件身份、话单秒挂字段/单位/枚举、导航三类覆盖/生效、同号再次受理/排重与原生执行权仍待核。
- 本方内部鉴权、精确关联/历史恢复、四元组额度原子预占及未知提交恢复、可信下载完成信号仍须工程验证；不自动关闭或降低既有缺口。
- 应用/业务系统稳定登记、正式凭证、token显式tenantId与关联撤销后失效机制、tenant+app+operation+requestId精确作用域及历史兼容仍待S3/S4与工程核验。
- 各应用分别配置回调、未配地址禁止接口导入已确认；URL安全校验、正式报文/鉴权/ACK、地址变更后积压结果采用何时配置仍待S3/S4。
- 人工外呼方式与手工UI导入来源分开；坐席人工通话状态和处理结果不能覆盖客观接通证据、统计或秒挂判定。
- 预外呼继续跟进由当前坐席后续人工处理已确认；保留原预测溯源，原任务自动呼叫与后续人工拨号排他/停止能力仍待供应商与工程证据，不宣称已停止。
- SRC-119/120/121本轮S1规范化；G1/G2/G3均pending，旧门禁只历史。未批准真实调用、生产风险或05交付。

## US-004 识别真实客户秒挂并保存原始结果

角色：本平台；客户。触发：出现可能的客户秒挂
目标：保存真实call、完整秒挂三态与证据，应用接口来源全部按US-006回调，手工UI无应用来源本地查看；全部无平台秒挂重呼，坐席人工状态不替代真实判据。
价值：实现该原文业务处理目标（分析概括）

前置条件：

- 准确关联租户、记录及本次真实呼叫；预外呼保留原任务/批次，人工只保存实际客户/分配/通话关联。
- 应用与租户多对多：每个业务系统使用自己的应用凭据与回调配置，应用可授权多个租户、租户可关联多个应用。建议获取token时显式选tenantId并验证有效关联，token固定app/tenant；来源由稳定应用登记识别，报文source若保留仅校验一致性，不能切换身份或回调目标。全部应用接口来源须先配回调才能导入；无接入应用的手工UI来源才仅平台查看，人工外呼方式不等于手工来源。

验收：

- **AC-004**（main）准确判定秒挂后保存真实呼叫、原话单、供应商原结果、本方秒挂/非秒挂/待核三态及证据；应用接口来源含DCC/天网交US-006明确回调，无接入应用的手工UI来源仅平台查看。秒挂不生成平台重导计划，不再提交供应商。〔proposed_design_pending_scope_review〕
- **AC-021**（main）先准确关联同一真实呼叫；整体归属或可信证据冲突先待核。客户真实接听、客户主动挂断、可信客户有效接通时长0～2秒含真实0及2分别为true/false/unknown：任一可信false即明确非秒挂，即使其余unknown；三项均可信true才为秒挂；无false且至少一项unknown则待核。缺失/异常/负时长或单位未核为unknown，不补0，不以坐席桥接时长替代，生产字段/单位/挂断枚举仍待核。〔confirmed_threshold_with_context〕
- **AC-022**（main）秒挂不再提交重呼，不发放秒挂补提交额度、不设置等待间隔或计时器、不生成异常子批；撤销旧额外2次、30分钟和4次规则。仅预外呼的11类失败链共享最多额外2次保持独立，不因人工外呼分配新增该额度。〔confirmed_business_requirement〕
- **AC-023**（main）每次本地结果保留tenant、保存leadCode/fixedphone及准确真实call或稳定事件关系。预外呼另留原task/record/batch/root及实际fileId；人工只留实际客户/分配/坐席/通话关联，不伪造预测映射。接口均保存原requestId/行及与认证应用登记一致的来源；预测内部失败补提固定触发root，后有新主不改旧root。缺真实callId/稳定事件不按最近同号或近似时间猜配；符合US-006的全部应用接口来源准确结果交付（含DCC、天网），无接入应用的手工UI来源仅平台查看。人工生产结果映射待S4核验。〔proposed_design_pending_scope_review〕
- **AC-027**（main）仅预外呼三天五呼针对任务重呼配置状态触发的呼叫，预测失败自动/人工共享额外2次不认作该次数。秒挂仅判定保存，全部应用接口来源且精确关联的记录按应用配置回调，绝无平台秒挂重呼计数/额度/计划；人工外呼分配不自动套用预测任务重呼规则。供应商原生覆盖仍待核，不新增再导入或停止其原生重呼。〔proposed_design_pending_scope_review〕
- **AC-034**（main）能确认已接听、客户挂断且真实接听时长0秒，纳入秒挂；未接通、缺失或异常时长不纳入。〔confirmed_business_requirement〕

来源：inputs/user-original-20261009.txt#第4条；inputs/source-index.json#SRC-002；inputs/source-index.json#SRC-045；inputs/source-index.json#SRC-046；inputs/source-index.json#SRC-047；inputs/source-index.json#SRC-048；inputs/source-index.json#SRC-049；inputs/source-index.json#SRC-063；inputs/source-index.json#SRC-064；inputs/source-index.json#SRC-065；inputs/source-index.json#SRC-066；inputs/source-index.json#SRC-067；inputs/source-index.json#SRC-068；inputs/source-index.json#SRC-069；inputs/source-index.json#SRC-070；inputs/source-index.json#SRC-083；inputs/source-index.json#SRC-084；inputs/source-index.json#SRC-085；inputs/source-index.json#SRC-086；inputs/source-index.json#SRC-089；inputs/source-index.json#SRC-091；inputs/source-index.json#SRC-094；inputs/source-index.json#SRC-095；inputs/source-index.json#SRC-096；inputs/source-index.json#SRC-106；inputs/source-index.json#SRC-109；inputs/source-index.json#SRC-110；inputs/source-index.json#SRC-115；inputs/source-index.json#SRC-116；inputs/source-index.json#SRC-118；inputs/source-index.json#SRC-119；inputs/source-index.json#SRC-120；inputs/source-index.json#SRC-121

未决边界：

- 真实供应商事件身份、话单秒挂字段/单位/枚举、导航三类覆盖/生效、同号再次受理/排重与原生执行权仍待核。
- 本方内部鉴权、精确关联/历史恢复、四元组额度原子预占及未知提交恢复、可信下载完成信号仍须工程验证；不自动关闭或降低既有缺口。
- 应用/业务系统稳定登记、正式凭证、token显式tenantId与关联撤销后失效机制、tenant+app+operation+requestId精确作用域及历史兼容仍待S3/S4与工程核验。
- 各应用分别配置回调、未配地址禁止接口导入已确认；URL安全校验、正式报文/鉴权/ACK、地址变更后积压结果采用何时配置仍待S3/S4。
- 人工外呼方式与手工UI导入来源分开；坐席人工通话状态和处理结果不能覆盖客观接通证据、统计或秒挂判定。
- 预外呼继续跟进由当前坐席后续人工处理已确认；保留原预测溯源，原任务自动呼叫与后续人工拨号排他/停止能力仍待供应商与工程证据，不宣称已停止。
- SRC-119/120/121本轮S1规范化；G1/G2/G3均pending，旧门禁只历史。未批准真实调用、生产风险或05交付。

## US-005 生成并执行三类失败自动补提交

角色：云呼叫中心。触发：收到准确关联的运营商禁呼、运营商限呼或外呼黑名单新失败结果
目标：仅禁呼、限呼、外呼黑名单从平台收到并确认本次可信失败后120秒自动补提交；降级依赖供应商外显导航，与八类人工共享四元组跨主批累计首次外最多2次，内部尝试固定触发root，不新增解禁/成功降级回执前置。
价值：呼叫中心承担三类异常的内部后续处理，正常原生任务规则与失败额度独立。

前置条件：

- 本故事的原任务、供应商批次、正常重呼及失败补提交/删除规则仅适用于预外呼，不套用于新增人工外呼分配。
- 事件及租户/原任务/触发记录关联可信
- 供应商外显导航为线路降级执行依赖；配置/3类覆盖/同号再次受理和原生执行权仍待核，不宣称生产支持。
- 应用与租户多对多：每个业务系统使用自己的应用凭据与回调配置，应用可授权多个租户、租户可关联多个应用。建议获取token时显式选tenantId并验证有效关联，token固定app/tenant；来源由稳定应用登记识别，报文source若保留仅校验一致性，不能切换身份或回调目标。全部应用接口来源须先配回调才能导入；无接入应用的手工UI来源才仅平台查看，人工外呼方式不等于手工来源。

验收：

- **AC-063**（main）预外呼范围：除呼叫过频外11类失败：禁呼、限呼、restrict tel三类自动，其余无可用中继/bad tel/真实号码为空/no clid/bad clid/无可用中继信息/wrong obClidGroup/bad timeout range八类人工。过频只任务规则；未知原因、同步导入拒绝、53不进本策略。接口结果交付失败只补送，不能生成新的失败补提交。〔confirmed_business_requirement〕
- **AC-064**（main）预外呼范围：自动三类和人工八类按同租户＋原任务＋服务端已保存线索编码＋固定手机号累计，共享首次外最多2次失败补提交；另开主批、新子批、新fileId、原因、方式或操作人变化不重置。实际新的业务补提交发起占一次，明确接收或拒绝均计，未知保留占用待核；首次导入不计额外失败次数，正常任务重呼独立，秒挂无补提交。历史四元组或累计账不可恢复先待核，不以业务编码/空值/新root或新生成线索编码默认发2次；既有外部新业务记录亦不重置保存的累计账。〔confirmed_business_requirement〕
- **AC-065**（main）预外呼范围：自动3类等待2分钟，依赖供应商外显导航降级线路，平台不直接换主叫、不自动修改priority，也不自行解禁。2分钟从平台收到并确认每次准确失败结果起算；导航覆盖/生效和同号再次接收未核时不能宣称生产可执行。人工8类由有权任务处理用户核对资源、数据或配置后明确发起，不要求全部等待2分钟，不静默修改真实phone。〔confirmed_business_requirement〕
- **AC-066**（main）预外呼范围：同一准确失败事件最多形成一份有效自动计划或待人工对象；重复推送、重复确认、SIP晚更新不重建、不重复消耗额度、不重启计时，自动/人工并发沿同一独占执行守卫。120秒取首次保存本次准确失败确认时间，新的真实补提失败才按新确认时间起下一轮，额度延续；事件身份或提交未知保持同尝试占用待核。〔confirmed_business_requirement〕
- **AC-067**（main）预外呼范围：同一次后续执行在AliCti任务原生重呼与本方异常补提交之间保持互斥；不能按未查到话单、缺finishRetryFlag或单一最后标志推定无在途重呼。未核执行权时保持待核，不保证安全重提。〔confirmed_business_requirement〕
- **AC-068**（main）预外呼范围：触发M1的失败迟到且本地已保存M2时，本方补提交单号子批仍关联触发记录保存的M1 root，不改挂最近主；本地新增内部触发事件/尝试映射，不新增第三层业务批次，不按root分别发额度。手工不增加主批选择控制字段，可信历史root不足先待核。〔confirmed_business_requirement〕
- **AC-070**（main）预外呼范围：既有任务记录显示失败原始原因、三类自动/八类人工方式、四元组跨主批共享额外2次的已用/剩余及未知占用、本次确认时间和仅自动的+120秒到期，以及待人工/待核/执行中/受理/停止和触发root/fileId。八类在准确原记录提供沿任务现有权限的人工重提交入口；秒挂只展示三态和原话单，无额度、计划、倒计时或重提入口。〔confirmed_business_requirement〕
- **AC-072**（main）仅预外呼任务沿原正常重呼配置，失败三类自动120秒/八类人工共享首次外2次，秒挂仅结果且全部应用接口来源按原应用配置回调，无补提次数/等待参数。预外呼接口/原手工来源提交后锁定，允许与当前租户有效关联的应用按接口模式导入；原应用及登记来源保留，任务不另绑应用且首次按任务坐席组分配。人工分支按US-011分配，预外呼继续跟进转当前坐席人工按US-012，不据此改原预测规则或宣称供应商已停止自动呼叫。〔proposed_design_pending_scope_review〕
- **AC-073**（main）预外呼范围：自动3类计划到期或人工8类明确发起时，在失败额度可用、关联准确、任务可执行及供应商执行权不冲突的条件下，实际发起一次并占用一次。成功/失败均计数，未知保留占用待核，不自动释放再发。暂停挂起、终止停止尚未执行计划，恢复后重新核查；人工不能绕过停止状态或次数，在途/技术传输恢复仍待核。〔confirmed_business_requirement〕
- **AC-074**（main）预外呼范围：本方自动或人工失败补提交保留原任务、触发记录保存priority和来源时间，按同任务待提交priority高先/同级本次排队FIFO；不因人工、导航降级或后来新主重取priority，不日衰减，已受理不撤回重排，未知不为排序重发。〔confirmed_business_requirement〕
- **AC-079**（main）预外呼范围：3类自动补提交的线路降级由供应商外显导航承担，本平台只按策略补提交并记录结果，不承诺一定换线路或换主叫、不增加本方解禁接口。导航配置、生效时点、3类覆盖和排重/原生重呼交互在G2核验前保留partial/missing。〔confirmed_business_requirement〕

来源：inputs/source-index.json#SRC-089；inputs/source-index.json#SRC-092；inputs/source-index.json#SRC-093；inputs/source-index.json#SRC-094；inputs/source-index.json#SRC-096；inputs/source-index.json#SRC-098；inputs/source-index.json#SRC-102；inputs/source-index.json#SRC-106；inputs/source-index.json#SRC-109；inputs/source-index.json#SRC-110；inputs/source-index.json#SRC-115；inputs/source-index.json#SRC-116；inputs/source-index.json#SRC-118；inputs/source-index.json#SRC-119；inputs/source-index.json#SRC-120；inputs/source-index.json#SRC-121

未决边界：

- 真实供应商事件身份、话单秒挂字段/单位/枚举、导航三类覆盖/生效、同号再次受理/排重与原生执行权仍待核。
- 本方内部鉴权、精确关联/历史恢复、四元组额度原子预占及未知提交恢复、可信下载完成信号仍须工程验证；不自动关闭或降低既有缺口。
- 应用/业务系统稳定登记、正式凭证、token显式tenantId与关联撤销后失效机制、tenant+app+operation+requestId精确作用域及历史兼容仍待S3/S4与工程核验。
- 各应用分别配置回调、未配地址禁止接口导入已确认；URL安全校验、正式报文/鉴权/ACK、地址变更后积压结果采用何时配置仍待S3/S4。
- 人工外呼方式与手工UI导入来源分开；坐席人工通话状态和处理结果不能覆盖客观接通证据、统计或秒挂判定。
- 预外呼继续跟进由当前坐席后续人工处理已确认；保留原预测溯源，原任务自动呼叫与后续人工拨号排他/停止能力仍待供应商与工程证据，不宣称已停止。
- SRC-119/120/121本轮S1规范化；G1/G2/G3均pending，旧门禁只历史。未批准真实调用、生产风险或05交付。

## US-006 向原应用业务系统回调每次结果、进度及完成沟通快照

角色：云呼叫中心；全部应用接口接入业务系统（含DCC、天网）。触发：每次准确结果/真实进度保存，或本次外呼已结束且已完成沟通跟进保存成功后，按原应用交付或补送
目标：保留全部应用接口来源每次结果与进度回调；新增本次外呼结束且“已完成沟通”保存成功后的本次通话+本次已保存客户业务信息快照回调。各次回调带原业务批次号，按原应用/租户/记录交付，手工UI无应用仅查看；补送不再呼叫。 本次已填选填字段与所选枚举项的业务编码和值随保存时快照回传；缺码交付待完善而不阻断有效本地保存。 新增六项意向来源业务字段的准确接收/展示及完成快照关联，沿原应用和记录，不猜缺值或Smartcode语义。 留资时间保存/展示/回调原业务来源值，不由平台时间替代。 接口请求明确原业务类型，接收逐条固化并用于既有展示、对应表单和原应用回调。
价值：接入系统完整获得自身线索处理结果，避免因来源或外呼方式遗漏回调，同时防止补送触发重复业务执行。

前置条件：

- 应用管理仅超管；应用token不赋予平台运营、坐席或管理员权限。
- 应用与租户多对多：每个业务系统使用自己的应用凭据与回调配置，应用可授权多个租户、租户可关联多个应用。建议获取token时显式选tenantId并验证有效关联，token固定app/tenant；来源由稳定应用登记识别，报文source若保留仅校验一致性，不能切换身份或回调目标。全部应用接口来源须先配回调才能导入；无接入应用的手工UI来源才仅平台查看，人工外呼方式不等于手工来源。
- 预外呼核租户/原任务及接口初始来源并沿任务坐席组；人工外呼核同租户目标坐席并按US-011，历史来源/配置不静默改写。

验收：

- **AC-018**（main）全部通过应用接口接入的业务来源（含DCC、天网），对精确关联的每次结果及真实处理进度均按所属应用的回调配置交付。原应用身份、tenant、与认证应用登记一致的来源与接收时实际关联分别保存，不由外呼方式判断是否回调：接口人工外呼也回调，手工UI导入且没有接入应用才仅平台查看。预外呼保留真实任务/批次/话单及原finishRetryFlag，人工只携实际客户/分配/通话关联；真实客观通话结果与坐席人工记录分开。回调失败只补送同一结果，不重新导入、分配或拨号；各应用分别配置回调地址；积压结果选址仍待核。〔proposed_design_pending_scope_review〕
- **AC-037**（main）全部接入业务系统（含天网）都需回调：本方服务使用应用配置的回调地址，不再只对DCC发送。应用未配置回调地址不得进行接口导入，按AC-086明确拒绝，不先收线索后等地址。仅超管沿应用配置维护地址，任务和导入报文不提供任意临时回调URL。手工UI来源无接入应用仍仅平台查看；各应用分别配置自己的回调地址，正式URL/鉴权/ACK及配置变更积压策略待核。 同一应用回调承接多个租户时，本方候选报文保留准确原tenantId、稳定应用及原业务记录/请求标识以区分归属，不按最近一次申请token的租户改路由；具体字段、签名、版本与ACK待S4。〔proposed_design_pending_scope_review〕
- **AC-071**（main）全部应用接口来源（含DCC、天网）的准确结果和实际平台处理进度按所属应用回调配置交付；接入系统不因此接管平台预测失败补提。预外呼内部尝试继承触发记录原应用/source，不因执行者或后来同root记录改变；人工分配也保留实际客户/分配/通话关联并回调。补送只交同一结果，不重导供应商、不再分配或拨号。未配回调地址不得接口导入；应用地址变更后的接收目标、正式报文/ACK与地址变更积压选址待核。〔proposed_design_pending_scope_review〕
- **AC-075**（main）全部应用接口来源含DCC/天网均对准确秒挂输出明确本方分类并按应用配置回调；无接入应用的手工UI来源保存同样三态供本地查看。保留原供应商结果及真实call、实际request/行/客户/分配关联，预测字段仅用于真实预外呼对象；坐席人工选择的通话状态不替代秒挂证据或供应商结果。来源由认证应用的稳定业务系统登记识别；报文source若保留仅校验一致性，不改变身份或接收目标。字段/版本/ACK及人工话单映射待核；未知不标秒挂，补送不产生供应商提交、新分配或计时。〔proposed_design_pending_scope_review〕
- **AC-096**（main）对准确原应用接口来源的完成沟通事件，按保存的原应用、tenant和业务记录路由到该应用配置的对应业务系统，回调本次通话记录、本次已保存的客户业务信息快照及该记录原businessBatchNo。不能以最近应用/租户token/同批其他记录、外呼方式或临时URL改接收端；预外呼和人工接口来源均适用。原有每次结果/进度回调也携带对应记录原业务批次号，字段缺失时明确保留历史缺值、不猜造。话单未齐或部分字段未知时保留真实已知与缺失状态，不为“已完成沟通”伪造接通；动态业务字段标识/类型/选项与配置版本、通话记录具体结构、晚到话单后续交付机制及正式签名/ACK契约仍待S4核验。〔confirmed_business_requirement_with_contract_details_proposed〕
- **AC-097**（exception）新增完成沟通回调不替代或撤销既有每次通话结果、真实进度、秒挂分类及失败结果回调。建议按准确记录、本次call及保存版本形成稳定事件身份；重复保存/重复通知不重复生成同一完成事件，交付失败仅补送该事件的原业务批次号与已保存快照，不重新导入、分配或拨号。业务批次号可复用，不能用它单独去重回调。补送不偷偷读取当前业务表单或跨通话聚合；后到话单只按正式更新/版本方案补充同一call的客观事实，不覆写原已保存业务快照。稳定事件ID、版本、接收ACK、超时/补送策略、地址变更积压目标及重复或修改保存语义继续待双方契约与工程证据，不将HTTP受理或本地保存当作业务系统已接收成功。〔confirmed_business_requirement_with_contract_details_proposed〕
- **AC-098**（main）完成沟通回调中的本次已填写客户业务信息（含选填业务字段），须携带对应字段业务编码及已保存值；枚举选项还须携配置的选项业务编码和值，多选包含全部选中项编码，不得只发中文标签或内部字段/选项ID。与AC-096的本次已保存快照绑定，按原租户保存当时配置冻结字段及选项业务编码、值和可溯源配置信息，后续配置改名或改码不改写原快照，补送沿同一快照。未填写的选填字段不伪造值或选项编码；已填写字段或已选选项缺业务编码时，标记“回调资料待完善”，不得以label/内部ID兜底并声称完整交付成功，也不得因此阻止满足既有校验的坐席本地保存或丢失草稿。历史缺编码不猜造，正式报文字段、配置版本/值类型、缺码补全及恢复交付规则待双方契约与工程验证。验收须覆盖文本字段业务编码、单选及多选全部编码、空选填、已填缺码、本地保存成功但交付待完善，以及保存后改配置再补送仍用原码原值。〔confirmed_business_requirement_with_contract_details_proposed〕
- **AC-101**（main）已完成沟通的本次保存事件在原app/tenant/record及本call快照中保留六项原导入业务字段及原businessBatchNo，回调对应原应用业务系统时携带已提供的原字符串；缺值保留明确未提供语义，不从后续导入、最新客户聚合、计划到店门店或新配置补猜。意向门店编码/名称、意向车系编码/车系、Smartcode及留资时间与坐席本次填写业务信息分开标识，Smartcode不转换或派生，补送沿同事件原快照。已填选填业务字段和所选枚举项仍按AC-098冻结保存时业务编码及值、多选全量；六项来源字段不得代替真实跟进字段业务编码或表单计划到店记录。完成触发、每次结果/进度回调、缺码资料待完善不阻止有效本地保存及补送不重导/重拨规则不变；正式回调结构、字段映射、空值/缺码兼容及可靠快照仍待S4与工程核验。 回调留资时间携本次原业务来源值，不能用平台importedAt/savedAt、当前时刻或呼叫时间替代；缺值语义及正式格式/时区/精度仍待契约。〔confirmed_business_field_names_and_UI_requirement_with_details_proposed〕
- **AC-104**（main）向对应原应用业务系统回调每次准确结果、进度及已完成沟通的保存快照时，均携本记录原businessType稳定编码，并与原businessBatchNo、线索编码及准确app/tenant/record/call关联；业务类型展示名称不能替代编码，source和callMode分别保留。原每次回调及完成沟通触发条件不变，六项原来源字段、本次已填业务字段及枚举项编码和值继续按AC-098/101的保存时快照回传。补送沿同事件原类型快照，配置后续改名/停用、同手机号新导入或同业务批次重复使用不得替换原类型；类型不改变回调所属应用与租户、不触发新导入/分配/重拨。旧记录无类型不伪造默认，旧事件兼容与正式payload/ACK、表单版本及可靠保存仍待S4与工程核验，未证明真实回调可用。〔confirmed_scoped_product_change_with_engineering_contract_pending〕

来源：inputs/source-index.json#SRC-089；inputs/source-index.json#SRC-092；inputs/source-index.json#SRC-093；inputs/source-index.json#SRC-094；inputs/source-index.json#SRC-096；inputs/source-index.json#SRC-098；inputs/source-index.json#SRC-106；inputs/source-index.json#SRC-109；inputs/source-index.json#SRC-110；inputs/source-index.json#SRC-115；inputs/source-index.json#SRC-116；inputs/source-index.json#SRC-118；inputs/source-index.json#SRC-119；inputs/source-index.json#SRC-120；inputs/source-index.json#SRC-121；inputs/source-index.json#SRC-123；inputs/source-index.json#SRC-124；inputs/source-index.json#SRC-125

未决边界：

- 应用/业务系统稳定登记、正式凭证、token显式tenantId与关联撤销后失效机制、tenant+app+operation+requestId精确作用域及历史兼容仍待S3/S4与工程核验。
- 各应用分别配置回调、未配地址禁止接口导入已确认；URL安全校验、正式报文/鉴权/ACK、地址变更后积压结果采用何时配置仍待S3/S4。
- 人工外呼方式与手工UI导入来源分开；坐席人工通话状态和处理结果不能覆盖客观接通证据、统计或秒挂判定。
- 预外呼继续跟进由当前坐席后续人工处理已确认；保留原预测溯源，原任务自动呼叫与后续人工拨号排他/停止能力仍待供应商与工程证据，不宣称已停止。
- SRC-122与SRC-123纳入本轮正式S1/S2重验，G1/G2/G3均pending，旧门禁仅历史；生产缺口及分阶段验收边界保持。
- SRC-123新业务批次号必传/可复用及完成沟通快照方向已明确；字段层级与长度、历史缺值兼容、业务字段配置快照、保存/事件一致性、晚到话单、事件ID/版本/ACK继续待S3/S4与工程。
- 本次字段/选项业务编码快照、历史缺码兼容与补全恢复交付待正式契约；不能仅用内部ID/label宣称完整回调成功。
- SRC-124候选逐行字段名、长度/空值/旧调用兼容、显示绑定及与完成沟通快照的正式映射待S3/S4/S6核验；不擅改供应商API002，历史不批改。
- SRC125当前租户权威业务类型码集合、字段/旧客户端兼容、原表单版本与回调事件持久性待S4/工程核验；不虚构新供应商字段。

## US-007 人工重提交其余八类失败客户

角色：该任务现有操作权限范围内的有权运营和管理员。触发：查看既有失败记录并明确发起手动重提交
目标：仅对自动3类之外的8类失败，由有权用户核对问题后明确重提交现有记录；与自动失败共享首次外最多2次额度，保留来源和原root，不另导入新名单。
价值：在呼叫中心由原任务有权人员明确处理已有八类失败，保持共享额度和真实对象审计。

前置条件：

- 本故事的原任务、供应商批次、正常重呼及失败补提交/删除规则仅适用于预外呼，不套用于新增人工外呼分配。
- 记录准确属于当前租户和原任务
- 本次是已导入记录异常处理，不是客户首次手工导入
- 沿用该任务现有操作权限，在授权租户/任务内有权运营和管理员可操作；本需求不自动赋予真实账号权限
- 应用与租户多对多：每个业务系统使用自己的应用凭据与回调配置，应用可授权多个租户、租户可关联多个应用。建议获取token时显式选tenantId并验证有效关联，token固定app/tenant；来源由稳定应用登记识别，报文source若保留仅校验一致性，不能切换身份或回调目标。全部应用接口来源须先配回调才能导入；无接入应用的手工UI来源才仅平台查看，人工外呼方式不等于手工来源。

验收：

- **AC-076**（main）预外呼范围：其余8类失败仅提供人工重提交，不生成自动2分钟计划。用户明确选择当前失败记录并确认，操作仅补提交该记录，不新增或编辑一份客户名单，不静默更换真实phone。〔confirmed_business_requirement〕
- **AC-077**（main）预外呼范围：人工补提交沿原任务现有操作权限，在授权tenant/task内有权运营和管理员处理八类已保存失败，逐次核当前权和准确对象；包括接口来源已保存失败，不等于向接入系统开放人工重提接口或应用token授予内部运营权限。保留原来源/request审计和触发root，创建内部尝试/必要子批，不迁来源、不伪造新的外部（DCC/天网）请求或给真实账号新权。 保存并继承触发记录已校验保存的原应用登记来源；全部应用接口来源进度含DCC/天网沿US-006交付，无接入应用的手工UI来源仅平台查看，运营操作者或共享root不改变原来源。〔proposed_design_pending_scope_review〕
- **AC-078**（main）预外呼范围：人工与自动失败按同租户+原任务+线索编码+固定手机号共享首次外2次，另开主批也不重置。额度用尽、已有占用/未知、任务暂停/终止或当前任务权限不足时按钮不可执行并说明原因。双击/并发/重复反馈不产生额外一次，原因/方式/操作人变化不重置；服务端同步校验，不能仅前端禁用。〔confirmed_business_requirement〕

来源：inputs/source-index.json#SRC-102；inputs/source-index.json#SRC-094；inputs/source-index.json#SRC-106；inputs/source-index.json#SRC-109；inputs/source-index.json#SRC-110；inputs/source-index.json#SRC-116；inputs/source-index.json#SRC-118；inputs/source-index.json#SRC-119；inputs/source-index.json#SRC-120；inputs/source-index.json#SRC-121

未决边界：

- 真实供应商事件身份、话单秒挂字段/单位/枚举、导航三类覆盖/生效、同号再次受理/排重与原生执行权仍待核。
- 本方内部鉴权、精确关联/历史恢复、四元组额度原子预占及未知提交恢复、可信下载完成信号仍须工程验证；不自动关闭或降低既有缺口。
- 应用/业务系统稳定登记、正式凭证、token显式tenantId与关联撤销后失效机制、tenant+app+operation+requestId精确作用域及历史兼容仍待S3/S4与工程核验。
- 各应用分别配置回调、未配地址禁止接口导入已确认；URL安全校验、正式报文/鉴权/ACK、地址变更后积压结果采用何时配置仍待S3/S4。
- 人工外呼方式与手工UI导入来源分开；坐席人工通话状态和处理结果不能覆盖客观接通证据、统计或秒挂判定。
- 预外呼继续跟进由当前坐席后续人工处理已确认；保留原预测溯源，原任务自动呼叫与后续人工拨号排他/停止能力仍待供应商与工程证据，不宣称已停止。
- SRC-119/120/121本轮S1规范化；G1/G2/G3均pending，旧门禁只历史。未批准真实调用、生产风险或05交付。

## US-008 有权运营或管理员删除指定供应商记录

角色：有该原任务操作权限的运营或管理员。触发：选择当前精确记录并明确确认供应商号码删除
目标：沿现有原任务权限删除仅指定供应商业务对象，区分本地未执行计划停止和远端删除结果，保留本地记录/root/预算/原call及秒挂判定；选择器/跳过/在途未知不外发或不伪造成功。
价值：本轮手工与内部闭环具备受现有任务权限约束的精确供应商删除，不再依赖DCC触发。

前置条件：

- 本故事的原任务、供应商批次、正常重呼及失败补提交/删除规则仅适用于预外呼，不套用于新增人工外呼分配。
- 服务端逐次验证当前用户有该原任务权限及授权tenant/task/准确record
- 实际fileId/phone/root映射可靠且选择器能够精确表达本次目标；否则待核不外发
- 应用与租户多对多：每个业务系统使用自己的应用凭据与回调配置，应用可授权多个租户、租户可关联多个应用。建议获取token时显式选tenantId并验证有效关联，token固定app/tenant；来源由稳定应用登记识别，报文source若保留仅校验一致性，不能切换身份或回调目标。全部应用接口来源须先配回调才能导入；无接入应用的手工UI来源才仅平台查看，人工外呼方式不等于手工来源。

验收：

- **AC-016**（main）预外呼范围：有该原任务操作权限的运营或管理员选择并明确确认当前指定记录的供应商号码删除；服务端逐次核实当前权限、授权租户/原任务及准确record/batch/已保存实际fileId/phone，不按leadCode、root或同号整组扩大。只有指定供应商目标明确成功才标已删；本地客户记录、原来源审计、主子root、精确供应商/通话映射、去重和累计已用/未知占用继续保留。删除/取消意图已授权且目标准确后阻断该对象尚未执行失败计划，不影响其他批次；不假造已受理或在途呼叫撤回。〔confirmed_business_requirement〕
- **AC-024**（main）预外呼范围：指定记录删除/取消不抹本地原秒挂话单、准确关联、已保存三态判定及本地版本，不影响其他任务/同号其他批次。秒挂无待执行补提交计划，供应商指定删除只复用US-008当前权限与精确选择范围；不新增秒挂停止API，远端在途能力继续待核。〔confirmed_business_requirement〕
- **AC-025**（main）预外呼范围：对已授权且准确指定的删除/取消目标，原子停止仅该对象尚未执行失败计划；供应商明确成功后本地标记该目标已从供应商删除，失败或未知保持真实状态。平台分别展示本地计划停止与供应商删除结果，保存原记录/root/预算和证据；不清root整组、不影响其他同号批次、不释放已用或未知占用。在途取消和并发受理仍待核，不假造远端撤回。〔confirmed_business_requirement〕
- **AC-061**（exception）预外呼范围：指定供应商删除切换目标记录或供应商结果样例时清除此前反馈，不把旧成功/失败显示为当前选择已处理。新操作由当前原任务权限的运营/管理员选择准确record/batch/fileId/phone并确认，服务端同时核实租户任务和当前权限；旧对象已保存删除证据继续留在旧记录。tels优先于fileId/fileName，不按AND交集选择；仅实际fileId独占精确单号目标时可采用不同时传tels的taskId+fileId候选，共享fileId多尝试不能精确定位则不外发。result=0可能跳过目标，必须核skippedCallingTels；skipRetry不保证取消原生重呼，正式skip选择及在途能力仍待核，不默认新增远端撤回。〔confirmed_business_requirement〕

来源：inputs/source-index.json#SRC-110；inputs/source-index.json#SRC-107；inputs/source-index.json#SRC-116；inputs/source-index.json#SRC-118；inputs/source-index.json#SRC-119；inputs/source-index.json#SRC-120；inputs/source-index.json#SRC-121

未决边界：

- 真实供应商事件身份、话单秒挂字段/单位/枚举、导航三类覆盖/生效、同号再次受理/排重与原生执行权仍待核。
- 本方内部鉴权、精确关联/历史恢复、四元组额度原子预占及未知提交恢复、可信下载完成信号仍须工程验证；不自动关闭或降低既有缺口。
- tels优先非AND、共享fileId多attempt无精确选择器、skipCalling可能跳过、skipRetry不保证取消原生重呼，在途/并发仍待核；不新增默认skip参数或扩大删除范围。
- 应用/业务系统稳定登记、正式凭证、token显式tenantId与关联撤销后失效机制、tenant+app+operation+requestId精确作用域及历史兼容仍待S3/S4与工程核验。
- 各应用分别配置回调、未配地址禁止接口导入已确认；URL安全校验、正式报文/鉴权/ACK、地址变更后积压结果采用何时配置仍待S3/S4。
- 人工外呼方式与手工UI导入来源分开；坐席人工通话状态和处理结果不能覆盖客观接通证据、统计或秒挂判定。
- 预外呼继续跟进由当前坐席后续人工处理已确认；保留原预测溯源，原任务自动呼叫与后续人工拨号排他/停止能力仍待供应商与工程证据，不宣称已停止。
- SRC-119/120/121本轮S1规范化；G1/G2/G3均pending，旧门禁只历史。未批准真实调用、生产风险或05交付。

## US-009 管理多租户应用凭据与各应用回调地址

角色：超管；DCC、天网等各自应用的已鉴权调用方。触发：超管管理应用的租户关联与回调地址，或调用方明确当前租户申请业务身份
目标：应用与租户多对多，各系统分别使用应用凭据和回调配置；沿应用五操作保存名称、关联租户、密钥与地址。调用方须明确当前租户身份；管理权与业务权分离。
价值：各业务系统有独立应用凭据和回调配置，支持多租户授权；明确当前业务租户防止跨租户操作，所有应用接口来源均交付自身记录结果。

前置条件：

- 应用管理仅超管；应用token不赋予平台运营、坐席或管理员权限。
- 应用与租户多对多：每个业务系统使用自己的应用凭据与回调配置，应用可授权多个租户、租户可关联多个应用。建议获取token时显式选tenantId并验证有效关联，token固定app/tenant；来源由稳定应用登记识别，报文source若保留仅校验一致性，不能切换身份或回调目标。全部应用接口来源须先配回调才能导入；无接入应用的手工UI来源才仅平台查看，人工外呼方式不等于手工来源。
- 预外呼核租户/原任务及接口初始来源并沿任务坐席组；人工外呼核同租户目标坐席并按US-011，历史来源/配置不静默改写。

验收：

- **AC-017**（main）超管独立管理应用列表、详情、新增、修改和删除。应用与租户多对多：一个应用可关联多个有效租户，一个租户可关联DCC、天网等多个应用，各业务系统使用自己的应用凭据与回调地址。认证识别稳定应用，业务身份明确当前租户且须有有效关联，任务归租户不另绑应用。来源由稳定应用登记识别；报文source若保留仅一致性校验，不能换系统/回调。正式登记/认证及token字段为待核设计，原型仅合成。〔proposed_design_pending_scope_review〕
- **AC-044**（exception）本期应用列表/查看/新增/修改/删除均仅超管可访问执行，非超管含租户管理员和普通运营不能通过菜单、直接页面或管理调用越权，拒绝不改配置。应用身份发放的租户业务权不能代替管理权限；不自动新增启停、重置、收费或管理权限授予操作。〔confirmed_business_requirement〕
- **AC-045**（exception）应用凭据可针对已有效关联的租户取得该租户业务身份，不授应用管理或运营/管理员权。本方建议获取token时显式指定tenantId，核应用与租户关联后签发绑定稳定app和该tenant的token；缺失、无效或未授权租户拒绝，不默认首个/最近租户。导入body、原任务或指定坐席若与token租户不一致拒绝；切换租户需取得对应身份，不通过请求字段切租户。正式字段、时效、关联撤销和旧token处置待S4/工程核验，真实账号权限不改变。〔proposed_design_pending_scope_review〕
- **AC-053**（main）超管可独立进入应用列表，看到已保存应用的名称和appId及详情、修改、删除入口，并可发起新增；没有应用时显示空列表和新增入口。列表读取不创建、修改或删除应用。无管理权限的身份不能通过菜单、直接页面或模型/服务端调用读取该管理列表。〔confirmed_business_requirement〕
- **AC-054**（main）超管查看具体应用详情，准确显示名称、appId、密钥、已关联业务租户列表与已保存回调配置；查看不修改配置或密钥。不可用合成密钥保留必要提示，不存在/已删除目标不显示其他应用详情。回调覆盖该应用接口导入的全部业务来源；无接入应用的手工UI来源不因同租户有配置而回调。〔proposed_design_pending_scope_review〕
- **AC-055**（main）超管新增应用，填写名称、选择其关联的有效业务租户并配置本应用回调地址；支持多个租户，同租户也可关联其他应用。有效保存形成独立appId/密钥及关联，取消/失败不造成功。DCC/天网等分别使用自身应用及回调，未配置回调地址不得接口导入。应用自身无回调配置时是否允许先保存草稿及地址校验细节待S2/S4，不把保存配置等同于生产接入可用。〔proposed_design_pending_scope_review〕
- **AC-056**（main）超管修改应用名称、已关联租户与本应用回调地址，保存后列表/详情一致，appId/密钥保持。支持多对多，新增/解除关联应核有效对象和权限；已有业务、历史来源和租户归属不随修改静默迁移。取消、冲突、目标不存在或写入失败保持原配置，其他应用不误改。解除关联后的token、在途导入及积压回调处置待S4/工程验证。〔proposed_design_pending_scope_review〕
- **AC-057**（main）超管可针对具体应用独立发起删除并确认，取消不删除；保存成功后该应用从列表消失且不能再查看/修改或以其旧凭证获取新身份，合成模型使该应用已发身份失效。只作用选定应用，其他应用配置和身份不受影响；保存失败不先撤销身份或显示删除成功。已有业务任务、导入记录和结果/必要来源审计保留，不随删除应用级联删除。〔confirmed_business_requirement〕
- **AC-058**（main）应用页面简洁表达名称、关联租户、接入密钥与本应用回调地址，去掉日常运营不必要的技术解释及身份交换演示；多租户关联清晰可读，普通修改不重置密钥。来源采用稳定应用登记，具体配置字段待S3/S4，不增不必要管理菜单。管理权与租户业务权分开，原型合成凭据保留必要提示。〔proposed_design_pending_scope_review〕
- **AC-084**（main）应用新增/修改提供本应用回调地址并持久保存，重开/详情显示相同值；普通保存不重置appId/密钥，取消/失败保持原配置。DCC、天网等各应用分别配置地址，全部接口来源必须先配置才能导入；无接入应用的手工UI来源不发送。URL格式/安全校验、变更后积压结果取值时点与正式ACK仍待核，不编造地址或试发真实请求。〔proposed_design_pending_scope_review〕
- **AC-085**（exception）创建/修改允许应用与租户多对多，核每个关联租户真实有效且关系不重复；同一租户已关联其他应用不是冲突。DCC/天网分别保留自己的appId/凭据/回调配置。历史已有多关联及业务记录保留，不按已取代的一对一方案静默删除、合并或迁移；解除关联后的token/在途请求和历史接收目标处置待S4/工程验证，不默认首个租户。〔proposed_design_pending_scope_review〕

来源：inputs/source-index.json#SRC-110；inputs/source-index.json#SRC-074；inputs/source-index.json#SRC-087；inputs/source-index.json#SRC-115；inputs/source-index.json#SRC-116；inputs/source-index.json#SRC-118；inputs/source-index.json#SRC-119；inputs/source-index.json#SRC-120；inputs/source-index.json#SRC-121

未决边界：

- 应用/业务系统稳定登记、正式凭证、token显式tenantId与关联撤销后失效机制、tenant+app+operation+requestId精确作用域及历史兼容仍待S3/S4与工程核验。
- 各应用分别配置回调、未配地址禁止接口导入已确认；URL安全校验、正式报文/鉴权/ACK、地址变更后积压结果采用何时配置仍待S3/S4。
- 人工外呼方式与手工UI导入来源分开；坐席人工通话状态和处理结果不能覆盖客观接通证据、统计或秒挂判定。
- 预外呼继续跟进由当前坐席后续人工处理已确认；保留原预测溯源，原任务自动呼叫与后续人工拨号排他/停止能力仍待供应商与工程证据，不宣称已停止。
- SRC-119/120/121本轮S1规范化；G1/G2/G3均pending，旧门禁只历史。未批准真实调用、生产风险或05交付。

## US-010 共用接口按应用租户身份与外呼方式接收线索

角色：DCC、天网等已鉴权应用调用方；云呼叫中心。触发：已鉴权应用明确当前租户与外呼方式，携业务批次号发起新业务导入或原requestId技术重传
目标：同接口按稳定应用与明确租户接收预外呼/人工线索，新接口导入必传可复用业务批次号并逐记录保留原值供回调；requestId独立去重且完整内容包含该值。预测原任务组、人工指定工号、缺回调拒导入继续，手工CSV不新增该必填。 新增六项意向来源业务字段的准确接收/展示及完成快照关联，沿原应用和记录，不猜缺值或Smartcode语义。 留资时间保存/展示/回调原业务来源值，不由平台时间替代。 接口请求明确原业务类型，接收逐条固化并用于既有展示、对应表单和原应用回调。
价值：接入方可以明确选择预测任务或人工坐席承接，同时保持逐行反馈、来源回调分流与技术重传不重复处理。

前置条件：

- 应用管理仅超管；应用token不赋予平台运营、坐席或管理员权限。
- 应用与租户多对多：每个业务系统使用自己的应用凭据与回调配置，应用可授权多个租户、租户可关联多个应用。建议获取token时显式选tenantId并验证有效关联，token固定app/tenant；来源由稳定应用登记识别，报文source若保留仅校验一致性，不能切换身份或回调目标。全部应用接口来源须先配回调才能导入；无接入应用的手工UI来源才仅平台查看，人工外呼方式不等于手工来源。
- 预外呼核租户/原任务及接口初始来源并沿任务坐席组；人工外呼核同租户目标坐席并按US-011，历史来源/配置不静默改写。

验收：

- **AC-007**（exception）一次已鉴权外部调用方（DCC／天网）传入多客户，某条记录业务校验失败仅拒绝该条，其余有效记录继续；预外呼按原单手机号批次处理，人工外呼有效行按US-011保存并分配，不因单行业务失败整请求回滚。请求级身份、来源/外呼方式或技术重传冲突另按AC-080/050/051处理。〔proposed_design_pending_scope_review〕
- **AC-009**（main）外部调用方（DCC／天网）每条业务导入priority沿原规则必填，未传仅该条失败，不补默认值；本次值独立于R，且不强制继承旧批次。预外呼按保存priority排序并提交原供应商任务；人工外呼保存该字段但不因此进入预测任务队列、不透传预测号码导入或自动拨号。人工列表排序是否使用priority未新增规则。〔proposed_design_pending_scope_review〕
- **AC-010**（main）预外呼范围：外部调用方（DCC／天网）接口同tenant/原supplierTaskId/leadCode固定phone的真实再次业务导入用新请求级requestId；有效新行创建新记录/单手机号batchId并归同组。isNewBatch=true另开独立主(root=batch)，false/未传有主则新子挂最近已保存同组主，无主自动首主；不要求外部调用方（DCC／天网）提供上一批次，不仅因同组历史相同而拒绝。同ID同归一后完整内容技术重传返原逐行映射，不新建重交。〔confirmed_business_requirement〕
- **AC-012**（main）仅预外呼导入携带准确的原供应商任务ID taskId；自动提交供应商时直接使用，不做本地任务ID猜测、不采用统一预设任务。人工外呼按US-011分配指定坐席；复用现有人工流程、无需预测taskId为本方设计建议待范围审阅，不伪造预测任务或fileId。〔proposed_design_pending_scope_review〕
- **AC-047**（main）外部接口每次业务请求携requestId、多行定位及leadCode/phone/priority，外呼方式按AC-080。各系统使用自己的稳定应用身份和明确的当前租户，须有效关联；接收前核该应用回调配置，缺失按AC-086拒绝，人工外呼也不豁免。预外呼沿可选Boolean isNewBatch及新record/单号batch/root，人工不套主子字段。原app/tenant/业务来源及交付关系保存；source若保留只校验与应用登记一致，不以名称/R或报文自行换来源。〔proposed_design_pending_scope_review〕
- **AC-048**（main）仅预外呼新业务有效行按同tenant/原supplierTaskId/leadCode固定phone归组；true另开独立主root=batch，false/缺省新子挂最近已保存同组主，无主自动首主。最近主按本地主批稳定顺序，不按结果/priority/同号/子批，子不挂子，无需previousBatchId。应用与其登记来源仅用于鉴权审计及原记录回调，不加入预外呼业务组/失败预算键；同组不同应用各保留原接入来源，不按root决定子记录接收端。人工不使用本条主子规则。〔proposed_design_pending_scope_review〕
- **AC-049**（exception）仅预外呼新业务逐行核token租户、原supplierTaskId、leadCode及固定phone；改号、归属冲突或历史主关系不明拒绝/待核，其他有效行继续。isNewBatch必须Boolean，缺省false，不绕校验或重置正常任务轮次/失败额度。先核稳定app与token租户有效关联，按应用登记保存来源；source若保留仅一致性校验，非法/冲突不得改路由或默认DCC。应用/来源不分割既定业务组和额度，历史身份冲突不猜配。人工分支核同租户坐席，不虚构任务组。〔proposed_design_pending_scope_review〕
- **AC-050**（main）鉴权稳定应用、当前租户及其有效关联，校验外呼方式和分支对象后，按建议tenant+stableApp+operation+requestId作用域核完整归一内容。技术重传返原逐行接收/拒绝/待核结果和实际映射，不新保存、分配、提交或呼叫。预外呼missing isNewBatch归一false，返原record/batch/root，不重选新主；人工只返真实客户/分配。外呼方式、坐席工号与保留的source一致性字段纳入内容比较；不能改source切换命名空间。不同应用或租户各自隔离，正式键与历史回执兼容待S4。〔proposed_design_pending_scope_review〕
- **AC-051**（exception）在已鉴权tenant+stableApp+operation的拟定作用域内，同requestId完整有效内容不同拒整个重复请求，不覆盖原回执或新增记录/分配/批次/供应商提交/呼叫。比较实际方式、预测原taskId或人工工号、行定位及leadCode/phone/priority/R等；保留source时还核与应用登记一致。预测missing isNewBatch与false归一相同，true不同。跨租户/应用不得借ID复用另一主体回执，正式命名空间、完整摘要及历史兼容待S4。〔proposed_design_pending_scope_review〕
- **AC-080**（main）导入接口明确外呼方式（预外呼或人工外呼）；先核稳定应用与当前明确租户的有效关联及应用回调地址。预外呼按原任务坐席组，人工须指定同租户有效坐席工号按US-011。业务来源由应用登记识别，报文source若保留仅做一致性校验；不能用它换租户/系统或回调地址。全部应用接口来源均按原应用配置回调，人工外呼不等于手工UI来源。字段名/层级与身份传递为本方设计待S4。〔proposed_design_pending_scope_review〕
- **AC-086**（exception）应用未配置回调地址时不得接口导入，覆盖全部应用接入业务系统含DCC/天网和两种外呼方式；本方建议在新业务落账前统一检查，缺失则明确返回未配置原因，不新增客户/分配/预测批次/供应商提交，补配置后方可重新发起。不能先导入再排队等地址，也不回退到旧固定DCC地址或其他应用地址。正式错误结构、历史技术重传只读回执及地址删除并发守卫待S4，不把URL已填写当作已完成真实联调。〔proposed_design_pending_scope_review〕
- **AC-092**（main）多租户身份验收提案：同一应用可分别申请已关联租户A/B身份并各自导入；缺tenantId、未关联租户、A身份请求B任务/坐席或正文租户时明确拒绝且不新增业务。另一应用在同租户的请求与回调仍归其自身配置，不按报文source切应用。关联撤销、旧token及并发变更的正式响应/有效期需S4和工程补证，不默认首个或最近租户。〔proposed_design_pending_scope_review〕
- **AC-093**（main）全部应用接口新导入（预外呼和人工外呼）必须提供外部业务批次号，候选名businessBatchNo；先按稳定应用和token明确租户校验归属，再逐记录保存对应原值。同一app+tenant可在多个新业务请求中复用同一个业务批次号，不因重复批次号拒绝新请求；各次新业务仍使用独立requestId并沿原记录、预测任务或人工坐席分支处理。跨app或tenant的同值不得混合归属。请求级字段及逐行继承为本方建议，正式字段名、层级、长度、格式和错误结构待S4；原手工CSV不新增该必填字段。〔confirmed_business_requirement_with_contract_details_proposed〕
- **AC-094**（exception）业务批次号只是外部业务关联标识，不是技术去重键，也不替代平台batchId/rootBatchId或供应商fileId。按原app+tenant+operation+requestId拟定作用域比较完整内容时须包含businessBatchNo；同requestId同内容返回原逐行结果不重导/重派，同requestId改业务批次号属于冲突且不覆盖原记录。新业务使用新requestId可复用原业务批次号，但不绕过同线索固定手机号、原主子批次/任务规则或重置预测失败首次外共享2次。历史缺少业务批次号保留明确缺值，不从平台批次、fileId、R或最近请求猜造；旧请求兼容及准确错误码待核。〔confirmed_business_requirement_with_contract_details_proposed〕
- **AC-099**（main）业务系统导入客户接口API-001／DCC-RST-IMPORT在每条线索增加意向门店编码、意向门店名称、意向车系编码、意向车系、Smartcode和留资时间；本方拟逐行选填字符串intentionStoreCode、intentionStoreName、intentionSeriesCode、intentionSeries、smartCode、leadCreatedAt，原leadCode、phone、priority必填不变，预外呼仍核指定taskId，人工外呼仍核指定坐席。提供时按准确原应用、token租户、requestId/行及客户记录保存原字符串，编码保留前导零与大小写；缺值不猜造、不以计划到店门店或其他同号资料替代，Smartcode不推断语义。完整请求幂等内容包含所提供六字段，同requestId改任一字段按原冲突边界处理，技术重传不覆盖已保存来源信息；新requestId沿既有业务规则。同号/同批号复用不串不同导入记录。本次不修改API-002供应商报文，不把这些字段新增为手工导入必填；正式字段名、长度、空值与兼容契约待S4。 留资时间保存业务系统提供的原值，不等于平台importedAt/savedAt或呼叫开始时间；缺值不默认当前时间或从导入时间推算，格式、时区、精度及校验/兼容规则待正式契约。〔confirmed_business_field_names_and_UI_requirement_with_details_proposed〕
- **AC-102**（main）业务系统导入客户接口API-001／DCC-RST-IMPORT新增请求级必填businessType，一次新请求只导入一种业务类型；必须提交当前已验真token租户配置内启用的稳定业务类型编码，不取展示名称或由source、callMode、手机号、任务默认值推断。新业务缺失、无效、不属于当前租户或停用类型时明确拒收，不新增客户、不分配坐席、不提交供应商。通过后将原类型编码及名称快照按原app/tenant/request行/record逐条保存。不同类型分次导入仍可复用businessBatchNo，原leadCode、phone、priority必填及taskId/坐席分支不变；类型不加入既有线索/批次归组或失败额度键，不因换类型重新获得补提交次数。完成当前身份鉴权后，完整幂等内容包含businessType；同app+tenant+requestId同内容技术重放返回原受理回执，不重复保存/分配/提交，不因后来停用类型改写或重解释原请求；同requestId改类型冲突。原手工流程的业务类型选择沿用，历史记录不批量回填，不据此修改API-002供应商报文。正式码集合、字段版本、旧调用迁移及可靠持久校验仍待S4/工程核验。〔confirmed_scoped_product_change_with_engineering_contract_pending〕

来源：inputs/source-index.json#SRC-110；inputs/source-index.json#SRC-083；inputs/source-index.json#SRC-084；inputs/source-index.json#SRC-085；inputs/source-index.json#SRC-086；inputs/source-index.json#SRC-115；inputs/source-index.json#SRC-116；inputs/source-index.json#SRC-118；inputs/source-index.json#SRC-119；inputs/source-index.json#SRC-120；inputs/source-index.json#SRC-121；inputs/source-index.json#SRC-123；inputs/source-index.json#SRC-124；inputs/source-index.json#SRC-125

未决边界：

- 应用/业务系统稳定登记、正式凭证、token显式tenantId与关联撤销后失效机制、tenant+app+operation+requestId精确作用域及历史兼容仍待S3/S4与工程核验。
- 各应用分别配置回调、未配地址禁止接口导入已确认；URL安全校验、正式报文/鉴权/ACK、地址变更后积压结果采用何时配置仍待S3/S4。
- 人工外呼方式与手工UI导入来源分开；坐席人工通话状态和处理结果不能覆盖客观接通证据、统计或秒挂判定。
- 预外呼继续跟进由当前坐席后续人工处理已确认；保留原预测溯源，原任务自动呼叫与后续人工拨号排他/停止能力仍待供应商与工程证据，不宣称已停止。
- SRC-122与SRC-123纳入本轮正式S1/S2重验，G1/G2/G3均pending，旧门禁仅历史；生产缺口及分阶段验收边界保持。
- SRC-123新业务批次号必传/可复用及完成沟通快照方向已明确；字段层级与长度、历史缺值兼容、业务字段配置快照、保存/事件一致性、晚到话单、事件ID/版本/ACK继续待S3/S4与工程。
- SRC-124候选逐行字段名、长度/空值/旧调用兼容、显示绑定及与完成沟通快照的正式映射待S3/S4/S6核验；不擅改供应商API002，历史不批改。
- SRC125当前租户权威业务类型码集合、字段/旧客户端兼容、原表单版本与回调事件持久性待S4/工程核验；不虚构新供应商字段。

## US-011 将接口人工外呼线索分配给指定坐席待联系

角色：DCC或天网已鉴权调用方；云呼叫中心；被分配坐席。触发：共用导入接口选择人工外呼并指定坐席工号
目标：复用现有人工客户分配及待联系流程，按同租户有效坐席工号解析到账号/坐席身份，保存有效线索并分配；坐席主动联系才拨号。人工无需预测taskId、不调用预测号码导入为本方复用建议待范围审阅。
价值：接入方可把客户交指定坐席人工处理并获得应用回调，保存的来源与人工呼叫方式分离；继续跟进的草稿/保存/名单规则由US-012承接。

前置条件：

- 应用与当前token租户的有效关联鉴权通过，调用方明确人工外呼和坐席工号。
- 应用与租户多对多：每个业务系统使用自己的应用凭据与回调配置，应用可授权多个租户、租户可关联多个应用。建议获取token时显式选tenantId并验证有效关联，token固定app/tenant；来源由稳定应用登记识别，报文source若保留仅校验一致性，不能切换身份或回调目标。全部应用接口来源须先配回调才能导入；无接入应用的手工UI来源才仅平台查看，人工外呼方式不等于手工来源。
- 不变更既有账号权限或坐席登录要求；实际主动呼叫仍受本人分配、坐席/线路和客户状态守卫。

验收：

- **AC-081**（main）人工外呼行指定坐席工号，本方建议按租户及已有供应商实例关系查找唯一有效坐席，再解析关联账号/坐席身份；工号按原始字符串保存并保留前导零，不按显示姓名或跨租户同工号猜配。沿现有分配规则核账号及租户成员启用、有效坐席关联、坐席已启用/同步成功并接受新任务。工号缺失、无效、冲突或无可用关联时该行明确失败/待核且不自动改派，其他有效行继续；不要求坐席在线才保存分配，真实拨号前另核登录与当前可用状态。〔proposed_design_pending_scope_review〕
- **AC-082**（main）人工外呼有效行保存独立客户/导入记录、原应用/租户、source、requestId/行、线索/号码及最终priority后，按已核实坐席分配到既有待联系区域；本方建议无需预测taskId，不生成虚构供应商fileId/预测主子root，也不调用importTaskTel或自动拨号。priority沿原必填保存但不进入预测队列。坐席本人从待联系点击联系客户后才按既有人工工作台拨号；预测三天五呼、3类120秒/8类共享2次和预测任务精准删除不自动套用人工分配。〔proposed_design_pending_scope_review〕
- **AC-083**（exception）同一人工导入在建议tenant+stableApp+operation+requestId作用域技术重传，返原保存与分配结果，不重复客户/派发/拨号；同ID改方式、工号或业务内容报冲突，不能重传换坐席或改source另获次数。不同应用/租户各自隔离。原子保存分配及未知恢复待工程核验，未完成/未知保留原处理如实反馈；分配前复核目标，失败不误写他人客户。保存原app/tenant及已登记来源供本应用回调；人工方式不等于手工UI来源。〔proposed_design_pending_scope_review〕

来源：inputs/source-index.json#SRC-118；inputs/source-index.json#SRC-119；inputs/source-index.json#SRC-120；inputs/source-index.json#SRC-121

未决边界：

- 用户已确认人工指定坐席、预测沿任务组；人工免预测taskId与复用待联系流程属于本方设计建议待本轮范围确认。
- 坐席工号请求级/逐行层级，人工业务再次导入与既有分配关系、来源/方式变更的历史兼容、幂等精确键及原子持久化仍待S2/S4和工程核验。
- 应用/业务系统稳定登记、正式凭证、token显式tenantId与关联撤销后失效机制、tenant+app+operation+requestId精确作用域及历史兼容仍待S3/S4与工程核验。
- 各应用分别配置回调、未配地址禁止接口导入已确认；URL安全校验、正式报文/鉴权/ACK、地址变更后积压结果采用何时配置仍待S3/S4。
- 人工外呼方式与手工UI导入来源分开；坐席人工通话状态和处理结果不能覆盖客观接通证据、统计或秒挂判定。
- 预外呼继续跟进由当前坐席后续人工处理已确认；保留原预测溯源，原任务自动呼叫与后续人工拨号排他/停止能力仍待供应商与工程证据，不宣称已停止。
- SRC-119/120/121本轮S1规范化；G1/G2/G3均pending，旧门禁只历史。未批准真实调用、生产风险或05交付。

## US-012 坐席从振铃阶段填写并保存跟进结果

角色：当前处理该通话的有权客服坐席。触发：人工外呼或预外呼从振铃填写，结束后保存未接通、继续跟进或已完成沟通等明确处理结果
目标：振铃时可提前填写客户跟进表单；明确外呼客户未接且通话已结束时必须选择通话状态后保存，选项采用AliCti号码状态识别字典；选择继续跟进保留待联系。人工状态独立保存，不覆盖客观线路结果；本轮不扩呼入流程。 本次外呼结束且处理结果“已完成沟通”保存成功后，为原接口来源生成本次通话及本次已保存业务信息快照，交US-006回调；不使用跨通话聚合，不据人工选择伪造接通。 新增六项意向来源业务字段的准确接收/展示及完成快照关联，沿原应用和记录，不猜缺值或Smartcode语义。 留资时间保存/展示/回调原业务来源值，不由平台时间替代。 接口请求明确原业务类型，接收逐条固化并用于既有展示、对应表单和原应用回调。
价值：坐席等待时可记录，未接通也可完成本次跟进，需继续处理的线索不因保存记录从名单消失。

前置条件：

- 当前通话和客户记录已准确关联，当前坐席在原租户/账号/对象权限范围内。
- 主要适用于人工外呼与预外呼工作台；本轮不扩展呼入或赋予其他坐席处理权。
- 人工客户保留原坐席，预外呼接入当前坐席后继续跟进由该坐席后续人工处理；保留原预测关联，自动呼叫互斥能力仍待验证。
- 应用与租户多对多：每个业务系统使用自己的应用凭据与回调配置，应用可授权多个租户、租户可关联多个应用。建议获取token时显式选tenantId并验证有效关联，token固定app/tenant；来源由稳定应用登记识别，报文source若保留仅校验一致性，不能切换身份或回调目标。全部应用接口来源须先配回调才能导入；无接入应用的手工UI来源才仅平台查看，人工外呼方式不等于手工来源。

验收：

- **AC-087**（main）人工外呼客户振铃及预外呼坐席振铃时支持填写客户跟进表单。本方建议从准确通话对象建立后允许草稿编辑并持续暂存，接听/挂断和客户/坐席状态仍可见且可用，接通或结束时保留已填内容，不清空重开；正式保存等通话结束后执行，不在振铃阶段标记处理完成或释放通话占用。人工客户振铃与预外呼坐席振铃分开：后者可能客户已接通，坐席未接不改成客户未接。具体dialing/offered/answering覆盖与草稿恢复为待审设计，不扩呼入。〔proposed_design_pending_scope_review〕
- **AC-088**（main）明确本次外呼客户未接通且通话已结束时，客服坐席须在原跟进表单选择“通话状态”才能保存；沿用AliCti API-327号码状态识别编码的完整20项描述（16个编码），包含712拒接。715和183同码多描述须同时保存所选编码与描述，不合并丢义；坐席明确选择183“未知”是有效选择，空白未选仍不得保存，不能因客观结果未知自动选为183。人工状态、录入人/时间与处理结果独立保存，不覆盖供应商原结果、客户/坐席客观接通证据、时长、接通统计或秒挂判据。客户接通情况未知或已接通时不猜为未接，预外呼客户已接而坐席未接不套该客户未接必选规则；呼入范围不扩展。已填草稿在未接结束后保留到可保存界面，不自动关窗丢失。正式存储字段与接口契约待S3/S4核验。〔proposed_design_pending_scope_review〕
- **AC-089**（main）只有处理结果选择继续跟进且保存成功，线索才沿本规则保留待联系。人工客户保留原分配坐席；预外呼接入当前坐席后的继续跟进转该坐席后续人工处理，保留原客户/线索及历次跟进，不另造线索或自动拨号。本方建议兼容历史“需要再次联系”值，并保留原预测task/record/call/app/tenant溯源。人工后续与原任务自动呼叫不得并发；需核供应商停止/排他能力，未取得证据不宣称已停止或已可安全再次拨号。未接通不自动等于继续跟进。〔proposed_design_pending_scope_review〕
- **AC-090**（exception）保存跟进前复核当前坐席/租户/通话/客户归属及记录版本；未选必填处理结果或规定通话状态、业务字段校验失败、权限/对象变化或写入失败时，保留本次草稿和原名单状态，不假报成功、不提前移出待联系或误改他人线索。重复保存不新增重复跟进或重复待联系客户；保存与名单更新的原子/可恢复实现待工程核验。后到真实话单只更新客观证据，不覆写已保存人工通话状态或继续跟进决定。〔proposed_design_pending_scope_review〕
- **AC-091**（exception）未接通保存的通话状态条件按AC-088：明确外呼客户未接且已结束才必选，沿完整号码状态字典保存人工选择的编码与描述；空白未选与明确选择183“未知”区分。其余本方校验提案仍为校验处理结果及当时可获得的基础信息，不强迫填写必须经客户沟通才能获得的业务必填字段，也不虚构沟通内容。各业务表单的其他必填/可选清单及条件校验继续待S3/S6；校验/保存失败保草稿和原名单。未接通不默认继续跟进，只有选该处理结果才适用AC-089。〔proposed_design_pending_scope_review〕
- **AC-095**（main）仅本次外呼通话已结束、坐席本次处理结果明确为“已完成沟通”，且本次跟进及客户业务信息保存成功后，生成该次完成沟通回调所需的已保存快照。通用处理状态“已完成”不能代替“已完成沟通”；未保存、保存失败、振铃/通话中或其他处理结果不触发此完成事件。快照关联准确原应用/租户/记录及本次call，冻结本次保存的业务信息和处理结果/录入人时间，不取跨通话聚合、后续编辑或其他客户资料。坐席选择该处理结果不证明客户接通，不改客观话单、时长、统计或秒挂；原继续跟进去向不变，手工无接入应用来源不新增外部回调。保存与快照/事件的原子可靠性及正式快照字段为待核提案。〔confirmed_business_requirement_with_contract_details_proposed〕
- **AC-100**（main）在既有导入预览/检查区、客户详情、通话详情及坐席拨号/振铃阶段即可打开的跟进表单客户业务信息区，按“意向门店编码、意向门店名称、意向车系编码、意向车系、Smartcode、留资时间”展示准确本次导入记录保存的原值；选填来源信息置于必填业务信息之后，缺值显示“未提供”，长值可查看完整内容而不丢失编码。按原租户/应用/客户记录及本次call关联，不能从最近同号、其他导入批次、计划到店门店或当前编辑表单补猜；原导入意向只读展示与坐席本次跟进编辑值明确区分，后续编辑不悄改导入快照。保留原手工大弹窗、常驻导入入口和早填跟进交互，不为本次新增独立页面、技术说明、额外必填或门店/车系联动查询。历史无值也显示未提供，不批量改写。 留资时间显示本次原业务来源值，明确与导入/保存时间分开；缺值未提供，不默认当前时间，不悄改时区、精度或以导入时刻替代。〔confirmed_business_field_names_and_UI_requirement_with_details_proposed〕
- **AC-103**（main）接口导入后，客户名单、客户详情、准确本次通话详情及坐席拨号/振铃即可打开的跟进表单展示本记录保存的业务类型名称并保留稳定编码，按该原类型载入客户业务表单；不要求坐席为已确定类型的接口线索重新选择，也不允许静默切换原类型。原类型从准确app/tenant/record及本call取得，不从source、callMode、最近同号或其他批次推断。类型后续改名或停用不改写历史原类型或把旧记录切换到其他类型，若原业务表单暂不可用则说明原因并保留草稿，不能默认其他表单。历史无值显示未提供且不批量猜补。原手工导入已选业务类型的流程、单一线索编码、原弹窗与六项选填来源信息后置保持；不新增独立页面或业务类型配置功能。〔confirmed_scoped_product_change_with_engineering_contract_pending〕

来源：inputs/source-index.json#SRC-119；inputs/source-index.json#SRC-120；inputs/source-index.json#SRC-118；inputs/source-index.json#SRC-121；inputs/source-index.json#SRC-122；inputs/source-index.json#SRC-123；inputs/source-index.json#SRC-124；inputs/source-index.json#SRC-125

未决边界：

- 人工通话状态选项已按SRC-122收敛为API-327完整20项/16码，保存编码与描述并与处理结果分开；正式存储/接口字段、后到结果合并和各业务表单其他条件必填仍待S3/S4/S6。
- 未接必选限定已明确为外呼客户未接且已结束；未知/已接客户、预外呼客户已接而坐席未接不套用，不扩呼入。振铃草稿开始/恢复时点及保存事务细化继续待审。
- 已保存人工状态与跟进结果的外部回调字段、版本和ACK需在API-010重新核验；人工录入不是供应商状态。
- 应用/业务系统稳定登记、正式凭证、token显式tenantId与关联撤销后失效机制、tenant+app+operation+requestId精确作用域及历史兼容仍待S3/S4与工程核验。
- 各应用分别配置回调、未配地址禁止接口导入已确认；URL安全校验、正式报文/鉴权/ACK、地址变更后积压结果采用何时配置仍待S3/S4。
- 人工外呼方式与手工UI导入来源分开；坐席人工通话状态和处理结果不能覆盖客观接通证据、统计或秒挂判定。
- 预外呼继续跟进由当前坐席后续人工处理已确认；保留原预测溯源，原任务自动呼叫与后续人工拨号排他/停止能力仍待供应商与工程证据，不宣称已停止。
- SRC-122与SRC-123纳入本轮正式S1/S2重验，G1/G2/G3均pending，旧门禁仅历史；生产缺口及分阶段验收边界保持。
- SRC-123新业务批次号必传/可复用及完成沟通快照方向已明确；字段层级与长度、历史缺值兼容、业务字段配置快照、保存/事件一致性、晚到话单、事件ID/版本/ACK继续待S3/S4与工程。
- SRC-124候选逐行字段名、长度/空值/旧调用兼容、显示绑定及与完成沟通快照的正式映射待S3/S4/S6核验；不擅改供应商API002，历史不批改。
- SRC125当前租户权威业务类型码集合、字段/旧客户端兼容、原表单版本与回调事件持久性待S4/工程核验；不虚构新供应商字段。

