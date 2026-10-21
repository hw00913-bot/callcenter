# v1.1.0底座复用修正

先复制完整实际业务运行文件并隔离存储，再在原组件扩展接口字段及新增字典页，最后核对导航/图集。原型专属纠偏已由用户确认，需求AC不变。

字典/字段/填写三个模块在step-02内按约定接口分工；模型集中business-data，保留原CustomerFollowup保存链，不复制另一套系统界面。所有旧样式和菜单保留，只新增字典入口。验证必须实际打开角色与页面，不能仅对照颜色。

本次客服交互缺陷修正在step-02内完成：主字段与车系下拉、独立门店弹窗、模拟门店明细按统一API分工；实际浏览器覆盖打开即查询、筛选、选择/取消、条件改变及异常重试。用户已提供参考并授权修改，业务来源与AC不变。

当前确认覆盖：黄专经用户明确确认，意向车系只有一个单选字段。Step02修改默认字段及已存在本地配置兼容、单关联配置UI、单编码门店查询和保存，验证旧备选不再展示/提交、历史快照保留、切换后有效性与重选；不再验收多车系并集。

本轮修复已审计的4项实现缺陷，均归step-02，不改变单车系业务与模拟授权边界。配置模型/UI/迁移、汇总、异步带入按文件所有权分工；每项增加实际触发场景的回归用例，随后整合浏览器校验与最终复核。

SRC-157门店多选更正归step-02：root负责接口字段集合状态及主表单；picker负责复选暂存与筛选；followup/model负责存储回调、历史和同通集合汇总；上游需求先记录更正，保留旧输入和G3未冻结。无任意限选数量/跨车系查询；旧单店按一项兼容。

CHANGE-11105-query-condition-contract：用户采纳“填写方式：接口取数／取数接口／查询条件：车系取自字段”的方案。step-02在既有两个预置能力内增加研发维护的查询条件声明，由声明生成绑定控件并校验来源；保留depends引用和旧配置。超管仍维护名称、能力、租户授权与启停，不开放技术参数或通用编排。step-01和step-03复验入口、底座保护与现有图集，不改变业务AC或真实契约状态。

SRC158 / CHANGE-11106-generic-interface-dependency：本轮step-02实现通用接口字段依赖开关（默认否，旧门店关联保留），是时配置单上游接口字段、其返回取值字段与下游入参名，否时独立查询，门店返回当前租户全部可用门店。能力参数仍由研发适配，字段可配名称但未知参数不得静默成功。通用依赖图支持A→B→C，拒自身/循环/缺可见上游，逐级使旧查询和值失效并保留待确认；独立门店不受车系变更影响。保留唯一车系单选/门店多选/原保存与历史护栏。新增qa/check-business-dependency-config.cjs、qa/check-business-query-adapter.cjs、qa/check-business-generic-dependency.cjs回归；step-03复用更新后的SRC158需求草稿图集，G3及真实接口缺口保持。

SRC-158本轮最终更正：依赖要求分必需/可选，独立于客服字段必填。仅必需边要求业务分类包含显示上游；可选缺上游或空值省略参数查询，非空无效仍拦截。字段列表上游依赖显示无/必需·源/可选·源，选择关联时配置sourceValueKey→parameterName及required。前述“所有上游强制闭合”由本条覆盖。

CHANGE-11107-operator-guidance：本轮step-02只修复已确认能力的运营交互断点：字段/接口/查询条件分段、白话必需与可选后果、实时规则摘要及下一步；缺必需源提供显式补齐分类草稿动作，嵌套字段草稿保留；区分保存到字段库/加入分类草稿/保存分类生效，保存后给下一步；错误定位与编辑后清除旧提示，动态选择保留焦点滚动；客服缺源/重查提示包含实际字段名。保留原权限/租户/并发/dirty保护与所有业务逻辑，不新增真实接口/任意编排。验证运营首次配置闭环和受阻恢复，原949项回归；新增qa/check-business-operator-guidance.cjs。step-01/03复验原入口及既有SRC158图集，不改正式AC或冻结状态。

CHANGE-11108-followup-info-tabs：用户要求导入信息与填写信息并排页签减少高度。step-02在CustomerFollowup.form内实现本次填写/导入信息，默认填写；仅hidden切换原DOM，值/查询上下文/选择/必填校验不变，同通话保持选择、跨通话/身份重置。导入信息只读，确认匹配带入成功后显露填写页，晚响应仍沿原生命周期守卫；保存校验命中隐藏字段时先切填写页再聚焦。新增assets/css/customer-followup-tabs.css、qa/check-business-followup-tabs.cjs，试做AgentWorkbench.fail仅增加显露对应填写页的UI钩子，不改原41CSS/查询/保存规则。step-01/03复验原源及四视图，正式需求与接口缺口保持。


CHANGE-11109-review-alignment（SRC-159／160）：本轮仅将已授权的运营引导与填写／导入页签表现回填到需求评审视图。step-01只复核原底座164源、41原CSS、4个自定义导航及冻结启动输入，不变更业务；step-02将当前实现与SC-012／013、SEQ-014／015、PAGE-007／008核对，重跑相关运营及页签回归，不重复全部历史功能测试；step-03复用上游更新的业务／时序图，仅注入既有语义标记与来源摘要，不重算SVG几何。独立记录新轮证据；正式G3、API-015／016／018和生产草稿缺口保持。

## CHANGE-11112-dcc-contract-mock｜本轮计划

用户在“以DCC文档返回结构驱动独立模拟、完整分页后筛选车系、缺失字段不编造、验证失败／空集／错码／旧值／多门店”的具体方案后明确要求“往下推进”。继续SRC-155独立模拟授权；DCC与平台车系候选契约仅有部分文档证据，环境、鉴权、权限、同码、生产保存及草稿契约均未通过。既有8FUNC／34AC／5PAGE不增加；本轮演示不作为正式G2／G3或上线依据。

- step-01保护原v1.1.0的164源文件、41原CSS、冻结startup／CLAUDE／原输入快照与四个导航文件；只核对摘要和当前运行边界，不重置用户存量数据。
- step-02将DCC形状的虚构分页fixture放入`mock/dcc-business-data.js`，由`js/components/dcc-business-adapter.js`完成完整取数、返回字段归一和授权车系编码精确匹配。`BusinessData`增加显式选择的DCC模拟profile及演示场景；普通模拟仍为独立模式，profile／场景／epoch进入查询身份，禁止晚响应和跨来源存量值误认为已确认。DCC专用车系与门店编码全部虚构；体系和租户范围也仅是fixture设定，不能映射推断真实来源同码或权限。
- step-02沿原BIF、独立门店多选弹窗与保存链演示：完整多页成功、分页失败、完整空集、错误车系编码、旧值重新判断、多门店快照。缺区县／小组／业务类型／营业状态／售前电话时显示“接口未提供”，相应筛选禁用，不借用售后电话、系统启停、网店类型或小区填充。页面保留已填值，未查全不得新选或判失配，恢复仍按当前规则确认。
- step-03设置首页脚本依赖顺序与缓存版本，更新已有README、来源／字段映射／UI契约／开放项及变更追溯，核对四视图入口。现有业务与时序两图只验来源摘要、语义及宽屏可读性，不新增或重画图集，不修改工具包或冻结输入。两个可选交付仍为false，不另加说明书或标注。

新增文件的理由：现有`mock/data.js`是v1.1.0复用基线，通用`business-data.js`同时承担字典与权限；单列DCC fixture与适配器可隔离候选契约形状及分页解析，不把未知生产规则散入原组件。仅创建针对真实失败分支的2～3套QA，既有护栏回归按影响选择，原164源／41CSS必须全量核对。字段落点引用FLD-210～222及FLD-226，编码／当时名称保存沿FLD-216／217／229；候选原字段事实在`memory/field-map.md`按SRC-161／162补充，不新增业务功能编号。


## CHANGE-11113 本轮演示场景冲突修复

沿用SRC155独立模拟授权。step-01只读核对253文件终态、冻结启动/输入及41原CSS；原底座历史8项漂移保持并记录，不写原底座。step-02修改js/components/business-data.js及qa/check-dcc-business-runtime.cjs：DCC模式只按专用DCC场景，隐藏或禁用通用结果并解释，标准模式恢复原选项；运行时不能被遗留通用empty覆盖，保持通用来源故障/权限/epoch护栏。step-03更新入口business-data缓存、既有README/追溯和必要QA记录；四视图及两图只复核，不改几何。

验证：新冲突复现先修后验；3个DCC专项和受影响既有回归，120JS/174资源及保护摘要，实际浏览器切换DCC/标准并核对专用场景及禁用状态，确认后页异常与空集各按所选场景。没有新增FUNC/AC/PAGE、没有真实调用或G2/G3批准。S6～S9由总控脚本推进，逐步/两图/global证据绑定当前epoch；两个可选交付仍关闭。


## CHANGE-11114 本轮贯穿验证补齐

仅沿SRC155已有独立模拟范围补测试，不扩业务。step-01核对253文件起始终态和冻结输入、41原CSS及原source只读保护；step-02在qa/check-business-generic-dependency.cjs补已选门店→清空可选上游→无参查全→旧值重判，并新增qa/check-dcc-followup-flow.cjs用实际DCC fixture/adapter/BusinessData/接口字段/跟进保存组件走完整空集旧店处理、单车系多店同通快照保存及空数组替换；不得以桩的自有逻辑代替实际组件。若暴露实现缺陷先定位再明确最小修复，不擅改业务事实。step-03仅补既有README、验证结果与追溯记录，四视图/两图保持源及几何。

验收：3条已披露的贯穿覆盖空缺均有真实组件的当前自动证据，适当复验受影响回归及本地HTTP核心路径；没有真实调用或生产保存证明。依既有step-01/02/03记录新epoch，S6～S9由总控脚本推进，两个可选交付关闭。产品缺列首期取舍独立询问，未答复前不改当前界面。


## CHANGE-11117-prototype-dcc-v2｜2026-10-19 当前执行约定

来源为已分析的 SRC-163（DCC v2 净化契约）和 SRC-164（用户确认 ICE 数据源内全部可用门店）；用户明确“开始更新原型”。沿 SRC-155 授权做独立模拟，原 v1.1.0、冻结 startup／CLAUDE／inputs 不改，真实 G2/G3 及 API-018、生产草稿缺口保留。

v2 为 POST /third-api/clue/listDealerInfoExtend/v2、JSON。原始接口仅 sourceType（必需，NEV/ICE 大小写不敏感）、page、perPage、provinceName、cityName；其他原始入参不生效。平台统一 seriesCode 是本地适配入参，经显式虚构目录解析来源，非 DCC 原始请求参数。模拟始终显式传 page/perPage；默认、最大分页、空页语义、错误码及 result=1 成功判断仅为演示约定，真实环境待核。

响应顶层 result/msg/pageindex/pages/records/rows；共用8字段 dealerName/dealerCode/address/provinceName/cityName/countyName/tencentLongitude/tencentLatitude。ICE 六字段 dlrFullName/spokenAddress/carSeriesCn/carSeriesCnCarSeriesCode/testDriveSeriesCn/testDriveSeriesCnCode 可为 null，业务接受，不补假值。countyName 映射区县并在完整结果上本地筛选；小组/业务类型/营业状态/售前电话缺失占位，对应筛选禁用，不宣称上游支持 county 查询。

NEV 的默认非黑名单且 ARIYA 授权数据源范围业务接受；选 NEV 车系时在此来源内按已明确的演示编码关系精确筛选。选 ICE_A 或 ICE_B 则均返回 ICE 数据源全部可用门店，不用 ICE carSeries 字段建关系，也不把所选 ICE 编码填到门店授权车系列。独立查询按模拟授权来源集合读取 NEV+ICE，所有请求来源和分页完整才可选，任何部分异常无新候选，不据此判旧店失配。每来源 records 与完整行数一致性为 fixture 护栏，不代表真实生产补证。

车系仍一个单选、门店多选；条件/来源/epoch/权限变化先使旧查询失效，查全后按当前完整候选核对旧店。ICE 同来源换车系可保留仍有效门店；NEV→ICE 则旧 NEV 店待重选，未确认不能提交。原选填清空/必填/未接通、同通快照、导入确认和页签护栏保持。所有编码、名称、租户、关系、可用性与分页数据为虚构，禁止真实外联。

step-01 verify-only：核对起始254文件干净终态、原source只读保护、41原CSS和27冻结文件；四导航runtime同步后恢复。8项原source历史差异如实保留。
step-02 update：仅mock/dcc-business-data.js、js/components/dcc-business-adapter.js、business-data.js、business-store-picker.js及必要business-interface-field.js，4个既有DCC QA；保持普通模式。实际fixture→adapter→BusinessData→BIF→CustomerFollowup回归覆盖ICE两个车系同范围、切组重判、完整空集、同通多门店保存与后续空集合。
step-03 update：index脚本缓存、js/review-view-cache.js与js/delivery-nav.js同revision、既有README/related-systems与追溯；图集保留草稿与来源边界，当前显示不得将旧ICE精确关系说明当作当前规则。仅更新可变评审视图，不覆盖冻结输入。四视图浏览器实测，记录本轮epoch逐步/图集/global。两个可选交付关闭，不生成额外产品文档。
验证：全部既有20套Node回归、JS语法/本地资源/源保护；浏览器实际DCC模式NEV/ICE查询、区县筛选、多选确认和保存及四视图，console与请求检查。仅本地模拟结果。


## CHANGE-11118-local-series-text-store｜SRC165当前方案

用户原话“现在门店先不接入系统，采用自定义车系编码和名称的方式接入”，并明确选择“管理员维护车系，门店用原文本字段（推荐）”。本期默认客服线索表单由管理员维护车系编码/名称候选供单选；门店沿原plannedStoreName文本，外部车系查询/接口门店选择和联动暂缓。通用取数接口字典、授权、字段映射与原有历史保留，不擅自取消整个v1.1.1。SRC165已在上游S1物化、7US/34AC稳定ID保留；G2/G3未通过。

实施复用原普通select{id,label,businessKey}选项，车系名称和编码必填、同字段内唯一，编码为字符串不丢前导零；固定单选、每租户一个localIntentRole=series定义，可在分类关闭显示/分别设置必填，管理员维护选项。默认本地演示编码LOCAL-SERIES-001/002/003及纯虚构车系A/B/C，非真实映射。运行配置CustomerIntentProfile.mode=local-series-text-store在实际入口加载，generic未载该产品profile时保留原通用能力；不是测试开关。

本地车系用新稳定ID和marker，不将旧接口对象直接转字符串或自动带入，旧字段定义/快照保留；仅当前作用域做读投影，显式配置保存才落盘，原同名接口定义必要时加历史标注保证唯一。不清存储，不改其他租户，无法安全迁移的依赖/容量冲突提示修复，不默删自定义字段。分类原车系必填可迁移至本地车系，旧门店必填不转移；plannedStoreName原行为保持。

导入原始信息继续只读；仅明确确认后按intentionSeriesCode与当前本地businessKey唯一精确匹配带入车系，匹配失败不猜，不把导入门店写入plannedStoreName。同步导入按当前form/owner/会话/权限/handler守卫。车系保存optionId/当时编码/名称快照，改名不改历史。车系意向按同通新旧角色替换，空值清除旧车系/接口意向，计划门店文本和其他普通字段沿原汇总规则。

真实查询对接从本期客服路径暂缓；正式保存/回传和生产草稿未知项保留，本地模拟不证明G2/G3或开发交付。原v1.1.0只读，41CSS和27冻结材料不改，无真实外联。

step-01 verify-only：起始254文件终态clean、runtime四导航恢复、164原source本轮只读、41原CSS和27冻结材料保护。
step-02 update：新增config/customer-intent-profile.js；更新customer-business.js（profile/本地选项/幂等当前scope投影/快照marker）、customer-followup.js（单选编码名称/同步确认导入/同通聚合/历史）、business-categories.js（运营维护引导）。新增qa/check-local-series-config.cjs与qa/check-local-series-followup.cjs，现有20套generic/DCC回归保留，不用旧fixture冒充当前产品profile。index在model之前载实际profile。
step-03 update：实际入口/缓存、README、关联系统及当前草稿图集和追溯对齐SRC165，本期无默认DCC查选；旧外部对接资料作为暂缓历史，不改冻结输入，不误关生产保存问题。浏览器实际管理员改车系编码名称、客服选车系/填原门店文本/切页签/显式导入/保存详情；资源/JS/当前来源与两图/四视图复核。两个可选交付仍关闭。
验证按step-01/02/03和两图/global新epoch追加，旧pass只作历史；不修改正式版本或G2/G3批准。


## CHANGE-11119-existing-custom-fields-no-legacy｜SRC166

用户明确“车系配置采用现有自定义填写车系编码和车系名称啊，然后不用考虑兼容因为没有历史数据”。本期车系复用现有自定义单选选项及保存入口，不新增独立车系服务/维护模块。本期无初始存量，不纳入迁移、回填或旧接口单/多门店格式兼容验收；实际项目旧文件/演示素材保留，不删除数据。上线后新记录仍保存当时车系编码名称、导入只读及显式确认。plannedStoreName每通保存、详情及档案汇总沿原普通字段规则，不新增跨通配对/空文本清空。通用接口字典与上游配置仍由平台研发实现，具体模块/物理字段映射属工程工作；API018是内部复用逻辑职责，不需外部供方补证，未声称生产验证。原草稿工程核对边界不变；G2/G3未批准。原型已有防御兼容代码/测试仅为保留实现，不计本期迁移兼容范围。

本轮step-01 verify-only：257文件clean、原41CSS/27冻结材料/164source本轮只读及四导航同步恢复。step-02 verify-only：业务JS/配置/CSS与起始摘要不变，现有界面已满足复用code/name和原门店文本；重跑当前profile95+63专项，不要求存量兼容作为本期新增验收，不清演示存储。step-03 update：仅现有README/关联系统与当前草稿两图、两份来源记录、review-view-cache及delivery-nav同revision、mutable memory追溯；index仅缓存辅助脚本版本（若需），不改业务。图集保持源SVG几何；真实浏览器两图/四视图，当前错误0。三个step及两图/global按新epoch记录，S6～S9由官方工具推进，可选交付仍false。


## CHANGE11120｜审计两项实现修复

用户明确“修复发现的问题”。P1：未提交local车系仅保存option.id，管理员保留ID改code/name会使旧表单所见与保存快照不一致；分类关闭显示会静默丢已选值。必须在保存前按实际草稿所见的field ID、option ID及code/name、可见性核对，变化保留全部草稿、明确提示并提供重新选择/清空恢复；无关项变更不阻断，不用重渲染或旧DOM自动确认新配置。新元数据仅本地草稿使用，不进入保存/回传业务快照，保留会话/owner/权限守卫。

P2：配置编辑器直接退出（X、Esc、返回、取消及子字段返回分类）绕过现有遮罩未保存确认。统一用户退出入口：有改动先确认，继续填写保留同一草稿及焦点，确认放弃才关/回父；无改动、只读预览、保存成功或身份/租户/权限失效清理不误弹。遮罩只弹一次，旧确认不能关闭新编辑器或丢新输入/复活旧层。仅BC局部接管，不扩大全局PlatformUI关闭语义。

两项均现有FUNC029/030、SC012/013、SEQ014/015之实现缺陷，不新增US/AC/FUNC或业务模块。SRC166复用现有自定义code/name单选、原plannedStoreName文本、无初始存量迁移/旧格式兼容范围保持；通用接口能力保留，正式G2/G3不由本次模拟修复批准。旧v1.1.0、41CSS、27冻结材料和原始输入不改。

本轮step-01 verify-only：起始257文件clean、四导航同步恢复、164原source本轮只读、41原CSS/27冻结保护。step-02 update：customer-followup.js及必要workbench桥（先核准）、business-categories.js；新增local staleness与配置dirty-close真实回归，最小复用原local followup harness和operator QA（不削弱旧断言）。真实PlatformUI参与关闭测试。step-03 update：index相关脚本缓存、既有README/追溯和当前QA结果；两图/来源几何只读复核，四视图浏览器实际核验，业务代码之外不新增产品文档/标注。所有step/两图/global在新epoch实际检查后记录；官方推进S6～S9。


## CHANGE11121｜通话内表单版本固定，修复配置变更阻断收尾

用户在确认“管理员修改业务类型/字段配置可阻断当前话后完成并挡下一通”后明确要求“修复这个阻断项”。这是既有FUNC-029/030、SC-012/013、SEQ-014/015下的完整性实现缺陷修复。通话开始时以完整通话/客户/租户身份绑定整版分类和字段定义；无固定业务类型的通话也先固定目录，之后选择业务类型仍读同版。当前通话及话后直到保存完成，字段显示、必填、类型、选项code/name、依赖及分类名称均沿绑定版本，管理员的新配置仅后续新通话生效。绑定随该通话/现有本地草稿恢复，不新增生产草稿恢复承诺，也不做初始存量迁移。账号/对象/租户权限与外部接口来源启停/授权继续实时校验，不能借配置快照绕过。未绑定的档案编辑继续live配置保护，不能跨call/租户/owner复用绑定。

前轮CHANGE11120对未绑定编辑器的已选车系变化保护仍保留；本轮已绑定通话按整版快照保存，不再因管理员改码/改名强制客服重选。快照为配置及可追溯元信息，完整保留已填字段，不把私有草稿守卫混入业务values；回传fields/name/code须来自同一版。电话状态不因配置修改改变，完成保存后应真实退出wrap、可继续下一通。通话开始前原本无效的配置及用户自身必填缺失不在本轮放宽，实时权限撤销仍沿原规则。SRC166现有自定义车系code/name单选、原plannedStoreName文本，无初始存量兼容范围保持；旧原v1.1.0、41CSS、27冻结输入与startup/CLAUDE不改，G2/G3和生产核验不由本次模拟修复批准。

本轮step-01 verify-only：起始259文件终态clean，四导航runtime同步后恢复；本轮原source全量只读保护，41原CSS/27冻结不漂移。step-02 update：customer-business.js提供通话目录版本绑定读取及同版回传；customer-followup.js提供bindCallForm及同版填写/校验/保存和档案live边界；agent-workbench.js在来电/任务外呼/预览外呼/草稿恢复处接入完整身份绑定。BIF仅若实际调用链未同版才作必要最小修复。新增qa/check-call-form-version.cjs与qa/check-workbench-form-version.cjs，旧local-staleness测试仅按绑定/未绑定新边界细化不删旧保护；独立/tmp复核。step-03 update：index相关缓存、既有README/追溯与QA汇总；两图及来源只读复核，四视图与浏览器跨tab配置变更、保存详情和下一通按新配置实际走通。两个可选交付仍false，不生成新产品说明/标注/开发包。

验收重点：通话中新增必填/改必填/改类型/隐藏删除字段/普通与车系选项改码改名/分类停用改名均不得套到旧通；新通必须用最新版；旧通保存保留当时值及code/name；通话与租户/owner隔离、现有草稿恢复、实时来源授权拒绝、实际工作台完成与下一通均要有当前证据。


## CHANGE11122｜本次意向车系改为Mapping接口取数

用户明确“把车系的字段改成接入接口”。需求分析增量当前净化草稿为 `需求/1.1.1/分析工作区/runtime/mapping-series-design-draft.json`（读取时SHA256：fc237d7effe727e06fa1d1a333bdac58d91ebe0120cf3280a0167f0f37c613ee），来源SRC167/168/169；仅分析结论供本轮实现，不直接消费Wiki正文、不把partial升级为真实接通。沿SRC155已授权独立模拟范围继续本次具体来源更改，正式G2/G3仍pending。

当前本次意向车系为一个接口取数单选字段，引用研发预置Mapping车系查询能力(mapping-series)、条目d-mapping-series，无上游；字段库不再让管理员维护此字段候选options。统一code=String(relation_id)，name显示，原relation_id/media_car_series_id/car_state作为sourceValues来源快照保留。官方ID不能与媒体ID或DCC AE等编码互换；本次编码选择和media_id10/car_state1默认范围为实施假定待正式核对，不猜状态名、品牌或NEV/ICE。模拟请求使用GET相对路径、裸数组、无分页，仅合成数据，无fetch/主机/凭据。完全相同重复可合并，相同官方ID有冲突明确报错不任取，空[]与异常/部分返回分开。

门店继续原plannedStoreName文本，不启用接口门店/车系联动。导入原值只读，明确确认后仅按官方code精确匹配，不猜名称/媒体ID；未匹配保原填写。车系值保存code/name及来源资料并复用原保存和普通文本汇总；实时接口启停/租户授权及角色/对象权限不冻结。CHANGE11121整通话表单版本仍保持：旧通绑定旧本地select可沿原版收尾，新通读取新接口字段；新旧类型不在同通静默互转。历史原型素材保留、不做生产初始存量迁移。

本轮开工前用户已整理项目目录：canonical为原型/1.1.1-接口字段联动，旧原型试做为兼容symlink；README直开index、delivery-nav与review-view-cache的file协议处理及删除启动演示.command为本轮前已有4项漂移，均保留不回退。起点最终快照261文件，当前实际起点另存/tmp/live hash；不把这些既有修改当本轮破坏或伪称原始终态clean。原v1.1.0源全目录672、41原CSS、27冻结输入及startup/CLAUDE只读保护。

step-01 verify-only：保护原源与冻结材料，runtime同步后恢复4自定义导航，承接用户当前canonical/直开文件入口；S6拆分及本轮新epoch。step-02 update：config/customer-intent-profile.js、customer-business.js、customer-followup.js、business-categories.js实现新profile及当前字段承载；新增Mapping fixture/adapter，business-data.js按entry能力独立路由mapping-series及实时epoch，原standard/DCC不混；BIF只按当前实际series/store字段修导入提示，必要保存sourceValues护栏最小调整。新增Mapping adapter/runtime/profile QA；旧local系列QA仅测试harness固定旧profile以完整保留原断言，不修改实际新profile欺骗测试。agent-workbench.js无必要不改。step-03 update：index依赖/缓存、既有README和追溯/QA报告；需求草稿图集只按上游当前输出适配并记录source/provenance，不在原型重画，保四视图/宽屏/直开入口。无新说明书/标注/开发包。

验收：实际新profile+真实fixture/adapter/BD/BIF/CF走查候选加载、搜索、单选、清空、导入官方码精确匹配、异常保稿、正常保存/回传/详情来源快照；门店文本不受车系选择影响。租户授权/来源停复/竞态/无关DCC模式及通话版本保护，新通新版/旧通旧版均复核。所有步骤、两图/global在本轮新epoch记录后才收尾。


CHANGE11122实施收紧：有且仅有一个现有localIntentRole=series语义字段时，直接沿用其id、label、businessKey和enabled将当前定义改为Mapping接口单选，保各分类ref原fieldId/顺序/显示/必填，不新增“原自定义”重复条目；仅fresh scope无该字段才创建mappingIntendedSeries。多个semantic或未知ID冲突明确提示不猜。已绑定旧通话自含旧select定义，不受当前字段类型变更。此条覆盖前述初步新ID保留方案，落实净化草稿的稳定标识与原业务映射保留。旧dirty-close独立QA只将旧local场景harness显式固定legacy，保100断言；当前实际Mapping配置另以新profile/独立用例验证。


## CHANGE11123｜去除旧预置配置兼容迁移（2026-10-20）

用户指出旧关联警告是兼容原数据造成，前文已明确无历史数据、不考虑兼容，现直接确认“是的，现在去掉”。本轮为对SRC166无初始存量及SRC167接口车系范围的实现纠偏，不增加功能，不重做G2/G3或开发包。当前唯一默认方案为Mapping接口车系单选＋原plannedStoreName文本，默认库只含正常统计/售后/活动字段和当前Mapping车系，没有旧预置车系/备选车系/接口门店定义。

彻底移除旧local/Mapping profile自动投影、旧字段保留改名/旧依赖补齐/多车系转单选/旧单门店转数组/历史接口快照迁移及旧冲突提示，不仅隐藏文字，不以兼容专用QA要求保留生产死分支。当前配置与字典使用独立新key和显式schema，旧key不读取/不转换/不合并/不批量删存储；本版后续自定义字段、有效依赖、分类顺序显示必填、字典授权启停均照常保存且刷新不重置。普通字段同名ID不接管，不猜多上游/缺失参数的旧schema。

保留正常通用接口：显式useQueryConditions开关，必需/可选来源及完整参数映射、循环/类型/权限校验；多选接口字段严格数组，series单选正常对象，不能放宽错配置掩盖问题。保留当版businessFieldSnapshot编码名称及正常记录追溯/非空汇总，元数据显式声明dictionaryId/interfaceKind/selectionMode，移除按旧ID或对象/数组猜旧意向角色。来源启停、租户/对象/成员权限实时核验。

保留CHANGE11121进行中通话整版配置保护与创建时显式绑定、同身份合法会话/话单恢复及一致性检查；去旧无版本演示自动首绑/孤儿值升级。两份当版记录均缺配置版本属于损坏，保稿明确报错，不自动套当前配置；电话结束不因表单损坏无法操作。正常有效版本不被管理员后改强换，下一通读取新配置；初始当版坏配置仍可沿明确修复流程恢复，不是旧数据兼容。

step-01 verify-only：起始265文件终态clean，四导航同步后恢复；原source672/原CSS41/冻结27材料保持，沿用户canonical及直开入口，不回退目录和已删启动脚本。step-02 update：CB/config直接当前初始化及显式schema、BC移旧告警，CF/BD/AW定向移旧迁移与默认补齐，mock/customer-followup仅核对且未修改；根修app.js旧配置key引用检查和alicti-storage启动批量改写，BIF移旧schema/API兜底及单店兼容。普通编解码/正常压缩与真实业务保护不误删。QA提取current fixtures，旧兼容专用套明示退役至qa/retired/compatibility留历史证据，不再计本轮通过；mixed套保正常能力意图，当前profile有新真实回归。step-03 update：index相关缓存、既有README/决策/开放项/功能差异和当前QA报告；图集仅既有源只读复核，若当前草稿文字仍提迁移则只按既有无存量事实对齐，不在原型改SVG。四视图/实际浏览器本版初始无警告、配置新增保存刷新、查车系/文本门店/完成下一通，全部当前证据新epoch记录。

验收必须用旧key注入截图123/旧多车系/旧字典证明它们既不被读取也不被改写，新key直接正确默认，实际无旧警告/旧字段；不是只验证文案消失。保正常新custom字段/上下游依赖及错误校验、授权/禁用、Mapping查询保存来源快照、当前通话隔离及正常记录详情汇总；各当前测试实际运行，退役旧兼容不伪称旧数字全过。真实Mapping主机/默认范围口径仍待核，无生产联调；两个可选交付仍false，未生成开发包或批准G2/G3。


## CHANGE11124｜未完成通话缺表单的可操作恢复

用户截图同一待处理通话提示没有有效表单版本。根因是此前移除旧自动首绑后，保留下来的未完成通话无原版时只有拦截、没有明确恢复动作。本轮为已确认通话不中断和保稿原则下的实现缺陷修复，无新增业务事实或历史兼容。两个新通入口仍必须在首写前绑定；不得恢复旧配置读取、自动首绑、旧字段转换、全站清存储或替换健康通话版本。

增加仅本人同租户/同通话pending且真正缺失版本的“重新载入表单并核对”入口。先核对同identity的有效副本，确无原版才由客服明确操作采用当前有效配置；非空原业务值全部保留为待核对，接口值重新查选，未知/隐藏值明确展示处理，备注/处理结果/电话状态不变。缺原schema不得声称含义未变；现有版本损坏/跨身份/权限失效不能借此洗成新版本。持久写异常保留旧状态及原稿可重试，恢复成功后校验完成可保存idle并继续下一通。

step-01 verify-only：保护本轮起始终态、672源/41CSS/27冻结、四导航及两图源几何；复现missing-version恢复死路，确认新通未漏首绑。
step-02 update：最小修改CB/CF/AW（若有效副本检查需正常会话读，限既有key）；实现显式恢复、原稿待核对和权限/并发/持久写守卫；增加真实组件及工作台回归，保正常版本保护/新通和已知异常保存校验。必要fixture仅QA，不新增生产旧模式。
step-03 update：入口缓存与已有README/变更/开放项/验收/QA报告；浏览器实际恢复→核对→保存idle→下一通，同次备注/结果/原值不丢；既有四视图及两图只做源一致/必要导航复核，不重画。无新可选文档、标注或开发包；G2/G3、API/生产缺口保持。


## CHANGE11125｜解除分类对六个统计预置字段的强制引用

用户截图反对“六个预置字段须保留、只能关闭显示”的强绑定。这是v1.1.0本地实现保护过度，不是接口契约或新增业务目标；现有字段复用/按分类配置原则不应受统计反向约束。本轮解除分类引用限制，保默认字段库定义及其稳定类型/选项和当前Mapping单选约束，不增加字段库任意变更/删除范围。六个默认引用可逐项或全部移除再回加，保存/读取/刷新都不得补回或将scope判坏；可以只配车系或配置零个补充字段。当前字段顺序/显示/必填按分类独立；正常必需上游闭合与可选依赖校验不放宽。

step-01 verify-only：保护起始clean、672原source/41CSS/27冻结及四导航；复现UI三个锁和CB保存/读取两处强绑，确认上游无此新增约束。
step-02 update：CB移除hasLeadFields引用硬条件、BC移除须保留提示/移除按钮禁用/动作拦截。必要report-data/lead-report最小解耦：报表筛选及统计维度选项取保留的字段库定义，不再要求当前分类引用它，当前或旧通实际取值仍用各自通话可见字段/快照，未配置保持空、不写业务否/0；正向样本计数沿既有已知正向规则，不改指标公式。新增真实组件/表单/保存/回传/统计专项，原版通话不受配置删除影响、下一通只用新refs、可重加、零字段可保存、租户与依赖检查保留。
step-03 update：入口缓存和现有README/变更/开放项/验收/QA汇总；浏览器实际分类移除六项→保存刷新→原版通话收尾/下一通仅车系→回加，配置复原；现有两图/W/冻结原样，只核验来源与导航。无新接口/G2/G3批准、无开发包/可选文档/标注。


## CHANGE11126｜取值字段与下游入参的兼容校验

用户截图Mapping车系丙已选却报无有效车系编码，已用真实组件复现params={seriesCode:"910003"}；standard/DCC门店模拟各自只接受本来源目录编码，而旧校验仅检查series单选，允许不可用组合。用户明确“是的，开始修改”。本轮修复已确认通用接口条件配置/查询错误分类，不恢复门店默认字段，不新增真实接口或业务编码映射。

step-01 verify-only：保护起点clean、672原source/41CSS/27冻结/四导航及两图，确认实际传值与编码域不匹配，非客服未选也不是成功空结果。
step-02 update：研发预置能力元数据声明返回属性及下游条件的valueType/valueDomain与可读含义；series.code与store.code分域，Mapping官方ID/媒体ID/目录编码不混。CB按所选sourceValueKey、参数声明、类型和域检查（含候选可用性），不按字段名/前缀/样例值猜、不自动转换。BC配置即时提示不兼容原因，已有错误引用保留可编辑，不使整个scope不可读。BIF运行时先检查声明与实际supplied类型，不兼容不请求/不扩成无参查询；配置问题不再提示反复重试或请先选车系。BD直调坏参数给准确配置/编码错误，Picker显示相同明确原因，原值保留不作为有效值提交。独立查询、同源联动、必需/可选条件、有效版本/权限/异步/取消/空结果保持。域由研发预置，超管仍四项，不加技术配置；缺必要声明不能凭空声称兼容。
step-03 update：入口缓存、现有README/决策/变更/开放项/验收和QA结果；真实浏览器编辑不兼容旧配置/正确来源或独立查询恢复，模拟证明无错误候选/无参数降级/保稿。现有W/冻结/两图和业务编号不改，只核验来源导航，G2/G3和真实接口/生产草稿缺口保持；不生成开发包/可选文档/标注。

实现分工：metadata/runtime owner仅BD、BIF、picker及对应必要QA；配置owner仅CB、BC及对应必要QA，二者用CB.queryBindingCompatibility(field,source,sourceValueKey?,parameterName?)结构化ok/message/code返回协作。dependencyCompatible用于候选是否有可匹配属性，具体绑定按实际所选属性校验。必要原QA应保业务保护意图并更新新增声明预期，不通过删除断言回避错误。


## CHANGE11127｜当前删除范围与第三Tab（S6，待实施）

当前来源：`/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/需求/1.1.1/分析工作区/runtime/product-draft-delete-and-dictionary-tab-20261020/source-record.json`；SHA-256 `8d77f3f83fe6f98dc5a627caa370ac428305fb00e9089468e08dc1f747c2ab7c`，40件已核对。SRC172～176为用户直接范围指令，沿SRC155独立模拟；不是G2/G3或开发冻结。当前11FUNC／46AC／9SC／9SEQ／3FLOW／5PAGE／10ACTION，原只读inputs、startup、CLAUDE里的8项为初始历史输入，不改写、不当当前范围。

沿现step-01/02/03，以下为本轮当前拆分，旧轮次正文保留历史。S6只写事实/计划；本轮未实施、未验证。

| Step | 可观察结果 | Owner/文件 | 依赖 |
|---|---|---|---|
| step-01 | 起始source/冻结/导航保护可核 | root只读核对672 source、41CSS、27冻结及当前导航 | 无 |
| step-02 | 3对象删除与3Tab按使用/权限/CAS可操作 | helper+BD+字典页owner；CB+BC owner；root nav/app/index接入 | step-01 |
| step-03 | 新9SC/9SEQ图集与当前11功能入口/追溯相符 | root复用上游HTML/来源hash，维护既有README及导航缓存 | step-02 |

新增业务功能仅FUNC031～033；UI Tab不额外计数。真实断言及浏览器完成后由verifier记录fresh证据；当前33套2853/74场景540只作前轮，不继承新删除Pass。


## CHANGE-11129｜业务分类逻辑删除（SRC177当前规则）

用户明确确认逻辑删除方案并要求开始修改。本节覆盖此前FUNC033/US022/AC147～150中“有历史/当前通话/已有名单任务即不能删”的限制；分类从配置列表和新业务可选项移除，归档原row全部refs及必要依赖闭包的字段定义，保留当时名称/编码/结果，旧名单任务继续，本通话后沿开始版。字段和接口仍按实际/归档保留引用保护物理删除，无恢复/清理/迁移UI，不新建功能或AC，仍11FUNC/46AC/9SC/9SEQ/3FLOW/5PAGE/10ACTION。

已核对40件净化草稿：需求/1.1.1/分析工作区/runtime/product-draft-category-logical-delete-20261020/source-record.json，SHA256 3ca0ec0add52121340c5775142b320922b596733ccac264d89e8941f11c4b54f。当前事实及原5MD/3HTML供本轮消费；历史草稿/冻结inputs/startup/CLAUDE不改，G2/G3pending、正式S5～8stale与API015/ISSUE11113/11105缺口不变，仅SRC155继续授权模拟。

实现计划：scope可选retiredTypes归档（row/fields/deletedAt/deletedBy为原型内部设计，非已冻结生产表契约），保存和归档同次CAS；live catalog/list和新import只active，retired ID不能save复活。只读历史需授权且固定类型/实际对象上下文，capturing新通另核对既有batch/DCC具体item/phone/type或已建native/RAM同identity，伪造新callId/taskId不能把deleted类带回新业务；已有效bound最先使用原版。已有归档业务单独获取该row及闭包defs，避免改变其它active定义。删除检查category的业务refs仅影响提示，权限/上下文/原子归档失败仍保留；field/interface仍扫archive refs。


## CHANGE-11132｜通话快照不限制字段库删除（SRC-180）

自定义字段删除只核对当前业务分类引用（含隐藏/停用）及其他当前字段的直接依赖；历史已保存字段值、独立归档定义和完整本通/话后字段快照只作保留影响，不阻止删除字段库定义。删除不改写快照、业务数据或草稿；本通继续按开始版保存，后续通话按新配置。权限/目标版本、当前引用或必要快照无法可靠核对、提交失败仍保留原对象，不自动补默认。取数接口的实时资格与来源保留规则不变。

当前用户明确规则沿既有独立模拟授权落实。旧交付包和冻结来源保留原字节，旧包不代表本次更新规则；本次不补造全量G3批准。仍11FUNC/46AC/5PAGE/10ACTION。

step-01：核对SRC180当前规则、当前配置阻挡与快照影响分界；只读保原版本/冻结输入。
step-02：修改usage、字段删除提交复核及确认文案；验证历史各存储路径、零/false/多选、活跃通话/话后保存、分类归档、当前配置依赖、权限/并发及失败保留。
step-03：同步当前需求和图集/导航、旧交付包过期说明；浏览器使用独立HTTP模拟，不读取或清空用户file页面存储。


## CHANGE-11133｜自定义字段启停操作统一

用户反馈有的字段显示启用/停用、有的没有，现核对为UI将预置类型保护与生命周期混用，以及六统计字段额外禁停。沿已有字段启停语义统一所有字段的操作：已启用显示停用、已停用显示启用；预置类型/选项保护保留，当前启用分类显示的字段须先关闭分类显示，普通依赖及本通快照继续。无数据转换或强制改现存状态，无新增FUNC/AC或外部接口。

step-01核对当前界面与类型/选项保护边界；step-02修复BC行按钮与CB额外禁停，验证预置/接口/普通字段操作、状态持久化、当前分类阻挡及本通保存；step-03核对缓存、原四视图和原图源保持。


## CHANGE-11133追加｜引用入口合并

用户明确“上述查看引用的问题一并解决”。本轮在统一所有字段启停的同时，移除业务分类、自定义字段两张列表的独立查看引用；保留删除时的核对，受阻只显示当前配置引用及去修改入口，旧弹层、身份或租户变化不带入新的编辑。字典的独立权限和来源检查不变。


## CHANGE-11135｜继承 v1.1.0 平台选择和 AI 外呼切换

用户明确要求以 v1.1.0 为基线补上新增交互；来源 inputs/baseline-ai-platform-switch-20261021.json 和只读 v1.1.0 当前5文件。按原型循环、原型验证及完成前验证技能处理现有外壳的遗漏，不改接口字段11FUNC/46AC，不扩大AI业务或SSO。

- step-01 verify-only：核对 v1.1.0 两入口、账号→平台→租户顺序、未保存/通话/话后离开保护和源文件指纹；保留 v1.1.1 独立配置存储、超管字典权限与所有已确认业务规则。
- step-02 update：最小合并 js/app.js、js/components/demo-switch.js、assets/css/app.css、assets/css/auth-showcase.css、index.html；不覆盖 v1.1.1 的业务脚本/菜单/缓存/身份。验证普通/单租户/超管、两种登录方式、刷新/返回、未保存及通话/话后阻挡、空租户、外链不携带账号租户或凭证。增加真正入口状态回归，现有业务全回归。依赖step-01；prototype-builder/prototype-verifier。
- step-03 update：同步当前原型README/决策/验收和产品规格的基线继承说明，保留旧包；桌面1440/1920真实打开并检查入口、平台和租户点击、独立HTTP外链拦截、四视图及资源；本次不改业务图几何。依赖step-02；prototype-verifier/verification-before-completion。

失败保留原稿/当前通话并定位；不读取或清空用户file源存储。无真实外部业务API调用；AI按钮仅按用户指定基线做整页导航，不声明认证透传、目标授权或真实联调完成。
