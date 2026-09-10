# 阿里云 CCC 系统时序接口核验矩阵

## 本轮现行规则：场景配置与运营调度（SRC-032，2026-09-08）

用户明确授权原位更新当前基线和冻结文件，不另存旧冻结副本。本节替代历史通用方案及唯一默认人工方案口径；不表示真实阿里联调已经通过。

| 场景 | 配置归属 | 执行入口与调度 |
| --- | --- | --- |
| 人工外呼 | 人工外呼内维护命名配置，引用已有技能组和租户授权号码 | 工作台只显示本人可用配置；单项默认，多项可选；通话及话后期间不可切换 |
| 预外呼 | 任务自身保存号码、接听技能组、语音流程、执行时间及策略快照 | 任务列表进入运行监控；按状态与权限暂停、继续或终止 |
| IVR 外呼 | 任务自身保存号码、已发布IVR流程、执行时间及转人工规则 | 同一任务监控入口；真实执行控制边界保留POC，不用预测式接口名称证明全部IVR语义 |
| 呼入服务 | 呼入号码对应的导航、服务时间与接听团队规则 | 服务/团队监控；由号码自动匹配规则，不让坐席选择呼入方案 |

- 取消独立通用“呼叫方案/呼叫设置”菜单；任务可复用历史配置作为填写模板，但不要求创建或发布一个独立方案。
- 配置选择不改变账号租户关系、技能组成员和技能等级，也不新增号码使用权；呼叫前重新检查现行授权与资源状态。
- 工作台管理员重点：进行中/暂停/异常任务与调度入口；坐席重点：当前配置、外显号码、客户信息、通话与结果保存。智能外呼原有功能与报表不变。
- 任务监控展示进度、接通、异常、数据更新时间和操作历史。坐席/排队等实时数据没有返回时显示“待接入”，不能用历史详单推算当前空闲人数或用刷新时间冒充数据采集时间。
- 运行中的号码、技能组、语音流程不直接改写；本轮调度复用暂停/继续/终止及跳转既有人员配置。不新增监听、强插、强拆、咨询或三方通话。终止二次确认；暂停/终止不伪造已在途通话结束；未知结果先核对，不自动重发。
- 阿里MakeCall不接收方案ID，人工配置是中台对象。预测任务的QueueId/ContactFlowId由任务配置解析。PauseCampaign、ResumeCampaign、AbortCampaign与GetRealtimeCampaignStats有CCC官方目录依据；精确刷新频率、在途语义、IVR适用范围仍需联调。
- 验收：多配置筛选及切换；越租户/失效配置拒绝；任务监控与列表共享同一状态；暂停恢复终止操作可回查；无权用户不能通过直接调用越权调度；不增加真实电话或云端写入。

官方依据：[MakeCall](https://help.aliyun.com/zh/ccs/cccai/api-ccc-2020-07-01-makecall)、[预测式外呼API目录](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-dir-predictive-outcall/)。

> 核验日期：存量 2026-09-02；原生外呼增量 2026-09-05  
> 核验对象：`云外呼平台系统交互时序图集.html`（存量 20 张 SD + 新增 4 张 SEQ）  
> 业务依据：`产品结构与业务流程确认基线.md` V0.70（保留 BF-01—BF-19，新增 SC-101—104）  
> 方案版本：V1.3 + 2026-09-08 技术纠错（原生外呼责任边界 G2 已确认；补齐资源回查及支持边界，不改 V0.70 冻结包，真实联调未完成）  
> 厂商口径：仅使用阿里云云联络中心（CCC）官方公开文档；公开文档未证明的能力不推定支持。

## 1. 核验结论

本矩阵保留 20 张存量 SD 与 4 张原生 SEQ 的技术映射。现行支持、POC 和不能承诺事项统一见 [能力支持与 POC 清单](阿里云CCC能力支持与POC事项清单.md)。公开动作覆盖不等于场景上线通过；号码业务隔离和纯 IVR 结构化轨迹是产品替代方案，不代表原始能力变为支持。旧版按图计数不再作为当前支持率。

不能继续沿用的四个旧假设及当前处理：

1. **CCC 坐席不是一个完全脱离阿里账号体系的轻量标识。** `CreateUser` 会创建与坐席一一映射的 RAM 子账号，必填 `LoginName` 和 `Email`，并返回 `UserId`。中台可以不向坐席暴露第二套业务登录入口，但必须保存和治理底层 RAM/CCC 身份。
2. **DCC 无感加载 PhoneBar 尚未闭环。** 前端 SDK 支持嵌入自有系统，但 `GetLoginDetails` 官方说明只允许坐席本人调用，管理员不能代调；与此同时官方又提供管理员 AK 的 CRM Demo。两份公开材料不足以证明“中台管理员凭据可安全代任意坐席取登录信息”，必须由阿里给出明确接入方案并完成 POC。
3. **公开 OpenAPI 没有单号码启停接口。** `ModifyPhoneNumber` 只修改用途与绑定联系流；`RemovePhoneNumbers` 会把号码移出实例并解除技能组、联系流、坐席等全部关联。当前不再模拟“原位停用”，而是由中台冻结新外呼、保存恢复快照，再通过 `ModifyPhoneNumber` 切为仅呼入并绑定“暂停服务 IVR”；完全不可接通仍需线路供应商能力。
4. **纯 IVR 无坐席通话不能承诺使用 CCC 原生通话录音。** `RecordingReady` 官方明确只有坐席和客户都参与时才生成。当前将纯 IVR 标为 `NOT_APPLICABLE_PURE_IVR`，保存联系流/素材版本、时间、节点、按键、退出码和终态；全程音频如未来成为硬要求，再单独设计线路商/SBC 录音。

## 2. 判定口径

| 判定 | 含义 | 是否可进入开发 |
|---|---|---|
| 公开能力覆盖 / 中台组合 | 厂商核心动作有公开 API、SDK 或事件依据；租户隔离、权限、版本、幂等和业务数据由中台实现 | 可以进入详细设计，生产前仍需联调 |
| 中台二次开发 / 无 CCC 依赖 | 该流程不依赖阿里能力 | 可以按现有系统约束开发 |
| 条件可行 / 阻断 POC | 主能力存在，但关键边界公开文档无法证明 | POC 通过前不得承诺投产 |
| 公开能力不满足 | 官方公开接口缺失，或官方说明与目标能力冲突 | 必须调整业务方案或取得阿里书面定制能力证明 |

## 3. SD × 阿里能力核验矩阵

| SD | 核验结论 | 对应阿里公开能力 / 接口 | 满足范围 | 约束、缺口与时序图修正 |
|---|---|---|---|---|
| SD-01 实例上下文与租户启用 | 公开能力覆盖 / 中台组合 | [`GetInstance`](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-getinstance)、[`ListInstances`](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-listinstances) | 可校验实例存在性及 `RUNNING / STOPPED / RELEASED / CREATING` 状态 | 租户—实例 N:1、上次实例恢复、菜单与数据权限均是中台模型；不能从 CCC 实例直接得到 tenantId |
| SD-02 中台账号与租户成员 | 中台二次开发 / 无 CCC 依赖 | 无 | 账号、手机号唯一、租户成员和角色都由现有中台完成 | 不应调用 DCC 或 CCC，也不应在本流程创建坐席 |
| SD-03 业务系统用户开通坐席 | 公开动作覆盖 / 导入资源回查部分覆盖 | [`CreateUser`](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-createuser)、[`GetUser`](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-getuser)、[`ListUsers`](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-listusers) | 新建可取得 `UserId`；已有 RAM 导入只返回受理编号，须分页 `ListUsers` 按 RamId 精确关联返回 UserId，并按需 `GetUser` 核资料 | `CreateUser` 会同步创建 RAM 子账号，必填唯一 `LoginName`、`Email`、`RoleId`；批量 DCC 选择应由中台逐项调用并汇总。已有 RAM 子账号才使用 [`ImportRamUsers`](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-importramusers)；查询异常、未查到或超时保持待核验，不推定厂商执行失败；资源回查不等于执行终态已核验；[`AssignUsers`](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-assignusers) 已弃用 |
| SD-04A 用户资料自动同步 | 公开能力部分覆盖 / 中台组合 | [`ModifyUser`](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-modifyuser) | 支持修改 `Mobile`、`WorkMode`、`RoleId`、`DisplayId`、`DisplayName`、`Nickname`、`AvatarUrl` | 不支持同步组织、Email、LoginName；接口只返回本次调用成功/失败，不返回“字段级结果”。不支持字段保留中台权威值并展示厂商差异 |
| SD-04B 坐席停用、恢复、删除 | 条件可行 / 阻断 POC | [`ChangeVisibility`](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-changevisibility)、[`ResetAgentState`](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-resetagentstate)、[`RemoveUsers`](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-removeusers) | 可把坐席切为仅外呼、查询/重置状态、从实例删除坐席 | 没有公开的“坐席启用/停用”生命周期字段；`ChangeVisibility` 仅阻止呼入但仍允许外呼，不能单独满足停用。必须由中台先阻止新任务，再 POC 验证通话结束后签出/删除时机。`RemoveUsers` 只解绑实例，不删除 RAM 账号 |
| SD-05 逻辑模板与物理技能组 | 公开能力覆盖 / 中台组合 | [`CreateSkillGroup`](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-createskillgroup)、[`ModifySkillGroup`](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-modifyskillgroup)、[`DeleteSkillGroup`](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-deleteskillgroup) | 可在实例内创建、修改和删除物理技能组 | 阿里没有 templateId、tenantId；“实例共享逻辑模板 + 每租户独占物理 SkillGroupId”必须由中台建映射，是正确的隔离方案 |
| SD-06 坐席多技能与等级 | 公开能力覆盖 / 中台组合 | [`AddSkillGroupsToUser`](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-addskillgroupstouser)、[`ModifySkillLevelsOfUser`](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-modifyskilllevelsofuser)、[`RemoveSkillGroupsFromUser`](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-removeskillgroupsfromuser)、[`ListSkillLevelsOfUser`](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-listskilllevelsofuser) | 支持一坐席多技能组及 1—10 等级，数值越小技能越强 | 为保证“部分成功、逐项重试”，中台应按坐席/关系拆调用或在调用后回查；不能假定一个批量请求会返回每条关系的独立错误明细 |
| SD-07 外部线路与号码接入 | 条件可行 / 阻断联合 POC | [SIP Trunk 接入说明](https://help.aliyun.com/zh/ccs/sip-protocol-access-description)、[`ImportCorpNumbers`](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-importcorpnumbers)、[`AddPhoneNumbers`](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-addphonenumbers)、[`ListPhoneNumbers`](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-listphonenumbers) | 支持企业自有 SIP Trunk、导入自有号码并加入指定实例 | 首次 `ImportCorpNumbers` 需阿里支持加白；厚朴线路的 SIP、IP、DTMF、主叫显示、呼入、录音、并发和故障切换必须三方联调。线路账号与 tenantId 授权由中台维护，不存在公开 CCC tenant 接口 |
| SD-08 号码业务隔离与恢复 | 公开能力覆盖 / 业务隔离组合 | [`ModifyPhoneNumber`](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-modifyphonenumber)、[`RemovePhoneNumbers`](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-removephonenumbers) | `ModifyPhoneNumber` 可把用途切为仅呼入并绑定预发布的暂停服务 IVR；中台可冻结新外呼、保存原配置和全部跨租户引用快照并控制恢复 | 这不是阿里原生号码停用：来电仍会接通至暂停服务 IVR。要求完全不可接通时需线路供应商能力。`RemovePhoneNumbers` 会解除实例关联，只能作为独立永久解绑动作；恢复后受影响任务由管理员手工恢复 |
| SD-09 中台呼叫方案版本 | 中台二次开发 / 无 CCC 直接依赖 | 无 | 草稿、发布快照、默认方案、租户授权均可由中台完成 | 发布/启动阶段引用的 CCC 资源需用查询接口校验，但 CCC 不提供中台的 callPlanVersion |
| SD-10 共享号码 IVR 与租户路由发布 | 公开能力覆盖 / 定义结构需 POC | [`ListContactFlows`](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-listcontactflows)、[`GetContactFlow`](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-getcontactflow)、[`StartEditContactFlow`](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-starteditcontactflow)、[`CommitContactFlow`](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-commitcontactflow)、[`PublishContactFlow`](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-publishcontactflow)、[`ModifyPhoneNumber`](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-modifyphonenumber) | 可读取 IVR `Definition`、提交草稿、发布并把号码绑定到已发布联系流 | 阿里没有 tenantId；分支需直接指向对应租户物理 `SkillGroupId`。中台自动重写 `Definition` 的 schema/version 稳定性、分支 ID 稳定性和失败回滚需 POC；优先方案是阿里预配置流程，中台做版本映射与发布控制 |
| SD-11 DCC 内嵌 PhoneBar | 条件可行 / 身份链路阻断 POC | [前端 SDK 3.x](https://help.aliyun.com/zh/ccs/use-cases/ccc-sdk-frontend-access-3)、[`GetLoginDetails`](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-getlogindetails)、[`GetUser`](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-getuser)、[`PollUserStatus`](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-polluserstatus) | SDK 可嵌入 DCC、缩成工具条、监听来电/拨号/接通/结束/状态，并支持一个设备注册及多标签页主从模式 | `GetLoginDetails` 只允许本人调用；需阿里确认 OAuth2 或官方代理模式，证明 DCC 用户无需输入 RAM 密码即可取得本人登录信息。中台单会话锁是补充控制；断网恢复、拒绝新入口抢占、会话续期也需 POC；不采用强制踢旧设备 |
| SD-12 PhoneBar 人工外呼 | 公开能力覆盖 / 依赖 SD-11 | [`MakeCall`](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-makecall)、[SDK `call` 与钩子](https://help.aliyun.com/zh/ccs/use-cases/ccc-sdk-frontend-access-3)、[话务事件](https://help.aliyun.com/zh/ccs/use-cases/event-notification-formats) | 支持坐席、主叫、被叫发起外呼，并监听拨号、接通、挂机状态 | `Caller` 官方允许二选一：绑定当前签入技能组的号码，或坐席个人外呼号码。本期产品仅采用团队号码，个人号码不在本期范围；中台方案、合规、recordId、租户归属均需自行保存。SD-11 身份链路未通过前，本场景不能投产 |
| SD-13 预测外呼 | 公开能力覆盖 / 需开通与状态语义 POC | [`CreateCampaign`](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-createcampaign)、[`SubmitCampaign`](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-submitcampaign)、[`PauseCampaign`](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-pausecampaign)、[`ResumeCampaign`](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-resumecampaign)、[`AbortCampaign`](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-abortcampaign)、[`ListAttempts`](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-listattempts)、[预测外呼事件](https://help.aliyun.com/zh/ccs/use-cases/event-notification-formats) | 活动可绑定 `QueueId`（技能组）、`ContactFlowId`、名单、业务 `ReferenceId` 和主叫号码；有 Campaign/CaseAttempted 事件 | 使用前需要提交工单开通。官方未说明暂停/终止对已经拨出或已接通通话的精确处理，需 POC 验证“只停止新拨号、在途通话继续”。任务与租户隔离仍由中台完成 |
| SD-14 IVR 外呼 | 文档部分覆盖 / 无坐席执行待 POC；纯 IVR 录音不适用 | `CreateCampaign` / `SubmitCampaign`、联系流 API、[`ListIvrTrackingDetails`](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-listivrtrackingdetails)、[`CaseAttempted`](https://help.aliyun.com/zh/ccs/use-cases/event-notification-formats) | 可在客户接通后进入已发布 IVR，执行放音、收号、分支、挂机或转人工，并取得节点轨迹与终态；这些结构化信息作为纯 IVR 本期追溯凭证 | `CreateCampaign` 要求 `QueueId` 和 `ContactFlowId`；纯 IVR 无坐席执行仍待 `AUD-POC-IVR-01` 验证，相关场景上线阻断，不能由存在技能组配置推导已支持。纯 IVR 不等待 `RecordingReady`，固定为录音不适用；转人工只承诺有人参与阶段可用录音，不承诺转人工前 IVR 段 |
| SD-15 现有第三方 AI 外呼 | 复用既有能力 / 无 CCC 依赖 | 无 | 沿用现有 AI 厂商账号、机器人、话术、任务、结果和 DCC 回流 | 本期搁置 AI 转人工，因此不应引入阿里 CCC 调用或技能组 |
| SD-16 共享号码呼入与人工接听 | 公开能力覆盖 / 事件关联需 POC | `AddPhoneNumbers` / `ModifyPhoneNumber`、[IVR 模块](https://help.aliyun.com/zh/ccs/ivr-modules)、[`AnswerCall`](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-answercall)、[`IvrTracking` / `Enqueue` / `AssignAgent`](https://help.aliyun.com/zh/ccs/use-cases/event-notification-formats) | 号码可绑定入口 IVR；IVR 可收号、分支并转到物理技能组；ACD 可分配并由 PhoneBar 接听 | tenantId 不是阿里字段，需按已发布分支→物理 SkillGroupId→中台 tenantId 映射解析。需 POC 验证 `contactId`、`flowId`、`nodeId/nodeExitCode`、`skillGroupId` 的关联完整性和事件顺序 |
| SD-17 服务时间、排队与异常 | 公开能力覆盖 / 流程配置组合 | [IVR 模块](https://help.aliyun.com/zh/ccs/ivr-modules)、[事件定义与典型序列](https://help.aliyun.com/zh/ccs/use-cases/event-definitions)、[`GetCallDetailRecord`](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-getcalldetailrecord) | 联系流可完成时间判断、排队、提示、转人工与挂机；事件/CDR 可识别排队放弃、振铃放弃、超时、溢出等终态 | “实例默认 + 租户路由覆盖”是中台配置模型，发布时需展开成各租户分支的实际联系流参数；不能要求阿里运行时读取中台覆盖值 |
| SD-18 统一通话、录音适用性与回流 | 公开能力覆盖 / POC-08 事件闭环 | [RocketMQ 事件推送](https://help.aliyun.com/zh/ccs/send-event-notification)、[事件格式](https://help.aliyun.com/zh/ccs/use-cases/event-notification-formats)、[`ListCallDetailRecordsV2`](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-listcalldetailrecordsv2)、[`ListMonoRecordings`](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-listmonorecordings)、[`ListMultiChannelRecordings`](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-listmultichannelrecordings) | 可接收呼叫、坐席、队列、IVR、预测活动、CDRReady 及有人参与通话的 RecordingReady，并用 CDR/录音接口校准；中台为每通电话保存录音适用性、来源和范围 | 事件通道是 RocketMQ，不是普通 HTTP webhook；事件无 tenantId，中台必须用任务、身份、分支和物理组映射解析。录音 URL 有效期 1 天；纯 IVR 固定为不适用并返回结构化证据，不调用录音查询，也不计入录音覆盖率分母 |
| SD-19 工作台与报表 | 公开能力覆盖 / 中台聚合 | [`GetHistoricalInstanceReport`](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-gethistoricalinstancereport)、[`ListHistoricalAgentReport`](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-listhistoricalagentreport)、[`ListHistoricalSkillGroupReport`](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-listhistoricalskillgroupreport)、[`GetHistoricalCampaignReport`](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-gethistoricalcampaignreport) | 可取得实例、坐席、技能组和预测活动的历史指标；CDR 可提供明细 | 阿里报表按实例/坐席/技能组组织，不带中台 tenantId；普通租户过滤、总部/门店权限、跨来源口径、导出和审计均由中台实现。录音覆盖率/成功率分母由中台排除 `NOT_APPLICABLE_PURE_IVR`；技能组历史报表公开说明最早仅查近 180 天，长期报表要自行沉淀 |

## 4. 仍需进入 POC / 商务书面确认的清单

| POC ID | 优先级 | 核验问题 | 通过标准 | 影响 SD |
|---|---|---|---|---|
| POC-01 | P0 | DCC 登录用户如何以本人身份调用 `GetLoginDetails` 并加载 SDK | 不输入 RAM 用户名/密码；不向浏览器暴露 AK/SK；可由 `(businessSystemId, businessUserId)` 唯一映射到本人 CCC `UserId`；阿里书面确认鉴权方式；真实环境成功完成注册、签入、接听、外呼、签出 | SD-03、11、12、16、17 |
| POC-02 | P0 | 厚朴等外部 SIP Trunk 是否与当前 CCC 实例完整兼容 | 完成双方 IP 加白；三网呼入/呼出、真实主被叫、单/多位 DTMF、10 分钟通话、录音、并发上限、主备故障切换全部通过并形成联调记录 | SD-07、08、12—18 |
| POC-03 | P0 | 坐席停用能否“当前通话完成，但立即不再接收新任务和新呼叫” | 中台停用后 ACD 不再分配、人工外呼被阻断；当前通话不中断；挂机后坐席自动下线/失效；恢复后按当前配置重新签入；失败状态可回查和重试 | SD-04B、11、13、16、17 |
| POC-06 | P1 | `PauseCampaign` / `AbortCampaign` 对在途拨号和已接通通话的行为 | 分别记录未拨、拨号中、客户已接通待坐席、坐席通话中四类样本的状态迁移；确认暂停只控制新拨号的业务规则能否实现 | SD-13、14 |
| POC-07 | P1 | 中台自动生成/修改联系流 `Definition` 的兼容性 | 固定 schema 版本；创建草稿、提交、发布、旧版本保留/回滚均可重复；分支 nodeId 与 routeVersion 可稳定关联；半发布可恢复 | SD-10、14、16、17 |
| POC-08 | P1 | RocketMQ 事件关联与乱序恢复 | 验证 `contactId/jobId`、`campaignId`、`caseId/referenceId`、`flowId/nodeId/nodeExitCode`、`skillGroupId` 字段；重复、乱序、缺失、延迟和 CDR 校准均通过 | SD-12—19 |

### 4.1 已由产品决策关闭的原 POC

| 原 POC ID | 关闭原因 | 已采用方案 | 仍需做的常规联调 |
|---|---|---|---|
| POC-04 | 不再要求阿里提供未公开的单号码原位启停 | 号码“业务隔离”：中台冻结新外呼并保存快照，阿里通过 `ModifyPhoneNumber` 切换仅呼入和暂停服务 IVR；永久解绑独立处理 | 验证 `ModifyPhoneNumber` 切换/恢复、维护 IVR 发布、失败补偿和邮件通知，不作为隐藏能力准入门槛 |
| POC-05 | 产品已确认纯 IVR 本期不要求音频录音 | 录音状态固定为 `NOT_APPLICABLE_PURE_IVR`，保存结构化节点轨迹与终态；转人工只处理有人参与段 | 验证页面状态、详情证据、报表分母和转人工录音覆盖范围；若未来要求全程音频则另立线路侧项目 |

## 5. 时序图必须回写的接口和语义

1. SD-03：默认逐项 `CreateUser`；已有 RAM 用户才 `ImportRamUsers`。导入返回 `Data` 为受理执行编号，不是 UserId。保存实例/RamId/预期配置快照，完整分页 `ListUsers` 按 RamId 精确解析返回 UserId，再按需 `GetUser`。未查到/错误/超时/配置不一致维持待核验；已存在资源仅复用，厂商执行终态未核验；禁止已弃用 `AssignUsers`。
2. SD-04A 的“字段级同步结果”改为：`ModifyUser` 调用级成功/失败，并明确不可同步组织、Email、LoginName。
3. SD-04B 的“厂商停用”改为组合状态机，不得把 `ChangeVisibility` 解释为完整停用。
4. SD-07 的厂商动作拆为：SIP 人工接入/加白 → `ImportCorpNumbers` → `AddPhoneNumbers` → `ListPhoneNumbers` 对账；线路账号不是公开 OpenAPI 资源。
5. SD-08 删除“等待单号码启停隐藏能力”的分支，改为：保存恢复快照 → 中台冻结新外呼 → `ModifyPhoneNumber(Usage=Inbound, ContactFlowId=暂停服务IVR)` → 隔离成功/失败状态 → 校验快照并恢复；`RemovePhoneNumbers` 只用于独立永久解绑。
6. SD-10 明确 `GetContactFlow` / `StartEditContactFlow` / `CommitContactFlow` / `PublishContactFlow` 与 `ModifyPhoneNumber`，并把 tenantId 标为中台元数据。
7. SD-11 明确 SDK 请求经 DCC 后端代理 CCC OpenAPI；`GetLoginDetails` 的调用身份是 P0 红项，不得把“短期 PhoneBar 会话”写成阿里已提供的现成 token。
8. SD-12 明确 `MakeCall` 以及 `onCallDialing / onCallEstablish / onCallRelease / onStatusChange`；主叫必须是阿里判定当前坐席可用的号码。
9. SD-13 明确 Campaign 全套接口及 `Campaign* / CaseAttempted` 事件；暂停在途语义保持 POC。
10. SD-14 明确纯 IVR 原生录音不适用；保存联系流/素材版本、时间、节点、按键、退出码和终态，删除任何“等待录音生成”的默认承诺；转人工只标记有人参与阶段可用录音。
11. SD-16—18 明确事件通过 RocketMQ 接收，租户归属由中台映射解析，不能从号码或阿里 tenantId 取得。
12. SD-19 明确阿里报表只提供实例/坐席/技能组/活动维度，租户权限和统一口径由中台完成。

## 6. 新旧时序图关系

- `outputs/.../云外呼平台场景时序图集.html` 是较早的 C01—C14 接口证据稿，含部分正确的 API 名称和官方链接，但业务对象、租户规则及场景拆分早于 BF-01—BF-19 最终确认。
- `云外呼平台系统交互时序图集.html` 是当前有效主稿，按最终业务流程生成 SD-01—SD-19。
- 两者不是并列的两套待开发流程，也不能简单相加。后续只从旧稿继承经重新核验仍有效的官方证据，不继承旧业务结论。

## 7. 当前可承诺边界

有公开依据：实例校验、坐席创建与有限字段修改、技能组与技能等级、号码加入实例、联系流读取/提交/发布、号码业务隔离组合、嵌入式 PhoneBar UI、人工外呼、预测式外呼、呼入 IVR/ACD、RocketMQ 事件、CDR、有人参与通话的录音查询、纯 IVR 结构化证据及基础报表。仅指所列动作及中台组合设计，不代表整条场景可投产；关联 POC 未通过仍阻断，尤其不能由活动接口推导纯 IVR 无坐席执行已经成立。

暂不能承诺：DCC 用户完全无感取得本人 PhoneBar 登录凭据、厚朴线路必然兼容、坐席停用的“在途保通 + 禁止一切新呼叫”、电信网侧单号码完全停机、预测活动暂停对在途话务的精确行为、中台自动改写任意联系流结构、纯 IVR 无坐席音频录音，以及 IVR 转人工前后全程录音。

## 8. 中台原生外呼增量核验（2026-09-05，G2 已确认）

用户已确认增加正式的工作台纯外呼能力。本节补充此前未同步的原生入口，不替代外部业务系统 PhoneBar，也不改变存量 AI、预外呼、IVR 和呼入范围。演示身份切换不是正式权限或登录能力。

本轮为公开文档核验，没有使用生产凭据、发起真实电话或完成厂商联调。`verified` 仅表示所列用途和字段有文档依据；`partial` 表示关键适配仍有缺口。未知的限流、HTTP 超时等保持待核实，不能把文档核验结果等同于“全部可投产”。

### 8.1 新增场景与存量关系

| 新增场景 / 时序 | 业务目标 | 沿用的存量编号 | 核验结论 |
|---|---|---|---|
| SC-101 / SEQ-101 | 管理员关联中台登录账号与本租户已有坐席 | BF-02、03、04B | 中台实现；不新建登录角色或重复创建 CCC 用户；业务系统用户映射继续保留 |
| SC-102 / SEQ-102 | 进入我的坐席、上线、下线及会话占用保护 | BF-11 / SD-11 | SDK 自定义界面有依据；本人鉴权和跨入口互斥仍是阻断联调项 |
| SC-103 / SEQ-103 | 原生人工拨号、通话控制、话后结果保存 | BF-12 / SD-12 | MakeCall 等核心动作有依据；纯外呼与手工话后、取消状态须联调 |
| SC-104 / SEQ-104 | 同次记录回查、结果归集与统计 | BF-18、19 / SD-18、19 | 事件、详单和录音可组合；入口与业务方案维度由中台归集 |

评审入口：[合并业务图集](云外呼平台业务场景流程图集.html#FLOW-101)、[合并系统交互时序图集](云外呼平台系统交互时序图集.html#SEQ-101)、[14 项接口明细矩阵](../work/baseline-sync/outputs/system-sequence-interface-verification-matrix.md)。新增图已内嵌合并，存量图集旧编号保持不变；已随 V0.70 于 2026-09-05 经用户确认冻结，本轮未导入或修改原型。

### 8.2 接口覆盖与关键限定

| ID | 官方接口 / 能力 | 文档核验 | 本次使用边界 |
|---|---|---|---|
| API-101 | [GetLoginDetails](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-getlogindetails) | 部分覆盖 | 只能以坐席本人身份获取；管理员不可代任意坐席调用 |
| API-102 | [CCC Core SDK 3.x](https://help.aliyun.com/zh/ccs/cccai/use-cases/ccc-sdk-frontend-access-3) | 部分覆盖 | 可自定义 UI；仅外呼、手工话后和占用保护的组合行为须联调 |
| API-103 | [PollUserStatus](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-polluserstatus) | 已核对所列用途 | 查询当前状态；不能只凭查无当前呼叫就认定之前未拨出 |
| API-104 | [MakeCall](https://help.aliyun.com/zh/ccs/cccai/api-ccc-2020-07-01-makecall) | 已核对所列用途 | 主叫需当前坐席有权使用；受理不等于接通，未知响应禁止盲目重拨 |
| API-105 | [ReleaseCall](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-releasecall) | 部分覆盖 | 通话挂断有依据；拨号、振铃中取消的状态范围需实测 |
| API-106 | [MuteCall](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-mutecall) | 已核对所列用途 | 本人通话中静音，不代表暂停录音 |
| API-107 | [UnmuteCall](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-unmutecall) | 已核对所列用途 | 取消本人通道静音，失败不得回显成功 |
| API-108 | [ReadyForService](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-readyforservice) | 已核对所列用途 | 中台业务结果保存后才准许；显式 OutboundScenario=true |
| API-109 | [RocketMQ 事件格式](https://help.aliyun.com/zh/ccs/use-cases/event-notification-formats) | 已核对所列用途 | 后端消费话务、CDRReady、RecordingReady；中台负责去重、乱序和补偿 |
| API-110 | [GetCallDetailRecord](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-getcalldetailrecord) | 已核对所列用途 | InstanceId＋ContactId 关联详单，ContactId 对接本次 JobId |
| API-111 | [ListMonoRecordings](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-listmonorecordings) | 已核对所列用途 | 仅查询适用且实际生成的录音；地址有时效，查看需再次鉴权 |
| API-112 | [ListHistoricalAgentReport](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-listhistoricalagentreport) | 部分覆盖 | 无中台入口／租户／方案筛选；只作同范围厂商汇总对账 |
| API-113 | [SignInGroup](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-signingroup) | 已核对所列用途 | 签入已授权技能组；不等于新增技能，不单独保证仅外呼模式 |
| API-114 | [SignOutGroup](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-signoutgroup) | 已核对所列用途 | 实际签出后才释放会话；不删除账号、坐席或技能 |

合计：14 项，10 项所列接口用途有公开依据，4 项存在本次业务适配缺口；真实集成验收均未开展。SEQ-101 无外部调用，不为凑接口创建 CCC 账号。

### 8.3 已确认采用的接入约束（产品设计边界，不等于工程实现已通过）

1. **纯外呼模式**：原生工作台只承载人工呼出，不接收呼入或预外呼分配；上线和话后恢复均核对仅外呼状态。外部 PhoneBar 继续承担原有接听场景。
2. **保存后继续**：手工话后配置和中台服务端校验共同执行。未接通也有待处理结果；业务结果保存失败不能继续拨号。结果已保存但结束话后失败，仅补偿话务状态，不重复保存。
3. **入口与方案分开统计**：中台保存本次入口、租户、方案版本、坐席和号码快照；厂商外呼技能组按首个签入组记录的字段保留原值，不用它冒充业务方案。按真实话单归集本地维度，阿里报表仅作同口径对账。
4. **双入口不抢占**：中台与外部 PhoneBar 共用同一坐席身份和统一会话控制，不通过强制踢旧设备实现切换。本人鉴权、跨设备竞态和异常恢复未通过前不能启用正式通话。

### 8.4 尚未关闭的验收项

| 问题 | 等级 | 必须取得的证据 | 与存量 POC 关系 |
|---|---|---|---|
| ISSUE-101 本人鉴权 | 高 | 两个真实坐席的本人登录、隔离、过期与停用验证；厂商确认接入方法 | 扩展 POC-01，不新增一套登录账号体系 |
| ISSUE-102 统一会话 | 高 | 两入口、跨设备、并发签入、断网恢复以及使用中禁止换绑 | 扩展 SD-11 的会话验收 |
| ISSUE-103 外呼状态闭环 | 高 | 仅外呼上线，接通／未接／取消／客户先挂／保存失败／刷新后的实际状态 | 扩展 SD-12，不能用原型定时器代验 |
| ISSUE-104 数据口径 | 中 | 尝试键到 JobId 的关联、重复乱序、入口与方案归集、时长单位与录音状态 | 扩展 POC-08、SD-18、SD-19 |
| ISSUE-105 实例与调用参数 | 中 | 最小授权、限流、HTTP 超时、消息投递消费配置及重试策略 | 常规项目联调；不猜测参数或费用 |

用户于 2026-09-05 回复“是的”，确认按上述责任边界继续产品基线工作，随后回复“冻结”确认 V0.70。ISSUE-101—105 仅以接受风险形式允许继续设计，工程状态仍为未测试；上线前必须提交真实联调证据，不能据此放行生产。产品结构、菜单、体验基线及两份图集已完成本轮增量回写并纳入冻结；此为冻结时范围；2026-09-06 用户已确认当前原型适配，不改写冻结包或真实联调状态。

## 9. 当前原型适配补充（2026-09-08 修正）

- SD-03：校验邮箱与登录名来源、角色映射；已有 RAM 导入先记录执行编号，再按目标实例完整分页 `ListUsers`，以 RamId 精确匹配返回 UserId，必要时 `GetUser`。查无/异常/超时保留待核验，已存在仅复用；本次未找到执行编号专用终态查询及逐人最终错误接口公开依据。仅模拟资源确认，厂商执行终态与真实 POC 未核验。[ListUsers](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-listusers)、[ListRamUsers](https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-listramusers)
- SD-09、13、14：执行 QueueId 和 ContactFlowId 同时必需。纯 IVR 无人工承接团队不等于无需执行队列，无坐席调度仍待 POC。
- SD-12、13：MakeCall 官方有“当前签入技能组绑定号码”或“坐席个人外呼号码”两条可选路径；本期只采用团队号码，所以产品检查租户授权、团队绑定与签入组，不新增个人号码功能。预测任务号码属于所选服务技能组。受理不等于接通。
- SEQ-102、103：合法本人鉴权、跨设备单会话、仅外呼与保存门禁仍待联调；hangUp 有公开支持，不代表取消竞态及 ReleaseCall 全状态已验证。
- SD-18、19：临时录音地址按需刷新；事件由消息消费关联，不虚构普通 HTTP webhook。

当前原型承载相关字段、校验及核验说明；真实运行参数、调用回执、消息消费和 POC 不在本地模拟中造假。


### SRC-032 补充接口边界

GetRealtimeCampaignStats请求字段是InstanceId和QueueId，文档把QueueId描述为活动ID，但示例为skillgroup@ccc-test；该歧义必须联调，不可直接用中台taskId替代。返回在线/空闲/通话中/话后等坐席数量，不据此推导任务完成数或客户排队数。缺数据显示待接入。来源：https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-getrealtimecampaignstats 。
