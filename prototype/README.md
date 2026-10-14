# 云呼叫中心 v1.1.0 原型工作区

当前状态（2026-10-11）：用户已批准新 G3，04 S9 完成，17 功能／62 验收／21 规则／5 页面正式输入已验真导入。02 S8 全局验证已通过：17 功能／62 验收／66 项回归映射对齐，四个核心视图在 1440／1920／2560 三种桌面宽度下通过。结果见[验证记录](memory/verification-log.md)及[本轮全局证据](memory/verification-evidence/frozen-S8-global-verification-20261011.json)，阶段状态见[工作流](config/workflow.json)。业务／运营评审仍待确认，05 尚未进入。本轮沿用唯一工作目录，无新增原型目录、功能说明文档、标注或正式产品交付快照。

## 本次更新

- 应用接入：应用列表、新增、详情、修改和精确删除。填写应用名称及必要可访问租户，保存后生成 appId 和本地演示 appSecret；详情按需显示和复制。修改不重置密钥，删除后该应用的演示凭证及已发业务身份失效。仅超管管理，移除日常页面的身份交换参数及多余技术说明。
- 预外呼：列表工具栏、任务行、任务详情和导入记录区常驻“导入客户”。按已锁来源打开 DCC 演示或手工入口；历史未启动任务可追加客户并保留原名单/批次，运行中等不可导入状态保留禁用入口与原因。
- DCC：取消平台每日状态查询、每日优先级衰减与强制旧值继承；每次业务导入采用本次 priority。isNewBatch 缺省false，已有主时新子挂最近主，无主自动首主；true另开主。每有效新行新record/batch，技术重试按requestId返回原root和编号，不再次提交。
- 缺陷修复：新 CSV 文本使旧预览失效，无效预览不能提交旧数据；提交处理中锁定编辑，落账前复核文本、预览及身份／任务，变化时取消提交并恢复编辑。切换删除目标／样例清旧成功提示；未可信纯 SIP 独立待核，不阻止随后准确可信更新。统一导航的当前图页带审阅版本，普通刷新不会沿用旧流程图缓存。切换导入来源时保留既有供应商去重设置；已退出的换主叫字段仅保留来源定义，不宣称平台已实现该能力。

## 本地启动

服务已运行时直接打开 [原型入口](http://127.0.0.1:18802/prototype/index.html)。从本目录启动：

```sh
python3 -m http.server 18802 --directory .. --bind 127.0.0.1
```

超管从“系统管理 / 应用接入管理”进入应用列表；从“云呼叫 / 预外呼”使用常驻导入客户。新建任务先选择DCC接口或手工来源，创建后锁定。DCC样例包含首次主批、后续子批、另开独立主批的可点击演示。

本原型采用HTML、CSS、原生JavaScript和既有PlatformUI，本地数据均为合成演示，不发真实请求、生成生产密钥或拨号。API-001/010保持missing，API-002/003/004/006保持partial，API-005退出每日衰减用途为not_required；供应商真实排重、重复接收和在途行为仍待核实。

## 接口信息读取

官方接口统一从 [LLM Wiki 接口索引](references/index.html)按 API-/DOC- 编号读取；原型运行不依赖 Wiki 服务。在本目录运行 `python3 documentation/interface_sources.py read API-311` 按需取文，`python3 documentation/interface_sources.py verify` 校验 active 版本、inventory 与文件哈希。外部知识库根目录可由 `LLM_WIKI_ROOT` 或 `--wiki-root` 重定位，见[来源说明](references/README.md)。

`references/`保留轻量来源映射、供应商回复原件和用户截图；整套旧官方原文已归档。新查询结果须先经需求分析核验与冻结，原型仅消费冻结事实，不直接覆盖当前业务规则或历史批准。

## 审阅与正式基线边界

[本次决策](docs/decisions.md)和[开放事项](memory/open-items.md)记录当前正式输入与独立产品评审边界。[验证记录](memory/verification-log.md)仅记录本轮新鲜验证；[前轮回归证据](memory/verification-evidence/requirement-prototype-reconciliation-20261011.json)作为历史保留，不用于替代本轮正式验证。新只读字段视图为 FLD-001～096。

[当前 04 正式需求](../需求/1.1.0/README.md)已补齐应用独立业务操作、场景／时序／页面与常驻导入验收，通过 G3 和 S9。审批核验快照 `7f304bb7edec…`、标准交付快照 `3fb3c1cfd4db…`、输入基线 `676248563fbe9e8e…` 分别绑定审批内容、正式版本交付及载荷；当前 manifest 为 `6d42db2b593b28e48c174e76218db68283c1076c17397bdb2736c6f5056aa94d`。

[业务流程图](flowcharts/business-process.html)、[时序交互图](flowcharts/sequence-interaction.html)已由本轮正式输入适配器发布，原样复用冻结 SVG 并绑定 manifest；当前五份事实由新包确定性物化，启动计划与 CLAUDE 已绑定新审批。旧只读导入仍保留原路径，旧计划／CLAUDE／事实及旧 product-input 原件保存在 [导入前归档](../归档/历史资料/2026-10-11-目录整理/G3新基线导入前控制与审阅记录-20261011.zip)。[当前产品评审输入](product-input.json)基于新事实及实际实现重建，业务／运营批准保持待确认。当前图页 URL 使用 frozen1 缓存版本；历史只读图页不受影响。

唯一原型工作目录为 `prototype/`；需求与开发输出按版本分目录。1.0只读历史与目录整理前的完整归档保留。本轮未生成05开发包、报价或发布站点。
