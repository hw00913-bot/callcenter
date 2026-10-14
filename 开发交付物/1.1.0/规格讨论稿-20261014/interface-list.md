# 接口与事件清单

业务系统导入客户请看 API-001 / DCC-RST-IMPORT（业务系统 → 呼叫中心）。API-002 / importTaskTel 是呼叫中心 → AliCti 的供应商接口，其参数表不代表业务系统报文。

## 业务系统导入的请求级业务类型

| 字段（拟名） | 业务含义 | 必填 | 说明 |
| --- | --- | --- | --- |
| businessType | 业务类型编码 | 是 | 请求级必填businessType，使用已验真的token租户当前启用的稳定业务类型编码；一次请求仅一种业务类型，适用预外呼及人工外呼。缺失、无效或已停用的新业务请求整次拒收，不保存客户、分配、占用补提交额度或提交供应商。不同类型分次导入，可复用同businessBatchNo；不以来源source或callMode代替类型。 在当前身份/授权复核后，先按原幂等作用域核完整请求内容；businessType纳入内容比较但不新增幂等命名空间。同requestId改类型是内容冲突；已受理同内容技术重放只读返回原回执、不再新增，即使该类型后来停用也不改写已受理记录。不因改类型改变原leadCode/手机号归组、主子批或共享失败累计键。 |

本表仅突出本次新增的请求级字段；callMode、taskId/agentWorkNo、requestId、businessBatchNo等原条件仍见下方DCC-RST-IMPORT。businessType不放进每行CSV，不替代leadCode。

## 业务系统导入的逐行字段

| 字段（拟名） | 业务含义 | 必填 | 说明 |
| --- | --- | --- | --- |
| leadCode | 线索编码 | 是 | 每行必填，保留前导零；用于原线索关联，businessBatchNo不代替它。 |
| phone | 客户手机号 | 是 | 每行必填，按既有固定手机号及号码校验规则；不得转数字丢前导信息。 |
| priority | 优先级 | 是 | 每行必填；正式类型范围待核，人工方式仍保留但不套预测队列。 |
| agentWorkNo | 坐席工号 | 人工外呼必填 | 人工外呼每行必填同租户有效工号并保留前导零；预外呼按任务坐席组，不用它覆盖分配。 |
| intentionStoreCode | 意向门店编码 | 否 | 逐行选填；已填原值保存，保留前导零和大小写；空值规则及长度格式仍待正式契约。 |
| intentionStoreName | 意向门店名称 | 否 | 逐行选填；已填原值保存，保留前导零和大小写；空值规则及长度格式仍待正式契约。 |
| intentionSeriesCode | 意向车系编码 | 否 | 逐行选填；已填原值保存，保留前导零和大小写；空值规则及长度格式仍待正式契约。 |
| intentionSeries | 意向车系 | 否 | 逐行选填；已填原值保存，保留前导零和大小写；空值规则及长度格式仍待正式契约。 |
| smartCode | Smartcode | 否 | 逐行选填；已填原值保存，保留前导零和大小写；空值规则及长度格式仍待正式契约。 |
| leadCreatedAt | 留资时间 | 否 | 留资时间leadCreatedAt是业务系统提供的原线索留资时间，选填；与平台importedAt和跟进savedAt分别保存/展示。未提供不填当前时间，不由其他时间推算；按原提供值透传，正式wire类型、时间格式及时区待S4确认，不凭样例冻结。 |
| R | R（选填） | 否 | 保留原可选元数据，不作为可信来源、租户或回调路由。 |


14条原台账／8组源操作；内部能力是阅读分组，不代表新增已确认端点。missing／partial及退役状态保持原样；文档有端点不等于本项目已联调。

| ID | 接口 | 范围 | 优先级 | 状态 |
| --- | --- | --- | --- | --- |
| API-001 | 业务系统→呼叫中心：应用身份与客户线索导入 | active | P0 · 最高 | missing |
| API-002 | 供应商单号码批次导入 | active | P0 · 必要依赖 | partial |
| API-003 | 供应商呼叫/话单/SIP更新、预测失败与53导入结果事件 | active | P0 · 必要依赖 | partial |
| API-004 | 预测话单查询及秒挂候选数据 | active | 本轮未调整 | partial |
| API-005 | 每日号码状态查询与存量priority修改（已取消，退出当前范围） | retired | 本轮未调整 | not_required |
| API-006 | 精准删除供应商任务内号码 | active | 本轮未调整 | partial |
| API-007 | 平台换主叫接口（退出当前范围） | retired | 本轮未调整 | not_required |
| API-008 | 系统风控解除/恢复接口（本轮不新增平台调用） | retired | 本轮未调整 | not_required |
| API-009 | 本地记录、失败下载生命周期与提交前手工编辑 | active_internal | P0 · 最高 | not_required |
| API-010 | 平台向原应用回调每次结果／进度及独立完成沟通快照 | active | P0 · 必要依赖 | missing |
| API-011 | 预测已失败记录人工异常补提交 | active | 本轮未调整 | missing |
| API-012 | 供应商外显导航配置与自动降级能力证据 | evidence_dependency | 本轮未调整 | partial |
| API-013 | AliCti任务创建/更新的正常重呼配置 | evidence_dependency | 本轮未调整 | partial |
| API-014 | 预测指定记录人工精准删除命令（本平台提案） | active | 本轮未调整 | missing |

**interface_reading_guide**

#### 1

**interface_id**：API-001

**operation_id**：DCC-RST-IMPORT

**方向**：业务系统（DCC/天网等）→呼叫中心

**use**：业务系统导入客户手机号及线索：请求级必填businessType，一次一种；rows.leadCode/phone/priority每条必填，六个来源资料字段选填。

**schema_status**：PROPOSED_CURRENT_SCOPE_NOT_S4_VERIFIED

#### 2

**interface_id**：API-002

**方向**：呼叫中心→AliCti

**use**：平台将预外呼号码提交供应商任务；按供应商taskTelList及实际fileId约定。本方leadCode和六个导入业务字段在平台保存、回调关联，不强行添加供应商字段。 businessType属于本方客户业务归属，不擅自增加到AliCti报文。

**schema_status**：supplier_document_and_current_verification_status_unchanged

**接口操作**

#### DCC-RST-APP-LIST 应用列表

**标识**：DCC-RST-APP-LIST

**名称**：应用列表

**api_id**：API-001

**方向**：现有平台超管→本方管理服务

**方法**：待核／未提供

**路由**：待核／未提供

**核验状态**：missing

**输入**

**existing_admin_identity**：原超管登录身份；查询分页/过滤技术参数待定

**输出**

**items**：应用名称、appId、关联租户、回调配置状态及现有详情/修改/删除定位

**guards**

1. 仅超管；租户管理员/运营/app业务token均不能读取管理列表

2. 读取无写，不自动创建应用

**语义来源**：memory/normalized-user-stories.json#US-009, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-044, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-053, inputs/source-index.json#SRC-118, inputs/source-index.json#SRC-119, inputs/source-index.json#SRC-120, inputs/source-index.json#SRC-121

**状态**：DRAFT_WIRE_UNCONFIRMED

**real_call_allowed**：False

**current_scope_status**：PROPOSED_CURRENT_SCOPE_NOT_S4_VERIFIED

**legacy_operation_id_note**：原追踪 ID 延续；名称含 DCC 的历史 ID 不限制当前所有应用接入范围。

**交付优先级**

**级别**：P0

**角色**：primary

**优先组**

1. P0-APP

**范围**：本操作的应用管理、应用与租户多对多关联及按操作适用的独立回调地址保存；沿现有超管权限。

#### DCC-RST-APP-DETAIL 应用详情

**标识**：DCC-RST-APP-DETAIL

**名称**：应用详情

**api_id**：API-001

**方向**：现有平台超管→本方管理服务

**方法**：待核／未提供

**路由**：待核／未提供

**核验状态**：missing

**输入**

**appId**：指定已保存应用

**输出**

**appId**：原ID

**appName**：应用名称

**appSecret**：原业务要求的接入密钥；生产展示/存储策略unknown

**authorizedTenantIds**：实际保存的关联租户列表；应用与租户多对多

**callbackUrl**：本应用保存的回调地址；URL 校验及变更后积压结果取值规则待审

**guards**

1. 准确目标且仅超管；不存在/已删除不显示其他应用

2. 查看无写，日常页仅必要密钥用途信息

3. 同租户可关联其他应用；应用各自保存回调，历史多关联不按旧一对一方案删除/合并。

**语义来源**：memory/normalized-user-stories.json#US-009, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-044, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-054, memory/normalized-user-stories.json#AC-058, inputs/source-index.json#SRC-118, inputs/source-index.json#SRC-119, inputs/source-index.json#SRC-120, inputs/source-index.json#SRC-121

**状态**：DRAFT_WIRE_UNCONFIRMED

**real_call_allowed**：False

**current_scope_status**：PROPOSED_CURRENT_SCOPE_NOT_S4_VERIFIED

**legacy_operation_id_note**：原追踪 ID 延续；名称含 DCC 的历史 ID 不限制当前所有应用接入范围。

**交付优先级**

**级别**：P0

**角色**：primary

**优先组**

1. P0-APP

**范围**：本操作的应用管理、应用与租户多对多关联及按操作适用的独立回调地址保存；沿现有超管权限。

**局部原型证据**

**标识**：UI-LOCAL-APPLICATION-CALLBACK-20261014

**证据**

1. prototype/memory/verification-evidence/application-callback-ui-20261014.json

**范围**：本地合成应用新增/编辑可保存callbackUrl，详情可回读；允许未配置应用先保存但合成接口导入会拒绝，手工UI导入不受该门槛影响。http(s)基础格式/禁止内嵌账号密码为本地演示校验，正式URL安全/积压选址/后端鉴权/ACK仍待核；未实现真实回调。

**full_acceptance_suite_executed**：False

**formal_gates_changed**：False

**real_calls_enabled**：False

#### DCC-RST-APP-CREATE 新增应用并生成接入凭证

**标识**：DCC-RST-APP-CREATE

**名称**：新增应用并生成接入凭证

**api_id**：API-001

**方向**：现有平台超管→本方管理服务

**方法**：待核／未提供

**路由**：待核／未提供

**核验状态**：missing

**输入**

**appName**：应用名称

**authorizedTenantIds**：选择授权业务租户

**callbackUrl**：保存本应用回调地址；未配置禁止接口导入。是否可保存无地址的配置草稿、表单必填规则待评审确认。

**输出**

**appId**：服务端生成

**appSecret**：服务端生成；算法及存储未知

**authorizedTenantIds**：实际保存的关联租户列表；应用与租户多对多

**callbackUrl**：本应用保存的回调地址；URL 校验及变更后积压结果取值规则待审

**guards**

1. 仅有效保存成功才产生已保存应用/凭证

2. 取消/失败不伪造成功；不新增启停/密钥重置/收费或账号授权动作

3. 同租户可关联其他应用；应用各自保存回调，历史多关联不按旧一对一方案删除/合并。

**语义来源**：memory/normalized-user-stories.json#US-009, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-044, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-055, inputs/source-index.json#SRC-118, inputs/source-index.json#SRC-119, inputs/source-index.json#SRC-120, inputs/source-index.json#SRC-121

**状态**：DRAFT_WIRE_UNCONFIRMED

**real_call_allowed**：False

**current_scope_status**：PROPOSED_CURRENT_SCOPE_NOT_S4_VERIFIED

**legacy_operation_id_note**：原追踪 ID 延续；名称含 DCC 的历史 ID 不限制当前所有应用接入范围。

**交付优先级**

**级别**：P0

**角色**：primary

**优先组**

1. P0-APP

**范围**：本操作的应用管理、应用与租户多对多关联及按操作适用的独立回调地址保存；沿现有超管权限。

**局部原型证据**

**标识**：UI-LOCAL-APPLICATION-CALLBACK-20261014

**证据**

1. prototype/memory/verification-evidence/application-callback-ui-20261014.json

**范围**：本地合成应用新增/编辑可保存callbackUrl，详情可回读；允许未配置应用先保存但合成接口导入会拒绝，手工UI导入不受该门槛影响。http(s)基础格式/禁止内嵌账号密码为本地演示校验，正式URL安全/积压选址/后端鉴权/ACK仍待核；未实现真实回调。

**full_acceptance_suite_executed**：False

**formal_gates_changed**：False

**real_calls_enabled**：False

#### DCC-RST-APP-UPDATE 修改应用名称、关联租户和回调地址

**标识**：DCC-RST-APP-UPDATE

**名称**：修改应用名称、关联租户和回调地址

**api_id**：API-001

**方向**：现有平台超管→本方管理服务

**方法**：待核／未提供

**路由**：待核／未提供

**核验状态**：missing

**输入**

**appId**：指定应用

**appName**：新名称

**authorizedTenantIds**：本次授权租户范围

**callbackUrl**：保存本应用回调地址；未配置禁止接口导入。是否可保存无地址的配置草稿、表单必填规则待评审确认。

**输出**

**appId**：原ID保持

**appSecretChanged**：False

**authorizedTenantIds**：实际保存的关联租户列表；应用与租户多对多

**callbackUrl**：本应用保存的回调地址；URL 校验及变更后积压结果取值规则待审

**guards**

1. 普通修改不重置appId/密钥

2. 取消/失败保持原配置；撤销租户授权后业务调用不得继续越权，真实已发token失效机制须工程核验

3. 同租户可关联其他应用；应用各自保存回调，历史多关联不按旧一对一方案删除/合并。

4. 回调地址变更和解除关联后的积压结果路由/旧 token/在途请求保留策略未定，不丢失记录或自动改发其他应用。

**语义来源**：memory/normalized-user-stories.json#US-009, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-044, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-056, inputs/source-index.json#SRC-118, inputs/source-index.json#SRC-119, inputs/source-index.json#SRC-120, inputs/source-index.json#SRC-121

**状态**：DRAFT_WIRE_UNCONFIRMED

**real_call_allowed**：False

**current_scope_status**：PROPOSED_CURRENT_SCOPE_NOT_S4_VERIFIED

**legacy_operation_id_note**：原追踪 ID 延续；名称含 DCC 的历史 ID 不限制当前所有应用接入范围。

**交付优先级**

**级别**：P0

**角色**：primary

**优先组**

1. P0-APP

**范围**：本操作的应用管理、应用与租户多对多关联及按操作适用的独立回调地址保存；沿现有超管权限。

**局部原型证据**

**标识**：UI-LOCAL-APPLICATION-CALLBACK-20261014

**证据**

1. prototype/memory/verification-evidence/application-callback-ui-20261014.json

**范围**：本地合成应用新增/编辑可保存callbackUrl，详情可回读；允许未配置应用先保存但合成接口导入会拒绝，手工UI导入不受该门槛影响。http(s)基础格式/禁止内嵌账号密码为本地演示校验，正式URL安全/积压选址/后端鉴权/ACK仍待核；未实现真实回调。

**full_acceptance_suite_executed**：False

**formal_gates_changed**：False

**real_calls_enabled**：False

#### DCC-RST-APP-DELETE 删除指定应用

**标识**：DCC-RST-APP-DELETE

**名称**：删除指定应用

**api_id**：API-001

**方向**：现有平台超管→本方管理服务

**方法**：待核／未提供

**路由**：待核／未提供

**核验状态**：missing

**输入**

**appId**：指定应用

**confirmed**：确认语义；生产命令类型/版本幂等待设计

**输出**

**appId**：原目标

**deleted**：仅保存明确成功才true

**guards**

1. 取消不删、保存失败不先撤销或宣称成功

2. 旧凭证不能再换token；已发token撤销机制unknown

3. 其他应用/业务任务/记录/结果和必要来源审计保留

4. 保留原 app/tenant/record 归属和待回调结果；删除后的补送目标及凭据失效待工程协议，不能转发其他应用。

**语义来源**：memory/normalized-user-stories.json#US-009, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-044, memory/normalized-user-stories.json#AC-045, memory/normalized-user-stories.json#AC-057, inputs/source-index.json#SRC-118, inputs/source-index.json#SRC-119, inputs/source-index.json#SRC-120, inputs/source-index.json#SRC-121

**状态**：DRAFT_WIRE_UNCONFIRMED

**real_call_allowed**：False

**current_scope_status**：PROPOSED_CURRENT_SCOPE_NOT_S4_VERIFIED

**legacy_operation_id_note**：原追踪 ID 延续；名称含 DCC 的历史 ID 不限制当前所有应用接入范围。

**交付优先级**

**级别**：P0

**角色**：primary

**优先组**

1. P0-APP

**范围**：本操作的应用管理、应用与租户多对多关联及按操作适用的独立回调地址保存；沿现有超管权限。

#### DCC-RST-TOKEN 应用凭证换指定租户token

**标识**：DCC-RST-TOKEN

**名称**：应用凭证换指定租户token

**api_id**：API-001

**方向**：各接入业务系统→呼叫中心

**方法**：待核／未提供

**路由**：待核／未提供

**核验状态**：missing

**输入**

**appId**：建议字段；真实命名类型待确认

**appSecret**：建议字段；真实命名类型待确认

**tenantId**：本次明确选择的目标租户；缺失不默认首个或最近租户

**输出**

**accessToken**：建议字段，仅授权tenant身份

**tokenType**：未定；不得宣称已有Bearer支持

**expiresIn**：未定，不拟固定TTL

**tenantId**：实际绑定的单个目标租户；同一应用可分别申请已关联租户 A/B 身份

**appId**：业务 token 可由后端可信恢复的稳定应用身份；是否对外返回待契约确认

**guards**

1. 校验有效应用凭证及当前 app↔tenant 关联，再签发绑定稳定 app 与单 tenant 的业务 token；关联关系多对多。

2. 缺 tenantId、未知/未关联租户拒绝；业务接口不得用正文 tenant/source 覆盖 token 身份。

3. A 租户身份请求 B 租户任务、坐席或记录拒绝；来源按稳定应用登记，正文 source 仅可作一致性检查。

4. token 不授应用管理权；任务归租户，不因多个应用而复制任务。

5. 同一稳定 app 更换有效 token 不改变请求命名空间；撤关联、删除应用后的旧 token/在途请求行为和失效机制仍待工程契约。

**语义来源**：memory/normalized-user-stories.json#US-009, memory/normalized-user-stories.json#AC-017, memory/normalized-user-stories.json#AC-044, memory/normalized-user-stories.json#AC-045, inputs/source-index.json#SRC-118, inputs/source-index.json#SRC-119, inputs/source-index.json#SRC-120, inputs/source-index.json#SRC-121

**状态**：DRAFT_WIRE_UNCONFIRMED

**real_call_allowed**：False

**current_scope_status**：PROPOSED_CURRENT_SCOPE_NOT_S4_VERIFIED

**legacy_operation_id_note**：原追踪 ID 延续；名称含 DCC 的历史 ID 不限制当前所有应用接入范围。

**交付优先级**

**级别**：P0

**角色**：primary

**优先组**

1. P0-APP

**范围**：应用凭证与显式 tenantId 换取绑定稳定 app/单租户的身份，校验有效关联并拒绝缺租户或越租户。

#### DCC-RST-IMPORT 各应用共用线索接收：预外呼或指定坐席人工外呼

**标识**：DCC-RST-IMPORT

**名称**：各应用共用线索接收：预外呼或指定坐席人工外呼

**api_id**：API-001

**方向**：各接入业务系统→呼叫中心

**方法**：待核／未提供

**路由**：待核／未提供

**核验状态**：missing

**输入**

**tenant_business_identity**：从有效 token 恢复稳定 app/tenant 并复核当前关联

**callMode**：候选字段：预外呼/人工外呼；枚举值及请求层级待 S4

**taskId**：预外呼必填的原供应商任务 ID；校验该任务在 token 绑定租户下的保存归属、有效性及原任务操作权限；人工方式不要求或伪造预测 taskId。字段名和报文层级仍待正式契约。

**agentWorkNo**：人工方式每行指定同租户有效坐席工号，字符串保留前导零；预外呼仍按任务坐席组，人工工号不能覆盖分配

**requestId**：本次业务请求身份；tenant+stableApp+operation+requestId 为建议命名空间

**来源**：如保留，仅与应用登记来源核对，不用于切身份/租户/回调

**rows**：每行rows必须明确包含leadCode（线索编码）、phone（客户手机号）、priority（优先级）；人工方式该行agentWorkNo条件必填。选填业务字段为intentionStoreCode（意向门店编码）、intentionStoreName（意向门店名称）、intentionSeriesCode（意向车系编码）、intentionSeries（意向车系）、smartCode（Smartcode），leadCreatedAt（留资时间），以及原R等适用字段；两种外呼方式均逐行保存本次原值。正式字段层级与类型/范围待核，人工不生成预测root/fileId。

**businessBatchNo**：请求级必传的外部业务批次号候选字段，适用全部应用和两外呼方式；原值随记录保存。同app+tenant多次导入可复用，各次新请求requestId仍独立；正式字段层级/格式待核。

**businessType**：请求级必填businessType，使用已验真的token租户当前启用的稳定业务类型编码；一次请求仅一种业务类型，适用预外呼及人工外呼。缺失、无效或已停用的新业务请求整次拒收，不保存客户、分配、占用补提交额度或提交供应商。不同类型分次导入，可复用同businessBatchNo；不以来源source或callMode代替类型。

**输出**

**requestId**：原请求

**rows**：逐行原保存/分配或预测受理结果；不把本地成功当已拨通

**tenantId**：原 token 绑定租户

**appId**：原稳定调用应用的保存归属；是否返回及字段名待正式契约

**businessBatchNo**：可回显该请求原业务批次号，正式同步回执字段待核；所有后续适用业务回调携带对应记录原值。

**guards**

1. 先当前鉴权及app↔tenant授权复核、原请求完整内容比较；已受理同内容只读回执不再导入。仅新业务核本app回调配置、当前租户启用businessType、模式、任务/坐席及批次；缺必要项不产生新客户/分配/批次/供应商提交。

2. 候选幂等tenant+stableApp+operation+requestId；完整内容含businessBatchNo、方式、任务/工号和全部行。相同内容返原处理结果；同requestId更改业务批次号等内容冲突且不覆盖原值。换source不另获作用域。

3. 预外呼 taskId 必填且代表原供应商任务 ID，核其归 token 租户、任务有效性及原权限后沿任务坐席组；人工 agentWorkNo 必填，按同租户有效坐席工号保存并分配待联系，不立即拨号或调用 importTaskTel，不造预测 taskId/fileId。

4. 人工工号无效、冲突或关联无效，该行失败/待核不猜配；其他有效行继续。保存与分配原子/恢复待验证。

5. 每条记录固化原 app/tenant/登记来源，全部应用接口来源按原 app 配置回调，人工外呼也适用；无接入 app 的手工 UI 来源不外发。

6. 预测主子批/单号 fileId、priority 优先与失败累计沿现有规则；人工保留必填 priority，但不套预测队列、批次或失败补提交规则。

7. 回调删除与导入并发、历史技术重放只读回执、请求保留期和关联撤销后的在途规则待 S4/工程验证。

8. 新请求缺业务批次号不得新增导入记录/分配/供应商提交；同app+tenant以新requestId复用业务批次号不因重号拒绝。准确必填校验/错误与旧请求兼容仍待正式契约。

9. businessBatchNo仅业务关联，不代替主子批/root、供应商fileId、leadCode或技术幂等键；不以该号单独归并客户、结果或补提交额度。

10. 六个导入业务字段逐行选填，两种外呼方式均适用；未传或留空不阻止合法导入。已填按字符串原值保存，编码和Smartcode保留前导零与大小写，不转数值、不凭名称查补编码、不凭编码补名称。各项可独立填写，不要求代码名称成对齐全；正式长度、格式、空值与错误码待核。不代替leadCode、requestId、businessBatchNo或填单plannedStoreName，也不改变原应用/租户/线索/通话归属。

11. 留资时间leadCreatedAt是业务系统提供的原线索留资时间，选填；与平台importedAt和跟进savedAt分别保存/展示。未提供不填当前时间，不由其他时间推算；按原提供值透传，正式wire类型、时间格式及时区待S4确认，不凭样例冻结。

12. 请求级必填businessType，使用已验真的token租户当前启用的稳定业务类型编码；一次请求仅一种业务类型，适用预外呼及人工外呼。缺失、无效或已停用的新业务请求整次拒收，不保存客户、分配、占用补提交额度或提交供应商。不同类型分次导入，可复用同businessBatchNo；不以来源source或callMode代替类型。

13. 在当前身份/授权复核后，先按原幂等作用域核完整请求内容；businessType纳入内容比较但不新增幂等命名空间。同requestId改类型是内容冲突；已受理同内容技术重放只读返回原回执、不再新增，即使该类型后来停用也不改写已受理记录。不因改类型改变原leadCode/手机号归组、主子批或共享失败累计键。

14. 每条成功接收记录固化本次原businessType稳定码及当时显示名称，准确关联原app/tenant/request/row/record与本call；历史缺失不批量补值，不按最近同号、来源或外呼方式猜类型。后续名称/启停配置变化不改原类型码或来源快照。

**语义来源**：memory/normalized-user-stories.json#US-010, memory/normalized-user-stories.json#AC-007, memory/normalized-user-stories.json#AC-009, memory/normalized-user-stories.json#AC-012, memory/normalized-user-stories.json#AC-047, memory/normalized-user-stories.json#AC-048, memory/normalized-user-stories.json#AC-049, memory/normalized-user-stories.json#AC-050, memory/normalized-user-stories.json#AC-051, inputs/source-index.json#SRC-118, inputs/source-index.json#SRC-119, inputs/source-index.json#SRC-120, inputs/source-index.json#SRC-121, inputs/source-index.json#SRC-123, memory/normalized-user-stories.json#AC-093, memory/normalized-user-stories.json#AC-094, inputs/source-index.json#SRC-124, memory/normalized-user-stories.json#AC-099, inputs/source-index.json#SRC-125, memory/normalized-user-stories.json#AC-102, memory/normalized-user-stories.json#AC-103, memory/normalized-user-stories.json#AC-104

**状态**：DRAFT_WIRE_UNCONFIRMED

**real_call_allowed**：False

**current_scope_status**：PROPOSED_CURRENT_SCOPE_NOT_S4_VERIFIED

**legacy_operation_id_note**：原追踪 ID 延续；名称含 DCC 的历史 ID 不限制当前所有应用接入范围。

**交付优先级**

**级别**：P0

**角色**：primary

**优先组**

1. P0-IMPORT

**范围**：全部接入应用共用预外呼／人工外呼线索导入，含回调前置、请求幂等、预测指定任务与人工指定工号的归属和有效性校验。 本轮含必传可复用的外部业务批次号及原值保存。 同时含六个逐行选填业务字段，保持原值及原记录关联。

**row_fields_schema**

#### 1

**存储语义键**：leadCode

**label**：线索编码

**required**：True

**类型**：string

**field_ref**：DFIELD-032

**rule**：每行必填，保留前导零；用于原线索关联，businessBatchNo不代替它。

#### 2

**存储语义键**：phone

**label**：客户手机号

**required**：True

**类型**：string

**field_ref**：DFIELD-033

**rule**：每行必填，按既有固定手机号及号码校验规则；不得转数字丢前导信息。

#### 3

**存储语义键**：priority

**label**：优先级

**required**：True

**类型**：production_type_and_range_pending

**field_ref**：DFIELD-034

**rule**：每行必填；正式类型范围待核，人工方式仍保留但不套预测队列。

#### 4

**存储语义键**：agentWorkNo

**label**：坐席工号

**required**：manual_only

**类型**：string

**field_ref**：DFIELD-110

**rule**：人工外呼每行必填同租户有效工号并保留前导零；预外呼按任务坐席组，不用它覆盖分配。

#### 5

**存储语义键**：intentionStoreCode

**label**：意向门店编码

**required**：False

**类型**：string

**field_ref**：DFIELD-126

**rule**：逐行选填；已填原值保存，保留前导零和大小写；空值规则及长度格式仍待正式契约。

**来源**：inputs/source-index.json#SRC-124, memory/normalized-user-stories.json#AC-099

#### 6

**存储语义键**：intentionStoreName

**label**：意向门店名称

**required**：False

**类型**：string

**field_ref**：DFIELD-127

**rule**：逐行选填；已填原值保存，保留前导零和大小写；空值规则及长度格式仍待正式契约。

**来源**：inputs/source-index.json#SRC-124, memory/normalized-user-stories.json#AC-099

#### 7

**存储语义键**：intentionSeriesCode

**label**：意向车系编码

**required**：False

**类型**：string

**field_ref**：DFIELD-128

**rule**：逐行选填；已填原值保存，保留前导零和大小写；空值规则及长度格式仍待正式契约。

**来源**：inputs/source-index.json#SRC-124, memory/normalized-user-stories.json#AC-099

#### 8

**存储语义键**：intentionSeries

**label**：意向车系

**required**：False

**类型**：string

**field_ref**：DFIELD-129

**rule**：逐行选填；已填原值保存，保留前导零和大小写；空值规则及长度格式仍待正式契约。

**来源**：inputs/source-index.json#SRC-124, memory/normalized-user-stories.json#AC-099

#### 9

**存储语义键**：smartCode

**label**：Smartcode

**required**：False

**类型**：string

**field_ref**：DFIELD-130

**rule**：逐行选填；已填原值保存，保留前导零和大小写；空值规则及长度格式仍待正式契约。

**来源**：inputs/source-index.json#SRC-124, memory/normalized-user-stories.json#AC-099

#### 10

**存储语义键**：leadCreatedAt

**label**：留资时间

**required**：False

**类型**：source_time_wire_type_format_timezone_pending

**field_ref**：DFIELD-131

**rule**：留资时间leadCreatedAt是业务系统提供的原线索留资时间，选填；与平台importedAt和跟进savedAt分别保存/展示。未提供不填当前时间，不由其他时间推算；按原提供值透传，正式wire类型、时间格式及时区待S4确认，不凭样例冻结。

**来源**：inputs/source-index.json#SRC-124, memory/normalized-user-stories.json#AC-099

#### 11

**存储语义键**：R

**label**：R（选填）

**required**：False

**类型**：production_type_pending

**field_ref**：DFIELD-035

**rule**：保留原可选元数据，不作为可信来源、租户或回调路由。

**row_fields_schema_status**：PROPOSED_CURRENT_SCOPE_NOT_S4_VERIFIED

**row_fields_schema_note**：此表是业务系统→呼叫中心导入的候选rows字段展开；leadCode仍每条必填。requestId、businessBatchNo、callMode及预外呼taskId在请求上下文的具体层级仍待正式契约；不是AliCti的taskTelList字段表。

**business_type_contract**

**存储语义键**：businessType

**field_ref**：DFIELD-024

**级别**：request

**required**：True

**wire_type**：string_code

**one_type_per_request**：True

**authority**：authenticated_token_tenant_enabled_stable_business_type_code

**new_request_validation**：请求级必填businessType，使用已验真的token租户当前启用的稳定业务类型编码；一次请求仅一种业务类型，适用预外呼及人工外呼。缺失、无效或已停用的新业务请求整次拒收，不保存客户、分配、占用补提交额度或提交供应商。不同类型分次导入，可复用同businessBatchNo；不以来源source或callMode代替类型。

**idempotency**：在当前身份/授权复核后，先按原幂等作用域核完整请求内容；businessType纳入内容比较但不新增幂等命名空间。同requestId改类型是内容冲突；已受理同内容技术重放只读返回原回执、不再新增，即使该类型后来停用也不改写已受理记录。不因改类型改变原leadCode/手机号归组、主子批或共享失败累计键。

**persist**：每条成功接收记录固化本次原businessType稳定码及当时显示名称，准确关联原app/tenant/request/row/record与本call；历史缺失不批量补值，不按最近同号、来源或外呼方式猜类型。后续名称/启停配置变化不改原类型码或来源快照。

**display_and_form**：客户名单和详情显示本次保存的业务类型名称，详情保留其编码；坐席跟进按本条原类型自动使用对应业务表单，来源类型只读，不按其他同手机号记录或应用来源重选。历史无值显示未提供并保持原处理边界；已停用/无法解析的表单保留原值并明确待处理，不偷偷换成其他业务类型。原手工弹窗仍使用既有业务类型选择，不增加逐行CSV必填列。

**callback**：每次结果/进度及已完成沟通回调均携准确原app/tenant/record/call导入时保存的businessType稳定码和既有businessBatchNo；补送沿原事件快照。类型后续改名或停用不重算原码，历史未知不猜值，不只回传类型名称，也不替代已填字段/选项业务编码。正式回调报文与ACK仍待契约及工程验证。

**classification_keys_unchanged**：True

**formal_contract_status**：PROPOSED_CURRENT_SCOPE_NOT_S4_VERIFIED

**来源**：inputs/source-index.json#SRC-125, memory/normalized-user-stories.json#AC-102, memory/normalized-user-stories.json#AC-103, memory/normalized-user-stories.json#AC-104

**request_fields_schema**

#### 1

**存储语义键**：businessType

**label**：业务类型编码

**required**：True

**field_ref**：DFIELD-024

**类型**：string

**rule**：请求级必填businessType，使用已验真的token租户当前启用的稳定业务类型编码；一次请求仅一种业务类型，适用预外呼及人工外呼。缺失、无效或已停用的新业务请求整次拒收，不保存客户、分配、占用补提交额度或提交供应商。不同类型分次导入，可复用同businessBatchNo；不以来源source或callMode代替类型。 在当前身份/授权复核后，先按原幂等作用域核完整请求内容；businessType纳入内容比较但不新增幂等命名空间。同requestId改类型是内容冲突；已受理同内容技术重放只读返回原回执、不再新增，即使该类型后来停用也不改写已受理记录。不因改类型改变原leadCode/手机号归组、主子批或共享失败累计键。

**request_fields_schema_status**：request_business_type_delta_only_not_complete_formal_schema

#### API-010-DELIVERY-GROUP 全部应用每次结果／进度和新增完成沟通事件回调通道

**标识**：API-010-DELIVERY-GROUP

**id_authority**：reading_alias_for_existing_API010_not_new_endpoint

**名称**：全部应用每次结果／进度和新增完成沟通事件回调通道

**api_id**：API-010

**方向**：平台→原接入应用业务系统；接收方→业务 ACK

**方法**：待核／未提供

**路由**：待核／未提供

**核验状态**：missing

**状态**：DRAFT_WIRE_UNCONFIRMED

**real_call_allowed**：False

**current_scope_status**：PROPOSED_CURRENT_SCOPE_NOT_S4_VERIFIED

**legacy_operation_id_note**：原追踪 ID 延续；名称含 DCC 的历史 ID 不限制当前所有应用接入范围。

**语义来源**：inputs/source-index.json#SRC-118, inputs/source-index.json#SRC-119, inputs/source-index.json#SRC-120, inputs/source-index.json#SRC-121, inputs/source-index.json#SRC-123, memory/normalized-user-stories.json#AC-095, memory/normalized-user-stories.json#AC-096, memory/normalized-user-stories.json#AC-097, memory/normalized-user-stories.json#AC-098

**输入**

**original_identity**：保存的原 app/tenant/record/request/attempt 或人工 call/followup 关联

**callback_configuration**：原应用自己的配置；变更后积压版本策略待核

**businessBatchNo**：对应原记录保存的外部业务批次号，所有适用回调携带；历史缺失明确保留，不猜造。

**completion_event**：同一通道接收新增独立EVENT-FOLLOWUP-COMPLETED候选，由本次成功保存快照生成，不替代原每次结果/进度。

**business_field_codes**：本次已填写的客户业务信息，包含选填字段，均随快照携带字段业务编码及保存值；有选项时携对应选项业务编码/值，多选完整保留全部选中编码。不能只发显示label、内部字段ID或内部选项ID。保存时固定对应配置编码/版本，后续配置变更不改补送；未填写不猜造编码值，历史缺业务编码明确待核。正式载荷字段名和嵌套schema仍为proposed。

**guards**

1. DCC、天网及其他应用均适用；外呼方式不决定是否回调。

2. 手工 UI 无接入 app 仅在平台查看；不能按最近 token 租户、body source 或 root 转发。

3. 保存成功不是业务系统接收成功；完成事件严格按本次外呼结束、已完成沟通结果、完整保存成功触发，补送保持原快照。

**交付优先级**

**级别**：P0

**角色**：dependency

**优先组**

1. P0-APP

2. P0-IMPORT

3. P0-FOLLOWUP

**范围**：已约定的全部接入应用结果／进度及适用人工跟进信息回调，维持原 app/tenant 归属；补送只送原结果，不再拨号。

**interfaces**

#### API-001 业务系统→呼叫中心：应用身份与客户线索导入

**标识**：API-001

**名称**：业务系统→呼叫中心：应用身份与客户线索导入

**方向**：DCC／天网→平台接入；超管→平台应用管理

**kind**：application_management_and_shared_external_ingest

**用途**：各系统独立应用、各自回调；同 app 可服务多个租户，导入以 token 绑定的单租户处理。 供DCC、天网等业务系统导入客户线索；对应DCC-RST-IMPORT。API-002是平台再调用AliCti的下游号码导入，两者请求字段职责不同。

**范围**：active

**核验状态**：missing

**production_ready**：False

**real_call_allowed**：False

**文档端点**：待核／未提供

**文档方法**：待核／未提供

**生产路由**：待核／未提供

**production_route_status**：not_confirmed_or_not_applicable

**输入**

1. 从有效 token 恢复稳定 app/tenant 并复核当前关联

2. 候选字段：预外呼/人工外呼；枚举值及请求层级待 S4

3. 预外呼必填的原供应商任务 ID；校验该任务在 token 绑定租户下的保存归属、有效性及原任务操作权限；人工方式不要求或伪造预测 taskId。字段名和报文层级仍待正式契约。

4. 人工方式每行指定同租户有效坐席工号，字符串保留前导零；预外呼仍按任务坐席组，人工工号不能覆盖分配

5. 本次业务请求身份；tenant+stableApp+operation+requestId 为建议命名空间

6. 如保留，仅与应用登记来源核对，不用于切身份/租户/回调

7. 每行rows必须明确包含leadCode（线索编码）、phone（客户手机号）、priority（优先级）；人工方式该行agentWorkNo条件必填。选填业务字段为intentionStoreCode（意向门店编码）、intentionStoreName（意向门店名称）、intentionSeriesCode（意向车系编码）、intentionSeries（意向车系）、smartCode（Smartcode），leadCreatedAt（留资时间），以及原R等适用字段；两种外呼方式均逐行保存本次原值。正式字段层级与类型/范围待核，人工不生成预测root/fileId。

8. 请求级必传的外部业务批次号候选字段，适用全部应用和两外呼方式；原值随记录保存。同app+tenant多次导入可复用，各次新请求requestId仍独立；正式字段层级/格式待核。

9. 六个导入业务字段逐行选填，两种外呼方式均适用；未传或留空不阻止合法导入。已填按字符串原值保存，编码和Smartcode保留前导零与大小写，不转数值、不凭名称查补编码、不凭编码补名称。各项可独立填写，不要求代码名称成对齐全；正式长度、格式、空值与错误码待核。不代替leadCode、requestId、businessBatchNo或填单plannedStoreName，也不改变原应用/租户/线索/通话归属。

10. 留资时间leadCreatedAt是业务系统提供的原线索留资时间，选填；与平台importedAt和跟进savedAt分别保存/展示。未提供不填当前时间，不由其他时间推算；按原提供值透传，正式wire类型、时间格式及时区待S4确认，不凭样例冻结。

11. 请求级必填businessType，使用已验真的token租户当前启用的稳定业务类型编码；一次请求仅一种业务类型，适用预外呼及人工外呼。缺失、无效或已停用的新业务请求整次拒收，不保存客户、分配、占用补提交额度或提交供应商。不同类型分次导入，可复用同businessBatchNo；不以来源source或callMode代替类型。

**输出**

1. 原请求

2. 逐行原保存/分配或预测受理结果；不把本地成功当已拨通

3. 原 token 绑定租户

4. 原稳定调用应用的保存归属；是否返回及字段名待正式契约

5. 可回显该请求原业务批次号，正式同步回执字段待核；所有后续适用业务回调携带对应记录原值。

**authentication**：候选方案：应用凭证+显式 tenantId，验证当前关联后绑定稳定 app/tenant；每次业务调用复核授权。缺 tenant 或跨租户均拒绝，不按第一个/最近租户推断。应用五管理操作仅现有超管。

**idempotency**：候选tenant+stableApp+operation+requestId；完整内容包含businessBatchNo、businessType、callMode、人工agentWorkNo、预测taskId及全部行。同requestId同内容返回原逐行结果，不重导/重派；业务批次号改变属于冲突。先当前鉴权、归属复核；新requestId可复用批次号，其他业务守卫不变。正式保留期/原子性/旧请求兼容待核。 完整逐行内容同时包含六个选填导入业务字段；同requestId改变任一已提供值按内容冲突，不以同业务批次号或同手机号覆盖原字段。 在当前身份/授权复核后，先按原幂等作用域核完整请求内容；businessType纳入内容比较但不新增幂等命名空间。同requestId改类型是内容冲突；已受理同内容技术重放只读返回原回执、不再新增，即使该类型后来停用也不改写已受理记录。不因改类型改变原leadCode/手机号归组、主子批或共享失败累计键。

**timeout**：未核实；未知结果暂停，不自动当失败

**rate_limit**：本方导入/认证/管理接口频率、请求大小与幂等保留期尚未定义；供应商上传限制不自动成为DCC请求限制。

**errors**



**guards_and_limits**

1. 先当前鉴权及app↔tenant授权复核、原请求完整内容比较；已受理同内容只读回执不再导入。仅新业务核本app回调配置、当前租户启用businessType、模式、任务/坐席及批次；缺必要项不产生新客户/分配/批次/供应商提交。

2. 候选幂等tenant+stableApp+operation+requestId；完整内容含businessBatchNo、方式、任务/工号和全部行。相同内容返原处理结果；同requestId更改业务批次号等内容冲突且不覆盖原值。换source不另获作用域。

3. 预外呼 taskId 必填且代表原供应商任务 ID，核其归 token 租户、任务有效性及原权限后沿任务坐席组；人工 agentWorkNo 必填，按同租户有效坐席工号保存并分配待联系，不立即拨号或调用 importTaskTel，不造预测 taskId/fileId。

4. 人工工号无效、冲突或关联无效，该行失败/待核不猜配；其他有效行继续。保存与分配原子/恢复待验证。

5. 每条记录固化原 app/tenant/登记来源，全部应用接口来源按原 app 配置回调，人工外呼也适用；无接入 app 的手工 UI 来源不外发。

6. 预测主子批/单号 fileId、priority 优先与失败累计沿现有规则；人工保留必填 priority，但不套预测队列、批次或失败补提交规则。

7. 回调删除与导入并发、历史技术重放只读回执、请求保留期和关联撤销后的在途规则待 S4/工程验证。

8. 新请求缺业务批次号不得新增导入记录/分配/供应商提交；同app+tenant以新requestId复用业务批次号不因重号拒绝。准确必填校验/错误与旧请求兼容仍待正式契约。

9. businessBatchNo仅业务关联，不代替主子批/root、供应商fileId、leadCode或技术幂等键；不以该号单独归并客户、结果或补提交额度。

10. 六个导入业务字段逐行选填，两种外呼方式均适用；未传或留空不阻止合法导入。已填按字符串原值保存，编码和Smartcode保留前导零与大小写，不转数值、不凭名称查补编码、不凭编码补名称。各项可独立填写，不要求代码名称成对齐全；正式长度、格式、空值与错误码待核。不代替leadCode、requestId、businessBatchNo或填单plannedStoreName，也不改变原应用/租户/线索/通话归属。

11. 留资时间leadCreatedAt是业务系统提供的原线索留资时间，选填；与平台importedAt和跟进savedAt分别保存/展示。未提供不填当前时间，不由其他时间推算；按原提供值透传，正式wire类型、时间格式及时区待S4确认，不凭样例冻结。

12. 请求级必填businessType，使用已验真的token租户当前启用的稳定业务类型编码；一次请求仅一种业务类型，适用预外呼及人工外呼。缺失、无效或已停用的新业务请求整次拒收，不保存客户、分配、占用补提交额度或提交供应商。不同类型分次导入，可复用同businessBatchNo；不以来源source或callMode代替类型。

13. 在当前身份/授权复核后，先按原幂等作用域核完整请求内容；businessType纳入内容比较但不新增幂等命名空间。同requestId改类型是内容冲突；已受理同内容技术重放只读返回原回执、不再新增，即使该类型后来停用也不改写已受理记录。不因改类型改变原leadCode/手机号归组、主子批或共享失败累计键。

14. 每条成功接收记录固化本次原businessType稳定码及当时显示名称，准确关联原app/tenant/request/row/record与本call；历史缺失不批量补值，不按最近同号、来源或外呼方式猜类型。后续名称/启停配置变化不改原类型码或来源快照。

**open_issue_ids**

1. ISSUE-002

2. ISSUE-031

3. ISSUE-043

4. ISSUE-044

5. ISSUE-045

**source_ref**：需求/1.1.0/分析工作区/interfaces/interface-index.json#API-001

**来源**：inputs/source-index.json#SRC-028, inputs/source-index.json#SRC-035, inputs/source-index.json#SRC-052, inputs/source-index.json#SRC-061, inputs/source-index.json#SRC-062, inputs/source-index.json#SRC-063, inputs/source-index.json#SRC-064, inputs/source-index.json#SRC-065, inputs/source-index.json#SRC-066, inputs/source-index.json#SRC-067, inputs/source-index.json#SRC-068, inputs/source-index.json#SRC-069, inputs/source-index.json#SRC-070, inputs/source-index.json#SRC-074, inputs/source-index.json#SRC-083, inputs/source-index.json#SRC-084, inputs/source-index.json#SRC-085, inputs/source-index.json#SRC-086, inputs/source-index.json#SRC-087, inputs/source-index.json#SRC-089, inputs/source-index.json#SRC-091, inputs/source-index.json#SRC-094, inputs/source-index.json#SRC-095, inputs/source-index.json#SRC-096, inputs/source-index.json#SRC-102, inputs/source-index.json#SRC-103, inputs/source-index.json#SRC-106, inputs/source-index.json#SRC-109, inputs/source-index.json#SRC-110, inputs/source-index.json#SRC-115, inputs/source-index.json#SRC-116

**documented_endpoint_authority**：no_confirmed_endpoint_or_retired

**source_refs_authority**：原供应商/旧 S4 追踪引用；本轮 S4 未重跑，不是当前已审接口契约

**historical_sequence_refs**

#### 1

**sequence_id**：SEQ-001

**message_id**：SEQ-001-M002

**kind**：external_call

**方向**：ingest_client→service

**条件**：[同步请求] 已登记应用的后台身份申请，当前只方案/合成；非日常UI新动作

#### 2

**sequence_id**：SEQ-001

**message_id**：SEQ-001-M003

**kind**：response

**方向**：service→ingest_client

**条件**：[同步返回] 仅对本次交换的实际明确结果；生产协议未验证

#### 3

**sequence_id**：SEQ-001

**message_id**：SEQ-001-M004

**kind**：external_call

**方向**：ingest_client→service

**条件**：[同步请求] DCC或天网新业务或本app技术重传；不发真实调用

#### 4

**sequence_id**：SEQ-001

**message_id**：SEQ-001-M005-D

**kind**：response

**方向**：service→ingest_client

**条件**：[同步返回] 当前鉴权/归属/稳定来源守卫不通过；后续新行步骤不执行

#### 5

**sequence_id**：SEQ-001

**message_id**：SEQ-001-M006

**kind**：response

**方向**：service→ingest_client

**条件**：[同步返回] 已通过当前鉴权，且本app作用域已有相同完整内容；仅重放，不进入新请求提交

#### 6

**sequence_id**：SEQ-001

**message_id**：SEQ-001-M007

**kind**：response

**方向**：service→ingest_client

**条件**：[同步返回] 已通过当前鉴权，本app已有ID且内容不同

#### 7

**sequence_id**：SEQ-001

**message_id**：SEQ-001-M014

**kind**：response

**方向**：service→ingest_client

**条件**：[同步返回] 新请求接收/来源/回执落账准确确认，包含全坏行回执；在供应商提交前发生

#### 8

**sequence_id**：SEQ-005

**message_id**：SEQ-005-M002

**kind**：request

**方向**：ui→service

**条件**：[同步内部请求] 原APP-LIST操作；真实管理method/route仍missing

#### 9

**sequence_id**：SEQ-005

**message_id**：SEQ-005-M002-D

**kind**：response

**方向**：service→ui

**条件**：[同步返回] 任一管理请求非超管/当前权限不能确认

#### 10

**sequence_id**：SEQ-005

**message_id**：SEQ-005-M003

**kind**：response

**方向**：service→ui

**条件**：[同步返回] 当前管理权与列表读取结果明确

#### 11

**sequence_id**：SEQ-005

**message_id**：SEQ-005-M005

**kind**：request

**方向**：ui→service

**条件**：[同步内部请求] 原APP-CREATE；取消/失败不造新应用或密钥

#### 12

**sequence_id**：SEQ-005

**message_id**：SEQ-005-M006

**kind**：response

**方向**：service→ui

**条件**：[同步返回] 当前新增结果与对象准确关联

#### 13

**sequence_id**：SEQ-005

**message_id**：SEQ-005-M007-A

**kind**：request

**方向**：ui→service

**条件**：[同步内部请求] 原APP-DETAIL；无写

#### 14

**sequence_id**：SEQ-005

**message_id**：SEQ-005-M007-B

**kind**：response

**方向**：service→ui

**条件**：[同步返回] 精确详情读取明确；错误对象/无权明确拒绝

#### 15

**sequence_id**：SEQ-005

**message_id**：SEQ-005-M009

**kind**：request

**方向**：ui→service

**条件**：[同步内部请求] 原APP-UPDATE；失败原配置不变、不重置密钥

#### 16

**sequence_id**：SEQ-005

**message_id**：SEQ-005-M010

**kind**：response

**方向**：service→ui

**条件**：[同步返回] 本次当前修改结果，不新增启停/重置

#### 17

**sequence_id**：SEQ-005

**message_id**：SEQ-005-M012

**kind**：request

**方向**：ui→service

**条件**：[同步内部请求] 原APP-DELETE；非供应商号码删除，不向DCC/TW开放内部运营删除

#### 18

**sequence_id**：SEQ-005

**message_id**：SEQ-005-M013

**kind**：response

**方向**：service→ui

**条件**：[同步返回] 当前精确删除保存结果

#### 19

**sequence_id**：SEQ-005

**message_id**：SEQ-005-M014

**kind**：external_call

**方向**：dcc→service

**条件**：[同步请求] 原TOKEN操作独立于五管理操作，当前仅方案/合成

#### 20

**sequence_id**：SEQ-005

**message_id**：SEQ-005-M015

**kind**：response

**方向**：service→dcc

**条件**：[同步返回] 实际本次发放/拒绝明确；字段/TTL/撤权/稳定app协议仍missing

**historical_sequence_refs_status**：stale_after_SRC118_121_scope_change

**current_scope_source_refs**

1. inputs/source-index.json#SRC-118

2. inputs/source-index.json#SRC-119

3. inputs/source-index.json#SRC-120

4. inputs/source-index.json#SRC-121

5. inputs/source-index.json#SRC-123

6. memory/normalized-user-stories.json#AC-093

7. memory/normalized-user-stories.json#AC-094

8. inputs/source-index.json#SRC-124

9. memory/normalized-user-stories.json#AC-099

10. inputs/source-index.json#SRC-125

11. memory/normalized-user-stories.json#AC-102

12. memory/normalized-user-stories.json#AC-103

13. memory/normalized-user-stories.json#AC-104

**current_scope_contract_status**：PROPOSED_CURRENT_SCOPE_NOT_S4_VERIFIED

**verification_status_authority**：沿原台账，只说明既有文档核验程度；本轮自定义契约未验证

**current_operation_ids**

1. DCC-RST-APP-LIST

2. DCC-RST-APP-DETAIL

3. DCC-RST-APP-CREATE

4. DCC-RST-APP-UPDATE

5. DCC-RST-APP-DELETE

6. DCC-RST-TOKEN

7. DCC-RST-IMPORT

**business_batch_contract**

**状态**：PROPOSED_CURRENT_SCOPE_NOT_S4_VERIFIED

**applicable_call_modes**

1. predictive

**group**：token tenant+原供应商 taskId+leadCode，同组 phone 固定

**isNewBatch**：逐行可选 Boolean，缺省 false；true 可另开主批，false/缺省新子批关联最近已保存主批，无主自动首主。

**technical_replay**：先幂等返原记录/主子结果，不重新选主批。

**supplier_mapping**：供应商导入按实际单号 attempt 保存精确 fileId；不把 root 或本地展示批号当供应商 fileId。

**manual_mode**：不生成预测 taskId/root/fileId；独立客户/导入/分配身份和 call 关联待本方契约。

**failure_budget**：另开主批或换应用不重置同租户+任务+线索+手机号共享额外 2 次。

**namespace_note**：此既有对象描述平台预测主/子批次，不是外部businessBatchNo；外部业务批次另见external_business_batch_contract。

**交付优先级**

**级别**：P0

**角色**：primary

**优先组**

1. P0-APP

2. P0-IMPORT

**范围**：应用 CRUD/多租户关联/独立回调配置、显式租户 token 与外部双方式线索导入；正式本方报文仍为提案。 导入含请求级必传可复用业务批次号；原手工CSV不增加必填。 六个选填导入业务字段原值接收/保存。

**external_business_batch_contract**

**状态**：PROPOSED_CURRENT_SCOPE_NOT_S4_VERIFIED

**field_proposal**：businessBatchNo

**field_id**：DFIELD-124

**applicability**：全部应用接口新业务导入，预外呼与人工外呼均适用；原手工CSV不新增此必填。

**required**：True

**placement_proposal**：请求级必传，由该请求有效保存的每条记录继承原值；正式字段名/层级/长度/格式/错误结构待S4。

**reusable_scope**：同一原稳定app+tenant可在多个新业务请求复用同值；不设业务批次唯一约束，跨app或tenant同字面值隔离。

**保存**：随准确原app/tenant/record保存外部原值，回调原样携带；不以最近请求或同号其他记录覆盖。

**not_identifiers**

1. requestId

2. batchId

3. rootBatchId

4. fileId

5. taskId

6. leadCode

**idempotency**：候选tenant+stableApp+operation+requestId及完整请求摘要包含businessBatchNo；同requestId改批次号冲突且不覆盖原数据。新requestId可复用批次号，但仍沿其他业务守卫。

**history**：历史缺值明确保留，不从平台批次/fileId/R或最近请求猜造；旧调用兼容及错误结构待正式契约。

**unchanged_rules**：原预测taskId、主子批/精确fileId、固定手机号和共享额外2次规则不变；业务批次号复用或变化不重置次数。人工仍按工号分配，不造预测标识。

**交付优先级**

**级别**：P0

**角色**：primary

**优先组**

1. P0-IMPORT

**范围**：全部应用接口导入的必传可复用业务批次号及准确回调关联；不扩大手工CSV必填。

**来源**：inputs/source-index.json#SRC-123, memory/normalized-user-stories.json#AC-093, memory/normalized-user-stories.json#AC-094, memory/normalized-user-stories.json#AC-096

**row_fields_schema**

#### 1

**存储语义键**：leadCode

**label**：线索编码

**required**：True

**类型**：string

**field_ref**：DFIELD-032

**rule**：每行必填，保留前导零；用于原线索关联，businessBatchNo不代替它。

#### 2

**存储语义键**：phone

**label**：客户手机号

**required**：True

**类型**：string

**field_ref**：DFIELD-033

**rule**：每行必填，按既有固定手机号及号码校验规则；不得转数字丢前导信息。

#### 3

**存储语义键**：priority

**label**：优先级

**required**：True

**类型**：production_type_and_range_pending

**field_ref**：DFIELD-034

**rule**：每行必填；正式类型范围待核，人工方式仍保留但不套预测队列。

#### 4

**存储语义键**：agentWorkNo

**label**：坐席工号

**required**：manual_only

**类型**：string

**field_ref**：DFIELD-110

**rule**：人工外呼每行必填同租户有效工号并保留前导零；预外呼按任务坐席组，不用它覆盖分配。

#### 5

**存储语义键**：intentionStoreCode

**label**：意向门店编码

**required**：False

**类型**：string

**field_ref**：DFIELD-126

**rule**：逐行选填；已填原值保存，保留前导零和大小写；空值规则及长度格式仍待正式契约。

**来源**：inputs/source-index.json#SRC-124, memory/normalized-user-stories.json#AC-099

#### 6

**存储语义键**：intentionStoreName

**label**：意向门店名称

**required**：False

**类型**：string

**field_ref**：DFIELD-127

**rule**：逐行选填；已填原值保存，保留前导零和大小写；空值规则及长度格式仍待正式契约。

**来源**：inputs/source-index.json#SRC-124, memory/normalized-user-stories.json#AC-099

#### 7

**存储语义键**：intentionSeriesCode

**label**：意向车系编码

**required**：False

**类型**：string

**field_ref**：DFIELD-128

**rule**：逐行选填；已填原值保存，保留前导零和大小写；空值规则及长度格式仍待正式契约。

**来源**：inputs/source-index.json#SRC-124, memory/normalized-user-stories.json#AC-099

#### 8

**存储语义键**：intentionSeries

**label**：意向车系

**required**：False

**类型**：string

**field_ref**：DFIELD-129

**rule**：逐行选填；已填原值保存，保留前导零和大小写；空值规则及长度格式仍待正式契约。

**来源**：inputs/source-index.json#SRC-124, memory/normalized-user-stories.json#AC-099

#### 9

**存储语义键**：smartCode

**label**：Smartcode

**required**：False

**类型**：string

**field_ref**：DFIELD-130

**rule**：逐行选填；已填原值保存，保留前导零和大小写；空值规则及长度格式仍待正式契约。

**来源**：inputs/source-index.json#SRC-124, memory/normalized-user-stories.json#AC-099

#### 10

**存储语义键**：leadCreatedAt

**label**：留资时间

**required**：False

**类型**：source_time_wire_type_format_timezone_pending

**field_ref**：DFIELD-131

**rule**：留资时间leadCreatedAt是业务系统提供的原线索留资时间，选填；与平台importedAt和跟进savedAt分别保存/展示。未提供不填当前时间，不由其他时间推算；按原提供值透传，正式wire类型、时间格式及时区待S4确认，不凭样例冻结。

**来源**：inputs/source-index.json#SRC-124, memory/normalized-user-stories.json#AC-099

#### 11

**存储语义键**：R

**label**：R（选填）

**required**：False

**类型**：production_type_pending

**field_ref**：DFIELD-035

**rule**：保留原可选元数据，不作为可信来源、租户或回调路由。

**row_fields_schema_status**：PROPOSED_CURRENT_SCOPE_NOT_S4_VERIFIED

**row_fields_schema_note**：此表是业务系统→呼叫中心导入的候选rows字段展开；leadCode仍每条必填。requestId、businessBatchNo、callMode及预外呼taskId在请求上下文的具体层级仍待正式契约；不是AliCti的taskTelList字段表。

**business_type_contract**

**存储语义键**：businessType

**field_ref**：DFIELD-024

**级别**：request

**required**：True

**wire_type**：string_code

**one_type_per_request**：True

**authority**：authenticated_token_tenant_enabled_stable_business_type_code

**new_request_validation**：请求级必填businessType，使用已验真的token租户当前启用的稳定业务类型编码；一次请求仅一种业务类型，适用预外呼及人工外呼。缺失、无效或已停用的新业务请求整次拒收，不保存客户、分配、占用补提交额度或提交供应商。不同类型分次导入，可复用同businessBatchNo；不以来源source或callMode代替类型。

**idempotency**：在当前身份/授权复核后，先按原幂等作用域核完整请求内容；businessType纳入内容比较但不新增幂等命名空间。同requestId改类型是内容冲突；已受理同内容技术重放只读返回原回执、不再新增，即使该类型后来停用也不改写已受理记录。不因改类型改变原leadCode/手机号归组、主子批或共享失败累计键。

**persist**：每条成功接收记录固化本次原businessType稳定码及当时显示名称，准确关联原app/tenant/request/row/record与本call；历史缺失不批量补值，不按最近同号、来源或外呼方式猜类型。后续名称/启停配置变化不改原类型码或来源快照。

**display_and_form**：客户名单和详情显示本次保存的业务类型名称，详情保留其编码；坐席跟进按本条原类型自动使用对应业务表单，来源类型只读，不按其他同手机号记录或应用来源重选。历史无值显示未提供并保持原处理边界；已停用/无法解析的表单保留原值并明确待处理，不偷偷换成其他业务类型。原手工弹窗仍使用既有业务类型选择，不增加逐行CSV必填列。

**callback**：每次结果/进度及已完成沟通回调均携准确原app/tenant/record/call导入时保存的businessType稳定码和既有businessBatchNo；补送沿原事件快照。类型后续改名或停用不重算原码，历史未知不猜值，不只回传类型名称，也不替代已填字段/选项业务编码。正式回调报文与ACK仍待契约及工程验证。

**classification_keys_unchanged**：True

**formal_contract_status**：PROPOSED_CURRENT_SCOPE_NOT_S4_VERIFIED

**来源**：inputs/source-index.json#SRC-125, memory/normalized-user-stories.json#AC-102, memory/normalized-user-stories.json#AC-103, memory/normalized-user-stories.json#AC-104

**request_fields_schema**

#### 1

**存储语义键**：businessType

**label**：业务类型编码

**required**：True

**field_ref**：DFIELD-024

**类型**：string

**rule**：请求级必填businessType，使用已验真的token租户当前启用的稳定业务类型编码；一次请求仅一种业务类型，适用预外呼及人工外呼。缺失、无效或已停用的新业务请求整次拒收，不保存客户、分配、占用补提交额度或提交供应商。不同类型分次导入，可复用同businessBatchNo；不以来源source或callMode代替类型。 在当前身份/授权复核后，先按原幂等作用域核完整请求内容；businessType纳入内容比较但不新增幂等命名空间。同requestId改类型是内容冲突；已受理同内容技术重放只读返回原回执、不再新增，即使该类型后来停用也不改写已受理记录。不因改类型改变原leadCode/手机号归组、主子批或共享失败累计键。

**request_fields_schema_status**：request_business_type_delta_only_not_complete_formal_schema

**business_type_local_evidence**

**标识**：UI-LOCAL-API-BUSINESS-TYPE-20261014

**source_id**：SRC-125

**说明**：请求级业务类型校验、原码保存/回执/既有结果模拟，原名单/详情和跟进按原类型。

**证据**

1. prototype/memory/verification-evidence/api-business-type-20261014.json

**verification**

**source_checks_passed**：40

**source_checks_failed**：0

**syntax_checks_passed**：5

**browser**：1280x720原名单类型列与客户详情通过，错误日志为空；浏览器未调用外部接收接口。

**验证边界**

1. 仅现有预外呼本地合成接收、准确记录/结果传播及原类型跟进表单；完整人工外呼接口、真实鉴权、业务批次号、完成沟通事件和真实回调仍未实现或未验证，未执行整版S8/三宽度验证。

**full_acceptance_suite_executed**：False

**formal_gates_changed**：False

**real_calls_enabled**：False

#### API-002 供应商单号码批次导入

**标识**：API-002

**名称**：供应商单号码批次导入

**方向**：平台提交服务→AliCti

**kind**：supplier_import

**用途**：初始有效导入及平台失败补提交均复用供应商单号码导入能力，记录实际返回fileId；受理不等呼叫。

**范围**：active

**核验状态**：partial

**production_ready**：False

**real_call_allowed**：False

**文档端点**：/interface/{version}/task/importTaskTel

**文档方法**：待核／未提供

**生产路由**：待核／未提供

**production_route_status**：not_confirmed_or_not_applicable

**输入**

1. taskId

2. name（供应商文档必填批次名称）

3. taskTelList[].tel

4. taskTelList[].priority

5. fileId（可选；传入表示在已有供应商批次增加号码）

6. isRepeat（可选；0不排重、1任务内排重、2导入号码排重、3批次内排重，默认1）

7. importTelAutoStart（可选，默认0；实际使用配置待核）

**输出**

1. result

2. description

3. errorCode（文档：result=-1时返回错误码）

4. data.fileId

5. data.taskId

6. data.importTotal 请求号码总数

7. data.successTotal 成功导入号码数

8. data.invalidTotal 非法号码数

**authentication**：供应商既有鉴权及原租户/任务调用资格仍需核验；见SRC-057原文，不创建对外应用、密钥或本平台token。

**idempotency**：同一初始手工导入操作不重复创建记录或外发；平台内部补提交使用独立业务尝试身份、稳定触发事件去重与额度原子占用。真实技术键/本方持久化/传输幂等及供应商排重语义待核。未知响应保留同尝试及占用，不新建业务尝试盲目重发。

**timeout**：未核实；未知结果暂停，不自动当失败

**rate_limit**：归档导入数量上限不是业务呼叫超频解除依据

**errors**



**guards_and_limits**

1. 仅适用于本行预测业务范围；人工模式的身份/拨号/结果契约独立待核。

2. 业务batch/root与供应商fileId分别保存；root只用于业务关联，不当供应商查询或删除参数。

3. 每次新业务尝试独立fileId是待供应商核实的建议，不能直接沿旧fileId追加或默认isRepeat/importTelAutoStart。

4. 补提交固定触发记录原root、task、来源与priority；同四元组累计首次外2次，已发起的明确接收/拒绝均计，UNKNOWN保留原尝试与占用。

5. 同步result=0及汇总数量不自动指定逐条成功；明确导入失败不触发11类呼叫失败链。

**open_issue_ids**

1. ISSUE-002

2. ISSUE-029

3. ISSUE-035

4. ISSUE-037

5. ISSUE-038

**source_ref**：需求/1.1.0/分析工作区/interfaces/interface-index.json#API-002

**来源**：inputs/interface-documents/API-312.txt#L35, inputs/interface-documents/API-312.txt#L100-L191, inputs/source-index.json#SRC-061, inputs/source-index.json#SRC-062, inputs/source-index.json#SRC-063, inputs/source-index.json#SRC-064, inputs/source-index.json#SRC-065, inputs/source-index.json#SRC-066, inputs/source-index.json#SRC-067, inputs/source-index.json#SRC-068, inputs/source-index.json#SRC-069, inputs/source-index.json#SRC-070, inputs/source-index.json#SRC-071, inputs/source-index.json#SRC-072, inputs/source-index.json#SRC-073, inputs/source-index.json#SRC-076, inputs/source-index.json#SRC-077, inputs/source-index.json#SRC-078, inputs/source-index.json#SRC-079, inputs/source-index.json#SRC-080, inputs/source-index.json#SRC-083, inputs/source-index.json#SRC-084, inputs/source-index.json#SRC-085, inputs/source-index.json#SRC-086, inputs/source-index.json#SRC-089, inputs/source-index.json#SRC-090, inputs/source-index.json#SRC-091, inputs/source-index.json#SRC-092, inputs/source-index.json#SRC-093, inputs/source-index.json#SRC-094, inputs/source-index.json#SRC-096, inputs/source-index.json#SRC-097, inputs/source-index.json#SRC-098, inputs/source-index.json#SRC-100, inputs/source-index.json#SRC-102, inputs/source-index.json#SRC-103, inputs/interface-documents/live-312.txt#L23-L31, inputs/interface-documents/live-312.txt#L64-L69, inputs/source-index.json#SRC-106, inputs/source-index.json#SRC-109, inputs/source-index.json#SRC-110, inputs/source-index.json#SRC-115, inputs/source-index.json#SRC-116, inputs/source-index.json#SRC-117

**documented_endpoint_authority**：supplier_document_not_target_deployment_verified

**source_refs_authority**：原供应商/旧 S4 追踪引用；本轮 S4 未重跑，不是当前已审接口契约

**historical_sequence_refs**

#### 1

**sequence_id**：SEQ-001

**message_id**：SEQ-001-M011

**kind**：external_call

**方向**：service→vendor

**条件**：[同步请求] 原接收/来源回执已持久保存且有新有效行；非重传/UNKNOWN，运行任务矩阵/同号执行权仍partial

#### 2

**sequence_id**：SEQ-001

**message_id**：SEQ-001-M012

**kind**：response

**方向**：vendor→service

**条件**：[同步返回] 实际得到供应商明确响应；未返回走UNKNOWN而非伪造response

#### 3

**sequence_id**：SEQ-003

**message_id**：SEQ-003-LOCAL-023

**kind**：external_call

**方向**：service→vendor

**条件**：独占持久预占与执行权仍有效，外发前再次核同目标取消；UNKNOWN技术恢复不能另建尝试或new fileId

#### 4

**sequence_id**：SEQ-003

**message_id**：SEQ-003-LOCAL-025

**kind**：response

**方向**：vendor→service

**条件**：明确得到本次供应商响应，受理不等实际呼叫

#### 5

**sequence_id**：SEQ-006

**message_id**：SEQ-006-LOCAL-022

**kind**：external_call

**方向**：service→vendor

**条件**：有效新业务行已保存且本次未发起；同确认重放或提交UNKNOWN不能再执行

#### 6

**sequence_id**：SEQ-006

**message_id**：SEQ-006-LOCAL-023

**kind**：response

**方向**：vendor→service

**条件**：本次明确同步响应；无响应不伪造

**historical_sequence_refs_status**：stale_after_SRC118_121_scope_change

**current_scope_source_refs**

1. inputs/source-index.json#SRC-118

2. inputs/source-index.json#SRC-119

3. inputs/source-index.json#SRC-120

4. inputs/source-index.json#SRC-121

**current_scope_contract_status**：PROPOSED_CURRENT_SCOPE_NOT_S4_VERIFIED

**verification_status_authority**：沿原台账，只说明既有文档核验程度；本轮自定义契约未验证

**applicable_call_modes**

1. predictive

**applicability_note**：本行已核文档/使用方案为预测业务；人工外呼不能默认复用，实际人工协议需另核。

**交付优先级**

**级别**：P0

**角色**：dependency

**优先组**

1. P0-IMPORT

**范围**：仅外部预外呼导入后的首次供应商单号码提交与实际 fileId 保存为本次闭环依赖；历史失败补提交职责不因本次整体升优先级，人工方式不使用。

#### API-003 供应商呼叫/话单/SIP更新、预测失败与53导入结果事件

**标识**：API-003

**名称**：供应商呼叫/话单/SIP更新、预测失败与53导入结果事件

**方向**：AliCti→平台事件接收；平台集成配置→AliCti订阅配置

**kind**：supplier_events_and_subscription

**用途**：分开接收普通call/SIP、52预测失败、53导入失败；准确验真、去重关联、持久保存及结果分流。

**范围**：active

**核验状态**：partial

**production_ready**：False

**real_call_allowed**：False

**文档端点**：/cc/create_push_action（配置接口；实际回调契约待核）

**文档方法**：待核／未提供

**生产路由**：待核／未提供

**production_route_status**：not_confirmed_or_not_applicable

**输入**

1. 推送设置配置（不是业务回调完整契约）

**输出**

1. 推送类型表：16预测外呼客户接听、52预测呼叫失败、53导入号码失败、1060降级执行结果（各自真实报文契约待核）

2. 失败原因文档.enterpriseId

3. 失败原因文档.taskId

4. 失败原因文档.fileId

5. 失败原因文档.customerNumber

6. 失败原因文档.customerAreaCode/customerProvince/customerCity

7. 失败原因文档.failType（1风控拦截、2其它）

8. 失败原因文档.message（文档失败原因描述）

9. 失败原因文档.callTime

10. 客户接听状态文档.result（success/error）及taskId/fileId/tel

11. 53.enterpriseId

12. 53.taskId

13. 53.fileId

14. 53.fileName

15. 53.totalFailedCount

16. 53.totalBatchCount

17. 53.currentBatchCount

18. 53.failedTelList[].原始导入数据

19. 53.failedTelList[].failedReason

20. 挂机变量预测外呼原文：cdr_enterprise_id/cdr_task_id/cdr_task_file_id/cdr_customer_number/cdr_main_unique_id/cdr_request_unique_id（实际稳定身份/精确关联仍待核，不与失败事件字段混装）

21. 挂机变量原文：cdr_call_type/cdr_status/cdr_sip_cause/cdr_end_reason及接听/开始/结束等原始字段（须按类型/版本核可信语义，不据主通道挂断等于客户挂断）

22. 纯SIP包及同call可信SIP晚更新的准确生产事件类型/结构/认证/重放仍未完整核验；原source/可信程度保留，不能用推送类型34的SIP接入事件替代预测呼叫SIP晚更新契约

**authentication**：供应商订阅配置API的调用鉴权与平台接收52/53事件的验真分开。已有公共HTTP接收及API鉴权资料；实际52/53接收端的验真、订阅资格及防重放契约仍待核，不需要本轮新增DCC token或应用凭证。

**idempotency**：可信稳定事件身份和准确批次关联后仅首次确认建立一个处理对象/计划；重复、乱序、原请求重传或同对象晚更新不再占额度、不重启120秒。实际事件ID、鉴权/ACK/重放/丢失/迟到更正契约未核，不能凭手机号或当前最近主猜配。 公共HTTP200接收依据不保证事件已持久保存；传输重试的稳定身份、重复接收持久化及业务确认ACK仍须具体协议和工程证据。

**timeout**：供应商推送配置timeout范围1~10，查询推送设置详情明确单位秒；retryStrategy.intervalTime单位秒。它们是HTTP推送传输设置，不是本轮失败补提交120秒或额外2次。实际配置、超时/非2xx/HTTP200内业务拒绝的重试触发仍待核；未知业务结果暂停，不自动当失败。

**rate_limit**：归档导入数量上限不是业务呼叫超频解除依据

**errors**



**guards_and_limits**

1. 仅适用于本行预测业务范围；人工模式的身份/拨号/结果契约独立待核。

2. /cc/create_push_action是订阅配置地址，不能标成本平台业务回调接收URL。实际接收method/route/验真/稳定事件身份未定。

3. 公共HTTP接收文档提success／200OK，不决定具体body与HTTP状态的AND/OR，更不证明业务持久ACK、恰好一次或稳定失败身份。

4. 53按核实enterprise→tenant、task、实际fileId及原始号码关联；分片齐只证明声明推送组，不代表全导入终态，未收到不推定零失败。

5. 52的呼叫过频只走原生任务规则；其他11类进入三自动/八人工处理。53和同步导入拒绝不进入该策略。

6. 重复事件与可信SIP晚更沿同一原对象；不重复占额度、不重启120秒；未可信SIP独立待核，不污染已确认call。

**open_issue_ids**

1. ISSUE-002

2. ISSUE-005

3. ISSUE-027

4. ISSUE-035

5. ISSUE-041

**source_ref**：需求/1.1.0/分析工作区/interfaces/interface-index.json#API-003

**来源**：inputs/interface-documents/API-315.txt#L13-L19, inputs/interface-documents/API-315.txt#L202-L210, inputs/source-index.json#SRC-061, inputs/source-index.json#SRC-063, inputs/source-index.json#SRC-064, inputs/source-index.json#SRC-065, inputs/source-index.json#SRC-066, inputs/source-index.json#SRC-067, inputs/source-index.json#SRC-068, inputs/source-index.json#SRC-069, inputs/source-index.json#SRC-070, inputs/source-index.json#SRC-071, inputs/source-index.json#SRC-072, inputs/source-index.json#SRC-073, inputs/source-index.json#SRC-082, inputs/source-index.json#SRC-083, inputs/source-index.json#SRC-084, inputs/source-index.json#SRC-085, inputs/source-index.json#SRC-086, inputs/source-index.json#SRC-089, inputs/source-index.json#SRC-090, inputs/source-index.json#SRC-091, inputs/source-index.json#SRC-092, inputs/source-index.json#SRC-093, inputs/source-index.json#SRC-094, inputs/source-index.json#SRC-096, inputs/source-index.json#SRC-099, inputs/source-index.json#SRC-102, inputs/source-index.json#SRC-103, inputs/interface-documents/预测外呼呼叫失败推送变量.txt#L4-L27, candidate-supplier-review/预测外呼客户接听状态推送变量.txt#L4-L8, candidate-supplier-review/live-315.txt#L55-L61, candidate-supplier-review/live-fail-import.txt#L4-L19, inputs/source-index.json#SRC-106, inputs/source-index.json#SRC-109, inputs/source-index.json#SRC-110, inputs/interface-documents/API-315.txt#L184-L210, candidate-supplier-review/挂机推送时底层变量和值.txt#L122-L157, inputs/source-index.json#SRC-114, inputs/source-index.json#SRC-112, inputs/source-index.json#SRC-115, inputs/source-index.json#SRC-116

**documented_endpoint_authority**：supplier_document_not_target_deployment_verified

**documented_transport_evidence**

**来源**：inputs/source-index.json#SRC-112

**状态**：documented_subclauses_production_pending

**common_http_receipt**

**source_evidence_ids**

1. EV-CB-HTTP200

**ack_text**：文档写success并解释网络200OK

**precise_body_or_AND_OR_contract**：not_defined

**persistent_business_ack**：not_proven

**http_transport_retry**

**source_evidence_ids**

1. EV-CB-RETRY

2. EV-CB-TYPES

3. EV-CB-INTERVAL

4. EV-CB-TIMEOUTUNIT

**event_types_documented**

1. 52

2. 53

**top_interval_range**

1. 0

2. 60

**nested_interval_unit**：seconds

**nested_overrides_top**：True

**timeout_range_seconds**

1. 1

2. 10

**trigger_and_same_event_retry_identity**：pending

**business_failure_budget_or_timer_changed**：False

**top_level_retry_range**

1. 0

2. 3

**nested_retry_range_status**：not_explicit_in_selected_substructure

**documented_endpoint_role**：subscription_configuration_only_not_platform_callback_URL

**source_refs_authority**：原供应商/旧 S4 追踪引用；本轮 S4 未重跑，不是当前已审接口契约

**historical_sequence_refs**

#### 1

**sequence_id**：SEQ-001

**message_id**：SEQ-001-M015

**kind**：event

**方向**：vendor→service

**条件**：[独立异步事件] 原供应商53事件；验真/稳定事件与目标部署仍partial

#### 2

**sequence_id**：SEQ-001

**message_id**：SEQ-001-M015-A

**kind**：response

**方向**：service→vendor

**条件**：[异步事件的HTTP同步返回] 若实际HTTP推送；公共协议候选，不选择未核AND/OR形式或宣称恰好一次

#### 3

**sequence_id**：SEQ-002

**message_id**：SEQ-002-LOCAL-001

**kind**：event

**方向**：vendor→service

**条件**：独立已配置供应商事件入口，完整payload/认证/稳定身份仍partial

#### 4

**sequence_id**：SEQ-003

**message_id**：SEQ-003-LOCAL-001

**kind**：event

**方向**：vendor→service

**条件**：独立本次供应商预测呼叫失败入口；不是53导入拒绝

#### 5

**sequence_id**：SEQ-004

**message_id**：SEQ-004-LOCAL-001

**kind**：event

**方向**：vendor→service

**条件**：独立当前供应商结果入口，完整字段/事件身份仍partial

#### 6

**sequence_id**：SEQ-006

**message_id**：SEQ-006-LOCAL-026

**kind**：event

**方向**：vendor→service

**条件**：独立后续53导入失败入口，含重复/乱序/迟到；未收到不推定零失败；此段仅当前准确手工记录的53事件，公共接收按原对象分流，外部记录另见SEQ-001，不对同事件双处理

**historical_sequence_refs_status**：stale_after_SRC118_121_scope_change

**current_scope_source_refs**

1. inputs/source-index.json#SRC-118

2. inputs/source-index.json#SRC-119

3. inputs/source-index.json#SRC-120

4. inputs/source-index.json#SRC-121

5. inputs/source-index.json#SRC-122

**current_scope_contract_status**：PROPOSED_CURRENT_SCOPE_NOT_S4_VERIFIED

**verification_status_authority**：沿原台账，只说明既有文档核验程度；本轮自定义契约未验证

**applicable_call_modes**

1. predictive

**applicability_note**：现有 52/53 及预测结果用法仅适用预测；通用推送中人工模式字段/对象关联尚待另核，不因同供应商而推定兼容。

**交付优先级**

**级别**：P0

**角色**：dependency

**优先组**

1. P0-IMPORT

2. P0-FOLLOWUP

**范围**：仅首次导入结果及准确关联的客观客户接听/通话结果接收作为导入和未接填单判断依据；人工记录不写成供应商事件，本行其他失败补提交分流本轮不另排。

#### API-004 预测话单查询及秒挂候选数据

**标识**：API-004

**名称**：预测话单查询及秒挂候选数据

**方向**：平台结果查询适配→AliCti

**kind**：supplier_cdr_query

**用途**：读取准确预测话单候选证据，支持客户接听、挂断方、时长、原始结果及可信晚更新核对。

**范围**：active

**核验状态**：partial

**production_ready**：False

**real_call_allowed**：False

**文档端点**：/cc/list_cdr_predictive_call

**文档方法**：GET（本地供应商文档）

**生产路由**：待核／未提供

**production_route_status**：not_confirmed_or_not_applicable

**输入**

1. startTime

2. startTimeEnd（文档时间跨度不超过一个月）

3. taskIds/mainUniqueId/callId/requestUniqueId/customerNumber等文档可选定位及分页（不能虚构fileId筛选）

**输出**

1. onHookSource：响应String，示例客户挂断

2. customerBridgeDuration：Integer客户接听时长

3. endTime：Long结束时间

4. status Integer及statusDesc

5. sipCause Integer原字段口径

6. obSipCause String

7. sipCauseAsyncUpdateFlag Integer（非最后一通）

8. finishRetryFlag Integer：1最后一条，0否；未知分开

9. degradeRound Integer

10. telRetryRound Integer

11. mainUniqueId/requestUniqueId/callId/uniqueId/enterpriseId/taskId（保留文档原标识及类型）

**authentication**：供应商话单查询既有鉴权及原租户/任务资格仍待核，不依赖本轮对外应用密钥/token。

**idempotency**：话单查询、可信事件及同call晚更新去重/并发键仍待核；准确保存同一调用结果，不以新业务批次或最近同号替代稳定call关联。

**timeout**：未核实；未知结果暂停，不自动当失败

**rate_limit**：归档导入数量上限不是业务呼叫超频解除依据

**errors**



**guards_and_limits**

1. 仅适用于本行预测业务范围；人工模式的身份/拨号/结果契约独立待核。

2. 旧/cc/list_cdr_predictive_call未列fileId筛选；不要把另一套/interface候选的taskFileId套入旧接口。

3. 独立候选/interface/{version}/cdr/predictiveCall/query支持taskFileId并返回PredictiveCallCdr.taskFileId；实际部署资格、fileId映射仍待核。

4. 候选uniqueId非空使其它查询条件失效；月界/秒级时间及分页按原文保留。查空不证明无在途或可重发。

5. 客户有效时长单位、零/缺失及客户主动挂断完整映射尚待核；真人识别isRealAnswer不擅自成为一般客户接通门槛。

**open_issue_ids**

1. ISSUE-005

2. ISSUE-035

3. ISSUE-041

**source_ref**：需求/1.1.0/分析工作区/interfaces/interface-index.json#API-004

**来源**：inputs/interface-documents/API-318.txt#L11, inputs/interface-documents/API-318.txt#L431, inputs/interface-documents/API-318.txt#L499, inputs/interface-documents/API-318.txt#L621, inputs/source-index.json#SRC-061, inputs/source-index.json#SRC-063, inputs/source-index.json#SRC-064, inputs/source-index.json#SRC-065, inputs/source-index.json#SRC-066, inputs/source-index.json#SRC-067, inputs/source-index.json#SRC-068, inputs/source-index.json#SRC-069, inputs/source-index.json#SRC-070, candidate-supplier-review/live-318.txt#L46, candidate-supplier-review/live-318.txt#L113-L119, inputs/source-index.json#SRC-089, inputs/source-index.json#SRC-091, inputs/source-index.json#SRC-094, inputs/source-index.json#SRC-096, inputs/source-index.json#SRC-098, inputs/source-index.json#SRC-102, inputs/source-index.json#SRC-103, candidate-supplier-review/live-318.txt#L16-L46, candidate-supplier-review/live-318.txt#L76-L116, candidate-supplier-review/挂机推送时底层变量和值.txt#L122-L156, inputs/source-index.json#SRC-106, inputs/interface-documents/API-318.txt#L17-L19, inputs/interface-documents/API-318.txt#L27-L62, inputs/interface-documents/API-318.txt#L179-L225, inputs/interface-documents/API-318.txt#L431-L433, inputs/interface-documents/API-318.txt#L479-L501, candidate-supplier-review/live-318.txt#L119, candidate-supplier-review/挂机推送时底层变量和值.txt#L134-L156, inputs/source-index.json#SRC-110, inputs/source-index.json#SRC-114, inputs/source-index.json#SRC-112, inputs/source-index.json#SRC-113, inputs/source-index.json#SRC-115, inputs/source-index.json#SRC-116

**documented_endpoint_authority**：supplier_document_not_target_deployment_verified

**documented_field_evidence**

**customer_duration**

**field**：customerBridgeDuration

**documented_type**：Integer

**documented_description**：客户接听时长

**unit_status**：not_explicit_in_local_response_definition

**precision_rounding_zero_missing**：not_documented

**sample_consistency**：示例与秒级endTime/upTime差值一致，不能升为单位保证

**source_ref**：inputs/interface-documents/API-318.txt#L479-L501

**on_hook_source**

**query_type**：Integer[]

**query_example**：1000

**response_type**：String

**response_example**：客户挂断

**complete_enum_and_customer_leg_mapping**：missing

**来源**：inputs/interface-documents/API-318.txt#L215-L219, inputs/interface-documents/API-318.txt#L431-L433, candidate-supplier-review/live-318.txt#L119

**predictive_hangup_evidence**

**call_type**：5

**status_descriptions**

**40**：客户未接

**41**：客户接听，呼转座席未触达座席

**42**：客户接听，呼转座席座席未接

**43**：双方接听

**end_reason_documented**

**1000**：主通道挂机

**1001**：非主通道挂机

**1002**：被强拆

**customer_caller_leg_mapping**：not_proven_by_this_dictionary

**source_ref**：candidate-supplier-review/挂机推送时底层变量和值.txt#L134-L156

**association**：当前主/cc/list_cdr_predictive_call未列fileId/taskFileId请求或返回；本轮另补v10 /cdr/predictiveCall/query候选明确taskFileId请求/返回，未自动切换端点或证明跨端点同call一致。可靠call↔本方记录/保存root仍需实际可信字段与映射；失败事件无callId/finishRetryFlag不得补造。

**additional_documented_candidate_fields**

**来源**：inputs/source-index.json#SRC-113, inputs/source-index.json#SRC-114

**source_evidence_ids**

1. EV-QUERY-REALHUMAN

2. EV-QUERY-OTHERDURATION

**realAnswerTime**：候选PredictiveCallCdr字段Long秒级真人接听时间

**isRealAnswer**：候选PredictiveCallCdr字段String1/0/空值；不能取代一般客户接通条件

**other_duration_units**

**bridgeDuration**：seconds 服务处理

**totalDuration**：seconds 总通话

**waitDuration**：seconds 客户等待

**customer_duration_unit_or_business_gate_changed**：False

**documented_query_candidates**

#### 1 获取预测式外呼通话记录接口

**candidate_id**：PREDICTIVE_V10_BATCH_QUERY

**来源**：inputs/source-index.json#SRC-113

**状态**：documented_candidate_pending_target_version_and_S4_G2_review

**名称**：获取预测式外呼通话记录接口

**endpoint**：/interface/{version}/cdr/predictiveCall/query

**version**：v10

**方法**：GET/POST

**source_evidence_ids**

1. EV-QUERY-ENDPOINT

2. EV-QUERY-FILTERS

3. EV-QUERY-RETURN

4. EV-QUERY-BATCHRETURN

5. EV-QUERY-REALHUMAN

**deprecated_label_found**：False

**primary_endpoint_changed**：False

**request_contract**

**taskId**：Int optional

**taskFileId**：Int optional 批次id

**uniqueId**：String optional 非空使以下其它参数无效；仅查询本uniqueId

**requestUniqueId**：String optional 默认当前月；非当前月传startTime

**timeRangeType**：Integer optional 1开始/2结束 默认1；startTime/endTime均非空生效

**startTime**：Int optional 秒级 不跨月 默认当月第一天

**endTime**：Int optional 秒级 不跨月 默认当月最后一天

**start**：Int optional >=0 default0

**limit**：Int optional 1..1000 default10

**isRealAnswer**：Int optional 真人筛选1/0；非本轮业务A新增门槛

**response_contract**

**array**：data.PredictiveCallCdrs

**类型**：PredictiveCallCdr

**identity_fields**

1. uniqueId String 电话唯一标识

2. requestUniqueId String 用户自定义通话标识

3. taskId Int

4. taskFileId Int

5. callId String 通话唯一标识

**real_human_fields**

1. realAnswerTime Long 秒级真人接听时间

2. isRealAnswer String 真人接听1/0/空值

**验证边界**

1. 文档批次查询存在不代表目标租户开通或查询为空可判未执行

2. PredictiveCallCdr.callType描述为webcall且statusCode为预测40~43；实际模式/版本字段统一仍待核

3. 真人识别字段不自动映射至客户接通状态或新/cc返回

4. 没有证明customerBridgeDuration单位/精度/0缺失、客户主动挂断完整映射、可信同call更正版本和原生待执行清空

**real_call_allowed**：False

**source_refs_authority**：原供应商/旧 S4 追踪引用；本轮 S4 未重跑，不是当前已审接口契约

**historical_sequence_refs**

#### 1

**sequence_id**：SEQ-002

**message_id**：SEQ-002-LOCAL-002

**kind**：external_call

**方向**：service→vendor

**条件**：已有可准确定位的查询场景，不要求收到失败后必等话单

#### 2

**sequence_id**：SEQ-002

**message_id**：SEQ-002-LOCAL-003

**kind**：response

**方向**：vendor→service

**条件**：本次查询响应明确；无响应仍未知

#### 3

**sequence_id**：SEQ-004

**message_id**：SEQ-004-LOCAL-004

**kind**：external_call

**方向**：service→vendor

**条件**：已有查询可准确表达；不是三条件全部完整或等待话单的强制前置

#### 4

**sequence_id**：SEQ-004

**message_id**：SEQ-004-LOCAL-005

**kind**：response

**方向**：vendor→service

**条件**：本次真实查询响应已到，无响应保持证据unknown

**historical_sequence_refs_status**：stale_after_SRC118_121_scope_change

**current_scope_source_refs**

1. inputs/source-index.json#SRC-118

2. inputs/source-index.json#SRC-119

3. inputs/source-index.json#SRC-120

4. inputs/source-index.json#SRC-121

**current_scope_contract_status**：PROPOSED_CURRENT_SCOPE_NOT_S4_VERIFIED

**verification_status_authority**：沿原台账，只说明既有文档核验程度；本轮自定义契约未验证

**applicable_call_modes**

1. predictive

**applicability_note**：本行已核文档/使用方案为预测业务；人工外呼不能默认复用，实际人工协议需另核。

#### API-005 每日号码状态查询与存量priority修改（已取消，退出当前范围）

**标识**：API-005

**名称**：每日号码状态查询与存量priority修改（已取消，退出当前范围）

**方向**：退役，无本轮调用

**kind**：retired_daily_decay

**用途**：保留历史ID追溯；取消每日号码状态查询、自然日priority衰减和仅为衰减的存量priority修改。

**范围**：retired

**核验状态**：not_required

**production_ready**：False

**real_call_allowed**：False

**文档端点**：待核／未提供

**文档方法**：待核／未提供

**生产路由**：待核／未提供

**production_route_status**：not_confirmed_or_not_applicable

**输入**



**输出**



**authentication**：供应商鉴权不得与DCC租户token混用；见SRC-057原文，调用资格未实测

**idempotency**：技术请求、回调去重与并发键未核实，不用业务每推送新批次替代

**timeout**：未核实；未知结果暂停，不自动当失败

**rate_limit**：归档导入数量上限不是业务呼叫超频解除依据

**errors**



**guards_and_limits**

1. not_required不表示供应商接口不存在或已验证。有效事件及必要只读查询仍保留。

**open_issue_ids**



**source_ref**：需求/1.1.0/分析工作区/interfaces/interface-index.json#API-005

**来源**：inputs/source-index.json#SRC-020, inputs/source-index.json#SRC-024, inputs/interface-documents/API-312.txt#L173-L176, inputs/source-index.json#SRC-061, inputs/source-index.json#SRC-063, inputs/source-index.json#SRC-064, inputs/source-index.json#SRC-065, inputs/source-index.json#SRC-066, inputs/source-index.json#SRC-067, inputs/source-index.json#SRC-068, inputs/source-index.json#SRC-069, inputs/source-index.json#SRC-070, inputs/source-index.json#SRC-083

**documented_endpoint_authority**：no_confirmed_endpoint_or_retired

**source_refs_authority**：原供应商/旧 S4 追踪引用；本轮 S4 未重跑，不是当前已审接口契约

**historical_sequence_refs**



**historical_sequence_refs_status**：stale_after_SRC118_121_scope_change

**current_scope_source_refs**

1. inputs/source-index.json#SRC-118

2. inputs/source-index.json#SRC-119

3. inputs/source-index.json#SRC-120

4. inputs/source-index.json#SRC-121

**current_scope_contract_status**：PROPOSED_CURRENT_SCOPE_NOT_S4_VERIFIED

**verification_status_authority**：沿原台账，只说明既有文档核验程度；本轮自定义契约未验证

#### API-006 精准删除供应商任务内号码

**标识**：API-006

**名称**：精准删除供应商任务内号码

**方向**：平台精确删除适配→AliCti

**kind**：supplier_target_delete

**用途**：执行由API-014授权定位的指定供应商号码删除，返回目标明确删除/跳过/拒绝/未知结果。

**范围**：active

**核验状态**：partial

**production_ready**：False

**real_call_allowed**：False

**文档端点**：/interface/{version}/task/deleteTaskTel

**文档方法**：GET/POST（文档version=v10，实际部署版本待核）

**生产路由**：待核／未提供

**production_route_status**：not_confirmed_or_not_applicable

**输入**

1. validateType Int必选；1部门鉴权/2呼叫中心鉴权

2. departmentId String（validateType=1时必选）

3. enterpriseId Int（validateType=2时必选）

4. timestamp Long（linux时间戳精确到秒，文档有效期30分钟）

5. sign String（文档32位全小写签名，真实token作用域待核）

6. taskId Int必选

7. fileId Int可选（供应商批次ID）

8. fileName String可选（按名称会删最近添加批次）

9. status Int可选（0未呼叫/1已呼叫）

10. tels String可选（英文逗号分隔多个号码；最多10W，支持加密号码且URL Encode）

11. skipCalling Int可选（0/不传与1的文档行为须区别，本期不拟默认值）

12. skipRetry Int可选（0/不传与1的文档缓存/墓碑行为须区别，本期不拟默认值）

**输出**

1. result Int（0成功/-1失败；部分跳过仍可0）

2. description String（原始结果描述）

3. errorCode Int（result=-1时返回）

4. data Object可选（skipCalling=1且存在跳过号码时返回）

5. data.skippedCallingTels List<String>（呼叫中被跳过而未删除的号码）

**authentication**：按SRC-107原文validateType=1用departmentId或=2用enterpriseId及timestamp/sign；签名原文两种模式都称供应商部门token值，实际token归属/调用资格仍待核，不与DCC租户token混用，不生成真实签名。

**idempotency**：供应商文档未给删除幂等请求ID、精确目标原子性和在途终止回执；本方API-014保存原授权命令、固定目标和执行状态。远端响应未知沿原动作待核，不另建删除尝试盲重发；总体result=0/局部跳过不统一标已删，不释放已用或未知失败占用。

**timeout**：未核实；未知结果暂停，不自动当失败

**rate_limit**：文档tels一次最多10W号码；接口访问频率存在超频错误，但具体速率未给，不与被叫呼叫过频或失败额外2次混同。

**errors**

1. 文档参数必填/格式/取值/范围错误和接口访问频次限制；具体errorCode数值表未列，不臆造

2. skipCalling和skipRetry不能同时为1

3. skipCalling=1可返回result=0但skippedCallingTels仍未删除

**guards_and_limits**

1. 仅适用于本行预测业务范围；人工模式的身份/拨号/结果契约独立待核。

2. 选择器有优先级：tels优先于fileId/fileName，不能假设tels AND fileId；按fileName会选择最近批次。

3. 只有已保存实际fileId独占所选目标时才可评估taskId＋fileId候选；共享fileId不能隔离时不外发，不扩大到同号或root组。

4. result=0可包含skippedCallingTels；不能统一标删除成功。skipCalling/skipRetry不能同时1，项目选值待核。

5. 本地停止未执行目标计划和供应商远端删除分开；不证明在途通话已撤回，也不释放已用或UNKNOWN占用。

**open_issue_ids**

1. ISSUE-022

2. ISSUE-035

3. ISSUE-037

**source_ref**：需求/1.1.0/分析工作区/interfaces/interface-index.json#API-006

**来源**：inputs/interface-documents/API-312.txt#L27-L29, inputs/source-index.json#SRC-025, inputs/source-index.json#SRC-048, inputs/source-index.json#SRC-061, inputs/source-index.json#SRC-063, inputs/source-index.json#SRC-064, inputs/source-index.json#SRC-065, inputs/source-index.json#SRC-066, inputs/source-index.json#SRC-067, inputs/source-index.json#SRC-068, inputs/source-index.json#SRC-069, inputs/source-index.json#SRC-070, inputs/source-index.json#SRC-083, inputs/source-index.json#SRC-084, inputs/source-index.json#SRC-085, inputs/source-index.json#SRC-086, inputs/source-index.json#SRC-089, inputs/source-index.json#SRC-094, inputs/source-index.json#SRC-096, inputs/source-index.json#SRC-100, inputs/source-index.json#SRC-102, inputs/source-index.json#SRC-103, inputs/source-index.json#SRC-107, inputs/interface-documents/deleteTaskTel.txt#L4-L24, inputs/interface-documents/deleteTaskTel.txt#L31-L95, inputs/interface-documents/deleteTaskTel.txt#L98-L120, inputs/interface-documents/deleteTaskTel.txt#L143-L150, inputs/source-index.json#SRC-110

**documented_endpoint_authority**：supplier_document_not_target_deployment_verified

**documented_selector_contract**

**priority_order**

1. tels（号码/属性，最高）

2. fileId或fileName（批次）

3. status（号码状态）

4. 无选择器的全任务号码（最低）

**combination_semantics**：优先选择，不是fileId与tels的AND交集

**file_name_scope**：最近添加批次

**task_state_limits**：按号码/批次/状态文档可运行中删除；全任务仅初始/结束状态；文档建议非运行状态

**skip_calling**

**documented_default**：0或不传：呼叫中号码也删除

**value_1**：跳过呼叫中号码，其余正常删除；部分成功仍返回成功

**skipped_field**：data.skippedCallingTels

**production_selection**：not_chosen

**skip_retry**

**documented_default**：0或不传：已呼叫号码清缓存并写墓碑

**value_1**：已呼叫号码仅删除数据库、跳过缓存/墓碑；未呼叫仍删除数据库/缓存/墓碑

**production_selection**：not_chosen

**flags_mutually_exclusive**：skipCalling和skipRetry不能同时为1

**single_business_target_candidate**：仅独占精确fileId候选按批删除，不同时tels；不是已通过联调的生产策略

**shared_file_attempt_target**：同fileId多attempt不能据现有选择器定位其中一次，未知不扩大删除

**remote_inflight_abort**：not_proven

**source_ref**：inputs/interface-documents/deleteTaskTel.txt#L4-L120

**source_refs_authority**：原供应商/旧 S4 追踪引用；本轮 S4 未重跑，不是当前已审接口契约

**historical_sequence_refs**

#### 1

**sequence_id**：SEQ-009

**message_id**：SEQ-009-LOCAL-015

**kind**：external_call

**方向**：service→vendor

**条件**：本次独占选择器和执行权可核才合成候选；不先删后导、不承诺在途撤回

#### 2

**sequence_id**：SEQ-009

**message_id**：SEQ-009-LOCAL-016

**kind**：response

**方向**：vendor→service

**条件**：只在本次明确响应已到；无响应不伪造

**historical_sequence_refs_status**：stale_after_SRC118_121_scope_change

**current_scope_source_refs**

1. inputs/source-index.json#SRC-118

2. inputs/source-index.json#SRC-119

3. inputs/source-index.json#SRC-120

4. inputs/source-index.json#SRC-121

**current_scope_contract_status**：PROPOSED_CURRENT_SCOPE_NOT_S4_VERIFIED

**verification_status_authority**：沿原台账，只说明既有文档核验程度；本轮自定义契约未验证

**applicable_call_modes**

1. predictive

**applicability_note**：本行已核文档/使用方案为预测业务；人工外呼不能默认复用，实际人工协议需另核。

#### API-007 平台换主叫接口（退出当前范围）

**标识**：API-007

**名称**：平台换主叫接口（退出当前范围）

**方向**：退役，无本轮平台调用

**kind**：retired_caller_switch

**用途**：平台不新增换主叫或切换线路接口；供应商导航依赖归API-012。

**范围**：retired

**核验状态**：not_required

**production_ready**：False

**real_call_allowed**：False

**文档端点**：待核／未提供

**文档方法**：待核／未提供

**生产路由**：待核／未提供

**production_route_status**：not_confirmed_or_not_applicable

**输入**



**输出**



**authentication**：供应商鉴权不得与DCC租户token混用；见SRC-057原文，调用资格未实测

**idempotency**：技术请求、回调去重与并发键未核实，不用业务每推送新批次替代

**timeout**：未核实；未知结果暂停，不自动当失败

**rate_limit**：归档导入数量上限不是业务呼叫超频解除依据

**errors**



**guards_and_limits**

1. 导航权重能力不意味着本平台获得直接换主叫接口。

**open_issue_ids**



**source_ref**：需求/1.1.0/分析工作区/interfaces/interface-index.json#API-007

**来源**：inputs/source-index.json#SRC-036, inputs/source-index.json#SRC-042, inputs/interface-documents/API-312.txt#L183-L191, inputs/source-index.json#SRC-061, inputs/source-index.json#SRC-063, inputs/source-index.json#SRC-064, inputs/source-index.json#SRC-065, inputs/source-index.json#SRC-066, inputs/source-index.json#SRC-067, inputs/source-index.json#SRC-068, inputs/source-index.json#SRC-069, inputs/source-index.json#SRC-070, inputs/source-index.json#SRC-082, inputs/source-index.json#SRC-089, inputs/source-index.json#SRC-096, inputs/source-index.json#SRC-102, inputs/source-index.json#SRC-103

**documented_endpoint_authority**：no_confirmed_endpoint_or_retired

**source_refs_authority**：原供应商/旧 S4 追踪引用；本轮 S4 未重跑，不是当前已审接口契约

**historical_sequence_refs**



**historical_sequence_refs_status**：stale_after_SRC118_121_scope_change

**current_scope_source_refs**

1. inputs/source-index.json#SRC-118

2. inputs/source-index.json#SRC-119

3. inputs/source-index.json#SRC-120

4. inputs/source-index.json#SRC-121

**current_scope_contract_status**：PROPOSED_CURRENT_SCOPE_NOT_S4_VERIFIED

**verification_status_authority**：沿原台账，只说明既有文档核验程度；本轮自定义契约未验证

#### API-008 系统风控解除/恢复接口（本轮不新增平台调用）

**标识**：API-008

**名称**：系统风控解除/恢复接口（本轮不新增平台调用）

**方向**：退役，无本轮平台调用

**kind**：retired_risk_unban

**用途**：平台不新增解除风控/恢复接口；120秒是补提交等待规则，不宣称自动解禁。

**范围**：retired

**核验状态**：not_required

**production_ready**：False

**real_call_allowed**：False

**文档端点**：待核／未提供

**文档方法**：待核／未提供

**生产路由**：待核／未提供

**production_route_status**：not_confirmed_or_not_applicable

**输入**



**输出**



**authentication**：供应商鉴权不得与DCC租户token混用；见SRC-057原文，调用资格未实测

**idempotency**：技术请求、回调去重与并发键未核实，不用业务每推送新批次替代

**timeout**：未核实；未知结果暂停，不自动当失败

**rate_limit**：归档导入数量上限不是业务呼叫超频解除依据

**errors**



**guards_and_limits**

1. 不增加先收到解禁或降级成功回执才进入120秒规则的新业务门槛；真实供应商执行安全仍待核。

**open_issue_ids**



**source_ref**：需求/1.1.0/分析工作区/interfaces/interface-index.json#API-008

**来源**：inputs/source-index.json#SRC-043, inputs/source-index.json#SRC-056, inputs/interface-documents/API-315.txt#L202-L210, inputs/source-index.json#SRC-061, inputs/source-index.json#SRC-063, inputs/source-index.json#SRC-064, inputs/source-index.json#SRC-065, inputs/source-index.json#SRC-066, inputs/source-index.json#SRC-067, inputs/source-index.json#SRC-068, inputs/source-index.json#SRC-069, inputs/source-index.json#SRC-070, inputs/source-index.json#SRC-081, inputs/source-index.json#SRC-089, inputs/source-index.json#SRC-090, inputs/source-index.json#SRC-092, inputs/source-index.json#SRC-096, inputs/source-index.json#SRC-102, inputs/source-index.json#SRC-103

**documented_endpoint_authority**：no_confirmed_endpoint_or_retired

**source_refs_authority**：原供应商/旧 S4 追踪引用；本轮 S4 未重跑，不是当前已审接口契约

**historical_sequence_refs**



**historical_sequence_refs_status**：stale_after_SRC118_121_scope_change

**current_scope_source_refs**

1. inputs/source-index.json#SRC-118

2. inputs/source-index.json#SRC-119

3. inputs/source-index.json#SRC-120

4. inputs/source-index.json#SRC-121

**current_scope_contract_status**：PROPOSED_CURRENT_SCOPE_NOT_S4_VERIFIED

**verification_status_authority**：沿原台账，只说明既有文档核验程度；本轮自定义契约未验证

#### API-009 本地记录、失败下载生命周期与提交前手工编辑

**标识**：API-009

**名称**：本地记录、失败下载生命周期与提交前手工编辑

**方向**：现有运营页面↔平台记录／草稿／下载服务；平台内部持久化

**kind**：internal_record_manual_export

**用途**：承接原手工导入、当前草稿确认、本地记录查询、失败快照及可信下载后的精准清理。

**范围**：active_internal

**核验状态**：not_required

**production_ready**：False

**real_call_allowed**：False

**文档端点**：待核／未提供

**文档方法**：待核／未提供

**生产路由**：待核／未提供

**production_route_status**：not_confirmed_or_not_applicable

**输入**



**输出**



**authentication**：沿既有登录、租户及当前任务记录权限；本方生产内部路由/持久化和精确授权执行待工程核验，不新建对外应用或token。

**idempotency**：原导入草稿/记录/失败快照/可信事件与本地结果版本的持久化、去重与并发实现仍待核；已有内部attempt与预算占用不因刷新/下载/删除重建。

**timeout**：未核实；未知结果暂停，不自动当失败

**rate_limit**：归档导入数量上限不是业务呼叫超频解除依据

**errors**



**guards_and_limits**

1. 原手工导入流程、选填字段后置和线索类单一编码保留；不关联应用的手工 UI 数据不外发回调。

2. 本地记录/失败快照/完整保存后精确清理规则保留；普通下载、点击或 HTTP 成功不清理。

3. 双方式新增坐席分配和工作台跟进是独立内部候选能力，见 INT-MANUAL-ASSIGN、INT-FOLLOWUP-SAVE 与 INT-CONTINUE-FOLLOWUP；不虚构供应商接口。

4. SRC-122：明确外呼客户未接且通话已结束时，独立保存 API-327 所选 code+description 及录入人/时间；715/183 同码多描述不可折叠，空白不同于明确选择183未知，不覆盖客观线路/话单或触发预测补呼。详见 INT-FOLLOWUP-SAVE。

5. SRC-123：INT-COMPLETION-CALLBACK仅在本次外呼结束、处理结果明确已完成沟通且本次跟进/客户业务信息完整保存成功后，生成本次call固定快照交原应用；通用已完成、单独编辑或部分保存不能触发。此为新增内部候选，不是新供应商接口。

**open_issue_ids**

1. ISSUE-002

2. ISSUE-008

3. ISSUE-036

4. ISSUE-038

5. ISSUE-041

6. ISSUE-043

7. ISSUE-046

8. ISSUE-047

**source_ref**：需求/1.1.0/分析工作区/interfaces/interface-index.json#API-009

**来源**：inputs/source-index.json#SRC-053, inputs/source-index.json#SRC-054, inputs/source-index.json#SRC-055, inputs/source-index.json#SRC-056, inputs/source-index.json#SRC-061, inputs/source-index.json#SRC-062, inputs/source-index.json#SRC-063, inputs/source-index.json#SRC-064, inputs/source-index.json#SRC-065, inputs/source-index.json#SRC-066, inputs/source-index.json#SRC-067, inputs/source-index.json#SRC-068, inputs/source-index.json#SRC-069, inputs/source-index.json#SRC-070, inputs/source-index.json#SRC-071, inputs/source-index.json#SRC-072, inputs/source-index.json#SRC-073, inputs/source-index.json#SRC-084, inputs/source-index.json#SRC-085, inputs/source-index.json#SRC-086, inputs/source-index.json#SRC-089, inputs/source-index.json#SRC-091, inputs/source-index.json#SRC-094, inputs/source-index.json#SRC-095, inputs/source-index.json#SRC-096, inputs/source-index.json#SRC-098, inputs/source-index.json#SRC-101, inputs/source-index.json#SRC-102, inputs/source-index.json#SRC-103, inputs/source-index.json#SRC-106, inputs/source-index.json#SRC-109, inputs/source-index.json#SRC-110, inputs/source-index.json#SRC-115, inputs/source-index.json#SRC-116, inputs/source-index.json#SRC-117

**documented_endpoint_authority**：no_confirmed_endpoint_or_retired

**source_refs_authority**：原供应商/旧 S4 追踪引用；本轮 S4 未重跑，不是当前已审接口契约

**historical_sequence_refs**



**historical_sequence_refs_status**：stale_after_SRC118_121_scope_change

**current_scope_source_refs**

1. inputs/source-index.json#SRC-118

2. inputs/source-index.json#SRC-119

3. inputs/source-index.json#SRC-120

4. inputs/source-index.json#SRC-121

5. inputs/source-index.json#SRC-122

6. inputs/source-index.json#SRC-123

7. memory/normalized-user-stories.json#AC-095

**current_scope_contract_status**：PROPOSED_CURRENT_SCOPE_NOT_S4_VERIFIED

**verification_status_authority**：沿原台账，只说明既有文档核验程度；本轮自定义契约未验证

**交付优先级**

**级别**：P0

**角色**：primary

**优先组**

1. P0-IMPORT

2. P0-FOLLOWUP

**范围**：混合内部能力行仅INT-MANUAL-ASSIGN的接口人工分配、INT-FOLLOWUP-SAVE的振铃草稿/未接通保存及INT-COMPLETION-CALLBACK的本次已完成沟通保存快照为直接P0；具体回调交API-010。跟进后名单与详情读取按内部能力列依赖。原手工UI导入、失败下载、清理及本行其他职责不整体升P0。

#### API-010 平台向原应用回调每次结果／进度及独立完成沟通快照

**标识**：API-010

**名称**：平台向原应用回调每次结果／进度及独立完成沟通快照

**方向**：平台→原业务系统（DCC/天网等）；业务系统→本次版本 ACK

**kind**：dcc_result_delivery

**用途**：全部应用接口来源准确回调原app/tenant的每次结果、进度；新增外呼已完成沟通成功保存后的本次call及客户业务快照独立事件。均携原业务批次号；无app手工UI不外发。

**范围**：active

**核验状态**：missing

**production_ready**：False

**real_call_allowed**：False

**文档端点**：待核／未提供

**文档方法**：待核／未提供

**生产路由**：待核／未提供

**production_route_status**：not_confirmed_or_not_applicable

**输入**

1. 原稳定 app/tenant/record/request 归属及原预测 task/attempt/file/call，或人工分配/call/followup 的准确关联。

2. 每次客观结果与可信更正、预测秒挂分类及适用处理进度；人工状态/处理结果独立字段待定，不能冒充客观接通。

3. 原应用配置的 callbackUrl；先配置才能新接口导入。积压结果采用配置版本/取值时点尚待审。

4. 对应记录保存的原businessBatchNo；历史缺值明确为空/未提供，不猜造。

5. 新增独立完成事件：本次外呼已结束、agentDisposition=已完成沟通且完整保存成功后冻结的completionSnapshot候选，禁止跨通话聚合/最新客户资料替代。

6. 本次已填写的客户业务信息，包含选填字段，均随快照携带字段业务编码及保存值；有选项时携对应选项业务编码/值，多选完整保留全部选中编码。不能只发显示label、内部字段ID或内部选项ID。保存时固定对应配置编码/版本，后续配置变更不改补送；未填写不猜造编码值，历史缺业务编码明确待核。正式载荷字段名和嵌套schema仍为proposed。

7. 完成沟通事件另携本记录本次导入保存的六个选填业务字段intentionStoreCode/intentionStoreName/intentionSeriesCode/intentionSeries/smartCode/leadCreatedAt；按原app/tenant/record及本次call准确关联，已填携原码/原名称/原Smartcode，未提供保留缺值，不能以其他同手机号/线索/批次的最新导入或后续编辑覆盖。本次导入业务信息与坐席本次填写的customerFollowup快照并列，原plannedStoreName不被导入意向门店覆盖；补送使用同一固定快照。

8. 留资时间leadCreatedAt是业务系统提供的原线索留资时间，选填；与平台importedAt和跟进savedAt分别保存/展示。未提供不填当前时间，不由其他时间推算；按原提供值透传，正式wire类型、时间格式及时区待S4确认，不凭样例冻结。

9. 每次结果/进度及已完成沟通回调均携准确原app/tenant/record/call导入时保存的businessType稳定码和既有businessBatchNo；补送沿原事件快照。类型后续改名或停用不重算原码，历史未知不猜值，不只回传类型名称，也不替代已填字段/选项业务编码。正式回调报文与ACK仍待契约及工程验证。

**输出**

1. 匹配本次交付身份/版本及原租户应用的业务 ACK；结构、签名、时限、重试和幂等保留期待双方确认。

**authentication**：各接收业务系统回调鉴权/签名待核；token 的租户范围不得按回调时最近登录租户变化。

**idempotency**：候选交付身份绑定 originalAppId+tenantId+record/call/followup+resultId+resultVersion；重复补送沿原版本，正确持久 ACK 才标交付成功，HTTP 成功不能代替。真实字段及跨系统兼容待审。 新完成事件候选eventId/eventVersion绑定同一call及成功保存版本；不以可重复businessBatchNo去重，重复通知沿原快照；修改保存语义待核。

**timeout**：交开发落实可靠交付，不据超时改业务呼叫结果

**rate_limit**：DCC接收端容量、业务ACK超时、补送间隔/上限和保留期未定；业务补送次数不等失败补提交额外2次。

**errors**



**guards_and_limits**

1. 所有应用接口来源含天网、人工方式均回调；无接入应用的手工 UI 来源仅平台。

2. 只按已保存原 app/tenant/record 和原应用配置寻址；不按 root、新主批、task 最近导入来源、操作人、body source 或任意入参 URL 改路由。

3. 同 app 多租户回调载荷必须携带准确原 tenant 关联，不能使用最近 token 租户。

4. 补送只重发保存的业务结果，不重新拨号、不建 file/attempt，也不消耗预测补提交预算。

5. 应用删除、关联解除及地址变更后的积压记录保留，具体路由/停止/恢复规则待核，不丢弃或改发其他 app。

6. 后到客观话单不得覆盖已保存人工状态/继续跟进决定；可据契约发新结果版本。

7. 每次结果/进度及新增完成回调均携准确记录原businessBatchNo；同值不意味着同一记录、事件或接收方。

8. 完成事件须外呼结束+agentDisposition明确已完成沟通+完整保存成功，不能只看processingStatus=已完成；保存失败、独立表单编辑或其他结果不触发。

9. 完成事件只携本次call和本次成功保存业务快照，补送不读最新客户汇总；原逐次结果/进度/秒挂和失败回调继续保留，晚到话单按待核版本机制补充客观事实，不覆写保存快照。

10. 回调携带已填写的选填业务字段业务编码及适用选项业务编码/值，多选全部编码；保存时固定配置编码。不得只发显示名/内部ID，不在补送时重新查最新配置；未填不造值，历史缺码待核。

11. 已填字段或选中选项缺业务编码时，回调资料须明确待完善/待核，不能以label或内部ID兜底并标完整交付成功；本次新协议不自行把已有效的本地保存改成失败。缺码补全、修正版本和再次交付规则待正式契约，不静默改旧已发快照。

12. 既有结果/进度与新增完成沟通事件即使复用DFIELD-089/090/091，也须按候选事件类型(type)、准确事件ID及版本隔离状态/ACK；旧结果ACK不得确认完成事件，完成事件ACK不得代确认其他结果或版本。正式字段仍待契约。

13. 完成沟通事件另携本记录本次导入保存的六个选填业务字段intentionStoreCode/intentionStoreName/intentionSeriesCode/intentionSeries/smartCode/leadCreatedAt；按原app/tenant/record及本次call准确关联，已填携原码/原名称/原Smartcode，未提供保留缺值，不能以其他同手机号/线索/批次的最新导入或后续编辑覆盖。本次导入业务信息与坐席本次填写的customerFollowup快照并列，原plannedStoreName不被导入意向门店覆盖；补送使用同一固定快照。

14. 留资时间leadCreatedAt是业务系统提供的原线索留资时间，选填；与平台importedAt和跟进savedAt分别保存/展示。未提供不填当前时间，不由其他时间推算；按原提供值透传，正式wire类型、时间格式及时区待S4确认，不凭样例冻结。

15. 每次结果/进度及已完成沟通回调均携准确原app/tenant/record/call导入时保存的businessType稳定码和既有businessBatchNo；补送沿原事件快照。类型后续改名或停用不重算原码，历史未知不猜值，不只回传类型名称，也不替代已填字段/选项业务编码。正式回调报文与ACK仍待契约及工程验证。

**open_issue_ids**

1. ISSUE-026

2. ISSUE-031

3. ISSUE-041

4. ISSUE-043

5. ISSUE-044

6. ISSUE-045

7. ISSUE-046

8. ISSUE-047

**source_ref**：需求/1.1.0/分析工作区/interfaces/interface-index.json#API-010

**来源**：inputs/source-index.json#SRC-063, inputs/source-index.json#SRC-064, inputs/source-index.json#SRC-065, inputs/source-index.json#SRC-066, inputs/source-index.json#SRC-067, inputs/source-index.json#SRC-068, inputs/source-index.json#SRC-069, inputs/source-index.json#SRC-070, inputs/source-index.json#SRC-071, inputs/source-index.json#SRC-072, inputs/source-index.json#SRC-073, inputs/source-index.json#SRC-083, inputs/source-index.json#SRC-084, inputs/source-index.json#SRC-085, inputs/source-index.json#SRC-086, inputs/source-index.json#SRC-089, inputs/source-index.json#SRC-091, inputs/source-index.json#SRC-094, inputs/source-index.json#SRC-096, inputs/source-index.json#SRC-098, inputs/source-index.json#SRC-102, inputs/source-index.json#SRC-103, inputs/source-index.json#SRC-106, inputs/source-index.json#SRC-109, inputs/source-index.json#SRC-110, inputs/source-index.json#SRC-115, inputs/source-index.json#SRC-116

**documented_endpoint_authority**：no_confirmed_endpoint_or_retired

**source_refs_authority**：原供应商/旧 S4 追踪引用；本轮 S4 未重跑，不是当前已审接口契约

**historical_sequence_refs**

#### 1

**sequence_id**：SEQ-001

**message_id**：SEQ-001-M013-D

**kind**：external_call

**方向**：service→dcc

**条件**：[后台异步独立交付请求] 原DCC来源且精确关联/真实内容；不等运营查看/下载；字段/ACK仍missing

#### 2

**sequence_id**：SEQ-001

**message_id**：SEQ-001-M013-A

**kind**：response

**方向**：dcc→service

**条件**：[本次交付同步返回] 仅实际DCC接收响应；不等同供应商推送HTTP接收ACK

#### 3

**sequence_id**：SEQ-001

**message_id**：SEQ-001-M017

**kind**：external_call

**方向**：service→dcc

**条件**：[后台异步独立交付请求] 精确关联+可信原DCC+真实内容；不以下载/查看为前置

#### 4

**sequence_id**：SEQ-001

**message_id**：SEQ-001-M017-A

**kind**：response

**方向**：dcc→service

**条件**：[本次交付同步返回] API010正式ACK/稳定版本未联调

#### 5

**sequence_id**：SEQ-002

**message_id**：SEQ-002-DCC-RESULT-06

**kind**：external_call

**方向**：service→dcc

**条件**：仅精确原record或继承触发record来源的内部attempt，已保存可信原DCC来源且本次交付关联准确；天网/手工/来源待核不执行；本地结果先保存，发起/等待/失败均不阻塞本地处理、人工或自动守卫

#### 6

**sequence_id**：SEQ-002

**message_id**：SEQ-002-DCC-RESULT-07

**kind**：response

**方向**：dcc→service

**条件**：仅精确原record或继承触发record来源的内部attempt，已保存可信原DCC来源且本次交付关联准确；天网/手工/来源待核不执行；仅实际业务响应到达的条件分支，生产持久ACK实现仍待双方

#### 7

**sequence_id**：SEQ-002

**message_id**：SEQ-002-DCC-RESULT-10

**kind**：compensation

**方向**：service→dcc

**条件**：仅精确原record或继承触发record来源的内部attempt，已保存可信原DCC来源且本次交付关联准确；天网/手工/来源待核不执行；仅独立未确认交付补送触发，与新业务尝试/新结果版本分开

#### 8

**sequence_id**：SEQ-003

**message_id**：SEQ-003-DCC-INITIAL_PROGRESS-06

**kind**：external_call

**方向**：service→dcc

**条件**：仅精确原record或继承触发record来源的内部attempt，已保存可信原DCC来源且本次交付关联准确；天网/手工/来源待核不执行；本地结果先保存，发起/等待/失败均不阻塞本地处理、人工或自动守卫

#### 9

**sequence_id**：SEQ-003

**message_id**：SEQ-003-DCC-INITIAL_PROGRESS-07

**kind**：response

**方向**：dcc→service

**条件**：仅精确原record或继承触发record来源的内部attempt，已保存可信原DCC来源且本次交付关联准确；天网/手工/来源待核不执行；仅实际业务响应到达的条件分支，生产持久ACK实现仍待双方

#### 10

**sequence_id**：SEQ-003

**message_id**：SEQ-003-DCC-INITIAL_PROGRESS-10

**kind**：compensation

**方向**：service→dcc

**条件**：仅精确原record或继承触发record来源的内部attempt，已保存可信原DCC来源且本次交付关联准确；天网/手工/来源待核不执行；仅独立未确认交付补送触发，与新业务尝试/新结果版本分开

#### 11

**sequence_id**：SEQ-003

**message_id**：SEQ-003-DCC-UPDATED_PROGRESS-06

**kind**：external_call

**方向**：service→dcc

**条件**：仅精确原record或继承触发record来源的内部attempt，已保存可信原DCC来源且本次交付关联准确；天网/手工/来源待核不执行；本地结果先保存，发起/等待/失败均不阻塞本地处理、人工或自动守卫

#### 12

**sequence_id**：SEQ-003

**message_id**：SEQ-003-DCC-UPDATED_PROGRESS-07

**kind**：response

**方向**：dcc→service

**条件**：仅精确原record或继承触发record来源的内部attempt，已保存可信原DCC来源且本次交付关联准确；天网/手工/来源待核不执行；仅实际业务响应到达的条件分支，生产持久ACK实现仍待双方

#### 13

**sequence_id**：SEQ-003

**message_id**：SEQ-003-DCC-UPDATED_PROGRESS-10

**kind**：compensation

**方向**：service→dcc

**条件**：仅精确原record或继承触发record来源的内部attempt，已保存可信原DCC来源且本次交付关联准确；天网/手工/来源待核不执行；仅独立未确认交付补送触发，与新业务尝试/新结果版本分开

#### 14

**sequence_id**：SEQ-004

**message_id**：SEQ-004-DCC-RESULT-06

**kind**：external_call

**方向**：service→dcc

**条件**：仅精确原record或继承触发record来源的内部attempt，已保存可信原DCC来源且本次交付关联准确；天网/手工/来源待核不执行；本地结果先保存，发起/等待/失败均不阻塞本地处理、人工或自动守卫

#### 15

**sequence_id**：SEQ-004

**message_id**：SEQ-004-DCC-RESULT-07

**kind**：response

**方向**：dcc→service

**条件**：仅精确原record或继承触发record来源的内部attempt，已保存可信原DCC来源且本次交付关联准确；天网/手工/来源待核不执行；仅实际业务响应到达的条件分支，生产持久ACK实现仍待双方

#### 16

**sequence_id**：SEQ-004

**message_id**：SEQ-004-DCC-RESULT-10

**kind**：compensation

**方向**：service→dcc

**条件**：仅精确原record或继承触发record来源的内部attempt，已保存可信原DCC来源且本次交付关联准确；天网/手工/来源待核不执行；仅独立未确认交付补送触发，与新业务尝试/新结果版本分开

**historical_sequence_refs_status**：stale_after_SRC118_121_scope_change

**current_scope_source_refs**

1. inputs/source-index.json#SRC-118

2. inputs/source-index.json#SRC-119

3. inputs/source-index.json#SRC-120

4. inputs/source-index.json#SRC-121

5. inputs/source-index.json#SRC-122

6. inputs/source-index.json#SRC-123

7. memory/normalized-user-stories.json#AC-096

8. memory/normalized-user-stories.json#AC-097

9. memory/normalized-user-stories.json#AC-098

10. inputs/source-index.json#SRC-124

11. memory/normalized-user-stories.json#AC-101

12. inputs/source-index.json#SRC-125

13. memory/normalized-user-stories.json#AC-104

**current_scope_contract_status**：PROPOSED_CURRENT_SCOPE_NOT_S4_VERIFIED

**verification_status_authority**：沿原台账，只说明既有文档核验程度；本轮自定义契约未验证

**proposed_contract**

**状态**：PROPOSED_CURRENT_SCOPE_NOT_S4_VERIFIED

**fields_are_proposals_not_formal_schema**：True

**identity_fields**

1. originalAppId

2. tenantId

3. requestId

4. recordId

5. resultId

6. resultVersion

**mode_specific_fields**

**predictive**

1. originalTaskId

2. batchId

3. rootBatchId

4. attemptId

5. actualFileId

6. callId

**manual**

1. assignmentId

2. agentWorkNo

3. callId

4. followupId

**payload_separation**

1. objectiveCallResult

2. agentReportedCallStatus

3. processingOutcome

4. followupState

**delivery_targets**：原应用自身回调地址；配置版本和积压取值时点待核

**ack_proposal**：匹配原 app/tenant/交付 ID 与版本且业务持久接收；accepted 字段/签名均未定

**short_hangup**：沿可信三态分类，只回传/显示，不创建补提交；人工状态不得作为秒挂证据。

**business_batch_field**：businessBatchNo：每次适用回调携原记录保存原值，可重复，历史缺值明确保留；与平台/供应商批次和技术身份分离。

**completion_event**

**状态**：PROPOSED_CURRENT_SCOPE_NOT_S4_VERIFIED

**fields_are_proposals_not_formal_schema**：True

**development_operation_id**：DRAFT-OP-COMPLETION-CALLBACK

**local_logic_id**：DLOCAL-COMPLETION-CALLBACK

**snapshot_field_id**：DFIELD-125

**snapshot_field_proposal**：completionSnapshot

**reading_event_id**：EVENT-FOLLOWUP-COMPLETED

**触发**

1. 本次外呼已结束，准确归属原记录和本次call。

2. 坐席本次agentDisposition明确为“已完成沟通”。

3. 本次跟进、客户业务信息和处理结果全部保存成功。

**not_triggers**

1. 通用processingStatus=已完成

2. 振铃/通话中或未保存

3. 仅业务表单独立编辑保存

4. 保存失败或部分保存

5. 其他处理结果（含继续跟进）

**范围**：全部有准确接入应用归属的外呼记录，两种外呼方式均适用；无接入app手工UI仅本地保存，不扩呼入。

**identity_proposal**：稳定eventId+eventVersion绑定原app/tenant/record、本次call和跟进保存版本；重复保存/通知不重复生成同一完成事件，修改保存与新版本语义待S4。businessBatchNo可重复，不能单独作事件去重键。

**snapshot_proposal**

**original_identity**：原稳定app、tenant、业务record/request及原businessBatchNo，不按当前token/最近记录重取。

**current_call**：本次准确callId及本次通话记录已知客观事实，缺少的CDR/时长/接听信息明确未知，不因已完成沟通伪造接通。

**saved_business_information**：该次成功保存的customerFollowup/业务类型、字段标识和值及适用配置/类型/选项版本；正式形状待S4。不从CustomerFollowup.aggregate或客户最新汇总取得。

**human_fields**：本次agentDisposition、dispositionRemark、独立agentCallStatus（若适用）、录入人/时间、跟进保存版本；与供应商客观结果分开。

**immutability**：初始事件和补送读取同一已保存快照，不重新读取后续业务编辑、跨通话聚合或同批其他客户。

**business_field_codes**：本次已填写的客户业务信息，包含选填字段，均随快照携带字段业务编码及保存值；有选项时携对应选项业务编码/值，多选完整保留全部选中编码。不能只发显示label、内部字段ID或内部选项ID。保存时固定对应配置编码/版本，后续配置变更不改补送；未填写不猜造编码值，历史缺业务编码明确待核。正式载荷字段名和嵌套schema仍为proposed。

**missing_business_code_behavior**：已填字段或选中选项缺业务编码时，回调资料须明确待完善/待核，不能以label或内部ID兜底并标完整交付成功；本次新协议不自行把已有效的本地保存改成失败。缺码补全、修正版本和再次交付规则待正式契约，不静默改旧已发快照。

**original_import_business_context**：完成沟通事件另携本记录本次导入保存的六个选填业务字段intentionStoreCode/intentionStoreName/intentionSeriesCode/intentionSeries/smartCode/leadCreatedAt；按原app/tenant/record及本次call准确关联，已填携原码/原名称/原Smartcode，未提供保留缺值，不能以其他同手机号/线索/批次的最新导入或后续编辑覆盖。本次导入业务信息与坐席本次填写的customerFollowup快照并列，原plannedStoreName不被导入意向门店覆盖；补送使用同一固定快照。 留资时间leadCreatedAt是业务系统提供的原线索留资时间，选填；与平台importedAt和跟进savedAt分别保存/展示。未提供不填当前时间，不由其他时间推算；按原提供值透传，正式wire类型、时间格式及时区待S4确认，不凭样例冻结。

**original_import_business_field_proposals**

#### 1

**存储语义键**：intentionStoreCode

**label**：意向门店编码

**field_ref**：DFIELD-126

**required**：False

**value_origin**：saved_original_import_row_not_latest_customer_or_followup_aggregate

#### 2

**存储语义键**：intentionStoreName

**label**：意向门店名称

**field_ref**：DFIELD-127

**required**：False

**value_origin**：saved_original_import_row_not_latest_customer_or_followup_aggregate

#### 3

**存储语义键**：intentionSeriesCode

**label**：意向车系编码

**field_ref**：DFIELD-128

**required**：False

**value_origin**：saved_original_import_row_not_latest_customer_or_followup_aggregate

#### 4

**存储语义键**：intentionSeries

**label**：意向车系

**field_ref**：DFIELD-129

**required**：False

**value_origin**：saved_original_import_row_not_latest_customer_or_followup_aggregate

#### 5

**存储语义键**：smartCode

**label**：Smartcode

**field_ref**：DFIELD-130

**required**：False

**value_origin**：saved_original_import_row_not_latest_customer_or_followup_aggregate

#### 6

**存储语义键**：leadCreatedAt

**label**：留资时间

**field_ref**：DFIELD-131

**required**：False

**value_origin**：saved_original_import_row_not_platform_importedAt_or_followup_savedAt

**persistence_proposal**：生产保存、快照和待交付事件须有一致性/恢复方案；业务表单日志单独保存或前端按钮返回不等于事务已验证。失败保留原草稿/名单，不以部分写入发事件。

**delivery**：复用API-010原应用回调通道，无新确认HTTP端点；按准确原app/tenant寻址该app配置。未知或冲突归属保留待核，不默认DCC或猜接收方。

**retry**：交付失败仅补送相同事件版本、原业务批次号与保存快照；不重导/重新分配/拨号，不建供应商尝试或消耗预测失败预算。

**coexistence**：原每次结果/进度、真实失败和秒挂回调均继续；新增完成事件不替代、不撤销、不等待它才发原结果。全部适用回调携原记录businessBatchNo。

**late_objective_updates**：本次真实话单晚到/更正仅按待核更新或版本契约补充同call客观事实，不能覆盖原已保存客户业务快照、人工通话状态或处理决定；字段完整性、是否延迟首次发送、补充载荷和ACK策略待核。

**ack_proposal**：ACK须匹配原app/tenant/事件与版本并确认业务持久接收；字段/签名/超时/补送/地址变更积压目标和重复或修改保存语义待双方契约与工程验证。HTTP受理或本地保存不等于交付成功。 既有结果/进度与新增完成沟通事件即使复用DFIELD-089/090/091，也须按候选事件类型(type)、准确事件ID及版本隔离状态/ACK；旧结果ACK不得确认完成事件，完成事件ACK不得代确认其他结果或版本。正式字段仍待契约。

**实现状态**：not_implemented_or_runtime_verified_this_revision

**scenario_refs**

1. SC-007

2. SC-002

**来源**：inputs/source-index.json#SRC-123, memory/normalized-user-stories.json#AC-095, memory/normalized-user-stories.json#AC-096, memory/normalized-user-stories.json#AC-097, memory/normalized-user-stories.json#AC-098, inputs/source-index.json#SRC-124, memory/normalized-user-stories.json#AC-101

**交付优先级**

**级别**：P0

**角色**：primary

**优先组**

1. P0-FOLLOWUP

**范围**：外呼已结束且已完成沟通保存成功后，以本次通话和已保存业务快照回调原应用；复用原交付通道。 本次原导入意向门店/车系/Smartcode/留资时间作为独立业务信息载荷并保原值。

**local_implementation_boundary**：只读代码显示CustomerBusiness field/option.businessKey允许空，CustomerFollowup当前保存内部字段/选项ID对应值，尚未在成功保存时固化业务编码快照；不能将现有跟进保存或旧VM28组作为此协议已实现证据。

**business_field_encoding_proposal**

**状态**：PROPOSED_CURRENT_SCOPE_NOT_S4_VERIFIED

**requirement**：本次已填写的客户业务信息，包含选填字段，均随快照携带字段业务编码及保存值；有选项时携对应选项业务编码/值，多选完整保留全部选中编码。不能只发显示label、内部字段ID或内部选项ID。保存时固定对应配置编码/版本，后续配置变更不改补送；未填写不猜造编码值，历史缺业务编码明确待核。正式载荷字段名和嵌套schema仍为proposed。

**范围**：所有适用业务信息回调中的已填可选字段；本轮完成沟通事件按本次保存快照携带。仅有客观通话结果且无业务信息的事件不伪造字段内容。

**source_ref**：memory/normalized-user-stories.json#AC-098

**missing_code_behavior**：已填字段或选中选项缺业务编码时，回调资料须明确待完善/待核，不能以label或内部ID兜底并标完整交付成功；本次新协议不自行把已有效的本地保存改成失败。缺码补全、修正版本和再次交付规则待正式契约，不静默改旧已发快照。

**event_ack_isolation**：既有结果/进度与新增完成沟通事件即使复用DFIELD-089/090/091，也须按候选事件类型(type)、准确事件ID及版本隔离状态/ACK；旧结果ACK不得确认完成事件，完成事件ACK不得代确认其他结果或版本。正式字段仍待契约。

**交付优先级**

**级别**：P0

**角色**：dependency

**优先组**

1. P0-APP

2. P0-IMPORT

3. P0-FOLLOWUP

**范围**：全部接入应用按原 app/tenant 接收每次准确结果/进度及适用人工跟进信息；人工状态与供应商结果分开表达，正式字段/版本/ACK仍待确认。 基础通道是依赖；独立完成沟通事件在completion_event标P0-FOLLOWUP primary，不能将整行所有能力升级。

**business_type_contract**

**存储语义键**：businessType

**field_ref**：DFIELD-024

**级别**：request

**required**：True

**wire_type**：string_code

**one_type_per_request**：True

**authority**：authenticated_token_tenant_enabled_stable_business_type_code

**new_request_validation**：请求级必填businessType，使用已验真的token租户当前启用的稳定业务类型编码；一次请求仅一种业务类型，适用预外呼及人工外呼。缺失、无效或已停用的新业务请求整次拒收，不保存客户、分配、占用补提交额度或提交供应商。不同类型分次导入，可复用同businessBatchNo；不以来源source或callMode代替类型。

**idempotency**：在当前身份/授权复核后，先按原幂等作用域核完整请求内容；businessType纳入内容比较但不新增幂等命名空间。同requestId改类型是内容冲突；已受理同内容技术重放只读返回原回执、不再新增，即使该类型后来停用也不改写已受理记录。不因改类型改变原leadCode/手机号归组、主子批或共享失败累计键。

**persist**：每条成功接收记录固化本次原businessType稳定码及当时显示名称，准确关联原app/tenant/request/row/record与本call；历史缺失不批量补值，不按最近同号、来源或外呼方式猜类型。后续名称/启停配置变化不改原类型码或来源快照。

**display_and_form**：客户名单和详情显示本次保存的业务类型名称，详情保留其编码；坐席跟进按本条原类型自动使用对应业务表单，来源类型只读，不按其他同手机号记录或应用来源重选。历史无值显示未提供并保持原处理边界；已停用/无法解析的表单保留原值并明确待处理，不偷偷换成其他业务类型。原手工弹窗仍使用既有业务类型选择，不增加逐行CSV必填列。

**callback**：每次结果/进度及已完成沟通回调均携准确原app/tenant/record/call导入时保存的businessType稳定码和既有businessBatchNo；补送沿原事件快照。类型后续改名或停用不重算原码，历史未知不猜值，不只回传类型名称，也不替代已填字段/选项业务编码。正式回调报文与ACK仍待契约及工程验证。

**classification_keys_unchanged**：True

**formal_contract_status**：PROPOSED_CURRENT_SCOPE_NOT_S4_VERIFIED

**来源**：inputs/source-index.json#SRC-125, memory/normalized-user-stories.json#AC-102, memory/normalized-user-stories.json#AC-103, memory/normalized-user-stories.json#AC-104

#### API-011 预测已失败记录人工异常补提交

**标识**：API-011

**名称**：预测已失败记录人工异常补提交

**方向**：原任务有权运营／管理员→平台内部失败处理服务

**kind**：manual_failure_resubmission

**用途**：仅对已保存的八类准确失败对象明确人工补提交，与初始名单导入及外部DCC接口分开。

**范围**：active

**核验状态**：missing

**production_ready**：False

**real_call_allowed**：False

**文档端点**：待核／未提供

**文档方法**：待核／未提供

**生产路由**：待核／未提供

**production_route_status**：not_confirmed_or_not_applicable

**输入**

1. failedRecordId：拟定的既有准确失败处理对象标识，不是新名单或前台手机号输入

2. actionId：拟定人工操作幂等标识；同授权业务作用域/同ID同内容复用已保存attempt，异内容冲突不再次提交

3. expectedVersion：拟定失败对象版本，须与当前可操作对象一致；不能以旧稿/旧状态操作

4. confirmed：拟定Boolean明确确认意图，仅true进入实际服务端守卫；false/缺失不发起

5. 原tenant/原task/保存leadCode/原phone（预算四要素）、source/root/priority/失败原因及预算均从服务端已保存对象读取；前台不能换scope、补猜线索编码或修改预算，操作身份来自认证上下文。

**输出**

1. 拟定actionId/failedRecordId/currentVersion和原或本次attemptId（未创建时null）

2. disposition：拟定本次处理结果，含未确认/拒绝/待核/原处理复用/已安排或已执行；不把命令接收当供应商受理

3. state与reason：拟定等待/待核/执行/明确受理/明确拒绝/停止及明确原因，不伪造未知fileId

4. budget.used/reserved/available仍为拟定服务端字段，max=2；按同租户＋原task＋保存leadCode＋原phone跨主子批累计，未知占用保留。作用域业务已确认，真实聚合/持久化实现未验证。

5. 实际supplier fileId仅在准确响应与映射存在时返回；原root/source/task/priority沿保存事实，前台不能改

6. 四要素或累计/占用证据不可信时budget可unknown/null，不默认used=0/available=2。root关联不足仍阻断准确执行，但不按root重建预算；available只是算术值，未知占用仍禁止重发。

**authentication**：人工八类沿该任务现有操作权限，由有该任务权限的运营人员或管理员执行；每次服务端核实身份及授权租户/原任务/准确记录范围和当前任务操作权限。角色身份、按钮可见、记录历史来源或初始名单导入入口本身不替代该任务当前授权；不新增角色、赋予真实账号权限或放开跨租户操作。 真实鉴权机制、路由和后端权限执行仍missing，本次业务选择不证明真实账号授权或服务已实现。

**idempotency**：拟定在经认证且授权对象范围内按actionId核完整命令内容：同ID同内容返回原处理/attempt及其当前状态，不再次外发；同ID异内容拒绝冲突。expectedVersion不匹配或confirmed不为true不发起。不同actionId仍受同失败对象有效尝试和共享预算原子守卫约束，不能通过换ID/操作者重置额度。正式命名空间、持久化及事务方式待工程落实。 同ID同内容先返回原动作对应尝试的当前状态，即使对象后来升版也不重发；只有新的actionId才校验expectedVersion是否等于当前对象版本。前置身份/对象授权每次仍必核。 同四要素跨主批共享额度；不同actionId/failedRecordId或操作者、M1/M2新主均受同一预算已用/预占/未知守卫。actionId命名空间仍待工程确认，不把四要素预算直接冒充传输幂等键。

**timeout**：未知结果保留原计划/尝试占用待核，人工重复点击不视为新业务补提交。

**rate_limit**：首次外最多2次业务失败补提交；接口流量/频率保护待工程落实，不与三天五呼混用。

**errors**

1. 拟定业务反馈类别（不是已确认HTTP码）：NOT_CONFIRMED / PERMISSION_DENIED / PERMISSION_UNCONFIRMED / TARGET_NOT_FOUND / VERSION_CONFLICT / ACTION_CONTENT_CONFLICT / NOT_MANUAL_CAUSE / BUDGET_EXHAUSTED / ALREADY_PROCESSING / TASK_PAUSED / TASK_STOPPED / TARGET_CANCELLED / ASSOCIATION_UNCONFIRMED / DISPATCH_UNCERTAIN / PROVIDER_EXECUTION_UNCONFIRMED；名称待评审。

**guards_and_limits**

1. 仅处理已保存、同租户且有现有任务权限的预测记录；不套人工外呼分配。

2. 操作仅选择已有失败对象并确认；actionId/expectedVersion是后台拟定元数据，不新增技术输入框或手机号/priority/root编辑。

3. 每次核当前任务权限与准确记录；DCC/TW app业务token不获人工运营权限。三自动、秒挂、53及同步导入拒绝不使用此命令。

4. 先鉴权，再同actionId完整内容重放原动作当前状态；只有新action校验当前expectedVersion和Boolean true。换actionId不绕过同对象执行权或四元组共享2次。

5. 真正新业务发起占一次，拒绝亦计；已证发起UNKNOWN保used，是否发起不明保reserved，均不盲目再发。root不足或历史预算无法恢复先待核，不用业务编码/新root补猜。

**open_issue_ids**

1. ISSUE-002

2. ISSUE-004

3. ISSUE-029

4. ISSUE-035

5. ISSUE-037

6. ISSUE-038

**source_ref**：需求/1.1.0/分析工作区/interfaces/interface-index.json#API-011

**来源**：inputs/source-index.json#SRC-089, inputs/source-index.json#SRC-090, inputs/source-index.json#SRC-091, inputs/source-index.json#SRC-092, inputs/source-index.json#SRC-093, inputs/source-index.json#SRC-094, inputs/source-index.json#SRC-096, inputs/source-index.json#SRC-099, inputs/source-index.json#SRC-102, inputs/source-index.json#SRC-103, inputs/source-index.json#SRC-106, inputs/source-index.json#SRC-109, inputs/source-index.json#SRC-110, inputs/source-index.json#SRC-115, inputs/source-index.json#SRC-116

**documented_endpoint_authority**：no_confirmed_endpoint_or_retired

**source_refs_authority**：原供应商/旧 S4 追踪引用；本轮 S4 未重跑，不是当前已审接口契约

**historical_sequence_refs**

#### 1

**sequence_id**：SEQ-003

**message_id**：SEQ-003-LOCAL-014

**kind**：request

**方向**：ui→service

**条件**：当前八类明确确认，工程字段提案/真实route/auth未实现

#### 2

**sequence_id**：SEQ-003

**message_id**：SEQ-003-LOCAL-017

**kind**：response

**方向**：service→ui

**条件**：仅本次人工命令当前反馈；重放/拒绝分支不继续新外发

**historical_sequence_refs_status**：stale_after_SRC118_121_scope_change

**current_scope_source_refs**

1. inputs/source-index.json#SRC-118

2. inputs/source-index.json#SRC-119

3. inputs/source-index.json#SRC-120

4. inputs/source-index.json#SRC-121

**current_scope_contract_status**：PROPOSED_CURRENT_SCOPE_NOT_S4_VERIFIED

**verification_status_authority**：沿原台账，只说明既有文档核验程度；本轮自定义契约未验证

**applicable_call_modes**

1. predictive

#### API-012 供应商外显导航配置与自动降级能力证据

**标识**：API-012

**名称**：供应商外显导航配置与自动降级能力证据

**方向**：供应商内部导航责任；平台集成取证↔AliCti CRN文档候选

**kind**：supplier_navigation_dependency

**用途**：核对三类失败依赖的既有外显导航及配置；本轮不新增导航编辑、换线路或解禁产品操作。

**范围**：evidence_dependency

**核验状态**：partial

**production_ready**：False

**real_call_allowed**：False

**文档端点**：/interface/{version}/crnNodeConfig/query；/interface/{version}/crnNodeConfig/update（供应商权重配置取证候选，非本平台新增独立操作）

**文档方法**：query GET/POST；update POST（文档v10；实际部署/配置资格待核）

**生产路由**：待核／未提供

**production_route_status**：not_confirmed_or_not_applicable

**输入**

1. 既有任务customerClidsCategory=5（外显导航）

2. 既有任务customerClidsGroup（单个导航标识String）

3. 既有任务clidPoolList[].name/priority（可选号码池和整数优先级，数值越小越优先）

4. CRNquery：既有供应商validateType/条件departmentId或enterpriseId/timestamp/sign；crnId String必填，nodeType Integer可选（当前8权重节点），nodeId String可选

5. CRNupdate：既有供应商公共鉴权；body crnId String必填，nodeId/nodeName String至少一个且ID优先；nodeType Integer可选（当前8），config Object必填

6. CRNupdate config：enableTrunkGroupWeight/enableClidPoolWeight Int可选（0/1）；trunkGroupWeight数组条目key String与weight Int1～100；clidPoolWeight数组条目id Int/name String至少一个且ID优先、weight Int1～100；支持增量更新

**输出**

1. 任务配置/实际选号和降级证据的生产关联与生效契约待核；不假定存在独立降级成功回执

2. CRNquery/update：result String（字符串0成功，其余失败）、description String、data Object；不是普通任务result Int的直接同型复制

3. CRN data：enterpriseId/crnId String、nodes Array、errors Array、success Boolean；additionalInfo Object仅查询返回

4. CRN nodes：nodeId/nodeName/nodeType String、config Object、createTime/updateTime String；返回nodeType String与请求Integer须区分

5. CRN nodes[].config：enableTrunkGroupWeight/enableClidPoolWeight返回String0/1；更新传入Int；trunkGroupWeight/clidPoolWeight数组；invalidTrunkGroups/invalidClidPools为仅更新返回的无效资源列表

6. CRN additionalInfo.nodeType_8：availableTrunkGroups/availableClidPools数组；列为可用不证明本项目实际调用资格或降级生效

**authentication**：既有供应商任务及CRN配置文档validateType/条件departmentId或enterpriseId/timestamp/sign；不与本平台或DCC业务token混用。导航归属、配置资格、有效资源权限及实际可用性尚未实测；不新增本期导航编辑或解禁权限。

**idempotency**：CRN文档增量更新与无效项过滤不等于幂等/原子完整更新，重复/未知更新恢复协议待核；导航内部尝试与平台补导/原生task retry的关联、重复及执行权仍待核，新fileId或finishRetryFlag不证明无在途。

**timeout**：CRN文档未给查询/更新超时、配置生效或降级生效时限；未知配置结果须保留并核实，不能按120秒认定已成功。120秒来自用户平台补提交规则，不是供应商服务承诺，也不新增等待配置/降级回执的前置。

**rate_limit**：CRN公开条款没有具体访问速率、三类失败触发阈值/频率/恢复规则或替代资源耗尽保证；配置权重1～100是比例参数，不是线索priority或平台共享额外2次预算。

**errors**

1. CRN格式错误/权重超1～100/必需字段缺失可失败；无效或无权中继组/号码池可被过滤而继续更新

2. CRN总体result为字符串0或data.success不能独自说明所有请求配置完整成功；须保留errors及invalidTrunkGroups/invalidClidPools并核对目标，原文未给完整原子生效保证

3. 三类呼叫失败到导航降级节点/线路/外显的映射及限制作用域未给，不能由CRN权重接口推定已解除限制

**guards_and_limits**

1. 仅适用于本行预测业务范围；人工模式的身份/拨号/结果契约独立待核。

2. CRN权重配置仅证明配置接口和权重比例，不证明三类触发、限制作用域、生效时间或一定避开旧线路。

3. 请求节点类型和开关Int、响应对应String须区分；result字符串0、errors/invalid资源与success均保留，不把部分过滤当完整生效。

4. 平台自动等待从确认准确失败起120秒；不以此宣称导航已生效或限制已解除；不新增先降级成功ACK业务前置。

**open_issue_ids**

1. ISSUE-004

2. ISSUE-024

3. ISSUE-029

4. ISSUE-035

5. ISSUE-037

6. ISSUE-039

**source_ref**：需求/1.1.0/分析工作区/interfaces/interface-index.json#API-012

**来源**：inputs/source-index.json#SRC-082, inputs/source-index.json#SRC-089, inputs/source-index.json#SRC-099, inputs/source-index.json#SRC-100, inputs/source-index.json#SRC-102, inputs/source-index.json#SRC-103, inputs/source-index.json#SRC-104, inputs/source-index.json#SRC-105, inputs/interface-documents/API-311.txt#L286-L305, inputs/interface-documents/API-404.txt#L181-L198, inputs/source-index.json#SRC-110, inputs/source-index.json#SRC-111

**documented_endpoint_authority**：supplier_document_not_target_deployment_verified

**documented_navigation_configuration_contract**

**documented_api_version**：v10

**actual_deployment_version**：待核／未提供

**用途**：配置取证候选，不新增本平台独立配置操作

**query**

**endpoint**：/interface/{version}/crnNodeConfig/query

**方法**：GET/POST

**request_node_type**：Integer可选，当前8

**response_node_type**：String

**returns_available_resources**：True

**update**

**endpoint**：/interface/{version}/crnNodeConfig/update

**方法**：POST

**node_locator**：nodeId/nodeName至少其一，ID优先

**supports_incremental_fields**：True

**weight_range**

1. 1

2. 100

**weight_sum_required_to_equal100**：False

**pool_locator**：id/name至少其一，ID优先

**request_switch_type**：Int0/1

**response_switch_type**：String0/1

**invalid_resource_behavior**：无效/无权项可过滤并继续更新，完整结果待核，不凭总体成功标所有目标成功

**response_result_type**：String

**response_success_value**：0

**data_success_type**：Boolean

**selected_production_config**：待核／未提供

**new_platform_configuration_operation**：False

**automatic_failure_degradation_coverage**：not_proven

**three_reason_rule**：平台确认准确失败结果后120秒补提交依赖既有供应商导航；该间隔不是CRN生效保证

**来源**：inputs/source-index.json#SRC-111

**source_refs_authority**：原供应商/旧 S4 追踪引用；本轮 S4 未重跑，不是当前已审接口契约

**historical_sequence_refs**

#### 1

**sequence_id**：SEQ-003

**message_id**：SEQ-003-LOCAL-007

**kind**：action

**方向**：vendor→vendor

**条件**：既有供应商导航依赖说明，不是当前已发生降级的通知

**historical_sequence_refs_status**：stale_after_SRC118_121_scope_change

**current_scope_source_refs**

1. inputs/source-index.json#SRC-118

2. inputs/source-index.json#SRC-119

3. inputs/source-index.json#SRC-120

4. inputs/source-index.json#SRC-121

**current_scope_contract_status**：PROPOSED_CURRENT_SCOPE_NOT_S4_VERIFIED

**verification_status_authority**：沿原台账，只说明既有文档核验程度；本轮自定义契约未验证

**applicable_call_modes**

1. predictive

**applicability_note**：本行已核文档/使用方案为预测业务；人工外呼不能默认复用，实际人工协议需另核。

#### API-013 AliCti任务创建/更新的正常重呼配置

**标识**：API-013

**名称**：AliCti任务创建/更新的正常重呼配置

**方向**：现有任务管理适配→AliCti；AliCti内部执行正常任务规则

**kind**：existing_task_retry_configuration

**用途**：复用既有创建/更新任务配置的正常重呼字段证据；呼叫过频归任务规则，非本平台失败次数。

**范围**：evidence_dependency

**核验状态**：partial

**production_ready**：False

**real_call_allowed**：False

**文档端点**：/interface/{version}/task/create；/interface/{version}/task/update（既有任务操作的字段证据）

**文档方法**：GET/POST（本地文档version=v10；当前部署版本待核）

**生产路由**：待核／未提供

**production_route_status**：not_confirmed_or_not_applicable

**输入**

1. 既有公共供应商鉴权validateType/条件departmentId或enterpriseId/timestamp/sign；不新增本平台对外应用/token

2. 创建任务既有type Int（1预测/2自动，创建后不支持修改类型）及已有必填任务信息；本条不是完整建任务规格

3. 更新既有taskId String必选及实际要更新的属性；不新增本期独立更新操作

4. retryStrategy String可选：基础JSON对象含retry/strategy[].round/time，高级JSON数组含condition.sipCause/retry/sort/strategy[].round/time

5. retryStrategyTimeType Int可选：1基于首次呼叫时间，2基于上次呼叫时间；文档默认首次，但本项目采用值待核

6. retryStrategyOnlyToday Int可选：0关闭；1删待重试及待呼叫；2删待重试；3删待呼叫；文档默认关闭，不在本项目自动选值

7. callPriorityStrategy String可选：既有retryCall/firstCall排序字段，仅按原文记录，不在本轮新增排序配置操作

**输出**

1. result Int（0成功/-1失败）

2. description String（原描述）

3. errorCode Int（result=-1时返回）

4. data JSON（文档data定义列taskProperty/TaskProperty；示例直接列任务属性，准确嵌套/类型与版本需核对）

**authentication**：复用既有供应商任务创建/更新鉴权；真实调用资格、token归属与配置生效查证仍待工程核验，不生成实际凭据或发起操作。

**idempotency**：配置更新/重试幂等、运行中生效及重复导入新旧fileId是否重置/延续原生轮次未明确；不把taskProperty字段或本地主子ID当无在途/跨批计数保证。

**timeout**：未知创建/更新结果应保留原尝试并核实实际配置，不凭超时重建任务、重置正常计数或自动重发；可靠协议尚未实测。

**rate_limit**：文档列接口访问超频错误，具体访问频率待核；接口超频不等被叫呼叫过频，正常三天五呼的本项目口径未由这些限制确定。

**errors**

1. 文档参数必填/格式/取值/范围与访问频次错误；数值errorCode映射未在本条原文完整给出

**guards_and_limits**

1. 仅适用于本行预测业务范围；人工模式的身份/拨号/结果契约独立待核。

2. SEQ-006既有任务创建实际引用本API；SEQ-002供应商原生执行仅职责说明，不应实现成每次结果再调用更新任务。

3. 预测高级模式适用性、三天起点、五呼含初呼与跨file轮次仍未核，文档默认不自动成为项目决定。

4. 平台三自动/八人工共享额外2次与原生三天五呼分开；不以finishRetryFlag或查无话单证明无原生在途。

**open_issue_ids**

1. ISSUE-029

2. ISSUE-033

3. ISSUE-035

**source_ref**：需求/1.1.0/分析工作区/interfaces/interface-index.json#API-013

**来源**：inputs/source-index.json#SRC-104, inputs/source-index.json#SRC-105, inputs/source-index.json#SRC-108, inputs/source-index.json#SRC-089, inputs/source-index.json#SRC-091, inputs/source-index.json#SRC-106, inputs/interface-documents/API-311.txt#L55-L118, inputs/interface-documents/API-311.txt#L140-L144, inputs/interface-documents/API-311.txt#L242-L276, inputs/interface-documents/API-311.txt#L554-L608, inputs/interface-documents/API-404.txt#L6-L60, inputs/interface-documents/API-404.txt#L144-L173, inputs/interface-documents/API-404.txt#L391-L431, inputs/interface-documents/DOC-338.txt#L79-L105, inputs/source-index.json#SRC-110, inputs/source-index.json#SRC-111, inputs/source-index.json#SRC-116

**documented_endpoint_authority**：supplier_document_not_target_deployment_verified

**documented_retry_contract**

**basic_shape**：JSON对象：retry与strategy[{round,time}]

**retry_description**：重试次数；不自动等同本项目总呼叫次数

**time_format**：天-小时-分钟

**time_type_values**

**1**：基于首次呼叫时间

**2**：基于上次呼叫时间

**documented_time_type_default**：1

**adopted_time_type**：待核／未提供

**retry_only_today_values**

**0**：关闭

**1**：删除待重试和待呼叫数据

**2**：删除待重试数据

**3**：删除待呼叫数据

**documented_retry_only_today_default**：0

**adopted_retry_only_today**：待核／未提供

**advanced_shape**：JSON数组，condition.sipCause/retry/sort/strategy[{round,time}]

**advanced_service_prerequisite**：号码状态识别服务

**mode_evidence**

**API-311/API-404**：通用参数中的高级模式需号码状态识别，未完整列预测/自动适用差别

**DOC-338**：高级目前只支持自动外呼任务模式

**interpretation_status**：current_predictive_advanced_support_not_proven; version_and_mode_scope_pending

**Wiki_2026-10-13_create_update**：当前注册原文重核仍列通用高级参数及号码状态识别要求，未完整闭合预测适用差别

**Wiki_2026-10-13_TaskProperty**：当前注册原文重核仍写高级目前仅自动外呼任务模式

**normal_three_day_five_call_policy**：业务窗口/含初呼/跨fileId累计尚未定，不从文档默认替用户确定

**cross_file_retry_scope**：not_documented

**production_default_configuration**：not_created

**wiki_recheck**

**date**：2026-10-13

**来源**：inputs/source-index.json#SRC-111

**mode_conflict_preserved**：True

**actual_predictive_qualification**：not_proven

**policy_defaults_selected**：False

**three_day_start**：待核／未提供

**five_call_includes_first**：待核／未提供

**cross_file_rounds**：待核／未提供

**source_refs_authority**：原供应商/旧 S4 追踪引用；本轮 S4 未重跑，不是当前已审接口契约

**historical_sequence_refs**

#### 1

**sequence_id**：SEQ-002

**message_id**：SEQ-002-LOCAL-010

**kind**：action

**方向**：vendor→vendor

**条件**：仅供应商已配置正常规则的责任，非新的任务更新接口调用

#### 2

**sequence_id**：SEQ-006

**message_id**：SEQ-006-LOCAL-003

**kind**：external_call

**方向**：service→vendor

**条件**：仅既有任务创建确认且已有必填配置可准确表达；本轮合成，非实际创建

#### 3

**sequence_id**：SEQ-006

**message_id**：SEQ-006-LOCAL-004

**kind**：response

**方向**：vendor→service

**条件**：对应本次既有任务创建响应；缺响应保持未知

**historical_sequence_refs_status**：stale_after_SRC118_121_scope_change

**current_scope_source_refs**

1. inputs/source-index.json#SRC-118

2. inputs/source-index.json#SRC-119

3. inputs/source-index.json#SRC-120

4. inputs/source-index.json#SRC-121

**current_scope_contract_status**：PROPOSED_CURRENT_SCOPE_NOT_S4_VERIFIED

**verification_status_authority**：沿原台账，只说明既有文档核验程度；本轮自定义契约未验证

**applicable_call_modes**

1. predictive

**applicability_note**：本行已核文档/使用方案为预测业务；人工外呼不能默认复用，实际人工协议需另核。

#### API-014 预测指定记录人工精准删除命令（本平台提案）

**标识**：API-014

**名称**：预测指定记录人工精准删除命令（本平台提案）

**方向**：原任务有权运营／管理员→平台内部指定删除服务

**kind**：internal_precise_delete_command

**用途**：明确确认指定记录删除，准确授权意图停止该对象未执行失败计划，远端结果独立留存。

**范围**：active

**核验状态**：missing

**production_ready**：False

**real_call_allowed**：False

**文档端点**：待核／未提供

**文档方法**：待核／未提供

**生产路由**：待核／未提供

**production_route_status**：not_confirmed_or_not_applicable

**输入**

1. recordId：拟定本次指定已保存记录ID，不接收自由填写手机号/任务/fileId/root

2. actionId：拟定操作幂等ID；同授权作用域同ID同命令复用原动作

3. expectedVersion：拟定指定记录当前可操作版本，仅新动作核当前一致

4. confirmed：拟定Boolean确认，只有true进入删除执行守卫；不隐式转换

5. 认证身份来自平台现有登录上下文；原租户/任务、source/固定phone、保存root、实际fileId与相关attempt、当前执行状态和共享预算均由服务端准确记录读取

**输出**

1. 拟定actionId/recordId/currentVersion及原或本次deleteAttemptId；未建时null

2. 拟定localPlanDisposition：尚未实际发起的该目标计划是否已停止，与远端删除分开

3. 拟定remoteDisposition：待核/未发起/明确删除/明确跳过/明确拒绝/发起或响应未知，不能单凭result=0标全删

4. 准确关联时保存供应商原result/description/errorCode/skippedCallingTels；不伪造fileId、在途撤回或全组取消

5. 拟定reason和当前状态来自已保存原动作；历史审计/话单/映射/失败已用及未知占用保留

**authentication**：沿用该任务现有操作权限，由有该任务权限的运营或管理员执行；服务端每次核实认证身份、授权租户/原任务和指定记录范围。按钮可见、角色称谓或记录历史来源不能替代当前授权；不新增角色、不变更真实账号权限、不授予跨租户操作。正式本方认证、路由及权限执行仍待工程核验。

**idempotency**：每次先认证并核当前对象授权/tenant/task范围；拟定同actionId同完整命令返回原动作当前状态，同ID异内容拒绝。只有新action才核expectedVersion与Boolean true确认。不同actionId仍须目标有效操作、准确映射和执行权原子守卫；同操作重放不重复远端删除，真实键作用域/持久化/并发尚未定。

**timeout**：未知结果保持原删除动作与固定目标待核；不重发、不扩大目标、不创建新action以绕过未知。可信受理核查/结果恢复仍无生产协议。

**rate_limit**：本方接口访问频率待工程定义；删除不计失败补提交次数，不恢复已用或发放新预算。

**errors**

1. 拟定业务反馈类别，不是正式HTTP码：NOT_CONFIRMED / PERMISSION_DENIED / PERMISSION_UNCONFIRMED / TARGET_NOT_FOUND / VERSION_CONFLICT / ACTION_CONTENT_CONFLICT / ASSOCIATION_UNCONFIRMED / EXACT_SELECTOR_UNAVAILABLE / ALREADY_PROCESSING / EXECUTION_UNCONFIRMED / REMOTE_SKIPPED / REMOTE_REJECTED / DELETE_DISPATCH_UNCERTAIN

**guards_and_limits**

1. 仅处理已保存、同租户且有现有任务权限的预测记录；不套人工外呼分配。

2. 从服务端保存记录取tenant/task/phone/root/实际fileId及预算，不允许前台自由拼任务号/手机号/fileId/root或整组目标。

3. 同actionId同命令返回原动作，只有新动作核版本/确认；原子互斥目标取消与失败补提交，真实工程协议仍待核。

4. 失败预算可用次数不作为删除资格；删除不重置额度。只有证明未外发的预占才可能按原协议释放，UNKNOWN不放行。

5. 本地目标计划停止与远端明确删除/跳过/拒绝/未知分别显示；不对DCC开放新删除接口，不声称远端在途撤回。

**open_issue_ids**

1. ISSUE-002

2. ISSUE-022

3. ISSUE-035

4. ISSUE-037

5. ISSUE-038

**source_ref**：需求/1.1.0/分析工作区/interfaces/interface-index.json#API-014

**来源**：inputs/source-index.json#SRC-110, inputs/source-index.json#SRC-107, inputs/source-index.json#SRC-115, inputs/source-index.json#SRC-116

**documented_endpoint_authority**：no_confirmed_endpoint_or_retired

**source_refs_authority**：原供应商/旧 S4 追踪引用；本轮 S4 未重跑，不是当前已审接口契约

**historical_sequence_refs**

#### 1

**sequence_id**：SEQ-009

**message_id**：SEQ-009-LOCAL-004

**kind**：request

**方向**：ui→service

**条件**：仅明确确认；method/route/生产鉴权仍missing，不隐式转换true字符串

#### 2

**sequence_id**：SEQ-009

**message_id**：SEQ-009-LOCAL-007

**kind**：response

**方向**：service→ui

**条件**：重放/拒绝互斥分支，此次不继续新远端请求

#### 3

**sequence_id**：SEQ-009

**message_id**：SEQ-009-LOCAL-013

**kind**：response

**方向**：service→ui

**条件**：候选远端选择器/执行权不满足，不执行后续供应商调用

#### 4

**sequence_id**：SEQ-009

**message_id**：SEQ-009-LOCAL-020

**kind**：response

**方向**：service→ui

**条件**：待核／未提供

**historical_sequence_refs_status**：stale_after_SRC118_121_scope_change

**current_scope_source_refs**

1. inputs/source-index.json#SRC-118

2. inputs/source-index.json#SRC-119

3. inputs/source-index.json#SRC-120

4. inputs/source-index.json#SRC-121

**current_scope_contract_status**：PROPOSED_CURRENT_SCOPE_NOT_S4_VERIFIED

**verification_status_authority**：沿原台账，只说明既有文档核验程度；本轮自定义契约未验证

**applicable_call_modes**

1. predictive

**内部能力**

#### INT-MANUAL-IMPORT 原手工名单检查与确认

**标识**：INT-MANUAL-IMPORT

**id_authority**：draft_reading_group_not_production_operation_id

**名称**：原手工名单检查与确认

**api_ids**

1. API-009

**方法**：待核／未提供

**路由**：待核／未提供

**contract_status**：PROPOSED_CURRENT_SCOPE_NOT_S4_VERIFIED

**输入**

1. 当前授权任务、业务类型、批次名称、原客户信息、单一线索编码/其他类型原编码、最终priority、可选备注/R、当前草稿

2. 六个导入业务字段逐行选填，两种外呼方式均适用；未传或留空不阻止合法导入。已填按字符串原值保存，编码和Smartcode保留前导零与大小写，不转数值、不凭名称查补编码、不凭编码补名称。各项可独立填写，不要求代码名称成对齐全；正式长度、格式、空值与错误码待核。不代替leadCode、requestId、businessBatchNo或填单plannedStoreName，也不改变原应用/租户/线索/通话归属。

3. 留资时间leadCreatedAt是业务系统提供的原线索留资时间，选填；与平台importedAt和跟进savedAt分别保存/展示。未提供不填当前时间，不由其他时间推算；按原提供值透传，正式wire类型、时间格式及时区待S4确认，不凭样例冻结。

**输出**

1. 解析/错误行、绑定当前草稿的预览、有效新record/单号batch及保存结果

**行为**：当前身份/租户/任务权限和锁定手工模式逐次核验；有效保存后复用API-002自动提交；客户端检查不能代服务端校验。 逐行保存已提供的六个导入业务字段，与原请求/应用/租户/记录绑定，不查补编码名称。

**real_call_allowed**：False

**current_source_refs**

1. inputs/source-index.json#SRC-118

2. inputs/source-index.json#SRC-119

3. inputs/source-index.json#SRC-120

4. inputs/source-index.json#SRC-121

5. inputs/source-index.json#SRC-124

6. memory/normalized-user-stories.json#AC-099

7. memory/normalized-user-stories.json#AC-100

**historical_sequence_message_refs**

1. SEQ-006-LOCAL-007

2. SEQ-006-LOCAL-013

3. SEQ-006-LOCAL-018

4. SEQ-006-LOCAL-020

**historical_sequence_status**：stale_pending_S5_rerun

**applicable_call_modes**

1. predictive

**six_import_business_fields_local_evidence**

**来源**：prototype/memory/verification-evidence/imported-customer-info-20261014.json

**sha256**：f738e2b24bbb4d36be47ae0c576d80618804683d9a31298c3fb44a642fd633df

**状态**：pass_scoped_source_checks_browser_pending

**范围**：21组实际源码VM/存储/HTML检查；六项来源字段选填、原值、局部保存和准确详情/早填上下文展示，局部未接通状态回归。

**formal_gate_passed**：False

**real_supplier_or_backend_verified**：False

**not_proven**

1. 真实对外导入API和正式字段/时间格式契约

2. 完成事件生成、原子可靠快照与业务系统回调

3. 完整101验收、02全局视觉或生产联调

#### INT-TASK-READ 任务、客户与通话记录查询

**标识**：INT-TASK-READ

**id_authority**：draft_reading_group_not_production_operation_id

**名称**：任务、客户与通话记录查询

**api_ids**

1. API-009

**方法**：待核／未提供

**路由**：待核／未提供

**contract_status**：PROPOSED_CURRENT_SCOPE_NOT_S4_VERIFIED

**输入**

1. 预外呼：已授权tenant/task及可选精确record筛选，校验当前任务归属和权限。

2. 人工外呼：已授权tenant、当前坐席及准确customer/assignment/call/followup定位，复核客户分配及记录访问权限；不要求或伪造预测taskId/fileId。

**输出**

1. 客户名单、导入状态、运行汇总、通话/无话单异常、处理进度及详情

**行为**：只读；通话统计与记录共用当前结果来源，无话单异常不算通话；列表按运营业务词，技术原字段在详情。 预测任务记录沿FUNC-015，人工客户/通话/跟进详情沿DRAFT-OP-FOLLOWUP的既有工作台路径；两种方式均只读查看人工状态与客观结果的独立字段。

**real_call_allowed**：False

**current_source_refs**

1. inputs/source-index.json#SRC-118

2. inputs/source-index.json#SRC-119

3. inputs/source-index.json#SRC-120

4. inputs/source-index.json#SRC-121

5. inputs/source-index.json#SRC-122

**historical_sequence_message_refs**

1. SEQ-006-LOCAL-025

2. SEQ-006-LOCAL-030

**historical_sequence_status**：stale_pending_S5_rerun

**applicable_call_modes**

1. predictive

2. manual

**交付优先级**

**级别**：P0

**角色**：dependency

**优先组**

1. P0-IMPORT

2. P0-FOLLOWUP

**范围**：仅接口导入记录、准确客观状态及保存后人工状态的查看；不将手工CSV、下载、删除或报表整体升级。

**business_type_contract**

**存储语义键**：businessType

**field_ref**：DFIELD-024

**级别**：request

**required**：True

**wire_type**：string_code

**one_type_per_request**：True

**authority**：authenticated_token_tenant_enabled_stable_business_type_code

**new_request_validation**：请求级必填businessType，使用已验真的token租户当前启用的稳定业务类型编码；一次请求仅一种业务类型，适用预外呼及人工外呼。缺失、无效或已停用的新业务请求整次拒收，不保存客户、分配、占用补提交额度或提交供应商。不同类型分次导入，可复用同businessBatchNo；不以来源source或callMode代替类型。

**idempotency**：在当前身份/授权复核后，先按原幂等作用域核完整请求内容；businessType纳入内容比较但不新增幂等命名空间。同requestId改类型是内容冲突；已受理同内容技术重放只读返回原回执、不再新增，即使该类型后来停用也不改写已受理记录。不因改类型改变原leadCode/手机号归组、主子批或共享失败累计键。

**persist**：每条成功接收记录固化本次原businessType稳定码及当时显示名称，准确关联原app/tenant/request/row/record与本call；历史缺失不批量补值，不按最近同号、来源或外呼方式猜类型。后续名称/启停配置变化不改原类型码或来源快照。

**display_and_form**：客户名单和详情显示本次保存的业务类型名称，详情保留其编码；坐席跟进按本条原类型自动使用对应业务表单，来源类型只读，不按其他同手机号记录或应用来源重选。历史无值显示未提供并保持原处理边界；已停用/无法解析的表单保留原值并明确待处理，不偷偷换成其他业务类型。原手工弹窗仍使用既有业务类型选择，不增加逐行CSV必填列。

**callback**：每次结果/进度及已完成沟通回调均携准确原app/tenant/record/call导入时保存的businessType稳定码和既有businessBatchNo；补送沿原事件快照。类型后续改名或停用不重算原码，历史未知不猜值，不只回传类型名称，也不替代已填字段/选项业务编码。正式回调报文与ACK仍待契约及工程验证。

**classification_keys_unchanged**：True

**formal_contract_status**：PROPOSED_CURRENT_SCOPE_NOT_S4_VERIFIED

**来源**：inputs/source-index.json#SRC-125, memory/normalized-user-stories.json#AC-102, memory/normalized-user-stories.json#AC-103, memory/normalized-user-stories.json#AC-104

#### INT-FAILURE-SNAPSHOT 准备失败明细固定快照

**标识**：INT-FAILURE-SNAPSHOT

**id_authority**：draft_reading_group_not_production_operation_id

**名称**：准备失败明细固定快照

**api_ids**

1. API-009

**方法**：待核／未提供

**路由**：待核／未提供

**contract_status**：PROPOSED_CURRENT_SCOPE_NOT_S4_VERIFIED

**输入**

1. 现有任务/失败记录范围与当前授权

**输出**

1. 固定失败项集合及快照身份、文件、已知分片完整性

**行为**：后到新失败不纳入旧快照；未收齐明示不完整，不称全部导入完成。

**real_call_allowed**：False

**current_source_refs**

1. inputs/source-index.json#SRC-118

2. inputs/source-index.json#SRC-119

3. inputs/source-index.json#SRC-120

4. inputs/source-index.json#SRC-121

**historical_sequence_message_refs**

1. SEQ-007-LOCAL-003

2. SEQ-007-LOCAL-004

**historical_sequence_status**：stale_pending_S5_rerun

**applicable_call_modes**

1. predictive

#### INT-DOWNLOAD-COMPLETE 下载完成确认与精确清理

**标识**：INT-DOWNLOAD-COMPLETE

**id_authority**：draft_reading_group_not_production_operation_id

**名称**：下载完成确认与精确清理

**api_ids**

1. API-009

**方法**：待核／未提供

**路由**：待核／未提供

**contract_status**：PROPOSED_CURRENT_SCOPE_NOT_S4_VERIFIED

**输入**

1. 固定快照及与授权会话关联的保存完成证据；生产字段待工程评审

**输出**

1. 当前快照保留/清理结果，后到新失败仍可导出

**行为**：受支持保存位置选择、完整写入close和回读一致后才报告；后端完成回执、重放和清理事务待验证。普通下载保留；不设人工确认已下载按钮替代可信证据。

**real_call_allowed**：False

**current_source_refs**

1. inputs/source-index.json#SRC-118

2. inputs/source-index.json#SRC-119

3. inputs/source-index.json#SRC-120

4. inputs/source-index.json#SRC-121

**historical_sequence_message_refs**

1. SEQ-007-LOCAL-005

2. SEQ-007-LOCAL-006

3. SEQ-007-LOCAL-007

4. SEQ-007-LOCAL-009

**historical_sequence_status**：stale_pending_S5_rerun

**applicable_call_modes**

1. predictive

#### INT-AUTO-FAILURE 三类失败自动计划与执行

**标识**：INT-AUTO-FAILURE

**id_authority**：draft_reading_group_not_production_operation_id

**名称**：三类失败自动计划与执行

**api_ids**

1. API-002

**方法**：待核／未提供

**路由**：待核／未提供

**contract_status**：PROPOSED_CURRENT_SCOPE_NOT_S4_VERIFIED

**输入**

1. 已保存准确失败事件及确认时间、触发记录root/task/priority/来源、四元组累计账、任务与执行权状态

**输出**

1. 唯一有效计划、确认+120秒到期、内部attempt、实际file映射、used/reserved与未知状态

**行为**：仅预测业务禁呼/限呼/外呼黑名单三类；平台首次确认该准确失败结果起 120 秒，依供应商既有导航降级；重复不重计时。与八类人工共享首次外 2 次，外发前核关联/权限/预算/执行权，未知沿原尝试不盲重发。

**real_call_allowed**：False

**current_source_refs**

1. inputs/source-index.json#SRC-118

2. inputs/source-index.json#SRC-119

3. inputs/source-index.json#SRC-120

4. inputs/source-index.json#SRC-121

**historical_sequence_message_refs**

1. SEQ-003-LOCAL-007

2. SEQ-003-LOCAL-023

3. SEQ-003-LOCAL-025

**historical_sequence_status**：stale_pending_S5_rerun

**applicable_call_modes**

1. predictive

#### INT-MANUAL-FAILURE 八类已有失败人工补提交

**标识**：INT-MANUAL-FAILURE

**id_authority**：draft_reading_group_not_production_operation_id

**名称**：八类已有失败人工补提交

**api_ids**

1. API-011

**方法**：待核／未提供

**路由**：待核／未提供

**contract_status**：PROPOSED_CURRENT_SCOPE_NOT_S4_VERIFIED

**输入**

1. 准确failedRecordId与明确确认；actionId/expectedVersion为后台提案

**输出**

1. 原/新attempt当前状态和拒绝/待核原因

**行为**：仅预测已保存八类失败；沿任务现有权限，不设统一 120 秒等待，与三类自动同四元组共享首次外 2 次；人工外呼模式不适用。

**real_call_allowed**：False

**current_source_refs**

1. inputs/source-index.json#SRC-118

2. inputs/source-index.json#SRC-119

3. inputs/source-index.json#SRC-120

4. inputs/source-index.json#SRC-121

**historical_sequence_message_refs**

1. SEQ-003-LOCAL-014

2. SEQ-003-LOCAL-017

3. SEQ-003-LOCAL-023

**historical_sequence_status**：stale_pending_S5_rerun

**applicable_call_modes**

1. predictive

#### INT-PRECISE-DELETE 指定记录停止待计划及供应商删除

**标识**：INT-PRECISE-DELETE

**id_authority**：draft_reading_group_not_production_operation_id

**名称**：指定记录停止待计划及供应商删除

**api_ids**

1. API-014

**方法**：待核／未提供

**路由**：待核／未提供

**contract_status**：PROPOSED_CURRENT_SCOPE_NOT_S4_VERIFIED

**输入**

1. 已保存recordId及明确确认；actionId/expectedVersion后台提案

**输出**

1. 本地尚未执行计划处置＋供应商明确删除/跳过/拒绝/未知及原证据

**行为**：只授权运营/管理员；本地停止和远端删除分开，准确目标及执行权不可证时不外发。

**real_call_allowed**：False

**current_source_refs**

1. inputs/source-index.json#SRC-118

2. inputs/source-index.json#SRC-119

3. inputs/source-index.json#SRC-120

4. inputs/source-index.json#SRC-121

**historical_sequence_message_refs**

1. SEQ-009-LOCAL-004

2. SEQ-009-LOCAL-015

3. SEQ-009-LOCAL-016

4. SEQ-009-LOCAL-020

**historical_sequence_status**：stale_pending_S5_rerun

**applicable_call_modes**

1. predictive

#### INT-RESULT-DELIVERY 原应用业务系统结果／进度回调与补送

**标识**：INT-RESULT-DELIVERY

**id_authority**：draft_reading_group_not_production_operation_id

**名称**：原应用业务系统结果／进度回调与补送

**api_ids**

1. API-010

**方法**：待核／未提供

**路由**：待核／未提供

**contract_status**：PROPOSED_CURRENT_SCOPE_NOT_S4_VERIFIED

**输入**

1. 原稳定 app/tenant/record 及适用 call/attempt/followup、结果版本候选和原应用回调配置

2. 原businessBatchNo及候选完成事件ID/版本和固定completionSnapshot；来源为准确已保存本次call。

3. 本次已填写的客户业务信息，包含选填字段，均随快照携带字段业务编码及保存值；有选项时携对应选项业务编码/值，多选完整保留全部选中编码。不能只发显示label、内部字段ID或内部选项ID。保存时固定对应配置编码/版本，后续配置变更不改补送；未填写不猜造编码值，历史缺业务编码明确待核。正式载荷字段名和嵌套schema仍为proposed。

**输出**

1. 匹配本次ID版本的业务ACK或待补送状态

**行为**：DCC、天网等所有应用接口来源均回调其原应用；无 app 手工 UI 不发。改 callMode/继续跟进不改接收方；补送不拨号或占预测失败预算。原 tenant、配置变更、签名/ACK及版本待核。 SRC-123：每次适用回调携原businessBatchNo；新增完成事件复用本通道但独立身份和保存快照，补送不读最新客户表。旧逐次结果和进度保持。 既有结果/进度与新增完成沟通事件即使复用DFIELD-089/090/091，也须按候选事件类型(type)、准确事件ID及版本隔离状态/ACK；旧结果ACK不得确认完成事件，完成事件ACK不得代确认其他结果或版本。正式字段仍待契约。

**real_call_allowed**：False

**current_source_refs**

1. inputs/source-index.json#SRC-118

2. inputs/source-index.json#SRC-119

3. inputs/source-index.json#SRC-120

4. inputs/source-index.json#SRC-121

5. inputs/source-index.json#SRC-122

6. inputs/source-index.json#SRC-123

7. memory/normalized-user-stories.json#AC-096

8. memory/normalized-user-stories.json#AC-097

9. memory/normalized-user-stories.json#AC-098

**historical_sequence_message_refs**

1. SEQ-002-DCC-RESULT-06

2. SEQ-002-DCC-RESULT-07

3. SEQ-002-DCC-RESULT-10

**historical_sequence_status**：stale_pending_S5_rerun

**applicable_call_modes**

1. predictive

2. manual

**交付优先级**

**级别**：P0

**角色**：dependency

**优先组**

1. P0-APP

2. P0-IMPORT

3. P0-FOLLOWUP

**范围**：全部应用导入与跟进记录的原应用回调和失败补送；与供应商拨号及预测失败补提交分离。

**business_type_contract**

**存储语义键**：businessType

**field_ref**：DFIELD-024

**级别**：request

**required**：True

**wire_type**：string_code

**one_type_per_request**：True

**authority**：authenticated_token_tenant_enabled_stable_business_type_code

**new_request_validation**：请求级必填businessType，使用已验真的token租户当前启用的稳定业务类型编码；一次请求仅一种业务类型，适用预外呼及人工外呼。缺失、无效或已停用的新业务请求整次拒收，不保存客户、分配、占用补提交额度或提交供应商。不同类型分次导入，可复用同businessBatchNo；不以来源source或callMode代替类型。

**idempotency**：在当前身份/授权复核后，先按原幂等作用域核完整请求内容；businessType纳入内容比较但不新增幂等命名空间。同requestId改类型是内容冲突；已受理同内容技术重放只读返回原回执、不再新增，即使该类型后来停用也不改写已受理记录。不因改类型改变原leadCode/手机号归组、主子批或共享失败累计键。

**persist**：每条成功接收记录固化本次原businessType稳定码及当时显示名称，准确关联原app/tenant/request/row/record与本call；历史缺失不批量补值，不按最近同号、来源或外呼方式猜类型。后续名称/启停配置变化不改原类型码或来源快照。

**display_and_form**：客户名单和详情显示本次保存的业务类型名称，详情保留其编码；坐席跟进按本条原类型自动使用对应业务表单，来源类型只读，不按其他同手机号记录或应用来源重选。历史无值显示未提供并保持原处理边界；已停用/无法解析的表单保留原值并明确待处理，不偷偷换成其他业务类型。原手工弹窗仍使用既有业务类型选择，不增加逐行CSV必填列。

**callback**：每次结果/进度及已完成沟通回调均携准确原app/tenant/record/call导入时保存的businessType稳定码和既有businessBatchNo；补送沿原事件快照。类型后续改名或停用不重算原码，历史未知不猜值，不只回传类型名称，也不替代已填字段/选项业务编码。正式回调报文与ACK仍待契约及工程验证。

**classification_keys_unchanged**：True

**formal_contract_status**：PROPOSED_CURRENT_SCOPE_NOT_S4_VERIFIED

**来源**：inputs/source-index.json#SRC-125, memory/normalized-user-stories.json#AC-102, memory/normalized-user-stories.json#AC-103, memory/normalized-user-stories.json#AC-104

#### INT-MANUAL-ASSIGN 人工方式线索保存与指定坐席分配

**标识**：INT-MANUAL-ASSIGN

**id_authority**：internal_candidate_reading_id_not_HTTP_or_supplier_operation

**名称**：人工方式线索保存与指定坐席分配

**api_ids**

1. API-009

**方法**：待核／未提供

**路由**：待核／未提供

**contract_status**：PROPOSED_CURRENT_SCOPE_NOT_S4_VERIFIED

**输入**

1. 有效 token app/tenant、回调配置、callMode、逐行工号及客户资料、请求身份

2. 六个导入业务字段逐行选填，两种外呼方式均适用；未传或留空不阻止合法导入。已填按字符串原值保存，编码和Smartcode保留前导零与大小写，不转数值、不凭名称查补编码、不凭编码补名称。各项可独立填写，不要求代码名称成对齐全；正式长度、格式、空值与错误码待核。不代替leadCode、requestId、businessBatchNo或填单plannedStoreName，也不改变原应用/租户/线索/通话归属。

3. 留资时间leadCreatedAt是业务系统提供的原线索留资时间，选填；与平台importedAt和跟进savedAt分别保存/展示。未提供不填当前时间，不由其他时间推算；按原提供值透传，正式wire类型、时间格式及时区待S4确认，不凭样例冻结。

**输出**

1. 原保存/分配结果、原归属、待联系状态或准确失败/未知

**行为**：核同租户有效工号（保前导零）和账号/席位关联后保存待联系；不要求在线才分配，不自动拨号、不造预测 task/file。幂等、原子保存与分配失败恢复须工程验证。 逐行保存已提供的六个导入业务字段，与原请求/应用/租户/记录绑定，不查补编码名称。

**open_issue_ids**

1. ISSUE-002

2. ISSUE-043

3. ISSUE-044

**语义来源**：memory/normalized-user-stories.json#AC-080, memory/normalized-user-stories.json#AC-081, memory/normalized-user-stories.json#AC-082, memory/normalized-user-stories.json#AC-083, inputs/source-index.json#SRC-118, inputs/source-index.json#SRC-119, inputs/source-index.json#SRC-120, inputs/source-index.json#SRC-121, inputs/source-index.json#SRC-124, memory/normalized-user-stories.json#AC-099

**real_call_allowed**：False

**交付优先级**

**级别**：P0

**角色**：primary

**优先组**

1. P0-IMPORT

**范围**：人工方式接口导入按同租户有效 agentWorkNo 保存并分配本人待联系，不创建预测批次，不自动拨号。

**six_import_business_fields_local_evidence**

**来源**：prototype/memory/verification-evidence/imported-customer-info-20261014.json

**sha256**：f738e2b24bbb4d36be47ae0c576d80618804683d9a31298c3fb44a642fd633df

**状态**：pass_scoped_source_checks_browser_pending

**范围**：21组实际源码VM/存储/HTML检查；六项来源字段选填、原值、局部保存和准确详情/早填上下文展示，局部未接通状态回归。

**formal_gate_passed**：False

**real_supplier_or_backend_verified**：False

**not_proven**

1. 真实对外导入API和正式字段/时间格式契约

2. 完成事件生成、原子可靠快照与业务系统回调

3. 完整101验收、02全局视觉或生产联调

**business_type_contract**

**存储语义键**：businessType

**field_ref**：DFIELD-024

**级别**：request

**required**：True

**wire_type**：string_code

**one_type_per_request**：True

**authority**：authenticated_token_tenant_enabled_stable_business_type_code

**new_request_validation**：请求级必填businessType，使用已验真的token租户当前启用的稳定业务类型编码；一次请求仅一种业务类型，适用预外呼及人工外呼。缺失、无效或已停用的新业务请求整次拒收，不保存客户、分配、占用补提交额度或提交供应商。不同类型分次导入，可复用同businessBatchNo；不以来源source或callMode代替类型。

**idempotency**：在当前身份/授权复核后，先按原幂等作用域核完整请求内容；businessType纳入内容比较但不新增幂等命名空间。同requestId改类型是内容冲突；已受理同内容技术重放只读返回原回执、不再新增，即使该类型后来停用也不改写已受理记录。不因改类型改变原leadCode/手机号归组、主子批或共享失败累计键。

**persist**：每条成功接收记录固化本次原businessType稳定码及当时显示名称，准确关联原app/tenant/request/row/record与本call；历史缺失不批量补值，不按最近同号、来源或外呼方式猜类型。后续名称/启停配置变化不改原类型码或来源快照。

**display_and_form**：客户名单和详情显示本次保存的业务类型名称，详情保留其编码；坐席跟进按本条原类型自动使用对应业务表单，来源类型只读，不按其他同手机号记录或应用来源重选。历史无值显示未提供并保持原处理边界；已停用/无法解析的表单保留原值并明确待处理，不偷偷换成其他业务类型。原手工弹窗仍使用既有业务类型选择，不增加逐行CSV必填列。

**callback**：每次结果/进度及已完成沟通回调均携准确原app/tenant/record/call导入时保存的businessType稳定码和既有businessBatchNo；补送沿原事件快照。类型后续改名或停用不重算原码，历史未知不猜值，不只回传类型名称，也不替代已填字段/选项业务编码。正式回调报文与ACK仍待契约及工程验证。

**classification_keys_unchanged**：True

**formal_contract_status**：PROPOSED_CURRENT_SCOPE_NOT_S4_VERIFIED

**来源**：inputs/source-index.json#SRC-125, memory/normalized-user-stories.json#AC-102, memory/normalized-user-stories.json#AC-103, memory/normalized-user-stories.json#AC-104

#### INT-FOLLOWUP-SAVE 振铃跟进草稿与未接人工状态保存

**标识**：INT-FOLLOWUP-SAVE

**id_authority**：internal_candidate_reading_id_not_HTTP_or_supplier_operation

**名称**：振铃跟进草稿与未接人工状态保存

**api_ids**

1. API-009

**方法**：待核／未提供

**路由**：待核／未提供

**contract_status**：PROPOSED_CURRENT_SCOPE_NOT_S4_VERIFIED

**输入**

1. 当前坐席/tenant/客户/call 的准确关联、会话草稿、独立人工 code+description 选择及录入人/时间、处理结果、版本候选；正式存储和接口字段待审

2. 本call准确导入记录保存的六个选填业务字段只读上下文；不能用坐席修改plannedStoreName替换它们。

3. 留资时间leadCreatedAt是业务系统提供的原线索留资时间，选填；与平台importedAt和跟进savedAt分别保存/展示。未提供不填当前时间，不由其他时间推算；按原提供值透传，正式wire类型、时间格式及时区待S4确认，不凭样例冻结。

**输出**

1. 草稿恢复、原通话关联的独立人工状态和跟进记录、保存成功/失败及当前名单状态；不作为供应商回执

**行为**：人工客户振铃和预外呼坐席振铃均可填表，接通/结束保留草稿和通话控制。SRC-122明确：客观客户未接、外呼且通话已结束时须选择通话状态才可保存，完整沿用 API-327 的20项描述/16码，编码与所选描述成对保存。空白未选不能保存，明确选择183未知有效；未知/已接通、预测客户已接而坐席未接不套客户未接必选，不扩呼入。人工状态、录入人/时间和处理结果独立于客观供应商结果，晚到话单不覆盖人工决定。未接通不强迫填沟通后才知业务必填，已填非法值仍须拒绝，各业务类型条件清单与正式字段仍待审。校验/保存失败保留草稿及原名单，未接不默认继续跟进；幂等、归属版本及原子持久化仍须工程验证。 SRC-123：仅本次外呼已结束、agentDisposition=已完成沟通且本次跟进/业务信息/处理结果整体保存成功，才交INT-COMPLETION-CALLBACK生成独立事件；processingStatus通用已完成、表单编辑单独成功、其他处理结果或保存失败均不触发。当前原型的局部保存路径不能作为生产原子快照/事件已实现证据。 原导入意向门店、车系、Smartcode和留资时间只读展示，坐席本次业务表单仍独立填写；完成事件冻结该记录原导入信息。

**open_issue_ids**

1. ISSUE-046

2. ISSUE-043

**语义来源**：memory/normalized-user-stories.json#AC-087, memory/normalized-user-stories.json#AC-088, memory/normalized-user-stories.json#AC-090, memory/normalized-user-stories.json#AC-091, inputs/source-index.json#SRC-118, inputs/source-index.json#SRC-119, inputs/source-index.json#SRC-120, inputs/source-index.json#SRC-121, inputs/source-index.json#SRC-122, inputs/source-index.json#SRC-123, memory/normalized-user-stories.json#AC-095, inputs/source-index.json#SRC-124, memory/normalized-user-stories.json#AC-100, memory/normalized-user-stories.json#AC-101

**real_call_allowed**：False

**局部原型证据**

**来源**：prototype/memory/verification-evidence/workbench-manual-status-20261014.json

**sha256**：738665bc9120b6760fbc5ddc172e1e61385c1b4991077f00e9b8527a746cd67c

**范围**：本地合成真实源码 VM 28组通过，浏览器空选阻止、拒接选择、收起保留、保存、重载及独立详情局部通过；包含早填单回归。

**状态**：pass_scoped

**formal_S1_S2_recheck**：False

**supplier_or_backend_verified**：False

**contract_status_unchanged**：True

**not_proven**

1. 后端事务/并发/持久化及正式接口

2. 供应商真实事件或真实部署

3. 预外呼转人工的远端执行排他

4. 完整业务表单条件清单及全站视觉回归

5. SRC-123业务批次号接收/保存/回传

6. SRC-123完成沟通快照、事件生成、生产一致性及真实业务回调

**交付优先级**

**级别**：P0

**角色**：primary

**优先组**

1. P0-FOLLOWUP

**范围**：外呼振铃可填写草稿；明确客户未接且通话结束后选择状态并保存人工记录，包含条件校验、失败保留、重复保存及归属检查。

**manual_status_dictionary**

**source_id**：API-327

**source_ref**：inputs/source-index.json#SRC-122

**entries**：20

**distinct_codes**：16

**selection_identity**：code_and_description

**duplicate_code_labels**

**715**

1. 用户线故障

2. 暂时无法接通

3. 秘书台

**183**

1. 嘟嘟

2. 静音

3. 未知

**example**

**code**：712

**说明**：拒接

**empty_is_not_183_unknown**：True

**selection_does_not_imply_supplier_observation**：True

**formal_storage_and_wire_status**：PROPOSED_CURRENT_SCOPE_NOT_S4_VERIFIED

**six_import_business_fields_local_evidence**

**来源**：prototype/memory/verification-evidence/imported-customer-info-20261014.json

**sha256**：f738e2b24bbb4d36be47ae0c576d80618804683d9a31298c3fb44a642fd633df

**状态**：pass_scoped_source_checks_browser_pending

**范围**：21组实际源码VM/存储/HTML检查；六项来源字段选填、原值、局部保存和准确详情/早填上下文展示，局部未接通状态回归。

**formal_gate_passed**：False

**real_supplier_or_backend_verified**：False

**not_proven**

1. 真实对外导入API和正式字段/时间格式契约

2. 完成事件生成、原子可靠快照与业务系统回调

3. 完整101验收、02全局视觉或生产联调

**business_type_contract**

**存储语义键**：businessType

**field_ref**：DFIELD-024

**级别**：request

**required**：True

**wire_type**：string_code

**one_type_per_request**：True

**authority**：authenticated_token_tenant_enabled_stable_business_type_code

**new_request_validation**：请求级必填businessType，使用已验真的token租户当前启用的稳定业务类型编码；一次请求仅一种业务类型，适用预外呼及人工外呼。缺失、无效或已停用的新业务请求整次拒收，不保存客户、分配、占用补提交额度或提交供应商。不同类型分次导入，可复用同businessBatchNo；不以来源source或callMode代替类型。

**idempotency**：在当前身份/授权复核后，先按原幂等作用域核完整请求内容；businessType纳入内容比较但不新增幂等命名空间。同requestId改类型是内容冲突；已受理同内容技术重放只读返回原回执、不再新增，即使该类型后来停用也不改写已受理记录。不因改类型改变原leadCode/手机号归组、主子批或共享失败累计键。

**persist**：每条成功接收记录固化本次原businessType稳定码及当时显示名称，准确关联原app/tenant/request/row/record与本call；历史缺失不批量补值，不按最近同号、来源或外呼方式猜类型。后续名称/启停配置变化不改原类型码或来源快照。

**display_and_form**：客户名单和详情显示本次保存的业务类型名称，详情保留其编码；坐席跟进按本条原类型自动使用对应业务表单，来源类型只读，不按其他同手机号记录或应用来源重选。历史无值显示未提供并保持原处理边界；已停用/无法解析的表单保留原值并明确待处理，不偷偷换成其他业务类型。原手工弹窗仍使用既有业务类型选择，不增加逐行CSV必填列。

**callback**：每次结果/进度及已完成沟通回调均携准确原app/tenant/record/call导入时保存的businessType稳定码和既有businessBatchNo；补送沿原事件快照。类型后续改名或停用不重算原码，历史未知不猜值，不只回传类型名称，也不替代已填字段/选项业务编码。正式回调报文与ACK仍待契约及工程验证。

**classification_keys_unchanged**：True

**formal_contract_status**：PROPOSED_CURRENT_SCOPE_NOT_S4_VERIFIED

**来源**：inputs/source-index.json#SRC-125, memory/normalized-user-stories.json#AC-102, memory/normalized-user-stories.json#AC-103, memory/normalized-user-stories.json#AC-104

#### INT-CONTINUE-FOLLOWUP 继续跟进保留当前坐席待联系

**标识**：INT-CONTINUE-FOLLOWUP

**id_authority**：internal_candidate_reading_id_not_HTTP_or_supplier_operation

**名称**：继续跟进保留当前坐席待联系

**api_ids**

1. API-009

**方法**：待核／未提供

**路由**：待核／未提供

**contract_status**：PROPOSED_CURRENT_SCOPE_NOT_S4_VERIFIED

**输入**

1. 成功保存的继续跟进决定、原线索/call/预测 task 溯源、当前坐席权限与执行权状态

**输出**

1. 同一线索待联系、当前坐席后续人工处理归属、原任务排他确认状态

**行为**：只有选择继续跟进并保存成功才保留待联系，未接不默认该决定。原人工保持分配；预外呼转当前坐席后续人工跟进，保原 app/tenant/task/call，不另造线索或自动拨号。原预测后续与人工联系须排他；未核实停止/执行权时待确认，不宣称远端已停止或安全可拨。

**open_issue_ids**

1. ISSUE-035

2. ISSUE-047

3. ISSUE-046

**语义来源**：memory/normalized-user-stories.json#AC-089, memory/normalized-user-stories.json#AC-090, inputs/source-index.json#SRC-118, inputs/source-index.json#SRC-119, inputs/source-index.json#SRC-120, inputs/source-index.json#SRC-121, inputs/source-index.json#SRC-122

**real_call_allowed**：False

**局部原型证据**

**来源**：prototype/memory/verification-evidence/workbench-early-form-repair-20261014.json

**范围**：仅提前填写、草稿保留、既有人工再次联系本地路径；不证明新增人工状态、预测转人工或正式后端契约。

**contract_status_unchanged**：True

**交付优先级**

**级别**：P0

**角色**：dependency

**优先组**

1. P0-FOLLOWUP

**范围**：跟进保存后的本人待联系闭环：仅明确继续跟进且保存成功才保留；预测转人工须排他确认，不以此承诺远端已停。

#### INT-COMPLETION-CALLBACK 已完成沟通保存后的本次快照与原应用回调

**标识**：INT-COMPLETION-CALLBACK

**id_authority**：internal_candidate_reading_id_not_new_HTTP_or_supplier_operation

**名称**：已完成沟通保存后的本次快照与原应用回调

**api_ids**

1. API-009

2. API-010

**方法**：待核／未提供

**路由**：待核／未提供

**contract_status**：PROPOSED_CURRENT_SCOPE_NOT_S4_VERIFIED

**输入**

1. 本次已结束外呼call及原app/tenant/record、原businessBatchNo、已成功保存的agentDisposition=已完成沟通和本次业务表单/人工状态/保存版本。

2. 本次已填写的客户业务信息，包含选填字段，均随快照携带字段业务编码及保存值；有选项时携对应选项业务编码/值，多选完整保留全部选中编码。不能只发显示label、内部字段ID或内部选项ID。保存时固定对应配置编码/版本，后续配置变更不改补送；未填写不猜造编码值，历史缺业务编码明确待核。正式载荷字段名和嵌套schema仍为proposed。

3. 完成沟通事件另携本记录本次导入保存的六个选填业务字段intentionStoreCode/intentionStoreName/intentionSeriesCode/intentionSeries/smartCode/leadCreatedAt；按原app/tenant/record及本次call准确关联，已填携原码/原名称/原Smartcode，未提供保留缺值，不能以其他同手机号/线索/批次的最新导入或后续编辑覆盖。本次导入业务信息与坐席本次填写的customerFollowup快照并列，原plannedStoreName不被导入意向门店覆盖；补送使用同一固定快照。

4. 留资时间leadCreatedAt是业务系统提供的原线索留资时间，选填；与平台importedAt和跟进savedAt分别保存/展示。未提供不填当前时间，不由其他时间推算；按原提供值透传，正式wire类型、时间格式及时区待S4确认，不凭样例冻结。

**输出**

1. 候选completionSnapshot及稳定事件ID/版本，原应用待交付/已确认/待补送状态；不等于已实现或已接通。

**行为**：必须满足结束+已完成沟通+完整保存成功，固定本次call和已保存业务数据，不读取跨通话aggregate/最新资料；复用原回调管道，仅补送原事件，保留其他逐次回调。 已填字段或选中选项缺业务编码时，回调资料须明确待完善/待核，不能以label或内部ID兜底并标完整交付成功；本次新协议不自行把已有效的本地保存改成失败。缺码补全、修正版本和再次交付规则待正式契约，不静默改旧已发快照。 既有结果/进度与新增完成沟通事件即使复用DFIELD-089/090/091，也须按候选事件类型(type)、准确事件ID及版本隔离状态/ACK；旧结果ACK不得确认完成事件，完成事件ACK不得代确认其他结果或版本。正式字段仍待契约。 完成沟通事件另携本记录本次导入保存的六个选填业务字段intentionStoreCode/intentionStoreName/intentionSeriesCode/intentionSeries/smartCode/leadCreatedAt；按原app/tenant/record及本次call准确关联，已填携原码/原名称/原Smartcode，未提供保留缺值，不能以其他同手机号/线索/批次的最新导入或后续编辑覆盖。本次导入业务信息与坐席本次填写的customerFollowup快照并列，原plannedStoreName不被导入意向门店覆盖；补送使用同一固定快照。 留资时间leadCreatedAt是业务系统提供的原线索留资时间，选填；与平台importedAt和跟进savedAt分别保存/展示。未提供不填当前时间，不由其他时间推算；按原提供值透传，正式wire类型、时间格式及时区待S4确认，不凭样例冻结。

**event_contract_ref**：EVENT-FOLLOWUP-COMPLETED

**development_operation_ref**：DRAFT-OP-COMPLETION-CALLBACK

**local_logic_ref**：DLOCAL-COMPLETION-CALLBACK

**field_refs**

1. DFIELD-124

2. DFIELD-125

3. DFIELD-089

4. DFIELD-090

5. DFIELD-091

6. DFIELD-126

7. DFIELD-127

8. DFIELD-128

9. DFIELD-129

10. DFIELD-130

11. DFIELD-131

**scenario_refs**

1. SC-007

2. SC-002

**语义来源**：inputs/source-index.json#SRC-123, memory/normalized-user-stories.json#AC-095, memory/normalized-user-stories.json#AC-096, memory/normalized-user-stories.json#AC-097, memory/normalized-user-stories.json#AC-098, inputs/source-index.json#SRC-124, memory/normalized-user-stories.json#AC-101

**open_issue_ids**

1. ISSUE-002

2. ISSUE-026

3. ISSUE-043

4. ISSUE-045

5. ISSUE-046

**real_call_allowed**：False

**实现状态**：not_implemented_or_runtime_verified_this_revision

**交付优先级**

**级别**：P0

**角色**：primary

**优先组**

1. P0-FOLLOWUP

**范围**：外呼已结束且已完成沟通保存成功后，以本次通话和已保存业务快照回调原应用；复用原交付通道。

**local_implementation_boundary**：只读代码显示CustomerBusiness field/option.businessKey允许空，CustomerFollowup当前保存内部字段/选项ID对应值，尚未在成功保存时固化业务编码快照；不能将现有跟进保存或旧VM28组作为此协议已实现证据。

**business_type_contract**

**存储语义键**：businessType

**field_ref**：DFIELD-024

**级别**：request

**required**：True

**wire_type**：string_code

**one_type_per_request**：True

**authority**：authenticated_token_tenant_enabled_stable_business_type_code

**new_request_validation**：请求级必填businessType，使用已验真的token租户当前启用的稳定业务类型编码；一次请求仅一种业务类型，适用预外呼及人工外呼。缺失、无效或已停用的新业务请求整次拒收，不保存客户、分配、占用补提交额度或提交供应商。不同类型分次导入，可复用同businessBatchNo；不以来源source或callMode代替类型。

**idempotency**：在当前身份/授权复核后，先按原幂等作用域核完整请求内容；businessType纳入内容比较但不新增幂等命名空间。同requestId改类型是内容冲突；已受理同内容技术重放只读返回原回执、不再新增，即使该类型后来停用也不改写已受理记录。不因改类型改变原leadCode/手机号归组、主子批或共享失败累计键。

**persist**：每条成功接收记录固化本次原businessType稳定码及当时显示名称，准确关联原app/tenant/request/row/record与本call；历史缺失不批量补值，不按最近同号、来源或外呼方式猜类型。后续名称/启停配置变化不改原类型码或来源快照。

**display_and_form**：客户名单和详情显示本次保存的业务类型名称，详情保留其编码；坐席跟进按本条原类型自动使用对应业务表单，来源类型只读，不按其他同手机号记录或应用来源重选。历史无值显示未提供并保持原处理边界；已停用/无法解析的表单保留原值并明确待处理，不偷偷换成其他业务类型。原手工弹窗仍使用既有业务类型选择，不增加逐行CSV必填列。

**callback**：每次结果/进度及已完成沟通回调均携准确原app/tenant/record/call导入时保存的businessType稳定码和既有businessBatchNo；补送沿原事件快照。类型后续改名或停用不重算原码，历史未知不猜值，不只回传类型名称，也不替代已填字段/选项业务编码。正式回调报文与ACK仍待契约及工程验证。

**classification_keys_unchanged**：True

**formal_contract_status**：PROPOSED_CURRENT_SCOPE_NOT_S4_VERIFIED

**来源**：inputs/source-index.json#SRC-125, memory/normalized-user-stories.json#AC-102, memory/normalized-user-stories.json#AC-103, memory/normalized-user-stories.json#AC-104

**事件契约**

#### EVENT-CALL-SIP

**标识**：EVENT-CALL-SIP

**api_id**：API-003

**方向**：AliCti→平台

**用途**：逐次可信call/话单/SIP及同对象晚更新

**correlation**：预测核 tenant/原 task/实际 file/phone/可信 call；人工核原 app/tenant/分配/call，真实人工协议待核，不能伪造预测 task/file。

**effects**：准确保存客观结果与适用秒挂三态；原接入应用结果走 API-010。晚到客观证据不覆写人工状态或继续跟进决定，重复不增 call/计划/预算。

**ack_status**：HTTP公共接收有文档，具体payload/验真/持久ACK未完整核实

**real_call_allowed**：False

**current_scope_contract_status**：PROPOSED_CURRENT_SCOPE_NOT_S4_VERIFIED

**current_source_refs**

1. inputs/source-index.json#SRC-118

2. inputs/source-index.json#SRC-119

3. inputs/source-index.json#SRC-120

4. inputs/source-index.json#SRC-121

5. inputs/source-index.json#SRC-122

**交付优先级**

**级别**：P0

**角色**：dependency

**优先组**

1. P0-IMPORT

2. P0-FOLLOWUP

**范围**：准确客观客户接听与通话结果是判定未接及回调的输入；独立人工选择不生成供应商事件。

#### EVENT-52-FAILURE

**标识**：EVENT-52-FAILURE

**api_id**：API-003

**方向**：AliCti→平台

**用途**：预测稳定无话单失败及 11 类分流

**correlation**：稳定事件身份及实际file/原号码准确匹配仍待真实证据；不等话单、不造callId

**effects**：过频归任务规则；3类确认+120秒自动，8类人工；共享四元组首次外2次

**ack_status**：HTTP传输重试不等120秒业务计划；持久去重/ACK待核

**real_call_allowed**：False

**current_scope_contract_status**：PROPOSED_CURRENT_SCOPE_NOT_S4_VERIFIED

**current_source_refs**

1. inputs/source-index.json#SRC-118

2. inputs/source-index.json#SRC-119

3. inputs/source-index.json#SRC-120

4. inputs/source-index.json#SRC-121

**applicable_call_modes**

1. predictive

#### EVENT-53-IMPORT

**标识**：EVENT-53-IMPORT

**api_id**：API-003

**方向**：AliCti→平台

**用途**：预测导入失败分片

**correlation**：enterprise核实tenant＋原task＋实际fileId＋原始号码；分片号非业务批次

**effects**：准确失败入失败快照；乱序/迟到保存，重复不再生；不触发11类失败补提；已发起补提交被导入拒绝仍保已用额度

**ack_status**：分片齐不等全导入终态；无消息不等零失败；稳定身份/ACK/重放仍待核

**real_call_allowed**：False

**current_scope_contract_status**：PROPOSED_CURRENT_SCOPE_NOT_S4_VERIFIED

**current_source_refs**

1. inputs/source-index.json#SRC-118

2. inputs/source-index.json#SRC-119

3. inputs/source-index.json#SRC-120

4. inputs/source-index.json#SRC-121

**applicable_call_modes**

1. predictive

**交付优先级**

**级别**：P0

**角色**：dependency

**优先组**

1. P0-IMPORT

**范围**：仅预外呼首次导入的准确失败分片归属及结果保存，人工分配不使用；不额外提升重提策略优先级。

#### EVENT-DCC-RESULT

**标识**：EVENT-DCC-RESULT

**api_id**：API-010

**方向**：平台→原应用业务系统（DCC/天网等）

**用途**：准确原应用/租户结果、进度及独立人工跟进信息

**correlation**：原 app/tenant/record/attempt 或人工 call/followup 固定，结果版本提案；不能按最新 token 租户或 body source 换接收方 每次携对应记录原businessBatchNo；同字面值不能代替原身份或作单独去重。

**effects**：所有应用接口来源按原应用回调；补送仅原结果版本，不再导入供应商或拨号。 新增完成沟通事件独立表达，不替代本事件及既有进度/失败/秒挂回调。 每次结果/进度及已完成沟通回调均携准确原app/tenant/record/call导入时保存的businessType稳定码和既有businessBatchNo；补送沿原事件快照。类型后续改名或停用不重算原码，历史未知不猜值，不只回传类型名称，也不替代已填字段/选项业务编码。正式回调报文与ACK仍待契约及工程验证。

**ack_status**：字段/签名/身份/版本/持久接收 ACK 均待正式契约；HTTP 成功不足 既有结果/进度与新增完成沟通事件即使复用DFIELD-089/090/091，也须按候选事件类型(type)、准确事件ID及版本隔离状态/ACK；旧结果ACK不得确认完成事件，完成事件ACK不得代确认其他结果或版本。正式字段仍待契约。

**real_call_allowed**：False

**current_scope_contract_status**：PROPOSED_CURRENT_SCOPE_NOT_S4_VERIFIED

**current_source_refs**

1. inputs/source-index.json#SRC-118

2. inputs/source-index.json#SRC-119

3. inputs/source-index.json#SRC-120

4. inputs/source-index.json#SRC-121

5. inputs/source-index.json#SRC-122

6. inputs/source-index.json#SRC-123

7. memory/normalized-user-stories.json#AC-096

8. memory/normalized-user-stories.json#AC-097

9. inputs/source-index.json#SRC-125

10. memory/normalized-user-stories.json#AC-104

**id_authority**：historical_EVENT_DCC_RESULT_ID_now_all_integrated_applications

**交付优先级**

**级别**：P0

**角色**：dependency

**优先组**

1. P0-APP

2. P0-IMPORT

3. P0-FOLLOWUP

**范围**：所有接入应用的原归属结果/进度回调，适用人工记录与客观结果分开；正式字段和ACK待审。

**business_type_contract**

**field_ref**：DFIELD-024

**来源**：original_saved_record_businessType

**rule**：每次结果/进度及已完成沟通回调均携准确原app/tenant/record/call导入时保存的businessType稳定码和既有businessBatchNo；补送沿原事件快照。类型后续改名或停用不重算原码，历史未知不猜值，不只回传类型名称，也不替代已填字段/选项业务编码。正式回调报文与ACK仍待契约及工程验证。

**来源**：inputs/source-index.json#SRC-125, memory/normalized-user-stories.json#AC-102, memory/normalized-user-stories.json#AC-103, memory/normalized-user-stories.json#AC-104

#### EVENT-FOLLOWUP-COMPLETED

**标识**：EVENT-FOLLOWUP-COMPLETED

**id_authority**：new_proposed_business_event_reading_id_not_HTTP_endpoint_or_supplier_event_code

**api_id**：API-010

**方向**：平台→原应用业务系统（所有准确应用接口来源）

**用途**：回调本次已完成沟通的通话记录和已保存客户业务快照、原业务批次号

**correlation**：稳定eventId+eventVersion绑定原app/tenant/record、本次call和跟进保存版本；重复保存/通知不重复生成同一完成事件，修改保存与新版本语义待S4。businessBatchNo可重复，不能单独作事件去重键。

**effects**：复用API-010原应用回调通道，无新确认HTTP端点；按准确原app/tenant寻址该app配置。未知或冲突归属保留待核，不默认DCC或猜接收方。 交付失败仅补送相同事件版本、原业务批次号与保存快照；不重导/重新分配/拨号，不建供应商尝试或消耗预测失败预算。 每次结果/进度及已完成沟通回调均携准确原app/tenant/record/call导入时保存的businessType稳定码和既有businessBatchNo；补送沿原事件快照。类型后续改名或停用不重算原码，历史未知不猜值，不只回传类型名称，也不替代已填字段/选项业务编码。正式回调报文与ACK仍待契约及工程验证。

**ack_status**：ACK须匹配原app/tenant/事件与版本并确认业务持久接收；字段/签名/超时/补送/地址变更积压目标和重复或修改保存语义待双方契约与工程验证。HTTP受理或本地保存不等于交付成功。 既有结果/进度与新增完成沟通事件即使复用DFIELD-089/090/091，也须按候选事件类型(type)、准确事件ID及版本隔离状态/ACK；旧结果ACK不得确认完成事件，完成事件ACK不得代确认其他结果或版本。正式字段仍待契约。

**real_call_allowed**：False

**current_scope_contract_status**：PROPOSED_CURRENT_SCOPE_NOT_S4_VERIFIED

**触发**

1. 本次外呼已结束，准确归属原记录和本次call。

2. 坐席本次agentDisposition明确为“已完成沟通”。

3. 本次跟进、客户业务信息和处理结果全部保存成功。

**not_triggers**

1. 通用processingStatus=已完成

2. 振铃/通话中或未保存

3. 仅业务表单独立编辑保存

4. 保存失败或部分保存

5. 其他处理结果（含继续跟进）

**snapshot**

**original_identity**：原稳定app、tenant、业务record/request及原businessBatchNo，不按当前token/最近记录重取。

**current_call**：本次准确callId及本次通话记录已知客观事实，缺少的CDR/时长/接听信息明确未知，不因已完成沟通伪造接通。

**saved_business_information**：该次成功保存的customerFollowup/业务类型、字段标识和值及适用配置/类型/选项版本；正式形状待S4。不从CustomerFollowup.aggregate或客户最新汇总取得。

**human_fields**：本次agentDisposition、dispositionRemark、独立agentCallStatus（若适用）、录入人/时间、跟进保存版本；与供应商客观结果分开。

**immutability**：初始事件和补送读取同一已保存快照，不重新读取后续业务编辑、跨通话聚合或同批其他客户。

**business_field_codes**：本次已填写的客户业务信息，包含选填字段，均随快照携带字段业务编码及保存值；有选项时携对应选项业务编码/值，多选完整保留全部选中编码。不能只发显示label、内部字段ID或内部选项ID。保存时固定对应配置编码/版本，后续配置变更不改补送；未填写不猜造编码值，历史缺业务编码明确待核。正式载荷字段名和嵌套schema仍为proposed。

**missing_business_code_behavior**：已填字段或选中选项缺业务编码时，回调资料须明确待完善/待核，不能以label或内部ID兜底并标完整交付成功；本次新协议不自行把已有效的本地保存改成失败。缺码补全、修正版本和再次交付规则待正式契约，不静默改旧已发快照。

**original_import_business_context**：完成沟通事件另携本记录本次导入保存的六个选填业务字段intentionStoreCode/intentionStoreName/intentionSeriesCode/intentionSeries/smartCode/leadCreatedAt；按原app/tenant/record及本次call准确关联，已填携原码/原名称/原Smartcode，未提供保留缺值，不能以其他同手机号/线索/批次的最新导入或后续编辑覆盖。本次导入业务信息与坐席本次填写的customerFollowup快照并列，原plannedStoreName不被导入意向门店覆盖；补送使用同一固定快照。 留资时间leadCreatedAt是业务系统提供的原线索留资时间，选填；与平台importedAt和跟进savedAt分别保存/展示。未提供不填当前时间，不由其他时间推算；按原提供值透传，正式wire类型、时间格式及时区待S4确认，不凭样例冻结。

**original_import_business_field_proposals**

#### 1

**存储语义键**：intentionStoreCode

**label**：意向门店编码

**field_ref**：DFIELD-126

**required**：False

**value_origin**：saved_original_import_row_not_latest_customer_or_followup_aggregate

#### 2

**存储语义键**：intentionStoreName

**label**：意向门店名称

**field_ref**：DFIELD-127

**required**：False

**value_origin**：saved_original_import_row_not_latest_customer_or_followup_aggregate

#### 3

**存储语义键**：intentionSeriesCode

**label**：意向车系编码

**field_ref**：DFIELD-128

**required**：False

**value_origin**：saved_original_import_row_not_latest_customer_or_followup_aggregate

#### 4

**存储语义键**：intentionSeries

**label**：意向车系

**field_ref**：DFIELD-129

**required**：False

**value_origin**：saved_original_import_row_not_latest_customer_or_followup_aggregate

#### 5

**存储语义键**：smartCode

**label**：Smartcode

**field_ref**：DFIELD-130

**required**：False

**value_origin**：saved_original_import_row_not_latest_customer_or_followup_aggregate

#### 6

**存储语义键**：leadCreatedAt

**label**：留资时间

**field_ref**：DFIELD-131

**required**：False

**value_origin**：saved_original_import_row_not_platform_importedAt_or_followup_savedAt

**original_business_type**

**存储语义键**：businessType

**field_ref**：DFIELD-024

**来源**：original_saved_record_businessType

**rule**：每次结果/进度及已完成沟通回调均携准确原app/tenant/record/call导入时保存的businessType稳定码和既有businessBatchNo；补送沿原事件快照。类型后续改名或停用不重算原码，历史未知不猜值，不只回传类型名称，也不替代已填字段/选项业务编码。正式回调报文与ACK仍待契约及工程验证。

**coexistence**：原每次结果/进度、真实失败和秒挂回调均继续；新增完成事件不替代、不撤销、不等待它才发原结果。全部适用回调携原记录businessBatchNo。

**late_objective_updates**：本次真实话单晚到/更正仅按待核更新或版本契约补充同call客观事实，不能覆盖原已保存客户业务快照、人工通话状态或处理决定；字段完整性、是否延迟首次发送、补充载荷和ACK策略待核。

**scenario_refs**

1. SC-007

2. SC-002

**current_source_refs**

1. inputs/source-index.json#SRC-123

2. memory/normalized-user-stories.json#AC-095

3. memory/normalized-user-stories.json#AC-096

4. memory/normalized-user-stories.json#AC-097

5. memory/normalized-user-stories.json#AC-098

6. inputs/source-index.json#SRC-124

7. memory/normalized-user-stories.json#AC-101

8. inputs/source-index.json#SRC-125

9. memory/normalized-user-stories.json#AC-104

**internal_capability_ref**：INT-COMPLETION-CALLBACK

**development_operation_ref**：DRAFT-OP-COMPLETION-CALLBACK

**local_logic_ref**：DLOCAL-COMPLETION-CALLBACK

**实现状态**：not_implemented_or_runtime_verified_this_revision

**交付优先级**

**级别**：P0

**角色**：primary

**优先组**

1. P0-FOLLOWUP

**范围**：外呼已结束且已完成沟通保存成功后，以本次通话和已保存业务快照回调原应用；复用原交付通道。 本记录原导入的六个选填业务字段纳入固定快照。

**local_implementation_boundary**：只读代码显示CustomerBusiness field/option.businessKey允许空，CustomerFollowup当前保存内部字段/选项ID对应值，尚未在成功保存时固化业务编码快照；不能将现有跟进保存或旧VM28组作为此协议已实现证据。

**business_type_contract**

**field_ref**：DFIELD-024

**来源**：original_saved_record_businessType

**rule**：每次结果/进度及已完成沟通回调均携准确原app/tenant/record/call导入时保存的businessType稳定码和既有businessBatchNo；补送沿原事件快照。类型后续改名或停用不重算原码，历史未知不猜值，不只回传类型名称，也不替代已填字段/选项业务编码。正式回调报文与ACK仍待契约及工程验证。

**来源**：inputs/source-index.json#SRC-125, memory/normalized-user-stories.json#AC-102, memory/normalized-user-stories.json#AC-103, memory/normalized-user-stories.json#AC-104

**共同约束**

**failure_budget**

**business_key**：tenant＋原supplierTaskId＋服务端保存leadCode＋固定phone

**maximum_extra_submissions**：2

**includes_initial**：False

**new_root_or_application_resets**：False

**dispatch_rejection_counts**：True

**unknown_retains_original_attempt_and_used_or_reserved**：True

**automatic_causes**

1. 运营商禁呼

2. 运营商限呼

3. restrict tel（外呼黑名单）

**automatic_delay_seconds**：120

**delay_anchor**：平台首次收到并确认该准确失败结果的保存时间；重复不重置

**manual_causes**

1. 无可用中继

2. bad tel

3. 真实号码为空

4. no clid

5. bad clid

6. 无可用中继信息

7. wrong obClidGroup

8. bad timeout range

**normal_task_retry_separate**：True

**short_hangup_resubmission**：False

**applicable_call_modes**

1. predictive

**application_or_root_change_does_not_reset**：True

**short_hangup**

**conditions**

1. 可信客户真实接听

2. 可信客户主动挂断

3. 可信客户有效接听时长0～2秒含边界

**false_rule**：任一可信false且无整体关联冲突→明确非秒挂，即使其他条件未知

**true_rule**：三项均可信true→秒挂

**unknown_rule**：整体可信归属冲突，或无false且至少一项未知→待核；缺时长不补0

**result_only_no_plan_or_counter**：True

**source_routing**：所有接入应用记录按保存的原稳定 app/tenant 回调该应用配置；包括天网及人工外呼方式。无 app 手工 UI 仅平台。source/root/最近主批/当前坐席/最近 token 租户不能改路由，地址变更与积压版本待审。 原businessBatchNo只载荷关联，不选择接收方。

**download_completion**：绑定固定快照及当前授权的可信保存完成只清本快照明细文件；普通下载/点击/HTTP成功不触发；必要业务状态保留。

**workbench_objective_evidence**：SRC-122：明确外呼客户未接且结束才必选；API-327完整20描述/16码保留code+description，715/183同码多义不能只存码，空白不等主动选183未知。人工状态、录入人/时间、处理结果与客观线路结果独立保存；未知/已接及预测客户已接坐席未接不套该必选，呼入不扩。振铃可填草稿不代表结束，晚到客观证据不覆盖人工选择；继续跟进成功保同一线索待联系，预测转人工须先解决原任务排他。

**tenant_identity**：应用↔租户多对多；显式 tenantId 换单租户 token 为建议方案，核关系并绑定稳定 app；缺失或越租户拒绝，不默认首个/最近租户。

**missing_callback**：全部应用新接口导入需先配本 app 回调地址；缺失不新增客户、分配、批次或提交，不能先收后等配置。历史重放只读回执与并发变更行为待审。

**external_business_batch**：businessBatchNo仅外部可重复业务关联，全部API新导入必传，记录原值+原app/tenant保存并在所有适用回调携带；完整requestId摘要含该值，同requestId改值冲突。跨app/tenant同值隔离，不能替代root/fileId/技术去重或改变预测额度。历史缺值不猜造，手工CSV不新增必填。

**communication_completion**：本次外呼结束+本次agentDisposition已完成沟通+完整保存成功三项同时满足才生成独立事件；processingStatus通用完成不够。准确原app/tenant/record/call的保存快照，补送不读aggregate/最新资料、不重导/派发/呼叫；原逐次结果进度等回调保留，人工处理不改客观接通事实。

**business_field_callback_codes**：本次已填写的客户业务信息，包含选填字段，均随快照携带字段业务编码及保存值；有选项时携对应选项业务编码/值，多选完整保留全部选中编码。不能只发显示label、内部字段ID或内部选项ID。保存时固定对应配置编码/版本，后续配置变更不改补送；未填写不猜造编码值，历史缺业务编码明确待核。正式载荷字段名和嵌套schema仍为proposed。

**missing_business_callback_code**：已填字段或选中选项缺业务编码时，回调资料须明确待完善/待核，不能以label或内部ID兜底并标完整交付成功；本次新协议不自行把已有效的本地保存改成失败。缺码补全、修正版本和再次交付规则待正式契约，不静默改旧已发快照。

**callback_event_ack_isolation**：既有结果/进度与新增完成沟通事件即使复用DFIELD-089/090/091，也须按候选事件类型(type)、准确事件ID及版本隔离状态/ACK；旧结果ACK不得确认完成事件，完成事件ACK不得代确认其他结果或版本。正式字段仍待契约。

**import_optional_business_context**：六个导入业务字段逐行选填，两种外呼方式均适用；未传或留空不阻止合法导入。已填按字符串原值保存，编码和Smartcode保留前导零与大小写，不转数值、不凭名称查补编码、不凭编码补名称。各项可独立填写，不要求代码名称成对齐全；正式长度、格式、空值与错误码待核。不代替leadCode、requestId、businessBatchNo或填单plannedStoreName，也不改变原应用/租户/线索/通话归属。 留资时间leadCreatedAt是业务系统提供的原线索留资时间，选填；与平台importedAt和跟进savedAt分别保存/展示。未提供不填当前时间，不由其他时间推算；按原提供值透传，正式wire类型、时间格式及时区待S4确认，不凭样例冻结。

**completion_import_business_context**：完成沟通事件另携本记录本次导入保存的六个选填业务字段intentionStoreCode/intentionStoreName/intentionSeriesCode/intentionSeries/smartCode/leadCreatedAt；按原app/tenant/record及本次call准确关联，已填携原码/原名称/原Smartcode，未提供保留缺值，不能以其他同手机号/线索/批次的最新导入或后续编辑覆盖。本次导入业务信息与坐席本次填写的customerFollowup快照并列，原plannedStoreName不被导入意向门店覆盖；补送使用同一固定快照。 留资时间leadCreatedAt是业务系统提供的原线索留资时间，选填；与平台importedAt和跟进savedAt分别保存/展示。未提供不填当前时间，不由其他时间推算；按原提供值透传，正式wire类型、时间格式及时区待S4确认，不凭样例冻结。
