# 当前未决与验证边界

本轮用户明确延续有限静态Mock；原真实12项延期及14项工程缺证保持，不能以本地演示关闭。这里只记录当前边界，不新提已确认问题。

## 当前结构化问题

| Issue | 严重度/状态 | 内容 | 后续依据 |

|---|---|---|---|

|ISSUE-2001|high / open|原AI权威身份、租户访问与授权作用域尚待说明|SRC-009；现有身份/公司/角色/资源接口已定义；待核认证主体跨服务映射、可进入租户的权威关系、现有状态与退出作用域，以及原角色能力及模块开通衔接。|

|ISSUE-2004|high / open|历史名单当前有效状态及来源判定仍待说明|SRC-009；保留已有DECLINE/INTENT/OTHER、分组期限、个人起止日期和来源字段定义；只补旧采集语义、期限优先级、解除/到期痕迹及重复来源判定。|

|ISSUE-2005|high / open|已接收未拨及重呼号码的供应商禁呼边界|SRC-009；天润精准删除与黑名单字段已有定义；待核各实际供应商/产品方式的检查时点、起呼竞态、缓存重呼及不可撤回结果。|

|ISSUE-2006|high / open|供应商最终生效、共享来源与重试语义待说明|SRC-009；同步查询/新增删除方向、状态枚举和天润增删查已定义；仅待终态判据、本次操作关联、共享范围解除及重试方向/幂等语义。|

|ISSUE-2008|high / open|原操作接入的精确授权、取数及来源证明表达|SRC-009；原功能范围已按SRC2100及准确原参考逐项收口；仍需核对具体菜单/片段/操作的原授权映射、准确AI批次结果与当前分钟服务汇总取数，以及严格来源证明对实际动态入口语法的支持。它们不再属于“缺完整旧需求包”的产品范围待决。|

|ISSUE-2011|medium / open|原删除实体、资格一致执行及结果语义待核|SRC-009；无业务引用/账号其他租户关联禁止删除及审计保留已由SRC-2077实际确认，两删除已有当前独立FUNC/SC/SEQ/ACTION。仍需说明原ID实体、原删除权、引用及最终删除一致校验、级联/历史和返回终态，不能由前端Mock代证。|

|ISSUE-2013|high / open|品牌线索编码的执行映射、幂等及单条完成证明|SRC-009；继承原已确认产品规则，需研发补齐在v2统一身份/租户及执行资源下的真实实现证据；不重复询问已确认业务方向。|

|ISSUE-2014|medium / open|既有回传兼容及关联变更的工程边界|SRC-009；继承原已确认产品规则，需研发补齐在v2统一身份/租户及执行资源下的真实实现证据；不重复询问已确认业务方向。|

|ISSUE-2015|high / open|串行衔接的真实结束及保存判据|SRC-009；继承原已确认产品规则，需研发补齐在v2统一身份/租户及执行资源下的真实实现证据；不重复询问已确认业务方向。|

|ISSUE-2016|high / open|AI与云呼叫的线索及结果接续能力|SRC-009；继承原已确认产品规则，需研发补齐在v2统一身份/租户及执行资源下的真实实现证据；不重复询问已确认业务方向。|

|ISSUE-2017|medium / open|本方线索传入正式契约待定义确认|SRC-009；继承原已确认产品规则，需研发补齐在v2统一身份/租户及执行资源下的真实实现证据；不重复询问已确认业务方向。|

|ISSUE-2018|medium / open|前序正式基底仍待核；最终v1.2冻结与Mock收尾已核|SRC-009；仍需核源ISSUE-11214前序v1.1.1正式基底；v1.2最终冻结及本地Mock收尾已具证据，不要求再次证明。|

|ISSUE-2021|high / open|分类模板与节点执行实例的精确契约待证|SRC-009；源版API-11208及ISSUE-11222/11225扩展到分类/模板版本/节点/原执行段/远端标识、终态与有效标签；本方内接口无需外部供方不代表生产实现已验证。|

|ISSUE-2022|high / open|意向门店编码映射与原始意向保护契约待证|SRC-009；storeCode/brandId映射须稳定唯一有效，不能按门店名称或外呼enterpriseId猜测；无意向仅当前总部管理员同次指派。|

## 原12项延期主题

准确去重主题和用户延期依据在../需求/待确认与重构差异清单.md及SRC-009 design_continuation_authorization。原G3与正式分析S8不修改；身份/授权/映射/远端结束与禁呼/保存/旧数据等真实证据由原责任方补充。

## 本轮适用验证

file自动操作既有拒绝保留；不重试、不转通道。实现可进行静态资源闭包、JS语法及隔离模型/DOM测试；实际file界面尚未验证时保留未验并提供最小人工核验。HTTP不是运行前提，不能替代file通过。

## 数据与来源保护

旧原型由用户手动删除，代理删除已取消，不找回旧目录。旧浏览器数据保留，新轮使用独立命名空间，不清空、覆盖或迁移。需求及参考源只读，不读取底层会话或采用其内容。


## S6 实现边界补记
本轮新增文件仅为离线模块载体、本方共享差异和生成期辅助脚本；不复制旧适配堆栈。页面逻辑字段组136项由原专业模型提供具体值，原引用的完整字段/枚举仍沿SRC-010/011/012，不能凭页面标题补新API。file实际可见性和后续人工核验未执行，所有验收目前Planned。

## 本轮 S7 执行记录 · step-02 浏览器复验
2026-10-26：用户已允许新开原HTTP验收页，Chrome标签980687953实际打开。原AI卡片/详情与Cloud导入页可见；Cloud复制页面原history地址写入在srcdoc内报错，已将地址责任收敛到父壳，子页仅保留history.state。新代码通过172项静态/隔离检查，但工具仍卡在已加载的about:srcdoc#customer-tasks，无法发起刷新。已请求用户手动刷新原HTTP父页，不清理数据、不重开服务、不重试file入口。未将本步记为通过；刷新后在同页复验并更新本轮验证记录，再继续step-03。正式G3与12/14问题状态均不变。

step-02环境待项进展：受支持的同一HTTP地址新页面980687954已完成本步浏览器复验，原srcdoc片段写址问题不再出现；可继续step-03。file实际浏览器验收仍未完成，正式G3及12/14工程问题不变。

## 2026-10-26 · 本轮原型尚未收口的具体项
以下为当前实现/验收缺口，不修改已确认需求、12延期或14工程缺证：
- step-06：原人工电话话后拒联全链路尚未在实际UI验证；模型已覆盖提交未定/完成以及四类外呼检查。托管号码重新提交/重试入口仍需补核。供应商侧真实禁呼及在途处置仍待研发证据。
- step-07：财务专用身份的分钟/服务汇总导出适配尚未完成；资源专用身份的原专业角色映射仍待补。禁止把原旧金额导出或占位提示当成本次通过。
- step-07：本轮完成有限入口冒烟，未逐项完成全部原专业操作及其权限/持久化复验；原AI私有页面模型不能据此宣称全部支持跨登录保存。
- file://实际直开未验，既有自动访问拒绝保留；HTTP读取不能替代。README给出最小人工检查路径。
- step-08/09/10阅读页已发布并实际打开，不能凭图页完成推定业务或外部契约已验。S7继续保留，不推进S8/final。

## 2026-10-26 晚间 UI 完成后审计（先审计，再整改）
- 覆盖：46个来源记录中3个仅作历史追溯；43个当前页面含2个登录/外壳及41个原页面ID，均已保留；五区域归并仅改展示。552项隔离断言覆盖各演示身份/范围的原新授权矩阵一致、首次路由及旧位置无写入兼容。
- UI/路由：已实际检查深色侧栏、Cloud共享表格/表单/弹窗、业务&客户返回与筛选保留、阅读导航及原E2E记录仍为上海门店/周岚2201/第2轮未启动；未重复执行主线。
- 待修实现：财务专用身份的服务分钟汇总导出；资源专用身份的原专业角色和资源范围接入；当前两项不能以入口可见冒充完成。
- 待验链路：人工话后拒联、托管号码重提/重试、原专业写操作与跨登录持久化，按原范围逐项核对。发现阻断优先最小修复。
- 受限项：file实际自动访问旧拒绝保持，不重试；HTTP不替代file；12延期14工程缺证及正式分析S8/G3状态保持。
- 原步骤06/07仍未完成。UI完成不改变这一结论；随后继续整改，不新增业务功能或临时角色越权。

## 2026-10-26 晚间整改复验结果（更新前述待项，不覆盖旧失败证据）
1. 已修复并实际验证：财务导出仅有权总部1行、固定8列、BOM与转义；实际下载文件/private/tmp/D联络云-服务汇总-20261026.csv，未重复下载。导出身份只进入独立工具，普通统计/公共资料权不授此权。
2. 已修复并实际验证：资源身份不再占位；只读授权企业账号7522240，保RESOURCE_ADMIN本地范围，不伪装超管/业务成员。8个专业资源页已打开，原账号备注保存后跨登录回读。范围外对象、新增未授权账号、业务任务及公共权限保持受限。
3. 已修复并实际验证：原人工结果仅二态，“拒联”旧枚举已不可选，原等待枚举的代码失效；追加同一表单的明确拒联确认，仍保二态。13800009996在原话后保存后形成公共来源，后续同号人工拨打在发起前被拦截；管理员能按准确来源打开通话MCMVP478TJ1A02。13800009995为发现缺口时的普通本地收尾记录，不冒充拒联成功。电话均为源Mock且已离线。
4. 已修复且隔离模型验证：托管待提交、失败补提交、再次导入及原预外呼再次联系均重核公共禁呼；命中不写新提交、不占次数。供应商远端真实状态继续待核。
5. 已修复并实际验证：AI原标签/场景配置按当前范围持久化；原标签新增后重新登录仍为6项，切上海租户仍为原5项，不改供应商/业务字段规则。首次复验发现捕获阶段微任务早于原保存事件，已改为原事件完整结束后提交并复验通过。保存失败保留修改，旧窗口冲突不覆盖。AI导入记录与名单也已接同一范围存储，隔离模型回读通过。
6. 仍受限未验：AI文件选择上传被Chrome扩展文件访问限制阻止；本次fileChooser.setFiles失败，未更改扩展权限、未换通道或重复尝试。该工具等待明显过长；不把隔离模型当实际上传通过。file://直接打开的旧自动拒绝同样保留，需最小人工检查。
7. 仍需权域证据：PAGE-2112的原服务/充值/手调必须独立财务权限；现有仅导出演示身份未被追加这些权利，直接进入显示明确受阻，原专业源码保留。不能凭统一超管或公共资料权替代。真实身份/授权/供应商等12延期14缺证不变。
8. 验证范围：此次验证为本轮变化及关键原操作，不能宣称222个保留动作全量实际重测；旧主线E2E证据保留并只读回核，未再次启动/保存/转交。S7不因UI完成自动推进S8/final，正式分析S8 blocked/G3 pending不变。

## 审批与受限动作挂起登记（2026-10-26）
用户Sentinel_6904707e25b48191ae12938beb09e7e4：具体审批请求超过10分钟未答复，挂起该动作及依赖步骤；继续独立已授权工作。超时不构成批准，结果未知先核对，不重放、不换通道。工具锁住回合仅用正式取消/跳过能力，没有则如实说明；本轮没有新增待用户批准的动作。
| 动作与目标 | 请求/时间 | 当前状态与原因 | 后续补验 |
|---|---|---|---|
| 原HTTP页AI手动导入，选择/private/tmp/d-v200-ai-import.csv | 本轮cua_repl fileChooser.setFiles调用；工具未提供可记录请求ID，未单独采集开始时钟 | 工具返回扩展缺少文件访问许可；未点击“开始上传”，未提交业务导入。未申请或修改扩展权限；等待时工具没有返回可用取消机制，等待结束后才继续 | 有效允许环境下单次选择文件、导入及跨登录记录回读；已有隔离持久化检查不冒充UI结果 |
| 唯一prototype/index.html的file://自动回归 | 沿用本会话已有拒绝，不新建审批请求 | 保留受限未验；不重试或改通道，HTTP通过不替代 | 用户直接双击index，核验登录、多租户、两个专业页、阅读页及保存回读 |
| PAGE-2112专业财务服务/充值明细 | 原独立财务权域待核事项，无本轮新审批请求 | 仅导出演示身份没有服务明细/充值授权；显示受阻，不用公共资料权或超管称谓推定权限 | 补准确专业财务操作与对象范围映射后，在原页面验证既有操作 |

## 公共联系限制最后补验
2026-10-26：在原HTTP页补验AI来源人工确认，未勾选明确拒联时保存被拒；模拟确认后产生当前上海租户来源记录，并准确打开会话2059190973162029101。原因明确标为本地Mock验收，不代表真实客户结论。补充隔离验证授权运营新增但不能解除/绕过来源、专项分组创建修改、记录新增期限、跨组移动、空组删除历史及错组删除拒绝；没有删除真实浏览器记录。Step 06本地Mock链路可标为通过，远端供应商状态不由此升级。Step 07仍受实际文件访问及独立财务权域限制，未标通过。

## 2026-10-26 功能覆盖只读核查

本轮按用户“检查是否有功能遗漏”执行，**只改核查文档，不改业务代码，不批准修复、G3或生产**。以当前v2确认稿、用户已批准五区域展示调整、c847 v1.2基线及当前只读参考为准。旧删除原型的通过记录不作新版证据。

范围核对：46个来源记录＝43个当前页面＋3个历史来源；43＝2个父壳视图（登录/统一外壳）＋41个nav页面ID（35个主菜单＋6个内部页）。117个记录动作中4个属于三条历史来源，当前动作恰为113。另有PAGE-2224/ACTION-2084源内部辅助条目，已明确排除，不计入上述43/113。**数字已对上，但不能证明功能完整**。

本轮把113动作逐项列入口、当前处理代码定位、后态与权限；38故事/134AC逐条关联动作及结论。全部222个保留操作引用均找到当前参考源及处理函数锚点，但这只作为静态实现证据，不能替代新版实际操作。完整矩阵见本文件末尾“逐项对账附录”；acceptance-map.md保留正式R表并提供索引。

证据等级：S＝当前代码/模板/守卫静态链；M＝隔离内存模型或实际生成bundle的纯函数检查；U＝本轮原HTTP页面只读观察；E＝当前重建原型已有、仍适用的有限验证证据。没有本轮实跑后态的条目仍为B，不写成通过。c847包113个清单文件SHA核对相符；本轮源码锁见核查末尾，参考及业务代码保持原字节。

### A｜确认缺失、断链或已确认规则未落实（12类）

每一类问题可能影响多个动作/验收点；不是12个新增功能，也不表示同动作所有分支均不存在。优先处理权限重算、草稿保护、基础接入与明确遗漏的导出，再补入口及边界。

#### A01 · 保存模块权限会丢失隐藏业务页授权（P1）

- 需求来源：US-2008；US-2009；US-2035；US-2039；AC-2022, AC-2024, AC-2025, AC-2026, AC-2119, AC-2131；ACTION-2008, ACTION-2009, ACTION-2055, ACTION-2121, ACTION-2106, ACTION-2110, ACTION-2117；PAGE-2003, PAGE-2204, PAGE-2226, PAGE-2227。
- 当前证据：P/mock/data.js:31；P/js/components/organization-store.js:65；P/js/components/organization-store.js:75；P/js/components/business-link.js:8。
- 核查结论：当前源隔离复现：同一管理员AI/admin、Cloud/admin原值保存前 records/detail=true，保存后均false，而业务台账仍true；没有改浏览器账户。
- 用户影响：新建成员、或给旧成员保存权限后能看业务台账却进不了模板记录/详情，后续分配和办理也被上层拦截。
- 最小建议：按原业务查询/办理资格承接PAGE-2226/2227，不用module=public把业务内部页筛掉；同时区分只读与办理，不能直接赋公共管理全权。

#### A02 · 超管监管列表和详情未接入当前权限（P1）

- 需求来源：US-2038；US-2039；AC-2129, AC-2130, AC-2131；ACTION-2055, ACTION-2106；PAGE-2204, PAGE-2226, PAGE-2227。
- 当前证据：P/mock/data.js:25；P/js/components/session-store.js:34。
- 核查结论：隔离读取当前超管：2个brandIds、3个tenantIds均已配置，但2204/2226/2227的allowed全部false。
- 用户影响：已确认的按有权品牌/租户监管无法通过当前外壳进入；既有模板配置权限不能替代业务监管。
- 最小建议：接入显式监管读权限和原有权范围，复用同一台账；不得因此授分配、启动或转交权。

#### A03 · 新租户缺呼叫账号关联入口，开通也未检查必要资源（P1）

- 需求来源：US-2006；US-2007；US-2013；AC-2017, AC-2020, AC-2021, AC-2095, AC-2096；ACTION-2012, ACTION-2013, ACTION-2015；PAGE-2004。
- 当前证据：P/js/pages/organization.js:42；P/js/components/organization-store.js:58；P/js/components/organization-store.js:64；P/js/components/module-host.js:8。
- 核查结论：隔离复现新建租户enterpriseId为空时，setModule(cloud,true)仍返回开通成功；当前表单/模型无该关联的写入口。原AliCti页面仍说明在租户管理绑定。
- 用户影响：新租户显示云呼叫已开通，却无法建立原云呼叫有效资源上下文；只能依靠预置租户走通演示。
- 最小建议：承接原唯一呼叫账号/租户关联及引用保护；云模块开通核对必要资源。仅AI租户仍不强配Cloud资源。

#### A04 · 门店业务编码维护从品牌关联界面丢失（P1）

- 需求来源：US-2006；US-2013；US-2029；AC-2017, AC-2037, AC-2086, AC-2097, AC-2100；ACTION-2013, ACTION-2014, ACTION-2108；PAGE-2004, PAGE-2005, PAGE-2227。
- 当前证据：Cloud/js/pages/brand-archives.js:40；P/js/pages/organization.js:42；P/js/adapters/cloud.js:48；P/js/components/module-host.js:8。
- 核查结论：原v1.2现有openBinding/saveBinding包含门店业务编码；新版公共表单未承接字段和保存，桥接新binding固定空码，原品牌页又被别名归公共页。
- 用户影响：新门店或待补编码门店不能由管理员完成意向门店映射，正常有意向下发会一直待核；原无意向E2E不能覆盖此问题。
- 最小建议：在既有品牌/租户关联中承接稳定字符串门店编码、品牌内唯一与原锁定规则；不新增跨租户数据授权或第二份映射。

#### A05 · 六类云报表子视图没有可用入口（P1）

- 需求来源：US-2004；US-2027；AC-2010, AC-2072；ACTION-2068, ACTION-2069；PAGE-2209。
- 当前证据：P/js/nav.js:308；P/js/components/module-host.js:9；Cloud/js/pages/report-center.js:5；Cloud/js/pages/report-center.js:157。
- 核查结论：实际HTTP只读页面只有“通话总览”；根导航仅一个overview路由，原侧栏隐藏，原render没有内置七报表切换。其余定义/导出函数仍在bundle。
- 用户影响：线索成效、客户跟进、外呼任务、坐席成效、呼入服务、服务技能无法按原入口选择，其对应明细和导出也不能正常到达。
- 最小建议：在既有云呼叫报表载体接回七个原子视图及准确路由/筛选恢复；保持原统计、详情与导出分别授权，不造统一指标。

#### A06 · AI线索记录只注册隐藏页，原入口未接回（P1）

- 需求来源：US-2023；AC-2063, AC-2064, AC-2065；ACTION-2040, ACTION-2041；PAGE-2109。
- 当前证据：P/js/nav.js:362；P/scripts/build-modules.py:278；AI/js/nav.js:20；AI/js/pages/result-clue.js:268。
- 核查结论：当前JS中没有到PAGE-2109的有权入口调用；原result-clue只在已隐藏的AI原导航中引用，当前业务/客户页未提供替代连接。
- 用户影响：原AI线索查询、标签及回访详情对用户不可达，虽然原代码文件仍存在。
- 最小建议：在已规划的业务&客户/有权AI来源处接回原只读视图；允许原AI合法身份进入，不强要Cloud会员，不新增客户实体或按手机号合并。

#### A07 · 旧目录停用及未绑定品牌的旧配置回退遗漏（P1）

- 需求来源：US-2015；US-2016；US-2017；AC-2041, AC-2043, AC-2044, AC-2047；ACTION-2020, ACTION-2021, ACTION-2044；PAGE-2006, PAGE-2111。
- 当前证据：P/js/pages/catalog.js:3；P/scripts/build-modules.py:215；P/scripts/build-modules.py:239；P/js/adapters/cloud.js:119；Cloud/js/components/customer-business.js:76。
- 核查结论：FUNC-2018明确要求旧租户目录停用。新版分类只进品牌配置、去掉全部category启停；AI读取也只调brandCatalog，未关联品牌直接失败，没有旧目录分支。
- 用户影响：旧目录分类不能停用；未绑定品牌的存量租户无法按原ID维护旧AI关联。新品牌目录正常分支存在，不应据此说所有分类功能都缺失。
- 最小建议：恢复旧目录/旧ID维护与原启停分支；新选品牌分类才核品牌，不迁移旧数据、不按同名合并、不扩大新品牌分类删除范围。

#### A08 · 普通草稿离开保护覆盖原表单，保存回调指向自身（P1）

- 需求来源：US-2002；US-2005；AC-2006, AC-2013；ACTION-2004, ACTION-2006, ACTION-2007；PAGE-2002, PAGE-2003, PAGE-2004, PAGE-2005, PAGE-2007。
- 当前证据：P/js/common.js:11；P/js/app.js:48；P/js/pages/organization.js:39；P/js/pages/contacts.js:30。
- 核查结论：静态完整链：同一个dialog-root.innerHTML被离开确认替换；guard.save查询当前.d-dialog主按钮，命中“保存并继续”本身；取消仅清空提示窗，无原表单恢复。为避免错写，本轮未点击保存分支。
- 用户影响：组织资料或公共禁呼草稿可能丢输入；保存回调再次点击提示窗自身按钮，不能提交原表单并按目标继续，取消也无法回到原编辑内容。
- 最小建议：分离保护弹窗与表单容器，保留草稿模型/原submit引用；await真实保存后继续，失败或取消保持原表单。

#### A09 · AI通话来源页缺少进入拒联确认的动作（P2）

- 需求来源：US-2020；AC-2054, AC-2055；ACTION-2039；PAGE-2108。
- 当前证据：P/js/adapters/ai.js:30；P/js/pages/contacts.js:36；P/js/adapters/ai-special.js:24；AI/js/pages/result-records.js:682。
- 核查结论：当前openAIRefusal唯一外部调用来自AI专项新增DECLINE；通话页只补了反向openByReference，没有ACTION-2039入口。公共入口人工选择来源可用。
- 用户影响：有权运营不能从当前通话直接携准确来源进入确认，需要退出后重新寻找记录；不能把公共页可操作等同于来源动作已接入。
- 最小建议：在原有权通话列表/详情接同一公共确认入口，准确携带租户、sessionId、平台、号码并重验权；不复制名单。

#### A10 · 删除前引用检查只覆盖Cloud，遗漏已存在的AI/公共业务引用（P1）

- 需求来源：US-2023；AC-2079, AC-2080；ACTION-2104, ACTION-2105；PAGE-2003, PAGE-2004。
- 当前证据：P/js/components/module-host.js:38；P/js/components/organization-store.js:81；P/js/components/organization-store.js:89；P/js/components/contact-policy.js:33。
- 核查结论：隔离预检：新账号已经作为有效公共拒联来源operatorId被引用，deletionReason仍为空；只读取预检，未执行删除。resolver仅扫描prefix+cloud，未覆盖AI/公共持久化。
- 用户影响：可能将已参与AI/公共业务的主体判为无引用，破坏历史主体追溯；真实后端一致性契约另属C类，不替代这处本地方向性缺口。
- 最小建议：按已确认对象关系覆盖AI、Cloud和公共引用；未核完整性应返回待核并阻止删除，保留主体/必要审计，不靠仅Cloud字符串扫描。

#### A11 · 已确认的任务客户明细导出入口修正尚未实施（P1）

- 需求来源：US-2025；AC-2068；ACTION-2060；PAGE-2205。
- 当前证据：A/memory/feature-list.json:11016；Cloud/js/pages/cloud-task-workspace.js:2026；Cloud/js/pages/cloud-task-workspace.js:2033；P/scripts/build-modules.py:62。
- 核查结论：当前生成bundle的原render隔离检查：非空真实名单hasExport=false，空备用分支hasExport=true；原exportTaskCustomers又在空名单返回false。没有下载或修改数据。
- 用户影响：用户已明确选择的原六列客户明细导出依旧无法从正确有权非空名单入口完成；任务列表CSV或失败下载不能替代。
- 最小建议：只修入口可用条件，继续调用原exportTaskCustomers(taskId)、原六列/范围/BOM/转义，点击时仍重核，不另造导出器。

#### A12 · AI未匹配标签仍回退首项并写入映射对象（P1）

- 需求来源：US-2017；US-2023；US-2036；AC-2046, AC-2064, AC-2123；ACTION-2043；PAGE-2111。
- 当前证据：AI/js/pages/sys-tags.js:1706；AI/js/pages/sys-tags.js:1727；AI/js/pages/sys-tags.js:29；P/js/adapters/ai-config-store.js:22。
- 核查结论：当前bundle隔离复现：未知供应商标签UNKNOWN被自动写成FIRST；init/启用会调用此逻辑，配置存储还会持久化它。没有在用户浏览器新增映射。
- 用户影响：未知项可能显示为已映射，名称推荐/首项兜底混入确定配置。影响限于标签配置；当前禁止AI写业务字段的guard仍在，不能称已发生自动业务流转。
- 最小建议：推荐与已确认映射分开；未匹配保原值/未映射态，不能回退首项写确定关系；维持原供应商/租户类型/标签场景维度，不新增字段反写。

### B｜已有本地实现，但验证不能外推为整版完整

- 单模板精确版本、显式起点/空白新节点、ALL/ANY及三值条件、固定快照、同记录串行、旧轮首次补录、原子分配、意向定向与无意向总部管理员指派：原c847模型和当前适配均存在；当前重建的mainline-ui-evidence.json及verification-log记录了一条总部→门店主线与相关模型证据。本轮不重复启动/保存/转交，也不把一条主线当新成员/新租户/监管都覆盖。
- 公共禁呼已有本地人工/AI确认、单来源解除、来源回看及执行前检查；旧轮拒联真实来源、供应商已收未拨与远端终态仍属C。来源页漏按钮另列A09，不能因此称公共入库完全没有。
- 原AI场景/供应商标签与Cloud人工、预外呼、IVR、呼入、资源、话单等代码按当前参考载入；菜单/handler/后态代码逐项可定位。当前已有部分UI、隔离模型、导出落盘和持久化证据，未逐项实测的原操作继续待验；A05/A06/A11等不能用原代码存在掩盖。
- 财务8列服务汇总已在当前重建原型实际下载过1个有权租户文件；不等于任务客户六列导出或其他财务动作通过。AI标签保存与跨租户存储已做有限验证，但不证明映射含义正确，A12仍成立。
- file://直接打开和CSV文件选择上传的工具限制属于实际未验，**不是功能缺失或需求排除**；本轮没有重试、换通道或修改扩展权限。

### C｜研发缺证或需明确的权域/契约

| 编号 | 范围与当前事实 | 后续需核实内容 |
| --- | --- | --- |
| C01 | PAGE-2112 / ACTION-2045、2046、2047：原充值/手调/记录源码保留，但当前独立service.view等财务授权未配置；仅导出演示身份被明确挡住。 | 先核实际有权身份、租户和各原财务动作；之后仍须接原抽屉入口、准确租户上下文及原处理链，不能只改权限开关或把公共超管当财务授权。不是本版明确不做。 |
| C02 | AI权威身份、多租户授权、细粒度原操作与真实数据范围未获得生产实现证明。AI样例实例化/配置分scope保存不等于真实任务、话单、统计范围已核定；新角色的资源页可打开也不等于所有原写操作资格已核。 | 继续核ISSUE-2001/2008；例如资源身份的应用接入菜单与原super-only动作守卫不同，不能自行放宽原守卫。 |
| C03 | 历史黑名单有效状态、多来源解除、供应商已接收未拨/重呼处置、同步终态仍缺真实证据。 | 保留ISSUE-2004/2005/2006，本地拦截不能冒充供应商侧闭环。 |
| C04 | 具体AI执行场景与供应商标签场景的关系，目前只对4组明确本地样例开放，其他场景显示待核。 | 核稳定ID及原配置引用，明确本方关联可配置边界；不能用同名/首项补证，也不能据4样例宣称全部生产场景已覆盖。 |
| C05 | 新旧线索入站/回传、原执行段结束与保存、精确模板/节点/资源、门店映射的真实契约仍待核。 | 保留ISSUE-2013/2014/2015/2016/2017/2021/2022；A04是已有前端维护入口丢失，与真实映射契约缺证分别处理。 |
| C06 | 原删除实体、后端一致引用检查、结果未知核对与前序正式基底仍有未决。 | 保留ISSUE-2011/2018；A10是已实现本地引用覆盖不全，不能用后端缺证替其免责。 |

管理登录落点另列C07：当前规则同时包含“公共范围后续恢复位置”和“仅公共能力首个有权页”两种表述。隔离代码确会跨退出恢复旧管理页，但证据不足以单独判A；优先核SRC-2032/2034原确认及现行特例，不自行更改默认或重复询问已确认选择。

原12项延期主题与14个open工程问题保持；不新增“默认通过”、风险接受或G3批准。真实权域/契约问题不得变成D类排除项。

### D｜用户明确不做/不自动新增，不能算遗漏

| 内容 | 确认依据 |
| --- | --- |
| 独立统一首页、AI概览及云呼叫运营概览主菜单 | AC-2004、IA-REMOVE-OVERVIEWS/SRC-2036；原合法能力片段需按目标承接，不能连功能一起删。 |
| 旧六区域展示原样、v1.2过渡AI/Cloud外链切换 | 本轮用户Sentinel_7ef76fa593f08191b5b7c088402b3cc6明确合并“业务&客户”；当前docs/decisions.md记录。五区域不新增模块，也不是漏区。旧外链不能机械要求保留。 |
| AI标签写业务字段、由此新增自动业务流转 | SRC-2096、AC-2064/2123；标签配置、供应商映射、结果展示仍在范围，A12不要求增加字段反写。 |
| 完整DCC CRM、通用自动规则引擎、未确认的其他跨租户业务或独立新接口 | AC-2073及当前memory/project.md非本期范围；本期同品牌总部/门店人工确认转交仍必须保留。 |
| 客户主档重建、多号码身份、公海/回收/生命周期评分引擎、按手机号自动合并、跨品牌共享 | SRC-2094对应当前产品结构与非范围；AC-2072仍保留“原任务确失且无通话/未处理中时有权手工恢复待分配”，不能把这项已有恢复一起排除。 |
| 备用模板/任意切换、自动条件推进/自动起呼、门店直转门店、历史数据自动迁移或改绑 | AC-2104/2108/2120/2125/2133、AC-2088/2089；仅当前已确认单模板及合法方向。 |
| AI任务启动/暂停/终止/删除，以及原AI多处只有toast的导出控件，不自动补成新功能 | AC-2063及feature-list.placeholder_and_unproven_source_controls（10项）；已明确确认的FUNC-2027、FUNC-2043不在此排除里。 |
| PAGE-2224 / ACTION-2084独立场景检查产品页 | page-index.source_auxiliary_pages，SRC-2100/2102；原内部辅助不另算主菜单/新FUNC，不削弱正常任务所需的原资源检查。 |

### 本轮审计结论与边界

当前确认12类A问题，关联到113动作中的27条及134AC中的35条（同问题多次关联，不是新增功能数）。其余83条动作列B、3条财务动作列C；B只是当前实现已定位且尚需对应验证，不是83条全通过。134AC逐条分为A 35、B 93、C 4、D 2的主结论；复合条款的其余约束仍以源JSON完整正文为准，C类依赖可同时作用于B项。

本轮无业务代码/Mock数据/原型布局修改，无浏览器业务保存、删除、导出或电话操作；只做已有HTTP报表只读观察及隔离内存检查。未推进Loop门禁，也未把发现自动转成已批准修复。建议先修A01/A08及A03/A04，再恢复A02/A05/A06/A11等入口，随后对A07/A09/A10/A12做精确回归。


## 2026-10-26 功能覆盖只读核查 · 逐项对账附录


这是只读覆盖核查增量，不覆盖旧验收历史、不把B批量转Pass。P＝当前2.0.0/prototype；Cloud＝1.2.0/prototype-class-flow；AI＝DCC&AI 外呼/AI 外呼；A＝2.0.0/需求/分析工作区。来源行号用于定位，实际承载还受当前外壳/适配器约束。当前bundle与reuse-provenance已核对；原源通过记录不作新版通过。

### 页面全映射（46记录，43当前；另列1辅助排除）

| 来源PAGE / 名称 | 当前承载与可达性 | 是否主菜单 | 结论 |
| --- | --- | --- | --- |
| PAGE-2001 登录及合法入口 | 父壳登录/合法范围选择 | 壳/来源 | B/C07（父壳承载，不占nav页ID） |
| PAGE-2002 统一业务外壳与顶层区域导航 | 父壳五区域/租户切换/退出 | 壳/来源 | A/B（父壳承载，不占nav页ID） |
| PAGE-2202 坐席作业与跟进 | 坐席工作台 / 坐席作业 | True | B |
| PAGE-2006 业务分类与字段 | 业务&客户 / 业务配置 / 业务分类 | True | A A07 |
| PAGE-2204 业务台账与导入批次 | 业务&客户 / 业务办理 / 业务台账 | True | A A01,A02 |
| PAGE-2228 流转规则模板 | 业务&客户 / 业务配置 / 流转规则模板 | True | B |
| PAGE-2007 黑名单与AI专项名单 | 业务&客户 / 客户维护 / 联系限制 | True | A A08 |
| PAGE-2203 客户联系视图 | 业务&客户 / 客户维护 / 客户联系 | True | B |
| PAGE-2102 AI用量与服务 | 呼叫中心 / 供应服务 / 智能用量服务 | True | B |
| PAGE-2103 AI外呼 | 呼叫中心 / 呼叫执行 / 智能外呼 | True | B |
| PAGE-2108 AI通话记录 | 呼叫中心 / 智能通话记录 | True | A A09 |
| PAGE-2110 AI业务场景 | 呼叫中心 / 智能配置 / 智能业务场景 | True | B |
| PAGE-2111 AI标签管理 | 呼叫中心 / 智能配置 / 智能标签 | True | A A07,A12 |
| PAGE-2205 预外呼 | 呼叫中心 / 呼叫执行 / 预外呼任务 | True | A A11 |
| PAGE-2206 IVR外呼 | 呼叫中心 / 呼叫执行 / 语音外呼 | True | B |
| PAGE-2207 呼入服务与规则 | 呼叫中心 / 呼入服务 | True | B |
| PAGE-2208 云呼叫通话记录 | 呼叫中心 / 云呼叫记录 | True | B |
| PAGE-2210 坐席维护 | 呼叫中心 / 坐席资源 / 坐席维护 | True | B |
| PAGE-2211 技能管理 | 呼叫中心 / 坐席资源 / 技能管理 | True | B |
| PAGE-2212 外呼组管理 | 呼叫中心 / 坐席资源 / 外呼组管理 | True | B |
| PAGE-2213 队列管理 | 呼叫中心 / 坐席资源 / 队列管理 | True | B |
| PAGE-2214 配置记录 | 呼叫中心 / 坐席资源 / 配置记录 | True | B |
| PAGE-2215 号码管理 | 呼叫中心 / 呼叫资源 / 号码管理 | True | B |
| PAGE-2216 号码池管理 | 呼叫中心 / 呼叫资源 / 号码池管理 | True | B |
| PAGE-2217 分机管理 | 呼叫中心 / 呼叫资源 / 分机管理 | True | B |
| PAGE-2218 时间条件 | 呼叫中心 / 呼叫资源 / 时间条件 | True | B |
| PAGE-2219 AliCti账号管理 | 呼叫中心 / 供应服务 / 呼叫服务账号 | True | B |
| PAGE-2221 通话数据异常 | 呼叫中心 / 通话记录 / 通话数据异常 | True | B |
| PAGE-2105 AI通话统计 | 报表中心 / 智能报表 / 智能通话统计 | True | B |
| PAGE-2106 AI计费统计 | 报表中心 / 智能报表 / 智能计费统计 | True | B |
| PAGE-2107 AI线索统计 | 报表中心 / 智能报表 / 智能线索统计 | True | B |
| PAGE-2209 云呼叫统计报表 | 报表中心 / 云呼叫报表 | True | A A05 |
| PAGE-2003 账号与成员 | 系统管理 / 组织与权限 / 账号与成员 | True | A A01,A08,A10 |
| PAGE-2004 租户管理 | 系统管理 / 组织与权限 / 租户管理 | True | A A03,A04,A08,A10 |
| PAGE-2005 品牌管理 | 系统管理 / 组织与权限 / 品牌管理 | True | A A04,A08 |
| PAGE-2220 应用接入管理 | 系统管理 / 接入管理 / 应用接入 | True | B |
| PAGE-2222 云呼叫操作审计 | 系统管理 / 操作审计 / 操作审计 | True | B |
| PAGE-2109 AI线索记录与回访 | 隐藏页；旧AI侧栏隐藏且没有替代入口（A06） | False | A A06 |
| PAGE-2112 AI租户服务与充值详情 | 计划从有权租户服务进入；当前明示独立财务权域受阻（C01） | False | C |
| PAGE-2223 云呼叫业务字段配置 | 业务分类→原字段内部编辑；DCatalogEntries→DSharedConfiguration | False | B |
| PAGE-2225 全部坐席事件（原内部页） | 坐席作业→班长监控→事件日志→查看全部事件（原内部页） | False | B |
| PAGE-2226 业务数据的线索视图 | 业务台账→新模板批次→记录列表（受A01/A02影响） | False | A A01,A02 |
| PAGE-2227 业务记录详情 | 业务记录→详情（受A01/A02影响） | False | A A01,A02,A04 |
| PAGE-2101 AI概览（原AI首页）（历史来源，非当前菜单） | 历史来源，原能力迁入PAGE-2004,PAGE-2102 | 壳/来源 | D（独立页面取消，能力按目标另核） |
| PAGE-2104 AI拦截与专项名单（历史来源，非当前菜单） | 历史来源，原能力迁入PAGE-2007 | 壳/来源 | D（独立页面取消，能力按目标另核） |
| PAGE-2201 云呼叫概览（原工作台）（历史来源，非当前菜单） | 历史来源，原能力迁入PAGE-2004,PAGE-2202,PAGE-2204,PAGE-2205,PAGE-2206,PAGE-2209,PAGE-2210,PAGE-2215 | 壳/来源 | D（独立页面取消，能力按目标另核） |
| PAGE-2224 场景检查 / ACTION-2084 | source_auxiliary_pages保留出处；独立产品页已排除 | 否，不计43/46当前记录 | D：SRC-2100/2102 |

### 113动作逐项：入口、处理器、后态与权限

A只指所列缺陷分支；B表示代码已定位但没有本轮完整实跑。C01的3个财务动作当前受阻。每个原子保留引用列出实际来源函数，作为静态链依据；原函数成功后态的描述不是本轮观测成功声明。

| ACTION / PAGE / 动作 | 当前入口 | 当前处理器/代码定位（含原子引用） | 后态核查 | 当前权限依据 | 结论 |
| --- | --- | --- | --- | --- | --- |
| ACTION-2001 / PAGE-2001 提交登录 | 父壳登录/合法范围选择 | FUNC-2001: login/restore/selectScope @ P/js/components/session-store.js:80 | 合法身份、范围和原入口（本地Mock）；仅代码后态已定位，实际验证范围见核查总述 | DSession.actor/scopes/landing；真实AI认证属C02 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2002 / PAGE-2001 重新验证/返回登录 | 父壳登录/合法范围选择 | FUNC-2001: login/restore/selectScope @ P/js/components/session-store.js:80<br>FUNC-2004: logout/leave/dispose @ P/js/components/session-store.js:123 | 合法身份、范围和原入口（本地Mock）；统一退出本地会话；真实会话失效待核；仅代码后态已定位，实际验证范围见核查总述 | DSession.actor/scopes/landing；真实AI认证属C02 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2003 / PAGE-2002 切换有权导航区域及原业务页面 | 父壳五区域/租户切换/退出 | FUNC-2002: openPage/leave/renderNav @ P/js/app.js:59 | 合法页面与工作位置；仅代码后态已定位，实际验证范围见核查总述 | DSession.allowed＋leave＋原电话guard；不按区域授模块 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2004 / PAGE-2002 保存并离开 | 父壳五区域/租户切换/退出 | FUNC-2002: openPage/leave/renderNav @ P/js/app.js:59<br>FUNC-2003: scopeDialog/selectScope @ P/js/app.js:79<br>FUNC-2004: logout/leave/dispose @ P/js/components/session-store.js:123 | 合法页面与工作位置；切换合法范围并重建模块上下文；统一退出本地会话；真实会话失效待核；当前缺口分支：A08 | DSession.allowed＋leave＋原电话guard；不按区域授模块 | A A08；确证缺口仅指A08所述分支，不表示同动作其余实现全部不存在。 |
| ACTION-2005 / PAGE-2002 放弃本次普通草稿 | 父壳五区域/租户切换/退出 | FUNC-2002: openPage/leave/renderNav @ P/js/app.js:59<br>FUNC-2003: scopeDialog/selectScope @ P/js/app.js:79<br>FUNC-2004: logout/leave/dispose @ P/js/components/session-store.js:123 | 合法页面与工作位置；切换合法范围并重建模块上下文；统一退出本地会话；真实会话失效待核；仅代码后态已定位，实际验证范围见核查总述 | DSession.allowed＋leave＋原电话guard；不按区域授模块 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2006 / PAGE-2002 取消切换 | 父壳五区域/租户切换/退出 | FUNC-2002: openPage/leave/renderNav @ P/js/app.js:59<br>FUNC-2003: scopeDialog/selectScope @ P/js/app.js:79 | 合法页面与工作位置；切换合法范围并重建模块上下文；当前缺口分支：A08 | DSession.allowed＋leave＋原电话guard；不按区域授模块 | A A08；确证缺口仅指A08所述分支，不表示同动作其余实现全部不存在。 |
| ACTION-2007 / PAGE-2002 退出统一系统 | 父壳五区域/租户切换/退出 | FUNC-2004: logout/leave/dispose @ P/js/components/session-store.js:123 | 统一退出本地会话；真实会话失效待核；当前缺口分支：A08 | DSession.allowed＋leave＋原电话guard；不按区域授模块 | A A08；确证缺口仅指A08所述分支，不表示同动作其余实现全部不存在。 |
| ACTION-2086 / PAGE-2002 进入有权管理功能 | 父壳五区域/租户切换/退出 | FUNC-2002: openPage/leave/renderNav @ P/js/app.js:59 | 合法页面与工作位置；仅代码后态已定位，实际验证范围见核查总述 | DSession.allowed＋leave＋原电话guard；不按区域授模块 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2087 / PAGE-2002 返回来源业务位置 | 父壳五区域/租户切换/退出 | FUNC-2002: openPage/leave/renderNav @ P/js/app.js:59 | 合法页面与工作位置；仅代码后态已定位，实际验证范围见核查总述 | DSession.allowed＋leave＋原电话guard；不按区域授模块 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2049 / PAGE-2202 原本人电话准备/上线 | 坐席工作台 / 坐席作业 | cloud-seat-online: login @ Cloud/js/components/alicti-seat-operations.js:303<br>retained-source-cloud-seat-unpause: unpause @ Cloud/js/components/alicti-seat-operations.js:337 | 原资源条件满足后本人电话坐席上线；本人电话恢复已确认空闲状态；仅代码后态已定位，实际验证范围见核查总述 | DSession.allowed＋原AppState.canMenu/canAction、对象/tenantId/enterpriseId资格；真实映射C02 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2050 / PAGE-2202 本人主动外呼 | 坐席工作台 / 坐席作业 | FUNC-2024: check/checkBatch＋原执行入口guard @ P/js/components/contact-policy.js:66<br>cloud-manual-call: canCall @ Cloud/js/pages/customer-tasks.js:401; pick @ Cloud/js/pages/customer-tasks.js:403; dial @ Cloud/js/pages/agent-workbench.js:748 | 四类外呼执行前拦截；正常呼入保留；原电话流程受理本次呼叫并返回真实状态；仅代码后态已定位，实际验证范围见核查总述 | DSession.allowed＋原AppState.canMenu/canAction、对象/tenantId/enterpriseId资格；真实映射C02 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2051 / PAGE-2202 原呼入/预外呼接听 | 坐席工作台 / 坐席作业 | cloud-handle-incoming: canReceive @ Cloud/js/components/alicti-seat-operations.js:487; answerIncoming @ Cloud/js/pages/agent-workbench.js:679 | 按原呼入／预外呼接听方式处理本次通话；仅代码后态已定位，实际验证范围见核查总述 | DSession.allowed＋原AppState.canMenu/canAction、对象/tenantId/enterpriseId资格；真实映射C02 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2052 / PAGE-2202 保存本次跟进及拒联结果 | 坐席工作台 / 坐席作业 | FUNC-2022: AgentWorkbench.saveDisposition/publicRefusalEvent/humanRows @ P/scripts/build-modules.py:159<br>FUNC-2015: restrictToCurrentCall/saveDisposition @ P/js/adapters/cloud.js:73<br>cloud-save-followup: syncCall @ Cloud/js/pages/customer-tasks.js:428; saveDisposition @ Cloud/js/pages/agent-workbench.js:828<br>cloud-continue-followup: syncCall @ Cloud/js/pages/customer-tasks.js:428 | 话后保存与公共拒联来源一致；限当前已接通电话及必要话后收尾；本次通话归属、字段及原终态要求满足后保存成功；原坐席继续人工跟进且预测排他事实按实确认；仅代码后态已定位，实际验证范围见核查总述 | DSession.allowed＋原AppState.canMenu/canAction、对象/tenantId/enterpriseId资格；真实映射C02 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2088 / PAGE-2202 监管将有权目标坐席置忙 | 坐席工作台 / 坐席作业 | retained-source-cloud-supervise-seat-pause: manageSeat @ Cloud/js/components/alicti-seat-operations.js:448; rowActions,closeManage,drawManage,openManage @ Cloud/js/components/tenant-call-monitor.js:159 | 符合原状态和监控权限时确认目标电话状态变更；仅代码后态已定位，实际验证范围见核查总述 | DSession.allowed＋原AppState.canMenu/canAction、对象/tenantId/enterpriseId资格；真实映射C02 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2089 / PAGE-2202 监管将有权目标坐席置闲 | 坐席工作台 / 坐席作业 | retained-source-cloud-supervise-seat-unpause: manageSeat @ Cloud/js/components/alicti-seat-operations.js:448; rowActions,closeManage,drawManage,openManage @ Cloud/js/components/tenant-call-monitor.js:159 | 符合原状态和监控权限时确认目标电话状态变更；仅代码后态已定位，实际验证范围见核查总述 | DSession.allowed＋原AppState.canMenu/canAction、对象/tenantId/enterpriseId资格；真实映射C02 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2090 / PAGE-2202 监管将有权目标坐席离线 | 坐席工作台 / 坐席作业 | retained-source-cloud-supervise-seat-logout: manageSeat @ Cloud/js/components/alicti-seat-operations.js:448; rowActions,closeManage,drawManage,openManage @ Cloud/js/components/tenant-call-monitor.js:159 | 符合原状态和监控权限时确认目标电话状态变更；仅代码后态已定位，实际验证范围见核查总述 | DSession.allowed＋原AppState.canMenu/canAction、对象/tenantId/enterpriseId资格；真实映射C02 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2019 / PAGE-2006 新增业务分类 | 业务&客户 / 业务配置 / 业务分类 | FUNC-2016: BusinessConfiguration.open/CustomerBusiness.save @ Cloud/js/components/customer-business.js:726 | 品牌分类基础保存；仅代码后态已定位，实际验证范围见核查总述 | DSharedConfiguration.canManage＋品牌管理范围；旧目录见A07 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2020 / PAGE-2006 修改业务分类与字段 | 业务&客户 / 业务配置 / 业务分类 | FUNC-2017: CustomerBusiness.save/saveField @ Cloud/js/components/customer-business.js:726 | 基础/字段保存，路由独立；当前缺口分支：A07 | DSharedConfiguration.canManage＋品牌管理范围；旧目录见A07 | A A07；确证缺口仅指A07所述分支，不表示同动作其余实现全部不存在。 |
| ACTION-2021 / PAGE-2006 停用本租户分类 | 业务&客户 / 业务配置 / 业务分类 | FUNC-2018: CustomerBusiness.setEnabled @ Cloud/js/components/customer-business.js:874 | 旧目录启停；停用禁新选择而保原引用；当前缺口分支：A07 | DSharedConfiguration.canManage＋品牌管理范围；旧目录见A07 | A A07；确证缺口仅指A07所述分支，不表示同动作其余实现全部不存在。 |
| ACTION-2022 / PAGE-2006 进入有权AI场景及标签关联配置 | 业务&客户 / 业务配置 / 业务分类 | FUNC-2019: DCatalog.choices/current/save @ P/js/components/catalog-store.js:10 | 具体AI场景按稳定身份关联公共分类；仅代码后态已定位，实际验证范围见核查总述 | DSharedConfiguration.canManage＋品牌管理范围；旧目录见A07 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2111 / PAGE-2006 配置并保存单模板路由 | 业务&客户 / 业务配置 / 业务分类 | FUNC-2040: saveRoutePatch/routeRequestStatus @ Cloud/js/components/customer-business.js:756 | 独立单模板路由及精确版本预览；仅代码后态已定位，实际验证范围见核查总述 | DSharedConfiguration.canManage＋品牌管理范围；旧目录见A07 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2054 / PAGE-2204 导入业务数据 | 业务&客户 / 业务办理 / 业务台账 | FUNC-2036: previewImport/importRecords @ Cloud/js/components/business-flow-store.js:280<br>cloud-import-customers: prepare @ Cloud/js/pages/customer-tasks.js:208; confirmImport @ Cloud/js/pages/customer-tasks.js:225 | 按分类校验导入、稳定业务身份与行结果；原手动／接口方式导入结果可确认；仅代码后态已定位，实际验证范围见核查总述 | DSession.allowed＋原AppState.canMenu/canAction、对象/tenantId/enterpriseId资格；真实映射C02 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2055 / PAGE-2204 查询业务台账及导入批次 | 业务&客户 / 业务办理 / 业务台账 | FUNC-2039: CustomerTasks.render/openBatch/BusinessFlowStore.query @ Cloud/js/pages/customer-tasks.js:379<br>retained-source-cloud-import-batch-query: render @ Cloud/js/pages/customer-tasks.js:379<br>retained-source-cloud-import-batch-detail: detail @ Cloud/js/pages/customer-tasks.js:384 | 统一批次/记录查询、历史边界；按原权限/当前筛选显示可见导入批次列表，不连带任何准确批次导出能力。；以原批次ID解析准确可见批次，显示该批次客户、分配与跟进状态；原只读批次和空结果边界保持。；当前缺口分支：A01,A02 | DSession.allowed＋原AppState.canMenu/canAction、对象/tenantId/enterpriseId资格；真实映射C02 | A A01,A02；确证缺口仅指A01,A02所述分支，不表示同动作其余实现全部不存在。 |
| ACTION-2121 / PAGE-2204 分配所选业务记录 | 业务&客户 / 业务办理 / 业务台账 | FUNC-2037: assign/assignBatch @ Cloud/js/components/business-flow-store.js:281<br>cloud-assign-customers: assign @ Cloud/js/pages/customer-tasks.js:335; confirmAssignment @ Cloud/js/pages/customer-tasks.js:362 | 当前租户分配，批量同次原子保存；原合法方式分配给准确坐席；当前缺口分支：A01 | DSession.allowed＋原AppState.canMenu/canAction、对象/tenantId/enterpriseId资格；真实映射C02 | A A01；确证缺口仅指A01所述分支，不表示同动作其余实现全部不存在。 |
| ACTION-2112 / PAGE-2228 创建流转规则模板 | 业务&客户 / 业务配置 / 流转规则模板 | FUNC-2034: saveTemplate @ Cloud/js/components/business-flow-store.js:244 | 显式起点与空白节点创建保存；仅代码后态已定位，实际验证范围见核查总述 | DSharedConfiguration.canManage＋品牌范围＋版本/引用保护 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2113 / PAGE-2228 修改并保存模板新版本 | 业务&客户 / 业务配置 / 流转规则模板 | FUNC-2035: saveTemplate @ Cloud/js/components/business-flow-store.js:244 | 新版本保存，不改原实例快照；仅代码后态已定位，实际验证范围见核查总述 | DSharedConfiguration.canManage＋品牌范围＋版本/引用保护 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2114 / PAGE-2228 查看模板详情 | 业务&客户 / 业务配置 / 流转规则模板 | FUNC-2041: FlowConfiguration.viewDetails @ Cloud/js/pages/flow-configuration.js:96 | 精确模板版本只读详情；仅代码后态已定位，实际验证范围见核查总述 | DSharedConfiguration.canManage＋品牌范围＋版本/引用保护 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2115 / PAGE-2228 删除未被引用模板 | 业务&客户 / 业务配置 / 流转规则模板 | FUNC-2042: deleteTemplate @ Cloud/js/components/business-flow-store.js:231 | 所有当前/历史/待核引用为空才删除；仅代码后态已定位，实际验证范围见核查总述 | DSharedConfiguration.canManage＋品牌范围＋版本/引用保护 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2023 / PAGE-2007 查询名单及详情 | 业务&客户 / 客户维护 / 联系限制 | FUNC-2020: DContactPolicy.list/getSpecial @ P/js/components/contact-policy.js:26<br>FUNC-2021: detail/scene-block.renderRecordDetail @ P/js/pages/contacts.js:23<br>retained-source-ai-legacy-ban-query-groups: renderGroups @ AI/js/pages/scene-block.js:134<br>retained-source-ai-legacy-ban-query-records: filteredRows,renderRows @ AI/js/pages/scene-block.js:150<br>retained-source-ai-legacy-ban-view-record: renderRecordDetail @ AI/js/pages/scene-block.js:416 | 当前范围公共及专项记录；准确来源详情与分平台状态；本地分组及原范围/期限/同步摘要；当前分组本地记录结果；本地原因/期限/来源与已有电声同步显示；仅代码后态已定位，实际验证范围见核查总述 | canPublic(view/add/release)与canSpecial(scope,operation)分开 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2024 / PAGE-2007 人工确认AI拒联并加入公共禁呼 | 业务&客户 / 客户维护 / 联系限制 | FUNC-2023: openAIRefusal/ContactPolicy.add @ P/js/pages/contacts.js:25 | 有权人工确认后加入本租户公共名单；仅代码后态已定位，实际验证范围见核查总述 | canPublic(view/add/release)与canSpecial(scope,operation)分开 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2025 / PAGE-2007 解除本条公共禁呼 | 业务&客户 / 客户维护 / 联系限制 | FUNC-2025: release @ P/js/components/contact-policy.js:35 | 管理员按单条来源解除并留因；仅代码后态已定位，实际验证范围见核查总述 | canPublic(view/add/release)与canSpecial(scope,operation)分开 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2026 / PAGE-2007 查看原供应商同步结果 | 业务&客户 / 客户维护 / 联系限制 | FUNC-2021: detail/scene-block.renderRecordDetail @ P/js/pages/contacts.js:23<br>retained-source-ai-legacy-ban-view-sync-config: renderSyncSettings,renderAddPlatform,renderPlatformDetail @ AI/js/pages/scene-block.js:274 | 准确来源详情与分平台状态；显示原绑定信息/远端分组码/状态/失败原因；仅代码后态已定位，实际验证范围见核查总述 | canPublic(view/add/release)与canSpecial(scope,operation)分开 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2092 / PAGE-2007 新增AI专项名单分组 | 业务&客户 / 客户维护 / 联系限制 | retained-source-ai-legacy-ban-create-group: submitGroup @ AI/js/pages/scene-block.js:473 | 本地创建名称/描述/期限/空绑定；仅代码后态已定位，实际验证范围见核查总述 | canPublic(view/add/release)与canSpecial(scope,operation)分开 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2093 / PAGE-2007 修改AI专项名单分组 | 业务&客户 / 客户维护 / 联系限制 | retained-source-ai-legacy-ban-update-group: submitGroup @ AI/js/pages/scene-block.js:473 | 更新本地组名称/描述/期限；仅代码后态已定位，实际验证范围见核查总述 | canPublic(view/add/release)与canSpecial(scope,operation)分开 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2094 / PAGE-2007 删除空AI专项名单分组 | 业务&客户 / 客户维护 / 联系限制 | retained-source-ai-legacy-ban-delete-group: requestRemoveGroup,confirmAction @ AI/js/pages/scene-block.js:659 | 非空阻断，空分组本地删除；仅代码后态已定位，实际验证范围见核查总述 | canPublic(view/add/release)与canSpecial(scope,operation)分开 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2095 / PAGE-2007 新增AI专项限制号码 | 业务&客户 / 客户维护 / 联系限制 | retained-source-ai-legacy-ban-add-number: submitNumber @ AI/js/pages/scene-block.js:556 | 有效非重复号码加入当前组，继承期限/待同步；仅代码后态已定位，实际验证范围见核查总述 | canPublic(view/add/release)与canSpecial(scope,operation)分开 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2096 / PAGE-2007 批量导入AI专项限制号码 | 业务&客户 / 客户维护 / 联系限制 | retained-source-ai-legacy-ban-import-numbers: submitImport @ AI/js/pages/scene-block.js:573 | 前端最多50号码按格式/重复计数加入组；仅代码后态已定位，实际验证范围见核查总述 | canPublic(view/add/release)与canSpecial(scope,operation)分开 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2097 / PAGE-2007 移动AI专项名单分组 | 业务&客户 / 客户维护 / 联系限制 | retained-source-ai-legacy-ban-move-numbers: submitMove @ AI/js/pages/scene-block.js:628 | 本地换组/继承目标期限/清同步状态并模拟目标同步；仅代码后态已定位，实际验证范围见核查总述 | canPublic(view/add/release)与canSpecial(scope,operation)分开 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2098 / PAGE-2007 移除AI专项限制记录 | 业务&客户 / 客户维护 / 联系限制 | retained-source-ai-legacy-ban-remove-numbers: requestRemoveNumber,requestRemoveSelected,requestRemoveGroup,confirmAction @ AI/js/pages/scene-block.js:649 | 本地filter删除号码并刷新；没有真实先远端解除实证；仅代码后态已定位，实际验证范围见核查总述 | canPublic(view/add/release)与canSpecial(scope,operation)分开 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2099 / PAGE-2007 启用AI专项分组同步 | 业务&客户 / 客户维护 / 联系限制 | retained-source-ai-legacy-ban-enable-sync: submitAddPlatform @ AI/js/pages/scene-block.js:492 | 本地创建绑定，已有号码标待同步/无号码待首条；仅代码后态已定位，实际验证范围见核查总述 | canPublic(view/add/release)与canSpecial(scope,operation)分开 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2100 / PAGE-2007 停用AI专项分组同步 | 业务&客户 / 客户维护 / 联系限制 | retained-source-ai-legacy-ban-disable-sync: requestDisablePlatform,requestRemoveNumber,requestRemoveSelected,requestRemoveGroup,confirmAction @ AI/js/pages/scene-block.js:644 | 删除本地绑定/状态；提示远端已同步号码不会自动删除；仅代码后态已定位，实际验证范围见核查总述 | canPublic(view/add/release)与canSpecial(scope,operation)分开 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2101 / PAGE-2007 重试AI专项名单同步 | 业务&客户 / 客户维护 / 联系限制 | retained-source-ai-legacy-ban-retry-sync: retryPlatform,submitNumber,submitImport,retryRecord,retrySelected @ AI/js/pages/scene-block.js:545 | 本地待同步→同步中→定时已同步；不能当远端回执；仅代码后态已定位，实际验证范围见核查总述 | canPublic(view/add/release)与canSpecial(scope,operation)分开 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2053 / PAGE-2203 查询客户档案及原详情 | 业务&客户 / 客户维护 / 客户联系 | cloud-query-customers: list @ Cloud/js/components/customer-directory.js:142<br>cloud-view-customer: openDetail @ Cloud/js/pages/customer-directory.js:93 | 原有权档案查询结果；有权的原客户详情及跟进记录；仅代码后态已定位，实际验证范围见核查总述 | DSession.allowed＋原AppState.canMenu/canAction、对象/tenantId/enterpriseId资格；真实映射C02 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2028 / PAGE-2102 查询原AI使用情况 | 呼叫中心 / 供应服务 / 智能用量服务 | ai-query-usage-days: renderOverview,renderDailyRows,renderTenantPage @ AI/js/pages/usage.js:58<br>ai-query-usage-tasks: renderTaskDetailForTenant,renderForTenant,render,retry,openDailyDetail @ AI/js/pages/usage.js:111 | 原当前租户的日明细列表；所选日的原任务用量明细；仅代码后态已定位，实际验证范围见核查总述 | DSession.allowed/canWrite＋原AI页/对象资格；真实粒度映射C02 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2029 / PAGE-2103 查询原任务列表/详情 | 呼叫中心 / 呼叫执行 / 智能外呼 | ai-query-tasks: renderCard,render,doQuery @ AI/js/pages/scene-list.js:110<br>ai-view-task: renderMainTabContent,showDetail @ AI/js/pages/scene-list.js:943<br>ai-query-call-list: getCurrentAssignedRows,removeAssigned,renderSubContent,switchSubTab,switchMainTab,renderMainTabContent @ AI/js/pages/scene-list.js:863<br>ai-save-intent-config: toggleIntentOption,closeIntentConfig,saveIntentConfig @ AI/js/pages/scene-list.js:793 | 当前有权AI任务卡片结果；指定任务的原详情视图；任务内已分配／待呼叫／已呼叫／已过滤／失败记录；原意向配置合法生效；仅代码后态已定位，实际验证范围见核查总述 | DSession.allowed/canWrite＋原AI页/对象资格；真实粒度映射C02 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2030 / PAGE-2103 原任务呼叫名单手动导入 | 呼叫中心 / 呼叫执行 / 智能外呼 | ai-import-task-contacts: doStartUpload @ AI/js/pages/scene-list.js:1271; applyImportResults @ AI/js/pages/scene-list.js:1112<br>retained-source-ai-download-import-template: downloadTemplate @ AI/js/pages/scene-list.js:1343 | 按原规则呈现本地号码校验、名单数量与导入历史结果；远端受理/可靠结果另核。；生成含手机号、姓名、备注列及示例行的CSV并发起浏览器下载，不依赖某次导入批次结果。；仅代码后态已定位，实际验证范围见核查总述 | DSession.allowed/canWrite＋原AI页/对象资格；真实粒度映射C02 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2031 / PAGE-2103 查询原导入记录 | 呼叫中心 / 呼叫执行 / 智能外呼 | ai-query-import-records: renderImportRecordContent,switchImportTab @ AI/js/pages/scene-list.js:1189 | 查询原任务的本地导入历史批次及成功/失败/有效计数；不连带准确批次CSV取数或导出授权。；仅代码后态已定位，实际验证范围见核查总述 | DSession.allowed/canWrite＋原AI页/对象资格；真实粒度映射C02 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2032 / PAGE-2103 原已分配名单单条移除 | 呼叫中心 / 呼叫执行 / 智能外呼 | ai-remove-assigned-contact: getCurrentAssignedRows,removeAssigned @ AI/js/pages/scene-list.js:863 | 按原单条能力处理目标记录；仅代码后态已定位，实际验证范围见核查总述 | DSession.allowed/canWrite＋原AI页/对象资格；真实粒度映射C02 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2038 / PAGE-2108 查询原通话记录/详情 | 呼叫中心 / 智能通话记录 | ai-query-call-records: getFilteredRows,renderRow,renderRows @ AI/js/pages/result-records.js:196<br>ai-view-call-record: resolveDetailContext,renderAudioSection,renderOutboundResult,renderInfoValue,renderDetailInfo,renderRightPanel,renderDetailModal,showDetail,closeDetail,switchDetailTab @ AI/js/pages/result-records.js:289 | 有权范围内原通话记录查询结果；有权查看的准确通话详情及原录音／文本字段；仅代码后态已定位，实际验证范围见核查总述 | DSession.allowed/canWrite＋原AI页/对象资格；真实粒度映射C02 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2039 / PAGE-2108 从有权来源记录进入人工拒联确认 | 呼叫中心 / 智能通话记录 | FUNC-2023: openAIRefusal/ContactPolicy.add @ P/js/pages/contacts.js:25 | 有权人工确认后加入本租户公共名单；当前缺口分支：A09 | DSession.allowed/canWrite＋原AI页/对象资格；真实粒度映射C02 | A A09；确证缺口仅指A09所述分支，不表示同动作其余实现全部不存在。 |
| ACTION-2042 / PAGE-2110 原业务场景查询与已有配置操作 | 呼叫中心 / 智能配置 / 智能业务场景 | retained-source-ai-business-scene-create: submitAddModal @ AI/js/pages/sys-scene.js:1632<br>retained-source-ai-business-scene-delete: showDeleteConfirm,closeDeleteConfirm,confirmDeleteScene @ AI/js/pages/sys-scene.js:56<br>retained-source-ai-business-scene-query: renderSceneRowsHtml,refreshSceneTable @ AI/js/pages/sys-scene.js:28<br>retained-source-ai-business-scene-update: submitAddModal @ AI/js/pages/sys-scene.js:1632 | SceneRows新增独立业务场景记录并刷新；从SceneRows删除该对象；进行中阻断；SceneRows列表，含名称/编码/类型/平台/租户/更新时间；原SceneRows对象按数据更新，保留供应商专业参数；仅代码后态已定位，实际验证范围见核查总述 | DSession.allowed/canWrite＋原AI页/对象资格；真实粒度映射C02 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2043 / PAGE-2111 维护原标签及供应商配置 | 呼叫中心 / 智能配置 / 智能标签 | retained-source-ai-local-tag-create: addNewLocalTag @ AI/js/pages/sys-tags.js:1017<br>retained-source-ai-local-tag-delete: deleteLocalTag @ AI/js/pages/sys-tags.js:1118<br>retained-source-ai-local-tag-query: buildLocalTagSetHTML @ AI/js/pages/sys-tags.js:257<br>retained-source-ai-local-tag-update: saveLocalTagEdit @ AI/js/pages/sys-tags.js:1069<br>retained-source-ai-scene-type-create: addNewScene @ AI/js/pages/sys-tags.js:1287<br>retained-source-ai-scene-type-delete: deleteScene @ AI/js/pages/sys-tags.js:1262<br>retained-source-ai-scene-type-disable: toggleSceneStatus @ AI/js/pages/sys-tags.js:1252<br>retained-source-ai-scene-type-enable: toggleSceneStatus @ AI/js/pages/sys-tags.js:1252<br>retained-source-ai-scene-type-query: buildSceneModalHTML,buildSceneTableHTML @ AI/js/pages/sys-tags.js:300<br>retained-source-ai-scene-type-update: saveSceneEdit @ AI/js/pages/sys-tags.js:1216<br>retained-source-ai-supplier-tag-create: addNewTag @ AI/js/pages/sys-tags.js:990<br>retained-source-ai-supplier-tag-delete: deleteTag @ AI/js/pages/sys-tags.js:953<br>retained-source-ai-supplier-tag-query: buildTagListHTML @ AI/js/pages/sys-tags.js:174<br>retained-source-ai-supplier-tag-update: saveTagEdit @ AI/js/pages/sys-tags.js:876<br>retained-source-ai-tag-config-disable: toggleTagEnable @ AI/js/pages/sys-tags.js:793<br>retained-source-ai-tag-config-enable: toggleTagEnable @ AI/js/pages/sys-tags.js:793<br>retained-source-ai-tag-local-mapping-save: updateLocalMapping @ AI/js/pages/sys-tags.js:760<br>retained-source-ai-tag-supplier-create: addNewSupplier @ AI/js/pages/sys-tags.js:1438<br>retained-source-ai-tag-supplier-disable: toggleSupplierStatus @ AI/js/pages/sys-tags.js:1429<br>retained-source-ai-tag-supplier-enable: toggleSupplierStatus @ AI/js/pages/sys-tags.js:1429<br>retained-source-ai-tag-supplier-query: buildSupplierModalHTML,buildSupplierTableHTML @ AI/js/pages/sys-tags.js:343<br>retained-source-ai-tag-supplier-update: saveSupplierEdit @ AI/js/pages/sys-tags.js:1395 | 在租户类型×场景本地标签集新增唯一名称/编码/排序；删除本地标签并清空供应商指向它的映射；只读本地标签码/名称/排序结果；保存本地名称/排序并校验同集重名；MockTagScenes新增名称/本地码/启用状态；删除分类并清空当前面板；有配置时阻断；分类status变disabled，标签配置上下文相应受限；分类status变enabled并刷新树；场景名/本地码/状态列表；只更新分类名称并刷新树；同供应商标签池新增名称/本地码/排序，重名阻断；从池/相关启用配置/本地映射清除该标签；标签池/启用状态/本地映射及查询筛选结果；更新池中名称/排序并移位同池排序；标签ID退出当前配置，标签池原对象保留；标签ID进入当前supplier_type_scene配置，自动补已有映射；更新/清除MockSupplierLocalTagMappings对应关系；目录新增名称/本地码/启用状态及空标签池；供应商状态disabled并限制该配置上下文；供应商状态enabled；MockTagSuppliers名称/码/启停状态列表；修改名称并刷新树；当前缺口分支：A12 | AI操作角色＋具体场景/供应商/租户类型/标签场景校验 | A A12；确证缺口仅指A12所述分支，不表示同动作其余实现全部不存在。 |
| ACTION-2044 / PAGE-2111 设置/修改具体AI业务场景的公共分类关联 | 呼叫中心 / 智能配置 / 智能标签 | FUNC-2019: DCatalog.choices/current/save @ P/js/components/catalog-store.js:10 | 具体AI场景按稳定身份关联公共分类；当前缺口分支：A07 | AI操作角色＋具体场景/供应商/租户类型/标签场景校验 | A A07；确证缺口仅指A07所述分支，不表示同动作其余实现全部不存在。 |
| ACTION-2056 / PAGE-2205 查询原预测任务/详情 | 呼叫中心 / 呼叫执行 / 预外呼任务 | predictive-query: taskRows @ Cloud/js/pages/cloud-call-tasks.js:23<br>predictive-detail: openTask @ Cloud/js/pages/cloud-task-workspace.js:1875; renderCenter @ Cloud/js/pages/cloud-task-workspace.js:2164 | 当前租户原任务列表结果；准确本任务的详情与执行结果；仅代码后态已定位，实际验证范围见核查总述 | DSession.allowed＋原AppState.canMenu/canAction、对象/tenantId/enterpriseId资格；真实映射C02 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2057 / PAGE-2205 原任务新建/编辑 | 呼叫中心 / 呼叫执行 / 预外呼任务 | predictive-create: submit @ Cloud/js/pages/cloud-task-workspace.js:1488<br>predictive-edit: submitEdit @ Cloud/js/pages/cloud-task-workspace.js:1618; taskEditReason @ Cloud/js/pages/cloud-task-workspace.js:1800 | 原向导生成合法任务配置；当前任务允许的原配置更新；仅代码后态已定位，实际验证范围见核查总述 | DSession.allowed＋原AppState.canMenu/canAction、对象/tenantId/enterpriseId资格；真实映射C02 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2058 / PAGE-2205 原任务客户导入 | 呼叫中心 / 呼叫执行 / 预外呼任务 | predictive-import: openManual @ Cloud/js/components/dcc-records.js:600; submitManual @ Cloud/js/components/dcc-records.js:755 | 本地导入及供应商逐条处理结果按实保存；仅代码后态已定位，实际验证范围见核查总述 | DSession.allowed＋原AppState.canMenu/canAction、对象/tenantId/enterpriseId资格；真实映射C02 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2059 / PAGE-2205 按原状态办理执行/控制 | 呼叫中心 / 呼叫执行 / 预外呼任务 | FUNC-2024: check/checkBatch＋原执行入口guard @ P/js/components/contact-policy.js:66<br>predictive-execute: dispatchPending @ Cloud/js/components/dcc-runtime.js:357<br>predictive-recall: validate @ Cloud/js/components/alicti-retry.js:15; supplierRetryEditor @ Cloud/js/pages/cloud-task-workspace.js:983<br>predictive-resubmit: retryEligibility @ Cloud/js/components/dcc-runtime.js:1063; executeFailureRetry @ Cloud/js/components/dcc-runtime.js:1147<br>predictive-pause: controlTask @ Cloud/js/pages/cloud-task-workspace.js:2249<br>predictive-end: controlTask @ Cloud/js/pages/cloud-task-workspace.js:2249 | 四类外呼执行前拦截；正常呼入保留；合法本次尝试交原电话执行并取得实际受理状态；符合原重呼条件的下一次尝试按原预算发起；本次原规则允许补提交形成可确认受理结果；原可暂停状态的控制回执可确认；原结束控制结果可确认；仅代码后态已定位，实际验证范围见核查总述 | DSession.allowed＋原AppState.canMenu/canAction、对象/tenantId/enterpriseId资格；真实映射C02 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2060 / PAGE-2205 原任务结果查询与失败下载 | 呼叫中心 / 呼叫执行 / 预外呼任务 | FUNC-2043: centerCustomers/exportTaskCustomers @ Cloud/js/pages/cloud-task-workspace.js:2033<br>predictive-download-failures: downloadFailureSnapshot @ Cloud/js/components/dcc-records.js:486; recordSnapshotDownload @ Cloud/js/components/dcc-runtime.js:874<br>retained-source-predictive-export-tasks: exportTasks @ Cloud/js/pages/cloud-call-tasks.js:149 | 当前任务真实有权非空集合的原六列CSV；取得可信失败文件并按最终规则处理对应清理；按原预外呼筛选记录生成本地CSV；无数据/生成失败按原提示处理，不证明远端或生产数据准确。；当前缺口分支：A11 | DSession.allowed＋原AppState.canMenu/canAction、对象/tenantId/enterpriseId资格；真实映射C02 | A A11；确证缺口仅指A11所述分支，不表示同动作其余实现全部不存在。 |
| ACTION-2061 / PAGE-2206 原IVR任务新建/编辑 | 呼叫中心 / 呼叫执行 / 语音外呼 | ivr-create: submit @ Cloud/js/pages/cloud-task-workspace.js:1488<br>ivr-edit: submitEdit @ Cloud/js/pages/cloud-task-workspace.js:1618; taskEditReason @ Cloud/js/pages/cloud-task-workspace.js:1800 | 原语音流程及外显等资源合法的任务生成；原允许配置合法更新；仅代码后态已定位，实际验证范围见核查总述 | DSession.allowed＋原AppState.canMenu/canAction、对象/tenantId/enterpriseId资格；真实映射C02 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2062 / PAGE-2206 原IVR名单处理 | 呼叫中心 / 呼叫执行 / 语音外呼 | ivr-import: openCustomerImport @ Cloud/js/pages/cloud-task-workspace.js:1935; canImportToTask @ Cloud/js/pages/customer-tasks.js:168 | 原方式的名单校验及处理结果可确认；仅代码后态已定位，实际验证范围见核查总述 | DSession.allowed＋原AppState.canMenu/canAction、对象/tenantId/enterpriseId资格；真实映射C02 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2063 / PAGE-2206 原IVR执行/控制 | 呼叫中心 / 呼叫执行 / 语音外呼 | FUNC-2024: check/checkBatch＋原执行入口guard @ P/js/components/contact-policy.js:66<br>ivr-execute: guard @ Cloud/js/components/alicti-task-control.js:30<br>retained-source-ivr-pause: taskPage @ Cloud/js/pages/cloud-call-tasks.js:47; openTask @ Cloud/js/pages/cloud-call-tasks.js:141; controlTask @ Cloud/js/pages/cloud-task-workspace.js:2249<br>retained-source-ivr-resume: taskPage @ Cloud/js/pages/cloud-call-tasks.js:47; openTask @ Cloud/js/pages/cloud-call-tasks.js:141; openTask @ Cloud/js/pages/cloud-task-workspace.js:1875; renderCenter @ Cloud/js/pages/cloud-task-workspace.js:2164; centerActions @ Cloud/js/pages/cloud-task-workspace.js:1955; controlTask @ Cloud/js/pages/cloud-task-workspace.js:2249<br>retained-source-ivr-end: taskPage @ Cloud/js/pages/cloud-call-tasks.js:47; openTask @ Cloud/js/pages/cloud-call-tasks.js:141; openTask @ Cloud/js/pages/cloud-task-workspace.js:1875; renderCenter @ Cloud/js/pages/cloud-task-workspace.js:2164; centerActions @ Cloud/js/pages/cloud-task-workspace.js:1955; controlTask @ Cloud/js/pages/cloud-task-workspace.js:2249<br>retained-source-ivr-delete-task: taskPage @ Cloud/js/pages/cloud-call-tasks.js:47; openTask @ Cloud/js/pages/cloud-call-tasks.js:141; deleteTask @ Cloud/js/pages/cloud-task-workspace.js:2257 | 四类外呼执行前拦截；正常呼入保留；按原语音流程受理／执行本次触达；准确taskId与原pause动作交原AliCtiAdapter；供应商执行/不确定回执按原待核边界，不以本源码证明真实成功。；准确taskId与原resume动作交原AliCtiAdapter；供应商执行/不确定回执按原待核边界，不以本源码证明真实成功。；准确taskId与原terminate动作交原AliCtiAdapter；供应商执行/不确定回执按原待核边界，不以本源码证明真实成功。；原任务条件/对象权限下执行删除确认和本地持久、关联名单释放或失败回滚，保留历史。；仅代码后态已定位，实际验证范围见核查总述 | DSession.allowed＋原AppState.canMenu/canAction、对象/tenantId/enterpriseId资格；真实映射C02 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2064 / PAGE-2206 原IVR查询/详情/已有导出 | 呼叫中心 / 呼叫执行 / 语音外呼 | ivr-query: taskRows @ Cloud/js/pages/cloud-call-tasks.js:23<br>ivr-detail: openTask @ Cloud/js/pages/cloud-task-workspace.js:1875; renderCenter @ Cloud/js/pages/cloud-task-workspace.js:2164<br>retained-source-ivr-export-tasks: exportTasks @ Cloud/js/pages/cloud-call-tasks.js:149 | 当前租户原任务列表结果；原准确任务及客户结果可查看；按原IVR 外呼筛选记录生成本地CSV；无数据/生成失败按原提示处理，不证明远端或生产数据准确。；仅代码后态已定位，实际验证范围见核查总述 | DSession.allowed＋原AppState.canMenu/canAction、对象/tenantId/enterpriseId资格；真实映射C02 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2065 / PAGE-2207 查询与维护原呼入服务规则 | 呼叫中心 / 呼入服务 | retained-source-cloud-inbound-rule-query: render @ Cloud/js/pages/inbound-routing.js:22; allowed @ Cloud/js/components/alicti-inbound.js:10; list @ Cloud/js/components/alicti-inbound.js:29; write @ Cloud/js/components/alicti-inbound.js:92<br>retained-source-cloud-inbound-rule-detail: openRoute @ Cloud/js/pages/inbound-routing.js:46; render @ Cloud/js/pages/inbound-routing.js:22; allowed @ Cloud/js/components/alicti-inbound.js:10; list @ Cloud/js/components/alicti-inbound.js:29; write @ Cloud/js/components/alicti-inbound.js:92<br>retained-source-cloud-inbound-rule-create: save @ Cloud/js/pages/inbound-routing.js:74; save @ Cloud/js/components/alicti-inbound.js:105<br>retained-source-cloud-inbound-rule-edit: save @ Cloud/js/pages/inbound-routing.js:74; save @ Cloud/js/components/alicti-inbound.js:105<br>retained-source-cloud-inbound-rule-enable: changeActive @ Cloud/js/pages/inbound-routing.js:90; allowed @ Cloud/js/components/alicti-inbound.js:10; list @ Cloud/js/components/alicti-inbound.js:29; write @ Cloud/js/components/alicti-inbound.js:92<br>retained-source-cloud-inbound-rule-disable: changeActive @ Cloud/js/pages/inbound-routing.js:90; allowed @ Cloud/js/components/alicti-inbound.js:10; list @ Cloud/js/components/alicti-inbound.js:29; write @ Cloud/js/components/alicti-inbound.js:92<br>retained-source-cloud-inbound-rule-delete: remove @ Cloud/js/pages/inbound-routing.js:94; remove @ Cloud/js/components/alicti-inbound.js:121 | 显示原条件/优先级下的可见呼入规则列表，保原失败反馈。；原id与当前context下只读查看原条件、接听去向、备注与状态；readonly详情不出现保存入口。；原合法字段/范围/唯一优先级校验后形成本地模拟创建结果；失败/未知保持原反馈与核对记录。；原id/context/local revision下修改原允许字段并保存本地模拟结果；优先级重复/范围/过期和失败保持原边界。；在原允许范围下确认启用，原mock write成功/失败/未知与核对结果分别保留。；在原允许范围下确认停用，原mock write成功/失败/未知与核对结果分别保留。；原停用/范围/待核保护通过后确认删除本地模拟记录；失败/未知按原核对处理。；仅代码后态已定位，实际验证范围见核查总述 | DSession.allowed＋原AppState.canMenu/canAction、对象/tenantId/enterpriseId资格；真实映射C02 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2066 / PAGE-2208 查询原话单与详情 | 呼叫中心 / 云呼叫记录 | cloud-query-call-records: recordRows @ Cloud/js/pages/cloud-call-records.js:131<br>cloud-view-call-detail: openCall @ Cloud/js/pages/cloud-call-records.js:222 | 有权的原通话记录结果；原话单详情及有权媒体信息；仅代码后态已定位，实际验证范围见核查总述 | DSession.allowed＋原AppState.canMenu/canAction、对象/tenantId/enterpriseId资格；真实映射C02 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2067 / PAGE-2208 原已有导出 | 呼叫中心 / 云呼叫记录 | retained-source-cloud-export-call-records: exportRecords @ Cloud/js/pages/cloud-call-records.js:184 | 原有权Cloud通话记录按现筛选生成本地CSV；原导出资格、无数据/失败边界保持。；仅代码后态已定位，实际验证范围见核查总述 | DSession.allowed＋原AppState.canMenu/canAction、对象/tenantId/enterpriseId资格；真实映射C02 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2070 / PAGE-2210 原坐席维护允许的独立操作 | 呼叫中心 / 坐席资源 / 坐席维护 | retained-source-cloud-seat-detail: openAgent @ Cloud/js/pages/agent-center.js:133<br>retained-source-cloud-seat-restore: restore @ Cloud/js/pages/agent-center.js:193<br>retained-source-cloud-seat-disable: disable @ Cloud/js/pages/agent-center.js:183<br>retained-source-cloud-seat-delete: remove @ Cloud/js/pages/agent-center.js:194<br>retained-source-cloud-seat-query: renderAgents @ Cloud/js/pages/agent-center.js:34<br>retained-source-cloud-seat-create: createSingle @ Cloud/js/pages/agent-center.js:102<br>retained-source-cloud-seat-phone-config: savePhoneConfig @ Cloud/js/pages/agent-center.js:161<br>retained-source-cloud-seat-sync-existing: submit @ Cloud/js/components/alicti-seat-import.js:115<br>retained-source-cloud-seat-batch-create: submit @ Cloud/js/components/alicti-seat-import.js:115<br>retained-source-cloud-seat-verify-batch-create: verifyPending @ Cloud/js/components/alicti-seat-import.js:89 | 按原范围完成“查看详情坐席”并保留实际/待核结果；按原范围完成“恢复启用坐席”并保留实际/待核结果；按原范围完成“停用坐席”并保留实际/待核结果；按原范围完成“删除坐席”并保留实际/待核结果；保原工作范围/技能上下文，用原筛选回显同列表；源仅本地模拟，不扩大菜单资格或生产权限。；按原范围完成“新增坐席”并保留实际/待核结果；保原工作范围/租户/坐席及表单上下文，独立用户保存后仅认原guard允许的本地模拟结果。新坐席成功但可选技能分配失败时，原坐席独立成功/技能需补配反馈保留，不虚构整批回滚。；按原范围完成“保存软电话分机配置坐席”并保留实际/待核结果；保原工作范围/租户/坐席及表单上下文，独立用户保存后仅认原guard允许的本地模拟结果。上线/在用/目录版本或分配范围变化仍由原组件锁和复核拒绝；留空维持待配置不能上线。；原合法工号资料映射到本地坐席，已有本地工号不重复创建；原账号/租户/context/模式及原选择或预检查守卫保持，仅本地mock和原分项结果。既有坐席跳过且保姓名/技能，原逐项成功/跳过/失败保留；不额外宣称批量原子性。；逐工号开通结果准确记录；未知回执不重复创建；原账号/租户/context/模式及原选择或预检查守卫保持，仅本地mock和原分项结果。原回执unknown/partial继续记录pending/已建/未建分项，不将差额自动成功，不重新创建待核工号。；原开通结果按工号核对且保留未知项；原账号/租户/context/模式及原选择或预检查守卫保持，仅本地mock和原分项结果。只按原同journal id/cnos查证并区分确认、未确认、本地失败；未确认继续pending，不自动重建，不保证写后UI失败回滚。；仅代码后态已定位，实际验证范围见核查总述 | DSession.allowed＋原AppState.canMenu/canAction、对象/tenantId/enterpriseId资格；真实映射C02 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2071 / PAGE-2211 原技能/映射及分组等级允许的维护操作 | 呼叫中心 / 坐席资源 / 技能管理 | retained-source-cloud-agent-skill-query: renderSkills @ Cloud/js/pages/agent-center.js:37<br>retained-source-cloud-agent-skill-unassign: unassign @ Cloud/js/pages/agent-center.js:268<br>retained-source-cloud-agent-skill-submit-pending: submitPendingSkills @ Cloud/js/pages/agent-center.js:229<br>retained-source-cloud-agent-skill-level: changeLevel @ Cloud/js/pages/agent-center.js:243<br>retained-source-cloud-skill-query: renderSkillMappings @ Cloud/js/pages/contact-center-settings.js:75<br>retained-source-cloud-skill-detail: openGroup @ Cloud/js/pages/contact-center-settings.js:87<br>retained-source-cloud-skill-create: saveMapping @ Cloud/js/pages/contact-center-settings.js:109<br>retained-source-cloud-skill-edit: saveMapping @ Cloud/js/pages/contact-center-settings.js:109<br>retained-source-cloud-agent-skill-add: saveSkill @ Cloud/js/pages/agent-center.js:216 | 保原工作范围/技能上下文，用原筛选回显同列表；源仅本地模拟，不扩大菜单资格或生产权限。；按原范围完成“移出技能坐席技能关系”并保留实际/待核结果；原关系id/技能范围、坐席状态、同租户账号及失败反馈保持；仅正常满足原guard分支的本地模拟结果。；按原范围完成“提交离线后待提交技能坐席技能关系”并保留实际/待核结果；原关系id/技能范围、坐席状态、同租户账号及失败反馈保持；仅正常满足原guard分支的本地模拟结果。；按原范围完成“调整技能等级坐席技能关系”并保留实际/待核结果；原关系id/技能范围、坐席状态、同租户账号及失败反馈保持；仅正常满足原guard分支的本地模拟结果。发现旧范围等级时仍转原全部等级修复表单，未保存前保原配置；不计为本handler已成功提交。；原技能工作范围内消费skills筛选，回显同skill-mappings列表；权限、技能来源/同步状态和原本地模拟边界保持。；保原租户/技能范围及context，原完整openGroup打开成员与业务引用的只读详情；查询不自动授予成员维护权，不冒充真实供应商同步。；原editContext/editingId/租户及重名/标识冲突校验后本地保存技能；syncStatus仍为“本地已保存，真实结果待确认”，不把AliCti模拟结果当生产同步成功。；按原范围完成“添加已有坐席到技能坐席技能关系”并保留实际/待核结果；保原工作范围/租户/坐席及表单上下文，独立用户保存后仅认原guard允许的本地模拟结果。在线新增只保存待提交，下线后由原提交操作生效，既有技能和等级保持。；仅代码后态已定位，实际验证范围见核查总述 | DSession.allowed＋原AppState.canMenu/canAction、对象/tenantId/enterpriseId资格；真实映射C02 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2072 / PAGE-2212 原外呼组允许的维护操作 | 呼叫中心 / 坐席资源 / 外呼组管理 | retained-source-cloud-outbound-group-members: members @ Cloud/js/pages/outbound-group-management.js:176; setMembers @ Cloud/js/components/outbound-groups.js:350; save @ Cloud/js/pages/outbound-group-management.js:239<br>retained-source-cloud-outbound-group-detail: detail @ Cloud/js/pages/outbound-group-management.js:136<br>retained-source-cloud-outbound-group-delete: remove @ Cloud/js/pages/outbound-group-management.js:221<br>retained-source-cloud-outbound-group-query: render @ Cloud/js/pages/outbound-group-management.js:12<br>retained-source-cloud-outbound-group-create: create @ Cloud/js/pages/outbound-group-management.js:56<br>retained-source-cloud-outbound-group-edit: edit @ Cloud/js/pages/outbound-group-management.js:98 | 仅本地事务成功后更新外呼组成员、按原排他规则从同企业其他有权外呼组移入，关闭弹层并刷新；未变化单列，权限/范围/在途任务/版本/存储失败保原记录并反馈，不证明真实AliCti远端生效。；按原范围完成“查看详情外呼组”并保留实际/待核结果；按原范围完成“删除外呼组”并保留实际/待核结果；原权限/当前账号租户范围内消费原筛选值，按原分页回显同外呼组列表；仅本地模拟源码范围，接口/权限/生产执行事实另保。；按原范围完成“新增外呼组”并保留实际/待核结果；按原范围完成“修改外呼组”并保留实际/待核结果；仅代码后态已定位，实际验证范围见核查总述 | DSession.allowed＋原AppState.canMenu/canAction、对象/tenantId/enterpriseId资格；真实映射C02 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2073 / PAGE-2213 原队列允许的维护操作 | 呼叫中心 / 坐席资源 / 队列管理 | retained-source-cloud-queue-query: render @ Cloud/js/pages/queue-management.js:15<br>retained-source-cloud-queue-detail: openDetails @ Cloud/js/pages/queue-management.js:31; open @ Cloud/js/components/queue-detail.js:45<br>retained-source-cloud-queue-create: continueCreate @ Cloud/js/pages/queue-management.js:87; save @ Cloud/js/components/queue-config.js:107<br>retained-source-cloud-queue-associate: saveAssociation @ Cloud/js/pages/queue-management.js:91<br>retained-source-cloud-queue-verify-members: verify @ Cloud/js/pages/queue-management.js:97<br>retained-source-cloud-queue-edit: save @ Cloud/js/components/queue-detail.js:116 | 原权限/当前账号租户范围内消费原筛选值，按原分页回显同队列列表；仅本地模拟源码范围，接口/权限/生产执行事实另保。；原工作范围通过后以editable=false打开同qno的原详情；队列成员/配置结果仅本地模拟，保持原账号租户和供应商结果待核边界。；按原范围完成“新增队列”并保留实际/待核结果；按原范围完成“保存技能关联队列”并保留实际/待核结果；按原范围完成“重新核对成员队列”并保留实际/待核结果；合法当前队列参数保存且保留核对状态；仅代码后态已定位，实际验证范围见核查总述 | DSession.allowed＋原AppState.canMenu/canAction、对象/tenantId/enterpriseId资格；真实映射C02 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2074 / PAGE-2214 查询原配置记录与详情 | 呼叫中心 / 坐席资源 / 配置记录 | cloud-query-config-records: renderSync @ Cloud/js/pages/agent-center.js:49<br>retained-source-cloud-config-record-detail: openSyncRecord @ Cloud/js/pages/agent-center.js:308<br>retained-source-cloud-correct-seat-create: retry @ Cloud/js/pages/agent-center.js:276; retry @ Cloud/js/components/account-seat.js:290 | 真实本地配置与供应商同步事实可区分；显示配置类型、实际本地状态/原因、创建后坐席标识、重提次数和修正历史；准确上下文失效关闭详情。；沿原失败记录固定租户预填原资料，重新验证后本地创建新坐席并把尝试/结果关联回原配置记录；已有坐席、其他记录不受误改。；仅代码后态已定位，实际验证范围见核查总述 | DSession.allowed＋原AppState.canMenu/canAction、对象/tenantId/enterpriseId资格；真实映射C02 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2075 / PAGE-2215 原号码允许的维护/分配操作 | 呼叫中心 / 呼叫资源 / 号码管理 | retained-source-cloud-number-detail: openNumber @ Cloud/js/pages/resource-lines.js:80<br>retained-source-cloud-number-local-enable: setLocalEnabled @ Cloud/js/pages/resource-lines.js:119<br>retained-source-cloud-number-local-disable: setLocalEnabled @ Cloud/js/pages/resource-lines.js:119<br>retained-source-cloud-number-query: renderNumbers @ Cloud/js/pages/resource-lines.js:70<br>retained-source-cloud-number-import: submit @ Cloud/js/components/alicti-number-import.js:75 | 按原范围完成“查看详情号码”并保留实际/待核结果；原完整处理器再次核同号码/工作范围/旧状态，确认后persistNumber仅保存本地许可；写失败不走成功反馈。启用仍须供应商状态、用途、租户授权且任务不自动恢复。；原完整处理器再次核同号码/工作范围/旧状态，确认后persistNumber仅保存本地许可；写失败不走成功反馈。停用后暂停关联任务新拨号，在途/资料/授权/规则/历史保留；不改供应商状态。；保原超管/账号范围，用原筛选和分页回显同号码列表；仅本地模拟，不证生产号码或实时状态。；选择合法号码导入本地目录并沿原绑定归租户；原账号/租户/context/模式及原选择或预检查守卫保持，仅本地mock和原分项结果。本批提交前全选逐条复核，先本地持久再更新显示；失败不额外宣称持久化后的显示错误可回滚。；仅代码后态已定位，实际验证范围见核查总述 | DSession.allowed＋原AppState.canMenu/canAction、对象/tenantId/enterpriseId资格；真实映射C02 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2076 / PAGE-2216 原号码池允许的维护操作 | 呼叫中心 / 呼叫资源 / 号码池管理 | retained-source-cloud-number-pool-create: commit @ Cloud/js/pages/number-pool-management.js:92<br>retained-source-cloud-number-pool-delete: commit @ Cloud/js/pages/number-pool-management.js:92<br>retained-source-cloud-number-pool-edit: commit @ Cloud/js/pages/number-pool-management.js:92<br>retained-source-cloud-number-pool-query: render @ Cloud/js/pages/number-pool-management.js:14<br>retained-source-cloud-number-pool-detail: details @ Cloud/js/pages/number-pool-management.js:68 | 按原范围完成“新增号码池”并保留实际/待核结果；按原范围完成“删除号码池”并保留实际/待核结果；按原范围完成“修改号码池”并保留实际/待核结果；原权限/当前账号租户范围内消费原筛选值，按原分页回显同号码池列表；仅本地模拟源码范围，接口/权限/生产执行事实另保。；同原view模式捕获id/账号租户context/revision后，原details结果进入真实layer活动body；号码池及供应商操作均仅原本地模拟。；仅代码后态已定位，实际验证范围见核查总述 | DSession.allowed＋原AppState.canMenu/canAction、对象/tenantId/enterpriseId资格；真实映射C02 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2077 / PAGE-2217 原分机允许的维护操作 | 呼叫中心 / 呼叫资源 / 分机管理 | retained-source-cloud-extension-query: render @ Cloud/js/pages/extension-management.js:44<br>retained-source-cloud-extension-detail: details @ Cloud/js/pages/extension-management.js:112<br>retained-source-cloud-extension-create: save @ Cloud/js/pages/extension-management.js:141<br>retained-source-cloud-extension-edit: save @ Cloud/js/pages/extension-management.js:141<br>retained-source-cloud-extension-delete: save @ Cloud/js/pages/extension-management.js:141<br>retained-source-cloud-extension-import: openImport @ Cloud/js/pages/extension-management.js:179; importExisting @ Cloud/js/components/alicti-extensions.js:213 | 原权限/当前账号租户范围内消费原筛选值，按原分页回显同分机列表；仅本地模拟源码范围，接口/权限/生产执行事实另保。；按原范围完成“查看详情分机”并保留实际/待核结果；保持原对象/模式、账号租户/版本/引用保护和失败反馈；仅本地模拟事实。；按原范围完成“新增分机”并保留实际/待核结果；保持原对象/模式、账号租户/版本/引用保护和失败反馈；仅本地模拟事实。；按原范围完成“修改软电话分机分机”并保留实际/待核结果；保持原对象/模式、账号租户/版本/引用保护和失败反馈；仅本地模拟事实。；按原范围完成“删除分机”并保留实际/待核结果；保持原对象/模式、账号租户/版本/引用保护和失败反馈；仅本地模拟事实。；原openImport仅开启选择表单；必须经过原selectCandidate与独立用户save，按captured context/revision及selected IDs调用原importExisting。本地全批候选/类型/重复/租户校验及持久化结果沿原组件；不声称供应商执行或原型外导入。；仅代码后态已定位，实际验证范围见核查总述 | DSession.allowed＋原AppState.canMenu/canAction、对象/tenantId/enterpriseId资格；真实映射C02 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2078 / PAGE-2218 原时间条件允许的维护操作 | 呼叫中心 / 呼叫资源 / 时间条件 | retained-source-cloud-time-condition-query: render @ Cloud/js/pages/time-condition-management.js:32<br>retained-source-cloud-time-condition-detail: details @ Cloud/js/pages/time-condition-management.js:105<br>retained-source-cloud-time-condition-create: save @ Cloud/js/pages/time-condition-management.js:165<br>retained-source-cloud-time-condition-edit: save @ Cloud/js/pages/time-condition-management.js:165<br>retained-source-cloud-time-condition-delete: save @ Cloud/js/pages/time-condition-management.js:165 | 原权限/当前账号租户范围内消费原筛选值，按原分页回显同时间条件列表；仅本地模拟源码范围，接口/权限/生产执行事实另保。；按原范围完成“查看详情时间条件”并保留实际/待核结果；保持原对象/模式、账号租户/版本/引用保护和失败反馈；仅本地模拟事实。；按原范围完成“新增时间条件”并保留实际/待核结果；保持原对象/模式、账号租户/版本/引用保护和失败反馈；仅本地模拟事实。；按原范围完成“修改时间条件”并保留实际/待核结果；保持原对象/模式、账号租户/版本/引用保护和失败反馈；仅本地模拟事实。；按原范围完成“删除时间条件”并保留实际/待核结果；保持原对象/模式、账号租户/版本/引用保护和失败反馈；仅本地模拟事实。；仅代码后态已定位，实际验证范围见核查总述 | DSession.allowed＋原AppState.canMenu/canAction、对象/tenantId/enterpriseId资格；真实映射C02 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2079 / PAGE-2219 原AliCti账号允许的维护操作 | 呼叫中心 / 供应服务 / 呼叫服务账号 | retained-source-cloud-provider-account-query: render @ Cloud/js/pages/alicti-accounts.js:31<br>retained-source-cloud-provider-account-detail: openDetail @ Cloud/js/pages/alicti-accounts.js:149<br>retained-source-cloud-provider-account-create: save @ Cloud/js/pages/alicti-accounts.js:119; save @ Cloud/js/components/alicti-accounts.js:221<br>retained-source-cloud-provider-account-edit: save @ Cloud/js/pages/alicti-accounts.js:119; save @ Cloud/js/components/alicti-accounts.js:221<br>retained-source-cloud-provider-account-enable: applyStatus @ Cloud/js/pages/alicti-accounts.js:205; setStatus @ Cloud/js/components/alicti-accounts.js:222<br>retained-source-cloud-provider-account-disable: applyStatus @ Cloud/js/pages/alicti-accounts.js:205; setStatus @ Cloud/js/components/alicti-accounts.js:222 | 原权限/当前账号租户范围内消费原筛选值，按原分页回显同AliCti账号列表；仅本地模拟源码范围，接口/权限/生产执行事实另保。；按原超管资格及捕获context打开同账号详情，凭据仍只展示配置状态；仅原本地模拟资料，不证明真实供应商账号/权限。；按原范围完成“新增AliCti账号”并保留实际/待核结果；保原超管资格、configId/context/expectedVersion和账号绑定历史，全部仅原本地模拟，实际接口/权限待核边界不消除。；按原范围完成“修改AliCti账号”并保留实际/待核结果；保原超管资格、configId/context/expectedVersion和账号绑定历史，全部仅原本地模拟，实际接口/权限待核边界不消除。；按原范围完成“启用AliCti账号”并保留实际/待核结果；保原超管资格、configId/context/expectedVersion和账号绑定历史，全部仅原本地模拟，实际接口/权限待核边界不消除。；按原范围完成“停用AliCti账号”并保留实际/待核结果；保原超管资格、configId/context/expectedVersion和账号绑定历史，全部仅原本地模拟，实际接口/权限待核边界不消除。；仅代码后态已定位，实际验证范围见核查总述 | DSession.allowed＋原AppState.canMenu/canAction、对象/tenantId/enterpriseId资格；真实映射C02 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2081 / PAGE-2221 查询及核对原异常 | 呼叫中心 / 通话记录 / 通话数据异常 | retained-source-cloud-data-exception-query: render @ Cloud/js/components/call-data-issues.js:23<br>retained-source-cloud-data-exception-detail: open @ Cloud/js/components/call-data-issues.js:38<br>retained-source-cloud-data-exception-recheck: recheck @ Cloud/js/components/call-data-issues.js:47 | 实际过滤当前enterpriseId异常集、显示分页列表及待处理计数，非固定toast。；显示准确callId+tenant+enterprise异常、当前已知通话结果及本条核对trace；不会更改业务跟进。；仅按本条readback样例补本地通话事实或保留仍需处理，追加trace与审计；不重拨、不改业务跟进。；仅代码后态已定位，实际验证范围见核查总述 | DSession.allowed＋原AppState.canMenu/canAction、对象/tenantId/enterpriseId资格；真实映射C02 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2035 / PAGE-2105 查询原通话统计 | 报表中心 / 智能报表 / 智能通话统计 | ai-query-call-statistics: renderRows,renderCustomerRows,renderTabContent,doQuery,resetFilters,render,switchTab @ AI/js/pages/report-call.js:15 | 原维度及口径通话统计；仅代码后态已定位，实际验证范围见核查总述 | DSession.allowed/canWrite＋原AI页/对象资格；真实粒度映射C02 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2036 / PAGE-2106 查询原计费统计 | 报表中心 / 智能报表 / 智能计费统计 | ai-query-billing-statistics: render,updateTable,query,resetFilters,refresh @ AI/js/pages/report-billing.js:31<br>ai-view-billing-detail: renderDetailRows,showDetail,closeDetail,renderCallDetailRows,showCallDetail @ AI/js/pages/report-billing.js:95 | 原计费口径统计；原计费记录准确明细；仅代码后态已定位，实际验证范围见核查总述 | 原统计/明细scope；DFinance独立service.export grant，2112不继承 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2103 / PAGE-2106 导出租户AI服务汇总 | 报表中心 / 智能报表 / 智能计费统计 | FUNC-2027: scope/snapshot/buildCsv/exportCurrent @ P/js/adapters/ai-finance.js:31 | 有权租户当前8列CSV；仅代码后态已定位，实际验证范围见核查总述 | 原统计/明细scope；DFinance独立service.export grant，2112不继承 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2037 / PAGE-2107 查询原线索统计 | 报表中心 / 智能报表 / 智能线索统计 | ai-query-lead-statistics: renderStatPanel,renderDetailPanel,renderReturnPanel,render @ AI/js/pages/report-clue.js:208 | 原线索维度统计；仅代码后态已定位，实际验证范围见核查总述 | DSession.allowed/canWrite＋原AI页/对象资格；真实粒度映射C02 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2068 / PAGE-2209 查询所选原报表 | 报表中心 / 云呼叫报表 | cloud-query-report-overview: query @ Cloud/js/pages/report-center.js:174<br>cloud-query-report-leads: query @ Cloud/js/pages/report-center.js:174<br>cloud-query-report-customers: query @ Cloud/js/pages/report-center.js:174<br>cloud-query-report-outbound: query @ Cloud/js/pages/report-center.js:174<br>cloud-query-report-agents: query @ Cloud/js/pages/report-center.js:174<br>cloud-query-report-inbound: query @ Cloud/js/pages/report-center.js:174<br>cloud-query-report-skills: query @ Cloud/js/pages/report-center.js:174 | 按原有权范围返回通话总览统计结果；按原有权范围返回线索成效统计结果；按原有权范围返回客户跟进统计结果；按原有权范围返回外呼任务统计结果；按原有权范围返回坐席成效统计结果；按原有权范围返回呼入服务统计结果；按原有权范围返回服务技能统计结果；当前缺口分支：A05 | DSession.allowed＋原AppState.canMenu/canAction、对象/tenantId/enterpriseId资格；真实映射C02 | A A05；确证缺口仅指A05所述分支，不表示同动作其余实现全部不存在。 |
| ACTION-2069 / PAGE-2209 原已有详情与导出 | 报表中心 / 云呼叫报表 | retained-source-cloud-export-report-agents: exportReport @ Cloud/js/pages/report-center.js:254<br>retained-source-cloud-export-report-customers: exportReport @ Cloud/js/pages/report-center.js:254<br>retained-source-cloud-export-report-inbound: exportReport @ Cloud/js/pages/report-center.js:254<br>retained-source-cloud-export-report-leads: exportReport @ Cloud/js/pages/report-center.js:254<br>retained-source-cloud-export-report-outbound: exportReport @ Cloud/js/pages/report-center.js:254<br>retained-source-cloud-export-report-overview: exportReport @ Cloud/js/pages/report-center.js:254<br>retained-source-cloud-export-report-skills: exportReport @ Cloud/js/pages/report-center.js:254<br>retained-source-cloud-drill-report-overview: drill @ Cloud/js/pages/report-center.js:218<br>retained-source-cloud-drill-report-leads: drill @ Cloud/js/pages/report-center.js:218<br>retained-source-cloud-drill-report-customers: drill @ Cloud/js/pages/report-center.js:218<br>retained-source-cloud-drill-report-outbound: drill @ Cloud/js/pages/report-center.js:218<br>retained-source-cloud-drill-report-agents: drill @ Cloud/js/pages/report-center.js:218<br>retained-source-cloud-drill-report-inbound: drill @ Cloud/js/pages/report-center.js:218<br>retained-source-cloud-drill-report-skills: drill @ Cloud/js/pages/report-center.js:218 | 原当前筛选全部结果CSV；按原overview报表当前权限和已应用筛选显示原明细弹层；原线索/名单/任务/通话明细分支及无结果处理保持，不承诺生产统计准确。；按原leads报表当前权限和已应用筛选显示原明细弹层；原线索/名单/任务/通话明细分支及无结果处理保持，不承诺生产统计准确。；按原customers报表当前权限和已应用筛选显示原明细弹层；原线索/名单/任务/通话明细分支及无结果处理保持，不承诺生产统计准确。；按原outbound报表当前权限和已应用筛选显示原明细弹层；原线索/名单/任务/通话明细分支及无结果处理保持，不承诺生产统计准确。；按原agents报表当前权限和已应用筛选显示原明细弹层；原线索/名单/任务/通话明细分支及无结果处理保持，不承诺生产统计准确。；按原inbound报表当前权限和已应用筛选显示原明细弹层；原线索/名单/任务/通话明细分支及无结果处理保持，不承诺生产统计准确。；按原skills报表当前权限和已应用筛选显示原明细弹层；原线索/名单/任务/通话明细分支及无结果处理保持，不承诺生产统计准确。；当前缺口分支：A05 | DSession.allowed＋原AppState.canMenu/canAction、对象/tenantId/enterpriseId资格；真实映射C02 | A A05；确证缺口仅指A05所述分支，不表示同动作其余实现全部不存在。 |
| ACTION-2008 / PAGE-2003 在本租户创建账号并分配权限 | 系统管理 / 组织与权限 / 账号与成员 | FUNC-2011: memberForm/createAccount @ P/js/components/organization-store.js:69<br>FUNC-2012: validateMember/setMemberRoles @ P/js/components/organization-store.js:75 | 账号与本租户成员同次创建；两个模块分别授予业务角色；当前缺口分支：A01 | DOrganization.permission(account.create/member.manage/member.disable/account.disable/seat.link/delete)逐动作 | A A01；确证缺口仅指A01所述分支，不表示同动作其余实现全部不存在。 |
| ACTION-2009 / PAGE-2003 调整本租户AI/云呼叫模块业务授权 | 系统管理 / 组织与权限 / 账号与成员 | FUNC-2012: validateMember/setMemberRoles @ P/js/components/organization-store.js:75 | 两个模块分别授予业务角色；当前缺口分支：A01 | DOrganization.permission(account.create/member.manage/member.disable/account.disable/seat.link/delete)逐动作 | A A01；确证缺口仅指A01所述分支，不表示同动作其余实现全部不存在。 |
| ACTION-2010 / PAGE-2003 停用本租户访问 | 系统管理 / 组织与权限 / 账号与成员 | FUNC-2013: setEnabled(tenantId) @ P/js/components/organization-store.js:76 | 仅本租户停用；仅代码后态已定位，实际验证范围见核查总述 | DOrganization.permission(account.create/member.manage/member.disable/account.disable/seat.link/delete)逐动作 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2011 / PAGE-2003 停用整个登录账号 | 系统管理 / 组织与权限 / 账号与成员 | FUNC-2014: setEnabled(null) @ P/js/components/organization-store.js:76 | 全局停用、历史保留；仅代码后态已定位，实际验证范围见核查总述 | DOrganization.permission(account.create/member.manage/member.disable/account.disable/seat.link/delete)逐动作 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2091 / PAGE-2003 为本租户已有账号关联已有坐席 | 系统管理 / 组织与权限 / 账号与成员 | retained-source-cloud-bind-account-seat: bind @ Cloud/js/components/account-seat.js:131 | 原membershipId解析出的account/tenant/enterprise与dialog context保持；existing原表单独立提交到bind，原锁内复核唯一关联、非删除/非在用/范围及本地journal保存沿原source，停用坐席不自动启用。alictiPowerDraft仍mock/confirmed=false，不授新模块权，不证明供应商生效，也不额外保证写后restore失败回滚。；仅代码后态已定位，实际验证范围见核查总述 | DOrganization.permission(account.create/member.manage/member.disable/account.disable/seat.link/delete)逐动作 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2102 / PAGE-2003 查询当前有权租户的账号与成员 | 系统管理 / 组织与权限 / 账号与成员 | retained-source-ai-legacy-account-query: getFilteredAccounts @ AI/js/pages/sys-account.js:50 | 本地按tenantName及条件过滤账号；仅代码后态已定位，实际验证范围见核查总述 | DOrganization.permission(account.create/member.manage/member.disable/account.disable/seat.link/delete)逐动作 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2104 / PAGE-2003 删除无业务引用的账号 | 系统管理 / 组织与权限 / 账号与成员 | FUNC-2028: deletionReason/remove(account) @ P/js/components/organization-store.js:87 | 只在无引用/无其他租户关系时删除；当前缺口分支：A10 | DOrganization.permission(account.create/member.manage/member.disable/account.disable/seat.link/delete)逐动作 | A A10；确证缺口仅指A10所述分支，不表示同动作其余实现全部不存在。 |
| ACTION-2012 / PAGE-2004 创建租户并关联品牌 | 系统管理 / 组织与权限 / 租户管理 | FUNC-2005: tenantForm/saveTenant @ P/js/components/organization-store.js:57 | 租户与品牌同次保存；当前缺口分支：A03 | tenant.create/update/brand/module.open/delete及tenantIds；资源前置见A03 | A A03；确证缺口仅指A03所述分支，不表示同动作其余实现全部不存在。 |
| ACTION-2013 / PAGE-2004 修改租户基础资料 | 系统管理 / 组织与权限 / 租户管理 | FUNC-2006: tenantForm/saveTenant @ P/js/components/organization-store.js:57 | 基础资料保存、引用保留；当前缺口分支：A03,A04 | tenant.create/update/brand/module.open/delete及tenantIds；资源前置见A03 | A A03,A04；确证缺口仅指A03,A04所述分支，不表示同动作其余实现全部不存在。 |
| ACTION-2014 / PAGE-2004 维护租户品牌关联 | 系统管理 / 组织与权限 / 租户管理 | FUNC-2007: binding/saveTenant @ P/js/components/organization-store.js:45 | 品牌/总部门店关联及锁定；当前缺口分支：A04 | tenant.create/update/brand/module.open/delete及tenantIds；资源前置见A03 | A A04；确证缺口仅指A04所述分支，不表示同动作其余实现全部不存在。 |
| ACTION-2015 / PAGE-2004 开通租户AI/云呼叫模块 | 系统管理 / 组织与权限 / 租户管理 | FUNC-2010: setModule @ P/js/components/organization-store.js:64 | 分别开通模块；当前缺口分支：A03 | tenant.create/update/brand/module.open/delete及tenantIds；资源前置见A03 | A A03；确证缺口仅指A03所述分支，不表示同动作其余实现全部不存在。 |
| ACTION-2105 / PAGE-2004 删除无业务引用的租户 | 系统管理 / 组织与权限 / 租户管理 | FUNC-2029: deletionReason/remove(tenant) @ P/js/components/organization-store.js:87 | 只在无业务引用时删除租户；当前缺口分支：A10 | tenant.create/update/brand/module.open/delete及tenantIds；资源前置见A03 | A A10；确证缺口仅指A10所述分支，不表示同动作其余实现全部不存在。 |
| ACTION-2016 / PAGE-2005 创建品牌 | 系统管理 / 组织与权限 / 品牌管理 | FUNC-2008: brandForm/saveBrand @ P/js/components/organization-store.js:51 | 品牌创建及有权范围；仅代码后态已定位，实际验证范围见核查总述 | brand.write及brandIds/tenantIds交集 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2017 / PAGE-2005 修改品牌资料 | 系统管理 / 组织与权限 / 品牌管理 | FUNC-2009: brandForm/saveBrand @ P/js/components/organization-store.js:51 | 品牌资料更新；仅代码后态已定位，实际验证范围见核查总述 | brand.write及brandIds/tenantIds交集 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2018 / PAGE-2005 查询有权品牌关联租户 | 系统管理 / 组织与权限 / 品牌管理 | FUNC-2026: brands/tenants/dispatch(brand-tenants) @ P/js/pages/organization.js:56 | 有权关联租户交集列表；仅代码后态已定位，实际验证范围见核查总述 | brand.write及brandIds/tenantIds交集 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2080 / PAGE-2220 维护原已有应用接入配置 | 系统管理 / 接入管理 / 应用接入 | retained-source-cloud-app-query: listApplications @ Cloud/js/components/dcc-runtime.js:62; renderList @ Cloud/js/pages/application-access.js:34<br>retained-source-cloud-app-create: createApplication @ Cloud/js/components/dcc-runtime.js:98<br>retained-source-cloud-app-edit: saveApplication @ Cloud/js/components/dcc-runtime.js:106<br>retained-source-cloud-app-delete: deleteApplication @ Cloud/js/components/dcc-runtime.js:116<br>retained-source-cloud-app-detail: renderDetail @ Cloud/js/pages/application-access.js:62 | 返回当前有权原应用列表；原应用登记并生成/保存原接入凭据；原应用名/有效租户关联/回调地址合法更新；应用删除且原历史来源保留；显示原登记信息及有权密钥信息；仅代码后态已定位，实际验证范围见核查总述 | DSession.allowed＋原AppState.canMenu/canAction、对象/tenantId/enterpriseId资格；真实映射C02 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2082 / PAGE-2222 查询原审计及详情 | 系统管理 / 操作审计 / 操作审计 | cloud-query-audit: renderAudit @ Cloud/js/pages/system-center.js:9<br>retained-source-cloud-export-audit: exportAudit @ Cloud/js/pages/system-center.js:24<br>retained-source-cloud-view-audit-detail: openAudit @ Cloud/js/pages/system-center.js:36 | 原范围的操作审计查询结果；原审计下载被发起/失败如实返回；原操作前后及来源详情可查看；仅代码后态已定位，实际验证范围见核查总述 | DSession.allowed＋原AppState.canMenu/canAction、对象/tenantId/enterpriseId资格；真实映射C02 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2040 / PAGE-2109 查询原线索记录 | 隐藏页；旧AI侧栏隐藏且没有替代入口（A06） | ai-query-lead-records: getFilteredRows,renderRows @ AI/js/pages/result-clue.js:57 | 原线索查询结果；当前缺口分支：A06 | DSession.allowed/canWrite＋原AI页/对象资格；真实粒度映射C02 | A A06；确证缺口仅指A06所述分支，不表示同动作其余实现全部不存在。 |
| ACTION-2041 / PAGE-2109 沿原可用标签与回访操作 | 隐藏页；旧AI侧栏隐藏且没有替代入口（A06） | ai-view-lead-record: renderCustomerTagsModal,renderClueDetailModal,showCustomerTags,showClueDetail @ AI/js/pages/result-clue.js:134 | 原详情及回访信息；当前缺口分支：A06 | DSession.allowed/canWrite＋原AI页/对象资格；真实粒度映射C02 | A A06；确证缺口仅指A06所述分支，不表示同动作其余实现全部不存在。 |
| ACTION-2045 / PAGE-2112 办理原已有充值操作 | 计划从有权租户服务进入；当前明示独立财务权域受阻（C01） | ai-open-trial: rechargeTypesForProfile,rechargeTypeMismatchMessage,openRechargeForm,closeRechargeForm,isPositiveInteger,collectRechargeFormData,value @ AI/js/pages/sys-tenant.js:1488; showRechargeWriteResult,submitRechargeForm,simulateRechargeWriteFailure,simulateRechargeConflict,simulateRechargeUnknown,retryRechargeWrite @ AI/js/pages/sys-tenant.js:1628; commitRecharge @ AI/js/components/recharge-service.js:127<br>ai-open-annual: rechargeTypesForProfile,rechargeTypeMismatchMessage,openRechargeForm,closeRechargeForm,isPositiveInteger,collectRechargeFormData,value @ AI/js/pages/sys-tenant.js:1488; showRechargeWriteResult,submitRechargeForm,simulateRechargeWriteFailure,simulateRechargeConflict,simulateRechargeUnknown,retryRechargeWrite @ AI/js/pages/sys-tenant.js:1628; commitRecharge @ AI/js/components/recharge-service.js:127<br>ai-recharge-credit: rechargeTypesForProfile,rechargeTypeMismatchMessage,openRechargeForm,closeRechargeForm,isPositiveInteger,collectRechargeFormData,value @ AI/js/pages/sys-tenant.js:1488; showRechargeWriteResult,submitRechargeForm,simulateRechargeWriteFailure,simulateRechargeConflict,simulateRechargeUnknown,retryRechargeWrite @ AI/js/pages/sys-tenant.js:1628; commitRecharge @ AI/js/components/recharge-service.js:127 | 原试用套餐服务及分钟池结果；原年包服务及分钟池结果；原话费包入账及流水结果；仅代码后态已定位，实际验证范围见核查总述 | 独立service.view/充值/手调资格未核定，当前阻断C01 | C；当前明确受阻；原源码存在不等于已接通。 |
| ACTION-2046 / PAGE-2112 办理原手工调整 | 计划从有权租户服务进入；当前明示独立财务权域受阻（C01） | ai-adjust-service: openIterationAdjustmentForm,closeIterationAdjustmentForm,collectIterationAdjustment,updateIterationAdjustmentPreview,showIterationAdjustmentValidation,setAdjustmentBusy,showAdjustmentWriteResult,submitIterationAdjustment,simulateAdjustmentConflict,simulateAdjustmentFailure,simulateAdjustmentUnknown,retryAdjustmentWrite @ AI/js/pages/sys-tenant.js:1699 | 原允许方向及对象的调整和流水；仅代码后态已定位，实际验证范围见核查总述 | 独立service.view/充值/手调资格未核定，当前阻断C01 | C；当前明确受阻；原源码存在不等于已接通。 |
| ACTION-2047 / PAGE-2112 查询原充值/调整记录 | 计划从有权租户服务进入；当前明示独立财务权域受阻（C01） | ai-query-recharge-records: renderInternalRechargeRows @ AI/js/pages/sys-tenant.js:1307<br>ai-query-adjustment-records: renderIterationAdjustmentRows,range @ AI/js/pages/sys-tenant.js:1328 | 原内部充值记录结果；原手工调整流水结果；仅代码后态已定位，实际验证范围见核查总述 | 独立service.view/充值/手调资格未核定，当前阻断C01 | C；当前明确受阻；原源码存在不等于已接通。 |
| ACTION-2083 / PAGE-2223 维护原云呼叫专业字段配置 | 业务分类→原字段内部编辑；DCatalogEntries→DSharedConfiguration | cloud-save-filling-fields: categoryEditor @ Cloud/js/pages/business-categories.js:427; save @ Cloud/js/components/customer-business.js:726<br>retained-source-cloud-field-query: render @ Cloud/js/pages/business-categories.js:183; dependencyCompatible,fieldDependencyError,cycleError @ Cloud/js/components/customer-business.js:144<br>retained-source-cloud-field-detail: open @ Cloud/js/pages/business-categories.js:218<br>retained-source-cloud-field-create: save @ Cloud/js/pages/business-categories.js:693; save @ Cloud/js/components/customer-business.js:726<br>retained-source-cloud-field-edit: save @ Cloud/js/pages/business-categories.js:693; save @ Cloud/js/components/customer-business.js:726<br>retained-source-cloud-field-enable: toggle @ Cloud/js/pages/business-categories.js:715; presetField,normalizeField @ Cloud/js/components/customer-business.js:207; fieldCapability @ Cloud/js/components/customer-business.js:85<br>retained-source-cloud-field-disable: toggle @ Cloud/js/pages/business-categories.js:715; presetField,normalizeField @ Cloud/js/components/customer-business.js:207; fieldCapability @ Cloud/js/components/customer-business.js:85<br>retained-source-cloud-field-delete: remove @ Cloud/js/pages/business-categories.js:756; presetField,normalizeField @ Cloud/js/components/customer-business.js:207 | 所选分类的原字段顺序／显示／必填及专业说明合法更新；读取当前租户字段目录并按名称/启停过滤显示；字段tab是同源维护，不是第二套目录。；按当前已保存字段定义显示名称、控件和选项；previewOnly不展示保存按钮，不修改字段或客户值。；新增稳定字段或更新同一字段定义；校验成功才写当前租户localStorage并刷新列表。；通过范围/修订及预置/引用保护后保存enabled；启用不自动改分类显示，停用不能绕过启用分类正在显示的引用。；只有当前字段存在、非预置且任何分类均未引用才splice删除；取消或失败保留。；仅代码后态已定位，实际验证范围见核查总述 | 继承有权分类/字段编辑＋原字段引用保护 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2085 / PAGE-2225 查询原全部坐席事件 | 坐席作业→班长监控→事件日志→查看全部事件（原内部页） | retained-source-cloud-seat-event-query: renderSeat @ Cloud/js/pages/agent-workbench.js:1033; renderEventHistory @ Cloud/js/components/tenant-call-monitor.js:99 | 显示当前浏览器/当前租户本地坐席事件历史及分页；模拟回执/连接回调/状态观察分开，不承诺实时采集或全租户生产历史。；仅代码后态已定位，实际验证范围见核查总述 | DSession.allowed＋原AppState.canMenu/canAction、对象/tenantId/enterpriseId资格；真实映射C02 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2106 / PAGE-2226 查看业务记录资料 | 业务台账→新模板批次→记录列表（受A01/A02影响） | FUNC-2033: detail @ Cloud/js/components/business-flow-store.js:476 | 当前/历史截止/监管的同记录视图；当前缺口分支：A01,A02 | DSession.allowed＋原当前/历史/监管记录范围；A01/A02 | A A01,A02；确证缺口仅指A01,A02所述分支，不表示同动作其余实现全部不存在。 |
| ACTION-2107 / PAGE-2227 选择并启动本次跟进方式 | 业务记录→详情（受A01/A02影响） | FUNC-2031: start @ Cloud/js/components/business-flow-store.js:283 | 主动建立本次串行处理段；仅代码后态已定位，实际验证范围见核查总述 | DBusinessLink.authorize＋原记录/节点/资源/串行/转交守卫；A01 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2108 / PAGE-2227 总部下发同品牌门店 | 业务记录→详情（受A01/A02影响） | FUNC-2030: transferContext/transfer @ Cloud/js/components/business-flow-store.js:449 | 同品牌合法方向归属切换、清旧安排、新轮次；当前缺口分支：A04 | DBusinessLink.authorize＋原记录/节点/资源/串行/转交守卫；A01 | A A04；确证缺口仅指A04所述分支，不表示同动作其余实现全部不存在。 |
| ACTION-2109 / PAGE-2227 门店上交本品牌总部 | 业务记录→详情（受A01/A02影响） | FUNC-2030: transferContext/transfer @ Cloud/js/components/business-flow-store.js:449 | 同品牌合法方向归属切换、清旧安排、新轮次；仅代码后态已定位，实际验证范围见核查总述 | DBusinessLink.authorize＋原记录/节点/资源/串行/转交守卫；A01 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2110 / PAGE-2227 保存本次人工处理结果 | 业务记录→详情（受A01/A02影响） | FUNC-2032: saveResult/executionEvent @ Cloud/js/components/business-flow-store.js:331 | 结果固定归原轮/段/表单、旧补录不盖新值；当前缺口分支：A01 | DBusinessLink.authorize＋原记录/节点/资源/串行/转交守卫；A01 | A A01；确证缺口仅指A01所述分支，不表示同动作其余实现全部不存在。 |
| ACTION-2116 / PAGE-2227 确认推进当前节点 | 业务记录→详情（受A01/A02影响） | FUNC-2038: evaluatePaths/advance @ Cloud/js/components/business-flow-store.js:429 | 三值条件符合后由人推进，提交复核；仅代码后态已定位，实际验证范围见核查总述 | DBusinessLink.authorize＋原记录/节点/资源/串行/转交守卫；A01 | B；静态定位入口、处理器、结果组织与守卫；未在本轮逐动作触发后态。 |
| ACTION-2117 / PAGE-2227 分配当前业务记录 | 业务记录→详情（受A01/A02影响） | FUNC-2037: assign/assignBatch @ Cloud/js/components/business-flow-store.js:281 | 当前租户分配，批量同次原子保存；当前缺口分支：A01 | DBusinessLink.authorize＋原记录/节点/资源/串行/转交守卫；A01 | A A01；确证缺口仅指A01所述分支，不表示同动作其余实现全部不存在。 |

### 38故事 / 134AC逐条归属

完整验收语义仍以A/memory/normalized-user-stories.json为准；下列只缩写条文用于定位，未重写要求。页面/动作关联可多对多，不能按此表行数计新增功能。五区域展示按本轮用户明确安排覆盖旧六区域文字。

| 故事 / AC | 条文定位摘要 | 关联动作 | 关联功能 | 主结论及待核点 |
| --- | --- | --- | --- | --- |
| US-2001 / AC-2001 | 一次登录后，先按真实授权确定合法租户；单租户直接进入，多租户首次选择，后续恢复上次仍合法租户。当前租户有权AI/云呼叫功能共用认证，无需再次填写另一套系统凭证。 | ACTION-2001,ACTION-2002,ACTION-2004,ACTION-2005,ACTION-2006 | FUNC-2001,FUNC-2003 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2001 / AC-2002 | 以AI生产账号/租户及历史归属为存量基准，云呼叫映射接入。 | ACTION-2001,ACTION-2002 | FUNC-2001 | C：真实身份/历史状态/远端契约待核；不把Mock当生产 |
| US-2001 / AC-2003 | 首次登录在已开通且有权时优先原云呼叫合法入口；原默认综合概览、无明确本人作业／监管默认入口且同时有导入与分配和云报表权限的人群，首次进入导入与分配。后续恢复上次合法位置；单一模块按其合法入口进入。本次首次选择不新增历史失… | ACTION-2001,ACTION-2002 | FUNC-2001 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2001 / AC-2004 | 本版不新增统一首页。取消独立运营概览，原入口按有权内容归位；没有业务入口但有公共管理权时，进入公共菜单顺序首个有权页。 | ACTION-2001,ACTION-2002 | FUNC-2001 | B：不新增首页/独立概览已保留；仅管理身份登录与通用历史恢复口径需对齐，见C07 |
| US-2002 / AC-2005 | 统一退出系统身份及两模块会话，再次访问受保护页面需要登录；实际会话失效机制待核验。 | ACTION-2002,ACTION-2004,ACTION-2005,ACTION-2007 | FUNC-2004 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2002 / AC-2006 | 退出前处理在途电话及未保存内容，提示和异常细节沿后续流程评审，不直接丢失未保存输入。 | ACTION-2002,ACTION-2004,ACTION-2005,ACTION-2007 | FUNC-2004 | A：A08 |
| US-2003 / AC-2007 | 统一界面采用工作台、业务中心、客户中心、呼叫中心、报表中心、系统管理六个顶层功能入口；按既有页面主对象归位并保留原稳定入口及身份。业务集中分类/规则与记录办理，客户集中原档案/联系和有权关联，呼叫集中专业执行与资源；不新… | ACTION-2003,ACTION-2004,ACTION-2005,ACTION-2006,ACTION-2086,ACTION-2087 | FUNC-2002,FUNC-2003 | B：展示已按本轮用户明确要求改五区域；业务&客户合并本身不是遗漏 |
| US-2003 / AC-2008 | 六入口是功能展示分组，不新增许可开关、客户业务域角色或统一业务成员门槛。AI/云呼叫仍独立开通；各业务动作按原模块/成员/对象/操作资格，配置、监管、公共名单、原财务和平台资源依各自资格判断，互不自动授权。 | ACTION-2003,ACTION-2004,ACTION-2005,ACTION-2006,ACTION-2086,ACTION-2087 | FUNC-2002 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2003 / AC-2009 | 原合法页面和仅管理功能入口按稳定ID映射到新区域。原首次/历史失效回退及管理菜单顺序意图沿用，不因六入口顶栏排序重算登录优先级；分类或名单迁位不强开业务模块。无合法入口提示受限，身份/租户读取失败与无权分别反馈。 | ACTION-2003,ACTION-2004,ACTION-2005,ACTION-2006,ACTION-2086,ACTION-2087 | FUNC-2002 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过；管理记忆时效另见C07 |
| US-2004 / AC-2010 | 同账号同租户返回原合法页面/视图时恢复筛选，重新验权并刷新数据。原公共管理功能分入业务中心、客户中心或系统管理后，仍保留原同窗口进入/返回和同次登录内合法管理页记忆；由被复用功能身份识别，不把整个新区域都当原公共管理。 | ACTION-2003,ACTION-2004,ACTION-2005,ACTION-2006,ACTION-2086,ACTION-2087 | FUNC-2002 | A：A05；管理记忆时效另见C07 |
| US-2004 / AC-2011 | 位置按账号、租户及原业务/功能域隔离，原稳定页映射到新导航路径；原管理功能记忆时效、草稿和业务位置规则沿用。失权回退原合法入口，不跨租户恢复对象、不恢复电话在线；不因中心名称改变权限或保存时效。 | ACTION-2003,ACTION-2004,ACTION-2005,ACTION-2006,ACTION-2086,ACTION-2087 | FUNC-2002,FUNC-2003 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过；管理记忆时效另见C07 |
| US-2005 / AC-2012 | 沿用原云呼叫电话现场：云呼叫原页面之间（含客户档案、名单作业及云报表）保留电话条及原检查，迁入工作台/业务/客户/呼叫/报表中心不要求额外离线。进入AI专业页、原公共管理功能或切租户前，先完成当前通话、必要话后并确认本人… | ACTION-2002,ACTION-2003,ACTION-2004,ACTION-2005,ACTION-2006,ACTION-2007,ACTION-2086,ACTION-2087 | FUNC-2002,FUNC-2003,FUNC-2004 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2005 / AC-2013 | 普通未保存表单按原流程提示保存、放弃或取消切换；保存失败保留输入并停留原页。 | ACTION-2002,ACTION-2003,ACTION-2004,ACTION-2005,ACTION-2006,ACTION-2007,ACTION-2086,ACTION-2087 | FUNC-2002,FUNC-2003,FUNC-2004 | A：A08 |
| US-2005 / AC-2014 | AI、预外呼、IVR后台任务按原规则运行；电话坐席退出造成的可用坐席变化沿原任务规则。 | ACTION-2003,ACTION-2004,ACTION-2005,ACTION-2006,ACTION-2086,ACTION-2087 | FUNC-2002 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2005 / AC-2015 | 拨号、振铃、通话、必要话后未保存、离线失败及状态未知均保留保护分支。新顶层区域变化不扩大原Cloud离线要求，同一区域内进入AI或原公共管理功能也不能绕过原保护；仅看监管且本人无电话会话不按他人状态受阻，不新增跨域常驻电… | ACTION-2002,ACTION-2003,ACTION-2004,ACTION-2005,ACTION-2006,ACTION-2007,ACTION-2086,ACTION-2087 | FUNC-2002,FUNC-2003,FUNC-2004 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2006 / AC-2016 | 两模块共用同一业务租户及基础资料，AI生产身份及历史关系优先延续。 | ACTION-2012,ACTION-2013,ACTION-2014 | FUNC-2005,FUNC-2006,FUNC-2007 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2006 / AC-2017 | 各模块供应商资源、专属配置及业务数据按原规则管理；账号、电话坐席、供应商账号和机器人分别映射。 | ACTION-2012,ACTION-2013 | FUNC-2005,FUNC-2006 | A：A03；A04 |
| US-2006 / AC-2018 | 新建业务租户须关联品牌；存量未关联租户保留原有功能并标记待补关联。 | ACTION-2012,ACTION-2013,ACTION-2014 | FUNC-2005,FUNC-2006,FUNC-2007 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2007 / AC-2019 | 超管为租户独立开通AI、云呼叫，支持仅AI、仅云呼叫及两者同时使用。 | ACTION-2015 | FUNC-2010 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2007 / AC-2020 | 已有AI生产租户沿用当前开通与启停状态；云呼叫完成对应资源配置后单独开通。 | ACTION-2015 | FUNC-2010 | A：A03 |
| US-2007 / AC-2021 | 仅AI不要求云呼叫执行资源，仅云呼叫不要求AI机器人；开通不等于自动给全部成员使用权。 | ACTION-2015 | FUNC-2010 | A：A03 |
| US-2008 / AC-2022 | 公共账号管理按全已有功能原则承接AI文档所述的本租户建号能力；实际生产授权和上限仍待核验，不自动扩展为跨租户建号或授予超管身份。 | ACTION-2008 | FUNC-2011 | A：A01 |
| US-2008 / AC-2023 | 身份冲突及已有账号复用须核对稳定标识后处理，不能因同名或同手机号自动合并、改写历史归属。 | ACTION-2008 | FUNC-2011 | C：真实身份/历史状态/远端契约待核；不把Mock当生产 |
| US-2009 / AC-2024 | 租户管理员只在本租户已开通模块及允许业务角色范围内维护成员使用和操作权限。 | ACTION-2008,ACTION-2009 | FUNC-2012 | A：A01 |
| US-2009 / AC-2025 | 同一成员在AI和云呼叫可有不同操作权限，沿用AI生产既有授权并单独分配云呼叫权限。 | ACTION-2008,ACTION-2009 | FUNC-2012 | A：A01 |
| US-2009 / AC-2026 | 菜单、直接路由和业务操作使用相应授权，具体生产权限码及撤权生效时间待核验。 | ACTION-2008,ACTION-2009 | FUNC-2012 | A：A01 |
| US-2010 / AC-2027 | 租户管理员停用本租户人员时限制该租户AI/云呼叫访问，其他租户已有授权不受影响。 | ACTION-2010 | FUNC-2013 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2010 / AC-2028 | 保留历史任务、通话和操作记录；不把本租户停用显示为整个账号停用。 | ACTION-2010 | FUNC-2013 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2010 / AC-2029 | 本租户人员停用后，禁止其在本租户新增操作；停用时已接通的当前电话及必要话后允许有限收尾，完成后结束该范围使用。停用前系统已受理的AI/预外呼/IVR租户任务在原条件满足时继续，停用者不能再操作，其他已有权人员依原权限管理… | ACTION-2052,ACTION-2010 | FUNC-2013,FUNC-2015 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2011 / AC-2030 | 整个登录账号停用归超管，租户管理员不能借本租户停用改动全局状态。 | ACTION-2011 | FUNC-2014 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2011 / AC-2031 | 全局停用保留历史任务、通话及操作记录；重新启用、删除等不因本项自动新增。 | ACTION-2011 | FUNC-2014 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2011 / AC-2032 | 账号全局停用后，对全部租户和工作区禁止新增操作；仅允许停用时已接通的当前电话及必要话后有限收尾，完成后结束该范围使用。停用前系统已受理的租户后台任务按原条件继续，停用者不能再操作，不自动转交；会话和电话具体生效机制仍须核… | ACTION-2052,ACTION-2011 | FUNC-2014,FUNC-2015 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2012 / AC-2033 | 接入品牌资料由平台超级管理员统一维护。 | ACTION-2016,ACTION-2017 | FUNC-2008,FUNC-2009 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2012 / AC-2034 | 租户管理员只读本租户品牌归属；不因共享品牌而拥有其他租户权限。 | ACTION-2016,ACTION-2017,ACTION-2018 | FUNC-2008,FUNC-2009,FUNC-2026 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2013 / AC-2035 | 关联成功的每个租户只对应一个接入品牌。 | ACTION-2012,ACTION-2013,ACTION-2014,ACTION-2018 | FUNC-2005,FUNC-2006,FUNC-2007,FUNC-2026 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2013 / AC-2036 | 新建业务租户品牌必填；存量未关联租户保留原有功能。已有历史线索但无品牌的租户允许首次绑定，绑定后有线索时禁止更换品牌及总部/门店身份；不补品牌、初始化轮次或迁移旧线索。 | ACTION-2012,ACTION-2013,ACTION-2014 | FUNC-2005,FUNC-2006,FUNC-2007 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2013 / AC-2037 | 品牌关联变更保留前后信息、操作人和时间；品牌相同不自动共享线索/名单、授予总部品牌全量查看或触发转交。跨租户线索仅按独立的本次转交规则办理，普通租户资料编辑不得绕过归属与身份锁定。 | ACTION-2012,ACTION-2013,ACTION-2014,ACTION-2018 | FUNC-2005,FUNC-2006,FUNC-2007,FUNC-2026 | A：A04 |
| US-2013 / AC-2081 | 同一接入品牌可关联多个租户。 | ACTION-2012,ACTION-2014,ACTION-2016 | FUNC-2005,FUNC-2007,FUNC-2008 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2013 / AC-2082 | 每品牌对应一个总部租户及多个独立门店租户。 | ACTION-2012,ACTION-2014,ACTION-2016 | FUNC-2005,FUNC-2007,FUNC-2008 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2013 / AC-2083 | 租户所属品牌由平台超级管理员统一维护。 | ACTION-2012,ACTION-2013,ACTION-2014,ACTION-2016,ACTION-2017 | FUNC-2005,FUNC-2006,FUNC-2007,FUNC-2008,FUNC-2009 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2013 / AC-2095 | 超管创建业务租户时选择本平台品牌及总部/门店身份，租户和关联同次保存，遵守单品牌及唯一总部。 | ACTION-2012,ACTION-2014 | FUNC-2005,FUNC-2007 | A：A03 |
| US-2013 / AC-2096 | 明确保存后能定位及持久查询记录；保存异常保留填写且无孤立租户或关联，旧会话与历史身份兼容不覆盖既有引用。 | ACTION-2012,ACTION-2014 | FUNC-2005,FUNC-2007 | A：A03 |
| US-2014 / AC-2038 | 新模型由有权超管及租户管理员维护其有管理资格的品牌共用分类，普通运营只选择；替代新模型中的租户独立目录治理。旧租户目录不按同名合并，不把管理品牌配置等同于全品牌数据权限；该治理变化已由SRC2086确认。 | ACTION-2019,ACTION-2021 | FUNC-2016,FUNC-2018 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2014 / AC-2039 | 公共线索归类采用线索类，AI保留新/冷细分；公共活动归类采用活动类，不另列售前/售后活动或增加相应公共属性。 | ACTION-2019 | FUNC-2016 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2014 / AC-2040 | 新增公共分类不自动扩展供应商的AI执行能力，原模块字段及执行规则继续保留。 | ACTION-2019 | FUNC-2016 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2014 / AC-2102 | 超管及管理员可在其有管理权限的品牌内维护业务分类和流转模板，同品牌租户共用；配置管理权不自动扩大业务记录查看权。 | ACTION-2019,ACTION-2020,ACTION-2111 | FUNC-2016,FUNC-2017,FUNC-2040 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2014 / AC-2103 | 业务分类具有稳定标识，保存业务编码名称、字段与必填配置，统一导入和查看按分类配置生成内容。 | ACTION-2019,ACTION-2020 | FUNC-2016,FUNC-2017 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2014 / AC-2105 | 流转标签条件直接引用本品牌业务分类中已添加且显示/启用的多选字段及其稳定选项ID；不再另行指定单一标签来源。每条规则按自己的fieldId取本记录当前有效已保存值，字段之间独立，不按名称或首字段猜取。 | ACTION-2019,ACTION-2020,ACTION-2111 | FUNC-2016,FUNC-2017,FUNC-2040 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2015 / AC-2041 | 新模型的有权管理人员修改品牌共用分类基础资料，只改基础信息、原字段显示/顺序/必填和取数配置；不另指定标签来源，单模板路由独立保存。修改不追改既有实例快照，不取得AI专业配置权；旧租户目录及旧AI关联继续按原ID和原规则… | ACTION-2020,ACTION-2021 | FUNC-2017,FUNC-2018 | A：A07 |
| US-2015 / AC-2042 | 公共分类保持一个基础主维护入口，承接原字段顺序、显示、必填、专业编码说明及取数接口字典，保原多源属性到多参数、接口单/多选等已有类型及原授权；独立路由只保存一个模板版本及兼容状态，不覆盖基础/接口。AI场景类型、供应商参… | ACTION-2020 | FUNC-2017 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2016 / AC-2043 | 租户管理员可停用本租户公共分类，未据此增加物理删除能力。 | ACTION-2021 | FUNC-2018 | A：A07 |
| US-2016 / AC-2044 | 公共分类停用后仅禁止新选择和新关联；已关联该分类的AI场景保留原关联，并可按原专业规则继续创建任务；已受理任务按原规则继续，历史分类和专业执行参数保留，不自动解除或改写关联。 | ACTION-2021 | FUNC-2018 | A：A07 |
| US-2017 / AC-2045 | 在原标签管理→场景配置入口补充公共分类关联，保留AI原分类、标签及供应商配置。 | ACTION-2022,ACTION-2044 | FUNC-2019 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2017 / AC-2046 | 公共分类维护权不下放AI专业配置权，新/冷细分及供应商执行允许值沿原规则。保原供应商标签池按supplierId、标签启用与映射按supplierId+总部/门店租户类型+AI标签场景、本地标准集按租户类型+标签场景的作… | ACTION-2022,ACTION-2044 | FUNC-2019 | A：A12；AI不写业务字段/不自动流转的guard仍在，A12仅指出映射配置回退 |
| US-2017 / AC-2047 | 按本租户具体AI业务场景，以稳定ID关联当前品牌有权共用的公共分类；同一AI类型的不同场景可分别归类，沿原标签管理→场景配置入口，保留原AI类型、专业标签/供应商参数和权限。旧租户分类关联保留原ID，不按名称自动合并，实… | ACTION-2022,ACTION-2044 | FUNC-2019 | A：A07 |
| US-2018 / AC-2048 | 客户中心的联系限制入口承接当前租户原公共及专项名单的唯一主维护，原AI拦截入口继续作为同一名单的有权范围视图。保留来源、分组、专项范围、期限和原操作资格，不建立第二份客户名单/禁呼开关，不自动跨租户或品牌共享。 | ACTION-2023,ACTION-2026 | FUNC-2020,FUNC-2021 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2018 / AC-2049 | 历史名单按证据和当前有效状态分流承接：当前有效、租户归属清楚且可核实客户明确拒联证据的记录，经对账后纳入当前租户公共拒联；AI意向保护等专项保留原范围及期限；已解除或已到期记录不重新生效；证据、期限或解除含义不明的保留原… | ACTION-2023,ACTION-2026 | FUNC-2020,FUNC-2021 | C：真实身份/历史状态/远端契约待核；不把Mock当生产 |
| US-2018 / AC-2050 | 本地生效与已有供应商同步状态分开表达；没有实际回执不能显示远端已成功。 | ACTION-2023,ACTION-2026 | FUNC-2020,FUNC-2021 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2019 / AC-2051 | 坐席成功保存客户拒绝联系处理结果后，自动加入本租户公共禁呼，无需管理员再次确认。 | ACTION-2052 | FUNC-2022 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2019 / AC-2052 | 保留来源通话、操作人和时间，四类外呼禁呼且长期有效，正常呼入继续接听。 | ACTION-2050,ACTION-2052,ACTION-2059,ACTION-2063 | FUNC-2022,FUNC-2024 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2019 / AC-2053 | 仅选择而未保存成功不算完成入库；保存与入库一致性、失败恢复须在流程与接口阶段解决，不能虚报整体成功。 | ACTION-2052 | FUNC-2022 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2020 / AC-2054 | 有权管理员及单独获公共禁呼新增授权的运营，需有权查看本租户来源通话并确认拒联后从公共入口加入。 | ACTION-2024,ACTION-2039 | FUNC-2023 | A：A09 |
| US-2020 / AC-2055 | 保留来源及人工确认记录，长期有效、四类外呼拦截；运营新增权不包含解除权。 | ACTION-2050,ACTION-2024,ACTION-2039,ACTION-2059,ACTION-2063 | FUNC-2023,FUNC-2024 | A：A09 |
| US-2020 / AC-2056 | 本版不自动按AI结果入库；无意向、拒接、挂机、混合意向等级及供应商拦截结果不直接认定明确拒联。 | ACTION-2024,ACTION-2039 | FUNC-2023 | D：明确限制/不做项保持，不列漏项 |
| US-2021 / AC-2057 | 公共禁呼覆盖AI、人工、预外呼、IVR，正常呼入不因此被拒接。 | ACTION-2050,ACTION-2059,ACTION-2063 | FUNC-2024 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2021 / AC-2058 | 首次外呼、重呼及异常补提交须接入禁呼检查，不能以供应商restrict tel补提交规则绕过客户明确拒联。 | ACTION-2050,ACTION-2059,ACTION-2063 | FUNC-2024 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2021 / AC-2059 | 供应商已接收未拨号码的拦截/取消/删除能力逐供应商核验，能力不足须提交差异，不能降低已确认覆盖目标。 | ACTION-2050,ACTION-2059,ACTION-2063 | FUNC-2024 | C：真实身份/历史状态/远端契约待核；不把Mock当生产 |
| US-2022 / AC-2060 | 仅本租户管理员或有该租户管理权限的平台管理员解除，填写原因、保留操作人和时间。 | ACTION-2025 | FUNC-2025 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2022 / AC-2061 | 只有业务运营或只有新增名单权限者不能解除；保留原入库来源和解除历史。 | ACTION-2023,ACTION-2025,ACTION-2026 | FUNC-2021,FUNC-2025 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2022 / AC-2062 | 已解除或已到期的历史记录不因旧事件或历史承接重新生效；仅解除本条不自动清除其他来源限制。真实记录的来源/期限/解除含义、多来源有效判定、解除生效时点及远端处理结果仍按实际契约核验后细化。 | ACTION-2023,ACTION-2025,ACTION-2026 | FUNC-2021,FUNC-2025 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2023 / AC-2063 | 接入AI全部已有可用功能，原专业参数、机器人/供应商差异与执行统计规则保留；占位不自动新增开发。 | ACTION-2092,ACTION-2093,ACTION-2094,ACTION-2095,ACTION-2096,ACTION-2097,ACTION-2098,ACTION-2099,ACTION-2100,ACTION-2101,ACTION-2028,ACTION-2029,ACTION-2030,ACTION-2031,ACTION-2032,ACTION-2038,ACTION-2042,ACTION-2043,ACTION-2035,ACTION-2036,ACTION-2103,ACTION-2037,ACTION-2102,ACTION-2104,ACTION-2105,ACTION-2040,ACTION-2041,ACTION-2045,ACTION-2046,ACTION-2047 | FUNC-2027,FUNC-2028,FUNC-2029 | A：A06 |
| US-2023 / AC-2064 | 原AI任务、通话／计费／线索统计、通话／线索记录、场景／标签及专业服务充值能力全量盘点；原首页摘要与使用情况合并为AI用量与服务，摘要／明细／财务分权；原拦截能力归同一公共名单的AI范围。保留旧PAGE及ACTION来源… | ACTION-2022,ACTION-2028,ACTION-2029,ACTION-2030,ACTION-2031,ACTION-2032,ACTION-2038,ACTION-2042,ACTION-2043,ACTION-2044,ACTION-2035,ACTION-2036,ACTION-2103,ACTION-2037,ACTION-2040,ACTION-2041,ACTION-2045,ACTION-2046,ACTION-2047 | FUNC-2019,FUNC-2027 | A：A06；A12；AI不写业务字段/不自动流转的guard仍在，A12仅指出映射配置回退 |
| US-2023 / AC-2065 | 账号与租户基础资料移交公共后，AI专属资源、计费/分钟与充值业务继续保留，不自动合并云呼叫账务。 | ACTION-2028,ACTION-2029,ACTION-2030,ACTION-2031,ACTION-2032,ACTION-2038,ACTION-2042,ACTION-2043,ACTION-2035,ACTION-2036,ACTION-2103,ACTION-2037,ACTION-2104,ACTION-2105,ACTION-2040,ACTION-2041,ACTION-2045,ACTION-2046,ACTION-2047 | FUNC-2027,FUNC-2028,FUNC-2029 | A：A06 |
| US-2023 / AC-2078 | 原租户AI汇总CSV改用当前统一分钟与服务口径，仅含租户名称、租户ID、租户类型、可用分钟、冻结分钟、累计消耗分钟、有效期、呼叫控制状态8列；移除冲突的旧金额及大/小模型独立可用余额列，不换算或恢复旧账。复用原全部有权A… | ACTION-2103 | FUNC-2027 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2023 / AC-2079 | 原AI账号删除在PAGE-2003沿原删除权承接为准确账号主体删除，独立于本租户成员移除、停用和坐席删除；仅无任务、通话、账务等业务引用且没有其他租户关联时允许删除，有业务历史则禁止删除，必要删除审计及稳定身份追溯保留。… | ACTION-2104 | FUNC-2028 | A：A10 |
| US-2023 / AC-2080 | 原AI租户删除在PAGE-2004沿原删除权只作用于准确单个业务租户；仅无任务、通话、账务等业务引用时可删，有业务历史继续保留，必要删除审计保留并维持原默认管理组不可删保护。复用原确认和反馈，最终提交中一致校验对象、原权… | ACTION-2105 | FUNC-2029 | A：A10 |
| US-2024 / AC-2066 | 承接云呼叫最终v1.1.0范围内的人工工作台、主动外呼、呼入接听、跟进与保存结果，沿各自原规则。 | ACTION-2049,ACTION-2050,ACTION-2051,ACTION-2052 | 原保留引用/约束 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2024 / AC-2067 | 当前核对口径包括人工接口线索指定坐席、振铃填写和后续人工跟进；最终以v1.1.0确认基线逐项对账，不在v2改写其需求。 | ACTION-2049,ACTION-2050,ACTION-2051,ACTION-2052 | 原保留引用/约束 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2025 / AC-2068 | 承接v1.1.0最终范围的预外呼任务、导入、任务所用坐席／外呼组及其他资源、正常重呼、异常补提交及结果查询/下载，原执行规则保留。 | ACTION-2056,ACTION-2057,ACTION-2058,ACTION-2059,ACTION-2060 | FUNC-2043 | A：A11 |
| US-2025 / AC-2069 | 公共禁呼检查接入不改变原供应商失败分类及额度，不将预外呼策略套用于人工或IVR。 | ACTION-2050,ACTION-2056,ACTION-2057,ACTION-2058,ACTION-2059,ACTION-2060,ACTION-2063 | FUNC-2024,FUNC-2043 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2026 / AC-2070 | 承接既有IVR外呼任务、语音流程资源及结果处理，与人工/预外呼各自执行方式区分。 | ACTION-2061,ACTION-2062,ACTION-2063,ACTION-2064 | 原保留引用/约束 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2026 / AC-2071 | 资源必须归属对应租户、供应商账号及外呼用途；具体校验沿原最终基线，不把本地或呼入流程ID直接当可执行外呼资源。 | ACTION-2050,ACTION-2059,ACTION-2061,ACTION-2062,ACTION-2063,ACTION-2064 | FUNC-2024 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2027 / AC-2072 | 承接云呼叫v1.1.0最终范围的坐席／供应商资源、呼入配置、记录、七类原报表及必要DCC导入／回传／应用接入。原综合概览的统计、任务、监管、租户及号码片段归既有目标，来源查看权不授目标整页、导出或写入；不合并AI／Clo… | ACTION-2088,ACTION-2089,ACTION-2090,ACTION-2054,ACTION-2055,ACTION-2121,ACTION-2053,ACTION-2060,ACTION-2065,ACTION-2066,ACTION-2067,ACTION-2070,ACTION-2071,ACTION-2072,ACTION-2073,ACTION-2074,ACTION-2075,ACTION-2076,ACTION-2077,ACTION-2078,ACTION-2079,ACTION-2081,ACTION-2068,ACTION-2069,ACTION-2091,ACTION-2080,ACTION-2082,ACTION-2083,ACTION-2085 | FUNC-2043 | A：A05 |
| US-2027 / AC-2073 | 必要接口承接本身不扩业务范围；v1.2同品牌总部/门店线索流转按SRC-2081本次明确要求独立纳入，完整DCC业务、通用自动规则引擎及独立v1.1.1新接口需求不自动加入本版。 | ACTION-2088,ACTION-2089,ACTION-2090,ACTION-2054,ACTION-2055,ACTION-2121,ACTION-2053,ACTION-2065,ACTION-2066,ACTION-2067,ACTION-2070,ACTION-2071,ACTION-2072,ACTION-2073,ACTION-2074,ACTION-2075,ACTION-2076,ACTION-2077,ACTION-2078,ACTION-2079,ACTION-2081,ACTION-2068,ACTION-2069,ACTION-2091,ACTION-2080,ACTION-2082,ACTION-2083,ACTION-2085 | 原保留引用/约束 | D：明确限制/不做项保持，不列漏项 |
| US-2028 / AC-2074 | 在品牌管理提供关联租户列表，按当前品牌与操作人有权查看的租户基础资料范围取交集，只展示该范围内的基础资料。 | ACTION-2018 | FUNC-2026 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2028 / AC-2075 | 同品牌不授予其他租户的基础资料、业务、线索、任务或报表权限；无权租户不得因列表、直接请求或维护入口被展示或进入。 | ACTION-2018 | FUNC-2026 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2028 / AC-2076 | 查询列表不自动修改归属；需要维护时复用既有租户管理路径及品牌归属维护权限，列表查看权不包含归属修改权。 | ACTION-2018 | FUNC-2026 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2028 / AC-2077 | 区分无关联记录、可查看交集为空、查询失败及品牌或权限失效；失败保留查询上下文，不将缓存当最新结果，进入维护前再次核验实际权限。 | ACTION-2018 | FUNC-2026 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2029 / AC-2084 | 转交成功即把跟进归属从A切换给B，由B接续，无需B再确认接收；同次清除旧租户的assignment/assignedAccountId等执行安排，接收方另按本租户资格分配，不带入旧坐席、不自动发起呼叫。 | ACTION-2108,ACTION-2109 | FUNC-2030 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2029 / AC-2085 | 本期跨租户线索转交发生在同一品牌关联范围内。 | ACTION-2108,ACTION-2109 | FUNC-2030 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2029 / AC-2086 | 支持媒体来源线索经总部培育后，由人员确认向该线索意向门店所唯一对应的同品牌有效门店租户转交；没有意向门店时按总部待指派分支处理，不任意指定另一门店。 | ACTION-2108,ACTION-2109 | FUNC-2030 | A：A04 |
| US-2029 / AC-2087 | 支持门店自有线索经门店培育后按既有流程上交总部；总部再培育后按意向门店锚定规则或无意向待指派分支确认下发，不因缺少意向门店自动改变门店原归属。 | ACTION-2108,ACTION-2109 | FUNC-2030 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2029 / AC-2088 | 门店不能直接向另一门店转交线索。 | ACTION-2108,ACTION-2109 | FUNC-2030 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2029 / AC-2089 | 门店培育后需要再分给门店时，先按既有流程交总部；总部再按线索意向门店锚定下发，无意向门店时由总部管理员补选并确认，门店不能直接互转。 | ACTION-2108,ACTION-2109 | FUNC-2030 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2029 / AC-2097 | 总部下发或再分发时，目标只由本条线索的意向门店唯一解析到同品牌有效门店租户；有权人员核对并确认，不能改选其他门店，解析本身不自动转交或呼叫。 | ACTION-2108,ACTION-2109 | FUNC-2030 | A：A04 |
| US-2029 / AC-2098 | 总部当前线索缺失意向门店时，沿用同一记录标记目标门店待指派，保留原记录ID、品牌编码、批次和历史，总部继续负责；不复制线索、不新增模板实例、不将其等同于坐席或任务未分配。 | ACTION-2054,ACTION-2055,ACTION-2106,ACTION-2108,ACTION-2109 | FUNC-2030,FUNC-2033,FUNC-2036,FUNC-2039 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2029 / AC-2099 | 目标门店待指派时，仅当前负责总部租户管理员可在本次转交中补选同品牌有效门店并确认提交；运营、当前坐席及超管监管身份不因此获得该补选资格，查看仍沿原有授权范围。 成功后保留客户原始意向，另行记录人工指派来源、目标、指派人和… | ACTION-2106,ACTION-2108,ACTION-2109 | FUNC-2030,FUNC-2033 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2029 / AC-2100 | 已有意向门店但缺少可靠身份、无对应租户、映射不唯一、跨品牌或目标停用等情况明确标记映射待核或不可办理；不能按门店名称、列表首店猜测，不能伪装无意向门店而开放任意补选。 | ACTION-2055,ACTION-2106,ACTION-2108,ACTION-2109 | FUNC-2030,FUNC-2033,FUNC-2039 | A：A04 |
| US-2029 / AC-2101 | 提交下发时重新核对本条意向门店或无意向补选分支、目标映射与有效性、当前资格/归属/固定模板节点及不再呼叫条件；字段或映射变化、取消、失败和结果未知均不伪报转交成功，同次幂等不重复切换归属或建轮次。 | ACTION-2108,ACTION-2109 | FUNC-2030 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2030 / AC-2090 | 总部处理媒体线索及承接门店上交线索的培育阶段均支持选择AI、预外呼、人工跟进。 | ACTION-2107,ACTION-2110 | FUNC-2031,FUNC-2032 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2030 / AC-2091 | 门店处理自有线索及承接总部下发线索的培育阶段均支持选择AI、预外呼、人工跟进。 | ACTION-2107,ACTION-2110 | FUNC-2031,FUNC-2032 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2030 / AC-2092 | 每一轮由当前负责租户按需组合或先后使用AI、预外呼、人工。启动下一方式核整条记录最近执行段已结束且结果保存，换负责租户或换轮次不能豁免，只有整条记录从未有执行段才无前段；转交本身仍按结束且不再呼叫准入，不一律追加结果先保… | ACTION-2050,ACTION-2052,ACTION-2059,ACTION-2063,ACTION-2107,ACTION-2110 | FUNC-2022,FUNC-2024,FUNC-2031,FUNC-2032 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2031 / AC-2093 | 接收租户可查看转入线索的基本信息。 | ACTION-2106 | FUNC-2033 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2031 / AC-2094 | 接收租户可查看该线索历轮跟进结果。 | ACTION-2106 | FUNC-2033 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2032 / AC-2104 | 对已保存的本品牌业务分类，从分类列表独立路由配置入口关联且只关联一个有效流转模板保存版本；核对品牌、分类字段/标签、节点及路径条件兼容；不提供备用模板或接续映射配置。 | ACTION-2111 | FUNC-2040 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2032 / AC-2106 | 分类列表保留独立路由配置按钮和独立保存；基础新增/编辑不嵌入模板关联；路由配置只选择一个模板并展示节点说明。 | ACTION-2019,ACTION-2020,ACTION-2111 | FUNC-2016,FUNC-2017,FUNC-2040 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2032 / AC-2107 | 独立路由保存只更新本次选定的一个模板版本及兼容结果；核品牌、BASE/字段与ROUTE版本，不覆盖分类名称/字段/接口；冲突、取消或响应未知保留输入，同次核对不重复生成版本。 | ACTION-2019,ACTION-2020,ACTION-2111 | FUNC-2016,FUNC-2017,FUNC-2040 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2032 / AC-2108 | 分类可先保留为未关联模板；仅有关联的有效兼容模板才能接收新数据。分类字段变更破坏模板条件兼容时保引用、标需复核并拦新输入。新记录固定当时基础、路由和单一模板/路径条件快照；既有实例及历史不追改。 | ACTION-2019,ACTION-2020,ACTION-2111,ACTION-2054 | FUNC-2016,FUNC-2017,FUNC-2036,FUNC-2040 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2032 / AC-2134 | 路由配置选择模板后立即只读展示该精确保存版本的模板名称/版本、起始节点及各节点名称、职责、允许处理方式、后续路径与已配置条件；不修改模板内容，不假定列表顺序就是线性流转，未选择显示引导空态。 | ACTION-2111 | FUNC-2040 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2032 / AC-2135 | 分类新增/编辑与独立路由均无独立标签来源指定控件；保存分类不提交tagFieldId。路由逐条件校验fieldId及选项属于分类已启用多选字段，既有字段/路由互不覆盖。新记录按各字段固定定义和各自当前已保存值判定，省略不… | ACTION-2019,ACTION-2020,ACTION-2111,ACTION-2110 | FUNC-2016,FUNC-2017,FUNC-2032,FUNC-2040 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2033 / AC-2109 | 有权配置人员可创建模板，或修改模板并形成可识别的新版本；节点包含职责、处理方式及合法接续路径。 新建模板不预设节点，添加节点为空白，由有权人员逐个配置；起始节点明确选择。 | ACTION-2112,ACTION-2113 | FUNC-2034,FUNC-2035 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2033 / AC-2110 | 业务实例记录使用的模板版本；后续修改模板不得静默改变已经执行的节点或历史资料。 | ACTION-2112,ACTION-2113 | FUNC-2034,FUNC-2035 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2033 / AC-2111 | 模板保持品牌及目标资格校验；线索分类继续遵守总部与门店合法方向，模板不能绕过执行与归属准入。 | ACTION-2112,ACTION-2113 | FUNC-2034,FUNC-2035 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2033 / AC-2112 | 有权超管或品牌租户管理员可在流转模板的后续路径上配置通话状态、线索标签等流转条件；只有所选路径条件符合才允许确认流转，条件配置不是自动呼叫或自动推进开关。 | ACTION-2112,ACTION-2113 | FUNC-2034,FUNC-2035 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2033 / AC-2113 | 多条条件支持配置全部满足或任一满足；同一个通话状态条件可选择多个状态，实际状态命中任一所选值即符合该条条件。 | ACTION-2112,ACTION-2113,ACTION-2116 | FUNC-2034,FUNC-2035,FUNC-2038 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2033 / AC-2114 | 后续路径可不配置附加条件并沿用原人工准入；开启条件则须有合法规则，条件组支持ALL/ANY，通话状态单规则多值命中任一，标签规则可配置包含任一或包含全部。字段须来自可核目录、类型及操作符相容、所选状态或标签选项身份有效；… | ACTION-2111,ACTION-2112,ACTION-2113 | FUNC-2034,FUNC-2035,FUNC-2040 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2033 / AC-2136 | 流转模板列表提供独立查看详情入口；只读展示精确保存版本的名称、起始节点、各节点职责、允许方式、后续路径与条件，字段含义与新增/编辑一致；历史配置为辅助只读查看，不能修改已保存版本。 | ACTION-2114 | FUNC-2041 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2033 / AC-2137 | 流转模板列表提供独立删除入口；有权人员核对后仅可删除没有分类当前/历史、记录/批次或待核配置引用的模板；提交复核品牌权限、模板版本与引用，取消/失败不删除，响应未知只核同次结果，引用保护不得被绕过，已有实例和历史不受影响… | ACTION-2115 | FUNC-2042 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2034 / AC-2115 | 导入前选择有权业务分类，字段、业务编码名称和必填校验随分类配置变化，至少用线索类和另一分类验收。 | ACTION-2054 | FUNC-2036 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2034 / AC-2116 | 业务记录在同品牌、同业务分类内编码唯一，跨分类可以同码；线索分类保留品牌内线索编码唯一。不以手机号归并，平台记录ID稳定。 | ACTION-2054 | FUNC-2036 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2034 / AC-2117 | 导入结果能在统一台账定位并继续分配/处理；同条业务重复接收不得覆盖当前归属及既有历史，冲突给出明确处理结果。 | ACTION-2054 | FUNC-2036 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2035 / AC-2118 | 租户内分配坐席或加入任务不改变负责租户；跨租户归属转交作为不同业务动作执行并留痕。 | ACTION-2121,ACTION-2117 | FUNC-2037 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2035 / AC-2119 | 分配时核对当前归属、人员资格、分类节点允许方式、记录/安排版本及本租户任务/坐席资源；过期或无权不改变记录。复用原批次多选分配时逐条复核，共同资源合法后同次提交，任一行失败全批不写，不以分配代替租户转交或自动启动。 | ACTION-2121,ACTION-2117 | FUNC-2037 | A：A01 |
| US-2036 / AC-2120 | 节点由人员确认推进，处理方式也由人员主动启动；选择模板不自动发起呼叫或转交。 | ACTION-2050,ACTION-2059,ACTION-2063,ACTION-2107,ACTION-2108,ACTION-2109,ACTION-2116 | FUNC-2024,FUNC-2030,FUNC-2031,FUNC-2038 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2036 / AC-2121 | 线索分类同一条记录串行执行。人员启动下一种方式时核整条记录最近执行段已结束且结果保存，换租户/换轮次不免除；仅整条记录从未有执行段时无前段。实际租户转交只按执行结束及确认不再呼叫等原准入，不额外要求所有前段结果已保存。 | ACTION-2050,ACTION-2052,ACTION-2059,ACTION-2063,ACTION-2107,ACTION-2108,ACTION-2109,ACTION-2110,ACTION-2116 | FUNC-2022,FUNC-2024,FUNC-2030,FUNC-2031,FUNC-2032,FUNC-2038 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2036 / AC-2122 | 受理、结束、保存、归属与节点推进分别确认；办理状态待核先核对同次实际结果，不能重复推进或制造重复执行。 | ACTION-2050,ACTION-2052,ACTION-2059,ACTION-2063,ACTION-2107,ACTION-2108,ACTION-2109,ACTION-2110,ACTION-2116 | FUNC-2022,FUNC-2024,FUNC-2030,FUNC-2031,FUNC-2032,FUNC-2038 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2036 / AC-2123 | 条件通话状态取当前负责租户当前培育轮次最近一次已结束通话，不用其他租户或历史轮次任意命中；每条多选规则直接按自身fieldId/optionId读取本记录对应字段当前有效已保存值及来源/版本，各字段独立，不借同名或首字段… | ACTION-2022,ACTION-2044,ACTION-2107,ACTION-2108,ACTION-2109,ACTION-2110,ACTION-2116 | FUNC-2019,FUNC-2030,FUNC-2031,FUNC-2032,FUNC-2038 | A：A12；AI不写业务字段/不自动流转的guard仍在，A12仅指出映射配置回退 |
| US-2036 / AC-2124 | 办理时分别显示匹配、未匹配、待核及原因；未满足或整体待核时保留原节点/归属，不自动推进、呼叫或更换模板。缺值/未知的单条规则不当作true；ALL为任一明确false则不匹配、否则有unknown则待核，ANY为任一明确… | ACTION-2106,ACTION-2107,ACTION-2108,ACTION-2109,ACTION-2110,ACTION-2116 | FUNC-2030,FUNC-2031,FUNC-2032,FUNC-2033,FUNC-2038 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2036 / AC-2125 | 人员确认所选路径时，重新核对固定单模板版本/路径、当前负责租户本轮最近结束通话，以及各规则对应业务fieldId当前有效已保存值/来源/定义和值版本，同时满足原权限、节点、门店锚定/无意向HQ管理员同次指派与执行准入。配… | ACTION-2022,ACTION-2044,ACTION-2107,ACTION-2108,ACTION-2109,ACTION-2110,ACTION-2116 | FUNC-2019,FUNC-2030,FUNC-2031,FUNC-2032,FUNC-2038 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2038 / AC-2129 | 超管具有所管理品牌/租户/分类的监管查看视角，菜单、列表、详情与直接访问资格一致；监管查看不自动赋予业务代处理权限。 | ACTION-2055,ACTION-2106 | FUNC-2033,FUNC-2039 | A：A02 |
| US-2038 / AC-2130 | 监管查询和业务处理读取同一记录及实际轨迹，不需要冒用业务租户身份或建立第二份线索表。 | ACTION-2055,ACTION-2106 | FUNC-2033,FUNC-2039 | A：A02 |
| US-2039 / AC-2131 | 工作区统一承载数据台账、导入批次及记录详情，展示字段按分类变化，旧入口可定位对应记录或批次。 | ACTION-2054,ACTION-2055,ACTION-2106 | FUNC-2033,FUNC-2036,FUNC-2039 | A：A01；A02 |
| US-2039 / AC-2132 | 业务人员仍按当前负责或有权历史范围查看；线索已转出方按截止裁剪，再次承接按当前身份，不因品牌共用配置获得全品牌业务数据权。 | ACTION-2055,ACTION-2106 | FUNC-2033,FUNC-2039 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |
| US-2039 / AC-2133 | 仅新进入的数据使用模板；存量保留原查询和原处理，不自动迁移或绑定新模板。分类配置或名称变化后新模型历史按保存快照可读。 | ACTION-2054,ACTION-2055,ACTION-2106,ACTION-2110 | FUNC-2032,FUNC-2033,FUNC-2036,FUNC-2039 | B：对应本方模型/原代码已定位，已有证据仅覆盖相应本地用例，尚非全量后态通过 |

### 数量和校验

- 当前PAGE43逐项有承载说明，nav41个ID无缺号；35菜单＋6内部页。登录与壳由js/app.js承载，不为补数字增菜单。
- 历史3PAGE对应4ACTION不混入当前113；源辅助PAGE-2224/ACTION-2084另列。
- 113/113动作均有当前入口、处理函数、后态及权限核查行；222/222保留引用均有当前参考文件及函数锚点。
- 38/38故事、134/134AC均有逐条归属，无无归属AC；A/B/C/D含义与open-items本轮核查一致。
- A12只指未知标签默认落首项的配置行为，当前AI→业务字段禁写仍在；未把明确不做项算漏项。
- file直开/CSV上传仅记实际未验，PAGE-2112权域仍待核，12延期14工程缺证均保留。
- 后续修复需按实际用户安排另行推进；本轮没有改业务代码或冻结历史。


## 已授权原位修复（接续本次审计）
用户Sentinel_ff5b433fc24c8191977f4707cb3b19f0明确“修复这些问题”。按最终审计标题/证据修12组A项，C07不改、不新增权限或产品口径。分批：A01/A02 → A10（删除引用）/A12（未知标签映射） → A03/A04 → A05/A11（任务客户导出）/A06/A09 → A08/A07。保留五区域/业务&客户和原UI，不改参考/冻结历史， file/CSV限制及12延期14缺证不变。上述审计未修改业务代码的陈述仅指核查阶段；后续修复与新证据在此继续追加。

### 修复第1批 A01/A02：代码与回归
- A01：Cloud角色模板显式包含2226/2227；存量有效角色按模板派生隐藏业务页访问，不迁移/覆盖保存数据；办理判断读取Cloud业务角色，只读不再落回泛operator。隐藏业务页保持原Cloud电话现场。
- A02：按明确的监管资格及当前brandIds/tenantIds交集读取；原只读台账/详情显示监管身份。平台称谓不授监管，资源/财务身份不继承。监管上下文拦所有业务提交，旧批次commit也拒绝写入，原其他合法资源入口仍保留。
- 新证据：/tmp/d-v200-repair-a01-a02.cjs验证保存原角色及新reader/operator/admin不丢子页、只读不能写、监管无处理权；/tmp/d-v200-regulator-engine-check.cjs用当前生成模型验证缩小租户范围后不读越界记录、禁止写且账本未变。实际HTTP用超管打开原E2E批次/详情，显示“监管只读”、原周岚2201承接仍在，没有分配/启动/转交按钮；截图/tmp/d-v200-repair-a02-regulator.png。只读回看，未重跑主线。
- C07保持待定；当前修复编号按最终12A标题，原修复指令的删除引用=A10、导出入口=A11、未知标签=A12。


## 2026-10-26 · A01–A12 原位修复及一次异常复查

本节为已获授权修复后的增量结论；前面的只读审计表保留为修复前事实，不覆盖历史结论。仍是有限静态 Mock，正式分析 S8/G3、12项延期和14项工程缺证均未关闭。

| 项目 | 当前处理 | 本轮验证与边界 |
| --- | --- | --- |
| A01 隐藏业务页授权丢失 | 保存角色时保留2226/2227；旧角色只读派生兼容，读写分别校验 | 同角色重新保存、新读者/运营/管理员、无权与只读反例通过；不迁移浏览器旧授权 |
| A02 有权超管监管入口 | 显式品牌/租户范围交集；复用原台账与详情，禁止办理提交 | 原生成引擎越界/写入反例；实际监管详情显示周岚2201且无办理控件 |
| A03 云呼叫账号关联与开通 | 原账号目录选择、精确ID/运行状态/唯一关联检查；无资源不能开通云呼叫，AI独立 | 新租户、停止账号、占用账号、未知结果、原资料原子保存隔离检查；UI读取原账号占用状态 |
| A04 门店业务编码维护 | 公共租户资料补入口，复用原关联表；前导零、同品牌唯一、旧编码按原值读取 | 权限、同品牌重复、过期表单、已有业务锁品牌但可改编码通过；UI读到原字段，无修改主线门店映射 |
| A05 六个云报表入口 | 现有报表页增加原七分项页签，保原统计/筛选/权限及分项恢复 | 六个缺失分项逐一实际打开；切出再返回服务技能；复用原platform-tab样式 |
| A06 AI线索回访入口 | 业务&客户中显式菜单，直接原result-clue | 实际原筛选/列表显示；仍只依赖AI授权，不合并客户对象 |
| A07 旧租户目录停用与未关联品牌回退 | 原租户与品牌目录明确分支，原稳定ID/原字段控制器保留；旧目录停用不改变品牌目录 | 隔离真实生成模型/页面控制器验证停用、重新启用、未知/损坏/越界拒绝及未关联品牌回退；当前浏览器无旧目录样本，未冒称该分支实际UI提交。只读到保存时才原子保留原品牌投影，不批量迁移旧数据 |
| A08 表单离开保护 | 提示层独立叠加，保存调用原真实提交函数；待核同请求核对，不重复提交 | 实际取消保留输入、无效保存留表单、恢复原值保存并继续、放弃未提交联系人；隔离待核/并发/身份变化反例 |
| A09 AI来源拒联入口 | 原通话行增加确认入口，精确带入租户/会话/平台/号码，仍须勾选与依据 | 实际打开来源确认并取消；号码与来源锁定，无自动入库；既有授权运营新增/解除分权模型通过 |
| A10 删除引用遗漏 | 纳入公共记录、AI配置/场景关联和未知引用；账号不完整归属保守阻止 | 全部删除测试在隔离内存完成；真实浏览器账号/租户/业务记录未删除 |
| A11 任务客户六列导出 | 原有真实名单非空时显示原导出，空数据不显示可用入口 | 实际任务2条名单下按钮出现；原导出函数隔离核对6列、对象范围/空结果；未重复下载CSV |
| A12 未匹配AI标签回退首项 | 未知标签保持未映射，名称推荐需显式选择，初始化不写猜测映射 | 原生成函数隔离反例通过；既有保存映射原样保留，不新增AI字段写入 |

一次异常复查又确认 E01：预外呼任务的客户子页在跨区域返回时丢失，且父导航可能叠加原详情层。已补精确任务/页签位置恢复，并以原primaryNavigation打开父菜单；恢复时仍校验原对象、当前租户、任务类型及页面权限，未保存原表单先阻止切换。实际“上海门店·本任务再次联系 → 客户数据 → 业务&客户 → 呼叫中心”恢复同任务2条名单；切报表后无残留任务层。未恢复未提交向导，也未启动/继续/终止任何任务。

最终18组定向检查全部通过，190个原参考资源和90个分析输入SHA保持；全部当前JS语法检查通过。浏览器为原HTTP标签980687976，当前普通页面无新增error日志。原主线E2E-20261026-01未重新办理、转交、保存结果或启动门店段。本轮唯一额外组织保存是恢复原租户名称原值后的“保存并继续”验证；未提交联系人已放弃并回读为空。

补充证据：/tmp/d-v200-repair-verification-results.json；/tmp/d-v200-repair-a02-regulator.png；/tmp/d-v200-repair-tenant-code.png；/tmp/d-v200-repair-ai-source-refusal.png；/tmp/d-v200-repair-unsaved-form.png；/tmp/d-v200-repair-form-save.png；/tmp/d-v200-repair-task-customer-export.png；/tmp/d-v200-repair-task-position.png；/tmp/d-v200-repair-report-tabs-final.png。

未扩大结论：C07管理登录特例未改；PAGE-2112独立财务权域仍待核；真实上传被扩展文件权限阻断，不启用权限、不重试绕行；file入口仍保留既有拒绝，未重试。36可见菜单+5内部页仍共41导航ID，加登录/外壳为43当前页面，未新增PAGE或业务功能。Step07未完成全量专业操作验收，保持S7，不标S8或正式交付通过。


## 2026-10-27T08:15:52+08:00 · 限定补验 A03/A04 与 A11

本轮仅补实际UI证据，不重跑此前18组检查、不改业务代码、不新建原型或备份。执行前既有记录明确：A03/A04只有隔离模型和表单展示，A11只有原函数/按钮证据。首次对私有临时目录与Downloads按目标文件名读取，仅找到八列财务CSV，没有任务客户明细文件。

### A11 实际下载已完成、文件核验通过
- 操作范围：原Chrome HTTP标签980687976，`http://127.0.0.1:54823/2.0.0/prototype/index.html#PAGE-2205`；李明/上海华东门店；原任务“上海门店·本任务再次联系”客户数据页，任务已暂停。
- 点击前实际UI核对2条名单：沈悦/13971207174/LEAD-SH-20260921-SAME-TASK-FOLLOWUP-1，许宁/13971207176/LEAD-SH-20260921-SAME-TASK-FOLLOWUP-3，来源批次均“上海门店·本任务再次联系名单”。未点击继续、终止、再次联系或导入。
- 本轮仅发出一次“导出当前结果”点击请求。下载事件等待超时，工具会话随后重置，未收到下载完成事件或路径回执，初始结果因此记为不确定；没有重放点击。协调端报告等待审批超过10分钟，但本端未取得审批请求ID或批准/取消回执；没有正式取消/跳过接口可用，不声称取消成功或超时批准。
- 后续只读发现实际文件 `/private/tmp/任务客户明细.csv`，写入时间 2026-10-27T08:10:11+08:00，454字节；SHA-256 `98a761431053dfec1fa66df9475a1c9354fe52e05aee7e8a0a46f6346793e61d`。这份实际文件将下载结果从不确定收口为已生成，不推断审批状态。
- UTF-8 BOM存在；表头准确为“客户称呼、客户号码、来源批次、业务单据、处理状态、联系备注”；2数据行，每行6列。姓名、号码、批次、业务编码、备注逐行与点击前当前有权UI名单一致，两行处理状态均为“待继续跟进”。不含总部或主线13800009993。
- CRLF无裸LF；严格CSV解析通过，按全部字段双引号及CRLF重新序列化与原文件字节文本一致。当前文件的引用/分隔转义结构正确；文件没有额外的内部引号、换行或公式挑战样例，不把它冒称这些分支的新实际UI证明。
- 这是实际任务客户六列CSV，不是八列财务服务CSV；未做第二次导出。因连接失败，未补造下载后截图，文件及点击前UI为本轮证据。

### A03/A04 新建租户实际UI仍待验（本轮新增0条演示数据）
- 下载未决期间没有切换身份、创建租户、改模块或资源；避免影响保存现场。实际文件核验完成后，用户回复“已恢复连接”，仍无法读取原标签。
- 当前Chrome标签列表能找到同一HTTP标签980687976（PAGE-2205）；正常读取与受支持的同标签重新接管均返回Debugger unattached。未改扩展权限、未另开标签绕行、未访问file入口/上传、未操作Codex界面。
- 新建租户保存/回读、门店编码保存和云模块门槛这组实际UI操作尚未开始，没有新增租户ID或门店编码。既有账号绑定、门店映射和E2E主线记录未改。
- 最小继续条件：恢复这一个原HTTP标签的可读/可操作调试连接。恢复后先只读当前租户及资源目录，必要时仅新增一个明确演示门店并保存回读；若没有未占用且运行中的准确资源，只验基础保存和开通拒绝，不解绑、挪用、猜映射或增权限。当前未重新读取资源目录，不将“无空闲资源”写成本轮已证实阻塞。

C07、PAGE-2112、file/上传限制、12延期14工程缺证保持，原型仍S7；以上不是生产或G3批准。


## 2026-10-27T08:28:53+08:00 · 昨晚剩余项接续：当前分类与结论

本节更新08:15挂起结果；用户新反馈“所有人工操作已点击”后，原Chrome HTTP标签980687976已实际返回可读DOM。保留同一执行者/原型目录，无重复导出、18组重跑或主线重办。

### 已补齐实际UI证据
- **A03/A04 新租户保存和回读**：只新建1个演示租户“界面回归门店-20261027”，ID `TEN-1793060448450-gy85`，品牌 `BRAND-NISSAN`（东风日产），组织为门店，联系人“本地Mock补验”，门店业务编码文本 `00020261027`，云呼叫账号留空。单次保存后列表出现1行；刷新后和后续重新登录超管后，均读到同一ID、名称、联系人、品牌、组织及带前导零编码。东风日产品牌关联租户列表也显示此门店。
- **A03 模块门槛**：对上述新租户仅尝试1次云呼叫开通，明确拒绝并提示先关联云呼叫账号；未写成开通。随后切换本次办理模块为AI并保存1次，AI已开通、云呼叫仍未开通、资源仍待配置，重新登录读回相同状态。没有创建成员/电话坐席或执行业务任务。
- **A11 下载回执补齐**：恢复连接后的原任务客户数据页仍显示“已生成2条记录的导出文件，请查看浏览器下载”；补截真实回执。沿用08:15已核验的 `/private/tmp/任务客户明细.csv`，没有再次点击导出或生成第二份文件。
- 实际资源目录：`7522240`、`7522241`、`DEMO-ENT-003`均已关联原租户；`CCC-TEST`已停止，全部不可选择。本轮没有解绑、挪用、启用这些资源，也没有猜测新的供应商ID。原3个业务租户资料、资源关联和主线门店映射保持。

### 已有明确依据的实现缺陷：C07已修复
- 已读并按source-index SHA核验 `SRC-2032` / `inputs/user-page-management-landing-confirmation-20261016.md` 及 `SRC-2034` / `inputs/user-page-public-location-memory-confirmation-20261016.md`。前者明确仅公共管理身份登录进入原首个有权管理页；后者仅确认同次登录内管理位置恢复，并明确PAGE-Q02保持不变。当前BR-2004/2005同样保留这两个边界，六/五区域归并没有变更该例外。因此不再把这两个范围不同的规则当作需要用户重新决定的矛盾。
- 修改仅在 `js/components/session-store.js`：新登录选定范围时，对只有公共管理页面且没有专业/原Cloud业务页访问资格的身份采用原公共菜单次序；同次页面返回和刷新继续按原合法位置恢复。业务、资源、财务账号的落点及租户恢复不改，不删除旧位置、不新增权限、不修改上游或G3。
- 修复前隔离复现：仅管理身份退出后回到PAGE-2005。修复后新增单项检查 `/tmp/d-v200-public-login-check.cjs` 通过，仅重测受影响边界，未重跑18组。实际UI：公共管理演示登录到“账号与成员”；进入品牌管理并查询“东风”，切去业务&客户再返回时仍是品牌管理及原筛选；退出重登再次进入账号与成员，未出现呼叫中心权限。

### 已修但仍缺部分实际样例的分支
- A03新租户**成功关联并开通云呼叫**：当前没有未占用且运行中的合法资源样例，因此本轮UI仅证明保存回读及拒绝/独立模块分支；原隔离成功分支证据仍只算模型。最小补验条件是一个已登记、明确可用于此本地演示租户、未占用且运行中的账号；不以挪用现有账号补过。
- A07原租户目录及未关联品牌回退：已有真实生成模型/原控制器隔离证据，当前浏览器没有旧目录实际样本；不为了补截图迁移或捏造历史数据。品牌正常目录及AI关联入口已有UI证据。
- 原222保留操作没有逐条全部实测，已有有限UI/模型证据边界不变。本轮剩余清单内没有新增未修的确认实现缺陷，不据此声称系统不存在其他缺陷。

### 研发/权域待证（不是前端开关修复）
- PAGE-2112/C01：复核现有已纳入分析的Wiki接口证据API-2002/API-2015。已提供用户roleIds、公司scope及套餐/用量/充值记录候选定义；API-2015仍partial、auth为空、production_verified=false，原角色及准确财务作用范围继续待核。原只读参考 `AI 外呼/js/components/recharge-service.js:51–54` 的管理守卫要求 `super_admin` 与明确accessibleTenantIds；这不是把本方同名超管或仅导出身份自动提升为原财务管理员的依据。
- 当前DEMO-FINANCE只有service.export；未增加service.view、充值或手调权。最小缺证是“哪个统一账号/原角色，对哪些准确AI租户，分别可查看服务、充值、手调”的明确映射及原接口实现证据；不能只批准一个泛化管理角色。
- C02–C06及原12延期/14工程缺证保持，尤其真实身份、历史禁呼、远端在途/终态、执行/保存/门店映射等。没有真实接口调用或生产验证。

### 工具受限与现场
- 浏览器调试连接已恢复并实际完成上述UI，旧Debugger unattached挂起原因本轮已解除。中途一次退出定位超时后先只读核对，未重放任何创建、保存或导出；后续正常退出/登录分别确认。
- file直开及CSV选择上传的既有拒绝仍有效，不改安全设置、不换通道重试。用户“所有人工操作已点击”不被泛化为这些具体场景已人工验收通过。
- 当前无未保存表单/电话，原标签停在租户管理并保留。新的截图：`/tmp/d-v200-task-csv-receipt.png`、`/tmp/d-v200-new-tenant-saved-20261027.png`、`/tmp/d-v200-new-tenant-readback-20261027.png`、`/tmp/d-v200-new-tenant-cloud-denied-20261027.png`、`/tmp/d-v200-new-tenant-relogin-20261027.png`、`/tmp/d-v200-new-tenant-brand-link-20261027.png`、`/tmp/d-v200-public-login-fixed-20261027.png`。本轮仅新增上述1个租户及其AI开通记录，无备份包或第二套原型。

原型继续停留S7；尚未全量UI验收，正式分析S8/G3及生产风险状态不变。


## 2026-10-27 · PAGE-2112本地演示授权提案（待用户决定，尚未实施）

为继续既有服务、充值、手调和流水页面验收，提出有限Mock映射；这是对尚未明确的演示授权进行具体化，不把生产角色/权限当作已验证。

- 本方身份：平台超级管理员 `ACC-SUPER-001`，现有 `platform` 范围。
- 对象范围：仅 `TEN-NISSAN-HQ` / AI示例租户 `2054080803329462274`。不含上海门店、新建界面回归门店或全租户通配符。
- 操作：原服务明细查看；原试用/标准年包/话费包模拟办理；原手工调整；原充值/调整流水查询。全部复用原PAGE-2112及原RechargeService，不新增计费口径、支付流程或业务功能。
- 原模型身份：仅在上述页面/动作/租户均满足时使用原Mock `super_admin` 财务能力。普通公共管理、模块开通及汇总导出不自动获得此权。
- 既有 `DEMO-FINANCE` 继续只允许service.export，不扩大其他身份或租户授权；无真实凭据、生产接口或资金交易。
- 审批后才实施本方适配并做成功、越权、失败和未知结果分支；审批前不写financialGrants、不显示可提交财务按钮。本提案不关闭API-2002/API-2015、12延期/14工程缺证或G3。

需要用户决定的原因：前序明确保留独立财务授权，而当前只有汇总导出身份；原源码的super_admin守卫与现有接口定义尚未明确本方演示账号对应。不能仅凭“超管”称谓推断可充值或手调。


## 2026-10-27T09:30:03+08:00 · 本轮遗留接续与批准后的本地财务验收

### 用户本轮授权与批准（不追补生产批准）
用户请求：“继续完成现有遗留项，不新建原型，不绕过审批”。本轮继续现有有限Mock，同一目录及执行者。
针对PAGE-2112，实际提问为：“为补齐原服务／充值页面，是否批准这项仅本地Mock的映射：现有‘平台超级管理员’仅对‘东风日产总部’演示租户，可查看服务明细、模拟原试用／年包／话费包、手工调整及流水；‘服务财务’仍只做汇总导出，不涉及真实资金或接口？前面已确认财务权限独立，目前缺的正是这个账号与操作范围对应，不能直接从‘超管’称谓推定。”
用户实际答复：**“批准该本地演示映射”**（request_user_input_async call_3181eb9347bd48998fabd3a3f7161ac7）。答复到达后才写入财务grant和接入页面，未以等待或此前“继续”冒充这项批准。

### 已完成 A03 成功资源关联分支（实际UI）
- 沿原“呼叫服务账号→新增账号”登记一个明确虚构的本地测试资源：名称“本地Mock-门店资源-20261027”，enterpriseId文本 `90000027`，客户/品牌标签“本地界面回归样例”。备注明确“不对应真实供应商账号；仅用于界面回归门店的关联与开通；未配置真实凭据，不进行真实呼叫”。接入凭据保持未配置，未新增号码、坐席或任何业务执行任务。
- 保存后显示启用/未绑定；再仅关联既有 `TEN-1793060448450-gy85`（界面回归门店-20261027），单次保存关联并单次开通云呼叫。刷新后AI和Cloud均已开通，门店编码仍 `00020261027`；资源反向目录唯一显示绑定该演示门店。
- 原7522240、7522241、DEMO-ENT-003绑定及CCC-TEST停用状态不动。本轮没有增加第二个租户，没有挪用资源，也不以这个虚构ID证明生产映射正确。
- 中途原54823预览服务停止，浏览器明确ERR_CONNECTION_REFUSED。仅恢复原目录在 `127.0.0.1:54823` 的本地验收HTTP服务（exec session1191），原地址刷新后回读保存结果；没有Python GET探测、进程扫描、上传重试、改安全设置、.command或新原型目录。直接index的交付要求不变。

### 新发现并修复 E02：AI初次进入重复初始化
- 实际观察：首次进入标签页后，供应商树点击展开会立即折回。原因是原AI默认首页初始化、适配层首次导航、父壳ready后的导航重叠，旧setTimeout回调对同一最终DOM重复绑定事件。
- 仅改生成期副本和本方AI适配：父壳负责首次导航，原init回调核对当前导航代次，过时回调不执行。原AI参考源码未改。
- 新定向检查 `/tmp/d-v200-ai-nav-init-check.cjs` 验证重复排队只初始化一次、旧页面回调不串入新页面。实际重新加载后可逐级展开“供应商标签集→一知科技→门店租户→新线索”。TAG-YZZH-009等仍为未映射；推荐项显示待选择，未自动落首项。未修改或新保存任何标签映射。

### PAGE-2112：批准范围内已接通并验证
- 仅ACC-SUPER-001/platform获得总部TEN-NISSAN-HQ→原AI 2054080803329462274的本地view/trial/annual/credit/adjust/history。入口在该租户行“AI服务”，其他租户行没有入口。DEMO-FINANCE保持仅service.export；没有通配符、其他租户或其他身份扩权。
- 复用原showBillingDrawer、RechargeService及原套餐/时间/分钟/原因/版本规则；不使用原租户管理列表扩大CRUD。普通租户创建/编辑等源导出方法在此入口拒绝。原账号名super-product来自原已知示例映射，操作账号ID仍为ACC-SUPER-001；第一笔已保存的测试调整原操作者值保留，未重写历史。
- 增加同一命名空间的 `ai-service-ledger` 保存原profile、充值/调整流水及同次操作结果；写入失败回退内存，回读不定返回unknown，核对沿同次标识，不重复入账。外部窗口版本变化先读取原版本并走原冲突；损坏账务保留原文且禁止写入/导出。只读汇总与有权业务范围读取同一保存值。
- 同步补齐账务引用删除校验；损坏/不完整账务引用保守阻止，未引用的其他空账号不因此一律禁止删除。测试全部为隔离内存，无实际删除。
- 实际UI：现有有效年包不可重复开通；商用总部不显示试用选项。一次手工调增1分钟先“演示失败”，明确账户未变，再按同次标识重试成功，流水 `ADJ20260907-1793063887780-4`，业务标识 `adjustment-1793063821611-2`。
- 实际UI：按原默认话费包1包/3500分钟/模拟1000元，原因明确本地补验；仅提交一次“演示结果待核对”，业务标识 `recharge-1793064006210-1`。待核时提交按钮禁用、跨区域离开被阻止；点击“核对本次流水”后确认唯一流水 `RC20260907-1793064032817-3`。这是原本地模拟模型，没有真实资金动作。
- 总部演示可用分钟由28500→28501→32001，冻结1200、累计消耗6840及服务起止不变。关闭并重新登录超管后读回相同分钟与两类流水；切服务财务身份只显示有权总部一行32001及汇总导出，没有充值/调整按钮，未再次导出CSV。
- 修复 E03：原财务提交仅刷新抽屉，新的宿主汇总行未更新；现已在成功/核对成功后更新已确认值，未知时不提前报成功。实际核对后列表和抽屉同为32001。
- 新定向模型 `/tmp/d-v200-ai-service-check.cjs` 覆盖准确总部授权、越权/未批准CRUD/仅导出身份拒绝、调账/话费包幂等、失败回退、版本冲突、未知及回读失败核对、重载持久化、损坏阻断；试用/年包仅在隔离的原未开通场景验证成功及重复开通拒绝，没有更改真实浏览器总部商业标记或服务状态。`/tmp/d-v200-finance-reference-check.cjs`覆盖账务引用与异常拒绝。本轮没有重跑此前18组。

### 证据及仍未完成的范围
新增截图：/tmp/d-v200-local-resource-created-20261027.png；/tmp/d-v200-resource-binding-readback-20261027.png；/tmp/d-v200-resource-bound-directory-20261027.png；/tmp/d-v200-cloud-module-enabled-20261027.png；/tmp/d-v200-ai-supplier-unmapped-20261027.png；/tmp/d-v200-service-adjustment-failed-20261027.png；/tmp/d-v200-finance-unknown-guard-20261027.png；/tmp/d-v200-finance-reconciled-20261027.png；/tmp/d-v200-finance-export-only-readback-20261027.png；/tmp/d-v200-finance-final-readback-20261027.png。

当前A03本地成功分支及C01本地演示权限接入已收口；C01生产身份/真实财务鉴权仍缺证，不能以用户批准Mock替代。旧八列财务CSV保留为当时28500分钟的历史导出快照，未覆盖成当前值；六列任务CSV不变。
剩余：A07旧租户目录实际UI缺旧目录样本，原模型/生成控制器证据保留；file直开和CSV选择上传仍遵循此前拒绝，不换通道重试；原12延期/14工程缺证和G3 pending保持。没有把所有原专业动作未逐项实际点击当作已通过，也不宣称全量验收完成。本轮只改当前prototype内必要代码/生成包及现有记录；90分析输入、190参考资源SHA核对不变。

<!-- bounded-ui-acceptance-20261027 -->
## 2026-10-27 · 有界113动作UI剩余验收清单

本轮初始对账：113项中38项已有本轮有效核心UI后态，复用不重办；75项尚有UI缺口。其中65项有可立即执行的本地子动作，10项先受文件拒绝/动作时删除确认/符合授权的服务状态样例限制。复合ACTION的非删除子动作可先执行，未获批准的不可恢复删除不随之放行。这个计数按ACTION去重，不把一个入口的部分点击当作全部子操作通过。每行列准确缺口与既有实现证据。受理/待核UI可记录实际后态，但不升级为远端成功。

已复用UI核心动作：ACTION-2001, ACTION-2003, ACTION-2004, ACTION-2005, ACTION-2006, ACTION-2007, ACTION-2086, ACTION-2087, ACTION-2050, ACTION-2022, ACTION-2111, ACTION-2054, ACTION-2055, ACTION-2112, ACTION-2023, ACTION-2024, ACTION-2025, ACTION-2038, ACTION-2039, ACTION-2044, ACTION-2056, ACTION-2066, ACTION-2103, ACTION-2068, ACTION-2008, ACTION-2012, ACTION-2013, ACTION-2015, ACTION-2018, ACTION-2040, ACTION-2046, ACTION-2047, ACTION-2106, ACTION-2107, ACTION-2108, ACTION-2110, ACTION-2116, ACTION-2117。依据本文件前述2026-10-26/27新轮UI记录、mainline-ui-evidence.json及verification-log；不引用旧版本通过证据。

| 动作ID / 名称 | 初始分组 / 当前状态 | 原实现证据 | 缺的准确UI / 最小条件 | 新UI证据 |
|---|---|---|---|---|
| ACTION-2002 重新验证/返回登录 | local / UI完成本动作核心 | memory/open-items.md:314 原处理函数/对象守卫；非UI不算UI通过 |  | 合成旧目录身份首次多租户选择→返回登录，确实回到登录页；重新登录进入租户A。 |
| ACTION-2049 原本人电话准备/上线 | local / UI完成本动作核心 | memory/open-items.md:322 原处理函数/对象守卫；非UI不算UI通过 |  | 专用模拟账号ACC-1793078689099-xkhz/坐席901040/CCI-1793078776127-2：原登录表单明确选择工作模式，置忙上线后本人置闲成功；工具条工作模式/可呼叫状态回读。原独立供应商Mock receipt仅此账号+身份+当前分机匹配生效，不推定真实队列；原登录守卫保持。；/tmp/d-v200-bounded-phone-online.png；/tmp/d-v200-telephone-fixture-check.cjs |
| ACTION-2051 原呼入/预外呼接听 | local / UI已验呼入与预外呼接听核心后态 | memory/open-items.md:324 原处理函数/对象守卫；非UI不算UI通过 |  | 原ScenarioDemo来电控件仅专用账号可见：模拟呼入13900009901→接听→通话中→结束→话后保存；真实记录DEMO-RECEIVING-8b184017-732e-4c1a-9afc-eb685d2d2169回读已结束/人工接听/跟进已保存，坐席901040。；/tmp/d-v200-bounded-inbound-followup-saved.png；精确审批call_f827b492f1834186ad4a9b79b6d80eb5后，SYN-CLOUD-ADMIN/HQ私有TASK-PRED-D66028-f6c062a9的13800000101原分配→接听→结束→保存待继续；DEMO-RECEIVING-1121bc8b-1e01-4fac-a647-0017ea433d98回读跟进已保存、双方15秒，原晚到客户23秒补证。；/tmp/d-v200-predictive-first-followup.png；/tmp/d-v200-predictive-late-cdr-task-fixed.png |
| ACTION-2052 保存本次跟进及拒联结果 | local / UI已验本次保存与后续客户承接 | memory/open-items.md:325 原处理函数/对象守卫；非UI不算UI通过 |  | 本次新模拟呼入DEMO-RECEIVING-8b184017-732e-4c1a-9afc-eb685d2d2169保存已完成与合成备注；查看本次记录回读，通话资料异步独立更新；原人工拒联保存证据不重复执行。；/tmp/d-v200-bounded-inbound-followup-saved.png；同一101首轮待继续保存后，本人待办新增该客户/合成接听批次1027/跟进1次；沿原联系客户入口再次模拟通话MCMVQJB5AIEEA1（双方19秒）保存已完成，待办移出；两通原详情分别保留首轮待继续与后续完成的备注，不把重新展开同一表单当承接。；/tmp/d-v200-predictive-continue-completed.png |
| ACTION-2088 监管将有权目标坐席置忙 | local / UI完成本动作核心 | memory/open-items.md:326 原处理函数/对象守卫；非UI不算UI通过 |  | 专用班长账号ACC-1793078689099-xkhz/901040在独立模拟队列6999内，对新建合成监管目标1027/901041/CCI-1793079300137-3执行置忙：空闲→置忙；每次确认后刷新回读。没有操作其他既有坐席/任务。；/tmp/d-v200-bounded-supervisor-target-offline.png |
| ACTION-2089 监管将有权目标坐席置闲 | local / UI完成本动作核心 | memory/open-items.md:327 原处理函数/对象守卫；非UI不算UI通过 |  | 专用班长账号ACC-1793078689099-xkhz/901040在独立模拟队列6999内，对新建合成监管目标1027/901041/CCI-1793079300137-3执行置闲：置忙→空闲；每次确认后刷新回读。没有操作其他既有坐席/任务。；/tmp/d-v200-bounded-supervisor-target-offline.png |
| ACTION-2090 监管将有权目标坐席离线 | local / UI完成本动作核心 | memory/open-items.md:328 原处理函数/对象守卫；非UI不算UI通过 |  | 专用班长账号ACC-1793078689099-xkhz/901040在独立模拟队列6999内，对新建合成监管目标1027/901041/CCI-1793079300137-3执行下线：空闲→离线；每次确认后刷新回读。没有操作其他既有坐席/任务。；/tmp/d-v200-bounded-supervisor-target-offline.png |
| ACTION-2019 新增业务分类 | local / UI完成本动作核心 | memory/open-items.md:329 原处理函数/对象守卫；非UI不算UI通过 |  | 新建合成业务验收-1027后改名为合成业务验收-1027B；复用已有意向等级字段并设置必填，原分类/字段未编辑。；/tmp/d-v200-bounded-new-category.png |
| ACTION-2020 修改业务分类与字段 | local / UI完成本动作核心 | memory/open-items.md:330 原处理函数/对象守卫；非UI不算UI通过 |  | 新建合成业务验收-1027后改名为合成业务验收-1027B；复用已有意向等级字段并设置必填，原分类/字段未编辑。；/tmp/d-v200-bounded-new-category.png |
| ACTION-2021 停用本租户分类 | local / UI完成合成旧目录分支 | memory/open-items.md:331 原处理函数/对象守卫；非UI不算UI通过 |  | 专用合成身份/租户A、B；cloud:synthetic-legacy独立命名空间；A停用后刷新仍停用，B保持启用；切回A恢复启用。；/tmp/d-v200-bounded-legacy-disabled.png；不证明真实迁移，不改现有组织数据或目录 |
| ACTION-2121 分配所选业务记录 | local / UI完成两条同次分配 | memory/open-items.md:336 原处理函数/对象守卫；非UI不算UI通过 |  | 私有总部批次全选CLUE-001、STORE-001共同合法坐席李明9001，原同次分配回执成功；两行均已分配且尚未主动启动。；/tmp/d-v200-bounded-batch-two-assigned.png |
| ACTION-2113 修改并保存模板新版本 | local / UI完成本动作核心 | memory/open-items.md:338 原处理函数/对象守卫；非UI不算UI通过 |  | 独立模板TPL-02d6c956-65b1-420a-a599-42d01ae33439原V1只读详情；改名保存V2，路由选择列表仍保留V1旧名称和V2新名称。；/tmp/d-v200-bounded-template-v2.png |
| ACTION-2114 查看模板详情 | local / UI完成本动作核心 | memory/open-items.md:339 原处理函数/对象守卫；非UI不算UI通过 |  | 独立模板TPL-02d6c956-65b1-420a-a599-42d01ae33439原V1只读详情；改名保存V2，路由选择列表仍保留V1旧名称和V2新名称。；/tmp/d-v200-bounded-template-v2.png |
| ACTION-2115 删除未被引用模板 | approval / 本地核心UI后态已补齐：本批批准最终删除及重新进入回读通过 | memory/open-items.md:340 原处理函数/对象守卫；非UI不算UI通过 |  | 本次call_d4e58ea9c56d4ad1accf4931bef69cf8精确批准；TPL-02d6c956-65b1-420a-a599-42d01ae33439：平台超管/Nissan/cloud正常namespace；精确模板ID、名称、最新V2/2节点一致，原引用/版本/当前资格检查允许确认且最终通过；提交一次，精确模板行0/弹窗0，正常主线TPL-e580...仍V1/4节点。；重新进入原上下文后仍不在列表，原保护样例保留。 |
| ACTION-2026 查看原供应商同步结果 | local / UI完成本动作核心 | memory/open-items.md:344 原处理函数/对象守卫；非UI不算UI通过 |  | 同步设置及电声详情实际打开，显示待核对、0条、最近同步时间-、供应商处理结果尚未核定。；/tmp/d-v200-bounded-special-sync-disabled.png |
| ACTION-2092 新增AI专项名单分组 | local / UI完成本动作核心 | memory/open-items.md:345 原处理函数/对象守卫；非UI不算UI通过 |  | 新增合成专项验收1027（7天）及合成移入验收1027（30天），两组均独立合成租户。；/tmp/d-v200-bounded-special-sync-disabled.png |
| ACTION-2093 修改AI专项名单分组 | local / UI完成本动作核心 | memory/open-items.md:346 原处理函数/对象守卫；非UI不算UI通过 |  | 原编辑分组改名合成专项验收1027B并回读，原记录无覆盖。；/tmp/d-v200-bounded-special-sync-disabled.png |
| ACTION-2094 删除空AI专项名单分组 | approval / UI完成本动作核心 | memory/open-items.md:347 原处理函数/对象守卫；非UI不算UI通过 |  | 用户call_05550a75440e4daeb21861ccdf82ce51明确批准两项删除后，仅删除空分组合成专项验收1027B。剩余合成移入验收1027，1组0号。；/tmp/d-v200-bounded-special-approved-deletions.png |
| ACTION-2095 新增AI专项限制号码 | local / UI完成本动作核心 | memory/open-items.md:348 原处理函数/对象守卫；非UI不算UI通过 |  | 新增合成号码13800009991为普通专项来源；本地生效，不升级公共拒联。；/tmp/d-v200-bounded-special-sync-disabled.png |
| ACTION-2096 批量导入AI专项限制号码 | file / 原生文本批次UI验证通过：新增2/重复1/错误1，重登同组2条，仅本地 | memory/open-items.md:349 原处理函数/对象守卫；非UI不算UI通过 |  | 依据既有具体文件拒绝登记与当前原UI/调用链正面区分：原fileChooser目标为AI手动CSV；本动作原生TEXTAREA，不读文件。SYN-AI-ADMIN/SYN-AI-TENANT，contact-policy的tenant:SYN-AI-TENANT/group_1793073856206，既有独立合成移入验收1027空组/无同步。；原UI输入13800009993两次、not-a-phone、13800009994，仅提交一次；实际提示新增2/重复1/格式错误1。退出重新登录同身份，同group ID仍只有两条普通添加/30天/仅本地；公共全部状态列表空。无删除、上传、真实同步、公共拒联新增。；/tmp/d-v200-2096-original-text-ui-receipt.json；/tmp/d-v200-2096-text-import-result-20261027.png；/tmp/d-v200-2096-text-import-relogin-20261027.png |
| ACTION-2097 移动AI专项名单分组 | local / UI完成本动作核心 | memory/open-items.md:350 原处理函数/对象守卫；非UI不算UI通过 |  | 由合成专项验收1027B移至合成移入验收1027，目标1条/原组0条，目标原期限30天。；/tmp/d-v200-bounded-special-sync-disabled.png |
| ACTION-2098 移除AI专项限制记录 | approval / UI完成本动作核心 | memory/open-items.md:351 原处理函数/对象守卫；非UI不算UI通过 |  | 同一明确批准后，移除合成移入验收1027中13800009991单条本地专项来源；结果0条，不操作其他来源。；/tmp/d-v200-bounded-special-approved-deletions.png |
| ACTION-2099 启用AI专项分组同步 | local / UI完成本动作核心 | memory/open-items.md:352 原处理函数/对象守卫；非UI不算UI通过 |  | 仅合成移入验收1027添加电声本地绑定，结果待核对、已同步0条、无远端ID。；/tmp/d-v200-bounded-special-sync-disabled.png |
| ACTION-2100 停用AI专项分组同步 | local / UI完成本动作核心 | memory/open-items.md:353 原处理函数/对象守卫；非UI不算UI通过 |  | 按原确认窗口停用本组同步，号码保留本地限制，提示远端既有名单未删除。；/tmp/d-v200-bounded-special-sync-disabled.png |
| ACTION-2101 重试AI专项名单同步 | local / UI完成本动作核心 | memory/open-items.md:354 原处理函数/对象守卫；非UI不算UI通过 |  | 所选单条号码重试一次，本地登记已保存，结果仍待核对，未伪报供应商成功。；/tmp/d-v200-bounded-special-sync-disabled.png |
| ACTION-2053 查询客户档案及原详情 | local / UI完成本动作核心 | memory/open-items.md:355 原处理函数/对象守卫；非UI不算UI通过 |  | 合成云呼叫验收私有空间，客户联系按13900000007查询只回1位客户；原档案展示2次联系、同一导入批次及单据LEAD-HQ-20260921-0007，未合并业务记录。；/tmp/d-v200-bounded-customer-profile.png |
| ACTION-2028 查询原AI使用情况 | local / UI完成本动作核心 | memory/open-items.md:356 原处理函数/对象守卫；非UI不算UI通过 |  | 上海日用量176分钟→2026-09-03任务明细2项112+64=176，原UI已显示。；本轮DOM结果 |
| ACTION-2029 查询原任务列表/详情 | local / UI完成本动作核心 | memory/open-items.md:357 原处理函数/对象守卫；非UI不算UI通过 |  | 合成AI验收租户任务13：列表查询/详情/呼叫名单实际展示；意向等级1改A+C后取消恢复A；再次修改切页出现保存/放弃/取消；显式保存，退出重登回读A+C。；/tmp/d-v200-bounded-intent-persisted.png；/tmp/d-v200-intent-save-check.cjs 定向模型验证保存/取消/冲突/权限/未知回读 |
| ACTION-2030 原任务呼叫名单手动导入 | local / UI完成本动作核心 | memory/open-items.md:358 原处理函数/对象守卫；非UI不算UI通过 |  | 原下载模板按钮仅触发一次，原Chrome保存窗口保存至/private/tmp/导入模板_2026-10-27.csv；91字节、BOM、手机号/姓名/备注及两条示例；sha256 d46c0081a7ccf5e8278b9062448c58fe19adf21aa4514c10d2e60f6cbe92f287；2026-10-28 用户实际导入：SYN-AI-ADMIN/SYN-AI-TENANT，华北店-新线索-中科金，原showDetail(13)。文件导入模板_2026-10-28.csv，HP-BATCH-20261028-1005，10:30:47，总/有效/成功2/2/2、失败0、已完成；原已分配138****8000/139****9000两行排队中，关闭重入仍在。非交付CSV881/882，完整号码及文件字节未证；不冒称供应商执行。/tmp/d-v200-ai-north-import-history-20261028.txt，/tmp/d-v200-ai-north-reentry-20261028.txt |
| ACTION-2031 查询原导入记录 | local / UI完成本动作核心 | memory/open-items.md:359 原处理函数/对象守卫；非UI不算UI通过 |  | 合成AI租户任务13历史为空，任务14仅显示保客回访名单.xlsx/300/298成功/2失败/ZKJ-BATCH-20260720-001；未触发失败名单导出。；/tmp/d-v200-bounded-import-history.png |
| ACTION-2032 原已分配名单单条移除 | approval / UI完成本动作核心 | memory/open-items.md:360 原处理函数/对象守卫；非UI不算UI通过 |  | 只读候选：华北店-新线索-中科金，本地任务13，138****8000/139****9000，2026-10-28 10:30:47，各显示1行；同次导入历史HP-BATCH-20261028-1005。未点击移除。；用户call_4fba20cd26bc4fbcba59be69ccc04cd7[0]批准的AIROW-SYN-AI-TENANT-13-0单次移除实际成功；连接恢复只读确认剩139****9000，原HP-BATCH-20261028-1005成功2历史保留。新财务版刷新后仍1行。/tmp/d-ai-remove-{after,history,persisted}-20261028.txt；缺陷隔离9测试通过。未再提交移除。 |
| ACTION-2042 原业务场景查询与已有配置操作 | local / 本地核心UI后态已补齐：本批批准最终删除及重新进入回读通过 | memory/open-items.md:363 原处理函数/对象守卫；非UI不算UI通过 |  | 合成AI租户新增场景15，随后改名1027B；修复原查询未筛选及模型/导入方式回填缺失；查询后仅一行，再编辑手动导入/小模型已勾选。；/tmp/d-v200-bounded-scene-restored.png；/tmp/d-v200-scene-form-check.cjs；本次call_d4e58ea9c56d4ad1accf4931bef69cf8精确批准；15：SYN-AI-ADMIN/合成AI租户；row15/SYN-TASK-1027/SYN-SCENE-1027及原showDeleteConfirm(15)复核一致，无进行中阻挡；确认一次后删除成功且同查询精确场景行0。；重新进入原上下文后仍不在列表，原保护样例保留。 |
| ACTION-2043 维护原标签及供应商配置 | local / 当前统一分类等效入口正向删除已验；原标签21子操作已有证据，旧sc_*未操作 | memory/open-items.md:364 原处理函数/对象守卫；非UI不算UI通过 |  | 同一合成AI租户：本地标签新增/查询/行内改名；场景分类SCN-NEW-001新增/编辑/停用/恢复/列表；供应商SUP-NEW-001新增/编辑/停用/恢复/列表；供应商标签TAG-NEW001-001新增/查询/编辑/启停；明确选择LOCAL-STORE-DB-006映射，重登仍启用且映射正确。；场景分类表刷新曾移除新增关联区，生成副本现保留原活节点；编辑取消后UI区仍在。；/tmp/d-v200-bounded-supplier-mapping.png；/tmp/d-v200-bounded-tag-association-retained.png；本次call_d4e58ea9c56d4ad1accf4931bef69cf8精确批准；local_store_db_1793100249414：SYN-AI-ADMIN/SYN-AI-TENANT/门店督办；LOCAL-STORE-DB-007真实data-local-tag-id一致；原确认普通删除文案、无供应商映射使用警告，提交一次；007行0、保护006行1，本地标签已删除。；重新进入原上下文后仍不在列表，原保护样例保留。；本次call_d4e58ea9c56d4ad1accf4931bef69cf8精确批准；sp_1793073444046_1793100427185：SYN-AI-ADMIN/SYN-AI-TENANT/合成供应商sp_1793073444046/门店督办；TAG-NEW001-002 data-tag-id准确、checkbox=false、映射空；原确认无启用引用警告，提交一次后002行0；001仍checked=true并选中LOCAL-STORE-DB-006。；重新进入原上下文后仍不在列表，原保护样例保留。；本批仅独立无映射LOCAL-STORE-DB-007和未启用/未映射TAG-NEW001-002删除，原006/001保护；原分类编码split缺陷已修，当前主代码79+9反例通过，主UI无引用预检取消/已引用DB场景14处阻挡。；20261028真实批准call_5911a6913d40453abc1a453a7c8903c8[0]：biz-mvrdbn8f-mdhpu86 / SYN-AI-ADMIN / SYN-AI-TENANT / BRAND-NISSAN / cloud:synthetic-ai:；原引用预检进入确认，最终一次提交，目标行0；退出重登同身份仍0、七默认类保留、error[]。属于已批准统一目录的当前等效操作证据，不冒称旧sc_*迁移/清理或隐藏原AI删除已执行。 |
| ACTION-2057 原任务新建/编辑 | local / UI完成本动作核心 | memory/open-items.md:367 原处理函数/对象守卫；非UI不算UI通过 |  | 合成云呼叫验收，独立cloud:synthetic-call:保存；原四步向导创建空名单任务TASK-PRED-D58356-27f8ba87，李明9001、销售外显、最小1坐席、手动开始；原编辑改名1027B并回读。未导入或启动。；/tmp/d-v200-bounded-predictive-created.png |
| ACTION-2058 原任务客户导入 | file / 原任务实际两条本地保存/逐条合成受理及安全刷新回读已验；输入来源/CSV分支仍另列未核 | memory/open-items.md:368 原处理函数/对象守卫；非UI不算UI通过 |  | 20261028原54823/SYN-CLOUD-ADMIN/HQ/TASK-PRED-D58356-27f8ba87：DEMO-RECORD-15/16，18800001901/902，DEMO-MANUAL-L001/L002，priority6/4，名称测试；各batch15/16、file15/16及submit17/18准确关联，合成API002各1/1/0，保存2/受理2/待核0/失败0/通话0。一次无未决场景下刷新，行/handler和详情全文均一致。/tmp/d-v200-predictive-actual-import-verified-20261028.json。只是核心后态，未证预备CSV或文件选择路径，不是生产供应商受理。；20261028 09:09:35用户报告手工CSV后，原HTTP精确D58356新增record19/20、batch19/20、file19/20、13800000883/884、SYN-PRED-1028-A/B、priority1/2、note及R均与交付258字节CSV逐列一致；原record15/16保留，总保存4/模拟受理4/待核0/失败0/通话0。只读明细，无再次选择/上传/提交/刷新；本次新批持久化未重载核，旧批刷新不代用。/tmp/d-v200-predictive-csv-import-readback-20261028.json。 |
| ACTION-2059 按原状态办理执行/控制 | local / UI已验启动/接听执行/暂停继续/终止/人工与自动补提交；正常重呼执行未验 | memory/open-items.md:369 原处理函数/对象守卫；非UI不算UI通过 | 正常718无人接听重呼执行：原alicti-retry.js仅配置映射，调度/次数由供应商负责；当前dccManaged任务被原本地执行器排除。保留执行缺口，不新增供应商模拟器，不以坐席漏接或人工再次联系代替。 | 初次暂停被自动审批拒绝并停止；用户call_90981688accb488281060981a14c028a明确批准后，在SYN-CLOUD-ADMIN/cloud:synthetic-call:对总部·试驾邀约·执行中暂停成功；恢复受原配置守卫拦截；结束成功，保留2条原话单及调度记录。；/tmp/d-v200-bounded-predictive-ended.png；获批独立TASK-PRED-D66028-f6c062a9启动18:18:40，原人数条件触发自动暂停，人数恢复后继续；随后手动暂停/继续，18:37:50最终终止。2条原名单保留，未再导入/启动。；102沿原失败工具精确选定：no clid人工补提交受理1次；之后运营商限呼按原2分钟自动补提交，第2次受理，共享额度2/剩0。未选择被挡；未新增客户或真实请求。；/tmp/d-v200-failure-resubmit-first.png；/tmp/d-v200-failure-resubmit-auto.png；/tmp/d-v200-predictive-task-final-ended.png |
| ACTION-2060 原任务结果查询与失败下载 | local / UI完成本动作核心 | memory/open-items.md:370 原处理函数/对象守卫；非UI不算UI通过 |  | 独立合成任务筛选1条，只导出一次；文件在锁屏前此次保存已落盘，解锁后核对同文件。；/private/tmp/预外呼任务_2026-10-27.csv SHA256 26117ffaa083c72ff2b4ab37f4c6fa7881f6c26e235d3d4614b40c127bf3df44；独立TASK-PRED-D77747-d34642ef 合成导入异常验收1028，手工启动/通话0。原UI prepare4合成记录→原2/3分片B→DEMO-EXPORT-33快照1→原1/3分片A。首轮CSV实际写入但BOM文本回读误报失败，明细2保留；修成字节校验后同一快照重试保存/关闭/回读成功，仅B清理，A保留。落盘/tmp/DEMO-EXPORT-33-verified.csv，236字节，SHA256 f13e61c4b89d9e6ca2f9f1d66251177848a6663f0f760469170033ffd50274f7；1数据行18800001602、DEMO-BATCH-24、供应商任务800006。本地原逻辑合成53，不是生产供应商回执。/tmp/d-failure-byte-verified-after-20261028.txt |
| ACTION-2061 原IVR任务新建/编辑 | local / UI完成本动作核心 | memory/open-items.md:371 原处理函数/对象守卫；非UI不算UI通过 |  | SYN-CLOUD-ADMIN/cloud:synthetic-call:：原向导创建TASK-IVR-D03930-e29d7e7a（供应商模拟800002），原编辑改名合成IVR验收1027B；详情回读；空名单未启动。；/tmp/d-v200-bounded-ivr-edited.png |
| ACTION-2062 原IVR名单处理 | file / UI完成本动作核心 | memory/open-items.md:372 原处理函数/对象守卫；非UI不算UI通过 |  | 2026-10-28 原有导入后分配链：DEMO-CUSTOMER-BATCH / DEMO-CUSTOMER-ROW-3（流程演示客户3，13800000103）经原单行重新分配守卫，一次确认至DEMO-CUSTOMER-TASK-1 IVR通知（名单分配演示）；客户档案源批次/备注保留、联系历史0；任务侧1条、待启动/手工启动、通话0，正常离开返回仍在。不含新模板IVR路由、CSV直导或执行。/tmp/d-v200-ivr-{customer,task}-after-20261028.txt；截图/tmp/d-v200-ivr-assigned-task-20261028.png |
| ACTION-2063 原IVR执行/控制 | local / 本地核心UI后态已补齐：本批批准最终删除及重新进入回读通过 | memory/open-items.md:373 原处理函数/对象守卫；非UI不算UI通过 |  | 仅SYN-CLOUD-ADMIN/cloud:synthetic-call:复用原opt-in联动样例；DEMO-LINK-IVR由待启动→执行中→已暂停→继续执行→模拟一位接通（1/2）→终止；调度和通话均回读。；通话DEMO-LINK-CALL-af7bb698-bf64-414c-ac72-0a1fecb186ff/13800000203，原本地IVR结果，未真实拨号。；/tmp/d-v200-bounded-ivr-controls-ended.png；本次call_d4e58ea9c56d4ad1accf4931bef69cf8精确批准；TASK-IVR-D03930-e29d7e7a：SYN-CLOUD-ADMIN/HQ私有call；同名0名单0完成0接通/待分配客户且无调度；原canDeleteTask保留删除入口、handler ID准确；最终确认一次后精确任务行0、dialog0，旧流程演示保养IVR历史行仍1。；重新进入原上下文后仍不在列表，原保护样例保留。 |
| ACTION-2064 原IVR查询/详情/已有导出 | local / UI完成本动作核心 | memory/open-items.md:374 原处理函数/对象守卫；非UI不算UI通过 |  | 原列表名称查询1条，详情展示同任务，导出一次当前筛选结果。；/private/tmp/自动外呼任务_2026-10-27.csv SHA256 9cc6ae67ad3bc2c48a06fc66a76554305b297432e55463f7d19ab826d8748917 |
| ACTION-2065 查询与维护原呼入服务规则 | local / 本地核心UI后态已补齐：本批批准最终删除及重新进入回读通过 | memory/open-items.md:375 原处理函数/对象守卫；非UI不算UI通过 |  | 原租户管理员只可查询/详情，原超管权限才显示维护。SYN-CLOUD-SUPER私有资源空间创建规则97005，修改原允许的优先级99→98及备注，启用后恢复停用；名称按原规则只读未更改。；/tmp/d-v200-bounded-inbound-readonly.png；/tmp/d-v200-bounded-inbound-maintained.png；/tmp/d-v200-cloud-fixture-check.cjs仅明确样例+私有资源前缀复用源内置角色，未复制凭据、不修改原isSuper守卫。；本次call_d4e58ea9c56d4ad1accf4931bef69cf8精确批准；97005：SYN-CLOUD-SUPER/7522240/resources；97005已停用/priority98/仅合成13800009990且原handler一致；确认一次后精确规则行0，原总部客户来电优先级1已启用/号码时间配置仍保留，关闭只读管理层。；重新进入原上下文后仍不在列表，原保护样例保留。 |
| ACTION-2067 原已有导出 | local / UI完成本动作核心 | memory/open-items.md:377 原处理函数/对象守卫；非UI不算UI通过 |  | 原话单按13900000007筛选2条，导出一次；落盘2条，记录ID与页面原话单一致。；/private/tmp/通话记录-2026-10-27.csv SHA256 0ed7f9766daf913456b98135c9997d2b8c4d13e68d9b82e281aa9b34b6ec7e9d |
| ACTION-2070 原坐席维护允许的独立操作 | local / 本地核心UI后态已补齐：本批批准最终删除及重新进入回读通过 | memory/open-items.md:378 原处理函数/对象守卫；非UI不算UI通过 |  | 原详情/查询；合成重提坐席901027绑8101后停用→恢复，最终离线启用；另原新增入口创建独立坐席901028；同步原候选9102成功1跳过0失败0；批量创建901030–901031成功2，列表回读2条；均在resources私有空间。；/tmp/d-v200-bounded-seat-batch.png；仅资源私有范围的独立批次合成未知批次1027/901032沿原unknown分支：提交一次→开通回执未取得且创建禁用→查询同次开通结果→确认1/同步1/待核0；没有重复原成功批次。；/tmp/d-v200-bounded-seat-unknown-reconciled.png；本次call_d4e58ea9c56d4ad1accf4931bef69cf8精确批准；CCI-1793076538744-4：SYN-CLOUD-SUPER/resources/HQ，901028仍离线、未配置分机、无技能；handler/最终确认CCI一致且inUse原守卫通过，提交一次后名单14→13、精确姓名行0，原合成重提901027仍启用/绑定8101，toast历史保留。；重新进入原上下文后仍不在列表，原保护样例保留。 |
| ACTION-2071 原技能/映射及分组等级允许的维护操作 | local / UI完成本动作核心 | memory/open-items.md:379 原处理函数/对象守卫；非UI不算UI通过 |  | 合成技能新增/名称查询/详情/改名1027B；向其添加离线合成重提坐席901027，关系查询，等级3经原数字键修改为1并刷新回读；按原确认移出，成员0；未清空已有业务引用来准备删除。；/tmp/d-v200-bounded-skill-maintained.png；原界面继续核验：901040置忙在线→新增总部·售后关怀，显示待生效/待提交→本人按原流程下线→在同关系行提交新增技能→已生效/同步成功；未将在线直接生效算作待提交路径。；/tmp/d-v200-bounded-skill-pending.png；/tmp/d-v200-bounded-skill-submitted.png |
| ACTION-2072 原外呼组允许的维护操作 | local / 本地核心UI后态已补齐：本批批准最终删除及重新进入回读通过 | memory/open-items.md:380 原处理函数/对象守卫；非UI不算UI通过 |  | 创建合成外呼组验收1027/SYN1027，保存成员901027，名称编号查询及详情确认1成员/无任务，编辑改名1027B；原编号只读。；/tmp/d-v200-bounded-outbound-group.png；本次call_d4e58ea9c56d4ad1accf4931bef69cf8精确批准；OBG-1793098976013-1：SYN-CLOUD-SUPER/7522240/resources；OBG真实handler一致、SYNDEL1027名称/0成员未变；原在途任务守卫通过，确认一次后空组行0，原SYN1027仍1人。；重新进入原上下文后仍不在列表，原保护样例保留。 |
| ACTION-2073 原队列允许的维护操作 | local / UI完成本动作核心 | memory/open-items.md:381 原处理函数/对象守卫；非UI不算UI通过 |  | 独立resources空间创建合成队列验收1027/编号9901027关联原可用售前技能；名称编号查询/详情；最长排队600→500秒回读；原关联设置新增售后技能；重新核对显示技能去重2人/队列1人，明确成员有差异，未当供应商成功。；/tmp/d-v200-bounded-queue-difference.png |
| ACTION-2074 查询原配置记录与详情 | local / UI完成本动作核心 | memory/open-items.md:382 原处理函数/对象守卫；非UI不算UI通过 |  | 配置记录查总部新增坐席，原失败原因为工号重复；详情→修改资料以合成重提坐席1027/901027重提，原记录成功且重提次数1，保留最初失败原因。；/tmp/d-v200-bounded-agent-retry.png |
| ACTION-2075 原号码允许的维护/分配操作 | local / UI完成本动作核心 | memory/open-items.md:383 原处理函数/对象守卫；非UI不算UI通过 |  | 资源私有空间从原候选导入02100009204，仅呼出；查询/详情确认0任务0规则引用；停用本地许可后恢复，最终正常，不修改供应商状态或自动启动任务。；/tmp/d-v200-bounded-number-restored.png |
| ACTION-2076 原号码池允许的维护操作 | local / 本地核心UI后态已补齐：本批批准最终删除及重新进入回读通过 | memory/open-items.md:384 原处理函数/对象守卫；非UI不算UI通过 |  | 新建空池→名称查询→详情→改名1027B及备注→列表回读；没有修改默认池和原号码。；/tmp/d-v200-bounded-number-pool.png；本次call_d4e58ea9c56d4ad1accf4931bef69cf8精确批准；8203：SYN-CLOUD-SUPER/enterprise7522240/resources；原pool8203普通池0号码非默认与ID准确；原最终引用守卫通过，确认一次后删除成功、精确池行0，总部默认池仍2号码/是。；重新进入原上下文后仍不在列表，原保护样例保留。 |
| ACTION-2077 原分机允许的维护操作 | local / 本地核心UI后态已补齐：本批批准最终删除及重新进入回读通过 | memory/open-items.md:385 原处理函数/对象守卫；非UI不算UI通过 |  | 独立Mock创建停用分机8901027→查询/详情→区号021改020→详情回读；密码未显示、不涉及真实认证；另从原候选中导入停用分机8304并回读。；/tmp/d-v200-bounded-extension.png；/tmp/d-v200-bounded-extension-import.png；本次call_d4e58ea9c56d4ad1accf4931bef69cf8精确批准；99000：SYN-CLOUD-SUPER/7522240/resources；分机8901027/ID99000仍停用未使用且上下文一致，原绑定/使用/呼入守卫通过后确认一次；列表10→9，精确分机行0，未批准导入分机8304仍1。；重新进入原上下文后仍不在列表，原保护样例保留。 |
| ACTION-2078 原时间条件允许的维护操作 | local / 本地核心UI后态已补齐：本批批准最终删除及重新进入回读通过 | memory/open-items.md:386 原处理函数/对象守卫；非UI不算UI通过 |  | 原创建→名称查询→详情→编辑结束时间11:00至11:30；列表回读10:00–11:30、优先级99；原名称不可修改规则保留。；/tmp/d-v200-bounded-time-condition.png；本次call_d4e58ea9c56d4ad1accf4931bef69cf8精确批准；96000：SYN-CLOUD-SUPER/7522240/resources；96000总部合成时间/priority99/10:00–11:30标识一致，原任务/草稿/呼入引用最终校验通过后提交一次，表6→5精确行0，原工作日营业时间仍1。；重新进入原上下文后仍不在列表，原保护样例保留。 |
| ACTION-2079 原AliCti账号允许的维护操作 | local / UI完成本动作核心 | memory/open-items.md:387 原处理函数/对象守卫；非UI不算UI通过 |  | 原先新增/编辑/列表/绑定证据沿用；在独立resources空间查看CCC-TEST详情，未绑定、未配置凭据；启用回读后恢复停用。；/tmp/d-v200-bounded-provider-disabled.png |
| ACTION-2081 查询及核对原异常 | local / UI完成本动作核心 | memory/open-items.md:388 原处理函数/对象守卫；非UI不算UI通过 |  | 资源私有范围追加单条原格式合成issue SYN-ISSUE-1027及SYN-CALL-ISSUE-1027；按callId查询、按真实issueId详情、核对中→已恢复/结束09:00:30/30秒；不拨号且保留业务结果。；发现统一壳下原hash导致列表陈旧，生成副本改用RouteRuntime当前key；修复后同合成样例复验待处理0且详情已恢复。；/tmp/d-v200-bounded-call-issue-reconciled.png；/tmp/d-v200-call-issue-check.cjs |
| ACTION-2035 查询原通话统计 | local / UI完成本动作核心 | memory/open-items.md:389 原处理函数/对象守卫；非UI不算UI通过 |  | 通话统计选择中科金智能并查询，实际结果只剩4条中科金记录。；本轮DOM结果 |
| ACTION-2036 查询原计费统计 | local / UI完成本动作核心 | memory/open-items.md:390 原处理函数/对象守卫；非UI不算UI通过 |  | 发现并修复跨租户旧示例混显；只接受明确Mock归属1/5。门店无总部数据；总部按7月/厚朴查询3980分钟，原明细2180+1800及嵌套话单可见。日期完整区间过滤/回跳重新查询已验证。；/tmp/d-v200-bounded-billing-scope-detail.png |
| ACTION-2037 查询原线索统计 | local / UI完成本动作核心 | memory/open-items.md:392 原处理函数/对象守卫；非UI不算UI通过 |  | 发现原查询仅toast、分页伪9页；修复本地已加载记录筛选，不重算指标。2023-10-21至25+新线索实际3条，分页只1页。；/tmp/d-v200-bounded-clue-filter.png |
| ACTION-2069 原已有详情与导出 | local / UI完成本动作核心 | memory/open-items.md:394 原处理函数/对象守卫；非UI不算UI通过 |  | 原7类报表各实际打开1次对应下钻：总览预外呼4、线索LEAD-HQ-20260921-0007、客户人工批次1、任务已终止样例2话单、坐席王静3、呼入接通1、试驾技能4；7份报表各导出一次并核对行数/列数。；/tmp/d-v200-bounded-report-skills-drill.png；/private/tmp/通话总览_2026-10-21_2026-10-27.csv：4行/11列，SHA256 ba263bbefed2efbea6a1514915c7677fd5f22b877664a35f580999e4abf4e23e；/private/tmp/线索成效_2026-10-21_2026-10-27.csv：6行/17列，SHA256 e63d7ebb9299ba4a2f759b219d2c2ebfc49a9b3b4d15e1e05abee7c4008afb96；/private/tmp/客户跟进_2026-10-21_2026-10-27.csv：5行/8列，SHA256 eca05661970e1515cc2110cf99c88e2135c7218e2fd674dba4b19a20a628f21b；/private/tmp/外呼任务_2026-10-21_2026-10-27.csv：3行/13列，SHA256 d55a4b366c4f057093e578e822284dd2511849fa29fbec43a8a7ac976890e5d4；/private/tmp/坐席成效_2026-10-21_2026-10-27.csv：8行/9列，SHA256 be3e384b7164c2756962296034fdd4ac90a1e828c32e36d5472b25a197e1a3b0；/private/tmp/呼入服务_2026-10-21_2026-10-27.csv：1行/7列，SHA256 970ac0710ccc6290379d6ac785af16e75839b10cc0baf292168e4801551d2323；/private/tmp/服务技能_2026-10-21_2026-10-27.csv：4行/10列，SHA256 746b928191251e281e6698c630054d3e14ff0cbc9a095f4fe7401aca19d59ef5 |
| ACTION-2009 调整本租户AI/云呼叫模块业务授权 | local / UI完成本动作核心 | memory/open-items.md:396 原处理函数/对象守卫；非UI不算UI通过 |  | ACC-1793066541194-v3xq仅AI由只读改运营，Cloud仍只读，保存回读。；/tmp/d-v200-bounded-member-restored.png |
| ACTION-2010 停用本租户访问 | local / UI完成本动作核心 | memory/open-items.md:397 原处理函数/对象守卫；非UI不算UI通过 |  | 自动审批拒绝后用户明确批准此账号/上海范围/短时测试；租户状态停用而全局启用，立即恢复并回读。；/tmp/d-v200-bounded-member-restored.png |
| ACTION-2011 停用整个登录账号 | local / UI完成本动作核心 | memory/open-items.md:398 原处理函数/对象守卫；非UI不算UI通过 |  | 同一明确批准：全局状态停用而租户状态启用，立即恢复并回读；全局/租户最终均启用。；/tmp/d-v200-bounded-member-restored.png |
| ACTION-2091 为本租户已有账号关联已有坐席 | local / UI完成本动作核心 | memory/open-items.md:399 原处理函数/对象守卫；非UI不算UI通过 |  | 通过原公共账号管理新建合成电话验收1027/phone-acceptance-1027（ACC-1793078689099-xkhz，HQ仅Cloud管理员）；通过原坐席维护创建合成电话坐席1027/901040（CCI-1793078776127-2）并选择未占用8102；原关联已有坐席确认后显示当前账号已关联；重新登录回读本人工具条。只追加新合成对象，旧E2E任务和已有账号绑定未改。；/tmp/d-v200-bounded-account-seat-linked.png |
| ACTION-2102 查询当前有权租户的账号与成员 | local / UI完成本动作核心 | memory/open-items.md:400 原处理函数/对象守卫；非UI不算UI通过 |  | 上海华东门店成员按合成验收查询为空，创建样例后同筛选只返回准确账号。；/tmp/d-v200-bounded-member-restored.png |
| ACTION-2104 删除无业务引用的账号 | approval / 本地核心UI后态已补齐：本批批准最终删除及重新进入回读通过 | memory/open-items.md:401 原处理函数/对象守卫；非UI不算UI通过 |  | 本次call_d4e58ea9c56d4ad1accf4931bef69cf8精确批准；ACC-1793066541194-v3xq：平台超管/上海华东门店；精确data-id与login一致、原完整引用及无其他租户守卫enabled=true/reason空；删除账号最终保存一次后当前SH同名查询0，未再停用恢复，必要管理操作记录由原commit保留。；重新进入原上下文后仍不在列表，原保护样例保留。 |
| ACTION-2014 维护租户品牌关联 | local / UI完成本动作核心 | memory/open-items.md:404 原处理函数/对象守卫；非UI不算UI通过 |  | 独立TEN-1793066453796-gnuf从合成品牌改到东风奕派，再恢复合成品牌；无原租户改动。；/tmp/d-v200-bounded-brand-tenant.png |
| ACTION-2105 删除无业务引用的租户 | approval / 本地核心UI后态已补齐：本批批准最终删除及重新进入回读通过 | memory/open-items.md:406 原处理函数/对象守卫；非UI不算UI通过 |  | 本次call_d4e58ea9c56d4ad1accf4931bef69cf8精确批准；TEN-1793066453796-gnuf：平台超管/organization；GNuf空租户名称ID一致、两模块未开通/云资源待配置、原无成员及完整引用守卫enabled=true/reason空；最终保存一次后精确租户行0，原日产总部仍1；未删品牌/成员或清业务凑空态。；重新进入原上下文后仍不在列表，原保护样例保留。 |
| ACTION-2016 创建品牌 | local / UI完成本动作核心 | memory/open-items.md:407 原处理函数/对象守卫；非UI不算UI通过 |  | 原UI单次创建合成UI验收品牌-1027，列表回读。；/tmp/d-v200-bounded-brand-tenant.png |
| ACTION-2017 修改品牌资料 | local / UI完成本动作核心 | memory/open-items.md:408 原处理函数/对象守卫；非UI不算UI通过 |  | 原UI改名合成UI验收品牌-1027B，回读稳定同一对象。；/tmp/d-v200-bounded-brand-tenant.png |
| ACTION-2080 维护原已有应用接入配置 | local / 本地核心UI后态已补齐：本批批准最终删除及重新进入回读通过 | memory/open-items.md:410 原处理函数/对象守卫；非UI不算UI通过 |  | 原应用新增、详情（密钥保持掩码且明确本地演示）、修改名称、名称查询1条；仅合成AI租户，无真实密钥/接口调用。；/tmp/d-v200-bounded-application.png；本次call_d4e58ea9c56d4ad1accf4931bef69cf8精确批准；DEMO-DCC-APP-d315373a-045e-4683-ad3a-5dec07e8a57c：SYN-CLOUD-SUPER/resources；appId、名称、SYN-AI可访问范围/未配置回调与批准一致，演示key全程遮蔽；原超管/revision最终校验提交一次，应用3→2，精确ID行0，原APP-A/B各1。；重新进入原上下文后仍不在列表，原保护样例保留。 |
| ACTION-2082 查询原审计及详情 | local / UI完成本动作核心 | memory/open-items.md:411 原处理函数/对象守卫；非UI不算UI通过 |  | 原审计按对象901027+技能更新筛选3条，查看AUD-0020前后差异；导出只执行一次。；/private/tmp/操作审计_2026-10-27.csv SHA256 2dbdd66fe3c187db6b2186451a2c5dff93b4129905382ec874f145e31c8d5b99 |
| ACTION-2041 沿原可用标签与回访操作 | local / UI完成本动作核心 | memory/open-items.md:413 原处理函数/对象守卫；非UI不算UI通过 |  | 18782033152的原详细标签及多次回访表真实展开；嵌套通话链接仅原toast占位，未计查询通过，已改如实提示。；/tmp/d-v200-bounded-ai-lead-detail.png |
| ACTION-2045 办理原已有充值操作 | scenario / UI完成本动作核心 | memory/open-items.md:414 原处理函数/对象守卫；非UI不算UI通过 |  | 同用户[1]批准独立B提案。SYN-FIN-ADMIN-1028仅2租户，试用9900000000000001028：0元30天500分钟，RC20260907-1793155829306-3；年包9900000000000001029：5000元365天10000分钟，RC20260907-1793155856213-6。均原UI各1次、有效、已生效；重新登录保留。按原演示时钟2026-09-07 10:20，非真实资金。/tmp/d-fin-{trial-after,annual-after,persisted}-20261028.txt |
| ACTION-2083 维护原云呼叫专业字段配置 | local / 本地核心UI后态已补齐：本批批准最终删除及重新进入回读通过 | memory/open-items.md:417 原处理函数/对象守卫；非UI不算UI通过 |  | 隔离旧目录新建/修改字段，预览；停用/启用保存；分类内上移/隐藏旧字段/设置新字段必填并保存预览；已显示引用字段停用被明确拒绝。；/tmp/d-v200-bounded-legacy-field-preview.png；本次call_d4e58ea9c56d4ad1accf4931bef69cf8精确批准；field-mvqo6asf-36l3533：平台超管/Nissan/cloud；field-mvqo6asf-36l3533名称/单行文本/无上游一致；原usage可删并在最终确认核token/revision/fingerprint后提交一次，字段库14→13，精确字段行0，原线索等级仍1；未清分类/依赖或历史结果。；重新进入原上下文后仍不在列表，原保护样例保留。 |
| ACTION-2085 查询原全部坐席事件 | local / UI完成本动作核心 | memory/open-items.md:418 原处理函数/对象守卫；非UI不算UI通过 |  | 先验证有权空态，再在专用电话账号下查看全部坐席事件13条/2页；包含本人的上线/置闲，以及新监管目标置忙/置闲/下线的班长操作；第二页原2026-10-26历史保留；不声称生产实时事件采集。；/tmp/d-v200-bounded-seat-events-records.png |
| ACTION-2109 门店上交本品牌总部 | local / UI完成隔离合成分支 | memory/open-items.md:422 原处理函数/对象守卫；非UI不算UI通过 |  | SYN-BUSINESS-ADMIN私有cloud:synthetic-business:中STORE-001由门店上交唯一总部；原门店转出历史只读，切总部读到第2轮且原安排清除；无呼叫。；/tmp/d-v200-bounded-store-return-history.png；/tmp/d-v200-bounded-store-return-received.png |

<!-- /bounded-ui-acceptance-20261027 -->

## 2026-10-27 15:36 菜单任务独占写入前交接（已暂停）

- 已停止本轮代码、Mock、构建及浏览器操作；最后仅将原Chrome标签标记保留，并只读核对清单。等待协调端明确交回写入权后才能恢复。未实施菜单变更、未新建任务/原型/工作树/备份。
- 现场：Chrome标签980687976，`http://127.0.0.1:54823/2.0.0/prototype/index.html#PAGE-2205`。身份SYN-CLOUD-ADMIN「合成云呼叫验收」，东风日产总部，Cloud存储范围`d-contact-cloud-v200-rebuild-20261026:cloud:synthetic-call:`。
- 当前仅打开新任务「合成接听与跟进1027」的“启动任务”确认窗；内部taskId=`TASK-PRED-D66028-f6c062a9`。最后一个UI动作是打开确认窗，**未点击确认提交、未发起启动写入**。没有未决工具调用或写入；原HTTP服务保持运行。无未保存业务表单、通话、话后记录或下载保存窗口。
- 电话现场：合成流程坐席8801／DEMO-CUSTOMER-IDENTITY，8101分机，当前模拟电话在线置闲、预览与预测同时；没有来电或通话。为保留现场，没有额外下线、保存、丢弃、刷新或导出。切换到外部区域/租户时仍须遵守原电话保护。
- 新任务已由原四步向导正式保存，两条已有合成名单已受理：`DEMO-CUSTOMER-ROW-1`／13800000101／`SYN-PRED-1027-01`和ROW-2／13800000102／`SYN-PRED-1027-02`；批次名「合成接听批次1027」，明确线索类、优先级1/2、接听坐席8801、销售外显导航、最小1席；普通重呼仅718无人接听、首次之外1次、从上次呼叫后1分钟。此为原“选择已有名单”路径，不是文件上传通过。
- 此前独立联动IVR `DEMO-LINK-IVR` 已启动→暂停→继续→模拟一位接通→终止；通话`DEMO-LINK-CALL-af7bb698-bf64-414c-ac72-0a1fecb186ff`保留，不能重跑或正向删除。联动预外呼 `DEMO-LINK-PRED` 因旧示例没有明确接听坐席快照未能分配，已终止、没有通话；未补写其已启动快照。此前获精确批准终止的「总部·试驾邀约·执行中」私有样例也不重试。
- 最后实际证据：新任务详情显示已保存2、已受理2、待确认0，当前启动确认待提交；不是运行成功。前面的IVR控制、在线新增技能下线后提交、未知批次901032同次查询确认、SYN-ISSUE-1027异常恢复及列表刷新、7报表/话单/审计CSV证据均在本清单及`/tmp/d-v200-bounded-*`，不重新导出。
- 113动作表仍为复用UI38＋本轮新增核心UI51＋未闭合24；未闭合不等于24处代码缺陷。基线分组未闭合local16＋approval4＋file3＋scenario1，local16不表示现在均可独立执行。复合动作的剩余子操作继续保留，不按主按钮已过而整包判过。
- 恢复点：先确认菜单任务已交回写入权，并核对同一标签的真实状态；若仍是该确认窗，可继续本轮已授权本地Mock启动验证。随后核验该准确任务的预外呼接听、待继续跟进承接、普通重呼及失败补提交/失败下载。ACTION-2063只剩最终删除，另用无引用草稿，不能删已执行IVR。文件上传4动作、财务试用/年包状态样例及全部其他最终删除仍按原边界待核/待批。
- 删除准备尚未收口：只能准备本轮独立无引用样例，列真实内部ID（localCode另列）、租户/存储范围、引用及不可恢复影响，再一次汇总确认。已引用字段/标签只验证保护，不清引用凑正向。已消耗的账号临时停用恢复和两项AI专项精确删除批准不复用、不扩大。
- 本回合实际手工修改：`scripts/build-modules.py`、`mock/data.js`、`js/adapters/ai-config-store.js`、`js/adapters/ai.js`、`js/adapters/cloud.js`。生成更新：两份bundle、index资源缓存版本、reuse-provenance；构建也重写cloud-ui.css/shared-forms.css（无本回合人工样式调整）。执行记录更新open-items/change-log及官方verifier维护的verification-log/circuit-state/loop-status；未手改workflow/stage-log，仍S7，未推进S8/G3。
- 已有未提交工作需原样保留：organization-store.js、module-host.js等在本回合开始时已有改动；Git当前另显示根.gitignore/README及旧DEMO_PROTYPE、qa、outputs的大量迁移/删除。这些不是本回合操作，未回滚。当前2.0.0目录未由Git提供可靠逐回合差异，不能把整体git status当本回合变更。原型index的版本参数会由构建器生成，菜单任务如修改导航须注意再构建。
- `/tmp`的队列检查点：`d-v200-bounded-ui-plan.json`；生成器`d-v200-ui-queue.py`只更新本文件既有标记段。它是工作检查点，不另建正式交付包。尚未将最新样例推进当作全局验证通过。

暂停时主要文件摘要（供接续避免覆盖）：
- `scripts/build-modules.py`：`5d7efe7e2285bffe1e0d34667bb3681971e2e0aa4790c0685653b9b4f5e6475c`
- `mock/data.js`：`b9188dd1ab7b0df88fe16e5f605c1d7121691dd5957c2029a3ec554b91f617e5`
- `js/adapters/ai-config-store.js`：`a4c0e441df1e49d868ecc589e756a22cc8f55055ed28385e866a780618934091`
- `js/adapters/ai.js`：`c3def63507e863e9609ca84d4a6b3aa67854e5fecc887a8b22cd055b139d8ac4`
- `js/adapters/cloud.js`：`80d56da300c854cfcfeb899ba1f1ac25e876a27e1594c5666f23da88b3f66668`
- `js/modules/ai.bundle.js`：`566221c58e4a714886aa337a2dfdbfad71338bf1497e9397c2ad4bf1f8ca902c`
- `js/modules/cloud.bundle.js`：`1eee6c9e459e903c5ea4e86d0b465c27ff1ce59168248f1191579351b3dc1efe`
- `index.html`：`073fe518a2ab38b6d50dd856d43ccf5d1e84e574f3cbf661583ab162d160d7e0`
- `memory/reuse-provenance.json`：`546a0bb3dc4647e1a0b29a681dc27492d2242f3a43c6acc7b2e4cbe94644bc10`

### 2026-10-27T18:17:13+08:00 拖拽生成链已合并，回到原电话验收

- 本轮拖拽维护收口于既有原型；正式构建两次稳定、菜单与旧Hook保留、主HTTP拖动/保存/历史只读/空草稿/离开保护核验通过，详细证据见change-log同时间记录。
- 用户call_f827b492f1834186ad4a9b79b6d80eb5已明确批准SYN-CLOUD-ADMIN/HQ私有TASK-PRED-D66028-f6c062a9及13800000101/102的本地启动、接听、话后、跟进、重呼/补提交与必要暂停继续终止。此前被拒绝的启动未执行；本人已离线、确认弹窗已取消，将按同一任务继续，不重建/重导入/扩大对象。

### 2026-10-27T18:49:24+08:00 获批任务本轮验收结果

- TASK-PRED-D66028-f6c062a9已终止，本人8801未登录；名单仍2条、通话2条、失败事件2条；102人工/自动补提交各1次、共享额度已用2/剩0。101待继续→本人待办→再次联系完成闭环已验，原两通话备注和跟进独立保留。
- 原预外呼晚到客户23秒未投影的缺陷已修；只补同一已同步本地Mock话单的缺值，人工19秒不转作客户时长，unknown挂断方/秒挂不补造；新显示把已知接通和秒挂待核分开，汇总按已知接通计数。边界失败后同step修复，93项复验通过，补提交72项通过。
- 当前22项ACTION仍有缺口；正常718重呼没有原本地执行器，继续保留，不改变12项延期/14项缺证或G3状态。失败批次下载仍指“导入失败”，本轮执行失败不是替代证据。

### 2026-10-27 引用核验修复与删除准备（未批准最终删除）

- 原合法ready标志被JSON解析的误报已修；已知27类持久业务仓库和3类动态仓库按源码结构检查，126个复用脚本补审发现的3项演示元数据仅按精确键/合法值识别。未知仓库、损坏结构、未核归属继续unknown；不删除任何浏览器标志，不执行原迁移清理。
- 去掉identities/preferences包含式豁免；主组织/导航元数据先验证结构；压缩解码仅原3个owner，严格2元组、JSON字符串token和索引。主实际函数隔离集成708项、结构211项均通过。来源和反例：/tmp/d-v200-cloud-repositories-full-audit-20261027.json、/tmp/d-v200-main-reference-integrated-results.json、/tmp/d-v200-cloud-main-shape-check-results.json。
- 主HTTP最终版空租户TEN-1793066453796-gnuf和既有合成账号ACC-1793066541194-v3xq通过原资格预检；账号只在上海华东门店。总部/上海等已有业务租户仍受保护。两个确认均未提交，不因按钮可用视为获准删除。
- 当前已准备14个具体候选如下，全部最终确认取消，仍无删除批准。现有映射LOCAL-STORE-DB-006/TAG-NEW001-001、已有成员SYN1027与已关联字段均保留；新增仅独立空组、无映射本地标签和未启用供应商标签，未给业务分配资源。

| 序号 | 原动作 | 身份/租户/存储范围 | 对象 | 实际内部标识 | 当前UI预检与影响 |
|---|---|---|---|---|---|
| 1 | ACTION-2063 | SYN-CLOUD-ADMIN / TEN-NISSAN-HQ / cloud:synthetic-call: | 合成IVR验收1027B | TASK-IVR-D03930-e29d7e7a | 待分配客户；0名单、0通话、未启动、无调度操作；原canDeleteTask通过，确认弹窗注明不可恢复、客户保留 |
| 2 | ACTION-2065 | SYN-CLOUD-SUPER / TEN-NISSAN-HQ / cloud:synthetic-resources: | 合成呼入验收1027 | 97005 | 已停用，优先级98；仅匹配合成主叫13800009990，无接入号码/时间条件勾选；原删除确认已打开并取消 |
| 3 | ACTION-2076 | SYN-CLOUD-SUPER / TEN-NISSAN-HQ / cloud:synthetic-resources: | 合成号码池验收1027B | 8203 | 详情总部/0号码/普通池，原删除确认注明已被任务引用或在用默认池不可删；未提交，最终原守卫再次校验 |
| 4 | ACTION-2077 | SYN-CLOUD-SUPER / TEN-NISSAN-HQ / cloud:synthetic-resources: | 分机8901027 | 99000 | 总部/软电话/已停用/尚未使用；原删除弹窗确认该号，已取消 |
| 5 | ACTION-2078 | SYN-CLOUD-SUPER / TEN-NISSAN-HQ / cloud:synthetic-resources: | 合成时间验收1027 | 96000 | 总部/周一至周五10:00–11:30/优先级99；本轮新规则97005未选择它；原删除确认说明后续不可选，已取消，最终再核引用 |
| 6 | ACTION-2070 | SYN-CLOUD-SUPER / TEN-NISSAN-HQ / cloud:synthetic-resources: | 合成独立坐席1027／工号901028 | CCI-1793076538744-4 | 详情总部/离线/未配置分机/暂无技能，原删除handler与确认使用CCI（不冒称AGT id）；确认说明历史保留、配置不可恢复，已取消 |
| 7 | ACTION-2072 | SYN-CLOUD-SUPER / TEN-NISSAN-HQ / cloud:synthetic-resources: | 合成空组删除验收1027／SYNDEL1027 | OBG-1793098976013-1 | 原UI新建独立空组，未勾选/保存成员，列表0人；旧SYN1027仍1人；原删除确认已取消 |
| 8 | ACTION-2080 | SYN-CLOUD-SUPER / SYN-AI-TENANT / cloud:synthetic-resources: | 合成应用验收1027B | DEMO-DCC-APP-d315373a-045e-4683-ad3a-5dec07e8a57c | 详情仅可访问合成AI验收租户、回调未配置、本地演示密钥保持遮蔽；原确认说明删除后此应用不能再获取token，已取消 |
| 9 | ACTION-2115 | ACC-SUPER-001 / platform / cloud: | 合成门店上交验收-1027B／V2 | TPL-02d6c956-65b1-420a-a599-42d01ae33439 | 列表2节点；原删除预检未报引用阻挡，确认列精确ID/品牌/V2，注明不解除分类关联、不改业务记录；已取消，最终原守卫再次核验 |
| 10 | ACTION-2042 | SYN-AI-ADMIN / SYN-AI-TENANT / ai-config:tenant:SYN-AI-TENANT | 合成场景验收1027B | 15 | 原行15/新线索/中科金智能；原showDeleteConfirm(15)明确不可恢复，已取消，未操作原生产场景 |
| 11 | ACTION-2043 / AI场景分类 | SYN-AI-ADMIN / SYN-AI-TENANT / ai-config:tenant:SYN-AI-TENANT | 合成分类1027B | sc_1793073363098 | 树显示0标签；分类管理真实data-scene-id回读；原配置引用检查未阻挡，进入不可恢复确认后取消；未更改配置引用 |
| 12 | ACTION-2043 / 本地标签 | SYN-AI-ADMIN / SYN-AI-TENANT / ai-config:tenant:SYN-AI-TENANT | 合成无映射标签删除验收1027 | local_store_db_1793100249414 | 原督办/门店本地标签新增独立007，未映射供应商；真data-local-tag-id回读，确认已取消；保留已映射006 |
| 13 | ACTION-2043 / 供应商标签 | SYN-AI-ADMIN / SYN-AI-TENANT / ai-config:tenant:SYN-AI-TENANT | 合成未启用标签删除验收1027 | sp_1793073444046_1793100427185 | 原合成供应商/门店/督办中新增独立002，未勾启用且未映射；001仍启用并映射006。真实data-tag-id回读，确认不可恢复后取消 |
| 14 | ACTION-2104 | ACC-SUPER-001 / TEN-NISSAN-SH / organization | 合成验收成员-1027 | ACC-1793066541194-v3xq | 修复精确元数据解码后原删除守卫通过；仅上海华东门店成员，启用/启用，AI运营/Cloud只读，无业务引用；真实data-id核对，确认弹窗已取消。未另建账号，未重做停用恢复 |

- 新的“先基础信息→应用内全屏拖拽→返回保留草稿”交互由隔离任务提供精确补丁，主目录随后合并及重验；此前旧单窗画布测试不证明此新交互通过。当前删除预检已安全取消，按用户反馈优先该UI交付。分类三菜单只讨论，不实施。


### 2026-10-27T20:22:27+08:00 新全屏交互主目录恢复点

- 用户新交互已在既有原型通过定向复验：基础必填→应用内全屏编排→返回保留草稿；明确失败、响应待核同次核对、原版本只读及正常退出跨页清理已验证。空节点配置提示定位缺陷在主目录实际发现、记录fail后局部修复，旧画布结论不替代本次新证据。
- 精确三源合并后主资源追加一条配置区空态CSS；正式重建保持，主Cloud SHA 9cab6884ae7be8bb5eac3d74d6a3ecbb620bc22e6a525825563f81821e92c6fc，flow-editor.patch资源SHA b1cf5b350a5641aade7c6b6fce591110a09a309eac9307d3017c732df294d812。引用修复函数逐字保留，当前708+211再验通过；菜单和晚到CDR逻辑不变。
- 浏览器现为合成业务验收/HQ/流转模板列表，只有私有模板TPL-LEAD-MAIN新增V3/V4测试版本，正常主线不变；4模板、无弹窗、无全屏/inert、无未决保存。仍沿原HTTP标签；file自动验收未执行。
- 下一步回到原遗留清单：删除14候选最终确认均取消，空租户/独立字段等未完成准备仍保留；不扩展三菜单讨论，不执行任何未批准删除。

### 2026-10-27T21:03:38+08:00 最终删除确认清单（DELETE-20261027-0b87b5efeddea47f）

本节是本批唯一当前审批清单，前14条历史预检不是批准。当前16个候选中15个纳入集中确认，AI场景分类1个挂起排除；ACTION-2032未取得合法独立样例，不在本批。尚未提出或取得最终批准，未提交任何删除。

全部是原HTTP本地Mock；存储前缀为 `d-contact-cloud-v200-rebuild-20261026:`，表列后缀。每项最终执行前重新读取，核对准确对象/版本/身份/租户，重新走原守卫及引用检查。任何引用、资料不可读、对象变化或结果不确定均跳过，不清引用、不拆关系、不绕过或重复提交。仅删除明确批准且可复核通过的对象。

|序号/范围|原动作与对象|身份、租户/品牌、namespace|handler稳定ID|原最终动作/handler|删除影响|恢复能力|
|---|---|---|---|---|---|---|
|1 待批准|ACTION-2063 · 合成IVR验收1027B|SYN-CLOUD-ADMIN；TEN-NISSAN-HQ；cloud:synthetic-call:|`TASK-IVR-D03930-e29d7e7a`|删除任务 → 确认删除；CloudTaskWorkspace.deleteTask|移除未启动IVR任务；客户与审计保留。|原确认明确不可恢复；墓碑及失败回滚不构成恢复入口。|
|2 待批准|ACTION-2065 · 合成呼入验收1027|SYN-CLOUD-SUPER；TEN-NISSAN-HQ；cloud:synthetic-resources:|`97005`|删除 → 确认删除；Pages['inbound-routing'].remove → AliCtiInbound.remove|移除已停用呼入规则，其来电路由条件不再可用，保留操作流水。|未找到正常删除恢复入口，按不可恢复风险请求批准。|
|3 待批准|ACTION-2076 · 合成号码池验收1027B|SYN-CLOUD-SUPER；TEN-NISSAN-HQ；cloud:synthetic-resources:|`8203`|删除 → 确认删除；NumberPoolManagement.open(remove) → AliCtiNumberPools.remove|移除普通空号码池；不删除池外号码，被任务或默认池使用则跳过。|正常恢复能力未证，同名新增不算恢复。|
|4 待批准|ACTION-2077 · 分机8901027|SYN-CLOUD-SUPER；TEN-NISSAN-HQ；cloud:synthetic-resources:|`99000`|删除 → 确认删除；ExtensionManagement.open(remove) → AliCtiExtensions.remove|移除停用且未使用分机；不能再供坐席接听，保留删除记录。|正常恢复能力未证，重新新增不算恢复。|
|5 待批准|ACTION-2078 · 合成时间验收1027|SYN-CLOUD-SUPER；TEN-NISSAN-HQ；cloud:synthetic-resources:|`96000`|删除 → 确认删除；TimeConditionManagement.open(remove) → AliCtiTimeConditions.remove|移除时间条件，创建任务和呼入规则不能再选用；有任务/草稿/规则引用则跳过。|正常恢复能力未证。|
|6 待批准|ACTION-2070 · 合成独立坐席1027／工号901028|SYN-CLOUD-SUPER；TEN-NISSAN-HQ；cloud:synthetic-resources:|`CCI-1793076538744-4`|删除 → 确认删除；Pages['agent-center'].remove|保留通话及操作历史；删除坐席配置，清账号绑定及技能关系。|原确认明确配置不恢复；再开通按新坐席，停用恢复不是删除恢复。|
|7 待批准|ACTION-2072 · 合成空组删除验收1027／SYNDEL1027|SYN-CLOUD-SUPER；TEN-NISSAN-HQ；cloud:synthetic-resources:|`OBG-1793098976013-1`|删除 → 确认删除；OutboundGroupManagement.remove → OutboundGroups.remove|解散独立空组，坐席本身保留；原SYN1027有成员组不在范围内。|正常恢复能力未证。|
|8 待批准|ACTION-2080 · 合成应用验收1027B|SYN-CLOUD-SUPER；SYN-AI-TENANT；cloud:synthetic-resources:|`DEMO-DCC-APP-d315373a-045e-4683-ad3a-5dec07e8a57c`|删除应用 → 删除应用；Pages['application-access'].remove → DccAPI.removeApplication|该合成应用原密钥不能再获取token，撤销已发放的本地模拟身份；原回调未配置。|正常恢复能力未证；不涉及真实凭据或真实接口。|
|9 待批准|ACTION-2115 · 合成门店上交验收-1027B／V2|ACC-SUPER-001；platform；BRAND-NISSAN；cloud:|`TPL-02d6c956-65b1-420a-a599-42d01ae33439`|删除 → 确认删除；FlowConfiguration.openDelete → confirmDelete → BusinessFlowStore.deleteTemplate|删除整个独立模板（含所有已保存版本）；不解除其他分类关联或改业务记录；有引用则跳过。|正常恢复能力未证；按不可恢复的整个模板删除批准。|
|10 待批准|ACTION-2042 · 合成场景验收1027B|SYN-AI-ADMIN；SYN-AI-TENANT；ai-config:tenant:SYN-AI-TENANT|`15`；编码 SYN-SCENE-1027|删除 → 确认；Pages['sys-scene'].showDeleteConfirm(15) → confirmDeleteScene|移除这一AI业务场景配置；不操作原保护场景和呼叫名单。|原确认明确删除后不可恢复。|
|11 排除挂起|ACTION-2043 / AI场景分类 · 合成分类1027B|SYN-AI-ADMIN；SYN-AI-TENANT；ai-config:tenant:SYN-AI-TENANT|`sc_1793073363098`；编码 SCN-NEW-001|🗑 → 确认删除；sys-tags.deleteScene|移除场景分类，但含下划线ID的原引用检查不能完整识别配置引用。|原确认明确不可恢复。|
|12 待批准|ACTION-2043 / 本地标签 · 合成无映射标签删除验收1027|SYN-AI-ADMIN；SYN-AI-TENANT；ai-config:tenant:SYN-AI-TENANT|`local_store_db_1793100249414`；编码 LOCAL-STORE-DB-007|删除 → 确认删除；sys-tags.deleteLocalTag|移除本地标签；原处理会清所有指向它的供应商映射。仅当前独立未映射007纳入，若重开确认显示映射使用即跳过。|正常恢复能力未证；原已映射006保留。|
|13 待批准|ACTION-2043 / 供应商标签 · 合成未启用标签删除验收1027|SYN-AI-ADMIN；SYN-AI-TENANT；ai-config:tenant:SYN-AI-TENANT|`sp_1793073444046_1793100427185`；编码 TAG-NEW001-002|🗑 删除 → 确认删除；sys-tags.deleteTag|移除该供应商池标签及其配置/映射项；仅未启用、未映射002纳入，若发现引用即跳过。|原未启用标签确认明确不可恢复；原启用且映射的001保留。|
|14 待批准|ACTION-2104 · 合成验收成员-1027|ACC-SUPER-001；TEN-NISSAN-SH；organization|`ACC-1793066541194-v3xq`|删除账号 → 保存（最终确认）；DOrganization.remove(account,id,tenantId)|删除整个合成登录账号，其唯一上海华东门店成员授权随之移除；必要管理审计保留。|正常恢复能力未证；恢复启用不等于删除恢复。|
|15 待批准|ACTION-2105 · 合成UI验收租户-1027|ACC-SUPER-001；TEN-1793066453796-gnuf；BRAND-1793066366260-s7ts；organization|`TEN-1793066453796-gnuf`|删除租户 → 保存（最终确认）；DOrganization.remove(tenant,id)|移除此无成员无业务引用的合成租户基础资料；必要管理审计保留，不删其他租户或品牌。|正常恢复能力未证。|
|16 待批准|ACTION-2083 · 合成独立删除字段1027|ACC-SUPER-001；platform；BRAND-NISSAN；cloud:|`field-mvqo6asf-36l3533`|删除 → 确认删除；BusinessConfiguration.remove(field,id) → CustomerBusiness.deleteField|从品牌自定义字段库移除，后续新配置不再可选；既有通话、填写结果、草稿与原快照保留，不删分类或接口。|正常恢复能力未证；提交时原usage/token/revision/fingerprint再次校验。|

安全准备实际结果：

- ACTION-2105复用原合成UI验收租户-1027（TEN-1793066453796-gnuf），不新建；清除人员名称筛选后，该租户0成员，两模块未开通/资源待配置，原删除守卫可用；最终“保存”确认取消。
- ACTION-2083先核品牌Nissan的13字段、无同名样例，再原“新增自定义字段”仅保存独立单行文本“合成独立删除字段1027”（field-mvqo6asf-36l3533），字段编码为空、无上游依赖，未进入分类配置。原usage预检允许确认，最终取消。提交时原token/revision/fingerprint重新核验。原预置字段与已关联字段不动。截图/tmp/d-v200-delete-field-precheck-20261027.png。
- ACTION-2032只读核对原智能外呼，重置条件后“合成”查询无匹配任务，未找到获准独立已分配号码；原新增场景配置/专项名单不是已分配客户，不能替代。原removeAssigned是立即移除，未点击任何“移除”，未重试受拒上传，也不通过代码造号码或回执。
- AI场景分类sc_1793073363098：原sys-tags.js:1267用split下划线末段比较含下划线ID，预检进入确认不能证明无配置引用；本轮不修此guard、不清配置，明确不纳入执行批准。既有LOCAL-STORE-DB-006/TAG-NEW001-001映射、旧有成员组SYN1027、原业务历史及全屏交互不动。

影响核对来源（只读）：原F的cloud-task-workspace.js:2256、inbound-routing.js:94/alicti-inbound.js:121、alicti-number-pools.js:346、alicti-extensions.js:200、alicti-time-conditions.js:123、agent-center.js:194、outbound-groups.js:331、application-access.js:121/dcc-runtime.js:116、business-flow-store.js:231；AI原sys-scene.js:56/79、sys-tags.js:953/1118/1262；本方organization-store.js:94/99；字段business-categories.js:756、customer-business.js:839/861和business-configuration-usage.js:99。未将墓碑、失败回滚、停用恢复或同名新增当成正常删除恢复。

审批状态：已收到真实用户答复“批准这15项本地最终删除”，绑定系统questionItemId `["request_user_input_async","call_d4e58ea9c56d4ad1accf4931bef69cf8",0]`，业务快照仍为 DELETE-20261027-0b87b5efeddea47f。只授权15个纳入对象，逐项原守卫复核后提交一次并回读；分类sc_1793073363098和已分配号码仍排除。表中16候选序号不等于审批顺序，按名称/稳定ID/范围识别；不重问、不复用旧批准、不把批准替代引用核查。执行结果另行逐项记录。4项上传/718执行器/合法失败导入回执/财务样例缺口原样保留，三菜单只讨论。


### 2026-10-27T22:10:34+08:00 已批准15项最终删除当前UI结果

本批真实用户明确批准后，全部15项按原UI提交一次并回读完成（0跳过/不确定/重复提交）。各原资格与引用守卫在提交时再次核对；批准没有替代这些检查。分类sc_1793073363098和已分配号码仍排除。表为当前UI后态，原专业删除的历史保留/配置丢失/凭据失效语义沿原流程，不扩大为生产验收。

|对象ID|实际身份/租户/namespace|当前UI证据|
|---|---|---|
|15|SYN-AI-ADMIN / SYN-AI-TENANT / ai-config:tenant:SYN-AI-TENANT|SYN-AI-ADMIN/合成AI租户；row15/SYN-TASK-1027/SYN-SCENE-1027及原showDeleteConfirm(15)复核一致，无进行中阻挡；确认一次后删除成功且同查询精确场景行0。|
|local_store_db_1793100249414|SYN-AI-ADMIN / SYN-AI-TENANT / ai-config:tenant:SYN-AI-TENANT|SYN-AI-ADMIN/SYN-AI-TENANT/门店督办；LOCAL-STORE-DB-007真实data-local-tag-id一致；原确认普通删除文案、无供应商映射使用警告，提交一次；007行0、保护006行1，本地标签已删除。|
|sp_1793073444046_1793100427185|SYN-AI-ADMIN / SYN-AI-TENANT / ai-config:tenant:SYN-AI-TENANT|SYN-AI-ADMIN/SYN-AI-TENANT/合成供应商sp_1793073444046/门店督办；TAG-NEW001-002 data-tag-id准确、checkbox=false、映射空；原确认无启用引用警告，提交一次后002行0；001仍checked=true并选中LOCAL-STORE-DB-006。|
|TASK-IVR-D03930-e29d7e7a|SYN-CLOUD-ADMIN / TEN-NISSAN-HQ / cloud:synthetic-call:|SYN-CLOUD-ADMIN/HQ私有call；同名0名单0完成0接通/待分配客户且无调度；原canDeleteTask保留删除入口、handler ID准确；最终确认一次后精确任务行0、dialog0，旧流程演示保养IVR历史行仍1。|
|8203|SYN-CLOUD-SUPER / TEN-NISSAN-HQ / cloud:synthetic-resources:|SYN-CLOUD-SUPER/enterprise7522240/resources；原pool8203普通池0号码非默认与ID准确；原最终引用守卫通过，确认一次后删除成功、精确池行0，总部默认池仍2号码/是。|
|97005|SYN-CLOUD-SUPER / TEN-NISSAN-HQ / cloud:synthetic-resources:|SYN-CLOUD-SUPER/7522240/resources；97005已停用/priority98/仅合成13800009990且原handler一致；确认一次后精确规则行0，原总部客户来电优先级1已启用/号码时间配置仍保留，关闭只读管理层。|
|99000|SYN-CLOUD-SUPER / TEN-NISSAN-HQ / cloud:synthetic-resources:|SYN-CLOUD-SUPER/7522240/resources；分机8901027/ID99000仍停用未使用且上下文一致，原绑定/使用/呼入守卫通过后确认一次；列表10→9，精确分机行0，未批准导入分机8304仍1。|
|96000|SYN-CLOUD-SUPER / TEN-NISSAN-HQ / cloud:synthetic-resources:|SYN-CLOUD-SUPER/7522240/resources；96000总部合成时间/priority99/10:00–11:30标识一致，原任务/草稿/呼入引用最终校验通过后提交一次，表6→5精确行0，原工作日营业时间仍1。|
|CCI-1793076538744-4|SYN-CLOUD-SUPER / TEN-NISSAN-HQ / cloud:synthetic-resources:|SYN-CLOUD-SUPER/resources/HQ，901028仍离线、未配置分机、无技能；handler/最终确认CCI一致且inUse原守卫通过，提交一次后名单14→13、精确姓名行0，原合成重提901027仍启用/绑定8101，toast历史保留。|
|OBG-1793098976013-1|SYN-CLOUD-SUPER / TEN-NISSAN-HQ / cloud:synthetic-resources:|SYN-CLOUD-SUPER/7522240/resources；OBG真实handler一致、SYNDEL1027名称/0成员未变；原在途任务守卫通过，确认一次后空组行0，原SYN1027仍1人。|
|DEMO-DCC-APP-d315373a-045e-4683-ad3a-5dec07e8a57c|SYN-CLOUD-SUPER / SYN-AI-TENANT / cloud:synthetic-resources:|SYN-CLOUD-SUPER/resources；appId、名称、SYN-AI可访问范围/未配置回调与批准一致，演示key全程遮蔽；原超管/revision最终校验提交一次，应用3→2，精确ID行0，原APP-A/B各1。|
|TPL-02d6c956-65b1-420a-a599-42d01ae33439|ACC-SUPER-001 / platform / cloud:|平台超管/Nissan/cloud正常namespace；精确模板ID、名称、最新V2/2节点一致，原引用/版本/当前资格检查允许确认且最终通过；提交一次，精确模板行0/弹窗0，正常主线TPL-e580...仍V1/4节点。|
|ACC-1793066541194-v3xq|ACC-SUPER-001 / TEN-NISSAN-SH / organization|平台超管/上海华东门店；精确data-id与login一致、原完整引用及无其他租户守卫enabled=true/reason空；删除账号最终保存一次后当前SH同名查询0，未再停用恢复，必要管理操作记录由原commit保留。|
|TEN-1793066453796-gnuf|ACC-SUPER-001 / TEN-1793066453796-gnuf / organization|平台超管/organization；GNuf空租户名称ID一致、两模块未开通/云资源待配置、原无成员及完整引用守卫enabled=true/reason空；最终保存一次后精确租户行0，原日产总部仍1；未删品牌/成员或清业务凑空态。|
|field-mvqo6asf-36l3533|ACC-SUPER-001 / platform / cloud:|平台超管/Nissan/cloud；field-mvqo6asf-36l3533名称/单行文本/无上游一致；原usage可删并在最终确认核token/revision/fingerprint后提交一次，字段库14→13，精确字段行0，原线索等级仍1；未清分类/依赖或历史结果。|

- 完成后恢复点：平台超管/Nissan/自定义字段列表，字段库14→13；最终确认全部关闭，无通话或未保存表单。后续只做适用的读取验证，不重复提交任何删除。
- 独立引用guard修复继续以非删除预检和隔离反例验证；不会删除SCN分类或拆其配置。候选原文未知字段投影反例问题已交双审补充，主目录尚未采用未验证候选。

### 2026-10-27T22:54:43+08:00 当前明确收口：104/113动作有核心UI后态，9项保留

本节替代旧22项缺口摘要作为当前结论，旧fail、旧预检和批准前状态保留为历史。真实批准questionItemId `["request_user_input_async","call_d4e58ea9c56d4ad1accf4931bef69cf8",0]` 对应15对象全部原UI提交一次并回读，0跳过/未知/重复提交；重新进入对应原上下文后也未恢复，未调用真实系统。

- 按receipt逐行补齐13个ACTION：2063、2065、2076、2077、2078、2070、2072、2080、2115、2042、2104、2105、2083。
- ACTION2043仅007/002两项删除完成，原006/001保留。分类编码引用缺陷已最小修复；sc_1793073363098仍不在本批、未授权未删除。主UI无引用预检取消，已引用DB场景14处阻挡。目录真实最终删除/后续生命周期不据本次预检或VM确认分支推定通过。
- 当前104是核心UI后态证据口径（38复用+66补齐），不是全部验收/生产通过。实际文件直开自动访问限制、12项延期及14项工程缺证保留。

|仍开放ACTION|准确剩余条件|
|---|---|
|ACTION-2096 批量导入AI专项限制号码|原入口实际是号码文本框，旧“文件上传”归类错误；本轮未提交。原拒绝适用范围与该批次写入允许范围仍待核清，详见下方有界收口。|
|ACTION-2030 原任务呼叫名单手动导入|号码文件上传：既有工具拒绝仍保留，不重试；需相应明确解限后才可执行。|
|ACTION-2032 原已分配名单单条移除|未找到获准且经原合法入口形成的独立合成已分配号码；现有保护客户不动，原文件上传限制不重试、不造号码或导入回执。取得准确样例后仍需其不可恢复移除的具体批准。|
|ACTION-2043 维护原标签及供应商配置|AI场景分类sc_1793073363098 / SCN-NEW-001的最终删除：明确排除于本批15项，仍未授权、未执行；引用可靠性代码已最小修复并仅做非删除预检，不能据此标整项完成。|
|ACTION-2058 原任务客户导入|预测任务CSV选择上传此前已拒绝；最小输入：在合法允许的原环境由用户完成一次选择/上传后提供同次回执，不由代理重试。|
|ACTION-2059 按原状态办理执行/控制|正常718无人接听重呼执行：原alicti-retry.js仅配置映射，调度/次数由供应商负责；当前dccManaged任务被原本地执行器排除。保留执行缺口，不新增供应商模拟器，不以坐席漏接或人工再次联系代替。|
|ACTION-2060 原任务结果查询与失败下载|原预外呼失败批次输出下载：尚需私有空间内有原失败导入回执的合法样例；禁止重试已有CSV上传拒绝。|
|ACTION-2062 原IVR名单处理|IVR名单CSV选择上传此前已拒绝；同上，不改通道。|
|ACTION-2045 办理原已有充值操作|话费包/原记录UI已有；试用成功需要有权且试用未开通的样例，年包成功需要有权且未开通/已过期的商用样例。当前批准仅总部且商用有效，不擅改已有服务状态或扩权。|

本轮实现仅本方两个源文件及其生成的AI bundle/index/provenance；Cloud包/菜单/全屏/话单代码不变，无新原型/备份/永久工具。主guard79+独立9当前代码检查通过，构建稳定；当前浏览器平台超管/租户管理、无弹窗/通话/未决提交，原HTTP页保持。

### 2026-10-27 夜间有界收口：原验收优先，当前9项的最小恢复条件

本节只补充原源码可行性结论、一次待答确认与恢复条件，没有新增UI通过项。当前仍为104/113动作有核心UI后态、9项未闭环；15项获批删除已经全部完成，禁止重放。S7 pending，S8/G3未通过；file直开自动验收限制、12项延期、14项工程缺证继续保留。统一7类、三菜单、首访选项移除只讨论，原验收未清之前不实施。

|动作|本次有界结论|最小后续条件；当前不执行的事项|
|---|---|---|
|ACTION-2096 AI专项批量号码|原`scene-block.js:439/576`及当前`ai-special.js:26`都使用`textarea#blockImportPhones`，最多50号码，并无文件选择。之前将其一并写成“上传受限”有误，已在当前队列纠正；未尝试批量写入，也未把`sourceType=API`当外部接口证据。|原文件权限拒绝不能直接证明文本入口也被拒绝；目前又有本轮不重试该批次写入的明确约束，故不自行放行。核清实际原拒绝范围及允许的身份/租户/独立分组后，才走这个原文本入口验证有效、重复、格式结果，不要求不存在的文件上传步骤。|
|ACTION-2030 AI任务名单手动导入|原文件入口仍缺实际上传后态；本次不再打开选择器。此前模板下载文件已有，不能重复导出充数。|在合法允许的原环境选择独立合成文件并保留同次任务/平台/导入记录/已分配回读；原模板表头为手机号、姓名、备注，专业动态列按原模板。只有文件权限条件真正解决后才继续；不得换文本/代码通道绕过。|
|ACTION-2032 已分配号码移除|原`scene-list.js`的已分配数据只来自旧静态样例或文件导入；新增场景只保存配置，不生成任务已分配行。未找到原单条新增、复制、粘贴或准备独立样例入口。原`removeAssigned`立即移除，没有最终确认层，本次未点击。|先取得合法原入口形成的独立合成已分配行，核准确任务内部ID、平台、行/号码及同次导入回执；随后单独请求该行不可恢复移除批准。原保护客户、专项名单和场景配置均不能替代，不注入号码或伪造受理。此支路停止重复查找。|
|ACTION-2043 AI场景分类最终删除|独立分类`sc_1793073363098 / SCN-NEW-001 / 合成分类1027B`未含于15项批准。引用guard修复已经交付；最近真实UI预检取消，分类仍在，未最终删除。|已单独提出一次`CATEGORY-20261027-SCN-NEW-001`确认，工具仅返回accepted；未有用户答复、未获批准、未执行，不重复催问。真实答复须绑定工具实际questionItemId；此前15项批准不能代用。提交前再核对象/版本/权限/完整引用，有引用、变化、未知即跳过。|
|ACTION-2058 预外呼客户导入|原CSV选择上传限制仍在，本次未重试。原页还有粘贴/示例入口，不能作为该受拒路径的替代证明。|原有权独立任务、原CSV字段/同次导入请求关联及合法上传条件；保留有效/重复/格式错误与受理结果，前端无效行预览不算失败导入台账。|
|ACTION-2059 正常718重呼执行|原`alicti-retry.js`只有配置校验/字段映射，无请求或定时器；真实匹配、调度、计数归供应商。现有已获批任务启动、接听、话后、暂停继续终止、人工/自动失败补提交已有证据，不重复办理，也不替代718重呼。|补版本明确的实际执行契约及脱敏执行证据，详见下方最小清单。不得新增供应商模拟器、生成伪话单，或用坐席漏接/人工再次联系冒充。|
|ACTION-2060 导入异常快照下载|绑定的是原“客户与处理记录→导入异常→准备下载文件→下载记录→下载文件”，不是普通任务导出或呼叫失败。缺同租户/任务的合法失败导入回执；原“准备四条合成线索/接收合成失败分片”会构造模拟受理和53事件，本轮不调用。|取得可关联原任务/供应商任务/fileId/号码的合法失败记录后，才走原快照下载。须核同次文件实际写入、关闭、回读和相应明细清理；点击下载、模拟已保存或别的CSV落盘不能替代。|
|ACTION-2062 IVR名单导入|原IVR CSV选择上传限制仍在；本次未试其他通道，也不重建已删任务。|合法允许的原环境、准确未启动独立任务及其原CSV结构、同次导入记录；由用户按允许路径准备后再接续。|
|ACTION-2045 试用/年包办理|已批准平台超管财务范围仅日产总部；映射后只有一个AI服务资料，当前商用有效。原充值守卫禁止当前有效服务再开试用/年包；来源账本1/5并非独立可操作服务。公共新增租户不会自动产生AI资料或财务授权。|缺明确获准的独立财务样例及共同租户↔AI资料稳定ID映射：试用需试用未开通；年包需商用未开通/已过期，且明确trial/annual/history范围。现有其他试用/过期源样例在批准范围外。不得改总部商业属性/有效期/业务时钟凑状态、复制同一资料扩权或真实充值；话费包/手调旧通过项不重复。此支路停止重复检查。|

2045来源界限：本方`mock/data.js`服务授权、`module-host`的`canService`、`ai-finance.js`的精确租户访问校验与单行`DNativeServices.open`，以及原`RechargeService.productsFor/previewRecharge`一致限制上述范围。仅前端显示某租户或拥有“超管”称谓不能扩大本次批准。

2059交给研发的最小执行证据（以下为需要补充的语义证据，不冒充已存在或已核验的供应商字段）：

1. 明确本方构建版本、AliCti API/SDK版本、配置版本及同次原始提交快照。当前已知映射为`retryStrategy`中的`sipCause/retry/sort/strategy(round,time)`及`retryStrategyTimeType`；timeType 1从首次、2从上次呼叫起算，次数不含首次。
2. 稳定关联租户、企业、供应商任务、原导入文件和原号码，并逐次保留真实尝试标识/时间；不按名称、最近一条号码或伪造callId补关联。
3. 号码状态识别服务已开通的证据，及客户侧718未接听原始结果；区分坐席漏接。至少一组符合已配置轮次/间隔的首次718与真实后续尝试结果。
4. 同一通话SIP/CDR晚到或重复回传不增加重呼次数；原生正常重呼与平台失败补提交互斥/计数界限有实际证据。`finishRetryFlag=1`仅证明供应商该任务号码的最后尝试，不能直接结案整个业务培育。

2060最小失败输入：同次`localTaskId/tenant或enterprise/supplierTaskId/fileId`及原手机号、leadCode、priority/R可追溯。若来源为53，需原始`type=53/failedTelList`、逐行失败原因、能唯一对应导入行的originalData，以及一致且完整的分片数量/序号/总失败数；冲突或缺片保持待核，不拼造成功。前端校验失败预览及呼叫失败记录不满足此条件。

恢复点：唯一原型仍为既有`prototype/index.html`；最近浏览器原HTTP页处于平台超级管理员/租户管理，无弹窗、未保存表单、电话或未决写入。本次后续只改现有记忆与临时队列，没有更改业务代码或浏览器数据、没有再次导出/上传/充值/删除。未获新条件时这些支路保持挂起，不轮询催促，不提前实施新方案。

### 2026-10-27T23:44:50+08:00 当前终态：105/113核心UI证据，8项挂起

本节更新此前104/9口径。ACTION-2096已通过原生文本框补验：有依据区分具体CSV文件拒绝与原独立文本入口；既有合成空组group_1793073856206仅提交一次4个token，实际新增2/重复1/错误1，重新登录仍2条、30天、仅本地，公共禁呼列表为空。准确范围SYN-AI-ADMIN/SYN-AI-TENANT，存储键`d-contact-cloud-v200-rebuild-20261026:contact-policy`、内部scope`tenant:SYN-AI-TENANT`。未重试文件、调用供应商、清名单或删除；原输入及两张截图见/tmp/d-v200-2096-original-text-ui-receipt.json。旧将2096归入文件限制及未核清的段落保留为历史，不作为当前阻塞。

|仍开放ACTION|当前最小解锁条件|
|---|---|
|ACTION-2030 原任务呼叫名单手动导入|原AI任务名单文件合法上传及同次回执；不重试受拒选择器。|
|ACTION-2032 原已分配名单单条移除|合法原入口形成的独立合成已分配行＋精确该行不可恢复移除批准；不动保护客户。|
|ACTION-2043 维护原标签及供应商配置|CATEGORY-20261027-SCN-NEW-001独立确认待答；未获答复不删，原15项批准不能代用，最终仍重核引用/版本/权限。|
|ACTION-2058 原任务客户导入|原预外呼合法文件上传及同次导入记录；不改通道。|
|ACTION-2059 按原状态办理执行/控制|号码状态识别与正常718供应商重呼的版本化实际执行证据；不造执行器或伪话单。|
|ACTION-2060 原任务结果查询与失败下载|同租户/任务/fileId/号码的合法导入失败回执，再验原快照文件实际写入/回读。|
|ACTION-2062 原IVR名单处理|原IVR独立任务的合法文件上传及同次回执；不重建已删任务。|
|ACTION-2045 办理原已有充值操作|明确获准、状态适用、租户↔AI资料ID映射准确的独立试用/过期商用样例；不改总部状态或扩权。|

原15批准删除、分类引用修复、菜单和全屏均未重做；分类独立问题未见新答复，不催问不删除。当前浏览器原HTTP页为合成AI验收/合成AI验收租户/黑名单管理→AI专项名单，既有1组2号码，无弹窗、未保存草稿、电话或未决写入，保留handoff。其余支路无新材料不循环检查；原验收未全通过，新方案继续等待。此为本次有界续接终态，不是S8/G3或完整原型验收通过。


## 2026-10-28T07:42:46+08:00 S7 step-11：统一七分类与三配置菜单实施结果与未测边界

- 本轮用户授权已落实在唯一正式入口。统一7默认分类：新线索 lead（原线索类同ID改名，保留名称历史）、冷线索 lxs、督办 db、服务 fw、回访 hf、售后类 aftersales、活动类 activity。AI旧xxs键仅作为lead兼容映射；展示不另建可编辑分类。首访从新选择移除，历史原值保留、不归督办、不级联清除。
- 业务分类集中CRUD、独立精确版本路由和云字段/AI配置引用；云外呼配置集中复用字段库和接口字典；AI标签配置集中标准/供应商标签与映射。品牌共享分类、租户独立AI配置，旧原目录范围显式保留。冷线索无自动lead逻辑或自动路由，AI不写业务结果。
- 修复首轮构建导出锚点/引号错误、旧目录写入克隆问题、字典tab跳错页、字段保存后跳转、仅旧3类目录直存新类路由、异步分类跳转竞态/原目录丢失、未知AI结构漏检。当前正式构建与最终重跑均通过；不把早期失败记录成通过。
- 检查：19组主模型 + 9组独立路由 + 15组独立AI审计共43组通过；原AI配置/关联/流转三个回归脚本通过。待核路由、旧CAT-LEAD任务、非空/空供应商配置、未知/损坏/歧义专业资料均阻删；分类版本/范围变化拒绝关联保存。正向删除只在独立内存VM验证，不代表实际删除已验或获批。
- 实际UI：三个菜单、7默认类、分类字段引用/必填回读、总部AI供应商引用回读、冷线索准确定位、总部测试标签保存与门店隔离、字典留在2223、督办引用阻删、新建场景无首访、电声只允许新/冷、原全屏画布打开/取消均通过。最终控制台error=[]。新HTTP端口56225只为隔离回归，保旧验收浏览器；新增测试自定义分类/标准标签均名“统一分类回归1028”，不是第8个默认类。未访问被拒file/upload或真实供应商。
- 两次构建6类输出SHA一致；190专业源及90冻结源SHA不变，全屏生成器/拖拽patch/主CSS未变。证据：/tmp/d-v200-unified-20261028-{results,build-results,ui-results}.json、/tmp/d-v200-ai-audit-20261028-results.json、/tmp/category-route-legacy3-vm-20261027.cjs；截图/tmp/d-v200-unified-20261028-{categories,flow}.jpg。
- 原105/113及8待验2030/2032/2043/2058/2059/2060/2062/2045保持；S7不推进S8/G3，12延期/14工程缺证保持。未清空历史/存储、未重做原15删除、未生成备份包。

## 2026-10-28 08:18 · 八项续接的当前范围与两项具体解锁提案（未执行）

- 已核今早六类生成产物SHA与07:42:46 build-results完全一致，保留七分类/三菜单/首访历史/全屏。S7预检曾因step-11 Expected Change与R表Step IDs漏登记失败；只补原update声明及R-005/013/014/041/063的step-11映射后预检通过，未改业务规则/状态/来源或代码。
- 实际浏览器：旧标识980687976当前URL是56225分类回归页（不是54823），页面只有分类列表，无弹窗/电话/表单；原54823地址一次正常导航返回ERR_CONNECTION_REFUSED。没有重启/扫描进程/用Python GET、没有清浏览器数据；56225独立origin的数据不当作旧验收数据，另一分类回归页980688046保持。原八项旧对象实时状态尚未取得。
- 2030/2058/2062仅准备/tmp/d-v200-acceptance-inputs-20261028三份UTF-8 BOM最小CSV，每份2行、共618字节；AI列为手机号/姓名/备注，预外呼按新线索lead为客户称呼/客户号码/线索编码/优先级/联系备注/R，IVR按原任务名单为客户称呼/客户号码/联系备注/线索编码。prepared-inputs.json记录SHA。没有选择文件、上传、受理或构造失败回执，taskId保留null，实际目标/目录版本必须在原现场恢复后核定；若选择其他分类按其原模板另核列。

### 解锁提案 A：仅恢复原54823本地验收服务

当前CLAUDE.md:36明确“不得清缓存、重启服务或调查无关服务根来规避问题”，因此本提案待本次明确例外，不能把“继续推进”代作批准。若批准，仅在原目录用标准Python静态服务恢复`127.0.0.1:54823`，根目录固定`/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2`，命令为`python3 -m http.server 54823 --bind 127.0.0.1 --directory /Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2`。不开放外网、不更改文件/端口/浏览器存储、不停其他服务或扫描进程；若端口占用/仍失败即停。随后只在原HTTP地址加载当前版本并先读旧现场，不重做任何已执行提交。交付仍直接index，不新增.command或用户启动要求。用户也可自行恢复原服务后告知。

### 解锁提案 B：两个独立财务Mock样例及两笔原套餐测试

当前源码授权仍只有ACC-SUPER-001/platform对TEN-NISSAN-HQ，AI ID2054080803329462274；新统一分类未新增财务路径，服务仍是有效商用。不得修改此总部状态/时间/余额，不复制它冒作独立样例。

若另获批准，只增加以下独立本地演示映射（目前尚未新增账号/租户/数据或权限）：

|对象|稳定ID与初始状态|
|---|---|
|演示身份|SYN-FIN-ADMIN-1028，登录synthetic-finance-1028，显示“合成财务验收1028”；平台scope synthetic-finance-1028，只能访问PAGE-2112及以下两个合成对象，明确sourceRole super_admin仅作为此有限Mock映射，不推定真实生产角色。|
|试用对象|公共租户SYN-FIN-TRIAL-1028 ↔ AI资料9900000000000001028；商用标记trial，服务not_opened，起止空，分钟池可用/冻结/消耗均0，无旧流水。|
|商用对象|公共租户SYN-FIN-ANNUAL-1028 ↔ AI资料9900000000000001029；标记commercial，服务not_opened，起止空，分钟池均0，无旧流水。|
|存储|仅新隔离键d-contact-cloud-v200-rebuild-20261026:ai-service-ledger:synthetic-finance-1028；这两个资料和映射属于本地Mock种子，不进真实公共组织或供应商资源。原ai-service-ledger和原总部资料/授权完全保留。|
|允许操作|仅service.view/trial/annual/history，严格限这两个ID；不授service.credit/adjust、业务处理、真实接口或其他租户权限。|

仅从原服务表单各提交一次默认套餐：试用1个/0元/30天/500分钟；年包1个/模拟5000元/365天/10000分钟，沿原演示业务时钟2026-09-07 10:20，不改时钟。只做本地保存、原流水及重新登录回读，不真实付款、不供应商调用、不重做总部充值/手调。需最小改动现有Mock映射与服务适配器选择隔离账本的边界，保原套餐/权限/版本/同次未知处理规则及生成链；批准后先核当前代码并在已有Loop内实现、定向验证，不直接注入浏览器store。该范围批准不覆盖永久删除或上传拒绝。

本节只是可审核提案，没有新UI通过；原105/113、八项开放不变。分类CATEGORY-20261027-SCN-NEW-001旧问题仍未答，且新目录不再通过原sys-tags删除：原sc_*注册数据保留与新品牌目录的映射必须核当前旧现场，不能点隐藏旧入口、盲删、把“已改造”标不适用/通过，亦不替换成默认七类或今早回归样例删除。

### 2026-10-28 · 2059/2060接口资料定向核对（候选证据，未替代冻结结论）

按本轮指定Wiki索引只读核对天润预测式外呼/字段定义/通话记录/数据结构/推送配置五页的必要章节，未重扫全库、安装插件、写Wiki或调用接口。源码/目录事实及原八项状态不因查到定义变成已执行。来源路径、行段和当前SHA已记录/tmp/d-v200-8items-interface-review-20261028.json；原始出处为各Wiki页明确链接的raw/external/tianrun-api-official/v1/文档/html/wiki/API/...。采集2026-10-13、快照v1不表示供应商API版本。此为单独资料核对，不直接据Wiki重写原型业务、source-index、接口矩阵或冻结输入。

- 2059：预测式外呼页1690–1732的任务创建定义为`/interface/v10/task/create`，type区分1预测/2自动；retryStrategy基础对象或高级数组，condition.sipCause/round/time、retryStrategyTimeType及首次起算递增规则有定义，高级依赖号码状态识别。数据结构附录2609还保留“仅自动外呼”的限制表述，不能从不同章节擅自推出当前部署版本已支持所有任务；保留原已确认规则，需研发明确实际部署/API版本和适用type/开通证据。字段定义674的原始SIP718是无人接听；通话记录3997–3998区分聚合sipCause=-700与sipCauseRaw=718，不混作相同取值。实际重呼仍需同租户/企业/任务/批次/号码的一次原始718与下一真实尝试，逐次唯一标识/时间/策略版本、telRetry及finishRetryFlag原值；同通话晚到/重复不增次数。公开定义和示例不能替代真实执行/回调证据，不新增供应商模拟器。
- 2060：预测页401–520的`/interface/v10/task/importTaskTel`按批导入，name/taskId/taskTelList必需，fileId用于追加原批，importTelAutoStart默认0；“受理成功”不能当每条成功。564–604的`listTaskTel`按taskId、可选fileId/fileName/tel定位。字段定义2748–2785规定失败推送含enterpriseId/taskId/fileId/fileName/totalFailedCount/totalBatchCount/currentBatchCount/failedTelList；列表每项为完整原始导入字段加failedReason（TaskDup/BatchDup/ReqDup/NumFmtErr/BlkNum/CustNumNil），推送配置423确认53为导入失败、52为呼叫失败。当前模型的originalData/本方localTaskId等是本方关联或规范化责任，不冒称原始回调必有同名包装。需要同次原始提交/响应/失败分片和稳定ID关联，不能用文档示例/手填payload/前端格式错误/呼叫失败伪造源回执；无实际源记录，快照下载及清理仍未验。

### 当前八项原入口复核结论（不是新通过）

|ACTION|当前入口与变化|原现场恢复后的准确下一步|
|---|---|---|
|2030|呼叫中心→智能外呼→准确任务详情→手动导入；仍是importFileInput原文件入口，未变化为文本导入。|SYN-AI-ADMIN/SYN-AI-TENANT先读任务/平台/原已分配及导入历史，核是否有独立合法任务；AI最小文件只是待选资料，不预填任务ID。|
|2032|同任务“已分配”行即时移除，仍仅原合法文件导入生成行；统一分类没有新增名单生成入口。|先取得上述原合法独立行的准确ID/号码及回执，再单独确认移除。专项2行不作为替代。|
|2043|当前category_build禁用原AI saveSceneEdit/toggle/delete/addScene，标签目录由DUnifiedAI.scenes读取共享分类；原MockTagScenes只留旧键注册。|旧sc_1793073363098是否还存、是否有关联或迁移映射必须原54823数据核；它不是默认七类，也没有证据可直接按名称映射。“隐藏旧入口”不可用来绕过中央删除引用守卫。原待答批准不自动改成新品牌分类删除范围。|
|2058|呼叫中心→预外呼任务→当前可导入任务→客户与处理记录→手工导入；DccRecords按当前分类动态字段。|先读SYN-CLOUD-ADMIN/HQ私有任务的来源/状态/资格，只用未启动且当前原guard允许的独立样例；已经终止的D66028不得重启或继续导入。|
|2062|呼叫中心→语音外呼→当前可导入任务→CustomerTasks原客户名单CSV，非资源“导入号码”。|仅原未启动独立IVR任务；已删D03930不重建或导入，恢复后核当前其他准确合法目标。|
|2059|原任务重呼配置和执行结果/话单入口保留；分类改造没有增加供应商执行器。|补上方实际部署/识别服务/原718与真实重呼证据；不重放已验暂停终止/失败补提交。|
|2060|客户与处理记录→导入异常→准备下载文件→原下载记录。|恢复原任务的同次导入失败资料；先只读，不调用合成53/四线索工具，不重复已完成普通导出。|
|2045|系统管理有权租户AI服务→原服务充值详情；源码ai-finance/grants仍限超管/总部有效商用。|无新授权内适用样例，提案B待答前不造状态或扩权；恢复后只读当前服务/分钟/流水，不重复总部操作。|

八项原现场验证现在共同受原54823服务断开阻塞；已完成当前源码/入口/资料与最小文件准备不算这八项UI通过。当前执行不是idle等待代替结论：A/B两项明确问题已各提出一次，工具accepted但无系统questionItemId/用户答复，不能当批准。服务例外、财务映射与分类/名单最终删除的授权相互独立。

### 2026-10-28T08:21:51+08:00 原54823恢复及2043当前可审批对象

- 用户系统问项[request_user_input_async,call_a603953fe442453483b3eb5b8949bf62,0]明确答复“允许仅恢复原54823本地验收服务”。仅原指定Python静态命令启动session40027、绑定127.0.0.1:54823/原Demo_Protype_2；原页reload后恢复SYN-AI-ADMIN/合成AI验收租户/既有专项1组2行，当前新菜单已加载。没有清数据或重复2096；财务提案B仍未答。
- 当前中央业务分类真实列表初始仅7默认类，旧sc_1793073363098不在该可编辑目录；原AI分类删除已禁用。未读取浏览器隐藏store/原始全局来判断旧sc存在，不把列表不可见当已删。原CATEGORY-20261027-SCN-NEW-001仍只对应旧对象，不能代批下列新对象。
- 为当前统一目录的正向删除验收，仅经原“新增业务分类”UI新增一次独立“合成统一分类删除验收1028”，编码标题“合成验收编码”，0字段/未配置路由；保存后列表精确行1。真实DOM handler稳定ID为biz-mvrdbn8f-mdhpu86。身份SYN-AI-ADMIN、租户SYN-AI-TENANT、品牌BRAND-NISSAN；Cloud私有存储前缀由原makeContext推得d-contact-cloud-v200-rebuild-20261026:cloud:synthetic-ai:，CustomerBusiness配置键customer-business-config-v111-current。只作为本原Mock对象，无真实租户/业务调用。
- 一次点击该行“删除”以打开原引用预检，被自动审批明确拒绝：认为该控件启动破坏性流程，缺新对象具体批准，原15项排除分类删除。未执行该点击/最终删除，也不间接调用handler或更换入口重试。随后只读DOM取得ID。引用守卫尚未运行，不能说“已无引用”。
- 新对象若获当次具体批准，才从当前原入口走引用预检和确认，提交时重新核身份/租户/品牌/精确ID、版本/token/fingerprint及所有原任务/字段/AI专业/路由引用。任何引用、资料变化、未知或结果不明则跳过，不清引用、不重复提交。只删此合成业务分类；共享字段、字典、AI标签、模板、客户/通话和历史保留。原模型有归档但无正常恢复UI，按不可恢复风险确认。此与旧sc对象不是自动迁移/同名合并；完成只能作为新版等效操作证据，旧记录保留与历史范围仍单列。
- 准确截图/tmp/d-v200-category-delete-current-target-20261028.png；当前无确认弹窗、电话或未保存表单。另行提出CATEGORY-20261028-biz-mvrdbn8f-mdhpu86，一次问题待答，不沿用原15项或旧sc批准。

### 2026-10-28T08:25:39+08:00 ACTION-2062原归属冲突及最小口径修订提案

- 原54823/SYN-CLOUD-ADMIN/HQ真实UI：DEMO-CUSTOMER-TASK-1“IVR通知（名单分配演示）”待分配客户、0名单、0话单，客户数据只有分配客户，无任务CSV导入；未分配/导入/启动/终止/删除。
- 参考v1.2 customer-tasks.js:168–170 canImportToTask明确task.callType===预外呼，cloud-task-workspace.js:1930–1933 customerImportButton也仅预外呼，1935–1945 openCustomerImport候选仅预外呼。当前主bundle仍保这些限制，没有在统一分类改造中增加IVR直导。原ACTION2062的ivr-import来源归属误指这些预外呼方法，不能以此证明有可点击的IVR直导/上传能力；不是仅缺文件权限。
- 建议修订仅针对验收归属：沿既有“导入与分配→合法导入形成客户→分配至IVR任务”检查原IVR名单处理，不新增IVR直导按钮/接口/绕过上传，不把分配偷偷当成新导入操作，也不据改造直接标不适用/通过。保留ACTION2062追溯及当前source-attribution冲突；需用户确认后回需求分析登记修订，原冻结输入不由原型直接改写。
- 该确认本身不批准受拒文件上传、清除保护客户、最终删除或发起呼叫；依旧须先有合法独立客户和原准入。若用户确需任务内CSV直导，则是另行范围讨论，不能在本轮默增。提问业务IDIVR-2062-ATTRIBUTION-20261028，尚未答。

### 原预外呼当前合法文件接续目标（仅准备，未上传）

- SYN-CLOUD-ADMIN / TEN-NISSAN-HQ / cloud:synthetic-call:，合成预外呼验收1027B，真实handler TASK-PRED-D58356-27f8ba87：待分配客户、名单0、完成0，原导入客户按钮可用。只打开原手工导入层、选择“新线索”实际value=lead核模板字段，再取消；未点选择CSV/填入示例/检查/确认导入。截图/tmp/d-v200-predictive-import-ready-20261028.png。合法人工选择的最小输入为/tmp/d-v200-acceptance-inputs-20261028/预外呼名单-最小合成.csv，仍不是上传/受理回执。
- 同任务客户与处理记录：手工导入、已保存0/受理0；导入异常信息有误0/导入失败0/待确认0，准备下载文件禁用，下载记录0。未调用合成异常工具，不点禁用按钮、不构造53。这是2060当前缺源回执的真实UI后态，不是下载通过。已终止TASK-PRED-D66028-f6c062a9及旧样例均不重启。

### 2026-10-28T08:32:47+08:00 当前收口：106/113核心UI证据、7项保留

- 新分类biz-mvrdbn8f-mdhpu86经本次具体批准，重核同身份/租户/品牌/handler，原引用守卫允许进入确认，最终只提交一次，目标行0；退出重登仍0、七默认类保留、error[]。这是当前统一分类的等效正向删除实测，不是凭改造直接通过；旧sc_*未操作，不声称已实时证明其隐藏注册项迁移或清理。原15删除未重做。详见/tmp/d-v200-category-current-target-20261028.json及两张deleted截图。
- 只关闭2043当前最后删除子操作，106=38复用+68补齐。2062用户已确认按既有导入后分配链路修订，已回外层非冻结需求差异清单登记，未产生实际输入/分配结果，仍待验；2045按用户决定挂起，SYN-FIN提案完全未实施。
- AI列表曾因重置不真正清三条件而误显0；显式查询后26卡片。原卡片15/华南店-试驾邀约-中科金在该隔离租户已分配0、未启动、原手动导入可打开，但概览有原演示统计，不能宣称整个任务无历史。它与已删SceneRows合成配置行15不同；只读打开文件层再关闭，没有文件选择/上传/开始上传/移除。
- 当前预外呼独立空任务TASK-PRED-D58356-27f8ba87导入准备已核lead及原字段后取消；2060失败/待核/快照均0，按钮禁用。D66028等已终止样例不重启。IVR DEMO-CUSTOMER-TASK-1仅分配入口、0名单，本轮未分配/启动。
- 筛选修复仅本方ai.js与build-modules.py：当前合法PAGE2103的原重置按钮清名称/两下拉、调用原查询并记住清空条件，其他页与写权限不改。正式构建两次一致，AI仅2脚本变化/样式不变，Cloud/共享样式/190源/90锁定输入不变；真实3条件0卡片→重置三个空值/26卡片，跨区域返回仍空/26，error[]。原fail保留，当前修复通过；证据/tmp/d-v200-ai-reset-build-20261028.json及/tmp/d-v200-ai-reset-fixed-20261028.png。
- 当前7项2030/2032/2058/2059/2060/2062/2045。原文件及file直开限制、12延期/14缺证、S7/S8/G3未完成保留；原HTTP当前合成AI验收/智能外呼、条件全空/26卡片，无文件层、未保存表单、电话或未决写入，保留handoff。

### 2026-10-28T08:36:44+08:00 仅交接补记：三文件准确绑定与真实答复

- 三项原问题、完整选项、真实用户答复、实际questionItemId与执行边界已补入docs/decisions.md“三项真实问答原文与交接绑定补记”。独立用户消息ID工具上下文未提供，未编造。财务B明确暂缓，不是批准，不再问；2062只确认归属；新分类仅一次精确对象批准且已执行完成。
- 既有/tmp/d-v200-acceptance-inputs-20261028/prepared-inputs.json已逐文件补绑定：AI为SYN-AI-ADMIN/SYN-AI-TENANT、原卡片15/华南店-试驾邀约-中科金、scene-list.showDetail(15)、ai-config:tenant:SYN-AI-TENANT；不是已删SceneRows配置行15，供应商任务ID及同次批次/新行仍未取得。绑定依据本轮既有实际data-id/详情/名单UI及同源renderCard；本补交接的额外只读DOM调用因Chrome不可用未取得新回读，不冒称新UI测试。
- 预外呼为SYN-CLOUD-ADMIN/HQ/cloud:synthetic-call:、TASK-PRED-D58356-27f8ba87/合成预外呼验收1027B、CloudTaskWorkspace.openCustomerImport该ID，原表单lead/字段已实测。供应商任务ID、业务批次/请求/fileId及合法失败回执未形成。建议批次名只是未保存建议。
- IVR文件明确UNBOUND_NOT_AN_IVR_DIRECT_UPLOAD_FILE且usableForCurrentImport=false，不再以模糊taskId=null暗示等待直导；DEMO-CUSTOMER-TASK-1仅是后续分配候选，不是文件接收端。原业务导入分类/模板版本及动态列、合法客户/记录/批次、分配记录均尚未绑定；不能把旧四列文件直接上传新统一模板或不存在的IVR入口。
- 最小人工步骤已写同一清单：在原54823准确演示身份下AI卡片15呼叫名单手动导入合法选AI文件；预外呼精确空任务原导入页选lead/独立批次合法选预外呼文件，保留同次反馈不重放、不启动；IVR先核当前分类模板并形成合法独立客户后再分配，不使用当前未绑定文件直导。代理没有选择/上传这三份文件，CSV字节和SHA均未变化，不算任何新增通过。
- 本次没有新增测试、业务写入、重建或重做任何已闭环项；当前仍106/113核心UI、7开放，S7/S8/G3、file/upload限制及12延期14缺证不变。本补交接阶段无可独立执行的业务动作，余项按真实条件挂起，不维持无事active。

### 2026-10-28T08:41:55+08:00 用户已报告指定预外呼导入，禁止重放；等待实际来源核对

- 本任务收到可信转交：Sentinel_630f487e03308191894f43933df1b4bf，2026-10-28 08:38 +08，用户原文“预外呼已导入”。前置指令明确原54823/SYN-CLOUD-ADMIN/HQ/TASK-PRED-D58356-27f8ba87及预外呼名单-最小合成.csv，不启动呼叫。未提供独立用户消息ID，记未提供；不把报告当供应商或持久化成功证据。
- 没有重做文件选择、上传、检查/确认或重提，也未启动/复制/重建任务。第一次只读原tab绑定返回Browser1不可用；一次原生库存显示当前唯一连接Chrome4仅file原型PAGE2205，无54823标签。未选择/读取该受拒file页，未改数据/刷新现场或用另一origin推断同份结果，不能据库存擅自判定用户究竟在哪个来源导入。
- 已一次询问“请复制刚完成导入的地址栏完整地址”，工具accepted但未返系统questionItemId、待答；无需重新批准Mock，不催问、不让用户重复导入/刷新/清数据。
- 本次预期文件两行13800000883/13800000884、SYN-PRED-1028-A/B仍只是核对用输入，实际批次名/批次ID/供应商fileId/行ID/结果计数均未知不编造；用户实际origin和同批回读前不关闭2058。2060缺合法同次导入失败回执，未生成53或下载。
- prepared-inputs中预外呼状态已改“用户报告完成、来源/回读待核”，代理0次计数不再误写成用户未导入；当前仍106/113核心UI、7开放。准确期待值与未核字段见/tmp/d-v200-human-predictive-import-20261028.json，读取恢复后先核身份/origin/任务/同次批次及行，再核保存/受理/失败/待核，只有无未保存/未决后才返回或刷新验证持久化。

### 2026-10-28T08:48:31+08:00 已确认HTTP地址后的同次预外呼实际回读：0记录，输入来源仍待核

- 用户真实问项[request_user_input_async,call_1e71aea2dadc441bb78b80d54c3e1926,0]提供原54823/PAGE2205地址，地址问题已答，不重复询问。按此URL定位当前Chrome4/tab980688143，只读得到合成云呼叫验收/日产总部，目标handler精确为CloudTaskWorkspace.openTask(TASK-PRED-D58356-27f8ba87)，名称合成预外呼验收1027B，供应商状态初始（模拟），无通话。没有打开/读取既有受拒file页。
- 实际客户记录：保存0、受理0、待确认0、校验未通过0、表0行；技术详情“尚未提交”，没有批次或提交标识。导入异常：导入失败0、待核0、下载记录0、准备下载禁用。既有两条期待号码/编码没有可对应的实际行，实际batch/fileId/rowId均未知，不编造。
- 为排查是否只完成准备，原导入窗口仅打开读取一次：类型/批次名/名单为空、未选择文件、无预览、确认导入禁用；未改输入/选文件/检查/确认，随后取消仅本次新打开空层。未刷新、重登或离开去做持久化，因为不存在可标识同批对象；不把持久空值当本次成功或失效证明。
- 这与用户“预外呼已导入”报告未匹配；当前分类为验证输入/来源记录待核，不直接认定产品缺陷、数据丢失或用户操作错误。已一次询问当时提示原文/填写的批次名（或是否仅检查），工具accepted、未返回问项ID、待答；不再选文件、重导或启动。
- 证据/tmp/d-v200-human-predictive-import-20261028.json、/tmp/d-v200-human-import-http-records-empty-20261028.png、/tmp/d-v200-human-import-http-failures-empty-20261028.png；error[]。原HTTP现停精确任务客户与处理记录，无文件层、未保存输入、未决操作或电话，保留handoff。当前106/113、7开放不变，2060没有合法同次导入失败回执，继续未验，不造53。

### 2026-10-28T08:52:01+08:00 用户入口反馈后的有界定位与正确表单接续

- 用户真实问项[request_user_input_async,call_6502dd9c8bb54ca684f8721238f53f8a,0]答复“点击客户与处理记录没有反应”，未提供独立消息ID。不能继续把早先“已导入”视为已完成提交，也不凭此认定故障。
- 原54823精确任务当前下方客户与处理记录标签已经active，顶部/下方同名按钮均setTaskTab(dcc-records)。本轮只读从运行监控点顶部同名按钮，实际记录区出现，error[]；未复现入口代码无响应，不新增修补或改原交互。该入口是任务标签切换，不是导入弹窗；点击已经选中的标签没有新窗口。
- 截图背景发现复制-同名任务，随后仅返回列表核一次：TASK-PRED-D69789-9a42f417为草稿/0名单，不是同次导入成功。没有点继续创建/删除/导入/起呼，也不推定谁创建该草稿或其意图。原目标D58356仍0。
- 为显示实际入口，从原目标行蓝色“导入客户”打开原手工导入表单，当前类型未选/批次空/未选文件/无预览/确认禁用；没有选择文件、填示例、检查、确认或重复导入。截图/tmp/d-v200-correct-import-form-20261028.png，保持原表单handoff、不刷新。当前实际回执仍缺，2058不通过，106/113和7开放不变。

### 2026-10-28T09:01:39+08:00 当前结果更新：两条实际导入核心后态已核，107/113、6项保留

- 用户最新请求核对同一原任务两条名单；在原54823/SYN-CLOUD-ADMIN/HQ/TASK-PRED-D58356-27f8ba87中实际读取到保存2/本地合成受理2/待核0/校验失败0/导入失败0/通话0。任务供应商状态仍初始（模拟）/手工启动；未起呼。

|真实行|本地记录/原编码|本地批次/模拟fileId|优先级/R|结果|
|---|---|---|---|---|
|演示客户甲 18800001901|DEMO-RECORD-15 / DEMO-MANUAL-L001|DEMO-BATCH-15 / DEMO-FILE-DEMO-BATCH-15|6 / 合成来源甲|本地已保存、合成API002受理、暂无呼叫结果|
|演示客户乙 18800001902|DEMO-RECORD-16 / DEMO-MANUAL-L002|DEMO-BATCH-16 / DEMO-FILE-DEMO-BATCH-16|4 / 空|本地已保存、合成API002受理、暂无呼叫结果|

- 两行导入批次名称同为测试、北京时间2026-10-28 08:54:26；供应商任务800001。提交DEMO-SUBMIT-17→batch15/号码1901/priority6，DEMO-SUBMIT-18→batch16/号码1902/priority4。两条各自原合成同步响应result0、importTotal1/successTotal1/invalid0，receivedAt 2026-10-28T00:54:26.773Z；不合并batch/file、不补真实供应商已收或实际拨打。
- 无表单/未决/待确认/电话时仅刷新一次，重进原稳定ID，两行文本/handler及两条详情全文（含batch/file）均与前相同。代理没有选择文件/上传/检查/确认、重提或启动；当前停原任务两条名单页。证据/tmp/d-v200-predictive-actual-import-verified-20261028.json、/tmp/d-v200-predictive-import-actual-persistence-20261028.json、/tmp/d-v200-predictive-import-two-verified-20261028.png。旧零回读和入口定位/fail保留为历史，不再当当前读数。
- 当前两行并非预备CSV内容；预备CSV文件/字节/SHA不变，实际是否曾选择该文件、随后编辑或用其他原生输入均未核，不能从演示姓名推断。prepared-inputs仅链接独立实际receipt，preparedCsvWasUsed=null。CSV选择/解析/重复与格式等分支未在本轮验证，原文件访问拒绝仍有效，不据核心结果宣称上传通过。
- 依据原ACTION2058单操作边界，只收口本地导入及逐条受理结果保存/回读核心后态，107=38复用+69补齐；其他全AC/生产工程/S8/G3仍未过。6项仍为2030（AI合法导入）、2032（独立名单移除）、2059（正常718执行）、2060（合法失败回执及快照下载）、2062（既有导入后分配IVR链路）、2045（用户暂缓财务样例）。本次失败/快照0，准备下载禁用，不造53、不代过2060。12延期/14工程缺证和file直开自动限制保留。

### 2026-10-28T09:15:19+08:00 单CSV可发现性交付与用户新CSV导入只读补记

- 准确名为预外呼名单-最小合成.csv，不是最小核查；原/tmp源及既有manifest的UTF-8 BOM/258字节/2行/六列及内容、SHA一致，目标父路径无意外软链接后只一次xb原样写入`/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/验收样例/预外呼名单-最小合成.csv`，目标与源同字节、SHA256 4e7342ba646a78fcdfade45ff0674ce9356174f10839d4cf6a3e1bf5eae49859。未复制目录/备份/平行原型/别名，后续未再次复制。
- Finder可选展示仅getApp返回Desktop，未执行文件定位键鼠或open-R，没有可得具体待审批动作ID；因此只能报告已交付文件，不能报告Finder已定位。用户后来报告已手工CSV，停止可选展示，不要求再选文件或绕浏览器file访问。
- 新用户报告来源Sentinel_cd5c83f3362c819180212eba8dcb8c20，09:09 +08，原文已经手动导入 csv。现有原连接可靠观察54823/SYN-CLOUD-ADMIN/HQ/精确D58356，新record19/20 callback与任务ID一致；无需再让用户提供地址才能报告本页事实，不推定其他origin数据。
- 实际新两条09:09:35为13800000883/SYN-PRED-1028-A/priority1、13800000884/SYN-PRED-1028-B/priority2，姓名、备注“仅本地验收，不启动”、R SYN-1028均与交付文件逐列一致；本地记录19/20各自batch19/20、模拟file19/20，supplierTask800001，原合成API002响应各result0、importTotal1/successTotal1/invalid0，01:09:35.223Z。两条均本地保存/模拟受理、无待核原因/呼叫结果；并非真实供应商生产证据。
- 当前总保存4/模拟受理4，旧record15/16两条保留，最新操作反馈保存2/校验失败0；导入失败0/待核0/快照0/通话0，不造53或下载。两期均名测试但批次/时间独立，不把08:54旧两条当09:09CSV新批；旧批刷新已验不代替新批持久化。
- 本轮仅同页只读详情和失败状态，未刷新、改身份、跨origin导航、清场/重提/选文件/检查确认/启动；新批持久化按最新指令未重新加载核验。没有进行其他验收或改变107/113、6开放的核心计数。证据/tmp/d-v200-single-csv-delivery-20261028.json、/tmp/d-v200-predictive-csv-import-readback-20261028.json、row19/20文本及csv-new-two截图。文件交付和Finder状态分开，财务继续暂缓，原已闭环项不重做。

### 2026-10-28T10:06:52+08:00 新三项导入缺陷修复结果（独立于旧113动作计数）

|本次缺陷|实施与已验证范围|仍需明确的边界|
|---|---|---|
|IMPORT-FIX-20261028-EXCEL|真实.xlsx ZIP/XML解析，CSV/BOM/引号多行兼容；共享文本/日期/前导零、错误行列与负例已离线验证，经典脚本本地内联。|旧.xls不支持，明确另存.xlsx/CSV；未重试代理自动选文件或file访问，真实UI选.xlsx检查仍待一次人工操作。|
|IMPORT-FIX-20261028-TEMPLATE|弹窗“下载Excel模板/下载CSV模板”，同当前schema，缺分类提示、无名称可生成。新线索12列/售后13列；空模板+字段说明已生成落盘，openpyxl独立读取。|浏览器下载事件超时，原生Chrome全局下载条目显示同名3.2KB完成；真实自动保存路径未取得，不将另交付文件冒作浏览器保存回执。|
|IMPORT-FIX-20261028-NAME|批次名必填1—50字；空/空白明确原因，固定底栏可见，非静默disabled。有效名称但无文件显示下一缺项；输入/分类/文件变更失效原检查，类型/版本/权限守卫保留。|名称+真实Excel选择后可检查已在当前生成控制器独立fixture验证；实际GUI该组合需人工选择一次，不能以JS注入file或直接store绕过。|

- 31组定向检查（18+7+6）通过；不存在代理实际导入/检查确认、旧数据清空或呼叫。当前四条数量在加载前后保持4、完成/接通0；当前原HTTP仍合成云呼叫验收/HQ/原D58356表单，新线索已选、批次空/文件未选/无预览/确认禁用。保护性加载不作为旧用户批次新增验收通过，原15删除等不重做。
- 本次代码文件：scripts/import_build.py、build-modules.py，js/components/import-workbook.js，两份import-enhancements适配器，vendor原依赖/许可证/README及派生Cloud包/index/provenance；没有修改参考/冻结或运行服务器依赖。两次构建一致、原提交/上下文/行复核方法字节相同，源码和静态闭包/离线兼容证据见build-results.json；file://实际自动验证仍未做。
- 交付位置：2.0.0/验收样例/预外呼导入模板_新线索.xlsx、预外呼导入模板_售后类.xlsx、Excel导入校验样例_两行.xlsx；记录字节/哈希/sheets/列在/tmp/d-v200-import-fix-tests-20261028/delivered-artifacts.json。原预外呼名单-最小合成.csv保留不覆盖、不要求再导入。
- 最小人工回归仅一次：在当前原HTTP任务的空导入表单，填独立批次名“独立Excel解析检查1028（仅检查）”，选择验收样例/Excel导入校验样例_两行.xlsx，点击“检查名单”，应可导入2条。停在检查结果，**不要点击确认导入或启动呼叫**，避免增加当前4条；这是独立新fixture，不是重导旧CSV。随后改名称/分类应使确认失效。工具不代理选择或注入此文件，也不把离线fixture当实际UI上传证据。
- 当前旧核心计数仍107/113、6项开放；新3缺陷单列实现/有界回归，不挤旧计数、不宣布全局完成。当前图/tmp/d-v200-import-fix-final-current-20261028.png；模型results/extra/customer-results、build-results、ui-results均同一/tmp测试目录，旧失败/输入来源历史保留。

## 2026-10-28 2062原UI证据补记后的当前口径

核心动作108/113（38复用＋70新增核心后态），仍开放5项：2030人工合法AI上传；2032合法新行产生及具体移除批准；2059正常718真实执行证据；2060同次真实导入失败回执及快照；2045用户明确暂缓财务样例。2062仅legacy已导入客户→原IVR任务单次分配闭环，详见本文件对应ACTION行及/tmp/d-v200-ivr-assignment-20261028.json。新模板IVR路由、呼叫执行、全AC与G3不因此通过。

AI下一步：使用SYN-AI-ADMIN／合成AI验收租户，智能外呼原卡片15“华南店-试驾邀约-中科金”→查看→呼叫名单→手动导入，选2.0.0/验收样例/AI名单-最小合成.csv，原“开始上传”一次；不启动。文件150字节、手机号首列、2条13800000881/882；未代理选文件。当前浏览器停在用户要求的预外呼名单页，未为交接强制切换。

## 2026-10-28 AI人工导入报告后的原HTTP只读核验

收到已导入反馈后，以合成AI验收／合成AI验收租户登录原54823，PAGE-2103卡片15“华南店-试驾邀约-中科金”：呼叫名单0，原手动导入→导入记录显示暂无导入记录。概览演示统计不作为本次导入证据。未选择文件、上传、刷新、删除或起呼。待定位用户实际操作页面完整地址及任务；不得推断未操作或补导。ACTION2030/2032仍开放，当前108/113不变。证据/tmp/d-v200-ai-user-import-readback-20261028.txt。

## 2026-10-28 剩余4项：2032修复、B提案授权、浏览器未决现场

- 当前核心109/113不变。2032：原函数按脱敏phone全匹配移除的缺陷已在本方build-modules.py/ai-assignment-identity.js/ai-config-store.js修复。旧行在加载时一次确定独立tenant/task/position身份，后续保持稳定；移除保留tombstone不压缩数组及原导入历史，不从脱敏值还原号码。新导入有UUID行ID和真实本地importBatchId。严格租户/账号/任务/页面/权限/配置版本核验，取消无写入，同键多个仅目标一行，旧phone参数失败关闭，重复不提交。原参考只读。测试/tmp/d-ai-identity-test-results.json，9项通过；实际修复版UI显示AIROW-SYN-AI-TENANT-13-0及13-1，两原行完整保留。未声称实际删除通过。
- 用户call_4fba20cd26bc4fbcba59be69ccc04cd7[0]明确批准仅13-0（138****8000）一次移除。单次点击后出现confirm；只执行一次accept，工具返回焦点通信超时，后续只读也失败，最终原生切换标签超时重置工具。**本次提交结果未知**，不得再点移除/重复accept/刷新/新建副本来绕过，先恢复连接只读回读目标及13-1。当前已停止浏览器重试。请求恢复连接已发出，未获回复；不将已授权等同已完成。
- 同一用户[1]已明确撤销财务暂缓并批准原B提案。mock/data.js只追加SYN-FIN-ADMIN-1028平台范围synthetic-finance-1028、PAGE-2112及两个独立合成租户，AI ID9900000000000001028/1029；只有service.view/trial/annual/history，无总部、手调、话费包、导出授权。ai.js只为此身份实例化两个未开通/零分钟原模型。离线5项授权/初始态/无总部变化/幂等初始化检查通过，/tmp/d-finance-fixture-test-results.json。尚未在浏览器加载这个最后财务版，**模拟交易0次**，试用/年包实际UI仍待验；批准不用再问。
- 最终AI/Cloud/provenance两次构建一致，190原参考SHA不变；四条预外呼不操作、七类三菜单/全屏保留。S7继续，S8/G3不推进，12延期/14工程缺证不变。无备份包/平行原型/真实请求。
- 2060定性修订：原有本地流程存在，不应把全部本地验收都说成必须供应商生产回执。原DccRuntime.prepareFailureDemo只经原importManual/simulateDccImport形成四条合成记录和准确fileId；simulateFailure53经原receiveImportFailure53处理原场景分片；createFailureSnapshot/downloadFailureSnapshot办理快照。接续应在**新的独立合成任务**走这条原UI，明确合成且不启动，不碰D58356四条；不能用前端校验错误或AI导入0失败冒充53。当前未新建该任务、未生成53/快照或下载，不添加输入文件或绕过上传拒绝。若核真实供应商闭环，仍需同一次原请求/响应/fileId/失败原始条目/分片关联，二者分别说明。
- 2059：原v10 task/create重呼字段已在既有接口核验确认，但本轮没有新的执行记录，不重造调度器。最小研发交接：实际部署API/build、任务type、识别能力开通状态、同租户enterprise/task/file/号码对应关系、retry/timeType/次数配置、首次718及后续attemptId/时间原始证据；区分原始718与聚合-700，重复/晚到话单不是新增尝试。文档和本地模型不能作为实际供应商自动重呼已验。

## 2026-10-28T10:57:42.347372+08:00 S7 step-07：剩余4项实际收尾（当前112/113）

- ACTION-2032：用户call_4fba20cd26bc4fbcba59be69ccc04cd7[0]批准的AIROW-SYN-AI-TENANT-13-0单次移除实际成功；连接恢复只读确认剩139****9000，原HP-BATCH-20261028-1005成功2历史保留。新财务版刷新后仍1行。/tmp/d-ai-remove-{after,history,persisted}-20261028.txt；缺陷隔离9测试通过。未再提交移除。

- ACTION-2045：同用户[1]批准独立B提案。SYN-FIN-ADMIN-1028仅2租户，试用9900000000000001028：0元30天500分钟，RC20260907-1793155829306-3；年包9900000000000001029：5000元365天10000分钟，RC20260907-1793155856213-6。均原UI各1次、有效、已生效；重新登录保留。按原演示时钟2026-09-07 10:20，非真实资金。/tmp/d-fin-{trial-after,annual-after,persisted}-20261028.txt

- ACTION-2060：独立TASK-PRED-D77747-d34642ef 合成导入异常验收1028，手工启动/通话0。原UI prepare4合成记录→原2/3分片B→DEMO-EXPORT-33快照1→原1/3分片A。首轮CSV实际写入但BOM文本回读误报失败，明细2保留；修成字节校验后同一快照重试保存/关闭/回读成功，仅B清理，A保留。落盘/tmp/DEMO-EXPORT-33-verified.csv，236字节，SHA256 f13e61c4b89d9e6ca2f9f1d66251177848a6663f0f760469170033ffd50274f7；1数据行18800001602、DEMO-BATCH-24、供应商任务800006。本地原逻辑合成53，不是生产供应商回执。/tmp/d-failure-byte-verified-after-20261028.txt

- 2032修复产物：js/adapters/ai-assignment-identity.js、ai-config-store.js及原build-modules生成链；旧行身份保留、按行tombstone、租户任务权限/版本复查和新导入批次关联。9项隔离检查及实际刷新持久化通过。先前浏览器未知结果现已由原页面确认成功，未重复点击或确认；原失败记录保留。
- 2045新增映射只对已批准独立账号/两租户；首次错误沿用finance导出专用角色导致空白，已将**仅此新样例**设为finance-service，原财务导出角色不变。5项离线边界检查与两次真实本地UI办理/重登录回读通过；未执行手调/话费包/真实付款。
- 2060实际缺陷：原File.text()剥离UTF8 BOM而与带BOM字符串比较，导致236字节文件正确落盘却误报失败。仅在本方构建转换为TextEncoder期望字节与arrayBuffer逐字节校验；等长篡改/截断/尾随字节均拒绝，保原可信完成及快照成员版本清理守卫。第一轮失败有原文件证据保留，复验同快照另存/tmp/DEMO-EXPORT-33-verified.csv且核SHA/1行内容，后到A不清理。未走模拟成功按钮，未直接写存储或伪造供应商回执。新任务及4条合成异常记录与原D58356四条严格分开，不起呼。
- 最终生成AI/Cloud JS语法通过，2次构建/190原参考SHA一致。读回原D58356四条仍受理/通话0；本轮不改新讨论的模板分类/条件/并行能力，不改冻结/参考或G3，不做原型备份包。
- 当前112/113（38复用+74核心新UI）；只剩ACTION-2059正常718实际重呼证据。原重呼契约文档已有，不再要求上传名单或新增本地供应商调度器；需部署版本/type/识别开关及同task/file/phone首次718和后续attemptId/时间、retry/timeType/次数原始执行记录，区分718与聚合-700及晚到重复话单。没有这份执行材料不能把本地模拟或文档改记为通过。S7、S8/G3及12延期14工程缺证不推进。

## 2026-10-28 模板条件接入的工程证据边界

- 实际AI结果当前主要为tags/aiTagName/intention展示文本，缺少统一稳定标签ID、识别完成/明确无标签状态及映射版本的执行回执。原型只接受精确上下文的显式本地Mock证据；真实适配须研发补同tenant/round/nodeRun/segment的原始code/label、稳定标签及完成/重试完成证据。未知不落ELSE。
- 云status、sipCauseType、sipCauseRaw是不同接口字段。当前只使用有依据的三个status域；不擅将SIP/客户失败原因转成接通状态。未知部署或供应商域待核，文档不当执行通过。
- 非lead分类原GENERAL不能跨租户TRANSFER；本轮未擅自扩成冷线索/其他分类跨租户能力。
- 本轮未执行file直开自动验收或自动上传，旧拒绝不重试。原ACTION-2059的真实718重呼材料仍待研发，不受本轮模板模型/页面验证替代。

## 2026-10-28T12:54:46.095471+08:00 独立审计最终边界（取代本轮“收口中”状态）

- 本次16项可复现实现问题已修复并完成相关回归，完整覆盖、原113动作与134 AC逐项矩阵统一在 [独立审计报告](independent-audit-20261028.md)。这是自主范围完成，不是全AC/生产/S8/G3通过；原112/113核心证据计数不变。
- **ACTION-2059仍待研发证据**：同部署API/build/type/识别开关、同tenant/enterprise/task/file/phone的retry/timeType/次数，首次原始718及后续attemptId与时间；文档和LOCAL_MOCK不能解除。未再导入、重呼或造本地调度器。
- **真实供应商终态、稳定标签及解除仍待核**：原segment、rawDomain/code/label、最终处理和全部重试结束、实际标签ID及supplier/tenant/type/scene/category/brand/版本，以及精确限制来源解除回执。坐席接听不代客户接通，停同步不代解除。
- **file直开及GUI选.xlsx/CSV仍待人工**：已有工具拒绝未重试/绕过。仅双击本项目index核登录/AI/云/图页；文件检查在独立测试范围停在检查结果，不确认导入、不清理旧批次。HTTP导航和离线真实字节解析已验，但不改写file通过状态。
- **正式需求导入/G3未完成**：本次只读执行 import_analysis.py verify 返回“项目没有已验证的需求分析基线”；原config为mode=none、status=not-imported、formalG3Approved=false。190参考/90锁定哈希未变，未伪造正式冻结或导入。
- **并发边界**：实际双窗口旧版本保存拒绝且草稿保留；localStorage不等于服务端并发原子提交。原12延期/14工程缺证保留。资源、通话及财务生产契约不由本次VM或Mock代验。
- 原自动文件动作既有拒绝本次没有新尝试；连接中断时未知命令先核落盘，查明其品牌3项已执行、配置页业务准备被正确拒绝，不重放原用户记录。模板测试14项完成后自有Node尾进程已精确关闭，原浏览器不触碰。


## 2026-10-28 全面审计八项定向关闭

CA-01—CA-08均已修复并完成相应当前源/最终生成包核验，详细对应见memory/comprehensive-audit-20261028.md最新修复回执。旧审计反例保留为修复前事实，不再代表当前实现缺陷。

仍开放的是完整224项AC的逐项结项及未更新实现摘要的原步骤证据，以及file直开/GUI文件选择、ACTION-2059真实重呼、12延期14工程缺证和G3。它们不能因本次专项测试通过而自动关闭。CA-07修复后门禁应只报告这些真实未完成/新鲜度事项，不应再报告记录串条、Failed空数组或缓存导航路径误判。


## 2026-10-28 S8准备核验最新状态

直接file路径已取得用户人工通过证据；此前“file仍未验”仅是历史状态。七步骤中step01/04/06/08/09本地条款通过，step05/11核心模型通过但最终画布/路由UI按用户“仍在修改，先完成不受影响项”明确暂缓。224行已逐项标189本地Pass/35Partial，详情与证据在s8-verification-20261028.md/json。

当前S8未通过：35条Partial（19画布相关、11外部事实、5后台/历史桥接）保留；整包稳定后还需各步骤新鲜摘要及正式全局核验。G3/12延期14工程问题未提升。导航高亮及6处SVG边缘裁切已修复并复验。并行画布源码不由本任务覆盖。


## 2026-10-28 拖拽补审待修复项

画布已稳定且用户要求恢复补审，旧“修改中”暂停不再作为当前原因。新增DRAG-01/02/03三项P2，证据和最小修复建议见memory/drag-audit-20261028.md。DRAG-03仅损坏输入反例，不是用户现有数据损坏/丢失结论。总表204本地Pass、20Partial，原外部事实/后台证据未关闭；S8未通过。


## 2026-10-28 拖拽三项修复关闭

DRAG-01/02/03已按用户要求完成修复和当前正式包复验，旧审计反例保留为历史证据。R007/084/196/199已本地Pass；当前208本地Pass/16Partial。仅既有外部事实、正常718真实重呼、远端限制与后台/历史桥接证据仍开放；S8未通过，不以此次修复作生产或G3批准。修复回执与精确代码指纹见drag-audit-20261028-fixes.json。

## 2026-10-28T17:10:47.590581+08:00 S7 step-01/02：超管报表、品牌和租户切换修复（SUPER-SCOPE-20261028）

- 来源：用户直接提出“超管丢失报表权限、顶部切租户；新增品牌应有切品牌能力”。本轮原位修复，不改冻结资料或生成新的原型/备份，不处理此前仅讨论的模板条件/并行功能。
- 根因：原super仅platform范围、无租户成员，scope列表无可切租户；super.pages未含4报表，顶栏仅scope按钮，品牌仅局部页内选择。修复mock/data.js显式superReportPages/superTenantViews，organization原固定内置pages承接当前四报表；不保存伪租户成员、不扩大普通账号权限或财务办理授权。
- session-store.js按当前平台已有brandIds/tenantIds生成品牌管理视图与租户报表视图：新品牌由原saveBrand写入当前授权后自动可选，空品牌允许管理但无租户；模块未开通不显示对应报表。普通账号只从真实已有成员派生有权品牌。首次超管进平台，后续恢复上次合法范围/页/筛选，停用/撤权范围不恢复。品牌/租户视图各有独立scope标识和位置，不混用上个租户筛选。
- app.js新增顶栏当前品牌，复用原范围对话框、取消、未保存内容/电话离开检查；选择品牌后租户列表只列该品牌，有“当前品牌·全部租户”及平台管理返回入口。品牌范围顶部租户显示“全部租户”，避免品牌名重复冒充租户。
- module-host.js平台/品牌报表先列有权且开通对应模块的租户，不拿未归属的通用统计冒充跨租户汇总；点击后复用各原报表。cloud.js仅将当前超管租户报表视图投影为原当前租户读取身份，非持久成员，原数据范围按tenant/enterprise过滤且native业务变更Action仍禁止。返回平台保留管理功能，报表视图不自动授予呼叫/任务/充值权限。
- 8组隔离模型测试通过：super四报表/显式租户；品牌过滤；模块开通/非业务授权；独立位置和恢复；原组织saveBrand新建后即出现且空租户；普通账号越界拒绝；停用租户无法恢复。仅隔离VM，不在用户原数据新增品牌或成员。证据/tmp/d-super-scope-tests-results.json。
- 实际浏览器：原56348页面由另一验收会话占用，未夺取或刷新原页，使用同一现有服务独立验收标签980688186；走已有本地手机号登录（未处理图形验证码），实际超管选择日产→总部，四报表均可开，计费只见已核归属总部行；切奕派只列其总部且仅云报表；回日产→上海报表，原云报表读取门店数据。可回当前品牌全部租户及平台，最终停品牌报表选择页。未创建/修改业务数据、未起呼/充值/删除/上传。当前HTTP检查不代替file://自动验收，原file访问限制保留。
- 顶栏1920桌面无水平溢出（client/scroll均1920），截图已视觉核查，当前console error为空；源资源闭包和生成JS语法通过，两次生成相同，190原参考/90锁定分析SHA不变。截图/tmp/d-super-reports-tenant-20261028.png及/tmp/d-super-brand-report-entry-20261028.png，DOM证据同名txt。仍S7，不推进G3/生产或旧113动作总验收。


## 2026-10-28 · 账号/租户/品牌专项回执

原字段丢失、公共角色/模块角色混用、已有账号关联缺口、保存后对象不可见及租户停用后失去管理入口已在当前源修复并专项验证；同品牌跨租户关联保持原账号身份，空模块公共管理员实际重新登录可管理。原正式外部/工程缺证及G3边界保持。头像选择控件已恢复，但CUA实际选文件被Chrome扩展“Allow access to file URLs”权限拒绝，未启用权限或规避；实际头像选择仍待人工检查。file直开不作为本轮自动通过。详见organization-repair-20261028.json。

## 2026-10-28T17:43:24.383739+08:00 · SUPER-CONTEXT-CORRECTION-20261028：撤回新增模式，复用1.2直切租户逻辑

- 用户纠偏原文：“1.2是直接切换租户就变更。现在加了品牌和AI融进来，底层逻辑并没有变化，只是切换的维度多一层”。本记录替代上一轮SUPER-SCOPE-20261028中“超管租户报表视图/进入范围”的方案，历史记录与截图保留但不再当当前行为。
- 业务处理：账号身份及既有权限独立于数据选择。顶栏品牌只筛选其有权租户，租户下拉直接切换同一个系统的当前租户；AI/云呼叫使用同一个选择，保留仍合法的当前页并刷新目标租户数据/独立筛选。品牌切换进入该品牌上次合法租户（无记录取首个），新品牌无租户只显示“暂无租户”，不编造数据。取消报表专属角色、临时OPERATOR成员投影、管理范围对话框、报告页的第二次租户选择与“进入”步骤。
- 实现：session-store区分原平台授权来源与当前业务租户，不改持久成员/账号权限；super保原super角色与nativeProfile，原账号/品牌/租户/模块及公共禁呼维护权限仍按既有授权执行。AI native auth保super_admin但currentTenantId随选择改变；Cloud native保1.2原TENANT-SUPER-BUILTIN/super身份，仅切enterprise及实际数据租户。旧brand:/platform位置在读取时解释为合法业务租户；未清空或迁移业务存储。普通成员、财务/资源专用身份不提升权限，财务仍保原HQ明确授权及当前对象校验；原业务监管只读规则不改。
- app.js两个普通select复用1.2交互，不新增模式；上下文切换仍走原leave/未保存/电话保护，选择显示在检查结束前回原值。仅切数据时保原导航和超管身份。已检查新空品牌、多个空品牌、存量未关联品牌租户、停用/撤权、独立租户筛选与刷新恢复，不增加未确认模板if/else或并行能力。
- 修改文件：mock/data.js；js/components/session-store.js、module-host.js、organization-store.js、contact-policy.js、login-screen.js；js/app.js；js/adapters/ai.js、ai-finance.js、cloud.js；assets/css/cloud-ui-overrides.css及现有构建产物。execution-steps step01对应清单已记录，不改工具包/冻结/1.2参考。
- 19组隔离模型检查通过（/tmp/d-direct-context-tests.js及/tmp/d-direct-context-test-results.json），包括原组织saveBrand后的空状态、新旧位置、品牌内租户记忆、角色权限不变、Native两侧身份及数据ID、普通用户越界/停用拒绝、财务与公共禁呼权限、未关联品牌存量。所有模型写入均为隔离VM，不向用户实际数据新增品牌/成员/权限或事务。
- 实际浏览器仍用已有本轮56348回归标签980688186，未接管用户其它标签。总部AI计费统计实际105分钟；直接切上海后停在同一PAGE2106、原四顶层菜单及超管身份保留，显示暂无已核归属记录（不混入总部行）。云报表上海显示上海批次/坐席、5次呼叫，切总部回8次；换奕派直接进其总部且无AI报表，品牌管理保超管新建/编辑入口；打开编辑后未修改即取消，无保存业务资料。换回日产恢复该品牌租户。最终刷新恢复日产总部/云报表及原菜单，原模式/报表二次选租户页已不存在。未拨号、导入、删除、充值或修改真实权限。
- 当前截图/tmp/d-direct-context-final-20261028.png已视觉核对；DOM /tmp/d-direct-context-final-ui-20261028.txt；浏览器error日志空；桌面顶栏clientWidth=scrollWidth=1920无溢出。生成AI/Cloud脚本语法、重复构建一致、190参考与90锁定分析SHA核验通过。只确认本轮纠偏，HTTP不替代未验file运行，不推进S8/G3，不重计旧113动作或消除外部718执行缺证。

## 2026-10-28T18:21:21.250240+08:00 · GLOBAL-ADMIN-MANAGEMENT-20261028：平台管理不随业务租户隔离

- 用户明确：超级管理员的“组织与权限”和“接入管理”不应按租户隔离，应看到全部租户和账号。此项修正上一轮把组织资料跟随品牌缩小的实现；品牌/租户继续直接控制业务和报表，不增加管理模式，不改角色、原成员关系、冻结或1.2参考。
- session-store读取原平台授权，组织与权限/接入管理筛选按账号+平台授权单独记忆；顶部切换不把管理页重新定位到当前业务租户。页面位置正确恢复，报表原租户级筛选不共享。app上下文重建记住实际当前页，避免刷新跳页。
- organization-store全局读取全部品牌、租户（含停用/未关联）和账号（含平台身份/无成员），跨多个租户的账号仅列一次。普通管理员仍局限本租户，资源/财务/隔离超管不升级。修改操作仍核原action权限、明确目标和引用/内置保护，未自动新建成员或给普通账号扩大权限。
- 复用现有左侧租户卡片与账号表，补“全部账号”默认入口和重置；租户卡片仅为本页显式筛选。详情列各成员关系，成员权限按钮携带明确租户ID，资料编辑基于全局账号权限不伪造成员。开户仍先明确加入哪个租户。新增品牌留全局列表，不擅自改业务选择。删除守卫不放宽。
- 应用接入沿用原DccRuntime.listApplications和超管原守卫的全局台账，未按当前enterprise/tenant复制或过滤，增加范围说明。组织行的AI服务仍用原独立财务授权及明确目标，不受当前业务选择误挡、不新增其他财务授权或交易。
- 实际浏览器：保留原租户管理员标签186等现场，独立回归标签194登录本地超管。账号16唯一行、租户8条；切奕派/日产、总部/上海后两集合不变。已有显式成员筛选可用“全部账号”清除，刷新仍16条。李明仅1行、详情2成员；顶部上海时打开总部成员表单明确显示总部，无修改即取消。全局应用2条在换品牌/租户后完全相同；未揭示密钥、创建应用或提交任何账号/租户/成员操作，未删除/停用/充值/导入/起呼。
- 12组新增隔离测试通过（/tmp/d-global-management-test-results.json）；19组原上下文回归通过，原“品牌资料限当前品牌”和“财务查看取业务选择”断言按本轮澄清更新，其他不变。隔离资料更新测试只在VM内，无真实浏览器业务写入。
- 当前语法、重复构建一致、190参考/90锁定SHA通过；浏览器error日志空。最终截图/tmp/d-global-management-final-20261028.png已视觉核验；DOM /tmp/d-global-management-final-ui-20261028.txt、应用DOM /tmp/d-global-apps-ui-20261028.txt。仍S7局部修复，HTTP不代替未验file，不推进G3/生产或重计旧113动作；718外部执行缺证保留。

## 2026-10-28T18:38:20.715585+08:00 · PERMISSION-DOC-UPDATE-20261028：更新既有权限说明

用户请求“帮我更新一下权限说明文档”。仅维护现有docs/interaction.html、docs/role-permissions.md、功能说明.md及README.md入口摘要，未修改业务代码、角色/授权、冻结材料或原型结构；未新建说明文档目录/权限模式。

- HTML阅读页增加数据范围与切换表，明确超管组织与权限（账号/租户/品牌）和接入应用全局读取、不受顶部选择过滤；业务/客户/呼叫/报表继续使用当前租户与原对象职责。账号只列一次、包含无成员账号，成员权限/启停明确到目标租户；普通租户管理员不取得全局权限。财务/资源仍各自独立授权。
- 超管角色行补齐4报表入口与模块开通限制，修正内置账号保护、坐席关联、平台身份及全局资料与业务监管混写。Markdown同步范围表、来源S1/S4/S9/S10/S12及本次验证范围。历史193项审计标成历史证据，不宣称本轮全量重验。其余9个初始身份和6种模块角色说明保留。
- PERMISSION-DOC-DIFF-2223-20261028：菜单核对发现旧文档写超管可见“云外呼配置”，当前父会话allowed()在有平台授权来源时要求直接列入pages，2223未在超管pages内；旧分类2006关联访问分支未生效。当前菜单说明按可见事实列示，并在HTML限制行/Markdown差异节明确这是待复核的实现差异，不代表产品确认取消权限。本次不修授权或更改确认规则，留待后续实现修复核验，不将此差异假报通过。
- 文档核验：HTML标签平衡、10角色区块、13目录锚点唯一、16本地链接/资源有效，Markdown来源表连续。10初始身份的文档菜单与当前父会话菜单集合比对均匹配（不替代原生路由或按钮实测）；初始发现记录/tmp/d-permission-doc-menu-check-20261028.json和最终/tmp/d-permission-doc-menu-verified-20261028.json分别保留。验证/tmp/d-permission-doc-validation-20261028.json，文档SHA/tmp/d-permission-doc-artifacts-20261028.json。
- 只读实际HTTP阅读页scope-rules渲染已核验，容器clientWidth=scrollWidth=1180，无横向溢出，browser error为空；截图/tmp/d-permission-doc-preview-20261028.png已视觉查看。没有登录业务系统、变更账号、授权或业务提交。Codex阅读面板打开请求返回queued，不将其当作已打开证明；Chrome仅用于文档只读核验。90锁定分析SHA不变。S7/正式分析G3/生产缺证不推进，旧113动作计数不重算。


## 2026-10-29 · AI充值入口专项已修复

PAGE-2112不再隐藏，超管从系统管理“AI充值管理”或租户行“AI充值”进入原表单。用户明确纠偏按原超管能力恢复，对已存在精确AI账户映射的HQ/SH生效；旧仅HQ本地演示限制属历史，不再据此隐藏SH入口。无映射资料仍待真实关联，不借用别家账户。普通admin/仅export财务无菜单且直达拒绝。22组隔离检查及浏览器入口/原表单核对通过，未提交浏览器交易；原外部/工程/file和G3未验边界保持，见ai-recharge-restoration-20261029.json。


## 2026-10-29 · PRODUCTION-ROLE-CORRECTION：六种生产角色，停止验证

用户明确纠偏：生产只有超级管理员、租户总部管理员、租户总部运营、租户门店管理员、租户门店运营、坐席。此前把演示身份、验收账号和模块权限档位列作生产角色的口径撤回，相关检查不能作为生产权限基线。

- 仅重写现有 docs/interaction.html、docs/role-permissions.md、功能说明.md 及 README.md 中的当前说明；三张矩阵分别列菜单、功能、数据，均固定上述六种角色，不保留旧16列选择器或验收身份附录。
- AI、云呼叫为业务模块；财务、资源管理为功能授权，不另设生产角色。未知的生产功能归属、敏感数据及运营/坐席读取细项标待确认，不由测试账号或原型默认授权推定。
- 已确认的超管组织与权限/接入管理全局范围、业务租户切换、总部与门店各自租户范围及公共禁呼等规则继续保留；不借本次说明修改业务代码、账号、成员或授权。
- 按用户要求停止验证：本次六角色文档未执行浏览器排版复核、测试或验收，不记录通过、不推进阶段。此前旧角色文档的浏览器截图和校验结果不作为本版六角色文档的证据。


## 2026-10-29 · AI-RECHARGE-PERMISSION-CONFIRMED：五种非超管角色无此权限

用户通过截图红框明确确认：AI充值管理对租户总部管理员、租户总部运营、租户门店管理员、租户门店运营、坐席均为“无此权限”。此前待确认口径撤回，不保留可另行授权。超级管理员按原有规则办理。

- 同步既有菜单矩阵PAGE-2112、功能矩阵F53/F54/F55、数据矩阵D24及N6说明、功能说明入口；三张矩阵与内嵌数据使用同一结论。
- 确认范围为AI充值管理及其服务账户/充值流水、套餐办理、手工调账；独立计费统计和服务汇总导出未因该红框确认扩大或收回权限。
- 仅更新现有文档和记录，未改业务代码或账号授权。按用户要求继续停止验证；未运行测试、浏览器检查或阶段推进。


## 2026-10-29 · SEAT-AS-CAPABILITY：五种角色与可选电话坐席能力

用户纠偏：“坐席不应该是一个权限角色，而是一个被租户管理员和运营关联的能力”。该确认替代此前六角色说明，不继承独立坐席角色的默认权限。

- 现有HTML/Markdown的菜单、功能、数据三个矩阵仅保留超级管理员、租户总部管理员、租户总部运营、租户门店管理员、租户门店运营五列；删除坐席角色列、角色职责附录及内嵌数据中的seat角色。
- 管理员/运营账号按当前租户可选关联电话坐席，角色和业务数据范围不变；电话作业仍须有效账号/成员、云呼叫开通、电话作业授权、本人坐席、资源和状态。未关联不影响原有非电话管理/运营功能。
- 使用本人坐席与维护他人的关联配置分别表达，未把旧坐席列合并为运营全量权限。客户/报表/敏感数据/导出不因关联放宽；流转仍按管理员/运营职责及节点条件，不再留“独立坐席流转职责待确认”。
- AI充值管理维持仅超级管理员原授权，其余四种角色明确无权限；关联坐席不改变该结论。同步原README和功能说明入口，不新建原型或平行说明。
- 只修改文档及本记录，未改业务代码、账号、成员或实际坐席绑定。按用户要求继续暂停测试与浏览器验证，不记录通过，不推进Loop状态或G3。


## 2026-10-29 · TENANT-PERMISSIONS-CONFIRMED：AI黑名单、标签、场景、呼入及管理员统计

用户直接确认：租户运营黑名单权限遵从原AI外呼；运营无AI标签配置能力、有智能业务场景权限；运营呼入权限按坐席关联判定；租户管理员有通话数据异常和智能计费统计权限。适用于总部/门店对应角色，数据均限各自租户。

- 同步现有三张权限矩阵及内嵌数据。运营AI黑名单查看与原有维护/批量/同步操作沿原AI功能、对象及同步条件，不再标为待确认；原AI规则来源为只读参考docs/功能说明文档.md第263–292及705–717行。公共禁呼解除仍为管理员，不因AI名单授权开放。
- 运营AI标签配置/供应商标签映射维护明确无权限，智能业务场景明确有权限；拆分原混合AI场景/标签数据行，避免场景使用权限授予标签配置。业务中使用已有标签和查看结果继续按原有权范围。
- 运营呼入接听以本租户有效本人坐席关联为准，保留原资源/在线/电话状态条件；呼入规则配置不随之开放。仅表达已确认电话能力，不新增产品入口或配置功能。
- 管理员补齐本租户通话异常和智能计费统计的菜单、功能、数据说明。新增说明行仅拆清现有功能，不新增业务能力；计费统计不授充值、套餐办理或调账，导出仍独立控制。
- 仅改现有HTML/Markdown、功能说明/README及本记录；未改原型业务代码、账号授权、供应商或原参考。继续暂停测试及浏览器验证，不记录通过、不推进阶段。文档确认不能当作代码已生效。


## 2026-10-29 · RECORDING-NUMBER-EXPORT-CONFIRMED：截图中的待确认改为有权限

用户截图明确确认功能矩阵F30/F31/F32中展示的待确认均为有权限：F30总部/门店运营的有权云呼叫报表导出，F31五种角色读取/播放通话录音，F32五种角色读取号码明文。

- 仅转换该截图范围的12个待确认功能单元格：F30两项，F31五项，F32五项。F30原有超级管理员和管理员条件授权保留，不做全表替换。
- 同步数据矩阵D15/D16五角色的有权号码明文及录音范围，撤回这两项的泛化待确认描述；角色原租户、客户和通话对象范围不扩大，运营原本人/团队/全租户等未确认细分不由本次能力确认推导。
- 同步N8、当前确认摘要、功能说明及README。未开放其他类型的导出，不改AI充值、标签配置、公共禁呼解除或呼入规则等既有边界。
- 只改现有文档与本记录，未改代码、账号授权、电话或浏览器数据。继续暂停测试、浏览器检查和Loop阶段推进，不把需求确认记作实现通过。


## 2026-10-29 · OPERATOR-BILLING-STATISTICS-CONFIRMED：补齐运营智能计费统计

用户指出截图中的智能计费统计仍显示总部运营、门店运营待确认。本次按直接纠偏确认两类运营均有本租户智能计费统计及原明细查看权限。

- 同步PAGE-2106菜单、F61功能、D23数据矩阵两类运营单元格，以及三项条件、N6、运营职责与当前确认摘要，移除本项运营待确认描述。
- 数据限各自租户准确关联AI账户的统计与原明细；不授充值、套餐办理、手工调账或其他独立导出权限，也不扩大通话数据异常等其他功能。
- 仅修改现有说明文档与记录，未修改代码、账号授权或业务数据；继续暂停测试和浏览器验证，不记录实现通过、不推进阶段。


## 2026-10-29 · 完整继承对照回执及验证边界

本轮发现的原型入口、字段、权限与交互迁移遗漏已集中修复；43当前承载/113动作/222原能力引用与15片段迁移逐项落表，见full-inheritance-audit-20261029.json。原已确认替代及10占位/缺证原控件保持准确边界，当前五种生产角色口径未增加。

仍明确未计实页通过：公共禁呼新增草稿取消一条因自动审批服务403而未执行；该失败不是操作不安全判定，未换通道或重复该动作。实际头像选图与file自动验收保留原限制；真实认证/接口/电话/2059等工程缺证及G3保持。模型/源码/DOM检查不能冒充这些实页或生产结果。

本轮额外旧CA测试夹具缺latestVersion、用active模板索引查已退休快照，并在授权首次清理前断言原始ledger零写；诊断达到3后已停止该脚本并隔离，绝不计23通过或回退现已批准的模板清理。原过时空值用例由当前55路由回归核证；现工厂15与证据12保持。该历史诊断不是本轮产品缺陷的通过声明，原日志保留在/tmp/full-business-current-fixture-20261029.log。


## 2026-10-29 · TENANT-INBOUND-RULES-CONFIRMED：管理员新增/编辑呼入规则

用户通过截图确认F36中的总部管理员、门店管理员待确认均为有权限。现明确两类管理员可新增和编辑各自租户的呼入规则，沿原页面、字段、可选资源与状态条件办理。

- F36两类管理员改为有权限；同步既有呼入服务菜单与规则查看、N7及摘要。管理员配置维护不要求本人具备坐席关联；使用电话仍按原坐席能力条件。
- 数据矩阵增加已有呼入规则的范围说明D27，只列原功能的数据边界，不新增产品功能或扩大到其他租户。运营的坐席接听不推导规则维护权，超级管理员沿原条件。
- 本次没有确认删除规则、扩展号码/线路等资源维护或执行真实呼叫。仅更新现有说明与记录，未改业务代码、账号授权或浏览器数据。
- 按用户要求继续暂停测试与浏览器验证，不记录实现通过，不推进Loop阶段或G3。


## 2026-10-29 · AUDIT-EXPORT-PUBLIC-VIEW-CONFIRMED：截图四项待确认改为有权限

用户截图确认F44/F45中待确认均为有权限。本轮按截图四个待确认单元格处理：总部/门店管理员的操作审计导出，以及总部/门店运营的公共禁呼查看。

- F44两类管理员改为有权导出各自租户有权操作审计；D22同步读取/导出范围。未将截图中的运营审计“—”改为授权。
- F45两类运营改为有权查看本租户公共禁呼名单及准确来源；D17和统一黑名单菜单说明同步，AI黑名单原规则保留。公共禁呼新增与解除仍按已确认各自动作授权，不从查看推导解除。
- 同步N7/N8/N9、当前摘要、功能说明及README；只读现有资料并更新文档，不修改业务代码、账号权限或浏览器数据。
- 继续暂停测试及浏览器验证，不记录实现通过，不推进Loop或G3。


## 2026-10-29 · AI-SERVICE-LEDGER-VIEW-CONFIRMED：五种角色可查看服务账户和充值流水

用户通过F53截图明确“这里都有权限”，将此前非超管服务账户/充值流水查看的无权限结论修订为五种角色均可查看。该后续直接确认替代先前对F53查看权限的禁止；充值办理、套餐和调账禁用规则保留。

- F53五种角色均有只读查看权限，超级管理员沿原有权账户，四种租户角色限本租户准确关联AI账户及原流水。
- D24从混合的“AI充值、服务及流水”改为“AI服务账户及充值流水”，五角色分别列读取范围；不再把数据读取与充值办理写权限混为一项。
- AI充值管理菜单的办理权限仍仅超管，补充查看按独立只读权限执行；本次不批准新的菜单、入口或实际交易。N6、摘要、Markdown、功能说明和README同步，撤回旧查看禁止的当前说明。
- F54/F55充值套餐/手工调账与交易处理不放开，服务汇总导出不由查看推导；账户映射未知仍不得借用其他租户。
- 仅更新文档和记录，未修改代码、账号权限、账本或浏览器数据；继续暂停测试与浏览器验证，不记录实现通过，不推进Loop或G3。


## 2026-10-29 · SERVICE-FINANCIAL-ACTIONS-SUPER-ONLY：三项操作仅超管有权

用户通过F54/F55/F56截图明确“这里都是超管有权限，其余无权限”。确认试用/年包/话费包办理、手工调账/核对同次服务结果、服务汇总导出均为超级管理员专属，其余四种生产角色均无权限。

- 三个功能行统一超管有权限、四类租户角色无权限；服务汇总导出的角色归属不再待确认，超管原有权账户和产品/服务状态、同次结果等原规则保留。
- 同步AI充值办理管理菜单的超管专属口径、D25服务汇总导出范围、N6、当前摘要、功能说明及README；不再以旧独立财务演示身份推导生产导出角色。
- F53/D24已确认的五角色服务账户与充值流水只读查看保持；本次服务汇总导出专属不扩大到普通查看禁用，也不扩大到有权云报表/审计等其他导出。
- 沿用既有当前分钟及服务口径，不改账本或产品参数。仅更新说明与本记录，未修改业务代码、角色授权、真实资金或浏览器数据；继续暂停测试/浏览器验证，不记录实现通过，不推进Loop或G3。


## 2026-10-29 · CONFIRMED-PERMISSIONS-IMPLEMENTED：将本轮权限确认同步现有原型

直接授权：用户“把权限更新进原型”。沿现有本地Mock范围、原址和原型Loop的当前S7执行；不新建原型、不改分析冻结材料/G3，不更新永久工具，不改变旧业务命名空间。此前暂停验证继续有效。

- 新增js/components/role-permissions.js作为当前确认矩阵的唯一运行时权限判定：超级管理员、总部管理员/运营、门店管理员/运营。坐席不作角色，原seat成员按运营关系兼容；实际电话能力读取本人当前租户有效坐席与资源。未确认/明确禁止项不开放，条件授权仍保原成员页面授权和对象条件，不将条件列当作全量授权。
- 会话、成员授权表单和当前身份显示同步五角色。AI/云呼叫保独立使用权限；旧只读/资源/财务/专项及合成验收身份不进入正常登录/角色选项，其组织资料、隔离保存和审计保留，不清库、不删除账号。账号管理仍由超管全局可见；旧资料标历史演示账号。
- 运营AI专项名单复用原维护操作及各来源/期限/远端待核守卫；公共禁呼查看开放，新增仍按单独授权，解除仍仅管理员。AI业务场景开放运营，标签/供应商映射管理禁止运营；配置保存另核标签写权限，只读分类查询不授维护。
- 云呼叫原权限钩子同步有权报表导出、五角色有权录音/号码明文、管理员异常处理及审计导出、管理员呼入规则查看/新增/编辑。通话异常增加原租户对象范围核对。运营呼入入口按真实坐席关联可用，并复用原坐席作业，不进入规则配置；电话状态、未保存和有限收尾守卫保持。
- 智能计费统计按当前租户开放管理员/运营。原使用情况页复用原服务抽屉提供服务账户/充值流水只读查看，首开和内部重试均去除办理入口，并在提交层拒绝越权。超管保原套餐/调账/同次结果规则；服务汇总导出仅超管，使用原八列当前分钟与服务口径。
- 已重新生成原AI/Cloud模块、资源版本和原复用来源记录；原参考只读，index直接打开方式不变。现有S7步骤补充本次范围；源码、文档与README状态同步。
- 构建成功：AI 18脚本/1样式，Cloud 126脚本/43样式；构建期脚本语法编译及入口脚本语法处理完成。未执行功能断言、账号登录、浏览器操作、拨号、充值、导出、权限回归或验收。不写verification/circuit/workflow通过，不推进阶段；全部本轮权限行为仍待回归，旧通过不能覆盖本轮。


## 2026-10-29 · FIVE-ROLE-REGRESSION-RESUMED：用户明确恢复专项回归

本轮用户原文：“现在按确认后的五种角色回归一下权限，看看原型的菜单、功能和数据范围是否跟矩阵一致，有遗漏直接修复，不要再新增验收角色。”

该最新指令恢复本轮五角色权限回归，取代此前对本专项验证的暂停；原型仍为原址本地Mock。仅用既有超管、李明的总部/门店管理员关系、王静总部运营及周岚门店运营；必要坐席能力复用既有陈敏账号，不创建角色或账号，不对原账务办理真实或浏览器模拟充值。菜单、页面、配置表单正常查看与无提交关闭，越权和账务提交仅在隔离内存中检查。

浏览器首次读取原HTTP标签被自动审批按旧暂停理由拒绝。本轮在原工具、原HTTP地址下提交当前授权后重试；不使用其他浏览器、file、直接CDP或间接通道绕过拒绝。


## 2026-10-29 · FIVE-ROLE-PERMISSIONS-REGRESSION：专项回归完成

用户已恢复并明确授权当前五角色权限回归，要求遗漏直接修复且不新增验收角色。使用现有超管、李明总部/门店两成员关系、王静与周岚；共四个既有账号覆盖五种角色，新增账号/角色均0。

- 实际Chrome原HTTP地址逐页访问：超管37、总部管理员34、总部运营17、门店管理员34、门店运营17，共139；当前角色、菜单及页面激活与确认矩阵一致，无额外或缺失菜单。首次标签页加载空壳已等就绪后单点复核，不当作权限拒绝。源页面控制台error为0，26个入口依赖/版本齐全。
- 隔离实际原生AI/Cloud源码验证71组通过，菜单单元格190、功能单元格320与矩阵一致；含越租户、同企业错租户、标签越页保存、黑名单动作/撤权、服务只读及超管专属提交/导出、全局无执行资格的管理例外等反例。模型不创建账号或角色，不把声明比对当作全部真实业务写入测试。
- 修复六类实现差异：AI生成正文被局部变量覆盖；专项导出缺少复核/未知动作过宽/原占位虚报；超管服务导出误按业务租户裁剪；全局应用/供应商管理误绑执行资格；进入租户菜单/合法位置恢复时序与旧iframe回调；门店范围不可见总部的错误提示。服务列表和汇总共用已应用筛选，原八列分钟/服务信息保留。
- 真实数据范围观察：超管跨品牌仍全局16账号和2应用；正常管理员/运营只见本租户服务及业务数据，财务不可写。未提交充值、调账、配置、授权、删除或拨号，未复制/清理用户浏览器业务数据；服务导出仅隔离内存构造。原AI专项导出未新开发，仅如实提示尚未生成文件。
- 初始模型环境和采集脚本问题均单独修正：标准Web API、私有标签函数测试方式、动态菜单定位、跨帧DOM与数组闭包采样；未计为产品通过。完整VM停用实例实验超时已停止，改为精确原生函数依赖注入，不假报真实供应商停用/恢复。浏览器自动审批误沿用旧暂停，取得当前具体HTTP范围新授权后才继续同源工具，未绕file旧拒绝。
- 当前完整结果memory/five-role-permissions-20261029.json。详细临时证据均在/tmp，不新建原型、备份或大型evidence/runtime目录。既有S7内记录，不推进整版S8/G3；12延期/14工程缺证与真实身份、真实供应商执行边界保持。


## 2026-10-29 · CLOUD-ACCOUNT-MENU-RELOCATION：云呼叫账号归接入管理

用户要求“这个菜单放到系统管理，接入管理里面，改个名字云呼叫账号”。按当前呼叫服务账号PAGE-2219处理，移到系统管理/接入管理，与应用接入相邻；保留组织与权限在前的分组顺序。

- 仅调整导航位置、名称、原页面标题/面包屑及现有权限说明中的对应名称。稳定PAGE/route、原专业控制器、授权单元格、供应商配置和电话范围不变。原始参考/冻结资料只读，不新建原型、账号或角色。
- 本次为已确认范围内的呈现调整，按当前S7定向检查；不把上一轮完整权限回归当作本轮全量重验。

- 本次定向检查已完成：新导航与JSON一致、系统分组顺序保留、五角色授权结果未变、原路由和电话边界未变，生成页标题/面包屑为云呼叫账号。未执行业务保存、未重跑整版验收；本项新鲜记录已由record-verification写入。


## 2026-10-29 · CALL-RECORD-RECONCILIATION-CLARITY：系统管理中的通话记录核对

用户同意下沉管理员维护入口，并要求表达更清晰。将PAGE-2221移为系统管理直属菜单“通话记录核对”，不新增维护分组、角色或页面；保留原route、权限、租户/企业过滤、电话范围及处理过程。

- 页头列明结果/结束时间/时长缺失；正常未接通/拒接在云呼叫记录查看。操作对象、空态、详情、核对历史与按钮统一为记录资料的核对和补齐。
- 底层状态仍待处理/核对中/仍需处理/已恢复；仅显示为待核对/核对中/仍缺资料/已补齐。筛选显式保留旧value，默认未补齐聚合口径不变，徽标样式沿原状态。
- 明确不重拨客户、不改已保存跟进结果；资料不足保留原记录。当前原型模拟边界保留，不声称已接真实供应商补查。同步现有三矩阵说明，不改冻结输入或原始参考。

- 本项呈现调整已定向核对：生成模块的原状态/筛选兼容、五角色原授权及Chrome原56348 HTTP页菜单、标题、空态、处理说明均通过。没有新角色或浏览器业务数据写入；file实际运行、真实供应商补查及原有工程缺证不因本项通过而关闭。截图/tmp/d-call-record-reconciliation-20261029.png，当前仍S7。


## 2026-10-29 黑名单方案调整的继承边界

用户直接授权以单一AI分组/号码结构承载2.0黑名单并新增天润同步。原公共/专项页签分拆作为历史设计保留，当前原型采用 `inputs/blacklist-change-authorization-20261029.json` 的已确认新方向。未改冻结需求目录或上游图集；后续正式开发交接应对齐该差异。

天润重复新增/更新范围、部分范围删除、已下发任务及IVR实际模式、共用企业账号隔离、短期到期解除回执仍待真实接入核验。原型只保存本地同步配置、计划与待核状态，不伪报远端终态。


## 2026-10-29 · MENU-OWNERSHIP-CLARITY：现有菜单归属与名称复查

用户直接要求整体检查错位、重复和不清晰的功能，并复用原有功能。对当前41个页面/38个可见菜单核对实际原控制器：

- 业务管理的“云外呼配置”实际是共享字段/取数接口，明确为“业务字段”；保原字段、引用及取数配置。
- AI业务场景和AI标签配置集中呼叫中心/AI配置，保留分类页原标签关联入口；不新建分类或标签维护页。
- AI线索回访记录按客户/线索聚合，归业务&客户/客户维护；逐通记录继续在呼叫中心，聚合统计在报表中心，三种既有视角不混作同一功能。
- AI服务与用量、AI充值管理集中系统管理/AI服务；去除超管同页显示“AI服务概览”的别名和原供应服务、组织与权限中的错位。原服务账户/财务写入权限及取数范围不变。
- 智能外呼/语音外呼统一明确为AI外呼任务/IVR外呼任务；相关AI记录、场景、报表统一AI前缀，修正任务页误称通话记录、通话统计页误用任务创建说明。
- “配置记录”沿原坐席/技能内容明确为“坐席配置记录”；“坐席维护”统一“坐席管理”；操作审计取消同名父子两层。原有坐席、技能、队列、外呼组、号码/池、分机、时间条件保持原专业分工，未增加资源种类或混并模型。
- 菜单ID、原route、module、phoneDomain、菜单开关及五角色授权不变；原生页标题、说明、当前主路由面包屑和现有三矩阵同步。仅本轮临时检查文件放/tmp，不新增原型/备份或大型证据目录，不改冻结输入及其他版本。

## 2026-10-29 · MENU-OWNERSHIP-CLARITY 补充核对

- 页面走查补充：原超管AI服务页仍将办理按钮指向租户管理，现复用原按钮进入既有AI充值管理；仅纠正导航目标，不增加办理权限/动作。原服务账户只读按钮、原租户用量、财务守卫及数据范围保持。

- 导航移动的兼容修复：演示初始业务授权与超管全局管理范围改按原稳定页面ID识别，避免AI服务移位导致运营丢失原用量入口、充值页丢失原全局筛选/位置。仅保持本轮前既有集合，不增减授权。

- 浏览器发现并修复原服务跳转被只读点击守卫拦截：仅放行当前账号/租户上下文一致、当前为服务页且有既有AI充值管理访问权的超管原导航按钮；其余未知handler及无权/旧上下文继续拒绝。未开放任何充值提交或通用导航放行。两个标题定位检查曾因原页使用普通文本及隐藏面包屑同名而失败，改用可见DOM核对，不当作产品通过。

- 本轮收口验证通过：41个页面/38个菜单ID、原route/module/phoneDomain/菜单开关保持；当前JSON/JS导航、HTML及Markdown菜单名称/位置一致；26个入口本地资源与生成模块哈希齐全。以当前五角色策略比较新旧导航，410项页权限/可写/管理范围比较、640项功能权限比较及9项精确导航守卫正反例通过，登录默认、运营服务查看、超管全局财务筛选未因菜单移动变化。
- Chrome原56348 HTTP页实际核对16个相关页面与1个原供应商弹窗，原服务按钮可进入既有AI充值管理；桌面截图无错位，控制台error为0。没有新建账号/角色，没有浏览器业务写入、充值、调账、导出、删除或拨号。临时证据/tmp/d-menu-{static-check,runtime-check,browser-check}-20261029.json及/tmp/d-menu-call-center-20261029.png；业务区截图另在/tmp/d-menu-business-20261029.png。
- 并行独立Step06已按另行用户确认收紧黑名单超管权限，本轮观察到PAGE-2007说明和F46/F47/F48/F50共5格变化，已保留该最新只读规则；其余655格与本轮前一致，当前510个菜单/功能授权格与实际权限策略一致。菜单整理没有回退、覆盖或重新授权这项独立变更。
- 初始检查曾把角色说明改名当成身份变更、标题普通文本/隐藏面包屑当成缺失，临时VM加载顺序及toast淡出判据也已纠正；均不冒充产品通过。服务按钮被只读守卫拦截是实际缺陷，已完成精确修复及UI/反例复验。file实际运行、真实供应商与整版S8/G3仍未验，本项仅现有S7菜单呈现调整收口。


## 2026-10-30 四节点审计修复闭环

本轮10类可复现问题均已修复并回归，无本轮未解决的阻断项。原通用fixture失配及既有MutationObserver诊断见审计总记录；真实CTI／供应商／file自动直开及正式G3／S8边界不因本轮定向通过而变更。


## 2026-10-30 step-18 交付复核

step-18本轮独立审计5类问题已全部闭环，无本轮未解决阻断。真实provider/CTI及重拨执行、file自动操作、原fixture失配与既有非阻断诊断仍按原边界保留。


## 2026-10-30 当前产品/原型全局验收范围核定

用户明确要求补齐产品和原型S8/final，工程上下文及真实接口联调交开发。按有限Mock授权逐条核定原16条Partial；完整旧状态和原文保存在memory/global-acceptance-20261030/acceptance-map-before-scope-review.md，当前准则对齐146条产品AC，详见partial-scope-disposition.json及acceptance-row-review.json。R154是逐供应商已受理未拨能力的真实核证，明确Deferred给开发；其本地发起/重呼/补交禁呼、未知不放行在原型侧独立验收。其余15条只对当前产品/本地Mock关闭，生产子条件由具体EQ继续承接；取消的旧v2迁移不重新扩回产品。

- 当前产品行为：五入口/五角色、四节点、两办理模式、分类路由与字段参考分开、CURRENT内部继续及OTHER跨租户、END两动作；已开始运行/正式快照不追改。原S2计划和上游分析保留来源，不伪造G3或业务/运营批准。
- 原型本轮发现并修复：多轮跟进演示用对象引用生成selected，导致DOM默认旧段。已用稳定ID及当前execution.followupId关联，开始新办理清旧选择；权威模型的拦截保留，原内容快照不改。字段身份、功能/AC数量及报价范围不变，属于既有FUNC-2030/2033的实现缺陷修正，不新增业务。
- 产品说明细化：AC2088的跨租户限制与AC2145的本租户继续分别表达；AC2136改用END后续动作名称。当前产品图集说明叠加在原SVG外，全部来源几何保留；不把参考图旧口径重新当成现行配置。
- 真实认证/权限码/身份映射、真实CTI与撤权收尾、供应商718后续尝试/已受理拦截/远端解除、生产账务及真实删除实体/并发结果仍按EQ与ENG清单由开发核证。原12项延期和14项工程缺证边界保留。
- file自动验收沿既有拒绝范围保持；当前本地资源闭包/同一业务实现及HTTP证据分列，未将HTTP冒称file浏览器通过。人工最小核验见本轮manual-file-check.md。


## 2026-10-31 Step42 增量完成及整版边界

用户授权的两模式具体任务/坐席、五档执行优先级、原手动单条/批量分配及当前需求/规格同步已完成。当前构建39套检查567报告用例与原UI断言脚本全绿；实际HTTP走通三种方式安排、模板默认及分类绑定导入、直接模式、改派与先导入后批分。证据：memory/execution-arrangement-verification-20261031.json。现有DRAFT产品交接包已按新运行文件重新捕获/复核/导出，旧投影漂移失败保留。

本轮S7预检及step42新鲜验证通过。只读尝试S8预检如实拒绝：新验证轮次不能沿用步骤1～41、两个原图和全局的旧摘要；这不是本轮功能失败，也不能替旧步骤补盖pass。本次未要求重演整版已验范围，当前workflow仍S7，旧2026-10-30 S8/final仅为历史证据；不宣称本轮整版验收或正式G3/真实接口通过。

浏览器在reload期间保留未提供来源URL的MutationObserver.observe启动诊断；没有将其记为零控制台错误或通过用例。当前表单、保存、回读与资格判断均实际可用。file自动复验、生产供应商调度和原工程缺证继续独立。


## 2026-10-31 Step43 修复与待验边界

人工默认人工分配、指定坐席才必选，预外呼仅任务、AI任务+场景，以及移除模板/导入/分配独立责任人已实施并同步当前需求/规格/DRAFT包。后继人工策略、合法具体坐席接续及一次检查即可导入的回归均已修复。最终当前built40套592用例及原editor断言全绿，139投影/398文件/60738链接和manifest通过；完整摘要见memory/assignment-simplification-verification-20261031.json。

真实表单点击未验：CUA input/AX三次超时后，inventory报告Mac locked且无法自动解锁；停止自动交互重试，已异步请求用户解锁。只读DOM见到当前新列表并无独立跟进人列，不能冒称表单保存/刷新或节点策略点击通过。收到用户解锁回复后用受支持浏览器工具补验本轮两模式人工两策略、预外呼只任务、默认责任人移除及原单/批分配，再重核同一最终build。不得使用Step42点击记录替代本次证据，也不以其他通道绕过锁屏。

本轮代码与隔离交互回归通过，R245/246保持Partial至实际点击核验，R247的模型资格/历史/本人断言在本地范围通过。workflow继续S7；旧全局S8/final仅历史，不提升正式G3、真实供应商或工程/业务运营审批。


### Step43 解锁后真实页面补验已完成

用户在本聊天回复“已解锁”后，已在与592条隔离回归完全相同的冻结build上，实际完成DIRECT人工无seat导入待分配、指定坐席必填反例与原批量分配、PRED仅任务、AI任务+场景无责任人、模板两策略保存/重开、TEMPLATE人工无seat导入及原单条分配、最终刷新回读。R245/246本轮真实点击边界现已关闭，浏览器环境熔断计数依实际恢复证据归零，原失败及当时Partial记录保留。证据：memory/assignment-simplification-verification-20261031.json。

本次只补Step43本地原型交互，不提升旧整版S8/final、file自动验收、真实供应商/CTI、正式G3或工程批准。最终reload一条未提供来源URL的observer启动诊断继续单独保留，未计成零console错误。


## 2026-11-01 Step44实施范围

用户已确认任务内统一字段/业务记录及场景独立DIRECT方案，正在实施；当前正式G3/真实供应商/全版S8及file自动验收边界保持。旧AI/预外呼专业历史不迁移，原接口来源任务不混手工；真实接口工程由后续开发核验。


## 2026-11-01 Step44代码完成与实页补验边界

代码及需求/产品规格已更新；最终当前build45套全部exit0，673报告用例加独立编辑器断言通过，含AI-only真实尾授权包装、无Cloud实例/模块的任务导入及归还权限、原生完整待分配PRED任务正反例。实际HTTP已完成自定义字段及分类、AI场景budget参数映射保存重开、数字abc错误/18.5修正入账和字段详情、已有模板分类独立DIRECT。两个实际阻断（参数表单事件、最小session account projection）已修并实际回核。

PRED新任务待分配状态目录误拦已修并用原native向导shape/校验器验证；最终真页面导入与统一业务/任务投影刷新尚未补完。CUA明确报告Mac锁定，已停止输入并异步请用户解锁，不能把45套或候选AI实页当最终PRED/刷新通过。R248/R249保Partial；新source/完整证据见memory/task-business-import-verification-20261101.json。后续仅需解锁后在原本地HTTP合成任务TASK-PRED-D40491-7f39ec3a导入新业务，检查自定义值/具体task/五档和刷新，保旧QA44-AI-001/QA44-AI-FLOW-CATEGORY，不重复导入、不清缓存。

Step44文档与受控DRAFT出口已完成：155来源、0漂移，产品0错误/27守卫；398文件/62,326相对链接/manifest及产品摘要核对通过。proof91e74145…460b0c7，当前digest e9e52d7b…33f3014。只剩最终PRED/终版刷新实页待解锁，代码/需求/产品规格/当前DRAFT无剩余阻断；不升S8、工程或正式批准。

Step44解锁补验已完成：准确PRED任务内导入QA44-PRED-001/28.5/最高，终版刷新后中央QA44三条唯一记录及AI两条/PRED一条任务投影均正确。原锁屏/候选错误保留，局部任务导入通过；本次用户审计3项生命周期失败在最新build仍复现，转Step45处理，不升级全闭环/S8/工程/生产状态。


## Step45用户确认及审计修复启动

用户已选允许受控废弃，不再重问政策。当前原报告3个正确断言在最新构建确实失败；Step43报告旧hash不直接绑定Step44，但核心问题仍在。按新规则普通reason前置必须拒，因此原AUD01脚本要记录策略差异而不能伪报原样通过；AUD02/AUD03原样保留可复验。旧存量废弃、本人人后补齐与新明确确认路径均需证明结算无死锁。原审计目录不改，前次Step44局部导入实页pass不等闭环/global通过。


### Step45定向修复与验证完成

R251/252/253本地S7实现已通过：47套709结构化用例+独立编辑器断言，新19模型/17已构建UI；原AUD02/03原样通过，AUD01旧reason-only前置正确拒绝并单列政策差异，明确确认及真实旧废弃状态的结算恢复另验通过。HTTP已完成历史核对→DIRECT正常完成及启用流程预检、在途停止→回执收敛→未确认拒绝→受控废弃→新run及刷新。原审计7项文件摘要未变；参见memory/lifecycle-audit-fix-verification-20261101.json。

本轮无剩余生命周期定向阻断。两条未归因既有启动MutationObserver诊断保持记录，不宣称零console错误；真实排队供应商回执验签/生产重试策略只在模型及构建UI覆盖，非真实供应商联调。当前正式G3/工程、全版S8/final与file自动验收维持原门禁。AI默认任务选择器精简仍为讨论建议，未纳入本次审计修复。


## Step46 用户纠正

Step46正在修正供应商字段配置与弹窗体验。旧Step45三项生命周期定向通过保持为历史，不绑定本轮新runtime；本轮待新模型/构建UI和真实页面证据，正式G3/工程/全版S8/final继续独立。

Step46已核实际双供应商创建/弹窗取消及父放弃/独立恢复/保存重开，中科金专属列非法数字拒绝及28.5导入/刷新回读。没有剩余本轮功能阻断。已知无来源URL的启动MutationObserver签名继续单列，不称零console错误。最终proof依本轮源码/构建专项与HTTP，不沿用旧Step44/45摘要；正式/全版/真实供应商边界保。


## Step47原添加字段交互

Step47正修正上一轮入口偏离与弹窗样式；旧Step46通过保持历史，需本轮新UI/built及实页证据，不继承整版或正式批准。

Step47入口/弹窗修正与本轮定向验收完成：R256 Pass，50套756/实页两路径保存刷新均过，原5个模型桥未变。已有启动observer诊断保留、不称零console。当前DRAFT同步独立，仍S7有限Mock，不升正式/全局/生产。


## Step48已确认原型修改

Step48实施中，开发交付包已对576文件建保护基线，禁止authoring/capture/export，待用户确认原型后更新。混合模板先用路由资料发现组再确定AI场景，不任意覆盖模板方式；本地Mock不升级正式G3/工程/全版验收。


## 2026-11-01 Step48 原型待确认

Step48 R257-260本轮Pass，54套827及关键HTTP已核。剩余是用户评审原型后才更新开发包；当前无本轮已知功能阻断。浏览器下载事件落盘采集未成功，生成及保存调用在built回归已验，未伪称实际文件落盘。全版/工程/G3/生产及file自动边界不变。


## 2026-11-01 按入口区分导入（Step49）

Step49进行中：入口分离与来源资格修正待本轮验证，开发包冻结继续。真实接口/供应商/生产验收不在本地Mock通过范围。

Step49待最终收口：核心56套/876结构化均通过；接口说明已改产品文案，正在补最后只读查看关闭与人工草稿保护证据。开发包576文件及原审计7文件哈希不变。接口真实鉴权/网络接收、供应商与CTI均仍不在本地验收范围。


## 2026-11-01 Step49 完成当前原型修正

Step49最终验证通过：当前冻结构建57套脚本、915结构化用例、0失败。真实HTTP任务24运行中手工导入/预检/保存1条及冷回读等待原任务，预外呼任务配置分类本地保存→原导入UI自动带入→逐行失败/编辑重检→2条保存及冷回读、分类TEMPLATE两渠道/纯API关闭均已核。仅本地静态Mock；开发包576文件及集合、原审计7文件哈希不变，仍待用户原型确认，不更新开发包或全局/工程/生产批准。


## 2026-11-01 Step50业务审计

Step50业务组合审计进行中；可靠复现问题直接修，未定义需求记录不擅改。开发包仍冻结，工程/真实接口边界保持。


## 2026-11-01 Step50审计修复验证完成

Step50业务逻辑审计完成：确认并修复9项（8逻辑+1统计口径；4高4中1低），新增63条审计回归，当前冻结构建60套/978结构化用例/0失败。真实HTTP验证部分成功→保留失败草稿→关闭重开→纠正续入，QA50-PART-001/002各1条、无重导及新拨打；任务统一名单5条与原呼叫口径分开。模型/原生/控制器隔离验证未知请求锁、核对身份、历史冲突、跨租户旧与generic私有快照、类别约束、历史读取和基础类型。开发包576文件/集合及原audit7文件不变，正式G3/整版与真实接口边界不升级。报告memory/business-logic-audit-20261101/业务逻辑审计报告.html；总证据memory/business-logic-audit-verification-20261101.json。


## 2026-11-01 Step51交互与名单展示修正

Step51本步验证完成，R-269～271 Pass；63套脚本／1,042结构化用例／0失败及当前HTTP证据见 memory/unified-task-import-roster-verification-20261101.json。原审计修复及既有权限／未知回执／草稿约束保持。开发包576文件和原audit7不变，仍待用户确认；file自动、真实接口与全局验收边界保持。


## 2026-11-01 Step52 AI通话记录入口收敛

依据 inputs/ai-call-refusal-entry-authorization-20261101.json，只移除列表逐行确认拒联并保留在准确通话详情，既有人工核实／来源／权限／客户限制历史保持；不更新开发包。本步已验证：6套113用例、原列表37条和详情HTTP核验通过；证据 memory/ai-call-refusal-entry-verification-20261101.json。


## 2026-11-01 Step53导入反馈修复

用户点击无反应来自正确的0有效行阻断与原因不可见；按 inputs/task-import-feedback-authorization-20261101.json 增加固定底部状态和表外错误摘要，保唯一编码/未知请求/有效子集；开发包不变。本步已验证：5套119用例／重复与编辑重检HTTP／原名单未新增，证据 memory/task-import-feedback-verification-20261101.json。


## 2026-11-01 用户冻结需求并要求离线完整实点

本轮冻结见 memory/offline-e2e-audit-20261101/freeze-baseline.json。Chrome现有file标签在观察前被URL安全策略拒绝，仅允许HTTP(S)且明禁绕过；未作替代surface或HTTP冒充。离线实点0项通过，清单全部未执行／环境阻断。已向用户请求保留离线未验或明确改HTTP实际点击的选择；代码与开发包未改，开发包576文件集合及hash仍一致。不能标记完整验收通过。

用户后续明确选择“保留离线要求，暂不判定通过”。本轮离线完整流程维持未验证，不以HTTP或脚本替代；没有实施业务代码修复或更新开发包。待现有工具能合法支持file页面实际操作后，才可重新执行该验收。


## 2026-11-01 Step54 HTTP实际完整流程验收

用户明确改用HTTP继续验收，原需求冻结和开发包保持，离线仍未验。仅本轮真实点击可作为HTTP路径通过证据，发现可靠问题精确修复并重走。授权 inputs/http-e2e-acceptance-authorization-20261101.json，清单 memory/http-e2e-acceptance-20261101/actual-click-checklist.json；本轮三条主流程实际闭环并修复，13组已验／9组部分已验，完整验收仍Pending。最新66套1102通过，102观察含2无效；总证明 memory/http-e2e-acceptance-verification-20261101.json，报告 http-e2e-acceptance-20261101/http-acceptance-report.html。开发包不变，下载落地/真实音频/部分组合/file未验均保留。


## Step55 客户档案聚合修复

用户明确授权修复统一业务与专业AI/PRED跟进未完整入档问题。仅只读聚合，不复制持久业务/通话；原来源与数据权限保持，Cua实点与定向检查均需新证据。开发包及远端本步不自动更新。本步局部功能已核验；70套1,222例通过，25条修后有效HTTP观察，见memory/customer-profile-integration-20261102/verification-proof.json及report.html。开发包和远端未改。保留OBS-PROFILE-STARTUP-01启动Observer日志待归因，非已修复声明；整版S8/G3、file与真实接口不升级。授权inputs/customer-profile-integration-authorization-20261102.json。


## Step56 AI任务选择入口

依据本轮用户问题及既有具体执行任务授权，补模板节点任务入口/准确场景联动；范围见execution-steps.md Step56与inputs/template-ai-task-entry-authorization-20261102.json。本步局部已验证：当前70套1,241例，48项适用built及HTTP任务选择/自动场景/最终保存与回读/滚动保持通过。见memory/template-ai-task-entry-20261102/verification-proof.json。仅本地原型，开发包与远端未更新，整版／file／真实接口不升级。


## 2026-11-03 Step57

Step57待实际HTTP：当前IAB原地址56331显示无法访问；历史56348明确ERR_CONNECTION_REFUSED。已请求可访问HTTP地址。不能验证用户当前实际登录身份和菜单，不能把纯内存旧快照根因称为现场确认。


## 2026-11-03 Step57 HTTP续验

Step57原“HTTP不可达、待三页实点”已解除：用户明确授权重启56348并继续管理权限问题，当前三页/编辑进入/刷新/运营拒绝均实际核验。原file截图显示总部运营王静，未误判为管理员缺权。OBS-PROFILE-STARTUP-01原无来源栈Observer诊断保持独立未解决项，不作为本步零诊断声明。


## 2026-11-03 Step58

Step58进行中：已实际复现SUPER预外呼新建按钮可点但无任何反馈；矩阵F33为拒绝，不授新权，修入口/反馈后需实点合法成员路径及SUPER状态。


## 2026-11-03 Step58验证

Step58“预外呼新建无响应”已按既有权限规则修复并实际核验：SUPER禁用且解释，四种合法租户成员向导正常。未擅自新增超管创建能力。原Observer无来源栈诊断仍保留，file/真实供应商与整版验收不因本步升级。


## 2026-11-03 Step59

Step59进行中：用户生产口径已明确，无需脱敏待核区；删除单独展示并将七条固定旧demo号码显式改成完整样例，不通过放宽数据保护消除问题。


## 2026-11-03 Step59完整号码验证

Step59“脱敏历史待核区”按最新用户生产事实取消，主档案及完整号码示例已验证。此前建议折叠待核表已被本轮用户澄清替代，不新增该业务。原Observer和file/真实接口边界继续保持。
