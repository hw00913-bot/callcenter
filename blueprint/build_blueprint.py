#!/usr/bin/env python3
"""Build the portable architecture explanation from the current interface index.

This is a logical responsibility/capability view, not a vendor deployment claim.
The frozen analysis input is read only. Runtime artifacts do not need Python.
"""
import html
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "prototype"
OUT = PUBLIC / "related-systems"
INDEX = PUBLIC / "inputs/requirement-analysis/ra-alicti--5706c147e80c7271/interfaces/interface-index.json"
ESC = lambda value: html.escape(str(value), quote=True)
STATUSES = {"platform": "平台职责", "documented": "文档有依据", "pending": "待确认"}
VIEWS = []


def view(key, name, short, subtitle, height, groups):
    item = dict(id=key, name=name, short=short, subtitle=subtitle, width=1200,
                height=height, groups=groups, nodes=[], edges=[])
    VIEWS.append(item)
    return item


def group(name, x, y, w, h, tone="platform", note=""):
    return dict(name=name, x=x, y=y, w=w, h=h, tone=tone, note=note)


def node(v, key, title, subtitle, x, y, w=300, h=108, status="platform",
         scope="本方设计", refs=(), role="", inputs=(), outputs=(), rules=(), ids=(), drill=None):
    v["nodes"].append(dict(id=v["id"] + "-" + key, key=key, title=title, subtitle=subtitle,
        x=x, y=y, w=w, h=h, status=status, scope=scope,
        refs=["API-" + str(i) for i in refs], role=role, inputs=inputs,
        outputs=outputs, rules=rules, identifiers=ids, drill=drill))


def edge(v, key, source, target, label, points, lx, ly, status="platform",
         refs=(), detail="", rules=(), bidirectional=False):
    v["edges"].append(dict(id=v["id"] + "-edge-" + key, source=v["id"] + "-" + source,
        target=v["id"] + "-" + target, label=label, points=points, lx=lx, ly=ly,
        status=status, refs=["API-" + str(i) for i in refs], detail=detail,
        rules=rules, bidirectional=bidirectional))


o = view("overview", "系统架构总览", "系统总览", "从业务来源到呼叫执行，查看系统边界与数据流向。", 1040, [
    group("业务来源与使用方", 30, 25, 1130, 190, "neutral", "来源系统名称未确认；现阶段以文件导入衔接"),
    group("统一外呼中台", 30, 270, 1130, 220),
    group("接口适配层", 30, 540, 720, 220),
    group("通信使用端", 790, 540, 370, 220, "neutral"),
    group("AliCti 系统", 30, 795, 1130, 222, "documented")])
node(o, "users", "总部 / 门店使用人员", "平台账号登录，进入已授权租户", 60, 88, 260, 100,
     refs=(326,), scope="使用方", role="总部、门店管理人员及坐席通过浏览器进入中台。组织身份与可操作范围由本方规则约束。",
     outputs=("登录身份与当前租户上下文",), rules=("总部普通成员不会自动获得全部门店数据范围。", "关联坐席不会自动提升平台角色权限。"))
node(o, "sources", "线索 / 售后 / 活动来源", "文件导入；保留业务编码", 455, 88, 300, 100,
     refs=(326,), scope="业务来源", role="用业务来源归类表示上游数据，不指定尚未确认的 CRM、DMS 或其他系统产品。",
     outputs=("客户号码、业务来源、业务编码、导入批次",), rules=("当前关系为文件导入；未定义自动查询、工单创建或结果回写接口。",))
node(o, "ai-provider", "既有 AI 能力链路", "沿用原有供应商与通道关系", 850, 88, 280, 100,
     refs=(326,), scope="既有边界", role="保留当前 AI 域的独立能力链路。该链路未被 AliCti 文档替代。",
     rules=("本蓝图不补造 AI 供应商名称、接口路径或 AliCti 转接关系。",))
node(o, "shared", "统一身份与租户权限", "登录 · 角色 · 授权 · 资源映射", 60, 343, 260,
     refs=(326,), role="平台统一管理人员、租户、角色、功能与数据范围，维护供应商账号和坐席映射。",
     outputs=("已核验的用户、租户、供应商账号及坐席上下文",), ids=("平台账号", "租户 ID", "enterpriseId", "cno"),
     rules=("enterpriseId 为供应商账号 ID；UUID 不参与接口。", "同一供应商账号可关联多个平台租户，租户隔离由平台实现。"), drill="platform")
node(o, "business", "云外呼业务域", "客户 · 任务 · 工作台 · 记录 · 报表", 455, 343,
     refs=(305, 311, 312, 317, 318, 319, 326), role="编排客户导入、分配、外呼任务、坐席操作、通话记录和统计。",
     inputs=("当前租户权限与客户批次",), outputs=("呼叫意图、任务操作、业务记录、统计视图",),
     rules=("业务状态、供应商任务状态、实时会话状态和号码识别结果分别保留。",), drill="platform")
node(o, "ai", "既有 AI 业务域", "任务 · 场景 · 通道 · 记录 · 计费", 850, 343, 280,
     refs=(326,), role="沿用既有 AI 域页面和能力边界，使用中台统一身份和域授权。",
     rules=("AI 呼叫能力仍通过既有链路提供，不自动归入 AliCti。",), drill="platform")
node(o, "browser", "浏览器通话桥接", "CTILink / WebRTC", 60, 620, 280,
     refs=(302, 303, 304, 305, 306), role="在坐席浏览器初始化工具条、取得短期登录材料、控制会话并感知媒体状态。",
     inputs=("平台核验后签发的短期登录材料", "用户明确发起的电话操作"), outputs=("工具条事件、媒体就绪状态",),
     rules=("浏览器直接连接供应商电话服务；语音媒体不经过本方业务 API 适配器。", "登录成功不等于媒体已就绪。"), drill="adapter")
node(o, "backend", "后台接口适配", "签名 · 命令 · 回推 · 话单 · 媒体", 400, 620, 320,
     refs=(301, 307, 311, 315, 316, 317, 318, 320, 321), role="在服务端统一完成权限核验、接口鉴权、命令转换、结果归集与业务数据映射。",
     inputs=("平台业务指令", "AliCti 回执、事件、话单及媒体结果"), outputs=("可追溯业务结果及待核对项",),
     rules=("长期部门 token 仅保留服务端。", "接口有文档不等于边界已联调验证。"), drill="adapter")
node(o, "phone", "客户电话 / 通信线路", "号码承载与实际接续", 850, 620, 260,
     status="pending", scope="接续边界", refs=(310, 324), role="描述客户电话与通信线路的业务接续关系。",
     rules=("企业号码列表仅可证明查询能力；开通、停用及路由配置契约待确认。", "不据此绘制供应商运营商网关或内部媒体部署。"))
node(o, "cti", "AliCti 电话能力", "坐席登录 · 会话控制 · 软电话", 60, 865, 300,
     status="documented", scope="公开能力", refs=(302, 303, 304, 305, 306), role="公开工具条与软电话能力的逻辑集合。",
     rules=("版本、跨设备互斥、重连和媒体连通仍需要真实账号验证。",), drill="alicti")
node(o, "api", "AliCti API 与结果能力", "资源 · 任务 · IVR · 事件 · 话单", 450, 865, 330,
     status="documented", scope="公开能力", refs=tuple(range(307, 324)), role="公开服务端接口及事件、话单、录音和 ASR 能力的逻辑集合。",
     rules=("本视图不表示供应商内部微服务调用顺序。", "task/start、task/get 已有文档；真实资源、恢复前提与号码生命周期仍待确认。"), drill="alicti")
edge(o, "login", "users", "shared", "登录 / 选择租户", [(190, 188), (190, 343)], 190, 244, refs=(326,), detail="由平台识别人员身份、角色和租户访问范围。")
edge(o, "import", "sources", "business", "文件导入客户批次", [(605, 188), (605, 343)], 605, 244, refs=(326,), detail="按业务来源与编码保存批次及客户，不假设上游自动回写接口。")
edge(o, "authorize", "shared", "business", "上下文授权", [(320, 397), (455, 397)], 387, 382, refs=(326,), detail="功能权限、数据范围与供应商资源映射共同约束业务操作。")
edge(o, "ai-auth", "shared", "ai", "统一身份 / AI 域授权", [(190, 451), (190, 515), (990, 515), (990, 451)], 850, 515, refs=(326,), detail="共享平台身份；云外呼与 AI 保留各自业务能力边界。")
edge(o, "ai-route", "ai", "ai-provider", "既有独立链路", [(990, 343), (990, 188)], 990, 244, refs=(326,), detail="AI 域继续使用原有能力通道。", bidirectional=True)
edge(o, "ui-phone", "business", "browser", "坐席会话操作", [(530, 451), (530, 572), (200, 572), (200, 620)], 372, 572, refs=(303, 305, 306), detail="工作台通过浏览器桥接层触发工具条操作，并独立处理媒体准备状态。")
edge(o, "ui-api", "business", "backend", "任务 / 资源 / 结果", [(660, 451), (660, 620)], 660, 572, refs=(307, 311, 315, 317), detail="业务意图进入后台适配器，核验权限后调用对应接口。", bidirectional=True)
edge(o, "sdk", "browser", "cti", "工具条信令 / 软电话媒体", [(200, 728), (200, 865)], 200, 783, "documented", (302, 303, 304, 305, 306), "浏览器与 AliCti 电话能力建立连接；不能将平台登录成功视作媒体连通。", bidirectional=True)
edge(o, "server", "backend", "api", "命令请求 ⇄ 事件 / 话单 / 媒体", [(575, 728), (575, 865)], 575, 783, "documented", tuple(range(307, 324)), "后台按接口分别适配命令请求、异步回推与结果查询，不把这些结果合并为单一完成信号。", bidirectional=True)
edge(o, "line", "cti", "phone", "线路承载 / 号码路由待确认", [(360, 919), (410, 919), (410, 990), (1130, 990), (1130, 674), (1110, 674)], 920, 990, "pending", (310, 324), "企业号码可以查询，但实际号码开通、共享号码路由及绑定能力的完整契约待确认。", bidirectional=True)

p = view("platform", "平台系统与模块", "平台模块", "按本方职责组织模块，身份、业务、结果和 AI 域各有边界。", 1060, [
    group("共享平台 · 身份、租户与资源上下文", 30, 25, 1130, 210),
    group("云外呼业务 · 客户到呼叫执行", 30, 290, 1130, 210),
    group("云外呼结果与资源管理", 30, 555, 1130, 210),
    group("平台支撑与既有业务域", 30, 820, 1130, 210)])
node(p, "identity", "平台账号与租户", "总部 / 门店成员 · 租户切换", 60, 100, refs=(326,), role="管理平台账号和当前租户，形成业务访问的起点。", outputs=("人员、组织与当前租户上下文",), rules=("平台账号不是 enterpriseId；租户也不是供应商实例。",))
node(p, "permissions", "角色与数据权限", "菜单 · 操作 · 数据范围", 445, 100, refs=(326,), role="统一核验功能权限和数据范围，限制客户、任务、记录与资源访问。", inputs=("平台身份与租户",), outputs=("已授权操作范围",), rules=("同一供应商账号下仍需逐租户隔离。", "后台须再次校验；隐藏菜单不构成权限边界。"))
node(p, "context", "供应商账号与坐席映射", "enterpriseId + cno + 平台授权", 830, 100, refs=(301, 302, 326), role="维护平台租户、供应商账号、人员和坐席之间的明确映射。", ids=("平台账号", "租户 ID", "enterpriseId", "cno"), rules=("enterpriseId 是供应商账号 ID。UUID 不参与接口。", "cno 保留数字字符串与前导零；账号和坐席分开管理。"))
node(p, "customers", "客户与导入批次", "业务来源 · 编码 · 分配 · 归档", 60, 365, refs=(312, 326), role="导入线索、售后、活动客户，建立批次、业务编码与跟进归属。", outputs=("任务号码及本方客户关联关系",), rules=("供应商 task 去重不等于平台客户或业务批次去重。", "导入文件是当前上游衔接方式。"))
node(p, "tasks", "任务编排与运行管理", "预测外呼 / 自动 IVR", 445, 365, refs=(311, 312, 313, 314, 325), role="管理任务配置、号码导入、暂停和结束意图，保留业务状态及供应商结果。", inputs=("客户批次、已授权坐席 / 技能和号码",), outputs=("taskId 映射、任务指令及待核对结果",), rules=("启动使用 task/start，查询使用 task/get；实际 taskId 和恢复前提仍待确认。", "创建、导入不自动启动；启动前核验实际资源和坐席范围。"))
node(p, "workbench", "坐席工作台与呼入服务", "登录 · 人工外呼 · 接续 · 小结", 830, 365, refs=(302, 303, 304, 305, 306, 319), role="向坐席提供登录、电话操作、服务信息和通话后业务记录。", inputs=("授权坐席与客户 / 任务上下文",), outputs=("电话操作及本方业务小结",), rules=("当前用户对 cno 的使用权限先经平台核验。", "呼入租户归属依赖可验证路由链，不能凭企业账号推断。"))
node(p, "reports", "统计与运营视图", "通话 · 跟进 · 任务 · 坐席 · 呼入 · 技能", 60, 630, refs=(317, 318, 319, 326), role="在已授权数据范围内汇总六类运营视图。", inputs=("分类规范化的话单与本方业务记录",), rules=("客户接听、坐席接通与号码识别结果使用各自证据，不能混算。", "IVR 应答不等同人工坐席接听。"))
node(p, "records", "通话记录与媒体", "人工 / 预测 / 呼入 · 录音 · ASR", 445, 630, refs=(317, 318, 319, 320, 321, 327), role="按话单类别保存原始数据及展示映射，独立跟踪录音和 ASR 可用性。", outputs=("通话详情、号码状态、媒体查看入口",), rules=("号码状态直接复用官方字典；715、183 不唯一时待确认。", "话单已到不代表录音或 ASR 同时就绪。"))
node(p, "resources", "坐席 / 技能 / 号码配置", "资源台账 · 账号授权 · 操作核对", 830, 630, refs=(307, 308, 309, 310, 322, 324), role="维护本方资源台账并适配已有供应商配置接口。", inputs=("enterpriseId 资源上下文及操作权限",), rules=("技能绑定接口按全量替换处理。", "agent/delete、skill/create 已有文档；号码开通、共享路由发布及实际资源仍待确认。"))
node(p, "gateway", "接口适配入口", "浏览器桥接 + 后台适配", 60, 895, refs=(301, 302, 315, 316, 317, 326), role="为业务模块提供统一的供应商访问与结果归集边界。", rules=("此处为逻辑设计，原型没有调用供应商真实接口。",), drill="adapter")
node(p, "audit", "异常核对与操作留痕", "请求 · 原始事件 · 业务关联", 445, 895, refs=(315, 316, 325, 326), role="记录操作者、租户、原始请求和结果，集中呈现失败、不确定与待核对事项。", rules=("本方去重不等价于供应商幂等保证。", "使用 task/get 核对任务状态；查询结果和原操作无法关联时保留待确认。"))
node(p, "ai", "既有 AI 业务域", "任务 / 通道 / 场景 / 标签 / 计费", 830, 895, refs=(326,), role="沿用现有 AI 模块及独立供应商链路，共享平台账号与域授权。", rules=("本次 AliCti 适配不改变 AI 呼叫通道。",))
edge(p, "role", "identity", "permissions", "身份与租户", [(360, 154), (445, 154)], 403, 140, refs=(326,), detail="先确定登录身份和租户，再判定功能与数据权限。")
edge(p, "resource-scope", "permissions", "context", "授权资源范围", [(745, 154), (830, 154)], 788, 140, refs=(326,), detail="供应商账号及坐席必须处于用户当前可用的资源范围内。")
edge(p, "business-guard", "permissions", "tasks", "统一约束业务操作", [(595, 208), (595, 365)], 595, 267, refs=(326,), detail="该连线代表对云外呼业务层的共同约束，客户、任务和坐席操作均受权限检查。")
edge(p, "mapping", "context", "resources", "资源映射 / 使用范围", [(1115, 208), (1145, 208), (1145, 607), (1115, 607), (1115, 630)], 1020, 535, refs=(307, 309, 310, 326), detail="本方记录资源所属账号及租户可用范围；不能从同一 enterpriseId 推定跨租户可见。")
edge(p, "batch", "customers", "tasks", "客户与号码批次", [(360, 419), (445, 419)], 403, 405, refs=(312, 326), detail="保留平台业务编码与批次映射，按供应商任务约束导入号码。")
edge(p, "dispatch", "tasks", "workbench", "任务关联 / 坐席执行", [(745, 419), (830, 419)], 788, 405, refs=(305, 311), detail="按人工、预测与自动 IVR 各自流程执行；自动 IVR 不等同人工坐席操作。")
edge(p, "result", "tasks", "records", "按任务关联话单", [(595, 473), (595, 630)], 595, 535, refs=(318,), detail="根据当前文档字段关联任务与预测话单，原始状态独立保存。")
edge(p, "manual-record", "workbench", "records", "人工 / 呼入结果", [(980, 473), (980, 570), (705, 570), (705, 630)], 820, 570, refs=(317, 319), detail="人工外呼与呼入按各自话单字段解释，不能与预测话单套用同一状态表。")
edge(p, "metrics", "records", "reports", "分类汇总口径", [(445, 684), (360, 684)], 403, 670, refs=(317, 318, 319, 326), detail="按客户接通、坐席接通、通话时长及业务跟进等明确维度统计。")
edge(p, "adapter-business", "gateway", "records", "规范化话单 / 媒体", [(315, 895), (315, 795), (505, 795), (505, 738)], 355, 795, refs=(317, 318, 319, 320, 321), detail="适配层将不同来源结果规范化并保留原始数据，业务层按租户范围展示。")
edge(p, "adapter-audit", "gateway", "audit", "请求与结果留痕", [(360, 949), (445, 949)], 403, 934, refs=(326,), detail="将请求、回执和异步结果关联到平台操作记录。")
edge(p, "record-audit", "records", "audit", "异常 / 待核对", [(595, 738), (595, 895)], 595, 802, refs=(315, 316, 325), detail="未收齐结果、无法判定或状态契约缺失时保留待核对项。")

edge(p, "ai-auth", "permissions", "ai", "统一身份 / AI 域授权", [(710, 208), (710, 258), (1180, 258), (1180, 949), (1130, 949)], 1000, 258, refs=(326,), detail="既有 AI 业务域使用平台统一账号和域授权，通过独立供应商链路提供能力。")

a = view("adapter", "接口适配层模块关系", "接口适配层", "浏览器桥接与后台适配分开；命令、事件、话单、媒体按各自节奏处理。", 1170, [
    group("浏览器内", 30, 25, 335, 222, "neutral"),
    group("服务端 · 访问控制与鉴权", 395, 25, 765, 222),
    group("服务端 · 供应商命令适配", 30, 310, 1130, 210),
    group("服务端 · 结果接入与查询", 30, 580, 1130, 210),
    group("服务端 · 关联、映射与可用性", 30, 850, 1130, 220)])
node(a, "sdk", "CTILink / WebRTC 桥接", "登录事件 · 会话操作 · 媒体状态", 50, 110, 295, refs=(302, 303, 304, 305, 306), scope="浏览器设计", role="封装工具条初始化、事件监听、短期登录、人工外呼和软电话操作。", inputs=("短期 sessionKey 与 agentGateWayUrl",), outputs=("会话事件与媒体准备状态",), rules=("先初始化并注册事件，再取得短期材料登录。", "长期 token 不进入浏览器；媒体连接不经后台业务接口中转。"))
node(a, "guard", "身份与资源校验", "用户 → 租户 → 账号 → 坐席", 420, 110, 300, refs=(302, 326), role="核验当前操作主体、租户、业务权限与可用资源映射。", outputs=("最小必要的供应商账号、坐席及操作上下文",), ids=("平台用户", "租户 ID", "enterpriseId", "cno"), rules=("同账号下多个租户的事件、话单仍需平台过滤。",))
node(a, "auth", "服务端签名与短效鉴权", "部门 token 保管 · sessionKey", 810, 110, 320, refs=(301, 302), role="保管长期部门 token，生成对应签名并申请坐席短期登录材料。", outputs=("接口签名", "有效期 30 秒的 sessionKey"), rules=("MD5 签名为 enterpriseId + 秒级时间戳 + 部门 token，32 位小写；时间戳有效 30 分钟。", "/cc 系列鉴权按各自文档单独核对。"))
node(a, "resources", "资源命令适配", "坐席增改 · 技能替换 · 号码查询", 60, 385, refs=(307, 308, 309, 310, 324), role="将资源操作分别映射到 agent/create、agent/update、技能列表替换和企业号码查询。", rules=("技能列表为全量替换，skillIds=0 表示清空。", "agent/delete、skill/create、skill/update、skill/list 已提供；号码开通与真实资源标识待确认。"))
node(a, "tasks", "任务命令适配", "创建 / 启停 / 查询 / 名单导入", 445, 385, refs=(311, 312, 313, 314, 325), role="按任务类型处理创建、号码导入、暂停及结束，并记录指令与回执。", ids=("平台任务 ID", "taskId", "导入批次"), rules=("autoStart按手工/预约配置生成0/1；importTelAutoStart显式0。", "请求受理后使用 task/get 核对；task/start 已提供，恢复条件与实际执行结果仍待确认。"))
node(a, "ivr", "IVR 定义与执行查询适配", "导入定义 · 查询已执行节点", 830, 385, refs=(322, 323, 324), role="区分 IVR 定义导入与单次通话已执行节点查询。", rules=("导入成功不等于已发布、已路由或已绑定号码。", "共享号码分支、发布、绑定及目录查询契约待确认。"))
node(a, "events", "HTTP / 企业 WS 接入", "回推订阅 · 原始事件接收", 60, 655, refs=(315, 316), role="按事件类型接收任务、话单、录音、ASR 等结果，记录来源、时间及原始载荷。", outputs=("待校验的原始事件",), rules=("企业 WS 默认可能包含全部坐席，须按平台映射分发。", "企业 WS 最大 10 路；重放和可靠性保证待确认。"))
node(a, "cdr", "分类话单规范化", "人工 / 预测 / 呼入独立映射", 445, 655, refs=(317, 318, 319, 327), role="分别解释三类话单的接通时间、客户和坐席状态，并保留原始数据。", outputs=("分类话单、原始字段、号码识别输入",), rules=("人工 upTime 对应坐席，预测 upTime 对应客户，不能共用解释。", "号码状态不能代替客户或坐席接通证据。"))
node(a, "media", "录音 / ASR 结果适配", "链接有效期 · 转写完成状态", 830, 655, refs=(320, 321), role="独立获取录音地址与 ASR 结果，处理不可用、转写中及链接过期。", outputs=("短期录音访问地址", "ASR 可用性及原始文本结果"), rules=("录音地址默认 120 分钟有效，不能作为永久存储地址。", "ASR result=-2 表示转写中；文本独立阅读搜索，取消与录音进度联动。"))
node(a, "reconcile", "事件关联与结果核对", "去重 · 乱序留存 · 租户过滤", 60, 925, refs=(315, 316, 317, 318, 325, 326), role="设计本方事件去重、关联、乱序处理和核对机制，按权限归属到业务对象。", ids=("enterpriseId", "cno", "taskId", "callId / uniqueId（按接口）"), rules=("本方去重不代表供应商承诺幂等。", "任务状态按 task/get 返回的 TaskProperty 解释；事件重复、乱序和操作关联仍需核验。"))
node(a, "dictionary", "号码识别字典复用", "官方编码 + 原始描述", 445, 925, refs=(317, 318, 327), role="直接复用号码状态识别编码，区分人工 SIP 字段与预测识别字段。", outputs=("官方号码状态或保留原值的待确认提示",), rules=("715 与 183 各有三条描述，不能自选唯一含义。", "人工仅有 SIP 183 时待确认；719 不证明本次呼叫已接通。", "API-327 是字段说明索引，不是可调用接口。"))
node(a, "availability", "能力与结果可用性", "可展示结果 / 待确认 / 待核对", 830, 925, refs=(320, 321, 324, 325, 326), role="将明确结果提供给业务，将缺失契约、未就绪媒体及不确定结果保留为可见待处理项。", outputs=("页面可用性提示、异常记录及核对入口",), rules=("已有端点与资源、字段、结果待确认分别记录，不生成未核实的成功结果。", "页面展示模拟通过不代表真实联调通过。"))
edge(a, "check", "guard", "auth", "核验后的调用上下文", [(720, 164), (810, 164)], 765, 150, refs=(301, 302, 326), detail="平台校验通过后才生成签名或取得坐席登录材料。")
edge(a, "short-key", "auth", "sdk", "短期登录材料 → 浏览器（长期 token 留在服务端）", [(970, 218), (970, 277), (198, 277), (198, 218)], 550, 277, refs=(302,), detail="服务端申请 sessionKey 后交给已授权浏览器使用，其有效期仅 30 秒。")
edge(a, "signed-resources", "auth", "resources", "签名后的资源调用", [(880, 218), (880, 298), (375, 298), (375, 362), (210, 362), (210, 385)], 210, 368, refs=(301, 307, 308, 309, 310), detail="资源类调用分别适配；对 /cc 路径不能盲目沿用同一签名假设。")
edge(a, "signed-tasks", "auth", "tasks", "签名后的任务调用", [(930, 218), (930, 323), (595, 323), (595, 385)], 595, 368, refs=(301, 311, 312, 313, 314), detail="统一鉴权职责不改变各任务接口的受理、完成和状态查证边界。")
edge(a, "signed-ivr", "auth", "ivr", "签名后的 IVR 调用", [(1050, 218), (1050, 385)], 1050, 368, refs=(301, 322, 323), detail="仅覆盖定义导入及执行节点查询的已知接口。")
edge(a, "task-cdr", "tasks", "cdr", "任务与话单关联", [(595, 493), (595, 655)], 595, 549, refs=(318,), detail="本方保存 taskId 与业务任务映射，按预测话单字段关联执行结果。")
edge(a, "pending-command", "tasks", "availability", "实际资源 / 恢复条件待确认", [(745, 458), (787, 458), (787, 888), (980, 888), (980, 925)], 935, 825, "pending", (325,), "task/start 与 task/get 已提供；没有真实 taskId 或执行证据时保留待确认。")
edge(a, "ingest", "events", "reconcile", "原始事件与账号上下文", [(210, 763), (210, 822), (42, 822), (42, 900), (210, 900), (210, 925)], 210, 822, refs=(315, 316, 326), detail="接收不等于业务完成：先识别来源、对象与租户，再处理重复和乱序。")
edge(a, "reconcile-cdr", "reconcile", "cdr", "按呼叫标识核对", [(360, 979), (395, 979), (395, 709), (445, 709)], 397, 909, refs=(317, 318, 319), detail="通话结果按分类话单核对；任务状态另用 task/get，不混用两类状态。")
edge(a, "number-code", "cdr", "dictionary", "分类后的原始字段", [(595, 763), (595, 925)], 595, 822, refs=(317, 318, 327), detail="人工与预测使用不同响应字段，字典只解释识别值，不改写接通统计。")
edge(a, "cdr-media", "cdr", "media", "按通话标识查询", [(745, 709), (830, 709)], 788, 695, refs=(320, 321), detail="按各接口要求的通话标识获取媒体，话单与媒体可分别到达。")
edge(a, "media-ready", "media", "availability", "媒体就绪 / 转写中", [(1080, 763), (1080, 925)], 1080, 875, refs=(320, 321), detail="链接有效性、录音就绪与 ASR 转写结果独立反馈给页面。")
edge(a, "number-display", "dictionary", "availability", "已识别或待确认", [(745, 979), (830, 979)], 788, 965, refs=(327,), detail="无法唯一确认编码描述时保留原值和候选项，不生成自定义号码状态。")

t = view("alicti", "AliCti 系统与能力模块", "AliCti 模块", "按公开接口组织能力；连线表示对象引用与结果关联，不代表供应商内部服务调用。", 1150, [
    group("账号与鉴权边界", 30, 25, 1130, 220, "documented"),
    group("配置资源能力", 30, 310, 1130, 220, "documented"),
    group("呼叫执行能力", 30, 580, 1130, 220, "documented"),
    group("事件与结果能力", 30, 850, 1130, 220, "documented")])
node(t, "sign", "服务端接口鉴权", "enterpriseId + timestamp + sign", 60, 110, status="documented", scope="公开能力", refs=(301,), role="为服务端接口调用提供文档规定的鉴权入口。", rules=("部门 token 不进入浏览器。", "/cc 系列按各自接口核对鉴权。"))
node(t, "account", "供应商账号上下文", "enterpriseId = 账号 ID", 445, 110, status="documented", scope="接口对象", refs=(301, 302, 307, 310, 316), role="代表 AliCti 供应商账号范围，用于登录、资源访问与企业事件接入。", ids=("enterpriseId",), rules=("UUID 不参与接口。", "企业账号上下文不是平台租户隔离保证。"))
node(t, "login", "坐席前端登录鉴权", "cno → sessionKey / 网关地址", 830, 110, status="documented", scope="公开能力", refs=(302,), role="提供坐席前端使用的短期登录材料。", ids=("enterpriseId", "cno", "sessionKey"), rules=("sessionKey 有效 30 秒；平台在申请前检查人员与坐席关系。",))
node(t, "seat", "坐席资源", "agent/create · agent/update", 60, 395, status="documented", scope="公开能力", refs=(307, 308, 324), role="创建和更新坐席资料、开关及相关配置。", ids=("cno", "areaCode"), rules=("cno 为 3–10 位数字字符串，保留前导零。", "agent/delete 已有文档；批量导入、失败查证及在线更新的实际影响待确认。"))
node(t, "skill", "坐席技能绑定", "batchUpdateAgentSkill", 445, 395, status="documented", scope="公开能力", refs=(309, 324), role="创建、更新和查询技能；按坐席全量替换多个技能。平台团队另转换为任务 cnos。", ids=("cno", "skillIds", "skillLevels"), rules=("skillIds=0 清空；skillLevels 数值较小优先级高。", "技能增改查已有文档；本地等级1–999，failCno按String解析并逐席检查。"))
node(t, "number", "企业号码查询", "enterpriseHotline/listPage", 830, 395, status="documented", scope="公开能力", refs=(310, 324), role="按企业账号查询现有号码列表。", rules=("每页最多 1000 条。", "查询接口不能证明开通、停用、共享号码路由或绑定能力。"))
node(t, "phone", "工具条与软电话", "CTILink · 会话控制 · WebRTC", 60, 665, status="documented", scope="公开能力", refs=(303, 304, 305, 306), role="提供坐席上线、状态操作、人工预览外呼和软电话会话能力。", rules=("请求接受不等于客户接听，登录成功不等于媒体准备完成。", "操作幂等、跨设备互斥和重连仍需验证。"))
node(t, "task", "预测 / 自动 IVR 任务", "创建 / 启停 / 查询 / 名单导入", 445, 665, status="documented", scope="公开能力", refs=(311, 312, 313, 314, 325), role="按 type=1 预测外呼、type=2 自动 IVR 分别管理任务及号码。", ids=("taskId", "type", "callGroupType / cnos / agentGroup"), rules=("手工/定时参数按文档转换；原型仅模拟，不实际定时拨号。", "task/start、task/get 已提供；状态为 0 初始、1 运行中、2 暂停、3 结束，恢复前提仍待确认。"))
node(t, "ivr", "IVR 定义与流程结果", "ivrProfile/import · ivrFlow/query", 830, 665, status="documented", scope="公开能力", refs=(322, 323, 324), role="归类 IVR 定义导入和某次通话已执行节点查询两项能力。", rules=("查询已执行节点不等于查询已发布 IVR 目录。", "定义导入与发布、号码路由、任务绑定分开确认。"))
node(t, "events", "HTTP / 企业 WS 事件", "任务 · 坐席 · 话单 · 媒体通知", 60, 935, status="documented", scope="公开能力", refs=(315, 316), role="通过配置 HTTP 回推或企业 WebSocket 提供各类异步事件。", rules=("企业 WS /user/agent 默认可能包含全部坐席，平台必须过滤。", "重复、乱序、重放及重试层级不能假设已被完整保证。"))
node(t, "cdr", "分类通话记录", "人工外呼 / 预测外呼 / 呼入", 445, 935, status="documented", scope="公开能力", refs=(317, 318, 319, 327), role="三类话单分别提供通话、接通与号码识别相关字段。", rules=("人工与预测 status 枚举及 upTime / bridgeTime 含义不同。", "号码识别按 API-327 字段文档复用；不是新建状态接口。"))
node(t, "media", "录音与 ASR", "record/getUrl · asr/get", 830, 935, status="documented", scope="公开能力", refs=(320, 321), role="按通话标识提供录音访问地址和 ASR 文本结果。", rules=("媒体与话单分别就绪；ASR -2 为转写中。", "录音分轨需开通且仅 wav；ASR 说话方映射待确认，文本定位录音已取消。"))
edge(t, "account-sign", "account", "sign", "使用账号签名", [(445, 164), (360, 164)], 403, 150, "documented", (301,), "enterpriseId 参与服务端签名，不将 UUID 作为接口凭证。")
edge(t, "account-login", "account", "login", "账号 + 坐席", [(745, 164), (830, 164)], 788, 150, "documented", (302,), "前端登录鉴权请求包含 enterpriseId 与 cno。")
edge(t, "account-resources", "account", "seat", "账号范围内的坐席对象", [(530, 218), (530, 278), (210, 278), (210, 395)], 330, 278, "documented", (307, 308), "该线描述接口访问和对象归属，不声称供应商有独立账号数据库或内部调用。")
edge(t, "account-number", "account", "number", "账号范围内的号码查询", [(675, 218), (675, 278), (980, 278), (980, 395)], 850, 278, "documented", (310,), "使用企业账号上下文查询号码，不表示可控制号码生命周期。")
edge(t, "seat-skills", "seat", "skill", "cno 技能绑定", [(360, 449), (445, 449)], 403, 435, "documented", (309,), "技能接口按坐席更新完整技能列表，不是增量追加。")
edge(t, "seat-phone", "seat", "phone", "cno 登录 / 操作", [(210, 503), (210, 665)], 210, 555, "documented", (302, 303, 304, 305), "平台确认人员与 cno 的使用关系后，浏览器取得短期材料并登录。")
edge(t, "skill-task", "skill", "task", "团队转换为坐席工号", [(595, 503), (595, 665)], 595, 555, "documented", (309, 311), "原型选择技能团队后取同租户有效坐席 cno，callGroupType=1 传 cnos；agentGroup 是外呼组，不能用技能组 ID 代替。")
edge(t, "number-routing", "number", "ivr", "号码 → IVR 路由待确认", [(980, 503), (980, 665)], 980, 555, "pending", (310, 322, 324), "号码查询和 IVR 导入不能证明共享号码路由、发布或绑定已具备。")
edge(t, "task-ivr", "task", "ivr", "ivrId / ivrName 绑定", [(745, 719), (830, 719)], 788, 705, "pending", (311, 322, 324), "自动外呼需 ivrId 或 ivrName，ID 优先；原型以独立模拟ID演示；真实发布与号码绑定另列待确认。")
edge(t, "phone-events", "phone", "events", "坐席 / 会话事件", [(210, 773), (210, 935)], 210, 825, "documented", (303, 304, 315, 316), "工具条事件与企业事件各自接入；不将其中一个回调作为全部业务结果。")
edge(t, "task-cdr", "task", "cdr", "任务对应的预测话单", [(595, 773), (595, 935)], 595, 825, "documented", (318,), "按话单字段关联任务与呼叫轮次；结束与重试标记分别解释。")
edge(t, "ivr-record", "ivr", "cdr", "按通话查执行节点", [(920, 773), (920, 885), (700, 885), (700, 935)], 822, 885, "documented", (323,), "ivrFlow/query 查询某次通话已执行节点，不能视为供应商内部 IVR 到话单服务调用。")
edge(t, "event-cdr", "events", "cdr", "本方按标识核对", [(360, 989), (445, 989)], 403, 975, "platform", (315, 316, 317, 318, 319), "这是本方利用事件和话单进行结果关联的设计关系，不代表 AliCti 内部消息拓扑。")
edge(t, "cdr-media", "cdr", "media", "按通话标识获取", [(745, 989), (830, 989)], 788, 975, "documented", (320, 321), "录音和 ASR 按各自接口要求的通话标识查询，可用时间独立。")


def api_data():
    records = json.loads(INDEX.read_text())["interfaces"]
    apis = {}
    for record in records:
        refs = [r for r in record.get("source_refs", []) if r.startswith("https://wiki.alicti.cn/")]
        apis[record["id"]] = dict(id=record["id"], name=record["name"], endpoint=record.get("endpoint"),
            status=record["verification_status"], sources=refs, notes=record.get("notes", []))
    apis["API-327"] = dict(id="API-327", name="号码状态识别编码", endpoint=None, status="dictionary",
        sources=["https://wiki.alicti.cn/html/wiki/API/字段定义/接口部分/号码状态识别编码.html"],
        notes=["官方字段字典，20 条描述、16 个编码；715 与 183 各有三条描述。", "人工与预测字段分别映射；缺失、未列出或无法唯一确定时待确认。", "API-327 是项目引用编号，不是可调用接口；719 不证明本次呼叫接通。"])
    # Latest field review overlays display facts without editing the frozen source.
    review = json.loads((PUBLIC / "docs/field-alignment.json").read_text())
    source_map = {r["id"]: r for r in review["sources"]}
    for key, item in apis.items():
        current = [r for r in review["mappings"] if key in r["sourceIds"]]
        if current:
            item["notes"] = [r["label"] + "：" + r["rule"] + (" " + r["action"] if r["status"] == "待确认" else "") for r in current]
    apis["API-324"].update(name="资源操作核验归类", endpoint="agent/delete · skill/create · skill/update · skill/list", status="partial", sources=[source_map[k]["url"] for k in ("DOC-328", "DOC-329", "DOC-330", "DOC-332")], notes=["坐席删除和技能增改查已有文档，支持明确标记的本地模拟；真实资源列为接入准备。", "号码开通、隔离、共享号码路由发布及绑定仍待确认。"])
    apis["API-325"].update(name="任务操作核验归类", endpoint="task/start · task/get", status="partial", sources=[source_map[k]["url"] for k in ("DOC-333", "DOC-334")], notes=["启动和任务信息查询已有文档，返回 data.taskProperty。", "status：0 初始、1 运行中、2 暂停、3 结束；真实 taskId、恢复前提与执行结果待确认。"])
    apis["API-305"].update(name="座席通话操作", endpoint="CTILink.Agent 通话控制")
    return apis


SVG_STYLE = '''.bp-group{fill:#f5f8ff;stroke:#dce6f5;stroke-width:1.4}.bp-group--documented{fill:#f4faf8;stroke:#d7eae2}.bp-group--neutral{fill:#f8fafc;stroke:#e2e8f0}.bp-group-title{font:600 19px "PingFang SC","Microsoft YaHei",sans-serif;fill:#34445c}.bp-group-note{font:13px "PingFang SC","Microsoft YaHei",sans-serif;fill:#728097}.bp-node-box{fill:#fff;stroke:#b9cce8;stroke-width:1.5}.bp-node--documented .bp-node-box{stroke:#aacfc0}.bp-node--pending .bp-node-box{stroke:#d3a656;stroke-dasharray:6 4}.bp-node-accent{fill:#3e70bc}.bp-node--documented .bp-node-accent{fill:#39876a}.bp-node--pending .bp-node-accent{fill:#b88224}.bp-node-title{font:600 18px "PingFang SC","Microsoft YaHei",sans-serif;fill:#192b42}.bp-node-subtitle{font:14px "PingFang SC","Microsoft YaHei",sans-serif;fill:#5c6c81}.bp-node-scope{font:12px "PingFang SC","Microsoft YaHei",sans-serif;fill:#6e7f94}.bp-node-ref{font:11px "SFMono-Regular",Consolas,monospace;fill:#738096}.bp-edge-path{fill:none;stroke:#7497c5;stroke-width:2}.bp-edge--documented .bp-edge-path{stroke:#499279}.bp-edge--pending .bp-edge-path{stroke:#ba872f;stroke-dasharray:7 5}.bp-edge-hit{fill:none;stroke:transparent;stroke-width:18}.bp-edge-label-box{fill:#fff;stroke:#e5eaf1;stroke-width:.7}.bp-edge-label{font:13px "PingFang SC","Microsoft YaHei",sans-serif;fill:#42618a}.bp-edge--documented .bp-edge-label{fill:#367c61}.bp-edge--pending .bp-edge-label{fill:#9b6a18}.bp-node,.bp-edge{cursor:pointer}.bp-node.is-selected .bp-node-box,.bp-node:focus .bp-node-box{stroke:#245cc9;stroke-width:3}.bp-edge.is-selected .bp-edge-path,.bp-edge:focus .bp-edge-path{stroke-width:3.5}.bp-node.is-dim,.bp-edge.is-dim{opacity:.15}.bp-node.is-related .bp-node-box{stroke-width:2.7}.bp-node:focus,.bp-edge:focus{outline:none}.bp-svg-title{font:600 20px "PingFang SC","Microsoft YaHei",sans-serif;fill:#223b58}.bp-svg-footer{font:13px "PingFang SC","Microsoft YaHei",sans-serif;fill:#677991}'''


def text(x, y, content, cls):
    return f'<text x="{x}" y="{y}" class="{cls}">{ESC(content)}</text>'


CANVAS_LABELS = {
    "platform-edge-role": "身份租户", "platform-edge-resource-scope": "资源授权",
    "platform-edge-batch": "号码批次", "platform-edge-dispatch": "坐席执行",
    "platform-edge-metrics": "汇总口径", "platform-edge-adapter-audit": "操作留痕",
    "adapter-edge-check": "授权上下文", "adapter-edge-cdr-media": "通话标识",
    "adapter-edge-number-display": "识别结果", "alicti-edge-account-sign": "账号签名",
    "alicti-edge-account-login": "账号坐席", "alicti-edge-seat-skills": "技能绑定",
    "alicti-edge-task-ivr": "流程标识", "alicti-edge-event-cdr": "本方核对",
    "alicti-edge-cdr-media": "通话标识",
}


def svg(v):
    parts = [f'<svg class="bp-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {v["width"]} {v["height"]}" width="{v["width"]}" height="{v["height"]}" data-view-svg="{v["id"]}" role="group" aria-labelledby="{v["id"]}-svg-title {v["id"]}-svg-desc">',
             f'<title id="{v["id"]}-svg-title">{ESC(v["name"])}</title>', f'<desc id="{v["id"]}-svg-desc">{ESC(v["subtitle"])}</desc>',
             f'<style>{SVG_STYLE}</style><defs>']
    for status, color in [("platform", "#7497c5"), ("documented", "#499279"), ("pending", "#ba872f")]:
        parts.append(f'<marker id="{v["id"]}-arrow-{status}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 1 1 L 9 5 L 1 9 z" fill="{color}"/></marker>')
    parts.append('</defs><rect width="1200" height="100%" fill="#fff"/>')
    for g in v["groups"]:
        parts.append(f'<g class="bp-zone"><rect class="bp-group bp-group--{g["tone"]}" x="{g["x"]}" y="{g["y"]}" width="{g["w"]}" height="{g["h"]}" rx="12"/>')
        parts.append(text(g["x"]+22, g["y"]+34, g["name"], "bp-group-title"))
        if g["note"]:
            parts.append(text(g["x"]+g["w"]-20, g["y"]+34, g["note"], "bp-group-note").replace('class="bp-group-note"', 'class="bp-group-note" text-anchor="end"'))
        parts.append('</g>')
    for e in v["edges"]:
        path = "M " + " L ".join(f"{x} {y}" for x, y in e["points"])
        marker = f'url(#{v["id"]}-arrow-{e["status"]})'
        canvas_label = CANVAS_LABELS.get(e["id"], e["label"])
        width = sum(13 if ord(c) > 127 else 7 for c in canvas_label) + 16
        parts.append(f'<g class="bp-edge bp-edge--{e["status"]}" data-edge-id="{e["id"]}" role="button" tabindex="0" aria-label="关系：{ESC(e["label"])}" aria-pressed="false"><title>{ESC(e["detail"])}</title>')
        parts.append(f'<path class="bp-edge-path" d="{path}" marker-end="{marker}"'+(f' marker-start="{marker}"' if e["bidirectional"] else '')+'/>')
        parts.append(f'<path class="bp-edge-hit" d="{path}"/>')
        parts.append(f'<rect class="bp-edge-label-box" x="{e["lx"]-width/2}" y="{e["ly"]-17}" width="{width}" height="25" rx="5"/>')
        parts.append(text(e["lx"], e["ly"], canvas_label, "bp-edge-label").replace('class="bp-edge-label"', 'class="bp-edge-label" text-anchor="middle"'))
        parts.append('</g>')
    for n in v["nodes"]:
        x, y, w, h = n["x"], n["y"], n["w"], n["h"]
        refs = " · ".join(n["refs"][:2]) + (f' +{len(n["refs"])-2}' if len(n["refs"])>2 else '')
        parts.append(f'<g class="bp-node bp-node--{n["status"]}" data-node-id="{n["id"]}" data-related-system="{n["id"]}" role="button" tabindex="0" aria-label="模块：{ESC(n["title"])}" aria-pressed="false"><title>{ESC(n["role"])}</title>')
        parts.append(f'<rect class="bp-node-box" x="{x}" y="{y}" width="{w}" height="{h}" rx="9"/><rect class="bp-node-accent" x="{x}" y="{y+18}" width="4" height="{h-36}" rx="2"/>')
        parts.append(text(x+18, y+28, n["title"], "bp-node-title"))
        parts.append(text(x+18, y+53, n["subtitle"], "bp-node-subtitle"))
        parts.append(text(x+18, y+h-15, n["scope"], "bp-node-scope"))
        parts.append(text(x+w-15, y+h-15, refs, "bp-node-ref").replace('class="bp-node-ref"', 'class="bp-node-ref" text-anchor="end"'))
        parts.append('</g>')
    if v["id"] in ("adapter", "alicti"):
        footer = "对外契约：工具条 / 软电话 · 服务端 API · HTTP / WS 事件 · 分类话单 · 录音 / ASR · 字段字典" if v["id"] == "adapter" else "文档有依据 ≠ 联调完成。供应商内部服务、进程、数据库及部署拓扑未核实。"
        parts.append(text(40, v["height"]-28, footer, "bp-svg-footer"))
    parts.append('</svg>')
    return "\n".join(parts)


def api_table(apis):
    rows = []
    for api in apis.values():
        status = api["status"]
        tone = "pending" if status == "missing" else "platform" if status == "not_required" else "documented"
        label = {"missing": "待确认", "not_required": "平台职责", "partial": "有文档 · 边界待确认", "dictionary": "官方字段字典"}[status]
        endpoint = api["endpoint"] or ("未确认具体端点" if status == "missing" else "无供应商端点 · 本方职责" if status == "not_required" else "字段说明 · 无调用端点" if status == "dictionary" else "工具条 / 事件能力")
        nodes = [(v, n) for v in VIEWS for n in v["nodes"] if api["id"] in n["refs"]]
        specific = [(v, n) for v, n in nodes if v["id"] in ("adapter", "platform")]
        labels = '<br>'.join(f'<button type="button" class="bp-text-link" data-jump-node="{n["id"]}">{ESC(n["title"])}</button>' for v, n in specific[:3])
        notes = '<br>'.join(ESC(n) for n in api["notes"])
        source = ''.join(f'<a href="{ESC(url)}" target="_blank" rel="noopener noreferrer">查看接口文档 ↗</a>' for url in api["sources"])
        if not source:
            source = '<a href="../docs/interaction.html#M">查看规则附表 ↗</a>'
        rows.append(f'<tr data-api-row="{api["id"]}" data-api-status="{tone}"><td><span class="bp-api-id">{api["id"]}</span><strong>{ESC(api["name"])}</strong><span class="bp-pill bp-pill--{tone}">{label}</span></td><td><code>{ESC(endpoint)}</code><div class="bp-api-source">{source}</div></td><td>{labels}</td><td>{notes}</td></tr>')
    return ''.join(rows)


def build():
    apis = api_data()
    data = dict(version="1.4", date="2026-09-14", statuses=STATUSES, views=VIEWS, apis=apis)
    node_ids = [n["id"] for v in VIEWS for n in v["nodes"]]
    assert len(node_ids) == len(set(node_ids))
    for v in VIEWS:
        ids = {n["id"] for n in v["nodes"]}
        for item in v["nodes"] + v["edges"]:
            assert all(r in apis for r in item["refs"])
        for e in v["edges"]:
            assert e["source"] in ids and e["target"] in ids
    nav = ''.join(f'<a class="bp-view-link{" is-active" if i==0 else ""}" href="#{v["id"]}" data-view-link="{v["id"]}"'+(' aria-current="page"' if i==0 else '')+f'><span class="bp-view-number">0{i+1}</span><span>{v["short"]}<small>{len(v["nodes"])} 个模块 · {len(v["edges"])} 条关系</small></span></a>' for i, v in enumerate(VIEWS))
    panels = ''.join(f'<section class="bp-panel" data-view-panel="{v["id"]}" aria-label="{v["name"]}"'+(' hidden' if i else '')+'>'+svg(v)+'</section>' for i,v in enumerate(VIEWS))
    content = '''<!doctype html>
<html lang="zh-CN">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>系统架构蓝图 · AliCti 云外呼平台</title><link rel="stylesheet" href="../assets/css/system-blueprint.css?v=20260911-1"></head>
<body>
<div class="bp-layout" data-related-systems data-related-systems-state="ready">
 <aside class="bp-sidebar" aria-label="系统架构蓝图目录">
  <div class="bp-brand"><span class="bp-brand-icon" aria-hidden="true">▦</span><div>系统架构蓝图<small>AliCti 云外呼平台</small></div></div>
  <p class="bp-nav-label">架构视图</p><nav>__NAV__<a class="bp-view-link" href="#interfaces" data-view-link="interfaces"><span class="bp-view-number">05</span><span>接口对照<small>27 项接口与字段依据</small></span></a></nav>
  <div class="bp-side-note"><strong>阅读方式</strong><p>点击模块或连线，查看职责、关系和关联接口。</p><p>箭头表示流向；双向箭头表示请求与结果往返。</p></div>
  <a class="bp-doc-link" href="../docs/field-alignment.html">查看字段级对齐清单 ↗</a>
  <a class="bp-doc-link" href="../docs/interaction.html#A">查看规则附表 ↗</a>
  <div class="bp-sidebar-footer">逻辑架构 · 2026.09.14<br>平台设计与接口事实分开标识</div>
 </aside>
 <main class="bp-main">
  <header class="bp-header"><div><p class="bp-eyebrow">关联关系 / 架构说明</p><h1 id="bp-view-title">系统架构总览</h1><p id="bp-view-subtitle">从业务来源到呼叫执行，查看系统边界与数据流向。</p></div><span class="bp-version">蓝图 v1.4</span></header>
  <div class="bp-scope-note"><span aria-hidden="true">i</span><p>当前为逻辑设计与接口能力视图。<strong>文档有依据</strong>仅表示存在接口说明，边界仍需确认；<strong>平台职责</strong>表示本方设计，原型采用本地模拟。</p></div>
  <section class="bp-workspace" id="bp-workspace" aria-label="架构探索区">
   <div class="bp-toolbar"><div class="bp-search-wrap"><label class="bp-sr-only" for="bp-search">搜索模块或接口</label><span aria-hidden="true">⌕</span><input id="bp-search" type="search" placeholder="搜索模块、关系或接口编号" autocomplete="off" aria-controls="bp-search-results"><button type="button" id="bp-clear-search" aria-label="清除搜索" hidden>×</button><div id="bp-search-results" class="bp-search-results" aria-label="搜索结果" hidden></div></div><label class="bp-pending-toggle"><input id="bp-pending" type="checkbox">突出待确认</label><div class="bp-tools" aria-label="图形工具"><button type="button" data-action="zoom-out" aria-label="缩小">−</button><output id="bp-zoom" aria-live="polite">100%</output><button type="button" data-action="zoom-in" aria-label="放大">＋</button><button type="button" data-action="fit">适合宽度</button><button type="button" data-action="fullscreen">全屏</button><button type="button" data-action="export">导出 SVG</button></div></div>
   <div class="bp-legend"><span><i class="bp-dot bp-dot--platform"></i>平台职责</span><span><i class="bp-dot bp-dot--documented"></i>文档有依据</span><span><i class="bp-dot bp-dot--pending"></i>待确认</span><span class="bp-legend-hint" id="bp-view-count">11 个模块 · 10 条关系</span></div>
   <div class="bp-canvas" id="bp-canvas" tabindex="0" aria-label="可滚动架构图">__PANELS__<section class="bp-panel bp-interface-panel" data-view-panel="interfaces" aria-label="接口对照" hidden><div class="bp-table-intro"><strong>27 项接口与字段依据</strong><p>API-301–323 有文档依据但保留边界待确认；API-324–325 为资源及任务核验归类，已有端点与待确认项分别列明，API-326 为平台职责，API-327 为字段字典。编号是项目索引，不都是可调用端点。</p><p id="bp-table-count">显示 27 项</p></div><table class="bp-api-table"><thead><tr><th scope="col">接口 / 依据</th><th scope="col">路径与来源</th><th scope="col">关联模块</th><th scope="col">具体规则与缺口</th></tr></thead><tbody>__APIS__</tbody></table><p id="bp-table-empty" class="bp-table-empty" hidden>没有匹配的接口依据，请调整搜索条件。</p></section></div>
   <aside class="bp-inspector" id="bp-inspector" aria-label="模块与关系详情" hidden><div class="bp-inspector-top"><span id="bp-detail-kind">模块详情</span><button type="button" id="bp-close-detail" aria-label="关闭详情">×</button></div><div id="bp-detail-content"></div></aside>
   <div class="bp-toast" id="bp-toast" role="status" hidden></div>
  </section>
  <footer class="bp-footer"><span id="bp-footer-text">点击模块查看职责与接口；点击连线查看流向与确认边界。</span><button type="button" data-action="reset">重置视图</button></footer>
 </main>
</div>
<script src="blueprint-data.js?v=20260914-cf02"></script><script src="blueprint.js?v=20260911-1"></script><script src="../js/delivery-nav.js?v=20260911-blueprint1"></script>
</body></html>
'''.replace('__NAV__', nav).replace('__PANELS__', panels).replace('__APIS__', api_table(apis))
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "index.html").write_text(content)
    (OUT / "blueprint-data.js").write_text('window.SystemBlueprintData = ' + json.dumps(data, ensure_ascii=False, indent=2) + ';\n')
    print(json.dumps({"views":len(VIEWS),"nodes":len(node_ids),"edges":sum(len(v['edges']) for v in VIEWS),"references":len(apis)},ensure_ascii=False))


if __name__ == "__main__":
    build()
