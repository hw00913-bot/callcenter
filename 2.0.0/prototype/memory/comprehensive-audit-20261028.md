# D联络云 2.0.0 全面审计报告

## 当前修复回执（2026-10-28）

**用户要求的 CA-01—CA-08 八项问题均已修复，定向复验通过。** 已更新同一原型入口和生成包；下方初次审计的反例作为修复前记录保留。

| 问题 | 修复结果 | 当前证据 |
|---|---|---|
| CA-01 | 原段保存实际提供字段；未操作保留前段有效值，明确空才覆盖；历史缺证不伪造 | 最终生成包真实人工表单“未填写／明确清空”两场景；当前函数串联及迟到补录独立反例 |
| CA-02 | 数字按固定字段类型规范；日期时间输入注明北京时间并保存 +08:00 快照 | 最终生成包数字、日期时间两场景；纽约时区测试含夏令时缺口，旧无时区数据仍待核 |
| CA-03 | 只读页签、详情、筛选、分页及报表钻取恢复，写动作继续拒绝 | 最终生成包实页点击，68项模型；10页17视图534控件清单分类 |
| CA-04 | 新归属变更同事务保存真实对象ID、前后值和变更字段，区分创建／修改／无变化 | 11项模型覆盖首次绑定、换绑、幂等、失败、未知结果核对和历史保留 |
| CA-05 | 2.0页面绑定本版本，显式切换其它版本仍有效 | 从主入口实际打开默认v2.0.0，再切换1.2和2.0通过 |
| CA-06 | 7项受影响验收行区分旧模板与FIRST_MATCH_V1，并映射step-12 | 原224行及43 PAGE／113 ACTION／43 FUNC／38 US／134 AC引用保持；未批量提升验收状态 |
| CA-07 | 本项目两组工具副本统一记录协议、最新记录判定、空失败数组及资源路径解析 | 32项协议测试；真正失败、缺字段、错误步骤、过期摘要与轮次仍阻断 |
| CA-08 | 需求说明分离当前状态与历史快照，版本台账补登记重建／七分类／新条件／本次修复 | 当前投影45项本版变更；其它版本条目与共享当前发布版不变 |

最终检查：**193次菜单访问、19个角色范围、37个唯一菜单页、4个内部页、4个阅读视图，0页面运行错误、0资源错误；205段脚本语法通过。** 最终生成包的23组保存链测试和7组独立反例通过；重新构建的6项输出指纹与已测产物一致。90份设计锁文件无漂移，其它版本实现与工作流状态保持。

完整S8验收仍不能宣称通过：224项完整验收尚未逐项结项，7个未重新覆盖的原步骤需要新鲜证据；file直开、GUI文件选择、真实供应商／ACTION-2059重呼、12项延期与14项工程缺证、G3仍按原状态处理。这些属于既有验收边界，不是本次八项修复遗留。

持久证据：[comprehensive-audit-20261028-fixes.json](/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/prototype/memory/comprehensive-audit-20261028-fixes.json)。原始脚本与截图在 `/tmp/v2-fix-all-20261028/`，可能被系统清理；关键结果和最终文件指纹已纳入持久证据。

本轮发现并修正过一项临时测试脚本路径错误（独立复核脚本先读不存在的候选文件），修正后直接抽最终bundle的30组测试通过；未将测试脚本错误计作产品故障。审计修复仅操作全新非持久浏览器及内存样例，未清理或迁移原验收数据。

## 初次审计快照（修复前）

审计日期：2026-10-28，北京时间。范围：`Demo_Protype_2/2.0.0` 的需求与确认材料、当前原型、生成与适配逻辑、角色权限、阅读视图及验收记录。

**结论：本次确认 8 项问题，包含 1 项 P1、6 项 P2、1 项 P3。当前版本可以继续用于有限本地演示，尚不满足全量验收或正式开发交付条件。** 核心问题是未操作字段被误作清空、原表单存值与新条件引擎不兼容，以及只读操作误拦。菜单能打开、脚本无异常、验收 ID 覆盖完整，均不能替代这些业务链路检查。

本次为独立审计，未修复产品代码、未改需求基线或阶段状态。原型仍为 S7；正式需求 S8 阻塞、G3 未批准，有限静态 Mock 授权与 12 项延期、14 项工程缺证保持。旧审计中已修复的问题不重复计入本表。

## 问题总表

| 编号 | 等级 | 问题 | 影响 | 本次证据 |
|---|---|---|---|---|
| CA-01 | P1 | 后续人工段未操作字段被保存成明确空值 | 可能错误选择条件路径 | 当前真实表单校验、保存与求值函数串联复现 |
| CA-02 | P2 | 数字、日期时间培育值与条件引擎类型不兼容 | 合法保存后路径停在待核，IF/ELSE 均不能进入 | 当前真实保存函数与求值函数串联复现 |
| CA-03 | P2 | 只读角色的页签、筛选和分页被当成写操作 | 可进入菜单但无法完整查阅 | AI 实际浏览器点击；AI/Cloud 捕获监听器模型 |
| CA-04 | P2 | 品牌关联变更未保存前后值 | 不能追溯从哪个品牌改到哪个品牌 | 当前组织模型持久结果复现 |
| CA-05 | P2 | 2.0 版本阅读页默认选择 1.2.0 | 评审者容易对错需求、变更及批准记录 | 从 2.0 主入口实际点击复现 |
| CA-06 | P2 | 验收表未区分旧多路任选与新首命中规则 | 同一场景存在相反验收预期 | 当前验收表、批准决定和实现对照 |
| CA-07 | P2 | 验证日志写入格式与门禁解析器不兼容 | 记录串条、空失败数组与文件名误判，阻塞可靠验收 | 实际 S8 预检及原解析函数复现 |
| CA-08 | P3 | 需求入口及版本投影仍描述 10 月 25 日状态 | 接手者会误认为原型未实施、Mock 尚未授权 | 当前阅读入口与 10 月 26—28 日决定对照 |

等级口径：P1 优先修复，可能改变业务结果；P2 正常修复优先级，影响已承诺功能或验收可靠性；P3 说明维护问题。没有将全部预检诊断逐条计作产品缺陷。

## CA-01 未操作字段被误作清空

**位置：** [flow-routing.js:185](/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/prototype/js/components/flow-routing.js:185)。上游实际函数在 [cloud.bundle.js](/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/prototype/js/modules/cloud.bundle.js) 中的 `BusinessFlow.openSaveResult`、`detailDialogAction`、`CustomerFollowup.validate`、`BusinessFlowStore.saveResult`；生成变换入口为 [flow_routing_build.py](/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/prototype/scripts/flow_routing_build.py)。

同租户、同节点先前人工段已保存可选单选值 `yes`。新人工段打开结果表单，不操作该字段，仅保存摘要。真实 UI 将 `providedFields` 初始化为空，只有操作者修改字段才加入；但表单校验会为可选字段补 `''`，保存函数将补齐后的全部值写入新段。新条件引擎只用“对象是否拥有字段 key”判断值是否存在，并取最后一段，忽略了 `providedFieldIds: []`。

本次按真实 UI 的完整 payload 调用当前保存函数：保存返回 `success`，第二段持久值为 `''`，`IS_EMPTY` 错误命中 IF，取值来源为第二段。它应保留同范围此前的有效值；从未提供过时应保持未知。典型字段包括新线索的可选单选“意向等级”、活动类的“参与意向”；复现使用可合法配置的同型单选字段隔离验证。

此问题限定为“后段未操作可选单值字段”的实际链路，不泛化为所有保存。依据为 [business-rules.md:578](/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/prototype/memory/business-rules.md:578) 对明确空值与未提供的区分。

**修复建议：** 每个执行段持久保存实际提供字段及其状态，条件读取仅消费明确提供的值；未提供时查找同范围最后有效来源，明确清空才覆盖。保持原历史段不可改写，不以允许未知结果进入 ELSE 绕过缺陷。

## CA-02 合法培育值保存后无法参与条件比较

**位置：** [flow-routing.js:38](/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/prototype/js/components/flow-routing.js:38)、[flow-routing.js:45](/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/prototype/js/components/flow-routing.js:45)、[flow-routing.js:222](/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/prototype/js/components/flow-routing.js:222)，以及当前生成包内 `CustomerFollowup.validate` / `BusinessFlowStore.saveResult`。

原表单把非多选值规范为字符串；新引擎要求数字必须是 JavaScript number，日期时间必须包含时区偏移。两者之间没有约定转换。

| 场景 | 实际保存 | 当前条件结果 | 合理预期 |
|---|---|---|---|
| 数字字段填 90，条件为 ≥80 | 字符串 `"90"`，保存成功 | `PENDING`，已保存值类型无法核定 | 按数字字段定义比较并匹配 |
| 日期时间填 2026-10-28 14:30，条件为 ≥14:00 +08:00 | `2026-10-28T14:30`，保存成功 | `PENDING`，没有显式时区 | 保存时明确时区后比较 |

当前字段配置支持这两种类型，默认字段也存在：活动类 `participantCount`、新线索 `plannedVisitAt`。本次使用当前真实校验、保存和求值函数复现，非重写算法；身份、资源和字段目录使用隔离构造，不声称 GUI 端到端验证。

**修复建议：** 在本版生成适配或条件数据接入处按固定字段定义规范值。数字须先验证再转换；时间须在保存时固定明确时区，不能在求值时猜测浏览器时区。补齐默认字段从表单到路径判断的回归，保持只读参考目录不变。

## CA-03 只读角色无法执行部分合法读取操作

**位置：** [ai.js:76](/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/prototype/js/adapters/ai.js:76)，同类 Cloud 守卫为 [cloud.js:118](/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/prototype/js/adapters/cloud.js:118)；AI 视图方法分类另见 [ai.js:44](/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/prototype/js/adapters/ai.js:44)。

以 `DEMO-AI-READER`／林运营进入东风日产总部：

1. 打开智能通话统计，点击“客户统计”。实际仍为“外呼统计”，提示“当前账号为只读权限”。
2. 打开智能通话记录，点击“展开”。高级筛选仍为 `display:none`，出现同样提示。

捕获监听器以按钮文案和处理器白名单放行读取，但缺少 `switchTab`、`switchDetailTab`、`changePage`、`nextPage`、`toggleExpand` 等。当前生成包确实包含相同守卫。模型另复现“详细信息”“外呼线索明细”和页码被阻止；Cloud 的报表钻取、明细分页及关闭“×”也有同类模型证据，Cloud 部分未做本轮实页点击。

**修复建议：** 明确标记读取和写入操作，或完整核对原控件处理器；视图切换不应归入写操作。保留存储层写权限检查，同时验证只读角色的完整查阅路径。菜单访问检查不能替代控件检查。

## CA-04 品牌归属变更缺少前后值留痕

**位置：** [organization-store.js:38](/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/prototype/js/components/organization-store.js:38)、[organization-store.js:70](/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/prototype/js/components/organization-store.js:70)。要求见 [acceptance-map.md:130](/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/prototype/memory/acceptance-map.md:130) 的 AC-2037。

以超管在独立内存库中创建两个有权品牌 A/B，创建 A 下无业务历史的空门店，再合法改归 B。保存成功后，租户对象只保留 B；持久审计只有时间、操作者、动作、对象 ID 和 requestId，操作回执只有对象 ID，均没有 A/B 的前后值。这是存储缺失，不只是界面缺少展示。

**修复建议：** 同次提交保存实际变更字段的前后值、稳定对象 ID、操作者、时间及 requestId；覆盖首次绑定、合法换绑与无变更保存，不回填伪造历史。

## CA-05 2.0 的版本页默认选到 1.2.0

**位置：** [version-history.html:12](/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/prototype/version-history.html:12)、[version-nav.js:136](/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/prototype/js/version-nav.js:136)、[version-nav.js:328](/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/prototype/js/version-nav.js:328)。

从标题为“D联络云 v2.0.0”的入口点击“版本与变更”，实际选中项为 `v1.2.0`，详情展示 1.2.0 的 38 项变更与 3 份快照。原因是本页 `body` 缺少 `data-working-version-id`，又未通过 hash 传入本版，选择函数回退到共享清单的 `current_version_id=v1.2.0`。

**修复建议：** 在本工作版页面明确绑定 `v2.0.0` 并保持跳转选择。不要为了掩盖页面缺失而擅改整个项目的当前发布版。

## CA-06 新旧条件规则在验收表中未分版本

**位置：** [acceptance-map.md:221](/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/prototype/memory/acceptance-map.md:221) 的 R-215／AC-2124；后续决定为 [decisions.md:128](/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/prototype/docs/decisions.md:128)。

当前验收表仍要求“多条路径明确符合时由人员选择一条，不默认首条”。10 月 28 日已批准的新模板规则却是 IF/ELSEIF 按优先级首命中、唯一 ELSE；旧模板继续原规则。这是明确的新旧分支，不应把两个相反预期共同描述为当前通用验收要求。

**修复建议：** 在非冻结验收映射中标清旧模板与 `FIRST_MATCH_V1` 的适用范围、对应决定和验证证据。保留冻结 AC 原文，不能直接改冻结事实或仅因 ID 被引用就宣称覆盖完成。

## CA-07 验证记录不能被门禁可靠解析

**位置：** [verification-log.md:1141](/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/prototype/memory/verification-log.md:1141) 起的最新声明；解析器 [loop_preflight.py:1454](/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/prototype/tools/prototype-loop-orchestrator/orchestrator/scripts/loop_preflight.py:1454)。

本次实际运行 S7 预检通过、S8 预检失败。原解析函数对末三条记录的结果为：`step-12` 被拼成业务图的 diagram 记录；`business-flow` 使用了时序图 URL；`sequence-flow` 缺 Scope/Result/Tool 等字段。原因是写入顺序把 Scope/Time/Result 放在 Step 前，解析器主要以 Step/Date 切记录，且不识别 Time。

其他已复现的不兼容包括：`Failed: []` 被判为非空失败；证据文件名 `ai-failure-final.txt` 被当成失败描述；入口实际加载 `js/delivery-nav.js?v=...`，检查器却按不带 query 的完整路径相等检查，误报未加载。

**修复建议：** 对齐声明写入和解析协议，明确记录边界与结构化空失败数组，区分实际结论和证据路径。历史记录保留，执行新鲜核验后追加兼容的新声明，不修改旧 pass 摘要，也不绕过门禁。本次未修改工具或日志。

此问题不能解释掉全部 S8 阻塞：224 项验收仍为 `Planned`，step-04/05/08/09/10 的证据未绑定当前实现摘要，仍需逐项完成。最新 12:57 声明的摘要本身与本次核算的当前内容一致，不能把所有记录都说成过期。

## CA-08 当前状态入口过期

**位置：** [需求 README:39](/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/2.0.0/需求/README.md:39)；共享版本投影 [版本清单.json](/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/memory/public/版本清单.json)。

需求入口仍写“原型未实施”“新一轮静态 Mock 尚须明确授权”，但原址重建授权与 10 月 26—28 日实现和决定已经存在。版本投影生成于 10 月 25 日，也未包含后续重建、七分类和条件分支决定。

**修复建议：** 将旧文字标明为截至 10 月 25 日的分析快照，增加当前授权、设计决定和原型入口；更新非冻结阅读投影。G3 和工程缺证保持真实状态，不能借同步文档改变批准结论。

## 本次验证覆盖

| 核查范围 | 本次结果 | 解释 |
|---|---|---|
| 需求追溯 | 43 PAGE、113 ACTION、43 FUNC、38 US、134 AC 的 ID 覆盖完整 | 只证明引用完整，不证明所有行为通过 |
| 设计与冻结保护 | 90 份设计锁文件、2 份冻结文件及 19 份来源哈希全部匹配 | 90 与 21 两组不作无重复文件总量宣称 |
| JavaScript | 205 段脚本编译通过，0 语法错误 | 40 个源文件，AI 28 段内联、Cloud 137 段内联 |
| 入口资源 | 23 个资源存在，缓存 hash 一致 | 无入口资源缺失 |
| 阅读资源闭包 | 主入口及 4 个阅读页共 127 个静态链接检查，无本地缺失或无效同页锚点 | 无外部链接；业务图内 98 个 SVG、时序图 36 个 SVG，不等同逐图语义复验 |
| 新浏览器菜单巡检 | 19 个角色与范围组合，193 次菜单访问；37 个唯一菜单页、4 个内部页 | 0 页面运行错误、0 HTTP 资源错误 |
| 阅读视图浏览器检查 | 版本、业务流程、时序、关联系统均可打开；返回原型可用 | 两图首图有可见节点/参与者与连线；缩放、适宽、100%、阅读模式、全屏操作可用；CA-05 仍存在 |
| 核心模型 | 5 项组织/命名空间/分类映射、55 项条件引擎、12 项条件证据模型通过 | 这些既有用例没有覆盖 CA-01/02 的真实表单存值链 |
| 权限模型 | 35 组 Cloud 鉴权及有限收尾、8 项角色权限保留/回收通过 | provider 和部分 DOM 为桩，不是实际电话证明 |
| 财务模型 | 范围拒绝、幂等、冲突、失败回滚、未知结果核对通过 | 使用内存，不写既有账本、不产生真实交易 |
| 针对性反例 | CA-01/02/04 用当前函数复现；CA-03/05 已实际浏览器复现 | 反例结果与通过的通用回归分别记录 |
| 工作流预检 | S7 pass；S8 fail | 未推进任何阶段，未运行正式 S8 全局通过流程 |

浏览器为全新非持久 Chrome、1600×1000，本地临时 HTTP 服务，仅执行登录、导航与读取操作；未读取原验收浏览器数据。第一轮定向脚本误定位到业务区域导致超时，修正为实际“呼叫中心”后完成复现；该超时属于审计脚本问题，不计为产品故障。

## 未验边界与后续顺序

本次未全量重演 113 个动作及所有异常分支，未逐张复核全部场景图语义。`file://` 双击运行、GUI 文件选择/上传、ACTION-2059 的真实 718 重呼、实际供应商终态/标签/远端限制解除、真实电话与资金操作仍未验。12 项延期、14 项工程缺证保留；这些不作为本次新增实现缺陷。

建议先修 CA-01，再修 CA-02，并用真实表单到保存到路径判断的链路验证；随后修只读操作和品牌留痕。验收映射及日志协议同步后，逐项补证、记录真实状态，再申请 S8。版本阅读页与旧说明可单独修订，不需要改变冻结需求。

## 证据索引

本报告中的关键复现结果已写在正文；临时原始脚本、截图与完整日志位于 `/tmp`，系统清理后可能失效。

- [静态检查结果](/tmp/v2-comprehensive-audit-20261028/static-results.json)、[阅读资源检查](/tmp/v2-comprehensive-audit-20261028/reading-closure.json)
- [193 次菜单巡检](/tmp/v2-comprehensive-audit-20261028/ui-sweep.json)、[定向浏览器复现](/tmp/v2-comprehensive-audit-20261028/targeted-ui.json)
- [只读页签截图](/tmp/v2-comprehensive-audit-20261028/reader-tab-blocked.png)、[只读筛选截图](/tmp/v2-comprehensive-audit-20261028/reader-expand-blocked.png)、[版本默认选择截图](/tmp/v2-comprehensive-audit-20261028/version-default.png)
- [当前业务保存与求值复现脚本](/tmp/v2-audit-routing-repro.cjs)、[父审计复跑结果](/tmp/v2-comprehensive-audit-20261028/routing-reproduction.txt)
- [品牌变更复现](/tmp/v2-audit-org-history.json)、[只读控件模型](/tmp/v2-audit-reader-controls.json)、[Cloud 鉴权复验](/tmp/v2-audit-cloud-auth.json)
- [S7 预检](/tmp/v2-comprehensive-audit-20261028/s7-preflight.txt)、[S8 预检](/tmp/v2-comprehensive-audit-20261028/s8-preflight.txt)

本报告保存时另附 `comprehensive-audit-20261028-evidence.json`，持久记录检查摘要、实现指纹和关键反例结果，便于后续核对。
