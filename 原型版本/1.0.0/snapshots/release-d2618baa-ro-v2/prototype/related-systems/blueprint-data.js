window.SystemBlueprintData = {
  "version": "1.39",
  "date": "2026-09-29",
  "deliveryVersion": "2026-09-29-multiple-caller-navigation-1",
  "statuses": {
    "platform": "平台职责",
    "documented": "文档有依据",
    "pending": "待确认"
  },
  "views": [
    {
      "id": "overview",
      "name": "系统架构总览",
      "short": "系统总览",
      "subtitle": "从业务来源到呼叫执行，查看系统边界与数据流向。",
      "width": 1200,
      "height": 1040,
      "groups": [
        {
          "name": "业务来源与使用方",
          "x": 30,
          "y": 25,
          "w": 1130,
          "h": 190,
          "tone": "neutral",
          "note": "来源系统名称未确认；现阶段以文件导入衔接"
        },
        {
          "name": "统一外呼中台",
          "x": 30,
          "y": 270,
          "w": 1130,
          "h": 220,
          "tone": "platform",
          "note": ""
        },
        {
          "name": "接口适配层",
          "x": 30,
          "y": 540,
          "w": 720,
          "h": 220,
          "tone": "platform",
          "note": ""
        },
        {
          "name": "通信使用端",
          "x": 790,
          "y": 540,
          "w": 370,
          "h": 220,
          "tone": "neutral",
          "note": ""
        },
        {
          "name": "AliCti 系统",
          "x": 30,
          "y": 795,
          "w": 1130,
          "h": 222,
          "tone": "documented",
          "note": ""
        }
      ],
      "nodes": [
        {
          "id": "overview-users",
          "key": "users",
          "title": "总部 / 门店使用人员",
          "subtitle": "平台账号登录，进入已授权租户",
          "x": 60,
          "y": 88,
          "w": 260,
          "h": 100,
          "status": "platform",
          "scope": "使用方",
          "refs": [
            "API-326"
          ],
          "role": "总部、门店管理人员及坐席通过浏览器进入中台。组织身份与可操作范围由本方规则约束。",
          "inputs": [],
          "outputs": [
            "登录身份与当前租户上下文"
          ],
          "rules": [
            "总部普通成员不会自动获得全部门店数据范围。",
            "关联坐席不会自动提升平台角色权限。"
          ],
          "identifiers": [],
          "drill": null
        },
        {
          "id": "overview-sources",
          "key": "sources",
          "title": "线索 / 售后 / 活动来源",
          "subtitle": "文件导入；保留业务编码",
          "x": 455,
          "y": 88,
          "w": 300,
          "h": 100,
          "status": "platform",
          "scope": "业务来源",
          "refs": [
            "API-326"
          ],
          "role": "用业务来源归类表示上游数据，不指定尚未确认的 CRM、DMS 或其他系统产品。",
          "inputs": [],
          "outputs": [
            "客户号码、业务来源、业务编码、导入批次"
          ],
          "rules": [
            "当前关系为文件导入；未定义自动查询、工单创建或结果回写接口。"
          ],
          "identifiers": [],
          "drill": null
        },
        {
          "id": "overview-shared",
          "key": "shared",
          "title": "统一身份与租户权限",
          "subtitle": "账号目录 · 租户 · 角色 · 授权",
          "x": 60,
          "y": 343,
          "w": 260,
          "h": 108,
          "status": "platform",
          "scope": "本方设计",
          "refs": [
            "API-326"
          ],
          "role": "平台统一管理人员、租户、角色、功能与数据范围，维护供应商账号和坐席映射。",
          "inputs": [],
          "outputs": [
            "已核验的用户、租户、供应商账号及坐席上下文"
          ],
          "rules": [
            "enterpriseId 为供应商账号 ID；UUID 不参与接口。",
            "每个enterpriseId只关联0或1个总部/门店业务租户，内置超级租户不计入；每个业务租户仍只关联一个AliCti账号。tenantId与enterpriseId分别保留，平台登录账号仍可按成员授权加入多个租户。总部7522240与门店7522241属于同一品牌，但资源和业务数据按各自账号及租户隔离。",
            "D-036 / D-037：当前本地账号目录仅超管维护；已登记账号与总部/门店关联，生产凭据保管和供应商调用另由适配层承担。",
            "D-068：enterpriseId仅0或1个业务租户，内置超级租户除外；队列、多技能关系与租户权限继续由本方维护。",
            "每个enterpriseId只关联0或1个总部/门店业务租户，内置超级租户不计入；每个业务租户仍只关联一个AliCti账号。tenantId与enterpriseId分别保留，平台登录账号仍可按成员授权加入多个租户。总部7522240与门店7522241属于同一品牌，但资源和业务数据按各自账号及租户隔离。"
          ],
          "identifiers": [
            "平台账号",
            "租户 ID",
            "enterpriseId",
            "cno"
          ],
          "drill": "platform",
          "relatedDecisionIds": [],
          "decisionId": "D-068",
          "sourceRefs": [
            "SRC-098"
          ],
          "sourceType": "user_product_confirmation"
        },
        {
          "id": "overview-business",
          "key": "business",
          "title": "云外呼业务域",
          "subtitle": "客户 · 任务 · 工作台 · 记录 · 报表",
          "x": 455,
          "y": 343,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "本方设计",
          "refs": [
            "API-305",
            "API-311",
            "API-312",
            "API-317",
            "API-318",
            "API-319",
            "API-326"
          ],
          "role": "编排客户导入、分配、外呼任务、坐席操作、通话记录和统计。",
          "inputs": [
            "当前租户权限与客户批次"
          ],
          "outputs": [
            "呼叫意图、任务操作、业务记录、统计视图"
          ],
          "rules": [
            "业务状态、供应商任务状态、实时会话状态和号码识别结果分别保留。",
            "D-054 / SRC-084：呼入号码识别一般针对被呼叫的坐席绑定手机号，软电话大概率识别不到，并非绝对不支持。本项目按API-319响应status（人工接听、人工未接听、系统应答、系统未应答）展示接听结果；查询statuses数字1–4与响应值分开。识别只保留为可选补充，不用于判断来电客户号码状态或接听，不把坐席手机号未接识别成客户空号/停机；缺失识别不阻断呼入记录和报表。status缺失、非法或与时间证据冲突仍按原规则核对。sipCauseAsyncUpdateFlag只适用于预测话单；CF-13仅余自动外呼准确识别字段及编码对应。"
          ],
          "identifiers": [],
          "drill": "platform",
          "relatedDecisionIds": [],
          "decisionId": "D-054",
          "sourceRefs": [
            "SRC-084"
          ],
          "sourceType": "user_relayed_supplier_feedback"
        },
        {
          "id": "overview-browser",
          "key": "browser",
          "title": "浏览器通话桥接",
          "subtitle": "CTILink / WebRTC",
          "x": 60,
          "y": 620,
          "w": 280,
          "h": 108,
          "status": "platform",
          "scope": "本方设计",
          "refs": [
            "API-302",
            "API-303",
            "API-304",
            "API-305",
            "API-306"
          ],
          "role": "在坐席浏览器初始化工具条、取得短期登录材料、控制会话并感知媒体状态。",
          "inputs": [
            "平台核验后签发的短期登录材料",
            "用户明确发起的电话操作"
          ],
          "outputs": [
            "工具条事件、媒体就绪状态"
          ],
          "rules": [
            "浏览器直接连接供应商电话服务；语音媒体不经过本方业务 API 适配器。",
            "登录成功不等于媒体已就绪。",
            "D-052 / SRC-082（2026-09-20，user_relayed_supplier_feedback）：breakLine的code=-1为连接断开，code=0为重连成功；SDK自动最多20次重连，每次回调，超过需重新登录。平台不另建重连循环、不按回调次数推断耗尽；sipDisconnected为无参软电话中断通知，坐席需重新登录。",
            "D-052：breakLine code=0仅证明信令重连，不证明媒体可用或原通话恢复。事件绑定当前有效会话，旧会话事件不影响新登录；保留通话、草稿和未知操作保护。原型待通话及记录处理完成后可由本人主动重登，成功暂停接听并需明确恢复；这一保护不等于官方要求所有信令恢复均强制重登。CF-11仍保留跨设备互斥、异常退出清理、媒体就绪与最终状态核验，以及setOffline回执矛盾。"
          ],
          "identifiers": [],
          "drill": "adapter",
          "relatedDecisionIds": [],
          "decisionId": "D-052",
          "sourceRefs": [
            "SRC-082"
          ],
          "sourceType": "user_relayed_supplier_feedback"
        },
        {
          "id": "overview-backend",
          "key": "backend",
          "title": "后台接口适配",
          "subtitle": "签名 · 命令 · 回推 · 话单 · 媒体",
          "x": 400,
          "y": 620,
          "w": 320,
          "h": 108,
          "status": "platform",
          "scope": "本方设计",
          "refs": [
            "API-301",
            "API-307",
            "API-311",
            "API-315",
            "API-316",
            "API-317",
            "API-318",
            "API-320",
            "DOC-346"
          ],
          "role": "在服务端统一完成权限核验、接口鉴权、命令转换、结果归集与业务数据映射。",
          "inputs": [
            "平台业务指令",
            "AliCti 回执、事件、话单及媒体结果"
          ],
          "outputs": [
            "可追溯业务结果及待核对项"
          ],
          "rules": [
            "长期部门 token 仅保留服务端。",
            "接口有文档不等于边界已联调验证。"
          ],
          "identifiers": [],
          "drill": "adapter"
        },
        {
          "id": "overview-phone",
          "key": "phone",
          "title": "客户电话 / 通信线路",
          "subtitle": "号码承载与实际接续",
          "x": 850,
          "y": 620,
          "w": 260,
          "h": 108,
          "status": "pending",
          "scope": "接续边界",
          "refs": [
            "API-310",
            "API-324"
          ],
          "role": "描述客户电话与通信线路的业务接续关系。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "企业号码可查询并启停/修改外显用途；资源开通由供应商处理，完整共享路由待确认。",
            "不据此绘制供应商运营商网关或内部媒体部署。",
            "D-026：号码开通由供应商办理；从账号查询导入已有号码不代表新增远端资源，不设本地线路管理。"
          ],
          "identifiers": [],
          "drill": null
        },
        {
          "id": "overview-cti",
          "key": "cti",
          "title": "AliCti 电话能力",
          "subtitle": "坐席登录 · 会话控制 · 软电话",
          "x": 60,
          "y": 865,
          "w": 300,
          "h": 108,
          "status": "documented",
          "scope": "公开能力",
          "refs": [
            "API-302",
            "API-303",
            "API-304",
            "API-305",
            "API-306"
          ],
          "role": "公开工具条与软电话能力的逻辑集合。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "D-052已澄清SDK信令重连和软电话中断；版本、跨设备互斥、清理及媒体连通仍需真实账号验证。",
            "D-052 / SRC-082（2026-09-20，user_relayed_supplier_feedback）：breakLine的code=-1为连接断开，code=0为重连成功；SDK自动最多20次重连，每次回调，超过需重新登录。平台不另建重连循环、不按回调次数推断耗尽；sipDisconnected为无参软电话中断通知，坐席需重新登录。",
            "D-052：breakLine code=0仅证明信令重连，不证明媒体可用或原通话恢复。事件绑定当前有效会话，旧会话事件不影响新登录；保留通话、草稿和未知操作保护。原型待通话及记录处理完成后可由本人主动重登，成功暂停接听并需明确恢复；这一保护不等于官方要求所有信令恢复均强制重登。CF-11仍保留跨设备互斥、异常退出清理、媒体就绪与最终状态核验，以及setOffline回执矛盾。"
          ],
          "identifiers": [],
          "drill": "alicti",
          "relatedDecisionIds": [],
          "decisionId": "D-052",
          "sourceRefs": [
            "SRC-082"
          ],
          "sourceType": "user_relayed_supplier_feedback"
        },
        {
          "id": "overview-api",
          "key": "api",
          "title": "AliCti API 与结果能力",
          "subtitle": "资源 · 任务 · IVR · 事件 · 话单",
          "x": 450,
          "y": 865,
          "w": 330,
          "h": 108,
          "status": "documented",
          "scope": "公开能力",
          "refs": [
            "API-307",
            "API-308",
            "API-309",
            "API-310",
            "API-311",
            "API-312",
            "API-313",
            "API-314",
            "API-315",
            "API-316",
            "API-317",
            "API-318",
            "API-319",
            "API-320",
            "API-322",
            "API-323",
            "DOC-346"
          ],
          "role": "公开服务端接口及事件、话单、录音和 RASR 能力的逻辑集合。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "本视图不表示供应商内部微服务调用顺序。",
            "暂停后继续按D-017先task/get确认status=2再task/start，随后回查；结束任务不重启，真实资源与号码生命周期另行核验。",
            "D-054 / SRC-084：呼入号码识别一般针对被呼叫的坐席绑定手机号，软电话大概率识别不到，并非绝对不支持。本项目按API-319响应status（人工接听、人工未接听、系统应答、系统未应答）展示接听结果；查询statuses数字1–4与响应值分开。识别只保留为可选补充，不用于判断来电客户号码状态或接听，不把坐席手机号未接识别成客户空号/停机；缺失识别不阻断呼入记录和报表。status缺失、非法或与时间证据冲突仍按原规则核对。sipCauseAsyncUpdateFlag只适用于预测话单；CF-13仅余自动外呼准确识别字段及编码对应。"
          ],
          "identifiers": [],
          "drill": "alicti",
          "relatedDecisionIds": [],
          "decisionId": "D-054",
          "sourceRefs": [
            "SRC-084"
          ],
          "sourceType": "user_relayed_supplier_feedback"
        }
      ],
      "edges": [
        {
          "id": "overview-edge-login",
          "source": "overview-users",
          "target": "overview-shared",
          "label": "登录 / 选择租户",
          "points": [
            [
              190,
              188
            ],
            [
              190,
              343
            ]
          ],
          "lx": 190,
          "ly": 244,
          "status": "platform",
          "refs": [
            "API-326"
          ],
          "detail": "由平台识别人员身份、角色和租户访问范围。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "overview-edge-import",
          "source": "overview-sources",
          "target": "overview-business",
          "label": "文件导入客户批次",
          "points": [
            [
              605,
              188
            ],
            [
              605,
              343
            ]
          ],
          "lx": 605,
          "ly": 244,
          "status": "platform",
          "refs": [
            "API-326"
          ],
          "detail": "按业务来源与编码保存批次及客户，不假设上游自动回写接口。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "overview-edge-authorize",
          "source": "overview-shared",
          "target": "overview-business",
          "label": "上下文授权",
          "points": [
            [
              320,
              397
            ],
            [
              455,
              397
            ]
          ],
          "lx": 387,
          "ly": 382,
          "status": "platform",
          "refs": [
            "API-326"
          ],
          "detail": "功能权限、数据范围与供应商资源映射共同约束业务操作。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "overview-edge-ui-phone",
          "source": "overview-business",
          "target": "overview-browser",
          "label": "坐席会话操作",
          "points": [
            [
              530,
              451
            ],
            [
              530,
              572
            ],
            [
              200,
              572
            ],
            [
              200,
              620
            ]
          ],
          "lx": 372,
          "ly": 572,
          "status": "platform",
          "refs": [
            "API-303",
            "API-305",
            "API-306"
          ],
          "detail": "工作台通过浏览器桥接层触发工具条操作，并独立处理媒体准备状态。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "overview-edge-ui-api",
          "source": "overview-business",
          "target": "overview-backend",
          "label": "任务 / 资源 / 结果",
          "points": [
            [
              660,
              451
            ],
            [
              660,
              620
            ]
          ],
          "lx": 660,
          "ly": 572,
          "status": "platform",
          "refs": [
            "API-307",
            "API-311",
            "API-315",
            "API-317"
          ],
          "detail": "业务意图进入后台适配器，核验权限后调用对应接口。",
          "rules": [],
          "bidirectional": true
        },
        {
          "id": "overview-edge-sdk",
          "source": "overview-browser",
          "target": "overview-cti",
          "label": "工具条信令 / 软电话媒体",
          "points": [
            [
              200,
              728
            ],
            [
              200,
              865
            ]
          ],
          "lx": 200,
          "ly": 783,
          "status": "documented",
          "refs": [
            "API-302",
            "API-303",
            "API-304",
            "API-305",
            "API-306"
          ],
          "detail": "浏览器与 AliCti 电话能力建立连接；不能将平台登录成功视作媒体连通。",
          "rules": [
            "D-052 / SRC-082（2026-09-20，user_relayed_supplier_feedback）：breakLine的code=-1为连接断开，code=0为重连成功；SDK自动最多20次重连，每次回调，超过需重新登录。平台不另建重连循环、不按回调次数推断耗尽；sipDisconnected为无参软电话中断通知，坐席需重新登录。",
            "D-052：breakLine code=0仅证明信令重连，不证明媒体可用或原通话恢复。事件绑定当前有效会话，旧会话事件不影响新登录；保留通话、草稿和未知操作保护。原型待通话及记录处理完成后可由本人主动重登，成功暂停接听并需明确恢复；这一保护不等于官方要求所有信令恢复均强制重登。CF-11仍保留跨设备互斥、异常退出清理、媒体就绪与最终状态核验，以及setOffline回执矛盾。"
          ],
          "bidirectional": true,
          "relatedDecisionIds": [],
          "decisionId": "D-052",
          "sourceRefs": [
            "SRC-082"
          ],
          "sourceType": "user_relayed_supplier_feedback"
        },
        {
          "id": "overview-edge-server",
          "source": "overview-backend",
          "target": "overview-api",
          "label": "命令请求 ⇄ 事件 / 话单 / 媒体",
          "points": [
            [
              575,
              728
            ],
            [
              575,
              865
            ]
          ],
          "lx": 575,
          "ly": 783,
          "status": "documented",
          "refs": [
            "API-307",
            "API-308",
            "API-309",
            "API-310",
            "API-311",
            "API-312",
            "API-313",
            "API-314",
            "API-315",
            "API-316",
            "API-317",
            "API-318",
            "API-319",
            "API-320",
            "API-321",
            "API-322",
            "API-323"
          ],
          "detail": "后台按接口分别适配命令请求、异步回推与结果查询，不把这些结果合并为单一完成信号。",
          "rules": [
            "D-054 / SRC-084：呼入号码识别一般针对被呼叫的坐席绑定手机号，软电话大概率识别不到，并非绝对不支持。本项目按API-319响应status（人工接听、人工未接听、系统应答、系统未应答）展示接听结果；查询statuses数字1–4与响应值分开。识别只保留为可选补充，不用于判断来电客户号码状态或接听，不把坐席手机号未接识别成客户空号/停机；缺失识别不阻断呼入记录和报表。status缺失、非法或与时间证据冲突仍按原规则核对。sipCauseAsyncUpdateFlag只适用于预测话单；CF-13仅余自动外呼准确识别字段及编码对应。"
          ],
          "bidirectional": true,
          "relatedDecisionIds": [],
          "decisionId": "D-054",
          "sourceRefs": [
            "SRC-084"
          ],
          "sourceType": "user_relayed_supplier_feedback"
        },
        {
          "id": "overview-edge-line",
          "source": "overview-cti",
          "target": "overview-phone",
          "label": "线路承载 / 呼入路由",
          "points": [
            [
              360,
              919
            ],
            [
              410,
              919
            ],
            [
              410,
              990
            ],
            [
              1130,
              990
            ],
            [
              1130,
              674
            ],
            [
              1110,
              674
            ]
          ],
          "lx": 920,
          "ly": 990,
          "status": "pending",
          "refs": [
            "API-310",
            "API-324"
          ],
          "detail": "号码可查询并按batchUpdateNumber启停/改外显用途；开通与归属走供应商资源流程，呼入路由CRUD已按D-024采用；条件匹配与归属保留CF-10；D-048取消供应商账号解绑需求，本地控制后续外呼使用。",
          "rules": [
            "D-048 / SRC-078（user_relayed_supplier_feedback_and_scope_decision）：供应商号码停用后后续选号不再使用该号码，已发起通话正常继续。用户取消供应商账号解绑接口及查证需求，改为本地停用后不再使用该号码外呼；本地开关不解除供应商资源、不停止呼入路由、不强制挂断，历史保留。"
          ],
          "bidirectional": true,
          "decisionId": "D-048",
          "sourceRefs": [
            "SRC-078"
          ],
          "sourceType": "user_relayed_supplier_feedback_and_scope_decision"
        }
      ]
    },
    {
      "id": "platform",
      "name": "平台系统与模块",
      "short": "平台模块",
      "subtitle": "按本方职责组织身份、业务、结果和接口适配模块。",
      "width": 1200,
      "height": 3250,
      "groups": [
        {
          "name": "共享平台 · 身份、租户与资源上下文",
          "x": 30,
          "y": 25,
          "w": 1130,
          "h": 210,
          "tone": "platform",
          "note": ""
        },
        {
          "name": "云外呼业务 · 客户到呼叫执行",
          "x": 30,
          "y": 290,
          "w": 1130,
          "h": 210,
          "tone": "platform",
          "note": ""
        },
        {
          "name": "云外呼结果与资源管理",
          "x": 30,
          "y": 555,
          "w": 1130,
          "h": 210,
          "tone": "platform",
          "note": ""
        },
        {
          "name": "平台支撑",
          "x": 30,
          "y": 820,
          "w": 1130,
          "h": 210,
          "tone": "platform",
          "note": ""
        },
        {
          "name": "呼入配置与客户资料",
          "x": 30,
          "y": 1120,
          "w": 1130,
          "h": 190,
          "tone": "platform",
          "note": ""
        },
        {
          "name": "本人工作台、来电接听与再次联系",
          "x": 30,
          "y": 1380,
          "w": 1130,
          "h": 230,
          "tone": "platform",
          "note": ""
        },
        {
          "name": "AliCti 账号维护 · 当前原型",
          "x": 30,
          "y": 1650,
          "w": 1130,
          "h": 210,
          "tone": "platform",
          "note": ""
        },
        {
          "name": "接听队列与预测分配 · 当前原型",
          "x": 30,
          "y": 1910,
          "w": 1130,
          "h": 225,
          "tone": "platform",
          "note": ""
        },
        {
          "name": "本人坐席运行与独立班长权限",
          "x": 30,
          "y": 2180,
          "w": 1130,
          "h": 225,
          "tone": "platform",
          "note": "D-042 · 电话接待状态与业务保存分别处理；原型仅本地模拟"
        },
        {
          "name": "外呼组与技能提交 · 当前原型",
          "x": 30,
          "y": 2450,
          "w": 1130,
          "h": 220,
          "tone": "platform",
          "note": ""
        },
        {
          "name": "号码授权与软电话分机 · 当前原型",
          "x": 30,
          "y": 2720,
          "w": 1130,
          "h": 230,
          "tone": "platform",
          "note": ""
        },
        {
          "name": "可维护业务字典与独立资源目录",
          "x": 30,
          "y": 3000,
          "w": 1130,
          "h": 215,
          "tone": "platform",
          "note": "当前配置 → 导入与通话；目录资源 → 登录与任务；权限和字段均区分本方与供应商"
        }
      ],
      "nodes": [
        {
          "id": "platform-identity",
          "key": "identity",
          "title": "平台账号与租户",
          "subtitle": "总部 / 门店成员 · 租户切换",
          "x": 60,
          "y": 100,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "本方设计",
          "refs": [
            "API-326"
          ],
          "role": "管理平台账号和当前租户，形成业务访问的起点。",
          "inputs": [],
          "outputs": [
            "人员、组织与当前租户上下文"
          ],
          "rules": [
            "平台账号不是 enterpriseId；租户也不是供应商实例。"
          ],
          "identifiers": [],
          "drill": null
        },
        {
          "id": "platform-permissions",
          "key": "permissions",
          "title": "角色与数据权限",
          "subtitle": "菜单 · 操作 · 数据范围",
          "x": 445,
          "y": 100,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "本方设计",
          "refs": [
            "API-326"
          ],
          "role": "统一核验功能权限和数据范围，限制客户、任务、记录与资源访问。",
          "inputs": [
            "平台身份与租户"
          ],
          "outputs": [
            "已授权操作范围"
          ],
          "rules": [
            "同一供应商账号下仍需逐租户隔离。",
            "后台须再次校验；隐藏菜单不构成权限边界。"
          ],
          "identifiers": [],
          "drill": null
        },
        {
          "id": "platform-context",
          "key": "context",
          "title": "供应商账号与坐席映射",
          "subtitle": "enterpriseId + cno + 平台授权",
          "x": 830,
          "y": 100,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "本方设计",
          "refs": [
            "API-301",
            "API-302",
            "API-326"
          ],
          "role": "维护平台租户、供应商账号、人员和坐席之间的明确映射。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "enterpriseId 是供应商账号 ID。UUID 不参与接口。",
            "D-014：cno全链路String，鉴权与登录完整一致；0012与12是不同工号。",
            "D-036 / D-037：账号目录先于租户快照恢复；账号 ID 与品牌固定，展示名称可修改。空账号与全部停用账号均保留超管配置或恢复路径。",
            "D-050 / SRC-080（user_relayed_supplier_feedback）：坐席按主键物理删除；工号只在当前仍存在的坐席中唯一。重建同工号为新坐席，生成新id/createTime，旧技能、队列成员、绑定电话清除。当前身份与本地配置不可仅凭相同cno自动继承；本次不迁移历史数据。",
            "D-050 / SRC-080：供应商话单只记cno、不记坐席主键；删除不清除历史话单，按cno查询或报表会合并新旧通话。仅凭话单不能精确拆分同工号的新旧坐席身份，不将旧记录改写归属新坐席。",
            "D-051 / SRC-081（2026-09-20，user_relayed_supplier_feedback）：success为主记录建成数，other为其中技能绑定失败子集，不与success相加；fail与success互斥。cnos含全部已建成工号（含other），申请工号区间减去cnos为未建成工号。未传skillIds时other=0；对cnos逐项queryAgentSkill，缺少目标skillId可定位other，查询本身不证明主记录新建。",
            "D-051 / SRC-081：创建结果未知时，agent/query按原cnos读取id/createTime，可使用startTime/endTime；新id且createTime处于本次请求窗口才证实本次主记录。agent/get与queryCnoAndName只证存在，queryAgentSkill只证技能。查询证据不足继续未知，不自动重放写入。CF-08已关闭，不意味着生产接口已联调。",
            "每个enterpriseId只关联0或1个总部/门店业务租户，内置超级租户不计入；每个业务租户仍只关联一个AliCti账号。tenantId与enterpriseId分别保留，平台登录账号仍可按成员授权加入多个租户。总部7522240与门店7522241属于同一品牌，但资源和业务数据按各自账号及租户隔离。"
          ],
          "identifiers": [
            "平台账号",
            "租户 ID",
            "enterpriseId",
            "cno"
          ],
          "drill": null,
          "relatedDecisionIds": [
            "D-050",
            "D-051"
          ],
          "decisionId": "D-068",
          "sourceRefs": [
            "SRC-080",
            "SRC-081",
            "SRC-098"
          ],
          "sourceType": "user_product_confirmation"
        },
        {
          "id": "platform-customers",
          "key": "customers",
          "title": "客户与导入批次",
          "subtitle": "业务来源 · 编码 · 分配 · 归档",
          "x": 60,
          "y": 365,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "本方设计",
          "refs": [
            "API-312",
            "API-326"
          ],
          "role": "导入线索、售后、活动客户，建立批次、业务编码与跟进归属。",
          "inputs": [],
          "outputs": [
            "任务号码及本方客户关联关系"
          ],
          "rules": [
            "供应商 task 去重不等于平台客户或业务批次去重。",
            "导入文件是当前上游衔接方式。",
            "D-025客户业务快照独立于原批次单据；档案逐项汇总最近可见非空值。",
            "D-085：客户管理仅设业务分类菜单，同页维护分类和独立字段库；取消业务模板。分类在 enterpriseId + tenantId 内以有序fields数组直接引用稳定fieldId，每项包含enabled、required，数组位置决定顺序。分类可零字段，线索分类须直接含六项预置统计字段；不同分类可共用字段定义但各自配置显示与必填。导入采用启用分类，通话按分类字段加载；草稿可空，正式保存校验。原型不迁移旧模板。字段/选项选填businessKey仅作本地外部映射，不替代内部ID、不发送AliCti。",
            "D-063 / SRC-093：客户列表不固定显示线索/意向列；详情按当前业务分类和单据展示字段。导入与分配记录只读，不嵌套查看批次；批次维护从独立菜单进入。档案证据不足显示结果未知，不改底层状态与识别编码。"
          ],
          "identifiers": [],
          "drill": null
        },
        {
          "id": "platform-tasks",
          "key": "tasks",
          "title": "任务编排与运行管理",
          "subtitle": "预测外呼 / 自动外呼",
          "x": 445,
          "y": 365,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "本方设计",
          "refs": [
            "API-311",
            "API-312",
            "API-313",
            "API-314",
            "API-325"
          ],
          "role": "管理任务配置、号码导入、暂停和结束意图，保留业务状态及供应商结果。",
          "inputs": [
            "客户批次、已授权坐席 / 技能和号码"
          ],
          "outputs": [
            "taskId 映射、任务指令及待核对结果"
          ],
          "rules": [
            "启动使用task/start，继续前先task/get确认当前status=2；同一taskId再start并回查。D-021用户确认：暂停后可继续，确认status=3不重启且不再发起后续首次呼叫或重呼。暂停不传pauseDuration。",
            "手动或定时按用户配置；启动前核验资源和坐席范围。两类任务开启重呼都必选呼叫状态并填写次数、间隔、计时依据；D-020供应商反馈预测同样支持按状态重呼，两类均映射一组sipCause，由阿里执行；关闭省略重呼字段和templateName，按不启用处理。",
            "D-041：预测任务独立String callStrategy1–4，新建4，缺字段须重新选择；队列策略或优先级不覆盖该字段，自动IVR不提交。",
            "预测任务名单支持列表直接文件导入，经字段映射、预检、确认及task/import；自动外呼仍走导入与分配。导入不自动启动。",
            "接听范围可选指定坐席callGroupType=1/cnos或独立外呼组callGroupType=2/agentGroup；外呼组不是技能组或接听队列。",
            "人工、预测及自动外呼的外显号码独立按账号、租户授权、服务状态、方向和具体外显用途核验；不要求号码绑定所选技能或坐席。",
            "D-046 / SRC-076：号码当前按D-068自动归属唯一业务租户；本地软电话分机管理保留；旧号码—技能—坐席绑定不再采用，其他历史规则与公开接口原字段含义保持独立。",
            "D-047 / SRC-077（user_relayed_supplier_feedback）：暂停或结束只控制任务调度，未发起的首次呼叫和重呼不再发起；已发起的拨号、振铃和通话正常进行，正常话单继续归集。暂停可按get确认2→start→get继续；结束不重开，正常结果仅回补原历史与统计。本次为用户转述供应商答复，不代表官网更新或真实联调通过。",
            "D-060：新预测任务autoComplete=0，名单耗尽暂停；自动外呼为1。再次预外呼保持原taskId，importTaskTel仅追加新批次，isRepeat=0、importTelAutoStart=0；原任务已结束不重开。",
            "任务关联本租户可呼叫及禁呼时间条件；autoTaskType=1须选允许条件，autoTriggerTimeStrategy和timeStrategy以逗号连接ID，不能重复用于允许与禁止。草稿、模板、复制与启动/继续复检；原任务再次联系沿用现有条件，按需配置结束时间。",
            "本方只维护配置和引用保护，不实现本地时间调度；实际执行由供应商任务处理。",
            "任务向导的重呼配置未填完整时，仍可保存草稿、关闭或返回，保留已填和空值；下一步及确认创建时再严格校验必选呼叫状态、次数、间隔与计时依据，不因草稿未填全而阻断退出。",
            "D-064 / SRC-094：任务列表不展示内部配置名、版本或后续重呼。retryStrategy是规则，finishRetryFlag/telRetryRound只描述单条话单；不能据此推断任务后续安排，原任务待再次联系保留。",
            "D-073 / D-075：预外呼与自动外呼的创建确认、当前任务设置和查看管理共用本任务保存的名称、描述、供应商业务标签及通用配置；通话详情关联摘要只读。有原供应商taskId、权限有效、未结束且无待核对结果时，任务中心可见编辑名称、描述和业务标签等已采用且API-404列明的字段；只提交实际修改，DOC-334回查成功后更新当前配置与planSnapshot，并将编辑前设置副本写入taskSettingHistory。失败/未知保留原配置和输入，不回写已发生通话与客户记录。任务级语音流程名称优先本任务冻结快照，既有customerTimeout缺失显示未记录，新建默认30秒不反填历史。type、callGroupType、名单/排重和固定外显号不可改；自动任务不提交预测专用字段。API-404的ivrId/ivrName行与仅type=1生效章节冲突，已建type=2 IVR只读并列CF-17待供应商确认。运行中生效与省略字段语义待联调，复制新草稿仍可用。",
            "超级管理员（SUPER）在既有AliCti账号编辑的“外显导航”区维护callerNavigations:[{name,customerClidsGroup}]，可登记多个已存在AliCti导航；每行名称和标识必填，标识同账号唯一，不设置本地数量上限，不新增菜单或实体模块。目录是本地登记，移除条目不等于远端删除或停用。旧instance.customerClidsGroup单值仅在读取时兼容为一条，不自动重写；没有目录不推造候选。创建、草稿及复制的导航候选仅取当前账号目录，下拉显式单选一个，无自动首项默认。新提交前复核所选标识仍在目录，被移除须重选；名称改名不阻断，旧草稿有标识但无名称时只从匹配候选补名称。切换到另一个导航清空原clidPoolList，保留customerTimeout。现有官方材料只说明单次任务传一个导航标识，未确认同enterpriseId的导航数量上限或账号内查询接口；本地多行登记是D-070产品修正，不冒充供应商答复。目录移除不等于远端删除或停用，CF-15继续未决。",
            "D-078：任务创建与更新无任务级指定号码字段。导航字段在接口中可选；两类新建任务按本原型产品规则必选当前账号已有外显导航，task/create传customerClidsCategory=5、单个customerClidsGroup、可选clidPoolList及customerTimeout；API-312的taskTelList[].clid仅逐客户显式提供时可选，不从任务或批次设置推导。",
            "任务保存导航名称及标识、号码池和等待时间快照；callerNavigationName仅作本地名称快照、不传API，task/create仍只传单个String customerClidsGroup。账号目录改名或移除不回填已保存任务快照，也不覆写草稿及复制已有的名称；已创建任务和原任务再次联系保留快照及原taskId。创建确认、任务设置及复制采用一致字段；草稿和复制在新提交时复核当前账号目录，已移除标识须重选。通话详情仅展示话单实际外显号码，不能用池名称或本地挑选结果冒充供应商选号事实。",
            "号码池名称来自当前租户关联enterpriseId的AliCti hybridGroup/list；租户管理员可通过hybridGroup/create、delete、update维护本租户号码池，不把本地号码列表当成池。任务从本租户列表选池名，priority手动选填整数且数值越小越优先，留空省略。空池、同优先级选号和运行任务变更生效时点仍待CF-15确认，不承诺失败自动切池。本地停用仅能约束本地直接选号，不能保证AliCti外显导航号码池排除该号码；全局阻断须经供应商停用或排除机制核验。既有通话正常继续；此边界不增加异常入口。",
            "同一enterpriseId可登记多个AliCti线下提供的外显导航，一个导航可配合多个号码池。两类任务创建时从当前账号目录显式选择一个，提交customerClidsCategory=5及单个customerClidsGroup，可选多个clidPoolList。API-311/API-404只证明单次任务字段；导航查询、标识有效性与号码池选号见CF-15联调。",
            "预测任务minAvailableAgentCount默认10、范围1–10，任务内可用座席数低于阈值自动暂停。只有autoStart=1且确因座席不足暂停，人数恢复达阈值时自动启动；手工暂停、号码停用保护暂停、结束不恢复。自动外呼不配置该字段。API-311/API-404仅证明阈值、定时字段和不足自动暂停；恢复行为为用户转述，CF-18待真实联调。",
            "已建任务保留原customerClidsGroup及号码池快照。启动/继续时如所选导航已从当前账号目录移除，先阻断，再从原任务编辑以API-404 task/update提交新标识，经DOC-334 task/get回查同一taskId及可读值后启动。任务中心座席人数变化入口只作本地演示，不读取实时人数或执行供应商任务操作。"
          ],
          "identifiers": [],
          "drill": null,
          "decisionId": "D-086",
          "sourceRefs": [
            "SRC-076",
            "SRC-077",
            "SRC-099",
            "SRC-100",
            "SRC-108",
            "SRC-109",
            "SRC-114"
          ],
          "relatedDecisionIds": [
            "D-046",
            "D-017",
            "D-021",
            "D-069",
            "D-070",
            "D-078",
            "D-081",
            "D-086"
          ],
          "sourceType": "user_relayed_supplier_feedback"
        },
        {
          "id": "platform-workbench",
          "key": "workbench",
          "title": "电话工具条与客户记录",
          "subtitle": "顶部话务控制 · 右侧填写",
          "x": 830,
          "y": 365,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "本方设计",
          "refs": [
            "API-302",
            "API-303",
            "API-304",
            "API-305",
            "API-306",
            "API-319"
          ],
          "role": "向坐席提供登录、电话操作及通话中填写；每项输入暂存本标签草稿，结束后确认保存业务记录。",
          "inputs": [
            "授权坐席与客户 / 任务上下文"
          ],
          "outputs": [
            "电话操作及本方业务小结"
          ],
          "rules": [
            "当前用户对 cno 的使用权限先经平台核验。",
            "呼入按可信账号及唯一业务租户映射核验，仍需通话/坐席身份与对象权限一致；未知或冲突不得写入。",
            "D-038 / SRC-070 / G-36–G-43 / FA-107–FA-113、FA-135、FA-142：人工外呼从dialing/ringing即可填写，来电须匹配人工接通后connected才可填写；草稿与电话状态独立，wrap才正式保存。",
            "草稿在本标签sessionStorage按平台账号和租户隔离并核验enterpriseId/原通话；暂存不写入正式档案或报表，不向AliCti提交。",
            "收起、通话事件与挂断保留输入。刷新演示中断仅恢复草稿到待确认，不恢复真实话路；正式保存失败保留输入及占用。",
            "D-026：号码先通过NumberGrant及具体呼叫方式校验，人工外呼将本通自动所选号码传previewOutcall.obClid；bindTel是坐席接听设备。",
            "号码租户授权不代表电话上线、号码开通或呼入路由生效，也不扩大客户数据访问权限。技能与接听队列按其自身关系分配接听，预测任务另用指定坐席或外呼组。",
            "D-042：新增本人电话操作CAP-SEAT-01～09，SC/SEQ-220/221。presence与phase分开，保存业务成功后自动unpause，匹配回执成功才ready；电话失败不回滚业务。",
            "外呼坐席与班长监控采用页签，切换不丢通话和记录草稿；本租户管理员未关联本人坐席也能进入班长监控查看只读内容，电话上线与队列管理另验关联坐席。",
            "人工外呼不手选技能和外显号码，平台按当前账号、租户授权、本地及供应商启停、完整号码和预览用途自动选号。",
            "D-046 / SRC-076：号码当前按D-068自动归属唯一业务租户；本地软电话分机管理保留；旧号码—技能—坐席绑定不再采用，其他历史规则与公开接口原字段含义保持独立。",
            "D-052 / SRC-082（2026-09-20，user_relayed_supplier_feedback）：breakLine的code=-1为连接断开，code=0为重连成功；SDK自动最多20次重连，每次回调，超过需重新登录。平台不另建重连循环、不按回调次数推断耗尽；sipDisconnected为无参软电话中断通知，坐席需重新登录。",
            "D-052：breakLine code=0仅证明信令重连，不证明媒体可用或原通话恢复。事件绑定当前有效会话，旧会话事件不影响新登录；保留通话、草稿和未知操作保护。原型待通话及记录处理完成后可由本人主动重登，成功暂停接听并需明确恢复；这一保护不等于官方要求所有信令恢复均强制重登。CF-11仍保留跨设备互斥、异常退出清理、媒体就绪与最终状态核验，以及setOffline回执矛盾。",
            "D-054 / SRC-084：呼入号码识别一般针对被呼叫的坐席绑定手机号，软电话大概率识别不到，并非绝对不支持。本项目按API-319响应status（人工接听、人工未接听、系统应答、系统未应答）展示接听结果；查询statuses数字1–4与响应值分开。识别只保留为可选补充，不用于判断来电客户号码状态或接听，不把坐席手机号未接识别成客户空号/停机；缺失识别不阻断呼入记录和报表。status缺失、非法或与时间证据冲突仍按原规则核对。sipCauseAsyncUpdateFlag只适用于预测话单；CF-13仅余自动外呼准确识别字段及编码对应。",
            "顶部电话工具条统一登录/退出、置忙/置闲、拨号、接听、静音、挂断及延长整理，并直接显示工作模式下拉（D-071）；右侧非模态记录面板支持边通话边填写。切页收起保留草稿；本轮不提供拒接或内部呼叫。",
            "D-085：客户管理仅设业务分类菜单，同页维护分类和独立字段库；取消业务模板。分类在 enterpriseId + tenantId 内以有序fields数组直接引用稳定fieldId，每项包含enabled、required，数组位置决定顺序。分类可零字段，线索分类须直接含六项预置统计字段；不同分类可共用字段定义但各自配置显示与必填。导入采用启用分类，通话按分类字段加载；草稿可空，正式保存校验。原型不迁移旧模板。字段/选项选填businessKey仅作本地外部映射，不替代内部ID、不发送AliCti。",
            "正式记录保存成功且业务phase=idle后自动unpause；成功才ready。失败保留已存业务可重试，未知先核对不重放，确认ready且无未完成通话和连接异常后解除保护。",
            "人工拨号自动选择本租户有完整号码、授权及用途有效、本地与供应商均允许的外显号码；不再手选技能或号码。无可用号码提示管理员；预外呼/自动任务仍由任务配置选号。",
            "D-072：每次普通坐席登录均直接打开一次性登录面板；工作模式初始“请选择”，本人必须选0预览与预测同时、4预览外呼或5预测外呼；登录状态默认置闲，可改置忙并选填原因。点击“登录”直接提交login，取消不发请求，失败保留本次输入供重试；不先保存登录设置或沿用上次模式。断线重登是独立流程，沿用当前会话模式及暂停状态。",
            "D-071：登录后工具条直接显示工作模式下拉，在线即时调用CTILink.Agent.changeWorkingMode；置忙可切，通话、振铃、话后整理及未知结果期间拒绝。登录置忙后禁用主动预览外呼，须先置闲；模式4不接受预测分配，模式5禁用预览外呼。呼入与模式关系仍见CF-16。",
            "坐席工作台一级页签为“外呼坐席／班长监控”；班长监控内二级页签为“监控概览／坐席事件日志”。本租户ADMIN未关联本人坐席或未上线仍可只读查看今日已结束外呼统计、授权坐席当前状态与已有事件日志；切换页签保留本人通话和记录草稿。"
          ],
          "identifiers": [],
          "drill": null,
          "decisionId": "D-082",
          "sourceRefs": [
            "SRC-076",
            "SRC-082",
            "SRC-084",
            "SRC-101",
            "SRC-102",
            "SRC-110"
          ],
          "relatedDecisionIds": [
            "D-046",
            "D-052",
            "D-071",
            "D-072",
            "D-054",
            "D-080"
          ],
          "sourceType": "user_product_requirement_and_existing_interface_review"
        },
        {
          "id": "platform-reports",
          "key": "reports",
          "title": "统计与运营视图",
          "subtitle": "七类视图 · 含线索成效",
          "x": 60,
          "y": 630,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "本方设计",
          "refs": [
            "API-317",
            "API-318",
            "API-319",
            "API-326"
          ],
          "role": "在已授权数据范围内汇总七类运营视图；线索按同品牌账号原编码合并，任务使用独立供应商累计。",
          "inputs": [
            "分类规范化的话单与本方业务记录"
          ],
          "outputs": [],
          "rules": [
            "客户接听、坐席接通与号码识别结果使用各自证据，不能混算。",
            "IVR 应答不等同人工坐席接听。",
            "D-050 / SRC-080：供应商话单只记cno、不记坐席主键；删除不清除历史话单，按cno查询或报表会合并新旧通话。仅凭话单不能精确拆分同工号的新旧坐席身份，不将旧记录改写归属新坐席。",
            "D-053 / SRC-083（2026-09-20）：预测外呼话单sipCauseAsyncUpdateFlag=1表示号码识别结果已异步写回本通sipCause，0表示同步；不是通话状态、等待中或识别必成功标志。识别依据电话提示音，可能无法识别；彩铃等场景可能补偿识别，约延迟1–2分钟，仅为经验范围，不是固定完成时限。迟到结果按账号及原通话键补充原sipCause，保留原始值和来源，不新增通话、不由本地触发重呼。 CF-13当前剩余范围按D-054仅保留自动外呼准确识别字段及编码对应。",
            "D-054 / SRC-084：呼入号码识别一般针对被呼叫的坐席绑定手机号，软电话大概率识别不到，并非绝对不支持。本项目按API-319响应status（人工接听、人工未接听、系统应答、系统未应答）展示接听结果；查询statuses数字1–4与响应值分开。识别只保留为可选补充，不用于判断来电客户号码状态或接听，不把坐席手机号未接识别成客户空号/停机；缺失识别不阻断呼入记录和报表。status缺失、非法或与时间证据冲突仍按原规则核对。sipCauseAsyncUpdateFlag只适用于预测话单；CF-13仅余自动外呼准确识别字段及编码对应。"
          ],
          "identifiers": [],
          "drill": null,
          "relatedDecisionIds": [
            "D-050",
            "D-053"
          ],
          "decisionId": "D-054",
          "sourceRefs": [
            "SRC-080",
            "SRC-083",
            "SRC-084"
          ],
          "sourceType": "user_relayed_supplier_feedback"
        },
        {
          "id": "platform-records",
          "key": "records",
          "title": "通话记录与媒体",
          "subtitle": "四类通话 · 原任务设置 · 录音文本",
          "x": 445,
          "y": 630,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "本方设计",
          "refs": [
            "API-317",
            "API-318",
            "API-319",
            "API-320",
            "DOC-346",
            "API-327",
            "API-362"
          ],
          "role": "统一呈现分类话单事实、客户业务信息及明确关联的原任务只读设置；录音和RASR分别展示。",
          "inputs": [],
          "outputs": [
            "通话详情、号码状态、媒体查看入口"
          ],
          "rules": [
            "号码状态直接复用官方字典；715、183 不唯一时待确认。",
            "话单已到不代表录音或 ASR 同时就绪。",
            "D-050 / SRC-080：供应商话单只记cno、不记坐席主键；删除不清除历史话单，按cno查询或报表会合并新旧通话。仅凭话单不能精确拆分同工号的新旧坐席身份，不将旧记录改写归属新坐席。",
            "D-054 / SRC-084：呼入号码识别一般针对被呼叫的坐席绑定手机号，软电话大概率识别不到，并非绝对不支持。本项目按API-319响应status（人工接听、人工未接听、系统应答、系统未应答）展示接听结果；查询statuses数字1–4与响应值分开。识别只保留为可选补充，不用于判断来电客户号码状态或接听，不把坐席手机号未接识别成客户空号/停机；缺失识别不阻断呼入记录和报表。status缺失、非法或与时间证据冲突仍按原规则核对。sipCauseAsyncUpdateFlag只适用于预测话单；CF-13仅余自动外呼准确识别字段及编码对应。",
            "D-085：客户管理仅设业务分类菜单，同页维护分类和独立字段库；取消业务模板。分类在 enterpriseId + tenantId 内以有序fields数组直接引用稳定fieldId，每项包含enabled、required，数组位置决定顺序。分类可零字段，线索分类须直接含六项预置统计字段；不同分类可共用字段定义但各自配置显示与必填。导入采用启用分类，通话按分类字段加载；草稿可空，正式保存校验。原型不迁移旧模板。字段/选项选填businessKey仅作本地外部映射，不替代内部ID、不发送AliCti。",
            "D-066 / SRC-096：列表、详情、任务内通话共用CloudCallRecords.display与AliCtiReportFacts，核验API-317/318/319/362类型、账号及显式供应商通话标识。接口来源对象存在时，raw或字段缺失、不合法或身份冲突不借本地接通/结束标签或时长补值；没有来源对象的纯本地演示仍可显示本地时间、工号和时长，不作为供应商事实。真实0秒保留，秒值只转换一次，按实际开始时间筛选。",
            "自动外呼显示客户接听时长，预测分别显示双方通话与客户接听时长；呼入分开系统应答、首次人工接听与首次进出队列。工号为String，实际队列只读qno/firstCallQno；cnoFlow/qnoFlow保留供应商值，不能以技能代替实际队列。",
            "关联原任务须账号、租户、通话类型、本地与供应商taskId一致；只有供应商ID时要求唯一匹配。冲突不改绑且不开放再次联系。关联任务设置在详细信息中折叠只读，使用原任务摘要；业务联系轮次与供应商重试轮次、最终呼叫标记分开。",
            "本通语音流程仅取话单ivrName/ivrId，不从任务所选流程推断。当前详情不展示虚构IVR版本、节点或本地补齐话单操作；公开ivrFlow/query能力不等于本通已取得执行节点。"
          ],
          "identifiers": [],
          "drill": null,
          "relatedDecisionIds": [
            "D-050"
          ],
          "decisionId": "D-054",
          "sourceRefs": [
            "SRC-080",
            "SRC-084"
          ],
          "sourceType": "user_relayed_supplier_feedback"
        },
        {
          "id": "platform-resources",
          "key": "resources",
          "title": "坐席 / 技能 / 号码资源",
          "subtitle": "账号号码 · 自动归属 · 独立配置",
          "x": 830,
          "y": 630,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "本方设计",
          "refs": [
            "API-307",
            "API-308",
            "API-309",
            "API-310",
            "API-322",
            "API-324"
          ],
          "role": "号码导入时默认归属当前账号唯一有效业务租户，不再提供号码租户分配或多选授权；账号无有效业务租户时阻止导入。号码详情只读展示归属和使用情况，不嵌套呼入规则、外显用途或原始属性入口。号码状态、方向及外显资格仍按已存事实校验，呼入规则在独立菜单管理。 D-081：租户管理员在号码池管理中按本租户enterpriseId查询、新增、更新和删除AliCti号码池；任务只选本租户池名。",
          "inputs": [
            "enterpriseId 资源上下文及操作权限"
          ],
          "outputs": [],
          "rules": [
            "每个enterpriseId只关联0或1个总部/门店业务租户，内置超级租户不计入；每个业务租户仍只关联一个AliCti账号。tenantId与enterpriseId分别保留，平台登录账号仍可按成员授权加入多个租户。总部7522240与门店7522241属于同一品牌，但资源和业务数据按各自账号及租户隔离。",
            "号码不与技能或坐席绑定；管理员分机、技能、队列、时间与呼入权限继续独立校验。"
          ],
          "identifiers": [
            "enterpriseId",
            "numberId（平台）",
            "authorizedTenantIds",
            "softphoneExtension（本地）"
          ],
          "drill": null,
          "decisionId": "D-068",
          "sourceRefs": [
            "SRC-076",
            "SRC-078",
            "SRC-080",
            "SRC-081",
            "SRC-098",
            "SRC-109"
          ],
          "relatedDecisionIds": [
            "D-046",
            "D-048",
            "D-050",
            "D-051",
            "D-081"
          ],
          "sourceType": "user_product_confirmation"
        },
        {
          "id": "platform-gateway",
          "key": "gateway",
          "title": "接口适配入口",
          "subtitle": "浏览器桥接 + 后台适配",
          "x": 60,
          "y": 895,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "本方设计",
          "refs": [
            "API-301",
            "API-302",
            "API-315",
            "API-316",
            "API-317",
            "API-326"
          ],
          "role": "为业务模块提供统一的供应商访问与结果归集边界。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "此处为逻辑设计，原型没有调用供应商真实接口。"
          ],
          "identifiers": [],
          "drill": "adapter"
        },
        {
          "id": "platform-audit",
          "key": "audit",
          "title": "异常核对与操作留痕",
          "subtitle": "请求 · 原始事件 · 业务关联",
          "x": 445,
          "y": 895,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "本方设计",
          "refs": [
            "API-315",
            "API-316",
            "API-325",
            "API-326"
          ],
          "role": "记录操作者、租户、原始请求和结果，集中呈现失败、不确定与待核对事项。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "本方去重不等价于供应商幂等保证。",
            "使用 task/get 核对任务状态；查询结果和原操作无法关联时保留待确认。"
          ],
          "identifiers": [],
          "drill": null
        },
        {
          "id": "platform-inbound-rules",
          "key": "inbound-rules",
          "title": "呼入规则管理",
          "subtitle": "目标 · 条件 · 优先级 · 启停",
          "x": 60,
          "y": 1180,
          "w": 300,
          "h": 108,
          "status": "documented",
          "scope": "本方设计",
          "refs": [
            "API-350",
            "API-351",
            "API-352",
            "API-353",
            "API-354"
          ],
          "role": "超管维护账号级路由，管理员只读明确本租户记录。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "目标三选一，显式active；更新以id定位，删除前确认停用。",
            "本地演示不证明真实供应商执行；匹配与归属见CF-10。"
          ],
          "identifiers": [],
          "drill": null
        },
        {
          "id": "platform-business-info",
          "key": "business-info",
          "title": "客户业务信息",
          "subtitle": "当前分类字段 · 必填校验 · 按单据入档",
          "x": 445,
          "y": 1180,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "本方设计",
          "refs": [
            "API-326"
          ],
          "role": "通话中按业务分类动态填写客户信息，正式保存到本次通话及客户档案；档案按业务分类与业务单据分别展示。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "按品牌、租户、完整号码和通话编号关联；每项取最近非空值。",
            "旧表单版本冲突不覆盖，新通话空值不擦除旧值，历史通话不复制未来填写。",
            "门店仅作目的地，不改变客户归属或访问权限。",
            "D-034 / FA-112、FA-113 / I-13、I-14、K-20、K-30、K-32：plannedStoreName 为文本，默认选填且可配置必填，不要求门店租户存在；改名/清空移除旧 plannedStoreId，仅名称未变时保留历史 ID。",
            "通话快照和客户档案逐项汇总最近可见非空值；新名称不建立门店授权，不改变原通话归属。",
            "D-085：客户管理仅设业务分类菜单，同页维护分类和独立字段库；取消业务模板。分类在 enterpriseId + tenantId 内以有序fields数组直接引用稳定fieldId，每项包含enabled、required，数组位置决定顺序。分类可零字段，线索分类须直接含六项预置统计字段；不同分类可共用字段定义但各自配置显示与必填。导入采用启用分类，通话按分类字段加载；草稿可空，正式保存校验。原型不迁移旧模板。字段/选项选填businessKey仅作本地外部映射，不替代内部ID、不发送AliCti。",
            "文本、多行、数字、单选、多选、日期、日期时间；默认选填。预置线索统计字段保留固定类型和统计含义，其他分类不能误归线索。",
            "D-063 / SRC-093：客户列表不固定显示线索/意向列；详情按当前业务分类和单据展示字段。导入与分配记录只读，不嵌套查看批次；批次维护从独立菜单进入。档案证据不足显示结果未知，不改底层状态与识别编码。"
          ],
          "identifiers": [],
          "drill": null
        },
        {
          "id": "platform-config-records",
          "key": "config-records",
          "title": "配置处理记录",
          "subtitle": "原失败 · 最新结果 · 修复历史",
          "x": 830,
          "y": 1180,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "本方设计",
          "refs": [
            "API-307",
            "DOC-342",
            "DOC-343"
          ],
          "role": "失败坐席按原因修改资料，未知技能只查看原因；保留原失败与后续处理。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "已成功记录禁止重复新增。",
            "独立配置日志与统一操作审计分别验收。",
            "D-051 / SRC-081（2026-09-20，user_relayed_supplier_feedback）：success为主记录建成数，other为其中技能绑定失败子集，不与success相加；fail与success互斥。cnos含全部已建成工号（含other），申请工号区间减去cnos为未建成工号。未传skillIds时other=0；对cnos逐项queryAgentSkill，缺少目标skillId可定位other，查询本身不证明主记录新建。",
            "D-051 / SRC-081：创建结果未知时，agent/query按原cnos读取id/createTime，可使用startTime/endTime；新id且createTime处于本次请求窗口才证实本次主记录。agent/get与queryCnoAndName只证存在，queryAgentSkill只证技能。查询证据不足继续未知，不自动重放写入。CF-08已关闭，不意味着生产接口已联调。"
          ],
          "identifiers": [],
          "drill": null,
          "relatedDecisionIds": [],
          "decisionId": "D-051",
          "sourceRefs": [
            "SRC-081"
          ],
          "sourceType": "user_relayed_supplier_feedback"
        },
        {
          "id": "platform-workbench-entry",
          "key": "workbench-entry",
          "title": "工作台身份入口",
          "subtitle": "本人关联 · 唯一入口 · 返回恢复",
          "x": 60,
          "y": 1450,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "本方设计",
          "refs": [
            "API-326"
          ],
          "role": "云联络中心租户运营按当前租户和账号下本人非删除坐席关联选择工作台。",
          "inputs": [
            "当前角色、租户、enterpriseId、本人坐席关联"
          ],
          "outputs": [
            "有关联：坐席工作台；无关联：运营工作台"
          ],
          "rules": [
            "D-031 / FA-143 / F-23：离线或临时停用不改变坐席工作台身份。",
            "登录、旧首页书签及返回工作台使用同一判断；管理员沿原规则。"
          ],
          "identifiers": [],
          "drill": null
        },
        {
          "id": "platform-receiving",
          "key": "receiving",
          "title": "呼入与预外呼接听",
          "subtitle": "工具条接听 · 边通话边记录",
          "x": 445,
          "y": 1450,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "本方设计",
          "refs": [
            "API-303",
            "API-306",
            "API-318",
            "API-319",
            "API-326"
          ],
          "role": "核验本人工号及原通话身份，在同一工作台接收呼入与预外呼分配；预外呼精确关联原任务和客户条目。",
          "inputs": [],
          "outputs": [
            "客户接通与人工接听证据、处理结果及业务快照"
          ],
          "rules": [
            "D-030 / FA-140–FA-142 / B-66–B-70、G-32–G-35：ringingIb/ringingAgentOb 仅待接听，匹配 busyIb/busyOb 才确认人工通话。",
            "本项目固定bindType=3，请求sipLink后等待建立事件；不开放普通电话或分机登录。",
            "关闭仅收起；重复、迟到、取消及失败只处理匹配原通话。上线不依赖主动外呼技能选择或外显号码。",
            "演示工具默认两个来电按钮，失败等场景收起；原型不实现自动分配或真实接听。",
            "D-054 / SRC-084：呼入号码识别一般针对被呼叫的坐席绑定手机号，软电话大概率识别不到，并非绝对不支持。本项目按API-319响应status（人工接听、人工未接听、系统应答、系统未应答）展示接听结果；查询statuses数字1–4与响应值分开。识别只保留为可选补充，不用于判断来电客户号码状态或接听，不把坐席手机号未接识别成客户空号/停机；缺失识别不阻断呼入记录和报表。status缺失、非法或与时间证据冲突仍按原规则核对。sipCauseAsyncUpdateFlag只适用于预测话单；CF-13仅余自动外呼准确识别字段及编码对应。",
            "顶部电话工具条统一登录/退出、置忙/置闲、拨号、接听、静音、挂断及延长整理，并直接显示工作模式下拉（D-071）；右侧非模态记录面板支持边通话边填写。切页收起保留草稿；本轮不提供拒接或内部呼叫。",
            "呼入未分类时客服可以在记录中选择业务分类；预外呼从精确客户条目承接原分类。",
            "正式记录保存成功且业务phase=idle后自动unpause；成功才ready。失败保留已存业务可重试，未知先核对不重放，确认ready且无未完成通话和连接异常后解除保护。"
          ],
          "identifiers": [],
          "drill": null,
          "relatedDecisionIds": [],
          "decisionId": "D-054",
          "sourceRefs": [
            "SRC-084"
          ],
          "sourceType": "user_relayed_supplier_feedback"
        },
        {
          "id": "platform-repeat-contact",
          "key": "repeat-contact",
          "title": "业务再次预外呼",
          "subtitle": "原任务 · 追加名单 · 联系次数",
          "x": 830,
          "y": 1450,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "本方设计",
          "refs": [
            "API-311",
            "API-312",
            "API-326"
          ],
          "role": "从原任务最近已接通并结束的预外呼选择客户，保持原taskId并追加批次和客户行，保留原品牌、字符串线索编码与通话来源。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "D-060 / SRC-090 / ADP-25 PlanRepeatPredictive / FA-144–FA-146 / C-53–C-58：本任务内按最新来源选择，人工未接听与坐席约定再联系分别标记原因；本任务业务联系次数独立于telRetryRound。",
            "仅待启动、执行中、已暂停且供应商状态明确的原任务可追加；已结束不可重开。同任务在途、待话后保存和待执行安排防重，客户拒绝联系按客户拦截。",
            "仅追加新批次和新执行行，原历史保留；isRepeat=0、importTelAutoStart=0，保存失败只补偿本次新增。跨任务不混选，也不重新进入任务创建向导。",
            "关联原任务须账号、租户、通话类型、本地与供应商taskId一致；只有供应商ID时要求唯一匹配。冲突不改绑且不开放再次联系。关联任务设置在详细信息中折叠只读，使用原任务摘要；业务联系轮次与供应商重试轮次、最终呼叫标记分开。",
            "D-065：原任务再次联系沿用本任务保存/冻结设置，不引用当前共享模板。"
          ],
          "identifiers": [
            "sourceTaskId/sourceBatchId/sourceItemId/sourceCallId",
            "businessContactNo"
          ],
          "drill": null
        },
        {
          "id": "platform-account-directory",
          "key": "account-directory",
          "title": "本地账号目录",
          "subtitle": "登记 · 编辑 · 启停 · 配置留痕",
          "x": 60,
          "y": 1720,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "当前原型 · 本地",
          "refs": [
            "API-301"
          ],
          "role": "仅超级管理员登记已由 AliCti 提供的账号；维护名称、账号 ID、客户或品牌、凭据配置标记与备注。",
          "inputs": [],
          "outputs": [
            "只读账号资料与关联租户；另由列表保存资料、状态与配置审计"
          ],
          "rules": [
            "D-036 / D-037 / D-039 · FA-149–FA-152、FA-157 · A-15–A-18、A-24–A-27 · SC-216 / SEQ-216：本地新增不调用供应商账号创建、开通或停机接口。",
            "账号 ID 和客户/品牌首次保存后固定；无服务区域，无真实密码或 token 输入。凭据标记与启用状态均不代表真实连接已核验。",
            "账号列表保留新增、编辑与启停；查看和关联数量各自打开单层只读抽屉，不从详情创建或管理租户、编辑启停或切换使用账号。",
            "账号目录与配置审计一次持久写入；失败不发布，目录修订和对象版本阻止旧表单覆盖；只读查看不写配置审计。"
          ],
          "identifiers": [
            "configId",
            "enterpriseId",
            "brandCustomerName",
            "revision / version"
          ],
          "drill": null
        },
        {
          "id": "platform-account-scope",
          "key": "account-scope",
          "title": "租户管理与账号选择",
          "subtitle": "表单选账号 · 授权 · 顶部切换",
          "x": 445,
          "y": 1720,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "当前原型 · 本地",
          "refs": [],
          "role": "通过独立租户管理新建或维护总部、门店租户，在表单选择已启用账号；跨账号创建成功后显示目标账号租户列表，另可从顶部选择使用范围。",
          "inputs": [
            "已启用账号目录",
            "租户成员与角色授权"
          ],
          "outputs": [
            "当前账号、租户与云联络中心使用范围"
          ],
          "rules": [
            "D-039 / SRC-071：新增和维护租户统一从租户管理进入，账号详情及关联清单均不提供管理入口；空账号仍可创建首个租户；跨账号创建须通过现有上下文保护，成功后显示目标账号租户列表。已有业务数据的租户不能迁移账号。",
            "未保存内容、在途通话与话后待保存阻止切换；同账号选择不重置页面或未保存输入。",
            "本地停用后超管保留账号管理入口；全部停用也可登录恢复。普通用户不能管理或跨账号读取。",
            "每个enterpriseId只关联0或1个总部/门店业务租户，内置超级租户不计入；每个业务租户仍只关联一个AliCti账号。tenantId与enterpriseId分别保留，平台登录账号仍可按成员授权加入多个租户。总部7522240与门店7522241属于同一品牌，但资源和业务数据按各自账号及租户隔离。",
            "超级管理员（SUPER）在既有AliCti账号编辑的“外显导航”区维护callerNavigations:[{name,customerClidsGroup}]，可登记多个已存在AliCti导航；每行名称和标识必填，标识同账号唯一，不设置本地数量上限，不新增菜单或实体模块。目录是本地登记，移除条目不等于远端删除或停用。旧instance.customerClidsGroup单值仅在读取时兼容为一条，不自动重写；没有目录不推造候选。创建、草稿及复制的导航候选仅取当前账号目录，下拉显式单选一个，无自动首项默认。新提交前复核所选标识仍在目录，被移除须重选；名称改名不阻断，旧草稿有标识但无名称时只从匹配候选补名称。切换到另一个导航清空原clidPoolList，保留customerTimeout。现有官方材料只说明单次任务传一个导航标识，未确认同enterpriseId的导航数量上限或账号内查询接口；本地多行登记是D-070产品修正，不冒充供应商答复。目录移除不等于远端删除或停用，CF-15继续未决。",
            "D-078：任务创建与更新无任务级指定号码字段。导航字段在接口中可选；两类新建任务按本原型产品规则必选当前账号已有外显导航，task/create传customerClidsCategory=5、单个customerClidsGroup、可选clidPoolList及customerTimeout；API-312的taskTelList[].clid仅逐客户显式提供时可选，不从任务或批次设置推导。",
            "任务保存导航名称及标识、号码池和等待时间快照；callerNavigationName仅作本地名称快照、不传API，task/create仍只传单个String customerClidsGroup。账号目录改名或移除不回填已保存任务快照，也不覆写草稿及复制已有的名称；已创建任务和原任务再次联系保留快照及原taskId。创建确认、任务设置及复制采用一致字段；草稿和复制在新提交时复核当前账号目录，已移除标识须重选。通话详情仅展示话单实际外显号码，不能用池名称或本地挑选结果冒充供应商选号事实。",
            "号码池名称来自当前租户关联enterpriseId的AliCti hybridGroup/list；租户管理员可通过hybridGroup/create、delete、update维护本租户号码池，不把本地号码列表当成池。任务从本租户列表选池名，priority手动选填整数且数值越小越优先，留空省略。空池、同优先级选号和运行任务变更生效时点仍待CF-15确认，不承诺失败自动切池。本地停用仅能约束本地直接选号，不能保证AliCti外显导航号码池排除该号码；全局阻断须经供应商停用或排除机制核验。既有通话正常继续；此边界不增加异常入口。",
            "同一enterpriseId可登记多个AliCti线下提供的外显导航，一个导航可配合多个号码池。两类任务创建时从当前账号目录显式选择一个，提交customerClidsCategory=5及单个customerClidsGroup，可选多个clidPoolList。API-311/API-404只证明单次任务字段；导航查询、标识有效性与号码池选号见CF-15联调。",
            "预测任务minAvailableAgentCount默认10、范围1–10，任务内可用座席数低于阈值自动暂停。只有autoStart=1且确因座席不足暂停，人数恢复达阈值时自动启动；手工暂停、号码停用保护暂停、结束不恢复。自动外呼不配置该字段。API-311/API-404仅证明阈值、定时字段和不足自动暂停；恢复行为为用户转述，CF-18待真实联调。",
            "已建任务保留原customerClidsGroup及号码池快照。启动/继续时如所选导航已从当前账号目录移除，先阻断，再从原任务编辑以API-404 task/update提交新标识，经DOC-334 task/get回查同一taskId及可读值后启动。任务中心座席人数变化入口只作本地演示，不读取实时人数或执行供应商任务操作。"
          ],
          "identifiers": [],
          "drill": null,
          "relatedDecisionIds": [
            "D-069",
            "D-070",
            "D-078",
            "D-081",
            "D-086"
          ],
          "decisionId": "D-086",
          "sourceRefs": [
            "SRC-098",
            "SRC-099",
            "SRC-100",
            "SRC-108",
            "SRC-109",
            "SRC-114"
          ],
          "sourceType": "user_product_confirmation"
        },
        {
          "id": "platform-account-history",
          "key": "account-history",
          "title": "只读关联与历史归属",
          "subtitle": "租户清单 · 原归属 · 历史保留",
          "x": 830,
          "y": 1720,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "当前原型 · 只读",
          "refs": [],
          "role": "账号详情和关联数量只读展示已关联租户；坐席、号码、任务及通话在各自模块按原账号和租户归属查询，停用不清除历史。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "关联数量直接打开租户清单，零关联显示空状态；不进入账号详情后再层层管理。查看和关闭不改变当前账号。",
            "不通过相同号码或品牌名称扩大范围；历史记录保持原账号与租户归属。",
            "本地停用仅限制新的平台业务操作，不发送远端任务结束或挂断请求，不承诺供应商在途任务停止。",
            "每个enterpriseId只关联0或1个总部/门店业务租户，内置超级租户不计入；每个业务租户仍只关联一个AliCti账号。tenantId与enterpriseId分别保留，平台登录账号仍可按成员授权加入多个租户。总部7522240与门店7522241属于同一品牌，但资源和业务数据按各自账号及租户隔离。",
            "超级管理员（SUPER）在既有AliCti账号编辑的“外显导航”区维护callerNavigations:[{name,customerClidsGroup}]，可登记多个已存在AliCti导航；每行名称和标识必填，标识同账号唯一，不设置本地数量上限，不新增菜单或实体模块。目录是本地登记，移除条目不等于远端删除或停用。旧instance.customerClidsGroup单值仅在读取时兼容为一条，不自动重写；没有目录不推造候选。创建、草稿及复制的导航候选仅取当前账号目录，下拉显式单选一个，无自动首项默认。新提交前复核所选标识仍在目录，被移除须重选；名称改名不阻断，旧草稿有标识但无名称时只从匹配候选补名称。切换到另一个导航清空原clidPoolList，保留customerTimeout。现有官方材料只说明单次任务传一个导航标识，未确认同enterpriseId的导航数量上限或账号内查询接口；本地多行登记是D-070产品修正，不冒充供应商答复。目录移除不等于远端删除或停用，CF-15继续未决。",
            "D-078：任务创建与更新无任务级指定号码字段。导航字段在接口中可选；两类新建任务按本原型产品规则必选当前账号已有外显导航，task/create传customerClidsCategory=5、单个customerClidsGroup、可选clidPoolList及customerTimeout；API-312的taskTelList[].clid仅逐客户显式提供时可选，不从任务或批次设置推导。",
            "任务保存导航名称及标识、号码池和等待时间快照；callerNavigationName仅作本地名称快照、不传API，task/create仍只传单个String customerClidsGroup。账号目录改名或移除不回填已保存任务快照，也不覆写草稿及复制已有的名称；已创建任务和原任务再次联系保留快照及原taskId。创建确认、任务设置及复制采用一致字段；草稿和复制在新提交时复核当前账号目录，已移除标识须重选。通话详情仅展示话单实际外显号码，不能用池名称或本地挑选结果冒充供应商选号事实。",
            "号码池名称来自当前租户关联enterpriseId的AliCti hybridGroup/list；租户管理员可通过hybridGroup/create、delete、update维护本租户号码池，不把本地号码列表当成池。任务从本租户列表选池名，priority手动选填整数且数值越小越优先，留空省略。空池、同优先级选号和运行任务变更生效时点仍待CF-15确认，不承诺失败自动切池。本地停用仅能约束本地直接选号，不能保证AliCti外显导航号码池排除该号码；全局阻断须经供应商停用或排除机制核验。既有通话正常继续；此边界不增加异常入口。",
            "同一enterpriseId可登记多个AliCti线下提供的外显导航，一个导航可配合多个号码池。两类任务创建时从当前账号目录显式选择一个，提交customerClidsCategory=5及单个customerClidsGroup，可选多个clidPoolList。API-311/API-404只证明单次任务字段；导航查询、标识有效性与号码池选号见CF-15联调。",
            "预测任务minAvailableAgentCount默认10、范围1–10，任务内可用座席数低于阈值自动暂停。只有autoStart=1且确因座席不足暂停，人数恢复达阈值时自动启动；手工暂停、号码停用保护暂停、结束不恢复。自动外呼不配置该字段。API-311/API-404仅证明阈值、定时字段和不足自动暂停；恢复行为为用户转述，CF-18待真实联调。",
            "已建任务保留原customerClidsGroup及号码池快照。启动/继续时如所选导航已从当前账号目录移除，先阻断，再从原任务编辑以API-404 task/update提交新标识，经DOC-334 task/get回查同一taskId及可读值后启动。任务中心座席人数变化入口只作本地演示，不读取实时人数或执行供应商任务操作。"
          ],
          "identifiers": [],
          "drill": null,
          "relatedDecisionIds": [
            "D-069",
            "D-070",
            "D-078",
            "D-081",
            "D-086"
          ],
          "decisionId": "D-086",
          "sourceRefs": [
            "SRC-098",
            "SRC-099",
            "SRC-100",
            "SRC-108",
            "SRC-109",
            "SRC-114"
          ],
          "sourceType": "user_product_confirmation"
        },
        {
          "id": "platform-queue-config",
          "key": "queue-config",
          "title": "队列独立管理",
          "subtitle": "新增 / 关联 · 策略 · 等待设置",
          "x": 60,
          "y": 1980,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "当前原型 · 模拟配置",
          "refs": [
            "API-377",
            "API-378",
            "API-379",
            "API-380"
          ],
          "role": "AliCtiQueues 在企业账号和租户下保存队列；队列管理为坐席与技能中的独立页面，超级管理员维护当前账号范围，租户管理员维护本租户队列；查看入口保持只读。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "D-045 / SRC-075 / FA-158–FA-168 / F-26–F-27 / H-20–H-31 / SC-218、SEQ-218：一个企业账号对应0或1个总部/门店业务租户，内置超级租户除外，一队列可关联本租户多个技能组；当前每技能组最多关联一个队列，不跨租户；不新增购买订阅关系。",
            "关联已有支持多选技能，按差量生成queueSkill/create与delete模拟请求，保留原skillLevel。新增/修改构造官方字段模拟请求，真实调用留给生产后端；qno保留String，不得修改编号。",
            "队列目录与关联同一版本化快照保存，复核范围、revision和写前原值；失败不发布，损坏原文不覆盖。顺序检查不是跨标签独占事务。",
            "已发布呼入引用或在途通话保护更换/解绑；解除技能关联构造queueSkill/delete模拟请求，不调用queue/delete删除队列，不改providerQueueNo或历史话单。",
            "D-043：等待设置包含retry/serviceLevel，语音设置包含musicClass/sayAgentno/固定与位置播报，高级设置含vipSupport和joinEmpty；开启条件时必填文件、频率或至少2人数阈值。",
            "D-044：缺字段按空值要求补齐，不做旧记录迁移；maxPauseAgent及announcePositionYouarenext本期未开放。"
          ],
          "identifiers": [
            "enterpriseId",
            "tenantId",
            "physicalGroupId",
            "String qno",
            "alicti-queue-bindings-v1"
          ],
          "drill": null,
          "relatedDecisionIds": [],
          "decisionId": "D-068",
          "sourceRefs": [
            "SRC-098"
          ],
          "sourceType": "user_product_confirmation"
        },
        {
          "id": "platform-queue-check",
          "key": "queue-check",
          "title": "队列技能与成员核对",
          "subtitle": "多技能集合 · 独立实际名单",
          "x": 445,
          "y": 1980,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "当前原型 · 独立样例",
          "refs": [
            "API-380",
            "API-382",
            "DOC-342"
          ],
          "role": "沿用技能组和坐席成员管理；分别对比平台有效成员、供应商队列技能映射和实际队列成员，展示差异与核对时间。",
          "inputs": [
            "平台有效成员及预期技能 ID",
            "独立 queueSkills 与实际 cno 快照"
          ],
          "outputs": [
            "核对状态、缺少/多余成员、checkedAt 与指纹"
          ],
          "rules": [
            "SC-219 / SEQ-219：全部关联技能映射必须已知且与完整queueSkills集合相符，双方空名单不能代替技能关联核对；保留skillLevel，不推测匹配阈值。",
            "cno按原String比对，0012与12独立；未知或跨租户坐席仅显示受限数量，不泄露其他租户身份。",
            "核对不自动改供应商技能或名单；平台成员或队列快照变化使指纹失效。成员一致不证明路由配置、上线或真实接听已通过。"
          ],
          "identifiers": [],
          "drill": null
        },
        {
          "id": "platform-predictive-strategy",
          "key": "predictive-strategy",
          "title": "预测任务坐席分配",
          "subtitle": "callStrategy · 独立任务配置",
          "x": 830,
          "y": 1980,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "当前原型 · 任务字段",
          "refs": [
            "API-311"
          ],
          "role": "在接听团队配置的折叠设置选择预测任务坐席分配方式；配置、模板、复制、确认和启动快照保持一致，原任务再次联系沿用现值。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "D-041 / SRC-073 / FA-169 / C-59–C-62：String1随机、2按顺序、3距离上次通话结束最久、4当前空闲时间最长；新建默认4，缺字段须重新选择，不能提交。",
            "与queue.strategy、weight独立，不覆盖cnos或重呼规则。队列未关联不新增预测启动阻断；自动IVR不展示、不提交callStrategy。"
          ],
          "identifiers": [],
          "drill": null
        },
        {
          "id": "platform-seat-runtime",
          "key": "seat-runtime",
          "title": "本人电话运行",
          "subtitle": "上线 / 暂停恢复 / 完全退出",
          "x": 60,
          "y": 2250,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "本方运行编排",
          "refs": [
            "API-302",
            "API-303",
            "API-304",
            "API-306"
          ],
          "role": "本人在当前账号和租户具有有效坐席即可操作；维护独立电话presence，统一软电话，工作模式由本人单选0/4/5，不用ADMIN角色代替资格。",
          "inputs": [
            "已核验本人enterpriseId、tenantId、accountId、String cno",
            "本次登录选择的工作模式与状态"
          ],
          "outputs": [
            "有本次回执依据的电话会话和操作状态"
          ],
          "rules": [
            "D-046 / SRC-076 / D-072：login固定bindType3，workingMode每次由本人在登录面板单选0/4/5后直接提交；bindTel取管理员维护的本地软电话分机，缺失或读取失败拒绝上线，不根据工号、手机号或外显号码推算。本人设置loginStatus1/2，置忙原因选填。",
            "普通退出固定logoutMode=1、removeBinding=0，保留坐席与接听分机绑定；成功前不释放；暂停/整理/pending不接新来电不拨号。",
            "D-071：登录后工具条直接显示模式下拉，在线即时调用changeWorkingMode切换；置忙可切换，通话、振铃、话后整理及未知结果期间拒绝并保留原模式。模式4不接受预测分配、模式5禁用预览外呼入口；呼入不受模式限制是本地假设，见CF-16。不开放设备切换，changeBindTel直接调用拒绝。",
            "D-046 / SRC-076：号码当前按D-068自动归属唯一业务租户；本地软电话分机管理保留；旧号码—技能—坐席绑定不再采用，其他历史规则与公开接口原字段含义保持独立。",
            "D-052 / SRC-082（2026-09-20，user_relayed_supplier_feedback）：breakLine的code=-1为连接断开，code=0为重连成功；SDK自动最多20次重连，每次回调，超过需重新登录。平台不另建重连循环、不按回调次数推断耗尽；sipDisconnected为无参软电话中断通知，坐席需重新登录。",
            "D-052：breakLine code=0仅证明信令重连，不证明媒体可用或原通话恢复。事件绑定当前有效会话，旧会话事件不影响新登录；保留通话、草稿和未知操作保护。原型待通话及记录处理完成后可由本人主动重登，成功暂停接听并需明确恢复；这一保护不等于官方要求所有信令恢复均强制重登。CF-11仍保留跨设备互斥、异常退出清理、媒体就绪与最终状态核验，以及setOffline回执矛盾。",
            "分机在系统管理的独立分机管理中创建或导入，坐席只选择本企业本租户启用且未占用的type=2软电话；登录前再核对。目录type=2与login.bindType=3分别解释，不以工号推算分机。",
            "登录不要求选择技能或外显号码；人工拨号前另查分机isOb/callPower与当前租户号码权限，不能拿上线成功代替外呼资格。",
            "D-072：每次普通坐席登录均直接打开一次性登录面板；工作模式初始“请选择”，本人必须选0预览与预测同时、4预览外呼或5预测外呼；登录状态默认置闲，可改置忙并选填原因。点击“登录”直接提交login，取消不发请求，失败保留本次输入供重试；不先保存登录设置或沿用上次模式。断线重登是独立流程，沿用当前会话模式及暂停状态。",
            "D-071：登录后工具条直接显示工作模式下拉，在线即时调用CTILink.Agent.changeWorkingMode；置忙可切，通话、振铃、话后整理及未知结果期间拒绝。登录置忙后禁用主动预览外呼，须先置闲；模式4不接受预测分配，模式5禁用预览外呼。呼入与模式关系仍见CF-16。"
          ],
          "identifiers": [],
          "drill": null,
          "decisionId": "D-052",
          "sourceRefs": [
            "SRC-076",
            "SRC-082",
            "SRC-101",
            "SRC-102"
          ],
          "relatedDecisionIds": [
            "D-046",
            "D-071",
            "D-072"
          ],
          "sourceType": "user_relayed_supplier_feedback"
        },
        {
          "id": "platform-seat-business",
          "key": "seat-business",
          "title": "业务保存与话后整理",
          "subtitle": "已保存记录不被电话失败回滚",
          "x": 445,
          "y": 2250,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "本方状态边界",
          "refs": [
            "API-304",
            "API-305",
            "API-306"
          ],
          "role": "通话中输入按原草稿保存；本通结束后正式提交业务，再独立完成电话整理。",
          "inputs": [
            "已结束通话和正式业务提交结果"
          ],
          "outputs": [
            "保持已存业务与独立电话整理结果"
          ],
          "rules": [
            "prolongWrapup仅整理且30–600秒；失败保留原期限，与队列默认3–3600不同。",
            "正式记录保存成功且业务phase=idle后自动unpause；成功才ready。失败保留已存业务可重试，未知先核对不重放，确认ready且无未完成通话和连接异常后解除保护。",
            "工作台phase=idle不等于电话ready；暂停、恢复或延时失败不能回滚已保存跟进。",
            "顶部电话工具条统一登录/退出、置忙/置闲、拨号、接听、静音、挂断及延长整理，并直接显示工作模式下拉（D-071）；右侧非模态记录面板支持边通话边填写。切页收起保留草稿；本轮不提供拒接或内部呼叫。",
            "D-085：客户管理仅设业务分类菜单，同页维护分类和独立字段库；取消业务模板。分类在 enterpriseId + tenantId 内以有序fields数组直接引用稳定fieldId，每项包含enabled、required，数组位置决定顺序。分类可零字段，线索分类须直接含六项预置统计字段；不同分类可共用字段定义但各自配置显示与必填。导入采用启用分类，通话按分类字段加载；草稿可空，正式保存校验。原型不迁移旧模板。字段/选项选填businessKey仅作本地外部映射，不替代内部ID、不发送AliCti。",
            "正式记录保存成功且业务phase=idle后自动unpause；成功才ready。失败保留已存业务可重试，未知先核对不重放，确认ready且无未完成通话和连接异常后解除保护。"
          ],
          "identifiers": [],
          "drill": null
        },
        {
          "id": "platform-seat-monitor",
          "key": "seat-monitor",
          "title": "班长队列监控",
          "subtitle": "离线只读 · 上线后队列管理",
          "x": 830,
          "y": 2250,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "本方授权与展示",
          "refs": [
            "API-304",
            "DOC-395",
            "DOC-344"
          ],
          "role": "本租户ADMIN在班长监控查看今日已结束外呼统计、只读坐席状态与已有事件日志，本人可尚未关联坐席；队列实时状态和管理置忙、置闲、下线仅在关联有效班长坐席、本人上线且供应商班长资格与本租户队列授权均确认后开放。",
          "inputs": [
            "供应商班长证据与本租户队列归属",
            "选定qnos及fields"
          ],
          "outputs": [
            "范围过滤后的监控结果"
          ],
          "rules": [
            "本地策略将有效租户管理员坐席配置power=1；仍须供应商班长资格确认，队列维护与实时监控分别核验。",
            "展示queueEntryCount排队人数；其他queueParams响应保留，本页不展开；QueueParam统计仅呼入，wrapupTime为平均整理时长。",
            "QueueEntry采用customerNumber与joinTime；waitTime未说明单位，不据此计算秒数。",
            "班长管理仅本租户授权队列内其他有效坐席；最新状态下置忙/置闲/下线，通话振铃整理中不可强改；不提供管理上线。",
            "未关联本人坐席或未上线仍可查看概览只读区和事件日志；逐席状态按enterpriseId和原cno查询agentStatus/get，平台再过滤tenantId授权。今日统计及二级页签布局属于本方产品规则。",
            "事件日志沿用D-080的来源和观察时间口径；快照差异不是供应商推送，原型最多15条。"
          ],
          "identifiers": [],
          "drill": null,
          "relatedDecisionIds": [
            "D-080"
          ],
          "decisionId": "D-082",
          "sourceRefs": [
            "SRC-110"
          ],
          "sourceType": "user_product_requirement_and_existing_interface_review"
        },
        {
          "id": "platform-outbound-groups",
          "key": "outbound-groups",
          "title": "外呼组独立管理",
          "subtitle": "组资料 · 坐席成员 · 预测选用",
          "x": 60,
          "y": 2520,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "本方管理与任务映射",
          "refs": [
            "API-311",
            "API-386",
            "API-387",
            "API-388",
            "API-389",
            "API-390",
            "API-391",
            "API-392",
            "API-393",
            "API-394"
          ],
          "role": "外呼组管理为坐席与技能下独立页面，按企业账号和租户维护资料及成员，选用时形成预测任务快照。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "SC/SEQ-222：指定坐席和外呼组二选一，任务分别使用cnos和agentGroup；不以qno或本地技能ID代替gno。",
            "本地模拟请求不证明真实供应商组已经创建，生产按API-386～394回读；同一坐席只在一个外呼组，重新分配会移组，需保护原组和目标组在途引用。"
          ],
          "identifiers": [],
          "drill": null
        },
        {
          "id": "platform-pending-skills",
          "key": "pending-skills",
          "title": "在线新增技能待提交",
          "subtitle": "保留现有技能 · 下线后手动提交",
          "x": 445,
          "y": 2520,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "本地交互与公开限制",
          "refs": [
            "API-309"
          ],
          "role": "在线仅追加新技能时保存待生效/待提交；坐席正常下线后管理员手动提交全量技能，成功才生效。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "SC/SEQ-223：20023座席状态在线是官方限制；更改原技能等级、移除或实际提交仍须下线。",
            "当前没有通话中改等级待生效或下线自动提交机制。failCno按原String逐席核验，失败保留原配置。"
          ],
          "identifiers": [],
          "drill": null
        },
        {
          "id": "platform-direct-task-import",
          "key": "direct-task-import",
          "title": "预测任务直接导入",
          "subtitle": "文件 · 预检 · 确认 · task/import",
          "x": 830,
          "y": 2520,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "本地导入交互",
          "refs": [
            "API-312"
          ],
          "role": "在预测任务列表打开导入客户抽屉，选择文件并映射字段，先预检再确认保存及提交名单。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "同账号租户与当前任务、来源批次绑定，空值或无效行按预检处理；导入不自动启动。",
            "自动外呼仍通过导入与分配添加客户，不扩大直接入口。"
          ],
          "identifiers": [],
          "drill": null
        },
        {
          "id": "platform-seat-phone-config",
          "key": "seat-phone-config",
          "title": "坐席受控选择分机",
          "subtitle": "先建目录 · 下线配置 · 登录复查",
          "x": 60,
          "y": 2790,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "本地配置 · 公开登录入参",
          "refs": [
            "API-304"
          ],
          "role": "SeatPhoneConfig从独立分机目录选择本租户可用软电话，不再允许在坐席里任意输入分机。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "分机在系统管理的独立分机管理中创建或导入，坐席只选择本企业本租户启用且未占用的type=2软电话；登录前再核对。目录type=2与login.bindType=3分别解释，不以工号推算分机。",
            "保留字符串及前导零；可清空配置，缺失时不能登录。修改前核验下线、当前及跨标签会话占用、待确认操作；失败保留原值。",
            "配置坐席分机为本地关联，不写agent/create或agent/update；资源创建/更新由独立exten适配负责，不把本地保存当成媒体注册成功。"
          ],
          "identifiers": [
            "enterpriseId",
            "tenantId",
            "contactCenterIdentityId",
            "String cno",
            "softphoneExtension"
          ],
          "drill": null,
          "decisionId": "D-050",
          "sourceRefs": [
            "SRC-076",
            "SRC-080"
          ],
          "relatedDecisionIds": [
            "D-046"
          ],
          "sourceType": "user_relayed_supplier_feedback"
        },
        {
          "id": "platform-number-grants",
          "key": "number-grants",
          "title": "号码自动归属",
          "subtitle": "自动归属 · 本地使用开关",
          "x": 445,
          "y": 2790,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "本地使用权限",
          "refs": [
            "API-310"
          ],
          "role": "号码导入默认归属账号唯一业务租户；保留本地归属字段用于权限过滤，按状态、方向和外显用途核验可用性。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "不选择技能或坐席，不使用旧boundSkillGroupIds；预测团队及有效成员、队列技能关联独立校验。",
            "账号唯一业务租户须有效且开通云联络中心；归属只读展示，不再提供手动租户分配。",
            "D-046 / SRC-076：号码当前按D-068自动归属唯一业务租户；本地软电话分机管理保留；旧号码—技能—坐席绑定不再采用，其他历史规则与公开接口原字段含义保持独立。",
            "D-048 / SRC-078（user_relayed_supplier_feedback_and_scope_decision）：供应商号码停用后后续选号不再使用该号码，已发起通话正常继续。用户取消供应商账号解绑接口及查证需求，改为本地停用后不再使用该号码外呼；本地开关不解除供应商资源、不停止呼入路由、不强制挂断，历史保留。",
            "FA-183 / J-35：列表停用本地使用仅保存localEnabled；停用时本地暂停关联任务的新拨号。恢复本地使用不能绕过供应商status=0、用途或租户权限，不自动继续任务。供应商status启停在详情更多设置单独操作。"
          ],
          "identifiers": [
            "localEnabled（默认true）"
          ],
          "drill": null,
          "decisionId": "D-068",
          "sourceRefs": [
            "SRC-076",
            "SRC-078",
            "SRC-098"
          ],
          "relatedDecisionIds": [
            "D-046",
            "D-048"
          ],
          "sourceType": "user_product_confirmation"
        },
        {
          "id": "platform-number-references",
          "key": "number-references",
          "title": "号码业务引用",
          "subtitle": "当前任务 · 当前呼入规则",
          "x": 830,
          "y": 2790,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "本地真实对象引用",
          "refs": [
            "API-350",
            "API-353"
          ],
          "role": "从当前任务快照和AliCtiInbound.numberReferences展示任务数与呼入规则数；不从退役技能绑定推算。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "按当前账号唯一业务租户核对号码与呼入规则引用，未知或冲突显示待核对；不再提供号码撤权分配操作。",
            "供应商路由是否真实生效仍须接入核验，本地引用不证明实际话路。",
            "D-046 / SRC-076：号码当前按D-068自动归属唯一业务租户；本地软电话分机管理保留；旧号码—技能—坐席绑定不再采用，其他历史规则与公开接口原字段含义保持独立。",
            "D-048 / SRC-078（user_relayed_supplier_feedback_and_scope_decision）：供应商号码停用后后续选号不再使用该号码，已发起通话正常继续。用户取消供应商账号解绑接口及查证需求，改为本地停用后不再使用该号码外呼；本地开关不解除供应商资源、不停止呼入路由、不强制挂断，历史保留。",
            "本地停用保留租户授权、当前呼入规则和历史引用；呼入入口由呼入规则单独管理。暂停关联任务新拨号属于本地产品保护，不归因于供应商自动行为。",
            "超级管理员（SUPER）在既有AliCti账号编辑的“外显导航”区维护callerNavigations:[{name,customerClidsGroup}]，可登记多个已存在AliCti导航；每行名称和标识必填，标识同账号唯一，不设置本地数量上限，不新增菜单或实体模块。目录是本地登记，移除条目不等于远端删除或停用。旧instance.customerClidsGroup单值仅在读取时兼容为一条，不自动重写；没有目录不推造候选。创建、草稿及复制的导航候选仅取当前账号目录，下拉显式单选一个，无自动首项默认。新提交前复核所选标识仍在目录，被移除须重选；名称改名不阻断，旧草稿有标识但无名称时只从匹配候选补名称。切换到另一个导航清空原clidPoolList，保留customerTimeout。现有官方材料只说明单次任务传一个导航标识，未确认同enterpriseId的导航数量上限或账号内查询接口；本地多行登记是D-070产品修正，不冒充供应商答复。目录移除不等于远端删除或停用，CF-15继续未决。",
            "D-078：任务创建与更新无任务级指定号码字段。导航字段在接口中可选；两类新建任务按本原型产品规则必选当前账号已有外显导航，task/create传customerClidsCategory=5、单个customerClidsGroup、可选clidPoolList及customerTimeout；API-312的taskTelList[].clid仅逐客户显式提供时可选，不从任务或批次设置推导。",
            "任务保存导航名称及标识、号码池和等待时间快照；callerNavigationName仅作本地名称快照、不传API，task/create仍只传单个String customerClidsGroup。账号目录改名或移除不回填已保存任务快照，也不覆写草稿及复制已有的名称；已创建任务和原任务再次联系保留快照及原taskId。创建确认、任务设置及复制采用一致字段；草稿和复制在新提交时复核当前账号目录，已移除标识须重选。通话详情仅展示话单实际外显号码，不能用池名称或本地挑选结果冒充供应商选号事实。",
            "号码池名称来自当前租户关联enterpriseId的AliCti hybridGroup/list；租户管理员可通过hybridGroup/create、delete、update维护本租户号码池，不把本地号码列表当成池。任务从本租户列表选池名，priority手动选填整数且数值越小越优先，留空省略。空池、同优先级选号和运行任务变更生效时点仍待CF-15确认，不承诺失败自动切池。本地停用仅能约束本地直接选号，不能保证AliCti外显导航号码池排除该号码；全局阻断须经供应商停用或排除机制核验。既有通话正常继续；此边界不增加异常入口。",
            "同一enterpriseId可登记多个AliCti线下提供的外显导航，一个导航可配合多个号码池。两类任务创建时从当前账号目录显式选择一个，提交customerClidsCategory=5及单个customerClidsGroup，可选多个clidPoolList。API-311/API-404只证明单次任务字段；导航查询、标识有效性与号码池选号见CF-15联调。",
            "预测任务minAvailableAgentCount默认10、范围1–10，任务内可用座席数低于阈值自动暂停。只有autoStart=1且确因座席不足暂停，人数恢复达阈值时自动启动；手工暂停、号码停用保护暂停、结束不恢复。自动外呼不配置该字段。API-311/API-404仅证明阈值、定时字段和不足自动暂停；恢复行为为用户转述，CF-18待真实联调。",
            "已建任务保留原customerClidsGroup及号码池快照。启动/继续时如所选导航已从当前账号目录移除，先阻断，再从原任务编辑以API-404 task/update提交新标识，经DOC-334 task/get回查同一taskId及可读值后启动。任务中心座席人数变化入口只作本地演示，不读取实时人数或执行供应商任务操作。"
          ],
          "identifiers": [],
          "drill": null,
          "decisionId": "D-086",
          "sourceRefs": [
            "SRC-076",
            "SRC-078",
            "SRC-098",
            "SRC-099",
            "SRC-100",
            "SRC-108",
            "SRC-109",
            "SRC-114"
          ],
          "relatedDecisionIds": [
            "D-046",
            "D-048",
            "D-069",
            "D-070",
            "D-078",
            "D-081",
            "D-086"
          ],
          "sourceType": "user_product_confirmation"
        },
        {
          "id": "platform-business-categories",
          "key": "business-categories",
          "title": "业务分类与字段库",
          "subtitle": "业务分类单菜单 · 分类直接引用字段",
          "x": 60,
          "y": 3068,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "本方设计",
          "refs": [
            "API-326"
          ],
          "role": "CustomerBusiness在业务分类页面维护分类及独立字段定义；CustomerFollowup按分类直接引用的字段生成表单并校验保存。",
          "inputs": [],
          "outputs": [
            "导入业务类型选项",
            "坐席记录表单",
            "档案和通话详情展示"
          ],
          "rules": [
            "D-085：客户管理仅设业务分类菜单，同页维护分类和独立字段库；取消业务模板。分类在 enterpriseId + tenantId 内以有序fields数组直接引用稳定fieldId，每项包含enabled、required，数组位置决定顺序。分类可零字段，线索分类须直接含六项预置统计字段；不同分类可共用字段定义但各自配置显示与必填。导入采用启用分类，通话按分类字段加载；草稿可空，正式保存校验。原型不迁移旧模板。字段/选项选填businessKey仅作本地外部映射，不替代内部ID、不发送AliCti。",
            "字段支持七种类型及选项对象；分类字段引用维护显示及必填，数组位置决定顺序。预置线索字段与选项保持稳定内部ID、类型及统计语义。字段及选项businessKey可留空，填写后分别在本租户字段库与所属字段内唯一。",
            "最终保存才校验，错误定位具体字段；未保存草稿不更新档案、报表或供应商。"
          ],
          "identifiers": [
            "enterpriseId",
            "tenantId",
            "businessType",
            "category.fields[].fieldId",
            "field.id",
            "option.id",
            "businessKey",
            "required"
          ],
          "drill": null
        },
        {
          "id": "platform-extension-directory",
          "key": "extension-directory",
          "title": "独立分机管理",
          "subtitle": "创建 / 导入 / 配置 / 租户分配",
          "x": 445,
          "y": 3068,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "供应商资源与本地授权",
          "refs": [
            "DOC-355",
            "API-396",
            "API-397",
            "API-399",
            "API-304"
          ],
          "role": "AliCtiExtensions提供软电话资源目录及租户分配，坐席只从受控目录选择；与外显号码管理分开。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "分机在系统管理的独立分机管理中创建或导入，坐席只选择本企业本租户启用且未占用的type=2软电话；登录前再核对。目录type=2与login.bindType=3分别解释，不以工号推算分机。",
            "exten/create、update、list、batchDelete分别处理新增、配置、查询和删除；本地tenantId不发送供应商，密码不持久保存且日志遮蔽。",
            "检查坐席配置、在线锁和呼入引用；禁止使用中的分机被停用、删除或改配。isOb与callPower限制新外呼，已发起通话不据此改写终态。"
          ],
          "identifiers": [
            "enterpriseId",
            "exten（String）",
            "type=2",
            "active",
            "tenantId（本地）"
          ],
          "drill": null,
          "relatedDecisionIds": [],
          "decisionId": "D-068",
          "sourceRefs": [
            "SRC-098"
          ],
          "sourceType": "user_product_confirmation"
        },
        {
          "id": "platform-time-conditions",
          "key": "time-conditions",
          "title": "时间条件维护",
          "subtitle": "星期 / 日期 · 可呼叫 / 禁呼",
          "x": 830,
          "y": 3068,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "供应商配置与本地权限",
          "refs": [
            "DOC-356",
            "DOC-359",
            "API-400",
            "API-401",
            "API-402",
            "API-311"
          ],
          "role": "AliCtiTimeConditions维护企业条件与本地租户可用范围，供任务和呼入规则关联。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "D-061：优先级由用户手工必填正整数，新增不自动分配；同enterpriseId内校验唯一，编辑回填现值。名称企业内唯一；星期/固定日期、连续/间隔及起止时间按接口。update按id不提交name，不提供启停或使用位置字段。",
            "租户管理员维护本租户条件，超管维护授权账号范围；不再配置同账号多租户共享。运行/暂停任务引用不能编辑；任务、草稿或呼入有效引用不能删除；引用核对失败保留原条件。",
            "任务用逗号连接ID，呼入ruleTimeProperty用分号。原型不实现时间调度器。"
          ],
          "identifiers": [
            "id",
            "tenantIds（本地）",
            "autoTaskType",
            "autoTriggerTimeStrategy",
            "timeStrategy"
          ],
          "drill": null,
          "relatedDecisionIds": [],
          "decisionId": "D-068",
          "sourceRefs": [
            "SRC-098"
          ],
          "sourceType": "user_product_confirmation"
        }
      ],
      "edges": [
        {
          "id": "platform-edge-role",
          "source": "platform-identity",
          "target": "platform-permissions",
          "label": "身份与租户",
          "points": [
            [
              360,
              154
            ],
            [
              445,
              154
            ]
          ],
          "lx": 403,
          "ly": 140,
          "status": "platform",
          "refs": [
            "API-326"
          ],
          "detail": "先确定登录身份和租户，再判定功能与数据权限。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "platform-edge-resource-scope",
          "source": "platform-permissions",
          "target": "platform-context",
          "label": "授权资源范围",
          "points": [
            [
              745,
              154
            ],
            [
              830,
              154
            ]
          ],
          "lx": 788,
          "ly": 140,
          "status": "platform",
          "refs": [
            "API-326"
          ],
          "detail": "供应商账号及坐席必须处于用户当前可用的资源范围内。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "platform-edge-business-guard",
          "source": "platform-permissions",
          "target": "platform-tasks",
          "label": "统一约束业务操作",
          "points": [
            [
              595,
              208
            ],
            [
              595,
              365
            ]
          ],
          "lx": 595,
          "ly": 267,
          "status": "platform",
          "refs": [
            "API-326"
          ],
          "detail": "该连线代表对云外呼业务层的共同约束，客户、任务和坐席操作均受权限检查。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "platform-edge-mapping",
          "source": "platform-context",
          "target": "platform-resources",
          "label": "资源映射 / 使用范围",
          "points": [
            [
              1115,
              208
            ],
            [
              1145,
              208
            ],
            [
              1145,
              607
            ],
            [
              1115,
              607
            ],
            [
              1115,
              630
            ]
          ],
          "lx": 1020,
          "ly": 535,
          "status": "platform",
          "refs": [
            "API-307",
            "API-309",
            "API-310",
            "API-326"
          ],
          "detail": "D-068 / SRC-098：号码导入默认归属账号唯一业务租户；不沿号码、技能和坐席推导绑定。技能成员、队列关联与号码授权各自核验，不写供应商号码绑定、不扩大跨租户可见范围。",
          "rules": [
            "D-050 / SRC-080：供应商话单只记cno、不记坐席主键；删除不清除历史话单，按cno查询或报表会合并新旧通话。仅凭话单不能精确拆分同工号的新旧坐席身份，不将旧记录改写归属新坐席。",
            "D-051 / SRC-081（2026-09-20，user_relayed_supplier_feedback）：success为主记录建成数，other为其中技能绑定失败子集，不与success相加；fail与success互斥。cnos含全部已建成工号（含other），申请工号区间减去cnos为未建成工号。未传skillIds时other=0；对cnos逐项queryAgentSkill，缺少目标skillId可定位other，查询本身不证明主记录新建。",
            "D-051 / SRC-081：创建结果未知时，agent/query按原cnos读取id/createTime，可使用startTime/endTime；新id且createTime处于本次请求窗口才证实本次主记录。agent/get与queryCnoAndName只证存在，queryAgentSkill只证技能。查询证据不足继续未知，不自动重放写入。CF-08已关闭，不意味着生产接口已联调。"
          ],
          "bidirectional": false,
          "relatedDecisionIds": [
            "D-050"
          ],
          "decisionId": "D-051",
          "sourceRefs": [
            "SRC-080",
            "SRC-081"
          ],
          "sourceType": "user_relayed_supplier_feedback"
        },
        {
          "id": "platform-edge-batch",
          "source": "platform-customers",
          "target": "platform-tasks",
          "label": "客户与号码批次",
          "points": [
            [
              360,
              419
            ],
            [
              445,
              419
            ]
          ],
          "lx": 403,
          "ly": 405,
          "status": "platform",
          "refs": [
            "API-312",
            "API-326"
          ],
          "detail": "保留平台业务编码与批次映射，按供应商任务约束导入号码。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "platform-edge-dispatch",
          "source": "platform-tasks",
          "target": "platform-workbench",
          "label": "任务关联 / 坐席执行",
          "points": [
            [
              745,
              419
            ],
            [
              830,
              419
            ]
          ],
          "lx": 788,
          "ly": 405,
          "status": "platform",
          "refs": [
            "API-305",
            "API-311"
          ],
          "detail": "按人工、预测与自动外呼各自流程执行；自动外呼接通后进入供应商语音流程。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "platform-edge-result",
          "source": "platform-tasks",
          "target": "platform-records",
          "label": "按任务关联话单",
          "points": [
            [
              595,
              473
            ],
            [
              595,
              630
            ]
          ],
          "lx": 595,
          "ly": 535,
          "status": "platform",
          "refs": [
            "API-318",
            "API-362"
          ],
          "detail": "关联原任务须账号、租户、通话类型、本地与供应商taskId一致；只有供应商ID时要求唯一匹配。冲突不改绑且不开放再次联系。关联任务设置在详细信息中折叠只读，使用原任务摘要；业务联系轮次与供应商重试轮次、最终呼叫标记分开。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "platform-edge-manual-record",
          "source": "platform-workbench",
          "target": "platform-records",
          "label": "人工 / 呼入结果",
          "points": [
            [
              980,
              473
            ],
            [
              980,
              570
            ],
            [
              705,
              570
            ],
            [
              705,
              630
            ]
          ],
          "lx": 820,
          "ly": 570,
          "status": "platform",
          "refs": [
            "API-317",
            "API-319"
          ],
          "detail": "人工外呼与呼入按各自话单字段解释，不能与预测话单套用同一状态表。",
          "rules": [
            "D-054 / SRC-084：呼入号码识别一般针对被呼叫的坐席绑定手机号，软电话大概率识别不到，并非绝对不支持。本项目按API-319响应status（人工接听、人工未接听、系统应答、系统未应答）展示接听结果；查询statuses数字1–4与响应值分开。识别只保留为可选补充，不用于判断来电客户号码状态或接听，不把坐席手机号未接识别成客户空号/停机；缺失识别不阻断呼入记录和报表。status缺失、非法或与时间证据冲突仍按原规则核对。sipCauseAsyncUpdateFlag只适用于预测话单；CF-13仅余自动外呼准确识别字段及编码对应。"
          ],
          "bidirectional": false,
          "relatedDecisionIds": [],
          "decisionId": "D-054",
          "sourceRefs": [
            "SRC-084"
          ],
          "sourceType": "user_relayed_supplier_feedback"
        },
        {
          "id": "platform-edge-metrics",
          "source": "platform-records",
          "target": "platform-reports",
          "label": "分类汇总口径",
          "points": [
            [
              445,
              684
            ],
            [
              360,
              684
            ]
          ],
          "lx": 403,
          "ly": 670,
          "status": "platform",
          "refs": [
            "API-317",
            "API-318",
            "API-319",
            "API-326"
          ],
          "detail": "按客户接通、坐席接通、通话时长及业务跟进等明确维度统计。",
          "rules": [
            "D-050 / SRC-080：供应商话单只记cno、不记坐席主键；删除不清除历史话单，按cno查询或报表会合并新旧通话。仅凭话单不能精确拆分同工号的新旧坐席身份，不将旧记录改写归属新坐席。",
            "D-054 / SRC-084：呼入号码识别一般针对被呼叫的坐席绑定手机号，软电话大概率识别不到，并非绝对不支持。本项目按API-319响应status（人工接听、人工未接听、系统应答、系统未应答）展示接听结果；查询statuses数字1–4与响应值分开。识别只保留为可选补充，不用于判断来电客户号码状态或接听，不把坐席手机号未接识别成客户空号/停机；缺失识别不阻断呼入记录和报表。status缺失、非法或与时间证据冲突仍按原规则核对。sipCauseAsyncUpdateFlag只适用于预测话单；CF-13仅余自动外呼准确识别字段及编码对应。"
          ],
          "bidirectional": false,
          "relatedDecisionIds": [
            "D-050"
          ],
          "decisionId": "D-054",
          "sourceRefs": [
            "SRC-080",
            "SRC-084"
          ],
          "sourceType": "user_relayed_supplier_feedback"
        },
        {
          "id": "platform-edge-adapter-business",
          "source": "platform-gateway",
          "target": "platform-records",
          "label": "规范化话单 / 媒体",
          "points": [
            [
              315,
              895
            ],
            [
              315,
              795
            ],
            [
              505,
              795
            ],
            [
              505,
              738
            ]
          ],
          "lx": 355,
          "ly": 795,
          "status": "platform",
          "refs": [
            "API-317",
            "API-318",
            "API-319",
            "API-320",
            "DOC-346"
          ],
          "detail": "适配层将不同来源结果规范化并保留原始数据，业务层按租户范围展示。",
          "rules": [
            "D-054 / SRC-084：呼入号码识别一般针对被呼叫的坐席绑定手机号，软电话大概率识别不到，并非绝对不支持。本项目按API-319响应status（人工接听、人工未接听、系统应答、系统未应答）展示接听结果；查询statuses数字1–4与响应值分开。识别只保留为可选补充，不用于判断来电客户号码状态或接听，不把坐席手机号未接识别成客户空号/停机；缺失识别不阻断呼入记录和报表。status缺失、非法或与时间证据冲突仍按原规则核对。sipCauseAsyncUpdateFlag只适用于预测话单；CF-13仅余自动外呼准确识别字段及编码对应。"
          ],
          "bidirectional": false,
          "relatedDecisionIds": [],
          "decisionId": "D-054",
          "sourceRefs": [
            "SRC-084"
          ],
          "sourceType": "user_relayed_supplier_feedback"
        },
        {
          "id": "platform-edge-adapter-audit",
          "source": "platform-gateway",
          "target": "platform-audit",
          "label": "请求与结果留痕",
          "points": [
            [
              360,
              949
            ],
            [
              445,
              949
            ]
          ],
          "lx": 403,
          "ly": 934,
          "status": "platform",
          "refs": [
            "API-326"
          ],
          "detail": "将请求、回执和异步结果关联到平台操作记录。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "platform-edge-record-audit",
          "source": "platform-records",
          "target": "platform-audit",
          "label": "异常 / 待核对",
          "points": [
            [
              595,
              738
            ],
            [
              595,
              895
            ]
          ],
          "lx": 595,
          "ly": 802,
          "status": "platform",
          "refs": [
            "API-315",
            "API-316",
            "API-325"
          ],
          "detail": "未收齐结果、无法判定或状态契约缺失时保留待核对项。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "platform-edge-rule-adapter",
          "source": "platform-gateway",
          "target": "platform-inbound-rules",
          "label": "路由接口适配",
          "points": [
            [
              210,
              1003
            ],
            [
              210,
              1180
            ]
          ],
          "lx": 210,
          "ly": 1090,
          "status": "platform",
          "refs": [
            "API-350",
            "API-351",
            "API-352",
            "API-353",
            "API-354"
          ],
          "detail": "账号级权限、资源与目标字段校验后调用ivrRouter；待确认分支不阻断已明确CRUD。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "platform-edge-business-snapshot",
          "source": "platform-records",
          "target": "platform-business-info",
          "label": "通话快照与资料汇总",
          "points": [
            [
              745,
              690
            ],
            [
              790,
              690
            ],
            [
              790,
              1090
            ],
            [
              595,
              1090
            ],
            [
              595,
              1180
            ]
          ],
          "lx": 790,
          "ly": 1040,
          "status": "platform",
          "refs": [
            "API-326"
          ],
          "detail": "D-038：通话中逐项暂存，结束后确认或已结束详情补录才正式保存同一份当次业务快照；档案仅汇总当前权限下已保存信息。草稿和业务字段不发送供应商。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "platform-edge-repair-audit",
          "source": "platform-audit",
          "target": "platform-config-records",
          "label": "关联处理记录",
          "points": [
            [
              745,
              950
            ],
            [
              790,
              950
            ],
            [
              790,
              1120
            ],
            [
              980,
              1120
            ],
            [
              980,
              1180
            ]
          ],
          "lx": 980,
          "ly": 1095,
          "status": "platform",
          "refs": [],
          "detail": "配置纠正关联原记录，原失败原因、最新结果及处理历史分开；原型不保证全部动作已有统一审计。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "platform-edge-entry-scope",
          "source": "platform-permissions",
          "target": "platform-workbench-entry",
          "label": "本人关联与入口",
          "points": [
            [
              445,
              154
            ],
            [
              390,
              154
            ],
            [
              390,
              1350
            ],
            [
              210,
              1350
            ],
            [
              210,
              1450
            ]
          ],
          "lx": 210,
          "ly": 1367,
          "status": "platform",
          "refs": [
            "API-326"
          ],
          "detail": "D-031：身份决定默认且唯一工作台入口，不改变业务权限；临时离线不切换工作台。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "platform-edge-workbench-receiving",
          "source": "platform-workbench",
          "target": "platform-receiving",
          "label": "同一工作台接听",
          "points": [
            [
              1130,
              419
            ],
            [
              1190,
              419
            ],
            [
              1190,
              1340
            ],
            [
              595,
              1340
            ],
            [
              595,
              1450
            ]
          ],
          "lx": 925,
          "ly": 1340,
          "status": "platform",
          "refs": [
            "API-303",
            "API-306",
            "API-326"
          ],
          "detail": "D-030 / D-038：复用来电抽屉和设备接听；人工接通后可边通话边记录，挂断后确认保存。来电、客户及电话会话均须匹配，按钮请求不是接通证据。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "platform-edge-receiving-repeat",
          "source": "platform-receiving",
          "target": "platform-repeat-contact",
          "label": "再次联系",
          "points": [
            [
              745,
              1504
            ],
            [
              830,
              1504
            ]
          ],
          "lx": 788,
          "ly": 1490,
          "status": "platform",
          "refs": [
            "API-326"
          ],
          "detail": "客户接通后未由人工接听或坐席约定再联系，原通话结束且原任务未结束，通过本任务防重校验后才追加下一次联系。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "platform-edge-repeat-task",
          "source": "platform-repeat-contact",
          "target": "platform-tasks",
          "label": "原任务追加名单",
          "points": [
            [
              830,
              1540
            ],
            [
              790,
              1540
            ],
            [
              790,
              490
            ],
            [
              745,
              490
            ],
            [
              745,
              419
            ]
          ],
          "lx": 910,
          "ly": 1408,
          "status": "platform",
          "refs": [
            "API-311",
            "API-312",
            "API-326"
          ],
          "detail": "保持原taskId并调用importTaskTel追加新批次，isRepeat=0、importTelAutoStart=0；沿用原任务配置和调度，暂停继续先get确认2再start并回查，已结束不重开。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "platform-edge-receiving-record",
          "source": "platform-receiving",
          "target": "platform-records",
          "label": "原通话与业务结果",
          "points": [
            [
              445,
              1540
            ],
            [
              410,
              1540
            ],
            [
              410,
              760
            ],
            [
              445,
              760
            ],
            [
              445,
              684
            ]
          ],
          "lx": 515,
          "ly": 1380,
          "status": "platform",
          "refs": [
            "API-318",
            "API-319",
            "API-326"
          ],
          "detail": "D-038：客户接通与人工接听独立留证；通话中填写仅暂存。结束后确认正式保存处理结果及业务快照，才精确同步原任务客户行、客户档案及报表。",
          "rules": [
            "D-054 / SRC-084：呼入号码识别一般针对被呼叫的坐席绑定手机号，软电话大概率识别不到，并非绝对不支持。本项目按API-319响应status（人工接听、人工未接听、系统应答、系统未应答）展示接听结果；查询statuses数字1–4与响应值分开。识别只保留为可选补充，不用于判断来电客户号码状态或接听，不把坐席手机号未接识别成客户空号/停机；缺失识别不阻断呼入记录和报表。status缺失、非法或与时间证据冲突仍按原规则核对。sipCauseAsyncUpdateFlag只适用于预测话单；CF-13仅余自动外呼准确识别字段及编码对应。"
          ],
          "bidirectional": false,
          "relatedDecisionIds": [],
          "decisionId": "D-054",
          "sourceRefs": [
            "SRC-084"
          ],
          "sourceType": "user_relayed_supplier_feedback"
        },
        {
          "id": "platform-edge-account-tenant",
          "source": "platform-account-directory",
          "target": "platform-account-scope",
          "label": "关联使用",
          "points": [
            [
              360,
              1774
            ],
            [
              445,
              1774
            ]
          ],
          "lx": 403,
          "ly": 1760,
          "status": "platform",
          "refs": [],
          "detail": "账号先保存，再从独立租户管理表单选择启用账号并另次保存关联；不是账号详情中的管理跳转。租户创建失败时已登记账号保留。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "platform-edge-account-history",
          "source": "platform-account-scope",
          "target": "platform-account-history",
          "label": "归属核验",
          "points": [
            [
              745,
              1774
            ],
            [
              830,
              1774
            ]
          ],
          "lx": 788,
          "ly": 1760,
          "status": "platform",
          "refs": [],
          "detail": "按账号和明确租户关联读取历史。租户会话快照与账号目录分别持久保存，不能宣称为跨存储事务。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "platform-edge-context-directory",
          "source": "platform-context",
          "target": "platform-account-directory",
          "label": "本地维护明细",
          "points": [
            [
              1130,
              180
            ],
            [
              1190,
              180
            ],
            [
              1190,
              1625
            ],
            [
              210,
              1625
            ],
            [
              210,
              1720
            ]
          ],
          "lx": 910,
          "ly": 1625,
          "status": "platform",
          "refs": [],
          "detail": "上方身份映射使用本地账号目录；下方展开当前账号维护、使用及历史模块。真实供应商访问仍经独立接口适配。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "platform-edge-tenant-queue",
          "source": "platform-account-scope",
          "target": "platform-queue-config",
          "label": "账号及租户范围",
          "points": [
            [
              595,
              1828
            ],
            [
              595,
              1890
            ],
            [
              210,
              1890
            ],
            [
              210,
              1980
            ]
          ],
          "lx": 385,
          "ly": 1890,
          "status": "platform",
          "refs": [],
          "detail": "一个企业账号仅0或1个业务租户，内置超级租户除外；队列通过多个技能组关联成员，本地权限不等于供应商自动租户隔离。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "platform-edge-queue-check",
          "source": "platform-queue-config",
          "target": "platform-queue-check",
          "label": "保存后再核对",
          "points": [
            [
              360,
              2034
            ],
            [
              445,
              2034
            ]
          ],
          "lx": 403,
          "ly": 2020,
          "status": "platform",
          "refs": [
            "API-380",
            "API-382",
            "DOC-342"
          ],
          "detail": "本地绑定或模拟配置保存成功只标待核对；技能映射与实际成员各自验证，不伪造同步完成。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "platform-edge-strategy-task",
          "source": "platform-predictive-strategy",
          "target": "platform-tasks",
          "label": "任务字段贯通",
          "points": [
            [
              1130,
              2034
            ],
            [
              1190,
              2034
            ],
            [
              1190,
              282
            ],
            [
              595,
              282
            ],
            [
              595,
              365
            ]
          ],
          "lx": 995,
          "ly": 1890,
          "status": "platform",
          "refs": [
            "API-311"
          ],
          "detail": "预测任务独立callStrategy贯通创建、模板、复制和启动快照，原任务再次联系沿用现值；不把queue.strategy或队列优先级直接赋给任务。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "platform-edge-seat-runtime-business",
          "source": "platform-seat-runtime",
          "target": "platform-seat-business",
          "label": "话务与业务独立",
          "points": [
            [
              360,
              2304
            ],
            [
              445,
              2304
            ]
          ],
          "lx": 402,
          "ly": 2290,
          "status": "platform",
          "refs": [
            "API-304",
            "API-306"
          ],
          "detail": "正式记录保存成功且业务phase=idle后自动unpause；成功才ready。失败保留已存业务可重试，未知先核对不重放，确认ready且无未完成通话和连接异常后解除保护。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "platform-edge-seat-runtime-monitor",
          "source": "platform-seat-business",
          "target": "platform-seat-monitor",
          "label": "另验班长资格",
          "points": [
            [
              745,
              2304
            ],
            [
              830,
              2304
            ]
          ],
          "lx": 788,
          "ly": 2290,
          "status": "platform",
          "refs": [
            "API-304"
          ],
          "detail": "个人电话权限不会授予监控他人的权限；必须核验供应商班长资格与本租户队列。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "platform-edge-workbench-runtime",
          "source": "platform-workbench",
          "target": "platform-seat-runtime",
          "label": "本人电话操作",
          "points": [
            [
              1130,
              419
            ],
            [
              1175,
              419
            ],
            [
              1175,
              2150
            ],
            [
              210,
              2150
            ],
            [
              210,
              2250
            ]
          ],
          "lx": 620,
          "ly": 2140,
          "status": "platform",
          "refs": [
            "API-302",
            "API-304",
            "API-306"
          ],
          "detail": "SC/SEQ-220/221与CAP-SEAT-01～09作为FS-12/DEV-12新增运行能力；旧82功能编号不代替本轮验收。",
          "rules": [
            "D-052 / SRC-082（2026-09-20，user_relayed_supplier_feedback）：breakLine的code=-1为连接断开，code=0为重连成功；SDK自动最多20次重连，每次回调，超过需重新登录。平台不另建重连循环、不按回调次数推断耗尽；sipDisconnected为无参软电话中断通知，坐席需重新登录。",
            "D-052：breakLine code=0仅证明信令重连，不证明媒体可用或原通话恢复。事件绑定当前有效会话，旧会话事件不影响新登录；保留通话、草稿和未知操作保护。原型待通话及记录处理完成后可由本人主动重登，成功暂停接听并需明确恢复；这一保护不等于官方要求所有信令恢复均强制重登。CF-11仍保留跨设备互斥、异常退出清理、媒体就绪与最终状态核验，以及setOffline回执矛盾。"
          ],
          "bidirectional": false,
          "relatedDecisionIds": [],
          "decisionId": "D-052",
          "sourceRefs": [
            "SRC-082"
          ],
          "sourceType": "user_relayed_supplier_feedback"
        },
        {
          "id": "platform-edge-outbound-task",
          "source": "platform-outbound-groups",
          "target": "platform-tasks",
          "label": "外呼组号与成员快照",
          "points": [
            [
              210,
              2520
            ],
            [
              8,
              2520
            ],
            [
              8,
              267
            ],
            [
              595,
              267
            ],
            [
              595,
              365
            ]
          ],
          "lx": 385,
          "ly": 266,
          "status": "platform",
          "refs": [
            "API-311"
          ],
          "detail": "callGroupType=2使用agentGroup；独立于接听队列和预测任务callStrategy。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "platform-edge-pending-effective",
          "source": "platform-pending-skills",
          "target": "platform-resources",
          "label": "下线提交后生效",
          "points": [
            [
              595,
              2520
            ],
            [
              1185,
              2520
            ],
            [
              1185,
              684
            ],
            [
              1130,
              684
            ]
          ],
          "lx": 1065,
          "ly": 2428,
          "status": "platform",
          "refs": [
            "API-309"
          ],
          "detail": "在线追加仅本地暂存，提交接口仍按全量替换与逐工号结果确认。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "platform-edge-phone-login",
          "source": "platform-seat-phone-config",
          "target": "platform-seat-runtime",
          "label": "保存分机供本人上线",
          "points": [
            [
              210,
              2790
            ],
            [
              18,
              2790
            ],
            [
              18,
              2304
            ],
            [
              60,
              2304
            ]
          ],
          "lx": 145,
          "ly": 2688,
          "status": "platform",
          "refs": [
            "API-304"
          ],
          "detail": "分机在系统管理的独立分机管理中创建或导入，坐席只选择本企业本租户启用且未占用的type=2软电话；登录前再核对。目录type=2与login.bindType=3分别解释，不以工号推算分机。 点击坐席登录即在同一面板选择工作模式0/4/5及登录状态，再直接提交login；每次普通登录都须重新选模式（D-072）。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "platform-edge-grants-references",
          "source": "platform-number-grants",
          "target": "platform-number-references",
          "label": "读取当前业务引用",
          "points": [
            [
              745,
              2844
            ],
            [
              830,
              2844
            ]
          ],
          "lx": 788,
          "ly": 2830,
          "status": "platform",
          "refs": [],
          "detail": "号码自动归属唯一业务租户，引用只读核对，不改变技能成员、队列关系或呼入路由。",
          "rules": [
            "D-048 / SRC-078（user_relayed_supplier_feedback_and_scope_decision）：供应商号码停用后后续选号不再使用该号码，已发起通话正常继续。用户取消供应商账号解绑接口及查证需求，改为本地停用后不再使用该号码外呼；本地开关不解除供应商资源、不停止呼入路由、不强制挂断，历史保留。"
          ],
          "bidirectional": false,
          "decisionId": "D-048",
          "sourceRefs": [
            "SRC-078"
          ],
          "sourceType": "user_relayed_supplier_feedback_and_scope_decision"
        },
        {
          "id": "platform-edge-category-records",
          "source": "platform-business-categories",
          "target": "platform-business-info",
          "label": "动态表单与保存",
          "points": [
            [
              60,
              3122
            ],
            [
              22,
              3122
            ],
            [
              22,
              1340
            ],
            [
              595,
              1340
            ],
            [
              595,
              1288
            ]
          ],
          "lx": 210,
          "ly": 2990,
          "status": "platform",
          "refs": [
            "API-326"
          ],
          "detail": "D-085：客户管理仅设业务分类菜单，同页维护分类和独立字段库；取消业务模板。分类在 enterpriseId + tenantId 内以有序fields数组直接引用稳定fieldId，每项包含enabled、required，数组位置决定顺序。分类可零字段，线索分类须直接含六项预置统计字段；不同分类可共用字段定义但各自配置显示与必填。导入采用启用分类，通话按分类字段加载；草稿可空，正式保存校验。原型不迁移旧模板。字段/选项选填businessKey仅作本地外部映射，不替代内部ID、不发送AliCti。 正式值同步通话详情和按业务/单据分组的客户档案。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "platform-edge-directory-selection",
          "source": "platform-extension-directory",
          "target": "platform-seat-phone-config",
          "label": "受控分机候选",
          "points": [
            [
              595,
              3068
            ],
            [
              595,
              2980
            ],
            [
              210,
              2980
            ],
            [
              210,
              2898
            ]
          ],
          "lx": 415,
          "ly": 2966,
          "status": "platform",
          "refs": [
            "DOC-355",
            "API-304"
          ],
          "detail": "分机在系统管理的独立分机管理中创建或导入，坐席只选择本企业本租户启用且未占用的type=2软电话；登录前再核对。目录type=2与login.bindType=3分别解释，不以工号推算分机。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "platform-edge-condition-task",
          "source": "platform-time-conditions",
          "target": "platform-tasks",
          "label": "允许 / 禁呼条件",
          "points": [
            [
              1130,
              3122
            ],
            [
              1188,
              3122
            ],
            [
              1188,
              490
            ],
            [
              740,
              490
            ],
            [
              740,
              473
            ]
          ],
          "lx": 1080,
          "ly": 3000,
          "status": "platform",
          "refs": [
            "DOC-356",
            "API-311"
          ],
          "detail": "任务字段映射和启动/继续时复检当前条件；本方租户权限不作为供应商参数。",
          "rules": [],
          "bidirectional": false
        }
      ]
    },
    {
      "id": "adapter",
      "name": "接口适配层模块关系",
      "short": "接口适配层",
      "subtitle": "浏览器桥接与后台适配分开；命令、事件、话单、媒体按各自节奏处理。",
      "width": 1200,
      "height": 2740,
      "groups": [
        {
          "name": "浏览器内",
          "x": 30,
          "y": 25,
          "w": 335,
          "h": 222,
          "tone": "neutral",
          "note": ""
        },
        {
          "name": "服务端 · 访问控制与鉴权",
          "x": 395,
          "y": 25,
          "w": 765,
          "h": 222,
          "tone": "platform",
          "note": ""
        },
        {
          "name": "服务端 · 供应商命令适配",
          "x": 30,
          "y": 310,
          "w": 1130,
          "h": 210,
          "tone": "platform",
          "note": ""
        },
        {
          "name": "服务端 · 结果接入与查询",
          "x": 30,
          "y": 580,
          "w": 1130,
          "h": 210,
          "tone": "platform",
          "note": ""
        },
        {
          "name": "服务端 · 关联、映射与可用性",
          "x": 30,
          "y": 850,
          "w": 1130,
          "h": 220,
          "tone": "platform",
          "note": ""
        },
        {
          "name": "呼入路由与来电身份适配",
          "x": 30,
          "y": 1120,
          "w": 1130,
          "h": 190,
          "tone": "platform",
          "note": ""
        },
        {
          "name": "本地原型与生产接入边界",
          "x": 30,
          "y": 1370,
          "w": 1130,
          "h": 215,
          "tone": "platform",
          "note": ""
        },
        {
          "name": "队列契约与核对 · 当前模拟 / 生产目标分开",
          "x": 30,
          "y": 1640,
          "w": 1130,
          "h": 235,
          "tone": "platform",
          "note": ""
        },
        {
          "name": "坐席运行契约与回执边界",
          "x": 30,
          "y": 1920,
          "w": 1130,
          "h": 240,
          "tone": "platform",
          "note": "ADP-30～32 · 模拟传输与生产SDK接入明确分开"
        },
        {
          "name": "外呼组适配 · 公开契约与本地保护",
          "x": 30,
          "y": 2210,
          "w": 1130,
          "h": 220,
          "tone": "platform",
          "note": ""
        },
        {
          "name": "分机和时间条件资源适配",
          "x": 30,
          "y": 2490,
          "w": 1130,
          "h": 205,
          "tone": "platform",
          "note": "公开参数与本地租户使用权限分开"
        }
      ],
      "nodes": [
        {
          "id": "adapter-sdk",
          "key": "sdk",
          "title": "CTILink / WebRTC 桥接",
          "subtitle": "登录事件 · 会话操作 · 媒体状态",
          "x": 50,
          "y": 110,
          "w": 295,
          "h": 108,
          "status": "platform",
          "scope": "浏览器设计",
          "refs": [
            "API-302",
            "API-303",
            "API-304",
            "API-305",
            "API-306"
          ],
          "role": "封装工具条初始化、事件监听、短期登录、人工外呼和软电话操作。",
          "inputs": [
            "短期 sessionKey 与 agentGateWayUrl"
          ],
          "outputs": [
            "会话事件与媒体准备状态"
          ],
          "rules": [
            "先初始化并注册事件，再取得短期材料登录。",
            "长期 token 不进入浏览器；媒体连接不经后台业务接口中转。",
            "D-026：previewOutcall.obClid决定本通向客户显示的号码；Agent.login.bindTel/bindType用于坐席接听设备，不能混用。",
            "D-042 / D-071：AliCtiSeatOperations只构造本地SDK模拟请求和回执；真实软电话、权限及事件需CF-11联调；changeWorkingMode的Agent/AgentTask命名差异不阻断。",
            "D-052 / SRC-082（2026-09-20，user_relayed_supplier_feedback）：breakLine的code=-1为连接断开，code=0为重连成功；SDK自动最多20次重连，每次回调，超过需重新登录。平台不另建重连循环、不按回调次数推断耗尽；sipDisconnected为无参软电话中断通知，坐席需重新登录。",
            "D-052：breakLine code=0仅证明信令重连，不证明媒体可用或原通话恢复。事件绑定当前有效会话，旧会话事件不影响新登录；保留通话、草稿和未知操作保护。原型待通话及记录处理完成后可由本人主动重登，成功暂停接听并需明确恢复；这一保护不等于官方要求所有信令恢复均强制重登。CF-11仍保留跨设备互斥、异常退出清理、媒体就绪与最终状态核验，以及setOffline回执矛盾。"
          ],
          "identifiers": [],
          "drill": null,
          "relatedDecisionIds": [],
          "decisionId": "D-052",
          "sourceRefs": [
            "SRC-082"
          ],
          "sourceType": "user_relayed_supplier_feedback"
        },
        {
          "id": "adapter-guard",
          "key": "guard",
          "title": "身份与资源校验",
          "subtitle": "用户 → 租户 → 账号 → 坐席",
          "x": 420,
          "y": 110,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "本方设计",
          "refs": [
            "API-302",
            "API-326"
          ],
          "role": "核验当前操作主体、租户、业务权限与可用资源映射。",
          "inputs": [],
          "outputs": [
            "最小必要的供应商账号、坐席及操作上下文"
          ],
          "rules": [
            "同账号唯一业务租户的事件、话单仍按角色、坐席和对象权限过滤。"
          ],
          "identifiers": [
            "平台用户",
            "租户 ID",
            "enterpriseId",
            "cno"
          ],
          "drill": null
        },
        {
          "id": "adapter-auth",
          "key": "auth",
          "title": "服务端签名与短效鉴权",
          "subtitle": "部门 token 保管 · sessionKey",
          "x": 810,
          "y": 110,
          "w": 320,
          "h": 108,
          "status": "platform",
          "scope": "本方设计",
          "refs": [
            "API-301",
            "API-302"
          ],
          "role": "保管长期部门 token，生成对应签名并申请坐席短期登录材料。",
          "inputs": [],
          "outputs": [
            "接口签名",
            "有效期 30 秒的 sessionKey"
          ],
          "rules": [
            "MD5 签名为 enterpriseId + 秒级时间戳 + 部门 token，32 位小写；时间戳有效 30 分钟。",
            "/cc 系列鉴权按各自文档单独核对。"
          ],
          "identifiers": [],
          "drill": null
        },
        {
          "id": "adapter-resources",
          "key": "resources",
          "title": "资源命令适配",
          "subtitle": "只读同步 · 技能写入 · 号码启停",
          "x": 60,
          "y": 385,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "本方设计",
          "refs": [
            "API-307",
            "API-308",
            "API-309",
            "API-310",
            "API-324"
          ],
          "role": "分别适配坐席单个/批量新增、已有席query/get、离线配置修改、技能全量替换、号码查询与batchUpdateNumber。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "技能列表为全量替换，skillIds=0 表示清空。",
            "连续工号batchCreate最多100个；号码只改status或变化用途。分机改配、技能等级修改、技能移除及正式提交须下线；在线仅追加新技能时保存待提交，由管理员下线后手动提交。",
            "D-022已有坐席仅query/get同步并本地分配租户，不调用create。",
            "D-026：enterpriseHotline/listPage是只读查询；同步已有号码只新增平台台账，NumberGrant本地使用权限不进入供应商请求。",
            "号码启停和用途另由batchUpdateNumber写入并查询核对；其addHybridGroupId/removeHybridGroupId指号码池，不能填技能组ID。",
            "新号码开通由供应商办理；D-048 / SRC-078确认停用后不再选用该号码、已发起通话正常继续；供应商账号解绑需求取消，本地使用开关独立控制后续外呼。",
            "D-033：listPage 返回原始字段，导入只写平台台账。保存前按所选完整号码复查；不调用供应商号码创建、用途修改或绑定接口。",
            "D-046 / SRC-076：号码当前按D-068自动归属唯一业务租户；本地软电话分机管理保留；旧号码—技能—坐席绑定不再采用，其他历史规则与公开接口原字段含义保持独立。",
            "D-048 / SRC-078（user_relayed_supplier_feedback_and_scope_decision）：供应商号码停用后后续选号不再使用该号码，已发起通话正常继续。用户取消供应商账号解绑接口及查证需求，改为本地停用后不再使用该号码外呼；本地开关不解除供应商资源、不停止呼入路由、不强制挂断，历史保留。",
            "D-050 / SRC-080（user_relayed_supplier_feedback）：坐席按主键物理删除；工号只在当前仍存在的坐席中唯一。重建同工号为新坐席，生成新id/createTime，旧技能、队列成员、绑定电话清除。当前身份与本地配置不可仅凭相同cno自动继承；本次不迁移历史数据。",
            "D-051 / SRC-081（2026-09-20，user_relayed_supplier_feedback）：success为主记录建成数，other为其中技能绑定失败子集，不与success相加；fail与success互斥。cnos含全部已建成工号（含other），申请工号区间减去cnos为未建成工号。未传skillIds时other=0；对cnos逐项queryAgentSkill，缺少目标skillId可定位other，查询本身不证明主记录新建。",
            "D-051 / SRC-081：创建结果未知时，agent/query按原cnos读取id/createTime，可使用startTime/endTime；新id且createTime处于本次请求窗口才证实本次主记录。agent/get与queryCnoAndName只证存在，queryAgentSkill只证技能。查询证据不足继续未知，不自动重放写入。CF-08已关闭，不意味着生产接口已联调。"
          ],
          "identifiers": [],
          "drill": null,
          "decisionId": "D-051",
          "sourceRefs": [
            "SRC-076",
            "SRC-078",
            "SRC-080",
            "SRC-081"
          ],
          "relatedDecisionIds": [
            "D-046",
            "D-048",
            "D-050"
          ],
          "sourceType": "user_relayed_supplier_feedback"
        },
        {
          "id": "adapter-tasks",
          "key": "tasks",
          "title": "任务命令适配",
          "subtitle": "创建 / 启停 / 查询 / 名单导入",
          "x": 445,
          "y": 385,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "本方设计",
          "refs": [
            "API-311",
            "API-312",
            "API-313",
            "API-314",
            "API-325"
          ],
          "role": "按任务类型处理创建、号码导入、暂停及结束，并记录指令与回执。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "autoStart按手工/预约配置生成0/1；importTelAutoStart显式0。",
            "暂停不传pauseDuration；继续先get确认原任务status=2，再start并get复查，已结束不重启；D-021确认结束后不再发起后续首次呼叫或重呼；D-047 / SRC-077用户转述供应商确认：暂停或结束只管任务，未发起呼叫不再发起；已发起拨号、振铃及通话正常进行，生成正常话单，回补原任务、客户及统计。",
            "D-041：配置、模板、复制、确认和启动快照保留callStrategy，原任务再次联系沿用现值；非法值阻止提交，不扩大cnos成员范围。",
            "D-047 / SRC-077（user_relayed_supplier_feedback）：暂停或结束只控制任务调度，未发起的首次呼叫和重呼不再发起；已发起的拨号、振铃和通话正常进行，正常话单继续归集。暂停可按get确认2→start→get继续；结束不重开，正常结果仅回补原历史与统计。本次为用户转述供应商答复，不代表官网更新或真实联调通过。",
            "D-060：新预测任务autoComplete=0，名单耗尽暂停；自动外呼为1。再次预外呼保持原taskId，importTaskTel仅追加新批次，isRepeat=0、importTelAutoStart=0；原任务已结束不重开。",
            "任务关联本租户可呼叫及禁呼时间条件；autoTaskType=1须选允许条件，autoTriggerTimeStrategy和timeStrategy以逗号连接ID，不能重复用于允许与禁止。草稿、模板、复制与启动/继续复检；原任务再次联系沿用现有条件，按需配置结束时间。",
            "本方只维护配置和引用保护，不实现本地时间调度；实际执行由供应商任务处理。",
            "任务向导的重呼配置未填完整时，仍可保存草稿、关闭或返回，保留已填和空值；下一步及确认创建时再严格校验必选呼叫状态、次数、间隔与计时依据，不因草稿未填全而阻断退出。",
            "D-064 / SRC-094：任务列表不展示内部配置名、版本或后续重呼。retryStrategy是规则，finishRetryFlag/telRetryRound只描述单条话单；不能据此推断任务后续安排，原任务待再次联系保留。",
            "D-073 / D-075：预外呼与自动外呼的创建确认、当前任务设置和查看管理共用本任务保存的名称、描述、供应商业务标签及通用配置；通话详情关联摘要只读。有原供应商taskId、权限有效、未结束且无待核对结果时，任务中心可见编辑名称、描述和业务标签等已采用且API-404列明的字段；只提交实际修改，DOC-334回查成功后更新当前配置与planSnapshot，并将编辑前设置副本写入taskSettingHistory。失败/未知保留原配置和输入，不回写已发生通话与客户记录。任务级语音流程名称优先本任务冻结快照，既有customerTimeout缺失显示未记录，新建默认30秒不反填历史。type、callGroupType、名单/排重和固定外显号不可改；自动任务不提交预测专用字段。API-404的ivrId/ivrName行与仅type=1生效章节冲突，已建type=2 IVR只读并列CF-17待供应商确认。运行中生效与省略字段语义待联调，复制新草稿仍可用。",
            "超级管理员（SUPER）在既有AliCti账号编辑的“外显导航”区维护callerNavigations:[{name,customerClidsGroup}]，可登记多个已存在AliCti导航；每行名称和标识必填，标识同账号唯一，不设置本地数量上限，不新增菜单或实体模块。目录是本地登记，移除条目不等于远端删除或停用。旧instance.customerClidsGroup单值仅在读取时兼容为一条，不自动重写；没有目录不推造候选。创建、草稿及复制的导航候选仅取当前账号目录，下拉显式单选一个，无自动首项默认。新提交前复核所选标识仍在目录，被移除须重选；名称改名不阻断，旧草稿有标识但无名称时只从匹配候选补名称。切换到另一个导航清空原clidPoolList，保留customerTimeout。现有官方材料只说明单次任务传一个导航标识，未确认同enterpriseId的导航数量上限或账号内查询接口；本地多行登记是D-070产品修正，不冒充供应商答复。目录移除不等于远端删除或停用，CF-15继续未决。",
            "D-078：任务创建与更新无任务级指定号码字段。导航字段在接口中可选；两类新建任务按本原型产品规则必选当前账号已有外显导航，task/create传customerClidsCategory=5、单个customerClidsGroup、可选clidPoolList及customerTimeout；API-312的taskTelList[].clid仅逐客户显式提供时可选，不从任务或批次设置推导。",
            "任务保存导航名称及标识、号码池和等待时间快照；callerNavigationName仅作本地名称快照、不传API，task/create仍只传单个String customerClidsGroup。账号目录改名或移除不回填已保存任务快照，也不覆写草稿及复制已有的名称；已创建任务和原任务再次联系保留快照及原taskId。创建确认、任务设置及复制采用一致字段；草稿和复制在新提交时复核当前账号目录，已移除标识须重选。通话详情仅展示话单实际外显号码，不能用池名称或本地挑选结果冒充供应商选号事实。",
            "号码池名称来自当前租户关联enterpriseId的AliCti hybridGroup/list；租户管理员可通过hybridGroup/create、delete、update维护本租户号码池，不把本地号码列表当成池。任务从本租户列表选池名，priority手动选填整数且数值越小越优先，留空省略。空池、同优先级选号和运行任务变更生效时点仍待CF-15确认，不承诺失败自动切池。本地停用仅能约束本地直接选号，不能保证AliCti外显导航号码池排除该号码；全局阻断须经供应商停用或排除机制核验。既有通话正常继续；此边界不增加异常入口。",
            "同一enterpriseId可登记多个AliCti线下提供的外显导航，一个导航可配合多个号码池。两类任务创建时从当前账号目录显式选择一个，提交customerClidsCategory=5及单个customerClidsGroup，可选多个clidPoolList。API-311/API-404只证明单次任务字段；导航查询、标识有效性与号码池选号见CF-15联调。",
            "预测任务minAvailableAgentCount默认10、范围1–10，任务内可用座席数低于阈值自动暂停。只有autoStart=1且确因座席不足暂停，人数恢复达阈值时自动启动；手工暂停、号码停用保护暂停、结束不恢复。自动外呼不配置该字段。API-311/API-404仅证明阈值、定时字段和不足自动暂停；恢复行为为用户转述，CF-18待真实联调。",
            "已建任务保留原customerClidsGroup及号码池快照。启动/继续时如所选导航已从当前账号目录移除，先阻断，再从原任务编辑以API-404 task/update提交新标识，经DOC-334 task/get回查同一taskId及可读值后启动。任务中心座席人数变化入口只作本地演示，不读取实时人数或执行供应商任务操作。"
          ],
          "identifiers": [
            "平台任务 ID",
            "taskId",
            "导入批次"
          ],
          "drill": null,
          "relatedDecisionIds": [
            "D-017",
            "D-021",
            "D-069",
            "D-070",
            "D-078",
            "D-081",
            "D-086"
          ],
          "decisionId": "D-086",
          "sourceRefs": [
            "SRC-077",
            "SRC-099",
            "SRC-100",
            "SRC-108",
            "SRC-109",
            "SRC-114"
          ],
          "sourceType": "user_relayed_supplier_feedback"
        },
        {
          "id": "adapter-ivr",
          "key": "ivr",
          "title": "IVR 资源与执行查询适配",
          "subtitle": "列表 · 详情 · 已执行节点",
          "x": 830,
          "y": 385,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "本方设计",
          "refs": [
            "API-322",
            "API-323",
            "DOC-348",
            "DOC-349"
          ],
          "role": "从ivrProfile/list取得资源，按当前账号、IVR类型和本地租户外呼授权筛选；选中id映射任务ivrId。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "list用于选择，listDetail用于查看定义；ivrFlow/query仅回查一次通话执行节点。",
            "列表不提供发布、版本或外呼适用性保证；流程由阿里侧维护。呼入路由CRUD另用ivrRouter接口；未定义的条件匹配与归属见CF-10。",
            "本通语音流程仅取话单ivrName/ivrId，不从任务所选流程推断。当前详情不展示虚构IVR版本、节点或本地补齐话单操作；公开ivrFlow/query能力不等于本通已取得执行节点。"
          ],
          "identifiers": [],
          "drill": null
        },
        {
          "id": "adapter-events",
          "key": "events",
          "title": "HTTP / 企业 WS 接入",
          "subtitle": "回推订阅 · 原始事件接收",
          "x": 60,
          "y": 655,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "本方设计",
          "refs": [
            "API-315",
            "API-316"
          ],
          "role": "按事件类型接收任务、话单、录音、ASR 等结果，记录来源、时间及原始载荷。",
          "inputs": [],
          "outputs": [
            "待校验的原始事件"
          ],
          "rules": [
            "企业 WS 默认可能包含全部坐席，须按平台映射分发。",
            "企业 WS 最大 10 路；重放和可靠性保证待确认。"
          ],
          "identifiers": [],
          "drill": null
        },
        {
          "id": "adapter-cdr",
          "key": "cdr",
          "title": "分类话单规范化",
          "subtitle": "人工 / 预测 / 自动 / 呼入",
          "x": 445,
          "y": 655,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "本方设计",
          "refs": [
            "API-317",
            "API-318",
            "API-319",
            "API-327",
            "API-362"
          ],
          "role": "分别解释四类话单的客户与坐席接听、时间和时长，保留原值并校验来源；共用解析供列表与详情读取。",
          "inputs": [],
          "outputs": [
            "分类话单、原始字段、号码识别输入"
          ],
          "rules": [
            "人工 upTime 对应坐席，预测 upTime 对应客户，不能共用解释。",
            "号码状态不能代替客户或坐席接通证据。",
            "D-050 / SRC-080：供应商话单只记cno、不记坐席主键；删除不清除历史话单，按cno查询或报表会合并新旧通话。仅凭话单不能精确拆分同工号的新旧坐席身份，不将旧记录改写归属新坐席。",
            "D-053 / SRC-083（2026-09-20）：预测外呼话单sipCauseAsyncUpdateFlag=1表示号码识别结果已异步写回本通sipCause，0表示同步；不是通话状态、等待中或识别必成功标志。识别依据电话提示音，可能无法识别；彩铃等场景可能补偿识别，约延迟1–2分钟，仅为经验范围，不是固定完成时限。迟到结果按账号及原通话键补充原sipCause，保留原始值和来源，不新增通话、不由本地触发重呼。 CF-13当前剩余范围按D-054仅保留自动外呼准确识别字段及编码对应。",
            "D-054 / SRC-084：呼入号码识别一般针对被呼叫的坐席绑定手机号，软电话大概率识别不到，并非绝对不支持。本项目按API-319响应status（人工接听、人工未接听、系统应答、系统未应答）展示接听结果；查询statuses数字1–4与响应值分开。识别只保留为可选补充，不用于判断来电客户号码状态或接听，不把坐席手机号未接识别成客户空号/停机；缺失识别不阻断呼入记录和报表。status缺失、非法或与时间证据冲突仍按原规则核对。sipCauseAsyncUpdateFlag只适用于预测话单；CF-13仅余自动外呼准确识别字段及编码对应。",
            "D-066 / SRC-096：列表、详情、任务内通话共用CloudCallRecords.display与AliCtiReportFacts，核验API-317/318/319/362类型、账号及显式供应商通话标识。接口来源对象存在时，raw或字段缺失、不合法或身份冲突不借本地接通/结束标签或时长补值；没有来源对象的纯本地演示仍可显示本地时间、工号和时长，不作为供应商事实。真实0秒保留，秒值只转换一次，按实际开始时间筛选。",
            "自动外呼显示客户接听时长，预测分别显示双方通话与客户接听时长；呼入分开系统应答、首次人工接听与首次进出队列。工号为String，实际队列只读qno/firstCallQno；cnoFlow/qnoFlow保留供应商值，不能以技能代替实际队列。",
            "关联原任务须账号、租户、通话类型、本地与供应商taskId一致；只有供应商ID时要求唯一匹配。冲突不改绑且不开放再次联系。关联任务设置在详细信息中折叠只读，使用原任务摘要；业务联系轮次与供应商重试轮次、最终呼叫标记分开。",
            "本通语音流程仅取话单ivrName/ivrId，不从任务所选流程推断。当前详情不展示虚构IVR版本、节点或本地补齐话单操作；公开ivrFlow/query能力不等于本通已取得执行节点。"
          ],
          "identifiers": [],
          "drill": null,
          "relatedDecisionIds": [
            "D-050",
            "D-053"
          ],
          "decisionId": "D-054",
          "sourceRefs": [
            "SRC-080",
            "SRC-083",
            "SRC-084"
          ],
          "sourceType": "user_relayed_supplier_feedback"
        },
        {
          "id": "adapter-media",
          "key": "media",
          "title": "录音 / RASR 结果适配",
          "subtitle": "链接有效期 · 文本与说话方",
          "x": 830,
          "y": 655,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "本方设计",
          "refs": [
            "API-320",
            "DOC-346"
          ],
          "role": "独立获取录音地址与 RASR 结果，处理空结果、未知结果及链接过期。",
          "inputs": [],
          "outputs": [
            "短期录音访问地址",
            "RASR 可用性及原始文本结果"
          ],
          "rules": [
            "录音地址默认 120 分钟有效，不能作为永久存储地址。",
            "RASR 0成功/-1失败；text与botText分别解析，按monitorSide区分说话方，机器人独立标记。"
          ],
          "identifiers": [],
          "drill": null
        },
        {
          "id": "adapter-reconcile",
          "key": "reconcile",
          "title": "事件关联与结果核对",
          "subtitle": "去重 · 乱序留存 · 租户过滤",
          "x": 60,
          "y": 925,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "本方设计",
          "refs": [
            "API-315",
            "API-316",
            "API-317",
            "API-318",
            "API-325",
            "API-326"
          ],
          "role": "设计本方事件去重、关联、乱序处理和核对机制，按权限归属到业务对象。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "本方去重不代表供应商承诺幂等。",
            "任务状态按 task/get 返回的 TaskProperty 解释；事件重复、乱序和操作关联仍需核验。"
          ],
          "identifiers": [
            "enterpriseId",
            "cno",
            "taskId",
            "callId / uniqueId（按接口）"
          ],
          "drill": null
        },
        {
          "id": "adapter-dictionary",
          "key": "dictionary",
          "title": "号码识别字典复用",
          "subtitle": "官方编码 + 原始描述",
          "x": 445,
          "y": 925,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "本方设计",
          "refs": [
            "API-317",
            "API-318",
            "API-327"
          ],
          "role": "直接复用号码状态识别编码，区分人工 SIP 字段与预测识别字段。",
          "inputs": [],
          "outputs": [
            "官方号码状态或保留原值的待确认提示"
          ],
          "rules": [
            "715 与 183 各有三条描述，不能自选唯一含义。",
            "人工仅有 SIP 183 时待确认；719 不证明本次呼叫已接通。",
            "API-327 是字段说明索引，不是可调用接口。"
          ],
          "identifiers": [],
          "drill": null
        },
        {
          "id": "adapter-availability",
          "key": "availability",
          "title": "能力与结果可用性",
          "subtitle": "可展示结果 / 待确认 / 待核对",
          "x": 830,
          "y": 925,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "本方设计",
          "refs": [
            "API-320",
            "DOC-346",
            "API-324",
            "API-325",
            "API-326"
          ],
          "role": "将明确结果提供给业务，将缺失契约、未就绪媒体及不确定结果保留为可见待处理项。",
          "inputs": [],
          "outputs": [
            "页面可用性提示、异常记录及核对入口"
          ],
          "rules": [
            "已有端点与资源、字段、结果待确认分别记录，不生成未核实的成功结果。",
            "页面展示模拟通过不代表真实联调通过。"
          ],
          "identifiers": [],
          "drill": null
        },
        {
          "id": "adapter-inbound-rules",
          "key": "inbound-rules",
          "title": "呼入路由适配",
          "subtitle": "创建 · 更新 · 查询 · 启停 · 删除",
          "x": 60,
          "y": 1180,
          "w": 300,
          "h": 108,
          "status": "documented",
          "scope": "本方设计",
          "refs": [
            "API-350",
            "API-351",
            "API-352",
            "API-353",
            "API-354",
            "DOC-355",
            "DOC-356",
            "DOC-357"
          ],
          "role": "序列化目标、优先级、状态及分号条件；兼容返回路由包装及资源列表。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "routerType1/2/3仅发ivrId/tel/exten，exten保留前导零。",
            "priority账号内唯一正整数，active显式，更新name不作重命名。",
            "CF-10仅未定义匹配与归属；失败未知保留原操作，不盲重放。"
          ],
          "identifiers": [],
          "drill": null
        },
        {
          "id": "adapter-receiving",
          "key": "receiving",
          "title": "来电身份与接听适配",
          "subtitle": "事件匹配 · sipLink · 软电话",
          "x": 445,
          "y": 1180,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "浏览器与平台边界",
          "refs": [
            "API-303",
            "API-306",
            "API-326"
          ],
          "role": "ADP-23 ReceiveAssignedCall 与 ADP-24 AnswerAssignedCall 对应 AliCtiReceiving；校验 offer 与状态事件，桥接本人接听意图；平台端仍需过滤企业级来源。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "D-030：按钮请求不作为接通证据；只有匹配 busyIb/busyOb 才推进人工接听状态。",
            "本项目固定软电话，通过sipLink请求接听；本地演示不代表真实工具条联调完成。",
            "同一原通话重复事件去重；身份、任务或条目不匹配拒绝回写；刷新恢复仍保持当前工作范围。"
          ],
          "identifiers": [
            "enterpriseId、tenantId、accountId、String cno",
            "contactId/callId",
            "taskId + customerTaskItemId"
          ],
          "drill": null
        },
        {
          "id": "adapter-local-directory",
          "key": "local-directory",
          "title": "本地目录与恢复",
          "subtitle": "先账号后租户 · 版本 · 跨标签",
          "x": 60,
          "y": 1440,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "当前原型 · 已实现",
          "refs": [],
          "role": "AliCtiAccounts 在 AppState 之前恢复本地目录，随后恢复本标签的租户、成员和工作范围。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "D-037 · FA-153–FA-154 · A-20–A-21 · SC-217 / SEQ-217：在 Web Locks 独占锁内复核权限、会话、目录修订、对象版本及写入前原值；账号和配置审计同一快照提交。",
            "storage 事件只同步账号目录；租户、成员与业务快照不因此跨标签同步。失败不发布，损坏或倒退目录不自动覆盖。",
            "当前仅存配置状态，无真实 token、远端请求或供应商账号管理接口。"
          ],
          "identifiers": [
            "alicti-accounts-v1",
            "revision / version"
          ],
          "drill": null
        },
        {
          "id": "adapter-backend-config",
          "key": "backend-config",
          "title": "受控配置与凭据",
          "subtitle": "后端鉴权 · 数据库 · 凭据引用",
          "x": 445,
          "y": 1440,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "生产设计 · 未接入",
          "refs": [
            "API-301",
            "API-302"
          ],
          "role": "生产开发需将账号目录、权限复核、并发版本和事务落实到后端；长期凭据由服务端受控保管并按账号引用。",
          "inputs": [
            "账号元数据与已授权调用意图"
          ],
          "outputs": [
            "受控服务端账号配置与凭据引用"
          ],
          "rules": [
            "这是开发责任边界，当前原型没有该后端、凭据库或真实密钥写入。",
            "API-301 / API-302 只说明既有接口鉴权；不是供应商账号创建、开通或管理接口。",
            "当前无服务区域字段；真实部署地址与鉴权接入由生产环境配置，不能由演示账号保存推定。"
          ],
          "identifiers": [],
          "drill": null
        },
        {
          "id": "adapter-backend-execution",
          "key": "backend-execution",
          "title": "真实供应商接入",
          "subtitle": "签名调用 · 短期登录 · 结果核验",
          "x": 830,
          "y": 1440,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "生产设计 · 未接入",
          "refs": [
            "API-301",
            "API-302"
          ],
          "role": "生产适配取得受控账号及凭据后，复用上方签名、资源、任务和事件模块；以真实回执与查询结果核验连接。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "真实 token 留在服务端；浏览器仅接收已授权的短期登录材料。",
            "账号登记、启用、凭据配置勾选及本地保存成功，均不能作为供应商验证或开通成功证据。"
          ],
          "identifiers": [],
          "drill": null
        },
        {
          "id": "adapter-queue-contract",
          "key": "queue-contract",
          "title": "官方队列字段契约",
          "subtitle": "create / update · list / get",
          "x": 60,
          "y": 1720,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "当前纯适配 · 无网络",
          "refs": [
            "API-377",
            "API-378",
            "API-379",
            "API-380"
          ],
          "role": "AliCtiQueueContracts 校验完整新增必填字段、部分更新和查询返回；AliCtiQueues将合法字段封装为simulation请求并本地保存。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "新增必须有queue与queueSkills；真实providerSkillId或独立demoSkillId明确区分，本地SG-*不冒充供应商技能ID。",
            "strategy六个官方枚举；weight1–10值越大优先；排队20–600秒、应答20–60秒、整理3–3600秒、最大等待0–999且0不限。",
            "queue/update仅发送明确变化字段，省略queueSkills保留，提供则全量替换。retry是换下一坐席间隔，不是客户重呼。",
            "完整默认参数来源区分官方默认和本地配置选择；不宣称所有缺省值由供应商保证。",
            "joinEmpty按1/2/4/8/16多选位相加0～31；announceSound=1必填周期与文件，announcePosition=1/2必填不少于2的人数阈值；字段契约与条件校验以归档官方文档为准。"
          ],
          "identifiers": [],
          "drill": null
        },
        {
          "id": "adapter-queue-reconcile",
          "key": "queue-reconcile",
          "title": "技能与成员查询核对",
          "subtitle": "queueSkills + agent/query?qno",
          "x": 445,
          "y": 1720,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "生产目标 · 原型读样例",
          "refs": [
            "API-380",
            "API-382",
            "DOC-342"
          ],
          "role": "开发应回读队列技能与完整实际坐席列表，在当前租户范围内与平台有效成员比对；原型使用相互独立的供应商样例。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "queue/get解析data.queue及data.queueSkills；queue/list最多500条一页；agent/query按start/limit分页读取data.agents。",
            "不得将本地成员复制为供应商返回，也不得用一页结果宣称全部成员一致；未知及跨租户身份受限展示。",
            "技能ID匹配与成员匹配分别成立，核对时间/指纹不代表呼入路由或真实接听已验证。"
          ],
          "identifiers": [],
          "drill": null
        },
        {
          "id": "adapter-queue-execution",
          "key": "queue-execution",
          "title": "队列真实接入边界",
          "subtitle": "后端授权 · 签名 · 回读验收",
          "x": 830,
          "y": 1720,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "生产设计 · 未接入",
          "refs": [
            "API-301",
            "API-377",
            "API-378",
            "API-379",
            "API-380"
          ],
          "role": "开发后端按已授权enterpriseId签名调用，维护租户资源归属、并发版本、操作记录并回读供应商结果。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "当前浏览器没有供应商写操作；真实网络请求、服务端事务和超时未知结果处理属于开发验收。",
            "本地解绑不是queue/delete；本期无远端删除队列入口，多技能关联已采用queueSkill增删模拟请求，公开端点存在不代表产品已开放。",
            "ivrRouter仍按IVR/电话/分机目标；不补造直接qno目标字段，也不推断供应商内部调度拓扑。"
          ],
          "identifiers": [],
          "drill": null
        },
        {
          "id": "adapter-seat-commands",
          "key": "seat-commands",
          "title": "本人坐席命令适配",
          "subtitle": "ADP-30 · 参数校验与单命令提交",
          "x": 60,
          "y": 2000,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "本方SDK适配",
          "refs": [
            "API-302",
            "API-303",
            "API-304",
            "API-306"
          ],
          "role": "校验login/logout/pause/unpause/prolongWrapup/changeWorkingMode参数，登录固定软电话3、工作模式本人单选0/4/5，短期鉴权材料仅内存。",
          "inputs": [
            "当前可信本人坐席上下文与明确操作"
          ],
          "outputs": [
            "采用的SDK请求及结果证据"
          ],
          "rules": [
            "D-072：每次普通登录都由本人当次选择工作模式0/4/5及登录状态，未选模式不能提交且无默认模式隐式提交；分机由SeatPhoneConfig按完整坐席身份读取，提交前重验配置版本。旧设备/绑定号码偏好不改变登录；登录逗号多值不作为产品选择暴露。",
            "unpause不附业务参数；completeWrapup不是自造SDK命令。",
            "changeWorkingMode单值必选，登录后工具条即时切换，置忙可切，通话/振铃/整理/未知拒绝且保留原模式；changeBindTel不开放且不发请求。Agent/AgentTask命名差异不阻断本项目。",
            "本地软电话分机与cno、obClid分别处理。bindType=3属于工具条登录枚举，不能套用REST AgentInfo的bindTelType枚举。",
            "D-046 / SRC-076：号码当前按D-068自动归属唯一业务租户；本地软电话分机管理保留；旧号码—技能—坐席绑定不再采用，其他历史规则与公开接口原字段含义保持独立。",
            "D-052 / SRC-082（2026-09-20，user_relayed_supplier_feedback）：breakLine的code=-1为连接断开，code=0为重连成功；SDK自动最多20次重连，每次回调，超过需重新登录。平台不另建重连循环、不按回调次数推断耗尽；sipDisconnected为无参软电话中断通知，坐席需重新登录。",
            "D-052：breakLine code=0仅证明信令重连，不证明媒体可用或原通话恢复。事件绑定当前有效会话，旧会话事件不影响新登录；保留通话、草稿和未知操作保护。原型待通话及记录处理完成后可由本人主动重登，成功暂停接听并需明确恢复；这一保护不等于官方要求所有信令恢复均强制重登。CF-11仍保留跨设备互斥、异常退出清理、媒体就绪与最终状态核验，以及setOffline回执矛盾。",
            "分机在系统管理的独立分机管理中创建或导入，坐席只选择本企业本租户启用且未占用的type=2软电话；登录前再核对。目录type=2与login.bindType=3分别解释，不以工号推算分机。",
            "登录不要求选择技能或外显号码；人工拨号前另查分机isOb/callPower与当前租户号码权限，不能拿上线成功代替外呼资格。",
            "D-072：每次普通坐席登录均直接打开一次性登录面板；工作模式初始“请选择”，本人必须选0预览与预测同时、4预览外呼或5预测外呼；登录状态默认置闲，可改置忙并选填原因。点击“登录”直接提交login，取消不发请求，失败保留本次输入供重试；不先保存登录设置或沿用上次模式。断线重登是独立流程，沿用当前会话模式及暂停状态。",
            "D-071：登录后工具条直接显示工作模式下拉，在线即时调用CTILink.Agent.changeWorkingMode；置忙可切，通话、振铃、话后整理及未知结果期间拒绝。登录置忙后禁用主动预览外呼，须先置闲；模式4不接受预测分配，模式5禁用预览外呼。呼入与模式关系仍见CF-16。"
          ],
          "identifiers": [],
          "drill": null,
          "decisionId": "D-052",
          "sourceRefs": [
            "SRC-076",
            "SRC-082",
            "SRC-101",
            "SRC-102"
          ],
          "relatedDecisionIds": [
            "D-046",
            "D-071",
            "D-072"
          ],
          "sourceType": "user_relayed_supplier_feedback"
        },
        {
          "id": "adapter-seat-receipts",
          "key": "seat-receipts",
          "title": "请求与回执关联",
          "subtitle": "operationId / scope / cno / reqType",
          "x": 445,
          "y": 2000,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "本方一致性保护",
          "refs": [
            "API-304",
            "API-306"
          ],
          "role": "单操作pending，核对回执归属和明确成功码后才改变电话态；未知结果需查证，不自动重放。",
          "inputs": [],
          "outputs": [
            "成功、失败、未知或陈旧结果",
            "原电话态与已保存业务保持"
          ],
          "rules": [
            "缺code、未知code、错reqType、旧会话或旧范围回执不能应用到当前对象。",
            "失败保留已确认设置和整理期限；陈旧回执不能清除新操作pending。",
            "原型请求与回执mock:true且不执行真实SDK；开发目标需要真实传输与事件核验。",
            "D-052 / SRC-082（2026-09-20，user_relayed_supplier_feedback）：breakLine的code=-1为连接断开，code=0为重连成功；SDK自动最多20次重连，每次回调，超过需重新登录。平台不另建重连循环、不按回调次数推断耗尽；sipDisconnected为无参软电话中断通知，坐席需重新登录。",
            "D-052：breakLine code=0仅证明信令重连，不证明媒体可用或原通话恢复。事件绑定当前有效会话，旧会话事件不影响新登录；保留通话、草稿和未知操作保护。原型待通话及记录处理完成后可由本人主动重登，成功暂停接听并需明确恢复；这一保护不等于官方要求所有信令恢复均强制重登。CF-11仍保留跨设备互斥、异常退出清理、媒体就绪与最终状态核验，以及setOffline回执矛盾。"
          ],
          "identifiers": [],
          "drill": null,
          "relatedDecisionIds": [],
          "decisionId": "D-052",
          "sourceRefs": [
            "SRC-082"
          ],
          "sourceType": "user_relayed_supplier_feedback"
        },
        {
          "id": "adapter-seat-monitoring",
          "key": "seat-monitoring",
          "title": "班长监控结果过滤",
          "subtitle": "agentStatus/get · queueStatus",
          "x": 830,
          "y": 2000,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "本方授权适配",
          "refs": [
            "API-304",
            "DOC-395",
            "DOC-344"
          ],
          "role": "只读坐席状态逐工号使用DOC-344 agentStatus/get并按本租户范围过滤，后端控制查询频率；队列实时状态另核关联有效班长坐席、本人上线、供应商班长权限和授权qnos后调用queueStatus。",
          "inputs": [
            "qnos原字符串逗号连接",
            "显式fields白名单"
          ],
          "outputs": [
            "授权队列、可验证坐席与排队记录"
          ],
          "rules": [
            "fields只含queueParams/agentStatuses/queueEntries；空选择或非法字段拒绝。",
            "未知或跨租户队列、坐席、通话隐藏，不能由同enterpriseId扩大范围。",
            "失败不以旧数据显示新刷新成功；本期不增加监听、强插、转移等能力。",
            "DOC-395：setOffline返回示例的reqType写作setPause，与方法名不一致；实际返回关联须供应商澄清，详见CF-11。",
            "管理通过CTILink.Monitor.setPause/setUnpause/setOffline，monitoredCno原String，setOffline固定removeBinding=0；匹配回执后回查，不乐观更新，不泄露跨租户数据。",
            "agentStatus/get只返回单坐席状态快照，不能用来证明队列实况或管理资格；队列和Monitor写操作维持独立上线门禁。"
          ],
          "identifiers": [],
          "drill": null,
          "relatedDecisionIds": [
            "D-080"
          ],
          "decisionId": "D-082",
          "sourceRefs": [
            "SRC-110"
          ],
          "sourceType": "user_product_requirement_and_existing_interface_review"
        },
        {
          "id": "adapter-outbound-contract",
          "key": "outbound-contract",
          "title": "外呼组资料与成员适配",
          "subtitle": "agentGroup · 九项接口",
          "x": 60,
          "y": 2280,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "公开契约 · 本地模拟",
          "refs": [
            "API-386",
            "API-387",
            "API-388",
            "API-389",
            "API-390",
            "API-391",
            "API-392",
            "API-393",
            "API-394"
          ],
          "role": "按组资料增改查删与分配、移出、成员查询、坐席所属组查询分别适配，保留String gno/cno。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "官方返回包装分别解析，不能将本地数组包装冒充供应商响应；成功与失败回执逐操作核验。",
            "重新分配会使坐席移动到新组，提交前同时检查原组和目标组在途任务引用；原型失败不发布。"
          ],
          "identifiers": [],
          "drill": null
        },
        {
          "id": "adapter-outbound-task-selection",
          "key": "outbound-task-selection",
          "title": "任务接听范围适配",
          "subtitle": "cnos 或 agentGroup",
          "x": 445,
          "y": 2280,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "公开任务字段",
          "refs": [
            "API-311",
            "API-388",
            "API-393"
          ],
          "role": "按callGroupType构造明确接听范围，指定坐席使用cnos，外呼组使用gno对应agentGroup，并记录成员快照。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "队列qno、skillId、平台组ID均不是外呼组号。callStrategy保持独立。",
            "所选真实外呼组与成员可用性需要供应商回读；本地样例不保证真实执行。"
          ],
          "identifiers": [],
          "drill": null
        },
        {
          "id": "adapter-extension-api",
          "key": "extension-api",
          "title": "分机资源适配",
          "subtitle": "exten 查询 / 新增 / 修改 / 删除",
          "x": 60,
          "y": 2555,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "本方设计",
          "refs": [
            "DOC-355",
            "API-396",
            "API-397",
            "API-399"
          ],
          "role": "适配exten/list、create、update、batchDelete，保留String分机及值域；登录将受控分机映射bindTel。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "固定项目软电话type=2，创建密码仅进入必要请求；不存储明文、不返回到浏览器日志。",
            "tenantId归属是本方本地字段；配置/删除前本地引用及独占检查不等于供应商幂等保证。"
          ],
          "identifiers": [],
          "drill": null
        },
        {
          "id": "adapter-time-api",
          "key": "time-api",
          "title": "时间条件与任务适配",
          "subtitle": "enterpriseTime · task/create",
          "x": 445,
          "y": 2555,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "本方设计",
          "refs": [
            "DOC-356",
            "DOC-359",
            "API-400",
            "API-401",
            "API-402",
            "API-311"
          ],
          "role": "维护enterpriseTime/create/update/delete/list；任务适配把选中ID转换为允许和禁止字段。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "D-061：create提交手工维护的必填正整数priority，同enterpriseId内唯一；update以id定位，不传name，未传priority的局部更新保留旧值。本地租户范围不发供应商。",
            "任务逗号、呼入分号各自适配，不补造启停和使用位置字段。"
          ],
          "identifiers": [],
          "drill": null
        },
        {
          "id": "adapter-business-schema",
          "key": "business-schema",
          "title": "客户字段本地校验",
          "subtitle": "CustomerBusiness / CustomerFollowup",
          "x": 830,
          "y": 2555,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "本方设计",
          "refs": [
            "API-326"
          ],
          "role": "动态字典及必填校验属于本地业务层，不新增AliCti请求参数。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "D-085：客户管理仅设业务分类菜单，同页维护分类和独立字段库；取消业务模板。分类在 enterpriseId + tenantId 内以有序fields数组直接引用稳定fieldId，每项包含enabled、required，数组位置决定顺序。分类可零字段，线索分类须直接含六项预置统计字段；不同分类可共用字段定义但各自配置显示与必填。导入采用启用分类，通话按分类字段加载；草稿可空，正式保存校验。原型不迁移旧模板。字段/选项选填businessKey仅作本地外部映射，不替代内部ID、不发送AliCti。",
            "最终保存失败保留草稿和话后保护；成功后自动置闲与业务保存分别处理。"
          ],
          "identifiers": [],
          "drill": null
        }
      ],
      "edges": [
        {
          "id": "adapter-edge-check",
          "source": "adapter-guard",
          "target": "adapter-auth",
          "label": "核验后的调用上下文",
          "points": [
            [
              720,
              164
            ],
            [
              810,
              164
            ]
          ],
          "lx": 765,
          "ly": 150,
          "status": "platform",
          "refs": [
            "API-301",
            "API-302",
            "API-326"
          ],
          "detail": "平台校验通过后才生成签名或取得坐席登录材料。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "adapter-edge-short-key",
          "source": "adapter-auth",
          "target": "adapter-sdk",
          "label": "短期登录材料 → 浏览器（长期 token 留在服务端）",
          "points": [
            [
              970,
              218
            ],
            [
              970,
              277
            ],
            [
              198,
              277
            ],
            [
              198,
              218
            ]
          ],
          "lx": 550,
          "ly": 277,
          "status": "platform",
          "refs": [
            "API-302"
          ],
          "detail": "服务端申请 sessionKey 后交给已授权浏览器使用，其有效期仅 30 秒。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "adapter-edge-signed-resources",
          "source": "adapter-auth",
          "target": "adapter-resources",
          "label": "签名后的资源调用",
          "points": [
            [
              880,
              218
            ],
            [
              880,
              298
            ],
            [
              375,
              298
            ],
            [
              375,
              362
            ],
            [
              210,
              362
            ],
            [
              210,
              385
            ]
          ],
          "lx": 210,
          "ly": 368,
          "status": "platform",
          "refs": [
            "API-301",
            "API-307",
            "API-308",
            "API-309",
            "API-310"
          ],
          "detail": "查询与修改分开：listPage读取当前账号已开号码，平台同步及NumberGrant保存不产生供应商写入；启停/外显用途才按batchUpdateNumber提交。",
          "rules": [
            "D-051 / SRC-081（2026-09-20，user_relayed_supplier_feedback）：success为主记录建成数，other为其中技能绑定失败子集，不与success相加；fail与success互斥。cnos含全部已建成工号（含other），申请工号区间减去cnos为未建成工号。未传skillIds时other=0；对cnos逐项queryAgentSkill，缺少目标skillId可定位other，查询本身不证明主记录新建。",
            "D-051 / SRC-081：创建结果未知时，agent/query按原cnos读取id/createTime，可使用startTime/endTime；新id且createTime处于本次请求窗口才证实本次主记录。agent/get与queryCnoAndName只证存在，queryAgentSkill只证技能。查询证据不足继续未知，不自动重放写入。CF-08已关闭，不意味着生产接口已联调。"
          ],
          "bidirectional": false,
          "relatedDecisionIds": [],
          "decisionId": "D-051",
          "sourceRefs": [
            "SRC-081"
          ],
          "sourceType": "user_relayed_supplier_feedback"
        },
        {
          "id": "adapter-edge-signed-tasks",
          "source": "adapter-auth",
          "target": "adapter-tasks",
          "label": "签名后的任务调用",
          "points": [
            [
              930,
              218
            ],
            [
              930,
              323
            ],
            [
              595,
              323
            ],
            [
              595,
              385
            ]
          ],
          "lx": 595,
          "ly": 368,
          "status": "platform",
          "refs": [
            "API-301",
            "API-311",
            "API-312",
            "API-313",
            "API-314"
          ],
          "detail": "统一鉴权职责不改变各任务接口的受理、完成和状态查证边界。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "adapter-edge-signed-ivr",
          "source": "adapter-auth",
          "target": "adapter-ivr",
          "label": "签名后的 IVR 调用",
          "points": [
            [
              1050,
              218
            ],
            [
              1050,
              385
            ]
          ],
          "lx": 1050,
          "ly": 368,
          "status": "platform",
          "refs": [
            "API-301",
            "API-322",
            "API-323",
            "DOC-348",
            "DOC-349"
          ],
          "detail": "账号鉴权后分别读取流程列表、定义详情与单次执行轨迹；失败不以旧列表冒充新结果。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "adapter-edge-task-cdr",
          "source": "adapter-tasks",
          "target": "adapter-cdr",
          "label": "任务与话单关联",
          "points": [
            [
              595,
              493
            ],
            [
              595,
              655
            ]
          ],
          "lx": 595,
          "ly": 549,
          "status": "platform",
          "refs": [
            "API-318"
          ],
          "detail": "本方保存 taskId 与业务任务映射，按预测话单字段关联执行结果。",
          "rules": [
            "D-053 / SRC-083（2026-09-20）：预测外呼话单sipCauseAsyncUpdateFlag=1表示号码识别结果已异步写回本通sipCause，0表示同步；不是通话状态、等待中或识别必成功标志。识别依据电话提示音，可能无法识别；彩铃等场景可能补偿识别，约延迟1–2分钟，仅为经验范围，不是固定完成时限。迟到结果按账号及原通话键补充原sipCause，保留原始值和来源，不新增通话、不由本地触发重呼。 CF-13当前剩余范围按D-054仅保留自动外呼准确识别字段及编码对应。"
          ],
          "bidirectional": false,
          "relatedDecisionIds": [],
          "decisionId": "D-053",
          "sourceRefs": [
            "SRC-083"
          ],
          "sourceType": "user_relayed_supplier_feedback"
        },
        {
          "id": "adapter-edge-pending-command",
          "source": "adapter-tasks",
          "target": "adapter-availability",
          "label": "任务状态 / 正常话单",
          "points": [
            [
              745,
              458
            ],
            [
              787,
              458
            ],
            [
              787,
              888
            ],
            [
              980,
              888
            ],
            [
              980,
              925
            ]
          ],
          "lx": 935,
          "ly": 825,
          "status": "platform",
          "refs": [
            "API-325"
          ],
          "detail": "D-017：继续先get确认原任务暂停，再start并get查证。失败未知保留历史、不重放；D-021确认结束后不再发起后续首次呼叫或重呼；D-047 / SRC-077用户转述供应商确认：暂停或结束只管任务，未发起呼叫不再发起；已发起拨号、振铃及通话正常进行，生成正常话单，回补原任务、客户及统计。",
          "rules": [],
          "bidirectional": false,
          "decisionId": "D-047",
          "sourceRefs": [
            "SRC-077"
          ],
          "sourceType": "user_relayed_supplier_feedback"
        },
        {
          "id": "adapter-edge-ingest",
          "source": "adapter-events",
          "target": "adapter-reconcile",
          "label": "原始事件与账号上下文",
          "points": [
            [
              210,
              763
            ],
            [
              210,
              822
            ],
            [
              42,
              822
            ],
            [
              42,
              900
            ],
            [
              210,
              900
            ],
            [
              210,
              925
            ]
          ],
          "lx": 210,
          "ly": 822,
          "status": "platform",
          "refs": [
            "API-315",
            "API-316",
            "API-326"
          ],
          "detail": "接收不等于业务完成：先识别来源、对象与租户，再处理重复和乱序。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "adapter-edge-reconcile-cdr",
          "source": "adapter-reconcile",
          "target": "adapter-cdr",
          "label": "按呼叫标识核对",
          "points": [
            [
              360,
              979
            ],
            [
              395,
              979
            ],
            [
              395,
              709
            ],
            [
              445,
              709
            ]
          ],
          "lx": 397,
          "ly": 909,
          "status": "platform",
          "refs": [
            "API-317",
            "API-318",
            "API-319"
          ],
          "detail": "通话结果按分类话单核对；任务状态另用 task/get，不混用两类状态。",
          "rules": [
            "D-053 / SRC-083（2026-09-20）：预测外呼话单sipCauseAsyncUpdateFlag=1表示号码识别结果已异步写回本通sipCause，0表示同步；不是通话状态、等待中或识别必成功标志。识别依据电话提示音，可能无法识别；彩铃等场景可能补偿识别，约延迟1–2分钟，仅为经验范围，不是固定完成时限。迟到结果按账号及原通话键补充原sipCause，保留原始值和来源，不新增通话、不由本地触发重呼。 CF-13当前剩余范围按D-054仅保留自动外呼准确识别字段及编码对应。",
            "D-054 / SRC-084：呼入号码识别一般针对被呼叫的坐席绑定手机号，软电话大概率识别不到，并非绝对不支持。本项目按API-319响应status（人工接听、人工未接听、系统应答、系统未应答）展示接听结果；查询statuses数字1–4与响应值分开。识别只保留为可选补充，不用于判断来电客户号码状态或接听，不把坐席手机号未接识别成客户空号/停机；缺失识别不阻断呼入记录和报表。status缺失、非法或与时间证据冲突仍按原规则核对。sipCauseAsyncUpdateFlag只适用于预测话单；CF-13仅余自动外呼准确识别字段及编码对应。"
          ],
          "bidirectional": false,
          "relatedDecisionIds": [
            "D-053"
          ],
          "decisionId": "D-054",
          "sourceRefs": [
            "SRC-083",
            "SRC-084"
          ],
          "sourceType": "user_relayed_supplier_feedback"
        },
        {
          "id": "adapter-edge-number-code",
          "source": "adapter-cdr",
          "target": "adapter-dictionary",
          "label": "分类后的原始字段",
          "points": [
            [
              595,
              763
            ],
            [
              595,
              925
            ]
          ],
          "lx": 595,
          "ly": 822,
          "status": "platform",
          "refs": [
            "API-317",
            "API-318",
            "API-327"
          ],
          "detail": "人工与预测使用不同响应字段，字典只解释识别值，不改写接通统计。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "adapter-edge-cdr-media",
          "source": "adapter-cdr",
          "target": "adapter-media",
          "label": "按通话标识查询",
          "points": [
            [
              745,
              709
            ],
            [
              830,
              709
            ]
          ],
          "lx": 788,
          "ly": 695,
          "status": "platform",
          "refs": [
            "API-320",
            "DOC-346"
          ],
          "detail": "按各接口要求的通话标识获取媒体，话单与媒体可分别到达。",
          "rules": [
            "D-053 / SRC-083（2026-09-20）：预测外呼话单sipCauseAsyncUpdateFlag=1表示号码识别结果已异步写回本通sipCause，0表示同步；不是通话状态、等待中或识别必成功标志。识别依据电话提示音，可能无法识别；彩铃等场景可能补偿识别，约延迟1–2分钟，仅为经验范围，不是固定完成时限。迟到结果按账号及原通话键补充原sipCause，保留原始值和来源，不新增通话、不由本地触发重呼。 CF-13当前剩余范围按D-054仅保留自动外呼准确识别字段及编码对应。"
          ],
          "bidirectional": false,
          "relatedDecisionIds": [],
          "decisionId": "D-053",
          "sourceRefs": [
            "SRC-083"
          ],
          "sourceType": "user_relayed_supplier_feedback"
        },
        {
          "id": "adapter-edge-media-ready",
          "source": "adapter-media",
          "target": "adapter-availability",
          "label": "媒体就绪 / 无文本",
          "points": [
            [
              1080,
              763
            ],
            [
              1080,
              925
            ]
          ],
          "lx": 1080,
          "ly": 875,
          "status": "platform",
          "refs": [
            "API-320",
            "DOC-346"
          ],
          "detail": "链接有效性、录音就绪与 RASR 文本结果独立反馈给页面。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "adapter-edge-number-display",
          "source": "adapter-dictionary",
          "target": "adapter-availability",
          "label": "已识别或待确认",
          "points": [
            [
              745,
              979
            ],
            [
              830,
              979
            ]
          ],
          "lx": 788,
          "ly": 965,
          "status": "platform",
          "refs": [
            "API-327"
          ],
          "detail": "无法唯一确认编码描述时保留原值和候选项，不生成自定义号码状态。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "adapter-edge-ivr-routing",
          "source": "adapter-ivr",
          "target": "adapter-inbound-rules",
          "label": "资源读取与目标引用",
          "points": [
            [
              1130,
              440
            ],
            [
              1175,
              440
            ],
            [
              1175,
              1090
            ],
            [
              210,
              1090
            ],
            [
              210,
              1180
            ]
          ],
          "lx": 1000,
          "ly": 1090,
          "status": "platform",
          "refs": [
            "API-350",
            "DOC-348",
            "DOC-355",
            "DOC-356",
            "DOC-357"
          ],
          "detail": "候选资源来自官方列表；条件解释不从样例推断。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "adapter-edge-sdk-receiving",
          "source": "adapter-sdk",
          "target": "adapter-receiving",
          "label": "来电与接听请求",
          "points": [
            [
              198,
              218
            ],
            [
              380,
              218
            ],
            [
              380,
              1100
            ],
            [
              595,
              1100
            ],
            [
              595,
              1180
            ]
          ],
          "lx": 595,
          "ly": 1120,
          "status": "platform",
          "refs": [
            "API-303",
            "API-306"
          ],
          "detail": "CTILink 事件经身份匹配进入工作台；本项目采用软电话请求接听，媒体流不经业务后端。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "adapter-edge-receiving-identity",
          "source": "adapter-reconcile",
          "target": "adapter-receiving",
          "label": "原通话归属",
          "points": [
            [
              360,
              979
            ],
            [
              405,
              979
            ],
            [
              405,
              1234
            ],
            [
              445,
              1234
            ]
          ],
          "lx": 360,
          "ly": 1110,
          "status": "platform",
          "refs": [
            "API-303",
            "API-326"
          ],
          "detail": "企业、当前租户与本人 cno 完整匹配，预外呼精确定位任务/客户条目，不能用同号码跨批次推断。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "adapter-edge-receiving-outcome",
          "source": "adapter-receiving",
          "target": "adapter-availability",
          "label": "接听结果或待核对",
          "points": [
            [
              745,
              1234
            ],
            [
              790,
              1234
            ],
            [
              790,
              1035
            ],
            [
              980,
              1035
            ],
            [
              980,
              1033
            ]
          ],
          "lx": 980,
          "ly": 1095,
          "status": "platform",
          "refs": [
            "API-303",
            "API-306",
            "API-326"
          ],
          "detail": "接听失败可重试，取消、超时和迟到事件不伪造人工接通；只更新匹配的原来电。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "adapter-edge-directory-contract",
          "source": "adapter-local-directory",
          "target": "adapter-backend-config",
          "label": "开发交接",
          "points": [
            [
              360,
              1494
            ],
            [
              445,
              1494
            ]
          ],
          "lx": 403,
          "ly": 1480,
          "status": "platform",
          "refs": [],
          "detail": "本地目录的字段与行为形成生产配置契约；这条线是开发交接关系，不表示原型已将资料或凭据上传后端。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "adapter-edge-backend-credential",
          "source": "adapter-backend-config",
          "target": "adapter-backend-execution",
          "label": "受控调用",
          "points": [
            [
              745,
              1494
            ],
            [
              830,
              1494
            ]
          ],
          "lx": 788,
          "ly": 1480,
          "status": "platform",
          "refs": [
            "API-301",
            "API-302"
          ],
          "detail": "生产设计：后端核验主体和资源范围，取得对应受控凭据后签名调用；无供应商账号维护 CRUD。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "adapter-edge-backend-auth",
          "source": "adapter-backend-execution",
          "target": "adapter-auth",
          "label": "复用鉴权模块",
          "points": [
            [
              1130,
              1494
            ],
            [
              1188,
              1494
            ],
            [
              1188,
              164
            ],
            [
              1130,
              164
            ]
          ],
          "lx": 1080,
          "ly": 1330,
          "status": "platform",
          "refs": [
            "API-301",
            "API-302"
          ],
          "detail": "生产签名与短效鉴权由既有上方模块承担；下方仅展开本地原型到生产接入的边界。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "adapter-edge-queue-contract-check",
          "source": "adapter-queue-contract",
          "target": "adapter-queue-reconcile",
          "label": "字段与核对依据",
          "points": [
            [
              360,
              1774
            ],
            [
              445,
              1774
            ]
          ],
          "lx": 403,
          "ly": 1760,
          "status": "platform",
          "refs": [
            "API-377",
            "API-378",
            "API-380",
            "API-382"
          ],
          "detail": "纯字段契约与独立技能/成员核对分别维护；写请求合法不代表供应商已生效。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "adapter-edge-queue-dev-handoff",
          "source": "adapter-queue-reconcile",
          "target": "adapter-queue-execution",
          "label": "开发接入验收",
          "points": [
            [
              745,
              1774
            ],
            [
              830,
              1774
            ]
          ],
          "lx": 788,
          "ly": 1760,
          "status": "platform",
          "refs": [
            "API-380",
            "DOC-342"
          ],
          "detail": "当前独立模拟样例形成验收场景，开发需以授权真实查询证明结果；不直接部署浏览器存储作为生产资源真相。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "adapter-edge-queue-auth",
          "source": "adapter-backend-execution",
          "target": "adapter-queue-execution",
          "label": "复用受控调用",
          "points": [
            [
              980,
              1548
            ],
            [
              980,
              1720
            ]
          ],
          "lx": 980,
          "ly": 1610,
          "status": "platform",
          "refs": [
            "API-301",
            "API-377",
            "API-378"
          ],
          "detail": "后端取受控账号凭据并签名；前端只发送授权业务意图，供应商账号仍由企业ID映射确定。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "adapter-edge-seat-request-receipt",
          "source": "adapter-seat-commands",
          "target": "adapter-seat-receipts",
          "label": "等待匹配回执",
          "points": [
            [
              360,
              2054
            ],
            [
              445,
              2054
            ]
          ],
          "lx": 402,
          "ly": 2040,
          "status": "platform",
          "refs": [
            "API-304"
          ],
          "detail": "完整退出也等待明确成功才释放；未知结果需独立查询核验。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "adapter-edge-seat-scope-monitor",
          "source": "adapter-seat-receipts",
          "target": "adapter-seat-monitoring",
          "label": "逐层范围过滤",
          "points": [
            [
              745,
              2054
            ],
            [
              830,
              2054
            ]
          ],
          "lx": 788,
          "ly": 2040,
          "status": "platform",
          "refs": [
            "API-304"
          ],
          "detail": "请求被接受不代表可展示任意队列或成员；供应商权限与本方租户边界同时满足。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "adapter-edge-sdk-seat-commands",
          "source": "adapter-sdk",
          "target": "adapter-seat-commands",
          "label": "电话运行增量",
          "points": [
            [
              60,
              164
            ],
            [
              18,
              164
            ],
            [
              18,
              1965
            ],
            [
              210,
              1965
            ],
            [
              210,
              2000
            ]
          ],
          "lx": 222,
          "ly": 1950,
          "status": "platform",
          "refs": [
            "API-303",
            "API-304",
            "API-306"
          ],
          "detail": "ADP-30本人命令、ADP-31业务提交后整理编排、ADP-32授权监控对应seat-operations.json。",
          "rules": [
            "D-052 / SRC-082（2026-09-20，user_relayed_supplier_feedback）：breakLine的code=-1为连接断开，code=0为重连成功；SDK自动最多20次重连，每次回调，超过需重新登录。平台不另建重连循环、不按回调次数推断耗尽；sipDisconnected为无参软电话中断通知，坐席需重新登录。",
            "D-052：breakLine code=0仅证明信令重连，不证明媒体可用或原通话恢复。事件绑定当前有效会话，旧会话事件不影响新登录；保留通话、草稿和未知操作保护。原型待通话及记录处理完成后可由本人主动重登，成功暂停接听并需明确恢复；这一保护不等于官方要求所有信令恢复均强制重登。CF-11仍保留跨设备互斥、异常退出清理、媒体就绪与最终状态核验，以及setOffline回执矛盾。"
          ],
          "bidirectional": false,
          "relatedDecisionIds": [],
          "decisionId": "D-052",
          "sourceRefs": [
            "SRC-082"
          ],
          "sourceType": "user_relayed_supplier_feedback"
        },
        {
          "id": "adapter-edge-outbound-task-contract",
          "source": "adapter-outbound-contract",
          "target": "adapter-outbound-task-selection",
          "label": "已核验组号与成员",
          "points": [
            [
              360,
              2334
            ],
            [
              445,
              2334
            ]
          ],
          "lx": 403,
          "ly": 2320,
          "status": "platform",
          "refs": [
            "API-311",
            "API-388",
            "API-393"
          ],
          "detail": "组管理与任务创建的契约分别适配，不把本地保存成功作为供应商资源已存在。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "adapter-edge-extensions-guard",
          "source": "adapter-guard",
          "target": "adapter-extension-api",
          "label": "授权后适配资源",
          "points": [
            [
              420,
              164
            ],
            [
              18,
              164
            ],
            [
              18,
              2470
            ],
            [
              210,
              2470
            ],
            [
              210,
              2555
            ]
          ],
          "lx": 210,
          "ly": 2455,
          "status": "platform",
          "refs": [
            "DOC-355",
            "API-326"
          ],
          "detail": "当前企业与租户权限先校验；exten/list是目录来源之一，不替代本地租户授权。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "adapter-edge-time-task",
          "source": "adapter-time-api",
          "target": "adapter-tasks",
          "label": "任务条件参数",
          "points": [
            [
              595,
              2555
            ],
            [
              770,
              2555
            ],
            [
              770,
              540
            ],
            [
              595,
              540
            ],
            [
              595,
              493
            ]
          ],
          "lx": 690,
          "ly": 2470,
          "status": "platform",
          "refs": [
            "DOC-356",
            "API-311"
          ],
          "detail": "允许/禁呼参数写入任务创建；不实现自建调度。",
          "rules": [],
          "bidirectional": false
        }
      ]
    },
    {
      "id": "alicti",
      "name": "AliCti 系统与能力模块",
      "short": "AliCti 模块",
      "subtitle": "按公开接口组织能力；连线表示对象引用与结果关联，不代表供应商内部服务调用。",
      "width": 1200,
      "height": 2710,
      "groups": [
        {
          "name": "账号与鉴权边界",
          "x": 30,
          "y": 25,
          "w": 1130,
          "h": 220,
          "tone": "documented",
          "note": ""
        },
        {
          "name": "配置资源能力",
          "x": 30,
          "y": 310,
          "w": 1130,
          "h": 220,
          "tone": "documented",
          "note": ""
        },
        {
          "name": "呼叫执行能力",
          "x": 30,
          "y": 580,
          "w": 1130,
          "h": 220,
          "tone": "documented",
          "note": ""
        },
        {
          "name": "事件与结果能力",
          "x": 30,
          "y": 850,
          "w": 1130,
          "h": 220,
          "tone": "documented",
          "note": ""
        },
        {
          "name": "呼入配置公开能力",
          "x": 30,
          "y": 1410,
          "w": 1130,
          "h": 190,
          "tone": "documented",
          "note": ""
        },
        {
          "name": "接听队列公开能力 · 对象关系",
          "x": 30,
          "y": 1660,
          "w": 1130,
          "h": 225,
          "tone": "documented",
          "note": ""
        },
        {
          "name": "工具条公开坐席运行能力",
          "x": 30,
          "y": 1930,
          "w": 1130,
          "h": 225,
          "tone": "documented",
          "note": "API-304及直属数据类型；逻辑能力不表示供应商内部部署"
        },
        {
          "name": "外呼组公开对象关系",
          "x": 30,
          "y": 2200,
          "w": 1130,
          "h": 220,
          "tone": "documented",
          "note": ""
        },
        {
          "name": "公开资源配置能力",
          "x": 30,
          "y": 2460,
          "w": 1130,
          "h": 205,
          "tone": "documented",
          "note": "能力关系不代表供应商内部部署或原型真实调用"
        }
      ],
      "nodes": [
        {
          "id": "alicti-sign",
          "key": "sign",
          "title": "服务端接口鉴权",
          "subtitle": "enterpriseId + timestamp + sign",
          "x": 60,
          "y": 110,
          "w": 300,
          "h": 108,
          "status": "documented",
          "scope": "公开能力",
          "refs": [
            "API-301"
          ],
          "role": "为服务端接口调用提供文档规定的鉴权入口。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "部门 token 不进入浏览器。",
            "/cc 系列按各自接口核对鉴权。"
          ],
          "identifiers": [],
          "drill": null
        },
        {
          "id": "alicti-account",
          "key": "account",
          "title": "供应商账号上下文",
          "subtitle": "enterpriseId = 账号 ID",
          "x": 445,
          "y": 110,
          "w": 300,
          "h": 108,
          "status": "documented",
          "scope": "接口对象",
          "refs": [
            "API-301",
            "API-302",
            "API-307",
            "API-310",
            "API-316"
          ],
          "role": "代表 AliCti 供应商账号范围，用于登录、资源访问与企业事件接入。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "UUID 不参与接口。",
            "企业账号上下文不是平台租户隔离保证。",
            "D-036 / D-037：账号由供应商提供；本方账号目录新增、编辑和启停不是 AliCti 对外账号管理、开通或停机能力。"
          ],
          "identifiers": [
            "enterpriseId"
          ],
          "drill": null
        },
        {
          "id": "alicti-login",
          "key": "login",
          "title": "坐席前端登录鉴权",
          "subtitle": "cno → sessionKey / 网关地址",
          "x": 830,
          "y": 110,
          "w": 300,
          "h": 108,
          "status": "documented",
          "scope": "公开能力",
          "refs": [
            "API-302"
          ],
          "role": "提供坐席前端使用的短期登录材料。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "sessionKey 有效 30 秒；平台在申请前检查人员与坐席关系。"
          ],
          "identifiers": [
            "enterpriseId",
            "cno",
            "sessionKey"
          ],
          "drill": null
        },
        {
          "id": "alicti-seat",
          "key": "seat",
          "title": "坐席资源",
          "subtitle": "agent/create · agent/update",
          "x": 60,
          "y": 395,
          "w": 300,
          "h": 108,
          "status": "documented",
          "scope": "公开能力",
          "refs": [
            "API-307",
            "API-308",
            "API-324"
          ],
          "role": "创建和更新坐席资料、开关及相关配置。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "cno 为 3–10 位数字字符串，保留前导零。",
            "batchCreate按连续工号；query/get导入和查证。update/技能/删除统一先下线，20023失败不回写。",
            "D-026：agent/update的obClidType/obClid及动态属性是坐席外显规则；skillIds/skillLevels是独立技能关系，均不是平台NumberGrant。",
            "agent/update请求表没有bindTel；登录绑定设备不能由响应模型字段反推可写参数。",
            "D-050 / SRC-080（user_relayed_supplier_feedback）：坐席按主键物理删除；工号只在当前仍存在的坐席中唯一。重建同工号为新坐席，生成新id/createTime，旧技能、队列成员、绑定电话清除。当前身份与本地配置不可仅凭相同cno自动继承；本次不迁移历史数据。",
            "D-051 / SRC-081（2026-09-20，user_relayed_supplier_feedback）：success为主记录建成数，other为其中技能绑定失败子集，不与success相加；fail与success互斥。cnos含全部已建成工号（含other），申请工号区间减去cnos为未建成工号。未传skillIds时other=0；对cnos逐项queryAgentSkill，缺少目标skillId可定位other，查询本身不证明主记录新建。",
            "D-051 / SRC-081：创建结果未知时，agent/query按原cnos读取id/createTime，可使用startTime/endTime；新id且createTime处于本次请求窗口才证实本次主记录。agent/get与queryCnoAndName只证存在，queryAgentSkill只证技能。查询证据不足继续未知，不自动重放写入。CF-08已关闭，不意味着生产接口已联调。"
          ],
          "identifiers": [
            "cno",
            "areaCode"
          ],
          "drill": null,
          "relatedDecisionIds": [
            "D-050"
          ],
          "decisionId": "D-051",
          "sourceRefs": [
            "SRC-080",
            "SRC-081"
          ],
          "sourceType": "user_relayed_supplier_feedback"
        },
        {
          "id": "alicti-skill",
          "key": "skill",
          "title": "坐席技能绑定",
          "subtitle": "batchUpdateAgentSkill",
          "x": 445,
          "y": 395,
          "w": 300,
          "h": 108,
          "status": "documented",
          "scope": "公开能力",
          "refs": [
            "API-309",
            "API-324"
          ],
          "role": "创建、更新和查询技能；按坐席全量替换多个技能。平台团队另转换为任务 cnos。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "skillIds=0清空；skillLevels数值较小技能等级较高，接听分配仍按具体场景策略。",
            "技能增改查已有文档；本地等级1–10，failCno按String解析并逐席检查。"
          ],
          "identifiers": [
            "cno",
            "skillIds",
            "skillLevels"
          ],
          "drill": null
        },
        {
          "id": "alicti-number",
          "key": "number",
          "title": "企业号码查询与启停",
          "subtitle": "listPage / batchUpdateNumber",
          "x": 830,
          "y": 395,
          "w": 300,
          "h": 108,
          "status": "documented",
          "scope": "公开能力",
          "refs": [
            "API-310",
            "API-324"
          ],
          "role": "查询号码并更新启停、外显用途；保留平台授权和路由。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "每页最多 1000 条。",
            "只提交变化的status或外显字段；D-048确认停用后后续选号不再使用，已发起通话继续。共享呼入归属保留CF-10。",
            "D-068 / SRC-098：listPage只读返回账号已有号码；导入自动归属账号唯一业务租户，不配置号码租户分配，不绑定技能或坐席。",
            "batchUpdateNumber的号码池绑定不是技能组绑定；新增资源由供应商开通，本地授权保存不宣称远端绑定成功。",
            "D-033：当前账号的已开通号码可查询并纳入本地管理；本地使用方向和使用范围不改写供应商 status 或外显属性。",
            "D-046 / SRC-076：号码当前按D-068自动归属唯一业务租户；本地软电话分机管理保留；旧号码—技能—坐席绑定不再采用，其他历史规则与公开接口原字段含义保持独立。",
            "D-048 / SRC-078（user_relayed_supplier_feedback_and_scope_decision）：供应商号码停用后后续选号不再使用该号码，已发起通话正常继续。用户取消供应商账号解绑接口及查证需求，改为本地停用后不再使用该号码外呼；本地开关不解除供应商资源、不停止呼入路由、不强制挂断，历史保留。"
          ],
          "identifiers": [],
          "drill": null,
          "decisionId": "D-048",
          "sourceRefs": [
            "SRC-076",
            "SRC-078"
          ],
          "relatedDecisionIds": [
            "D-046"
          ],
          "sourceType": "user_relayed_supplier_feedback_and_scope_decision"
        },
        {
          "id": "alicti-phone",
          "key": "phone",
          "title": "工具条与软电话",
          "subtitle": "CTILink · 会话控制 · WebRTC",
          "x": 60,
          "y": 665,
          "w": 300,
          "h": 108,
          "status": "documented",
          "scope": "公开能力",
          "refs": [
            "API-303",
            "API-304",
            "API-305",
            "API-306"
          ],
          "role": "提供坐席上线、人工外呼、来电通知、接听请求和通话状态事件；本方按身份与设备方式接入。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "请求接受不等于客户接听，登录成功不等于媒体准备完成。",
            "D-052确认信令重连最多20次及软电话断开须重登；跨设备互斥、异常清理和媒体最终状态仍需验证。",
            "D-030：ringingIb/ringingAgentOb、busyIb/busyOb 与 sipLink 为公开事件/操作依据；本方模块承担权限和原通话关联，不推断供应商内部调度服务。",
            "D-052 / SRC-082（2026-09-20，user_relayed_supplier_feedback）：breakLine的code=-1为连接断开，code=0为重连成功；SDK自动最多20次重连，每次回调，超过需重新登录。平台不另建重连循环、不按回调次数推断耗尽；sipDisconnected为无参软电话中断通知，坐席需重新登录。",
            "D-052：breakLine code=0仅证明信令重连，不证明媒体可用或原通话恢复。事件绑定当前有效会话，旧会话事件不影响新登录；保留通话、草稿和未知操作保护。原型待通话及记录处理完成后可由本人主动重登，成功暂停接听并需明确恢复；这一保护不等于官方要求所有信令恢复均强制重登。CF-11仍保留跨设备互斥、异常退出清理、媒体就绪与最终状态核验，以及setOffline回执矛盾。"
          ],
          "identifiers": [],
          "drill": null,
          "relatedDecisionIds": [],
          "decisionId": "D-052",
          "sourceRefs": [
            "SRC-082"
          ],
          "sourceType": "user_relayed_supplier_feedback"
        },
        {
          "id": "alicti-task",
          "key": "task",
          "title": "预测 / 自动外呼任务",
          "subtitle": "创建 / 启停 / 查询 / 名单导入",
          "x": 445,
          "y": 665,
          "w": 300,
          "h": 108,
          "status": "documented",
          "scope": "公开能力",
          "refs": [
            "API-311",
            "API-312",
            "API-313",
            "API-314",
            "API-325"
          ],
          "role": "按 type=1 预测外呼、type=2 自动外呼 分别管理任务及号码。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "手工/定时参数按文档转换；原型仅模拟，不实际定时拨号。",
            "状态为0初始、1运行中、2暂停、3结束；继续按get确认2→start→get回查，状态3不得再次开启，暂停不传pauseDuration。",
            "callStrategy为预测任务专用分配参数，与queue.strategy/weight独立；本方新建默认4、缺字段须重新选择，不改变供应商历史。",
            "D-047 / SRC-077（user_relayed_supplier_feedback）：暂停或结束只控制任务调度，未发起的首次呼叫和重呼不再发起；已发起的拨号、振铃和通话正常进行，正常话单继续归集。暂停可按get确认2→start→get继续；结束不重开，正常结果仅回补原历史与统计。本次为用户转述供应商答复，不代表官网更新或真实联调通过。",
            "D-060：新预测任务autoComplete=0，名单耗尽暂停；自动外呼为1。再次预外呼保持原taskId，importTaskTel仅追加新批次，isRepeat=0、importTelAutoStart=0；原任务已结束不重开。",
            "任务关联本租户可呼叫及禁呼时间条件；autoTaskType=1须选允许条件，autoTriggerTimeStrategy和timeStrategy以逗号连接ID，不能重复用于允许与禁止。草稿、模板、复制与启动/继续复检；原任务再次联系沿用现有条件，按需配置结束时间。",
            "本方只维护配置和引用保护，不实现本地时间调度；实际执行由供应商任务处理。",
            "任务向导的重呼配置未填完整时，仍可保存草稿、关闭或返回，保留已填和空值；下一步及确认创建时再严格校验必选呼叫状态、次数、间隔与计时依据，不因草稿未填全而阻断退出。"
          ],
          "identifiers": [
            "taskId",
            "type",
            "callGroupType / cnos / agentGroup"
          ],
          "drill": null,
          "relatedDecisionIds": [
            "D-017",
            "D-021"
          ],
          "decisionId": "D-047",
          "sourceRefs": [
            "SRC-077"
          ],
          "sourceType": "user_relayed_supplier_feedback"
        },
        {
          "id": "alicti-ivr",
          "key": "ivr",
          "title": "IVR 流程资源与执行结果",
          "subtitle": "流程列表 · 定义详情 · 执行轨迹",
          "x": 830,
          "y": 665,
          "w": 300,
          "h": 108,
          "status": "documented",
          "scope": "公开能力",
          "refs": [
            "API-322",
            "API-323",
            "DOC-348",
            "DOC-349"
          ],
          "role": "提供ivrProfile/list、listDetail和ivrFlow/query；自动外呼选用已有流程，内容维护由阿里侧完成。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "ivrType=1为IVR，2为彩铃；当前账号和租户外呼授权共同限定可选范围。",
            "返回列表不等于已发布或适用所有外呼；呼入路由CRUD已按D-024采用，条件匹配与归属仍见CF-10。",
            "本通语音流程仅取话单ivrName/ivrId，不从任务所选流程推断。当前详情不展示虚构IVR版本、节点或本地补齐话单操作；公开ivrFlow/query能力不等于本通已取得执行节点。"
          ],
          "identifiers": [],
          "drill": null
        },
        {
          "id": "alicti-events",
          "key": "events",
          "title": "HTTP / 企业 WS 事件",
          "subtitle": "任务 · 坐席 · 话单 · 媒体通知",
          "x": 60,
          "y": 935,
          "w": 300,
          "h": 108,
          "status": "documented",
          "scope": "公开能力",
          "refs": [
            "API-315",
            "API-316"
          ],
          "role": "通过配置 HTTP 回推或企业 WebSocket 提供各类异步事件。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "企业 WS /user/agent 默认可能包含全部坐席，平台必须过滤。",
            "重复、乱序、重放及重试层级不能假设已被完整保证。"
          ],
          "identifiers": [],
          "drill": null
        },
        {
          "id": "alicti-cdr",
          "key": "cdr",
          "title": "分类通话记录",
          "subtitle": "人工外呼 / 预测外呼 / 呼入",
          "x": 445,
          "y": 935,
          "w": 300,
          "h": 108,
          "status": "documented",
          "scope": "公开能力",
          "refs": [
            "API-317",
            "API-318",
            "API-319",
            "API-327"
          ],
          "role": "三类话单分别提供通话、接通与号码识别相关字段。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "人工与预测 status 枚举及 upTime / bridgeTime 含义不同。",
            "号码识别按 API-327 字段文档复用；不是新建状态接口。",
            "D-053 / SRC-083（2026-09-20）：预测外呼话单sipCauseAsyncUpdateFlag=1表示号码识别结果已异步写回本通sipCause，0表示同步；不是通话状态、等待中或识别必成功标志。识别依据电话提示音，可能无法识别；彩铃等场景可能补偿识别，约延迟1–2分钟，仅为经验范围，不是固定完成时限。迟到结果按账号及原通话键补充原sipCause，保留原始值和来源，不新增通话、不由本地触发重呼。 CF-13当前剩余范围按D-054仅保留自动外呼准确识别字段及编码对应。",
            "D-054 / SRC-084：呼入号码识别一般针对被呼叫的坐席绑定手机号，软电话大概率识别不到，并非绝对不支持。本项目按API-319响应status（人工接听、人工未接听、系统应答、系统未应答）展示接听结果；查询statuses数字1–4与响应值分开。识别只保留为可选补充，不用于判断来电客户号码状态或接听，不把坐席手机号未接识别成客户空号/停机；缺失识别不阻断呼入记录和报表。status缺失、非法或与时间证据冲突仍按原规则核对。sipCauseAsyncUpdateFlag只适用于预测话单；CF-13仅余自动外呼准确识别字段及编码对应。"
          ],
          "identifiers": [],
          "drill": null,
          "relatedDecisionIds": [
            "D-053"
          ],
          "decisionId": "D-054",
          "sourceRefs": [
            "SRC-083",
            "SRC-084"
          ],
          "sourceType": "user_relayed_supplier_feedback"
        },
        {
          "id": "alicti-media",
          "key": "media",
          "title": "录音与 RASR",
          "subtitle": "record/getUrl · rasrEvent/query",
          "x": 830,
          "y": 935,
          "w": 300,
          "h": 108,
          "status": "documented",
          "scope": "公开能力",
          "refs": [
            "API-320",
            "DOC-346"
          ],
          "role": "按通话标识提供录音访问地址和 RASR 文本结果。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "按uniqueId查询RASR，data数组中text/botText为JSON字符串；-2不在该接口定义。",
            "monitorSide=1坐席/2客户，botText为机器人；文本只阅读搜索，录音定位已取消。"
          ],
          "identifiers": [],
          "drill": null
        },
        {
          "id": "alicti-inbound-rules",
          "key": "inbound-rules",
          "title": "呼入路由管理",
          "subtitle": "ivrRouter 与条件资源",
          "x": 60,
          "y": 1470,
          "w": 300,
          "h": 108,
          "status": "documented",
          "scope": "公开接口能力",
          "refs": [
            "API-350",
            "API-351",
            "API-352",
            "API-353",
            "API-354",
            "DOC-358"
          ],
          "role": "提供账号级路由创建、更新、列表、详情和删除；语音导航、电话号码或分机为目标。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "这是公开接口能力分组，不声称供应商内部部署。",
            "时间条件、中继与分机按各自列表核验，剩余匹配/归属见CF-10。"
          ],
          "identifiers": [],
          "drill": null
        },
        {
          "id": "alicti-queue",
          "key": "queue",
          "title": "队列配置与查询",
          "subtitle": "queue/create / update / list / get",
          "x": 60,
          "y": 1735,
          "w": 300,
          "h": 108,
          "status": "documented",
          "scope": "公开接口能力",
          "refs": [
            "API-377",
            "API-378",
            "API-379",
            "API-380",
            "API-381"
          ],
          "role": "官方管理队列编号、名称、分配策略、优先级和等待相关参数；原型使用新增、修改与查询契约，删除不开放。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "qno保留原String且账号内区分；文档未建立额外位数范围。六种分配策略与任务callStrategy不同。",
            "weight1–10数值越大队列优先级越高；不据此推测多个队列竞争的全部内部算法。"
          ],
          "identifiers": [
            "String qno",
            "queue.strategy",
            "weight"
          ],
          "drill": null
        },
        {
          "id": "alicti-queue-skills",
          "key": "queue-skills",
          "title": "队列与技能关联",
          "subtitle": "queueSkills / queueSkill",
          "x": 445,
          "y": 1735,
          "w": 300,
          "h": 108,
          "status": "documented",
          "scope": "公开对象关系",
          "refs": [
            "API-377",
            "API-378",
            "API-382",
            "API-383",
            "API-384",
            "API-385"
          ],
          "role": "通过skillId与skillLevel关联队列技能；新增时传queueSkills，另有技能关系增改查删接口。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "关联设置按技能差量生成create/delete模拟请求；更新队列省略queueSkills不改变技能，提供数组则全量替换。",
            "未发现直接以cnos写入队列的依据；当前一技能组最多关联一个队列是产品约束，一队列可关联多个技能组，不是供应商固有租户模型。"
          ],
          "identifiers": [],
          "drill": null
        },
        {
          "id": "alicti-queue-members",
          "key": "queue-members",
          "title": "队列实际坐席查询",
          "subtitle": "agent/query · qno · data.agents",
          "x": 830,
          "y": 1735,
          "w": 300,
          "h": 108,
          "status": "documented",
          "scope": "公开查询能力",
          "refs": [
            "DOC-342",
            "API-382"
          ],
          "role": "按队列号读取实际坐席并完整分页，供本方与有效成员和技能映射独立核对。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "agent技能和queue技能关系是对象关联；本图不宣称供应商内部同步机制或实际调度已经联调。",
            "本地成员一致不替代工具条上线、队列状态、呼入路由与实际接听验证。"
          ],
          "identifiers": [],
          "drill": null
        },
        {
          "id": "alicti-agent-operations",
          "key": "agent-operations",
          "title": "本人座席操作",
          "subtitle": "login / logout / pause / unpause",
          "x": 60,
          "y": 2005,
          "w": 300,
          "h": 108,
          "status": "documented",
          "scope": "公开工具条能力",
          "refs": [
            "API-304"
          ],
          "role": "文档提供上线、退出、暂停与恢复参数及response返回形状。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "logoutMode文档含0后台在线和1完全退出；本期普通退出固定logoutMode=1、removeBinding=0，不提供解除接听电话绑定选项。本地坐席分机配置不清空。",
            "loginStatus只1/2，登录原因可选；pauseType1/2和pauseDescription必填，unpause无参数。",
            "公开能力存在不等于当前静态原型已接通真实SDK。",
            "login.bindTel为必填String接听电话；本项目采用本地已配置软电话分机与bindType=3，分机创建与目录维护另按exten接口；登录只使用经核验的受控选择。",
            "D-046 / SRC-076：号码当前按D-068自动归属唯一业务租户；本地软电话分机管理保留；旧号码—技能—坐席绑定不再采用，其他历史规则与公开接口原字段含义保持独立。",
            "D-052 / SRC-082（2026-09-20，user_relayed_supplier_feedback）：breakLine的code=-1为连接断开，code=0为重连成功；SDK自动最多20次重连，每次回调，超过需重新登录。平台不另建重连循环、不按回调次数推断耗尽；sipDisconnected为无参软电话中断通知，坐席需重新登录。",
            "D-052：breakLine code=0仅证明信令重连，不证明媒体可用或原通话恢复。事件绑定当前有效会话，旧会话事件不影响新登录；保留通话、草稿和未知操作保护。原型待通话及记录处理完成后可由本人主动重登，成功暂停接听并需明确恢复；这一保护不等于官方要求所有信令恢复均强制重登。CF-11仍保留跨设备互斥、异常退出清理、媒体就绪与最终状态核验，以及setOffline回执矛盾。",
            "分机在系统管理的独立分机管理中创建或导入，坐席只选择本企业本租户启用且未占用的type=2软电话；登录前再核对。目录type=2与login.bindType=3分别解释，不以工号推算分机。",
            "登录不要求选择技能或外显号码；人工拨号前另查分机isOb/callPower与当前租户号码权限，不能拿上线成功代替外呼资格。",
            "D-072：每次普通坐席登录均直接打开一次性登录面板；工作模式初始“请选择”，本人必须选0预览与预测同时、4预览外呼或5预测外呼；登录状态默认置闲，可改置忙并选填原因。点击“登录”直接提交login，取消不发请求，失败保留本次输入供重试；不先保存登录设置或沿用上次模式。断线重登是独立流程，沿用当前会话模式及暂停状态。",
            "D-071：登录后工具条直接显示工作模式下拉，在线即时调用CTILink.Agent.changeWorkingMode；置忙可切，通话、振铃、话后整理及未知结果期间拒绝。登录置忙后禁用主动预览外呼，须先置闲；模式4不接受预测分配，模式5禁用预览外呼。呼入与模式关系仍见CF-16。"
          ],
          "identifiers": [],
          "drill": null,
          "decisionId": "D-052",
          "sourceRefs": [
            "SRC-076",
            "SRC-082",
            "SRC-101",
            "SRC-102"
          ],
          "relatedDecisionIds": [
            "D-046",
            "D-071",
            "D-072"
          ],
          "sourceType": "user_relayed_supplier_feedback"
        },
        {
          "id": "alicti-agent-settings",
          "key": "agent-settings",
          "title": "整理与未采用能力",
          "subtitle": "prolongWrapup / 官方范围",
          "x": 445,
          "y": 2005,
          "w": 300,
          "h": 108,
          "status": "documented",
          "scope": "公开工具条能力",
          "refs": [
            "API-304"
          ],
          "role": "公开设备、模式与整理能力；本项目只采用延长整理，设备/模式切换仅保留官方参考。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "本项目prolongWrapup为30–600秒；不可套queue.wrapupTime默认3–3600；不开放changeBindTel。",
            "登录固定String0；不调用changeWorkingMode，其Agent/AgentTask命名冲突保留参考，不阻断。"
          ],
          "identifiers": [],
          "drill": null
        },
        {
          "id": "alicti-agent-queue-status",
          "key": "agent-queue-status",
          "title": "班长队列状态查询",
          "subtitle": "queueStatus / Monitor",
          "x": 830,
          "y": 2005,
          "w": 300,
          "h": 108,
          "status": "documented",
          "scope": "公开工具条查询",
          "refs": [
            "API-304",
            "DOC-344"
          ],
          "role": "班长席通过qnos、fields请求queueParams、agentStatuses和queueEntries，按队列号返回结果。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "QueueParam统计仅呼入；wrapupTime为平均整理时长，不是默认整理配置。",
            "AgentStatus.state为公开字段；QueueEntry用customerNumber和joinTime，waitTime单位未说明。",
            "平台租户范围和班长身份需本方另验，不是供应商enterpriseId天然隔离。",
            "工具条班长管理采用Monitor.setPause/setUnpause/setOffline；本项目不采用管理上线。",
            "DOC-344 agentStatus/get按enterpriseId和逐个cno查询坐席状态，不含班长登录会话；queueStatus与Monitor管理仍是班长上线后的独立工具条能力。"
          ],
          "identifiers": [],
          "drill": null,
          "relatedDecisionIds": [
            "D-080"
          ],
          "decisionId": "D-082",
          "sourceRefs": [
            "SRC-110"
          ],
          "sourceType": "user_product_requirement_and_existing_interface_review"
        },
        {
          "id": "alicti-outbound-group",
          "key": "outbound-group",
          "title": "外呼组资料",
          "subtitle": "gno · 名称 · 备注",
          "x": 60,
          "y": 2270,
          "w": 300,
          "h": 108,
          "status": "documented",
          "scope": "公开接口能力",
          "refs": [
            "API-386",
            "API-387",
            "API-388",
            "API-389",
            "API-390"
          ],
          "role": "公开外呼组新增、列表、详情、更新及删除，作为预测任务可引用的独立资源。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "不是接听队列qno或技能skillId；本地租户范围由中台维护。"
          ],
          "identifiers": [],
          "drill": null
        },
        {
          "id": "alicti-outbound-members",
          "key": "outbound-members",
          "title": "外呼组坐席关系",
          "subtitle": "分配 · 移出 · 组员/所属组查询",
          "x": 445,
          "y": 2270,
          "w": 300,
          "h": 108,
          "status": "documented",
          "scope": "公开对象关系",
          "refs": [
            "API-391",
            "API-392",
            "API-393",
            "API-394"
          ],
          "role": "维护gno与原字符串cno关系，查询组下坐席或坐席所在外呼组。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "API-391：一坐席只能存在一个外呼组，重复分配会移入新组；每组最多1000坐席，一次最多1000工号。",
            "平台对跨租户移动和在途任务的保护是本地规则，不等于供应商自动隔离。"
          ],
          "identifiers": [],
          "drill": null
        },
        {
          "id": "alicti-extensions",
          "key": "extensions",
          "title": "分机资源接口",
          "subtitle": "exten/list · create · update · batchDelete",
          "x": 60,
          "y": 2525,
          "w": 300,
          "h": 108,
          "status": "documented",
          "scope": "公开接口能力",
          "refs": [
            "DOC-355",
            "API-396",
            "API-397",
            "API-399"
          ],
          "role": "公开分机目录及维护接口；本项目采用软电话type=2。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "坐席上线用bindTel引用分机，login.bindType=3属于另一枚举。",
            "本方唯一业务租户归属不改变供应商企业账号模型。"
          ],
          "identifiers": [],
          "drill": null
        },
        {
          "id": "alicti-enterprise-time",
          "key": "enterprise-time",
          "title": "时间条件接口",
          "subtitle": "enterpriseTime 增改删查",
          "x": 445,
          "y": 2525,
          "w": 300,
          "h": 108,
          "status": "documented",
          "scope": "公开接口能力",
          "refs": [
            "DOC-356",
            "DOC-359",
            "API-400",
            "API-401",
            "API-402"
          ],
          "role": "企业时间条件独立配置，任务与呼入路由按各自字段引用。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "任务autoTriggerTimeStrategy/timeStrategy逗号连接ID，呼入ruleTimeProperty使用分号。",
            "priority按接口要求配置；手工必填及跨租户唯一校验由本方执行。本方引用保护不是供应商返回的使用位置字段。"
          ],
          "identifiers": [],
          "drill": null
        }
      ],
      "edges": [
        {
          "id": "alicti-edge-account-sign",
          "source": "alicti-account",
          "target": "alicti-sign",
          "label": "使用账号签名",
          "points": [
            [
              445,
              164
            ],
            [
              360,
              164
            ]
          ],
          "lx": 403,
          "ly": 150,
          "status": "documented",
          "refs": [
            "API-301"
          ],
          "detail": "enterpriseId 参与服务端签名，不将 UUID 作为接口凭证。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "alicti-edge-account-login",
          "source": "alicti-account",
          "target": "alicti-login",
          "label": "账号 + 坐席",
          "points": [
            [
              745,
              164
            ],
            [
              830,
              164
            ]
          ],
          "lx": 788,
          "ly": 150,
          "status": "documented",
          "refs": [
            "API-302"
          ],
          "detail": "前端登录鉴权请求包含 enterpriseId 与 cno。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "alicti-edge-account-resources",
          "source": "alicti-account",
          "target": "alicti-seat",
          "label": "账号范围内的坐席对象",
          "points": [
            [
              530,
              218
            ],
            [
              530,
              278
            ],
            [
              210,
              278
            ],
            [
              210,
              395
            ]
          ],
          "lx": 330,
          "ly": 278,
          "status": "documented",
          "refs": [
            "API-307",
            "API-308"
          ],
          "detail": "该线描述接口访问和对象归属，不声称供应商有独立账号数据库或内部调用。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "alicti-edge-account-number",
          "source": "alicti-account",
          "target": "alicti-number",
          "label": "账号范围内的号码查询",
          "points": [
            [
              675,
              218
            ],
            [
              675,
              278
            ],
            [
              980,
              278
            ],
            [
              980,
              395
            ]
          ],
          "lx": 850,
          "ly": 278,
          "status": "documented",
          "refs": [
            "API-310"
          ],
          "detail": "按enterpriseId查询已有号码；新增开通由供应商办理，平台据查询结果同步台账。status/外显写入另用batchUpdateNumber，本地NumberGrant不属于供应商入参。",
          "rules": [
            "D-048 / SRC-078（user_relayed_supplier_feedback_and_scope_decision）：供应商号码停用后后续选号不再使用该号码，已发起通话正常继续。用户取消供应商账号解绑接口及查证需求，改为本地停用后不再使用该号码外呼；本地开关不解除供应商资源、不停止呼入路由、不强制挂断，历史保留。"
          ],
          "bidirectional": false,
          "decisionId": "D-048",
          "sourceRefs": [
            "SRC-078"
          ],
          "sourceType": "user_relayed_supplier_feedback_and_scope_decision"
        },
        {
          "id": "alicti-edge-seat-skills",
          "source": "alicti-seat",
          "target": "alicti-skill",
          "label": "cno 技能绑定",
          "points": [
            [
              360,
              449
            ],
            [
              445,
              449
            ]
          ],
          "lx": 403,
          "ly": 435,
          "status": "documented",
          "refs": [
            "API-309"
          ],
          "detail": "技能接口按坐席更新完整技能列表，不是增量追加。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "alicti-edge-seat-phone",
          "source": "alicti-seat",
          "target": "alicti-phone",
          "label": "cno 登录 / 操作",
          "points": [
            [
              210,
              503
            ],
            [
              210,
              665
            ]
          ],
          "lx": 210,
          "ly": 555,
          "status": "documented",
          "refs": [
            "API-302",
            "API-303",
            "API-304",
            "API-305"
          ],
          "detail": "平台确认人员与 cno 的使用关系后，浏览器取得短期材料并登录。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "alicti-edge-seat-task",
          "source": "alicti-seat",
          "target": "alicti-task",
          "label": "指定坐席工号",
          "points": [
            [
              360,
              449
            ],
            [
              400,
              449
            ],
            [
              400,
              610
            ],
            [
              595,
              610
            ],
            [
              595,
              665
            ]
          ],
          "lx": 595,
          "ly": 596,
          "status": "documented",
          "refs": [
            "API-307",
            "API-311"
          ],
          "detail": "预测任务选择同租户有效指定坐席，callGroupType=1 传 cnos；agentGroup 是外呼组，不能用技能 ID 代替。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "alicti-edge-number-routing",
          "source": "alicti-number",
          "target": "alicti-ivr",
          "label": "号码 → 呼入路由 → 目标",
          "points": [
            [
              980,
              503
            ],
            [
              980,
              665
            ]
          ],
          "lx": 980,
          "ly": 555,
          "status": "documented",
          "refs": [
            "API-350",
            "API-351",
            "API-352",
            "API-353",
            "API-354"
          ],
          "detail": "D-024通过ivrRouter配置中继条件和目标；条件组合、未命中与话单归属证据仍见CF-10。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "alicti-edge-task-ivr",
          "source": "alicti-task",
          "target": "alicti-ivr",
          "label": "选择流程 → ivrId",
          "points": [
            [
              745,
              719
            ],
            [
              830,
              719
            ]
          ],
          "lx": 788,
          "ly": 705,
          "status": "documented",
          "refs": [
            "API-311",
            "DOC-348"
          ],
          "detail": "列表返回id映射task/create的ivrId，type=2；本地授权限制可选流程，演示ID不代表真实资源已验收。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "alicti-edge-phone-events",
          "source": "alicti-phone",
          "target": "alicti-events",
          "label": "坐席 / 会话事件",
          "points": [
            [
              210,
              773
            ],
            [
              210,
              935
            ]
          ],
          "lx": 210,
          "ly": 825,
          "status": "documented",
          "refs": [
            "API-303",
            "API-304",
            "API-315",
            "API-316"
          ],
          "detail": "工具条事件与企业事件各自接入；不将其中一个回调作为全部业务结果。",
          "rules": [
            "D-052 / SRC-082（2026-09-20，user_relayed_supplier_feedback）：breakLine的code=-1为连接断开，code=0为重连成功；SDK自动最多20次重连，每次回调，超过需重新登录。平台不另建重连循环、不按回调次数推断耗尽；sipDisconnected为无参软电话中断通知，坐席需重新登录。",
            "D-052：breakLine code=0仅证明信令重连，不证明媒体可用或原通话恢复。事件绑定当前有效会话，旧会话事件不影响新登录；保留通话、草稿和未知操作保护。原型待通话及记录处理完成后可由本人主动重登，成功暂停接听并需明确恢复；这一保护不等于官方要求所有信令恢复均强制重登。CF-11仍保留跨设备互斥、异常退出清理、媒体就绪与最终状态核验，以及setOffline回执矛盾。"
          ],
          "bidirectional": false,
          "relatedDecisionIds": [],
          "decisionId": "D-052",
          "sourceRefs": [
            "SRC-082"
          ],
          "sourceType": "user_relayed_supplier_feedback"
        },
        {
          "id": "alicti-edge-task-cdr",
          "source": "alicti-task",
          "target": "alicti-cdr",
          "label": "任务与分类话单关联",
          "points": [
            [
              595,
              773
            ],
            [
              595,
              935
            ]
          ],
          "lx": 595,
          "ly": 825,
          "status": "documented",
          "refs": [
            "API-318",
            "API-362"
          ],
          "detail": "预测API-318与自动API-362按明确taskId读取本条话单，轮次和最终标记不代表后续安排；平台还核对账号租户及类型。",
          "rules": [
            "D-053 / SRC-083（2026-09-20）：预测外呼话单sipCauseAsyncUpdateFlag=1表示号码识别结果已异步写回本通sipCause，0表示同步；不是通话状态、等待中或识别必成功标志。识别依据电话提示音，可能无法识别；彩铃等场景可能补偿识别，约延迟1–2分钟，仅为经验范围，不是固定完成时限。迟到结果按账号及原通话键补充原sipCause，保留原始值和来源，不新增通话、不由本地触发重呼。 CF-13当前剩余范围按D-054仅保留自动外呼准确识别字段及编码对应。"
          ],
          "bidirectional": false,
          "relatedDecisionIds": [],
          "decisionId": "D-053",
          "sourceRefs": [
            "SRC-083"
          ],
          "sourceType": "user_relayed_supplier_feedback"
        },
        {
          "id": "alicti-edge-ivr-record",
          "source": "alicti-ivr",
          "target": "alicti-cdr",
          "label": "按通话查执行节点",
          "points": [
            [
              920,
              773
            ],
            [
              920,
              885
            ],
            [
              700,
              885
            ],
            [
              700,
              935
            ]
          ],
          "lx": 822,
          "ly": 885,
          "status": "documented",
          "refs": [
            "API-323"
          ],
          "detail": "ivrFlow/query是公开的单次执行节点查询能力；当前通话详情仅呈现已取得的话单语音字段，不展示虚构节点、版本或假定供应商内部服务调用。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "alicti-edge-event-cdr",
          "source": "alicti-events",
          "target": "alicti-cdr",
          "label": "本方按标识核对",
          "points": [
            [
              360,
              989
            ],
            [
              445,
              989
            ]
          ],
          "lx": 403,
          "ly": 975,
          "status": "platform",
          "refs": [
            "API-315",
            "API-316",
            "API-317",
            "API-318",
            "API-319"
          ],
          "detail": "这是本方利用事件和话单进行结果关联的设计关系，不代表 AliCti 内部消息拓扑。",
          "rules": [
            "D-053 / SRC-083（2026-09-20）：预测外呼话单sipCauseAsyncUpdateFlag=1表示号码识别结果已异步写回本通sipCause，0表示同步；不是通话状态、等待中或识别必成功标志。识别依据电话提示音，可能无法识别；彩铃等场景可能补偿识别，约延迟1–2分钟，仅为经验范围，不是固定完成时限。迟到结果按账号及原通话键补充原sipCause，保留原始值和来源，不新增通话、不由本地触发重呼。 CF-13当前剩余范围按D-054仅保留自动外呼准确识别字段及编码对应。",
            "D-054 / SRC-084：呼入号码识别一般针对被呼叫的坐席绑定手机号，软电话大概率识别不到，并非绝对不支持。本项目按API-319响应status（人工接听、人工未接听、系统应答、系统未应答）展示接听结果；查询statuses数字1–4与响应值分开。识别只保留为可选补充，不用于判断来电客户号码状态或接听，不把坐席手机号未接识别成客户空号/停机；缺失识别不阻断呼入记录和报表。status缺失、非法或与时间证据冲突仍按原规则核对。sipCauseAsyncUpdateFlag只适用于预测话单；CF-13仅余自动外呼准确识别字段及编码对应。"
          ],
          "bidirectional": false,
          "relatedDecisionIds": [
            "D-053"
          ],
          "decisionId": "D-054",
          "sourceRefs": [
            "SRC-083",
            "SRC-084"
          ],
          "sourceType": "user_relayed_supplier_feedback"
        },
        {
          "id": "alicti-edge-cdr-media",
          "source": "alicti-cdr",
          "target": "alicti-media",
          "label": "按通话标识获取",
          "points": [
            [
              745,
              989
            ],
            [
              830,
              989
            ]
          ],
          "lx": 788,
          "ly": 975,
          "status": "documented",
          "refs": [
            "API-320",
            "DOC-346"
          ],
          "detail": "录音和 RASR 按各自接口要求的通话标识查询，可用时间独立。",
          "rules": [
            "D-053 / SRC-083（2026-09-20）：预测外呼话单sipCauseAsyncUpdateFlag=1表示号码识别结果已异步写回本通sipCause，0表示同步；不是通话状态、等待中或识别必成功标志。识别依据电话提示音，可能无法识别；彩铃等场景可能补偿识别，约延迟1–2分钟，仅为经验范围，不是固定完成时限。迟到结果按账号及原通话键补充原sipCause，保留原始值和来源，不新增通话、不由本地触发重呼。 CF-13当前剩余范围按D-054仅保留自动外呼准确识别字段及编码对应。"
          ],
          "bidirectional": false,
          "relatedDecisionIds": [],
          "decisionId": "D-053",
          "sourceRefs": [
            "SRC-083"
          ],
          "sourceType": "user_relayed_supplier_feedback"
        },
        {
          "id": "alicti-edge-ivr-router",
          "source": "alicti-ivr",
          "target": "alicti-inbound-rules",
          "label": "目标及条件配置",
          "points": [
            [
              1130,
              720
            ],
            [
              1175,
              720
            ],
            [
              1175,
              1380
            ],
            [
              210,
              1380
            ],
            [
              210,
              1470
            ]
          ],
          "lx": 1020,
          "ly": 1380,
          "status": "documented",
          "refs": [
            "API-350",
            "API-351",
            "API-352",
            "API-353",
            "API-354"
          ],
          "detail": "既有IVR资源可作为呼入规则目标，路由CRUD不等于流程内容编辑或版本发布。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "alicti-edge-queue-skill",
          "source": "alicti-queue",
          "target": "alicti-queue-skills",
          "label": "队列引用技能",
          "points": [
            [
              360,
              1789
            ],
            [
              445,
              1789
            ]
          ],
          "lx": 403,
          "ly": 1775,
          "status": "documented",
          "refs": [
            "API-377",
            "API-378",
            "API-382"
          ],
          "detail": "queueSkills及queueSkill接口描述技能关系，不是直接编辑坐席名单。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "alicti-edge-queue-agent",
          "source": "alicti-queue-skills",
          "target": "alicti-queue-members",
          "label": "实际结果另查",
          "points": [
            [
              745,
              1789
            ],
            [
              830,
              1789
            ]
          ],
          "lx": 788,
          "ly": 1775,
          "status": "documented",
          "refs": [
            "DOC-342",
            "API-382"
          ],
          "detail": "平台应查实际qno成员，不由技能ID或本地名单推断供应商同步完成。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "alicti-edge-skill-queue",
          "source": "alicti-skill",
          "target": "alicti-queue-skills",
          "label": "skillId 对象关联",
          "points": [
            [
              745,
              449
            ],
            [
              780,
              449
            ],
            [
              780,
              1640
            ],
            [
              595,
              1640
            ],
            [
              595,
              1735
            ]
          ],
          "lx": 605,
          "ly": 1638,
          "status": "documented",
          "refs": [
            "API-309",
            "API-382"
          ],
          "detail": "坐席技能与队列技能以供应商skillId关联；tenantId与本地physicalGroupId由平台维护，非该供应商字段。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "alicti-edge-agent-settings-relation",
          "source": "alicti-agent-operations",
          "target": "alicti-agent-settings",
          "label": "同一本人会话",
          "points": [
            [
              360,
              2059
            ],
            [
              445,
              2059
            ]
          ],
          "lx": 402,
          "ly": 2045,
          "status": "documented",
          "refs": [
            "API-304"
          ],
          "detail": "这些是公开坐席操作模块方法，本图不推断供应商内部服务调用顺序。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "alicti-edge-agent-supervisor-relation",
          "source": "alicti-agent-settings",
          "target": "alicti-agent-queue-status",
          "label": "班长能力另授权",
          "points": [
            [
              745,
              2059
            ],
            [
              830,
              2059
            ]
          ],
          "lx": 788,
          "ly": 2045,
          "status": "documented",
          "refs": [
            "API-304"
          ],
          "detail": "queueStatus仅班长席可用，与本方管理角色和队列配置权限不是同一概念。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "alicti-edge-login-agent-operations",
          "source": "alicti-login",
          "target": "alicti-agent-operations",
          "label": "短期材料与原工号",
          "points": [
            [
              1130,
              164
            ],
            [
              1175,
              164
            ],
            [
              1175,
              1900
            ],
            [
              210,
              1900
            ],
            [
              210,
              2005
            ]
          ],
          "lx": 620,
          "ly": 1888,
          "status": "documented",
          "refs": [
            "API-302",
            "API-304"
          ],
          "detail": "先取得短期sessionKey再按原String工号登录；鉴权成功不代表设备话路和班长权限已验证。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "alicti-edge-outbound-membership",
          "source": "alicti-outbound-group",
          "target": "alicti-outbound-members",
          "label": "组号与工号关联",
          "points": [
            [
              360,
              2324
            ],
            [
              445,
              2324
            ]
          ],
          "lx": 403,
          "ly": 2310,
          "status": "documented",
          "refs": [
            "API-391",
            "API-393",
            "API-394"
          ],
          "detail": "供应商外呼组关系，原String工号0012和12分别处理。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "alicti-edge-extension-login",
          "source": "alicti-extensions",
          "target": "alicti-agent-operations",
          "label": "分机用于登录绑定",
          "points": [
            [
              210,
              2525
            ],
            [
              18,
              2525
            ],
            [
              18,
              2190
            ],
            [
              210,
              2190
            ],
            [
              210,
              2113
            ]
          ],
          "lx": 210,
          "ly": 2430,
          "status": "platform",
          "refs": [
            "API-304",
            "DOC-355"
          ],
          "detail": "login.bindTel选已开通分机，配置目录与当前会话分别核验。",
          "rules": [],
          "bidirectional": false
        },
        {
          "id": "alicti-edge-time-task-ref",
          "source": "alicti-enterprise-time",
          "target": "alicti-task",
          "label": "任务按条件执行",
          "points": [
            [
              595,
              2525
            ],
            [
              780,
              2525
            ],
            [
              780,
              785
            ],
            [
              595,
              785
            ],
            [
              595,
              773
            ]
          ],
          "lx": 715,
          "ly": 2430,
          "status": "platform",
          "refs": [
            "API-311",
            "DOC-356"
          ],
          "detail": "接口配置与执行效果分开验收；图中不推断供应商内部调度拓扑。",
          "rules": [],
          "bidirectional": false
        }
      ]
    },
    {
      "id": "reports",
      "name": "报表与线索数据链路",
      "short": "报表与线索",
      "subtitle": "区分供应商累计、话单聚合与平台线索成效。",
      "width": 1200,
      "height": 1060,
      "groups": [
        {
          "name": "AliCti 已公开查询能力",
          "x": 30,
          "y": 25,
          "w": 1130,
          "h": 225,
          "tone": "documented",
          "note": ""
        },
        {
          "name": "本方适配与证据",
          "x": 30,
          "y": 295,
          "w": 1130,
          "h": 225,
          "tone": "platform",
          "note": ""
        },
        {
          "name": "平台聚合与授权",
          "x": 30,
          "y": 565,
          "w": 1130,
          "h": 225,
          "tone": "platform",
          "note": ""
        },
        {
          "name": "业务查看与保存",
          "x": 30,
          "y": 835,
          "w": 1130,
          "h": 200,
          "tone": "platform",
          "note": ""
        }
      ],
      "nodes": [
        {
          "id": "reports-cdr",
          "key": "cdr",
          "title": "分类话单",
          "subtitle": "人工 · 预测 · 自动 · 呼入",
          "x": 60,
          "y": 108,
          "w": 300,
          "h": 108,
          "status": "documented",
          "scope": "公开查询能力",
          "refs": [
            "API-317",
            "API-318",
            "API-319",
            "API-362"
          ],
          "role": "按类型读取完整原始话单，客户接听与人工桥接分开。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "自动cdrAutoTask不具备人工桥接证据。",
            "坐席分段API-361仅核对文档，未接入当前汇总。",
            "D-050 / SRC-080：供应商话单只记cno、不记坐席主键；删除不清除历史话单，按cno查询或报表会合并新旧通话。仅凭话单不能精确拆分同工号的新旧坐席身份，不将旧记录改写归属新坐席。",
            "D-053 / SRC-083（2026-09-20）：预测外呼话单sipCauseAsyncUpdateFlag=1表示号码识别结果已异步写回本通sipCause，0表示同步；不是通话状态、等待中或识别必成功标志。识别依据电话提示音，可能无法识别；彩铃等场景可能补偿识别，约延迟1–2分钟，仅为经验范围，不是固定完成时限。迟到结果按账号及原通话键补充原sipCause，保留原始值和来源，不新增通话、不由本地触发重呼。 CF-13当前剩余范围按D-054仅保留自动外呼准确识别字段及编码对应。",
            "D-054 / SRC-084：呼入号码识别一般针对被呼叫的坐席绑定手机号，软电话大概率识别不到，并非绝对不支持。本项目按API-319响应status（人工接听、人工未接听、系统应答、系统未应答）展示接听结果；查询statuses数字1–4与响应值分开。识别只保留为可选补充，不用于判断来电客户号码状态或接听，不把坐席手机号未接识别成客户空号/停机；缺失识别不阻断呼入记录和报表。status缺失、非法或与时间证据冲突仍按原规则核对。sipCauseAsyncUpdateFlag只适用于预测话单；CF-13仅余自动外呼准确识别字段及编码对应。"
          ],
          "identifiers": [],
          "drill": null,
          "relatedDecisionIds": [
            "D-050",
            "D-053"
          ],
          "decisionId": "D-054",
          "sourceRefs": [
            "SRC-080",
            "SRC-083",
            "SRC-084"
          ],
          "sourceType": "user_relayed_supplier_feedback"
        },
        {
          "id": "reports-totals",
          "key": "totals",
          "title": "任务累计",
          "subtitle": "predictiveObReport",
          "x": 440,
          "y": 108,
          "w": 300,
          "h": 108,
          "status": "documented",
          "scope": "公开查询能力",
          "refs": [
            "API-365",
            "DOC-373"
          ],
          "role": "查询所选任务自创建以来的官方累计。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "calledCount为含重呼的次数，不是线索数。",
            "接口不支持日期筛选；缺快照不以本地话单补齐。",
            "D-053 / SRC-083（2026-09-20）：预测外呼话单sipCauseAsyncUpdateFlag=1表示号码识别结果已异步写回本通sipCause，0表示同步；不是通话状态、等待中或识别必成功标志。识别依据电话提示音，可能无法识别；彩铃等场景可能补偿识别，约延迟1–2分钟，仅为经验范围，不是固定完成时限。迟到结果按账号及原通话键补充原sipCause，保留原始值和来源，不新增通话、不由本地触发重呼。 CF-13当前剩余范围按D-054仅保留自动外呼准确识别字段及编码对应。"
          ],
          "identifiers": [],
          "drill": null,
          "relatedDecisionIds": [],
          "decisionId": "D-053",
          "sourceRefs": [
            "SRC-083"
          ],
          "sourceType": "user_relayed_supplier_feedback"
        },
        {
          "id": "reports-native",
          "key": "native",
          "title": "其他原生统计",
          "subtitle": "日报 · 坐席 · 队列",
          "x": 820,
          "y": 108,
          "w": 300,
          "h": 108,
          "status": "documented",
          "scope": "公开查询能力",
          "refs": [
            "API-366",
            "API-367",
            "API-368"
          ],
          "role": "已有独立请求与解析适配，当前业务报表UI仍主要用本地话单聚合。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "D-049已确认telEnterCount=队列来电接听数、telAnswerCount=进入队列来电数，两者均String；保留原键原值，不自行重算比率。",
            "D-040：新增队列配置不意味着原生队列报表已接入；保留独立统计适配和现有报表口径，不回写历史providerQueueNo。",
            "D-049 / SRC-079（user_relayed_supplier_feedback）：telEnterCount（String）为队列来电接听数，telAnswerCount（String）为进入队列来电数。保留供应商原字段名与原值，不交换计数或自行重算接听率；CF-14已关闭。本次不新增原生队列报表UI，也不改变本地话单聚合口径。",
            "D-050 / SRC-080：供应商话单只记cno、不记坐席主键；删除不清除历史话单，按cno查询或报表会合并新旧通话。仅凭话单不能精确拆分同工号的新旧坐席身份，不将旧记录改写归属新坐席。",
            "D-053 / SRC-083（2026-09-20）：预测外呼话单sipCauseAsyncUpdateFlag=1表示号码识别结果已异步写回本通sipCause，0表示同步；不是通话状态、等待中或识别必成功标志。识别依据电话提示音，可能无法识别；彩铃等场景可能补偿识别，约延迟1–2分钟，仅为经验范围，不是固定完成时限。迟到结果按账号及原通话键补充原sipCause，保留原始值和来源，不新增通话、不由本地触发重呼。 CF-13当前剩余范围按D-054仅保留自动外呼准确识别字段及编码对应。"
          ],
          "identifiers": [],
          "drill": null,
          "relatedDecisionIds": [
            "D-049",
            "D-050"
          ],
          "decisionId": "D-053",
          "sourceRefs": [
            "SRC-079",
            "SRC-080",
            "SRC-083"
          ],
          "sourceType": "user_relayed_supplier_feedback"
        },
        {
          "id": "reports-facts",
          "key": "facts",
          "title": "话单事实规范化",
          "subtitle": "身份 · 接听 · 时间 · 时长",
          "x": 60,
          "y": 378,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "本方设计",
          "refs": [
            "API-317",
            "API-318",
            "API-319",
            "API-362"
          ],
          "role": "AliCtiReportFacts按来源解释字段，ReportMetrics按已结束及可归属证据计算。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "epoch秒转毫秒，时长秒单独处理；缺失不补零。",
            "0012与12独立；IVR接起不等于人工接听。",
            "D-050 / SRC-080：供应商话单只记cno、不记坐席主键；删除不清除历史话单，按cno查询或报表会合并新旧通话。仅凭话单不能精确拆分同工号的新旧坐席身份，不将旧记录改写归属新坐席。",
            "D-053 / SRC-083（2026-09-20）：预测外呼话单sipCauseAsyncUpdateFlag=1表示号码识别结果已异步写回本通sipCause，0表示同步；不是通话状态、等待中或识别必成功标志。识别依据电话提示音，可能无法识别；彩铃等场景可能补偿识别，约延迟1–2分钟，仅为经验范围，不是固定完成时限。迟到结果按账号及原通话键补充原sipCause，保留原始值和来源，不新增通话、不由本地触发重呼。 CF-13当前剩余范围按D-054仅保留自动外呼准确识别字段及编码对应。",
            "D-054 / SRC-084：呼入号码识别一般针对被呼叫的坐席绑定手机号，软电话大概率识别不到，并非绝对不支持。本项目按API-319响应status（人工接听、人工未接听、系统应答、系统未应答）展示接听结果；查询statuses数字1–4与响应值分开。识别只保留为可选补充，不用于判断来电客户号码状态或接听，不把坐席手机号未接识别成客户空号/停机；缺失识别不阻断呼入记录和报表。status缺失、非法或与时间证据冲突仍按原规则核对。sipCauseAsyncUpdateFlag只适用于预测话单；CF-13仅余自动外呼准确识别字段及编码对应。",
            "D-066 / SRC-096：列表、详情、任务内通话共用CloudCallRecords.display与AliCtiReportFacts，核验API-317/318/319/362类型、账号及显式供应商通话标识。接口来源对象存在时，raw或字段缺失、不合法或身份冲突不借本地接通/结束标签或时长补值；没有来源对象的纯本地演示仍可显示本地时间、工号和时长，不作为供应商事实。真实0秒保留，秒值只转换一次，按实际开始时间筛选。",
            "自动外呼显示客户接听时长，预测分别显示双方通话与客户接听时长；呼入分开系统应答、首次人工接听与首次进出队列。工号为String，实际队列只读qno/firstCallQno；cnoFlow/qnoFlow保留供应商值，不能以技能代替实际队列。",
            "关联原任务须账号、租户、通话类型、本地与供应商taskId一致；只有供应商ID时要求唯一匹配。冲突不改绑且不开放再次联系。关联任务设置在详细信息中折叠只读，使用原任务摘要；业务联系轮次与供应商重试轮次、最终呼叫标记分开。",
            "本通语音流程仅取话单ivrName/ivrId，不从任务所选流程推断。当前详情不展示虚构IVR版本、节点或本地补齐话单操作；公开ivrFlow/query能力不等于本通已取得执行节点。"
          ],
          "identifiers": [],
          "drill": null,
          "relatedDecisionIds": [
            "D-050",
            "D-053"
          ],
          "decisionId": "D-054",
          "sourceRefs": [
            "SRC-080",
            "SRC-083",
            "SRC-084"
          ],
          "sourceType": "user_relayed_supplier_feedback"
        },
        {
          "id": "reports-summary",
          "key": "summary",
          "title": "官方统计适配",
          "subtitle": "AliCtiReportSummary",
          "x": 440,
          "y": 378,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "本方设计",
          "refs": [
            "API-365",
            "API-366",
            "API-367",
            "API-368"
          ],
          "role": "保留原始统计及查询范围，转换分钟/HH:mm:ss；合计行不重复累加。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "任务累计已供任务行使用。",
            "日报、坐席、队列纯适配器不冒充当前UI已接原生报表。",
            "D-049 / SRC-079（user_relayed_supplier_feedback）：telEnterCount（String）为队列来电接听数，telAnswerCount（String）为进入队列来电数。保留供应商原字段名与原值，不交换计数或自行重算接听率；CF-14已关闭。本次不新增原生队列报表UI，也不改变本地话单聚合口径。",
            "D-050 / SRC-080：供应商话单只记cno、不记坐席主键；删除不清除历史话单，按cno查询或报表会合并新旧通话。仅凭话单不能精确拆分同工号的新旧坐席身份，不将旧记录改写归属新坐席。",
            "D-053 / SRC-083（2026-09-20）：预测外呼话单sipCauseAsyncUpdateFlag=1表示号码识别结果已异步写回本通sipCause，0表示同步；不是通话状态、等待中或识别必成功标志。识别依据电话提示音，可能无法识别；彩铃等场景可能补偿识别，约延迟1–2分钟，仅为经验范围，不是固定完成时限。迟到结果按账号及原通话键补充原sipCause，保留原始值和来源，不新增通话、不由本地触发重呼。 CF-13当前剩余范围按D-054仅保留自动外呼准确识别字段及编码对应。",
            "D-054 / SRC-084：呼入号码识别一般针对被呼叫的坐席绑定手机号，软电话大概率识别不到，并非绝对不支持。本项目按API-319响应status（人工接听、人工未接听、系统应答、系统未应答）展示接听结果；查询statuses数字1–4与响应值分开。识别只保留为可选补充，不用于判断来电客户号码状态或接听，不把坐席手机号未接识别成客户空号/停机；缺失识别不阻断呼入记录和报表。status缺失、非法或与时间证据冲突仍按原规则核对。sipCauseAsyncUpdateFlag只适用于预测话单；CF-13仅余自动外呼准确识别字段及编码对应。"
          ],
          "identifiers": [],
          "drill": null,
          "relatedDecisionIds": [
            "D-049",
            "D-050",
            "D-053"
          ],
          "decisionId": "D-054",
          "sourceRefs": [
            "SRC-079",
            "SRC-080",
            "SRC-083",
            "SRC-084"
          ],
          "sourceType": "user_relayed_supplier_feedback"
        },
        {
          "id": "reports-business",
          "key": "business",
          "title": "原客户与跟进快照",
          "subtitle": "当前分类字段 · 必填校验 · 按单据入档",
          "x": 820,
          "y": 378,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "本方设计",
          "refs": [
            "API-326"
          ],
          "role": "通话中按业务分类动态填写客户信息，正式保存到本次通话及客户档案；档案按业务分类与业务单据分别展示。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "保存后更新当前版本，失败保留输入。",
            "D-060：同一任务新增联系行保留品牌、字符串线索编码及原任务/批次/条目/通话；本任务业务联系次数独立，不改写供应商重呼轮次。",
            "D-034：plannedStoreName 独立文本快照，名称改变时清理历史 ID，不把文本转成租户关联。",
            "D-053 / SRC-083（2026-09-20）：预测外呼话单sipCauseAsyncUpdateFlag=1表示号码识别结果已异步写回本通sipCause，0表示同步；不是通话状态、等待中或识别必成功标志。识别依据电话提示音，可能无法识别；彩铃等场景可能补偿识别，约延迟1–2分钟，仅为经验范围，不是固定完成时限。迟到结果按账号及原通话键补充原sipCause，保留原始值和来源，不新增通话、不由本地触发重呼。 CF-13当前剩余范围按D-054仅保留自动外呼准确识别字段及编码对应。",
            "D-085：客户管理仅设业务分类菜单，同页维护分类和独立字段库；取消业务模板。分类在 enterpriseId + tenantId 内以有序fields数组直接引用稳定fieldId，每项包含enabled、required，数组位置决定顺序。分类可零字段，线索分类须直接含六项预置统计字段；不同分类可共用字段定义但各自配置显示与必填。导入采用启用分类，通话按分类字段加载；草稿可空，正式保存校验。原型不迁移旧模板。字段/选项选填businessKey仅作本地外部映射，不替代内部ID、不发送AliCti。",
            "文本、多行、数字、单选、多选、日期、日期时间；默认选填。预置线索统计字段保留固定类型和统计含义，其他分类不能误归线索。",
            "D-063 / SRC-093：客户列表不固定显示线索/意向列；详情按当前业务分类和单据展示字段。导入与分配记录只读，不嵌套查看批次；批次维护从独立菜单进入。档案证据不足显示结果未知，不改底层状态与识别编码。"
          ],
          "identifiers": [],
          "drill": null,
          "relatedDecisionIds": [],
          "decisionId": "D-053",
          "sourceRefs": [
            "SRC-083"
          ],
          "sourceType": "user_relayed_supplier_feedback"
        },
        {
          "id": "reports-scope",
          "key": "scope",
          "title": "权限与来源校验",
          "subtitle": "先过滤，再计算",
          "x": 60,
          "y": 648,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "本方设计",
          "refs": [
            "API-326"
          ],
          "role": "从当前品牌账号与授权对象确定可用来源，详情导出重新校验。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "当前账号仅统计唯一业务租户；不通过手机号、号码或品牌扩大授权。",
            "D-053 / SRC-083（2026-09-20）：预测外呼话单sipCauseAsyncUpdateFlag=1表示号码识别结果已异步写回本通sipCause，0表示同步；不是通话状态、等待中或识别必成功标志。识别依据电话提示音，可能无法识别；彩铃等场景可能补偿识别，约延迟1–2分钟，仅为经验范围，不是固定完成时限。迟到结果按账号及原通话键补充原sipCause，保留原始值和来源，不新增通话、不由本地触发重呼。 CF-13当前剩余范围按D-054仅保留自动外呼准确识别字段及编码对应。"
          ],
          "identifiers": [],
          "drill": null,
          "relatedDecisionIds": [
            "D-053"
          ],
          "decisionId": "D-068",
          "sourceRefs": [
            "SRC-083",
            "SRC-098"
          ],
          "sourceType": "user_product_confirmation"
        },
        {
          "id": "reports-leads",
          "key": "leads",
          "title": "线索成效聚合",
          "subtitle": "LeadReport",
          "x": 440,
          "y": 648,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "本方设计",
          "refs": [
            "API-326"
          ],
          "role": "同品牌账号完整编码合并可见历史；首次可见导入确定日期集合。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "同手机号异码独立，缺码逐行。",
            "任务批次坐席筛选选线索，保留其其他可见历史。",
            "未完成包含未联系；意向计划不算实际到店。",
            "D-060：仅本人安排及本人可见通话精确关联来源参与运营报表，不扩大他人名单可见范围；再次联系不新增任务。",
            "D-034 / FA-133、FA-134：计划到店门店按名称显示与文本包含筛选；多任务同线索汇总保留全部授权可见历史。",
            "D-053 / SRC-083（2026-09-20）：预测外呼话单sipCauseAsyncUpdateFlag=1表示号码识别结果已异步写回本通sipCause，0表示同步；不是通话状态、等待中或识别必成功标志。识别依据电话提示音，可能无法识别；彩铃等场景可能补偿识别，约延迟1–2分钟，仅为经验范围，不是固定完成时限。迟到结果按账号及原通话键补充原sipCause，保留原始值和来源，不新增通话、不由本地触发重呼。 CF-13当前剩余范围按D-054仅保留自动外呼准确识别字段及编码对应。",
            "D-085：客户管理仅设业务分类菜单，同页维护分类和独立字段库；取消业务模板。分类在 enterpriseId + tenantId 内以有序fields数组直接引用稳定fieldId，每项包含enabled、required，数组位置决定顺序。分类可零字段，线索分类须直接含六项预置统计字段；不同分类可共用字段定义但各自配置显示与必填。导入采用启用分类，通话按分类字段加载；草稿可空，正式保存校验。原型不迁移旧模板。字段/选项选填businessKey仅作本地外部映射，不替代内部ID、不发送AliCti。",
            "当前报表仅统计所选enterpriseId的唯一业务租户，不新增跨账号汇总。若后续经明确授权建设同品牌跨账号线索汇总，业务唯一键应为brandId+完整线索编码；当前不得按品牌名合并或加载未授权账号数据。"
          ],
          "identifiers": [],
          "drill": null,
          "relatedDecisionIds": [
            "D-053"
          ],
          "decisionId": "D-068",
          "sourceRefs": [
            "SRC-083",
            "SRC-098"
          ],
          "sourceType": "user_product_confirmation"
        },
        {
          "id": "reports-views",
          "key": "views",
          "title": "七类报表",
          "subtitle": "列表 · 筛选 · 全量导出",
          "x": 820,
          "y": 648,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "本方设计",
          "refs": [
            "API-326"
          ],
          "role": "分别呈现话单统计、供应商任务累计及本方线索成效。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "不把次数、客户数与线索数互相替代。",
            "D-053 / SRC-083（2026-09-20）：预测外呼话单sipCauseAsyncUpdateFlag=1表示号码识别结果已异步写回本通sipCause，0表示同步；不是通话状态、等待中或识别必成功标志。识别依据电话提示音，可能无法识别；彩铃等场景可能补偿识别，约延迟1–2分钟，仅为经验范围，不是固定完成时限。迟到结果按账号及原通话键补充原sipCause，保留原始值和来源，不新增通话、不由本地触发重呼。 CF-13当前剩余范围按D-054仅保留自动外呼准确识别字段及编码对应。"
          ],
          "identifiers": [],
          "drill": null,
          "relatedDecisionIds": [],
          "decisionId": "D-053",
          "sourceRefs": [
            "SRC-083"
          ],
          "sourceType": "user_relayed_supplier_feedback"
        },
        {
          "id": "reports-detail",
          "key": "detail",
          "title": "详情与业务保存",
          "subtitle": "右侧抽屉 · 返回后刷新",
          "x": 440,
          "y": 905,
          "w": 300,
          "h": 108,
          "status": "platform",
          "scope": "本方设计",
          "refs": [
            "API-326",
            "API-317",
            "API-318",
            "API-319",
            "API-362"
          ],
          "role": "线索到通话和档案子抽屉，保存当前通话快照，返回重新读已保存值并保持位置。",
          "inputs": [],
          "outputs": [],
          "rules": [
            "首保存取规范通话版本，旧表单拒绝覆盖。",
            "客户档案仍按原手机号规则，不改变为线索主键。",
            "D-053 / SRC-083（2026-09-20）：预测外呼话单sipCauseAsyncUpdateFlag=1表示号码识别结果已异步写回本通sipCause，0表示同步；不是通话状态、等待中或识别必成功标志。识别依据电话提示音，可能无法识别；彩铃等场景可能补偿识别，约延迟1–2分钟，仅为经验范围，不是固定完成时限。迟到结果按账号及原通话键补充原sipCause，保留原始值和来源，不新增通话、不由本地触发重呼。 CF-13当前剩余范围按D-054仅保留自动外呼准确识别字段及编码对应。",
            "D-054 / SRC-084：呼入号码识别一般针对被呼叫的坐席绑定手机号，软电话大概率识别不到，并非绝对不支持。本项目按API-319响应status（人工接听、人工未接听、系统应答、系统未应答）展示接听结果；查询statuses数字1–4与响应值分开。识别只保留为可选补充，不用于判断来电客户号码状态或接听，不把坐席手机号未接识别成客户空号/停机；缺失识别不阻断呼入记录和报表。status缺失、非法或与时间证据冲突仍按原规则核对。sipCauseAsyncUpdateFlag只适用于预测话单；CF-13仅余自动外呼准确识别字段及编码对应。",
            "D-063 / SRC-093：客户列表不固定显示线索/意向列；详情按当前业务分类和单据展示字段。导入与分配记录只读，不嵌套查看批次；批次维护从独立菜单进入。档案证据不足显示结果未知，不改底层状态与识别编码。",
            "D-066 / SRC-096：列表、详情、任务内通话共用CloudCallRecords.display与AliCtiReportFacts，核验API-317/318/319/362类型、账号及显式供应商通话标识。接口来源对象存在时，raw或字段缺失、不合法或身份冲突不借本地接通/结束标签或时长补值；没有来源对象的纯本地演示仍可显示本地时间、工号和时长，不作为供应商事实。真实0秒保留，秒值只转换一次，按实际开始时间筛选。",
            "自动外呼显示客户接听时长，预测分别显示双方通话与客户接听时长；呼入分开系统应答、首次人工接听与首次进出队列。工号为String，实际队列只读qno/firstCallQno；cnoFlow/qnoFlow保留供应商值，不能以技能代替实际队列。",
            "关联原任务须账号、租户、通话类型、本地与供应商taskId一致；只有供应商ID时要求唯一匹配。冲突不改绑且不开放再次联系。关联任务设置在详细信息中折叠只读，使用原任务摘要；业务联系轮次与供应商重试轮次、最终呼叫标记分开。",
            "本通语音流程仅取话单ivrName/ivrId，不从任务所选流程推断。当前详情不展示虚构IVR版本、节点或本地补齐话单操作；公开ivrFlow/query能力不等于本通已取得执行节点。"
          ],
          "identifiers": [],
          "drill": null,
          "relatedDecisionIds": [
            "D-053"
          ],
          "decisionId": "D-054",
          "sourceRefs": [
            "SRC-083",
            "SRC-084"
          ],
          "sourceType": "user_relayed_supplier_feedback"
        }
      ],
      "edges": [
        {
          "id": "reports-edge-cdr-facts",
          "source": "reports-cdr",
          "target": "reports-facts",
          "label": "原始话单",
          "points": [
            [
              210,
              216
            ],
            [
              210,
              378
            ]
          ],
          "lx": 210,
          "ly": 297,
          "status": "platform",
          "refs": [
            "API-326"
          ],
          "detail": "原始话单，保持身份和权限边界。",
          "rules": [
            "D-050 / SRC-080：供应商话单只记cno、不记坐席主键；删除不清除历史话单，按cno查询或报表会合并新旧通话。仅凭话单不能精确拆分同工号的新旧坐席身份，不将旧记录改写归属新坐席。",
            "D-053 / SRC-083（2026-09-20）：预测外呼话单sipCauseAsyncUpdateFlag=1表示号码识别结果已异步写回本通sipCause，0表示同步；不是通话状态、等待中或识别必成功标志。识别依据电话提示音，可能无法识别；彩铃等场景可能补偿识别，约延迟1–2分钟，仅为经验范围，不是固定完成时限。迟到结果按账号及原通话键补充原sipCause，保留原始值和来源，不新增通话、不由本地触发重呼。 CF-13当前剩余范围按D-054仅保留自动外呼准确识别字段及编码对应。"
          ],
          "bidirectional": false,
          "relatedDecisionIds": [
            "D-050"
          ],
          "decisionId": "D-053",
          "sourceRefs": [
            "SRC-080",
            "SRC-083"
          ],
          "sourceType": "user_relayed_supplier_feedback"
        },
        {
          "id": "reports-edge-total-summary",
          "source": "reports-totals",
          "target": "reports-summary",
          "label": "累计快照",
          "points": [
            [
              590,
              216
            ],
            [
              590,
              378
            ]
          ],
          "lx": 590,
          "ly": 297,
          "status": "platform",
          "refs": [
            "API-326"
          ],
          "detail": "累计快照，保持身份和权限边界。",
          "rules": [
            "D-053 / SRC-083（2026-09-20）：预测外呼话单sipCauseAsyncUpdateFlag=1表示号码识别结果已异步写回本通sipCause，0表示同步；不是通话状态、等待中或识别必成功标志。识别依据电话提示音，可能无法识别；彩铃等场景可能补偿识别，约延迟1–2分钟，仅为经验范围，不是固定完成时限。迟到结果按账号及原通话键补充原sipCause，保留原始值和来源，不新增通话、不由本地触发重呼。 CF-13当前剩余范围按D-054仅保留自动外呼准确识别字段及编码对应。"
          ],
          "bidirectional": false,
          "relatedDecisionIds": [],
          "decisionId": "D-053",
          "sourceRefs": [
            "SRC-083"
          ],
          "sourceType": "user_relayed_supplier_feedback"
        },
        {
          "id": "reports-edge-fact-scope",
          "source": "reports-facts",
          "target": "reports-scope",
          "label": "规范事实",
          "points": [
            [
              210,
              486
            ],
            [
              210,
              648
            ]
          ],
          "lx": 210,
          "ly": 567,
          "status": "platform",
          "refs": [
            "API-326"
          ],
          "detail": "规范事实，保持身份和权限边界。",
          "rules": [
            "D-053 / SRC-083（2026-09-20）：预测外呼话单sipCauseAsyncUpdateFlag=1表示号码识别结果已异步写回本通sipCause，0表示同步；不是通话状态、等待中或识别必成功标志。识别依据电话提示音，可能无法识别；彩铃等场景可能补偿识别，约延迟1–2分钟，仅为经验范围，不是固定完成时限。迟到结果按账号及原通话键补充原sipCause，保留原始值和来源，不新增通话、不由本地触发重呼。 CF-13当前剩余范围按D-054仅保留自动外呼准确识别字段及编码对应。"
          ],
          "bidirectional": false,
          "relatedDecisionIds": [],
          "decisionId": "D-053",
          "sourceRefs": [
            "SRC-083"
          ],
          "sourceType": "user_relayed_supplier_feedback"
        },
        {
          "id": "reports-edge-lead-detail",
          "source": "reports-leads",
          "target": "reports-detail",
          "label": "查看与返回",
          "points": [
            [
              590,
              756
            ],
            [
              590,
              905
            ]
          ],
          "lx": 590,
          "ly": 830,
          "status": "platform",
          "refs": [
            "API-326"
          ],
          "detail": "查看与返回，保持身份和权限边界。 D-063 / SRC-093：客户列表不固定显示线索/意向列；详情按当前业务分类和单据展示字段。导入与分配记录只读，不嵌套查看批次；批次维护从独立菜单进入。档案证据不足显示结果未知，不改底层状态与识别编码。",
          "rules": [
            "D-053 / SRC-083（2026-09-20）：预测外呼话单sipCauseAsyncUpdateFlag=1表示号码识别结果已异步写回本通sipCause，0表示同步；不是通话状态、等待中或识别必成功标志。识别依据电话提示音，可能无法识别；彩铃等场景可能补偿识别，约延迟1–2分钟，仅为经验范围，不是固定完成时限。迟到结果按账号及原通话键补充原sipCause，保留原始值和来源，不新增通话、不由本地触发重呼。 CF-13当前剩余范围按D-054仅保留自动外呼准确识别字段及编码对应。"
          ],
          "bidirectional": false,
          "relatedDecisionIds": [],
          "decisionId": "D-053",
          "sourceRefs": [
            "SRC-083"
          ],
          "sourceType": "user_relayed_supplier_feedback"
        },
        {
          "id": "reports-edge-business-leads",
          "source": "reports-business",
          "target": "reports-leads",
          "label": "可见原客户及跟进",
          "points": [
            [
              970,
              486
            ],
            [
              970,
              548
            ],
            [
              590,
              548
            ],
            [
              590,
              648
            ]
          ],
          "lx": 785,
          "ly": 548,
          "status": "platform",
          "refs": [
            "API-326"
          ],
          "detail": "线索按完整编码；线索内置字段保持原聚合口径。其他业务分类和各业务单据信息独立展示，不能合并成线索。",
          "rules": [
            "D-053 / SRC-083（2026-09-20）：预测外呼话单sipCauseAsyncUpdateFlag=1表示号码识别结果已异步写回本通sipCause，0表示同步；不是通话状态、等待中或识别必成功标志。识别依据电话提示音，可能无法识别；彩铃等场景可能补偿识别，约延迟1–2分钟，仅为经验范围，不是固定完成时限。迟到结果按账号及原通话键补充原sipCause，保留原始值和来源，不新增通话、不由本地触发重呼。 CF-13当前剩余范围按D-054仅保留自动外呼准确识别字段及编码对应。"
          ],
          "bidirectional": false,
          "relatedDecisionIds": [],
          "decisionId": "D-053",
          "sourceRefs": [
            "SRC-083"
          ],
          "sourceType": "user_relayed_supplier_feedback"
        },
        {
          "id": "reports-edge-scope-leads",
          "source": "reports-scope",
          "target": "reports-leads",
          "label": "授权后合并",
          "points": [
            [
              360,
              702
            ],
            [
              440,
              702
            ]
          ],
          "lx": 400,
          "ly": 688,
          "status": "platform",
          "refs": [
            "API-326"
          ],
          "detail": "来源权限过滤先于线索合并。",
          "rules": [
            "D-053 / SRC-083（2026-09-20）：预测外呼话单sipCauseAsyncUpdateFlag=1表示号码识别结果已异步写回本通sipCause，0表示同步；不是通话状态、等待中或识别必成功标志。识别依据电话提示音，可能无法识别；彩铃等场景可能补偿识别，约延迟1–2分钟，仅为经验范围，不是固定完成时限。迟到结果按账号及原通话键补充原sipCause，保留原始值和来源，不新增通话、不由本地触发重呼。 CF-13当前剩余范围按D-054仅保留自动外呼准确识别字段及编码对应。"
          ],
          "bidirectional": false,
          "relatedDecisionIds": [],
          "decisionId": "D-053",
          "sourceRefs": [
            "SRC-083"
          ],
          "sourceType": "user_relayed_supplier_feedback"
        },
        {
          "id": "reports-edge-leads-views",
          "source": "reports-leads",
          "target": "reports-views",
          "label": "已应用条件",
          "points": [
            [
              740,
              702
            ],
            [
              820,
              702
            ]
          ],
          "lx": 780,
          "ly": 688,
          "status": "platform",
          "refs": [
            "API-326"
          ],
          "detail": "导出全部筛选结果，不限当前页。",
          "rules": [
            "D-053 / SRC-083（2026-09-20）：预测外呼话单sipCauseAsyncUpdateFlag=1表示号码识别结果已异步写回本通sipCause，0表示同步；不是通话状态、等待中或识别必成功标志。识别依据电话提示音，可能无法识别；彩铃等场景可能补偿识别，约延迟1–2分钟，仅为经验范围，不是固定完成时限。迟到结果按账号及原通话键补充原sipCause，保留原始值和来源，不新增通话、不由本地触发重呼。 CF-13当前剩余范围按D-054仅保留自动外呼准确识别字段及编码对应。"
          ],
          "bidirectional": false,
          "relatedDecisionIds": [],
          "decisionId": "D-053",
          "sourceRefs": [
            "SRC-083"
          ],
          "sourceType": "user_relayed_supplier_feedback"
        },
        {
          "id": "reports-edge-native-summary",
          "source": "reports-native",
          "target": "reports-summary",
          "label": "独立纯适配",
          "points": [
            [
              970,
              216
            ],
            [
              970,
              278
            ],
            [
              690,
              278
            ],
            [
              690,
              378
            ]
          ],
          "lx": 850,
          "ly": 278,
          "status": "platform",
          "refs": [
            "API-366",
            "API-367",
            "API-368"
          ],
          "detail": "日报、坐席和队列请求及解析适配已有，当前UI未接入原生报表。",
          "rules": [
            "D-050 / SRC-080：供应商话单只记cno、不记坐席主键；删除不清除历史话单，按cno查询或报表会合并新旧通话。仅凭话单不能精确拆分同工号的新旧坐席身份，不将旧记录改写归属新坐席。",
            "D-053 / SRC-083（2026-09-20）：预测外呼话单sipCauseAsyncUpdateFlag=1表示号码识别结果已异步写回本通sipCause，0表示同步；不是通话状态、等待中或识别必成功标志。识别依据电话提示音，可能无法识别；彩铃等场景可能补偿识别，约延迟1–2分钟，仅为经验范围，不是固定完成时限。迟到结果按账号及原通话键补充原sipCause，保留原始值和来源，不新增通话、不由本地触发重呼。 CF-13当前剩余范围按D-054仅保留自动外呼准确识别字段及编码对应。"
          ],
          "bidirectional": false,
          "relatedDecisionIds": [
            "D-050"
          ],
          "decisionId": "D-053",
          "sourceRefs": [
            "SRC-080",
            "SRC-083"
          ],
          "sourceType": "user_relayed_supplier_feedback"
        },
        {
          "id": "reports-edge-summary-views",
          "source": "reports-summary",
          "target": "reports-views",
          "label": "仅任务累计",
          "points": [
            [
              740,
              432
            ],
            [
              790,
              432
            ],
            [
              790,
              600
            ],
            [
              970,
              600
            ],
            [
              970,
              648
            ]
          ],
          "lx": 875,
          "ly": 600,
          "status": "platform",
          "refs": [
            "API-365"
          ],
          "detail": "当前任务报表行读取官方任务累计快照；其他原生统计不混入话单聚合视图。",
          "rules": [
            "D-053 / SRC-083（2026-09-20）：预测外呼话单sipCauseAsyncUpdateFlag=1表示号码识别结果已异步写回本通sipCause，0表示同步；不是通话状态、等待中或识别必成功标志。识别依据电话提示音，可能无法识别；彩铃等场景可能补偿识别，约延迟1–2分钟，仅为经验范围，不是固定完成时限。迟到结果按账号及原通话键补充原sipCause，保留原始值和来源，不新增通话、不由本地触发重呼。 CF-13当前剩余范围按D-054仅保留自动外呼准确识别字段及编码对应。"
          ],
          "bidirectional": false,
          "relatedDecisionIds": [],
          "decisionId": "D-053",
          "sourceRefs": [
            "SRC-083"
          ],
          "sourceType": "user_relayed_supplier_feedback"
        }
      ]
    }
  ],
  "apis": {
    "API-301": {
      "id": "API-301",
      "name": "服务端接口签名",
      "endpoint": "/interface/v10/",
      "status": "partial",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/权限验证/接口鉴权.html"
      ],
      "notes": [
        "供应商账号ID：enterpriseId是供应商账号ID；本地按String保存，接口文档要求Int，适配前校验为不含前导零且处于JavaScript安全整数范围的正整数再转换。演示总部账号7522240、同品牌门店账号7522241；UUID不参与接口。",
        "鉴权方式：本项目使用2，按enterpriseId验证；departmentId分支不采用。",
        "签名时间：Unix秒；签名时间有效期30分钟，不能传浏览器毫秒。",
        "接口签名：正式接口要求 MD5(enterpriseId+timestamp+部门token)，32位小写。用户明确本原型仅演示，不必计算真实签名。",
        "账号组织与号码自动归属：每个enterpriseId只关联0或1个总部/门店业务租户，内置超级租户不计入；每个业务租户仍只关联一个AliCti账号。tenantId与enterpriseId分别保留，平台登录账号仍可按成员授权加入多个租户。总部7522240与门店7522241属于同一品牌，但资源和业务数据按各自账号及租户隔离。"
      ]
    },
    "API-302": {
      "id": "API-302",
      "name": "坐席前端登录鉴权",
      "endpoint": "/agentLogin/authenticateJsonp",
      "status": "partial",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/权限验证/座席前端登录鉴权.html"
      ],
      "notes": [
        "坐席登录工号：D-014供应商澄清：鉴权文档Int是笔误，实际工号均为String；鉴权与登录须保持完整工号一致。0012、012与12是不同工号，不能转整数或补零归一。",
        "短期登录材料：30秒过期指建立连接的材料；不等于已建立电话会话每30秒失效。",
        "电话网关地址：保持返回字段原拼写agentGateWayUrl，映射到login的webSocketUrl。",
        "电话上线失败与连接中断反馈：鉴权过期或媒体初始化失败在发起上线处显示原因并提供重试；软电话分机未配置或无法读取时在发送登录请求前阻止上线。 D-052：breakLine(-1)断开、code=0信令恢复；SDK最多20次自动重连，sipDisconnected需重新登录。"
      ]
    },
    "API-303": {
      "id": "API-303",
      "name": "CTILink初始化与电话上线",
      "endpoint": null,
      "status": "partial",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/工具条/快速入门.html"
      ],
      "notes": [
        "待接听事件与通话身份：ringingIb为呼入待接听；ringingAgentOb为预外呼坐席振铃。供应商事件按enterpriseId、原字符串cno、contactId关联；本地事件另核对callId、tenantId、accountId，预外呼须精确关联taskId、customerTaskItemId及原客户号码。 新分配时任务须运行中，且当前坐席属于任务指定名单或外呼组成员；已分配后任务暂停不阻断原通话归档。",
        "接听设备与请求：本项目统一登录bindType=3，浏览器接听按钮请求sipLink；busyIb或busyOb才分别确认呼入或预外呼坐席话路建立。1/2仅为官方参考，不作为本项目可选登录方式。",
        "D-052 / SRC-082（2026-09-20，user_relayed_supplier_feedback）：breakLine的code=-1为连接断开，code=0为重连成功；SDK自动最多20次重连，每次回调，超过需重新登录。平台不另建重连循环、不按回调次数推断耗尽；sipDisconnected为无参软电话中断通知，坐席需重新登录。",
        "D-052：breakLine code=0仅证明信令重连，不证明媒体可用或原通话恢复。事件绑定当前有效会话，旧会话事件不影响新登录；保留通话、草稿和未知操作保护。原型待通话及记录处理完成后可由本人主动重登，成功暂停接听并需明确恢复；这一保护不等于官方要求所有信令恢复均强制重登。CF-11仍保留跨设备互斥、异常退出清理、媒体就绪与最终状态核验，以及setOffline回执矛盾。"
      ]
    },
    "API-304": {
      "id": "API-304",
      "name": "坐席状态与退出",
      "endpoint": null,
      "status": "partial",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/工具条/座席操作.html"
      ],
      "notes": [
        "电话网关地址：保持返回字段原拼写agentGateWayUrl，映射到login的webSocketUrl。",
        "坐席受控软电话分机：D-055在D-046上改为从分机资源目录选择，禁止手填。Agent.login.bindTel为必填String，读取本账号本租户已启用且未占用资源原exten，保留前导零；不进入agent/create或agent/update。",
        "电话绑定类型：login.bindType=1普通电话、2分机、3软电话；Agent返回bindTelType=4软电话，两个枚举不同。",
        "登录状态：登录请求loginStatus 1置闲、2置忙，按用户选择；状态字典0离线/1在线/2置忙/3整理是另一层枚举。",
        "完全下线并保留接听电话绑定：logoutMode 0退出但后台在线、1完全退出；removeBinding 0保留、1解除设备绑定，logoutMode=1时生效。",
        "预览外呼转写开关：D-015截图明确：企业开启自动转写且按坐席过滤时，坐席isAsr=1且单次cdrIsAsr=1或不传才允许转写，仍须满足时长等规则；任一为0不转写。",
        "被叫号码：传外呼号码；已开号码隐藏时可用customerNumberKey，不能传空。",
        "本通电话向客户显示的号码：人工预览外呼obClid从当前租户授权、可用于人工外呼的有效号码自动选择，发送完整号码；不由坐席手动选择，不依赖技能。任务仍保留任务号码选择。",
        "请求关联ID：用于请求与话单关联，未承诺供应商幂等。",
        "随路变量：数组元素为name、value、type；type=1普通变量，type=2 PJSIP_HEADER最多5个。",
        "电话上线失败与连接中断反馈：鉴权过期或媒体初始化失败在发起上线处显示原因并提供重试；软电话分机未配置或无法读取时在发送登录请求前阻止上线。 D-052：breakLine(-1)断开、code=0信令恢复；SDK最多20次自动重连，sipDisconnected需重新登录。",
        "接听设备与请求：本项目统一登录bindType=3，浏览器接听按钮请求sipLink；busyIb或busyOb才分别确认呼入或预外呼坐席话路建立。1/2仅为官方参考，不作为本项目可选登录方式。",
        "固定软电话与上线状态：官方loginStatus 1置闲、2置忙；workingMode支持String 0/4/5。本项目统一软电话bindType=3，workingMode由本人单选0/4/5并随login提交；上线状态、选填pauseDescription和工作模式由本人设置。",
        "完全下线并保留接听电话绑定：官方logoutMode 0退出但后台在线、1完全退出；removeBinding 0保留、1解除电话绑定。本期普通退出固定logoutMode=1、removeBinding=0，不开放解绑。",
        "暂停接听类型与原因：CTILink.Agent.pause使用pauseType 1普通置忙、2休息及非空pauseDescription。",
        "恢复接听：unpause无业务参数。本人可请求置闲；业务完整保存且phase idle后自动调用unpause，回执成功并核对ready才恢复接听。",
        "在线修改接听设备：changeBindTel的bindType仅1普通电话、2分机，bindTel为接听设备号码String；登录bindType=3不能套用此方法。",
        "延长整理时间：wrapupTime值域30–600秒，仅实际处于整理态可执行；文档列not in wrapup等失败。",
        "在线切换工作模式：官方0兼顾预览和预测、4预览、5预测；changeWorkingMode单值必选。声明Agent与示例AgentTask不一致。D-072要求普通坐席登录当次选择模式直接提交login，D-071在线切换继续适用；登录逗号多值不作为产品选择暴露。",
        "班长队列监控范围与内容：仅阿里侧班长可用；qnos逗号连接，fields取queueParams、agentStatuses、queueEntries，省略或空不返回对应字段。",
        "请求回执、状态及偏好隔离：按当前enterpriseId、tenantId、账号、原始String cno及请求标识核验；失败保持原值、未知保护。原型未知结果仅通过LOCAL_MOCK.inspectSeatSession读取独立本地模拟快照，不是SDK或agentStatus/get响应。正式DOC-344只定义state、stateAction、loginStatus、deviceStatus、mainUniqueId、extenReachable，不能核对bindTel、bindType、workingMode或整理截止时间；这些配置须由对应SDK回执或另行核实的可信来源确认，未查明部分继续保持未知。",
        "管理置忙、置闲与下线：目标工号原字符串；setPause/setUnpause仅传monitoredCno，setOffline另传removeBinding=0保留绑定。不提供setOnline。 setOffline回调表reqType写为setPause，与方法名不一致。 先核ADMIN、本人已上线且班长权限已确认、同租户授权队列目标及新鲜状态；空闲可置忙，置忙可置闲，空闲/置忙可下线。离线只读概览和事件日志不授予管理能力。通话/振铃/整理不执行。官方setOffline回执reqType表述矛盾保留CF-11，未知刷新核对目标状态。",
        "事件来源与最小展示字段：API-316的/user/agent为企业WebSocket事件订阅，不是历史查询；API-315 type=9仅定义座席状态变更推送设置，未给统一事件载荷、时间戳和去重键。DOC-344 agentStatus/get按enterpriseId+cno返回当前state，不返回历史；差异只能标为本地观察。CTILink breakLine/sipDisconnected及明确成功的操作回执可作为各自事件来源。"
      ]
    },
    "API-305": {
      "id": "API-305",
      "name": "座席通话操作",
      "endpoint": "CTILink.Session 通话控制",
      "status": "partial",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/工具条/座席通话操作.html"
      ],
      "notes": [
        "静音方向：direction=in输入音频流/out输出音频流/all全部；同一方法切换静音，不存在本页请求state参数。"
      ]
    },
    "API-306": {
      "id": "API-306",
      "name": "WebRTC软电话操作",
      "endpoint": null,
      "status": "partial",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/工具条/软电话通话操作.html"
      ],
      "notes": [
        "接听设备与请求：本项目统一登录bindType=3，浏览器接听按钮请求sipLink；busyIb或busyOb才分别确认呼入或预外呼坐席话路建立。1/2仅为官方参考，不作为本项目可选登录方式。"
      ]
    },
    "API-307": {
      "id": "API-307",
      "name": "新增坐席",
      "endpoint": "agent/create",
      "status": "partial",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/座席数据管理/座席新增.html"
      ],
      "notes": [
        "坐席登录工号：D-014供应商澄清：鉴权文档Int是笔误，实际工号均为String；鉴权与登录须保持完整工号一致。0012、012与12是不同工号，不能转整数或补零归一。",
        "坐席姓名：UTF-8 URL编码；本地userName转换成name，在请求序列化时编码一次。",
        "坐席工号：3–10位正整数字符串，保留前导零，不能是全零。",
        "所属区号：区号为数字字符串；保持前导零，不凭空增加官方未规定的位数限制。",
        "坐席联系手机号输入（取消）：当前agent/create没有mobile入参；本期已移除坐席新增及账号关联新建坐席中的联系手机号输入。平台账号自身手机号资料独立保留。",
        "坐席启停：active只接受0停用/1启用，与status在线配置分开；未知或缺失不得默认映射。",
        "外呼许可：0不允许、1允许；不代表已上线或所有号码可用。",
        "预览外呼转写开关：D-015截图明确：企业开启自动转写且按坐席过滤时，坐席isAsr=1且单次cdrIsAsr=1或不传才允许转写，仍须满足时长等规则；任一为0不转写。",
        "座席质检开关：0关闭、1开启，字段名称为isQualityCheck。",
        "班长席权限：power 0普通坐席、1班长；本地租户ADMIN关联坐席按产品策略申请1，其他角色申请0。",
        "账号组织与号码自动归属：每个enterpriseId只关联0或1个总部/门店业务租户，内置超级租户不计入；每个业务租户仍只关联一个AliCti账号。tenantId与enterpriseId分别保留，平台登录账号仍可按成员授权加入多个租户。总部7522240与门店7522241属于同一品牌，但资源和业务数据按各自账号及租户隔离。"
      ]
    },
    "API-308": {
      "id": "API-308",
      "name": "更新坐席",
      "endpoint": "agent/update",
      "status": "partial",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/座席数据管理/座席更新.html"
      ],
      "notes": [
        "坐席受控软电话分机：D-055在D-046上改为从分机资源目录选择，禁止手填。Agent.login.bindTel为必填String，读取本账号本租户已启用且未占用资源原exten，保留前导零；不进入agent/create或agent/update。",
        "坐席姓名：UTF-8 URL编码；本地userName转换成name，在请求序列化时编码一次。",
        "坐席启停：active只接受0停用/1启用，与status在线配置分开；未知或缺失不得默认映射。",
        "外呼许可：0不允许、1允许；不代表已上线或所有号码可用。",
        "本通电话向客户显示的号码：人工预览外呼obClid从当前租户授权、可用于人工外呼的有效号码自动选择，发送完整号码；不由坐席手动选择，不依赖技能。任务仍保留任务号码选择。",
        "坐席配置与话务状态：坐席列表话务状态采用官方state，启用状态采用active，二者独立；未知state保留待核对，不将在线当空闲。删除记录不进入当前列表。"
      ]
    },
    "API-309": {
      "id": "API-309",
      "name": "批量全量替换技能",
      "endpoint": "agent/batchUpdateAgentSkill",
      "status": "partial",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/座席数据管理/批量更新座席技能列表.html"
      ],
      "notes": [
        "坐席工号：3–10位正整数字符串，保留前导零，不能是全零。",
        "多个技能：逗号分隔多个供应商技能ID，0清空所有技能；更新为全量替换。",
        "技能等级：skillLevels逗号分隔，与技能ID逐个对应；越小越优先。供应商补充表及用户本轮确认采用1–10整数，本地校验；不引用队列weight的相反优先级规则。",
        "批量失败坐席：data.failCno的字段定义和示例均为String，示例为\"[0002, 100003]\"；result=0仍需逐席检查失败列表。",
        "在线新增技能待提交：在线仅允许在原集合不变前提下增加技能，新增标待生效/待提交，不参与分配。下线后管理员点击提交新增技能，正式请求仍是完整目标集合。"
      ]
    },
    "API-310": {
      "id": "API-310",
      "name": "企业号码查询",
      "endpoint": "enterpriseHotline/listPage",
      "status": "partial",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/配置管理/企业管理/获取企业号码列表接口.html"
      ],
      "notes": [
        "已有号码完整值与查询：number为精确查询条件，hotline为完整号码；按当前AliCti账号查询并导入已有号码，不选择或登记线路。",
        "号码类型：1热线、2固话、3SIP手机号、4虚拟手机号；查询支持类型多选。",
        "启停状态：供应商status=0停用、1启用；已有号码导入允许两者，停用保持已隔离、启用保持正常。",
        "预览客户侧用途：1允许/0不允许，缺字段不是0。",
        "预测客户侧用途：与预览客户侧isInUse、预测坐席侧isPredictiveRight分别读取。",
        "号码创建与更新时间：时间戳单位毫秒；与话单查询秒级时间不同。",
        "号码启停：POST enterpriseHotline/batchUpdateNumber，完整号码包含区号，最多1000；status=0停用/1启用。查询使用offset/limit，data为顶层数组。",
        "账号号码查询与选择：enterpriseHotline/listPage按当前enterpriseId查询；number为完整号码精确查询，status选填0/1；界面每页8条offset分页、保留跨页多选，接口limit最大1000。totalCount、pageSize按官方字符串处理。",
        "本地号码归属与恢复：确认本地Inbound/Outbound/Bidirection使用方向；含400号码时仅呼入。保留供应商id、完整hotline、status、九项外显等原始属性。无lineId/importedLine字段或线路选择。"
      ]
    },
    "API-311": {
      "id": "API-311",
      "name": "预测与自动IVR任务创建",
      "endpoint": "task/create",
      "status": "partial",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/预测式外呼/新增任务接口.html"
      ],
      "notes": [
        "任务名称：UTF-8 URL编码，少于50字；请求序列化编码一次。",
        "任务类型：1预测外呼、2自动外呼，创建后不可修改。",
        "预测任务分配方式：1工号列表、2外呼组；技能ID不是外呼组号，创建后不能改指定方式。",
        "接听坐席列表：逗号分隔工号；一个坐席只能在一个运行任务中。",
        "外呼组号：外呼组与技能是不同资源。",
        "语音流程ID：同时传入ivrId优先；本地流程ID不是供应商ivrId。",
        "预测溢出语音流程：自动外呼才明确要求二选一；预测直连用于无坐席时溢出。",
        "自动外呼执行队列：task/create没有要求自动外呼提交平台执行队列。",
        "最少可用坐席：预测外呼允许1–10，低于设定值时自动暂停。",
        "自动开始：autoStart=1时autoStartDay/autoStartTime至少一个生效；不填写字段时分别默认当天/00:00:00。",
        "计划开始时间：yyyy-MM-dd / HH:mm:ss，单字段scheduleAt不能直接透传。",
        "最大重呼次数：retry为重试次数，不含首次；strategy按轮次逐项配置。基础模式为对象，高级模式为数组。",
        "每轮重呼间隔与起算方式：time为天-小时-分钟；timeType=1首次、2上次呼叫，默认1。首次起算时每轮时间须严格递增。",
        "号码识别重试条件：D-020：用户转述阿里反馈，预测外呼也支持按号码状态重呼；两类任务统一采用一组condition.sipCause多码数组，715和183按编码整体匹配。关闭省略相关字段并按不启用重呼处理，是当前项目采用口径。",
        "自动完成：官方autoComplete=1（缺省）表示号码全部完成后结束，0表示号码全部完成后暂停；本项目新建预测任务显式提交0，自动外呼显式提交1。",
        "自动删除：任务容量溢出时是否删最早结束任务，不是任务属性。",
        "供应商任务ID：平台任务ID和供应商任务ID分别保存。",
        "任务号码：单号码tel必填并保留字符串；taskTelList不超过8MB。clid是每条名单行独立的可选完整号码字段，不是任务级外显号码配置。",
        "纯IVR录音：当前材料不足以将纯IVR统一判定为无录音。",
        "预测任务坐席分配方式：官方1随机、2顺序、3从上次通话结束到当前最长、4当前空闲状态最长，官方缺省随机。本期新建显式4；D-044原型缺失值须重新选择，不自动按1解释。",
        "任务关联可呼叫和禁呼时间：autoTaskType=0普通/1间隔呼叫；autoTriggerTimeStrategy为可呼叫时间ID逗号串，timeStrategy为禁呼时间ID逗号串。结束安排显式autoStop=1，autoStopDay为YYYY-MM-DD、autoStopTime为HH:mm:ss；原型同时填写日期时间。呼入ruleTimeProperty仍用分号，不混用。",
        "任务级固定号码配置边界：API-311和API-404没有任务级指定号码参数；两类任务从当前enterpriseId已登记的多个外显导航中显式选择一个，提交category=5和单个customerClidsGroup；号码池与customerTimeout按接口选填。",
        "账号多外显导航与任务单选：按用户转述的AliCti技术澄清，一个enterpriseId可关联多个外显导航；导航名称和标识线下提供，由自建系统在既有账号资料中登记。同一任务只选择一个导航，创建预外呼及自动外呼时提交customerClidsCategory=5和单个String customerClidsGroup；一个导航可配合多个号码池。API-311/API-404仅证明单次任务字段，不证明供应商导航目录、有效性或选号结果。",
        "外显导航号码池及优先级：一个外显导航可配合多个号码池。号码池由当前租户唯一关联enterpriseId的AliCti hybridGroup/list提供；任务可选择多个本租户池，clidPoolList每项只传name与手动选填整数priority，数值越小越优先，留空省略。池类型、空池、同优先级及远端变更生效时点继续列CF-15。",
        "客户接听等待时间：预外呼和自动外呼共用，默认30秒，允许5–60秒整数；不是坐席振铃、队列等待、通话时长或重呼间隔。",
        "任务描述：description按UTF-8编码提交；不从任务名称或历史备注推造。",
        "供应商任务业务标签：多个标签以英文逗号分隔；这是供应商任务标签名称，不等同本地客户业务分类或业务字段。",
        "定时完成时强制结束：0关闭、1开启，官方默认0；仅在定时完成启用时影响到时是否强制结束，与autoComplete的名单呼完行为分开。",
        "任务仅当天生效清理范围：0关闭；1删除待重试及待呼叫；2仅删除待重试；3仅删除待呼叫。此字段会影响未执行号码，不是任务结束时间。",
        "待重呼与首次呼叫顺序：strategy中按sort确定retryCall与firstCall顺序；retryCall.desc=0小轮次优先、1大轮次优先；firstCall.orderType=0按优先级、1随机、2按导入时间。",
        "任务最大并发：任务维度最大并发限制；仅type=1的0有官方明确的不限制语义，预测坐席少于10时官方建议配置。",
        "预测客户接听后流转模式：1直连座席，2 AI转人工；直连模式可按配置溢出语音流程，AI转人工先进入所选AliCti语音流程。",
        "预测座席接听超时：官方默认10秒，允许5–60秒；与客户接听等待customerTimeout分开。",
        "预测座席整理时间：官方默认30秒，允许1–10800秒；影响每次拨打个数，不代表本地话后保存倒计时。",
        "预测座席最长空闲等待：官方默认40秒，允许10–600秒；任务执行中平均空闲时间超过设定值时每次呼叫个数可能增加。截图15秒是后台示例值。",
        "预测拨打系数：官方默认1，大于0且不超过20，最多两位小数；截图3.00是后台示例值。系数越大可能拨打更多号码。",
        "预测超呼率：官方默认100，允许50–400；不与quotiety、初始化接通率或坐席利用率混算。",
        "预测任务预热：初始化预计客户接通率默认50且1–100；预热时间默认300秒且60–600；暂停后重新预热默认开启，0关闭、1开启。",
        "自动任务语音流程名称快照：API-311创建type=2时ivrId/ivrName至少选一个，二者同传时ID优先。创建确认、任务详情和查看管理显示本任务已保存的语音流程名称，优先取本任务冻结的planSnapshot或创建设置快照；名称缺失显示未记录，不从当前共享流程目录或某次话单的实际ivrName反推。",
        "最小可用座席数及定时自动恢复：API-311/API-404：预测任务minAvailableAgentCount默认10、取1–10；任务内可用座席数低于阈值时自动暂停。autoStart=1表示定时开始，autoStartDay和autoStartTime至少配置一项。用户转述供应商业务口径：只有设置定时开始且因座席不足自动暂停的任务，人数恢复到不少于阈值时自动启动。"
      ]
    },
    "API-312": {
      "id": "API-312",
      "name": "任务号码导入",
      "endpoint": "task/importTaskTel",
      "status": "partial",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/预测式外呼/任务号码导入接口.html"
      ],
      "notes": [
        "导入批次：fileId用于向已存在的供应商批次加号；平台批次ID不能直接使用。",
        "任务号码：单号码tel必填并保留字符串；taskTelList不超过8MB。clid是每条名单行独立的可选完整号码字段，不是任务级外显号码配置。",
        "客户行来源：属性是JSON字符串，不是task.userFields或SDK.callVariables。",
        "排重范围：0不排重、1任务内、2导入号码、3批次内；任务与批次排重切换不追溯。",
        "导入后自动开始：0不自动启动、1自动启动。",
        "导入统计：请求总数、导入成功数与非法数分别处理，失败明细依赖推送配置。",
        "客户与批次业务字段：业务编码与来源行归属由平台维护，可选择序列化入property，但回传需核验。",
        "原任务追加名单与联系来源：再次联系保留原taskId与供应商任务ID，在原任务下新增一个导入批次及客户行。importTaskTel仅提交本次新增名单，isRepeat=0、importTelAutoStart=0；沿用原任务资源、策略和执行安排，不进入创建向导。repeatContact保存来源任务、批次、客户行、通话、根行及businessContactNo。",
        "预外呼任务直接导入：仅管理员可向本范围待分配客户、尚无名单/执行结果/启动记录/供应商任务的预外呼任务直接导入；自动外呼继续从导入与分配进入。",
        "任务级固定号码配置边界：API-311和API-404没有任务级指定号码参数；两类任务从当前enterpriseId已登记的多个外显导航中显式选择一个，提交category=5和单个customerClidsGroup；号码池与customerTimeout按接口选填。"
      ]
    },
    "API-313": {
      "id": "API-313",
      "name": "暂停任务",
      "endpoint": "task/pause",
      "status": "partial",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/预测式外呼/任务暂停接口.html"
      ],
      "notes": [
        "暂停参数处理：D-017用户决定：调用task/pause不提交pauseDuration，不提供本地暂停时长输入、默认值、单位转换或恢复计时。TaskProperty原始返回仅保留作查询证据。D-021用户产品确认：暂停后可以继续；结束后不再执行后续首次呼叫及尚未执行的重呼。"
      ]
    },
    "API-314": {
      "id": "API-314",
      "name": "结束任务",
      "endpoint": "task/stop",
      "status": "partial",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/预测式外呼/任务结束接口.html"
      ],
      "notes": [
        "终止不可当作暂停；在途保护和结果结算待实测。"
      ]
    },
    "API-315": {
      "id": "API-315",
      "name": "配置HTTP推送",
      "endpoint": "/cc/create_push_action",
      "status": "partial",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/配置管理/推送管理/新增推送设置接口.html"
      ],
      "notes": [
        "HTTP推送配置：name账号内唯一；type=42为预测任务状态推送。目标ID优先；直配method=0/1、contentType=1/2、timeout=1–10。返回requestId和id在顶层。",
        "事件来源与最小展示字段：API-316的/user/agent为企业WebSocket事件订阅，不是历史查询；API-315 type=9仅定义座席状态变更推送设置，未给统一事件载荷、时间戳和去重键。DOC-344 agentStatus/get按enterpriseId+cno返回当前state，不返回历史；差异只能标为本地观察。CTILink breakLine/sipDisconnected及明确成功的操作回执可作为各自事件来源。"
      ]
    },
    "API-316": {
      "id": "API-316",
      "name": "企业WebSocket事件",
      "endpoint": null,
      "status": "partial",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/工具条/企业WebSocket事件推送接口说明.html"
      ],
      "notes": [
        "WebSocket范围：企业默认全坐席消息，需要平台按资源和租户映射过滤。",
        "事件来源与最小展示字段：API-316的/user/agent为企业WebSocket事件订阅，不是历史查询；API-315 type=9仅定义座席状态变更推送设置，未给统一事件载荷、时间戳和去重键。DOC-344 agentStatus/get按enterpriseId+cno返回当前state，不返回历史；差异只能标为本地观察。CTILink breakLine/sipDisconnected及明确成功的操作回执可作为各自事件来源。"
      ]
    },
    "API-317": {
      "id": "API-317",
      "name": "人工外呼话单",
      "endpoint": "/cc/list_cdr_ob",
      "status": "partial",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/通话记录/外呼/外呼记录接口.html"
      ],
      "notes": [
        "请求关联ID：用于请求与话单关联，未承诺供应商幂等。",
        "话单查询窗口：Unix秒，开始时间区间不得超过一个月；limit为10–1000、默认10；普通分页offset+limit≤100000，scroll另行处理。",
        "人工接听状态：1客户未接/2坐席未接/3客户接听/4坐席接听；与号码识别编码不同。",
        "接听时间：人工upTime为坐席、bridgeTime为客户；预测upTime为客户、bridgeTime为坐席；自动任务upTime为客户；呼入answerTime为系统应答、bridgeTime为人工接通。原响应示例与相邻Duration独立证明epoch秒，统一乘1000供本地日期展示，原值保留。",
        "人工号码识别：人工响应读取这两个字段；查询过滤参数名sipCause不是响应同名保证。",
        "统计与跟进结果：话单事实先校验身份/类型，已结束按官方startTime归期；未知接通不算未接，按主通话标识去重。客户接通率=已接通/(已接通+未接通)，与线索接通率分母不同。",
        "主通话与供应商身份：先核对当前账号、话单类型及已有对应字段；mainUniqueId是主通话标识，requestUniqueId是请求关联，callId/uniqueId不自动等价。",
        "通话周期与结束证据：四类话单正整数秒乘1000；有有效endTime才计周期内已结束通话，按startTime归期。endTime早于startTime无效。",
        "双方通话时长：bridgeDuration为双方通话时长；totalDuration是全程跨度，不能替代。只有已知接通且适用的有效时长进入均值，真实0保留。",
        "坐席归属与呼入分段：工号保留完整字符串；firstCallCno仅首次呼叫目标，cnoFlow是参与流转名单，均非已核定接听分段。",
        "实际队列与报表技能映射边界：供应商队列号不是技能ID；人工话单请求qnos不保证响应qno；firstCallQno是首次目标，不能证明实际最终服务归属。"
      ]
    },
    "API-318": {
      "id": "API-318",
      "name": "预测外呼话单",
      "endpoint": "/cc/list_cdr_predictive_call",
      "status": "partial",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/通话记录/预测式外呼/预测外呼通话记录接口.html"
      ],
      "notes": [
        "供应商任务ID：平台任务ID和供应商任务ID分别保存。",
        "话单查询窗口：Unix秒，开始时间区间不得超过一个月；limit为10–1000、默认10；普通分页offset+limit≤100000，scroll另行处理。",
        "预测接听状态：40客户未接/41客户接听/42坐席未接/43双方接听。",
        "接听时间：人工upTime为坐席、bridgeTime为客户；预测upTime为客户、bridgeTime为坐席；自动任务upTime为客户；呼入answerTime为系统应答、bridgeTime为人工接通。原响应示例与相邻Duration独立证明epoch秒，统一乘1000供本地日期展示，原值保留。",
        "预测号码识别：按官方识别编码，不用719证明客户接起。D-053：预测话单sipCauseAsyncUpdateFlag=1表示识别结果已异步写回本通sipCause，0表示同步；该标识不表示等待中或识别一定成功。原型本地保护在展示前校验话单类型、返回账号及已知供应商通话标识；不匹配结果不采用，原始负载保留。供应商主通话键仅使用明确的providerMainUniqueId/mainUniqueId，不从本地contactId或callId推定。",
        "统计与跟进结果：话单事实先校验身份/类型，已结束按官方startTime归期；未知接通不算未接，按主通话标识去重。客户接通率=已接通/(已接通+未接通)，与线索接通率分母不同。",
        "主通话与供应商身份：先核对当前账号、话单类型及已有对应字段；mainUniqueId是主通话标识，requestUniqueId是请求关联，callId/uniqueId不自动等价。",
        "通话周期与结束证据：四类话单正整数秒乘1000；有有效endTime才计周期内已结束通话，按startTime归期。endTime早于startTime无效。",
        "双方通话时长：bridgeDuration为双方通话时长；totalDuration是全程跨度，不能替代。只有已知接通且适用的有效时长进入均值，真实0保留。",
        "客户接听时长：客户接听时长采用预测或自动任务话单customerBridgeDuration，与bridgeDuration独立。",
        "坐席归属与呼入分段：工号保留完整字符串；firstCallCno仅首次呼叫目标，cnoFlow是参与流转名单，均非已核定接听分段。",
        "实际队列与报表技能映射边界：供应商队列号不是技能ID；人工话单请求qnos不保证响应qno；firstCallQno是首次目标，不能证明实际最终服务归属。",
        "首次与重呼分类：正整数attemptNumber=1首次，>1重呼；无序号时，同范围同名单更早通话能证明重呼，只有完整历史且无更早/同刻/缺时间冲突才证明首次。"
      ]
    },
    "API-319": {
      "id": "API-319",
      "name": "呼入话单",
      "endpoint": "/cc/list_cdr_ib",
      "status": "partial",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/通话记录/来电/客户来电记录接口.html"
      ],
      "notes": [
        "话单查询窗口：Unix秒，开始时间区间不得超过一个月；limit为10–1000、默认10；普通分页offset+limit≤100000，scroll另行处理。",
        "接听时间：人工upTime为坐席、bridgeTime为客户；预测upTime为客户、bridgeTime为坐席；自动任务upTime为客户；呼入answerTime为系统应答、bridgeTime为人工接通。原响应示例与相邻Duration独立证明epoch秒，统一乘1000供本地日期展示，原值保留。",
        "呼入接听状态：枚举人工接听、人工未接听、系统应答、系统未应答。D-054：本项目软电话呼入直接采用status接听状态；号码识别通常无结果，不依赖识别判定接听。",
        "统计与跟进结果：话单事实先校验身份/类型，已结束按官方startTime归期；未知接通不算未接，按主通话标识去重。客户接通率=已接通/(已接通+未接通)，与线索接通率分母不同。",
        "主通话与供应商身份：先核对当前账号、话单类型及已有对应字段；mainUniqueId是主通话标识，requestUniqueId是请求关联，callId/uniqueId不自动等价。",
        "通话周期与结束证据：四类话单正整数秒乘1000；有有效endTime才计周期内已结束通话，按startTime归期。endTime早于startTime无效。",
        "双方通话时长：bridgeDuration为双方通话时长；totalDuration是全程跨度，不能替代。只有已知接通且适用的有效时长进入均值，真实0保留。",
        "坐席归属与呼入分段：工号保留完整字符串；firstCallCno仅首次呼叫目标，cnoFlow是参与流转名单，均非已核定接听分段。",
        "实际队列与报表技能映射边界：供应商队列号不是技能ID；人工话单请求qnos不保证响应qno；firstCallQno是首次目标，不能证明实际最终服务归属。",
        "首次队列等待与离开结果：等待采用firstQueueDuration；只计算有效首队列样本均值。status=系统应答且statusResult为队列中放弃/队列中溢出时分别计数。"
      ]
    },
    "API-320": {
      "id": "API-320",
      "name": "录音地址",
      "endpoint": "record/getUrl",
      "status": "partial",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/通话记录/获取通话录音地址接口.html"
      ],
      "notes": [
        "录音地址：录音URL直接在data，不是data.url或顶层url。",
        "录音有效期：120分钟是可配置默认值，不是每次响应保证。",
        "录音分轨参数：recordFormat=1(wav)才支持分轨；recordSide非空要求callType，mp3忽略分轨。",
        "纯IVR录音：当前材料不足以将纯IVR统一判定为无录音。"
      ]
    },
    "API-321": {
      "id": "API-321",
      "name": "ASR查询（本期不采用）",
      "endpoint": "asr/get",
      "status": "partial",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/ASR语音转写/ASR数据获取接口.html"
      ],
      "notes": [
        "D-015：本期统一rasrEvent/query，原ASR文档仅留作原始资料，不作为当前文本路径。"
      ]
    },
    "API-322": {
      "id": "API-322",
      "name": "导入IVR定义",
      "endpoint": "ivrProfile/import",
      "status": "partial",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/配置管理/语音导航管理/导入ivr信息接口.html"
      ],
      "notes": [
        "示例与标题存在export/import冲突；导入成功不证明发布、绑定号码、租户分支路由已完成。"
      ]
    },
    "API-323": {
      "id": "API-323",
      "name": "查询已执行IVR流程",
      "endpoint": "ivrFlow/query",
      "status": "partial",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/通话记录/获取IVR流程接口.html"
      ],
      "notes": [
        "已执行IVR轨迹：查询某次通话已经执行的节点，不是已发布流程可选列表。"
      ]
    },
    "API-324": {
      "id": "API-324",
      "name": "资源操作核验归类",
      "endpoint": "agent/delete · agent/batchCreate · agent/query · skill/create · enterpriseHotline/batchUpdateNumber",
      "status": "partial",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/配置管理/技能管理/新增技能.html",
        "https://wiki.alicti.cn/html/wiki/API/配置管理/技能管理/更新技能.html",
        "https://wiki.alicti.cn/html/wiki/API/配置管理/技能管理/查询技能列表.html",
        "https://wiki.alicti.cn/html/wiki/API/座席数据管理/座席删除.html",
        "https://wiki.alicti.cn/html/wiki/API/座席数据管理/座席批量新增.html",
        "https://wiki.alicti.cn/html/wiki/API/座席数据管理/座席详细信息列表获取.html",
        "https://wiki.alicti.cn/html/wiki/API/座席数据管理/座席详细信息获取.html",
        "https://wiki.alicti.cn/html/wiki/API/座席数据管理/座席实时状态获取接口.html",
        "https://wiki.alicti.cn/html/wiki/API/配置管理/企业管理/更新号码外显属性.html"
      ],
      "notes": [
        "坐席删除和技能增改查已有文档，支持明确标记的本地模拟；真实资源列为接入准备。",
        "D-046 / SRC-076（承接D-026号码查询）：listPage只读查询已有号码；NumberGrant唯一业务租户归属是平台本地权限，号码不绑定技能组或坐席，可直接保存。status/外显修改另用官方接口，号码池不等于技能组。新资源开通由供应商办理；条件匹配与归属见CF-10；D-048 / SRC-078已确认停用后的选号与在途边界，供应商账号解绑需求取消并改为本地使用开关。",
        "D-050 / SRC-080（user_relayed_supplier_feedback）：坐席按主键物理删除；工号只在当前仍存在的坐席中唯一。重建同工号为新坐席，生成新id/createTime，旧技能、队列成员、绑定电话清除。当前身份与本地配置不可仅凭相同cno自动继承；本次不迁移历史数据。",
        "D-050 / SRC-080：供应商话单只记cno、不记坐席主键；删除不清除历史话单，按cno查询或报表会合并新旧通话。仅凭话单不能精确拆分同工号的新旧坐席身份，不将旧记录改写归属新坐席。",
        "D-051 / SRC-081（2026-09-20，user_relayed_supplier_feedback）：success为主记录建成数，other为其中技能绑定失败子集，不与success相加；fail与success互斥。cnos含全部已建成工号（含other），申请工号区间减去cnos为未建成工号。未传skillIds时other=0；对cnos逐项queryAgentSkill，缺少目标skillId可定位other，查询本身不证明主记录新建。",
        "D-051 / SRC-081：创建结果未知时，agent/query按原cnos读取id/createTime，可使用startTime/endTime；新id且createTime处于本次请求窗口才证实本次主记录。agent/get与queryCnoAndName只证存在，queryAgentSkill只证技能。查询证据不足继续未知，不自动重放写入。CF-08已关闭，不意味着生产接口已联调。"
      ]
    },
    "API-325": {
      "id": "API-325",
      "name": "任务操作核验归类",
      "endpoint": "task/start · task/get",
      "status": "partial",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/预测式外呼/任务启动接口.html",
        "https://wiki.alicti.cn/html/wiki/API/预测式外呼/获取任务信息接口.html"
      ],
      "notes": [
        "启动和任务信息查询已有文档，返回 data.taskProperty。",
        "status：0初始、1运行中、2暂停、3结束。D-017用户转述阿里反馈：继续先get确认2再start，并回查状态；结束不重启。写入受理不等于状态已变化，D-021：结束后不再发起后续首次呼叫或重呼；D-047 / SRC-077用户转述供应商确认：暂停或结束不影响已发起通话，正常通话和正常话单按既有链路归集；未发起呼叫停止。此为供应商答复澄清，不是官网改版或实际联调结果。"
      ]
    },
    "API-326": {
      "id": "API-326",
      "name": "中台账号、客户、授权及统计",
      "endpoint": null,
      "status": "not_required",
      "sources": [],
      "notes": [
        "平台维护租户授权、账号坐席映射、客户批次档案、任务业务状态、归一统计和审计；不存在AliCti等价接口要求。"
      ]
    },
    "API-327": {
      "id": "API-327",
      "name": "号码状态识别编码",
      "endpoint": null,
      "status": "dictionary",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/字段定义/接口部分/号码状态识别编码.html"
      ],
      "notes": [
        "号码识别重试条件：D-020：用户转述阿里反馈，预测外呼也支持按号码状态重呼；两类任务统一采用一组condition.sipCause多码数组，715和183按编码整体匹配。关闭省略相关字段并按不启用重呼处理，是当前项目采用口径。",
        "人工号码识别：人工响应读取这两个字段；查询过滤参数名sipCause不是响应同名保证。",
        "预测号码识别：按官方识别编码，不用719证明客户接起。D-053：预测话单sipCauseAsyncUpdateFlag=1表示识别结果已异步写回本通sipCause，0表示同步；该标识不表示等待中或识别一定成功。原型本地保护在展示前校验话单类型、返回账号及已知供应商通话标识；不匹配结果不采用，原始负载保留。供应商主通话键仅使用明确的providerMainUniqueId/mainUniqueId，不从本地contactId或callId推定。"
      ]
    },
    "DOC-346": {
      "id": "DOC-346",
      "name": "获取RASR信息接口",
      "endpoint": "rasrEvent/query",
      "status": "documented",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/通话记录/获取RASR信息接口.html"
      ],
      "notes": [
        "RASR请求与结果状态：rasrEvent/query按供应商uniqueId查询；result=0成功、-1失败，data为数组。不得沿用旧ASR的-2转写中或用本地callId替代uniqueId。",
        "RASR监测侧文本：解析text中的JSON数组并保留text、monitorSide与原始字段；保留来源及返回顺序，不推算跨来源时间排序或音频位置。",
        "RASR机器人文本：botText明确为机器人对话文本；与text分别解析，不能标为人工坐席发言。",
        "RASR说话方：monitorSide=1坐席侧、2客户侧；webcall对应第二侧/第一侧。botText固定机器人。未知值保留原值，不套用其他接口side。"
      ]
    },
    "DOC-347": {
      "id": "DOC-347",
      "name": "RASR语音转换结果推送变量定义",
      "endpoint": null,
      "status": "dictionary",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/字段定义/推送变量和值/RASR语音转换结果推送变量.html"
      ],
      "notes": [
        "RASR说话方：monitorSide=1坐席侧、2客户侧；webcall对应第二侧/第一侧。botText固定机器人。未知值保留原值，不套用其他接口side。"
      ]
    },
    "DOC-348": {
      "id": "DOC-348",
      "name": "获取IVR列表信息接口",
      "endpoint": "ivrProfile/list",
      "status": "documented",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/配置管理/语音导航管理/获取IVR列表信息接口.html"
      ],
      "notes": [
        "语音流程ID：同时传入ivrId优先；本地流程ID不是供应商ivrId。",
        "预测溢出语音流程：自动外呼才明确要求二选一；预测直连用于无坐席时溢出。",
        "呼入目标：routerType=1提交ivrId整数；=2提交tel字符串；=3提交exten字符串。分机保留前导零。",
        "呼入候选资源：IVR、时间、中继列表data为数组；分机响应为data.list，limit=1–500默认10、offset默认0。"
      ]
    },
    "DOC-349": {
      "id": "DOC-349",
      "name": "获取IVR列表详细信息接口",
      "endpoint": "ivrProfile/listDetail",
      "status": "documented",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/配置管理/语音导航管理/获取IVR列表详细信息接口.html"
      ],
      "notes": [
        "语音流程ID：同时传入ivrId优先；本地流程ID不是供应商ivrId。",
        "预测溢出语音流程：自动外呼才明确要求二选一；预测直连用于无坐席时溢出。"
      ]
    },
    "API-350": {
      "id": "API-350",
      "name": "新增呼入路由设置接口",
      "endpoint": "ivrRouter/create",
      "status": "documented",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/配置管理/呼入路由管理/新增呼入路由设置接口.html"
      ],
      "notes": [
        "呼入接听方式：1语音导航、2电话号码、3分机。新增和编辑按目标分支选择。",
        "呼入目标：routerType=1提交ivrId整数；=2提交tel字符串；=3提交exten字符串。分机保留前导零。",
        "呼入路由优先级：正整数，同一enterpriseId内唯一，数值越小越优先。",
        "呼入路由启用状态：1启用、2停用。创建文档默认1，更新文档默认2。",
        "呼入规则名称与定位：创建name可选；更新与删除的name是原对象定位条件，不是新名称。",
        "呼入规则说明：作为本条路由的说明文本；与响应顶层description结果描述区分。",
        "来电号码及地区条件：传来电号码、前缀或地区区号，多项以分号分隔。",
        "呼入时间条件：传enterpriseTime/list返回的时间条件id，多项分号分隔。时间星期1代表周日、2周一至7周六。",
        "呼入中继号码条件：写接口要求传trunk/list的numberTrunk，不附加areaCode；多项分号分隔。模型示例出现带区号号码，与写入说明有差异。",
        "呼入路由响应结构：list的data为包装对象数组；create/update/get的data为包装对象。enterpriseTimeList可为null；routerProperty根据routerType解释。模型列Int但示例为字符串。"
      ]
    },
    "API-351": {
      "id": "API-351",
      "name": "更新呼入路由设置接口",
      "endpoint": "ivrRouter/update",
      "status": "documented",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/配置管理/呼入路由管理/更新呼入路由设置接口.html"
      ],
      "notes": [
        "呼入接听方式：1语音导航、2电话号码、3分机。新增和编辑按目标分支选择。",
        "呼入目标：routerType=1提交ivrId整数；=2提交tel字符串；=3提交exten字符串。分机保留前导零。",
        "呼入路由优先级：正整数，同一enterpriseId内唯一，数值越小越优先。",
        "呼入路由启用状态：1启用、2停用。创建文档默认1，更新文档默认2。",
        "呼入规则名称与定位：创建name可选；更新与删除的name是原对象定位条件，不是新名称。",
        "呼入规则说明：作为本条路由的说明文本；与响应顶层description结果描述区分。",
        "来电号码及地区条件：传来电号码、前缀或地区区号，多项以分号分隔。",
        "呼入时间条件：传enterpriseTime/list返回的时间条件id，多项分号分隔。时间星期1代表周日、2周一至7周六。",
        "呼入中继号码条件：写接口要求传trunk/list的numberTrunk，不附加areaCode；多项分号分隔。模型示例出现带区号号码，与写入说明有差异。",
        "呼入路由响应结构：list的data为包装对象数组；create/update/get的data为包装对象。enterpriseTimeList可为null；routerProperty根据routerType解释。模型列Int但示例为字符串。",
        "呼入规则删除：删除前规则须停用（active=2）；采用ivrRouter/delete。",
        "呼入旧表单冲突：本地编辑快照已变时拒绝旧值覆盖，保留输入并提示重新打开；改备注不能重新启用已被停用规则。"
      ]
    },
    "API-352": {
      "id": "API-352",
      "name": "获取呼入路由设置列表接口",
      "endpoint": "ivrRouter/list",
      "status": "documented",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/配置管理/呼入路由管理/获取呼入路由设置列表接口.html"
      ],
      "notes": [
        "呼入路由响应结构：list的data为包装对象数组；create/update/get的data为包装对象。enterpriseTimeList可为null；routerProperty根据routerType解释。模型列Int但示例为字符串。"
      ]
    },
    "API-353": {
      "id": "API-353",
      "name": "获取呼入路由设置信息接口",
      "endpoint": "ivrRouter/get",
      "status": "documented",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/配置管理/呼入路由管理/获取呼入路由设置信息接口.html"
      ],
      "notes": [
        "呼入规则名称与定位：创建name可选；更新与删除的name是原对象定位条件，不是新名称。",
        "呼入路由响应结构：list的data为包装对象数组；create/update/get的data为包装对象。enterpriseTimeList可为null；routerProperty根据routerType解释。模型列Int但示例为字符串。"
      ]
    },
    "API-354": {
      "id": "API-354",
      "name": "删除呼入路由设置接口",
      "endpoint": "ivrRouter/delete",
      "status": "documented",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/配置管理/呼入路由管理/删除呼入路由设置接口.html"
      ],
      "notes": [
        "呼入规则名称与定位：创建name可选；更新与删除的name是原对象定位条件，不是新名称。",
        "呼入规则删除：删除前规则须停用（active=2）；采用ivrRouter/delete。"
      ]
    },
    "DOC-355": {
      "id": "DOC-355",
      "name": "获取分机列表",
      "endpoint": "exten/list",
      "status": "documented",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/配置管理/分机管理/获取分机列表.html"
      ],
      "notes": [
        "坐席受控软电话分机：D-055在D-046上改为从分机资源目录选择，禁止手填。Agent.login.bindTel为必填String，读取本账号本租户已启用且未占用资源原exten，保留前导零；不进入agent/create或agent/update。",
        "呼入目标：routerType=1提交ivrId整数；=2提交tel字符串；=3提交exten字符串。分机保留前导零。",
        "呼入候选资源：IVR、时间、中继列表data为数组；分机响应为data.list，limit=1–500默认10、offset默认0。",
        "分机资源身份与软电话类型：exten按String保留前导零，官方长度3–11位；仅数字为本地约束。资源type=2表示WebRTC，与登录bindType=3及Agent返回bindTelType=4分别转换。区号为String。",
        "分机呼叫与媒体设置：active等开关0/1；callPower为String 0/1/2/3。create的isOb、denoise为String，update为Int，分别构造。allow采用alaw,ulaw或myopus,alaw,ulaw。",
        "分机导入与删除核实：list以data.list分页，limit≤500、offset从0；从当前账号导入已存在资源。删除采用batchDelete单元素extens String保留前导零，再以list/get核对。"
      ]
    },
    "DOC-356": {
      "id": "DOC-356",
      "name": "获取时间条件设置列表接口",
      "endpoint": "enterpriseTime/list",
      "status": "documented",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/配置管理/时间管理/获取时间条件设置列表接口.html"
      ],
      "notes": [
        "呼入时间条件：传enterpriseTime/list返回的时间条件id，多项分号分隔。时间星期1代表周日、2周一至7周六。",
        "呼入候选资源：IVR、时间、中继列表data为数组；分机响应为data.list，limit=1–500默认10、offset默认0。",
        "时间条件定义：type=1星期，dayOfWeek逗号分隔1周日至7周六；type=2日期，fromDay/toDay为YYYY-MM-DD；timeType=1连续/2间隔；时间HH:mm。名称与优先级在同enterpriseId内唯一，起止不能倒置；priority必填且为用户手动输入的正整数，不自动分配。",
        "任务关联可呼叫和禁呼时间：autoTaskType=0普通/1间隔呼叫；autoTriggerTimeStrategy为可呼叫时间ID逗号串，timeStrategy为禁呼时间ID逗号串。结束安排显式autoStop=1，autoStopDay为YYYY-MM-DD、autoStopTime为HH:mm:ss；原型同时填写日期时间。呼入ruleTimeProperty仍用分号，不混用。"
      ]
    },
    "DOC-357": {
      "id": "DOC-357",
      "name": "获取中继号码列表",
      "endpoint": "trunk/list",
      "status": "documented",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/配置管理/企业管理/获取中继号码列表.html"
      ],
      "notes": [
        "呼入中继号码条件：写接口要求传trunk/list的numberTrunk，不附加areaCode；多项分号分隔。模型示例出现带区号号码，与写入说明有差异。",
        "呼入候选资源：IVR、时间、中继列表data为数组；分机响应为data.list，limit=1–500默认10、offset默认0。"
      ]
    },
    "DOC-358": {
      "id": "DOC-358",
      "name": "EnterpriseIvrRouter",
      "endpoint": null,
      "status": "dictionary",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/dataType/EnterpriseIvrRouter.html"
      ],
      "notes": [
        "呼入路由启用状态：1启用、2停用。创建文档默认1，更新文档默认2。",
        "来电号码及地区条件：传来电号码、前缀或地区区号，多项以分号分隔。",
        "呼入中继号码条件：写接口要求传trunk/list的numberTrunk，不附加areaCode；多项分号分隔。模型示例出现带区号号码，与写入说明有差异。",
        "呼入路由响应结构：list的data为包装对象数组；create/update/get的data为包装对象。enterpriseTimeList可为null；routerProperty根据routerType解释。模型列Int但示例为字符串。"
      ]
    },
    "DOC-359": {
      "id": "DOC-359",
      "name": "EnterpriseTime",
      "endpoint": null,
      "status": "dictionary",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/dataType/EnterpriseTime.html"
      ],
      "notes": [
        "呼入时间条件：传enterpriseTime/list返回的时间条件id，多项分号分隔。时间星期1代表周日、2周一至7周六。",
        "时间条件定义：type=1星期，dayOfWeek逗号分隔1周日至7周六；type=2日期，fromDay/toDay为YYYY-MM-DD；timeType=1连续/2间隔；时间HH:mm。名称与优先级在同enterpriseId内唯一，起止不能倒置；priority必填且为用户手动输入的正整数，不自动分配。"
      ]
    },
    "DOC-342": {
      "id": "DOC-342",
      "name": "座席详细信息列表获取",
      "endpoint": "agent/query",
      "status": "documented",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/座席数据管理/座席详细信息列表获取.html"
      ],
      "notes": [
        "从AliCti同步已有坐席：query分页解包data.agents[].agent；cnos原字符串最多500，start>=0、limit=1–1000。未知写入使用新id与请求窗口内createTime确认本次主记录；可带startTime/endTime。get/queryCnoAndName仅证明存在，queryAgentSkill只证明技能关系。",
        "技能和成员双重核对：同时核对多个目标技能ID集合和各组有效成员去重集合；供应商技能及agent/query(qno)成员为独立快照，cno原String比较。待提交技能不参与有效成员，成员一致不等于在线。"
      ]
    },
    "DOC-343": {
      "id": "DOC-343",
      "name": "座席详细信息获取",
      "endpoint": "agent/get",
      "status": "documented",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/座席数据管理/座席详细信息获取.html"
      ],
      "notes": [
        "从AliCti同步已有坐席：query分页解包data.agents[].agent；cnos原字符串最多500，start>=0、limit=1–1000。未知写入使用新id与请求窗口内createTime确认本次主记录；可带startTime/endTime。get/queryCnoAndName仅证明存在，queryAgentSkill只证明技能关系。",
        "坐席配置与话务状态：坐席列表话务状态采用官方state，启用状态采用active，二者独立；未知state保留待核对，不将在线当空闲。删除记录不进入当前列表。"
      ]
    },
    "API-360": {
      "id": "API-360",
      "name": "客户来电记录详情接口",
      "endpoint": "/cc/detail_cdr_ib",
      "status": "documented",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/通话记录/来电/客户来电记录详情接口.html"
      ],
      "notes": []
    },
    "API-361": {
      "id": "API-361",
      "name": "座席接听记录接口",
      "endpoint": "/cc/list_cdr_ib_agent",
      "status": "documented",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/通话记录/来电/座席接听记录接口.html"
      ],
      "notes": [
        "坐席归属与呼入分段：工号保留完整字符串；firstCallCno仅首次呼叫目标，cnoFlow是参与流转名单，均非已核定接听分段。"
      ]
    },
    "API-362": {
      "id": "API-362",
      "name": "任务呼叫记录接口",
      "endpoint": "/cc/list_cdr_auto_task",
      "status": "documented",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/通话记录/预测式外呼/任务呼叫记录接口.html"
      ],
      "notes": [
        "供应商任务ID：平台任务ID和供应商任务ID分别保存。",
        "话单查询窗口：Unix秒，开始时间区间不得超过一个月；limit为10–1000、默认10；普通分页offset+limit≤100000，scroll另行处理。",
        "接听时间：人工upTime为坐席、bridgeTime为客户；预测upTime为客户、bridgeTime为坐席；自动任务upTime为客户；呼入answerTime为系统应答、bridgeTime为人工接通。原响应示例与相邻Duration独立证明epoch秒，统一乘1000供本地日期展示，原值保留。",
        "统计与跟进结果：话单事实先校验身份/类型，已结束按官方startTime归期；未知接通不算未接，按主通话标识去重。客户接通率=已接通/(已接通+未接通)，与线索接通率分母不同。",
        "主通话与供应商身份：先核对当前账号、话单类型及已有对应字段；mainUniqueId是主通话标识，requestUniqueId是请求关联，callId/uniqueId不自动等价。",
        "通话周期与结束证据：四类话单正整数秒乘1000；有有效endTime才计周期内已结束通话，按startTime归期。endTime早于startTime无效。",
        "双方通话时长：bridgeDuration为双方通话时长；totalDuration是全程跨度，不能替代。只有已知接通且适用的有效时长进入均值，真实0保留。",
        "客户接听时长：客户接听时长采用预测或自动任务话单customerBridgeDuration，与bridgeDuration独立。",
        "自动任务话单结构：/cc/list_cdr_auto_task返回cdrAutoTask[]；status为客户接听/客户未接听，upTime为客户接听，taskId为供应商任务ID。",
        "首次与重呼分类：正整数attemptNumber=1首次，>1重呼；无序号时，同范围同名单更早通话能证明重呼，只有完整历史且无更早/同刻/缺时间冲突才证明首次。"
      ]
    },
    "API-363": {
      "id": "API-363",
      "name": "预测式外呼通话记录详情接口",
      "endpoint": "/interface/v10/cdr/predictiveCall/get",
      "status": "documented",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/通话记录/预测式外呼/预测式外呼通话记录详情接口.html"
      ],
      "notes": []
    },
    "API-364": {
      "id": "API-364",
      "name": "获取座席队列工作统计报表",
      "endpoint": "/interface/v10/agentQueueReport/agentQueueWorkload",
      "status": "documented",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/数据报表/获取座席队列工作统计报表.html"
      ],
      "notes": []
    },
    "API-365": {
      "id": "API-365",
      "name": "获取预测外呼报表数据",
      "endpoint": "/interface/v10/outboundReport/predictiveObReport",
      "status": "documented",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/数据报表/获取预测外呼报表数据.html"
      ],
      "notes": [
        "统计与跟进结果：话单事实先校验身份/类型，已结束按官方startTime归期；未知接通不算未接，按主通话标识去重。客户接通率=已接通/(已接通+未接通)，与线索接通率分母不同。",
        "任务累计报表查询：predictiveObReport按逗号分隔供应商taskId查累计，start≥0默认0，limit1–1000默认10；本接口无日期筛选。",
        "任务累计数量：taskType=1预测/2自动；totalCount累计号码、calledCount累计呼叫含重呼、answerCount客户接听、bridgeCount双方接听、retryCalledCount重呼。"
      ]
    },
    "API-366": {
      "id": "API-366",
      "name": "获取预测外呼座席报表",
      "endpoint": "/interface/v10/outboundReport/predictiveAgentObReport",
      "status": "documented",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/数据报表/获取预测外呼座席报表.html"
      ],
      "notes": [
        "官方坐席报表契约：坐席报表按官方年月日、任务、外呼组/队列筛选；cno为原字符串，stateCalling/Idle/Inuse/Pause/Wrapup为状态时长。"
      ]
    },
    "API-367": {
      "id": "API-367",
      "name": "获取预测外呼日报表",
      "endpoint": "/interface/v10/outboundReport/predictiveDailyObReport",
      "status": "documented",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/数据报表/获取预测外呼日报表.html"
      ],
      "notes": [
        "官方预测日报契约：日报采用有效年月日与timeRangeType1–4；answerMinutes为分钟，duration与runDuration为HH:mm:ss；data.totalStatistic为独立总计。"
      ]
    },
    "API-368": {
      "id": "API-368",
      "name": "队列报表",
      "endpoint": "/interface/v10/queueReport",
      "status": "documented",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/数据报表/队列报表.html"
      ],
      "notes": [
        "官方队列报表契约：queueReport的timeRangeType1–4，statisticMethod0/1/2/8，qnos为原字符串；次数与HH:mm:ss分别转换。D-049/SRC-079：telEnterCount String=队列来电接听数，telAnswerCount String=进入队列来电数。",
        "D-049 / SRC-079（user_relayed_supplier_feedback）：telEnterCount（String）为队列来电接听数，telAnswerCount（String）为进入队列来电数。保留供应商原字段名与原值，不交换计数或自行重算接听率；CF-14已关闭。本次不新增原生队列报表UI，也不改变本地话单聚合口径。"
      ]
    },
    "DOC-369": {
      "id": "DOC-369",
      "name": "fields-队列报表",
      "endpoint": "",
      "status": "dictionary",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/字段定义/报表部分/队列报表.html"
      ],
      "notes": [
        "官方队列报表契约：queueReport的timeRangeType1–4，statisticMethod0/1/2/8，qnos为原字符串；次数与HH:mm:ss分别转换。D-049/SRC-079：telEnterCount String=队列来电接听数，telAnswerCount String=进入队列来电数。"
      ]
    },
    "DOC-370": {
      "id": "DOC-370",
      "name": "fields-预测外呼座席报表",
      "endpoint": "",
      "status": "dictionary",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/字段定义/报表部分/预测外呼座席报表.html"
      ],
      "notes": [
        "官方坐席报表契约：坐席报表按官方年月日、任务、外呼组/队列筛选；cno为原字符串，stateCalling/Idle/Inuse/Pause/Wrapup为状态时长。"
      ]
    },
    "DOC-371": {
      "id": "DOC-371",
      "name": "fields-预测外呼任务报表",
      "endpoint": "",
      "status": "dictionary",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/字段定义/报表部分/预测外呼任务报表.html"
      ],
      "notes": [
        "任务累计数量：taskType=1预测/2自动；totalCount累计号码、calledCount累计呼叫含重呼、answerCount客户接听、bridgeCount双方接听、retryCalledCount重呼。"
      ]
    },
    "DOC-372": {
      "id": "DOC-372",
      "name": "fields-预测外呼日报表",
      "endpoint": "",
      "status": "dictionary",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/字段定义/报表部分/预测外呼日报表.html"
      ],
      "notes": [
        "官方预测日报契约：日报采用有效年月日与timeRangeType1–4；answerMinutes为分钟，duration与runDuration为HH:mm:ss；data.totalStatistic为独立总计。"
      ]
    },
    "DOC-373": {
      "id": "DOC-373",
      "name": "PredictiveStatisticTask",
      "endpoint": "",
      "status": "dictionary",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/dataType/PredictiveStatisticTask.html"
      ],
      "notes": [
        "统计与跟进结果：话单事实先校验身份/类型，已结束按官方startTime归期；未知接通不算未接，按主通话标识去重。客户接通率=已接通/(已接通+未接通)，与线索接通率分母不同。",
        "任务累计报表查询：predictiveObReport按逗号分隔供应商taskId查累计，start≥0默认0，limit1–1000默认10；本接口无日期筛选。",
        "任务累计数量：taskType=1预测/2自动；totalCount累计号码、calledCount累计呼叫含重呼、answerCount客户接听、bridgeCount双方接听、retryCalledCount重呼。"
      ]
    },
    "DOC-374": {
      "id": "DOC-374",
      "name": "PredictiveAgentObReport",
      "endpoint": "",
      "status": "dictionary",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/dataType/PredictiveAgentObReport.html"
      ],
      "notes": [
        "官方坐席报表契约：坐席报表按官方年月日、任务、外呼组/队列筛选；cno为原字符串，stateCalling/Idle/Inuse/Pause/Wrapup为状态时长。"
      ]
    },
    "DOC-375": {
      "id": "DOC-375",
      "name": "PredictiveDailyObReport",
      "endpoint": "",
      "status": "dictionary",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/dataType/PredictiveDailyObReport.html"
      ],
      "notes": [
        "官方预测日报契约：日报采用有效年月日与timeRangeType1–4；answerMinutes为分钟，duration与runDuration为HH:mm:ss；data.totalStatistic为独立总计。"
      ]
    },
    "DOC-376": {
      "id": "DOC-376",
      "name": "StatisticQueueHour",
      "endpoint": "",
      "status": "dictionary",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/dataType/StatisticQueueHour.html"
      ],
      "notes": [
        "官方队列报表契约：queueReport的timeRangeType1–4，statisticMethod0/1/2/8，qnos为原字符串；次数与HH:mm:ss分别转换。D-049/SRC-079：telEnterCount String=队列来电接听数，telAnswerCount String=进入队列来电数。"
      ]
    },
    "API-377": {
      "id": "API-377",
      "name": "新增队列",
      "endpoint": "/interface/v10/queue/create",
      "status": "documented",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/配置管理/队列管理/新增队列.html"
      ],
      "notes": [
        "接听队列编号：非空字符串，在同enterpriseId内唯一，保留前导零。官方只要求String，本期不自行限制数字格式或长度。已登记编号不可通过编辑改号。",
        "接听队列名称：原型name明确映射为官方description，去除首尾空白后不得为空。",
        "队列接听分配方式：官方六值：rrordered技能优先、rrmemory轮选、fewestcalls平均、random随机、linear顺序、leastrecent最长空闲时间。新增原型显式默认leastrecent是本方选择。",
        "队列优先级：值域1–10，数值越大队列优先级越高；新增原型显式值1。",
        "队列等待与接听设置：queueTimeout 20–600秒、官方默认600；memberTimeout 20–60秒、官方默认25；retry 非负整数、本地默认5，为未应答后改呼下一坐席的等待秒数；serviceLevel 非负整数、本地默认10；wrapupTime 3–3600秒、本地30；maxLen 0–999、本地0且0不限。",
        "创建队列完整必填配置：创建补齐qno/description和15项配置：musicClass=default、queueTimeout=600、sayAgentno=false、memberTimeout=25、retry=5、wrapupTime=30、maxLen=0、strategy=leastrecent、serviceLevel=10、weight=1、vipSupport=0、joinEmpty=0、announceSound=0、announcePosition=0、announcePositionFrequency=0。除两个超时官方默认，其余均显式本地选择。musicClass为非空字符串、sayAgentno为布尔、vipSupport为0/1、joinEmpty为置忙1/通话中2/振铃4/无效8/整理16的和（0–31）、announceSound为0/1、announcePosition为0/1/2。",
        "队列技能关系：queueSkills为列表，可关联本租户多个技能；新增每个新关联skillLevel本地默认1并保留已有值。queue/update省略queueSkills保留、提交则全量替换；当前纯参数编辑省略它，关联单独按create/delete差异维护。"
      ]
    },
    "API-378": {
      "id": "API-378",
      "name": "更新队列",
      "endpoint": "/interface/v10/queue/update",
      "status": "documented",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/配置管理/队列管理/更新队列.html"
      ],
      "notes": [
        "接听队列编号：非空字符串，在同enterpriseId内唯一，保留前导零。官方只要求String，本期不自行限制数字格式或长度。已登记编号不可通过编辑改号。",
        "接听队列名称：原型name明确映射为官方description，去除首尾空白后不得为空。",
        "队列接听分配方式：官方六值：rrordered技能优先、rrmemory轮选、fewestcalls平均、random随机、linear顺序、leastrecent最长空闲时间。新增原型显式默认leastrecent是本方选择。",
        "队列优先级：值域1–10，数值越大队列优先级越高；新增原型显式值1。",
        "队列等待与接听设置：queueTimeout 20–600秒、官方默认600；memberTimeout 20–60秒、官方默认25；retry 非负整数、本地默认5，为未应答后改呼下一坐席的等待秒数；serviceLevel 非负整数、本地默认10；wrapupTime 3–3600秒、本地30；maxLen 0–999、本地0且0不限。",
        "队列技能关系：queueSkills为列表，可关联本租户多个技能；新增每个新关联skillLevel本地默认1并保留已有值。queue/update省略queueSkills保留、提交则全量替换；当前纯参数编辑省略它，关联单独按create/delete差异维护。"
      ]
    },
    "API-379": {
      "id": "API-379",
      "name": "获取队列列表",
      "endpoint": "/interface/v10/queue/list",
      "status": "documented",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/配置管理/队列管理/获取队列列表.html"
      ],
      "notes": [
        "队列列表与详情：list的limit默认500、最大500，offset默认0；可按qno/name和创建时间筛选。get按String qno读取，返回data.queue及data.queueSkills。"
      ]
    },
    "API-380": {
      "id": "API-380",
      "name": "获取队列信息",
      "endpoint": "/interface/v10/queue/get",
      "status": "documented",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/配置管理/队列管理/获取队列信息.html"
      ],
      "notes": [
        "接听队列编号：非空字符串，在同enterpriseId内唯一，保留前导零。官方只要求String，本期不自行限制数字格式或长度。已登记编号不可通过编辑改号。",
        "队列列表与详情：list的limit默认500、最大500，offset默认0；可按qno/name和创建时间筛选。get按String qno读取，返回data.queue及data.queueSkills。",
        "技能和成员双重核对：同时核对多个目标技能ID集合和各组有效成员去重集合；供应商技能及agent/query(qno)成员为独立快照，cno原String比较。待提交技能不参与有效成员，成员一致不等于在线。"
      ]
    },
    "API-381": {
      "id": "API-381",
      "name": "删除队列",
      "endpoint": "/interface/v10/queue/delete",
      "status": "documented",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/配置管理/队列管理/删除队列.html"
      ],
      "notes": []
    },
    "API-382": {
      "id": "API-382",
      "name": "获取队列技能",
      "endpoint": "/interface/v10/queueSkill/list",
      "status": "documented",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/配置管理/队列管理/获取队列技能.html"
      ],
      "notes": [
        "队列技能关系：queueSkills为列表，可关联本租户多个技能；新增每个新关联skillLevel本地默认1并保留已有值。queue/update省略queueSkills保留、提交则全量替换；当前纯参数编辑省略它，关联单独按create/delete差异维护。",
        "技能和成员双重核对：同时核对多个目标技能ID集合和各组有效成员去重集合；供应商技能及agent/query(qno)成员为独立快照，cno原String比较。待提交技能不参与有效成员，成员一致不等于在线。"
      ]
    },
    "API-383": {
      "id": "API-383",
      "name": "队列新增技能",
      "endpoint": "/interface/v10/queueSkill/create",
      "status": "documented",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/配置管理/队列管理/队列新增技能.html"
      ],
      "notes": [
        "队列技能关系：queueSkills为列表，可关联本租户多个技能；新增每个新关联skillLevel本地默认1并保留已有值。queue/update省略queueSkills保留、提交则全量替换；当前纯参数编辑省略它，关联单独按create/delete差异维护。"
      ]
    },
    "API-384": {
      "id": "API-384",
      "name": "队列更新技能",
      "endpoint": "/interface/v10/queueSkill/update",
      "status": "documented",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/配置管理/队列管理/队列更新技能.html"
      ],
      "notes": [
        "队列技能关系：queueSkills为列表，可关联本租户多个技能；新增每个新关联skillLevel本地默认1并保留已有值。queue/update省略queueSkills保留、提交则全量替换；当前纯参数编辑省略它，关联单独按create/delete差异维护。"
      ]
    },
    "API-385": {
      "id": "API-385",
      "name": "队列删除技能",
      "endpoint": "/interface/v10/queueSkill/delete",
      "status": "documented",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/配置管理/队列管理/队列删除技能.html"
      ],
      "notes": [
        "队列技能关系：queueSkills为列表，可关联本租户多个技能；新增每个新关联skillLevel本地默认1并保留已有值。queue/update省略queueSkills保留、提交则全量替换；当前纯参数编辑省略它，关联单独按create/delete差异维护。"
      ]
    },
    "API-386": {
      "id": "API-386",
      "name": "新增外呼组接口",
      "endpoint": "/interface/v10/agentGroup/create",
      "status": "documented",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/配置管理/外呼组管理/新增外呼组.html"
      ],
      "notes": [
        "外呼组号：外呼组与技能是不同资源。",
        "租户外呼组及成员：gno为2–20位、字母开头、仅含字母数字且至少1位数字，groupName最多50字、comment最多100字；同enterpriseId下gno唯一。外呼组是agentGroup资源，与队列及技能分开。一个坐席仅属一个外呼组，调入时从原组移出。 同企业最多1000组；每组及每次分配最多1000个坐席。"
      ]
    },
    "API-387": {
      "id": "API-387",
      "name": "获取外呼组列表接口",
      "endpoint": "/interface/v10/agentGroup/list",
      "status": "documented",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/配置管理/外呼组管理/获取外呼组列表.html"
      ],
      "notes": [
        "外呼组号：外呼组与技能是不同资源。",
        "租户外呼组及成员：gno为2–20位、字母开头、仅含字母数字且至少1位数字，groupName最多50字、comment最多100字；同enterpriseId下gno唯一。外呼组是agentGroup资源，与队列及技能分开。一个坐席仅属一个外呼组，调入时从原组移出。 同企业最多1000组；每组及每次分配最多1000个坐席。"
      ]
    },
    "API-388": {
      "id": "API-388",
      "name": "查询外呼组接口",
      "endpoint": "/interface/v10/agentGroup/get",
      "status": "documented",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/配置管理/外呼组管理/查询外呼组.html"
      ],
      "notes": [
        "外呼组号：外呼组与技能是不同资源。",
        "租户外呼组及成员：gno为2–20位、字母开头、仅含字母数字且至少1位数字，groupName最多50字、comment最多100字；同enterpriseId下gno唯一。外呼组是agentGroup资源，与队列及技能分开。一个坐席仅属一个外呼组，调入时从原组移出。 同企业最多1000组；每组及每次分配最多1000个坐席。"
      ]
    },
    "API-389": {
      "id": "API-389",
      "name": "更新外呼组接口",
      "endpoint": "/interface/v10/agentGroup/update",
      "status": "documented",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/配置管理/外呼组管理/更新外呼组.html"
      ],
      "notes": [
        "租户外呼组及成员：gno为2–20位、字母开头、仅含字母数字且至少1位数字，groupName最多50字、comment最多100字；同enterpriseId下gno唯一。外呼组是agentGroup资源，与队列及技能分开。一个坐席仅属一个外呼组，调入时从原组移出。 同企业最多1000组；每组及每次分配最多1000个坐席。"
      ]
    },
    "API-390": {
      "id": "API-390",
      "name": "删除外呼组接口",
      "endpoint": "/interface/v10/agentGroup/delete",
      "status": "documented",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/配置管理/外呼组管理/删除外呼组.html"
      ],
      "notes": [
        "租户外呼组及成员：gno为2–20位、字母开头、仅含字母数字且至少1位数字，groupName最多50字、comment最多100字；同enterpriseId下gno唯一。外呼组是agentGroup资源，与队列及技能分开。一个坐席仅属一个外呼组，调入时从原组移出。 同企业最多1000组；每组及每次分配最多1000个坐席。"
      ]
    },
    "API-391": {
      "id": "API-391",
      "name": "外呼组分配座席接口",
      "endpoint": "/interface/v10/agentGroup/assignAgent",
      "status": "documented",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/配置管理/外呼组管理/外呼组分配座席.html"
      ],
      "notes": [
        "租户外呼组及成员：gno为2–20位、字母开头、仅含字母数字且至少1位数字，groupName最多50字、comment最多100字；同enterpriseId下gno唯一。外呼组是agentGroup资源，与队列及技能分开。一个坐席仅属一个外呼组，调入时从原组移出。 同企业最多1000组；每组及每次分配最多1000个坐席。"
      ]
    },
    "API-392": {
      "id": "API-392",
      "name": "解绑外呼组接口",
      "endpoint": "/interface/v10/agentGroup/unassignAgent",
      "status": "documented",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/配置管理/外呼组管理/解绑外呼组.html"
      ],
      "notes": [
        "租户外呼组及成员：gno为2–20位、字母开头、仅含字母数字且至少1位数字，groupName最多50字、comment最多100字；同enterpriseId下gno唯一。外呼组是agentGroup资源，与队列及技能分开。一个坐席仅属一个外呼组，调入时从原组移出。 同企业最多1000组；每组及每次分配最多1000个坐席。"
      ]
    },
    "API-393": {
      "id": "API-393",
      "name": "获取外呼组下座席组列表接口",
      "endpoint": "/interface/v10/agentGroup/listAssignedAgent",
      "status": "documented",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/配置管理/外呼组管理/获取外呼组下座席列表.html"
      ],
      "notes": [
        "租户外呼组及成员：gno为2–20位、字母开头、仅含字母数字且至少1位数字，groupName最多50字、comment最多100字；同enterpriseId下gno唯一。外呼组是agentGroup资源，与队列及技能分开。一个坐席仅属一个外呼组，调入时从原组移出。 同企业最多1000组；每组及每次分配最多1000个坐席。"
      ]
    },
    "API-394": {
      "id": "API-394",
      "name": "获取座席所在外呼组信息",
      "endpoint": "/interface/v10/agentGroup/queryAgentGroup",
      "status": "documented",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/座席数据管理/获取座席外呼组.html"
      ],
      "notes": [
        "租户外呼组及成员：gno为2–20位、字母开头、仅含字母数字且至少1位数字，groupName最多50字、comment最多100字；同enterpriseId下gno唯一。外呼组是agentGroup资源，与队列及技能分开。一个坐席仅属一个外呼组，调入时从原组移出。 同企业最多1000组；每组及每次分配最多1000个坐席。"
      ]
    },
    "DOC-395": {
      "id": "DOC-395",
      "name": "班长席监控",
      "endpoint": "CTILink.Monitor.setPause / setUnpause / setOffline",
      "status": "documented",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/工具条/班长席监控.html"
      ],
      "notes": [
        "管理置忙、置闲与下线：目标工号原字符串；setPause/setUnpause仅传monitoredCno，setOffline另传removeBinding=0保留绑定。不提供setOnline。 setOffline回调表reqType写为setPause，与方法名不一致。 先核ADMIN、本人已上线且班长权限已确认、同租户授权队列目标及新鲜状态；空闲可置忙，置忙可置闲，空闲/置忙可下线。离线只读概览和事件日志不授予管理能力。通话/振铃/整理不执行。官方setOffline回执reqType表述矛盾保留CF-11，未知刷新核对目标状态。"
      ]
    },
    "API-396": {
      "id": "API-396",
      "name": "新增分机",
      "endpoint": "/interface/v10/exten/create",
      "status": "documented",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/配置管理/分机管理/新增分机.html"
      ],
      "notes": [
        "坐席受控软电话分机：D-055在D-046上改为从分机资源目录选择，禁止手填。Agent.login.bindTel为必填String，读取本账号本租户已启用且未占用资源原exten，保留前导零；不进入agent/create或agent/update。",
        "分机资源身份与软电话类型：exten按String保留前导零，官方长度3–11位；仅数字为本地约束。资源type=2表示WebRTC，与登录bindType=3及Agent返回bindTelType=4分别转换。区号为String。",
        "分机密码：新增必须提供，更新省略表示不变。仅瞬时提交，不写演示存储、不回填、不出现在请求追踪或审计中。",
        "分机呼叫与媒体设置：active等开关0/1；callPower为String 0/1/2/3。create的isOb、denoise为String，update为Int，分别构造。allow采用alaw,ulaw或myopus,alaw,ulaw。"
      ]
    },
    "API-397": {
      "id": "API-397",
      "name": "更新分机",
      "endpoint": "/interface/v10/exten/update",
      "status": "documented",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/配置管理/分机管理/更新分机.html"
      ],
      "notes": [
        "分机资源身份与软电话类型：exten按String保留前导零，官方长度3–11位；仅数字为本地约束。资源type=2表示WebRTC，与登录bindType=3及Agent返回bindTelType=4分别转换。区号为String。",
        "分机密码：新增必须提供，更新省略表示不变。仅瞬时提交，不写演示存储、不回填、不出现在请求追踪或审计中。",
        "分机呼叫与媒体设置：active等开关0/1；callPower为String 0/1/2/3。create的isOb、denoise为String，update为Int，分别构造。allow采用alaw,ulaw或myopus,alaw,ulaw。"
      ]
    },
    "API-398": {
      "id": "API-398",
      "name": "查询分机",
      "endpoint": "/interface/v10/exten/get",
      "status": "documented",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/配置管理/分机管理/查询分机.html"
      ],
      "notes": [
        "分机资源身份与软电话类型：exten按String保留前导零，官方长度3–11位；仅数字为本地约束。资源type=2表示WebRTC，与登录bindType=3及Agent返回bindTelType=4分别转换。区号为String。",
        "分机导入与删除核实：list以data.list分页，limit≤500、offset从0；从当前账号导入已存在资源。删除采用batchDelete单元素extens String保留前导零，再以list/get核对。"
      ]
    },
    "API-399": {
      "id": "API-399",
      "name": "批量删除分机",
      "endpoint": "/interface/v10/exten/batchDelete",
      "status": "documented",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/配置管理/分机管理/批量删除分机.html"
      ],
      "notes": [
        "分机导入与删除核实：list以data.list分页，limit≤500、offset从0；从当前账号导入已存在资源。删除采用batchDelete单元素extens String保留前导零，再以list/get核对。"
      ]
    },
    "API-400": {
      "id": "API-400",
      "name": "新增时间条件设置接口",
      "endpoint": "/interface/v10/enterpriseTime/create",
      "status": "documented",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/配置管理/时间管理/新增时间条件设置接口.html"
      ],
      "notes": [
        "时间条件定义：type=1星期，dayOfWeek逗号分隔1周日至7周六；type=2日期，fromDay/toDay为YYYY-MM-DD；timeType=1连续/2间隔；时间HH:mm。名称与优先级在同enterpriseId内唯一，起止不能倒置；priority必填且为用户手动输入的正整数，不自动分配。"
      ]
    },
    "API-401": {
      "id": "API-401",
      "name": "更新时间条件设置接口",
      "endpoint": "/interface/v10/enterpriseTime/update",
      "status": "documented",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/配置管理/时间管理/更新时间条件设置接口.html"
      ],
      "notes": [
        "时间条件定义：type=1星期，dayOfWeek逗号分隔1周日至7周六；type=2日期，fromDay/toDay为YYYY-MM-DD；timeType=1连续/2间隔；时间HH:mm。名称与优先级在同enterpriseId内唯一，起止不能倒置；priority必填且为用户手动输入的正整数，不自动分配。"
      ]
    },
    "API-402": {
      "id": "API-402",
      "name": "删除时间条件设置接口",
      "endpoint": "/interface/v10/enterpriseTime/delete",
      "status": "documented",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/配置管理/时间管理/删除时间条件设置接口.html"
      ],
      "notes": [
        "时间条件定义：type=1星期，dayOfWeek逗号分隔1周日至7周六；type=2日期，fromDay/toDay为YYYY-MM-DD；timeType=1连续/2间隔；时间HH:mm。名称与优先级在同enterpriseId内唯一，起止不能倒置；priority必填且为用户手动输入的正整数，不自动分配。"
      ]
    },
    "API-403": {
      "id": "API-403",
      "name": "删除分机",
      "endpoint": "/interface/v10/exten/delete",
      "status": "documented",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/配置管理/分机管理/删除分机.html"
      ],
      "notes": [
        "exten/delete为差异对照，不用于本期删除操作；本期采用batchDelete的String extens，删除后通过list回查，保护前导零及当前引用。"
      ]
    },
    "API-404": {
      "id": "API-404",
      "name": "更新任务接口",
      "endpoint": "/interface/v10/task/update",
      "status": "documented",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/预测式外呼/更新任务接口.html"
      ],
      "notes": [
        "任务号码：单号码tel必填并保留字符串；taskTelList不超过8MB。clid是每条名单行独立的可选完整号码字段，不是任务级外显号码配置。",
        "任务级固定号码配置边界：API-311和API-404没有任务级指定号码参数；两类任务从当前enterpriseId已登记的多个外显导航中显式选择一个，提交category=5和单个customerClidsGroup；号码池与customerTimeout按接口选填。",
        "账号多外显导航与任务单选：按用户转述的AliCti技术澄清，一个enterpriseId可关联多个外显导航；导航名称和标识线下提供，由自建系统在既有账号资料中登记。同一任务只选择一个导航，创建预外呼及自动外呼时提交customerClidsCategory=5和单个String customerClidsGroup；一个导航可配合多个号码池。API-311/API-404仅证明单次任务字段，不证明供应商导航目录、有效性或选号结果。",
        "已建任务原ID编辑与回查：仅同账号租户有权、未结束、有真实或明确模拟supplier taskId且无待核对结果的任务可编辑；已建任务以原供应商taskId提交task/update，并复核enterpriseId、租户、任务类型与原任务ID。两类任务均显示名称、描述和供应商业务标签编辑入口，仅开放本期采用且API-404列明的通用字段；预测专用坐席与流转字段不进入自动外呼编辑。update未列type、callGroupType、客户名单、排重或名单clid，不能借编辑改变任务类型、接听分支、客户批次及固定外显号。API-404的ivrId/ivrName虽有自动外呼用途描述，却位于“仅type=1生效”小节，已建type=2的IVR更改本期只读，适用性待CF-17确认。",
        "自动任务语音流程名称快照：API-311创建type=2时ivrId/ivrName至少选一个，二者同传时ID优先。创建确认、任务详情和查看管理显示本任务已保存的语音流程名称，优先取本任务冻结的planSnapshot或创建设置快照；名称缺失显示未记录，不从当前共享流程目录或某次话单的实际ivrName反推。",
        "最小可用座席数及定时自动恢复：API-311/API-404：预测任务minAvailableAgentCount默认10、取1–10；任务内可用座席数低于阈值时自动暂停。autoStart=1表示定时开始，autoStartDay和autoStartTime至少配置一项。用户转述供应商业务口径：只有设置定时开始且因座席不足自动暂停的任务，人数恢复到不少于阈值时自动启动。"
      ]
    },
    "DOC-344": {
      "id": "DOC-344",
      "name": "座席实时状态获取",
      "endpoint": "agentStatus/get",
      "status": "documented",
      "sources": [
        "https://wiki.alicti.cn/html/wiki/API/座席数据管理/座席实时状态获取接口.html"
      ],
      "notes": [
        "坐席配置与话务状态：坐席列表话务状态采用官方state，启用状态采用active，二者独立；未知state保留待核对，不将在线当空闲。删除记录不进入当前列表。",
        "班长队列监控范围与内容：仅阿里侧班长可用；qnos逗号连接，fields取queueParams、agentStatuses、queueEntries，省略或空不返回对应字段。",
        "请求回执、状态及偏好隔离：按当前enterpriseId、tenantId、账号、原始String cno及请求标识核验；失败保持原值、未知保护。原型未知结果仅通过LOCAL_MOCK.inspectSeatSession读取独立本地模拟快照，不是SDK或agentStatus/get响应。正式DOC-344只定义state、stateAction、loginStatus、deviceStatus、mainUniqueId、extenReachable，不能核对bindTel、bindType、workingMode或整理截止时间；这些配置须由对应SDK回执或另行核实的可信来源确认，未查明部分继续保持未知。",
        "事件来源与最小展示字段：API-316的/user/agent为企业WebSocket事件订阅，不是历史查询；API-315 type=9仅定义座席状态变更推送设置，未给统一事件载荷、时间戳和去重键。DOC-344 agentStatus/get按enterpriseId+cno返回当前state，不返回历史；差异只能标为本地观察。CTILink breakLine/sipDisconnected及明确成功的操作回执可作为各自事件来源。"
      ]
    }
  }
};
