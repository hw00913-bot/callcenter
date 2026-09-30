# 资料来源

| Source ID | Name | Type | Location | Version | Status |
| --- | --- | --- | --- | --- | --- |
| SRC-001 | 需求分析冻结基线 | verified-package | inputs/requirement-analysis/ra-alicti--5706c147e80c7271 | 0.1.0 | verified / immutable |
| SRC-002 | alicti-interface-review.md | upstream-evidence-index | inputs/alicti-interface-review.md | frozen | integrity-checked / evidence-only |
| SRC-003 | business-rules.json | upstream-evidence-index | inputs/baseline-reference/memory/business-rules.json | frozen | integrity-checked / evidence-only |
| SRC-004 | feature-list.json | upstream-evidence-index | inputs/baseline-reference/memory/feature-list.json | frozen | integrity-checked / evidence-only |
| SRC-005 | normalized-user-stories.json | upstream-evidence-index | inputs/baseline-reference/memory/normalized-user-stories.json | frozen | integrity-checked / evidence-only |
| SRC-006 | project-facts.json | upstream-evidence-index | inputs/baseline-reference/memory/project-facts.json | frozen | integrity-checked / evidence-only |
| SRC-007 | migration-scope-review.md | upstream-evidence-index | inputs/baseline-reference/outputs/migration-scope-review.md | frozen | integrity-checked / evidence-only |
| SRC-008 | page-index.json | upstream-evidence-index | inputs/baseline-reference/planning/page-index.json | frozen | integrity-checked / evidence-only |
| SRC-009 | open-items.json | upstream-evidence-index | inputs/baseline-reference/runtime/open-items.json | frozen | integrity-checked / evidence-only |
| SRC-010 | SC-001.json | upstream-evidence-index | inputs/baseline-reference/scenarios/SC-001.json | frozen | integrity-checked / evidence-only |
| SRC-011 | SC-002.json | upstream-evidence-index | inputs/baseline-reference/scenarios/SC-002.json | frozen | integrity-checked / evidence-only |
| SRC-012 | SC-003.json | upstream-evidence-index | inputs/baseline-reference/scenarios/SC-003.json | frozen | integrity-checked / evidence-only |
| SRC-013 | SC-005.json | upstream-evidence-index | inputs/baseline-reference/scenarios/SC-005.json | frozen | integrity-checked / evidence-only |
| SRC-014 | SC-006.json | upstream-evidence-index | inputs/baseline-reference/scenarios/SC-006.json | frozen | integrity-checked / evidence-only |
| SRC-015 | SC-007.json | upstream-evidence-index | inputs/baseline-reference/scenarios/SC-007.json | frozen | integrity-checked / evidence-only |
| SRC-016 | SC-008.json | upstream-evidence-index | inputs/baseline-reference/scenarios/SC-008.json | frozen | integrity-checked / evidence-only |
| SRC-017 | SC-009.json | upstream-evidence-index | inputs/baseline-reference/scenarios/SC-009.json | frozen | integrity-checked / evidence-only |
| SRC-018 | SC-011.json | upstream-evidence-index | inputs/baseline-reference/scenarios/SC-011.json | frozen | integrity-checked / evidence-only |
| SRC-019 | SC-014.json | upstream-evidence-index | inputs/baseline-reference/scenarios/SC-014.json | frozen | integrity-checked / evidence-only |
| SRC-020 | SC-015.json | upstream-evidence-index | inputs/baseline-reference/scenarios/SC-015.json | frozen | integrity-checked / evidence-only |
| SRC-021 | SC-016.json | upstream-evidence-index | inputs/baseline-reference/scenarios/SC-016.json | frozen | integrity-checked / evidence-only |
| SRC-022 | SC-017.json | upstream-evidence-index | inputs/baseline-reference/scenarios/SC-017.json | frozen | integrity-checked / evidence-only |
| SRC-023 | SC-018.json | upstream-evidence-index | inputs/baseline-reference/scenarios/SC-018.json | frozen | integrity-checked / evidence-only |
| SRC-024 | SC-019.json | upstream-evidence-index | inputs/baseline-reference/scenarios/SC-019.json | frozen | integrity-checked / evidence-only |
| SRC-025 | SC-020.json | upstream-evidence-index | inputs/baseline-reference/scenarios/SC-020.json | frozen | integrity-checked / evidence-only |
| SRC-026 | SC-101.json | upstream-evidence-index | inputs/baseline-reference/scenarios/SC-101.json | frozen | integrity-checked / evidence-only |
| SRC-027 | SC-102.json | upstream-evidence-index | inputs/baseline-reference/scenarios/SC-102.json | frozen | integrity-checked / evidence-only |
| SRC-028 | SC-103.json | upstream-evidence-index | inputs/baseline-reference/scenarios/SC-103.json | frozen | integrity-checked / evidence-only |
| SRC-029 | SC-104.json | upstream-evidence-index | inputs/baseline-reference/scenarios/SC-104.json | frozen | integrity-checked / evidence-only |
| SRC-030 | SC-105.json | upstream-evidence-index | inputs/baseline-reference/scenarios/SC-105.json | frozen | integrity-checked / evidence-only |
| SRC-031 | SC-201.json | upstream-evidence-index | inputs/baseline-reference/scenarios/SC-201.json | frozen | integrity-checked / evidence-only |
| SRC-032 | SC-203.json | upstream-evidence-index | inputs/baseline-reference/scenarios/SC-203.json | frozen | integrity-checked / evidence-only |
| SRC-033 | SC-204.json | upstream-evidence-index | inputs/baseline-reference/scenarios/SC-204.json | frozen | integrity-checked / evidence-only |
| SRC-034 | SC-205.json | upstream-evidence-index | inputs/baseline-reference/scenarios/SC-205.json | frozen | integrity-checked / evidence-only |
| SRC-035 | SC-206.json | upstream-evidence-index | inputs/baseline-reference/scenarios/SC-206.json | frozen | integrity-checked / evidence-only |
| SRC-036 | scenario-index.json | upstream-evidence-index | inputs/baseline-reference/scenarios/scenario-index.json | frozen | integrity-checked / evidence-only |
| SRC-037 | baseline-snapshot-manifest.json | upstream-evidence-index | inputs/baseline-snapshot-manifest.json | frozen | integrity-checked / evidence-only |
| SRC-038 | glossary.md | upstream-evidence-index | inputs/glossary.md | frozen | integrity-checked / evidence-only |
| SRC-039 | source-index.json | upstream-evidence-index | inputs/source-index.json | frozen | integrity-checked / evidence-only |
| SRC-040 | user-instructions.md | upstream-evidence-index | inputs/user-instructions.md | frozen | integrity-checked / evidence-only |
| SRC-041 | user-stories.md | upstream-evidence-index | inputs/user-stories.md | frozen | integrity-checked / evidence-only |

## Source Policy

- `SRC-001` 是本轮原型的权威业务事实源；其 manifest 和所有文件会在每个后续门禁重新校验。
- 其他 SRC-* 是上游证据索引，仅用于审计追溯；完整性通过不代表原始内容已被业务确认。
- 原型 Agent 不读取 LLM Wiki/query 正文，不访问 wiki_ref/raw_ref 目标；这些字段只保留来源、覆盖与风险元数据。
- 原型业务与字段事实只由冻结结构化结论物化；新增 Wiki 材料或缺口退回需求分析 Loop。

## 当前交付补充来源 2026-09-13

| Source ID | 内容 | 位置 | 范围 |
|---|---|---|---|
| SRC-042 | 37份 AliCti 官方文档快照与87项字段核验 | docs/field-alignment.json；development/reference/alicti | 供应商事实，采集2026-09-11至12；不代表真实联调 |
| SRC-043 | 用户已确认账号、演示签名、技能值域、四步创建、简化重呼及本次交付请求 | docs/decisions.md D-008至D-011 | 当前用户决定，覆盖对应早期决定 |
| SRC-044 | 当前原型页面及已验证映射 | js、mock；docs/functional-spec.json | 当前界面与本地演示行为，不是生产实现 |

当前文档以功能说明、规则附表、字段核验和这些补充来源形成交付快照；原冻结输入保持只读。

SRC-045 · 2026-09-14 用户明确取消 CF-02 中的录音定位，见 docs/decisions.md D-012；对应范围缩减优先于早期时间对齐说明。

## SRC-046 · 供应商补充及用户五项决定（2026-09-14，D-013）

- D-013历史决定：官方路径及能力为准、坐席按接口规则导入、在线限制服从接口、技能1–10；暂停方案已由D-017替代，不再作为当前转换要求。
- 供应商工作簿：AliCti接口缺口与功能对应清单-已补接口.xlsx，SHA-256 e30ae84e79551486b5db92b473e853d783dd29722e04167e406080fa435a320f；号码控制I11/I12、在线I18/I19、技能I20、暂停I21（缺口总览）。
- 官方来源：analysis/field-audit/source-manifest.json新增DOC-341至DOC-345；交付镜像development/reference/alicti。响应形状来自官方示例，单位转换和等级范围来自供应商补充及用户确认，分别注明。
- 当前文档以D-013及本版functional-spec/field-alignment/remaining-confirmations为准；历史冻结来源不覆盖当前决定。


### SRC-047 · D-014 工号类型纠正
2026-09-14，用户在当前会话转述阿里团队：工号必须两者一致，0012与12是两个工号；文档Int是笔误，实际都是String。用于覆盖当前API-302 cno类型及关闭CF-01，原文快照保留。


### SRC-048 · D-015 RASR及预览门控
来源为官方DOC-346/DOC-347（取得时间与SHA256记录在source-manifest.json）、用户供应商截图与采用指令。截图条件及SHA256记录于docs/supplier-clarifications.json。RASR采用范围、开关条件和排除项见D-015。

### SRC-049 · D-016 重呼责任与自动外呼选流

2026-09-14，用户批准重呼执行由阿里负责、本地开关开启完整必填、自动外呼命名与按官方IVR列表选流的方案。官方来源DOC-348/DOC-349为IVR列表及列表详细信息，采集时间与SHA256见source-manifest.json；API-311与DOC-338约束任务及重呼能力。D-016是用户产品范围决定，不是供应商对默认不重呼或共享计数的新澄清。


### SRC-050 · D-017 暂停省略参数与继续路径

2026-09-14，用户决定暂停调用不提交可选pauseDuration，并转述阿里反馈：暂停后继续复用/interface/v10/task/start，先task/get确认暂停；功能不做结束重新开启。来源分类是用户指令与用户转述供应商反馈，详情见docs/decisions.md D-017及docs/supplier-clarifications.json的taskLifecycleClarification；不声明官网已更新。API-313、DOC-333/334/338保留原快照，当前实施采用D-017覆盖D-013暂停时长方案。CF-04仅剩在途通话及排队重呼影响。


### SRC-051 · D-018 两类任务重呼状态配置

2026-09-14，用户要求预测及自动外呼都提供呼叫状态选择。该来源为产品要求，并非供应商确认预测高级策略已可执行。当天重新读取官方API-311/DOC-338，两页SHA256与原缓存一致，分别为d3e0c51d3507d205663f604e637e36e7cb0d38678eafb4abcf7755c23153f58b及726865073451b0cef057053540bb2c9372cd61f63750db0bfe79364478c3f80d。创建页通用参数与TaskProperty仅自动外呼限制仍有口径差异；补充工作簿缺口总览I17只泛指外呼重呼配置，不消除差异。详见docs/supplier-clarifications.json的retryStatusConfigurationDecision及D-018。


### SRC-052 · D-020 预测外呼号码状态重呼澄清

2026-09-15，用户在当前会话转述阿里反馈：“预测外呼也是可以开启按号码状态重呼的”。本来源为user_relayed_supplier_feedback，结合API-311通用重试参数，采用两类任务相同condition.sipCause数组映射，覆盖TaskProperty旧限制在本项目的采用口径；原始官方快照保留，未声称官网文本已改。

此前CF03第二问经复核无默认重呼行为的文档证据，本项目关闭时不传重呼字段及templateName，按不启用重呼处理，实际效果为普通联调验收；这部分属于项目采用决定，不伪造为阿里明确保证。CF03关闭，FA046已修正。


### SRC-053 · D-021 暂停与结束的后续执行规则

2026-09-15，用户在当前会话确认：“暂停后可以继续，结束即不再执行后续呼叫”。来源为user_product_confirmation，不表述为供应商追加反馈。暂停继续调用路径仍采用D017；查询确认结束后不再发起后续首次呼叫或重呼，迟到结果仅补原通话历史，不重新开启任务。未执行任务的后续规则不再作为CF04问题；已发起的拨号、振铃、已接通通话具体如何收尾仍由供应商说明，不擅自挂断或改写终态。


### SRC-072 · D-040 租户专用接听队列与权限下放

2026-09-18，用户确认沿用一个enterpriseId关联多个总部/门店租户，不增加购买授权关系，并要求增加队列、更新文档交付包；随后明确“队列应该要下放到租户管理员”。当前采用超级管理员维护账号范围、ADMIN维护本租户队列的新增/关联/修改/核对/解除权限，查看入口只读，运营拒绝。对应官方API-377～API-385九份队列文档的原HTML、正文和表格存入规范化输入与只读快照；不改旧73份原文，不声称供应商新增答复或真实联调。

### SRC-073 · D-041 预测任务独立坐席分配

依据API-311既有官方callStrategy四种枚举和本轮队列原型实现，预测任务分配独立于队列strategy/weight。新建默认4，旧任务缺字段按官方默认1解释，历史不回填；自动IVR不展示也不提交。该条是官方字段采用与本地交互方案，不是新增供应商澄清。

### SRC-076 · D-046 软电话分机配置与号码租户授权解耦

2026-09-20，用户要求“坐席上线要设置分机号，所以在坐席管理应该加上配置软电话分机号”，并要求“号码-技能组-坐席的残留问题，也要一并修复”；原型修改与本地验证完成后，明确要求“更新说明文档”。来源为用户产品要求与文档同步授权，不是供应商新增澄清。管理员本地维护分机，既有 API-304 Agent.login.bindTel String / bindType=3 承接上线；不新增供应商分机创建或 agent/update 分机写入字段。号码仅授权总部/门店，技能、队列和成员独立核验；旧号码技能绑定不再参与授权、候选、保存与恢复。本轮同步说明、附表、字段、流程时序、蓝图和合并变更记录，不重生开发包，不推送GitLab，不改冻结输入或原始供应商快照。


### SRC-077 · D-047 任务暂停结束后已发起通话正常收尾

2026-09-20，用户转述供应商针对CF-04的答复：“任务暂停或者结束只是管任务的，未呼叫的不会再发起呼叫。已经发起的通话会正常呼叫，通话正常进行。话单就是正常的话单”。来源类型为 `user_relayed_supplier_feedback`，不是官网修订或本地测试推断。按此关闭CF-04：尚未发起呼叫暂停/结束后不再发起，已发起通话正常进行并按正常话单归集；原暂停后查询再继续、结束不重开规则保持。正式说明、附表、字段及相关流程同步；官方快照、运行原型和开发交付包未在本轮更新，未推送GitLab。


### SRC-078 · D-048 号码停用语义与本地使用范围决定

2026-09-20，用户转述供应商答复：“这个号码的状态，如果是停用，以后选号就不会再用这个号码了，对于已经用这个号码呼叫的通话，会正常继续进行”。随后用户明确：“‘从供应商账号解绑号码的接口及查证方式’由本地控制不再支持使用该号码呼叫”。来源类型为 `user_relayed_supplier_feedback_and_scope_decision`：前者是供应商语义，后者是本地产品范围，分别记录。取消远端永久解绑，采用本地可恢复使用启停；供应商status独立维护。已有通话和历史保留，本地启用不绕过供应商停用及权限；呼入入口由呼入规则单独管理，不把本地禁用描述为关闭来电。CF-06关闭；官方快照不改写，不声明真实联调通过，开发包本轮未更新。


## SRC-079 / SRC-080 · 2026-09-20供应商回复截图

来源类型：`user_provided_supplier_reply_image`。由用户在当前会话提供，作为项目采用的供应商澄清；不改写官方快照，不声明生产联调完成。

- SRC-079 / D-049：[CF-14回复截图](../documentation/input/supplier-feedback/SRC-079-cf14-20260920.png)。`telEnterCount` / `String` / 队列来电接听数；`telAnswerCount` / `String` / 进入队列来电数。CF-14关闭，按中文含义映射，保留原键和值及供应商比率。
- SRC-080 / D-050：[CF-08回复截图](../documentation/input/supplier-feedback/SRC-080-cf08-20260920.png)。配置侧按主键物理删除，工号只在当前仍存在坐席中唯一；重建同工号分配新的id和createTime，旧技能/队列成员/绑定电话清掉。话单只记cno、不记坐席主键，历史不随删除消失；按工号查询/报表合并新旧通话。仅解决CF-08重建子问，未提供批量other/success计数关系、技能失败工号或未知写入查证结论。
