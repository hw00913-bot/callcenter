# v1.1.1 独立模拟试做（SRC-155例外）的项目记忆

> SRC-158 / CHANGE-11106-generic-interface-dependency：当前接口字段可独立查询或配置单上游映射（返回取值字段→下游入参名），依赖分必需／可选，允许多级联动。仅必需依赖强制分类闭合；可选缺上游/空值不传参，已填无效不当空。门店无参查询当前租户全部可用门店，有参数按实际编码查询。旧门店绑定保留必需；车系单选、门店多选、来源权限和历史保留。仍为SRC-155授权模拟试做，真实接口及正式G3待核验。

> SRC-157 / CHANGE-11104-multiple-intention-stores：用户明确意向门店多选；车系仍唯一单选，按单编码查店。门店按逐家有效性和同通集合快照处理，旧单值兼容一项，历史不改。当前覆盖早期门店单选表述。仍为SRC-155授权模拟试做，非G3冻结。


> SRC-156 当前更正（CHANGE-11103-single-intention-series）：用户转述黄专并明确确认，意向车系只有一个字段、单选；门店只关联该字段并按单编码查询。此确认覆盖早期多车系并集方案；原草稿输入与批准历史保持只读。仍为授权模拟试做，非G3冻结。

> SRC-155：用户原文“同意，先做独立模拟原型（推荐）”。本记忆服务于已明确批准的独立模拟试做，输入为产品草稿快照，非 G3 冻结导入；真实契约缺口保留，不代表生产或开发交付。

> CHANGE-11105-query-condition-contract：用户采纳“取数接口／查询条件：车系取自”的配置表达；条件由研发预置能力声明，租户绑定取值字段。属于既有FUNC-029的配置表达细化，车系单选门店多选和原AC保持。

## 产品目标

独立静态演示 v1.1.1 接口字典和字段联动，用于评审配置是否简单、单车系联动是否易懂、旧值及异常恢复是否清楚。沿 v1.1.0 深蓝侧栏、白色卡片、蓝色主按钮及表单结构，桌面 1440／1920。

## 目标用户

超管维护字典；沿原权限的人员配置分类字段；坐席在本人当前通话和对象权限内填写；详情及档案按原查看权限只读。租户获得接口授权不扩大成员权限。演示身份／异常控制只服务评审。

## 授权与事实入口

- 启动规划 `memory/project-startup-plan.md` 经 S2 确认后只读；项目执行规则 `CLAUDE.md`。
- `inputs/product-draft/source-record.json` 记录来源及文件哈希，profile=user-authorized-draft-trial、formal_import=false、G3=pending。它不是 delivery manifest。
- 草稿结构：快照 `memory/project-facts.json`、`normalized-user-stories.json`、`business-rules.json`、`feature-list.json`；页面 `planning/page-index.json`；接口 `interfaces/interface-index.json`；风险 `runtime/open-items.json`。
- 配置保持 `mode: none`、`status: not-imported`；baseline ID、fingerprint、manifest SHA-256 和 handoff 为 null，不造冻结包或导入记录。
- 页面与本地 Mock 模型协作读取 `memory/ui-contract.md`；它仅约定浏览器内组织和调用，不定义真实业务 API。下述字段语义以 `field-map.md` 记录，具体本地成员名以该协作约定为准。
- 原工作区 `outputs/business-scenario-atlas.html`、`interaction-sequence-atlas.html`、`page-structure-atlas.html` 为只读草稿图集。图集及本摘要不能替代下面 SC／SEQ 明细；原型不读取 Wiki／query 正文。

## 核心页面列表

8 功能稳定为 FUNC-023～030；完整说明、边界、版本差异和 34 AC 见 `memory/feature-list.md`，不重新编号或合并。

| 页面 | 入口及职责 | 功能／操作 |
|---|---|---|
| PAGE-006 | 系统管理新增业务数据接口；四项配置、列表和表单，仅超管 | FUNC-023～028；ACTION-026～030 |
| PAGE-007 | 原业务分类模块分类／字段页签及弹层 | FUNC-029；ACTION-031 |
| PAGE-008 | 原坐席工作台客户业务信息填写区 | FUNC-030；ACTION-032 |
| PAGE-009 | 原通话详情抽屉只读展示当次快照和原导入信息 | FUNC-030 结果适配，无新操作 |
| PAGE-010 | 原客户档案只读汇总 | FUNC-030 结果适配，无新操作 |

后两处无新菜单、无历史编辑权，不作为保存事务步骤。租户范围一次保存按实际增减分别形成开放／撤销，不多加两个按钮。

## 核心用户路径

| 场景／时序 | 读取入口（均在 inputs/product-draft） | 结果 |
|---|---|---|
| SC-008／SEQ-010 | scenarios/SC-008.json；sequences/SEQ-010.json | 新增字典四项配置 |
| SC-009／SEQ-011 | scenarios/SC-009.json；sequences/SEQ-011.json | 改名并保留稳定引用 |
| SC-010／SEQ-012 | scenarios/SC-010.json；sequences/SEQ-012.json | 按目标启停并保留引用历史 |
| SC-011／SEQ-013 | scenarios/SC-011.json；sequences/SEQ-013.json | 指定接口与租户开放／撤销 |
| SC-012／SEQ-014 | scenarios/SC-012.json；sequences/SEQ-014.json | 接口字段来源、单车系关联、分类独立必填 |
| SC-013／SEQ-015 | scenarios/SC-013.json；sequences/SEQ-015.json | 查选、单编码联动、有效性／确认、原条件保存快照 |

FLOW-005 配置链、FLOW-006 填写链在快照 memory/business-rules.json。管理操作按需发生，不要求每次填写前执行整链；SEQ 条件分支也不是必然依次执行。填写必须落实原始匹配确认、完整／部分失败、旧值、来源恢复和保存异常，不只演示正常流程。

## 主要数据对象

字典、租户、分类字段、车系／门店模拟返回、当前查询范围、当前表单、原导入信息、旧计划到店文本和保存快照分别管理。本次意向车系为一个单选字段，门店按其单编码查询；车系保存 code/name，门店逐家保存 code/name 数组。原导入与 plannedStoreName 不覆盖。模拟数据集中 mock/data.js；只在浏览器演示，不发真实业务请求，不承诺生产草稿恢复。

## 交付方式

交付独立静态入口、可本地 HTTP 预览文件和真实模拟交互检查记录。功能说明文档不生成；页面标注不生成。无 AI／云整合、真实接入、通用编排、自定义门店、独立草稿页或历史编辑。只编辑本试做目录，既有 prototype、v1.1.0、版本清单与历史快照不变。

## 记忆复核摘要

本次没有冻结需求基线。8 功能、34 AC、6 场景、5 页面和业务规则来自 SRC-155 授权的产品草稿；桌面尺寸、沿旧风格、独立模拟及可选交付决定来自已批准启动规划。列表／弹层／分区和本地模拟格式是表现决策，不充当真实接口事实。ISSUE-11102／11105 仍 open，API-015／016 missing、API-018 partial，S8 未通过、G3 pending 保持。


## CHANGE11127｜当前删除范围与第三Tab（S6，待实施）

当前来源：`/Users/huhaowen/Documents/038-云外呼平台/Demo_Protype_2/需求/1.1.1/分析工作区/runtime/product-draft-delete-and-dictionary-tab-20261020/source-record.json`；SHA-256 `8d77f3f83fe6f98dc5a627caa370ac428305fb00e9089468e08dc1f747c2ab7c`，40件已核对。SRC172～176为用户直接范围指令，沿SRC155独立模拟；不是G2/G3或开发冻结。当前11FUNC／46AC／9SC／9SEQ／3FLOW／5PAGE／10ACTION，原只读inputs、startup、CLAUDE里的8项为初始历史输入，不改写、不当当前范围。

仅未使用对象可删，未使用的六统计预置及Mapping字段也适用；当前配置引用、字段依赖、实际业务/导入记录和本通实际使用/非空稿阻止并给位置。字典全局扫当前实际factory及全部持久scope（含停用/撤权）；字段/分类仅本租户。删除不级联、不清业务/草稿、不补默认；仍存定义保留type/options和单选等保护。

业务分类菜单三个Tab：业务分类、自定义字段、取数接口字典。第三Tab仅沿原字典权限的超管可达并维护全局字典，另两Tab仍按原分类/字段权限；普通管理员/坐席不能靠Tab或直达route获得字典维护权。字典搬家不另计功能，也不扩大租户权限。

原Mapping单选＋原门店文本、接口type/domain校验、进行中通话整版保护和实时授权继续。真实API015/ISSUE11113/11105保持；正式W的S1～S4 passed，G2/G3 pending，S5～S8 stale；当前仅消费已授权新草稿，实施待S7。


## CHANGE-11129｜业务分类逻辑删除（SRC177当前规则）

用户明确确认逻辑删除方案并要求开始修改。本节覆盖此前FUNC033/US022/AC147～150中“有历史/当前通话/已有名单任务即不能删”的限制；分类从配置列表和新业务可选项移除，归档原row全部refs及必要依赖闭包的字段定义，保留当时名称/编码/结果，旧名单任务继续，本通话后沿开始版。字段和接口仍按实际/归档保留引用保护物理删除，无恢复/清理/迁移UI，不新建功能或AC，仍11FUNC/46AC/9SC/9SEQ/3FLOW/5PAGE/10ACTION。

已核对40件净化草稿：需求/1.1.1/分析工作区/runtime/product-draft-category-logical-delete-20261020/source-record.json，SHA256 3ca0ec0add52121340c5775142b320922b596733ccac264d89e8941f11c4b54f。当前事实及原5MD/3HTML供本轮消费；历史草稿/冻结inputs/startup/CLAUDE不改，G2/G3pending、正式S5～8stale与API015/ISSUE11113/11105缺口不变，仅SRC155继续授权模拟。

实现计划：scope可选retiredTypes归档（row/fields/deletedAt/deletedBy为原型内部设计，非已冻结生产表契约），保存和归档同次CAS；live catalog/list和新import只active，retired ID不能save复活。只读历史需授权且固定类型/实际对象上下文，capturing新通另核对既有batch/DCC具体item/phone/type或已建native/RAM同identity，伪造新callId/taskId不能把deleted类带回新业务；已有效bound最先使用原版。已有归档业务单独获取该row及闭包defs，避免改变其它active定义。删除检查category的业务refs仅影响提示，权限/上下文/原子归档失败仍保留；field/interface仍扫archive refs。


## CHANGE-11132｜通话快照不限制字段库删除（SRC-180）

自定义字段删除只核对当前业务分类引用（含隐藏/停用）及其他当前字段的直接依赖；历史已保存字段值、独立归档定义和完整本通/话后字段快照只作保留影响，不阻止删除字段库定义。删除不改写快照、业务数据或草稿；本通继续按开始版保存，后续通话按新配置。权限/目标版本、当前引用或必要快照无法可靠核对、提交失败仍保留原对象，不自动补默认。取数接口的实时资格与来源保留规则不变。

当前用户明确规则沿既有独立模拟授权落实。旧交付包和冻结来源保留原字节，旧包不代表本次更新规则；本次不补造全量G3批准。仍11FUNC/46AC/5PAGE/10ACTION。


## CHANGE-11133｜自定义字段启停操作统一

用户反馈有的字段显示启用/停用、有的没有，现核对为UI将预置类型保护与生命周期混用，以及六统计字段额外禁停。沿已有字段启停语义统一所有字段的操作：已启用显示停用、已停用显示启用；预置类型/选项保护保留，当前启用分类显示的字段须先关闭分类显示，普通依赖及本通快照继续。无数据转换或强制改现存状态，无新增FUNC/AC或外部接口。

step-01核对当前界面与类型/选项保护边界；step-02修复BC行按钮与CB额外禁停，验证预置/接口/普通字段操作、状态持久化、当前分类阻挡及本通保存；step-03核对缓存、原四视图和原图源保持。


## CHANGE-11133追加｜引用入口合并

用户明确“上述查看引用的问题一并解决”。本轮在统一所有字段启停的同时，移除业务分类、自定义字段两张列表的独立查看引用；保留删除时的核对，受阻只显示当前配置引用及去修改入口，旧弹层、身份或租户变化不带入新的编辑。字典的独立权限和来源检查不变。
