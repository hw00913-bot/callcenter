/** Read-only projection of outputs/阿里云CCC能力支持与POC事项清单.md; no live API results. */
(function(){'use strict';
const audit={
  "date": "2026-09-08",
  "sourceVersion": "V1.2",
  "realVerification": "未验证",
  "groups": [
    {
      "key": "support",
      "name": "公开能力可支撑",
      "rows": [
        {
          "id": "SUP-01",
          "title": "自定义“我的坐席”界面；业务系统嵌入 PhoneBar",
          "details": [
            "CCC Core SDK 支持无 UI 集成；UI SDK 可嵌入业务页面。SDK 接入",
            "可以保留当前页面风格；真实软电话运行需 HTTPS、麦克风权限及正确身份配置。不是另买一套页面",
            "POC-01、ISSUE-102"
          ],
          "links": [
            {
              "label": "D01",
              "url": "https://help.aliyun.com/zh/ccs/cccai/use-cases/ccc-sdk-frontend-access-3"
            }
          ]
        },
        {
          "id": "SUP-02",
          "title": "人工拨号、取消、挂断、静音与取消静音",
          "details": [
            "SDK call / hangUp / muteAgent / unmuteAgent；MakeCall。SDK、拨号接口",
            "官方 Caller 满足坐席个人外呼号码或当前签入技能组号码其一即可；本期产品仅使用方案团队号码，不增加个人号码功能。接口受理不是客户接通，最终状态需由真实话务事件确认",
            "ISSUE-103、GAP-03"
          ],
          "links": [
            {
              "label": "D01",
              "url": "https://help.aliyun.com/zh/ccs/cccai/use-cases/ccc-sdk-frontend-access-3"
            },
            {
              "label": "D02",
              "url": "https://help.aliyun.com/zh/ccs/cccai/api-ccc-2020-07-01-makecall"
            }
          ]
        },
        {
          "id": "SUP-03",
          "title": "原生工作台仅外呼、话后恢复",
          "details": [
            "ChangeVisibility；ReadyForService(OutboundScenario=true)。仅外呼状态、恢复服务",
            "仅外呼不是坐席停用。原生入口不接呼入或预测任务的组合效果需实测；结果保存门禁由中台执行",
            "POC-03、ISSUE-103"
          ],
          "links": [
            {
              "label": "D03",
              "url": "https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-changevisibility"
            },
            {
              "label": "D04",
              "url": "https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-readyforservice"
            }
          ]
        },
        {
          "id": "SUP-04",
          "title": "单个新增坐席、导入已有 RAM 用户",
          "details": [
            "CreateUser、ImportRamUsers。创建、导入",
            "新建需真实邮箱、登录名和角色；导入需已有 RAM 用户 ID。ImportRamUsers 返回导入执行 ID；ListUsers 完整分页按 RamId 精确取得返回 UserId。中台业务账号不等于 RAM 账号，资源确认不等于执行终态成功",
            "POC-01、GAP-01"
          ],
          "links": [
            {
              "label": "D05",
              "url": "https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-createuser"
            },
            {
              "label": "D06",
              "url": "https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-importramusers"
            }
          ]
        },
        {
          "id": "SUP-05",
          "title": "坐席资料变更",
          "details": [
            "ModifyUser 支持所列资料字段修改。修改坐席",
            "仅覆盖接口列出的姓名、手机号、角色、工作模式等字段；不能宣称任意业务系统字段均能同步。逐项失败与重试由中台记录",
            "GAP-01；不支持事项 UNS-06"
          ],
          "links": [
            {
              "label": "D07",
              "url": "https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-modifyuser"
            }
          ]
        },
        {
          "id": "SUP-06",
          "title": "坐席多技能、技能等级调整",
          "details": [
            "ModifySkillLevelsOfUser 接受多个技能组及等级，1—10，数值越小能力越强。技能等级",
            "技能等级不是保证某坐席永远优先的完整排序规则。租户授权、成员管理与物理技能组映射由中台控制",
            "POC-08"
          ],
          "links": [
            {
              "label": "D08",
              "url": "https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-modifyskilllevelsofuser"
            }
          ]
        },
        {
          "id": "SUP-07",
          "title": "人工预测外呼任务",
          "details": [
            "CreateCampaign；任务发布、暂停、恢复与终止能力在既有矩阵中关联对应接口。创建活动、预测式外呼说明、暂停活动",
            "需申请开通；须提供技能组、联系流、名单、时段、策略等参数。中台保存任务与租户、方案版本、业务来源的关系",
            "POC-06、GAP-04"
          ],
          "links": [
            {
              "label": "D09",
              "url": "https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-createcampaign"
            },
            {
              "label": "D10",
              "url": "https://help.aliyun.com/zh/ccs/predictive-outbound-call"
            },
            {
              "label": "D11",
              "url": "https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-pausecampaign"
            }
          ]
        },
        {
          "id": "SUP-08",
          "title": "呼入 IVR 导航、按键分支、排队转人工",
          "details": [
            "IVR 模块支持放音、收号、分支与转人工。IVR 模块",
            "采用阿里预先发布的流程。共享号码下不同租户的实际路由与数据归属由中台映射，不能仅凭来电号码确定租户",
            "POC-08；涉及自动改写流程时关联 POC-07"
          ],
          "links": [
            {
              "label": "D12",
              "url": "https://help.aliyun.com/zh/ccs/cccai/user-guide/ivr-modules"
            }
          ]
        },
        {
          "id": "SUP-09",
          "title": "号码用途设置、绑定呼入联系流",
          "details": [
            "ModifyPhoneNumber 支持 Outbound / Inbound / Bidirection，呼入用途可绑定联系流。号码修改",
            "多租户共享使用授权是中台规则；“业务隔离”采用用途调整、维护 IVR 与中台阻断组合，不是线路停机",
            "原 POC-04 替代方案；GAP-03"
          ],
          "links": [
            {
              "label": "D13",
              "url": "https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-modifyphonenumber"
            }
          ]
        },
        {
          "id": "SUP-10",
          "title": "通话详单、状态与 IVR 轨迹接收",
          "details": [
            "RocketMQ 事件；CDRReady / IvrTracking / RecordingReady 等。事件推送、事件格式",
            "中台负责业务关联、重复与乱序处理、缺失补偿、回流业务系统。不能把中台回调地址当成阿里已提供的普通 HTTP webhook",
            "POC-08、ISSUE-104"
          ],
          "links": [
            {
              "label": "D14",
              "url": "https://help.aliyun.com/zh/ccs/cccai/user-guide/send-event-notification"
            },
            {
              "label": "D15",
              "url": "https://help.aliyun.com/zh/ccs/cccai/use-cases/event-notification-formats"
            }
          ]
        },
        {
          "id": "SUP-11",
          "title": "有人工参与通话的录音查询",
          "details": [
            "ListMonoRecordings；录音生成事件。录音查询、录音生成条件",
            "仅查询实际生成且适用的录音；播放前再次鉴权。该查询接口返回的下载 URL 有效期为 1 天，不是音频保存期限",
            "POC-08；UNS-01、UNS-05"
          ],
          "links": [
            {
              "label": "D16",
              "url": "https://help.aliyun.com/zh/ccs/cccai/api-ccc-2020-07-01-listmonorecordings"
            },
            {
              "label": "D15",
              "url": "https://help.aliyun.com/zh/ccs/cccai/use-cases/event-notification-formats"
            }
          ]
        },
        {
          "id": "SUP-12",
          "title": "基础话务统计与坐席报表",
          "details": [
            "ListHistoricalAgentReport 提供坐席呼入、呼出等指标；其他基础报表沿用既有矩阵的接口映射。坐席历史报表",
            "中台租户、入口、方案等维度需要自行归集；历史租户归属不能只按坐席当前关系倒推。阿里报表用于同口径对账",
            "ISSUE-104"
          ],
          "links": [
            {
              "label": "D17",
              "url": "https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-listhistoricalagentreport"
            }
          ]
        }
      ]
    },
    {
      "key": "poc",
      "name": "必须完成的真实 POC",
      "rows": [
        {
          "id": "POC-01／ISSUE-101：本人鉴权",
          "title": "中台及外部业务系统登录后，能否安全取得本人 CCC 坐席身份。GetLoginDetails",
          "details": [
            "阿里确认接入方式；至少两个真实坐席分别登录，不输入第二套业务密码、不暴露长期 AK/SK；不能替换 UserId 越权；过期、停用和续期均有记录",
            "中台后端＋阿里技术支持",
            "未验证；上线阻断"
          ],
          "links": [
            {
              "label": "D18",
              "url": "https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-getlogindetails"
            }
          ]
        },
        {
          "id": "ISSUE-102：双入口单会话",
          "title": "工作台与外部 PhoneBar、不同设备并发上线时，不抢占、不重复注册。SDK 设备与多标签说明",
          "details": [
            "后登录入口被拒绝且原通话保留；断网恢复不生成两个有效会话；通话／话后期间不能换绑身份或切上下文；不使用强制踢旧设备满足要求",
            "前后端＋阿里",
            "未验证；上线阻断；本地浏览器锁不算跨设备验证"
          ],
          "links": [
            {
              "label": "D01",
              "url": "https://help.aliyun.com/zh/ccs/cccai/use-cases/ccc-sdk-frontend-access-3"
            }
          ]
        },
        {
          "id": "ISSUE-103：人工外呼状态闭环",
          "title": "仅外呼、未接通、取消、客户先挂、保存结果、刷新恢复等是否一致。SDK、MakeCall、ReadyForService",
          "details": [
            "原生入口不承接呼入／预测任务；接通、未接、取消分别形成正确记录；结果保存失败不能继续；保存成功但恢复状态失败只补偿状态；超时不盲目重拨；取消与接通同时发生时不误记结果",
            "前后端＋阿里",
            "未验证；上线阻断"
          ],
          "links": [
            {
              "label": "D01",
              "url": "https://help.aliyun.com/zh/ccs/cccai/use-cases/ccc-sdk-frontend-access-3"
            },
            {
              "label": "D02",
              "url": "https://help.aliyun.com/zh/ccs/cccai/api-ccc-2020-07-01-makecall"
            },
            {
              "label": "D04",
              "url": "https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-readyforservice"
            }
          ]
        },
        {
          "id": "POC-03：坐席停用保留当前通话",
          "title": "停用后停止所有新呼叫和任务，但当前通话继续。ChangeVisibility",
          "details": [
            "测试空闲、拨号中、通话中、话后四种状态；停止新分配及新外呼，不误挂当前通话；通话结束后自动失效；失败可重试，恢复按当前配置生效",
            "后端＋阿里",
            "未验证；坐席生命周期上线阻断"
          ],
          "links": [
            {
              "label": "D03",
              "url": "https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-changevisibility"
            }
          ]
        },
        {
          "id": "POC-02：厚朴等外部线路",
          "title": "目标线路是否兼容选定的 CCC 实例、号码和业务方向。SIP 指引、号码导入",
          "details": [
            "取得开通／加白确认；受控测试号码完成呼入呼出、主被叫显示、DTMF、持续通话、适用录音、约定并发与主备切换测试；记录双方配置与商务边界",
            "阿里＋线路商＋实施",
            "未验证；使用该外部线路前阻断"
          ],
          "links": [
            {
              "label": "D19",
              "url": "https://help.aliyun.com/zh/ccs/sip-connection-guide/"
            },
            {
              "label": "D20",
              "url": "https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-importcorpnumbers"
            }
          ]
        },
        {
          "id": "POC-06：预测／IVR 活动暂停、终止",
          "title": "暂停或终止会怎样影响已发起的话务。PauseCampaign",
          "details": [
            "分别记录未拨、拨号中、客户已接通等待坐席、坐席通话中四类状态；验证“停止新拨号、当前通话继续”；不满足时先调整业务承诺",
            "后端＋阿里",
            "未验证；相关任务控制上线前必须确认"
          ],
          "links": [
            {
              "label": "D11",
              "url": "https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-pausecampaign"
            }
          ]
        },
        {
          "id": "AUD-POC-IVR-01：纯 IVR 执行配置（本报告新增核验条目，关联 SD-14）",
          "title": "CreateCampaign 必填技能组和联系流如何支撑没有人工坐席参与的自动 IVR 外呼。活动接口、预测式外呼说明",
          "details": [
            "文档覆盖 QueueId、ContactFlowId 和调度参数，不足以证明零人工坐席实际执行。须由阿里确认适用配置并真实验证无人工在线仍可执行、逐次结果与轨迹、可选转人工归属；纯 IVR 录音不适用，不得靠模拟状态判定成功",
            "后端＋阿里",
            "文档部分覆盖；尚未验证；IVR 外呼上线阻断"
          ],
          "links": [
            {
              "label": "D09",
              "url": "https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-createcampaign"
            },
            {
              "label": "D10",
              "url": "https://help.aliyun.com/zh/ccs/predictive-outbound-call"
            }
          ]
        },
        {
          "id": "POC-08／ISSUE-104：事件、录音及报表闭环",
          "title": "话务与业务任务、租户、入口、方案、结果是否能可靠关联。事件推送、格式、录音、报表",
          "details": [
            "保留真实关联标识；重复事件不重复落账；乱序／延迟／缺失能补偿；共享号码不串租户；录音按适用性处理；每次尝试、最终状态、时长单位及汇总可对账；回流失败重试不重复处理",
            "后端＋数据开发＋阿里",
            "未验证；相关数据服务上线阻断"
          ],
          "links": [
            {
              "label": "D14",
              "url": "https://help.aliyun.com/zh/ccs/cccai/user-guide/send-event-notification"
            },
            {
              "label": "D15",
              "url": "https://help.aliyun.com/zh/ccs/cccai/use-cases/event-notification-formats"
            },
            {
              "label": "D16",
              "url": "https://help.aliyun.com/zh/ccs/cccai/api-ccc-2020-07-01-listmonorecordings"
            },
            {
              "label": "D17",
              "url": "https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-listhistoricalagentreport"
            }
          ]
        },
        {
          "id": "ISSUE-105：权限、实例与运行限制",
          "title": "实际购买实例的权限、调用限制、超时及消息配置是否满足需求",
          "details": [
            "记录真实实例／区域／服务版本、授权范围和限流值；凭据只在受控后端；未授权访问被拒绝；接口超时和消息故障有重试与对账方案；按正式确认负载执行容量测试",
            "后端＋运维＋阿里",
            "未验证；上线前必须确认；不猜测厂商阈值"
          ],
          "links": []
        },
        {
          "id": "POC-07：联系流 Definition 自动生成／修改",
          "title": "后续要由中台直接生成或改写阿里联系流结构，而非仅选择阿里预发布流程",
          "details": [
            "厂商确认 schema；草稿、提交、发布及失败恢复可重复；节点与路由版本可追溯；需保留的旧版本有明确实现路径",
            "保留旧编号，未验证；当前只选择预发布流程时，不要求新增通用 IVR 编辑器，但必须检查实际流程与中台路由配置一致"
          ],
          "links": []
        }
      ]
    },
    {
      "key": "unsupported",
      "name": "不支持或不能按原假设承诺",
      "rows": [
        {
          "id": "UNS-01",
          "title": "纯 IVR 无人工通话也能获得 CCC 原生完整录音；转人工前 IVR 段一定包含在录音里",
          "details": [
            "官方录音事件要求坐席与客户共同参与；纯 IVR 原生录音本期不支持承诺，转人工前全段音频也不作保证。录音事件",
            "保留节点、按键、退出码和终态；未来若必须全程录音，另评估线路侧／SBC 等方案，不自动纳入本次采购能力",
            "原 POC-05；SD-14、18"
          ],
          "links": [
            {
              "label": "D15",
              "url": "https://help.aliyun.com/zh/ccs/cccai/use-cases/event-notification-formats"
            }
          ]
        },
        {
          "id": "UNS-02",
          "title": "通过一个 CCC 接口将单号码彻底停机，同时原地保留全部配置",
          "details": [
            "已核对的 ModifyPhoneNumber 没有启停字段，只修改用途／联系流；不能据此承诺网络侧停机。号码接口",
            "维持已确认“业务隔离”；若要求来电完全不可接通，需线路商能力和书面方案",
            "原 POC-04；SD-08"
          ],
          "links": [
            {
              "label": "D13",
              "url": "https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-modifyphonenumber"
            }
          ]
        },
        {
          "id": "UNS-03",
          "title": "管理员凭据加任意 UserId 就能代所有坐席取得登录信息",
          "details": [
            "GetLoginDetails 明确仅允许自身调用，管理员不能代其他用户调用。鉴权接口",
            "保留业务登录体验，另验证合法的本人身份对接链路；不得将管理员代调写成默认方案",
            "POC-01／ISSUE-101"
          ],
          "links": [
            {
              "label": "D18",
              "url": "https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-getlogindetails"
            }
          ]
        },
        {
          "id": "UNS-04",
          "title": "仅依靠阿里的话后处理状态，就能强制结果保存后才能拨下一通",
          "details": [
            "SDK 状态表仍允许话后处理时调用 call；该状态本身不实现业务保存门禁。SDK",
            "中台服务端先保存结果、再允许继续，并统一校验所有呼叫入口；这是中台能力，不是阿里原生强制规则",
            "ISSUE-103"
          ],
          "links": [
            {
              "label": "D01",
              "url": "https://help.aliyun.com/zh/ccs/cccai/use-cases/ccc-sdk-frontend-access-3"
            }
          ]
        },
        {
          "id": "UNS-05",
          "title": "一次取得录音下载地址后可永久使用",
          "details": [
            "ListMonoRecordings.FileUrl 有效期为 1 天，不是永久链接。录音接口",
            "以通话 ID／录音标识持久关联，访问时重新鉴权并获取可用地址；录音保存期限单独按服务配置／合同确认",
            "POC-08"
          ],
          "links": [
            {
              "label": "D16",
              "url": "https://help.aliyun.com/zh/ccs/cccai/api-ccc-2020-07-01-listmonorecordings"
            }
          ]
        },
        {
          "id": "UNS-06",
          "title": "ModifyUser 能同步业务系统全部资料，并返回逐字段成功／失败",
          "details": [
            "所列请求字段不包含组织、Email、LoginName；响应不是逐字段处理报告。仅判定该接口不覆盖，不外推其他接口或人工方式都不可能。修改接口",
            "中台保持业务权威数据，仅同步明确支持字段；记录调用级结果。额外字段变更另核验，不假装同步成功",
            "SD-04A、GAP-01"
          ],
          "links": [
            {
              "label": "D07",
              "url": "https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-modifyuser"
            }
          ]
        }
      ]
    },
    {
      "key": "platform",
      "name": "中台自行实现／现有能力",
      "rows": [
        {
          "id": "手机号／账号登录、账号多租户关系、一个租户内一个角色",
          "title": "现有智能外呼中台",
          "details": [
            "不因为开通云呼叫就另建一套面向用户的业务登录体系；底层 RAM／CCC 身份另行映射"
          ],
          "links": []
        },
        {
          "id": "总部／门店、产品授权、超管实例切换、数据权限",
          "title": "中台",
          "details": [
            "多租户可以映射同一 CCC 实例，但实例共享不等于租户数据自动隔离；所有服务端查询、导出及操作均校验租户范围"
          ],
          "links": []
        },
        {
          "id": "各角色工作台重点工作、待办与快捷入口",
          "title": "中台",
          "details": [
            "展示当前身份实际可做的工作，不用厂商实例数据代替租户待办"
          ],
          "links": []
        },
        {
          "id": "呼叫方案、发布版本、任务快照、业务数据关联",
          "title": "中台",
          "details": [
            "方案发布成功需对应可执行资源；只存本地“已发布”状态不是阿里配置已生效"
          ],
          "links": []
        },
        {
          "id": "外呼前校验、结果未保存禁止继续、业务结果与标签",
          "title": "中台",
          "details": [
            "不只隐藏按钮；工作台与外部业务系统入口都必须经过服务端校验"
          ],
          "links": []
        },
        {
          "id": "结果回流、邮件通知、异常记录、人工重试、审计",
          "title": "中台及现有基础服务",
          "details": [
            "阿里提供原始话务事实，中台负责交付给业务系统并跟踪成功／失败"
          ],
          "links": []
        },
        {
          "id": "现有第三方 AI 外呼、线索及原有统计报表",
          "title": "原智能外呼链路",
          "details": [
            "保留原能力，不因为采购 CCC 改接阿里机器人；AI 转人工仍为本期搁置项，不列为“阿里不支持”"
          ],
          "links": []
        }
      ]
    },
    {
      "key": "adaptation",
      "name": "工程对接待办",
      "rows": [
        {
          "id": "GAP-01",
          "title": "本地已有 RAM 导入按完整分页与精确身份样本回查；未连接真实接口，执行终态仍未知",
          "details": [
            "新建仍明确为模拟；真实创建应保存返回标识。导入受理保存不透明执行 ID，再按同实例 ListUsers 完整分页无损精确匹配 RamId，使用返回 UserId，核对角色、工作模式、技能与本地身份归属后才启用；禁止按名称或跨实例匹配",
            "未查到、查询异常、超时、重复匹配或配置冲突保持待核查，不推导厂商执行失败、不盲目重提。导入前已存在资源只复用且标示未提交；资源存在不能证明由本次导入创建。已核对公开资料未找到执行 ID 终态查询依据，后端对账和真实 POC 仍待完成",
            "SUP-04、05；POC-01"
          ],
          "links": [
            {
              "label": "D05",
              "url": "https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-createuser"
            },
            {
              "label": "D06",
              "url": "https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-importramusers"
            },
            {
              "label": "ListUsers",
              "url": "https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-listusers"
            }
          ]
        },
        {
          "id": "GAP-02",
          "title": "工作台用定时器模拟拨号、接通及结束；会话保护依赖浏览器本地机制",
          "details": [
            "用 SDK／服务端真实状态替代演示状态；建立统一后端会话控制与恢复对账；不得把本地锁验证当成跨设备单会话通过",
            "ISSUE-102、103"
          ],
          "links": []
        },
        {
          "id": "GAP-03",
          "title": "产品本期仅使用团队号码；真实绑定回查及当前签入组校验仍待对接",
          "details": [
            "MakeCall 官方号码权限是二选一：该坐席的个人外呼号码，或其当前签入技能组绑定号码。仅团队分支要求当前签入组一致；不能将此条件误加给个人号码分支。本期只实现方案团队绑定校验，不新增个人外呼号码功能。预测任务号码仍遵循所选技能组规则",
            "SUP-02、07、09"
          ],
          "links": [
            {
              "label": "D02",
              "url": "https://help.aliyun.com/zh/ccs/cccai/api-ccc-2020-07-01-makecall"
            },
            {
              "label": "D10",
              "url": "https://help.aliyun.com/zh/ccs/predictive-outbound-call"
            }
          ]
        },
        {
          "id": "GAP-04",
          "title": "方案现已分别承载执行队列、联系流和人工承接团队，任务只读继承；完整活动运行参数与真实提交仍未实现",
          "details": [
            "活动提交前必须同时解析有效 QueueId 与 ContactFlowId，并补全必填时段、策略和重呼参数。可由管理员预配置或后台映射，不必把所有技术字段暴露给运营。CreateCampaign",
            "POC-06、AUD-POC-IVR-01"
          ],
          "links": [
            {
              "label": "D09",
              "url": "https://help.aliyun.com/zh/ccs/developer-reference/api-ccc-2020-07-01-createcampaign"
            }
          ]
        },
        {
          "id": "GAP-05",
          "title": "方案／呼入路由发布已明确为本地演示；阿里实际生效及回查尚未对接",
          "details": [
            "明确哪些是中台配置、哪些需绑定或更新阿里资源；只有实际生效且回查一致才标记发布成功。使用预发布 IVR 时须校验其真实分支与目标技能组，不能只修改中台覆盖值",
            "POC-07（如触发）、POC-08"
          ],
          "links": []
        },
        {
          "id": "GAP-06",
          "title": "记录与回流目前来自模拟数据，没有真实话务标识关联和事件消费证据",
          "details": [
            "实现消息消费、每次呼叫尝试关联、结果幂等、补偿、录音地址刷新与租户归属快照；保留现有 AI 数据来源，不混算",
            "POC-08／ISSUE-104"
          ],
          "links": []
        }
      ]
    },
    {
      "key": "closed",
      "name": "已确认替代方案",
      "rows": [
        {
          "id": "POC-04",
          "title": "单号码停用且原地保留配置",
          "details": [
            "业务隔离：中台冻结新外呼、保存配置和引用快照；阿里号码切仅呼入并进入暂停服务 IVR；永久解绑独立处理",
            "隔离与恢复是否生效、失败补偿、共享租户影响范围及通知；来电进入维护 IVR不等于线路不可接通"
          ],
          "links": []
        },
        {
          "id": "POC-05",
          "title": "纯 IVR 无人工通话的音频录音",
          "details": [
            "纯 IVR 标为录音不适用，保留结构化轨迹与终态；转人工仅承诺实际生成的有人参与阶段录音",
            "页面和回流不等待不存在的录音；统计排除不适用记录；轨迹与素材／流程版本对应"
          ],
          "links": []
        }
      ]
    }
  ]
};
function freeze(x){Object.values(x).forEach(v=>{if(v&&typeof v==='object')freeze(v);});return Object.freeze(x);}
window.CCCSupportAudit=freeze(audit);
})();
