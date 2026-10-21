# 项目变更记录

## 2026-10-11

- 创建项目基础框架。

## 2026-10-11 新正式 G3：S7 当前阅读投影
- 当前唯一工作区：prototype/。本轮执行依据为 memory/execution-steps.md 的 10 步计划及基线 ra-云呼叫中心-v1.1.0-原始需求重新分析草稿-676248563fbe9e8e；manifest 6d42db2b593b28e48c174e76218db68283c1076c17397bdb2736c6f5056aa94d，fingerprint 676248563fbe9e8e4daf04b88d37af45b92d8d653b4e1ba524acbcca0e3143d2。总控已明确 S6 完成且 S7 前置通过后授权本次变更。
- step-01：js/review-view-cache.js 的当前阅读 revision、index.html 的对应 helper query 均更新为 20261011-frozen1。helper 仍只识别当前同源 business-process、sequence-interaction、related-systems 三条精确 iframe 路径；历史路径与外源 frame 保持不匹配，保留原 MutationObserver/load 幂等逻辑。未重建工作区、身份、存储隔离或路由。
- step-02／03：执行官方 python3 tools/import_analysis.py publish-diagrams .，发布现有两图并由工具维护 config/requirement-analysis.json 的 diagramPublication；没有手写控制或验证状态。HTML 基线/fingerprint meta 与当前676一致，图的 SVG 原始字节、上游宽屏/缩放/折叠目录/下载交互保留；8原生SEQ为001～007及009，没有恢复退役008。
- step-03 关联系统：从既有归档 ZIP 的已复核 related-systems/index.html 提取阅读壳，恢复同名页面并换正式冻结来源/meta，移除 G3-pending 文案。按当前 systems 与接口事实显示 DCC 决定本次 priority、新业务主子请求及真实计次，平台鉴权/归一完整请求幂等和精确稳定 root/batch/call 关联、手工独立查看；每日查询衰减和旧 priority 继承退出。AliCti 调度/主叫选择与执行中撤销仍待核，不增加先删、等待最后一通、自动恢复或供应商能力保证。
- 接口逐 ID 对照：API-001／010 missing；002／003／004／006 partial；005／007／008／009 not_required，所有 real_call_allowed=false。尤其005已取消日龄能力、006仍精准单批删除 partial，不使用泛替换混同状态。正式图的 manifest 绑定由官方 diagramPublication 保持，related 另有 manifest meta。
- step-04～09 按计划为 verify-only，既有应用、锁源、CSV、request/isNewBatch 主子谱系、失败快照、每次结果、独立未可信 SIP 与精准删除业务代码保持；新证据由 prototype-verifier 在当前正式来源上采集，旧审阅结果不复用成新通过。step-10 product-input 投影由独立 owner 处理，本记录不修改其文件。
- 辅助实现检查：helper Node 语法通过；10项静态 VM 检查覆盖三当前URL更新、历史/外源保护及重复mutation/load不再replace。官方 verify-derived --stage s7 成功。两图全部SVG片段逐字节相等（业务14片段对应7正式FLOW/SC及上游fallback、时序8原生SVG）；入口150个本地资源及三阅读页脚本/样式引用存在。静态源码 SHA 对账在 /private/tmp/dcc-frozen676-publication-static.json，未作为浏览器可见性或整步pass证明。
- 完成落盘后停止业务写入，交主控 fresh 浏览器/模型及步骤门禁；未写 verification/circuit/workflow/stage-log、只读五facts、批准或新说明/目录。

## Step 10 · 现行产品评审输入重建

S7按新676248563fbe9e8e冻结基线与6d42db…manifest重建唯一product-input；17FUNC/62AC/21BR、5SC/8SEQ/5PAGE/20ACTION/96FLD完整，字段按本次物化语义重新绑定，弃用旧77序号。实际代码路径／字面符号及SHA可定位，上游analysis snapshot=3fb3c1…；外部API原missing/partial/not_required和合成边界、真实业务／运营待审保持。独立checker结构errors0，221项统一标本轮最终内容复验pending，不当prototype通过；当前生成SHA78f6bf16…48f3。旧输入已归档，未新增PRD、产品快照或05产物。

<!-- project-version-changes:start -->
## 当前项目版本变更（共用台账派生视图）

台账：/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/memory/project-versions.json

项目 alicti-c7a41f75 / 版本 v1.1.0 / 1.1.0

- CH-DCC-20261009 [analysis / accepted]: 2026-10-09用户确认业务基线替换；旧DCC演示退役，原型待重建；影响 SC-001, SC-002, SC-003, SC-004；来源 需求/1.1.0/source-index.json SRC-002～050
- CHANGE-PRODUCT-FINAL-VERIFICATION-20261010 [product / accepted]: 全部实现及实际产品输入已形成；验收状态对账后对最终内容开启独立验证轮次，历史单步证据保留且不复用。；影响 S7；来源 /Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype-v1.1.0/memory/change-log.md
- CHANGE-PRODUCT-DELIVERY-NAV-CONTRACT-20261010 [product / accepted]: 最终门禁要求统一导航脚本规范引用；修正入口query引用及日志模板残留后，对当前最终内容独立重验全部步骤。；影响 S7；来源 /Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype-v1.1.0/memory/change-log.md
- CHANGE-PRODUCT-REVIEW-DEFECTS-20261011 [product / accepted]: 用户暂不批准并继续审阅；实际复现同刻状态重放误降priority、CSV失败预览提交旧数据、未可信SIP阻断可信更新及输入切换陈旧反馈，既有范围内实现缺陷需S7修复后重新验证。；影响 S7；来源 /Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype-v1.1.0/memory/change-log.md
- CH-DCC-20261011-PRIORITY-BATCH [analysis / implemented]: 用户确认取消平台每日优先级衰减及相关每日查询，DCC按本次priority决策导入；按明确previousBatchId关联新批次，补逐行requestId重试幂等、父批次归属校验与根批次追溯。；影响 ；来源 /Users/huhaowen/Documents/Codex/2026-10-09/task/dcc-v1.1.0-reanalysis/runtime/change-impact.json
- CH-DCC-20261011-LEAD-GROUP [analysis / implemented]: 用户确认同线索仅同手机号多次导入，按租户/原供应商任务/线索编码自动归组，不要求DCC传previousBatchId；接口主批/子批标志的完整分支和缺省规则继续审阅。；影响 ；来源 /Users/huhaowen/Documents/Codex/2026-10-09/task/dcc-v1.1.0-reanalysis/runtime/change-impact.json
- CH-DCC-20261011-APPLICATION-IMPORT-UI [product / implemented]: 用户要求更新唯一原型：应用列表新增详情修改删除、简化密钥用途和技术说明、预外呼导入客户常驻；同步已确认主子批协议并修复既有缺陷，正式G3保持待审阅；影响 analysis, product, development；来源 prototype/docs/decisions.md#d-009
- CH-DCC-20261011-PROTOTYPE-REPAIR [product / implemented]: 2026-10-11 用户直接要求开始更新唯一原型并修复应用接入五项页面问题及已发现缺陷；本轮为审阅中实现，业务G3仍待确认，不生成正式产品快照；影响 S7；来源 /Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/memory/change-log.md
- CH-DCC-20261011-RECONCILE [analysis / implemented]: 用户SRC087明确要求应用列表新增详情修改删除及简化/常驻入口，SRC088要求完整回归对齐后推进；补齐上游独立业务操作和页面场景时序事实，旧冻结包只读保留；影响 ；来源 /Users/huhaowen/Documents/Codex/2026-10-09/task/dcc-v1.1.0-reanalysis/runtime/change-impact.json
- CH-DCC-20261011-SUPPLIER-STRATEGY-PRESERVATION [product / implemented]: 本轮最终对账发现实现投影把已退出的 API-007 三个字段误标实施，且 DCC 导入来源切换覆盖原有 isRepeat；按冻结边界定点修复并补验，不改变业务事实。；影响 S7；来源 /Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/prototype/memory/change-log.md
- CH-DCC-20261012-EXCEPTION-RESUBMIT-MANUAL [analysis / accepted]: 用户授权修订：DCC仅推线索、任务状态三天五呼、11类失败与秒挂各额外2次补提交、恢复原手工导入界面；等待间隔暂未确定，供应商同号重导保持待核；影响 ；来源 /Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/需求/1.1.0/分析工作区/runtime/change-impact.json
- CH-DCC-20261012-THREE-AUTO-EIGHT-MANUAL [analysis / accepted]: 用户在G1范围反馈中明确：禁呼/限呼/外呼黑名单3类依供应商导航降级等2分钟自动补提交，其余8类手动重提交；失败共享额外2次和秒挂独立额外2次保持；影响 ；来源 /Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/需求/1.1.0/分析工作区/runtime/change-impact.json
- CH-DCC-20261012-SHORT-HANGUP-RESULT-ONLY [analysis / accepted]: 用户明确秒挂只定义结果回传DCC，不再补提交重呼；撤销秒挂计划、额外2次与等待参数，失败3自动2分钟和8人工共享额外2次保持；影响 ；来源 /Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/需求/1.1.0/分析工作区/runtime/change-impact.json
- CH-DCC-20261012-SEQUENCE-GUARD-ALIGNMENT [analysis / accepted]: 时序语义复核修正失败提交执行权和额度在外发前绑定、手工统一priority填写不被预检查锁死；业务范围和G2接口事实保持；影响 ；来源 /Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/需求/1.1.0/分析工作区/runtime/change-impact.json
- CH-DCC-20261012-TRACE-SCOPE-ALIGNMENT [analysis / accepted]: 全局核验修正SC002详情的过宽故事追溯，与已确认仅US002的场景索引一致；保留同一业务范围与G2接口事实，并收窄旧已解决事项不代表新接口能力通过；影响 ；来源 /Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/需求/1.1.0/分析工作区/runtime/change-impact.json
- CH-DCC-20261012-INTERFACE-CONTRACT-REFINEMENT [analysis / accepted]: 补入完整删除接口与任务高级重呼适用性原文，形成DCC秒挂分类/人工命令/占用恢复可评审草案；新增证据和拟定接口事实须重新G2，不沿用旧指纹，既有业务范围保持；影响 ；来源 /Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/需求/1.1.0/分析工作区/runtime/change-impact.json
- CH-DCC-20261012-PLANTUML-LAYOUT-CORRECTION [analysis / accepted]: 静态复核确认SC-003人工分支连线穿过暂停/终止动作节点及DUE判定文字；修正规约布局并澄清FLOW-001互斥入口与结果分流表达，业务规则不变；S3及下游重新核验，新接口事实仍需G2；影响 ；来源 /Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/需求/1.1.0/分析工作区/runtime/change-impact.json
- CH-DCC-20261012-BUDGET-SCOPE-AND-EXISTING-TASK-PERMISSION [analysis / accepted]: 用户明确失败额度按租户+任务+线索+手机号累计、另开主批不重置；八类人工沿现有任务操作权限，授权运营/管理员可操作。更新US/AC及相关规则并从最早阶段重新核验，五场景范围保持；不改变真实账号授权。用户已解锁，浏览器待再核；影响 ；来源 /Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/需求/1.1.0/分析工作区/runtime/change-impact.json
- CH-DCC-20261012-PLANTUML-ROUTING-EXTENSION [analysis / accepted]: 修复SC001/005正式图穿框：项目内实现并独立验证本地PlantUML真实字形及源流程路由扩展；保留全部原节点、条件、分支、原字体、真实端口、主子业务及SRC109额度权限，未改变业务事实。S3及下游重新核验，G2/G3仍待实际确认，浏览器宽屏核验保留。；影响 ；来源 /Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/需求/1.1.0/分析工作区/runtime/change-impact.json
- CH-DCC-20261012-DEFER-DCC-MANUAL-FIRST [analysis / accepted]: 用户将DCC接收/回传移出本轮交付、应用接入及密钥token一并延期；手工导入与呼叫中心内部闭环优先，并明确指定记录删除本轮保留，由有原任务权限运营或管理员操作。保留历史规则/冻结包及共享批次、供应商结果、失败额度、秒挂本地三态；从S1按最早受影响事实重跑。；影响 ；来源 /Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/需求/1.1.0/分析工作区/runtime/change-impact.json
- CH-V110-20261013-LLMWIKI-S4-CONTRACT-REFRESH [analysis / implemented]: 按用户继续推进，将已核LLM Wiki官方接口条款正式物化为受控来源并补S4契约：公共HTTP接收/推送诊断、预测批次话单候选、CRN权重配置及适用边界。保留12功能/57验收/19规则和现有权限、共享额外2次、120秒、未知不盲重发。接口事实及来源引用变化须重核G2；不接受生产风险、不调用真实接口、不修改原型或旧05正文。；影响 ；来源 /Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/需求/1.1.0/分析工作区/runtime/change-impact.json
- CH-V110-20261013-S8-EVIDENCE-PREPARATION [analysis / implemented]: 按用户推进项目及实际答复暂未提供、继续准备验证材料，从S8推进供应商具体取证用例及本方派生模型/反例验证。12FUNC/57AC/19BR和463b2404接口事实不变，新G2保持有效；保留13high/2medium，模型不作为后端或供应商实证，不接受生产风险、不改原型/旧05或真实调用。；影响 ；来源 /Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/需求/1.1.0/分析工作区/runtime/change-impact.json
- CH-V110-20261013-S8-MODEL-COVERAGE-EXTENSION [analysis / implemented]: 继续准备验证材料：扩展保存重放、精准删除及53分片纯本地模型核验；不改变业务/API事实，不关闭生产缺口；影响 ；来源 /Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/需求/1.1.0/分析工作区/runtime/change-impact.json
- CH-V110-20261013-DCC-FULL-LOOP-RESTART [analysis / accepted]: 用户恢复DCC完整闭环为最高优先级：线索导入、结果回传、必要应用接入；撤销延期范围的当前审批，下游增量重跑，沿用最新异常规则和唯一原型。；影响 ；来源 /Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/需求/1.1.0/分析工作区/runtime/change-impact.json
- CH-V110-20261013-TIANWANG-SHARED-INGEST [analysis / accepted]: 本轮新增天网应用共用线索导入；用户明确天网只导入平台查看，DCC照常回传。补可信来源路由与跨应用请求去重建议，沿原业务四元组/权限/异常规则和唯一原型。；影响 ；来源 /Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/需求/1.1.0/分析工作区/runtime/change-impact.json
- CH-MANUAL-CODE-SOURCE-CORRECTION-20261014 [analysis / accepted]: 用户指出手工导入多出业务编码。复核SRC-101旧布局使用动态codeLabel，线索类原字段已称线索编码；将其固定显示为业务编码并与leadCode双必填来自Agent恢复方案的过度区分。回到S1核对AC-069及原型字段映射，暂不覆盖冻结包或宣称新G2/G3批准。；影响 AC-069；来源 /Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/需求/1.1.0/分析工作区/runtime/change-impact.json
- CH-V110-TENANT-CALLMODE-CALLBACK-20261014 [analysis / accepted]: 用户明确租户应用一对一、线索导入增加预外呼/人工外呼及坐席工号、应用保存回调地址；同租户共用应用按来源区分，人工指定坐席而预外呼沿任务组。回到故事范围分析，旧冻结包和原型保留。；影响 ；来源 /Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/需求/1.1.0/分析工作区/runtime/change-impact.json
- CH-V110-WORKBENCH-ALL-CALLBACK-20261014 [analysis / accepted]: 新增振铃跟进/未接通保存/继续跟进待联系；所有接入应用均回调，未配置回调地址不得导入。原SRC118变更继续保留。；影响 ；来源 /Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/需求/1.1.0/分析工作区/runtime/change-impact.json
- CH-V110-COMPLETED-COMMUNICATION-BUSINESS-BATCH-20261014 [analysis / accepted]: 新增已完成沟通保存成功后按原应用回调本次通话及客户业务信息快照；接口导入必传可重复业务批次号并逐次回传，requestId独立去重；同版S1起重验，门禁不自动批准；影响 ；来源 /Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/需求/1.1.0/分析工作区/runtime/change-impact.json
- CH-V110-INTENTION-FIELDS-20261014 [analysis / accepted]: SRC124新增意向门店编码/名称、意向车系编码/车系、Smartcode并要求界面展示；新增来源/字段与AC，当前S1/S2重验，旧门禁及下游保持历史。；影响 ；来源 /Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/需求/1.1.0/分析工作区/runtime/change-impact.json
- CH-V110-INTENTION-SOURCE-TIME-20261014 [analysis / accepted]: SRC124追加用户实际原话还要补充一个留资时间，六项来源字段同步原值保存/展示/完成回调；首轮五字段S1/S2报告保留历史，新源需重新核验。；影响 ；来源 /Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/需求/1.1.0/分析工作区/runtime/change-impact.json
- CH-V110-SIX-FIELD-DESCRIPTION-ALIGN-20261014 [analysis / accepted]: 当前SRC124六字段AC notes与场景notes仍有五字段措辞，修正当前描述并定向S1/S2重验；不改AC正文、原话或历史记录。；影响 ；来源 /Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/需求/1.1.0/分析工作区/runtime/change-impact.json
- CH-V110-IMPORT-BUSINESS-TYPE-20261014 [analysis / accepted]: SRC125用户确认对外导入增加请求级必填业务类型，按验真租户启用稳定码保存/展示/表单/回调；同requestId包含类型并保原回执。本次授权局部修改同步开发包及GitLab，不代表新G1/G2/G3。；影响 ；来源 /Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/需求/1.1.0/分析工作区/runtime/change-impact.json
- CH-V110-IMPORT-BUSINESS-TYPE-VIEW-20261014 [analysis / accepted]: S2官方模板未展开索引trigger/result，定点正文一致性检查实际失败；撤销刚才错误阶段完成，补齐同源阅读视图后重新检查，不沿用失败报告。；影响 ；来源 /Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/需求/1.1.0/分析工作区/runtime/change-impact.json
<!-- project-version-changes:end -->

## Step 05 · 2026-10-11 供应商策略保留实现修复

- 已在未修改前复现：现有策略1／2／3在选DCC接口、手工、再选接口时被改为0；恢复非0合法值后又被DCC专属步骤门禁拒绝。冻结API-002不自动调整isRepeat、BR-015继续待核，故归类为S7交互实现错误。
- 最小修改js/pages/cloud-task-workspace.js两处：删除setDccSource中的isRepeat赋0、删除DCC仅允许0的专属guard；保留makeDraft通用合成默认0、通用0～3枚举、编辑锁源、旧名单清理、后置逐行导入，以及DCC页面不提供该配置的既有UI。index.html对应脚本query改为20261011-strategy1，未改其他资源。
- 定点证据为/private/tmp/dcc-frozen676-strategy-preservation-before.json与after.json；同一79项真实脚本VM检查前58通过／21失败，修后79通过／0失败。覆盖1／2／3在三次来源切换中保持、合法策略通过、0默认、-1／4／非数值拒绝、既有编辑锁源，以及真实DccRuntime合成模型中同号两次新业务各留新record/batch、锁源拒绝和提交请求不包含isRepeat。before失败为定点复现，不构成本轮完成结论。
- node语法检查通过。workspace SHA a33ccb0e7f8559859addb9e740423d2ff2f67f00b0ee6fcd8360d8e190fbca03；index SHA fa77f93099243d26e8471722cb89889e0925428fc85353b20f326f846102b921。源码停止写入后交prototype-verifier补当前epoch的实际浏览器、步骤及全局门禁；builder未写验证日志、熔断状态、验收状态或流程控制，也未变更G3冻结事实。


## Step 10 · 退出字段投影与策略源 SHA 修正（2026-10-11）

- 将 FLD-055～057 的当前原型投影改为 API-007 `not_required` 的来源边界保留：移除误挂的 FUNC-006／PAGE-002 与失败下载代码映射，status/scope 为 `retired_source_boundary_only`。96 个字段的冻结定义、source/provenance、API 原状态、17 FUNC／62 AC／21 BR／5 PAGE／20 ACTION 及其他正文不变；不声明平台换主叫或主叫选择能力。生成器同步修正，避免重新生成时恢复误投影。
- 策略 owner 定点修复并停写后，产品输入仅同步 87 处既有 `cloud-task-workspace.js` file_sha256 为 `a33ccb0e7f8559859addb9e740423d2ff2f67f00b0ee6fcd8360d8e190fbca03`。index 入口 query 已由 owner 更新 `20261011-strategy1`、源 SHA 为 `fa77f93099243d26e8471722cb89889e0925428fc85353b20f326f846102b921`；输入无既有 index 文件映射，未新增投影。所有其他值逐值保持。
- 修正后输入及完整 corrected-before SHA：`c5efd1afbdcce1f2ecce356ddb1b5213aad15edd8aeb0989f697a4308060fd03`。独立 checker 当前 errors=0，218 项均为合成行为待本轮复验；全部 236 声明中 233 合成待复验、3 退出来源声明不晋级。等待 verifier 新 epoch 补验与 R-066/fresh proof 收敛，此时不更新 verified 元数据、不推进 S8、不代业务/运营批准、不进入05。


## 2026-10-14 · 手工导入客户弹窗局部恢复

- 用户直接指出实际导入入口仍为简化抽屉，要求恢复原弹窗交互，并将非必填字段后置。本轮按该明确授权做局部修复。
- 恢复居中弹窗、业务类型／批次名称、CSV 文件上传与粘贴、示例／字段说明、检查预览和仅有效行确认；必填称呼／号码／业务编码／线索编码／优先级在前，联系备注与 R 在最后。
- 手工记录分别保存原客户字段，详情可核对；不混用业务编码与线索编码，也不混用备注与 R。修复带空格数值检查有效而编辑器为空造成的确认失败。
- 输入失效、身份／任务权限、并发提交和文件读取守卫保留；当前 API／供应商请求字段、数值范围、同号策略不变。沿用唯一 prototype。
- 实际浏览器局部回归通过，证据见 memory/verification-evidence/manual-import-restoration-20261014.json。本修复未替换冻结输入，未晋级当前 04／02／05 状态，旧全局验证不扩展为本轮完整业务验证。

## 2026-10-14 · 五个任务记录页运营体验与单编码纠正

- 用户指出五页技术描述过多，直接授权修整运营交互：客户名单／导入异常／通话结果／DCC 回传／号码移除。主表先客户、批次、状态、原因与操作；技术原字段与模拟控制默认收起；详情先业务摘要。
- 保留唯一 prototype 与既有布局底座；入口名称统一为“客户与处理记录”。导入受理、实际通话和待确认分别显示；普通下载不误称保存成功。
- 移除确认明确显示手机号、业务批次号和时间，并绑定确认时记录；未知状态禁止重复移除，演示后续确认只沿原请求更新。重新回传仍是本地合成动作，明确不会再次呼叫。
- 同轮用户追问为什么新增业务编码。核对旧 CustomerBusiness 发现线索类原 codeLabel 已是线索编码；恢复时固定业务编码并再加线索编码是误读。线索类模板／检查表改为一个线索编码，内部兼容旧字段；其他类型按售后单号／活动编码显示，独立线索字段不擅自合并。旧双编码冲突报错，不改历史数据。
- 需求侧已登记来源纠正并由04官方流程失效 AC-069 关联范围；当前正式04回S1待重验，结构化需求尚未重建。原冻结包不改，本次不宣称G3或全局交付。
- 核验见 memory/verification-evidence/operations-ux-repair-20261014.json。


## 2026-10-14 · 合并任务通话结果入口

- 用户明确批准移除上下两处重复“通话结果”：汇总集中到运行监控，逐次通话与无话单呼叫异常统一到任务级“通话记录”。
- 新版任务的汇总、角标及明细共用既有结果来源；普通任务保留原话单、录音和四项汇总口径。无话单异常不计通话次数，未知与冲突不误计未接通，秒挂仍单独标记。
- 客户名单和客户详情新增“查看通话”，按本次导入记录精确筛选；查看全部、跨任务切换和旧results入口兼容已处理。DCC回传页链接同步到唯一入口；新结果刷新汇总和数量。
- 仅修改两份页面JS及入口缓存版本，不修改DccRuntime账本、供应商接口、冻结需求、历史快照或正式Loop状态。沿用唯一prototype，不新增说明文档。
- 独立12组语义检查、原手工导入12组回归及实际浏览器三种桌面宽度通过。证据：memory/verification-evidence/call-navigation-repair-20261014.json。


## 2026-10-14 · 修复导入客户误开任务看板

- 用户反馈任务列表“导入客户”同时打开“查看与管理”看板。移除导入前的任务详情跳转：任务行直接打开对应导入弹窗；顶部入口选择任务后同样直接打开；详情入口保持当前页签。
- 导入结果发生变化时原位刷新预外呼列表，保留筛选；名单数量只在读取有权任务记录成功时派生到显示副本，不写原任务对象或改业务状态，IVR列表沿用原逻辑。
- 修改 cloud-task-workspace.js、dcc-records.js、cloud-call-tasks.js 及 index.html 中这三个脚本的缓存版本；旧任务权限及导入规则保留。
- 当前源码11组定向验证、24组既有回归、实际浏览器9项路径及1440／1920／2560布局通过。见 memory/verification-evidence/import-entry-repair-20261014.json。
- 仅本地用户授权的交互修复；没有修改冻结基线或推进正式Loop状态。本轮未推送GitLab。


## 2026-10-14 · 移除独立 DCC 回传页签

- 用户明确执行已审阅方案：删除“DCC 回传”独立页签和通话列表常驻回传列；旧 delivery 页签入口回到客户名单。
- DCC 回传状态移入客户／通话详情；失败时列表提示并进入对应详情处理。导入异常和号码移除结果也保留各自通知的补送路径。
- 回传详情精确绑定记录、对象和版本；补送前后复核身份、任务权限、来源及内容，成功仅更新同一详情小块，保留日志展开和滚动。后台runtime未改，补送不增加导入、呼叫或删除。
- 当前展示仅兼容明确的历史DCC合成应用A/B；手工、明确天网及来源未确认记录不展示DCC区块或开放补送。不把api等同DCC，不按应用名称推断。正式来源模型未物化的差异见open-items。
- 仅修改 dcc-records.js 和 index.html 脚本缓存。独立15组及既有35组回归、实际浏览器路径及三种桌面宽度通过。证据：memory/verification-evidence/dcc-delivery-inline-repair-20261014.json。
- 原型仍是唯一prototype；本次未更新正式冻结、开发输出包或推送GitLab。


## 2026-10-14 · 统一预外呼任务列表操作

- 按用户明确确认的截图方案，普通预外呼任务固定显示“查看任务｜编辑｜导入客户”，顺序一致；不可用按钮置灰，悬停或键盘聚焦可读原因。
- 移除列表中“客户与处理记录”和“待再次联系”的额外捷径，能力仍保留在相应任务详情；导入客户继续直接打开导入弹窗。
- 草稿保留“继续创建｜删除草稿”，删除沿用确认；自动外呼列表沿用原渲染。查看／编辑提示与原动作守卫同源，另补历史只读禁止编辑守卫。
- 修改两份页面JS、任务样式和入口缓存版本。8组定向（含324种编辑条件）、11组独立语义、11组导入回归及实际浏览器6项路径通过；1440／1920／2560无操作区溢出。
- 证据：memory/verification-evidence/task-actions-ui-repair-20261014.json。仅本地定向修复，未推进正式Loop或需求冻结，未更新开发包、未推送GitLab。


## 2026-10-14 · 拨号与振铃阶段提前填写跟进记录

- 用户要求：拨打后即出现填单页面，不等待接通。
- 修改：人工dialing/ringing及预外呼offered/answering展示原沟通表单；保留身份边界和结束后正式保存；预外呼接听、禁重复、重试及设备提示位于表单摘要。预测坐席未接保留草稿进入话后确认，不自动关窗丢弃。
- 同一通话阶段切换只刷新摘要，输入节点、焦点和草稿保持；更新旧提示及脚本缓存版本。
- 文件：js/pages/agent-workbench.js、js/components/workbench-overview.js、index.html。
- 分类：用户明确要求的局部交互修复；最新需求尚未正式冻结，不推进阶段，不冒充完整坐席跟进闭环实现。


## 2026-10-14 · 未接通通话状态

- 按SRC-122，在原工作台话后表单增加“通话状态”。确认客户未接通的外呼结束后必选，沿API-327的20条描述，712为拒接；重复编码的不同描述分别保留。
- 人工状态、录入人与时间单独保存并在通话详情展示，不改写线路/供应商识别结果。收起、重开和刷新保留草稿；明确未接通时业务条件字段可留空，填写内容仍验证。
- 同步本轮需求增量，未改变冻结材料及正式阶段；源码与局部核验见memory/verification-evidence/workbench-manual-status-20261014.json。


## 2026-10-14 · 导入来源意向信息与留资时间

- 根据用户本轮追加，在原导入名单增加意向门店编码／名称、意向车系编码／名称、Smartcode、留资时间六项选填信息；原必填字段、导入弹窗和三步交互保持，新增列后置。旧名单缺列仍可导入。
- 六字段按文本原值保存，编码前导零和 Smartcode 大小写不改变；留资时间保持业务来源提供值，不以平台保存或导入时间代替。客户记录详情、本次通话详情和拨打／振铃即填写的客户业务信息区展示原导入内容，采用只读形式；历史缺值显示未提供。
- 客户业务快照带入当次通话；同号不同名单／导入记录分别保存。历史通话重建只读本通快照，不从当前名单或跨通话汇总补来源字段；计划到店门店不能补意向门店名称。长值可全文查看，输出按文本转义。
- 本地源码解析／存储／展示 11 组和工作台串联及未接通回归 10 组通过；修正选填来源资料区到业务表单之后并重跑。浏览器已核原导入检查、保存后客户详情及拨号即填单显示；仅当前桌面窗口定点核验，状态见 memory/verification-evidence/imported-customer-info-20261014.json。
- 本次为明确授权的局部合成原型修订，未推进正式 Loop、未修改冻结基线，未实现正式外部 API／回调或真实供应商调用，未推送 GitLab。


## 2026-10-14 · 应用回调地址补齐

- 应用新增／修改表单补回调地址，保存到原应用本地模型，详情展示同一值，列表区分已配置／未配置／地址待修正；允许先留空创建，页面提示配置后才可通过接口导入客户。
- 已有应用没有地址时继续显示未配置，不添加虚构业务系统。有效 HTTP(S) 地址可保存并重载；输入有误、存储失败或取消时保留原配置，普通地址修改不重置 appId／密钥。
- 本地合成接口接收仅对已验证的原应用身份检查地址；缺值或无效拒绝且无写入，同租户其他应用地址不能替代。手工导入、现有应用授权和管理权限保持。
- 8组应用表单／存储／守卫源码VM检查和原六字段21组回归通过；浏览器新增、修改保存及重开详情／表单值一致，页面错误日志为空；见 memory/verification-evidence/application-callback-ui-20261014.json。
- 本次仍是明确授权的局部原型修复，未新增原型目录、未推进正式 Loop／冻结，不代表真实回调传输或后端多租户实现，未推送 GitLab。


## 2026-10-14 · 接口导入业务类型局部补齐

- 用户授权：增加请求级必填 businessType、沿导入记录展示并回传；本次仅修改现有合成预外呼接收与展示，保持原手工流程。
- 按已解析租户查询已启用业务类型，逐行保存原类型/名称；缺失、无效、停用、行内类型矛盾拒绝新请求且不落记录。
- 请求指纹纳入类型；应用＋租户＋requestId 隔离。技术重放读取原回执，不重复导入；停用后只阻止新业务请求。历史来源应用不明的回执不猜测重放。
- 客户名单/详情、准确通话结果和已有交付演示携带原类型；填单按原类型显示；缺失历史类型不补造。AliCti 号码导入请求及主子批次/失败次数作用域不变。
- 验证：41 组定点回归、5 份脚本语法通过；实际浏览器名单/详情核验，错误日志为空。证据 memory/verification-evidence/api-business-type-20261014.json。
- 边界：正式人工外呼接口与完成沟通回调仍待实现；未改冻结输入或正式门禁。

- 定点复核修正：原业务类型已锁定但表单配置缺失时，显示“该业务类型的表单暂不可用，请保留当前内容并联系管理员”；不提示切换类型，保存拒绝并保留草稿、原通话与存储。新增反例后全套 41 组重跑通过；此次文案修正未重新拍浏览器截图。

## 2026-10-14T21:04:53.050031+08:00 · 本地客户档案归集修复（用户授权局部缺陷）

- 将本版接口与手工任务已保存客户纳入统一客户档案，先按当前企业、租户和坐席逐记录权限筛选，再按规范号码归组；无须完成拨打。
- 保留每条原始记录的任务、应用、请求、线索、业务类型、主／子批次、业务批次（已有值）及六项来源资料，不重写导入账本，也不复制进旧手工批次或全局通话数组。
- 准确关联且有稳定 callID 的通话只在档案临时投影；无话单事件不计通话，结果未知／冲突不补接通或时长，结果接收时间与真实通话时间分开。
- 任务客户名单／详情增加同一客户档案入口；档案逐条导入和通话详情通过原 taskId／recordId／resultId 重新授权。重复记录／结果标识、跨范围关联和坏账本保留原数据并拒绝歧义显示。
- 本轮修改：js/components/dcc-runtime.js、js/components/dcc-records.js、js/components/customer-directory.js、js/pages/customer-directory.js、index.html。35 组 VM 定点检查通过；实际浏览器待总控补验。未修改正式冻结输入或工作流状态。

### 2026-10-14T21:10:33.022950+08:00 · 客户档案浏览器复验返修

实际浏览器首次直接打开档案仅见9条旧客户，13条已导入新版历史行未纳入，首次实现未兼容旧行缺enterpriseId。现改为在已核任务／租户和供应商关联上下文内只读补旧行企业；旧通话结果须原事件企业与供应商任务精确匹配才补企业，显式冲突仍拒绝。另只读合并保存任务索引和独立版本记录，保留删除tombstone，不要求先开任务页。源码未改原导入账本。最新43组VM全量重跑通过；实际浏览器等待总控补验。

### 2026-10-14T21:15:03.056160+08:00 · 档案时间展示适配

仅在现有档案页将导入时间、联系时间和结果接收时间按北京时间显示为YYYY-MM-DD HH:mm:ss。沿用PlatformUI.timestamp；历史已存北京时间文本按原时区解释，空／无效时间显示未记录，不修改任何原始字符串。最新45组VM（原43组＋2组时间显示）通过。

### 2026-10-14T21:23:11.131991+08:00 · 只读归档两项边界复核修复

独立持久任务记录先选自身最新版本，再覆盖兼容索引；删除记录不受更高版本的活动兼容索引／旧运行目录影响。通话结果已有supplierTaskId时必须与原任务精确一致，旧缺企业兼容不得吞掉显式供应商冲突。新增3组反例，最新48组VM全量通过；此前浏览器成功观察及截图保留来源hash，最终reload待总控。


## 2026-10-15T07:00:23.339653+08:00 · 用户报告四处断点的局部修复

- 客户档案已有只读账本归集再次复验；本轮未复制、改写或混并原业务记录与通话。
- 补本地定时首启与刷新恢复，名单改按已准确受理的新账本判断；重验任务权限、资源、坐席与时段，首次保存后再发布。浏览器关闭不运行。
- 手工来源恢复向导内选择原未分配名单、明确确认缺失字段；新导入与原名单占用纳入可恢复事务，历史资料不挪改；接口来源不混手工名单。
- 失败补提交独立于结果补送：三类120秒、八类人工、同租户/原任务/线索/号码共享首次外2次；未知占用不盲发，秒挂显式禁止平台补提交。每次新attempt独立fileId，准确结果仍进原档案。
- 交叉复核修复供应商状态冲突、SIP跨attemptfile、原批次已分配统计与两处陈旧说明。
- 当前166组局部运行检查、8份脚本语法与浏览器名单/档案/定时/两次上限通过；875个历史受控文件未改。不是整版104验收、G3或生产交付通过。证据：memory/verification-evidence/four-breakpoints-repair-20261014.json（89b474bfae9ae4813ba4858cf1773a4e9f23f934b18f66fab21b3cc71452fefa）。


## 2026-10-15T09:25:31.427899+08:00 · 全面原型审计与当前开发包同步

- 用户授权通读当前原型并修复，再更新开发包和推送GitLab。已完整阅读161份活动源，覆盖导入、应用、任务、坐席、客户、通话、报表、管理、资源、样例及布局；875份冻结历史摘要未变。
- 修复应用多租户授权/回调及跨窗口写入；双方式接口、可复用业务批次、原应用路由及完成沟通冻结快照。手工/接口导入沿统一客户档案，预外呼原记录显式接席、早填、继续跟进归当前坐席人工。
- 修复持久化失败/坏数据覆盖、未完成通话恢复、额度未知占用、准确下载/导出及旧样例清理；接通与秒挂分类分别判定。
- 浏览器返修：受理后无启动入口、同任务对象保存清空、详情返回旧列表、已接通通话未进任务统计、已保存坐席姓名未展示；本轮均复验。
- 25套当前局部回归通过；114份JS语法通过，核心HTML本地引用完整。浏览器实测早填/完成保存/原业务批次回传待完善及列表2名单/完成1/接通1；应用与导入三种桌面宽度核对，控制台错误0。
- 证据：[全面审计](verification-evidence/full-prototype-audit-20261015.json)，SHA256 `31558b6492ff83d73b366963ca3d786acebea19fe66954d01184b0f33e7d7b34`。当前开发包继续使用唯一现有规格目录；最新阅读入口已消除早期“人工接口/完成快照尚未实现”的陈旧描述。
- 本轮为本地合成修复，不执行104条完整验收，不推进正式G1/G2/G3；真实HTTP、AliCti、业务系统ACK及生产未决仍待。GitLab完成状态以实际远端提交回读为准。


## 2026-10-16T20:01:06.922542+08:00 · SRC126 接口坐席选填、统一批次及状态局部修复

- 用户授权修复本轮讨论问题：人工接口坐席工号选填；缺省不分配，显式无效拒绝；所有新人工接口记录业务跟进初始未同步，旧回执/历史行不批量迁改。
- 原手工/人工API与预外呼账本批次在既有导入与分配统一查看，按原应用/租户/请求和任务保留，不复制存储；同业务批次号仍可跨请求复用。预外呼投影只读，补人工分配不能暗改外呼方式。
- 云呼叫分配、客观通话及明确业务跟进分开；有分配不推待联系，已接通不推已完成。本人明确确认联系安排才入平台待联系；外部实际坐席不覆分配归属。
- 外部通话本地合成桥按原记录/callId、原应用与租户准确关联；明确有版本处理结果才改业务跟进。任一在途/坏资料/歧义拒绝盲拨，本地保存水位未知时保留结果并待核对；不造反向完成回调。
- 已修浏览器发现的演示错误工号后改正重试、重复未分配文案及预外呼批次业务类型遗漏。现有演示工具可生成选填工号人工样例，默认详情折叠可演示DCC通话与跟进分离。
- 12套当前回归、114份JS语法、166本地引用及三种桌面宽度通过；875冻结文件与12份旧审计证据原摘要保留。新证据：[本轮修复](verification-evidence/import-assignment-status-20261016.json)，SHA256 `5f4944ed9c0a54e2f4b08f0415937541c51064e70b55ccb2d82613b35bb0189e`。
- 同步现有规格讨论包，SRC126覆盖与十条旧验收冲突边界明确；不推进正式门禁、不执行104条整版验收，真实DCC/AliCti接口及双方版本/并发/实例映射仍待联调。


### 2026-10-16T20:11:35.195308+08:00 · 本轮最终补验：客户档案只读外部通话

补齐准确原记录的DCC外部通话归档与详情，保留原应用/业务批次/callId/实际工号及独立分配、跟进状态；不复制存储、不造native身份或录音时长。本轮新增8项档案反例和原48档案回归通过，最终13套当前回归均通过；114JS语法/166本地引用/875冻结文件及12旧证据保护通过。浏览器已实测18800001002一条外部通话和三条原导入记录，详情保留原业务批次、DCC实际工号和平台分配李明，跟进仍未同步；控制台错误为空。

当前最终证据：[本轮修复](verification-evidence/import-assignment-status-20261016.json)，SHA256 `69c077060fd9c00d9bce508b80ad41e2ce7733c35ad258fc6eb39deee09632ac`。此前本轮12套阶段性证据原内容嵌入新证据prior_local_evidence，可追溯旧摘要，不回填其通过声明。当前结论pass_scoped_runtime_and_browser；正式门禁、104整版及真实接口未验证边界保持。


## 2026-10-21T10:22:51+08:00 · v1.1.0 登录与顶部平台切换入口恢复

- 来源：用户明确要求将登录 AI 外呼／云外呼入口加回，并在登录后顶部增加切换按钮，跳转 `https://hw00913-bot.github.io/prototype-demo/index.html`。
- 登录卡片恢复两个平台入口，云外呼为当前选中项并保留既有账号密码／手机号流程；AI 外呼使用指定外链。登录后顶部显示“切换 AI 外呼”，同页跳转该链接。
- 共用离开保护先检查未保存内容，再调用现有电话／通话上下文保护；不重置认证会话。更新修改脚本和样式的缓存参数。
- 活动源文件：index.html、js/app.js、assets/css/app.css、assets/css/auth-showcase.css。
- 当前语法、151 个本地脚本／样式路径、14 项独立 VM 检查及浏览器实际点击／往返会话／三种桌面宽度验证通过。证据：[本次局部验证](verification-evidence/platform-switch-20261021.json)。
- 本轮为用户指定的局部 UI 维护；正式阶段预检仍报告上游 analysis stale/unbound，不据此推进或改写工作流、审批、冻结需求及其它版本。


## 2026-10-21T10:30:44+08:00 · 用户纠正登录顺序：账号 → 平台 → 租户

- 用户明确纠正前条实现：必须先登录账号，再选择 AI 外呼／云外呼，最后选择租户。前条登录表单平台入口由本次实现取代，原记录保留。
- 移除登录表单的平台链接；账号密码、手机号及演示快捷登录认证后统一进入独立平台选择页，三步进度条显示“账号登录／选择平台／选择租户”。
- 两个平台均先选择租户；单租户账号不自动跳过，超管不自动沿用上次企业。选择云外呼租户后才进入云工作台；选择 AI 租户后跳指定外链，不提前激活本地云工作台。顶部外链及离开保护沿用。
- 待选择阶段清空租户、企业、业务域；支持重新选择平台与刷新恢复，旧中间会话及角色不匹配的快照返回平台选择；旧正常云会话继续恢复。演示工具文案同步顺序。
- 修改源：js/app.js、js/components/demo-switch.js、assets/css/auth-showcase.css、index.html；脚本缓存摘要已更新。
- 最终62项独立VM检查、浏览器完整流程及单租户演示账号、两份JS语法和151本地路径通过。证据：[本次顺序修复](verification-evidence/login-platform-tenant-order-20261021.json)。本地局部维护，不推进正式阶段或修改冻结输入。


## 2026-10-21T10:43:25+08:00 · 用户授权提交 GitHub main

基于 callcenter/main 最新 a5ae053，在隔离临时 checkout 提交并普通快进推送 5 个本轮源码文件；提交 [795ab3b](https://github.com/hw00913-bot/callcenter/commit/795ab3bb2e474457637cc773cc6df392a53ffbf0)。GitHub main 回读为同一完整 SHA。发布源码与已验证本地源码一致，index 保留既有远端部署路径。原工作区及之前目录迁移保留。Pages 构建状态未作为本次提交结果声明。证据：[发布记录](verification-evidence/github-main-publish-20261021.json)。
