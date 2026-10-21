# 验收映射

当前46条AC、11功能、9SC/9SEQ、3FLOW、5页面、10操作；初始34AC/8功能/7操作是只读历史输入。本轮15项在当前独立模拟范围通过；实际模拟证据不替代真实接口/G2/G3。

| Requirement ID | Requirement | Acceptance Criteria | Verification | Status | Decision / Reason | Source IDs | Step IDs |
|---|---|---|---|---|---|---|---|
| R-001 | 本地宿主及状态模型 | 本地无真实调用，角色/租户、接口车系单选、原门店文本、来源与通话版本及快照符合试做规则 | 模型断言及浏览器 | Pass | SRC-155模拟范围 | LOCAL | step-01 |
| R-002 | 新增业务数据接口条目 | 超管用自定义名称、预置取数能力、可用租户和启用状态建立接口条目，系统生成稳定内部标识，供授权租户字段引用。 | 浏览器及模型，核对对应SC/SEQ | Pass | 仅模拟试做、非生产验证 | FUNC-023, AC-105, AC-106, AC-127, AC-131, SC-008, PAGE-006, ACTION-026 | step-02 |
| R-003 | 编辑业务数据接口名称 | 超管修改已有条目名称并保存，稳定标识和引用保留；条目已被引用后固定取数能力，更换能力需新增条目再调整字段引用。 | 浏览器及模型，核对对应SC/SEQ | Pass | 仅模拟试做、非生产验证 | FUNC-024, AC-128, AC-131, SC-009, PAGE-006, ACTION-027 | step-02 |
| R-004 | 启用业务数据接口条目 | 超管把指定条目设为启用，后续查询仍受租户授权约束；来源恢复不自动使未提交旧值有效。 | 浏览器及模型，核对对应SC/SEQ | Pass | 仅模拟试做、非生产验证 | FUNC-025, AC-129, AC-131, SC-010, PAGE-006, ACTION-028 | step-02 |
| R-005 | 停用业务数据接口条目 | 超管把指定条目设为停用，停止该来源的新查询和新选择，保留条目、配置、历史及未提交值显示；无效旧值不能继续提交。 | 浏览器及模型，核对对应SC/SEQ | Pass | 仅模拟试做、非生产验证 | FUNC-026, AC-130, AC-131, SC-010, PAGE-006, ACTION-029 | step-02 |
| R-006 | 开放接口条目的租户使用范围 | 超管勾选并保存接口条目可用租户，使新增开放的租户可在条目启用时引用和查询；保留原有成员权限边界。 | 浏览器及模型，核对对应SC/SEQ | Pass | 仅模拟试做、非生产验证 | FUNC-027, AC-107, AC-108, SC-011, PAGE-006, ACTION-030 | step-02 |
| R-007 | 撤销接口条目的租户使用授权 | 超管移除并保存指定接口对某租户的使用授权，仅停止该接口与租户的新查询和选择，保留历史与配置，未提交值显示不可用。 | 浏览器及模型，核对对应SC/SEQ | Pass | 仅模拟试做、非生产验证 | FUNC-028, AC-107, AC-122, AC-123, SC-011, PAGE-006, ACTION-030 | step-02 |
| R-008 | 保存分类字段与Mapping车系接口配置 | 直接初始化当前Mapping接口单选＋原门店文本，初次默认13项/线索7项；持久删除或空scope不补；不读转并旧预置，无旧兼容告警；当前正常字段／依赖／分类flags及权限持久化。 | 浏览器及模型，核对对应SC/SEQ | Pass | SRC167～169、SRC171当前草稿；仅模拟试做 | FUNC-029, AC-109, AC-110, AC-111, AC-120, AC-121, AC-124, SC-012, PAGE-007, ACTION-031 | step-02 |
| R-009 | 保存Mapping车系与原门店文本 | 当前Mapping车系单选，仅官方ID作code及name展示，显式导入按官方ID精确匹配；保存当时值及白名单来源，门店原文本无联动；实时授权与整通话版本保护保留，无初始存量迁移。 | 浏览器及模型，核对对应SC/SEQ | Pass | SRC167～169、SRC171当前草稿；仅模拟试做 | FUNC-030, AC-112, AC-113, AC-114, AC-115, AC-116, AC-117, AC-118, AC-119, AC-125, AC-126, AC-132, AC-133, AC-134, AC-135, AC-136, AC-137, AC-138, SC-013, PAGE-008, ACTION-032, PAGE-009, PAGE-010 | step-02 |
| R-010 | 业务图集草稿复用发布 | 只读复用上游草稿图形，保留来源及草稿标识；注入导航和对应语义标记；浏览器能实际阅读，几何不改。 | 浏览器实际可见 | Pass | 仅复用草稿及系统边界 | LOCAL | step-03 |
| R-011 | 时序图集草稿复用发布 | 保留当前上游时序消息和图形，注入来源、导航及语义标记；长图可读，不把API缺口提升为已验证。 | 浏览器实际可见 | Pass | 仅复用草稿及系统边界 | LOCAL | step-03 |
| R-012 | 关联系统边界说明 | 明确本地模拟平台与权威数据提供方、研发预置和配置引用的职责；不补endpoint/鉴权；四核心视图当前宿主切换无断链。 | 浏览器实际可见 | Pass | 仅复用草稿及系统边界 | LOCAL | step-03 |
| R-013 | 删除未使用取数接口条目 | super全局；查全当前实际factory/持久scope/业务/来源reserve，未用确认删除，位置阻挡、CAS/失败/刷新不补、不cascade | 真实helper/BD/UI/浏览器 | Pass | SRC172/176，内部删除非真实接口批准 | FUNC-031, AC-139, AC-140, AC-141, AC-142, SC-014, SEQ-016, PAGE-006, ACTION-033 | step-02 |
| R-014 | 删除自定义字段并保留通话快照 | 当前分类/字段依赖须解除；历史已填值、完整本通和归档快照不阻删除，删后历史照常读、本通照常存 | 真实CB/BC/CF及模块重载/浏览器 | Pass | SRC173/175，库存不冒实际使用 | FUNC-032, AC-143, AC-144, AC-145, AC-146, SC-015, SEQ-017, PAGE-007, ACTION-034 | step-02 |
| R-015 | 业务分类逻辑删除 | 分类逻辑退出新业务、旧任务归档继续；独立归档不锁当前字段库，取数接口所需来源继续保护 | 真实helper/CB/BC/浏览器 | Pass | SRC174，动态任务模板不锁lead | FUNC-033, AC-147, AC-148, AC-149, AC-150, SC-016, SEQ-018, PAGE-007, ACTION-035 | step-02 |


CHANGE-11109评审视图对齐：R-008／R-009的已授权表现分别由SRC-159／160补充说明，原AC与FUNC保持；R-010／R-011按最新上游草稿重验，旧pass只作历史，本轮fresh证据见verification-log。字段库入库与分类绑定另存为同一FUNC-029内部两个保存时点；取消或失败的分类不回滚已入库字段，不新增外部API。

## CHANGE-11112-dcc-contract-mock 本轮重验

原上表Pass为历史证据，已在历史日志保留；当前唯一验收表均改为Pending，待新epoch核验；不新增Requirement ID／FUNC／AC，以下引用既有R。SRC-161／162只证明候选文档及字段形状；虚构fixture和当前用户实施指令沿SRC-155模拟边界，不证明真实接口接通、车系同码、生产权限或保存。

- **R-001／step-01、step-02**：164个原源与41原CSS摘要不变，冻结startup／CLAUDE／原输入不改；普通和DCC模拟分离且不重置存量数据。FLD-201～230仍为本地格式。通过摘要核对、模式／epoch回归验证；来源LOCAL、SRC-155。
- **R-008／step-02**：DCC使用已有取数能力和通用条件配置；`seriesCode`在本平台适配，不把page／per_page以外参数说成DCC已支持；必需与可选来源规则不变。覆盖FLD-207／208／210／219，以及原FUNC-029、SC-012、PAGE-007、ACTION-031和对应AC；通过通用依赖与DCC运行时回归验证，SRC-161／162仅供候选契约追溯。
- **R-009／step-02，完整性与竞态**：全部分页完成后授权车系编码精确匹配；部分失败不新选、不判旧值失配，完整空集单独提示；错误编码不静默查全量；旧epoch／模式／上下文响应不回写。覆盖FLD-210～215／218～222／226，FUNC-030、SC-013、PAGE-008、ACTION-032和原对应AC。使用新适配器／运行时QA及浏览器正常、失败、重试、空集、错码、旧值分支验证。
- **R-009／step-02，缺列与保存**：缺失区县／小组／业务类型／营业状态／售前电话显示“接口未提供”且禁用相应筛选；原多选暂存、确认／取消和逐家编码／当时名称保存可用，历史、原导入和原计划到店文本保留。覆盖FLD-213／214／216／217／222～225／229、FUNC-030、SC-013、PAGE-008～010与原对应AC。使用picker／多选／保存汇总／导入竞态及页签回归、浏览器实际保存验证。
- **R-010／R-011／R-012／step-03**：首页按fixture→adapter→BusinessData依赖加载，四视图无断链；两图仅核对来源hash／语义／SVG几何及桌面可读，不重画；已有README／追溯明确全部编码与范围为fixture，两个可选交付关闭。通过资源／语法／源图摘要与浏览器导航检查验证。

全部既有R-002～R-007及未受影响的34AC沿原稳定ID保留；按影响回归授权启停和其他守卫，不以本轮mock通过替代API-015／016／018或生产草稿契约补证。新epoch结论由总控在verification-log记录，本表不提前写Pass。


CHANGE-11112本轮本地实现核验通过，fresh证据按新epoch记录；8FUNC/34AC/5PAGE保留。R001底座保护以本轮只读及目标41CSS/25输入/冻结启动摘要为准；原source历史8项差异均早于本轮开始，已记录且不改旧manifest。当前浏览器实际1280×720，原图几何与来源摘要不变；本地模拟通过不替代真实G2/G3或生产契约。


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


CHANGE-11117 本轮模拟验收关闭：R001～012按既有8FUNC/34AC/5PAGE逐项复核，新增v2来源规则只落实SRC163/164已分析结论，未新增业务操作或真实接入能力。20套1698断言；122JS语法、174本地引用、27冻结文件、41原CSS和164原source本轮只读保护通过。浏览器1280×720实际走N7两店→区县筛一店→NEV旧店跨组待重选→ICE A/B同三店且保留两店→保存及详情快照；新通独立双来源六店、取消不写、后页异常禁选及空选填保存通过。四视图当前宿主切换、两图可见节点/参与者与源SVG一致，console error/warn 0。所有Pass仅为本地模拟，真实接口/G2/G3/生产保存和草稿缺口继续保留。


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

CHANGE11118当前独立模拟验收：R001～012按SRC165及既有8FUNC/34AC/5PAGE重验。22套1856断言（当前实际profile两套158项＋保留通用/DCC20套1698项）；当前用户路径不以DCC回归当证据。浏览器1280×720管理员编辑code/name/空码拦截、客服单选及原门店文本/页签/缺导入编码提示/保存详情，改名后旧name/code不漂移、旧DCC历史可读均通过。最新SC013业务图和SEQ015时序、四视图同宿主、console error/warn0。123JS/175引用，41原CSS/27冻结文件/164原source保护。需求侧当前global仍有真实保存high/partial两项正式阻断及草稿medium警告，G2/G3未批准；本表Pass仅沿SRC155授权本地模拟，不产生开发交付。


## CHANGE-11119-existing-custom-fields-no-legacy｜SRC166

用户明确“车系配置采用现有自定义填写车系编码和车系名称啊，然后不用考虑兼容因为没有历史数据”。本期车系复用现有自定义单选选项及保存入口，不新增独立车系服务/维护模块。本期无初始存量，不纳入迁移、回填或旧接口单/多门店格式兼容验收；实际项目旧文件/演示素材保留，不删除数据。上线后新记录仍保存当时车系编码名称、导入只读及显式确认。plannedStoreName每通保存、详情及档案汇总沿原普通字段规则，不新增跨通配对/空文本清空。通用接口字典与上游配置仍由平台研发实现，具体模块/物理字段映射属工程工作；API018是内部复用逻辑职责，不需外部供方补证，未声称生产验证。原草稿工程核对边界不变；G2/G3未批准。原型已有防御兼容代码/测试仅为保留实现，不计本期迁移兼容范围。

本轮step-01 verify-only：257文件clean、原41CSS/27冻结材料/164source本轮只读及四导航同步恢复。step-02 verify-only：业务JS/配置/CSS与起始摘要不变，现有界面已满足复用code/name和原门店文本；重跑当前profile95+63专项，不要求存量兼容作为本期新增验收，不清演示存储。step-03 update：仅现有README/关联系统与当前草稿两图、两份来源记录、review-view-cache及delivery-nav同revision、mutable memory追溯；index仅缓存辅助脚本版本（若需），不改业务。图集保持源SVG几何；真实浏览器两图/四视图，当前错误0。三个step及两图/global按新epoch记录，S6～S9由官方工具推进，可选交付仍false。

CHANGE11119本轮仅说明/图集同步：起始257文件clean，业务JS/配置/mock/CSS 171文件逐字节不变；当前local-profile95+63新鲜专项通过。123JS/175引用/16业务6时序源几何、41原CSS/27冻结材料/164原source保护。浏览器1280×720已登录后四视图可切换；FLOW005五节点、SEQ014三参与方五消息可见，新范围说明正确，console0。未重验全屏/多视口，原型无生产调用。需求全局当前0错误、11105一个中等工程核对；范围问题11102已按SRC166关闭，G2/G3未自动批准。本期无存量迁移/旧格式兼容，原型保留的防御实现不计本期验收/报价。


## CHANGE11120｜审计两项实现修复

用户明确“修复发现的问题”。P1：未提交local车系仅保存option.id，管理员保留ID改code/name会使旧表单所见与保存快照不一致；分类关闭显示会静默丢已选值。必须在保存前按实际草稿所见的field ID、option ID及code/name、可见性核对，变化保留全部草稿、明确提示并提供重新选择/清空恢复；无关项变更不阻断，不用重渲染或旧DOM自动确认新配置。新元数据仅本地草稿使用，不进入保存/回传业务快照，保留会话/owner/权限守卫。

P2：配置编辑器直接退出（X、Esc、返回、取消及子字段返回分类）绕过现有遮罩未保存确认。统一用户退出入口：有改动先确认，继续填写保留同一草稿及焦点，确认放弃才关/回父；无改动、只读预览、保存成功或身份/租户/权限失效清理不误弹。遮罩只弹一次，旧确认不能关闭新编辑器或丢新输入/复活旧层。仅BC局部接管，不扩大全局PlatformUI关闭语义。

两项均现有FUNC029/030、SC012/013、SEQ014/015之实现缺陷，不新增US/AC/FUNC或业务模块。SRC166复用现有自定义code/name单选、原plannedStoreName文本、无初始存量迁移/旧格式兼容范围保持；通用接口能力保留，正式G2/G3不由本次模拟修复批准。旧v1.1.0、41CSS、27冻结材料和原始输入不改。

本轮step-01 verify-only：起始257文件clean、四导航同步恢复、164原source本轮只读、41原CSS/27冻结保护。step-02 update：customer-followup.js及必要workbench桥（先核准）、business-categories.js；新增local staleness与配置dirty-close真实回归，最小复用原local followup harness和operator QA（不削弱旧断言）。真实PlatformUI参与关闭测试。step-03 update：index相关脚本缓存、既有README/追溯和当前QA结果；两图/来源几何只读复核，四视图浏览器实际核验，业务代码之外不新增产品文档/标注。所有step/两图/global在新epoch实际检查后记录；官方推进S6～S9。


CHANGE11120当前核验：R-001～R-012恢复Pass仅指本地模拟。R-008覆盖所有退出入口的单一未保存确认、继续填写焦点／草稿保留、子字段返回保留父稿，以及保存／预览／权限清理不误弹；R-009覆盖所选车系编码／名称或显示状态变化时阻断保存并保留输入、更新选项仍待明确重选、无关配置变化不误阻断。24套2088条断言与另行独立35场景217条通过；实际浏览器已核验跨标签页修改、保稿恢复、重选保存与退出放弃不写入。41原CSS、27冻结材料和164原source本轮无新增漂移；工作台与全局PlatformUI未修改。R-010～R-012本轮浏览器复核通过：1280×720已登录宿主页依次切换原型、业务图、时序图、关联系统再回原型，外层保持index且delivery hash匹配；FLOW005五节点及箭头、SEQ014三参与方与三条完整消息及第四条局部可见，当前SRC166提示正确；正式需求G2/G3保持原状态，未发生生产验证或交付批准。


## CHANGE11121｜通话内表单版本固定，修复配置变更阻断收尾

用户在确认“管理员修改业务类型/字段配置可阻断当前话后完成并挡下一通”后明确要求“修复这个阻断项”。这是既有FUNC-029/030、SC-012/013、SEQ-014/015下的完整性实现缺陷修复。通话开始时以完整通话/客户/租户身份绑定整版分类和字段定义；无固定业务类型的通话也先固定目录，之后选择业务类型仍读同版。当前通话及话后直到保存完成，字段显示、必填、类型、选项code/name、依赖及分类名称均沿绑定版本，管理员的新配置仅后续新通话生效。绑定随该通话/现有本地草稿恢复，不新增生产草稿恢复承诺，也不做初始存量迁移。账号/对象/租户权限与外部接口来源启停/授权继续实时校验，不能借配置快照绕过。未绑定的档案编辑继续live配置保护，不能跨call/租户/owner复用绑定。

前轮CHANGE11120对未绑定编辑器的已选车系变化保护仍保留；本轮已绑定通话按整版快照保存，不再因管理员改码/改名强制客服重选。快照为配置及可追溯元信息，完整保留已填字段，不把私有草稿守卫混入业务values；回传fields/name/code须来自同一版。电话状态不因配置修改改变，完成保存后应真实退出wrap、可继续下一通。通话开始前原本无效的配置及用户自身必填缺失不在本轮放宽，实时权限撤销仍沿原规则。SRC166现有自定义车系code/name单选、原plannedStoreName文本，无初始存量兼容范围保持；旧原v1.1.0、41CSS、27冻结输入与startup/CLAUDE不改，G2/G3和生产核验不由本次模拟修复批准。

本轮step-01 verify-only：起始259文件终态clean，四导航runtime同步后恢复；本轮原source全量只读保护，41原CSS/27冻结不漂移。step-02 update：customer-business.js提供通话目录版本绑定读取及同版回传；customer-followup.js提供bindCallForm及同版填写/校验/保存和档案live边界；agent-workbench.js在来电/任务外呼/预览外呼/草稿恢复处接入完整身份绑定。BIF仅若实际调用链未同版才作必要最小修复。新增qa/check-call-form-version.cjs与qa/check-workbench-form-version.cjs，旧local-staleness测试仅按绑定/未绑定新边界细化不删旧保护；独立/tmp复核。step-03 update：index相关缓存、既有README/追溯与QA汇总；两图及来源只读复核，四视图与浏览器跨tab配置变更、保存详情和下一通按新配置实际走通。两个可选交付仍false，不生成新产品说明/标注/开发包。

验收重点：通话中新增必填/改必填/改类型/隐藏删除字段/普通与车系选项改码改名/分类停用改名均不得套到旧通；新通必须用最新版；旧通保存保留当时值及code/name；通话与租户/owner隔离、现有草稿恢复、实时来源授权拒绝、实际工作台完成与下一通均要有当前证据。


CHANGE11121恢复补充：通话开始即已损坏的目标业务分类不冻结为无解；管理员修复后，客服可明确选择重新载入已修复配置，全部草稿继续保留并按新版本校验，旧选择不自动确认新含义。正常有效绑定版本不提供随管理员修改更新的入口；live仍坏、身份/对象无权、快照跨call等不可替换。无关分类损坏不影响当前正常分类，不把业务表单错误当作来电信令拒绝条件。仅既有本地草稿/通话恢复边界，无生产持久化新增承诺。


CHANGE11121当前核验：R-001～R-012恢复为本地模拟Pass。R-008／R-009新增覆盖整版通话表单绑定、无预定类型先固定目录、当前通话到话后保存同版、管理员更新仅新通生效；初始坏分类显式修复并保稿，旧演示首次采用绑定遇到非空不可见字段保稿待处理，未绑定档案编辑及实时权限／来源授权守卫保留。未增加US／AC／FUNC或本期存量迁移任务。

26套2376断言（原24套2088＋CB／CF125＋AW163）、独立39场景308断言及另2份未计数汇总脚本硬断言均通过。浏览器1280×720已验证通话中改车系名称／编码、分类名称、必填及隐藏原门店后，旧通保存idle、详情／汇总保原值与LOCAL-SERIES-001及旧类名；下一通采用新版，新必填缺失拦截、补齐后idle，两通完成且演示配置恢复。123JS／175引用及两图源几何通过，41原CSS／27冻结材料／原底座672项本轮无新增漂移，旧manifest164中的8处既有差异保持。R-010～R-012本轮浏览器复核通过：1280×720已登录宿主页依次切换原型、业务图、时序图、关联系统并返回原型，外层index保持，delivery hash及当前选项匹配；FLOW005五节点与箭头、SEQ014三参与者／三条完整消息及第四条局部可见；SRC166提示原样且正确，两标签页console warning／error为空。两图只读未重画，未重验全屏或多视口；本表Pass不代表G2/G3、真实接口或生产交付批准。


## CHANGE11122｜本次意向车系改为Mapping接口取数

用户明确“把车系的字段改成接入接口”。需求分析增量当前净化草稿为 `需求/1.1.1/分析工作区/runtime/mapping-series-design-draft.json`（读取时SHA256：fc237d7effe727e06fa1d1a333bdac58d91ebe0120cf3280a0167f0f37c613ee），来源SRC167/168/169；仅分析结论供本轮实现，不直接消费Wiki正文、不把partial升级为真实接通。沿SRC155已授权独立模拟范围继续本次具体来源更改，正式G2/G3仍pending。

当前本次意向车系为一个接口取数单选字段，引用研发预置Mapping车系查询能力(mapping-series)、条目d-mapping-series，无上游；字段库不再让管理员维护此字段候选options。统一code=String(relation_id)，name显示，原relation_id/media_car_series_id/car_state作为sourceValues来源快照保留。官方ID不能与媒体ID或DCC AE等编码互换；本次编码选择和media_id10/car_state1默认范围为实施假定待正式核对，不猜状态名、品牌或NEV/ICE。模拟请求使用GET相对路径、裸数组、无分页，仅合成数据，无fetch/主机/凭据。完全相同重复可合并，相同官方ID有冲突明确报错不任取，空[]与异常/部分返回分开。

门店继续原plannedStoreName文本，不启用接口门店/车系联动。导入原值只读，明确确认后仅按官方code精确匹配，不猜名称/媒体ID；未匹配保原填写。车系值保存code/name及来源资料并复用原保存和普通文本汇总；实时接口启停/租户授权及角色/对象权限不冻结。CHANGE11121整通话表单版本仍保持：旧通绑定旧本地select可沿原版收尾，新通读取新接口字段；新旧类型不在同通静默互转。历史原型素材保留、不做生产初始存量迁移。

本轮开工前用户已整理项目目录：canonical为原型/1.1.1-接口字段联动，旧原型试做为兼容symlink；README直开index、delivery-nav与review-view-cache的file协议处理及删除启动演示.command为本轮前已有4项漂移，均保留不回退。起点最终快照261文件，当前实际起点另存/tmp/live hash；不把这些既有修改当本轮破坏或伪称原始终态clean。原v1.1.0源全目录672、41原CSS、27冻结输入及startup/CLAUDE只读保护。

step-01 verify-only：保护原源与冻结材料，runtime同步后恢复4自定义导航，承接用户当前canonical/直开文件入口；S6拆分及本轮新epoch。step-02 update：config/customer-intent-profile.js、customer-business.js、customer-followup.js、business-categories.js实现新profile及当前字段承载；新增Mapping fixture/adapter，business-data.js按entry能力独立路由mapping-series及实时epoch，原standard/DCC不混；BIF只按当前实际series/store字段修导入提示，必要保存sourceValues护栏最小调整。新增Mapping adapter/runtime/profile QA；旧local系列QA仅测试harness固定旧profile以完整保留原断言，不修改实际新profile欺骗测试。agent-workbench.js无必要不改。step-03 update：index依赖/缓存、既有README和追溯/QA报告；需求草稿图集只按上游当前输出适配并记录source/provenance，不在原型重画，保四视图/宽屏/直开入口。无新说明书/标注/开发包。

验收：实际新profile+真实fixture/adapter/BD/BIF/CF走查候选加载、搜索、单选、清空、导入官方码精确匹配、异常保稿、正常保存/回传/详情来源快照；门店文本不受车系选择影响。租户授权/来源停复/竞态/无关DCC模式及通话版本保护，新通新版/旧通旧版均复核。所有步骤、两图/global在本轮新epoch记录后才收尾。


CHANGE11122实施收紧：有且仅有一个现有localIntentRole=series语义字段时，直接沿用其id、label、businessKey和enabled将当前定义改为Mapping接口单选，保各分类ref原fieldId/顺序/显示/必填，不新增“原自定义”重复条目；仅fresh scope无该字段才创建mappingIntendedSeries。多个semantic或未知ID冲突明确提示不猜。已绑定旧通话自含旧select定义，不受当前字段类型变更。此条覆盖前述初步新ID保留方案，落实净化草稿的稳定标识与原业务映射保留。旧dirty-close独立QA只将旧local场景harness显式固定legacy，保100断言；当前实际Mapping配置另以新profile/独立用例验证。


CHANGE11122当前核验：R-001～R-012恢复本地Pass。R-008覆盖既有唯一车系字段原位改为预置Mapping接口单选、保留稳定标识及所有分类引用，无手工候选／上游；R-009覆盖按官方ID查选／显式导入、code及当时name与白名单来源快照、原门店文本、异常保稿、来源实时授权及新旧通话配置版本隔离。34AC／8FUNC／5PAGE沿稳定ID，不新增初始存量迁移验收。

29套2763断言（原26套2376＋adapter204＋profile117＋runtime66）与独立36场景168断言通过。旧dirty-close首次harness异常已明确固定旧profile，保100原断言并全量重跑；当前Mapping另有真实新profile用例。浏览器1280×720字段配置、3候选／搜索910002／单选、门店文本、导入无原码保稿、保存idle及档案乙／910002快照通过。125JS／177引用及两图16／6源几何匹配，41CSS／27冻结／source672本轮零新增漂移；旧manifest当前11项差异均为起点已有，未改历史摘要。R-010～R-012本轮1280×720浏览器通过：登录宿主原型→业务图→时序图→关联系统→原型，同index仅delivery hash切换，Mapping revision一致；FLOW005实际4个完整节点及第5个局部／箭头，SEQ014三参与方／三条完整消息与第四条文字及局部可见，SRC167／Mapping单选、门店文本、官方ID假定及通话保护说明正确，console warning／error为空。file://尝试被工具协议策略拒绝，未记直开运行通过；仅相对资源／file友好导航静态核验，保留用户现有直开入口且未重建启动脚本；正式S4等待G2／G3、API015 partial与ISSUE11113只约束真实接入，不自动批准生产。


## CHANGE11123｜去除旧预置配置兼容迁移（2026-10-20）

用户指出旧关联警告是兼容原数据造成，前文已明确无历史数据、不考虑兼容，现直接确认“是的，现在去掉”。本轮为对SRC166无初始存量及SRC167接口车系范围的实现纠偏，不增加功能，不重做G2/G3或开发包。当前唯一默认方案为Mapping接口车系单选＋原plannedStoreName文本，默认库只含正常统计/售后/活动字段和当前Mapping车系，没有旧预置车系/备选车系/接口门店定义。

彻底移除旧local/Mapping profile自动投影、旧字段保留改名/旧依赖补齐/多车系转单选/旧单门店转数组/历史接口快照迁移及旧冲突提示，不仅隐藏文字，不以兼容专用QA要求保留生产死分支。当前配置与字典使用独立新key和显式schema，旧key不读取/不转换/不合并/不批量删存储；本版后续自定义字段、有效依赖、分类顺序显示必填、字典授权启停均照常保存且刷新不重置。普通字段同名ID不接管，不猜多上游/缺失参数的旧schema。

保留正常通用接口：显式useQueryConditions开关，必需/可选来源及完整参数映射、循环/类型/权限校验；多选接口字段严格数组，series单选正常对象，不能放宽错配置掩盖问题。保留当版businessFieldSnapshot编码名称及正常记录追溯/非空汇总，元数据显式声明dictionaryId/interfaceKind/selectionMode，移除按旧ID或对象/数组猜旧意向角色。来源启停、租户/对象/成员权限实时核验。

保留CHANGE11121进行中通话整版配置保护与创建时显式绑定、同身份合法会话/话单恢复及一致性检查；去旧无版本演示自动首绑/孤儿值升级。两份当版记录均缺配置版本属于损坏，保稿明确报错，不自动套当前配置；电话结束不因表单损坏无法操作。正常有效版本不被管理员后改强换，下一通读取新配置；初始当版坏配置仍可沿明确修复流程恢复，不是旧数据兼容。

step-01 verify-only：起始265文件终态clean，四导航同步后恢复；原source672/原CSS41/冻结27材料保持，沿用户canonical及直开入口，不回退目录和已删启动脚本。step-02 update：CB/config直接当前初始化及显式schema、BC移旧告警，CF/BD/AW定向移旧迁移与默认补齐，mock/customer-followup仅核对且未修改；根修app.js旧配置key引用检查和alicti-storage启动批量改写，BIF移旧schema/API兜底及单店兼容。普通编解码/正常压缩与真实业务保护不误删。QA提取current fixtures，旧兼容专用套明示退役至qa/retired/compatibility留历史证据，不再计本轮通过；mixed套保正常能力意图，当前profile有新真实回归。step-03 update：index相关缓存、既有README/决策/开放项/功能差异和当前QA报告；图集仅既有源只读复核，若当前草稿文字仍提迁移则只按既有无存量事实对齐，不在原型改SVG。四视图/实际浏览器本版初始无警告、配置新增保存刷新、查车系/文本门店/完成下一通，全部当前证据新epoch记录。

验收必须用旧key注入截图123/旧多车系/旧字典证明它们既不被读取也不被改写，新key直接正确默认，实际无旧警告/旧字段；不是只验证文案消失。保正常新custom字段/上下游依赖及错误校验、授权/禁用、Mapping查询保存来源快照、当前通话隔离及正常记录详情汇总；各当前测试实际运行，退役旧兼容不伪称旧数字全过。真实Mapping主机/默认范围口径仍待核，无生产联调；两个可选交付仍false，未生成开发包或批准G2/G3。


### CHANGE11123当前核验终态（仅独立模拟）

R001～R012按当前版证据Pass，不承接CHANGE11122历史Pass。28套当前活动QA、2389断言在/opt/homebrew/bin/node v25.6.1全部exit0，独立23场景131通过；配置77和存储引用11计入活动套，退役兼容QA原文不计活动，混合套仅保当前能力，不复用2763旧总数。此前两轮Node v24.14.0工作台原生GC SIGSEGV不是通过，对照v24五次崩、v25五次155条通过，保留原失败记录。

R001／R008：直接13正常字段库／lead7，无旧defs／兼容告警，旧键零读取零改写；当前字段、依赖和分类flags／权限正常持久化。R009：Mapping甲／910001、原门店文本及来源快照、实时授权和整通话版本保存正常；后台改名／新必填不挡本通收尾，下一通新必填拦截并补A级后idle，两通完成，分类名和必填false恢复。125JS／177引用、41原CSS／27冻结／672原source本轮零新增漂移，历史manifest11起点差异保持。

R010～R012：1280×720同index四视图／delivery hash一致，SRC171说明正确；FLOW005四完整节点＋第五局部及箭头，SEQ014三参与方／三完整消息＋第四局部实际可见；16／6源SVG hash／geometry与最新W业务ec85367d…／时序22a6d672…一致。SC013 ALT01312已改当前有效接口车系不重复强制查询、实时来源／授权校验，不以本地候选绕过；第二净化归档runtime/product-draft-current-20261020-interface-branch/source-record.json，前归档保留。console曾见一条无URL／堆栈MutationObserver.observe目标非Node异常，刷新再四视图未新增，记录为暂态未复现而非全空；file动态受工具协议限制未运行，仅入口／资源静态核验。正式需求S5～S8 stale、G2／G3 pending，API015／11113／11105真实缺口不因本地Pass关闭，无开发包。


## CHANGE11124当前重验（仅独立模拟Pass）

R008／R009按本轮恢复证据转Pass；其他R的全量、保护和导航亦于本轮复核，不改变原业务编号或正式冻结。待处理叶青旧native／session缺businessFormVersion，自动首绑已删除而恢复动作缺失。新建外呼／来电原创建时绑定正常。

R008／R009新增核验边界为真正缺版本property时才提供恢复：同通／同租户／同身份有效副本沿原版；无副本由本人在权限有效待处理态明确“重新载入表单并核对”，捕获当前有效目录并完整备份全部非空旧业务值，逐项待核对，接口重新查询选择。未知／隐藏值不漏存、不自动认定旧语义；备注／结果／电话状态保留，两个记录均写入成功才切版本，异常回滚保稿。健康版不可借此刷新，损坏版／跨身份拒绝；结束通话仍可操作。最终Node v25.6.1完整29套2533通过（原28／2389保留＋新增144），独立三脚本45场景306通过（新22／175＋原23／131）。正式业务编号、W／冻结／上游图集、G2／G3及真实接口缺口不变。

R008／R009浏览器1280×720实测使用/tmp隔离HTTP18777，仅虚构13800000063模拟缺版本：从提示打开记录、明确载入、原门店／Mapping／未知值全部待核对，备注和已完成沟通不丢；逐项清空重填和接口重查后成功退出wrap，详情910001／文本／备注正确。下一虚构13800000064正常bind接通保存置闲。恢复后旧错误节点0，提示只说“需要核对”，车系名称·编码不露JSON，console warn／error为空。新144专项含浏览器发现的旧错误DOM残留修复；测试夹具漏expectedVersion触发的并发拒绝已修正夹具，产品校验未放宽。

R001～012当前全量与保护／导航复核通过：125JS／177引用、41CSS／27冻结／672source零新增漂移，历史manifest11起点差异保持；同宿主四视图切换，两图16／6 source／provenance／hash／geometry及W完全未改。file动态工具受限未运行，图全屏／多视口未重验。所有Pass仅当前独立模拟，G2／G3及API015／11113／11105真实缺口保持，无开发包。


## CHANGE11125｜解除线索分类与六个预置统计字段的强绑定（当前模拟核验完成）

用户指出业务分类六个预置字段须保留不合理。定位为原v1.1.0本地统计保护过度：页面提示、移除按钮和动作，以及CB保存和scope读取均强制六个refs；接口没有此要求，现有业务分类按实际需要配置字段的原则不应被统计维度反向限制。

本轮只解除分类引用锁：默认字段及初始配置仍供选用，管理员可逐项或全部移除并再次添加，允许仅车系或零个补充字段；保存刷新不补回、不把合法缺ref当scope损坏。六个字段库定义的稳定ID、类型和统计选项仍保留，未扩大为任意修改或删除字段库。正常必需上游闭合/可选依赖、Mapping单选、租户权限和并发守卫保留。

当前通话整版表单保持，分类更新对后续通话生效；新通仅显示/校验/保存实际配置字段，手工注入被移除值也不能进入正常保存和回传。统计每通沿当时字段配置采值，原有最近非空汇总与已知正向数量公式不改；报表筛选和分布选项读保留的授权字段库，避免因为今天移除ref就丢掉已有真实值的分布/筛选。缺配置值保持空，不伪造业务“否/0”，不新增指标含义。

本轮完整31套2719断言通过，原29套2533完整保留，新增分类引用135条及报表独立51条；独立最终53场景381断言通过（新8场景75条＋原45场景306条）。当前R008／R009仅在独立模拟范围Pass，其他项沿本轮全量及保护复核。报表筛选／分布取授权字段库定义，每通validField仍按各自通话冻结表单采值；未配置业务值保持空，正向次数0仍为原计数结果，不新增未配置维度UI或改写业务值。

浏览器1280×720：先开始的一通仍有六个统计字段，后台逐项移除六个引用均可操作，保存后只剩Mapping；旧通仍显示A级／高意向／原门店并正常保存idle。刷新分类仍只有1项、不补回；下一通只显示Mapping、六项不出现，选乙／910002后接通保存idle。随后从已有字段逐项回加六项，将Mapping下移六次恢复起始顺序及flags并保存lead7；两通均已结束，console为空。截图v111-category-preset-removable.png记录保存后仅Mapping的编辑器。

R010～R012本轮浏览器1280×720复核：已登录原型→业务图→时序图→关联系统→原型，同一index宿主及对应hash正确，返回仍为lead7、电话置闲。FLOW005四完整节点＋第五局部、开始节点及箭头可见；SEQ014三参与方／三完整消息＋第四局部可见，SRC171当前说明正确，console warn／error为空。截图v111-category-business-flow.png及v111-category-sequence-flow.png保留于本轮visualizations目录。两图及上游字节未改，未重验全屏或多视口。

125JS／177本地引用、41原CSS／27冻结／672原source本轮零新增漂移，旧manifest11项差异为起点已有；两图、W和provenance字节未改，16／6源SVG hash／geometry一致。原W／冻结输入／业务编号及G2／G3、真实接口与生产草稿边界不改，无开发包／可选文档／标注。


## CHANGE11126｜接口条件类型及编码兼容校验（本轮模拟核验完成）

用户确认修改截图中“已选Mapping车系却提示无有效车系编码”的问题。实际params已传seriesCode=910003，门店模拟仅接受自身目录车系编码；原配置只检查series单选，漏了所选返回属性与下游入参的含义/类型。参数名映射不会转换业务编码。本轮不编造Mapping与DCC关系，不重新启用默认接口门店。

研发预置能力声明每个返回属性及条件参数的valueType/valueDomain及可读说明，区分目录车系/门店编码、Mapping官方ID/媒体ID，不增加超管维护项。配置按实际所选属性检查，类型与含义不兼容的候选显示原因，不能新保存；未确认的必要声明不猜兼容。已有错误配置保持可读可编辑，不通过整scope拒读/清空/自动转换处理。

运行时还校验实际传值类型；不兼容不发查询、不丢参扩大范围、不当成功空门店或可重试网络异常。客服保留原值并看到具体配置原因，正常同源联动、独立查询、权限及晚响应护栏保持。通用有限标量仍支持string/number/boolean，仅明确声明相符才可透传，不做隐式转换。

对新校验发现的旧bound本通明确兼容错误，最小复用既有管理员修复后客服显式重新载入该分类的路径，原稿保留、变化字段重核；正常有效版本、仅live配置变更、权限/来源不可用或损坏版本不能借此替换。结构/循环/缺必需上游等原保护不放宽。仅兼容问题的接口控件保留显示，由逐字段守卫禁查询/确认，避免隐藏正常Mapping或只留无动作总错误。

本轮完整33套2853断言通过（原31套2719完整保留＋新增配置62／运行时72），独立最终74场景540断言通过。超管仍只维护接口名称、取数能力、可用租户、启停四项，不新增type／domain技术配置。0和false仍按已声明的相同有限标量类型及范围透传，不能因值为假误当缺失，也不做隐式类型转换。下游参数名称相同不会把官方ID、媒体ID或目录编码变成彼此。

配置界面保留旧错误选择并显示短状态，完整原因在右侧规则说明可见；返回属性按实际type／domain禁用不匹配项。保存按结构化原因定位：只有属性不匹配时定位上游取值，没有任何可匹配属性时定位来源，未知参数才定位入参，不让用户误以为修改seriesCode就能解决编码范围差异。新校验发现的旧bound兼容错误的修复由既有受控入口完成，原因摘要随版本完整性保存，原值待处理；健康版、仅live变更、缺必要声明或单纯权限／来源不可用、损坏版本不因此开放换版。

浏览器使用18779隔离/tmp虚构旧badref：Mapping来源与不匹配属性禁用并显示短状态和完整范围原因，错误保存定位来源，旧配置仍可修。先开始的一通查选Mapping丙／910003，普通文本及备注保留；错误门店弹窗明确编码不兼容，查询／确认禁用，取消可用，不显示“暂无门店”、反复重试或“先选车系”。管理员明确关闭条件并保存独立查询后，本通显式重新载入修复配置，Mapping／文本／备注保持，全部4家门店可选，选择N01＋I01后正常挂断保存置闲。初次隔离夹具字典ID缺d前缀被既有校验正确拒绝，只修/tmp测试输入，未放松产品守卫。

浏览器复核定位本版picker样式display:flex覆盖hidden，根仅为[data-store-condition-field][hidden]补display:none；刷新新CSS后，健康下一通没有修复按钮（count0），独立查询的条件区实际不可见，“当前租户全部可用门店”说明可见，4家门店正常查询并选择N02，接通保存置闲。上一通档案详情实际保留原plannedStoreName文本、Mapping丙／910003及N01／I01两店。两通均结束，无未完成call；测试只使用18779隔离/tmp自造配置，未修改用户原浏览器。截图v111-interface-compatibility-independent.png及v111-interface-compatibility-saved.png保留于本轮visualizations目录。

R008／R009本轮当前模拟Pass；R010～R012本轮浏览器1280×720复核同一index宿主，业务图→时序图→关联系统→原型对应hash正确，返回电话置闲。FLOW005四完整节点＋第五局部及箭头可见，SEQ014三参与方／三完整消息＋第四局部可见，SRC171说明正确，console warn／error为空。截图v111-interface-compatibility-business-flow.png及v111-interface-compatibility-sequence-flow.png；file动态因工具限制未执行，未重验图集全屏或多视口。125JS／177本地引用、41原CSS／27冻结／672原source本轮零新增漂移，历史manifest11项差异为起点已有；两图、W及provenance字节不改，16／6源SVG hash／geometry一致。W／冻结／业务编号及G2／G3、真实Mapping／门店契约和生产草稿缺口继续开放，无真实请求或开发包／新说明文档／标注。


## CHANGE11127｜当前删除范围与第三Tab（S6，待实施）

当前来源：`/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/需求/1.1.1/分析工作区/runtime/product-draft-delete-and-dictionary-tab-20261020/source-record.json`；SHA-256 `8d77f3f83fe6f98dc5a627caa370ac428305fb00e9089468e08dc1f747c2ab7c`，40件已核对。SRC172～176为用户直接范围指令，沿SRC155独立模拟；不是G2/G3或开发冻结。当前11FUNC／46AC／9SC／9SEQ／3FLOW／5PAGE／10ACTION，原只读inputs、startup、CLAUDE里的8项为初始历史输入，不改写、不当当前范围。

R002～008新增核对第三Tab：仅super原字典权限独立可达/维护，admin原两Tab和授权接口选用不受损，route/sidebar/breadcrumb无重复入口；AC106沿SRC176当前事实。原R001～012 Pass均为历史，新epoch统一Pending，新增R013～015亦Pending，不借33套2853/74场景540旧结果宣称删除已实现。

前表标题原文留作追溯：34条AC、8功能、5页面、7操作沿原ID覆盖；模型与UI验证为模拟试做，真实接口、存储、权限仍待生产核验。

仅未使用对象可删，未使用的六统计预置及Mapping字段也适用；当前配置引用、字段依赖、实际业务/导入记录和本通实际使用/非空稿阻止并给位置。字典全局扫当前实际factory及全部持久scope（含停用/撤权）；字段/分类仅本租户。删除不级联、不清业务/草稿、不补默认；仍存定义保留type/options和单选等保护。

字段/分类不因整版库存误锁；接口另保留未完通话可选类别visible refs及全部activeDependencies闭包（含optional），到本通结果保存完成，wrap仍保留。未定类型以同身份session实际空值优先，不套native旧businessFormType；已完成同identity压旧pending副本。DCC仅任务显式businessType/实际records-batches计引用，未来动态模板或“线索导入”文案不锁lead。

## CHANGE-11127｜三类未使用配置删除与取数接口字典第三页签（当前独立模拟核验通过）

依据SRC172～176与40件净化草稿（source-record SHA256 8d77f3f83fe6f98dc5a627caa370ac428305fb00e9089468e08dc1f747c2ab7c），当前11FUNC/46AC/9SC/9SEQ/3FLOW/5PAGE/10ACTION。业务分类包含业务分类、自定义字段、取数接口字典三个页签，字典仍沿system.applications仅超管全局维护；分类字段沿原settings.business/租户成员授权。原系统管理字典菜单移除，两个内部页签路由保独立权限且均复用现业务分类页，不扩大后台模型权限。

共享usage只读当前白名单配置/业务台账及正式RAM数据，不枚举存储、不触发目录/任务投影或写回；包括linked-scenario-demo-v1正式演示台账及DCC已保存沟通业务快照。三对象均有查看引用及删除入口：未用预置字段也可删，实际配置refs/depends、导入、保存或本通实际使用保留；未定类型通话仅对仍可选分类visible refs及全部依赖闭包保留接口来源至结果保存完成，不把整版库存当字段/分类已用。当前同身份session明确空类型不套旧native类型；已完成native压同身份旧pending，phone/account冲突待核，真缺版仅来源删除待核且不自动补版。

删除前确认，提交时重查上下文/目标/版本及usage指纹，写后复核；发生新引用、身份/目标变化、无法完整读取或写入异常则拒绝并精确回滚本次自有bytes，不覆盖外部新bytes。删除不级联、不清业务数据/草稿、不更换正常通话版本；持久空分类/字段/字典保持，fresh仅在字典可读且默认接口明确不存在时省去悬空Mapping定义/ref，停用/撤权/读坏不当删除。仍在库的预置type/options与车系单选规则保持。

补齐删除后冻结通话再选旧分类并保存的报表边界：只将授权且已完成、能通过原模型读取有效本通定义的实际业务类型加入报表候选；不把快照库存当历史，不恢复live分类，不改变报表指标。相关真实删除→本通选择→CF保存→报表过滤专项13断言通过。

最终Node v25.6.1完整37套3053断言全部exit0（原33套2853保留，新usage73/字典删除33/分类字段删除81/报表13），独立固定源码10脚本136场景845断言全部通过。独立发现的linked正式演示源漏扫已修复并复验。首次完整glob在新81套落盘前为36/2972，最终37/3053覆盖它，不借旧通过。三个兼容退役套仍保原文且不计活动。

HTTP18780隔离本地模拟，1280×720：super实际三Tab来回、字典嵌入及刷新有效；创建仅本轮可处置接口→字段→分类，字段删除显示具体分类引用，接口删除显示具体字段及所属租户。分类取消后可再次打开确认，确认只删分类且字段仍在；随后确认只删字段且接口仍在；接口取消实际count保持1，再确认成功，刷新只剩原Mapping条目。临时三对象均删除，原3分类/13字段/1接口保留；没有操作用户已有浏览器数据或发起通话。主浏览器Tab20本轮warn/error为空；Tab19曾出现工具侧0×0视口，重建本轮临时Tab20后1280×720正常，未据此修改业务实现。截图v111-dictionary-third-tab.png与v111-delete-field-reference.png。

当前业务24SVG、时序9SVG和既有页面结构1SVG均直接复用净化草稿，剥原型语义后几何和源文本匹配，三份provenance记录源/适配SHA。业务SC014原生图缩小后两泳道、起点/发起/核对节点及判断可见；SEQ016三参与方与6条完整消息可见，宽屏缩放可操作；同index原型→业务→时序→返回及关联系统入口复核。126JS语法、179本地引用、41原CSS/27冻结/672原source本轮无新增漂移，旧manifest11项起点差异保留。file动态仍未执行，仅相对资源/直开友好入口静态核对；本轮未重验全屏或多视口。G2/G3待确认、正式S5～S8 stale及API015/ISSUE11113/11105生产缺口不变；未生成DevPack、新说明文档或标注。


## CHANGE-11128｜业务分类页签复用通话记录样式（本地核验通过）

用户截图指向业务分类/自定义字段/取数接口字典三个页签。本轮只将links外观从business-config-links和btn/btn-primary改为既有record-type-tabs/active，保留名称、role及aria-selected、availableKinds权限和原selectKind路由；index更新该脚本缓存。未改任何CSS、通话记录页、模型或存储，未新增业务FUNC/AC/测试；仍为11FUNC/46AC，原G2/G3与真实接口缺口不变。

当前真实组件回归dirty-close100＋configuration-deletion81，共181断言通过；没有重跑或冒报上一轮37套3053为本轮结果。126JS语法、179引用和672原source/41原CSS/27冻结核对无新增漂移，原manifest11项起点差异保持。应用diff仅business-categories.js一处渲染及index缓存，图/provenance/模型字节保持。

HTTP18781/1280×720实际进入通话记录读取参照，再到业务分类比对：容器inline-flex、白底、7px圆角/5px内边距/16px下距/相同阴影；按钮34px高、88px最小宽、5px圆角、无边框，未选透明/灰字，选中rgb(22,119,255)/白字；读取的16项computed CSS在容器/选中/未选三者逐项完全相同。三Tab切换路由分别business-categories/business-fields/business-data-dictionary，aria-selected与active唯一一致，控制台warn/error为空。截图v111-business-tabs-unified.png及v111-record-tabs-reference.png，实际样式对比JSON在本轮visualizations目录。

同宿主四视图切换复核，业务FLOW005五个完整节点及箭头/起止可见，SEQ010三参与方及前两条完整消息可见；截图v111-tabs-style-business-flow.png和v111-tabs-style-sequence-flow.png。业务24/时序9/页面结构1 SVG源及几何hash不改。仅当前桌面HTTP证据，未重验file动态/全屏/多视口；不产生开发包或额外可选文档/标注。


## CHANGE-11129｜业务分类逻辑删除（SRC177当前规则）

用户明确确认逻辑删除方案并要求开始修改。本节覆盖此前FUNC033/US022/AC147～150中“有历史/当前通话/已有名单任务即不能删”的限制；分类从配置列表和新业务可选项移除，归档原row全部refs及必要依赖闭包的字段定义，保留当时名称/编码/结果，旧名单任务继续，本通话后沿开始版。字段和接口仍按实际/归档保留引用保护物理删除，无恢复/清理/迁移UI，不新建功能或AC，仍11FUNC/46AC/9SC/9SEQ/3FLOW/5PAGE/10ACTION。

已核对40件净化草稿：需求/1.1.1/分析工作区/runtime/product-draft-category-logical-delete-20261020/source-record.json，SHA256 3ca0ec0add52121340c5775142b320922b596733ccac264d89e8941f11c4b54f。当前事实及原5MD/3HTML供本轮消费；历史草稿/冻结inputs/startup/CLAUDE不改，G2/G3pending、正式S5～8stale与API015/ISSUE11113/11105缺口不变，仅SRC155继续授权模拟。

实现计划：scope可选retiredTypes归档（row/fields/deletedAt/deletedBy为原型内部设计，非已冻结生产表契约），保存和归档同次CAS；live catalog/list和新import只active，retired ID不能save复活。只读历史需授权且固定类型/实际对象上下文，capturing新通另核对既有batch/DCC具体item/phone/type或已建native/RAM同identity，伪造新callId/taskId不能把deleted类带回新业务；已有效bound最先使用原版。已有归档业务单独获取该row及闭包defs，避免改变其它active定义。删除检查category的业务refs仅影响提示，权限/上下文/原子归档失败仍保留；field/interface仍扫archive refs。

## CHANGE-11129｜业务分类逻辑删除（当前独立模拟通过）

SRC177纠正原FUNC033/US022/AC147～150：当前或历史通话、已导入名单/任务均不再是分类禁删条件。分类从active配置及新业务选项移除，原子保存retiredTypes中的原row、全部refs及必要依赖闭包字段定义、删除时刻/操作者，归档与live库独立；历史名称/字段结果保持，当前有效call版不变，已有业务可继续按归档处理。新导入/新业务拒已删ID，save/setEnabled不能同ID复活；无恢复、清理或迁移界面。字段/接口物理删除仍保护实际与归档引用，不因逻辑删分类级联释放。

只读历史lookup需授权的具体对象上下文；新capture归档另核对真实batch/DCC具体item的scope/type/phone，或已存在native/RAM完整owner/identity，不能仅凭新callId/taskId或伪item marker绑定。固定旧任务仅使用归档目标row+必要defs，live同ID字段改类型/选项不污染归档，正常bound优先原版。批次/报表给实际既有记录保留归档类型筛选，row独有type使用该row及其批次scope上下文，不降未分类；未使用归档库存不凭空产生历史选项。category确认绑定身份、配置raw/revision、目标和归档投影；业务计时/草稿或新增使用仅影响说明。权限/配置变化、损坏或保存异常仍拒绝并精确回滚本次自有bytes，不覆盖外部新写；field/interface保持完整使用保护。

业务规则上游40件净化草稿已逐件hash验证，source-record为需求/1.1.1/分析工作区/runtime/product-draft-category-logical-delete-20261020/source-record.json，SHA256 3ca0ec0add52121340c5775142b320922b596733ccac264d89e8941f11c4b54f。仍11FUNC/46AC/9SC/9SEQ/3FLOW/5PAGE/10ACTION；旧只读inputs/startup/CLAUDE及历史草稿不改。正式G2/G3pending/S5～8stale，API015/ISSUE11113/11105不因本轮模拟关闭，无真实请求或DevPack/可选文档/标注。

最终Node25完整39套3168断言全部exit0（原37/3053保留，新logical100及report15；旧category‘有业务必须拒绝物理删’断言按已确认软删改为成功且业务保留，未减少断言或放松field/interface权限）。独立最终11脚本155场景974断言全部通过，含源码hash及实际AW/PUI计时进度确认；结果/tmp/v111-independent-retirement-final-results.json。第一次完整39/3149只是新增专项81版的中间证据，当前以39/3168为准。

浏览器初验发现category token沿完整usage readSet，被普通connected通话进展作废；已记step-02 fail/连续1。最小修复为category配置/归档相关指纹，保全物理field/interface守卫。忙碌通话期间工具reload未发生HTTP请求，第二次仍旧脚本重现不算新代码失败；两通原稿均正常保存后idle，最终缓存revision改为category-retirement-final，17:43:57本机HTTP日志确认新U/CB实际200加载。

最终实际1601×1314/HTTP18782验证：只新建本轮可处置字段“逻辑删除验证说明”和两分类；原演示3分类保留。虚构13900009271话后删除第一类成功，原值/备注/结果保留并保存；下一通13900009272的业务选项不含第一已删类，并保存第二类记录。最新脚本第三通13900009273使用有前一通历史的第二类，确认显示2处业务影响，计时01:02→01:48后确认仍成功，工具条仍通话中。结束后旧类名及“最新版本删除后仍保留此项”/备注/结果均保持，实际保存置闲；客户档案只读详情显示原分类“通话中删除复验”和原字段结果。三通均已结束，无未完成call；两自建类已逻辑删，测试字段随归档保留，未删除原demo对象/用户既有浏览器数据。截图v111-category-logical-delete-confirm.png、during-call.png、draft-retained.png、history.png；最终warn/error为空。

126JS/179本地引用通过；41原CSS/27冻结/672原source本轮零新增漂移，manifest11项旧差异为起点已有。源业务96aa9db0…/时序bc1a03aa…/页面afed26e7…按当前草稿复用，24/9/1SVG几何文本及provenance hash匹配。SC016真实浏览器两泳道、9动作框/3判断及连线完整可见；SEQ018三参与方、前6条完整消息及第7局部可见，同index四视图/related边界返回正确。file动态/全屏/多视口未重验，未把HTTP当直开动态证据。


## CHANGE-11132｜通话快照不限制字段库删除（SRC-180）

自定义字段删除只核对当前业务分类引用（含隐藏/停用）及其他当前字段的直接依赖；历史已保存字段值、独立归档定义和完整本通/话后字段快照只作保留影响，不阻止删除字段库定义。删除不改写快照、业务数据或草稿；本通继续按开始版保存，后续通话按新配置。权限/目标版本、当前引用或必要快照无法可靠核对、提交失败仍保留原对象，不自动补默认。取数接口的实时资格与来源保留规则不变。

当前用户明确规则沿既有独立模拟授权落实。旧交付包和冻结来源保留原字节，旧包不代表本次更新规则；本次不补造全量G3批准。仍11FUNC/46AC/5PAGE/10ACTION。


## CHANGE-11135 · 基线外壳交互继承核对

不是新增接口字段FUNC/AC。用户明确要求补齐v1.1.0：账号认证→平台选择→租户选择；两个入口导航AI目标；云入口未选租户不进工作台；当前电话和未保存内容阻止离开。本轮64项登录/离开保护及17项真实抽屉草稿检查，另与原42套完整回归一起重新验证。生产SSO、AI目标权限与真实电话/接口联调不由这些本地结果证明。当前整体结果以qa/ai-platform-regression-20261021.json及实际浏览器证据为准。
