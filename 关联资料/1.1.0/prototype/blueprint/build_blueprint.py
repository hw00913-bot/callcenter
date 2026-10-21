#!/usr/bin/env python3
"""Build the portable architecture explanation from the current interface index.

This is a logical responsibility/capability view, not a vendor deployment claim.
The published API index is a current normalized snapshot. Runtime artifacts do not need Python.
"""
import html
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT
OUT = PUBLIC / "related-systems"
INDEX = PUBLIC / "blueprint/api-index.json"
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
        refs=[i if isinstance(i,str) else "API-" + str(i) for i in refs], role=role, inputs=inputs,
        outputs=outputs, rules=rules, identifiers=ids, drill=drill))


def edge(v, key, source, target, label, points, lx, ly, status="platform",
         refs=(), detail="", rules=(), bidirectional=False):
    v["edges"].append(dict(id=v["id"] + "-edge-" + key, source=v["id"] + "-" + source,
        target=v["id"] + "-" + target, label=label, points=points, lx=lx, ly=ly,
        status=status, refs=[i if isinstance(i,str) else "API-" + str(i) for i in refs], detail=detail,
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
node(o, "shared", "统一身份与租户权限", "登录 · 角色 · 授权 · 资源映射", 60, 343, 260,
     refs=(326,), role="平台统一管理人员、租户、角色、功能与数据范围，维护供应商账号和坐席映射。",
     outputs=("已核验的用户、租户、供应商账号及坐席上下文",), ids=("平台账号", "租户 ID", "enterpriseId", "cno"),
     rules=("enterpriseId 为供应商账号 ID；UUID 不参与接口。", "每个enterpriseId只关联0或1个总部/门店业务租户，内置超级租户不计入；每个业务租户仍只关联一个AliCti账号。tenantId与enterpriseId分别保留，平台登录账号仍可按成员授权加入多个租户。总部7522240与门店7522241属于同一品牌，但资源和业务数据按各自账号及租户隔离。"), drill="platform")
node(o, "business", "云外呼业务域", "客户 · 任务 · 工作台 · 记录 · 报表", 455, 343,
     refs=(305, 311, 312, 317, 318, 319, 326), role="编排客户导入、分配、外呼任务、坐席操作、通话记录和统计。",
     inputs=("当前租户权限与客户批次",), outputs=("呼叫意图、任务操作、业务记录、统计视图",),
     rules=("业务状态、供应商任务状态、实时会话状态和号码识别结果分别保留。",), drill="platform")
node(o, "browser", "浏览器通话桥接", "CTILink / WebRTC", 60, 620, 280,
     refs=(302, 303, 304, 305, 306), role="在坐席浏览器初始化工具条、取得短期登录材料、控制会话并感知媒体状态。",
     inputs=("平台核验后签发的短期登录材料", "用户明确发起的电话操作"), outputs=("工具条事件、媒体就绪状态",),
     rules=("浏览器直接连接供应商电话服务；语音媒体不经过本方业务 API 适配器。", "登录成功不等于媒体已就绪。"), drill="adapter")
node(o, "backend", "后台接口适配", "签名 · 命令 · 回推 · 话单 · 媒体", 400, 620, 320,
     refs=(301, 307, 311, 315, 316, 317, 318, 320, "DOC-346"), role="在服务端统一完成权限核验、接口鉴权、命令转换、结果归集与业务数据映射。",
     inputs=("平台业务指令", "AliCti 回执、事件、话单及媒体结果"), outputs=("可追溯业务结果及待核对项",),
     rules=("长期部门 token 仅保留服务端。", "接口有文档不等于边界已联调验证。"), drill="adapter")
node(o, "phone", "客户电话 / 通信线路", "号码承载与实际接续", 850, 620, 260,
     status="pending", scope="接续边界", refs=(310, 324), role="描述客户电话与通信线路的业务接续关系。",
     rules=("企业号码可查询并启停/修改外显用途；资源开通由供应商处理，完整共享路由待确认。", "不据此绘制供应商运营商网关或内部媒体部署。"))
node(o, "cti", "AliCti 电话能力", "坐席登录 · 会话控制 · 软电话", 60, 865, 300,
     status="documented", scope="公开能力", refs=(302, 303, 304, 305, 306), role="公开工具条与软电话能力的逻辑集合。",
     rules=("D-052已澄清SDK信令重连和软电话中断；版本、跨设备互斥、清理及媒体连通仍需真实账号验证。",), drill="alicti")
node(o, "api", "AliCti API 与结果能力", "资源 · 任务 · IVR · 事件 · 话单", 450, 865, 330,
     status="documented", scope="公开能力", refs=tuple(i for i in range(307, 324) if i!=321)+("DOC-346",), role="公开服务端接口及事件、话单、录音和 RASR 能力的逻辑集合。",
     rules=("本视图不表示供应商内部微服务调用顺序。", "暂停后继续按D-017先task/get确认status=2再task/start，随后回查；结束任务不重启，真实资源与号码生命周期另行核验。"), drill="alicti")
edge(o, "login", "users", "shared", "登录 / 选择租户", [(190, 188), (190, 343)], 190, 244, refs=(326,), detail="由平台识别人员身份、角色和租户访问范围。")
edge(o, "import", "sources", "business", "文件导入客户批次", [(605, 188), (605, 343)], 605, 244, refs=(326,), detail="按业务来源与编码保存批次及客户，不假设上游自动回写接口。")
edge(o, "authorize", "shared", "business", "上下文授权", [(320, 397), (455, 397)], 387, 382, refs=(326,), detail="功能权限、数据范围与供应商资源映射共同约束业务操作。")
edge(o, "ui-phone", "business", "browser", "坐席会话操作", [(530, 451), (530, 572), (200, 572), (200, 620)], 372, 572, refs=(303, 305, 306), detail="工作台通过浏览器桥接层触发工具条操作，并独立处理媒体准备状态。")
edge(o, "ui-api", "business", "backend", "任务 / 资源 / 结果", [(660, 451), (660, 620)], 660, 572, refs=(307, 311, 315, 317), detail="业务意图进入后台适配器，核验权限后调用对应接口。", bidirectional=True)
edge(o, "sdk", "browser", "cti", "工具条信令 / 软电话媒体", [(200, 728), (200, 865)], 200, 783, "documented", (302, 303, 304, 305, 306), "浏览器与 AliCti 电话能力建立连接；不能将平台登录成功视作媒体连通。", bidirectional=True)
edge(o, "server", "backend", "api", "命令请求 ⇄ 事件 / 话单 / 媒体", [(575, 728), (575, 865)], 575, 783, "documented", tuple(range(307, 324)), "后台按接口分别适配命令请求、异步回推与结果查询，不把这些结果合并为单一完成信号。", bidirectional=True)
edge(o, "line", "cti", "phone", "线路承载 / 呼入路由", [(360, 919), (410, 919), (410, 990), (1130, 990), (1130, 674), (1110, 674)], 920, 990, "pending", (310, 324), "号码可查询并按batchUpdateNumber启停/改外显用途；开通与归属走供应商资源流程，呼入路由CRUD已按D-024采用；条件匹配与归属保留CF-10；D-048取消供应商账号解绑需求，本地控制后续外呼使用。", bidirectional=True)

p = view("platform", "平台系统与模块", "平台模块", "按本方职责组织身份、业务、结果和接口适配模块。", 1060, [
    group("共享平台 · 身份、租户与资源上下文", 30, 25, 1130, 210),
    group("云外呼业务 · 客户到呼叫执行", 30, 290, 1130, 210),
    group("云外呼结果与资源管理", 30, 555, 1130, 210),
    group("平台支撑", 30, 820, 1130, 210)])
node(p, "identity", "平台账号与租户", "总部 / 门店成员 · 租户切换", 60, 100, refs=(326,), role="管理平台账号和当前租户，形成业务访问的起点。", outputs=("人员、组织与当前租户上下文",), rules=("平台账号不是 enterpriseId；租户也不是供应商实例。",))
node(p, "permissions", "角色与数据权限", "菜单 · 操作 · 数据范围", 445, 100, refs=(326,), role="统一核验功能权限和数据范围，限制客户、任务、记录与资源访问。", inputs=("平台身份与租户",), outputs=("已授权操作范围",), rules=("同一供应商账号下仍需逐租户隔离。", "后台须再次校验；隐藏菜单不构成权限边界。"))
node(p, "context", "供应商账号与坐席映射", "enterpriseId + cno + 平台授权", 830, 100, refs=(301, 302, 326), role="维护平台租户、供应商账号、人员和坐席之间的明确映射。", ids=("平台账号", "租户 ID", "enterpriseId", "cno"), rules=("enterpriseId 是供应商账号 ID。UUID 不参与接口。", "D-014：cno全链路String，鉴权与登录完整一致；0012与12是不同工号。"))
node(p, "customers", "客户与导入批次", "业务来源 · 编码 · 分配 · 归档", 60, 365, refs=(312, 326), role="导入线索、售后、活动客户，建立批次、业务编码与跟进归属。", outputs=("任务号码及本方客户关联关系",), rules=("供应商 task 去重不等于平台客户或业务批次去重。", "导入文件是当前上游衔接方式。"))
node(p, "tasks", "任务编排与运行管理", "预测外呼 / 自动外呼", 445, 365, refs=(311, 312, 313, 314, 325), role="管理任务配置、号码导入、暂停和结束意图，保留业务状态及供应商结果。", inputs=("客户批次、已授权坐席 / 技能和号码",), outputs=("taskId 映射、任务指令及待核对结果",), rules=("启动使用task/start，继续前先task/get确认当前status=2；同一taskId再start并回查。D-021用户确认：暂停后可继续，确认status=3不重启且不再发起后续首次呼叫或重呼。暂停不传pauseDuration。", "手动或定时按用户配置；启动前核验资源和坐席范围。两类任务开启重呼都必选呼叫状态并填写次数、间隔、计时依据；D-020供应商反馈预测同样支持按状态重呼，两类均映射一组sipCause，由阿里执行；关闭省略重呼字段和templateName，按不启用处理。"))
node(p, "workbench", "坐席工作台与呼入服务", "接听 · 通话中记录 · 确认保存", 830, 365, refs=(302, 303, 304, 305, 306, 319), role="向坐席提供登录、电话操作及通话中填写；每项输入暂存本标签草稿，结束后确认保存业务记录。", inputs=("授权坐席与客户 / 任务上下文",), outputs=("电话操作及本方业务小结",), rules=("当前用户对 cno 的使用权限先经平台核验。", "呼入按可信账号及唯一业务租户映射核验，仍需通话/坐席身份与对象权限一致；未知或冲突不得写入。", "D-038 / SRC-070 / G-36–G-43 / FA-107–FA-113、FA-135、FA-142：人工外呼从dialing/ringing即可填写，来电须匹配人工接通后connected才可填写；草稿与电话状态独立，wrap才正式保存。", "草稿在本标签sessionStorage按平台账号和租户隔离并核验enterpriseId/原通话；暂存不写入正式档案或报表，不向AliCti提交。", "收起、通话事件与挂断保留输入。刷新演示中断仅恢复草稿到待确认，不恢复真实话路；正式保存失败保留输入及占用。"))
node(p, "reports", "统计与运营视图", "七类视图 · 含线索成效", 60, 630, refs=(317, 318, 319, 326), role="在已授权数据范围内汇总七类运营视图；线索按同品牌账号原编码合并，任务使用独立供应商累计。", inputs=("分类规范化的话单与本方业务记录",), rules=("客户接听、坐席接通与号码识别结果使用各自证据，不能混算。", "IVR 应答不等同人工坐席接听。"))
node(p, "records", "通话记录与媒体", "人工 / 预测 / 呼入 · 录音 · RASR", 445, 630, refs=(317, 318, 319, 320, "DOC-346", 327), role="按话单类别保存原始数据及展示映射，独立跟踪录音和 RASR 可用性。", outputs=("通话详情、号码状态、媒体查看入口",), rules=("号码状态直接复用官方字典；715、183 不唯一时待确认。", "话单已到不代表录音或 ASR 同时就绪。"))
node(p, "resources", "坐席 / 技能 / 号码配置", "资源台账 · 账号授权 · 操作核对", 830, 630, refs=(307, 308, 309, 310, 322, 324), role="维护本方资源台账并适配已有供应商配置接口。", inputs=("enterpriseId 资源上下文及操作权限",), rules=("技能绑定接口按全量替换处理。", "agent/delete、skill/create 已有文档；号码开通与实际资源仍需接入准备；呼入规则CRUD已有文档，匹配与归属边界见CF-10。"))
node(p, "gateway", "接口适配入口", "浏览器桥接 + 后台适配", 60, 895, refs=(301, 302, 315, 316, 317, 326), role="为业务模块提供统一的供应商访问与结果归集边界。", rules=("此处为逻辑设计，原型没有调用供应商真实接口。",), drill="adapter")
node(p, "audit", "异常核对与操作留痕", "请求 · 原始事件 · 业务关联", 445, 895, refs=(315, 316, 325, 326), role="记录操作者、租户、原始请求和结果，集中呈现失败、不确定与待核对事项。", rules=("本方去重不等价于供应商幂等保证。", "使用 task/get 核对任务状态；查询结果和原操作无法关联时保留待确认。"))
edge(p, "role", "identity", "permissions", "身份与租户", [(360, 154), (445, 154)], 403, 140, refs=(326,), detail="先确定登录身份和租户，再判定功能与数据权限。")
edge(p, "resource-scope", "permissions", "context", "授权资源范围", [(745, 154), (830, 154)], 788, 140, refs=(326,), detail="供应商账号及坐席必须处于用户当前可用的资源范围内。")
edge(p, "business-guard", "permissions", "tasks", "统一约束业务操作", [(595, 208), (595, 365)], 595, 267, refs=(326,), detail="该连线代表对云外呼业务层的共同约束，客户、任务和坐席操作均受权限检查。")
edge(p, "mapping", "context", "resources", "资源映射 / 使用范围", [(1115, 208), (1145, 208), (1145, 607), (1115, 607), (1115, 630)], 1020, 535, refs=(307, 309, 310, 326), detail="本方记录资源所属账号及唯一业务租户；角色与对象权限仍须逐项核验。")
edge(p, "batch", "customers", "tasks", "客户与号码批次", [(360, 419), (445, 419)], 403, 405, refs=(312, 326), detail="保留平台业务编码与批次映射，按供应商任务约束导入号码。")
edge(p, "dispatch", "tasks", "workbench", "任务关联 / 坐席执行", [(745, 419), (830, 419)], 788, 405, refs=(305, 311), detail="按人工、预测与自动外呼各自流程执行；自动外呼接通后进入供应商语音流程。")
edge(p, "result", "tasks", "records", "按任务关联话单", [(595, 473), (595, 630)], 595, 535, refs=(318,), detail="根据当前文档字段关联任务与预测话单，原始状态独立保存。")
edge(p, "manual-record", "workbench", "records", "人工 / 呼入结果", [(980, 473), (980, 570), (705, 570), (705, 630)], 820, 570, refs=(317, 319), detail="人工外呼与呼入按各自话单字段解释，不能与预测话单套用同一状态表。")
edge(p, "metrics", "records", "reports", "分类汇总口径", [(445, 684), (360, 684)], 403, 670, refs=(317, 318, 319, 326), detail="按客户接通、坐席接通、通话时长及业务跟进等明确维度统计。")
edge(p, "adapter-business", "gateway", "records", "规范化话单 / 媒体", [(315, 895), (315, 795), (505, 795), (505, 738)], 355, 795, refs=(317, 318, 319, 320, "DOC-346"), detail="适配层将不同来源结果规范化并保留原始数据，业务层按租户范围展示。")
edge(p, "adapter-audit", "gateway", "audit", "请求与结果留痕", [(360, 949), (445, 949)], 403, 934, refs=(326,), detail="将请求、回执和异步结果关联到平台操作记录。")
edge(p, "record-audit", "records", "audit", "异常 / 待核对", [(595, 738), (595, 895)], 595, 802, refs=(315, 316, 325), detail="未收齐结果、无法判定或状态契约缺失时保留待核对项。")


a = view("adapter", "接口适配层模块关系", "接口适配层", "浏览器桥接与后台适配分开；命令、事件、话单、媒体按各自节奏处理。", 1170, [
    group("浏览器内", 30, 25, 335, 222, "neutral"),
    group("服务端 · 访问控制与鉴权", 395, 25, 765, 222),
    group("服务端 · 供应商命令适配", 30, 310, 1130, 210),
    group("服务端 · 结果接入与查询", 30, 580, 1130, 210),
    group("服务端 · 关联、映射与可用性", 30, 850, 1130, 220)])
node(a, "sdk", "CTILink / WebRTC 桥接", "登录事件 · 会话操作 · 媒体状态", 50, 110, 295, refs=(302, 303, 304, 305, 306), scope="浏览器设计", role="封装工具条初始化、事件监听、短期登录、人工外呼和软电话操作。", inputs=("短期 sessionKey 与 agentGateWayUrl",), outputs=("会话事件与媒体准备状态",), rules=("先初始化并注册事件，再取得短期材料登录。", "长期 token 不进入浏览器；媒体连接不经后台业务接口中转。"))
node(a, "guard", "身份与资源校验", "用户 → 租户 → 账号 → 坐席", 420, 110, 300, refs=(302, 326), role="核验当前操作主体、租户、业务权限与可用资源映射。", outputs=("最小必要的供应商账号、坐席及操作上下文",), ids=("平台用户", "租户 ID", "enterpriseId", "cno"), rules=("同账号唯一业务租户的事件、话单仍按角色、坐席和对象权限过滤。",))
node(a, "auth", "服务端签名与短效鉴权", "部门 token 保管 · sessionKey", 810, 110, 320, refs=(301, 302), role="保管长期部门 token，生成对应签名并申请坐席短期登录材料。", outputs=("接口签名", "有效期 30 秒的 sessionKey"), rules=("MD5 签名为 enterpriseId + 秒级时间戳 + 部门 token，32 位小写；时间戳有效 30 分钟。", "/cc 系列鉴权按各自文档单独核对。"))
node(a, "resources", "资源命令适配", "坐席同步 · 技能 · 号码启停", 60, 385, refs=(307, 308, 309, 310, 324), role="分别适配坐席单个/批量新增、已有席query/get、离线配置修改、技能全量替换、号码查询与batchUpdateNumber。", rules=("技能列表为全量替换，skillIds=0 表示清空。", "连续工号batchCreate最多100个；号码只改status或变化用途。配置和技能修改先下线。"))
node(a, "tasks", "任务命令适配", "创建 / 启停 / 查询 / 名单导入", 445, 385, refs=(311, 312, 313, 314, 325), role="按任务类型处理创建、号码导入、暂停及结束，并记录指令与回执。", ids=("平台任务 ID", "taskId", "导入批次"), rules=("autoStart按手工/预约配置生成0/1；importTelAutoStart显式0。", "暂停不传pauseDuration；继续先get确认原任务status=2，再start并get复查，已结束不重启；D-021确认结束后不再发起后续首次呼叫或重呼；D-047 / SRC-077用户转述供应商确认：暂停或结束只管任务，未发起呼叫不再发起；已发起拨号、振铃及通话正常进行，生成正常话单，回补原任务、客户及统计。"))
node(a, "ivr", "IVR 资源与执行查询适配", "列表 · 详情 · 已执行节点", 830, 385, refs=(322, 323, "DOC-348", "DOC-349"), role="从ivrProfile/list取得资源，按当前账号、IVR类型和本地租户外呼授权筛选；选中id映射任务ivrId。", rules=("list用于选择，listDetail用于查看定义；ivrFlow/query仅回查一次通话执行节点。", "列表不提供发布、版本或外呼适用性保证；流程由阿里侧维护。呼入路由CRUD另用ivrRouter接口；未定义的条件匹配与归属见CF-10。"))
node(a, "events", "HTTP / 企业 WS 接入", "回推订阅 · 原始事件接收", 60, 655, refs=(315, 316), role="按事件类型接收任务、话单、录音、ASR 等结果，记录来源、时间及原始载荷。", outputs=("待校验的原始事件",), rules=("企业 WS 默认可能包含全部坐席，须按平台映射分发。", "企业 WS 最大 10 路；重放和可靠性保证待确认。"))
node(a, "cdr", "分类话单规范化", "人工 / 预测 / 呼入独立映射", 445, 655, refs=(317, 318, 319, 327), role="分别解释三类话单的接通时间、客户和坐席状态，并保留原始数据。", outputs=("分类话单、原始字段、号码识别输入",), rules=("人工 upTime 对应坐席，预测 upTime 对应客户，不能共用解释。", "号码状态不能代替客户或坐席接通证据。"))
node(a, "media", "录音 / RASR 结果适配", "链接有效期 · 文本与说话方", 830, 655, refs=(320, "DOC-346"), role="独立获取录音地址与 RASR 结果，处理空结果、未知结果及链接过期。", outputs=("短期录音访问地址", "RASR 可用性及原始文本结果"), rules=("录音地址默认 120 分钟有效，不能作为永久存储地址。", "RASR 0成功/-1失败；text与botText分别解析，按monitorSide区分说话方，机器人独立标记。"))
node(a, "reconcile", "事件关联与结果核对", "去重 · 乱序留存 · 租户过滤", 60, 925, refs=(315, 316, 317, 318, 325, 326), role="设计本方事件去重、关联、乱序处理和核对机制，按权限归属到业务对象。", ids=("enterpriseId", "cno", "taskId", "callId / uniqueId（按接口）"), rules=("本方去重不代表供应商承诺幂等。", "任务状态按 task/get 返回的 TaskProperty 解释；事件重复、乱序和操作关联仍需核验。"))
node(a, "dictionary", "号码识别字典复用", "官方编码 + 原始描述", 445, 925, refs=(317, 318, 327), role="直接复用号码状态识别编码，区分人工 SIP 字段与预测识别字段。", outputs=("官方号码状态或保留原值的待确认提示",), rules=("715 与 183 各有三条描述，不能自选唯一含义。", "人工仅有 SIP 183 时待确认；719 不证明本次呼叫已接通。", "API-327 是字段说明索引，不是可调用接口。"))
node(a, "availability", "能力与结果可用性", "可展示结果 / 待确认 / 待核对", 830, 925, refs=(320, "DOC-346", 324, 325, 326), role="将明确结果提供给业务，将缺失契约、未就绪媒体及不确定结果保留为可见待处理项。", outputs=("页面可用性提示、异常记录及核对入口",), rules=("已有端点与资源、字段、结果待确认分别记录，不生成未核实的成功结果。", "页面展示模拟通过不代表真实联调通过。"))
edge(a, "check", "guard", "auth", "核验后的调用上下文", [(720, 164), (810, 164)], 765, 150, refs=(301, 302, 326), detail="平台校验通过后才生成签名或取得坐席登录材料。")
edge(a, "short-key", "auth", "sdk", "短期登录材料 → 浏览器（长期 token 留在服务端）", [(970, 218), (970, 277), (198, 277), (198, 218)], 550, 277, refs=(302,), detail="服务端申请 sessionKey 后交给已授权浏览器使用，其有效期仅 30 秒。")
edge(a, "signed-resources", "auth", "resources", "签名后的资源调用", [(880, 218), (880, 298), (375, 298), (375, 362), (210, 362), (210, 385)], 210, 368, refs=(301, 307, 308, 309, 310), detail="资源类调用分别适配；对 /cc 路径不能盲目沿用同一签名假设。")
edge(a, "signed-tasks", "auth", "tasks", "签名后的任务调用", [(930, 218), (930, 323), (595, 323), (595, 385)], 595, 368, refs=(301, 311, 312, 313, 314), detail="统一鉴权职责不改变各任务接口的受理、完成和状态查证边界。")
edge(a, "signed-ivr", "auth", "ivr", "签名后的 IVR 调用", [(1050, 218), (1050, 385)], 1050, 368, refs=(301, 322, 323, "DOC-348", "DOC-349"), detail="账号鉴权后分别读取流程列表、定义详情与单次执行轨迹；失败不以旧列表冒充新结果。")
edge(a, "task-cdr", "tasks", "cdr", "任务与话单关联", [(595, 493), (595, 655)], 595, 549, refs=(318,), detail="本方保存 taskId 与业务任务映射，按预测话单字段关联执行结果。")
edge(a, "pending-command", "tasks", "availability", "任务状态 / 正常话单", [(745, 458), (787, 458), (787, 888), (980, 888), (980, 925)], 935, 825, "platform", (325,), "D-017：继续先get确认原任务暂停，再start并get查证。失败未知保留历史、不重放；D-021确认结束后不再发起后续首次呼叫或重呼；D-047 / SRC-077用户转述供应商确认：暂停或结束只管任务，未发起呼叫不再发起；已发起拨号、振铃及通话正常进行，生成正常话单，回补原任务、客户及统计。")
edge(a, "ingest", "events", "reconcile", "原始事件与账号上下文", [(210, 763), (210, 822), (42, 822), (42, 900), (210, 900), (210, 925)], 210, 822, refs=(315, 316, 326), detail="接收不等于业务完成：先识别来源、对象与租户，再处理重复和乱序。")
edge(a, "reconcile-cdr", "reconcile", "cdr", "按呼叫标识核对", [(360, 979), (395, 979), (395, 709), (445, 709)], 397, 909, refs=(317, 318, 319), detail="通话结果按分类话单核对；任务状态另用 task/get，不混用两类状态。")
edge(a, "number-code", "cdr", "dictionary", "分类后的原始字段", [(595, 763), (595, 925)], 595, 822, refs=(317, 318, 327), detail="人工与预测使用不同响应字段，字典只解释识别值，不改写接通统计。")
edge(a, "cdr-media", "cdr", "media", "按通话标识查询", [(745, 709), (830, 709)], 788, 695, refs=(320, "DOC-346"), detail="按各接口要求的通话标识获取媒体，话单与媒体可分别到达。")
edge(a, "media-ready", "media", "availability", "媒体就绪 / 无文本", [(1080, 763), (1080, 925)], 1080, 875, refs=(320, "DOC-346"), detail="链接有效性、录音就绪与 RASR 文本结果独立反馈给页面。")
edge(a, "number-display", "dictionary", "availability", "已识别或待确认", [(745, 979), (830, 979)], 788, 965, refs=(327,), detail="无法唯一确认编码描述时保留原值和候选项，不生成自定义号码状态。")

t = view("alicti", "AliCti 系统与能力模块", "AliCti 模块", "按公开接口组织能力；连线表示对象引用与结果关联，不代表供应商内部服务调用。", 1150, [
    group("账号与鉴权边界", 30, 25, 1130, 220, "documented"),
    group("配置资源能力", 30, 310, 1130, 220, "documented"),
    group("呼叫执行能力", 30, 580, 1130, 220, "documented"),
    group("事件与结果能力", 30, 850, 1130, 220, "documented")])
node(t, "sign", "服务端接口鉴权", "enterpriseId + timestamp + sign", 60, 110, status="documented", scope="公开能力", refs=(301,), role="为服务端接口调用提供文档规定的鉴权入口。", rules=("部门 token 不进入浏览器。", "/cc 系列按各自接口核对鉴权。"))
node(t, "account", "供应商账号上下文", "enterpriseId = 账号 ID", 445, 110, status="documented", scope="接口对象", refs=(301, 302, 307, 310, 316), role="代表 AliCti 供应商账号范围，用于登录、资源访问与企业事件接入。", ids=("enterpriseId",), rules=("UUID 不参与接口。", "企业账号上下文不是平台租户隔离保证。"))
node(t, "login", "坐席前端登录鉴权", "cno → sessionKey / 网关地址", 830, 110, status="documented", scope="公开能力", refs=(302,), role="提供坐席前端使用的短期登录材料。", ids=("enterpriseId", "cno", "sessionKey"), rules=("sessionKey 有效 30 秒；平台在申请前检查人员与坐席关系。",))
node(t, "seat", "坐席资源", "agent/create · agent/update", 60, 395, status="documented", scope="公开能力", refs=(307, 308, 324), role="创建和更新坐席资料、开关及相关配置。", ids=("cno", "areaCode"), rules=("cno 为 3–10 位数字字符串，保留前导零。", "batchCreate按连续工号；query/get导入和查证。update/技能/删除统一先下线，20023失败不回写。"))
node(t, "skill", "坐席技能绑定", "batchUpdateAgentSkill", 445, 395, status="documented", scope="公开能力", refs=(309, 324), role="创建、更新和查询技能；按坐席全量替换多个技能。平台团队另转换为任务 cnos。", ids=("cno", "skillIds", "skillLevels"), rules=("skillIds=0 清空；skillLevels 数值较小优先级高。", "技能增改查已有文档；本地等级1–10，failCno按String解析并逐席检查。"))
node(t, "number", "企业号码查询与启停", "listPage / batchUpdateNumber", 830, 395, status="documented", scope="公开能力", refs=(310, 324), role="查询号码并更新启停、外显用途；保留平台授权和路由。", rules=("每页最多 1000 条。", "只提交变化的status或外显字段；D-048确认停用后后续选号不再使用，已发起通话继续。共享呼入归属保留CF-10。"))
node(t, "phone", "工具条与软电话", "CTILink · 会话控制 · WebRTC", 60, 665, status="documented", scope="公开能力", refs=(303, 304, 305, 306), role="提供坐席上线、状态操作、人工预览外呼和软电话会话能力。", rules=("请求接受不等于客户接听，登录成功不等于媒体准备完成。", "D-052确认信令重连最多20次及软电话断开须重登；跨设备互斥、异常清理和媒体最终状态仍需验证。"))
node(t, "task", "预测 / 自动外呼任务", "创建 / 启停 / 查询 / 名单导入", 445, 665, status="documented", scope="公开能力", refs=(311, 312, 313, 314, 325), role="按 type=1 预测外呼、type=2 自动外呼 分别管理任务及号码。", ids=("taskId", "type", "callGroupType / cnos / agentGroup"), rules=("手工/定时参数按文档转换；原型仅模拟，不实际定时拨号。", "状态为0初始、1运行中、2暂停、3结束；继续按get确认2→start→get回查，状态3不得再次开启，暂停不传pauseDuration。"))
node(t, "ivr", "IVR 流程资源与执行结果", "流程列表 · 定义详情 · 执行轨迹", 830, 665, status="documented", scope="公开能力", refs=(322, 323, "DOC-348", "DOC-349"), role="提供ivrProfile/list、listDetail和ivrFlow/query；自动外呼选用已有流程，内容维护由阿里侧完成。", rules=("ivrType=1为IVR，2为彩铃；当前账号和租户外呼授权共同限定可选范围。", "返回列表不等于已发布或适用所有外呼；呼入路由CRUD已按D-024采用，条件匹配与归属仍见CF-10。"))
node(t, "events", "HTTP / 企业 WS 事件", "任务 · 坐席 · 话单 · 媒体通知", 60, 935, status="documented", scope="公开能力", refs=(315, 316), role="通过配置 HTTP 回推或企业 WebSocket 提供各类异步事件。", rules=("企业 WS /user/agent 默认可能包含全部坐席，平台必须过滤。", "重复、乱序、重放及重试层级不能假设已被完整保证。"))
node(t, "cdr", "分类通话记录", "人工外呼 / 预测外呼 / 呼入", 445, 935, status="documented", scope="公开能力", refs=(317, 318, 319, 327), role="三类话单分别提供通话、接通与号码识别相关字段。", rules=("人工与预测 status 枚举及 upTime / bridgeTime 含义不同。", "号码识别按 API-327 字段文档复用；不是新建状态接口。"))
node(t, "media", "录音与 RASR", "record/getUrl · rasrEvent/query", 830, 935, status="documented", scope="公开能力", refs=(320, "DOC-346"), role="按通话标识提供录音访问地址和 RASR 文本结果。", rules=("按uniqueId查询RASR，data数组中text/botText为JSON字符串；-2不在该接口定义。", "monitorSide=1坐席/2客户，botText为机器人；文本只阅读搜索，录音定位已取消。"))
edge(t, "account-sign", "account", "sign", "使用账号签名", [(445, 164), (360, 164)], 403, 150, "documented", (301,), "enterpriseId 参与服务端签名，不将 UUID 作为接口凭证。")
edge(t, "account-login", "account", "login", "账号 + 坐席", [(745, 164), (830, 164)], 788, 150, "documented", (302,), "前端登录鉴权请求包含 enterpriseId 与 cno。")
edge(t, "account-resources", "account", "seat", "账号范围内的坐席对象", [(530, 218), (530, 278), (210, 278), (210, 395)], 330, 278, "documented", (307, 308), "该线描述接口访问和对象归属，不声称供应商有独立账号数据库或内部调用。")
edge(t, "account-number", "account", "number", "账号范围内的号码查询", [(675, 218), (675, 278), (980, 278), (980, 395)], 850, 278, "documented", (310,), "按企业账号查询并更新已开号码的status/外显；开通由供应商处理，呼入匹配与归属另见CF-10；本地停用不解除账号资源。")
edge(t, "seat-skills", "seat", "skill", "cno 技能绑定", [(360, 449), (445, 449)], 403, 435, "documented", (309,), "技能接口按坐席更新完整技能列表，不是增量追加。")
edge(t, "seat-phone", "seat", "phone", "cno 登录 / 操作", [(210, 503), (210, 665)], 210, 555, "documented", (302, 303, 304, 305), "平台确认人员与 cno 的使用关系后，浏览器取得短期材料并登录。")
edge(t, "seat-task", "seat", "task", "指定坐席工号", [(360, 449), (400, 449), (400, 610), (595, 610), (595, 665)], 595, 596, "documented", (307, 311), "预测任务选择同租户有效指定坐席，callGroupType=1 传 cnos；agentGroup 是外呼组，不能用技能 ID 代替。")
edge(t, "number-routing", "number", "ivr", "号码 → 呼入路由 → 目标", [(980, 503), (980, 665)], 980, 555, "documented", (350, 351, 352, 353, 354), "D-024通过ivrRouter配置中继条件和目标；条件组合、未命中与话单归属证据仍见CF-10。")
edge(t, "task-ivr", "task", "ivr", "选择流程 → ivrId", [(745, 719), (830, 719)], 788, 705, "documented", (311, "DOC-348"), "列表返回id映射task/create的ivrId，type=2；本地授权限制可选流程，演示ID不代表真实资源已验收。")
edge(t, "phone-events", "phone", "events", "坐席 / 会话事件", [(210, 773), (210, 935)], 210, 825, "documented", (303, 304, 315, 316), "工具条事件与企业事件各自接入；不将其中一个回调作为全部业务结果。")
edge(t, "task-cdr", "task", "cdr", "任务对应的预测话单", [(595, 773), (595, 935)], 595, 825, "documented", (318,), "按话单字段关联任务与呼叫轮次；结束与重试标记分别解释。")
edge(t, "ivr-record", "ivr", "cdr", "按通话查执行节点", [(920, 773), (920, 885), (700, 885), (700, 935)], 822, 885, "documented", (323,), "ivrFlow/query 查询某次通话已执行节点，不能视为供应商内部 IVR 到话单服务调用。")
edge(t, "event-cdr", "events", "cdr", "本方按标识核对", [(360, 989), (445, 989)], 403, 975, "platform", (315, 316, 317, 318, 319), "这是本方利用事件和话单进行结果关联的设计关系，不代表 AliCti 内部消息拓扑。")
edge(t, "cdr-media", "cdr", "media", "按通话标识获取", [(745, 989), (830, 989)], 788, 975, "documented", (320, "DOC-346"), "录音和 RASR 按各自接口要求的通话标识查询，可用时间独立。")



# Current confirmed module extensions; source snapshots remain immutable.
p["height"]=1350
p["groups"].append(group("呼入配置与客户资料",30,1120,1130,190))
node(p,"inbound-rules","呼入规则管理","目标 · 条件 · 优先级 · 启停",60,1180,status="documented",refs=(350,351,352,353,354),role="超管维护账号级路由，管理员只读明确本租户记录。",rules=("目标三选一，显式active；更新以id定位，删除前确认停用。","本地演示不证明真实供应商执行；匹配与归属见CF-10。"))
node(p,"business-info","客户业务信息","六项选填 · 当次快照 · 档案汇总",445,1180,refs=(326,),role="本方保存线索等级、意向等级、到店与试驾意向、计划到店时间及门店。",rules=("按品牌、租户、完整号码和通话编号关联；每项取最近非空值。","旧表单版本冲突不覆盖，新通话空值不擦除旧值，历史通话不复制未来填写。","门店仅作目的地，不改变客户归属或访问权限。"))
node(p,"config-records","配置处理记录","原失败 · 最新结果 · 修复历史",830,1180,refs=(307,"DOC-342","DOC-343"),role="失败坐席按原因修改资料，未知技能只查看原因；保留原失败与后续处理。",rules=("已成功记录禁止重复新增。","独立配置日志与统一操作审计分别验收。"))
edge(p,"rule-adapter","gateway","inbound-rules","路由接口适配",[(210,1003),(210,1180)],210,1090,refs=(350,351,352,353,354),detail="账号级权限、资源与目标字段校验后调用ivrRouter；待确认分支不阻断已明确CRUD。")
edge(p,"business-snapshot","records","business-info","通话快照与资料汇总",[(745,690),(790,690),(790,1090),(595,1090),(595,1180)],790,1040,refs=(326,),detail="D-038：通话中逐项暂存，结束后确认或已结束详情补录才正式保存同一份当次业务快照；档案仅汇总当前权限下已保存信息。草稿和业务字段不发送供应商。")
edge(p,"repair-audit","audit","config-records","关联处理记录",[(745,950),(790,950),(790,1120),(980,1120),(980,1180)],980,1095,detail="配置纠正关联原记录，原失败原因、最新结果及处理历史分开；原型不保证全部动作已有统一审计。")
a["height"]=1350
a["groups"].append(group("呼入路由接口适配",30,1120,1130,190))
node(a,"inbound-rules","呼入路由适配","创建 · 更新 · 查询 · 启停 · 删除",60,1180,status="documented",refs=(350,351,352,353,354,"DOC-355","DOC-356","DOC-357"),role="序列化目标、优先级、状态及分号条件；兼容返回路由包装及资源列表。",rules=("routerType1/2/3仅发ivrId/tel/exten，exten保留前导零。","priority账号内唯一正整数，active显式，更新name不作重命名。","CF-10仅未定义匹配与归属；失败未知保留原操作，不盲重放。"))
edge(a,"ivr-routing","ivr","inbound-rules","资源读取与目标引用",[(1130,440),(1175,440),(1175,1090),(210,1090),(210,1180)],1000,1090,refs=(350,"DOC-348","DOC-355","DOC-356","DOC-357"),detail="候选资源来自官方列表；条件解释不从样例推断。")
t["height"]=1640
t["groups"].append(group("呼入配置公开能力",30,1410,1130,190,"documented"))
node(t,"inbound-rules","呼入路由管理","ivrRouter 与条件资源",60,1470,status="documented",scope="公开接口能力",refs=(350,351,352,353,354,"DOC-358"),role="提供账号级路由创建、更新、列表、详情和删除；语音导航、电话号码或分机为目标。",rules=("这是公开接口能力分组，不声称供应商内部部署。","时间条件、中继与分机按各自列表核验，剩余匹配/归属见CF-10。"))
edge(t,"ivr-router","ivr","inbound-rules","目标及条件配置",[(1130,720),(1175,720),(1175,1380),(210,1380),(210,1470)],1020,1380,"documented",(350,351,352,353,354),"既有IVR资源可作为呼入规则目标，路由CRUD不等于流程内容编辑或版本发布。")
for v in VIEWS:
    for n in v['nodes']:
        if n['key']=='customers':n['rules']=tuple(n.get('rules',()))+("D-025客户业务快照独立于原批次单据；档案逐项汇总最近可见非空值。",)
        if n['id']=='adapter-resources':n['rules']=tuple(n.get('rules',()))+("D-022已有坐席仅query/get同步并本地分配租户，不调用create。",)


# D-026 refines existing resource responsibilities; it adds no service nodes or
# supplier topology claims. Platform NumberGrant is separate from AliCti writes.
RESOURCE_UX_RULES = {
    "overview-phone": (
        "D-026：号码开通由供应商办理；从账号查询导入已有号码不代表新增远端资源，不设本地线路管理。",
    ),
    "platform-resources": (
        "D-026：从enterpriseHotline/listPage只读查询当前账号已有号码，匹配后加入平台管理范围，不设线路登记入口。",
        "D-046 / SRC-076：NumberGrant只保存可使用号码的总部/门店authorizedTenantIds；不再维护或读取号码与技能组、坐席的绑定。",
        "导入时复核同账号唯一有效业务租户和当前角色；无业务租户或关联冲突时拒绝导入，不提供号码租户分配。",
    ),
    "platform-workbench": (
        "D-026：号码先通过NumberGrant及具体呼叫方式校验，人工外呼将本通自动所选号码传previewOutcall.obClid；bindTel是坐席接听设备。",
        "号码租户授权不代表电话上线、号码开通或呼入路由生效，也不扩大客户数据访问权限。技能与接听队列按其自身关系分配接听，预测任务另用指定坐席或外呼组。",
    ),
    "adapter-resources": (
        "D-026：enterpriseHotline/listPage是只读查询；同步已有号码只新增平台台账，NumberGrant本地使用权限不进入供应商请求。",
        "号码启停和用途另由batchUpdateNumber写入并查询核对；其addHybridGroupId/removeHybridGroupId指号码池，不能填技能组ID。",
        "新号码开通由供应商办理；D-048 / SRC-078确认停用后不再选用该号码、已发起通话正常继续；供应商账号解绑需求取消，本地使用开关独立控制后续外呼。",
    ),
    "adapter-sdk": (
        "D-026：previewOutcall.obClid决定本通向客户显示的号码；Agent.login.bindTel/bindType用于坐席接听设备，不能混用。",
    ),
    "alicti-seat": (
        "D-026：agent/update的obClidType/obClid及动态属性是坐席外显规则；skillIds/skillLevels是独立技能关系，均不是平台NumberGrant。",
        "agent/update请求表没有bindTel；登录绑定设备不能由响应模型字段反推可写参数。",
    ),
    "alicti-number": (
        "D-068 / SRC-098：listPage只读返回账号已有号码；导入自动归属账号唯一业务租户，不配置号码租户分配，不绑定技能或坐席。",
        "batchUpdateNumber的号码池绑定不是技能组绑定；新增资源由供应商开通，本地授权保存不宣称远端绑定成功。",
    ),
}
for current_view in VIEWS:
    for current_node in current_view["nodes"]:
        current_node["rules"] = tuple(current_node.get("rules", ())) + RESOURCE_UX_RULES.get(current_node["id"], ())
        if current_node["id"] == "platform-resources":
            current_node["subtitle"] = "已有号码 · 自动归属 · 坐席配置"
            current_node["role"] = "维护已开通号码台账及唯一业务租户归属；技能成员和接听队列独立维护，管理员另行维护坐席上线用软电话分机。"
            current_node["identifiers"] = ("enterpriseId", "numberId（平台）", "authorizedTenantIds", "softphoneExtension（本地）")
        if current_node["id"] == "adapter-resources":
            current_node["subtitle"] = "只读同步 · 技能写入 · 号码启停"
    for current_edge in current_view["edges"]:
        if current_edge["id"] == "platform-edge-mapping":
            current_edge["detail"] = "D-068 / SRC-098：号码导入默认归属账号唯一业务租户；不沿号码、技能和坐席推导绑定。技能成员、队列关联与号码授权各自核验，不写供应商号码绑定、不扩大跨租户可见范围。"
        if current_edge["id"] == "adapter-edge-signed-resources":
            current_edge["detail"] = "查询与修改分开：listPage读取当前账号已开号码，平台同步及NumberGrant保存不产生供应商写入；启停/外显用途才按batchUpdateNumber提交。"
        if current_edge["id"] == "alicti-edge-account-number":
            current_edge["detail"] = "按enterpriseId查询已有号码；新增开通由供应商办理，平台据查询结果同步台账。status/外显写入另用batchUpdateNumber，本地NumberGrant不属于供应商入参。"


# D-028/D-029: logical reporting responsibilities; no vendor deployment inference.
r = view("reports", "报表与线索数据链路", "报表与线索", "区分供应商累计、话单聚合与平台线索成效。", 1060, [
 group("AliCti 已公开查询能力",30,25,1130,225,"documented"),
 group("本方适配与证据",30,295,1130,225),
 group("平台聚合与授权",30,565,1130,225),
 group("业务查看与保存",30,835,1130,200)])
node(r,"cdr","分类话单","人工 · 预测 · 自动 · 呼入",60,108,status="documented",scope="公开查询能力",refs=(317,318,319,362),role="按类型读取完整原始话单，客户接听与人工桥接分开。",rules=("自动cdrAutoTask不具备人工桥接证据。","坐席分段API-361仅核对文档，未接入当前汇总。"))
node(r,"totals","任务累计","predictiveObReport",440,108,status="documented",scope="公开查询能力",refs=(365,"DOC-373"),role="查询所选任务自创建以来的官方累计。",rules=("calledCount为含重呼的次数，不是线索数。","接口不支持日期筛选；缺快照不以本地话单补齐。"))
node(r,"native","其他原生统计","日报 · 坐席 · 队列",820,108,status="documented",scope="公开查询能力",refs=(366,367,368),role="已有独立请求与解析适配，当前业务报表UI仍主要用本地话单聚合。",rules=("D-049已确认telEnterCount=队列来电接听数、telAnswerCount=进入队列来电数，两者均String；保留原键原值，不自行重算比率。",))
node(r,"facts","话单事实规范化","身份 · 接听 · 时间 · 时长",60,378,refs=(317,318,319,362),role="AliCtiReportFacts按来源解释字段，ReportMetrics按已结束及可归属证据计算。",rules=("epoch秒转毫秒，时长秒单独处理；缺失不补零。","0012与12独立；IVR接起不等于人工接听。"))
node(r,"summary","官方统计适配","AliCtiReportSummary",440,378,refs=(365,366,367,368),role="保留原始统计及查询范围，转换分钟/HH:mm:ss；合计行不重复累加。",rules=("任务累计已供任务行使用。","日报、坐席、队列纯适配器不冒充当前UI已接原生报表。"))
node(r,"business","原客户与跟进快照","批次 · 编码 · 六项业务资料",820,378,refs=(326,),role="保留原行和每通资料快照；六项业务资料仅本地保存，来源按既有property/callVariables关联。",rules=("保存后更新当前版本，失败保留输入。",))
node(r,"scope","权限与来源校验","先过滤，再计算",60,648,refs=(326,),role="从当前品牌账号与授权对象确定可用来源，详情导出重新校验。",rules=("当前账号仅统计唯一业务租户；不通过手机号、号码或品牌扩大授权。",))
node(r,"leads","线索成效聚合","LeadReport",440,648,refs=(326,),role="同品牌账号完整编码合并可见历史；首次可见导入确定日期集合。",rules=("同手机号异码独立，缺码逐行。","任务批次坐席筛选选线索，保留其其他可见历史。","未完成包含未联系；意向计划不算实际到店。"))
node(r,"views","七类报表","列表 · 筛选 · 全量导出",820,648,refs=(326,),role="分别呈现话单统计、供应商任务累计及本方线索成效。",rules=("不把次数、客户数与线索数互相替代。",))
node(r,"detail","详情与业务保存","右侧抽屉 · 返回后刷新",440,905,refs=(326,),role="线索到通话和档案子抽屉，保存当前通话快照，返回重新读已保存值并保持位置。",rules=("首保存取规范通话版本，旧表单拒绝覆盖。","客户档案仍按原手机号规则，不改变为线索主键。"))
for key,source,target,x,y1,y2,label in [("cdr-facts","cdr","facts",210,216,378,"原始话单"),("total-summary","totals","summary",590,216,378,"累计快照"),("fact-scope","facts","scope",210,486,648,"规范事实"),("lead-detail","leads","detail",590,756,905,"查看与返回")]:
 edge(r,key,source,target,label,[(x,y1),(x,y2)],x,(y1+y2)//2,refs=(326,),detail=label+"，保持身份和权限边界。")
edge(r,"business-leads","business","leads","可见原客户及跟进",[(970,486),(970,548),(590,548),(590,648)],785,548,refs=(326,),detail="线索按完整编码，业务快照按同线索最近非空值。")
edge(r,"scope-leads","scope","leads","授权后合并",[(360,702),(440,702)],400,688,refs=(326,),detail="来源权限过滤先于线索合并。")
edge(r,"leads-views","leads","views","已应用条件",[(740,702),(820,702)],780,688,refs=(326,),detail="导出全部筛选结果，不限当前页。")


edge(r,"native-summary","native","summary","独立纯适配",[(970,216),(970,278),(690,278),(690,378)],850,278,refs=(366,367,368),detail="日报、坐席和队列请求及解析适配已有，当前UI未接入原生报表。")
edge(r,"summary-views","summary","views","仅任务累计",[(740,432),(790,432),(790,600),(970,600),(970,648)],875,600,refs=(365,),detail="当前任务报表行读取官方任务累计快照；其他原生统计不混入话单聚合视图。")

# D-030–D-034: current runtime responsibilities and relationships. These nodes
# describe platform modules, never supplier deployment or verified live traffic.
p["height"]=1650
p["groups"].append(group("本人工作台、来电接听与再次联系",30,1380,1130,230))
node(p,"workbench-entry","工作台身份入口","本人关联 · 唯一入口 · 返回恢复",60,1450,refs=(326,),role="云联络中心租户运营按当前租户和账号下本人非删除坐席关联选择工作台。",inputs=("当前角色、租户、enterpriseId、本人坐席关联",),outputs=("有关联：坐席工作台；无关联：运营工作台",),rules=("D-031 / FA-143 / F-23：离线或临时停用不改变坐席工作台身份。","登录、旧首页书签及返回工作台使用同一判断；管理员沿原规则。"))
node(p,"receiving","呼入与预外呼接听","设备接听 · 边通话边记录",445,1450,refs=(303,306,318,319,326),role="核验本人工号及原通话身份，在同一工作台接收呼入与预外呼分配；预外呼精确关联原任务和客户条目。",outputs=("客户接通与人工接听证据、处理结果及业务快照",),rules=("D-030 / FA-140–FA-142 / B-66–B-70、G-32–G-35：ringingIb/ringingAgentOb 仅待接听，匹配 busyIb/busyOb 才确认人工通话。","本项目固定bindType=3，请求sipLink后等待建立事件；不开放普通电话或分机登录。","关闭仅收起；重复、迟到、取消及失败只处理匹配原通话。上线不依赖主动外呼技能选择或外显号码。","演示工具默认两个来电按钮，失败等场景收起；原型不实现自动分配或真实接听。"))
node(p,"repeat-contact","业务再次预外呼","原任务 · 追加名单 · 联系次数",830,1450,refs=(311,312,326),role="从原任务最近已接通并结束的预外呼选择客户，保持原taskId并追加批次和客户行，保留原品牌、字符串线索编码与通话来源。",ids=("sourceTaskId/sourceBatchId/sourceItemId/sourceCallId", "businessContactNo"),rules=("D-060 / SRC-090 / ADP-25 PlanRepeatPredictive / FA-144–FA-146 / C-53–C-58：本任务内按最新来源选择，人工未接听与坐席约定再联系分别标记原因；本任务业务联系次数独立于telRetryRound。","仅待启动、执行中、已暂停且供应商状态明确的原任务可追加；已结束不可重开。同任务在途、待话后保存和待执行安排防重，客户拒绝联系按客户拦截。","仅追加新批次和新执行行，原历史保留；isRepeat=0、importTelAutoStart=0，保存失败只补偿本次新增。跨任务不混选，也不重新进入任务创建向导。"))
edge(p,"entry-scope","permissions","workbench-entry","本人关联与入口",[(445,154),(390,154),(390,1350),(210,1350),(210,1450)],210,1367,refs=(326,),detail="D-031：身份决定默认且唯一工作台入口，不改变业务权限；临时离线不切换工作台。")
edge(p,"workbench-receiving","workbench","receiving","同一工作台接听",[(1130,419),(1190,419),(1190,1340),(595,1340),(595,1450)],925,1340,refs=(303,306,326),detail="D-030 / D-038：复用来电抽屉和设备接听；人工接通后可边通话边记录，挂断后确认保存。来电、客户及电话会话均须匹配，按钮请求不是接通证据。")
edge(p,"receiving-repeat","receiving","repeat-contact","再次联系",[(745,1504),(830,1504)],788,1490,refs=(326,),detail="客户接通后未由人工接听或坐席约定再联系，原通话结束且原任务未结束，通过本任务防重校验后才追加下一次联系。")
edge(p,"repeat-task","repeat-contact","tasks","原任务追加名单",[(830,1540),(790,1540),(790,490),(745,490),(745,419)],910,1408,refs=(311,312,326),detail="保持原taskId并调用importTaskTel追加新批次，isRepeat=0、importTelAutoStart=0；沿用原任务配置和调度，暂停继续先get确认2再start并回查，已结束不重开。")
edge(p,"receiving-record","receiving","records","原通话与业务结果",[(445,1540),(410,1540),(410,760),(445,760),(445,684)],515,1380,refs=(318,319,326),detail="D-038：客户接通与人工接听独立留证；通话中填写仅暂存。结束后确认正式保存处理结果及业务快照，才精确同步原任务客户行、客户档案及报表。")

a["groups"][-1]["name"]="呼入路由与来电身份适配"
node(a,"receiving","来电身份与接听适配","事件匹配 · sipLink · 设备分支",445,1180,refs=(303,306,326),scope="浏览器与平台边界",role="ADP-23 ReceiveAssignedCall 与 ADP-24 AnswerAssignedCall 对应 AliCtiReceiving；校验 offer 与状态事件，桥接本人接听意图；平台端仍需过滤企业级来源。",ids=("enterpriseId、tenantId、accountId、String cno", "contactId/callId", "taskId + customerTaskItemId"),rules=("D-030：按钮请求不作为接通证据；只有匹配 busyIb/busyOb 才推进人工接听状态。","普通电话/分机在设备接听；本地演示请求标记不代表真实工具条联调完成。","同一原通话重复事件去重；身份、任务或条目不匹配拒绝回写；刷新恢复仍保持当前工作范围。"))
edge(a,"sdk-receiving","sdk","receiving","来电与接听请求",[(198,218),(380,218),(380,1100),(595,1100),(595,1180)],595,1120,refs=(303,306),detail="CTILink 事件经身份匹配进入工作台；软电话请求及普通设备接听分开，媒体流不经业务后端。")
edge(a,"receiving-identity","reconcile","receiving","原通话归属",[(360,979),(405,979),(405,1234),(445,1234)],360,1110,refs=(303,326),detail="企业、当前租户与本人 cno 完整匹配，预外呼精确定位任务/客户条目，不能用同号码跨批次推断。")
edge(a,"receiving-outcome","receiving","availability","接听结果或待核对",[(745,1234),(790,1234),(790,1035),(980,1035),(980,1033)],980,1095,refs=(303,306,326),detail="接听失败可重试，取消、超时和迟到事件不伪造人工接通；只更新匹配的原来电。")

CONSOLIDATED_RULES={
 "platform-resources":("D-046 / SRC-076（承接D-033查询导入）/ FA-147–FA-148 / J-25–J-30：当前账号查询号码→完整号码/启停筛选→跨页多选→本地使用方向→复查并持久保存→设置可使用号码的总部/门店，不配置技能或坐席。","启用和停用都可导入；完整保留 raw status、numberType 和外显属性，停用不因导入或授权而启用。提交前属性变化则重查；存储失败整批不新增，刷新恢复号码及导入记录。"),
 "adapter-resources":("D-033：listPage 返回原始字段，导入只写平台台账。保存前按所选完整号码复查；不调用供应商号码创建、用途修改或绑定接口。",),
 "alicti-number":("D-033：当前账号的已开通号码可查询并纳入本地管理；本地使用方向和使用范围不改写供应商 status 或外显属性。",),
 "alicti-phone":("D-030：ringingIb/ringingAgentOb、busyIb/busyOb 与 sipLink 为公开事件/操作依据；本方模块承担权限和原通话关联，不推断供应商内部调度服务。",),
 "platform-business-info":("D-034 / FA-112、FA-113 / I-13、I-14、K-20、K-30、K-32：plannedStoreName 为选填文本，不要求门店租户存在；改名/清空移除旧 plannedStoreId，仅名称未变时保留历史 ID。","通话快照和客户档案逐项汇总最近可见非空值；新名称不建立门店授权，不改变原通话归属。"),
 "reports-business":("D-060：同一任务新增联系行保留品牌、字符串线索编码及原任务/批次/条目/通话；本任务业务联系次数独立，不改写供应商重呼轮次。","D-034：plannedStoreName 独立文本快照，名称改变时清理历史 ID，不把文本转成租户关联。"),
 "reports-leads":("D-060：仅本人安排及本人可见通话精确关联来源参与运营报表，不扩大他人名单可见范围；再次联系不新增任务。","D-034 / FA-133、FA-134：计划到店门店按名称显示与文本包含筛选；多任务同线索汇总保留全部授权可见历史。"),
}
for current_view in VIEWS:
    for current_node in current_view["nodes"]:
        current_node["rules"]=tuple(current_node.get("rules",()))+CONSOLIDATED_RULES.get(current_node["id"],())
        if current_node["id"]=="platform-resources":
            current_node["subtitle"]="账号号码导入 · 自动归属 · 坐席"
            current_node["role"]="先从当前 AliCti 账号查询和多选已有号码，再设置本地使用方向，保留原始状态导入时默认归属账号唯一业务租户。"
        if current_node["id"]=="platform-business-info":current_node["subtitle"]="六项选填 · 门店文本 · 当次快照"
        if current_node["id"]=="alicti-phone":current_node["role"]="提供坐席上线、人工外呼、来电通知、接听请求和通话状态事件；本方按身份与设备方式接入。"

# D-036/D-037/D-039: account maintenance, read-only details and separate tenant entry.
# API-301 only anchors enterpriseId/signing; it is not account-maintenance CRUD.
p["height"] = 1900
p["groups"].append(group("AliCti 账号维护 · 当前原型", 30, 1650, 1130, 210))
node(p, "account-directory", "本地账号目录", "登记 · 编辑 · 启停 · 配置留痕", 60, 1720,
     refs=(301,), scope="当前原型 · 本地",
     role="仅超级管理员登记已由 AliCti 提供的账号；维护名称、账号 ID、客户或品牌、凭据配置标记与备注。",
     ids=("configId", "enterpriseId", "brandCustomerName", "revision / version"),
     outputs=("只读账号资料与关联租户；另由列表保存资料、状态与配置审计",),
     rules=("D-036 / D-037 / D-039 · FA-149–FA-152、FA-157 · A-15–A-18、A-24–A-27 · SC-216 / SEQ-216：本地新增不调用供应商账号创建、开通或停机接口。",
            "账号 ID 和客户/品牌首次保存后固定；无服务区域，无真实密码或 token 输入。凭据标记与启用状态均不代表真实连接已核验。",
            "账号列表保留新增、编辑与启停；查看和关联数量各自打开单层只读抽屉，不从详情创建或管理租户、编辑启停或切换使用账号。",
            "账号目录与配置审计一次持久写入；失败不发布，目录修订和对象版本阻止旧表单覆盖；只读查看不写配置审计。"))
node(p, "account-scope", "租户管理与账号选择", "表单选账号 · 授权 · 顶部切换", 445, 1720,
     scope="当前原型 · 本地",
     role="通过独立租户管理新建或维护总部、门店租户，在表单选择已启用账号；跨账号创建成功后显示目标账号租户列表，另可从顶部选择使用范围。",
     inputs=("已启用账号目录", "租户成员与角色授权"), outputs=("当前账号、租户与云联络中心使用范围",),
     rules=("D-039 / SRC-071：新增和维护租户统一从租户管理进入，账号详情及关联清单均不提供管理入口；空账号仍可创建首个租户；跨账号创建须通过现有上下文保护，成功后显示目标账号租户列表。已有业务数据的租户不能迁移账号。",
            "未保存内容、在途通话与话后待保存阻止切换；同账号选择不重置页面或未保存输入。",
            "本地停用后超管保留账号管理入口；全部停用也可登录恢复。普通用户不能管理或跨账号读取。"))
node(p, "account-history", "只读关联与历史归属", "租户清单 · 原归属 · 历史保留", 830, 1720,
     scope="当前原型 · 只读",
     role="账号详情和关联数量只读展示已关联租户；坐席、号码、任务及通话在各自模块按原账号和租户归属查询，停用不清除历史。",
     rules=("关联数量直接打开租户清单，零关联显示空状态；不进入账号详情后再层层管理。查看和关闭不改变当前账号。",
            "不通过相同号码或品牌名称扩大范围；历史记录保持原账号与租户归属。",
            "本地停用仅限制新的平台业务操作，不发送远端任务结束或挂断请求，不承诺供应商在途任务停止。"))
edge(p, "account-tenant", "account-directory", "account-scope", "关联使用", [(360, 1774), (445, 1774)], 403, 1760,
     detail="账号先保存，再从独立租户管理表单选择启用账号并另次保存关联；不是账号详情中的管理跳转。租户创建失败时已登记账号保留。")
edge(p, "account-history", "account-scope", "account-history", "归属核验", [(745, 1774), (830, 1774)], 788, 1760,
     detail="按账号和明确租户关联读取历史。租户会话快照与账号目录分别持久保存，不能宣称为跨存储事务。")
edge(p, "context-directory", "context", "account-directory", "本地维护明细",
     [(1130, 180), (1190, 180), (1190, 1625), (210, 1625), (210, 1720)], 910, 1625,
     detail="上方身份映射使用本地账号目录；下方展开当前账号维护、使用及历史模块。真实供应商访问仍经独立接口适配。")

a["height"] = 1630
a["groups"].append(group("本地原型与生产接入边界", 30, 1370, 1130, 215))
node(a, "local-directory", "本地目录与恢复", "先账号后租户 · 版本 · 跨标签", 60, 1440,
     scope="当前原型 · 已实现",
     role="AliCtiAccounts 在 AppState 之前恢复本地目录，随后恢复本标签的租户、成员和工作范围。",
     ids=("alicti-accounts-v1", "revision / version"),
     rules=("D-037 · FA-153–FA-154 · A-20–A-21 · SC-217 / SEQ-217：在 Web Locks 独占锁内复核权限、会话、目录修订、对象版本及写入前原值；账号和配置审计同一快照提交。",
            "storage 事件只同步账号目录；租户、成员与业务快照不因此跨标签同步。失败不发布，损坏或倒退目录不自动覆盖。",
            "当前仅存配置状态，无真实 token、远端请求或供应商账号管理接口。"))
node(a, "backend-config", "受控配置与凭据", "后端鉴权 · 数据库 · 凭据引用", 445, 1440,
     refs=(301, 302), scope="生产设计 · 未接入",
     role="生产开发需将账号目录、权限复核、并发版本和事务落实到后端；长期凭据由服务端受控保管并按账号引用。",
     inputs=("账号元数据与已授权调用意图",), outputs=("受控服务端账号配置与凭据引用",),
     rules=("这是开发责任边界，当前原型没有该后端、凭据库或真实密钥写入。",
            "API-301 / API-302 只说明既有接口鉴权；不是供应商账号创建、开通或管理接口。",
            "当前无服务区域字段；真实部署地址与鉴权接入由生产环境配置，不能由演示账号保存推定。"))
node(a, "backend-execution", "真实供应商接入", "签名调用 · 短期登录 · 结果核验", 830, 1440,
     refs=(301, 302), scope="生产设计 · 未接入",
     role="生产适配取得受控账号及凭据后，复用上方签名、资源、任务和事件模块；以真实回执与查询结果核验连接。",
     rules=("真实 token 留在服务端；浏览器仅接收已授权的短期登录材料。",
            "账号登记、启用、凭据配置勾选及本地保存成功，均不能作为供应商验证或开通成功证据。"))
edge(a, "directory-contract", "local-directory", "backend-config", "开发交接", [(360, 1494), (445, 1494)], 403, 1480,
     detail="本地目录的字段与行为形成生产配置契约；这条线是开发交接关系，不表示原型已将资料或凭据上传后端。")
edge(a, "backend-credential", "backend-config", "backend-execution", "受控调用", [(745, 1494), (830, 1494)], 788, 1480,
     refs=(301, 302), detail="生产设计：后端核验主体和资源范围，取得对应受控凭据后签名调用；无供应商账号维护 CRUD。")
edge(a, "backend-auth", "backend-execution", "auth", "复用鉴权模块",
     [(1130, 1494), (1188, 1494), (1188, 164), (1130, 164)], 1080, 1330,
     refs=(301, 302), detail="生产签名与短效鉴权由既有上方模块承担；下方仅展开本地原型到生产接入的边界。")

for current_view in VIEWS:
    for current_node in current_view["nodes"]:
        if current_node["id"] == "overview-shared":
            current_node["subtitle"] = "账号目录 · 租户 · 角色 · 授权"
            current_node["rules"] += ("D-036 / D-037：当前本地账号目录仅超管维护；已登记账号与总部/门店关联，生产凭据保管和供应商调用另由适配层承担。",)
        if current_node["id"] == "platform-context":
            current_node["rules"] += ("D-036 / D-037：账号目录先于租户快照恢复；账号 ID 与品牌固定，展示名称可修改。空账号与全部停用账号均保留超管配置或恢复路径。",)
        if current_node["id"] == "platform-resources":
            current_node["rules"] += ("D-035：超管维护服务类型，管理员维护本租户技能组；同类型可建多组，组名在租户内唯一。原型本地保存与供应商创建结果分开。",)
        if current_node["id"] == "alicti-account":
            current_node["rules"] += ("D-036 / D-037：账号由供应商提供；本方账号目录新增、编辑和启停不是 AliCti 对外账号管理、开通或停机能力。",)

# D-040/D-041: tenant-owned queue configuration and independent predictive strategy.
# Prototype snapshots remain separate from future authenticated supplier calls.
p['height'] = 2180
p['groups'].append(group('接听队列与预测分配 · 当前原型', 30, 1910, 1130, 225))
node(p, 'queue-config', '队列独立管理', '新增 / 关联 · 策略 · 等待设置', 60, 1980,
     refs=(377, 378, 379, 380), scope='当前原型 · 模拟配置',
     role='AliCtiQueues 在企业账号和租户下保存队列；队列管理为坐席与技能组中的独立页面，超级管理员维护当前账号范围，租户管理员维护本租户队列；查看入口保持只读。',
     ids=('enterpriseId', 'tenantId', 'physicalGroupId', 'String qno', 'alicti-queue-bindings-v1'),
     rules=('D-045 / SRC-075 / FA-158–FA-168 / F-26–F-27 / H-20–H-31 / SC-218、SEQ-218：一个企业账号对应0或1个总部/门店业务租户，内置超级租户除外，一队列可关联本租户多个技能组；当前每技能组最多关联一个队列，不跨租户；不新增购买订阅关系。',
            '关联已有支持多选技能，按差量生成queueSkill/create与delete模拟请求，保留原skillLevel。新增/修改构造官方字段模拟请求，真实调用留给生产后端；qno保留String，不得修改编号。',
            '队列目录与关联同一版本化快照保存，复核范围、revision和写前原值；失败不发布，损坏原文不覆盖。顺序检查不是跨标签独占事务。',
            '已发布呼入引用或在途通话保护更换/解绑；解除技能关联构造queueSkill/delete模拟请求，不调用queue/delete删除队列，不改providerQueueNo或历史话单。'))
node(p, 'queue-check', '队列技能与成员核对', '多技能集合 · 独立实际名单', 445, 1980,
     refs=(380, 382, 'DOC-342'), scope='当前原型 · 独立样例',
     role='沿用技能组和坐席成员管理；分别对比平台有效成员、供应商队列技能映射和实际队列成员，展示差异与核对时间。',
     inputs=('平台有效成员及预期技能 ID', '独立 queueSkills 与实际 cno 快照'), outputs=('核对状态、缺少/多余成员、checkedAt 与指纹',),
     rules=('SC-219 / SEQ-219：全部关联技能映射必须已知且与完整queueSkills集合相符，双方空名单不能代替技能关联核对；保留skillLevel，不推测匹配阈值。',
            'cno按原String比对，0012与12独立；未知或跨租户坐席仅显示受限数量，不泄露其他租户身份。',
            '核对不自动改供应商技能或名单；平台成员或队列快照变化使指纹失效。成员一致不证明路由配置、上线或真实接听已通过。'))
node(p, 'predictive-strategy', '预测任务坐席分配', 'callStrategy · 独立任务配置', 830, 1980,
     refs=(311,), scope='当前原型 · 任务字段',
     role='在接听团队配置的折叠设置选择预测任务坐席分配方式；配置、模板、复制、确认和启动快照保持一致，原任务再次联系沿用现值。',
     rules=('D-041 / SRC-073 / FA-169 / C-59–C-62：String1随机、2按顺序、3距离上次通话结束最久、4当前空闲时间最长；新建默认4，缺字段须重新选择，不能提交。',
            '与queue.strategy、weight独立，不覆盖cnos或重呼规则。队列未关联不新增预测启动阻断；自动IVR不展示、不提交callStrategy。'))
edge(p, 'tenant-queue', 'account-scope', 'queue-config', '账号及租户范围', [(595,1828),(595,1890),(210,1890),(210,1980)], 385,1890,
     detail='一个企业账号仅0或1个业务租户，内置超级租户除外；队列通过多个技能组关联成员，本地权限不等于供应商自动租户隔离。')
edge(p, 'queue-check', 'queue-config', 'queue-check', '保存后再核对', [(360,2034),(445,2034)], 403,2020,
     refs=(380,382,'DOC-342'), detail='本地绑定或模拟配置保存成功只标待核对；技能映射与实际成员各自验证，不伪造同步完成。')
edge(p, 'strategy-task', 'predictive-strategy', 'tasks', '任务字段贯通', [(1130,2034),(1190,2034),(1190,282),(595,282),(595,365)], 995,1890,
     refs=(311,), detail='预测任务独立callStrategy贯通创建、模板、复制和启动快照，原任务再次联系沿用现值；不把queue.strategy或队列优先级直接赋给任务。')

a['height'] = 1920
na_group=group('队列契约与核对 · 当前模拟 / 生产目标分开',30,1640,1130,235)
a['groups'].append(na_group)
node(a, 'queue-contract', '官方队列字段契约', 'create / update · list / get',60,1720,
     refs=(377,378,379,380), scope='当前纯适配 · 无网络',
     role='AliCtiQueueContracts 校验完整新增必填字段、部分更新和查询返回；AliCtiQueues将合法字段封装为simulation请求并本地保存。',
     rules=('新增必须有queue与queueSkills；真实providerSkillId或独立demoSkillId明确区分，本地SG-*不冒充供应商技能ID。',
            'strategy六个官方枚举；weight1–10值越大优先；排队20–600秒、应答20–60秒、整理3–3600秒、最大等待0–999且0不限。',
            'queue/update仅发送明确变化字段，省略queueSkills保留，提供则全量替换。retry是换下一坐席间隔，不是客户重呼。',
            '完整默认参数来源区分官方默认和本地配置选择；不宣称所有缺省值由供应商保证。'))
node(a, 'queue-reconcile', '技能与成员查询核对', 'queueSkills + agent/query?qno',445,1720,
     refs=(380,382,'DOC-342'), scope='生产目标 · 原型读样例',
     role='开发应回读队列技能与完整实际坐席列表，在当前租户范围内与平台有效成员比对；原型使用相互独立的供应商样例。',
     rules=('queue/get解析data.queue及data.queueSkills；queue/list最多500条一页；agent/query按start/limit分页读取data.agents。',
            '不得将本地成员复制为供应商返回，也不得用一页结果宣称全部成员一致；未知及跨租户身份受限展示。',
            '技能ID匹配与成员匹配分别成立，核对时间/指纹不代表呼入路由或真实接听已验证。'))
node(a, 'queue-execution', '队列真实接入边界', '后端授权 · 签名 · 回读验收',830,1720,
     refs=(301,377,378,379,380), scope='生产设计 · 未接入',
     role='开发后端按已授权enterpriseId签名调用，维护租户资源归属、并发版本、操作记录并回读供应商结果。',
     rules=('当前浏览器没有供应商写操作；真实网络请求、服务端事务和超时未知结果处理属于开发验收。',
            '本地解绑不是queue/delete；本期无远端删除队列入口，多技能关联已采用queueSkill增删模拟请求，公开端点存在不代表产品已开放。',
            'ivrRouter仍按IVR/电话/分机目标；不补造直接qno目标字段，也不推断供应商内部调度拓扑。'))
edge(a,'queue-contract-check','queue-contract','queue-reconcile','字段与核对依据',[(360,1774),(445,1774)],403,1760,
     refs=(377,378,380,382),detail='纯字段契约与独立技能/成员核对分别维护；写请求合法不代表供应商已生效。')
edge(a,'queue-dev-handoff','queue-reconcile','queue-execution','开发接入验收',[(745,1774),(830,1774)],788,1760,
     refs=(380,'DOC-342'),detail='当前独立模拟样例形成验收场景，开发需以授权真实查询证明结果；不直接部署浏览器存储作为生产资源真相。')
edge(a,'queue-auth','backend-execution','queue-execution','复用受控调用',[(980,1548),(980,1720)],980,1610,
     refs=(301,377,378),detail='后端取受控账号凭据并签名；前端只发送授权业务意图，供应商账号仍由企业ID映射确定。')

t['height'] = 1930
t['groups'].append(group('接听队列公开能力 · 对象关系',30,1660,1130,225,'documented'))
node(t,'queue','队列配置与查询','queue/create / update / list / get',60,1735,
     status='documented',scope='公开接口能力',refs=(377,378,379,380,381),
     role='官方管理队列编号、名称、分配策略、优先级和等待相关参数；原型使用新增、修改与查询契约，删除不开放。',
     ids=('String qno','queue.strategy','weight'),
     rules=('qno保留原String且账号内区分；文档未建立额外位数范围。六种分配策略与任务callStrategy不同。',
            'weight1–10数值越大队列优先级越高；不据此推测多个队列竞争的全部内部算法。'))
node(t,'queue-skills','队列与技能关联','queueSkills / queueSkill',445,1735,
     status='documented',scope='公开对象关系',refs=(377,378,382,383,384,385),
     role='通过skillId与skillLevel关联队列技能；新增时传queueSkills，另有技能关系增改查删接口。',
     rules=('关联设置按技能差量生成create/delete模拟请求；更新队列省略queueSkills不改变技能，提供数组则全量替换。',
            '未发现直接以cnos写入队列的依据；当前一技能组最多关联一个队列是产品约束，一队列可关联多个技能组，不是供应商固有租户模型。'))
node(t,'queue-members','队列实际坐席查询','agent/query · qno · data.agents',830,1735,
     status='documented',scope='公开查询能力',refs=('DOC-342',382),
     role='按队列号读取实际坐席并完整分页，供本方与有效成员和技能映射独立核对。',
     rules=('agent技能和queue技能关系是对象关联；本图不宣称供应商内部同步机制或实际调度已经联调。',
            '本地成员一致不替代工具条上线、队列状态、呼入路由与实际接听验证。'))
edge(t,'queue-skill','queue','queue-skills','队列引用技能',[(360,1789),(445,1789)],403,1775,
     'documented',(377,378,382),'queueSkills及queueSkill接口描述技能关系，不是直接编辑坐席名单。')
edge(t,'queue-agent','queue-skills','queue-members','实际结果另查',[(745,1789),(830,1789)],788,1775,
     'documented',('DOC-342',382),'平台应查实际qno成员，不由技能ID或本地名单推断供应商同步完成。')
edge(t,'skill-queue','skill','queue-skills','skillId 对象关联',[(745,449),(780,449),(780,1640),(595,1640),(595,1735)],605,1638,
     'documented',(309,382),'坐席技能与队列技能以供应商skillId关联；tenantId与本地physicalGroupId由平台维护，非该供应商字段。')

QUEUE_CURRENT_RULES={
 'overview-shared':('D-068：enterpriseId仅0或1个业务租户，内置超级租户除外；队列、多技能关系与租户权限继续由本方维护。',),
 'platform-resources':('D-040：队列管理作为坐席与技能组下独立页面，技能组列表只展示关联；队列支持多选技能及只读详情；租户管理员可新增、关联、修改、核对、解除本租户队列，只见本租户候选。基础组/成员编辑与队列维护分开。',),
 'platform-tasks':('D-041：预测任务独立String callStrategy1–4，新建4，缺字段须重新选择；队列策略或优先级不覆盖该字段，自动IVR不提交。',),
 'adapter-tasks':('D-041：配置、模板、复制、确认和启动快照保留callStrategy，原任务再次联系沿用现值；非法值阻止提交，不扩大cnos成员范围。',),
 'alicti-task':('callStrategy为预测任务专用分配参数，与queue.strategy/weight独立；本方新建默认4、缺字段须重新选择，不改变供应商历史。',),
 'reports-native':('D-040：新增队列配置不意味着原生队列报表已接入；保留独立统计适配和现有报表口径，不回写历史providerQueueNo。',),
}
for current_view in VIEWS:
    for current_node in current_view['nodes']:
        current_node['rules']=tuple(current_node.get('rules',()))+QUEUE_CURRENT_RULES.get(current_node['id'],())
        if current_node['id']=='alicti-skill':
            current_node['rules']=tuple('skillIds=0清空；skillLevels数值较小技能等级较高，接听分配仍按具体场景策略。' if x=='skillIds=0 清空；skillLevels 数值较小优先级高。' else x for x in current_node['rules'])


# D-042 runtime capabilities are an explicit increment over the frozen function map.
p['height']=2440
p['groups'].append(group('本人坐席运行与独立班长权限',30,2180,1130,225,'platform','D-042 · 电话接待状态与业务保存分别处理；原型仅本地模拟'))
node(p,'seat-runtime','本人电话运行','上线 / 暂停恢复 / 完全退出',60,2250,
     refs=(302,303,304,306),scope='本方运行编排',role='本人在当前账号和租户具有有效坐席即可操作；维护独立电话presence，统一软电话，工作模式由本人单选0/4/5，不用ADMIN角色代替资格。',
     inputs=('已核验本人enterpriseId、tenantId、accountId、String cno','本次登录选择的工作模式与状态'),outputs=('有本次回执依据的电话会话和操作状态',),
     rules=('D-046 / SRC-076 / D-072：login固定bindType3，workingMode每次由本人在登录面板单选0/4/5后直接提交；bindTel取管理员维护的本地软电话分机，缺失或读取失败拒绝上线，不根据工号、手机号或外显号码推算。本人设置loginStatus1/2，置忙原因选填。',
            '普通退出固定logoutMode=1、removeBinding=0，保留坐席与接听分机绑定；成功前不释放；暂停/整理/pending不接新来电不拨号。',
            'D-071：登录后工具条直接显示模式下拉，在线即时调用changeWorkingMode切换；置忙可切换，通话、振铃、话后整理及未知结果期间拒绝并保留原模式。模式4不接受预测分配、模式5禁用预览外呼入口；呼入不受模式限制是本地假设，见CF-16。不开放设备切换，changeBindTel直接调用拒绝。'))
node(p,'seat-business','业务保存与话后整理','已保存记录不被电话失败回滚',445,2250,
     refs=(304,305,306),scope='本方状态边界',role='通话中输入按原草稿保存；本通结束后正式提交业务，再独立完成电话整理。',
     inputs=('已结束通话和正式业务提交结果',),outputs=('保持已存业务与独立电话整理结果',),
     rules=('prolongWrapup仅整理且30–600秒；失败保留原期限，与队列默认3–3600不同。',
            'completeWrapup是本方编排，采用pause；成功保持paused，用户显式unpause成功才ready。',
            '工作台phase=idle不等于电话ready；暂停、恢复或延时失败不能回滚已保存跟进。'))
node(p,'seat-monitor','班长队列监控','独立权限 · 本租户授权队列',830,2250,
     refs=(304,'DOC-395'),scope='本方授权与展示',role='租户管理员在坐席工作台班长监控页签查看本租户授权队列与坐席，并管理置忙、置闲、下线；供应商班长权限独立核验。',
     inputs=('供应商班长证据与本租户队列归属','选定qnos及fields'),outputs=('范围过滤后的监控结果',),
     rules=('本地策略将有效租户管理员坐席配置power=1；仍须供应商班长资格确认，队列维护与实时监控分别核验。',
            '展示queueEntryCount排队人数；其他queueParams响应保留，本页不展开；QueueParam统计仅呼入，wrapupTime为平均整理时长。',
            'QueueEntry采用customerNumber与joinTime；waitTime未说明单位，不据此计算秒数。'))
edge(p,'seat-runtime-business','seat-runtime','seat-business','话务与业务独立',[(360,2304),(445,2304)],402,2290,refs=(304,306),detail='已保存业务不会因为后续pause或unpause失败而删除或重新要求提交；同一电话会话保留待恢复。')
edge(p,'seat-runtime-monitor','seat-business','seat-monitor','另验班长资格',[(745,2304),(830,2304)],788,2290,refs=(304,),detail='个人电话权限不会授予监控他人的权限；必须核验供应商班长资格与本租户队列。')
edge(p,'workbench-runtime','workbench','seat-runtime','本人电话操作',[(1130,419),(1175,419),(1175,2150),(210,2150),(210,2250)],620,2140,refs=(302,304,306),detail='SC/SEQ-220/221与CAP-SEAT-01～09作为FS-12/DEV-12新增运行能力；旧82功能编号不代替本轮验收。')

a['height']=2200
a['groups'].append(group('坐席运行契约与回执边界',30,1920,1130,240,'platform','ADP-30～32 · 模拟传输与生产SDK接入明确分开'))
node(a,'seat-commands','本人坐席命令适配','ADP-30 · 参数校验与单命令提交',60,2000,
     refs=(302,303,304,306),scope='本方SDK适配',role='校验login/logout/pause/unpause/prolongWrapup/changeWorkingMode参数，登录固定软电话3、工作模式本人单选0/4/5，短期鉴权材料仅内存。',
     inputs=('当前可信本人坐席上下文与明确操作',),outputs=('采用的SDK请求及结果证据',),
     rules=('D-072：每次普通登录都由本人当次选择工作模式0/4/5及登录状态，未选模式不能提交且无默认模式隐式提交；分机由SeatPhoneConfig按完整坐席身份读取，提交前重验配置版本。旧设备/绑定号码偏好不改变登录；登录逗号多值不作为产品选择暴露。',
            'unpause不附业务参数；completeWrapup不是自造SDK命令。',
            'changeWorkingMode单值必选，登录后工具条即时切换，置忙可切，通话/振铃/整理/未知拒绝且保留原模式；changeBindTel不开放且不发请求。Agent/AgentTask命名差异不阻断本项目。'))
node(a,'seat-receipts','请求与回执关联','operationId / scope / cno / reqType',445,2000,
     refs=(304,306),scope='本方一致性保护',role='单操作pending，核对回执归属和明确成功码后才改变电话态；未知结果需查证，不自动重放。',
     outputs=('成功、失败、未知或陈旧结果','原电话态与已保存业务保持'),
     rules=('缺code、未知code、错reqType、旧会话或旧范围回执不能应用到当前对象。',
            '失败保留已确认设置和整理期限；陈旧回执不能清除新操作pending。',
            '原型请求与回执mock:true且不执行真实SDK；开发目标需要真实传输与事件核验。'))
node(a,'seat-monitoring','班长监控结果过滤','ADP-32 · queueStatus',830,2000,
     refs=(304,'DOC-395'),scope='本方授权适配',role='查询前核验独立班长权限与当前租户qnos；按官方数据类型读取并再次过滤范围。',
     inputs=('qnos原字符串逗号连接','显式fields白名单'),outputs=('授权队列、可验证坐席与排队记录',),
     rules=('fields只含queueParams/agentStatuses/queueEntries；空选择或非法字段拒绝。',
            '未知或跨租户队列、坐席、通话隐藏，不能由同enterpriseId扩大范围。',
            '失败不以旧数据显示新刷新成功；本期不增加监听、强插、转移等能力。', 'DOC-395：setOffline返回示例的reqType写作setPause，与方法名不一致；实际返回关联须供应商澄清，详见CF-11。'))
edge(a,'seat-request-receipt','seat-commands','seat-receipts','等待匹配回执',[(360,2054),(445,2054)],402,2040,refs=(304,),detail='完整退出也等待明确成功才释放；未知结果需独立查询核验。')
edge(a,'seat-scope-monitor','seat-receipts','seat-monitoring','逐层范围过滤',[(745,2054),(830,2054)],788,2040,refs=(304,),detail='请求被接受不代表可展示任意队列或成员；供应商权限与本方租户边界同时满足。')
edge(a,'sdk-seat-commands','sdk','seat-commands','电话运行增量',[(60,164),(18,164),(18,1965),(210,1965),(210,2000)],222,1950,refs=(303,304,306),detail='ADP-30本人命令、ADP-31业务提交后整理编排、ADP-32授权监控对应seat-operations.json。')

t['height']=2190
t['groups'].append(group('工具条公开坐席运行能力',30,1930,1130,225,'documented','API-304及直属数据类型；逻辑能力不表示供应商内部部署'))
node(t,'agent-operations','本人座席操作','login / logout / pause / unpause',60,2005,
     status='documented',scope='公开工具条能力',refs=(304,),role='文档提供上线、退出、暂停与恢复参数及response返回形状。',
     rules=('logoutMode文档含0后台在线和1完全退出；本期普通退出固定logoutMode=1、removeBinding=0，不提供解除接听电话绑定选项。本地坐席分机配置不清空。',
            'loginStatus只1/2，登录原因可选；pauseType1/2和pauseDescription必填，unpause无参数。',
            '公开能力存在不等于当前静态原型已接通真实SDK。'))
node(t,'agent-settings','整理与未采用能力','prolongWrapup / 官方范围',445,2005,
     status='documented',scope='公开工具条能力',refs=(304,),role='公开设备、模式与整理能力；本项目只采用延长整理，设备/模式切换仅保留官方参考。',
     rules=('本项目prolongWrapup为30–600秒；不可套queue.wrapupTime默认3–3600；不开放changeBindTel。',
            '登录固定String0；不调用changeWorkingMode，其Agent/AgentTask命名冲突保留参考，不阻断。'))
node(t,'agent-queue-status','班长队列状态查询','queueStatus / 三类公开数据结构',830,2005,
     status='documented',scope='公开工具条查询',refs=(304,),role='班长席通过qnos、fields请求queueParams、agentStatuses和queueEntries，按队列号返回结果。',
     rules=('QueueParam统计仅呼入；wrapupTime为平均整理时长，不是默认整理配置。',
            'AgentStatus.state为公开字段；QueueEntry用customerNumber和joinTime，waitTime单位未说明。',
            '平台租户范围和班长身份需本方另验，不是供应商enterpriseId天然隔离。'))
edge(t,'agent-settings-relation','agent-operations','agent-settings','同一本人会话',[(360,2059),(445,2059)],402,2045,'documented',(304,),'这些是公开坐席操作模块方法，本图不推断供应商内部服务调用顺序。')
edge(t,'agent-supervisor-relation','agent-settings','agent-queue-status','班长能力另授权',[(745,2059),(830,2059)],788,2045,'documented',(304,),'queueStatus仅班长席可用，与本方管理角色和队列配置权限不是同一概念。')
edge(t,'login-agent-operations','login','agent-operations','短期材料与原工号',[(1130,164),(1175,164),(1175,1900),(210,1900),(210,2005)],620,1888,'documented',(302,304),'先取得短期sessionKey再按原String工号登录；鉴权成功不代表设备话路和班长权限已验证。')

SEAT_CURRENT_RULES={
 'platform-workbench':('D-042：新增本人电话操作CAP-SEAT-01～09，SC/SEQ-220/221。presence与phase分开，保存业务不自动ready；完成整理保持暂停，显式恢复成功才接待。',),
 'adapter-sdk':('D-042 / D-071：AliCtiSeatOperations只构造本地SDK模拟请求和回执；真实软电话、权限及事件需CF-11联调；changeWorkingMode的Agent/AgentTask命名差异不阻断。',),
 'platform-incoming':('D-042 / D-071：来电须同时满足本人电话ready、无pending及无业务占用；呼入不受工作模式限制是本地假设，见CF-16；模式不是呼入开关。',),
}
for current_view in VIEWS:
    for current_node in current_view['nodes']:
        current_node['rules']=tuple(current_node.get('rules',()))+SEAT_CURRENT_RULES.get(current_node['id'],())



# 2026-09-19 regression: current runtime facts, separate from supplier deployment.
CURRENT_ALIGNMENT_RULES = {
 'platform-resources': ('号码管理位于系统管理；从当前AliCti账号查询并多选导入已有号码，只设置方向与使用范围，不登记或选择线路。供应商trunkGroupKey保留只读原值。',),
 'platform-workbench': ('外呼坐席与班长监控采用页签，切换不丢通话和记录草稿；本租户管理员未关联本人坐席也能进入班长监控查看只读内容，电话上线与队列管理另验关联坐席。', '人工外呼外显号码与技能选择解耦，按当前账号、租户授权、启停和预览用途过滤。'),
 'platform-tasks': ('预测任务名单支持列表直接文件导入，经字段映射、预检、确认及task/import；自动外呼仍走导入与分配。导入不自动启动。', '接听范围可选指定坐席callGroupType=1/cnos或独立外呼组callGroupType=2/agentGroup；外呼组不是技能组或接听队列。'),
 'platform-queue-config': ('D-043：等待设置包含retry/serviceLevel，语音设置包含musicClass/sayAgentno/固定与位置播报，高级设置含vipSupport和joinEmpty；开启条件时必填文件、频率或至少2人数阈值。', 'D-044：缺字段按空值要求补齐，不做旧记录迁移；maxPauseAgent及announcePositionYouarenext本期未开放。'),
 'adapter-queue-contract': ('joinEmpty按1/2/4/8/16多选位相加0～31；announceSound=1必填周期与文件，announcePosition=1/2必填不少于2的人数阈值；字段契约与条件校验以归档官方文档为准。',),
 'platform-seat-monitor': ('班长管理仅本租户授权队列内其他有效坐席；最新状态下置忙/置闲/下线，通话振铃整理中不可强改；不提供管理上线。',),
 'adapter-seat-monitoring': ('管理通过CTILink.Monitor.setPause/setUnpause/setOffline，monitoredCno原String，setOffline固定removeBinding=0；匹配回执后回查，不乐观更新，不泄露跨租户数据。',),
 'alicti-agent-queue-status': ('工具条班长管理采用Monitor.setPause/setUnpause/setOffline；本项目不采用管理上线。',),
}
for current_view in VIEWS:
    for current_node in current_view['nodes']:
        current_node['rules']=tuple(current_node.get('rules',()))+CURRENT_ALIGNMENT_RULES.get(current_node['id'],())
        if current_node['id']=='platform-seat-monitor':current_node['subtitle']='工作台页签 · 监控与管理'
        if current_node['id']=='adapter-seat-monitoring':current_node['subtitle']='queueStatus · Monitor 管理'
        if current_node['id']=='alicti-agent-queue-status':current_node['subtitle']='queueStatus / Monitor'

p['height']=2710
p['groups'].append(group('外呼组与技能提交 · 当前原型',30,2450,1130,220))
node(p,'outbound-groups','外呼组独立管理','组资料 · 坐席成员 · 预测选用',60,2520,refs=(311,386,387,388,389,390,391,392,393,394),scope='本方管理与任务映射',role='外呼组管理为坐席与技能组下独立页面，按企业账号和租户维护资料及成员，选用时形成预测任务快照。',rules=('SC/SEQ-222：指定坐席和外呼组二选一，任务分别使用cnos和agentGroup；不以qno或本地技能ID代替gno。','本地模拟请求不证明真实供应商组已经创建，生产按API-386～394回读；同一坐席只在一个外呼组，重新分配会移组，需保护原组和目标组在途引用。'))
node(p,'pending-skills','在线新增技能待提交','保留现有技能 · 下线后手动提交',445,2520,refs=(309,),scope='本地交互与公开限制',role='在线仅追加新技能时保存待生效/待提交；坐席正常下线后管理员手动提交全量技能，成功才生效。',rules=('SC/SEQ-223：20023座席状态在线是官方限制；更改原技能等级、移除或实际提交仍须下线。','当前没有通话中改等级待生效或下线自动提交机制。failCno按原String逐席核验，失败保留原配置。'))
node(p,'direct-task-import','预测任务直接导入','文件 · 预检 · 确认 · task/import',830,2520,refs=(312,),scope='本地导入交互',role='在预测任务列表打开导入客户抽屉，选择文件并映射字段，先预检再确认保存及提交名单。',rules=('同账号租户与当前任务、来源批次绑定，空值或无效行按预检处理；导入不自动启动。','自动外呼仍通过导入与分配添加客户，不扩大直接入口。'))
edge(p,'outbound-task','outbound-groups','tasks','外呼组号与成员快照',[(210,2520),(8,2520),(8,267),(595,267),(595,365)],385,266,refs=(311,),detail='callGroupType=2使用agentGroup；独立于接听队列和预测任务callStrategy。')
edge(p,'pending-effective','pending-skills','resources','下线提交后生效',[(595,2520),(1185,2520),(1185,684),(1130,684)],1065,2428,refs=(309,),detail='在线追加仅本地暂存，提交接口仍按全量替换与逐工号结果确认。')


a['height']=2460
a['groups'].append(group('外呼组适配 · 公开契约与本地保护',30,2210,1130,220))
node(a,'outbound-contract','外呼组资料与成员适配','agentGroup · 九项接口',60,2280,refs=tuple(range(386,395)),scope='公开契约 · 本地模拟',role='按组资料增改查删与分配、移出、成员查询、坐席所属组查询分别适配，保留String gno/cno。',rules=('官方返回包装分别解析，不能将本地数组包装冒充供应商响应；成功与失败回执逐操作核验。','重新分配会使坐席移动到新组，提交前同时检查原组和目标组在途任务引用；原型失败不发布。'))
node(a,'outbound-task-selection','任务接听范围适配','cnos 或 agentGroup',445,2280,refs=(311,388,393),scope='公开任务字段',role='按callGroupType构造明确接听范围，指定坐席使用cnos，外呼组使用gno对应agentGroup，并记录成员快照。',rules=('队列qno、skillId、平台组ID均不是外呼组号。callStrategy保持独立。','所选真实外呼组与成员可用性需要供应商回读；本地样例不保证真实执行。'))
edge(a,'outbound-task-contract','outbound-contract','outbound-task-selection','已核验组号与成员',[(360,2334),(445,2334)],403,2320,refs=(311,388,393),detail='组管理与任务创建的契约分别适配，不把本地保存成功作为供应商资源已存在。')
t['height']=2450
t['groups'].append(group('外呼组公开对象关系',30,2200,1130,220,'documented'))
node(t,'outbound-group','外呼组资料','gno · 名称 · 备注',60,2270,status='documented',scope='公开接口能力',refs=(386,387,388,389,390),role='公开外呼组新增、列表、详情、更新及删除，作为预测任务可引用的独立资源。',rules=('不是接听队列qno或技能skillId；本地租户范围由中台维护。',))
node(t,'outbound-members','外呼组坐席关系','分配 · 移出 · 组员/所属组查询',445,2270,status='documented',scope='公开对象关系',refs=(391,392,393,394),role='维护gno与原字符串cno关系，查询组下坐席或坐席所在外呼组。',rules=('API-391：一坐席只能存在一个外呼组，重复分配会移入新组；每组最多1000坐席，一次最多1000工号。','平台对跨租户移动和在途任务的保护是本地规则，不等于供应商自动隔离。'))
edge(t,'outbound-membership','outbound-group','outbound-members','组号与工号关联',[(360,2324),(445,2324)],403,2310,'documented',(391,393,394),'供应商外呼组关系，原String工号0012和12分别处理。')


# 2026-09-20: number authorization is tenant-only; softphone extension is local
# configuration consumed at login, never a supplier create/update property.
p['height']=2980
p['groups'].append(group('号码授权与软电话分机 · 当前原型',30,2720,1130,230))
node(p,'seat-phone-config','软电话分机配置','管理员维护 · 本人上线读取',60,2790,refs=(304,),scope='本地配置 · 公开登录入参',role='SeatPhoneConfig维护已开通分机；租户管理员维护本租户，超级管理员维护授权账号范围。',ids=('enterpriseId','tenantId','contactCenterIdentityId','String cno','softphoneExtension'),rules=('数字文本保留前导零；新增坐席可选填，后续上线必需。清空表示未配置，不以工号、手机或外显号码补值。','仅已下线、无通话或设备占用、无待确认电话及管理操作可修改；保存复核上下文、版本与跨窗口独占锁，失败原值不变。','不提交agent/create或agent/update，不创建供应商分机；本地保存不等于媒体注册或话路可用。'))
node(p,'number-grants','号码自动归属','唯一业务租户 · 技能关系独立',445,2790,refs=(310,),scope='本地使用权限',role='号码导入默认归属账号唯一业务租户；保留本地归属字段用于权限过滤，按状态、方向和外显用途核验可用性。',rules=('不选择技能或坐席，不使用旧boundSkillGroupIds；预测团队及有效成员、队列技能关联独立校验。','账号唯一业务租户须有效且开通云联络中心；归属只读展示，不再提供手动租户分配。'))
node(p,'number-references','号码业务引用','当前任务 · 当前呼入规则',830,2790,refs=(350,353),scope='本地真实对象引用',role='从当前任务快照和AliCtiInbound.numberReferences展示任务数与呼入规则数；不从退役技能绑定推算。',rules=('按当前账号唯一业务租户核对号码与呼入规则引用，未知或冲突显示待核对；不再提供号码撤权分配操作。','供应商路由是否真实生效仍须接入核验，本地引用不证明实际话路。'))
edge(p,'phone-login','seat-phone-config','seat-runtime','保存分机供本人上线',[(210,2790),(18,2790),(18,2304),(60,2304)],145,2688,refs=(304,),detail='读取当前本人完整身份的配置，缺失或失效阻止上线；bindType=3、workingMode为本人单选0/4/5、bindTel为保存的字符串分机。')
edge(p,'grants-references','number-grants','number-references','读取当前业务引用',[(745,2844),(830,2844)],788,2830,detail='号码自动归属唯一业务租户，引用只读核对，不改变技能成员、队列关系或呼入路由。')
for current_view in VIEWS:
    for current_node in current_view['nodes']:
        if current_node['id']=='platform-tasks':
            current_node['rules']=tuple(current_node.get('rules',()))+('人工、预测及自动外呼的外显号码独立按账号、租户授权、服务状态、方向和具体外显用途核验；不要求号码绑定所选技能或坐席。',)
        if current_node['id']=='adapter-seat-commands':
            current_node['rules']=tuple(current_node.get('rules',()))+('本地软电话分机与cno、obClid分别处理。bindType=3属于工具条登录枚举，不能套用REST AgentInfo的bindTelType枚举。',)
        if current_node['id']=='alicti-agent-operations':
            current_node['rules']=tuple(current_node.get('rules',()))+('login.bindTel为必填String接听电话；本项目采用本地已配置软电话分机与bindType=3，不推导额外分机创建接口。',)



for current_view in VIEWS:
    for current_node in current_view['nodes']:
        if current_node['id'] in {'platform-resources','platform-workbench','platform-tasks','platform-seat-runtime','platform-seat-phone-config','platform-number-grants','platform-number-references','adapter-resources','adapter-seat-commands','alicti-number','alicti-agent-operations'}:
            current_node['decisionId']='D-046'
            current_node['sourceRefs']=['SRC-076']
            current_node['rules']=tuple(current_node.get('rules',()))+('D-046 / SRC-076：号码当前按D-068自动归属唯一业务租户；本地软电话分机管理保留；旧号码—技能—坐席绑定不再采用，其他历史规则与公开接口原字段含义保持独立。',)



# D-047 closes the task-vs-call lifecycle question using user-relayed supplier feedback.
# It does not alter official source snapshots or claim a live integration result.
TASK_CONTROL_FEEDBACK = "D-047 / SRC-077（user_relayed_supplier_feedback）：暂停或结束只控制任务调度，未发起的首次呼叫和重呼不再发起；已发起的拨号、振铃和通话正常进行，正常话单继续归集。暂停可按get确认2→start→get继续；结束不重开，正常结果仅回补原历史与统计。本次为用户转述供应商答复，不代表官网更新或真实联调通过。"
for current_view in VIEWS:
    for current_node in current_view['nodes']:
        if current_node['id'] in {'platform-tasks','adapter-tasks','alicti-task'}:
            previous = current_node.get('decisionId')
            current_node['relatedDecisionIds'] = list(dict.fromkeys(current_node.get('relatedDecisionIds', []) + ([previous] if previous else []) + ['D-017','D-021']))
            current_node['decisionId'] = 'D-047'
            current_node['sourceRefs'] = list(dict.fromkeys(current_node.get('sourceRefs', []) + ['SRC-077']))
            current_node['sourceType'] = 'user_relayed_supplier_feedback'
            current_node['rules'] = tuple(current_node.get('rules', ())) + (TASK_CONTROL_FEEDBACK,)
    for current_edge in current_view['edges']:
        if current_edge['id'] == 'adapter-edge-pending-command':
            current_edge['decisionId'] = 'D-047'
            current_edge['sourceRefs'] = ['SRC-077']
            current_edge['sourceType'] = 'user_relayed_supplier_feedback'



# D-048 separates supplier number status from the local outbound-use switch.
NUMBER_CONTROL_FEEDBACK = "D-048 / SRC-078（user_relayed_supplier_feedback_and_scope_decision）：供应商号码停用后后续选号不再使用该号码，已发起通话正常继续。用户取消供应商账号解绑接口及查证需求，改为本地停用后不再使用该号码外呼；本地开关不解除供应商资源、不停止呼入路由、不强制挂断，历史保留。"
for current_view in VIEWS:
    for current_node in current_view['nodes']:
        if current_node['id'] in {'platform-resources','platform-number-grants','platform-number-references','adapter-resources','alicti-number'}:
            previous = current_node.get('decisionId')
            current_node['relatedDecisionIds'] = list(dict.fromkeys(current_node.get('relatedDecisionIds', []) + ([previous] if previous else [])))
            current_node['decisionId'] = 'D-048'
            current_node['sourceRefs'] = list(dict.fromkeys(current_node.get('sourceRefs', []) + ['SRC-078']))
            current_node['sourceType'] = 'user_relayed_supplier_feedback_and_scope_decision'
            current_node['rules'] = tuple(current_node.get('rules', ())) + (NUMBER_CONTROL_FEEDBACK,)
        if current_node['id'] == 'platform-number-grants':
            current_node['subtitle'] = '自动归属 · 本地使用开关'
            current_node['identifiers'] = tuple(current_node.get('identifiers', ())) + ('localEnabled（默认true）',)
            current_node['rules'] = tuple(current_node.get('rules', ())) + ('FA-183 / J-35：列表停用本地使用仅保存localEnabled；停用时本地暂停关联任务的新拨号。恢复本地使用不能绕过供应商status=0、用途或租户权限，不自动继续任务。供应商status启停在详情更多设置单独操作。',)
        if current_node['id'] == 'platform-number-references':
            current_node['rules'] = tuple(current_node.get('rules', ())) + ('本地停用保留租户授权、当前呼入规则和历史引用；呼入入口由呼入规则单独管理。暂停关联任务新拨号属于本地产品保护，不归因于供应商自动行为。',)
    for current_edge in current_view['edges']:
        if current_edge['id'] in {'overview-edge-line','alicti-edge-account-number','platform-edge-grants-references'}:
            current_edge['decisionId'] = 'D-048'
            current_edge['sourceRefs'] = list(dict.fromkeys(current_edge.get('sourceRefs', []) + ['SRC-078']))
            current_edge['sourceType'] = 'user_relayed_supplier_feedback_and_scope_decision'
            current_edge['rules'] = tuple(current_edge.get('rules', ())) + (NUMBER_CONTROL_FEEDBACK,)


# D-049/D-050 preserve supplier reply provenance and distinguish configuration from CDR identity.
QUEUE_COUNTER_FEEDBACK = "D-049 / SRC-079（user_relayed_supplier_feedback）：telEnterCount（String）为队列来电接听数，telAnswerCount（String）为进入队列来电数。保留供应商原字段名与原值，不交换计数或自行重算接听率；CF-14已关闭。本次不新增原生队列报表UI，也不改变本地话单聚合口径。"
SEAT_IDENTITY_FEEDBACK = "D-050 / SRC-080（user_relayed_supplier_feedback）：坐席按主键物理删除；工号只在当前仍存在的坐席中唯一。重建同工号为新坐席，生成新id/createTime，旧技能、队列成员、绑定电话清除。当前身份与本地配置不可仅凭相同cno自动继承；本次不迁移历史数据。"
SEAT_HISTORY_FEEDBACK = "D-050 / SRC-080：供应商话单只记cno、不记坐席主键；删除不清除历史话单，按cno查询或报表会合并新旧通话。仅凭话单不能精确拆分同工号的新旧坐席身份，不将旧记录改写归属新坐席。"
for current_view in VIEWS:
    for current_node in current_view['nodes']:
        additions = []
        if current_node['id'] in {'reports-native','reports-summary'}:
            additions.append(('D-049', 'SRC-079', QUEUE_COUNTER_FEEDBACK))
        if current_node['id'] in {'platform-context','platform-resources','adapter-resources','alicti-seat','platform-seat-phone-config'}:
            additions.append(('D-050', 'SRC-080', SEAT_IDENTITY_FEEDBACK))
        if current_node['id'] in {'platform-context','platform-records','platform-reports','adapter-cdr','reports-cdr','reports-facts','reports-native','reports-summary'}:
            additions.append(('D-050', 'SRC-080', SEAT_HISTORY_FEEDBACK))
        for decision, source, rule in additions:
            previous = current_node.get('decisionId')
            current_node['relatedDecisionIds'] = list(dict.fromkeys(current_node.get('relatedDecisionIds', []) + ([previous] if previous and previous != decision else [])))
            current_node['decisionId'] = decision
            current_node['sourceRefs'] = list(dict.fromkeys(current_node.get('sourceRefs', []) + [source]))
            current_node['sourceType'] = 'user_relayed_supplier_feedback'
            current_node['rules'] = tuple(current_node.get('rules', ())) + (rule,)
    for current_edge in current_view['edges']:
        if current_edge['id'] in {'platform-edge-mapping','platform-edge-metrics','reports-edge-cdr-facts','reports-edge-native-summary'}:
            previous = current_edge.get('decisionId')
            current_edge['relatedDecisionIds'] = list(dict.fromkeys(current_edge.get('relatedDecisionIds', []) + ([previous] if previous and previous != 'D-050' else [])))
            current_edge['decisionId'] = 'D-050'
            current_edge['sourceRefs'] = list(dict.fromkeys(current_edge.get('sourceRefs', []) + ['SRC-080']))
            current_edge['sourceType'] = 'user_relayed_supplier_feedback'
            current_edge['rules'] = tuple(current_edge.get('rules', ())) + (SEAT_HISTORY_FEEDBACK,)



# D-051/D-052: supplier replies close seat batch semantics and partially clarify connection recovery.
SEAT_BATCH_FEEDBACK = 'D-051 / SRC-081（2026-09-20，user_relayed_supplier_feedback）：success为主记录建成数，other为其中技能绑定失败子集，不与success相加；fail与success互斥。cnos含全部已建成工号（含other），申请工号区间减去cnos为未建成工号。未传skillIds时other=0；对cnos逐项queryAgentSkill，缺少目标skillId可定位other，查询本身不证明主记录新建。'
SEAT_WRITE_FEEDBACK = 'D-051 / SRC-081：创建结果未知时，agent/query按原cnos读取id/createTime，可使用startTime/endTime；新id且createTime处于本次请求窗口才证实本次主记录。agent/get与queryCnoAndName只证存在，queryAgentSkill只证技能。查询证据不足继续未知，不自动重放写入。CF-08已关闭，不意味着生产接口已联调。'
CONNECTION_RECONNECT_FEEDBACK = 'D-052 / SRC-082（2026-09-20，user_relayed_supplier_feedback）：breakLine的code=-1为连接断开，code=0为重连成功；SDK自动最多20次重连，每次回调，超过需重新登录。平台不另建重连循环、不按回调次数推断耗尽；sipDisconnected为无参软电话中断通知，坐席需重新登录。'
CONNECTION_BOUNDARY_FEEDBACK = 'D-052：breakLine code=0仅证明信令重连，不证明媒体可用或原通话恢复。事件绑定当前有效会话，旧会话事件不影响新登录；保留通话、草稿和未知操作保护。原型待通话及记录处理完成后可由本人主动重登，成功暂停接听并需明确恢复；这一保护不等于官方要求所有信令恢复均强制重登。CF-11仍保留跨设备互斥、异常退出清理、媒体就绪与最终状态核验，以及setOffline回执矛盾。'
for current_view in VIEWS:
    for current_item in current_view['nodes'] + current_view['edges']:
        item_id = current_item['id']
        additions = []
        if item_id in {'platform-context','platform-resources','platform-config-records','adapter-resources','alicti-seat','platform-edge-mapping','adapter-edge-signed-resources'}:
            additions += [('D-051','SRC-081',SEAT_BATCH_FEEDBACK),('D-051','SRC-081',SEAT_WRITE_FEEDBACK)]
        if item_id in {'overview-browser','overview-cti','platform-workbench','platform-seat-runtime','adapter-sdk','adapter-seat-commands','adapter-seat-receipts','alicti-phone','alicti-agent-operations','overview-edge-sdk','adapter-edge-sdk-seat-commands','platform-edge-workbench-runtime','alicti-edge-phone-events'}:
            additions += [('D-052','SRC-082',CONNECTION_RECONNECT_FEEDBACK),('D-052','SRC-082',CONNECTION_BOUNDARY_FEEDBACK)]
        for decision, source, rule in additions:
            previous = current_item.get('decisionId')
            current_item['relatedDecisionIds'] = list(dict.fromkeys(current_item.get('relatedDecisionIds', []) + ([previous] if previous and previous != decision else [])))
            current_item['decisionId'] = decision
            current_item['sourceRefs'] = list(dict.fromkeys(current_item.get('sourceRefs', []) + [source]))
            current_item['sourceType'] = 'user_relayed_supplier_feedback'
            current_item['rules'] = tuple(current_item.get('rules', ())) + (rule,)


# D-053: late recognition is a patch on the original predictive CDR.
NUMBER_RECOGNITION_FEEDBACK = 'D-053 / SRC-083（2026-09-20）：预测外呼话单sipCauseAsyncUpdateFlag=1表示号码识别结果已异步写回本通sipCause，0表示同步；不是通话状态、等待中或识别必成功标志。识别依据电话提示音，可能无法识别；彩铃等场景可能补偿识别，约延迟1–2分钟，仅为经验范围，不是固定完成时限。迟到结果按账号及原通话键补充原sipCause，保留原始值和来源，不新增通话、不由本地触发重呼。 CF-13当前剩余范围按D-054仅保留自动外呼准确识别字段及编码对应。'
for current_view in VIEWS:
    for current_item in current_view['nodes'] + current_view['edges']:
        if any(term in (current_item.get('id','')) for term in ['cdr','report','call-data']):
            previous = current_item.get('decisionId')
            current_item['relatedDecisionIds'] = list(dict.fromkeys(current_item.get('relatedDecisionIds', []) + ([previous] if previous and previous != 'D-053' else [])))
            current_item['decisionId'] = 'D-053'
            current_item['sourceRefs'] = list(dict.fromkeys(current_item.get('sourceRefs', []) + ['SRC-083']))
            current_item['sourceType'] = 'user_relayed_supplier_feedback'
            current_item['rules'] = tuple(current_item.get('rules', ())) + (NUMBER_RECOGNITION_FEEDBACK,)


# D-054: inbound answer status is independent of optional agent-leg recognition.
INBOUND_ANSWER_FEEDBACK = 'D-054 / SRC-084：呼入号码识别一般针对被呼叫的坐席绑定手机号，软电话大概率识别不到，并非绝对不支持。本项目按API-319响应status（人工接听、人工未接听、系统应答、系统未应答）展示接听结果；查询statuses数字1–4与响应值分开。识别只保留为可选补充，不用于判断来电客户号码状态或接听，不把坐席手机号未接识别成客户空号/停机；缺失识别不阻断呼入记录和报表。status缺失、非法或与时间证据冲突仍按原规则核对。sipCauseAsyncUpdateFlag只适用于预测话单；CF-13仅余自动外呼准确识别字段及编码对应。'
for current_view in VIEWS:
    for current_item in current_view['nodes'] + current_view['edges']:
        if 'API-319' in current_item.get('refs', []) or current_item.get('id') in {'platform-records','platform-reports','reports-facts','reports-summary','reports-detail'}:
            previous = current_item.get('decisionId')
            current_item['relatedDecisionIds'] = list(dict.fromkeys(current_item.get('relatedDecisionIds', []) + ([previous] if previous and previous != 'D-054' else [])))
            current_item['decisionId'] = 'D-054'
            current_item['sourceRefs'] = list(dict.fromkeys(current_item.get('sourceRefs', []) + ['SRC-084']))
            current_item['sourceType'] = 'user_relayed_supplier_feedback'
            current_item['rules'] = tuple(current_item.get('rules', ())) + (INBOUND_ANSWER_FEEDBACK,)


# 2026-09-20 daily alignment: author-owned logical views, not frozen source facts.
DAILY_VERSION = '2026-09-29-multiple-caller-navigation-1'
DAILY_CONFIG_RULE = 'D-085：客户管理仅设业务分类菜单，同页维护分类和独立字段库；取消业务模板。分类在 enterpriseId + tenantId 内以有序fields数组直接引用稳定fieldId，每项包含enabled、required，数组位置决定顺序。分类可零字段，线索分类须直接含六项预置统计字段；不同分类可共用字段定义但各自配置显示与必填。导入采用启用分类，通话按分类字段加载；草稿可空，正式保存校验。原型不迁移旧模板。字段/选项选填businessKey仅作本地外部映射，不替代内部ID、不发送AliCti。'
DAILY_WRAP_RULE = '正式记录保存成功且业务phase=idle后自动unpause；成功才ready。失败保留已存业务可重试，未知先核对不重放，确认ready且无未完成通话和连接异常后解除保护。'
DAILY_PHONE_RULE = '分机在系统管理的独立分机管理中创建或导入，坐席只选择本企业本租户启用且未占用的type=2软电话；登录前再核对。目录type=2与login.bindType=3分别解释，不以工号推算分机。'
DAILY_TOOLBAR_RULE = '顶部电话工具条统一登录/退出、置忙/置闲、拨号、接听、静音、挂断及延长整理，并直接显示工作模式下拉（D-071）；右侧非模态记录面板支持边通话边填写。切页收起保留草稿；本轮不提供拒接或内部呼叫。'
DAILY_REPLACE = {
    '坐席与技能组':'坐席与技能','技能组管理':'技能管理','技能组页面':'技能页面','新建技能组':'新建技能','技能组列表':'技能列表',
    '保存业务不自动ready；完成整理保持暂停，显式恢复成功才接待。':'保存业务成功后自动unpause，匹配回执成功才ready；电话失败不回滚业务。',
    'plannedStoreName 为选填文本':'plannedStoreName 为文本，默认选填且可配置必填',
    '人工外呼外显号码与技能选择解耦，按当前账号、租户授权、启停和预览用途过滤。':'人工外呼不手选技能和外显号码，平台按当前账号、租户授权、本地及供应商启停、完整号码和预览用途自动选号。',
    '六项选填资料':'当前业务分类客户信息','六项业务资料':'业务分类关联字段','六项选填业务字段':'业务分类关联字段','六项选填字段':'业务分类关联字段',
    'completeWrapup是本方编排，采用pause；成功保持paused，用户显式unpause成功才ready。':DAILY_WRAP_RULE,
    '配置和技能修改先下线。':'分机改配、技能等级修改、技能移除及正式提交须下线；在线仅追加新技能时保存待提交，由管理员下线后手动提交。',
    '不推导额外分机创建接口。':'分机创建与目录维护另按exten接口；登录只使用经核验的受控选择。',
    '普通电话/分机在设备接听；本地演示请求标记不代表真实工具条联调完成。':'本项目固定软电话，通过sipLink请求接听；本地演示不代表真实工具条联调完成。',
    '设备接听 · 边通话边记录':'工具条接听 · 边通话边记录',
    '事件匹配 · sipLink · 设备分支':'事件匹配 · sipLink · 软电话',
    '软电话请求及普通设备接听分开':'本项目采用软电话请求接听',
}
def daily_text(value):
    if isinstance(value,str):
        for old,new in DAILY_REPLACE.items():value=value.replace(old,new)
        return value
    if isinstance(value,tuple):return tuple(daily_text(x) for x in value)
    if isinstance(value,list):return [daily_text(x) for x in value]
    if isinstance(value,dict):return {k:daily_text(v) for k,v in value.items()}
    return value
for _view in VIEWS:
    for _items in ('nodes','edges'):_view[_items]=daily_text(_view[_items])
    for _node in _view['nodes']:
        _id=_node['id']
        # Retire presentation rules, retaining official historical source snapshots elsewhere.
        _node['rules']=tuple(rule for rule in _node.get('rules',()) if '超管维护服务类型' not in rule)
        if _id=='platform-resources':
            _node.update(title='坐席 / 技能 / 号码资源',subtitle='分机目录独立 · 使用范围本地控制')
            _node['rules']+=('技能不再配置服务类型；新增坐席不填写联系手机号且可暂不分配技能。坐席主记录成功、技能写入失败时保留坐席并后续补配，不重复创建。',DAILY_PHONE_RULE)
        if _id=='platform-seat-phone-config':
            _node.update(title='坐席受控选择分机',subtitle='先建目录 · 下线配置 · 登录复查',role='SeatPhoneConfig从独立分机目录选择本租户可用软电话，不再允许在坐席里任意输入分机。',rules=(DAILY_PHONE_RULE,'保留字符串及前导零；可清空配置，缺失时不能登录。修改前核验下线、当前及跨标签会话占用、待确认操作；失败保留原值。','配置坐席分机为本地关联，不写agent/create或agent/update；资源创建/更新由独立exten适配负责，不把本地保存当成媒体注册成功。'))
        if _id in ('platform-seat-runtime','adapter-seat-commands','alicti-agent-operations'):
            _node['rules']+=(DAILY_PHONE_RULE,'登录不要求选择技能或外显号码；人工拨号前另查分机isOb/callPower与当前租户号码权限，不能拿上线成功代替外呼资格。')
        if _id in ('platform-workbench','platform-seat-business'):_node['rules']+=(DAILY_TOOLBAR_RULE,DAILY_CONFIG_RULE,DAILY_WRAP_RULE)
        if _id=='platform-workbench':
            _node.update(title='电话工具条与客户记录',subtitle='顶部话务控制 · 右侧填写')
            _node['rules']+=('人工拨号自动选择本租户有完整号码、授权及用途有效、本地与供应商均允许的外显号码；不再手选技能或号码。无可用号码提示管理员；预外呼/自动任务仍由任务配置选号。',)
        if _id in ('platform-business-info','reports-business'):
            _node['role']='通话中按业务分类动态填写客户信息，正式保存到本次通话及客户档案；档案按业务分类与业务单据分别展示。'
            _node['rules']+=(DAILY_CONFIG_RULE,'文本、多行、数字、单选、多选、日期、日期时间；默认选填。预置线索统计字段保留固定类型和统计含义，其他分类不能误归线索。')
            _node['subtitle']='当前分类字段 · 必填校验 · 按单据入档'
        if _id in ('platform-customers','platform-records','reports-leads'):_node['rules']+=(DAILY_CONFIG_RULE,)
        if _id=='platform-receiving':_node['rules']+=(DAILY_TOOLBAR_RULE,'呼入未分类时客服可以在记录中选择业务分类；预外呼从精确客户条目承接原分类。',DAILY_WRAP_RULE)
        if _id in ('platform-tasks','adapter-tasks','alicti-task'):
            _node['rules']+=('D-060：新预测任务autoComplete=0，名单耗尽暂停；自动外呼为1。再次预外呼保持原taskId，importTaskTel仅追加新批次，isRepeat=0、importTelAutoStart=0；原任务已结束不重开。',)
            _node['rules']+=('任务关联本租户可呼叫及禁呼时间条件；autoTaskType=1须选允许条件，autoTriggerTimeStrategy和timeStrategy以逗号连接ID，不能重复用于允许与禁止。草稿、模板、复制与启动/继续复检；原任务再次联系沿用现有条件，按需配置结束时间。','本方只维护配置和引用保护，不实现本地时间调度；实际执行由供应商任务处理。','任务向导的重呼配置未填完整时，仍可保存草稿、关闭或返回，保留已填和空值；下一步及确认创建时再严格校验必选呼叫状态、次数、间隔与计时依据，不因草稿未填全而阻断退出。')
    for _edge in _view['edges']:
        if _edge['id']=='platform-edge-phone-login':_edge['detail']=DAILY_PHONE_RULE+' 点击坐席登录即在同一面板选择工作模式0/4/5及登录状态，再直接提交login；每次普通登录都须重新选模式（D-072）。'
        if _edge['id']=='platform-edge-seat-runtime-business':_edge['detail']=DAILY_WRAP_RULE
        if _edge['id']=='reports-edge-business-leads':_edge['detail']='线索按完整编码；线索内置字段保持原聚合口径。其他业务分类和各业务单据信息独立展示，不能合并成线索。'
p['height']=3250
p['groups'].append(group('可维护业务字典与独立资源目录',30,3000,1130,215,'platform','当前配置 → 导入与通话；目录资源 → 登录与任务；权限和字段均区分本方与供应商'))
node(p,'business-categories','业务分类与字段库','业务分类单菜单 · 分类直接引用字段',60,3068,refs=(326,),role='CustomerBusiness在业务分类页面维护分类及独立字段定义；CustomerFollowup按分类直接引用的字段生成表单并校验保存。',ids=('enterpriseId','tenantId','businessType','category.fields[].fieldId','field.id','option.id','businessKey','required'),outputs=('导入业务类型选项','坐席记录表单','档案和通话详情展示'),rules=(DAILY_CONFIG_RULE,'字段支持七种类型及选项对象；分类字段引用维护显示及必填，数组位置决定顺序。预置线索字段与选项保持稳定内部ID、类型及统计语义。字段及选项businessKey可留空，填写后分别在本租户字段库与所属字段内唯一。','最终保存才校验，错误定位具体字段；未保存草稿不更新档案、报表或供应商。'))
node(p,'extension-directory','独立分机管理','创建 / 导入 / 配置 / 租户分配',445,3068,refs=('DOC-355',396,397,399,304),scope='供应商资源与本地授权',role='AliCtiExtensions提供软电话资源目录及租户分配，坐席只从受控目录选择；与外显号码管理分开。',ids=('enterpriseId','exten（String）','type=2','active','tenantId（本地）'),rules=(DAILY_PHONE_RULE,'exten/create、update、list、batchDelete分别处理新增、配置、查询和删除；本地tenantId不发送供应商，密码不持久保存且日志遮蔽。','检查坐席配置、在线锁和呼入引用；禁止使用中的分机被停用、删除或改配。isOb与callPower限制新外呼，已发起通话不据此改写终态。'))
node(p,'time-conditions','时间条件维护','星期 / 日期 · 可呼叫 / 禁呼',830,3068,refs=('DOC-356','DOC-359',400,401,402,311),scope='供应商配置与本地权限',role='AliCtiTimeConditions维护企业条件与本地租户可用范围，供任务和呼入规则关联。',ids=('id','tenantIds（本地）','autoTaskType','autoTriggerTimeStrategy','timeStrategy'),rules=('D-061：优先级由用户手工必填正整数，新增不自动分配；同enterpriseId内校验唯一，编辑回填现值。名称企业内唯一；星期/固定日期、连续/间隔及起止时间按接口。update按id不提交name，不提供启停或使用位置字段。','租户管理员维护本租户条件，超管维护授权账号范围；不再配置同账号多租户共享。运行/暂停任务引用不能编辑；任务、草稿或呼入有效引用不能删除；引用核对失败保留原条件。','任务用逗号连接ID，呼入ruleTimeProperty用分号。原型不实现时间调度器。'))
edge(p,'category-records','business-categories','business-info','动态表单与保存',[(60,3122),(22,3122),(22,1340),(595,1340),(595,1288)],210,2990,refs=(326,),detail=DAILY_CONFIG_RULE+' 正式值同步通话详情和按业务/单据分组的客户档案。')
edge(p,'directory-selection','extension-directory','seat-phone-config','受控分机候选',[(595,3068),(595,2980),(210,2980),(210,2898)],415,2966,refs=('DOC-355',304),detail=DAILY_PHONE_RULE)
edge(p,'condition-task','time-conditions','tasks','允许 / 禁呼条件',[(1130,3122),(1188,3122),(1188,490),(740,490),(740,473)],1080,3000,refs=('DOC-356',311),detail='任务字段映射和启动/继续时复检当前条件；本方租户权限不作为供应商参数。')
a['height']=2740
a['groups'].append(group('分机和时间条件资源适配',30,2490,1130,205,'platform','公开参数与本地租户使用权限分开'))
node(a,'extension-api','分机资源适配','exten 查询 / 新增 / 修改 / 删除',60,2555,refs=('DOC-355',396,397,399),role='适配exten/list、create、update、batchDelete，保留String分机及值域；登录将受控分机映射bindTel。',rules=('固定项目软电话type=2，创建密码仅进入必要请求；不存储明文、不返回到浏览器日志。','tenantId归属是本方本地字段；配置/删除前本地引用及独占检查不等于供应商幂等保证。'))
node(a,'time-api','时间条件与任务适配','enterpriseTime · task/create',445,2555,refs=('DOC-356','DOC-359',400,401,402,311),role='维护enterpriseTime/create/update/delete/list；任务适配把选中ID转换为允许和禁止字段。',rules=('D-061：create提交手工维护的必填正整数priority，同enterpriseId内唯一；update以id定位，不传name，未传priority的局部更新保留旧值。本地租户范围不发供应商。','任务逗号、呼入分号各自适配，不补造启停和使用位置字段。'))
node(a,'business-schema','客户字段本地校验','CustomerBusiness / CustomerFollowup',830,2555,refs=(326,),role='动态字典及必填校验属于本地业务层，不新增AliCti请求参数。',rules=(DAILY_CONFIG_RULE,'最终保存失败保留草稿和话后保护；成功后自动置闲与业务保存分别处理。'))
edge(a,'extensions-guard','guard','extension-api','授权后适配资源',[(420,164),(18,164),(18,2470),(210,2470),(210,2555)],210,2455,refs=('DOC-355',326),detail='当前企业与租户权限先校验；exten/list是目录来源之一，不替代本地租户授权。')
edge(a,'time-task','time-api','tasks','任务条件参数',[(595,2555),(770,2555),(770,540),(595,540),(595,493)],690,2470,refs=('DOC-356',311),detail='允许/禁呼参数写入任务创建；不实现自建调度。')
t['height']=2710
t['groups'].append(group('公开资源配置能力',30,2460,1130,205,'documented','能力关系不代表供应商内部部署或原型真实调用'))
node(t,'extensions','分机资源接口','exten/list · create · update · batchDelete',60,2525,refs=('DOC-355',396,397,399),status='documented',scope='公开接口能力',role='公开分机目录及维护接口；本项目采用软电话type=2。',rules=('坐席上线用bindTel引用分机，login.bindType=3属于另一枚举。','本方唯一业务租户归属不改变供应商企业账号模型。'))
node(t,'enterprise-time','时间条件接口','enterpriseTime 增改删查',445,2525,refs=('DOC-356','DOC-359',400,401,402),status='documented',scope='公开接口能力',role='企业时间条件独立配置，任务与呼入路由按各自字段引用。',rules=('任务autoTriggerTimeStrategy/timeStrategy逗号连接ID，呼入ruleTimeProperty使用分号。','priority按接口要求配置；手工必填及跨租户唯一校验由本方执行。本方引用保护不是供应商返回的使用位置字段。'))
edge(t,'extension-login','extensions','agent-operations','分机用于登录绑定',[(210,2525),(18,2525),(18,2190),(210,2190),(210,2113)],210,2430,refs=(304,'DOC-355'),detail='login.bindTel选已开通分机，配置目录与当前会话分别核验。')
edge(t,'time-task-ref','enterprise-time','task','任务按条件执行',[(595,2525),(780,2525),(780,785),(595,785),(595,773)],715,2430,refs=(311,'DOC-356'),detail='接口配置与执行效果分开验收；图中不推断供应商内部调度拓扑。')


# 2026-09-21 UI fields: revise existing logical responsibilities, without new entities.
UI_CUSTOMER_RULE = 'D-063 / SRC-093：客户列表不固定显示线索/意向列；详情按当前业务分类和单据展示字段。导入与分配记录只读，不嵌套查看批次；批次维护从独立菜单进入。档案证据不足显示结果未知，不改底层状态与识别编码。'
UI_TASK_LIST_RULE = 'D-064 / SRC-094：任务列表不展示内部配置名、版本或后续重呼。retryStrategy是规则，finishRetryFlag/telRetryRound只描述单条话单；不能据此推断任务后续安排，原任务待再次联系保留。'
UI_TASK_SETTINGS_RULE = 'D-073 / D-075：预外呼与自动外呼的创建确认、当前任务设置和查看管理共用本任务保存的名称、描述、供应商业务标签及通用配置；通话详情关联摘要只读。有原供应商taskId、权限有效、未结束且无待核对结果时，任务中心可见编辑名称、描述和业务标签等已采用且API-404列明的字段；只提交实际修改，DOC-334回查成功后更新当前配置与planSnapshot，并将编辑前设置副本写入taskSettingHistory。失败/未知保留原配置和输入，不回写已发生通话与客户记录。任务级语音流程名称优先本任务冻结快照，既有customerTimeout缺失显示未记录，新建默认30秒不反填历史。type、callGroupType、名单/排重和固定外显号不可改；自动任务不提交预测专用字段。API-404的ivrId/ivrName行与仅type=1生效章节冲突，已建type=2 IVR只读并列CF-17待供应商确认。运行中生效与省略字段语义待联调，复制新草稿仍可用。'
UI_CDR_RULE = 'D-066 / SRC-096：列表、详情、任务内通话共用CloudCallRecords.display与AliCtiReportFacts，核验API-317/318/319/362类型、账号及显式供应商通话标识。接口来源对象存在时，raw或字段缺失、不合法或身份冲突不借本地接通/结束标签或时长补值；没有来源对象的纯本地演示仍可显示本地时间、工号和时长，不作为供应商事实。真实0秒保留，秒值只转换一次，按实际开始时间筛选。'
UI_CALL_TIMES = '自动外呼显示客户接听时长，预测分别显示双方通话与客户接听时长；呼入分开系统应答、首次人工接听与首次进出队列。工号为String，实际队列只读qno/firstCallQno；cnoFlow/qnoFlow保留供应商值，不能以技能代替实际队列。'
UI_CALL_TASK = '关联原任务须账号、租户、通话类型、本地与供应商taskId一致；只有供应商ID时要求唯一匹配。冲突不改绑且不开放再次联系。关联任务设置在详细信息中折叠只读，使用原任务摘要；业务联系轮次与供应商重试轮次、最终呼叫标记分开。'
UI_IVR_FACTS = '本通语音流程仅取话单ivrName/ivrId，不从任务所选流程推断。当前详情不展示虚构IVR版本、节点或本地补齐话单操作；公开ivrFlow/query能力不等于本通已取得执行节点。'
for _view in VIEWS:
    for _node in _view['nodes']:
        _id=_node['id']
        if _id in ('platform-customers','platform-business-info','reports-business','reports-detail'):
            _node['rules']+= (UI_CUSTOMER_RULE,)
        if _id in ('platform-tasks','adapter-tasks'):
            _node['rules']+= (UI_TASK_LIST_RULE,UI_TASK_SETTINGS_RULE)
        if _id in ('platform-records','adapter-cdr','reports-facts','reports-detail'):
            _node['rules']+= (UI_CDR_RULE,UI_CALL_TIMES,UI_CALL_TASK,UI_IVR_FACTS)
            _node['refs']=list(dict.fromkeys(_node['refs']+['API-317','API-318','API-319','API-362']))
        if _id=='platform-records':
            _node['subtitle']='四类通话 · 原任务设置 · 录音文本'
            _node['role']='统一呈现分类话单事实、客户业务信息及明确关联的原任务只读设置；录音和RASR分别展示。'
        if _id=='adapter-cdr':
            _node['subtitle']='人工 / 预测 / 自动 / 呼入'
            _node['role']='分别解释四类话单的客户与坐席接听、时间和时长，保留原值并校验来源；共用解析供列表与详情读取。'
        if _id in ('adapter-ivr','alicti-ivr'):
            _node['rules']+=(UI_IVR_FACTS,)
        if _id=='platform-repeat-contact':
            _node['rules']+=(UI_CALL_TASK,'D-065：原任务再次联系沿用本任务保存/冻结设置，不引用当前共享模板。')
    for _edge in _view['edges']:
        if _edge['id']=='platform-edge-result':
            _edge['detail']=UI_CALL_TASK
            _edge['refs']=list(dict.fromkeys(_edge['refs']+['API-362']))
        if _edge['id']=='alicti-edge-task-cdr':
            _edge['label']='任务与分类话单关联'
            _edge['detail']='预测API-318与自动API-362按明确taskId读取本条话单，轮次和最终标记不代表后续安排；平台还核对账号租户及类型。'
            _edge['refs']=list(dict.fromkeys(_edge['refs']+['API-362']))
        if _edge['id']=='alicti-edge-ivr-record':
            _edge['detail']='ivrFlow/query是公开的单次执行节点查询能力；当前通话详情仅呈现已取得的话单语音字段，不展示虚构节点、版本或假定供应商内部服务调用。'
        if _edge['id']=='reports-edge-lead-detail':_edge['detail']+=' '+UI_CUSTOMER_RULE


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
    # Current field review overlays the normalized published API index.
    review = json.loads((PUBLIC / "docs/field-alignment.json").read_text())
    source_map = {r["id"]: r for r in review["sources"]}
    for sid in ("DOC-342", "DOC-343", "DOC-344", "DOC-346", "DOC-347", "DOC-348", "DOC-349", "API-350", "API-351", "API-352", "API-353", "API-354", "DOC-355", "DOC-356", "DOC-357", "DOC-358", "DOC-359") + tuple("API-"+str(i) for i in range(360,369)) + tuple("DOC-"+str(i) for i in range(369,377)) + tuple("API-"+str(i) for i in range(377,395)) + ("DOC-395",) + tuple("API-"+str(i) for i in range(396,405)):
        source=source_map[sid]
        apis[sid]=dict(id=sid,name=source["name"],endpoint=source.get("endpoint"),status="dictionary" if sid in ["DOC-347","DOC-358","DOC-359"] or sid.startswith("DOC-37") or sid=="DOC-369" else "documented",sources=[source["url"]],notes=[])
    apis["API-321"].update(name="ASR查询（本期不采用）",notes=["D-015：本期统一rasrEvent/query，原ASR文档仅留作原始资料，不作为当前文本路径。"])
    for key, item in apis.items():
        current = [r for r in review["mappings"] if key in r["sourceIds"]]
        if current:
            item["notes"] = [r["label"] + "：" + r["rule"] + (" " + r["action"] if r["status"] == "待确认" else "") for r in current]
    apis["API-324"].update(name="资源操作核验归类", endpoint="agent/delete · agent/batchCreate · agent/query · skill/create · enterpriseHotline/batchUpdateNumber", status="partial", sources=[source_map[k]["url"] for k in ("DOC-328", "DOC-329", "DOC-330", "DOC-332", "DOC-341", "DOC-342", "DOC-343", "DOC-344", "DOC-345")], notes=["坐席删除和技能增改查已有文档，支持明确标记的本地模拟；真实资源列为接入准备。", "D-046 / SRC-076（承接D-026号码查询）：listPage只读查询已有号码；NumberGrant唯一业务租户归属是平台本地权限，号码不绑定技能组或坐席，可直接保存。status/外显修改另用官方接口，号码池不等于技能组。新资源开通由供应商办理；条件匹配与归属见CF-10；D-048 / SRC-078已确认停用后的选号与在途边界，供应商账号解绑需求取消并改为本地使用开关。"])
    apis["API-325"].update(name="任务操作核验归类", endpoint="task/start · task/get", status="partial", sources=[source_map[k]["url"] for k in ("DOC-333", "DOC-334")], notes=["启动和任务信息查询已有文档，返回 data.taskProperty。", "status：0初始、1运行中、2暂停、3结束。D-017用户转述阿里反馈：继续先get确认2再start，并回查状态；结束不重启。写入受理不等于状态已变化，D-021：结束后不再发起后续首次呼叫或重呼；D-047 / SRC-077用户转述供应商确认：暂停或结束不影响已发起通话，正常通话和正常话单按既有链路归集；未发起呼叫停止。此为供应商答复澄清，不是官网改版或实际联调结果。"])
    apis["API-324"]["notes"] += [SEAT_IDENTITY_FEEDBACK, SEAT_HISTORY_FEEDBACK, SEAT_BATCH_FEEDBACK, SEAT_WRITE_FEEDBACK]
    apis["API-368"]["notes"].append(QUEUE_COUNTER_FEEDBACK)
    apis["API-303"]["notes"] += [CONNECTION_RECONNECT_FEEDBACK, CONNECTION_BOUNDARY_FEEDBACK]
    apis["API-305"].update(name="座席通话操作", endpoint="CTILink.Session 通话控制")
    apis["API-403"]["notes"] = ["exten/delete为差异对照，不用于本期删除操作；本期采用batchDelete的String extens，删除后通过list回查，保护前导零及当前引用。"]
    return apis


SVG_STYLE = '''.bp-group{fill:#f5f8ff;stroke:#dce6f5;stroke-width:1.4}.bp-group--documented{fill:#f4faf8;stroke:#d7eae2}.bp-group--neutral{fill:#f8fafc;stroke:#e2e8f0}.bp-group-title{font:600 19px "PingFang SC","Microsoft YaHei",sans-serif;fill:#34445c}.bp-group-note{font:13px "PingFang SC","Microsoft YaHei",sans-serif;fill:#728097}.bp-node-box{fill:#fff;stroke:#b9cce8;stroke-width:1.5}.bp-node--documented .bp-node-box{stroke:#aacfc0}.bp-node--pending .bp-node-box{stroke:#d3a656;stroke-dasharray:6 4}.bp-node-accent{fill:#3e70bc}.bp-node--documented .bp-node-accent{fill:#39876a}.bp-node--pending .bp-node-accent{fill:#b88224}.bp-node-title{font:600 18px "PingFang SC","Microsoft YaHei",sans-serif;fill:#192b42}.bp-node-subtitle{font:14px "PingFang SC","Microsoft YaHei",sans-serif;fill:#5c6c81}.bp-node-scope{font:12px "PingFang SC","Microsoft YaHei",sans-serif;fill:#6e7f94}.bp-node-ref{font:11px "SFMono-Regular",Consolas,monospace;fill:#738096}.bp-edge-path{fill:none;stroke:#7497c5;stroke-width:2}.bp-edge--documented .bp-edge-path{stroke:#499279}.bp-edge--pending .bp-edge-path{stroke:#ba872f;stroke-dasharray:7 5}.bp-edge-hit{fill:none;stroke:transparent;stroke-width:18}.bp-edge-label-box{fill:#fff;stroke:#e5eaf1;stroke-width:.7}.bp-edge-label{font:13px "PingFang SC","Microsoft YaHei",sans-serif;fill:#42618a}.bp-edge--documented .bp-edge-label{fill:#367c61}.bp-edge--pending .bp-edge-label{fill:#9b6a18}.bp-node,.bp-edge{cursor:pointer}.bp-node.is-selected .bp-node-box,.bp-node:focus .bp-node-box{stroke:#245cc9;stroke-width:3}.bp-edge.is-selected .bp-edge-path,.bp-edge:focus .bp-edge-path{stroke-width:3.5}.bp-node.is-dim,.bp-edge.is-dim{opacity:.15}.bp-node.is-related .bp-node-box{stroke-width:2.7}.bp-node:focus,.bp-edge:focus{outline:none}.bp-svg-title{font:600 20px "PingFang SC","Microsoft YaHei",sans-serif;fill:#223b58}.bp-svg-footer{font:13px "PingFang SC","Microsoft YaHei",sans-serif;fill:#677991}'''


def text(x, y, content, cls):
    lines = str(content).split('\n')
    rendered = ESC(lines[0]) if len(lines) == 1 else ''.join(
        f'<tspan x="{x}" y="{y + index * 18}">{ESC(line)}</tspan>' for index, line in enumerate(lines))
    return f'<text x="{x}" y="{y}" class="{cls}">{rendered}</text>'


def label_lines(content, width, font_size):
    """Conservative SVG wrapping; retain full labels without clipping nodes."""
    result = []
    for paragraph in str(content).split('\n'):
        line, used = '', 0
        for character in paragraph:
            advance = font_size if ord(character) > 127 else font_size * .62
            if line and used + advance > width:
                result.append(line.rstrip())
                line, used = '', 0
            line += character
            used += advance
        result.append(line.rstrip())
    return result


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
        title_lines = label_lines(n["title"], w-36, 18)
        subtitle_lines = label_lines(n["subtitle"], w-36, 14)
        subtitle_y = y+28+len(title_lines)*22+3
        assert subtitle_y+(len(subtitle_lines)-1)*18 <= y+h-30, "Label needs a taller node: " + n["id"]
        parts.append(text(x+18, y+28, '\n'.join(title_lines), "bp-node-title"))
        parts.append(text(x+18, subtitle_y, '\n'.join(subtitle_lines), "bp-node-subtitle"))
        parts.append(text(x+18, y+h-15, n["scope"], "bp-node-scope"))
        parts.append(text(x+w-15, y+h-15, refs, "bp-node-ref").replace('class="bp-node-ref"', 'class="bp-node-ref" text-anchor="end"'))
        parts.append('</g>')
    if v["id"] in ("adapter", "alicti"):
        footer = "对外契约：工具条 / 软电话 · 服务端 API · HTTP / WS 事件 · 分类话单 · 录音 / RASR · 字段字典" if v["id"] == "adapter" else "文档有依据 ≠ 联调完成。供应商内部服务、进程、数据库及部署拓扑未核实。"
        parts.append(text(40, v["height"]-28, footer, "bp-svg-footer"))
    parts.append('</svg>')
    return "\n".join(parts)


def api_table(apis):
    rows = []
    for api in apis.values():
        status = api["status"]
        tone = "pending" if status == "missing" else "platform" if status == "not_required" else "documented"
        label = {"missing": "待确认", "not_required": "平台职责", "partial": "有文档 · 边界待确认", "dictionary": "官方字段字典", "documented":"文档有依据"}[status]
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


# D-068 current responsibility statements are applied after prior increments.
for current_view in VIEWS:
    for current_node in current_view['nodes']:
        if current_node['id'] in ['overview-shared','platform-context','platform-account-scope','platform-account-history','platform-resources','platform-number-grants','platform-number-references','platform-queue-config','platform-extension-directory','platform-time-conditions','reports-leads','reports-scope']:
            current_node['relatedDecisionIds'] = list(dict.fromkeys(current_node.get('relatedDecisionIds', []) + ([current_node['decisionId']] if current_node.get('decisionId') else [])))
            current_node['decisionId'] = 'D-068'
            current_node['sourceRefs'] = list(dict.fromkeys(current_node.get('sourceRefs', []) + ['SRC-098']))
            current_node['sourceType'] = 'user_product_confirmation'
        if current_node['id'] in ['overview-shared','platform-context','platform-account-scope','platform-account-history']:
            current_node['rules'] = tuple(current_node.get('rules', ())) + ('每个enterpriseId只关联0或1个总部/门店业务租户，内置超级租户不计入；每个业务租户仍只关联一个AliCti账号。tenantId与enterpriseId分别保留，平台登录账号仍可按成员授权加入多个租户。总部7522240与门店7522241属于同一品牌，但资源和业务数据按各自账号及租户隔离。',)
        if current_node['id'] == 'platform-resources':
            current_node['subtitle'] = '账号号码 · 自动归属 · 独立配置'
            current_node['role'] = '号码导入时默认归属当前账号唯一有效业务租户，不再提供号码租户分配或多选授权；账号无有效业务租户时阻止导入。号码详情只读展示归属和使用情况，不嵌套呼入规则、外显用途或原始属性入口。号码状态、方向及外显资格仍按已存事实校验，呼入规则在独立菜单管理。'
            current_node['role'] += ' D-081：租户管理员在号码池管理中按本租户enterpriseId查询、新增、更新和删除AliCti号码池；任务只选本租户池名。'
            current_node['relatedDecisionIds'] = list(dict.fromkeys(current_node.get('relatedDecisionIds', []) + ['D-081']))
            current_node['sourceRefs'] = list(dict.fromkeys(current_node.get('sourceRefs', []) + ['SRC-109']))
            current_node['rules'] = ('每个enterpriseId只关联0或1个总部/门店业务租户，内置超级租户不计入；每个业务租户仍只关联一个AliCti账号。tenantId与enterpriseId分别保留，平台登录账号仍可按成员授权加入多个租户。总部7522240与门店7522241属于同一品牌，但资源和业务数据按各自账号及租户隔离。','号码不与技能或坐席绑定；管理员分机、技能、队列、时间与呼入权限继续独立校验。')
        if current_node['id'] == 'reports-leads':
            current_node['rules'] = tuple(current_node.get('rules', ())) + ('当前报表仅统计所选enterpriseId的唯一业务租户，不新增跨账号汇总。若后续经明确授权建设同品牌跨账号线索汇总，业务唯一键应为brandId+完整线索编码；当前不得按品牌名合并或加载未授权账号数据。',)


# D-070: account directory cardinality differs from single task selection.
for current_view in VIEWS:
    for current_node in current_view['nodes']:
        if current_node['id'] in ['platform-tasks','platform-account-scope','platform-account-history','adapter-tasks','alicti-tasks','platform-number-references']:
            current_node['relatedDecisionIds'] = list(dict.fromkeys(current_node.get('relatedDecisionIds', []) + ['D-069','D-070','D-078','D-081']))
            current_node['sourceRefs'] = list(dict.fromkeys(current_node.get('sourceRefs', []) + ['SRC-099','SRC-100','SRC-108','SRC-109']))
            current_node['rules'] = tuple(current_node.get('rules', ())) + ('超级管理员（SUPER）在既有AliCti账号编辑的“外显导航”区维护callerNavigations:[{name,customerClidsGroup}]，可登记多个已存在AliCti导航；每行名称和标识必填，标识同账号唯一，不设置本地数量上限，不新增菜单或实体模块。目录是本地登记，移除条目不等于远端删除或停用。旧instance.customerClidsGroup单值仅在读取时兼容为一条，不自动重写；没有目录不推造候选。创建、草稿及复制的导航候选仅取当前账号目录，下拉显式单选一个，无自动首项默认。新提交前复核所选标识仍在目录，被移除须重选；名称改名不阻断，旧草稿有标识但无名称时只从匹配候选补名称。切换到另一个导航清空原clidPoolList，保留customerTimeout。现有官方材料只说明单次任务传一个导航标识，未确认同enterpriseId的导航数量上限或账号内查询接口；本地多行登记是D-070产品修正，不冒充供应商答复。目录移除不等于远端删除或停用，CF-15继续未决。','D-078：任务创建与更新无任务级指定号码字段。导航字段在接口中可选；两类新建任务按本原型产品规则必选当前账号已有外显导航，task/create传customerClidsCategory=5、单个customerClidsGroup、可选clidPoolList及customerTimeout；API-312的taskTelList[].clid仅逐客户显式提供时可选，不从任务或批次设置推导。','任务保存导航名称及标识、号码池和等待时间快照；callerNavigationName仅作本地名称快照、不传API，task/create仍只传单个String customerClidsGroup。账号目录改名或移除不回填已保存任务快照，也不覆写草稿及复制已有的名称；已创建任务和原任务再次联系保留快照及原taskId。创建确认、任务设置及复制采用一致字段；草稿和复制在新提交时复核当前账号目录，已移除标识须重选。通话详情仅展示话单实际外显号码，不能用池名称或本地挑选结果冒充供应商选号事实。','号码池名称来自当前租户关联enterpriseId的AliCti hybridGroup/list；租户管理员可通过hybridGroup/create、delete、update维护本租户号码池，不把本地号码列表当成池。任务从本租户列表选池名，priority手动选填整数且数值越小越优先，留空省略。空池、同优先级选号和运行任务变更生效时点仍待CF-15确认，不承诺失败自动切池。本地停用仅能约束本地直接选号，不能保证AliCti外显导航号码池排除该号码；全局阻断须经供应商停用或排除机制核验。既有通话正常继续；此边界不增加异常入口。',)


# D-071 records the adopted online mode switch; D-072 supersedes its earlier two-step login flow.
for current_view in VIEWS:
    for current_node in current_view['nodes']:
        if current_node['id'] in ['platform-workbench','platform-seat-runtime','adapter-seat-commands','alicti-agent-operations','platform-incoming']:
            current_node['relatedDecisionIds'] = list(dict.fromkeys(current_node.get('relatedDecisionIds', []) + ['D-071','D-072']))
            current_node['sourceRefs'] = list(dict.fromkeys(current_node.get('sourceRefs', []) + ['SRC-101','SRC-102']))
            current_node['rules'] = tuple(current_node.get('rules', ())) + ('D-072：每次普通坐席登录均直接打开一次性登录面板；工作模式初始“请选择”，本人必须选0预览与预测同时、4预览外呼或5预测外呼；登录状态默认置闲，可改置忙并选填原因。点击“登录”直接提交login，取消不发请求，失败保留本次输入供重试；不先保存登录设置或沿用上次模式。断线重登是独立流程，沿用当前会话模式及暂停状态。','D-071：登录后工具条直接显示工作模式下拉，在线即时调用CTILink.Agent.changeWorkingMode；置忙可切，通话、振铃、话后整理及未知结果期间拒绝。登录置忙后禁用主动预览外呼，须先置闲；模式4不接受预测分配，模式5禁用预览外呼。呼入与模式关系仍见CF-16。',)


# D-082 separates offline read-only monitoring from online queue and management actions.
for current_view in VIEWS:
    for current_node in current_view['nodes']:
        key = current_node['id']
        if key not in ['platform-workbench','platform-seat-monitor','adapter-seat-monitoring','alicti-agent-queue-status']:
            continue
        current_node['relatedDecisionIds'] = list(dict.fromkeys(current_node.get('relatedDecisionIds', []) + ([current_node['decisionId']] if current_node.get('decisionId') else []) + ['D-080']))
        current_node['decisionId'] = 'D-082'
        current_node['sourceRefs'] = list(dict.fromkeys(current_node.get('sourceRefs', []) + ['SRC-110']))
        current_node['sourceType'] = 'user_product_requirement_and_existing_interface_review'
        if key == 'platform-workbench':
            current_node['rules'] = tuple(current_node.get('rules', ())) + ('坐席工作台一级页签为“外呼坐席／班长监控”；班长监控内二级页签为“监控概览／坐席事件日志”。本租户ADMIN未关联本人坐席或未上线仍可只读查看今日已结束外呼统计、授权坐席当前状态与已有事件日志；切换页签保留本人通话和记录草稿。',)
        elif key == 'platform-seat-monitor':
            current_node['subtitle'] = '离线只读 · 上线后队列管理'
            current_node['role'] = '本租户ADMIN在班长监控查看今日已结束外呼统计、只读坐席状态与已有事件日志，本人可尚未关联坐席；队列实时状态和管理置忙、置闲、下线仅在关联有效班长坐席、本人上线且供应商班长资格与本租户队列授权均确认后开放。'
            current_node['refs'] = list(dict.fromkeys(current_node.get('refs', []) + ['DOC-344']))
            current_node['rules'] = tuple(current_node.get('rules', ())) + ('未关联本人坐席或未上线仍可查看概览只读区和事件日志；逐席状态按enterpriseId和原cno查询agentStatus/get，平台再过滤tenantId授权。今日统计及二级页签布局属于本方产品规则。', '事件日志沿用D-080的来源和观察时间口径；快照差异不是供应商推送，原型最多15条。')
        elif key == 'adapter-seat-monitoring':
            current_node['subtitle'] = 'agentStatus/get · queueStatus'
            current_node['role'] = '只读坐席状态逐工号使用DOC-344 agentStatus/get并按本租户范围过滤，后端控制查询频率；队列实时状态另核关联有效班长坐席、本人上线、供应商班长权限和授权qnos后调用queueStatus。'
            current_node['refs'] = list(dict.fromkeys(current_node.get('refs', []) + ['DOC-344']))
            current_node['rules'] = tuple(current_node.get('rules', ())) + ('agentStatus/get只返回单坐席状态快照，不能用来证明队列实况或管理资格；队列和Monitor写操作维持独立上线门禁。',)
        else:
            current_node['refs'] = list(dict.fromkeys(current_node.get('refs', []) + ['DOC-344']))
            current_node['rules'] = tuple(current_node.get('rules', ())) + ('DOC-344 agentStatus/get按enterpriseId和逐个cno查询坐席状态，不含班长登录会话；queueStatus与Monitor管理仍是班长上线后的独立工具条能力。',)


# D-086 restores multiple offline-provisioned navigations per enterpriseId.
# The single-default assumption in D-083 remains in history only.
for current_view in VIEWS:
    for current_node in current_view['nodes']:
        if current_node['id'] not in ['platform-tasks','platform-account-scope','platform-account-history','adapter-tasks','alicti-tasks','platform-number-references']:
            continue
        current_node['relatedDecisionIds'] = list(dict.fromkeys(current_node.get('relatedDecisionIds', []) + ['D-086']))
        current_node['sourceRefs'] = list(dict.fromkeys(current_node.get('sourceRefs', []) + ['SRC-114']))
        current_node['decisionId'] = 'D-086'
        current_node['rules'] = tuple(rule for rule in current_node.get('rules', ()) if not any(old in rule for old in ('每enterpriseId统一一个', '每enterpriseId固定一个', 'D-083默认导航变更保护', '账号和任务界面不维护或选择多个导航'))) + (
            '同一enterpriseId可登记多个AliCti线下提供的外显导航，一个导航可配合多个号码池。两类任务创建时从当前账号目录显式选择一个，提交customerClidsCategory=5及单个customerClidsGroup，可选多个clidPoolList。API-311/API-404只证明单次任务字段；导航查询、标识有效性与号码池选号见CF-15联调。',
            '预测任务minAvailableAgentCount默认10、范围1–10，任务内可用座席数低于阈值自动暂停。只有autoStart=1且确因座席不足暂停，人数恢复达阈值时自动启动；手工暂停、号码停用保护暂停、结束不恢复。自动外呼不配置该字段。API-311/API-404仅证明阈值、定时字段和不足自动暂停；恢复行为为用户转述，CF-18待真实联调。',
            '已建任务保留原customerClidsGroup及号码池快照。启动/继续时如所选导航已从当前账号目录移除，先阻断，再从原任务编辑以API-404 task/update提交新标识，经DOC-334 task/get回查同一taskId及可读值后启动。任务中心座席人数变化入口只作本地演示，不读取实时人数或执行供应商任务操作。',
        )


def build():
    apis = api_data()
    data = dict(version="1.39", date="2026-09-29", deliveryVersion=DAILY_VERSION, statuses=STATUSES, views=VIEWS, apis=apis)
    # The portable index must carry the same adopted facts as the visible blueprint.
    INDEX.write_text(json.dumps(dict(scope="current_reviewed_display_facts", date=data["date"], interfaces=[
        dict(id=item["id"], name=item["name"], endpoint=item.get("endpoint"), verification_status=item["status"],
             source_refs=item["sources"], notes=item["notes"]) for item in apis.values()
    ]), ensure_ascii=False, indent=2)+'\n')
    node_ids = [n["id"] for v in VIEWS for n in v["nodes"]]
    assert len(node_ids) == len(set(node_ids))
    for v in VIEWS:
        ids = {n["id"] for n in v["nodes"]}
        for item in v["nodes"] + v["edges"]:
            assert all(r in apis for r in item["refs"])
            for field in ("inputs", "outputs", "rules", "identifiers", "refs"):
                assert isinstance(item.get(field, ()), (list, tuple)), (item["id"], field)
        for e in v["edges"]:
            assert e["source"] in ids and e["target"] in ids
    nav = ''.join(f'<a class="bp-view-link{" is-active" if i==0 else ""}" href="#{v["id"]}" data-view-link="{v["id"]}"'+(' aria-current="page"' if i==0 else '')+f'><span class="bp-view-number">0{i+1}</span><span>{v["short"]}<small>{len(v["nodes"])} 个模块 · {len(v["edges"])} 条关系</small></span></a>' for i, v in enumerate(VIEWS))
    panels = ''.join(f'<section class="bp-panel" data-view-panel="{v["id"]}" aria-label="{v["name"]}"'+(' hidden' if i else '')+'>'+svg(v)+'</section>' for i,v in enumerate(VIEWS))
    content = '''<!doctype html>
<html lang="zh-CN">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="delivery-version" content="2026-09-21-ui-field-alignment-1"><title>系统架构蓝图 · AliCti 云外呼平台</title><link rel="stylesheet" href="../assets/css/system-blueprint.css?v=20260911-1"></head>
<body>
<div class="bp-layout" data-related-systems data-related-systems-state="ready">
 <aside class="bp-sidebar" aria-label="系统架构蓝图目录">
  <div class="bp-brand"><span class="bp-brand-icon" aria-hidden="true">▦</span><div>系统架构蓝图<small>AliCti 云外呼平台</small></div></div>
  <p class="bp-nav-label">架构视图</p><nav>__NAV__<a class="bp-view-link" href="#interfaces" data-view-link="interfaces"><span class="bp-view-number">06</span><span>接口对照<small>__APICOUNT__ 项接口与字段依据</small></span></a></nav>
  <div class="bp-side-note"><strong>阅读方式</strong><p>点击模块或连线，查看职责、关系和关联接口。</p><p>箭头表示流向；双向箭头表示请求与结果往返。</p></div>
  <a class="bp-doc-link" href="../docs/field-alignment.html">查看字段级对齐清单 ↗</a>
  <a class="bp-doc-link" href="../docs/interaction.html#A">查看规则附表 ↗</a>
  <div class="bp-sidebar-footer">逻辑架构 · __DISPLAYDATE__<br>平台设计与接口事实分开标识</div>
 </aside>
 <main class="bp-main">
  <header class="bp-header"><div><p class="bp-eyebrow">关联关系 / 架构说明</p><h1 id="bp-view-title">系统架构总览</h1><p id="bp-view-subtitle">从业务来源到呼叫执行，查看系统边界与数据流向。</p></div><span class="bp-version">蓝图 v1.36</span></header>
  <div class="bp-scope-note"><span aria-hidden="true">i</span><p>当前为逻辑设计与接口能力视图。<strong>文档有依据</strong>仅表示存在接口说明，边界仍需确认；<strong>平台职责</strong>表示本方设计，原型采用本地模拟。</p></div>
  <section class="bp-workspace" id="bp-workspace" aria-label="架构探索区">
   <div class="bp-toolbar"><div class="bp-search-wrap"><label class="bp-sr-only" for="bp-search">搜索模块或接口</label><span aria-hidden="true">⌕</span><input id="bp-search" type="search" placeholder="搜索模块、关系或接口编号" autocomplete="off" aria-controls="bp-search-results"><button type="button" id="bp-clear-search" aria-label="清除搜索" hidden>×</button><div id="bp-search-results" class="bp-search-results" aria-label="搜索结果" hidden></div></div><label class="bp-pending-toggle"><input id="bp-pending" type="checkbox">突出待确认</label><div class="bp-tools" aria-label="图形工具"><button type="button" data-action="zoom-out" aria-label="缩小">−</button><output id="bp-zoom" aria-live="polite">100%</output><button type="button" data-action="zoom-in" aria-label="放大">＋</button><button type="button" data-action="fit">适合宽度</button><button type="button" data-action="fullscreen">全屏</button><button type="button" data-action="export">导出 SVG</button></div></div>
   <div class="bp-legend"><span><i class="bp-dot bp-dot--platform"></i>平台职责</span><span><i class="bp-dot bp-dot--documented"></i>文档有依据</span><span><i class="bp-dot bp-dot--pending"></i>待确认</span><span class="bp-legend-hint" id="bp-view-count">11 个模块 · 10 条关系</span></div>
   <div class="bp-canvas" id="bp-canvas" tabindex="0" aria-label="可滚动架构图">__PANELS__<section class="bp-panel bp-interface-panel" data-view-panel="interfaces" aria-label="接口对照" hidden><div class="bp-table-intro"><strong>__APICOUNT__ 项接口与字段依据</strong><p>API-301–323 有文档依据但保留边界待确认；API-324–325 为资源及任务核验归类，已有端点与待确认项分别列明，API-326 为平台职责，API-327 为字段字典。编号是项目索引，不都是可调用端点。</p><p id="bp-table-count">显示 __APICOUNT__ 项</p></div><table class="bp-api-table"><thead><tr><th scope="col">接口 / 依据</th><th scope="col">路径与来源</th><th scope="col">关联模块</th><th scope="col">具体规则与缺口</th></tr></thead><tbody>__APIS__</tbody></table><p id="bp-table-empty" class="bp-table-empty" hidden>没有匹配的接口依据，请调整搜索条件。</p></section></div>
   <aside class="bp-inspector" id="bp-inspector" aria-label="模块与关系详情" hidden><div class="bp-inspector-top"><span id="bp-detail-kind">模块详情</span><button type="button" id="bp-close-detail" aria-label="关闭详情">×</button></div><div id="bp-detail-content"></div></aside>
   <div class="bp-toast" id="bp-toast" role="status" hidden></div>
  </section>
  <footer class="bp-footer"><span id="bp-footer-text">点击模块查看职责与接口；点击连线查看流向与确认边界。</span><button type="button" data-action="reset">重置视图</button></footer>
 </main>
</div>
<script src="blueprint-data.js?v=20260923-task-seat-threshold-default-navigation-1"></script><script src="blueprint.js?v=20260919-regression-alignment1"></script><script src="../js/delivery-nav.js?v=20260919-navigation2"></script>
</body></html>
'''.replace('__DISPLAYDATE__', data['date'].replace('-', '.')).replace('__APICOUNT__', str(len(apis))).replace('__NAV__', nav).replace('__PANELS__', panels).replace('__APIS__', api_table(apis))
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "index.html").write_text(content)
    (OUT / "blueprint-data.js").write_text('window.SystemBlueprintData = ' + json.dumps(data, ensure_ascii=False, indent=2) + ';\n')
    print(json.dumps({"views":len(VIEWS),"nodes":len(node_ids),"edges":sum(len(v['edges']) for v in VIEWS),"references":len(apis)},ensure_ascii=False))


if __name__ == "__main__":
    build()
